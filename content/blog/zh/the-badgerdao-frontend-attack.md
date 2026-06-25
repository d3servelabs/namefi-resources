---
title: 'BadgerDAO 前端攻击事件：一段注入脚本让 1.2 亿美元不翼而飞'
date: '2026-06-17'
language: zh
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: '2021 年 12 月，攻击者入侵了 BadgerDAO 的 Cloudflare 账户，并向其网站前端注入了一段恶意脚本。经过审计的智能合约从未被触动——然而约 1.2 亿美元的资产通过用户在毫不知情的情况下签署的钱包授权悄然流失。深度解析：为何网站本身也是你的安全防线的一部分。'
keywords: ['badgerdao 黑客攻击', 'badgerdao 前端攻击', 'cloudflare api 密钥泄露', '注入脚本攻击', 'web3 前端安全', '冰钓攻击', 'increaseAllowance 攻击', '代币授权漏洞', 'dns 与域名安全', 'cloudflare workers 漏洞', 'defi 安全', 'web3 供应链攻击', '网站篡改', '域名安全']
---

审计结果是干净的。合约没有问题。但钱还是消失了。

2021 年 12 月 2 日前后，BadgerDAO——一个旨在将比特币引入[去中心化金融](/zh/glossary/defi/)的 DeFi 项目——损失了约 **1.2 亿美元**的用户资金。没有闪电贷技巧，没有重入漏洞，也没有针对金库的巧妙数学攻击。[智能合约](/zh/glossary/smart-contract/)完全按照设计运行。攻击者从未需要攻破它们，因为攻击者根本就没有去攻击它们。

他攻击的是*网站*。

有人悄悄地将一段恶意脚本注入了 app.badger.com 的前端。对每一个加载页面的用户而言，看起来都是他们每天使用的那个可信 dApp。但当他们尝试与之交互时，页面向其[钱包](/zh/glossary/wallet/)请求了一个额外的、不可见的权限——一旦他们点击"批准"，他们的代币便不再属于自己了。

这就是一个拥有经审计合约的项目，如何因为一行注入的前端代码而损失九位数资金的故事。它也将永久地改变你对安全边界的认知。

## 那个令人安心的谎言："合约已经过审计"

加密货币文化训练用户在信任一个协议之前只问一个问题：*它审计了吗？* 审计确实很重要，它能发现真正的漏洞。但不知从何时起，"合约已通过审计"这句话固化成了一种全面安全的感觉——仿佛一份干净的审计报告是包裹所有项目相关事物的防护力场。

它并不是。

审计检查的是[链上](/zh/glossary/on-chain/)代码：金库、代币逻辑、访问控制。它对开发者遗忘了登出的笔记本电脑、将浏览器指向某处的 [DNS](/zh/glossary/dns/) 记录、站在网站前面的 CDN，或者你访问 dApp 时浏览器实际下载并运行的 JavaScript，只字不提。这些都存在于 *Web2* 世界——云账户、API 密钥和域名基础设施——它们与 Solidity 代码同样至关重要。

BadgerDAO 是这一差距在历史上最清晰的证明。正如对该事件的一份技术分析所直言不讳地指出的：[从项目智能合约的角度来看，什么都没有出错](https://www.halborn.com/blog/post/explained-the-badgerdao-hack-december-2021#:~:text=From%20the%20perspective%20of%20the%20project%27s%20smart%20contracts%2C%20nothing%20had%20gone%20wrong)，攻击者只是在使用用户授予的权限。区块链运行得无懈可击。网站在撒谎。

## 攻击过程：一家被篡改的店面，却开出了干净的收据

![生动的彩色概念艺术图：一家人们信赖的友善店铺，其收银机被悄悄篡改，一个隐藏的抽屉在顾客正常笑着付款时暗中抽走硬币](../../assets/the-badgerdao-frontend-attack-01-attack.jpg)

想象一下走进一家你光顾了百次的商店。同样的招牌，同样的员工，同样的柜台。你买了件小东西，收银员结账，你刷卡。一切看起来都很寻常。你看不到的是，有人把刷卡机换成了一个同时悄悄授权向陌生人的账户进行二次无限额收费的机器——随时随地，只要对方愿意。

这实际上就是 BadgerDAO 用户所经历的事情。

这里的分类很重要，因为正是这一点让这次事件如此具有启示意义。正如 *Vice* 所总结的，这次黑客攻击[并不涉及复杂的智能合约漏洞。相反，这是一次针对 BadgerDAO 网络基础设施的前端攻击](https://www.vice.com/en/article/hackers-steal-dollar119m-from-web3-crypto-project-with-old-school-attack/#:~:text=injected%20a%20malicious%20script%20into%20BadgerDAO%27s%20frontend)——尤其是其 Cloudflare 账户。用他们的话说，这是一次指向 [Web3](/zh/glossary/web3/) 目标的*老派* Web 攻击。

攻击机制优雅而隐秘。恶意脚本要求用户的钱包向攻击者地址授予代币花费额度。用 Vice 的话说，[该恶意脚本基本上诱骗人们将向漏洞利用者地址发送代币的权限授予了那个地址](https://www.vice.com/en/article/hackers-steal-dollar119m-from-web3-crypto-project-with-old-school-attack/#:~:text=The%20malicious%20script%20basically%20tricked%20people%20into%20giving)。用户以为自己在进行正常的 dApp 操作。实际上他们是在签署放弃代币控制权的文件。

安全研究人员将这种模式称为*冰钓（ice phishing）*：不是窃取你的[私钥](/zh/glossary/private-key/)，而是欺骗你自愿批准一个恶意花费者。签名是真实的。授权是真实的。链上交易是有效的。这正是它如此危险的原因——也是为何任何合约审计都无法阻止它的原因。

## 用户的损失：约 1.2 亿美元，一次签名一次

对于一次从未触动任何一行金库代码的攻击来说，这些数字令人震惊。

智能合约审计公司 PeckShield [估计总损失约为 1.2 亿美元](https://cryptobriefing.com/120m-lost-badgerdao-defi-hack/)。BadgerDAO 自己的事后分析（在事件案例研究中被引用）将损失定为[约 2076.54 BTC（按黑客攻击时的价格约合 1.163 亿美元）](https://www.quadrigainitiative.com/casestudy/badgerdaomaliciouscodeinjected.php#:~:text=2076.54%20BTC)（将所有被盗资产换算为统一计价单位后）。

损失并非均匀分布。据报道，某机构账户在单笔交易中损失了其中最大的份额：案例研究指出，[约 900 BTC 从 Yearn wBTC 金库中被转走](https://www.quadrigainitiative.com/casestudy/badgerdaomaliciouscodeinjected.php)，仅一方就损失了[价值超过 5000 万美元的封装比特币](https://www.quadrigainitiative.com/casestudy/badgerdaomaliciouscodeinjected.php#:~:text=lose%20over%20%2450%20million)。其余部分则由数百名普通用户承担。

而如此规模的损失，正是耐心的直接结果。攻击者没有慌乱出手。正如 Forta 的分析所描述的，[黑客悄悄积累了近 200 个账户的授权，然后在 2021 年 12 月 2 日凌晨 12:48，黑客在不到 10 小时内清空了受害者的钱包](https://forta.org/blog/how-to-derail-a-120-million-dollar-hack#:~:text=The%20hacker%20silently%20accumulated%20approvals%20from%20almost%20200%20accounts)。恶意授权已悄悄积累了数天——一个装满的陷阱，一次性引爆。另一份重建报告统计，整个活动期间共有 [500 个钱包创建了这些无限额授权](https://www.halborn.com/blog/post/explained-the-badgerdao-hack-december-2021#:~:text=The%20attacker%20managed%20to%20get%20500%20wallets)。

最残酷的细节：谨慎的用户根本没有什么可以检查的。URL 是正确的。TLS 证书是有效的。界面是真实的。唯一有问题的，是合法网站本身正在提供的一段 JavaScript。

## 攻击原理：一个 Cloudflare API 密钥与一次注入的授权

![生动的彩色概念艺术图：一只无形的手悄悄地在钱包弹窗中添加了一个额外的发光"批准"按钮，而真实界面看起来平静可信，一行恶意代码悄然滑入一个友善的网页](../../assets/the-badgerdao-frontend-attack-02-injected-script.jpg)

攻击者使用的入口不是智能合约，而是一个云账户。

BadgerDAO 与现代网络中绝大多数网站一样，架设在 Cloudflare 背后——这个内容分发和边缘计算层负责服务并加速网站。控制该账户意味着控制 BadgerDAO 网站向访客分发的代码。而攻击者正是通过一个被盗的密钥获得了这种控制权。

根据 BadgerDAO 的官方声明（经 CoinDesk 转述），[黑客使用了一个在未经 Badger 工程师知情或授权的情况下创建的被盗 API 密钥，定期注入影响部分用户的恶意代码](https://www.coindesk.com/business/2021/12/10/badgerdao-reveals-details-of-how-it-was-hacked-for-120m)。"部分用户"这个措辞，是它长期未被发现的原因之一。脚本并非每次对所有人都触发，而是轮换式出现，只针对部分用户，使得恶意行为极难复现或察觉。

一个未经授权的 API 密钥究竟是如何存在的？根本原因追溯到 Cloudflare 账户的一个漏洞。事件案例研究指出，未经授权的用户可以创建账户，并且在[电子邮件验证完成之前](https://www.quadrigainitiative.com/casestudy/badgerdaomaliciouscodeinjected.php#:~:text=before%20email%20verification%20was%20completed)就能创建和查看（全局）API 密钥（这些密钥无法被删除或停用）。攻击者可以在账户上植入一个密钥，然后静静等待真正的所有者完成验证并激活账户——此时攻击者便悄悄持有了有效的 API 访问权限。

有了这个密钥，攻击者借助 Cloudflare Workers——Cloudflare 的边缘计算平台——在页面送达用户之前对其进行重写。BadgerDAO 与网络安全公司 Mandiant 合作撰写的事后分析报告得出结论：12 月 2 日的钓鱼事件，是由 Cloudflare Workers 提供的恶意注入代码片段所导致的。这段注入代码只做了一件重要的事：在 dApp 正常流程中插入了一个额外的代币授权请求。

甚至连*使用哪个*授权调用都经过了刻意的选择。CryptoBriefing 报道称，[黑客据称在 Badger 网站上插入了一段恶意脚本，向用户呈现了一个"increase allowance"（增加额度）的交易请求](https://cryptobriefing.com/120m-lost-badgerdao-defi-hack/#:~:text=presented%20users%20with%20a%20transaction%20to)。这个选择并非随机。与原始的 `approve` 调用相比，`increaseAllowance` 提示在钱包弹窗中往往呈现出更弱、更不触目惊心的视觉提示——更少的红色警告，更少的"你即将授予花费权限"的提示。攻击者优化了被抢劫时的*用户体验*。

因此，完整的攻击链看起来是这样的：Cloudflare 账户验证漏洞使未经授权的 API 密钥得以存在 → 攻击者用该密钥部署了一个 Worker → Worker 向 app.badger.com 注入了脚本 → 脚本请求钱包向攻击者授予代币额度 → 用户批准 → 攻击者将其清空。这整个过程没有一个步骤涉及经过审计的合约。

## 事件响应：暂停链上操作以遏制一个 Web2 伤口

12 月 2 日凌晨，清账交易大规模爆发，链上的踪迹终于无从回避，BadgerDAO 迅速行动——动用其智能合约，来阻止一个完全起源于链下的问题。

团队公开承认了这一事件，并据 CryptoBriefing 证实[所有智能合约已暂停，以防止进一步提款](https://cryptobriefing.com/120m-lost-badgerdao-defi-hack/)。由于 Badger 的金库具备暂停功能，冻结转账切断了攻击者继续转移新获批准资金的能力。一份技术报告将此次暂停描述为团队行使权力冻结所有对 `transferFrom` 函数的调用——而这正是恶意授权所利用的 [ERC-20](/zh/glossary/erc-20/) 机制。这次暂停也是部分损失理论上可以追回的原因：攻击者已转移了一些资产，但在冻结生效前尚未从 Badger 金库中完全提走。

在基础设施层面，清理工作就是凭证泄露后令人沮丧的 Web2 标准流程：轮换 Cloudflare API 密钥、更改账户密码、强化多因素认证，并审计所有不应存在的密钥。BadgerDAO 随后与 Mandiant 合作调查，并发布了技术事后分析报告，还原了时间线——Cloudflare 账户漏洞、此前几个月内创建的未授权密钥、11 月的脚本注入，以及 12 月的资产清空。

但无论事件响应多么迅速，都无法撤销用户已经签署的授权。那些签名是有效的。补救措施可以阻止*未来*的盗窃并追讨损失；却无法撤回已在链上授予的同意。

## 经验教训：网站是你安全防线的一部分

BadgerDAO 最重要的一课，是对边界认知的纠正。大多数团队——以及大多数用户——将安全边界划定在智能合约周围。BadgerDAO 证明了这个边界要大得多。

**1. 你的前端始终在范围之内。** 用户浏览器执行的代码是你协议的一部分，无论它是否存在于链上。如果攻击者控制了你的网站提供哪些 JavaScript，他们就控制了你用户的钱包——无论合约是否通过审计。网站不是"只不过是个 UI"。它是捕获用户同意的地方。

**2. 你的云账户和域名基础设施都是合约的一部分。** Cloudflare 账户、DNS 提供商登录、[注册商](/zh/glossary/registrar/)账户、CI/CD 密钥——每一个都是改写用户所见内容的通道。BadgerDAO 不是在金库层面被攻破的；它是在*控制网站的账户*层面被攻破的。用对待部署者私钥同等程度的偏执去保护这些凭证。

**3. API 密钥和账户创建流程是真实的攻击面。** 整场灾难的关键在于一个本不应存在的未授权 API 密钥，而这正是一个验证漏洞所造成的。清点每一个密钥，严格限定其权限范围，定期轮换，并对新密钥发出告警。你遗忘的密钥，就是攻击者可以使用的密钥。

**4. "已审计"是必要条件，而非充分条件。** 干净的审计是真正有价值的，你仍然应该去做。但它覆盖的是合约，而不是云账户、DNS、CDN 或前端构建流程。安全覆盖的是从用户浏览器到你的链上的完整路径——决定安全标准的是最薄弱的环节，而不是最强的那个。

**5. 用户无法通过检查来规避被篡改的前端。** "始终检查 URL"是个好建议，但在这里毫无用处。URL 是正确的。给用户的教训更为艰难：对授权和 `increaseAllowance` 提示保持高度警惕，优先使用能够解码并警告代币授权的钱包和工具，并定期撤销过时的授权。你批准的内容，比你所在的页面更重要。

## Namefi 的视角

![彩色插图：可验证、防篡改的域名和网络所有权——由绿色盾牌、绿色 Namefi 代币和 DNS 连续性保障](../../assets/the-badgerdao-frontend-attack-03-namefi-angle.jpg)

将 BadgerDAO 剥离到本质，它是一个**所有权与控制权**的问题。攻击者并不拥有 BadgerDAO 的网站——但在数周内，他们可以改变它所提供的内容。而*真正*拥有该项目的人，没有可靠的、可识别篡改的方式来得知，他们对网络存在的控制链——账户、密钥、边缘配置、DNS——已经被悄悄入侵。

这正是 [Namefi](https://namefi.io) 所关注的差距。Namefi 将域名和网络所有权视为一等公民、互联网原生的资产：可验证、可审计、更难被悄悄劫持的控制权，同时与 DNS 保持兼容。前端攻击面——谁控制着域名、它解析到哪里、背后架设了什么基础设施——不是智能合约之后的事后思考。正如 BadgerDAO 以最惨痛的方式所证明的，它*就是*安全模型的一部分。

你可以将合约审计得无懈可击。但如果一个未经授权的密钥可以改写你的网站，一段注入脚本可以收割用户的授权，那么审计从来就不是故事的全部。向真实用户交付你应用的域名、DNS 和网络基础设施，都是你安全防线的一部分。请如此对待它们——因为攻击者早已这样做了。

## 来源与延伸阅读

- CoinDesk — [BadgerDAO Reveals Details of How It Was Hacked for $120M](https://www.coindesk.com/business/2021/12/10/badgerdao-reveals-details-of-how-it-was-hacked-for-120m)
- Vice (Motherboard) — [Hackers Steal $119M From 'Web3' Crypto Project With Old School Attack](https://www.vice.com/en/article/hackers-steal-dollar119m-from-web3-crypto-project-with-old-school-attack/)
- Halborn — [Explained: The BadgerDAO Hack (December 2021)](https://www.halborn.com/blog/post/explained-the-badgerdao-hack-december-2021)
- Forta — [How to Derail a 120-Million-Dollar Hack](https://forta.org/blog/how-to-derail-a-120-million-dollar-hack)
- CryptoBriefing — [$120M Lost in BadgerDAO DeFi Hack](https://cryptobriefing.com/120m-lost-badgerdao-defi-hack/)
- Quadriga Initiative — [Dec 2021 — BadgerDAO Malicious Code Injected — $116.3m](https://www.quadrigainitiative.com/casestudy/badgerdaomaliciouscodeinjected.php)
- Chainalysis — [Behind The Scenes of The BadgerDAO Hack](https://www.chainalysis.com/blog/chainalysis-podcast-episode-6-badgerdao-hack/)
- BadgerDAO / Mandiant — [BadgerDAO Exploit Technical Post Mortem](https://www.badger.tools/technical-post-mortem)
