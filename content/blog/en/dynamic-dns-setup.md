---
title: "Dynamic DNS Keeps a Hostname Pointed at a Changing Address"
description: "Plan dynamic DNS updates for a changing IP address, choose an update client, limit credentials, and check reachability separately from DNS."
date: '2026-10-22'
language: en
tags: ['dns', 'networking', 'domains', 'guide']
authors: ['namefiteam']
draft: false
format: guide
cluster: domain-basics
keywords: ['dynamic DNS', 'DDNS setup', 'dynamic DNS client', 'DDNS custom domain', 'dynamic IP address', 'ddclient', 'Cloudflare dynamic DNS', 'DDNS CGNAT', 'DNS update', 'dynamic DNS security', 'DDNS troubleshooting']
ogImage: ../../assets/dynamic-dns-setup-og.jpg
relatedArticles:
  - /en/blog/dhcp-vs-dns/
  - /en/blog/run-your-own-dns-resolver/
  - /en/blog/primary-secondary-dns/
  - /en/blog/change-domain-nameservers/
  - /en/blog/ipv6-and-dns/
relatedTopics:
  - /en/topics/domain-basics/
  - /en/topics/domain-security/
relatedSeries:
  - /en/series/domain-investor-field-guide/
  - /en/series/domain-apocalypse/
relatedGlossary:
  - /en/glossary/dns/
  - /en/glossary/dns-record-types/
  - /en/glossary/ttl/
  - /en/glossary/ip-address/
  - /en/glossary/nameserver/
---

**Dynamic DNS updates a DNS record when an address changes.** A client detects the address and sends an authorized update to the DNS provider. Cloudflare documents both an API approach and the existing `ddclient` utility. [Its guide describes the two options](#cloudflare-describes-address-update-options).

A home server can keep one hostname while an internet provider changes the connection's address. That convenience does not establish that the server accepts outside connections. Plan DNS updates and network access as separate tasks.

## An update client changes records rather than resolving names

![An address detector sends an authorized update through a client to DNS.](../../assets/dynamic-dns-setup-01-update.jpg)

A [DNS resolver](/en/glossary/dns-resolver/) answers lookup requests. A DDNS client changes the records those lookups can return. Running a resolver does not automatically create an address update service. The [DHCP and DNS comparison](/en/blog/dhcp-vs-dns/) explains the separate client-configuration role.

DDNS also does not mean every provider uses the same update protocol. RFC 2136 defines the DNS UPDATE operation for adding or deleting records. A hosted DNS provider can instead expose an HTTPS API. [The standard defines DNS UPDATE](#the-standard-defines-dns-update), while [Cloudflare describes API-driven updates](#cloudflare-describes-address-update-options). Use the method the authoritative provider and client support.

Check existing software before writing a script. The `ddclient` documentation separates general settings, address detection, and provider protocols. Those settings answer three practical questions: how the client runs, where the address comes from, and which service receives updates. [The project explains its configuration model](#ddclient-separates-detection-from-provider-updates).

For a custom hostname such as `home.example.com`, confirm that the client can update the provider hosting the relevant zone. Buying a domain from a registrar does not prove that the registrar also hosts its authoritative DNS. Check the domain's [nameservers](/en/glossary/nameserver/) before selecting the update method.

## A correct DNS answer does not establish network access

![A DNS check and a locked network access check remain separate.](../../assets/dynamic-dns-setup-02-reachability.jpg)

Identify the address that outside clients must reach. A device's local address, a router's WAN address, and an externally observed address can differ. Carrier-grade NAT can place another translation layer in the provider's network. RFC 6598 reserves `100.64.0.0/10` as Shared Address Space for such networks. [The standard describes the allocation and use](#the-standard-describes-shared-address-space).

Publishing an address cannot create a port mapping through a provider's NAT. Confirm inbound connectivity with the internet provider before promising public access. A router address in Shared Address Space warrants investigation. An address outside that block alone does not prove inbound reachability.

Decide who may access the service before opening any network path. A private administration service needs an authenticated access design. DNS records identify destinations. DNS records do not grant or enforce application permission. Keep firewall rules and application authentication in the deployment checklist.

[Time to live](/en/glossary/ttl/) also affects observations. An authoritative update and a cached answer can differ while caches retain older data. Lowering a TTL does not erase an answer already cached under its previous TTL. Cloudflare explains that TTL controls caching and that local caches can delay visible changes. [Its TTL documentation describes the distinction](#cloudflare-explains-caching-and-proxy-answers).

With Cloudflare proxying enabled, address lookups return Cloudflare addresses rather than the configured origin address. Verify the origin through the provider's record data. Do not interpret a proxy address as proof that the DDNS client failed. [Cloudflare distinguishes proxied and DNS-only records](#cloudflare-explains-proxy-answers).

## A controlled deployment verifies updates and access separately

1. Identify the authoritative provider for the intended hostname.
2. Check the client's provider support and address-detection method.
3. Create a credential with the smallest supported update scope.
4. Keep the credential in a protected store accessible only to the updater.
5. Configure the hostname and the intended IPv4 or IPv6 record type.
6. Run an update and inspect the provider's result.
7. Compare authoritative answers with cached resolver answers.
8. Test the intended service from an outside network.
9. Confirm that unauthorized users cannot access the service.

Cloudflare lets tokens restrict permissions and resources. A zone-scoped token does not necessarily restrict writes to one hostname. Check the provider's available scope instead of assuming per-record isolation. Never put a token into a public repository, screenshot, or shared command. [Cloudflare documents token permissions and resource restrictions](#cloudflare-describes-token-permissions).

Keep update logs free of credentials. Record the target hostname, address family, result, and last successful update time with its timezone. Handle IPv4 and IPv6 separately. An IPv4 update does not verify the IPv6 path.

When troubleshooting, inspect each boundary: address detection, update authorization, authoritative record, cached answer, and service access. A successful update request proves neither immediate cache refresh nor application availability.

## These sources support the deployment decisions

### Cloudflare describes address update options

Cloudflare — [Dynamically update DNS records](https://developers.cloudflare.com/dns/manage-dns-records/how-to/managing-dynamic-ip-addresses/#cloudflare-api), “Cloudflare API” and “ddclient.” Fetched 2026-10-22.

### The standard defines DNS UPDATE

IETF — [RFC 2136](https://www.rfc-editor.org/rfc/rfc2136.html#section-1), abstract and Section 8 on update security. Fetched 2026-10-22.

### ddclient separates detection from provider updates

ddclient project — [Configuration introduction](https://ddclient.net/#configuration). Fetched 2026-10-22.

### The standard describes shared address space

IETF — [RFC 6598](https://www.rfc-editor.org/rfc/rfc6598.html#section-1), Sections 1, 4, and 7. Fetched 2026-10-22.

### Cloudflare explains caching and proxy answers

Cloudflare — [Time to Live](https://developers.cloudflare.com/dns/manage-dns-records/reference/ttl/#proxied-records), introduction and “Proxied records.” Fetched 2026-10-22.

### Cloudflare explains proxy answers

Cloudflare — [Proxy status](https://developers.cloudflare.com/dns/proxy-status/#example), proxy and DNS-only response examples. Fetched 2026-10-22.

### Cloudflare describes token permissions

Cloudflare — [Create API token](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/#create-an-api-token), permissions and resource selection. Fetched 2026-10-22.
