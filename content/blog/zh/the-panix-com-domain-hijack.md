---
title: 'Panix.com 域名劫持事件：为期五天的“自动批准”规则如何偷走纽约最古老的 ISP'
date: '2026-06-17'
language: zh
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: '2005年1月，纽约最古老的商业 ISP 域名 panix.com 被不法分子利用被盗信用卡欺诈性地转移到了澳大利亚的一家注册商，导致网站和电子邮件瘫痪数天。当时的注册商间转移“自动批准”规则促成了这一切，而该事件的善后工作彻底重塑了域名转移政策。'
keywords: ['panix.com', 'panix 域名劫持', '域名劫持', '注册商间转移', 'Melbourne IT', 'Dotster', 'Fibranet', 'ICANN 转移政策', '注册商锁定', 'clientTransferProhibited', '域名安全', 'DNS 劫持', 'EPP 授权码']
---

在超过十五年的时间里，美国最古老的商业互联网服务提供商（ISP）之一一直居住在一个固定地址：**panix.com**。然而，在2005年1月的一个长周末假期里，有人夺走了它。

他们没有黑进服务器，也没有猜测密码。他们只是填写了一张转移表格，用偷来的信用卡付了款，然后等着一项全新的 ICANN 规则完成剩下的工作。在几个小时内，panix.com 的所有权被转移到了澳大利亚的一家公司，其 DNS 被指向了英国的一台主机，而它的电子邮件则被重新路由到加拿大——所有这一切发生时，真正运营 Panix 的人们正在周六晚上的睡梦中，没有收到任何警告。

这就是纽约最古老的 ISP 如何被一份管理文书（而非系统漏洞）劫持的故事——以及这次事件的善后工作如何帮助重写了关于“谁有权转移域名”的规则。

## 一家所有业务都依赖于单一域名的先驱 ISP

Panix（公共访问网络公司，Public Access Networks Corporation）绝非无名之辈。它成立于1989年，据维基百科记载，它是[继 The World 和 NetCom 之后世界上第三古老的 ISP](https://en.wikipedia.org/wiki/Panix_(ISP)#:~:text=third%2Doldest%20ISP%20in%20the%20world%20after%20The%20World%20and%20NetCom)。它是纽约市早期商业互联网的重要组成部分：提供了数千名纽约人用来上网的 Shell 账户、电子邮件、网络托管、拨号以及后来的宽带连接。

就像过去和现在几乎所有的互联网企业一样，Panix 的身份*就是*它的域名。客户的邮箱以 `@panix.com` 结尾。Web 服务器响应 `www.panix.com`。整个公司——它的品牌、它的可访问性、以及让客户邮件切实送达的关键——都维系在与这一个名字绑定的 DNS 记录上。失去对这个名字的控制，你失去的不仅是一项营销资产，而是整个企业的中枢神经系统。

这正是当年所发生的事情。

## 2005年1月：欺诈性转移

法律记录准确地标明了日期。正如当时的律师事务所 Davis Wright Tremaine 所总结的那样，[在2005年1月14日星期五，发生了一起备受瞩目的劫持事件，纽约同名互联网服务提供商拥有的域名“panix.com”在未经授权的情况下被转移给了第三方](https://www.dwt.com/insights/2005/01/guarding-against-domain-name-hijacking#:~:text=On%20Friday%2C%20Jan.%2014%2C%202005%2C%20a%20high%2Dprofile%20hijacking%20occurred)。

到了那个周末的凌晨，后果已经显现。The Register 在事件发生时的报道中，用一句话描述了这次重定向，至今读起来仍像是一张盗窃路线图：[panix.com 的所有权被转移到了澳大利亚的一家公司，实际的 DNS 记录被移到了英国的一家公司，而 Panix.com 的邮件则被重定向到了加拿大的另一家公司](https://www.theregister.com/2005/01/17/panix_domain_hijack/#:~:text=The%20ownership%20of%20panix.com%20was%20moved%20to%20a%20company%20in%20Australia)。

1月16日，Slashdot 将这一消息爆料给了更广泛的技术社区，他们的描述直言不讳：[纽约最古老的商业互联网提供商 Panix 的域名 'panix.com' 被不明身份的人劫持了](https://it.slashdot.org/story/05/01/16/0027213/new-yorks-oldest-isp-gets-domain-jacked)。

从 Panix 的角度来看，最令人感到后怕的细节是毫无声息。这家[成立于1989年、纽约最古老的商业 ISP 表示，它及其注册商都没有收到任何有关拟议变更的通知](https://www.theregister.com/2005/01/17/panix_domain_hijack/#:~:text=neither%20it%20nor%20its%20registrar%20received%20any%20notification%20of%20the%20proposed%20changes)。在合法所有者看来，夺走域名的转移过程完全是隐形的，直到生米煮成熟饭才被发现。

## 业务中断：网站和电子邮件瘫痪数日

![Vivid colorful concept art of a house deed being quietly re-registered to a stranger overseas while the rightful owner sleeps, a glowing paper title sliding across an ocean toward a foreign desk stamped at midnight](../../assets/the-panix-com-domain-hijack-01-hijack.jpg)

域名被劫持不像开关那样干脆——它是一个缓慢、难堪的消亡过程，而其中最严重的破坏是电子邮件。

当你控制了一个域名的 DNS，你就控制了其电子邮件的投递去向。通过重新指向 panix.com 的邮件记录，劫持者把自己变成了整个 ISP 客户群的“邮局”。入站消息——账单、密码重置、业务往来、私人邮件——不再发送到 Panix，而是开始流向攻击者控制的服务器。InfoWorld 在尘埃落定后的报道中指出，这次劫持[使部分 Panix 客户两天无法访问电子邮件](https://www.infoworld.com/article/2211412/australian-company-takes-blame-for-panix-domain-hijack.html)，并且一些客户在那个周末可能丢失了一百多条甚至更多信息。

在劫持期间被错误路由的邮件不仅仅是被延迟。很大一部分邮件彻底消失了——被退回、被丢弃，或者被一台本不该接收它们的服务器默默吞噬。对于一家客户以“我的邮件送达了吗”来衡量服务价值的提供商来说，连续数天的邮件错误路由堪称最糟糕的系统故障。

而客户们对此无能为力。问题并不出在 Panix 的机器上，那些机器运行得非常正常。问题出在域名系统的全球路由表中，澳大利亚的一家注册商基于欺诈性请求告诉它，panix.com 现在属于别人了。

## 事件始末：“自动批准”转移漏洞

![Vivid colorful concept art of a giant rubber stamp slamming APPROVED onto a transfer form for a glowing domain key, with no ID check, no signature, no guard at the desk — a clock in the background showing five days ticking down](../../assets/the-panix-com-domain-hijack-02-transfer-loophole.jpg)

正是以下这点让 Panix 成为一个里程碑式的案例，而不仅仅是另一个糟糕的周末：没有人进行黑客入侵。系统完全按照设计在运行。设计本身就是漏洞。

这套机制贯穿了一连串的中间商。Panix 的域名在华盛顿州温哥华市的注册商 **Dotster** 处注册。欺诈性转移则是通过英国经销商 **Fibranet Services Ltd.** 的账户发起的，该账户将请求提交给了澳大利亚的大型注册商 **Melbourne IT**。正如 InfoWorld 所报道的那样，[Melbourne IT Ltd. 的一个错误使得使用被盗信用卡的欺诈者控制了 Panix.com](https://www.infoworld.com/article/2211412/australian-company-takes-blame-for-panix-domain-hijack.html)——用于转移的账户是[欺诈性的，并使用被盗信用卡设立的](https://www.infoworld.com/article/2211412/australian-company-takes-blame-for-panix-domain-hijack.html)。

但信用卡欺诈只是用来开设账户。真正转移域名的是一项政策。ICANN 引入了一项新的注册商间转移流程，该流程基于*默认批准*原则，在此几周前的2004年11月才刚刚生效。正如 The Register 所解释的，在新框架下[这些去年11月生效的规则意味着，除非域名所有者撤销，否则注册商间的转移请求将在五天后自动获得批准](https://www.theregister.com/2005/01/19/panix_hijack_more/#:~:text=automatically%20approved%20after%20five%20days%20unless%20countermanded%20by%20the%20domain%20owner)。

再读一遍，因为这就是事情的全部。沉默意味着*同意*。如果合法所有者什么都不做——例如，因为他们从未收到通知——转移就会自动完成。Davis Wright Tremaine 从法律层面描述了同样的陷阱：新规则[可以说让欺诈性转移变得更容易得手，因为根据规则，除非所有者在五天内撤销转移请求，否则域名将自动转移](https://www.dwt.com/insights/2005/01/guarding-against-domain-name-hijacking#:~:text=automatically%20transferred%20unless%20the%20owner%20countermands%20the%20transfer%20request%20within%20five%20days)。

把这些系统性失效叠加在一起，情况就变得非常严峻。*转入*注册商（Melbourne IT，通过 Fibranet）接受了由被盗信用卡支持的请求，并且如其后来承认的那样，[未能妥善验证该请求](https://www.dwt.com/insights/2005/01/guarding-against-domain-name-hijacking#:~:text=failed%20to%20properly%20verify%20the%20request)。*转出*注册商（Dotster）和合法所有者（Panix）没有收到任何有效的通知，因此从未提出撤销。而政策的默认设置——除非有人反对否则批准——将这种“没有反对”变成了既定的盗窃事实。没有防火墙被攻破。这套流程文书本身就是攻击武器。

## 恢复与引发的政策改革

一旦有人工介入，恢复过程非常迅速——这本身就是一种控诉，因为它证明了这笔转移从一开始就不应该被批准。

到了星期天，[Panix 已经从被盗域名停放的澳大利亚域名托管/注册公司 Melbourne IT 手中夺回了 Panix.com 域名](https://www.theregister.com/2005/01/17/panix_domain_hijack/#:~:text=Panix%20had%20recovered%20its%20Panix.com%20domain)，并将其指向 Dotster 这个原本的家。注册局层面的修复几乎是即时的；但全球性的清理却并非如此，因为 DNS 并不会听从指令立刻遗忘。正如 The Register 所指出的那样，根服务器的更新速度很快，但 DNS 的分布式特性意味着最多需要24小时才能完全恢复正常——世界各地的缓存必须过期，所有用户才能重新看到真实的 panix.com。

值得称赞的是，Melbourne IT 并没有推卸责任。两天后，The Register 报道称[一家澳大利亚域名注册商承认了其在上周末域名劫持事件中的责任](https://www.theregister.com/2005/01/19/panix_hijack_more/#:~:text=An%20Australian%20domain%20registrar%20has%20admitted%20to%20its%20part)，将失败追溯到其转移过程中未执行的一个验证步骤，并承诺导致该错误的漏洞已被关闭。

但更重要的后果是结构性的。在随之而来的对转移安全更广泛的清算中，Panix 成为了教科书式的案例。ICANN 的安全与稳定咨询委员会在2005年发布了一份报告《[*域名劫持：事件、威胁、风险和补救措施*](https://itp.cdn.icann.org/en/files/security-and-stability-advisory-committee-ssac-reports/hijacking-report-12-07-2005-en.pdf)》，专门审查了此类故障——注册商在未确认请求者是否真的是注册人的情况下接受转移。强化系统的持久修复措施可以直接追溯到像这样糟糕的周末：

- **默认开启注册商锁定。** 设置为 `clientTransferProhibited` 的域名将直接拒绝转移，直到合法持有者解除锁定。曾经一个鲜为人知的选择性加入功能，对许多注册商而言变成了默认状态——这是一个“自动批准”规则无法逾越的制动器。
- **授权码（EPP 转移码）。** 现代 gTLD 转移需要一个秘密的授权码，*转出*注册商只向经过验证的注册人发放该码，因此转入注册商再也不能仅凭提交文书就拉走一个域名了。
- **形成文件的 [ICANN 转移政策](https://www.icann.org/en/contracted-parties/accredited-registrars/resources/domain-name-transfers/policy)**，包含更严格的确认义务以及紧急联络渠道，以快速撤销此类欺诈性转移。

Panix 劫持事件本身并没有发明这些机制，但在人们主张这些机制的必要性时，它成为了所有人都引用的案例。

## 这件事给我们带来的关于转移锁定和验证的启示

抛开日期和注册商的名字不谈，Panix 事件留下了几条经久不衰的教训。

1. **“默认允许”是一个安全决策，而且通常是错误的。** 2005年最危险的设计选择就是*沉默等于同意*。当所有者不采取任何行动转移就会完成，这种设定假设了所有者始终在监控并且始终能够被联系上。而在假期周末，这两种假设都不成立。
2. **身份必须由交出资产的一方来验证，而不仅仅是接收资产的一方。** 转入注册商想要这笔业务，有充分的动机开绿灯。只有当*转出*注册商必须向经过验证的持有者发放授权码时——将验证机制置于资产实际所在之处——真正的安全才得以实现。
3. **开启锁定。** `clientTransferProhibited` 是域名所有者防御此类攻击最廉价、最有效的保护措施，而且完全免费。一个被锁定的域名，无论转移文书多么具有说服力，都不可能被悄无声息地转移。锁定您的重要域名，并保持它们的锁定状态。
4. **您的域名是您的单点故障。** Panix 的服务器从未被攻破，但公司却实际上处于掉线状态。当注册局中的一条记录就能重定向您所有的网站和电子邮件资源时，这条记录值得比您的服务器更多的保护。
5. **密切关注通知。** 五天的撤销窗口期只能保护那些切实收到——并且阅读了——转移通知的所有者。过时的注册人电子邮箱、无人值守的管理员联系方式或假期周末，都会把安全阀变成无声的失效。

## Namefi 的视角

![Colorful illustration of verifiable, tamper-resistant domain ownership — a domain card secured by a green shield, a green Namefi token, and DNS continuity](../../assets/the-panix-com-domain-hijack-03-namefi-angle.jpg)

Panix 劫持事件本质上是一个*权限*问题。“谁有权转移这个域名？”这个问题的答案是由一连串的经销商和一个默认批准的计时器给出的，而不是由任何强有力的、可验证的所有权证明来决定的。一张被盗的信用卡加上五天的沉默，就足以让系统相信，身处另一个半球的陌生人可以代表纽约的一家 ISP。

[Namefi](https://namefi.io) 的出发点则截然相反：对域名的控制权应该是可证明的，而不是被假设的。通过将域名所有权表示为与 DNS 保持兼容的代币化链上资产，“谁持有这个名字”的行为变得在密码学上可验证且可审计——这是一条不能被轻信错误文书的注册商悄悄覆盖的记录。转移必须在持有者的密钥授权时才能进行，而不是在一个五天的计时器无人看管地倒数结束后发生。系统的默认状态是*拒绝*，同意必须被明确证明，而不仅仅是“不被反对”。

在 Panix 成立的1989年——甚至在劫持事件发生的2005年，这些技术都不存在。但它直指那个周末给整个行业带来的教训：域名太重要了，不能被“沉默”所主宰。所有权应该是一种你可以随时证明的东西——而不是一个陌生人仅仅因为你在长周末没有盯着收件箱就能夺走的东西。

## 参考资料与进一步阅读

- The Register — [Panix 从域名劫持中恢复](https://www.theregister.com/2005/01/17/panix_domain_hijack/)
- The Register — [Panix.com 劫持事件：澳大利亚公司承担责任](https://www.theregister.com/2005/01/19/panix_hijack_more/)
- Davis Wright Tremaine — [防范域名劫持](https://www.dwt.com/insights/2005/01/guarding-against-domain-name-hijacking)
- InfoWorld — [澳大利亚公司对 Panix 域名劫持事件负责](https://www.infoworld.com/article/2211412/australian-company-takes-blame-for-panix-domain-hijack.html)
- Slashdot — [纽约最古老的 ISP 域名被劫持](https://it.slashdot.org/story/05/01/16/0027213/new-yorks-oldest-isp-gets-domain-jacked)
- 维基百科 — [Panix (ISP)](https://en.wikipedia.org/wiki/Panix_(ISP))
- 维基百科 — [域名劫持 (Domain hijacking)](https://en.wikipedia.org/wiki/Domain_hijacking)
- ICANN SSAC — [域名劫持：事件、威胁、风险和补救措施 (2005)](https://itp.cdn.icann.org/en/files/security-and-stability-advisory-committee-ssac-reports/hijacking-report-12-07-2005-en.pdf)
- ICANN — [转移政策 (Transfer Policy)](https://www.icann.org/en/contracted-parties/accredited-registrars/resources/domain-name-transfers/policy)
- NANOG 邮件列表存档 — [关于 panix.com 转移及 ICANN 补救措施的讨论](https://diswww.mit.edu/charon/nanog/77162)