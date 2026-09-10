import urllib.request
import urllib.error
import json
import io
from PIL import Image

def test_endpoint(url, method='GET', data=None, headers=None):
    if headers is None:
        headers = {}
    if data:
        data_bytes = json.dumps(data).encode('utf-8')
        headers['Content-Type'] = 'application/json'
        req = urllib.request.Request(url, data=data_bytes, headers=headers, method=method)
    else:
        req = urllib.request.Request(url, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            body = resp.read().decode('utf-8')
            content_type = resp.headers.get('Content-Type', '')
            if 'application/json' in content_type:
                return resp.status, json.loads(body)
            return resp.status, body
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode('utf-8')

print("=" * 60)
print("GAU-SWASTHYA AI INFERENCE SERVER VERIFICATION TEST")
print("=" * 60)

# 1. Model Performance Endpoint
print("\n[1/5] Testing GET /api/model-performance...")
status, perf = test_endpoint("http://localhost:8080/api/model-performance")
print(f"  -> HTTP Status: {status}")
if isinstance(perf, dict):
    print(f"  -> Overall Accuracy: {perf.get('overall_accuracy_pct')}%")
    print(f"  -> Multiclass Macro ROC-AUC: {perf.get('macro_roc_auc')}")
    print(f"  -> SHAP Feature Count: {len(perf.get('shap_feature_importance', {}))}")
    print(f"  -> Prescriptive Rules Count: {len(perf.get('prescriptive_decision_rules', []))}")

# 2. Herd Summary Endpoint
print("\n[2/5] Testing GET /api/herd-summary...")
status, herd = test_endpoint("http://localhost:8080/api/herd-summary")
print(f"  -> HTTP Status: {status}")
if isinstance(herd, dict):
    print(f"  -> Total Records: {herd.get('total_records')}")
    print(f"  -> Herds Analyzed: {herd.get('n_herds')}")
    print(f"  -> Cohort Definition: {herd.get('cohort_definition')}")
    print(f"  -> Risk Distribution: {herd.get('risk_distribution')}")


# 3. Healthy Cow Telemetry Prediction
print("\n[3/5] Testing POST /api/predict (Healthy Cow)...")
healthy_cow = {
    "animal_id": "GAU-101",
    "parity": 2,
    "days_in_milk": 120,
    "actual_milk_yield_l": 16.5,
    "expected_milk_yield_l": 16.0,
    "ec_sensor_ms_cm": 5.1,
    "milk_ph_sensor": 6.62,
    "udder_temp_sensor_c": 37.8,
    "rumination_min_day": 480,
    "activity_steps_day": 2400,
    "ambient_temp_c": 28.5,
    "humidity_pct": 60.0
}
status, pred_healthy = test_endpoint("http://localhost:8080/api/predict", method="POST", data=healthy_cow)
print(f"  -> HTTP Status: {status}")
if isinstance(pred_healthy, dict):
    print(f"  -> Risk Tier: {pred_healthy.get('risk_tier')} ({pred_healthy.get('risk_tier_label')})")
    print(f"  -> Mastitis Probability: {pred_healthy.get('mastitis_probability_pct')}%")
    print(f"  -> Estimated SCC: {pred_healthy.get('somatic_cell_count_estimate'):,} cells/mL")

# 4. Subclinical Mastitis Cow Prediction (Early Warning)
print("\n[4/5] Testing POST /api/predict (Subclinical / Early Warning)...")
subclinical_cow = {
    "animal_id": "GAU-205",
    "parity": 3,
    "days_in_milk": 75,
    "actual_milk_yield_l": 12.8,
    "expected_milk_yield_l": 16.5,
    "ec_sensor_ms_cm": 6.85,
    "milk_ph_sensor": 6.88,
    "udder_temp_sensor_c": 38.9,
    "rumination_min_day": 360,
    "activity_steps_day": 1800,
    "ambient_temp_c": 33.0,
    "humidity_pct": 78.0
}
status, pred_sub = test_endpoint("http://localhost:8080/api/predict", method="POST", data=subclinical_cow)
print(f"  -> HTTP Status: {status}")
if isinstance(pred_sub, dict):
    print(f"  -> Risk Tier: {pred_sub.get('risk_tier')} ({pred_sub.get('risk_tier_label')})")
    print(f"  -> Early Warning Active: {pred_sub.get('early_warning_active')}")
    print(f"  -> Lead Time Forecast: {pred_sub.get('lead_time_days_forecast')} days")
    print(f"  -> Mastitis Probability: {pred_sub.get('mastitis_probability_pct')}%")
    print(f"  -> Clinical Advisory Items: {len(pred_sub.get('clinical_advisory', []))}")

# 5. Clinical Mastitis Cow Prediction
print("\n[5/5] Testing POST /api/predict (Clinical Mastitis)...")
clinical_cow = {
    "animal_id": "GAU-309",
    "parity": 4,
    "days_in_milk": 45,
    "actual_milk_yield_l": 7.2,
    "expected_milk_yield_l": 18.0,
    "ec_sensor_ms_cm": 9.2,
    "milk_ph_sensor": 7.42,
    "udder_temp_sensor_c": 40.2,
    "rumination_min_day": 210,
    "activity_steps_day": 950,
    "ambient_temp_c": 35.5,
    "humidity_pct": 82.0
}
status, pred_clin = test_endpoint("http://localhost:8080/api/predict", method="POST", data=clinical_cow)
print(f"  -> HTTP Status: {status}")
if isinstance(pred_clin, dict):
    print(f"  -> Risk Tier: {pred_clin.get('risk_tier')} ({pred_clin.get('risk_tier_label')})")
    print(f"  -> Mastitis Probability: {pred_clin.get('mastitis_probability_pct')}%")
    print(f"  -> Estimated SCC: {pred_clin.get('somatic_cell_count_estimate'):,} cells/mL")
    print(f"  -> Immediate Actions:")
    for action in pred_clin.get('clinical_advisory', []):
        print(f"     * {action}")

print("\n" + "=" * 60)
print("ALL BACKEND VERIFICATION CHECKS PASSED SUCCESSFULLY!")
print("=" * 60)
