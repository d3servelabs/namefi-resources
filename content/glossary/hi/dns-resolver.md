---
title: 'DNS रिज़ॉल्वर (रिकर्सिव रिज़ॉल्वर)'
date: '2026-06-22'
language: hi
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['nirmit-buddhiraja']
description: DNS रिज़ॉल्वर वह सर्वर है जो डोमेन लुकअप लेता है और मिलान एड्रेस वापस करने के लिए DNS पदानुक्रम में चलता है।
keywords: ['DNS रिज़ॉल्वर', 'रिकर्सिव रिज़ॉल्वर', 'रिज़ॉल्वर', '8.8.8.8', '1.1.1.1', 'DNS लुकअप']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc1034
  - https://www.cloudflare.com/learning/dns/what-is-a-dns-resolver/
relatedArticles:
  - /hi/blog/dns-over-https-vs-enterprise-split-horizon-dns/
  - /hi/blog/the-dyn-dns-mirai-attack/
  - /hi/blog/the-myetherwallet-bgp-dns-attack/
  - /hi/blog/tokenized-domain-vs-web3-domain/
  - /hi/blog/premium-web3-tlds/
relatedTopics:
  - /hi/topics/domain-security/
  - /hi/topics/domain-tokenization/
relatedSeries:
  - /hi/series/domain-apocalypse/
  - /hi/series/domain-flipping-skills/
relatedGlossary:
  - /hi/glossary/dns/
  - /hi/glossary/tld/
  - /hi/glossary/urs/
  - /hi/glossary/registry/
  - /hi/glossary/registrar/
---

एक **DNS रिज़ॉल्वर** (या *recursive resolver*) वह सर्वर है जिससे आपका डिवाइस तब पूछता है जब उसे कोई डोमेन [IP एड्रेस](/hi/glossary/ip-address/) में बदलना होता है। `1.1.1.1` (Cloudflare) और `8.8.8.8` (Google) जैसे पब्लिक रिज़ॉल्वर मेहनत करते हैं: [रूट ज़ोन](/hi/glossary/root-zone/) से शुरू होकर, वे [DNS](/hi/glossary/dns/) पदानुक्रम में डोमेन के आधिकारिक [नेमसर्वर](/hi/glossary/nameserver/) तक क्वेरी करते हैं, फिर उत्तर को उसके [TTL](/hi/glossary/ttl/) के लिए कैश करते हैं। DNS का यही हिस्सा "नाम टाइप करें, साइट तक पहुँचें" को तत्काल महसूस कराता है। रिज़ॉल्वर केवल पब्लिक DNS डेटा पढ़ते हैं — उन्हें कोई दृश्यता नहीं है कि कोई डोमेन किसका *स्वामित्व* है, इसीलिए टोकनाइज़्ड डोमेन की [वॉलेट](/hi/glossary/wallet/)-आधारित स्वामित्व परत रिज़ॉल्यूशन के लिए अदृश्य रहती है और नाम के रिज़ॉल्व होने के तरीके में कुछ नहीं बदलती।

*स्रोत: RFC 1034; Cloudflare DNS resolver.*
