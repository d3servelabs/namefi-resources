---
title: "मध्यस्थ हमला"
date: '2026-10-22'
language: hi
tags: ['glossary']
authors: ['namefiteam']
draft: false
description: "मध्यस्थ हमला संचार करने वाले पक्षों के बीच हमलावर को रखता है, ताकि हमलावर संचार पकड़ या बदल सके।"
keywords: ["मध्यस्थ हमला", "MITM", "TLS प्रमाणीकरण"]
also_known_as: ["MITM", "संचार पथ पर हमला"]
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc4949
  - https://datatracker.ietf.org/doc/html/rfc8446#section-1
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
  - /hi/glossary/dane/
  - /hi/glossary/caa/
  - /hi/glossary/certificate-transparency/
---

**मध्यस्थ हमला**, जिसे **MITM** या **संचार पथ पर हमला** भी कहते हैं, संचार करने वाले पक्षों के बीच हमलावर को रखता है। हमलावर संचार पकड़ता, आगे पहुँचाता या बदलता है। पक्षों को लग सकता है कि वे सीधे संवाद कर रहे हैं। [DNS हाइजैकिंग](/hi/glossary/dns-hijacking/) कनेक्शन को हमलावर की ओर मोड़ सकती है। HTTPS सामान्यतः प्रमाणपत्र सत्यापन और निजी कुंजी रखने के प्रमाण से दूसरे छोर की पहचान के दुरुपयोग का मुकाबला करता है। सेंध लगा [प्रमाणपत्र प्राधिकरण](/hi/glossary/certificate-authority/) उस प्रमाणीकरण को कमजोर कर सकता है, जब क्लाइंट प्रभावित प्राधिकरण को अभी भी स्वीकार करता है। तब एन्क्रिप्शन ऐसे कनेक्शन की रक्षा कर सकता है जिसके दूसरे छोर पर हमलावर है।
