---
title: '基于 HTTPS 的 DNS (DoH) 与企业水平分割 DNS：一场无法自行化解的僵局'
date: '2026-05-04'
language: zh
tags: ['dns', 'doh', 'enterprise', 'security', 'networking']
authors: ['namefiteam']
draft: false
description: '基于 HTTPS 的 DNS (DoH) 通过在 HTTPS 内部加密 DNS 查询来保护用户隐私。企业水平分割 DNS 则依赖于网络能够洞察这些查询。两者之间的冲突正在重塑企业网络、浏览器和操作系统处理名称解析的方式。'
ogImage: ../../assets/dns-over-https-vs-enterprise-split-horizon-dns-og.jpg
keywords: ['基于 HTTPS 的 DNS', 'doh', '水平分割 dns', '企业 dns', 'dot', '加密 dns', '内部 dns', '名称解析', 'namefi']
---

在互联网发展的大部分历史中，DNS 查询都是通过 53 端口以明文形式传输的。网络路径上的任何人都可以读取、记录和修改它们。这是一个隐私问题，IETF 最终通过两种加密替代方案解决了它：2016 年的 [基于 TLS 的 DNS (DoT, RFC 7858)](https://datatracker.ietf.org/doc/html/rfc7858) 和 2018 年的 [基于 HTTPS 的 DNS (DoH, RFC 8484)](https://datatracker.ietf.org/doc/html/rfc8484)。

特别是 DoH 改变了游戏规则，因为它将 DNS 隐藏在常规的 HTTPS 流量*内部*。对于网络观察者来说，DoH 查询看起来与连接到内容服务器的任何其他 TLS 连接完全相同。这对于在存在安全隐患的咖啡馆网络上浏览网页的用户来说非常棒。但对于依赖于查看并引导跨越边界的每一个 DNS 查询的企业 IT 团队来说，这就没那么美妙了。

这就形成了僵局。双方都有合理且明确的需求。标准机构、浏览器供应商和操作系统供应商花了近十年的时间，试图让两者同时发挥作用，而结果是一系列艰难的妥协。在 2026 年，任何运行企业网络的人都需要了解这些妥协。

## DoH 到底是如何运作的

DoH 客户端将 DNS 查询作为 HTTPS 的 POST 或 GET 请求发送，通常发送至 `https://dns.google/dns-query`、`https://cloudflare-dns.com/dns-query` 或其他公共解析器。响应将作为正常的 HTTPS 响应体返回。这里有三个关键特性：

- **传输中加密。** 网络观察者无法读取查询的名称或答案。
- **服务器身份验证。** 客户端会验证解析器的 TLS 证书，因此中间人无法进行伪造。
- **与网络流量难以区分。** 443 端口、TLS 1.3、正常的 SNI 模式。没有典型的 DNS 特征流量可供过滤。

第三个特性正是定义这场冲突的关键。DoT 也会对查询进行加密，但它在*专用*端口 (853) 上进行，网络可以轻松拦截或重定向该端口。而如果不屏蔽普通的网页浏览，就无法选择性地屏蔽 DoH。

## 企业水平分割 DNS 到底是如何运作的

大多数大型组织都运行着**水平分割 DNS (Split-Horizon DNS)**。同一个名称（例如 `vpn.example.corp`、`git.example.com`、`intranet.example.com`）会根据查询来自网络内部还是外部，解析为不同的 IP 地址。

在网络内部：
- 解析器是公司内部的 DNS，通常与 Active Directory 集成。
- `git.example.com` 可能会解析为像 `10.0.4.7` 这样的私有 RFC 1918 地址。
- 仅限内部使用的区域（如 `example.corp`、`example.internal`）可能根本不存在于公共互联网上。
- DLP（数据防泄漏）和安全工具可以看到每一个查询，并能标记出针对已知恶意域名的 DNS 请求。

在网络外部（或在连接家庭 Wi-Fi 的个人设备上）：
- 相同的查询会发送至公共解析器。
- `git.example.com` 会解析到公共负载均衡器。
- 仅限内部使用的名称则根本无法解析。

这并不稀奇。它几乎是每个拥有数百名以上员工的企业的默认设置。它依赖于一个关键假设：**终端设备使用网络指示它使用的解析器**（通过 DHCP、推送策略或 VPN 配置）。

DoH 打破了这个假设。如果浏览器自带其解析器，或者操作系统绕过了系统解析器，终端设备将完全不再查询内部 DNS。内部主机名将无法解析，安全工具也无法再看到其赖以进行威胁检测的查询。

## 浏览器和操作系统如何尝试处理此问题

供应商并非没有看到这个问题。现有的妥协方案是分层的，并且带有一些临时性。

### Chrome 的“自动升级”模式

Chrome 的 DoH 实现方式是：只有当系统解析器本身在 Chrome 的支持 DoH 提供商白名单（如 Google、Cloudflare、Quad9 等）中时，才会将系统解析器升级为 DoH。如果系统被配置为使用不在白名单上的内部企业解析器，Chrome 会保持原样。企业策略还可以通过 [Chrome 的 `DnsOverHttpsMode`](https://chromeenterprise.google/policies/?policy=DnsOverHttpsMode) 设置完全禁用 DoH。

### Firefox 的 TRR (受信任的递归解析器) 模式

Firefox 的方法更具争议性。在 Mozilla 默认启用 DoH 的地区，Firefox 使用默认解析器（例如在美国使用 Cloudflare），但在启用 DoH 之前，它还会运行企业和网络启发式检测。一个重要信号是金丝雀域名 `use-application-dns.net`：当本地解析器返回否定结果时，Firefox 会为那些默认启用了 DoH 的用户禁用应用级 DNS。Mozilla 还记录了一个关于水平分割的重要细节：如果 DoH 解析失败，仅限内部的名称可以回退到普通的 DNS；但在网络内部解析结果不同的公共名称，则需要企业策略来禁用 DoH。

### 苹果的加密 DNS (iOS 14+, macOS Big Sur+)

苹果允许应用程序和配置文件选择为整个系统启用 DoH 或 DoT，但尊重强制指定解析器的 MDM（移动设备管理）策略。企业管理的设备开箱即表现正常。

### Windows 原生 DoH

从 Windows 11 起，以及在 Windows Server 2022 及更高版本上，操作系统本身可以为系统解析器使用 DoH。组策略控制 DoH 是被允许、要求还是禁止，并且 Windows 仅对已知支持该协议且已配置的 DNS 服务器启用 DoH。这可以说是最清晰的模式：安全团队选择策略，操作系统执行策略。

模式很清晰：**存在于单一应用程序（浏览器）中的 DoH 很难被网络控制；存在于操作系统级别解析器中的 DoH 可以通过正常的 MDM 渠道进行控制**。IETF 和操作系统供应商在很大程度上达成了共识：策略应该归属在操作系统层。

## 2026 年企业的现实选项

鉴于上述工具，有三种可行的策略，以及第四种行不通的策略。

### 策略 A：全部内部化，屏蔽 DoH

推送策略在每个浏览器中禁用 DoH，阻止发往已知公共 DoH 端点的 443 端口流量，并强制所有 DNS 请求通过内部解析器。内部解析器本身可以通过 DoH 与上游公共解析器通信，但在网络内部，所有请求都必须经过它。

这是最具规定性的选项。它完美地保留了水平分割，并为安全工具提供了完全的可见性。代价是您必须维护新 DoH 端点的阻止列表，并且用户安装的任何自带 DoH 功能的应用程序（如某些聊天客户端、某些 VPN）可能会出现异常。

### 策略 B：内部 DoH

建立一个内部 DoH 服务器（如 Cloudflared、AdGuard 或启用了 DoH 的 Windows DNS 服务器），配置终端设备使用它，并在内部 DoH 服务器上运行水平分割。终端设备获得了加密的 DNS，而网络又不会失去可见性。

这是最干净的选项，也是大多数大型企业正在努力的方向。它既保留了隐私优势（查询在局域网上是加密的），又保持了安全优势（内部解析器仍然可以看到并过滤每个查询）。微软、谷歌和苹果均支持针对此场景的操作系统级别的配置。

### 策略 C：金丝雀域名 / 网络信号

发布 Mozilla 金丝雀域名。推送相关的 Chrome 和 Edge 策略。依靠浏览器来检测它们是否处于受管网络中，并服从系统解析器。这是最轻量级的选项，对于许多中小型组织来说已经足够。

### 策略 D（行不通）：“我们就直接忽略 DoH”

假装冲突不存在，保留默认设置，并假设所有 DNS 仍然流经企业解析器。这是最常见的情况，并会产生可预见的故障：开发人员报告仅限内部的 URL 在 Edge 中可以工作但在 Firefox 中不行，安全团队在 DNS 日志中看到漏洞，需要花费数小时来诊断间歇性的 VPN-DNS 错误。问题并没有消失，它只是变得更难追溯归因。

## 隐私并不是 DoH 放弃的唯一东西

DoH 一个更微妙的影响是解析器的中心化。当浏览器或操作系统被配置为使用公共 DoH 解析器时，该用户的更多 DNS 流量可能会流向某一个解析器运营商。Chrome 的自动模式明确设计为在可能的情况下保留用户现有的 DNS 提供商，而 Firefox 的默认推出机制依赖于地区和启发式方法，因此在所有部署中这并非字面意义上的“每一个查询”。但架构上的权衡依然存在：加密 DNS 可以将信任从本地网络或 ISP 转移至少数精选的解析器运营商。

这种交易是否可接受取决于威胁模型。对于在充满隐患的咖啡馆网络上的用户，将信任集中于 Cloudflare 显然比信任咖啡馆更安全。但对于已经与其 ISP 建立合同关系的企业来说，这可能是一种倒退。自 DoH 早期推出以来，[EFF 一直在撰写有关这种权衡的文章](https://www.eff.org/deeplinks/2019/10/encrypted-dns-could-help-close-biggest-privacy-gap-internet)。

最干净的答案与上面的策略 B 相同：运行你自己的 DoH 解析器，这样加密 DNS 就无需信任第三方来处理整个查询流。

## 这对域名所有者意味着什么

如果您运营一个被企业使用的域名——比如 SaaS 应用程序、开发者工具或 API——相关的事实是：

- 您的一部分用户将通过公共 DoH 端点解析您，尤其是在非托管设备或显式配置的浏览器上。CNAME 链、子域委派以及您为个性化所做的任何巧妙的 DNS 技巧，在从任意公共解析器解析时必须与从客户内部解析器解析时表现一致。
- 基于 DNS 的规避审查是 DoH 的一个实际应用场景。如果您的域名被某国政府的 DNS 过滤器屏蔽（就像几个加密消息和 VPN 域名所遭遇的那样），用户将通过公共解析器的 DoH 访问您。其机制是相同的；但政治上的风险却不同。
- 内部的水平分割永远不应该将一个面向公众的名称解析为*仅在内部有意义*的内容，否则如果用户无意中通过 DoH 进行查询就会导致故障。典型的失败案例是仅限内部的 `app.example.com` 返回一个私有 IP，导致所有 DoH 用户都无法访问——然后酒店里的远程员工发现相同的主机名无法访问并提交了 bug 报告。请使用一个明确独立的仅限内部区域（如 `app.example.internal`）。

## Namefi 如何发挥作用

Namefi 将 DNS 视为面向公众的控制平面——全局命名与本地策略交汇的场所。我们的 DNS 工作流假设查询可能来自任何解析器，包括我们无法穷举的 DoH 端点，且无论如何，我们发布的名称都会保持一致地运作。对于内部运行水平分割的客户，我们处于公开的一侧：我们提供的是 `example.com` 的权威答案，而内部解析器为内部用户覆盖的内容，则是他们与其终端策略之间的事情。

更深层次的一点是：加密 DNS 将长期存在，企业可见性亦是如此。协调两者的办法不是对抗标准，而是将策略执行点从网络转移到操作系统。标准机构、微软、苹果、谷歌和 Mozilla 都在这个答案上达成了一致。剩下的工作主要在于具体的运营实施。

## 来源与延伸阅读

- IETF — [基于 HTTPS 的 DNS (DoH), RFC 8484](https://datatracker.ietf.org/doc/html/rfc8484) 和 [基于 TLS 的 DNS (DoT), RFC 7858](https://datatracker.ietf.org/doc/html/rfc7858)。
- Chrome Enterprise — [DoH 策略控制](https://chromeenterprise.google/policies/?policy=DnsOverHttpsMode)。
- Mozilla — [受信任的递归解析器计划](https://wiki.mozilla.org/Trusted_Recursive_Resolver)、[金丝雀域名行为](https://support.mozilla.org/en-US/kb/canary-domain-use-application-dnsnet#:~:text=A%20negative%20result%20will%20be%20a%20signal%20to%20disable%20application%20DNS%2C%20(i.e.%2C%20DoH).) 以及 [水平分割回退指南](https://support.mozilla.org/gu-IN/kb/dns-over-https-doh-faqs#:~:text=If%20Firefox%20fails%20to%20resolve%20a%20domain%20via%20DoH%2C%20it%20will%20fall%20back%20to%20the%20DNS.)。
- Chromium — [Chrome 的相同提供商 DoH 自动升级模式](https://www.chromium.org/developers/dns-over-https/#:~:text=Chrome's%20auto%2Dupgrade%20approach%20does%20not%20change%20the%20DNS%20provider)。
- Microsoft — [在 Windows 中配置基于 HTTPS 的 DNS](https://learn.microsoft.com/en-us/windows-server/networking/dns/doh-client-support#:~:text=Allow%20DoH.%20Queries%20will%20be%20performed%20using%20DoH%20if%20the%20specified%20DNS%20servers%20support%20the%20protocol.)。
- EFF — [加密 DNS 有助于弥补互联网最大的隐私缺口之一](https://www.eff.org/deeplinks/2019/10/encrypted-dns-could-help-close-biggest-privacy-gap-internet)。