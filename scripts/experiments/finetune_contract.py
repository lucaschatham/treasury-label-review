import math

def cutoff_for(scores, labels):
    if len(scores)!=len(labels) or set(labels)!={0,1} or any(not math.isfinite(s) or not 0<=s<=1 for s in scores):
        raise ValueError('Finite probabilities and both classes required')
    return math.nextafter(max(s for s,y in zip(scores,labels) if y==0),math.inf)

def summarize(scores, labels, cutoff):
    bold=sum(y==1 for y in labels);regular=sum(y==0 for y in labels)
    matched=sum(y==1 and s>=cutoff for s,y in zip(scores,labels))
    false=sum(y==0 and s>=cutoff for s,y in zip(scores,labels))
    return dict(bold=bold,boldMatches=matched,regular=regular,regularFalseMatches=false,review=len(labels)-matched-false) | {'pass':bold>0 and regular>0 and matched>=math.ceil(.95*bold) and false==0}
