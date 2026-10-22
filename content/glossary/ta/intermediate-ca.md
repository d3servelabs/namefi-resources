---
title: "இடைநிலை CA"
date: '2026-10-22'
language: ta
tags: ['glossary']
authors: ['namefiteam']
draft: true
description: "இடைநிலை CA நம்பிக்கை ஆதாரத்திற்குச் செல்லும் சங்கிலி வழியாக ஒப்படைத்த சான்றிதழ் கையொப்ப அதிகாரத்தைக் கொண்டுள்ளது."
keywords: ["இடைநிலை CA", "இடைநிலை சான்றிதழ் ஆணையம்", "TLS அடையாளச் சரிபார்ப்பு"]
also_known_as: ["இடைநிலை சான்றிதழ் ஆணையம்"]
level: 1
sources:
  - https://www.rfc-editor.org/rfc/rfc5280#section-6
  - https://bugzilla.mozilla.org/show_bug.cgi?id=2083449#c0
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
  - /ta/glossary/man-in-the-middle-attack/
  - /ta/glossary/dane/
  - /ta/glossary/caa/
  - /ta/glossary/certificate-transparency/
---

**இடைநிலை CA**, **இடைநிலை சான்றிதழ் ஆணையம்** என்றும் அழைக்கப்படுகிறது. மற்றொரு [சான்றிதழ் ஆணையம்](/ta/glossary/certificate-authority/) சான்றிதழ் சங்கிலி வழியாக ஒப்படைக்கும் கையொப்ப அதிகாரத்தை இடைநிலை CA கொண்டுள்ளது. சங்கிலி பொதுவாக வலைத்தளச் சான்றிதழை நம்பகமான மூல CA உடன் இணைக்கிறது. சில நேரங்களில் சங்கிலி பல இடைநிலைச் சான்றிதழ்கள் வழியாகச் செல்கிறது. சான்றிதழ் கட்டுப்பாடுகள் ஒப்படைத்த அதிகாரத்தைக் கட்டுப்படுத்துகின்றன. இடைநிலை CA-இன் [தனிப்பட்ட விசை](/ta/glossary/private-key/) பாதுகாப்பு மீறப்பட்டால், அந்த அதிகார வரம்புக்குள் மோசடியான சான்றிதழ் கையொப்பங்கள் சாத்தியமாகலாம். கிளையன்ட்கள் பொருந்தும் நம்பிக்கை நீக்கல் அல்லது திரும்பப்பெறல் புதுப்பிப்புகளைப் பயன்படுத்த வேண்டும். ஒரு வலைத்தளச் சான்றிதழை மாற்றுவதால் மட்டும் மற்ற கிளையன்ட்களின் நம்பிக்கை முடிவுகளிலிருந்து பாதுகாப்பு மீறப்பட்ட இடைநிலைச் சாவி நீங்காது.
