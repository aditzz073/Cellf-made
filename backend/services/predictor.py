"""Run sepsis prediction using the top-100 biomarker RF + scaler pipeline."""

import logging
from typing import TypedDict

import numpy as np
import pandas as pd

from services.model_loader import get_model_bundle

logger = logging.getLogger(__name__)

_model, _scaler, _top100, _is_ready = get_model_bundle()


# ---------------------------------------------------------------------------
# Return type
# ---------------------------------------------------------------------------

class PredictionResult(TypedDict):
    risk_score:    float
    risk_level:    str    # "High" | "Moderate" | "Low"
    confidence:    float
    model_type:    str
    features_used: int


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _classify_risk(score: float) -> str:
    if score >= 0.70:
        return "High"
    if score >= 0.40:
        return "Moderate"
    return "Low"


def _margin_confidence(probabilities: np.ndarray) -> float:
    return float(round(float(np.max(probabilities)), 4))


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def run_prediction(feature_values: dict[str, float]) -> PredictionResult:
    """
    Run sepsis risk prediction from a top-100 biomarker expression dict.

    Replicates the training-time logic:
        patient = patient.set_index("ProbeID").loc[top100_genes]
        scaled  = scaler.transform(patient)
        proba   = model.predict_proba(scaled)

    Args:
        feature_values: {probe_id: expression_value} for the top-100 probes.

    Returns:
        PredictionResult TypedDict.
    """
    if not _is_ready or _model is None or _scaler is None or not _top100:
        raise RuntimeError(
            "Model pipeline is not ready. Ensure sepsis_rf_model.pkl, "
            "sepsis_scaler.pkl, and top100_biomarkers.json are in backend/models/."
        )

    missing = [p for p in _top100 if p not in feature_values]
    if missing:
        raise ValueError(
            f"Missing {len(missing)} required biomarker probe(s) for prediction. "
            f"Examples: {', '.join(missing[:5])}"
        )

    # The RF was trained on ALL 54,675 probes.
    # Strategy: build a full-length zero vector, slot in the top-100 values
    # at their original column positions, scale the whole vector, predict.
    scaler_features = list(getattr(_scaler, "feature_names_in_", []))
    if not scaler_features:
        raise RuntimeError("Scaler has no feature_names_in_ — cannot reconstruct full vector.")

    # Build a reverse-lookup dict once (O(1) per probe)
    probe_to_idx = {name: i for i, name in enumerate(scaler_features)}

    n_features = len(scaler_features)
    full_raw   = np.zeros(n_features, dtype=np.float64)

    for probe in _top100:
        idx = probe_to_idx.get(probe)
        if idx is not None:
            full_raw[idx] = float(feature_values[probe])

    # Scale the full vector using the fitted scaler
    full_scaled = _scaler.transform(full_raw.reshape(1, -1))

    proba = _model.predict_proba(full_scaled)[0]
    positive_idx = 1 if len(proba) > 1 else 0
    risk_score = float(proba[positive_idx])
    confidence = _margin_confidence(proba)

    return PredictionResult(
        risk_score=round(risk_score, 4),
        risk_level=_classify_risk(risk_score),
        confidence=confidence,
        model_type="trained-rf+scaler",
        features_used=len(_top100),
    )
