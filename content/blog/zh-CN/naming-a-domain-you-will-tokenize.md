---
title: "把域名铸造成 NFT，会跳过注册局的 IDN 检查"
date: '2026-09-01'
language: zh-CN
tags: ['idn', 'punycode', 'confusable-domains', 'ens', 'tokenized-domains', 'namehash']
authors: ['aileen-wright']
editors: ['victor-zhou']
translators: ['fenwei-bian']
draft: false
cluster: domain-tokenization
format: guide
description: 按照 ICANN 政策，注册局会在注册环节运行易混淆字符检查；把同一个域名铸造成 NFT，则完全绕开这道检查。
ogImage: ../../assets/naming-a-domain-you-will-tokenize-og.jpg
keywords: ['IDN 域名 NFT', 'Punycode NFT', '易混淆域名', '同形异义域名', 'ICANN IDN 准则', 'ENS 规范化', 'ENSIP-15', 'namehash 大小写敏感', 'xn-- 域名', '代币化域名安全', '全脚本易混淆项', '域名 NFT 铸造风险', 'Unicode 域名', 'namefi']
relatedArticles:
  - /zh-CN/blog/what-are-tokenized-domains/
  - /zh-CN/blog/how-to-tokenize-your-com/
  - /zh-CN/blog/dns-on-tokenized-domains/
  - /zh-CN/blog/ens-vs-dns-domain-flipping/
  - /zh-CN/blog/selling-domains-as-nfts/
relatedTopics:
  - /zh-CN/topics/domain-tokenization/
  - /zh-CN/topics/domain-security/
relatedSeries:
  - /zh-CN/series/tokenize-your-com/
  - /zh-CN/series/blockchain-concepts/
relatedGlossary:
  - /zh-CN/glossary/idn/
  - /zh-CN/glossary/ens/
  - /zh-CN/glossary/erc-721/
  - /zh-CN/glossary/icann/
  - /zh-CN/glossary/hash-function/
---

假设你拥有 `café.com`。在它变得可注册之前，这个标签经过了一道普通 ASCII 域名从未遇到过的检查：注册局会核对它是否完全落在 [ICANN](/zh-CN/glossary/icann/) 允许该名称使用的字符范围之内，还要核对它在视觉上是否会和别人已经持有的名称混淆。现在你想把它[铸造成 NFT](/zh-CN/blog/what-are-tokenized-domains/)。你调用一个智能合约、签署一笔交易，一枚代表 `café.com` 的代币就进了你的钱包。这条路径上没有注册局介入，没有查过任何 IDN 表，也没有运行任何易混淆字符检查。二十多年标准化工作为域名注册筑起的保护，并不会延伸到铸造这一步——不是因为谁把它关掉了，而是因为铸造从来就不在这套保护的适用范围之内。

这道缺口，才是给打算代币化的域名命名时真正的风险所在。它和把名字取短没有任何关系——无论是 NFT 元数据标准，还是读取它的各大市场，都没有设下任何值得你据此设计的长度限制。真正的裂缝要窄得多：一个非 ASCII 标签，会在你毫不察觉的情况下被重新编码成一串和它长得完全不像的 ASCII 字符串，供 DNS 使用；来自其他文字系统、和拉丁字符视觉上完全一致的字符，会带来 Unicode 自身都将其列为安全类别的仿冒风险；而哈希函数不会像 DNS 那样对大写字母网开一面。这些都是有文档可查的协议事实，不是什么风格建议，而且一旦名称脱离注册局的管辖、变成一枚代币，它们各自的表现方式也会随之不同。

## 同一个标签，两串字符，两类受众

每一个超出纯 ASCII 范围的[国际化域名](/zh-CN/glossary/idn/)，都有两种表示形式。你读到的那一种——`café.com`——叫作 U-label。DNS 实际存储和传输的是 A-label：一串完全由字母、数字和连字符组成的字符串，使用一种叫作 Punycode 的编码方式，IETF 将其标准化，用来[将 Unicode 字符串唯一且可逆地转换为 ASCII 字符串](https://www.rfc-editor.org/rfc/rfc3492#section-1:~:text=It%20uniquely%20and%20reversibly%20transforms%20a%20Unicode%20string%20into%20an%20ASCII%20string)。对 `café` 运行这个算法，输出的是 `xn--caf-dma`——用这种方式生成的每一个 A-label，都以 `xn--` 前缀开头，所以在协议层，`café.com` 就变成了 `xn--caf-dma.com`。

那两串字符出现在不同的地方，而问题恰恰就藏在这个分岔口上：

- **[DNS](/zh-CN/glossary/dns/) 解析器和区域文件**看到的、拿来比对的，始终只有 A-label。签发该域名的注册局也要求如此：当两种形式同时提交时，[注册局必须确保 A-label 形式为小写](https://www.rfc-editor.org/rfc/rfc5891#section-4.2.1:~:text=MUST%20ensure%20that%20the%20A%2Dlabel%20form%20is%20in%20lowercase)，将其转换后，再与 U-label 交叉核对，才允许注册生效。
- **浏览器地址栏**会把 A-label 反向解码回 `café.com` 用于显示，除非它判断这串字符可疑到需要直接显示原始的 `xn--caf-dma.com`——浏览器之所以保留这条后备规则，正是因为 U-label 恰恰是攻击者用来武器化的那种形式。
- **NFT 的链上元数据**则完全没有这种义务。[ERC-721](/zh-CN/glossary/erc-721/) 的元数据模式定义了一个普通的 `name` 字段，它只是简单地[标识该 NFT 所代表的资产](https://eips.ethereum.org/EIPS/eip-721#specification:~:text=Identifies%20the%20asset%20to%20which%20this%20NFT%20represents)；OpenSea 自己的文档也只说，[元数据控制着 NFT 显示的名称、媒体、描述和特征](https://docs.opensea.io/docs/metadata-standards#:~:text=That%20metadata%20controls%20the%20name%2C%20media%2C%20description%2C%20and%20traits%20shown%20for%20an%20NFT)。这两份文档都不要求 Punycode 编码，不要求文字系统校验，也没有设下字符数上限——你可能在别处读到过的那句“保持简短”的建议，背后并没有任何标准撑腰。铸造合约往 `name` 字段里写入什么字符串，钱包或市场就会原样打印出什么字符串，不经任何处理。

所以，一个代币化的 `café.com`，完全可以在元数据里携带干净的 U-label，而它底下的 DNS 层却始终只认 A-label。这不是任何一方系统的 bug——而是两套相隔几十年建立起来的协议，彼此从未承诺过要互相对齐。

## ICANN 究竟要求注册局检查什么

域名所有者很少去想的那层易混淆字符保护，其实都写在同一份文件里：ICANN 的[《国际化域名实施准则》第 4.1 版](https://www.icann.org/en/system/files/files/idn-guidelines-22sep22-en.pdf#page=4)，2022 年 9 月通过。它在注册局**必须**做的事和仅仅**被鼓励**去做的事之间划出了一条清晰的界线，而这条线，恰好就落在真正的风险所在之处。

| 准则条款 | 内容 | 约束级别 |
|---|---|---|
| 15 | 单个 IDN 标签内的所有码点，必须取自同一个 Unicode 文字系统，仅对已有混合文字系统惯例的语言留有少量例外 | **必须** |
| 16 | 在例外情况下允许混合文字系统时，不同文字系统中视觉上易混淆的字符，不得在没有明确政策的情况下并存 | **必须** |
| 14 | 鼓励注册局考虑制定政策，以减少同一文字系统*内部*因同形字符引起的 IDN 标签混淆 | 仅为鼓励 |
| 17 | 鼓励注册局施加额外限制，以减少 Unicode 自身安全标准所定义的**全脚本易混淆项**（Whole-Script Confusables） | 仅为鼓励 |

这四条里，两条是硬性要求，两条只是注册局可以自行跳过的建议。这个区分很重要，因为它精确地告诉你，哪种仿冒手法被政策堵死了，哪种没有。

## 一家真实运营的注册局，实际执行到什么程度

Verisign 运营着 `.com` 和 `.net` 注册局，它发布了自己的 [IDN 注册规则](https://www.verisign.com/resources/internationalized-domain-names/idn-registration-rules/#:~:text=Verisign%E2%80%99s%20registries%20reject%20the%20commingling%20of%20code%20points%20from%20different%20Unicode%20scripts)，落实 ICANN 的强制性准则：“作为一项规则，Verisign 的注册局拒绝来自不同 Unicode 文字系统的码点混用。也就是说，如果一个 IDN 包含来自两种或以上 Unicode 文字系统的码点，该 IDN 注册就会被拒绝……这样做是为了防止不同文字系统中易混淆的码点出现在同一个 IDN 里。”一个把拉丁字母 `p` 和西里尔字母 `а`（U+0430）混在一起的标签——Unicode 安全标准用作教科书级示例的经典钓鱼手法，渲染出来就是 [`pаypаl`](https://www.unicode.org/reports/tr39/#Mixed_Script_Confusables)，紧挨着真正的 `paypal`——正是这条规则所拦下的对象。它压根到不了 DNS 这一层。

但看看这条规则*没有*覆盖到什么。它拒绝的是混用——同一个标签里出现两种文字系统——对于一个完全由单一外语文字系统构成、却恰好和拉丁文字看起来一模一样的标签，它只字未提。Unicode 的《技术标准 #39》给这种情况起了个名字：**全脚本易混淆项**（whole-script confusable），并给出了自己的经典范例——拉丁词 [`scope`](https://www.unicode.org/reports/tr39/#def_whole_script_confusables) 旁边放着 `ѕсоре`，一串完全由西里尔字母组成、逐个字形都渲染成同样样子的字符串。Verisign 的五条规则里，没有一条会去筛查这种情况：这不算混用违规，因为 `ѕсоре` 里的每一个字符都确确实实属于西里尔文字系统。而按照上面的表格，抓住这种情况属于 ICANN 准则 17——只是鼓励，并非强制。注册局可以选择实现这项检查，也完全可以选择不做。

这才是“注册局保护”这句话诚实的版本：它是真实存在的，但比听起来要窄得多。在一个主要注册局，单个标签内部的跨文字系统混用，已经被规则堵死了。而干净地换成另一套*看起来*一样的文字系统，则完全交由各家注册局自行裁量；一旦一个标签通过了注册，它在那一刻获得的保护是多少，往后就只有多少。铸造这一步不会再加上任何新的保护；代币合约不运行任何 IDN 表，也不查询任何注册局政策——因为它从来就不是为此而设计的。

以上说的都不是某个具体代币化域名身上真实发生过的事件——目前没有任何公开报告显示某个市场向买家展示过未经处理的原始 `xn--` 字符串，也没有报告显示有全脚本易混淆项被铸造出来去欺骗买家。它描述的是这些协议本身的形状：哪些检查存在，哪些不存在，以及一个域名在哪个节点从一边跨到另一边。

## 精确性问题：DNS 会宽容大小写，哈希不会

第一个缺口之下，还藏着第二个不相干的缺口。DNS 一直把大小写当作装饰性的东西。核心规范说得很直白：域名的大小写[不具有任何意义](https://www.rfc-editor.org/rfc/rfc1035#section-2.3.1:~:text=Note%20that%20while%20upper%20and%20lower%20case%20letters%20are%20allowed%20in%20domain%20names%2C%20no%20significance%20is%20attached%20to%20the%20case)，`CAFE.com` 的解析结果和 `cafe.com` 完全一样。这种宽容早已深深写进了 DNS 的基因，以至于当前的国际化标准 IDNA2008，也专门为 A-label 划出了同样的界线，要求[一对 A-label 必须按大小写不敏感的 ASCII 方式比较](https://www.rfc-editor.org/rfc/rfc5891#section-3.1:~:text=A%20pair%0Aof%20A%2Dlabels%20MUST%20be%20compared%20as%20case%2Dinsensitive%20ASCII)。但紧接着同一句话，又为 Unicode 形式划出了第二条界线：[U-label 必须按原样比较，不做大小写折叠或任何其他中间处理](https://www.rfc-editor.org/rfc/rfc5891#section-3.1:~:text=U%2Dlabels%20MUST%20be%20compared%0Aas%2Dis%2C%20without%20case%20folding%20or%20other%20intermediate%20steps)。大小写不敏感，从来都不是 Unicode 文本本身的通用属性——它是 ASCII 这一层特意设计出来的一个具体特性。

一个密码学[哈希函数](/zh-CN/glossary/hash-function/)，根本没有与“大小写”对应的概念。Keccak-256 是以太坊无处不在使用的哈希算法，它把字符串当作一串精确的字节来处理。分别对“Alice”和“alice”这两种在人类看来完全相同的拼法运行它，会得到两个毫不相干的 32 字节输出：

```
keccak256("Alice") = 0x81376b9868b292a46a1c486d344e427a3088657fda629b5f4a647822d329cd6a
keccak256("alice") = 0x9c0257114eb9399a2985f8e75dad7600c5d89fe3824ffa99ec1c3eb8bf3b0501
```

这两行代码就是整个问题的缩影：哈希不是一个用来比较名称的函数，对字符串做哈希这件事本身，并不会自动继承 DNS “忽略大小写”这个决定。任何通过对原始标签做哈希来铸造代币化名称的系统，不管它愿不愿意，都会继承这种精确性。

[以太坊域名服务](/zh-CN/glossary/ens/)很早就撞上了这个问题，不得不在自己的规范里把它修好。ENS 的 namehash 算法本身并不做任何大小写折叠——它就是一个纯粹的递归哈希，`sha3(namehash(remainder) + sha3(label))`——但标准要求，规范化必须在 namehash 看到字符串*之前*运行完成：[UTS46 规范化流程会在哈希之前对标签做大小写折叠，所以两个大小写不同但拼写相同的名称，会产生相同的 namehash](https://eips.ethereum.org/EIPS/eip-137#name-syntax:~:text=the%20UTS46%20normalisation%20process%20case%2Dfolds%20labels%20before%20hashing%20them%2C%20so%20two%20names%20with%20different%20case%20but%20identical%20spelling%20will%20produce%20the%20same%20namehash)。跳过这道预处理步骤——像上面那两行例子一样，直接对原始标签做哈希——`Alice.eth` 和 `alice.eth` 就会变成两个互不相干的链上标识符，尽管在每一个人类读者眼里，它们说的是同一个名字。

但原来那套 UTS46 方案，后来被证明还不够用。ENS 后来发布了 [ENSIP-15](https://docs.ens.domains/ensip/15#motivation)，这是一套专门为此制定的规范化标准——用规范自己的话说，是因为[ENS 的成功，反而助长了通过插入零宽字符、替换易混淆（外观相似）字符、混用不兼容文字系统等手法进行的仿冒](https://docs.ens.domains/ensip/15#motivation:~:text=Substitution%20of%20confusable%20%28look%2Dalike%29%20characters)，等等。一个已经在跑大小写折叠规范化的生态系统，居然还要专门写出一份 15 页的规范去堵住进一步的仿冒漏洞，这是目前能找到的、证明这类风险是真实存在而非纸上谈兵的最有力证据——协议不会为了修补从未发生过的问题而被重写。而 ENSIP-15 对自身覆盖范围的边界也很坦诚：它直接声明[本 ENSIP 只处理单字符易混淆问题](https://docs.ens.domains/ensip/15#security-considerations:~:text=This%20ENSIP%20only%20addresses%20single%2Dcharacter%20confusables)，同时承认存在它防御范围之外的多字符易混淆序列。

## 铸造之前，这些结论意味着什么

以上这些，都不是让你回避带重音符号、西里尔字母、汉字或其他任何非拉丁字符的域名去做代币化的理由——DNS 生来就是为了承载这些名称，IDNA2008 也让这种承载变得可靠，不管你是在[代币化一个 `.com`](/zh-CN/blog/how-to-tokenize-your-com/)，还是在[铸造一个准备出售的域名](/zh-CN/blog/selling-domains-as-nfts/)。它们是让你精确弄清楚：哪些保护跟着域名一起走了，哪些没有：

- **搞清楚你自己这个标签的两种形式。** 铸造之前，先查一下你域名的 A-label（任何 IDN 转换工具都能给出结果），再确认铸造流程往代币的 `name` 字段里写入的，究竟是 U-label 还是 A-label。普通的 [DNS 在代币化域名之下依然照常工作](/zh-CN/blog/dns-on-tokenized-domains/)，所以这不是一道二选一的题——而是一个“铸造记录下的到底是什么”的问题。
- **一个已经通过注册的全脚本易混淆项，保留的只是它当时获得的那份保护，不会更多。** 如果你的域名所在的文字系统里存在一个拉丁字母的近似形态，那个近似形态能否注册，未必被某条强制规则挡住；铸造不会再加上第二道检查。
- **如果某个平台会根据你的标签计算链上标识符，先问一句它是否先做了规范化处理。** 一个没有经过 ENS 那种规范化步骤、直接对原始字符串做哈希的系统，会悄无声息地把 `Domain.com` 和 `domain.com` 当成两个互不相干的代币，不会有任何错误提示指出这处不匹配——这是一种和[ENS 与 DNS 更普遍层面上的分歧](/zh-CN/blog/ens-vs-dns-domain-flipping/)不同的失败模式。
- **当“保持名称简单”这条建议被包装成一条显示安全规则时，请对它保持怀疑。** 代币标准和 OpenSea 的文档里，都找不到任何有文档可查的长度或截断限制能为这条建议撑腰。真正的风险就是上面列出的那几种，而且不管名称长短，它们同样适用。

Namefi 自己的铸造流程，恰好就踩在这道裂缝上——它把一个已经存在于 DNS 里的域名，变成一枚代币，所以“DNS 规范化”和“链上精确性”之间的这道边界，对它来说不是什么假设性的问题，而是产品在每一次铸造时都必须做对的事。这也是检验任何做这类铸造的平台——包括 Namefi 在内——是否诚实的标准：问它往代币元数据里写入的是什么字符串，问它在哈希一个标签之前有没有先做规范化，再问它能不能把答案直接展示给你看，而不是让你单凭信任。

## 来源与延伸阅读

- ICANN —— [《国际化域名实施准则》第 4.1 版](https://www.icann.org/en/system/files/files/idn-guidelines-22sep22-en.pdf)（2022 年 9 月 22 日），准则 14–17，第 4 页。
- Verisign —— [国际化域名注册规则](https://www.verisign.com/resources/internationalized-domain-names/idn-registration-rules/) —— 抓取于 2026-09-01。
- Unicode 联盟 —— [UTS #39：Unicode 安全机制](https://www.unicode.org/reports/tr39/) —— 易混淆检测、混合文字系统易混淆项、全脚本易混淆项。
- IETF —— [RFC 3492：Punycode](https://www.rfc-editor.org/rfc/rfc3492) —— 每一个 `xn--` 域名背后的编码方式。
- IETF —— [RFC 5891：应用程序中的国际化域名（IDNA）：协议](https://www.rfc-editor.org/rfc/rfc5891) §3.1 与 §4.2.1。
- IETF —— [RFC 1035：域名——实现与规范](https://www.rfc-editor.org/rfc/rfc1035) §2.3.1，DNS 大小写不敏感规则的最初出处。
- Ethereum —— [EIP-137：以太坊域名服务——规范](https://eips.ethereum.org/EIPS/eip-137) —— namehash 算法及其大小写折叠要求。
- Ethereum —— [EIP-721：非同质化代币标准](https://eips.ethereum.org/EIPS/eip-721) —— 元数据 `name` 字段。
- ENS —— [ENSIP-15：ENS 名称规范化标准](https://docs.ens.domains/ensip/15) —— 动机、算法与安全考量。
- OpenSea —— [元数据标准](https://docs.opensea.io/docs/metadata-standards) —— 抓取于 2026-09-01。
