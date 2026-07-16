---
title: BGP 劫持
date: '2026-06-22'
language: zh-CN
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['fenwei-bian']
description: 通过虚假宣告 IP 路由来转移互联网流量的网络层攻击，位于 DNS 层之下。
keywords: ['BGP劫持', '路由劫持', 'IP前缀', '网络安全', '互联网路由']
level: 1
sources:
  - https://www.cloudflare.com/learning/security/glossary/bgp-hijacking/
relatedArticles:
  - /zh-CN/blog/the-myetherwallet-bgp-dns-attack/
  - /zh-CN/blog/the-dnspionage-campaign/
  - /zh-CN/blog/the-fox-it-dns-hijack/
  - /zh-CN/blog/the-sea-turtle-dns-espionage/
  - /zh-CN/blog/how-domain-hijacking-actually-happens/
relatedTopics:
  - /zh-CN/topics/domain-security/
  - /zh-CN/topics/domain-basics/
relatedSeries:
  - /zh-CN/series/domain-apocalypse/
  - /zh-CN/series/name-change-game-change/
relatedGlossary:
  - /zh-CN/glossary/dns/
  - /zh-CN/glossary/dns-hijacking/
  - /zh-CN/glossary/icann/
  - /zh-CN/glossary/public-key/
  - /zh-CN/glossary/web3/
---

**BGP 劫持**（边界网关协议劫持）是一种网络层攻击，恶意或配置错误的自治系统会广播虚假的路由通告，诱使互联网上的其他路由器将本应发往合法 [IP 地址](/zh-CN/glossary/ip-address/)的流量改道经过攻击者的基础设施。与[DNS 劫持](/zh-CN/glossary/dns-hijacking/)——破坏域名到 IP 的映射——不同，BGP 劫持作用于路由层，域名的 DNS 记录保持不变，DNSSEC 对此也无法提供保护。流量被重定向后，攻击者可拦截 TLS 证书颁发（BGP 劫持曾被用于从使用 HTTP 域验证方式的 CA 获取伪造证书）、读取未加密的流量，或实施中间人攻击。缓解措施包括通过 RPKI（资源公钥基础设施）进行路由源验证，以及使用监控服务在意外的 AS 宣告你的前缀时发出警报。
