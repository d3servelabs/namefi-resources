---
title: 'The $12 Minute: When Google Domains Accepted a Google.com Order'
date: '2026-06-17'
language: en
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
cluster: domain-security
series: domain-apocalypse
seriesOrder: 4
format: case-study
description: 'In September 2015, Google Domains accepted a $12 order for google.com from former employee Sanmay Ved, then canceled it about a minute later. What the incident proves, what remains uncertain, and why the $6,006.13 bounty still matters for domain security.'
keywords: ['google.com domain', 'sanmay ved', 'google domains bug', 'domain security', 'who owns google.com', 'domain hijacking', 'webmaster tools access', 'google bug bounty', '6006.13 reward', 'domain registration vulnerability', 'domain control', 'dns security', 'domain ownership verification']
relatedArticles:
  - /en/blog/the-godaddy-multi-year-breach/
  - /en/blog/the-fox-it-dns-hijack/
  - /en/blog/the-lenovo-com-dns-hijack/
  - /en/blog/the-sex-com-heist-the-forged-letter/
  - /en/blog/the-2024-squarespace-defi-domain-hijacks/
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

For about one minute on the night of September 29, 2015, Google's own retail registrar appeared to accept a **$12** order for **google.com** from former employee Sanmay Ved.

He did not break in. He did not exploit a buffer overflow or phish an administrator. He went to Google's own retail storefront — Google Domains — typed in the most famous domain in the world, and watched the checkout flow do something it should never have done: it let him pay. His card was charged and Google systems sent ownership-related messages before canceling the order. Public evidence does **not** establish that the `.com` registry's [registrant](/en/glossary/registrant/) record changed, or that Ved gained DNS, mail, certificate, or registry-level control.

This is **Domain Mayday / 域名浩劫**, our series on moments when domain security failed in public. Most episodes are about names stolen by attackers. This one is different because nobody was attacking anything: a retail checkout accepted a list-price order for one of the internet's most important domains, and related ownership-verification systems reacted before Google canceled it. That is serious without claiming the registry completed a sale.

## What google.com normally is

It is hard to overstate what google.com is worth, because the number isn't really a number.

Google.com is the front door to the most-used search engine on the planet, the anchor of Gmail, Maps, Ads, YouTube account flows, and the authentication backbone for billions of people. Slate, covering the incident, called it ["the most-trafficked domain in the world"](https://slate.com/business/2015/10/google-com-domain-buy-ex-googler-sanmay-ved-bought-the-search-engine-s-domain-for-one-minute-in-cute-stunt.html#:~:text=The%20cost%20to%20buy%20the%20most%2Dtrafficked%20domain%20in%20the%20world%3F%20Only%20%2412.). Whatever [Tesla.com](/en/blog/from-teslamotors-com-to-tesla-com/) or Cars.com sold for, google.com is in a category of one: it is not a brand asset, it is *infrastructure* that a large fraction of the human population touches every day.

A domain like that should have layered registrar and registry protections: registry lock, restricted and audited update paths, multi-party approval, and statuses such as `serverTransferProhibited`, `serverUpdateProhibited`, or `serverDeleteProhibited` where appropriate. `serverHold` is not a protective lock for an active site; it removes the domain from DNS. The more critical the name, the more carefully every change path should be controlled.

And then, for $12, Google's storefront behaved as though it could be ordered.

## The $12 minute

![Vivid colorful concept art of a glowing globe-shaped domain wearing a tiny twelve-dollar price tag, a single coin dropping into a checkout slot as a one-minute hourglass begins to run](../../assets/the-12-dollar-minute-someone-owned-google-com-01-the-minute.jpg)

Ved was not hunting for trouble. He was an ex-Googler — he had worked at the company as an Account Strategist years earlier — and late at night he was poking around Google Domains, Google's then-new registrar service, looking at domain names. On a whim, he typed in the big one.

In his own telling, the result stopped him cold: ["I type in Google.com and to my surprise it showed it as available,"](https://www.foxnews.com/tech/student-manages-to-buy-domain-name-of-google-com-for-12#:~:text=I%20type%20in%20Google.com%20and%20to%20my%20surprise%20it%20showed%20it%20as%20available) Ved told Business Insider. Not "premium," not "make an offer," not "this domain is taken." *Available.* For the standard $12 registration fee.

He added it to his cart and checked out, fully expecting the system to reject him. It didn't. The transaction completed. As The Hacker News summarized it, an ex-Googler had ["managed to buy the world's most-visited domain Google.com via Google's own Domains service for only $12."](https://thehackernews.com/2015/10/google-bounty-charity.html#:~:text=managed%20to%20buy%20the%20world%27s%20most%2Dvisited%20domain)

And then his inbox started filling up. Google systems associated with [domain ownership](/en/glossary/domain-ownership/) began sending alerts and controls as though the order had created a new verified owner. Security Affairs described the moment: ["In a few seconds his inbox and Google Webmaster Tools were flooded with webmaster related messages that were confirming the ownership of the Google.com domains."](https://securityaffairs.com/40904/breaking-news/google-com-charity.html#:~:text=In%20a%20few%20seconds%20his%20inbox%20and%20Google%20Webmaster%20Tools%20were%20flooded)

For that minute, at least some Google account systems treated Ved as a verified owner. That is serious, but it is narrower than proof that the registry changed hands.

## What the incident did — and did not — prove

This is the part that turns a funny anecdote into a security story.

When you are the verified owner of a domain in Google's ecosystem, you get access to **Webmaster Tools** (now Search Console) — the dashboard site owners use to see how a property is indexed, submit sitemaps, view internal messaging, and manage how the domain appears in search. Ved later said the implication was not lost on him: ["The scary part was I had access to the webmaster controls for a minute,"](https://slate.com/business/2015/10/google-com-domain-buy-ex-googler-sanmay-ved-bought-the-search-engine-s-domain-for-one-minute-in-cute-stunt.html#:~:text=The%20scary%20part%20was%20I%20had%20access%20to%20the%20webmaster%20controls%20for%20a%20minute) he explained.

Reporting at the time said his ["Google Search Console dashboard was updated with messages for the Google.com domain."](https://finance.yahoo.com/news/google-briefly-lost-ownership-domain-160018662.html#:~:text=his%20Google%20Search%20Console%20dashboard%20was%20updated) Ved also said he saw webmaster controls. Those observations show a dangerous verification failure inside Google's systems. They do not show that he could change [DNS](/en/glossary/dns/), reroute mail, issue certificates, alter single sign-on, or update the registry record. A contemporaneous analysis likewise argued that meaningful domain control was unlikely and that the registration probably failed before completion.

Ved did the responsible thing and immediately reported what he saw. Because the public record does not establish which controls were actually available, we should not claim that his restraint alone prevented a DNS or registry takeover. The verified lesson is still important: a retail checkout and internal ownership-verification systems accepted a transaction they should have rejected.

## Google's catch — and its response

![Vivid colorful concept art of a giant glowing key held briefly in an open hand, then gently pulled back by a beam of light, against a colorful circuit-board sky with a refunded coin floating away](../../assets/the-12-dollar-minute-someone-owned-google-com-02-how.jpg)

Google canceled the order within about a minute and refunded the charge; public reporting does not establish the internal detection mechanism. Fox News described the cancellation plainly: ["Google Domains canceled the sale a minute later, saying someone had registered the site before he could, and refunded Ved the $12."](https://www.foxnews.com/tech/student-manages-to-buy-domain-name-of-google-com-for-12#:~:text=Google%20Domains%20canceled%20the%20sale%20a%20minute%20later) The "someone" who had registered it first, of course, was Google itself.

Then Google did the thing that turned this into legend. Through its Vulnerability Reward Program, it paid Ved a bounty — and the company chose the number on purpose. In its official 2015 security year-in-review, Google wrote: ["Our initial financial reward to Sanmay—$ 6,006.13—spelled-out Google, numerically (squint a little and you'll see it!). We then doubled this amount when Sanmay donated his reward to charity."](https://americanbazaaronline.com/2016/01/29/google-paid-for-buying-google-com-domain/#:~:text=Our%20initial%20financial%20reward%20to%20Sanmay) (Read it as digits: 6-0-0-6-1-3 → G-O-O-G-L-E.)

Ved chose to give the money away. He asked that it go to the Art of Living India Foundation, which supports free schools across India — and when Google learned of the donation, it doubled the award, bringing the total to roughly **$12,012.26**. Ved's own framing of the whole episode was never about the payout. ["I don't care about the money. It was never about the money,"](https://securityaffairs.com/40904/breaking-news/google-com-charity.html#:~:text=I%20don%27t%20care%20about%20the%20money.%20It%20was%20never%20about%20the%20money) he told Business Insider.

A $12 mistake became a story about a clever bounty, a generous donation, and a company that matched it. But strip away the goodwill and the underlying fact is stark: a registrar accepted an order for its own critical domain and related systems reacted as though ownership had changed. Google's fast cancellation limited the incident before the public record showed registry-level control.

## How does a registration this important slip through?

How does the single most protected domain on earth show up as "available for $12" in a self-serve checkout?

The honest answer is that nobody outside Google has the full internal post-mortem, and we won't pretend to. But the *shape* of the failure is familiar to anyone who has worked with domain systems, and it's worth being precise about what we can and can't say.

What's verifiable is the visible behavior. Reporting at the time floated the two ordinary explanations: ["It could have been a bug in Google Domains or the company simply failed to renew its domain name when the time came."](https://finance.yahoo.com/news/google-briefly-lost-ownership-domain-160018662.html#:~:text=It%20could%20have%20been%20a%20bug%20in%20Google%20Domains%20or%20the%20company%20simply%20failed%20to%20renew) Either way, for a brief window the storefront's "is this name available to register?" logic returned the wrong answer for a name that should have been hard-coded as unsellable.

The deeper lesson is architectural. A domain's protection is only as good as the *weakest authorized path to changing it*. A registry can apply transfer-, update-, and delete-prohibited statuses; a registrar can offer registry lock; an organization can require multi-factor and multi-party approval. If any interface — retail checkout, admin tool, support override, or API — can bypass those guards, that interface becomes the weak point. This incident proves the checkout and adjacent verification logic failed; it does not prove that either could mutate the registry record.

That asymmetry is the whole problem. The value at stake is maximal. The action required to move it can be minimal.

## What this teaches about domain control

A few durable lessons come out of the $12 minute:

1. **Registrar and registry control is a critical trust layer.** DNS delegation and many ownership-verification flows ultimately depend on it, so protect registrar access, transfer controls, and registry locks accordingly. This incident does not prove that Ved obtained that layer; it proves that adjacent checkout and verification systems can fail dangerously.

2. **Criticality must cover every adjacent system.** The registry may remain locked while checkout or ownership-verification logic still behaves incorrectly. Audit the storefront, account, support, API, and verification paths as well as registry controls.

3. **The [control plane](/en/blog/dns-is-the-control-plane/) is bigger than DNS.** People secure their nameservers and forget the registrar account, the support channel, the billing email, and the internal tooling. A domain can be lost through any door that can rewrite ownership — not just the one labeled "DNS."

4. **Responsible disclosure reduced uncertainty and risk.** Google benefited from a security-minded ex-employee reporting the anomalous order immediately. Systems should reject impossible transactions without depending on the customer to recognize and disclose them.

5. **Fast detection is a real control.** Google's roughly one-minute cancellation genuinely limited the incident. You cannot prevent every mistake, but tight monitoring for impossible orders and ownership-verification anomalies shrinks the window in which a slip can become a breach.

The reassuring part of this story is that Google's systems noticed and reversed it. The uncomfortable part is that they had to.

## The Namefi angle

![Colorful illustration of verifiable, tamper-resistant domain ownership — a domain card secured by a green shield, a green Namefi token, and DNS continuity](../../assets/the-12-dollar-minute-someone-owned-google-com-03-namefi-angle.jpg)

The $12 minute is, at heart, a question about a record: *who is the verified owner of this name, right now, and how hard is it to change that quietly?*

In the traditional model, registrar and registry records are changed through controlled interfaces — retail checkout, admin tools, support processes, and APIs. Most are well guarded, but inconsistent checks between interfaces can still create dangerous states. Ved learned that Google's systems had accepted his order because his inbox lit up; the public record does not show that the registry itself recorded a completed transfer.

[Namefi](https://namefi.io) represents a supported domain's onchain control as a tokenized asset while keeping it compatible with DNS. Token transfers are publicly auditable, but that visibility does not replace registrar and registry records, ICANN policy, Namefi's agreements, dispute procedures, or court orders. The useful security property is a tamper-evident onchain event for the token-control layer — not a claim that every possible domain-control change is impossible or purely onchain.

Google canceled the order in about a minute. The broader goal is defense in depth: strict registrar and registry controls, monitored changes, and auditable transfer events, rather than trusting a single form to remember to say "no."

## Sources and further reading

- Google Online Security Blog — [Google Security Rewards — 2015 Year in Review](https://security.googleblog.com/2016/01/google-security-rewards-2015-year-in.html?m=1) (primary source for the $6,006.13 reward and the doubled donation)
- The American Bazaar — [Google paid $6,006.13 to ex-Googler who registered "Google.com"](https://americanbazaaronline.com/2016/01/29/google-paid-for-buying-google-com-domain/) (quotes Google's blog verbatim)
- Slate — [Ex-Googler Sanmay Ved bought the search engine's domain for one minute](https://slate.com/business/2015/10/google-com-domain-buy-ex-googler-sanmay-ved-bought-the-search-engine-s-domain-for-one-minute-in-cute-stunt.html)
- Fox News — [Student manages to buy domain name of Google.com for $12](https://www.foxnews.com/tech/student-manages-to-buy-domain-name-of-google-com-for-12)
- Fox News — [Why Google handed out a $6,006.13 reward](https://www.foxnews.com/tech/why-google-handed-out-a-6006-13-reward)
- The Hacker News — [Google Rewarded the Guy Who Accidentally Bought Google.com, But He Donated It to Charity](https://thehackernews.com/2015/10/google-bounty-charity.html)
- Security Affairs — [Sanmay Ved who bought Google.com donates Google reward](https://securityaffairs.com/40904/breaking-news/google-com-charity.html)
- Yahoo Finance — [Google Briefly Lost Ownership Of Its Domain After It Was Mistakenly Sold For $12](https://finance.yahoo.com/news/google-briefly-lost-ownership-domain-160018662.html)
- Forbes — [Google Accidentally Sold Google.com To A Man For $12](https://www.forbes.com/sites/ianmorris/2015/10/02/google-accidentally-sold-google-com-to-a-man-for-12/) (contemporaneous analysis questioning whether meaningful domain control or registry completion occurred)
- ICANN — [EPP Status Codes](https://www.icann.org/resources/pages/epp-status-codes-2014-06-16-en) (`serverHold` removes DNS activation; transfer, update, and delete prohibitions have different effects)
- Vocal Media — [The Man Who Owned Google.com — for One Minute](https://vocal.media/fyi/the-man-who-owned-google-com-for-one-minute-rc1vud0zhq)
- Namefi — [namefi.io](https://namefi.io)
