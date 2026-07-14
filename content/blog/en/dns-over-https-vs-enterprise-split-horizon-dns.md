---
title: 'DNS over HTTPS vs Enterprise Split-Horizon DNS: A Standoff That Will Not Resolve Itself'
date: '2026-05-04'
language: en
tags: ['dns', 'doh', 'enterprise', 'security', 'networking']
authors: ['namefiteam']
draft: false
cluster: domain-security
format: comparison
description: DNS over HTTPS (DoH) protects user privacy by encrypting DNS queries inside HTTPS. Enterprise split-horizon DNS relies on the network being able to see those queries. The collision between the two is reshaping how corporate networks, browsers, and operating systems handle name resolution.
ogImage: ../../assets/dns-over-https-vs-enterprise-split-horizon-dns-og.jpg
keywords: ['dns over https', 'doh', 'split horizon dns', 'enterprise dns', 'dot', 'encrypted dns', 'internal dns', 'name resolution', 'namefi']
relatedArticles:
  - /en/blog/what-are-tokenized-domains/
  - /en/blog/the-myetherwallet-bgp-dns-attack/
  - /en/blog/the-dnspionage-campaign/
  - /en/blog/the-godaddy-multi-year-breach/
  - /en/blog/the-fox-it-dns-hijack/
relatedTopics:
  - /en/topics/domain-security/
  - /en/topics/domain-tokenization/
relatedSeries:
  - /en/series/domain-apocalypse/
  - /en/series/name-change-game-change/
relatedGlossary:
  - /en/glossary/dns/
  - /en/glossary/registrar/
  - /en/glossary/icann/
  - /en/glossary/tld/
  - /en/glossary/web3/
---

For most of the internet's history, [DNS](/en/glossary/dns/) queries traveled in cleartext over port 53. Anyone on the network path could read them, log them, and modify them. That was a privacy problem the IETF eventually addressed with two encrypted alternatives: [DNS over TLS (DoT, RFC 7858)](https://datatracker.ietf.org/doc/html/rfc7858) in 2016 and [DNS over HTTPS (DoH, RFC 8484)](https://datatracker.ietf.org/doc/html/rfc8484) in 2018.

DoH in particular changed the game, because it hides DNS *inside* a regular HTTPS stream. To a network observer, a DoH query looks identical to any other TLS connection to a content server. That is great for users browsing on a hostile coffee-shop network. It is much less great for a corporate IT team that depends on seeing—and steering—every DNS query that crosses the perimeter.

This is the standoff. Both sides have legitimate, well-articulated requirements. The standards bodies, browser vendors, and operating system vendors have spent the better part of a decade trying to make both work at once, and the result is a set of uneasy compromises that anyone running an enterprise network in 2026 needs to understand.

## What DoH actually does

A DoH client sends DNS queries as HTTPS POST or GET requests, typically to `https://dns.google/dns-query`, `https://cloudflare-dns.com/dns-query`, or another public resolver. The response comes back as a normal HTTPS response body. Three properties matter:

- **Encrypted in transit.** Network observers cannot read the query name or the answer.
- **Authenticated server.** The client verifies the resolver's TLS certificate, so a man-in-the-middle cannot impersonate it.
- **Not identifiable by port or cleartext DNS signatures.** DoH uses HTTPS on port 443, so a network cannot separate it from other HTTPS merely by looking for port 53 or DNS-shaped packets. Administrators can still block known resolver endpoints by IP address or hostname policy, although shared infrastructure, encrypted metadata, and previously unknown endpoints make that incomplete and operationally costly.

The third property is the one that defines the conflict. DoT also encrypts queries, but it does so on a *dedicated* port (853), which a network can easily block. DoH cannot be identified from port and packet shape alone; targeted blocking instead depends on knowing or controlling the resolver endpoint, and blocking an endpoint that shares infrastructure with other HTTPS services can cause collateral damage.

## What enterprise split-horizon DNS actually does

Most large organizations run **split-horizon DNS**. The same name (`vpn.example.corp`, `git.example.com`, `intranet.example.com`) resolves to different IP addresses depending on whether the query comes from inside the network or outside.

Inside the network:
- The resolver is the company's internal DNS, often Active Directory-integrated.
- `git.example.com` might resolve to a private RFC 1918 address like `10.0.4.7`.
- Internal-only zones (`example.corp`, `example.internal`) may not exist on the public internet at all.
- DLP and security tooling sees every query and can flag DNS to known-bad domains.

Outside the network (or on a personal device on home Wi-Fi):
- The same query goes to a public resolver.
- `git.example.com` resolves to the public load balancer.
- The internal-only names simply do not resolve.

This is a common enterprise pattern, especially in environments with internal services, Active Directory, VPNs, or DNS-based security controls. It depends on one critical assumption: **the endpoint uses the resolver the organization intends it to use**, via DHCP, device policy, or VPN configuration.

DoH breaks that assumption. If the browser ships its own resolver, or the operating system bypasses the system resolver, the endpoint stops consulting the internal DNS entirely. Internal hostnames stop resolving. Security tooling stops seeing the queries it relies on for detection.

## How browsers and OSes have tried to handle this

The vendors have not been blind to the problem. The compromises that exist today are layered and a little ad hoc.

### Chrome's "automatic upgrade" model

Chrome's DoH implementation only upgrades the system resolver to DoH if the system resolver itself is on Chrome's allowlist of DoH-capable providers (Google, Cloudflare, Quad9, etc.). If the system is configured to use an internal corporate resolver that is not on the allowlist, Chrome leaves it alone. Enterprise policies can also disable DoH outright via [Chrome's `DnsOverHttpsMode`](https://chromeenterprise.google/policies/?policy=DnsOverHttpsMode) setting.

### Firefox's TRR (Trusted Recursive Resolver) model

Firefox's approach has been more controversial. In locales where Mozilla has enabled DoH by default, Firefox uses a default resolver such as Cloudflare in the U.S., but it also runs enterprise and network heuristics before enabling DoH. One important signal is the canary domain `use-application-dns.net`: when the local resolver returns a negative result, Firefox disables application-level DNS for users whose DoH was enabled by default. Mozilla also documents an important split-horizon nuance: internal-only names can fall back to ordinary DNS if DoH resolution fails, but public names that resolve differently inside the network require enterprise policy to disable DoH.

### Apple's encrypted DNS (iOS 14+, macOS Big Sur+)

Apple lets apps and configuration profiles opt in to DoH or DoT for the whole system and gives administrators MDM controls for managed devices. Whether split-horizon works therefore depends on the profiles and resolver policy the organization actually deploys; management alone does not guarantee the correct result.

### Windows native DoH

Since Windows 11, and for the DNS client on Windows Server 2022 and later, the OS itself can use DoH for the system resolver. Group Policy controls whether the DNS client allows, requires, or prohibits DoH, and administrators can register the DoH template for a configured DNS server. This is distinct from serving DoH: Microsoft's DNS Server service requires Windows Server 2025 with the June 2026 security update or later. In either case, the security team must configure both the resolver and endpoint policy deliberately.

The pattern is clear: **DoH that lives in a single app can bypass system resolver choices unless that app is managed; DoH in the OS-level resolver can be governed through device policy**. Browser enterprise policies remain important because application-level DoH has not disappeared.

## The realistic options for an enterprise in 2026

Given the tooling above, there are three workable strategies, and a fourth that will not work.

### Strategy A: All-internal, DoH blocked

Push policy that disables DoH in every browser, blocks port 443 to known public DoH endpoints, and forces all DNS through the internal resolver. The internal resolver itself may speak DoH to upstream public resolvers, but inside the network everything goes through it.

This is the most prescriptive option. It preserves split-horizon perfectly and gives security tooling full visibility. The cost is that you have to maintain blocklists of new DoH endpoints, and any app the user installs that does its own DoH (some chat clients, some VPNs) may misbehave.

### Strategy B: Internal DoH

Stand up an internal DoH server, configure endpoints to use it, and run split-horizon at that resolver. Depending on support and operational requirements, that could be a dedicated DoH-capable resolver or Microsoft's DNS Server service on Windows Server 2025 with the June 2026 security update or later. Endpoints get encrypted transport to the resolver without the resolver itself losing query visibility.

This can be a clean option where the organization can operate the resolver and manage every endpoint. It protects queries on the path between managed clients and the internal resolver while preserving resolver-side filtering and logging. Platform support and deployment details differ, so teams should verify client, server, certificate, and fallback behavior for their chosen stack.

### Strategy C: Canary domain / network signal

Configure the local resolver so Mozilla's `use-application-dns.net` canary query returns the negative result Firefox expects, and push the relevant browser policies. The canary signal applies to Firefox users whose DoH was enabled by default; it does not override a user's explicit choice. Chromium does not use Mozilla's canary mechanism, so Chrome and Edge require their own deployment model and enterprise policies. This approach must therefore be implemented per browser rather than treated as one universal network signal.

### Strategy D (does not work): "We'll just ignore DoH"

Pretending the conflict does not exist, leaving defaults in place, and assuming all DNS still flows through the corporate resolver. This is the most common state of affairs and produces predictable failures: developers reporting that internal-only URLs work in Edge but not in Firefox, security teams seeing gaps in DNS logs, intermittent VPN-DNS bugs that take hours to diagnose. The problem does not go away. It only becomes harder to attribute.

## Privacy is not the only thing DoH gives up

A subtler effect of DoH is resolver centralization. When a browser or OS is configured to use a public DoH resolver, more of that user's DNS stream may go to one resolver operator. Chrome's automatic mode is explicitly designed to preserve the user's existing DNS provider where possible, and Firefox's default rollout is locale- and heuristic-dependent, so this is not literally "every query" in every deployment. But the architectural trade-off remains: encrypted DNS can move trust from the local network or ISP to a smaller set of selected resolver operators.

Whether that trade is acceptable depends on the threat model. For a user on a hostile coffee-shop network, centralizing trust with Cloudflare is a clear improvement over trusting the coffee shop. For an enterprise that already had a contractual relationship with its ISP, it can be a regression. The [EFF has been writing about this trade-off](https://www.eff.org/deeplinks/2019/10/encrypted-dns-could-help-close-biggest-privacy-gap-internet) since the early DoH rollouts.

The cleanest answer is the same as Strategy B above: run your own DoH resolver, so encrypted DNS does not require trusting a third party with the entire query stream.

## What this means for domain owners

If you run a domain that is consumed by enterprises—a SaaS app, a developer tool, an API—the relevant facts are:

- Some fraction of your users will resolve you through a public DoH endpoint, especially on unmanaged devices or explicitly configured browsers. CNAME chains, [subdomain](/en/glossary/subdomain/) delegations, and any clever DNS tricks you do for personalization need to work the same when resolved from an arbitrary public resolver as from a customer's internal one.
- DNS-based censorship circumvention is a real use case for DoH. If your domain is blocked by a government's DNS filter (as several encrypted-messaging and VPN domains have been), users will reach you over DoH from a public resolver. The mechanics are the same; the political stakes are different.
- Design both sides of a split-horizon name intentionally. A remote user querying a public DoH resolver receives the public DNS view, not the private answer from the organization's internal resolver. If the public view has no usable record, the name will fail; if it has a public endpoint, the user will reach that endpoint. A clearly separate internal-only zone such as `app.example.internal` can make intent clearer, but it does not make the service reachable remotely—VPN access and managed split-DNS policy are still required.

## How Namefi fits in

Namefi treats DNS as the public-facing [control plane](/en/blog/dns-is-the-control-plane/)—the place where global naming meets local policy. Our DNS workflows assume queries can come from any resolver, including DoH endpoints we cannot enumerate, and the names we publish work consistently regardless. For customers running split-horizon internally, we sit on the public side: the authoritative answer for `example.com` is what we serve, and what the internal resolver overrides for internal users is between them and their endpoint policy.

The deeper point: encrypted DNS is here to stay, and so is the enterprise need for resolver policy and visibility. Reconciliation usually combines managed OS resolver settings, browser-specific enterprise controls, and an internal resolver where split-horizon is required. The exact mix remains platform- and deployment-specific; it is an operational design choice, not a universal vendor convergence on one mechanism.

## Sources and further reading

- IETF — [DNS over HTTPS, RFC 8484](https://datatracker.ietf.org/doc/html/rfc8484) and [DNS over TLS, RFC 7858](https://datatracker.ietf.org/doc/html/rfc7858).
- Chrome Enterprise — [DoH policy controls](https://chromeenterprise.google/policies/?policy=DnsOverHttpsMode).
- Mozilla — [Trusted Recursive Resolver program](https://wiki.mozilla.org/Trusted_Recursive_Resolver), [canary domain behavior](https://support.mozilla.org/en-US/kb/canary-domain-use-application-dnsnet#:~:text=A%20negative%20result%20will%20be%20a%20signal%20to%20disable%20application%20DNS%2C%20(i.e.%2C%20DoH).), and [split-horizon fallback guidance](https://support.mozilla.org/gu-IN/kb/dns-over-https-doh-faqs#:~:text=If%20Firefox%20fails%20to%20resolve%20a%20domain%20via%20DoH%2C%20it%20will%20fall%20back%20to%20the%20DNS.).
- Chromium — [Chrome's same-provider DoH auto-upgrade model and canary-domain position](https://www.chromium.org/developers/dns-over-https/).
- Microsoft — [Configure the Windows DNS client to use DoH](https://learn.microsoft.com/en-us/windows-server/networking/dns/doh-client-support) and [enable DoH in the Windows Server DNS Server service](https://learn.microsoft.com/en-us/windows-server/networking/dns/enable-dns-over-https-server).
- EFF — [Encrypted DNS could help close one of the internet's biggest privacy gaps](https://www.eff.org/deeplinks/2019/10/encrypted-dns-could-help-close-biggest-privacy-gap-internet).
