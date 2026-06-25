---
title: '基于 HTTPS 的 DNS (DoH) 与企业水平分割 DNS：一场不会自动化解的僵局'
date: '2026-05-04'
language: zh
tags: ['dns', 'doh', 'enterprise', 'security', 'networking']
authors: ['namefiteam']
draft: false
description: '基于 HTTPS 的 DNS (DoH) 通过在 HTTPS 内部加密 DNS 查询来保护用户隐私。而企业水平分割 DNS 则依赖于网络能够查看到这些查询。这两者之间的冲突正在重塑企业网络、浏览器和操作系统处理名称解析的方式。'
ogImage: ../../assets/dns-over-https-vs-enterprise-split-horizon-dns-og.jpg
keywords: ['基于 HTTPS 的 DNS', 'doh', '水平分割 DNS', '企业 DNS', 'dot', '加密 DNS', '内部 DNS', '名称解析', 'namefi']
---

在互联网历史的大部分时间里，[DNS](/zh/glossary/dns/) 查询都是通过 53 端口以明文形式传输的。网络路径上的任何人都可以读取、记录甚至修改这些查询。这是一个隐私隐患，IETF 最终通过推出两种加密替代方案来解决这个问题：2016 年的 [DNS over TLS (DoT, RFC 7858)](https://datatracker.ietf.org/doc/html/rfc7858) 和 2018 年的 [DNS over HTTPS (DoH, RFC 8484)](https://datatracker.ietf.org/doc/html/rfc8484)。

特别是 DoH，彻底改变了游戏规则，因为它将 DNS 隐藏在常规的 HTTPS 数据流*内部*。对于网络观察者来说，DoH 查询看起来与连接到内容服务器的任何其他 TLS 连接完全相同。这对于在存在安全隐患的咖啡馆网络中浏览网页的用户来说非常棒。但对于依赖于查看和引导跨越边界的每一个 DNS 查询的企业 IT 团队来说，这就没那么美妙了。

这就是僵局所在。双方都有合理且明确的需求。标准制定机构、浏览器供应商和操作系统供应商在过去近十年的时间里，一直在努力让这两者同时发挥作用，而结果是一系列不太完美的妥协。任何在 2026 年管理企业网络的人都需要了解这些妥协。

## DoH 实际上是如何工作的

DoH 客户端以 HTTPS POST 或 GET 请求的形式发送 DNS 查询，通常发送到 `https://dns.google/dns-query`、`https://cloudflare-dns.com/dns-query` 或其他公共解析器。响应则作为普通的 HTTPS 响应体返回。这里有三个关键属性：

- **传输中加密。** 网络观察者无法读取查询名称或响应结果。
- **服务器身份验证。** 客户端会验证解析器的 TLS 证书，因此中间人无法进行伪造。
- **与网络流量难以区分。** 使用 443 端口，TLS 1.3 协议，以及正常的 SNI 模式。没有典型的“DNS 形状”流量可供网络层过滤。

第三个属性正是引发冲突的根源。DoT 同样会加密查询，但它使用的是*专用*端口 (853)，网络管理员可以轻松屏蔽或重定向该端口。而 DoH 则无法被选择性地屏蔽，除非将普通的网页浏览也一并阻断。

## 企业水平分割 DNS (Split-Horizon DNS) 实际上是如何工作的

大多数大型组织都在运行**水平分割 DNS**。同一个域名（如 `vpn.example.corp`、`git.example.com`、`intranet.example.com`），根据查询是来自网络内部还是外部，会被解析到不同的 IP 地址。

在网络内部：
- 解析器是公司的内部 DNS，通常与 Active Directory 集成。
- `git.example.com` 可能会解析为一个私有的 RFC 1918 地址，比如 `10.0.4.7`。
- 仅限内部使用的区域（如 `example.corp`、`example.internal`）可能根本不存在于公共互联网上。
- DLP (数据防泄漏) 和安全工具可以看到每一个查询，并能标记出针对已知恶意域名的 DNS 请求。

在网络外部（或在家用 Wi-Fi 上的个人设备）：
- 同样的查询会发送到公共解析器。
- `git.example.com` 会解析到公共负载均衡器。
- 仅限内部使用的名称则根本无法解析。

这种做法并不罕见。它是几乎所有拥有数百名员工以上企业的默认设置。这一切都依赖于一个关键假设：**终端设备使用网络指示它使用的解析器**（通过 DHCP、推送策略或 VPN 配置）。

DoH 打破了这个假设。如果浏览器自带解析器，或者操作系统绕过了系统解析器，终端设备就会完全停止查询内部 DNS。内部主机名将无法解析。安全工具也无法再看到它们用于威胁检测所依赖的查询数据。

## 浏览器和操作系统是如何尝试解决这个问题的

供应商们并没有对这个问题视而不见。目前存在的妥协方案是分层的，并且带有一些临时应对的色彩。

### Chrome 的“自动升级”模式

Chrome 的 DoH 实现方案是：只有当系统解析器本身位于 Chrome 支持 DoH 的提供商许可名单（如 Google、Cloudflare、Quad9 等）中时，才会将系统解析器升级为 DoH。如果系统配置为使用不在该名单上的企业内部解析器，Chrome 将保持原样。企业策略也可以通过 [Chrome 的 `DnsOverHttpsMode`](https://chromeenterprise.google/policies/?policy=DnsOverHttpsMode) 设置完全禁用 DoH。

### Firefox 的 TRR (可信递归解析器) 模式

Firefox 的方法更具争议性。在 Mozilla 默认启用 DoH 的地区，Firefox 会使用一个默认的解析器（例如在美国使用 Cloudflare），但在启用 DoH 之前，它也会运行企业和网络启发式检测。一个重要的信号是金丝雀域名 `use-application-dns.net`：当本地解析器返回否定结果时，Firefox 会为默认启用 DoH 的用户禁用应用级 DNS。Mozilla 还记录了一个关于水平分割的重要细节：如果 DoH 解析失败，仅限内部的域名可以回退到普通的 DNS；但对于在网络内部解析结果不同的公共域名，则需要使用企业策略来禁用 DoH。

### 苹果的加密 DNS (iOS 14+, macOS Big Sur+)

苹果允许应用程序和配置文件为整个系统选择开启 DoH 或 DoT，但同时尊重强制指定特定解析器的 MDM (移动设备管理) 策略。受企业管理的设备在开箱后即可表现出正确的行为预期。

### Windows 原生 DoH

从 Windows 11 起，以及在 Windows Server 2022 及更高版本中，操作系统本身可以将 DoH 用于系统解析器。组策略可以控制 DoH 是被允许、强制要求还是禁止使用，并且 Windows 仅对已知支持 DoH 的已配置 DNS 服务器启用 DoH。这可以说是最清晰的模式：安全团队制定策略，操作系统负责执行。

规律显而易见：**存在于单一应用程序（浏览器）中的 DoH 很难被网络控制；而存在于操作系统级别解析器中的 DoH 则可以通过正常的 MDM 渠道进行控制**。IETF 和操作系统供应商基本上已经达成共识，即策略管控应当归属于操作系统层。

## 2026 年企业面临的现实选择

鉴于上述工具，目前有三种可行的策略，以及第四种行不通的做法。

### 策略 A：全面内部化，屏蔽 DoH

推送策略以禁用所有浏览器中的 DoH，屏蔽通往已知公共 DoH 端点的 443 端口，并强制所有 DNS 查询通过内部解析器。内部解析器本身可以向核心上游公共解析器发送 DoH 请求，但在网络内部，一切流量都必须通过内部解析器。

这是最具强制性的选项。它完美地保留了水平分割，并为安全工具提供了全面的可见性。代价是您必须维护新 DoH 端点的拦截名单，而且用户安装的任何自带 DoH 功能的应用程序（某些聊天客户端、部分 VPN）可能会出现异常。

### 策略 B：内部 DoH

搭建内部 DoH 服务器（如 Cloudflared、AdGuard 或启用了 DoH 的 Windows DNS 服务器），配置终端设备使用它，并在内部 DoH 服务器上运行水平分割。终端设备获得了加密的 DNS，而网络也并未丧失可见性。

这是最干净利落的选项，也是大多数大型企业正在迈进的方向。它既保留了隐私优势（局域网内的查询是被加密的），又维持了安全优势（内部解析器依然可以查看并过滤每一个查询）。微软、谷歌和苹果都在操作系统层面支持这种场景的配置。

### 策略 C：金丝雀域名 / 网络信号

发布 Mozilla 金丝雀域名。推送相关的 Chrome 和 Edge 策略。依赖浏览器来检测它们是否处于受管网络中，并听从系统解析器的安排。这是最轻量级的选项，足以满足许多中小型组织的需求。

### 策略 D（行不通）：“我们就直接忽略 DoH 吧”

假装冲突不存在，保留默认设置，并假设所有的 DNS 查询仍然流经企业解析器。这是目前最常见的情况，它会产生可预见的故障：开发人员报告仅限内部的 URL 在 Edge 中可以访问，但在 Firefox 中却不行；安全团队发现 DNS 日志中存在空白；间歇性的 VPN-DNS 漏洞需要花费数小时来诊断排查。问题并不会消失，它只会变得更难溯源。

## 隐私并非 DoH 舍弃的唯一东西

DoH 带来的一个更微妙的影响是解析器的中心化。当浏览器或操作系统被配置为使用公共 DoH 解析器时，该用户的大部分 DNS 数据流可能会流向单一的解析器运营商。Chrome 的自动模式经过专门设计，尽可能保留用户现有的 DNS 提供商；而 Firefox 的默认部署依赖于地区和启发式检测，因此在实际部署中，并非真的“每一个查询”都会这样。但架构上的权衡依然存在：加密 DNS 可能会将信任从本地网络或 ISP (互联网服务提供商) 转移到少数被选中的解析器运营商身上。

这种权衡是否可接受，取决于威胁模型。对于在不安全的咖啡馆网络中的用户来说，将信任集中交给 Cloudflare 明显优于信任咖啡馆网络。但对于已经与其 ISP 建立了合同关系的企业来说，这可能是一种倒退。[电子前哨基金会 (EFF) 早在 DoH 推广初期就一直在撰写关于这种权衡的文章](https://www.eff.org/deeplinks/2019/10/encrypted-dns-could-help-close-biggest-privacy-gap-internet)。

最清晰的答案与上述的策略 B 相同：运行您自己的 DoH 解析器，这样加密 DNS 就无需将整个查询数据流委托给第三方。

## 这对域名所有者意味着什么

如果您运营的域名面向企业提供服务（如 SaaS 应用、开发者工具或 API），您需要了解以下事实：

- 会有一部分用户通过公共 DoH 端点解析您的域名，尤其是在非托管设备或显式配置过的浏览器上。您为实现个性化而设置的 CNAME 链、[子域名](/zh/glossary/subdomain/)委派以及任何巧妙的 DNS 技巧，在通过任意公共解析器解析时，都必须与通过客户内部解析器解析时一样正常工作。
- 基于 DNS 的审查规避是 DoH 的一个实际应用场景。如果您的域名被某政府的 DNS 过滤器屏蔽（就像一些加密通讯和 VPN 域名曾经遭遇的那样），用户将会通过公共解析器的 DoH 访问您。其机制是一样的；只是政治风险不同。
- 内部水平分割绝不应将一个面向公众的名称解析为*仅在内部有意义*的地址，以免用户意外通过 DoH 查询时导致服务中断。典型的反面教材是，仅限内部使用的 `app.example.com` 返回一个没有 DoH 用户可以访问的私有 IP ——随后，在酒店远程办公的员工发现该主机名无法访问，并提交了一个 Bug。请始终使用一个明确分离的、仅供内部使用的区域（如 `app.example.internal`）。

## Namefi 如何融入这一趋势

Namefi 将 DNS 视为面向公众的控制平面——在这里，全球命名规则与本地策略相遇。我们的 DNS 工作流假设查询可能来自任何解析器，包括我们无法穷举的 DoH 端点，并且无论情况如何，我们发布的名称都能始终如一地正常工作。对于在内部运行水平分割的客户，我们坚守在公共的一侧：我们为 `example.com` 提供权威响应，而内部解析器如何针对内部用户进行覆盖，则取决于他们与其终端策略之间的设置。

更深层的意义在于：加密 DNS 将长期存在，企业的网络可见性需求亦是如此。调和两者的正确方式不是对抗标准，而是将策略执行点从网络层转移到操作系统层。标准制定机构、微软、苹果、谷歌和 Mozilla 都已在这一点上达成了共识。接下来剩下的，主要就是落地运营的工作了。

## 来源与扩展阅读

- IETF — [基于 HTTPS 的 DNS, RFC 8484](https://datatracker.ietf.org/doc/html/rfc8484) 及 [基于 TLS 的 DNS, RFC 7858](https://datatracker.ietf.org/doc/html/rfc7858)。
- Chrome Enterprise — [DoH 策略控制](https://chromeenterprise.google/policies/?policy=DnsOverHttpsMode)。
- Mozilla — [可信递归解析器计划 (TRR)](https://wiki.mozilla.org/Trusted_Recursive_Resolver), [金丝雀域名行为](https://support.mozilla.org/en-US/kb/canary-domain-use-application-dnsnet#:~:text=A%20negative%20result%20will%20be%20a%20signal%20to%20disable%20application%20DNS%2C%20(i.e.%2C%20DoH).), 以及 [水平分割回退指南](https://support.mozilla.org/gu-IN/kb/dns-over-https-doh-faqs#:~:text=If%20Firefox%20fails%20to%20resolve%20a%20domain%20via%20DoH%2C%20it%20will%20fall%20back%20to%20the%20DNS.)。
- Chromium — [Chrome 的同提供商 DoH 自动升级模式](https://www.chromium.org/developers/dns-over-https/#:~:text=Chrome's%20auto%2Dupgrade%20approach%20does%20not%20change%20the%20DNS%20provider)。
- Microsoft — [在 Windows 中配置 DNS over HTTPS](https://learn.microsoft.com/en-us/windows-server/networking/dns/doh-client-support#:~:text=Allow%20DoH.%20Queries%20will%20be%20performed%20using%20DoH%20if%20the%20specified%20DNS%20servers%20support%20the%20protocol.)。
- EFF — [加密 DNS 可以帮助缩小互联网上最大的隐私鸿沟之一](https://www.eff.org/deeplinks/2019/10/encrypted-dns-could-help-close-biggest-privacy-gap-internet)。