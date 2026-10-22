# A shared static cover replaces the domain article's dynamic social image

The repair starts from Resources main `a9298e3ac79fa5402854de72bb341898711cd045`.
The root session reported a persistent HTTP 500 from `/r/ar/blog/what-is-domain/opengraph-image` on dev and production after the completed release.
The root session also reported successful checks for 167 article bodies and metadata, 68 changed images, and the remaining 50 media resources except that dynamic endpoint.
These deployment findings come from the root session. This repair does not independently rerun deployment verification.

The repair adds `content/assets/what-is-domain-og.jpg` as a shared static social cover.
All ten existing locale pages receive only `ogImage: ../../assets/what-is-domain-og.jpg`.
Every other frontmatter field and every article body remain byte-identical to the baseline.
The exact slug filename supports the renderer's static image lookup.
The repair does not change the dynamic endpoint or application code.

## The house generator preserves each attempt separately

The writer used the repository `namefi-resource-images` skill and `og-cover.sh` prompt and rendering pipeline.
The model was `gpt-image-2`, quality `high`, native size `1216x640`, final size `1200x630`.
The official logo came from the configured Namefi logotype SVG and was composited in the top-right corner.
Private attempt-local script copies only adapt credential transport and response/usage retention.
The repository skill and generator remain unchanged.
Each fixed attempt script and complete successful API response remain private under `/private/tmp/namefi-stack48/27-what-is-domain/og-repair/attemptN/`.
The response persists before parsing. Sanitized API usage persists before image decoding.
The private script, response, and usage files use read-only permissions after persistence.
The repair does not commit raw responses, generated PNG intermediates, credentials, or private prompts.

Attempt 1 used a domain label beneath the browser address bar.
Visual inspection confirmed correct text and logo but rejected the image because the label entered the bottom caption reserve.
Attempt 1 API usage was input 794, output 3401, total 4195 tokens.
Each detail counter is a component of its parent counter and must not be added again.

## The final checks establish the local repair scope

The final asset must show `example.com` as the highlighted domain within `https://example.com/guide`.
The cover uses English text across all locales, as explicitly requested for this shared static asset.
The root session will create the PR, run full CI, merge, and execute dev and production workflows.
The writer performs only local content validation, MDX lint, dimensions, reference, body-invariance, and image checks.
No third-party review, remote PR write, CI dispatch, merge, or deployment occurs in this repair.

## The writer records repair usage as an addition to G50

The historical 48-topic writer snapshot remains unchanged.
The repair baseline is the actual G50 counter event at `2026-10-22T01:03:45.333Z`:
input 3135825 including cached input 3036416, output 17169 including reasoning output 1262, total 3152994.
Repair usage is the ending cumulative counter minus this baseline, preserving the reawakened turn's first input.
Image API usage is separate from writer usage.
The accompanying usage JSON records actual cumulative counters, the baseline, and the resulting delta.

Attempt 2 removed the lower label and passed visual inspection.
The cover spells `example.com`, `https://`, and `/guide` correctly and highlights only the domain.
The full title, subtitle, browser scene, and official logo remain visible.
The cream dot-grid background reaches all edges and the bottom caption band remains empty.
Attempt 2 API usage was input 795, output 3401, total 4196 tokens.
Total additional image API usage is input 1589, output 6802, total 8391 tokens across two attempts.

Local checks passed: `data:validate` with 37 existing warnings, `lint:mdx`, `git diff --check`, JPEG dimensions 1200×630, progressive encoding, and all ten asset references.
The data validator checked 4082 files with zero locale and relationship mismatches.
A byte comparison confirms that all ten article bodies and all other frontmatter fields match the exact baseline.
