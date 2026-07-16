---
title: 'Domain Mayday EP10: How the Syrian Electronic Army Took Down NYTimes.com Through a Phished Reseller'
date: '2026-06-17'
language: en
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['fenwei-bian']
editors: ['victor-zhou']
draft: false
cluster: domain-security
series: domain-apocalypse
seriesOrder: 23
format: case-study
description: 'On August 27, 2013, the Syrian Electronic Army phished a Melbourne IT reseller, rewrote the DNS records for nytimes.com and Twitter''s domains, and took the New York Times offline for hours. A deep dive into how a registrar-chain weak link became a newspaper''s front-door failure — and what registry locks would have changed.'
keywords: ['nytimes.com hack', 'syrian electronic army', 'melbourne it', 'dns hijack', 'domain hijacking', 'registrar security', 'reseller phishing', 'registry lock', 'dns records', 'domain name server attack', 'twitter dns 2013', 'domain security', 'serverupdateprohibited']
relatedArticles:
  - /en/blog/the-fox-it-dns-hijack/
  - /en/blog/the-lenovo-com-dns-hijack/
  - /en/blog/the-godaddy-multi-year-breach/
  - /en/blog/the-panix-com-domain-hijack/
  - /en/blog/the-curve-finance-dns-hijack/
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
  - /en/glossary/registry/
  - /en/glossary/tld/
---

A newspaper's domain name is its front door. When you type `nytimes.com`, you are trusting an invisible chain — a domain registry, a [registrar](/en/glossary/registrar/), sometimes a [reseller](/en/glossary/reseller/) underneath that registrar — to point you at the real newsroom and nowhere else. On a normal day you never think about that chain. On August 27, 2013, it broke, and millions of readers walked up to the front door of *The New York Times* to find it had been swapped for someone else's.

The someone else was the **Syrian Electronic Army** (SEA), a pro-Assad hacker collective that spent 2013 picking off Western media outlets. This time they did not deface a single article or break into a content management system. They went one level deeper — into the **DNS records** that decide where a domain points — and for a few hours they owned the address of one of the most-read news sites on the planet.

## A domain is the front door, and the front door has a lock you don't control

When a company like *The New York Times* registers a domain, the authoritative record of "who owns this and where does it point" lives at the [registry](/en/glossary/registry/) (for `.com`, that is Verisign) and is managed through a **registrar**. Large registrars also sell through **resellers** — smaller firms that resell domain services and hold their own login to the registrar's systems.

That layering is convenient. It is also a chain of trust where the weakest link sets the security of the whole thing. If an attacker can authenticate as *anyone* in that chain — [registrant](/en/glossary/registrant/), registrar staff, or reseller — the registrar's systems will, by design, treat them as the legitimate owner. Melbourne IT's own chief executive put the failure mode in one devastating sentence: ["They came in through the front door,"](https://www.theregister.com/2013/08/27/twitter_ny_times_in_domain_hijack/#:~:text=They%20came%20in%20through%20the%20front%20door) he told the AP. If you have a valid username and password, the system assumes you are the authorized owner. That is the whole problem in a nutshell.

## August 27, 2013: the day nytimes.com pointed somewhere else

![Vivid colorful concept art of a giant newspaper front-door sign being unbolted and re-hung over a different doorway, glowing red routing arrows pulling a crowd of readers off course into a dark side alley](../../assets/the-syrian-electronic-army-nyt-hijack-01-hijack.jpg)

Late on a Tuesday afternoon, readers stopped reaching the *Times*. [The New York Times website had "gone dark for some users,"](https://abcnews.com/Technology/york-times-website-suspects-malicious-hack/story?id=20087043#:~:text=gone%20dark%20for%20some%20users) ABC News reported, and the paper confirmed [its site was "unavailable to readers on Tuesday afternoon"](https://abcnews.com/Technology/york-times-website-suspects-malicious-hack/story?id=20087043#:~:text=unavailable%20to%20readers%20on%20Tuesday%20afternoon) following an attack on its domain registrar. This was not a brief blip. [Visitors "were greeted with blank browser screens for several hours on Tuesday,"](https://www.csmonitor.com/USA/2013/0827/New-York-Times-hacked-Syrian-Electronic-Army-takes-credit#:~:text=greeted%20with%20blank%20browser%20screens%20for%20several%20hours) the Christian Science Monitor reported — and to make it worse, [it was "the second time this month"](https://abcnews.com/Technology/york-times-website-suspects-malicious-hack/story?id=20087043#:~:text=second%20time%20this%20month) the site had gone down.

What had actually happened was a **DNS hijack** at the registrar level. The attackers reached into the records that translate `nytimes.com` into an [IP address](/en/glossary/ip-address/) and rewrote them. Per Wikipedia's account of the incident, [`NYTimes.com` "had its DNS redirected to a page that displayed the message 'Hacked by SEA'"](https://en.wikipedia.org/wiki/Syrian_Electronic_Army#:~:text=had%20its%20DNS%20redirected%20to%20a%20page%20that%20displayed%20the%20message). The front door had been re-hung over a different doorway.

The *Times* was not the only target on that account. TechCrunch, reporting in real time, found that [both "The New York Times and Twitter name servers appear to have been registered through the registrar Melbourne IT,"](https://techcrunch.com/2013/08/27/syrian-electronic-army-apparently-hacks-dns-records-of-twitter-new-york-times-through-registrar-melboune-it/#:~:text=name%20servers%20appear%20to%20have%20been%20registered%20through%20the%20registrar%20Melbourne%20IT) and that [the `twimg.com` domain, "which serves up Twitter images and avatars, also shows changes that point to servers that are apparently SEA-owned."](https://techcrunch.com/2013/08/27/syrian-electronic-army-apparently-hacks-dns-records-of-twitter-new-york-times-through-registrar-melboune-it/#:~:text=which%20serves%20up%20Twitter%20images%20and%20avatars) Twitter's main site survived largely intact, but its image-and-avatar domain wobbled — enough that some users briefly saw broken images.

## The impact: hours of darkness, and a redirect you couldn't trust

For a news organization, the cost of a hijack is not measured only in lost pageviews. It is measured in trust. For the duration of the outage, anyone reaching `nytimes.com` was being routed by the attacker. The *Times'* own chief information officer, Mark Frons, told staff the disruption ["was the result of a malicious external attack by the Syrian Electronic Army or someone trying very hard to be them"](https://www.csmonitor.com/USA/2013/0827/New-York-Times-hacked-Syrian-Electronic-Army-takes-credit#:~:text=was%20the%20result%20of%20a%20malicious%20external%20attack) — and warned employees to be cautious with email while the domain was out of the paper's hands.

Think about what a hijacked DNS record actually enables. The attacker controls where the name resolves, which means they can serve a defacement page (as they did), but they could just as easily serve a convincing fake login, harvest credentials, or intercept traffic. A defacement is loud and obvious. A *quiet* DNS hijack is far more dangerous — and the same weakness enables both. The Huffington Post UK's domain was caught up in the same incident, underscoring that this was a registrar-account compromise, not a one-off prank against a single newsroom.

## How it happened: phish the reseller, not the newspaper

![Vivid colorful concept art of a phished golden key sliding into a glowing control-room door labeled with abstract routing dials, a shadowy hand rewriting a luminous ledger of address arrows while a fake email envelope dissolves into the lock](../../assets/the-syrian-electronic-army-nyt-hijack-02-reseller-phish.jpg)

Here is the part worth sitting with: the SEA never had to break into *The New York Times*. They never touched the paper's servers or its CMS. They attacked the chain *beneath* the registrar.

The entry point was a **spear-phishing email** sent to a US-based reseller of Melbourne IT. As The Next Web reported, [Melbourne IT "confirmed that the SEA used phishing tactics to get hold of the log-in details"](http://thenextweb.com/news/this-is-how-the-syrian-electronic-army-hacked-the-new-york-times-and-twitter#:~:text=used%20phishing%20tactics%20to%20get%20hold%20of%20the%20log) — staff at the reseller were tricked into handing over their email credentials, and the attackers then mined those mailboxes for the registrar logins. From there it was simple: [the credentials "of a Melbourne IT reseller (username and password) were used to access a reseller account on Melbourne IT's systems,"](https://techcrunch.com/2013/08/27/syrian-electronic-army-apparently-hacks-dns-records-of-twitter-new-york-times-through-registrar-melboune-it/#:~:text=credentials%20of%20a%20Melbourne%20IT%20reseller) and once inside, [the attackers "changed the DNS records of several domain names ... including those for *The Times*."](https://www.itnews.com.au/news/melbourne-it-compromise-redirects-ny-times-huffpo-readers-354935#:~:text=changed%20the%20DNS%20records%20of%20several%20domain%20names)

TechCrunch's account is equally blunt: [the "DNS records of several domain names on that reseller account were changed – including `nytimes.com`."](https://techcrunch.com/2013/08/27/syrian-electronic-army-apparently-hacks-dns-records-of-twitter-new-york-times-through-registrar-melboune-it/#:~:text=DNS%20records%20of%20several%20domain%20names%20on%20that%20reseller%20account%20were%20changed)

This is the asymmetry that makes registrar-chain attacks so attractive. The *Times* could harden its own infrastructure to the moon and it would not matter, because the vulnerable account belonged to a third-party reseller several steps removed from the newsroom. A spear-phish against a few employees at one small company was enough to redirect a newspaper read by millions.

## Response and aftermath

Once Melbourne IT understood what had happened, the remediation was straightforward — and it shows how reversible these attacks are *if you control the registrar*. The company restored the correct settings: it [reverted the altered DNS records and "locked" them down against further alteration](https://www.itnews.com.au/news/melbourne-it-compromise-redirects-ny-times-huffpo-readers-354935#:~:text=reverted%20the%20altered%20DNS%20records). It changed the password on the compromised reseller account and pulled logs to trace the intrusion. The *Times* restored service by early Wednesday.

But the most instructive detail in the whole episode is *why the damage stopped where it did*. Some domains on that same reseller account were never affected at all — because their owners had turned on a stronger protection. In Melbourne IT's own words, [for "mission critical names we recommend that domain name owners take advantage of additional registry lock features available from domain name registries including .com – some of the domain names targeted on the reseller account had these lock features active and were thus not affected."](https://www.theregister.com/2013/08/27/twitter_ny_times_in_domain_hijack/#:~:text=For%20mission%20critical%20names%20we%20recommend%20that%20domain%20name%20owners%20take%20advantage%20of%20additional%20registry%20lock)

A registry lock places the domain in a state (you can see it in [WHOIS](/en/glossary/whois/) as flags like `serverUpdateProhibited`) where the registry will refuse changes unless a stricter, out-of-band process is followed. As domain-industry watchers noted at the time, Twitter's records carried exactly that kind of [Verisign-lock status](https://domainnamewire.com/2013/08/27/melbourneit-the-weak-link-as-twitter-and-ny-times-domain-names-compromised/#:~:text=serverUpdateProhibited). A phished reseller password is not enough to defeat a [registry lock](/en/glossary/registry-lock/) — and that single configuration choice is the line between "down for hours" and "never affected."

## What this teaches about registrar and reseller chains, and registry locks

The August 27 hijack is a near-perfect teaching case because every link in the failure chain is visible.

1. **Your domain is only as secure as the weakest account that can change it.** That includes your registrar's staff and any reseller beneath them — none of which you control directly. The *Times* did nothing wrong on its own servers; the compromise was several steps removed.
2. **Phishing beats firewalls.** No exotic exploit was used. A fake email to a handful of reseller employees produced credentials that the registrar's systems treated as fully authorized. ["They came in through the front door."](https://www.theregister.com/2013/08/27/twitter_ny_times_in_domain_hijack/#:~:text=They%20came%20in%20through%20the%20front%20door)
3. **Registry lock is the control that actually mattered.** The domains with [additional registry lock features](https://www.theregister.com/2013/08/27/twitter_ny_times_in_domain_hijack/#:~:text=additional%20registry%20lock%20features) "were thus not affected." For any mission-critical domain, registry lock (plus registrar-lock and 2FA on the registrar account) is not optional hardening — it is the baseline.
4. **DNS changes are powerful and fast.** A single rewrite of name-server or A records redirects an entire brand instantly. The blast radius of one compromised account is every domain it can touch.
5. **Monitor your own records.** WHOIS and DNS monitoring would have flagged the unauthorized change in minutes. The earlier you notice an unexpected name-server change, the smaller the outage.

## The Namefi angle

![Colorful illustration of verifiable, tamper-resistant domain ownership — a domain card secured by a green shield, a green Namefi token, and DNS continuity](../../assets/the-syrian-electronic-army-nyt-hijack-03-namefi-angle.jpg)

The SEA hijack was a **DNS-administration authority** problem. Phished reseller credentials let the attackers submit changes that Melbourne IT's systems accepted. Registry locks, out-of-band confirmation, least privilege, and monitoring raise the bar for those specific DNS and registry operations.

[Namefi](https://namefi.io) provides an [on-chain](/en/glossary/on-chain/) layer for [domain ownership](/en/glossary/domain-ownership/) and token transfer. That can make the tokenized ownership state independently auditable, but the DNS and registry layers remain separate. A compromised reseller or registrar path can change nameservers or other registry data while the on-chain ownership token remains unchanged; tokenization alone would not have prevented or necessarily exposed the *Times* redirect.

A newspaper's domain is its front door. The lesson of August 27, 2013 is to protect every organization and account that can change its delegation, and to use registry-level update controls and monitoring rather than treating ownership verification as a substitute for DNS security.

## Sources and further reading

- The Register — [New York Times, Twitter domain hijackers 'came in through front door'](https://www.theregister.com/2013/08/27/twitter_ny_times_in_domain_hijack/)
- TechCrunch — [Syrian Electronic Army Apparently Hacks DNS Records Of Twitter, NYT Through Registrar Melbourne IT](https://techcrunch.com/2013/08/27/syrian-electronic-army-apparently-hacks-dns-records-of-twitter-new-york-times-through-registrar-melboune-it/)
- ABC News — [New York Times Website Hacked, Syrian Electronic Army Appears to Take Credit](https://abcnews.com/Technology/york-times-website-suspects-malicious-hack/story?id=20087043)
- Christian Science Monitor — [New York Times hacked, Syrian Electronic Army takes credit](https://www.csmonitor.com/USA/2013/0827/New-York-Times-hacked-Syrian-Electronic-Army-takes-credit)
- iTnews — [Melbourne IT compromise redirects NY Times, HuffPo readers](https://www.itnews.com.au/news/melbourne-it-compromise-redirects-ny-times-huffpo-readers-354935)
- The Next Web — [Here's How the New York Times and Twitter Got Hacked](http://thenextweb.com/news/this-is-how-the-syrian-electronic-army-hacked-the-new-york-times-and-twitter)
- Domain Name Wire — [Melbourne IT the weak link as Twitter and NY Times domain names compromised](https://domainnamewire.com/2013/08/27/melbourneit-the-weak-link-as-twitter-and-ny-times-domain-names-compromised/)
- Wikipedia — [Syrian Electronic Army](https://en.wikipedia.org/wiki/Syrian_Electronic_Army)
- NBC News — [Syrian group hacks Twitter, New York Times](https://www.nbcnews.com/id/wbna52864470)
- Al Jazeera — [Syria hackers target New York Times website](https://www.aljazeera.com/news/2013/8/28/syria-hackers-target-new-york-times-website)
