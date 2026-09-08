"""
Explore GitHub repos and download all data files.
Targets: gssi/mastitis-detection, FishMaster93/Cow_mastitis
"""
import urllib.request
import json
import os
import sys
import time

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "Accept": "application/vnd.github.v3+json"
}

DATA_EXTENSIONS = {
    ".csv", ".tsv", ".xlsx", ".xls", ".json", ".parquet",
    ".sav", ".dta", ".mat", ".rda", ".rds", ".pkl", ".npz",
    ".gz", ".zip", ".rar", ".7z", ".h5", ".hdf5", ".db", ".sqlite"
}

def github_contents(owner, repo, path=""):
    url = f"https://api.github.com/repos/{owner}/{repo}/contents/{path}"
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return json.loads(r.read().decode("utf-8"))
    except Exception as e:
        print(f"  API error at {path}: {e}")
        return []

def walk_and_collect(owner, repo, path="", depth=0):
    items = github_contents(owner, repo, path)
    data_files = []
    for item in items:
        name = item.get("name", "")
        itype = item.get("type", "")
        size = item.get("size", 0)
        dl_url = item.get("download_url", "")
        ipath = item.get("path", "")
        indent = "  " * depth
        if itype == "file":
            ext = os.path.splitext(name)[1].lower()
            marker = " <-- DATA" if ext in DATA_EXTENSIONS else ""
            print(f"{indent}FILE | {name} | {size} bytes{marker}")
            if ext in DATA_EXTENSIONS:
                data_files.append({"name": name, "path": ipath, "size": size, "url": dl_url})
        elif itype == "dir":
            print(f"{indent}DIR  | {name}/")
            if depth < 4:
                sub = walk_and_collect(owner, repo, ipath, depth + 1)
                data_files.extend(sub)
    return data_files

def download_file(url, dest, label=""):
    if os.path.exists(dest) and os.path.getsize(dest) > 100:
        print(f"  EXISTS: {label}")
        return True
    req = urllib.request.Request(url, headers={"User-Agent": HEADERS["User-Agent"]})
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            data = r.read()
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        with open(dest, "wb") as f:
            f.write(data)
        print(f"  OK: {label} ({len(data)//1024} KB)")
        return True
    except Exception as e:
        print(f"  FAIL: {label} -> {e}")
        return False


# ── GSSI mastitis-detection ────────────────────────────────────────────────────
print("=" * 60)
print("REPO: gssi/mastitis-detection")
print("=" * 60)
gssi_data = walk_and_collect("gssi", "mastitis-detection")

print(f"\nFound {len(gssi_data)} data file(s) in gssi/mastitis-detection:")
for f in gssi_data:
    print(f"  {f['path']} ({f['size']//1024} KB) -> {f['url']}")

for f in gssi_data:
    dest = os.path.join("downloaded_data", "gssi", f["path"].replace("gssi/mastitis-detection/", "").replace("/", os.sep))
    download_file(f["url"], dest, f["name"])
    time.sleep(0.3)

# Also download ALL scripts (not just data) from gssi for full context
print("\nDownloading ALL scripts from gssi/mastitis-detection...")
def download_all_scripts(owner, repo, path="", base_dest=""):
    items = github_contents(owner, repo, path)
    for item in items:
        name = item.get("name", "")
        itype = item.get("type", "")
        dl_url = item.get("download_url", "")
        ipath = item.get("path", "")
        if itype == "file" and dl_url:
            ext = os.path.splitext(name)[1].lower()
            if ext in (".py", ".ipynb", ".r", ".R", ".sql", ".sh", ".txt", ".md"):
                rel = ipath.replace(f"{owner}/{repo}/", "").replace("/", os.sep)
                dest = os.path.join(base_dest, rel)
                download_file(dl_url, dest, name)
                time.sleep(0.2)
        elif itype == "dir":
            download_all_scripts(owner, repo, ipath, base_dest)

download_all_scripts("gssi", "mastitis-detection", "", os.path.join("downloaded_data", "gssi"))

# ── FishMaster93/Cow_mastitis ─────────────────────────────────────────────────
print("\n" + "=" * 60)
print("REPO: FishMaster93/Cow_mastitis")
print("=" * 60)
fish_data = walk_and_collect("FishMaster93", "Cow_mastitis")

print(f"\nFound {len(fish_data)} data file(s) in FishMaster93/Cow_mastitis:")
for f in fish_data:
    print(f"  {f['path']} ({f['size']//1024} KB)")

# Read S1.py to find any embedded data or dataset references
print("\nReading FishMaster S1.py for data references...")
s1_path = os.path.join("downloaded_data", "fishmaster", "S1.py")
if os.path.exists(s1_path):
    with open(s1_path, "r", encoding="utf-8", errors="replace") as f:
        content = f.read()
    # Find data loading lines
    for i, line in enumerate(content.splitlines()):
        if any(kw in line.lower() for kw in ["read_csv", "read_excel", "open(", "dataset", "data", "load"]):
            print(f"  L{i+1}: {line.strip()}")
        if i > 200:
            break

# Download all files from FishMaster
for f in fish_data:
    dest = os.path.join("downloaded_data", "fishmaster", os.path.basename(f["name"]))
    download_file(f["url"], dest, f["name"])
    time.sleep(0.3)

# ── Kaggle dataset info ────────────────────────────────────────────────────────
print("\n" + "=" * 60)
print("KAGGLE: amithadityacp/cow-mastitisfrom-milk")
print("=" * 60)
print("Checking if kaggle CLI is available...")
import subprocess
result = subprocess.run(["kaggle", "datasets", "download",
                         "amithadityacp/cow-mastitisfrom-milk",
                         "--path", os.path.join("downloaded_data", "kaggle_amithadityacp"),
                         "--unzip"],
                        capture_output=True, text=True)
print("STDOUT:", result.stdout)
print("STDERR:", result.stderr)
print("Return code:", result.returncode)
