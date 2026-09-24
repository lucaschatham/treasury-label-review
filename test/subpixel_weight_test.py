"""Harness checks for the R-038 sub-pixel thickness estimator. Not detector accuracy evidence."""
import sys, unittest
from pathlib import Path
import numpy as np
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts/experiments'))
from subpixel_weight_diagnostic import crossing_mass, subpixel_thickness

class SubpixelThickness(unittest.TestCase):
    def test_crossing_mass_recovers_integer_stem_width(self):
        profile = np.array([0, 0, 1, 1, 1, 0, 0], dtype=np.float32)
        self.assertEqual(crossing_mass(profile)[2:5].tolist(), [3.0, 3.0, 3.0])
        self.assertEqual(crossing_mass(profile)[0], 0.0)

    def test_crossing_mass_uses_antialiased_edges(self):
        profile = np.array([0, .5, 1, 1, .5, 0], dtype=np.float32)
        self.assertAlmostEqual(float(crossing_mass(profile)[2]), 3.0, places=5)

    def test_thickness_is_the_thinner_dimension_and_subpixel(self):
        gray = np.full((40, 40), 255, dtype=np.uint8)
        gray[5:35, 10:13] = 0          # 3 px vertical stem, 30 px tall
        gray[5:35, 13] = 128           # half-covered edge column
        thickness, count = subpixel_thickness(gray, (0, 0, 40, 40))
        self.assertEqual(count, 90)
        self.assertAlmostEqual(thickness, 3 + (1 - 128 / 255), places=4)

    def test_sparse_region_is_rejected(self):
        gray = np.full((20, 20), 255, dtype=np.uint8)
        gray[3, 3:8] = 0
        self.assertEqual(subpixel_thickness(gray, (0, 0, 20, 20))[0], None)

if __name__ == '__main__':
    unittest.main()
