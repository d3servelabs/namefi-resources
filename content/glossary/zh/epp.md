---
title: EPP
date: '2026-06-22'
language: zh
tags: ['glossary']
authors: ['namefiteam']
description: 注册商与注册局之间用于注册和管理域名的标准协议。
keywords: ['EPP', 'Extensible Provisioning Protocol', '域名管理', '注册局协议', 'RFC 5730']
also_known_as: ['Extensible Provisioning Protocol']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc5730
---

**EPP**（Extensible Provisioning Protocol，可扩展配置协议）是 RFC 5730 中定义的基于 XML 的命令协议，规范了[注册商](/zh/glossary/registrar/)与[注册局](/zh/glossary/registry/)之间如何通信，以创建、更新、转移或删除域名注册。每当注册商注册新域名、续期或发起转移时，都会通过安全的 TCP 会话向注册局的 EPP 服务器发送 EPP 命令，并收到结构化响应，确认操作成功或报告错误。该协议还传输用于授权出站转移的[授权码](/zh/glossary/auth-code/)，并呈现描述域名当前状态的 [EPP 状态码](/zh/glossary/epp-status-codes/)——例如 `clientTransferProhibited` 或 `serverHold`。由于 EPP 访问受到严格控制，仅限认证注册商使用；终端用户无法直接与其交互。
