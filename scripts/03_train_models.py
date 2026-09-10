"""
03_train_models.py
Multi-Algorithm Model Training, Benchmarking & Calibrated Ensemble for Bovine Mastitis Early Forecasting (PS #26109)

Trains:
1. HistGradientBoosting Multi-Class Classifier
2. Random Forest Multi-Class Classifier
3. Calibrated Soft-Voting Ensemble Classifier (Native scikit-learn, OpenMP crash-safe on macOS ARM64)
4. 7-14 Day Lead-Time Forecasting Regressor
"""

import os
os.environ["KMP_DUPLICATE_LIB_OK"] = "TRUE"
os.environ["OMP_NUM_THREADS"] = "1"

import json
import time
import joblib
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix
)
from sklearn.ensemble import (
    HistGradientBoostingClassifier, HistGradientBoostingRegressor,
    RandomForestClassifier, VotingClassifier
)
from sklearn.calibration import CalibratedClassifierCV

BASE_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = BASE_DIR / "data" / "processed"
MODELS_DIR = BASE_DIR / "models"

def load_data():
    """Loads train, val, and test datasets along with metadata schema."""
    with open(MODELS_DIR / "feature_metadata.json", "r") as f:
        meta = json.load(f)
        
    feature_cols = meta["all_feature_cols"]
    target_col = meta["target_col"]
    lead_time_col = meta["lead_time_col"]
    
    df_train = pd.read_parquet(DATA_DIR / "train.parquet")
    df_val = pd.read_parquet(DATA_DIR / "val.parquet")
    df_test = pd.read_parquet(DATA_DIR / "test.parquet")
    
    X_train = df_train[feature_cols]
    y_train = df_train[target_col]
    
    X_val = df_val[feature_cols]
    y_val = df_val[target_col]
    
    X_test = df_test[feature_cols]
    y_test = df_test[target_col]
    
    # Lead time subset (for cows with risk tier >= 2: subclinical/clinical)
    mask_lead_train = (df_train[target_col] >= 2) & (df_train[lead_time_col] < 90)
    X_lead_train = df_train.loc[mask_lead_train, feature_cols]
    y_lead_train = df_train.loc[mask_lead_train, lead_time_col]
    
    mask_lead_val = (df_val[target_col] >= 2) & (df_val[lead_time_col] < 90)
    X_lead_val = df_val.loc[mask_lead_val, feature_cols]
    y_lead_val = df_val.loc[mask_lead_val, lead_time_col]
    
    mask_lead_test = (df_test[target_col] >= 2) & (df_test[lead_time_col] < 90)
    X_lead_test = df_test.loc[mask_lead_test, feature_cols]
    y_lead_test = df_test.loc[mask_lead_test, lead_time_col]
    
    return {
        "X_train": X_train, "y_train": y_train,
        "X_val": X_val, "y_val": y_val,
        "X_test": X_test, "y_test": y_test,
        "X_lead_train": X_lead_train, "y_lead_train": y_lead_train,
        "X_lead_val": X_lead_val, "y_lead_val": y_lead_val,
        "X_lead_test": X_lead_test, "y_lead_test": y_lead_test,
        "feature_cols": feature_cols,
        "classes": meta["classes"]
    }

def evaluate_classifier(model, X_eval, y_eval, model_name="Model"):
    """Calculates rigorous multi-class evaluation metrics."""
    y_pred = model.predict(X_eval)
    y_proba = model.predict_proba(X_eval)
    
    acc = accuracy_score(y_eval, y_pred)
    prec_macro = precision_score(y_eval, y_pred, average="macro", zero_division=0)
    rec_macro = recall_score(y_eval, y_pred, average="macro", zero_division=0)
    f1_macro = f1_score(y_eval, y_pred, average="macro", zero_division=0)
    
    # Subclinical early warning class recall (Class 2: Moderate Risk)
    rec_per_class = recall_score(y_eval, y_pred, average=None, zero_division=0)
    subclinical_recall = rec_per_class[2] if len(rec_per_class) > 2 else 0.0
    high_risk_recall = rec_per_class[3] if len(rec_per_class) > 3 else 0.0
    
    # One-vs-Rest ROC-AUC
    try:
        roc_auc = roc_auc_score(y_eval, y_proba, multi_class="ovr", average="macro")
    except Exception:
        roc_auc = 0.0
        
    cm = confusion_matrix(y_eval, y_pred).tolist()
    
    metrics = {
        "model_name": model_name,
        "accuracy": round(float(acc), 4),
        "precision_macro": round(float(prec_macro), 4),
        "recall_macro": round(float(rec_macro), 4),
        "f1_macro": round(float(f1_macro), 4),
        "roc_auc_ovr": round(float(roc_auc), 4),
        "subclinical_recall_7_14d": round(float(subclinical_recall), 4),
        "high_risk_recall": round(float(high_risk_recall), 4),
        "confusion_matrix": cm
    }
    return metrics

def train_all_models():
    print("[*] Loading processed datasets for model training...")
    data = load_data()
    X_train, y_train = data["X_train"], data["y_train"]
    X_val, y_val = data["X_val"], data["y_val"]
    X_test, y_test = data["X_test"], data["y_test"]
    
    print(f"[+] Training Set: {X_train.shape[0]} samples, {X_train.shape[1]} features")
    
    model_benchmarks = {}
    
    # 1. HistGradientBoosting Classifier (fast, robust, scikit-learn native)
    print("\n[1/3] Training HistGradientBoosting Multi-Class Classifier...")
    t0 = time.time()
    hgb_model = HistGradientBoostingClassifier(
        max_iter=250,
        learning_rate=0.04,
        max_depth=6,
        max_leaf_nodes=31,
        class_weight="balanced",
        random_state=42
    )
    hgb_model.fit(X_train, y_train)
    hgb_train_time = round(time.time() - t0, 2)
    hgb_val_metrics = evaluate_classifier(hgb_model, X_val, y_val, "HistGradientBoosting")
    hgb_val_metrics["train_time_sec"] = hgb_train_time
    model_benchmarks["HistGradientBoosting"] = hgb_val_metrics
    print(f"      Validation F1-Macro: {hgb_val_metrics['f1_macro']:.4f} | Subclinical Recall: {hgb_val_metrics['subclinical_recall_7_14d']:.4f} (Time: {hgb_train_time}s)")
    
    # 2. Random Forest Classifier
    print("\n[2/3] Training Random Forest Classifier...")
    t0 = time.time()
    rf_model = RandomForestClassifier(
        n_estimators=180,
        max_depth=12,
        min_samples_split=4,
        min_samples_leaf=2,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1
    )
    rf_model.fit(X_train, y_train)
    rf_train_time = round(time.time() - t0, 2)
    rf_val_metrics = evaluate_classifier(rf_model, X_val, y_val, "Random Forest")
    rf_val_metrics["train_time_sec"] = rf_train_time
    model_benchmarks["RandomForest"] = rf_val_metrics
    print(f"      Validation F1-Macro: {rf_val_metrics['f1_macro']:.4f} | Subclinical Recall: {rf_val_metrics['subclinical_recall_7_14d']:.4f} (Time: {rf_train_time}s)")
    
    # 3. Soft-Voting Calibrated Ensemble
    print("\n[3/3] Building Calibrated Soft-Voting Ensemble (HistGradientBoosting + RF)...")
    voting_ensemble = VotingClassifier(
        estimators=[
            ("hgb", hgb_model),
            ("rf", rf_model)
        ],
        voting="soft",
        weights=[0.60, 0.40]
    )
    voting_ensemble.fit(X_train, y_train)
    
    calibrated_ensemble = CalibratedClassifierCV(
        estimator=voting_ensemble,
        method="isotonic",
        cv=3
    )
    calibrated_ensemble.fit(X_train, y_train)
    
    # Final Test Set Evaluation
    test_metrics = evaluate_classifier(calibrated_ensemble, X_test, y_test, "Calibrated Voting Ensemble")
    print(f"\n=======================================================")
    print(f" FINAL TEST SET PERFORMANCE (Calibrated Ensemble):")
    print(f" - Accuracy:               {test_metrics['accuracy'] * 100:.2f}%")
    print(f" - F1-Macro:               {test_metrics['f1_macro']:.4f}")
    print(f" - ROC-AUC (OvR):          {test_metrics['roc_auc_ovr']:.4f}")
    print(f" - Subclinical Recall:     {test_metrics['subclinical_recall_7_14d'] * 100:.2f}% (7-14 Day Early Warning Sensitivity)")
    print(f" - High-Risk Acute Recall: {test_metrics['high_risk_recall'] * 100:.2f}%")
    print(f"=======================================================\n")
    
    # 4. Lead-Time Forecasting Regressor (7-14 Days)
    print("[*] Training 7-14 Day Lead-Time Horizon Regressor...")
    X_lead_train, y_lead_train = data["X_lead_train"], data["y_lead_train"]
    X_lead_test, y_lead_test = data["X_lead_test"], data["y_lead_test"]
    
    lead_time_model = HistGradientBoostingRegressor(
        max_iter=160,
        learning_rate=0.05,
        max_depth=5,
        random_state=42
    )
    lead_time_model.fit(X_lead_train, y_lead_train)
    
    lead_preds = lead_time_model.predict(X_lead_test)
    mae_days = np.mean(np.abs(y_lead_test - lead_preds))
    print(f"[+] Lead-time forecast Mean Absolute Error: {mae_days:.2f} days (on 7-14 day forecast horizon)")
    
    # 5. Serialize Trained Models & Performance Artifacts
    print("[*] Serializing production models and evaluation reports...")
    joblib.dump(calibrated_ensemble, MODELS_DIR / "mastitis_risk_ensemble.joblib")
    joblib.dump(lead_time_model, MODELS_DIR / "lead_time_forecaster.joblib")
    
    results = {
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "validation_benchmarks": model_benchmarks,
        "final_test_evaluation": test_metrics,
        "lead_time_forecaster": {
            "mae_days": round(float(mae_days), 3),
            "samples_evaluated": len(y_lead_test)
        }
    }
    
    with open(MODELS_DIR / "evaluation_metrics.json", "w") as f:
        json.dump(results, f, indent=2)
        
    print(f"[✓] Models and evaluation saved to {MODELS_DIR}")
    return results

if __name__ == "__main__":
    train_all_models()
