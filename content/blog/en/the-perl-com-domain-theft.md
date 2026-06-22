---
title: 'The Perl.com Domain Theft: How a 30-Year-Old Community Home Was Quietly Stolen'
date: '2026-06-17'
language: en
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
cluster: domain-security
series: domain-apocalypse
seriesOrder: 19
format: case-study
description: 'In late January 2021, perl.com — a decades-old home of the Perl programming community — was stolen via a registrar-level account compromise, transferred through China, pointed at a malware-linked IP, and listed for $190,000. Here is how it happened, how it was recovered, and what it teaches about registrar account security.'
keywords: ['perl.com', 'perl.com domain theft', 'domain hijacking', 'domain theft', 'registrar account compromise', 'social engineering', 'Network Solutions', 'Tom Christiansen', 'brian d foy', 'DNS hijack', 'domain security', 'account takeover', 'BizCN']
---

Some domains are infrastructure that happens to look like a name. **perl.com** is one of them. It is not a marketing asset or a brand someone built last year — it is a piece of internet furniture that the Perl programming community has lived around since the early days of the web, the canonical front door to documentation, articles, and the language's public face.

So when, on the morning of January 27, 2021, that front door suddenly belonged to someone else, it was not a clever brand play or a negotiated sale. It was a theft. The domain had been quietly pried out of its rightful owner's control months earlier, bounced through registrars, and pointed at an IP address with a history of distributing malware. The community's own network operators put it bluntly: ["The perl.com domain was hijacked this morning, and is currently pointing to a parking site."](https://log.perl.org/2021/01/perlcom-hijacked.html#:~:text=The%20perl.com%20domain%20was%20hijacked%20this%20morning%2C%20and%20is%20currently%20pointing%20to%20a%20parking%20site.)

This is the story of EP19 in our Domain Mayday series: how a thirty-year-old community domain was stolen without anyone breaking a single server, and what it took to get it back.

## A domain held since the early 90s

To understand the theft, you have to understand how ordinary the setup was — and how that ordinariness was the vulnerability.

perl.com was not held inside some hardened corporate vault. It was held the way most long-lived domains are held: by one trusted person, at a mainstream [registrar](/en/glossary/registrar/), renewed year after year without drama. The site's editor, brian d foy, later described the lineage in his own account of the incident: ["This domain was registered in the early 90s, Tom Christiansen was given control of it shortly after that, and basically kept paying the registration fees."](https://www.perl.com/article/the-hijacking-of-perl-com/#:~:text=This%20domain%20was%20registered%20in%20the%20early%2090s%2C%20Tom%20Christiansen%20was%20given%20control%20of%20it%20shortly%20after%20that%2C%20and%20basically%20kept%20paying%20the%20registration%20fees.)

That is the entire profile of a huge fraction of the internet's most important names. A person, a registrar login, and three decades of quietly paying the bill. It works perfectly — right up until the registrar account itself becomes the target.

## January 27, 2021: the front door changes locks

![Vivid colorful concept art of a decades-old wooden community signpost being quietly unscrewed from its post at night and carried off, against a glowing circuit-board sky](../../assets/the-perl-com-domain-theft-01-theft.jpg)

The first public alarm came from the people who run the Perl community's infrastructure. The Perl NOC (Network Operations Center) blog posted that the domain had been hijacked "this morning" and was now pointing somewhere it should not. Worse than a simple parking page, the operators warned that ["there are some signals that it may be related to sites that have distributed malware in the past."](https://log.perl.org/2021/01/perlcom-hijacked.html#:~:text=there%20are%20some%20signals%20that%20it%20may%20be%20related%20to%20sites%20that%20have%20distributed%20malware%20in%20the%20past.)

brian d foy raised it publicly the same day. Reporting on the incident confirmed the timing in plain terms: ["On January 27th, Perl programming author and Perl.com editor brian d foy tweeted that the perl.com domain was suddenly registered under another person."](https://www.bleepingcomputer.com/news/security/perlcom-domain-stolen-now-using-ip-address-tied-to-malware/#:~:text=On%20January%2027th%2C%20Perl%20programming%20author%20and%20Perl.com%20editor%20brian%20d%20foy)

The community's response was fast and pragmatic. While recovery work began, the NOC redirected readers to a backup: ["If you're looking for the content, you can visit perldotcom.perl.org."](https://log.perl.org/2021/01/perlcom-hijacked.html#:~:text=you%20can%20visit%20perldotcom.perl.org) The canonical name was gone, but the content stayed reachable.

## What was at risk: a malware-linked IP

A stolen domain is dangerous in proportion to the trust it carries — and perl.com carried a lot. Millions of developers, tutorials, CPAN tooling, and old links across the web all pointed at it. Whoever controlled the name controlled what all that trust resolved to.

And the new owner did not point it somewhere harmless. As BleepingComputer documented, ["The domain name perl.com was stolen and now points to an IP address associated with malware campaigns."](https://www.bleepingcomputer.com/news/security/perlcom-domain-stolen-now-using-ip-address-tied-to-malware/#:~:text=The%20domain%20name%20perl.com%20was%20stolen%20and%20now%20points%20to%20an%20IP%20address%20associated%20with%20malware%20campaigns.)

The technical fingerprints were specific. The DNS records were rewritten so that ["the IP addresses assigned to the domain were changed from 151.101.2.132 to the Google Cloud IP address 35.186.238[.]101."](https://www.bleepingcomputer.com/news/security/perlcom-domain-stolen-now-using-ip-address-tied-to-malware/#:~:text=the%20IP%20addresses%20assigned%20to%20the%20domain%20were%20changed%20from%20151.101.2.132%20to%20the%20Google%20Cloud%20IP%20address) That destination had a past: ["In 2019, the IP address 35.186.238[.]101 was tied to a domain distributing a malware executable for the now-defunct Locky ransomware."](https://www.bleepingcomputer.com/news/security/perlcom-domain-stolen-now-using-ip-address-tied-to-malware/#:~:text=In%202019%2C%20the%20IP%20address%2035.186.238%5B.%5D101%20was%20tied%20to%20a%20domain%20distributing%20a%20malware%20executable%20for%20the%20now%2Ddefunct%20Locky%20ransomware.)

Stack those two facts and the danger is obvious. A name that developers reflexively trust, suddenly resolving to an IP with a malware history, is a near-perfect setup for tricking exactly the kind of technical, security-aware audience that is normally hard to fool.

## How it happened: the registrar account, not the server

![Vivid colorful concept art of a forged change-of-ownership slip being slid across a registry service desk, an official rubber stamp glowing red, paperwork swirling in neon light — no brand logos](../../assets/the-perl-com-domain-theft-02-account-compromise.jpg)

Here is the part that makes this incident a textbook case rather than a footnote: nobody hacked perl.com's web server, and nobody guessed a DNS password. The attack happened one layer up, at the registrar — the company that holds the authoritative record of who owns the name.

In his post-mortem, brian d foy described the working theory directly: ["We think that there was a social engineering attack on Network Solutions, including phony documents and so on."](https://www.perl.com/article/the-hijacking-of-perl-com/#:~:text=We%20think%20that%20there%20was%20a%20social%20engineering%20attack%20on%20Network%20Solutions%2C%20including%20phony%20documents%20and%20so%20on.) The press framed it the same way: the theft was ["a social engineering attack that convinced registrar Network Solutions to alter the domain's records without valid authorization."](https://www.theregister.com/2021/03/02/perl_domain_theft/#:~:text=a%20social%20engineering%20attack%20that%20convinced%20registrar%20Network%20Solutions%20to%20alter%20the%20domain%27s%20records%20without%20valid%20authorization)

The most unsettling detail is the timeline. The community only *noticed* in January, but the actual compromise was far older. Forensic work surfaced by domain attorney John Berryhill pushed the real date back months; as the perl.com account records, ["John Berryhill provided some forensic work in Twitter that showed the compromise actually happened in September."](https://www.perl.com/article/the-hijacking-of-perl-com/#:~:text=John%20Berryhill%20provided%20some%20forensic%20work%20in%20Twitter%20that%20showed%20the%20compromise%20actually%20happened%20in%20September.) SecurityWeek confirmed the attacker's patience: ["The attack, he explains, took place in September 2020"](https://www.securityweek.com/hackers-control-perlcom-domain-months-hijack/#:~:text=The%20attack%2C%20he%20explains%2C%20took%20place%20in%20September%202020) — roughly four months before anyone saw the effects.

Why the long wait? Because the rules of domain transfers reward patience. ["ICANN prohibits the transfer of a domain for 60 days following the updating of contact info."](https://www.securityweek.com/hackers-control-perlcom-domain-months-hijack/#:~:text=ICANN%20prohibits%20the%20transfer%20of%20a%20domain%20for%2060%20days%20following%20the%20updating%20of%20contact%20info.) An attacker who quietly seizes a registrar account in September cannot immediately whisk the domain away — so they sat on it, let the clock run, and made their move once the lock expired.

When they finally moved, they laundered the name through registrars and borders to make recovery harder. The Register documented the first hop: ["The domain was transferred to the BizCN registrar in December, but the nameservers were not changed."](https://www.theregister.com/2021/03/02/perl_domain_theft/#:~:text=The%20domain%20was%20transferred%20to%20the%20BizCN%20registrar%20in%20December%2C%20but%20the%20nameservers%20were%20not%20changed) BleepingComputer traced the same path geographically: the domain ["was stolen in September 2020 while at Network Solutions, transferred to a registrar in China on Christmas Day"](https://www.bleepingcomputer.com/news/security/perlcom-domain-stolen-now-using-ip-address-tied-to-malware/#:~:text=stolen%20in%20September%202020%20while%20at%20Network%20Solutions%2C%20transferred%20to%20a%20registrar%20in%20China%20on%20Christmas%20Day) before the final hop in January, when ["The domain was transferred again in January to another registrar, Key Systems, GmbH."](https://www.theregister.com/2021/03/02/perl_domain_theft/#:~:text=The%20domain%20was%20transferred%20again%20in%20January%20to%20another%20registrar%2C%20Key%20Systems%2C%20GmbH.)

And then they tried to cash out. With the name freshly relocated, ["the unauthorized registrant tried to sell the domain for $190,000 on domain market Afternic."](https://www.theregister.com/2021/03/02/perl_domain_theft/#:~:text=the%20unauthorized%20registrant%20tried%20to%20sell%20the%20domain%20for%20%24190%2C000%20on%20domain%20market%20Afternic.) A thirty-year-old community asset, stolen via paperwork, listed for sale like used furniture.

## The recovery: weeks of paperwork to undo paperwork

The same machinery that let the theft happen — registrars, registries, and ownership records — was also the only path back. There was no server to re-secure and no patch to deploy. Someone had to *prove*, through the registrar and registry chain, that Tom Christiansen was the real owner and the new "owner" was a fraud.

That work started within days. By January 30, the Perl NOC reported that ["Network Solutions is working with Tom Christiansen, the rightful registrant, on the recovery of the Perl.com domain."](https://log.perl.org/2021/01/perlcom-hijacked.html#:~:text=Network%20Solutions%20is%20working%20with%20Tom%20Christiansen%2C%20the%20rightful%20registrant%2C%20on%20the%20recovery%20of%20the%20Perl.com%20domain.) The push ["ultimately led to the restoration of the domain to its previous owner, Tom Christiansen, in early February."](https://www.theregister.com/2021/03/02/perl_domain_theft/#:~:text=restoration%20of%20the%20domain%20to%20its%20previous%20owner%2C%20Tom%20Christiansen%2C%20in%20early%20February.)

But "restored" did not mean "fixed." brian d foy's own framing captures both the relief and the unfinished work: ["The Perl.com domain is back in the hands of Tom Christiansen and we're working on the various security updates so this doesn't happen again."](https://www.perl.com/article/the-hijacking-of-perl-com/#:~:text=The%20Perl.com%20domain%20is%20back%20in%20the%20hands%20of%20Tom%20Christiansen%20and%20we%27re%20working%20on%20the%20various%20security%20updates%20so%20this%20doesn%27t%20happen%20again.) Because the domain had pointed at a malware-linked IP, security products had blacklisted it and some DNS resolvers were sinkholing it. Even after the registry record was correct, it took additional weeks for the name to be trusted again across the internet's reputation systems — a long tail that stretched the full ordeal across roughly two months.

The headline, in foy's words, was almost understated: ["For a week we lost control of the Perl.com domain."](https://www.perl.com/article/the-hijacking-of-perl-com/#:~:text=For%20a%20week%20we%20lost%20control%20of%20the%20Perl.com%20domain.) A week of active theft; months of latent compromise before it; weeks of cleanup after.

## What this teaches about registrar account security and long-held domains

The perl.com theft is so instructive precisely because nothing exotic happened. Strip it down and the lessons are uncomfortably general:

1. **Your registrar account is the real crown jewel.** Everyone hardens their servers and their DNS host. But the domain's *ownership record* lives at the registrar, and that account is often protected by little more than a password and a support team that can be talked into changes. perl.com was stolen there, not at the edge.

2. **Social engineering beats technical controls.** No exploit, no malware on the victim's side — just ["phony documents and so on"](https://www.perl.com/article/the-hijacking-of-perl-com/#:~:text=including%20phony%20documents%20and%20so%20on.) persuasive enough to move a real record. Two-factor authentication on your own login does not help if the registrar's *humans* can be convinced to override it.

3. **Long-held domains are soft targets.** A name registered in the early 90s and renewed on autopilot for thirty years tends to accumulate stale contact info, a single point of human failure, and an owner who isn't watching the [WHOIS](/en/glossary/whois/) record daily. Quiet stability is exactly what lets a September compromise go unnoticed until January.

4. **The transfer rules cut both ways.** The 60-day post-update transfer lock that is supposed to *protect* owners became the attacker's waiting room. Patience plus laundering across registrars and borders turned a quick fix into a multi-party, multi-week recovery.

5. **Recovery is slower than theft.** Stealing the name took a forged document. Getting it back took registrars, a registry, the rightful owner's evidence, and then weeks of rebuilding reputation with blocklists and resolvers. Theft is one transaction; restitution is many.

The grim summary: for a domain like perl.com, the strength of your password matters less than whether your registrar can be tricked into ignoring it.

## The Namefi angle

![Colorful illustration of verifiable, tamper-resistant domain ownership — a domain card secured by a green shield, a green Namefi token, and DNS continuity](../../assets/the-perl-com-domain-theft-03-namefi-angle.jpg)

Every step of the perl.com theft turned on one weakness: ownership was a *record in someone else's account*, changeable by whoever could persuade the right support agent. The attacker never needed the owner's keys. They needed the registrar's trust — and a forged slip of paper was enough to transfer a thirty-year-old asset across the planet and list it for sale.

[Namefi](https://namefi.io) is built around the opposite premise: that [domain ownership](/en/glossary/domain-ownership/) should be cryptographically verifiable and hard to silently rewrite. By representing domain control as a tokenized, on-chain asset that stays compatible with DNS, the authoritative answer to "who owns this name?" stops being a mutable line in a registrar's database that a convincing phone call can flip. Transfers become signed, auditable events rather than back-office paperwork — and a fraudulent "change of ownership" has no quiet door to walk through.

It would not have made perl.com un-stealable overnight; registrars and registries are still part of the chain. But it attacks the exact failure mode that defined this incident — the gap between *paying for a name for thirty years* and *being able to prove, tamper-resistantly, that it is yours* — and it shrinks the window where a stolen domain can be laundered before anyone can object.

perl.com got its front door back. The harder question this episode leaves behind is why the lock was ever something a stranger with the right paperwork could open.

## Sources and further reading

- The Perl NOC — [perl.com hijacked](https://log.perl.org/2021/01/perlcom-hijacked.html)
- perl.com (brian d foy) — [The Hijacking of Perl.com](https://www.perl.com/article/the-hijacking-of-perl-com/)
- BleepingComputer — [Perl.com domain stolen, now using IP address tied to malware](https://www.bleepingcomputer.com/news/security/perlcom-domain-stolen-now-using-ip-address-tied-to-malware/)
- The Register — [Perl.com theft blamed on social engineering attack](https://www.theregister.com/2021/03/02/perl_domain_theft/)
- SecurityWeek — [Hackers Controlled Perl.com Domain Months Before Hijack](https://www.securityweek.com/hackers-control-perlcom-domain-months-hijack/)
- Security Affairs — [Attackers took over the Perl.com domain in September 2020](https://securityaffairs.com/115208/cyber-crime/perl-com-hijack-september.html)
- The Daily Swig (PortSwigger) — [Domain for popular programming website Perl.com stolen in 'hack'](https://portswigger.net/daily-swig/domain-for-popular-programming-website-perl-com-stolen-in-hack)
- Slashdot — [Perl.com Domain Stolen, Now Using IP Address of Past Malware Campaigns](https://developers.slashdot.org/story/21/01/31/0220252/perlcom-domain-stolen-now-using-ip-address-of-past-malware-campaigns)
- INCIBE-CERT — [The perl.com domain has been hijacked](https://www.incibe.es/en/incibe-cert/publications/cybersecurity-highlights/perlcom-domain-has-been-hijacked)
- GIGAZINE — [Perl.com editors tell the truth about the Perl.com domain hijacking case](https://gigazine.net/gsc_news/en/20210303-hijacking-of-perl-com/)
