---
title: What Is DNS? How Your Browser Finds a Website From Its Name
description: Follow a DNS lookup from a hostname to authoritative records, then learn how resolvers, record types, and cache lifetimes affect a website.
date: '2026-10-30'
language: en
authors:
- namefiteam
draft: false
cluster: domain-basics
format: explainer
tags:
- domains
- guide
keywords:
- what is DNS
- domain name system
- DNS meaning
- how DNS works
- DNS lookup process
- recursive resolver
- authoritative DNS
- DNS records
- DNS cache
- DNS TTL
- domain resolution
- DNS hierarchy
updated: '2026-10-30'
ogImage: ../../assets/what-is-dns-og.jpg
relatedArticles:
- /en/blog/what-is-a-dns-server/
- /en/blog/dns-record-types-guide/
- /en/blog/fully-qualified-domain-name/
- /en/blog/root-dns-servers/
- /en/blog/ttl-and-dns-propagation/
relatedGlossary:
- /en/glossary/dns/
- /en/glossary/dns-resolver/
- /en/glossary/nameserver/
- /en/glossary/root-zone/
- /en/glossary/dns-record-types/
relatedTopics:
- /en/topics/domain-basics/
- /en/topics/domain-security/
relatedSeries:
- /en/series/tokenize-your-com/
- /en/series/domain-apocalypse/
---

**DNS, the Domain Name System, associates domain names with records that applications use.** Address records help a browser find a website's network destination. Other records support mail routing and delegation. DNS consists of a hierarchical name space, resource records, name servers, and resolvers. [RFC 1034 defines these components](#the-dns-standard-defines-names-records-and-servers).

DNS does not store every website page. DNS helps an application find relevant service information. The browser then communicates with the selected website using the required web protocols. Registration, DNS, hosting, and HTTPS therefore answer different setup questions.

## A hostname identifies a position in a hierarchy

Consider `www.example.com.`. The example uses a [reserved documentation domain](#the-ietf-reserves-example-domains). Each dot separates labels. The final dot represents the root, and ordinary web addresses often omit that final dot. The labels run from the specific name toward the root. [RFC 1034 defines the hierarchy](#the-dns-standard-describes-the-name-hierarchy).

The root sits above `com`. The name `example.com` sits below `com`, and `www.example.com` sits below `example.com`. The hierarchy lets different organizations administer different portions of the name space.

A DNS zone is an administrative part of that system. A parent can delegate a child zone using nameserver information. Authoritative servers hold the zone data they serve. [The standard describes zones and delegation](#the-dns-standard-explains-zones-and-delegation).

This arrangement avoids requiring one server to store every domain's complete records. A resolver can follow the hierarchy to reach the authority for the question. The [domain-name guide](/en/blog/what-is-domain/) explains how names differ from complete URLs.

## A resolver can use its cache or follow referrals

A device commonly asks a recursive resolver to obtain an answer. A stub resolver on the device relies on another resolver for the full resolution process. Current DNS terminology distinguishes those roles explicitly. [RFC 9499 defines stub and recursive resolvers](#the-current-dns-terminology-distinguishes-resolver-roles).

For a simplified uncached lookup of `www.example.com`, the resolver can follow this sequence:

1. Find the appropriate root-server information.
2. Follow a referral toward the `com` servers.
3. Follow delegation information toward the domain's authoritative servers.
4. Obtain the requested record or the relevant DNS error.
5. Return the result to the requesting client.

The example describes a logical path, rather than a packet capture from a live query. A resolver with useful cached information can start closer to the answer. The standard's algorithm first checks local information and then selects servers to query. [RFC 1034 describes that algorithm](#the-resolver-algorithm-checks-local-information-first).

A root server does not need to supply the final website address itself. A referral can direct the resolver toward another part of the hierarchy. Likewise, the browser does not need to query every authoritative server directly.

![A cold cache requires upstream queries while a warm cache can reuse stored data.](../../assets/root-dns-servers-03-cache-minimization.jpg)

## Record types identify the question being asked

A DNS question includes a name and a requested record type. Asking for a website address differs from asking for mail routing. RFC 1034 describes the relationship between a query and the requested resource information. [The DNS component definition explains the query](#the-dns-standard-defines-names-records-and-servers).

| Record type | Main job |
| --- | --- |
| A | Associates a name with an IPv4 address |
| AAAA | Associates a name with an IPv6 address |
| CNAME | Identifies the canonical name for an alias |
| MX | Identifies mail-exchange information |
| NS | Identifies nameservers for the domain or delegation |

RFC 1034 defines A, CNAME, MX, and NS record roles. [The record description identifies those types](#the-dns-standard-defines-common-record-types). RFC 3596 adds the AAAA type for IPv6 addresses. [The IPv6 extension defines that purpose](#the-ipv6-dns-standard-defines-aaaa-records).

A domain can therefore need several records for different services. A working website address does not prove that mail routing works. An email setup does not create a website. Use the [DNS record guide](/en/blog/dns-record-types-guide/) when configuring a particular service.

![DNS record types select different website, mail, and authority functions.](../../assets/dns-record-types-guide-05-record-selection.jpg)

## Cache lifetimes explain why observations differ

A record's TTL defines a cache lifetime in seconds. The TTL limits how long a resolver can retain a cached record before discarding the record. [RFC 1034 defines the TTL field](#the-dns-standard-defines-cache-lifetimes).

A DNS update does not push an immediate replacement into every existing cache. A resolver can still use a previously cached answer during its remaining lifetime. The next observer may therefore receive a different answer depending on the cache and query path.

DNS can also cache negative answers. A name that did not exist during an earlier lookup can continue to produce a cached negative response after the operator creates the name. [RFC 2308 defines negative-answer caching](#the-dns-standard-defines-negative-cache-lifetimes).

These rules explain why “DNS propagation” needs a precise question. Ask whether the authoritative server has the intended record, whether a selected resolver has refreshed its answer, and whether the application uses that resolver. The [TTL guide](/en/blog/ttl-and-dns-propagation/) separates those observations.

![TTL limits cache reuse rather than broadcasting an update.](../../assets/ttl-and-dns-propagation-01-section.jpg)

## A DNS result does not verify the website's behavior

A domain registration provides registration rights and an administrative relationship. ICANN explains that registration alone does not supply a website or mailbox. [The registration FAQ separates those services](#icann-separates-registration-from-web-services).

HTTPS adds another boundary. A browser must establish a protected connection and verify the expected service identity after obtaining a destination. [The HTTPS standard specifies those requirements](#the-https-standard-requires-a-protected-connection). A correct DNS answer does not repair an expired or mismatched certificate.

A server can also accept a connection and reject an application request. Diagnose the observed failure instead of labeling every website problem a DNS problem. The [HTTPS explanation](/en/blog/what-is-https/) develops that distinction.

![The browser obtains a DNS destination before requesting a page from the web service.](../../assets/domain-vs-hosting-02-request-path.jpg)

## A useful DNS check preserves the name and record type

With `nslookup` available, a basic illustrative query is:

```text
nslookup www.example.com.
```

Replace the example name before running the command. Microsoft documents the first argument as the requested name and an optional second argument as the DNS server to query. [The nslookup reference explains the arguments](#microsoft-documents-an-explicit-dns-query).

Record the hostname, record type, resolver, UTC test time, and exact result. If another resolver returns a different answer, investigate the source of the difference before declaring either answer wrong.

For the device setting that selects a resolver, use the separate [DNS server guide](/en/blog/what-is-a-dns-server/). For a published-record change, work with the domain's authoritative DNS provider. Those actions affect different parts of the system.

## Sources and further reading

### The DNS standard defines names records and servers

[IETF RFC 1034, section 2.4](https://www.rfc-editor.org/rfc/rfc1034.html#section-2.4). Fetched 2026-10-30.

### The IETF reserves example domains

[IETF RFC 2606, section 3](https://www.rfc-editor.org/rfc/rfc2606.html#section-3). Fetched 2026-10-30.

### The DNS standard describes the name hierarchy

[IETF RFC 1034, section 3.1](https://www.rfc-editor.org/rfc/rfc1034.html#section-3.1). Fetched 2026-10-30.

### The DNS standard explains zones and delegation

[IETF RFC 1034, section 4.2.1](https://www.rfc-editor.org/rfc/rfc1034.html#section-4.2.1). Fetched 2026-10-30.

### The current DNS terminology distinguishes resolver roles

[IETF RFC 9499, section 6, resolution terminology](https://www.rfc-editor.org/rfc/rfc9499.html#section-6). Fetched 2026-10-30.

### The resolver algorithm checks local information first

[IETF RFC 1034, section 5.3.3](https://www.rfc-editor.org/rfc/rfc1034.html#section-5.3.3). Fetched 2026-10-30.

### The DNS standard defines common record types

[IETF RFC 1034, section 3.6](https://www.rfc-editor.org/rfc/rfc1034.html#section-3.6). Fetched 2026-10-30.

### The IPv6 DNS standard defines AAAA records

[IETF RFC 3596, section 1](https://www.rfc-editor.org/rfc/rfc3596.html#section-1). Fetched 2026-10-30.

### The DNS standard defines cache lifetimes

[IETF RFC 1034, TTL field definition](https://www.rfc-editor.org/rfc/rfc1034.html#section-3.6). Fetched 2026-10-30.

### The DNS standard defines negative cache lifetimes

[IETF RFC 2308, section 5](https://www.rfc-editor.org/rfc/rfc2308.html#section-5). Fetched 2026-10-30.

### ICANN separates registration from web services

[ICANN registration FAQ](https://www.icann.org/resources/pages/faqs-84-2012-02-25-en#:~:text=Your%20domain%20name%20registration%20is%20not). Fetched 2026-10-30.

### The HTTPS standard requires a protected connection

[IETF RFC 9110, sections 4.2.2 and 4.3.4](https://www.rfc-editor.org/rfc/rfc9110.html#section-4.2.2). Fetched 2026-10-30.

### Microsoft documents an explicit DNS query

[Microsoft, nslookup remarks](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/nslookup#remarks). Fetched 2026-10-30.
