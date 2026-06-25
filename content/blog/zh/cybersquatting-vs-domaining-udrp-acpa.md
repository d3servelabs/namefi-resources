---
title: "网络抢注 vs 合法域名投资：UDRP 与 ACPA 详解"
date: '2026-06-21'
language: zh
tags: ['domains', 'security', 'domain-flipping', 'explainer']
authors: ['namefiteam']
draft: false
cluster: domain-security
series: domain-flipping-skills
seriesOrder: 17
format: explainer
description: "合法域名投资与网络抢注的界限在哪里：详解 UDRP 三要素测试、ACPA 法案、反向域名劫持以及如何规避风险。"
ogImage: ../../assets/cybersquatting-vs-domaining-udrp-acpa-og.jpg
keywords: ['网络抢注', '网络抢注 vs 域名投资', 'udrp', 'udrp 三要素测试', 'acpa', '反网络抢注消费者保护法', '反向域名劫持', 'rdnh', '恶意域名注册', '域名倒卖合法吗', '商标域名争议', '域名争议解决', '合法域名投资', 'wipo udrp', '域名投资法律']
---

两个人注册域名用于转售。一个人购买了 `solarpanels.com`，这是一个业内任何人都可能想要的普通词典短语。另一个人购买了 `nike-running-shoes.net`，这个字符串的存在仅仅是因为 Nike 公司的存在。表面上看是相同的行为，法律地位却截然不同。前者是普通的[域名投资](/zh/glossary/domaining/)，后者则是[网络抢注](/zh/glossary/cybersquatting/)（cybersquatting），并且有两个完善的体系专门用于从注册人手中收回这类域名。

这个差异是域名行业中最重要的一条界线，也是最容易被无意中跨越的界线。本指南将沿着这条边界展开：网络[抢注](/zh/glossary/backorder/)的真正含义、UDRP 用来收回域名的三要素关联性测试、美国 [ACPA](/zh/glossary/acpa/) 法案如何增加金钱赔偿，以及大多数文章忽略的另一面——[反向域名劫持](/zh/glossary/reverse-domain-hijacking/)（品牌方滥用系统来对付合法域名持有人）。本文是我们关于[域名倒卖与法律](/zh/blog/domain-flipping-and-the-law/)的核心文章以及[域名倒卖](/zh/blog/domain-flipping/)系列中心的法律风险补充篇。

> **非法律建议。** 本文仅为域名持有人提供一般信息，不构成法律建议。案件结果取决于具体事实。如果您收到投诉或考虑提起投诉，请咨询合格的律师。

## 网络抢注的真正含义

网络抢注并非“注册一个别人想要的域名”。它是指为了利用他人商标而注册一个域名。维基百科的定义最值得我们内化：[指以恶意牟利为目的，注册、贩卖或使用包含他人商标的互联网域名的行为](https://en.wikipedia.org/wiki/Cybersquatting#:~:text=is%20the%20practice%20of%20registering%2C%20trafficking%20in%2C%20or%20using%20an%20Internet%20domain%20name%2C%20with%20a%20bad%20faith%20intent%20to%20profit)。这句话中的每个词都至关重要。其行为（注册、贩卖、使用）范围广泛。其意图（恶意、牟利）是触发点。其目标是特定的：*属于他人的商标*，而不是整个市场共享的通用词。

合法的域名投资则处于该意图界线的另一边。购买通用、描述性或自创的名称并将其转售，是一项历史悠久的贸易。像 `solarpanels.com` 这样的[域名](/zh/glossary/domain-ownership/)之所以有价值，是因为这些词对整个行业都有价值，而不是因为它依附于某家公司的声誉。对于可用于品牌的自创词以及不附带任何商标的短[.com](/zh/tld/com/)或[.io](/zh/tld/io/)域名也是如此。资产就是字符串本身，这就是合法的[域名交易](/zh/glossary/domain-trading/)实践的全部内容。

当一个域名的价值*来自*某个品牌而不是词语本身时，问题就开始了。注册 `tesla` 加上一个连字符后缀，故意拼错一个著名商标（即域名抢注的一种，typosquatting），或在新产品发布后立即在新的[顶级域名（TLD）](/zh/glossary/tld/)中注册品牌名称，你试图获取的价值正是别人的商誉。这恰恰是以下两个执法体系旨在打击的行为。

## UDRP 的三要素关联性测试

![社论风格插图，展示三个并排的挂锁，每个都已勾选，由一条链子连接，释放出一个域名标签](../../assets/cybersquatting-vs-domaining-udrp-acpa-01-three-locks.jpg)

第一个也是最常见的体系是 [UDRP](/zh/glossary/udrp/)，即《统一域名争议解决政策》。每家经过认证的[注册商](/zh/glossary/registrar/)都会在你注册域名时让你同意该政策，这就是为什么一个私人仲裁小组（而非法院）可以下令将你的域名转移走。我们在[什么是 UDRP](/zh/blog/what-is-udrp/) 一文中详细介绍了完整的流程、时间线和结果；这里的重点是测试本身，因为这个测试决定了域名倒卖者的成败。

投诉人必须证明以下**所有三点**。这是一个*关联性测试*，这是关于它最重要的一点。只要未能满足其中任何一项，投诉就会被驳回，无论其他两项多么有力。

1. **相同或混淆性相似。** 正如政策所述，[该域名与投诉人拥有权利的商标或服务标记相同或混淆性相似](https://en.wikipedia.org/wiki/Uniform_Domain-Name_Dispute-Resolution_Policy#:~:text=identical%20or%20confusingly%20similar%20to%20a%20trademark%20or%20service%20mark%20in%20which%20the%20complainant%20has%20rights)。实际上，这主要作为一项资格要求：它确认投诉人拥有相关商标，并且你的域名看起来像它。

2. **没有权利或合法利益。** 第二项要素要求[注册人对该域名没有任何权利或合法利益](https://en.wikipedia.org/wiki/Uniform_Domain-Name_Dispute-Resolution_Policy#:~:text=The%20registrant%20does%20not%20have%20any%20rights%20or%20legitimate%20interests)。真正的商业用途、描述性含义或非商业性言论都可以建立合法利益，这就是为什么持有通用域名比持有品牌相关域名安全得多。

3. **恶意注册和使用。** 第三项要素要求[该域名已被恶意注册并且正在被恶意使用](https://en.wikipedia.org/wiki/Uniform_Domain-Name_Dispute-Resolution_Policy#:~:text=The%20domain%20name%20has%20been%20registered%20and%20the%20domain%20name%20is%20being%20used%20in)。**并且**这个词是需要划重点的。恶意必须在注册*和*使用时都存在。一个在投诉人商标出现前几年就注册的域名，通常不可能被认定为恶意注册，因为你无法针对一个尚不存在的品牌。

第三项要素是可辩护的域名组合得以生存的关键。UDRP 认定的恶意模式是特定的：主要为以高价将域名出售给商标所有人而注册、作为一种模式的一部分注册以阻止品牌使用自己的名称、为扰乱竞争对手而注册，或者利用域名通过与商标造成混淆来吸引流量。关键在于，*提供一个通用或描述性域名出售本身并非恶意行为。* 出售域名是一项合法的业务。分界线在于你是在交易词语还是在针对某个品牌。

对于域名倒卖者而言，实际的启示很简单。购买词典词汇，绝不购买商标，并记录下你购买它的*原因*和*时间*，因为早于商标的注册日期通常具有决定性作用。

## ACPA：当网络抢注需要付出真金白银时

![社论风格插图，一把法官的锤子旁边是不断增高的硬币堆，一排域名标签各自投下美元符号的影子](../../assets/cybersquatting-vs-domaining-udrp-acpa-02-stacking-damages.jpg)

UDRP 只能对一个域名做两件事：转移或注销。没有金钱赔偿。对于一个坚决的品牌或一个特别恶劣的抢注者，美国建立了一个带有更锋利牙齿的第二套体系。

《反网络抢注消费者保护法》（Anticybersquatting Consumer Protection Act，简称 ACPA）于 [1999](https://en.wikipedia.org/wiki/Anticybersquatting_Consumer_Protection_Act#:~:text=1999) 年颁布，创立了一项联邦诉讼理由。正如维基百科所总结的，ACPA 确立了[一项针对注册、贩卖或使用与商标或个人姓名混淆性相似或具有稀释性的域名的诉讼理由](https://en.wikipedia.org/wiki/Anticybersquatting_Consumer_Protection_Act#:~:text=a%20cause%20of%20action%20for%20registering%2C%20trafficking%20in%2C%20or%20using%20a%20domain%20name%20confusingly%20similar)。法定标准与 UDRP 的意图要求类似：法律责任适用于那些[具有从该商标中牟利的恶意意图](https://www.law.cornell.edu/uscode/text/15/1125#:~:text=has%20a%20bad%20faith%20intent%20to%20profit%20from%20that%20mark)并且注册、贩卖或使用与某一显著商标相同或混淆性相似的域名的人。

重要的区别在于补救措施。UDRP 只是转移域名，而 ACPA 可能会让你的钱包受损。胜诉的原告可以选择法定赔偿，[每个域名不少于 1,000 美元，不多于 100,000 美元，由法院酌情决定](https://www.law.cornell.edu/uscode/text/15/1117#:~:text=not%20less%20than%20%241%2C000%20and%20not%20more%20than%20%24100%2C000%20per%20domain%20name)。是每个域名。一个持有大量品牌变体域名的抢注者，除了失去这些域名外，还面临着一个与其域名组合规模成正比的巨额赔偿。

由此得出两个实际要点。ACPA 是美国法律，主要适用于当事人或注册商与美国有关联的情况，而 UDRP 则通过注册商合同在全球范围内适用。而且两者并不互相排斥：一个品牌可以先通过快速、廉价的 UDRP 程序拿回域名，然后仍然可以根据 ACPA 提起诉讼要求赔偿。对于合法的域名投资者来说，这在很大程度上是令人安心的，因为 ACPA 的恶意意图要求与 UDRP 的第三项要素一样，保护了善意的通用域名注册。对于抢注者来说，这就是为什么这笔买卖永远不划算的原因。

## 反向域名劫持：当品牌方成为恶意行为者时

![社论风格插图，一个巨大的企业品牌盾牌试图夺取一个小人物持有的通用域名标签，小人物则举起警告盾牌和旗帜来阻止它](../../assets/cybersquatting-vs-domaining-udrp-acpa-03-reverse-hijack.jpg)

这条界线是双向的，而这是大多数“域名倒卖是否合法”的文章所忽略的部分。一个商标并不赋予其所有者拥有所有与其相似的域名的权利。当一个品牌利用争议程序试图从合法持有人手中夺走一个域名时，这种滥用行为有一个专门的名称：反向域名劫持（reverse domain name hijacking）。

维基百科将其定义为[一个合法的商标所有人，试图通过对一个域名的“网络抢注者”所有者提出网络抢注索赔来获取该域名](https://en.wikipedia.org/wiki/Reverse_domain_name_hijacking#:~:text=occurs%20where%20a%20rightful%20trademark%20owner%20attempts%20to%20secure%20a%20domain%20name%20by%20making%20cybersquatting%20claims)的情况，而事实上，后者根本不是抢注者。UDRP 规则为专家组提供了应对此事的工具。根据第 15(e) 段，当[投诉被恶意提起，导致 UDRP 行政程序的滥用](https://en.wikipedia.org/wiki/Reverse_domain_name_hijacking#:~:text=the%20filing%20of%20a%20complaint%20in%20bad%20faith%2C%20resulting%20in%20the%20abuse)时，就会做出反向域名劫持的裁定。

RDNH 的裁定不会给域名所有者带来金钱赔偿，但它是一种正式的、公开的谴责，会损害投诉人在未来争议和诉讼中的信誉。典型的触发情景是，一个品牌想要一个通用域名，错过了购买机会，然后试图利用 UDRP 作为捷径来夺取它本应购买的域名。揭露这种投诉的事实模式通常很简单：域名在商标存在*之前*就已注册，这使得恶意注册变得不可能。对于持有干净通用域名的投资者来说，在答复中提出 RDNH 是一件真正的防御武器。这也不同于安全层面的[域名劫持](/zh/blog/how-domain-hijacking-actually-happens/)，后者是你需要预防的攻击，而不是你需要回应的法律程序。

## 保持在界线的安全一侧

大多数安全措施在你花一分钱之前就已经决定了。一些习惯可以让你的域名组合具有可辩护性：

- **购买通用词，而非品牌词。** 通用、描述性和自创的名称是安全的库存。如果一个域名仅仅因为某家特定公司的存在而有价值，就跳过它。当你不确定一个名称是否听起来像个品牌时，这种不确定性本身就是一个放弃的信号。
- **购买前进行商标查询。** 对相关注册机构的数据库进行快速搜索，检查确切的字符串和明显的拼写错误变体，可以发现大多数问题。这在[二级市场](/zh/glossary/marketplace/)上尤为重要，因为你在继承域名的同时，也继承了前注册人的历史。
- **保留记录，保持停放页面干净。** 保存你的注册日期和理由，因为恶意通常必须在注册时就存在。避免使用与任何商标所有者竞争的 PPC 广告，这可能将一个通用域名变成恶意使用的证据。
- **谨慎处理收到的报价。** 如果一个品牌与你接触，不要围绕*他们*对域名的需求来开价。这种框架很容易被重新解读为“主要为出售给商标所有人而注册”。

当域名干净、记录清晰时，转移本身就是最后一个变量。高价值的销售通过中立的[托管](/zh/glossary/escrow/)服务进行结算，正是为了让任何一方都不必先行一步，而一个可验证的保管链也是域名在其历史受到质疑时具有可辩护性的一部分。[Namefi](https://namefi.io) 正是利用了这一点：代币化的所有权为域名提供了一个持久、可审计的来源记录，同时保持其完全符合 [ICANN](/zh/glossary/icann/) 的规定，因此底层域名始终处于 UDRP 和 ACPA 所管辖的系统之内。代币化增强了你的证据和控制权。它并不会将域名置于商标法之外，任何诚实的工具都不会做出相反的声称。

## 结语

域名投资和网络抢注仅因一事而异：意图。购买通用词，你就是投资者。购买品牌词，你就是目标，有一个可以夺走域名的全球仲裁系统，以及一部可以对你每个域名处以高达六位数罚款的美国法规。反过来，同样的界线也保护着你，因为滥用程序来对付你合法持有的域名的商标所有者，可能会被贴上反向劫持者的标签。熟记 UDRP 的三要素测试，保持你的域名组合通用化、记录清晰，那么这个行业中的法律风险就会停留在它应在的地方：在那些试图玩弄规则的人身上。

## 来源与进一步阅读

- 维基百科 — [网络抢注（定义）](https://en.wikipedia.org/wiki/Cybersquatting#:~:text=is%20the%20practice%20of%20registering%2C%20trafficking%20in%2C%20or%20using%20an%20Internet%20domain%20name%2C%20with%20a%20bad%20faith%20intent%20to%20profit)
- 维基百科 — [《统一域名争议解决政策》（三要素）](https://en.wikipedia.org/wiki/Uniform_Domain-Name_Dispute-Resolution_Policy#:~:text=identical%20or%20confusingly%20similar%20to%20a%20trademark%20or%20service%20mark%20in%20which%20the%20complainant%20has%20rights)
- 维基百科 — [《反网络抢注消费者保护法》（1999年；诉讼理由）](https://en.wikipedia.org/wiki/Anticybersquatting_Consumer_Protection_Act#:~:text=a%20cause%20of%20action%20for%20registering%2C%20trafficking%20in%2C%20or%20using%20a%20domain%20name%20confusingly%20similar)
- 康奈尔大学法律信息研究所 — [15 U.S.C. § 1125(d)（“恶意牟利意图”）](https://www.law.cornell.edu/uscode/text/15/1125#:~:text=has%20a%20bad%20faith%20intent%20to%20profit%20from%20that%20mark)
- 康奈尔大学法律信息研究所 — [15 U.S.C. § 1117(d)（法定损害赔偿：每域名 $1,000–$100,000）](https://www.law.cornell.edu/uscode/text/15/1117#:~:text=not%20less%20than%20%241%2C000%20and%20not%20more%20than%20%24100%2C000%20per%20domain%20name)
- 维基百科 — [反向域名劫持（定义；UDRP 第 15(e) 段）](https://en.wikipedia.org/wiki/Reverse_domain_name_hijacking#:~:text=occurs%20where%20a%20rightful%20trademark%20owner%20attempts%20to%20secure%20a%20domain%20name%20by%20making%20cybersquatting%20claims)
- ICANN — [《统一域名争议解决政策》](https://www.icann.org/resources/pages/policy-2012-02-25-en) · [WIPO](/zh/glossary/wipo/) — [《UDRP 指南》](https://www.wipo.int/amc/en/domains/guide/)
