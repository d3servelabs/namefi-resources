---
title: 区域文件（胶水记录）
date: '2026-06-22'
language: zh
tags: ['glossary']
authors: ['namefiteam']
description: 存放域名所有 DNS 记录的文本文件，包括用于其域名服务器的胶水记录。
keywords: ['区域文件', '胶水记录', 'DNS 区域', '权威记录', '域名服务器']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc1035
  - https://www.cloudflare.com/learning/dns/glossary/dns-zone/
---

**区域文件**是域名权威[域名服务器](/zh/glossary/nameserver/) 上存放其所有 [DNS 记录](/zh/glossary/dns-record-types/) 的文本文件——A、MX、TXT 及其他定义域名行为的条目。**胶水记录**是一种特殊情况：当域名的域名服务器位于*该域名本身之下*（例如 `ns1.example.com` 为 `example.com` 提供服务）时，上级[注册局](/zh/glossary/registry/) 必须直接在上级区域中发布域名服务器的 [IP 地址](/zh/glossary/ip-address/)，以避免鸡生蛋的循环查询。编辑区域文件是配置域名 [DNS（域名系统）](/zh/glossary/dns/) 的方式。这是操作数据，与所有权无关——代币化域名正是将所有权转移到了由[钱包](/zh/glossary/wallet/) 控制的层中。

*来源：RFC 1035；Cloudflare DNS 区域词汇表。*
