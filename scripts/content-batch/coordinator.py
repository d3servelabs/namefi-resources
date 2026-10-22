"""Coordinate content PRs without model calls or article-body polling."""
import argparse
import contextlib
import datetime as dt
import fcntl
import hashlib
import json
import pathlib
import re
import sqlite3
import subprocess
import sys
import time

STATUSES = {'queued', 'working', 'ready', 'blocked', 'merged'}
SHA = re.compile(r'^[0-9a-f]{40}$')


def validate_message(message):
    if not isinstance(message, dict) or set(message) != {'pr_number', 'sha', 'status'}:
        raise ValueError('A handoff requires exactly pr_number, sha, and status')
    if type(message['pr_number']) is not int or message['pr_number'] <= 0:
        raise ValueError('pr_number must be a positive integer')
    if not isinstance(message['sha'], str) or not SHA.fullmatch(message['sha']):
        raise ValueError('sha must contain 40 lowercase hexadecimal characters')
    if message['status'] not in STATUSES:
        raise ValueError('Unknown status')
    return message


def read_json(path):
    return json.loads(pathlib.Path(path).read_text())


class Store:
    def __init__(self, directory):
        self.root = pathlib.Path(directory).resolve()
        self.root.mkdir(parents=True, exist_ok=True)
        self.db = sqlite3.connect(self.root / 'state.sqlite')
        self.db.execute('CREATE TABLE IF NOT EXISTS kv (key TEXT PRIMARY KEY, value TEXT NOT NULL)')
        self.db.execute('CREATE TABLE IF NOT EXISTS events (id INTEGER PRIMARY KEY, payload TEXT UNIQUE NOT NULL)')

    def get(self, key, default=None):
        row = self.db.execute('SELECT value FROM kv WHERE key=?', (key,)).fetchone()
        return json.loads(row[0]) if row else default

    def put(self, key, value):
        self.db.execute('INSERT OR REPLACE INTO kv VALUES (?,?)', (key, json.dumps(value, sort_keys=True)))
        self.db.commit()

    @contextlib.contextmanager
    def lock(self):
        with (self.root / 'lock').open('a') as lock:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
            yield

    def receive(self, message):
        validate_message(message)
        config = self.get('config')
        if not config or message['pr_number'] not in self.order():
            raise ValueError('PR does not belong to this batch')
        key = 'pr:' + str(message['pr_number'])
        previous = self.get(key)
        if previous and previous['status'] == 'merged' and previous != message:
            raise ValueError('A merged PR cannot accept another handoff')
        if message['status'] in {'queued', 'working', 'blocked'} or (previous and previous['sha'] != message['sha'] and message['status'] != 'merged'):
            self.put('ci_gate', None)
        payload = json.dumps(message, sort_keys=True)
        self.db.execute('INSERT OR IGNORE INTO events(payload) VALUES (?)', (payload,))
        self.db.execute('INSERT OR REPLACE INTO kv VALUES (?,?)', (key, payload))
        self.db.commit()
        return message

    def order(self):
        return self.get('order', self.get('config', {'prs': []})['prs'])

    def snapshot(self):
        config = self.get('config', {'prs': []})
        return [self.get('pr:' + str(n)) for n in self.order() if self.get('pr:' + str(n))]


def validate_config(config):
    if not re.fullmatch(r'[\w.-]+/[\w.-]+', config['repo']):
        raise ValueError('Invalid repository')
    prs = config['prs']
    if not isinstance(prs, list) or any(type(n) is not int or n <= 0 for n in prs) or len(prs) != len(set(prs)):
        raise ValueError('prs must give unique PR numbers in base-to-tip order')
    expected = config.get('expected_prs', len(prs))
    if type(expected) is not int or expected < max(1, len(prs)):
        raise ValueError('Set a positive expected_prs count for an open queue')
    if config.get('workflow', 'validate.yml') != 'validate.yml':
        raise ValueError('The final gate must use the checked-in validate.yml workflow')
    if not SHA.fullmatch(config['base_sha']):
        raise ValueError('Pin the initial main SHA')
    return config


class GitHub:
    def run(self, *args):
        result = subprocess.run(['gh', *args], capture_output=True, text=True)
        if result.returncode:
            # Error artifacts remain outside routine status messages.
            raise RuntimeError(result.stderr[-4000:])
        return result.stdout.strip()

    def api(self, endpoint, method='GET', fields=None):
        args = ['api', endpoint, '--method', method]
        for key, value in (fields or {}).items():
            args += ['-f', key + '=' + str(value)]
        value = self.run(*args)
        return json.loads(value) if value else None

    def pr(self, repo, number):
        return self.api(f'repos/{repo}/pulls/{number}')

    def head(self, repo, branch):
        return self.api(f'repos/{repo}/git/ref/heads/{branch}')['object']['sha']

    def tree(self, repo, sha):
        return self.api(f'repos/{repo}/git/commits/{sha}')['tree']['sha']


class Coordinator:
    def __init__(self, store, github):
        self.store, self.github = store, github
        self.config = {**validate_config(store.get('config')), 'prs': store.order()}
        self.repo = self.config['repo']

    def reserve(self, branch):
        if not re.fullmatch(r'codex/[a-zA-Z0-9_/-]+', branch):
            raise ValueError('Use a codex/ writer branch')
        slot = self.store.get('append_slot')
        if slot and slot['branch'] != branch:
            raise ValueError('Another writer holds the append slot; retry without a model call')
        order = self.store.order()
        base = self.github.pr(self.repo, order[-1])['head']['ref'] if order else 'main'
        result = {'branch': branch, 'base': base, 'sha': self.github.head(self.repo, base)}
        if not slot: self.store.put('append_slot', result)
        return self.store.get('append_slot')

    def register(self, message):
        validate_message(message)
        if message['pr_number'] in self.store.order():
            result = self.store.receive(message)
            slot = self.store.get('append_slot')
            if slot and self.github.pr(self.repo, message['pr_number'])['head']['ref'] == slot['branch']:
                self.store.put('append_slot', None)
            return result
        if message['status'] != 'ready': raise ValueError('A new topic PR must complete local sanity first')
        expected = self.config.get('expected_prs', len(self.config['prs']))
        if len(self.store.order()) >= expected: raise ValueError('The PR queue is full')
        slot = self.store.get('append_slot')
        if not slot: raise ValueError('Reserve an append slot before registering a PR')
        pr = self.github.pr(self.repo, message['pr_number'])
        if (pr['head']['repo']['full_name'] != self.repo or pr['head']['ref'] != slot['branch']
                or pr['base']['ref'] != slot['base'] or not pr['draft'] or pr['state'] != 'open'
                or self.github.head(self.repo, slot['base']) != slot['sha']
                or self.github.head(self.repo, slot['branch']) != message['sha']):
            raise ValueError('The new draft PR does not match the reserved append slot')
        comparison = self.github.api(f"repos/{self.repo}/compare/{slot['sha']}...{message['sha']}")
        if comparison['merge_base_commit']['sha'] != slot['sha']:
            raise ValueError('Rebase the topic onto the reserved tip before registering')
        self.store.put('order', self.store.order() + [message['pr_number']])
        result = self.store.receive(message)
        self.store.put('append_slot', None)
        return result

    def ready_prs(self):
        result = []
        if len(self.config['prs']) != self.config.get('expected_prs', len(self.config['prs'])):
            raise ValueError('The PR queue is incomplete')
        for number in self.config['prs']:
            message = self.store.get('pr:' + str(number))
            if not message or message['status'] != 'ready':
                raise ValueError(f'PR {number} has not completed local sanity')
            pr = self.github.pr(self.repo, number)
            actual = self.github.head(self.repo, pr['head']['ref'])
            if actual != message['sha'] or pr['head']['sha'] != actual or pr['head']['repo']['full_name'] != self.repo:
                raise ValueError(f'PR {number} has changed or uses another repository')
            if pr['state'] != 'open':
                raise ValueError(f'PR {number} is not open')
            result.append(pr)
        return result

    def stack(self, apply=False):
        prs = self.ready_prs()
        if self.github.head(self.repo, 'main') != self.config['base_sha']:
            raise ValueError('main changed; refresh the stack and rerun final CI')
        base_ref, base_sha = 'main', self.config['base_sha']
        plan = []
        for pr in prs:
            comparison = self.github.api(f"repos/{self.repo}/compare/{base_sha}...{pr['head']['sha']}")
            if comparison['merge_base_commit']['sha'] != base_sha:
                raise ValueError('Stack branches need rebasing; stop for an exception')
            plan.append({'pr_number': pr['number'], 'base': base_ref})
            if apply and pr['base']['ref'] != base_ref:
                self.github.api(f"repos/{self.repo}/pulls/{pr['number']}", 'PATCH', {'base': base_ref})
            base_ref, base_sha = pr['head']['ref'], pr['head']['sha']
        return plan

    def dispatch_ci(self, apply=False):
        self.stack(False)
        prs = self.ready_prs()
        for previous, pr in zip([None] + prs[:-1], prs):
            expected = previous['head']['ref'] if previous else 'main'
            if pr['base']['ref'] != expected:
                raise ValueError('Apply the checked stack before final CI')
        tip = prs[-1]
        plan = {'ref': tip['head']['ref'], 'sha': tip['head']['sha'], 'workflow': 'validate.yml'}
        if apply:
            if self.store.get('ci_dispatch'):
                raise ValueError('CI already dispatched; observe or reconcile the existing run')
            # Persist intent first. A crash cannot silently dispatch a duplicate run.
            self.store.put('ci_dispatch', {**plan, 'at': dt.datetime.now(dt.timezone.utc).isoformat()})
            self.github.run('workflow', 'run', 'validate.yml', '--repo', self.repo, '--ref', plan['ref'])
        return plan

    def accept_ci(self, run_id):
        dispatch = self.store.get('ci_dispatch')
        if not dispatch:
            raise ValueError('No recorded final CI dispatch')
        run = self.github.api(f'repos/{self.repo}/actions/runs/{run_id}')
        expected_workflow = self.github.api(f'repos/{self.repo}/actions/workflows/validate.yml')['id']
        if (run['workflow_id'] != expected_workflow or run['event'] != 'workflow_dispatch'
                or run['head_sha'] != dispatch['sha'] or run['head_branch'] != dispatch['ref']
                or run['created_at'] < dispatch['at'][:19] + 'Z'
                or run['status'] != 'completed' or run['conclusion'] != 'success'):
            raise ValueError('The full CI run does not match the dispatched tip')
        self.ready_prs()
        tip = self.github.head(self.repo, dispatch['ref'])
        if tip != dispatch['sha']:
            raise ValueError('The stack changed after CI')
        gate = {'sha': tip, 'tree': self.github.tree(self.repo, tip), 'run_id': run_id}
        self.store.put('ci_gate', gate)
        return gate

    def merge(self, apply=False):
        gate = self.store.get('ci_gate')
        if not gate:
            raise ValueError('A passing final-tree CI gate is required')
        results = []
        for number in reversed(self.config['prs']):
            pr = self.github.pr(self.repo, number)
            if pr.get('merged'):
                receipt = self.store.get('merge:' + str(number))
                if not receipt or receipt['merge_sha'] != pr['merge_commit_sha']:
                    raise ValueError('PR merged outside this journal; reconcile before continuing')
                continue
            expected_index = self.config['prs'].index(number)
            expected_base = ('main' if expected_index == 0 else
                             self.github.pr(self.repo, self.config['prs'][expected_index - 1])['head']['ref'])
            if pr['base']['ref'] != expected_base or pr['state'] != 'open':
                raise ValueError('PR stack topology changed')
            actual = self.github.head(self.repo, pr['head']['ref'])
            if self.github.tree(self.repo, actual) != gate['tree']:
                raise ValueError('Merge candidate differs from the CI-tested tree')
            # main remains pinned until the final PR merges.
            if self.github.head(self.repo, 'main') != self.config['base_sha']:
                raise ValueError('main changed after final CI')
            if not apply:
                # Lower branches acquire the final tree only after child merges.
                return [{'pr_number': number, 'sha': actual, 'status': 'ready'}]
            if pr['draft']:
                self.github.run('pr', 'ready', str(number), '--repo', self.repo)
            self.github.run('pr', 'merge', str(number), '--repo', self.repo, '--admin', '--squash',
                            '--match-head-commit', actual, '--subject',
                            'content: integrate tested batch' + (' [skip ci]' if expected_index else ''))
            after = self.github.pr(self.repo, number)
            if not after.get('merged'):
                raise ValueError('GitHub did not confirm the merge')
            self.store.put('merge:' + str(number), {'merge_sha': after['merge_commit_sha'], 'tested_tree': gate['tree']})
            result = {'pr_number': number, 'sha': actual, 'status': 'merged'}
            self.store.receive(result)
            results.append(result)
        return results

    def observe(self):
        """Read metadata only. Return changed three-field messages only."""
        changed = []
        for previous in self.store.snapshot():
            if previous['status'] == 'merged': continue
            pr = self.github.pr(self.repo, previous['pr_number'])
            actual = self.github.head(self.repo, pr['head']['ref'])
            status = previous['status']
            if actual != previous['sha'] or pr['state'] == 'closed':
                status = 'blocked'
            message = {'pr_number': previous['pr_number'], 'sha': actual, 'status': status}
            if message != previous:
                self.store.receive(message)
                changed.append(message)
        return changed


def workflow_result(github, repo, workflow, dispatch):
    runs = github.api(f"repos/{repo}/actions/workflows/{workflow}/runs?branch={dispatch['ref']}&event=workflow_dispatch&per_page=20")['workflow_runs']
    matches = [run for run in runs if run['head_sha'] == dispatch['sha']
               and run['created_at'] >= dispatch['at'][:19] + 'Z']
    if len(matches) > 1:
        raise ValueError('Multiple workflow runs match; reconcile the dispatch')
    return matches[0] if matches else None


def tick(store, github, apply=False):
    """Advance deterministic steps. Do not emit unchanged progress."""
    coordinator = Coordinator(store, github)
    config = coordinator.config
    messages = store.snapshot()
    if len(messages) != config.get('expected_prs', len(config['prs'])) or any(m['status'] in {'queued', 'working', 'blocked'} for m in messages):
        return []
    if not apply:
        return messages
    if not all(store.get('merge:' + str(n)) for n in config['prs']):
        if not store.get('ci_gate'):
            if not store.get('ci_dispatch'):
                coordinator.stack(apply)
                coordinator.dispatch_ci(apply)
                return []
            run = workflow_result(github, coordinator.repo, 'validate.yml', store.get('ci_dispatch'))
            if not run or run['status'] != 'completed': return []
            coordinator.accept_ci(run['id'])
        return coordinator.merge(apply)
    if not store.get('release'): return []
    from release import Release, ASTRA, WORKFLOW
    release = Release(store, github)
    for stage in ['dev', 'production']:
        if store.get('verified:' + stage): continue
        if not store.get('deploy:' + stage):
            release.dispatch(stage, apply)
            return []
        if not store.get('published:' + stage):
            run = workflow_result(github, ASTRA, WORKFLOW, store.get('deploy:' + stage))
            if not run or run['status'] != 'completed': return []
            release.accept(stage, run['id'])
        release.verify(stage, store.get('release')['manifest_path'])
        return []
    return []


def artifact(store, number, name, max_bytes=16000):
    """Read one configured artifact explicitly, with path and size limits."""
    if max_bytes < 1 or max_bytes > 16000:
        raise ValueError('Artifact limit must be between 1 and 16000 bytes')
    config = store.get('config')
    if number not in config['prs']:
        raise ValueError('Unknown PR')
    root = pathlib.Path(config['artifacts_root']).resolve()
    relative = config.get('artifacts', {}).get(str(number), {}).get(name)
    if not relative:
        raise ValueError('Unknown artifact name')
    path = (root / relative).resolve()
    if not path.is_relative_to(root):
        raise ValueError('Artifact escapes the configured root')
    data = path.read_bytes()
    return {'sha256': hashlib.sha256(data).hexdigest(), 'truncated': len(data) > max_bytes,
            'content': data[:max_bytes].decode('utf-8', errors='replace')}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--state', required=True)
    sub = parser.add_subparsers(dest='command', required=True)
    init = sub.add_parser('init'); init.add_argument('config')
    receive = sub.add_parser('receive'); receive.add_argument('message', help='JSON file, or - for stdin')
    sub.add_parser('status')
    reserve = sub.add_parser('reserve'); reserve.add_argument('branch')
    for command in ['stack', 'ci', 'merge']:
        child = sub.add_parser(command); child.add_argument('--apply', action='store_true')
    accept = sub.add_parser('accept-ci'); accept.add_argument('run_id', type=int)
    advance = sub.add_parser('tick'); advance.add_argument('--apply', action='store_true')
    advance.add_argument('--watch', action='store_true'); advance.add_argument('--interval', type=int, default=60)
    observe = sub.add_parser('observe'); observe.add_argument('--watch', action='store_true')
    observe.add_argument('--interval', type=int, default=60)
    read = sub.add_parser('artifact'); read.add_argument('pr_number', type=int); read.add_argument('name')
    args = parser.parse_args()
    store = Store(args.state)
    with store.lock():
        if args.command == 'init':
            config = validate_config(read_json(args.config))
            if store.get('config') and store.get('config') != config:
                raise ValueError('The batch configuration is immutable; create a new state directory')
            store.put('config', config); result = []
        elif args.command == 'receive':
            result = Coordinator(store, GitHub()).register(json.load(sys.stdin) if args.message == '-' else read_json(args.message))
        elif args.command == 'reserve':
            result = Coordinator(store, GitHub()).reserve(args.branch)
        elif args.command == 'status':
            result = store.snapshot()
        elif args.command == 'artifact':
            result = artifact(store, args.pr_number, args.name)
        else:
            coordinator = Coordinator(store, GitHub())
            if args.command == 'tick':
                if args.interval < 30: raise ValueError('Polling interval must be at least 30 seconds')
                result = tick(store, coordinator.github, args.apply)
            elif args.command == 'observe':
                if args.interval < 30:
                    raise ValueError('Polling interval must be at least 30 seconds')
                # Do not hold the write lock while waiting for another writer.
                result = coordinator.observe()
            elif args.command == 'accept-ci':
                result = coordinator.accept_ci(args.run_id)
            else:
                method = {'stack': coordinator.stack, 'ci': coordinator.dispatch_ci, 'merge': coordinator.merge}[args.command]
                result = method(args.apply)
    if result:
        print(json.dumps(result, ensure_ascii=False), flush=True)
    if args.command in {'observe', 'tick'} and args.watch:
        while True:
            time.sleep(args.interval)
            with store.lock():
                result = tick(store, GitHub(), args.apply) if args.command == 'tick' else Coordinator(store, GitHub()).observe()
            if result:
                print(json.dumps(result), flush=True)


if __name__ == '__main__':
    try:
        main()
    except (ValueError, RuntimeError, BlockingIOError, KeyError) as error:
        # The caller requests this bounded diagnostic only after a failed command.
        print(str(error)[:4000], file=sys.stderr)
        sys.exit(1)
