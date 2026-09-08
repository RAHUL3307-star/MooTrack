import urllib.request
import json

mendeley_list = [
    ('d8kgk57b9h', '3'),
    ('vhds87r252', '2'),
    ('mvmp258dsh', '1'),
    ('hd7gh8nc46', '1'),
    ('gk2g6vsrym', '1')
]

for did, ver in mendeley_list:
    url = f'https://data.mendeley.com/api/datasets/{did}/files?version={ver}'
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req) as resp:
            files = json.loads(resp.read().decode('utf-8'))
            print(f'=== Mendeley {did}/{ver} ===')
            for f in files:
                fname = f.get('filename')
                fsize = f.get('size')
                furl = f.get('content_details', {}).get('download_url')
                print(f'  - File: {fname} | Size: {fsize} bytes | URL: {furl}')
    except Exception as e:
        print(f'Mendeley {did}/{ver} Error:', e)
