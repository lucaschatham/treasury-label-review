"""Fixed cosine schedule with explicit endpoint updates."""
import math
def rate(step,total):
 if total<2 or not 0<=step<total:raise ValueError('Valid update index required')
 return .00001+.5*(.001-.00001)*(1+math.cos(math.pi*step/(total-1)))
