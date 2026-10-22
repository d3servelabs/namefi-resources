# This folder records the .to update evidence

Order41 / O09 updates the existing English .to guide and adds complete German
and Japanese translations. The package contains one revised cover image.
The author performed local checks and a local commit only.

| File | Purpose |
| --- | --- |
| `evidence.md` | Sources, translation selection, image QC, sanity, URLs, and limitations |
| `ads-de-DE.json` | Complete German/Germany historical metrics request and response |
| `ads-ja-JP.json` | Complete Japanese/Japan historical metrics request and response |
| `ads-cs-CZ.json` | Complete Czech/Czechia historical metrics request and response |
| `gsc-evidence.json` | Topic-only observed site data and limitations |
| `image-usage.json` | Both image attempts, returned usage, and visual QC |
| `translation-sanity.json` | Heading, image, source-URL, and locale-link parity |
| `usage-checkpoints.json` | Actual available session counters and timestamps |

The source fetch date is October 22, 2026 UTC, or October 21 in Los Angeles.
Google Ads monthly series cover October 2025 through September 2026.
Missing metrics mean UNKNOWN. Czech lacks a supported renderer route.
Private image response payloads remain outside Git.
