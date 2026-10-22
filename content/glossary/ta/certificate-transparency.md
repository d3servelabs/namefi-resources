---
title: "சான்றிதழ் வெளிப்படைத்தன்மை"
date: '2026-10-22'
language: ta
tags: ['glossary']
authors: ['namefiteam']
draft: true
description: "TLS சான்றிதழ் வழங்கலைத் தனிக் கண்காணிப்புக்கும் தணிக்கைக்கும் வெளிப்படுத்த சான்றிதழ் வெளிப்படைத்தன்மை பொதுப் பதிவேடுகளைப் பயன்படுத்துகிறது."
keywords: ["சான்றிதழ் வெளிப்படைத்தன்மை", "CT", "TLS அடையாளச் சரிபார்ப்பு"]
also_known_as: ["CT"]
level: 1
sources:
  - https://www.rfc-editor.org/rfc/rfc9162#section-1
  - https://blog.google/security/protecting-chrome-and-android-users-from-compromised-emudhra-intermediate-ca-certificates/
relatedArticles:
  - /ta/blog/the-fox-it-dns-hijack/
  - /ta/blog/the-myetherwallet-bgp-dns-attack/
  - /ta/blog/the-curve-finance-dns-hijack/
  - /ta/blog/dns-on-tokenized-domains/
  - /ta/blog/dnssec-for-domain-owners/
relatedTopics:
  - /ta/topics/domain-security/
  - /ta/topics/domain-basics/
relatedSeries:
  - /ta/series/domain-apocalypse/
  - /ta/series/tokenize-your-com/
relatedGlossary:
  - /ta/glossary/certificate-authority/
  - /ta/glossary/intermediate-ca/
  - /ta/glossary/man-in-the-middle-attack/
  - /ta/glossary/dane/
  - /ta/glossary/caa/
---

**சான்றிதழ் வெளிப்படைத்தன்மை**, **CT** என்றும் அழைக்கப்படுகிறது. புதிய பதிவுகளைச் சேர்க்க மட்டுமே அனுமதிக்கும் பொதுப் பதிவேடுகளில் CT, TLS சான்றிதழ்களைப் பதிவு செய்கிறது. [சான்றிதழ் ஆணையம்](/ta/glossary/certificate-authority/) எதிர்பாராத சான்றிதழ்களை வழங்கியுள்ளதா என்று டொமைன் இயக்குநர்களும் பிற கண்காணிப்பாளர்களும் பதிவேடுகளை ஆய்வு செய்யலாம். சான்றிதழை ஏற்கும் முன் பதிவுசெய்ததற்கான சான்றைக் கிளையன்ட் கொள்கைகள் கோரலாம். பதிவுசெய்வது மட்டும் மோசடியான வழங்கலைத் தடுக்காது, சான்றிதழைத் திரும்பப்பெறவும் செய்யாது. கிளையன்ட் அமலாக்கமும் கண்காணிப்பும் வெவ்வேறு பாதுகாப்புகளை வழங்குகின்றன. CT, [CAA](/ta/glossary/caa/)-க்கு துணைபுரிகிறது: வழங்கலுக்கு முன் வழங்குநர் அனுமதியை CAA வழிநடத்துகிறது. வழங்கலுக்குப் பிறகு ஆய்வுக்காகப் பதிவுசெய்த சான்றிதழ்களை CT வெளிப்படுத்துகிறது.
