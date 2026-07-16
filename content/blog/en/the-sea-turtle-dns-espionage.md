---
title: 'Sea Turtle: The State-Sponsored Campaign That Hijacked DNS to Spy on Governments'
date: '2026-06-17'
language: en
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['aileen-wright']
editors: ['victor-zhou']
draft: false
cluster: domain-security
series: domain-apocalypse
seriesOrder: 20
format: case-study
description: 'How "Sea Turtle," a state-sponsored campaign disclosed by Cisco Talos in 2019, hijacked DNS through registrars, registries, and DNS providers — redirecting governments, ministries, and energy firms to attacker servers, obtaining CA-signed and other certificates for interception, and breaching a national TLD registry.'
keywords: ['sea turtle dns hijacking', 'cisco talos sea turtle', 'dns hijacking attack', 'state-sponsored dns attack', 'registry compromise', 'registrar compromise', 'dns espionage campaign', 'lets encrypt mitm certificate', 'netnod compromise', 'ics-forth greece ccTLD', 'cisa emergency directive 19-01', 'dns security', 'domain ownership security', 'nation state cyberattack']
relatedArticles:
  - /en/blog/the-dnspionage-campaign/
  - /en/blog/the-fox-it-dns-hijack/
  - /en/blog/the-godaddy-multi-year-breach/
  - /en/blog/the-myetherwallet-bgp-dns-attack/
  - /en/blog/the-curve-finance-dns-hijack/
relatedTopics:
  - /en/topics/domain-security/
  - /en/topics/domain-basics/
relatedSeries:
  - /en/series/domain-apocalypse/
  - /en/series/name-change-game-change/
relatedGlossary:
  - /en/glossary/dns/
  - /en/glossary/registrar/
  - /en/glossary/tld/
  - /en/glossary/icann/
  - /en/glossary/registry/
---

Most cyberattacks try to break *into* a target. The Sea Turtle campaign did something quieter and far more dangerous: it broke into the **map** that tells the entire internet where the target lives.

When you type a government ministry's web address, or send email to its officials, your computer first asks the [Domain Name System](/en/glossary/dns/) — DNS — to translate that human-readable name into the numeric address of the right server. Protections such as DNSSEC, TLS certificate validation, and routing security can verify parts of that path, but coverage and enforcement are uneven. Sea Turtle's operators exploited those gaps for more than two years to spy on governments across the Middle East and North Africa.

Disclosed by Cisco Talos in April 2019, Sea Turtle is one of the clearest case studies we have of DNS being weaponized as an instrument of nation-state espionage. The attackers went after the [registrars](/en/glossary/registrar/), registries, and DNS providers that sit *above* their targets. From that vantage point they rerouted traffic, harvested credentials, and used CA-signed, stolen, or self-signed certificates on interception servers. A CA-signed certificate was legitimately issued after domain validation; it was not a forged cryptographic signature.

## DNS as a target for nation-state espionage

DNS is sometimes called the phone book of the internet, but that undersells it. It's closer to the postal routing system: every email, every login, every API call begins by resolving a name. If you control the resolution, you control the destination — and you can sit invisibly in the middle of conversations that both sides believe are private and direct.

That makes DNS an almost perfect espionage target. Compromising one DNS provider can expose the traffic of every organization that depends on it. And unlike malware on an endpoint, DNS manipulation leaves the victim's own machines untouched: there's nothing to scan, nothing to quarantine. The records simply point somewhere new.

Talos was blunt about the mechanism. As their report put it, [DNS hijacking occurs when the actor can illicitly modify DNS name records to point users to actor-controlled servers](https://blog.talosintelligence.com/seaturtle/#:~:text=DNS%20hijacking%20occurs%20when%20the%20actor%20can%20illicitly%20modify%20DNS%20name%20records%20to%20point%20users%20to%20actor%2Dcontrolled%20servers). Simple to describe; devastating in practice.

## The Sea Turtle campaign (2017–2019)

![Vivid colorful concept art of a shadowy state actor silhouetted as a turtle quietly rerouting glowing arrows across a stylized map of a region, neon network lines bending toward hidden servers](../../assets/the-sea-turtle-dns-espionage-01-campaign.jpg)

Sea Turtle was not a smash-and-grab. Talos assessed that [the ongoing operation likely began as early as January 2017 and has continued through the first quarter of 2019](https://blog.talosintelligence.com/seaturtle/#:~:text=The%20ongoing%20operation%20likely%20began%20as%20early%20as%20January%202017%20and%20has%20continued%20through%20the%20first%20quarter%20of%202019) — more than two years of patient, persistent operations.

Over that span, by Talos's count, [at least 40 different organizations across 13 different countries were compromised during this campaign](https://blog.talosintelligence.com/seaturtle/#:~:text=at%20least%2040%20different%20organizations%20across%2013%20different%20countries%20were%20compromised%20during%20this%20campaign). TechCrunch summarized the reach: the group had [targeted 40 government and intelligence agencies, telecom firms and internet giants in 13 countries for more than two years](https://techcrunch.com/2019/04/17/sea-turtle-talos-dns-hijack/), with victims found across countries including [Armenia, along with Egypt, Turkey, Sweden, Jordan and the United Arab Emirates](https://techcrunch.com/2019/04/17/sea-turtle-talos-dns-hijack/).

Talos declined to publicly attribute the campaign to a specific government but was confident about the caliber of the operator. As Craig Williams of Cisco Talos told TechCrunch, [this is a new group that is operating in a relatively unique way that we have not seen before, using new tactics, techniques, and procedures](https://techcrunch.com/2019/04/17/sea-turtle-talos-dns-hijack/), and the team assessed the group's [primary motivations are to conduct espionage](https://techcrunch.com/2019/04/17/sea-turtle-talos-dns-hijack/).

## Who was targeted, and what was at stake

The victim list reads like an intelligence collection wishlist. Talos identified the primary targets as [national security organizations, ministries of foreign affairs, and prominent energy organizations](https://blog.talosintelligence.com/seaturtle/#:~:text=national%20security%20organizations%2C%20ministries%20of%20foreign%20affairs%2C%20and%20prominent%20energy%20organizations) — exactly the institutions whose internal communications a hostile state would most want to read.

A second tier of victims was, in a sense, even more revealing. Talos found the attackers also hit [numerous DNS registrars, telecommunication companies, and internet service providers](https://blog.talosintelligence.com/seaturtle/#:~:text=numerous%20DNS%20registrars%2C%20telecommunication%20companies%2C%20and%20internet%20service%20providers). These weren't the ultimate prizes; they were the *means*. By owning the infrastructure providers, the attackers gained the leverage to manipulate DNS for the real targets downstream.

BleepingComputer's summary captured the prize cleanly: the main targets were [ministries of foreign affairs, military organizations, intelligence agencies, energy companies](https://www.bleepingcomputer.com/news/security/sea-turtle-campaign-focuses-on-dns-hijacking-to-compromise-targets/). When you can silently intercept the email and login traffic of a foreign ministry, you don't need to break encryption — you can simply harvest the credentials and read the mail as it flows.

## How it happened: hijacking the chain of trust

![Vivid colorful concept art of a man-in-the-middle figure intercepting a stream of glowing government envelopes and stamping each with a forged green seal before passing them on, two padlocks facing each other across a fractured pipeline](../../assets/the-sea-turtle-dns-espionage-02-registry-compromise.jpg)

Here is what made Sea Turtle unusually sophisticated: the attackers rarely went straight at their victims. Instead they climbed the chain of trust.

The pattern, as reconstructed by Talos and corroborated by independent reporting, ran roughly like this. First, gain a foothold at a DNS provider, registrar, or [registry](/en/glossary/registry/) — typically through spear-phishing or by exploiting a known vulnerability. With that access, [modify DNS records to point legitimate users of the target to actor-controlled servers](https://blog.talosintelligence.com/seaturtle/#:~:text=Modified%20DNS%20records%20to%20point%20legitimate%20users%20of%20the%20target%20to%20actor%2Dcontrolled%20servers). Those servers were set up as a man-in-the-middle layer: per BleepingComputer, [Sea Turtle operators set up a man-in-the-middle (MitM) framework that impersonated legitimate services used by the victim with the purpose of stealing login credentials](https://www.bleepingcomputer.com/news/security/sea-turtle-campaign-focuses-on-dns-hijacking-to-compromise-targets/). Victims would log in to what looked like their normal mail or VPN portal, and the attackers would [capture legitimate user credentials when users interacted with these actor-controlled servers](https://blog.talosintelligence.com/seaturtle/#:~:text=Captured%20legitimate%20user%20credentials%20when%20users%20interacted%20with%20these%20actor%2Dcontrolled%20servers), then quietly relay them to the real service so nothing seemed amiss.

The cleverest — and most alarming — piece was how they defeated the padlock. Redirecting traffic is one thing; doing it without triggering a browser certificate warning is another. Sea Turtle solved this by obtaining genuine, valid certificates for the domains they were impersonating. Talos found the attackers [obtained a certificate authority-signed X.509 certificate from another provider for the same domain](https://blog.talosintelligence.com/seaturtle/#:~:text=obtained%20a%20certificate%20authority%2Dsigned%20X.509%20certificate), noting that [these actors use Let's Encrypts, Comodo, Sectigo, and self-signed certificates in their MitM servers](https://blog.talosintelligence.com/seaturtle/#:~:text=use%20Let%27s%20Encrypts%2C%20Comodo%2C%20Sectigo%2C%20and%20self%2Dsigned%20certificates). Because they controlled the DNS records, they could pass the automated domain-validation checks that free certificate authorities rely on — and walk away with a legitimate green padlock for a domain they did not own.

Brian Krebs, documenting the closely related earlier wave, described the same playbook: the attackers [appear to have changed the DNS records for these domains so that the domains pointed to servers in Europe that they controlled](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/), and then [were able to obtain SSL certificates for those domains from SSL providers Comodo and/or Let's Encrypt](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/). One of the cited victims was [mail.gov.ae, which handles email for government offices of the United Arab Emirates](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/).

### Compromised infrastructure providers and a ccTLD registry

The campaign reached infrastructure providers and, later, a country-code top-level-domain registry. Those are distinct roles and incidents.

One publicly confirmed case involved Sweden's Netnod. As Krebs reported, the attackers [gained access to accounts at Netnod's domain name registrar](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/), and Netnod itself stated it learned of its role in the attack on January 2. Netnod said it was not the ultimate target but a route used to capture login details for other internet services. This was access through Netnod's registrar account, not evidence that the attackers obtained authority over every country-level namespace or every DNS service Netnod operates.

Talos described the broader significance in stark terms: the operators were [responsible for the first publicly confirmed case against an organization that manages a root-server instance](https://blog.talosintelligence.com/seaturtle/#:~:text=responsible%20for%20the%20first%20publicly%20confirmed%20case%20against%20an%20organizations%20that%20manages%20a%20root%20server%20zone). The later compromise of ICS-FORTH, operator of Greece's `.gr` ccTLD registry, is the campaign's clearer country-code registry case.

## Response and aftermath: they didn't stop

[DNS hijacking](/en/glossary/dns-hijacking/) on this scale drew an official response. In January 2019, the U.S. Cybersecurity and Infrastructure Security Agency issued [Emergency Directive 19-01, "Mitigate DNS Infrastructure Tampering"](https://www.cisa.gov/news-events/directives/ed-19-01-mitigate-dns-infrastructure-tampering-closed) — the first emergency directive CISA had ever issued — ordering federal agencies to audit their DNS records, change credentials on DNS management accounts, and enable multi-factor authentication on those accounts. It was a tacit acknowledgment that DNS administration had become a frontline of national security.

What's most striking about Sea Turtle, though, is what happened *after* it was exposed. Most campaigns go quiet once a vendor like Talos publishes their tradecraft. Sea Turtle did the opposite.

In a July 2019 follow-up, Talos reported that the group had found new victims, including [a country code top-level domain (ccTLD) registry, which manages the DNS records for every domain uses that particular country code](https://blog.talosintelligence.com/sea-turtle-keeps-on-swimming/#:~:text=a%20country%20code%20top%2Dlevel%20domain%20%28ccTLD%29%20registry). Specifically, [The Institute of Computer Science of the Foundation for Research and Technology - Hellas (ICS-Forth), the ccTLD for Greece](https://blog.talosintelligence.com/sea-turtle-keeps-on-swimming/#:~:text=The%20Institute%20of%20Computer%20Science%20of%20the%20Foundation%20for%20Research%20and%20Technology%20%2D%20Hellas%20%28ICS%2DForth%29%2C%20the%20ccTLD%20for%20Greece) — the body that operates the `.gr` namespace — was compromised. SecurityWeek noted that even after ICS-Forth publicly acknowledged the breach, [Cisco telemetry confirmed that the compromise persisted for at least another five days](https://www.securityweek.com/sea-turtles-dns-hijacking-continues-despite-exposure/).

Talos's assessment of the group was unusually pointed: [this group appears to be unusually brazen, and will be unlikely to be deterred going forward](https://blog.talosintelligence.com/sea-turtle-keeps-on-swimming/#:~:text=this%20group%20appears%20to%20be%20unusually%20brazen%2C%20and%20will%20be%20unlikely%20to%20be%20deterred%20going%20forward). They were right. Sea Turtle was not a one-off; it was a demonstration that DNS-layer espionage works, and that the people doing it are willing to keep going in the open.

## What this teaches about DNS as critical infrastructure

Strip away the geopolitics and Sea Turtle leaves behind a set of uncomfortable lessons about how the internet's naming layer actually works.

1. **DNS is a chain of trust, and you don't control all of it.** Your security might be excellent. But your domain's resolution passes through a registrar and a registry, and if either is compromised, your records can be changed without ever touching your network. Sea Turtle proved attackers will deliberately target the link in the chain you have the least visibility into.

2. **A valid certificate is not proof of a legitimate destination.** The green padlock attests that the connection is encrypted to *whoever controls the domain right now* — and if an attacker has hijacked the DNS, that's them. Domain-validated certificates are only as trustworthy as the DNS they validate against.

3. **DNS manipulation is nearly invisible to the victim.** No malware runs on the victim's machines. Endpoint scanners see nothing. The only signal is that records are pointing somewhere they shouldn't — which is exactly why monitoring DNS records for unexpected changes, and locking them down, matters so much.

4. **Registrar and registry account security is national-security infrastructure.** CISA's first-ever emergency directive was, at its heart, about credentials on DNS management accounts. Multi-factor authentication, registry locks, and tightly controlled access to the accounts that can change DNS records are not hygiene niceties — they are the difference between owning a domain and merely appearing to.

## The Namefi angle

![Colorful illustration of verifiable, tamper-resistant domain ownership — a domain card secured by a green shield, a green Namefi token, and DNS continuity](../../assets/the-sea-turtle-dns-espionage-03-namefi-angle.jpg)

Sea Turtle is a story about stolen authority over DNS administration. Registrar, registry, and DNS-provider accounts can change delegation or hosted records independently of the domain's ownership representation.

[Namefi](https://namefi.io) provides an on-chain layer for [domain ownership](/en/glossary/domain-ownership/) and transfer. That can make the tokenized ownership state independently auditable, but DNS resolution and configuration remain in the conventional DNS layer. A compromised registrar or registry can therefore reroute DNS while the on-chain ownership token remains unchanged; tokenization alone does not prevent or necessarily reveal Sea Turtle's attack path.

The relevant defenses are phishing-resistant authentication, least privilege, update-prohibiting controls where supported, DNS and certificate monitoring, and incident response across every provider in the resolution chain. Ownership verification solves a different problem and should not be presented as a substitute for those controls.

## Sources and further reading

- Cisco Talos — [DNS Hijacking Abuses Trust In Core Internet Service](https://blog.talosintelligence.com/seaturtle/)
- Cisco Talos — [Sea Turtle keeps on swimming, finds new victims, DNS hijacking techniques](https://blog.talosintelligence.com/sea-turtle-keeps-on-swimming/)
- TechCrunch — [A new state-backed hacker group is hijacking government domains at a phenomenal pace](https://techcrunch.com/2019/04/17/sea-turtle-talos-dns-hijack/)
- Krebs on Security — [A Deep Dive on the Recent Widespread DNS Hijacking Attacks](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/)
- BleepingComputer — [‘Sea Turtle’ Campaign Focuses on DNS Hijacking to Compromise Targets](https://www.bleepingcomputer.com/news/security/sea-turtle-campaign-focuses-on-dns-hijacking-to-compromise-targets/)
- SecurityWeek — [Sea Turtle's DNS Hijacking Continues Despite Exposure](https://www.securityweek.com/sea-turtles-dns-hijacking-continues-despite-exposure/)
- BankInfoSecurity — [‘Sea Turtle’ DNS Hijacking Group Conducts Espionage: Report](https://www.bankinfosecurity.com/sea-turtle-dns-hijacking-group-conducts-espionage-report-a-12390)
- CISA — [Emergency Directive 19-01: Mitigate DNS Infrastructure Tampering](https://www.cisa.gov/news-events/directives/ed-19-01-mitigate-dns-infrastructure-tampering-closed)
- SDxCentral — [Cisco Talos Says a Nation State Is Behind Sea Turtle DNS Hijacking Attacks](https://www.sdxcentral.com/articles/news/cisco-talos-says-a-nation-state-is-behind-sea-turtle-dns-hijacking-attacks/2019/04/)
- SecurityWeek — [State-Sponsored Hackers Use Sophisticated DNS Hijacking in Ongoing Attacks](https://www.securityweek.com/state-sponsored-hackers-use-sophisticated-dns-hijacking-ongoing-attacks/)
