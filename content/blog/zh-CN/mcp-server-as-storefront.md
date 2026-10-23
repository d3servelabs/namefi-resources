---
title: "MCP 服务器的 tools/list，到底能告诉你多少价格信息"
date: '2026-09-01'
language: 'zh-CN'
tags: ['mcp', 'ai-agents', 'commerce', 'json-schema', 'api-design']
authors: ['fenwei-bian']
editors: ['victor-zhou']
translators: ['fenwei-bian']
draft: false
cluster: domain-basics
format: explainer
description: "MCP 规范里没有价格、购物车或结账字段。Namefi、Shopify 的商品目录 MCP 和 commercetools，各自用不同的方式填上了这个空白。"
ogImage: ../../assets/mcp-server-as-storefront-og.jpg
keywords: ['MCP 店面', 'MCP tools/list 价格', '模型上下文协议 商务', 'MCP 价格字段', 'UCP 通用商务协议', 'MCP 服务器定价约定', '智能体商务 MCP', 'MCP 购物车结账', 'MCP outputSchema', 'commercetools MCP', 'Shopify Storefront MCP', 'MCP schema.ts', 'Namefi MCP 定价', 'AI 智能体通过 MCP 购买', 'MCP 互操作性']
relatedArticles:
  - /zh-CN/blog/namefi-mcp/
  - /zh-CN/blog/mcp-vs-rest-api/
  - /zh-CN/blog/google-unveils-universal-commerce-protocol-to-power-the-next-generation-of-ai-shopping-agents/
  - /zh-CN/blog/what-is-agent-payment/
  - /zh-CN/blog/agents-buy-domains/
relatedTopics:
  - /zh-CN/topics/domain-basics/
  - /zh-CN/topics/web3-foundations/
relatedSeries:
  - /zh-CN/series/blockchain-concepts/
  - /zh-CN/series/tokenize-your-com/
relatedGlossary:
  - /zh-CN/glossary/mcp/
  - /zh-CN/glossary/ai-agent/
  - /zh-CN/glossary/x402/
  - /zh-CN/glossary/epp/
  - /zh-CN/glossary/registrar/
---

Shopify 的产品干脆就叫“Storefront MCP”。它自己的文档把它描述为帮助购物者[“浏览商品、管理购物车并从指定 Shopify 店铺结账”](https://shopify.dev/docs/apps/build/storefront-mcp/servers/storefront#:~:text=Learn%20how%20to%20use%20the%20Storefront%20MCP%20server%20tools%20to%20help%20shoppers%20browse%20products%2C%20manage%20carts%2C%20and%20checkout%20from%20a%20specific%20Shopify%20store)的工具。BigCommerce 为自家服务器沿用了同一个名字，宣传语是让它支持[“对话式商品搜索、购物车管理和无缝结账”](https://www.bigcommerce.com/blog/storefront-mcp/#:~:text=Storefront%20MCP%20is%20now%20available%20to%20every%20store%2C%20enabling%20conversational%20product%20search%2C%20cart%20management%2C%20and%20seamless%20checkout)；微软的 Dynamics 365 Commerce MCP 服务器则被描述为驱动[“商品发现、结账、库存与零售运营”](https://www.microsoft.com/en-us/dynamics-365/blog/it-professional/2026/06/29/dynamics-365-commerce-introduces-agentic-capabilities-with-model-context-protocol-mcp/#:~:text=Discover%20how%20the%20Dynamics%20365%20Commerce%20MCP%20server%20enables%20AI%20agents%20to%20power%20product%20discovery%2C%20checkout%2C%20inventory%2C%20and%20retail%20operations)。Namefi 以及越来越多的注册商和交易市场，也用同样的说法推出了自己的 MCP 服务器。[模型上下文协议 (MCP)](/zh-CN/glossary/mcp/)本身从未使用过“店面”这个词，它的规范里定义了服务器可以暴露的三类东西——工具、资源、prompt——没有一个字段是用来表示价格的。

这个空白并不是缺陷：MCP 从设计之初就是一种通用方式，让语言模型能够发现并调用服务器的能力，而不是一套商务协议。但这也意味着，“店面”这个说法在营销文案里承担了大量它本不该承担的工作。购物智能体在 MCP 上看到的每一个价格、填进的每一个购物车、完成的每一次结账，都是某个具体服务器自行选择叠加上去的能力——而经过实际对照的三家商务服务器——Namefi、Shopify 和 commercetools——各自用三种不同的方式叠加了它。任何要把智能体接到某个基于 MCP 的店面上的开发者，在动手写集成代码之前都需要弄清楚这一点：从一台服务器上学到的价格字段，对下一台服务器的形态毫无参考价值。

## `tools/list` 实际给了你什么

对任何 MCP 服务器调用 `tools/list`，不管工具本身做什么，返回结果都带着同一套固定字段。规范规定，一个工具定义包含 `name`、可选的 `title` 与 `icons`、`description`，一个必须[“是合法 JSON Schema 对象”](https://modelcontextprotocol.io/specification/2026-07-28/server/tools#:~:text=be%20a%20valid%20JSON%20Schema%20object)的 `inputSchema`，以及一个描述结果形状的可选 `outputSchema`。这就是全部契约。直接拉取当前的协议模式——[2026-07-28 版本](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/main/schema/2026-07-28/schema.ts)原始的 `schema.ts` 文件——搜索其中的 `price`、`cost`、`cart`、`checkout`、`payment`、`currency`、`inventory` 和 `sku`，恰好只能命中一处：`ModelPreferences` 上的 `costPriority` 字段，它告诉服务器，在为采样选取模型时[该在多大程度上优先考虑成本](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/main/schema/2026-07-28/schema.ts#:~:text=How%20much%20to%20prioritize%20cost%20when%20selecting%20a%20model)——这是关于*推理*成本的提示，不是商家所售商品的价格。schema 里再没有其他任何字段和商务沾得上边。

最接近落地的两个扩展也没有补上这块空白。[MCP Apps](https://github.com/modelcontextprotocol/ext-apps/blob/main/specification/2026-01-26/apps.mdx)让服务器可以把一个交互式 HTML 界面交给宿主端，在沙箱化的 iframe 中渲染；[MCP Tasks](https://github.com/modelcontextprotocol/ext-tasks/blob/main/specification/2026-07-28/tasks.md)把一次长时间运行的工具调用，变成一个可轮询的句柄，而不是一次阻塞式请求——这两者用同一组商务词汇去搜，结果同样干净。Tasks 给了服务器一种持久的方式来说“还在处理，稍后再来看”——对一次缓慢的库存同步之类的场景很有用，但它并不会告诉你库存里到底有什么。这两个扩展都不是为商务而设计的，也都没有把商务悄悄地当成副作用带进来。

还有第二个更具体的空白，值得在动手之前先弄清楚：基础规范里的 `tools/call` 不带会话。[2026-07-28 版本](https://modelcontextprotocol.io/specification/2026-07-28/changelog#:~:text=Make%20MCP%20stateless%3A%20remove%20the%20initialize/notifications/initialized%20handshake)彻底移除了 `initialize` 握手环节，工具那一页也明确写着：[“MCP 没有协议层面的会话，因此服务器不能依赖隐式的、按连接保存的状态，去把前后两次工具调用关联起来。”](https://modelcontextprotocol.io/specification/2026-07-28/server/tools#:~:text=MCP%20has%20no%20protocol%2Dlevel%20session%2C%20so%20a%20server%20cannot%20rely%20on%20implicit%20per%2Dconnection%20state%20to%20relate%20one%20tool%20call%20to%20the%20next)规范自己对“有状态”这件事——而购物车，几乎从定义上讲，就是一种会在多次调用之间累积状态的东西——给出的指引只是非规范性建议：[“协议里没有‘状态句柄’这个概念；从线路层面看，句柄不过是工具结果里的一个普通字符串，以及后续工具调用里的一个普通参数。”](https://modelcontextprotocol.io/specification/2026-07-28/server/tools#:~:text=The%20protocol%20has%20no%20concept%20of%20a%20state%20handle)说得直白点：如果一个 MCP 商务服务器想要购物车，它就得自己发明一个——从一次工具调用里返回一个不透明的 ID，指望智能体把它原样传回下一次调用。

## 三家服务器，三种答案

这些都不是在批评规范本身；恰恰相反，这正是店面的形态会因厂商而异的原因。把三家真实、公开的 MCP 商务服务器放在一起对照，就能看出“价格”和“购物车”这两个概念，被填充得有多么不一样。

**Namefi** 把价格留在 MCP 工具的表层，却把钱完全挡在外面。它的发现描述文件把可用性查询和定价都列为普通的、需要认证的 MCP 工具——文件里写得很直白：[“每一个请求都必须经过认证，包括可用性查询、定价、DNS 读取这类只读工具。”](https://namefi.io/.well-known/mcp/servers.json)但它的参考文档在“付款”这件事上划了一条硬线：[“当用户以 API 密钥 + NFSC 余额付款时，MCP 是搜索、注册、DNS 和域名配置的控制面；x402（`/x402/...`）和 MPP（`/mpp/...`）这两条加密货币付款流程是独立的 HTTP 端点，不是 MCP 工具。”](https://namefi.io/llms.txt#:~:text=MCP%20is%20the%20control%20plane%20for%20search%2C%20registration%2C%20DNS%2C%20and%20domain%20config%20when%20paying%20with%20an%20API%20key%20%2B%20NFSC%20balance.%20The%20x402%20%28/x402/...%29%20and%20MPP%20%28/mpp/...%29%20crypto-payment%20flows%20are%20separate%20HTTP%20endpoints%2C%20not%20MCP%20tools)当一个钱包在没有预存 NFSC 余额的情况下付款时，价格本身甚至都不会以 MCP 工具结果的形式出现——[如果还没附上价格，API 会用一个列出价格的 HTTP 402 状态码作答](https://namefi.io/r/en/blog/ai-agent-register#:~:text=the%20API%20responds%20with%20an%20HTTP%20402%20listing%20the%20price%20if%20none%20was%20attached%20yet)，用一个普通的 REST 状态码带出那个数字。而“购物车”在 MCP 层面根本不存在这个概念：Namefi 自家的智能体转人工流程，是通过把浏览器重定向到一个 URL——`namefi.io/cart/add-from-url?add_to_cart=example.com`——来搭建购物车的，之后从这个购物车结账的是*人*，不是智能体。

**Shopify** 走的是另一条路：它确实定义了一套共享的价格结构，但这套结构来自 MCP 之外。Shopify 的 Global Catalog MCP 服务器返回的商品数据，按它自己文档的说法，[“符合 UCP 商品目录搜索响应格式”](https://shopify.dev/docs/agents/catalog/mcp.md#:~:text=UCP%20catalog%20search%20response)——这里的 UCP，就是[通用商务协议 (UCP)](/zh-CN/blog/google-unveils-universal-commerce-protocol-to-power-the-next-generation-of-ai-shopping-agents/)，一套由 Google、Shopify、Etsy、Wayfair、Target、Walmart、Amazon、Microsoft、Meta、Salesforce、Stripe 等公司共同开发、独立于 MCP 的行业级商务规范；它有自己的 [MCP 绑定](https://ucp.dev/2026-04-08/specification/catalog/mcp/)，要求符合规范的服务器[“返回带有合法 Price 对象（金额 + 币种）的商品。”](https://ucp.dev/2026-04-08/specification/catalog/mcp/#:~:text=Return%20products%20with%20valid%20Price%20objects%20%28amount%20%2B%20currency%29)那个价格对象——以最小货币单位表示的整数金额，加一个 ISO 币种代码——在采用 UCP 的服务器*之间*确实可以通用，因为它只被定义了一次，然后被反复复用。UCP 走得比价格更远：它的结账绑定把购物车和结账定义成了 MCP 的一等工具——`create_checkout`、`get_checkout`、`update_checkout`、`complete_checkout`、`cancel_checkout`——[UCP 的能力与 MCP 工具是一一对应的](https://ucp.dev/specification/shopping/checkout/mcp/#:~:text=UCP%20Capabilities%20map%201%3A1%20to%20MCP%20Tools)。但问题在于：Shopify 是把这台符合 UCP 规范的商品目录服务器，和自己那台更老、不遵循 UCP 的“Storefront MCP”服务器*并行*运行的，两者位于不同的端点，工具名称也各自独立。跨厂商的标准化，并没有让同一家厂商内部的选择收敛成一个。

**commercetools** 干脆跳过了共享商务词汇表这一步，直接把自己原有的数据模型，原样暴露成了 MCP 工具。它的 [Commerce MCP 服务器](https://github.com/commercetools/commerce-mcp)提供了几十个狭窄的、CRUD 形态的工具——`read_carts` 与 `create_carts`、`read_standalone_prices` 与 `create_standalone_prices`、`read_inventory` 与 `create_inventory`、`create_orders`（[基于购物车、报价单或导入数据构建](https://github.com/commercetools/commerce-mcp#:~:text=Create%20order)）——每一个都只是给某个早在 MCP 出现之前就已存在多年的 commercetools REST 资源，套上了一层薄薄的封装。这里没有和 UCP 或 Namefi 共享的 `Price` 对象；只有 commercetools 自己的 `StandalonePrice`，暴露在一个 commercetools 专属的工具名下——因为这里的 MCP 层，只是对一套早已存在的 API 做的一层直通封装。

| 服务器 | 价格出现在哪里 | 购物车 / 结账 | 词汇来源 |
|---|---|---|---|
| Namefi | 出现在只读 MCP 工具结果内部；有时会完全脱离 MCP，出现在 HTTP 402 响应体里 | 一个用于转交给人工的网页 URL——不是 MCP 概念 | Namefi 自有的 API 结构 |
| Shopify（Global Catalog MCP） | 工具输出中一个共享的 `{amount, currency}` 对象 | `create_checkout` / `complete_checkout` MCP 工具（UCP 绑定） | UCP，一套外部的多厂商规范 |
| Shopify（旧版 Storefront MCP） | 自有的工具输出结构，端点与上面那台服务器分开 | 自有的购物车工具，独立于 UCP 那一套 | Shopify 自有的 API 结构 |
| commercetools | `read_standalone_prices` / `create_standalone_prices` MCP 工具 | `read_carts` / `create_carts` MCP 工具 | commercetools 原有的 REST 资源模型 |

## 互操作性的陷阱

真正的发现是这张表本身，而不只是那次空字段搜索。一个通用协议里有个空字段并不稀奇——HTTP 也没有价格请求头，也没人为此专门写篇文章。在动手之前真正值得了解的是：这个行业*并没有*就填补这个空白收敛到同一套约定上——尽管确实存在一套共享方案（UCP），而且已经有好几家大平台采用了它。针对 Shopify 那台符合 UCP 规范的商品目录服务器写的集成代码，本来指望拿到一个带 `amount` 和 `currency` 的 `Price` 对象，可一旦对上 commercetools 的 `read_standalone_prices` 工具就完全用不上了，因为它的输出遵循的是 commercetools 自己的 schema。针对 Namefi 定价工具写的代码，倒是能拿到价格，却得跑到完全另一个地方——一个 REST 端点，而不是 MCP 工具——才能查到一笔加密货币付款到底成没成功。甚至同一家厂商也可能同时并行两套约定，就像 Shopify 把 UCP 和非 UCP 的商品目录服务器分别放在不同端点上运行那样。

具体到实践上，这意味着：不要把针对某一台服务器写死的价格字段名，当成换到下一台服务器也大致能对得上的东西。也不要假设你在一台服务器上搭建的“购物车”，在下一台服务器上依然是同一个概念——它可能是一个工具调用句柄，可能是一个网页 URL，也可能根本不存在。更不要假设一台在 MCP 上给你报价的服务器，也是你通过 MCP 付款的那台服务器——在这里提到的服务器里，不止一台就不是这样。

## 动手写集成代码之前，该检查什么

在把智能体接到一个新的、基于 MCP 的店面之前，三项检查能回答大部分要紧的问题：

1. **调用 `tools/list`，读一读任何看起来像搜索或定价的工具的 `outputSchema`。** 这才是该服务器真实、当下生效的契约——不是它的营销页面，也不是某个名字听起来相似的服务器曾经怎么做。
2. **查一查有没有 UCP profile。** 一台会发布 `/.well-known/ucp`、并声明支持 `dev.ucp.shopping.catalog` 或 `dev.ucp.shopping.checkout` 的服务器，就是在承诺遵循 UCP 那套共享的 `Price` 和 `Checkout` 结构——这是目前最接近可移植约定的东西。如果没有，就先把这些工具的字段当成厂商专属的，除非有证据证明并非如此。
3. **弄清楚钱到底是从哪里走的。** 一台服务器完全可以在 MCP 上给你报价，却把付款结算放在完全另一个地方——一个独立的 HTTP 端点、一次跳转到面向人类的结账页面，或者干脆是一个状态码而不是工具结果。这条边界要去读该服务器自己的文档来确认，而不要想当然地以为 MCP 端到端全包了。

Namefi 正是最后这种拆分的一个实际例子：定价工具挂在 MCP 服务器上，但两条付款路径——用于钱包直接付款的 x402，以及用于托管式付款流程的 MPP——都是有文档说明的独立 HTTP 端点，不是 MCP 工具，原因很简单：MCP 的规范里，压根没有给这两者留下任何词汇。这不是为了填补一个谁都没料到的空白而临时打的补丁；而是一份没有价格字段的规范，留给每一个面向商务的 MCP 服务器自己去做的决定。

## 结论

MCP 不是一套店面标准，它眼下这几个可能落地的扩展，也没有一个会让它变成标准。你从 `tools/list` 里能拿到的，是一个名字、一段描述和两份 JSON schema——这是一份关于*形状*的契约，不是一份关于*商务*的契约。一台服务器对“价格”的理解，究竟是一个共享的 UCP 对象、一个自定义的 JSON 字段，还是一个只出现在 HTTP 402 响应体里的数字，都是它自己单独做出的决定；这里实际对照的三台服务器，就做出了三种不同的决定。在你按着“MCP 店面”都是一回事这个假设写下第一行集成代码之前，先去读一读该服务器实际发布的 schema，查一查它是否指向 UCP，再确认清楚钱到底在哪里结算。

## 来源与延伸阅读

- Model Context Protocol — [2026-07-28 规范：Tools](https://modelcontextprotocol.io/specification/2026-07-28/server/tools)（`Tool` 数据类型、`outputSchema`，以及“Stateful Tools”相关指引）
- Model Context Protocol — [重要变更（2026-07-28 更新日志）](https://modelcontextprotocol.io/specification/2026-07-28/changelog)（移除 `initialize` 握手与协议层会话）
- modelcontextprotocol/modelcontextprotocol — [schema/2026-07-28/schema.ts](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/main/schema/2026-07-28/schema.ts)（当前的协议 schema；`costPriority` 是唯一与成本相关的字段）
- modelcontextprotocol/ext-apps — [specification/2026-01-26/apps.mdx](https://github.com/modelcontextprotocol/ext-apps/blob/main/specification/2026-01-26/apps.mdx)（MCP Apps 扩展规范）
- modelcontextprotocol/ext-tasks — [specification/2026-07-28/tasks.md](https://github.com/modelcontextprotocol/ext-tasks/blob/main/specification/2026-07-28/tasks.md)（MCP Tasks 扩展规范）
- Namefi — [MCP 发现描述文件](https://namefi.io/.well-known/mcp/servers.json)与 [llms.txt 参考文档](https://namefi.io/llms.txt)
- Namefi — [如何用 AI 智能体在 Namefi 注册域名](https://namefi.io/r/en/blog/ai-agent-register)（HTTP 402 价格返回细节）
- Shopify — [Global Catalog MCP](https://shopify.dev/docs/agents/catalog/mcp.md) 与 [Storefront MCP 服务器](https://shopify.dev/docs/apps/build/storefront-mcp/servers/storefront)文档
- BigCommerce — [用 BigCommerce Storefront MCP 构建 AI 购物智能体](https://www.bigcommerce.com/blog/storefront-mcp/)
- Microsoft — [Dynamics 365 Commerce MCP 服务器：面向 AI 智能体与智能体商务](https://www.microsoft.com/en-us/dynamics-365/blog/it-professional/2026/06/29/dynamics-365-commerce-introduces-agentic-capabilities-with-model-context-protocol-mcp/)
- Universal Commerce Protocol — [官网](https://ucp.dev/)、[商品目录能力：MCP 绑定](https://ucp.dev/2026-04-08/specification/catalog/mcp/)，以及[结账能力：MCP 绑定](https://ucp.dev/specification/shopping/checkout/mcp/)
- commercetools — [Commerce MCP 代码仓库与工具参考](https://github.com/commercetools/commerce-mcp)
