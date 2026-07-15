---
title: 'When ICANN Staff Got Phished: The 2014 CZDS Data Breach'
date: '2026-06-17'
language: en
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
cluster: domain-security
series: domain-apocalypse
seriesOrder: 14
format: case-study
description: 'In late 2014, spear-phishing emails spoofing ICANN''s domain harvested staff credentials and enabled administrative access to files in the Centralized Zone Data System. A close look at the copied gTLD zone data and user information that were exposed — and the critical IANA systems that were not affected.'
keywords: ['icann breach', 'icann spear phishing', 'czds', 'centralized zone data system', 'dns security', 'domain security', 'spear phishing attack', 'credential phishing', 'zone files', 'iana', 'salted password hashes', 'domain name system breach', 'icann 2014 hack']
relatedArticles:
  - /en/blog/the-godaddy-multi-year-breach/
  - /en/blog/the-fox-it-dns-hijack/
  - /en/blog/the-myetherwallet-bgp-dns-attack/
  - /en/blog/the-2024-squarespace-defi-domain-hijacks/
  - /en/blog/the-dnspionage-campaign/
relatedTopics:
  - /en/topics/domain-security/
  - /en/topics/domain-basics/
relatedSeries:
  - /en/series/domain-apocalypse/
  - /en/series/name-change-game-change/
relatedGlossary:
  - /en/glossary/icann/
  - /en/glossary/registrar/
  - /en/glossary/dns/
  - /en/glossary/tld/
  - /en/glossary/registry/
---

There is a special kind of headline that makes the whole security industry pause. Not "another retailer breached," not "another startup leaks a database" — but the day the institution everyone *else* trusts admits it got hacked the most ordinary way possible.

In December 2014, that institution was [ICANN](/en/glossary/icann/). The Internet Corporation for Assigned Names and Numbers — the nonprofit that coordinates the internet's system of unique identifiers through a multistakeholder model — disclosed that some staff had clicked a link in a fake email, typed their passwords into a fake login page, and exposed internal credentials. The attacker then obtained administrative access to files in the Centralized Zone Data System (CZDS), through which approved users request access to copies of generic top-level-domain zone files.

Staff at an organization central to internet naming got phished by emails pretending to be ICANN.

This is **EP11 of Domain Mayday** — and it is the episode where the call is coming from inside the house.

## Who ICANN is, and why a breach there is symbolic

To understand why this story landed so hard, you have to understand what ICANN actually does.

ICANN is not a company you buy a domain from. It sits one layer above that. It coordinates the global system of unique identifiers that makes the internet navigable: the top-level domains (`.com`, `.org`, `.io`, and the hundreds of newer ones), the rules registries and registrars follow, and — through its [IANA](/en/glossary/iana/) function — the very top of the DNS hierarchy, the [root zone](/en/glossary/root-zone/) that every other lookup ultimately depends on.

If domains are the addresses of the internet, ICANN helps coordinate the policies and identifier systems that keep those addresses unique. A breach at ICANN is symbolically important, but ICANN is not a single command center for every DNS record. In this incident, the compromised system distributed zone-file copies and stored requester information; it was not the root-zone control plane or a registrar ownership database.

## Late 2014: the compromise

![Vivid colorful concept art of a fraudulent official letter slipping past an identity-system guardian while protected data files glow behind the doorway](../../assets/the-icann-spear-phishing-breach-01-breach.jpg)

ICANN laid out the timeline in [its own public announcement](https://www.icann.org/en/announcements/details/icann-targeted-in-spear-phishing-attack--enhanced-security-measures-implemented-16-12-2014-en#:~:text=We%20believe%20a%20%22spear%20phishing%22%20attack%20was%20initiated%20in%20late%20November%202014.), published 16 December 2014, with admirable bluntness: "We believe a 'spear phishing' attack was initiated in late November 2014."

The mechanics were almost insultingly simple. As ICANN described it, the attack "[involved email messages that were crafted to appear to come from our own domain being sent to members of our staff](https://www.icann.org/en/announcements/details/icann-targeted-in-spear-phishing-attack--enhanced-security-measures-implemented-16-12-2014-en#:~:text=It%20involved%20email%20messages%20that%20were%20crafted%20to%20appear%20to%20come%20from%20our%20own%20domain%20being%20sent%20to%20members%20of%20our%20staff.)." Staff received emails that looked like they came from `icann.org` — from inside ICANN itself. Some clicked. As The Register reconstructed it, the employees "[clicked on a link in the messages that took them to a bogus login page – into which staff typed their usernames and passwords](https://www.theregister.com/security/2014/12/17/icann-hacked-intruders-poke-around-global-dns-innards/624044#:~:text=clicked%20on%20a%20link%20in%20the%20messages%20that%20took%20them%20to%20a%20bogus%20login%20page)," handing the attackers their work email credentials. The Register's dry verdict on the missing defense: "[No sign of two-factor authentication, then.](https://www.theregister.com/security/2014/12/17/icann-hacked-intruders-poke-around-global-dns-innards/624044#:~:text=No%20sign%20of%20two%2Dfactor%20authentication%2C%20then.)"

The result, in ICANN's own words: "[The attack resulted in the compromise of the email credentials of several ICANN staff members.](https://www.icann.org/en/announcements/details/icann-targeted-in-spear-phishing-attack--enhanced-security-measures-implemented-16-12-2014-en#:~:text=The%20attack%20resulted%20in%20the%20compromise%20of%20the%20email%20credentials%20of%20several%20ICANN%20staff%20members.)" Help Net Security put it more plainly still: "[Several staff members were fooled into handing over their email credentials](https://www.helpnetsecurity.com/2014/12/18/icann-systems-breached-via-spear-phishing-emails/#:~:text=Several%20staff%20members%20were%20fooled%20into%20handing%20over%20their%20email%20credentials)" to the attackers.

No zero-day. No exotic malware. A convincing email and a fake login box — the oldest trick on the internet, run against the people who help run the internet.

## What was accessed: CZDS files and user data

Stolen email credentials are bad on their own. The material additional exposure came from the files the attacker reached with them.

In early December 2014, ICANN discovered that compromised credentials had also been used to access other systems. The most serious was the **Centralized Zone Data System** — CZDS, the platform where approved parties request and download copies of zone files for generic top-level domains. ICANN's disclosure is stark: "[The attacker obtained administrative access to all files in the CZDS.](https://www.icann.org/en/announcements/details/icann-targeted-in-spear-phishing-attack--enhanced-security-measures-implemented-16-12-2014-en#:~:text=The%20attacker%20obtained%20administrative%20access%20to%20all%20files%20in%20the%20CZDS.)"

*Administrative* access to *all files* was a serious confidentiality breach. But CZDS contains distributable copies of gTLD zone files and requester records; administrative access to it does not by itself let an attacker edit the live root zone, change a domain's nameservers, or transfer domain ownership.

Beyond the zone-file copies, the breach exposed personal data entered by CZDS users. Per ICANN, the files "[included copies of the zone files in the system, as well as information entered by users such as name, postal address, email address, fax and telephone numbers, username, and password](https://www.icann.org/en/announcements/details/icann-targeted-in-spear-phishing-attack--enhanced-security-measures-implemented-16-12-2014-en#:~:text=This%20included%20copies%20of%20the%20zone%20files%20in%20the%20system%2C%20as%20well%20as%20information%20entered%20by%20users)." ICANN said the passwords were stored as salted cryptographic hashes rather than plaintext.

The credentials reached further, too. ICANN confirmed the attackers also touched the **GAC Wiki** (the Governmental Advisory Committee's space), the **ICANN Blog**, and the **[WHOIS](/en/glossary/whois/) information portal**, though it reported [no impact to the latter two systems](https://www.helpnetsecurity.com/2014/12/18/icann-systems-breached-via-spear-phishing-emails/#:~:text=The%20latter%20two%20were%20not%20affected%20in%20any%20way.) and only limited viewing on the wiki.

## How it happened: the badge that said "ICANN"

![Vivid colorful concept-art of a control tower for the domain name system at night, a single forged glowing badge stamped with a checkmark unlocking its doors while real guards stand by unaware, beams of red light leaking out](../../assets/the-icann-spear-phishing-breach-02-spear-phishing.jpg)

Strip away the technical layers and the attack is a confidence trick.

Spear phishing differs from ordinary phishing in its precision. It isn't a million spam emails hoping someone bites; it's a small number of carefully tailored messages aimed at specific people, designed to look like routine internal traffic. Here the disguise was the strongest possible one: the email appeared to come from `icann.org`. As The Register summarized, "[Attackers sent staff spoofed emails appearing to coming from icann.org.](https://www.theregister.com/security/2014/12/17/icann-hacked-intruders-poke-around-global-dns-innards/624044#:~:text=Attackers%20sent%20staff%20spoofed%20emails%20appearing%20to%20coming%20from%20icann.org.)"

Think about the psychology. An email from your own organization's domain doesn't trip alarms. A login page that looks like the one you use every day doesn't either. The whole attack exploited the fact that *internal* and *familiar* feel the same as *safe* — and they are not the same thing. The address bar said one thing; the page behind it harvested everything typed into it.

One mitigation was on the storage side: the CZDS passwords were not plaintext. As the disclosure notes, "[the passwords were stored as salted cryptographic hashes](https://www.icann.org/en/announcements/details/icann-targeted-in-spear-phishing-attack--enhanced-security-measures-implemented-16-12-2014-en#:~:text=Although%20the%20passwords%20were%20stored%20as%20salted%20cryptographic%20hashes)." Salting defeats precomputed lookup tables, while resistance to offline guessing also depends on the hashing algorithm, its work factor, and each user's password strength. ICANN deactivated CZDS passwords and required resets rather than treating the hashes as harmless.

## Response and aftermath

To its credit, ICANN handled the disclosure better than the breach.

It went public within weeks, deactivated CZDS passwords, notified affected users, and — notably — framed transparency as a duty rather than a liability. The organization said it was "[providing information about this incident publicly, not just because of our commitment to openness and transparency, but also because sharing of cybersecurity information helps all involved assess threats to their systems](https://www.icann.org/en/announcements/details/icann-targeted-in-spear-phishing-attack--enhanced-security-measures-implemented-16-12-2014-en#:~:text=providing%20information%20about%20this%20incident%20publicly%2C%20not%20just%20because%20of%20our%20commitment%20to%20openness%20and%20transparency)." It also reported that a security-enhancement program begun earlier that year had "[helped limit the unauthorized access obtained in the attack](https://www.icann.org/en/announcements/details/icann-targeted-in-spear-phishing-attack--enhanced-security-measures-implemented-16-12-2014-en#:~:text=these%20enhancements%20helped%20limit%20the%20unauthorized%20access%20obtained%20in%20the%20attack)."

The single most important boundary for the wider internet was what *didn't* fall. ICANN confirmed: "[this attack does not impact any IANA-related systems](https://www.icann.org/en/announcements/details/icann-targeted-in-spear-phishing-attack--enhanced-security-measures-implemented-16-12-2014-en#:~:text=this%20attack%20does%20not%20impact%20any%20IANA%2Drelated%20systems)." IANA performs root-zone management functions, so access there would have presented a materially different risk from the confidentiality breach in CZDS. ICANN reported no such access.

The timing made the embarrassment worse. The Register's headline deck called it bluntly: the "[Spear-phishing attack timing couldn't be worse for domain name overseer](https://www.theregister.com/security/2014/12/17/icann-hacked-intruders-poke-around-global-dns-innards/624044#:~:text=Spear%2Dphishing%20attack%20timing%20couldn%27t%20be%20worse%20for%20domain%20name%20overseer)." Why? Because ICANN "[hopes to be handed control of the critical IANA contract next year](https://www.theregister.com/security/2014/12/17/icann-hacked-intruders-poke-around-global-dns-innards/624044#:~:text=it%20will%20prove%20extremely%20embarrassing%20to%20ICANN%2C%20which%20hopes%20to%20be%20handed%20control%20of%20the%20critical%20IANA%20contract%20next%20year)" — the very stewardship transition that was then under negotiation. Getting phished is a poor audition for "trust us with the heart of the DNS." (For context, this also wasn't ICANN's first CZDS scare in 2014: The Register noted an earlier April incident in which "[a number of users were wrongly given admin access to the system](https://www.theregister.com/security/2014/12/17/icann-hacked-intruders-poke-around-global-dns-innards/624044#:~:text=a%20number%20of%20users%20were%20wrongly%20given%20admin%20access%20to%20the%20system).")

And the data had a long afterlife. In a 21 February 2017 update appended to its own announcement, ICANN acknowledged that information from the breach was resurfacing: "[some information obtained in the spear phishing incident we announced in 2014 is being offered for sale on underground forums](https://www.icann.org/en/announcements/details/icann-targeted-in-spear-phishing-attack--enhanced-security-measures-implemented-16-12-2014-en#:~:text=some%20information%20obtained%20in%20the%20spear%20phishing%20incident%20we%20announced%20in%202014%20is%20being%20offered%20for%20sale%20on%20underground%20forums)." CyberScoop reported the going rate years on: "[the data is still being passed around and sold on black markets for $300](https://cyberscoop.com/hacked-icann-data-still-sells-hundreds-dollars-years-breach/#:~:text=the%20data%20is%20still%20being%20passed%20around%20and%20sold%20on%20black%20markets%20for%20%24300)," complete with claims it had never leaked before. A single click in late 2014 was still generating sales in 2017.

## What this teaches: privileged identities need layered protection

The lesson of EP11 is not "ICANN was careless." It's something more humbling.

**Everyone can be targeted by phishing.** An organization that coordinates internet identifiers still had several employees enter credentials into a fake page because the email looked internal. Training matters, but privileged access should be designed on the assumption that a convincing message will eventually succeed.

A few durable takeaways fall out of this:

1. **Credentials are the perimeter.** The attackers never broke ICANN's cryptography or exploited a server flaw. They borrowed a password. Once identity is the gate, stolen identity is the breach — which is exactly why phishing remains the most reliable attack in the world.
2. **Multi-factor authentication is important for privileged systems.** The Register noted that it saw "[no sign of two-factor authentication](https://www.theregister.com/security/2014/12/17/icann-hacked-intruders-poke-around-global-dns-innards/624044#:~:text=No%20sign%20of%20two%2Dfactor%20authentication%2C%20then.)." A phishing-resistant second factor can block many stolen-password attacks, although the outcome depends on the identity flow and the factor used.
3. **Credential scope is a multiplier.** Compromised staff credentials were able to reach CZDS and several other portals. Segmenting access, requiring separate privileged authentication, and applying least privilege can contain that blast radius.
4. **Breached data is forever.** The 2017 resale proves that "we reset the passwords" closes the incident but not the exposure. Names, addresses, and phone numbers don't get un-leaked.
5. **Institutional importance is not immunity.** Coordinating critical identifiers does not make an organization immune to ordinary credential attacks. It makes strong access boundaries more important.

## The Namefi angle

![Colorful illustration of verifiable, tamper-resistant domain ownership — a domain card secured by a green shield, a green Namefi token, and DNS continuity](../../assets/the-icann-spear-phishing-breach-03-namefi-angle.jpg)

The ICANN breach was a compromise of staff email credentials followed by access to CZDS files and user records. It was not a compromise of domain-owner proof, the root zone, or live DNS administration; ICANN explicitly reported that no IANA-related system was affected.

[Namefi](https://namefi.io) represents [domain ownership](/en/glossary/domain-ownership/) through an [on-chain](/en/glossary/on-chain/) token layer. That can make the tokenized ownership state independently auditable, but it would not have prevented phished ICANN credentials from opening CZDS or protected the personal data and zone-file copies stored there. The relevant controls for this incident are phishing-resistant authentication, least-privilege access, separation of staff and privileged identities, monitoring, and careful protection of CZDS user data.

The durable lesson is not that every naming-system function should move on-chain. It is that each layer needs controls matched to its actual role and data.

## Sources and further reading

- ICANN — [ICANN Targeted in Spear Phishing Attack | Enhanced Security Measures Implemented](https://www.icann.org/en/announcements/details/icann-targeted-in-spear-phishing-attack--enhanced-security-measures-implemented-16-12-2014-en) (primary source, including the 2017 update)
- The Register — [ICANN HACKED: Intruders poke around global DNS innards](https://www.theregister.com/security/2014/12/17/icann-hacked-intruders-poke-around-global-dns-innards/624044)
- Help Net Security — [ICANN systems breached via spear-phishing emails](https://www.helpnetsecurity.com/2014/12/18/icann-systems-breached-via-spear-phishing-emails/)
- Computerworld — [ICANN data compromised in spearphishing attack](https://www.computerworld.com/article/1487605/icann-data-compromised-in-spearphishing-attack.html)
- WeLiveSecurity (ESET) — [ICANN computers compromised by hackers](https://www.welivesecurity.com/2014/12/18/icann-computers-compromised-hackers/)
- Associations Now — [ICANN Systems Infiltrated in "Spear Phishing" Attack](https://associationsnow.com/2014/12/icann-systems-infiltrated-spear-phishing-attack/)
- Slate — [ICANN Got Hacked](https://slate.com/technology/2014/12/icann-hacked-in-spear-phishing-campaign.html)
- Domain Incite — [Hacked ICANN data for sale on black market](http://domainincite.com/21562-hacked-icann-data-for-sale-on-black-market)
- Slashdot — [Hackers Compromise ICANN, Access Zone File Data System](https://tech.slashdot.org/story/14/12/18/1540233/hackers-compromise-icann-access-zone-file-data-system)
- CyberScoop — [Hacked ICANN data still sells for hundreds of dollars years after breach](https://cyberscoop.com/hacked-icann-data-still-sells-hundreds-dollars-years-breach/)
- DomainGang — [ICANN alerts users of CZDS & ICANN Wiki about security breach](https://domaingang.com/domain-news/icann-alerts-users-czds-icann-wiki-security-breach/)
