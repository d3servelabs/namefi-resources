import importlib.util
import json
import pathlib
import unittest
spec = importlib.util.spec_from_file_location('coverage_audit', pathlib.Path(__file__).with_name('coverage.py'))
m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)


class CoverageTests(unittest.TestCase):
    def test_completed_topic_overlap_does_not_create_a_second_page(self):
        root = pathlib.Path(__file__).resolve().parents[2]
        clusters = json.loads((root / 'editorial/2026-10-22-remaining-demand/us-en-clusters.json').read_text())
        result = m.audit(root, clusters)
        self.assertEqual(result['completed_topics'], 48)
        self.assertEqual(result['completed_unique_english_pages'], 47)
        self.assertEqual(len(result['all_intents']['new_article_candidates']), 6)
        self.assertEqual(len(result['all_intents']['existing_pages_to_recheck']), 8)
        self.assertEqual(len(result['article_reference_only']['new_article_candidates']), 8)
        self.assertEqual(len(result['article_reference_only']['existing_pages_to_recheck']), 10)
        self.assertIsNone(result['remaining_demand_qualified_translations'])
