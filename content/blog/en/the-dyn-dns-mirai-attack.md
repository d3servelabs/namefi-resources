---
title: 'The Dyn DNS Attack: When a Mirai Botnet of Hacked Cameras Broke Half the Internet'
date: '2026-06-17'
language: en
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
cluster: domain-security
series: domain-apocalypse
seriesOrder: 11
format: case-study
description: 'On October 21, 2016, a DDoS attack powered by the Mirai IoT botnet hit DNS provider Dyn in three waves, knocking Twitter, Netflix, Reddit, Spotify, GitHub, Airbnb and PayPal offline for hours — a Domain Mayday case study in DNS provider concentration.'
keywords: ['dyn dns attack', 'mirai botnet', 'october 21 2016 ddos', 'dns ddos attack', 'iot botnet', 'dns provider outage', 'domain security', 'dns single point of failure', 'dyn ddos 2016', 'mirai malware', 'internet outage 2016', 'dns redundancy', 'hacked iot cameras']
relatedArticles:
  - /en/blog/the-godaddy-multi-year-breach/
  - /en/blog/the-curve-finance-dns-hijack/
  - /en/blog/the-fox-it-dns-hijack/
  - /en/blog/the-myetherwallet-bgp-dns-attack/
  - /en/blog/the-lenovo-com-dns-hijack/
relatedTopics:
  - /en/topics/domain-security/
  - /en/topics/domain-basics/
relatedSeries:
  - /en/series/domain-apocalypse/
  - /en/series/name-change-game-change/
relatedGlossary:
  - /en/glossary/dns/
  - /en/glossary/registrar/
  - /en/glossary/icann/
  - /en/glossary/tld/
  - /en/glossary/web3/
---

For a few hours on a Friday in October 2016, the internet forgot how to find itself.

Twitter loaded a blank page. Netflix spun and gave up. Reddit, Spotify, GitHub, Airbnb, PayPal — all there, all online, all running perfectly fine on their own servers, and all completely unreachable. Nothing was hacked. No data was stolen. The websites were exactly where they had always been. What broke was the part of the internet that *tells you where things are*.

The attack didn't hit Twitter or Netflix. It hit a company most of their users had never heard of: **Dyn**, a New Hampshire firm that ran DNS — the internet's address book — for a large slice of the modern web. And the weapon wasn't a server farm or a nation-state arsenal. It was a swarm of hacked baby monitors, webcams, and home routers: ordinary household gadgets, quietly conscripted into an army called **Mirai**.

This is **Domain Mayday EP08** — the day insecure smart-cameras took down the internet's phone book.

## DNS: the internet's phone book, and Dyn's place in it

Every time you type a domain name, your computer has to translate it into a numeric [IP address](/en/glossary/ip-address/) before it can connect to anything. That translation is the job of DNS, the [Domain Name System](/en/glossary/dns/). It is the lookup layer between the human-friendly name and the machine the name points to.

Dyn was one of the big managed providers of that lookup service. When a site outsourced its DNS to Dyn, Dyn's nameservers became the authoritative source for "where does this domain live?" The Register put the dependency plainly during the attack: by blasting Dyn offline, the public DNS resolvers run by Google and ISPs were [unable to contact Dyn to lookup hostnames for netizens, preventing people from accessing sites using Dyn for DNS](https://www.theregister.com/2016/10/21/dns_devastation_as_dyn_dies_under_denialofservice_attack/#:~:text=unable%20to%20contact%20Dyn%20to%20lookup%20hostnames).

That is the quiet fragility at the center of this story. A website can be flawless — redundant servers, perfect uptime, world-class engineers — and still vanish from the internet if the one provider answering "where is it?" goes dark. As Carnegie Mellon's CyLab later summarized, the affected domains were [critically dependent on Dyn, a third-party DNS. In other words, they relied solely on Dyn, so when Dyn went down, so did they](https://cylab.cmu.edu/news/2020/10/30-dynattack.html#:~:text=critically%20dependent%20on%20Dyn).

## October 21, 2016: the attack came in waves

![Vivid colorful concept art of a tidal wave of glowing junk traffic crashing over a giant illuminated phone-book switchboard, the directory lights flickering out across a dark map](../../assets/the-dyn-dns-mirai-attack-01-attack.jpg)

The assault began on the morning of Friday, October 21, 2016, and it did not arrive as one blow. It came in distinct waves over the course of the day.

Wikipedia's record of the incident lists [three consecutive distributed denial-of-service attacks](https://en.wikipedia.org/wiki/DDoS_attacks_on_Dyn#:~:text=three%20consecutive%20distributed%20denial%2Dof%2Dservice%20attacks) against Dyn, beginning around 11:10 UTC. The mechanics were a textbook distributed denial-of-service: the [DDoS attack was accomplished through numerous DNS lookup requests from tens of millions of IP addresses](https://en.wikipedia.org/wiki/DDoS_attacks_on_Dyn#:~:text=numerous%20DNS%20lookup%20requests%20from%20tens%20of%20millions%20of%20IP%20addresses), drowning Dyn's nameservers in so much junk traffic that legitimate lookups couldn't get through.

The waves are what made it feel relentless. The Register, covering it live, described the moment Dyn seemed to recover — and then didn't: [after two hours into the initial tidal wave of junk traffic, Dyn announced it had mitigated the assault and service was returning to normal. But the relief was short lived: just about an hour later, the attack resumed](https://www.theregister.com/2016/10/21/dns_devastation_as_dyn_dies_under_denialofservice_attack/#:~:text=After%20two%20hours%20into%20the%20initial%20tidal%20wave). What looked like the end was just the gap between rounds.

In raw volume, the attack was enormous for its era — among the largest DDoS events seen up to that point, with The Register characterizing the peak as [more than 1TBps](https://www.theregister.com/2017/11/07/mirai_botnet_sitrep/#:~:text=more%20than%201TBps). (Dyn itself cautioned that a "retry storm" of legitimate traffic inflated some early estimates, a point we'll return to.)

## Which sites went dark — and how it felt

When Dyn's nameservers couldn't answer, the failure rippled outward to everyone who depended on them. This wasn't an obscure corner of the web. It was the front page of the consumer internet.

The Register's live report named some of the casualties directly: an extraordinary, focused attack on Dyn that continued to [disrupt internet services for hundreds of companies, including online giants Twitter, Amazon, AirBnB, Spotify and others](https://www.theregister.com/2016/10/21/dns_devastation_as_dyn_dies_under_denialofservice_attack/#:~:text=disrupt%20internet%20services%20for%20hundreds%20of%20companies). Wikipedia's list of affected services reads like a who's-who of the era's biggest sites: [Airbnb, Amazon.com, CNN, GitHub, Netflix, PayPal, Reddit, Spotify, Twitter](https://en.wikipedia.org/wiki/DDoS_attacks_on_Dyn#:~:text=Airbnb), and dozens more.

Brian Krebs, whose own site had been hit by the same malware weeks earlier, described the consumer experience as the [attack began creating problems for Internet users reaching an array of sites, including Twitter, Amazon, Tumblr, Reddit, Spotify and Netflix](https://krebsonsecurity.com/2016/10/hacked-cameras-dvrs-powered-todays-massive-internet-outage/#:~:text=an%20array%20of%20sites%2C%20including%20Twitter). For ordinary users, there was no error that made sense. Sites simply wouldn't load — first along the US East Coast, then spreading as the later waves hit, reaching users across the US and into Europe.

## How it happened: an army of insecure smart devices

![Vivid colorful concept art of thousands of tiny smiling hacked smart-cameras, toasters and baby monitors swarming like glowing insects toward a single overloaded directory tower](../../assets/the-dyn-dns-mirai-attack-02-mirai-botnet.jpg)

Here is the part that made the Dyn attack a turning point: the firepower didn't come from computers. It came from *things*.

Mirai is malware that hunts for Internet-of-Things devices — cameras, routers, DVRs — and hijacks them. It works by exploiting the laziest weakness in consumer hardware: the password the device shipped with. As The Register described it, Mirai spreads across the web, growing its ranks of obeying zombies, by [logging into devices using their default, factory-set passwords via Telnet and SSH](https://www.theregister.com/2016/10/21/dyn_dns_ddos_explained/#:~:text=logging%20into%20devices%20using%20their%20default%2C%20factory%2Dset%20passwords). Krebs put the mechanism just as bluntly: Mirai [scours the Web for IoT devices protected by little more than factory-default usernames and passwords, and then enlists the devices in attacks](https://krebsonsecurity.com/2016/10/hacked-cameras-dvrs-powered-todays-massive-internet-outage/#:~:text=scours%20the%20Web%20for%20IoT%20devices).

The devices at the heart of the Dyn attack were largely cheap webcams and DVRs. Krebs traced the botnet to [mainly compromised digital video recorders (DVRs) and IP cameras made by a Chinese hi-tech company called XiongMai Technologies](https://krebsonsecurity.com/2016/10/hacked-cameras-dvrs-powered-todays-massive-internet-outage/#:~:text=mainly%20compromised%20digital%20video%20recorders) — devices whose default credentials, in many cases, [a user cannot feasibly change](https://krebsonsecurity.com/2016/10/hacked-cameras-dvrs-powered-todays-massive-internet-outage/#:~:text=A%20user%20cannot%20feasibly%20change%20this%20password) because the password was hardcoded into the firmware.

Two things turned Mirai from a nuisance into a catastrophe. First, the malware's author had, [at the end September 2016, released the source code for it, effectively letting anyone build their own attack army](https://krebsonsecurity.com/2016/10/hacked-cameras-dvrs-powered-todays-massive-internet-outage/#:~:text=released%20the%20source%20code%20for%20it). Second, the population of vulnerable devices was vast. Dyn confirmed the attack's signature: the company was able to [confirm that a significant volume of attack traffic originated from Mirai-based botnets](https://www.bankinfosecurity.com/botnet-army-just-100000-iot-devices-disrupted-dyn-a-9486#:~:text=confirm%20that%20a%20significant%20volume%20of%20attack%20traffic%20originated%20from%20Mirai), and Wikipedia describes the botnet as a swarm of [Internet-connected devices—such as printers, IP cameras, residential gateways and baby monitors—that had been infected with the Mirai malware](https://en.wikipedia.org/wiki/DDoS_attacks_on_Dyn#:~:text=printers%2C%20IP%20cameras%2C%20residential%20gateways%20and%20baby%20monitors).

## The aftermath: counting the swarm — and the perpetrators

When the dust settled, even the basic question of *how big was it* turned out to be hard. Dyn's own post-incident analysis, via EVP Scott Hilton, estimated the botnet at [up to 100,000 malicious endpoints](https://www.bankinfosecurity.com/botnet-army-just-100000-iot-devices-disrupted-dyn-a-9486#:~:text=up%20to%20100%2C000%20malicious%20endpoints) — large, but smaller than the "tens of millions of IPs" some early figures suggested. The discrepancy came from a feedback loop: the malicious attacks were sourced from at least one botnet, [with the retry storm providing a false indicator of a significantly larger set of endpoints than we now know it to be](https://www.bankinfosecurity.com/botnet-army-just-100000-iot-devices-disrupted-dyn-a-9486#:~:text=with%20the%20retry%20storm%20providing%20a%20false%20indicator). In other words, the internet's own automatic "try again" behavior amplified the chaos.

The legal aftermath added a twist. The three young men behind Mirai — Paras Jha, Josiah White, and Dalton Norman — eventually [pleaded guilty for their role in creating, operating and selling access to the "Mirai botnet"](https://cyberscoop.com/mirai-botnet-charges-paris-jha-dalton-norman-josiah-white/#:~:text=pleaded%20guilty%20for%20their%20role%20in%20creating). But by the time of the Dyn attack, Jha had already released the source code publicly — and prosecutors and reporters have been careful to note that the Dyn attackers were not necessarily the original trio. As CyberScoop reported, it's [not yet clear, for example, who was behind most high profile Mirai-linked attack against internet performance management company Dyn](https://cyberscoop.com/mirai-botnet-charges-paris-jha-dalton-norman-josiah-white/#:~:text=not%20yet%20clear%2C%20for%20example%2C%20who%20was%20behind). Once the weapon was open-source, anyone could pull the trigger.

For Dyn, the business damage was real: in the months that followed, thousands of domains moved their DNS elsewhere, a costly lesson in customer trust after a single bad day.

## What this teaches about DNS provider concentration

The Dyn attack is remembered as an IoT-security story, and it is one. But its deeper lesson is about *architecture*: the danger of routing too much of the internet through one chokepoint.

Every site that went dark on October 21 had made the same reasonable-looking decision — outsource DNS to a single excellent provider. Individually, smart. Collectively, it meant that knocking out one company could blank out a meaningful fraction of the web at once. CyLab's verdict was that the lessons from the attack [have only been acted upon by a handful of websites that were directly impacted](https://cylab.cmu.edu/news/2020/10/30-dynattack.html#:~:text=have%20only%20been%20acted%20upon%20by%20a%20handful), even years later.

The defensive answer is redundancy: spreading authoritative DNS across more than one provider so that no single outage is fatal. Two years after Dyn, The Register found this was still rare and still painful — Infoblox's Cricket Liu noted that it [hasn't gotten any easier to use multiple authoritative DNS providers, for example (say Dyn plus Verisign or Neustar). Being able to use multiple providers would make a big difference](https://www.theregister.com/2018/10/11/dns_insecurity_survey/#:~:text=hasn%27t%20gotten%20any%20easier%20to%20use%20multiple%20authoritative%20DNS%20providers). The takeaways for anyone who depends on a domain:

1. **A domain has more failure points than its [registrar](/en/glossary/registrar/).** The provider answering "where does this name point?" is just as load-bearing as the servers behind it.
2. **Single-provider DNS is a single point of failure.** Excellent uptime in normal conditions says nothing about behavior under a 1 Tbps flood.
3. **Concentration is convenient and fragile.** The same efficiency that makes one provider attractive makes its outage widely felt.
4. **Resilience is a property of ownership, not just hosting.** When something breaks, you need to control your domain's configuration cleanly enough to re-route fast.

## The Namefi angle

![Colorful illustration of verifiable, resilient domain ownership — a domain card secured by a green shield, a green Namefi token, and DNS continuity](../../assets/the-dyn-dns-mirai-attack-03-namefi-angle.jpg)

The Dyn attack didn't steal a single domain. It didn't forge a transfer or hijack a registrar account. And yet, for a few hours, the people who *owned* those domains effectively lost control of where their names pointed — not because their ownership was in doubt, but because the operational layer beneath their domains failed all at once.

That gap — between *owning* a name and *reliably controlling* where it resolves — is exactly the seam attacks like this exploit. Domains are among the most valuable assets a business holds, yet their control often sits behind opaque, centralized infrastructure that the owner can neither verify nor quickly reconfigure under pressure.

[Namefi](https://namefi.io) is built on the idea that domains should behave like internet-native assets: ownership that is cryptographically verifiable and portable, while staying fully compatible with DNS. Verifiable, owner-controlled [domain ownership](/en/glossary/domain-ownership/) doesn't stop a botnet — but it pushes the world toward an internet where control of a name is provable, auditable, and not silently dependent on one provider's worst day. The Mirai-Dyn attack is a reminder that a domain you "own" is only as resilient as the layer that answers for it. Resilience starts with making ownership and control something you can actually verify.

## Sources and further reading

- Krebs on Security — [Hacked Cameras, DVRs Powered Today's Massive Internet Outage](https://krebsonsecurity.com/2016/10/hacked-cameras-dvrs-powered-todays-massive-internet-outage/)
- Wikipedia — [DDoS attacks on Dyn](https://en.wikipedia.org/wiki/DDoS_attacks_on_Dyn)
- The Register — [DNS devastation: Top websites whacked offline as Dyn dies again](https://www.theregister.com/2016/10/21/dns_devastation_as_dyn_dies_under_denialofservice_attack/)
- The Register — [Today the web was broken by countless hacked devices: your 60-second summary](https://www.theregister.com/2016/10/21/dyn_dns_ddos_explained/)
- The Register — [Mirai, Mirai, pwn them all: who's the greatest botnet on the whole?](https://www.theregister.com/2017/11/07/mirai_botnet_sitrep/)
- The Register — [In the two years since Dyn went dark, what have we learned? Not much, it appears](https://www.theregister.com/2018/10/11/dns_insecurity_survey/)
- BankInfoSecurity — [Botnet Army of 'Up to 100,000' IoT Devices Disrupted Dyn](https://www.bankinfosecurity.com/botnet-army-just-100000-iot-devices-disrupted-dyn-a-9486)
- Carnegie Mellon CyLab — [Four years since the Mirai-Dyn attack… is the Internet safer?](https://cylab.cmu.edu/news/2020/10/30-dynattack.html)
- CyberScoop — [Three men plead guilty for roles in Mirai botnet empire](https://cyberscoop.com/mirai-botnet-charges-paris-jha-dalton-norman-josiah-white/)
