---
title: DNS
date: '2025-06-30'
language: en
tags: ['glossary']
authors: ['namefiteam']
description: The hierarchical naming system that translates human-readable domain names into the IP addresses computers use to route traffic across the internet.
keywords: ['DNS', 'domain name system', 'name resolution', 'DNS lookup', 'DNS records', 'nameserver', 'recursive resolver', 'DNSSEC', 'internet infrastructure']
also_known_as: ['Domain Name System']
level: 2
sources:
  - https://datatracker.ietf.org/doc/html/rfc1034
  - https://datatracker.ietf.org/doc/html/rfc1035
  - https://www.iana.org/domains/root
  - https://www.cloudflare.com/learning/dns/what-is-dns/
  - https://www.icann.org/resources/pages/what-2012-02-25-en
---

**DNS** (the *Domain Name System*) is the internet's distributed, hierarchical naming system that translates human-readable domain names—such as `example.com`—into the [IP addresses](/en/glossary/ip-address/) that networking equipment uses to route packets across the internet. Without DNS, every user would need to remember the numeric addresses of every site they wished to visit. Defined in [RFC 1034](https://datatracker.ietf.org/doc/html/rfc1034) and [RFC 1035](https://datatracker.ietf.org/doc/html/rfc1035) (published by the IETF in 1987 and still foundational today), DNS remains one of the core protocols of the internet.

## What DNS does

DNS performs **name resolution**: given a domain name, it returns the resource records associated with that name—most commonly an [IP address](/en/glossary/ip-address/) so a browser or application knows where to send its connection request. The system is also used to route email (MX records), verify domain ownership (TXT records), and delegate authority over a zone to a particular set of servers (NS records).

Because DNS is read far more often than it is updated, the protocol is optimized for fast, cached reads distributed across millions of servers worldwide rather than for immediate consistency.

## How a DNS lookup works

When you type `example.com` into a browser, a multi-step resolution process begins:

1. **Local cache check.** The operating system first checks its own DNS cache. If a recent, still-valid answer is stored there, the lookup ends immediately.

2. **Recursive resolver.** If no cached answer exists, the query is forwarded to a [DNS resolver](/en/glossary/dns-resolver/)—a server operated by your ISP, a company (such as Cloudflare's `1.1.1.1` or Google's `8.8.8.8`), or your organization. This resolver takes on the work of finding the answer on your behalf; this mode of operation is called **recursive resolution**.

3. **Root nameservers.** If the resolver has no cached answer, it contacts one of the 13 logical [root zone](/en/glossary/root-zone/) nameserver clusters (lettered `a` through `m`). The root server does not know the final answer but responds with a referral to the [nameservers](/en/glossary/nameserver/) responsible for the relevant top-level domain (TLD), such as `.com` or `.org`. The [IANA](https://www.iana.org/domains/root) publishes and maintains the root zone database.

4. **TLD nameservers.** The resolver queries the TLD nameservers. They respond with a referral to the **authoritative nameservers** for the specific domain (`example.com`).

5. **Authoritative nameservers.** The resolver queries the domain's authoritative [nameserver](/en/glossary/nameserver/), which holds the actual DNS records. The authoritative server returns the resource record—for instance, an `A` record containing an IPv4 address.

6. **Response and caching.** The resolver returns the answer to the client and caches it for the duration specified by the record's [TTL](/en/glossary/ttl/) (Time to Live). Subsequent queries for the same name within the TTL window are served from cache, reducing latency and load on upstream servers.

This pattern—where the resolver does the iterative legwork and the client only talks to one server—is called **recursive resolution**. In contrast, **iterative resolution** is when the client itself queries each level of the hierarchy in sequence; this is rare in practice but is how resolvers internally traverse the hierarchy ([RFC 1034 §5.3](https://datatracker.ietf.org/doc/html/rfc1034#section-5.3)).

## The DNS hierarchy and key record types

DNS is organized as an inverted tree. The root (`.`) sits at the top; beneath it are TLDs (`.com`, `.net`, `.io`, country codes such as `.de`); beneath each TLD are second-level domains (`example.com`); and these can have arbitrarily deep subdomains (`mail.example.com`).

Each node in this tree is called a **zone**, and the authoritative nameserver for a zone holds that zone's **resource records**. The most commonly encountered [DNS record types](/en/glossary/dns-record-types/) are:

| Record | Purpose | Example value |
|--------|---------|---------------|
| **A** | Maps a name to an IPv4 address | `93.184.216.34` |
| **AAAA** | Maps a name to an IPv6 address | `2606:2800:21f:cb07::1` |
| **CNAME** | Aliases one name to another canonical name | `www → example.com` |
| **MX** | Specifies mail servers for the domain, with priority | `10 mail.example.com` |
| **NS** | Delegates a zone to a set of nameservers | `ns1.example.com` |
| **TXT** | Stores arbitrary text; used for SPF, DKIM, domain verification | `"v=spf1 include:…"` |
| **SOA** | Start of Authority — metadata about the zone itself | serial, refresh, retry timings |

`CNAME` records cannot be placed at the zone apex (the bare domain `example.com`) because a `CNAME` must be the only record at a name, but the apex also requires `NS` and `SOA` records. Many DNS providers work around this with proprietary "CNAME flattening" or `ALIAS`/`ANAME` pseudo-record types.

## Who runs DNS

DNS governance and operation is distributed across several layers of actors:

- **[ICANN](/en/glossary/icann/) / IANA.** The Internet Corporation for Assigned Names and Numbers oversees the [root zone](/en/glossary/root-zone/) and coordinates the global DNS namespace. IANA, a function of ICANN, maintains the [root zone database](https://www.iana.org/domains/root) listing all TLDs and their authoritative nameservers.

- **Registries.** A [registry](/en/glossary/registry/) operates the authoritative database for a specific TLD. For example, Verisign operates `.com` and `.net`; the Public Interest Registry operates `.org`. Registries publish and maintain the NS records that point to each domain's nameservers.

- **Registrars.** A [registrar](/en/glossary/registrar/) is an organization accredited by ICANN (or the relevant registry) to sell domain names to the public and submit registration data to the registry on behalf of customers.

- **Recursive resolvers.** DNS resolvers are operated by ISPs, public DNS services (Cloudflare, Google, Quad9), enterprises, and home routers. They handle the iterative lookups described above and cache results to reduce query latency ([Cloudflare Learning — What is DNS?](https://www.cloudflare.com/learning/dns/what-is-dns/)).

- **Authoritative nameservers.** Hosted by domain owners or their DNS providers, these servers hold the actual zone files and respond to resolver queries with definitive answers.

## Security

The original DNS specifications were designed for reliability and scale, not security. Several vulnerabilities and protective mechanisms have emerged over time:

**Cache poisoning.** An attacker who can inject a forged DNS response into a resolver's cache can redirect users from legitimate sites to malicious ones without their knowledge. The Kaminsky attack (2008) demonstrated this at scale, leading to wider adoption of port randomization and [DNSSEC](/en/glossary/dnssec/).

**DNSSEC.** DNS Security Extensions, defined in RFC 4033–4035, adds cryptographic signatures to DNS records. A resolver that validates [DNSSEC](/en/glossary/dnssec/) signatures can detect tampered responses. Adoption is growing but uneven: as of 2024, roughly 90 % of the root zone and major TLDs are signed, but end-to-end validation depends on all zones in the chain being signed and resolvers checking signatures.

**DNS hijacking.** Attackers who compromise a registrar account, registry systems, or an ISP's resolver can redirect DNS responses at scale. Defenses include registrar-level multi-factor authentication, registry locks (EPP `serverTransferProhibited`), and monitoring for unexpected NS or A record changes.

**DNS over HTTPS / DNS over TLS (DoH / DoT).** These protocols encrypt DNS queries between clients and resolvers, preventing eavesdropping and on-path modification of queries in transit—a complementary protection to DNSSEC, which addresses data integrity rather than privacy.

## DNS and tokenized domains

Some blockchain-based domain systems (such as Ethereum Name Service) maintain their own name→address mappings entirely on-chain, independent of the traditional DNS hierarchy. Others issue on-chain tokens that represent ownership of a conventionally registered domain, where the underlying DNS zone file continues to be hosted on standard nameservers. In the latter case, DNS resolution works through the normal lookup flow described above; the blockchain record attests to ownership but is not part of the resolution path. The two systems—on-chain ownership records and the global DNS—are distinct layers that can coexist or be bridged through gateway resolvers.

---

*Sources: [RFC 1034](https://datatracker.ietf.org/doc/html/rfc1034), [RFC 1035](https://datatracker.ietf.org/doc/html/rfc1035), [IANA Root Zone Database](https://www.iana.org/domains/root), [Cloudflare Learning — What is DNS?](https://www.cloudflare.com/learning/dns/what-is-dns/), [ICANN — What is DNS?](https://www.icann.org/resources/pages/what-2012-02-25-en)*
