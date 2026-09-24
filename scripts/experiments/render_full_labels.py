"""Render full synthetic label artwork for OCR-located weight-contrast experiments (R-039, R-040).

Layout follows the corpus style: brand, class/type, ABV, net contents, producer, then the complete
government warning with the heading in the requested weight and the body in the body weight.
Output: <output>/<id>.png|jpg and <output>/manifest.json with font/image hashes and expected outcomes. Fonts are not redistributed.

Usage: python3 scripts/experiments/render_full_labels.py --fonts <dir> --faces <dir from R-037 faces/>
         --families a,b,c --output <fresh dir> [--display alfaslabone] [--body-bold]
"""
import argparse, hashlib, json, sys, textwrap, time
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
sys.path.insert(0, str(Path(__file__).parent))
from relative_weight_diagnostic import BODY, HEADING, instance_faces, cap_size, ink_bbox

LONGEST_SIDE = 1800   # the application reduces uploads to this longest side
CAP_HEIGHTS = [16, 20, 28, 40]
FIELDS = [('OLD TOM DISTILLERY', 84), ('Kentucky Straight Bourbon Whiskey', 44), ('45% Alc./Vol. (90 Proof)', 38), ('750 mL', 38), ('Produced by Old Tom Distillery, Bardstown, KY', 32)]  # fixed pixel sizes

def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()

def render(heading_face, heading_size, body_face, body_size, jpeg, path, ink=(21, 21, 21), background='white', brand=None):
    """Draw on a tall canvas, then crop to content so the longest side stays at LONGEST_SIDE."""
    width = LONGEST_SIDE
    canvas = Image.new('RGB', (width, 2400), background)
    draw = ImageDraw.Draw(canvas)
    y = 80
    for text, size in FIELDS:
        if brand and size == FIELDS[0][1]: text = brand
        font = ImageFont.truetype(body_face, size)
        draw.text((90, y), text, font=font, fill=ink)
        y += int(size * 1.6)
    y += int(body_size * 1.5)
    hfont = ImageFont.truetype(heading_face, heading_size)
    draw.text((100, y), HEADING, font=hfont, fill=ink)
    left, top, right, bottom = hfont.getbbox(HEADING)
    heading_box = [100 + left, y + top, 100 + right, y + bottom]
    y += bottom - top + int(body_size * .8)
    bfont = ImageFont.truetype(body_face, body_size)
    per_line = max(30, int((width - 200) / (bfont.getlength('n') * 1.05)))
    for line in textwrap.wrap(BODY, per_line):
        draw.text((100, y), line, font=bfont, fill=ink)
        y += int(body_size * 1.35)
    height = min(canvas.height, y + 80)
    if height > width:
        raise ValueError('Layout overflow')
    canvas = canvas.crop((0, 0, width, height))
    if jpeg:
        path = path.with_suffix('.jpg'); canvas.save(path, quality=75)
    else:
        canvas.save(path)
    return path, heading_box

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--fonts', required=True); parser.add_argument('--output', required=True)
    parser.add_argument('--families', required=True); parser.add_argument('--display', default='')
    parser.add_argument('--body-bold', action='store_true', help='also render bold-body control arms')
    parser.add_argument('--conditions', default='16-png,20-png,28-png,28-jpeg,40-png')
    parser.add_argument('--ink', default='151515', help='hex ink colour')
    parser.add_argument('--background', default='ffffff', help='hex background colour')
    parser.add_argument('--suffix', default='', help='id suffix for colour arms')
    parser.add_argument('--distinct-brand', action='store_true', help='give every label its own brand name (LABEL NNN) for association tests')
    args = parser.parse_args()
    fonts, out = Path(args.fonts), Path(args.output)
    out.mkdir(parents=True, exist_ok=False)
    families = args.families.split(','); started = time.monotonic()
    faces = {f: instance_faces(fonts, f, out) for f in families + ([args.display] if args.display else [])}
    conditions = [(int(c.split('-')[0]), c.split('-')[1] == 'jpeg') for c in args.conditions.split(',')]
    ink = tuple(int(args.ink[i:i + 2], 16) for i in (0, 2, 4)); background = '#' + args.background
    rows = []
    def add(id, arm, hfam, hw, bfam, bw, cap, jpeg, expected):
        hface, bface = faces[hfam][hw]['file'], faces[bfam][bw]['file']
        hsize, hcap = cap_size(hface, cap); bsize, bcap = cap_size(bface, cap)
        id = id + args.suffix
        brand = f'LABEL {len(rows) + 1:03d} DISTILLERY' if args.distinct_brand else FIELDS[0][0]
        path, hbox = render(hface, hsize, bface, bsize, jpeg, out / f'{id}.png', ink, background, brand)
        rows.append(dict(id=id, arm=arm, headingFamily=hfam, headingWeight=hw, bodyFamily=bfam, bodyWeight=bw, targetCap=cap, headingCap=hcap, bodyCap=bcap,
                         jpeg=jpeg, file=path.name, fileSha256=sha(path), renderedHeadingBox=hbox, expected=expected, brand=brand))
    for family in families:
        for cap, jpeg in conditions:
            fmt = 'jpeg' if jpeg else 'png'
            add(f'{family}-h400-b400-{cap}-{fmt}', 'statement', family, 400, family, 400, cap, jpeg, 'REVIEW')
            add(f'{family}-h700-b400-{cap}-{fmt}', 'statement', family, 700, family, 400, cap, jpeg, 'MATCH')
            if args.body_bold and not jpeg:
                add(f'{family}-h700-b700-{cap}-{fmt}', 'body-bold', family, 700, family, 700, cap, jpeg, 'REVIEW')
    if args.display:
        for cap, jpeg in conditions:
            fmt = 'jpeg' if jpeg else 'png'
            add(f'{args.display}-h400-{families[0]}400-{cap}-{fmt}', 'display-over-light', args.display, 400, families[0], 400, cap, jpeg, 'MATCH')
            add(f'{args.display}-h400-self-{cap}-{fmt}', 'display-over-self', args.display, 400, args.display, 400, cap, jpeg, 'REVIEW')
    (out / 'manifest.json').write_text(json.dumps(dict(codeSha256=sha(__file__), longestSide=LONGEST_SIDE, conditions=args.conditions, ink=args.ink, background=args.background,
        fonts=[v for f in faces.values() for v in f.values()], rows=rows, seconds=time.monotonic() - started), indent=1))
    print('rendered', len(rows), 'labels in', round(time.monotonic() - started, 1), 's')

if __name__ == '__main__':
    main()
