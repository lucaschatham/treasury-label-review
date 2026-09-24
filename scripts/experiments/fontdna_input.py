"""Word-local FontDNA inputs derived from frozen packed heading pixels."""
import math
import numpy as np
from PIL import Image
from polarity import canonical_pixels

def words(rgb):
    rgb = canonical_pixels(rgb)
    result = []
    for top, bottom in [(0, 112), (112, 224)]:
        tile = rgb[top:bottom]
        background = np.median(np.concatenate([tile[0], tile[-1], tile[:, 0], tile[:, -1]]), axis=0)
        yy, xx = np.where(np.max(np.abs(tile.astype(float) - background), axis=2) > 8)
        if not len(xx):
            raise ValueError('Blank word tile')
        x0, y0 = max(0, int(xx.min()) - 2), max(0, int(yy.min()) - 2)
        x1, y1 = min(tile.shape[1], int(xx.max()) + 3), min(tile.shape[0], int(yy.max()) + 3)
        crop = Image.fromarray(tile[y0:y1, x0:x1]).convert('L')
        scale = min(40 / crop.height, 320 / crop.width)
        width, height = max(8, round(crop.width * scale)), max(1, round(crop.height * scale))
        canvas = Image.new('L', (math.ceil(width / 8) * 8, 40), 255)
        canvas.paste(crop.resize((width, height), Image.Resampling.BICUBIC), (0, (40 - height) // 2))
        x = np.asarray(canvas, dtype=np.float32) / 255
        x = (x - x.mean()) / (x.std() + 1e-4)
        result.append((x[None], width // 8))
    return result
