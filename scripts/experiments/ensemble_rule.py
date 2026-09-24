"""Fixed cutoffs frozen before the complementary-detector experiment."""
import math
MOBILE_CUTOFF=0.9759449504262997
FONT_CUTOFF=0.609006503393253
def accepts(mobile,font):
 if any(not math.isfinite(s) or not 0<=s<=1 for s in [mobile,font]):raise ValueError("Finite probabilities required")
 return mobile>=MOBILE_CUTOFF or font>=FONT_CUTOFF
