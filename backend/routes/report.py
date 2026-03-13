"""
routes/report.py
----------------
Endpoint:
  POST /generate-report — generate and download a PDF clinical report
"""

import logging

from fastapi import APIRouter, HTTPException, Body
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, field_validator

from utils.pdf_generator import generate_report_pdf
from services.explainability import get_gene_impacts
from services.heatmap_generator import generate_heatmap_image

logger = logging.getLogger(__name__)
router = APIRouter()


# ---------------------------------------------------------------------------
# Request model
# ---------------------------------------------------------------------------

class ReportPayload(BaseModel):
    """Request body for PDF report generation."""

    patient_id: str = "ANONYMOUS"
    genes: dict[str, float]
    prediction: dict

    @field_validator("genes")
    @classmethod
    def genes_non_empty(cls, v: dict) -> dict:
        if not v:
            raise ValueError("genes must not be empty.")
        return v

    @field_validator("prediction")
    @classmethod
    def prediction_has_required_keys(cls, v: dict) -> dict:
        required = {"risk_score", "risk_level", "confidence"}
        missing = required - v.keys()
        if missing:
            raise ValueError(f"prediction is missing keys: {missing}")
        return v

    model_config = {
        "json_schema_extra": {
            "example": {
                "patient_id": "PT-00421",
                "genes": {
                    "V1": 7.231,
                    "V2": -1.031,
                    "V3": 0.448,
                    "V4": 5.102,
                },
                "prediction": {
                    "risk_score": 0.82,
                    "risk_level": "High",
                    "confidence": 0.91,
                    "model_type": "placeholder",
                },
            }
        }
    }


# ---------------------------------------------------------------------------
# POST /generate-report
# ---------------------------------------------------------------------------

@router.post(
    "/generate-report",
    tags=["Reports"],
    summary="Generate PDF Clinical Report",
    response_description="Downloadable PDF report file.",
)
async def generate_report(payload: ReportPayload = Body(...)):
    """
    Generate a comprehensive clinical-grade PDF report.

    The report includes:
    - Patient / sample metadata
    - Gene expression table with baseline comparison
    - Top influencing genes (feature importances)
    - Gene expression heatmap image
    - Risk assessment summary with clinical interpretation

    Returns the PDF as a downloadable file attachment.
    """
    try:
        feature_importances = get_gene_impacts(payload.genes)
        heatmap_b64 = generate_heatmap_image(payload.genes)
        pdf_buffer = generate_report_pdf(
            patient_id=payload.patient_id,
            genes=payload.genes,
            prediction=payload.prediction,
            feature_importances=feature_importances,
            heatmap_b64=heatmap_b64,
        )
    except Exception as exc:
        logger.error("Report generation failed: %s", exc)
        raise HTTPException(
            status_code=500, detail=f"Report generation failed: {exc}"
        ) from exc

    safe_id = payload.patient_id.replace(" ", "_").replace("/", "-")
    filename = f"sepsis_report_{safe_id}.pdf"

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
