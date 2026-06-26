---
title: EPP स्टेटस कोड
date: '2026-06-22'
language: hi
tags: ['glossary']
authors: ['namefiteam']
description: किसी डोमेन पर मानकीकृत फ्लैग जो उसकी स्थिति दर्शाते हैं — लॉक्ड, होल्ड पर, ट्रांसफर पेंडिंग, और अधिक।
keywords: ['EPP status codes', 'clientHold', 'serverTransferProhibited', 'domain status', 'pending delete']
level: 1
sources:
  - https://www.icann.org/resources/pages/epp-status-codes-2014-06-16-en
relatedArticles:
  - /hi/blog/expired-domains-and-the-drop-cycle/
  - /hi/blog/domain-backorders-and-drop-catching/
  - /hi/blog/how-to-sell-a-domain-name-you-own/
  - /hi/blog/the-panix-com-domain-hijack/
  - /hi/blog/working-with-domain-brokers/
relatedTopics:
  - /hi/topics/domain-investing/
  - /hi/topics/domain-security/
relatedSeries:
  - /hi/series/domain-flipping-skills/
  - /hi/series/domain-apocalypse/
relatedGlossary:
  - /hi/glossary/registrar/
  - /hi/glossary/epp/
  - /hi/glossary/registry/
  - /hi/glossary/dns/
  - /hi/glossary/transfer-lock/
---

**EPP स्टेटस कोड** एक्सटेंसिबल प्रोविज़निंग प्रोटोकॉल ([EPP](/hi/glossary/epp/)) द्वारा परिभाषित मशीन-पठनीय फ्लैग हैं जो किसी भी समय डोमेन पर अनुमत ऑपरेशन का सटीक वर्णन करते हैं। ये दो नेमस्पेस में आते हैं: `client*` कोड जो [रजिस्ट्रार](/hi/glossary/registrar/) द्वारा सेट किए जाते हैं और `server*` कोड जो [रजिस्ट्री](/hi/glossary/registry/) द्वारा सेट किए जाते हैं, सर्वर कोड को प्राथमिकता दी जाती है। सामान्य कोड में शामिल हैं `clientTransferProhibited` (वह [ट्रांसफर लॉक](/hi/glossary/transfer-lock/) जो आउटबाउंड मूव को ब्लॉक करता है), `serverDeleteProhibited` (हटाने के खिलाफ रजिस्ट्री-स्तर सुरक्षा), `clientHold` (DNS रेज़ोल्यूशन को निलंबित करता है, अक्सर गैर-भुगतान के लिए), और `pendingDelete` जो एक डोमेन को उसकी ग्रेस अवधि में चिह्नित करता है इससे पहले कि वह जारी किया जाए और फिर से पंजीकरण के लिए उपलब्ध हो — [पेंडिंग डिलीट](/hi/glossary/pending-delete/) के निकट एक स्थिति। इन कोडों को समझना व्यावहारिक रूप से महत्वपूर्ण है: `serverTransferProhibited` दिखाने वाले डोमेन को रजिस्ट्रार के अनलॉक करने के बाद भी स्थानांतरित नहीं किया जा सकता, जो लेनदेन के बीच में खरीदारों को चौंकाता है।
