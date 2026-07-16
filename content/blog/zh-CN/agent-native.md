---
title: "什么是智能体原生域名注册商？"
date: '2026-07-10'
language: 'zh-CN'
tags: ['ai-agents', 'domains', 'explainer']
authors: ['aileen-wright']
editors: ['victor-zhou']
translators: ['fenwei-bian']
draft: false
format: explainer
ogImage: ../../assets/agent-native-og.jpg
description: "注册商早已有 API，但仅有 API 并不等于智能体原生。评估清单包括可发现性、文档、错误、支付和策略钩子。"
keywords: ["智能体原生注册商", "智能体原生定义", "什么是智能体原生注册商", "面向智能体的 API", "MCP 服务器", "llms.txt", "机器可读错误", "幂等性", "智能体支付", "AI 智能体注册域名", "自然语言 API 文档", "AI 智能体策略钩子", "API 密钥计费", "钱包结账加密域名"]
relatedArticles:
  - /zh-CN/blog/ai-domain-platforms/
  - /zh-CN/blog/cf-namecom-namefi/
  - /zh-CN/blog/ai-agent-register/
  - /zh-CN/blog/claude-mcp-domains/
  - /zh-CN/blog/airo-vs-namefi/
relatedTopics:
  - /zh-CN/topics/web3-foundations/
  - /zh-CN/topics/domain-basics/
relatedSeries:
  - /zh-CN/series/blockchain-concepts/
  - /zh-CN/series/tokenize-your-com/
relatedGlossary:
  - /zh-CN/glossary/ai-agent/
  - /zh-CN/glossary/registrar/
  - /zh-CN/glossary/icann/
  - /zh-CN/glossary/epp/
  - /zh-CN/glossary/x402/
---

域名注册商早已有应用程序接口（API）。注册商与注册局之间用于通信的机器对机器语言——[可扩展配置协议](https://en.wikipedia.org/wiki/Extensible_Provisioning_Protocol)（EPP）——早在 [2004 年 3 月就达到 Proposed Standard（建议标准）状态](https://en.wikipedia.org/wiki/Extensible_Provisioning_Protocol#:~:text=Proposed%20Standard%20documents%20%28RFCs%203730%20-%203734%29%20were%20published%20by%20the%20RFC%20Editor%20in%20March%202004)，距今已二十多年。此后，所有建立在它之上的、经 [ICANN](/zh-CN/glossary/icann/) 认证的[注册商](/zh-CN/glossary/registrar/)，都拥有某种 REST 或 SOAP API，用来查询可用性、提交注册和更新记录。因此，对于市场上几乎每一家注册商而言，面对“这家注册商有 API 吗？”这个问题，诚实的回答都是：有，而且多年前就有了。

但事实证明，这问错了问题。试图代表你注册域名的 [AI 智能体](/zh-CN/glossary/ai-agent/) 并不会因为注册商缺少 API 而失败；它失败的原因是，API 是为这样的开发者打造的：他们读一次文档，手写集成代码，然后发布——而不是为一个必须在运行时发现 API、从 JSON 响应中判断发生了什么，并在无人盯着结账页面的情况下完成购买的系统打造的。这是两套不同的要求；满足后者，才是本文所说的**智能体原生**。

本文会精确定义这一术语，列出一份用来评估任何注册商（或任何 API）的清单，然后把这份清单诚实地应用于 2026 年正在推出的各个平台，包括 [Namefi](https://namefi.io)。如果你想看的是逐个平台的比较而不是定义，请参阅[Cloudflare、Name.com 与 Namefi：智能体原生注册商](/zh-CN/blog/cf-namecom-namefi/)，或更广泛的 [AI 智能体域名平台指南](/zh-CN/blog/ai-domain-platforms/)。如果你仍把“AI 与域名”理解为一个推荐可品牌化字符串的名称生成器，下面的清单会说明智能体原生的门槛高得多；[超越 AI 域名生成器：智能体时代](/zh-CN/blog/beyond-generators/)会完整讲解两者的差距。

## 为什么“有 API”与“智能体原生”不是同一种主张

传统注册商 API 假定人类在设计阶段参与，而不是在运行时参与。开发者注册账户，阅读为人编写的参考页面，复制代码示例，然后把端点、认证标头和预期响应结构硬编码进应用程序。完成后，集成可以在无人值守的情况下运行——但这只是因为人已经完成了解读工作。API 本身没有任何东西能让一个初来乍到、没有既有集成、必须当场弄清有哪些操作以及如何调用它们的系统读懂。

智能体却会不断以这种“冷启动”状态出现。每一次与编程智能体的对话、每一个新的 MCP 客户端，实际上都相当于一位从未见过你 API 的开发者，只有几秒钟的上下文预算来弄明白它。如果“智能体如何学会使用这个 API”的答案是“人类多年前读过文档并写了胶水代码”，那么即使购买时没有任何人点击，API 的执行路径中仍永久卡着一个人。本文讨论的是：要让这种冷启动智能体成功，注册商本身必须具备哪些条件；若想从买方视角了解同一交接过程，请参阅[AI 智能体如何在没有人类参与的情况下购买域名（2026）](/zh-CN/blog/agents-buy-domains/)。

## 智能体原生清单

智能体原生注册商，是指 AI 智能体无需浏览器、无需人类预先阅读文档、无需任何人输入卡号，就能完全自行发现、理解并完成交易的注册商。这要求六项具体条件成立，而不只是“拥有 API”：

| 要求 | 有 API 的注册商 | 智能体原生注册商 |
| --- | --- | --- |
| 可发现性 | 端点存在，但必须通过带外方式告知智能体基础 URL 和认证方案 | 有标准位置（`llms.txt`、[MCP](https://modelcontextprotocol.io) 服务器），智能体可自行找到并读取 |
| 自然语言文档 | 参考文档是为浏览页面的人类编写的 | 文档的结构可供智能体在推理时读取——操作、必填字段和效果都集中在一处 |
| 机器可读错误 | HTTP 状态码加上供人阅读日志时理解的文字 | 稳定的错误代码、`retryable` 标志，以及智能体可在程序中据此分支处理的结构化细节 |
| 无需浏览器的购买 | 注册在托管的结账页面完成，有时还会受到 CAPTCHA 的限制 | 注册从头到尾通过 API 或协议本身完成，无需渲染页面 |
| 程序化支付 | 支付假定一张绑定人类账单账户的已保存银行卡 | 通过向账户计费的 API 密钥，或钱包签名的交易付款——也就是非人类可以持有的凭据 |
| 策略钩子 | 没有任何机制阻止脚本在凭据允许的范围内任意操作 | 人类只需设置一次的支出限额、确认步骤或范围受限的密钥，让智能体在边界内操作 |

可以提炼出的定义是：**智能体原生注册商在可发现性、自然语言文档、机器可读错误、无需浏览器完成购买和程序化支付这几项上都能得分为“是”；至于策略钩子，则仍是整个类别正在摸索的一环。**

## 可发现性：`llms.txt` 与 MCP 是智能体的站点地图

人类开发者会通过搜索或在文档网站上点击来找到 API。智能体则需要一种能一次性获取并阅读的文件，或一个可以查询可用操作的协议连接。如今有两种东西承担这一角色。

[llms.txt](https://llmstxt.org) 按该提案自己的说法，是[“一项建议，即采用 `/llms.txt` 文件来提供信息，帮助 LLM 在推理时使用网站”](https://llmstxt.org/#:~:text=A%20proposal%20to%20standardise%20on%20using%20an%20/llms.txt%20file%20to%20provide%20information%20to%20help%20LLMs%20use%20a%20website%20at%20inference%20time)。它与 `robots.txt` 的理念相同，但不是告诉爬虫可以索引什么，而是告诉语言模型一个网站是什么、如何使用。要了解注册商发布此类文件时它的样子，请参阅[面向域名的 llms.txt：任何 AI 智能体都能读取的 API](/zh-CN/blog/llms-txt/)。

[MCP（Model Context Protocol）](https://modelcontextprotocol.io) 解决的是相邻的问题：它是[“用于将 AI 应用程序连接到外部系统的开源标准”](https://modelcontextprotocol.io/#:~:text=MCP%20%28Model%20Context%20Protocol%29%20is%20an%20open-source%20standard%20for%20connecting%20AI%20applications%20to%20external%20systems)。`llms.txt` 是智能体读取一次、用来定位方向的文档；MCP 则是智能体客户端连接到服务器、获取一组已定义可调用工具的实时连接。二者是互补关系，而不是竞争关系：`llms.txt` 用于让智能体发现某个注册商的存在及其大致功能；MCP 用于让智能体的客户端真正连接并调用操作。

Namefi 同时发布了这两者。[namefi.io/llms.txt](https://namefi.io/llms.txt) 的入口文档说明了 MCP 服务器 `api.namefi.io/mcp`、MCP 发现文件 `namefi.io/.well-known/mcp/servers.json` 和完整的 REST 参考资料，另有关于基于钱包的支付和出站智能体工作流的配套文件。直接核查两家既有服务商：Cloudflare 的注册商文档在 `developers.cloudflare.com/registrar/llms.txt` 发布了自己的 `llms.txt`，但其公开文档没有表明 Cloudflare 为注册商产品运行专用 MCP 服务器——按报道，beta 版的表述是，[该 API“旨在用于开发者已经在使用的工具中：支持 MCP 的代码编辑器，如 Cursor 和 Claude Code”](https://webhosting.today/2026/04/22/ai-agents-can-now-register-domains-no-human-required/#:~:text=The%20API%20is%20designed%20to%20work%20inside%20the%20tools%20where%20developers%20already%20operate%2C%20code%20editors%20with%20MCP%20support%20such%20as%20Cursor%20and%20Claude%20Code)，其范围更窄——编辑器支持 MCP，并不必然表示 Cloudflare 的注册商产品本身支持。直接核查 GoDaddy 的开发者门户后发现，截至本文撰写时，它为人类开发者记录了 REST 端点，但没有显示 `llms.txt` 或 MCP 服务器的引用。

## 支付：为什么保存的银行卡会让智能体失灵，以及什么取代了它

购买这一步最难去除“人在回路中”的假设，因为面向消费者的网页支付栈是围绕人构建的：一张已保存的银行卡、一个账单地址，有时还会有 CAPTCHA，其设计就是筛掉任何不是人的事物。智能体无法填写银行卡表单；即使技术上可行，把人类的原始卡号交给智能体、让它冒充人类，也是糟糕的安全模型。

目前有两种替代方案正在推出。第一种是 API 密钥计费：注册商发放一个与预充值或账期账户关联的凭据，智能体用该密钥认证每一次调用，而不是使用银行卡。Namefi 的文档说明了如何在 [namefi.io/api-key](https://namefi.io/api-key) 生成该密钥，并将其作为 `x-api-key` 标头随每个请求发送——无需浏览器会话，也无需银行卡表单。Cloudflare 的 `.ai` 定价遵循同样的按成本计价逻辑：[它“以批发价提供 `.ai` 域名注册和续费，不加任何额外加价”](https://www.cloudflare.com/application-services/products/registrar/buy-ai-domains/#:~:text=Cloudflare%20offers%20.ai%20domain%20registrations%20and%20renewals%20at%20wholesale%20prices%2C%20with%20no%20additional%20markups)；价格固定、可预测，比随促销变化的价格更便于智能体推理。

第二种替代方案是钱包签名支付，它移除的不只是银行卡，而是账户本身。Namefi 的 `web3` 文档描述了一条建立在 HTTP 402 状态码和 [x402](/zh-CN/glossary/x402/) 模式之上的流程：没有付款的域名请求会在 402 响应中返回价格；调用方的钱包签署 EIP-3009 授权；随后将该签名授权作为标头重放，以一步完成注册和结算——明确表示[“无需 Namefi 账户或 EIP-712 签名。”](https://namefi.io/web3/llms.txt) 这里的重点更窄：这是一种软件可以自行持有和使用的支付方式，而已保存的信用卡在结构上无法做到。若想了解端到端的流程，请参阅[用加密钱包支付域名：无需账户](/zh-CN/blog/wallet-checkout/)。

## 策略钩子：整个类别尚未解决的一行

这是真实的缺口。可发现性、机器可读文档、结构化错误和程序化支付，都是注册商可以一次构建并发布的能力。策略钩子——支出上限、超过阈值时的确认步骤、仅限某个 TLD 或预算的密钥——则不同，因为它们保护的是委托权限的人类，而不是让 API 更易使用。

核查 Namefi 自己的文档后，最能验证的情况是：它将某些操作标记为重要操作，并记录了结构化、机器可读的错误信息（稳定代码、`retryable` 标志、结构化细节）——这确实推进了该项能力。但截至本文撰写时，我们未在公开 API 参考中找到已记录的支出上限原语，也未找到服务端确认闸门；这一护栏目前存在于更上一层，即人类在 MCP 客户端本身设置的策略中。我们同样未在 Cloudflare 或 Name.com 的注册商 API 公开文档中发现支出上限原语的说明——这是每一家智能体原生注册商接下来都应补齐的一项能力。

## 按清单为当今平台评分

下表展示了在六项清单上的得分，覆盖本领域最常被提及的三个平台。评分依据是我们直接核查各平台自己的在线文档所得，而非营销文案：

| 注册商 | 可发现性 | 自然语言文档 | 机器可读错误 | 无需浏览器的购买 | 程序化支付 | 策略钩子 |
| --- | --- | --- | --- | --- | --- | --- |
| Namefi | 是——llms.txt + MCP 服务器 | 是——llms.txt 系列 | 是——结构化代码 | 是——REST + MCP | 是——API 密钥或钱包（x402） | 尚未有文档说明 |
| Cloudflare Registrar | 部分——有自己的 llms.txt；MCP 属于编辑器层面，并非已确认的专用服务器 | 不明确——除 llms.txt 索引外未完成验证 | 不明确——未在公开文档中验证 | 是——根据 beta 报道由 API 驱动 | 是——API 密钥、按成本定价 | 尚未有文档说明 |
| Name.com | 不明确——在直接核查的域名根目录未发现 llms.txt | Name.com 自己的公告中声称如此，但未进一步独立验证 | 在所查阅的旧版文档中未找到；对较新的 API 尚不明确 | 未独立验证 | 部分——仅记录了账户余额计费 | 尚未有文档说明 |

三家在同一行都留白——策略钩子——这是全行业的真实缺口，并非针对任何一个平台的指责；随着这个领域的发展，值得重新核查。

## 常见问题

### 什么是智能体原生域名注册商？

智能体原生注册商，是指 AI 智能体无需浏览器、无需人类预先阅读文档、无需任何人输入卡号，就能自行发现、理解并完成交易的注册商。它在可发现性（`llms.txt` 文件或 MCP 服务器）、自然语言文档、机器可读错误、无需浏览器的购买和程序化支付上均能得分为“是”；策略钩子（支出上限、确认闸门）则是该类别仍在构建的一环。

### 为什么 AI 智能体不能使用普通注册商 API？

从技术上说，它们可以调用端点；但大多数注册商 API 假定人类开发者已经读过文档，并提前编写了集成代码。没有既有集成的智能体没有标准方法发现基础 URL、了解认证方案或解释文字错误消息——这个 API 能工作，只是因为人已经做过解读工作，而不是因为冷启动智能体能读懂它。

### `llms.txt` 与 MCP 有什么区别？

`llms.txt` 是智能体读取一次、用于了解网站或 API 是什么及如何使用它的纯文本文件——它对语言模型的作用，类似 `robots.txt` 对爬虫的作用。[MCP](https://modelcontextprotocol.io) 是智能体客户端连接到服务器、以调用工具的实时协议连接。二者互补：`llms.txt` 用于发现，MCP 是智能体用来行动的连接。关于发现这一半的更多内容，请参阅[面向域名的 llms.txt：任何 AI 智能体都能读取的 API](/zh-CN/blog/llms-txt/)。

### 我如何让自己的 API 可供智能体使用？

发布一份供模型理解 API 的 `llms.txt`，提供 MCP 服务器（或至少提供采用 OpenAPI 文档的端点），返回具有稳定代码的结构化错误而非文字说明，确保每一项写入操作都能在没有托管结账页面的情况下完成，支持一种不依赖人类银行卡的支付方式，并加入支出或确认限额，让持有凭据的人可以限定智能体被允许执行的范围。

### Namefi 是智能体原生的吗？

按上面的清单，Namefi 在直接验证的六项中有五项得分为“是”：它发布了 `llms.txt` 系列和 MCP 服务器；其文档为智能体消费而构建；其出站 API 返回结构化、机器可读的错误；注册完全通过 API 或基于 x402 的钱包流程完成，不需要仪表板；支付可使用 API 密钥或钱包签名交易，无需账户。公开 API 参考中尚未记录策略钩子；该控制目前位于客户端侧。<!-- TODO: confirm with team — whether a spend-cap or purchase-confirmation feature is on the near-term roadmap -->

### 有 MCP 服务器是否就自动意味着注册商是智能体原生的？

不是。MCP 支持覆盖了可发现性和无需浏览器的购买，但注册商即使公开 MCP 服务器，仍可能返回非结构化错误、仍要求已保存的银行卡，或仍没有支出上限机制。智能体原生指的是整份清单，而不是其中任意一项。

## 来源与延伸阅读

- 维基百科 —— [可扩展配置协议（EPP 于 2004 年 3 月标准化为 Proposed Standard）](https://en.wikipedia.org/wiki/Extensible_Provisioning_Protocol#:~:text=Proposed%20Standard%20documents%20%28RFCs%203730%20-%203734%29%20were%20published%20by%20the%20RFC%20Editor%20in%20March%202004)
- CircleID —— [2026 年的域名世界：AI、安全、市场成熟度与新 gTLD 前沿（“AI 智能体日益充当域名转售商……”）](https://circleid.com/posts/the-domain-universe-in-2026-ai-security-market-maturity-and-the-new-gtld-frontier#:~:text=AI%20agents%20are%20increasingly%20acting%20as%20domain%20resellers%20checking%20availability%2C%20registering%20names%2C%20and%20configuring%20DNS%20without%20human%20intervention)
- webhosting.today —— [AI 智能体现在可以注册域名，无需人类参与（Cloudflare Registrar API beta，2026 年 4 月）](https://webhosting.today/2026/04/22/ai-agents-can-now-register-domains-no-human-required/#:~:text=The%20API%20is%20designed%20to%20work%20inside%20the%20tools%20where%20developers%20already%20operate%2C%20code%20editors%20with%20MCP%20support%20such%20as%20Cursor%20and%20Claude%20Code)
- Name.com —— [首个 AI 原生域名平台（“由 Model Context Protocol 等现代标准支持……”）](https://www.name.com/blog/the-first-ai-native-domain-platform#:~:text=Our%20platform%20is%20supported%20by%20modern%20standards%20like%20Model%20Context%20Protocol)
- llmstxt.org —— [/llms.txt 文件提案](https://llmstxt.org/#:~:text=A%20proposal%20to%20standardise%20on%20using%20an%20/llms.txt%20file%20to%20provide%20information%20to%20help%20LLMs%20use%20a%20website%20at%20inference%20time)
- modelcontextprotocol.io —— [什么是 Model Context Protocol（MCP）](https://modelcontextprotocol.io/#:~:text=MCP%20%28Model%20Context%20Protocol%29%20is%20an%20open-source%20standard%20for%20connecting%20AI%20applications%20to%20external%20systems)
- Schema.org —— [FAQPage](https://schema.org/FAQPage)
- Cloudflare —— [以成本价购买 .ai 域名](https://www.cloudflare.com/application-services/products/registrar/buy-ai-domains/#:~:text=Cloudflare%20offers%20.ai%20domain%20registrations%20and%20renewals%20at%20wholesale%20prices%2C%20with%20no%20additional%20markups)
- Cloudflare Developers —— [注册商文档索引（llms.txt）](https://developers.cloudflare.com/registrar/llms.txt)
- Namefi —— [namefi.io/llms.txt（API 与 MCP 服务器参考——本文 Namefi 产品主张的事实来源）](https://namefi.io/llms.txt)
- Namefi —— [namefi.io/web3/llms.txt（钱包签名 / x402 支付流程，“无需 Namefi 账户或 EIP-712 签名”）](https://namefi.io/web3/llms.txt)
