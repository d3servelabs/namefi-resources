---
title: 'The Lenovo.com DNS Hijack: When Lizard Squad Took a Hardware Giant''s Front Door'
date: '2026-06-17'
language: en
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['aileen-wright']
editors: ['victor-zhou']
draft: false
cluster: domain-security
series: domain-apocalypse
seriesOrder: 15
format: case-study
description: 'On February 25, 2015, attackers changed Lenovo.com''s nameserver and mail routing, sending visitors to a webcam slideshow and exposing some email traffic. Researchers attributed the incident to a Webnic compromise, but Webnic did not publicly confirm their reported exploit chain.'
keywords: ['lenovo.com dns hijack', 'lizard squad', 'webnic registrar', 'web commerce communications', 'dns hijacking', 'superfish', 'domain registrar security', 'registrar compromise', 'epp auth code', 'email interception', 'google vietnam hijack', 'domain security', 'registrar lock']
relatedArticles:
  - /en/blog/the-malaysia-airlines-dns-hijack/
  - /en/blog/the-godaddy-multi-year-breach/
  - /en/blog/the-fox-it-dns-hijack/
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

On February 25, 2015, the website of the world's largest PC maker pointed at a slideshow of bored teenagers staring into their webcams, scored to a song from *High School Musical*. Lenovo said traffic to its website had been redirected. Public reporting pointed to changes at its registrar rather than a compromise of Lenovo's web servers.

The attackers changed the domain's nameserver and mail-routing configuration through its [registrar](/en/glossary/registrar/). That was enough to redirect Lenovo's front door and expose some mail during the incident window.

This is **Domain Mayday EP17**: the Lenovo.com DNS hijack. It is a compact demonstration of a lesson many companies miss: registrar and DNS-provider access belong inside the organization's security program. The public record does not establish that Lenovo's production systems or customer database were breached in this incident.

## A hardware giant whose domain is its face

By 2015, Lenovo was the [world's largest PC manufacturer](https://www.bankinfosecurity.com/lizard-squad-teases-lenovo-e-mail-grab-a-7953#:~:text=the%20world%27s%20largest%20PC%20manufacturer), shipping more laptops and desktops than anyone on earth. For a company that size, lenovo.com is not a marketing asset. It is the load-bearing center of the entire operation: where customers buy, where support tickets land, where warranty registrations flow, and — crucially — the domain behind every `@lenovo.com` email address in the company.

When a brand reaches that scale, the domain stops being a website address and becomes infrastructure. Every press release, every retail box, every employee signature, every order confirmation routes through it. Which means whoever controls the domain's DNS controls not just the website, but the *truth* about where lenovo.com points — for browsers and mail servers alike.

That is the prize Lizard Squad went after. Not the website. The pointer to it.

## February 25, 2015: the bizarre redirect

![Vivid colorful concept art of a corporate glass storefront whose illuminated sign has been swapped overnight for a garish prank billboard, neon pinks and electric blues, a crowd staring up in confusion, no brand logos](../../assets/the-lenovo-com-dns-hijack-01-hijack.jpg)

Starting that afternoon, visitors who typed lenovo.com did not reach Lenovo. The site had been replaced with a [slideshow of webcam pics of kids sitting at their computer](https://www.engadget.com/2015-02-25-lenovo-com-hacked.html), looking blank and faintly embarrassed, all set to the sounds of ["Breaking Free"](https://www.engadget.com/2015-02-25-lenovo-com-hacked.html) from *High School Musical*. The Register described the same scene as a [slideshow of webcam photos of a bored-looking youth](https://www.theregister.com/2015/02/25/lenovo_hacked_lizard_squad/#:~:text=slideshow%20of%20webcam%20photos%20of%20a%20bored%2Dlooking%20youth) instead of the company's normal wares.

It was deliberately absurd, and the absurdity was the point. This was not a quiet data theft meant to stay hidden. It was a public humiliation, staged on the most visible URL the company owned.

The attribution was hiding in plain sight. The replacement page's HTML credited its "new and improved rebranded" build to [Ryan King and Rory Andrew Godfrey](https://www.engadget.com/2015-02-25-lenovo-com-hacked.html) — two names internet sleuths quickly tied to Lizard Squad, the same crew that had spent the prior holiday season knocking the PlayStation Network and Xbox Live offline. The group took credit on Twitter, quoting the *High School Musical* lyrics back at Lenovo for good measure.

And then it got worse than embarrassing. Because the attackers controlled lenovo.com's DNS, they did not just own the website — they owned the mail. As one outlet put it, the hijack [meant it was able to intercept Lenovo email as well](https://www.engadget.com/2015-02-25-lenovo-com-hacked.html), until the redirect was shut off. Lizard Squad later published two messages [sent to employees at Lenovo](https://www.bankinfosecurity.com/lizard-squad-teases-lenovo-e-mail-grab-a-7953#:~:text=published%20two%20e%2Dmails) during the window it held control. One of them, with grim comedic timing, [referred to a Lenovo Yoga laptop that was "bricked"](https://www.bankinfosecurity.com/lizard-squad-teases-lenovo-e-mail-grab-a-7953#:~:text=bricked) when a customer tried to run Lenovo's own tool to remove a piece of software called Superfish.

That attacker-posted email fed speculation about motive, but it does not independently establish that the removal tool caused the reported device failure or why Lenovo was targeted.

## The Superfish backdrop

To understand why Lenovo specifically, you have to rewind five days.

Superfish was adware that Lenovo had been [bundling with some of its computers since September 2014](https://en.wikipedia.org/wiki/Superfish#:~:text=Lenovo%20began%20to%20bundle%20the%20software%20with%20some%20of%20its%20computers%20in%20September%202014). On its face it was just an ad-injector — software that slipped extra shopping ads into your browser. But the way it worked was catastrophic. To inject ads into encrypted pages, Superfish installed its own root certificate so it could [introduce ads even on encrypted pages](https://en.wikipedia.org/wiki/Superfish#:~:text=allows%20a%20man%2Din%2Dthe%2Dmiddle%20attack%20to%20introduce%20ads%20even%20on%20encrypted%20pages) — in other words, it broke the padlock that protects HTTPS.

Worse, the certificate used the same [private key](/en/glossary/private-key/) on every machine, and that key was crackable. Any attacker who extracted it could impersonate *any* HTTPS website to *any* Lenovo laptop running Superfish. This was not a theoretical flaw. On [February 20, 2015, the United States Department of Homeland Security advised uninstalling it](https://en.wikipedia.org/wiki/Superfish#:~:text=the%20United%20States%20Department%20of%20Homeland%20Security%20advised%20uninstalling%20it) and its root certificate.

Lenovo had shipped some consumer notebooks with software that introduced a man-in-the-middle vulnerability. The hijack followed days of public backlash over Superfish, so contemporary reports discussed retaliation as a possible motive. The attackers did not publish evidence that conclusively established their motive, and Lenovo's official statement focused on restoring service and investigating the redirect.

## How it happened: reported compromise at the registrar

![Vivid colorful concept art of a hijacked control panel with glowing routing dials and switches, a shadowy hand rerouting a brand's front door and mail pipes down a new neon-lit path, electric teal and magenta, no brand logos](../../assets/the-lenovo-com-dns-hijack-02-registrar-compromise.jpg)

Lenovo's public statement confirmed the traffic redirect but did not publish the underlying exploit chain. Independent researchers pointed instead to the registrar layer.

Security researchers attributed the hijack to a compromise of **Web Commerce Communications** — better known as **Webnic.cc**, a Malaysia-based registrar. As Help Net Security reported, the researchers' account was that the attackers compromised Webnic rather than Lenovo's servers. Webnic told KrebsOnSecurity that it was still investigating and did not publicly confirm the detailed mechanism.

Just two days earlier, Google's Vietnamese domain had been redirected in a similar way. SecurityWeek reported that both incidents followed a Webnic breach. Brian Krebs was more explicit about the attribution: his mechanism came from statements by researchers Ryan King and Rory Godfrey, who said attackers had seized control over Webnic.cc. That account is credible reporting, but it should not be read as a Webnic-confirmed forensic finding.

The mechanics below are the researchers' account as reported by Krebs, not a mechanism confirmed by Webnic or Lenovo:

- **The reported way in.** The researchers said Lizard Squad used a [command-injection vulnerability in Webnic.cc to upload a rootkit](https://krebsonsecurity.com/2015/02/webnic-registrar-blamed-for-hijack-of-lenovo-google-domains/#:~:text=command%20injection%20vulnerability%20in%20Webnic.cc%20to%20upload%20a%20rootkit), which would have enabled hidden access to registrar systems.
- **The reported auth-code exposure.** They also said the attackers [gained access to Webnic's store of](https://krebsonsecurity.com/2015/02/webnic-registrar-blamed-for-hijack-of-lenovo-google-domains/#:~:text=also%20gained%20access%20to%20Webnic%27s%20store%20of) ["auth codes"](/en/glossary/auth-code/), the EPP secrets used to authorize inter-registrar transfers. The Lenovo incident itself was a routing change, not a disclosed domain transfer.
- **The redirect.** With registrar-level control, they changed lenovo.com's [nameserver](/en/glossary/nameserver/) records. The Register noted the domain's [nameserver settings were suspiciously updated today to point at DNS servers belonging to web hosting biz CloudFlare](https://www.theregister.com/2015/02/25/lenovo_hacked_lizard_squad/#:~:text=nameserver%20settings%20were%20suspiciously%20updated%20today%20to%20point%20at%20DNS%20servers%20belonging%20to%20web%20hosting%20biz%20CloudFlare) — using Cloudflare to mask the true destination server.
- **The mail grab.** Crucially, they didn't stop at the website. They [changed mail server records allowing them to intercept messages](https://www.securityweek.com/lizard-squad-hijacks-lenovo-website-emails/) sent to Lenovo addresses. DNS controls more than the `A` record; it controls the `MX` record too. Owning the domain meant owning the mail.

That last point is the one people forget. A defacement is loud and obvious. Silent email interception is the dangerous half of a DNS hijack — and it falls out of the same single act of changing a record at the registrar.

## Response and aftermath

Lenovo moved fast, because there was little else it could do — the fix lived at the registrar, not on its own servers. The company confirmed it had been [the victim of a cyber attack](https://www.securityweek.com/lizard-squad-hijacks-lenovo-website-emails/) whose effect was to redirect traffic from the Lenovo website, and it [appeared to have restored complete access to its public website by the evening of Feb. 25](https://www.bankinfosecurity.com/lizard-squad-teases-lenovo-e-mail-grab-a-7953#:~:text=restored%20complete%20access%20to%20its%20public%20website%20by%20the%20evening%20of%20Feb.%2025). Cloudflare, finding its name used in the redirect chain, cut off the malicious nameservers, which also ended the email interception.

The bigger investigation belonged to Webnic. Researchers attributed two high-profile redirects — Lenovo and Google Vietnam — to its systems within a 48-hour span. Because Webnic did not publicly confirm the reported command-injection and rootkit chain, the incident is best treated as a strong third-party attribution rather than a completed public forensic report.

For Lenovo, the lasting damage was reputational. Coming days after Superfish, the hijack turned a serious security failure into a two-act story: first the company broke trust for its own customers, then it visibly lost control of its own name. The webcam slideshow is what people remembered, but the registrar compromise is what actually mattered.

## What this teaches: your registrar is your real perimeter

The uncomfortable lesson of EP17 is that Lenovo did most things right on the parts it controlled, and still got hijacked through the part it didn't.

A few takeaways that generalize far beyond 2015:

1. **The registrar is in your trust boundary whether you treat it that way or not.** You can harden every server you own and still lose the domain at a third party you've probably never security-reviewed. The attacker takes the path of least resistance — and the registrar is often softer than you are.
2. **DNS control is mail control.** A hijack isn't just a defaced homepage. The same record change quietly reroutes email, enabling interception, password resets against your domain, and impersonation. Treat the `MX` record as a security-critical asset, not plumbing.
3. **Use the right lock for the change you want to stop.** `clientTransferProhibited` blocks inter-registrar transfer; it does not block nameserver updates. For high-value domains, ask whether the registrar and registry support update-prohibiting controls such as `clientUpdateProhibited`, `serverUpdateProhibited`, or a registry-lock service, and define an authenticated emergency-unlock process. Restrict EPP/auth-code access separately.
4. **Understand the [DNSSEC](/en/glossary/dnssec/) boundary.** DNSSEC lets validating resolvers detect answers that do not match the signed delegation. It does not prevent an authorized registrar or registry path from changing delegation data, and a bad change may turn a hijack into a validation failure and outage rather than preserve availability. Monitor DNS and DNSSEC state together.
5. **Monitor your own DNS for drift.** Lenovo's nameservers changing to an unexpected provider was the tell. Continuous monitoring of NS and MX records turns "we found out when customers saw a slideshow" into "we got paged when the record changed."

The shared theme: domain control is a security domain of its own, and most companies have outsourced it to a vendor that never appears in their threat model.

## The Namefi angle

![Colorful illustration of verifiable, tamper-resistant domain ownership — a domain card secured by a green shield, a green Namefi token, and DNS continuity](../../assets/the-lenovo-com-dns-hijack-03-namefi-angle.jpg)

The Lenovo hijack was a DNS-administration incident: someone changed nameserver and mail-routing state through the registrar path. That state is separate from domain ownership. An ownership record — conventional or tokenized — does not by itself stop a compromised registrar or registry from changing NS, MX, DS, or other delegation data.

[Namefi](https://namefi.io) provides an on-chain ownership and transfer layer for tokenized domains. It can make that ownership state independently auditable, but it does not make registrar or DNS-provider changes automatically appear on-chain, and it would not by itself have prevented the Lenovo redirect. The relevant defenses remain hardened registrar access, update-prohibiting registry controls where available, DNS/DNSSEC monitoring, and an incident-recovery process that spans every provider in the resolution path.

## Sources and further reading

- Lenovo — [Statement on Cyber Attack](https://news.lenovo.com/pressroom/press-releases/lenovo-statement-on-cyber-attack/)
- Krebs on Security — [Webnic Registrar Blamed for Hijack of Lenovo, Google Domains](https://krebsonsecurity.com/2015/02/webnic-registrar-blamed-for-hijack-of-lenovo-google-domains/)
- The Register — [Oh No, Lenovo! Lizard Squad on the attack, flashes swiped emails](https://www.theregister.com/2015/02/25/lenovo_hacked_lizard_squad/)
- Engadget — [Lenovo's website hijacked, apparently by Lizard Squad](https://www.engadget.com/2015-02-25-lenovo-com-hacked.html)
- SecurityWeek — [Lizard Squad Hijacks Lenovo Website, Emails](https://www.securityweek.com/lizard-squad-hijacks-lenovo-website-emails/)
- Help Net Security — [Lenovo.com hijacking made possible by compromise of Webnic registrar](https://www.helpnetsecurity.com/2015/02/26/lenovocom-hijacking-made-possible-by-compromise-of-webnic-registrar/)
- BankInfoSecurity — [Lenovo Website Hijacked](https://www.bankinfosecurity.com/lizard-squad-teases-lenovo-e-mail-grab-a-7953)
- IT Security Guru — [Lizard Squad domain hijack gives control of Google Vietnam and Lenovo website](https://www.itsecurityguru.org/2015/02/26/lizard-squad-domain-hijack-gives-control-of-google-vietnam-and-lenovo-website/)
- CNBC — [Lenovo website breached, hacker group Lizard Squad claims responsibility](https://www.cnbc.com/2015/02/25/lenovo-website-breached-hacker-group-lizard-squad-claims-responsibility.html)
- We Live Security (ESET) — [Lenovo website hacked, Lizard Squad claims responsibility](https://www.welivesecurity.com/2015/02/26/lenovo-website-hacked-lizard-squad-claims-responsibility/)
- Computing — [Lenovo website hijacked by Lizard Squad after Superfish debacle](https://www.computing.co.uk/news/2397084/lenovo-website-hijacked-by-lizard-squad-after-superfish-debacle)
- Wikipedia — [Superfish](https://en.wikipedia.org/wiki/Superfish)
- CISA — [Lenovo Superfish Adware Vulnerable to HTTPS Spoofing](https://www.cisa.gov/news-events/alerts/2015/02/20/lenovo-superfish-adware-vulnerable-to-https-spoofing)
