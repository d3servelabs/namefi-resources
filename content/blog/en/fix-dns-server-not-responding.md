---
title: 'Diagnose a DNS Server That Does Not Respond on Windows'
description: 'Check Windows DNS timeouts without blind resets. Identify the configured resolver, compare exact queries, and separate missing records from no response.'
date: '2026-10-28'
language: en
tags: ['dns', 'windows', 'networking', 'troubleshooting']
authors: ['namefiteam']
draft: false
format: guide
ogImage: ../../assets/fix-dns-server-not-responding-og.jpg
cluster: domain-basics
keywords: ['dns not responding', 'DNS server not responding Windows', 'DNS timeout', 'Windows DNS troubleshooting', 'Resolve-DnsName', 'nslookup timeout', 'unreachable DNS server', 'DNS resolver configuration', 'DNS firewall troubleshooting', 'DNS query comparison']
relatedArticles:
  - /en/blog/fix-dns-probe-finished-nxdomain/
  - /en/blog/flush-dns-cache/
  - /en/blog/nslookup-specific-dns-server/
  - /en/blog/choose-public-dns-resolver/
  - /en/blog/dhcp-vs-dns/
relatedGlossary:
  - /en/glossary/dns/
  - /en/glossary/dns-resolver/
  - /en/glossary/nameserver/
  - /en/glossary/ip-address/
  - /en/glossary/dns-propagation/
relatedTopics:
  - /en/topics/domain-basics/
  - /en/topics/domain-security/
relatedSeries:
  - /en/series/domain-investor-field-guide/
  - /en/series/domain-apocalypse/
---

A “DNS server not responding” message does not identify the failed component.
The device, the configured resolver, or the network between both systems can prevent a reply.
Start with observations before changing settings.

This guide covers Windows clients and DNS timeouts.
A server that replies with NXDOMAIN presents a different observation from a server that does not reply.
Use the [NXDOMAIN guide](/en/blog/fix-dns-probe-finished-nxdomain/) when the response reports a missing name.

## Record the failure and identify the configured resolver

![A device, network, and resolver form separate diagnostic boundaries.](../../assets/fix-dns-server-not-responding-01-resolver.jpg)

Record the exact hostname, the original error, and the UTC time.
Check whether the failure affects one website, one application, or several devices.
Compare another website on the same device without changing network settings.
Treat each comparison as evidence about scope, rather than proof of a particular cause.

On the affected Windows device, run `ipconfig /all`.
Find the active network adapter and note the DNS server addresses, default gateway, and connection-specific DNS suffix.
Microsoft's [client troubleshooting procedure](#microsoft-documents-the-client-checks) starts with these configuration checks.
An unexpected address deserves investigation before a cache flush.

A work VPN can require an internal resolver.
Keep the approved VPN connected when testing an internal hostname.
Do not send internal names to a public resolver merely to compare results.
Ask the network administrator which resolver should answer the name.

A ping test checks ICMP reachability.
A successful ping does not prove that DNS queries work.
A failed ping does not prove that DNS is unavailable because the network can block ICMP.
Microsoft explains the ICMP requirement in its [client troubleshooting procedure](#microsoft-documents-the-client-checks).
Test the actual DNS query next.

## Compare the same DNS query through controlled paths

![A timeout has no response, while NXDOMAIN and SERVFAIL are different server replies.](../../assets/fix-dns-server-not-responding-02-responses.jpg)

Use a fully qualified hostname with a final period.
The final period avoids adding a DNS search suffix to the test name.
Microsoft describes suffix-related delays in its [client resolution scenarios](#microsoft-explains-client-resolution-failures).

Run a query through the Windows resolver, such as `Resolve-DnsName -Name www.example.com. -Type A -DnsOnly`.
Replace `www.example.com.` with the public hostname under investigation.
Keep the hostname and record type unchanged during subsequent comparisons.

Then query a specific, approved resolver with `nslookup -type=A www.example.com. 192.0.2.53`.
Replace `192.0.2.53` with the actual permitted resolver address.
The example address belongs to the [documentation-only address space](https://www.rfc-editor.org/rfc/rfc5737.html#section-3).
The example address is not a working public service.
Microsoft documents the selected server as [nslookup's second argument](#microsoft-defines-nslookup-results).

Interpret the actual response:

| Observation | What the observation establishes | Next check |
| --- | --- | --- |
| The query returns the expected A record | That query obtained an IPv4 address | Compare the failing application's lookup path |
| The tool reports a timeout | The tool received no usable reply before its deadline | Check the configured server and network path |
| The server returns NXDOMAIN | The server replied that the queried name does not exist | Inspect the name and authoritative records |
| The server returns SERVFAIL | The server replied with a processing failure | Investigate resolver or upstream failures |
| The server refuses the query | The server replied but denied the operation | Check resolver access policy |

Microsoft's [nslookup reference](#microsoft-defines-nslookup-results) distinguishes these outcomes.
[RFC 1035 defines DNS response codes](https://www.rfc-editor.org/rfc/rfc1035.html#section-4.1.1), including Name Error and Server Failure.
Do not describe every unsuccessful lookup as an unreachable server.

An explicit-server test does not reproduce every part of Windows name resolution.
Microsoft documents different behavior when several configured resolvers include unreachable servers.
A successful isolated test can coexist with a slow or failing application lookup.
Compare the configured server list and the application's actual path before declaring recovery.

## Correct the identified cause and verify the original application

![Record the original choice, make one authorized change, and repeat the application test.](../../assets/fix-dns-server-not-responding-03-verification.jpg)

If the device lists an incorrect resolver, restore the configuration approved for the network.
Record the previous settings before an authorized change.
If several devices fail through the same resolver, give the network operator the failing hostname and query results.

If a firewall blocks DNS traffic, investigate the relevant rule or packet-drop logs.
Microsoft's [client resolution scenarios](#microsoft-explains-client-resolution-failures) cover blocked DNS traffic and unreachable resolver addresses.
A packet trace can help locate the missing reply.
A timeout alone cannot identify the device that dropped a packet.

If the resolver returns the expected answer but an application still fails, inspect the application's resolver path and local state.
Use the [cache-flush guide](/en/blog/flush-dns-cache/) when the evidence points to a stale local answer.
A flush does not repair an unreachable resolver or change the domain's published records.

Avoid factory resets, blanket security disabling, or repeated resolver changes as diagnostic shortcuts.
Those changes can remove useful evidence or interrupt unrelated services.
Apply one authorized correction, then repeat the original lookup and open the original application.
Record both results.

A useful support report includes the hostname, UTC timestamp, selected resolver, record type, response, and affected devices.
Remove unrelated internal names before sharing the report publicly.
The report should distinguish a recovered application from a command that merely completed successfully.

## These sources document the diagnostic checks

### Microsoft documents the client checks

Microsoft, [Troubleshooting DNS clients](https://learn.microsoft.com/en-us/windows-server/networking/dns/troubleshoot/troubleshoot-dns-client#check-ip-configuration).
The procedure covers adapter configuration, ICMP requirements, query comparisons, and local cache checks.
The source was checked on October 28, 2026, in America/Los_Angeles.

### Microsoft explains client resolution failures

Microsoft, [Troubleshoot DNS client name resolution issues](https://learn.microsoft.com/en-us/troubleshoot/windows-client/networking/troubleshoot-dns-client-resolution-issues#scenario-1-firewall-rule-blocks-outbound-connections-on-udp-port-53).
The scenarios cover blocked traffic, unreachable resolvers, multiple-server behavior, Hosts entries, and DNS search suffixes.
The source was checked on October 28, 2026, in America/Los_Angeles.

### Microsoft defines nslookup results

Microsoft, [nslookup](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/nslookup#remarks).
The reference documents explicit-server queries and the meanings of common failure responses.
The source was checked on October 28, 2026, in America/Los_Angeles.
