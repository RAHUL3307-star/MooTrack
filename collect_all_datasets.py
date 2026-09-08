"""
MooTracker Dataset Collector
Visits all dataset links, extracts metadata, and downloads available files.
"""

import urllib.request
import urllib.error
import json
import os
import time
import http.cookiejar

DATASETS_DIR = "datasets"
DOWNLOADED_DIR = "downloaded_data"
os.makedirs(DATASETS_DIR, exist_ok=True)
os.makedirs(DOWNLOADED_DIR, exist_ok=True)

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json"
}

# Zenodo record IDs to try
ZENODO_IDS = [
    "16479542",
    "7056828",
    "18013106",
    "5733981",
    "14908264",
    "15619247",
    "19391230",
    "2660878",
    "20763985",
]

def zenodo_api(record_id):
    url = f"https://zenodo.org/api/records/{record_id}"
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return json.loads(r.read().decode("utf-8")), None
    except urllib.error.HTTPError as e:
        return None, f"HTTP {e.code}"
    except Exception as e:
        return None, str(e)

def download_file(url, dest_path, headers=None, label=""):
    h = dict(HEADERS)
    if headers:
        h.update(headers)
    req = urllib.request.Request(url, headers=h)
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            data = r.read()
        if data[:100].lower().startswith(b"<html") or b"403 forbidden" in data[:200].lower():
            print(f"  FAIL {label}: received HTML/error (auth-gated)")
            return False
        os.makedirs(os.path.dirname(dest_path), exist_ok=True)
        with open(dest_path, "wb") as f:
            f.write(data)
        print(f"  OK {label}: {dest_path} ({len(data)//1024} KB)")
        return True
    except Exception as e:
        print(f"  FAIL {label}: {e}")
        return False

# ─── ZENODO ───────────────────────────────────────────────────────────────────
print("=" * 60)
print("ZENODO RECORDS")
print("=" * 60)

zenodo_results = []
for rid in ZENODO_IDS:
    data, err = zenodo_api(rid)
    if err:
        print(f"\nZenodo {rid}: FAILED - {err}")
        zenodo_results.append({"id": rid, "status": err, "files": []})
        continue

    meta = data.get("metadata", {})
    title = meta.get("title", "Unknown")
    access = meta.get("access_right", "unknown")
    files = data.get("files", [])
    print(f"\nZenodo {rid}: {title[:60]}")
    print(f"  Access: {access}, Files: {len(files)}")

    folder = os.path.join(DOWNLOADED_DIR, f"zenodo_{rid}")
    os.makedirs(folder, exist_ok=True)

    rec_files = []
    for f in files:
        fname = f.get("key") or f.get("filename") or "unknown"
        fsize = f.get("size", 0)
        furl = (f.get("links") or {}).get("self") or \
               f"https://zenodo.org/records/{rid}/files/{fname}?download=1"
        dest = os.path.join(folder, fname)
        print(f"  -> {fname} ({fsize//1024} KB)")
        if not os.path.exists(dest):
            ok = download_file(furl, dest, label=fname)
        else:
            print(f"     Already exists")
            ok = True
        rec_files.append({"filename": fname, "size": fsize, "url": furl, "downloaded": ok})

    zenodo_results.append({
        "id": rid, "title": title, "access": access, "status": "ok", "files": rec_files
    })
    time.sleep(1)

# ─── MENDELEY ─────────────────────────────────────────────────────────────────
print("\n" + "=" * 60)
print("MENDELEY DATA")
print("=" * 60)

MENDELEY = [
    ("d8kgk57b9h", "3"),
    ("vhds87r252", "2"),
    ("mvmp258dsh", "1"),
    ("hd7gh8nc46", "1"),
    ("gk2g6vsrym", "1"),
]

mendeley_results = []
for did, ver in MENDELEY:
    url = f"https://data.mendeley.com/api/datasets/{did}/files?version={ver}"
    req = urllib.request.Request(url, headers={"User-Agent": HEADERS["User-Agent"]})
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            files = json.loads(r.read().decode("utf-8"))
    except Exception as e:
        print(f"\nMendeley {did}/{ver}: FAILED - {e}")
        mendeley_results.append({"id": did, "version": ver, "status": str(e), "files": []})
        continue

    print(f"\nMendeley {did}/v{ver}: {len(files)} file(s)")
    folder = os.path.join(DOWNLOADED_DIR, f"mendeley_{did}_v{ver}")
    os.makedirs(folder, exist_ok=True)

    rec_files = []
    for f in files:
        fname = f.get("filename", "unknown")
        fsize = f.get("size", 0)
        furl = f.get("content_details", {}).get("download_url", "")
        dest = os.path.join(folder, fname)
        print(f"  -> {fname} ({fsize//1024} KB)")
        if not os.path.exists(dest):
            ok = download_file(furl, dest, label=fname)
        else:
            print(f"     Already exists")
            ok = True
        rec_files.append({"filename": fname, "size": fsize, "url": furl, "downloaded": ok})

    mendeley_results.append({"id": did, "version": ver, "status": "ok", "files": rec_files})
    time.sleep(1)

# ─── FIGSHARE ─────────────────────────────────────────────────────────────────
print("\n" + "=" * 60)
print("FIGSHARE")
print("=" * 60)

figshare_results = []
fig_dest = os.path.join(DOWNLOADED_DIR, "figshare", "pone.0329250.s001.xlsx")
if os.path.exists(fig_dest):
    print(f"Figshare already downloaded: {fig_dest}")
    figshare_results.append({"filename": "pone.0329250.s001.xlsx", "downloaded": True})
else:
    ok = download_file(
        "https://ndownloader.figshare.com/files/62486598",
        fig_dest, label="pone.0329250.s001.xlsx"
    )
    figshare_results.append({"filename": "pone.0329250.s001.xlsx", "downloaded": ok})

# ─── DRYAD ────────────────────────────────────────────────────────────────────
print("\n" + "=" * 60)
print("DRYAD - doi:10.5061/dryad.hhmgqnkp7")
print("=" * 60)

DRYAD_FILES = [
    {"id": "2994779", "name": "A._Proportion_of_IMI_animal.xlsx"},
    {"id": "2994783", "name": "B._Proportion_of_IMI_farm.xlsx"},
    {"id": "2994782", "name": "C._SCM_pathogens.xlsx"},
    {"id": "2994781", "name": "D_Pathogens_by_farms.xlsx"},
    {"id": "2994780", "name": "E._Proportion_of_pathogens.xlsx"},
    {"id": "2994840", "name": "README.md"},
]

dryad_folder = os.path.join(DOWNLOADED_DIR, "dryad_hhmgqnkp7")
os.makedirs(dryad_folder, exist_ok=True)
dryad_results = []

cj = http.cookiejar.CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj))
opener.addheaders = [
    ("User-Agent", HEADERS["User-Agent"]),
    ("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"),
]

try:
    with opener.open("https://datadryad.org/dataset/doi:10.5061/dryad.hhmgqnkp7", timeout=20) as r:
        _ = r.read()
    print("Dryad session established")
except Exception as e:
    print(f"Warning - Dryad session: {e}")

for item in DRYAD_FILES:
    fid, fname = item["id"], item["name"]
    dest = os.path.join(dryad_folder, fname)
    print(f"  -> {fname}")
    if os.path.exists(dest) and os.path.getsize(dest) > 500:
        print(f"     Already exists")
        dryad_results.append({**item, "downloaded": True})
        continue
    try:
        url = f"https://datadryad.org/downloads/file_stream/{fid}"
        with opener.open(url, timeout=60) as r:
            data = r.read()
        if len(data) < 200:
            print(f"  FAIL {fname}: tiny response ({len(data)} bytes)")
            dryad_results.append({**item, "downloaded": False})
        else:
            with open(dest, "wb") as fout:
                fout.write(data)
            print(f"  OK {fname}: {len(data)//1024} KB")
            dryad_results.append({**item, "downloaded": True})
    except Exception as e:
        print(f"  FAIL {fname}: {e}")
        dryad_results.append({**item, "downloaded": False})
    time.sleep(0.5)

# ─── SUMMARY ──────────────────────────────────────────────────────────────────
print("\n" + "=" * 60)
print("SUMMARY")
print("=" * 60)

all_results = {
    "zenodo": zenodo_results,
    "mendeley": mendeley_results,
    "figshare": figshare_results,
    "dryad": dryad_results,
}

with open("dataset_download_report.json", "w", encoding="utf-8") as fp:
    json.dump(all_results, fp, indent=2, ensure_ascii=False)

ok_count = 0
fail_count = 0
for source, records in all_results.items():
    for rec in records:
        flist = rec.get("files", [rec])
        for f in flist:
            if f.get("downloaded"):
                ok_count += 1
            else:
                fail_count += 1

print(f"\nDownloaded : {ok_count} file(s)")
print(f"Failed     : {fail_count} file(s)")
print(f"Report     : dataset_download_report.json")
print(f"Data dir   : {DOWNLOADED_DIR}/")
