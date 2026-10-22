---
title: "Wildcard DNS records answer missing names within a DNS tree"
description: "Learn what wildcard DNS matches, how existing names stop matches, and why DNS, TLS certificates, and website routing need separate checks."
date: '2026-10-21'
language: en
tags: ['domains', 'dns', 'guide']
authors: ['namefiteam']
draft: false
format: guide
cluster: domain-basics
keywords: ['wildcard DNS records', 'wildcard DNS matching', 'asterisk DNS record', 'closest encloser', 'empty non-terminal', 'wildcard subdomain', 'wildcard A record', 'wildcard CNAME', 'DNS wildcard vs SSL wildcard', 'wildcard DNS troubleshooting', 'DNS exact match', 'wildcard hostname routing']
ogImage: ../../assets/wildcard-dns-records-og.jpg
relatedArticles:
  - /en/blog/fully-qualified-domain-name/
  - /en/blog/cname-vs-a-record/
  - /en/blog/renew-ssl-certificate/
  - /en/blog/custom-domain-github-pages/
  - /en/blog/subdomain-vs-subdirectory/
relatedGlossary:
  - /en/glossary/dns/
  - /en/glossary/subdomain/
  - /en/glossary/dns-record-types/
  - /en/glossary/nameserver/
  - /en/glossary/ttl/
relatedTopics:
  - /en/topics/domain-basics/
  - /en/topics/domain-security/
relatedSeries:
  - /en/series/domain-investor-field-guide/
  - /en/series/domain-apocalypse/
---

A wildcard DNS record supplies answers for missing names. A record at `*.example.com` can answer for `shop.example.com` and sometimes `blue.shop.example.com`. Existing names in the DNS tree determine the boundary. The asterisk does not mean that every hostname works. [RFC 4592 defines the matching algorithm.](https://www.rfc-editor.org/rfc/rfc4592.html#section-3.3.1)

That distinction matters when a wildcard appears to work until someone adds an unrelated record. A verification TXT record or a deeper hostname can change the tree. A successful lookup also says nothing about whether a website accepts the hostname.

Use wildcard [DNS](/en/glossary/dns/) when many intended names should reach the same service. Keep a written list of exceptions and test the service separately. The following hypothetical examples use reserved domain names and documentation addresses. The examples explain behavior, rather than propose a replacement zone for a live domain.

## A wildcard supplies records when a matching name is missing

![A wildcard supplies records when a matching name is missing.](../../assets/wildcard-dns-records-01-wildcard-answers.jpg)

A wildcard is an ordinary DNS record with a special owner name. The leftmost label must consist of the single character `*`. `*.example.com` qualifies. `shop*.example.com` does not provide a partial-name pattern, and `shop.*.example.com` does not make the middle label a wildcard. [RFC 4592 explains wildcard syntax.](https://www.rfc-editor.org/rfc/rfc4592.html#section-2.1)

Imagine a service that creates customer pages under a [subdomain](/en/glossary/subdomain/). The service intends to accept names such as `amber.example.com` and `violet.example.com`. A wildcard could reduce the number of DNS entries the operator maintains. The service still needs a customer registry that decides which requested names belong to real customers.

Consider a hypothetical zone containing an apex address and a wildcard address:

| Owner | Type | Value |
| --- | --- | --- |
| `example.com.` | A | `192.0.2.10` |
| `*.example.com.` | A | `192.0.2.20` |

The apex means the zone's own name, `example.com`. The wildcard does not replace the apex record. These two addresses deliberately differ so a test can distinguish the apex from wildcard answers.

When synthesis applies, the authoritative server places the requested name in the answer. A query for `amber.example.com` therefore receives an A record whose owner is `amber.example.com`. The response does not tell the client to use an address literally named `*`. [RFC 4592 describes answer construction and type matching.](https://www.rfc-editor.org/rfc/rfc4592.html#section-3.3.3)

The record type still controls the answer. An A record supplies an IPv4 address. A wildcard A record does not manufacture an IPv6 address or a mail-routing policy. Review the [DNS record types](/en/glossary/dns-record-types/) before choosing the wildcard's data.

A wildcard CNAME supplies an alias when matching permits synthesis. For an A query, the server can synthesize the CNAME and continue resolution at the target. The target still needs usable address data. [RFC 4592 specifies wildcard CNAME processing.](https://www.rfc-editor.org/rfc/rfc4592.html#section-3.3.3) A provider interface might accept `*` relative to the zone, or require a complete owner name. Confirm the saved owner name before testing. Cloudflare, for example, documents `*` in the Name field and `*.www` for a wildcard under `www.example.com`. [Cloudflare documents wildcard creation.](https://developers.cloudflare.com/dns/manage-dns-records/reference/wildcard-dns-records/#create-a-wildcard-record)

Keep the intended service boundary narrower than the entire domain when possible. For customer pages, consider `*.customers.example.com` rather than `*.example.com`. That recommendation expresses an operational preference: the narrower name makes the purpose and exception list easier to explain. The choice still requires compatible DNS, certificates, and application routing.

## Existing names determine which wildcard can answer

![Existing names determine which wildcard can answer.](../../assets/wildcard-dns-records-02-closest-encloser.jpg)

For a missing name, the standard algorithm finds the closest existing ancestor, called the closest encloser. The server then checks for a wildcard immediately below that ancestor. The server does not try increasingly broad wildcards when that candidate is absent. [RFC 4592 defines the closest encloser and source of synthesis.](https://www.rfc-editor.org/rfc/rfc4592.html#section-3.3.1)

Start with the hypothetical zone above and no names beneath `shop.example.com`. The closest existing ancestor of `blue.shop.example.com` is `example.com`. The wildcard candidate is `*.example.com`. The wildcard can therefore supply the address despite the two labels before `example.com`.

Now add `shop.example.com` with an explicit A record. A query for `shop.example.com` uses the explicit name. For `blue.shop.example.com`, the closest ancestor becomes `shop.example.com`. The candidate becomes `*.shop.example.com`. Without that candidate or an explicit answer, the root-level wildcard does not provide a fallback.

An existing name can block synthesis even when the name has no record of the requested type. Suppose `status.example.com` has only a TXT record. A query for its A record does not borrow the A record at `*.example.com`. The name already exists. Under the standard rules, the answer indicates no A data at that name. [RFC 4592 gives examples of existing names and missing types.](https://www.rfc-editor.org/rfc/rfc4592.html#section-2.2.1)

A less visible boundary comes from an empty non-terminal. Suppose the zone contains `probe.team.example.com`, but no records directly at `team.example.com`. The descendant makes `team.example.com` an existing node in the standard DNS tree. That node can change wildcard matching even though the provider's record list shows no row for the parent. [RFC 4592 explains empty non-terminals.](https://www.rfc-editor.org/rfc/rfc4592.html#section-2.2.2)

Use a worksheet before making changes. The following outcomes assume the standard algorithm, the wildcard A record above, and no additional wildcard records:

| Query for A | Additional zone data | Expected result |
| --- | --- | --- |
| `new.example.com` | None | Wildcard address |
| `blue.new.example.com` | None under `new` | Wildcard address |
| `status.example.com` | TXT at `status` | No A data |
| `blue.shop.example.com` | A at `shop` | No wildcard answer |
| `team.example.com` | A at `probe.team` | No A data |

Treat the worksheet as a prediction to verify against the provider. Cloudflare documents different empty-parent behavior between standard and advanced nameservers. Cloudflare says advanced nameservers follow RFC 4592 for the documented case, while standard nameservers still apply the higher wildcard. That exception makes provider testing necessary. [Read Cloudflare's implicit-parent example.](https://developers.cloudflare.com/dns/manage-dns-records/reference/wildcard-dns-records/#specific-dns-records-take-precedence-over-wildcard-records)

Delegation adds another boundary. If a child zone uses separate authoritative servers, investigate the child zone's answers rather than expecting the parent's wildcard to fill missing child records. Record the responsible [nameserver](/en/glossary/nameserver/) set alongside each delegated branch. That inventory prevents a wildcard change in the wrong zone from becoming a misleading troubleshooting step.

## DNS matching does not configure certificates or website routing

![DNS matching does not configure certificates or website routing.](../../assets/wildcard-dns-records-03-three-checks.jpg)

A browser needs more than a DNS answer to open an HTTPS page. The destination must present an acceptable certificate for the requested hostname. The web service must also select the intended application. Treat those requirements as separate acceptance checks.

TLS wildcard matching follows a different rule. RFC 9525 permits one wildcard character as the complete leftmost label of a presented name. That wildcard matches exactly one label. A certificate identifier `*.example.com` can match `amber.example.com`, but does not match `blue.amber.example.com` or `example.com`. A certificate may contain additional identifiers that cover other names. [RFC 9525 distinguishes TLS matching from DNS matching.](https://www.rfc-editor.org/rfc/rfc9525.html#section-6.3)

Imagine that DNS sends both customer names to the same address. The certificate covers only `*.example.com`. The operator should expect a certificate-name problem for the deeper hostname. Changing the DNS address to the same destination again cannot expand the certificate's name coverage.

Next, inspect web routing. NGINX uses the `server_name` directive to select a server block. NGINX documents exact names, wildcard names, and regular expressions with their own precedence rules. NGINX also documents that a leading wildcard can match several name parts. Those rules belong to NGINX configuration, independently of DNS wildcard synthesis. [NGINX explains server-name matching.](https://nginx.org/en/docs/http/server_names.html#wildcard_names)

A useful test asks three different questions:

| Layer | Question | Evidence |
| --- | --- | --- |
| DNS | Where does this name resolve? | DNS response |
| TLS | Does the certificate cover this name? | Certificate name check |
| Application | Which customer page appears? | Request and service logs |

For a hypothetical customer platform, an unknown name such as `unassigned.example.com` might resolve successfully through the wildcard. The application should follow an explicit policy for that unknown customer. The policy could return an unavailable page or reject the request. Choose the policy deliberately and test the result without exposing another customer's content.

Do not use DNS resolution as the customer-authorization check. Resolution proves only that the queried name received DNS data. The application still needs to decide whether a customer exists and whether the request can access that customer's resources. This is a design recommendation for the hypothetical platform, rather than a claim about a particular hosting service.

## A test matrix reveals wildcard failures before deployment

![A test matrix reveals wildcard failures before deployment.](../../assets/wildcard-dns-records-04-test-matrix.jpg)

Before adding a wildcard, save the current zone configuration and identify the service owner. Record the desired owner name, type, value, and exceptions. Include apex records, mail-related names, and delegated branches in the review. Preserve working records unless a planned change explicitly replaces those records.

Create a small test matrix with intended results before querying. Include a fresh single-label name, a fresh deeper name, an explicit hostname, an existing TXT-only hostname, and an empty-parent case. Add the apex and any delegated branch. Mark each result as an address, no data, a name error, or a referral rather than recording only “works.”

Query the authoritative servers first, then compare answers through the recursive resolver used by the affected client. Keep the query name and record type identical across comparisons. Record the server, response status, answer section, and authority section. One successful response from one path does not establish consistent behavior across the deployment.

Use `dig` without `+short` while diagnosing an empty answer. The full response preserves the status and authority information. Replace the example names with names from a zone you control. Replace `ns1.example.net` with an authoritative server for that zone.

| Purpose | Example command |
| --- | --- |
| Query the authoritative server | `dig @ns1.example.net new.example.com. A +norecurse` |
| Check an existing TXT-only name | `dig @ns1.example.net status.example.com. A +norecurse` |
| Check the branch below an existing name | `dig @ns1.example.net blue.shop.example.com. A +norecurse` |
| Compare the client's default resolver | `dig new.example.com. A` |

The `+norecurse` option clears the request for recursion. A zero `dig` exit code means a DNS response arrived, including an NXDOMAIN response. Inspect the DNS status rather than treating the command's exit code as proof of an address. [The BIND manual documents query options and return codes.](https://bind9.readthedocs.io/en/latest/manpages.html#dig-dns-lookup-utility)

![Three example queries distinguish a wildcard address, no A data, and a name error.](../../assets/wildcard-dns-records-05-query-results.jpg)

The illustration assumes the wildcard A record above, TXT at `status.example.com`, A at `shop.example.com`, and no other relevant records. Those assumptions produce different failures: an existing name without A data differs from a missing name beneath an existing branch.

Read empty answers carefully. A NODATA response uses `NOERROR` without relevant answer data. NXDOMAIN indicates a name error. A referral can also lack an answer, so inspect authority information before drawing a conclusion. [RFC 2308 explains NODATA and referral distinctions.](https://www.rfc-editor.org/rfc/rfc2308.html#section-2.2)

If a new TXT entry coincides with a missing address, compare the tree before and after that change. Do not delete a verification record merely to restore broad matching. An explicit address at the affected name, or a deliberate wildcard beneath that branch, may express the intended configuration more clearly. Review the service requirement before choosing either repair.

If authoritative answers look correct but a recursive resolver still returns an older failure, investigate caching. DNS caches can retain negative answers as well as addresses. The [TTL](/en/glossary/ttl/) for a negative response depends on the zone's SOA data. RFC 2308 specifies the smaller of the SOA record TTL and SOA MINIMUM for that response. A wildcard's positive TTL alone cannot predict recovery. [RFC 2308 defines negative-answer caching.](https://www.rfc-editor.org/rfc/rfc2308.html#section-3)

Finish with real HTTPS requests for the intended hostname shapes. Confirm the certificate, page selection, unknown-customer response, and existing exceptions. Repeat the matrix after adding a deeper name or changing providers. Those changes can alter the boundary that an earlier successful wildcard test established.

## These sources define matching and diagnostic behavior

- [RFC 4592: The Role of Wildcards in the Domain Name System](https://www.rfc-editor.org/rfc/rfc4592.html). Fetched 2026-10-21. Sections 2.1, 2.2.1–2.2.3, and 3.3 explain syntax, existing nodes, and synthesis.
- [Cloudflare: Wildcard DNS records](https://developers.cloudflare.com/dns/manage-dns-records/reference/wildcard-dns-records/). Fetched 2026-10-21. “Create a Wildcard record” and “Specific DNS records take precedence” document configuration and the implicit-parent exception.
- [RFC 9525: Service Identity in TLS](https://www.rfc-editor.org/rfc/rfc9525.html#section-6.3). Fetched 2026-10-21. Section 6.3 limits TLS wildcard matching to one label.
- [NGINX: Server names](https://nginx.org/en/docs/http/server_names.html). Fetched 2026-10-21. “Wildcard names” and “Virtual server selection” describe independent web-server routing.
- [RFC 2308: Negative Caching of DNS Queries](https://www.rfc-editor.org/rfc/rfc2308.html#section-2.2). Fetched 2026-10-21. Sections 2.2, 3, and 5 explain NODATA and negative-response caching.

- [ISC BIND 9: dig manual](https://bind9.readthedocs.io/en/latest/manpages.html#dig-dns-lookup-utility). Fetched 2026-10-21. Query options and return codes distinguish DNS response status from command success.
