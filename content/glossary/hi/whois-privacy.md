---
title: WHOIS गोपनीयता
date: '2026-06-22'
language: hi
priority: P1
tags: ['glossary']
authors: ['namefiteam']
description: एक सेवा जो सार्वजनिक WHOIS या RDAP रिकॉर्ड में पंजीयक के व्यक्तिगत संपर्क विवरण छुपाती है।
keywords: ['WHOIS privacy', 'गोपनीयता सुरक्षा', 'RDAP', 'पंजीयक गोपनीयता', 'संपर्क छुपाना']
also_known_as: ['गोपनीयता सुरक्षा']
level: 1
sources:
  - https://www.icann.org/rdap
relatedArticles:
  - /hi/blog/from-massdrop-com-to-drop-com/
  - /hi/blog/how-domain-hijacking-actually-happens/
  - /hi/blog/from-getdropbox-com-to-dropbox-com/
  - /hi/blog/the-fox-it-dns-hijack/
  - /hi/blog/dns-over-https-vs-enterprise-split-horizon-dns/
relatedTopics:
  - /hi/topics/domain-security/
  - /hi/topics/domain-investing/
relatedSeries:
  - /hi/series/domain-apocalypse/
  - /hi/series/name-change-game-change/
relatedGlossary:
  - /hi/glossary/registrar/
  - /hi/glossary/dns/
  - /hi/glossary/icann/
  - /hi/glossary/tld/
  - /hi/glossary/whois/
---

**WHOIS गोपनीयता** (गोपनीयता सुरक्षा भी कहते हैं) अधिकांश [रजिस्ट्रारों](/hi/glossary/registrar/) द्वारा दी जाने वाली एक सेवा है जो सार्वजनिक [WHOIS](/hi/glossary/whois/) और RDAP रिकॉर्ड में [पंजीयक](/hi/glossary/registrant/) के वास्तविक नाम, पते, फोन, और ईमेल के स्थान पर एक प्रॉक्सी संपर्क — आमतौर पर रजिस्ट्रार का अपना पता और एक फ़ॉरवर्डिंग ईमेल — प्रतिस्थापित करती है। इसके बिना, वे विवरण खुले तौर पर क्वेरी योग्य हैं, जिससे मालिक स्पैम, सोशल-इंजीनियरिंग प्रयासों, और रजिस्ट्रार क्रेडेंशियल से समझौता करने के लिए डिज़ाइन किए गए लक्षित [फ़िशिंग](/hi/glossary/phishing/) के लक्ष्य बन जाते हैं। 2018 से GDPR प्रवर्तन ने कई रजिस्ट्री को gTLD WHOIS में व्यक्तिगत डेटा को डिफ़ॉल्ट रूप से संशोधित करने के लिए प्रेरित किया है, लेकिन TLD और रजिस्ट्रार के अनुसार सुरक्षा भिन्न होती है, इसलिए स्पष्ट रूप से एक गोपनीयता सेवा सक्षम करना अच्छा अभ्यास बना रहता है। यह समझना महत्वपूर्ण है कि गोपनीयता सुरक्षा क्या नहीं करती: यह संपर्क विवरण छुपाती है लेकिन किसी तकनीकी रूप से कुशल हमलावर को DNS एन्यूमरेशन या सर्टिफिकेट ट्रांसपेरेंसी लॉग का उपयोग करके डोमेन के बुनियादी ढाँचे को मैप करने से नहीं रोकती।
