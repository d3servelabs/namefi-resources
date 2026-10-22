import copy
import importlib.util
import pathlib
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('coordinator', pathlib.Path(__file__).with_name('coordinator.py'))
m = importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)
A, B, C = 'a' * 40, 'b' * 40, 'c' * 40


class FakeGitHub:
    def __init__(self):
        self.heads = {'main': A, 'one': B, 'two': C}
        self.trees = {A: 'old', B: 'partial', C: 'final'}
        self.calls = []
        self.prs = {1: self.make_pr(1, 'one', B, 'main'), 2: self.make_pr(2, 'two', C, 'one')}
        self.ci = {'workflow_id': 9, 'event': 'workflow_dispatch', 'head_sha': C, 'head_branch': 'two',
                   'created_at': '2099-01-01T00:00:00Z', 'status': 'completed', 'conclusion': 'success'}

    def make_pr(self, n, branch, sha, base):
        return {'number': n, 'state': 'open', 'draft': True, 'merged': False,
                'head': {'ref': branch, 'sha': sha, 'repo': {'full_name': 'owner/repo'}}, 'base': {'ref': base}}

    def pr(self, repo, n): return copy.deepcopy(self.prs[n])
    def head(self, repo, branch): return self.heads[branch]
    def tree(self, repo, sha): return self.trees[sha]

    def api(self, path, method='GET', fields=None):
        self.calls.append((path, method, fields))
        if '/compare/' in path:
            return {'merge_base_commit': {'sha': path.split('/compare/')[1].split('...')[0]}}
        if '/actions/runs/' in path: return copy.deepcopy(self.ci)
        if '/actions/workflows/' in path: return {'id': 9}
        if method == 'PATCH':
            self.prs[int(path.rsplit('/', 1)[1])]['base']['ref'] = fields['base']
            return {}
        raise AssertionError(path)

    def run(self, *args):
        self.calls.append(args)
        if args[:2] == ('pr', 'merge'):
            n = int(args[2]); pr = self.prs[n]
            pr.update(merged=True, state='closed', merge_commit_sha=str(n) * 40)
            base = pr['base']['ref']; merged_sha = pr['merge_commit_sha']
            self.heads[base] = merged_sha; self.trees[merged_sha] = 'final'
            for parent in self.prs.values():
                if parent['head']['ref'] == base: parent['head']['sha'] = merged_sha
        return ''


class Tests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.store = m.Store(self.tmp.name)
        self.store.put('config', {'repo': 'owner/repo', 'prs': [1, 2], 'base_sha': A,
                                  'artifacts_root': self.tmp.name})
        self.gh = FakeGitHub(); self.coordinator = m.Coordinator(self.store, self.gh)
        for n, sha in [(1, B), (2, C)]:
            self.store.receive({'pr_number': n, 'sha': sha, 'status': 'ready'})

    def tearDown(self): self.store.db.close(); self.tmp.cleanup()

    def pass_ci(self):
        self.coordinator.dispatch_ci(True); self.coordinator.accept_ci(100)

    def test_append_slot_serializes_writers_and_registers_only_metadata(self):
        config = self.store.get('config'); config['expected_prs'] = 3
        self.store.put('config', config); self.coordinator = m.Coordinator(self.store, self.gh)
        slot = self.coordinator.reserve('codex/three')
        self.assertEqual(slot['base'], 'two')
        with self.assertRaises(ValueError): self.coordinator.reserve('codex/four')
        self.gh.heads['codex/three'] = A
        self.gh.prs[3] = self.gh.make_pr(3, 'codex/three', A, 'two')
        message = {'pr_number': 3, 'sha': A, 'status': 'ready'}
        self.assertEqual(self.coordinator.register(message), message)
        self.assertEqual(self.store.order(), [1, 2, 3])
        self.assertIsNone(self.store.get('append_slot'))
        self.assertEqual(self.coordinator.register(message), message)

    def test_blocked_status_revokes_gate_without_a_sha_change(self):
        self.pass_ci()
        self.store.receive({'pr_number': 2, 'sha': C, 'status': 'blocked'})
        self.assertIsNone(self.store.get('ci_gate'))

    def test_protocol_rejects_extra_fields_and_unknown_pr(self):
        for message in [{'pr_number': 1, 'sha': B, 'status': 'ready', 'body': 'article'},
                        {'pr_number': True, 'sha': B, 'status': 'ready'},
                        {'pr_number': 1, 'sha': 'short', 'status': 'ready'},
                        {'pr_number': 3, 'sha': B, 'status': 'ready'}]:
            with self.assertRaises(ValueError): self.store.receive(message)

    def test_retries_are_idempotent(self):
        message = {'pr_number': 1, 'sha': B, 'status': 'ready'}
        self.store.receive(message); self.store.receive(message)
        self.assertEqual(self.store.db.execute('SELECT COUNT(*) FROM events').fetchone()[0], 2)
        self.assertEqual(set(self.store.snapshot()[0]), {'pr_number', 'sha', 'status'})

    def test_changed_sha_invalidates_ci(self):
        self.pass_ci(); self.store.receive({'pr_number': 2, 'sha': B, 'status': 'blocked'})
        self.assertIsNone(self.store.get('ci_gate'))

    def test_moved_branch_prevents_ci(self):
        self.gh.heads['two'] = A
        with self.assertRaises(ValueError): self.coordinator.dispatch_ci(True)
        self.assertIsNone(self.store.get('ci_dispatch'))

    def test_ci_rejects_wrong_workflow_commit_event_or_failure(self):
        self.coordinator.dispatch_ci(True)
        for field, value in [('workflow_id', 1), ('head_sha', A), ('event', 'push'),
                             ('conclusion', 'failure'), ('head_branch', 'main')]:
            original = self.gh.ci[field]; self.gh.ci[field] = value
            with self.assertRaises(ValueError): self.coordinator.accept_ci(100)
            self.gh.ci[field] = original

    def test_dispatch_is_not_repeated(self):
        self.coordinator.dispatch_ci(True)
        with self.assertRaises(ValueError): self.coordinator.dispatch_ci(True)

    def test_merge_requires_ci_and_exact_tree(self):
        with self.assertRaises(ValueError): self.coordinator.merge(True)
        self.pass_ci(); self.gh.trees[C] = 'changed'
        with self.assertRaises(ValueError): self.coordinator.merge(True)

    def test_reverse_merge_retries_and_final_sync_commit(self):
        self.pass_ci()
        self.assertEqual([r['pr_number'] for r in self.coordinator.merge(True)], [2, 1])
        self.assertEqual(self.coordinator.merge(True), [])
        calls = [c for c in self.gh.calls if isinstance(c, tuple) and c[:2] == ('pr', 'merge')]
        self.assertIn('[skip ci]', calls[0][-1]); self.assertNotIn('[skip ci]', calls[1][-1])
        self.assertTrue(all('--match-head-commit' in c for c in calls))

    def test_main_or_topology_change_prevents_merge(self):
        self.pass_ci(); self.gh.heads['main'] = B
        with self.assertRaises(ValueError): self.coordinator.merge(True)
        self.gh.heads['main'] = A; self.gh.prs[2]['base']['ref'] = 'main'
        with self.assertRaises(ValueError): self.coordinator.merge(True)

    def test_poll_is_silent_when_unchanged(self):
        self.assertEqual(self.coordinator.observe(), [])
        self.gh.heads['two'] = A
        self.assertEqual(self.coordinator.observe(), [{'pr_number': 2, 'sha': A, 'status': 'blocked'}])

    def test_artifacts_are_opt_in_bounded_and_confined(self):
        path = pathlib.Path(self.tmp.name) / 'evidence.txt'; path.write_text('x' * 20000)
        config = self.store.get('config'); config['artifacts'] = {'1': {'evidence': 'evidence.txt', 'escape': '../outside'}}
        self.store.put('config', config)
        self.assertTrue(m.artifact(self.store, 1, 'evidence')['truncated'])
        self.assertEqual(len(m.artifact(self.store, 1, 'evidence')['content']), 16000)
        with self.assertRaises(ValueError): m.artifact(self.store, 1, 'escape')
        with self.assertRaises(ValueError): m.artifact(self.store, 1, 'evidence', 24000)


if __name__ == '__main__': unittest.main()
