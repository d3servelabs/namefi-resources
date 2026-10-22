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
description: "Separate registrar deadlines from registry deletion: understand redemption, pending delete, expired auctions and drop catching without a false countdown."
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

An expired domain is not automatically available to buy. The [registrar](/en/glossary/registrar/) controls customer renewal deadlines and may offer an expired-domain auction. The [registry](/en/glossary/registry/) controls deletion and release. Confusing those two processes can cost an owner a domain or send a buyer to the wrong marketplace.

This guide uses ordinary `.com` registrations as the concrete example. Country-code domains and sponsored extensions can follow different rules. Check the exact extension and registrar before using any timeline.

## The expiration date does not start a universal countdown

![Two separate tracks distinguish registrar renewal deadlines from registry redemption and pending-delete states](../../assets/expired-domains-and-the-drop-cycle-04-two-clocks.jpg)

A registration has a limited term. Renewal extends that term. For `.com`, the registry can automatically add a year after expiration even when the customer has not paid the registrar. The registry gives the registrar 45 calendar days to delete that auto-renewed registration and obtain the applicable registry credit. **That accounting window does not guarantee the customer 45 days to renew.** See Appendix 7, section 3.1.3 of the [current `.com` registry agreement](https://itp.cdn.icann.org/en/files/registry-agreements/com/com-agreement-html-01-12-2024-en.htm).

Consequently, a registry expiration date that moved forward does not prove that the customer paid. Compare the registration data with the registrar account and renewal receipt.

[ICANN's current recovery policy](https://www.icann.org/resources/pages/errp-2024-02-21-en), section 2.2, permits registrars to delete expired registrations subject to applicable rules. The policy also protects renewal during the required DNS interruption period. It does not establish one deletion day for every registrar.

| Event or state | What the timing means | What the reader should do |
| --- | --- | --- |
| Customer expiration | The paid registration term ends | Ask the registrar about renewal immediately |
| `.com` auto-renew grace | The registry provides a 45-day accounting window to the registrar | Do not treat 45 days as a customer entitlement |
| `redemptionPeriod` | The ordinary `.com` deletion process provides 30 calendar days for restoration | Ask the deleting registrar for restoration and the total fee |
| Final `pendingDelete` | The ordinary `.com` process provides five calendar days after unsuccessful redemption | Check the full status combination and the registry release process |
| Release | The registry purges the registration | Check actual availability and any acquisition service terms |

The `.com` periods come from [Appendix 7, sections 3.1.3, 3.1.6 and 3.3.2](https://itp.cdn.icann.org/en/files/registry-agreements/com/com-agreement-html-01-12-2024-en.htm). Adding 45 + 30 + 5 does **not** produce a guaranteed release date after customer expiration. The registrar can delete earlier, renew the registration, or use an auction process instead of letting the name drop.

## The registrar sets its customer recovery and auction process

Registrar timelines can give useful dates when the reader knows the provider. For example, [GoDaddy's standard expiration timeline](https://www.godaddy.com/help/standard-domain-expiration-timeline-609) lists parking at day +5 and an expired auction at day +26. Recovery eligibility changes with bids and purchases. GoDaddy also lists extension exceptions and says it cannot advise when the registry will release a domain.

Those dates describe GoDaddy's standard process. They do not describe every registrar or every extension. An auction listing does not prove that the registry deleted the registration. A domain sold before deletion can change registrants without ever becoming publicly available.

For an owner, contact the registrar now rather than waiting for a supposed final grace day. Check the account, renewal notices, payment method and quoted recovery fee. ICANN requires registrars to disclose renewal, post-expiration and restoration fees in its [recovery policy, section 4](https://www.icann.org/resources/pages/errp-2024-02-21-en).

## Redemption starts after deletion rather than automatically after expiration

![A domain tag in an hourglass illustrates the limited restoration opportunity after deletion](../../assets/expired-domains-and-the-drop-cycle-01-redemption.jpg)

For ordinary `.com` deletion outside the add-grace period, the registry sets `redemptionPeriod` for 30 calendar days. The registry removes the name from its zone. The deleting registrar can request restoration. [ICANN’s registrant FAQ](https://www.icann.org/resources/pages/domain-name-renewal-expiration-faqs-2018-12-07-en) explains the recovery process.

ICANN requires a 30-day redemption period for nonsponsored gTLD registries, with an exception for deletions during the registry add-grace period. During redemption, the registry disables DNS resolution and generally prohibits registrar transfers. The original registrant requests recovery through the deleting registrar under [recovery policy section 3](https://www.icann.org/resources/pages/errp-2024-02-21-en).

A registrar can charge a restoration fee. There is no universal $100 customer price. Ask for the total restoration and renewal cost. A buyer cannot register the name while the registry retains the registration in redemption.

## The full status combination determines whether redemption remains possible

A status lookup needs more than the words `pendingDelete`. [ICANN's status guide](https://www.icann.org/resources/pages/epp-status-codes-2014-06-16-en) explains that `pendingDelete` can appear with `redemptionPeriod` or `pendingRestore`. In those combinations, the redemption or restoration description applies.

For ordinary `.com` registrations that complete redemption without restoration, the final pending-delete period lasts five calendar days. The registry rejects registrar modification requests during that period. The registry then purges the registration. [ICANN’s registrant FAQ](https://www.icann.org/resources/pages/domain-name-renewal-expiration-faqs-2018-12-07-en) also describes this five-day stage.

A public status and expiration date alone do not establish an exact release hour. Confirm the extension, full status set and acquisition provider's current handling. Do not promise a buyer that a particular name will become available on a calculated date.

## Buyers must distinguish an expired auction from a drop catch

![Automated systems compete for a domain after the registry releases the registration](../../assets/expired-domains-and-the-drop-cycle-02-release-scramble.jpg)

An **expired auction** can sell a registration before deletion. A **drop catch** attempts a new registration after release. A **backorder** requests an acquisition attempt under the provider's terms. None of those labels guarantees delivery.

Multiple services cannot each complete the same new registration at release. A successful provider can, however, run an auction when several customers want the name. For example, [Dynadot's current backorder policy](https://www.dynadot.com/help/question/backorder-auction) sends a successfully caught name with multiple backorders to a public auction. Private participation is not a universal rule.

Check the auction type, eligibility, payment obligations and cancellation terms before placing an order. The separate [backorder and drop-catching guide](/en/blog/domain-backorders-and-drop-catching/) covers acquisition mechanics. The [auction guide](/en/blog/how-to-win-domain-auctions/) covers bidding decisions.

## A watchlist must record the acquisition channel and the name's history

![A sourcing hub connects drop lists, backorders, auctions and aftermarket listings](../../assets/expired-domains-and-the-drop-cycle-03-where-surface.jpg)

Use drop lists to find candidates, then verify each candidate's current state. Record the registrar, extension, observed statuses, observation time, potential auction venue and backorder deadline. A database label such as “expired” is a lead rather than proof of availability.

Before buying, inspect prior website use, trademarks, link quality and the complete acquisition cost. A registration history does not guarantee useful traffic or valuable backlinks. The [domain-flipping guide](/en/blog/domain-flipping/) explains the wider valuation task, while [hand registration](/en/blog/hand-registering-domains-to-flip/) offers another sourcing route.

Keep renewal control after acquisition. A later marketplace listing or token transfer does not remove the underlying registration's renewal requirements. Check the registrar's renewal responsibility and recovery procedure before relying on any resale arrangement.

## Friendly Disclaimer (Read Me!)

> We're not lawyers, accountants, financial advisors, or doctors, and **nothing in this article is legal, financial, tax, accounting, medical, or any other flavor of professional advice.** We write these posts to educate ourselves and as a convenience for our customers. Info here may be out of date, geography-specific, or just plain wrong. We make mistakes too.
>
> For any important decision, **please consult a real professional (seriously!)**. Or if that's not your vibe, ask a friend, ask Twitter, ask Reddit, ask an AI, or ask a psychic. In short: **DOYR - Do Your Own Research**. Let's learn and have fun.

## These primary sources explain the applicable rules

Sources opened on October 22, 2026 (UTC). The article retains its original publication date.

- [ICANN and Verisign: December 2024 `.com` agreement, Appendix 7](https://itp.cdn.icann.org/en/files/registry-agreements/com/com-agreement-html-01-12-2024-en.htm) — registry grace periods and deletion operations.
- [ICANN: current Expired Registration Recovery Policy](https://www.icann.org/resources/pages/errp-2024-02-21-en) — customer renewal protections, redemption scope and fee disclosure.
- [ICANN: registrant renewal and expiration FAQ](https://www.icann.org/resources/pages/domain-name-renewal-expiration-faqs-2018-12-07-en) — renewal, restoration and final pending delete.
- [ICANN: EPP status explanations](https://www.icann.org/resources/pages/epp-status-codes-2014-06-16-en) — combined pending-delete, redemption and restoration statuses.
- [GoDaddy: standard expiration timeline](https://www.godaddy.com/help/standard-domain-expiration-timeline-609) — one registrar's customer and auction process, with extension exceptions.
- [Dynadot: backorder auctions](https://www.dynadot.com/help/question/backorder-auction) — successful catches with multiple requests can enter a public auction.
