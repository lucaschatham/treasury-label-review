import numpy as np
def unit(v):
 a=np.asarray(v,dtype=np.float64)
 if not np.isfinite(a).all() or not np.linalg.norm(a)>0:raise ValueError('Invalid feature norm')
 return a/np.linalg.norm(a)
def rank(query,rows):
 q=unit(query);seen=set();out=[]
 for r in sorted(rows,key=lambda r:r['id']):
  if r['tensor'] in seen:continue
  seen.add(r['tensor']);out.append(dict(id=r['id'],distance=float(1-np.dot(q,unit(r['vector'])))))
 return sorted(out,key=lambda r:(r['distance'],r['id']))
