import zipfile
import io
import hashlib
import base64
import datetime
import os
from PIL import Image
from cryptography import x509
from cryptography.x509.oid import NameOID
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives.serialization import pkcs7

def main():
    in_apk = 'MooTracker.apk'
    out_apk = 'MooTracker.apk'
    temp_apk = 'MooTracker_fixed.apk'

    # Load source icon (full bleed, opaque green background)
    icon_512 = Image.open('icon-512.png').convert('RGB')
    print(f"Loaded icon-512.png ({icon_512.size}), corners: {[icon_512.getpixel((0,0)), icon_512.getpixel((511,0))]}")

    files_dict = {}

    with zipfile.ZipFile(in_apk, 'r') as zin:
        for item in zin.infolist():
            filename = item.filename
            if filename.startswith('META-INF/') and (
                filename.endswith('.SF') or filename.endswith('.RSA') or 
                filename.endswith('.DSA') or filename.endswith('MANIFEST.MF')
            ):
                continue  # skip old signatures

            data = zin.read(filename)

            if filename.endswith('.png') and not filename.endswith('.9.png'):
                try:
                    im = Image.open(io.BytesIO(data))
                    if im.mode in ('RGB', 'RGBA'):
                        c0 = im.getpixel((0,0))
                        c1 = im.getpixel((im.width - 1, 0))
                        c2 = im.getpixel((0, im.height - 1))
                        c3 = im.getpixel((im.width - 1, im.height - 1))
                        # Check if any corner is white
                        corners = [c0, c1, c2, c3]
                        is_white = any(
                            (c[0] > 230 and c[1] > 230 and c[2] > 230) 
                            for c in corners if len(c) >= 3
                        )
                        if is_white:
                            # Replace with clean full-bleed icon resized to exact dimensions
                            new_im = icon_512.resize(im.size, Image.Resampling.LANCZOS)
                            buf = io.BytesIO()
                            new_im.save(buf, format='PNG')
                            data = buf.getvalue()
                            print(f"Fixed white corners in APK resource: {filename} ({im.size})")
                except Exception as e:
                    print(f"Error checking {filename}: {e}")

            files_dict[filename] = data

    # Generate MANIFEST.MF
    manifest_lines = ['Manifest-Version: 1.0\r\nCreated-By: 1.0 (Android)\r\n\r\n']
    manifest_sections = {}

    for filename in sorted(files_dict.keys()):
        digest = base64.b64encode(hashlib.sha256(files_dict[filename]).digest()).decode('ascii')
        section = f"Name: {filename}\r\nSHA-256-Digest: {digest}\r\n\r\n"
        manifest_lines.append(section)
        manifest_sections[filename] = section.encode('utf-8')

    manifest_content = ''.join(manifest_lines).encode('utf-8')

    # Generate CERT.SF
    manifest_b64 = base64.b64encode(hashlib.sha256(manifest_content).digest()).decode('ascii')
    sf_lines = [
        'Signature-Version: 1.0\r\n',
        'Created-By: 1.0 (Android)\r\n',
        f'SHA-256-Digest-Manifest: {manifest_b64}\r\n\r\n'
    ]

    for filename in sorted(files_dict.keys()):
        section_digest = base64.b64encode(hashlib.sha256(manifest_sections[filename]).digest()).decode('ascii')
        sf_lines.append(f"Name: {filename}\r\nSHA-256-Digest: {section_digest}\r\n\r\n")

    sf_content = ''.join(sf_lines).encode('utf-8')

    # Generate RSA Key & Self-Signed Certificate
    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    subject = issuer = x509.Name([
        x509.NameAttribute(NameOID.COUNTRY_NAME, 'IN'),
        x509.NameAttribute(NameOID.ORGANIZATION_NAME, 'MooTracker'),
        x509.NameAttribute(NameOID.COMMON_NAME, 'MooTracker'),
    ])
    cert = (
        x509.CertificateBuilder()
        .subject_name(subject)
        .issuer_name(issuer)
        .public_key(key.public_key())
        .serial_number(x509.random_serial_number())
        .not_valid_before(datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=1))
        .not_valid_after(datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(days=3650))
        .sign(key, hashes.SHA256())
    )

    # Sign CERT.SF with PKCS#7 (DER)
    builder = pkcs7.PKCS7SignatureBuilder().set_data(sf_content).add_signer(cert, key, hashes.SHA256())
    rsa_content = builder.sign(serialization.Encoding.DER, options=[pkcs7.PKCS7Options.DetachedSignature])

    # Write output APK
    with zipfile.ZipFile(temp_apk, 'w', compression=zipfile.ZIP_DEFLATED) as zout:
        # Write META-INF signature files
        zout.writestr('META-INF/MANIFEST.MF', manifest_content)
        zout.writestr('META-INF/CERT.SF', sf_content)
        zout.writestr('META-INF/CERT.RSA', rsa_content)

        # Write all modified app files
        for filename in sorted(files_dict.keys()):
            zout.writestr(filename, files_dict[filename])

    # Overwrite original APK
    if os.path.exists(temp_apk):
        if os.path.exists(out_apk):
            os.remove(out_apk)
        os.rename(temp_apk, out_apk)
        print(f"Successfully updated and signed {out_apk} (size: {os.path.getsize(out_apk)} bytes)")

if __name__ == '__main__':
    main()
