---
title: '网络抢注与合法域名投资：UDRP 与 ACPA 详解'
date: '2026-06-21'
language: zh
tags: ['domains', 'security', 'domain-flipping', 'explainer']
authors: ['namefiteam']
draft: false
cluster: domain-security
series: domain-flipping-skills
seriesOrder: 17
format: explainer
description: '合法域名投资与网络抢注之间的边界在哪里：UDRP 三要素测试、ACPA、反向域名劫持，以及如何保持合规。'
ogImage: ../../assets/cybersquatting-vs-domaining-udrp-acpa-og.jpg
keywords: ['网络抢注', '网络抢注与域名投资', 'udrp', 'udrp三要素测试', 'acpa', '反网络抢注消费者保护法', '反向域名劫持', 'rdnh', '恶意域名注册', '域名倒卖是否合法', '商标域名争议', '域名争议解决', '合法域名投资', 'wipo udrp', '域名投资合法性']
---

同样是注册域名转售，两个人的法律处境却截然不同。一个人买下 `solarpanels.com`，这是业内任何人都可能需要的普通词组；另一个人买下 `nike-running-shoes.net`，这个字符串之所以有价值，完全是因为 Nike 的存在。表面上做的是同一件事，法律定性却大相径庭。前者是普通的[域名投资](/zh/glossary/domaining/)，后者是[网络抢注](/zh/glossary/cybersquatting/)——而且有两套成熟的机制专门用来把这类域名从注册人手中夺走。

这条边界，是这门生意中最重要的一条线，也是最容易无意间踩过的一条线。本文将沿着这条线走一遍：网络抢注的真正定义、UDRP 用来追回域名的三要素合取测试、美国 [ACPA](/zh/glossary/acpa/) 如何在此基础上加上金钱赔偿，以及大多数文章略去不谈的另一面——反向域名劫持，即品牌方滥用制度来对付合法持有人的情形。本文是我们关于[域名倒卖与法律](/zh/blog/domain-flipping-and-the-law/)的专题文章及[域名倒卖](/zh/blog/domain-flipping/)系列中心页的法律风险配套指南。

> **非法律建议。** 本文为域名持有人提供的一般性信息，不构成法律建议。具体结果取决于个案事实。如果您收到投诉或正在考虑提起投诉，请咨询有资质的律师。

## 网络抢注的真正含义

网络抢注并非"注册了别人想要的域名"，而是注册域名以利用他人的[商标](/zh/glossary/trademark/)。维基百科的定义值得记牢：它是[以恶意牟利为目的，注册、倒卖或使用他人商标商誉的互联网域名的行为](https://en.wikipedia.org/wiki/Cybersquatting#:~:text=is%20the%20practice%20of%20registering%2C%20trafficking%20in%2C%20or%20using%20an%20Internet%20domain%20name%2C%20with%20a%20bad%20faith%20intent%20to%20profit)。这句话里每个词都有分量：行为（注册、倒卖、使用）范围很广；意图（[恶意](/zh/glossary/bad-faith/)、牟利）才是触发条件；而目标非常具体：*他人拥有的商标*，而非整个市场共享的通用词汇。

合法域名投资站在这条意图线的另一侧。购买通用词、描述性词汇或创造性词汇并转售，是一个由来已久的行业。`solarpanels.com` 这样的[域名](/zh/glossary/domain-ownership/)有价值，是因为这些词对整个行业都有意义，而不是因为它们搭了某家公司的声誉便车。同样道理，品牌型造词域名和没有附着商标的短 [`.com`](/zh/tld/com/) 或 [`.io`](/zh/tld/io/) 域名也属此类。资产价值来自字符串本身，这就是[域名交易](/zh/glossary/domain-trading/)作为合法实践的全部意义所在。

麻烦出现在一个域名的价值*来自*某个品牌而非这些词汇本身的时候。在知名商标上加连字符后缀、故意拼错著名商标（[误植抢注](/zh/glossary/typosquatting/)），或在产品发布后立刻抢注新 [TLD](/zh/glossary/tld/) 下的品牌名称——你试图捕获的是他人的商誉。这正是下面两套执法机制所要打击的行为。

## UDRP 三要素合取测试

![三把排成一排的挂锁均已打钩，由同一条链条连接，链条末端挂着一个域名标签](../../assets/cybersquatting-vs-domaining-udrp-acpa-01-three-locks.jpg)

第一套也是最常见的机制是 [UDRP](/zh/glossary/udrp/)——统一域名争议解决政策。每一家经认证的[注册商](/zh/glossary/registrar/)在您注册域名时都会要求您同意这项政策，这也是为什么私人仲裁庭（而非法院）就能下令将域名强制转移。我们在[什么是 UDRP](/zh/blog/what-is-udrp/) 一文中详细介绍了完整流程、时间线和可能结果；这里重点说测试本身，因为测试决定了域名投资者的胜负。

投诉人必须同时证明以下**三点**。这是一个*合取*测试，这是关于它最重要的一个事实。任何一项要素未能满足，投诉即被驳回——无论其他两项多么有力。

1. **相同或令人混淆的近似。** 如该政策所述，[域名与投诉人享有权利的商标或服务标志相同或令人混淆地相似](https://en.wikipedia.org/wiki/Uniform_Domain-Name_Dispute-Resolution_Policy#:~:text=identical%20or%20confusingly%20similar%20to%20a%20trademark%20or%20service%20mark%20in%20which%20the%20complainant%20has%20rights)。实践中，这个要素主要起资格审查作用：它确认投诉人持有相关商标，且您的域名看起来像该商标。

2. **无权利或合法利益。** 第二个要素要求[注册人对该域名不享有任何权利或合法利益](https://en.wikipedia.org/wiki/Uniform_Domain-Name_Dispute-Resolution_Policy#:~:text=The%20registrant%20does%20not%20have%20any%20rights%20or%20legitimate%20interests)。真实的商业用途、描述性含义或非商业性言论均可构成合法利益——这也是为什么通用词域名比品牌相关域名安全得多。

3. **以恶意注册且以恶意使用。** 第三个要素要求[域名已被以"恶意"注册，且域名正在以"恶意"使用](https://en.wikipedia.org/wiki/Uniform_Domain-Name_Dispute-Resolution_Policy#:~:text=The%20domain%20name%20has%20been%20registered%20and%20the%20domain%20name%20is%20being%20used%20in)。请注意这里的**"且"**字。恶意必须在*注册时*和*使用时*同时存在。如果某个域名注册于投诉人商标诞生之前，通常就不可能被认定为恶意注册，因为一个尚不存在的品牌是无法被针对的。

第三个要素正是可辩护投资组合的生存之道。UDRP 认定的恶意行为模式是具体的：主要目的是将域名高价卖给商标所有人；以规律性行为阻止品牌注册自己的名称；注册以扰乱竞争对手；或通过制造与商标的混淆来引流。关键在于，*挂牌出售通用词或描述性域名本身并不构成恶意。* 卖域名是合法生意。分界线在于：你是在交易文字，还是在针对某个品牌。

对域名投资者来说，实操要点很简单：买字典词，永远不买商标词；记录好*为什么*和*何时*购入，因为早于商标存在的注册日期往往具有决定性意义。

## ACPA：当网络抢注代价真金白银

![法官木槌旁边是一叠叠上涨的硬币，一排域名标签各自投下美元符号的影子](../../assets/cybersquatting-vs-domaining-udrp-acpa-02-stacking-damages.jpg)

UDRP 对一个域名只能做两件事：转移或注销。没有损害赔偿。对于下定决心的品牌方，或者特别恶劣的抢注者，美国建立了一套牙齿更锋利的第二机制。

《反网络抢注消费者保护法》（Anticybersquatting Consumer Protection Act）于 [1999 年](https://en.wikipedia.org/wiki/Anticybersquatting_Consumer_Protection_Act#:~:text=1999)颁布，创设了联邦诉讼权利。如维基百科所总结，ACPA 确立了[对注册、倒卖或使用与商标或个人姓名令人混淆地相似或对其有淡化作用的域名的诉讼权利](https://en.wikipedia.org/wiki/Anticybersquatting_Consumer_Protection_Act#:~:text=a%20cause%20of%20action%20for%20registering%2C%20trafficking%20in%2C%20or%20using%20a%20domain%20name%20confusingly%20similar)。该法律的主观标准与 UDRP 的意图要求一脉相承：法律责任附着于[以恶意牟利为目的](https://www.law.cornell.edu/uscode/text/15/1125#:~:text=has%20a%20bad%20faith%20intent%20to%20profit%20from%20that%20mark)注册、倒卖或使用与显著性商标相同或令人混淆地相似的域名的人。

最关键的区别在于救济手段。UDRP 只是移转域名，ACPA 则可以直接打钱包。胜诉原告可选择法定赔偿金，每个域名[不低于 1,000 美元、不高于 100,000 美元，具体金额由法院酌情裁定](https://www.law.cornell.edu/uscode/text/15/1117#:~:text=not%20less%20than%20%241%2C000%20and%20not%20more%20than%20%24100%2C000%20per%20domain%20name)。按域名计算。持有一批品牌变体域名的抢注者面临的数字会随着投资组合规模成比例增长，还要叠加域名本身的损失。

两个实操要点值得注意。ACPA 是美国法律，在当事方或注册商与美国有关联时最为相关；而 UDRP 通过注册商合同在全球范围适用。两者并不互斥：品牌方可以先走快速、低成本的 UDRP 拿到域名，再依据 ACPA 提起赔偿诉讼。对于合法域名投资者而言，这大多是一个令人放心的消息，因为 ACPA 的恶意牟利要求与 UDRP 第三要素一样，保护善意的通用词注册行为。对抢注者而言，这恰恰说明账算不下去。

## 反向域名劫持：当品牌方才是恶意方

![一个巨大的企业品牌盾牌正伸手抢夺一个较小人物手持的普通域名标签，后者举起警告盾牌和旗帜加以阻止](../../assets/cybersquatting-vs-domaining-udrp-acpa-03-reverse-hijack.jpg)

这条线是双向的，而这正是大多数"域名倒卖是否合法"类文章略去的部分。商标并不赋予其所有人权利要求所有看起来像它的域名。当品牌方利用争议程序试图从合法持有人手中强夺域名时，这种滥用行为有个专有名称：反向域名劫持。

维基百科将其定义为：[合法商标所有人试图通过对域名所有者提出网络抢注指控来获取域名](https://en.wikipedia.org/wiki/Reverse_domain_name_hijacking#:~:text=occurs%20where%20a%20rightful%20trademark%20owner%20attempts%20to%20secure%20a%20domain%20name%20by%20making%20cybersquatting%20claims)，而该所有者实际上根本不是抢注者。UDRP 规则赋予专家组对此的处置工具。根据第 15(e) 条，当存在[以恶意提起投诉、滥用 UDRP 行政程序](https://en.wikipedia.org/wiki/Reverse_domain_name_hijacking#:~:text=the%20filing%20of%20a%20complaint%20in%20bad%20faith%2C%20resulting%20in%20the%20abuse)的情形时，专家组将作出反向域名劫持裁定。

反向域名劫持（RDNH）裁定不会给域名持有人带来任何金钱赔偿，但它是一个正式的、公开的谴责，会损害投诉人在未来争议和诉讼中的信誉。典型的触发情形是：某品牌想要一个通用词域名，错过了购买机会，便试图借助 UDRP 走捷径拿走本应购买的东西。暴露投诉意图的事实模式通常很简单：该域名注册于商标存在之前，这使得恶意注册在逻辑上根本不可能成立。对于持有清白通用词域名的投资者而言，在答辩中提出 RDNH 主张是一件真正有力的防御武器。这也有别于安全层面的[域名劫持](/zh/blog/how-domain-hijacking-actually-happens/)——后者是你需要主动防范的攻击，而非需要应对的法律程序。

## 如何保持在边界的安全一侧

保持安全，大多数决定在花出第一分钱之前就已经做出了。几个习惯能让一个投资组合保持可辩护性：

- **买词语，不买品牌。** 通用词、描述性词汇和创造性词汇才是安全的库存。如果一个域名的价值完全依赖于某家特定公司的存在，就绕开它。如果你不确定一个域名是否读起来像品牌名，这种不确定感本身就是放弃的信号。
- **购买前做商标检查。** 对精确字符串及常见拼写变体在相关商标局快速检索，能发现大多数问题。在[二级市场](/zh/glossary/aftermarket/)上这一点尤其重要，因为你会连同历史记录一起继承前[注册人](/zh/glossary/registrant/)留下的问题。
- **保留记录，保持停放页面干净。** 保存您的注册日期和购买理由，因为恶意通常必须在注册时就存在。避免投放与任何商标所有人形成竞争的 PPC 广告——这可能将一个通用词域名变成恶意使用的证据。
- **谨慎处理来自品牌方的报价。** 如果品牌方主动联系您，不要以*他们*对这个域名的需求为框架提出报价。这种框架措辞很容易被重新解读为"主要目的是向商标所有人出售"。

当域名本身干净、记录也干净时，转让本身是最后一个变量。高价交易通过中立[托管](/zh/glossary/escrow/)机构结算，正是因为这样双方都不必先行付款，而可核实的所有权链条也是域名历史受到质疑时证明其合法性的重要组成部分。[Namefi](https://namefi.io) 恰恰在这方面发力：代币化所有权为域名提供了一个持久、可审计的来源记录，同时保持完全符合 [ICANN](/zh/glossary/icann/) 合规要求，使底层域名完全处于 UDRP 和 ACPA 所管辖的体系之内。代币化强化了您的证据和控制权，但它不会将域名置于商标法之外——任何诚实的工具都不会做出这样的承诺。

## 结论

域名投资与网络抢注之间只有一样东西：意图。买词语，你是投资者；买品牌，你就是靶子——全球仲裁体系可以拿走域名，美国法律还能在此基础上对每个域名追加高达六位数的赔偿。同样的这条线反过来也保护你，因为针对你合法持有域名滥用程序的商标所有人可能被认定为反向劫持者。把 UDRP 的三要素测试烂熟于心，保持投资组合的通用性和记录的整洁性，这门生意的法律风险就会停留在它本该在的地方：落在那些试图钻空子的人头上。

## 来源与延伸阅读

- 维基百科 — [网络抢注（定义）](https://en.wikipedia.org/wiki/Cybersquatting#:~:text=is%20the%20practice%20of%20registering%2C%20trafficking%20in%2C%20or%20using%20an%20Internet%20domain%20name%2C%20with%20a%20bad%20faith%20intent%20to%20profit)
- 维基百科 — [统一域名争议解决政策（三要素）](https://en.wikipedia.org/wiki/Uniform_Domain-Name_Dispute-Resolution_Policy#:~:text=identical%20or%20confusingly%20similar%20to%20a%20trademark%20or%20service%20mark%20in%20which%20the%20complainant%20has%20rights)
- 维基百科 — [反网络抢注消费者保护法（1999 年；诉讼权利）](https://en.wikipedia.org/wiki/Anticybersquatting_Consumer_Protection_Act#:~:text=a%20cause%20of%20action%20for%20registering%2C%20trafficking%20in%2C%20or%20using%20a%20domain%20name%20confusingly%20similar)
- 法律信息研究所（康奈尔大学）— [15 U.S.C. § 1125(d)（"恶意牟利意图"）](https://www.law.cornell.edu/uscode/text/15/1125#:~:text=has%20a%20bad%20faith%20intent%20to%20profit%20from%20that%20mark)
- 法律信息研究所（康奈尔大学）— [15 U.S.C. § 1117(d)（法定赔偿金：每域名 1,000–100,000 美元）](https://www.law.cornell.edu/uscode/text/15/1117#:~:text=not%20less%20than%20%241%2C000%20and%20not%20more%20than%20%24100%2C000%20per%20domain%20name)
- 维基百科 — [反向域名劫持（定义；UDRP 第 15(e) 条）](https://en.wikipedia.org/wiki/Reverse_domain_name_hijacking#:~:text=occurs%20where%20a%20rightful%20trademark%20owner%20attempts%20to%20secure%20a%20domain%20name%20by%20making%20cybersquatting%20claims)
- ICANN — [统一域名争议解决政策](https://www.icann.org/resources/pages/policy-2012-02-25-en) · WIPO — [UDRP 使用指南](https://www.wipo.int/amc/en/domains/guide/)
