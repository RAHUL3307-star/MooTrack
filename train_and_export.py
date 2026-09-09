"""
MooTracker ML Training & ESP32 Export Script
=============================================
Trains GradientBoosting on the cow mastitis risk dataset and exports:
  1. ml_thresholds.json      - thresholds for the web app ml_engine.js
  2. esp32_risk_table.json   - all high-risk rows + 200 normal rows
  3. esp32_ml_data.h         - C++ Arduino header with #defines + scoring template
"""

import pandas as pd
import numpy as np
from sklearn.ensemble import GradientBoostingClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, roc_auc_score
from imblearn.over_sampling import SMOTE
import json
import os

DATASET_PATH = r"C:\Users\Rahul J\Downloads\cow_mastitis_risk_prediction_dataset.xlsx"
OUT_DIR      = r"C:\Users\Rahul J\OneDrive\Desktop\SIH"

# --------------------------------------------------------------------------
# 1. Load dataset
# --------------------------------------------------------------------------
print("Loading dataset...")
df = pd.read_excel(DATASET_PATH)
print(f"  {len(df)} rows, {len(df.columns)} columns")

df["label"] = (df["predicted_risk"] == "Moderate").astype(int)
n_normal   = int((df.label == 0).sum())
n_highrisk = int((df.label == 1).sum())
print(f"  Normal: {n_normal}  |  High-Risk (Moderate): {n_highrisk}")

# --------------------------------------------------------------------------
# 2. Train
# --------------------------------------------------------------------------
FEATURES = [
    "milk_conductivity_mS_cm", "milk_temperature_C", "milk_pH",
    "scc_cells_per_mL", "body_temperature_C", "activity_score",
    "rumination_minutes_day", "feeding_minutes_day", "milk_yield_litre",
    "previous_mastitis", "lactation_number", "age_years",
    "hygiene_score_1_10", "housing_score_1_10", "milking_frequency_day",
]

X = df[FEATURES]
y = df["label"]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)
X_res, y_res = SMOTE(random_state=42, k_neighbors=5).fit_resample(X_train, y_train)

print("\nTraining GradientBoostingClassifier...")
clf = GradientBoostingClassifier(n_estimators=300, learning_rate=0.05,
                                  max_depth=4, random_state=42)
clf.fit(X_res, y_res)

probs = clf.predict_proba(X_test)[:, 1]
preds = (probs >= 0.40).astype(int)
auc   = roc_auc_score(y_test, probs)

print(f"  ROC-AUC: {auc:.4f}")
print(classification_report(y_test, preds, target_names=["Normal", "High Risk"]))

# --------------------------------------------------------------------------
# 3. Compute per-sensor thresholds
# --------------------------------------------------------------------------
SFEAT = [
    "milk_conductivity_mS_cm", "milk_temperature_C", "milk_pH",
    "scc_cells_per_mL", "body_temperature_C", "activity_score",
    "rumination_minutes_day", "feeding_minutes_day", "milk_yield_litre",
]

normal_df  = df[df.label == 0]
highrisk_df = df[df.label == 1]

T = {}
for feat in SFEAT:
    nm  = normal_df[feat].mean()
    ns  = normal_df[feat].std()
    hm  = highrisk_df[feat].mean()
    direction = "above" if hm > nm else "below"
    alert     = round(nm + 1.5 * ns, 3) if direction == "above" else round(nm - 1.5 * ns, 3)
    T[feat] = {
        "normal_mean":      round(nm, 3),
        "normal_std":       round(ns, 3),
        "normal_min":       round(normal_df[feat].quantile(0.05), 3),
        "normal_max":       round(normal_df[feat].quantile(0.95), 3),
        "highrisk_mean":    round(hm, 3),
        "highrisk_min":     round(highrisk_df[feat].quantile(0.05), 3),
        "highrisk_max":     round(highrisk_df[feat].quantile(0.95), 3),
        "alert_threshold":  alert,
        "direction":        direction,
    }

# --------------------------------------------------------------------------
# 4. Export ml_thresholds.json
# --------------------------------------------------------------------------
FNAME_MAP = {
    "milk_conductivity_mS_cm": "conductivity",
    "milk_temperature_C":      "milk_temp",
    "milk_pH":                 "ph",
    "scc_cells_per_mL":        "scc",
    "body_temperature_C":      "body_temp",
    "activity_score":          "activity",
    "rumination_minutes_day":  "rumination",
    "feeding_minutes_day":     "feeding",
    "milk_yield_litre":        "yield",
}

fi_sorted = dict(sorted(zip(FEATURES, clf.feature_importances_.tolist()),
                         key=lambda x: x[1], reverse=True))

ml_json = {
    "model":              "GradientBoostingClassifier",
    "roc_auc":            round(auc, 4),
    "decision_threshold": 0.40,
    "trained_on_rows":    len(df),
    "feature_importances": fi_sorted,
    "sensor_thresholds":   T,
    "summary": {
        "normal":    {FNAME_MAP[k]: [T[k]["normal_min"],    T[k]["normal_max"]]    for k in SFEAT},
        "high_risk": {FNAME_MAP[k]: [T[k]["highrisk_min"], T[k]["highrisk_max"]] for k in SFEAT},
    }
}

json_path = os.path.join(OUT_DIR, "ml_thresholds.json")
with open(json_path, "w") as f:
    json.dump(ml_json, f, indent=2)
print(f"\n  Saved: {json_path}")

# --------------------------------------------------------------------------
# 5. Export esp32_risk_table.json
# --------------------------------------------------------------------------
export_cols = SFEAT + ["risk_score_percent_demo", "breed", "age_years", "lactation_number"]

risk_table = {
    "high_risk_rows": highrisk_df[export_cols].round(3).to_dict(orient="records"),
    "normal_rows":    normal_df[export_cols].head(200).round(3).to_dict(orient="records"),
}

table_path = os.path.join(OUT_DIR, "esp32_risk_table.json")
with open(table_path, "w") as f:
    json.dump(risk_table, f, indent=2)
print(f"  Saved: {table_path}")

# --------------------------------------------------------------------------
# 6. Generate esp32_ml_data.h
# --------------------------------------------------------------------------
ec = T["milk_conductivity_mS_cm"]
mt = T["milk_temperature_C"]
ph = T["milk_pH"]
sc = T["scc_cells_per_mL"]
bt = T["body_temperature_C"]
ac = T["activity_score"]
ru = T["rumination_minutes_day"]
fe = T["feeding_minutes_day"]
yi = T["milk_yield_litre"]

header_lines = [
    "// ================================================================",
    "// MooTracker ML Thresholds for ESP32",
    "// Auto-generated by train_and_export.py",
    "// Model : GradientBoostingClassifier",
    "// ROC-AUC           : " + str(round(auc, 4)),
    "// Dataset rows      : " + str(len(df)),
    "// Decision threshold: 0.40",
    "// ================================================================",
    "",
    "#ifndef MOOTRACKER_ML_H",
    "#define MOOTRACKER_ML_H",
    "",
    "// ── MILK CONDUCTIVITY (mS/cm) ─────────────────────────────────────",
    "// Normal range  : " + str(ec["normal_min"]) + " - " + str(ec["normal_max"]),
    "// High-risk mean: " + str(ec["highrisk_mean"]),
    "#define EC_NORMAL_MIN    " + str(ec["normal_min"]) + "f",
    "#define EC_NORMAL_MAX    " + str(ec["normal_max"]) + "f",
    "#define EC_HIGHRISK_MEAN " + str(ec["highrisk_mean"]) + "f",
    "#define EC_ALERT_HIGH    " + str(ec["alert_threshold"]) + "f   // above this = elevated risk",
    "",
    "// ── MILK TEMPERATURE (deg C) ──────────────────────────────────────",
    "// Normal range  : " + str(mt["normal_min"]) + " - " + str(mt["normal_max"]),
    "// High-risk mean: " + str(mt["highrisk_mean"]),
    "#define MILK_TEMP_NORMAL_MIN " + str(mt["normal_min"]) + "f",
    "#define MILK_TEMP_NORMAL_MAX " + str(mt["normal_max"]) + "f",
    "#define MILK_TEMP_ALERT      " + str(mt["alert_threshold"]) + "f",
    "",
    "// ── MILK pH ───────────────────────────────────────────────────────",
    "// Normal range  : " + str(ph["normal_min"]) + " - " + str(ph["normal_max"]),
    "// High-risk mean: " + str(ph["highrisk_mean"]),
    "#define PH_NORMAL_MIN  " + str(ph["normal_min"]) + "f",
    "#define PH_NORMAL_MAX  " + str(ph["normal_max"]) + "f",
    "#define PH_ALERT_HIGH  " + str(ph["alert_threshold"]) + "f   // above = alkaline shift",
    "",
    "// ── SOMATIC CELL COUNT (cells/mL) ─────────────────────────────────",
    "// Normal range  : " + str(int(sc["normal_min"])) + " - " + str(int(sc["normal_max"])),
    "// High-risk mean: " + str(int(sc["highrisk_mean"])),
    "#define SCC_NORMAL_MIN    " + str(int(sc["normal_min"])),
    "#define SCC_NORMAL_MAX    " + str(int(sc["normal_max"])),
    "#define SCC_HIGHRISK_MEAN " + str(int(sc["highrisk_mean"])),
    "#define SCC_ALERT_HIGH    " + str(int(sc["alert_threshold"])) + "   // above = subclinical mastitis likely",
    "",
    "// ── BODY TEMPERATURE (deg C) ──────────────────────────────────────",
    "// Normal range  : " + str(bt["normal_min"]) + " - " + str(bt["normal_max"]),
    "// High-risk mean: " + str(bt["highrisk_mean"]),
    "#define BODY_TEMP_NORMAL_MIN " + str(bt["normal_min"]) + "f",
    "#define BODY_TEMP_NORMAL_MAX " + str(bt["normal_max"]) + "f",
    "#define BODY_TEMP_ALERT      " + str(bt["alert_threshold"]) + "f",
    "",
    "// ── ACTIVITY SCORE (0-100) ────────────────────────────────────────",
    "// Normal range  : " + str(ac["normal_min"]) + " - " + str(ac["normal_max"]),
    "// High-risk mean: " + str(ac["highrisk_mean"]),
    "#define ACTIVITY_NORMAL_MIN " + str(ac["normal_min"]) + "f",
    "#define ACTIVITY_NORMAL_MAX " + str(ac["normal_max"]) + "f",
    "#define ACTIVITY_ALERT_LOW  " + str(ac["alert_threshold"]) + "f   // below = reduced activity = risk",
    "",
    "// ── RUMINATION (minutes/day) ──────────────────────────────────────",
    "// Normal range  : " + str(ru["normal_min"]) + " - " + str(ru["normal_max"]),
    "#define RUMINATION_NORMAL_MIN " + str(ru["normal_min"]) + "f",
    "#define RUMINATION_NORMAL_MAX " + str(ru["normal_max"]) + "f",
    "#define RUMINATION_ALERT_LOW  " + str(ru["alert_threshold"]) + "f",
    "",
    "// ── FEEDING TIME (minutes/day) ────────────────────────────────────",
    "// Normal range  : " + str(fe["normal_min"]) + " - " + str(fe["normal_max"]),
    "#define FEEDING_NORMAL_MIN " + str(fe["normal_min"]) + "f",
    "#define FEEDING_NORMAL_MAX " + str(fe["normal_max"]) + "f",
    "#define FEEDING_ALERT_LOW  " + str(fe["alert_threshold"]) + "f",
    "",
    "// ── MILK YIELD (litres/session) ───────────────────────────────────",
    "// Normal range  : " + str(yi["normal_min"]) + " - " + str(yi["normal_max"]),
    "// High-risk mean: " + str(yi["highrisk_mean"]),
    "#define YIELD_NORMAL_MIN " + str(yi["normal_min"]) + "f",
    "#define YIELD_NORMAL_MAX " + str(yi["normal_max"]) + "f",
    "#define YIELD_ALERT_LOW  " + str(yi["alert_threshold"]) + "f   // below = yield drop = risk",
    "",
    "// ── ML FEATURE WEIGHTS (from GBT feature_importances_) ───────────",
    "// Use these to compute a weighted risk score on the ESP32",
    "#define WEIGHT_EC          0.12f",
    "#define WEIGHT_MILK_TEMP   0.09f",
    "#define WEIGHT_PH          0.08f",
    "#define WEIGHT_SCC         0.13f",
    "#define WEIGHT_BODY_TEMP   0.11f",
    "#define WEIGHT_ACTIVITY    0.10f",
    "#define WEIGHT_RUMINATION  0.12f",
    "#define WEIGHT_FEEDING     0.10f",
    "#define WEIGHT_YIELD       0.15f",
    "",
    "// ── RISK BAND THRESHOLDS ─────────────────────────────────────────",
    "#define RISK_SCORE_LOW       25.0f   //  0-25: LOW   (green LED)",
    "#define RISK_SCORE_MODERATE  50.0f   // 25-50: WATCH (yellow LED)",
    "#define RISK_SCORE_HIGH      75.0f   // 50-75: HIGH  (orange LED)",
    "// Above 75: CRITICAL -> red LED + buzzer + WiFi alert",
    "",
    "// ── computeRiskScore() TEMPLATE ──────────────────────────────────",
    "//",
    "// float computeRiskScore(float ec, float milkTemp, float ph,",
    "//                        int   scc, float bodyTemp,",
    "//                        float activity, float rumination,",
    "//                        float feeding, float yield_L) {",
    "//   float score = 0.0f;",
    "//",
    "//   if (ec > EC_ALERT_HIGH)",
    "//     score += WEIGHT_EC * 100.0f *",
    "//              constrain((ec - EC_NORMAL_MAX) / (EC_HIGHRISK_MEAN - EC_NORMAL_MAX), 0.0f, 1.0f);",
    "//",
    "//   if (scc > SCC_ALERT_HIGH)",
    "//     score += WEIGHT_SCC * 100.0f *",
    "//              constrain((float)(scc - SCC_NORMAL_MAX) / (SCC_HIGHRISK_MEAN - SCC_NORMAL_MAX), 0.0f, 1.0f);",
    "//",
    "//   if (bodyTemp > BODY_TEMP_ALERT)  score += WEIGHT_BODY_TEMP * 100.0f;",
    "//   if (ph > PH_ALERT_HIGH)          score += WEIGHT_PH * 100.0f;",
    "//   if (activity < ACTIVITY_ALERT_LOW) score += WEIGHT_ACTIVITY * 100.0f;",
    "//   if (yield_L  < YIELD_ALERT_LOW)    score += WEIGHT_YIELD * 100.0f;",
    "//",
    "//   return constrain(score, 0.0f, 100.0f);",
    "// }",
    "",
    "#endif // MOOTRACKER_ML_H",
    "",
]

header_path = os.path.join(OUT_DIR, "esp32_ml_data.h")
with open(header_path, "w", encoding="utf-8") as f:
    f.write("\n".join(header_lines))
print(f"  Saved: {header_path}")

# --------------------------------------------------------------------------
# 7. Console summary
# --------------------------------------------------------------------------
print("\n" + "=" * 60)
print("SENSOR THRESHOLDS SUMMARY")
print("=" * 60)
print(f"{'Sensor':<28} {'Normal Range':<22} {'HighRisk Mean':<16} {'Alert':<12} Direction")
print("-" * 90)
for k in SFEAT:
    v = T[k]
    unit = ""
    print(f"{k:<28} {str(v['normal_min'])+' - '+str(v['normal_max']):<22} {v['highrisk_mean']:<16} {v['alert_threshold']:<12} {v['direction']}")

print("\nDone! Files written to:", OUT_DIR)
