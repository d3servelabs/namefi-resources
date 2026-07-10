---
title: "Pay for Domains with a Crypto Wallet: No Account Needed"
date: '2026-07-10'
language: 'en'
tags: ['ai-agents', 'payments']
authors: ['namefiteam']
draft: false
format: explainer
ogImage: ../../assets/wallet-checkout-og.jpg
description: "How Namefi's wallet-signed checkout lets an AI agent buy a domain with crypto, no account required — flow, security model, and spend policies."
keywords: ["crypto domain payment", "wallet checkout domain registration", "buy domain with crypto wallet no account", "pay for domain with usdc", "ai agent pay for domain crypto", "x402 domain registration", "eip-3009 transferwithauthorization", "domain registrar accepts crypto", "wallet-signed checkout", "namefi x402", "agentic payments", "stablecoin domain purchase", "no account domain registration", "eip-712 wallet signature"]
relatedArticles:
  - /en/blog/ai-agent-register/
  - /en/blog/claude-mcp-domains/
  - /en/blog/cf-namecom-namefi/
  - /en/blog/namefi-mcp/
  - /en/blog/agent-own-domain/
relatedTopics:
  - /en/topics/domain-tokenization/
  - /en/topics/web3-foundations/
relatedSeries:
  - /en/series/blockchain-concepts/
  - /en/series/tokenize-your-com/
relatedGlossary:
  - /en/glossary/x402/
  - /en/glossary/wallet/
  - /en/glossary/stablecoin/
  - /en/glossary/private-key/
  - /en/glossary/tokenized-domain/
---

Every other piece of "an AI agent can buy a domain for you" eventually runs into the same wall: how does the agent actually pay? A credit card assumes a human is present to type digits into a form, pass a fraud check, and confirm a one-time code sent to a phone. An [AI agent](/en/glossary/ai-agent/) has none of that. Namefi's answer is a checkout path that needs no card, no stored payment method, and no Namefi account at all — just a crypto [wallet](/en/glossary/wallet/) that signs a payment on the spot. This is the deep dive on how that flow actually works, what the signature scheme does and does not let an agent do, and when you'd reach for API-key billing instead.

## Why payment is the hardest part of agentic commerce

Search and price-checking were never the hard part of letting an agent buy things. Those are read-only calls — no authorization needed, nothing at stake if an agent gets it wrong. Payment is different, because it's the one step where getting it wrong costs real money, and every payment system in wide use today assumes a person is the one authorizing the charge.

A stored card is the clearest example. Card-on-file billing works by handing a payment processor a token that can be charged again later, on the merchant's say-so, without the cardholder re-proving anything at the moment of the charge. That's fine for a subscription you trust to bill you monthly. It's a worse fit for an autonomous process: whoever holds that stored-card token can charge it, and the only real defense is trusting the software not to misuse it, or catching the misuse later on a statement. There's no way to hand an agent a stored card that only pays for domain registrations up to $50 — the card doesn't know what it's for.

[What Is an Agent-Native Domain Registrar?](/en/blog/agent-native/) makes the broader case that payment is one of the load-bearing pieces of being usable by an agent, not just having an API. Namefi's crypto-wallet checkout is the concrete answer to that requirement: instead of a stored credential a service can charge whenever it wants, every payment is a signature the wallet produces for that one transaction, at that one price, and nothing else.

## Namefi's answer: wallet-signed checkout, no account creation

Registering a domain on Namefi normally uses an [API key](https://namefi.io/api-key) billed against a funded NFSC (Namefi Service Credit) balance, as covered in [How to Register a Domain with Your AI Agent on Namefi](/en/blog/ai-agent-register/). That path requires an account: someone generates a key from a wallet, tops up a balance, and the key draws down against it on every registration.

The wallet-signed path skips all of that. Per Namefi's published machine-readable documentation for wallet payments, an agent's wallet can pay directly in [USDC](/en/glossary/stablecoin/) with no Namefi account or API key held anywhere — the buyer's wallet signs a payment authorization and the registration settles once that signature arrives. There's nothing to create in advance and nothing standing that could be misused later: the wallet only acts at the moment it signs.

Namefi documents three ways a wallet can produce that signature, covered step by step below: the [x402](/en/glossary/x402/) protocol (the primary path, and the one this guide focuses on), a Machine Payable Protocol (MPP) challenge-response variant, and a manual EIP-712 signing path for wallets that use neither shortcut.

## The x402 flow, step by step

x402 is an open standard, backed by companies including Cloudflare, AWS, and Stripe, that revives the long-dormant HTTP `402 Payment Required` status code as a structured way to ask for an on-chain payment inline with a normal request, rather than redirecting to a separate checkout page. Namefi implements it on its domain-registration endpoint:

1. **Request without payment.** The agent sends a plain `GET` request to Namefi's `/x402/domain/{domainName}` endpoint — no payment attached, because it doesn't know the price yet.
2. **HTTP 402 with price.** Namefi responds `402 Payment Required` and includes the payment options in the response body: the network, the accepted asset (USDC), and the amount. This is the part of x402 that makes it different from a normal error — the 402 status carries everything the client needs to construct a valid payment, rather than just saying "no."
3. **Wallet signs an EIP-3009 `transferWithAuthorization`.** Instead of sending a separate blockchain transaction and waiting for it to confirm, the wallet produces a signature under [EIP-3009](https://eips.ethereum.org/EIPS/eip-3009), an Ethereum standard built specifically for signature-authorized token transfers. EIP-3009's `transferWithAuthorization` function lets a token holder sign a message authorizing a transfer of a specific amount, to a specific recipient, valid only within a specific time window (`validAfter` / `validBefore`), which a third party can then submit on-chain. Namefi's documentation is explicit that this step needs no Namefi account or EIP-712 signing beforehand — the wallet signs a standalone USDC transfer authorization, full stop.
4. **Replay the request with a payment header.** The agent resends the original request, this time with an `X-PAYMENT` header carrying the signed authorization.
5. **Verify, settle, register.** Namefi verifies the signature, starts the domain-registration workflow, and settles the payment — the USDC moves from the buyer's wallet, and the registration proceeds the same way it would through the API-key path, including registering the domain as an [NFT](https://eips.ethereum.org/EIPS/eip-721) — a [tokenized domain](/en/glossary/tokenized-domain/) — to that same paying wallet by default.

Nothing about that sequence requires the agent to have created a Namefi account, stored a credential Namefi could reuse without asking, or given up custody of funds before the exact moment of payment. The signature only proves the wallet authorized this specific USDC transfer, for this amount, within a bounded time window.

## The MPP challenge-response variant

x402 is the primary path, but Namefi also documents a second one for wallets or agent frameworks that speak a different payment pattern: the Machine Payable Protocol (MPP). Structurally it's a mirror image of x402 — a challenge-response instead of a bare 402:

1. The first request to the protected endpoint returns `402 Payment Required` again, but this time carrying a **signed challenge** rather than a plain price quote.
2. The client (typically through Namefi's `mppx` command-line tool, built specifically to handle the signing step) signs that challenge with the paying wallet.
3. The client replays the original request with the resulting signature attached in an `Authorization` header.

The net effect is the same as x402 — a per-request, wallet-signed payment with no stored credential — packaged as a signed-challenge handshake instead of a bare price-in-402 response. Which one an agent uses comes down to what its payment tooling already speaks; Namefi's endpoint understands both.

## The manual EIP-712 path

For wallets or scripts that don't use either shortcut, Namefi exposes a lower-level, fully manual signing path built on [EIP-712](https://eips.ethereum.org/EIPS/eip-712) typed-data signing, the same standard EIP-3009 itself is built on. A request signed this way carries three headers — `x-namefi-signer` (the signing wallet's address), `x-namefi-signature` (the hex-encoded signature), and `x-namefi-eip712-type` (which typed-data schema the signature was produced against) — and wraps its payload in an envelope with a `payloadType`, the `payload` itself, a `timestamp`, and a `nonce`.

Two details matter for safety: **signatures expire after 300 seconds, and nonces are single-use.** A signature captured off the wire, or a request replayed later, doesn't work — it's already expired or its nonce has already been consumed. Namefi's documentation also specifies that the live EIP-712 type definitions must be fetched from its `/v-next/eip712/` endpoints at request time rather than hardcoded by an integration, since the exact schema a signature must match can change.

Namefi also documents smart-contract-wallet signing this way: an approved externally-owned account (EOA) can sign on behalf of a contract wallet under ERC-1271, or the newer EIP-7702, provided the contract implements an `approvedSigners(address)` check the API can verify against.<!-- TODO: confirm — how commonly this smart-contract-wallet path is used in practice versus a standard EOA wallet -->

## The security model: what the agent can and cannot do

It's worth being precise about what this signature scheme actually constrains, rather than describing a stronger guarantee than the mechanism provides.

**What it does constrain.** Every payment — across all three variants above — is a fresh signature tied to one specific transaction: a specific amount, to Namefi's designated address, valid only inside a short time window, and (in the EIP-712 path) consumed by a single-use nonce that can't be replayed. The wallet never hands Namefi standing authority to initiate future charges on its own. Compare that to a stored card: once a merchant has your card token, nothing about the token itself limits what they charge next month, or whether a compromised system reuses it. A wallet's private key never leaves the wallet in any of these flows — the agent asks the wallet to produce a signature for one specific request, and that's the entire scope of what happens.

**What it does not constrain on its own.** Namefi's documentation does not describe a built-in, per-transaction dollar spend cap enforced by the protocol itself — the security here comes from signature expiration and single-use nonces, not a ceiling on how much a single signed request can authorize.<!-- TODO: confirm with team — whether Namefi's x402/MPP endpoint enforces any server-side maximum payment amount independent of what the client requests to sign --> In practice, the actual spending discipline for an agent comes from outside this mechanism: how much USDC you fund the wallet with, and whatever policy layer — a [multi-sig](/en/glossary/multi-sig/) wallet requiring a second approval, or a human confirmation step before the agent may sign at all — you put between the agent and the wallet's [private key](/en/glossary/private-key/). [What Is an Agent-Native Domain Registrar?](/en/blog/agent-native/) and [How to Register a Domain with Your AI Agent on Namefi](/en/blog/ai-agent-register/) cover the same point from the guardrails side: fund the wallet with only what you're comfortable an unattended process spending, and decide up front where a human needs to approve.

That combination — no standing credential, a bounded per-transaction authorization, and funding as the practical spend limit — makes this a genuinely different shape of risk than a card on file, not just a crypto-flavored version of the same thing. A leaked card number or a compromised billing token can be charged repeatedly until someone notices and cancels it. A leaked x402 signature that's already 300 seconds old, or whose nonce is already spent, is worthless the moment it's captured.

## When to use API-key or NFSC billing instead

The wallet-signed path is the right tool when the whole point is that no account should exist before the purchase — a fully autonomous script, an agent operating on someone else's behalf without shared login credentials, or a preference to keep a crypto-native wallet as the only identity involved. It isn't automatically the right tool for every situation.

API-key billing against a funded NFSC balance, as detailed in [How to Register a Domain with Your AI Agent on Namefi](/en/blog/ai-agent-register/), makes more sense when an agent registers domains repeatedly and a standing, checkable balance beats signing a fresh payment every time; when the operator wants a single dashboard view of spend rather than reconstructing it from on-chain transfers; or when the client already has a clean way to store a header value but no easy way to hold and sign with a private key. Both paths lead to the same registration and DNS operations once payment settles — the choice is about how authorization works, not what you can register or manage afterward.

## Frequently Asked Questions

### Do I need a Namefi account to pay with a crypto wallet?
No. The x402 and MPP flows both settle a domain registration from a signed wallet payment with no Namefi account and no API key created beforehand. An API key is only needed for the NFSC-balance billing path.

### What cryptocurrency does Namefi accept for wallet checkout?
USDC. Namefi's x402 endpoint quotes and settles payment in USDC specifically, which avoids the price swings a volatile asset like ETH would introduce between the moment the price is quoted and the moment the payment settles.

### Is signing a wallet payment the same as giving an agent my private key?
No — a signature is produced by the wallet without ever exposing the private key itself. The agent (or the tooling it calls) asks the wallet to sign a specific, bounded authorization; the key stays inside the wallet the entire time.

### Can someone reuse a payment signature I made earlier?
Not under the manual EIP-712 path, where signatures expire after 300 seconds and each nonce can only be used once. The x402 flow's EIP-3009 authorization is similarly bounded by its `validAfter`/`validBefore` window, so a captured signature has a short, finite lifespan rather than standing indefinitely like a stored card token would.

### Does the domain get tokenized automatically when I pay this way?
By default, yes — the registered domain is minted as an NFT to the same wallet that paid, the same tokenization behavior the API-key path uses unless a different receiving wallet is specified. See [Cloudflare vs Name.com vs Namefi: Agent-Native Registrars](/en/blog/cf-namecom-namefi/) for how this compares to registrars that don't offer wallet-native checkout or tokenized ownership at all.

### Is wallet checkout safer than paying with a stored card?
It constrains a different set of risks rather than eliminating risk altogether. There's no standing credential a compromised system can reuse indefinitely, and every payment is a fresh, time-bound, single-use signature — but the protocol itself doesn't cap how much a single signed request can authorize, so the practical ceiling on what an agent can spend still comes from how much you fund the wallet with and any additional approval policy (like a multi-sig) you put in front of it.

## Buy a Domain with a Wallet at Namefi

If the point of using an agent is that no human account should stand between the agent and the purchase, Namefi's wallet-signed checkout is built for exactly that: a real ICANN-accredited domain registration, paid for with a single signed USDC authorization, with tokenized ownership landing in the same wallet that paid. See the full mechanics in [namefi.io/web3/llms.txt](https://namefi.io/web3/llms.txt), or start with the broader setup in [How to Register a Domain with Your AI Agent on Namefi](/en/blog/ai-agent-register/).

**[Search and register a domain at Namefi](https://namefi.io).**

## Sources and further reading

- Namefi — [namefi.io/web3/llms.txt](https://namefi.io/web3/llms.txt) (primary source for the x402 flow, the MPP challenge-response variant, the manual EIP-712 signing path, signature expiry/nonce rules, and ERC-1271/EIP-7702 smart-contract-wallet signing)
- Namefi — [namefi.io/llms.txt](https://namefi.io/llms.txt) (NFSC/API-key billing path, and the pointer to the wallet-payment reference above)
- x402.org — [x402: An Internet-native payment standard](https://x402.org) (the open HTTP-402-based payment protocol Namefi's flow implements)
- Ethereum — [EIP-3009: Transfer With Authorization](https://eips.ethereum.org/EIPS/eip-3009) (the signature standard behind the `transferWithAuthorization` step; `validAfter`/`validBefore` time-bounding, single-use random nonces)
- Ethereum — [EIP-721: Non-Fungible Token Standard](https://eips.ethereum.org/EIPS/eip-721) (the NFT standard tokenized domain ownership is built on)
- Namefi — [How to Register a Domain with Your AI Agent on Namefi](/en/blog/ai-agent-register/) (the API-key/NFSC billing path and broader guardrails guidance)
- Namefi — [Cloudflare vs Name.com vs Namefi: Agent-Native Registrars](/en/blog/cf-namecom-namefi/) (how wallet-native checkout compares across the three agent-facing registrars)
