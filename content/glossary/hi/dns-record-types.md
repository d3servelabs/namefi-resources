---
title: 'DNS रिकॉर्ड प्रकार (A, AAAA, CNAME, MX, TXT)'
date: '2026-06-22'
language: hi
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['nirmit-buddhiraja']
description: ज़ोन में वे एंट्री जो किसी डोमेन को एड्रेस और सेवाओं से मैप करती हैं — A, AAAA, CNAME, MX, TXT, और अन्य।
keywords: ['DNS रिकॉर्ड', 'A रिकॉर्ड', 'AAAA रिकॉर्ड', 'CNAME', 'MX रिकॉर्ड', 'TXT रिकॉर्ड']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc1035
  - https://www.cloudflare.com/learning/dns/dns-records/
relatedArticles:
  - /hi/blog/dns-on-tokenized-domains/
  - /hi/blog/how-domain-hijacking-actually-happens/
  - /hi/blog/the-lenovo-com-dns-hijack/
  - /hi/blog/the-dnspionage-campaign/
  - /hi/blog/what-are-tokenized-domains/
relatedTopics:
  - /hi/topics/domain-security/
  - /hi/topics/domain-tokenization/
relatedSeries:
  - /hi/series/domain-apocalypse/
  - /hi/series/tokenize-your-com/
relatedGlossary:
  - /hi/glossary/dns/
  - /hi/glossary/registrar/
  - /hi/glossary/tld/
  - /hi/glossary/icann/
  - /hi/glossary/registry/
---

**DNS रिकॉर्ड प्रकार** किसी डोमेन के ज़ोन में वे अलग-अलग एंट्री हैं जो [DNS](/hi/glossary/dns/) को बताती हैं कि विभिन्न प्रकार के ट्रैफ़िक को कहाँ भेजना है। सामान्य रिकॉर्ड हैं: **A** (किसी नाम को IPv4 [IP एड्रेस](/hi/glossary/ip-address/) से मैप करता है), **AAAA** (IPv6), **CNAME** (एक नाम को दूसरे का उपनाम बनाता है), **MX** (ईमेल रूट करता है), और **TXT** (SPF, DKIM और डोमेन वेरिफिकेशन के लिए फ्री-फॉर्म टेक्स्ट)। ये रिकॉर्ड उन [नेमसर्वर](/hi/glossary/nameserver/) द्वारा प्रकाशित होते हैं जिन्हें आप डोमेन डेलिगेट करते हैं, और ये ही वास्तव में वेबसाइट लोड और मेल डिलीवरी सुनिश्चित करते हैं। किसी डोमेन को टोकनाइज़ करने से यह सब अछूता रहता है: रिकॉर्ड सामान्य रूप से रिज़ॉल्व होते रहते हैं जबकि स्वामित्व और हस्तांतरण एक [वॉलेट](/hi/glossary/wallet/)-नियंत्रित [ऑन-चेन](/hi/glossary/on-chain/) परत में चले जाते हैं।

*स्रोत: RFC 1035; Cloudflare DNS records.*
