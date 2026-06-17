---
title: '域名危机 EP03：2020 年 Twitter 比特币账户劫持事件'
date: '2026-06-17'
language: zh
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: '2020 年 7 月 15 日，攻击者通过电话骗过了 Twitter，劫持了奥巴马、拜登、马斯克、盖茨、苹果和优步的认证账户，并策划了一场比特币翻倍骗局——净赚约 118,000 美元。本文深入剖析了在线身份控制权是如何被盗的，以及它给域名所有权带来了哪些启示。'
keywords: ['2020 推特黑客事件', '推特比特币骗局', 'graham ivan clark', '语音钓鱼', '电话鱼叉式钓鱼', '社会工程学', '账户劫持', '在线身份安全', '认证账户劫持', '推特管理工具', '代理工具', '内部风险', '域名安全', '纽约金融服务部推特报告']
---

在一个周三下午的短短几个小时里，互联网上最受信任的声音都开始异口同声地说着同一句话：给我发送比特币，我将双倍返还给你。

巴拉克·奥巴马（Barack Obama）这么说了。乔·拜登（Joe Biden）这么说了。埃隆·马斯克（Elon Musk）这么说了。比尔·盖茨（Bill Gates）、杰夫·贝索斯（Jeff Bezos）、坎耶·维斯特（Kanye West）、苹果（Apple）、优步（Uber）——这些带有蓝色徽章、经过身份验证、被数以亿计的人所信任的账户——几乎一字不差地发布了同一个拙劣的加密货币骗局。这些人其实没有敲击过哪怕一个字符，是他们的*账户*在发声，因为其他人掌握了账户的钥匙。

这里是**域名危机（Domain Mayday）EP03**。前两期的主题是名称——谁拥有它们，谁又能够夺走它们。本期我们将探讨披着不同外衣的同一个问题。一个 Twitter 账号、一个认证徽章、一个域名：每一项都是我们出于信任而接受的身份声明。而在 2020 年 7 月 15 日，攻击者证明了夺取这种声明的门槛有多低——不需要恶意软件，也不需要零日漏洞，只需要一通电话。

## 潜藏在账号中的信任

认证账户是一条建立信任的捷径。当 `@BarackObama` 发帖时，你不会再去重新验证这是否真的是他本人；账号加上徽章本身*就是*验证。这条捷径极其宝贵——但也极其脆弱，因为所有的信任都积累在账户之上，而账户的控制权却完全可能掌握在别处。

这与域名的结构如出一辙。`whitehouse.gov` 受到信任，并不是因为每位访客都会去检查证书链，而是因为这个名称本身就具有权威性。只要你在注册商、DNS 或管理面板处控制了这个名称，无论它以前是否属于你，你都能瞬间继承人们倾注在它之上的所有信任。

2020 年的 Twitter 黑客事件是对这种*信任*与*控制*之间鸿沟的最清晰展示。由于受监管的加密货币公司也在受害者之列，纽约州金融监管机构对此进行了调查，并直言不讳地指出：这次攻击是“[一个警示故事，说明即便是技术手段不那么高明的网络犯罪分子，也能造成非同寻常的破坏](https://www.dfs.ny.gov/Twitter_Report#:~:text=The%20Twitter%20Hack%20is%20a%20cautionary%20tale%20about%20the%20extraordinary%20damage%20that%20can%20be%20caused%20even%20by%20unsophisticated%20cybercriminals)”。

## 2020 年 7 月 15 日：劫持事件

![Vivid colorful concept art of a single glowing master key unlocking a vast wall of identical generic blue verified badges, each badge popping open in sequence](../../assets/the-2020-twitter-bitcoin-account-takeover-01-takeover.jpg)

事件发生得极快，而且是在光天化日之下。根据维基百科的案件重现，“[在 2020 年 7 月 15 日 20:00 至 22:00（UTC）之间，有 130 个知名的 Twitter 账户遭到入侵](https://en.wikipedia.org/wiki/2020_Twitter_account_hijacking#:~:text=On%20July%2015%2C%202020%2C%20between%2020%3A00%20and%2022%3A00%20UTC%2C%20130%20high%2Dprofile%20Twitter%20accounts%20were%20compromised)”。

纽约州金融服务部（DFS）的报告详细描述了这一过程。攻击者首先在加密领域进行预热：“[黑客们首先操纵了与知名加密货币公司和个人相关的 Twitter 账户](https://www.dfs.ny.gov/Twitter_Report#:~:text=The%20Hackers%20first%20manipulated%20Twitter%20accounts%20connected%20to%20well%2Dknown%20cryptocurrency%20companies%20and%20individuals)”，播撒指向一个比特币钱包的私信和推文。随后他们升级了行动：“[黑客们随后大幅提高了筹码，将目标对准了拥有数百万粉丝的经过认证的 Twitter 账户](https://www.dfs.ny.gov/Twitter_Report#:~:text=The%20Hackers%20then%20raised%20the%20stakes%20significantly%20and%20targeted%20verified%20Twitter%20accounts%20with%20millions%20of%20followers)”。

遇袭名单读起来就像是该平台上最受信任账户的贵宾名单。维基百科指出，“[据称被入侵的账户包括巴拉克·奥巴马、乔·拜登、比尔·盖茨、杰夫·贝索斯等知名个人……以及苹果、优步和 Cash App 等公司](https://en.wikipedia.org/wiki/2020_Twitter_account_hijacking#:~:text=well%2Dknown%20individuals%20such%20as%20Barack%20Obama%2C%20Joe%20Biden%2C%20Bill%20Gates%2C%20Jeff%20Bezos)”。

这些信息如出一辙，而且简单得令人发指。正如维基百科记录的那样，从苹果账户发出的推文写道：“[我们正在回馈社区。我们支持比特币，相信你也应该支持！所有发送到我们地址的比特币，都将双倍返还给你！](https://en.wikipedia.org/wiki/2020_Twitter_account_hijacking#:~:text=We%20are%20giving%20back%20to%20our%20community.%20We%20support%20Bitcoin%20and%20believe%20you%20should%20too!%20All%20Bitcoin%20sent%20to%20our%20addresses%20will%20be%20sent%20back%20to%20you%2C%20doubled!)” 同样的说辞，瞬间通过几十个世界上最可信的“嘴巴”同时重复播报。

并非所有账户都被利用了。监管机构发现，在被波及的 130 个账户中，“[总体而言，在 Twitter 黑客攻击期间有 130 个 Twitter 用户账户遭到入侵。其中，有 45 个账户被用来发送推文](https://www.dfs.ny.gov/Twitter_Report#:~:text=Overall%2C%20130%20Twitter%20user%20accounts%20were%20compromised%20during%20the%20Twitter%20Hack.%20Of%20those%2C%2045%20accounts%20were%20used%20to%20send%20tweets)”。但 45 个“超级扩音器”已经绰绰有余了。

## 真正失去的是什么

单从美元金额来看，这笔“赃款”数额并不大。DFS 的报告指出，“[黑客通过推特黑客攻击窃取了价值约 118,000 美元的比特币](https://www.dfs.ny.gov/Twitter_Report#:~:text=The%20Hackers%20stole%20approximately%20%24118%2C000%20worth%20of%20bitcoin%20through%20the%20Twitter%20Hack)”。维基百科提到，单个诈骗钱包“[在诈骗信息被删除前，收到了 320 多笔存款，价值超过 110,000 美元](https://en.wikipedia.org/wiki/2020_Twitter_account_hijacking#:~:text=received%20over%20320%20deposits%20with%20a%20value%20of%20over%20US%24110%2C000%20before%20the%20scam%20messages%20were%20removed)”。对于这种规模的入侵事件来说，118,000 美元少得几乎令人尴尬。

但这个数字严重低估了实际的损失。那个下午真正崩塌的，是*认证账号作为信任信号的完整性*。在那两个小时里，蓝色徽章什么也证明不了。该平台的整个身份层——也就是那个让你相信推文确实出自署名本人的机制——被证明可以被一个青少年同时控制。Twitter 的反应说明了一切：它暂时冻结了许多认证账户的发推功能。阻止信任账户“撒谎”的唯一办法，就是让它们彻底“闭嘴”。

这才是身份被劫持的真正代价。金钱损失只是个注脚。其造成的破坏在于，“这个账户 = 这个人”的等式不再成立，而下游所有依赖这个等式的人都暴露在了风险之中。

## 它是如何发生的：一通电话，然后是管理面板

![Vivid colorful concept art of a telephone handset cast like a fishing line, its hook snagging the dashboard of a glowing internal control panel covered in switches and toggles](../../assets/the-2020-twitter-bitcoin-account-takeover-02-vishing.jpg)

根本没有使用什么漏洞。DFS 的报告强调：“[此次 Twitter 黑客攻击没有涉及网络攻击中常用的任何高科技或复杂技术——没有恶意软件，没有漏洞利用，也没有后门](https://www.dfs.ny.gov/Twitter_Report#:~:text=The%20Twitter%20Hack%20did%20not%20involve%20any%20of%20the%20high%2Dtech%20or%20sophisticated%20techniques%20often%20used%20in%20cyberattacks%20%E2%80%93%20no%20malware%2C%20no%20exploits%2C%20and%20no%20backdoors)”。相反，“[黑客们使用了更接近于传统骗子的基本伎俩：拨打电话，假装是 Twitter 信息技术部门的人员](https://www.dfs.ny.gov/Twitter_Report#:~:text=The%20Hackers%20used%20basic%20techniques%20more%20akin%20to%20those%20of%20a%20traditional%20scam%20artist%3A%20phone%20calls%20where%20they%20pretended%20to%20be%20from%20Twitter%E2%80%99s%20Information%20Technology%20department)”。

这就是 **vishing（语音钓鱼）**。攻击者“[给几名 Twitter 员工打了电话，声称自己是从 Twitter IT 部门服务台打来的](https://www.dfs.ny.gov/Twitter_Report#:~:text=called%20several%20Twitter%20employees%20and%20claimed%20to%20be%20calling%20from%20the%20Help%20Desk%20in%20Twitter%E2%80%99s%20IT%20department)”，并“[声称他们正在响应员工报告的关于 Twitter 虚拟专用网络（VPN）的问题](https://www.dfs.ny.gov/Twitter_Report#:~:text=claimed%20they%20were%20responding%20to%20a%20reported%20problem%20the%20employee%20was%20having%20with%20Twitter%E2%80%99s%20Virtual%20Private%20Network)”。Twitter 自己后来将其描述为“[电话鱼叉式钓鱼攻击](https://krebsonsecurity.com/2020/07/three-charged-in-july-15-twitter-compromise/#:~:text=phone%20spear%20phishing%20attack)”，其依赖于“[一次重大的、协同的尝试，旨在误导某些员工并利用人性的弱点](https://krebsonsecurity.com/2020/07/three-charged-in-july-15-twitter-compromise/#:~:text=a%20significant%20and%20concerted%20attempt%20to%20mislead%20certain%20employees%20and%20exploit%20human%20vulnerabilities)”。

让人信服的不是技术能力，而是前期调研。正如安全记者 Brian Krebs 所记录的那样，攻击者依靠从领英（LinkedIn）和以前的数据泄露中提取的个人资料（姓名、角色、个人详细信息），使自己听起来就像是真实的同事。一旦有员工相信了来电者，该员工就会交出凭证，而这些凭证便打开了通往战利品的大门：Twitter 的内部账户管理工具。

这个工具正是整个故事的关键。Krebs 报道称，“[在 Twitter 的管理工具中，显然你可以更新任何 Twitter 用户的电子邮件地址](https://krebsonsecurity.com/2020/07/whos-behind-wednesdays-epic-twitter-hack/#:~:text=within%20Twitter%E2%80%99s%20admin%20tools%2C%20apparently%20you%20can%20update%20the%20email%20address%20of%20any%20Twitter%20user)”——更改电子邮件，触发密码重置，这个账户连同它的徽章就都是你的了。DFS 的报告指出了导致一名员工被攻破就引发如此灾难性后果的结构性故障：“[Twitter 确实限制了对内部工具的访问，但仍有 1,000 多名 Twitter 员工有权访问它们](https://www.dfs.ny.gov/Twitter_Report#:~:text=Twitter%20did%20limit%20access%20to%20the%20internal%20tools%2C%20but%20over%201%2C000%20Twitter%20employees%20still%20had%20access%20to%20them)”。一千多个人掌握着平台上每一个身份的万能钥匙，而公司却没有首席信息安全官来负责监管——Twitter“[自 2019 年 12 月（即 Twitter 黑客攻击事件发生前七个月）以来，一直没有设立首席信息安全官（CISO）](https://www.dfs.ny.gov/Twitter_Report#:~:text=had%20not%20had%20a%20chief%20information%20security%20officer%20(%E2%80%9CCISO%E2%80%9D)%20since%20December%202019%2C%20seven%20months%20before%20the%20Twitter%20Hack)”。

在这一切的背后，还隐藏着一个地下交易市场。在针对名人的骗局发生之前，这伙人正忙于出售偷来的简短、“OG（元老级）”账号。Krebs 注意到，在波及奥巴马/拜登/马斯克/盖茨的攻击爆发之前，“[几个极具吸引力的短字符 Twitter 账户名已经易手](https://krebsonsecurity.com/2020/07/whos-behind-wednesdays-epic-twitter-hack/#:~:text=several%20highly%20desirable%20short%2Dcharacter%20Twitter%20account%20names%20changed%20hands)”，因为在那个圈子里，“[短字符的个人资料名称象征着一定的地位和财富](https://krebsonsecurity.com/2020/07/twitter-hacking-for-profit-and-the-lols/#:~:text=short%2Dcharacter%20profile%20names%20confer%20a%20measure%20of%20status%20and%20wealth)”，并且“[转售时通常能卖到数千美元](https://krebsonsecurity.com/2020/07/twitter-hacking-for-profit-and-the-lols/#:~:text=can%20often%20fetch%20thousands%20of%20dollars%20when%20resold)”。具有稀缺价值的名称在论坛上被盗卖并倒手——这是任何域名投资者都能立刻认出的套路。

## 后果与逮捕

案件的破获几乎和黑客攻击一样快。不到两周，检察官就采取了行动。Krebs 报道了这些指控：“[来自英国博格诺里吉斯的 19 岁的 Mason 'Chaewon' Sheppard 在加州被控共谋实施电信欺诈、洗钱和未经授权访问计算机](https://krebsonsecurity.com/2020/07/three-charged-in-july-15-twitter-compromise/#:~:text=Mason%20%E2%80%9CChaewon%E2%80%9D%20Sheppard%2C%20a%2019%2Dyear%2Dold%20from%20Bognor%20Regis%2C%20U.K.%2C%20also%20was%20charged%20in%20California%20with%20conspiracy%20to%20commit%20wire%20fraud%2C%20money%20laundering%20and%20unauthorized%20access%20to%20a%20computer)”，以及“[来自佛罗里达州奥兰多的 22 岁的 Nima 'Rolex' Fazeli 在加州北部的一项刑事诉状中被控协助和教唆故意访问受保护的计算机](https://krebsonsecurity.com/2020/07/three-charged-in-july-15-twitter-compromise/#:~:text=Nima%20%E2%80%9CRolex%E2%80%9D%20Fazeli%2C%20a%2022%2Dyear%2Dold%20from%20Orlando%2C%20Fla.%2C%20was%20charged%20in%20a%20criminal%20complaint%20in%20Northern%20California%20with%20aiding%20and%20abetting%20intentional%20access%20to%20a%20protected%20computer)”。

但被指控的头目甚至还要年轻。“[来自佛罗里达州坦帕市的 17 岁青年 Graham Clark 是 7 月 15 日 Twitter 黑客攻击事件的被控者之一](https://krebsonsecurity.com/2020/07/three-charged-in-july-15-twitter-compromise/#:~:text=17%2Dyear%2Dold%20Graham%20Clark%20of%20Tampa%2C%20Fla.%20was%20among%20those%20charged%20in%20the%20July%2015%20Twitter%20hack)”，由于未成年，他被佛罗里达州检察官而非联邦法院起诉。他“[被控 30 项重罪，包括有组织的欺诈、通信欺诈](https://krebsonsecurity.com/2020/07/three-charged-in-july-15-twitter-compromise/#:~:text=was%20hit%20with%2030%20felony%20charges%2C%20including%20organized%20fraud%2C%20communications%20fraud)”。

次年 3 月，Clark 达成了认罪协议。CyberScoop 报道称他“[承认策划了这一阴谋，通过接管众多公众人物的 Twitter 账户窃取了超过 117,000 美元](https://cyberscoop.com/twitter-hack-guilty-plea-graham-ivan-clark/#:~:text=admitted%20to%20being%20behind%20a%20scheme%20that%20saw%20him%20steal%20more%20than%20%24117%2C000%20by%20taking%20over%20the%20Twitter%20accounts%20of%20numerous%20public%20figures)”。公共广播电台 WUSF 报道了判决结果：“[在青少年拘留所服刑三年，随后缓刑三年](https://www.wusf.org/courts-law/2021-03-16/tampa-twitter-hacker-sentenced-to-three-years-in-prison-three-years-probation#:~:text=three%20years%20in%20a%20juvenile%20facility%20to%20be%20followed%20by%20three%20years%20of%20probation)”，并指出这已是“[该州未成年罪犯法律允许的最高刑罚](https://www.wusf.org/courts-law/2021-03-16/tampa-twitter-hacker-sentenced-to-three-years-in-prison-three-years-probation#:~:text=the%20maximum%20allowed%20under%20the%20state%E2%80%99s%20youthful%20offender%20law)”。

后来又浮现出了第四个人物。维基百科记录到，“[2023 年 4 月，23 岁的英国公民 Joseph James O'Connor（网名为 PlugwalkJoe）被从西班牙引渡到纽约受审](https://en.wikipedia.org/wiki/2020_Twitter_account_hijacking#:~:text=In%20April%202023%2C%2023%2Dyear%2Dold%20Joseph%20James%20O%E2%80%99Connor%2C%20a%20British%20citizen%20with%20the%20online%20handle%20PlugwalkJoe%2C%20was%20extradited%20from%20Spain)”，后来他被判处五年联邦监禁。

## 这给在线身份控制带来了哪些启示

抛开名人的光环和加密货币的噱头，2020 年的 Twitter 黑客事件是一堂纯粹的课程，告诉我们*拥有*一个身份和*控制*一个身份之间的区别。我们可以从中得出几个原则：

1. **信任在名称上累积；控制权却在后台。** 数以亿计的人信任 `@BarackObama`。但这些信任丝毫没能保护这个账户，因为该账户的控制面是一个一千多名员工都能访问的内部管理面板。无论台前挂着谁的名字，谁控制了后台，谁就控制了身份。

2. **最薄弱的环节几乎从来都不是密码学。** 没有漏洞利用，没有恶意软件，也没有后门——只是一通令人信服的电话。身份系统在人为和流程层面的失效概率远远高于在数学计算层面的失效概率。如果门上挂着一把完美的锁，但任何乐于助人的员工只要接到请求就会把它打开，那么这把锁就形同虚设。

3. **具有完全控制权的单点，就是会导致全面崩溃的单点故障。** 一个可以更改*任何*账户电子邮件的、可重复使用的内部工具，意味着只需攻破一名员工，就等同于接管了整个平台。过度集中、随时可逆转且不透明的控制权，本身就是一个漏洞。

4. **稀缺的名称就是活靶子。** 劫持总统账户的那批人，同时也悄悄地以数千美元的价格出售了短字符的“OG（元老级）”账号。有价值的名称会招来盗贼，一个名称的价值所在，正是其控制权值得被窃取的原因。

5. **恢复机制不应依赖于平台的怜悯。** 当那些受信任的账户开始“撒谎”时，Twitter 唯一的手段就是冻结它们。身份所有者没有独立的途径来证明“这真的是我”，也无法重新获得控制权——他们完全依赖于一个中心化运营商的内部工具和善意。

## Namefi 的视角

![Colorful illustration of verifiable, tamper-resistant ownership of an online identity — secured by a green shield, a green Namefi token, and continuity](../../assets/the-2020-twitter-bitcoin-account-takeover-03-namefi-angle.jpg)

域名是一种在线身份，它与 Twitter 的认证账号存在着完全相同的“信任与控制权分离”的鸿沟——通常也有着同样不透明的后台。对于大多数域名而言，“所有权”存在于注册商账户中，由密码和客服支持团队把守。一通令人信服的电话、一名被社会工程学忽悠的客服代表、一次通过内部面板强制执行的电子邮件更改——2020 年 Twitter 黑客的这套剧本，几乎可以一对一地套用在接管注册商账户上。如果域名的控制权被安置在一个可能被轻易忽悠的服务台背后，那么全世界倾注在你的域名上的信任也无法保护它。

[Namefi](https://namefi.io) 的存在正是为了弥合这一鸿沟。其核心理念是，域名的控制权应该是*可验证且由所有者持有的*，而不是别人管理工具里的一个设置。通过将域名所有权表示为保持与 DNS 兼容的、代币化的链上资产，Namefi 让“谁控制这个名称？”这个问题可以通过密码学来回答，而不是由一个面临压力的客服代表来裁决。这里不存在能够让一千名员工访问并悄悄重新分配你的名称的单一内部面板；控制权的证明存在于所有者手中，并且转移过程是可审计的，而非可以随意篡改的。

2020 年的 Twitter 黑客攻击之所以奏效，是因为身份和控制权已被悄悄地剥离开来——名称在台前说着一件事，而隐藏的管理工具在幕后决定了另一件事。对于任何依赖某个名称的人来说，教训就在于：必须让控制权如同名称承载的信任一样清晰可见，且牢牢锚定在所有者身上。一个账号、一个徽章、一个域名：它们的安全性仅仅取决于它们背后的后台。Namefi 坚信，这个后台应当是一个由你控制的、可验证的账本，而不是一条别人可能会被骗着去接听的电话线。

## 参考资料与延伸阅读

- 纽约州金融服务部 — [Twitter 调查报告 (Twitter Investigation Report)](https://www.dfs.ny.gov/Twitter_Report)
- 维基百科 — [2020 年推特账户劫持事件 (2020 Twitter account hijacking)](https://en.wikipedia.org/wiki/2020_Twitter_account_hijacking)
- Krebs on Security — [周三史诗级 Twitter 黑客攻击背后的主谋是谁？ (Who's Behind Wednesday's Epic Twitter Hack?)](https://krebsonsecurity.com/2020/07/whos-behind-wednesdays-epic-twitter-hack/)
- Krebs on Security — [为暴利与寻开心而黑入 Twitter (Twitter Hacking for Profit and the LoLs)](https://krebsonsecurity.com/2020/07/twitter-hacking-for-profit-and-the-lols/)
- Krebs on Security — [三人因涉嫌 7 月 15 日 Twitter 泄密事件被起诉 (Three Charged in July 15 Twitter Compromise)](https://krebsonsecurity.com/2020/07/three-charged-in-july-15-twitter-compromise/)
- CyberScoop — [Twitter 黑客认罪，被判 3 年监禁 (Twitter hacker pleads guilty, sentenced to 3 years)](https://cyberscoop.com/twitter-hack-guilty-plea-graham-ivan-clark/)
- WUSF — [坦帕市 Twitter 黑客被判处三年监禁，三年缓刑 (Tampa Twitter Hacker Sentenced To Three Years In Prison, Three Years Probation)](https://www.wusf.org/courts-law/2021-03-16/tampa-twitter-hacker-sentenced-to-three-years-in-prison-three-years-probation)
- 美国司法部 — [三名个人因涉嫌参与 Twitter 黑客攻击被起诉 (Three Individuals Charged for Alleged Roles in Twitter Hack)](https://www.justice.gov/usao-ndca/pr/three-individuals-charged-alleged-roles-twitter-hack)
- ABC 新闻 — [承认在 17 岁时黑入 Twitter 的佛罗里达男子被判 3 年监禁 (Florida man who pleaded guilty to hacking Twitter as 17-year-old sentenced to 3 years)](https://abcnews.go.com/Politics/florida-man-pleaded-guilty-hacking-twitter-17-year/story?id=76513232)