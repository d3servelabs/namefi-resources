---
title: '域名求救信号 EP05：2024 年 Squarespace DeFi 域名大规模劫持事件'
date: '2026-06-17'
language: zh
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: "2024 年 7 月，一次从 Google Domains 到 Squarespace 的注册商迁移，将薄弱的默认身份验证变成了一个大规模的攻击面。攻击者劫持了加密和 DeFi 项目（Compound Finance、Celer Network、Pendle、Unstoppable Domains）的域名，并将它们指向了会清空钱包的钓鱼网站。本文将探讨一次“无缝”迁移是如何敞开了数以百计未上锁的前门，以及它在注册商安全和多因素认证（MFA）方面给我们带来的启示。"
keywords: ['Squarespace 域名劫持', 'Google Domains 迁移', 'DeFi DNS 劫持', 'Compound Finance 劫持', 'Celer Network 劫持', '钱包清空器', 'Inferno 钓鱼', '域名安全', '注册商迁移', 'MFA 多因素认证', 'OAuth 账户接管', 'DNS 劫持', '加密货币钓鱼']
---

2024 年 7 月，加密项目网站面临的最危险因素并不是智能合约漏洞或私钥泄露，而是持有该域名的注册商。

当月的连续几天里，当用户在浏览器中输入熟悉的地址（也就是他们信任的借贷协议或使用过上百次的跨链桥的官方网站）时，他们如预期般进入了一个看起来毫无二致的页面，然后眼睁睁地看着自己的钱包被洗劫一空。在此次事件中，并没有发生通常意义上的黑客攻击：没有人破解密码，也没有人通过钓鱼手段窃取助记词。攻击者只是大摇大摆地从域名本身的“正门”走了进去——因为在大多数项目方甚至都没注意到的企业迁移过程中，这扇大门被敞开着。

这次迁移是从 Google Domains 到 Squarespace 的转移。这扇未上锁的大门，正是 Squarespace 的默认身份验证机制。其后果是针对加密和 DeFi 项目的一波协同 DNS 劫持攻击，用一位研究人员的话来说，这些项目控制着数十亿美元的资产。

## 注册商迁移是如何引发大规模攻击面的

人们通常不会把域名视作一个整体的“舰队”。每一个域名都像是一个独立的私有物：你的地址、你的控制面板、你的 DNS 记录。但是，注册商是批量管理这些域名的。当一个注册商的整个客户群迁移到另一个注册商时，该基础中的每个账户都会在同一时间、基于相同的迁移逻辑和相同的默认设置进行转移。这种逻辑中存在的任何弱点都不再是偶然的漏洞，而是整个“舰队”的共有属性。

正是这一点，使得 2024 年的事件成为一场*大规模*安全事件，而不是一连串倒霉的个体被黑客入侵。

在此之前，Google 宣布将关闭其注册商服务。2023 年 6 月，[Squarespace 从 Google Domains 收购了大约 1000 万个域名](https://krebsonsecurity.com/2024/07/researchers-weak-security-defaults-enabled-squarespace-domains-hijacks/#:~:text=Squarespace%20purchased%20roughly%2010%20million%20domain%20names%20from%20Google%20Domains%20in%20June%202023)。在接下来的一年里，[Squarespace 一直在为此次交易中收购的大约 1000 万个域名迁移用户](https://www.securityweek.com/hackers-exploit-flaw-in-squarespace-migration-to-hijack-domains/#:~:text=Squarespace%20has%20been%20migrating%20users%20for%20roughly%2010%20million%20domain%20names%20purchased%20in%20the%20transaction)。为了让整个过渡过程显得无缝衔接，Squarespace 为与每个迁移域名相关的用户预先创建了账户，这些账户与 Google 存档的电子邮件地址相绑定。

“无缝衔接”恰恰是问题的根源所在。如果一次迁移对用户没有任何要求，这就意味着用户不需要证明任何东西——不需要验证密码、不需要验证身份，也不需要验证对所绑定邮箱的控制权。账户已经存在，域名也已关联，而横亘在域名和捷足先登者之间的，仅仅是一个登录界面；对于这些迁移过来的账户来说，该界面几乎没有任何验证要求。

## 2024 年 7 月的域名劫持事件

![生动色彩的概念艺术插画：在一辆搬家卡车搬迁期间，大量域名房屋的钥匙散落出来，部分钥匙落入阴影中伸出的手里，一排小房子各自标有发光的网址](../../assets/the-2024-squarespace-defi-domain-hijacks-01-mass-hijack.jpg)

[攻击始于 7 月 9 日](https://www.securityweek.com/hackers-exploit-flaw-in-squarespace-migration-to-hijack-domains/#:~:text=The%20attacks%20started%20on%20July%209)，并在随后的几天内持续发酵。这些攻击动作并不隐蔽。正如 BleepingComputer 所报道的那样，[一波协同的 DNS 劫持攻击将目标对准了使用 Squarespace 注册商的去中心化金融 (DeFi) 加密货币域名，将访问者重定向至托管着钱包清空器的钓鱼网站](https://www.bleepingcomputer.com/news/security/dns-hijacks-target-crypto-platforms-registered-with-squarespace/#:~:text=A%20wave%20of%20coordinated%20DNS%20hijacking%20attacks%20targets%20decentralized%20finance%20%28DeFi%29%20cryptocurrency%20domains%20using%20the%20Squarespace%20registrar%2C%20redirecting%20visitors%20to%20phishing%20sites%20hosting%20wallet%20drainers)。

首个引爆舆论的是 DeFi 借贷领域最大的项目之一。对该事件进行调查的安全公司 Blockaid 发现，[这些网站的访问者被重定向到了旨在抽干连接钱包资金的恶意页面](https://www.blockaid.io/blog/squarespace-defi-domain-hijack-incident#:~:text=Visitors%20to%20these%20sites%20were%20being%20redirected%20to%20malicious%20pages%20designed%20to%20drain%20funds%20from%20connected%20wallets)。这些假冒网站并非粗制滥造的仿冒品。据 Blockaid 称，[这些虚假 dApp 运行着最新迭代版本的 Inferno 清空套件，旨在诱骗用户签署那些会洗劫其钱包的交易](https://www.blockaid.io/blog/squarespace-defi-domain-hijack-incident#:~:text=These%20fake%20dApps%20were%20running%20the%20latest%20iteration%20of%20the%20Inferno%20draining%20kit%2C%20designed%20to%20trick%20users%20into%20signing%20transactions%20that%20would%20empty%20their%20wallets)。

已确认的受害者名单读起来就像是对整个生态系统的一次大点名。被劫持的实体包括 [Celer Network、Compound Finance、Pendle Finance 以及 Unstoppable Domains](https://krebsonsecurity.com/2024/07/researchers-weak-security-defaults-enabled-squarespace-domains-hijacks/#:~:text=Celer%20Network%2C%20Compound%20Finance%2C%20Pendle%20Finance%2C%20and%20Unstoppable%20Domains)。对于 Compound 而言，[其主域名被接管并被展示为钓鱼页面](https://www.bleepingcomputer.com/news/security/dns-hijacks-target-crypto-platforms-registered-with-squarespace/#:~:text=its%20main%20domain%20had%20been%20taken%20over%20to%20display%20a%20phishing%20page)。Celer 及时发现了这次企图，并[迅速恢复了其 DNS 记录](https://www.bleepingcomputer.com/news/security/dns-hijacks-target-crypto-platforms-registered-with-squarespace/#:~:text=swiftly%20recovered%20its%20DNS%20records)；Pendle [经历了类似的问题](https://www.bleepingcomputer.com/news/security/dns-hijacks-target-crypto-platforms-registered-with-squarespace/#:~:text=experienced%20similar%20issues)，并立即警告其用户撤销钱包授权。

## 面临的风险与用户的损失

域名劫持的残酷之处在于，它击溃了用户被反复教导应依赖的所有安全习惯。检查 URL、确保它是真实的网站、寻找安全锁图标……所有这些建议的前提都是：域名仍然指向它应该指向的地方。而当攻击者控制了域名的 DNS 时，URL *确实* 是真实的（它就是该项目的官方地址），但它却解析到了攻击者的服务器上。挂锁图标是绿色的，地址栏是正确的，但整个页面却是一个陷阱。

这就是为什么像 Inferno 这样的钱包清空套件与 DNS 劫持如此“珠联璧合”的原因。清空器不需要窃取密码；它只需要受害者*连接钱包并签名*。对于一个访问了借贷协议真实域名的用户来说，在批准交易前，他们没有理由产生疑虑。钓鱼网站完全继承了合法域名花费数年时间建立起来的信任。

情况究竟有多糟？能体现事件规模的，并非已确认被盗金额的数字，而是*暴露*在风险中的项目数量。据 Decrypt 报道，Blockaid 的分析非常直白：[大约有 228 个 DeFi 协议的前端仍处于风险之中](https://decrypt.co/239524/220-defi-protocols-risk-squarespace-dns-hijack#:~:text=roughly%20228%20DeFi%20protocol%20front%20ends%20are%20still%20at%20risk)，因为它们背后都存在着同样的迁移账户弱点。已发生的劫持事件只是冰山一角。真正的攻击面覆盖了所有经历了从 Google 到 Squarespace 迁移过程的加密团队。

## 攻击是如何发生的：迁移过程中的身份验证缺陷

![生动色彩的概念艺术插画：新大楼外的一长排邮箱，每个邮箱门都敞开未锁，在真正的主人到来之前，一个没有脸的人影正悄悄地把信件塞进其中一个邮箱，冷暖光线形成鲜明对比](../../assets/the-2024-squarespace-defi-domain-hijacks-02-migration-flaw.jpg)

一旦研究人员复盘了这一机制，你会发现它简单得令人尴尬——而这恰恰是其在大规模范围内极具危险性的原因。

这始于两个设计上的选择。首先，Squarespace 没有验证登录的人是否真的控制了账户绑定的电子邮件。正如研究人员所指出的，[Squarespace 不要求对使用密码创建的新账户进行电子邮件验证](https://socket.dev/blog/squarespace-domain-hijacks-enabled-by-email-address-exploit-on-migrated-accounts#:~:text=Squarespace%20doesn%27t%20require%20email%20verification%20for%20new%20accounts%20created%20with%20a%20password)。其次，迁移过来的账户虽然已经预先创建，但尚未被认领——它们没有设置密码。因此，当有人输入正确的电子邮件时，[由于账户上没有密码，系统会直接引导他们进入“为新账户创建密码”的流程](https://krebsonsecurity.com/2024/07/researchers-weak-security-defaults-enabled-squarespace-domains-hijacks/#:~:text=since%20there%27s%20no%20password%20on%20the%20account%2C%20it%20just%20shoots%20them%20to%20the)。

将这两点结合起来，攻击便自然而然地发生了。与迁移域名绑定的电子邮件地址并不是什么秘密——管理员和注册人的联系方式通常是公开的或容易猜到的。攻击者只需在真正的所有者登录之前，使用已知被迁移的电子邮件抢先注册账户，就可以直接带走域名的控制权。MetaMask 的首席产品经理 Taylor Monahan 是剖析此次事件的研究人员之一，她精准地描述了这一盲区：[Squarespace 从未考虑到这样一种可能性：在合法的电子邮件持有者自己创建账户之前，威胁行为者可能会使用与最近迁移的域名相关的电子邮件来注册账户](https://krebsonsecurity.com/2024/07/researchers-weak-security-defaults-enabled-squarespace-domains-hijacks/#:~:text=Squarespace%20never%20accounted%20for%20the%20possibility%20that%20a%20threat%20actor%20might%20sign%20up%20for%20an%20account%20using%20an%20email%20associated%20with%20a%20recently%2Dmigrated%20domain%20before%20the%20legitimate%20email%20holder%20created%20the%20account%20themselves)。

为什么会存在这种预绑定机制呢？为了方便。研究人员得出结论：[Squarespace 假设所有从 Google Domains 迁移过来的用户都会选择社交登录选项](https://krebsonsecurity.com/2024/07/researchers-weak-security-defaults-enabled-squarespace-domains-hijacks/#:~:text=Squarespace%20assumed%20all%20users%20migrating%20from%20Google%20Domains%20would%20select%20the%20social%20login%20options)（即 Google OAuth），而不是选择“电子邮件+密码”的方式。该系统[将所有电子邮件预先链接到相应的域名，无论账户是否已经存在；这可能是因为他们希望用户能够使用 Google OAuth 登录并立即访问其所有域名](https://www.theregister.com/2024/07/15/squarespace_fingered_for_dns_hijackings/#:~:text=pre%2Dlinking%20all%20emails%20to%20domains%2C%20regardless%20of%20whether%20the%20account%20already%20exists%2C%20likely%20because%20they%20wanted%20users%20to%20be%20able%20to%20OAuth%20with%20Google%20and%20immediately%20have%20access%20to%20all%20their%20domains)，正如研究人员向 The Register 解释的那样。然而，通过电子邮件和密码登录的途径从未被关闭，而且在这条途径上，没有任何环节能证明用户对邮箱的控制权。

还有一个推波助澜的因素。在迁移期间，本应能防范这种攻击的安全保护措施被关闭了：[作为向 Squarespace 过渡的一部分，账户上的多因素身份验证（MFA）被关闭了](https://www.bleepingcomputer.com/news/security/dns-hijacks-target-crypto-platforms-registered-with-squarespace/#:~:text=as%20part%20of%20the%20transition%20to%20Squarespace%2C%20multi%2Dfactor%20authentication%20was%20turned%20off%20on%20accounts)。即使是一位在 Google Domains 上谨慎启用了 MFA 的域名所有者，在迁移到 Squarespace 时，该 MFA 也被剥离了。没有需要破解的密码，没有需要绕过的双因素验证，没有需要拦截的电子邮件——对于一个已迁移且未认领的账户来说，拥有一把能够猜出的电子邮件地址，就拥有了通过身份验证的全部筹码。

## 响应与缓解措施

加密安全社区的反应速度超过了注册商。包括 [Samczsun、Taylor Monahan 和 Andrew Mohawk](https://www.bleepingcomputer.com/news/security/dns-hijacks-target-crypto-platforms-registered-with-squarespace/#:~:text=Samczsun%2C%20Taylor%20Monahan%2C%20and%20Andrew%20Mohawk) 在内的研究人员公布了该机制，Blockaid 则在社区分发了仍存在漏洞的前端列表，以便项目方可以检查自己是否暴露在风险之中。受影响的项目方争分夺秒地抢回账户、重置 DNS 记录，并警告用户撤销授予恶意网站的代币授权。

针对所有仍在使用迁移账户的用户，当务之急的补救建议都是相同的：在攻击者下手之前登录并认领账户，设置一个高强度的独立密码，并且——最重要的是——重新启用在迁移过程中被静默移除的多因素认证（MFA）。就 Squarespace 而言，他们也采取了行动，锁定了已迁移账户并修改了账户创建流程。然而，这次事件留下的结构性教训将比补丁更具长远意义：如果在迁移期间，供应商关闭了一项安全控制措施，那么在整个迁移期间，这项控制措施就等于形同虚设。

## 注册商安全与 MFA 带来的启示

Squarespace 域名劫持事件并不只是一家公司配置错误的事故。它揭示了域名控制权的真实归属，以及区块链之上那层架构依然是多么的脆弱。

以下几点教训不仅适用于 2024 年 7 月，更具有广泛的借鉴意义：

1. **注册商账户才是真正的信任根基——而不是智能合约。** 所有受影响的协议都没有合约漏洞。它们的链上代码运行良好。攻击者夺取的是*域名*，而域名正是用户输入、信任并连接钱包的地方。即使一个项目在链上完美无缺，如果其 DNS 控制平面脆弱不堪，依然会把用户拱手送给攻击者。

2. **只有在迁移后依然存活的 MFA，才算是真正的保护。** 此处令人痛心的细节在于，MFA 并没有在攻击下失效——而是为了迁移的便利，在攻击发生前被*移除*了。应该把 MFA 状态视为每次账户移动、转移或更换供应商后都需要重新验证的重要事项，而不是设置一次就可以抛之脑后的东西。

3. **“无缝衔接”是安全的一种折衷。** 迁移过程中为了方便用户而跳过的每一个步骤，都意味着缺失了一次身份验证。预创建的账户、自动关联的电子邮件以及无需验证的登录，都是用户感受不到的阻力——而这种阻力，往往正是将攻击者拒之门外的关键壁垒。

4. **易被猜到的标识符其实就是伪装的凭据。** 解锁这些域名的“秘密”只是一个根本不是秘密的电子邮件地址。对于任何只要知道公开标识符就能获得控制权的系统，只需要一次简单的身份冒充便能将其攻破。

5. **注册商受到攻击时的破坏半径等于其整个客户群。** 如果注册商的默认行为存在漏洞，单个域名的安全措施就毫无意义，因为默认设置同时作用于所有人。你的域名托管在何处，以及该托管方如何处理身份验证，这与你在链上做出的任何决定一样，都具有同等重要的安全影响力。

## Namefi 视角

![可验证、防篡改域名所有权的色彩丰富的插图——由绿色盾牌保护的域名卡、绿色的 Namefi 代币以及 DNS 连续性](../../assets/the-2024-squarespace-defi-domain-hijacks-03-namefi-angle.jpg)

2024 年的劫持事件就发生在“谁真正拥有这个域名”和“谁能登录控制该域名的账户”之间的夹缝中。在传统模式中，这两者之间的联系非常松散：所有权只是注册商数据库中的一条记录，而访问权限则由注册商当时的身份验证机制把控——比如在一场涉及 1000 万域名的迁移过程中，这扇大门曾短暂地完全敞开着。

[Namefi](https://namefi.io) 的诞生正是为了填补这一鸿沟。通过将域名所有权转化为一种与 DNS 兼容的代币化链上资产，域名的控制权变成了一种可以被*密码学验证*的东西，而不是依赖于一个容易猜到的邮箱或供应商的默认登录设置。所有权存在于你所控制的钱包中，转移过程可被审计，而“谁被允许更改该域名的记录”这个问题，也有了一个防篡改的答案，而不是依赖客服来解决。

这并不会让 Squarespace 的迁移变得完美无瑕，但它改变了故障模式。攻击者即使利用已知邮箱注册了账户，也不会因此拥有代币化域名的所有权——所有权绝不仅仅是一个半初始化的账户能够悄悄认领的数据行。域名控制平面的防伪难度，应该与其所守护的资产相当。在 2024 年 7 月，对于数百个加密项目而言，情况却并非如此。而这个安全鸿沟，正是值得我们通过技术手段去彻底消除的。

## 来源与延伸阅读

- Krebs on Security — [研究人员：薄弱的默认安全设置导致 Squarespace 域名被劫持](https://krebsonsecurity.com/2024/07/researchers-weak-security-defaults-enabled-squarespace-domains-hijacks/)
- BleepingComputer — [在 Squarespace 注册的加密平台遭遇 DNS 劫持攻击](https://www.bleepingcomputer.com/news/security/dns-hijacks-target-crypto-platforms-registered-with-squarespace/)
- Blockaid — [Squarespace 域名劫持事件：攻击报告](https://www.blockaid.io/blog/squarespace-defi-domain-hijack-incident)
- SecurityWeek — [黑客利用 Squarespace 迁移漏洞劫持域名](https://www.securityweek.com/hackers-exploit-flaw-in-squarespace-migration-to-hijack-domains/)
- Decrypt — [超过 220 个 DeFi 协议仍处于 Squarespace DNS 劫持“风险”之中](https://decrypt.co/239524/220-defi-protocols-risk-squarespace-dns-hijack)
- The Register — [信息安全专家称 Squarespace 迁移与 Web3 公司的 DNS 劫持有关](https://www.theregister.com/2024/07/15/squarespace_fingered_for_dns_hijackings/)
- Socket — [迁移账户电子邮件地址漏洞导致 Squarespace 域名被劫持](https://socket.dev/blog/squarespace-domain-hijacks-enabled-by-email-address-exploit-on-migrated-accounts)
- SiliconANGLE — [由于 Google Domains 迁移缺陷，Squarespace 上多个加密域名被劫持](https://siliconangle.com/2024/07/15/multiple-crypto-domains-hijacked-squarespace-due-google-domains-migration-flaw/)
- Cybernews — [Squarespace 加密域名遭受 DNS 攻击，原因在于缺乏 MFA](https://cybernews.com/security/squarespace-dns-hijack-attack-crypto-domains-mfa/)
- Hackread — [DeFi 黑客警报：Squarespace 域名极易遭受 DNS 劫持](https://hackread.com/defi-hack-alert-squarespace-domains-dns-hijacking/)
- CircleID — [安全疏漏导致 Squarespace 域名劫持事件](https://circleid.com/posts/20240716-security-lapses-lead-to-squarespace-domain-hijacks)