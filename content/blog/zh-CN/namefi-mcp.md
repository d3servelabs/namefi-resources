---
title: "Namefi MCP 服务器：面向 AI 智能体的域名工具"
date: '2026-07-10'
language: 'zh-CN'
tags: ['ai-agents', 'domains', 'web3']
authors: ['namefiteam']
draft: false
format: explainer
ogImage: ../../assets/namefi-mcp-og.jpg
description: "Namefi MCP 服务器向 AI 智能体提供的全部工具：搜索、注册、DNS、续期与代币化，以及认证模型和示例工作流。"
keywords: ["Namefi MCP 服务器", "MCP 工具列表", "Namefi MCP 功能", "MCP 服务器域名管理", "域名注册商 MCP 服务器", "Namefi API 密钥权限范围", "DNS MCP 工具", "通过 MCP 注册域名", "通过 MCP 将域名代币化", "x402 域名付款", "SIWE 域名认证", "EIP-712 域名签名", "域名外联潜在客户挖掘", "Namefi OpenAPI", "AI 智能体域名工具"]
relatedArticles:
  - /zh-CN/blog/claude-mcp-domains/
  - /zh-CN/blog/ai-agent-register/
  - /zh-CN/blog/wallet-checkout/
  - /zh-CN/blog/llms-txt/
  - /zh-CN/blog/mcp-quickstart/
relatedTopics:
  - /zh-CN/topics/domain-tokenization/
  - /zh-CN/topics/web3-foundations/
relatedSeries:
  - /zh-CN/series/blockchain-concepts/
  - /zh-CN/series/tokenize-your-com/
relatedGlossary:
  - /zh-CN/glossary/ai-agent/
  - /zh-CN/glossary/registrar/
  - /zh-CN/glossary/tokenized-domain/
  - /zh-CN/glossary/dnssec/
  - /zh-CN/glossary/ens/
---

每个连接到 Namefi MCP 服务器的 [AI 智能体](/zh-CN/glossary/ai-agent/)都会看到相同的可调用工具列表——API 所定义的每项操作各对应一个工具，涵盖搜索、注册、DNS、域名级配置、外联潜在客户挖掘和付款。本文是一份目录：列出每个工具、其用途、所需认证，以及三个将多个工具组合为实际工作流的完整示例。

如果你还未将智能体连接到 Namefi，请先阅读[《如何在 Namefi 上通过 AI 智能体注册域名》](/zh-CN/blog/ai-agent-register/)了解各客户端的设置方法，或阅读[《使用 Claude 购买域名：Namefi MCP 分步指南》](/zh-CN/blog/claude-mcp-domains/)查看完整对话记录。本文假定连接已经完成。

## 什么是 Namefi MCP 服务器

Namefi 为整个 API 运行一台 MCP 服务器，地址为 `https://api.namefi.io/mcp`，使用 Streamable HTTP 传输。智能体不必根据粘贴到聊天中的文档手工拼装 REST 调用；只需连接一次，就会获得 API 所定义每项操作对应的类型化工具。这些工具直接由 Namefi 自己的 OpenAPI 3 规范 [api.namefi.io/v-next/openapi/doc.json](https://api.namefi.io/v-next/openapi/doc.json)生成，因此 MCP 工具目录与 REST API 不会彼此漂移。

位于 [namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json) 的机器可读发现描述文件，让智能体无需人工手动将 URL 粘贴进配置文件也能找到服务器：它将服务器命名为 `namefi-api`，报告传输方式为 `streamable-http`，并声明使用 `apiKey`/`x-api-key` 进行连接认证。Namefi 是一家[获 ICANN 认证的](/zh-CN/glossary/icann/)[注册商](/zh-CN/glossary/registrar/)，也会在 [namefi.io/llms.txt](https://namefi.io/llms.txt) 将同一批操作作为普通 HTTPS 端点发布，供不使用 MCP 的智能体和脚本调用。

## 完整功能目录

下方列出截至本文撰写时 API 定义的所有操作，并按 Namefi 自身参考文档的分组方式排列。**操作**列是 OpenAPI 规范中的 `operationId`，也是 MCP 客户端工具列表所依据的名称。**认证**列展示最简单的路径（API 密钥几乎能覆盖所有操作）；完整认证模型，包括 API 密钥之外的选择，见下一节。

### 搜索与发现

| 操作 | 端点 | 用途 | 认证 |
| --- | --- | --- | --- |
| `checkAvailability` | `GET /v-next/search/availability` | 检查一个域名是否可供注册 | 无 |
| `checkBulkAvailability` | `GET /v-next/search/bulk-availability` | 在单次调用中筛查一批候选名称 | 无 |
| `getSuggestions` | `GET /v-next/search/suggestions` | 获取与查询相关的算法生成名称建议 | 无 |

### 注册与订单

| 操作 | 端点 | 用途 | 认证 |
| --- | --- | --- | --- |
| `registerDomain` | `POST /v-next/orders/register-domain` | 注册域名 0–10 年。接受 `domainSetupOptions` 对象（`autoPark`、`autoEns`、`autoRenew`、`dnssec`、`keepExistingNameservers`）和可选的 `nftReceivingWallet` | API 密钥 |
| `registerWithRecords` | `POST /v-next/orders/register-domain/records` | 在同一调用中注册域名并应用一组初始 DNS 记录 | API 密钥 |
| `getOrder` | `GET /v-next/orders/{orderId}` | 轮询订单，直至其进入终态：`SUCCEEDED`、`FAILED`、`CANCELLED` 或 `PARTIALLY_COMPLETED` | API 密钥 |

注册是异步的：`registerDomain` 会立即返回订单 `id`，智能体随后轮询 `getOrder`，直至订单完成。[Claude 指南](/zh-CN/blog/claude-mcp-domains/)和[多智能体设置指南](/zh-CN/blog/ai-agent-register/)都以完整对话记录展示了这一模式。

### DNS 记录管理

支持完整 CRUD，可逐条操作或批量处理；此外还有一个完全无需认证的读取操作：

| 操作 | 端点 | 用途 | 认证 |
| --- | --- | --- | --- |
| `getDnsRecords` | `GET /v-next/dns/records` | 列出一个 DNS 区域中的所有记录 | 无 |
| `createDnsRecord` | `POST /v-next/dns/records` | 创建一条记录 | API 密钥 |
| `updateDnsRecord` | `PUT /v-next/dns/record` | 按 ID 更新一条记录 | API 密钥 |
| `deleteDnsRecord` | `DELETE /v-next/dns/record` | 删除一条记录 | API 密钥 |
| `batchCreateDnsRecords` | `POST /v-next/dns/records/batch` | 在一次调用中创建多条记录 | API 密钥 |
| `batchUpdateDnsRecords` | `PUT /v-next/dns/records/batch` | 在一次调用中更新多条记录 | API 密钥 |
| `batchDeleteDnsRecords` | `DELETE /v-next/dns/records/batch` | 在一次调用中删除多条记录 | API 密钥 |

支持的 [记录类型](/zh-CN/glossary/dns-record-types/)包括：A、AAAA、CNAME、MX、TXT、NS、SOA、PTR、SRV、CAA、DS、TLSA、SSHFP、HTTPS、SVCB、NAPTR、SPF。有两条格式规则最容易让初次尝试失败：`zoneName` 末尾不得带点，而 CNAME、MX 和 NS 记录的 `rdata` 值末尾必须带点。

### 域名级开关

这些操作用于整体开启或关闭一项功能，与单条 DNS 记录不同：

| 操作 | 端点 | 用途 | 认证 |
| --- | --- | --- | --- |
| `toggleDomainParking` / `parkDomain` | `PUT` / `POST /v-next/dns/park` | 开启或关闭[域名停放](/zh-CN/glossary/domain-parking/) | API 密钥 |
| `isDomainParked` | `GET /v-next/dns/parked` | 检查域名当前是否处于停放状态 | 无 |
| `toggleForwarding` | `PUT /v-next/dns/forwarding` | 开启或关闭[域名转发](/zh-CN/glossary/domain-forwarding/) | API 密钥 |
| `toggleAutoEns` | `PUT /v-next/dns/auto-ens` | 开启或关闭自动发布 [ENS](/zh-CN/glossary/ens/)记录 | API 密钥 |
| `toggleVercelAnyCastRecords` | `PUT /v-next/dns/vercel-anycast` | 开启或关闭 Vercel Anycast DNS 记录 | API 密钥 |

注意，[DNSSEC](/zh-CN/glossary/dnssec/)并不属于这些开关：它是在注册时通过上方 `registerDomain` 的 `domainSetupOptions` 字段之一设置的，并不是智能体事后调用的独立端点。

### 域名配置

| 操作 | 端点 | 用途 | 认证 |
| --- | --- | --- | --- |
| `getAutoRenew` | `GET /v-next/domain-config/auto-renew` | 检查是否已开启自动续期 | API 密钥 |
| `toggleAutoRenew` | `PUT /v-next/domain-config/auto-renew` | 开启或关闭自动续期 | API 密钥 |

启用[自动续期](/zh-CN/glossary/domain-renewal/)后，域名会在到期前使用所有者钱包中的付款方式自动续期。这是一项应按每个域名审慎决定的持续授权，不应默认在整个域名组合中一律开启。

### 外联潜在客户挖掘

这是最新的功能界面，它将已拥有的域名从静态资产清单转变为销售管道：

| 操作 | 端点 | 用途 | 认证 |
| --- | --- | --- | --- |
| `getUserDomains` | `GET /v-next/user/domains` | 列出已认证钱包拥有的域名 | API 密钥 |
| `startOutboundRun` | `POST /v-next/outbound/runs` | 针对一个已拥有域名启动 AI 潜在客户挖掘任务；`reasoningEffort` 可为 `low`、`medium` 或 `high` | API 密钥 |
| `listOutboundRuns` | `GET /v-next/outbound/runs` | 列出过去和正在进行的任务 | API 密钥 |
| `getOutboundRun` | `GET /v-next/outbound/runs/{runId}` | 轮询任务状态：`QUEUED`、`RUNNING`、`SUCCEEDED`、`FAILED` 或 `CANCELED` | API 密钥 |
| `listOutboundLeads` | `GET /v-next/outbound/runs/{runId}/leads` | 列出排名靠前的买方潜在客户，每个客户附带依据、已发现的联系方式和已有的外联草稿 | API 密钥 |
| `prepareOutboundOutreach` | `POST /v-next/outbound/runs/{runId}/leads/{leadId}/outreach` | 为一位潜在客户生成外联草稿，或无额外生成成本地返回已有草稿 | API 密钥 |

响应不会包含内部排名机制——评分、模型详情和被筛除的潜在客户状态——因此，为人类汇总结果的智能体只能看到公开依据、找到的联系人，以及是否已有草稿。

### 付款与账户

| 操作 | 端点 | 用途 | 认证 |
| --- | --- | --- | --- |
| `getBalance` | `GET /v-next/balance` | 查询为注册提供资金的 NFSC（Namefi Service Credit）余额 | API 密钥 |
| `requestNfscFaucet` | `POST /v-next/user/faucet` | 请求免费的测试 NFSC 额度（仅限开发环境） | API 密钥 |
| `registerDomainX402` | `GET /x402/domain/{domainName}` | 通过一次由钱包签署的稳定币支付授权完成 HTTP 402 流程，无需 Namefi 账户 | 钱包签名 |
| — | `GET /x402/purchase/{purchaseId}` | 轮询 x402 购买的状态 | 无 |
| `registerDomainMPP` | `GET /mpp/domain/{domainName}` | 通过 MPP（Machine Payable Protocol，机器可支付协议）质询—响应流程完成注册和付款 | 钱包签名 |

至此涵盖了搜索、注册、DNS、域名配置、外联和付款范围内的全部操作：每项都可通过单一服务器连接作为 MCP 工具调用；对于不使用 MCP 的智能体，也可作为普通 HTTPS 调用使用。（Namefi 的 API 还提供少数未列入此表的账户管理及 EIP-712/SIWE 辅助操作；完整集合始终以文末所链接的 OpenAPI 规范为准。）

## 认证模型：三条入口路径，背后是同一个钱包

上方的每项写入操作都通过三条路径之一检查同一件事：调用方是否控制着当前拥有或即将拥有该域名的钱包。具体适用哪种路径取决于操作本身，而非一项账户级全局设置。

**API 密钥（`x-api-key`）。**这是最简单的选项，也是本系列每个完整示例使用的方式。可在 [namefi.io/api-key](https://namefi.io/api-key) 生成一个；它可用于上方的每项操作，包括 DNS 写入、停放和注册，因为密钥会继承生成它的钱包的权限。将其作为普通 HTTP 请求头传递即可，无需 SDK。

**EIP-712 类型化数据签名。**若要在不存储密钥的情况下进行程序化使用，可让每个请求由以太坊[钱包](/zh-CN/glossary/wallet/)签名：请求头 `x-namefi-signer`、`x-namefi-signature` 和 `x-namefi-eip712-type` 会将载荷封装为包含时间戳和单次使用 nonce 的信封，nonce 会在 300 秒后过期。这是诸如 `toggleDomainParking`、`createDnsRecord` 和 `registerDomain` 等操作在没有 API 密钥时所要求的模式。域名和类型定义来自实时端点（`GET /v-next/eip712/domain`、`/eip712/types`），而非硬编码常量，因为 Namefi 文档说明它们可能变更。智能合约钱包无法直接签名，因此由获批准的外部拥有账户代表合约签名；`x-namefi-erc1271-account` 或 `x-namefi-eip7702-account` 会指明哪个合约正在授权该请求。

**SIWE（Sign-In with Ethereum）。**这是一种会话令牌（`x-namefi-siwe-token`），用于不需要每次调用都重新签名的受保护读取操作，例如列出已拥有的域名或订单：获取 nonce、取得待签名消息、用 `personal_sign` 签名、验证，然后复用令牌。

少数操作无需认证：`checkAvailability`、`getSuggestions`、`getDnsRecords`、`isDomainParked` 和 EIP-712 元数据端点，因为它们都是只读操作，公开的信息并不超出域名公开 DNS 已能向浏览器展示的内容。

付款叠加在上述认证之上。`registerDomainX402` 通过 [x402 协议](https://x402.org)结算购买：买方钱包为 USDC 等[稳定币](/zh-CN/glossary/stablecoin/)签署 EIP-3009 `transferWithAuthorization`，全程无需 Namefi 账户。`registerDomainMPP` 则通过签名的质询—响应机制达到相同结果。两者都让智能体跳过账户创建，按笔付款；[《使用加密钱包支付域名：无需账户》](/zh-CN/blog/wallet-checkout/)完整介绍了这条路径。

## 代币化贯穿整个目录，而非独立于目录之外

`registerDomain` 会将域名铸造成 [NFT](/zh-CN/glossary/nft/)——即 [ERC-721](/zh-CN/glossary/erc-721/) 代币；这是[大多数市场和钱包已可读取的标准接口](https://eips.ethereum.org/EIPS/eip-721)——默认在 Base 上铸给与调用方 API 密钥关联的钱包。`nftReceivingWallet` 可在注册时将其重定向到不同的钱包或链；后续的一切操作——DNS 写入、停放、自动续期、外联潜在客户挖掘——都检查同一份链上所有权记录，而不是另一套账户数据库。一个在 [OpenSea](https://opensea.io) 等市场交易的[代币化域名](/zh-CN/glossary/tokenized-domain/)，会将其 DNS 控制权和 ERC-721 所有权作为同一个对象携带，而非两套必须手工保持同步的系统。

## 三个智能体，三种使用同一工具集的方式

**构建者在一次对话中注册域名并完成 DNS 配置。**`checkAvailability` 确认名称可用，`registerDomain` 以 `autoRenew` 和 `dnssec` 的 `domainSetupOptions` 设置提交注册；订单到达 `SUCCEEDED` 后，`batchCreateDnsRecords` 写入部署平台验证步骤所等待的 CNAME 和 TXT 记录。[面向编程智能体的 Namefi MCP 快速入门](/zh-CN/blog/mcp-quickstart/)会在编辑器中演示这一序列。

**域名交易者管理一个组合。**`getUserDomains` 拉取当前持有的域名，`checkBulkAvailability` 在单次调用中筛查新的候选名称，`registerDomain` 则购入值得获取的名称。对于正在转售的名称，`toggleDomainParking` 会建立落地页，`isDomainParked` 确认其已上线；对于整个组合，`getAutoRenew` 和 `toggleAutoRenew` 决定哪些名称值得给予持续的续期授权，哪些则足够投机而可以任其到期。

**企业对自己已拥有的域名进行外联潜在客户挖掘。**`getUserDomains` 找到一个未使用的域名，`startOutboundRun` 启动研究，`getOutboundRun` 持续轮询直至达到 `SUCCEEDED`。`listOutboundLeads` 返回按优先级排序的潜在买家企业，其画像显示它们可能需要该名称；`prepareOutboundOutreach` 则为每位潜在客户起草一封邮件——只生成一次，重复调用时免费返回。

## 在让智能体无人值守运行前

Namefi 自己的外联文档将四项操作标注为**影响重大的操作**：`registerDomain`、`registerWithRecords`、`startOutboundRun`、`prepareOutboundOutreach`，因为每一项都会消耗余额或采取外部可见的行动。`checkAvailability` 等只读工具可自主运行而不带风险；任何会写入订单、为正在使用的域名写入 DNS 记录，或生成外联草稿的操作，都值得设置一个确认步骤。[《什么是智能体原生域名注册商？》](/zh-CN/blog/agent-native/)提供了一份更完整的检查清单，可用同样方式评估任何注册商面向智能体的功能界面。

## 让此目录保持最新

此表反映的是截至上述发布日期的 Namefi 实时 OpenAPI 规范，而不是固定路线图：新操作会先出现在 [namefi.io/llms.txt](https://namefi.io/llms.txt) 和 [namefi.io/llms-full.txt](https://namefi.io/llms-full.txt) 中，之后才会出现在任何博客文章的表格里。

## 常见问题

### 我仅仅想检查一个名称是否可用，也需要 API 密钥吗？

不需要。`checkAvailability`、`checkBulkAvailability` 和 `getSuggestions` 都无需认证，因此在刚连接智能体、尚未进行任何充值时也能使用。

### 智能体能否在我从未持有 Namefi API 密钥的情况下使用这整套目录？

可以。`registerDomainX402` 和 `registerDomainMPP` 都能通过钱包签名完成注册，无需 Namefi 账户；EIP-712 签名则直接从钱包覆盖其余写入操作。

### 通过这些任一路径注册域名时，域名都会自动代币化吗？

是的。默认情况下，所有注册路径都会将域名铸造为 ERC-721 NFT 并发送至与调用方 API 密钥关联的钱包，部署在 Base 上；如果未指定 `nftReceivingWallet`，即采用这一默认行为。

### 自主智能体运行哪些操作前应由人确认？

至少应确认 Namefi 文档标注为影响重大的四项操作：`registerDomain`、`registerWithRecords`、`startOutboundRun` 和 `prepareOutboundOutreach`；此外，也应确认任何会在已承载真实流量的域名上写入 DNS 的操作。

## 将你的智能体连接到完整目录

上方所有工具都位于同一条实时连接之后：`https://api.namefi.io/mcp`。若你尚未完成设置，[《如何在 Namefi 上通过 AI 智能体注册域名》](/zh-CN/blog/ai-agent-register/)涵盖六种不同客户端的精确配置，而[《面向域名的 llms.txt》](/zh-CN/blog/llms-txt/)解释了其下方的发现层。

**[生成 Namefi API 密钥](https://namefi.io/api-key)**，然后将智能体指向该服务器——它将发现的正是上方这些工具。

## 来源与延伸阅读

- Namefi — [namefi.io/llms.txt](https://namefi.io/llms.txt)（MCP 服务器 URL、传输方式、认证、核心操作参考——本目录的主要来源）
- Namefi — [namefi.io/llms-full.txt](https://namefi.io/llms-full.txt)（将 Web3 付款和外联潜在客户挖掘内联在内的单文件参考）
- Namefi — [namefi.io/web3/llms.txt](https://namefi.io/web3/llms.txt)（详细介绍 x402、MPP、EIP-712 和 SIWE 流程）
- Namefi — [namefi.io/.well-known/mcp/servers.json](https://namefi.io/.well-known/mcp/servers.json)（MCP 发现描述文件：服务器名称、URL、传输方式、认证类型）
- Namefi — [api.namefi.io/v-next/openapi/doc.json](https://api.namefi.io/v-next/openapi/doc.json)（机器可读的 OpenAPI 3 规范——功能目录中每个 `operationId` 和端点的来源）
- Namefi — [docs.namefi.io：认证](https://docs.namefi.io/docs/02-authentication.mdx#:~:text=The%20Namefi%20API%20supports%20three%20authentication%20methods)（API 密钥、EIP-712 和 SIWE 认证方式；逐操作认证要求；ERC-1271/EIP-7702 委托）
- Namefi — [docs.namefi.io：注册域名](https://docs.namefi.io/docs/03-getting-started/01-your-first-domain.mdx)（注册请求字段、轮询流程、订单状态值）
- Namefi — [docs.namefi.io：管理余额](https://docs.namefi.io/docs/03-getting-started/02-your-balance.mdx)（NFSC 余额和 faucet 端点）
- Model Context Protocol — [什么是 Model Context Protocol？](https://modelcontextprotocol.io/docs/getting-started/intro#:~:text=Think%20of%20MCP%20like%20a%20USB%2DC%20port%20for%20AI%20applications)（协议概览）
- llmstxt.org — [/llms.txt 文件](https://llmstxt.org)（Namefi 文件所遵循发现约定的规范与依据）
- x402.org — [x402 协议](https://x402.org)（`registerDomainX402` 所基于的 HTTP 402 稳定币付款标准）
- Ethereum Improvement Proposals — [ERC-721：非同质化代币标准](https://eips.ethereum.org/EIPS/eip-721)（Namefi 域名 NFT 实现的代币标准）
