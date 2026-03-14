"""Explainability endpoints for ranked model features and heatmaps."""

import logging
from typing import Optional

from fastapi import APIRouter, HTTPException, Body
from pydantic import BaseModel

from services.explainability import get_gene_impacts
from services.heatmap_generator import generate_heatmap_image

logger = logging.getLogger(__name__)
router = APIRouter()

TOP_N_MAX = 100  # Hard cap - prevents callers from requesting all 24 840 features at once.


# ---------------------------------------------------------------------------
# Shared request model
# ---------------------------------------------------------------------------

class GenePayload(BaseModel):
    """Optional feature dictionary for POST explainability endpoints."""

    genes: Optional[dict[str, float]] = None
    features: Optional[dict[str, float]] = None

    model_config = {
        "json_schema_extra": {
            "example": {
                "features": {
                    "V1": 7.231,
                    "V2": -1.031,
                    "V3": 0.448,
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
    summary="Gene Feature Importances - Demo",
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
    return {"feature_importances": get_gene_impacts(None, top_n=TOP_N_MAX)}


@router.post(
    "/explain",
    tags=["Explainability"],
    summary="Gene Feature Importances - Patient-Specific",
)
async def explain(payload: Optional[GenePayload] = Body(default=None)):
    """
    Returns ranked gene-level feature importances for the supplied patient
    expression values.

    Impacts are adjusted based on the magnitude of expression deviation from
    the healthy reference baseline.
    """
    genes = None
    if payload:
        genes = payload.features if payload.features is not None else payload.genes
    return {"feature_importances": get_gene_impacts(genes, top_n=TOP_N_MAX)}


# ---------------------------------------------------------------------------
# /heatmap
# ---------------------------------------------------------------------------

@router.get(
    "/heatmap",
    tags=["Explainability"],
    summary="Expression Heatmap - Demo",
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
    summary="Expression Heatmap - Patient-Specific",
)
async def heatmap(payload: Optional[GenePayload] = Body(default=None)):
    """
    Generates a gene expression heatmap for the supplied patient values.

    The heatmap shows a side-by-side comparison of patient expression vs the
    healthy reference baseline.  Returns a base-64 encoded PNG image.
    """
    genes = None
    if payload:
        genes = payload.features if payload.features is not None else payload.genes
    try:
        img_b64 = generate_heatmap_image(genes)
    except Exception as exc:
        logger.error("Heatmap generation failed: %s", exc)
        raise HTTPException(
            status_code=500, detail=f"Heatmap generation failed: {exc}"
        ) from exc
    return {"image_base64": img_b64, "format": "png"}
