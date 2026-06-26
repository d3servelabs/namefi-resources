---
title: डोमेन फॉरवर्डिंग
date: '2026-06-22'
language: hi
tags: ['glossary']
authors: ['namefiteam']
description: विज़िटर को एक डोमेन से स्वचालित रूप से दूसरे पते पर भेजना, अक्सर 301 रीडायरेक्ट के माध्यम से।
keywords: ['domain forwarding', '301 redirect', 'URL redirect', 'DNS', 'domain management']
level: 1
sources:
  - https://developers.google.com/search/docs/crawling-indexing/301-redirects
relatedArticles:
  - /hi/blog/how-domain-hijacking-actually-happens/
  - /hi/blog/the-fox-it-dns-hijack/
  - /hi/blog/the-lenovo-com-dns-hijack/
  - /hi/blog/from-twitter-com-to-x-com/
  - /hi/blog/the-godaddy-multi-year-breach/
relatedTopics:
  - /hi/topics/domain-security/
  - /hi/topics/domain-investing/
relatedSeries:
  - /hi/series/domain-apocalypse/
  - /hi/series/name-change-game-change/
relatedGlossary:
  - /hi/glossary/301-redirect/
  - /hi/glossary/registrar/
  - /hi/glossary/dns/
  - /hi/glossary/icann/
  - /hi/glossary/tld/
---

**डोमेन फॉरवर्डिंग** (जिसे *URL फॉरवर्डिंग* या *301 रीडायरेक्ट* भी कहा जाता है) एक कॉन्फ़िगरेशन है जो स्वचालित रूप से किसी एक डोमेन पर आने वाले हर विज़िटर को एक अलग गंतव्य URL पर भेजता है। [301 रीडायरेक्ट](/hi/glossary/301-redirect/) वेरिएंट सर्च इंजन को संकेत देता है कि यह स्थानांतरण स्थायी है, मूल डोमेन की अधिकांश लिंक इक्विटी लक्ष्य तक पहुँचाता है — जिससे यह ब्रांड समेकित करते समय या ट्रैफिक माइग्रेट करते समय पसंदीदा विकल्प बन जाता है। फॉरवर्डिंग या तो रजिस्ट्रार कंट्रोल पैनल पर या [DNS रिकॉर्ड प्रकार](/hi/glossary/dns-record-types/) सेट करके कॉन्फ़िगर किया जाता है जो रीडायरेक्ट नियम लागू करने वाले वेब सर्वर की ओर इंगित करता है। एक सामान्य उपयोग मामला एक मिलान करने वाला [सबडोमेन](/hi/glossary/subdomain/) या टाइपो वेरिएंट खरीदना और इसे मुख्य साइट पर फॉरवर्ड करना है ताकि भटके हुए ट्रैफिक को पकड़ा जा सके। फॉरवर्डिंग पूर्ण DNS डेलिगेशन से अलग है: डोमेन अभी भी DNS के माध्यम से रिज़ॉल्व होता है, लेकिन HTTP-स्तर के निर्देश ब्राउज़र को रीडायरेक्ट करते हैं।
