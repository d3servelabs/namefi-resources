"""Reconcile the existing US-English intent model with the completed batch."""
import argparse
import json
import pathlib
import subprocess


def audit(root, clusters):
    assignments = json.loads((root / 'editorial/2026-10-21-coverage48/batch-metrics/topic-stack.json').read_text())['topics']
    completed = {row['english_path'] for row in assignments}
    new_matches = {'domain-registrar': 'content/blog/en/choose-domain-registrar.md'}
    article_clusters = [c for c in clusters if c['format'] in {'article', 'tld'}]
    article_ids = set()
    for metric in ['reported_monthly_demand', 'vector_sensitivity_demand']:
        total = sum(c[metric] for c in article_clusters)
        accumulated = 0
        for c in sorted(article_clusters, key=lambda c: -c[metric]):
            if accumulated < .9 * total: article_ids.add(c['cluster_id'])
            accumulated += c[metric]

    def remaining(selected):
        new = [c for c in selected if c['action'] == 'new_article'
               and not (c['cluster_id'] in new_matches and (root / new_matches[c['cluster_id']]).exists())]
        existing = sorted({c['existing_path'] for c in selected if c['existing_path'] and c['existing_path'] not in completed})
        return {'selected_clusters': len(selected), 'new_article_candidates': [c['cluster_id'] for c in new],
                'existing_pages_to_recheck': existing,
                'product_intents_to_audit': [c['cluster_id'] for c in selected if c['action'] == 'product_review'],
                'unresolved_intents': [c['cluster_id'] for c in selected if c['action'] == 'needs_split_review']}

    return {'basis': 'Existing Google Ads US-English model; inventory reconciliation, not a ranking audit',
            'content_commit': subprocess.check_output(['git', '-C', str(root), 'rev-parse', 'HEAD'], text=True).strip(),
            'completed_topics': len(assignments), 'completed_unique_english_pages': len(completed),
            'approved_batch_remaining': 0,
            'all_intents': remaining([c for c in clusters if c['recommended_90_set']]),
            'article_reference_only': remaining([c for c in article_clusters if c['cluster_id'] in article_ids]),
            'translations_required_for_us_english_scope': 0,
            'remaining_demand_qualified_translations': None,
            'translation_limit': 'No multi-market keyword denominator exists; unknown does not mean zero.'}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', default='.'); parser.add_argument('--clusters', required=True)
    args = parser.parse_args()
    print(json.dumps(audit(pathlib.Path(args.root).resolve(), json.loads(pathlib.Path(args.clusters).read_text())), indent=2))
