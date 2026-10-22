---
title: 'A DNS Cache Flush Refreshes Local Answers on Windows, macOS, and Linux'
description: 'Clear the right DNS cache, compare results, and distinguish local stale answers from upstream caching, missing records, and browser problems.'
date: '2026-10-22'
language: en
tags: ['dns', 'networking', 'troubleshooting', 'guide']
authors: ['namefiteam']
draft: false
format: guide
cluster: domain-basics
keywords: ['flush dns', 'clear DNS cache', 'ipconfig flushdns', 'flush dns Windows 11', 'flush dns Windows 10', 'flush DNS macOS', 'resolvectl flush-caches', 'Linux DNS cache', 'DNS cache troubleshooting', 'negative DNS cache']
ogImage: ../../assets/flush-dns-cache-og.jpg
relatedArticles:
  - /en/blog/nslookup-specific-dns-server/
  - /en/blog/ttl-and-dns-propagation/
  - /en/blog/choose-public-dns-resolver/
  - /en/blog/isp-dns-vs-public-resolver/
  - /en/blog/dhcp-vs-dns/
relatedGlossary:
  - /en/glossary/dns/
  - /en/glossary/dns-resolver/
  - /en/glossary/ttl/
  - /en/glossary/nameserver/
  - /en/glossary/dnssec/
relatedTopics:
  - /en/topics/domain-basics/
  - /en/topics/domain-security/
relatedSeries:
  - /en/series/domain-investor-field-guide/
  - /en/series/domain-apocalypse/
---

On Windows, `ipconfig /flushdns` clears the local DNS client resolver cache.
On Linux with systemd-resolved, `resolvectl flush-caches` clears that service's local caches.
macOS requires guidance appropriate to the installed version.
A local flush does not edit the domain's published records or clear every upstream resolver.

Use a flush when evidence points to a cached answer on the affected device.
Record the failing hostname and error before changing the cache.
An error that survives a flush needs a comparison, rather than another round of resets.
The [specific-server lookup guide](/en/blog/nslookup-specific-dns-server/) explains those comparisons.

## Windows clears its client cache with ipconfig

![A Windows laptop clears one local DNS cache tray.](../../assets/flush-dns-cache-01-windows.jpg)

Open Command Prompt with administrator privileges on a device that you manage.
Run:

```text
ipconfig /flushdns
```

Microsoft documents the command for Windows 10 and Windows 11.
The command discards dynamically added entries, including cached negative answers.
[Microsoft's ipconfig reference](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/ipconfig#parameters) defines the cache operation.
The command does not publish a new address for a website.

Before flushing, this optional command displays the client cache:

```text
ipconfig /displaydns
```

Cache output can contain hostnames from browsing or internal services.
Review saved output before sharing a support report.
Microsoft notes that the displayed cache includes entries from the local Hosts file.
A flush does not replace the need to inspect an incorrect Hosts entry.

Retry the original application after the flush.
Record whether the original error changed.
Successful command execution confirms the requested cache operation, rather than successful website loading.

Do not add unrelated ipconfig commands to the procedure.
`/release` discards DHCP address configuration, while `/renew` renews a DHCP lease.
`/registerdns` requests dynamic registration of the computer's names and addresses.
Microsoft documents those [separate operations](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/ipconfig#parameters).
None is a synonym for flushing the client cache.

## macOS and Linux require the correct local resolver procedure

![Windows, macOS, and Linux devices keep separate local cache trays.](../../assets/flush-dns-cache-02-platform.jpg)

On a Mac, identify the macOS version before copying a Terminal command.
Apple's [DNS cache reset article](https://support.apple.com/en-us/101481) describes different commands for different OS X releases.
Apple marks the article as archived and no longer updated.
The archived article also describes restarting the Mac to refresh cached information.
Save work before restarting a personal Mac.

For historical context, Apple documents this command for OS X 10.10.4 and later in that archived article:

```text
sudo killall -HUP mDNSResponder
```

Treat the archived version range as historical documentation, rather than a current compatibility guarantee for every macOS release.
Check the installed version's documentation or your administrator's procedure before using a privileged command.
An unfamiliar command can affect a shared machine beyond the browser under investigation.

On Linux, first identify the active resolver.
For a system that uses systemd-resolved, run:

```text
resolvectl status
resolvectl statistics
sudo resolvectl flush-caches
```

`status` shows global and per-link DNS settings.
`statistics` shows resolver statistics.
`flush-caches` clears the DNS resource-record caches maintained locally by systemd-resolved.
The [systemd resolvectl manual](https://www.freedesktop.org/software/systemd/man/latest/resolvectl.html#flush-caches) documents each operation.

A missing `resolvectl` command does not prove that the machine has no DNS cache.
Another service or application can maintain cached data.
Identify that service and follow the installed service's documentation.
Avoid restarting network services merely because a command intended for another distribution did not work.

## A comparison identifies the cache that still matters

![An eraser clears only the device cache while resolver and authority records remain separate.](../../assets/flush-dns-cache-03-boundaries.jpg)

A [DNS resolver](/en/glossary/dns-resolver/) can keep an answer independently of the affected computer.
A resolver can also cache a negative response.
[RFC 2308, Section 5](https://www.rfc-editor.org/rfc/rfc2308.html#section-5) specifies negative-answer caching.
Clearing a device cache therefore cannot guarantee that the next upstream answer will differ.

For example, suppose an administrator creates a missing verification record.
The authoritative server now returns the record, while the selected resolver still returns a cached negative answer.
A device flush can request the record again and still receive the earlier negative answer.
The [TTL and propagation guide](/en/blog/ttl-and-dns-propagation/) explains the relevant cache lifetimes.

Keep the hostname and record type constant when comparing resolver answers.
Use the configured resolver and another resolver permitted by the network administrator.
The following addresses are documentation placeholders, not working DNS services:

```text
nslookup -type=A www.example.com. 192.0.2.53
nslookup -type=A www.example.com. 192.0.2.54
```

Replace both addresses with verified resolver addresses before running the comparison.
Microsoft documents the server address as [nslookup's second argument](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/nslookup#remarks).
A different answer identifies a difference between those two observations.
A different answer alone does not identify which answer is correct.

Use the following observations to choose the next action:

| Observation | Next action |
| --- | --- |
| The application works after one local flush | Record the change and stop resetting settings |
| The selected resolver still returns an old answer | Compare verified authoritative answers and cache timing |
| Only the browser fails | Inspect the browser's resolver settings and restart the browser |
| An internal name fails through a public resolver | Restore the approved internal DNS or VPN path |
| Every checked authoritative server lacks the intended name | Ask the domain operator to inspect publication and delegation |

Chrome can use Secure DNS, so an operating-system test may follow a different lookup path.
Google explains the setting in [Chrome's security guidance](https://support.google.com/chrome/answer/10468685?hl=en).
Google's [connection troubleshooting guide](https://support.google.com/chrome/answer/6098869?hl=en#zippy=%2Cstep-update-and-restart-chrome) also explains how to quit and reopen Chrome.
Deleting cookies or resetting all browser settings should not substitute for identifying the failing DNS path.

Public resolvers have their own cache controls.
For example, Google's [Public DNS flush tool](https://developers.google.com/speed/public-dns/cache) targets Google's service.
The tool does not clear every ISP or enterprise resolver.
Use provider-specific cache tools only after confirming the published record is correct.

A useful support report includes the exact hostname, record type, UTC timestamp, selected resolver, original error, and post-flush result.
Keep internal hostnames in an approved support channel.
The report gives an administrator enough context to investigate the remaining layer.

## These sources document the cache operations

- [Microsoft: ipconfig](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/ipconfig#parameters). Client-cache, DHCP, and registration operations. Fetched 2026-10-22.
- [Apple: Reset the DNS cache in OS X](https://support.apple.com/en-us/101481). Archived version-specific commands and restart guidance. Fetched 2026-10-22.
- [systemd: resolvectl](https://www.freedesktop.org/software/systemd/man/latest/resolvectl.html#flush-caches). Local systemd-resolved operations. Fetched 2026-10-22.
- [IETF: RFC 2308, Section 5](https://www.rfc-editor.org/rfc/rfc2308.html#section-5). Negative caching. Fetched 2026-10-22.
- [Microsoft: nslookup](https://learn.microsoft.com/en-us/windows-server/administration/windows-commands/nslookup#remarks). Explicit-server lookups. Fetched 2026-10-22.
- [Google: Manage Chrome safety and security](https://support.google.com/chrome/answer/10468685?hl=en). Secure DNS. Fetched 2026-10-22.
- [Google: Fix connection and loading errors](https://support.google.com/chrome/answer/6098869?hl=en). Browser restart steps. Fetched 2026-10-22.
- [Google Public DNS: Flush Cache](https://developers.google.com/speed/public-dns/cache). Provider-specific cache tool. Fetched 2026-10-22.
