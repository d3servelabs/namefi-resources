---
title: "DANE"
date: '2026-10-22'
language: hi
tags: ['glossary']
authors: ['namefiteam']
draft: false
description: "DANE, DNSSEC से सुरक्षित TLSA रिकॉर्ड में प्रमाणपत्र या कुंजी संबंधों से TLS सेवाओं का प्रमाणीकरण करता है।"
keywords: ["DANE", "DNS आधारित नामित इकाई प्रमाणीकरण", "TLS प्रमाणीकरण"]
also_known_as: ["DNS आधारित नामित इकाई प्रमाणीकरण"]
level: 1
sources:
  - https://www.rfc-editor.org/rfc/rfc6698#section-2
  - https://www.rfc-editor.org/rfc/rfc7671#section-5.1
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
  - /hi/glossary/certificate-authority/
  - /hi/glossary/intermediate-ca/
  - /hi/glossary/man-in-the-middle-attack/
  - /hi/glossary/caa/
  - /hi/glossary/certificate-transparency/
---

**DANE**, यानी **DNS आधारित नामित इकाई प्रमाणीकरण**, TLSA रिकॉर्ड से TLS सेवा को प्रमाणपत्र, सार्वजनिक कुंजी या विश्वास आधार से जोड़ता है। [DNSSEC (डोमेन नेम सिस्टम सुरक्षा एक्सटेंशन)](/hi/glossary/dnssec/) DNS डेटा की प्रामाणिकता जाँचता है। DANE का समर्थन करने वाला क्लाइंट TLS प्रमाणीकरण के दौरान संबंध लागू करता है। चुने हुए उपयोग के अनुसार DANE सार्वजनिक [प्रमाणपत्र प्राधिकरण](/hi/glossary/certificate-authority/) को सीमित कर सकता है या सार्वजनिक CA पर भरोसे से स्वतंत्र रूप से सेवा प्रमाणित कर सकता है। केवल TLSA रिकॉर्ड प्रकाशित करने से DANE अनदेखा करने वाले क्लाइंट नहीं बचते। संचालकों को कुंजी बदलाव और TLSA अपडेट में समन्वय करना तथा DNSSEC सत्यापन बनाए रखना चाहिए।
