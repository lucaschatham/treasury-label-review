"""Defect corpus for verifying the field, wording and appearance findings on the current build.

For each family, renders one label per variant with pinned OFL fonts and records, per label, the
application values to submit and the finding status expected for every field. Variants:
valid, wrong-abv, wrong-volume, wrong-brand, altered-wording, title-case-heading, missing-warning,
regular-heading, brand-case (label "Stone's Throw", application "STONE'S THROW"),
fl-oz (label 25.36 FL OZ, application 750 mL), imported (label "Product of France").

Usage: python3 scripts/experiments/render_defect_corpus.py --fonts <dir> --families a,b --output <fresh dir> [--cap 28]
"""
import argparse, hashlib, json, sys, textwrap, time
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
sys.path.insert(0, str(Path(__file__).parent))
from relative_weight_diagnostic import BODY, HEADING, instance_faces, cap_size

WIDTH = 1800
APPLICATION = dict(brand='OLD TOM DISTILLERY', type='Kentucky Straight Bourbon Whiskey', abv='45', volume='750 mL', producer='Old Tom Distillery, Bardstown, KY')
FIELDS = ['Brand name', 'Class / type', 'Alcohol content', 'Net contents', 'Producer / address', 'Country of origin', 'Government warning', 'Warning appearance']
ALL_MATCH = dict(zip(FIELDS, ['match', 'match', 'match', 'match', 'match', 'skip', 'match', 'match']))

def variants():
    v = []
    def add(name, heading_weight=700, expected=None, application=None, **label):
        e = dict(ALL_MATCH); e.update(expected or {})
        a = dict(APPLICATION); a.update(application or {})
        v.append(dict(name=name, headingWeight=heading_weight, expected=e, application=a, label=label))
    add('valid')
    add('wrong-abv', abv='40% Alc./Vol. (80 Proof)', expected={'Alcohol content': 'mismatch'})
    add('wrong-volume', volume='700 mL', expected={'Net contents': 'mismatch'})
    add('wrong-brand', brand='OLD TIM DISTILLERY', expected={'Brand name': 'review'})
    add('altered-wording', body=BODY.replace('should not drink', 'should drink'), expected={'Government warning': 'review'})
    add('title-case-heading', heading='Government Warning:', expected={'Government warning': 'review', 'Warning appearance': 'review'})
    add('missing-warning', heading='', body='', expected={'Government warning': 'review', 'Warning appearance': 'review'})
    add('regular-heading', heading_weight=400, expected={'Warning appearance': 'review'})
    add('brand-case', brand="Stone's Throw", application={'brand': "STONE'S THROW"})
    add('fl-oz', volume='25.36 FL OZ')
    add('imported', origin='Product of France', application={'imported': 'true', 'country': 'France'}, expected={'Country of origin': 'match'})
    return v

def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()

def render(spec, hface, hsize, bface, bsize, path):
    label = spec['label']
    canvas = Image.new('RGB', (WIDTH, 2400), 'white'); draw = ImageDraw.Draw(canvas); ink = (21, 21, 21)
    y = 80
    for text, size in [(label.get('brand', APPLICATION['brand']), 84), (APPLICATION['type'], 44), (label.get('abv', '45% Alc./Vol. (90 Proof)'), 38),
                       (label.get('volume', '750 mL'), 38), ('Produced by Old Tom Distillery, Bardstown, KY', 32)] + ([(label['origin'], 32)] if label.get('origin') else []):
        draw.text((90, y), text, font=ImageFont.truetype(bface, size), fill=ink); y += int(size * 1.6)
    y += int(bsize * 1.5)
    heading = label.get('heading', HEADING); body = label.get('body', BODY)
    if heading:
        hfont = ImageFont.truetype(hface, hsize); draw.text((100, y), heading, font=hfont, fill=ink)
        _, top, _, bottom = hfont.getbbox(heading); y += bottom - top + int(bsize * .8)
    if body:
        bfont = ImageFont.truetype(bface, bsize); per_line = max(30, int((WIDTH - 200) / (bfont.getlength('n') * 1.05)))
        for line in textwrap.wrap(body, per_line):
            draw.text((100, y), line, font=bfont, fill=ink); y += int(bsize * 1.35)
    canvas = canvas.crop((0, 0, WIDTH, min(2400, y + 80))); canvas.save(path)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--fonts', required=True); parser.add_argument('--families', required=True)
    parser.add_argument('--output', required=True); parser.add_argument('--cap', type=int, default=28)
    args = parser.parse_args()
    fonts, out = Path(args.fonts), Path(args.output); out.mkdir(parents=True, exist_ok=False)
    started = time.monotonic(); rows = []
    faces = {f: instance_faces(fonts, f, out) for f in args.families.split(',')}
    for family, face in faces.items():
        for spec in variants():
            hface, bface = face[spec['headingWeight']]['file'], face[400]['file']
            hsize, hcap = cap_size(hface, args.cap); bsize, bcap = cap_size(bface, args.cap)
            id = f"{family}-{spec['name']}-{args.cap}"; path = out / f'{id}.png'
            render(spec, hface, hsize, bface, bsize, path)
            rows.append(dict(id=id, family=family, variant=spec['name'], headingWeight=spec['headingWeight'], targetCap=args.cap, file=path.name, fileSha256=sha(path),
                             application=spec['application'], expectedFindings=spec['expected'], brand=spec['application']['brand'] + f' #{len(rows) + 1}'))
    (out / 'manifest.json').write_text(json.dumps(dict(codeSha256=sha(__file__), cap=args.cap, fonts=[v for f in faces.values() for v in f.values()], rows=rows, seconds=time.monotonic() - started), indent=1))
    print('rendered', len(rows), 'labels in', round(time.monotonic() - started, 1), 's')

if __name__ == '__main__':
    main()
