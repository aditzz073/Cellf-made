"""
Sepsis Classification Pipeline
================================
Datasets  : GSE54514  |  GSE9960  |  GSE95233
Biomarkers: sepsis_top100_biomarkers.csv  (100 probe IDs)
Model     : Random Forest
Metrics   : Accuracy, ROC-AUC, Classification Report
Output    : feature_importance.png
"""

import os
import joblib
import re
import warnings
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    roc_auc_score,
    classification_report,
    ConfusionMatrixDisplay,
)

warnings.filterwarnings("ignore")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))


# ══════════════════════════════════════════════════════════════════
# HELPER FUNCTIONS
# ══════════════════════════════════════════════════════════════════

def path(filename: str) -> str:
    """Return absolute path relative to this script's directory."""
    return os.path.join(BASE_DIR, filename)


def load_expression(filename: str) -> pd.DataFrame:
    """
    Load an expression matrix CSV.

    Expected format (as exported from R / GEO):
        - Unnamed first column  → sample IDs  (e.g. GSM251887)
        - Remaining columns V1, V2 … → gene expression values

    Returns a DataFrame with:
        - 'Sample'  column (sample IDs, stripped of whitespace)
        - V1 … Vn   columns (numeric gene-expression values)
    """
    filepath = path(filename)
    print(f"  Reading {filename} …", end=" ", flush=True)
    df = pd.read_csv(filepath, index_col=0)  # first col becomes index
    df.index.name = "Sample"
    df = df.reset_index()
    df["Sample"] = df["Sample"].astype(str).str.strip()
    print(f"{df.shape[0]} samples × {df.shape[1] - 1} gene features")
    return df


def normalise_sample_id(series: pd.Series) -> pd.Series:
    """
    Normalise sample IDs to plain GSMxxxxxxx format.

    Handles variants such as:
        - 'X.GSM2500349.'  →  'GSM2500349'
        - 'GSM251887'      →  'GSM251887'  (unchanged)
    """
    return (
        series
        .astype(str)
        .str.strip()
        .str.replace(r"^X\.", "", regex=True)   # remove leading 'X.'
        .str.replace(r"\.$", "", regex=True)    # remove trailing '.'
        .str.strip()
    )


def load_labels(filename: str) -> pd.DataFrame:
    """
    Load a label CSV with columns [Sample, Class].

    Returns a DataFrame with normalised Sample IDs and
    integer label column (Sepsis=1, Control=0).
    """
    ldf = pd.read_csv(path(filename))
    ldf.columns = ["Sample", "Class"]
    ldf["Sample"] = normalise_sample_id(ldf["Sample"])
    ldf["label"] = ldf["Class"].map({"Sepsis": 1, "Control": 0})
    ldf = ldf.drop(columns=["Class"])
    return ldf


def attach_labels(expr_df: pd.DataFrame, label_df: pd.DataFrame,
                  dataset_name: str = "") -> pd.DataFrame:
    """
    Inner-merge expression data with labels on the 'Sample' column.
    Also normalises the expression sample IDs before merging.
    """
    expr_df = expr_df.copy()
    expr_df["Sample"] = normalise_sample_id(expr_df["Sample"])
    merged = expr_df.merge(label_df, on="Sample", how="inner")

    n_sepsis  = (merged["label"] == 1).sum()
    n_control = (merged["label"] == 0).sum()
    print(f"  {dataset_name}: {len(merged)} samples matched  "
          f"(Sepsis={n_sepsis}, Control={n_control})")
    return merged


# ══════════════════════════════════════════════════════════════════
# STEP 1 — Load expression matrices
# ══════════════════════════════════════════════════════════════════
print("\n" + "═" * 60)
print("STEP 1 │ Loading expression datasets")
print("═" * 60)

d1 = load_expression("GSE54514_expression_matrix.csv")
d2 = load_expression("GSE9960_expression_matrix.csv")
d3 = load_expression("GSE95233_expression_matrix.csv")


# ══════════════════════════════════════════════════════════════════
# STEP 2 — Load biomarker gene list (100 probe IDs)
# ══════════════════════════════════════════════════════════════════
print("\n" + "═" * 60)
print("STEP 2 │ Loading biomarker list")
print("═" * 60)

bio   = pd.read_csv(path("sepsis_top100_biomarkers.csv"))
genes = bio["Gene"].astype(str).str.strip().tolist()
print(f"  {len(genes)} biomarker probe IDs loaded.")
print(f"  Sample IDs: {genes[:5]} …")

# NOTE ─────────────────────────────────────────────────────────────
# The expression matrices store gene measurements in V1, V2, … Vn
# columns (positional placeholders from R's read.csv).  The actual
# probe-ID ↔ column-position mapping requires a platform annotation
# file that is not present in this project.
#
# Strategy: use ALL gene feature columns (V1…Vn) from each dataset.
# The Random Forest feature-importance step will surface the columns
# most predictive of sepsis — these implicitly correspond to the
# top biomarkers.  Column names are kept as V1, V2… so the model
# can still be evaluated; the importance plot highlights which
# positional probes matter most.
# ──────────────────────────────────────────────────────────────────


# ══════════════════════════════════════════════════════════════════
# STEP 3 — Identify gene-expression columns (Vn columns)
# ══════════════════════════════════════════════════════════════════
def gene_cols(df: pd.DataFrame) -> list:
    """Return all expression-value columns (everything except 'Sample' and 'label')."""
    return [c for c in df.columns if c not in ("Sample", "label")]


# ══════════════════════════════════════════════════════════════════
# STEP 4 — Load label files
# ══════════════════════════════════════════════════════════════════
print("\n" + "═" * 60)
print("STEP 4 │ Loading label files")
print("═" * 60)

l1 = load_labels("GSE54514_labels.csv")
l2 = load_labels("GSE9960_labels.csv")
l3 = load_labels("GSE95233_labels.csv")

print(f"  GSE54514 label file : {len(l1)} samples")
print(f"  GSE9960  label file : {len(l2)} samples")
print(f"  GSE95233 label file : {len(l3)} samples")


# ══════════════════════════════════════════════════════════════════
# STEP 5 — Attach labels → each dataset becomes samples × (genes + label)
# ══════════════════════════════════════════════════════════════════
print("\n" + "═" * 60)
print("STEP 5 │ Attaching labels to expression data")
print("═" * 60)

X1 = attach_labels(d1, l1, "GSE54514")
X2 = attach_labels(d2, l2, "GSE9960")
X3 = attach_labels(d3, l3, "GSE95233")


# ══════════════════════════════════════════════════════════════════
# STEP 6 — Find common gene columns across all three datasets
#           (intersection ensures same features for concat)
# ══════════════════════════════════════════════════════════════════
print("\n" + "═" * 60)
print("STEP 6 │ Aligning gene columns across datasets")
print("═" * 60)

cols1 = set(gene_cols(X1))
cols2 = set(gene_cols(X2))
cols3 = set(gene_cols(X3))
common_genes = sorted(cols1 & cols2 & cols3)

print(f"  GSE54514 gene cols : {len(cols1)}")
print(f"  GSE9960  gene cols : {len(cols2)}")
print(f"  GSE95233 gene cols : {len(cols3)}")
print(f"  Common gene cols   : {len(common_genes)}")

# Restrict each dataset to the common gene set
X1 = X1[["Sample", "label"] + common_genes]
X2 = X2[["Sample", "label"] + common_genes]
X3 = X3[["Sample", "label"] + common_genes]


# ══════════════════════════════════════════════════════════════════
# STEP 7 — Merge all datasets into one combined feature matrix
# ══════════════════════════════════════════════════════════════════
print("\n" + "═" * 60)
print("STEP 7 │ Merging all datasets")
print("═" * 60)

data = pd.concat([X1, X2, X3], axis=0, ignore_index=True)

n_total   = len(data)
n_sepsis  = (data["label"] == 1).sum()
n_control = (data["label"] == 0).sum()

print(f"  Combined : {n_total} samples × {len(common_genes)} gene features")
print(f"  Sepsis   : {n_sepsis}  ({100*n_sepsis/n_total:.1f}%)")
print(f"  Control  : {n_control}  ({100*n_control/n_total:.1f}%)")


# ══════════════════════════════════════════════════════════════════
# STEP 8 — Separate features and target labels
# ══════════════════════════════════════════════════════════════════
print("\n" + "═" * 60)
print("STEP 8 │ Separating features and labels")
print("═" * 60)

X = data[common_genes].astype(float)
y = data["label"].astype(int)

print(f"  Feature matrix X : {X.shape}")
print(f"  Label vector   y : {y.shape}  (unique values: {sorted(y.unique())})")


# ══════════════════════════════════════════════════════════════════
# STEP 9 — Convert labels to numeric (already done) & scale features
# ══════════════════════════════════════════════════════════════════
print("\n" + "═" * 60)
print("STEP 9 │ Scaling features (StandardScaler)")
print("═" * 60)

scaler   = StandardScaler()
X_scaled = scaler.fit_transform(X)
print(f"  Scaling done.  Mean ≈ {X_scaled.mean():.4f}, Std ≈ {X_scaled.std():.4f}")


# ══════════════════════════════════════════════════════════════════
# STEP 10 — Train / test split (stratified)
# ══════════════════════════════════════════════════════════════════
print("\n" + "═" * 60)
print("STEP 10 │ Train / test split  (80 % / 20 %, stratified)")
print("═" * 60)

X_train, X_test, y_train, y_test = train_test_split(
    X_scaled, y,
    test_size=0.20,
    random_state=42,
    stratify=y,
)
print(f"  Train : {len(X_train)} samples  "
      f"(Sepsis={y_train.sum()}, Control={(y_train==0).sum()})")
print(f"  Test  : {len(X_test)} samples  "
      f"(Sepsis={y_test.sum()}, Control={(y_test==0).sum()})")


# ══════════════════════════════════════════════════════════════════
# STEP 11 — Train Random Forest model
# ══════════════════════════════════════════════════════════════════
print("\n" + "═" * 60)
print("STEP 11 │ Training Random Forest Classifier")
print("═" * 60)

rf = RandomForestClassifier(
    n_estimators=200,
    max_depth=None,
    class_weight="balanced",   # handles class imbalance
    random_state=42,
    n_jobs=-1,
)
rf.fit(X_train, y_train)
print("  Random Forest trained successfully.")

# ── Save model and scaler to .pkl files ───────────────────────────
model_path  = path("sepsis_rf_model.pkl")
scaler_path = path("sepsis_scaler.pkl")
joblib.dump(rf,     model_path)
joblib.dump(scaler, scaler_path)
print(f"  Model  saved → {model_path}")
print(f"  Scaler saved → {scaler_path}")

# Optional: 5-fold cross-validation on training set
cv_scores = cross_val_score(rf, X_train, y_train, cv=5, scoring="roc_auc", n_jobs=-1)
print(f"  5-Fold CV ROC-AUC : {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")


# ══════════════════════════════════════════════════════════════════
# STEP 12 — Evaluate model: Accuracy + ROC-AUC
# ══════════════════════════════════════════════════════════════════
print("\n" + "═" * 60)
print("STEP 12 │ Model Evaluation")
print("═" * 60)

y_pred = rf.predict(X_test)
y_prob = rf.predict_proba(X_test)[:, 1]

acc = accuracy_score(y_test, y_pred)
auc = roc_auc_score(y_test, y_prob)

print(f"\n  ┌─────────────────────────────┐")
print(f"  │  Accuracy  :  {acc:.4f}        │")
print(f"  │  ROC-AUC   :  {auc:.4f}        │")
print(f"  └─────────────────────────────┘")

print("\n  Classification Report:")
print(classification_report(y_test, y_pred, target_names=["Control (0)", "Sepsis (1)"]))


# ══════════════════════════════════════════════════════════════════
# STEP 13 — Feature importance: top 20 predictive biomarker genes
# ══════════════════════════════════════════════════════════════════
print("\n" + "═" * 60)
print("STEP 13 │ Feature Importance (Top 20 Biomarker Genes)")
print("═" * 60)

importances = pd.Series(rf.feature_importances_, index=common_genes)
top20 = importances.sort_values(ascending=False).head(20)

print("\n  Top 20 most important gene features:")
for rank, (col, imp) in enumerate(top20.items(), start=1):
    print(f"    {rank:>2}. {col:<12}  importance = {imp:.6f}")

# ── Plot ──────────────────────────────────────────────────────────
fig, axes = plt.subplots(1, 2, figsize=(16, 6))

# Left: horizontal bar chart of top-20 importances
ax_bar = axes[0]
top20_sorted = top20.sort_values(ascending=True)
colors = plt.cm.Blues(np.linspace(0.4, 0.9, len(top20_sorted)))
top20_sorted.plot(kind="barh", ax=ax_bar, color=colors, edgecolor="white")
ax_bar.set_title("Top 20 Biomarker Genes\nFeature Importance (Random Forest)",
                 fontsize=13, fontweight="bold", pad=12)
ax_bar.set_xlabel("Importance Score", fontsize=11)
ax_bar.set_ylabel("Gene Feature", fontsize=11)
ax_bar.axvline(top20_sorted.mean(), color="tomato", linestyle="--",
               linewidth=1.5, label=f"Mean = {top20_sorted.mean():.4f}")
ax_bar.legend(fontsize=9)
ax_bar.spines[["top", "right"]].set_visible(False)

# Right: confusion matrix
ax_cm = axes[1]
ConfusionMatrixDisplay.from_predictions(
    y_test, y_pred,
    display_labels=["Control", "Sepsis"],
    cmap="Blues",
    ax=ax_cm,
)
ax_cm.set_title(f"Confusion Matrix\nAccuracy = {acc:.4f}  |  ROC-AUC = {auc:.4f}",
                fontsize=13, fontweight="bold", pad=12)

plt.suptitle("Sepsis Classification — GSE54514 + GSE9960 + GSE95233",
             fontsize=14, fontweight="bold", y=1.01)
plt.tight_layout()

plot_path = path("feature_importance.png")
plt.savefig(plot_path, dpi=150, bbox_inches="tight")
print(f"\n  Feature importance + confusion matrix saved → {plot_path}")
plt.show()

print("\n" + "═" * 60)
print("Pipeline complete.")
print("═" * 60)
