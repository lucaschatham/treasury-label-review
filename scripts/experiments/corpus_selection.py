"""Deterministic, score-independent font family selection and family separation."""
import hashlib,re
def stem(name):
 name=re.sub('[^a-z0-9]','',name.lower())
 while True:
  shortened=re.sub(r'(libre|condensed|expanded|display|text|serif|sans|mono|pro|sc)$','',name)
  if shortened==name or len(shortened)<4:return name
  name=shortened
def related(a,b):
 a,b=stem(a),stem(b)
 return a==b or (min(len(a),len(b))>=4 and (a.startswith(b) or b.startswith(a)))
def ordered(names,excluded):
 return sorted((n for n in set(names) if not any(related(n,e) for e in excluded)),key=lambda n:hashlib.sha256(('20260923:'+n).encode()).hexdigest())
