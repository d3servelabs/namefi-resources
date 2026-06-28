---
title: 'रूट ज़ोन (रूट सर्वर)'
date: '2026-06-22'
language: hi
priority: P1
tags: ['glossary']
authors: ['namefiteam']
description: रूट ज़ोन DNS पदानुक्रम का शीर्ष है, जिसमें हर TLD और उसके लिए अधिकृत सर्वर सूचीबद्ध हैं।
keywords: ['रूट ज़ोन', 'रूट सर्वर', 'DNS पदानुक्रम', 'TLD डेलिगेशन', 'IANA']
level: 1
sources:
  - https://www.iana.org/domains/root
  - https://www.iana.org/domains/root/servers
relatedArticles:
  - /hi/blog/what-is-a-tld/
  - /hi/blog/premium-web3-tlds/
  - /hi/blog/the-malaysia-airlines-dns-hijack/
  - /hi/blog/what-are-tokenized-domains/
  - /hi/blog/the-icann-spear-phishing-breach/
relatedTopics:
  - /hi/topics/choosing-a-tld/
  - /hi/topics/domain-security/
relatedSeries:
  - /hi/series/domain-apocalypse/
  - /hi/series/tokenize-your-com/
relatedGlossary:
  - /hi/glossary/tld/
  - /hi/glossary/dns/
  - /hi/glossary/registry/
  - /hi/glossary/registrar/
  - /hi/glossary/icann/
---

**रूट ज़ोन** [DNS](/hi/glossary/dns/) पदानुक्रम का सबसे ऊपरी स्तर है — प्रत्येक [TLD](/hi/glossary/tld/) और उसके लिए कौन से [रजिस्ट्री](/hi/glossary/registry/) सर्वर आधिकारिक हैं, इसकी मास्टर सूची। इसे **रूट सर्वर** द्वारा सर्व किया जाता है — तेरह नामित पतों पर स्थित वैश्विक स्तर पर वितरित प्रणालियों का एक समूह — और ज़ोन की सामग्री [IANA](/hi/glossary/iana/) के माध्यम से बनाई जाती है। प्रत्येक डोमेन लुकअप जो पहले से कैश में नहीं है, यहीं से शुरू होता है: एक [रिज़ॉल्वर](/hi/glossary/dns-resolver/) रूट से पूछता है कि `.com` कहाँ है, फिर श्रृंखला का अनुसरण करते हुए नीचे जाता है। रूट ज़ोन इंटरनेट का नामकरण लंगर है — और टोकनाइज़ेशन से यह अछूता रहता है, जो मौजूदा DNS के ऊपर एक [वॉलेट](/hi/glossary/wallet/)-नियंत्रित स्वामित्व परत जोड़ता है, रूट को प्रतिस्थापित नहीं करता।

*स्रोत: IANA root zone; IANA root servers.*
