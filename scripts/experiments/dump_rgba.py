"""Write raw 8-bit RGBA bytes plus dimensions for images so Node harnesses can measure the same pixels.

Usage: python3 scripts/experiments/dump_rgba.py <output dir> <image> [<image> ...]
Each image produces <output dir>/<stem>.rgba and <stem>.json ({width, height, sha256 of the source file}).
"""
import hashlib, json, sys
from pathlib import Path
from PIL import Image

def main():
    out = Path(sys.argv[1]); out.mkdir(parents=True, exist_ok=True)
    for name in sys.argv[2:]:
        path = Path(name); image = Image.open(path).convert('RGBA')
        (out / f'{path.stem}.rgba').write_bytes(image.tobytes())
        (out / f'{path.stem}.json').write_text(json.dumps(dict(width=image.width, height=image.height, source=path.name, sourceSha256=hashlib.sha256(path.read_bytes()).hexdigest())))

if __name__ == '__main__':
    main()
