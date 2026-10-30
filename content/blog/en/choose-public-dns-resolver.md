---
title: 'Best DNS Servers: Which Resolver Should You Actually Use?'
description: Compare Cloudflare, Google Public DNS, and Quad9 by filtering, encrypted transport, network requirements, and reversible local testing.
date: '2026-10-21'
language: en
tags:
- dns
- privacy
- networking
- security
authors:
- namefiteam
draft: false
format: guide
cluster: domain-security
keywords:
- public DNS resolver
- choose DNS resolver
- Cloudflare DNS
- Google Public DNS
- Quad9 DNS
- DNS privacy
- DNSSEC validation
- DNS filtering
- encrypted DNS
- DNS fallback
- DNS troubleshooting
- best DNS servers
- fastest DNS servers
- DNS speed test
ogImage: ../../assets/choose-public-dns-resolver-og.jpg
relatedArticles:
- /en/blog/dns-over-https-vs-dns-over-tls/
- /en/blog/nslookup-specific-dns-server/
- /en/blog/root-dns-servers/
- /en/blog/primary-secondary-dns/
- /en/blog/dns-is-the-control-plane/
relatedGlossary:
- /en/glossary/dns/
- /en/glossary/dns-resolver/
- /en/glossary/dnssec/
- /en/glossary/ttl/
- /en/glossary/dns-hijacking/
relatedTopics:
- /en/topics/domain-basics/
- /en/topics/domain-security/
relatedSeries:
- /en/series/domain-investor-field-guide/
- /en/series/domain-apocalypse/
updated: '2026-10-30'
---

The best DNS server for a device depends on the required policy and the actual network. Choose a resolver that fits your filtering, privacy, and compatibility needs, then test the configuration locally. A familiar address or a published ranking cannot establish which resolver will work best on your connection.

For a practical shortlist, Cloudflare's standard service provides a documented unfiltered option. [Quad9's secure service](/en/blog/quad9-dns-setup/) provides threat blocking. Google Public DNS supplies another documented public service with device configuration instructions. [Cloudflare describes its variants](#cloudflare-defines-its-resolver-variants), [Quad9 describes its secure service](#quad9-defines-its-secure-service), and [Google documents its addresses](#google-defines-configuration-and-recovery).

These options are starting points, not a universal performance ranking. This guide reports no speed benchmark and promises no improvement in [game latency](/en/blog/benchmark-dns-for-gaming/).

## A public resolver differs from a domain’s authoritative nameservers

A device's recursive resolver retrieves DNS information for applications. A domain's authoritative nameservers provide information for zones they serve. DNS defines these as different roles. [RFC 1034 explains resolver and server behavior](#rfc-1034-separates-dns-roles).

If you want to improve a home device's resolution policy, investigate the device, router, browser, or VPN resolver setting. If you want to change who hosts your domain's DNS records, investigate the registrar delegation and authoritative DNS account.

Changing your domain's nameservers does not change every visitor's selected public resolver. Likewise, choosing a public resolver for your laptop does not transfer management of your domain's zone. The [registrar and DNS host guide](/en/blog/find-domain-registrar-dns-host/) helps identify the administrative boundary.

On a managed network, ask the administrator which resolver policy applies. Corporate internal names, VPN routing, and network security controls can depend on the approved arrangement. A public resolver is not automatically an appropriate replacement.

![A resolver choice changes who answers your device.](../../assets/choose-public-dns-resolver-01-resolver-boundaries.jpg)

## The service variant determines filtering behavior

Cloudflare documents `1.1.1.1` and `1.0.0.1` for its standard service without content filtering. Cloudflare separately documents family variants for malware filtering and for malware plus adult-content filtering. [The address reference separates those choices](#cloudflare-defines-its-resolver-variants).

Quad9 documents `9.9.9.9` and `149.112.112.112` for its secure threat-blocking service. Quad9 also publishes variants without threat blocking. Choosing the provider name alone does not specify the intended policy. [Quad9's service table explains the variants](#quad9-defines-its-secure-service).

Google documents `8.8.8.8` and `8.8.4.4` for Google Public DNS. The configuration guide also supplies IPv6 addresses. Use the documented service and platform instructions instead of copying an incomplete address list. [Google provides the configuration reference](#google-defines-configuration-and-recovery).

| Requirement | Practical starting point | Verification question |
| --- | --- | --- |
| An unfiltered Cloudflare service | Standard Cloudflare resolver | Did the device receive the standard variant? |
| Threat-blocking resolution | Quad9 secure service | Does the selected address match the secure variant? |
| A documented Google configuration | Google Public DNS | Did the active adapter and browser use the intended arrangement? |
| Organization-specific name resolution | Administrator-approved service | Do internal services and VPN tasks still work? |

The table gives editorial selection advice. It does not claim that a provider blocks every harmful domain or that an unfiltered service makes browsing safe.

![Provider policies narrow the practical shortlist.](../../assets/choose-public-dns-resolver-02-policy-shortlist.jpg)

## Privacy requires more than an IP address

A plain resolver address does not establish that the DNS transport is encrypted. Cloudflare refers users to separate encryption instructions. Quad9 publishes DNS-over-TLS and DNS-over-HTTPS endpoints separately from its IP addresses. [Cloudflare's address guide](#cloudflare-defines-its-resolver-variants) and [Quad9's service table](#quad9-defines-its-secure-service) preserve that distinction.

Read the provider's current privacy policy before deciding. As practical evaluation advice, inspect what the provider logs, why the provider retains information, and what the provider says about aggregation and incident handling. Avoid summarizing a policy as “no logs” unless the exact statement supports that summary.

Also inspect browser DNS settings. A browser can select its own DNS-over-HTTPS provider. Mozilla documents that control in Firefox. [Mozilla explains browser provider selection](#mozilla-defines-browser-dns-selection).

The [encrypted DNS comparison](/en/blog/dns-over-https-vs-dns-over-tls/) explains transport choices. A transport choice and a provider policy answer separate privacy questions.

## A reversible local trial supplies better evidence than a ranking

Record the existing DNS settings before changing anything. Google explicitly recommends retaining the original addresses so users can revert. [The configuration guide includes that recovery step](#google-defines-configuration-and-recovery).

Change one authorized device first. Use a pair of addresses for the same intended service variant. As practical policy advice, avoid mixing providers with different filtering behavior unless the mixed arrangement is deliberate and documented.

Repeat representative tasks: ordinary browsing, work applications, VPN access, and internal services. Record failures and the relevant time. A successful public DNS query does not establish that every required application works.

If measuring lookup latency, keep the name, record type, tool, and network conditions consistent. Account for cached answers when interpreting repeated measurements. DNS caching changes what a repeated query measures. [RFC 1034 describes the cache role](#rfc-1034-separates-dns-roles).

Treat measurements as local observations. Avoid turning a small test into a claim that one provider is fastest for every reader. A resolver can satisfy a policy requirement without winning every latency comparison.

![A reversible trial verifies the resolver and its fallback.](../../assets/choose-public-dns-resolver-04-reversible-trial.jpg)

## A failed query needs diagnosis before another provider change

A refusal, missing name, validation problem, and timeout can look similar in a simplified application message. Preserve the exact DNS output before switching services again. The [nslookup guide](/en/blog/nslookup-specific-dns-server/) explains reproducible comparisons.

If a filtering service blocks a needed domain, follow the provider's documented review process. If an organization's service requires internal DNS, restore the approved arrangement and ask the administrator for the correct configuration.

After the trial, either keep the supported configuration with documented reasons or restore the original settings. Verify the [browser's effective behavior](/en/blog/dns-leak-test-guide/) and required application tasks. The best resolver choice is a policy the organization understands and a configuration the device can use reliably.

## Sources and further reading

### Cloudflare defines its resolver variants

[Cloudflare: Public resolver addresses](https://developers.cloudflare.com/1.1.1.1/ip-addresses/#1111). Checked 2026-10-30.

### Quad9 defines its secure service

[Quad9: Service variants](https://docs.quad9.net/services/#9999-secure). Checked 2026-10-30.

### Google defines configuration and recovery

[Google Public DNS: Configuration guide](https://developers.google.com/speed/public-dns/docs/using#addresses). Checked 2026-10-30.

### RFC 1034 separates DNS roles

[RFC 1034: Domain Names — Concepts and Facilities](https://www.rfc-editor.org/rfc/rfc1034.html#section-2.4). Checked 2026-10-30.

### Mozilla defines browser DNS selection

[Mozilla: DNS-over-HTTPS FAQ](https://support.mozilla.org/en-US/kb/dns-over-https-doh-faqs#:~:text=Yes%2C%20they%20can%20disable%20DoH%2C%20select%20their%20own%20DoH%20provider). Checked 2026-10-30.
