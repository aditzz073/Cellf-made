"""Prediction endpoints - accepts long-format GEO CSV or JSON feature dict."""

import io
import csv
import logging

import pandas as pd
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, field_validator

from services.model_loader import get_top100_probes, is_model_ready
from services.predictor import run_prediction
from services.explainability import get_gene_impacts
from services.heatmap_generator import generate_heatmap_image
from utils.validation import validate_dataframe, extract_feature_values

logger = logging.getLogger(__name__)
router = APIRouter()


# ---------------------------------------------------------------------------
# Request model (JSON path)
# ---------------------------------------------------------------------------

class FeatureInputPayload(BaseModel):
    """JSON payload: top-100 probe expression values."""

    features: dict[str, float]

    @field_validator("features")
    @classmethod
    def features_must_be_non_empty(cls, v: dict) -> dict:
        if not v:
            raise ValueError("features dictionary must not be empty.")
        return v

    model_config = {
        "json_schema_extra": {
            "example": {
                "features": {
                    "226879_at": 7.231,
                    "205844_at": -1.031,
                    "227867_at": 0.448,
                }
            }
        }
    }


# ---------------------------------------------------------------------------
# GET /template  - long-format CSV download
# ---------------------------------------------------------------------------

@router.get(
    "/template",
    tags=["Data Input"],
    summary="Download GEO CSV Template",
    response_description="Long-format CSV template with ProbeID and a sample column.",
)
async def download_template():
    """
    Download a long-format (probe-per-row) template compatible with the
    trained scaler / model.

    Columns: ProbeID | Sample_001
    Rows   : one row per top-100 biomarker probe
    """
    top100 = get_top100_probes()
    if not is_model_ready() or not top100:
        raise HTTPException(
            status_code=503,
            detail=(
                "Model artifacts are not loaded. Place sepsis_rf_model.pkl, "
                "sepsis_scaler.pkl, and top100_biomarkers.json in backend/models/ "
                "and restart the backend."
            ),
        )

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ProbeID", "Sample_001"])
    for probe in top100:
        writer.writerow([probe, 0.0])
    output.seek(0)

    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8")),
        media_type="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=geo_top100_template.csv"
        },
    )


# ---------------------------------------------------------------------------
# POST /predict
# ---------------------------------------------------------------------------

@router.post(
    "/predict",
    tags=["Prediction"],
    summary="Run Sepsis Risk Prediction",
    response_description=(
        "Prediction response including risk score, ranked feature impacts, "
        "and feature heatmap PNG (base-64)."
    ),
)
async def predict(request: Request):
    """
    Run sepsis risk prediction from GEO top-100 biomarker expression data.

    **Accepts (multipart/form-data):**
    - `file`: long-format CSV with columns `ProbeID` and at least one sample column.

    **Accepts (application/json):**
    - `{"features": {"226879_at": 7.23, "205844_at": -1.03, ...}}`
      (must include all top-100 probe IDs)

    **Returns:**
    ```json
    {
      "prediction":          { "risk_score": 0.82, "risk_level": "High", ... },
      "feature_importances": [ { "gene": "226879_at", "impact": 0.14, ... }, ... ],
      "heatmap_base64":      "<PNG base-64>",
      "features":            { "226879_at": 7.23, ... },
      "model_info":          { ... }
    }
    ```
    """
    if not is_model_ready():
        raise HTTPException(
            status_code=503,
            detail=(
                "Model artifacts are unavailable. Place sepsis_rf_model.pkl, "
                "sepsis_scaler.pkl, and top100_biomarkers.json in backend/models/ "
                "and restart the backend."
            ),
        )

    content_type = request.headers.get("content-type", "")
    feature_values: dict[str, float] = {}

    # ------------------------------------------------------------------
    # CSV upload path
    # ------------------------------------------------------------------
    if "multipart/form-data" in content_type:
        form = await request.form()
        file = form.get("file")
        if file is None:
            raise HTTPException(
                status_code=400,
                detail="Multipart form received but no 'file' field found.",
            )
        if not (getattr(file, "filename", "") or "").lower().endswith(".csv"):
            raise HTTPException(
                status_code=400,
                detail="Invalid file type. Only .csv files are accepted.",
            )
        try:
            contents = await file.read()
            df = pd.read_csv(io.BytesIO(contents))
            # Normalise column names: treat "Expression" as the sample column
            if "Expression" in df.columns:
                df = df.rename(columns={"Expression": "Sample_001"})
        except Exception as exc:
            logger.error("CSV parse error: %s", exc)
            raise HTTPException(
                status_code=400, detail=f"Failed to parse CSV file: {exc}"
            ) from exc

        errors = validate_dataframe(df)
        if errors:
            raise HTTPException(status_code=422, detail={"validation_errors": errors})

        feature_values = extract_feature_values(df)

    # ------------------------------------------------------------------
    # JSON path
    # ------------------------------------------------------------------
    elif "application/json" in content_type:
        try:
            body = await request.json()
        except Exception as exc:
            raise HTTPException(
                status_code=400, detail=f"Failed to parse JSON body: {exc}"
            ) from exc

        try:
            payload = FeatureInputPayload(**body)
        except Exception as exc:
            raise HTTPException(
                status_code=422, detail=f"Invalid payload: {exc}"
            ) from exc

        feature_values = payload.features

    else:
        raise HTTPException(
            status_code=400,
            detail=(
                "No input provided or unsupported Content-Type. "
                "Send a long-format CSV via multipart/form-data or a JSON body "
                "(application/json) with a 'features' key."
            ),
        )

    # ------------------------------------------------------------------
    # Inference
    # ------------------------------------------------------------------
    try:
        prediction = run_prediction(feature_values)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    feature_importances = get_gene_impacts(feature_values, top_n=20)
    heatmap_b64 = generate_heatmap_image(feature_values, feature_importances)

    logger.info(
        "Prediction complete - risk_level=%s risk_score=%.4f probes=%d",
        prediction["risk_level"],
        prediction["risk_score"],
        len(feature_values),
    )

    return {
        "prediction": prediction,
        "feature_importances": feature_importances,
        "heatmap_base64": heatmap_b64,
        "features": feature_values,
        "model_info": {
            "algorithm": "Random Forest (200 trees) + StandardScaler",
            "top_biomarkers": len(get_top100_probes()),
            "dataset_source": "GEO Sepsis Dataset (Affymetrix microarray)",
            "explainability": "RF feature_importances × normalised expression delta",
            "model_status": prediction.get("model_type", "unknown"),
        },
    }
