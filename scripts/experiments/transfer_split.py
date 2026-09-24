"""Keep exposed training pixels out of development transfer denominators."""
def partition(evaluation,training):
 labels={}
 for row in training:
  key=row['pixelSha256']
  if key in labels and labels[key]!=row['expected']:raise ValueError('Training label conflict')
  labels[key]=row['expected']
 kept=[];excluded=[]
 for row in evaluation:
  key=row['pixelSha256']
  if key in labels:
   if labels[key]!=row['expected']:raise ValueError('Evaluation label conflict')
   excluded.append(row)
  else:kept.append(row)
 return kept,excluded
