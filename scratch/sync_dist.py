import shutil
import os
import re
import glob

root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
dist_assets = os.path.join(root, 'mobile-app', 'dist', 'assets')

# Find the newly built JS file
js_files = glob.glob(os.path.join(dist_assets, 'index-*.js'))
css_files = glob.glob(os.path.join(dist_assets, 'index-*.css'))

if not js_files:
    print('ERROR: No JS file found in mobile-app/dist/assets')
    exit(1)

built_js = js_files[0]
built_css = css_files[0] if css_files else None
js_name = os.path.basename(built_js)
css_name = os.path.basename(built_css) if built_css else None

print(f'Found JS: {js_name}')
print(f'Found CSS: {css_name}')

target_dirs = [
    os.path.join(root, 'dist-pages', 'assets'),
    os.path.join(root, 'dist-pages', 'app', 'assets'),
    os.path.join(root, 'assets'),
]

for d in target_dirs:
    os.makedirs(d, exist_ok=True)
    shutil.copy2(built_js, os.path.join(d, js_name))
    if built_css:
        shutil.copy2(built_css, os.path.join(d, css_name))
    print(f'Copied to {d}')

# Copy index.html to dist-pages destinations
dist_index = os.path.join(root, 'mobile-app', 'dist', 'index.html')
shutil.copy2(dist_index, os.path.join(root, 'dist-pages', 'app', 'index.html'))
shutil.copy2(dist_index, os.path.join(root, 'dist-pages', 'mobile.html'))
print('Updated dist-pages/app/index.html and dist-pages/mobile.html')

# Update root mobile.html references to new bundle
mobile_path = os.path.join(root, 'mobile.html')
with open(mobile_path, 'r', encoding='utf-8') as f:
    mob = f.read()

mob = re.sub(r'src="\./assets/index-[^"]+\.js"', f'src="./assets/{js_name}"', mob)
if css_name:
    mob = re.sub(r'href="\./assets/index-[^"]+\.css"', f'href="./assets/{css_name}"', mob)

with open(mobile_path, 'w', encoding='utf-8') as f:
    f.write(mob)
print(f'Updated mobile.html -> {js_name}')
