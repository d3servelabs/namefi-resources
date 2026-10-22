---
title: "Domain Backorders and Drop-Catching, Explained"
date: '2026-06-21'
language: en
tags: ['domains', 'domain-investing', 'domain-flipping', 'explainer']
authors: ['fenwei-bian']
editors: ['victor-zhou']
draft: false
cluster: domain-investing
series: domain-flipping-skills
seriesOrder: 4
format: explainer
description: "Learn what a domain backorder commits you to, how drop-catching differs from expiry auctions, and which payment and auction rules to check."
ogImage: ../../assets/domain-backorders-and-drop-catching-og.jpg
keywords: ['domain backorder', 'drop catching', 'how to backorder a domain', 'catch expiring domains', 'DropCatch', 'SnapNames', 'NameJet', 'Park.io', 'Dynadot backorder', 'domain drop catching service', 'redemption grace period', 'pending delete domain', 'when do domains drop', 'expired domain auction', 'how to get a registered domain']
relatedArticles:
  - /en/blog/expired-domains-and-the-drop-cycle/
  - /en/blog/how-to-win-domain-auctions/
  - /en/blog/when-to-drop-a-domain/
  - /en/blog/domain-flipping/
  - /en/blog/hand-registering-domains-to-flip/
relatedTopics:
  - /en/topics/domain-investing/
  - /en/topics/domain-basics/
relatedSeries:
  - /en/series/domain-flipping-skills/
  - /en/series/tokenize-your-com/
relatedGlossary:
  - /en/glossary/registrar/
  - /en/glossary/icann/
  - /en/glossary/tld/
  - /en/glossary/dns/
  - /en/glossary/registry/
---

A domain backorder asks a service to pursue a name that you cannot register now. The order can also commit you to a payment or opening bid. A backorder does not guarantee acquisition, reserve the domain across registrars, or guarantee a private auction.

The important question is what happens if the service succeeds. Check the acquisition channel, the auction rules, and the total amount you can owe. This article explains those decisions. The [drop-cycle guide](/en/blog/expired-domains-and-the-drop-cycle/) covers expiration stages, and the [auction guide](/en/blog/how-to-win-domain-auctions/) covers bidding strategy.

## First, why a name "drops" at all

![Editorial illustration of a domain name moving through a timeline of grace-period stages before falling into an open pool](../../assets/domain-backorders-and-drop-catching-01-drop-cycle.jpg)

A domain isn't sold once and kept forever. It's [registered](/en/glossary/registrar/) for a term and has to be renewed, and when an owner stops paying, the name does not necessarily vanish instantly. The path after expiration depends on the TLD, registry, registrar, and whether the registrar routes the name through an expiry marketplace. We cover the full cycle in [expired domains and the drop cycle](/en/blog/expired-domains-and-the-drop-cycle/); here's the part that matters for catching.

For gTLDs covered by ICANN's [Expired Registration Recovery Policy](https://www.icann.org/en/contracted-parties/consensus-policies/expired-registration-recovery-policy/expired-registration-recovery-policy-21-02-2024-en), a registrar may delete a registration after it expires. Except for sponsored gTLD registries, the registry must then offer a 30-day [Redemption Grace Period](/en/glossary/redemption-period/) immediately after that deletion. During this period, the previous registrant can ask the deleting registrar to restore the name, and the registrar must disclose its restore fees. This ICANN policy is for gTLDs; country-code TLDs can have different registry-specific expiration and deletion rules.

If a covered gTLD registration is not restored, it can enter the final [pending delete](/en/glossary/pending-delete/) countdown. [ICANN's EPP status guidance](https://www.icann.org/resources/pages/epp-status-codes-2014-06-16-en) says a domain in `pendingDelete` after redemption is purged from the registry database after five calendar days and becomes available for registration. That public [drop](/en/glossary/pending-delete/) is the moment catchers wait for. Not every expired name reaches it: some registrars allocate eligible inventory through pre-release or expiry-auction partners before a registry deletion, and ccTLD processes vary.

## Drop-catching services compete at registry release

![Multiple registration systems compete to register one domain after the registry releases the name](../../assets/domain-backorders-and-drop-catching-02-millisecond-race.jpg)

Drop-catching means attempting to register a domain when the registry deletes the previous registration and makes the name available again. Expiration alone does not start that race. The previous registrant may still renew or restore the name before the relevant deadline.

[Dynadot explains](https://www.dynadot.com/help/question/place-a-backorder) that competing registrars can prevent a successful catch. [SnapNames describes](https://www.snapnames.com/legal/legal.action) a network of registrar partners and explicitly declines to guarantee acquisition. A normal checkout provides no protection against those competing registration attempts.

A successful catch also does not establish your final price. Multiple requests can lead to an [auction](/en/glossary/auction/), and eligibility depends on the platform and listing. Do not assume that only the original backorder customers can bid.

## A backorder authorizes a platform to pursue a domain

![A checklist identifies the acquisition channel, auction rules, and budget before a domain backorder](../../assets/domain-backorders-and-drop-catching-04-order-checks.jpg)

A backorder is an acquisition request you place ahead of time. Instead of trying to register a name manually at the drop, you tell a service, "if this name enters your acquisition channel, try to get it for me." For a public pending-delete name, that request normally instructs the service's own drop-catching system; it does not create industry-wide priority over competing catchers. Payment authorization, minimum bids, and when a charge becomes due vary by platform.

Under the hood, a backorder is often fulfilled by the same drop-catching machinery, just pointed at your request. Dynadot, for example, says it tries to catch a pending-delete domain when it is released, gives no guarantee of success, and sends the name to a backorder auction if multiple customers requested it. NameJet similarly treats a backorder as reserved interest and an opening bid if an auction follows. In other words, you are buying or authorizing an attempt under one platform's rules—not a guaranteed domain and not priority over every other service.

A registrar can also send an expired name to an auction partner before public deletion. [NameJet's inventory guide](https://www.namejet.com/userguide.action) distinguishes partner expiry inventory from pending-delete inventory. An independent catcher cannot register a name that never becomes publicly available. Check the actual listing instead of treating the expiration date as a promise of a public drop.

## Each service defines a different purchase commitment

These examples describe published rules checked on **October 21, 2026**. Prices, eligible extensions, and order deadlines can change. Use the current listing and checkout for the domain you want.

| Service | What the primary source confirms | What to check before ordering |
| --- | --- | --- |
| DropCatch | Its [official introduction](https://pages.dropcatch.com/) says placement costs nothing and a successful acquisition triggers a charge. | Check the listing's price, auction eligibility, and current terms. Free placement does not mean a free domain. |
| Dynadot | Its [backorder instructions](https://www.dynadot.com/help/question/place-a-backorder) require payment settings and account eligibility. Multiple requests lead to an auction. | Check account requirements, the backorder price, and the rules for participating in the auction. |
| NameJet and SnapNames | Their [NameJet guide](https://www.namejet.com/userguide.action) and [SnapNames guide](https://www.snapnames.com/userguide.action) cover expiry and pending-delete inventory. Both warn that an acquired domain can enter a public auction, including bidders without a backorder. | Check the inventory type, deadline, and whether the actual auction is public or restricted. |
| Park.io | Its [support page](https://park.io/support) says payment follows acquisition. Equal-price competing backorders can trigger an auction. Premium-domain orders can require card preauthorization. | Check the extension, premium classification, maximum price, and renewal price. |

For a public drop, requests at independent services can increase your coverage of competing registration systems. Read each order's obligations first. For exclusive expiry inventory, identify the platform that controls the listing. A second service cannot create access to an exclusive listing.

## You should check five conditions before placing an order

1. **Confirm the channel.** Identify pending-delete, partner expiry, or owner-listed inventory. Record the exact domain and extension.
2. **Confirm the commitment.** Distinguish a placement fee, account deposit, card authorization, successful-catch charge, and binding bid.
3. **Confirm the auction audience.** Read the listing and current terms. A backorder does not necessarily exclude later bidders.
4. **Confirm the ceiling.** Include the winning bid, applicable fees, taxes, and future renewal cost in your budget.
5. **Confirm delivery.** Check the receiving registrar, payment deadline, account access, and transfer restrictions before planning a move.

For example, a displayed $50 backorder price is not necessarily a $50 spending limit. If the domain enters an auction, your later bid can create a larger obligation. [SnapNames' buyer agreement](https://www.snapnames.com/legal/buyeragreement.action) treats accepted bids as binding purchase commitments. Save the listing, accepted terms, order confirmation, and your budget before the deadline.

A failed catch and a lost auction are different outcomes. In the first case, another registration system may acquire the domain. In the second case, your service acquired the domain but another eligible bidder won. Neither outcome establishes that you own the name.

## When a backorder is actually worth paying for

Backorders are cheap to place and easy to over-place, which is exactly the trap. Here's the honest filter.

**Pay for a backorder when the name is genuinely scarce and you have a specific use.** A clean one-word `.com`, a short brandable, or an exact-match name for a project you're actually building is worth a backorder fee and even a modest auction budget, because if it drops publicly it will be contested and you'll lose it without a catcher. This is also true for an aged name with real, verifiable history — existing backlinks or traffic that survive the handoff — which is a different sourcing channel from [hand-registering brand-new names to flip](/en/blog/hand-registering-domains-to-flip/).

**Skip it when the name isn't really scarce.** If a near-identical string is available to hand-register right now for the price of a normal registration, paying a backorder fee and risking an auction for the expiring version is usually a bad trade. The drop only matters when the *specific* name is the asset and no substitute will do.

**Assume you might lose, and price accordingly.** A backorder is an attempt, not a purchase. On a desirable name you can be outbid in the post-catch auction, or out-caught by a service with more firepower. Check whether a failed attempt creates any charge. Do not assume that a displayed backorder price includes an auction win.

**Watch the trademark line.** Catching an expired name doesn't launder its history. If the string is somebody's brand, the fact that it lapsed doesn't make it safe to grab and resell. The [UDRP](/en/glossary/udrp/) framework still applies, and an expired [trademarked](/en/glossary/trademark/) name is exactly the kind of thing that triggers a dispute, as we cover in [what is UDRP](/en/blog/what-is-udrp/). Catch generic and brandable names, not lapsed brands.

One more diligence note specific to caught names: an expired domain can carry baggage a fresh registration never would, like a spam history or a Google penalty. Before you bid hard, check its past in the [WHOIS](/en/glossary/whois/) and archive record. A name's history transfers with it.

## After the catch: actually owning it

Winning the catch is the start, not the finish. The name lands in an account at whatever registrar caught it, and turning that into a clean, sellable asset means getting real [control of it](/en/glossary/domain-ownership/) — the [auth code](/en/glossary/auth-code/), the ability to do a [cross-registrar transfer](/en/glossary/cross-registrar-transfer/) to your home registrar, and confidence that the [WHOIS](/en/glossary/whois/) and DNS are yours. That handoff is where high-value names get nervous, because the standoff haunts every [domain trade](/en/glossary/domain-trading/): nobody wants to move first.

This is the friction [Namefi](https://namefi.io) is built to reduce. Tokenized ownership makes control of a real [ICANN](/en/glossary/icann/) domain easier to verify and transfer, with DNS continuity so a caught name keeps resolving cleanly through the handover. When you do resell it, the standard mechanics — listing, pricing, and a neutral [escrow](/en/glossary/escrow/) handoff — are covered in [how to sell a domain name you own](/en/blog/how-to-sell-a-domain-name-you-own/) and [domain escrow explained](/en/blog/domain-escrow-explained/).

## The short version

Drop-catching is the race to register a name when the registry releases it; a backorder is a request for a service to pursue a name through its available acquisition channel. For public deletes, no backorder gives universal priority over competing catchers. Pay or authorize one when the *specific* name is scarce and you have a real use for it, match the service to the path the name may take, and never treat an attempt as ownership until the name is actually secured in your account. Most of the time, the disciplined answer is to let it go — and that discipline is what separates a portfolio from a renewal bill.

## Friendly Disclaimer (Read Me!)

> We're not lawyers, accountants, financial advisors, or doctors, and **nothing in this article is legal, financial, tax, accounting, medical, or any other flavor of professional advice.** We write these posts to educate ourselves and as a convenience for our customers. Info here may be out of date, geography-specific, or just plain wrong. We make mistakes too.
>
> For any important decision, **please consult a real professional (seriously!)**. Or if that's not your vibe, ask a friend, ask Twitter, ask Reddit, ask an AI, or ask a psychic. In short: **DYOR - Do Your Own Research**. Let's learn and have fun.

## These sources explain the current rules

The author opened the following primary sources on October 21, 2026. Platform terms can change after that date.

- ICANN — [Expired Registration Recovery Policy](https://www.icann.org/en/contracted-parties/consensus-policies/expired-registration-recovery-policy/expired-registration-recovery-policy-21-02-2024-en) and [EPP status codes](https://www.icann.org/resources/pages/epp-status-codes-2014-06-16-en).
- DropCatch — [Official introduction and payment model](https://pages.dropcatch.com/).
- Dynadot — [Backorder requirements and competing requests](https://www.dynadot.com/help/question/place-a-backorder).
- NameJet — [Inventory, backorders, and possible public auctions](https://www.namejet.com/userguide.action).
- SnapNames — [User guide](https://www.snapnames.com/userguide.action), [service terms](https://www.snapnames.com/legal/legal.action), and [buyer agreement](https://www.snapnames.com/legal/buyeragreement.action).
- Park.io — [Payment, premium-domain authorization, auctions, and renewal controls](https://park.io/support).
