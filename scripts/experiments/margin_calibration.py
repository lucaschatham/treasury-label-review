"""Fit one margin on exposed development scores, never on qualification data."""
import math

def calibrate(scores, labels):
    if len(scores) != len(labels) or set(labels) != {0, 1} or any(not math.isfinite(s) or not 0 <= s <= 1 for s in scores):
        raise ValueError('Finite probabilities and both classes required')
    regular = max(s for s, y in zip(scores, labels) if y == 0)
    bold = min(s for s, y in zip(scores, labels) if y == 1)
    if not 0 < regular < bold < 1:
        raise ValueError('Finite, strictly separated logit endpoints required')
    midpoint = (math.log(regular / (1 - regular)) + math.log(bold / (1 - bold))) / 2
    cutoff = 1 / (1 + math.exp(-midpoint))
    if not regular < cutoff < bold:
        raise ValueError('No representable interior margin')
    return cutoff
