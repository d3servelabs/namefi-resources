---
title: 'The SushiSwap MISO Insider Attack: How One Malicious Commit Diverted ~$3M From a Token Auction'
date: '2026-06-17'
language: en
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
cluster: domain-security
series: domain-apocalypse
seriesOrder: 22
format: case-study
description: 'In September 2021 an anonymous contractor slipped their own wallet address into SushiSwap''s MISO launchpad front-end via a malicious commit, diverting 864.8 ETH (~$3M) from the Jay Pegs Auto Mart auction. A Domain Mayday deep-dive on code supply chains, front-end trust, and what it teaches about verifiable ownership.'
keywords: ['sushiswap miso hack', 'miso supply chain attack', 'aristok3', 'jay pegs auto mart', 'defi front-end attack', '864.8 eth', 'software supply chain', 'malicious commit', 'insider threat', 'auctionwallet', 'joseph delong', 'web supply chain security', 'domain security']
---

Most attacks force a door. This one walked in through the front.

In September 2021, the people running SushiSwap's MISO launchpad did not get phished, did not lose a [private key](/en/glossary/private-key/), and did not ship a buggy [smart contract](/en/glossary/smart-contract/). They did something far more ordinary: they trusted a contributor. An anonymous contractor with commit access to the code put their own [wallet](/en/glossary/wallet/) address into the [auction](/en/glossary/auction/) front-end, pushed it, and let the deployment pipeline do the rest. When a single NFT auction settled, roughly **864.8 ETH — about $3 million** — flowed not to the project that ran the sale, but to the developer who had quietly rewritten where the money should go.

No exploit. No zero-day. Just a line of code that nobody double-checked, signed by someone who was supposed to be on the team.

This is Domain Mayday EP15. It is a story about smart contracts only at the edges. At its core it is a story about the part of the web most people never audit: the code supply chain, the front-end, and the uncomfortable fact that "who is allowed to change this?" is a security question as serious as "who holds the keys?"

## The trust you place in launchpad code

A [DeFi](/en/glossary/defi/) launchpad like MISO — Minimal Initial SushiSwap Offering — exists to do one thing well: take money from a crowd of strangers and route it to a project running a token or NFT sale. To do that, it stitches together audited smart contracts [on-chain](/en/glossary/on-chain/) and a web front-end off-chain. Users interact with the front-end. The front-end tells their wallet what transaction to sign.

That seam is the soft underbelly. People obsess over the smart-contract layer because that is where the audits, the bug bounties, and the headlines live. But the front-end — the JavaScript that decides *which address* an auction pays out to — is just code in a repository, deployed by a pipeline, edited by whoever has write access. Audit the vault all you want; if an insider can change the sign that says "deposit money here," the vault never comes into it.

MISO's code was open and collaborative, the way crypto infrastructure tends to be. That openness is a feature: it invites contributors, accelerates shipping, and lets a small core team punch far above its weight. It is also exactly the surface a supply-chain attacker needs. You do not have to break in if you can simply be invited to contribute.

## September 2021: the malicious commit

![Vivid colorful concept art of a single tampered brick, glowing red, being quietly swapped into an otherwise clean open-source brick wall by an anonymous gloved hand](../../assets/the-sushiswap-miso-insider-attack-01-attack.jpg)

On Friday, September 17, 2021, SushiSwap's then-Chief Technology Officer Joseph Delong took to Twitter to explain what had happened. CoinDesk's account is blunt: Delong said that [an anonymous contractor using the Github handle "AristoK3" injected malicious code into Miso's front end in a supply chain attack](https://www.coindesk.com/business/2021/09/17/3m-in-ether-stolen-from-sushiswaps-miso-launchpad#:~:text=an%20anonymous%20contractor%20using%20the%20Github%20handle).

The mechanics were almost insultingly simple. As Delong described it, the attacker [replaced the auction's wallet address with their own](https://www.coindesk.com/business/2021/09/17/3m-in-ether-stolen-from-sushiswaps-miso-launchpad#:~:text=replaced%20the%20auction%27s%20wallet%20address%20with%20their%20own). PYMNTS put the act in supply-chain terms exactly: the contractor [pushed a malicious code commit that was distributed on the platform's front end](https://www.pymnts.com/news/security-and-risk/2021/sushiswap-crypto-platform-victimized-by-3m-hack/#:~:text=pushed%20a%20malicious%20code%20commit%20that%20was%20distributed%20on%20the%20platform%27s%20front%20end).

A post-mortem write-up of the incident captures the essence in one sentence: a developer who had been contracted to work on the auction [inserted his own wallet address into the contract instead of the auctionWallet](https://www.quadrigainitiative.com/casestudy/sushiswapmisojaypegsautomart.php#:~:text=inserted%20his%20own%20wallet%20address%20into%20the%20contract%20instead%20of%20the) — by editing the value the front-end fed in at deploy time, not by breaking the audited on-chain logic itself. One variable. `auctionWallet` was supposed to point at the project running the sale. Instead it pointed at the contractor. Every dollar a bidder thought they were sending to the auction's beneficiary went somewhere else, and the code looked perfectly normal while it did so.

## What was diverted: ~864.8 ETH, ~$3 million

The target was a single, almost comic auction. As CryptoSlate reported, MISO suffered a supply chain attack that [drained 864.8 ETH from the 'Jay Pegs Auto Mart' token auction contract](https://cryptoslate.com/hacker-returns-865-eth-stolen-from-sushis-token-launch-platform-miso/#:~:text=drained%20864.8%20ETH%20from%20the). Jay Pegs Auto Mart was an NFT art project styling itself as a used-car dealership — playful crypto-culture set dressing on top of what was, financially, a very real token sale.

The numbers landed the same way across outlets. PYMNTS reported that [the hacker transferred 864.8 Ethereum coins — around $3 million — into their wallet](https://www.pymnts.com/news/security-and-risk/2021/sushiswap-crypto-platform-victimized-by-3m-hack/#:~:text=transferred%20864.8%20Ethereum%20coins). The Crypto Times noted that the attacker [drained 864.8 ETH](https://www.cryptotimes.io/2021/09/17/sushiswaps-miso-launchpad-loses-3-million-in-an-attack/#:~:text=drained%20864.8%20ETH), and that [the only auction project that has been hacked and exploited thus far is Jay Pegs Auto Mart](https://www.cryptotimes.io/2021/09/17/sushiswaps-miso-launchpad-loses-3-million-in-an-attack/#:~:text=The%20only%20auction%20project%20that%20has%20been%20hacked%20and%20exploited).

That last detail matters. The poisoned code was distributed through the front-end, which means in principle it could have re-routed *any* auction it touched. In practice, only Jay Pegs Auto Mart settled into the attacker's address before the team caught it. The other affected auctions were patched before they could be drained — a few hours' difference between a single bad headline and a catastrophe.

## How it happened: insider trust, not a broken lock

![Vivid colorful concept art of an insider in shadow quietly twisting a glowing money pipe so its flow spills into a private bucket instead of the intended tank](../../assets/the-sushiswap-miso-insider-attack-02-malicious-commit.jpg)

Strip away the crypto vocabulary and this is a classic software supply-chain attack — the same category as a poisoned npm package or a tampered build server, just with the payout denominated in ETH.

The chain of trust looked like this. A contributor was given write access to the code that powered live auctions. They used that access to commit a change that swapped the destination address. The deployment pipeline did what pipelines do — it took the latest code and shipped it to the front-end that real users loaded in their browsers. Those users connected their wallets, signed what the front-end told them to sign, and funded an auction whose beneficiary had been silently rewritten. Coinspeaker's account matches the others: [an anonymous contractor with the GH handle AristoK3 injected malicious code into the Miso front end](https://www.coinspeaker.com/sushiswap-miso-attack-nft/#:~:text=an%20anonymous%20contractor%20with%20the%20GH%20handle%20AristoK3%20injected%20malicious%20code%20into%20the%20Miso%20front%20end).

Notice what was *not* required. The attacker did not need to find a flaw in a smart contract. They did not need to steal a key or compromise a server from outside. They needed exactly one thing: to be trusted enough to change the code. The incident report's framing is precise — [the Miso front end has become the victim of a supply chain attack](https://www.quadrigainitiative.com/casestudy/sushiswapmisojaypegsautomart.php#:~:text=The%20Miso%20front%20end%20has%20become%20the%20victim%20of%20a%20supply%20chain%20attack) — carried out by an anonymous contractor using the GitHub handle AristoK3, who [injected malicious code into the Miso front end](https://www.quadrigainitiative.com/casestudy/sushiswapmisojaypegsautomart.php#:~:text=injected%20malicious%20code%20into%20the%20Miso%20front%20end).

This is what makes insider supply-chain attacks so dangerous. Every external defense — firewalls, audits, multisigs on the treasury — assumes the threat is on the outside trying to get in. An insider with commit rights is already past all of it. The malicious change rode the project's own trusted, legitimate deployment process straight to production. The pipeline was not subverted. It was *used*.

## Response and recovery: caught, named, and refunded

SushiSwap's response was fast, public, and confrontational. Delong did not quietly investigate; he named the GitHub handle, named a suspected real identity, and set a deadline. According to CoinDesk, the warning was explicit: if the funds were not returned, the DeFi exchange would [file a complaint with the FBI](https://www.coindesk.com/business/2021/09/17/3m-in-ether-stolen-from-sushiswaps-miso-launchpad#:~:text=file%20a%20complaint%20with%20the%20FBI).

It worked. The attacker reversed course. CryptoSlate reported that just a couple of hours after the team went public, [the hacker returned 865 ETH to the original MISO contract](https://cryptoslate.com/hacker-returns-865-eth-stolen-from-sushis-token-launch-platform-miso/#:~:text=the%20hacker%20returned%20865%20ETH%20to%20the%20original%20MISO%20contract) — slightly *more* than the 864.8 ETH that left. The Crypto Times confirmed the destination: [the multisign address of Sushiswap got 865 ETH back](https://www.cryptotimes.io/2021/09/17/sushiswaps-miso-launchpad-loses-3-million-in-an-attack/#:~:text=the%20multisign%20address%20of%20Sushiswap%20got%20865%20ETH%20back). Delong's own status update was as terse as the original threat. Decrypt records his confirmation that, within roughly a day, it was [All funds returned](https://decrypt.co/81120/sushiswaps-token-launchpad-hacked-over-3m-ethereum#:~:text=All%20funds%20returned).

The happy ending deserves an asterisk. The money came back not because the architecture caught the theft, but because the attacker chose to give it back under the bright light of public exposure and a credible threat of law enforcement. Pseudonymity on a public ledger cuts both ways: it let the contractor act anonymously, and it also meant the on-chain trail of the diverted funds was visible to everyone, which is exactly the leverage that made returning the money the path of least resistance. Recovery here was a negotiation, not a guarantee. The next insider might not blink.

## What this teaches about code supply chains and front-end trust

The MISO incident is small in dollars by DeFi standards and large in lessons. A few worth carrying out of it:

1. **The front-end is part of your security perimeter.** Users sign what the interface tells them to sign. If an attacker controls which address the interface displays, they do not need the smart contract at all. Auditing only the on-chain code audits only half the system.
2. **Write access is the real attack surface.** The strongest cryptography in the world does not help if the person who can edit the code decides to. "Who can change this, and who reviews it before it ships?" is a security control, not a process detail.
3. **Mandatory code review is not bureaucracy — it is defense.** A single required second pair of eyes on the commit that swapped `auctionWallet` would likely have stopped this cold. Supply-chain attacks thrive on changes that no one independently checks before deployment.
4. **Pseudonymous contributors raise the stakes.** Open contribution is a strength, but granting deployment-affecting access to an anonymous identity means you are trusting code you cannot fully attribute. Trust should scale with verification, not with enthusiasm.
5. **Recovery is luck, not architecture.** The funds returned because of public pressure and a traceable ledger. Designing a system that *depends* on the attacker's goodwill is not a security design at all.

The through-line: integrity of *who is allowed to make a change*, and *verification that the change is the one that shipped*, is as load-bearing as any cryptographic key. Supply-chain trust is not a soft, cultural concern. It is the hard edge of the system.

## The Namefi angle

![Colorful illustration of verifiable, tamper-resistant ownership — secured by a green shield, a green Namefi token, and continuity](../../assets/the-sushiswap-miso-insider-attack-03-namefi-angle.jpg)

MISO lost money because the *destination of value* could be silently rewritten by someone the system trusted, and no one verified the change before it went live. That failure mode is not unique to DeFi launchpads. It is the same shape as a domain whose ownership or DNS records can be quietly altered by whoever happens to hold the right access — a [registrar](/en/glossary/registrar/) account, an internal panel, a contractor with credentials.

A domain is one of the most consequential "destination" settings on the internet. Its DNS records decide where your traffic, your email, and your users actually go. If those can be changed by an insider or a compromised account without a tamper-evident, independently verifiable record of who changed what, you have the MISO problem dressed in different clothes: the lock is fine, but the sign on the door can be swapped.

[Namefi](https://namefi.io) approaches this by treating [domain ownership](/en/glossary/domain-ownership/) as a verifiable, tamper-resistant asset rather than an entry in someone's private account. Tokenized ownership makes control auditable and transferable on-chain while staying compatible with DNS — so "who owns this and who is allowed to change it" becomes a fact you can verify, not a trust you have to extend blindly. The MISO contractor could rewrite a payout address precisely because the system had no enforced, independently checkable answer to "is this change authorized?" The lesson Namefi takes from supply-chain attacks is that ownership and control should be provable by design, so the dangerous gap between *trusted* and *verified* never opens in the first place.

## Sources and further reading

- CoinDesk — [$3M in Ether Stolen From SushiSwap's MISO Launchpad](https://www.coindesk.com/business/2021/09/17/3m-in-ether-stolen-from-sushiswaps-miso-launchpad)
- Decrypt — [SushiSwap's Token Launchpad Hacked for Over $3M in Ethereum](https://decrypt.co/81120/sushiswaps-token-launchpad-hacked-over-3m-ethereum)
- CryptoSlate — [Hacker returns 865 ETH stolen from Sushi's token launch platform MISO](https://cryptoslate.com/hacker-returns-865-eth-stolen-from-sushis-token-launch-platform-miso/)
- PYMNTS — [SushiSwap Crypto Platform Victimized by $3M Hack](https://www.pymnts.com/news/security-and-risk/2021/sushiswap-crypto-platform-victimized-by-3m-hack/)
- The Crypto Times — [Sushiswap's Miso Launchpad Loses $3 Million In An Attack](https://www.cryptotimes.io/2021/09/17/sushiswaps-miso-launchpad-loses-3-million-in-an-attack/)
- Coinspeaker — [SushiSwap Launchpad Miso Suffers Attack with 864.8 ETH NFT Project Fund Carted Away](https://www.coinspeaker.com/sushiswap-miso-attack-nft/)
- CryptoBriefing — [Sushi's Initial Offering Launchpad Suffers $3M Exploit](https://cryptobriefing.com/sushiswaps-miso-token-launchpad-suffers-3m-exploit/)
- CryptoPotato — [Another DeFi Hack: $3M in ETH Stolen From SushiSwap's Token Platform](https://cryptopotato.com/another-defi-hack-3m-in-eth-stolen-from-sushiswaps-token-platform/)
- Quadriga Initiative — [SushiSwap MISO Jaypegs Automart case study](https://www.quadrigainitiative.com/casestudy/sushiswapmisojaypegsautomart.php)
