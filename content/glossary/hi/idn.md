---
title: 'IDN (अंतर्राष्ट्रीयकृत डोमेन नाम) / Punycode'
date: '2026-06-22'
language: hi
tags: ['glossary']
authors: ['namefiteam']
description: एक डोमेन जो गैर-ASCII अक्षरों का उपयोग करता है, जिसे DNS के लिए xn-- से शुरू होने वाले ASCII Punycode में एनकोड किया जाता है।
keywords: ['IDN', 'internationalized domain name', 'Punycode', 'xn--', 'Unicode domain', 'homograph']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc5890
  - https://www.icann.org/resources/pages/idn-2012-02-25-en
relatedArticles:
  - /hi/blog/what-is-a-tld/
  - /hi/blog/from-discordapp-com-to-discord-com/
  - /hi/blog/the-lenovo-com-dns-hijack/
  - /hi/blog/cybersquatting-vs-domaining-udrp-acpa/
  - /hi/blog/domain-hacks-explained/
relatedTopics:
  - /hi/topics/domain-security/
  - /hi/topics/domain-investing/
relatedSeries:
  - /hi/series/domain-flipping-skills/
  - /hi/series/domain-apocalypse/
relatedGlossary:
  - /hi/glossary/registrar/
  - /hi/glossary/registry/
  - /hi/glossary/tld/
  - /hi/glossary/dns/
  - /hi/glossary/phishing/
---

एक **IDN (अंतर्राष्ट्रीयकृत डोमेन नाम)** एक ऐसा डोमेन है जो गैर-ASCII अक्षरों का उपयोग करता है — जैसे `münchen.de`, `中国.cn`, या इमोजी डोमेन — ताकि नाम बेसिक लैटिन से परे लिपियों में लिखे जा सकें। चूँकि [DNS (डोमेन नेम सिस्टम)](/hi/glossary/dns/) स्वयं केवल ASCII संभालता है, इसलिए IDN को **Punycode** नामक एक संगत ASCII स्ट्रिंग में एनकोड किया जाता है, जो हमेशा `xn--` उपसर्ग से शुरू होती है (अतः `münchen` बन जाता है `xn--mnchen-3ya`)। [रजिस्ट्री](/hi/glossary/registry/) और [रजिस्ट्रार](/hi/glossary/registrar/) [TLD (टॉप-लेवल डोमेन)](/hi/glossary/tld/) स्तर पर IDN का समर्थन करते हैं, हालाँकि इनमें एक ज्ञात जोखिम है: दृश्यतः समान अक्षर *होमोग्राफ* लुकअलाइक्स को सक्षम करते हैं जिनका उपयोग [फ़िशिंग](/hi/glossary/phishing/) में किया जाता है। IDN अंदर से एक साधारण पंजीकृत नाम ही होता है, इसलिए इसे किसी भी अन्य डोमेन की तरह [वॉलेट](/hi/glossary/wallet/) में टोकनाइज़ और रखा जा सकता है। *स्रोत: RFC 5890; ICANN IDN संसाधन।*
