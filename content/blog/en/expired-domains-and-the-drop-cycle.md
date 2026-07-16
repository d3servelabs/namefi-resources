---
title: "Expired Domains and the Drop Cycle, Explained"
date: '2026-06-21'
language: en
tags: ['domains', 'domain-investing', 'domain-flipping', 'explainer']
authors: ['fenwei-bian']
editors: ['victor-zhou']
draft: false
cluster: domain-investing
series: domain-flipping-skills
seriesOrder: 3
format: explainer
description: "How a domain expires and drops: grace period, the 30-day redemption window, 5-day pending delete, release — and where dropped names surface for flippers."
ogImage: ../../assets/expired-domains-and-the-drop-cycle-og.jpg
keywords: ['expired domains', 'domain drop cycle', 'domain life cycle', 'redemption grace period', 'pending delete', 'domain drop catching', 'expired domain names', 'how domains expire', 'dropped domains', 'domain sniping', 'buy expired domains', 'domain redemption period', 'when do domains drop', 'domain backorder', 'find domains to flip']
relatedArticles:
  - /en/blog/domain-backorders-and-drop-catching/
  - /en/blog/domain-flipping/
  - /en/blog/how-to-win-domain-auctions/
  - /en/blog/hand-registering-domains-to-flip/
  - /en/blog/when-to-drop-a-domain/
relatedTopics:
  - /en/topics/domain-investing/
  - /en/topics/domain-basics/
relatedSeries:
  - /en/series/domain-flipping-skills/
  - /en/series/name-change-game-change/
relatedGlossary:
  - /en/glossary/registrar/
  - /en/glossary/icann/
  - /en/glossary/tld/
  - /en/glossary/dns/
  - /en/glossary/registry/
---

Most people assume a domain that lapses simply vanishes the day after it expires, snapping back onto the open market the next morning. It doesn't. A name nobody renews runs through a fixed, multi-week sequence of holding states — each with its own rules about who can recover it and at what cost — before the [registry](/en/glossary/registry/) finally releases it back to the available pool. That final release is "the [drop](/en/glossary/pending-delete/)," and registering a name the instant it lands is a recognized practice: as Wikipedia puts it, [domain drop catching, also known as domain sniping, is the practice of registering a domain name once registration has lapsed, immediately after expiry](https://en.wikipedia.org/wiki/Domain_drop_catching#:~:text=is%20the%20practice%20of%20registering%20a%20domain%20name%20once%20registration%20has%20lapsed%2C%20immediately%20after%20expiry).

Flippers care about this corner of the market because dropped names aren't blank slates. A name only reaches the drop because someone registered it, used it, and walked away, so it can carry age, inbound links, residual traffic, or a string that was taken the day you'd otherwise have hand-registered it. The cycle is a recycling stream for names that already proved someone wanted them — a different risk profile from a brand-new string, and one of the supply channels we map in [how to find domains to flip](/en/blog/how-to-find-domains-to-flip/). This explainer walks the lifecycle stage by stage, then covers where dropped names surface and how flippers position to catch them.

## Stage one: the active registration and renewal window

A domain is never owned outright. It's registered for a term and must be renewed to be kept — a [gTLD](/en/glossary/gtld/) registration runs for a term that, per Wikipedia, has a ceiling: [The maximum period of registration for a gTLD domain name is 10 years](https://en.wikipedia.org/wiki/Domain_name_registrar#:~:text=The%20maximum%20period%20of%20registration%20for%20a%20gTLD%20domain%20name%20is%2010%20years). When the term runs out and the holder hasn't renewed, the clock on the drop cycle starts.

The first thing to understand is that "expired" does not mean "available." On the expiry date the [registrant](/en/glossary/registrant/) still has the strongest claim of anyone. The registry doesn't even delete the name right away: it auto-renews the registration and hands the registrar a window to collect payment or cancel. In the [`.com`](/en/tld/com/) namespace this is the **Auto-Renew Grace Period**, and Verisign's binding registry contract fixes its length — [the current value of the Auto-Renew Grace Period is 45 calendar days](https://www.icann.org/en/registry-agreements/com/com-registry-agreement-appendix-7-1-12-2012-en#:~:text=The%20current%20value%20of%20the%20Auto%2DRenew%20Grace%20Period%20is%2045%20calendar%20days). Other gTLDs follow the same shape, though a specific registry can set different values, so treat `.com` as the reference case rather than a universal law.

Most registrars stop the site from resolving and post a placeholder during this window, but the name is held for the original owner, who can usually renew at or near the normal price (the late fee tends to climb the deeper in you go). The principle holds: right after expiry, the lapsed owner gets first refusal, and a name showing as "expired" in a tool is usually not yet catchable. It's also why the cheapest way to keep a name is to renew on time — the standard renewal fee for a plain `.com` is modest, with Wikipedia noting that [the retail cost generally ranges from a low of about $9.70 per year to about $35 per year](https://en.wikipedia.org/wiki/Domain_name_registrar#:~:text=the%20retail%20cost%20generally%20ranges%20from%20a%20low%20of%20about%20%249.70%20per%20year) for a simple registration. Everything that follows is what happens when nobody pays that bill.

## Stage two: the redemption grace period

![Editorial illustration of a domain name tag suspended in an hourglass inside a countdown dial, with a hand offering a coin to pay a recovery fee before time runs out](../../assets/expired-domains-and-the-drop-cycle-01-redemption.jpg)

If the grace window closes with no renewal, the registrar deletes the name into a recovery window called the **[Redemption Grace Period](/en/glossary/grace-period/)** (you'll also see "[redemption period](/en/glossary/redemption-period/)" or `redemptionPeriod` in [WHOIS](/en/glossary/whois/) and EPP status). This is the stage that most often surprises people, because the old owner can still get the name back, though it now costs real money and triggers a formal status change. [ICANN](/en/glossary/icann/) itself refers to the [30-day Redemption Grace Period (RGP)](https://www.icann.org/resources/pages/grace-2013-05-03-en#:~:text=30%2Dday%20Redemption%20Grace%20Period%20%28RGP%29), and its registrant FAQ confirms that if a name is deleted, [the domain name will enter into a redemption period for 30 days](https://www.icann.org/resources/pages/domain-name-renewal-expiration-faqs-2018-12-07-en#:~:text=the%20domain%20name%20will%20enter%20into%20a%20redemption%20period%20for%2030%20days). The binding `.com` contract pins the same number — [the current length of this Redemption Period is 30 calendar days](https://www.icann.org/en/registry-agreements/com/com-registry-agreement-appendix-7-1-12-2012-en#:~:text=The%20current%20length%20of%20this%20Redemption%20Period%20is%2030%20calendar%20days).

Two practical details matter to a flipper here. First, the 30-day figure is the baseline for common gTLDs, not a universal constant. Per Wikipedia, [this length of time varies by TLD, and is usually around 30 to 90 days](https://en.wikipedia.org/wiki/Domain_drop_catching#:~:text=usually%20around%2030%20to%2090%20days). Second, recovery during redemption is intentionally expensive. It isn't a click-to-renew; ICANN's rules require that [domain names that are in the 30-day Redemption Grace Period can be redeemed (or renewed)](https://www.icann.org/resources/pages/domain-name-renewal-expiration-faqs-2018-12-07-en#:~:text=Domain%20names%20that%20are%20in%20the%2030%2Dday%20Redemption%20Grace%20Period%20can%20be%20redeemed) before the window closes, but the registrar typically charges a steep redemption fee on top of the renewal — Wikipedia puts it at a price where the owner [may be required to pay a fee (typically around US$100) to re-activate and re-register the domain](https://en.wikipedia.org/wiki/Domain_drop_catching#:~:text=may%20be%20required%20to%20pay%20a%20fee%20%28typically%20around%20US%24100%29). That fee exists on purpose: it gives a genuinely forgetful owner a last chance while making it costly to play games with the cycle.

For a buyer watching a name through redemption, the takeaway is patience. A domain in redemption is not catchable and not for sale on the open market — it is still legally the lapsed owner's to recover. Plenty of names that look "almost free" sit in this window, and the registrant reclaims a meaningful share of the good ones before they ever drop. Counting your chickens during redemption is the most common way to be disappointed by the drop.

## Stage three: pending delete

When redemption ends with no recovery, the name enters the last holding state before release: pending delete. This is a short, rigid lockout in which nobody can register or recover the name — not the old owner, not you. The `.com` contract spells out the trigger and the lock: [a domain name is placed in PENDING DELETE status if it has not been restored during the Redemption Grace Period](https://www.icann.org/en/registry-agreements/com/com-registry-agreement-appendix-7-1-12-2012-en#:~:text=A%20domain%20name%20is%20placed%20in%20PENDING%20DELETE%20status%20if%20it%20has%20not%20been%20restored%20during%20the%20Redemption%20Grace%20Period), and all registrar requests to modify a name in that status are rejected. It exists purely to give the registry a clean countdown to deletion.

The duration here is the most fixed number in the whole cycle. ICANN's registrant FAQ says a name not restored [will enter into PendingDelete status for 5 days](https://www.icann.org/resources/pages/domain-name-renewal-expiration-faqs-2018-12-07-en#:~:text=will%20enter%20into%20PendingDelete%20status%20for%205%20days), and the `.com` registry contract confirms [the current length of this Pending Delete Period is five calendar days](https://www.icann.org/en/registry-agreements/com/com-registry-agreement-appendix-7-1-12-2012-en#:~:text=The%20current%20length%20of%20this%20Pending%20Delete%20Period%20is%20five%20calendar%20days); Wikipedia notes the same window, after which [the domain will be dropped from the ICANN database](https://en.wikipedia.org/wiki/Domain_drop_catching#:~:text=phase%20of%205%20days%2C%20the%20domain%20will%20be%20dropped%20from%20the%20ICANN%20database). Those five days are the flipper's most useful signal, because pending delete is the one stage with a knowable end. Once a name you want enters it, you can calculate, close to the hour, when it will release. That predictability turns the drop from a lottery into something you can plan around: the names worth chasing announce their own release date five days ahead.

## Stage four: release, and the scramble to catch it

![Editorial illustration of several automated robot servers racing through an open gate to catch a single falling domain tag the instant it releases](../../assets/expired-domains-and-the-drop-cycle-02-release-scramble.jpg)

At the end of pending delete the name is purged from the registry and returns to the available pool. ICANN's guidance is plain: after the redemption and pending-delete periods, [the domain name will be released and made available for registration on a first-come-first-served basis](https://www.icann.org/resources/pages/domain-name-renewal-expiration-faqs-2018-12-07-en#:~:text=the%20domain%20name%20will%20be%20released%20and%20made%20available%20for%20registration%20on%20a%20first%2Dcome%2Dfirst%2Dserved%20basis). In theory, that's the moment anyone can register it for the standard fee. In practice, the most desirable names almost never reach a human typing into a registrar search box, because the release is contested by automated systems built for exactly this instant.

This is where [drop-catching](/en/glossary/backorder/) services come in. Rather than refreshing a search and hoping, these operators point infrastructure at the registry to fire registration requests the microsecond a name releases. As Wikipedia describes them, [these services offer to dedicate their servers to securing a domain name upon its availability, usually at an auction price](https://en.wikipedia.org/wiki/Domain_drop_catching#:~:text=These%20services%20offer%20to%20dedicate%20their%20servers%20to%20securing%20a%20domain%20name%20upon%20its%20availability) — and they win consistently against anyone doing it by hand. Wikipedia is blunt about the asymmetry: [individuals with their limited resources find it difficult to compete with these drop catching firms](https://en.wikipedia.org/wiki/Domain_drop_catching#:~:text=Individuals%20with%20their%20limited%20resources%20find%20it%20difficult%20to%20compete%20with%20these%20drop%20catching%20firms) for the desirable names. When more than one service catches the same name for different clients, it goes to a private [auction](/en/glossary/auction/) among them, so "catching" a contested name usually means winning a bid, not paying a registration fee.

The honest framing for a flipper: for genuinely good names, you don't really catch the drop yourself — you hire the catch. Understanding the cycle tells you *when* a name is winnable and *what it's worth*; the actual capture runs through a backorder or drop-catch service, which we cover in [domain backorders and drop catching](/en/blog/domain-backorders-and-drop-catching/).

## Where dropped names surface

![Editorial illustration of a central magnifying-glass sourcing hub branching to four channels — a drop list, a backorder ticket, an auction gavel, and an aftermarket storefront — each carrying a domain tag](../../assets/expired-domains-and-the-drop-cycle-03-where-surface.jpg)

Knowing the cycle only helps if you know where to watch it. Dropped and dropping names surface in a few predictable places, and a working sourcing routine usually pulls from several at once:

- **Drop lists and expired-domain databases.** Public and paid lists publish names entering pending delete each day, often filterable by length, [TLD](/en/glossary/tld/), keyword, age, and link metrics — the raw feed for a watchlist of names about to release.
- **Backorder and drop-catch platforms.** Instead of watching the calendar yourself, you place a backorder and a service competes for the name at release on your behalf. This is the practical route to anything in demand — see [domain backorders and drop catching](/en/blog/domain-backorders-and-drop-catching/).
- **Expired-domain auctions.** Many registrars don't let valuable expiring inventory hit the public drop at all; they route it into their own expired auctions during or after the grace window, so the name is sold rather than released. That overlaps with the broader channel in [how to win domain auctions](/en/blog/how-to-win-domain-auctions/).
- **Aftermarket marketplaces.** Names caught by someone else, or recovered and re-listed, reappear for resale on the [aftermarket](/en/glossary/aftermarket/). Not the drop itself, but where a lot of post-drop inventory ends up.

The flipper's edge is matching the channel to the name — a low-competition string on a public drop list is a fine hand-register-adjacent play, while a premium one-worder demands a backorder and probably an auction budget. If your instinct is to register fresh strings instead, that's a legitimate and different path, walked in [hand-registering domains to flip](/en/blog/hand-registering-domains-to-flip/).

## Reading the cycle as a flipper

Put the stages together and the drop cycle stops being a mystery and becomes a schedule you can act on. Two rules fall straight out of the mechanics.

**Watch pending delete, not the expiry date.** "Expired" is not "available": the lapsed owner holds first claim through the [auto-renew](/en/glossary/domain-renewal/) window and can still recover the name, expensively, all the way through redemption. Most worthwhile names get reclaimed there once owners notice the lapse, so what survives to pending delete skews toward names the owner genuinely abandoned. Because that 5-day window is fixed, it's the one stage you can time precisely — which is why backorder services key their whole operation to it.

**Diligence travels with the name.** A dropped name inherits its history, and not all history is good. Before you bid on an aged name, check its prior use, its [WHOIS](/en/glossary/whois/) and ownership trail, any [registrar](/en/glossary/registrar/) locks, and whether it ever hosted something that taints it. A name that previously infringed a brand can still attract a [UDRP](/en/glossary/udrp/) complaint in your hands; existing backlinks can be spam as easily as gold. The drop hands you the asset *and* its baggage.

The cycle rewards people who treat it as plumbing rather than luck. The timings are published, the stages are fixed, and the names fall out on schedule. What separates a sourcing edge from a renewal graveyard is knowing which dropping names are worth catching — a valuation skill, not a timing one. It's the upstream supply step in the larger craft we map in the [domain flipping](/en/blog/domain-flipping/) series.

## The Namefi angle

Catching a great dropped name is only half the work; the next time it changes hands, you hit the same friction every high-value [domain trade](/en/glossary/domain-trading/) hits. The buyer won't pay before the name moves, the seller won't move it before getting paid, and the [auth code](/en/glossary/auth-code/) handoff between registrars leaves a nervous gap in the middle. That standoff is the reason [escrow](/en/glossary/escrow/) exists, and it gets sharper the more an aged, link-rich name is worth.

This is the gap [Namefi](https://namefi.io) is built to narrow. Tokenized ownership makes control of a real ICANN domain easier to verify and transfer, with [DNS](/en/glossary/dns/) continuity so a name caught at the drop keeps resolving cleanly when you flip it on. For a flipper sourcing from the drop cycle, less settlement friction at the exit means more of those hard-won catches actually turn into closed sales.

## Friendly Disclaimer (Read Me!)

> We're not lawyers, accountants, financial advisors, or doctors, and **nothing in this article is legal, financial, tax, accounting, medical, or any other flavor of professional advice.** We write these posts to educate ourselves and as a convenience for our customers. Info here may be out of date, geography-specific, or just plain wrong. We make mistakes too.
>
> For any important decision, **please consult a real professional (seriously!)**. Or if that's not your vibe, ask a friend, ask Twitter, ask Reddit, ask an AI, or ask a psychic. In short: **DOYR - Do Your Own Research**. Let's learn and have fun.

## Sources and further reading

- ICANN — [.com Registry Agreement, Appendix 7 (Auto-Renew Grace Period 45 days; Redemption Period 30 days; Pending Delete 5 days)](https://www.icann.org/en/registry-agreements/com/com-registry-agreement-appendix-7-1-12-2012-en#:~:text=The%20current%20value%20of%20the%20Auto%2DRenew%20Grace%20Period%20is%2045%20calendar%20days)
- ICANN — [FAQs for Registrants: Domain Name Renewals and Expiration (30-day redemption, 5-day PendingDelete, release first-come-first-served)](https://www.icann.org/resources/pages/domain-name-renewal-expiration-faqs-2018-12-07-en#:~:text=the%20domain%20name%20will%20enter%20into%20a%20redemption%20period%20for%2030%20days)
- ICANN — [About Redeeming a Domain Name in Redemption Grace Period (30-day RGP)](https://www.icann.org/resources/pages/grace-2013-05-03-en#:~:text=30%2Dday%20Redemption%20Grace%20Period%20%28RGP%29)
- Wikipedia — [Domain drop catching (drop/sniping definition; redemption usually 30–90 days and ~US$100 fee; 5-day pending delete; drop-catch services)](https://en.wikipedia.org/wiki/Domain_drop_catching#:~:text=is%20the%20practice%20of%20registering%20a%20domain%20name%20once%20registration%20has%20lapsed%2C%20immediately%20after%20expiry)
- Wikipedia — [Domain name registrar (10-year max gTLD term; retail `.com` pricing)](https://en.wikipedia.org/wiki/Domain_name_registrar#:~:text=The%20maximum%20period%20of%20registration%20for%20a%20gTLD%20domain%20name%20is%2010%20years)
- Wikipedia — [Domain name speculation (domaining and domain flipping)](https://en.wikipedia.org/wiki/Domain_name_speculation#:~:text=is%20the%20practice%20of%20identifying%20and%20registering%20or%20acquiring%20generic%20Internet%20domain%20names%20as%20an%20investment)
