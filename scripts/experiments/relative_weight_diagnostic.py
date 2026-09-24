"""R-037: heading-versus-body relative stroke weight at deployed cap heights.

Perfect-location measurement diagnostic on synthetic source-weight fixtures.
No training, cloud, holdout access or runtime change. See the R-037
preregistration in REQUIREMENTS.md for the frozen protocol and stop rule.

Usage:
  python3 scripts/experiments/relative_weight_diagnostic.py \
      --fonts <dir with <family>--<file>.ttf and <family>.OFL.txt> \
      --output <fresh directory>

Requires numpy, Pillow (FreeType) and fontTools. Fonts are not redistributed.
"""
import argparse, hashlib, json, logging, math, re, sys, textwrap, time
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont, features
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

logging.getLogger('fontTools').setLevel(logging.ERROR)
REVISION = 'b5efa9c32e8f9b63005f5cdb1ad5527a77d2cd04'
HEADING = 'GOVERNMENT WARNING:'
BODY = ('(1) According to the Surgeon General, women should not drink alcoholic beverages during pregnancy '
        'because of the risk of birth defects. (2) Consumption of alcoholic beverages impairs your ability to '
        'drive a car or operate machinery, and may cause health problems.')
CAP_HEIGHTS = [16, 20, 28, 40]
FAMILIES = ['averiaseriflibre', 'domine', 'karla', 'varta', 'cambay', 'arima', 'besley', 'andadapro', 'mulish',
            'asul', 'eczar', 'arvo', 'bitter', 'lora']
DISPLAY = 'alfaslabone'  # single-weight heavy face whose only style is named Regular (400)
INK = 128


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def instance_faces(fonts, family, out):
    """Return {weight: path} for 400/700 static faces, instancing variable fonts as R-035 did."""
    files = sorted(p for p in fonts.glob(f'{family}--*.ttf') if 'Italic' not in p.name)
    if not files:
        raise ValueError(f'No source for {family}')
    faces = {}
    for weight in ([400] if family == DISPLAY else [400, 700]):
        variable = [p for p in files if '[' in p.name]
        static = [p for p in files if p.name.endswith({400: '-Regular.ttf', 700: '-Bold.ttf'}[weight])]
        source = variable[0] if variable else static[0]
        font = TTFont(source)
        if 'fvar' in font:
            axes = {a.axisTag: a.defaultValue for a in font['fvar'].axes}
            axis = next(a for a in font['fvar'].axes if a.axisTag == 'wght')
            if not axis.minValue <= weight <= axis.maxValue:
                raise ValueError(f'{family}: weight {weight} outside range')
            axes['wght'] = weight
            font = instantiateVariableFont(font, axes, inplace=False)
        if font['OS/2'].usWeightClass != weight:
            raise ValueError(f'{family}: usWeightClass {font["OS/2"].usWeightClass} != {weight}')
        if not set(map(ord, 'GOVERNMENTWARNING:')).issubset(font.getBestCmap()):
            raise ValueError(f'{family}: missing Latin glyphs')
        target = out / 'faces' / f'{family}-{weight}.ttf'
        target.parent.mkdir(parents=True, exist_ok=True)
        font.save(target)
        faces[weight] = dict(family=family, weight=weight, file=str(target), fontSha256=sha(target),
                             sourceFile=source.name, sourceSha256=sha(source),
                             licenseSha256=sha(fonts / f'{family}.OFL.txt'))
    return faces


def ink_bbox(image):
    arr = np.asarray(image.convert('L'))
    ys, xs = np.where(arr < INK)
    if not len(xs):
        return None
    return int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1


def render_text(path, size, text):
    font = ImageFont.truetype(path, size)
    left, top, right, bottom = font.getbbox(text)
    canvas = Image.new('L', (right - left + 40, bottom - top + 40), 255)
    ImageDraw.Draw(canvas).text((20 - left, 20 - top), text, font=font, fill=0)
    return canvas


_cap_cache = {}


def cap_size(path, target):
    """Smallest integer pixel size whose rendered H ink height is closest to target; records actual height."""
    key = (path, target)
    if key not in _cap_cache:
        best = None
        for size in range(8, 200):
            box = ink_bbox(render_text(path, size, 'H'))
            height = box[3] - box[1]
            if best is None or abs(height - target) < abs(best[1] - target):
                best = (size, height)
            if height >= target:
                break
        _cap_cache[key] = best
    return _cap_cache[key]


def runs_along_axis(ink):
    """Per-pixel horizontal run length of ink (0 where no ink)."""
    h, w = ink.shape
    out = np.zeros((h, w), dtype=np.int32)
    for y in range(h):
        row = ink[y]
        x = 0
        while x < w:
            if not row[x]:
                x += 1
                continue
            start = x
            while x < w and row[x]:
                x += 1
            out[y, start:x] = x - start
    return out


def thickness(gray, box):
    x0, y0, x1, y1 = box
    ink = gray[y0:y1, x0:x1] < INK
    if ink.sum() < 20:
        return None
    local = np.minimum(runs_along_axis(ink), runs_along_axis(ink.T).T)
    return float(np.median(local[ink]))


def compose(heading_face, heading_size, body_face, body_size, jpeg, out_path):
    """Render heading and wrapped body on one white canvas; return image path and ink boxes."""
    heading = render_text(heading_face, heading_size, HEADING)
    hbox = ink_bbox(heading)
    body_lines = textwrap.wrap(BODY, 78)
    body_font = ImageFont.truetype(body_face, body_size)
    line_gap = int(body_size * 1.35)
    body = Image.new('L', (max(body_font.getbbox(l)[2] for l in body_lines) + 40, line_gap * len(body_lines) + 40), 255)
    draw = ImageDraw.Draw(body)
    for i, line in enumerate(body_lines):
        draw.text((20, 20 + i * line_gap), line, font=body_font, fill=0)
    bbox = ink_bbox(body)
    width = max(heading.width, body.width) + 40
    canvas = Image.new('RGB', (width, heading.height + body.height + 60), 'white')
    canvas.paste(heading.convert('RGB'), (20, 20))
    canvas.paste(body.convert('RGB'), (20, 40 + heading.height))
    boxes = dict(heading=[20 + hbox[0], 20 + hbox[1], 20 + hbox[2], 20 + hbox[3]],
                 body=[20 + bbox[0], 40 + heading.height + bbox[1], 20 + bbox[2], 40 + heading.height + bbox[3]])
    if jpeg:
        out_path = out_path.with_suffix('.jpg')
        canvas.save(out_path, quality=75)
    else:
        canvas.save(out_path)
    return out_path, boxes


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--fonts', required=True)
    parser.add_argument('--output', required=True)
    args = parser.parse_args()
    fonts, out = Path(args.fonts), Path(args.output)
    out.mkdir(parents=True, exist_ok=False)
    (out / 'images').mkdir()
    started = time.monotonic()
    faces = {f: instance_faces(fonts, f, out) for f in FAMILIES + [DISPLAY]}
    rows = []

    def measure(id, arm, heading_family, heading_weight, body_family, body_weight, cap, jpeg, ratio=1.0):
        hface = faces[heading_family][heading_weight]['file']
        bface = faces[body_family][body_weight]['file']
        hsize, hcap = cap_size(hface, cap)
        bsize, bcap = cap_size(bface, max(8, round(cap / ratio)))
        path, boxes = compose(hface, hsize, bface, bsize, jpeg, out / 'images' / f'{id}.png')
        gray = np.asarray(Image.open(path).convert('L'))
        ht, bt = thickness(gray, boxes['heading']), thickness(gray, boxes['body'])
        rel = (ht / hcap) / (bt / bcap) if ht and bt else None
        rows.append(dict(id=id, arm=arm, headingFamily=heading_family, headingWeight=heading_weight,
                         bodyFamily=body_family, bodyWeight=body_weight, targetCap=cap, headingCap=hcap, bodyCap=bcap,
                         headingPixelSize=hsize, bodyPixelSize=bsize, jpeg=jpeg, file=path.name, fileSha256=sha(path),
                         boxes=boxes, headingThickness=ht, bodyThickness=bt,
                         absolute=(ht / hcap) if ht else None, relative=rel))

    for family in FAMILIES:
        for cap in CAP_HEIGHTS:
            for jpeg in [False, True]:
                for hw in [400, 700]:
                    fmt = 'jpeg' if jpeg else 'png'
                    measure(f'{family}-h{hw}-b400-S-{cap}-{fmt}', 'S', family, hw, family, 400, cap, jpeg)
                    measure(f'{family}-h{hw}-b400-L-{cap}-{fmt}', 'L', family, hw, family, 400, cap, jpeg, 1.5)
                    measure(f'{family}-h{hw}-b700-S-{cap}-{fmt}', 'B7', family, hw, family, 700, cap, jpeg)
    for cap in CAP_HEIGHTS:
        for jpeg in [False, True]:
            fmt = 'jpeg' if jpeg else 'png'
            measure(f'{DISPLAY}-h400-karla400-S-{cap}-{fmt}', 'DISPLAY-over-light', DISPLAY, 400, 'karla', 400, cap, jpeg)
            measure(f'{DISPLAY}-h400-{DISPLAY}400-S-{cap}-{fmt}', 'DISPLAY-over-self', DISPLAY, 400, DISPLAY, 400, cap, jpeg)

    # Preregistered evaluation: body-400 arms (S and L), all cap heights >= 16.
    dev = [r for r in rows if r['arm'] in ('S', 'L') and r['relative'] is not None]
    bold = [r for r in dev if r['headingWeight'] == 700]
    regular = [r for r in dev if r['headingWeight'] == 400]
    rel_bold_min, rel_reg_max = min(r['relative'] for r in bold), max(r['relative'] for r in regular)
    abs_bold_min, abs_reg_max = min(r['absolute'] for r in bold), max(r['absolute'] for r in regular)
    overlap = [r['id'] for r in regular if r['relative'] >= rel_bold_min] + [r['id'] for r in bold if r['relative'] <= rel_reg_max]
    abs_overlap = [r['id'] for r in regular if r['absolute'] >= abs_bold_min] + [r['id'] for r in bold if r['absolute'] <= abs_reg_max]
    midpoint = (rel_bold_min + rel_reg_max) / 2
    per_family = {}
    for family in FAMILIES:
        fb = [r for r in bold if r['headingFamily'] == family]
        fr = [r for r in regular if r['headingFamily'] == family]
        per_family[family] = dict(boldRetained=f"{sum(r['relative'] > midpoint for r in fb)}/{len(fb)}",
                                  regularFalse=f"{sum(r['relative'] > midpoint for r in fr)}/{len(fr)}",
                                  boldMin=min(r['relative'] for r in fb), regularMax=max(r['relative'] for r in fr))
    by_cap = {}
    for cap in CAP_HEIGHTS:
        cb = [r['relative'] for r in bold if r['targetCap'] == cap]
        cr = [r['relative'] for r in regular if r['targetCap'] == cap]
        by_cap[cap] = dict(boldMin=min(cb), regularMax=max(cr), separated=min(cb) > max(cr))
    passed = not overlap and all(int(v['boldRetained'].split('/')[0]) >= math.ceil(.95 * int(v['boldRetained'].split('/')[1])) for v in per_family.values())
    overlap_at_20 = [i for i in overlap if int(i.split('-')[-2]) >= 20]
    decision = 'PASS-DEVELOPMENT' if passed else ('FAIL' if overlap_at_20 else 'PARTIAL')
    summary = dict(experiment='R-037', decision=decision, scope='Perfect-location synthetic measurement diagnostic; not OCR localization, real-label accuracy or browser timing',
                   revision=REVISION, codeSha256=sha(__file__), pillow=Image.__version__, freetype=features.version('freetype2'),
                   numpy=np.__version__, python=sys.version.split()[0],
                   relative=dict(boldMinimum=rel_bold_min, regularMaximum=rel_reg_max, overlap=overlap, gapMidpoint=midpoint, byCapHeight=by_cap, perFamily=per_family),
                   absolute=dict(boldMinimum=abs_bold_min, regularMaximum=abs_reg_max, overlapCount=len(abs_overlap), overlap=abs_overlap[:40]),
                   controls=dict(bodyBold=[dict(id=r['id'], relative=r['relative']) for r in rows if r['arm'] == 'B7'],
                                 display=[dict(id=r['id'], relative=r['relative'], absolute=r['absolute']) for r in rows if r['arm'].startswith('DISPLAY')]),
                   fonts=[v for f in faces.values() for v in f.values()], rows=rows, images=len(rows), seconds=time.monotonic() - started)
    (out / 'result.json').write_text(json.dumps(summary, indent=1, allow_nan=False))
    print(json.dumps({k: summary[k] for k in ['decision', 'images', 'seconds']} | dict(relative={k: summary['relative'][k] for k in ['boldMinimum', 'regularMaximum', 'overlap', 'byCapHeight']}, absolute={k: summary['absolute'][k] for k in ['boldMinimum', 'regularMaximum', 'overlapCount']}), indent=1))


if __name__ == '__main__':
    main()
