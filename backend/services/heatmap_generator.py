"""Generate a compact heatmap for top ranked model features."""

import base64
import io
import logging
from typing import Optional

import matplotlib
import matplotlib.pyplot as plt
import numpy as np
import seaborn as sns

from services.explainability import get_gene_impacts

matplotlib.use("Agg")

logger = logging.getLogger(__name__)


def generate_heatmap_image(
    patient_genes: Optional[dict[str, float]],
    ranked_features: Optional[list[dict]] = None,
    max_features: int = 20,
) -> str:
    """Generate patient vs baseline heatmap for top ranked model features."""
    if ranked_features is None:
        ranked_features = get_gene_impacts(patient_genes, top_n=max_features)
    if not ranked_features:
        return ""

    top_features = ranked_features[: max(1, max_features)]
    feature_labels = [row["gene"] for row in top_features]
    patient_vals = np.array([row.get("expression", 0.0) for row in top_features], dtype=float)
    baseline_vals = np.array([row.get("baseline", 0.0) for row in top_features], dtype=float)
    data_matrix = np.vstack([patient_vals, baseline_vals])

    low = float(np.min(data_matrix))
    high = float(np.max(data_matrix))
    if abs(high - low) < 1e-9:
        low -= 1.0
        high += 1.0

    fig_width = min(max(10.0, len(feature_labels) * 0.45), 22.0)
    fig, ax = plt.subplots(figsize=(fig_width, 3.8))
    fig.patch.set_facecolor("#0f172a")
    ax.set_facecolor("#0f172a")

    cmap = sns.diverging_palette(240, 10, s=90, l=40, as_cmap=True)

    sns.heatmap(
        data_matrix,
        ax=ax,
        xticklabels=feature_labels,
        yticklabels=["Patient", "Training Baseline"],
        cmap=cmap,
        vmin=low,
        vmax=high,
        annot=len(feature_labels) <= 20,
        fmt=".2f",
        linewidths=0.6,
        linecolor="#1e293b",
        annot_kws={"size": 8.5, "color": "white", "weight": "bold"},
        cbar_kws={"shrink": 0.75, "label": "Expression"},
    )

    ax.set_xlabel("Feature", color="#94a3b8", fontsize=9, labelpad=8)
    ax.set_title(
        "Top Model Features - Patient vs Training Baseline",
        color="#e2e8f0",
        fontsize=11,
        fontweight="bold",
        pad=14,
    )
    ax.tick_params(colors="#94a3b8", labelsize=8.5)
    for spine in ax.spines.values():
        spine.set_visible(False)

    cbar = ax.collections[0].colorbar
    cbar.ax.yaxis.label.set_color("#94a3b8")
    cbar.ax.yaxis.label.set_size(8)
    cbar.ax.tick_params(colors="#94a3b8", labelsize=7.5)

    plt.tight_layout(pad=1.5)

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
