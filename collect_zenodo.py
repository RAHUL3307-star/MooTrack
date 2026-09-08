"""
Zenodo Dataset Collector - fetch metadata + download files for all 9 records.
Uses the lightweight urllib (no User-Agent that triggers rate-limit blocks).
"""

import urllib.request
import urllib.error
import json
import os
import time
import sys

# Force UTF-8 output on Windows
if sys.stdout.encoding != "utf-8":
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

DOWNLOADED_DIR = "downloaded_data"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "Accept": "application/json",
}

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
        with urllib.request.urlopen(req, timeout=20) as r:
            return json.loads(r.read().decode("utf-8")), None
    except urllib.error.HTTPError as e:
        return None, f"HTTP {e.code}"
    except Exception as e:
        return None, str(e)


def download_file(url, dest_path, label=""):
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            data = r.read()
        # Skip cloudflare / HTML error pages
        if len(data) < 500 and (b"<html" in data[:200].lower() or b"forbidden" in data[:200].lower()):
            print(f"  BLOCKED {label}: HTML error page ({len(data)} bytes)")
            return False
        os.makedirs(os.path.dirname(dest_path), exist_ok=True)
        with open(dest_path, "wb") as f:
            f.write(data)
        print(f"  OK  {label}: {len(data)//1024} KB -> {os.path.basename(dest_path)}")
        return True
    except Exception as e:
        print(f"  ERR {label}: {e}")
        return False


results = {}

for rid in ZENODO_IDS:
    print(f"\n{'='*60}")
    print(f"Zenodo {rid}")
    data, err = zenodo_api(rid)
    if err:
        print(f"  FAILED: {err}")
        results[rid] = {"status": err, "files": []}
        time.sleep(1)
        continue

    meta = data.get("metadata", {})
    title = meta.get("title", "Unknown")
    access = meta.get("access_right", "unknown")
    files = data.get("files", [])

    print(f"  Title : {title}")
    print(f"  Access: {access} | Files: {len(files)}")

    folder = os.path.join(DOWNLOADED_DIR, f"zenodo_{rid}")
    os.makedirs(folder, exist_ok=True)

    rec_files = []
    if access in ("open", "embargoed") or files:
        for f in files:
            fname = f.get("key") or f.get("filename") or "file"
            fsize = f.get("size", 0)
            links = f.get("links") or {}
            furl = links.get("self") or \
                   f"https://zenodo.org/records/{rid}/files/{fname}?download=1"
            dest = os.path.join(folder, fname)
            print(f"  -> {fname} ({fsize//1024} KB)")
            if os.path.exists(dest) and os.path.getsize(dest) > 200:
                print(f"     Already exists, skipping")
                ok = True
            else:
                ok = download_file(furl, dest, label=fname)
            rec_files.append({
                "filename": fname, "size": fsize,
                "url": furl, "downloaded": ok
            })
    else:
        print(f"  RESTRICTED — access type: {access}")

    results[rid] = {
        "title": title,
        "access": access,
        "status": "ok",
        "files": rec_files
    }
    time.sleep(2)

print("\n" + "="*60)
print("ZENODO RESULTS SUMMARY")
print("="*60)
for rid, rec in results.items():
    n_ok = sum(1 for f in rec.get("files", []) if f.get("downloaded"))
    n_total = len(rec.get("files", []))
    print(f"  {rid}: {rec.get('status','?')} | {rec.get('access','?')} | {n_ok}/{n_total} files downloaded")
    if rec.get("title"):
        print(f"         {rec['title'][:70]}")

with open("zenodo_download_results.json", "w", encoding="utf-8") as fp:
    json.dump(results, fp, indent=2, ensure_ascii=False)

print("\nSaved: zenodo_download_results.json")
