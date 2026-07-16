---
title: "ENS、Unstoppable 与代币化 DNS 域名对比"
date: '2026-06-24'
language: zh-CN
tags: ['domains', 'domain-flipping', 'web3', 'comparison']
authors: ['fenwei-bian']
editors: ['victor-zhou']
draft: false
cluster: choosing-a-tld
series: domain-flipping-skills
seriesOrder: 37
format: comparison
description: "ENS、Unstoppable Domains 与代币化 ICANN DNS 域名的对比，从浏览器可解析性、续费，以及谁真正掌控域名三个维度展开。"
ogImage: ../../assets/ens-vs-unstoppable-vs-tokenized-dns-og.jpg
keywords: ['ENS 与 Unstoppable Domains 对比', 'ENS 与代币化域名对比', 'Unstoppable Domains 与 ENS 对比', 'web3 域名对比', '代币化 DNS 域名', 'ENS 域名翻转', '.eth 域名', '.crypto 域名', 'web3 域名能否在浏览器中解析', 'ENS 续费费用', 'Unstoppable Domains 免续费', 'ICANN 与 web3 域名对比', '谁掌控 web3 域名', '代币化域名与 web3 域名对比', 'NFT 域名对比']
relatedArticles:
  - /zh-CN/blog/onchain-domain-flipping/
  - /zh-CN/blog/what-are-tokenized-domains/
  - /zh-CN/blog/ens-vs-dns-domain-flipping/
  - /zh-CN/blog/onchain-domain-marketplaces-compared/
  - /zh-CN/blog/tokenize-your-com-to-flip-it/
relatedTopics:
  - /zh-CN/topics/choosing-a-tld/
  - /zh-CN/topics/domain-investing/
relatedSeries:
  - /zh-CN/series/domain-flipping-skills/
  - /zh-CN/series/domain-investor-field-guide/
relatedGlossary:
  - /zh-CN/glossary/registrar/
  - /zh-CN/glossary/dns/
  - /zh-CN/glossary/icann/
  - /zh-CN/glossary/tld/
  - /zh-CN/glossary/web3/
---

如果你在链上翻转域名，第一个要做的决定就是：你交易的究竟是哪一种"链上域名"。大多数人把三类东西混为一谈，但它们并不是同一种资产，而这些差异决定了域名能否在浏览器中解析、明年你是否要交续费、以及谁真正掌控这个域名。本文将这三者逐一对比：[ENS](/zh-CN/glossary/ens/)（`.eth`）、[Unstoppable Domains](https://unstoppabledomains.com)（`.crypto`、`.x`、`.nft`），以及代币化的真实 ICANN [DNS](/zh-CN/glossary/dns/) 域名（也就是你可以在 [Namefi](https://namefi.io) 上[代币化](/zh-CN/glossary/tokenize/)的 `.com`/`.io`/`.xyz` 域名）。

它们只有一个共同点：每一种都把域名所有权以代币的形式放进你的[钱包](/zh-CN/glossary/wallet/)。但在与转售相关的所有方面，它们都各不相同。如果你只能记住一件事，那就记住这一点：ENS 和 Unstoppable 的域名活在 ICANN 根之*外*，而代币化 DNS 域名*本身就是*一个挂上了代币的 ICANN 域名。这一个事实会一路传导到可解析性、续费和控制权上。

## 它们各自到底是什么

![三种域名代币卡片并排立在小底座上的编辑插画——一张六边形 .eth 风格代币、一张圆角 Web3 域名徽章、一张经典地球仪 ICANN 域名卡片，三者地位对等](../../assets/ens-vs-unstoppable-vs-tokenized-dns-01-three-name-types.jpg)

**ENS** 是 [Ethereum](/zh-CN/glossary/ethereum/) 上的一套命名系统。官方文档讲得很直白：[ENS 把诸如 "alice.eth" 这样人类可读的名称映射到 Ethereum 地址](https://docs.ens.domains/learn/protocol#:~:text=maps%20human%2Dreadable%20names)、内容哈希和元数据等机器可读的标识符。`.eth` 域名以代币的形式在 Ethereum 上发行，而你可以[像转移任何其他 ERC721 代币一样转移自己的域名](https://docs.ens.domains/registry/eth/#:~:text=transfer%20their%20name%20just%20like%20with%20any%20other%20ERC721%20token)——所以从机制上看，它就是一个 [ERC-721](/zh-CN/glossary/erc-721/) [NFT](/zh-CN/glossary/nft/)。关键在于：`.eth` 并非由 ICANN 委派，而是 ENS 在链上自行创建的一个命名空间。

**Unstoppable Domains** 销售 `.crypto`、`.x`、`.nft`、`.dao` 这类区块链原生域名。这些[域名同样可以在 Ethereum 区块链上铸造成非同质化代币（NFT）](https://coinmarketcap.com/academy/glossary/unstoppable-domains#:~:text=minted%20as%20a%20non%2Dfungible%20token)，公司会把它们存进你的钱包——其支持文档说，[Web3 域名作为数字资产（NFT）存储在你的加密钱包中，完全归你所有](https://support.unstoppabledomains.com/support/solutions/articles/48001181690-what-are-nft-domains-#:~:text=stored%20in%20your%20crypto%20wallet%20as%20digital%20assets)。和 `.eth` 一样，这些 TLD 也不属于 ICANN 根。

**代币化 DNS 域名**则在本质上不同。其底层资产是一个普通的 ICANN 域名——`example.com`、`yourname.io`——通过一家有认证资质的[注册商](/zh-CN/glossary/registrar/)注册，并铸造一个链上代币来映射它的所有权。我们在[什么是代币化域名](/zh-CN/blog/what-are-tokenized-domains/)中拆解了其中的机制，简而言之：它是一个域名带着两个同步的层，而不是一个新的命名空间。关于更宏观的分类框架，参见[代币化域名与 web3 域名对比](/zh-CN/blog/tokenized-domain-vs-web3-domain/)。

## 浏览器可解析性：域名能直接用吗？

![三个堆叠的浏览器地址栏窗口的编辑插画——最上面那个显示绿色对勾，另外两个则需要先装上一个小拼图状的网关插件才能解析](../../assets/ens-vs-unstoppable-vs-tokenized-dns-02-resolvability.jpg)

这是最清晰的一条分界线，而对翻转者来说，这往往就是全部胜负所在，因为可解析性正是大多数最终买家真正在为之付钱的东西。

一个代币化的 `.com`，在任何普通 `.com` 能解析的地方都能解析——每一个浏览器、每一个邮件客户端、每一个 CDN 和证书颁发机构——因为它*就是*一个普通的 `.com`。访客无需做任何特殊操作。

ENS 和 Unstoppable 域名靠自己跨不过这道门槛。Unstoppable 坦言它的域名需要帮手：[你可以下载我们的扩展程序，在 Chrome 和 Firefox 上进行域名解析](https://support.unstoppabledomains.com/support/solutions/articles/48001181690-what-are-nft-domains-#:~:text=you%20can%20download)，它们只在 Brave、Opera 等少数几个对加密友好的浏览器里能原生解析。ENS 的 `.eth` 域名在标准浏览器里也是同样的状况——没有解析器、网关或扩展程序就不行。这并不是在贬低它们的工程实现——这是一种刻意的设计选择，正是它让这些系统获得了在 ICANN 之外自由迭代的空间。但它改变了你的买家是谁：你主要面向的是 [web3](/zh-CN/glossary/web3/) 和钱包原生的受众，而不是那个期望域名能在原生 Chrome 里加载出来的大众市场。

有一个值得了解的细微之处：ENS 是在*朝着* DNS 搭桥，而不是远离它。其文档指出，[ENS 支持 DNS 域名，允许用户通过 DNSSEC 把 DNS 域名导入 ENS](https://docs.ens.domains/learn/dns#:~:text=supports%20DNS%20names)，依靠的是 [DNSSEC](/zh-CN/glossary/dnssec/)。所以一个 `.com` 所有者可以把自己的真实域名投射进 ENS——但那是 DNS 域名在常规互联网上完成解析，ENS 只是叠加了一层链上身份。它并不会让 `.eth` 本身能在标准浏览器里解析。

## 续费：明年你欠不欠钱？

续费模式是这三者分道扬镳之处，它直接命中你的持有成本——也是翻转者可能踩到坑、栽个大跟头的地方。

ENS 的 `.eth` 域名带有一笔年费。官方注册商文档对定价讲得很明确：[一个 5 个字母及以上的 .eth 每年收你 5 美元，4 个字母的每年 160 美元，3 个字母的每年 640 美元](https://docs.ens.domains/registry/eth/#:~:text=letter%20%60.eth%60%20will%20cost%20you)，并且[这笔费用以 ETH 支付](https://docs.ens.domains/registry/eth/#:~:text=This%20fee%20is%20paid%20in%20ETH)。一旦错过，会有一个宽限期，而在那之后，按 ENS 的说法，[域名到期 90 天后（即宽限期结束后），该域名会进入临时溢价拍卖](https://docs.ens.domains/registry/eth/#:~:text=90%20days%20after%20a%20name%20expires)。对于短而值钱的 `.eth` 域名来说，续费是一笔实打实的开支。

Unstoppable Domains 主打的是相反的模式：一次性买断。其文档称 Web3 域名[不会被夺走、无需续费、终身归你所有](https://support.unstoppabledomains.com/support/solutions/articles/48001181690-what-are-nft-domains-#:~:text=don%27t%20require%20renewals%2C%20and%20are%20yours%20for%20life)。对于买入并长期持有的翻转者来说，没有年度账单很有吸引力，不过"终身"是关于该协议意图的说法，而非 ICANN 的保证——这些域名只在读取它们的解析基础设施还在运行时才存在。

代币化 DNS 域名遵循正常的 ICANN 经济逻辑：你向注册商交一笔年度续费，gTLD 注册的期限最多为 10 年。这是一笔经常性成本，但它就是每一位 `.com` 投资者早已计入预算、再熟悉不过的那笔成本。代币化并不会额外增加第二笔续费——代币只是追踪它底下那一份 DNS 注册。

## 谁真正掌控这个域名

![三块控制面板的编辑插画，每块都有一个续费时钟和一把钥匙——一把钥匙完全握在一只用户的手中，另外两把则伸向一座高耸的注册局塔楼](../../assets/ens-vs-unstoppable-vs-tokenized-dns-03-who-controls.jpg)

"自托管"这个词在三者身上都被用得很随意，所以要把每一层上"控制"究竟意味着什么说精确。

对 ENS 和 Unstoppable 而言，链上控制权确实是你的：握住[私钥](/zh-CN/glossary/private-key/)，就握住了域名，没有哪个注册商能通过一张工单把它收回去。这正是用钱包托管取代[托管所有权](/zh-CN/glossary/custodial-ownership/)的真正吸引力所在。问题在于，"这个域名"只有在那些认可它的解析系统里才有意义。如果你掌控着代币，但唯一能解析它的地方只有一个浏览器扩展和一些 dApp，那么你的控制权是真实的，但它的*触及范围*受限于采用度。

对代币化 DNS 域名来说，控制权是分层的。你钱包里的代币掌管链上的所有权和转移；底层域名仍然是一个真实的 ICANN 域名，这意味着它依然要服从续费、ICANN 政策以及 [UDRP](/zh-CN/glossary/udrp/) 争议——和每一个 `.com` 所遵循的是同一套规则。一个靠谱的代币化平台会让这两层保持同步，于是转移代币就等于转移域名，并通过 DNS 连续性保证在交接过程中线上站点不会中断。你既得到了钱包原生的控制权，*又*得到一个整个互联网早已认可的域名。这个取舍是诚实的：你并不"身处系统之外"，因为这项资产是一个真实的域名，要对现实世界的规则负责。我们在[钱包丢失后找回代币化域名](/zh-CN/blog/recovering-a-tokenized-domain-after-wallet-loss/)中对托管这个问题谈得更深。

## 流动性，以及它们在哪里出售

因为这三者都是 [ERC-721](/zh-CN/glossary/erc-721/) 式的 NFT（或与之相近），它们都能在 NFT [市场](/zh-CN/glossary/marketplace/)上挂单，并以一次买家付款即收货的[原子](/zh-CN/glossary/atomic-transfer/)互换完成转移——不需要第三方[托管](/zh-CN/glossary/escrow/)代理在交易中途持有资产。正是这套共享的底层管道，让链上域名特别适合拿来翻转，我们在[代币化市场如何取代托管](/zh-CN/blog/how-tokenized-marketplaces-replace-escrow/)中讲到了这一点。

不过买家群体各不相同。ENS 在三者中拥有最深的二级市场——优质 `.eth` 域名曾以高价成交。CoinGecko 记录显示，[有史以来卖得最贵的加密域名是 "paradigm.eth"，它于 2021 年 10 月 9 日以 151 万美元（420 ETH）成交](https://www.coingecko.com/research/publications/most-expensive-crypto-domains#:~:text=paradigm.eth%22%2C%20which%20sold%20for)，The Block 也报道过 [Ethereum Name Service（ENS）域名 000.eth 以 300 ETH（31.5 万美元）被买下](https://www.theblock.co/post/155685/ethereum-name-service-records-second-highest-ens-name-sale#:~:text=000.eth%20was%20purchased%20for%20300%20ETH)。这些都是真实的数字，但要把它们当作异常值来看待，就像 `Voice.com` 在 DNS 世界里是个异常值一样——它们告诉你天花板存在，却不代表一个典型域名能卖出多少。你看到引用的任何"地板价"数字都是一个不断变动的估计，而非事实。

代币化 DNS 域名触及的是一个不同且更大的买家群体：任何想要一个真实、随处可解析的域名*再加上*钱包原生所有权的人。这正是那群想让域名能在任意浏览器里加载、能跑邮件、能携带一张 SSL 证书——同时又不放弃把它当作 NFT 卖出选项的受众。

## 该翻转哪一种

没有唯一的赢家；只有适合你买家的那一种。

- **翻转 ENS `.eth`**，如果你卖给的是看重短数字或短单词域名作为链上身份的加密原生受众，而且你能接受为任何值得持有的域名承担年度续费。
- **翻转 Unstoppable 域名**，如果你的买家想要的是一个免续费、钱包优先的 web3 身份，而在标准浏览器里能否解析对他们来说并非优先项。关于这一命名空间如何估值，参见[优质 web3 TLD](/zh-CN/blog/premium-web3-tlds/)。
- **翻转代币化 DNS 域名**，如果你想要最大的买家池，以及一个真正*能用*的域名——一个真实的 ICANN `.com`/`.io`/`.xyz`，你可以持有它、对它编程、在链上把它卖掉，同时它对所有人都能解析。从[如何代币化你的 .com](/zh-CN/blog/how-to-tokenize-your-com/)开始，如果你正在权衡平台，[选择域名代币化平台](/zh-CN/blog/choosing-a-domain-tokenization-platform/)梳理了各项标准。

至于为什么这一切都胜过旧的托管加信任模式这个更宏大的图景，[域名翻转](/zh-CN/blog/domain-flipping/)中心页把整套技能栈串在了一起，而[为什么要代币化域名](/zh-CN/blog/why-tokenize-domains/)则深入讲了其中的好处。无论你交易的是哪一类，在报价之前先弄清楚你钱包里到底是哪种资产——因为可解析性、续费和控制权不是细节，它们就是产品本身。

## 友情免责声明（请务必阅读！）

> 我们不是律师、会计师、理财顾问或医生，**本文中的任何内容都不构成法律、财务、税务、会计、医疗或任何其他类别的专业建议。** 我们写这些文章是为了教育我们自己，也是为方便我们的客户。这里的信息可能已经过时、只适用于特定地区，或者干脆就是错的。我们也会犯错。

> 对于任何重要决定，**请咨询一位真正的专业人士（认真的！）**。或者如果那不合你的风格，那就问问朋友、问问 Twitter、问问 Reddit、问问 AI，或者问问算命师。一句话：**DOYR——做你自己的研究（Do Your Own Research）**。让我们一起学习，一起享受乐趣。

## 来源与延伸阅读

- ENS 文档 —— [ENS 协议：把人类可读的名称映射到地址](https://docs.ens.domains/learn/protocol#:~:text=maps%20human%2Dreadable%20names)
- ENS 文档 —— [ETH 注册商：.eth 像任何其他 ERC721 代币一样转移；年度定价（每年 5 / 160 / 640 美元）；费用以 ETH 支付；90 天宽限期](https://docs.ens.domains/registry/eth/#:~:text=transfer%20their%20name%20just%20like%20with%20any%20other%20ERC721%20token)
- ENS 文档 —— [ENS 支持通过 DNSSEC 导入 DNS 域名](https://docs.ens.domains/learn/dns#:~:text=supports%20DNS%20names)
- Unstoppable Domains 支持 —— [Web3 域名作为 NFT 存储在你的钱包中；无需续费、终身归你；Chrome 与 Firefox 需要浏览器扩展](https://support.unstoppabledomains.com/support/solutions/articles/48001181690-what-are-nft-domains-#:~:text=stored%20in%20your%20crypto%20wallet%20as%20digital%20assets)
- CoinMarketCap —— [Unstoppable Domains 在 Ethereum 区块链上铸造为 NFT](https://coinmarketcap.com/academy/glossary/unstoppable-domains#:~:text=minted%20as%20a%20non%2Dfungible%20token)
- CoinGecko Research —— [最贵的加密域名：paradigm.eth 以 151 万美元（420 ETH）成交，2021 年 10 月 9 日](https://www.coingecko.com/research/publications/most-expensive-crypto-domains#:~:text=paradigm.eth%22%2C%20which%20sold%20for)
- The Block —— [000.eth 以 300 ETH（31.5 万美元）被买下，第二高的 ENS 成交记录](https://www.theblock.co/post/155685/ethereum-name-service-records-second-highest-ens-name-sale#:~:text=000.eth%20was%20purchased%20for%20300%20ETH)
