# models/

This directory holds the trained sepsis prediction model.

## Expected file

`sepsis_model.pkl` — a serialised scikit-learn estimator that implements:

```python
model.predict_proba(X: np.ndarray) -> np.ndarray  # shape (n, 2)
model.predict(X: np.ndarray) -> np.ndarray         # shape (n,)
```

Column 1 of `predict_proba` output must be P(sepsis).

## Feature order

The model must be trained on these 10 features in exactly this column order:

```python
["IL6", "TLR4", "HLA-DRA", "STAT3", "TNF", "CXCL8", "CD14", "MMP8", "LBP", "PCSK9"]
```

This order is defined in `services/model_loader.py` → `FEATURE_ORDER`.

## How to deploy

1. Train your model (see project README for a full example).
2. Save it:
   ```python
   import pickle
   with open("backend/models/sepsis_model.pkl", "wb") as f:
       pickle.dump(model, f)
   ```
3. Restart the API server — `model_loader.load_model()` detects the file on startup.

## Current state

No `.pkl` file is present.  The API is running in **placeholder mode**, using a
biology-informed weighted formula derived from sepsis literature (see
`services/model_loader.py → PlaceholderModel`).
