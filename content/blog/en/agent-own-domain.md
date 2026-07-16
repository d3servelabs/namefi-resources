---
title: "Can an AI Agent Own a Domain? WHOIS, Custody & Tokens"
date: '2026-07-10'
language: 'en'
tags: ['ai-agents', 'domains', 'web3']
authors: ['aileen-wright']
editors: ['victor-zhou']
draft: false
format: faq
ogImage: ../../assets/agent-own-domain-og.jpg
description: "The registrant must be a legal person, but custody can be delegated. WHOIS, API keys, and tokenized domains — the custody spectrum explained."
keywords: ["can an ai agent own a domain", "ai agent domain ownership", "who is the registrant when ai registers a domain", "ai agent whois", "domain registrant legal person", "tokenized domain custody", "ai agent wallet nft domain", "custody spectrum domain", "agent-owned domain risk", "ai agent udrp exposure", "delegate domain to ai agent", "wallet-held domain", "rdap lookup ai agent", "domain ownership vs control"]
relatedArticles:
  - /en/blog/wallet-checkout/
  - /en/blog/agents-buy-domains/
  - /en/blog/ai-agent-register/
  - /en/blog/cf-namecom-namefi/
  - /en/blog/namefi-mcp/
relatedTopics:
  - /en/topics/domain-tokenization/
  - /en/topics/domain-security/
relatedSeries:
  - /en/series/blockchain-concepts/
  - /en/series/tokenize-your-com/
relatedGlossary:
  - /en/glossary/registrant/
  - /en/glossary/whois/
  - /en/glossary/custodial-ownership/
  - /en/glossary/tokenized-domain/
  - /en/glossary/udrp/
---

"Can my AI agent own a domain?" comes up constantly once an [AI agent](/en/glossary/ai-agent/) is registering, renewing, and managing domains on someone's behalf — see [How AI Agents Buy Domains Without a Human](/en/blog/agents-buy-domains/) for how common that's become in 2026. The short answer sits at the top; the rest of this page works through *why*, in the form of the specific questions people actually ask, each one answerable on its own.

## Can an AI agent legally own a domain?

Not in its own name. [ICANN](/en/glossary/icann/)'s [2013 Registrar Accreditation Agreement](https://www.icann.org/en/contracted-parties/accredited-registrars/registrar-accreditation-agreement/2013-registrar-accreditation-agreement-17-09-2013-en#:~:text=The%20Registered%20Name%20Holder%20with%20whom%20Registrar%20enters%20into%20a%20registration%20agreement%20must%20be%20a%20person%20or%20legal%20entity%20other%20than%20the%20Registrar) — the contract every [ICANN-accredited registrar](/en/glossary/icann/) signs and operates under — states directly that "the [Registered Name Holder](/en/glossary/registrant/) with whom Registrar enters into a registration agreement must be a person or legal entity other than the Registrar." A [registrant](/en/glossary/registrant/) has to be a natural person or a registered legal entity: an individual, a company, a nonprofit, a government body. An AI agent, as software, is neither. That rules out the agent itself ever being the name on the registration.

What the rule doesn't rule out is delegation. Nothing in the RAA stops a human or an organization from authorizing an agent to search, register, renew, or manage DNS on their behalf, the way a person might authorize an employee or a piece of automation today. The registrant stays a legal person; the *work* of running the domain can be handed to an agent. That distinction — who's named on the record versus who's doing the clicking (or the API calling) — is the whole subject of this page.

## Who is the registrant when an AI agent registers a domain?

Whoever holds the account, funded the purchase, and agreed to the registrar's terms — never the agent. When an agent calls a registrar's API to register a name, it's acting as a tool under someone's authorization, the same legal shape as a person using a web form, just automated. ICANN's own guidance to registrants is explicit about where that responsibility lands: "you will assume sole responsibility for the registration and use of your domain name," per [ICANN's Registrants' Benefits and Responsibilities page](https://www.icann.org/resources/pages/benefits-2013-09-16-en#:~:text=You%20will%20assume%20sole%20responsibility%20for%20the%20registration%20and%20use%20of%20your%20domain%20name). That responsibility attaches to the account holder who set the agent loose, not to the software that executed the call.

This is why every credible agent-registration flow — [Namefi](https://namefi.io)'s included — routes through a human- or entity-controlled credential: an API key tied to a funded account, or a [wallet](/en/glossary/wallet/) whose [private key](/en/glossary/private-key/) someone controls. See [How to Register a Domain with Your AI Agent on Namefi](/en/blog/ai-agent-register/) for how that credential step works in practice.

## What does the WHOIS or RDAP record actually show for an agent-registered domain?

The same fields it would show for any other registration: registrar of record, registration and expiration dates, and — unless masked by [WHOIS](/en/glossary/whois/) privacy, which most registrars apply by default now — the registrant's name, organization, and contact details. There is no field for "registered by an AI agent," and no ICANN policy defines one. [ICANN's own RDAP-based lookup tool](https://lookup.icann.org) is the authoritative place to check any specific domain's current record, and it returns the same schema regardless of whether a human typed the registration form or an agent called an API to submit the same data.

Practically, that means an outside observer — a trademark holder, a security researcher, a potential buyer — has no way to tell from WHOIS/RDAP alone that a domain was agent-registered. The record identifies the legal registrant. What produced the API call that created it isn't part of the data model.

## What's the difference between an agent *operating* a domain and an agent *owning* it?

Operating means the agent can act on the domain — renew it, edit DNS records, initiate a transfer — because it holds a credential that's scoped to do so. Owning, in the only sense that has legal weight, means being the registrant of record under the RAA definition above: a person or legal entity accountable to the registrar and to ICANN policy. An agent can operate a domain extensively — [Namefi's MCP server](/en/blog/namefi-mcp/) exposes exactly that kind of tooling — without ever being the owner, in the same way a property manager can hold keys and make maintenance calls without holding title to the building.

The gap between those two roles is where most of the practical questions people ask actually live, which is why the next few sections work through it as a spectrum rather than a single yes/no.

## What is the custody spectrum for a domain an agent manages?

Three tiers, each handing the agent progressively more direct control while the legal registrant stays constant:

- **Registrar account access.** The agent (or the script calling the registrar's API on the agent's behalf) uses credentials tied to the human's or organization's own registrar account. The registrant field never changes; the agent is simply acting inside an account someone already owns, the way a login-sharing arrangement works today.
- **API key.** A credential scoped to the registrar's API, billed against a funded balance, without necessarily sharing full account-dashboard access. [Namefi issues these](https://namefi.io/api-key) so an agent can search, price, and register without touching a browser session — covered in [How to Register a Domain with Your AI Agent on Namefi](/en/blog/ai-agent-register/). The registrant is still whoever's account the key is scoped to.
- **Wallet-held [tokenized domain](/en/glossary/tokenized-domain/).** The registration is minted as an on-chain token, and whoever's [wallet](/en/glossary/wallet/) holds that token — via [x402](/en/glossary/x402/) wallet-signed checkout or a designated receiving address — controls the domain's on-chain transfer path directly, without going through a registrar dashboard at all. See [Pay for Domains with a Crypto Wallet: No Account Needed](/en/blog/wallet-checkout/) for the mechanics of getting a domain into a wallet this way.

Each tier is more direct than the last, but the legal registrant question from earlier doesn't move — it's answered the same way regardless of which tier the agent operates at.

## What changes when a domain is tokenized?

Tokenizing a domain mints an [NFT](/en/glossary/nft/) that acts as a parallel, on-chain control layer over a real DNS registration, described in more depth in [What Are Tokenized Domains?](/en/blog/what-are-tokenized-domains/). Namefi, an [ICANN-accredited registrar](/en/glossary/icann/), does this by keeping the underlying registration real and ICANN-recognized while minting the ownership token to a wallet the buyer specifies — Namefi's own documentation describes registering a domain with the resulting token sent directly to a `nftReceivingWallet` address the buyer controls. The domain still has a WHOIS/RDAP record and a registrar of record; the token adds a way to transfer *control* of that record peer-to-peer, on-chain, without a registrar-mediated transfer request.

What tokenization does not do is redefine who's allowed to be a registrant. The [ERC-721](/en/glossary/erc-721/) standard that tokenized domains are built on places [no restriction on what kind of address can hold a token](https://eips.ethereum.org/EIPS/eip-721) — any wallet address can own an NFT, and the standard explicitly contemplates contracts holding tokens too. That's a statement about the token, not about ICANN's registrant rules, which sit at the registrar layer above it and still require the underlying registration to trace back to a legal person or entity.

## Can an AI agent's wallet actually hold a tokenized domain?

Technically, yes, in the narrow sense that a wallet is just a keypair, and nothing in the ERC-721 standard or in a minting transaction checks whether the party that controls the private key is a human, a script, or an autonomous process. If an agent has signing authority over a wallet — its own key, or delegated authority over someone else's — that wallet can receive and hold a tokenized domain's NFT exactly like any other wallet can.

Whether that arrangement makes the *agent* the owner in any legally meaningful sense is a genuinely open question we can't resolve here — no ICANN policy, no court ruling, and no source we found addresses an AI agent (as opposed to the person or entity that controls its wallet) holding legal title to anything. Treat "the agent's wallet holds the token" as a description of technical custody, not a settled legal conclusion. The safer framing, and the one every source above supports: the wallet's *controller* — whoever holds or can direct the private key — is the party with a real claim, and that's still expected to be a person or entity, not the software itself.

## What happens if the agent misbehaves — can a domain be locked or taken back?

Two different protection mechanisms apply depending on custody tier, and they don't offer the same kind of recourse. At the registrar level, ICANN's transfer rules build in friction: a domain generally can't be transferred to a new registrar within 60 days of initial registration, and a **60-day Change of Registrant lock** applies after the registrant's name, organization, or email address changes, both [documented in ICANN's registrant FAQ](https://www.icann.org/resources/pages/name-holder-faqs-2017-10-10-en#:~:text=Another%20situation%20is%20if%20the%20domain%20name%20is%20subject%20to%20a%2060-day%20Change%20of%20Registrant%20lock). Those windows give a registrant time to notice and contest an unauthorized change before it's final — real, if limited, protection against an agent that goes rogue on a standard registrar account or API key.

Once a domain is tokenized and the NFT sits in a wallet, that safety net looks different. An on-chain transfer, once confirmed, is generally final — there's no registrar-side lock to reverse a token sent to the wrong address. That shifts the practical defense earlier, to how much authority the agent's wallet has: a [multi-sig](/en/glossary/multi-sig/) arrangement requiring a second signer, or simply not giving an agent standing authority over a wallet holding valuable tokenized domains, the same guardrail principle covered for payments in [Pay for Domains with a Crypto Wallet](/en/blog/wallet-checkout/#the-security-model-what-the-agent-can-and-cannot-do).

## Does tokenizing a domain remove UDRP exposure?

No, and no source we checked suggests otherwise. [UDRP](/en/glossary/udrp/) obligations attach to the underlying ICANN-recognized DNS registration, which a tokenized domain still has — tokenizing changes who can move the domain and how, not whether trademark law or ICANN's dispute policy applies to it. A think-piece on agent-owned domains put the exposure plainly: "if an agent registers a domain that turns out to be a trademark conflict, there's no human to respond to a UDRP complaint" if nobody's watching what an agent registers under its credentials, [as covered in more detail in How AI Agents Buy Domains Without a Human](/en/blog/agents-buy-domains/#guardrails-no-human-required-still-needs-a-human-set-policy). A UDRP complaint is filed against the registrant of record — whoever that legal person or entity is — not against the agent that happened to submit the registration.

## So who is actually liable if an agent's domain causes a legal problem?

The registrant of record: the human or legal entity whose account, API key, or wallet authorized the registration — never the AI model itself. That's the throughline across every question above: WHOIS/RDAP names a legal person, the RAA requires one, ICANN's transfer-lock protections and UDRP exposure both attach to that same name, and tokenization changes the mechanics of control without touching who's accountable underneath. "The agent owns the domain" is useful shorthand for "the agent has been delegated control of the domain" — treat it as shorthand, not a settled legal fact, since how far that delegation can go, and whether any jurisdiction will treat an autonomous agent as more than a tool its operator is responsible for, remains untested. Before handing an agent purchase or custody authority at any tier above, decide explicitly who the legal registrant is.

## Register and tokenize with a real registrant on record

[Namefi](https://namefi.io) is built for exactly this shape of question: a real [ICANN-accredited](/en/glossary/icann/) registration, with the registrant field handled the way ICANN requires, and an optional [tokenized](/en/glossary/tokenized-domain/) layer that puts on-chain control in whatever wallet you choose — including one an agent operates under the guardrails you set. Start with [How to Register a Domain with Your AI Agent on Namefi](/en/blog/ai-agent-register/), or go straight to wallet-signed checkout in [Pay for Domains with a Crypto Wallet](/en/blog/wallet-checkout/).

**[Search and register a domain at Namefi](https://namefi.io).**

## Sources and further reading

- ICANN — [2013 Registrar Accreditation Agreement, §3.7.7](https://www.icann.org/en/contracted-parties/accredited-registrars/registrar-accreditation-agreement/2013-registrar-accreditation-agreement-17-09-2013-en#:~:text=The%20Registered%20Name%20Holder%20with%20whom%20Registrar%20enters%20into%20a%20registration%20agreement%20must%20be%20a%20person%20or%20legal%20entity%20other%20than%20the%20Registrar) ("must be a person or legal entity other than the Registrar" — the core registrant-eligibility rule)
- ICANN — [Registrants' Benefits and Responsibilities](https://www.icann.org/resources/pages/benefits-2013-09-16-en#:~:text=You%20will%20assume%20sole%20responsibility%20for%20the%20registration%20and%20use%20of%20your%20domain%20name) ("you will assume sole responsibility for the registration and use of your domain name")
- ICANN — [FAQs for Registrants: Transferring Your Domain Name](https://www.icann.org/resources/pages/name-holder-faqs-2017-10-10-en#:~:text=Another%20situation%20is%20if%20the%20domain%20name%20is%20subject%20to%20a%2060-day%20Change%20of%20Registrant%20lock) (60-day new-registration and Change-of-Registrant transfer locks)
- ICANN — [ICANN Lookup (lookup.icann.org)](https://lookup.icann.org) (the official RDAP-based WHOIS/RDAP lookup for any domain's current registrant record)
- Ethereum — [EIP-721: Non-Fungible Token Standard](https://eips.ethereum.org/EIPS/eip-721) (no restriction on what address, including a contract, can hold a token)
- Namefi — [namefi.io/llms.txt](https://namefi.io/llms.txt) (tokenization and `nftReceivingWallet` minting reference — source for Namefi product claims in this article)
- dev.to — [How AI agents can buy their own domain names, and why this matters](https://dev.to/purpleflea/how-ai-agents-can-buy-their-own-domain-names-and-why-this-matters-1l4j#:~:text=If%20an%20agent%20registers%20a%20domain%20that%20turns%20out%20to%20be%20a%20trademark%20conflict%2C%20there%27s%20no%20human%20to%20respond%20to%20a%20UDRP%20complaint) (UDRP exposure when nobody monitors an agent's registrations)
- Namefi — [How AI Agents Buy Domains Without a Human (2026)](/en/blog/agents-buy-domains/) (the guardrails and reseller framing this piece builds on)
- Namefi — [Pay for Domains with a Crypto Wallet: No Account Needed](/en/blog/wallet-checkout/) (wallet-signed custody mechanics and spend-policy guardrails)
