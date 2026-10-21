# GitHub Pages custom-domain evidence supports the setup guide

Assignment: order 18, G39, custom-domain-github-pages. Historical demand slate fixes the topic, not current keyword demand.

Fetch date: 2026-10-21 UTC. Sources opened during approximately 20:02–20:03 UTC. Record written 2026-10-21T20:04 UTC.

## Official documentation supports the technical claims

- Fetched 2026-10-21: https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages#about-github-pages
  - Locator: About GitHub Pages; Types of GitHub Pages sites.
  - Evidence: Static HTML/CSS/JavaScript publishing; user/organization versus project defaults.
- Fetched 2026-10-21: https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site#about-publishing-sources
  - Locator: About publishing sources.
  - Evidence: Branch/folder versus custom workflow; root or docs branch source.
- Fetched 2026-10-21: https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site#creating-your-site
  - Locator: Creating your site.
  - Evidence: Entry files index.html, index.md, README.md; source and artifact top-level placement.
- Fetched 2026-10-21: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/about-custom-domains-and-github-pages#supported-custom-domains
  - Locator: Supported custom domains.
  - Evidence: Apex and subdomains; www recommendation and paired redirects.
- Fetched 2026-10-21: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/verifying-your-custom-domain-for-github-pages#verifying-a-domain-for-your-user-site
  - Locator: About domain verification; personal and organization procedures.
  - Evidence: Account-level verification; immediate subdomain boundary; wildcard takeover warning; retain TXT; already-verified conflicts do not release.
- Fetched 2026-10-21: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site#about-custom-domain-configuration
  - Locator: About custom domain configuration; Configuring an apex domain; Configuring a subdomain.
  - Evidence: Verify first, assign repository before DNS. Apex A/ALIAS/ANAME; optional AAAA with A recommended. Four A and four AAAA verified but linked rather than copied. Subdomain targets owner.github.io without repository path. Branch CNAME versus Actions ignored file.
- Fetched 2026-10-21: https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https#enforcing-https-for-your-github-pages-site
  - Locator: Enforcing HTTPS; certificate provisioning; mixed content; DNS configuration.
  - Evidence: Enforce HTTPS redirects; automated Let’s Encrypt request after DNS check; conflicting address records block provisioning; HTTP assets cause mixed content.
- Fetched 2026-10-21: https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/troubleshooting-custom-domains-and-github-pages#cname-errors
  - Locator: CNAME errors; HTTPS errors; Domain name taken.
  - Evidence: Uppercase CNAME, one hostname; preserve branch file; Actions ignores. CAA letsencrypt.org authorization if CAA used. Removal and re-addition can restart issuance.
- Fetched 2026-10-21: https://developers.cloudflare.com/dns/manage-dns-records/how-to/create-dns-records/#create-dns-records
  - Locator: Create DNS records.
  - Evidence: Type-specific editor fields include proxy status and TTL. Provider-specific example only.

## The review keeps platform policy separate from practical advice

The guide offers an original operational sequence, migration notes, acceptance checks, and hypothetical documentation/store scenarios. The guide does not claim the examples ran. No Namefi capability assertion appears. No IP values are reproduced. The guide deliberately avoids an estimated propagation deadline or certificate availability promise. DNS observations do not establish certificate readiness or correct content.

The GitHub 404 troubleshooting fetch failed and supplies zero evidence. The article does not cite that page. Site-entry guidance instead uses the successfully opened Creating a site page. Personal Pages settings link is a reader navigation destination, not evidence. Organization-specific deep URL requires the reader’s actual organization identifier.

Self-review: checked all nine cited primary source pages directly. Checked actual A/AAAA lists, account ownership scope, wildcard boundary, TXT retention, workflow versus branch CNAME, HTTPS provisioning, extra AAAA conflicts, CAA, and mixed content. Checked all blog/glossary paths exist. Article has four body H2s, a three-column decision table, and no incomplete image references. Parent owns imagery and publication. Ancestor README review found no article-specific structural change requiring a README edit within this writer’s scope.

## Four illustrations explain the four major sections

```json
{
  "image_scenes": [
    {
      "section": "Your chosen hostname determines the DNS configuration",
      "scene": "Show three labeled address cards: example.com apex, www.example.com subdomain, docs.example.com documentation. Connect documentation to GitHub Pages while a separate main-store box remains connected to example.com. Emphasize that the hostname choice defines the change scope.",
      "short_name": "hostname-choice"
    },
    {
      "section": "Account verification protects the domain before DNS points toward Pages",
      "scene": "Show numbered sequence: GitHub account Pages settings supplies TXT challenge, authoritative DNS holds TXT, account receives Verified mark, repository Pages selects docs.example.com. Keep TXT card visible after verification. Do not imply TLS or legal ownership proof.",
      "short_name": "verify-first"
    },
    {
      "section": "The DNS records must match the selected hostname",
      "scene": "Compare subdomain CNAME pointing directly to owner.github.io with apex A records and optional AAAA records linked to current GitHub documentation. Cross out repository paths in the CNAME target. Show unrelated MX and TXT records retained.",
      "short_name": "dns-records"
    },
    {
      "section": "HTTPS checks confirm the completed website and expose remaining failures",
      "scene": "Show separate checkpoints DNS accepted, certificate provisioned, correct page loads over HTTPS, HTTP redirects to HTTPS. Add a browser asset inspector highlighting an HTTP image converted to a working HTTPS image. Show old AAAA as a configuration issue to inspect rather than automatically delete.",
      "short_name": "https-checks"
    }
  ]
}
```
