def validate_pair(a,b):
 if a['font']!=b['font']:raise ValueError('font mismatch')
 if a['height']!=b['height']:raise ValueError('height mismatch')
 if a['clipped'] or b['clipped']:raise ValueError('clipped')
def validate_matrix(rows,expected):
 if len(rows)!=len(set(rows)) or set(rows)!=expected:raise ValueError('Incomplete or duplicate matrix')
def write_new(path,text):
 with path.open('x') as f:f.write(text)
def common_height(sets,target):
 shared=set.intersection(*(set(s) for s in sets))
 valid=[h for h in shared if abs(h-target)<=2]
 if not valid:raise ValueError('No common height in frozen window')
 return min(valid,key=lambda h:(abs(h-target),h))
def png_options(): return ['-depth','8','-define','png:color-type=2']
