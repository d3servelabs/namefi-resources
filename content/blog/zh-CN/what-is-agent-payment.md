---
title: "什么是智能体支付？为什么人人都在抢着提供它？"
date: '2026-08-13'
language: 'zh-CN'
tags: ['ai-agents', 'payments', 'explainer']
authors: ['aileen-wright']
editors: ['victor-zhou']
translators: ['fenwei-bian']
draft: false
format: explainer
ogImage: ../../assets/what-is-agent-payment-og.jpg
description: "智能体支付让 AI 智能体得以在受限且可撤销的授权范围内消费。深入了解 Stripe 面向智能体的 Link 钱包、Mercury 的智能体卡，以及 2025–2026 年这场行业竞速。"
keywords: ["什么是智能体支付", "智能体支付详解", "智能体商务", "Stripe Link 智能体钱包", "Stripe Issuing for agents", "Mercury 智能体卡", "Mercury 支出管理", "Agentic Commerce Protocol", "Google AP2 协议", "Mastercard Agent Pay", "Visa Intelligent Commerce", "AI 智能体一次性卡", "Shared Payment Token (SPT)", "AI 智能体支出限额", "x402 智能体支付"]
relatedArticles:
  - /zh-CN/blog/wallet-checkout/
  - /zh-CN/blog/agents-buy-domains/
  - /zh-CN/blog/state-of-agentic/
  - /zh-CN/blog/agent-native/
  - /zh-CN/blog/ai-agent-register/
relatedTopics:
  - /zh-CN/topics/web3-foundations/
  - /zh-CN/topics/domain-tokenization/
relatedSeries:
  - /zh-CN/series/blockchain-concepts/
  - /zh-CN/series/domain-apocalypse/
relatedGlossary:
  - /zh-CN/glossary/ai-agent/
  - /zh-CN/glossary/x402/
  - /zh-CN/glossary/stablecoin/
  - /zh-CN/glossary/wallet/
  - /zh-CN/glossary/tokenized-domain/
---

短短十六个月内，两大主要银行卡组织、Google、OpenAI 和 Stripe 都相继宣布或上线了同一件事的基础设施：让[AI 智能体](/zh-CN/glossary/ai-agent/)能够花钱。Mastercard 于 2025 年 4 月 29 日[宣布推出 Agent Pay](https://www.mastercard.com/global/en/news-and-trends/press/2025/april/mastercard-unveils-agent-pay-pioneering-agentic-payments-technology-to-power-commerce-in-the-age-of-ai.html#:~:text=The%20program%20introduces%20Mastercard%20Agentic%20Tokens)。Visa 在次日发布了 [Intelligent Commerce](https://usa.visa.com/about-visa/newsroom/press-releases.releaseId.21361.html#:~:text=browse%2C%20select%2C%20purchase%20and%20manage%20on%20their%20behalf)。Google 在 2025 年 9 月发布了[智能体支付协议（AP2）](https://cloud.google.com/blog/products/ai-machine-learning/announcing-agents-to-payments-ap2-protocol#:~:text=breaks%20this%20fundamental%20assumption)，拥有超过 60 家合作机构。同月，OpenAI 在 ChatGPT 中上线了[即时结账功能](https://openai.com/index/buy-it-in-chatgpt/#:~:text=powered%20by%20the%20Agentic%20Commerce%20Protocol%2C%20built%20with%20Stripe)。到 2026 年 4 月，Stripe 推出了 [Link 智能体钱包](https://stripe.com/blog/giving-agents-the-ability-to-pay#:~:text=The%20agent%20never%20gets%20access%20to%20your%20raw%20payment%20credentials)，这是一个消费者钱包，智能体可以逐次借用来完成单笔购买。就连商业银行平台 Mercury，如今也在其[支出管理产品宣传](https://mercury.com/spend-management#:~:text=cards%20for%20teams%20and%20agents)中打出了"面向团队和**智能体**的卡片"的口号。

本文将说明"智能体支付"究竟是什么，走一遍两个很有代表性的实现——Stripe 面向消费者的钱包与 Mercury 面向企业的智能体卡——然后再看看，为什么这么多公司几乎同时得出了同一个结论：这一局不能不参与。

## "智能体支付"究竟是什么

智能体支付是让软件智能体代表个人或企业花钱的基础设施——其授权是**受限的**（限定金额、限定商户、限定用途）、**可验证的**（商户能够确认智能体确实获得了授权）、**可撤销的**（所有者可以随时关闭），而不是把一串原始卡号直接交给智能体这种简单粗暴的方式。

最后这一句才是关键所在。从来没有什么能阻止你把 Visa 卡号直接粘贴进机器人的配置文件里。真正让大多数人却步的是：卡号本身是一种不受限的授权——谁拿到它，就能在任何地方、为任何用途扣款，直到你察觉并注销这张卡为止。Google 的 AP2 公告直白地指出了这一根本问题：如今的支付系统普遍["假定是真人亲自在受信任的界面上点击'购买'"](https://cloud.google.com/blog/products/ai-machine-learning/announcing-agents-to-payments-ap2-protocol#:~:text=assume%20a%20human%20is%20directly%20clicking)，而自主智能体发起付款这件事["打破了这一基本假设"](https://cloud.google.com/blog/products/ai-machine-learning/announcing-agents-to-payments-ap2-protocol#:~:text=breaks%20this%20fundamental%20assumption)。AP2 将这一缺口归结为每一笔智能体交易都必须回答的三个问题：**授权**（用户是否已授予智能体针对*这笔*购买的权限？）、**真实性**（智能体的请求是否反映了用户的真实意图？），以及**问责**（出了问题由谁承担损失？）。

这一领域中的每一款产品——银行卡组织的令牌计划、开放协议、钱包、智能体卡——本质上都是在尝试把这三个问题回答得足够好，好让"让智能体花钱"这件事变成一件平常到略显无聊的事。

## Stripe：一个智能体可以逐次借用的钱包

Stripe 的方案[已于 2026 年 4 月 29 日宣布](https://stripe.com/blog/giving-agents-the-ability-to-pay#:~:text=Today%20we%E2%80%99re%20launching)，即 **Link 智能体钱包**，构建在全新的 **Issuing for agents** 层之上。Link 是 Stripe 的消费者钱包产品——那种"保存我的信息以便更快结账"的产品——Stripe 表示其用户规模[超过 2 亿消费者](https://stripe.com/blog/giving-agents-the-ability-to-pay#:~:text=more%20than%20200%20million%20consumers)。智能体使用流程如下：

1. 消费者通过标准的 OAuth 流程，将自己 Link 钱包的访问权限授予智能体——这与连接任何第三方应用时使用的授权模式相同。
2. 当智能体想要购买某样东西时，它会创建一个**支出请求**，其中携带上下文信息：商户名称、网址、金额，以及一段人类可读的说明，解释购买的是什么、为什么购买。
3. 消费者在网页端或 Link 的移动应用中审核并批准该请求。目前，[每一笔请求在分享任何凭据之前都需要本人审核](https://stripe.com/blog/giving-agents-the-ability-to-pay#:~:text=each%20request%20requires%20the%20person%E2%80%99s%20review)；Stripe 表示，接下来计划推出支出限额和预先批准的自主权限。
4. 获批后，智能体会收到一张**一次性卡**，或一个 **Shared Payment Token (SPT)**——这是一种[可以通过金额、币种、商户等控制项加以限定](https://stripe.com/blog/giving-agents-the-ability-to-pay#:~:text=scoped%20with%20controls%20like%20amount%2C%20currency%2C%20and%20merchant)的凭据。用 Stripe 的话说：["智能体永远无法获取你的原始付款凭据。"](https://stripe.com/blog/giving-agents-the-ability-to-pay#:~:text=The%20agent%20never%20gets%20access%20to%20your%20raw%20payment%20credentials)

这套设计值得细读，因为它彻底颠覆了"已存卡"模式。已存卡是一种持续性授权，商户（或智能体）可以一次又一次地动用，其约束靠的是事后执行的协议条款，而不是凭据本身；而支出请求则是一次性的授权，在购买那一刻生成，只约束那一笔购买，用完即失效。Stripe 还开放了底层的能力——Issuing for agents——让企业可以搭建自己的智能体钱包：一次性虚拟卡、资金托管、卡级权限、交易监控，以及授权时刻的反欺诈控制。

## Mercury：企业卡遇上智能体

Stripe 的钱包回答的是消费者层面的问题——*我该如何让购物智能体用我的钱买东西？* Mercury 的[支出管理](https://mercury.com/spend-management#:~:text=cards%20for%20teams%20and%20agents)回答的则是企业版本的这个问题，而它给出的答案颇能说明问题：把智能体当员工对待。

Mercury 将该产品描述为["具备智能预算、员工报销以及面向团队和智能体的卡片的自我执行式费用管理"](https://mercury.com/spend-management#:~:text=cards%20for%20teams%20and%20agents)。其运作机制是熟悉的支出管理工具箱——[针对特定用途设定预算与护栏](https://mercury.com/spend-management#:~:text=Set%20up%20budgets%20and%20guardrails%20to%20unblock%20your%20team%20and%20agents)、分类限额、实时追踪、可自我执行的策略——如今被扩展到了非人类的消费者身上：企业可以[为已批准的交易签发专属的智能体卡](https://mercury.com/spend-management#:~:text=Issue%20dedicated%20agent%20cards%20for%20approved%20transactions)，每张卡各自设有限额。

该页面甚至给出了一段演示：一个智能体用"Jane 的智能体卡"填写结账表单，下了一笔 100 美元的广告订单，并回报说这张卡的月度支出限额为 1,000 美元，且卡片信息仅用于这一次结账——从未被存储。Mercury Spend [面向所有 Mercury 商业银行客户免费提供](https://mercury.com/spend-management#:~:text=included%20for%20all%20Mercury%20business%20banking%20customers)，并计划为在其他银行开户的团队推出独立版本。

比功能清单更重要的是这种框架本身。对企业而言，一个会花钱的智能体不是什么稀奇古怪的新支付问题——它就是编制。它拿到一张卡、一份预算、一个用途、一个月度限额，以及一份审计记录，与财务系统里的一名新员工别无二致。如果说 Stripe 为消费者搭建了一套同意闭环，那么 Mercury 则是为软件在组织架构图上开辟了一个岗位。

## 十六个月的密集发布

把这条时间线摆在一起看，这场"跑马圈地"就很难被忽视：

| 日期 | 公司 | 宣布内容 |
|---|---|---|
| 2025年4月29日 | Mastercard | [Agent Pay](https://www.mastercard.com/global/en/news-and-trends/press/2025/april/mastercard-unveils-agent-pay-pioneering-agentic-payments-technology-to-power-commerce-in-the-age-of-ai.html#:~:text=The%20program%20introduces%20Mastercard%20Agentic%20Tokens)：Agentic Tokens；智能体必须先[完成注册并通过验证](https://www.mastercard.com/global/en/news-and-trends/press/2025/april/mastercard-unveils-agent-pay-pioneering-agentic-payments-technology-to-power-commerce-in-the-age-of-ai.html#:~:text=trusted%20AI%20agents%20to%20be%20registered%20and%20verified)才能进行交易 |
| 2025年4月30日 | Visa | [Intelligent Commerce](https://usa.visa.com/about-visa/newsroom/press-releases.releaseId.21361.html#:~:text=trusted%20with%20payments%2C%20not%20only%20by%20users)：通过代币化凭据向 AI 智能体开放 Visa 网络 |
| 2025年9月16日 | Google | [智能体支付协议（AP2）](https://cloud.google.com/blog/products/ai-machine-learning/announcing-agents-to-payments-ap2-protocol#:~:text=breaks%20this%20fundamental%20assumption)：一项开放协议，拥有超过 60 家合作伙伴，从 Amex 到 Coinbase 再到 PayPal |
| 2025年9月29日 | OpenAI + Stripe | [ChatGPT 内的即时结账](https://openai.com/index/buy-it-in-chatgpt/#:~:text=powered%20by%20the%20Agentic%20Commerce%20Protocol%2C%20built%20with%20Stripe)，由已开源的 Agentic Commerce Protocol（ACP）提供支持 |
| 2026年1月15日 | Google | [通用商务协议（UCP）](/zh-CN/blog/google-unveils-universal-commerce-protocol-to-power-the-next-generation-of-ai-shopping-agents/)：一项旨在与 AP2 协同工作的开放商务互操作标准 |
| 2026年4月29日 | Stripe | [Link 智能体钱包 + Issuing for agents](https://stripe.com/blog/giving-agents-the-ability-to-pay#:~:text=Today%20we%E2%80%99re%20launching)：面向智能体支出的消费者钱包访问权限与发卡基础能力 |
| 2026 | Mercury | [带智能体卡的支出管理](https://mercury.com/spend-management#:~:text=Issue%20dedicated%20agent%20cards%20for%20approved%20transactions)：预算、护栏，以及专属的智能体卡 |

为什么会出现这样的抢滩登陆？背后有三股力量在起作用——这一部分是我们的解读，而非这些公告本身明说的内容：

**买家的阵地在转移，钱包也想跟着一起转移。** OpenAI 指出，[每周有超过 7 亿人使用 ChatGPT](https://openai.com/index/buy-it-in-chatgpt/#:~:text=More%20than%20700%20million%20people%20turn%20to%20ChatGPT%20each%20week)，如今它已能在对话内完成购买。如果发现和结账都发生在与智能体的对话之中，那么无论谁为这个智能体提供钱包，谁就站在了每一位商户和每一位顾客之间。Stripe 对开发者的宣传直白地点明了这块蛋糕的诱惑——基于 Link 构建，即可[触达其 2 亿消费者用户群](https://stripe.com/blog/giving-agents-the-ability-to-pay#:~:text=more%20than%20200%20million%20consumers)。支付公司眼睁睁看着搜索和社交两大领域主导商业中介地位长达二十年；这一次，没有一家愿意袖手旁观，看着智能体重演这一幕。

**不受限的凭据经不起自动化的考验。** 如果没有专门设计的支付轨道，人们就会把已存卡和共享登录凭据直接交给智能体——这是一种没有边界的持续性授权，恰恰正是反欺诈系统存在的目的所在，要抓的就是这种模式。Visa 的产品负责人将这一需求描述为一种超越用户范畴的信任：智能体["不仅需要获得用户的信任，也需要获得银行和商户的信任，才能被托付以支付"](https://usa.visa.com/about-visa/newsroom/press-releases.releaseId.21361.html#:~:text=trusted%20with%20payments%2C%20not%20only%20by%20users)。能够分辨出"已获授权的智能体"和"测卡欺诈机器人"的网络，就能放行更多正常交易、拦截更多恶意交易；做不到这一点的网络，两件事都会做得很糟。

**协议之争，本质上是一场跑马圈地。** ACP、AP2、Mastercard 的 Agentic Tokens，以及 Visa 的代币化凭据，都想成为机器购买行为的默认"语法"。开放标准往往凭借易于采用而赢得这类竞赛——这正是 OpenAI [开源 ACP](https://openai.com/index/buy-it-in-chatgpt/#:~:text=Agentic%20Commerce%20Protocol%2C%20so%20that%20more%20merchants%20and%20developers%20can%20begin%20building)、Google 为 AP2 招募 60 多家发布合作伙伴，随后又在 2026 年 1 月推出[通用商务协议](/zh-CN/blog/google-unveils-universal-commerce-protocol-to-power-the-next-generation-of-ai-shopping-agents/)、围绕支付环节将购物流程标准化的原因所在。没有人想把已经输掉的标准再集成一遍。

## 一套设计模式，多个品牌

剥去品牌包装，每一款认真做智能体支付的产品，最终都会收敛到同样的四项特性：

1. **永不暴露原始凭据。** 一次性卡（Stripe）、Shared Payment Token（Stripe/ACP）、Agentic Tokens（Mastercard）、代币化凭据（Visa）。智能体携带的是一种专门设计的支付工具，而不是你的 PAN。
2. **限定授权范围。** 在凭据本身上就设定金额、币种、商户和时间边界——OpenAI 的版本是这样的：[加密支付令牌"仅针对特定金额和特定商户获得授权"](https://openai.com/index/buy-it-in-chatgpt/#:~:text=encrypted%20payment%20tokens%20are%20only%20authorized%20for%20specific%20amounts%20and%20specific%20merchants)。
3. **把人保留在审批环节里——至少目前如此。** Stripe 目前要求逐笔请求审核；Mercury 的预算机制则是由人预先设定限额，在限额内的支出被提前授权。自主程度这根刻度会逐步调整，但起点几乎为零。
4. **让智能体的支出清晰可辨。** 注册在案的智能体（Mastercard）、支出请求中的上下文字符串（Stripe）、实时追踪以及"要么提交凭证、要么卡被锁定"式的强制执行（Mercury）。每一笔交易都应该能回答"是哪个智能体、经谁授权、为了什么"这三个问题。

如果这些特性让熟悉加密货币的读者感到眼熟，那是因为它们本来就该眼熟。在 [x402](/zh-CN/glossary/x402/) 的精确支付方案下，一笔经签名授权的[稳定币](/zh-CN/glossary/stablecoin/)转账——精确金额、精确收款方、仅在某个时间窗口内有效、由付款方自己的[钱包](/zh-CN/glossary/wallet/)在购买那一刻签署——正是从另一个方向抵达的同一种设计，只不过这里的限定是由密码学而非发卡机构的策略引擎来强制执行的。Stripe 自己也已把稳定币列为智能体钱包即将支持的付款方式之一。卡组织的世界和加密货币的世界，正在收敛到同一个答案上：*授权按交易发放，而不是把授权长期挂在账户上。*

## 域名在其中的位置

域名正在成为智能体最早独立购买的东西之一——它们是纯粹的 API 对象，不需要收货地址，而每一个已部署的智能体产品迟早都需要一个自己能控制的名字。我们已经写过[AI 智能体如何无需人工购买域名（2026）](/zh-CN/blog/agents-buy-domains/)、[什么是智能体原生域名注册商？](/zh-CN/blog/agent-native/)，以及[如何在 Namefi 上通过 AI 智能体注册域名](/zh-CN/blog/ai-agent-register/)的具体步骤。

Namefi 自己对支付问题的答案，是[使用加密钱包支付域名：无需账户](/zh-CN/blog/wallet-checkout/)一文深入介绍的钱包签名结账：智能体的钱包通过为一次精确的注册、一个精确的价格签署 USDC 转账授权来应答 x402 质询——全程无需账户，也不会在任何地方存储凭据——注册完成后，该域名会作为[代币化资产](/zh-CN/glossary/tokenized-domain/)交付到同一个钱包。这正是本文一直在描述的那种意义上的智能体支付，如今已在一款真实产品上落地运行，用来支付智能体最可预见需要购买的东西。

归根结底，这场提供智能体支付能力的竞速，其实是一场争夺"被信任"的竞速。超过两亿 Link 消费者、每周超过七亿的 ChatGPT 用户，以及每一套企业卡计划，都在押注同一件事：下一个十亿买家，未必都是真人；而那些能为其软件提供安全、受限、可问责支出授权的基础设施，也终将像银行卡网络之于上一个商业时代那样，成为不可或缺的基石。

## 来源与延伸阅读

- Stripe — [让智能体拥有付款能力](https://stripe.com/blog/giving-agents-the-ability-to-pay)（Link 智能体钱包 + Issuing for agents，2026年4月29日）
- Mercury — [支出管理](https://mercury.com/spend-management)（预算、护栏，以及专属的智能体卡）
- Google Cloud — [发布智能体支付协议（AP2）](https://cloud.google.com/blog/products/ai-machine-learning/announcing-agents-to-payments-ap2-protocol)（2025年9月16日）
- OpenAI — [在 ChatGPT 中购物：即时结账与 Agentic Commerce Protocol](https://openai.com/index/buy-it-in-chatgpt/)（2025年9月29日）
- Mastercard — [Mastercard 发布 Agent Pay](https://www.mastercard.com/global/en/news-and-trends/press/2025/april/mastercard-unveils-agent-pay-pioneering-agentic-payments-technology-to-power-commerce-in-the-age-of-ai.html)（2025年4月29日）
- Visa — [用 AI 查找与购买：Visa 揭晓商业新纪元](https://usa.visa.com/about-visa/newsroom/press-releases.releaseId.21361.html)（Visa Intelligent Commerce，2025年4月30日）
- Namefi — [使用加密钱包支付域名：无需账户](/zh-CN/blog/wallet-checkout/)（x402 钱包签名结账）
