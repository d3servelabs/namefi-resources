---
title: "How to Tokenize Your .com: A Step-by-Step Guide (2026)"
date: '2026-05-22'
language: en
tags: ['guide']
authors: ['namefiteam']
draft: false
cluster: domain-tokenization
series: tokenize-your-com
seriesOrder: 1
format: guide
description: A practical, step-by-step walkthrough for tokenizing a domain you already own — eligibility, wallets, fees, time, and what to expect on each screen. Written for owners, not protocol nerds.
keywords: ['how to tokenize a domain', 'how to tokenize a .com', 'tokenize my domain', 'tokenize an existing domain', 'tokenize a domain step by step', 'domain tokenization tutorial', 'tokenize .com guide', 'tokenize .xyz', 'tokenize .io', 'namefi tokenize', 'NFT domain how to', 'transfer domain to NFT', 'domain to NFT', 'domain tokenization process', 'tokenized domain setup', 'tokenize ICANN domain']
---

So you own a domain — maybe `mybrand.com`, maybe a portfolio of `.xyz` names — and you've decided you want to **tokenize** it. This guide walks through what actually happens, screen by screen, so you can plan the time, money, and access you'll need before you start.

If you're still deciding *why* to tokenize, read [Why Tokenize Domains On-Chain?](/en/blog/why-tokenize-domains/) first. If you're not sure *what* tokenization even means, [What Are Tokenized Domains?](/en/blog/what-are-tokenized-domains/) is the place to begin.

This post assumes you already want to do it.

---

## Before You Start: A 60-Second Checklist

You'll have a much smoother time if these are true before you click anything:

- **You control the domain at its current [registrar](/en/glossary/registrar/).** You can log in, change nameservers, and approve transfer / [auth codes](/en/glossary/auth-code/).
- **You have a self-custodied [wallet](/en/glossary/wallet/).** MetaMask, Rabby, Coinbase Wallet, or any standard EVM wallet. Make sure you actually have the [seed phrase](/en/glossary/seed-phrase/) — not just an exchange account.
- **The wallet has a small amount of [gas](/en/glossary/gas/).** A few dollars of ETH or Base ETH covers the [on-chain](/en/glossary/on-chain/) minting transaction. You don't need much.
- **The domain isn't locked, expiring, or mid-transfer.** Domains within ~60 days of a recent [cross-registrar transfer](/en/glossary/cross-registrar-transfer/), or within 30 days of expiry, often can't move. Check first.
- **You have time.** Plan for ~30 minutes of attention, plus up to 5–7 days of background processing for cross-registrar moves.

If any of those is shaky, fix it before you start. The process tolerates patience much better than it tolerates surprises.

---

## Step 1: Connect Your Wallet at namefi.io

Head to [namefi.io](https://namefi.io) and click "Connect Wallet". Approve the connection in your wallet. This wallet will become the **owner** of the tokenized domain — the NFT will live here, and whoever holds this wallet holds the domain.

> **Take this seriously.** If you lose this wallet, you lose the on-chain side of your domain. We have a separate guide on [recovering a tokenized domain after wallet loss](/en/blog/recovering-a-tokenized-domain-after-wallet-loss/) — read it now, not later.

---

## Step 2: Add the Domain You Want to Tokenize

In your Namefi dashboard, search for or add the domain you already own. Namefi will check eligibility — the [registrar](/en/glossary/registrar/) it's currently at, whether it's lockable, whether it's within [ICANN](/en/glossary/icann/) transfer rules, and whether the [TLD](/en/glossary/tld/) is supported.

You'll see one of three statuses:

- **Eligible now.** Proceed to Step 3.
- **Eligible after a wait.** Usually means a recent transfer is still inside the 60-day ICANN window. Wait it out and come back.
- **Not supported.** Some TLDs aren't yet supported. Check the supported-TLD list, or ping support.

---

## Step 3: Choose a Tokenization Path

Namefi typically offers a few paths depending on the domain's current registrar:

1. **Transfer-in then tokenize.** Move the domain to Namefi's accredited registrar partner, then mint the on-chain token. This is the most common path. It takes a few days because of ICANN's transfer flow, not because of anything blockchain-related.
2. **In-place tokenize (where supported).** For some registrar integrations, the domain stays where it is and the on-chain layer is added on top. Faster, but only available for specific partner registrars.

You'll see the path that applies to your domain. The dashboard will show the estimated time and any fees up front.

---

## Step 4: Confirm Auth Code / Approve Transfer (if needed)

For the transfer-in path, you'll grab the [**auth code**](/en/glossary/auth-code/) (sometimes called EPP code) from your current registrar and paste it into Namefi. You may also need to:

- Unlock the domain at your current registrar.
- Approve a confirmation email sent to the registrant contact.

This is the slowest part of the whole process. Plan for 5–7 days for the cross-registrar move to complete, though it often finishes faster.

---

## Step 5: Mint the On-Chain Token

Once the domain is under the Namefi registrar integration, you'll be prompted to **mint** the [NFT](/en/glossary/nft/) representation (a standard [ERC-721](/en/glossary/erc-721/) token). Your wallet pops up; you confirm a transaction; [gas](/en/glossary/gas/) is paid; the token lands in your wallet.

This is the moment the domain becomes [*tokenized*](/en/glossary/tokenize/). You now have:

- The traditional [DNS](/en/glossary/dns/) / registrar record (still real, still ICANN-recognized).
- An [on-chain](/en/glossary/on-chain/) NFT in your wallet that represents ownership.

The two are kept in sync by the protocol going forward.

---

## Step 6: Verify in Your Wallet and a Block Explorer

Open your wallet's NFT tab. You should see the new tokenized domain NFT. Click through to a block explorer (Etherscan, Basescan, etc.) to confirm the contract and ownership address. This is a good moment to take a screenshot for your own records.

If you have a [hardware wallet](/en/glossary/hardware-wallet/), this is a great moment to move the NFT to it. The transfer is a normal NFT transfer and costs gas.

---

## Step 7: Manage DNS and Renewals

Tokenizing a domain doesn't change how it resolves. Your nameservers, A records, MX records, [DNSSEC](/en/glossary/dnssec/) — all of it keeps working. You can manage these from the Namefi dashboard, or delegate to your existing DNS provider (Cloudflare, Route53, etc.) just like before.

For details on what changes (and what doesn't) at the DNS layer, see [DNS Still Works: Nameservers, Email, and DNSSEC on a Tokenized Domain](/en/blog/dns-on-tokenized-domains/).

Renewals continue to happen through the registrar layer. Namefi handles the registrar-side billing; you keep the on-chain ownership.

---

## What to Expect Cost-Wise

You're paying for three things, roughly:

- **Registrar fees.** Normal annual domain renewal pricing, plus any transfer-in fee. These are real-world costs that exist regardless of tokenization.
- **Gas.** A few dollars for the mint transaction, depending on which chain (Base is cheaper than Ethereum L1).
- **Protocol fees.** Namefi's own fees for the tokenization service. These are shown in the dashboard before you confirm.

There is no hidden surprise. If a number isn't on the confirmation screen, it isn't a charge.

---

## Common Snags

- **"My registrar won't release the auth code."** Some registrars hide this deep in their UI or require a support ticket. Be patient and persistent.
- **"I unlocked the domain but the system still says locked."** Registrars often cache lock status for up to 24 hours. Wait a day, refresh.
- **"My wallet shows the NFT, but the domain still appears at my old registrar."** During the transfer window, both sides may briefly show ownership. The on-chain side becomes authoritative after the transfer settles.
- **"I want to use a [multisig](/en/glossary/multi-sig/) as the owner."** Supported. Connect the multisig wallet. Just be sure you can actually execute transactions from it — a multisig you've lost signers on is a domain you've lost too. Background: [Do Multisig Wallets Actually Improve Security?](/en/blog/do-multisig-wallets-actually-improve-security/)

---

## Friendly Disclaimer (Read Me!)

> We're not lawyers, accountants, financial advisors, or doctors — and **nothing in this article is legal, financial, tax, accounting, medical, or any other flavor of professional advice.** We write these posts to educate ourselves and as a convenience for our customers. Info here may be out of date, geography-specific, or just plain wrong — we make mistakes too.
>
> For any important decision, **please consult a real professional (seriously!)**. Or if that's not your vibe, ask a friend, ask Twitter, ask Reddit, ask an AI, or ask a psychic. In short: **DOYR — Do Your Own Research**. Let's learn and have fun.

---

## Summary

- Tokenizing a domain you already own is a guided, ~30-minute interactive process plus up to a week of registrar-side waiting.
- You need: control of the domain, a self-custodied wallet, a small amount of gas, and patience.
- The on-chain mint is the *last* step; most of the work is the boring registrar-transfer flow that ICANN imposes regardless of blockchain.
- After tokenization, you have **two synchronized layers of ownership** — the traditional DNS record and an NFT in your wallet.
- Read the [wallet-loss recovery guide](/en/blog/recovering-a-tokenized-domain-after-wallet-loss/) *before* you tokenize, not after.

Ready to start? Head to [namefi.io](https://namefi.io).
