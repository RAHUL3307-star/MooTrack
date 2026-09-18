import os
import subprocess
import shutil
import sys

def main():
    root_dir = os.path.dirname(os.path.abspath(__file__))
    android_dir = os.path.join(root_dir, 'mootracker-expo', 'android')
    gradlew = os.path.join(android_dir, 'gradlew.bat')
    keystore = os.path.join(root_dir, 'mootracker-release.jks')
    signer_jar = os.path.join(root_dir, 'uber-apk-signer.jar')
    signed_out_dir = os.path.join(root_dir, 'signed-out')
    dest_apk = os.path.join(root_dir, 'MooTracker.apk')
    dist_apk = os.path.join(root_dir, 'dist-pages', 'MooTracker.apk')
    
    jdk_path = r"C:\Program Files\Microsoft\jdk-17.0.20.101-hotspot"
    env = os.environ.copy()
    if os.path.exists(jdk_path):
        env['JAVA_HOME'] = jdk_path
        env['PATH'] = os.path.join(jdk_path, 'bin') + os.pathsep + env.get('PATH', '')

    print("[1/4] Building standalone Android Release APK via Gradle...")
    res = subprocess.run([gradlew, 'assembleRelease'], cwd=android_dir, env=env)
    if res.returncode != 0:
        print("Error: Gradle assembleRelease failed.")
        sys.exit(res.returncode)

    built_apk = os.path.join(android_dir, 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk')
    if not os.path.exists(built_apk):
        print(f"Error: Output APK not found at {built_apk}")
        sys.exit(1)

    print(f"[2/4] Signing APK with stable release keystore ({keystore})...")
    os.makedirs(signed_out_dir, exist_ok=True)
    java_exe = os.path.join(jdk_path, 'bin', 'java.exe') if os.path.exists(jdk_path) else 'java'
    sign_cmd = [
        java_exe, '-jar', signer_jar,
        '-a', built_apk,
        '--ks', keystore,
        '--ksAlias', 'mootracker',
        '--ksPass', 'mootracker123',
        '--ksKeyPass', 'mootracker123',
        '--allowResign',
        '-o', signed_out_dir
    ]
    res = subprocess.run(sign_cmd, cwd=root_dir, env=env)
    if res.returncode != 0:
        print("Error: APK signing failed.")
        sys.exit(res.returncode)

    signed_apk = os.path.join(signed_out_dir, 'app-release-aligned-signed.apk')
    if not os.path.exists(signed_apk):
        print(f"Error: Signed APK not found at {signed_apk}")
        sys.exit(1)

    print("[3/4] Copying signed release APK to root & dist-pages...")
    shutil.copyfile(signed_apk, dest_apk)
    os.makedirs(os.path.dirname(dist_apk), exist_ok=True)
    shutil.copyfile(signed_apk, dist_apk)

    size_mb = os.path.getsize(dest_apk) / (1024 * 1024)
    print(f"[4/4] SUCCESS! MooTracker.apk created ({size_mb:.2f} MB).")
    print("This APK is fully bundled offline and does NOT require Metro, localhost, or your laptop.")

if __name__ == '__main__':
    main()
