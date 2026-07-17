---
title: सीड फ्रेज़ (रिकवरी फ्रेज़)
date: '2026-05-22'
language: hi
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['nirmit-buddhiraja']
description: 12 या 24 शब्दों की एक सूची जो वॉलेट की मास्टर कुंजी एनकोड करती है; इसे रखने वाला कोई भी व्यक्ति वॉलेट को नियंत्रित करता है, इसलिए यह एकमात्र चीज़ है जिसका आपको बैकअप लेना चाहिए।
keywords: ['सीड फ्रेज़', 'रिकवरी फ्रेज़', 'mnemonic phrase', 'wallet backup', 'BIP39', '12 words', '24 words', 'crypto recovery']
level: 1
sources:
  - https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki
relatedArticles:
  - /hi/blog/onchain-domain-custody-and-recovery/
  - /hi/blog/recovering-a-tokenized-domain-after-wallet-loss/
  - /hi/blog/do-multisig-wallets-actually-improve-security/
  - /hi/blog/selling-domains-as-nfts/
  - /hi/blog/the-badgerdao-frontend-attack/
relatedTopics:
  - /hi/topics/domain-security/
  - /hi/topics/domain-tokenization/
relatedSeries:
  - /hi/series/domain-apocalypse/
  - /hi/series/domain-flipping-skills/
relatedGlossary:
  - /hi/glossary/private-key/
  - /hi/glossary/web3/
  - /hi/glossary/wallet/
  - /hi/glossary/tokenized-domain/
  - /hi/glossary/tokenize/
---

एक **सीड फ्रेज़** — जिसे **रिकवरी फ्रेज़** या **मनेमोनिक फ्रेज़** भी कहा जाता है — 12 या 24 शब्दों की एक मानव-पठनीय सूची है जो एक [वॉलेट](/hi/glossary/wallet/) के लिए मास्टर प्राइवेट कुंजी एनकोड करती है। यह फॉर्मेट [BIP-39](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki) द्वारा मानकीकृत है और अधिकांश आधुनिक वॉलेट (MetaMask, Ledger, Trezor, Rabby, Coinbase Wallet, आदि) द्वारा उपयोग किया जाता है। सीड फ्रेज़ के साथ, आप वॉलेट — और उसमें मौजूद किसी भी संपत्ति को, जिसमें [टोकनाइज़्ड डोमेन](/hi/blog/what-are-tokenized-domains/) भी शामिल हैं — किसी भी संगत डिवाइस पर रिस्टोर कर सकते हैं। इसके बिना, डिवाइस एक्सेस खोना आमतौर पर स्थायी रूप से धन खोने का मतलब होता है, क्योंकि "पासवर्ड रीसेट" जारी करने के लिए कोई केंद्रीय प्राधिकरण नहीं है। सर्वोत्तम अभ्यास: सीड फ्रेज़ को कागज या मेटल बैकअप पर लिखें, अलग-अलग भौतिक स्थानों पर कम से कम दो प्रतियाँ रखें, और इसे किसी भी कंप्यूटर, क्लाउड दस्तावेज़, क्लाउड से जुड़े पासवर्ड मैनेजर, चैट, या AI असिस्टेंट में **कभी नहीं** टाइप करें। पूरी ऑपरेशनल गाइड के लिए देखें [वॉलेट खो जाने के बाद टोकनाइज़्ड डोमेन की रिकवरी](/hi/blog/recovering-a-tokenized-domain-after-wallet-loss/)।
