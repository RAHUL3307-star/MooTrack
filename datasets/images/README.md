# Bovine Mastitis Image Datasets

This folder catalogs all known **image-based** bovine mastitis datasets used in or referenced by MooTracker.
Unlike the tabular datasets (SCC, EC, milk yield), these contain **RGB photos or thermal IR images** of cow udders.

## Usage in MooTracker

Image datasets are used in **two ways**:
1. **Visual Scan Screen** — uploaded udder photos are analyzed using computer vision + ML model inference
2. **Dataset matching** — scan results are compared against labeled clinical cases from these datasets

## Dataset Catalog

| ID | Name | Source | Modality | Access | Size |
|----|------|--------|----------|--------|------|
| `zenodo_15619247` | TIDS – Thermal Imaging Dataset for Subclinica... | Zenodo | thermal_infrared | restricted_403 | 218 MB |
| `zenodo_20763985` | Bovine Mastitis Udder Image Dataset (Clinical... | Zenodo | rgb_photo | restricted_403 | Unknown |
| `zenodo_19391230` | Cow Udder Mastitis Visual Detection Dataset... | Zenodo | rgb_photo | restricted_403 | Unknown |
| `github_fishmaster93` | FishMaster93/Cow_mastitis – Image Classificat... | GitHub | rgb_photo | public | 0.02 MB |
| `github_gssi_detection` | gssi/mastitis-detection – ML Pipeline with Im... | GitHub | feature_extracted | public | 1.4 MB |
| `kaggle_sivaprathish` | Kaggle – Mastitis Disease Detection (sivaprat... | Kaggle | rgb_photo | requires_kaggle_auth | Unknown |
| `kaggle_amithaditya` | Kaggle – Cow Mastitis from Milk Images (amith... | Kaggle | rgb_photo | requires_kaggle_auth | Unknown |
| `roboflow_bovine_mastitis` | Roboflow Universe – Bovine Mastitis Udder Det... | Roboflow | rgb_photo_annotated | requires_roboflow_api_key | Unknown |

## How to Download Restricted Datasets

### Zenodo (requires account)
1. Create a free account at https://zenodo.org
2. Visit the dataset URL and click "Download"
3. Place ZIP files in `datasets/images/<id>/`

### Kaggle (requires API key)
1. Install Kaggle CLI: `pip install kaggle`
2. Set up API key from https://www.kaggle.com/settings
3. Run: `kaggle datasets download <dataset-slug>`

### Roboflow (requires API key)
1. Create account at https://roboflow.com
2. Get API key from workspace settings
3. Use Roboflow Python package or download from Universe

## ML Model Integration

The VisualScanScreen uses extracted visual features mapped to the trained ML model:

| Visual Feature | ML Feature Proxy |
|---|---|
| Erythema score (0–100) | Somatic Cell Count proxy |
| Quadrant asymmetry | Quarter Differential Ratio |
| Teat roughness % | Udder Thermal Asymmetry proxy |
| Petechiae/scab count | Past Mastitis Episodes proxy |
| Tissue mean luminance | Milk Yield proxy |
| Block std deviation | Bedding Hygiene Score proxy |

The logistic regression weights from `ml_engine.js` drive the final risk probability.
