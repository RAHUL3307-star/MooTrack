import urllib.request

for tl in ['ta', 'hi', 'kn', 'te', 'mr', 'gu', 'pa', 'en']:
    try:
        url = f"http://localhost:3000/api/tts?tl={tl}&text=MooTracker"
        req = urllib.request.urlopen(url)
        content_type = req.headers.get('Content-Type')
        data = req.read()
        print(f"{tl}: status={req.status}, Content-Type={content_type}, bytes={len(data)}")
    except Exception as e:
        print(f"{tl}: ERROR: {e}")
