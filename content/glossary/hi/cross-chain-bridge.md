---
title: क्रॉस-चेन ब्रिज
date: '2026-06-22'
language: hi
priority: P1
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['nirmit-buddhiraja']
description: एक प्रोटोकॉल जो उन ब्लॉकचेन के बीच टोकन या संदेश स्थानांतरित करता है जो मूल रूप से एक-दूसरे से बात नहीं कर सकते।
keywords: ['bridge', 'cross-chain', 'interoperability', 'token bridge', 'multi-chain']
also_known_as: ['ब्रिज']
level: 1
sources:
  - https://ethereum.org/en/developers/docs/bridges/
relatedArticles:
  - /hi/blog/how-tokenization-changes-domain-flipping/
  - /hi/blog/tokenize-your-com-to-flip-it/
  - /hi/blog/what-are-tokenized-domains/
  - /hi/blog/tokenized-domain-use-cases-2026/
  - /hi/blog/tax-and-accounting-questions-for-tokenized-domains/
relatedTopics:
  - /hi/topics/domain-tokenization/
  - /hi/topics/domain-security/
relatedSeries:
  - /hi/series/domain-flipping-skills/
  - /hi/series/tokenize-your-com/
relatedGlossary:
  - /hi/glossary/tokenized-domain/
  - /hi/glossary/ethereum/
  - /hi/glossary/web3/
  - /hi/glossary/tokenize/
  - /hi/glossary/registrar/
---

एक **ब्रिज** (या क्रॉस-चेन ब्रिज, जिसे *ब्रिज* भी कहते हैं) एक प्रोटोकॉल है जो एक [ब्लॉकचेन](/hi/glossary/blockchain/) पर किसी संपत्ति को लॉक करता है और दूसरे पर एक प्रतिनिधि टोकन बनाता है, जिससे मूल्य और डेटा उन नेटवर्कों के बीच चल सकते हैं जिनके बीच कोई मूल संचार चैनल नहीं है। सबसे आम पैटर्न "lock-and-mint" है: आप स्रोत चेन पर एक ब्रिज कॉन्ट्रैक्ट में एक टोकन जमा करते हैं, और एक कस्टोडियन या विकेंद्रीकृत ऑरेकल गंतव्य चेन पर एक मिलान कॉन्ट्रैक्ट को एक रैप्ड समकक्ष जारी करने का निर्देश देता है। ब्रिज [Ethereum](/hi/glossary/ethereum/) मेननेट को Optimism या Base जैसे [लेयर-2](/hi/glossary/layer-2/) रोलअप से, और Polygon या Solana जैसी पूरी तरह से अलग चेन से जोड़ते हैं। चूँकि ब्रिज लॉक की गई संपत्तियों के बड़े पूल रखते हैं, इसलिए वे उच्च-मूल्य हमले के लक्ष्य हैं — कई ने नौ अंकों वाले शोषण झेले हैं। टोकनाइज़्ड डोमेन के लिए, ब्रिजिंग Ethereum पर जारी एक NFT को कम लागत वाले ट्रांसफर के लिए एक सस्ते लेयर-2 पर ले जाने, और फिर DeFi कोलैटरल के लिए मेननेट पर वापस लाने में सक्षम बनाता है।
