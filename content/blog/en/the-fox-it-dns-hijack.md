---
title: 'Domain Mayday EP14: When a Security Firm Got DNS-Hijacked — The Fox-IT Incident'
date: '2026-06-17'
language: en
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: 'In September 2017, attackers logged into Dutch security firm Fox-IT''s third-party domain registrar, changed its DNS, fraudulently obtained a TLS certificate, and ran a 10-hour man-in-the-middle on client traffic — until Fox-IT caught it and published one of the most transparent post-mortems in the industry.'
keywords: ['fox-it dns hijack', 'fox-it man in the middle', 'fox-it incident 2017', 'dns hijacking', 'registrar account compromise', 'fraudulent ssl certificate', 'man-in-the-middle attack', 'domain registrar security', 'two-factor authentication dns', 'dnssec', 'registry lock', 'domain security', 'ncc group fox-it']
---

The thing about a man-in-the-middle attack is that, while it is happening, everything looks normal.

The site loads. The address bar shows the right domain. The padlock is closed. The certificate is valid. Files upload, logins succeed, emails arrive. There is no error, no warning, no broken image — just a quiet third party sitting in the middle of the conversation, reading everything as it passes through and then forwarding it on so neither side notices the delay.

Now imagine that happening to the people whose job is to notice exactly this.

In September 2017, the Dutch cybersecurity firm Fox-IT — a company that investigates breaches, builds interception-detection sensors, and advises governments on how attackers move — discovered that an attacker had hijacked its own domain's DNS, obtained a TLS certificate in its name, and spent the better part of a day reading traffic to and from its client portal. The locksmith's own lock had been picked. And then Fox-IT did the thing almost no breached company does: it [published a detailed account of exactly how](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=we%20limited%20the%20total%20effective%20MitM%20time%20to%2010%20hours%20and%2024%20minutes).

## Even a security firm depends on its registrar

Here is the uncomfortable truth this case makes concrete: no matter how good your internal security is, a large part of your attack surface lives at a company you don't run.

Your domain — the name your customers type, the address your certificates are issued against, the destination your email points to — is configured at a domain registrar. Whoever controls that registrar account controls where your name resolves. They can repoint your website, reroute your mail, and prove "ownership" of your domain to a certificate authority. None of that requires touching your servers, your firewalls, or your code. It requires logging into one web panel.

Fox-IT was, by any measure, a serious security organization. It ran full packet capture and its own network sensors. It used two-factor authentication on its client-facing portal. It later got acquired into NCC Group. And it was still exposed through the one account it almost never logged into — because, as the company itself put it, [DNS settings in general change very rarely](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=DNS%20settings%20in%20general%20change%20very%20rarely), so the credentials that guarded them got quietly stale.

As Fox-IT framed it in the opening of its own report: [if such an attack can hit a security firm, it could most likely hit many other types of businesses](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=if%20such%20an%20attack%20can%20hit%20a%20security%20firm) which are less focused on security.

## September 19, 2017: the hijack and the MITM

![Vivid colorful concept art of a quiet eavesdropper figure reading two streams of mail flowing between two distant towers, the streams passing invisibly through their hands while both towers glow as if nothing is wrong](../../assets/the-fox-it-dns-hijack-01-hijack.jpg)

Fox-IT's account opens with a line that has since become a small classic in incident-response writing: [For Fox-IT "if" became "when" on Tuesday, September 19 2017](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=became%20%E2%80%98when%E2%80%99%20on%20Tuesday%2C%20September%2019%202017), when the company fell victim to a man-in-the-middle attack.

What happened was not a server exploit. In the early morning of September 19, [an attacker accessed the DNS records for the Fox-IT.com domain at our third party domain registrar](https://grahamcluley.com/fox-it-dns-hack/#:~:text=an%20attacker%20accessed%20the%20DNS%20records%20for%20the%20Fox%2DIT.com%20domain). With control of those records, the attacker [modified a DNS record for one particular server to point to a server in their possession and to intercept and forward the traffic](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=modified%20a%20DNS%20record%20for%20one%20particular%20server) back to the real Fox-IT infrastructure.

That last detail — *forward the traffic* — is what made it a man-in-the-middle rather than a simple outage. Visitors still reached a working portal. They just reached it through the attacker first.

The target was specific. The attack was [specifically aimed at ClientPortal, Fox-IT's document exchange web application](https://grahamcluley.com/fox-it-dns-hack/#:~:text=specifically%20aimed%20at%20ClientPortal), the system Fox-IT used to exchange files securely with customers, suppliers, and other organizations. In other words, the attacker went straight for the channel where sensitive client documents flowed.

Because Fox-IT detected and contained it, the company [limited the total effective MitM time to 10 hours and 24 minutes](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=we%20limited%20the%20total%20effective%20MitM%20time%20to%2010%20hours%20and%2024%20minutes). Independent coverage put the same number on it: [the incident took place on September 19 and lasted for 10 hours and 24 minutes](https://www.bleepingcomputer.com/news/security/top-security-firm-admits-to-mitm-security-incident/#:~:text=lasted%20for%2010%20hours%20and%2024%20minutes).

## What was actually intercepted

Ten hours of man-in-the-middle on a document-exchange portal sounds catastrophic. The actual haul was small — and that smallness is itself the story.

During the window, [nine individual users logged in and their credentials were intercepted](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=Nine%20individual%20users%20logged%20in). But those credentials were largely useless: Fox-IT's portal required a second authentication factor that the attacker, sitting in the network path, could not replay. Help Net Security noted the login credentials of nine users were captured but [were useless without the second authentication factor](https://www.helpnetsecurity.com/2017/12/15/fox-it-security-breach/#:~:text=useless%20without%20the%20second%20authentication%20factor).

In terms of files, [twelve files (of which ten were unique) were transferred and intercepted](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=Twelve%20files%20%28of%20which%20ten%20were%20unique%29%20were%20transferred%20and%20intercepted). A handful contained confidential client information. The attacker also captured a subset of names and email addresses of ClientPortal users, some account names, and a mobile phone number, as [SecurityWeek summarized](https://www.securityweek.com/hackers-target-security-firm-fox-it/#:~:text=mobile%20phone%20number).

Two facts kept the damage bounded. First, Fox-IT stated plainly that [files classified as state secret are never transferred through our ClientPortal](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=Files%20classified%20as%20state%20secret%20are%20never%20transferred) — the most sensitive material simply never lived in the exposed channel. Second, the firm's own second factor blunted the credential theft. The architecture limited the blast radius even after the perimeter — DNS — had failed.

## How it happened: one stale password, no second factor

![Vivid colorful concept art of a single ornate key being lifted from a sleeping keyholder's pocket and used to swing open a giant signpost that reroutes a river of light toward a hidden mirrored booth, where a forged wax seal stamps a glowing certificate](../../assets/the-fox-it-dns-hijack-02-mitm.jpg)

The mechanism reads like a checklist of how a domain gets taken without a single line of malware on the victim's servers.

**Step one — get into the registrar account.** The attacker [successfully logged in to the DNS control panel of our third party domain registrar provider using valid credentials](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=logged%20in%20to%20the%20DNS%20control%20panel). Fox-IT's investigation concluded the attacker [likely gained access to credentials to the DNS control panel of their domain registrar through the compromise of a third party provider](https://www.helpnetsecurity.com/2017/12/15/fox-it-security-breach/#:~:text=through%20the%20compromise%20of%20a%20third%20party%20provider). Two compounding weaknesses made that login stick: the [password had not been changed since 2013](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=the%20password%20had%20not%20been%20changed%20since%202013), and the registrar offered no second factor at all — at the time of writing, Fox-IT noted, the [registrar still does not support 2FA](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=registrar%20still%20does%20not%20support%202FA).

**Step two — change DNS and prove "ownership" to a CA.** With the panel open, the attacker repointed DNS. But to run a *believable* man-in-the-middle on an HTTPS site, they needed a valid certificate for fox-it.com — and the modern way to get one is to prove you control the domain. So the attacker did exactly that. In a narrow window around 02:05–02:15, they [temporarily rerouted and intercepted Fox-IT email for the specific purpose of proving that they owned our domain in the process of fraudulently registering an SSL certificate for our ClientPortal](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=fraudulently%20registering%20an%20SSL%20certificate%20for%20our%20ClientPortal). This is the part that should make every reader pause: **control of DNS is, in practice, control of certificate issuance.** Domain-validated certificates are granted to whoever can answer a challenge at the domain — and DNS decides who that is.

**Step three — sit in the middle.** Armed with a legitimately-issued (but fraudulently-obtained) certificate, the attacker pointed the domain at a VPS abroad and intercepted traffic. As SecurityWeek described it, the [rogue SSL certificate was used for an MitM attack on ClientPortal, with traffic to the portal routed through a virtual private server (VPS) provider abroad](https://www.securityweek.com/hackers-target-security-firm-fox-it/#:~:text=rogue%20SSL%20certificate%20was%20used). To a visitor, nothing was wrong. The padlock was real. The certificate validated. The man in the middle was holding a key the browser trusted.

Three layers — DNS, the certificate authority, and TLS itself — were all technically functioning correctly. The attacker didn't break any of them. He convinced all three that he was Fox-IT, and the single thing that let him do that was one stale, single-factor login at a registrar.

## Fox-IT's response: detect, contain, then tell everyone

What separates this incident from a hundred quieter ones is the response — both technical and editorial.

**Detection came fast.** Fox-IT determined that its name servers for the fox-it.com domain had been redirected, catching the intrusion roughly five hours after it began — [some five hours after the attack started](https://www.helpnetsecurity.com/2017/12/15/fox-it-security-breach/#:~:text=five%20hours%20after%20the%20attack%20started), per Help Net Security. The full packet capture and network sensors the company ran on itself gave it the forensic record to reconstruct exactly what had and hadn't been touched.

**Containment was deliberate.** Rather than yank the portal offline and tip off the attacker, Fox-IT chose a quieter mitigation: it [disabled the second factor authentication for our ClientPortal login authentication system](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=disabled%20the%20second%20factor%20authentication) — a counterintuitive move, but one that let it manage the situation while regaining control of its DNS, all without revealing that it had spotted the intrusion. Then it [contacted affected clients in respect of these files immediately](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=All%20affected%20clients%20in%20respect%20of%20these%20files%20were%20contacted%20immediately).

**Then came the part that made it a case study.** Three months later, after analysis and with a law-enforcement investigation underway, Fox-IT published a full, timestamped post-mortem under a simple thesis: [transparency builds more trust than secrecy and there are lessons to be learned](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=transparency%20builds%20more%20trust%20than%20secrecy). A security company had been embarrassed in the most on-brand way possible — and instead of burying it, it handed the industry a teardown. BleepingComputer's headline captured the tone the moment deserved: [Top Security Firm Admits to MitM Security Incident](https://www.bleepingcomputer.com/news/security/top-security-firm-admits-to-mitm-security-incident/#:~:text=Top%20Security%20Firm%20Admits).

## What this teaches about registrar security and registry locks

Strip away the specifics and the Fox-IT incident is a lesson about where the real perimeter is. For most organizations, the perimeter isn't only the firewall. It's the registrar login. Here's what the case argues for:

1. **Treat the registrar account like production infrastructure.** It rarely changes, so it's easy to forget — which is exactly why it rots. A password untouched [since 2013](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=the%20password%20had%20not%20been%20changed%20since%202013) is not "low risk because low traffic"; it's a high-value credential with no monitoring on it.

2. **Demand multi-factor authentication at the registrar — and leave if it isn't offered.** Fox-IT's registrar [did not support 2FA](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=registrar%20still%20does%20not%20support%202FA) at all. The single most important account in your domain's security chain was protected by a password alone. The presence or absence of 2FA at a registrar is a procurement criterion, not a nice-to-have.

3. **Use a registry lock.** Beyond the registrar's own login, many registries offer a *registry lock* — a server-side hold that prevents changes to nameservers and contact records unless an out-of-band, manual verification step is completed. A registry lock would have meant that even a fully compromised registrar password could not silently repoint DNS. It converts "one panel away" into "multiple humans and a phone call away."

4. **Deploy DNSSEC where you can.** DNSSEC cryptographically signs DNS responses so resolvers can detect tampering in the resolution path. It is not a silver bullet here — an attacker who controls the authoritative records can re-sign them — but it raises the cost and closes off whole classes of in-transit DNS manipulation. Defense in depth at the DNS layer matters precisely because, as this case showed, DNS sits *above* TLS and certificate issuance in the trust stack.

5. **Remember that DNS control equals certificate control.** The attacker got a valid TLS certificate by [proving domain ownership through rerouted email](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=proving%20that%20they%20owned%20our%20domain). Monitor Certificate Transparency logs for unexpected certificates issued against your domains. A rogue cert appearing in CT is one of the few external signals that a DNS hijack may be underway.

6. **Keep a second factor on the application itself.** Fox-IT's portal 2FA is the reason nine stolen passwords were [useless without the second authentication factor](https://www.helpnetsecurity.com/2017/12/15/fox-it-security-breach/#:~:text=useless%20without%20the%20second%20authentication%20factor). When the outer layer (DNS) failed, the inner layer (app-level MFA) still bounded the damage.

The through-line: your domain is a single point of failure that you partly outsource. Hardening it is not glamorous, and it pays off only on the day someone tries exactly what happened to Fox-IT.

## The Namefi angle

![Colorful illustration of verifiable, tamper-resistant domain ownership — a domain card secured by a green shield, a green Namefi token, and DNS continuity](../../assets/the-fox-it-dns-hijack-03-namefi-angle.jpg)

The Fox-IT incident is, at its root, a control-and-provenance problem. The attacker never needed to be Fox-IT. He only needed one system — the registrar panel — to *believe* he was, long enough to repoint DNS and mint a certificate. Everything downstream trusted that belief.

[Namefi](https://namefi.io) is built around making domain control verifiable and tamper-resistant rather than dependent on a single reusable password in a vendor's web panel. By representing domain ownership as a verifiable, on-chain asset that stays compatible with DNS, control becomes something you can audit and prove — not just an account someone could quietly log into and reconfigure. Critical changes can be bound to ownership you actually hold, in the spirit of a registry lock, instead of to a credential that hasn't been rotated in years.

None of this would make a determined attacker impossible. But the Fox-IT story is ultimately about one stolen login translating into total control of a name. The closer domain control sits to verifiable ownership — and the harder it is to change a name silently with a single stale password — the less a moment like Fox-IT's "if became when" can spread before someone notices.

A security firm caught its own hijack in five hours and told the world how. Most organizations would catch it in neither. The cheapest lesson is the one Fox-IT paid for: lock down the registrar before it becomes the open door.

## Sources and further reading

- Fox-IT (NCC Group) — [Lessons learned from a Man-in-the-Middle attack](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/) (primary post-mortem)
- BleepingComputer — [Top Security Firm Admits to MitM Security Incident](https://www.bleepingcomputer.com/news/security/top-security-firm-admits-to-mitm-security-incident/)
- Help Net Security — [Security company Fox-IT reveals, details MitM attack they suffered in September](https://www.helpnetsecurity.com/2017/12/15/fox-it-security-breach/)
- Graham Cluley — [Fox-IT reveals hackers hijacked its DNS records, spied on clients' files](https://grahamcluley.com/fox-it-dns-hack/)
- SecurityWeek — [Hackers Target Security Firm Fox-IT](https://www.securityweek.com/hackers-target-security-firm-fox-it/)
- GBHackers — [Leading IT Security Firm Fox-IT hit by Cyber Attack](https://gbhackers.com/cyber-attack/)
- Krebs on Security — [A Deep Dive on the Recent Widespread DNS Hijacking Attacks](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/) (related: DNS-hijack + fraudulent-cert technique at scale)
