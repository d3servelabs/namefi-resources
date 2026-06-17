---
title: 'The Panix.com Domain Hijack: How a Five-Day Auto-Approval Rule Stole New York''s Oldest ISP'
date: '2026-06-17'
language: en
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: 'In January 2005, panix.com — the domain of New York''s oldest commercial ISP — was fraudulently transferred to a registrar in Australia using stolen credit cards, knocking web and email offline for days. The auto-approve inter-registrar transfer rules of the era made it possible, and the cleanup reshaped domain-transfer policy.'
keywords: ['panix.com', 'panix domain hijack', 'domain hijacking', 'inter-registrar transfer', 'Melbourne IT', 'Dotster', 'Fibranet', 'ICANN transfer policy', 'registrar lock', 'clientTransferProhibited', 'domain security', 'DNS hijacking', 'EPP auth code']
---

For more than fifteen years, one of the oldest commercial internet providers in the United States lived at a single address: **panix.com**. Then, over a long holiday weekend in January 2005, someone took it.

Not by hacking a server. Not by guessing a password. They filled out a transfer form, paid with a stolen credit card, and waited for a brand-new ICANN rule to do the rest. Within hours the ownership of panix.com had been moved to a company in Australia, its DNS pointed at a host in the United Kingdom, and its email rerouted through Canada — all while the people who actually ran Panix slept through a Saturday night, having received no warning at all.

This is the story of how a piece of administrative paperwork, not an exploit, hijacked New York's oldest ISP — and how the cleanup helped rewrite the rules that govern who is allowed to move a domain.

## A pioneering ISP whose whole business lived at one domain

Panix — Public Access Networks Corporation — was not a small story. Founded in 1989, it was, by Wikipedia's account, the [third-oldest ISP in the world after The World and NetCom](https://en.wikipedia.org/wiki/Panix_(ISP)#:~:text=third%2Doldest%20ISP%20in%20the%20world%20after%20The%20World%20and%20NetCom). It was a fixture of the early commercial internet in New York City: shell accounts, email, web hosting, the dial-up and then broadband connections that thousands of New Yorkers used to get online.

And like almost every internet business then and now, Panix's identity *was* its domain. Customer mailboxes ended in `@panix.com`. The web servers answered to `www.panix.com`. The whole company — its brand, its reachability, the thing that made a customer's email actually arrive — hung on the DNS records attached to one name. Lose control of that name, and you do not lose a marketing asset. You lose the business's nervous system.

That is exactly what happened.

## January 2005: the fraudulent transfer

The legal account is precise about the day. As the law firm Davis Wright Tremaine summarized it at the time, [on Friday, Jan. 14, 2005, a high-profile hijacking occurred when the domain name "panix.com," owned by the New York-based Internet service provider of the same name, was transferred without authorization to a third party](https://www.dwt.com/insights/2005/01/guarding-against-domain-name-hijacking#:~:text=On%20Friday%2C%20Jan.%2014%2C%202005%2C%20a%20high%2Dprofile%20hijacking%20occurred).

By the small hours of that weekend, the consequences were live. The Register, reporting as the incident unfolded, described the redirection in one sentence that still reads like a heist diagram: [the ownership of panix.com was moved to a company in Australia, the actual DNS records were moved to a company in the United Kingdom, and Panix.com's mail has been redirected to yet another company in Canada](https://www.theregister.com/2005/01/17/panix_domain_hijack/#:~:text=The%20ownership%20of%20panix.com%20was%20moved%20to%20a%20company%20in%20Australia).

Slashdot, where the news broke to the wider technical community on January 16, put it bluntly: [Panix, the oldest commercial Internet provider in New York, had its domain name 'panix.com' hijacked by persons unknown](https://it.slashdot.org/story/05/01/16/0027213/new-yorks-oldest-isp-gets-domain-jacked).

The most damning detail, from Panix's point of view, was the silence. The company [established in 1989 and New York's oldest commercial ISPs, said neither it nor its registrar received any notification of the proposed changes](https://www.theregister.com/2005/01/17/panix_domain_hijack/#:~:text=neither%20it%20nor%20its%20registrar%20received%20any%20notification%20of%20the%20proposed%20changes). The transfer that took the domain away was, as far as the rightful owner could tell, completely invisible until it had already happened.

## The disruption: web and email down for days

![Vivid colorful concept art of a house deed being quietly re-registered to a stranger overseas while the rightful owner sleeps, a glowing paper title sliding across an ocean toward a foreign desk stamped at midnight](../../assets/the-panix-com-domain-hijack-01-hijack.jpg)

A hijacked domain is not a clean on/off switch — it is a slow, ugly fade, and the worst damage is the mail.

When you control a domain's DNS, you control where its email is delivered. By repointing panix.com's mail records, the hijackers turned themselves into the post office for an entire ISP's customer base. Inbound messages — bills, password resets, business correspondence, personal mail — stopped arriving at Panix and started flowing toward a server the attackers controlled. InfoWorld, reporting after the dust settled, noted that the hijacking [deprived some Panix customers of e-mail access for two days](https://www.infoworld.com/article/2211412/australian-company-takes-blame-for-panix-domain-hijack.html), and that some of those customers may have lost a hundred or more messages over the weekend.

Mail that is misrouted during a hijack is not merely delayed. Much of it is gone — bounced, dropped, or silently swallowed by a server that was never supposed to receive it. For a provider whose customers measured the value of the service in "did my email arrive," days of misrouted mail was close to the worst possible outage.

And there was nothing the customers could do. The problem was not on Panix's machines, which were running fine. It was in the global routing table of the Domain Name System, which had been told — by a registrar in Australia, acting on a fraudulent request — that panix.com now belonged to someone else.

## How it happened: the auto-approve transfer loophole

![Vivid colorful concept art of a giant rubber stamp slamming APPROVED onto a transfer form for a glowing domain key, with no ID check, no signature, no guard at the desk — a clock in the background showing five days ticking down](../../assets/the-panix-com-domain-hijack-02-transfer-loophole.jpg)

Here is the part that makes Panix a landmark case rather than just another bad weekend: nobody broke in. The system worked exactly as designed. The design was the vulnerability.

The mechanics ran through a chain of intermediaries. Panix's domain was registered with **Dotster**, a registrar in Vancouver, Washington. The fraudulent transfer was initiated through an account at **Fibranet Services Ltd.**, a U.K.-based reseller, which submitted it up to **Melbourne IT**, a large registrar in Australia. As InfoWorld reported, [an error by Melbourne IT Ltd. allowed fraudsters using stolen credit cards to take control of Panix.com](https://www.infoworld.com/article/2211412/australian-company-takes-blame-for-panix-domain-hijack.html) — the account used for the transfer was [fraudulent and set up with stolen credit cards](https://www.infoworld.com/article/2211412/australian-company-takes-blame-for-panix-domain-hijack.html).

But the credit card fraud only opened the account. What actually moved the domain was a policy. ICANN had introduced a new inter-registrar transfer process that had taken effect only weeks earlier, in November 2004, built around a principle of *default approval*. As The Register explained, under the new framework [these rules, which came into effect last November, mean that inter-registry transfer requests are automatically approved after five days unless countermanded by the domain owner](https://www.theregister.com/2005/01/19/panix_hijack_more/#:~:text=automatically%20approved%20after%20five%20days%20unless%20countermanded%20by%20the%20domain%20owner).

Read that again, because it is the whole story. Silence meant *yes*. If the rightful owner did nothing — because, for instance, they never received the notice — the transfer went through on its own. Davis Wright Tremaine described the same trap from the legal side: the new rules [arguably make fraudulent transfers easier to accomplish because under the rules domains are automatically transferred unless the owner countermands the transfer request within five days](https://www.dwt.com/insights/2005/01/guarding-against-domain-name-hijacking#:~:text=automatically%20transferred%20unless%20the%20owner%20countermands%20the%20transfer%20request%20within%20five%20days).

Stack the failures and the picture is grim. The *gaining* registrar (Melbourne IT, via Fibranet) accepted a request backed by a stolen card and, by its own later admission, [failed to properly verify the request](https://www.dwt.com/insights/2005/01/guarding-against-domain-name-hijacking#:~:text=failed%20to%20properly%20verify%20the%20request). The *losing* registrar (Dotster) and the rightful owner (Panix) got no effective notice and so never countermanded anything. And the policy's default — approve unless someone objects — turned that absence of objection into a completed theft. No firewall was breached. The paperwork was the attack.

## Recovery, and the policy reforms it triggered

Recovery, once humans got involved, was fast — and that is its own indictment, because it proved the transfer never should have been approved in the first place.

By Sunday, [Panix had recovered its Panix.com domain from Australian domain hosting / registration firm Melbourne IT, where the purloined domain was parked](https://www.theregister.com/2005/01/17/panix_domain_hijack/#:~:text=Panix%20had%20recovered%20its%20Panix.com%20domain), and pointed it back to its natural home at Dotster. The fix at the registry level was nearly instant; the global cleanup was not, because DNS does not forget on command. As The Register noted, root servers were updated quickly but the distributed nature of DNS meant it would take up to 24 hours before normality was fully restored — caches around the world had to expire before every user saw the real panix.com again.

Melbourne IT, to its credit, did not hide. Two days later The Register reported that [an Australian domain registrar has admitted to its part in last weekend's domain name hijack](https://www.theregister.com/2005/01/19/panix_hijack_more/#:~:text=An%20Australian%20domain%20registrar%20has%20admitted%20to%20its%20part), tracing the failure to a verification step in its transfer process that had not been performed and pledging that the loophole that allowed the error had been closed.

But the more important consequence was structural. Panix became the textbook example in the broader reckoning over transfer security that followed. ICANN's Security and Stability Advisory Committee published a 2005 report, [*Domain Name Hijacking: Incidents, Threats, Risks, and Remedial Actions*](https://itp.cdn.icann.org/en/files/security-and-stability-advisory-committee-ssac-reports/hijacking-report-12-07-2005-en.pdf), examining exactly this class of failure — registrars accepting transfers without confirming that the requester was actually the registrant. The lasting fixes that hardened the system trace directly back to weekends like this one:

- **Registrar locks by default.** A domain set to `clientTransferProhibited` simply refuses to transfer until the lock is removed by the rightful holder. What was once an obscure opt-in became, for many registrars, the default state — a brake the auto-approve rule could not override.
- **Auth codes (EPP transfer codes).** Modern gTLD transfers require a secret authorization code that the *losing* registrar releases only to the verified registrant, so a gaining registrar can no longer pull a domain on paperwork alone.
- **A documented [ICANN Transfer Policy](https://www.icann.org/en/contracted-parties/accredited-registrars/resources/domain-name-transfers/policy)** with stricter confirmation duties and an emergency contact channel for reversing exactly this kind of fraudulent transfer fast.

The Panix hijack did not invent these mechanisms by itself, but it became the case everyone pointed to when arguing they were necessary.

## What this teaches about transfer locks and verification

Strip away the dates and the registrar names, and Panix leaves a few durable lessons.

1. **Default-allow is a security decision, and usually the wrong one.** The single most dangerous design choice in 2005 was that *silence equals consent*. A transfer that completes when the owner does nothing assumes the owner is always watching and always reachable. Neither is true over a holiday weekend.
2. **Identity must be verified by the party giving the asset away, not just the party taking it.** The gaining registrar wanted the business and had every incentive to say yes. Real security came only when the *losing* registrar had to release an auth code to a verified holder — putting the verification where the asset actually lives.
3. **Turn on the lock.** `clientTransferProhibited` is the cheapest, most effective protection a domain owner has against this exact attack, and it costs nothing. A locked domain cannot be silently transferred no matter how convincing the paperwork is. Lock your important names and leave them locked.
4. **Your domain is your single point of failure.** Panix's servers were never compromised, yet the company was effectively offline. When one record in a registry can redirect your entire web and email presence, that record deserves more protection than your servers do.
5. **Watch the notices.** The five-day countermand window only protects an owner who actually receives — and reads — the transfer notice. Stale registrant email, an unmonitored admin contact, or a holiday weekend turns a safety valve into a silent failure.

## The Namefi angle

![Colorful illustration of verifiable, tamper-resistant domain ownership — a domain card secured by a green shield, a green Namefi token, and DNS continuity](../../assets/the-panix-com-domain-hijack-03-namefi-angle.jpg)

The Panix hijack is, at its heart, an *authority* problem. The question "who is allowed to move this domain?" was answered by a chain of resellers and a default-approve timer rather than by any strong, verifiable proof of ownership. A stolen credit card and five days of silence were enough to satisfy the system that a stranger in another hemisphere spoke for an ISP in New York.

[Namefi](https://namefi.io) starts from the opposite premise: that control of a domain should be provable, not assumed. By representing domain ownership as a tokenized, on-chain asset that stays compatible with DNS, the act of "who holds this name" becomes cryptographically verifiable and auditable — a record that cannot be quietly overwritten by a registrar accepting bad paperwork. Transfers move when the holder's key authorizes them, not when a five-day clock runs out unattended. The default is *deny*, and consent has to be demonstrated, not merely un-objected-to.

None of this existed in 1989 when Panix was founded — or even in 2005, when the hijack happened. But it points at the lesson that weekend taught the whole industry: a domain is too important to be governed by silence. Ownership should be something you can prove on demand — and something a stranger cannot take simply because you weren't watching the inbox over a long weekend.

## Sources and further reading

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
