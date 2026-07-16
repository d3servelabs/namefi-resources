---
title: '域名倒卖与法律：商标、UDRP 与诈骗防范'
date: '2026-06-21'
language: zh-CN
tags: ['domains', 'security', 'domain-flipping', 'explainer']
authors: ['fenwei-bian']
editors: ['victor-zhou']
draft: false
cluster: domain-security
series: domain-flipping-skills
seriesOrder: 16
format: explainer
description: '每位域名投资者必备的法律知识：商标基础、UDRP 与 ACPA、交割时的托管机制、防劫持策略，以及如何识别并规避销售诈骗。'
ogImage: ../../assets/domain-flipping-and-the-law-og.jpg
keywords: ['域名倒卖法律', '域名倒卖合法吗', '网络抢注', 'UDRP', 'ACPA', '域名商标法', '域名争议', '反向域名劫持', '域名倒卖诈骗', '域名托管', '域名劫持', '恶意域名注册', '域名投资法律', '域名名称争议', '如何合法倒卖域名']
relatedArticles:
  - /zh-CN/blog/domain-flipping/
  - /zh-CN/blog/cybersquatting-vs-domaining-udrp-acpa/
  - /zh-CN/blog/avoiding-domain-sale-scams/
  - /zh-CN/blog/how-to-sell-domains-for-profit/
  - /zh-CN/blog/how-to-sell-a-domain-name-you-own/
relatedTopics:
  - /zh-CN/topics/domain-security/
  - /zh-CN/topics/domain-investing/
relatedSeries:
  - /zh-CN/series/domain-flipping-skills/
  - /zh-CN/series/domain-investor-field-guide/
relatedGlossary:
  - /zh-CN/glossary/registrar/
  - /zh-CN/glossary/icann/
  - /zh-CN/glossary/tld/
  - /zh-CN/glossary/dns/
  - /zh-CN/glossary/registry/
---

域名倒卖是合法的。但倒卖错误的域名，轻则失去名称本身和购买成本，重则面临一笔五位数的判决。两种结局之间的差距不在于运气，而在于一套下午就能掌握的法律知识，以及几个让你的投资组合保持干净、交易不被中途劫走的操作习惯。

这是我们[域名倒卖](/zh-CN/blog/domain-flipping/)系列的法律与安全篇。本文涵盖[域名投资](/zh-CN/glossary/domaining/)与[网络抢注](/zh-CN/glossary/cybersquatting/)之间的界限、执行该界限的两套争议机制、如何在不被诈骗的情况下完成交易，以及如何防止他人偷走你名下的域名。这里没有法律建议（结尾有免责声明），但都是有经验的域名投资者在每笔交易中都会考量的实战知识。

## 唯一不能踩的红线：商标

![示意图：左侧是贴有绿色勾号的通用域名标签，右侧是被红色禁止标志拦截的品牌域名，中间有一条分隔线](../../assets/domain-flipping-and-the-law-01-trademark-line.jpg)

所有法律问题归结为一个核心区分。注册通用词、描述性词汇或创造性词汇以便转售，这是普通的投资行为。注册某个*特定公司品牌*的名称，则是网络抢注——这是把合法倒卖变成败局的唯一动作。

维基百科给出了标准定义：网络抢注是指[以恶意牟利为目的，注册、流通或使用与他人商标商誉相关的互联网域名的行为](https://en.wikipedia.org/wiki/Cybersquatting#:~:text=is%20the%20practice%20of%20registering%2C%20trafficking%20in%2C%20or%20using%20an%20Internet%20domain%20name%2C%20with%20a%20bad%20faith%20intent%20to%20profit)。这句话里两个词起到关键作用：*[恶意](/zh-CN/glossary/bad-faith/)*与*[商标](/zh-CN/glossary/trademark/)*。像 `loans` 这样的普通词汇，或像 `Zapio` 这样的创造性名称，并不属于任何人。而 `nikeshoes-store.com` 显然是在借用一个已有商标。名称与现有品牌越相近，就越像是专门注册来向该品牌索取利益，而这种意图正是法律所惩处的对象。我们在[网络抢注与域名投资：UDRP 与 ACPA](/zh-CN/blog/cybersquatting-vs-domaining-udrp-acpa/)一文中划定了完整边界。

购买前的实用过滤标准：一个理性的人看到这个名称，会认为它*本来就是指向某家特定公司*的吗？如果答案是肯定的，无论价格多低都要放弃。什么样的名称值得持有，请参考[如何评估域名价值](/zh-CN/blog/how-to-value-a-domain-name/)和[什么是域名](/zh-CN/blog/what-is-domain/)；而通不过商标测试的名称具有负价值——持有它本身就是一种负担。

## UDRP：商标持有人如何夺回域名

最快速、成本最低的执法途径是统一域名争议解决政策。它是 [ICANN](/zh-CN/glossary/icann/) 规则的组成部分，在你注册任何域名时接受的注册协议中就已内嵌，因此你从一开始就受其约束。ICANN 于 1999 年通过了 [UDRP (统一域名争议解决政策)](/zh-CN/glossary/udrp/)，争议由认证机构裁决——其中最具影响力的是[世界知识产权组织（WIPO）](https://en.wikipedia.org/wiki/Uniform_Domain-Name_Dispute-Resolution_Policy#:~:text=World%20Intellectual%20Property%20Organization)。

投诉方必须同时证明三点，一个都不能少。正如维基百科对该政策的概括，域名须[与投诉方享有权利的商标或服务商标相同或混淆性相似](https://en.wikipedia.org/wiki/Uniform_Domain-Name_Dispute-Resolution_Policy#:~:text=identical%20or%20confusingly%20similar%20to%20a%20trademark%20or%20service%20mark)；[注册人](/zh-CN/glossary/registrant/)对该域名[不享有任何权利或合法利益](https://en.wikipedia.org/wiki/Uniform_Domain-Name_Dispute-Resolution_Policy#:~:text=does%20not%20have%20any%20rights%20or%20legitimate%20interests)；且该域名[在注册时及使用中均存在"恶意"](https://en.wikipedia.org/wiki/Uniform_Domain-Name_Dispute-Resolution_Policy#:~:text=has%20been%20registered%20and%20the%20domain%20name%20is%20being%20used)。三者缺一，投诉即告失败。

UDRP 的处置范围有限，但结果绝对。唯一的救济措施是域名的[注销或转移](https://en.wikipedia.org/wiki/Uniform_Domain-Name_Dispute-Resolution_Policy#:~:text=cancellation%20or%20transfer)，不涉及赔偿金，但你会彻底失去这项资产，而且裁决只需数周，远快于诉讼的数月周期。这套机制运转十分繁忙：WIPO 报告显示，2024 年[来自 133 个国家的商标持有人依据统一域名争议解决政策（UDRP）及各国国家代码顶级域名变体提起了 6,168 宗案件](https://www.wipo.int/pressroom/en/articles/2025/article_0003.html#:~:text=trademark%20owners%20from%20133%20countries%20filed%206%2C168%20cases%20under%20the%20Uniform%20Domain%20Name%20Dispute%20Resolution%20Policy)。对域名投资者来说，结论很简单：UDRP 是品牌方的第一把廉价快剑，任何有可能被它瞄准的名称都不应出现在你的投资组合里。

## ACPA：当争议升级为诉讼与赔偿

UDRP 只能移交域名。美国法律走得更远。《反网络抢注消费者保护法》于 [1999 年](https://en.wikipedia.org/wiki/Anticybersquatting_Consumer_Protection_Act#:~:text=a%20U.S.%20law%20enacted%20in%201999)颁布，允许商标持有人向联邦法院提起诉讼，不仅索回域名，还可主张损害赔偿。

[ACPA](/zh-CN/glossary/acpa/) 的核心在于注册人是否[具有从该商标中牟利的恶意](https://en.wikipedia.org/wiki/Anticybersquatting_Consumer_Protection_Act#:~:text=Has%20a%20bad%20faith%20intent%20to%20profit%20from%20the%20mark)，法院会权衡一系列因素来认定。其中多项因素直接针对域名投资者：法院会审视注册人是否存在[将客户从商标持有人在线渠道引走的意图](https://en.wikipedia.org/wiki/Anticybersquatting_Consumer_Protection_Act#:~:text=intent%20to%20divert%20customers%20from%20the%20mark%20owner%27s%20online%20location)，以及是否存在[在没有合法用途的情况下向商标持有人或第三方提出转让、出售或以其他方式转让域名以换取经济利益](https://en.wikipedia.org/wiki/Anticybersquatting_Consumer_Protection_Act#:~:text=offer%20to%20transfer%2C%20sell%2C%20or%20otherwise%20assign%20the%20domain%20name)的行为。请仔细读这句话：向品牌方发送邮件，提出以某个价格出售"他们的"名称，这一行为本身就构成恶意的证据。这正是不懂行的投资者踩进的陷阱。

真正让人肉痛的是赔偿数字。根据法律规定，原告可以选择[每个域名不低于 1,000 美元、不高于 100,000 美元的法定赔偿额，具体金额由法院酌情决定](https://www.law.cornell.edu/uscode/text/15/1117#:~:text=not%20less%20than%20%241%2C000%20and%20not%20more%20than%20%24100%2C000%20per%20domain%20name)。注册几个与品牌相关的名称，风险敞口就会迅速叠加。这一切与构成健康投资组合的通用词和品牌型域名毫无关系，只要从不购买依附他人商标的名称，就可以完全规避。

## 投资者的防御武器：反向域名劫持

法律是双刃剑，而这一点是大多数新手不知道的。有时候，真正在恶意行事的恰恰是*商标持有人*，他们试图逼迫合法注册人交出自己没有真实权利主张的域名。这种行为有专门的法律名称。反向域名劫持是指[合法商标持有人通过提出网络抢注指控，试图从域名的"网络抢注者"所有人手中夺取域名的行为](https://en.wikipedia.org/wiki/Reverse_domain_name_hijacking#:~:text=occurs%20where%20a%20rightful%20trademark%20owner%20attempts%20to%20secure%20a%20domain%20name)。UDRP 规则将其定义为[以恶意提起投诉，导致 UDRP 行政程序被滥用](https://en.wikipedia.org/wiki/Reverse_domain_name_hijacking#:~:text=the%20filing%20of%20a%20complaint%20in%20bad%20faith%2C%20resulting%20in%20the%20abuse)。

如果你在某家公司将某个词采纳为品牌之前就注册了这个通用词，你就享有合法权益，专家组可以认定投诉方的请求不成立。这正是有时间戳、有据可查的收购记录如此重要的原因。你的故事越清晰——通用名称、出于明显不侵权目的注册、从未以任何方式针对任何人——你的防御就越有力，专家组也越有可能将欺凌行为公之于众。保留好你的 [WHOIS（与 RDAP）](/zh-CN/glossary/whois/)记录和购买凭证，它们就是你的证据。

## 安全完成交易，远离诈骗

![示意图：买方手持货币，卖方手持域名标签，双方均通过中立的托管保险箱完成交割，资金与域名同步释放](../../assets/domain-flipping-and-the-law-02-escrow.jpg)

商标风险是法律层面的隐患，而交易本身则是操作层面的隐患。域名销售是经典的信任僵局：卖方不肯在收款前转移域名，买方不肯在收到域名前付款。先动的一方就暴露在风险中，而骗子正是在这个缺口里生存的。

标准解决方案是[托管](/zh-CN/glossary/escrow/)——一个中立第三方，根据其通用定义，[接收并在约定条件下向主要交易方分配资金或财产](https://en.wikipedia.org/wiki/Escrow#:~:text=receives%20and%20disburses%20money%20or%20property%20for%20the%20primary%20transacting%20parties)。买方向托管机构打款，卖方转移域名，托管机构确认交接完成后释放款项。双方都不需要信任对方，只需信任托管机构。我们在[域名托管详解](/zh-CN/blog/domain-escrow-explained/)和托管词条中对整个机制有详细说明。

有几种诈骗模式频繁出现，值得牢记于心，更多案例在[如何避免域名销售诈骗](/zh-CN/blog/avoiding-domain-sale-scams/)中有专门梳理：

- **伪造托管平台。** "买方"坚持使用某个你从未听说过的托管服务，其 URL 故意仿造真实平台。该网站是对方的；你的域名和任何费用都会消失。只使用你自己独立核实过的托管服务。
- **退款与撤单欺诈。** 买方用可撤销的方式付款，你转移域名后，对方发起退款。信誉良好的托管机构和不可逆的结算方式，正是为了消除这一风险而存在的。
- **超额支付诈骗。** "买方"多付了钱并要求退还差额；原始付款随后被撤回。

贯穿其中的一条准则：永远不要凭一句承诺就交出域名的控制权。关于卖家的完整操作手册，参见[如何出售你拥有的域名](/zh-CN/blog/how-to-sell-a-domain-name-you-own/)和[域名交易](/zh-CN/glossary/domain-trading/)概述。

## 保护投资组合不被盗走

![示意图：域名标签受到挂锁和盾牌的保护，一把信封形状的钥匙悬在旁边，一枚红色网络钓鱼钩被拦截在外](../../assets/domain-flipping-and-the-law-03-hijack-defense.jpg)

最后一种威胁根本不需要你的配合。[域名劫持](/zh-CN/glossary/domain-hijacking/)是指[未经原注册人许可擅自变更域名注册信息的行为](https://en.wikipedia.org/wiki/Domain_hijacking#:~:text=is%20the%20act%20of%20changing%20the%20registration%20of%20a%20domain%20name%20without%20the%20permission)。对域名投资者来说，你的投资组合*就是*你的银行账户，一个被劫持的溢价域名可能在你察觉之前就已被转售给了不知情的第三方。

劫持者很少破解密码学。他们攻击的是人与电子邮件。维基百科总结的常见路径是：[未经授权访问或利用域名注册商系统中的漏洞，通过社会工程手段实施攻击](https://en.wikipedia.org/wiki/Domain_hijacking#:~:text=unauthorized%20access%20to%2C%20or%20exploiting%20a%20vulnerability%20in%20the%20domain%20name%20registrar%27s%20system%2C%20through%20social%20engineering)，或直接[入侵与域名注册绑定的域名所有人邮箱账户](https://en.wikipedia.org/wiki/Domain_hijacking#:~:text=getting%20into%20the%20domain%20owner%27s%20email%20account)。只要控制了备案的邮箱，窃贼就能重置注册商密码并批准转移。[域名劫持实际上是如何发生的](/zh-CN/blog/how-domain-hijacking-actually-happens/)一文追溯了完整的攻击链条。

防御措施成本极低，值得在你使用的每一家[注册商](/zh-CN/glossary/registrar/)上都养成习惯：

- **锁定你的域名。** `clientTransferProhibited` 状态会告知[注册局](/zh-CN/glossary/registry/)[拒绝域名转移请求](https://en.wikipedia.org/wiki/Extensible_Provisioning_Protocol#:~:text=reject%20requests%20to%20transfer%20the%20domain)，旨在[帮助防止因劫持和/或欺诈导致的未授权转移](https://en.wikipedia.org/wiki/Extensible_Provisioning_Protocol#:~:text=help%20prevent%20unauthorized%20transfers%20resulting%20from%20hijacking%20and%2For%20fraud)。任何非主动转移中的域名都应保持该状态。
- **保管好[授权码（EPP 码 / 转移码）](/zh-CN/glossary/auth-code/)。** 合法的[跨注册商转移](/zh-CN/glossary/cross-registrar-transfer/)需要从当前注册商获取授权码——这是[注册商之间转移所需的机密凭证](https://en.wikipedia.org/wiki/Extensible_Provisioning_Protocol#:~:text=is%20a%20secret%20required%20in%20the%20transfer%20between%20registrars)。像对待密码一样对待它；永远不要将其粘贴到陌生人的"转移表单"中。
- **加固备案邮箱。** 为与注册商绑定的邮箱账户开启双因素验证，因为那个收件箱是你整个[域名所有权](/zh-CN/glossary/domain-ownership/)记录的主密钥。

## 代币化所有权如何改变风险格局

上述大多数风险点有一个共同的根源：传统域名的所有权不过是注册商数据库中的一行记录，只能通过该注册商的账户和邮箱找回机制加以证明，转移也只能通过多步骤流程完成，而每一个交接环节都是被诈骗或劫持的机会。这正是攻击者和骗子赖以生存的攻击面。

将真实 ICANN 域名代币化可以大幅压缩这个攻击面。当控制权在[链上 (On-chain)](/zh-CN/glossary/on-chain/)呈现时，所有权可审计而非靠信任，转移可原子完成而非拉伸成一个随时可能被干预的时间窗口——同时保持 DNS 连续性，域名在交接过程中始终正常解析。代币化并不废除商标法（侵权域名在任何基础设施上都是坏主意），但它直接攻克了托管信任缺口和电子邮件劫持这两个核心问题。这就是 [Namefi](https://namefi.io) 立志填补的空白，我们在[代币化市场如何取代托管](/zh-CN/blog/how-tokenized-marketplaces-replace-escrow/)中作了深入阐述。

## 简明总结

购买通用词、描述性词汇和创造性词汇；绝不购买依附他人品牌的名称。要知道 [UDRP](/zh-CN/blog/what-is-udrp/) 能迅速夺走域名，而 ACPA 还能在此基础上追加赔偿。保留清晰记录，以便在必要时——包括面对反向劫持时——捍卫合法名称。每笔销售都通过你自己选定的托管机构完成，同时锁定投资组合，让任何人都无机可乘。做到这些，法律就是保护你业务的护栏，而不是随时可能弹起的陷阱。

## 友情免责声明（请务必阅读！）

> 我们不是律师、会计师、理财顾问或医生，**本文中的任何内容均不构成法律、财务、税务、会计、医疗或任何其他形式的专业建议。** 我们撰写这些文章，是为了自我学习，也为我们的用户提供参考。这里的信息可能已经过时、具有地域局限性，或者本身就有错误。我们也会犯错。
>
> 涉及重要决策时，**请务必咨询真正的专业人士（认真的！）**。或者，如果那不是你的风格，可以问朋友、问 Twitter、问 Reddit、问 AI，或者问一位占卜师。总之：**DOYR——自己做研究**。让我们一起学习，享受其中的乐趣。

## 来源与延伸阅读

- Wikipedia — [网络抢注（定义；以恶意从商标中牟利）](https://en.wikipedia.org/wiki/Cybersquatting#:~:text=is%20the%20practice%20of%20registering%2C%20trafficking%20in%2C%20or%20using%20an%20Internet%20domain%20name%2C%20with%20a%20bad%20faith%20intent%20to%20profit)
- Wikipedia — [统一域名争议解决政策（三要素；注销或转移救济；WIPO）](https://en.wikipedia.org/wiki/Uniform_Domain-Name_Dispute-Resolution_Policy#:~:text=identical%20or%20confusingly%20similar%20to%20a%20trademark%20or%20service%20mark)
- WIPO — [2024 年网络抢注案件创历史新高（6,168 宗 UDRP 案件，涉及 133 个国家）](https://www.wipo.int/pressroom/en/articles/2025/article_0003.html#:~:text=trademark%20owners%20from%20133%20countries%20filed%206%2C168%20cases%20under%20the%20Uniform%20Domain%20Name%20Dispute%20Resolution%20Policy)
- Wikipedia — [反网络抢注消费者保护法（1999 年颁布；恶意认定因素）](https://en.wikipedia.org/wiki/Anticybersquatting_Consumer_Protection_Act#:~:text=a%20U.S.%20law%20enacted%20in%201999)
- Cornell Law / 美国法典 — [15 U.S.C. § 1117(d)（每个域名 1,000 至 100,000 美元法定赔偿额）](https://www.law.cornell.edu/uscode/text/15/1117#:~:text=not%20less%20than%20%241%2C000%20and%20not%20more%20than%20%24100%2C000%20per%20domain%20name)
- Wikipedia — [反向域名劫持（恶意投诉；滥用 UDRP 程序）](https://en.wikipedia.org/wiki/Reverse_domain_name_hijacking#:~:text=occurs%20where%20a%20rightful%20trademark%20owner%20attempts%20to%20secure%20a%20domain%20name)
- Wikipedia — [托管（中立第三方在约定条件下持有并分配资产）](https://en.wikipedia.org/wiki/Escrow#:~:text=receives%20and%20disburses%20money%20or%20property%20for%20the%20primary%20transacting%20parties)
- Wikipedia — [域名劫持（定义；社会工程与邮箱账户攻击路径）](https://en.wikipedia.org/wiki/Domain_hijacking#:~:text=is%20the%20act%20of%20changing%20the%20registration%20of%20a%20domain%20name%20without%20the%20permission)
- Wikipedia — [可扩展供应协议（clientTransferProhibited；授权码作为转移机密）](https://en.wikipedia.org/wiki/Extensible_Provisioning_Protocol#:~:text=reject%20requests%20to%20transfer%20the%20domain)
