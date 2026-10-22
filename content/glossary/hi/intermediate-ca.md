---
title: "मध्यवर्ती CA"
date: '2026-10-22'
language: hi
tags: ['glossary']
authors: ['namefiteam']
draft: true
description: "मध्यवर्ती CA विश्वास आधार तक पहुँचने वाली शृंखला से प्रत्यायोजित प्रमाणपत्र हस्ताक्षर अधिकार रखता है।"
keywords: ["मध्यवर्ती CA", "मध्यवर्ती प्रमाणपत्र प्राधिकरण", "TLS प्रमाणीकरण"]
also_known_as: ["मध्यवर्ती प्रमाणपत्र प्राधिकरण"]
level: 1
sources:
  - https://www.rfc-editor.org/rfc/rfc5280#section-6
  - https://bugzilla.mozilla.org/show_bug.cgi?id=2083449#c0
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
  - /hi/glossary/man-in-the-middle-attack/
  - /hi/glossary/dane/
  - /hi/glossary/caa/
  - /hi/glossary/certificate-transparency/
---

**मध्यवर्ती CA**, जिसे **मध्यवर्ती प्रमाणपत्र प्राधिकरण** भी कहते हैं, वह हस्ताक्षर अधिकार रखता है जिसे दूसरा [प्रमाणपत्र प्राधिकरण](/hi/glossary/certificate-authority/) प्रमाणपत्र शृंखला से सौंपता है। शृंखला सामान्यतः वेबसाइट प्रमाणपत्र को विश्वसनीय मूल CA से जोड़ती है। कभी-कभी शृंखला कई मध्यवर्ती प्रमाणपत्रों से गुजरती है। प्रमाणपत्र की पाबंदियाँ सौंपे गए अधिकार को सीमित करती हैं। मध्यवर्ती CA की [प्राइवेट की](/hi/glossary/private-key/) में सेंध उस अधिकार के भीतर धोखाधड़ी वाले प्रमाणपत्र हस्ताक्षर संभव बना सकती है। क्लाइंट को संबंधित अविश्वास या निरस्तीकरण अपडेट लागू करने चाहिए। किसी एक वेबसाइट का प्रमाणपत्र बदलने से दूसरे क्लाइंट के भरोसे के निर्णयों से सेंध लगी मध्यवर्ती कुंजी नहीं हटती।
