import urllib.request
import os
import sys
import time

OUTPUT_DIR = os.path.join("datasets", "images")
os.makedirs(OUTPUT_DIR, exist_ok=True)

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
}

def try_download_tids():
    urls = [
        "https://zenodo.org/records/15619247/files/TIDS%20Dataset.zip?download=1",
        "https://zenodo.org/api/records/15619247/files/TIDS%20Dataset.zip/content"
    ]
    
    zip_path = os.path.join(OUTPUT_DIR, "TIDS_Thermal_Mastitis_Dataset.zip")
    
    for url in urls:
        print(f"Attempting download from: {url}")
        try:
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=30) as resp:
                total_size = int(resp.headers.get('content-length', 0))
                print(f"Connected! Size: {total_size} bytes ({total_size / (1024*1024):.2f} MB)")
                
                downloaded = 0
                block_size = 1024 * 1024  # 1MB chunks
                
                with open(zip_path, 'wb') as f:
                    while True:
                        chunk = resp.read(block_size)
                        if not chunk:
                            break
                        f.write(chunk)
                        downloaded += len(chunk)
                        if total_size > 0:
                            percent = (downloaded / total_size) * 100
                            print(f"\rProgress: {percent:.1f}% ({downloaded / (1024*1024):.1f} MB / {total_size / (1024*1024):.1f} MB)", end="")
                        else:
                            print(f"\rDownloaded: {downloaded / (1024*1024):.1f} MB", end="")
                print("\nDownload complete!")
                return True
        except Exception as e:
            print(f"\nFailed for {url}: {e}")
            time.sleep(2)
    return False

if __name__ == "__main__":
    try_download_tids()
