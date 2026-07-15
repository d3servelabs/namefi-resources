---
title: "The Cat-and-Mouse War of Email Sender Reputation"
date: '2026-07-14'
language: en
tags: ['email', 'sender-reputation', 'deliverability', 'dmarc', 'domain-security']
authors: ['namefiteam']
draft: false
cluster: domain-security
format: explainer
# ogImage: ../../assets/email-sender-reputation-arms-race-og.jpg  # TODO: generate cover + inline illustrations via the namefi-resource-images skill (needs OPENAI_API_KEY); visual pass deferred
description: A plain-language history of the arms race over email sender reputation—the clever tricks bulk senders use to look trustworthy, how mailbox providers detected and down-weighted each one, and why the only durable move is to send mail people actually want.
keywords: ['email sender reputation', 'domain reputation', 'email deliverability', 'spam filter', 'SPF', 'DKIM', 'DMARC', 'DMARC alignment', 'email warmup', 'snowshoe spam', 'Spamhaus', 'Google Postmaster Tools', 'bulk sender requirements', 'cold email']
relatedArticles:
  - /en/blog/dns-is-the-control-plane/
  - /en/blog/how-domain-hijacking-actually-happens/
  - /en/blog/the-icann-spear-phishing-breach/
  - /en/blog/dns-on-tokenized-domains/
  - /en/blog/avoiding-domain-sale-scams/
relatedTopics:
  - /en/topics/domain-security/
  - /en/topics/domain-basics/
relatedSeries:
  - /en/series/domain-apocalypse/
  - /en/series/name-change-game-change/
relatedGlossary:
  - /en/glossary/dns/
  - /en/glossary/dns-record-types/
  - /en/glossary/dnssec/
  - /en/glossary/phishing/
  - /en/glossary/registrar/
---

Every few months someone asks a version of the same question: is there a shortcut to email reputation? A way to make a brand-new sending domain look established, so that cold outreach lands in the inbox instead of the spam folder? There is a whole industry selling answers—aged domains, warmup networks, rotation tools, "deliverability" services. Almost all of them work for a while and then stop working.

The reason they stop is worth understanding, because it explains the entire history of email as a slow, one-directional arms race. Sender reputation is not really a score for how well you follow the rules. It is a proxy for a single underlying question that mailbox providers care about: **do real humans actually want this mail?** Every trick in the history of bulk email is an attempt to fake the signals that answer that question. Every countermeasure is an attempt to measure the real thing more directly. Because the ground truth—human wantedness—does not move, the measurement can only get closer to it over time. That is why the shortcuts decay.

As a [registrar](/en/glossary/registrar/) and DNS operator, Namefi lives in the part of this story where domains, [DNS records](/en/glossary/dns-record-types/), and authentication meet deliverability. This piece walks the arms race layer by layer: the trick, why it worked, and the countermeasure that eventually caught up with it. The pattern repeats so cleanly that by the end you can predict where any new "reputation hack" will land.

## What sender reputation actually measures

Before the layers, the frame. A mailbox provider like Gmail or Yahoo cannot read your mind, and it cannot survey the recipient before delivering. So it infers wantedness from behavior it can observe: do recipients open, reply, and keep your mail—or do they delete it unread, never engage, and click "report spam"? Google exposes a sanitized view of this in [Postmaster Tools](https://support.google.com/a/answer/14668346), which buckets a domain's and IP's reputation into High, Medium, Low, and Bad, where High means mail is ["rarely marked as spam by Gmail"](https://support.google.com/a/answer/14668346/#:~:text=rarely%20marked%20as%20spam) and Bad means it is almost always rejected.

The exact algorithms are proprietary and change constantly, so nobody outside these companies can describe Gmail's internal code. But the documented direction of travel is consistent and public, and it is enough to explain every layer below. Keep the frame in mind: each trick manufactures a fake version of "humans want this," and each countermeasure finds a way to notice the fake.

## Layer one: the address you send from

The oldest signal is the IP address a message arrives from. Early spam filters kept per-IP reputation, so the earliest trick was volume management across many IPs—**snowshoeing**, named for spreading weight across a wide surface so no single point sinks. A sender splits a campaign across dozens or hundreds of IP addresses, keeping each one under the volume threshold that would trip a filter. A close cousin is renting cheap cloud or VPS capacity and sending directly, on the theory that a fresh IP has no bad history.

Both tricks fake the signal that a normal, established mail server is sending normal volume. The countermeasures attack that fake from several directions at once. Blocklist operators like [Spamhaus](https://www.spamhaus.org/blocklists/policy-blocklist/) publish a Policy Blocklist that names ["end-user IP address ranges"](https://www.spamhaus.org/blocklists/policy-blocklist/#:~:text=end%2Duser%20IP%20address%20ranges) that should never be delivering unauthenticated mail directly—which is most consumer and raw-cloud space. Cloud providers close the door from their side: Google Compute Engine, for example, states that ["connections to destination TCP Port 25 are blocked when the destination is external to your VPC network"](https://docs.cloud.google.com/compute/docs/tutorials/sending-mail/#:~:text=connections%20to%20destination%20TCP%20Port%2025%20are%20blocked), so you cannot simply spin up a VM and blast port 25.

Receiving servers also began requiring that an IP's forward and reverse DNS agree—forward-confirmed reverse DNS, where the IP's PTR record points to a hostname that resolves back to the same IP. Google's bulk-sender guidance makes valid reverse DNS a baseline expectation. And crucially, reputation stopped being per-IP-in-isolation: services that aggregate signals across many networks let a filter recognize a snowshoe pattern as one coordinated fleet rather than a hundred innocent strangers. The moment volume is correlated back into a single actor, spreading it out stops helping.

## Layer two: the domain name behind the mail

When IP tricks got expensive, attention moved to the domain. If your main domain picks up a bad reputation, register a fresh one. If cold outreach burns domains, register lookalikes—`get-yourbrand.com`, `try-yourbrand.com`—and rotate through inboxes and domains so no single name accumulates enough complaints to matter. And to skip the slow part, buy an **aged domain**: a name registered years ago, on the theory that age itself signals trust.

These fake the signal of an established, singular sender with history. The countermeasures separate the thing age is a proxy for—accumulated good behavior—from age itself. Registration date is trivial to buy and therefore nearly worthless as a trust signal; what a filter actually weighs is sending history and recipient engagement tied to that domain. An aged domain with no sending history starts from roughly zero, and an aged domain that was previously abused can carry residual bad reputation you inherit. Providers also group related domains rather than judging each in isolation: reputation can flow across an organizational domain and its subdomains, and clusters of near-identical rotation domains can be recognized as one operation. Rotation raises your costs faster than it lowers theirs.

The domain layer is also where authentication became mandatory, which deserves its own section.

## Layer three: proving you are who you claim to be

For a long time the "From" address was pure decoration—you could put anything there, which is exactly what phishers did. Three DNS-based standards closed that gap. [SPF](/en/glossary/dns-record-types/) lets a domain publish which servers may send on its behalf. DKIM attaches a cryptographic signature that ties a message to a domain. DMARC ties the two together and, critically, requires **alignment**: the visible "From" domain must match the domain that actually passed SPF or DKIM, so you can no longer authenticate as `yourdomain.com` while displaying someone else's name.

For years these were optional, so spammers simply skipped them. That optionality ended in February 2024, when Google and Yahoo made authentication a requirement for bulk senders. Google's guidelines require SPF, DKIM, and DMARC, and specify that ["the domain in the sender's From: header must be aligned with either the SPF domain or the DKIM domain"](https://support.google.com/a/answer/81126/#:~:text=must%20be%20aligned%20with%20either%20the%20SPF); [Yahoo's best practices](https://senders.yahooinc.com/best-practices/) mirror the same rules. Authentication does not prove you are wanted—a perfectly authenticated message can still be unwanted spam—but it does something else: it welds every message permanently to a domain identity that can accumulate reputation. Once you cannot forge the "From," you cannot escape your own track record by hiding behind someone else's name. Newer signals build on this base—BIMI lets authenticated senders display a verified logo, and ARC preserves authentication results across forwarders—but they all assume the same welded identity.

## Layer four: manufacturing engagement

This is the heart of the arms race, because it is the most direct attempt to fake the ground truth itself. If reputation is driven by recipients opening, replying, and moving mail out of spam, then **warmup networks** manufacture exactly those actions. A pool of mailboxes—sometimes tens of thousands—automatically emails one another, opens the messages, replies, marks them important, and drags any that land in spam back to the inbox. To the provider it looks like a domain whose mail people love. Sellers describe this as "warming up" a domain; mechanically it is a fake engagement graph.

The countermeasure is to analyze engagement as a graph rather than a pile of per-message counters, and here an old idea from web search is illuminating. In 2004, Stanford and Yahoo researchers published [*Combating Web Spam with TrustRank*](https://www.vldb.org/conf/2004/RS15P3.PDF), a variant of PageRank that fights link farms by ["selecting a small set of seed pages to be evaluated by an expert"](https://en.wikipedia.org/wiki/TrustRank/#:~:text=selecting%20a%20small%20set%20of%20seed%20pages) and letting trust flow outward from that known-good core, on the assumption that reputable pages rarely link to spam. The consequence is that a cluster of pages linking only to each other cannot bootstrap trust, no matter how densely they cross-link—there is no path from the trusted seed into the island.

A warmup network is that island. It is worth being clear that this is an analogy, not a claim about Gmail's internal code, which is not public. But the structural problem is real: engagement that circulates only inside a closed pool of sender-controlled mailboxes has no edge connecting it to the mailboxes of people who genuinely wanted the mail. Trust that transfers has to originate from real recipients, and a self-referential loop produces none of it. Worse, the warmup pool is itself detectable—the participating domains cluster, and once a provider identifies them, associating with them can propagate distrust rather than trust, the same way anti-spam link analysis lets a bad neighborhood pull down everything linked to it. Automated warmup is increasingly down-weighted or penalized outright, and an engagement curve that is too smooth and too perfect is itself a tell, because real human attention is noisy.

## Layer five: dressing up the message

Even with a trusted-looking sender, the content can give a campaign away, so this layer is about disguising that identical bulk mail is being sent to thousands of people. The classic tools: **spintax**, which generates slightly different wordings of the same message so no two are byte-identical; hidden text and image-only emails to defeat keyword filters; URL shorteners and redirects to mask where links really go; and tracking pixels to measure opens. More recently, mail-merge "hyper-personalization" inserts each recipient's name and company to make a blast feel one-to-one.

These fake the signal of a genuinely individual message. The countermeasures moved from reading words to reading structure and behavior. Near-duplicate detection clusters messages that share a skeleton even when the surface wording is spun, so spintax is visible precisely because the variants are structurally identical. Links carry their own reputation, so shorteners and redirect chains to low-reputation destinations hurt rather than help. And the tracking pixel, once a spammer's favorite, has become a liability: aggressive open-tracking correlates with unwanted mail, and Apple's Mail Privacy Protection—introduced in 2021—broke open tracking outright by routing remote content through ["two separate relays operated by different entities"](https://www.apple.com/legal/privacy/data/en/mail-privacy-protection/#:~:text=two%20separate%20relays%20operated%20by%20different%20entities) and loading it in the background regardless of whether the recipient opened anything. Open rate stopped being a reliable signal for anyone, honest senders included.

## Layer six: volume and cadence

If sudden bursts look automated, the next trick is to look human: drip slowly, randomize send times, cap each mailbox at a modest daily number, send only during business hours. The goal is to imitate a person typing individual emails rather than a machine emptying a queue.

The countermeasures set hard thresholds and watch for pattern breaks. Google's bulk-sender rules define a bulk sender as one sending roughly 5,000 or more messages a day to Gmail and require that spam-complaint rate, measured in Postmaster Tools, [stay well under 0.30%](https://support.google.com/a/answer/81126/#:~:text=0.30)—a ceiling low enough that even a slow, careful campaign to people who did not ask for it will breach it, because complaints track wantedness, not cadence. Bounce rates, sudden changes in sending pattern, and the shape of a ramp are all monitored. The bulk definition also triggers extra obligations, including one-click unsubscribe implemented per [RFC 8058](https://www.rfc-editor.org/rfc/rfc8058), which defines ["a method for signaling a one-click function for the List-Unsubscribe email header field"](https://www.rfc-editor.org/rfc/rfc8058/#:~:text=signaling%20a%20one%2Dclick%20function) so recipients can leave without friction. Slowing down changes how fast you hit the wall; it does not move the wall, because the wall is built from human complaints.

## Layer seven: who you send to

The final layer is the list itself. Scraped addresses, catch-all guessing, `first.last@company.com` permutations, and bulk verification services all try to reach people who never opted in, which is the definition of unwanted mail.

The countermeasures target the list directly. **Spam traps** are addresses that exist only to catch senders who did not get permission—pristine traps that were never valid and so can only have been scraped or guessed, and recycled traps that were once real but abandoned, which catch senders working from stale lists. Feedback loops report complaints straight back to the sender. And the platforms people scrape increasingly forbid it: GitHub's terms, for instance, prohibit using information scraped from the site to send bulk email to users who did not agree to receive it. Even the infrastructure refuses this traffic—transactional email providers built for receipts and password resets, like Postmark, restrict their service to transactional messages that are ["one-to-one unique messages the recipient is expecting to receive"](https://postmarkapp.com/support/article/804-what-are-transactional-emails/#:~:text=one%2Dto%2Done%20unique%20messages) and disallow marketing blasts, so routing cold outreach through a transactional API violates the acceptable-use policy and gets the account shut down. A better-verified list of people who did not want your mail is still a list of people who did not want your mail.

## What actually still works in 2026

Notice what survives every round. Authentication (SPF, DKIM, DMARC with alignment) and basic list hygiene are table stakes now, not an advantage—they get you to the starting line, and their absence disqualifies you, but their presence earns nothing on its own. What actually moves reputation is unchanged from the beginning: a real prior relationship, genuine two-way engagement, and mail that is relevant enough that recipients open and reply because they want to. Low volume paired with high, honest personalization works not because it games the filter but because it tends to produce mail people actually welcome. And it is worth being candid that at real scale, warmup is a gray, decaying tactic: it may buy a window, but it degrades as detection improves, and it carries the risk of dragging associated domains down with it.

## The pattern underneath

Read the layers together and the shape is unmistakable. Every trick is a way to fake the answer to "do humans want this?"—a fake IP history, a fake domain age, a fake identity, a fake engagement graph, a fake individual message, a fake human cadence, a fake opt-in. Every countermeasure is a way to measure the real answer more directly, whether by welding identity to a domain, analyzing engagement as a graph, or reading complaint rates as ground truth. The measurement keeps converging on the thing it has always been a proxy for, which is why the shortcuts have a shelf life and the target does not move.

There is only one move in this game that never gets patched, because it is not a trick: send mail that people are glad to receive. Everything else is a temporary lead in a race the measurement always eventually wins.

For teams that operate their own sending domains, this is also why the boring infrastructure matters. The naming and authentication layer—your [DNS](/en/glossary/dns/) records, your SPF and DKIM and DMARC alignment, the domain identity that every message is welded to—is the foundation the whole reputation system is built on. It will not make unwanted mail wanted. But get it wrong and even wanted mail struggles to arrive, and get it hijacked and your hard-earned reputation becomes someone else's [phishing](/en/glossary/phishing/) tool. As a registrar and DNS operator, that control plane is the layer Namefi cares about getting right, so that the reputation you actually earn is the reputation your recipients actually see.

## Sources and further reading

- Google — [Email sender guidelines](https://support.google.com/a/answer/81126) (bulk-sender requirements effective February 2024: SPF, DKIM, DMARC with From alignment, spam-complaint rate under 0.30%, one-click unsubscribe, ~5,000/day bulk threshold).
- Google — [Postmaster Tools reputation dashboards](https://support.google.com/a/answer/14668346) (High / Medium / Low / Bad domain and IP reputation buckets).
- Yahoo — [Sender best practices](https://senders.yahooinc.com/best-practices/) (2024 authentication, complaint-rate, and unsubscribe requirements).
- Spamhaus — [Policy Blocklist (PBL)](https://www.spamhaus.org/blocklists/policy-blocklist/) (end-user and raw-cloud IP ranges that should not send unauthenticated mail directly).
- Google Cloud — [Sending email from a Compute Engine instance](https://docs.cloud.google.com/compute/docs/tutorials/sending-mail) (outbound port 25 blocked to external destinations).
- IETF — [RFC 8058: Signaling One-Click Functionality for List Email Headers](https://www.rfc-editor.org/rfc/rfc8058).
- Zoltán Gyöngyi, Hector Garcia-Molina, Jan Pedersen — [*Combating Web Spam with TrustRank*](https://www.vldb.org/conf/2004/RS15P3.PDF) (VLDB 2004), and the [TrustRank overview](https://en.wikipedia.org/wiki/TrustRank) (seed-set trust propagation that self-referential clusters cannot bootstrap).
- Apple — [Mail Privacy Protection](https://www.apple.com/legal/privacy/data/en/mail-privacy-protection/) (2021; two-relay IP hiding and background remote-content loading that breaks open tracking).
- Postmark — [What are transactional emails?](https://postmarkapp.com/support/article/804-what-are-transactional-emails) (transactional-only acceptable use; no bulk/marketing blasts).
