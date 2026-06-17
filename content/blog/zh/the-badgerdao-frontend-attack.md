---
title: 'BadgerDAO 前端攻击事件：一段注入脚本如何卷走 1.2 亿美元'
date: '2026-06-17'
language: zh
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: '2021 年 12 月，攻击者入侵了 BadgerDAO 的 Cloudflare 账户，并在其网站前端注入了一段恶意脚本。经过审计的智能合约完好无损，但约 1.2 亿美元却因为用户在不知情下签署的钱包授权而不翼而飞。本文将深入探讨为什么网站也是您的安全防线的重要组成部分。'
keywords: ['badgerdao 黑客攻击', 'badgerdao 前端攻击', 'cloudflare api 密钥泄露', '注入脚本攻击', 'web3 前端安全', '冰钓攻击', 'increaseAllowance 攻击', '代币授权漏洞', 'dns 与域名安全', 'cloudflare workers 漏洞', 'defi 安全', 'web3 供应链攻击', '网站篡改', '域名安全']
---

审计通过了。合约很安全。但资金还是不翼而飞了。

在 2021 年 12 月 2 日前后的几天里，致力于将比特币引入去中心化金融的 DeFi 项目 BadgerDAO 损失了大约 **1.2 亿美元** 的用户资金。这里没有闪电贷把戏，没有重入漏洞，也没有针对机枪池（vaults）的高明数学漏洞。智能合约完全按照其编写的逻辑运行。攻击者根本不需要攻破它们，因为攻击者的目标压根就不是合约。

他攻击的是*网站*。

有人悄悄将一段恶意脚本植入了 app.badger.com 的前端。对于每一个加载该页面的用户来说，它看起来就像他们每天使用的那个值得信赖的 dApp。但当他们进行交互操作时，页面会向他们的钱包请求一个额外的、不可见的权限——一旦他们点击了“授权（approve）”，他们的代币就不再属于自己了。

这是一个关于拥有完善审计合约的项目，如何因为被注入了一段前端代码而损失上亿美元的故事，它也理应彻底改变您对安全边界的认知。

## 自欺欺人的谎言：“合约已经过审计”

加密领域的文化训练用户在信任一个协议之前都要问一个问题：*它经过审计了吗？* 审计当然很重要，它们能发现真实的漏洞。但不知从何时起，“合约已审计”固化成了一种绝对安全的错觉——仿佛一份干净的审计报告就是一个力场，能保护所有冠以该项目名称的事物。

事实并非如此。

审计只检查链上代码：机枪池、代币逻辑、访问控制。它完全无法顾及开发者忘记退出的笔记本电脑、将浏览器重定向的 DNS 记录、部署在网站前端的 CDN，或者当您访问 dApp 时浏览器实际下载并运行的 JavaScript。这些都存在于 *Web2* 的世界——在云账户、API 密钥和域名基础设施中——它们与 Solidity 代码一样，是整个系统的承重墙。

BadgerDAO 是这一安全盲区最直观的证明。正如一篇技术分析文章中一针见血地指出的那样：[从项目智能合约的角度来看，一切都没有问题](https://www.halborn.com/blog/post/explained-the-badgerdao-hack-december-2021#:~:text=From%20the%20perspective%20of%20the%20project%27s%20smart%20contracts%2C%20nothing%20had%20gone%20wrong)，攻击者只是利用了用户授予的权限。链上运行极其完美，但网站撒了谎。

## 攻击手段：篡改过的店面与合法的收据

![Vivid colorful concept art of a trusted, friendly-looking storefront whose cash register has been quietly tampered with, an extra hidden drawer siphoning coins while customers smile and pay normally](../../assets/the-badgerdao-frontend-attack-01-attack.jpg)

想象一下，您走进一家光顾过上百次的商店。同样的招牌，同样的员工，同样的柜台。您买了一件小商品，收银员扫码，您刷卡付款。一切看起来都如往常一样。您看不到的是，有人偷偷把读卡器换成了一个不仅能完成当前支付，还能悄悄授权对您的账户进行无限额二次扣款的设备——而这笔钱将随时随地流向一个陌生人。

实际上，这正是发生在 BadgerDAO 用户身上的事情。

在这里对攻击进行分类非常重要，因为这正是该事件具有极高教育意义的原因。正如 *Vice* 总结的那样，这次黑客攻击[并不涉及复杂的智能合约漏洞。相反，这是一次针对 BadgerDAO 网络基础设施的前端攻击](https://www.vice.com/en/article/hackers-steal-dollar119m-from-web3-crypto-project-with-old-school-attack/#:~:text=injected%20a%20malicious%20script%20into%20BadgerDAO%27s%20frontend)——特别是指向其 Cloudflare 账户。在他们的框架下，这是一种针对 Web3 目标的*传统老式（old-school）* Web 攻击。

其攻击机制既精巧又隐蔽。这段恶意脚本向用户的钱包请求将代币支出额度授权给攻击者的地址。用 Vice 的话来说，[恶意脚本基本上就是诱骗人们将发送代币的权利赋予攻击者的地址](https://www.vice.com/en/article/hackers-steal-dollar119m-from-web3-crypto-project-with-old-school-attack/#:~:text=The%20malicious%20script%20basically%20tricked%20people%20into%20giving)。用户以为他们只是在进行常规的 dApp 交互，实则却把代币的钥匙拱手让人。

安全研究人员将这种攻击模式称为*冰钓（ice phishing）*：攻击者并不窃取您的私钥，而是诱导您自愿授权一个恶意的资金使用者。签名是真的，授权是真的，链上交易也是有效的。这正是它如此危险的原因——也是为什么任何合约审计都无法阻止它的原因。

## 用户的损失：约 1.2 亿美元，一次签名接一次签名

对于一次从未触及任何机枪池代码的攻击来说，损失的数字令人咋舌。

智能合约审计公司 PeckShield [估计总损失约为 1.2 亿美元](https://cryptobriefing.com/120m-lost-badgerdao-defi-hack/)。根据 BadgerDAO 事后发布的统计报告（被多个事件案例研究所引用），一旦将所有被盗资产转换为统一的计价单位，损失[约为 2076.54 枚 BTC（在黑客攻击发生时价值约 1.163 亿美元）](https://www.quadrigainitiative.com/casestudy/badgerdaomaliciouscodeinjected.php#:~:text=2076.54%20BTC)。

损失并非平均分布。一名受害者（据报道为机构账户）在一次交易中承担了绝大部分损失：案例研究指出，[大约 900 枚 BTC 从 Yearn 的 wBTC 机枪池中被转移](https://www.quadrigainitiative.com/casestudy/badgerdaomaliciouscodeinjected.php)，仅这一方就损失了[价值超过 5000 万美元的封装比特币（wrapped Bitcoin）](https://www.quadrigainitiative.com/casestudy/badgerdaomaliciouscodeinjected.php#:~:text=lose%20over%20%2450%20million)。剩下的损失由数百名普通用户分担。

这种巨大的规模直接归因于攻击者的耐心。攻击者并没有急于出手。正如 Forta 的分析所述，[黑客默默地收集了近 200 个账户的授权，然后在 2021 年 12 月 2 日凌晨 12:48，黑客在不到 10 小时内吸干了受害者的钱包](https://forta.org/blog/how-to-derail-a-120-million-dollar-hack#:~:text=The%20hacker%20silently%20accumulated%20approvals%20from%20almost%20200%20accounts)。恶意的授权在几天里被悄悄收集——这是一个早已布好、并一次性触发的陷阱。另一项事件重建分析统计，在整个攻击周期内，[有多达 500 个钱包创建了这种无限制的授权](https://www.halborn.com/blog/post/explained-the-badgerdao-hack-december-2021#:~:text=The%20attacker%20managed%20to%20get%20500%20wallets)。

最残酷的细节在于：即便是再谨慎的用户也无从查验。URL 是正确的，TLS 证书是有效的，界面也是完全真实的。唯一出问题的是一个由合法网站自身提供的 JavaScript 代码片段。

## 攻击过程剖析：一把 Cloudflare API 密钥和一次注入的授权

![Vivid colorful concept art of an invisible hand quietly adding one extra glowing approve button to a wallet pop-up while the real interface looks calm and trustworthy, a single malicious line of code slipping into a friendly web page](../../assets/the-badgerdao-frontend-attack-02-injected-script.jpg)

攻击者利用的“前门”并不是智能合约，而是一个云服务账户。

与现代网络的绝大部网站一样，BadgerDAO 也托管在 Cloudflare 之后——这是一个用于内容分发和边缘计算、为网站提供加速与防御的网络层。控制了这个账户，就意味着控制了 BadgerDAO 网站向访问者分发什么代码。而攻击者通过窃取 API 密钥获得了这一控制权。

根据 CoinDesk 转述的 BadgerDAO 官方账目，[黑客使用了一个在 Badger 工程师不知情或未授权的情况下创建的受损 API 密钥，定期注入影响部分客户的恶意代码](https://www.coindesk.com/business/2021/12/10/badgerdao-reveals-details-of-how-it-was-hacked-for-120m)。这句——*影响部分客户*——正是该攻击能隐藏如此之久的部分原因。该脚本并没有在所有用户的每次访问中都触发。它会进行轮换，只攻击部分用户，这使得恶意行为极难被复现或察觉。

一个未经授权的 API 密钥究竟是如何产生的？根本原因可以追溯到 Cloudflare 的一个账户流程漏洞。事件案例研究指出，未授权用户能够创建账户，并且在[完成电子邮件验证之前](https://www.quadrigainitiative.com/casestudy/badgerdaomaliciouscodeinjected.php#:~:text=before%20email%20verification%20was%20completed)就可以创建和查看全局 API 密钥（这些密钥无法被删除或停用）。攻击者可以在账户上预植一个密钥，然后静静等待真正的所有者完成验证并激活账户——此时攻击者也就悄无声息地获得了有效的 API 访问权限。

利用这把密钥，攻击者操作了 Cloudflare Workers——Cloudflare 的边缘计算平台——在页面传输给用户的过程中进行了重写。BadgerDAO 与网络安全公司 Mandiant 联合发布的尸检报告得出结论，12 月 2 日的网络钓鱼事件是 Cloudflare Workers 提供的一段恶意注入代码段导致的。这段注入的代码只做了一件关键的事：在 dApp 的正常交互流程中插入了一个额外的代币授权请求。

攻击者在*使用哪种*授权调用上也花了一番心思。CryptoBriefing 报道称，[据称黑客在 Badger 网站上插入了一个恶意脚本，向用户展示了一个“增加额度（increaseAllowance）”的交易](https://cryptobriefing.com/120m-lost-badgerdao-defi-hack/#:~:text=presented%20users%20with%20a%20transaction%20to)。这个选择并非随机。与原始的 `approve` 调用相比，`increaseAllowance` 提示在钱包弹窗中往往表现出较弱、较不具警示性的视觉反馈——更少的红旗警告，也没有那么强烈的“您即将授予资金支配权”的提示。攻击者甚至对被盗的*用户体验*进行了优化。

因此，完整的攻击链条是这样的：Cloudflare 账户验证流程的弱点导致了未授权 API 密钥的产生 → 攻击者利用该密钥部署了一个 Worker → 该 Worker 将脚本注入到 app.badger.com 中 → 脚本向钱包请求针对攻击者的代币授权 → 用户同意授权 → 攻击者洗劫资产。这其中的每一个步骤都没有触及受审计的合约。

## 事件响应：暂停链上活动以止住 Web2 的伤口

12 月 2 日凌晨，当大规模的资金转移交易爆发时，链上的异常踪迹终于无法掩饰，BadgerDAO 迅速采取行动——利用其智能合约来阻止一场完全源自链下的灾难。

团队公开承认了这一事件，并且据 CryptoBriefing 报道，确认[所有智能合约均已暂停以防止进一步的提款](https://cryptobriefing.com/120m-lost-badgerdao-defi-hack/)。因为 Badger 的机枪池具备暂停功能，冻结转账切断了攻击者继续转移新获授权资金的能力。一份技术分析文章将这次暂停描述为团队行使权力冻结所有对 `transferFrom` 函数的调用——这正是恶意授权所利用的 ERC-20 机制。这种暂停也是理论上有一部分损失能够被追回的原因：一些资产虽然已被攻击者移动，但在冻结生效前尚未从 Badger 的机枪池中完全提现。

在基础设施方面，清理工作完全是针对凭据泄露的严酷 Web2 检查清单：轮换 Cloudflare API 密钥、更改账户密码、加强多因素身份验证（MFA），并审计所有不应存在的密钥。随后，BadgerDAO 与 Mandiant 合作进行调查，并发布了一份技术分析报告以重建时间线——Cloudflare 账户弱点、前几个月创建的未授权密钥、11 月的脚本注入以及 12 月的资金吸干。

但是，再出色的事件响应也无法撤销用户已经给出的签名授权。签名仍然有效。补救措施可以阻止*未来*的盗窃并追查资金，但它无法逆转链上已经授予的同意许可。

## 从中吸取的教训：网站也是您的安全防线之一

BadgerDAO 事件带来的一条最重要教训，就是对安全边界的重新纠正。大多数团队——以及大多数用户——将安全防御的边界仅仅划在智能合约周围。但 BadgerDAO 证明了，这个边界远比这大得多。

**1. 前端永远属于安全防线的范畴。** 无论用户浏览器执行的代码是否在链上，它都是协议的一部分。如果攻击者控制了您的网站分发的 JavaScript，他们就控制了您的用户钱包——无论合约是否经过审计。网站不仅仅是“一个 UI 界面”，它是获取用户授权许可的地方。

**2. 云端和域名基础设施也是合约的一部分。** Cloudflare 账户、DNS 提供商登录凭证、域名注册商账户、CI/CD 密钥——每一个都是重写用户所见内容的途径。BadgerDAO 并非在机枪池处被攻破，而是在*控制网站的账户*上被攻破的。请用对待部署者私钥一样的偏执心理，来保护这些平台凭证。

**3. API 密钥和账户创建流程是真实的攻击面。** 整个灾难的枢纽是一个本不该存在的未授权 API 密钥，而验证流程的漏洞促成了它的诞生。清点每一个密钥，严格限制其权限。定期轮换，并对新创建的密钥发出警报。您遗忘的密钥就是攻击者利用的武器。

**4. “已审计”是必要条件，而非充分条件。** 干净的审计报告具有实际价值，您依然需要它。但它涵盖的只是合约，而不是云账户、DNS、CDN 或前端构建流水线。安全性贯穿于从用户浏览器到链上交互的整条路径——而木桶效应决定了，决定安全上限的永远是最弱的一环，而非最强的一环。

**5. 用户无法单凭检查来识破被篡改的前端。** “永远检查 URL”是个好建议，但在这里毫无用处。URL 是正确的。给用户的教训则更加严苛：对授权和 `increaseAllowance` 提示保持极度的怀疑；优先使用那些能对代币授权进行解码和警告的钱包及工具；并定期撤销陈旧的授权。您正在授权的内容，远比您所在的页面更重要。

## Namefi 的视角

![Colorful illustration of verifiable, tamper-resistant domain and web ownership — secured by a green shield, a green Namefi token, and DNS continuity](../../assets/the-badgerdao-frontend-attack-03-namefi-angle.jpg)

如果剥开 BadgerDAO 事件的表象，其核心是一个**所有权与控制权**的问题。攻击者并不拥有 BadgerDAO 的网站——但在数周的时间里，他们却能够更改网站分发的内容。而那些真正*拥有*该项目的人，却缺乏一种可靠的、防篡改的方式来获知其网络资产（账户、密钥、边缘配置、DNS）的控制链已在暗中被破坏。

这正是 [Namefi](https://namefi.io) 所关注的痛点。Namefi 将域名和网站所有权视为一等互联网原生资产：这种控制权是可验证的、可审计的，并且更难被悄无声息地劫持，同时保持与 DNS 的兼容性。前端的攻击面——谁控制了名称，它解析到哪里，背后隐藏着什么基础设施——绝非智能合约的附属品。正如 BadgerDAO 用最昂贵的代价所展示的那样，它*就是*安全模型本身不可或缺的一部分。

您可以对合约进行一遍又一遍的审计，直至它们完美无瑕。但是，如果一个未授权的密钥就能重写您的网站，一段被注入的脚本就能轻易窃取用户的授权，那么审计永远只是故事的一半。将您的应用程序交付给真实用户的域名、DNS 和网络基础设施同样是您安全防线的一部分。像对待核心资产一样对待它们吧——因为攻击者早已开始这么做了。

## 参考资料与延伸阅读

- CoinDesk — [BadgerDAO 披露被盗 1.2 亿美元的细节](https://www.coindesk.com/business/2021/12/10/badgerdao-reveals-details-of-how-it-was-hacked-for-120m)
- Vice (Motherboard) — [黑客通过传统攻击手法从 Web3 加密项目窃取 1.19 亿美元](https://www.vice.com/en/article/hackers-steal-dollar119m-from-web3-crypto-project-with-old-school-attack/)
- Halborn — [BadgerDAO 黑客攻击事件解析（2021 年 12 月）](https://www.halborn.com/blog/post/explained-the-badgerdao-hack-december-2021)
- Forta — [如何阻止一场 1.2 亿美元的黑客攻击](https://forta.org/blog/how-to-derail-a-120-million-dollar-hack)
- CryptoBriefing — [BadgerDAO DeFi 遭黑客攻击损失 1.2 亿美元](https://cryptobriefing.com/120m-lost-badgerdao-defi-hack/)
- Quadriga Initiative — [2021 年 12 月 — BadgerDAO 恶意代码注入事件 — 损失 1.163 亿美元](https://www.quadrigainitiative.com/casestudy/badgerdaomaliciouscodeinjected.php)
- Chainalysis — [BadgerDAO 黑客攻击事件幕后](https://www.chainalysis.com/blog/chainalysis-podcast-episode-6-badgerdao-hack/)
- BadgerDAO / Mandiant — [BadgerDAO 漏洞利用技术事后分析](https://www.badger.tools/technical-post-mortem)