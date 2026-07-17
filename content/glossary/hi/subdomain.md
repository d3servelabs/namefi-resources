---
title: सबडोमेन
date: '2026-06-22'
language: hi
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['nirmit-buddhiraja']
description: सबडोमेन किसी डोमेन में जोड़ा गया एक प्रीफ़िक्स है जो एक अलग एड्रेस बनाता है, जैसे blog.example.com या app.example.com।
keywords: ['सबडोमेन', 'होस्ट', 'blog.example.com', 'DNS', 'सेकंड-लेवल डोमेन']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc1034
  - https://www.cloudflare.com/learning/dns/glossary/what-is-a-subdomain/
relatedArticles:
  - /hi/blog/how-domain-hijacking-actually-happens/
  - /hi/blog/what-is-a-tld/
  - /hi/blog/domain-hacks-explained/
  - /hi/blog/domain-terminology-guide/
  - /hi/blog/dns-over-https-vs-enterprise-split-horizon-dns/
relatedTopics:
  - /hi/topics/domain-security/
  - /hi/topics/domain-basics/
relatedSeries:
  - /hi/series/domain-apocalypse/
  - /hi/series/domain-flipping-skills/
relatedGlossary:
  - /hi/glossary/dns/
  - /hi/glossary/tld/
  - /hi/glossary/registrar/
  - /hi/glossary/registry/
  - /hi/glossary/domain-forwarding/
---

एक **सबडोमेन** आपके डोमेन में जोड़ा गया एक प्रीफ़िक्स है जो उसके नीचे एक अलग एड्रेस बनाता है — `blog.example.com`, `app.example.com`, या `mail.example.com` ये सभी `example.com` के सबडोमेन हैं। आप पैरेंट डोमेन के [नेमसर्वर](/hi/glossary/nameserver/) पर एक [DNS रिकॉर्ड](/hi/glossary/dns-record-types/) (आमतौर पर A या CNAME) जोड़कर एक सबडोमेन बनाते हैं, बिना किसी अतिरिक्त पंजीकरण या शुल्क के। सबडोमेन एक पंजीकृत नाम पर कई सेवाएँ होस्ट करने देते हैं, इसीलिए वे साइट, ऐप और API के लिए एक बुनियादी घटक हैं। टोकनाइज़्ड दुनिया में, स्वामित्व [पंजीकृत](/hi/glossary/registrant/) [सेकंड-लेवल डोमेन](/hi/glossary/second-level-domain/) पर रहता है; सबडोमेन उसके नीचे का कॉन्फ़िगरेशन है और वे उसी के नियंत्रण में रहते हैं जो पैरेंट का [वॉलेट](/hi/glossary/wallet/) नियंत्रित करता है।

*स्रोत: RFC 1034; Cloudflare subdomain glossary.*
