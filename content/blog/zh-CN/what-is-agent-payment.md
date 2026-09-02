---
title: "什么是智能体支付？为什么所有人都在抢着提供它"
date: '2026-08-13'
language: 'zh-CN'
tags: ['ai-agents', 'payments', 'explainer']
authors: ['aileen-wright']
editors: ['victor-zhou']
translators: ['fenwei-bian']
draft: false
format: explainer
ogImage: ../../assets/what-is-agent-payment-og.jpg
description: "不到十六个月里，两大银行卡组织、Google、OpenAI 与 Stripe 相继为 AI 智能体开放付款能力。智能体支付到底解决了什么问题，为什么每一家都想成为那个被信任的钱包？"
keywords: ["智能体支付", "AI 智能体如何付款", "Stripe Link 智能体钱包", "Mercury 智能体卡", "Mastercard Agent Pay", "Visa Intelligent Commerce", "Google AP2 协议", "Agentic Commerce Protocol", "x402 支付协议", "范围化支付授权", "稳定币支付智能体", "智能体支付基础设施", "AI 智能体购买域名", "Namefi 钱包结账"]
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

不到十六个月里，两大银行卡组织、Google、OpenAI 和 Stripe 先后交出了同一份答卷：让 [AI 智能体](/zh-CN/glossary/ai-agent/)也能替人花钱。这不是巧合，而是一场几乎同时打响的基础设施竞赛。它的名字叫“智能体支付”——本文要说清楚它到底是什么、为什么几乎所有支付巨头都在同一时间段挤进这个赛道，以及这场竞赛最终比拼的是什么。

## 智能体支付解决的到底是什么问题

把一串 Visa 卡号写进机器人的配置文件，技术上从来没有障碍。真正拦住大多数人的，是卡号本身携带的授权毫无边界：谁拿到它，就能在任何商户、任何金额上刷卡，直到有人发现异常并挂失为止。智能体支付要解决的正是这种“无范围授权”——它是一整套基础设施，让软件智能体能够代表人或企业花钱，但这份授权必须同时具备三个特征：**可限定范围**（多少钱、哪个商户、为了什么目的）、**可验证**（商户能够确认这笔授权确实存在）、**可撤销**（授权人随时能够关闭它）。这与直接把一张裸卡号交给智能体，是两种完全不同的信任模型。

Google 在介绍其 [Agent Payments Protocol（AP2）](https://cloud.google.com/blog/products/ai-machine-learning/announcing-agents-to-payments-ap2-protocol#:~:text=assume%20a%20human%20is%20directly%20clicking)时把问题讲得很直白：今天几乎所有支付系统，都默认是一个真人亲自在可信界面上点下“购买”按钮；一旦变成自主智能体发起付款，这个基本假设本身就[不再成立](https://cloud.google.com/blog/products/ai-machine-learning/announcing-agents-to-payments-ap2-protocol#:~:text=breaks%20this%20fundamental%20assumption)。AP2 把这个缺口拆成三个每一笔智能体交易都必须回答的问题：**授权**（用户是否真的为这一笔具体购买授予了智能体权限）、**真实性**（智能体发出的请求是否忠实反映了用户的真实意图）、**责任归属**（一旦出错，损失该由谁承担）。无论是银行卡组织的代币化方案、开放协议，还是各类钱包和智能体专用卡，本质上都是想把这三个问题回答得足够好，好到“让智能体花钱”变成一件平常又无聊的事。

## 案例一：Stripe 把 Link 钱包开放给智能体

2026 年 4 月 29 日，Stripe [正式推出](https://stripe.com/blog/giving-agents-the-ability-to-pay#:~:text=Today%20we%E2%80%99re%20launching)面向智能体的 Link 钱包，底层依托一套新的“面向智能体的发卡”（Issuing for agents）能力。Link 是 Stripe 的消费者钱包产品，用于“保存我的信息以便快捷结账”，Stripe 表示其[消费者规模超过 2 亿](https://stripe.com/blog/giving-agents-the-ability-to-pay#:~:text=more%20than%20200%20million%20consumers)。整个智能体使用流程分四步：

1. 消费者通过标准 OAuth 流程——和授权任何第三方应用相同的同意机制——把自己的 Link 钱包访问权授予智能体。
2. 智能体发起一笔“支出请求”（spend request），其中携带上下文：商户名称、网址、金额，以及一段人类可读的用途说明。
3. 消费者在网页端或 Link 移动应用上审核并批准。目前[每一笔请求都需要本人审核通过](https://stripe.com/blog/giving-agents-the-ability-to-pay#:~:text=each%20request%20requires%20the%20person%E2%80%99s%20review)才会放行任何凭据；Stripe 表示接下来计划支持支出限额和预先授权的自主额度。
4. 获批后，智能体拿到的不是原始卡号，而是一张一次性虚拟卡，或者一枚 [Shared Payment Token（SPT）](https://stripe.com/blog/giving-agents-the-ability-to-pay#:~:text=scoped%20with%20controls%20like%20amount%2C%20currency%2C%20and%20merchant)——带有金额、货币、商户等控制条件的范围化凭据。Stripe 的表述是：[“智能体永远拿不到你的原始支付凭据”](https://stripe.com/blog/giving-agents-the-ability-to-pay#:~:text=The%20agent%20never%20gets%20access%20to%20your%20raw%20payment%20credentials)。

这套设计把“已存卡”模式彻底反过来了：已存卡是一份标准授权，事后靠协议条款约束、可以被反复使用；支出请求则是购买那一刻现场生成的一次性授权，只对那一笔交易有效，用完即失效。Stripe 同时把底层的“面向智能体的发卡”能力开放给企业客户，让它们能自建自己的智能体钱包：一次性虚拟卡、资金托管、卡级别权限、交易监控，以及授权时刻的反欺诈控制。

## 案例二：Mercury 把智能体当新员工发一张卡

如果说 Stripe 回答的是消费者场景，Mercury 的支出管理（Spend Management）回答的则是企业版的同一个问题——它把智能体当作员工来对待。Mercury 自己的表述是：这是一套“具备智能预算的自我执行费用管理系统，涵盖员工报销，也包括[面向团队和智能体的卡片](https://mercury.com/spend-management#:~:text=cards%20for%20teams%20and%20agents)”。

具体机制是：[设置预算与护栏，为团队和智能体解除阻塞](https://mercury.com/spend-management#:~:text=Set%20up%20budgets%20and%20guardrails%20to%20unblock%20your%20team%20and%20agents)，按类别设置额度上限，实时追踪支出，策略自我执行——而这一整套此前只用于人类员工的机制，如今被扩展到非人类的支出方身上。企业可以为已批准的场景[签发专属的智能体卡](https://mercury.com/spend-management#:~:text=Issue%20dedicated%20agent%20cards%20for%20approved%20transactions)，每张卡都有各自独立的额度。Mercury 官网的演示场景是：一个智能体在结账表单中填入“Jane 的智能体卡”信息，下单一笔 100 美元的广告采购，并回报这张卡的月度支出上限是 1000 美元，且卡片信息只在那一次结账中被使用，从未被存储。这套支出管理[面向所有 Mercury 商业银行客户开放](https://mercury.com/spend-management#:~:text=included%20for%20all%20Mercury%20business%20banking%20customers)，一个面向在其他银行开户团队的独立版本也已在计划之中。

换个角度看：对企业而言，一个会花钱的智能体根本不是什么特殊的支付难题，而是一次“新增编制”——它需要一张卡、一份预算、一个明确用途、一条月度限额，还有一条审计轨迹，和任何一名新员工进入财务系统的流程别无二致。Stripe 为消费者搭建了一套同意闭环，Mercury 则为软件在组织架构图上开出了一个岗位。

## 一条十六个月的时间线

把各家的动作按时间排开，能看出这场竞赛几乎是同步打响的：

| 时间 | 公司 | 宣布内容 |
|---|---|---|
| 2025 年 4 月 29 日 | Mastercard | 推出 Agent Pay：[引入 Mastercard Agentic Tokens](https://www.mastercard.com/global/en/news-and-trends/press/2025/april/mastercard-unveils-agent-pay-pioneering-agentic-payments-technology-to-power-commerce-in-the-age-of-ai.html#:~:text=The%20program%20introduces%20Mastercard%20Agentic%20Tokens)，要求智能体先[完成注册与验证](https://www.mastercard.com/global/en/news-and-trends/press/2025/april/mastercard-unveils-agent-pay-pioneering-agentic-payments-technology-to-power-commerce-in-the-age-of-ai.html#:~:text=trusted%20AI%20agents%20to%20be%20registered%20and%20verified)才能发起交易 |
| 2025 年 4 月 30 日 | Visa | 推出 Intelligent Commerce：通过代币化凭据，向 AI 智能体开放 Visa 网络，让其可以[代为浏览、挑选、购买和管理](https://usa.visa.com/about-visa/newsroom/press-releases.releaseId.21361.html#:~:text=browse%2C%20select%2C%20purchase%20and%20manage%20on%20their%20behalf) |
| 2025 年 9 月 16 日 | Google | 发布 [Agent Payments Protocol（AP2）](https://cloud.google.com/blog/products/ai-machine-learning/announcing-agents-to-payments-ap2-protocol#:~:text=assume%20a%20human%20is%20directly%20clicking)：一套开放协议，上线时已有超过 60 家合作伙伴，从美国运通、Coinbase 到 PayPal 均在其中 |
| 2025 年 9 月 29 日 | OpenAI + Stripe | 在 ChatGPT 中上线“即时结账”（Instant Checkout），底层由已开源的 [Agentic Commerce Protocol（ACP）](https://openai.com/index/buy-it-in-chatgpt/#:~:text=powered%20by%20the%20Agentic%20Commerce%20Protocol%2C%20built%20with%20Stripe)提供支持 |
| 2026 年 1 月 15 日 | Google | 发布 [Universal Commerce Protocol（UCP）](/zh-CN/blog/google-unveils-universal-commerce-protocol-to-power-the-next-generation-of-ai-shopping-agents/)：一套开放的商务互通标准，设计为与 AP2 协同工作 |
| 2026 年 4 月 29 日 | Stripe | 推出 Link 智能体钱包与“面向智能体的发卡”：向智能体开放消费者钱包访问权，并提供发卡底层能力 |
| 2026 年 | Mercury | 推出带智能体卡的支出管理：预算、护栏，以及面向智能体的专属卡片 |

## 为什么大家几乎同时挤进这条赛道

以下三点是对这场“抢滩”的解读，而非哪一家公司自己给出的官方理由。

**第一，买家的注意力正在迁移，钱包想跟着一起搬家。** OpenAI 表示每周有[超过 7 亿人](https://openai.com/index/buy-it-in-chatgpt/#:~:text=More%20than%20700%20million%20people%20turn%20to%20ChatGPT%20each%20week)使用 ChatGPT，而它现在已经能在对话内直接完成购买。一旦发现和结账都发生在与智能体的对话之中，谁能为这个智能体提供钱包，谁就卡在了每一个商户和每一个顾客之间。Stripe 对开发者的说辞很直接：接入 Link，就能触达它 2 亿消费者的基础盘。过去二十年，支付公司眼睁睁看着搜索和社交平台一点点接管了商业的中间环节；这一次，没有谁打算继续站在场边看智能体重演一遍。

**第二，无范围的凭据经不起自动化的考验。** 没有专门为此设计的通道，人们就只能把已存卡或共享登录信息直接交给智能体——这正是一种毫无边界的标准授权，恰恰是反欺诈系统天生要抓的那种模式。正如 Visa 一位未具名的产品负责人所说，智能体“[不仅要被用户信任，也需要被银行和商户信任](https://usa.visa.com/about-visa/newsroom/press-releases.releaseId.21361.html#:~:text=trusted%20with%20payments%2C%20not%20only%20by%20users)，才能被交付支付能力”。能够分辨出“经过授权的智能体”和“在做卡号撞库测试的机器人”的网络，会放行更多真实交易、拦下更多欺诈交易；分辨不出来的网络，两件事都做不好。

**第三，协议本身就是一场跑马圈地。** ACP、AP2、Mastercard 的 Agentic Tokens、Visa 的代币化凭据，都想成为机器购买行为的默认语法。开放标准往往靠“易于被接入”取胜——这正是 OpenAI 选择[开源 ACP、让更多商户和开发者能够着手接入](https://openai.com/index/buy-it-in-chatgpt/#:~:text=Agentic%20Commerce%20Protocol%2C%20so%20that%20more%20merchants%20and%20developers%20can%20begin%20building)的原因，也是 Google 在 AP2 上线时就拉来 60 多家合作伙伴、又在 2026 年 1 月追加发布 UCP 来标准化购物流程周边环节的原因。没有谁愿意把同一套集成工作，为两套竞争标准各做一遍。

## 殊途同归：四个特征收敛成同一套设计

把 Stripe 的消费者钱包和 Mercury 的企业智能体卡拆开来看，二者是从完全不同的方向出发的——一个从个人授权同意入手，一个从企业预算管控入手——但最终都收敛到了同一套设计模式上：

1. **原始凭据永不出现。** 一次性虚拟卡（Stripe）、Shared Payment Token（Stripe / ACP）、Agentic Tokens（Mastercard）、代币化凭据（Visa），智能体拿到手的始终是一件专门打造的支付工具，而不是那串真实卡号（PAN）本身。
2. **授权本身被限定范围。** 金额、货币、商户、有效期限都直接绑定在凭据上。OpenAI 的说法是，加密后的支付令牌“[只对特定金额和特定商户生效](https://openai.com/index/buy-it-in-chatgpt/#:~:text=encrypted%20payment%20tokens%20are%20only%20authorized%20for%20specific%20amounts%20and%20specific%20merchants)”。
3. **人至少目前仍留在审批环节里。** Stripe 目前要求逐笔人工审核；Mercury 的预算机制则是在人为设定的额度内预先放行支出。自主程度这根旋钮会慢慢往前拨，但起点几乎都在零附近。
4. **让智能体的每一笔支出都清晰可读。** 已注册验证的智能体身份（Mastercard）、附带上下文说明的支出请求（Stripe）、实时追踪加上“没有回执就锁卡”的执行机制（Mercury）——每一笔交易最终都要能回答同一个问题：哪个智能体、凭谁的授权、为了什么。

## 加密世界早就到过同一个地方：与 x402 的呼应

对熟悉加密行业的读者来说，上面这四条听起来会格外眼熟，因为它们其实早已被验证过一遍。在 [x402](/zh-CN/glossary/x402/) 的精确付款方案里，一笔由签名授权的[稳定币](/zh-CN/glossary/stablecoin/)转账——精确的金额、精确的收款方、只在一个时间窗口内有效、由付款人自己的[钱包](/zh-CN/glossary/wallet/)在购买那一刻当场签名——正是同一套设计从另一个方向抵达的结果，只不过范围限定的执行者从发卡机构的策略引擎换成了密码学本身。Stripe 也把稳定币列为智能体钱包即将支持的付款方式之一。银行卡世界和加密世界正在收敛到同一个答案上：授权只对应单笔交易本身，而不是长期挂在账户上的一份标准授权。

## 域名：智能体最先学会自己买的东西之一

域名恰好是智能体最早独立完成购买的一类商品——它是纯粹的 API 对象，不需要收货地址，而每一个被部署出来的智能体产品，迟早都需要一个自己能掌控的名字。这也是为什么智能体支付的讨论，绕不开域名注册这个具体场景：[AI 智能体如何无需人工购买域名（2026）](/zh-CN/blog/agents-buy-domains/)说明了这类购买今天已经在如何发生；[什么是智能体原生域名注册商？](/zh-CN/blog/agent-native/)给出了评估一家注册商是否真正为智能体设计的标准；[如何在 Namefi 上通过 AI 智能体注册域名](/zh-CN/blog/ai-agent-register/)则是一份逐步操作指南。

Namefi 自己给出的答案，是[钱包签名结账](/zh-CN/blog/wallet-checkout/)：智能体的钱包用一次签名回应 x402 的支付质询，为一次具体的注册、一个具体的价格授权一笔 USDC 转账——不需要账户，也不存在任何可被留存或滥用的凭据——注册完成后，域名作为[代币化域名](/zh-CN/glossary/tokenized-domain/)直接进入同一个钱包。这正是本文所描述的“智能体支付”在现实中的样子：今天已经在真实运行，而且用在了智能体最先、最稳定需要购买的东西上。

## 结语：这场竞赛，赌的是信任

超过 2 亿的 Link 消费者、每周超过 7 亿的 ChatGPT 活跃用户，再加上几乎每一套企业卡体系，全都在押注同一件事：下一个十亿级别的买家，不会全部是人类。而能够让软件安全、有范围、可追责地花钱的基础设施，终将像银行卡网络之于上一个商业时代那样，成为下一个时代不可或缺的底座。这也正是为什么几乎所有支付巨头都不愿意在场边多等一天——这场关于“谁的钱包”的竞赛，归根结底比拼的是谁能率先被信任。

## 来源与延伸阅读

- Stripe——[Giving agents the ability to pay](https://stripe.com/blog/giving-agents-the-ability-to-pay)（Link 智能体钱包与“面向智能体的发卡”，2026 年 4 月 29 日）
- Mercury——[Spend Management](https://mercury.com/spend-management)（预算、护栏与专属智能体卡）
- Google Cloud——[Announcing the Agent Payments Protocol（AP2）](https://cloud.google.com/blog/products/ai-machine-learning/announcing-agents-to-payments-ap2-protocol)（2025 年 9 月 16 日）
- OpenAI——[Buy it in ChatGPT: Instant Checkout and the Agentic Commerce Protocol](https://openai.com/index/buy-it-in-chatgpt/)（2025 年 9 月 29 日）
- Mastercard——[Mastercard unveils Agent Pay](https://www.mastercard.com/global/en/news-and-trends/press/2025/april/mastercard-unveils-agent-pay-pioneering-agentic-payments-technology-to-power-commerce-in-the-age-of-ai.html)（2025 年 4 月 29 日）
- Visa——[Find and Buy with AI: Visa Unveils New Era of Commerce](https://usa.visa.com/about-visa/newsroom/press-releases.releaseId.21361.html)（Visa Intelligent Commerce，2025 年 4 月 30 日）
- Namefi——[使用加密钱包支付域名：无需账户](/zh-CN/blog/wallet-checkout/)（基于 x402 的钱包签名结账）
