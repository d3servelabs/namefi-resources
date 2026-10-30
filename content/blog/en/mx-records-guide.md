---
title: What Is an MX Record? How Your Domain Tells Email Where to Go
description: Understand MX record priority, mail server targets, absent MX and null MX, and the checks that distinguish DNS routing from mailbox problems.
date: '2026-10-30'
language: en
authors:
- namefiteam
draft: false
format: guide
cluster: domain-basics
tags:
- domains
- guide
keywords:
- mail exchange record
- MX record
- DNS MX
- MX priority
- mail server DNS
- MX lookup
- null MX
- implicit MX
- email routing
- MX hostname
- domain email
- email DNS records
updated: '2026-10-30'
ogImage: ../../assets/mx-records-guide-og.jpg
relatedArticles:
- /en/blog/mx-record-check/
- /en/blog/set-up-email-with-your-own-domain/
- /en/blog/dns-record-types-guide/
- /en/blog/free-business-email-options/
- /en/blog/txt-records-spf-dkim-verification/
relatedGlossary:
- /en/glossary/dns-record-types/
- /en/glossary/dns/
- /en/glossary/nameserver/
- /en/glossary/zone-file/
- /en/glossary/ttl/
relatedTopics:
- /en/topics/domain-basics/
- /en/topics/domain-security/
relatedSeries:
- /en/series/tokenize-your-com/
- /en/series/domain-apocalypse/
---

An MX record tells sending mail servers where to deliver email for a domain. The record contains a preference number and a mail server hostname. Lower preference numbers take priority over higher numbers. [The SMTP standard defines that selection process](#rfc-5321-defines-mail-exchanger-selection).

For an address such as `person@example.com`, the sending system looks up mail routing for `example.com`. The MX record routes mail toward a receiving service. The MX record does not create `person` as a mailbox or determine every rule the receiving service applies.


Examples use [reserved example domains](#rfc-2606-reserves-example-domains).

## The MX value contains a preference and a hostname

Consider this hypothetical DNS configuration. The example describes syntax rather than a real email provider.

| Owner name | Type | Preference | Mail server hostname |
| --- | --- | --- | --- |
| `example.com` | MX | 10 | `mx1.example.net` |
| `example.com` | MX | 20 | `mx2.example.net` |

The first record has the lower preference number. Sending systems use the preference order when choosing among available mail exchangers. Equal-preference destinations can share delivery attempts under the SMTP selection rules. [RFC 5321 describes preference and equal-preference selection](#rfc-5321-defines-mail-exchanger-selection).

The MX destination is a hostname, rather than an IP address, email address, or web URL. The mail server hostname needs address records that identify a reachable SMTP destination. The standard excludes a CNAME response as the MX target's address lookup result. [The same section defines these target requirements](#rfc-5321-defines-mail-exchanger-selection).

If your DNS editor separates priority from value, enter each part in its field. Do not paste the number into the hostname field unless the editor explicitly expects the full record content.

## The email provider supplies the records you should publish

Open the setup instructions for the email service and account you actually use. Copy the complete required MX set, including every hostname and preference. Do not substitute a familiar provider's values because a tutorial uses those values.

As practical advice, check whether the DNS editor expects `@`, an empty name, or the full domain for the apex. Verify the saved record owner. A correct mail server at the wrong owner name does not route mail for the intended address domain.

Create the receiving domain and required mailbox in the email provider's administration interface. Publishing MX records alone cannot configure the provider's account. Keep the DNS and mailbox setup tasks in the same implementation record.

Do not add an extra provider merely as a backup without a designed mail-routing arrangement. A secondary MX target needs to know how to handle the domain's mail. A hostname listed in DNS does not create that relationship.

If the provider requires verification records or sender authentication records, complete those separate instructions too. Use the [email setup guide](/en/blog/set-up-email-with-your-own-domain/) for the wider account workflow.

![Email records divide delivery from sender authentication.](../../assets/dns-record-types-guide-02-email-dependencies.jpg)

## An absent MX answer differs from an explicit null MX

No MX record does not automatically announce that a domain accepts no email. SMTP defines an implicit MX fallback when the MX lookup returns an empty list. The sender can treat the domain's own address as the destination under the standard's rules. [RFC 5321 describes the fallback](#rfc-5321-defines-mail-exchanger-selection).

A null MX record explicitly announces that the domain accepts no mail. RFC 7505 defines a single MX record with preference zero and `.` as the exchange value. A domain publishing null MX must not also publish another MX record. [The null MX standard defines the complete signal](#rfc-7505-defines-an-explicit-no-mail-record).

These states need different interpretation:

| Observed result | Meaning to investigate |
| --- | --- |
| Ordinary MX answers | Use the listed mail exchangers according to SMTP rules |
| Successful lookup with no MX records | Check the implicit MX behavior and domain address data |
| Null MX | The domain explicitly announces no mail service |
| Timeout or server failure | The lookup did not establish the intended mail configuration |

Do not remove MX records to express a deliberate no-mail policy. Use the supported null MX mechanism when that policy fits the domain and review the related email configuration. Conversely, do not leave null MX in place for a domain that should receive mail.

![An MX answer, an absent MX answer, and null MX describe different mail-routing situations.](../../assets/dns-record-types-guide-06-mx-results.jpg)

## A lookup verifies publication rather than mailbox delivery

The [Google Admin Toolbox Dig tool](https://toolbox.googleapps.com/apps/dig/) provides a browser DNS lookup. Enter the domain and select MX. [Google documents the basic lookup workflow](#google-provides-a-browser-dns-tool). This article does not execute a query or report the state of your domain.

Read the full answer. Check the owner name, preferences, and target hostnames against the email provider's instructions. If you use a command-line tool, the general `dig example.com MX` form asks for the MX record set.

When a recent change appears inconsistent, compare authoritative data with the resolver returning the old record. Cached DNS can delay visibility for some clients. [The TTL specification explains cache reuse](#rfc-1034-defines-cache-timing), and the [propagation guide](/en/blog/ttl-and-dns-propagation/) gives a diagnostic sequence.

After the DNS answer matches, send a message from an outside account to the intended mailbox. Confirm receipt and inspect any bounce message. A published MX answer establishes a routing instruction, rather than successful acceptance by a particular mailbox.

![A controlled change preserves records and tests dependencies.](../../assets/dns-record-types-guide-04-change-verification.jpg)

## Email failures need checks beyond the MX record

If the answer points to an old provider, compare the active zone with the intended migration plan. If the answer points to the right provider, check domain verification, mailbox existence, provider routing, and the exact delivery error.

If mail stopped after a nameserver change, compare the replacement zone with the old zone inventory. Restore the required mail records at the active DNS provider. Editing an inactive DNS zone will not repair the public answer.

Keep receiving routes separate from sending authentication. MX directs inbound delivery. SPF, DKIM, and DMARC have different jobs. The [DNS record types guide](/en/blog/dns-record-types-guide/) helps locate those separate settings.

The next action is to compare the complete public MX answer with the email provider's current instructions. Correct a demonstrated mismatch, verify the receiving account, and run an outside delivery test. Save the result with the exact hostname and time so that further troubleshooting starts from evidence.

## Sources and further reading

### RFC 5321 defines mail exchanger selection

[RFC 5321 defines mail exchanger selection](https://www.rfc-editor.org/rfc/rfc5321.html#section-5.1). Checked 2026-10-30.

### RFC 7505 defines an explicit no-mail record

[RFC 7505 defines an explicit no-mail record](https://www.rfc-editor.org/rfc/rfc7505.html#section-3). Checked 2026-10-30.

### Google provides a browser DNS tool

[Google provides a browser DNS tool](https://toolbox.googleapps.com/apps/dig/). Checked 2026-10-30.

### RFC 1034 defines cache timing

[RFC 1034 defines cache timing](https://www.rfc-editor.org/rfc/rfc1034.html#section-3.6). Checked 2026-10-30.

### RFC 2606 reserves example domains

[RFC 2606 reserves example domains](https://www.rfc-editor.org/rfc/rfc2606.html#section-3). Checked 2026-10-30.
