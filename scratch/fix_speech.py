import sys

with open('mobile-app/src/i18n/speech.ts', 'rb') as f:
    raw = f.read()

target1 = b'isolate Cow 1 and Cow 8 right away with veterinary antibiotic and Mastilep treatment.";\r\n    }\r\n  },'
idx1 = raw.find(target1)
print('idx1 found:', idx1)

target2 = b'  animals: (lang: string) => {'
idx2 = raw.find(target2)
print('idx2 found:', idx2)

if idx1 != -1 and idx2 != -1:
    cut_start = idx1 + len(target1)
    cut_end = idx2
    corrupted_part = raw[cut_start:cut_end]
    print('Corrupted part length:', len(corrupted_part))
    cleaned = raw[:cut_start] + b'\r\n' + raw[cut_end:]
    try:
        decoded = cleaned.decode('utf-8')
        print('Cleaned successfully decodes as valid UTF-8! Total length:', len(decoded))
        with open('mobile-app/src/i18n/speech.ts', 'wb') as out_f:
            out_f.write(cleaned)
        print('Saved cleaned mobile-app/src/i18n/speech.ts')
    except UnicodeDecodeError as e:
        print('Still has decode error:', e)
else:
    print('Failed to find targets!')
