"""
Move downloaded files into datasets/ folder with clean organised names.
Converts/copies relevant data files (CSV, xlsx, parquet, SAV, RAR, zip)
into datasets/ with descriptive prefixed names.
"""
import os, shutil, sys

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

SRC = "downloaded_data"
DEST = "datasets"
os.makedirs(DEST, exist_ok=True)

# Map: (src_folder, src_filename, dest_filename)
COPY_MAP = [
    # Zenodo 7056828 – SCC / DSCC longitudinal milk data (CSV)
    ("zenodo_7056828", "milk_records.csv",
     "zenodo_7056828_scc_dscc_milk_records.csv"),

    # Zenodo 16479542 – Interpretable ML for subclinical mastitis (PDF – keep for reference)
    ("zenodo_16479542", None, None),   # PDF only – skip

    # Zenodo 18013106 – E.coli subclinical mastitis prevalence (PDF – skip)
    ("zenodo_18013106", None, None),

    # Zenodo 5733981 – Bacterial mastitis farms Bulgaria (PDF – skip)
    ("zenodo_5733981", None, None),

    # Zenodo 14908264 – Pathogen-specific SCC patterns dairy ewes
    ("zenodo_14908264", "Data_clean.dta",
     "zenodo_14908264_pathogen_scc_dairy_ewes.dta"),
    ("zenodo_14908264", "Data analysis.do",
     "zenodo_14908264_data_analysis.do"),
    ("zenodo_14908264", "Data_management.do",
     "zenodo_14908264_data_management.do"),

    # Zenodo 15619247 – TIDS Thermal Imaging Dataset (218 MB ZIP – keep in place)
    ("zenodo_15619247", None, None),

    # Mendeley d8kgk57b9h/v3 – SCC milk data RAR
    ("mendeley_d8kgk57b9h_v3", "data_SCC.rar",
     "mendeley_d8kgk57b9h_scc_milk_data.rar"),

    # Mendeley vhds87r252/v2 – herd mastitis SPSS datasets
    ("mendeley_vhds87r252_v2", "data set for 10 regular herds.sav",
     "mendeley_vhds87r252_10_regular_herds.sav"),
    ("mendeley_vhds87r252_v2", "data set for 2 mastitis controlled herds.sav",
     "mendeley_vhds87r252_2_mastitis_controlled_herds.sav"),

    # Mendeley mvmp258dsh/v1 – Brazilian mastitis base dataset
    ("mendeley_mvmp258dsh_v1", "base_dados.xlsx",
     "mendeley_mvmp258dsh_mastitis_brazil.xlsx"),

    # Mendeley hd7gh8nc46/v1 – supplementary figures/material
    ("mendeley_hd7gh8nc46_v1", "SUPPLEMENTARY FIGURES.docx",
     "mendeley_hd7gh8nc46_supplementary_figures.docx"),
    ("mendeley_hd7gh8nc46_v1", "SUPPLEMENTARY MATERIAL.docx",
     "mendeley_hd7gh8nc46_supplementary_material.docx"),

    # Mendeley gk2g6vsrym/v1 – mastitis cost practices PDF
    ("mendeley_gk2g6vsrym_v1", None, None),   # PDF only – skip

    # Figshare 31560957 – anonymized mastitis risk factors
    ("figshare", "pone.0329250.s001.xlsx",
     "figshare_31560957_mastitis_risk_factors.xlsx"),

    # GSSI balanced parquet
    ("gssi/temporary_datasets", "balanced_dataset.parquet",
     "gssi_balanced_mastitis_dataset.parquet"),
]

copied = []
skipped = []

for entry in COPY_MAP:
    folder, src_fname, dest_fname = entry
    if src_fname is None:
        continue
    src_path = os.path.join(SRC, folder, src_fname)
    if not os.path.exists(src_path):
        print(f"  MISSING: {src_path}")
        skipped.append(src_path)
        continue
    dest_path = os.path.join(DEST, dest_fname)
    if os.path.exists(dest_path):
        print(f"  EXISTS:  {dest_fname}")
        copied.append(dest_fname)
        continue
    shutil.copy2(src_path, dest_path)
    size = os.path.getsize(dest_path)
    print(f"  COPIED:  {dest_fname} ({size//1024} KB)")
    copied.append(dest_fname)

print(f"\nCopied  : {len(copied)} file(s)")
print(f"Skipped : {len(skipped)} file(s)")
print(f"\nDatasets folder contents:")
for f in sorted(os.listdir(DEST)):
    sz = os.path.getsize(os.path.join(DEST, f))
    print(f"  {f}  ({sz//1024} KB)")
