---
title: 'DNSpionage: The Campaign That Weaponized DNS Against Governments'
date: '2026-06-17'
language: en
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
cluster: domain-security
series: domain-apocalypse
seriesOrder: 10
format: case-study
description: 'In late 2018, Cisco Talos disclosed DNSpionage — a campaign later tied to Iranian interests that rewrote government DNS records, rerouted email and VPN traffic to attacker servers, and minted valid TLS certificates to stay invisible. It helped trigger the first emergency directive of its kind from the US government.'
keywords: ['dnspionage', 'dns hijacking', 'dns redirection', 'cisco talos', 'cisa emergency directive 19-01', 'sea turtle dns', 'iran dns hijacking', 'fireeye dns hijacking', 'lets encrypt certificate abuse', 'dns security', 'domain security', 'nation state cyber espionage', 'mitigate dns infrastructure tampering']
relatedArticles:
  - /en/blog/the-sea-turtle-dns-espionage/
  - /en/blog/the-fox-it-dns-hijack/
  - /en/blog/the-godaddy-multi-year-breach/
  - /en/blog/the-myetherwallet-bgp-dns-attack/
  - /en/blog/the-badgerdao-frontend-attack/
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
  - /en/glossary/registry/
---

Most domain disasters are about who *owns* a name. This one was about who *controls* it — and for a few months in late 2018, the answer for dozens of government domains across the Middle East was: not the governments.

There was no breach of a web server. No malware on the home page. No defacement, no ransom note, no smoking gun in the application logs. The attackers never needed to break into the buildings at all. They walked in through the one door almost nobody guards: the **DNS record** that says where a domain's email and websites actually live. They edited it — quietly, with valid credentials, behind a valid TLS certificate — and the world's traffic followed the new instructions without complaint.

Cisco Talos named it **DNSpionage**. It is one of the cleanest demonstrations on record that the [Domain Name System](/en/glossary/dns/) is not just plumbing. It is national-security infrastructure.

## DNS as a weapon of statecraft

To understand why DNSpionage rattled governments, you have to remember what DNS actually does.

Every time you send mail to a ministry, log into a corporate VPN, or load a webmail page, your device first asks DNS a question: *what [IP address](/en/glossary/ip-address/) is this name?* Whatever DNS answers, you trust. Your mail client connects there. Your VPN authenticates there. Your browser hands over the session there. DNS is the address book of the entire internet, and almost nothing checks whether the address book has been edited.

That is the property DNSpionage exploited. If you can change the record — not break the encryption, not crack the password file, just change the *pointer* — you can stand invisibly between a target and the services they trust. Email flows through you. VPN logins flow through you. And because the victim's own domain name still appears in the browser bar, nothing looks wrong.

This is espionage at the layer below the application. It is also, uncomfortably, the layer that most security programs treat as a solved problem.

## The DNSpionage campaign (2018–2019)

![A vivid colorful concept illustration of a hidden interception room beneath a national switchboard, where a shadowy operator quietly reroutes a country's mail through forged official seals, glowing data cables splitting toward a secret listening post](../../assets/the-dnspionage-campaign-01-campaign.jpg)

On **November 27, 2018**, Cisco Talos published its first report. The opening line was specific: "[Cisco Talos recently discovered a new campaign targeting Lebanon and the United Arab Emirates (UAE) affecting .gov domains, as well as a private Lebanese airline company](https://blog.talosintelligence.com/dnspionage-campaign-targets-middle-east/#:~:text=Cisco%20Talos%20recently%20discovered%20a%20new%20campaign%20targeting%20Lebanon%20and%20the%20United%20Arab%20Emirates)."

The campaign had two faces. One was a fairly ordinary malware operation: "[This particular campaign utilizes two fake, malicious websites containing job postings that are used to compromise targets via malicious Microsoft Office documents with embedded macros](https://blog.talosintelligence.com/dnspionage-campaign-targets-middle-east/#:~:text=This%20particular%20campaign%20utilizes%20two%20fake%2C%20malicious%20websites%20containing%20job%20postings)." The bait sites impersonated real recruiters — "[hr-wipro[.]com (with a redirection to wipro.com) and hr-suncor[.]com (with a redirection to suncor.com)](https://blog.talosintelligence.com/dnspionage-campaign-targets-middle-east/#:~:text=hr%2Dwipro)" — and dropped a custom remote-access tool that, distinctively, could talk to its command server over DNS itself.

But the second face is the one that made history. In Talos's words: "[In a separate campaign, the attackers used the same IP to redirect the DNS of legitimate .gov and private company domains](https://blog.talosintelligence.com/dnspionage-campaign-targets-middle-east/#:~:text=the%20attackers%20used%20the%20same%20IP%20to%20redirect%20the%20DNS%20of%20legitimate)." Real government nameservers were pointed at machines the attackers owned: "[Multiple nameservers belonging to the public sector in Lebanon and UAE, as well as some companies in Lebanon, were apparently compromised, and hostnames under their control were pointed to attacker-controlled IP addresses](https://blog.talosintelligence.com/dnspionage-campaign-targets-middle-east/#:~:text=Multiple%20nameservers%20belonging%20to%20the%20public%20sector)."

The fake job sites were the part that looked like normal cybercrime. The DNS redirection was the part that looked like statecraft.

By the time independent researchers finished pulling the thread, the scope was much larger than two countries. Brian Krebs, working backward from the attacker IP addresses, found that "[in the last few months of 2018 the hackers behind DNSpionage succeeded in compromising key components of DNS infrastructure for more than 50 Middle Eastern companies and government agencies](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/#:~:text=in%20the%20last%20few%20months%20of%202018%20the%20hackers%20behind%20DNSpionage%20succeeded)."

## Who was targeted, and the stakes

The victim list reads like a map of a region's nervous system: foreign ministries, civil aviation, telecom carriers, internet infrastructure, and a national finance ministry's webmail. These are not random marks. They are the places where a nation's secrets pass through wires.

Two months after Talos's first report, FireEye (now Mandiant) published its own analysis and made the attribution explicit but careful. As FireEye put it, "[initial research suggests the actor or actors responsible have a nexus to Iran](https://www.theregister.com/2019/01/10/fireeye_iran_dns_hijacking/#:~:text=initial%20research%20suggests%20the%20actor%20or%20actors%20responsible%20have%20a%20nexus%20to%20Iran)." Reporting on the FireEye findings, SecurityWeek noted the firm assessed with "[moderate confidence](https://www.securityweek.com/iran-linked-dns-hijacking-attacks-target-organizations-worldwide/#:~:text=moderate%20confidence)" that Iran was behind the attacks, based on technical evidence and the fact that the campaign aligned with the interests of the Iranian government.

The stakes follow directly from the targets. When you can read a foreign ministry's email in plaintext, you are not stealing data — you are reading a government's mind in near real time. That is why a credential-harvesting campaign at the DNS layer is properly understood not as fraud but as intelligence collection against the state.

## How it happened: DNS records + valid certs + fake job sites

![A vivid colorful concept illustration of a national mail switchboard being silently re-patched — glowing address cards being swapped on a giant routing wall, each rerouted line passing through a forged green padlock seal before reaching a hidden listening booth](../../assets/the-dnspionage-campaign-02-dns-redirection.jpg)

Here is the part worth slowing down for, because the technique is elegant in the worst way. There were three moves.

**Move one: get the keys to the address book.** The attackers did not crack DNS cryptography. They logged in. FireEye described two paths: "[One method involves logging into a DNS provider's administration interface using compromised credentials and changing DNS A records in an effort to intercept email traffic. Another method involves changing DNS NS records after hacking into the victim's domain registrar account](https://www.securityweek.com/iran-linked-dns-hijacking-attacks-target-organizations-worldwide/#:~:text=One%20method%20involves%20logging%20into%20a%20DNS%20provider)." Stolen [registrar](/en/glossary/registrar/) and DNS-host credentials were the master key. Whoever holds the registrar login holds the domain — and the domain holds everything pointed at it.

**Move two: reroute the traffic so it still works.** Pointing a government's mail server at your own IP would normally break things and trip alarms. So the attackers proxied. The traffic was relayed onward to the real destination after being captured, so users saw a working inbox and a working VPN. As FireEye described a third variant: "[users were redirected to attacker-controlled infrastructure](https://www.securityweek.com/iran-linked-dns-hijacking-attacks-target-organizations-worldwide/#:~:text=users%20were%20redirected%20to%20attacker%2Dcontrolled%20infrastructure)." The interception was a man-in-the-middle that quietly forwarded — invisible precisely because nothing appeared to fail.

**Move three: defeat the green padlock.** Modern services use TLS, which should throw a certificate warning the moment traffic lands on the wrong server. The attackers closed that gap by minting their own legitimate certificates. Talos found that "[during each DNS compromise, the actor carefully generated Let's Encrypt certificates for the redirected domains](https://blog.talosintelligence.com/dnspionage-campaign-targets-middle-east/#:~:text=During%20each%20DNS%20compromise%2C%20the%20actor%20carefully%20generated)." Because they now controlled the DNS for the domain, they could *prove* control to a certificate authority — and automated domain validation handed them a valid cert. FireEye confirmed the same pattern across methods: "[in both cases the attackers used Let's Encrypt certificates to avoid raising suspicion](https://www.securityweek.com/iran-linked-dns-hijacking-attacks-target-organizations-worldwide/#:~:text=in%20both%20cases%20the%20attackers%20used%20Let%E2%80%99s%20Encrypt%20certificates)."

The result, in Krebs's summary, was total: "[these DNS hijacks also paved the way for the attackers to obtain SSL encryption certificates for the targeted domains (e.g. webmail.finance.gov.lb), which allowed them to decrypt the intercepted email and VPN credentials and view them in plain text](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/#:~:text=these%20DNS%20hijacks%20also%20paved%20the%20way%20for%20the%20attackers%20to%20obtain%20SSL%20encryption%20certificates)." Email and VPN logins, captured and readable, with a valid padlock the whole time.

Notice what was *not* required. No zero-day. No malware on the victim's own servers. No defeated firewall. The attack lived entirely in the gap between "I own this domain" and "I can prove who currently controls its records." That gap is where DNSpionage lived — and it is wider than most organizations think.

## The response: CISA Emergency Directive 19-01

The combined Talos and FireEye disclosures landed hard in Washington. On **January 22, 2019**, the US Cybersecurity and Infrastructure Security Agency issued **Emergency Directive 19-01, "Mitigate DNS Infrastructure Tampering"** — the first emergency directive CISA had ever issued, and a rare instruction binding on the entire federal civilian government.

The directive's diagnosis matched the research exactly. As quoted in contemporaneous reporting, CISA warned that "[attackers have redirected and intercepted web and mail traffic, and could do so for other networked services](https://www.bleepingcomputer.com/news/security/dhs-issues-emergency-directive-to-prevent-dns-hijacking-attacks/#:~:text=redirected%20and%20intercepted%20web%20and%20mail%20traffic)," and that the actors had "[compromised the accounts of administrators in charge of government DNS domains](https://www.bleepingcomputer.com/news/security/dhs-issues-emergency-directive-to-prevent-dns-hijacking-attacks/#:~:text=compromised%20the%20accounts%20of%20administrators)."

It then ordered four actions, on a 10-day clock — and they read like a direct rebuttal to each of the attacker's three moves:

1. **Audit your DNS records** — verify that nothing has been tampered with on authoritative and secondary servers.
2. **Change DNS account passwords** — rotate every credential that can edit DNS.
3. **Add multi-factor authentication** to all DNS admin accounts — so a stolen password alone is no longer the master key.
4. **Monitor Certificate Transparency logs** — watch for certificates issued for your domains that you never requested.

That fourth item is the tell. CISA was not only telling agencies to lock the door; it was telling them to watch the public certificate ledgers for evidence that someone had already used a copy of the key. DNSpionage had turned Certificate Transparency from a niche PKI feature into a frontline detection tool for nation-state [DNS hijacking](/en/glossary/dns-hijacking/).

Krebs captured the unusualness of the moment plainly: "[the U.S. Department of Homeland Security issued a rare emergency directive ordering all U.S. federal civilian agencies to secure the login credentials for their Internet domain records](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/#:~:text=issued%20a%20rare%20emergency%20directive%20ordering%20all%20U.S.%20federal%20civilian%20agencies)."

DNSpionage did not act alone in prompting it. A parallel, even more aggressive operation Talos called **Sea Turtle** — which Talos described as "[the first known case of a domain name registry organization that was compromised for cyber espionage operations](https://www.networkworld.com/article/967285/cisco-talos-details-exceptionally-dangerous-dns-hijacking-attack.html#:~:text=first%20known%20case%20of%20a%20domain%20name%20registry%20organization%20that%20was%20compromised)," hitting "[approximately 40 different organizations across 13 different countries](https://www.networkworld.com/article/967285/cisco-talos-details-exceptionally-dangerous-dns-hijacking-attack.html#:~:text=approximately%2040%20different%20organizations%20across%2013%20different%20countries)" — raised the stakes further. Talos was careful to keep the two distinct; in its April 2019 follow-up it noted that DNSpionage's behavior "[will likely continue to distinguish this actor from more concerning campaigns like Sea Turtle](https://blog.talosintelligence.com/dnspionage-brings-out-karkoff/#:~:text=will%20likely%20continue%20to%20distinguish%20this%20actor%20from%20more%20concerning%20campaigns%20like%20Sea%20Turtle)." Together, the two campaigns made the same point from different angles: the DNS supply chain had become a theater of state conflict.

## What this teaches about DNS as national-security infrastructure

DNSpionage is short on malware drama and long on uncomfortable lessons. A few worth keeping:

- **The registrar account is a crown jewel.** Everything downstream of a domain — mail, web, VPN, single sign-on, certificate issuance — inherits the trust of whoever can edit its DNS. A password and no second factor on that account is not a small gap; it is the whole castle with the gate propped open. CISA's first instructions were about *credentials*, not firewalls, for exactly this reason.
- **A valid certificate is not proof of legitimacy.** The green padlock proves the traffic is encrypted to *whoever controls the domain right now*. If an attacker controls the DNS, automated domain validation will cheerfully issue them a real certificate. Trust in TLS is borrowed from trust in DNS — and DNS is softer than most people assume.
- **DNS attacks are invisible by design.** Because the proxy forwards real traffic, the victim's services keep working. There is no outage to investigate. The only external signal may be a certificate appearing in a public CT log — which is why monitoring those logs went from optional to mandatory overnight.
- **Domain control is a national-security control.** When the entity editing a foreign ministry's DNS is a hostile state, the distinction between "IT operations" and "counterintelligence" collapses. The address book of the internet is strategic terrain.

The through-line is a single question that almost no operational tool answers in real time: **who actually controls this domain right now, and can I prove it hasn't quietly changed?** DNSpionage worked because that question was so hard to answer that an entire region's governments couldn't.

## The Namefi angle

![Colorful illustration of verifiable, tamper-resistant domain ownership — a domain card secured by a green shield, a green Namefi token, and DNS continuity](../../assets/the-dnspionage-campaign-03-namefi-angle.jpg)

DNSpionage is, at its root, a **provenance** problem. The attackers never owned the targeted domains. They borrowed control of them by stealing the credentials that let registrar and DNS-host panels make silent, unverifiable edits — and nothing in the system flagged that the *party in control* had changed.

[Namefi](https://namefi.io) is built on the premise that [domain ownership](/en/glossary/domain-ownership/) and control should be **verifiable, portable, and tamper-evident** rather than locked inside an opaque registrar login. Tokenized ownership makes "who controls this name" a fact you can check and audit, not a setting buried behind a password that may already be in someone else's hands. That doesn't replace registrar-account hygiene or multi-factor authentication — CISA's advice remains exactly right — but it attacks the deeper gap DNSpionage exploited: the difficulty of *proving*, independently and continuously, that the party in control of a domain is the party that's supposed to be.

The lesson of DNSpionage isn't that DNS is fragile in some exotic way. It's that the most important fact about a domain — who controls it — was, for too long, something only a stolen password stood between. Making that fact verifiable is the whole point.

## Sources and further reading

- Cisco Talos — [DNSpionage Campaign Targets Middle East](https://blog.talosintelligence.com/dnspionage-campaign-targets-middle-east/) (Nov 27, 2018)
- Cisco Talos — [DNSpionage brings out the Karkoff](https://blog.talosintelligence.com/dnspionage-brings-out-karkoff/) (Apr 23, 2019)
- Krebs on Security — [A Deep Dive on the Recent Widespread DNS Hijacking Attacks](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/) (Feb 18, 2019)
- The Register — [Baddies linked to Iran fingered for DNS hijacking to read Middle Eastern regimes' emails](https://www.theregister.com/2019/01/10/fireeye_iran_dns_hijacking/) (Jan 10, 2019)
- SecurityWeek — [Iran-Linked DNS Hijacking Attacks Target Organizations Worldwide](https://www.securityweek.com/iran-linked-dns-hijacking-attacks-target-organizations-worldwide/) (Jan 10, 2019)
- BleepingComputer — [DHS Issues Emergency Directive to Prevent DNS Hijacking Attacks](https://www.bleepingcomputer.com/news/security/dhs-issues-emergency-directive-to-prevent-dns-hijacking-attacks/) (Jan 2019)
- Network World — [Cisco Talos details exceptionally dangerous DNS hijacking attack](https://www.networkworld.com/article/967285/cisco-talos-details-exceptionally-dangerous-dns-hijacking-attack.html) (Apr 17, 2019)
- Network World — [Cisco: DNSpionage attack adds new tools, morphs tactics](https://www.networkworld.com/article/967303/cisco-dnspionage-attack-adds-new-tools-morphs-tactics.html)
- CERT-IST — [DNSpionage and DNS data hijacking](https://www.cert-ist.com/public/en/SO_detail?format=html&code=dnspionage)
- CISA — [Emergency Directive 19-01: Mitigate DNS Infrastructure Tampering](https://www.cisa.gov/news-events/directives/ed-19-01-mitigate-dns-infrastructure-tampering-closed) (Jan 22, 2019)
