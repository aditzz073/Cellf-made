"""Feature impact estimation using top-100 RF biomarker importances."""

import logging
from typing import Optional

import numpy as np

from services.model_loader import get_model_bundle

logger = logging.getLogger(__name__)

_model, _scaler, _top100, _is_ready = get_model_bundle()


def _get_importance_weights() -> np.ndarray:
    """Return the RF feature importances for the top-100 probes (indexed same order)."""
    if _model is None or not hasattr(_model, "feature_importances_"):
        return np.ones(len(_top100), dtype=float)

    scaler_features = list(getattr(_scaler, "feature_names_in_", []))
    if not scaler_features:
        return np.ones(len(_top100), dtype=float)

    all_importances = _model.feature_importances_
    weights = np.array(
        [all_importances[scaler_features.index(p)] if p in scaler_features else 0.0
         for p in _top100],
        dtype=float,
    )
    return weights


def get_gene_impacts(
    gene_values: Optional[dict[str, float]],
    top_n: int = 20,
) -> list[dict]:
    """
    Compute ranked feature impacts for the top-100 biomarkers.

    Impact proxy:
        impact_i = importance_i × (x_i − mean_i) / scale_i

    Args:
        gene_values: Dict of {probe_id: expression_value}.
                     If None or model not ready, returns [].
        top_n:       How many top impacts to return (default 20).

    Returns:
        List of dicts sorted by |impact| descending:
          { gene, impact, expression, baseline }
    """
    if not _is_ready or _model is None or _scaler is None or not _top100:
        logger.warning("Model artifacts not ready - no feature impacts generated.")
        return []

    if gene_values is None:
        logger.warning("No feature payload supplied for explainability.")
        return []

    # Scaler statistics for the top-100 probes
    scaler_features = list(getattr(_scaler, "feature_names_in_", []))
    if scaler_features:
        indices  = [scaler_features.index(p) for p in _top100 if p in scaler_features]
        baseline = np.array(_scaler.mean_[indices],  dtype=float)
        scale    = np.array(_scaler.scale_[indices], dtype=float)
    else:
        baseline = np.zeros(len(_top100), dtype=float)
        scale    = np.ones(len(_top100),  dtype=float)

    safe_scale = np.where(scale == 0, 1.0, scale)
    weights    = _get_importance_weights()

    normalized_values = {str(k).strip().lower(): float(v) for k, v in gene_values.items()}
    x = np.array(
        [normalized_values.get(p.strip().lower(), float(baseline[i])) for i, p in enumerate(_top100)],
        dtype=float,
    )

    normalized_delta = (x - baseline) / safe_scale
    signed_impacts   = weights * normalized_delta

    results = [
        {
            "gene":       probe,
            "impact":     round(float(signed_impacts[i]), 6),
            "expression": round(float(x[i]), 6),
            "baseline":   round(float(baseline[i]), 6),
        }
        for i, probe in enumerate(_top100)
    ]

    results.sort(key=lambda r: abs(r["impact"]), reverse=True)
    return results[: max(1, top_n)]
