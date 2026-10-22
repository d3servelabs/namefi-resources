# This batch updates 48 English targets and selected translations

The owner authorized 35 blog targets and 13 TLD targets on 2026-10-21.
The source snapshot is `e9d64bc424047e4f986ab5bef5207c086778e6d5`.
The inventory snapshot is `437c6ff1acc1088d9c98992dc61c65fe2968ae55`.
The initial map contains 40 existing pages and eight proposed new pages.
Writers must check semantic overlap before they create a proposed new page.

## Each writer completes one topic before the writer opens a pull request

The final authoring stage used three writers in separate worktrees.
The main session took over coordination after the coordinator handoff.
Each writer owns the English target, selected translations, topic images, and topic evidence.
Each writer records research and writing token boundaries separately.
Each writer selects translations from article, language, and country demand evidence.
Existing translations remain available.
Each published locale uses a self canonical and reciprocal language alternates.

Writers do not run code review or request third-party review during creation.
Writers run local content, link, image, and locale sanity checks.
Each writer completes required image inspection for generated images.
Image inspection checks the generated asset and does not review repository code.

## The coordinator appends each completed topic to one pull request stack

The coordinator owns `stack.json` and serializes pull request creation.
A writer requests an append slot before pushing or opening a pull request.
The coordinator returns the current tip branch and exact commit.
The writer rebases local, unpublished topic changes onto that commit.
The writer opens one draft pull request against the returned tip branch.
The coordinator registers the pull request and releases the append slot.
The next completed topic uses the registered pull request branch as its base.
No writer changes another topic or the coordinator ledger.
No agent force-pushes a shared branch without explicit permission.

Every authoring commit contains `[skip ci]`.
Every draft pull request title starts with `[coverage48]`.
Every draft pull request description starts with `@coderabbitai ignore`.
The stack base contains draft-review suppression configuration.
The coordinator must verify account overrides before the first pull request.
The coordinator does not change repository-wide or user-level automation settings.

## The final integration commit receives complete CI before publication

The coordinator waits for all 48 topic packages.
The coordinator validates the final stack and runs the checked-in GitHub Actions workflows.
The owner authorized admin merge and publication after complete CI succeeds.
The coordinator records exact tested commits, merge commits, and deployment runs.
The coordinator publishes through the checked-in Resources and Astra release workflows.

The live ledger stays outside author branches during production.
The coordinator copies the final ledger into the final integration commit.
The committed initial ledger records the starting queue, not live completion status.

## The completed topics cover 47 distinct English pages

All 48 topic packages reached individual draft pull requests.
G02 extends the existing G01 resolver comparison instead of creating a duplicate.
The final scope contains 34 distinct blog pages and 13 TLD pages.
Seven English pages are new; 40 existing English pages receive updates.

The [final metrics](batch-metrics/README.md) link topic PRs and actual writer counters.
The temporary review-suppression files are absent from the final publication tree.
The final CI and publication evidence will identify the deployed commits.
