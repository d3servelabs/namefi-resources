---
title: "प्रमाणपत्र प्राधिकरण"
date: '2026-10-22'
language: hi
tags: ['glossary']
authors: ['namefiteam']
draft: false
description: "प्रमाणपत्र प्राधिकरण पहचानों को सार्वजनिक कुंजियों से जोड़ने वाले डिजिटल प्रमाणपत्र जारी करता है।"
keywords: ["प्रमाणपत्र प्राधिकरण", "CA", "TLS प्रमाणीकरण"]
also_known_as: ["CA", "प्रमाणन प्राधिकरण"]
level: 1
sources:
  - https://www.rfc-editor.org/rfc/rfc5280#section-3.2
  - https://www.rfc-editor.org/rfc/rfc8659#section-2.2
relatedArticles:
  - /hi/blog/the-fox-it-dns-hijack/
  - /hi/blog/the-myetherwallet-bgp-dns-attack/
  - /hi/blog/the-curve-finance-dns-hijack/
  - /hi/blog/dns-on-tokenized-domains/
  - /hi/blog/dnssec-for-domain-owners/
relatedTopics:
  - /hi/topics/domain-security/
  - /hi/topics/domain-basics/
relatedSeries:
  - /hi/series/domain-apocalypse/
  - /hi/series/tokenize-your-com/
relatedGlossary:
  - /hi/glossary/intermediate-ca/
  - /hi/glossary/man-in-the-middle-attack/
  - /hi/glossary/dane/
  - /hi/glossary/caa/
  - /hi/glossary/certificate-transparency/
---

**प्रमाणपत्र प्राधिकरण**, जिसे **प्रमाणन प्राधिकरण** या **CA** भी कहते हैं, डिजिटल प्रमाणपत्र जारी करता है जो पहचानों को [पब्लिक की](/hi/glossary/public-key/) से जोड़ते हैं। सार्वजनिक रूप से विश्वसनीय TLS CA वेबसाइट प्रमाणपत्र पर हस्ताक्षर करने से पहले डोमेन नियंत्रण और लागू पहचान आवश्यकताओं की जाँच करता है। क्लाइंट विश्वसनीय मूल CA के आधार पर प्रमाणपत्र शृंखला सत्यापित करते हैं और संबंधित निजी कुंजी रखने के सर्वर के प्रमाण की जाँच करते हैं। CA [मध्यवर्ती CA](/hi/glossary/intermediate-ca/) को हस्ताक्षर अधिकार सौंप सकता है। CA पर भरोसा क्लाइंट नीति के अंतर्गत पहचान प्रमाणित करता है। CA पर भरोसा वेबसाइट की सामग्री के ईमानदार होने की गारंटी नहीं देता।
