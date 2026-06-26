---
title: 'Domain Mayday EP03: The 2020 Twitter Bitcoin Account Takeover'
date: '2026-06-17'
language: en
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
cluster: domain-security
series: domain-apocalypse
seriesOrder: 5
format: case-study
description: 'On July 15, 2020, attackers phoned their way into Twitter, hijacked the verified accounts of Obama, Biden, Musk, Gates, Apple and Uber, and ran a Bitcoin doubling scam — netting about $118,000. A deep-dive on how control of an online identity was stolen, and what it teaches about owning a name.'
keywords: ['2020 twitter hack', 'twitter bitcoin scam', 'graham ivan clark', 'vishing', 'phone spear phishing', 'social engineering', 'account takeover', 'online identity security', 'verified account hijacking', 'twitter admin tool', 'agent tool', 'insider risk', 'domain security', 'ny dfs twitter report']
relatedArticles:
  - /en/blog/the-bitcoin-org-dns-hijack/
  - /en/blog/the-godaddy-multi-year-breach/
  - /en/blog/the-2024-squarespace-defi-domain-hijacks/
  - /en/blog/the-12-dollar-minute-someone-owned-google-com/
  - /en/blog/the-fox-it-dns-hijack/
relatedTopics:
  - /en/topics/domain-security/
  - /en/topics/domain-tokenization/
relatedSeries:
  - /en/series/domain-apocalypse/
  - /en/series/name-change-game-change/
relatedGlossary:
  - /en/glossary/registrar/
  - /en/glossary/dns/
  - /en/glossary/icann/
  - /en/glossary/tld/
  - /en/glossary/web3/
---

For a few hours on a Wednesday afternoon, the most trusted voices on the internet all started saying the same thing: send me Bitcoin, and I'll send you back double.

Barack Obama said it. Joe Biden said it. Elon Musk said it. Bill Gates, Jeff Bezos, Kanye West, Apple, Uber — the blue-checkmarked, identity-verified accounts that hundreds of millions of people had been trained to believe — all posted the same crude crypto scam, almost word for word. None of those people typed a single character. Their *accounts* did, because someone else was holding the keys.

This is **Domain Mayday EP03**. The first two episodes were about names — who owns them, who can take them. This one is about the same question wearing a different costume. A Twitter handle, a verified badge, a domain name: each is a claim of identity that the rest of us take on trust. And on July 15, 2020, attackers proved how little it takes to seize that claim — not with malware or a zero-day, but with a phone call.

## The trust that lives in a handle

A verified account is a trust shortcut. When `@BarackObama` posts, you don't re-verify that it's really him; the handle plus the badge *is* the verification. That shortcut is enormously valuable — and enormously fragile, because all of the trust accumulates on the account, while control of the account can sit somewhere else entirely.

It's the same structure as a domain name. `whitehouse.gov` is trusted not because every visitor inspects the certificate chain, but because the name itself carries authority. Control that name — at the [registrar](/en/glossary/registrar/), at the [DNS](/en/glossary/dns/), at the admin panel — and you inherit all the trust people poured into it, instantly, whether or not it was ever yours.

The 2020 Twitter hack is the cleanest demonstration we have of that gap between *trust* and *control*. New York's financial regulator, which investigated because regulated crypto firms were among the victims, put it bluntly: the attack was "[a cautionary tale about the extraordinary damage that can be caused even by unsophisticated cybercriminals](https://www.dfs.ny.gov/Twitter_Report#:~:text=The%20Twitter%20Hack%20is%20a%20cautionary%20tale%20about%20the%20extraordinary%20damage%20that%20can%20be%20caused%20even%20by%20unsophisticated%20cybercriminals)."

## July 15, 2020: the takeover

![Vivid colorful concept art of a single glowing master key unlocking a vast wall of identical generic blue verified badges, each badge popping open in sequence](../../assets/the-2020-twitter-bitcoin-account-takeover-01-takeover.jpg)

It happened fast and in daylight. Per Wikipedia's reconstruction, "[On July 15, 2020, between 20:00 and 22:00 UTC, 130 high-profile Twitter accounts were compromised](https://en.wikipedia.org/wiki/2020_Twitter_account_hijacking#:~:text=On%20July%2015%2C%202020%2C%20between%2020%3A00%20and%2022%3A00%20UTC%2C%20130%20high%2Dprofile%20Twitter%20accounts%20were%20compromised)."

The New York Department of Financial Services (DFS) report lays out the choreography. The attackers warmed up on crypto first: "[The Hackers first manipulated Twitter accounts connected to well-known cryptocurrency companies and individuals](https://www.dfs.ny.gov/Twitter_Report#:~:text=The%20Hackers%20first%20manipulated%20Twitter%20accounts%20connected%20to%20well%2Dknown%20cryptocurrency%20companies%20and%20individuals)," seeding direct messages and tweets that pointed to a Bitcoin [wallet](/en/glossary/wallet/). Then they escalated: "[The Hackers then raised the stakes significantly and targeted verified Twitter accounts with millions of followers](https://www.dfs.ny.gov/Twitter_Report#:~:text=The%20Hackers%20then%20raised%20the%20stakes%20significantly%20and%20targeted%20verified%20Twitter%20accounts%20with%20millions%20of%20followers)."

The list of who got hit reads like a guest list for the most-trusted accounts on the platform. Wikipedia notes the "[supposedly compromised accounts included those of well-known individuals such as Barack Obama, Joe Biden, Bill Gates, Jeff Bezos...and companies such as Apple, Uber, and Cash App](https://en.wikipedia.org/wiki/2020_Twitter_account_hijacking#:~:text=well%2Dknown%20individuals%20such%20as%20Barack%20Obama%2C%20Joe%20Biden%2C%20Bill%20Gates%2C%20Jeff%20Bezos)."

The message was identical and absurdly simple. From Apple's account, as recorded by Wikipedia: "[We are giving back to our community. We support Bitcoin and believe you should too! All Bitcoin sent to our addresses will be sent back to you, doubled!](https://en.wikipedia.org/wiki/2020_Twitter_account_hijacking#:~:text=We%20are%20giving%20back%20to%20our%20community.%20We%20support%20Bitcoin%20and%20believe%20you%20should%20too!%20All%20Bitcoin%20sent%20to%20our%20addresses%20will%20be%20sent%20back%20to%20you%2C%20doubled!)" The same offer, repeated through dozens of the world's most credible mouths at once.

Not every account was used. Of the 130 touched, the regulator found, "[Overall, 130 Twitter user accounts were compromised during the Twitter Hack. Of those, 45 accounts were used to send tweets](https://www.dfs.ny.gov/Twitter_Report#:~:text=Overall%2C%20130%20Twitter%20user%20accounts%20were%20compromised%20during%20the%20Twitter%20Hack.%20Of%20those%2C%2045%20accounts%20were%20used%20to%20send%20tweets)." Forty-five megaphones was more than enough.

## What was actually lost

In raw dollars, the haul was small. The DFS report states the "[Hackers stole approximately $118,000 worth of bitcoin through the Twitter Hack](https://www.dfs.ny.gov/Twitter_Report#:~:text=The%20Hackers%20stole%20approximately%20%24118%2C000%20worth%20of%20bitcoin%20through%20the%20Twitter%20Hack)." Wikipedia notes that a single scam wallet "[received over 320 deposits with a value of over US$110,000 before the scam messages were removed](https://en.wikipedia.org/wiki/2020_Twitter_account_hijacking#:~:text=received%20over%20320%20deposits%20with%20a%20value%20of%20over%20US%24110%2C000%20before%20the%20scam%20messages%20were%20removed)." For a breach of this magnitude, $118,000 is almost embarrassingly modest.

But the dollar figure badly understates the loss. What actually fell that afternoon was the *integrity of the verified handle as a trust signal*. For two hours, a blue checkmark proved nothing. The platform's entire identity layer — the thing that let you believe a tweet came from the person whose name was on it — was demonstrably, simultaneously controllable by a teenager. Twitter's response was telling: it temporarily froze the ability of many verified accounts to tweet at all. The only way to stop the trusted accounts from lying was to silence them.

That is the real cost of an identity takeover. The money is a footnote. The damage is that "this account = this person" stops being true, and everyone downstream who relied on that equation is exposed.

## How it happened: a phone call, then an admin panel

![Vivid colorful concept art of a telephone handset cast like a fishing line, its hook snagging the dashboard of a glowing internal control panel covered in switches and toggles](../../assets/the-2020-twitter-bitcoin-account-takeover-02-vishing.jpg)

There was no exploit. The DFS report is emphatic: "[The Twitter Hack did not involve any of the high-tech or sophisticated techniques often used in cyberattacks – no malware, no exploits, and no backdoors](https://www.dfs.ny.gov/Twitter_Report#:~:text=The%20Twitter%20Hack%20did%20not%20involve%20any%20of%20the%20high%2Dtech%20or%20sophisticated%20techniques%20often%20used%20in%20cyberattacks%20%E2%80%93%20no%20malware%2C%20no%20exploits%2C%20and%20no%20backdoors)." Instead, "[The Hackers used basic techniques more akin to those of a traditional scam artist: phone calls where they pretended to be from Twitter's Information Technology department](https://www.dfs.ny.gov/Twitter_Report#:~:text=The%20Hackers%20used%20basic%20techniques%20more%20akin%20to%20those%20of%20a%20traditional%20scam%20artist%3A%20phone%20calls%20where%20they%20pretended%20to%20be%20from%20Twitter%E2%80%99s%20Information%20Technology%20department)."

This is **vishing** — voice [phishing](/en/glossary/phishing/). The attackers "[called several Twitter employees and claimed to be calling from the Help Desk in Twitter's IT department](https://www.dfs.ny.gov/Twitter_Report#:~:text=called%20several%20Twitter%20employees%20and%20claimed%20to%20be%20calling%20from%20the%20Help%20Desk%20in%20Twitter%E2%80%99s%20IT%20department)," and "[claimed they were responding to a reported problem the employee was having with Twitter's Virtual Private Network](https://www.dfs.ny.gov/Twitter_Report#:~:text=claimed%20they%20were%20responding%20to%20a%20reported%20problem%20the%20employee%20was%20having%20with%20Twitter%E2%80%99s%20Virtual%20Private%20Network)." Twitter itself later described it as a "[phone spear phishing attack](https://krebsonsecurity.com/2020/07/three-charged-in-july-15-twitter-compromise/#:~:text=phone%20spear%20phishing%20attack)" that relied on "[a significant and concerted attempt to mislead certain employees and exploit human vulnerabilities](https://krebsonsecurity.com/2020/07/three-charged-in-july-15-twitter-compromise/#:~:text=a%20significant%20and%20concerted%20attempt%20to%20mislead%20certain%20employees%20and%20exploit%20human%20vulnerabilities)."

The convincer was research, not technical skill. As security journalist Brian Krebs documented, the attackers leaned on profile data — names, roles, personal details pulled from LinkedIn and prior data leaks — to sound like real colleagues. Once an employee believed the caller, that employee handed over credentials, and the credentials opened the door to the prize: Twitter's internal account-management tooling.

That tool is the crux of the whole story. Krebs reported that "[within Twitter's admin tools, apparently you can update the email address of any Twitter user](https://krebsonsecurity.com/2020/07/whos-behind-wednesdays-epic-twitter-hack/#:~:text=within%20Twitter%E2%80%99s%20admin%20tools%2C%20apparently%20you%20can%20update%20the%20email%20address%20of%20any%20Twitter%20user)" — change the email, trigger a password reset, and the account is yours, badge and all. The DFS report points to the structural failure that made one cracked employee so catastrophic: "[Twitter did limit access to the internal tools, but over 1,000 Twitter employees still had access to them](https://www.dfs.ny.gov/Twitter_Report#:~:text=Twitter%20did%20limit%20access%20to%20the%20internal%20tools%2C%20but%20over%201%2C000%20Twitter%20employees%20still%20had%20access%20to%20them)." A thousand-plus people held a master key to every identity on the platform, and the company had no chief information security officer to mind it — Twitter "[had not had a chief information security officer ("CISO") since December 2019, seven months before the Twitter Hack](https://www.dfs.ny.gov/Twitter_Report#:~:text=had%20not%20had%20a%20chief%20information%20security%20officer%20(%E2%80%9CCISO%E2%80%9D)%20since%20December%202019%2C%20seven%20months%20before%20the%20Twitter%20Hack)."

There was a [marketplace](/en/glossary/marketplace/) underneath all of this, too. Before the celebrity scam went out, the crew was busy selling stolen short, "OG" handles. Krebs noted that prior to the Obama/Biden/Musk/Gates blast, "[several highly desirable short-character Twitter account names changed hands](https://krebsonsecurity.com/2020/07/whos-behind-wednesdays-epic-twitter-hack/#:~:text=several%20highly%20desirable%20short%2Dcharacter%20Twitter%20account%20names%20changed%20hands)," because in that community "[short-character profile names confer a measure of status and wealth](https://krebsonsecurity.com/2020/07/twitter-hacking-for-profit-and-the-lols/#:~:text=short%2Dcharacter%20profile%20names%20confer%20a%20measure%20of%20status%20and%20wealth)" and "[can often fetch thousands of dollars when resold](https://krebsonsecurity.com/2020/07/twitter-hacking-for-profit-and-the-lols/#:~:text=can%20often%20fetch%20thousands%20of%20dollars%20when%20resold)." Names with scarcity value, stolen and flipped on a forum — a pattern any domain investor will recognize instantly.

## The aftermath and the arrests

The unraveling was nearly as fast as the hack. Within two weeks, prosecutors moved. Krebs reported the charges: "[Mason 'Chaewon' Sheppard, a 19-year-old from Bognor Regis, U.K., also was charged in California with conspiracy to commit wire fraud, money laundering and unauthorized access to a computer](https://krebsonsecurity.com/2020/07/three-charged-in-july-15-twitter-compromise/#:~:text=Mason%20%E2%80%9CChaewon%E2%80%9D%20Sheppard%2C%20a%2019%2Dyear%2Dold%20from%20Bognor%20Regis%2C%20U.K.%2C%20also%20was%20charged%20in%20California%20with%20conspiracy%20to%20commit%20wire%20fraud%2C%20money%20laundering%20and%20unauthorized%20access%20to%20a%20computer)," and "[Nima 'Rolex' Fazeli, a 22-year-old from Orlando, Fla., was charged in a criminal complaint in Northern California with aiding and abetting intentional access to a protected computer](https://krebsonsecurity.com/2020/07/three-charged-in-july-15-twitter-compromise/#:~:text=Nima%20%E2%80%9CRolex%E2%80%9D%20Fazeli%2C%20a%2022%2Dyear%2Dold%20from%20Orlando%2C%20Fla.%2C%20was%20charged%20in%20a%20criminal%20complaint%20in%20Northern%20California%20with%20aiding%20and%20abetting%20intentional%20access%20to%20a%20protected%20computer)."

But the alleged ringleader was younger still. "[17-year-old Graham Clark of Tampa, Fla. was among those charged in the July 15 Twitter hack](https://krebsonsecurity.com/2020/07/three-charged-in-july-15-twitter-compromise/#:~:text=17%2Dyear%2Dold%20Graham%20Clark%20of%20Tampa%2C%20Fla.%20was%20among%20those%20charged%20in%20the%20July%2015%20Twitter%20hack)," and as a minor he was charged by Florida's state attorney rather than federal court. He "[was hit with 30 felony charges, including organized fraud, communications fraud](https://krebsonsecurity.com/2020/07/three-charged-in-july-15-twitter-compromise/#:~:text=was%20hit%20with%2030%20felony%20charges%2C%20including%20organized%20fraud%2C%20communications%20fraud)."

The following March, Clark took a deal. CyberScoop reported he "[admitted to being behind a scheme that saw him steal more than $117,000 by taking over the Twitter accounts of numerous public figures](https://cyberscoop.com/twitter-hack-guilty-plea-graham-ivan-clark/#:~:text=admitted%20to%20being%20behind%20a%20scheme%20that%20saw%20him%20steal%20more%20than%20%24117%2C000%20by%20taking%20over%20the%20Twitter%20accounts%20of%20numerous%20public%20figures)." Public radio station WUSF reported the sentence: "[three years in a juvenile facility to be followed by three years of probation](https://www.wusf.org/courts-law/2021-03-16/tampa-twitter-hacker-sentenced-to-three-years-in-prison-three-years-probation#:~:text=three%20years%20in%20a%20juvenile%20facility%20to%20be%20followed%20by%20three%20years%20of%20probation)," which it noted was "[the maximum allowed under the state's youthful offender law](https://www.wusf.org/courts-law/2021-03-16/tampa-twitter-hacker-sentenced-to-three-years-in-prison-three-years-probation#:~:text=the%20maximum%20allowed%20under%20the%20state%E2%80%99s%20youthful%20offender%20law)."

A fourth figure surfaced later. Wikipedia records that "[in April 2023, 23-year-old Joseph James O'Connor, a British citizen with the online handle PlugwalkJoe, was extradited from Spain to New York to face charges](https://en.wikipedia.org/wiki/2020_Twitter_account_hijacking#:~:text=In%20April%202023%2C%2023%2Dyear%2Dold%20Joseph%20James%20O%E2%80%99Connor%2C%20a%20British%20citizen%20with%20the%20online%20handle%20PlugwalkJoe%2C%20was%20extradited%20from%20Spain)," and was later sentenced to five years in federal prison.

## What this teaches about controlling online identity

Strip away the celebrity names and the crypto, and the 2020 Twitter hack is a pure lesson in the difference between *having* an identity and *controlling* one. A few principles fall out of it:

1. **Trust accumulates on the name; control lives in the back office.** Hundreds of millions of people trusted `@BarackObama`. None of that trust protected the account, because the account's control surface was an internal admin panel a thousand-plus employees could reach. Whoever controls the back office controls the identity, no matter whose name is on the front.

2. **The weakest link is almost never the cryptography.** No exploit, no malware, no backdoor — just a convincing phone call. Identity systems fail at the human and process layer far more often than at the math layer. A perfect lock on a door that any helpful employee will open on request is not a lock.

3. **A single point of total control is a single point of total failure.** One reusable internal tool that could change the email on *any* account meant one compromised employee equaled platform-wide takeover. Concentrated, reversible, opaque control is the vulnerability.

4. **Scarce names are targets.** The same crew that hijacked presidents also quietly sold off short "OG" handles for thousands of dollars. Valuable names attract theft, and a name's worth is exactly what makes its control worth stealing.

5. **Recovery should not depend on the platform's mercy.** When the trusted accounts started lying, Twitter's only lever was to freeze them. Identity owners had no independent way to prove "this is really me" or to reclaim control — they were entirely dependent on a centralized operator's internal tooling and goodwill.

## The Namefi angle

![Colorful illustration of verifiable, tamper-resistant ownership of an online identity — secured by a green shield, a green Namefi token, and continuity](../../assets/the-2020-twitter-bitcoin-account-takeover-03-namefi-angle.jpg)

A domain name is an online identity with exactly the same trust-versus-control gap that Twitter's verified handles had — and often the same kind of opaque back office. For most domains, "ownership" lives in a registrar account, defended by a password and a support team. A convincing phone call, a social-engineered support rep, an email change pushed through an internal panel — the 2020 Twitter playbook maps almost one-to-one onto a registrar account takeover. The trust the world has poured into your domain doesn't protect it if control of that domain sits behind a help desk that can be talked into anything.

[Namefi](https://namefi.io) exists to close that gap. The core idea is that control of a domain should be *verifiable and owner-held*, not a setting in someone else's admin tool. By representing [domain ownership](/en/glossary/domain-ownership/) as a tokenized, on-chain asset that stays compatible with DNS, Namefi makes the question "who controls this name?" answerable cryptographically rather than by a support agent's judgment under pressure. There's no single internal panel that a thousand employees can reach to silently reassign your name; the proof of control lives with the owner, and transfers are auditable rather than improvised.

The 2020 Twitter hack worked because identity and control had been quietly pried apart — the name said one thing while a hidden admin tool decided another. The lesson for anyone who depends on a name is to make control as legible and as owner-anchored as the trust the name carries. A handle, a badge, a domain: each is only as secure as the back office behind it. Namefi's bet is that the back office should be a verifiable ledger you control, not a phone line someone else can be tricked into answering.

## Sources and further reading

- New York Department of Financial Services — [Twitter Investigation Report](https://www.dfs.ny.gov/Twitter_Report)
- Wikipedia — [2020 Twitter account hijacking](https://en.wikipedia.org/wiki/2020_Twitter_account_hijacking)
- Krebs on Security — [Who's Behind Wednesday's Epic Twitter Hack?](https://krebsonsecurity.com/2020/07/whos-behind-wednesdays-epic-twitter-hack/)
- Krebs on Security — [Twitter Hacking for Profit and the LoLs](https://krebsonsecurity.com/2020/07/twitter-hacking-for-profit-and-the-lols/)
- Krebs on Security — [Three Charged in July 15 Twitter Compromise](https://krebsonsecurity.com/2020/07/three-charged-in-july-15-twitter-compromise/)
- CyberScoop — [Twitter hacker pleads guilty, sentenced to 3 years](https://cyberscoop.com/twitter-hack-guilty-plea-graham-ivan-clark/)
- WUSF — [Tampa Twitter Hacker Sentenced To Three Years In Prison, Three Years Probation](https://www.wusf.org/courts-law/2021-03-16/tampa-twitter-hacker-sentenced-to-three-years-in-prison-three-years-probation)
- U.S. Department of Justice — [Three Individuals Charged for Alleged Roles in Twitter Hack](https://www.justice.gov/usao-ndca/pr/three-individuals-charged-alleged-roles-twitter-hack)
- ABC News — [Florida man who pleaded guilty to hacking Twitter as 17-year-old sentenced to 3 years](https://abcnews.go.com/Politics/florida-man-pleaded-guilty-hacking-twitter-17-year/story?id=76513232)
