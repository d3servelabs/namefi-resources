---
title: "சான்றிதழ் ஆணையம்"
date: '2026-10-22'
language: ta
tags: ['glossary']
authors: ['namefiteam']
draft: false
description: "சான்றிதழ் ஆணையம் அடையாளங்களைப் பொது விசைகளுடன் இணைக்கும் டிஜிட்டல் சான்றிதழ்களை வழங்குகிறது."
keywords: ["சான்றிதழ் ஆணையம்", "CA", "TLS அடையாளச் சரிபார்ப்பு"]
also_known_as: ["CA", "சான்றளிப்பு ஆணையம்"]
level: 1
sources:
  - https://www.rfc-editor.org/rfc/rfc5280#section-3.2
  - https://www.rfc-editor.org/rfc/rfc8659#section-2.2
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
  - /ta/glossary/intermediate-ca/
  - /ta/glossary/man-in-the-middle-attack/
  - /ta/glossary/dane/
  - /ta/glossary/caa/
  - /ta/glossary/certificate-transparency/
---

**சான்றிதழ் ஆணையம்**, **சான்றளிப்பு ஆணையம்** அல்லது **CA** என்றும் அழைக்கப்படுகிறது. சான்றிதழ் ஆணையம் அடையாளங்களைப் [பொது விசை](/ta/glossary/public-key/) உடன் இணைக்கும் டிஜிட்டல் சான்றிதழ்களை வழங்குகிறது. பொதுவில் நம்பகமான TLS CA, வலைத்தளச் சான்றிதழில் கையொப்பமிடும் முன் டொமைன் கட்டுப்பாட்டையும் பொருந்தும் அடையாளத் தேவைகளையும் சரிபார்க்கிறது. கிளையன்ட்கள் நம்பகமான மூல CA-ஐ அடிப்படையாகக் கொண்டு சான்றிதழ் சங்கிலியைச் சரிபார்க்கின்றன. தொடர்புடைய தனிப்பட்ட விசையை வைத்திருப்பதற்கான சேவையகத்தின் சான்றையும் கிளையன்ட்கள் சரிபார்க்கின்றன. CA கையொப்ப அதிகாரத்தை [இடைநிலை CA](/ta/glossary/intermediate-ca/) ஒன்றிடம் ஒப்படைக்க முடியும். CA நம்பிக்கை, கிளையன்ட் கொள்கையின் கீழ் அடையாளத்தை உறுதிப்படுத்துகிறது. வலைத்தள உள்ளடக்கம் நேர்மையானது என்று CA நம்பிக்கை உத்தரவாதம் தராது.
