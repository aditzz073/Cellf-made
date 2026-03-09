"""
services/predictor.py
---------------------
Orchestrates model inference and risk classification.

Prediction flow:
  1. Accept gene expression dict from the route layer.
  2. If PlaceholderModel is active  → compute score via weighted formula.
  3. If trained model is loaded     → build feature vector, call predict_proba.
  4. Map continuous score to categorical risk level.
  5. Return a typed PredictionResult dict.
"""

import logging
from typing import TypedDict

import numpy as np

from services.model_loader import (
    load_model,
    PlaceholderModel,
    FEATURE_ORDER,
)

logger = logging.getLogger(__name__)

# Module-level singleton — loaded once at import time
_model, _is_real_model = load_model()


# ---------------------------------------------------------------------------
# Return type
# ---------------------------------------------------------------------------

class PredictionResult(TypedDict):
    risk_score: float
    risk_level: str       # "High" | "Moderate" | "Low"
    confidence: float
    model_type: str       # "trained" | "placeholder"
    genes_used: list[str]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _classify_risk(score: float) -> str:
    """Map a continuous [0, 1] risk score to a categorical level."""
    if score >= 0.70:
        return "High"
    if score >= 0.40:
        return "Moderate"
    return "Low"


def _margin_confidence(probabilities: np.ndarray) -> float:
    """
    Use the probability of the predicted class as a confidence estimate.

    For a binary classifier this is simply max(P(0), P(1)).
    """
    return float(round(float(np.max(probabilities)), 4))


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def run_prediction(gene_values: dict[str, float]) -> PredictionResult:
    """
    Run sepsis risk prediction from a gene expression dictionary.

    Args:
        gene_values: Mapping of gene symbol → log₂ expression value.
                     Missing genes default to 0.0.

    Returns:
        PredictionResult TypedDict.
    """
    if isinstance(_model, PlaceholderModel):
        risk_score = _model.score_from_genes(gene_values)
        # Placeholder confidence: loosely correlated with score magnitude
        confidence = round(0.60 + 0.32 * abs(risk_score - 0.50) * 2, 4)
        model_type = "placeholder"
    else:
        feature_vector = np.array(
            [gene_values.get(gene, 0.0) for gene in FEATURE_ORDER],
            dtype=np.float32,
        ).reshape(1, -1)
        proba = _model.predict_proba(feature_vector)[0]
        risk_score = float(proba[1])          # P(sepsis positive)
        confidence = _margin_confidence(proba)
        model_type = "trained"

    return PredictionResult(
        risk_score=round(risk_score, 4),
        risk_level=_classify_risk(risk_score),
        confidence=confidence,
        model_type=model_type,
        genes_used=sorted(gene_values.keys()),
    )
