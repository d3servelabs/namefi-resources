---
title: TTL (நேரம் முடியும் வரை இயங்கும் கால அளவு)
date: '2026-06-22'
language: ta
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['arivu-iyandhiran']
description: ஒரு DNS பதிவை மறு-தேடலுக்கு முன் தீர்வகங்கள் எத்தனை நொடிகள் தங்கள் தற்காலிக நினைவகத்தில் வைத்திருக்கலாம் என்பதை தீர்மானிக்கும் மதிப்பு.
keywords: ['TTL', 'நேரம் முடியும் வரை இயங்கும் கால அளவு', 'DNS தற்காலிக நினைவகம்', 'DNS பரவல்', 'பதிவு தற்காலிக சேமிப்பு']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc1035
  - https://www.cloudflare.com/learning/dns/glossary/time-to-live-ttl/
relatedArticles:
  - /ta/blog/the-panix-com-domain-hijack/
  - /ta/blog/the-godaddy-multi-year-breach/
  - /ta/blog/the-sushiswap-miso-insider-attack/
  - /ta/blog/working-with-domain-brokers/
  - /ta/blog/from-twitter-com-to-x-com/
relatedTopics:
  - /ta/topics/domain-security/
  - /ta/topics/domain-investing/
relatedSeries:
  - /ta/series/domain-apocalypse/
  - /ta/series/domain-flipping-skills/
relatedGlossary:
  - /ta/glossary/dns/
  - /ta/glossary/dns-propagation/
  - /ta/glossary/registrar/
  - /ta/glossary/icann/
  - /ta/glossary/registry/
---

**TTL (time to live)** என்பது ஒவ்வொரு [DNS பதிவிலும்](/ta/glossary/dns-record-types/) இணைக்கப்பட்ட ஒரு நொடி-அலகு மதிப்பாகும். இந்த மதிப்பு [தீர்வகங்களுக்கு](/ta/glossary/dns-resolver/) (resolvers) மறு-தேடல் செய்வதற்கு முன் தாங்கள் பதிலை எத்தனை நேரம் தற்காலிக நினைவகத்தில் வைத்திருக்கலாம் என்று அறிவிக்கிறது. குறுகிய TTL (உதாரணமாக 300 நொடிகள்) மாற்றங்கள் விரைவாக நடைமுறைக்கு வர உதவும், ஆனால் அதிக அளவிலான தேடல்களை உருவாக்கும்; நீண்ட TTL (86,400 நொடிகள் = ஒரு நாள்) திறனுடையதாக இருக்கும், ஆனால் ஒரு மாற்றம் தற்காலிக நினைவகங்களில் தாமதமாக பிரதிபலிக்கும். நீங்கள் மாற்றம் செய்ய திட்டமிடும் ஒரு நாளுக்கு முன்பாக TTL-ஐ குறைப்பது, விரைவான [DNS பரவலுக்கான](/ta/glossary/dns-propagation/) நிலையான உத்தியாகும்.
