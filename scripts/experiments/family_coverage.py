"""Validate family partitions before downloading/rendering new development data."""
import re

def validate_families(names, blocked, count):
    keys = [re.sub('[^a-z0-9]', '', name.lower()) for name in names]
    excluded = {re.sub('[^a-z0-9]', '', name.lower()) for name in blocked}
    if len(keys) != count or len(set(keys)) != count or any(not k for k in keys):
        raise ValueError('Wrong count or duplicate family alias')
    if set(keys) & excluded:
        raise ValueError('Family overlap: ' + str(sorted(set(keys) & excluded)))
    return keys

def validate_pixels(rows):
    seen = {}
    for row in rows:
        identity = (row['expected'], row['split'])
        key = row['pixelSha256']
        if key in seen and seen[key] != identity:
            raise ValueError('Pixel label conflict or split leakage')
        seen[key] = identity
    return len(seen)
