import importlib.util
import json
import pathlib
import sys
import unittest
from unittest.mock import patch

sys.path.insert(0, str(pathlib.Path(__file__).parent))
import test_coordinator as fixtures
from test_coordinator import A, B, C
from release import Release, ASTRA
from verify_live import pagecheck, assetcheck, verify


class ReleaseTests(unittest.TestCase):
    def setUp(self):
        fixtures.Tests.setUp(self)
        fixtures.Tests.pass_ci(self); self.coordinator.merge(True)
        self.release = Release(self.store, self.gh)
        self.config = {'astra_sha': C, 'branch_prefix': 'codex/test-release', 'manifest_sha256': '0' * 64,
                       'manifest_path': '/tmp/manifest.json',
                       'origins': {'dev': 'https://dev.example', 'production': 'https://namefi.io'}}
        self.original_api = self.gh.api
        self.gh.api = self.api

    def tearDown(self): fixtures.Tests.tearDown(self)

    def api(self, path, method='GET', fields=None):
        if '/contents/apps/resources/data' in path: return {'sha': '1' * 40}
        if path.endswith('/git/refs'):
            self.gh.heads[fields['ref'].removeprefix('refs/heads/')] = fields['sha']
            return {}
        return self.original_api(path, method, fields)

    def test_release_checks_submodule_and_completed_merges(self):
        self.release.initialize(self.config)
        self.store.put('merge:2', None)
        with self.assertRaises(ValueError): self.release.initialize(self.config)

    def test_production_requires_verified_development(self):
        self.release.initialize(self.config)
        with self.assertRaises(ValueError): self.release.dispatch('production', True)
        self.store.put('verified:dev', {'sha': C})
        self.release.dispatch('production', True)
        dispatch = self.store.get('deploy:production')
        self.assertEqual(dispatch['ref'], 'codex/test-release-production')
        self.assertIn('confirm_production=deploy-resources-production', self.gh.calls[-1])
        with self.assertRaises(ValueError): self.release.dispatch('production', True)

    def test_stage_ref_prevents_accepting_another_environment(self):
        self.release.initialize(self.config); self.release.dispatch('dev', True)
        with self.assertRaises(ValueError): self.release.accept('dev', 100)
        self.gh.ci['head_branch'] = 'codex/test-release-dev'
        self.release.accept('dev', 100)
        self.assertEqual(self.store.get('published:dev')['sha'], C)


class LiveTests(unittest.TestCase):
    def test_page_language_canonical_and_reciprocal_alternates(self):
        page = {'path': '/r/en/blog/test', 'locale': 'en', 'title': 'Current title', 'marker': 'Current body',
                'alternates': {'en': '/r/en/blog/test', 'x-default': '/r/en/blog/test'}}
        html = b'''<html lang="en"><head><link rel="canonical" href="https://namefi.io/r/en/blog/test"><link rel="alternate" hreflang="en" href="https://namefi.io/r/en/blog/test"><link rel="alternate" hreflang="x-default" href="https://namefi.io/r/en/blog/test"><meta property="og:image" content="/r/blog-assets/test.jpg"></head><body>Current title Current body</body></html>'''
        with patch('verify_live.request', return_value=(200, 'https://namefi.io/r/en/blog/test', {}, html)):
            self.assertEqual(pagecheck(page, 'https://namefi.io', 'production')['issues'], [])
            page['locale'] = 'de'
            self.assertIn('html language mismatch', pagecheck(page, 'https://namefi.io', 'production')['issues'])

    def test_live_rejects_empty_manifest_and_image_hash_mismatch(self):
        with self.assertRaises(ValueError): verify({'pages': []}, 'https://namefi.io', 'production')
        with patch('verify_live.request', return_value=(200, 'https://namefi.io/r/a.jpg', {'Content-Type': 'image/jpeg'}, b'image')):
            result = assetcheck({'path': '/r/a.jpg', 'sha256': 'wrong'}, 'https://namefi.io')
            self.assertIn('published image differs from committed image', result['issues'])


if __name__ == '__main__': unittest.main()
