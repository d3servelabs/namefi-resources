---
title: 301 重定向
date: '2026-06-22'
language: zh
tags: ['glossary']
authors: ['namefiteam']
description: 一种 HTTP 状态码，告知浏览器和搜索引擎某个页面已永久迁移至新 URL。
keywords: ['301重定向', '永久重定向', 'HTTP重定向', 'SEO', '域名转发', '链接权益']
also_known_as: ['永久重定向']
level: 1
sources:
  - https://developers.google.com/search/docs/crawling-indexing/301-redirects
---

**301 重定向**（也称"永久重定向"）是一种 HTTP 响应状态码，向浏览器和搜索引擎表明某个资源已永久迁移至新 URL，后续所有请求均应转向新目标地址。"301"区别于临时性的 302 重定向：使用 301 时，Google 会将旧 URL 的排名信号——包括链接权益与[锚文本](/zh/glossary/anchor-text/)——合并转移至新 URL，因此它是进行[域名转发](/zh/glossary/domain-forwarding/)而不损失 [SEO](/zh/glossary/seo/) 价值的标准机制。实际应用中，域名投资者可以收购一个具有强大[域名权威度](/zh/glossary/domain-authority/)的老域名，将其指向目标站点，从而把大部分积累的链接权益传递至目标页面。这一传递并非即时完成——Google 通常需要数周时间来整合信号——且未必能达到 100%，所以 301 重定向虽然价值显著，却不是完美的权益移植方案。
