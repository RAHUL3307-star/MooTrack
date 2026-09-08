import urllib.request, urllib.error, json, os, time, sys

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

HEADERS = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)", "Accept": "application/json"}
TIMEOUT_IDS = ["19391230", "2660878", "20763985"]

for rid in TIMEOUT_IDS:
    print(f"\n--- Zenodo {rid} ---")
    url = f"https://zenodo.org/api/records/{rid}"
    req = urllib.request.Request(url, headers=HEADERS)
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            data = json.loads(r.read().decode("utf-8"))
    except Exception as e:
        print(f"  METADATA ERROR: {e}")
        time.sleep(3)
        continue

    meta = data.get("metadata", {})
    title = meta.get("title", "Unknown")
    access = meta.get("access_right", "unknown")
    files = data.get("files", [])
    print(f"  Title: {title}")
    print(f"  Access: {access} | Files: {len(files)}")

    folder = os.path.join("downloaded_data", f"zenodo_{rid}")
    os.makedirs(folder, exist_ok=True)

    for f in files:
        fname = f.get("key") or f.get("filename") or "file"
        fsize = f.get("size", 0)
        links = f.get("links") or {}
        furl = links.get("self") or f"https://zenodo.org/records/{rid}/files/{fname}?download=1"
        dest = os.path.join(folder, fname)
        print(f"  -> {fname} ({fsize//1024} KB)")
        if os.path.exists(dest) and os.path.getsize(dest) > 200:
            print(f"     Already exists, skipping")
            continue
        req2 = urllib.request.Request(furl, headers=HEADERS)
        try:
            with urllib.request.urlopen(req2, timeout=120) as r2:
                fdata = r2.read()
            with open(dest, "wb") as fp:
                fp.write(fdata)
            print(f"     OK: {len(fdata)//1024} KB")
        except Exception as e:
            print(f"     FAIL: {e}")

    time.sleep(2)

print("\nDone.")
