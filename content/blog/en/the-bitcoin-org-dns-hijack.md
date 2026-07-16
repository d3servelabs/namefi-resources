---
title: 'The Bitcoin.org Website Hijack: How Bitcoin''s Home Page Became a "Double Your Coins" Scam'
date: '2026-06-17'
language: en
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['aileen-wright']
editors: ['victor-zhou']
draft: false
cluster: domain-security
series: domain-apocalypse
seriesOrder: 8
format: case-study
description: 'In September 2021, Bitcoin.org — the long-time informational home of Bitcoin run by the pseudonymous operator Cobra — displayed a fake "double your Bitcoin" giveaway before the site was pulled offline. Nameserver and WHOIS changes led observers to suspect DNS compromise, but the public root cause remained unconfirmed. Here is what the incident teaches about crypto-native sites depending on ordinary domain infrastructure.'
keywords: ['bitcoin.org', 'bitcoin.org hack', 'dns hijack', 'domain hijacking', 'double your bitcoin scam', 'crypto giveaway scam', 'cobra bitcoin.org', 'cloudflare dns', 'namecheap', 'dns security', 'domain security', 'nameserver hijack', 'whois change attack']
relatedArticles:
  - /en/blog/the-curve-finance-dns-hijack/
  - /en/blog/the-lenovo-com-dns-hijack/
  - /en/blog/the-myetherwallet-bgp-dns-attack/
  - /en/blog/the-fox-it-dns-hijack/
  - /en/blog/the-godaddy-multi-year-breach/
relatedTopics:
  - /en/topics/domain-security/
  - /en/topics/domain-tokenization/
relatedSeries:
  - /en/series/domain-apocalypse/
  - /en/series/name-change-game-change/
relatedGlossary:
  - /en/glossary/dns/
  - /en/glossary/registrar/
  - /en/glossary/icann/
  - /en/glossary/tld/
  - /en/glossary/registry/
---

For more than a decade, if you wanted the plain, vendor-neutral answer to "what is Bitcoin and how do I use it safely," the internet sent you to one address: **Bitcoin.org**.

It was never an exchange. It never sold anything. It was the closest thing the most adversarial, trustless money in the world had to an *official* welcome mat — a site [registered on 18 August 2008](https://en.wikipedia.org/wiki/Bitcoin#:~:text=The%20domain%20name%20bitcoin.org%20was%20registered), older than the genesis block itself, the place where the Bitcoin white paper lived and where newcomers were taught the first rule of crypto: *be your own bank, and trust no one with your keys.*

So there is a brutal irony in what happened on **Thursday, September 23, 2021**. The single most repeated safety lesson in all of crypto — *if someone promises to double your coins, it's a scam* — got broadcast, in reverse, from Bitcoin's own front door. For a few hours, the website that taught people not to fall for "double your Bitcoin" *was* the "double your Bitcoin" scam. Public evidence pointed to the domain-routing layer, but the precise compromise path was never conclusively established in the reporting available after the incident.

## A symbolic, trusted home for Bitcoin

To understand why this hijack stung, you have to understand what Bitcoin.org meant.

Bitcoin has no CEO, no headquarters, and no official spokesperson. What it had — for years — was a small set of community-run reference sites, and Bitcoin.org was the most prominent of them. CryptoPotato called it [the oldest website in relation to BTC, registered more than 13 years ago](https://cryptopotato.com/bitcoinorg-hacked-giveaway-scam-promising-users-to-double-their-btc/#:~:text=the%20oldest%20website%20in%20relation%20to). It hosted [wallet](/en/glossary/wallet/) recommendations, getting-started guides, and a copy of Satoshi Nakamoto's white paper.

It was also, fittingly for Bitcoin, run by a ghost. The site is maintained by a pseudonymous operator known only as **Cobra** — anonymous on principle. That principle had recently been tested in court: just months earlier, the self-proclaimed "Satoshi" Craig Wright had won a UK copyright case forcing Bitcoin.org to take down the white paper, with a judge issuing an [injunction prohibiting Cobra from infringing Wright's copyright in the U.K.](https://www.coindesk.com/markets/2021/06/29/uk-court-orders-bitcoinorg-to-remove-white-paper-following-craig-wright-lawsuit#:~:text=injunction%20prohibiting%20Cobra%20from%20infringing). Cobra's defense of his own anonymity was almost poetic: [the court rules allowed for me to be sued pseudonymously, however, I couldn't defend myself pseudonymously](https://www.coindesk.com/markets/2021/06/29/uk-court-orders-bitcoinorg-to-remove-white-paper-following-craig-wright-lawsuit#:~:text=the%20court%20rules%20allowed%20for%20me%20to%20be%20sued%20pseudonymously).

The point is that Bitcoin.org carried *trust* — the institutional kind a leaderless movement isn't supposed to have, accumulated quietly over thirteen years. That trust is exactly what made it a target. A scam works better the more credible its host. And there are very few hosts in crypto more credible than Bitcoin's own name.

There is a second, sharper irony hiding here. The entire ethos of Bitcoin.org was *self-custody*: hold your own keys, trust no custodian, verify everything. A visitor who had fully internalized that lesson would never hand coins to a stranger's wallet on a promise. But the giveaway scam didn't ask them to trust a stranger — it asked them to trust *Bitcoin.org itself*, the one address they'd been told for years was the safe place to start. The attack didn't defeat the lesson; it hijacked the messenger.

## September 2021: the hijack and the fake giveaway

![Vivid colorful concept art of a trusted coastal lighthouse domain that has been hijacked, its beam now flashing a glowing fake sign reading double your coins out over the water toward small boats](../../assets/the-bitcoin-org-dns-hijack-01-hijack.jpg)

On the morning of September 23, 2021, visitors to Bitcoin.org didn't see wallet guides. They saw a pop-up modal — a clean, official-looking overlay stamped on the homepage of Bitcoin's most trusted reference site.

The message was the oldest trick in crypto, dressed in borrowed authority. It claimed the **Bitcoin Foundation** was [giving back to the community](https://www.coindesk.com/tech/2021/09/23/bitcoinorg-appears-hacked-by-giveaway-scam/#:~:text=giving%20back%20to%20the%20community), said the offer was limited to [the first 10,000 users](https://www.coindesk.com/tech/2021/09/23/bitcoinorg-appears-hacked-by-giveaway-scam/#:~:text=first%2010%2C000), and made one simple promise: [Send Bitcoin to this address, and we will send double the amount in return!](https://www.bleepingcomputer.com/news/security/bitcoinorg-hackers-steal-17-000-in-double-your-cash-scam/#:~:text=Send%20Bitcoin%20to%20this%20address%2C%20and%20we%20will%20send%20double). A QR code made it frictionless. The mechanics, as CoinDesk dryly described the genre, are always the same: [these schemes give false promises of doubling one's funds after sending an initial amount to a wallet address via QR code](https://www.coindesk.com/tech/2021/09/23/bitcoinorg-appears-hacked-by-giveaway-scam/#:~:text=these%20schemes%20give%20false%20promises%20of%20doubling). And the outcome is always the same too: [victims, in fact, receive nothing in return and lose the crypto they sent](https://www.coindesk.com/tech/2021/09/23/bitcoinorg-appears-hacked-by-giveaway-scam/#:~:text=Victims%2C%20in%20fact%2C%20receive%20nothing).

Cobra confirmed the breach publicly and bluntly, posting that the site [has been compromised. Currently looking into how the hackers put up the scam modal on the site](https://www.bleepingcomputer.com/news/security/bitcoinorg-hackers-steal-17-000-in-double-your-cash-scam/#:~:text=has%20been%20compromised.%20Currently%20looking%20into%20how%20the%20hackers).

## What visitors lost

A "double your money" scam only works if a few people believe it. On a random website, almost no one would. On *Bitcoin.org*, some did.

The scam wallet didn't stay empty. BleepingComputer reported the address's [last updated balance was 0.40571238 BTC, approximately US$17,000 at the time](https://www.bleepingcomputer.com/news/security/bitcoinorg-hackers-steal-17-000-in-double-your-cash-scam/#:~:text=0.40571238%20BTC%20or%20approximately%20US%2417%2C000). CoinDesk, capturing it live, noted the [giveaway address had received over $17,700 in small transactions](https://www.coindesk.com/tech/2021/09/23/bitcoinorg-appears-hacked-by-giveaway-scam/#:~:text=received%20over%20%2417%2C700%20in%20small%20transactions). Those on-chain receipts show funds reaching the address; they do not by themselves prove that every deposit was a victim loss, because scammers may seed their own wallet to make a giveaway look credible.

For any genuine victim deposits, the transfer was final once confirmed: there is no chargeback, fraud department, or bank reversal. The reported wallet total is therefore best read as the scam address's activity, not a verified net-loss figure.

The dollar figure is almost beside the point. The real damage was to the thing Bitcoin.org spent thirteen years building — the assumption that *this* address, of all addresses, was safe to trust.

## How it happened: evidence of DNS changes, but no confirmed root cause

![Vivid colorful concept art of a redirected road signpost at a glowing fork, one arrow secretly repainted to point traffic toward a golden funnel trap shaped like a coin, the original safe path left dark](../../assets/the-bitcoin-org-dns-hijack-02-fake-giveaway.jpg)

Here is the detail that makes this a *Domain Mayday* story and not just another [phishing](/en/glossary/phishing/) tale: the available evidence was consistent with traffic being redirected away from Bitcoin.org's origin server, although the public postmortem did not conclusively identify the initial access path.

Cobra said [my actual server didn't get any traffic during the hack](https://news.bitcoin.com/hackers-compromise-web-portal-bitcoin-org-dns-hijack-replaces-site-with-btc-doubler-scam/#:~:text=my%20actual%20server%20didn%27t%20get%20any%20traffic%20during%20the%20hack). Observers also reported that [the WHOIS info was updated at the time of the hack, the nameservers + DNS changed](https://news.bitcoin.com/hackers-compromise-web-portal-bitcoin-org-dns-hijack-replaces-site-with-btc-doubler-scam/#:~:text=The%20WHOIS%20info%20was%20updated%20at%20the%20time%20of%20the%20hack). Together, those observations support a DNS- or registrar-layer hypothesis: control of the nameservers can redirect a trusted name to an attacker's server without changing the legitimate origin. They do not identify which account, provider, or configuration was first compromised.

Cobra suspected the [DNS](/en/glossary/dns/) layer and a recent infrastructure change. As he put it: [Bitcoin.org hasn't been hacked, ever. And then we move to Cloudflare, and two months later we get hacked.](https://news.bitcoin.com/hackers-compromise-web-portal-bitcoin-org-dns-hijack-replaces-site-with-btc-doubler-scam/#:~:text=Bitcoin.org%20hasn%27t%20been%20hacked%2C%20ever.%20And%20then%20we%20move%20to%20Cloudflare) His working theory was that [the attackers just seem to have exploited some flaw in the DNS](https://news.bitcoin.com/hackers-compromise-web-portal-bitcoin-org-dns-hijack-replaces-site-with-btc-doubler-scam/#:~:text=The%20attackers%20just%20seem%20to%20have%20exploited%20some%20flaw%20in%20the%20DNS). Decrypt reported that hypothesis as an apparent DNS-configuration flaw after the Cloudflare move; it was not a confirmed forensic conclusion.

Whether the root cause was a misconfiguration, a [registrar](/en/glossary/registrar/)-level compromise, a DNS-provider account, or another path was never fully nailed down in public. BleepingComputer explicitly noted that the [root cause of the website hijack remains unconfirmed, although some have suspected this to be a DNS hijack](https://www.bleepingcomputer.com/news/security/bitcoinorg-hackers-steal-17-000-in-double-your-cash-scam/#:~:text=root%20cause%20of%20the%20website%20hijack%20remains%20unconfirmed). The incident still demonstrates the risk: if a trusted domain resolves to an attacker's content, users can be compromised even without public evidence of an application-code or private-key breach.

## Response and aftermath

The fix, tellingly, also happened at the domain layer.

The immediate response happened at the domain layer. The registrar, **Namecheap**, temporarily disabled the domain — per BleepingComputer, [we have temporarily disabled the domain](https://www.bleepingcomputer.com/news/security/bitcoinorg-hackers-steal-17-000-in-double-your-cash-scam/#:~:text=We%20have%20temporarily%20disabled%20the%20domain). For a stretch, visitors didn't get a scam or a homepage; CoinDesk reported that they were [greeted with "This site can't be reached."](https://www.coindesk.com/tech/2021/09/23/bitcoinorg-appears-hacked-by-giveaway-scam/#:~:text=This%20site%20can%27t%20be%20reached) The most trusted reference page in Bitcoin went dark.

After a few hours of investigation, the domain was repointed correctly and the site was restored to its pre-hack state. The window was short — a day or less — and in raw dollars the theft was modest by crypto-crime standards. But the incident landed hard precisely because of *which* site it was. A movement that prides itself on "don't trust, verify" had just watched its own canonical "trust us" page get verifiably weaponized against its users.

## What this teaches about even crypto-native sites depending on DNS

![Vivid colorful concept art of a glowing gold coin scam funnel, bright coins pouring into a wide trustworthy-looking mouth at the top and vanishing into darkness at the narrow bottom, set against an energetic abstract background](../../assets/the-bitcoin-org-dns-hijack-03-namefi-angle.jpg)

The most uncomfortable lesson of the Bitcoin.org hijack is that **being crypto-native saves you from almost none of it.**

Bitcoin is decentralized. Its ledger is famously hard to tamper with. Its keys, when held properly, are yours alone. None of that protected the website's *front door*, a perfectly ordinary domain name riding on the same DNS, registrar, and [nameserver](/en/glossary/nameserver/) plumbing as any e-commerce shop or local bakery. The [blockchain](/en/glossary/blockchain/) was untouched; the public website path was not.

A few durable takeaways fall out of this:

1. **Your domain is part of your attack surface — often the *largest* part.** You can write flawless code, hold your keys in cold storage, and harden every server, and an attacker who controls your nameservers or your registrar account can still impersonate you completely. The name is the front door, and a hijacked name lets a stranger answer it.

2. **DNS/registrar changes are silent and high-leverage.** When [nameservers + DNS changed](https://news.bitcoin.com/hackers-compromise-web-portal-bitcoin-org-dns-hijack-replaces-site-with-btc-doubler-scam/#:~:text=nameservers%20%2B%20DNS%20changed), nothing "broke" in a way most monitoring would catch instantly — the site still loaded, just from the wrong place. Registrar lock, [registry lock](/en/glossary/registry-lock/), [DNSSEC](/en/glossary/dnssec/), and tight access control on registrar/DNS-provider accounts aren't optional hygiene; they're the locks on the door everyone forgets.

3. **Reputation is the thing actually being stolen.** The attackers didn't really want Bitcoin.org's $17,000 server; they wanted its *credibility*, borrowed for a few hours to make an ancient scam believable. The more trusted your domain, the more valuable it is to hijack — and the more careful you have to be about who can change where it points.

4. **"Trustless" infrastructure still rests on trusted names.** Even Bitcoin, the canonical example of removing intermediaries, reaches its users through DNS — a hierarchical, intermediated, mutable system. Decentralizing the money doesn't decentralize the front door.

5. **Speed of detection beats elegance of defense.** Bitcoin.org survived this with a modest loss largely because the community spotted the scam fast and the registrar could yank the domain within hours. The longer a hijacked name keeps resolving to an attacker, the more the loss — and the reputational damage — compounds. Knowing *the instant* your name's control or routing changes is worth more than any single static lock.

## The Namefi angle

The Bitcoin.org incident is a *control and verifiability* problem. The blockchain was sound, while the public website path was altered. When nameservers or DNS answers change unexpectedly — observers reported [WHOIS info updated at the time of the hack](https://news.bitcoin.com/hackers-compromise-web-portal-bitcoin-org-dns-hijack-replaces-site-with-btc-doubler-scam/#:~:text=The%20WHOIS%20info%20was%20updated%20at%20the%20time%20of%20the%20hack) — trust can evaporate no matter how strong the rest of the stack is.

[Namefi](https://namefi.io) adds a token-control layer for supported domains, making wallet ownership and token transfers publicly auditable [on-chain](/en/glossary/on-chain/). That does **not** turn nameserver or DNS-record changes into on-chain events. As Namefi's [DNS guide explains](https://namefi.io/r/en/blog/dns-on-tokenized-domains), DNS resolution and the token are separate layers; DNS changes still require registrar/DNS-provider controls and monitoring. Token history can answer whether the token moved, while DNSSEC, registry or registrar locks, MFA, alerting, and provider audit logs address whether routing changed.

Bitcoin.org spent thirteen years teaching the world that the dangerous moment is the one where you stop verifying and start trusting. For a few hours in September 2021, its own domain proved the lesson the hard way. The takeaway for everyone else is simpler than it sounds: your domain is your identity on the internet — guard the name as carefully as you guard the keys behind it.

## Sources and further reading

- BleepingComputer — [Bitcoin.org hackers steal $17,000 in 'double your cash' scam](https://www.bleepingcomputer.com/news/security/bitcoinorg-hackers-steal-17-000-in-double-your-cash-scam/)
- CoinDesk — [Bitcoin.org Website Inaccessible After Being Hacked by Apparent Giveaway Scam](https://www.coindesk.com/tech/2021/09/23/bitcoinorg-appears-hacked-by-giveaway-scam/)
- Bitcoin.com News — [Hackers Compromise Web Portal Bitcoin.org — DNS Hijack Replaces Site With BTC Doubler Scam](https://news.bitcoin.com/hackers-compromise-web-portal-bitcoin-org-dns-hijack-replaces-site-with-btc-doubler-scam/)
- Decrypt — [Bitcoin.org Compromised, Fraudulent Crypto Giveaway Advertised](https://decrypt.co/81612/bitcoin-org-compromised-fraudulent-crypto-giveaway-advertised/)
- Cointelegraph — [Bitcoin.org goes offline after suffering scam attack](https://cointelegraph.com/news/bitcoin-org-goes-offline-after-suffering-scam-attack)
- CryptoPotato — [BitcoinOrg Hacked: Giveaway Scam Promising Users to Double Their BTC](https://cryptopotato.com/bitcoinorg-hacked-giveaway-scam-promising-users-to-double-their-btc/)
- NewsBTC — [Bitcoin.org Hacked By Scammers For A Few Minutes. Someone Sent Them 0.4 BTC](https://www.newsbtc.com/news/bitcoin-org-hacked-by-scammers/)
- CoinDesk — [UK Court Orders Bitcoin.org to Remove White Paper Following Craig Wright Lawsuit](https://www.coindesk.com/markets/2021/06/29/uk-court-orders-bitcoinorg-to-remove-white-paper-following-craig-wright-lawsuit)
- Wikipedia — [Bitcoin (history of the bitcoin.org domain)](https://en.wikipedia.org/wiki/Bitcoin)
- Namefi — [DNS on Tokenized Domains](https://namefi.io/r/en/blog/dns-on-tokenized-domains) (DNS and on-chain token as separate layers)
