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
description: "A practical walkthrough of Namefi's current import flow: EPP auth code, cart, checkout, registrar transfer, and automatic NFT minting."
keywords: ['how to tokenize a domain', 'how to tokenize a .com', 'tokenize my domain', 'tokenize an existing domain', 'tokenize a domain step by step', 'domain tokenization tutorial', 'tokenize .com guide', 'tokenize .xyz', 'tokenize .io', 'namefi tokenize', 'NFT domain how to', 'transfer domain to NFT', 'domain to NFT', 'domain tokenization process', 'tokenized domain setup', 'tokenize ICANN domain']
relatedArticles:
  - /en/blog/tokenize-your-com-to-flip-it/
  - /en/blog/how-to-sell-a-domain-name-you-own/
  - /en/blog/dns-on-tokenized-domains/
  - /en/blog/how-tokenized-marketplaces-replace-escrow/
  - /en/blog/how-tokenization-changes-domain-flipping/
relatedTopics:
  - /en/topics/domain-tokenization/
  - /en/topics/domain-investing/
relatedSeries:
  - /en/series/tokenize-your-com/
  - /en/series/domain-flipping-skills/
relatedGlossary:
  - /en/glossary/registrar/
  - /en/glossary/icann/
  - /en/glossary/dns/
  - /en/glossary/tld/
  - /en/glossary/web3/
---

So you own a domain — maybe `mybrand.com`, maybe a portfolio of `.xyz` names — and you've decided you want to **tokenize** it. On Namefi, the current path is an **import**: you submit the domain and its EPP authorization code, complete checkout, and the registrar transfer and NFT mint run as one acquisition workflow.

If you're still deciding *why* to tokenize, read [Why Tokenize Domains On-Chain?](/en/blog/why-tokenize-domains/) first. If you're not sure *what* tokenization even means, [What Are Tokenized Domains?](/en/blog/what-are-tokenized-domains/) is the place to begin.

This post assumes you already want to do it. Product screens can change, so treat the live flow at [namefi.io](https://namefi.io) as the final authority.

## Before You Start: A Quick Checklist

You'll have a much smoother time if these are true before you click anything:

- **You control the domain at its current [registrar](/en/glossary/registrar/).** You can unlock it, obtain its [auth code](/en/glossary/auth-code/) (also called an EPP code), and approve the transfer.
- **The domain is eligible to move.** A registrar lock, a recent transfer, an unsupported [TLD](/en/glossary/tld/), or another transfer restriction can block the import.
- **You can sign in to Namefi and complete wallet onboarding.** The destination wallet receives the [tokenized domain](/en/glossary/tokenized-domain/) NFT after the import. Namefi's automatic mint does not require you to sign a separate mint transaction or fund mint gas.
- **You know what should happen to DNS.** At checkout, the **Keep NS** option preserves the domain's current nameservers. Selecting it skips Namefi Auto Park, Auto ENS, and DNSSEC setup. If the domain serves a live website or email, verify this choice carefully.
- **You have time for a registrar transfer.** Namefi's current order screen says imports typically take 5–7 days and may be expedited through the old registrar.

If any of those is shaky, fix it before you start. The process tolerates patience much better than it tolerates surprises.

---

## Step 1: Open Import Mode

Go to [namefi.io](https://namefi.io), sign in or connect your [wallet](/en/glossary/wallet/), and select **Import** in the main domain search. Import is for domains you already own elsewhere; **Register** is for buying an available name.

> **Take the destination wallet seriously.** It will receive the domain NFT. Review [recovering a tokenized domain after wallet loss](/en/blog/recovering-a-tokenized-domain-after-wallet-loss/) before importing a valuable name.

## Step 2: Enter the Domain and EPP Auth Code

Enter one domain with its code in the format shown by the app:

```text
example.com, authcode123
```

You can also paste multiple domains. Each importable domain needs its own valid code before checkout. Search results can identify names as locked, temporarily unimportable, unsupported, or already on Namefi; resolve any blocking status with the current registrar before continuing.

## Step 3: Add the Import to Your Cart

Add the importable domain — or use **Add all** for an eligible batch — to the cart. There is no separate choice between an "in-place" mint and a transfer-in path in the current live journey. Import uses the EPP transfer-in workflow.

Before paying, review the domain setup options. In particular:

- Turn on **Keep NS** if the domain must continue using its current nameservers.
- If you do not keep the existing nameservers, review the available Auto Park, Auto ENS, and DNSSEC settings.
- Confirm the recipient account or wallet and the order total shown by checkout.

## Step 4: Complete Checkout

Complete the cart checkout using the payment methods the app offers for your account. The checkout amount, currency, and included services shown on that screen are authoritative; do not rely on an old article or screenshot for a current price.

Checkout starts Namefi's import order. It does **not** ask you to approve a separate NFT-mint transaction in your wallet.

## Step 5: Approve the Registrar Transfer

Your old registrar may contact the [registrant](/en/glossary/registrant/) to confirm the transfer. Keep the domain unlocked and watch the order page for a required action. If the EPP code is rejected or changes, Namefi can ask you to provide a new one.

The order screen currently says imports typically take 5–7 days. That interval is registrar processing time, not time spent waiting for an on-chain transaction.

## Step 6: Namefi Mints the NFT Automatically

The import workflow starts the [NFT](/en/glossary/nft/) mint for the destination wallet. For traditional domains, that mint can continue in the background while the order settles, so you may briefly see a **Minting…** state.

This is an automatic, service-side transaction. You do not need ETH or Base ETH for the import mint, and you do not confirm that mint in a wallet popup. When it completes, the [on-chain](/en/glossary/on-chain/) NFT represents control of the imported domain within Namefi's registrar and protocol workflow.

## Step 7: Verify the Domain, NFT, and DNS

Check the order and **My Domains** views first. Once minting completes, confirm the token's destination address and on-chain record using the links Namefi provides or an appropriate block explorer.

Then test the domain's website, email, and important [DNS](/en/glossary/dns/) records. If you selected **Keep NS**, DNS remains at the existing provider and Namefi's Auto Park, Auto ENS, and DNSSEC setup is skipped. If you chose Namefi-managed nameservers, review the resulting records before assuming production traffic is safe.

## Step 8: Manage DNS and Renewals

DNS behavior depends on the setup choice made in the cart. Namefi can manage DNS records and nameservers after import, or you can keep external nameservers and continue managing records with the existing DNS provider.

For details on what changes (and what doesn't) at the DNS layer, see [DNS Still Works: Nameservers, Email, and DNSSEC on a Tokenized Domain](/en/blog/dns-on-tokenized-domains/).

Renewals continue through the registrar layer and appear in Namefi after the transfer. Review the expiration date and auto-renew setting in **My Domains** rather than assuming the old registrar's renewal configuration carried over.

## What to Expect Cost-Wise

The order total shown at checkout is the source of truth. Depending on the domain and account, it can include registrar transfer or renewal costs and the services shown in the cart.

There is no separate user-paid [gas](/en/glossary/gas/) line for the automatic import mint. Later on-chain actions initiated by you — such as transferring an NFT — are different operations and may require a wallet transaction and network gas.

## Common Snags

- **"My registrar won't release the auth code."** Some registrars hide this deep in their UI or require a support ticket. Be patient and persistent.
- **"The order says my auth code needs attention."** Retrieve a current EPP code from the registrar and update it on the Namefi order.
- **"The transfer is still pending."** Watch for an approval message from the old registrar. Namefi's order page says you can contact that registrar to expedite.
- **"The NFT says Minting…."** The traditional-domain mint runs in the background. Check the order state before trying to restart the import.
- **"My website or email changed after import."** Recheck whether **Keep NS** was selected and verify the active nameservers and records. A wrong nameserver choice can interrupt both web and mail traffic.

---

## Friendly Disclaimer (Read Me!)

> We're not lawyers, accountants, financial advisors, or doctors — and **nothing in this article is legal, financial, tax, accounting, medical, or any other flavor of professional advice.** We write these posts to educate ourselves and as a convenience for our customers. Info here may be out of date, geography-specific, or just plain wrong — we make mistakes too.
>
> For any important decision, **please consult a real professional (seriously!)**. Or if that's not your vibe, ask a friend, ask Twitter, ask Reddit, ask an AI, or ask a psychic. In short: **DOYR — Do Your Own Research**. Let's learn and have fun.

---

## Summary

- The current Namefi journey is **Import → domain plus EPP auth code → cart → checkout → registrar transfer → automatic NFT mint**.
- The import mint is service-side: you do not approve a separate mint transaction or fund its gas.
- Namefi's current order screen says registrar imports typically take 5–7 days.
- Choose **Keep NS** deliberately if the domain must continue using its existing DNS provider.
- After completion, verify the order, NFT destination, nameservers, website, email, expiration date, and auto-renew setting.
- Read the [wallet-loss recovery guide](/en/blog/recovering-a-tokenized-domain-after-wallet-loss/) *before* you tokenize, not after.

Ready to start? Head to [namefi.io](https://namefi.io).
