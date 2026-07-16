---
title: 'Bitcoin.org DNS 劫持事件：比特币的官方主页是如何变成"翻倍骗局"的'
date: '2026-06-17'
language: zh-CN
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['aileen-wright']
editors: ['victor-zhou']
translators: ['fenwei-bian']
draft: false
description: '2021年9月，Bitcoin.org——由化名运营者 Cobra 管理、长期作为比特币信息门户的网站——在 DNS 层遭到劫持，被改造成虚假的"比特币翻倍赠送"骗局。在网站被下线之前，骗子敛财约 17,000 美元。本文深入剖析事件经过、攻击手法，以及此次事件对即便是加密原生网站依赖 DNS 这一问题的深刻警示。'
keywords: ['bitcoin.org', 'bitcoin.org 被黑', 'dns劫持', '域名劫持', '比特币翻倍骗局', '加密货币赠品诈骗', 'cobra bitcoin.org', 'cloudflare dns', 'namecheap', 'dns安全', '域名安全', '域名服务器劫持', 'whois变更攻击']
relatedArticles:
  - /zh-CN/blog/the-curve-finance-dns-hijack/
  - /zh-CN/blog/the-lenovo-com-dns-hijack/
  - /zh-CN/blog/the-myetherwallet-bgp-dns-attack/
  - /zh-CN/blog/the-fox-it-dns-hijack/
  - /zh-CN/blog/the-godaddy-multi-year-breach/
relatedTopics:
  - /zh-CN/topics/domain-security/
  - /zh-CN/topics/domain-tokenization/
relatedSeries:
  - /zh-CN/series/domain-apocalypse/
  - /zh-CN/series/name-change-game-change/
relatedGlossary:
  - /zh-CN/glossary/dns/
  - /zh-CN/glossary/registrar/
  - /zh-CN/glossary/icann/
  - /zh-CN/glossary/tld/
  - /zh-CN/glossary/registry/
---

十余年来，每当有人想寻找关于"什么是比特币以及如何安全使用它"的权威、中立解答时，互联网都会把他们引向同一个地址：**Bitcoin.org**。

它从不是交易所，从不出售任何东西。在这个最具对抗性、最去信任化的货币面前，它是最接近*官方*欢迎页面的存在——[注册于 2008 年 8 月 18 日](https://en.wikipedia.org/wiki/Bitcoin#:~:text=The%20domain%20name%20bitcoin.org%20was%20registered)，甚至早于创世区块诞生之前。比特币白皮书就托管在这里，新人们在此学到了加密世界的第一条铁律：*做自己的银行，绝不将私钥托付给他人。*

因此，**2021 年 9 月 23 日（星期四）**发生的事，讽刺意味格外刺骨。加密圈最广为传诵的安全警示——*如果有人承诺帮你翻倍，那一定是骗局*——从比特币自己的门户以反转的姿态播出。在那短短几个小时里，那个曾告诫人们不要上"比特币翻倍"当的网站，*本身*就成了那个骗局。而这一切发生的原因，不是有人入侵了某台服务器，而是有人控制了**域名**。

## 比特币象征性的信任之家

要理解这次劫持为何如此刺痛，你必须先理解 Bitcoin.org 的意义。

比特币没有 CEO，没有总部，没有官方发言人。多年来，它所拥有的只是几个由社区自发维护的参考网站，而 Bitcoin.org 是其中最具代表性的一个。CryptoPotato 称其为[与 BTC 相关的最古老网站，注册时间超过 13 年前](https://cryptopotato.com/bitcoinorg-hacked-giveaway-scam-promising-users-to-double-their-btc/#:~:text=the%20oldest%20website%20in%20relation%20to)。它托管着[钱包](/zh-CN/glossary/wallet/)推荐、入门指南，以及中本聪白皮书的副本。

与比特币的精神一脉相承，这个网站的运营者也是一位幽灵般的存在。它由一位化名为 **Cobra** 的匿名运营者维护——匿名是一种原则。而这一原则不久前刚刚经历了法庭的考验：就在几个月前，自称"中本聪"的 Craig Wright 在英国版权官司中获胜，迫使 Bitcoin.org 撤下白皮书，法院向 Cobra 发出了[禁止其在英国侵犯 Wright 版权的禁令](https://www.coindesk.com/markets/2021/06/29/uk-court-orders-bitcoinorg-to-remove-white-paper-following-craig-wright-lawsuit#:~:text=injunction%20prohibiting%20Cobra%20from%20infringing)。Cobra 对其匿名性的捍卫几乎像一首散文诗：[法院规则允许我被以化名方式起诉，然而，我却无法以化名方式进行自辩](https://www.coindesk.com/markets/2021/06/29/uk-court-orders-bitcoinorg-to-remove-white-paper-following-craig-wright-lawsuit#:~:text=the%20court%20rules%20allowed%20for%20me%20to%20be%20sued%20pseudonymously)。

关键在于，Bitcoin.org 承载着一种*信任*——这种信任是制度性的，是一个无领袖运动本不该拥有的，却在过去十三年间悄然积累。而这份信任，恰恰使它成为了攻击目标。骗局的效果越好，宿主就越可信。而在整个加密世界里，没有比比特币自己名字更可信的宿主了。

这里还藏着第二层、更深刻的讽刺。Bitcoin.org 的整套精神内核是*自我托管*：持有自己的密钥，不信任任何托管方，验证一切。一个完全内化了这一课的访客，绝不会把代币转到一个陌生人的钱包。但这次赠品骗局并没有要求他们信任陌生人——它要求他们信任 *Bitcoin.org 本身*，那个他们被告知多年来是"安全起点"的地址。这次攻击并没有攻破那堂课；它劫持了传播那堂课的信使。

## 2021 年 9 月：劫持与虚假赠品

![充满活力的彩色概念艺术：一座受信任的海岸灯塔域名遭到劫持，灯塔的光束向水面上的小船闪烁着虚假的"翻倍你的代币"霓虹招牌](../../assets/the-bitcoin-org-dns-hijack-01-hijack.jpg)

2021 年 9 月 23 日上午，访问 Bitcoin.org 的用户看到的不是钱包指南，而是一个弹出模态框——一个外观整洁、官方感十足的遮罩层，叠加在比特币最受信任的参考网站首页上。

这条信息使用的是加密世界最古老的把戏，却披上了借来的权威外衣。它声称**比特币基金会**正在[回馈社区](https://www.coindesk.com/tech/2021/09/23/bitcoinorg-appears-hacked-by-giveaway-scam/#:~:text=giving%20back%20to%20the%20community)，称此次活动仅限[前 10,000 名用户](https://www.coindesk.com/tech/2021/09/23/bitcoinorg-appears-hacked-by-giveaway-scam/#:~:text=first%2010%2C000)参与，并承诺：[向此地址发送比特币，我们将返还双倍金额！](https://www.bleepingcomputer.com/news/security/bitcoinorg-hackers-steal-17-000-in-double-your-cash-scam/#:~:text=Send%20Bitcoin%20to%20this%20address%2C%20and%20we%20will%20send%20double) 一个二维码让操作变得毫不费力。正如 CoinDesk 冷静地描述这类骗局的惯常套路：[这些骗局都是虚假承诺，诱使人们通过扫描二维码向某个钱包地址发送一定数量的代币后翻倍返还](https://www.coindesk.com/tech/2021/09/23/bitcoinorg-appears-hacked-by-giveaway-scam/#:~:text=these%20schemes%20give%20false%20promises%20of%20doubling)。结局也永远相同：[受害者实际上什么都没有收到，并损失了他们发送的加密货币](https://www.coindesk.com/tech/2021/09/23/bitcoinorg-appears-hacked-by-giveaway-scam/#:~:text=Victims%2C%20in%20fact%2C%20receive%20nothing)。

Cobra 公开、直接地确认了此次入侵，发文称网站[已遭入侵。目前正在调查黑客如何在网站上放置诈骗弹窗](https://www.bleepingcomputer.com/news/security/bitcoinorg-hackers-steal-17-000-in-double-your-cash-scam/#:~:text=has%20been%20compromised.%20Currently%20looking%20into%20how%20the%20hackers)。

## 访客的损失

"翻倍你的钱"骗局只在有人相信时才奏效。换成一个普通网站，几乎没人会上当。但在 *Bitcoin.org* 上，有人信了。

骗局钱包没有空置太久。BleepingComputer 报道，该地址[钱包最后更新余额为 0.40571238 BTC，约合 17,000 美元](https://www.bleepingcomputer.com/news/security/bitcoinorg-hackers-steal-17-000-in-double-your-cash-scam/#:~:text=0.40571238%20BTC%20or%20approximately%20US%2417%2C000)。CoinDesk 的实时跟踪显示，[该赠品骗局地址在撰写本文时已收到超过 17,700 美元的小额交易](https://www.coindesk.com/tech/2021/09/23/bitcoinorg-appears-hacked-by-giveaway-scam/#:~:text=received%20over%20%2417%2C700%20in%20small%20transactions)。

一夜之间蒸发的一万七千美元，来自一个东道主网站原本会警告你提防的骗局。而且请记住比特币设计中最残酷的一点：这些交易是最终确认的。没有拒付申请，没有欺诈部门，没有"拨打银行电话"的选项。正是比特币赋予它力量的那种不可逆性，使每一位受害者在扫描二维码的那一刻起，损失便成了永久的定局。

这个美元数字几乎已不是重点。真正的损害，是 Bitcoin.org 用十三年建立起来的那样东西——那个认为*这个*地址，在所有地址中，是安全可信的假设。

## 事件经过：DNS 被攻破，而非服务器入侵

![充满活力的彩色概念艺术：岔路口的路标被重新指向，其中一个箭头被悄悄改成指向一个金色漏斗陷阱，原本安全的路径陷入黑暗](../../assets/the-bitcoin-org-dns-hijack-02-fake-giveaway.jpg)

以下这个细节，使得这个事件成为一个*域名危机*的故事，而不只是又一次[网络钓鱼](/zh-CN/glossary/phishing/)案例：**攻击者根本不需要入侵 Bitcoin.org 的服务器。**

Cobra 在这一点上态度坚定。他说，源服务器完好无损——[我的实际服务器在被黑期间没有收到任何流量](https://news.bitcoin.com/hackers-compromise-web-portal-bitcoin-org-dns-hijack-replaces-site-with-btc-doubler-scam/#:~:text=my%20actual%20server%20didn%27t%20get%20any%20traffic%20during%20the%20hack)。相反，攻击发生在更上一层——互联网中决定*域名指向何处*的那个层级。观察此次事件的人注意到，[WHOIS 信息在被黑时被更新，域名服务器 + DNS 记录被更改](https://news.bitcoin.com/hackers-compromise-web-portal-bitcoin-org-dns-hijack-replaces-site-with-btc-doubler-scam/#:~:text=The%20WHOIS%20info%20was%20updated%20at%20the%20time%20of%20the%20hack)。一旦你控制了域名服务器，你就控制了"bitcoin.org *是*哪台服务器"这个问题的答案——你可以悄悄地将一个受信任的名字指向你自己的服务器。

Cobra 的自我诊断将矛头指向了 [DNS](/zh-CN/glossary/dns/) 层，以及一次近期的基础设施变更。他的原话是：[Bitcoin.org 从未被黑过。然后我们迁移到 Cloudflare，两个月后就被黑了。](https://news.bitcoin.com/hackers-compromise-web-portal-bitcoin-org-dns-hijack-replaces-site-with-btc-doubler-scam/#:~:text=Bitcoin.org%20hasn%27t%20been%20hacked%2C%20ever.%20And%20then%20we%20move%20to%20Cloudflare) 他的推断既具体又严苛：[攻击者似乎只是利用了 DNS 中的某个漏洞](https://news.bitcoin.com/hackers-compromise-web-portal-bitcoin-org-dns-hijack-replaces-site-with-btc-doubler-scam/#:~:text=The%20attackers%20just%20seem%20to%20have%20exploited%20some%20flaw%20in%20the%20DNS)。Decrypt 也以同样的方式总结了主流判断：攻击者[在网站两个月前迁移到 Cloudflare 后，利用了 DNS 配置中的漏洞](https://decrypt.co/81612/bitcoin-org-compromised-fraudulent-crypto-giveaway-advertised/#:~:text=exploited%20a%20flaw%20in%20the%20DNS%20configuration%20after%20the%20website%20moved%20to%20Cloudflare)。

根本原因究竟是配置错误、[注册商](/zh-CN/glossary/registrar/)层面的入侵，还是 DNS 服务商的问题，始终未能在公开场合得到最终确认——CoinDesk 指出[网站劫持的根本原因尚未得到证实，尽管部分人士怀疑这是一次 DNS 劫持](https://www.bleepingcomputer.com/news/security/bitcoinorg-hackers-steal-17-000-in-double-your-cash-scam/#:~:text=root%20cause%20of%20the%20website%20hijack%20remains%20unconfirmed)。但攻击的*形态*是清晰的：应用程序没问题，代码没问题，密钥没问题——被劫持的是那个**名字**。而在互联网上，控制名字就意味着赢得了大半场战争。

## 应对与后续

同样具有说明意义的是，修复措施也发生在域名层面。

网站无法靠"打补丁"来解决问题，因为恶意版本的 Bitcoin.org 并不是从真实的基础设施上提供的。止血最快的方式，是将域名本身从服务中撤下。注册商 **Namecheap** 就是这样做的——据 BleepingComputer 报道，[我们已暂时禁用该域名](https://www.bleepingcomputer.com/news/security/bitcoinorg-hackers-steal-17-000-in-double-your-cash-scam/#:~:text=We%20have%20temporarily%20disabled%20the%20domain)。在一段时间内，访客既看不到骗局，也看不到主页；CoinDesk 报道，他们[看到的是"该网站无法访问"。](https://www.coindesk.com/tech/2021/09/23/bitcoinorg-appears-hacked-by-giveaway-scam/#:~:text=This%20site%20can%27t%20be%20reached) 比特币世界最受信任的参考页面陷入了黑暗。

经过几小时的调查，域名被重新正确指向，网站也恢复到被黑前的状态。整个窗口期很短——不超过一天——从纯金额来看，这次盗窃按加密犯罪的标准也算是小案。但由于被攻击的是*这个*网站，事件的冲击尤为深重。一个以"不信任、去验证"为傲的运动，亲眼目睹了自己的权威"信任我们"页面，被有凭有据地用来对付自己的用户。

## 此事件对加密原生网站依赖 DNS 的警示

![充满活力的彩色概念艺术：一个发光的金色代币诈骗漏斗，明亮的代币从看似可信的宽口顶端涌入，消失在黑暗的细口底端，背景是充满活力的抽象图案](../../assets/the-bitcoin-org-dns-hijack-03-namefi-angle.jpg)

Bitcoin.org 劫持事件最令人不安的教训是：**成为加密原生网站，几乎无法让你免于此类威胁。**

比特币是去中心化的。它的账本出了名地难以篡改。它的密钥，在妥善保管时，属于且只属于你自己。但这些在这里都没用——因为通往这一切的*前门*，是一个再普通不过的域名，和任何电商网站或本地面包店一样，依赖着同样的 DNS、注册商和[域名服务器](/zh-CN/glossary/nameserver/)基础设施。[区块链](/zh-CN/glossary/blockchain/)完好无损，网站在真正重要的层面上坚不可摧，但**指向它的那个名字**并非如此。

从这次事件中，可以得出几条经久不衰的结论：

1. **你的域名是攻击面的组成部分——往往是*最大*的一部分。** 你可以写出无懈可击的代码，把密钥存入冷钱包，强化每一台服务器，但一个控制了你的域名服务器或注册商账号的攻击者，依然能够完全冒充你。名字是前门，被劫持的名字让陌生人得以应门。

2. **DNS/注册商的变更是无声的，且具有高度杠杆效应。** 当[域名服务器 + DNS 记录被更改](https://news.bitcoin.com/hackers-compromise-web-portal-bitcoin-org-dns-hijack-replaces-site-with-btc-doubler-scam/#:~:text=nameservers%20%2B%20DNS%20changed)时，多数监控工具不会立刻察觉到有什么"出错了"——网站依然加载，只不过是从错误的地方加载。注册商锁、注册局锁、[DNSSEC](/zh-CN/glossary/dnssec/)，以及对注册商/DNS 服务商账号的严格访问控制，不是可选的卫生习惯，而是那扇人们总会遗忘的门上的锁。

3. **被盗的实质是信誉。** 攻击者并不真正垂涎 Bitcoin.org 那台价值 17,000 美元的服务器；他们要的是它的*公信力*，借用几个小时，让一个古老的骗局变得可信。你的域名越受信任，劫持它的价值就越高——你就越需要谨慎对待谁能更改它的指向。

4. **"去信任"的基础设施依然建立在受信任的名字之上。** 即使是比特币——去除中介的典范——也通过 DNS 触达用户。DNS 是一个层级制的、中介化的、可变更的系统。去中心化货币，并不等于去中心化前门。

5. **检测速度胜过防御的精妙程度。** Bitcoin.org 能以较小损失度过此劫，很大程度上因为社区迅速发现了骗局，注册商也在数小时内撤下了域名。被劫持的名字持续指向攻击者的时间越长，损失——以及声誉损害——就越会叠加放大。在你的名字的控制权或路由*刚刚发生变化的那一刻*得到通知，比任何单一的静态锁都更有价值。

## Namefi 的视角

Bitcoin.org 劫持事件，归根结底，是一个*控制权与可验证性*的问题。应用程序本身没有问题，区块链本身没有问题。失效的，是那个回答一个看似简单问题的层级：**谁合法地控制着这个名字，它被允许指向何处？** 当这个问题的答案可以被悄悄改写——域名服务器被替换，[WHOIS 信息在被黑时被更新](https://news.bitcoin.com/hackers-compromise-web-portal-bitcoin-org-dns-hijack-replaces-site-with-btc-doubler-scam/#:~:text=The%20WHOIS%20info%20was%20updated%20at%20the%20time%20of%20the%20hack)——无论其余技术栈有多坚固，信任都会荡然无存。

[Namefi](https://namefi.io) 从这样一个理念出发：域名的所有权与控制权，应当像一种一流的、可验证的、原生互联网资产那样运作，而非存在于一个攻击者可以悄悄修改的可变数据库条目之中。代币化的、可审计的所有权，使得"谁控制着这个域名，控制权是否刚刚发生了变化"这一问题可以在[链上](/zh-CN/glossary/on-chain/)得到回答——将一次无声的域名服务器替换变成一个可见的、可追责的事件，同时与其余互联网所依赖的 DNS 保持兼容。这并不能让 DNS 本身消失，但它让对*一个名字的控制*变得更难被悄悄劫持，也更易于持续验证。

Bitcoin.org 花了十三年向世界传授这样一课：危险的时刻，正是你停止验证、开始盲目信任的那一刻。2021 年 9 月，在短短几个小时里，它自己的域名以最惨痛的方式证明了这一课。留给所有人的启示，比听起来更简单：你的域名就是你在互联网上的身份——守护这个名字，要像守护它背后的密钥一样用心。

## 来源与延伸阅读

- BleepingComputer — [Bitcoin.org hackers steal $17,000 in 'double your cash' scam](https://www.bleepingcomputer.com/news/security/bitcoinorg-hackers-steal-17-000-in-double-your-cash-scam/)
- CoinDesk — [Bitcoin.org Website Inaccessible After Being Hacked by Apparent Giveaway Scam](https://www.coindesk.com/tech/2021/09/23/bitcoinorg-appears-hacked-by-giveaway-scam/)
- Bitcoin.com News — [Hackers Compromise Web Portal Bitcoin.org — DNS Hijack Replaces Site With BTC Doubler Scam](https://news.bitcoin.com/hackers-compromise-web-portal-bitcoin-org-dns-hijack-replaces-site-with-btc-doubler-scam/)
- Decrypt — [Bitcoin.org Compromised, Fraudulent Crypto Giveaway Advertised](https://decrypt.co/81612/bitcoin-org-compromised-fraudulent-crypto-giveaway-advertised/)
- Cointelegraph — [Bitcoin.org goes offline after suffering scam attack](https://cointelegraph.com/news/bitcoin-org-goes-offline-after-suffering-scam-attack)
- CryptoPotato — [BitcoinOrg Hacked: Giveaway Scam Promising Users to Double Their BTC](https://cryptopotato.com/bitcoinorg-hacked-giveaway-scam-promising-users-to-double-their-btc/)
- NewsBTC — [Bitcoin.org Hacked By Scammers For A Few Minutes. Someone Sent Them 0.4 BTC](https://www.newsbtc.com/news/bitcoin-org-hacked-by-scammers/)
- CoinDesk — [UK Court Orders Bitcoin.org to Remove White Paper Following Craig Wright Lawsuit](https://www.coindesk.com/markets/2021/06/29/uk-court-orders-bitcoinorg-to-remove-white-paper-following-craig-wright-lawsuit)
- Wikipedia — [Bitcoin (history of the bitcoin.org domain)](https://en.wikipedia.org/wiki/Bitcoin)
