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
from typing import Optional

import pandas as pd
from fastapi import APIRouter, File, UploadFile, HTTPException, Body
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, field_validator

from services.predictor import run_prediction
from services.explainability import get_gene_impacts
from services.heatmap_generator import generate_heatmap_image
from utils.validation import validate_dataframe

logger = logging.getLogger(__name__)

router = APIRouter()

# Ordered list of genes expected by the model / shown in the template
GENE_PANEL: list[str] = [
    "IL6", "TLR4", "HLA-DRA", "STAT3", "TNF",
    "CXCL8", "CD14", "MMP8", "LBP", "PCSK9",
]


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
async def predict(
    file: Optional[UploadFile] = File(
        default=None,
        description="CSV file (columns: Gene, Expression) uploaded as multipart/form-data.",
    ),
    payload: Optional[ManualInputPayload] = Body(default=None),
):
    """
    Run sepsis risk prediction from gene expression data.

    **Accepts (mutually exclusive):**
    - A **CSV file** upload (`multipart/form-data`, field name `file`) with
      columns `Gene` and `Expression`.
    - A **JSON body** with a `genes` dictionary mapping gene symbols to
      log₂ expression values.

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
    gene_values: dict[str, float] = {}

    if file is not None:
        # ── CSV branch ──────────────────────────────────────────────────────
        if not (file.filename or "").lower().endswith(".csv"):
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

    elif payload is not None:
        # ── JSON body branch ────────────────────────────────────────────────
        gene_values = payload.genes

    else:
        raise HTTPException(
            status_code=400,
            detail=(
                "No input provided.  Send either a CSV file upload "
                "(multipart/form-data) or a JSON body with a 'genes' key."
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
    }
