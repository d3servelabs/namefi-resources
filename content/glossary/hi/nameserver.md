---
title: 'नेमसर्वर (NS रिकॉर्ड)'
date: '2026-06-22'
language: hi
tags: ['glossary']
authors: ['namefiteam']
description: नेमसर्वर वह सर्वर है जो किसी डोमेन के DNS क्वेरी का जवाब देता है और NS रिकॉर्ड अधिकृत सर्वर का नाम बताते हैं।
keywords: ['नेमसर्वर', 'NS रिकॉर्ड', 'अधिकृत सर्वर', 'DNS डेलिगेशन', 'DNS होस्टिंग']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc1034
  - https://www.cloudflare.com/learning/dns/dns-server-types/
---

एक **नेमसर्वर** वह सर्वर है जो किसी डोमेन के [DNS](/hi/glossary/dns/) क्वेरी का जवाब देता है, और डोमेन की [रजिस्ट्री](/hi/glossary/registry/) पर **NS रिकॉर्ड** यह घोषित करते हैं कि उसके लिए कौन से नेमसर्वर आधिकारिक हैं। जब आप किसी डोमेन को DNS होस्ट (Cloudflare, Route 53, या अपने [रजिस्ट्रार](/hi/glossary/registrar/) के स्वयं के DNS) पर इंगित करते हैं, तो आप उसके नेमसर्वर सेट कर रहे होते हैं; वे सर्वर फिर [रिकॉर्ड प्रकार](/hi/glossary/dns-record-types/) — A, MX, TXT और बाकी — प्रकाशित करते हैं जो ट्रैफ़िक और मेल को रूट करते हैं। किसी डोमेन को टोकनाइज़ करने से यह परत नहीं बदलती: नेमसर्वर और उनके रिकॉर्ड पहले की तरह काम करते रहते हैं, जबकि स्वामित्व और हस्तांतरण ऊपर एक [वॉलेट](/hi/glossary/wallet/)-नियंत्रित [ऑन-चेन](/hi/glossary/on-chain/) परत में चले जाते हैं।

*स्रोत: RFC 1034; Cloudflare DNS server types.*
