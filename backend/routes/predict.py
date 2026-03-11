"""
routes/predict.py
-----------------
Endpoints:
  GET  /template  — download the gene-expression CSV template
  POST /predict   — run sepsis risk prediction (CSV upload OR JSON body)

The POST /predict endpoint returns a single comprehensive response that
includes the prediction result, gene feature importances, and a base-64
encoded heatmap, so the frontend can update the entire results panel in
one round-trip.
"""

import io
import csv
import logging

import pandas as pd
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, field_validator

from config import GENE_PANEL
from services.predictor import run_prediction
from services.explainability import get_gene_impacts
from services.heatmap_generator import generate_heatmap_image
from utils.validation import validate_dataframe

logger = logging.getLogger(__name__)

router = APIRouter()


# ---------------------------------------------------------------------------
# Request / response models
# ---------------------------------------------------------------------------

class ManualInputPayload(BaseModel):
    """Payload model for manual gene-expression entry."""

    genes: dict[str, float]

    @field_validator("genes")
    @classmethod
    def genes_must_be_non_empty(cls, v: dict) -> dict:
        if not v:
            raise ValueError("genes dictionary must not be empty.")
        return v

    model_config = {
        "json_schema_extra": {
            "example": {
                "genes": {
                    "IL6": 8.2,
                    "TLR4": 6.1,
                    "HLA-DRA": 1.3,
                    "STAT3": 4.5,
                    "TNF": 7.8,
                    "CXCL8": 5.2,
                    "CD14": 3.9,
                    "MMP8": 6.4,
                    "LBP": 5.1,
                    "PCSK9": 2.3,
                }
            }
        }
    }


# ---------------------------------------------------------------------------
# GET /template
# ---------------------------------------------------------------------------

@router.get(
    "/template",
    tags=["Data Input"],
    summary="Download Gene-Expression CSV Template",
    response_description="CSV file with gene names pre-filled and expression values set to 0.",
)
async def download_template():
    """
    Download a pre-formatted CSV template for gene expression data entry.

    The returned file contains the required genes with placeholder expression
    values of 0.  Users should replace the values with log₂-transformed
    expression measurements from their assay before uploading via `/predict`.
    """
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Gene", "Expression"])
    for gene in GENE_PANEL:
        writer.writerow([gene, 0])
    output.seek(0)

    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8")),
        media_type="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=gene_expression_template.csv"
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
        "Comprehensive prediction envelope: risk score, level, confidence, "
        "gene feature importances, and a base-64 heatmap PNG."
    ),
)
async def predict(request: Request):
    """
    Run sepsis risk prediction from gene expression data.

    **Accepts (mutually exclusive — detected via Content-Type):**
    - `multipart/form-data` with a `file` field (CSV, columns: Gene · Expression).
    - `application/json` body: ``{"genes": {"IL6": 8.2, ...}}``

    **Returns:**
    ```json
    {
      "prediction": { "risk_score": 0.82, "risk_level": "High", "confidence": 0.91, "model_type": "placeholder" },
      "feature_importances": [ { "gene": "IL6", "impact": 0.24, ... }, ... ],
      "heatmap_base64": "<PNG encoded as base-64>",
      "genes": { "IL6": 8.2, ... }
    }
    ```
    """
    content_type = request.headers.get("content-type", "")
    gene_values: dict[str, float] = {}

    if "multipart/form-data" in content_type:
        # ── CSV file-upload branch ───────────────────────────────────────────
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
                detail="Invalid file type.  Only .csv files are accepted.",
            )
        try:
            contents = await file.read()
            df = pd.read_csv(io.BytesIO(contents))
        except Exception as exc:
            logger.error("CSV parse error: %s", exc)
            raise HTTPException(
                status_code=400, detail=f"Failed to parse CSV file: {exc}"
            ) from exc

        errors = validate_dataframe(df)
        if errors:
            raise HTTPException(
                status_code=422, detail={"validation_errors": errors}
            )

        df.columns = df.columns.str.strip()
        df["Gene"] = df["Gene"].astype(str).str.strip()
        gene_values = dict(
            zip(df["Gene"], pd.to_numeric(df["Expression"]).astype(float))
        )

    elif "application/json" in content_type:
        # ── JSON body branch ─────────────────────────────────────────────────
        try:
            body = await request.json()
        except Exception as exc:
            raise HTTPException(
                status_code=400, detail=f"Failed to parse JSON body: {exc}"
            ) from exc

        try:
            payload = ManualInputPayload(**body)
        except Exception as exc:
            raise HTTPException(
                status_code=422, detail=f"Invalid payload: {exc}"
            ) from exc

        gene_values = payload.genes

    else:
        raise HTTPException(
            status_code=400,
            detail=(
                "No input provided or unsupported Content-Type.  "
                "Send a CSV file as multipart/form-data or a JSON body "
                "(application/json) with a 'genes' key."
            ),
        )

    # ── Run prediction pipeline ─────────────────────────────────────────────
    prediction = run_prediction(gene_values)
    feature_importances = get_gene_impacts(gene_values)
    heatmap_b64 = generate_heatmap_image(gene_values)

    logger.info(
        "Prediction complete — risk_level=%s risk_score=%.4f genes=%d",
        prediction["risk_level"],
        prediction["risk_score"],
        len(gene_values),
    )

    return {
        "prediction": prediction,
        "feature_importances": feature_importances,
        "heatmap_base64": heatmap_b64,
        "genes": gene_values,
        "model_info": {
            "algorithm": "Weighted Linear Placeholder" if prediction.get("model_type") == "placeholder" else "Random Forest Classifier",
            "genes_used": len(GENE_PANEL),
            "dataset_source": "GEO Sepsis Dataset (GSE Cohorts)",
            "explainability": "Mock SHAP-inspired scores" if prediction.get("model_type") == "placeholder" else "SHAP TreeExplainer",
            "model_status": prediction.get("model_type", "placeholder"),
        },
    }
