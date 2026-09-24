import math,re

def audit(rows):
 groups={}
 for r in rows:
  label=r['expected'];name=r['id']
  if label not in {'REGULAR','BOLD'} or not math.isfinite(r['score']):raise ValueError('Invalid label or score')
  if name.endswith('-'+label.lower()):key=name[:-(len(label)+1)]+'-WEIGHT'
  elif '-'+label+'-' in name:key=name.replace('-'+label+'-','-WEIGHT-',1)
  else:raise ValueError('Label does not match source identifier')
  key=(r['family'],r['category'],key);group=groups.setdefault(key,{})
  if label in group:raise ValueError('Duplicate member')
  group[label]=r
 out=[]
 for key,g in sorted(groups.items()):
  if set(g)!={'REGULAR','BOLD'}:raise ValueError('Incomplete pair')
  delta=g['BOLD']['score']-g['REGULAR']['score']
  out.append(dict(family=key[0],category=key[1],key=key[2],regular=g['REGULAR']['id'],bold=g['BOLD']['id'],margin=delta))
 return dict(pairs=len(out),strictlyOrdered=sum(r['margin']>0 for r in out),minimumMargin=min((r['margin'] for r in out),default=None),rows=out)

if __name__=='__main__':
 import json,hashlib
 from pathlib import Path
 root=Path(__file__).resolve().parents[2];result={}
 for name in ['appearance-finetune-development','r018-baseline-results','r018-treatment-results']:
  p=root/'evidence'/f'{name}.json';d=json.loads(p.read_text())
  result[name]={'sourceSha256':hashlib.sha256(p.read_bytes()).hexdigest(),**audit([r for r in d['rows'] if r['split']=='challenge'])}
 p=root/'evidence/r019-pair-ordering.json'
 with p.open('x') as f:json.dump(result,f,indent=2);f.write('\n')
 print({k:{a:b for a,b in v.items() if a!='rows'} for k,v in result.items()})
