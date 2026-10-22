---
title: "இடைமறிப்பு தாக்குதல்"
date: '2026-10-22'
language: ta
tags: ['glossary']
authors: ['namefiteam']
draft: true
description: "இடைமறிப்பு தாக்குதல் தகவல் பரிமாறும் தரப்புகளுக்கு இடையில் தாக்குதலாளரை அமர்த்தி, தகவலை இடைமறிக்கவோ மாற்றவோ செய்கிறது."
keywords: ["இடைமறிப்பு தாக்குதல்", "MITM", "TLS அடையாளச் சரிபார்ப்பு"]
also_known_as: ["MITM", "தகவல் பாதைத் தாக்குதல்"]
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc4949
  - https://datatracker.ietf.org/doc/html/rfc8446#section-1
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
  - /ta/glossary/dane/
  - /ta/glossary/caa/
  - /ta/glossary/certificate-transparency/
---

**இடைமறிப்பு தாக்குதல்**, **MITM** அல்லது **தகவல் பாதைத் தாக்குதல்** என்றும் அழைக்கப்படுகிறது. தகவல் பரிமாறும் தரப்புகளுக்கு இடையே தாக்குதலாளரை இடைமறிப்பு தாக்குதல் அமர்த்துகிறது. நேரடியாகத் தகவல் பரிமாறுவதாகத் தரப்புகள் நினைக்கலாம். ஆனால் தாக்குதலாளர் தகவலை இடைமறிக்கிறார், அனுப்புகிறார் அல்லது மாற்றுகிறார். [DNS கடத்தல்](/ta/glossary/dns-hijacking/) இணைப்பைத் தாக்குதலாளரின் பக்கம் திசைதிருப்ப முடியும். சான்றிதழ் சரிபார்ப்பு மற்றும் தனிப்பட்ட விசையை வைத்திருப்பதற்கான சான்று மூலம் மறுமுனையின் போலி அடையாளத்தை HTTPS பொதுவாகத் தடுக்கிறது. கிளையன்ட் பாதிக்கப்பட்ட ஆணையத்தைத் தொடர்ந்து ஏற்கும்போது, பாதுகாப்பு மீறப்பட்ட [சான்றிதழ் ஆணையம்](/ta/glossary/certificate-authority/) அந்த அடையாளச் சரிபார்ப்பைப் பலவீனப்படுத்தலாம். அப்போது, தாக்குதலாளரை மறுமுனையாகக் கொண்ட இணைப்பைக் குறியாக்கம் பாதுகாக்கக்கூடும்.
