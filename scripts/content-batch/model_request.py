"""Build bounded stage requests and preserve provider usage without replaying history."""
import argparse
import hashlib
import json
import pathlib
import sys
from coordinator import Store, read_json


def build_request(prefix, task, role='writer'):
    if role not in {'writer', 'exception'}: raise ValueError('Unknown model role')
    limit = 20000 if role == 'exception' else 120000
    if len(prefix.encode()) + len(task.encode()) > limit:
        raise ValueError('Stage input exceeds the UTF-8 byte budget; retrieve a smaller artifact')
    return {'model': 'gpt-6.1-sol', 'store': False,
            'prompt_cache_options': {'mode': 'explicit', 'ttl': '30m'},
            'input': [{'role': 'developer', 'content': [{'type': 'input_text', 'text': prefix,
                       'prompt_cache_breakpoint': {'mode': 'explicit'}}]},
                      {'role': 'user', 'content': [{'type': 'input_text', 'text': task}]}],
            'max_output_tokens': 1500 if role == 'exception' else 8000}


def record_usage(store, response):
    response_id = response['id']; usage = response['usage']
    if not isinstance(response_id, str) or not isinstance(usage, dict): raise ValueError('Invalid provider receipt')
    key = 'usage:' + response_id
    previous = store.get(key)
    if previous and previous != usage: raise ValueError('Usage receipt changed for the same response')
    store.put(key, usage)
    return {'response_id': response_id, 'recorded': True}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--state', required=True)
    sub = parser.add_subparsers(dest='command', required=True)
    build = sub.add_parser('build'); build.add_argument('role', choices=['writer', 'exception'])
    build.add_argument('prefix'); build.add_argument('task')
    receipt = sub.add_parser('usage'); receipt.add_argument('response', help='Provider JSON receipt; only usage is retained')
    args = parser.parse_args(); store = Store(args.state)
    with store.lock():
        if args.command == 'usage': result = record_usage(store, read_json(args.response))
        else:
            prefix, task = pathlib.Path(args.prefix).read_text(), pathlib.Path(args.task).read_text()
            digest = hashlib.sha256(prefix.encode()).hexdigest(); key = 'prefix:' + args.role
            if store.get(key) and store.get(key) != digest: raise ValueError('Version the state directory before changing a stable prefix')
            result = build_request(prefix, task, args.role)
            if args.role == 'exception':
                calls = store.get('exception_requests', 0)
                if calls >= 60: raise ValueError('The batch exception budget is exhausted')
                store.put('exception_requests', calls + 1)
            store.put(key, digest)
    print(json.dumps(result, ensure_ascii=False))


if __name__ == '__main__':
    try: main()
    except (ValueError, KeyError) as error:
        print(str(error)[:4000], file=sys.stderr); sys.exit(1)
