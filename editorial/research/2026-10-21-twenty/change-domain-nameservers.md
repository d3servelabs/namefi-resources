# The article explains a controlled authoritative DNS migration

Assignment: order 13, G40, `change-domain-nameservers`. Authoring locale: en-US. Research fetched on 2026-10-21 UTC. The historical demand slate fixes scope, rather than supplying current keyword metrics. The article contains 1,986 body words, excluding frontmatter and sources.

## The primary sources support the protocol and provider distinctions

- https://www.rfc-editor.org/rfc/rfc1034#section-4.2.1 — Read sections 4.2.1–4.2.2. The parent delegation and child authoritative NS occupy different sides of a zone cut. Glue supports reachability for in-domain nameservers. Administrators should keep delegation data consistent. Fetch returned full RFC content through the RFC Editor information-page redirect.
- https://www.rfc-editor.org/rfc/rfc6781#section-4.3.5 — Read sections 4.3.3, 4.3.5.1 and 4.3.5.2, including lines 2293–2491. DS-to-missing-DNSKEY creates security lameness. Cooperating operators can coordinate DNSKEY/signature publication. Uncoordinated changes may need an insecure transition, followed by replacement DS publication. This older operational RFC supports mechanism, not current vendor support.
- https://www.rfc-editor.org/rfc/rfc2308.html#section-3 — Read sections 3–5. Negative responses use SOA-derived cache lifetimes. The article uses this only to explain persistent cached absence after a repair.
- https://developers.cloudflare.com/dns/zone-setups/full-setup/setup/ — Read sections 2, 3.1–3.4, notably scan caveat, mail examples and DNSSEC steps. The standard provider flow asks for DS/DNSSEC removal before nameserver replacement. A separate note allows coordinated signed migration when prior-provider DNSKEY publication supports the procedure. The article preserves that distinction. Assigned zone nameservers come from onboarding. The provider's quick scan does not guarantee a complete record inventory.
- https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/migrate-dns-domain-in-use.html — Read steps 2–7, including parent NS TTL caveat and DS removal. Route 53 creates zone NS/SOA automatically. Zone imports do not recreate proprietary alias/routing decisions. Provider-specific timing examples do not establish universal propagation windows. The article intentionally avoids repeating the page's broad statement that two providers cannot sign simultaneously, because RFC 6781 describes cooperating signed migration.
- https://knowledge.workspace.google.com/admin/domains/connect-your-website-to-a-domain-registered-through-google#if-ns-changed-add-google-workspace-services-to-your-web-host — Read “If NS changed,” lines 266–284. Workspace continuity requires copying MX, SPF/TXT, verification and relevant custom-service CNAME data. No exact provider mail record values appear in the article.

## The review preserves the migration's operational limits

The article distinguishes protocol requirements, provider-specific onboarding, and recommended operational checks. Generic examples use `example.com` only. The article makes no Namefi feature claims, propagation guarantee, uptime promise, or claim that a delivered message proves all mail authentication. The article does not recommend copying DS values to a new provider. The unsigned procedure explicitly waits for old DS caches before incompatible signing/delegation changes. The old signed service remains available during that interval.

Two exploratory Cloudflare DNSSEC URLs returned tool errors: `/dns/dnssec/dnssec-migration/` and `/dns/manage-dnssec/`. Neither failed URL supplies evidence or appears in the public article. The readable full-setup page and RFC 6781 supply the relevant support instead. No archived snapshot was verified or fabricated.

The final manuscript received a complete text/source review. The review checked internal link target files, frontmatter relationships, four body H2 sections, short sentences, coherent service examples, and absence of incomplete endings. All ten related article/glossary targets exist. Repository-wide validation and illustrations remain with the parent agent. README files were reviewed. The article adds no new directory or workflow needing a writer-owned README change.

## Four illustrations explain the four operational stages

```json
{
  "image_scenes": [
    {
      "section": "The registrar changes the delegation that resolvers follow",
      "short_name": "delegation-boundary",
      "scene": "Show a resolver following the .com parent delegation to new authoritative servers for example.com. Put registrar controls above the parent, and child-zone NS inside a separate zone box. Label parent delegation and child NS distinctly. Show a separate smaller shop.example.com subdomain delegation to demonstrate scope."
    },
    {
      "section": "A complete replacement zone preserves website and email settings",
      "short_name": "zone-inventory",
      "scene": "Show old and replacement DNS zones side by side with matching grouped rows for website A/AAAA/CNAME, email MX/SPF/DKIM/DMARC, verification, and delegated subdomains. Show website and mailbox services staying in place while the complete record inventory moves. Add a manual review check next to an incomplete automatic scan."
    },
    {
      "section": "The DNSSEC plan must account for parent DS records and caches",
      "short_name": "dnssec-sequence",
      "scene": "Draw the temporary unsigned migration timeline: remove parent DS, confirm publication, wait for old DS caches while old signing stays valid, change delegation, wait for old delegation caches, enable replacement signing and matching DS, verify validation. Explicitly label the temporary unsigned interval. Add a small separate note that coordinated signed migration needs both providers' support."
    },
    {
      "section": "Separate checks verify DNS, website and mail after the change",
      "short_name": "migration-checks",
      "scene": "Show four separate acceptance checks: parent delegation lists intended servers, each new authoritative server returns approved records, HTTPS website works, external mail sends and receives with authentication review. Keep the old zone operating in an overlap box. Show rollback needing both old delegation and compatible DNSSEC trust rather than a single switch."
    }
  ]
}
```
