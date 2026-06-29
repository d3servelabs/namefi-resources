---
title: ドメイン窃取
date: '2026-06-22'
language: ja
tags: ['glossary']
authors: ['namefiteam']
description: 正当な所有者のコントロールからドメインが不正に移転される行為。多くの場合、アカウント侵害を通じて実行される。
keywords: ['ドメイン窃取', '不正移転', 'アカウント侵害', 'ドメインセキュリティ', 'ドメイン回復']
level: 1
sources:
  - https://www.icann.org/resources/pages/name-holder-faqs-2017-10-10-en
relatedArticles:
  - /ja/blog/the-perl-com-domain-theft/
  - /ja/blog/how-domain-hijacking-actually-happens/
  - /ja/blog/the-sex-com-heist-the-forged-letter/
  - /ja/blog/recovering-a-tokenized-domain-after-wallet-loss/
  - /ja/blog/the-panix-com-domain-hijack/
relatedTopics:
  - /ja/topics/domain-security/
  - /ja/topics/domain-tokenization/
relatedSeries:
  - /ja/series/domain-apocalypse/
  - /ja/series/domain-flipping-skills/
relatedGlossary:
  - /ja/glossary/domain-hijacking/
  - /ja/glossary/registrar/
  - /ja/glossary/icann/
  - /ja/glossary/registry/
  - /ja/glossary/transfer-lock/
---

**ドメイン窃取**とは、[ドメインハイジャック](/ja/glossary/domain-hijacking/)攻撃が成功した最終的な結果であり、対象のドメイン名が不正な移転手続きを経て攻撃者の管理下にある[レジストラ](/ja/glossary/registrar/)またはアカウントへ移動し、正当な所有者のアクセスが完全に遮断された状態を指す。攻撃の典型的な流れは次のとおりである。まず、[フィッシング](/ja/glossary/phishing/)・認証情報の漏洩・[レジストラ](/ja/glossary/registrar/)サポートへのソーシャルエンジニアリングといった手口でアカウントを侵害し、次いで保護機能を無効化した上で、アカウント内部から入手した[認証コード（auth-code）](/ja/glossary/auth-code/)を使用して移転申請を送信する。被害を受けた後の回復は困難かつ長期にわたる。[ICANN](/ja/glossary/icann/)の紛争処理手続きには数か月を要する場合があり、その間に盗まれたドメインが悪意あるコンテンツに誘導されたり、さらに別のアカウントへ転売されたりするリスクがある。最良の防御策は多層的な事前対策である。具体的には、[移転ロック](/ja/glossary/transfer-lock/)を常時有効にしておくこと、ハードウェアMFAと組み合わせた強力なユニーク認証情報を使用すること、そして価値の高いドメインはレジストリロックプログラムに登録することが挙げられる。
