# The coordinator exchanges only three fields

The coordinator handles metadata with Python and SQLite.
Routine coordination makes no model calls and never reads article bodies.
A writer sends exactly this JSON object after creating a real PR:

```json
{"pr_number": 385, "sha": "0123456789abcdef0123456789abcdef01234567", "status": "ready"}
```

Statuses are `queued`, `working`, `ready`, `blocked`, and `merged`.
`ready` attests that the writer completed research, selected translations,
image inspection, usage records, and local content sanity checks.
Writers keep those artifacts in the topic package.
Writers do not paste article text or research into status messages.
The coordinator does not start new article assignments automatically.

## The batch configuration keeps metadata outside model context

Create a private `batch.json` with the repository, ordered PR numbers,
initial main SHA, artifact root, and named artifact paths:

```json
{
  "repo": "d3servelabs/namefi-resources",
  "prs": [],
  "expected_prs": 49,
  "base_sha": "0123456789abcdef0123456789abcdef01234567",
  "artifacts_root": "/absolute/path/to/topic-artifacts",
  "artifacts": {"385": {"sanity": "topic-one/sanity.json"}}
}
```

The queue starts empty and accepts the expected number of real PRs.
A 48-topic batch with a separate integration PR expects 49 PRs.
The PR order runs from the main-based integration PR to the final topic PR.
The first PR must already contain the isolated batch base.
A writer runs `reserve codex/WRITER-BRANCH` before pushing a topic PR.
The reservation returns the exact base branch and SHA.
A competing writer retries without waking a coordinator model.
The three-field `receive` command registers the draft PR and releases the reservation.
Writers base each branch on the reserved tip.
A pre-existing stack can initialize `prs` with its ordered PR numbers.
The coordinator checks ancestry and can correct PR base references.
An ancestry conflict stops automation for a bounded exception.
The coordinator never silently rebases another writer's work.
A separate batch state directory holds each immutable configuration.

```sh
python3 scripts/content-batch/coordinator.py --state /tmp/namefi-batch init batch.json
python3 scripts/content-batch/coordinator.py --state /tmp/namefi-batch receive message.json
python3 scripts/content-batch/coordinator.py --state /tmp/namefi-batch status
python3 scripts/content-batch/coordinator.py --state /tmp/namefi-batch artifact 385 sanity
```

Normal snapshots contain only the three handoff fields.
Duplicate handoffs do not create duplicate events.
An artifact read requires an explicit name and returns at most 16,000 bytes.
Resolved artifact paths must stay inside the configured root.
Keep secrets outside the artifact root.
Read source evidence only when an exception or content decision requires evidence.

## The program advances CI and merges without model polling

Authoring uses draft PRs, local sanity checks, and `[skip ci]` commits.
Authoring does not dispatch CI or request third-party review.
Existing GitHub App settings remain an external prerequisite.
The coordinator never changes those settings or requests a review.
Once every handoff is ready, start the deterministic driver:

```sh
python3 scripts/content-batch/coordinator.py --state /tmp/namefi-batch tick --apply --watch
```

The driver checks metadata at 60-second intervals.
The driver dispatches the checked-in `validate.yml` on the exact final tip.
The driver validates workflow identity, event, ref, SHA, and successful completion.
The driver then collapses the stack from tip to base with admin squash merges.
Each merge must preserve the tested tree and match the current branch SHA.
The final main merge omits `[skip ci]` so Astra receives the normal sync event.
Changed main, changed topology, or changed content stops the driver.
The journal prevents automatic redispatch after an interrupted workflow dispatch.
An uncertain remote write requires explicit reconciliation before retry.
Commands omit remote writes unless the caller supplies `--apply`.
Use `stack`, `ci`, `accept-ci`, and `merge` for individual recovery steps.


## The operations guide covers publication and cache settings

[The operations guide](OPERATIONS.md) defines pinned Astra releases, live checks,
stable API request prefixes, bounded exception requests, and raw usage receipts.
The offline tests run without GitHub mutations or paid API calls.

```sh
python3 -m unittest discover -s scripts/content-batch -p 'test_*.py'
```
