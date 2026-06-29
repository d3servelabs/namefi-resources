---
title: DNS பரவல்
date: '2026-06-22'
language: ta
tags: ['glossary']
authors: ['namefiteam']
description: DNS மாற்றம் செய்யப்பட்டதிலிருந்து அது இணையம் முழுவதிலும் தெரியும் வரையிலான தாமதம்; தேக்ககப்படுத்தப்பட்ட பழைய பதிவுகள் தீர்விகள் முழுவதும் காலாவதியாகும் வரை காத்திருக்கும் நேரம்.
keywords: ['DNS பரவல்', 'DNS புதுப்பிப்பு தாமதம்', 'TTL', 'DNS தேக்ககம்', 'பெயர் சேவையக மாற்றம்']
level: 1
sources:
  - https://www.cloudflare.com/learning/dns/glossary/time-to-live-ttl/
  - https://datatracker.ietf.org/doc/html/rfc1035
relatedArticles:
  - /ta/blog/the-curve-finance-dns-hijack/
  - /ta/blog/the-malaysia-airlines-dns-hijack/
  - /ta/blog/the-perl-com-domain-theft/
  - /ta/blog/dns-on-tokenized-domains/
  - /ta/blog/from-twitter-com-to-x-com/
relatedTopics:
  - /ta/topics/domain-security/
  - /ta/topics/domain-tokenization/
relatedSeries:
  - /ta/series/domain-apocalypse/
  - /ta/series/name-change-game-change/
relatedGlossary:
  - /ta/glossary/dns/
  - /ta/glossary/ttl/
  - /ta/glossary/registrar/
  - /ta/glossary/icann/
  - /ta/glossary/registry/
---

**DNS பரவல்** என்பது ஒரு [DNS](/ta/glossary/dns/) மாற்றம் செய்யப்பட்டதிலிருந்து அந்த மாற்றம் இணையம் முழுவதிலும் தெரியத் தொடங்கும் வரையிலான தாமதமாகும். உலகமெங்கும் உள்ள [தீர்விகள்](/ta/glossary/dns-resolver/) பழைய விடையை தேக்ககத்தில் வைத்திருக்கின்றன; அந்தப் பழைய விடையின் [TTL](/ta/glossary/ttl/) காலாவதியாகும் வரை அவை புதிய விடையை திருப்பித் தர மாட்டா. இதனால், ஒரு புதிய [பதிவு](/ta/glossary/dns-record-types/) அல்லது [பெயர் சேவையக](/ta/glossary/nameserver/) மாற்றம் உடனடியாக எங்கும் பரவுவதில்லை — சில நிமிடங்களிலிருந்து ஒரு சில நாட்கள் வரை படிப்படியாகவே பரவும். உலகம் முழுவதிலும் ஒரே நேரத்தில் புதுப்பித்துக்கொள்ள ஒரு மைய DNS இல்லை; பரவல் என்பது தேக்ககங்களின் காலாவதி நேரம் முடிவதே தவிர வேறு எதுவுமில்லை. நடைமுறை தீர்வு: திட்டமிட்ட மாற்றத்திற்கு முன்னதாகவே TTL ஐ குறைத்துவிடுவது.
