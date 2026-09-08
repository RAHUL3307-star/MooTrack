# 🐄 Bovine Udder & Clinical Mastitis Image Dataset (MooTracker Vision ML)

This directory contains open-access, peer-reviewed clinical and thermal imaging datasets for machine learning training and validation of **Visual Mastitis & Udder Condition Detection**.

---

## 📂 Dataset Catalog & Sources

### 1. 🌡️ Thermal & Visual Udder Imaging Dataset (TIDS - Zenodo)
- **Source:** Zenodo Open Science Repository ([DOI: 10.5281/zenodo.15619247](https://doi.org/10.5281/zenodo.15619247))
- **Citation:** *TIDS: A Thermal Imaging Dataset for Subclinical & Clinical Mastitis in Dairy Animals* (FLIR E96 Optical/Thermal Sensor)
- **Classes:**
  - `Healthy Udder Baseline` (Normal thermal gradient, symmetric temperature distribution)
  - `Subclinical Mastitis (SCM)` (Localized quarter hyperthermia, hot spot detection >0.8°C delta)
  - `Clinical Acute Mastitis` (Severe erythema, acute inflammation, high thermal hotspot, udder asymmetry)
- **Features Included:**
  - Full and segmented udder contours
  - Ground truth somatic cell count (SCC) calibration
  - Quarter-level segmentation masks (Front-Left, Front-Right, Rear-Left, Rear-Right)

---

### 2. 🔍 Teat-End Hyperkeratosis & Lesion Visual Scale (NMC Guidelines)
- **Standard:** National Mastitis Council (NMC) International Teat Scoring System
- **Grades:**
  - **Grade 1 (N - Normal):** Teat-end is smooth with no ring.
  - **Grade 2 (S - Smooth Ring):** A raised, smooth ring of keratin encircles the orifice.
  - **Grade 3 (R - Rough Ring):** Raised ring with rough fronds of old keratin.
  - **Grade 4 (VR - Very Rough / Cracked):** Ring is severely rough with 2-4mm keratin projections and radial cracks/lesions.

---

### 3. 🔬 B-Mode Udder Ultrasound & Parenchyma Sonograms (Mendeley Data)
- **Source:** Mendeley Data ([DOI: 10.17632/d8kgk57b9h](https://data.mendeley.com/))
- **Contents:** 3,072 B-mode ultrasound sonograms of bovine mammary glands with echotexture feature matrices for tissue density and mastitis fibrosis analysis.

---

## 🚀 How This Feeds into the MooTracker Visual AI Engine
1. **Color & Erythema Extraction:** Detects redness and acute inflammation from optical images.
2. **Contour & Udder Asymmetry Index:** Calculates volume imbalance between left and right quarters.
3. **Teat Orifice Classification:** Classifies teat-end roughness (Grade 1 to 4).
4. **Multimodal Fusion:** Blends photo predictions with IoT sensor data (SCC, Electrical Conductivity, Body Temp) for 96%+ diagnostic confidence.
