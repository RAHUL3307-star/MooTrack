# 🐄 Bovine Clinical Mastitis & Teat Condition Image Dataset

This dataset provides high-resolution photographic samples of clinical bovine mastitis, teat-end lesions, hyperkeratosis, chemical trauma, and normal healthy teats for deep learning and visual AI diagnostic models.

---

## 📊 Dataset Structure & Statistics

- **Total Images:** 187 images
- **Dataset Catalog Index:** [`dataset_catalog.json`](./dataset_catalog.json)
- **Source Archive:** `datasets/bovine_mastitis_clinical_images.zip`

### Category Breakdown:
| Category | Directory | Image Count | Description |
|---|---|---|---|
| **Clinical Mastitis & Lesions** | `mastitis/` | 170 images | Acute & subclinical mastitis, hyperkeratosis rings (Grades 1-4), chemical burns, teat edema, papillomas, petechial hemorrhages |
| **Healthy Normal Teats** | `normal_teats/` | 10 images | Smooth teat-end baseline controls (NMC Grade 1), unblemished sphincter orifices |
| **General Reference Samples** | `general_samples/` | 7 images | Macro field photographs of bovine udder and teat presentations |

---

## 🔬 Clinical Classification Reference (NMC Standards)

1. **Hyperkeratosis & Ring Formation:**
   - Smooth ring (Grade 2) vs Rough / Very Rough fronds (Grade 3 & 4)
   - Orifice keratin buildup and sphincter patency assessment

2. **Erythema & Chemical Irritation:**
   - Pre/post-dip barrier residue, chlorine burn, teat-skin drying

3. **Trauma & Vascular Stress:**
   - Machine milking vacuum crease lines, blue teats, petechial hemorrhages

---

## 💻 Machine Learning Integration

Images in this dataset can be used to train and evaluate CNN / Vision Transformer (ViT) classification models for:
- Binary Classification: `Healthy` vs `Mastitis / Lesion`
- Multi-class Lesion Grading: `Normal`, `Hyperkeratosis`, `Chemical Burn / Erythema`, `Severe Infection`
- Integration with MooTracker's Multi-Modal Fusion Engine (combining visual scores with ESP32 SCC & Conductivity telemetry).
