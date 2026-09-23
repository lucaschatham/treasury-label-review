"""Freeze independent full-label font pairs before classifier tuning."""
import hashlib
import json
import pathlib
import re
import subprocess
import textwrap

ROOT = pathlib.Path('test/fixtures/generated/appearance-holdout-v3')
ROOT.mkdir(parents=True, exist_ok=True)
PAIRS = [
    ('PT-Sans-Narrow', 'PT-Sans-Narrow', 'PT-Sans-Narrow-Bold'),
    ('Bodoni-72', 'Bodoni-72-Book', 'Bodoni-72-Bold'),
    ('Cochin', 'Cochin', 'Cochin-Bold'),
    ('Rockwell', 'Rockwell', 'Rockwell-Bold'),
    ('Iowan-Old-Style', 'Iowan-Old-Style-Roman', 'Iowan-Old-Style-Bold'),
    ('Menlo', 'Menlo-Regular', 'Menlo-Bold'),
    ('Marion', 'Marion-Regular', 'Marion-Bold'),
    ('Chalkboard', 'Chalkboard', 'Chalkboard-Bold'),
]
LAYOUTS = [(29, 220, 620), (33, 380, 700), (37, 90, 780),
           (41, 550, 740), (45, 280, 860)]
WARNING = ('(1) According to the Surgeon General, women should not drink '
           'alcoholic beverages during pregnancy because of the risk of birth '
           'defects. (2) Consumption of alcoholic beverages impairs your ability '
           'to drive a car or operate machinery, and may cause health problems.')

font_listing = subprocess.check_output(['magick', '-list', 'font'], text=True)
font_records = {}
for entry in re.split(r'(?=^  Font: )', font_listing, flags=re.MULTILINE):
    match = re.search(r'^  Font: ([^\n]+)', entry, flags=re.MULTILINE)
    if match:
        font_records[match.group(1)] = dict(re.findall(r'^    ([a-z]+): ([^\n]+)', entry, flags=re.MULTILINE))

def font_metadata(name):
    info = font_records.get(name)
    if not info or not info.get('glyphs') or not pathlib.Path(info['glyphs']).is_file():
        raise RuntimeError(f'Font face unavailable: {name}')
    return {
        'fontFamily': info['family'],
        'fontStyle': info['style'],
        'fontWeight': int(info['weight']),
        'fontIndex': int(info.get('index', '0')),
        'fontSha256': hashlib.sha256(pathlib.Path(info['glyphs']).read_bytes()).hexdigest(),
    }

labels = []
for family, regular, bold in PAIRS:
    regular_metadata, bold_metadata = font_metadata(regular), font_metadata(bold)
    if regular_metadata['fontWeight'] >= bold_metadata['fontWeight']:
        raise RuntimeError(f'Font weights are not ordered for {family}')
    for layout, (size, x, y) in enumerate(LAYOUTS):
        for is_bold, font, metadata in [(False, regular, regular_metadata),
                                        (True, bold, bold_metadata)]:
            name = f'{family}-{layout}-'+('bold' if is_bold else 'regular')
            args = ['magick', '-size', '1600x1200', 'xc:white', '-fill', '#151515',
                    '-font', 'Helvetica-Bold', '-pointsize', '60', '-annotate', '+110+130', 'HOLDOUT HARBOR',
                    '-font', 'Helvetica', '-pointsize', '34', '-annotate', '+110+235', 'Kentucky Straight Bourbon Whiskey',
                    '-annotate', '+830+335', '45% Alc./Vol. (90 Proof)',
                    '-annotate', '+110+335', '750 mL', '-pointsize', '28',
                    '-annotate', '+110+440', 'Produced by Holdout Harbor, Portland, OR',
                    '-font', font, '-pointsize', str(size), '-annotate', f'+{x}+{y}', 'GOVERNMENT WARNING:',
                    '-font', 'Helvetica', '-pointsize', '26']
            for line_no, line in enumerate(textwrap.wrap(WARNING, 76)):
                args += ['-annotate', f'+110+{y+62+line_no*38}', line]
            file = ROOT / (name + '.png')
            subprocess.run(args + ['-strip', str(file)], check=True)
            labels.append({
                'id': name, 'file': file.name, 'family': family, 'font': font,
                'size': size, 'x': x, 'y': y, 'layout': layout, 'headingBold': is_bold,
                'sha256': hashlib.sha256(file.read_bytes()).hexdigest(), **metadata,
            })

manifest = {
    'scope': 'Third independent full-label appearance holdout. Eight unseen font families, five paired layouts, 40 bold and 40 regular images. Synthetic evidence only.',
    'renderer': subprocess.check_output(['magick', '-version'], text=True).splitlines()[0],
    'labels': labels,
}
(ROOT / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n')
pathlib.Path('evidence/appearance-holdout-v3-frozen.json').write_text(json.dumps(manifest, indent=2) + '\n')
print(f'Frozen {len(labels)} paired label images')
