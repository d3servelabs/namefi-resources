---
title: 公開鍵
date: '2026-06-22'
language: ja
priority: P0
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['chie-kudo']
description: ブロックチェーンの鍵ペアにおける共有可能な半分。秘密鍵から導出され、資金の受け取りと署名の検証に使用される。
keywords: ['公開鍵', 'アドレス', '検証鍵', '非対称暗号', 'ブロックチェーンアカウント']
level: 1
sources:
  - https://ethereum.org/en/developers/docs/accounts/
  - https://www.cloudflare.com/learning/ssl/how-does-public-key-encryption-work/
relatedArticles:
  - /ja/blog/the-badgerdao-frontend-attack/
  - /ja/blog/the-myetherwallet-bgp-dns-attack/
  - /ja/blog/do-multisig-wallets-actually-improve-security/
  - /ja/blog/onchain-domain-custody-and-recovery/
  - /ja/blog/the-sushiswap-miso-insider-attack/
relatedTopics:
  - /ja/topics/domain-security/
  - /ja/topics/domain-basics/
relatedSeries:
  - /ja/series/domain-apocalypse/
  - /ja/series/domain-flipping-skills/
relatedGlossary:
  - /ja/glossary/private-key/
  - /ja/glossary/web3/
  - /ja/glossary/blockchain/
  - /ja/glossary/smart-contract/
  - /ja/glossary/dns/
---

**公開鍵**とは、[ブロックチェーン](/ja/glossary/blockchain/)アカウントの暗号鍵ペアにおける、外部へ公開できる半分のことを指す。公開鍵そのもの、またはそこから導出されたアドレスは公開しても安全であり、他者がトークンを送金したり、あなたの代わりにスマートコントラクトを呼び出したりするために使用される。公開鍵は[秘密鍵](/ja/glossary/private-key/)から楕円曲線暗号の一方向性演算によって導出されるため、公開鍵を共有しても、トランザクションを承認する秘密が漏洩することはない。デジタル署名を公開鍵と照合して検証することで、そのメッセージが対応する秘密鍵の保有者によって署名されたことが証明される。これにより、ネットワークはトランザクションが正当に承認されたものであることを確認できる。
