"""
services/explainability.py
--------------------------
Provides gene-level feature importance scores.

Current implementation:  mock SHAP-inspired values that scale with the
magnitude of deviation from a healthy reference baseline.

SHAP integration guide
----------------------
Once the trained model is available, replace the body of get_gene_impacts()
with:

    import shap
    from services.model_loader import load_model, FEATURE_ORDER

    _model, _ = load_model()
    _explainer  = shap.TreeExplainer(_model)   # or shap.Explainer(_model)

    def get_gene_impacts(gene_values):
        X = np.array([gene_values.get(g, 0.0) for g in FEATURE_ORDER]).reshape(1, -1)
        shap_values = _explainer.shap_values(X)[1]  # class-1 (sepsis) SHAP values
        return [
            {"gene": g, "impact": float(s), "expression": gene_values.get(g, 0.0),
             "baseline": REFERENCE_BASELINE.get(g)}
            for g, s in sorted(zip(FEATURE_ORDER, shap_values), key=lambda t: abs(t[1]), reverse=True)
        ]
"""

import logging
import math
from typing import Optional

from config import REFERENCE_BASELINE

logger = logging.getLogger(__name__)

# Base directional weights:  positive → risk-increasing,  negative → protective
_BASE_IMPACTS: dict[str, float] = {
    "IL6":     +0.24,
    "TNF":     +0.20,
    "TLR4":    +0.18,
    "CXCL8":   +0.15,
    "MMP8":    +0.12,
    "LBP":     +0.09,
    "PCSK9":   +0.07,
    "HLA-DRA": -0.22,
    "STAT3":   -0.10,
    "CD14":    -0.06,
}


def get_gene_impacts(
    gene_values: Optional[dict[str, float]],
) -> list[dict]:
    """
    Compute gene-level feature importances relative to the reference baseline.

    Args:
        gene_values: Patient gene expression values.  If None, returns
                     demonstration values derived from the baseline.

    Returns:
        List of impact dicts sorted by |impact| descending, each containing:
          - gene:       Gene symbol
          - impact:     Signed impact score (positive = risk-increasing)
          - expression: Patient expression value (log₂)
          - baseline:   Reference baseline value (log₂)
    """
    if gene_values is None:
        # Demo values: simulate a high-risk patient
        demo_patient = {
            "IL6": 9.1, "TLR4": 6.8, "HLA-DRA": 1.2, "STAT3": 3.4,
            "TNF": 8.3, "CXCL8": 7.1, "CD14": 3.8, "MMP8": 6.9,
            "LBP": 5.8, "PCSK9": 2.4,
        }
        gene_values = demo_patient

    results: list[dict] = []
    for gene, base_impact in _BASE_IMPACTS.items():
        patient_expr = gene_values.get(gene, REFERENCE_BASELINE.get(gene, 0.0))
        baseline = REFERENCE_BASELINE.get(gene, 0.0)

        # Scale impact by fold-change relative to baseline (sigmoid-clamped)
        delta = patient_expr - baseline
        fold_change = delta / (abs(baseline) + 1e-6)
        adjusted_impact = base_impact * (1.0 + 0.5 * math.tanh(fold_change))

        results.append(
            {
                "gene": gene,
                "impact": round(adjusted_impact, 4),
                "expression": round(patient_expr, 3),
                "baseline": baseline,
            }
        )

    results.sort(key=lambda x: abs(x["impact"]), reverse=True)
    return results
