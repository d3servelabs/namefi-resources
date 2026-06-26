---
title: 認証コード
date: '2026-05-22'
language: ja
tags: ['glossary']
authors: ['namefiteam']
description: ドメインを別のレジストラへ移転する権限を示す、レジストラが発行するドメインごとの短い秘密情報。
keywords: ['auth code', 'EPP code', 'transfer code', 'domain transfer', 'authorization code', 'AuthInfo code']
also_known_as: ['EPPコード', 'AuthInfoコード', '移転コード']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc5731
---

**認証コード**は、**EPPコード**、**AuthInfoコード**、または**移転コード**とも呼ばれ、[レジストラ](/ja/glossary/registrar/)が特定のドメインについて発行する短い共有秘密情報で、[レジストラ間移転](/ja/glossary/cross-registrar-transfer/)を承認するために使われます。EPP（Extensible Provisioning Protocol）は基盤となる標準レジストリプロトコルであり、認証コードはその中のドメインごとの資格情報です。ドメインをあるレジストラから別のレジストラへ移すには、移管先レジストラが、移管元レジストラから[登録者](/ja/glossary/registrant/)が取得した有効な認証コードを提示する必要があります。このコードは通常、レジストラの管理画面内で確認でき、ときには「Transfer Out」や「Get EPP Code」ボタンの背後に隠れています。[トークン化ドメイン](/ja/blog/what-are-tokenized-domains/)では、[オンチェーン](/ja/glossary/on-chain/)の所有権移転に認証コードは**不要**です。[NFT](/ja/glossary/nft/) の移転はオンチェーンでアトミックに行われます。認証コードが関係するのは、従来の [DNS](/ja/glossary/dns/) の世界でドメインをレジストラ間で移す場合だけです。
