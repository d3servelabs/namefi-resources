---
title: "प्रमाणपत्र पारदर्शिता"
date: '2026-10-22'
language: hi
tags: ['glossary']
authors: ['namefiteam']
draft: true
description: "प्रमाणपत्र पारदर्शिता स्वतंत्र निगरानी और लेखापरीक्षा के लिए सार्वजनिक अभिलेखों में TLS प्रमाणपत्र जारी करना दिखाती है।"
keywords: ["प्रमाणपत्र पारदर्शिता", "CT", "TLS प्रमाणीकरण"]
also_known_as: ["CT"]
level: 1
sources:
  - https://www.rfc-editor.org/rfc/rfc9162#section-1
  - https://blog.google/security/protecting-chrome-and-android-users-from-compromised-emudhra-intermediate-ca-certificates/
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
  - /hi/glossary/dane/
  - /hi/glossary/caa/
---

**प्रमाणपत्र पारदर्शिता**, जिसे **CT** भी कहते हैं, TLS प्रमाणपत्रों को सार्वजनिक अभिलेखों में दर्ज करती है जिनमें केवल नई प्रविष्टियाँ जुड़ सकती हैं। डोमेन संचालक और दूसरे निगरानीकर्ता [प्रमाणपत्र प्राधिकरण](/hi/glossary/certificate-authority/) के अप्रत्याशित जारीकरण के लिए अभिलेख जाँच सकते हैं। क्लाइंट नीतियाँ प्रमाणपत्र स्वीकार करने से पहले अभिलेखन का प्रमाण अनिवार्य कर सकती हैं। केवल अभिलेखन धोखाधड़ी वाला जारीकरण नहीं रोकता और प्रमाणपत्र निरस्त नहीं करता। क्लाइंट का प्रवर्तन और निगरानी अलग सुरक्षा देते हैं। CT, [CAA](/hi/glossary/caa/) की पूरक है: CAA जारी करने से पहले जारीकर्ता की अनुमति को निर्देशित करता है। CT बाद में जाँच के लिए दर्ज प्रमाणपत्र दिखाती है।
