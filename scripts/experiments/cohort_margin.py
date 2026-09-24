"""Margin fitting subject to the existing 95% recall in every exposed cohort."""
import math
from margin_calibration import calibrate as midpoint

def calibrate(rows):
    if not rows or any(r['expected'] not in {'BOLD','REGULAR'} or not math.isfinite(r['score']) or not 0<=r['score']<=1 for r in rows):
        raise ValueError('Valid labeled probabilities required')
    groups={}
    for row in rows:groups.setdefault(row['category'],[]).append(row)
    limits={}
    for name, group in groups.items():
        bold=sorted((r['score'] for r in group if r['expected']=='BOLD'),reverse=True)
        regular=[r['score'] for r in group if r['expected']=='REGULAR']
        if not bold or not regular:raise ValueError('Both classes required in each cohort')
        limits[name]=bold[math.ceil(.95*len(bold))-1]
    lower=max(r['score'] for r in rows if r['expected']=='REGULAR')
    upper=min(limits.values())
    return dict(cutoff=midpoint([lower,upper],[0,1]),regularMaximum=lower,requiredBoldMinimum=upper,cohortUpperBounds=limits)
