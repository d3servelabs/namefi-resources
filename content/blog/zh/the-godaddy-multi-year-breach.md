---
title: 'GoDaddy 多年数据泄露事件：入侵者如何在全球最大的域名注册商内部潜伏三年'
date: '2026-06-17'
language: zh
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: '在2020年至2022年期间，同一个威胁行为者组织潜伏在 GoDaddy 的基础设施中——窃取源代码，导致 120 万托管 WordPress 客户数据泄露，并间歇性地将客户网站重定向到恶意站点。本文深入探讨了注册商集中度风险及其在单点故障方面带给我们的惨痛教训。'
keywords: ['godaddy 数据泄露', 'godaddy 漏洞', '托管 wordpress 数据泄露', '注册商安全', '域名安全', '多年数据泄露', 'cpanel 恶意软件', '网站重定向攻击', 'ssl 私钥泄露', 'sftp 密码泄露', 'sec 10-k 网络安全', '注册商集中度风险', '单点故障']
---

域名注册商可能是你所完全依赖的、最无聊的公司了。

你每年向它付一次钱。你也许一年只登录两次。作为交换，它掌握着让你业务保持可达性的唯一命脉：“宣告这个名字指向这里”的权利。电子邮件、网站、登录、支付——你拥有的每一条数字脉络，都贯穿于控制你域名 DNS 的人手中。大多数人在结账后，就再也不会想起这家公司了。

然而，在两年多的时间里，一个复杂的威胁行为者组织却在无时无刻地惦记着 GoDaddy。他们甚至“住”在了里面。

GoDaddy 是全球最大的域名注册商，拥有数千万客户和超过 8000 万个管理中的域名。据 GoDaddy 目前认为，至少在 2019 年底到 2022 年底之间，同一个顽固的入侵者反复穿梭于其系统中——窃取源代码，导致 120 万托管 WordPress（Managed WordPress）客户的数据泄露，甚至一度悄悄篡改随机的客户网站，将访问者重定向到恶意站点。该公司并未将其描述为单一的黑客入侵事件。在提交给美国证券交易委员会（SEC）的一份文件中，他们将其描述为 [由复杂的威胁行为者组织发起的一场跨越多年的攻击活动](https://www.bleepingcomputer.com/news/security/godaddy-hackers-stole-source-code-installed-malware-in-multi-year-breach/#:~:text=Based%20on%20our%20investigation%2C%20we%20believe%20these%20incidents%20are%20part%20of%20a%20multi%2Dyear%20campaign%20by%20a%20sophisticated%20threat%20actor%20group)。

当你技术栈底层那家无聊的公司，同时也是其他数百万人的单点故障点时，这就是真实的写照。

## 为什么一个注册商会成为数百万人的单点故障

集中度是大众市场注册商整个商业模式的核心。这种经济学只有在巨大规模下才能奏效：同一个配置系统、同一个控制面板、同一个凭证存储库、同一组托管服务器，服务于所有人。这种高效性正是 GoDaddy 提供便利的根本原因——而一旦攻击者潜入，这也正是它变得极其危险的原因。

当一家小型企业遭到黑客攻击时，这家企业会度过糟糕的一周。而当掌握着数百万企业域名、网站和证书的平台遭到黑客攻击时，爆炸半径（波及范围）就不再只是一家公司了。所有将自己名字（域名）托付给这家公司的人，都将受到波及。

这就是注册商风险核心的不对称性。在客户体验中，GoDaddy 是属于他们自己的私人控制面板。而在攻击者眼中，它是一个一次性装有数百万把钥匙的金库——而你只需要撬开一次锁。

在这里，有必要准确界定“单点故障”的含义，因为它同时存在于两个层面上。第一层是注册商层面：决定你域名 DNS 指向的权威机构。如果这部分被攻破，攻击者就可以将你的整个域名（包括电子邮件及所有相关服务）重定向到其他地方。第二层是托管和证书层面：提供并验证你实际网站的服务器、凭证和 SSL 密钥。GoDaddy 是极少数能同时为同一个客户提供这两个层面服务的公司之一。因此，当同一个入侵者在攻击活动中触及到它的配置系统、托管服务器和证书材料时，他们并不是在毫不相干的受害者之间徘徊。他们是在同一家公司内部穿梭，而这家公司恰好拥有着开启数百万扇相同大门的各种不同的钥匙。

![生动多彩的概念艺术：一个巨大的中央金库，从地板到天花板堆满了数百万把发光的域名钥匙，一个模糊的入侵者身影舒适地坐在折叠椅上，仿佛在那里住了好几年，戏剧性的灯光](../../assets/the-godaddy-multi-year-breach-01-breach.jpg)

## 时间线：2019 → 2022

GoDaddy 事件中最令人不安的不是任何单一事件。而是当把这些事件联系在一起审查时，它们拼凑成了一场长达数年的“占领”。GoDaddy 自己也只是在事后才将这些线索串联起来。

**2019年底 / 2020年3月 —— 初步立足。** 在 2020 年披露的一起泄露事件中，GoDaddy [提醒28,000名客户，有攻击者在2019年10月使用了他们的网络托管账户凭证](https://www.bleepingcomputer.com/news/security/godaddy-hackers-stole-source-code-installed-malware-in-multi-year-breach/#:~:text=GoDaddy%20alerted%2028%2C000%20customers%20that%20an%20attacker%20used%20their%20web%20hosting%20account%20credentials%20in%20October%202019) 通过 SSH 连接到他们的托管账户。攻击者不需要零日漏洞；他们只需要凭证，而他们确实拿到了。后来的安全报告将这一波攻击归咎于社会工程学——攻击者 [在电话中伪装](https://krebsonsecurity.com/2023/02/when-low-tech-hacks-cause-high-impact-breaches/) 欺骗员工和客户交出访问权限。正如 GoDaddy 向 InformationWeek 总结的那样，[在2020年3月，一名威胁行为者获取了28,000名客户的登录凭证](https://www.informationweek.com/cyber-resilience/godaddy-hit-with-multiyear-breach-#:~:text=In%20March%202020%2C%20a%20threat%20actor%20compromised%20the%20login%20credentials%20of%2028%2C000%20customers)。

**2021年9月至11月 —— 重大泄露。** 2021年11月22日，GoDaddy 披露了其托管 WordPress 环境的数据泄露事件。这笔时间账令人触目惊心：[GoDaddy于2021年11月17日发现了该事件](https://www.bleepingcomputer.com/news/security/godaddy-data-breach-hits-12-million-managed-wordpress-customers/#:~:text=The%20incident%20was%20discovered%20by%20GoDaddy%20last%20Wednesday%2C%20on%20November%2017%2C%20but%20the%20attackers%20had%20access%20to%20its%20network%20and%20the%20data%20contained%20on%20the%20breached%20systems%20since%20at%20least%20September%206%2C%202021) —— 但攻击者至少自 2021 年 9 月 6 日起就获得了访问权限。这相当于大约两个半月未被察觉的潜伏。据 TechCrunch 报道，[未授权人员在9月6日左右使用泄露的密码获取了进入GoDaddy系统的权限](https://techcrunch.com/2021/11/22/godaddy-breach-million-accounts/#:~:text=the%20unauthorized%20person%20used%20a%20compromised%20password%20to%20get%20access%20to%20GoDaddy%27s%20systems%20around%20September%206)。

**2022年12月 —— 恶意软件与重定向。** 一年后，同样的模式再次浮现。GoDaddy [在2022年12月初收到客户报告，称他们的网站被用于重定向到随机域名](https://www.bleepingcomputer.com/news/security/godaddy-hackers-stole-source-code-installed-malware-in-multi-year-breach/#:~:text=customer%20reports%20in%20early%20December%202022%20that%20their%20sites%20were%20being%20used%20to%20redirect%20to%20random%20domains)。随后的调查促成了 2023 年 2 月的披露 —— 并让他们意识到，这并不是一个新的攻击者，而是自 2020 年以来一直在反复进行的同一场攻击活动。

按顺序读下来，这不是三起独立的数据泄露事件。而是同一个“长期居民”的三次现身。

让这条时间线显得如此触目惊心的是每次发现之间的空白期。先是几个月，然后是一年。每一次单独的事件，在披露时看起来都像是一个有着明确起止的独立事件——这里重置一次密码，那里重新签发一次证书。直到 GoDaddy 的调查人员顺着 2022 年 12 月的恶意软件，逆向追踪其工具和方法时，这些事件才不再像是巧合，而是形成了一种模式。整份披露文件里最令人不寒而栗的一句话是，他们悄悄承认这种情况在任何人将其联系起来之前，就已经持续了数年。

## 泄露了什么 —— 以及那些反咬主人的网站

2021 年托管 WordPress 的泄露事件是损害最清晰、最容易量化的一次。GoDaddy 提交给 SEC 的通知中清楚地说明了这一点。

多达 120 万活跃和非活跃的托管 WordPress 客户的电子邮件地址和客户编号被泄露。更糟的是，[配置时设置的初始 WordPress 管理员密码也被泄露了](https://www.bleepingcomputer.com/news/security/godaddy-data-breach-hits-12-million-managed-wordpress-customers/#:~:text=The%20original%20WordPress%20Admin%20password%20that%20was%20set%20at%20the%20time%20of%20provisioning%20was%20exposed) —— 这可是那些 WordPress 安装包的万能钥匙。对于活跃客户，sFTP 和数据库的用户名及密码被曝光，这些是允许直接上传文件和读取数据库的凭证。而对于最敏感的一小部分群体，[SSL 私钥也泄露了](https://www.bleepingcomputer.com/news/security/godaddy-data-breach-hits-12-million-managed-wordpress-customers/#:~:text=For%20a%20subset%20of%20active%20customers%2C%20the%20SSL%20private%20key%20was%20exposed) —— 这是证明网站真实身份的加密机密。

把这些加在一起，你便得到了一个“最坏情况”的攻击工具包。管理员密码让你进入网站；sFTP 和数据库访问权限让你能在文件和数据层面上篡改它；而 SSL 私钥 —— 正如 Wordfence 在其 [对漏洞的分析](https://www.wordfence.com/blog/2021/11/godaddy-breach-plaintext-passwords/) 中指出的那样 —— 可以让攻击者冒充该网站或解密其流量。一个本应作为信任锚点的注册商，却把伪造信任的材料递给了入侵者。

| 泄露的内容 | 受影响群体 | 带来的风险 |
| --- | --- | --- |
| 邮箱 + 客户编号 | 多达120万活跃和非活跃客户 | 针对性钓鱼攻击、账户映射 |
| 初始 WordPress 管理员密码 | 受影响客户（如果仍在使用） | 完全控制 WordPress 安装 |
| sFTP + 数据库凭证 | 活跃客户 | 文件级和数据库级的网站篡改 |
| SSL 私钥 | 部分活跃客户 | 网站冒充、流量解密 |

泄露的波及范围告诉你，为什么这与常规的网站黑客攻击在性质上完全不同。常规的黑客攻击会攻破一个网站。而在这里，共享配置系统中的一个漏洞，就一次性暴露了超过一百万个网站的钥匙。

然后是将数据泄露变成切肤之痛的部分：客户网站开始将访问者重定向到恶意站点。2022 年 12 月，GoDaddy 表示，[未经授权的第三方获取了我们 cPanel 托管服务器的访问权限并安装了恶意软件](https://www.sophos.com/en-us/blog/godaddy-admits-crooks-hit-us-with-malware-poisoned-customer-websites/#:~:text=an%20unauthorized%20third%20party%20gained%20access%20to%20and%20installed%20malware%20on%20our%20cPanel%20hosting%20servers)，并且 [该恶意软件间歇性地将随机的客户网站重定向到了恶意站点](https://www.sophos.com/en-us/blog/godaddy-admits-crooks-hit-us-with-malware-poisoned-customer-websites/#:~:text=The%20malware%20intermittently%20redirected%20random%20customer%20websites%20to%20malicious%20sites)。这里的“间歇性”和“随机”是极其残忍的词汇。如果每次都触发重定向很容易被发现；但在某些网站上、对某些访客、偶尔触发一次重定向，小企业主在报告后往往无法重现——而他们的主机服务商也会将其视为偶然的故障而打发掉。这是内置在攻击中的绝佳伪装。

## 这一切是如何发生的：不是锁被撬了，而是钥匙被“借”了

GoDaddy 事件中最令人不安的教训是，最初的入侵竟然如此“朴实无华”。

这一切的核心并没有什么新奇的零日漏洞。第一波攻击利用的是被盗用的凭证；2021 年的泄露事件则源于 [一个遭泄露的密码](https://www.bleepingcomputer.com/news/security/godaddy-hackers-stole-source-code-installed-malware-in-multi-year-breach/#:~:text=1.2%20million%20Managed%20WordPress%20customers%20after%20attackers%20breached%20GoDaddy%27s%20WordPress%20hosting%20environment%20using%20a%20compromised%20password)。Krebs on Security 将其对此次活动的分析文章命名为 [《当低科技黑客引发高影响泄露》](https://krebsonsecurity.com/2023/02/when-low-tech-hacks-cause-high-impact-breaches/) —— 正是因为其造成的影响与入侵手段的技术含量极度不成比例。如果有人把钥匙递给你，你就根本不需要去攻破金库。

潜入之后，攻击者做出了极具耐心且专业的举动：他们留了下来。在整个攻击活动期间，GoDaddy 称这些攻击者 [在我们的系统上安装了恶意软件，并获取了与 GoDaddy 内部某些服务相关的部分代码](https://www.bleepingcomputer.com/news/security/godaddy-hackers-stole-source-code-installed-malware-in-multi-year-breach/#:~:text=installed%20malware%20on%20our%20systems%20and%20obtained%20pieces%20of%20code%20related%20to%20some%20services%20within%20GoDaddy)。被盗的源代码并不是一次性的损失；它是一张地图。它告诉攻击者，他们潜伏的系统实际是如何运作的——薄弱环节在哪里、身份验证流程是怎样的、下一步该攻击什么。加上持久的恶意软件，这就是“打砸抢”与“长期占领”的区别。正如 BleepingComputer 总结 GoDaddy 自己的结论那样，[威胁行为者能够在公司的系统上安装恶意软件并窃取代码](https://www.informationweek.com/cyber-resilience/godaddy-hit-with-multiyear-breach-#:~:text=Threat%20actors%20were%20able%20to%20install%20malware%20on%20the%20company%27s%20systems%20and%20steal%20code)，且这种情况在几年间反复发生。

检测滞后是故事的另一半。2021 年事件中迟钝了两个半月；从整体来看更是横跨了数年。与其说攻击者比 GoDaddy 的防御速度快，不如说他们比 GoDaddy 的监控系统还要安静。

![生动多彩的概念艺术：一把发光的万能钥匙正在转动，一次性打开了整面高耸墙壁上数百个信箱门，微弱的恶意软件触须像藤蔓一样沿着墙壁蔓延，戏剧性的霓虹灯光，无标志](../../assets/the-godaddy-multi-year-breach-02-persistent-access.jpg)

## 应对与余波

GoDaddy 对 2021 年泄露事件的第一时间的直接技术响应是标准的剧本化操作：重置暴露的 sFTP 和数据库密码，并开始为私钥泄露的客户重新签发和安装新的 SSL 证书。对于 2023 年 2 月的披露，该公司表示他们聘请了外部取证专家和执法部门介入，并将该攻击者描述为一个复杂的、有组织的针对托管服务提供商的团伙——而不是一个孤立的投机分子。

但声誉和监管层面的余波持续时间远超事件响应本身。这一系列数据泄露事件引来了美国联邦贸易委员会（FTC）的审查，该委员会于 2025 年 [就数据安全漏洞与 GoDaddy 达成了最终命令](https://www.ftc.gov/news-events/news/press-releases/2025/05/ftc-finalizes-order-godaddy-over-data-security-failures)，指控该公司尽管在营销服务时做出了安全保证，却未能实施合理的安全措施，并要求其建立一个全面的信息安全保障计划。一场因一个被“借用”密码开始的数据泄露事件，多年后最终以一项联邦同意令画上了句号。

披露的时间线本身也招致了批评：“历时多年”的定性直到 2023 年 2 月才通过一份 SEC 10-K 文件公之于众，这意味着客户在得知 2020、2021 和 2022 年的事件相互关联时，距离每一件事件单独被报道已经过去很久了。

这种时间先后顺序的背后隐藏着更深层的问责问题。每一份单独的披露只引发了微小的回应——改个密码，接受个新证书，然后继续生活。但被告知了三个独立的“孤立事件”故事的客户，根本无法理解他们可能正面临着一个在其数据附近潜伏了多年的、顽固的对手。数据泄露事件的定性框架影响了下游人群对待它的严肃程度。报送三场“小火灾”和报送一场“连年大火”，给人的感觉截然不同。

## 这给注册商集中度风险带来了什么教训

抛开具体细节不谈，GoDaddy 遭受的这场攻击活动是一个生动的案例，诠释了为什么注册商集中度本身就是一种风险类别。

1. **平台就是战利品。** 攻击者不必将矛头指向你。他们针对的是掌握着你和其他数百万用户的那家公司。如果你的注册商的配置系统是一个软柿子，你自身的安全姿态根本无济于事——无论你是否愿意，你都必然承受其爆炸半径的波及。

2. **凭证才是大门，而不是漏洞利用。** 在这场事件中，大部分损害是由一个遭泄露的密码造成的。多因素身份验证、凭证卫生以及积极的异常检测比任何单一的花哨防御措施都重要——因为入口几乎总是被“借走”的权限，而不是被暴力撬开的锁。

3. **潜伏时间（Dwell time）才是真正的指标。** 数据泄露固然糟糕。但攻击者在你的配置系统中不被察觉地潜伏几个月甚至几年，那才是灾难性的恶化，因为持久性会产生复利效应。破坏力取决于他们停留的时间，而不仅仅是他们进来了。

4. **机密集中等于故障集中。** 将管理员密码、sFTP 凭证和 SSL 私钥存放在一个地方并且可恢复，这种做法在遭遇单一的“最坏情况”之前确实很方便。当同一个存储库容纳了 120 万客户的钥匙时，一次泄露就等于 120 万次泄露。

5. **网站重定向是客户的噩梦，而不是注册商的。** 当 GoDaddy 的服务器将客户网站重定向到恶意目的地时，付出代价的是客户的品牌、客源和 SEO —— 尽管客户本身并没有做错任何事。集中度风险在很大程度上是“被别人的错误所伤害”的风险。

这一切并不是在说“永远不要使用大型注册商”。规模能带来真正的安全投资，而且小型服务商同样会出错。它的意思是，你必须明白，当你将域名托付给一个平台时，你也在接受“平台最糟糕的一天，可能就是你最糟糕的一天”这种现实。

## Namefi 的视角

![可验证、防篡改域名所有权的多彩插图 —— 一个受绿色盾牌保护的域名卡、一个绿色的 Namefi 代币，以及 DNS 的连续性](../../assets/the-godaddy-multi-year-breach-03-namefi-angle.jpg)

GoDaddy 事件暴露出最深层次的问题并不是恶意软件。而是一个域名的所有权和控制权完全依附于单一服务提供商的私人数据库中 —— 在长达几年的时间里，入侵者可以从内部读取、修改和冒充这个数据库，而合法所有者却完全没有独立的渠道去知晓这一切。

[Namefi](https://namefi.io) 建立在一种完全不同的默认设定之上：域名应该像互联网原生资产一样，其所有权是可验证且防篡改的，而不是单家公司账户系统中的一行数据——你只能通过登录并祈祷一切安好来确认。代币化的所有权使得“谁真正控制了这个域名？”这个问题可以独立于任何单一服务提供商在外部得到解答——它是可审计的、可移植的，而且很难被悄悄篡改——同时它仍兼容 DNS，从而保证域名的持续解析。

这并不意味着注册商就是不可被黑客攻击的。世界上没有绝对无法攻破的东西。但它改变了数据泄露在暗中能造成的后果。当所有权证明存在于一个可验证的、独立的层上，而不是只存在于被攻破的平台内部时，“入侵者在数据库里住了两年”就不再等同于“入侵者控制了谁拥有什么”。GoDaddy 的故事展示了当控制权和所有权证明同属一个脆弱的实体并被集中存放在一处时，会发生什么。我们得到的教训就是：不要再把它们放在那里了。

## 来源与延伸阅读

- BleepingComputer — [GoDaddy：黑客窃取了源代码并在多年的违规行为中安装了恶意软件](https://www.bleepingcomputer.com/news/security/godaddy-hackers-stole-source-code-installed-malware-in-multi-year-breach/)
- BleepingComputer — [GoDaddy 数据泄露事件波及 120 万托管 WordPress 客户](https://www.bleepingcomputer.com/news/security/godaddy-data-breach-hits-12-million-managed-wordpress-customers/)
- Krebs on Security — [当低科技黑客引发高影响泄露时](https://krebsonsecurity.com/2023/02/when-low-tech-hacks-cause-high-impact-breaches/)
- Sophos — [GoDaddy 承认：不法分子用恶意软件攻击了我们，毒害了客户网站](https://www.sophos.com/en-us/blog/godaddy-admits-crooks-hit-us-with-malware-poisoned-customer-websites)
- The Hacker News — [GoDaddy 披露多年安全漏洞事件，导致恶意软件安装和源代码被盗](https://thehackernews.com/2023/02/godaddy-discloses-multi-year-security.html)
- TechCrunch — [GoDaddy 称数据泄露暴露了超过一百万个用户账户](https://techcrunch.com/2021/11/22/godaddy-breach-million-accounts/)
- SecurityWeek — [GoDaddy 数据泄露导致 120 万托管 WordPress 客户账户曝光](https://www.securityweek.com/godaddy-breach-exposes-12-million-managed-wordpress-customer-accounts/)
- InformationWeek — [GoDaddy 遭受多年数据泄露攻击](https://www.informationweek.com/cyber-resilience/godaddy-hit-with-multiyear-breach-)
- BankInfoSecurity — [GoDaddy 确认泄露事件影响 120 万客户](https://www.bankinfosecurity.com/godaddy-confirms-breach-affects-12-million-customers-a-17974)
- Wordfence — [GoDaddy 数据泄露 — 明文密码 — 120万受影响](https://www.wordfence.com/blog/2021/11/godaddy-breach-plaintext-passwords/)
- 美国联邦贸易委员会（FTC） — [FTC 就数据安全漏洞与 GoDaddy 达成了最终命令](https://www.ftc.gov/news-events/news/press-releases/2025/05/ftc-finalizes-order-godaddy-over-data-security-failures)
- GoDaddy (提交至 SEC) — [安全事件通知，2021年11月22日](https://www.sec.gov/Archives/edgar/data/1609711/000160971121000122/gddyblogpostnov222021.htm)