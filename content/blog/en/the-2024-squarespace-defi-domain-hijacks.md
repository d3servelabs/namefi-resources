---
title: 'Domain Mayday EP05: The 2024 Squarespace DeFi Domain Mass-Hijack'
date: '2026-06-17'
language: en
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
cluster: domain-security
series: domain-apocalypse
seriesOrder: 6
format: case-study
description: 'In July 2024, a registrar migration from Google Domains to Squarespace turned weak default authentication into a mass attack surface. Attackers hijacked the domains of crypto and DeFi projects — Compound Finance, Celer Network, Pendle, Unstoppable Domains — and pointed them at wallet-drainer phishing sites. Here is how a "seamless" migration created hundreds of unlocked front doors, and what it teaches about registrar security and MFA.'
keywords: ['squarespace domain hijack', 'google domains migration', 'defi dns hijack', 'compound finance hijack', 'celer network hijack', 'wallet drainer', 'inferno drainer', 'domain security', 'registrar migration', 'mfa multi-factor authentication', 'oauth account takeover', 'dns hijacking', 'crypto phishing']
relatedArticles:
  - /en/blog/the-curve-finance-dns-hijack/
  - /en/blog/the-badgerdao-frontend-attack/
  - /en/blog/the-fox-it-dns-hijack/
  - /en/blog/the-godaddy-multi-year-breach/
  - /en/blog/the-dnspionage-campaign/
relatedTopics:
  - /en/topics/domain-security/
  - /en/topics/domain-tokenization/
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

In July 2024, the most dangerous thing about several crypto-project websites was not a [smart-contract](/en/glossary/smart-contract/) bug or a leaked [private key](/en/glossary/private-key/). It was the compromised [registrar](/en/glossary/registrar/) account and DNS control path. The registrar managed the registration; the registrant retained the contractual registration rights.

For a stretch of days that month, users who typed a familiar address into their browser — the official site of a [lending protocol](/en/glossary/lending-protocol/) they trusted, a bridge they had used a hundred times — landed exactly where they expected, on a page that looked exactly right, and then watched their [wallets](/en/glossary/wallet/) drain. Nothing had been hacked in the usual sense. No one had cracked a password or phished a [seed phrase](/en/glossary/seed-phrase/). The attackers had simply walked in through the front door of the *domain* itself, because that front door had been left unlocked during a corporate move most of these projects never noticed.

The move was the migration of Google Domains to Squarespace. The unlocked door was Squarespace's authentication defaults. And the result was a coordinated wave of [DNS](/en/glossary/dns/) hijacks against crypto and [DeFi](/en/glossary/defi/) projects controlling, in the words of one researcher, billions of dollars of assets.

## How a registrar migration created a mass attack surface

Domains are not usually thought of as a fleet. Each one feels like a single, private thing — your address, your control panel, your DNS records. But registrars hold them in bulk, and when one registrar's entire customer base moves to another, every account in that base moves on the *same* migration logic, with the *same* defaults, at the *same* time. Whatever weakness exists in that logic is not a one-off bug. It is a property of the whole fleet.

That is what made the 2024 incident a *mass* event rather than a string of unlucky individual compromises.

In June 2023, [Squarespace purchased roughly 10 million domain names from Google Domains](https://krebsonsecurity.com/2024/07/researchers-weak-security-defaults-enabled-squarespace-domains-hijacks/#:~:text=Squarespace%20purchased%20roughly%2010%20million%20domain%20names%20from%20Google%20Domains%20in%20June%202023), after Google announced it was shutting its registrar down. Over the following year, [Squarespace has been migrating users for roughly 10 million domain names purchased in the transaction](https://www.securityweek.com/hackers-exploit-flaw-in-squarespace-migration-to-hijack-domains/#:~:text=Squarespace%20has%20been%20migrating%20users%20for%20roughly%2010%20million%20domain%20names%20purchased%20in%20the%20transaction). To make the transition feel seamless, Squarespace pre-created accounts for the people associated with each migrated domain, keyed to the email addresses Google had on file.

The convenience created risk. According to the incident reporting cited below, some migrated accounts had not completed a strong ownership-verification flow before domains were associated with them. In the affected path, a person who knew the associated email address could create or claim an account before the legitimate holder did, without the protections users would reasonably expect for a domain-control account.

## The July 2024 hijacks

![Vivid colorful concept-art illustration of a mass migration of domain-house keys spilling out of a moving truck during a relocation, some keys tumbling into shadowy reaching hands, a row of small houses each labeled with a glowing web address](../../assets/the-2024-squarespace-defi-domain-hijacks-01-mass-hijack.jpg)

[The attacks started on July 9](https://www.securityweek.com/hackers-exploit-flaw-in-squarespace-migration-to-hijack-domains/#:~:text=The%20attacks%20started%20on%20July%209) and ran through the following days. They were not subtle. A [wave of coordinated DNS hijacking attacks targets decentralized finance (DeFi) cryptocurrency domains using the Squarespace registrar, redirecting visitors to phishing sites hosting wallet drainers](https://www.bleepingcomputer.com/news/security/dns-hijacks-target-crypto-platforms-registered-with-squarespace/#:~:text=A%20wave%20of%20coordinated%20DNS%20hijacking%20attacks%20targets%20decentralized%20finance%20%28DeFi%29%20cryptocurrency%20domains%20using%20the%20Squarespace%20registrar%2C%20redirecting%20visitors%20to%20phishing%20sites%20hosting%20wallet%20drainers), as BleepingComputer reported.

The first one to make noise was one of the biggest names in DeFi lending. Security firm Blockaid, which investigated the incident, found that [visitors to these sites were being redirected to malicious pages designed to drain funds from connected wallets](https://www.blockaid.io/blog/squarespace-defi-domain-hijack-incident#:~:text=Visitors%20to%20these%20sites%20were%20being%20redirected%20to%20malicious%20pages%20designed%20to%20drain%20funds%20from%20connected%20wallets). The fake sites were not crude knockoffs. According to Blockaid, [these fake dApps were running the latest iteration of the Inferno draining kit, designed to trick users into signing transactions that would empty their wallets](https://www.blockaid.io/blog/squarespace-defi-domain-hijack-incident#:~:text=These%20fake%20dApps%20were%20running%20the%20latest%20iteration%20of%20the%20Inferno%20draining%20kit%2C%20designed%20to%20trick%20users%20into%20signing%20transactions%20that%20would%20empty%20their%20wallets).

The list of confirmed victims read like a roll call of the ecosystem. The hijacked entities included [Celer Network, Compound Finance, Pendle Finance, and Unstoppable Domains](https://krebsonsecurity.com/2024/07/researchers-weak-security-defaults-enabled-squarespace-domains-hijacks/#:~:text=Celer%20Network%2C%20Compound%20Finance%2C%20Pendle%20Finance%2C%20and%20Unstoppable%20Domains). For Compound, [its main domain had been taken over to display a phishing page](https://www.bleepingcomputer.com/news/security/dns-hijacks-target-crypto-platforms-registered-with-squarespace/#:~:text=its%20main%20domain%20had%20been%20taken%20over%20to%20display%20a%20phishing%20page). Celer caught the attempt and [swiftly recovered its DNS records](https://www.bleepingcomputer.com/news/security/dns-hijacks-target-crypto-platforms-registered-with-squarespace/#:~:text=swiftly%20recovered%20its%20DNS%20records); Pendle [experienced similar issues](https://www.bleepingcomputer.com/news/security/dns-hijacks-target-crypto-platforms-registered-with-squarespace/#:~:text=experienced%20similar%20issues) and warned its users to revoke wallet approvals.

## What was at stake — and what users lost

The cruelty of a domain hijack is that it defeats every habit users are taught to rely on. Check the URL. Make sure it's the real site. Look for the lock icon. All of that advice assumes the domain still points where it is supposed to. When the attacker controls the domain's DNS, the URL *is* real — it is the project's genuine address — and it resolves to the attacker's server. The padlock is green. The address bar is honest. The page is a trap.

That is why wallet-drainer kits like Inferno pair so naturally with [DNS hijacking](/en/glossary/dns-hijacking/). The drainer doesn't need to steal a password; it needs the victim to *connect a wallet and sign*. And a user who arrived at their lending protocol's real domain has no reason to hesitate before approving a transaction. The [phishing](/en/glossary/phishing/) site inherits all the trust the legitimate domain spent years earning.

How bad could it have been? The number that captured the scope was not the count of confirmed thefts but the count of *exposed* projects. Blockaid's analysis, reported by Decrypt, was blunt: [roughly 228 DeFi protocol front ends are still at risk](https://decrypt.co/239524/220-defi-protocols-risk-squarespace-dns-hijack#:~:text=roughly%20228%20DeFi%20protocol%20front%20ends%20are%20still%20at%20risk), because every one of them sat behind the same migrated-account weakness. The hijacks that happened were a sample. The attack surface was the whole crypto cohort that had ridden the Google-to-Squarespace migration.

## How it happened: the migration's authentication flaw

![Vivid colorful concept-art illustration of a long row of mailboxes outside a new building, each mailbox door hanging open and unlocked, a faceless figure quietly slipping letters into one before the rightful owner arrives, warm and cold light contrast](../../assets/the-2024-squarespace-defi-domain-hijacks-02-migration-flaw.jpg)

The mechanism, once researchers reconstructed it, was almost embarrassingly simple — which is what made it dangerous at scale.

Start with two design choices. First, Squarespace did not verify that the person logging in actually controlled the email on the account. As the researchers put it, [Squarespace doesn't require email verification for new accounts created with a password](https://socket.dev/blog/squarespace-domain-hijacks-enabled-by-email-address-exploit-on-migrated-accounts#:~:text=Squarespace%20doesn%27t%20require%20email%20verification%20for%20new%20accounts%20created%20with%20a%20password). Second, the migrated accounts had been pre-built but not yet claimed — they had no password set. So when someone arrived with the right email, [since there's no password on the account, it just shoots them to the 'create password for your new account' flow](https://krebsonsecurity.com/2024/07/researchers-weak-security-defaults-enabled-squarespace-domains-hijacks/#:~:text=since%20there%27s%20no%20password%20on%20the%20account%2C%20it%20just%20shoots%20them%20to%20the).

Put those together and the attack writes itself. The email addresses tied to migrated domains were not secret — admin and [registrant](/en/glossary/registrant/) contacts are often public or guessable. An attacker who simply registered the account first, using a known migrated email, before the real owner ever logged in, walked away with control of the domain. MetaMask lead product manager Taylor Monahan, one of the researchers who dissected the incident, described the blind spot precisely: [Squarespace never accounted for the possibility that a threat actor might sign up for an account using an email associated with a recently-migrated domain before the legitimate email holder created the account themselves](https://krebsonsecurity.com/2024/07/researchers-weak-security-defaults-enabled-squarespace-domains-hijacks/#:~:text=Squarespace%20never%20accounted%20for%20the%20possibility%20that%20a%20threat%20actor%20might%20sign%20up%20for%20an%20account%20using%20an%20email%20associated%20with%20a%20recently%2Dmigrated%20domain%20before%20the%20legitimate%20email%20holder%20created%20the%20account%20themselves).

Why did the pre-linking exist at all? Convenience. The researchers concluded that [Squarespace assumed all users migrating from Google Domains would select the social login options](https://krebsonsecurity.com/2024/07/researchers-weak-security-defaults-enabled-squarespace-domains-hijacks/#:~:text=Squarespace%20assumed%20all%20users%20migrating%20from%20Google%20Domains%20would%20select%20the%20social%20login%20options) — Google OAuth — rather than email-and-password. The system [pre-linking all emails to domains, regardless of whether the account already exists, likely because they wanted users to be able to OAuth with Google and immediately have access to all their domains](https://www.theregister.com/2024/07/15/squarespace_fingered_for_dns_hijackings/#:~:text=pre%2Dlinking%20all%20emails%20to%20domains%2C%20regardless%20of%20whether%20the%20account%20already%20exists%2C%20likely%20because%20they%20wanted%20users%20to%20be%20able%20to%20OAuth%20with%20Google%20and%20immediately%20have%20access%20to%20all%20their%20domains), as the researchers explained to The Register. But the email-and-password path was never closed off, and on that path nothing proved control of the inbox.

There was one more accelerant. During the migration, the protection that should have caught this was switched off: [as part of the transition to Squarespace, multi-factor authentication was turned off on accounts](https://www.bleepingcomputer.com/news/security/dns-hijacks-target-crypto-platforms-registered-with-squarespace/#:~:text=as%20part%20of%20the%20transition%20to%20Squarespace%2C%20multi%2Dfactor%20authentication%20was%20turned%20off%20on%20accounts). Even a domain owner who had enabled MFA on Google Domains could arrive at Squarespace without that protection. For the vulnerable migrated-account path described by researchers, knowing the associated email address could therefore be enough to start the unauthorized claim flow; the precise path and impact depended on the account's migration state.

## Response and mitigation

The crypto-security community moved faster than the registrar. Researchers — among them [Samczsun, Taylor Monahan, and Andrew Mohawk](https://www.bleepingcomputer.com/news/security/dns-hijacks-target-crypto-platforms-registered-with-squarespace/#:~:text=Samczsun%2C%20Taylor%20Monahan%2C%20and%20Andrew%20Mohawk) — published the mechanism, and Blockaid circulated lists of still-vulnerable front ends so projects could check whether they were exposed. Affected projects raced to reclaim their accounts, reset DNS records, and warn users to revoke token approvals granted to the malicious sites.

The immediate remediation advice was the same for everyone still on a migrated account: log in and claim the account before an attacker does, set a strong unique password, and — above all — re-enable multi-factor authentication, which the migration had silently removed. Squarespace, for its part, worked to lock down the migrated accounts and the account-creation flow. But the structural lesson outlived the patch: a security control that a vendor turns off during a migration is, for the duration of that migration, a control that does not exist.

## What this teaches about registrar security and MFA

The Squarespace hijacks are not really a story about one company's misconfiguration. They are a story about where domain control actually lives, and how fragile the layer above the [blockchain](/en/glossary/blockchain/) remains.

A few lessons generalize well beyond July 2024:

1. **The registrar and DNS accounts are critical roots of trust for the website — independent of the smart contract.** None of the affected protocols needed a contract bug for the attack to work. The attackers changed the *domain's* destination, and the domain is what users type, trust, and connect their wallets to. A project can be flawless on-chain and still hand its users to an attacker if its DNS [control plane](/en/blog/dns-is-the-control-plane/) is weak.

2. **MFA is only protection if it survives migrations.** The painful detail here is that MFA didn't fail under attack — it was *removed* before the attack, as a migration convenience. Treat MFA status as something to re-verify after every account move, transfer, or vendor change, not something to set once and forget.

3. **"Seamless" is a security trade-off.** Every step a migration skips for the user's convenience is a step where identity goes unproven. Pre-created accounts, auto-linked emails, and no-verification logins are all friction the user didn't feel — and friction is, very often, the thing that was keeping attackers out.

4. **Guessable identifiers are credentials in disguise.** The "secret" that unlocked these domains was an email address that was never secret. Any system where knowing a public identifier grants control is one impersonation away from compromise.

5. **A registrar-wide migration can create a shared blast radius.** A weak default can expose every account that passes through the affected migration path, even if it does not compromise every customer. Where your domain lives, and how that provider handles authentication and migrations, is a security decision as consequential as many choices you make on-chain.

## The Namefi angle

![Colorful illustration of verifiable, tamper-resistant domain ownership — a domain card secured by a green shield, a green Namefi token, and DNS continuity](../../assets/the-2024-squarespace-defi-domain-hijacks-03-namefi-angle.jpg)

The 2024 hijacks exposed the difference between registrant rights, registrar-account access, and operational DNS control. Those layers are connected, but they are not identical: an attacker did not need to become the lawful registrant to redirect users if the attacker could reach the account path that changed DNS.

[Namefi](https://namefi.io) adds an on-chain token-control layer for supported domains. Wallet possession and token transfers can be verified publicly, and compatible marketplace settlement can move that token atomically. But tokenization does not replace the registrar, registry, or DNS layers: [DNS still runs through ordinary providers and registrar infrastructure](https://namefi.io/r/en/blog/dns-on-tokenized-domains), while Namefi's [Terms of Service](https://namefi.io/tos) preserve platform and registrar actions required by policy, disputes, vendor changes, or service enforcement.

That distinction matters. Registering an account with a known email would not, by itself, transfer the wallet token for a [tokenized domain](/en/blog/what-are-tokenized-domains/). It could still threaten DNS if the compromised account or provider retained authority to change records, and registrar or platform interventions can still affect the domain and token. Token custody is therefore an additional auditable control and settlement layer, not immunity from registrar, DNS-provider, policy, or support-channel compromise.

## Sources and further reading

- Krebs on Security — [Researchers: Weak Security Defaults Enabled Squarespace Domains Hijacks](https://krebsonsecurity.com/2024/07/researchers-weak-security-defaults-enabled-squarespace-domains-hijacks/)
- BleepingComputer — [DNS hijacks target crypto platforms registered with Squarespace](https://www.bleepingcomputer.com/news/security/dns-hijacks-target-crypto-platforms-registered-with-squarespace/)
- Blockaid — [Squarespace Domain Hijacking Incident: Attack Report](https://www.blockaid.io/blog/squarespace-defi-domain-hijack-incident)
- SecurityWeek — [Hackers Exploit Flaw in Squarespace Migration to Hijack Domains](https://www.securityweek.com/hackers-exploit-flaw-in-squarespace-migration-to-hijack-domains/)
- Decrypt — [More Than 220 DeFi Protocols Still 'at Risk' From Squarespace DNS Hijack](https://decrypt.co/239524/220-defi-protocols-risk-squarespace-dns-hijack)
- The Register — [Infoseccers claim Squarespace migration linked to DNS hijackings at Web3 firms](https://www.theregister.com/2024/07/15/squarespace_fingered_for_dns_hijackings/)
- Socket — [Squarespace Domain Hijacks Enabled by Email Address Exploit on Migrated Accounts](https://socket.dev/blog/squarespace-domain-hijacks-enabled-by-email-address-exploit-on-migrated-accounts)
- SiliconANGLE — [Multiple crypto domains hijacked from Squarespace due to Google Domains migration flaw](https://siliconangle.com/2024/07/15/multiple-crypto-domains-hijacked-squarespace-due-google-domains-migration-flaw/)
- Cybernews — [Squarespace crypto domains under DNS attack, lack of MFA to blame](https://cybernews.com/security/squarespace-dns-hijack-attack-crypto-domains-mfa/)
- Hackread — [DeFi Hack Alert: Squarespace Domains Vulnerable to DNS Hijacking](https://hackread.com/defi-hack-alert-squarespace-domains-dns-hijacking/)
- Namefi — [DNS on Tokenized Domains](https://namefi.io/r/en/blog/dns-on-tokenized-domains) and [Terms of Service](https://namefi.io/tos)
- CircleID — [Security Lapses Lead to Squarespace Domain Hijacks](https://circleid.com/posts/20240716-security-lapses-lead-to-squarespace-domain-hijacks)
