---
title: ऑथ कोड (EPP कोड, ट्रांसफर कोड)
date: '2026-05-22'
language: hi
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['nirmit-buddhiraja']
description: एक छोटा प्रति-डोमेन गुप्त कोड जिसे रजिस्ट्रार किसी डोमेन को दूसरे रजिस्ट्रार में स्थानांतरित करने के लिए अधिकृत करने हेतु जारी करता है, जिसे EPP कोड या ट्रांसफर कोड भी कहते हैं।
keywords: ['ऑथ कोड', 'EPP कोड', 'ट्रांसफर कोड', 'डोमेन ट्रांसफर', 'authorization code', 'AuthInfo कोड']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc5731
relatedArticles:
  - /hi/blog/domain-escrow-explained/
  - /hi/blog/how-to-sell-a-domain-name-you-own/
  - /hi/blog/how-tokenization-changes-domain-flipping/
  - /hi/blog/the-panix-com-domain-hijack/
  - /hi/blog/how-to-tokenize-your-com/
relatedTopics:
  - /hi/topics/domain-tokenization/
  - /hi/topics/domain-basics/
relatedSeries:
  - /hi/series/domain-apocalypse/
  - /hi/series/domain-investor-field-guide/
relatedGlossary:
  - /hi/glossary/registrar/
  - /hi/glossary/registry/
  - /hi/glossary/dns/
  - /hi/glossary/cross-registrar-transfer/
  - /hi/glossary/epp/
---

एक **ऑथ कोड** — जिसे **EPP कोड**, **AuthInfo कोड**, या **ट्रांसफर कोड** भी कहा जाता है — एक छोटा साझा गुप्त कोड है जिसे एक [रजिस्ट्रार](/hi/glossary/registrar/) किसी विशिष्ट डोमेन के लिए [क्रॉस-रजिस्ट्रार ट्रांसफर](/hi/glossary/cross-registrar-transfer/) को अधिकृत करने के लिए जारी करता है। EPP (Extensible Provisioning Protocol) मानक अंतर्निहित रजिस्ट्री प्रोटोकॉल है; ऑथ कोड इसके भीतर प्रति-डोमेन क्रेडेंशियल है। किसी डोमेन को एक रजिस्ट्रार से दूसरे में स्थानांतरित करने के लिए, प्राप्तकर्ता रजिस्ट्रार को [रजिस्ट्रेंट](/hi/glossary/registrant/) द्वारा पुराने रजिस्ट्रार से प्राप्त एक वैध ऑथ कोड प्रस्तुत करना होगा। कोड आमतौर पर रजिस्ट्रार के कंट्रोल पैनल में दिखाई देता है, कभी-कभी "Transfer Out" या "Get EPP Code" बटन के पीछे छिपा होता है। [टोकनाइज़्ड डोमेन](/hi/blog/what-are-tokenized-domains/) के लिए, [ऑन-चेन](/hi/glossary/on-chain/) स्वामित्व ट्रांसफर को ऑथ कोड की **आवश्यकता नहीं** होती — [NFT (नॉन-फंजीबल टोकन)](/hi/glossary/nft/) ट्रांसफर ऑन-चेन पर परमाणु रूप से होता है। ऑथ कोड केवल तब प्रासंगिक होते हैं जब पारंपरिक [DNS (डोमेन नेम सिस्टम)](/hi/glossary/dns/) दुनिया में रजिस्ट्रारों के बीच डोमेन स्थानांतरित किया जाता है।
