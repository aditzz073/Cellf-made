"""
routes/explain.py
-----------------
Endpoints:
  GET  /explain   — demo gene feature importances (no patient data required)
  POST /explain   — gene feature importances for supplied expression values
  GET  /heatmap   — demo expression heatmap
  POST /heatmap   — expression heatmap for supplied patient values
"""

import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel

from services.explainability import get_gene_impacts
from services.heatmap_generator import generate_heatmap_image

logger = logging.getLogger(__name__)
router = APIRouter()


# ---------------------------------------------------------------------------
# Shared request model
# ---------------------------------------------------------------------------

class GenePayload(BaseModel):
    """Optional gene expression dictionary for POST explainability endpoints."""

    genes: Optional[dict[str, float]] = None

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
# /explain
# ---------------------------------------------------------------------------

@router.get(
    "/explain",
    tags=["Explainability"],
    summary="Gene Feature Importances — Demo",
)
async def explain_demo():
    """
    Returns ranked gene-level feature importances using default demonstration values.

    Impact scores are signed: positive values indicate risk-increasing expression
    patterns; negative values indicate protective / immune-function markers.

    **Note:** This endpoint currently returns mock SHAP-inspired values.
    Replace `services/explainability.py` internals with a real SHAP explainer
    once the trained model is available.
    """
    return {"feature_importances": get_gene_impacts(None)}


@router.post(
    "/explain",
    tags=["Explainability"],
    summary="Gene Feature Importances — Patient-Specific",
)
async def explain(payload: Optional[GenePayload] = Body(default=None)):
    """
    Returns ranked gene-level feature importances for the supplied patient
    expression values.

    Impacts are adjusted based on the magnitude of expression deviation from
    the healthy reference baseline.
    """
    genes = payload.genes if (payload and payload.genes) else None
    return {"feature_importances": get_gene_impacts(genes)}


# ---------------------------------------------------------------------------
# /heatmap
# ---------------------------------------------------------------------------

@router.get(
    "/heatmap",
    tags=["Explainability"],
    summary="Expression Heatmap — Demo",
)
async def heatmap_demo():
    """
    Returns a demonstration heatmap comparing a pre-seeded sepsis patient profile
    against the healthy reference baseline.

    Response contains a base-64 encoded PNG image.
    """
    try:
        img_b64 = generate_heatmap_image(None)
    except Exception as exc:
        logger.error("Heatmap generation failed: %s", exc)
        raise HTTPException(
            status_code=500, detail=f"Heatmap generation failed: {exc}"
        ) from exc
    return {"image_base64": img_b64, "format": "png"}


@router.post(
    "/heatmap",
    tags=["Explainability"],
    summary="Expression Heatmap — Patient-Specific",
)
async def heatmap(payload: Optional[GenePayload] = Body(default=None)):
    """
    Generates a gene expression heatmap for the supplied patient values.

    The heatmap shows a side-by-side comparison of patient expression vs the
    healthy reference baseline.  Returns a base-64 encoded PNG image.
    """
    genes = payload.genes if (payload and payload.genes) else None
    try:
        img_b64 = generate_heatmap_image(genes)
    except Exception as exc:
        logger.error("Heatmap generation failed: %s", exc)
        raise HTTPException(
            status_code=500, detail=f"Heatmap generation failed: {exc}"
        ) from exc
    return {"image_base64": img_b64, "format": "png"}
