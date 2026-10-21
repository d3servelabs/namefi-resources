# This package prepares the registrar guide for local integration

G19 is target 3 in the authorized 48-target batch.
The package creates `choose-domain-registrar` in English and German.
The English guide covers costs, account recovery, DNS choices, and exit procedures.
The existing registrar glossary does not answer the full selection task.

## The evidence files record the writing decisions

| File | Purpose |
| --- | --- |
| [decision.md](decision.md) | Semantic overlap, translation selection, market intent, and delivery limits |
| [source-evidence.md](source-evidence.md) | Eight opened primary sources and supported statements |
| `ads-de-DE.json` | German demand in Germany, including monthly history |
| `ads-es-MX.json` | Spanish demand in Mexico and deferral evidence |
| `ads-ja-JP.json` | Japanese demand in Japan and deferral evidence |
| `gsc-summary.json` | Topic-relevant observed visibility by market |
| `image-manifest.json` | Five final assets, hashes, dimensions, usage, and visual inspection |
| `local-sanity.json` | Content, relationship, locale, link, and translation checks |
| `phases.json` | UTC phase checkpoints |
| `actual-usage.json` | Actual sampled session counters and timing limits |

German selection uses direct registrar-comparison demand and relevant German search results.
Spanish and Japanese remain deferred with recorded demand and intent reasons.
The decision does not apply a universal numeric threshold.
Unmeasured markets remain UNKNOWN.

## Local checks passed and remote operations remain blocked

The data validator passed with 37 existing warnings.
MDX lint passed. The scoped link check found zero blocking errors.
Four German links use accepted English fallback at German routes.
Both locale pages preserve identical ordered relationship slugs.
The image set contains one 1200 × 630 cover and four 1200 × 675 illustrations.
The cover and DNS diagram required one regeneration each and passed final inspection.

No push, pull request, code review, hosted CI, merge, or publication occurred.
The coordinator owns later integration and deployed verification.
The expected real locale URLs are `/r/en/blog/choose-domain-registrar/` and `/r/de/blog/choose-domain-registrar/`.
