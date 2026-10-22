import pathlib
import sys
import tempfile
import unittest
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from coordinator import Store
from model_request import build_request, record_usage


class RequestTests(unittest.TestCase):
    def test_stable_prefix_is_separate_from_dynamic_task(self):
        first = build_request('Stable rules', 'Task one')
        second = build_request('Stable rules', 'Task two')
        self.assertEqual(first['input'][0], second['input'][0])
        self.assertNotIn('previous_response_id', first)
        self.assertEqual(first['prompt_cache_options']['mode'], 'explicit')

    def test_exception_input_is_bounded(self):
        with self.assertRaises(ValueError): build_request('Rules', 'x' * 20000, 'exception')
        self.assertEqual(build_request('Rules', 'Failure details', 'exception')['max_output_tokens'], 1500)

    def test_usage_retry_preserves_provider_subsets_without_double_counting(self):
        with tempfile.TemporaryDirectory() as path:
            store = Store(path)
            response = {'id': 'response-1', 'usage': {'input_tokens': 100, 'output_tokens': 20,
                        'input_tokens_details': {'cached_tokens': 80}}, 'output': 'Do not retain article text'}
            record_usage(store, response); record_usage(store, response)
            self.assertEqual(store.get('usage:response-1'), response['usage'])
            self.assertNotIn('output', store.get('usage:response-1'))
            store.db.close()
