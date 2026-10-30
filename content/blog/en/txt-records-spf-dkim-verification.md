---
title: What Is SPF? How Email Servers Check Who Can Send for Your Domain
description: Learn how Sender Policy Framework checks sending hosts, reads a TXT policy, and works with DKIM and DMARC to authenticate email.
date: '2026-10-21'
language: en
tags:
- domains
- dns
- guide
- security
authors:
- namefiteam
draft: false
format: guide
cluster: domain-basics
keywords:
- sender policy framework
- what is SPF
- SPF email authentication
- SPF TXT record
- SPF mail from
- SPF pass
- SPF fail
- SPF softfail
- SPF lookup limit
- multiple SPF records
- SPF DKIM DMARC
- email sender authorization
relatedArticles:
- /en/blog/set-up-email-with-your-own-domain/
- /en/blog/free-business-email-options/
- /en/blog/ttl-and-dns-propagation/
- /en/blog/dns-records-for-ai-agent-authority/
- /en/blog/dns-record-types-guide/
relatedGlossary:
- /en/glossary/dns-record-types/
- /en/glossary/dns/
- /en/glossary/zone-file/
- /en/glossary/ttl/
- /en/glossary/subdomain/
relatedTopics:
- /en/topics/domain-basics/
- /en/topics/domain-security/
relatedSeries:
- /en/series/domain-investor-field-guide/
- /en/series/domain-apocalypse/
ogImage: ../../assets/txt-records-spf-dkim-verification-og.jpg
updated: '2026-10-30'
---

Sender Policy Framework, or SPF, lets a domain publish which hosts may use the domain in specified SMTP identities. A receiving server checks the connecting sender against that policy. SPF covers [SMTP sending identities, rather than every visible message detail](#rfc-7208-defines-spf-identities-and-results).

SPF answers a narrow question: does this host have permission to send with this domain identity? SPF does not establish that the message is harmless, that a person approved the message, or that the visible display name is accurate.

Understanding that boundary makes SPF easier to configure. You need the right sending identity, a valid published policy, and a test message that follows the real sending path.

## SPF checks an SMTP identity against a connecting host

Email uses several identities during delivery. The address a recipient sees in the From field can differ from the domain used during the SMTP transaction. SPF examines the domain associated with **MAIL FROM** and can also check **HELO** under the protocol's rules. [RFC 7208 defines those identities](#rfc-7208-defines-spf-identities-and-results).

A hypothetical example helps separate the roles. A person sees `billing@example.com` in the message's From field. The sending service might use a separate return-path domain during SMTP delivery.

The SPF result applies to the identity that the receiver actually checked. An administrator should inspect the receiver's authentication results before deciding which DNS name needs attention. Changing the visible From domain's TXT record may not address the evaluated identity.

Treat an email provider's setup instructions as account-specific input. Ask which domain the provider uses for the return path and whether the provider supports a custom return-path domain. Keep that answer in the sending-service inventory.

## A TXT record publishes the sending policy

SPF publishes its policy in a DNS TXT record. [RFC 7208 requires TXT for SPF publication](#rfc-7208-defines-spf-identities-and-results). The text begins with `v=spf1` and contains mechanisms or modifiers that control evaluation.

Consider this hypothetical teaching example: `v=spf1 ip4:192.0.2.10 -all`. The [documentation address](#rfc-5737-reserves-ipv4-documentation-blocks) does not identify a real sender. Do not copy the example into production.

In that example, `ip4:192.0.2.10` identifies an authorized IPv4 address. The final `-all` expresses a fail result for hosts that do not match an earlier mechanism. The protocol evaluates the policy according to [RFC 7208's mechanism and qualifier rules](#rfc-7208-defines-spf-identities-and-results).

A hosted email service commonly supplies an `include:` value instead of asking customers to list its individual sending addresses. The include mechanism evaluates the referenced SPF policy. Use the exact include value from the provider's current account instructions.

Do not add `+all` to make a failing test pass. That policy authorizes every host through the all mechanism. Identify the missing legitimate sender and correct the policy deliberately.

![Each sending identity needs one valid SPF policy.](../../assets/txt-records-spf-dkim-verification-02-section.jpg)

## One sending identity needs one selected SPF record

A domain can publish several TXT records for unrelated purposes. A service-verification token and an SPF policy can coexist. The problem arises when an SPF check selects more than one SPF policy for the same name.

[RFC 7208 prohibits multiple records that cause that selection](#rfc-7208-defines-spf-identities-and-results). Adding a new provider's SPF string beside the old provider's SPF string does not safely combine authorization.

As practical administration advice, inventory every legitimate sending service before editing the policy. Include employee mail, transactional applications, support software, and newsletters when those services use the relevant domain identity.

Combine approved mechanisms into one policy according to the providers' instructions. Keep unrelated verification TXT records as separate records. Review the complete published name after saving.

Also distinguish one TXT record containing multiple quoted character strings from separate TXT records. RFC 7208 joins the strings within one record without adding spaces. A dashboard's line wrapping alone does not establish the actual DNS structure.

![Email records divide delivery from sender authentication.](../../assets/dns-record-types-guide-02-email-dependencies.jpg)

## SPF results explain authorization and processing failures

A result describes what the receiver learned during a particular check. [RFC 7208 defines the result meanings](#rfc-7208-defines-spf-identities-and-results).

| Result | What the result means | Useful next check |
| --- | --- | --- |
| Pass | The host has authorization for the checked identity | Inspect alignment and the rest of authentication |
| Fail | The host lacks authorization under the policy | Identify the actual sender and evaluated domain |
| Softfail | The policy gives a weaker negative statement | Review the intended policy and sender inventory |
| None | The check found no applicable SPF policy | Confirm the evaluated domain and published record |
| Temperror | A transient problem interrupted evaluation | Inspect DNS and retry through the normal mail path |
| Permerror | The receiver could not interpret the published policy correctly | Check syntax, record selection, and evaluation limits |

A pass does not promise inbox placement. A fail does not identify a single universal repair. The actual sending route and receiver's policy determine the operational next step.

Avoid changing enforcement merely to remove a red indicator. Save the evaluated identity, connecting address, result, and sending application before making the correction.

## The DNS lookup limit applies across the evaluation

SPF limits DNS-dependent evaluation work. RFC 7208 sets a limit of ten for the applicable mechanisms and modifiers during an evaluation. [Exceeding the limit produces permerror](#rfc-7208-defines-spf-identities-and-results).

The limit does not mean a policy may contain ten arbitrary words. Includes can trigger further evaluation. Count the effective dependency path rather than only the top-level strings visible in the DNS dashboard.

As maintenance advice, remove retired senders only after confirming that no legitimate workflow still depends on the sender. Keep provider change notices with the policy inventory. Do not replace managed includes with copied address lists without an explicit maintenance plan.

The [custom-domain email setup guide](/en/blog/set-up-email-with-your-own-domain/) explains where SPF fits alongside incoming delivery records.

## DMARC connects authentication to the visible From domain

SPF alone does not require the checked domain to match the visible From domain. DMARC uses the SPF-validated MAIL FROM identity, rather than a separate HELO pass. DMARC adds identifier alignment requirements. RFC 9989 explains [strict and relaxed SPF alignment](#rfc-9989-explains-spf-identifier-alignment).

Relaxed alignment allows the authenticated domain and visible From domain to share the same organizational domain. Strict alignment requires an exact domain match. A passing SPF result can therefore coexist with an alignment problem.

DKIM supplies a separate signature-based authentication path. Review SPF, DKIM, and DMARC together when configuring a real provider. Do not treat an [MX record](/en/blog/mx-records-guide/) as authorization for outgoing mail.

![SPF, DKIM, and DMARC address different parts of outgoing email authentication.](../../assets/set-up-email-with-your-own-domain-02-authentication.jpg)

## A real sending test should finish the configuration

Send a message from each legitimate application to an external mailbox you control. Inspect the received message's authentication results. Record the checked identity and outcome for each route.

Compare failures with the sender inventory before editing DNS. Test again after the corrected record becomes visible to the receiver. Keep the previous record and the reason for the change in your operating notes.

Use SPF to state who may send for the relevant SMTP identity. Use a real message test to verify that the intended sender receives the intended result.

## Sources and further reading

### RFC 7208 defines SPF identities and results

[RFC 7208 defines SPF identities and results](https://www.rfc-editor.org/rfc/rfc7208.html#section-2). Checked 2026-10-30.

### RFC 9989 explains SPF identifier alignment

[RFC 9989 explains SPF identifier alignment](https://www.rfc-editor.org/rfc/rfc9989.html#section-4.4.2). Checked 2026-10-30.

### RFC 5737 reserves IPv4 documentation blocks

[RFC 5737 reserves IPv4 documentation blocks](https://www.rfc-editor.org/rfc/rfc5737.html#:~:text=The%20blocks%20192.0.2.0%2F24%20%28TEST-NET-1%29%2C%20198.51.100.0%2F24%20%28TEST-NET-2%29%2C%0A%20%20%20and%20203.0.113.0%2F24%20%28TEST-NET-). Checked 2026-10-30.
