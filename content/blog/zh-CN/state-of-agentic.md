---
title: "2026 年智能体域名管理现状"
date: '2026-07-10'
language: 'zh-CN'
tags: ['ai-agents', 'domains', 'analysis']
authors: ['fenwei-bian']
editors: ['victor-zhou']
draft: false
format: analysis
ogImage: ../../assets/state-of-agentic-og.jpg
description: "域名注册正在转向智能体层：基于来源的时间线、涵盖 Namefi 的已交付与已宣布审计，以及可证伪的 2027 年预测。"
keywords: ["智能体域名管理现状", "2026 年智能体域名管理", "AI 域名行业趋势", "域名行业采用 AI", "智能体层时间线", "2027 年域名注册商预测", "MCP 域名注册采用情况", "2026 年 .ai 域名注册量", "Cloudflare Registrar API beta", "Name.com AI 原生 API", "域名智能体经销商论点", "Verisign 域名行业简报", "DNS 锚定身份 AI 智能体"]
relatedArticles:
  - /zh-CN/blog/agents-buy-domains/
  - /zh-CN/blog/cf-namecom-namefi/
  - /zh-CN/blog/ai-domain-platforms/
  - /zh-CN/blog/agent-native/
  - /zh-CN/blog/ai-agent-register/
relatedTopics:
  - /zh-CN/topics/domain-basics/
  - /zh-CN/topics/web3-foundations/
relatedSeries:
  - /zh-CN/series/blockchain-concepts/
  - /zh-CN/series/domain-apocalypse/
relatedGlossary:
  - /zh-CN/glossary/ai-agent/
  - /zh-CN/glossary/epp/
  - /zh-CN/glossary/registrar/
  - /zh-CN/glossary/registry/
  - /zh-CN/glossary/reseller/
---

2026 年过半后，“AI 智能体将改变域名注册方式”这件事已可以依据实际事件来核验，而不再只是预测。其中一部分发生在具体且可验证的日期；另一部分仍只是 beta 标签、定位文章，或躺在标准制定机构队列中的草案。本文将这两类情况分开看待：一条说明何事推动域名注册走向[智能体层](/zh-CN/blog/agents-buy-domains/)的、有来源可查的时间线；一份如实审计实际已交付与仅已宣布内容的清单（包括 Namefi，也包括所有缺口）；行业媒体中流传的“智能体作为经销商”论点；以及一组对 2027 年的预测，读者无需依赖我们的解读即可判定其为真或假。

## 采用数据，以及它们实际来自何处

今年“AI 与域名”报道中有两个数字被不断引用，但它们应获得不同程度的信任。

第一个是 Name.com 自己声称，其[“91% 的受访者预期，在未来两年中 AI 智能体将处理至少一部分域名管理工作”](https://www.name.com/blog/the-first-ai-native-domain-platform#:~:text=a%20remarkable%2091%25%20of%20respondents%20envision%20AI%20agents%20handling%20at%20least%20some%20of%20their%20domain%20management%20in%20the%20next%20two%20years)。该公司于 **2025 年 7 月 10 日**发布的一篇博客文章提出了这一说法。Name.com 将该数字归因于“我们最近的客户调查”，但没有公布样本量、方法论或独立验证。应如实看待它：**Name.com 报告**其自行调查的客户这样表示——这是公司自行报告的受访者意向，不是独立的行业统计数据。

第二个数字可验证，且得到独立佐证。**2026 年 1 月 28 日**，安圭拉政府宣布 `.ai` [ccTLD（国家代码顶级域名）](/zh-CN/glossary/cctld/)的注册域名已超过 100 万；[Domain Name Wire 直接报道了这一里程碑](https://domainnamewire.com/2026/01/28/ai-namespace-hits-1-million-domain-names/)：2025 年初约有 598,000 个 `.ai` 域名，约 13 个月后突破 100 万；而从 2020 年约 40,000 个注册量的基数增长至此，历时五年。CircleID 对域名行业的报道独立引用了同一里程碑，Hogan Lovells 关于 `.ai` 的行业说明也证实了该走势——这是多方交叉确认的数据，并非单一主体的自报数字。

若与整体域名市场相比：Verisign 的 2026 年第一季度[《域名行业简报》](https://www.dnib.com)报告称，所有 TLD 的域名注册量为 3.925 亿，环比增长 1.4%、同比增长 6.5%；[CircleID 对该报告的报道](https://circleid.com/posts/dnib-reports-392.5-million-domain-name-registrations-in-q1-2026#:~:text=The%20first%20quarter%20of%202026%20closed%20with%20392.5%20million%20domain%20name%20registrations%20across%20all%20top-level%20domains%20%28TLDs%29)直接引用了该数字。`.ai` 约 100 万个注册量只是这 3.925 亿中的一个小而快速增长的部分——势头确实存在，但尚未占到足以重塑市场的份额。DNIB 和 Identity Digital 的公开材料都没有拆分有多少注册是通过智能体而非浏览器结账流入的；这正是本文其余部分要绕开的信息缺口：我们可以核验面向智能体的基础设施*是否*推出、以及大致何时推出，但尚不能核验有*多少*交易量经由它流动。

## 时间线：转向智能体层

以下每个日期均根据一手公告、官方文档或直接获取的行业媒体报道核验，而非引用无来源数字的二次聚合内容。

| 日期 | 事件 | 来源 |
| --- | --- | --- |
| 2004-03 | [EPP](/zh-CN/glossary/epp/)（可扩展配置协议）——注册商至今仍用它与注册局进行机器对机器通信——达到 Proposed Standard（建议标准）状态 | [RFC 3730–3734，发布于 2004 年 3 月](https://en.wikipedia.org/wiki/Extensible_Provisioning_Protocol#:~:text=Proposed%20Standard%20documents%20%28RFCs%203730%20-%203734%29%20were%20published%20by%20the%20RFC%20Editor%20in%20March%202004) |
| 2024-09-03 | 发布 `/llms.txt` 文件提案，为网站提供一种标准方式，使其可在推理时向语言模型描述自身 | [llmstxt.org，由 Jeremy Howard 发布](https://llmstxt.org/#:~:text=A%20proposal%20to%20standardise%20on%20using%20an%20/llms.txt%20file%20to%20provide%20information%20to%20help%20LLMs%20use%20a%20website%20at%20inference%20time) |
| 2024-11-25 | Anthropic 发布[模型上下文协议](https://modelcontextprotocol.io)（Model Context Protocol），一项用于将 AI 应用连接至外部工具服务器的开放标准 | [Anthropic 的 MCP 公告](https://www.anthropic.com/news/model-context-protocol) |
| 2025-07-10 | Name.com 发布其“首个 AI 原生域名平台”定位文章，基于 MCP 与 OpenAPI，包含上述自报的 91% 数据 | [Name.com 博客](https://www.name.com/blog/the-first-ai-native-domain-platform#:~:text=the%20launch%20of%20the%20new%20name.com%20API%2C%20our%20AI-native%20platform%20that%20modernizes%20domains%20for%20the%20age%20of%20agentic%20AI) |
| 2026-01-28 | 根据安圭拉政府公告，`.ai` 注册域名突破 100 万 | [Domain Name Wire](https://domainnamewire.com/2026/01/28/ai-namespace-hits-1-million-domain-names/) |
| 2026-04-15 | Cloudflare 在“Agents Week”期间将 Registrar API 以公开 beta 形式推出，将注册、搜索和定价接入 MCP 层 | [Cloudflare 的 Registrar API beta 公告](https://blog.cloudflare.com/registrar-api-beta/)；[行业报道](https://webhosting.today/2026/04/22/ai-agents-can-now-register-domains-no-human-required/#:~:text=On%20April%2015%2C%202026%2C%20Cloudflare%20moved%20that%20transaction%20into%20the%20agent%20layer) |
| 2026-04-20 | CircleID 发布关于“智能体作为域名经销商”的分析 | [CircleID，Simone Catania](https://circleid.com/posts/the-domain-universe-in-2026-ai-security-market-maturity-and-the-new-gtld-frontier#:~:text=AI%20agents%20are%20increasingly%20acting%20as%20domain%20resellers%20checking%20availability%2C%20registering%20names%2C%20and%20configuring%20DNS%20without%20human%20intervention) |
| 2026-04-24 | Verisign 的 2026 年第一季度《域名行业简报》报告域名注册总量为 3.925 亿，为上列各项提供全市场背景 | [DNIB.com](https://www.dnib.com)；[CircleID 报道](https://circleid.com/posts/dnib-reports-392.5-million-domain-name-registrations-in-q1-2026#:~:text=The%20first%20quarter%20of%202026%20closed%20with%20392.5%20million%20domain%20name%20registrations%20across%20all%20top-level%20domains%20%28TLDs%29) |
| 2026-04-27 | Identity Digital——`.ai` 注册局及 [Name.com](https://www.name.com) 的母公司——推出“面向 AI 智能体的中立、DNS 锚定身份标准”，提议使用 DNS 记录承载智能体责任主体信息 | [Identity Digital 新闻中心](https://www.globenewswire.com/news-release/2026/04/27/3281553/0/en/identity-digital-launches-neutral-dns-anchored-durable-identity-standard-for-ai-agents.html) |
| 2026-06-04 | Identity Digital 的 Innovation Labs 将该提案正式形成 IETF Internet-Draft（互联网草案）——“面向 AI 智能体的 DNS 锚定持久身份（DNSid）” | [GlobeNewswire](https://www.globenewswire.com/news-release/2026/06/04/3306702/0/en/innovation-labs-by-identity-digital-submits-dns-anchored-durable-identity-proposal-for-ai-agents-to-the-ietf.html#:~:text=Which%20accountable%20entity%20is%20responsible%20for%20this%20agent%2C%20and%20can%20that%20be%20verified%20independently%20across%20systems)；[IETF Datatracker 草案](https://datatracker.ietf.org/doc/draft-ihsanullah-dnsid/) |

按顺序阅读，脉络如下：先是已有二十年历史的配置协议；随后是两个根本不是为域名打造的通用 AI 智能体标准（llms.txt、MCP）；接着，注册商逐个将这些标准改造用于结账流程；最后，同一注册局集团（Identity Digital）越过自有注册商，提出将 DNS 作为智能体*身份*而非仅仅智能体*购买*的基础设施。最后一步最新、也最未尘埃落定：Internet-Draft 是提交供讨论的提案，不是已获批准的标准。

## 实际已交付的内容与已宣布的内容

“智能体原生”在营销文案中被宽泛使用。下表列出各参与者实际交付了什么——均根据各平台自己的在线文档核验——以及哪些仍是 beta 标签、定位主张，或没有运行代码支撑的标准轨道提案。

| 平台 | 能力 | 状态 | 证据 |
| --- | --- | --- | --- |
| Namefi | MCP 服务器（`api.namefi.io/mcp`、Streamable HTTP，可在 `/.well-known/mcp/servers.json` 发现） | **已交付** | [namefi.io/llms.txt](https://namefi.io/llms.txt) |
| Namefi | 通过 [x402](/zh-CN/glossary/x402/) 的钱包签名 USDC 结账（EIP-3009 `transferWithAuthorization`，无需账户） | **已交付** | [namefi.io/web3/llms.txt](https://namefi.io/web3/llms.txt) |
| Namefi | 基于 `llms.txt` 的智能体工具与 REST 参考发现机制 | **已交付** | [namefi.io/llms.txt](https://namefi.io/llms.txt) |
| Namefi | API 层的支出上限或购买确认原语 | **未交付**——截至撰文时没有已记录的门控；护栏目前位于 MCP 客户端，而非服务器 | 本文直接依据 `namefi.io/llms.txt` 与 `namefi.io/web3/llms.txt` 交叉核对的[智能体原生检查清单分析](/zh-CN/blog/agent-native/) |
| Cloudflare | Registrar API：搜索、可用性查询、价格查询、同步注册 | 自 2026-04-15 起**已交付，处于公开 beta** | [Cloudflare Registrar API beta 公告](https://blog.cloudflare.com/registrar-api-beta/) |
| Cloudflare | 通过同一 API 管理 DNS 记录、转移、续期、联系人更新 | **已宣布，开发中**——Cloudflare 自己的文章称其“正在积极扩展 API，以覆盖更多核心 Registrar 功能”，目标是在 2026 年晚些时候推出 | [Cloudflare Registrar API beta 公告](https://blog.cloudflare.com/registrar-api-beta/) |
| Name.com | AI 原生、MCP 与 OpenAPI 的定位，以及从自然语言到集成代码的叙事 | **已宣布**——是一篇定位文章，而非逐项能力规范 | [Name.com 博客](https://www.name.com/blog/the-first-ai-native-domain-platform) |
| Name.com | 在域名根路径直接检查的、可发现的 `llms.txt` 或专用 MCP 服务器 | 截至审查时**未找到** | 直接检查 `name.com`，并参照[Cloudflare、Name.com 与 Namefi 对比](/zh-CN/blog/cf-namecom-namefi/) |
| Identity Digital | DNSid：面向 AI 智能体、以 DNS 锚定且可通过密码学验证的责任主体记录 | **提议中**——为讨论而提交的 IETF Internet-Draft，不是已批准标准，也未集成到任何在线注册商结账流程 | [IETF Datatracker：draft-ihsanullah-dnsid](https://datatracker.ietf.org/doc/draft-ihsanullah-dnsid/) |

该表包含两项结论。第一，我们检查的平台中没有一家——包括 Namefi——已交付有文档记录、由 API 强制执行的支出上限；所有护栏都位于更上一层，即由人类在客户端设定的策略中，这与我们的[智能体原生检查清单](/zh-CN/blog/agent-native/)对该类别评分的结论一致。第二，DNS 作为智能体自身的身份锚点，而不仅是其所购域名的锚点，仍停留在“已提交 IETF 讨论”阶段；即使获得良好反馈，距离注册商能将其接入在线结账流程仍有数月之遥。

## 经销商论点

2026 年域名行业报道中反复出现的一句话是：AI 智能体正在成为*经销商*。CircleID 在 2026 年 4 月 20 日的分析中直言不讳：[“AI 智能体越来越多地充当域名经销商，查询可用性、注册域名并配置 DNS，而无需人工干预。”](https://circleid.com/posts/the-domain-universe-in-2026-ai-security-market-maturity-and-the-new-gtld-frontier#:~:text=AI%20agents%20are%20increasingly%20acting%20as%20domain%20resellers%20checking%20availability%2C%20registering%20names%2C%20and%20configuring%20DNS%20without%20human%20intervention)

这一用词应与其隐含的含义区分开来。在域名行业自身的术语中，[经销商](/zh-CN/glossary/reseller/)是一个具体且正式的主体：它依据注册商的 [ICANN](/zh-CN/glossary/icann/)认证协议出售或配置域名，对注册商负有合同义务，并因此间接对 ICANN 负有义务。如今，智能体调用注册 API 并不会建立这种关系——智能体是终端客户的受托代理，以客户自身的 API 密钥或钱包进行认证，而不是自行成为已获认证的主体。CircleID 的表述是描述性的，并非对认证状态的主张：经销商的*行为模式*——为他人以规模化方式反复搜索、定价、注册、配置 DNS——如今已出现在智能体工作流中，尽管其运营者并不是一家签署经销商协议的公司。

这种行为是否会凝结为注册局正式承认的某种类别或机制，仍是一个悬而未决的问题。这将要求注册局和注册商决定：高交易量且受策略约束的智能体活动是否需要独立于人工经销商的认证层级、限速策略或滥用监控类别。上述时间线中的内容——Cloudflare 的 beta、Name.com 的文章、Identity Digital 的 DNSid 草案——都尚未提出这样的层级。DNSid 是最接近的一项，因为它明确针对核验谁要为智能体行为负责；但“谁负责”和“是否已正式获认证成为经销商”是两个不同问题，草案只回答前者。若想了解单次购买的操作机制，请参阅[AI 智能体如何无需人工购买域名](/zh-CN/blog/agents-buy-domains/)。

## 2027 年预测

以下每项预测都写成可依据公开证据核验的具体主张，而非泛泛的判断。因此，读者在 2027 年年中回看时，无需由我们解释即可将其标为真、假或未决。

1. 到 2027 年 7 月，**Cloudflare、Name.com 或可比的主流注册商中至少一家，会发布有文档记录、由 API 强制执行的支出上限或购买确认原语**（而非仅提供客户端指引）。截至撰文时，我们检查的每个平台——包括 Namefi——在这一项上都是空白。
2. 到 2027 年底，**Cloudflare 的 Registrar API 将移除“beta”标签，并交付 DNS 记录管理、续期自动化或转移支持中的至少一项**——与其 beta 公告中“2026 年晚些时候”的表述相符，并额外留出一年缓冲时间。
3. 到 2027 年 7 月，**DNSid Internet-Draft（或直接处理“谁要为这名智能体负责”的后继文档）仍将处于 IETF 草案状态，而不是获批准的 RFC**——标准轨道文档从提交到完成通常需要数年，而这份草案是在 2026 年 6 月提交的。
4. 到 2027 年 7 月，**`.ai` 注册量将超过 150 万**，延续 Domain Name Wire 与 Identity Digital 所记录的增长曲线，而非在 2026 年 1 月达到约 100 万的水平附近停滞。
5. 至少一个本文比较的平台会在自身的营销或文档中公开使用“reseller”或“agent-reseller”一词来描述智能体驱动的注册活动，将 CircleID 在 2026 年 4 月采用的框架正式化，而不再仅将其保留为行业媒体语言。

## 常见问题

### 目前实际上有多少域名由 AI 智能体注册？

我们审查的注册局或注册商——DNIB、Identity Digital、Cloudflare、Name.com——都没有公布将智能体发起的注册与人工发起的注册分开的数据。可以核验的是基础设施：哪些平台交付了智能体可调用的注册路径（Namefi、处于 beta 的 Cloudflare、以及在定位层面如此宣称的 Name.com），以及它们何时交付。可归因于智能体的采用量截至撰文时并非公开数据。

### Name.com 的 91% 统计数据是可靠的行业数字吗？

应将其视为公司报告的情绪，而非独立调查。Name.com 在 2025 年 7 月的文章将该数字归因于“我们最近的客户调查”，却没有公布方法论、样本量或外部审计方——它反映的是 Name.com 的客户向该公司所表达的内容，而不是可引用的全市场统计数据。

### `.ai` 确实达到 100 万注册量了吗？由谁确认？

是的，且有独立佐证。负责管理 `.ai` [ccTLD（国家代码顶级域名）](/zh-CN/glossary/cctld/)的安圭拉政府直接宣布了该里程碑，Domain Name Wire 也以具体日期（2026 年 1 月 28 日）报道了增长数据。CircleID 和 Hogan Lovells 的一篇行业说明均独立引用同一里程碑——其证据标准不同于公司自行报告的统计数据。

### DNSid 是什么？它会改变域名的注册方式吗？

DNSid 是由 Identity Digital 的 Innovation Labs 于 2026 年 6 月向 IETF 提交的 Internet-Draft——即一份正式提案，而非已批准标准。它提出用 DNS 记录保存一项持久、可验证的“谁要为这名 AI 智能体负责”的记录；这是不同于注册本身的问题：识别智能体，而非购买域名。截至撰文时，它尚未集成到任何在线注册商结账流程。

### 是否有注册商实际交付了支出上限或“不要让智能体超支”的控制？

据我们直接检查各平台文档所能核验的情况，在 API 层还没有。Namefi、Cloudflare 和 Name.com 都将这项护栏留给人类在客户端设置的策略——MCP 客户端、智能体框架、API 密钥的资金限额——而不是由注册商自身强制执行的确认门控。这是这一领域中每份“智能体原生”记分卡（包括我们的）仍标为未完成的那一项。

### 我可以到哪里了解单次智能体购买的操作机制，而非行业全貌？

[AI 智能体如何无需人工购买域名](/zh-CN/blog/agents-buy-domains/)会逐步讲解搜索、定价、认证、注册和配置的流程。[Cloudflare、Name.com 与 Namefi 对比](/zh-CN/blog/cf-namecom-namefi/)逐项比较三个平台，而[什么是智能体原生域名注册商？](/zh-CN/blog/agent-native/)则列出了本文已交付与已宣布对照表背后的检查清单。

## 使用已提供完整技术栈的智能体完成注册

本文记录的大多数缺口——未记录的支出上限、beta 标签、没有逐项规范的定位文章——并非某一个平台独有；它们反映了该类别在 2026 年年中的位置。[Namefi](https://namefi.io)已经交付当下可用的能力：智能体可直接连接的 MCP 服务器、可通过 `llms.txt` 发现的 REST API，以及无需账户、以 USDC 进行钱包签名的 [x402](/zh-CN/glossary/x402/)结账；如果你希望域名存放在智能体的钱包中，还可选择[代币化域名](/zh-CN/glossary/tokenized-domain/)所有权。

**[在 Namefi 搜索并注册域名](https://namefi.io)。**

## 来源与延伸阅读

- Domain Name Wire — [.AI 命名空间达到 100 万个域名（2026 年 1 月 28 日）](https://domainnamewire.com/2026/01/28/ai-namespace-hits-1-million-domain-names/)
- CircleID — [2026 年的域名世界：AI、安全、市场成熟度与新 gTLD 前沿（2026 年 4 月 20 日）](https://circleid.com/posts/the-domain-universe-in-2026-ai-security-market-maturity-and-the-new-gtld-frontier#:~:text=AI%20agents%20are%20increasingly%20acting%20as%20domain%20resellers%20checking%20availability%2C%20registering%20names%2C%20and%20configuring%20DNS%20without%20human%20intervention)
- CircleID — [DNIB 报告：2026 年第一季度域名注册量达 3.925 亿](https://circleid.com/posts/dnib-reports-392.5-million-domain-name-registrations-in-q1-2026#:~:text=The%20first%20quarter%20of%202026%20closed%20with%20392.5%20million%20domain%20name%20registrations%20across%20all%20top-level%20domains%20%28TLDs%29)
- Verisign / DNIB.com — [域名行业简报](https://www.dnib.com)
- Cloudflare — [Registrar API beta 公告（2026 年 4 月 15 日）](https://blog.cloudflare.com/registrar-api-beta/)
- webhosting.today — [AI 智能体现在可以注册域名，无需人工](https://webhosting.today/2026/04/22/ai-agents-can-now-register-domains-no-human-required/#:~:text=On%20April%2015%2C%202026%2C%20Cloudflare%20moved%20that%20transaction%20into%20the%20agent%20layer)
- Name.com — [首个 AI 原生域名平台（2025 年 7 月 10 日）](https://www.name.com/blog/the-first-ai-native-domain-platform#:~:text=a%20remarkable%2091%25%20of%20respondents%20envision%20AI%20agents%20handling%20at%20least%20some%20of%20their%20domain%20management%20in%20the%20next%20two%20years)
- Identity Digital — [Identity Digital 为 AI 智能体推出中立、DNS 锚定的身份标准（2026 年 4 月 27 日）](https://www.globenewswire.com/news-release/2026/04/27/3281553/0/en/identity-digital-launches-neutral-dns-anchored-identity-standard-for-ai-agents.html)
- Identity Digital / GlobeNewswire — [Identity Digital 的 Innovation Labs 向 IETF 提交面向 AI 智能体的 DNS 锚定持久身份提案（2026 年 6 月 4 日）](https://www.globenewswire.com/news-release/2026/06/04/3306702/0/en/innovation-labs-by-identity-digital-submits-dns-anchored-durable-identity-proposal-for-ai-agents-to-the-ietf.html#:~:text=Which%20accountable%20entity%20is%20responsible%20for%20this%20agent%2C%20and%20can%20that%20be%20verified%20independently%20across%20systems)
- IETF Datatracker — [draft-ihsanullah-dnsid：面向 AI 智能体的 DNS 锚定持久身份](https://datatracker.ietf.org/doc/draft-ihsanullah-dnsid/)
- llmstxt.org — [/llms.txt 文件提案（发布于 2024 年 9 月 3 日）](https://llmstxt.org/#:~:text=A%20proposal%20to%20standardise%20on%20using%20an%20/llms.txt%20file%20to%20provide%20information%20to%20help%20LLMs%20use%20a%20website%20at%20inference%20time)
- Anthropic — [介绍模型上下文协议（2024 年 11 月 25 日）](https://www.anthropic.com/news/model-context-protocol)
- Wikipedia — [可扩展配置协议（建议标准，2004 年 3 月）](https://en.wikipedia.org/wiki/Extensible_Provisioning_Protocol#:~:text=Proposed%20Standard%20documents%20%28RFCs%203730%20-%203734%29%20were%20published%20by%20the%20RFC%20Editor%20in%20March%202004)
- Namefi — [namefi.io/llms.txt（MCP 服务器与 REST API 参考）](https://namefi.io/llms.txt)
- Namefi — [namefi.io/web3/llms.txt（x402 钱包签名结账参考）](https://namefi.io/web3/llms.txt)
