---
title: '当ICANN自身遭到钓鱼攻击：2014年针对互联网核心机构的鱼叉式网络钓鱼事件'
date: '2026-06-17'
language: zh-CN
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['aileen-wright']
editors: ['victor-zhou']
translators: ['fenwei-bian']
draft: false
description: '2014年底，ICANN——协调互联网域名系统的机构——承认，一封伪造其自身域名的鱼叉式钓鱼邮件窃取了员工凭证，攻击者由此获得了对集中区域数据系统（CZDS）的管理员访问权限。Domain Mayday深度解析：DNS权威机构本身是如何遭到钓鱼攻击的、哪些数据被暴露，以及这一事件至今仍有何警示意义。'
keywords: ['icann泄露', 'icann鱼叉式钓鱼', 'czds', '集中区域数据系统', 'dns安全', '域名安全', '鱼叉式钓鱼攻击', '凭证钓鱼', '区域文件', 'iana', '加盐密码哈希', '域名系统泄露', 'icann 2014黑客攻击']
relatedArticles:
  - /zh-CN/blog/the-godaddy-multi-year-breach/
  - /zh-CN/blog/the-fox-it-dns-hijack/
  - /zh-CN/blog/the-myetherwallet-bgp-dns-attack/
  - /zh-CN/blog/the-2024-squarespace-defi-domain-hijacks/
  - /zh-CN/blog/the-dnspionage-campaign/
relatedTopics:
  - /zh-CN/topics/domain-security/
  - /zh-CN/topics/domain-basics/
relatedSeries:
  - /zh-CN/series/domain-apocalypse/
  - /zh-CN/series/name-change-game-change/
relatedGlossary:
  - /zh-CN/glossary/icann/
  - /zh-CN/glossary/registrar/
  - /zh-CN/glossary/dns/
  - /zh-CN/glossary/tld/
  - /zh-CN/glossary/registry/
---

有一类新闻头条会让整个安全行业为之一震。不是"又一家零售商遭到入侵"，不是"又一家初创公司泄露数据库"——而是那个所有人都*信赖*的机构，承认自己以最平凡的方式被黑了。

2014年12月，这个机构正是[ICANN](/zh-CN/glossary/icann/)。互联网名称与数字地址分配机构——这个协调整个[域名系统](/zh-CN/glossary/dns/)的非营利组织，守护着让`namefi.io`、`google.com`以及地球上所有其他地址都能解析到服务器的规则——公开披露：其部分员工点击了一封伪造邮件中的链接，在一个伪造的登录页面上输入了密码，将内部系统的钥匙拱手相让给攻击者——其中包括集中区域数据系统（CZDS），即全球顶级域名区域文件的申请与访问平台。

这个定义互联网信任机制的组织，遭到了钓鱼攻击。攻击者使用了一封伪装成来自ICANN自身的电子邮件。

这是**Domain Mayday第11集**——那个"威胁来自内部"的集数。

## ICANN是谁，为何此次泄露具有象征意义

要理解这个故事为何如此震撼，你必须先了解ICANN究竟做什么。

ICANN不是你购买域名的公司。它处于更高的一层。它协调让互联网得以导航的全球唯一标识符体系：顶级域名（`.com`、`.org`、`.io`及数百个新域名）、注册机构和[注册商](/zh-CN/glossary/registrar/)遵循的规则，以及——通过其[IANA](/zh-CN/glossary/iana/)职能——DNS层级体系的最顶端，即所有查询最终依赖的[根区域](/zh-CN/glossary/root-zone/)。

如果说域名是互联网的地址，那么ICANN就是邮局的主目录。注册商遭到入侵是糟糕的。ICANN遭到入侵则具有象征意义，因为ICANN本应是*权威机构*——其职责正是维护命名系统的秩序与可信度。当互联网名称的权威机构被攻陷，那个令人不安的问题显而易见：如果*连它们*都会被钓鱼，还有谁能幸免？

## 2014年底：入侵经过

![色彩鲜艳的概念艺术图：一封欺诈性的官方信件悄悄绕过持有一圈闪耀互联网主密钥的巨大守卫，信件发出红色光芒，密钥则发出蓝色光芒](../../assets/the-icann-spear-phishing-breach-01-breach.jpg)

ICANN在[其官方公告](https://www.icann.org/en/announcements/details/icann-targeted-in-spear-phishing-attack--enhanced-security-measures-implemented-16-12-2014-en#:~:text=We%20believe%20a%20%22spear%20phishing%22%20attack%20was%20initiated%20in%20late%20November%202014.)中以令人钦佩的直率态度梳理了时间线，该公告于2014年12月16日发布："我们认为，一次'鱼叉式网络钓鱼'攻击于2014年11月下旬启动。"

攻击手法近乎侮辱性地简单。ICANN描述，此次攻击"[涉及精心伪装成来自我们自己域名的电子邮件，发送给我们的员工](https://www.icann.org/en/announcements/details/icann-targeted-in-spear-phishing-attack--enhanced-security-measures-implemented-16-12-2014-en#:~:text=It%20involved%20email%20messages%20that%20were%20crafted%20to%20appear%20to%20come%20from%20our%20own%20domain%20being%20sent%20to%20members%20of%20our%20staff.)"。员工收到的邮件看起来像是来自`icann.org`——来自ICANN内部。有人点击了链接。据The Register还原，这些员工"[点击了邮件中的链接，被引导至一个虚假的登录页面——员工在那里输入了他们的用户名和密码](https://www.theregister.com/security/2014/12/17/icann-hacked-intruders-poke-around-global-dns-innards/624044#:~:text=clicked%20on%20a%20link%20in%20the%20messages%20that%20took%20them%20to%20a%20bogus%20login%20page)"，将工作邮件凭证拱手相让。The Register对缺失防御措施的简练评论是："[没有双因素认证的迹象，可见一斑。](https://www.theregister.com/security/2014/12/17/icann-hacked-intruders-poke-around-global-dns-innards/624044#:~:text=No%20sign%20of%20two%2Dfactor%20authentication%2C%20then.)"

后果，用ICANN自己的话说："[此次攻击导致数名ICANN员工的电子邮件凭证遭到泄露。](https://www.icann.org/en/announcements/details/icann-targeted-in-spear-phishing-attack--enhanced-security-measures-implemented-16-12-2014-en#:~:text=The%20attack%20resulted%20in%20the%20compromise%20of%20the%20email%20credentials%20of%20several%20ICANN%20staff%20members.)" Help Net Security的描述更为直白："[数名员工被骗，将其电子邮件凭证交给了](https://www.helpnetsecurity.com/2014/12/18/icann-systems-breached-via-spear-phishing-emails/#:~:text=Several%20staff%20members%20were%20fooled%20into%20handing%20over%20their%20email%20credentials)"攻击者。

没有零日漏洞，没有奇异的恶意软件。一封逼真的电子邮件和一个伪造的登录框——互联网上最古老的把戏，却用在了帮助运营互联网的人身上。

## 被访问的内容：处于核心的区域数据系统

仅凭窃取的电子邮件凭证本已是严重事件。让这次泄露成为*Domain Mayday*素材的，是攻击者*凭借*这些凭证所触达的内容。

2014年12月初，ICANN发现被盗的登录凭证被重复用于访问其他系统。最严重的是**集中区域数据系统**（CZDS）——该平台供授权方申请和下载全球通用顶级域名区域文件。ICANN的披露措辞严峻："[攻击者获得了对CZDS中所有文件的管理员访问权限。](https://www.icann.org/en/announcements/details/icann-targeted-in-spear-phishing-attack--enhanced-security-measures-implemented-16-12-2014-en#:~:text=The%20attacker%20obtained%20administrative%20access%20to%20all%20files%20in%20the%20CZDS.)"

*管理员*权限。访问*所有*文件。The Register解释了其中的重要性：CZDS"[向授权方提供对全球通用顶级域名所有区域文件的访问](https://www.theregister.com/security/2014/12/17/icann-hacked-intruders-poke-around-global-dns-innards/624044#:~:text=gives%20authorized%20parties%20access%20to%20all%20the%20zone%20files%20of%20the%20world%27s%20generic%20top%2Dlevel%20domains)"。该系统的*用户*并非普通人——正如The Register所指出，他们是"[全球众多注册机构和注册商的管理员](https://www.theregister.com/security/2014/12/17/icann-hacked-intruders-poke-around-global-dns-innards/624044#:~:text=many%20of%20the%20administrators%20of%20the%20world%27s%20registries%20and%20registrars)"。攻击者不只是进入了一个数据库，而是进入了命名系统守门人自己登录的那个数据库。

除区域文件外，此次泄露还暴露了CZDS用户的注册个人信息。据ICANN披露，被盗数据"[包括系统中的区域文件副本，以及用户填写的信息，如姓名、邮政地址、电子邮件地址、传真和电话号码、用户名及密码](https://www.icann.org/en/announcements/details/icann-targeted-in-spear-phishing-attack--enhanced-security-measures-implemented-16-12-2014-en#:~:text=This%20included%20copies%20of%20the%20zone%20files%20in%20the%20system%2C%20as%20well%20as%20information%20entered%20by%20users)"。管理顶级域名的人员的用户名和密码——就这样暴露在攻击者凭借窃取徽章大摇大摆走进的系统中。

凭证的触角延伸得更远。ICANN确认，攻击者还访问了**GAC Wiki**（政府咨询委员会的空间）、**ICANN博客**以及**[WHOIS](/zh-CN/glossary/whois/)信息门户**，不过报告称[后两个系统未受影响](https://www.helpnetsecurity.com/2014/12/18/icann-systems-breached-via-spear-phishing-emails/#:~:text=The%20latter%20two%20were%20not%20affected%20in%20any%20way.)，wiki上也仅有有限的查看行为。

## 事件经过：那枚写着"ICANN"的徽章

![色彩鲜艳的概念艺术图：夜晚，域名系统的控制塔，一枚单独伪造的印有对勾的发光徽章打开了它的大门，而真正的守卫们浑然不觉地站在一旁，红色光束从内部泄漏而出](../../assets/the-icann-spear-phishing-breach-02-spear-phishing.jpg)

剥去技术层面的包装，这次攻击不过是一场骗局。

鱼叉式钓鱼与普通网络钓鱼的区别在于其精准性。它不是向数百万人发送垃圾邮件等待有人上钩，而是针对特定人员发送少量精心定制的信息，伪装成例行的内部通信。此处的伪装是所能想到的最强大的一种：邮件看起来来自`icann.org`。正如The Register所总结的，"[攻击者向员工发送了伪装成来自icann.org的欺骗性邮件。](https://www.theregister.com/security/2014/12/17/icann-hacked-intruders-poke-around-global-dns-innards/624044#:~:text=Attackers%20sent%20staff%20spoofed%20emails%20appearing%20to%20coming%20from%20icann.org.)"

想想其中的心理学逻辑。来自自己组织域名的邮件不会触发警觉，看起来和你每天使用的一样的登录页面也不会。整个攻击利用了这样一个事实：*内部的*和*熟悉的*感觉与*安全的*相同——但它们并不相同。地址栏显示的是一回事，页面背后却将输入的一切悉数收割。

ICANN唯一真正的缓解措施在于存储层面：被盗密码并非以明文存储。正如披露文件所述，"[密码以加盐加密哈希的形式存储](https://www.icann.org/en/announcements/details/icann-targeted-in-spear-phishing-attack--enhanced-security-measures-implemented-16-12-2014-en#:~:text=Although%20the%20passwords%20were%20stored%20as%20salted%20cryptographic%20hashes)"——比明文存储要好，但正如The Register指出的，这种保护的前提是用户没有在其他地方重复使用相同的登录凭证，因为哈希值仍然可以被离线破解。泄露事件并不随着下载完成而结束，而是开启了一场防御者轮换密码与攻击者尝试逆向破解之间的缓慢竞赛。

## 应对与后续

值得称赞的是，ICANN在信息披露方面的表现好于事件防范本身。

事件发生后数周内，ICANN即公开披露，停用了CZDS密码，通知了受影响的用户，并且——值得注意的是——将透明度定位为一种责任而非负担。该组织表示，"[公开提供此次事件的信息，不仅因为我们对开放和透明的承诺，也因为分享网络安全信息有助于各方评估对其系统的威胁](https://www.icann.org/en/announcements/details/icann-targeted-in-spear-phishing-attack--enhanced-security-measures-implemented-16-12-2014-en#:~:text=providing%20information%20about%20this%20incident%20publicly%2C%20not%20just%20because%20of%20our%20commitment%20to%20openness%20and%20transparency)"。ICANN还报告称，当年早些时候启动的一项安全强化计划"[有助于限制此次攻击中获得的未授权访问](https://www.icann.org/en/announcements/details/icann-targeted-in-spear-phishing-attack--enhanced-security-measures-implemented-16-12-2014-en#:~:text=these%20enhancements%20helped%20limit%20the%20unauthorized%20access%20obtained%20in%20the%20attack)"。

对于更广泛的互联网而言，最重要的一行是关于*没有*沦陷的内容。ICANN确认："[此次攻击不影响任何与IANA相关的系统](https://www.icann.org/en/announcements/details/icann-targeted-in-spear-phishing-attack--enhanced-security-measures-implemented-16-12-2014-en#:~:text=this%20attack%20does%20not%20impact%20any%20IANA%2Drelated%20systems)"。IANA——正如Help Net Security所描述的，其职能是"[管理域名系统（DNS）中的根区域](https://www.helpnetsecurity.com/2014/12/18/icann-systems-breached-via-spear-phishing-emails/#:~:text=manages%20the%20root%20zone%20in%20the%20Domain%20Name%20System)"——是互联网命名金字塔的实际顶端。若攻击者得以触及，这就不仅仅是一次令人难堪的数据泄露，而将是一场结构性危机。

时机让这场尴尬更为严峻。The Register的标题直白写道：这次"[鱼叉式钓鱼攻击的时机对域名监管机构而言再糟糕不过了](https://www.theregister.com/security/2014/12/17/icann-hacked-intruders-poke-around-global-dns-innards/624044#:~:text=Spear%2Dphishing%20attack%20timing%20couldn%27t%20be%20worse%20for%20domain%20name%20overseer)"。原因何在？因为ICANN"[希望在明年获得关键IANA合同的控制权](https://www.theregister.com/security/2014/12/17/icann-hacked-intruders-poke-around-global-dns-innards/624044#:~:text=it%20will%20prove%20extremely%20embarrassing%20to%20ICANN%2C%20which%20hopes%20to%20be%20handed%20control%20of%20the%20critical%20IANA%20contract%20next%20year)"——正是彼时正在谈判中的那项管理权移交。遭到钓鱼攻击，并不是"请相信我们来掌管DNS核心"的有力表现。（作为背景，这也并非ICANN在2014年首次遭遇CZDS安全事故：The Register指出，4月曾发生过一起早期事件，"[一些用户被错误地授予了系统管理员权限](https://www.theregister.com/security/2014/12/17/icann-hacked-intruders-poke-around-global-dns-innards/624044#:~:text=a%20number%20of%20users%20were%20wrongly%20given%20admin%20access%20to%20the%20system)"。）

而且，这批数据产生了长久的后遗症。ICANN在2017年2月21日追加至公告的更新中承认，此次泄露的信息正在重新浮现："[2014年我们宣布的鱼叉式钓鱼事件中获得的部分信息，正在地下论坛上被出售](https://www.icann.org/en/announcements/details/icann-targeted-in-spear-phishing-attack--enhanced-security-measures-implemented-16-12-2014-en#:~:text=some%20information%20obtained%20in%20the%20spear%20phishing%20incident%20we%20announced%20in%202014%20is%20being%20offered%20for%20sale%20on%20underground%20forums)"。CyberScoop报道了多年后的市场行情："[这些数据仍在黑市上流转，售价300美元](https://cyberscoop.com/hacked-icann-data-still-sells-hundreds-dollars-years-breach/#:~:text=the%20data%20is%20still%20being%20passed%20around%20and%20sold%20on%20black%20markets%20for%20%24300)"，甚至声称从未曾外泄。2014年底的一次点击，在2017年仍在持续创造销售收益。

## 这件事的教训：所有人都可能被钓鱼，包括DNS权威机构

第11集的教训不是"ICANN太粗心"。它揭示的是更令人警醒的真相。

**所有人都可能被钓鱼。** 不只是粗心的人。不只是未经培训的人。*所有人。* 这个从字面上管理互联网名称的组织——员工日常工作就是思考DNS、安全和基础设施——仍有数名员工因为邮件看起来像内部邮件，就在伪造页面上输入了他们的凭证。钓鱼攻击击败的不是你的知识，而是你的注意力——就在那点击的两秒钟里。

这一事件留下了几点经久不衰的启示：

1. **凭证就是边界。** 攻击者从未破解ICANN的加密算法，也未利用任何服务器漏洞。他们只是借用了一个密码。一旦身份是门禁，盗取身份就是入侵——这正是网络钓鱼至今仍是全球最可靠攻击手段的原因。
2. **特权系统中的多因素认证不是可选项。** The Register关于"[没有双因素认证的迹象](https://www.theregister.com/security/2014/12/17/icann-hacked-intruders-poke-around-global-dns-innards/624044#:~:text=No%20sign%20of%20two%2Dfactor%20authentication%2C%20then.)"的讽刺，正切中要害。第二重验证因素很可能将一次凭证盗窃化为无关痛痒的小事。
3. **横向移动是放大器。** 损害来自*重复使用*——电子邮件登录凭证被重复用于访问CZDS、Wiki和门户。隔离访问权限，不让一个被盗凭证打开多扇门，才能遏制泄露的蔓延。
4. **泄露的数据永久存在。** 2017年的转售证明，"我们已重置密码"能关闭事件，但无法关闭暴露本身。姓名、地址和电话号码无法被"取消泄露"。
5. **权威不等于免疫。** 作为定义信任的机构，并不能让你免疫于针对信任的最基础攻击。如果说有什么不同，那就是它让你成为更具吸引力的目标。

## Namefi的视角

![色彩丰富的插图：可验证、防篡改的域名所有权——一张由绿色盾牌、绿色Namefi代币和DNS连续性保障的域名卡片](../../assets/the-icann-spear-phishing-breach-03-namefi-angle.jpg)

ICANN事件从本质上说，是一个关于*谁控制记录*的故事——以及这种控制如何通过一个中心化系统上的单次登录被劫持。

这是值得深思的结构性弱点。当证明谁有权访问或管理关键域名数据的凭据，只是某个平台上的一个用户名和密码，那么一旦这些凭据遭到网络钓鱼，整个信任模型就会瞬间崩塌。没有第二道检查。一封逼真的邮件加上一个重复使用的密码，就足以获得对命名世界核心区域数据系统的管理员访问权限。

[Namefi](https://namefi.io) 基于一个不同的前提而构建：[域名所有权](/zh-CN/glossary/domain-ownership/)和控制权应当是**可验证的、防篡改的，且不依赖于单一收件箱中的单一秘密。** 通过将域名所有权表示为与DNS兼容的[链上](/zh-CN/glossary/on-chain/)代币，控制权成为一种可以通过密码学证明和审计的东西——而不仅仅是一个可能被鱼叉式钓鱼邮件窃取的密码所把守的大门。这并不能让任何人对钓鱼攻击免疫；没有什么能做到。但它缩小了爆炸半径，使得一个被盗的凭证不再距离王国的钥匙只有一步之遥。

第11集留下的持久意象，是那封伪造的信件，因为穿上了正确的制服，得以从互联网主密钥的守卫者身旁大摇大摆地走过。解决之道不是培养更聪明的守卫，而是构建一个密钥本身能够证明其真实性的系统。

## 参考来源与延伸阅读

- ICANN — [ICANN遭到鱼叉式网络钓鱼攻击 | 已实施强化安全措施](https://www.icann.org/en/announcements/details/icann-targeted-in-spear-phishing-attack--enhanced-security-measures-implemented-16-12-2014-en)（一手资料，含2017年更新）
- The Register — [ICANN遭黑客攻击：入侵者窥探全球DNS内部](https://www.theregister.com/security/2014/12/17/icann-hacked-intruders-poke-around-global-dns-innards/624044)
- Help Net Security — [ICANN系统通过鱼叉式钓鱼邮件遭到入侵](https://www.helpnetsecurity.com/2014/12/18/icann-systems-breached-via-spear-phishing-emails/)
- Computerworld — [ICANN数据在鱼叉式钓鱼攻击中被泄露](https://www.computerworld.com/article/1487605/icann-data-compromised-in-spearphishing-attack.html)
- WeLiveSecurity (ESET) — [ICANN计算机遭黑客入侵](https://www.welivesecurity.com/2014/12/18/icann-computers-compromised-hackers/)
- Associations Now — [ICANN系统在"鱼叉式网络钓鱼"攻击中遭到渗透](https://associationsnow.com/2014/12/icann-systems-infiltrated-spear-phishing-attack/)
- Slate — [ICANN遭到黑客攻击](https://slate.com/technology/2014/12/icann-hacked-in-spear-phishing-campaign.html)
- Domain Incite — [被黑客窃取的ICANN数据在黑市出售](http://domainincite.com/21562-hacked-icann-data-for-sale-on-black-market)
- Slashdot — [黑客入侵ICANN，访问区域文件数据系统](https://tech.slashdot.org/story/14/12/18/1540233/hackers-compromise-icann-access-zone-file-data-system)
- CyberScoop — [被黑客窃取的ICANN数据在泄露数年后仍以数百美元出售](https://cyberscoop.com/hacked-icann-data-still-sells-hundreds-dollars-years-breach/)
- DomainGang — [ICANN向CZDS和ICANN Wiki用户发出安全泄露警报](https://domaingang.com/domain-news/icann-alerts-users-czds-icann-wiki-security-breach/)
