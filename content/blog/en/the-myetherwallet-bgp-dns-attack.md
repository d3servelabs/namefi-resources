---
title: 'The MyEtherWallet BGP + DNS Attack: How Hijacked Internet Routing Drained $150K in ETH'
date: '2026-06-17'
language: en
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
cluster: domain-security
series: domain-apocalypse
seriesOrder: 17
format: case-study
description: 'On April 24, 2018, attackers hijacked the internet routing for Amazon Route 53, poisoned DNS answers for myetherwallet.com, and served a phishing clone behind a self-signed certificate — draining roughly $150,000 in Ethereum. A Domain Mayday deep-dive into why DNS rides on a routing layer that trusts by default.'
keywords: ['myetherwallet', 'bgp hijack', 'dns hijacking', 'amazon route 53', 'route 53 hijack', 'dns security', 'bgp routing security', 'ethereum phishing', 'self-signed certificate', 'enet as10297', 'rpki roa', 'crypto wallet phishing', 'domain security']
---

When you type a website's name into a browser, you are trusting two invisible systems to be honest with you.

The first is **DNS** — the phone book of the internet — which turns a name like `myetherwallet.com` into a numeric [IP address](/en/glossary/ip-address/). The second is **BGP**, the Border Gateway Protocol, which decides which physical path your packets take to reach that address. Almost nobody thinks about either one. They just work, billions of times a day, silently.

On the morning of **April 24, 2018**, both of them lied at the same time. For about two hours, anyone who typed `myetherwallet.com` and clicked past one browser warning was handed to a [phishing](/en/glossary/phishing/) clone running on a server far from where they thought they were going. By the time the routing was corrected, the attackers had drained roughly **$150,000 in [Ethereum](/en/glossary/ethereum/)** from real users' [wallets](/en/glossary/wallet/).

What makes this incident a permanent fixture in security curricula is not the dollar amount — crypto thefts have since dwarfed it. It is the *mechanism*. The attackers never broke into MyEtherWallet's servers. They never guessed a password. They attacked the **road**, not the building — by hijacking the internet's routing layer to poison DNS itself.

## DNS sits on top of a routing layer that trusts by default

To understand what happened, you have to understand the uncomfortable foundation underneath every domain name on earth.

DNS answers the question "what IP address is `myetherwallet.com`?" But for your DNS query to even reach the right server, the internet's routers have to know *which network* owns the IP addresses of that DNS server — and to find out, they rely on BGP.

Here is the catch. BGP is, by design, a trust-based system. As the Cloudflare-style summary on Wikipedia puts it, [by default the BGP protocol is designed to trust all route announcements sent by peers](https://en.wikipedia.org/wiki/BGP_hijacking#:~:text=by%20default%20the%20BGP%20protocol%20is%20designed%20to%20trust%20all%20route%20announcements%20sent%20by%20peers). Security researcher Bob Cromwell describes the original intent even more bluntly: [BGP was designed to be a chain of trust between well-meaning ISPs and universities that blindly believe the information they receive](https://cromwell-intl.com/cybersecurity/bgp-hijacking.html#:~:text=BGP%20was%20designed%20to%20be%20a%20chain%20of%20trust).

In other words: when a network operator stands up and announces to the world "traffic for *these* IP addresses should come through *me*," the rest of the internet has historically just believed it. There is a more-specific-route tiebreaker built into BGP — if two networks claim the same addresses, the one announcing the *narrower*, more specific block wins. That tiebreaker is exactly the lever an attacker pulls.

So the attack surface for any domain is bigger than its [registrar](/en/glossary/registrar/), bigger than its DNS provider, and bigger than its web host. It includes the entire global routing fabric that gets your DNS query to the right place. MyEtherWallet found out the hard way.

## What users lost on April 24, 2018

![Vivid colorful concept art of internet traffic flowing along a glowing data highway, suddenly diverted by a counterfeit detour sign onto a fake road leading to an impostor building, packets of light scattering into a trap](../../assets/the-myetherwallet-bgp-dns-attack-01-attack.jpg)

The damage was concentrated into a roughly two-hour window. According to The Register, the malicious routing ran [between 11am and 1pm UTC](https://www.theregister.com/2018/04/24/myetherwallet_dns_hijack/#:~:text=Between%2011am%20and%201pm%20UTC) that day. In that window, some fraction of everyone trying to reach `myetherwallet.com` was quietly handed to an impostor.

The impostor was convincing. It looked like MyEtherWallet because it was a near-exact clone. The *only* thing that gave it away was a certificate warning — and crucially, users could click straight through that warning. Those who did, and then logged in, handed over the keys to their own funds. As BleepingComputer reported, [those who logged in had their wallet private keys stolen, which the attacker used to empty accounts](https://www.bleepingcomputer.com/news/security/hacker-hijacks-dns-server-of-myetherwallet-to-steal-160-000/#:~:text=Those%20who%20logged%20in%20had%20their%20wallet%20private%20keys%20stolen).

The tally is reported slightly differently across outlets, but the core number is consistent. BleepingComputer put it at [215 Ether, the equivalent of $160,000, at the time of the transaction](https://www.bleepingcomputer.com/news/security/hacker-hijacks-dns-server-of-myetherwallet-to-steal-160-000/#:~:text=215%20Ether%2C%20the%20equivalent%20of%20%24160%2C000). CyberScoop reported that the thieves [managed to steal 215 Ether, amounting to about $152,000 at the time](https://cyberscoop.com/ether-dns-bgp-amazon-route-53-heist/#:~:text=215%20Ether%2C%20amounting%20to%20about%20%24152%2C000). Help Net Security summarized that attackers [managed to steal approximately $150,000 in Ethereum](https://www.helpnetsecurity.com/2018/04/25/myetherwallet-dns-hijacking/#:~:text=approximately%20%24150%2C000%20in%20Ethereum). Same 215 ETH; the dollar figure just floats with the exchange rate at the moment of the theft.

That is the brutal economics of a routing-plus-DNS attack on a crypto wallet. There is no fraud-reversal department, no chargeback, no bank to call. Once private keys are entered into an attacker's clone and funds are moved [on-chain](/en/glossary/on-chain/), they are gone.

## How it happened: hijack the route, poison the answer, serve the clone

![Vivid colorful concept art of a hijacked glowing world map where a GPS route is rerouted by an impostor hand redrawing the path, travelers led toward a fake landmark building while the real destination glows ignored in the distance](../../assets/the-myetherwallet-bgp-dns-attack-02-bgp-hijack.jpg)

The attack chained two failures together. Neither alone would have worked. Together they were devastating.

**Step one: hijack the route to Amazon's DNS servers.** MyEtherWallet used Amazon's managed DNS service. As Help Net Security noted plainly, [MyEtherWallet.com uses Amazon's Route 53 DNS service](https://www.helpnetsecurity.com/2018/04/25/myetherwallet-dns-hijacking/#:~:text=MyEtherWallet.com%20uses%20Amazon%27s%20Route%2053%20DNS%20service). The attackers did not break into Route 53. Instead, per The Register, [someone was able to send BGP – Border Gateway Protocol – messages to the internet's core routers to convince them to send traffic destined for some of AWS's servers to a renegade box](https://www.theregister.com/2018/04/24/myetherwallet_dns_hijack/#:~:text=someone%20was%20able%20to%20send%20BGP).

The announcement that did it came from an unexpected place. The Register reported that [the network block AS10297, belonging to Ohio-based website hosting biz eNet, announced it could take over traffic destined for some of AWS's IP addresses](https://www.theregister.com/2018/04/24/myetherwallet_dns_hijack/#:~:text=the%20network%20block%20AS10297%2C%20belonging%20to%20Ohio-based%20website%20hosting%20biz%20eNet). And because BGP prefers more-specific routes and trusts its peers, the bogus announcement propagated. Wikipedia records the scale: [Roughly 1300 IP addresses within Amazon Web Services space, dedicated to Amazon Route 53, were hijacked by eNet (or a customer thereof), an ISP in Columbus, Ohio. Several peering partners, such as Hurricane Electric, blindly propagated the announcements](https://en.wikipedia.org/wiki/BGP_hijacking#:~:text=Roughly%201300%20IP%20addresses%20within%20Amazon%20Web%20Services%20space). "Blindly propagated" is the whole story of BGP's trust model in two words.

**Step two: become the DNS server and lie.** Once the route was hijacked, queries that should have gone to Amazon's real DNS servers landed on the attacker's box instead. That box impersonated Route 53. The Register described the result: [that rogue machine then acted as AWS's DNS service, and gave out the wrong IP addresses for MyEtherWallet.com, pointing some unlucky visitors to the dot-com at a phishing site](https://www.theregister.com/2018/04/24/myetherwallet_dns_hijack/#:~:text=That%20rogue%20machine%20then%20acted%20as%20AWS%27s%20DNS%20service). Kentik's analysis frames the same fact from the DNS side: [the imposter authoritative DNS server returned bogus responses for myetherwallet.com, misdirecting users to an imposter version of MyEtherWallet's website](https://www.kentik.com/blog/bgp-hijacks-targeting-cryptocurrency-services/#:~:text=The%20imposter%20authoritative%20DNS%20server%20returned%20bogus%20responses%20for%20myetherwallet.com).

**Step three: serve the phishing clone — from Russia.** The poisoned DNS answers pointed users at a server in Russia hosting the fake wallet. Help Net Security reported that the attackers used the hijack to [redirect traffic meant for MyEtherWallet.com to the lookalike phishing site, hosted on a server in Russia](https://www.helpnetsecurity.com/2018/04/25/myetherwallet-dns-hijacking/#:~:text=they%20redirect%20traffic%20meant%20for%20MyEtherWallet.com%20to%20the%20lookalike%20phishing%20site%2C%20hosted%20on%20a%20server%20in%20Russia).

**The one safeguard that almost worked: the certificate.** Here is the part every reader should sit with. The attackers controlled the domain's *resolution* and the *server*, but they could not produce a valid TLS certificate for `myetherwallet.com` issued by a trusted authority. So the browser did exactly what it was supposed to do — it threw a warning. Help Net Security described it precisely: [the only thing that gave some indication that the phishing site is not what it pretended to be was the warning showed to visitors saying that the TLS certificate used by the site was signed by an unknown authority (i.e., was self-signed)](https://www.helpnetsecurity.com/2018/04/25/myetherwallet-dns-hijacking/#:~:text=the%20only%20thing%20that%20gave%20some%20indication). BleepingComputer agreed the tell was obvious to anyone paying attention: [the fake website was easy to spot because attackers used a self-signed TLS certificate that triggered an error with all modern browsers](https://www.bleepingcomputer.com/news/security/hacker-hijacks-dns-server-of-myetherwallet-to-steal-160-000/#:~:text=The%20fake%20website%20was%20easy%20to%20spot).

But "easy to spot" assumes the user stops. ESET's WeLiveSecurity captured how thin the protection really was: [the only obvious clue that a typical user might have spotted was that when they visited the fake MyEtherWallet site they would have seen an error message telling them that the site was using an untrustworthy SSL certificate](https://www.welivesecurity.com/2018/04/25/ethereum-cryptocurrency-wallets-raided/#:~:text=The%20only%20obvious%20clue%20that%20a%20typical%20user%20might%20have%20spotted). The browser raised its hand and said *this is wrong*. The users who lost money are the ones who clicked through anyway — and victims [had to click through a HTTPS error message, as the fake MyEtherWallet.com was using an untrusted TLS/SSL certificate](https://www.theregister.com/2018/04/24/myetherwallet_dns_hijack/#:~:text=Victims%20had%20to%20click%20through%20a%20HTTPS%20error%20message).

## Response and aftermath

The hijack was not subtle to the people who watch routing for a living. Networking monitors saw the bogus, more-specific prefixes appear and then withdraw within the same two-hour window, and once the rogue announcement was pulled, normal routing to Route 53 returned.

MyEtherWallet itself was emphatic that its own infrastructure had not been breached. As the company stressed in the immediate aftermath, the problem was the internet's plumbing, not its application — this was a [DNS hijacking](https://www.helpnetsecurity.com/2018/04/25/myetherwallet-dns-hijacking/#:~:text=DNS%20hijacking) of the resolution path, achieved through BGP, rather than a compromise of MEW's servers or code.

The deeper fix landed at the routing layer. The episode became one of the most-cited arguments for **RPKI** (Resource Public Key Infrastructure) and **ROAs** (Route Origin Authorizations) — cryptographic records that let networks declare, in a verifiable way, which autonomous systems are *allowed* to announce which IP prefixes. With valid ROAs in place, a stray "I'll take Amazon's addresses" announcement from an Ohio ISP can be flagged as **RPKI-invalid** and dropped instead of [blindly propagated](https://en.wikipedia.org/wiki/BGP_hijacking#:~:text=blindly%20propagated%20the%20announcements). Kentik notes the consequence directly: if the same announcement were made today against a properly signed prefix, [it would have been evaluated as RPKI-invalid](https://www.kentik.com/blog/bgp-hijacks-targeting-cryptocurrency-services/#:~:text=it%20would%20have%20been%20evaluated%20as%20RPKI-invalid). In the years after attacks like this, large networks accelerated publishing ROAs for exactly this class of route.

But RPKI adoption is a global, multi-year, opt-in effort. The lesson for everyone else was simpler and more immediate: your domain's safety depends on layers you do not own and cannot see.

## What this teaches about BGP and DNS being trust-by-default

This incident is worth memorizing because it inverts the usual mental model of "domain security."

Most people think domain security means a strong registrar password, two-factor authentication, and a registrar lock. All of that is real and necessary — and **none of it would have stopped April 24, 2018.** The attackers never touched the registrar, never touched MyEtherWallet's DNS records, never touched its servers. The records said the right thing the whole time. The internet just stopped delivering queries to the place that held them.

A few durable takeaways:

1. **Your domain rides on borrowed trust.** Resolution depends on BGP, and BGP, by [default... is designed to trust all route announcements sent by peers](https://en.wikipedia.org/wiki/BGP_hijacking#:~:text=by%20default%20the%20BGP%20protocol%20is%20designed%20to%20trust%20all%20route%20announcements%20sent%20by%20peers). You can have a flawless DNS configuration and still be hijacked one layer down.

2. **DNS poisoning can be achieved without ever touching DNS.** Hijack the route to the DNS server and you control the answers, even when the authoritative records are untouched.

3. **TLS is a real backstop — and a fragile one.** The certificate warning was the single thing standing between users and total loss. It worked technically and failed behaviorally. A security control a user can click past is only as strong as the user's patience.

4. **On-chain finality removes the safety net.** For a bank login, a poisoned session is bad. For a crypto wallet, it is irreversible. The same attack against a different kind of site would have been a scare; here it was a permanent loss.

5. **Defense in depth has to include the routing layer.** RPKI/ROA at the network level, plus monitoring for unexpected origin announcements of your prefixes, is now table stakes for anything high-value.

## The Namefi angle

![Colorful illustration of verifiable, tamper-resistant domain ownership — a domain card secured by a green shield, a green Namefi token, and DNS continuity](../../assets/the-myetherwallet-bgp-dns-attack-03-namefi-angle.jpg)

The MyEtherWallet attack is a sharp reminder that a domain is not a single thing you "own" — it is a stack of trust relationships, any layer of which can be subverted: the [registry](/en/glossary/registry/), the registrar, the DNS provider, and the global routing fabric that delivers queries to that provider.

[Namefi](https://namefi.io) is built around making the *ownership* layer of that stack verifiable and tamper-resistant. [Tokenized domain ownership](/en/blog/what-are-tokenized-domains/) means control of a domain can be cryptographically proven and transferred in a way that is auditable, rather than resting solely on an account password at a single provider — while still staying compatible with DNS. It does not, on its own, fix BGP; nothing at the ownership layer rewrites how the internet routes packets. But it attacks the same underlying disease this incident exposed: **too much critical internet trust is implicit, unverifiable, and reversible by whoever can spoof the right message.**

The future of domain security looks less like one strong password and more like cryptographic proof at every layer — verifiable ownership, verifiable routing (RPKI), verifiable identity (TLS). MyEtherWallet's users lost money in the gap between those layers. Closing that gap, one verifiable layer at a time, is the whole project.

The domain records were never wrong on April 24, 2018. The internet just believed a lie about how to reach them. Making "who owns what, and how do you reach it" provable instead of assumed is how you make sure the next forged announcement gets dropped instead of obeyed.

## Sources and further reading

- The Register — [Cryptocurrency thieves snatch ~$150k after BGP hijack reroutes MyEtherWallet DNS](https://www.theregister.com/2018/04/24/myetherwallet_dns_hijack/)
- BleepingComputer — [Hacker Hijacks DNS Server of MyEtherWallet to Steal $160,000](https://www.bleepingcomputer.com/news/security/hacker-hijacks-dns-server-of-myetherwallet-to-steal-160-000/)
- Help Net Security — [MyEtherWallet users robbed after successful DNS hijacking attack](https://www.helpnetsecurity.com/2018/04/25/myetherwallet-dns-hijacking/)
- CyberScoop — [Amazon DNS service server hijacked for $152,000 Ether theft](https://cyberscoop.com/ether-dns-bgp-amazon-route-53-heist/)
- ESET WeLiveSecurity — [Ethereum cryptocurrency wallets raided after Amazon's internet domain service hijacked](https://www.welivesecurity.com/2018/04/25/ethereum-cryptocurrency-wallets-raided/)
- Kentik — [What can be learned from recent BGP hijacks targeting cryptocurrency services?](https://www.kentik.com/blog/bgp-hijacks-targeting-cryptocurrency-services/)
- Wikipedia — [BGP hijacking](https://en.wikipedia.org/wiki/BGP_hijacking)
- Bob Cromwell — [BGP Hijacking](https://cromwell-intl.com/cybersecurity/bgp-hijacking.html)
- Neptune Mutual — [How Was MEW (MyEtherWallet) DNS Spoofed?](https://medium.com/neptune-mutual/how-was-mew-myetherwallet-dns-spoofed-cb813fab15f0)
- WCCFTech — [Hackers Hijacked DNS Servers to Steal from MyEtherWallet Users](https://wccftech.com/hackers-domain-service-to-empty-ethereum-wallets/)
