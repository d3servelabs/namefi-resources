---
title: "如何在 Namefi 上通过 AI 智能体注册域名"
date: '2026-07-10'
language: 'zh-CN'
tags: ['ai-agents', 'guide']
authors: ['namefiteam']
draft: false
format: guide
ogImage: ../../assets/ai-agent-register-og.jpg
description: "通过 MCP、REST 或钱包结账，使用 Claude、Codex、Cursor 等任意 AI 智能体在 Namefi 注册域名的权威指南。"
keywords: ["AI 智能体注册域名", "Namefi 教程", "Claude 域名注册", "Codex 域名注册", "Cursor MCP 域名", "Windsurf MCP 域名", "Gemini CLI MCP 域名", "智能体域名操作指南", "x-api-key", "MCP 服务器", "钱包结账", "Namefi MCP 域名注册", "AI 智能体在 Namefi 购买域名", "域名注册 MCP 教程"]
relatedArticles:
  - /zh-CN/blog/claude-mcp-domains/
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
  - /zh-CN/glossary/wallet/
  - /zh-CN/glossary/x402/
  - /zh-CN/glossary/tokenized-domain/
---

如果你希望让某个[AI 智能体](/zh-CN/glossary/ai-agent/)——任何 AI 智能体，而非某一家供应商的产品——在 [Namefi](https://namefi.io) 这个经 [ICANN](/zh-CN/glossary/icann/) 认证的[注册商](/zh-CN/glossary/registrar/)为你注册真实域名，这一页值得收藏。本文先讲解无论你在哪个客户端中输入都不会变化的机制，再为当下人们实际使用的六种智能体提供逐项核验过的精确配置步骤：Claude Desktop、Claude Code、OpenAI Codex、Cursor、Windsurf 和 Gemini CLI。若你的智能体不在列表中，文末还提供适用于任何能发出 HTTP 请求的工具的原始 REST 路径；因为 Namefi 的完整 API 接口面正是为此以纯文本形式发布的。

本文由 Namefi 团队撰写并维护，因此每个步骤中与 Namefi 有关的内容均为一手资料：它以人类可读的方式讲解我们为智能体发布在 [namefi.io/llms.txt](https://namefi.io/llms.txt) 和 [docs.namefi.io](https://docs.namefi.io) 的同一套 API。每家智能体供应商的配置都在本文发布日期根据其当时的官方文档完成核验；若供应商文档没有给出明确答案，本文会明确标注，而不会靠猜测补全。

如果你已确定使用 Claude，且希望阅读附有真实对话记录的完整注释式教程，[使用 Claude 购买域名：Namefi MCP 分步指南](/en/blog/claude-mcp-domains/)会比本文压缩版的 Claude 章节更深入。本文是中心页；那篇文章以及文中其他链接则是向外延伸的分支。

## “通过 AI 智能体注册域名”究竟意味着什么

要让智能体代你注册域名、而无需你亲自填写表单，必须同时满足两项条件。第一，智能体需要一种*发现并调用* Namefi API 的方式：可以是让 AI 客户端连接外部工具服务器并查看已定义可调用操作清单的开放标准 [Model Context Protocol](https://modelcontextprotocol.io)（MCP）；若智能体是脚本而不是对话式工具，也可以直接发出 HTTP 请求。第二，智能体需要*支出授权*：一个关联有资金余额的 API 密钥，或一个可当场签署付款的加密[钱包](/zh-CN/glossary/wallet/)。本指南的全部内容都围绕这两部分展开。

Namefi 为整个 API 运行一个 MCP 服务器，地址为 `https://api.namefi.io/mcp`，使用 Streamable HTTP 传输。智能体——或配置它的人——无需读到这一页也能发现它：我们在 [namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json) 发布机器可读的描述文件，其中将服务器命名为 `namefi-api`，并将其传输方式列为 `streamable-http`。下文的每个客户端都连接到同一个 URL；不同之处只在于各客户端的配置文件或命令行如何让你指向它。

## 通用的五步流程

这是下文每个智能体专属章节底层的流程。理解后，各智能体的说明就只是“如何在这一特定工具里完成第 2 步”。

1. **获取凭据。**生成一个 [API 密钥](https://namefi.io/api-key)：它是以 `nfk_` 开头、可用于所有操作的字符串，包括注册、创建 DNS 记录、更新和删除。该密钥继承生成它的钱包的权限，因此应从最终要拥有域名的钱包生成它。若你完全不想持有 Namefi API 密钥，可跳到下方的钱包付款路径——它不需要账户。
2. **将智能体连接到 MCP 服务器。**将客户端指向 `https://api.namefi.io/mcp`，并通过携带密钥的 `x-api-key` 请求头进行认证。具体语法取决于客户端，见下文相应的智能体章节。
3. **搜索并查看价格。**用自然语言询问一个名称是否可用。这会调用完全不需要认证的 `checkAvailability` 操作（`GET /v-next/search/availability?domain=…`），也可调用其批量变体，一次筛查多个候选名称。
4. **注册，然后轮询。**确认后，智能体会提交 `registerDomain`（`POST /v-next/orders/register-domain`）；如果你希望在同一调用中设置 DNS，也可使用组合式的 `register-domain/records` 变体。注册是异步的：请求体包含 `normalizedDomainName` 和 `durationInYears`；`register-domain/records` 端点还接受 `records` 数组（每条记录含 `name`、`type`、`rdata`、`ttl`），以便订单完成后立即写入 DNS。智能体（或你）会轮询 `getOrder`（`GET /v-next/orders/{orderId}`），直到它到达终态：`SUCCEEDED`、`FAILED`、`CANCELLED` 或 `PARTIALLY_COMPLETED`。
5. **配置 DNS 并验证。**通过 `createDnsRecord`（`POST /v-next/dns/records`）添加或调整[DNS 记录类型（A、AAAA、CNAME、MX、TXT）](/zh-CN/glossary/dns-record-types/)，必要时设置[域名服务器（NS 记录）](/zh-CN/glossary/nameserver/)级委派，并在确认域名已解析前，留出几分钟让[DNS 传播](/zh-CN/glossary/dns-propagation/)完成。

注册请求还接受一个 `domainSetupOptions` 对象，用于指定每个域名的覆盖选项：`autoPark`、`autoEns`、`autoRenew`、`dnssec` 和 `keepExistingNameservers`（最后一项会让 Namefi 保留该域名现有的域名服务器委派，而不是重新指向；若注册的域名应立即继续解析到其他位置，这很有用）。可选的 `nftReceivingWallet` 字段用于控制域名所有权代币落入哪个钱包；若省略，域名会以 NFT 形式在 Base 上注册到与你的 API 密钥关联的钱包。

## 各智能体配置对照表

| 智能体 | 连接方式 | 配置所在位置 | 是否支持自定义认证请求头 | 核验依据 |
| --- | --- | --- | --- | --- |
| Claude Code | MCP、Streamable HTTP | `claude mcp add` CLI 命令（写入 `~/.claude.json` 或 `.mcp.json`） | 是，使用 `--header` 标志 | [code.claude.com/docs/en/mcp](https://code.claude.com/docs/en/mcp)，核验于 2026-07-10 |
| Claude Desktop / claude.ai | 通过自定义连接器使用 MCP、Streamable HTTP | 设置 → Connectors → 添加自定义连接器 | 由服务器驱动的认证提示（OAuth、API 密钥或凭据，取决于服务器要求） | [modelcontextprotocol.io](https://modelcontextprotocol.io/docs/develop/connect-remote-servers)，核验于 2026-07-10 |
| OpenAI Codex CLI | MCP、Streamable HTTP | `~/.codex/config.toml`，`[mcp_servers.<name>]` 表 | 是，使用 `http_headers`（静态）或 `env_http_headers`（环境变量） | [learn.chatgpt.com/docs/extend/mcp](https://learn.chatgpt.com/docs/extend/mcp?surface=cli)（`developers.openai.com/codex/mcp` 当前的重定向目标），核验于 2026-07-10 |
| Cursor | MCP、Streamable HTTP | `.cursor/mcp.json`（项目）或 `~/.cursor/mcp.json`（全局） | 是，使用 `headers` 对象，并支持 `${env:VAR}` 插值 | [cursor.com/docs/mcp](https://cursor.com/docs/mcp)，核验于 2026-07-10 |
| Windsurf（Cascade） | MCP、Streamable HTTP | `~/.codeium/windsurf/mcp_config.json` | 是，`serverUrl` 条目中的 `headers` 对象，支持 `${env:VAR}` 插值 | [docs.windsurf.com/windsurf/cascade/mcp](https://docs.windsurf.com/windsurf/cascade/mcp)（在本文发布日期，该 URL 重定向到 `docs.devin.ai/desktop/cascade/mcp`；详见 Windsurf 章节），核验于 2026-07-10 |
| Gemini CLI | MCP、Streamable HTTP | `~/.gemini/settings.json`（用户）或 `.gemini/settings.json`（项目） | 是，`httpUrl` 条目中的 `headers` 对象 | [geminicli.com/docs/tools/mcp-server](https://geminicli.com/docs/tools/mcp-server/)，核验于 2026-07-10 |
| 其他任意 MCP 客户端 | MCP、Streamable HTTP | 该客户端文档规定的任意配置格式 | 取决于客户端；Namefi 服务端保持不变 | [namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json) |
| 任意脚本或非 MCP 智能体 | 原始 REST | 不适用 | 是；每个写入调用都使用 `x-api-key` 请求头 | [namefi.io/llms.txt](https://namefi.io/llms.txt)、[docs.namefi.io](https://docs.namefi.io) |

上表每一行都连接到完全相同的服务器和完全相同的一组操作。不同之处只有：如何告诉特定客户端“这里有一个远程 MCP 服务器，以及应发送的请求头”。

**每次都使用同一条测试提示。**连接下方任一智能体后，运行这条精确提示，以便比较不同客户端的结果：

> “检查 `example.com` 是否可在 Namefi 注册，并告诉我你调用了哪个工具或操作来查询。暂时不要注册任何内容。”

这是只读调用：`checkAvailability` 不需要认证，因此即使在充值前、刚连接完智能体时也可安全运行；它还能立即告诉你连接和工具列表是否正常工作。

## Claude Desktop 和 claude.ai

Claude Desktop 和 claude.ai 通过**自定义连接器**连接远程 MCP 服务器。打开 Settings，进入 Connectors，选择“Add custom connector”，并将 `https://api.namefi.io/mcp` 填为服务器 URL。点击 Add 后，Claude 会提示你完成认证；Anthropic 的文档说明，这一步通常涉及“OAuth、API 密钥或用户名/密码组合”，具体提示由连接的服务器决定。

<!-- TODO：确认——Claude Desktop 的自定义连接器界面为 `x-api-key` 这类请求头提供的确切字段 --> 如果你的 Desktop 配置中没有明显可粘贴密钥的位置，当前已核验可用于写入操作的路径是 Claude Code（下文）；而无需密钥的只读工具，例如可用性搜索，则可通过连接器使用。包括连接后界面流程在内的完整教程请见[使用 Claude 购买域名：Namefi MCP 分步指南](/en/blog/claude-mcp-domains/)。

## Claude Code

Claude Code 的官方文档为带自定义请求头的远程 HTTP MCP 服务器提供了精确的通用添加语法：

```bash
claude mcp add --transport http namefi https://api.namefi.io/mcp --header "x-api-key: YOUR_KEY"
```

在终端运行一次上述命令，并用真实密钥替换其中的占位符。默认情况下，这会以**本地**作用域写入服务器：仅对你在当前项目中的使用生效（旧版 Claude Code 将此作用域称为“project”）。如果希望该连接在机器上的所有项目中可用，添加 `--scope user`；如果希望通过提交的 `.mcp.json` 文件与项目中的所有人共享，添加 `--scope project`。使用 `claude mcp list` 确认连接，并在会话中通过 `/mcp` 查看实时工具数量。

## OpenAI Codex CLI

Codex CLI 将 MCP 配置存储在 TOML 文件中，默认是 `~/.codex/config.toml`（或用于受信任项目的项目级 `.codex/config.toml`）。每个服务器各有一张表，传输方式由出现的键推断：有 `command` 键表示本地 stdio 服务器，有 `url` 键表示 Streamable HTTP。Codex 文档特别指出，表名必须是带下划线的 `mcp_servers`；`mcp-servers` 或类似变体会被静默忽略。

```toml
# ~/.codex/config.toml
[mcp_servers.namefi]
url = "https://api.namefi.io/mcp"
env_http_headers = { "x-api-key" = "NAMEFI_API_KEY" }
```

上述形式从名为 `NAMEFI_API_KEY` 的环境变量读取密钥，而不是将它写入文件；运行 Codex 前请在 shell 中设置该变量。如果宁愿硬编码（不建议在可能提交的文件中这样做），等价的静态形式是 `http_headers = { "x-api-key" = "YOUR_KEY" }`。Codex 还为 `Authorization: Bearer …` 式认证专门记录了 `bearer_token_env_var` 字段；但 Namefi 的 `x-api-key` 请求头需要通用的 `http_headers` / `env_http_headers` 字段，而非 bearer 专用字段。

## Cursor

Cursor 从 `mcp.json` 读取 MCP 服务器定义：项目作用域的副本位于仓库根目录的 `.cursor/mcp.json`，全局副本位于适用于所有位置的 `~/.cursor/mcp.json`。Cursor 文档直接给出了远程服务器的结构，包括基于请求头的认证和环境变量插值，因此密钥本身不必写入文件：

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

`${env:NAMEFI_API_KEY}` 会在连接时解析为该环境变量保存的值。有关同一配置的精简版本，请参阅[Namefi MCP 快速入门：Claude Code、Cursor 与 Windsurf](/en/blog/mcp-quickstart/)。

## Windsurf（Cascade）

Windsurf 的 MCP 集成在产品内称为 **Cascade**，它从 `~/.codeium/windsurf/mcp_config.json` 读取服务器列表。远程 HTTP 服务器使用 `serverUrl` 字段（不是 `command`），并像 Cursor 一样使用 `headers` 对象和 `${env:VAR}` 插值：

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

有一点值得直接说明：在本文发布日期，`docs.windsurf.com/windsurf/cascade/mcp` 会重定向到 `docs.devin.ai/desktop/cascade/mcp`。Windsurf 的文档现已托管在 Cognition 的 Devin 产品文档域名下，页面本身也会同时提及 “Windsurf”“Cascade” 和 “Devin Desktop”。上方配置格式是当前页面所记录的格式；若你使用较旧的 Windsurf 版本，字段名应当一致，但请以该版本应用内帮助链接到的文档 URL 为准进行核对。

## Gemini CLI

Gemini CLI 从 `settings.json` 读取 MCP 服务器：用户级副本位于 `~/.gemini/settings.json`，项目级副本位于仅在该项目内生效的 `.gemini/settings.json`。远程服务器的结构使用 `httpUrl`，而非 `url`：

```json
{
  "mcpServers": {
    "namefi": {
      "httpUrl": "https://api.namefi.io/mcp",
      "headers": {
        "x-api-key": "YOUR_KEY"
      }
    }
  }
}
```

Gemini CLI 文档还记录了 `timeout` 字段（单位为毫秒，默认值为 600,000），可在某次特定工具调用耗时更长时使用；注册轮询通常不需要它，因为客户端只等待每一次单独调用，而不是等待整个轮询循环。

## 其他支持 MCP 的智能体

若你的智能体支持 MCP，但不属于上面列出的六种，服务端无论哪个客户端连接都是相同的：使用 Streamable HTTP 将其指向 `https://api.namefi.io/mcp`，并以 `x-api-key: YOUR_KEY` 作为自定义请求头。具体配置文件或命令语法请查阅该客户端自己的文档；[namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json) 这个发现描述文件存在的目的，正是让智能体（或配置它的人）无需人工粘贴也能找到服务器 URL、传输方式和认证要求。

还有一种值得了解的模式：如果你的客户端只支持**本地（stdio）MCP 服务器**，而不直接支持远程 HTTP 或 SSE，社区包 `mcp-remote` 可将远程 Streamable HTTP 服务器桥接为客户端能正常启动的本地进程，并转发你配置的请求头。由于它是第三方桥接工具，而非 Namefi 发布的路径，本文无法根据 Namefi 自身文档核验它；只有当你的特定客户端确实没有原生远程 HTTP 支持时，才应把它作为后备方案，而非默认方案。<!-- TODO：确认——为不支持原生 Streamable HTTP 的客户端调用 Namefi 时，`mcp-remote` 的精确命令 -->

## 完全不使用 MCP：原始 REST 路径

上文所述的每项操作同时也是普通 HTTPS 端点，在 [namefi.io/llms.txt](https://namefi.io/llms.txt) 中按端点记录，并在 [docs.namefi.io](https://docs.namefi.io) 中完整说明。不支持 MCP、但可发出 HTTP 调用的智能体框架——自定义脚本、其他智能体运行时或 CI 任务——都可直接驱动相同流程：

```bash
# 1. Check availability (no auth required)
curl "https://api.namefi.io/v-next/search/availability?domain=example.com"

# 2. Register (requires x-api-key)
curl -X POST "https://api.namefi.io/v-next/orders/register-domain" \
  -H "x-api-key: YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{"normalizedDomainName": "example.com", "durationInYears": 1}'

# 3. Poll the order until it reaches a terminal status
curl "https://api.namefi.io/v-next/orders/{orderId}" \
  -H "x-api-key: YOUR_KEY"
```

llms.txt 是一种纯文本约定：站点会在根路径发布机器可读的索引，让 AI 智能体无需抓取渲染后的文档页面也能发现 API 的用途。如果你想看完整版本而非压缩摘要，可直接在 [namefi.io/llms.txt](https://namefi.io/llms.txt) 阅读 Namefi 的文件；关于这一约定本身，参阅[llms.txt 与域名：任何 AI 智能体都能读取的 API](/en/blog/llms-txt/)。

## 付款：API 密钥还是钱包结账

上文的所有路径都假定 API 密钥对接到已充值的 NFSC（Namefi Service Credit）余额：你可随时用 `GET /v-next/balance` 检查余额（需要 `x-api-key`），在开发环境通过 faucet 端点充值，或在生产环境通过 Namefi 控制台充值。<!-- TODO：与团队确认——生产环境 NFSC 充值的确切流程：可接受的付款方式，以及能否通过聊天/API 购买，还是只能使用控制台 UI -->

Namefi 还支持通过加密钱包注册域名，并且**完全不需要 Namefi 账户**，方式是 [x402](/zh-CN/glossary/x402/) 协议：智能体的钱包签署一份 EIP-3009 授权；若尚未附上付款，API 会返回列出价格的 HTTP 402；有效的签名付款到达后，注册即完成结算——通常使用像 USDC 这样的[稳定币](/zh-CN/glossary/stablecoin/)。此外，还有相关的 MPP（Machine Payable Protocol）质询—响应变体，以及供不使用上述任一快捷方式的钱包使用的手动 EIP-712 签名路径。该钱包优先路径正适合本文所讨论的智能体：它完全移除了建账户这一步，因此自主流程不必持有——也不会泄露——API 密钥。关于这条路径本身，请参阅[使用加密钱包支付域名：无需账户](/en/blog/wallet-checkout/)。

## 在赋予智能体购买权限前设置的护栏

能够注册域名的智能体也能花钱，并重写线上资产的 DNS。因此，有几项决策值得审慎作出，而不要沿用默认设置：

- **将 API 密钥的权限收窄到最小钱包。**密钥会继承生成它的钱包的权限；应从专门拥有新注册域名的钱包生成，而不要从持有你不希望因智能体密钥暴露而受影响的资产的钱包生成。
- **限制智能体可支出的金额。**NFSC 余额本身就是支出上限：与其保留一大笔长期余额，不如只充值你能接受由智能体在无人值守时使用的金额。
- **决定人工在哪一步保留在流程中。**可用性搜索等只读操作不需要认证，也没有风险；一旦调用提交 `registerDomain`、切换自动续期，或向正在承载流量的域名写入 DNS 记录，就应要求明确确认，而不让智能体自主继续。
- **确认前审查 DNS 写入，**就像审查任何基础设施变更一样。Namefi 的验证会拒绝格式不正确的记录，而不会悄悄接受它们（见下方故障排查表）；但验证只能捕获格式错误，无法捕获语法正确但值本身错误的记录。

[什么是智能体原生域名注册商？](/en/blog/agent-native/)为评估任一注册商的面向智能体能力（包括 Namefi）提供了更完整的检查清单：可发现性、机器可读的错误信息，以及不假定人类持有信用卡的付款路径。

## 故障排查

| 症状 | 可能原因 | 解决方法 |
| --- | --- | --- |
| 任意写入调用返回 `401 UNAUTHORIZED` | API 密钥无效、已过期，或由不拥有目标域名的钱包生成 | 在 [namefi.io/api-key](https://namefi.io/api-key) 用拥有（或将拥有）该域名的钱包生成新密钥 |
| `403 FORBIDDEN` | 密钥有效，但其钱包并不拥有该特定域名 | 重试前检查所有权 |
| Codex 忽略你的 `[mcp_servers.namefi]` 条目 | 表名拼写错误；Codex 要求使用带下划线的 `mcp_servers`，而不是 `mcp-servers` | 修正 `config.toml` 中的表头 |
| Cursor 或 Windsurf 将服务器显示为已断开 | `headers` 对象格式错误，或 `${env:VAR}` 引用了未设置的变量 | 检查 JSON 是否有效，并确认引用的环境变量确实已导出到启动编辑器的 shell 中 |
| Gemini CLI 找不到配置 | 编辑了错误的 `settings.json`；用户级和项目级文件彼此独立 | 确认你想使用的是 `~/.gemini/settings.json`，还是当前项目中的 `.gemini/settings.json` |
| 注册订单停留在非终态 | 正常情况；注册是异步的 | 继续轮询 `getOrder`；只有它始终未达到 `SUCCEEDED`、`FAILED`、`CANCELLED` 或 `PARTIALLY_COMPLETED` 时，才应视为卡住 |
| 创建或更新 DNS 记录时被验证错误拒绝 | `zoneName` 末尾有点号，或 CNAME/MX/NS 的 `rdata` 值缺少必需的末尾点号 | `zoneName` 不带末尾点号；FQDN 类型的 `rdata` 必须带末尾点号 |
| 注册直接失败 | 付款钱包的 NFSC 余额不足 | 检查 `GET /v-next/balance`；通过 faucet（开发环境）或控制台（生产环境）充值 |
| 智能体提示没有可用的域名工具 | MCP 服务器未连接，或连接时没有包含写入操作所需的请求头 | 重新检查客户端配置文件，或带上请求头重新运行其“添加服务器”命令 |

## 常见问题

### 我需要选定一个智能体并一直使用它吗？
不需要。无论哪个客户端连接，MCP 服务器和每个 REST 端点都相同：今天可以用 Claude Code 配置，明天可以用 Cursor，并继续使用同一 API 密钥和同一 NFSC 余额，无需迁移步骤。

### 这些智能体中，哪个最适合注册域名？
对于这项任务，它们之间没有实质的能力差异，因为每个客户端调用的都是相同的服务端操作。差异完全在于各客户端自己的 MCP 配置语法；这正是本文为每种客户端设置独立章节并提供相同测试提示的原因——每个客户端各运行一次，再自行比较对话记录。

### 如果我的智能体完全不支持 MCP，怎么办？
使用上面的原始 REST 路径。MCP 工具调用所能访问的每项操作也都是已文档化的 HTTPS 端点；而 `namefi.io/llms.txt` 专为让智能体（或配置它的人）无需浏览器即可读取的纯文本入口而设计。

### 我以这种方式注册时，域名会自动代币化吗？
会，默认如此。如果未在注册请求中指定 `nftReceivingWallet`，域名会作为 NFT 在 Base 上注册到与你的 API 密钥关联的钱包。注册时可以将其重定向到其他钱包。

### 智能体能否在我完全不持有 API 密钥的情况下注册域名？
可以。钱包签名的 x402 结账路径不需要 Namefi 账户或 API 密钥，只需要一个已充值的钱包。上文付款章节概述了该流程；完整教程请见[使用加密钱包支付域名：无需账户](/en/blog/wallet-checkout/)。

### 通过智能体注册会比通过 Namefi 网站注册更贵吗？
本文不主张两者在价格上存在差异。<!-- TODO：与团队确认——Namefi 的 MCP/API 定价是否与标准域名注册定价一致，还是不同 -->无论如何，请求来自浏览器、脚本还是智能体工具调用，都会从同一 NFSC 余额中扣除。

## 从你已打开的任一智能体开始

使用本指南并不需要安装六个客户端：你只需要其中一个，再加上 Namefi API 密钥或已充值的钱包。选择上文中与你当前正在使用的工具相匹配的章节，完成配置并尝试测试提示。之后，本页其余流程——搜索、注册、配置 DNS——都会在同一段对话中完成。

**[生成 Namefi API 密钥](https://namefi.io/api-key)**，或进一步阅读[包含完整对话记录的 Claude 教程](/en/blog/claude-mcp-domains/)和[智能体原生注册商的横向比较](/en/blog/cf-namecom-namefi/)。如需了解本指南底层的组成部分，请参阅[Namefi MCP 服务器：面向 AI 智能体的域名工具](/en/blog/namefi-mcp/)、[Namefi MCP 快速入门：Claude Code、Cursor 与 Windsurf](/en/blog/mcp-quickstart/)、[使用加密钱包支付域名：无需账户](/en/blog/wallet-checkout/)以及[llms.txt 与域名：任何 AI 智能体都能读取的 API](/en/blog/llms-txt/)。

## 来源与延伸阅读

- Namefi — [namefi.io/llms.txt](https://namefi.io/llms.txt)（MCP 服务器 URL、传输、认证、注册/DNS 端点参考、`domainSetupOptions` 字段；本文所有 Namefi 相关主张的一手来源）
- Namefi — [namefi.io/web3/llms.txt](https://namefi.io/web3/llms.txt)（x402、MPP 和 EIP-712 钱包付款流程）
- Namefi — [namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json)（MCP 发现描述文件：服务器名称、URL、传输方式、认证类型）
- Namefi — [docs.namefi.io：认证](https://docs.namefi.io/docs/02-authentication.mdx)（API 密钥、EIP-712 和 SIWE 认证模式；每项操作的认证要求）
- Namefi — [docs.namefi.io：注册域名](https://docs.namefi.io/docs/03-getting-started/01-your-first-domain.mdx)（注册请求字段、轮询流程、订单状态值）
- Namefi — [docs.namefi.io：管理余额](https://docs.namefi.io/docs/03-getting-started/02-your-balance.mdx)（NFSC 余额和 faucet 端点）
- Anthropic / Claude Code — [通过 MCP 将 Claude Code 连接到工具](https://code.claude.com/docs/en/mcp#:~:text=claude%20mcp%20add%20%2D%2Dtransport%20http)（`claude mcp add --transport http` 语法、`--header`、`--scope` 标志）
- Model Context Protocol — [连接远程 MCP 服务器](https://modelcontextprotocol.io/docs/develop/connect-remote-servers#:~:text=Most%20remote%20MCP%20servers%20require%20authentication)（Claude Desktop / claude.ai 自定义连接器流程）
- OpenAI — [learn.chatgpt.com：Model Context Protocol（Codex CLI）](https://learn.chatgpt.com/docs/extend/mcp?surface=cli)（`config.toml` 的 `[mcp_servers.<name>]` 表、`url`、`http_headers`、`env_http_headers`、`bearer_token_env_var` 字段）
- Cursor — [cursor.com/docs/mcp](https://cursor.com/docs/mcp)（`mcp.json` 远程服务器格式、`headers`、`${env:VAR}` 插值、项目与全局配置位置）
- Windsurf / Cascade — [docs.windsurf.com/windsurf/cascade/mcp](https://docs.windsurf.com/windsurf/cascade/mcp)（在本文发布日期会重定向到 [docs.devin.ai/desktop/cascade/mcp](https://docs.devin.ai/desktop/cascade/mcp)；`mcp_config.json` 格式、`serverUrl`、`headers`）
- Google — [geminicli.com：Gemini CLI 的 MCP 服务器](https://geminicli.com/docs/tools/mcp-server/)（`settings.json` 格式、`httpUrl`、`headers`、`timeout`）
- llmstxt.org — [/llms.txt 文件](https://llmstxt.org)（`namefi.io/llms.txt` 所遵循的发现约定及其理由）
