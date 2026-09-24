"""Fixed nine spatial phases; no stroke modification or model-dependent selection."""
import numpy as np
def views(x):
 result=[];_,height,width=x.shape
 for dy in [-1,0,1]:
  for dx in [-1,0,1]:
   shifted=np.full_like(x,float(x[0,0,0]))
   sy0,sy1=max(0,-dy),min(height,height-dy);sx0,sx1=max(0,-dx),min(width,width-dx)
   shifted[:,sy0+dy:sy1+dy,sx0+dx:sx1+dx]=x[:,sy0:sy1,sx0:sx1]
   result.append(shifted)
 return np.stack(result)
