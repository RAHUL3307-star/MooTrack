"""
MooTracker — Bovine Mastitis Image Dataset Downloader
Searches and downloads publicly accessible image-based mastitis datasets.
Builds a catalog JSON for all known sources (accessible or not).
"""

import urllib.request
import urllib.error
import json
import os
import sys
import time

sys.stdout.reconfigure(encoding="utf-8", errors="replace")


HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json",
}

IMAGES_DIR = os.path.join("datasets", "images")
os.makedirs(IMAGES_DIR, exist_ok=True)

# ── Known bovine mastitis IMAGE datasets (not tabular) ──────────────────────────
IMAGE_DATASET_CATALOG = [
    {
        "id": "zenodo_15619247",
        "name": "TIDS – Thermal Imaging Dataset for Subclinical Mastitis",
        "source": "Zenodo",
        "url": "https://zenodo.org/records/15619247",
        "format": "ZIP (thermal IR images, PNG)",
        "size_mb": 218,
        "modality": "thermal_infrared",
        "labels": ["healthy", "subclinical", "clinical"],
        "access": "restricted_403",
        "notes": "218 MB thermal IR udder images. Requires Zenodo account login.",
        "download_urls": [
            "https://zenodo.org/records/15619247/files/TIDS%20Dataset.zip?download=1",
            "https://zenodo.org/api/records/15619247/files/TIDS%20Dataset.zip/content",
        ],
    },
    {
        "id": "zenodo_20763985",
        "name": "Bovine Mastitis Udder Image Dataset (Clinical Grading)",
        "source": "Zenodo",
        "url": "https://zenodo.org/records/20763985",
        "format": "ZIP (RGB udder photos, annotated)",
        "size_mb": None,
        "modality": "rgb_photo",
        "labels": ["grade1", "grade2", "grade3", "grade4"],
        "access": "restricted_403",
        "notes": "Clinical NMC-grade annotated udder photos.",
        "download_urls": [
            "https://zenodo.org/records/20763985/files/mastitis_images.zip?download=1",
        ],
    },
    {
        "id": "zenodo_19391230",
        "name": "Cow Udder Mastitis Visual Detection Dataset",
        "source": "Zenodo",
        "url": "https://zenodo.org/records/19391230",
        "format": "ZIP",
        "size_mb": None,
        "modality": "rgb_photo",
        "labels": ["healthy", "mastitis"],
        "access": "restricted_403",
        "notes": "RGB udder photos for binary classification.",
        "download_urls": [
            "https://zenodo.org/records/19391230/files/dataset.zip?download=1",
        ],
    },
    {
        "id": "github_fishmaster93",
        "name": "FishMaster93/Cow_mastitis – Image Classification Code",
        "source": "GitHub",
        "url": "https://github.com/FishMaster93/Cow_mastitis",
        "format": "Python scripts (no image data in repo)",
        "size_mb": 0.02,
        "modality": "rgb_photo",
        "labels": ["healthy", "subclinical", "clinical"],
        "access": "public",
        "notes": "CNN classification code for cow mastitis. Companion dataset not included in repo.",
        "download_urls": [
            "https://raw.githubusercontent.com/FishMaster93/Cow_mastitis/main/S1.py",
            "https://raw.githubusercontent.com/FishMaster93/Cow_mastitis/main/S2.py",
        ],
    },
    {
        "id": "github_gssi_detection",
        "name": "gssi/mastitis-detection – ML Pipeline with Image Features",
        "source": "GitHub",
        "url": "https://github.com/gssi/mastitis-detection",
        "format": "Parquet (pre-extracted image features + labels)",
        "size_mb": 1.4,
        "modality": "feature_extracted",
        "labels": ["healthy", "subclinical", "clinical"],
        "access": "public",
        "notes": "Pre-extracted image feature vectors (CNN embeddings) stored as parquet.",
        "download_urls": [],
    },
    {
        "id": "kaggle_sivaprathish",
        "name": "Kaggle – Mastitis Disease Detection (sivaprathishsiva)",
        "source": "Kaggle",
        "url": "https://www.kaggle.com/datasets/sivaprathishsiva/mastitis-disease-detection",
        "format": "ZIP (labeled udder images)",
        "size_mb": None,
        "modality": "rgb_photo",
        "labels": ["healthy", "mastitis"],
        "access": "requires_kaggle_auth",
        "notes": "Labeled bovine udder photos. Requires Kaggle account + API key.",
        "download_urls": [],
    },
    {
        "id": "kaggle_amithaditya",
        "name": "Kaggle – Cow Mastitis from Milk Images (amithadityacp)",
        "source": "Kaggle",
        "url": "https://www.kaggle.com/datasets/amithadityacp/cow-mastitisfrom-milk",
        "format": "ZIP (images + CSV labels)",
        "size_mb": None,
        "modality": "rgb_photo",
        "labels": ["healthy", "mild", "severe"],
        "access": "requires_kaggle_auth",
        "notes": "Milk appearance images for mastitis grading. Requires Kaggle API key.",
        "download_urls": [],
    },
    {
        "id": "roboflow_bovine_mastitis",
        "name": "Roboflow Universe – Bovine Mastitis Udder Detection (YOLO)",
        "source": "Roboflow",
        "url": "https://universe.roboflow.com/search?q=mastitis+cow",
        "format": "YOLO annotation (images + labels)",
        "size_mb": None,
        "modality": "rgb_photo_annotated",
        "labels": ["udder", "mastitis_region", "healthy_udder"],
        "access": "requires_roboflow_api_key",
        "notes": "Object detection datasets for mastitis udder region localization.",
        "download_urls": [],
    },
]


def try_download(url: str, dest: str) -> bool:
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = resp.read()
        if len(data) < 500 or b"<html" in data[:200].lower():
            return False
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        with open(dest, "wb") as f:
            f.write(data)
        print(f"  ✓ Downloaded: {dest} ({len(data)//1024} KB)")
        return True
    except urllib.error.HTTPError as e:
        print(f"  ✗ HTTP {e.code}: {url}")
        return False
    except Exception as e:
        print(f"  ✗ Error: {e}")
        return False


print("=" * 60)
print("BOVINE MASTITIS IMAGE DATASET DOWNLOADER")
print("=" * 60)

for ds in IMAGE_DATASET_CATALOG:
    print(f"\n[{ds['id']}] {ds['name']}")
    print(f"  Access: {ds['access']} | Modality: {ds['modality']}")

    if ds["access"] == "public" and ds["download_urls"]:
        dest_dir = os.path.join(IMAGES_DIR, ds["id"])
        os.makedirs(dest_dir, exist_ok=True)
        for url in ds["download_urls"]:
            fname = url.split("/")[-1].split("?")[0]
            dest = os.path.join(dest_dir, fname)
            try_download(url, dest)
        ds["local_path"] = dest_dir
        ds["downloaded"] = True
    elif ds["access"] == "restricted_403" and ds["download_urls"]:
        print(f"  ℹ  Attempting download (may fail — login required)...")
        dest_dir = os.path.join(IMAGES_DIR, ds["id"])
        os.makedirs(dest_dir, exist_ok=True)
        success = False
        for url in ds["download_urls"]:
            fname = url.split("/")[-1].split("?")[0]
            dest = os.path.join(dest_dir, fname)
            if try_download(url, dest):
                success = True
                break
        ds["local_path"] = dest_dir if success else None
        ds["downloaded"] = success
        if not success:
            print(f"  ℹ  Login required. Manual download: {ds['url']}")
    else:
        print(f"  ℹ  Skipped (requires auth). Manual download: {ds['url']}")
        ds["local_path"] = None
        ds["downloaded"] = False

    time.sleep(0.5)

# ── Write catalog JSON ──────────────────────────────────────────────────────────
catalog_path = os.path.join(IMAGES_DIR, "dataset_catalog.json")
with open(catalog_path, "w", encoding="utf-8") as f:
    json.dump(IMAGE_DATASET_CATALOG, f, indent=2, ensure_ascii=False)
print(f"\n✓ Catalog written: {catalog_path}")

# ── Write README ────────────────────────────────────────────────────────────────
readme_path = os.path.join(IMAGES_DIR, "README.md")
readme = """# Bovine Mastitis Image Datasets

This folder catalogs all known **image-based** bovine mastitis datasets used in or referenced by MooTracker.
Unlike the tabular datasets (SCC, EC, milk yield), these contain **RGB photos or thermal IR images** of cow udders.

## Usage in MooTracker

Image datasets are used in **two ways**:
1. **Visual Scan Screen** — uploaded udder photos are analyzed using computer vision + ML model inference
2. **Dataset matching** — scan results are compared against labeled clinical cases from these datasets

## Dataset Catalog

| ID | Name | Source | Modality | Access | Size |
|----|------|--------|----------|--------|------|
"""

for ds in IMAGE_DATASET_CATALOG:
    size = f"{ds['size_mb']} MB" if ds["size_mb"] else "Unknown"
    readme += f"| `{ds['id']}` | {ds['name'][:45]}... | {ds['source']} | {ds['modality']} | {ds['access']} | {size} |\n"

readme += """
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
"""

with open(readme_path, "w", encoding="utf-8") as f:
    f.write(readme)
print(f"✓ README written: {readme_path}")

print("\n" + "=" * 60)
print("SUMMARY")
print("=" * 60)
downloaded = [d for d in IMAGE_DATASET_CATALOG if d.get("downloaded")]
skipped = [d for d in IMAGE_DATASET_CATALOG if not d.get("downloaded")]
print(f"Downloaded : {len(downloaded)} dataset(s)")
print(f"Skipped    : {len(skipped)} dataset(s) (auth required)")
print(f"Catalog    : {catalog_path}")
print(f"README     : {readme_path}")
print("\nTo download restricted datasets, see README.md instructions.")
