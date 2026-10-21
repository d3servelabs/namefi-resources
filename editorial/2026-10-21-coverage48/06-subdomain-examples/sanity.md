# Local sanity passes for the updated guide

The writer ran `TMPDIR=/private/tmp bun run data:validate` on the topic worktree.
The validator passed with 37 existing corpus warnings, zero locale mismatches, and zero relationship mismatches across 4055 files.
The FAQ check passed across 369 pages and 1633 FAQs.
The writer ran `bun run lint:mdx`; the command exited zero.
The writer checked all five referenced image paths and verified the new image at 1200 × 675 pixels.
The reused cover measures 1200 × 630 pixels, and the three reused inline illustrations measure 1200 × 675 pixels.
The writer inspected final images for text, margins, official logo placement, and factual diagram meaning.
The writer ran `git diff --check` with no findings.
The writer made no shared README changes because existing inventory descriptions remain accurate.

## Usage records preserve emitted counters rather than estimates

The checkpoint record identifies the actual `gpt-6.1-sol` session and latest emitted cumulative counters at each capture.
The research-start capture follows initial instruction and source loading, so the record does not attribute the earlier loading to the measured research span.
Research and image work overlap with writing; phase differences must not be summed as mutually exclusive costs.
No translation phase occurred because neither evaluated locale was selected.
Image usage records preserve the one API attempt before any possibility of regeneration.
OpenAI returned 465 input tokens, 5488 output tokens, and 5953 total image tokens.
The model usage counters include cached input, and reasoning output forms part of output.
Account-wide allowance attribution is unavailable.

## Remote operations remain closed

The package contains local content and a local commit only.
No hosted CI, code review, third-party review, push, or pull request operation occurred.
