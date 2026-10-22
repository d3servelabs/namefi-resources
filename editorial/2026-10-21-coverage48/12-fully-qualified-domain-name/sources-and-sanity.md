# Opened primary sources support the FQDN examples

The writer opened these sources on 2026-10-21 UTC and checked the relevant sections.
The English update preserves the existing guide's job and existing source links.

| Primary source | Supported claims |
| --- | --- |
| https://www.rfc-editor.org/rfc/rfc9499.html#section-2 | Root label, strict presentation, common display and contextual relative names |
| https://www.rfc-editor.org/rfc/rfc1034.html#section-3.1 | Hierarchy, empty root label, relative search lists and fixed master-file origin |
| https://www.rfc-editor.org/rfc/rfc1035.html#section-5.1 | Owner syntax, TTL/class/type order, absolute names and origin concatenation |
| https://bind9.readthedocs.io/en/stable/manpages.html#dig-dns-lookup-utility | Search disabled by default, ndots, domain enables search, showsearch, question display |
| https://kubernetes.io/docs/concepts/services-networking/dns-pod-service/#pod-s-dns-config | Pod searches and options, container resolver configuration, Windows differences |
| https://www.rfc-editor.org/rfc/rfc6066.html#section-3 | SNI HostName omits the final dot |

The writer also opened Japanese primary terminology sources: JPNIC's
https://www.nic.ad.jp/ja/basics/terms/fqdn.html and Microsoft's
https://learn.microsoft.com/ja-jp/windows/win32/dns/naming-conventions.
Those sources establish the native technical register and terminology.
The writer keeps 完全修飾ドメイン名, 相対名, オリジン, ホスト名 and 検索サフィックス consistent.
Linked glossary labels follow the existing Japanese termbase.

## The update complements related existing articles

The writer read `nslookup-specific-dns-server.md`, `dns-record-types-guide.md`
and `subdomain-examples.md` before editing.
Those pages explain server selection, record roles and subdomain uses.
The FQDN article retains its distinct job: identify the exact DNS name after context completion.
The update adds practical examples rather than duplicating the broader DNS guides.
The writer considered the root, content, blog and English inventory README files.
No shared README change is necessary for an existing URL and one selected counterpart.

## One new image passes visual inspection

The new asset is `content/assets/fully-qualified-domain-name-05-absolute-relative.jpg`.
The writer used the repository's inline harness, adapted only for safe header injection
and immutable usage capture in private scratch.
The request used `gpt-image-2`, high quality, 1536×1024.
The final progressive JPEG is 1200×675, approximately 36 KB.
The response omits the model field, so the requested model and returned model remain distinct.

The writer opened the final image at full size.
The cream dot-grid reaches all edges, and the diagram has generous margins.
The official logo occupies the empty top-right corner.
Every domain string and final dot matches the intended illustration.
The first row completes `www` under `$ORIGIN example.com.`.
The second row retains the absolute `www.example.net.`.
The image needs no retry.
The sidecar reports 455 input tokens, 5,488 output tokens and 5,943 total tokens.
No estimate substitutes for returned usage.

The existing cover and four inline assets remain valid and unchanged:
`fully-qualified-domain-name-og.jpg` (1200×630),
`fully-qualified-domain-name-01-root-label.jpg`,
`fully-qualified-domain-name-02-search-context.jpg`,
`fully-qualified-domain-name-03-zone-origin.jpg`, and
`fully-qualified-domain-name-04-diagnostic-boundary.jpg` (each 1200×675).
The writer inspected a contact sheet for spelling, cropping, logo placement and topic fit.
No prior generation usage is attributed to the current package.

## Local content checks pass for both real pages

- `TMPDIR=/private/tmp bun run data:validate`: exit 0, 37 existing warnings.
  The check includes 13 passing validator tests, frontmatter and locale checks.
  The repository scan reports zero locale and relationship mismatches.
- `bun run lint:mdx`: exit 0.
- Focused cross-link audit for both FQDN files: exit 0, two files, zero broken links,
  missing locales, locale mismatches, relationship mismatches and translation fallbacks.
- Translation coverage: both bodies have five section headings and 59 blank-line blocks.
  All 19 citation occurrences and five inline image references match in order.
  All 63 inline code values match as a multiset, and the fenced example matches exactly.
  One sentence reorders URL and DNS-name code spans naturally in Japanese.
  Both tables retain the same rows and technical values.
- The complete Japanese body, metadata, headings, table labels, source notes and alt text use Japanese.
  The writer checked the complete source-to-target block mapping and corrected one omitted code delimiter.
  No exact English body copy, stub or tool artifact remains.

The package claims no human native review and no deployed layout or metadata verification.
Publication checks remain the coordinator's responsibility.
The expected English and Japanese URLs appear in `decision.md`.
The renderer must serve self-canonicals, en/ja reciprocals and English x-default.
No unsupported frontmatter keys were added.

The session helper preserves actual cumulative counters at phase boundaries.
Cached input is part of input; reasoning output is part of output.
The counters are not independent per-phase totals and must not be summed.
Image generation overlaps English and Japanese writing.
No separate native-review cost or timing measurement is available.
