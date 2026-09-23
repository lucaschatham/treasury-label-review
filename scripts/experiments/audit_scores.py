"""Retrospective diagnostics only; does not train or select a shipping threshold."""
import hashlib
import json
from collections import defaultdict
from pathlib import Path


def summarize(rows):
    bold = [r for r in rows if r['expected'] == 'BOLD']
    regular = [r for r in rows if r['expected'] == 'REGULAR']
    ceiling = max((r['score'] for r in regular), default=None)
    return dict(bold=len(bold), regular=len(regular), truePositive=sum(r['verdict']=='MATCH' for r in bold), falsePositive=sum(r['verdict']=='MATCH' for r in regular), maxRegularScore=ceiling, boldAboveEveryRegular=sum(r['score']>ceiling for r in bold) if ceiling is not None else None)


def deduplicate(rows):
    groups = {}
    for r in rows:
        key = r['tensorSha256']
        if key in groups and groups[key]['expected'] != r['expected']:
            raise ValueError('Conflicting labels for identical tensor')
        groups.setdefault(key, r)
    return list(groups.values())


def grouped(rows, key):
    groups = defaultdict(list)
    for r in rows: groups[r[key]].append(r)
    return {k:summarize(v) for k,v in sorted(groups.items())}


def main():
    root = Path(__file__).resolve().parents[2]
    prior = root.parent / 'treasury-label-review-mobilenet/evidence'
    paths = {'R011':prior/'appearance-mobilenet-development.json', 'R012':root/'evidence/appearance-finetune-development.json', 'manifest':prior/'appearance-mobilenet-inputs-frozen.json'}
    sources = {k:json.loads(p.read_text()) for k,p in paths.items()}
    manifest = {r['id']:r for r in sources['manifest']['rows']}
    report = {'scope':'Retrospective exposed-data diagnostic. No new inference or threshold selection.', 'sourceHashes':{k:hashlib.sha256(p.read_bytes()).hexdigest() for k,p in paths.items()}, 'models':{}}
    maps = {}
    for name in ['R011','R012']:
        rows = sources[name]['rows']
        assert len({r['id'] for r in rows}) == len(rows)
        for r in rows:
            meta = manifest[r['id']]
            assert all(r[k] == meta[k] for k in ['expected','family','split','category'])
        challenge = [{**manifest[r['id']], **r} for r in rows if r['split']=='challenge']
        maps[name] = {r['id']:r for r in challenge}
        report['models'][name] = {'cutoff':sources[name]['cutoff'], 'challenge':summarize(challenge), 'uniqueTensorChallenge':summarize(deduplicate(challenge)), 'byFamily':grouped(challenge,'family'), 'byCategory':grouped(challenge,'category'), 'errors':[{'id':r['id'],'family':r['family'],'category':r['category'],'expected':r['expected'],'score':r['score']} for r in challenge if (r['verdict']=='MATCH') != (r['expected']=='BOLD')]}
    assert maps['R011'].keys() == maps['R012'].keys()
    transitions = defaultdict(list)
    for key,a in maps['R011'].items():
        b = maps['R012'][key]
        transitions[f"{a['expected']}: {a['verdict']} -> {b['verdict']}"].append(key)
    report['transitions'] = dict(transitions)
    (root/'evidence/appearance-score-audit.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps({k:{a:b for a,b in v.items() if a not in ['errors','byFamily']} for k,v in report['models'].items()},indent=2))
    print('Transitions:', {k:len(v) for k,v in transitions.items()})
    print('Families:',json.dumps(report['models']['R012']['byFamily'],indent=2))

if __name__ == '__main__': main()
