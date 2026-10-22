# The batch records actual writer usage and topic delivery

The owner authorized 48 topic packages: 35 blog topics and 13 TLD topics.
The packages cover 47 distinct English pages after G01/G02 deduplication.
Seven English pages are new; 40 existing English pages receive updates.

- `actual-writer-usage.csv` provides one comparable row per topic.
- `actual-writer-usage.json` retains writer counters and evidence paths.
- `topic-stack.json` records the ordered topic PRs and exact commits.

## The counters measure complete fresh writer sessions

All 48 writers used fresh sessions with actual model `gpt-6.1-sol`.
Input includes cached input; output includes reasoning output.
Do not add those subsets again.
Counters include setup, research, writing, translation, image handling, sanity checks, and handoff.
Phase snapshots in topic evidence can overlap or miss the first boundary.
The snapshots do not establish isolated research and writing invoices.
Shared coordination and later CI or release work fall outside writer totals.
These counters measure neither ChatGPT Pro quota nor an API invoice.

Image API usage remains separate in each topic evidence directory.
G11 lacks one discarded attempt value; G19 lacks two discarded attempt values.
Missing values are unknown, not zero.

## Translation coverage follows measured locale and region evidence

Topic evidence records selected translations and deferred languages.
Unsupported runtime locales remain deferred despite observed demand.
Unknown search volume remains unknown.
No independent human native-language QA occurred.
Production canonical, language alternates, content, and image checks remain release gates.
