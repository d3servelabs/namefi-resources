---
title: 認証コード（EPPコード・転送コード）
date: '2026-05-22'
language: ja
tags: ['glossary']
authors: ['namefiteam']
description: レジストラがドメインごとに発行する短い秘密コード。ドメインを別のレジストラへ移管する際に必要で、EPPコードまたは転送コードとも呼ばれる。
keywords: ['認証コード', 'EPPコード', '転送コード', 'ドメイン移管', '承認コード', 'AuthInfoコード']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc5731
relatedArticles:
  - /ja/blog/domain-escrow-explained/
  - /ja/blog/how-to-sell-a-domain-name-you-own/
  - /ja/blog/how-tokenization-changes-domain-flipping/
  - /ja/blog/the-panix-com-domain-hijack/
  - /ja/blog/how-to-tokenize-your-com/
relatedTopics:
  - /ja/topics/domain-tokenization/
  - /ja/topics/domain-basics/
relatedSeries:
  - /ja/series/domain-apocalypse/
  - /ja/series/domain-investor-field-guide/
relatedGlossary:
  - /ja/glossary/registrar/
  - /ja/glossary/registry/
  - /ja/glossary/dns/
  - /ja/glossary/cross-registrar-transfer/
  - /ja/glossary/epp/
---

**認証コード**（**EPPコード**、**AuthInfoコード**、または**転送コード**とも呼ばれる）は、[レジストラ](/ja/glossary/registrar/)が特定のドメインに対して発行する短い共有シークレットであり、[レジストラ間移管](/ja/glossary/cross-registrar-transfer/)を承認するために使用される。EPP（Extensible Provisioning Protocol）はレジストリの基盤となる標準プロトコルであり、認証コードはその中でドメインごとに使われる認証情報である。あるレジストラから別のレジストラへドメインを移管するには、移管先レジストラが、[登録者](/ja/glossary/registrant/)によって移管元レジストラから取得した有効な認証コードを提示する必要がある。このコードは通常、レジストラのコントロールパネル内で確認でき、「Transfer Out」や「Get EPP Code」といったボタンの背後に隠れている場合もある。[トークン化されたドメイン](/ja/blog/what-are-tokenized-domains/)の場合、[オンチェーン](/ja/glossary/on-chain/)での所有権移転に認証コードは**不要**である。[NFT](/ja/glossary/nft/)の移転はオンチェーン上でアトミックに完結する。認証コードが関係するのは、従来の[DNS](/ja/glossary/dns/)の世界においてレジストラ間でドメインを移動する場合に限られる。
