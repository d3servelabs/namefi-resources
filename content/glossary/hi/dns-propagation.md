---
title: DNS प्रोपेगेशन
date: '2026-06-22'
language: hi
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['nirmit-buddhiraja']
description: DNS प्रोपेगेशन वह देरी है जिसके बाद DNS परिवर्तन हर जगह दिखने लगता है, जैसे-जैसे रिज़ॉल्वर पर कैश्ड पुराने रिकॉर्ड समाप्त होते हैं।
keywords: ['DNS प्रोपेगेशन', 'DNS अपडेट देरी', 'TTL', 'DNS कैश', 'नेमसर्वर बदलाव']
level: 1
sources:
  - https://www.cloudflare.com/learning/dns/glossary/time-to-live-ttl/
  - https://datatracker.ietf.org/doc/html/rfc1035
relatedArticles:
  - /hi/blog/the-curve-finance-dns-hijack/
  - /hi/blog/the-malaysia-airlines-dns-hijack/
  - /hi/blog/the-perl-com-domain-theft/
  - /hi/blog/dns-on-tokenized-domains/
  - /hi/blog/from-twitter-com-to-x-com/
relatedTopics:
  - /hi/topics/domain-security/
  - /hi/topics/domain-tokenization/
relatedSeries:
  - /hi/series/domain-apocalypse/
  - /hi/series/name-change-game-change/
relatedGlossary:
  - /hi/glossary/dns/
  - /hi/glossary/ttl/
  - /hi/glossary/registrar/
  - /hi/glossary/icann/
  - /hi/glossary/registry/
---

**DNS प्रोपेगेशन** कोई [DNS](/hi/glossary/dns/) परिवर्तन करने और उस परिवर्तन के इंटरनेट पर हर जगह दिखने के बीच की देरी है। यह इसलिए होती है क्योंकि दुनिया भर के [रिज़ॉल्वर](/hi/glossary/dns-resolver/) पुराने उत्तर को तब तक कैश रखते हैं जब तक उसका [TTL](/hi/glossary/ttl/) समाप्त न हो जाए, इसलिए कोई नया [रिकॉर्ड](/hi/glossary/dns-record-types/) या [नेमसर्वर](/hi/glossary/nameserver/) अपडेट तुरंत नहीं बल्कि धीरे-धीरे लागू होता है — मिनटों से लेकर एक-दो दिन तक कहीं भी। एक साथ अपडेट करने के लिए कोई वैश्विक "DNS" नहीं है; प्रोपेगेशन केवल कैश के समय पर समाप्त होने की बात है। व्यावहारिक समाधान यह है कि किसी योजनाबद्ध परिवर्तन से पहले TTL कम कर दिया जाए। इनमें से कोई भी डोमेन के स्वामित्व को प्रभावित नहीं करता: टोकनाइज़ेशन यह बदलता है कि ऑन-चेन नाम को कौन नियंत्रित करता है, न कि DNS संपादन कितनी जल्दी फैलते हैं।

*स्रोत: Cloudflare TTL glossary; RFC 1035.*
