# The .de update clarifies registration duties and contract duration

The package updates existing English and German pages at the existing `de` slug.
The source revision is `4ec5cb8f88ae9f08eba4e522f88c3ed0b59a305e`.
The author used `gpt-6.1-sol`, as reported by the session usage helper.
The local editorial date is 21 October 2026, America/Los_Angeles.
The English and German publication dates remain unchanged.

## DENIC provides the registration authority

The author opened DENIC's actual Domain Terms and Conditions and Domain Guidelines.
Sections 3(4), 7(1), and 1(4) establish the representative deadline, indefinite contract, and transfer-password duration.
Sections 2, 3, and 7 establish verification duties and consequences for incorrect data.
The guidelines establish IDN length in ACE form and the two-position hyphen restriction.
IANA establishes the delegation date and operator only.

The update removes an incorrect description that implied DENIC operated since 1986.
The update separates the 1986 delegation from DENIC's 1996 founding.
The update removes a blanket claim about all ccTLDs and ICANN contracts.
The update removes unsupported assurances about low abuse and inbox delivery.
The update corrects the comparison table's .eu classification to ccTLD.
The update removes old historical counts that the author could not reconfirm.

Some trailing-slash DENIC URLs returned 503 responses.
Direct requests also failed, and Chrome reported `ERR_BLOCKED_BY_CLIENT`.
The equivalent slashless registration and organization pages opened successfully through web browsing.
The unreachable anniversary retrospective no longer supports any retained historical count.
The primary sources listed in the pages were opened on 21 October 2026 local time.

## Measured demand supports the existing German page

The evidence JSON retains exact requests, returned variants, averages, and monthly series.
Google Ads returned October 2025 through September 2026 history on 22 October 2026 UTC.
The requests used `GOOGLE_SEARCH`, with separate language and country criteria.
The author verified German `1001` and French `1002` against Google's official codes page before requesting metrics.

| Pair | Observations | Decision |
| --- | --- | --- |
| German / Germany, language 1001, geography 2276 | `de domain kaufen`: 590 average monthly searches; `de domain registrieren`: 90; `de domain kosten`: 90 | Preserve the existing translation and repair exposed contradictions. Registration and cost intent fits the page. |
| French / France, language 1002, geography 2250 | `nom de domaine de`: 20; `domaine allemand`: 590; the other two queries lacked metrics | Defer a new translation. The large term has winery intent, and the small domain-specific term does not justify another complete maintained locale now. |

The German search result set included registrar .de purchasing pages.
The unqualified French search returned Domaine Allemand wine pages and menus.
The author excluded the ambiguous 590 figure from qualified domain demand.
Missing metrics remain UNKNOWN, not zero.
No returned result included a `closeVariants` field.
The measurement does not establish demand for untested locale/region pairs.
All untested locales remain deferred without a claim of zero demand.

The GSC supplement covers 21 September through 18 October 2026.
The .de page group has 18 observed impressions and no observed clicks.
Germany accounts for five impressions; France accounts for one.
GSC is supplemental site evidence, with anonymization and row limitations.

## The German repair preserves existing prose

The German page remains an existing translation, not a new full translation.
The repair updates the new registration, verification, contract, transfer, and image segments.
The repair removes outdated WHOIS generalizations and unqualified SEO and email assurances.
Relationship metadata now uses the English ordered slugs with German locale prefixes.
The changed legal paragraphs preserve the same deadlines and conditions in both languages.
The changed German prose and FAQs passed a direct bilingual comparison.
No human native-language review or deployed renderer inspection occurred in this local package.

## The new illustration passed visual inspection

The new asset is `content/assets/de-01-worldwide-registration.jpg` at 1200 × 675.
The asset shows worldwide registration and a German audience with a globe, .de card, and German flag.
Both pages reference the same image with localized alternative text.
The author used the repository inline generator, adapted privately for immutable response persistence.
The official SVG logotype was composited in the top-right reserve.
Visual inspection confirmed cream full bleed, safe margins, no clipped objects, correct `.de` spelling, and clear logo space.
The first inline attempt passed; no inline retry occurred.
The inline API returned 412 input tokens and 5,488 output tokens, totaling 5,900.
The private successful response remains in `/private/tmp/namefi-stack48/24-de/image-attempt1.response.private.json`.
The immutable usage sidecar is `image-attempt1.usage.json` in that same scratch directory.
The author also inspected the existing `de-og.jpg` and found artwork inside the required bottom caption band.
The author regenerated the cover with the approved cover generator.
The cover attempt has separate immutable response and usage files in private scratch.
The regenerated cover measures 1200 × 630 and passed inspection of spelling, margins, logo space, and bottom reserve.
The first cover attempt passed with no retry.
The cover API returned 735 input tokens and 3,401 output tokens, totaling 4,136.
Both requests specified `gpt-image-2` and `quality: high`.
The API responses did not return a model identifier; the evidence preserves null rather than inventing a response field.

## Local sanity passed before the handoff

`bun run data:validate` passed with 37 pre-existing warnings.
The global locale check reported zero locale or relationship mismatches.
The FAQ check reported matching body and frontmatter answers.
`bun run lint:mdx` passed.
The focused link audit reported zero broken links and zero locale, relationship, or fallback issues.
The author checked image dimensions, image references, and `git diff --check` locally.
The author performed no remote writes, hosted CI, reviews, merges, or releases.

The actual content locales are English and German only.
Expected production routes are `https://namefi.io/r/en/tld/de/` and `https://namefi.io/r/de/tld/de/`.
The renderer must emit self-canonicals, reciprocal English/German hreflang, and English x-default after deployment.
No unsupported SEO frontmatter fields were introduced.
The remote gate remains closed; deployed checks belong to the later authorized publication stage.
