---
title: IDN（国际化域名）/ Punycode
date: '2026-06-22'
language: zh
tags: ['glossary']
authors: ['namefiteam']
description: 使用非 ASCII 字符的域名，为 DNS 编码为以 xn-- 开头的 ASCII Punycode。
keywords: ['IDN', '国际化域名', 'Punycode', 'xn--', 'Unicode 域名', '同形字攻击']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc5890
  - https://www.icann.org/resources/pages/idn-2012-02-25-en
---

**IDN（国际化域名）**是使用非 ASCII 字符的域名——`münchen.de`、`中国.cn` 或 emoji 域名——使名称可以用基本拉丁字符以外的文字书写。由于 [DNS（域名系统）](/zh/glossary/dns/) 本身只处理 ASCII，IDN 被编码为称为 **Punycode** 的兼容 ASCII 字符串，该字符串始终以 `xn--` 前缀开头（例如 `münchen` 变为 `xn--mnchen-3ya`）。[注册局](/zh/glossary/registry/) 和[注册商](/zh/glossary/registrar/) 在 [TLD（顶级域名）](/zh/glossary/tld/) 层面支持 IDN，但 IDN 存在已知风险：视觉上相似的字符使*同形字*仿冒名称得以用于网络钓鱼。IDN 底层仍是普通的已注册域名，因此与其他域名一样，可以被代币化并存放在[钱包](/zh/glossary/wallet/) 中。

*来源：RFC 5890；ICANN IDN 资源。*
