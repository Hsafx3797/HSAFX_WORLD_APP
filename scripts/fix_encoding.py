f = r'c:\Users\HSAFX\Desktop\VS_Code_Copilot\HSAFX_WORLD_APP\docs\DUST_BIN\ANALYTICS_AND_SOLUTION\FIRST_ANALYTICS.md'
with open(f, 'r', encoding='utf-8-sig') as fh:
    raw = fh.read()
raw = raw.replace('\u00e2\u20ac\u201d', '--')
raw = raw.replace('\u00e2\u2020\u2019', '->')
raw = raw.replace('\u00e2\u0153\u2026', '[x]')
raw = raw.replace('\u00e2\u20ac\u2019', "'")
raw = raw.replace('\u00e2\u20ac\u201c', '"')
with open(f, 'w', encoding='utf-8', newline='\n') as fh:
    fh.write(raw)
print('Done')
with open(f, 'r', encoding='utf-8') as fh:
    print(fh.read()[:300])
