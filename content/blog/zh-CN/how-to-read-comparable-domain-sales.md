---
title: "如何解读域名的参考成交价（Comps）"
date: '2026-06-21'
language: zh-CN
tags: ['domains', 'domain-investing', 'domain-flipping', 'guide']
authors: ['fenwei-bian']
editors: ['victor-zhou']
translators: ['fenwei-bian']
draft: false
cluster: domain-investing
series: domain-flipping-skills
seriesOrder: 9
format: guide
description: "如何利用 NameBio 这类成交历史来为域名定价：找到真正可比的案例，针对后缀、长度和关键词做调整，并避开挑樱桃式选择的陷阱。"
ogImage: ../../assets/how-to-read-comparable-domain-sales-og.jpg
keywords: ['参考成交价', '域名 comps', '如何解读域名 comps', 'NameBio', '域名成交历史', '域名估值参考案例', '域名价格比较', '如何给域名定价', '域名估值可比案例', '域名成交数据', '查找可比域名', '域名 comp 调整', '域名投资 comps', '域名定价数据']
relatedArticles:
  - /zh-CN/blog/how-to-value-a-domain-name/
  - /zh-CN/blog/end-user-vs-reseller-domain-pricing/
  - /zh-CN/blog/domain-appraisal-tools-compared/
  - /zh-CN/blog/what-makes-a-domain-valuable/
  - /zh-CN/blog/domain-flipping/
relatedTopics:
  - /zh-CN/topics/domain-investing/
  - /zh-CN/topics/choosing-a-tld/
relatedSeries:
  - /zh-CN/series/domain-flipping-skills/
  - /zh-CN/series/domain-investor-field-guide/
relatedGlossary:
  - /zh-CN/glossary/registrar/
  - /zh-CN/glossary/tld/
  - /zh-CN/glossary/icann/
  - /zh-CN/glossary/dns/
  - /zh-CN/glossary/registry/
---

问问房地产评估师一栋房子值多少钱，他们不会瞎猜。他们会调出附近同类房屋近期的成交价，再以此为基础做调整。[域名估值](/zh-CN/glossary/domain-appraisal/)的逻辑完全一样，而"附近近期成交"在域名世界里的对应物，就是过往域名成交的公开记录：也就是参考成交价（comps）。学会解读它们，你几乎能为任何一个名字的报价提供有力支撑。读得马虎，你就会把自己说服到一个市场从未认可的数字上。

本指南正是我们在支柱文章[如何为域名估值](/zh-CN/blog/how-to-value-a-domain-name/)中所承诺的参考成交价深度剖析，也是更广泛的[域名翻转](/zh-CN/blog/domain-flipping/)技能体系中的一环。它会讲清楚成交数据藏在哪里、如何找到真正可比的案例、如何针对总会存在的差异做调整，以及那个比任何单一失误都更能毁掉估值的"挑樱桃"陷阱。

## 成交数据藏在哪里

参考成交价的原材料，是已披露域名成交的公开历史，而这方面的标准参考资料是 NameBio——一个可检索的历史域名成交价格数据库。它是整个行业引用的来源。维基百科关于域名二级市场的综述就引用它给出了市场的总量数据：[据 NameBio 统计，2024 年共记录了 144,700 笔域名成交，总额达 1.85 亿美元](https://en.wikipedia.org/wiki/Domain_aftermarket#:~:text=According%20to%20NameBio%2C%20144%2C700%20domain%20name%20sales%20totaling%20US%24185%20million%20were%20recorded%20in%202024)。当你寻找参考成交价时，搜索的就是这个数据池：每年数以万计的已披露成交，可按关键词、后缀、长度、价格和日期检索。这些记录来自已披露的[市场平台](/zh-CN/glossary/marketplace/)和[注册商](/zh-CN/glossary/registrar/)交易，这也正是为什么这个公开数据池规模庞大，却永远不完整。

关于这个数据池，有两个事实左右着后面的一切。第一，它严重偏向 `.com`。据同一篇综述，2024 年 [.com 域名的成交额占全年总额的 74.4%](https://en.wikipedia.org/wiki/Domain_aftermarket#:~:text=accounted%20for%2074.4%25%20of%20the%20year%27s%20total%20dollar%20volume)——所以你会为 `.com` 名字找到密集而可靠的参考案例，而越往其他[后缀](/zh-CN/glossary/tld/)走，数据就越稀薄。第二，市场年年都在变：2024 年的总成交额[比 2023 年增长了 32.8%](https://en.wikipedia.org/wiki/Domain_aftermarket#:~:text=rose%20by%2032.8%25%20compared%20to%202023)，尽管成交笔数反而下降了。一笔三年前成交的参考案例，是在与今天截然不同的市场里成交的，这就是你必须做出的一项调整。

自动化估值工具也是从同一口井里取水的。比如 GoDaddy 的估值工具就声称，其[算法运用专有的机器学习和真实市场成交数据来估算域名价值，并向你提供可比域名成交案例](https://www.godaddy.com/resources/skills/godaddy-domain-name-value-appraisal-tool#:~:text=algorithm%20uses%20proprietary%20machine%20learning%20and%20real%20market%20sales%20data%20to%20estimate%20domain%20values)，好让你更有底气地定价。这工具自动做的事，正是本指南教你手动去做的：调出[可比成交案例](/zh-CN/glossary/comparable-sales/)并加以权衡。学会自己解读参考成交价，才能让你去给机器做合理性核查，而不是盲目相信它——我们在[域名估值工具比较](/zh-CN/blog/domain-appraisal-tools-compared/)中对这些工具做了对比。

## 什么样的成交才算真正可比

![编辑插画：一张目标域名卡片，用实线连向若干匹配的可比域名，又用淡淡的虚线连向若干不匹配的域名](../../assets/how-to-read-comparable-domain-sales-01-true-comparable.jpg)

一笔参考成交价只有在真正*像*你的名字时才有用。最常见的估值错误，就是把任何包含你关键词的成交都当成支撑你报价的证据。它不是。一笔真正可比的成交，要在那些真正驱动价值的维度上与你的名字相匹配，而不只是那个词相同。

照着这份清单逐条核对，从最硬性的约束开始：

- **相同的后缀。** 一笔 `.com` 成交，绝不是 [`.net`](/zh-CN/glossary/tld/) 或 `.co` 名字的参考案例，没得商量。后缀是最大的价格杠杆之一，把它们混为一谈是骗自己最快的方式。如果你给一个 `.io` 定价，就去找 `.io` 的参考案例；给一个 `.xyz` 定价，就去找 `.xyz` 的参考案例。我们在[顶级域名 (TLD) 如何影响域名价值](/zh-CN/blog/how-tld-affects-domain-value/)中讲了为什么这道差距如此之大。
- **相同的长度类别。** 单字名字、短的双字名字、三字及以上的名字，以及用数字或连字符填充的名字，属于不同的资产类别。一个四字母的可品牌化名字，几乎说明不了一个十五字符的三字短语值多少钱。
- **相同的关键词类型与商业意图。** 一个与交易绑定的词（`loans`、`insurance`、`casino`）所处的价格曲线，和一个爱好类词截然不同。要匹配词的*种类*，而不只是话题。`puppies` 和 `mortgages` 都是常见的英语名词，但它们彼此并不构成参考案例。
- **相同的买家类型。** 这一点是新手翻转者最容易漏掉的。同一个名字，按批发价卖给另一位投资者，和按零售价卖给[终端用户](/zh-CN/glossary/end-user/)，价格可能天差地别。一笔[经销商](/zh-CN/glossary/reseller/)参考案例告诉你应该*支付*多少；一笔终端用户参考案例告诉你可能*拿到*多少。别把它们平均——它们衡量的是两个不同的市场，而这正是[终端用户价 vs. 经销商价](/zh-CN/blog/end-user-vs-reseller-domain-pricing/)的核心要义。
- **足够近期，才有意义。** 来自火热年份的一笔成交，与来自平淡年份的一笔成交，定价方式并不相同。给近期的参考案例更高的权重，而把几年前的成交当作方向性参考，而非决定性依据。

一笔在这五项上全部匹配的参考案例是金子。一笔只匹配两项的参考案例，是个你得大幅调整的起点。一笔只匹配一项——只匹配了关键词——的参考案例，几乎算不上证据。

## 针对总会存在的差异做调整

![编辑插画：一笔起始的参考成交价，经过后缀、长度和时机三组滑块的调节，移动到最终的调整后价格](../../assets/how-to-read-comparable-domain-sales-02-adjusting.jpg)

没有两个域名是完全相同的，所以每一笔参考成交价都需要调整。这正是估值从"查表"升级为一门技能的地方。原则一句话就能说清：从参考案例的价格出发，再针对你的名字与它每一处不同，把价格往上或往下移。

**后缀。** `.com` 是整个市场用来对标定价的基准。如果你的参考案例是 `.com`，而你的名字不是，那就往下调——往往要大幅下调——因为同一个字符串放在一个受信任度更低的后缀上，能要到的价就更少。如果你幸运地手握 `.com`，而你的参考案例是个较弱的后缀，那就往上调。优质后缀在自己的细分领域里会打破这条规则：一个 [`.io`](/zh-CN/tld/io/) 上的开发者工具，或一个 [`.ai`](/zh-CN/tld/ai/) 上的 AI 初创公司，价格可以逼近甚至超过一个通用的 `.com`，而二级市场已经注意到了这点——2024 年 `.ai` 的成交额[翻了一倍多，增长 107%](https://en.wikipedia.org/wiki/Domain_aftermarket#:~:text=more%20than%20doubled%2C%20rising%20107%25)。你要为这个后缀所处的市场定价，而不只是为这个后缀本身定价。

**长度与构成。** 更短、更干净的，往上调；更长、带连字符或用数字填充的，往下调。如果你的参考案例是 `cars.com` 那一档，而你的名字是 `bestcars-online.com`，那么这个参考案例是一个你远远够不到的天花板，而非一个地板。

**词的强度。** 一个真实、有人搜索、容易念出口的词，对照一个构建在更弱词上的参考案例时往上调，对照一个更强的词时往下调。这里要诚实。一个参考案例*包含*你的关键词，并不意味着它承载着同样的需求——`flowers` 和 `flowerz` 不是同一种资产，哪怕一次粗糙的匹配会把它们配成一对。

**市场时机。** 如果你最强的参考案例来自一个更火热的年份，就朝今天的行情把它折价。如果市场自那以来升温了，就往上微调。单一年份里 32.8% 的摆动提醒着我们："它当年卖了多少"和"它现在能卖多少"是两个不同的问题。

**附加价值。** 有些成交其实根本不能作为一个"裸名字"的参考案例，因为买家买的是一门*生意*，而不是一个字符串。当 QuinStreet 在 2010 年[以 4970 万美元现金](https://www.globenewswire.com/news-release/2010/11/08/433738/12254/en/QuinStreet-Announces-Acquisition-of-CarInsurance-com-Inc.html#:~:text=for%20%2449.7%20million%20in%20cash)买下 `CarInsurance.com` 时，这个价格并不是单为那个名字付的。Domain Name Wire 报道称，[其价值主要来自该网站获得的自然流量，以及这些流量如何转化为销售线索](https://domainnamewire.com/2010/11/09/quinstreet-bought-carinsurance-com-for-the-organic-traffic/#:~:text=the%20value%20comes%20primarily%20from%20the%20organic%20traffic)。把这样一笔成交当作同细分领域里一个停放、零流量域名的参考案例，会让你的数字虚高数百万美元。在比较之前，先把附加价值剥离出去，否则就干脆别用这笔成交。

## 挑樱桃的陷阱

![编辑插画：一只手挑出那根孤零零、特别高的异常柱形，却无视中位数附近那一簇普通成交](../../assets/how-to-read-comparable-domain-sales-03-cherry-picking.jpg)

下面这个错误，毁掉的估值比其他所有错误加起来还多：你找到了你关键词类型里那笔天价成交，把它当锚点，却无视它周围那上百笔普通成交。这是这一行里最容易掉进去的陷阱，因为数据本身就在诱惑你——最大的那些成交最有名、被引用得最多，找到它们时的成就感也最强。

公开记录天生就是这样勾你的。维基百科的最昂贵域名列表只收录[价值 300 万美元或以上的成交](https://en.wikipedia.org/wiki/List_of_most_expensive_domain_names#:~:text=most%20expensive%20domain%20name%20sales%2C%20with%20values%20of%20%243%20million)，并且[仅限于纯域名、纯现金的交易](https://en.wikipedia.org/wiki/List_of_most_expensive_domain_names#:~:text=limited%20to%20pure%20domain%20name%20and%20cash%2Donly%20sales)。那些头条数字——2019 年 [Voice.com](https://en.wikipedia.org/wiki/List_of_most_expensive_domain_names#:~:text=Voice.com) 的 3000 万美元、2010 年 [Sex.com](https://en.wikipedia.org/wiki/List_of_most_expensive_domain_names#:~:text=Sex.com) 的 1300 万美元、2001 年 [Hotels.com](https://en.wikipedia.org/wiki/List_of_most_expensive_domain_names#:~:text=Hotels.com) 的 1100 万美元——都是真实、经过核实的，但作为一个普通名字的参考案例却毫无用处。它们是单字、字典级的 `.com`，卖给了带着生存级需求和雄厚资产负债表的买家——这与一次像[从 TeslaMotors.com 到 Tesla.com](/zh-CN/blog/from-teslamotors-com-to-tesla-com/)这样的品牌重塑背后的逻辑如出一辙，定价的是买家的需求，而不是更广阔的市场。它们告诉你的是整个市场的天花板，而不是你这个名字的价格。

正确的做法是**对着整个分布定价，而不是对着峰值定价。** 当你调取参考成交价时，要把整个区间都收集起来，而不只是顶端那部分。看看中位数，看看那一簇最像你名字的成交，把那个高位异常值就当作它本来的样子——一个你应当剔除的异常值，除非你的名字真的配得上跻身它那一档。一个有用的习惯：把你最高的一笔和最低的一笔参考案例都扔掉，再用剩下的来构建你的价格区间。如果你那个站得住脚的价格完全取决于某一笔成交，那你手里就没有一个有参考成交价支撑的价格。你手里只有一个念想，而念想不是估值。

挑樱桃也会反向上演。一个跟你谈判的买家，会调出*最低*的那笔可比成交，把它当成市场行情摆出来。同一套纪律能在两个方向上都保护你：摸清你的完整分布，说出你真正的可比案例，你就既能在面对一厢情愿的卖家时、也能在面对压价的买家时为你的数字辩护。

## 一个快速实战演练

假设你手握 `BudgetTravel.io`，想给它定个价。错误的做法，是去找 `Travel.com` 那笔成名一战然后做白日梦。正确的做法，是把清单跑一遍。

从后缀开始：你需要 `.io` 的参考案例，所以无论那些 `.com` 成交多诱人，都把它们放到一边。定下长度与构成：`BudgetTravel` 是一个干净、常见的双字短语，所以要给那些同样简短、真实的双字名字更高的权重，而不是给塞满关键词或带连字符的名字。匹配关键词类型：travel 是一个真实的、有终端用户需求的商业品类，所以别拿爱好类词的成交去对照。检查买家类型：把批发性质的 `.io` 翻转和任何终端用户性质的 `.io` 成交分开，决定你估的是哪个数字。然后针对时机做调整，把更老的参考案例朝当前行情微调。

你最终得到的，是一个锚定在一簇真正相似成交上的*价格区间*，其中异常值已被剔除，剩下的每一笔参考案例都按其与你名字的差异做了调整。这个区间，就是一个你能在谈判中为之辩护的价格——而这恰恰就是估值的用途。当谈判变成一笔交易，下一个难题就是如何安全地完成结算；那正是[托管](/zh-CN/glossary/escrow/)的活儿，也是我们在[域名托管详解](/zh-CN/blog/domain-escrow-explained/)和[如何出售您拥有的域名](/zh-CN/blog/how-to-sell-a-domain-name-you-own/)中讲解的工作流。

## Namefi 视角

解读参考成交价，告诉你的是一个名字值多少钱。而这笔交易的另一半，是在你们就数字达成一致之后，证明这个名字确实干净利落地完成了易主。高价值的[域名交易](/zh-CN/glossary/domain-trading/)每一次都卡在同一道信任鸿沟上：买家不想在掌控资产之前就付钱，卖家也不想在钱款到账之前就放手。

这正是 [Namefi](https://namefi.io) 旨在收窄的那道鸿沟。把一个真实的 [ICANN](/zh-CN/glossary/icann/) 域名代币化，能让所有权变得可审计、可转移，并通过 [DNS](/zh-CN/glossary/dns/) 连续性，让名字在交接过程中持续解析。参考成交价给你一个站得住脚的数字；而一次干净、可验证的转移，则是把那个数字变成一笔成交的关键，让双方都无需先凭信任迈出第一步。

## 友情免责声明（请阅读！）

> 我们不是律师、会计师、理财顾问，也不是医生，而且**本文中的任何内容都不构成法律、财务、税务、会计、医疗或任何其他形式的专业建议。** 我们撰写这些文章，是为了自我学习，也是为了方便我们的客户。这里的信息可能已经过时、有地域局限，或者干脆就是错的。我们也会犯错。
>
> 对于任何重要决定，**请咨询真正的专业人士（说真的！）**。或者如果那不是你的风格，那就问问朋友、问问 Twitter、问问 Reddit、问问 AI，或者问问算命先生。一句话：**DOYR——自己动手做研究（Do Your Own Research）**。让我们一起学习，乐在其中。

## 来源与延伸阅读

- 维基百科 — [Domain aftermarket](https://en.wikipedia.org/wiki/Domain_aftermarket#:~:text=According%20to%20NameBio%2C%20144%2C700%20domain%20name%20sales%20totaling%20US%24185%20million%20were%20recorded%20in%202024)（NameBio 2024：144,700 笔成交 / 1.85 亿美元；.com 占成交额 74.4%；同比 +32.8%；.ai +107%）
- 维基百科 — [List of most expensive domain names](https://en.wikipedia.org/wiki/List_of_most_expensive_domain_names#:~:text=most%20expensive%20domain%20name%20sales%2C%20with%20values%20of%20%243%20million)（Voice.com 3000 万美元/2019，Sex.com 1300 万美元/2010，Hotels.com 1100 万美元/2001；收录范围为 300 万美元以上、纯现金交易）
- GoDaddy — [Domain Name Value & Appraisal tool](https://www.godaddy.com/resources/skills/godaddy-domain-name-value-appraisal-tool#:~:text=algorithm%20uses%20proprietary%20machine%20learning%20and%20real%20market%20sales%20data%20to%20estimate%20domain%20values)（机器学习 + 真实市场成交数据；提供可比成交案例）
- GlobeNewswire — [QuinStreet Announces Acquisition of CarInsurance.com, Inc.](https://www.globenewswire.com/news-release/2010/11/08/433738/12254/en/QuinStreet-Announces-Acquisition-of-CarInsurance-com-Inc.html#:~:text=for%20%2449.7%20million%20in%20cash)（4970 万美元现金，2010）
- Domain Name Wire — [QuinStreet Bought CarInsurance.com for the Organic Traffic](https://domainnamewire.com/2010/11/09/quinstreet-bought-carinsurance-com-for-the-organic-traffic/#:~:text=the%20value%20comes%20primarily%20from%20the%20organic%20traffic)
