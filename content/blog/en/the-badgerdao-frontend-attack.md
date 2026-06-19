---
title: 'The BadgerDAO Front-End Attack: $120M Drained Through One Injected Script'
date: '2026-06-17'
language: en
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
cluster: domain-security
series: domain-apocalypse
seriesOrder: 7
format: case-study
description: 'In December 2021, attackers compromised BadgerDAO''s Cloudflare account and injected one malicious script into its website front-end. The audited smart contracts were never touched — yet ~$120M walked out the door through wallet approvals users signed without knowing. A deep-dive on why the website is part of your security surface.'
keywords: ['badgerdao hack', 'badgerdao front-end attack', 'cloudflare api key compromise', 'injected script attack', 'web3 front-end security', 'ice phishing', 'increaseAllowance attack', 'token approval exploit', 'dns and domain security', 'cloudflare workers exploit', 'defi security', 'supply chain attack web3', 'website tampering', 'domain security']
---

The audit was clean. The contracts were fine. The money left anyway.

In the days around December 2, 2021, BadgerDAO — a DeFi project built around bringing Bitcoin into decentralized finance — lost roughly **$120 million** of its users' funds. There was no flash-loan trick, no reentrancy bug, no clever math exploit against the vaults. The smart contracts did exactly what they were written to do. The attacker never had to break them, because the attacker never attacked them.

He attacked the *website*.

Someone had quietly slipped a malicious script into the front-end of app.badger.com. To every user who loaded the page, it looked like the same trusted dApp they used every day. But when they went to interact with it, the page asked their wallet for one extra, invisible permission — and once they clicked "approve," their tokens were no longer theirs to keep.

This is the story of how a project with audited contracts lost nine figures through a single injected line of front-end code, and why it should permanently change how you think about the boundary of your security.

## The comforting lie: "the contracts are audited"

Crypto culture trained users to ask one question before trusting a protocol: *has it been audited?* Audits matter. They catch real bugs. But somewhere along the way, "the contracts are audited" hardened into a feeling of total safety — as if a clean audit report were a force field around everything with the project's name on it.

It is not.

An audit examines the on-chain code: the vaults, the token logic, the access controls. It says nothing about the laptop a developer left logged in, the DNS records pointing your browser somewhere, the CDN sitting in front of the site, or the JavaScript your browser actually downloads and runs when you visit the dApp. Those live in *Web2* — in cloud accounts, API keys, and domain infrastructure — and they are every bit as load-bearing as the Solidity.

BadgerDAO is the cleanest proof of this gap on record. As one technical breakdown of the incident put it bluntly: [from the perspective of the project's smart contracts, nothing had gone wrong](https://www.halborn.com/blog/post/explained-the-badgerdao-hack-december-2021#:~:text=From%20the%20perspective%20of%20the%20project%27s%20smart%20contracts%2C%20nothing%20had%20gone%20wrong), and the attacker was just using the approvals granted by users. The chain behaved perfectly. The website lied.

## The attack: a tampered storefront with a clean receipt

![Vivid colorful concept art of a trusted, friendly-looking storefront whose cash register has been quietly tampered with, an extra hidden drawer siphoning coins while customers smile and pay normally](../../assets/the-badgerdao-frontend-attack-01-attack.jpg)

Imagine walking into a shop you have visited a hundred times. Same sign, same staff, same counter. You buy something small, the cashier rings it up, you tap your card. Everything looks routine. What you cannot see is that someone swapped the card reader for one that also quietly authorizes a second, unlimited charge against your account — to a stranger, whenever they want.

That is, in effect, what happened to BadgerDAO users.

The classification matters here, because it is what makes this incident so instructive. As *Vice* summarized it, the hack [did not involve complicated smart contract exploits. Instead, it was a front-end attack targeting BadgerDAO's web infrastructure](https://www.vice.com/en/article/hackers-steal-dollar119m-from-web3-crypto-project-with-old-school-attack/#:~:text=injected%20a%20malicious%20script%20into%20BadgerDAO%27s%20frontend) — in particular its Cloudflare account. It was, in their framing, an *old-school* web attack pointed at a Web3 target.

The mechanism was elegant and quiet. The malicious script asked the user's wallet to grant a token-spending allowance to the attacker's address. In Vice's words, [the malicious script basically tricked people into giving the address rights to send the tokens to the exploiter address](https://www.vice.com/en/article/hackers-steal-dollar119m-from-web3-crypto-project-with-old-school-attack/#:~:text=The%20malicious%20script%20basically%20tricked%20people%20into%20giving). The user thought they were doing normal dApp business. They were signing away the keys to their tokens.

Security researchers call this pattern *ice phishing*: instead of stealing your private key, you are tricked into voluntarily approving a malicious spender. The signature is real. The approval is real. The on-chain transaction is valid. That is exactly why it is so dangerous — and why no contract audit could have stopped it.

## What users lost: ~$120 million, one signature at a time

The numbers are staggering for an attack that never touched a single line of vault code.

Smart-contract auditing firm PeckShield [estimated the total losses come to around $120 million](https://cryptobriefing.com/120m-lost-badgerdao-defi-hack/). BadgerDAO's own post-mortem accounting, reproduced in incident case studies, put the loss at [approximately 2076.54 BTC (~$116.3m USD at time of hack)](https://www.quadrigainitiative.com/casestudy/badgerdaomaliciouscodeinjected.php#:~:text=2076.54%20BTC) once all the stolen assets were converted to a common denominator.

The pain was not evenly spread. A single victim — reportedly an institutional account — lost the lion's share in one transaction: case studies note that [approximately 900 BTC were removed from the Yearn wBTC vault](https://www.quadrigainitiative.com/casestudy/badgerdaomaliciouscodeinjected.php), with one party alone losing [over $50 million worth of wrapped Bitcoin](https://www.quadrigainitiative.com/casestudy/badgerdaomaliciouscodeinjected.php#:~:text=lose%20over%20%2450%20million). Hundreds of ordinary users made up the rest.

And the scale was a direct consequence of patience. The attacker did not strike in a panic. As Forta's analysis describes, [the hacker silently accumulated approvals from almost 200 accounts, then at 12:48 am on December 2, 2021, the hacker drained the victims' wallets in under 10 hours](https://forta.org/blog/how-to-derail-a-120-million-dollar-hack#:~:text=The%20hacker%20silently%20accumulated%20approvals%20from%20almost%20200%20accounts). The malicious approvals had been quietly collecting for days — a loaded trap, sprung all at once. Another reconstruction counted [500 wallets create these unlimited approvals](https://www.halborn.com/blog/post/explained-the-badgerdao-hack-december-2021#:~:text=The%20attacker%20managed%20to%20get%20500%20wallets) over the life of the campaign.

The cruelest detail: there was nothing a careful user could have checked. The URL was correct. The TLS certificate was valid. The interface was genuine. The only thing wrong was a snippet of JavaScript the legitimate site itself was serving.

## How it happened: a Cloudflare API key and an injected approval

![Vivid colorful concept art of an invisible hand quietly adding one extra glowing approve button to a wallet pop-up while the real interface looks calm and trustworthy, a single malicious line of code slipping into a friendly web page](../../assets/the-badgerdao-frontend-attack-02-injected-script.jpg)

The front door the attacker used was not a smart contract. It was a cloud account.

BadgerDAO, like an enormous share of the modern web, sat behind Cloudflare — the content-delivery and edge-compute layer that serves and accelerates websites. Control of that account meant control of what code BadgerDAO's website handed to visitors. And the attacker got that control through a stolen key.

In BadgerDAO's official accounting, relayed by CoinDesk, [the hacker used a compromised API key that was created without the knowledge or authorization of Badger engineers to periodically inject the malicious code that affected a subset of its customers](https://www.coindesk.com/business/2021/12/10/badgerdao-reveals-details-of-how-it-was-hacked-for-120m). That phrase — *a subset of its customers* — is part of why it stayed hidden so long. The script did not fire for everyone, every time. It rotated in and out, hitting only some users, making the malicious behavior maddeningly hard to reproduce or notice.

How did an unauthorized API key come to exist at all? The root cause traced back to a Cloudflare account flaw. Incident case studies note that unauthorized users were able to create accounts and were also able to create and view (Global) API keys (which cannot be deleted or deactivated) [before email verification was completed](https://www.quadrigainitiative.com/casestudy/badgerdaomaliciouscodeinjected.php#:~:text=before%20email%20verification%20was%20completed). An attacker could plant a key against an account, then simply wait for the real owner to finish verifying and activate it — at which point the attacker silently held valid API access.

With that key, the attacker reached for Cloudflare Workers — Cloudflare's edge-compute platform — to rewrite the page on the way to the user. BadgerDAO's post-mortem, prepared with cybersecurity firm Mandiant, concluded that the phishing incident of December 2 was the result of a maliciously injected snippet provided by Cloudflare Workers. The injected code did exactly one thing that mattered: it inserted an extra token-approval request into the normal flow of the dApp.

There was even a deliberate craft to *which* approval call it used. CryptoBriefing reported that [the hacker allegedly inserted a malicious script on Badger's website that presented users with a transaction to "increase allowance"](https://cryptobriefing.com/120m-lost-badgerdao-defi-hack/#:~:text=presented%20users%20with%20a%20transaction%20to). That choice was not random. Compared with a raw `approve` call, an `increaseAllowance` prompt tends to render with weaker, less alarming visual cues in wallet pop-ups — fewer red flags, less of a "you are about to grant spending power" warning. The attacker optimized the *user-experience* of being robbed.

So the full chain looked like this: a Cloudflare account-verification weakness let an unauthorized API key exist → the attacker used that key to deploy a Worker → the Worker injected a script into app.badger.com → the script asked wallets for a token allowance to the attacker → users approved → the attacker drained them. Not one step of that touched the audited contracts.

## The response: pausing the chain to stop a Web2 wound

Once the draining transactions hit at scale in the early hours of December 2, the on-chain footprint finally became impossible to miss, and BadgerDAO moved fast — using its smart contracts to stop a problem that had originated entirely off-chain.

The team acknowledged the incident publicly and, per CryptoBriefing, confirmed that [all smart contracts have been paused to prevent further withdrawals](https://cryptobriefing.com/120m-lost-badgerdao-defi-hack/). Because Badger's vaults had a pause capability, freezing transfers cut off the attacker's ability to keep moving freshly approved funds. One technical write-up describes the halt as the team exercising the power to freeze all calls to the `transferFrom` function — the very ERC-20 mechanism the malicious approvals were exploiting. That pause is also why a meaningful slice of the loss was theoretically recoverable: some assets had been moved by the attacker but not yet fully withdrawn from Badger's vaults before the freeze landed.

On the infrastructure side, the cleanup was the grim Web2 checklist of a credential breach: rotate the Cloudflare API keys, change the account password, harden multi-factor authentication, and audit every key that should not have existed. BadgerDAO then partnered with Mandiant to investigate and publish a technical post-mortem reconstructing the timeline — the Cloudflare account weaknesses, the unauthorized keys created in the preceding months, the November script injection, and the December drain.

But no amount of incident response could un-sign the approvals users had already given. The signatures were valid. The remediation could stop *future* theft and chase recovery; it could not reverse consent that had already been granted on-chain.

## What this teaches: the website is part of your security surface

The single most important lesson of BadgerDAO is a boundary correction. Most teams — and most users — draw the security perimeter around the smart contracts. BadgerDAO proves the perimeter is much larger.

**1. Your front-end is in scope. Always.** The code a user's browser executes is part of your protocol, whether or not it lives on-chain. If an attacker controls what JavaScript your site serves, they control your users' wallets — audited contracts or not. The site is not "just the UI." It is the place where consent is captured.

**2. Your cloud and domain infrastructure are part of the contract.** A Cloudflare account, a DNS provider login, a registrar account, a CI/CD key — each is a path to rewriting what your users see. BadgerDAO was not breached at the vault; it was breached at the *account that controlled the website*. Treat those credentials with the same paranoia you reserve for a deployer private key.

**3. API keys and account-creation flows are real attack surface.** The whole disaster hinged on an unauthorized API key that should never have existed, made possible by a verification gap. Inventory every key. Scope them tightly. Rotate them. Alert on new ones. A key you forgot about is a key an attacker can use.

**4. "Audited" is necessary, not sufficient.** A clean audit is real value and you should still get one. But it covers the contracts, not the cloud account, the DNS, the CDN, or the front-end build pipeline. Security is the whole path from a user's browser to your chain — and the weakest link, not the strongest, sets the bar.

**5. Users cannot inspect their way out of a tampered front-end.** "Always check the URL" is good advice that would have done nothing here. The URL was right. The lesson for users is harder: be deeply suspicious of approval and `increaseAllowance` prompts, prefer wallets and tools that decode and warn on token approvals, and revoke stale allowances regularly. The thing you are approving matters more than the page you are on.

## The Namefi angle

![Colorful illustration of verifiable, tamper-resistant domain and web ownership — secured by a green shield, a green Namefi token, and DNS continuity](../../assets/the-badgerdao-frontend-attack-03-namefi-angle.jpg)

Strip BadgerDAO down to its essence and it is an **ownership and control** problem. The attacker did not own BadgerDAO's website — but for weeks, they could change what it served. The people who *did* own the project had no reliable, tamper-evident way to know that the chain of control over their web presence — account, keys, edge config, DNS — had been quietly compromised.

That is the gap [Namefi](https://namefi.io) cares about. Namefi treats domains and web ownership as first-class, internet-native assets: control that is verifiable, auditable, and harder to silently hijack, while staying compatible with DNS. The front-end attack surface — who controls the name, where it resolves, what infrastructure sits behind it — is not an afterthought to the smart contracts. As BadgerDAO showed in the most expensive way possible, it *is* part of the security model.

You can audit your contracts until they are flawless. But if an unauthorized key can rewrite your website and an injected script can harvest your users' approvals, the audit was never the whole story. The domain, the DNS, and the web infrastructure that deliver your application to real people are part of your security surface. Treat them like it — because attackers already do.

## Sources and further reading

- CoinDesk — [BadgerDAO Reveals Details of How It Was Hacked for $120M](https://www.coindesk.com/business/2021/12/10/badgerdao-reveals-details-of-how-it-was-hacked-for-120m)
- Vice (Motherboard) — [Hackers Steal $119M From 'Web3' Crypto Project With Old School Attack](https://www.vice.com/en/article/hackers-steal-dollar119m-from-web3-crypto-project-with-old-school-attack/)
- Halborn — [Explained: The BadgerDAO Hack (December 2021)](https://www.halborn.com/blog/post/explained-the-badgerdao-hack-december-2021)
- Forta — [How to Derail a 120-Million-Dollar Hack](https://forta.org/blog/how-to-derail-a-120-million-dollar-hack)
- CryptoBriefing — [$120M Lost in BadgerDAO DeFi Hack](https://cryptobriefing.com/120m-lost-badgerdao-defi-hack/)
- Quadriga Initiative — [Dec 2021 — BadgerDAO Malicious Code Injected — $116.3m](https://www.quadrigainitiative.com/casestudy/badgerdaomaliciouscodeinjected.php)
- Chainalysis — [Behind The Scenes of The BadgerDAO Hack](https://www.chainalysis.com/blog/chainalysis-podcast-episode-6-badgerdao-hack/)
- BadgerDAO / Mandiant — [BadgerDAO Exploit Technical Post Mortem](https://www.badger.tools/technical-post-mortem)
