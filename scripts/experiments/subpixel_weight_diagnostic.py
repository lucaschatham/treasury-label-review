"""R-038: sub-pixel stroke thickness and a capitals-only body reference on the frozen R-037 images.

Re-measures the R-037 images (hash-verified) with two preregistered changes:
  1. thickness from antialiased ink mass per stroke crossing instead of integer run lengths;
  2. a second reference arm that measures only the body's capital letters (A, S, G, C).
No rendering changes, training, cloud, holdout access or runtime change.

Usage:
  python3 scripts/experiments/subpixel_weight_diagnostic.py \
      --r037 <R-037 output directory> --output <fresh file path>
"""
import argparse, hashlib, json, math, sys, textwrap
from pathlib import Path
import numpy as np
from PIL import Image, ImageFont

sys.path.insert(0, str(Path(__file__).parent))
from relative_weight_diagnostic import BODY, INK, FAMILIES, DISPLAY, CAP_HEIGHTS

def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()

def crossing_mass(profile):
    """Per-pixel sub-pixel crossing width along one 1-D ink profile (values in 0..1)."""
    n = len(profile)
    out = np.zeros(n, dtype=np.float32)
    binary = profile > .5
    x = 0
    while x < n:
        if not binary[x]:
            x += 1
            continue
        start = x
        while x < n and binary[x]:
            x += 1
        lo, hi = max(0, start - 1), min(n, x + 1)  # include antialiased edge pixels
        out[start:x] = profile[lo:hi].sum()
    return out

def subpixel_thickness(gray, box, mask=None):
    x0, y0, x1, y1 = box
    region = 1 - gray[y0:y1, x0:x1].astype(np.float32) / 255
    ink = region > .5
    if mask is not None:
        ink &= mask
    if ink.sum() < 20:
        return None, int(ink.sum())
    horizontal = np.stack([crossing_mass(row) for row in region])
    vertical = np.stack([crossing_mass(col) for col in region.T]).T
    local = np.minimum(horizontal, vertical)
    return float(np.median(local[ink])), int(ink.sum())

def capital_mask(row, faces, box):
    """Mask of the body's capital-letter columns, from the same wrapping and font metrics used to render it."""
    face = faces[(row['bodyFamily'], row['bodyWeight'])]
    font = ImageFont.truetype(face, row['bodyPixelSize'])
    lines = textwrap.wrap(BODY, 78)
    gap = int(row['bodyPixelSize'] * 1.35)
    x0, y0, x1, y1 = box
    mask = np.zeros((y1 - y0, x1 - x0), dtype=bool)
    # Body layer origin inside the composed image: (20, 40 + heading.height); text drawn at (20, 20 + i*gap) on that layer.
    origin_x = 20 + 20
    origin_y = row['bodyLayerTop'] + 20
    for i, line in enumerate(lines):
        for j, ch in enumerate(line):
            if ch.isupper():
                cx0 = origin_x + font.getlength(line[:j]); cx1 = origin_x + font.getlength(line[:j + 1])
                cy0 = origin_y + i * gap; cy1 = cy0 + gap
                mask[max(0, int(cy0) - y0):max(0, int(cy1) - y0), max(0, int(cx0) - x0):max(0, int(math.ceil(cx1)) - x0)] = True
    return mask

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--r037', required=True)
    parser.add_argument('--output', required=True)
    args = parser.parse_args()
    src = Path(args.r037); out = Path(args.output)
    if out.exists():
        raise ValueError('Refusing to overwrite existing output')
    r037 = json.loads((src / 'result.json').read_text())
    faces = {(f['family'], f['weight']): f['file'] for f in r037['fonts']}
    rows = []
    for row in r037['rows']:
        path = src / 'images' / row['file']
        assert sha(path) == row['fileSha256'], row['id']
        gray = np.asarray(Image.open(path).convert('L'))
        hb, bb = row['boxes']['heading'], row['boxes']['body']
        # compose() pasted the body layer at y = 40 + heading.height, where heading.height is the
        # heading font bbox height + 40 (render_text). Recompute it deterministically from the same face/size.
        hfont = ImageFont.truetype(faces[(row['headingFamily'], row['headingWeight'])], row['headingPixelSize'])
        _, top, _, bottom = hfont.getbbox('GOVERNMENT WARNING:')
        row = dict(row, bodyLayerTop=40 + (bottom - top + 40))
        ht, hn = subpixel_thickness(gray, hb)
        bt, bn = subpixel_thickness(gray, bb)
        ct, cn = subpixel_thickness(gray, bb, capital_mask(row, faces, bb))
        hcap, bcap = row['headingCap'], row['bodyCap']
        rows.append(dict(id=row['id'], arm=row['arm'], headingFamily=row['headingFamily'], headingWeight=row['headingWeight'],
                         bodyFamily=row['bodyFamily'], bodyWeight=row['bodyWeight'], targetCap=row['targetCap'], headingCap=hcap, bodyCap=bcap,
                         jpeg=row['jpeg'], file=row['file'], fileSha256=row['fileSha256'],
                         headingThickness=ht, bodyThickness=bt, capitalsThickness=ct, headingInkPixels=hn, bodyInkPixels=bn, capitalsInkPixels=cn,
                         absolute=(ht / hcap) if ht else None,
                         relativeWhole=((ht / hcap) / (bt / bcap)) if ht and bt else None,
                         relativeCapitals=((ht / hcap) / (ct / bcap)) if ht and ct else None))

    def evaluate(key):
        dev = [r for r in rows if r['arm'] in ('S', 'L') and r[key] is not None]
        bold = [r for r in dev if r['headingWeight'] == 700]; regular = [r for r in dev if r['headingWeight'] == 400]
        bmin, rmax = min(r[key] for r in bold), max(r[key] for r in regular)
        overlap = sorted([r['id'] for r in regular if r[key] >= bmin] + [r['id'] for r in bold if r[key] <= rmax])
        by_cap = {}
        for cap in CAP_HEIGHTS:
            cb = [r[key] for r in bold if r['targetCap'] == cap]; cr = [r[key] for r in regular if r['targetCap'] == cap]
            by_cap[cap] = dict(boldMin=min(cb), regularMax=max(cr), separated=min(cb) > max(cr))
        by_arm = {}
        for arm in ('S', 'L'):
            ab = [r[key] for r in bold if r['arm'] == arm]; ar = [r[key] for r in regular if r['arm'] == arm]
            by_arm[arm] = dict(boldMin=min(ab), regularMax=max(ar), separated=min(ab) > max(ar))
        mid = (bmin + rmax) / 2
        per_family = {}
        for family in FAMILIES:
            fb = [r for r in bold if r['headingFamily'] == family]; fr = [r for r in regular if r['headingFamily'] == family]
            per_family[family] = dict(boldRetained=f"{sum(r[key] > mid for r in fb)}/{len(fb)}", regularFalse=f"{sum(r[key] > mid for r in fr)}/{len(fr)}",
                                      boldMin=min(r[key] for r in fb), regularMax=max(r[key] for r in fr))
        display_self = [r[key] for r in rows if r['arm'] == 'DISPLAY-over-self' and r[key] is not None]
        display_light = [r[key] for r in rows if r['arm'] == 'DISPLAY-over-light' and r[key] is not None]
        body_bold = [r[key] for r in rows if r['arm'] == 'B7' and r[key] is not None]
        return dict(boldMinimum=bmin, regularMaximum=rmax, overlap=overlap, gapMidpoint=mid, byCapHeight=by_cap, byArm=by_arm, perFamily=per_family,
                    displayOverSelfMax=max(display_self), displayOverSelfBelowBoldMinimum=max(display_self) < bmin,
                    displayOverLightMin=min(display_light), bodyBoldMax=max(body_bold), bodyBoldBelowBoldMinimum=max(body_bold) < bmin)

    evaluation = {k: evaluate(k) for k in ('relativeWhole', 'relativeCapitals', 'absolute')}
    def verdict(e):
        if e['overlap'] or not e['displayOverSelfBelowBoldMinimum']:
            at20 = [i for i in e['overlap'] if int(i.split('-')[-2]) >= 20]
            return 'FAIL' if at20 or not e['displayOverSelfBelowBoldMinimum'] else 'PARTIAL'
        return 'PASS-DEVELOPMENT'
    decisions = {k: verdict(evaluation[k]) for k in ('relativeWhole', 'relativeCapitals')}
    result = dict(experiment='R-038', decision=decisions, scope='Perfect-location re-measurement of frozen R-037 images; not OCR localization, real-label accuracy or browser timing',
                  sourceResultSha256=sha(src / 'result.json'), codeSha256=sha(__file__), r037CodeSha256=r037['codeSha256'],
                  evaluation=evaluation, rows=rows, images=len(rows))
    out.write_text(json.dumps(result, indent=1, allow_nan=False))
    brief = {k: {kk: evaluation[k][kk] for kk in ['boldMinimum', 'regularMaximum', 'byCapHeight', 'byArm', 'displayOverSelfMax', 'bodyBoldMax']} | dict(overlapCount=len(evaluation[k]['overlap'])) for k in evaluation}
    print(json.dumps(dict(decision=decisions, evaluation=brief), indent=1))

if __name__ == '__main__':
    main()
