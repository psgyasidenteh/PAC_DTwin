import re

with open('js/ui/analyticsView.js', 'r', encoding='utf-8') as f:
    lines = f.readlines()

print(f"Total lines: {len(lines)}")
for idx in range(930, 946):
    print(f"{idx+1}: {repr(lines[idx])}")
