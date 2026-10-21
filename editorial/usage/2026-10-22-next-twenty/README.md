# The writers preserve observed counters for the next twenty articles

Each article records actual emitted Codex counters at research start, research end and writing/text-review end. Writers process articles sequentially, so intervals do not overlap. Cached input is a subset of input; reasoning output is a subset of output. Initialization, handoff, shared coordination, images, integration review, validation and publication are outside these intervals. Counters include repeated context and tool-call overhead. No account-wide allowance attribution is implied.

`aggregate.json` separates initial writing from tracked revisions. `writing_including_revisions_delta` sums both writing intervals. `combined_delta` already includes research and both writing intervals; do not add the convenience sum again. The audit matched all eighty-six original and revision boundary events.
