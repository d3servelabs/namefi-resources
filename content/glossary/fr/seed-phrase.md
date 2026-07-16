---
title: Phrase secrète (phrase de récupération)
date: '2026-05-22'
language: fr
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['alan-machin']
description: Une liste de 12 ou 24 mots qui encode la clé maîtresse d'un portefeuille ; quiconque la possède contrôle le portefeuille, c'est donc la seule chose que vous devez absolument sauvegarder.
keywords: ['phrase secrète', 'phrase de récupération', 'phrase mnémonique', 'sauvegarde portefeuille', 'BIP39', '12 mots', '24 mots', 'récupération crypto']
level: 1
sources:
  - https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki
relatedArticles:
  - /fr/blog/onchain-domain-custody-and-recovery/
  - /fr/blog/recovering-a-tokenized-domain-after-wallet-loss/
  - /fr/blog/do-multisig-wallets-actually-improve-security/
  - /fr/blog/selling-domains-as-nfts/
  - /fr/blog/the-badgerdao-frontend-attack/
relatedTopics:
  - /fr/topics/domain-security/
  - /fr/topics/domain-tokenization/
relatedSeries:
  - /fr/series/domain-apocalypse/
  - /fr/series/domain-flipping-skills/
relatedGlossary:
  - /fr/glossary/private-key/
  - /fr/glossary/web3/
  - /fr/glossary/wallet/
  - /fr/glossary/tokenized-domain/
  - /fr/glossary/tokenize/
---

Une **phrase secrète** — également appelée **phrase de récupération** ou **phrase mnémonique** — est une liste de 12 ou 24 mots lisibles par l'humain qui encode la clé privée maîtresse d'un [portefeuille](/fr/glossary/wallet/). Le format est standardisé par [BIP-39](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki) et est utilisé par la plupart des portefeuilles modernes (MetaMask, Ledger, Trezor, Rabby, Coinbase Wallet, etc.). Avec la phrase secrète, vous pouvez restaurer le portefeuille — et tous les actifs qu'il contient, y compris les [domaines tokenisés](/fr/blog/what-are-tokenized-domains/) — sur n'importe quel appareil compatible. Sans elle, la perte d'accès à l'appareil signifie généralement une perte permanente des fonds, car il n'existe aucune autorité centrale pour émettre une « réinitialisation du mot de passe ». Bonnes pratiques : écrivez la phrase secrète sur papier ou sur une sauvegarde métallique, conservez au moins deux copies dans des emplacements physiques séparés, et **ne la saisissez jamais** dans un ordinateur, un document cloud, un gestionnaire de mots de passe connecté au cloud, une messagerie ou un assistant IA. Voir [Recovering a Tokenized Domain After Wallet Loss](/fr/blog/recovering-a-tokenized-domain-after-wallet-loss/) pour le guide opérationnel complet.
