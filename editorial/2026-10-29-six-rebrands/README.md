# The six articles answer brand and domain questions

The user approved six English case studies for the existing Name Change, Game Change series.
Each article answers a practical search question before explaining the rename and domain history.
The articles occupy series orders 21–26. English publication does not require new translations.
The proposed content is public. This editorial record contains public facts and process notes.

`verified-facts.json` records the source URLs, supported claims, and excluded claims for each article.
The coordinator opened the primary sources on October 29, 2026 and checked each manuscript against those facts.
Company explanations remain attributed explanations. Domain prices and measured SEO benefits remain absent.

## The source checks distinguish brand names from corporate names

- Wise announced the rename on February 22, 2021. The green visual refresh followed in 2023.
- Booking Holdings renamed the parent. Priceline and Booking.com remained distinct consumer brands.
- Expedia retired HomeAway in the United States in 2020 and moved traffic to Vrbo.
  The original press page blocked both direct and headless-browser access.
  The verified sources are Expedia disclosures filed with the SEC, plus current Vrbo help pages.
- Kit describes a kit.com purchase opportunity in late 2023. The article does not invent a closing date or price.
- Brevo engineering documents the 2023 acquisition and subsequent renewal incident.
  The article does not repeat the postmortem's unsupported legal interpretation of registrar transfer requirements.
- Block announced the corporate rename on December 1, 2021. The SEC filing confirms the December 10 effective date.
  The article does not describe squareup.com as a migration to block.xyz.

## The production process preserves the existing article style

Each draft used a separate tool-free Claude Sonnet 4.6 request with the verified facts as input.
The coordinator reviewed every finished manuscript. The prompts required short active sentences and direct primary citations.
The production renderer may strip raw HTML IDs, so citations use direct source URLs.
Each article has a cover and three section illustrations. The images use the canonical repository prompts and official logo.
The generation scripts retain their layout and compositing logic. A Python HTTPS transport replaces token-bearing curl arguments.
GuestSafe injects credentials into the intended process. The transport refuses redirects and suppresses response bodies on errors.
Temporary prompts, API responses, raw writer output, and the blocked-source browser recording remain outside the repository.

## The validation record will accompany the pull request

The initial content check found missing relationship metadata on the six new articles.
The coordinator completed the required arrays and reran the checks.
The coordinator also removed unsupported claims from the writer drafts, including assumed domain purchases, SEO benefits, and cultural guarantees.
The image review replaced inaccurate symbols, invented status and renewal details, and unsupported product promises.
The final check results appear in `validation.json`.
This task prepares reviewable articles. This task does not merge the pull request or deploy the articles.

The CLI produced one usable draft and one output without the opening YAML delimiter.
The coordinator stopped the remaining owned CLI writer processes after delays.
The direct Anthropic interface produced the remaining drafts with the same Sonnet model.
The record does not estimate tokens or costs for interrupted CLI requests.
