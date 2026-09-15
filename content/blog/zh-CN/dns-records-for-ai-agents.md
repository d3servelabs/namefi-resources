---
title: "AI 智能体需要的 DNS 记录，以及缺失的那一条"
date: '2026-09-01'
language: 'zh-CN'
tags: ['dns', 'ai-agents', 'mcp', 'acme', 'standards']
authors: ['aileen-wright']
editors: ['victor-zhou']
translators: ['fenwei-bian']
draft: false
cluster: domain-basics
format: guide
description: "SPF、DKIM、DMARC 和 ACME 的 dns-01 挑战，都是你现在就能发布的真实 DNS 记录；能证明 AI 智能体有权代表你的域名行事的那条记录，还不存在。"
ogImage: ../../assets/dns-records-for-ai-agents-og.jpg
keywords: ['AI 智能体 DNS 记录', 'AI 智能体 DNS', 'agent 授权 TXT 记录', 'agent 身份与发现', 'DNSAID 草案', 'A2A agent card', 'well-known agent-card.json', 'MCP DNS', 'ACME dns-01 挑战', 'SPF DKIM DMARC 配置', 'IETF agent DNS 草案', 'AI 智能体域名控制权', 'DNS TXT 记录验证']
relatedArticles:
  - /zh-CN/blog/agent-own-domain/
  - /zh-CN/blog/claude-mcp-domains/
  - /zh-CN/blog/mcp-vs-rest-api/
  - /zh-CN/blog/dns-is-the-control-plane/
  - /zh-CN/blog/what-is-https/
relatedTopics:
  - /zh-CN/topics/domain-basics/
  - /zh-CN/topics/web3-foundations/
relatedSeries:
  - /zh-CN/series/blockchain-concepts/
  - /zh-CN/series/tokenize-your-com/
relatedGlossary:
  - /zh-CN/glossary/ai-agent/
  - /zh-CN/glossary/dns-record-types/
  - /zh-CN/glossary/dns/
  - /zh-CN/glossary/subdomain/
  - /zh-CN/glossary/registrar/
---

假设你正在为自己的域名接入一个 AI agent（智能体）——它要以你的身份发邮件，需要自己的 TLS 证书，也许还会用 [A2A 协议](https://a2a-protocol.org/) 和其他 agent 对话。你打开 DNS 控制台，准备把它需要的东西都发布出去。其中四条记录是真实存在、已标准化、现在就能安全上线的。第五条记录——那条本应写着「这个 agent 有权代表本域名行事」的记录——并不存在。它既不是一项已获批准的标准，也不是一份 IETF 工作组文档，甚至连社区达成一致的惯例都算不上。眼下有好几拨人都在抢着发明它，而彼此的方案互不兼容。

这个空白之所以重要，是因为「该用 DNS TXT 记录」这个直觉本身没错——邮件和 TLS 证书能证明域名控制权，靠的正是这套机制。本文会讲清楚现在到底该发布什么、为什么这套模式还没能延伸到 agent 授权上，以及当下有哪些方案在争着填补这个空缺。

## 你今天就能发布的区域文件

如果你的 agent 要以你的域名身份发邮件，它就需要邮件三件套。[SPF](/zh-CN/glossary/dns-record-types/) 记录**必须以 DNS TXT**[（16 型）资源记录](https://www.rfc-editor.org/rfc/rfc7208.html#section-3.1:~:text=SPF%20records%20MUST%20be%20published%20as%20a%20DNS%20TXT%20%28type%2016%29%20Resource%20Record%20%28RR%29)的形式发布，列出哪些服务器有权以你的名义发信。DKIM 用私钥为发出的邮件签名，再把公钥的一半发布到 DNS 里——其基础规范只定义了一种记录类型来承载它，[即使用 TXT RR](https://www.rfc-editor.org/rfc/rfc6376.html#section-3.6.2:~:text=indicating%20the%20use%20of%20a%20TXT%20RR)。DMARC 则告诉接收方的邮件服务器，在 SPF 或 DKIM 校验失败时该怎么处理——[域名所有者的 DMARC 偏好设置存放在名为“_dmarc”的子域名下的 DNS TXT 记录中](https://www.rfc-editor.org/rfc/rfc7489.html#section-6.1:~:text=Domain%20Owner%20DMARC%20preferences%20are%20stored%20as%20DNS%20TXT%20records%20in%20subdomains%20named)。

如果这个 agent 需要自己的证书——是要运行一台服务器，而不只是去调用别人的——ACME 协议的 `dns-01` 挑战可以证明你控制着这个区域：ACME 客户端会[在待验证的域名前加上标签“_acme-challenge”来构造出验证用的域名](https://www.rfc-editor.org/rfc/rfc8555.html#section-8.4:~:text=constructs%20the%20validation%20domain%20name%20by%20prepending%20the%20label)，然后把要求的值以 TXT 记录的形式发布在那里。和 ACME 基于 HTTP 的挑战不同，`dns-01` 是唯一能签发通配符证书的方式，因为它证明的是对整个区域的控制权，而不只是某一台 Web 服务器。

一个既要发邮件、又需要证书的 agent，其最小化的区域大致是这样的：

```
; SPF — who may send mail as example.com
example.com.                       TXT  "v=spf1 include:_spf.yourmailer.com ~all"

; DKIM — the public half of your mail signing key
selector1._domainkey.example.com.  TXT  "v=DKIM1; k=rsa; p=MIGfMA0GCSq..."

; DMARC — what to do when SPF/DKIM fail
_dmarc.example.com.                TXT  "v=DMARC1; p=quarantine; rua=mailto:reports@example.com"

; ACME dns-01 — proves control of the zone for certificate issuance
_acme-challenge.example.com.       TXT  "<value issued by your ACME client>"
```

如果这个 agent 说的是 A2A，还要再加一个文件——但注意，它根本不是 DNS 记录。A2A 服务器通过[把 agent card 托管在一个标准化的 well-known URI 上](https://a2a-protocol.org/latest/topics/agent-discovery/#:~:text=make%20their%20Agent%20Card%20discoverable%20by%20hosting%20it%20at%20a%20standardized)、放在自己的域名下，让别人能发现它：`https://example.com/.well-known/agent-card.json`。这个路径遵循的是 [RFC 8615](https://www.rfc-editor.org/rfc/rfc8615.html#:~:text=defines%20a%20path%20prefix%20for)——IETF 那套已经用了十来年的 [well-known 位置](https://www.rfc-editor.org/rfc/rfc8615.html)惯例，它存在于 Web 服务器上，而不在区域文件里。截至 2025-08-01，`agent-card.json` 已经登记在 [IANA 的 Well-Known URIs 注册表](https://www.iana.org/assignments/well-known-uris/well-known-uris.xhtml)中，变更控制者是 Linux Foundation——这也是目前寥寥几个与 AI agent 相关的登记条目之一。在同一个注册表里搜索任何包含“mcp”的条目，则什么都搜不到。

## 你接下来想找的那条记录，还不存在

留意一下 SPF、DKIM、DMARC 和 `dns-01` 背后共同的模式：在你的区域里某个特定标签下发布一个特定的值，任何能查询你域名 DNS 的人，都能借此确认是身为域名所有者的你把它放在那里的。这就是域名控制权验证（domain control validation），过去二十年里，它一直是互联网默认的“证明你拥有这个名字”的办法。

所以，当问题从“证明我能发邮件”变成“证明这个 agent 有权代表我的域名行事”——订东西、从关联账户里花钱、管理记录、代表这个域名去和另一个 agent 打交道——同样的反射动作就冒出来了：发布一条 TXT 记录，比如 `_agent.example.com`，写明这个 agent 是谁、权限范围有多大。而这条记录，正是眼下越来越多提案想要定义的东西。它们没有一个已经成为已获批准的标准；而且——正如接下来两节要讲的——今天开发者实际在用的两种 agent 协议，压根不靠 DNS 来解决这件事。

## 今天这些记录是怎样赢得信任的——又花了多久

「用 TXT 记录作证明」这套模式，并不是为 agent 发明的；它是花了将近二十年时间，一个机制一个机制地被搭建、标准化、打磨扎实的：

- **2006 年：** SPF 的第一份规范 [RFC 4408](https://www.rfc-editor.org/rfc/rfc4408.html) 达到 Experimental（实验性）状态。
- **2011 年：** DKIM 现行规范 [RFC 6376](https://www.rfc-editor.org/rfc/rfc6376.html) 取代了 2007 年的初版，进入 Standards Track（标准轨道）。
- **2014 年：** SPF 被重新定义为 [RFC 7208](https://www.rfc-editor.org/rfc/rfc7208.html)，同样进入 Standards Track，并取代了 RFC 4408。
- **2015 年：** DMARC 以 [RFC 7489](https://www.rfc-editor.org/rfc/rfc7489.html) 的形式发布。
- **2019 年：** 包括 `dns-01` 挑战在内的 ACME 协议，以 [RFC 8555](https://www.rfc-editor.org/rfc/rfc8555.html) 的形式发布。

以上每一份都是完整的 IETF Request for Comments（RFC）：经过起草、评审，并附有永久文档编号正式发布。下文列出的这些 agent 授权提案，没有一个走到这一步。其中最早的一份是在 2026 年 3 月才首次发布——相对于这套以数十年为单位的谱系，也就是几个月大的新面孔。

## MCP 和 A2A 对 DNS 到底怎么说：什么都没说

你可能会合理地以为，agent 现在已经在用的这些协议早就悄悄解决了这个问题。并没有——至少不是靠 DNS。

Model Context Protocol（MCP）的授权规范完全建立在 OAuth 之上。其现行版本发布于 2026-07-28，明确写道：[MCP 服务器必须实现 OAuth 2.0 Protected Resource Metadata 规范](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/authorization-server-discovery#:~:text=MCP%20servers%20MUST%20implement%20the%20OAuth%202.0%20Protected%20Resource%20Metadata)，以此把客户端指向一台授权服务器——发现方式是通过 HTTP 的 `/.well-known/oauth-protected-resource` 路径，而不是 DNS 查询。直接核查现行规范文本（而不只是本次研究此前一轮引用过的较旧的 2025-06-18 版本）后发现，授权相关页面里完全没有提到 DNS。MCP 整套发现与鉴权机制，跑在 HTTPS 和 well-known 元数据文档之上。

A2A 自己的发现机制，正如前文所述，也是同一个形态：一个 well-known 的 HTTPS 路径，而不是区域记录。同一个方向上还有两个更小、更轻量的惯例——[AGENTS.md](https://agents.md/#:~:text=Create%20an%20AGENTS.md%20file%20at%20the%20root%20of%20the%20repository)，一个[放在代码仓库根目录](https://agents.md/)的纯文本文件，以及 [llms.txt](https://llmstxt.org/)，一个从 Web 根目录提供的纯文本文件——它们同样是 HTTP 或文件系统层面的惯例。llms.txt 的规范明确解释了自己为什么完全没有采用 RFC 8615 的 well-known-URI 惯例：[well-known URI 只存在于源（origin）的根路径下，而许多作者在共享主机上只掌控着一段路径](https://llmstxt.org/#:~:text=well-known%20URIs%20exist%20only%20at%20the%20origin%20root)。这一整套技术栈里，没有任何一处要求客户端去 DNS 里查东西。

## 截至 2026-09-01，一群「几乎到位」的方案

这不代表没人在做这件事。恰恰相反：基于 DNS 的 agent 授权，正是当下早期标准工作里相当热闹的一角，至少有三拨人马在用不同的机制追求同一个目标。没有一个被 IETF 工作组采纳，彼此之间也没有就记录格式达成一致。下表反映的是各来源在 2026-09-01 抓取时的状态——这么早期的进展，很可能在你读完这篇文章之前就已经变化。

| 提案 | 机制 | 状态（2026-09-01 抓取） |
|---|---|---|
| [draft-nemethi-aid-agent-identity-discovery](https://datatracker.ietf.org/doc/draft-nemethi-aid-agent-identity-discovery/) | `_agent.<domain>` 下的 TXT 记录 | 个人递交的 Internet-Draft，只有 -00 版（自 2026-03-16 首次提交以来未再重新提交）。[将于 2026 年 9 月 17 日到期](https://datatracker.ietf.org/doc/draft-nemethi-aid-agent-identity-discovery/#:~:text=Expires%3A%2017%20September%202026)——距本次快照采集只有约两周。未被任何 IETF 工作组采纳。 |
| [draft-mozleywilliams-dnsop-dnsaid](https://datatracker.ietf.org/doc/draft-mozleywilliams-dnsop-dnsaid/) | 用 [SVCB/HTTPS](https://www.rfc-editor.org/rfc/rfc9460.html#section-1:~:text=HTTP%20clients%20currently%20resolve%20only%20A%20and%2For%20AAAA%20records) 和 TLSA 风格的记录，而不是 TXT | 虽然文件名里带着 `dnsop` 工作组的名字，但仍是个人递交的 Internet-Draft；已重新提交两次，目前是 -02 版（2026 年 5 月 27 日），取代了同一批作者此前称作 `dnsop-bandaid` 的早期草案。[将于 2026 年 11 月 28 日到期](https://datatracker.ietf.org/doc/draft-mozleywilliams-dnsop-dnsaid/#:~:text=Expires%3A%2028%20November%202026)。未被任何 IETF 工作组采纳。 |
| [Agent Identity & Discovery v2](https://aid.agentcommunity.org/docs/specification) | TXT 记录，[一个用分号分隔的 key=value 单行字符串](https://aid.agentcommunity.org/docs/specification#:~:text=The%20record%20MUST%20be%20a%20single%20semicolon-delimited%20string%20of%20key%3Dvalue%20pairs) | 由 agentcommunity.org 维护的独立社区规范，完全在 IETF 流程之外。上面提到的 nemethi IETF 草案，把同一个社区的注册表列为自己的参考实现。 |

这两份 IETF 草案都带着 datatracker 给每一份个人递交文档统一加上的标准免责声明：未获 IETF 背书，在（如果真的会）被某个工作组采纳之前，在 IETF 标准流程中没有正式地位。两个页面都没有列出工作组名称、负责的 Area Director，也没有排定 IESG telechat 日程——而这些正是 datatracker 自己用来标记「已被采纳」的信号。三种方案里最终会是哪一种胜出，甚至会不会有哪一种胜出，这份快照都无法预测；这个日期之后如果有新进展，请自行查看 datatracker 链接核实。

## 现在该发布什么，什么只能当作一场赌注

这些都不意味着 DNS 在 agent 授权这件事上走进了死胡同——只是说明目前还没有任何一个方案从「提案」跨过那条线，成为「标准」。在有方案跨过这条线之前，这两类东西要区别对待：

**该发布的，就把它发布出来。** 如果你的 agent 要发邮件，就上 SPF、DKIM、DMARC；如果它需要证书，尤其是通配符证书，就用 `dns-01`；如果它说 A2A，就放一个 `/.well-known/agent-card.json`；如果它说 MCP，就按 MCP 现行规范走一套基于 OAuth 的授权流程。这四样都是已获批准的标准，也都像基础设施该有的样子一样朴实无华，下个季度都不会被淘汰。

**把 agent 授权 TXT 记录当成一次实验，而不是一道管控。** 如果你今天就在 `_agent.<yourdomain>` 下发布了上面某一份草案，请在内部就把它标注成它本来的样子——一场押注在未获批准的格式上的赌注，这个格式随时可能被替换、改名或放弃，而且任何依赖方都没有义务去核查它。不要在一条没有正式地位的记录上，搭建访问控制、计费或法律层面的证明。定期回头看看上表里的 datatracker 链接；一旦真的出现工作组采纳，那才是改变这盘算的信号。

从邮件到证书，[证明一个名字的控制权靠的都是 DNS](/zh-CN/blog/dns-is-the-control-plane/)，所以可以合理地押注：不管最终是哪种 agent 授权格式胜出，它多半也会落在 DNS 里——这正是本文一路讲下来的那个模式。只是目前还没发生。如果你反正要去配置这些 DNS 记录，那也就是普通的域名和 DNS 管理工作——[Namefi](https://namefi.io) 会处理其中注册和记录编辑的部分，就像它处理上面那些 SPF、DKIM、DMARC 和 ACME 记录一样；我们没有 agent 授权产品可以卖给你，因为截至本文撰写之时，谁都没有。

## 来源与延伸阅读

- IETF — [RFC 7208: Sender Policy Framework (SPF)](https://www.rfc-editor.org/rfc/rfc7208.html)（2014 年 4 月），取代了 [RFC 4408](https://www.rfc-editor.org/rfc/rfc4408.html)（2006 年 4 月）。
- IETF — [RFC 6376: DomainKeys Identified Mail (DKIM) Signatures](https://www.rfc-editor.org/rfc/rfc6376.html)（2011 年 9 月）。
- IETF — [RFC 7489: Domain-based Message Authentication, Reporting, and Conformance (DMARC)](https://www.rfc-editor.org/rfc/rfc7489.html)（2015 年 3 月）。
- IETF — [RFC 8555: Automatic Certificate Management Environment (ACME)](https://www.rfc-editor.org/rfc/rfc8555.html)（2019 年 3 月）。
- IETF — [RFC 9460: Service Binding and Parameter Specification via the DNS (SVCB and HTTPS Resource Records)](https://www.rfc-editor.org/rfc/rfc9460.html)（2023 年 11 月）。
- IETF — [RFC 8615: Well-Known Uniform Resource Identifiers (URIs)](https://www.rfc-editor.org/rfc/rfc8615.html)（2019 年 5 月）。
- IANA — [Well-Known URIs registry](https://www.iana.org/assignments/well-known-uris/well-known-uris.xhtml)，`agent-card.json` 条目（登记于 2025-08-01）。
- Model Context Protocol — [Authorization Server Discovery](https://modelcontextprotocol.io/specification/2026-07-28/basic/authorization/authorization-server-discovery)，规范版本 2026-07-28。
- A2A Protocol — [Agent Discovery](https://a2a-protocol.org/latest/topics/agent-discovery/)。
- AGENTS.md — [agents.md](https://agents.md/)。
- llms.txt — [llmstxt.org](https://llmstxt.org/)。
- IETF Datatracker — [draft-nemethi-aid-agent-identity-discovery](https://datatracker.ietf.org/doc/draft-nemethi-aid-agent-identity-discovery/)，抓取于 2026-09-01；正文见 [ietf.org/archive/id](https://www.ietf.org/archive/id/draft-nemethi-aid-agent-identity-discovery-00.html#:~:text=Given%20a%20domain%20name%2C%20an%20AID%20client%20queries%20a%20DNS%20TXT%20record)。
- IETF Datatracker — [draft-mozleywilliams-dnsop-dnsaid](https://datatracker.ietf.org/doc/draft-mozleywilliams-dnsop-dnsaid/)，抓取于 2026-09-01。
- Agent Community — [Agent Identity & Discovery specification](https://aid.agentcommunity.org/docs/specification)。
