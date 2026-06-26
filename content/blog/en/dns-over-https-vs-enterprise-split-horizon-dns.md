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
- **Indistinguishable from web traffic.** Port 443, TLS 1.3, normal SNI patterns. There is no DNS-shaped traffic to filter on.

The third property is the one that defines the conflict. DoT also encrypts queries, but it does so on a *dedicated* port (853), which a network can easily block or redirect. DoH cannot be selectively blocked without also blocking ordinary web browsing.

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

This is not exotic. It is the default for almost every enterprise of more than a few hundred employees. It depends on one critical assumption: **the endpoint uses the resolver the network tells it to use**, via DHCP, push policy, or VPN configuration.

DoH breaks that assumption. If the browser ships its own resolver, or the operating system bypasses the system resolver, the endpoint stops consulting the internal DNS entirely. Internal hostnames stop resolving. Security tooling stops seeing the queries it relies on for detection.

## How browsers and OSes have tried to handle this

The vendors have not been blind to the problem. The compromises that exist today are layered and a little ad hoc.

### Chrome's "automatic upgrade" model

Chrome's DoH implementation only upgrades the system resolver to DoH if the system resolver itself is on Chrome's allowlist of DoH-capable providers (Google, Cloudflare, Quad9, etc.). If the system is configured to use an internal corporate resolver that is not on the allowlist, Chrome leaves it alone. Enterprise policies can also disable DoH outright via [Chrome's `DnsOverHttpsMode`](https://chromeenterprise.google/policies/?policy=DnsOverHttpsMode) setting.

### Firefox's TRR (Trusted Recursive Resolver) model

Firefox's approach has been more controversial. In locales where Mozilla has enabled DoH by default, Firefox uses a default resolver such as Cloudflare in the U.S., but it also runs enterprise and network heuristics before enabling DoH. One important signal is the canary domain `use-application-dns.net`: when the local resolver returns a negative result, Firefox disables application-level DNS for users whose DoH was enabled by default. Mozilla also documents an important split-horizon nuance: internal-only names can fall back to ordinary DNS if DoH resolution fails, but public names that resolve differently inside the network require enterprise policy to disable DoH.

### Apple's encrypted DNS (iOS 14+, macOS Big Sur+)

Apple lets apps and configuration profiles opt-in to DoH or DoT for the whole system, but respects MDM policies that mandate a specific resolver. Enterprise-managed devices behave correctly out of the box.

### Windows native DoH

Since Windows 11, and on Windows Server 2022 and later, the OS itself can use DoH for the system resolver. Group Policy controls whether DoH is allowed, required, or prohibited, and Windows only enables DoH against configured DNS servers that are known to support it. This is arguably the cleanest model: the security team chooses the policy, the OS enforces it.

The pattern is clear: **DoH that lives in a single app (the browser) is hard for the network to control; DoH that lives in the OS-level resolver is controllable through normal MDM channels**. The IETF and OS vendors have largely agreed that policy belongs in the OS layer.

## The realistic options for an enterprise in 2026

Given the tooling above, there are three workable strategies, and a fourth that will not work.

### Strategy A: All-internal, DoH blocked

Push policy that disables DoH in every browser, blocks port 443 to known public DoH endpoints, and forces all DNS through the internal resolver. The internal resolver itself may speak DoH to upstream public resolvers, but inside the network everything goes through it.

This is the most prescriptive option. It preserves split-horizon perfectly and gives security tooling full visibility. The cost is that you have to maintain blocklists of new DoH endpoints, and any app the user installs that does its own DoH (some chat clients, some VPNs) may misbehave.

### Strategy B: Internal DoH

Stand up an internal DoH server (Cloudflared, AdGuard, or a Windows DNS Server with DoH enabled), configure endpoints to use it, and run split-horizon at the internal DoH server. Endpoints get encrypted DNS without the network losing visibility.

This is the cleanest option and the one most large enterprises are moving toward. It preserves the privacy benefit (queries are encrypted on the LAN) while keeping the security benefit (the internal resolver still sees and can filter every query). Microsoft, Google, and Apple all support OS-level configuration for this scenario.

### Strategy C: Canary domain / network signal

Publish the Mozilla canary domain. Push the relevant Chrome and Edge policies. Rely on the browsers to detect that they are on a managed network and defer to the system resolver. This is the lightest-touch option and is sufficient for many small and mid-sized organizations.

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
- Internal split-horizon should never resolve a public-facing name to something *only meaningful internally*, in a way that would break if a user accidentally queried over DoH. The classic failure is internal-only `app.example.com` returning a private IP that no DoH user can reach—then a remote employee in a hotel finds the same hostname unreachable and files a bug. Use a clearly separate internal-only zone (`app.example.internal`).

## How Namefi fits in

Namefi treats DNS as the public-facing [control plane](/en/blog/dns-is-the-control-plane/)—the place where global naming meets local policy. Our DNS workflows assume queries can come from any resolver, including DoH endpoints we cannot enumerate, and the names we publish work consistently regardless. For customers running split-horizon internally, we sit on the public side: the authoritative answer for `example.com` is what we serve, and what the internal resolver overrides for internal users is between them and their endpoint policy.

The deeper point: encrypted DNS is here to stay, and so is enterprise visibility. The way to reconcile them is not to fight the standards, but to move the policy enforcement point from the network to the operating system. The standards bodies, Microsoft, Apple, Google, and Mozilla have all converged on that answer. The work left is mostly operational.

## Sources and further reading

- IETF — [DNS over HTTPS, RFC 8484](https://datatracker.ietf.org/doc/html/rfc8484) and [DNS over TLS, RFC 7858](https://datatracker.ietf.org/doc/html/rfc7858).
- Chrome Enterprise — [DoH policy controls](https://chromeenterprise.google/policies/?policy=DnsOverHttpsMode).
- Mozilla — [Trusted Recursive Resolver program](https://wiki.mozilla.org/Trusted_Recursive_Resolver), [canary domain behavior](https://support.mozilla.org/en-US/kb/canary-domain-use-application-dnsnet#:~:text=A%20negative%20result%20will%20be%20a%20signal%20to%20disable%20application%20DNS%2C%20(i.e.%2C%20DoH).), and [split-horizon fallback guidance](https://support.mozilla.org/gu-IN/kb/dns-over-https-doh-faqs#:~:text=If%20Firefox%20fails%20to%20resolve%20a%20domain%20via%20DoH%2C%20it%20will%20fall%20back%20to%20the%20DNS.).
- Chromium — [Chrome's same-provider DoH auto-upgrade model](https://www.chromium.org/developers/dns-over-https/#:~:text=Chrome's%20auto%2Dupgrade%20approach%20does%20not%20change%20the%20DNS%20provider).
- Microsoft — [Configure DNS over HTTPS in Windows](https://learn.microsoft.com/en-us/windows-server/networking/dns/doh-client-support#:~:text=Allow%20DoH.%20Queries%20will%20be%20performed%20using%20DoH%20if%20the%20specified%20DNS%20servers%20support%20the%20protocol.).
- EFF — [Encrypted DNS could help close one of the internet's biggest privacy gaps](https://www.eff.org/deeplinks/2019/10/encrypted-dns-could-help-close-biggest-privacy-gap-internet).
