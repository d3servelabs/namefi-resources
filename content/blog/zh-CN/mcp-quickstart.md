---
title: "Namefi MCP 快速入门：Claude Code、Cursor 与 Windsurf"
date: '2026-07-10'
language: 'zh-CN'
tags: ['ai-agents', 'guide']
authors: ['namefiteam']
draft: false
format: guide
ogImage: ../../assets/mcp-quickstart-og.jpg
description: "分别为 Claude Code、Cursor 和 Windsurf 配置 MCP，并通过 5 个步骤将新应用接入已上线的自定义域名，全程无需离开编辑器。"
keywords: ["Claude Code MCP 域名", "Cursor MCP 域名", "Windsurf MCP 域名", "编辑器内域名注册", "编程智能体域名注册", "从编辑器注册域名", "MCP 快速入门", "Namefi MCP 配置", "Vercel 自定义域名 Namefi", "Cloudflare Pages 自定义域名 Namefi", "为 AI 智能体部署自定义域名", "域名注册快速入门", "x-api-key MCP 配置", "将域名指向部署"]
relatedArticles:
  - /zh-CN/blog/ai-agent-register/
  - /zh-CN/blog/claude-mcp-domains/
  - /zh-CN/blog/namefi-mcp/
  - /zh-CN/blog/wallet-checkout/
  - /zh-CN/blog/vibe-coding-domain/
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
  - /zh-CN/glossary/nameserver/
  - /zh-CN/glossary/domain-renewal/
---

你已经在编辑器里了。应用脚手架已搭好，首次部署也刚刚发布到了平台子域名；现在只差一个真实域名，就能让用户访问它。本快速入门会教你如何在构建应用的同一次 [AI 智能体](/zh-CN/glossary/ai-agent/) 会话中完成注册：无需打开浏览器标签页、填写结账表单或离开编辑器。内容包括 Claude Code、Cursor 与 Windsurf 的精确 [MCP](https://modelcontextprotocol.io) 连接配置、精简的五步流程，以及大多数域名指南都会略过的部分：如何将刚注册的域名真正指向刚刚发布的部署。

本指南特意覆盖三种编辑器。如果你使用的是 OpenAI Codex、Gemini CLI 或 Claude Desktop，请参考[如何在 Namefi 上通过 AI 智能体注册域名](/zh-CN/blog/ai-agent-register/)；这是覆盖全部六种客户端的权威指南，也提供了不支持原生 MCP 的工具可用的原始 REST 路径。这里的所有配置都连接到同一个 [Namefi](https://namefi.io) MCP 服务器，因此与该指南完全一致；本页只是为开发者工具优先的使用方式提供了精简版流程，并补充了该指南未覆盖的部署步骤。

## 为什么要在编辑器内注册域名

“去注册一个域名”对于一项只需五分钟的任务来说，往往伴随着异常高的上下文切换成本：离开编辑器，打开注册商的网站，搜索名称，经历一个你并未要求的隐私保护和邮箱托管加购流程，付款，然后返回编辑器，弄清楚要添加哪些 DNS 记录。

另一种方式是，让为项目搭好脚手架并接好部署的同一名智能体处理最后一公里：查询名称、注册域名并配置 DNS，全部作为你当前对话中的工具调用完成。[Cloudflare 也在为自家的 Registrar API 推广类似理念](https://webhosting.today/2026/04/22/ai-agents-can-now-register-domains-no-human-required/#:~:text=An%20agent%20using%20the%20API%20can%20suggest%20domain%20names%2C%20check%20registrability%2C%20and%20complete%20the%20purchase%20without%20the%20user%20leaving%20their%20current%20context)，这证明它不只是小众偏好，而是已有多个注册商正在建设的工作流。文末的对比章节会专门介绍 Cloudflare 的方案；Namefi 的方案还提供[代币化域名](/zh-CN/glossary/tokenized-domain/)选项，以及无需账户、通过钱包签名完成付款的路径，详见[使用加密钱包支付域名](/zh-CN/blog/wallet-checkout/)。

## 设置连接：三种编辑器，三份配置文件

以下三种编辑器都通过 Streamable HTTP 连接到同一端点 `https://api.namefi.io/mcp`，并将你的 Namefi [API 密钥](https://namefi.io/api-key)作为 `x-api-key` 请求头发送。各编辑器的区别只在于文件格式和写入配置所用的命令。

### Claude Code

Claude Code 的官方文档提供了一个直接的 CLI 命令，可添加带自定义请求头的远程 HTTP 服务器：

```bash
claude mcp add --transport http namefi https://api.namefi.io/mcp --header "x-api-key: YOUR_KEY"
```

在项目目录的终端中运行一次该命令，并替换为你的真实密钥。默认情况下，它会将服务器写入**本地**作用域，也就是仅供你在当前项目中使用。添加 `--scope user` 可让它在本机的所有项目中可用；随后通过 `claude mcp list` 确认连接成功。

### Cursor

Cursor 从 `mcp.json` 读取 MCP 服务器配置：项目级文件为 `.cursor/mcp.json`，全局文件为 `~/.cursor/mcp.json`。其文档中定义的远程服务器格式支持通过环境变量插值传递请求头认证，因此无需把密钥直接写入文件：

```json
{
  "mcpServers": {
    "namefi": {
      "url": "https://api.namefi.io/mcp",
      "headers": {
        "x-api-key": "${env:NAMEFI_API_KEY}"
      }
    }
  }
}
```

`${env:NAMEFI_API_KEY}` 会从启动 Cursor 的 shell 中读取该变量的值；请在打开编辑器前先导出它。

### Windsurf（Cascade）

Windsurf 的 MCP 集成品牌名为 Cascade，它从 `~/.codeium/windsurf/mcp_config.json` 读取配置。这里的远程服务器使用 `serverUrl` 字段而非 `url`，但 `headers` 和 `${env:VAR}` 模式与 Cursor 相同：

```json
{
  "mcpServers": {
    "namefi": {
      "serverUrl": "https://api.namefi.io/mcp",
      "headers": {
        "x-api-key": "${env:NAMEFI_API_KEY}"
      }
    }
  }
}
```

有一点值得注意：截至本指南发布日期，`docs.windsurf.com/windsurf/cascade/mcp` 会重定向至 `docs.devin.ai/desktop/cascade/mcp`，Windsurf 的文档现已迁至 Cognition Devin 产品文档域名。上述配置格式由该当前页面说明；如果你使用的是较旧版本，请根据该版本应用内帮助所指向的文档链接核实字段名称。

## 五步快速入门：从新应用到已生效的 DNS

任一连接建立后，后续流程无论使用哪种编辑器都相同。

1. 从 [namefi.io/api-key](https://namefi.io/api-key)获取一个 API 密钥；该密钥由应当持有新域名的钱包生成。
2. 使用上方适用于你编辑器的配置进行**连接**，然后做连通性检查：询问“检查 `<yourapp>.com` 是否可在 Namefi 注册，并告诉我你调用了哪个工具。”这会执行只读的 `checkAvailability` 调用，因此即使尚未充值也能使用。
3. **注册。**用自然语言确认名称和年限，例如“注册一年”。智能体会提交 `registerDomain`，并轮询订单，直到状态达到 `SUCCEEDED`（或某个终态失败状态）；一次典型注册会在数轮轮询内完成。
4. **将其指向你的部署。**下一节会详细说明这一步：在同一场对话中，通过添加托管平台要求的 DNS 记录完成配置。
5. **验证解析。**[DNS 传播](/zh-CN/glossary/dns-propagation/)并非即时完成，因此请等待几分钟，然后使用公共 DNS 查询工具或直接在浏览器中加载该域名来确认。

## 将新域名指向刚刚发布的部署

这是通用“如何注册域名”指南通常不会讲到的部分，因为它发生在注册后、由托管平台处理；但这正是在编辑器内完成流程的实际意义：你的智能体已经知道它部署到了哪个平台，因此可以在注册的同一口气里配置 DNS。

### Vercel

Vercel 的域名文档说明了如何在项目仪表板中通过**Settings → Domains** 完成流程：添加域名后，Vercel 会告诉你该创建什么记录，具体取决于它是根域名还是子域名。对于**根域名**（`yourapp.com`），Vercel 要求使用指向其服务 IP 的 **A 记录**；对于**子域名**（`www.yourapp.com`），则要求使用 **CNAME**。在复制旧指南中的示例前，还有一点值得了解：[Vercel 文档明确说明 CNAME 目标对每个项目都是唯一的](https://vercel.com/docs/domains/working-with-domains/add-a-domain#:~:text=Each%20project%20has%20a%20unique%20CNAME%20record)，它会显示在你的仪表板中，而不是所有项目共用的固定主机名。

拿到该值后，DNS 侧只需再向智能体提出一个请求：

> “为 `@` 添加一条指向 `76.76.21.21` 的 A 记录，并为 `www` 添加一条指向 Vercel 提供的 CNAME 目标的 CNAME。”

这会调用两次 `createDnsRecord`，每条记录一次；它使用的是与任何 Namefi DNS 写入相同的 [DNS 记录类型（A、AAAA、CNAME、MX、TXT）](/zh-CN/glossary/dns-record-types/)工具。末尾点号规则在此同样适用：CNAME 目标的 `rdata` 需要有结尾点号，而 `zoneName`（你的域名）不需要。

### Cloudflare Pages

如果你的部署目标是 Cloudflare Pages，并且域名的 DNS 尚未由 Cloudflare 管理，[Cloudflare 自己的自定义域名文档](https://developers.cloudflare.com/pages/configuration/custom-domains/#:~:text=This%20record%20should%20point%20to%20your%20custom%20Pages%20subdomain)要求你创建一条指向项目 `.pages.dev` 子域名的 **CNAME** 记录。无需 A 记录，因为 Pages 会通过该 CNAME 目标提供全部服务。必须先在 Cloudflare 仪表板中完成相应步骤（Workers & Pages → 你的项目 → Custom domains → Set up a domain）；只有这样，CNAME 目标才能正确解析。

> “为 `app` 添加一条指向 `my-project.pages.dev.` 的 CNAME。”

同一个工具调用，同样要求目标带结尾点号，只是平台不同。

<!-- TODO: verify — Vercel and Cloudflare Pages exact steps for issuing/renewing the TLS certificate on a newly attached custom domain, to state confidently whether it's automatic on both or needs a manual trigger -->

## 与 Cloudflare 的编辑器内注册方案相比如何

Cloudflare 是另一家积极推广编辑器内流程的注册商，值得直接点名比较。根据[2026 年 4 月报道的 Beta 信息](https://webhosting.today/2026/04/22/ai-agents-can-now-register-domains-no-human-required/)，它的 Registrar API 也可与包括 Cursor 和 Claude Code 在内、支持 MCP 的编辑器集成，使智能体能够在不离开当前上下文的情况下同步搜索、定价并注册域名——这与本指南介绍的 Namefi 核心思路相同。同一篇报道指出，在 Beta 阶段，Cloudflare 的 API 尚未覆盖转移和续期等注册后管理功能，计划于 2026 年稍后推出。

Namefi 的 MCP 服务器目前已覆盖完整生命周期——注册、DNS、[域名续期（自动续期）](/zh-CN/glossary/domain-renewal/)——此外还有两项 Cloudflare 路径不具备的能力：域名默认会作为[代币化域名](/zh-CN/glossary/tokenized-domain/) NFT 注册（可重定向到任意钱包），并支持完全不需要 Namefi 账户的钱包签名结账，详见[使用加密钱包支付域名](/zh-CN/blog/wallet-checkout/)。两者都朝着“无需离开编辑器”的工作流发展；选择哪一个取决于你需要标准注册，还是还希望它成为链上资产。

## 常见问题

### 这也适用于 Codex 或 Gemini CLI 吗？

本页不涵盖它们：本指南刻意限定在 Claude Code、Cursor 和 Windsurf。[如何在 Namefi 上通过 AI 智能体注册域名](/zh-CN/blog/ai-agent-register/)提供了 Codex CLI、Gemini CLI 和 Claude Desktop 相同且已验证的配置。

### 在尝试前，我需要 Namefi 账户吗？

不需要。只读的可用性检查无需认证，因此你可以连接上述任意编辑器，并在生成 API 密钥或充值之前运行第 2 步中的测试提示。

### 如果我的部署平台不是 Vercel 或 Cloudflare Pages 怎么办？

这种模式在任何地方都适用：托管平台的仪表板会告诉你需要哪一种 DNS 记录类型——根域名几乎总是使用 A 记录，子域名则使用 CNAME——然后你把该值交给智能体，让它通过 `createDnsRecord` 写入。

### 以这种方式注册时，域名会自动代币化吗？

会，默认如此。域名会作为 Base 上的 NFT 注册到与你的 API 密钥关联的钱包中，除非你在请求中指定不同的 `nftReceivingWallet`。如果这一点对你来说还很新，请参阅[什么是代币化域名？域名代币化指南](/zh-CN/blog/what-are-tokenized-domains/)。

### 我可以完全跳过 API 密钥吗？

可以，但有一个前提：Namefi 的钱包签名 [x402](/zh-CN/glossary/x402/) 结账路径允许已充值的钱包在没有账户或 API 密钥的情况下支付注册费用。它需要单独说明，详见[使用加密钱包支付域名](/zh-CN/blog/wallet-checkout/)。

## 让域名随应用一起上线

域名和部署目标、数据库一样，都是基础设施。应用上线时，没有真正的理由让它成为唯一一个仍需要离开工具、填写网页表单的环节。连接上述三种配置之一，运行五步流程，域名便会指向智能体刚刚构建的同一部署，全程无需打开任何浏览器标签页。

**[生成 Namefi API 密钥](https://namefi.io/api-key)**，然后在你已打开的任意编辑器中尝试可用性检查提示；或者阅读[附带注释对话记录的完整 Claude Code 指南](/zh-CN/blog/claude-mcp-domains/)，查看每一步的详细过程。

## 来源与延伸阅读

- Namefi — [namefi.io/llms.txt](https://namefi.io/llms.txt)（MCP 服务器 URL、传输方式、认证、注册/DNS 端点参考——本指南所有 Namefi 相关主张的第一方来源）
- Namefi — [docs.namefi.io：注册域名](https://docs.namefi.io/docs/03-getting-started/01-your-first-domain.mdx)（注册请求字段、轮询流程、订单状态值）
- Namefi — [namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json)（MCP 发现描述符）
- Anthropic / Claude Code — [通过 MCP 将 Claude Code 连接到工具](https://code.claude.com/docs/en/mcp#:~:text=claude%20mcp%20add%20%2D%2Dtransport%20http)（`claude mcp add --transport http` 语法、`--header`、`--scope` 标志）
- Cursor — [cursor.com/docs/mcp](https://cursor.com/docs/mcp)（`mcp.json` 远程服务器格式、`headers`、`${env:VAR}` 插值、项目级与全局配置位置）
- Windsurf / Cascade — [docs.windsurf.com/windsurf/cascade/mcp](https://docs.windsurf.com/windsurf/cascade/mcp)（截至本指南发布日期，会重定向至 [docs.devin.ai/desktop/cascade/mcp](https://docs.devin.ai/desktop/cascade/mcp)；`mcp_config.json` 格式、`serverUrl`、`headers`）
- Vercel — [添加并配置自定义域名](https://vercel.com/docs/domains/working-with-domains/add-a-domain#:~:text=Each%20project%20has%20a%20unique%20CNAME%20record)（根域名 A 记录、每个项目唯一的子域名 CNAME 目标、名称服务器方式）
- Vercel — [域名概览](https://vercel.com/docs/domains#:~:text=76.76.21.21)（根域名 A 记录使用的 `76.76.21.21` 服务 IP）
- Cloudflare — [Pages 的自定义域名](https://developers.cloudflare.com/pages/configuration/custom-domains/#:~:text=This%20record%20should%20point%20to%20your%20custom%20Pages%20subdomain)（未由 Cloudflare 管理的域名使用 CNAME 指向 `.pages.dev` 的流程）
- webhosting.today — [AI 智能体现在可以注册域名，无需人工参与](https://webhosting.today/2026/04/22/ai-agents-can-now-register-domains-no-human-required/)（Cloudflare Registrar API Beta 报道：编辑器集成、Beta 限制）
- Model Context Protocol — [modelcontextprotocol.io](https://modelcontextprotocol.io)（协议概览）
