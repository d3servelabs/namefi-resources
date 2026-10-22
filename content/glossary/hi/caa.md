---
title: "CAA"
date: '2026-10-22'
language: hi
tags: ['glossary']
authors: ['namefiteam']
draft: false
description: "CAA रिकॉर्ड उन प्रमाणपत्र प्राधिकरणों को बताता है जिन्हें डोमेन प्रमाणपत्र जारी करने की अनुमति देता है।"
keywords: ["CAA", "प्रमाणपत्र प्राधिकरण को अनुमति", "TLS प्रमाणीकरण"]
also_known_as: ["प्रमाणपत्र प्राधिकरण को अनुमति"]
level: 1
sources:
  - https://www.rfc-editor.org/rfc/rfc8659#section-1
  - https://www.rfc-editor.org/rfc/rfc8659#section-5
  - https://letsencrypt.org/docs/caa/
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
  - /hi/glossary/certificate-transparency/
---

**CAA**, यानी **प्रमाणपत्र प्राधिकरण को अनुमति**, ऐसा DNS रिकॉर्ड है जो उन [प्रमाणपत्र प्राधिकरण](/hi/glossary/certificate-authority/) की पहचान करता है जिन्हें डोमेन प्रमाणपत्र जारी करने की अनुमति देता है। नियम मानने वाला CA जारी करने से पहले लागू CAA रिकॉर्ड जाँचता है। [DNSSEC (डोमेन नेम सिस्टम सुरक्षा एक्सटेंशन)](/hi/glossary/dnssec/) नीति वाले DNS उत्तर की प्रामाणिकता जाँच सकता है। CAA नियम पालन करने वाली प्रक्रियाओं में अनचाहे जारीकरण को घटाता है। CAA ब्राउज़र से दूसरे जारीकर्ताओं के प्रमाणपत्र अस्वीकार नहीं करवाता, मौजूदा प्रमाणपत्र निरस्त नहीं करता और सेंध लगी CA हस्ताक्षर कुंजी से सीधे जाली प्रमाणपत्र बनाने वाले व्यक्ति को नहीं रोकता। CAA जारीकर्ता की अनुमति बताता है। डोमेन सत्यापन एक अलग आवश्यकता बना रहता है।
