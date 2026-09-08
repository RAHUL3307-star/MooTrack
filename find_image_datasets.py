import urllib.request
import json
import os
import sys

headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}

def search_zenodo():
    print("Searching Zenodo for mastitis image datasets...")
    url = "https://zenodo.org/api/records?q=mastitis%20image&size=10"
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=20) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            hits = data.get('hits', {}).get('hits', [])
            print(f"Found {len(hits)} records on Zenodo:")
            for h in hits:
                meta = h.get('metadata', {})
                print(f"- ID: {h.get('id')} | Title: {meta.get('title')}")
                files = h.get('files', [])
                for f in files:
                    print(f"   * {f.get('key')} ({f.get('size')} bytes)")
            return hits
    except Exception as e:
        print("Error querying Zenodo:", e)
        return []

if __name__ == "__main__":
    search_zenodo()
