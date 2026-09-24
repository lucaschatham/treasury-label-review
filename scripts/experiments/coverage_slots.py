def slots(rows):
 result=[]
 for label in ['REGULAR','BOLD']:
  ids=sorted({r['id'] for r in rows if r['expected']==label})
  if len(ids)<2:raise ValueError('Two distinct examples per class required')
  result.extend(ids[:2])
 return result
