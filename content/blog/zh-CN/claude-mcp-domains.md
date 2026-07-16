---
title: "使用 Claude 购买域名：Namefi MCP 分步指南"
date: '2026-07-10'
language: 'zh-CN'
tags: ['ai-agents', 'domains', 'guide']
authors: ['fenwei-bian']
editors: ['victor-zhou']
draft: false
format: guide
ogImage: ../../assets/claude-mcp-domains-og.jpg
description: "将 Claude 连接到 Namefi MCP 服务器，在一次对话中注册真实域名。包含精确配置、带注释的对话记录和故障排查。"
keywords: ["namefi mcp", "claude mcp 域名", "mcp 服务器设置", "用 Claude 购买域名", "x-api-key", "分步教程", "namefi mcp 域名注册", "Claude Desktop 注册域名", "Claude Code 购买域名", "namefi claude 集成", "mcp 域名注册商", "AI 智能体用 Claude 购买域名", "streamable http mcp"]
relatedArticles:
  - /zh-CN/blog/ai-agent-register/
  - /zh-CN/blog/cf-namecom-namefi/
  - /zh-CN/blog/ai-domain-platforms/
  - /zh-CN/blog/agent-native/
  - /zh-CN/blog/airo-vs-namefi/
relatedTopics:
  - /zh-CN/topics/domain-tokenization/
  - /zh-CN/topics/domain-basics/
relatedSeries:
  - /zh-CN/series/tokenize-your-com/
  - /zh-CN/series/blockchain-concepts/
relatedGlossary:
  - /zh-CN/glossary/ai-agent/
  - /zh-CN/glossary/registrar/
  - /zh-CN/glossary/dns-record-types/
  - /zh-CN/glossary/tokenized-domain/
  - /zh-CN/glossary/x402/
---

读完本指南后，你将能通过与 Claude 的一次对话，向经 [ICANN](/zh-CN/glossary/icann/) 认证的注册商注册一个真实域名，并将其 DNS 指向你正在构建的任何项目，全程无需浏览器结账、购物车或 CAPTCHA。这是 Namefi 团队为 [Namefi](https://namefi.io) MCP 服务器编写的配置指南：它以人类可读的方式讲解我们面向智能体发布在 [namefi.io/llms.txt](https://namefi.io/llms.txt) 和 [docs.namefi.io](https://docs.namefi.io) 的同一套 API。凡是尚未定案或尚未公开的信息，本文都会明确说明，而不会猜测。

已有第三方教程讲解如何让你的[AI 智能体](/zh-CN/glossary/ai-agent/)“注册域名”——[其中一个热门示例](https://dev.to/marsheer/how-to-register-a-domain-name-with-your-ai-agent-no-human-needed-h26)使用了另一个构建在 Cloudflare Registrar API 之上的转售商 MCP 服务器，展示了这一模式。不同提供商使用 MCP 的机制本质相同；本文则专门介绍 Namefi 自己的 MCP 服务器、认证模型和[代币化域名](/zh-CN/glossary/tokenized-domain/)选项，且所有内容均根据 Namefi 文档核验，而非依据第三方描述。

## MCP 是什么？简要说明

[Model Context Protocol](https://modelcontextprotocol.io)（MCP）是一项开放标准，用于将 AI 应用程序（这里是 Claude）连接到外部工具和数据源。该协议的官方文档将它比作 [AI 应用程序的 USB-C 端口](https://modelcontextprotocol.io/docs/getting-started/intro#:~:text=Think%20of%20MCP%20like%20a%20USB%2DC%20port%20for%20AI%20applications)：使用一个标准化连接器，而不是为每个工具都编写一套自定义集成。连接到 Namefi 的 MCP 服务器后，Claude 会获得一组定义明确、可调用的操作，例如检查可用性、注册域名、读取和写入 DNS 记录；不必再从粘贴到聊天中的文档里反向推导 REST API。

## 前提条件

- **支持 MCP 的 Claude 客户端。**本文会提供经过具体测试的 Claude Code（命令行）命令，也会介绍 Claude Desktop / claude.ai（通过自定义连接器）的文档化通用流程。Cursor 或 Windsurf 等其他 MCP 客户端连接的是同一台服务器；请参阅[如何在 Namefi 上通过 AI 智能体注册域名](/zh-CN/blog/ai-agent-register/)中各智能体的章节，或阅读精简版[Namefi MCP 快速入门：Claude Code、Cursor 与 Windsurf](/zh-CN/blog/mcp-quickstart/)以直接获取连接命令。
- **Namefi API 密钥**，可在 [namefi.io/api-key](https://namefi.io/api-key) 生成；或者，如果你更愿意按笔付款、完全不使用 API 密钥，也可以使用加密[钱包](/zh-CN/glossary/wallet/)（请参阅接近文末的钱包章节）。
- 如果在 Namefi 生产环境注册，则需要**已充值的 NFSC 余额**。NFSC（Namefi Service Credits）是用于支付域名注册的余额；Namefi 文档说明，在生产环境可通过 Namefi 控制台充值，而在开发环境可从 faucet 端点申请免费的测试额度。

## 第 1 步：获取 Namefi API 密钥

[API 密钥](https://namefi.io/api-key)是最简单的认证路径，本文也全程采用这一方式：一个请求头即可覆盖所有操作，包括注册、DNS 记录创建、更新和删除。在生成密钥前，有一点需要牢记：**密钥会继承生成它的钱包的权限。**如果你想管理已有域名的 DNS，请从持有该域名 NFT 的钱包生成密钥；从其他钱包生成的密钥不会拥有对注册人为他人的域名的写入权限。

生成后，密钥是一个以 `nfk_` 开头的字符串。你将在每次写入操作中通过 `x-api-key` 请求头传递它；可用性检查等只读操作则完全不需要该密钥。

## 第 2 步：将 Claude 连接到 Namefi MCP 服务器

作为经 ICANN 认证的[注册商](/zh-CN/glossary/registrar/)，Namefi 在 `https://api.namefi.io/mcp` 上为整个 API 接口面运行一台 MCP 服务器，并通过 Streamable HTTP 传输访问。该服务器将每个 `/v-next` 操作作为类型化工具公开，包括搜索、注册、DNS、域名配置和外呼；服务器的存在和连接细节本身也发布在 [namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json) 这个发现描述文件中，智能体可以机器读取它来发现服务器，无需先由人类粘贴 URL。

### Claude Code

将服务器添加到 Claude Code 只需一条命令：

```bash
claude mcp add --transport http namefi https://api.namefi.io/mcp --header "x-api-key: YOUR_KEY"
```

这与 [Claude Code 文档](https://code.claude.com/docs/en/mcp)中为携带自定义认证请求头的远程 HTTP MCP 服务器提供的语法相符。通用形式为 `claude mcp add --transport http <name> <url> --header "<Header-Name>: <value>"`。在终端执行一次该命令（用第 1 步的真实密钥替换 `YOUR_KEY`），Claude Code 便会将服务器写入项目或用户的 MCP 配置。默认情况下，该命令只为当前项目注册服务器；若希望在所有项目中可用，添加 `--scope user`。如果一开始只需要可用性搜索等只读工具，也可以省略密钥，之后再补上。

使用 `claude mcp list` 确认连接；它应显示 `namefi` 已连接。在 Claude Code 会话中输入 `/mcp`，即可查看 Namefi 服务器公开的工具数量。

### Claude Desktop 和 claude.ai

Claude Desktop 和 claude.ai 通过**自定义连接器**连接远程 MCP 服务器，流程见 [modelcontextprotocol.io 文档](https://modelcontextprotocol.io/docs/develop/connect-remote-servers)：打开 Settings，进入 Connectors，选择“Add custom connector”，然后输入服务器 URL：`https://api.namefi.io/mcp`。点击 Add 后，流程会提示你完成认证；按 Anthropic 的文档，这一步会根据具体服务器的要求，通常涉及“OAuth、API 密钥或用户名/密码组合”，Claude 会显示服务器要求的相应提示。

<!-- TODO：与团队确认——Claude Desktop 的自定义连接器认证界面为 `x-api-key` 这类请求头提供的确切字段；Anthropic 的公开文档说明了通用认证步骤，但没有展示 Namefi 服务器的具体界面。--> 如果你的 Desktop 连接器设置中没有明显可填写密钥的位置，目前已核验的路径是 Claude Code；而无需密钥的只读工具（例如可用性搜索）可通过连接器使用。

## 第 3 步：为 NFSC 余额充值

域名注册是付费操作：付款钱包必须持有 NFSC（Namefi Service Credits）。在开发或测试环境中，faucet（`POST /v-next/user/faucet`，或 SDK 中的 `client.user.requestNfscFaucet()`）会向每个钱包发放免费测试额度，并有速率限制。在生产环境中，则通过 Namefi 控制台为 NFSC 充值。<!-- TODO：与团队确认——生产环境的确切充值流程：可接受的付款方式，以及能否直接通过聊天购买，还是只能使用控制台 UI。--> 你可随时查看当前余额：连接后询问 Claude“我的 Namefi 余额是多少？”，或直接请求 `GET /v-next/balance`。

## 第 4 步：购买对话

连接 MCP 服务器并充值后，后续流程都可以用自然语言完成。以下是此类对话附带注释的示例，并对应到 Namefi API 文档中每一步所使用的底层操作。

**1. 让 Claude 检查一个名称。**

> “`example.com` 可以注册吗？”

Claude 会调用可用性检查（`checkAvailability` 操作，也可直接通过 `GET /v-next/search/availability?domain=example.com` 访问，无需认证）。它会告诉你该名称是否可用；如果你提供多个候选名称，也可以通过批量可用性检查变体一次筛选多个名称。

**2. 确认并注册。**

> “注册一年，并把 DNS 设置为让 `@` 指向 203.0.113.10。”

Claude 会提交注册订单（`registerDomain`，`POST /v-next/orders/register-domain`）；如果你同时要求 DNS 记录，它会使用组合式的 `register-domain/records` 变体，在订单完成后立即应用所请求的 [A 记录](/zh-CN/glossary/dns-record-types/)。请求体接受 `normalizedDomainName`（小写、没有末尾点号，以及任何被 [TLD](/zh-CN/glossary/tld/) `search/availability` 判定为可注册的名称）和 `durationInYears`（0–10，默认值 1）。可选的 `nftReceivingWallet` 用于控制代币化：省略它时，域名会以 NFT 形式在 Base 上注册给与你的 API 密钥关联的钱包。`domainSetupOptions` 对象还记录了更多逐域名覆盖选项，包括 `autoRenew`、`dnssec` 和 `keepExistingNameservers`；最后一项可以让 Claude 注册域名时不将其[域名服务器](/zh-CN/glossary/nameserver/)委派从当前所在位置重新指向。

**3. Claude 轮询至订单完成。**

注册是异步的。Claude（或者你查看状态时）会轮询 `getOrder`（`GET /v-next/orders/{orderId}`），直到订单达到终态：`SUCCEEDED`、`FAILED`、`CANCELLED` 或 `PARTIALLY_COMPLETED`。典型的注册会在少数几轮轮询内完成；完成后 Claude 会告知你，而不是让你一直看着加载指示器。

**4. 如果没有一次性设置所有 DNS 记录，再让 Claude 添加更多记录。**

> “再为 `www` 添加一条 CNAME，指向 `cname.vercel-dns.com.`；并在 `_verify` 下添加一条带有此令牌的 TXT 记录。”

Claude 会为每条记录调用 `createDnsRecord`（`POST /v-next/dns/records`）。在提出请求前，有两条格式规则值得了解： [CNAME](/zh-CN/glossary/dns-record-types/) 及类似记录类型的 `rdata` 必须以末尾点号结尾（如 `cname.vercel-dns.com.`），而 `zoneName`（即域名本身）则不能带末尾点号。把两者弄反，是这一流程中最常见的验证错误原因。

**5. 可选：开启自动续期。**

> “为此域名开启自动续期。”

Claude 会通过 `PUT /v-next/domain-config/auto-renew` 切换[自动续期](/zh-CN/glossary/domain-renewal/)。启用后，域名会在到期前使用所有者钱包上可用的付款方式自动续期；在开启前请注意，这是一项持续授权，而不是一次性确认。

## 第 5 步：验证解析是否生效

[DNS 传播](/zh-CN/glossary/dns-propagation/)并非即时完成，因此请在检查前等待几分钟。读取 DNS 无需认证，所以你（或 Claude）可通过 `GET /v-next/dns/records?zoneName=example.com` 或公共 DNS 查询工具确认哪些记录已经生效。如果你将域名指向部署平台，其自身的域名验证步骤（检查它要求的 TXT 记录）也是一项值得单独完成的确认。

## 使用钱包付款，而不是 API 密钥

上文全部采用 API 密钥路径。Namefi 还支持通过加密钱包注册域名，且完全不需要 Namefi 账户，方法是使用 [x402](/zh-CN/glossary/x402/) 协议：买方钱包签署一份 EIP-3009 授权；如果没有附上付款，API 会以 `402 Payment Required` 返回价格；收到有效付款后便结算注册。这个流程值得单独用一篇指南来说明，而不是在脚注中带过；完整详情请参阅[使用加密钱包支付域名：无需账户](/zh-CN/blog/wallet-checkout/)，或[如何在 Namefi 上通过 AI 智能体注册域名](/zh-CN/blog/ai-agent-register/)中的付款章节。

## 故障排查

| 症状 | 可能原因 | 解决方法 |
| --- | --- | --- |
| 任意写入调用返回 `401 UNAUTHORIZED` | API 密钥无效、已过期，或由不拥有该域名的钱包生成 | 在 [namefi.io/api-key](https://namefi.io/api-key) 使用拥有（或将拥有）该域名的钱包生成新密钥 |
| `403 FORBIDDEN` | 密钥有效，但关联的钱包并不拥有这个具体域名 | 重试前在 Namefi 账户中检查所有权 |
| 注册订单停留在非终态 | 正常情况：注册是异步的 | 继续轮询 `getOrder`；只有始终未达到 `SUCCEEDED`、`FAILED`、`CANCELLED` 或 `PARTIALLY_COMPLETED` 时，才视为卡住 |
| 创建或更新 DNS 记录时因验证错误而被拒绝 | `zoneName` 带有末尾点号，或 CNAME/MX/NS 的 `rdata` 值缺少末尾点号 | `zoneName` 不带末尾点号；FQDN 类型的 `rdata` 值必须带末尾点号 |
| 注册直接失败 | 付款钱包中的 NFSC 余额不足 | 检查余额（`GET /v-next/balance`），通过 faucet（测试环境）或 Namefi 控制台（生产环境）充值 |
| Claude 表示没有可用的域名工具 | MCP 服务器未连接，或连接时没有携带写入操作所需的请求头 | 使用 `--header` 标志重新运行 `claude mcp add`，或通过 `/mcp` / `claude mcp list` 检查连接状态 |

## 常见问题

### 我需要了解 Namefi 的 REST API 才能使用它吗，还是只用自然语言和 Claude 对话即可？

自然语言足以完成上文所有流程：“这个域名可用吗”“注册它”“把它指向这个 IP”都可以直接作为请求使用。本文记录端点和请求字段，是为了让你核验 Claude 在底层执行的操作；如果你是在编写脚本而非聊天，也可以直接自行调用它们。

### 通过 Claude 注册会比通过 Namefi 网站注册更贵吗？

本文不主张两者存在任何一方更贵的价格比较。<!-- TODO：与团队确认——Namefi 的 MCP/API 定价是否与标准注册价格一致，还是不同。--> 无论请求来自浏览器、脚本还是 MCP 工具调用，注册费用都会从同一 NFSC 余额中扣除。

### 以这种方式注册时，我的域名会自动以 NFT 形式代币化吗？

会，默认如此。如果你没有在注册请求中指定 `nftReceivingWallet`，域名会以 NFT 形式在 Base 上注册给与你的 API 密钥关联的钱包。注册时你可以将其重定向到其他钱包或链。

### 如果 Claude 的 DNS 记录请求中有拼写错误，能否在不知情的情况下损坏我的域名？

DNS 写入在应用前会经过 Namefi 的验证；格式不正确的 `rdata`（例如 CNAME 目标缺少末尾点号）会被错误拒绝，而不会被悄然接受，详见上方故障排查表。不过，仍应像对待任何基础设施变更一样，在确认前审查 Claude 即将提交的 DNS 修改。

### 我可以用同一台 MCP 服务器连接 Cursor 或 Windsurf，而不是 Claude 吗？

可以。无论哪个客户端连接，Namefi 的服务器都使用相同的开放 MCP 协议，因此服务端不会变化；不同编辑器的区别仅在于客户端侧的连接命令。请参阅[如何在 Namefi 上通过 AI 智能体注册域名](/zh-CN/blog/ai-agent-register/)中各客户端的配置章节，或较短的[Namefi MCP 快速入门：Claude Code、Cursor 与 Windsurf](/zh-CN/blog/mcp-quickstart/)。

## 通过一次对话购买下一个域名

这正是 Namefi 目前支持的实际配置，而非假设。连接 MCP 服务器后，从搜索名称、注册、设置 DNS，到（可选地）让钱包持有代币，全部都可以不离开聊天完成。MCP 服务器提供的不止注册功能：外呼线索挖掘、批量 DNS 操作、域名配置等，都能在完成设置后从同一连接中发现。完整工具目录请参阅[Namefi MCP 服务器：面向 AI 智能体的域名工具](/zh-CN/blog/namefi-mcp/)。

**[生成 Namefi API 密钥并连接 Claude](https://namefi.io/api-key)。**

## 来源与延伸阅读

- Namefi — [namefi.io/llms.txt](https://namefi.io/llms.txt)（MCP 服务器 URL、传输方式、认证、注册和 DNS 端点；本文的一手资料）
- Namefi — [docs.namefi.io：认证](https://docs.namefi.io/docs/02-authentication.mdx)（API 密钥、EIP-712 和 SIWE 认证方式；每个操作的认证要求）
- Namefi — [docs.namefi.io：注册域名](https://docs.namefi.io/docs/03-getting-started/01-your-first-domain.mdx)（SDK、fetch、cURL 和 Python 中的注册与轮询示例）
- Namefi — [docs.namefi.io：管理余额](https://docs.namefi.io/docs/03-getting-started/02-your-balance.mdx)（NFSC faucet 和余额查询端点）
- Namefi — [namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json)（MCP 发现描述文件）
- Anthropic / Claude Code — [通过 MCP 将 Claude Code 连接到工具](https://code.claude.com/docs/en/mcp#:~:text=claude%20mcp%20add%20%2D%2Dtransport%20http)（`claude mcp add --transport http` 语法、请求头认证与作用域标志）
- Model Context Protocol — [连接远程 MCP 服务器](https://modelcontextprotocol.io/docs/develop/connect-remote-servers#:~:text=Most%20remote%20MCP%20servers%20require%20authentication)（Claude Desktop 和 claude.ai 的自定义连接器流程）
- Model Context Protocol — [什么是 Model Context Protocol？](https://modelcontextprotocol.io/docs/getting-started/intro#:~:text=Think%20of%20MCP%20like%20a%20USB%2DC%20port%20for%20AI%20applications)（协议概览）
- llmstxt.org — [/llms.txt 文件](https://llmstxt.org)（namefi.io/llms.txt 所遵循的发现文件规范及其理由）
- dev.to — [如何让 AI 智能体注册域名，无需人工参与](https://dev.to/marsheer/how-to-register-a-domain-name-with-your-ai-agent-no-human-needed-h26)（基于另一台、由 Cloudflare 支持的注册商转售 MCP 服务器的第三方教程）
