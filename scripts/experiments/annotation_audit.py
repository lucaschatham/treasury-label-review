"""Validate blinded development annotations without claiming reviewer independence.

Inputs use the existing manual review packet's embedded JSON and downloaded
assessment schema. This validates provenance links and eligibility, not truth.
"""
import math


def audit(packet, export):
    if export.get('schema') != 1 or not str(export.get('reviewer') or '').strip():
        raise ValueError('Review schema and named reviewer required')
    if not packet.get('manifestSha256') or export.get('sourceManifestSha256') != packet['manifestSha256']:
        raise ValueError('Source manifest mismatch')
    cases = {case['id']: case for case in packet['cases']}
    if len(cases) != len(packet['cases']):
        raise ValueError('Duplicate source IDs')
    rows = export['assessments']
    ids = [row['id'] for row in rows]
    if len(ids) != len(set(ids)) or set(ids) != set(cases):
        raise ValueError('Assessments must cover each source exactly once')
    result = {key: [] for key in ('clearBold', 'clearRegular', 'absent', 'ambiguous', 'degraded', 'unreadable')}
    for row in rows:
        case = cases[row['id']]
        if row.get('sourceSha256') != case['sha256']:
            raise ValueError('Source image mismatch')
        if not isinstance(row.get('rationale'), str) or not row['rationale'].strip():
            raise ValueError('Assessment rationale required')
        heading, clarity = row.get('heading'), row.get('readability')
        if heading not in {'BOLD', 'REGULAR', 'AMBIGUOUS', 'ABSENT'}:
            raise ValueError('Missing or invalid heading assessment')
        if clarity not in {'CLEAR', 'DEGRADED', 'UNREADABLE'}:
            raise ValueError('Missing or invalid readability')
        box = row.get('bbox')
        eligible = heading in {'BOLD', 'REGULAR'} and clarity == 'CLEAR'
        if eligible and box is None:
            raise ValueError('Clear heading requires a source-pixel box')
        if box is not None:
            values = [box.get(key) for key in ('x0', 'y0', 'x1', 'y1')]
            if any(type(v) not in (int, float) or not math.isfinite(v) for v in values):
                raise ValueError('Invalid box coordinates')
            x0, y0, x1, y1 = values
            if not (0 <= x0 < x1 <= case['width'] and 0 <= y0 < y1 <= case['height']):
                raise ValueError('Box outside source or empty')
        # Disjoint coverage: absence/ambiguity take precedence over readability.
        if heading == 'ABSENT':
            key = 'absent'
        elif heading == 'AMBIGUOUS':
            key = 'ambiguous'
        elif not eligible:
            key = 'degraded' if clarity == 'DEGRADED' else 'unreadable'
        else:
            key = 'clearBold' if heading == 'BOLD' else 'clearRegular'
        result[key].append(row['id'])
    return result
