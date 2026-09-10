"""
02_clean_and_engineer_features.py
Feature Engineering & Preprocessing Pipeline for Bovine Mastitis Early Forecasting (PS #26109)

Domain-specific bio-sensor feature derivation, IQR physical bounds screening,
and stratified herd-aware train/val/test splitting for unified dairy cows in general
(strictly ZERO breed classifications, ZERO geographic segregation).
"""

import json
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.model_selection import StratifiedGroupKFold
from sklearn.preprocessing import StandardScaler

BASE_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = BASE_DIR / "data" / "processed"
MODELS_DIR = BASE_DIR / "models"
MODELS_DIR.mkdir(parents=True, exist_ok=True)

MASTER_DATASET = DATA_DIR / "bovine_mastitis_indian_farms_master.parquet"

def apply_iqr_clipping(df: pd.DataFrame, numeric_cols: list) -> pd.DataFrame:
    """Tukey's IQR rule to clip spurious sensor spikes to biological bounds."""
    df_clean = df.copy()
    for col in numeric_cols:
        if col in df_clean.columns:
            q1 = df_clean[col].quantile(0.01)
            q3 = df_clean[col].quantile(0.99)
            iqr = q3 - q1
            lower_bound = q1 - 1.5 * iqr
            upper_bound = q3 + 1.5 * iqr
            df_clean[col] = df_clean[col].clip(lower=lower_bound, upper=upper_bound)
    return df_clean

def engineer_features(df: pd.DataFrame) -> tuple[pd.DataFrame, dict]:
    """Derives physiological, enzymatic, ionic, and environmental risk indices."""
    df_feat = df.copy()
    
    # 1. 4-Quarter Electrical Conductivity Asymmetry Metrics
    ec_cols = [c for c in ["ec_quarter_fl", "ec_quarter_fr", "ec_quarter_rl", "ec_quarter_rr"] if c in df_feat.columns]
    if not ec_cols:
        ec_cols = [c for c in ["ec_quarter_fl_ms_cm", "ec_quarter_fr_ms_cm", "ec_quarter_rl_ms_cm", "ec_quarter_rr_ms_cm"] if c in df_feat.columns]
        
    df_feat["ec_mean_udder"] = df_feat[ec_cols].mean(axis=1)
    df_feat["ec_std_quarters"] = df_feat[ec_cols].std(axis=1)
    df_feat["ec_max_quarter"] = df_feat[ec_cols].max(axis=1)
    df_feat["ec_min_quarter"] = df_feat[ec_cols].min(axis=1)
    df_feat["ec_asymmetry_ratio"] = df_feat["ec_max_quarter"] / np.maximum(df_feat["ec_min_quarter"], 1.0)
    
    # 2. Precision Telemetry & Behavioral Drop Indices
    df_feat["rumination_per_liter"] = df_feat["rumination_minutes_day"] / np.maximum(df_feat["actual_milk_yield_l"], 1.0)
    df_feat["lying_to_rumination_ratio"] = (df_feat["lying_hours_day"] * 60.0) / np.maximum(df_feat["rumination_minutes_day"], 60.0)
    
    # 3. Thermal-Electrical & Hotspot Synergy Index (THERMOMAST)
    df_feat["thermal_ec_synergy_index"] = df_feat["udder_thermal_delta_c"] * (df_feat["max_quarter_ec_diff_pct"] / 10.0)
    if "udder_hotspot_delta_t_c" in df_feat.columns and "thermal_asymmetry_index" in df_feat.columns:
        df_feat["thermomast_severity_score"] = df_feat["udder_hotspot_delta_t_c"] * df_feat["thermal_asymmetry_index"]
    else:
        df_feat["thermomast_severity_score"] = df_feat["udder_thermal_delta_c"] * 1.5
    
    # 4. Udder Mechanical Strain & Flex Swelling Index (MasPA)
    df_feat["udder_flex_strain_excess"] = np.maximum(df_feat["udder_flex_strain_ratio"] - 1.15, 0.0)
    
    # 5. Microclimate Heat Stress Load (THI)
    df_feat["thi_heat_load"] = np.maximum(df_feat["thi_index"] - 72.0, 0.0)
    df_feat["severe_heat_stress_flag"] = (df_feat["thi_index"] >= 78.0).astype(int)
    
    # 6. Farm Hygiene & Milking Risk Penalty
    df_feat["hygiene_penalty_score"] = (
        (1 - df_feat["post_milking_teat_dipping"]) * 2.5 +
        (1 - df_feat["pre_milking_disinfection"]) * 1.5 +
        (df_feat["bedding_moisture_pct"] > 35.0).astype(float) * 2.0 +
        (df_feat["stall_cleaning_freq_day"] == 1).astype(float) * 1.5 +
        (df_feat["dung_pile_distance_m"] < 6.0).astype(float) * 1.8 +
        (5 - df_feat["milker_hygiene_score"]) * 0.8 +
        (df_feat["vacuum_instability_kpa"] > 2.0).astype(float) * 1.2
    )
    
    # 7. Lactation Vulnerability Curve
    df_feat["parity_vulnerability"] = np.where(df_feat["parity"] >= 3, 1.4, 1.0)
    df_feat["dim_vulnerability"] = np.where(df_feat["days_in_milk"] <= 100, 1.35, 1.0)

    # 8. Ionic & Enzymatic Epithelial Permeability Indices
    df_feat["na_k_ratio"] = df_feat["milk_sodium_na_mg_dl"] / np.maximum(df_feat["milk_potassium_k_mg_dl"], 1.0)
    df_feat["enzymatic_damage_score"] = (df_feat["ldh_activity_u_l"] / 200.0) * (df_feat["nagase_activity_nmol_min_ml"] / 15.0)
    df_feat["ionic_barrier_index"] = df_feat["na_k_ratio"] * (df_feat["milk_chloride_cl_mg_dl"] / 100.0)
    df_feat["laser_density_somatic_ratio"] = df_feat["laser_speckle_density_contrast"] * df_feat["somatic_cell_score"]
    df_feat["core_reticular_thermal_delta"] = df_feat["reticulorumen_temp_c"] - df_feat["core_body_temp_c"]

    # 9. Feed Intake Depression & Metabolic Synergies (RFI & Metabolomics)
    if "actual_dmi_kg_day" in df_feat.columns and "expected_dmi_kg_day" in df_feat.columns:
        df_feat["dmi_depression_pct"] = np.clip(((df_feat["expected_dmi_kg_day"] - df_feat["actual_dmi_kg_day"]) / np.maximum(df_feat["expected_dmi_kg_day"], 1.0)) * 100.0, 0.0, 60.0)
    else:
        df_feat["dmi_depression_pct"] = df_feat["yield_drop_pct"] * 0.75

    if "plasma_oxidative_stress_umol_l" in df_feat.columns and "cellular_lipolysis_rate" in df_feat.columns:
        df_feat["metabolic_stress_interaction"] = (df_feat["plasma_oxidative_stress_umol_l"] / 250.0) * (1.0 + df_feat["cellular_lipolysis_rate"])
    else:
        df_feat["metabolic_stress_interaction"] = df_feat["milk_bhb_mmol_l"] * 10.0

    # 10. Behavioral Feeding-to-Rumination & Sensor Calibration Indices
    if "feeding_to_rumination_ratio" in df_feat.columns:
        df_feat["frr_deviation_index"] = np.abs(df_feat["feeding_to_rumination_ratio"] - 0.62) / 0.62
    else:
        df_feat["frr_deviation_index"] = 0.0
        
    if "milk_turbidity_ntu" in df_feat.columns:
        df_feat["turbidity_ec_synergy"] = (df_feat["milk_turbidity_ntu"] / 25.0) * (df_feat["ec_mean_udder"] / 5.0)
    else:
        df_feat["turbidity_ec_synergy"] = df_feat["ec_mean_udder"]
        
    if "farm_biosecurity_index" in df_feat.columns and "smallholder_welfare_index" in df_feat.columns:
        df_feat["welfare_biosecurity_composite"] = (df_feat["farm_biosecurity_index"] * 0.5) + (df_feat["smallholder_welfare_index"] * 0.5)
    else:
        df_feat["welfare_biosecurity_composite"] = 75.0

    # Categorical Columns for Modeling (Operational only - NO Breeds)
    categorical_cols = [
        "lactation_stage", "vaccination_status", 
        "floor_type", "milking_system"
    ]
    
    # Generate Dummies / One-Hot Encodings
    df_encoded = pd.get_dummies(df_feat, columns=categorical_cols, drop_first=False)
    
    # Feature metadata schema
    feature_meta = {
        "categorical_cols": categorical_cols,
        "ec_cols": ec_cols,
        "engineered_cols": [
            "ec_mean_udder", "ec_std_quarters", "ec_asymmetry_ratio",
            "rumination_per_liter", "lying_to_rumination_ratio",
            "thermal_ec_synergy_index", "thermomast_severity_score",
            "udder_flex_strain_excess", "thi_heat_load", "severe_heat_stress_flag",
            "hygiene_penalty_score", "parity_vulnerability", "dim_vulnerability",
            "na_k_ratio", "enzymatic_damage_score", "ionic_barrier_index",
            "laser_density_somatic_ratio", "core_reticular_thermal_delta",
            "dmi_depression_pct", "metabolic_stress_interaction",
            "frr_deviation_index", "turbidity_ec_synergy", "welfare_biosecurity_composite"
        ]
    }
    
    return df_encoded, feature_meta

def prepare_train_val_test_splits():
    """Performs stratified and herd-grouped train/val/test splits."""
    print("[*] Loading master dataset for feature engineering...")
    df = pd.read_parquet(MASTER_DATASET)
    
    # Clean numeric outliers using Tukey's IQR biological bounds
    excluded_from_clipping = [
        "risk_tier", "is_mastitis_positive", "clots_in_milk_flag", 
        "quarter_swelling_flag", "asymmetric_hardness_flag", "pyrexia_fever_flag", 
        "cmt_score_0_to_3", "hyperkeratosis_score_1_to_4", "parity", 
        "stall_cleaning_freq_day", "pre_milking_disinfection", "post_milking_teat_dipping", 
        "milker_hygiene_score", "liner_slip_frequency", "restlessness_transition_freq",
        "chronic_carrier_flag", "testing_month", "peak_lactation_day",
        "milk_odor_score", "milk_taste_profile", "pathogen_gram_type",
        "milker_glove_usage_flag", "loose_housing_flag", "human_animal_contact_score",
        "antimicrobial_resistance_gene_count", "parenchymal_hardness_score", "anorexia_symptom_score",
        "respiratory_distress_score", "cbvd_restless_movement_bouts", "stall_disinfection_interval_days"
    ]
    sensor_numerics = [c for c in df.select_dtypes(include=[np.number]).columns if c not in excluded_from_clipping]
    df_cleaned = apply_iqr_clipping(df, sensor_numerics)
    
    # Engineer features
    df_engineered, meta = engineer_features(df_cleaned)
    
    # Define Target & Exclude Columns
    target_col = "risk_tier"
    lead_time_col = "lead_time_days"
    metadata_cols = ["animal_id", "herd_id", "species", "risk_tier_label", "is_mastitis_positive"]
    
    all_feature_cols = [
        c for c in df_engineered.columns 
        if c not in [target_col, lead_time_col] + metadata_cols
    ]
    
    print(f"[+] Total engineered features: {len(all_feature_cols)}")
    
    # Stratified Split (80% Train, 10% Validation, 10% Test) by herd_id
    sgkf = StratifiedGroupKFold(n_splits=5, shuffle=True, random_state=42)
    train_idx, temp_idx = next(sgkf.split(df_engineered, df_engineered[target_col], groups=df_engineered["herd_id"]))
    
    df_train = df_engineered.iloc[train_idx].copy()
    df_temp = df_engineered.iloc[temp_idx].copy()
    
    # Split temp into Val (50%) and Test (50%)
    sgkf_val_test = StratifiedGroupKFold(n_splits=2, shuffle=True, random_state=42)
    val_rel_idx, test_rel_idx = next(sgkf_val_test.split(df_temp, df_temp[target_col], groups=df_temp["herd_id"]))
    
    df_val = df_temp.iloc[val_rel_idx].copy()
    df_test = df_temp.iloc[test_rel_idx].copy()
    
    print(f"[+] Dataset Split: Train={len(df_train)} ({len(df_train)/len(df_engineered)*100:.1f}%), "
          f"Val={len(df_val)} ({len(df_val)/len(df_engineered)*100:.1f}%), "
          f"Test={len(df_test)} ({len(df_test)/len(df_engineered)*100:.1f}%)")
    
    # Standard Scaler for Numerical Features
    scaler = StandardScaler()
    scaler.fit(df_train[all_feature_cols])
    
    # Save datasets
    df_train.to_parquet(DATA_DIR / "train.parquet", index=False)
    df_val.to_parquet(DATA_DIR / "val.parquet", index=False)
    df_test.to_parquet(DATA_DIR / "test.parquet", index=False)
    
    # Save Metadata & Feature Schema
    metadata_export = {
        "all_feature_cols": all_feature_cols,
        "n_features": len(all_feature_cols),
        "target_col": target_col,
        "lead_time_col": lead_time_col,
        "classes": ["No Risk", "Low Risk", "Moderate Risk", "High Risk"],
        "class_mapping": {0: "No Risk", 1: "Low Risk", 2: "Moderate Risk", 3: "High Risk"},
        "scaler_means": {col: float(m) for col, m in zip(all_feature_cols, scaler.mean_)},
        "scaler_scales": {col: float(s) for col, s in zip(all_feature_cols, scaler.scale_)},
        "feature_categories": {
            "milking_and_ec": [c for c in all_feature_cols if "ec_" in c or "yield" in c or "milk_" in c or "somatic" in c or "flow" in c or "dielectric" in c or "ldh" in c or "nagase" in c or "sodium" in c or "chloride" in c or "potassium" in c or "ionic" in c or "density" in c or "freezing" in c or "salts" in c or "persistency" in c],
            "wearable_biometrics": [c for c in all_feature_cols if "rumination" in c or "lying" in c or "temp" in c or "strain" in c or "activity" in c or "posture" in c or "velocity" in c or "restlessness" in c or "eating" in c or "chewing" in c or "dmi" in c or "bunk" in c],
            "microclimate_and_hygiene": [c for c in all_feature_cols if "thi" in c or "hygiene" in c or "bedding" in c or "cleaning" in c or "milking_system" in c or "coliform" in c or "vacuum" in c or "floor" in c or "mycotoxin" in c],
            "morphometry_and_optics": [c for c in all_feature_cols if "teat_" in c or "canal" in c or "keratin" in c or "hyperkeratosis" in c or "speckle" in c or "absorbance" in c or "brix" in c or "mir_" in c or "thermal_" in c or "hotspot" in c],
            "omics_and_metabolomics": [c for c in all_feature_cols if "oxidative" in c or "lipolysis" in c or "metabolic" in c or "eigengene" in c or "immunosuppression" in c or "granulocyte" in c or "macrophage" in c or "itraq" in c or "interleukin" in c or "vitamin_d" in c or "markov" in c or "methylation" in c],
            "lactation_and_parity": [c for c in all_feature_cols if "parity" in c or "dim" in c or "days_in_milk" in c or "vaccination" in c or "lactation" in c or "prior_mastitis" in c or "month" in c or "peak" in c]
        }
    }
    
    with open(MODELS_DIR / "feature_metadata.json", "w") as f:
        json.dump(metadata_export, f, indent=2)
        
    print(f"[✓] Feature engineering completed. Metadata saved to {MODELS_DIR / 'feature_metadata.json'}")
    return df_train, df_val, df_test, metadata_export

if __name__ == "__main__":
    prepare_train_val_test_splits()
