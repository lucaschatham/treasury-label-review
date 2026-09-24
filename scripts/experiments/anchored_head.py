"""Squared parameter distance to the immutable pretrained initialization."""
def penalty(model,reference):
 return sum((p-reference[name]).square().sum() for name,p in model.named_parameters())
