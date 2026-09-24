"""Keep all counterexamples while making training exposure explicit."""
from transfer_split import partition
def annotate(evaluation,training):
 _,exposed=partition(evaluation,training)
 pixels={r['pixelSha256'] for r in exposed};families={r['family'] for r in training}
 return [dict(r,trainedFamily=r['family'] in families,trainedPixel=r['pixelSha256'] in pixels) for r in evaluation]
