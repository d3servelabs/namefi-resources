# The operator can resume publication and model stages

## Publication uses the existing Astra workflow

After the existing Astra sync finishes, create a release configuration:

```json
{
  "astra_sha": "0123456789abcdef0123456789abcdef01234567",
  "branch_prefix": "codex/content-release-example",
  "manifest_path": "/absolute/path/to/live-manifest.json",
  "manifest_sha256": "sha256-of-the-live-manifest",
  "origins": {"dev": "https://development-host", "production": "https://namefi.io"}
}
```

Initialize publication with `release.py --state STATE init release.json`.
The coordinator verifies that Astra pins the merged Resources commit.
The driver then resumes development publication, live verification, and production publication.
Each stage uses a distinct branch pinned to the accepted Astra SHA.
The existing `deploy-resources.yml` performs the full build and production promotion.
The coordinator never substitutes local deployment commands.

The live manifest contains `resources_sha`, `pages`, and `assets`.
Each page specifies `path`, `locale`, `title`, `marker`, and `alternates`.
Each changed asset specifies `path` and `sha256`.
Expectations must include every real topic locale and changed image.
The verifier checks current text, language, self canonical, reciprocal alternates,
production indexing directives, and advertised image availability.
The verifier retains full HTTP evidence outside normal coordination messages.
The deployment configuration and manifest remain operator-supplied inputs.
No new deployment occurs merely by installing these scripts.

## Model stages use stable prefixes and bounded exceptions

`model_request.py` builds Responses API payloads without making paid calls.
Each role uses a fixed developer prefix and a separate task input.
An explicit cache breakpoint covers the stable prefix with a 30-minute TTL.
The dynamic task follows the breakpoint and does not request another cache write.
No request inherits the parent conversation or uses `previous_response_id`.
A changed prefix requires a versioned state directory.
Keep tools, schemas, model settings, and instructions stable in the API caller.
Do not send empty requests to maintain cache entries.

Exception preparation allows 60 requests per batch and 20,000 UTF-8 bytes of text per request.
The byte ceiling is a conservative text bound, rather than a measured token count.
The provider receipt supplies actual token usage.
`model_request.py --state STATE usage response.json` retains only receipt ID and raw usage.
Duplicate receipt IDs do not double-count usage.
Cached input and reasoning output remain subsets of provider totals.
The API caller remains responsible for billed cache-write and tool usage records.

Run `python3 -m unittest discover -s scripts/content-batch -p 'test_*.py'`.
The offline tests cover stale heads, failed CI, stack order, retries,
pinned releases, production gates, bounded evidence, and live metadata failures.
The tests make no GitHub mutations or paid API calls.
