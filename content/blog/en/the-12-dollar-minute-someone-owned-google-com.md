---
title: 'The $12 Minute: When Someone Quietly Bought Google.com'
date: '2026-06-17'
language: en
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
cluster: domain-security
series: domain-apocalypse
seriesOrder: 4
format: case-study
description: 'In September 2015, a former Google employee bought google.com through Google Domains for $12 and held administrative control of the world''s most valuable domain for about a minute. The story of Sanmay Ved, the $6,006.13 bounty, and what one minute of ownership reveals about who really controls a domain.'
keywords: ['google.com domain', 'sanmay ved', 'google domains bug', 'domain security', 'who owns google.com', 'domain hijacking', 'webmaster tools access', 'google bug bounty', '6006.13 reward', 'domain registration vulnerability', 'domain control', 'dns security', 'domain ownership verification']
---

For about one minute on the night of September 29, 2015, the most valuable address on the internet did not belong to Google.

It belonged to a former Google employee named Sanmay Ved, who had just bought **google.com** for **$12**.

He did not break in. He did not exploit a buffer overflow or phish an administrator. He went to Google's own retail storefront — Google Domains — typed in the most famous domain in the world, and watched the checkout flow do something it should never have done: it let him pay. His card was charged. The order went through. And for roughly sixty seconds, the registrant of record for google.com was a graduate student in Massachusetts.

This is **Domain Mayday / 域名浩劫**, our series on the moments when domain security failed in public. Most episodes are about names stolen by attackers. This one is different — and more unsettling — because nobody was attacking anything. The single most important domain on earth was sold, at list price, to the first person who happened to put it in a shopping cart.

## What google.com normally is

It is hard to overstate what google.com is worth, because the number isn't really a number.

Google.com is the front door to the most-used search engine on the planet, the anchor of Gmail, Maps, Ads, YouTube account flows, and the authentication backbone for billions of people. Slate, covering the incident, called it ["the most-trafficked domain in the world"](https://slate.com/business/2015/10/google-com-domain-buy-ex-googler-sanmay-ved-bought-the-search-engine-s-domain-for-one-minute-in-cute-stunt.html#:~:text=The%20cost%20to%20buy%20the%20most%2Dtrafficked%20domain%20in%20the%20world%3F%20Only%20%2412.). Whatever Tesla.com or Cars.com sold for, google.com is in a category of one: it is not a brand asset, it is *infrastructure* that a large fraction of the human population touches every day.

A domain like that is supposed to be untouchable. It should be locked, flagged, registry-held, server-hold, transfer-prohibited — wrapped in every protection a registrar can apply. The entire premise of domain security is that the more critical the name, the harder it is to move.

And then, for $12, it moved.

## The $12 minute

![Vivid colorful concept art of a glowing globe-shaped domain wearing a tiny twelve-dollar price tag, a single coin dropping into a checkout slot as a one-minute hourglass begins to run](../../assets/the-12-dollar-minute-someone-owned-google-com-01-the-minute.jpg)

Ved was not hunting for trouble. He was an ex-Googler — he had worked at the company as an Account Strategist years earlier — and late at night he was poking around Google Domains, Google's then-new registrar service, looking at domain names. On a whim, he typed in the big one.

In his own telling, the result stopped him cold: ["I type in Google.com and to my surprise it showed it as available,"](https://www.foxnews.com/tech/student-manages-to-buy-domain-name-of-google-com-for-12#:~:text=I%20type%20in%20Google.com%20and%20to%20my%20surprise%20it%20showed%20it%20as%20available) Ved told Business Insider. Not "premium," not "make an offer," not "this domain is taken." *Available.* For the standard $12 registration fee.

He added it to his cart and checked out, fully expecting the system to reject him. It didn't. The transaction completed. As The Hacker News summarized it, an ex-Googler had ["managed to buy the world's most-visited domain Google.com via Google's own Domains service for only $12."](https://thehackernews.com/2015/10/google-bounty-charity.html#:~:text=managed%20to%20buy%20the%20world%27s%20most%2Dvisited%20domain)

And then his inbox started filling up. The systems that key off domain ownership — the ones that send a verified domain owner alerts and controls — saw a new registrant and began doing their jobs. Security Affairs described the moment: ["In a few seconds his inbox and Google Webmaster Tools were flooded with webmaster related messages that were confirming the ownership of the Google.com domains."](https://securityaffairs.com/40904/breaking-news/google-com-charity.html#:~:text=In%20a%20few%20seconds%20his%20inbox%20and%20Google%20Webmaster%20Tools%20were%20flooded)

For that minute, Ved wasn't just listed as the owner on paper. The machine treated him as the owner.

## What you actually control in that minute

This is the part that turns a funny anecdote into a security story.

When you are the verified owner of a domain in Google's ecosystem, you get access to **Webmaster Tools** (now Search Console) — the dashboard site owners use to see how a property is indexed, submit sitemaps, view internal messaging, and manage how the domain appears in search. Ved later said the implication was not lost on him: ["The scary part was I had access to the webmaster controls for a minute,"](https://slate.com/business/2015/10/google-com-domain-buy-ex-googler-sanmay-ved-bought-the-search-engine-s-domain-for-one-minute-in-cute-stunt.html#:~:text=The%20scary%20part%20was%20I%20had%20access%20to%20the%20webmaster%20controls%20for%20a%20minute) he explained.

Reporting at the time noted that during that window he had ["administrative access to Google.com"](https://finance.yahoo.com/news/google-briefly-lost-ownership-domain-160018662.html#:~:text=he%20had%20administrative%20access%20to%20Google.com) and that his ["Google Search Console dashboard was updated with messages for the Google.com domain."](https://finance.yahoo.com/news/google-briefly-lost-ownership-domain-160018662.html#:~:text=his%20Google%20Search%20Console%20dashboard%20was%20updated) Think about what owning a domain actually lets you reach for: DNS records, mail routing, the ability to prove "ownership" to third parties, and the search-engine controls that decide how a property is presented to the world. The registration is the master key. Everything downstream — DNS, certificates, email, single sign-on, search indexing — assumes the registrant is who they say they are.

Ved did the responsible thing. He didn't change a single record. He immediately reported it. But the lesson sits there regardless: the difference between "a curious student" and "a catastrophe" was not a technical control. It was one person's choice to behave well.

## Google's catch — and its response

![Vivid colorful concept art of a giant glowing key held briefly in an open hand, then gently pulled back by a beam of light, against a colorful circuit-board sky with a refunded coin floating away](../../assets/the-12-dollar-minute-someone-owned-google-com-02-how.jpg)

Google's automated systems caught the anomaly fast. Within about a minute, the order was reversed. Fox News reported the cancellation plainly: ["Google Domains canceled the sale a minute later, saying someone had registered the site before he could, and refunded Ved the $12."](https://www.foxnews.com/tech/student-manages-to-buy-domain-name-of-google-com-for-12#:~:text=Google%20Domains%20canceled%20the%20sale%20a%20minute%20later) The "someone" who had registered it first, of course, was Google itself.

Then Google did the thing that turned this into legend. Through its Vulnerability Reward Program, it paid Ved a bounty — and the company chose the number on purpose. In its official 2015 security year-in-review, Google wrote: ["Our initial financial reward to Sanmay—$ 6,006.13—spelled-out Google, numerically (squint a little and you'll see it!). We then doubled this amount when Sanmay donated his reward to charity."](https://americanbazaaronline.com/2016/01/29/google-paid-for-buying-google-com-domain/#:~:text=Our%20initial%20financial%20reward%20to%20Sanmay) (Read it as digits: 6-0-0-6-1-3 → G-O-O-G-L-E.)

Ved chose to give the money away. He asked that it go to the Art of Living India Foundation, which supports free schools across India — and when Google learned of the donation, it doubled the award, bringing the total to roughly **$12,012.26**. Ved's own framing of the whole episode was never about the payout. ["I don't care about the money. It was never about the money,"](https://securityaffairs.com/40904/breaking-news/google-com-charity.html#:~:text=I%20don%27t%20care%20about%20the%20money.%20It%20was%20never%20about%20the%20money) he told Business Insider.

A $12 mistake became a story about a clever bounty, a generous donation, and a company that matched it. But strip away the goodwill and the underlying fact is stark: a registrar handed out the keys to its own kingdom, and the only thing that pulled them back was a fast automated catch — and a buyer who happened to be honest.

## How does a registration this important slip through?

How does the single most protected domain on earth show up as "available for $12" in a self-serve checkout?

The honest answer is that nobody outside Google has the full internal post-mortem, and we won't pretend to. But the *shape* of the failure is familiar to anyone who has worked with domain systems, and it's worth being precise about what we can and can't say.

What's verifiable is the visible behavior. Reporting at the time floated the two ordinary explanations: ["It could have been a bug in Google Domains or the company simply failed to renew its domain name when the time came."](https://finance.yahoo.com/news/google-briefly-lost-ownership-domain-160018662.html#:~:text=It%20could%20have%20been%20a%20bug%20in%20Google%20Domains%20or%20the%20company%20simply%20failed%20to%20renew) Either way, for a brief window the storefront's "is this name available to register?" logic returned the wrong answer for a name that should have been hard-coded as unsellable.

The deeper lesson is architectural. A domain's protection is only as good as the *weakest path to changing it*. A registry can apply server-hold and transfer-prohibited flags; a registrar can lock a name; an organization can enable registrar-level multi-factor and approval workflows. But if any single interface — a retail checkout, an internal admin tool, a support override, an API endpoint — can mutate ownership without those guards firing, then the name is exactly as secure as that one weakest interface. The blast radius of a domain takeover is enormous (DNS, email, certificates, login), but the surface that triggers it can be tiny: one form that should have said "no" and said "yes" instead.

That asymmetry is the whole problem. The value at stake is maximal. The action required to move it can be minimal.

## What this teaches about domain control

A few durable lessons come out of the $12 minute:

1. **The registrant record is the master key.** DNS, TLS certificates, email deliverability, and "verify you own this domain" flows all trust the registration underneath them. Whoever controls the registration controls everything that hangs off it. Protect that layer like the root password it effectively is.

2. **Criticality and protection are not automatically correlated.** You'd assume the most important domain in the world is the most locked-down. For one minute, it wasn't. Importance does not enforce itself; explicit locks, holds, and approval gates do. Audit them; don't assume them.

3. **The control plane is bigger than DNS.** People secure their nameservers and forget the registrar account, the support channel, the billing email, and the internal tooling. A domain can be lost through any door that can rewrite ownership — not just the one labeled "DNS."

4. **You're often one honest person away from disaster.** Google got lucky that the buyer was a security-minded ex-employee who reported it instantly. Security that depends on the goodwill of whoever stumbles in is not security. The system, not the visitor, should be what says no.

5. **Fast detection is a real control.** Google's ~one-minute automated catch genuinely limited the damage. You can't prevent every mistake, but tight monitoring on ownership changes shrinks the window in which a slip becomes a breach.

The reassuring part of this story is that Google's systems noticed and reversed it. The uncomfortable part is that they had to.

## The Namefi angle

![Colorful illustration of verifiable, tamper-resistant domain ownership — a domain card secured by a green shield, a green Namefi token, and DNS continuity](../../assets/the-12-dollar-minute-someone-owned-google-com-03-namefi-angle.jpg)

The $12 minute is, at heart, a question about a record: *who is the verified owner of this name, right now, and how hard is it to change that quietly?*

In the traditional model, the answer lives inside a registrar's database, mutable through whatever interfaces that registrar exposes — retail checkout, admin override, support ticket, API. Most of those interfaces are well-guarded. But ownership is only as safe as the least-guarded one, and the owner usually can't see, in real time, the moment their record changes hands. Sanmay Ved learned he "owned" google.com because his inbox lit up — not because a hardened ledger announced a verified, authorized transfer.

[Namefi](https://namefi.io) starts from the premise that domain ownership should be **verifiable and tamper-evident**, not buried in a single mutable row. By representing domain control as a tokenized, on-chain asset that stays compatible with DNS, the act of "who owns this domain" becomes something you can independently verify and audit — and a transfer becomes an explicit, authorized, visible event rather than a checkout that quietly succeeds. The goal isn't to make domains exotic; it's to make the master key harder to hand to the wrong person by accident, and impossible to move without leaving a trace.

Google.com snapped back in a minute because Google built fast detection on top of a fragile primitive. The better answer is to make the primitive itself trustworthy: ownership you can prove, transfers you can see, and control that doesn't depend on a single form remembering to say "no."

## Sources and further reading

- Google Online Security Blog — [Google Security Rewards — 2015 Year in Review](https://security.googleblog.com/2016/01/google-security-rewards-2015-year-in.html?m=1) (primary source for the $6,006.13 reward and the doubled donation)
- The American Bazaar — [Google paid $6,006.13 to ex-Googler who registered "Google.com"](https://americanbazaaronline.com/2016/01/29/google-paid-for-buying-google-com-domain/) (quotes Google's blog verbatim)
- Slate — [Ex-Googler Sanmay Ved bought the search engine's domain for one minute](https://slate.com/business/2015/10/google-com-domain-buy-ex-googler-sanmay-ved-bought-the-search-engine-s-domain-for-one-minute-in-cute-stunt.html)
- Fox News — [Student manages to buy domain name of Google.com for $12](https://www.foxnews.com/tech/student-manages-to-buy-domain-name-of-google-com-for-12)
- Fox News — [Why Google handed out a $6,006.13 reward](https://www.foxnews.com/tech/why-google-handed-out-a-6006-13-reward)
- The Hacker News — [Google Rewarded the Guy Who Accidentally Bought Google.com, But He Donated It to Charity](https://thehackernews.com/2015/10/google-bounty-charity.html)
- Security Affairs — [Sanmay Ved who bought Google.com donates Google reward](https://securityaffairs.com/40904/breaking-news/google-com-charity.html)
- Yahoo Finance — [Google Briefly Lost Ownership Of Its Domain After It Was Mistakenly Sold For $12](https://finance.yahoo.com/news/google-briefly-lost-ownership-domain-160018662.html)
- Vocal Media — [The Man Who Owned Google.com — for One Minute](https://vocal.media/fyi/the-man-who-owned-google-com-for-one-minute-rc1vud0zhq)
- Namefi — [namefi.io](https://namefi.io)
