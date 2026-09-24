"""Make a light background canonical without changing weight-bearing geometry."""
import numpy as np

def canonical_pixels(rgb):
    border = np.concatenate([rgb[0], rgb[-1], rgb[:, 0], rgb[:, -1]])
    luminance = border @ np.array([.2126, .7152, .0722])
    return 255 - rgb if np.median(luminance) < 127.5 else rgb.copy()
