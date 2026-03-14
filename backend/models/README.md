# models/

This directory holds the trained sepsis prediction model and preprocessing scaler.

## Model files

| File | Description |
|------|-------------|
| `sepsis_rf_model.pkl` | Trained scikit-learn `RandomForestClassifier` |
| `sepsis_scaler.pkl`   | Fitted preprocessing scaler (e.g. `StandardScaler`) |

### Model interface

```python
model.predict_proba(X: np.ndarray) -> np.ndarray  # shape (n, 2)
model.predict(X: np.ndarray)       -> np.ndarray   # shape (n,)
```

Column index `1` of `predict_proba` output must be **P(sepsis positive)**.

### Scaler interface

```python
scaler.transform(X: np.ndarray) -> np.ndarray  # same shape as input
```

## Feature order

The model must be trained on these 10 features in exactly this column order:

```python
["IL6", "TLR4", "HLA-DRA", "STAT3", "TNF", "CXCL8", "CD14", "MMP8", "LBP", "PCSK9"]
```

This order is defined in `services/model_loader.py → FEATURE_ORDER`.

## How to deploy updated models

1. Train your model and scaler.
2. Save them:
   ```python
   import pickle
   with open("backend/models/sepsis_rf_model.pkl", "wb") as f:
       pickle.dump(model, f)
   with open("backend/models/sepsis_scaler.pkl", "wb") as f:
       pickle.dump(scaler, f)
   ```
3. Restart the API - `model_loader.load_model()` detects the files on startup.

## Current state

Both `sepsis_rf_model.pkl` and `sepsis_scaler.pkl` are present.  
The API is running in **trained model mode** using the real RandomForest classifier.  
The preprocessing scaler is applied automatically before every inference call.
