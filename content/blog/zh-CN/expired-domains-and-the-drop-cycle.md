---
title: "详解过期域名与掉落周期"
date: '2026-06-21'
language: zh-CN
tags: ['domains', 'domain-investing', 'domain-flipping', 'explainer']
authors: ['fenwei-bian']
editors: ['victor-zhou']
translators: ['fenwei-bian']
draft: false
cluster: domain-investing
series: domain-flipping-skills
seriesOrder: 3
format: explainer
description: "注册商的续费期限与注册局的删除流程并不相同。本文解释赎回、待删除、到期拍卖与抢注，并说明期限的适用范围。"
ogImage: ../../assets/expired-domains-and-the-drop-cycle-og.jpg
keywords: ['过期域名', '域名掉落周期', '域名生命周期', '赎回宽限期', '待删除', '域名抢注', '过期域名', '域名如何过期', '掉落域名', '域名狙击', '购买过期域名', '域名赎回期', '域名何时掉落', '域名预订单', '寻找可翻转的域名']
relatedArticles:
  - /zh-CN/blog/domain-backorders-and-drop-catching/
  - /zh-CN/blog/domain-flipping/
  - /zh-CN/blog/how-to-win-domain-auctions/
  - /zh-CN/blog/hand-registering-domains-to-flip/
  - /zh-CN/blog/when-to-drop-a-domain/
relatedTopics:
  - /zh-CN/topics/domain-investing/
  - /zh-CN/topics/domain-basics/
relatedSeries:
  - /zh-CN/series/domain-flipping-skills/
  - /zh-CN/series/name-change-game-change/
relatedGlossary:
  - /zh-CN/glossary/registrar/
  - /zh-CN/glossary/icann/
  - /zh-CN/glossary/tld/
  - /zh-CN/glossary/dns/
  - /zh-CN/glossary/registry/
---

域名过期不等于开放注册。注册商决定客户的续费与拍卖流程。注册局决定删除与释放流程。本文以普通 `.com` 域名为例。国家和地区顶级域名以及赞助类顶级域名可能采用不同规则。读者必须核实具体后缀与注册商。

翻转者之所以关注市场的这个角落，是因为掉落的域名并非一张白纸。一个域名能走到掉落这一步，是因为曾有人注册它、使用它、然后弃之而去，所以它可能携带着年龄、外部链接、残留流量，或是一个本来你只能眼睁睁看着别人手注的字符串。这个周期是一条回收流，专门处理那些已经证明有人想要过的域名——它的风险特征与全新字符串不同，也是我们在[如何寻找可翻转的域名](/zh-CN/blog/how-to-find-domains-to-flip/)一文中梳理的供应渠道之一。本篇解读将逐个阶段走完整个生命周期，然后讲清楚掉落的域名会在哪里浮现，以及翻转者如何布局去捕获它们。

## 第一阶段：有效注册与续费窗口

注册局会在 `.com` 到期后自动延长注册期限。45天自动续费宽限期属于注册局与注册商的计费安排。注册商在适用期限内删除域名，可以获得相关费用抵扣。45天并不代表客户享有45天续费权。注册局日期延长也不能证明客户已经付款。[现行 `.com` 合同附录7第3.1.3节](https://itp.cdn.icann.org/en/files/registry-agreements/com/com-agreement-html-01-12-2024-en.htm)说明了计费安排。[ICANN现行政策第2.2节](https://www.icann.org/resources/pages/errp-2024-02-21-en)允许注册商在遵守相关规则的前提下删除过期注册。

## 第二阶段：赎回宽限期

![编辑插画：一个域名牌悬浮在倒计时表盘内的沙漏中，一只手递上一枚硬币，要在时间耗尽前支付找回费用](../../assets/expired-domains-and-the-drop-cycle-01-redemption.jpg)

普通 `.com` 域名在新增注册宽限期之外遭到删除后，会进入30天的 `redemptionPeriod`。删除操作启动赎回期，过期日期不会自动启动赎回期。原注册人应当联系执行删除的注册商申请恢复。注册局会停止域名解析。ICANN要求非赞助类通用顶级域名提供30天赎回期，但新增注册宽限期内的删除属于例外。恢复费用没有统一的100美元标准。读者应当核实恢复与续费的总价。[ICANN现行政策第3至4节](https://www.icann.org/resources/pages/errp-2024-02-21-en)说明了规则。

## 第三阶段：待删除

普通 `.com` 域名在赎回期结束后仍未恢复，会进入最后的待删除阶段。注册局在五个日历日内拒绝注册商的修改请求，随后清除注册记录。[现行合同附录7第3.3.2节](https://itp.cdn.icann.org/en/files/registry-agreements/com/com-agreement-html-01-12-2024-en.htm)规定了期限。

读者必须检查全部状态组合。`pendingDelete` 可以与 `redemptionPeriod` 或 `pendingRestore` 同时出现。出现组合状态时，读者应当按照赎回或恢复状态判断。[ICANN状态说明](https://www.icann.org/resources/pages/epp-status-codes-2014-06-16-en)解释了区别。公开状态不能单独确定精确释放时刻。45 + 30 + 5也不能保证域名在到期后第80天释放。

## 第四阶段：释放，以及抢夺它的混战

![编辑插画：几台自动化机器人服务器冲过一道敞开的闸门，要在一个域名牌释放的瞬间抢下这枚正在坠落的牌子](../../assets/expired-domains-and-the-drop-cycle-02-release-scramble.jpg)

注册局完成清除后，域名按照注册局规则重新开放注册。到期拍卖可能在删除之前完成交易，域名可能从未公开释放。注册商的拍卖日期不代表注册局的删除日期。买家必须核实具体渠道。

预订服务只会尝试获取域名，服务并不保证成功。多个服务不能各自完成同一个域名的新注册。同一服务成功获取域名后，多个客户的预订可能触发拍卖。例如，[Dynadot](https://www.dynadot.com/help/question/backorder-auction)会对成功获取且存在多个预订的域名举行公开拍卖。私密拍卖并非通用规则。

## 掉落的域名会在哪里浮现

![编辑插画：一个以放大镜为中心的寻源枢纽分出四条渠道——一张掉落清单、一张预订单凭据、一柄拍卖槌、一家二级市场店面——每条渠道都挂着一个域名牌](../../assets/expired-domains-and-the-drop-cycle-03-where-surface.jpg)

懂得这个周期，只有在你知道该去哪里盯着它时才有用。掉落的和将要掉落的域名会在几个可预测的地方浮现，而一套行之有效的寻源流程通常会同时从其中好几个地方抓取：

- **掉落清单与过期域名数据库。** 免费和付费的清单每天发布进入待删除的域名，往往可以按长度、[TLD](/zh-CN/glossary/tld/)、关键词、年龄和链接指标筛选——这是用来构建"即将释放域名"观察列表的原始数据源。
- **预订单与抢注平台。** 与其自己盯着日历，不如下一张预订单，由服务在释放时代你去争夺这个域名。这是争取任何热门域名的实务路径——参见[域名预订单与抢注](/zh-CN/blog/domain-backorders-and-drop-catching/)。
- **过期域名拍卖。** 许多注册商根本不会让有价值的过期库存进入公开掉落；它们会在宽限窗口期间或之后，把这些域名引入自己的过期拍卖，于是域名是被卖掉而非被释放。这与[如何赢得域名拍卖](/zh-CN/blog/how-to-win-domain-auctions/)中讲到的更广义渠道有所重叠。
- **二级市场平台。** 被别人抢到的、或被找回后重新挂牌的域名，会在[二级市场](/zh-CN/glossary/aftermarket/)上重新出现以供转售。这本身不是掉落，但大量掉落后的库存最终都汇集到这里。

翻转者的优势在于把渠道与域名匹配起来——一个竞争不激烈、出现在公开掉落清单上的字符串，是一手适合"接近手注"的牌，而一个高端的单词域名则需要预订单，并且很可能还要一笔拍卖预算。如果你的本能是去注册全新的字符串，那是一条正当而不同的路径，我们在[手注可翻转的域名](/zh-CN/blog/hand-registering-domains-to-flip/)中走过这条路。

## 以翻转者的视角读懂这个周期

持有人应当立即联系注册商核实续费期限与恢复费用。买家应当记录后缀、注册商、全部状态、查询时间、拍卖渠道及预订截止时间。读者不应当仅凭到期日期推算释放日期。后续转售或代币转移不会取消底层域名的续费义务。

**尽职调查随域名一同到来。** 一个掉落的域名会继承它的历史，而并非所有历史都是好的。在你为一个有年头的域名出价之前，先查它过去的用途、它的 [WHOIS](/zh-CN/glossary/whois/) 与所有权轨迹、是否有任何[注册商](/zh-CN/glossary/registrar/)锁，以及它是否曾托管过会玷污它的东西。一个过去侵犯过品牌的域名，到了你手里仍可能招来一桩 [UDRP](/zh-CN/glossary/udrp/) 投诉；既有的反向链接，可能是垃圾，也可能是金矿。掉落把资产*连同*它的包袱一起交到你手上。

## Namefi 的视角

抢到一个好的掉落域名只完成了一半的工作；当它下一次易手时，你会撞上每一笔高价值[域名交易](/zh-CN/glossary/domain-trading/)都会撞上的同一道摩擦。买家不会在域名转移之前付款，卖家不会在收到款之前转移它，而注册商之间的[授权码](/zh-CN/glossary/auth-code/)交接，在中间留下一段令人忐忑的空档。这种僵局正是[托管](/zh-CN/glossary/escrow/)存在的理由，而当一个有年头、富含链接的域名越值钱时，这道难题就越发尖锐。

## 友情免责声明（请务必阅读！）

> 我们不是律师、会计师、理财顾问，也不是医生，并且**本文中的任何内容都不构成法律、财务、税务、会计、医疗或任何其他类型的专业建议。**我们撰写这些文章是为了自我学习，也是为方便我们的客户。这里的信息可能已经过时、仅适用于特定地区，或者干脆就是错的。我们也会犯错。

> 对于任何重要决定，**请务必咨询真正的专业人士（说真的！）**。或者，如果那不合你的风格，那就问问朋友、问问 Twitter、问问 Reddit、问问 AI，或者问问算命先生。一句话：**DOYR——做你自己的研究（Do Your Own Research）**。让我们一起学习，一起开心。

来源核实日期：2026年10月22日（UTC）。译文保留原发布日期。

- [ICANN / Verisign — 现行 .com 合同附录7](https://itp.cdn.icann.org/en/files/registry-agreements/com/com-agreement-html-01-12-2024-en.htm)
- [ICANN — ERRP 2024](https://www.icann.org/resources/pages/errp-2024-02-21-en)
- [ICANN — EPP](https://www.icann.org/resources/pages/epp-status-codes-2014-06-16-en)
- [Dynadot](https://www.dynadot.com/help/question/backorder-auction)
