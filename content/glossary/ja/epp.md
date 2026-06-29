---
title: EPP
date: '2026-06-22'
language: ja
tags: ['glossary']
authors: ['namefiteam']
description: レジストラがレジストリとの間でドメインの登録・管理を行うために使用する標準プロトコル。
keywords: ['EPP', 'Extensible Provisioning Protocol', 'ドメイン管理', 'レジストリプロトコル', 'RFC 5730']
also_known_as: ['Extensible Provisioning Protocol']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc5730
relatedArticles:
  - /ja/blog/the-panix-com-domain-hijack/
  - /ja/blog/the-lenovo-com-dns-hijack/
  - /ja/blog/expired-domains-and-the-drop-cycle/
  - /ja/blog/what-is-udrp/
  - /ja/blog/domain-escrow-explained/
relatedTopics:
  - /ja/topics/domain-basics/
  - /ja/topics/domain-security/
relatedSeries:
  - /ja/series/domain-apocalypse/
  - /ja/series/domain-flipping-skills/
relatedGlossary:
  - /ja/glossary/registrar/
  - /ja/glossary/registry/
  - /ja/glossary/epp-status-codes/
  - /ja/glossary/dns/
  - /ja/glossary/icann/
---

**EPP**（Extensible Provisioning Protocol）は、RFC 5730 で定義された XML ベースのコマンドプロトコルであり、[レジストラ](/ja/glossary/registrar/)が[レジストリ](/ja/glossary/registry/)とやり取りしてドメイン登録の作成・更新・移管・削除を行う方法を規定している。レジストラが新しいドメイン名を登録したり、更新したり、移管を開始したりするたびに、セキュアな TCP セッションを通じてレジストリの EPP サーバーへ EPP コマンドを送信し、成功の確認またはエラーを示す構造化レスポンスを受け取る。このプロトコルは、外部への移管を承認するための[認証コード](/ja/glossary/auth-code/)も伝達し、`clientTransferProhibited` や `serverHold` といったドメインの現在の状態を表す [EPP ステータスコード](/ja/glossary/epp-status-codes/)も扱う。EPP へのアクセスは厳格に管理されており、認定を受けたレジストラのみが利用できる。エンドユーザーが直接操作することはない。
