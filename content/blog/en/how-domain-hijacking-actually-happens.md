---
title: 'How Domain Hijacking Actually Happens: Five Attack Paths and Controls That Reduce the Risk'
date: '2026-05-10'
language: en
tags: ['security', 'domains', 'registrar', 'incident-response', 'domain-flipping']
authors: ['namefiteam']
draft: false
cluster: domain-security
series: domain-apocalypse
seriesOrder: 1
format: case-study
description: A practical walk-through of five ways attackers take over domains in the real world—social engineering, registrar account compromise, DNS provider takeover, NS hijacks, and expired-domain reclamation—and controls that prevent, limit, or detect them.
ogImage: ../../assets/how-domain-hijacking-actually-happens-og.jpg
keywords: ['domain hijacking', 'domain security', 'registrar lock', 'transfer lock', 'dnssec', 'two factor authentication', 'social engineering', 'dangling dns', 'namefi']
relatedArticles:
  - /en/blog/the-fox-it-dns-hijack/
  - /en/blog/the-godaddy-multi-year-breach/
  - /en/blog/the-badgerdao-frontend-attack/
  - /en/blog/the-lenovo-com-dns-hijack/
  - /en/blog/the-perl-com-domain-theft/
relatedTopics:
  - /en/topics/domain-security/
  - /en/topics/domain-basics/
relatedSeries:
  - /en/series/domain-apocalypse/
  - /en/series/name-change-game-change/
relatedGlossary:
  - /en/glossary/registrar/
  - /en/glossary/dns/
  - /en/glossary/icann/
  - /en/glossary/tld/
  - /en/glossary/registry/
---

"[Domain hijacking](/en/glossary/domain-hijacking/)" is one of those phrases that sounds dramatic but means very different things depending on how it happens. A [registrar](/en/glossary/registrar/) account taken over by a [phishing](/en/glossary/phishing/) email is a hijack. A [nameserver](/en/glossary/nameserver/) record quietly swapped at a [DNS](/en/glossary/dns/) provider is a hijack. An expired domain that someone else grabs and re-points is, in a sense, also a hijack.

In every case, the result is the same: someone else is now telling the world where your name points. Email, payments, login flows, and SaaS integrations all start sending traffic to the attacker. Recovery often takes days, sometimes weeks. If the domain was transferred to another registrar, [ICANN](/en/glossary/icann/)'s [Transfer Dispute Resolution Policy (TDRP)](https://www.icann.org/en/contracted-parties/consensus-policies/uniform-domain-name-dispute-resolution-policy/domain-name-dispute-resolution-policies-25-02-2012-en#:~:text=The%20Transfer%20Dispute%20Resolution%20Policy%20(TDRP)%20applies%20to%20transactions%20in%20which%20a%20domain%2Dname%20holder%20transfers%20or%20attempts%20to%20transfer%20a%20domain%20name%20to%20a%20new%20registrar.) may be relevant; other cases often require registrar escalation, [registry](/en/glossary/registry/) escalation, platform recovery, or a court order. The fastest fix is to never get into that position in the first place.

This post walks through five recurring attack paths, what each one looks like from the defender's side, and controls that can prevent, limit, or detect them.

## 1. Social engineering against the registrar's support team

Many high-profile hijacks have not required a technical exploit. They have relied on a phone call or support request.

The pattern: an attacker collects enough information about a target—[WHOIS](/en/glossary/whois/) history, LinkedIn, leaked password dumps, social media—and then calls or emails the registrar's support team impersonating the owner. They ask for a password reset, an email change, or a transfer [auth code](/en/glossary/auth-code/). If the support agent runs a checklist that the attacker has prepared for, the account changes hands.

This path does not require a vulnerability in the registrar's code; it exploits the human in the loop.

**What stops it:**

- **A hard registrar-side rule** that ownership changes require either a notarized document or a multi-factor challenge against the [registrant](/en/glossary/registrant/)'s existing channel.
- **[Registry lock](/en/glossary/registry-lock/)** (separate from registrar lock), where the registry operator itself refuses to act on transfer or contact changes without an out-of-band confirmation. Available on `.com`, `.net`, and many ccTLDs.
- **Verifying which registrar you actually use** and removing the others. Brands that started in 2007 often have stale accounts at three or four registrars with weak credentials.

## 2. Registrar account compromise (the credential path)

The technical cousin of social engineering. The attacker phishes the registrar account credentials, or finds them in a credential-stuffing dump, and logs in directly. From there they unlock the domain, change the contact email, and request a transfer.

**What stops it:**

- **Phishing-resistant 2FA on the registrar account.** TOTP via an authenticator app is stronger than password-only access; hardware keys using WebAuthn/FIDO2 are the strongest widely available option. SMS-based 2FA remains vulnerable to SIM swapping. The U.S. government's [CISA guidance](https://www.cisa.gov/secure-our-world/turn-mfa) recommends phishing-resistant MFA where available.
- **A registrar that supports per-domain locks** in addition to per-account locks, so a single account compromise cannot unlock everything at once.
- **Audit trail and alerting** on contact changes, nameserver changes, and transfer requests. The attacker's first move is to silence those alerts; if they fire to a channel the attacker does not control, you get warning time.

## 3. DNS provider takeover

Even if the registrar account is locked down, the *name servers* that the registrar publishes might point to a DNS provider with a separate account—Cloudflare, Route 53, NS1, DNSimple, your own BIND server. If the attacker gets into that DNS account, they do not need to touch the registrar. They just rewrite the A, MX, and TXT records and traffic follows.

This is often the easier path for attackers, because brands invest in registrar security but treat the DNS provider as "infrastructure" with weaker controls.

**What stops it:**

- **The same 2FA rigor on the DNS provider account as on the registrar.** Treat it as equally sensitive. It is.
- **[DNSSEC](/en/glossary/dnssec/)**, signed at the zone level. DNSSEC does not prevent a DNS provider account compromise: if an attacker can publish records through the provider and the provider signs them with the zone's active keys, validating resolvers will treat those answers as authentic. What DNSSEC does block is in-path tampering, cache poisoning, and forged answers that are unsigned or wrongly signed, assuming the parent publishes the correct DS records. See [RFC 4033-4035](https://datatracker.ietf.org/doc/html/rfc4033) for the protocol details.
- **Multi-provider DNS** with separate accounts and credentials, using [multi-signer DNSSEC](https://www.rfc-editor.org/rfc/rfc8901#:~:text=The%20central%20requirement%20for%20both%20of%20the%20multiple%2Dsigner%20models%20is%20to%20ensure%20that%20the%20ZSKs%20from%20all%20providers%20are%20present%20in%20each%20provider's%20apex%20DNSKEY%20RRset.). This helps with availability and provider isolation, but it only works if every provider serves the intended zone data and the DNSKEY/DS sets are coordinated correctly. It is not a magic override where resolvers automatically prefer the uncompromised provider.

## 4. Nameserver hijacks via stale delegations and dangling records

A subtler variant: the domain itself is fine, but a *[subdomain](/en/glossary/subdomain/)* points (via CNAME or NS record) at a third-party service that the original owner no longer controls. The attacker registers the resource on the third-party side and now answers for the subdomain.

Examples:

- A subdomain CNAMEd to an old Heroku, S3, or Azure asset that has been released. The attacker re-claims that asset name and gets a valid TLS cert.
- A delegated `NS` record pointing at a DNS provider account that has been deleted. The attacker creates a fresh account using that exact host pattern and serves whatever records they want for the subdomain.

These are catalogued under the umbrella term **dangling DNS**. The risk grows with large, poorly inventoried subdomain estates because abandoned third-party mappings can remain live after the underlying resource is removed.

**What stops it:**

- **A complete inventory of every NS, CNAME, and ALIAS record** in every zone you own, with an owner for each.
- **Automated dangling-DNS scanners** that re-resolve every record on a schedule and flag the ones pointing at third-party services that no longer respond. [GitHub's blog](https://github.blog/2021-12-13-securing-our-home-labs-frigate-version-bump/) and [Detectify Labs](https://labs.detectify.com/2014/10/21/hostile-subdomain-takeover-using-herokugithubdesk-more/) have long-running write-ups of this attack class.
- **Decommissioning records the same day** you decommission the underlying service.

## 5. Expired-domain reclamation

The simplest and least sympathetic attack: the registrant forgot to renew. The [grace period](/en/glossary/grace-period/) passes. The domain drops back into the pool. Someone else registers it.

This sounds like an operational failure, not a security incident, but the impact is identical—someone else now controls the name, and all of the trust signals that were built up over years (SPF, DKIM, OAuth callbacks, password reset emails, payment integrations) start flowing to a stranger. Several public incidents involved attackers buying [expired domains](/en/blog/expired-domains-and-the-drop-cycle/) specifically because the previous owner had registered them as the `iss` claim in OAuth tokens or as the sender for transactional email.

**What stops it:**

- **Multi-year renewal** (5-10 years) on any domain that touches authentication, payments, or production traffic. The cost is trivial; the protection is significant.
- **Auto-renewal with monitored payment and failure alerts.** Cards expire and payment attempts fail, so auto-renewal is only effective when a team watches the failure channel.
- **Calendar reminders** at 90, 60, 30, and 7 days that fire to a *team* address, not the inbox of one person who might leave the company.

## What good looks like

Pulling the controls together, the baseline for any domain that matters looks like this:

| Control                                | Primary mitigation or detection role                              |
| -------------------------------------- | ----------------------------------------------------------------- |
| Hardware-key 2FA on registrar          | Reduces registrar account compromise risk (path 2)                |
| Hardware-key 2FA on DNS provider       | Reduces DNS-provider account compromise risk (path 3)             |
| Registry lock (where available)        | Adds out-of-band approval for covered registry changes (paths 1-2) |
| DNSSEC signed at the zone              | Rejects in-path tampering and forged DNS answers                  |
| Subdomain inventory + dangling scanner | Detects and prevents abandoned subdomain mappings (path 4)        |
| 5-10 year renewal + auto-renew         | Reduces accidental expiry risk (path 5)                           |
| Alerts on contact/NS/transfer changes  | Detects some registrar and delegation changes (paths 1-3)         |

Not every control is available for every TLD or provider. The goal is to document which controls apply, identify uncovered paths, and add compensating monitoring rather than treating the table as a universal guarantee.

## How Namefi changes the picture

Most of the controls above exist as features at one registrar, one DNS provider, or one workflow tool, and security depends on the weakest relevant account. Namefi adds an [on-chain](/en/glossary/on-chain/) token as a parallel control layer for a traditional DNS registration. As [the two-layer model explains](/en/blog/dns-on-tokenized-domains/), the NFT can become the control point for supported ownership and transfer actions while the registrar and registry layers continue to operate the DNS name.

That can reduce exposure to registrar-dashboard credential theft or support-driven changes when the workflow actually requires wallet authorization. It does not make social engineering impossible or remove path 1 entirely: the domain still depends on registrar and registry processes, the wallet introduces its own key-management and recovery risks, and DNS-provider accounts remain separate attack surfaces. DNSSEC, renewal controls, account security, and incident recovery are still required.

## Sources and further reading

- ICANN — [Transfer Dispute Resolution Policy scope](https://www.icann.org/en/contracted-parties/consensus-policies/uniform-domain-name-dispute-resolution-policy/domain-name-dispute-resolution-policies-25-02-2012-en#:~:text=The%20Transfer%20Dispute%20Resolution%20Policy%20(TDRP)%20applies%20to%20transactions%20in%20which%20a%20domain%2Dname%20holder%20transfers%20or%20attempts%20to%20transfer%20a%20domain%20name%20to%20a%20new%20registrar.).
- IETF — [DNSSEC RFCs 4033/4034/4035](https://datatracker.ietf.org/doc/html/rfc4033) and [multi-signer DNSSEC RFC 8901](https://www.rfc-editor.org/rfc/rfc8901#:~:text=The%20central%20requirement%20for%20both%20of%20the%20multiple%2Dsigner%20models%20is%20to%20ensure%20that%20the%20ZSKs%20from%20all%20providers%20are%20present%20in%20each%20provider's%20apex%20DNSKEY%20RRset.).
- CISA — [Multi-factor authentication guidance](https://www.cisa.gov/secure-our-world/turn-mfa).
- Detectify Labs — [Hostile subdomain takeover write-up](https://labs.detectify.com/2014/10/21/hostile-subdomain-takeover-using-herokugithubdesk-more/).
- Verisign — [Registry lock for .com/.net](https://www.verisign.com/en_US/channel-resources/domain-registry-products/registry-lock/index.xhtml).
