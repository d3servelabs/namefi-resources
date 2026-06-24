---
title: 域名转发
date: '2026-06-22'
language: zh
tags: ['glossary']
authors: ['namefiteam']
description: 将访问某域名的访问者自动重定向至另一地址，通常通过 301 重定向实现。
keywords: ['域名转发', '301重定向', 'URL重定向', 'DNS', '域名管理']
level: 1
sources:
  - https://developers.google.com/search/docs/crawling-indexing/301-redirects
---

**域名转发**（也称 URL 转发或 301 重定向）是一种配置，能够将所有到达某一域名的访问者自动发送至不同的目标 URL。[301 重定向](/zh/glossary/301-redirect/)方式向搜索引擎表明此次迁移是永久性的，将原域名的大部分链接权益传递至目标站点——这使其成为品牌整合或流量迁移时的首选方案。转发可在注册商控制面板中配置，也可通过设置指向应用重定向规则的 Web 服务器的 [DNS 记录类型](/zh/glossary/dns-record-types/)来实现。常见用途是购买匹配的[子域名](/zh/glossary/subdomain/)或拼写变体并将其转发至主站，以捕获散落的流量。转发与完整的 DNS 委托不同：域名仍通过 DNS 解析，但 HTTP 层的指令会将浏览器重定向。
