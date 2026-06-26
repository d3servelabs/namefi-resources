---
title: 'GoDaddy 长达数年的安全入侵事件：黑客如何在全球最大域名注册商内部潜伏三年'
date: '2026-06-17'
language: zh
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: '2020 年至 2022 年间，同一威胁行为者组织长期潜伏于 GoDaddy 的基础设施内部——盗取源代码、暴露 120 万 Managed WordPress 客户的数据，并间歇性地将客户网站重定向至恶意站点。本文深入剖析注册商集中化风险，以及这一事件揭示的单点故障问题。'
keywords: ['godaddy 入侵', 'godaddy 数据泄露', 'managed wordpress 泄露', '注册商安全', '域名安全', '多年持续入侵', 'cpanel 恶意软件', '网站重定向攻击', 'ssl 私钥泄露', 'sftp 密码泄露', 'sec 10-k 网络安全', '注册商集中化风险', '单点故障']
relatedArticles:
  - /zh/blog/the-fox-it-dns-hijack/
  - /zh/blog/the-dnspionage-campaign/
  - /zh/blog/the-lenovo-com-dns-hijack/
  - /zh/blog/the-badgerdao-frontend-attack/
  - /zh/blog/the-icann-spear-phishing-breach/
relatedTopics:
  - /zh/topics/domain-security/
  - /zh/topics/domain-basics/
relatedSeries:
  - /zh/series/domain-apocalypse/
  - /zh/series/name-change-game-change/
relatedGlossary:
  - /zh/glossary/registrar/
  - /zh/glossary/dns/
  - /zh/glossary/icann/
  - /zh/glossary/web3/
  - /zh/glossary/tld/
---

域名[注册商](/zh/glossary/registrar/)是你完全依赖却又最容易忽视的公司。

你一年付一次费，也许只登录两次。作为回报，它掌管着让你的业务可被访问的那一件事：宣告"这个域名指向这里"的权力。电子邮件、网站、登录、支付——你拥有的每一条数字线索，都穿过控制你域名 DNS 的那家公司。大多数人在结账之后就再也不会想起这家公司了。

然而，超过两年的时间里，一个精心策划的威胁行为者组织一刻不停地盯着 GoDaddy，并且已经住在里面了。

GoDaddy 是全球最大的域名注册商，拥有数千万客户，管理超过 8000 万个域名。GoDaddy 现在认为，从至少 2019 年底到 2022 年底，同一名持续性入侵者在其系统中反复穿行——盗取源代码、暴露 120 万 Managed WordPress 客户的数据，并在某个时间点悄悄篡改随机客户的网站，将访客重定向至恶意目的地。该公司并未将其描述为一次单独的入侵事件。而是在向美国证券交易委员会提交的文件中，将其描述为[一个复杂威胁行为者组织发动的多年持续攻击行动](https://www.bleepingcomputer.com/news/security/godaddy-hackers-stole-source-code-installed-malware-in-multi-year-breach/#:~:text=Based%20on%20our%20investigation%2C%20we%20believe%20these%20incidents%20are%20part%20of%20a%20multi%2Dyear%20campaign%20by%20a%20sophisticated%20threat%20actor%20group)。

这就是当你技术栈底层那家看似无聊的公司，成为数百万其他人的单点故障时，真实的模样。

## 为什么一家注册商会成为数百万人的单点故障

集中化，正是大众市场注册商的核心商业模式。这种经济模式只有在巨大规模下才能运转：一套配置系统、一个控制面板、一个凭证存储库、一组托管服务器，为所有人提供服务。这种高效性正是 GoDaddy 方便易用的原因——也正是当攻击者入侵时它如此危险的原因。

当一家小企业被黑客攻击，倒霉的只是那一家企业。当持有数百万企业域名、网站和证书的平台被攻击，爆炸半径就不再局限于一家公司，而是所有将自己的域名托付给那家公司的人。

这就是注册商风险核心的不对称性。客户眼中的 GoDaddy 是自己的私人控制台，而攻击者眼中的它却是一个同时存放着数百万把钥匙的保险库——只需撬开一次锁就够了。

有必要精确地说明"单点故障"在这里的含义，因为它同时在两个层面上运作。第一层是注册商层：决定你的域名 DNS 指向何处的权威机构。一旦该层被攻破，攻击者就可以将你的整个域名（包括电子邮件）重定向到别处。第二层是托管和证书层：提供和验证你实际网站的服务器、凭证和 SSL 密钥。GoDaddy 是极少数同时在这两个层面上为同一客户提供服务的公司。因此，当同一入侵者在整个攻击行动中触及其配置系统、托管服务器和证书材料时，他们并不是在不相关的受害者之间来回切换，而是在一家公司内部四处活动——这家公司恰好同时持有通往数百万扇门的几种不同钥匙。

![生动多彩的概念艺术：一个巨型中央保险库从地板到天花板堆满了数百万把发光的域名钥匙，一个阴影般的入侵者人物舒适地坐在折叠椅上，仿佛已在此生活了多年，戏剧性的灯光效果](../../assets/the-godaddy-multi-year-breach-01-breach.jpg)

## 时间线：2019 → 2022

GoDaddy 事件中最令人不安的，不是任何单一事件，而是这些事件合在一起，拼凑出一段长达数年的"占领"历史。GoDaddy 自己也是事后才将这些碎片串联起来的。

**2019 年底 / 2020 年 3 月——第一个立足点。** 在 2020 年披露的一次泄露事件后，GoDaddy [通知了 28,000 名客户，告知攻击者于 2019 年 10 月使用了他们的网络托管账户凭证](https://www.bleepingcomputer.com/news/security/godaddy-hackers-stole-source-code-installed-malware-in-multi-year-breach/#:~:text=GoDaddy%20alerted%2028%2C000%20customers%20that%20an%20attacker%20used%20their%20web%20hosting%20account%20credentials%20in%20October%202019)通过 SSH 连接到他们的托管账户。攻击者不需要零日漏洞，他们只需要凭证，而他们得到了。安全报道后来将这一波攻击归因于社会工程——攻击者[通过电话冒充](https://krebsonsecurity.com/2023/02/when-low-tech-hacks-cause-high-impact-breaches/)员工或客户，诱骗对方交出访问权限。正如 GoDaddy 向 InformationWeek 所总结的，[2020 年 3 月，一名威胁行为者盗取了 28,000 名客户的登录凭证](https://www.informationweek.com/cyber-resilience/godaddy-hit-with-multiyear-breach-#:~:text=In%20March%202020%2C%20a%20threat%20actor%20compromised%20the%20login%20credentials%20of%2028%2C000%20customers)。

**2021 年 9 月至 11 月——最大的一次。** 2021 年 11 月 22 日，GoDaddy 披露了其 Managed WordPress 托管环境遭到入侵的事件。数字触目惊心：[该事件于 2021 年 11 月 17 日被 GoDaddy 发现](https://www.bleepingcomputer.com/news/security/godaddy-data-breach-hits-12-million-managed-wordpress-customers/#:~:text=The%20incident%20was%20discovered%20by%20GoDaddy%20last%20Wednesday%2C%20on%20November%2017%2C%20but%20the%20attackers%20had%20access%20to%20its%20network%20and%20the%20data%20contained%20on%20the%20breached%20systems%20since%20at%20least%20September%206%2C%202021)——但攻击者从至少 2021 年 9 月 6 日起就已获得访问权限。这意味着将近两个半月的未被发现的潜伏。正如 TechCrunch 报道的，[未经授权的人员大约于 9 月 6 日使用一个被盗密码获得了对 GoDaddy 系统的访问权限](https://techcrunch.com/2021/11/22/godaddy-breach-million-accounts/#:~:text=the%20unauthorized%20person%20used%20a%20compromised%20password%20to%20get%20access%20to%20GoDaddy%27s%20systems%20around%20September%206)。

**2022 年 12 月——恶意软件与重定向。** 一年后，同样的模式再次浮现。GoDaddy [于 2022 年 12 月初收到客户反映，称其网站被用于重定向至随机域名](https://www.bleepingcomputer.com/news/security/godaddy-hackers-stole-source-code-installed-malware-in-multi-year-breach/#:~:text=customer%20reports%20in%20early%20December%202022%20that%20their%20sites%20were%20being%20used%20to%20redirect%20to%20random%20domains)。随后展开的调查促成了 2023 年 2 月的披露——以及这样一个认识：这并不是一个新的攻击者，而是从 2020 年以来就持续发生的同一攻击行动。

按时间顺序读下来，这不是三次独立的入侵，而是对同一名长期"驻客"的三次目击。

这条时间线如此引人注目，正是因为目击事件之间的空白期。几个月，然后是一年。每一次单独的事件在被披露时，看起来都像是有头有尾的独立事件——这里重置一个密码，那里重新颁发一张证书。直到 GoDaddy 的调查人员将 2022 年 12 月的恶意软件追溯至其工具和手法，这些事件才不再显得像是巧合，而更像是一种规律。整个披露中最令人不寒而栗的一句话，是那句悄无声息的承认：这一切早在任何人将其关联起来之前，已经持续了多年。

## 什么被暴露了——以及那些"反咬"主人的网站

2021 年 Managed WordPress 泄露事件是损失最为清晰、量化最为充分的一次。GoDaddy 向 SEC 提交的通知文件直白地说明了情况。

多达 120 万名活跃和非活跃的 Managed WordPress 客户的电子邮件地址和客户编号遭到暴露。更糟糕的是，[在配置时设置的原始 WordPress 管理员密码也遭到暴露](https://www.bleepingcomputer.com/news/security/godaddy-data-breach-hits-12-million-managed-wordpress-customers/#:~:text=The%20original%20WordPress%20Admin%20password%20that%20was%20set%20at%20the%20time%20of%20provisioning%20was%20exposed)——这是进入这些 WordPress 安装的主密钥。对于活跃客户而言，sFTP 和数据库的用户名及密码也被暴露，而这些凭证可以让人直接上传文件并读取数据库。对于最敏感的那部分用户，[SSL 私钥也遭到暴露](https://www.bleepingcomputer.com/news/security/godaddy-data-breach-hits-12-million-managed-wordpress-customers/#:~:text=For%20a%20subset%20of%20active%20customers%2C%20the%20SSL%20private%20key%20was%20exposed)——这是证明一个网站真实身份的加密密钥。

将这些叠加在一起，就是一套最坏情况下的攻击工具包。管理员密码让你进入网站；sFTP 和数据库访问权限让你在文件和数据层面对其进行篡改；而 SSL [私钥](/zh/glossary/private-key/)——正如 Wordfence 在其[对该泄露事件的分析](https://www.wordfence.com/blog/2021/11/godaddy-breach-plaintext-passwords/)中所指出的——可以让攻击者冒充一个网站或解密其流量。一家本应提供信任基础的注册商，却将伪造信任所需的材料拱手相让。

| 泄露内容 | 受影响对象 | 可解锁的权限 |
| --- | --- | --- |
| 电子邮件 + 客户编号 | 多达 120 万名活跃及非活跃客户 | 定向钓鱼、账户关联 |
| 原始 WordPress 管理员密码 | 受影响客户（如仍在使用） | 完全控制 WordPress 安装 |
| sFTP + 数据库凭证 | 活跃客户 | 文件级和数据库级网站篡改 |
| SSL 私钥 | 部分活跃客户 | 网站身份冒充、流量解密 |

暴露范围之广说明了为何此次事件的性质与普通的网站黑客攻击截然不同。普通攻击只危害一个网站，而这里，共享配置系统中的单次入侵，一举暴露了超过一百万个网站的密钥。

然后是将数据泄露事件变得触目惊心的那一部分：客户网站开始将访客重定向至恶意网站。2022 年 12 月，GoDaddy 表示，[一名未经授权的第三方获得了访问权限，并在我们的 cPanel 托管服务器上安装了恶意软件](https://www.sophos.com/en-us/blog/godaddy-admits-crooks-hit-us-with-malware-poisoned-customer-websites/#:~:text=an%20unauthorized%20third%20party%20gained%20access%20to%20and%20installed%20malware%20on%20our%20cPanel%20hosting%20servers)，并且[该恶意软件间歇性地将随机客户网站重定向至恶意网站](https://www.sophos.com/en-us/blog/godaddy-admits-crooks-hit-us-with-malware-poisoned-customer-websites/#:~:text=The%20malware%20intermittently%20redirected%20random%20customer%20websites%20to%20malicious%20sites)。"间歇性"和"随机"是这里最残酷的两个词。每次都触发的重定向很容易被发现；而有时触发、对某些访客、在某些网站上触发的重定向，却是小企业主反映后无法复现的那种情况——其托管服务商可以将其归咎于偶发故障。这种隐蔽性本身就是攻击的伪装。

## 攻击是如何发生的：借来的钥匙，而非破开的锁

GoDaddy 事件最令人不安的教训，是入口的平淡无奇。

这个故事的核心没有什么异于常人的零日漏洞。第一波攻击依赖的是盗取的凭证；2021 年的泄露依赖的是[一个被盗密码](https://www.bleepingcomputer.com/news/security/godaddy-hackers-stole-source-code-installed-malware-in-multi-year-breach/#:~:text=1.2%20million%20Managed%20WordPress%20customers%20after%20attackers%20breached%20GoDaddy%27s%20WordPress%20hosting%20environment%20using%20a%20compromised%20password)。Krebs on Security 将其对此次攻击行动的分析文章命名为["低技术手段如何造成高影响泄露"](https://krebsonsecurity.com/2023/02/when-low-tech-hacks-cause-high-impact-breaches/)——正是因为其影响与入侵方式的复杂程度之间的反差如此悬殊。如果有人把钥匙递给你，你根本不需要去攻破保险库。

一旦入侵成功，攻击者做了最有耐心、最专业的事：留了下来。在整个攻击行动过程中，GoDaddy 表示，行为者们[在我们的系统上安装了恶意软件，并获取了 GoDaddy 内部某些服务相关的部分代码](https://www.bleepingcomputer.com/news/security/godaddy-hackers-stole-source-code-installed-malware-in-multi-year-breach/#:~:text=installed%20malware%20on%20our%20systems%20and%20obtained%20pieces%20of%20code%20related%20to%20some%20services%20within%20GoDaddy)。盗取的源代码不是一次性损失，而是一张地图——它告诉攻击者他们已经身处其中的系统实际上是如何运作的：薄弱环节在哪里、认证流程如何运转、下一个目标是什么。加上持久性恶意软件，这就是砸窗抢劫与长期占领之间的区别。正如 BleepingComputer 对 GoDaddy 自身结论的总结，[威胁行为者能够在公司系统上安装恶意软件并盗取代码](https://www.informationweek.com/cyber-resilience/godaddy-hit-with-multiyear-breach-#:~:text=Threat%20actors%20were%20able%20to%20install%20malware%20on%20the%20company%27s%20systems%20and%20steal%20code)，并且这种情况在多年间反复发生。

检测延迟是故事的另一半。2021 年事件中有两个半月的检测空白，整个攻击行动跨度更是长达数年。攻击者并不比 GoDaddy 的防御更快，而是比它的监控更安静。

![生动多彩的概念艺术：一把发光的骷髅钥匙被转动，同时打开整整一面由数百个邮箱门组成的高墙，隐约可见恶意软件的触须像藤蔓一样沿着墙壁蔓延，戏剧性的霓虹灯光，无品牌标志](../../assets/the-godaddy-multi-year-breach-02-persistent-access.jpg)

## 应对与后续

GoDaddy 对 2021 年泄露事件的即时技术应对遵循了标准操作手册：重置暴露的 sFTP 和数据库密码，并开始为私钥泄露的客户重新颁发和安装新的 SSL 证书。对于 2023 年 2 月的披露，该公司表示已聘请外部取证专家并配合执法部门，并将该行为者定性为针对托管服务商的有组织的复杂犯罪团伙，而非孤立的机会主义者。

然而，声誉和监管方面的后续影响远比事件响应持续更久。这一系列泄露事件引起了美国联邦贸易委员会的关注，后者于 2025 年[就数据安全违规问题与 GoDaddy 达成最终命令](https://www.ftc.gov/news-events/news/press-releases/2025/05/ftc-finalizes-order-godaddy-over-data-security-failures)，指控该公司在以安全承诺营销其服务的同时，未能实施合理的安全措施，并要求其建立全面的信息安全计划。一次起源于密码被盗的入侵，多年后以联邦同意令告终。

披露时间线本身也饱受批评：多年攻击行动的完整描述直到 2023 年 2 月才通过 SEC 10-K 文件公之于众，这意味着客户是在每次事件被单独披露很久之后，才得知 2020 年、2021 年和 2022 年的事件其实相互关联。

这种时序安排背后埋藏着一个更深层的问责问题。每次单独的披露只会引发小范围的应对——改个密码、接受一张新证书、然后继续前行。但一个被告知了三次"孤立事件"的客户，根本无法理解他们可能面对的是一个持续盯着他们数据多年的同一对手。泄露事件的呈现方式，深刻影响着下游用户对其重视程度的判断。三场小火灾和一场持续燃烧的大火，给人的感受截然不同。

## 这告诉我们什么：注册商集中化风险

剥去具体细节，GoDaddy 攻击事件是一堂关于注册商集中化为何是其独特风险类别的经典课程。

1. **平台本身就是攻击目标。** 攻击者不必针对你，他们瞄准的是同时持有你和其他百万用户的那家公司。如果你的注册商的配置系统是软肋，你自己的安全姿态几乎无关紧要——无论你愿不愿意，你都已经承接了它的爆炸半径。

2. **凭证是前门，而非漏洞。** 被盗密码造成了这里大部分的损失。多因素认证、凭证卫生以及积极的异常检测，比任何单一花哨的防御都更重要——因为入口几乎总是借来的访问权限，而非被破开的锁。

3. **潜伏时间才是真正的衡量指标。** 数据暴露固然糟糕，但攻击者在你的配置系统中数月或数年不被发现地潜伏，则是灾难性的——因为持久性会复利叠加。损害是停留时长的函数，而不仅仅是入侵这个事实本身。

4. **集中的秘密就是集中的失败。** 将管理员密码、sFTP 凭证和 SSL 私钥集中存储在一处、可随时恢复，在一切正常时固然方便，但一旦出事就会造成最坏情况下的单点损失。当同一个存储库持有 120 万名客户的密钥，一次泄露就等于 120 万次泄露。

5. **网站重定向是客户的噩梦，不是注册商的。** 当 GoDaddy 的服务器将客户网站重定向至恶意目的地时，受损的是客户的品牌、客户群体和 SEO——尽管他们什么都没做错。集中化风险，在很大程度上是因他人的失误而遭受伤害的风险。

这并不意味着"永远不要使用大型注册商"。规模带来真实的安全投入，而小型服务商同样会出问题。这意味着你要理解：当你将域名交给某个平台，你就是在接受那个平台最糟糕的一天，作为你自己某个可能的糟糕版本。

## Namefi 的视角

![多彩插图：可验证、防篡改的域名所有权——一张由绿色盾牌保护的域名卡、一枚绿色 Namefi 代币，以及 DNS 的持续性](../../assets/the-godaddy-multi-year-breach-03-namefi-angle.jpg)

GoDaddy 攻击行动所揭示的最深层问题，不是恶意软件，而是域名的所有权与控制权完全存在于一家服务商的私有数据库中——而这个数据库，多年来被入侵者从内部读取、篡改和冒充，真正的所有者却没有任何独立的手段来察觉。

[Namefi](https://namefi.io) 建立在一个不同的默认原则之上：域名应该像互联网原生资产一样运作，其所有权可验证、防篡改，而不是单一公司账户系统中的一行记录——你只能通过登录并祈祷的方式来确认它的存在。代币化所有权让"谁真正控制这个域名"这个问题，可以从任何单一服务商之外得到回答——可审计、可转移、难以被悄悄改写——同时保持与 DNS 的兼容性，使域名持续正常解析。

这并不能让注册商变得不可被黑客攻击——没有什么能做到这一点。但它改变了泄露事件能够悄悄做到什么。当所有权的证明存在于一个可验证的独立层，而不是仅仅存在于被攻破的平台内部时，"入侵者在数据库中潜伏了两年"就不再等同于"入侵者控制了谁拥有什么"。GoDaddy 的故事，是控制权和证明被捏合成同一件脆弱的事物、存放在同一个地方时所发生的一切。教训是：不要再把它们放在那里了。

## 来源与延伸阅读

- BleepingComputer — [GoDaddy: Hackers stole source code, installed malware in multi-year breach](https://www.bleepingcomputer.com/news/security/godaddy-hackers-stole-source-code-installed-malware-in-multi-year-breach/)
- BleepingComputer — [GoDaddy data breach hits 1.2 million Managed WordPress customers](https://www.bleepingcomputer.com/news/security/godaddy-data-breach-hits-12-million-managed-wordpress-customers/)
- Krebs on Security — [When Low-Tech Hacks Cause High-Impact Breaches](https://krebsonsecurity.com/2023/02/when-low-tech-hacks-cause-high-impact-breaches/)
- Sophos — [GoDaddy admits: Crooks hit us with malware, poisoned customer websites](https://www.sophos.com/en-us/blog/godaddy-admits-crooks-hit-us-with-malware-poisoned-customer-websites)
- The Hacker News — [GoDaddy Discloses Multi-Year Security Breach Causing Malware Installations and Source Code Theft](https://thehackernews.com/2023/02/godaddy-discloses-multi-year-security.html)
- TechCrunch — [GoDaddy says data breach exposed over a million user accounts](https://techcrunch.com/2021/11/22/godaddy-breach-million-accounts/)
- SecurityWeek — [GoDaddy Breach Exposes 1.2 Million Managed WordPress Customer Accounts](https://www.securityweek.com/godaddy-breach-exposes-12-million-managed-wordpress-customer-accounts/)
- InformationWeek — [GoDaddy Hit with Multiyear Breach](https://www.informationweek.com/cyber-resilience/godaddy-hit-with-multiyear-breach-)
- BankInfoSecurity — [GoDaddy Confirms Breach Affects 1.2 Million Customers](https://www.bankinfosecurity.com/godaddy-confirms-breach-affects-12-million-customers-a-17974)
- Wordfence — [GoDaddy Breach — Plaintext Passwords — 1.2M Affected](https://www.wordfence.com/blog/2021/11/godaddy-breach-plaintext-passwords/)
- U.S. Federal Trade Commission — [FTC Finalizes Order with GoDaddy over Data Security Failures](https://www.ftc.gov/news-events/news/press-releases/2025/05/ftc-finalizes-order-godaddy-over-data-security-failures)
- GoDaddy (via SEC) — [Notice of Security Incident, November 22, 2021](https://www.sec.gov/Archives/edgar/data/1609711/000160971121000122/gddyblogpostnov222021.htm)
