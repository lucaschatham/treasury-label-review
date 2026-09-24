"""Protect dataset denominators and provenance from malformed review exports."""
import copy
import sys
import unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'scripts/experiments'))
from annotation_audit import audit

class AnnotationAudit(unittest.TestCase):
    def setUp(self):
        self.packet = {'manifestSha256': 'manifest', 'cases': [
            {'id': str(i), 'sha256': str(i), 'width': 100, 'height': 50}
            for i in range(5)]}
        self.export = {'schema': 1, 'reviewer': 'Test reviewer',
            'sourceManifestSha256': 'manifest', 'assessments': [
                {'id': str(i), 'sourceSha256': str(i), 'heading': heading,
                 'readability': clarity, 'bbox': box, 'rationale': 'Observed'}
                for i, (heading, clarity, box) in enumerate([
                    ('BOLD', 'CLEAR', dict(x0=1,y0=1,x1=90,y1=20)),
                    ('REGULAR', 'CLEAR', dict(x0=1,y0=1,x1=90,y1=20)),
                    ('BOLD', 'DEGRADED', dict(x0=1,y0=1,x1=90,y1=20)),
                    ('AMBIGUOUS', 'CLEAR', None),
                    ('ABSENT', 'UNREADABLE', None)])]}

    def test_only_clear_decisive_labels_enter_denominators(self):
        original = copy.deepcopy(self.export)
        result = audit(self.packet, self.export)
        self.assertEqual(result['clearBold'], ['0'])
        self.assertEqual(result['clearRegular'], ['1'])
        self.assertEqual(result.get('degraded'), ['2'])
        self.assertEqual(result.get('ambiguous'), ['3'])
        self.assertEqual(result.get('absent'), ['4'])
        self.assertEqual(self.export, original)

    def test_rejects_changed_source_or_manifest(self):
        for location, key in [(self.export, 'sourceManifestSha256'),
                              (self.export['assessments'][0], 'sourceSha256')]:
            old = location[key]
            location[key] = 'changed'
            with self.assertRaises(ValueError): audit(self.packet, self.export)
            location[key] = old

    def test_rejects_duplicate_missing_unknown_and_unassessed(self):
        for mutate in [lambda a: a.append(copy.deepcopy(a[0])),
                       lambda a: a.pop(),
                       lambda a: a[0].update(id='unknown'),
                       lambda a: a[0].update(heading=None)]:
            export = copy.deepcopy(self.export)
            mutate(export['assessments'])
            with self.assertRaises(ValueError): audit(self.packet, export)

    def test_rejects_invalid_clear_heading_box(self):
        for box in [None, dict(x0=0,y0=0,x1=101,y1=20),
                    dict(x0=3,y0=1,x1=3,y1=20),
                    dict(x0=0,y0=0,x1=float('nan'),y1=20)]:
            self.export['assessments'][0]['bbox'] = box
            with self.assertRaises(ValueError): audit(self.packet, self.export)

    def test_rejects_missing_or_nontext_rationale(self):
        for value in [None, '', ' ', 7]:
            self.export['assessments'][0]['rationale'] = value
            with self.assertRaises(ValueError): audit(self.packet, self.export)

    def test_rejects_missing_reviewer_and_invalid_readability(self):
        self.export['reviewer'] = ' '
        with self.assertRaises(ValueError): audit(self.packet, self.export)
        self.export['reviewer'] = 'Test reviewer'
        self.export['assessments'][0]['readability'] = 'UNKNOWN'
        with self.assertRaises(ValueError): audit(self.packet, self.export)

if __name__ == '__main__': unittest.main()
