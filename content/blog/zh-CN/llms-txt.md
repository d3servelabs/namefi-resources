---
title: "面向域名的 llms.txt：任何 AI 智能体都能读取的 API"
date: '2026-07-10'
language: 'zh-CN'
tags: ['ai-agents', 'domains', 'explainer']
authors: ['aileen-wright']
editors: ['victor-zhou']
draft: false
format: explainer
ogImage: ../../assets/llms-txt-og.jpg
description: "带你了解 namefi.io/llms.txt：一个纯文本文件如何让任何 AI 智能体发现并使用注册商的完整 API，以及它如何与 MCP 配合使用。"
keywords: ["llms.txt", "llms.txt 示例", "什么是 llms.txt", "AI 可读的 API 文档", "API 可发现性", "面向 AI 的 robots.txt", "llms.txt 与 MCP", "namefi.io/llms.txt", "机器可读的 API 参考", "智能体原生 API", "面向 LLM 的结构化文档", "纯文本 API 发现", "MCP 发现描述符", "AI 智能体注册域名"]
relatedArticles:
  - /zh-CN/blog/ai-agent-register/
  - /zh-CN/blog/claude-mcp-domains/
  - /zh-CN/blog/namefi-mcp/
  - /zh-CN/blog/mcp-quickstart/
  - /zh-CN/blog/agent-native/
relatedTopics:
  - /zh-CN/topics/web3-foundations/
  - /zh-CN/topics/domain-basics/
relatedSeries:
  - /zh-CN/series/blockchain-concepts/
  - /zh-CN/series/tokenize-your-com/
relatedGlossary:
  - /zh-CN/glossary/ai-agent/
  - /zh-CN/glossary/registrar/
  - /zh-CN/glossary/epp/
  - /zh-CN/glossary/dns/
  - /zh-CN/glossary/seo/
---

每一家提供 [API](/zh-CN/glossary/epp/) 的[注册商](/zh-CN/glossary/registrar/)，总会在某处放置文档：文档网站、参考页面，或许还有一份藏在登录墙后的 OpenAPI 规范。过去二十年这已经足够，因为读者是人类开发者；他们可以点击浏览、略过导航栏，找到真正重要的那一段。可在推理时阅读同一个网站的 [AI 智能体](/zh-CN/glossary/ai-agent/)没有这种余裕：上下文预算固定、没耐心应对由 JavaScript 渲染的文档门户，而且只有一次机会弄清 API 的作用；否则它就会放弃，或臆造一个根本不存在的端点。

`llms.txt` 正是为解决这个问题而生，Namefi 已在 [namefi.io/llms.txt](https://namefi.io/llms.txt) 发布该文件。本文会介绍这项约定是什么、为什么需要它、我们的文件逐段包含什么、它刻意不涵盖哪些内容，以及它如何与 [Model Context Protocol](https://modelcontextprotocol.io)（MCP）互补而非竞争。按设计而言，本文本身也是所述事物的示例：一家公开 API 供应商用平实的文字解释自己的机器可读发现文件。

## 为什么智能体不能直接抓取你的文档网站

`llms.txt` 的存在理由并非猜测——提案中已有直接说明。[Jeremy Howard 的原始说明](https://llmstxt.org)开篇便写出了其动机：“大型语言模型越来越依赖网站信息，但面临一个关键限制：上下文窗口太小，无法完整处理大多数网站。将包含导航、广告和 JavaScript 的复杂 HTML 页面转换为适合 LLM 的纯文本，既困难又不精确。”

这里叠加了两个问题。相对于一个智能体完成单项任务所需的几段内容，真实文档网站里的导航、更新日志、营销文案和 Cookie 横幅大多都是噪声。更麻烦的是，许多噪声位于无头抓取不会执行的 JavaScript 后面，因此智能体的 HTTP 客户端看到的甚至不是人类看到的页面。`llms.txt` 绕开了这两点：它是一份单独的纯文本 Markdown 文件，意在被完整阅读，而不是被抓取后再压缩。

## 与 `robots.txt` 的类比，以及类比失效之处

对熟悉 Web 基础设施的人而言，用 [`robots.txt`](https://www.robotstxt.org) 类比是最快理解 `llms.txt` 的方式，而且在一定范围内很恰当。`robots.txt` 的存在是为了向网络爬虫提供指令；网站自己的表述是：“网站所有者使用 /robots.txt 文件向网络机器人说明与其网站有关的指令；这称为 *Robots Exclusion Protocol*。”两种文件都位于可预测的根路径，都是纯文本，面向的是自动化读取者而非人类。

但这个类比在意图上就不成立了。`robots.txt` 几乎完全是**否定性**指令——`Disallow: /some-path` 告诉爬虫*不要*触及什么。`llms.txt` 则是**肯定性**的：这里是什么网站、哪些内容值得读。它不像围栏，更像是为无法翻阅整本书的读者准备的目录。两者彼此互补，Namefi 的网站同时运行着这两种机制。

## 规范实际要求什么

`llms.txt` 并非自由格式；提案规定了特定的 Markdown 结构和顺序：可选的字节顺序标记、一个以站点名称为内容的必需 H1、一个引用式摘要、零个或多个不带标题的细节部分，以及零个或多个由 H2 分隔、包含 `[名称](URL)：说明` 链接的“文件列表”部分。其中一个 H2 标题有特殊含义：名为 **Optional** 的部分表示“如果你需要更短的上下文，可以跳过这里的 URL。”Namefi 的文件正是使用了这个标题，并完全按照规范所述的方式使用它。

## 逐段阅读 namefi.io/llms.txt

下面是线上文件及其逐段注解——文件实际上写了什么、直接引用了什么，以及为什么要为首次读取它的智能体采用这样的结构。

| 部分（在文件中的呈现方式） | 写了什么 | 为什么这样写 |
| --- | --- | --- |
| H1 + 引用摘要 | `# Namefi API` / `> Namefi lets you register traditional domains as NFTs and manage their DNS records via API.` | 这是规范要求的开头——即使智能体什么都不再读，也有一行可直接行动的信息。 |
| MCP 指针，内嵌在摘要中 | `MCP server (every operation below as MCP tools): https://api.namefi.io/mcp — discovery descriptor at https://namefi.io/.well-known/mcp/servers.json` | 在前三行把最快路径——实时协议连接——置于纯文本路径之前。 |
| `## Base URLs` | `https://api.namefi.io/v-next/` | 一行，不加说明；构造原始 HTTP 调用的智能体恰好需要这些。 |
| `## MCP Server (for AI agents)` | “Prefer MCP if your client supports it… Add in Claude Code: `claude mcp add --transport http namefi https://api.namefi.io/mcp --header "x-api-key: YOUR_KEY"`” | 说明优先选择 MCP，并提供一条可直接复制粘贴的命令，而非一段说明性文字。 |
| `## Authentication` | “Generate a key at https://namefi.io/api-key… Works for **all operations**… **Direct HTTP usage (recommended for AI agents):** Pass the header directly — no SDK required” | 直接告诉读者：写入调用无需 SDK、OAuth 流程或浏览器会话即可认证。 |
| `## Domain Registration` | 一个三步 `curl` 流程：查询可用性、提交 `POST /v-next/orders/register-domain`、轮询 `GET /v-next/orders/{orderId}` 直到获得终态 | 将核心交易写成可执行命令，而不是用散文描述请求/响应结构。 |
| `## DNS Record Management` | 一张涵盖十一项端点的表格（在 `/v-next/dns/records`、`/v-next/dns/park`、`/v-next/dns/forwarding` 等路径上执行 `GET`/`POST`/`PUT`/`DELETE`），包含方法、路径、认证方式和单行说明 | 多个相似端点属于参考资料；用表格呈现比写成十一段文字更合适。 |
| 故障排除说明 | “**UNAUTHORIZED (401):** Your API key is invalid, expired, or not associated with the domain owner's wallet… **Record validation errors:** Check that `zoneName` has no trailing dot, `rdata` for CNAME/MX/NS types has a trailing dot…” | 以原因与修复方式呈现智能体最可能先遇到的失败场景，而非给出泛泛的状态码表。 |
| `## Optional` | 链接到 TypeScript SDK 文档、`@namefi/api-client` npm 包、机器可读的 OpenAPI 3 规范、外发智能体指南，以及包含签名器无关辅助脚本的 GitHub 仓库 | 这是规范中“上下文较短时可跳过”的部分——提供更深层资源，而非核心流程的前置条件。 |

文件最后指向 `namefi.io/llms-full.txt`，它将相同内容内联为一个文档，其中还包括根文件仅链接出去的 Web3 支付流程和外发指南。这一划分呼应了规范自身的两层模式：让入口足够短，能轻松装入上下文；需要更多信息的智能体再沿着一个链接继续读取。

## 配套文件：Web3 与 MCP 发现

根文件会链接到同级文件，承载不适合放进通用入口的 API 部分。[namefi.io/web3/llms.txt](https://namefi.io/web3/llms.txt) 记录的是持有钱包的智能体可采用、而非使用 API 密钥的支付路径：一个 [x402](/zh-CN/glossary/x402/) 流程，其中 `GET /x402/domain/{domainName}` 在附加已签名的 `X-PAYMENT` 标头之前，会返回带有定价信息的 `402 Payment Required`；还有一种通过 `mppx` CLI 签名的 MPP（Machine Payable Protocol）挑战—响应变体，以及覆盖智能合约钱包的手动 EIP-712 签名路径。该文件明确写道，x402 注册“无需 Namefi 账户或 EIP-712 签名——买方的钱包签署 EIP-3009 `transferWithAuthorization`。”只需要 API 密钥的智能体完全不必加载这些内容。

MCP 另有独立的发现文件，与 `llms.txt` 完全分开：[namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json)。它是一个小型 JSON 描述符，而不是 Markdown：

```json
{
  "servers": [
    {
      "name": "namefi-api",
      "transport": "streamable-http",
      "url": "https://api.namefi.io/mcp",
      "authentication": {
        "type": "apiKey",
        "in": "header",
        "name": "x-api-key"
      },
      "documentation": "https://namefi.io/llms.txt"
    }
  ]
}
```

该描述符位于 `.well-known/` 下；这是与 `/.well-known/security.txt` 为机器可发现元数据所采用的同一约定。它是 `llms.txt` 的 Markdown 散文方法更窄、更具 JSON 类型约束的同级方案。其最后一个字段会指回 `llms.txt`，因此先发现 MCP 服务器的智能体仍能找到对这些工具作用的纯文本说明。

## 包含什么、排除什么，以及原因

有几个设计选择看起来是有意为之。几乎每项操作都是可运行的 `curl` 调用，而不是描述请求模式的文字——该文件是写给会执行代码的对象，而非为自己的摘要撰文的对象。根文件用链接而不是将所有内容都放进去，`llms-full.txt` 则内联了根文件仅作引用的内容——这是对规范自身尺寸管理模式的字面应用。`## Optional` 部分在 Markdown 旁链接了完整 OpenAPI 3 规范，因此需要严格类型化架构的工具可以获取它，又不会让主要阅读路径变得杂乱。基于钱包的支付方式——x402、MPP、EIP-712——也放在独立文件中，让 API 密钥认证和域名注册成为每个智能体最先读到的内容。

<!-- TODO: 与团队确认——根 llms.txt 是否有目标 token/字符预算，以及随着 API 增长，llms.txt / llms-full.txt / web3/llms.txt / outbound/llms.txt 之间的划分如何复审 -->

## llms.txt 与 MCP：发现和连接

这里值得准确说明两者各自的作用。`llms.txt` 是一份文档：智能体抓取一次后，就知道 API 是什么以及更深层资源在哪里；在某个主体根据它采取行动之前，它只是静态文本。[MCP](https://modelcontextprotocol.io) 按该协议自己的描述，是“一项用于将 AI 应用连接到外部系统的开源标准”——客户端会与服务器建立实时会话，并在此会话中列出和调用可执行工具。

Namefi 的文件直接展示了这种关系：`llms.txt` 告诉智能体，`api.namefi.io/mcp` 上存在 MCP 服务器，并提供 `claude mcp add` 命令以建立连接。读取文件，得知存在实时工具接口，连接，然后行动。跳过 `llms.txt`、直接使用 MCP 的智能体仍可以通过 `.well-known/mcp/servers.json` 找到该服务器——但该描述符的 `documentation` 字段会指回 `llms.txt`，因此两者很少真正彼此孤立运行。

## 给其他 API 供应商的建议

发布一份可用的 `llms.txt` 无需重建你的文档：

1. **把 H1、摘要和最快的连接方式放在最前面**——上下文很小的智能体可能永远不会读过最开始几行。
2. **展示可运行的请求，而非架构散文。** 一条包含真实字段名称的 `curl` 命令，胜过描述 JSON 请求体的一段文字。
3. **按体量划分，而不是按团队结构。** 一个简短根文件加上一份更完整的扩展，再按支付等关注点单独拆分文件，能让常见路径保持精简。
4. **记录真实失败模式**，而不只是状态码——调用为什么返回 401 而非 403，比数字本身更重要。
5. **对任何可跳过内容使用 `## Optional` 标题**，遵循规范自己的约定。
6. **若你运行 MCP 服务器，也应与 llms.txt 一同发布 MCP 发现描述符**——前者回答“这是什么”，后者回答“怎样连接”。

## 常见问题

### 什么是 llms.txt？

它是一项提议中的约定，并非正式的 IETF 或 W3C 标准。它用于在网站根目录发布一份纯文本 Markdown 文件，告诉 AI 智能体网站或 API 是什么，以及去哪里获取更多细节。它规定了特定顺序：H1 标题、引用式摘要、可选的细节段落，以及以 H2 分隔的链接列表，其中 “Optional” 标题专门用于可跳过内容。

### llms.txt 与 robots.txt 有什么不同？

`robots.txt` 是面向网络爬虫的否定性指令——根据 Robots Exclusion Protocol，它告诉爬虫不要索引什么。`llms.txt` 则是肯定性的：网站是什么、什么值得读。两者面向不同的自动化读取者，通常同时存在。

### llms.txt 会取代 MCP 吗？

不会。`llms.txt` 是智能体读取一次、用来了解 API 作用的文档；MCP 是其客户端为实际调用该 API 操作而建立的实时协议连接。Namefi 同时发布两者，而 `llms.txt` 最先告诉智能体 MCP 服务器的存在。

### Namefi 的 llms.txt 文件中有什么？

基础 URL、MCP 服务器指针、API 密钥认证部分、包含可运行 `curl` 示例的三步域名注册流程、DNS 记录管理端点表、域名配置端点、故障排除部分，以及链接到 SDK、OpenAPI 规范、钱包支付和外发工作流配套文件的 “Optional” 部分。

### 不使用 AI 智能体，我自己可以阅读 llms.txt 吗？

可以——它是纯 Markdown，人可以读，模型也可以读。[namefi.io/llms.txt](https://namefi.io/llms.txt) 读起来像一份简明的 API 快速参考；帮助人类快速浏览的同样清晰的结构，也能帮助模型正确解析。

## 来源和延伸阅读

- llmstxt.org — [/llms.txt 文件：背景、提案和格式规范](https://llmstxt.org/#:~:text=Large%20language%20models%20increasingly%20rely%20on%20website%20information%2C%20but%20face%20a%20critical%20limitation)
- robotstxt.org — [关于 /robots.txt：“简而言之”](https://www.robotstxt.org/robotstxt.html#:~:text=Web%20site%20owners%20use%20the%20/robots.txt%20file%20to%20give%20instructions%20about%20their%20site%20to%20web%20robots%3B%20this%20is%20called%20The%20Robots%20Exclusion%20Protocol)
- modelcontextprotocol.io — [什么是 Model Context Protocol (MCP)？](https://modelcontextprotocol.io/#:~:text=MCP%20%28Model%20Context%20Protocol%29%20is%20an%20open-source%20standard%20for%20connecting%20AI%20applications%20to%20external%20systems)
- Namefi — [namefi.io/llms.txt](https://namefi.io/llms.txt)（本文所有带注释摘录的主要来源）
- Namefi — [namefi.io/web3/llms.txt](https://namefi.io/web3/llms.txt)（x402、MPP 与 EIP-712 钱包支付流程）
- Namefi — [namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json)（MCP 发现描述符）
- Namefi — [namefi.io/llms-full.txt](https://namefi.io/llms-full.txt)（将 Web3 和外发配套文件内联的单文件扩展版本）
- IETF — [RFC 8615，《Well-Known Uniform Resource Identifiers》（`.well-known/` 约定）](https://datatracker.ietf.org/doc/html/rfc8615)

## 自己阅读该文件

理解 `llms.txt` 最快的方法就是打开一份。[namefi.io/llms.txt](https://namefi.io/llms.txt) 公开、无需认证，也足够短；读完本文的时间，就足以读完这份每个连接 Namefi 的 AI 智能体都会优先读取的文件。若想了解其背后的 MCP 工具实际能做什么，请参阅[Namefi MCP Server：面向 AI 智能体的域名工具](/zh-CN/blog/namefi-mcp/)；若要从编辑器连接，请查看 [MCP 快速入门](/zh-CN/blog/mcp-quickstart/)；若想观看智能体跑完整个流程，请阅读[如何通过 AI 智能体在 Namefi 注册域名](/zh-CN/blog/ai-agent-register/)。
