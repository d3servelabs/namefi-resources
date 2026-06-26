---
title: EPP
date: '2026-06-22'
language: hi
tags: ['glossary']
authors: ['namefiteam']
description: वह मानक प्रोटोकॉल जिसका उपयोग रजिस्ट्रार रजिस्ट्री के साथ डोमेन पंजीकृत और प्रबंधित करने के लिए करते हैं।
keywords: ['EPP', 'Extensible Provisioning Protocol', 'domain management', 'registry protocol', 'RFC 5730']
also_known_as: ['Extensible Provisioning Protocol']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc5730
relatedArticles:
  - /hi/blog/the-panix-com-domain-hijack/
  - /hi/blog/the-lenovo-com-dns-hijack/
  - /hi/blog/expired-domains-and-the-drop-cycle/
  - /hi/blog/what-is-udrp/
  - /hi/blog/domain-escrow-explained/
relatedTopics:
  - /hi/topics/domain-basics/
  - /hi/topics/domain-security/
relatedSeries:
  - /hi/series/domain-apocalypse/
  - /hi/series/domain-flipping-skills/
relatedGlossary:
  - /hi/glossary/registrar/
  - /hi/glossary/registry/
  - /hi/glossary/epp-status-codes/
  - /hi/glossary/dns/
  - /hi/glossary/icann/
---

**EPP** (Extensible Provisioning Protocol, जिसे "एक्सटेंसिबल प्रोविज़निंग प्रोटोकॉल" भी कहते हैं) RFC 5730 में परिभाषित XML-आधारित कमांड प्रोटोकॉल है जो यह नियंत्रित करता है कि एक [रजिस्ट्रार](/hi/glossary/registrar/) डोमेन पंजीकरण बनाने, अपडेट करने, स्थानांतरित करने, या हटाने के लिए एक [रजिस्ट्री](/hi/glossary/registry/) के साथ कैसे संचार करता है। हर बार जब कोई रजिस्ट्रार एक नया नाम पंजीकृत करता है, उसे नवीनीकृत करता है, या ट्रांसफर शुरू करता है, तो वह रजिस्ट्री के EPP सर्वर पर एक सुरक्षित TCP सत्र पर एक EPP कमांड भेजता है और सफलता की पुष्टि करने या त्रुटि रिपोर्ट करने वाला एक संरचित रिस्पॉन्स प्राप्त करता है। प्रोटोकॉल आउटबाउंड ट्रांसफर को अधिकृत करने के लिए उपयोग किया जाने वाला [ऑथ-कोड](/hi/glossary/auth-code/) भी ले जाता है और [EPP स्टेटस कोड](/hi/glossary/epp-status-codes/) — जैसे `clientTransferProhibited` या `serverHold` — को सामने लाता है जो डोमेन की वर्तमान स्थिति का वर्णन करते हैं। चूँकि EPP कड़ाई से नियंत्रित है, इसलिए पहुँच मान्यताप्राप्त रजिस्ट्रारों तक सीमित है; अंतिम उपयोगकर्ता इसके साथ सीधे बातचीत कभी नहीं करते।
