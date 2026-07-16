---
title: 'The Panix.com Domain Hijack: A Fraudulent Transfer of New York''s Oldest ISP'
date: '2026-06-17'
language: en
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['fenwei-bian']
editors: ['victor-zhou']
draft: false
cluster: domain-security
series: domain-apocalypse
seriesOrder: 18
format: case-study
description: 'In January 2005, panix.com — the domain of New York''s oldest commercial ISP — was fraudulently transferred through a reseller account opened with stolen credit-card details. ICANN''s review found a failure to obtain express authorization, not a flaw introduced by the then-new transfer policy.'
keywords: ['panix.com', 'panix domain hijack', 'domain hijacking', 'inter-registrar transfer', 'Melbourne IT', 'Dotster', 'Fibranet', 'ICANN transfer policy', 'registrar lock', 'clientTransferProhibited', 'domain security', 'DNS hijacking', 'EPP auth code']
relatedArticles:
  - /en/blog/the-lenovo-com-dns-hijack/
  - /en/blog/the-perl-com-domain-theft/
  - /en/blog/the-fox-it-dns-hijack/
  - /en/blog/the-sex-com-heist-the-forged-letter/
  - /en/blog/the-syrian-electronic-army-nyt-hijack/
relatedTopics:
  - /en/topics/domain-security/
  - /en/topics/domain-basics/
relatedSeries:
  - /en/series/domain-apocalypse/
  - /en/series/name-change-game-change/
relatedGlossary:
  - /en/glossary/registrar/
  - /en/glossary/icann/
  - /en/glossary/dns/
  - /en/glossary/tld/
  - /en/glossary/registry/
---

For more than fifteen years, one of the oldest commercial internet providers in the United States lived at a single address: **panix.com**. Then, over a long holiday weekend in January 2005, someone took it.

Not by hacking a server. An unauthorized transfer request was submitted through a reseller account opened with stolen credit-card details. Panix did not receive notice before the domain moved, but its losing registrar, Dotster, did receive a registry notification and took no action during the five-day transfer window.

This is the story of how failed identity verification and registrar handling, not a server exploit, hijacked New York's oldest ISP — and why the incident became an important transfer-security case study.

## A pioneering ISP whose whole business lived at one domain

Panix — Public Access Networks Corporation — was not a small story. Founded in 1989, it was, by Wikipedia's account, the [third-oldest ISP in the world after The World and NetCom](https://en.wikipedia.org/wiki/Panix_(ISP)#:~:text=third%2Doldest%20ISP%20in%20the%20world%20after%20The%20World%20and%20NetCom). It was a fixture of the early commercial internet in New York City: shell accounts, email, web hosting, the dial-up and then broadband connections that thousands of New Yorkers used to get online.

And like almost every internet business then and now, Panix's identity *was* its domain. Customer mailboxes ended in `@panix.com`. The web servers answered to `www.panix.com`. The whole company — its brand, its reachability, the thing that made a customer's email actually arrive — hung on the DNS records attached to one name. Lose control of that name, and you do not lose a marketing asset. You lose the business's nervous system.

That is exactly what happened.

## January 2005: the fraudulent transfer

The legal account is precise about the day. As the law firm Davis Wright Tremaine summarized it at the time, [on Friday, Jan. 14, 2005, a high-profile hijacking occurred when the domain name "panix.com," owned by the New York-based Internet service provider of the same name, was transferred without authorization to a third party](https://www.dwt.com/insights/2005/01/guarding-against-domain-name-hijacking#:~:text=On%20Friday%2C%20Jan.%2014%2C%202005%2C%20a%20high%2Dprofile%20hijacking%20occurred).

By the small hours of that weekend, the consequences were live. The Register, reporting as the incident unfolded, described the redirection in one sentence that still reads like a heist diagram: [the ownership of panix.com was moved to a company in Australia, the actual DNS records were moved to a company in the United Kingdom, and Panix.com's mail has been redirected to yet another company in Canada](https://www.theregister.com/2005/01/17/panix_domain_hijack/#:~:text=The%20ownership%20of%20panix.com%20was%20moved%20to%20a%20company%20in%20Australia).

Slashdot, where the news broke to the wider technical community on January 16, put it bluntly: [Panix, the oldest commercial Internet provider in New York, had its domain name 'panix.com' hijacked by persons unknown](https://it.slashdot.org/story/05/01/16/0027213/new-yorks-oldest-isp-gets-domain-jacked).

Panix said at the time that neither it nor its registrar had received notice. ICANN's later formal timeline clarified the boundary: Panix did not receive notice, while Dotster received registry notification on January 9 and did not act before the transfer auto-approved five days later. The incident was invisible to the rightful owner, but not to every organization in the transfer path.

## The disruption: web and email down for days

![Vivid colorful concept art of a house deed being quietly re-registered to a stranger overseas while the rightful owner sleeps, a glowing paper title sliding across an ocean toward a foreign desk stamped at midnight](../../assets/the-panix-com-domain-hijack-01-hijack.jpg)

A hijacked domain is not a clean on/off switch — it is a slow, ugly fade, and the worst damage is the mail.

When you control a domain's DNS, you can redirect where its email is delivered. Here, the post-incident SSAC report found that Fibranet suspected payment fraud, locked and parked the domain, and the default configuration routed email to Fibranet's U.K. mail server. Panix customers lost email access for about two days, but Panix reported no evidence that the misdirected mail was read or otherwise misused, and the attacker could not continue changing DNS after the account was locked.

Mail that is misrouted during a hijack may be delayed, bounced, dropped, or exposed to an unintended system. In this case the documented impact was loss of email service and messages, not confirmed attacker access to message contents.

And there was nothing the customers could do. The problem was not on Panix's machines, which were running fine. The unauthorized registrar transfer enabled the attacker-controlled account to change the domain's delegation and [DNS](/en/glossary/dns/) data, sending web and mail traffic to different systems. DNS published where `panix.com` should resolve; it did not itself say who legally owned the registration.

## How it happened: authorization and process failures

![Vivid colorful concept art of a giant rubber stamp slamming APPROVED onto a transfer form for a glowing domain key, with no ID check, no signature, no guard at the desk — a clock in the background showing five days ticking down](../../assets/the-panix-com-domain-hijack-02-transfer-loophole.jpg)

Here is the part that makes Panix a landmark case rather than just another bad weekend: nobody broke into Panix's servers. The gaining registrar and reseller failed to establish that the requester was authorized to transfer the domain.

The mechanics ran through a chain of intermediaries. Panix's domain was registered with **Dotster**, a registrar in Vancouver, Washington. The fraudulent transfer was initiated through an account at **Fibranet Services Ltd.**, a U.K.-based [reseller](/en/glossary/reseller/), which submitted it up to **Melbourne IT**, a large registrar in Australia. As InfoWorld reported, [an error by Melbourne IT Ltd. allowed fraudsters using stolen credit cards to take control of Panix.com](https://www.infoworld.com/article/2211412/australian-company-takes-blame-for-panix-domain-hijack.html) — the account used for the transfer was [fraudulent and set up with stolen credit cards](https://www.infoworld.com/article/2211412/australian-company-takes-blame-for-panix-domain-hijack.html).

The transfer policy did include auto-approval after five days if the losing registrar did not deny the request. But ICANN's formal review concluded that the recently changed Transfer Policy did **not** cause this incident: the same abuse could have succeeded under the old or new policy. The decisive failure was that Melbourne IT and Fibranet did not obtain the registrant's express authorization before initiating the transfer.

Stack the failures and the picture is grim. The *gaining* registrar, through its reseller, accepted a fraudulent request and failed to verify authorization. The *losing* registrar received the registry notice but did not intervene. Panix itself did not receive a notice that would have let it raise the alarm. The five-day timer completed the transfer, but it was not a substitute for the authorization that should have been verified before the request entered the process.

## Recovery, and the policy reforms it triggered

Recovery, once humans got involved, was fast — and that is its own indictment, because it proved the transfer never should have been approved in the first place.

By Sunday, [Panix had recovered its Panix.com domain from Australian domain hosting / registration firm Melbourne IT, where the purloined domain was parked](https://www.theregister.com/2005/01/17/panix_domain_hijack/#:~:text=Panix%20had%20recovered%20its%20Panix.com%20domain), and pointed it back to its natural home at Dotster. The registration and `.com` delegation data could be corrected quickly; the global cleanup was not instant, because cached DNS answers had to expire before every resolver saw the restored data. A contemporaneous Register report called the updated systems "root servers," but `panix.com` is a second-level name: the DNS root delegates `.com`, while the `.com` authoritative layer publishes the delegation for `panix.com`.

Melbourne IT, to its credit, did not hide. Two days later The Register reported that [an Australian domain registrar has admitted to its part in last weekend's domain name hijack](https://www.theregister.com/2005/01/19/panix_hijack_more/#:~:text=An%20Australian%20domain%20registrar%20has%20admitted%20to%20its%20part), tracing the failure to a verification step in its transfer process that had not been performed and pledging that the loophole that allowed the error had been closed.

Panix became a textbook example in the broader discussion of transfer security. ICANN's Security and Stability Advisory Committee published a 2005 report, [*Domain Name Hijacking: Incidents, Threats, Risks, and Remedial Actions*](https://itp.cdn.icann.org/en/files/security-and-stability-advisory-committee-ssac-reports/hijacking-report-12-07-2005-en.pdf), examining failures such as registrars accepting transfers without confirming that the requester was actually the [registrant](/en/glossary/registrant/). Several important controls already existed or were already being deployed rather than being invented by this incident:

- **Registrar locks.** A domain set to `clientTransferProhibited` refuses an inter-registrar transfer until the lock is removed. Registrar-lock mechanisms predated Panix, and many registrars already used them by default; Panix highlighted the cost of leaving a valuable name transferable.
- **[Auth codes](/en/glossary/auth-code/) (EPP transfer codes).** AuthInfo already existed in EPP for other gTLDs, and Verisign's `.com` and `.net` EPP deployment was being prepared before the attack. Wider use strengthened proof that a transfer requester possessed a registrar-issued secret.
- **Operational escalation and verification.** The SSAC report emphasized express authorization, reliable notices, emergency contacts, and rapid restoration procedures across registrars and registries.

The Panix hijack did not create those mechanisms or rewrite transfer policy by itself. It became a vivid case for enforcing and operationalizing controls that policy already expected.

## What this teaches about transfer locks and verification

Strip away the dates and the registrar names, and Panix leaves a few durable lessons.

1. **Express authorization must be verified before a transfer starts.** The five-day losing-registrar window is not permission for the gaining registrar or reseller to skip identity checks. ICANN concluded that failure, not the new policy itself, enabled Panix.
2. **Every party in the transfer chain has a security role.** The gaining side must authenticate the requester; the losing registrar must act on registry notices; and the registrant needs a reachable, monitored contact path. One party's silence should not erase another party's verification duty.
3. **Use transfer locks as one layer.** `clientTransferProhibited` can block ordinary inter-registrar transfer requests until the status is removed, but it is not an absolute guarantee against registrar error, account compromise, policy processes, court orders, or unauthorized lock removal. Availability and pricing depend on the registrar. Use the lock for important names and pair it with strong account security, monitored contacts, and escalation procedures.
4. **Treat domain control as critical infrastructure.** Panix's servers were never compromised, yet changing the registration and delegation disrupted web and email service. Protect registrar access, registry-facing workflows, DNS configuration, mail, and servers as separate layers rather than assuming server security alone protects reachability.
5. **Watch notices, but do not rely on them alone.** Panix did not receive notice, while Dotster did and did not act. Maintain monitored contacts and escalation paths, and pair them with transfer locks and strong requester verification.

## The Namefi angle

![Colorful illustration of auditable on-chain token control — a domain card secured by a green shield, a green Namefi token, and DNS continuity](../../assets/the-panix-com-domain-hijack-03-namefi-angle.jpg)

The Panix hijack is, at its heart, an authorization failure. A reseller and gaining registrar accepted a fraudulent request without obtaining the registrant's express approval, and the losing registrar did not stop it after receiving notice.

[Namefi](https://namefi.io) provides an on-chain token-control and transfer layer for supported domains. That can make token custody and token-transfer authorization auditable, but the token is not an unconditional legal title or a replacement for registrar and registry records. It does not, by itself, prevent a conventional registrar or registry from processing an unauthorized transfer of the underlying DNS domain, so registrar locks, verified contacts, and emergency restoration procedures remain essential.

The lesson is narrower and stronger than a claim that one technology fixes transfer policy: high-value domains benefit from independently auditable token state **and** correctly enforced controls at every operational layer that can move or repoint the name.

## Sources and further reading

- ICANN — [Formal review of the Panix transfer incident](https://www.icann.org/fr/correspondence/documents/email-from-tim-cole-to-bruce-tonkin-14-03-2005-en)
- The Register — [Panix recovers from domain hijack](https://www.theregister.com/2005/01/17/panix_domain_hijack/)
- The Register — [Panix.com hijack: Aussie firm shoulders blame](https://www.theregister.com/2005/01/19/panix_hijack_more/)
- Davis Wright Tremaine — [Guarding Against Domain Name Hijacking](https://www.dwt.com/insights/2005/01/guarding-against-domain-name-hijacking)
- InfoWorld — [Australian company takes blame for Panix domain hijack](https://www.infoworld.com/article/2211412/australian-company-takes-blame-for-panix-domain-hijack.html)
- Slashdot — [New York's Oldest ISP Gets Domain-Jacked](https://it.slashdot.org/story/05/01/16/0027213/new-yorks-oldest-isp-gets-domain-jacked)
- Wikipedia — [Panix (ISP)](https://en.wikipedia.org/wiki/Panix_(ISP))
- Wikipedia — [Domain hijacking](https://en.wikipedia.org/wiki/Domain_hijacking)
- ICANN SSAC — [Domain Name Hijacking: Incidents, Threats, Risks, and Remedial Actions (2005)](https://itp.cdn.icann.org/en/files/security-and-stability-advisory-committee-ssac-reports/hijacking-report-12-07-2005-en.pdf)
- ICANN — [Transfer Policy](https://www.icann.org/en/contracted-parties/accredited-registrars/resources/domain-name-transfers/policy)
- NANOG mailing list archive — [discussion of the panix.com transfer and ICANN remedies](https://diswww.mit.edu/charon/nanog/77162)
