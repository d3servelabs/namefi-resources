---
title: BGP हाइजैक
date: '2026-06-22'
language: hi
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['nirmit-buddhiraja']
description: झूठी IP रूट घोषणाओं द्वारा इंटरनेट ट्रैफिक को रीरूट करना, एक नेटवर्क-परत हमला जो DNS से नीचे होता है।
keywords: ['BGP hijack', 'route hijacking', 'IP prefix', 'network security', 'internet routing']
level: 1
sources:
  - https://www.cloudflare.com/learning/security/glossary/bgp-hijacking/
relatedArticles:
  - /hi/blog/the-myetherwallet-bgp-dns-attack/
  - /hi/blog/the-dnspionage-campaign/
  - /hi/blog/the-fox-it-dns-hijack/
  - /hi/blog/the-sea-turtle-dns-espionage/
  - /hi/blog/how-domain-hijacking-actually-happens/
relatedTopics:
  - /hi/topics/domain-security/
  - /hi/topics/domain-basics/
relatedSeries:
  - /hi/series/domain-apocalypse/
  - /hi/series/name-change-game-change/
relatedGlossary:
  - /hi/glossary/dns/
  - /hi/glossary/dns-hijacking/
  - /hi/glossary/icann/
  - /hi/glossary/public-key/
  - /hi/glossary/web3/
---

**BGP हाइजैक** (Border Gateway Protocol हाइजैकिंग) एक नेटवर्क-परत हमला है जिसमें एक दुर्भावनापूर्ण या गलत तरीके से कॉन्फ़िगर किया गया स्वायत्त प्रणाली झूठी रूटिंग घोषणाएँ प्रसारित करती है, जिससे इंटरनेट पर अन्य राउटर को यह विश्वास दिला दिया जाता है कि किसी वैध [IP एड्रेस](/hi/glossary/ip-address/) के लिए ट्रैफिक हमलावर के बुनियादी ढाँचे से होकर जाए। [DNS हाइजैकिंग](/hi/glossary/dns-hijacking/) के विपरीत — जो नाम-से-IP मैपिंग को भ्रष्ट करता है — एक BGP हाइजैक रूटिंग परत पर काम करता है, इसलिए डोमेन के DNS रिकॉर्ड अछूते रहते हैं और DNSSEC इससे सुरक्षा प्रदान नहीं करता। एक बार ट्रैफिक रीरूट हो जाने पर, हमलावर TLS प्रमाणपत्र जारी करने को इंटरसेप्ट कर सकते हैं (BGP हाइजैक का उपयोग CAs से धोखाधड़ी के प्रमाणपत्र प्राप्त करने के लिए किया गया है जो HTTP-आधारित डोमेन सत्यापन का उपयोग करती हैं), अनएन्क्रिप्टेड ट्रैफिक पढ़ सकते हैं, या मैन-इन-द-मिडिल हमले कर सकते हैं। शमन उपायों में RPKI (Resource Public Key Infrastructure) के माध्यम से रूट-ऑरिजिन सत्यापन और निगरानी सेवाएँ शामिल हैं जो तब अलर्ट करती हैं जब अप्रत्याशित AS आपके प्रीफिक्स की घोषणा करते हैं।
