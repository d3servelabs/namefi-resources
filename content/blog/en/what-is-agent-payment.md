---
title: "What Is Agent Payment, and Why Is Everybody Rushing to Provide It?"
date: '2026-08-13'
language: 'en'
tags: ['ai-agents', 'payments', 'explainer']
authors: ['aileen-wright']
editors: ['victor-zhou']
draft: false
format: explainer
ogImage: ../../assets/what-is-agent-payment-og.jpg
description: "Agent payment lets AI agents spend with scoped, revocable authority. Inside Stripe's Link wallet for agents, Mercury's agent cards, and the 2025–26 rush."
keywords: ["what is agent payment", "agent payments explained", "agentic commerce", "Stripe Link wallet for agents", "Stripe Issuing for agents", "Mercury agent cards", "Mercury spend management", "Agentic Commerce Protocol", "Google AP2 protocol", "Mastercard Agent Pay", "Visa Intelligent Commerce", "one-time-use card AI agent", "shared payment token", "AI agent spending limits", "x402 agent payments"]
relatedArticles:
  - /en/blog/wallet-checkout/
  - /en/blog/agents-buy-domains/
  - /en/blog/state-of-agentic/
  - /en/blog/agent-native/
  - /en/blog/ai-agent-register/
relatedTopics:
  - /en/topics/web3-foundations/
  - /en/topics/domain-tokenization/
relatedSeries:
  - /en/series/blockchain-concepts/
  - /en/series/domain-apocalypse/
relatedGlossary:
  - /en/glossary/ai-agent/
  - /en/glossary/x402/
  - /en/glossary/stablecoin/
  - /en/glossary/wallet/
  - /en/glossary/tokenized-domain/
---

In the span of sixteen months, both major card networks, Google, OpenAI, and Stripe have all announced or shipped infrastructure for the same thing: letting an [AI agent](/en/glossary/ai-agent/) spend money. Mastercard [announced Agent Pay](https://www.mastercard.com/global/en/news-and-trends/press/2025/april/mastercard-unveils-agent-pay-pioneering-agentic-payments-technology-to-power-commerce-in-the-age-of-ai.html#:~:text=The%20program%20introduces%20Mastercard%20Agentic%20Tokens) on April 29, 2025. Visa unveiled [Intelligent Commerce](https://usa.visa.com/about-visa/newsroom/press-releases.releaseId.21361.html#:~:text=browse%2C%20select%2C%20purchase%20and%20manage%20on%20their%20behalf) the next day. Google published its [Agent Payments Protocol (AP2)](https://cloud.google.com/blog/products/ai-machine-learning/announcing-agents-to-payments-ap2-protocol#:~:text=breaks%20this%20fundamental%20assumption) with more than 60 partner organizations in September 2025. That same month, OpenAI switched on [Instant Checkout inside ChatGPT](https://openai.com/index/buy-it-in-chatgpt/#:~:text=powered%20by%20the%20Agentic%20Commerce%20Protocol%2C%20built%20with%20Stripe). And in April 2026, Stripe launched [Link's wallet for agents](https://stripe.com/blog/giving-agents-the-ability-to-pay#:~:text=The%20agent%20never%20gets%20access%20to%20your%20raw%20payment%20credentials), a consumer wallet an agent can borrow one purchase at a time. Even Mercury, a business banking platform, now leads its [spend-management pitch](https://mercury.com/spend-management#:~:text=cards%20for%20teams%20and%20agents) with "cards for teams **and agents**."

This piece explains what "agent payment" actually is, walks through two instructive implementations — Stripe's consumer-side wallet and Mercury's business-side agent cards — and then looks at why so many companies decided, almost simultaneously, that they could not afford to sit this one out.

## What "agent payment" actually means

Agent payment is infrastructure that lets a software agent spend money on a person's or company's behalf — with authority that is **scoped** (this much, at this merchant, for this purpose), **provable** (the merchant can tell the agent was in fact authorized), and **revocable** (the owner can shut it off), instead of the blunt instrument of handing the agent a raw card number.

That last clause is the whole point. Nothing has ever stopped you from pasting your Visa number into a bot's config file. What stops most people is that a card number is unscoped authority: whoever holds it can charge anything, anywhere, until you notice and cancel the card. Google's AP2 announcement states the underlying problem plainly: today's payment systems generally ["assume a human is directly clicking 'buy' on a trusted surface"](https://cloud.google.com/blog/products/ai-machine-learning/announcing-agents-to-payments-ap2-protocol#:~:text=assume%20a%20human%20is%20directly%20clicking), and an autonomous agent initiating a payment ["breaks this fundamental assumption"](https://cloud.google.com/blog/products/ai-machine-learning/announcing-agents-to-payments-ap2-protocol#:~:text=breaks%20this%20fundamental%20assumption). AP2 frames the gap as three questions every agent transaction must answer: **authorization** (did the user grant the agent authority for *this* purchase?), **authenticity** (does the agent's request reflect the user's actual intent?), and **accountability** (who eats the loss when something goes wrong?).

Every product in this space — card-network token programs, open protocols, wallets, agent cards — is an attempt to answer those three questions well enough that letting an agent spend money becomes a normal, boring thing to do.

## Stripe: a wallet your agent can borrow, one purchase at a time

Stripe's entry, [announced April 29, 2026](https://stripe.com/blog/giving-agents-the-ability-to-pay#:~:text=Today%20we%E2%80%99re%20launching), is **Link's wallet for agents**, built on top of a new **Issuing for agents** layer. Link is Stripe's consumer wallet — the "save my info for faster checkout" product — with a customer base Stripe puts at [more than 200 million consumers](https://stripe.com/blog/giving-agents-the-ability-to-pay#:~:text=more%20than%20200%20million%20consumers). The agent flow works like this:

1. The consumer grants an agent access to their Link wallet through a standard OAuth flow — the same consent pattern used to connect any third-party app.
2. When the agent wants to buy something, it creates a **spend request** carrying context: merchant name, URL, amount, and a human-readable description of what it's buying and why.
3. The consumer reviews and approves the request on the web or in Link's mobile apps. Today, [each request requires the person's review](https://stripe.com/blog/giving-agents-the-ability-to-pay#:~:text=each%20request%20requires%20the%20person%E2%80%99s%20review) before any credential is shared; Stripe says spending limits and pre-approved autonomy are planned next.
4. On approval, the agent receives either a **one-time-use card** or a **Shared Payment Token (SPT)** — a credential that [can be scoped with controls like amount, currency, and merchant](https://stripe.com/blog/giving-agents-the-ability-to-pay#:~:text=scoped%20with%20controls%20like%20amount%2C%20currency%2C%20and%20merchant). As Stripe puts it: ["The agent never gets access to your raw payment credentials."](https://stripe.com/blog/giving-agents-the-ability-to-pay#:~:text=The%20agent%20never%20gets%20access%20to%20your%20raw%20payment%20credentials)

The design is worth reading closely because it inverts the card-on-file model. A stored card is standing authority the merchant (or agent) can draw on again and again, bounded by agreements that are enforced after the fact rather than by the credential itself; a spend request is a single grant of authority, created at the moment of purchase, bounded to that purchase, and dead afterward. Stripe also exposes the layer underneath — Issuing for agents — so businesses can build their own agentic wallets: single-use virtual cards, fund storage, card-level permissions, transaction monitoring, and fraud controls at authorization time.

## Mercury: the corporate card meets the agent

Stripe's wallet answers the consumer question — *how do I let a shopping agent buy things with my money?* Mercury's [spend management](https://mercury.com/spend-management#:~:text=cards%20for%20teams%20and%20agents) answers the business version, and its answer is revealing: treat agents like employees.

Mercury describes the product as ["self-enforcing expense management with intelligent budgets, employee reimbursements, and cards for teams and agents"](https://mercury.com/spend-management#:~:text=cards%20for%20teams%20and%20agents). The mechanics are the familiar spend-management toolkit — [budgets and guardrails scoped to specific purposes](https://mercury.com/spend-management#:~:text=Set%20up%20budgets%20and%20guardrails%20to%20unblock%20your%20team%20and%20agents), per-category limits, real-time tracking, policies that enforce themselves — extended to non-human spenders: businesses can [issue dedicated agent cards for approved transactions](https://mercury.com/spend-management#:~:text=Issue%20dedicated%20agent%20cards%20for%20approved%20transactions), each with its own limits.

The page even demos it: an agent fills out a checkout form with "Jane's agent card," places a $100 advertising order, and reports back that the card carries a $1,000-per-month spend limit and that the card details were used only for that checkout — never stored. Mercury Spend is [included for all Mercury business banking customers](https://mercury.com/spend-management#:~:text=included%20for%20all%20Mercury%20business%20banking%20customers), with a standalone version planned for teams that bank elsewhere.

The framing matters more than the feature list. For a business, an agent that spends money is not an exotic new payment problem — it's headcount. It gets a card, a budget, a purpose, a monthly limit, and an audit trail, exactly like a new hire in the finance system. Where Stripe built a consent loop for consumers, Mercury built an org chart slot for software.

## Sixteen months of announcements

Put the timeline in one place and the land rush is hard to miss:

| Date | Company | What was announced |
|---|---|---|
| Apr 29, 2025 | Mastercard | [Agent Pay](https://www.mastercard.com/global/en/news-and-trends/press/2025/april/mastercard-unveils-agent-pay-pioneering-agentic-payments-technology-to-power-commerce-in-the-age-of-ai.html#:~:text=The%20program%20introduces%20Mastercard%20Agentic%20Tokens): Agentic Tokens; agents must be [registered and verified](https://www.mastercard.com/global/en/news-and-trends/press/2025/april/mastercard-unveils-agent-pay-pioneering-agentic-payments-technology-to-power-commerce-in-the-age-of-ai.html#:~:text=trusted%20AI%20agents%20to%20be%20registered%20and%20verified) to transact |
| Apr 30, 2025 | Visa | [Intelligent Commerce](https://usa.visa.com/about-visa/newsroom/press-releases.releaseId.21361.html#:~:text=trusted%20with%20payments%2C%20not%20only%20by%20users): opening Visa's network to AI agents via tokenized credentials |
| Sep 16, 2025 | Google | [Agent Payments Protocol (AP2)](https://cloud.google.com/blog/products/ai-machine-learning/announcing-agents-to-payments-ap2-protocol#:~:text=breaks%20this%20fundamental%20assumption): an open protocol with 60+ partners, from Amex to Coinbase to PayPal |
| Sep 29, 2025 | OpenAI + Stripe | [Instant Checkout in ChatGPT](https://openai.com/index/buy-it-in-chatgpt/#:~:text=powered%20by%20the%20Agentic%20Commerce%20Protocol%2C%20built%20with%20Stripe), powered by the open-sourced Agentic Commerce Protocol (ACP) |
| Jan 15, 2026 | Google | [Universal Commerce Protocol (UCP)](/en/blog/google-unveils-universal-commerce-protocol-to-power-the-next-generation-of-ai-shopping-agents/): an open commerce-interoperability standard designed to work alongside AP2 |
| Apr 29, 2026 | Stripe | [Link's wallet for agents + Issuing for agents](https://stripe.com/blog/giving-agents-the-ability-to-pay#:~:text=Today%20we%E2%80%99re%20launching): consumer wallet access and issuing primitives for agent spend |
| 2026 | Mercury | [Spend management with agent cards](https://mercury.com/spend-management#:~:text=Issue%20dedicated%20agent%20cards%20for%20approved%20transactions): budgets, guardrails, and dedicated cards for agents |

Why the stampede? Three forces, and this part is interpretation rather than anything the announcements say outright:

**The buyer is moving, and the wallet wants to move with them.** OpenAI notes that [more than 700 million people turn to ChatGPT each week](https://openai.com/index/buy-it-in-chatgpt/#:~:text=More%20than%20700%20million%20people%20turn%20to%20ChatGPT%20each%20week), and it now handles purchases in-chat. If discovery and checkout both happen inside an agent conversation, whoever supplies the agent's wallet sits between every merchant and every customer. Stripe's pitch to developers is explicit about the prize — build on Link and [reach its 200-million-consumer base](https://stripe.com/blog/giving-agents-the-ability-to-pay#:~:text=more%20than%20200%20million%20consumers). Payment companies watched search and social intermediate commerce for two decades; none of them intends to watch agents do it from the sidelines.

**Unscoped credentials don't survive contact with automation.** Without purpose-built rails, people hand agents stored cards and shared logins — standing authority with no scope, the exact pattern fraud systems exist to catch. Visa's product chief framed the requirement as trust that extends beyond users: agents ["will need to be trusted with payments, not only by users, but by banks and sellers as well"](https://usa.visa.com/about-visa/newsroom/press-releases.releaseId.21361.html#:~:text=trusted%20with%20payments%2C%20not%20only%20by%20users). Networks that can tell an authorized agent from a card-testing bot get to approve more good transactions and block more bad ones; networks that can't will do both badly.

**Protocols are a land grab.** ACP, AP2, Mastercard's Agentic Tokens, and Visa's tokenized credentials all want to be the default grammar of machine purchases. Open standards tend to win these races by being adoptable — which is exactly why OpenAI [open-sourced ACP](https://openai.com/index/buy-it-in-chatgpt/#:~:text=Agentic%20Commerce%20Protocol%2C%20so%20that%20more%20merchants%20and%20developers%20can%20begin%20building) and Google recruited 60 launch partners for AP2, then followed up in January 2026 with the [Universal Commerce Protocol](/en/blog/google-unveils-universal-commerce-protocol-to-power-the-next-generation-of-ai-shopping-agents/) to standardize the shopping workflow around the payment. Nobody wants to integrate the losing standard twice.

## One design pattern, many logos

Strip away the branding and every serious agent-payment product converges on the same four properties:

1. **Never expose the raw credential.** One-time-use cards (Stripe), Shared Payment Tokens (Stripe/ACP), Agentic Tokens (Mastercard), tokenized credentials (Visa). The agent carries a purpose-built instrument, not your PAN.
2. **Scope the authority.** Amount, currency, merchant, and time bounds on the credential itself — OpenAI's version: [encrypted payment tokens "only authorized for specific amounts and specific merchants"](https://openai.com/index/buy-it-in-chatgpt/#:~:text=encrypted%20payment%20tokens%20are%20only%20authorized%20for%20specific%20amounts%20and%20specific%20merchants).
3. **Keep a human in the approval loop — at least for now.** Stripe requires per-request review today; Mercury's budgets pre-authorize spend within limits a human set. The autonomy dial moves, but it starts near zero.
4. **Make agent spend legible.** Registered agents (Mastercard), spend-request context strings (Stripe), real-time tracking and receipts-or-your-card-locks enforcement (Mercury). Every transaction should answer "which agent, on whose authority, for what?"

If those properties sound familiar to crypto-native readers, they should. A signature-authorized [stablecoin](/en/glossary/stablecoin/) transfer under [x402](/en/glossary/x402/)'s exact-payment scheme — an exact amount, to an exact recipient, valid only in a time window, signed by the payer's own [wallet](/en/glossary/wallet/) at the moment of purchase — is the same design arrived at from the other direction, with the scoping enforced by cryptography instead of an issuer's policy engine. Stripe itself lists stablecoins as a coming payment method for agent wallets. The card world and the crypto world are converging on the same answer: *authority per transaction, not authority on file.*

## Where domains fit in

Domains are turning out to be one of the first things agents buy on their own — they're pure API objects, no shipping address required, and every deployed agent product eventually needs a name it controls. We've written about [how agents buy domains without a human](/en/blog/agents-buy-domains/), [what an agent-native registrar looks like](/en/blog/agent-native/), and [how an agent registers a domain on Namefi](/en/blog/ai-agent-register/) step by step.

Namefi's own answer to the payment question is the wallet-signed checkout covered in depth in [Pay for Domains with a Crypto Wallet: No Account Needed](/en/blog/wallet-checkout/): an agent's wallet answers an x402 challenge by signing a USDC transfer authorization for one exact registration, at one exact price, with no account and no stored credential anywhere — and receives the domain as a [tokenized asset](/en/glossary/tokenized-domain/) to that same wallet. It is agent payment in precisely the sense this article has been describing, live today on a real product, for the thing agents most predictably need to buy.

The rush to provide agent payment, in the end, is a rush to be trusted. More than two hundred million Link consumers, more than seven hundred million weekly ChatGPT users, and every corporate card program are all converging on the same bet: the next billion buyers won't all be human, and the infrastructure that gives their software safe, scoped, accountable spending authority will be as foundational as the card network was to the last era of commerce.

## Sources and further reading

- Stripe — [Giving agents the ability to pay](https://stripe.com/blog/giving-agents-the-ability-to-pay) (Link's wallet for agents + Issuing for agents, April 29, 2026)
- Mercury — [Spend Management](https://mercury.com/spend-management) (budgets, guardrails, and dedicated agent cards)
- Google Cloud — [Announcing the Agent Payments Protocol (AP2)](https://cloud.google.com/blog/products/ai-machine-learning/announcing-agents-to-payments-ap2-protocol) (September 16, 2025)
- OpenAI — [Buy it in ChatGPT: Instant Checkout and the Agentic Commerce Protocol](https://openai.com/index/buy-it-in-chatgpt/) (September 29, 2025)
- Mastercard — [Mastercard unveils Agent Pay](https://www.mastercard.com/global/en/news-and-trends/press/2025/april/mastercard-unveils-agent-pay-pioneering-agentic-payments-technology-to-power-commerce-in-the-age-of-ai.html) (April 29, 2025)
- Visa — [Find and Buy with AI: Visa Unveils New Era of Commerce](https://usa.visa.com/about-visa/newsroom/press-releases.releaseId.21361.html) (Visa Intelligent Commerce, April 30, 2025)
- Namefi — [Pay for Domains with a Crypto Wallet: No Account Needed](/en/blog/wallet-checkout/) (x402 wallet-signed checkout)
