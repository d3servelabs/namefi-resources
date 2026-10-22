"""Publish a tested batch through the existing Astra workflow."""
import argparse
import datetime as dt
import hashlib
import json
import re
import sys

from coordinator import Store, GitHub, SHA, read_json

ASTRA = 'd3servelabs/namefi-astra'
WORKFLOW = 'deploy-resources.yml'


class Release:
    def __init__(self, store, github):
        self.store, self.github = store, github

    def initialize(self, config):
        batch = {**self.store.get('config'), 'prs': self.store.order()}; gate = self.store.get('ci_gate')
        if not gate or not all(self.store.get('merge:' + str(n)) for n in batch['prs']):
            raise ValueError('Merge the CI-tested batch before publication')
        resources_sha = self.store.get('merge:' + str(batch['prs'][0]))['merge_sha']
        if not SHA.fullmatch(config['astra_sha']) or not re.fullmatch(r'codex/[a-z0-9-]+', config['branch_prefix']):
            raise ValueError('Pin the Astra SHA and use a codex/ branch prefix')
        link = self.github.api(f"repos/{ASTRA}/contents/apps/resources/data?ref={config['astra_sha']}")
        if link['sha'] != resources_sha:
            raise ValueError('Astra does not pin the merged Resources commit')
        config = {**config, 'resources_sha': resources_sha}
        if self.store.get('release') and self.store.get('release') != config:
            raise ValueError('The release configuration is immutable')
        self.store.put('release', config)
        return config

    def dispatch(self, stage, apply=False):
        config = self.store.get('release')
        if not config: raise ValueError('Initialize the release first')
        if stage == 'production' and not self.store.get('verified:dev'):
            raise ValueError('Development publication and live verification must pass first')
        ref = config['branch_prefix'] + '-' + stage
        plan = {'ref': ref, 'sha': config['astra_sha'], 'environment': stage, 'operation': 'full'}
        if apply:
            if self.store.get('deploy:' + stage):
                raise ValueError('Dispatch already recorded; reconcile instead of duplicating')
            # Distinct pinned refs separate development and production workflow runs.
            self.github.api(f'repos/{ASTRA}/git/refs', 'POST', {'ref': 'refs/heads/' + ref, 'sha': plan['sha']})
            self.store.put('deploy:' + stage, {**plan, 'at': dt.datetime.now(dt.timezone.utc).isoformat()})
            args = ['workflow', 'run', WORKFLOW, '--repo', ASTRA, '--ref', ref,
                    '-f', 'environment=' + stage, '-f', 'operation=full']
            if stage == 'production': args += ['-f', 'confirm_production=deploy-resources-production']
            self.github.run(*args)
        return plan

    def accept(self, stage, run_id):
        dispatch = self.store.get('deploy:' + stage)
        if not dispatch: raise ValueError('No matching publication dispatch')
        run = self.github.api(f'repos/{ASTRA}/actions/runs/{run_id}')
        workflow_id = self.github.api(f'repos/{ASTRA}/actions/workflows/{WORKFLOW}')['id']
        if (run['workflow_id'] != workflow_id or run['event'] != 'workflow_dispatch'
                or run['head_sha'] != dispatch['sha'] or run['head_branch'] != dispatch['ref']
                or run['created_at'] < dispatch['at'][:19] + 'Z'
                or run['status'] != 'completed' or run['conclusion'] != 'success'
                or self.github.head(ASTRA, dispatch['ref']) != dispatch['sha']):
            raise ValueError('Publication run failed or does not match the pinned stage')
        self.store.put('published:' + stage, {'run_id': run_id, 'sha': dispatch['sha']})
        return {'run_id': run_id, 'status': 'success'}

    def verify(self, stage, manifest_path):
        from verify_live import verify
        config = self.store.get('release')
        if not self.store.get('published:' + stage): raise ValueError('Publication has not passed')
        raw = open(manifest_path, 'rb').read()
        if hashlib.sha256(raw).hexdigest() != config['manifest_sha256']:
            raise ValueError('The live verification manifest changed')
        manifest = json.loads(raw)
        if manifest['resources_sha'] != config['resources_sha']:
            raise ValueError('Live expectations belong to another Resources commit')
        report = verify(manifest, config['origins'][stage], stage)
        (self.store.root / ('live-' + stage + '.json')).write_text(json.dumps(report, ensure_ascii=False, indent=2))
        if report['issues']: raise ValueError('Live verification failed; read the report on demand')
        self.store.put('verified:' + stage, {'sha': config['astra_sha'], 'manifest_sha256': config['manifest_sha256']})
        return {key: report[key] for key in ['page_count', 'asset_count', 'additional_media_count', 'issues']}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--state', required=True)
    sub = parser.add_subparsers(dest='command', required=True)
    init = sub.add_parser('init'); init.add_argument('config')
    dispatch = sub.add_parser('dispatch'); dispatch.add_argument('stage', choices=['dev', 'production'])
    dispatch.add_argument('--apply', action='store_true')
    accept = sub.add_parser('accept'); accept.add_argument('stage', choices=['dev', 'production']); accept.add_argument('run_id', type=int)
    verify = sub.add_parser('verify'); verify.add_argument('stage', choices=['dev', 'production']); verify.add_argument('manifest')
    args = parser.parse_args(); store = Store(args.state)
    with store.lock():
        release = Release(store, GitHub())
        if args.command == 'init': result = release.initialize(read_json(args.config))
        elif args.command == 'dispatch': result = release.dispatch(args.stage, args.apply)
        elif args.command == 'accept': result = release.accept(args.stage, args.run_id)
        else: result = release.verify(args.stage, args.manifest)
    print(json.dumps(result))


if __name__ == '__main__':
    try: main()
    except (ValueError, RuntimeError, BlockingIOError, KeyError) as error:
        print(str(error)[:4000], file=sys.stderr); sys.exit(1)
