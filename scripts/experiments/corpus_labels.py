"""Quarantine contradictory new source labels while retaining the original corpus."""
def qualify(original,additional):
 labels={}
 for row in original+additional:labels.setdefault(row['pixelSha256'],set()).add(row['expected'])
 conflicts={key for key,values in labels.items() if len(values)>1}
 if any(r['pixelSha256'] in conflicts for r in original):raise ValueError('Conflict touches retained original training data')
 return ([r for r in additional if r['pixelSha256'] not in conflicts],[r for r in additional if r['pixelSha256'] in conflicts])
