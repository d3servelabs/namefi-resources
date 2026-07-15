---
title: 'The GoDaddy Multi-Year Campaign: Hosting Breaches, Exposed Credentials, and Malicious Redirects'
date: '2026-06-17'
language: en
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
cluster: domain-security
series: domain-apocalypse
seriesOrder: 13
format: case-study
description: 'GoDaddy says hosting incidents disclosed between 2020 and 2022 were part of a multi-year threat campaign that exposed 1.2 million Managed WordPress customers and redirected some hosted websites. A close look at provider concentration risk — and at what the disclosures do not establish.'
keywords: ['godaddy breach', 'godaddy data breach', 'managed wordpress breach', 'registrar security', 'domain security', 'multi-year breach', 'cpanel malware', 'website redirect attack', 'ssl private key exposure', 'sftp password breach', 'sec 10-k cybersecurity', 'registrar concentration risk', 'single point of failure']
relatedArticles:
  - /en/blog/the-fox-it-dns-hijack/
  - /en/blog/the-dnspionage-campaign/
  - /en/blog/the-lenovo-com-dns-hijack/
  - /en/blog/the-badgerdao-frontend-attack/
  - /en/blog/the-icann-spear-phishing-breach/
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
  - /en/glossary/web3/
  - /en/glossary/tld/
---

A domain [registrar](/en/glossary/registrar/) is the most boring company you will ever depend on completely.

You pay it once a year. You log in maybe twice. And in exchange it holds the one thing that makes your business reachable: the right to say "this name points here." Email, website, login, payments — every digital thread you own runs through whoever controls your domain's DNS. Most people never think about that company again after checkout.

GoDaddy is the largest domain registrar on earth, with tens of millions of customers and well over 80 million domains under management. It also sells hosting. Between 2020 and 2022, the company disclosed several security incidents involving web-hosting credentials, its Managed WordPress provisioning environment, and cPanel hosting servers. In its 2022 annual report, GoDaddy said it [believed the incidents were part of a multi-year campaign by a sophisticated threat actor group](https://www.sec.gov/Archives/edgar/data/1609711/000160971123000031/gddy-20221231.htm).

That is evidence of a recurring campaign, not proof that one intruder maintained uninterrupted access for three years. The public disclosures also do not say GoDaddy's domain-registration ownership database or registrar DNS authority was altered. Those boundaries matter: the documented harm was serious without turning a hosting compromise into a different incident.

This is what it looks like when the boring company at the bottom of your stack turns out to be a single point of failure for millions of other people too.

## Why one provider can concentrate several kinds of risk

Concentration is central to the business model of a mass-market hosting provider. Shared provisioning systems, control panels, credential stores, and hosting fleets create efficiency at enormous scale. The same concentration can create a large blast radius when one of those systems is compromised.

When a single small business gets hacked, one business has a bad week. When a platform serving millions of businesses' websites and certificates gets hacked, many customers can inherit the same incident even if their own application was not the initial target.

That is the asymmetry at the heart of provider concentration risk. The customer experiences GoDaddy as their own private dashboard. An attacker sees shared systems that may expose many customer environments through one compromise.

It is worth being precise about the layers. A registrar account can govern nameservers and registration data. A hosting account governs website files, databases, and server configuration. Certificate keys authenticate a site. GoDaddy may supply more than one of these services to the same customer, but its disclosures for this campaign identify hosting login credentials, the legacy Managed WordPress provisioning system, and cPanel hosting servers. They do not establish compromise of the registrar's domain-ownership database or DNS control plane.

![Vivid colorful concept art of a central service vault stacked with many glowing website and certificate keys while a shadowy intruder moves among shared systems, dramatic lighting](../../assets/the-godaddy-multi-year-breach-01-breach.jpg)

## The disclosed incidents: 2020 → 2022

The unsettling part of the GoDaddy story is not any single incident. It is that GoDaddy later assessed several incidents as parts of one multi-year campaign. That retrospective connection does not establish continuous access between the known events.

**2020 — hosting credentials.** GoDaddy later summarized that a threat actor compromised hosting login credentials belonging to about 28,000 customers. Contemporary reporting said the credentials were used to connect to hosting accounts over SSH. This was a web-hosting access incident, not a disclosed takeover of the customers' domain registrations.

**September–November 2021 — the big one.** On November 22, 2021, GoDaddy disclosed a breach of its Managed WordPress hosting environment. The math was brutal: [the incident was discovered by GoDaddy](https://www.bleepingcomputer.com/news/security/godaddy-data-breach-hits-12-million-managed-wordpress-customers/#:~:text=The%20incident%20was%20discovered%20by%20GoDaddy%20last%20Wednesday%2C%20on%20November%2017%2C%20but%20the%20attackers%20had%20access%20to%20its%20network%20and%20the%20data%20contained%20on%20the%20breached%20systems%20since%20at%20least%20September%206%2C%202021) on November 17, 2021 — but the attackers had held access since at least September 6, 2021. That is roughly two and a half months of undetected presence. As TechCrunch reported, [the unauthorized person used a compromised password to get access to GoDaddy's systems around September 6](https://techcrunch.com/2021/11/22/godaddy-breach-million-accounts/#:~:text=the%20unauthorized%20person%20used%20a%20compromised%20password%20to%20get%20access%20to%20GoDaddy%27s%20systems%20around%20September%206).

**December 2022 — the malware and the redirects.** A year later, the pattern surfaced again. GoDaddy [received customer reports in early December 2022 that their sites were being used to redirect to random domains](https://www.bleepingcomputer.com/news/security/godaddy-hackers-stole-source-code-installed-malware-in-multi-year-breach/#:~:text=customer%20reports%20in%20early%20December%202022%20that%20their%20sites%20were%20being%20used%20to%20redirect%20to%20random%20domains). The investigation that followed produced the February 2023 disclosure and GoDaddy's assessment that the incidents belonged to the same broader campaign.

Read in sequence, these are separate incidents that GoDaddy believes belonged to a multi-year threat campaign. The public record does not reveal whether access persisted continuously, was repeatedly regained, or involved different operators within the same group.

## What was exposed — and the websites that turned on their owners

The 2021 Managed WordPress breach is the incident with the cleanest, most quantified damage. GoDaddy's own notice, filed with the SEC, laid it out plainly.

Up to 1.2 million active and inactive Managed WordPress customers had their email address and customer number exposed. Worse, [the original WordPress Admin password that was set at the time of provisioning was exposed](https://www.bleepingcomputer.com/news/security/godaddy-data-breach-hits-12-million-managed-wordpress-customers/#:~:text=The%20original%20WordPress%20Admin%20password%20that%20was%20set%20at%20the%20time%20of%20provisioning%20was%20exposed) — the master key to those WordPress installs. For active customers, sFTP and database usernames and passwords were exposed, the credentials that let you upload files and read the database directly. And for the most sensitive subset, [the SSL private key was exposed](https://www.bleepingcomputer.com/news/security/godaddy-data-breach-hits-12-million-managed-wordpress-customers/#:~:text=For%20a%20subset%20of%20active%20customers%2C%20the%20SSL%20private%20key%20was%20exposed) — the cryptographic secret that proves a site is really itself.

Stack those up and you have a dangerous kit. An admin password can provide site access. sFTP and database credentials can enable file- and data-layer tampering. An exposed SSL [private key](/en/glossary/private-key/) can enable site impersonation if it remains trusted; traffic decryption additionally depends on the TLS configuration and the attacker's network position, and modern forward-secret sessions are not retroactively decrypted merely by obtaining the certificate key.

| What leaked | Who was affected | What it unlocks |
| --- | --- | --- |
| Email + customer number | Up to 1.2M active and inactive customers | Targeted phishing, account mapping |
| Original WordPress admin password | Affected customers (if still in use) | Full control of the WordPress install |
| sFTP + database credentials | Active customers | File-level and database-level site tampering |
| SSL private key | A subset of active customers | Potential site impersonation; traffic decryption only in applicable TLS and network conditions |

The reach of the exposure tells you why this was different in kind from a normal site hack. A normal hack compromises one site. Here, a single break in a shared provisioning system exposed the keys to over a million of them in one motion.

Then there is the part that turns a data breach into something visceral: customer websites that began redirecting visitors to malicious sites. In December 2022, [an unauthorized third party gained access to and installed malware on our cPanel hosting servers](https://www.sophos.com/en-us/blog/godaddy-admits-crooks-hit-us-with-malware-poisoned-customer-websites/#:~:text=an%20unauthorized%20third%20party%20gained%20access%20to%20and%20installed%20malware%20on%20our%20cPanel%20hosting%20servers), GoDaddy said, and [the malware intermittently redirected random customer websites to malicious sites](https://www.sophos.com/en-us/blog/godaddy-admits-crooks-hit-us-with-malware-poisoned-customer-websites/#:~:text=The%20malware%20intermittently%20redirected%20random%20customer%20websites%20to%20malicious%20sites). "Intermittently" and "random" are the cruel words here. A redirect that fires every time is easy to catch. A redirect that fires sometimes, for some visitors, on some sites, is the kind of thing a small-business owner reports and then can't reproduce — and that their host can dismiss as a fluke. It is camouflage built into the attack.

## How it happened: borrowed keys, not broken locks

The most uncomfortable lesson of the GoDaddy story is how unglamorous the entry was.

There is no exotic zero-day at the center of this. The first wave ran on stolen credentials. The 2021 breach ran on [a compromised password](https://www.bleepingcomputer.com/news/security/godaddy-hackers-stole-source-code-installed-malware-in-multi-year-breach/#:~:text=1.2%20million%20Managed%20WordPress%20customers%20after%20attackers%20breached%20GoDaddy%27s%20WordPress%20hosting%20environment%20using%20a%20compromised%20password). Krebs on Security titled its analysis of the campaign ["When Low-Tech Hacks Cause High-Impact Breaches"](https://krebsonsecurity.com/2023/02/when-low-tech-hacks-cause-high-impact-breaches/) — exactly because the impact was so disproportionate to the sophistication of the entry. You don't need to defeat a vault if someone hands you the key.

Across the campaign, GoDaddy said the actors [installed malware on its systems and obtained pieces of code related to some services](https://www.sec.gov/Archives/edgar/data/1609711/000160971123000031/gddy-20221231.htm). Service code can help an attacker understand the systems they are targeting, but the filing does not say that GoDaddy's entire source-code base was stolen or that the same access session persisted across the full campaign.

The detection gap is the other half of the story. The disclosed 2021 access lasted from at least September 6 until discovery on November 17. The later campaign assessment also shows that GoDaddy needed time and multiple incidents to connect the pattern, even though it does not prove a years-long continuous dwell time.

![Vivid colorful concept art of a single glowing skeleton key being turned to open an entire towering wall of hundreds of mailbox doors at once, faint malware tendrils creeping along the wall like vines, dramatic neon lighting, no logos](../../assets/the-godaddy-multi-year-breach-02-persistent-access.jpg)

## Response and aftermath

GoDaddy's immediate technical response to the 2021 breach was the standard playbook: reset the exposed sFTP and database passwords, and begin reissuing and installing new SSL certificates for the customers whose private keys had leaked. For the February 2023 disclosure, the company said it engaged external forensics experts and law enforcement, and characterized the actor as a sophisticated, organized group targeting hosting providers — not a lone opportunist.

But the reputational and regulatory aftermath outlasted the incident response. The series of breaches drew scrutiny from the U.S. Federal Trade Commission, which in 2025 [finalized an order with GoDaddy over data security failures](https://www.ftc.gov/news-events/news/press-releases/2025/05/ftc-finalizes-order-godaddy-over-data-security-failures), alleging the company had failed to implement reasonable security despite marketing its services with security assurances, and requiring it to stand up a comprehensive information-security program. A breach that began with a borrowed password ended, years later, as a federal consent order.

The disclosure timeline itself drew criticism: the multi-year framing only became public through an SEC 10-K filing in February 2023, which meant customers learned the 2020, 2021, and 2022 incidents were connected long after each had been individually reported.

There is a deeper accountability problem buried in that sequencing. Each disclosure, on its own, invited a bounded response — change a password, accept a new certificate, move on. Customers could not assess the broader pattern until GoDaddy disclosed that it believed the incidents were connected as a campaign. The framing of a breach shapes how seriously the people downstream take it.

## What this teaches about hosting-provider concentration risk

Strip away the specifics and the GoDaddy campaign shows why hosting-provider concentration is its own category of risk.

1. **The platform is the prize.** Attackers don't have to target you. They can target the company that hosts you and many others. If a shared provisioning system is the soft target, customers inherit part of its blast radius.

2. **Credentials are the front door, not exploits.** A compromised password did most of the damage here. Multi-factor authentication, credential hygiene, and aggressive anomaly detection matter more than any single fancy defense — because the entry point is almost always borrowed access, not a broken lock.

3. **Detection time is a critical metric.** The 2021 intruder had access for roughly two and a half months before discovery. Across separate incidents, connecting common infrastructure or methods matters too — but a multi-year campaign should not be mistaken for proven continuous residence.

4. **Centralized secrets are centralized failure.** Storing admin passwords, sFTP credentials, and SSL private keys in one place, recoverable, is convenient right up until it is the single worst-case loss. When the same store holds the keys for 1.2 million customers, one breach is 1.2 million breaches.

5. **The website redirect is the customer's nightmare, not just the provider's.** When GoDaddy's servers redirected customer sites to malicious destinations, it was the customers' brands, visitors, and SEO that paid — even though the affected site owners were not the initial point of compromise. Concentration risk includes being harmed by a shared provider's failure.

None of this means "never use a big provider." Scale brings real security investment, and small providers fail too. It means understanding which services one company operates for you and how an incident in each layer could affect your site.

## The Namefi angle

![Colorful illustration of verifiable, tamper-resistant domain ownership — a domain card secured by a green shield, a green Namefi token, and DNS continuity](../../assets/the-godaddy-multi-year-breach-03-namefi-angle.jpg)

The GoDaddy disclosures concern hosting credentials, a WordPress provisioning system, certificate material, and cPanel servers. They do not say the attackers altered domain ownership or registrar DNS records. Tokenizing a domain would therefore not have prevented the documented compromises or the malicious redirects from compromised hosting servers.

[Namefi](https://namefi.io) provides a separate, on-chain ownership and transfer layer for tokenized domains. That can make ownership state independently verifiable, but it is not a substitute for securing hosting accounts, DNS configuration, registrar access, certificate keys, or provider infrastructure. The practical lesson is layered defense: know which provider controls each layer, use strong authentication, monitor unexpected changes, and avoid treating any one ownership technology as protection for unrelated systems.

## Sources and further reading

- BleepingComputer — [GoDaddy: Hackers stole source code, installed malware in multi-year breach](https://www.bleepingcomputer.com/news/security/godaddy-hackers-stole-source-code-installed-malware-in-multi-year-breach/)
- BleepingComputer — [GoDaddy data breach hits 1.2 million Managed WordPress customers](https://www.bleepingcomputer.com/news/security/godaddy-data-breach-hits-12-million-managed-wordpress-customers/)
- Krebs on Security — [When Low-Tech Hacks Cause High-Impact Breaches](https://krebsonsecurity.com/2023/02/when-low-tech-hacks-cause-high-impact-breaches/)
- Sophos — [GoDaddy admits: Crooks hit us with malware, poisoned customer websites](https://www.sophos.com/en-us/blog/godaddy-admits-crooks-hit-us-with-malware-poisoned-customer-websites)
- The Hacker News — [GoDaddy Discloses Multi-Year Security Breach Causing Malware Installations and Source Code Theft](https://thehackernews.com/2023/02/godaddy-discloses-multi-year-security.html)
- TechCrunch — [GoDaddy says data breach exposed over a million user accounts](https://techcrunch.com/2021/11/22/godaddy-breach-million-accounts/)
- SecurityWeek — [GoDaddy Breach Exposes 1.2 Million Managed WordPress Customer Accounts](https://www.securityweek.com/godaddy-breach-exposes-12-million-managed-wordpress-customer-accounts/)
- InformationWeek — [GoDaddy Hit with Multiyear Breach](https://www.informationweek.com/cyber-resilience/godaddy-hit-with-multiyear-breach-)
- BankInfoSecurity — [GoDaddy Confirms Breach Affects 1.2 Million Customers](https://www.bankinfosecurity.com/godaddy-confirms-breach-affects-12-million-customers-a-17974)
- Wordfence — [GoDaddy Breach — Plaintext Passwords — 1.2M Affected](https://www.wordfence.com/blog/2021/11/godaddy-breach-plaintext-passwords/)
- U.S. Federal Trade Commission — [FTC Finalizes Order with GoDaddy over Data Security Failures](https://www.ftc.gov/news-events/news/press-releases/2025/05/ftc-finalizes-order-godaddy-over-data-security-failures)
- GoDaddy (via SEC) — [Notice of Security Incident, November 22, 2021](https://www.sec.gov/Archives/edgar/data/1609711/000160971121000122/gddyblogpostnov222021.htm)
- GoDaddy (via SEC) — [2022 Annual Report: multi-year campaign disclosure](https://www.sec.gov/Archives/edgar/data/1609711/000160971123000031/gddy-20221231.htm)
