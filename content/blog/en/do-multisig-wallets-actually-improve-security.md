---
title: 'Do Multisig Wallets Actually Improve Security? A Threat-Model View'
date: '2026-05-07'
language: en
tags: ['security', 'wallets', 'multisig', 'web3', 'key-management']
authors: ['namefiteam']
draft: false
cluster: domain-security
format: explainer
description: Multisignature wallets are widely treated as the default secure custody pattern in crypto, but the answer to "do they actually improve security?" depends entirely on the threat model. This post walks through what multisig defeats, what it does not, and where it can make things worse.
ogImage: ../../assets/do-multisig-wallets-actually-improve-security-og.jpg
keywords: ['multisig wallet', 'multisignature', 'safe wallet', 'gnosis safe', 'key management', 'self custody', 'threshold signature', 'social recovery', 'namefi']
relatedArticles:
  - /en/blog/onchain-domain-custody-and-recovery/
  - /en/blog/the-badgerdao-frontend-attack/
  - /en/blog/the-godaddy-multi-year-breach/
  - /en/blog/the-curve-finance-dns-hijack/
  - /en/blog/the-sushiswap-miso-insider-attack/
relatedTopics:
  - /en/topics/domain-security/
  - /en/topics/domain-tokenization/
relatedSeries:
  - /en/series/domain-apocalypse/
  - /en/series/domain-flipping-skills/
relatedGlossary:
  - /en/glossary/registrar/
  - /en/glossary/dns/
  - /en/glossary/icann/
  - /en/glossary/web3/
  - /en/glossary/tld/
---

Multisignature wallets—[wallets](/en/glossary/wallet/) where M-of-N keys must sign before a transaction is valid—are usually presented as the obvious upgrade from a single-key hot wallet. Most treasury setups in DAOs, exchanges, and serious crypto-native companies run through some flavor of [multisig](/en/glossary/multi-sig/) (Safe, Squads, Multisig.js, threshold-signature variants).

That reputation is well earned, but only against a *specific* threat model. Multisig defeats some of the most common ways funds get stolen and does almost nothing against others. Below is the honest version: what multisig is actually good at, where it falls short, and the cases where adopting it can make a setup *less* safe.

## What multisig is, very briefly

In a 2-of-3 multisig, three private keys exist; any two of them must sign a transaction for it to execute [on-chain](/en/glossary/on-chain/). The wallet itself is a [smart contract](/en/glossary/smart-contract/) (in the [Ethereum](/en/glossary/ethereum/) / EVM world) or a native multisig output type (in Bitcoin via [P2SH/P2WSH](https://en.bitcoin.it/wiki/BIP_0016)). The contract verifies the signatures and then forwards the transaction.

The most widely used implementation in EVM ecosystems is [Safe](https://safe.global/) (formerly Gnosis Safe). On Solana, [Squads](https://squads.so/) plays the same role. Bitcoin has a long history of native multisig support, often combined with hardware wallets through [PSBT workflows](https://github.com/bitcoin/bips/blob/master/bip-0174.mediawiki).

Threshold-signature schemes (TSS, FROST, MPC) achieve a similar outcome with a single on-chain key—each signer holds a *share* of the [private key](/en/glossary/private-key/) and they sign jointly without ever reconstructing it. From a threat-model perspective most of the points below apply equally to both, with a few caveats noted later.

## What multisig defeats (the good news)

### Single-key compromise

This is the headline benefit. If one signer's [hardware wallet](/en/glossary/hardware-wallet/) is stolen, one signer's phone is malware-infected, one signer's [seed phrase](/en/glossary/seed-phrase/) leaks, an attacker holding that single key cannot move funds. They need to compromise at least M-1 other keys at the same time.

For a 2-of-3 setup, this means the attacker must compromise *two independent endpoints*, ideally held by different people, on different hardware, in different physical locations. The probability of two independent compromises in the same window is usually orders of magnitude lower than the probability of one.

### Insider risk

A single person with full custody can rage-quit, defect, get coerced, or simply make a catastrophic mistake. Multisig forces collusion. For DAOs and companies, this is often the *primary* motivation—the security benefit against external attackers is secondary to the governance benefit against any one internal actor.

### Lost-key recovery

In an M-of-N setup with N > M, losing one key is not catastrophic. The remaining signers can move funds to a fresh multisig and replace the lost key. This is a meaningful improvement over single-key custody, where one lost seed phrase means permanent loss.

### Phishing the user

Many wallet [phishing](/en/glossary/phishing/) attacks (fake airdrop sites, malicious token approvals, drainer contracts) rely on the user signing a malicious transaction in a single browser session. A multisig adds a confirmation step at a different surface—a coordinating UI like Safe's, or a hardware approval on multiple devices—which gives the user another moment to notice that they are signing something they did not intend.

## What multisig does *not* defeat (the uncomfortable part)

This is the section most quick takes skip.

### Smart-contract bugs in the multisig itself

The multisig is a smart contract. If the contract has a bug, all the careful key management in the world does not help. The most expensive multisig incident in history—the [Parity multisig freeze](https://www.parity.io/blog/security-alert/) in November 2017—was a contract bug, not a key compromise. About $150M worth of ETH was rendered permanently inaccessible by a single transaction.

Modern Safe is one of the most audited contracts on Ethereum and has held up well, but the point stands: you are trading "one private key to protect" for "one smart contract to trust." That trust must be earned and re-earned with audits and time.

### Compromise of the signing UI

Almost every multisig sign-off happens through some interface—Safe's web UI, a wallet plugin, a custom dashboard. If that interface is compromised (DNS hijack, supply-chain attack on a dependency, malicious browser extension), the attacker can show signer A "send 1 ETH to alice.eth" while actually transmitting "send 1000 ETH to attacker.eth" to the hardware wallet for signing.

Most hardware wallets *do* display the actual destination address, but signers routinely skim. The [Bybit incident](https://www.bybit.com/en-US/help-center/article/Incident-Report-Bybit-Exchange-Attack-Update) in early 2025 hinged on a Safe UI compromise; all signers approved what they thought was a routine transaction, while the proxy contract was being modified.

Multisig protects you against an attacker who *only* has one key. It does not protect you against an attacker who can put the wrong transaction in front of all your signers.

### Coordinated phishing of multiple signers

If the signers are known and reachable—and for any treasury with a published Safe address, they usually are—an attacker can target all of them. Run the same phishing campaign at each signer. Wait. If two out of three are tired, distracted, or off-guard on the same day, the threshold is reached.

This is the most realistic attack against well-run multisigs in practice, and the defenses against it are mostly procedural, not technical: out-of-band confirmation of every transaction in a separate channel (Signal, a different chat, a phone call), and a strict policy that any transaction over $X must be discussed live before signing.

### Off-chain key storage compromise

If the "signing keys" are actually 2-of-3 between two engineers' MetaMask seed phrases and one hardware wallet in the office safe, you have an OPSEC problem dressed as a multisig. The threshold is technically met, but the diversity is fake. A laptop-malware infection on two engineers' machines, or a single break-in to the office, can compromise the threshold.

Real diversity requires:

- Different hardware models. (One Ledger, one Trezor, one Keystone.)
- Different operating systems for any software signing.
- Different physical locations for any persistent storage.
- Different humans, where applicable, with different threat profiles.

### Loss past the threshold

The other side of recovery: in a 2-of-3, losing *two* keys is permanent loss. In a 3-of-5, losing three is permanent loss. The bigger the gap between M and N, the safer against single losses—but the easier for an attacker to find M signers to phish.

This is the unavoidable tension. Higher M is more secure against external attack and less recoverable. Lower M is more recoverable and easier to attack. There is no setting that optimizes both.

## Where multisig can make things *worse*

A few honest cases:

- **For balances whose impact does not justify the operational cost**, multisig coordination, transaction fees, and learning overhead can introduce mistakes that a simpler setup would avoid. There is no universal dollar threshold: the choice should follow the owner's loss tolerance, attack exposure, and ability to operate recovery procedures. For some low-impact personal holdings, a well-protected hardware-backed single key may be the safer operational choice.
- **For solo users who treat multisig as a recovery scheme** but keep every key in correlated environments, multisig can add complexity without much independence. An attacker who reaches a shared password manager, cloud backup, recovery location, or similarly administered device fleet may cross the threshold through that common dependency. Separating keys across genuinely independent storage and recovery paths is what changes this threat.
- **For organizations that do not actually have signer diversity**—everyone in the same office, on the same VPN, using the same SSO—the threshold becomes a formality.

In all three cases, the answer is not "use single-key custody." It is "use multisig *correctly* or use a custodian who does." But pretending the contract type alone delivers safety, regardless of operational practice, is how the high-profile losses happen.

## What good looks like

A 2-of-3 or 3-of-5 multisig works well as a treasury control when *all* of the following are true:

- Signers are different humans, in different jurisdictions where possible.
- Signing devices are different hardware brands, on different OSes.
- A separate communication channel is used for transaction confirmation, independent of the signing UI.
- A documented process exists for verifying the transaction payload against an expected diff—calldata, target, value—before any signer approves.
- The multisig contract itself is well-audited (Safe is the conservative default in 2026) and the version is pinned and known.
- A signer replacement procedure exists and has been rehearsed.

This is more discipline than most teams realize at the outset. It is an ongoing operational investment: signer rotation, recovery drills, device updates, transaction review, and process audits must continue over the life of the wallet. That discipline matters at least as much as the contract.

## How this connects to domains

Domain operations contain several security boundaries, but they are not one multisig. Registrar and [registry locks](/en/glossary/registry-lock/) constrain transfer, deletion, or registration-data changes at the registration layer. 2FA at a DNS provider protects that provider account. Multiple authoritative DNS providers can improve availability when they are configured and operated independently. These are useful layers of defense, but they do not form an M-of-N threshold: compromise of a registrar account or a single writable DNS control plane may still be enough to change nameserver delegation or DNS answers without defeating every other layer.

Namefi represents domain ownership as an on-chain record that can be held in a multisig wallet. In that configuration, the wallet's threshold protects on-chain ownership actions that require the token holder's authorization: one compromised signer cannot unilaterally transfer the token. It does **not** automatically impose the same threshold on DNS changes made through a registrar or external DNS provider such as Cloudflare or Route 53. Those systems need their own least-privilege access, MFA, approval, logging, and recovery controls. The precise threat-model improvement is therefore at the tokenized ownership boundary; DNS resilience depends on how the separate DNS and delegation control planes are configured.

## Sources and further reading

- Safe — [Smart account contracts and audits](https://safe.global/).
- IETF FROST — [RFC 9591, the Flexible Round-Optimized Schnorr Threshold protocol](https://www.rfc-editor.org/rfc/rfc9591#:~:text=FROST%20signatures%20can%20be%20issued%20after%20a%20threshold%20number%20of%20entities%20cooperate%20to%20compute%20a%20signature).
- Bitcoin — [BIP-174 PSBT](https://github.com/bitcoin/bips/blob/master/bip-0174.mediawiki).
- Parity — [Multisig freeze post-mortem](https://www.parity.io/blog/security-alert/).
- a16z crypto — [Practical guide to running a Safe multisig](https://a16zcrypto.com/posts/article/secure-your-tokens-set-up-a-safe-multisig/).
- ICANN SSAC — [A Registrant's Guide to Protecting Domain Name Registration Accounts (SAC044)](https://www.icann.org/en/system/files/files/sac-044-en.pdf), including separate registration, DNS-hosting, monitoring, and lock controls.
- Namefi — [How DNS, nameservers, and the ownership token interact on a tokenized domain](/en/blog/dns-on-tokenized-domains/).
