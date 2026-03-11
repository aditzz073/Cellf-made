"""
services/heatmap_generator.py
-----------------------------
Generates a clinical-style gene expression heatmap comparing patient values
against a healthy reference baseline.

Returns a base-64 encoded PNG string suitable for embedding in API responses
and PDF reports.
"""

import io
import base64
import logging
from typing import Optional

import numpy as np
import matplotlib
matplotlib.use("Agg")   # non-interactive backend — must be set before pyplot import
import matplotlib.pyplot as plt
import seaborn as sns

from services.explainability import REFERENCE_BASELINE

logger = logging.getLogger(__name__)

# Demo patient: elevated pro-inflammatory genes, suppressed immune markers
_DEMO_PATIENT: dict[str, float] = {
    "IL6":     9.1,
    "TLR4":    6.8,
    "HLA-DRA": 1.2,
    "STAT3":   3.4,
    "TNF":     8.3,
    "CXCL8":   7.1,
    "CD14":    3.8,
    "MMP8":    6.9,
    "LBP":     5.8,
    "PCSK9":   2.4,
}


def generate_heatmap_image(
    patient_genes: Optional[dict[str, float]],
) -> str:
    """
    Generate a side-by-side gene expression heatmap (Patient vs Baseline).

    Args:
        patient_genes: Patient log₂ expression values.  Defaults to a
                       pre-seeded high-risk demonstration patient when None.

    Returns:
        Base-64 encoded PNG string.
    """
    patient = patient_genes or _DEMO_PATIENT
    genes = list(REFERENCE_BASELINE.keys())

    patient_vals  = np.array([patient.get(g, REFERENCE_BASELINE[g]) for g in genes])
    baseline_vals = np.array([REFERENCE_BASELINE[g] for g in genes])

    # rows = [Patient, Baseline],  cols = genes
    data_matrix = np.vstack([patient_vals, baseline_vals])

    # ── Figure setup ────────────────────────────────────────────────────────
    fig, ax = plt.subplots(figsize=(13, 3.8))
    fig.patch.set_facecolor("#0f172a")
    ax.set_facecolor("#0f172a")

    # Diverging palette: blue (low/protective) → red (high/risk)
    cmap = sns.diverging_palette(240, 10, s=90, l=40, as_cmap=True)

    sns.heatmap(
        data_matrix,
        ax=ax,
        xticklabels=genes,
        yticklabels=["Patient", "Healthy Baseline"],
        cmap=cmap,
        vmin=0.0,
        vmax=12.0,
        annot=True,
        fmt=".1f",
        linewidths=0.6,
        linecolor="#1e293b",
        annot_kws={"size": 8.5, "color": "white", "weight": "bold"},
        cbar_kws={"shrink": 0.75, "label": "log₂ Expression"},
    )

    ax.set_xlabel("Gene Symbol", color="#94a3b8", fontsize=9, labelpad=8)
    ax.set_title(
        "Gene Expression Comparison — Patient vs Healthy Reference Baseline",
        color="#e2e8f0",
        fontsize=11,
        fontweight="bold",
        pad=14,
    )
    ax.tick_params(colors="#94a3b8", labelsize=8.5)
    for spine in ax.spines.values():
        spine.set_visible(False)

    # Style colour bar
    cbar = ax.collections[0].colorbar
    cbar.ax.yaxis.label.set_color("#94a3b8")
    cbar.ax.yaxis.label.set_size(8)
    cbar.ax.tick_params(colors="#94a3b8", labelsize=7.5)

    plt.tight_layout(pad=1.5)

    # ── Encode ──────────────────────────────────────────────────────────────
    buf = io.BytesIO()
    plt.savefig(
        buf,
        format="png",
        dpi=150,
        bbox_inches="tight",
        facecolor=fig.get_facecolor(),
    )
    plt.close(fig)
    buf.seek(0)
    return base64.b64encode(buf.read()).decode("utf-8")
