"""Select one precomputed nuisance view for each original training word."""
def select(features,indices,views):
 return features[indices,views]
