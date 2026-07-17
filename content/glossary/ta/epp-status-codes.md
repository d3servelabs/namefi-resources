---
title: EPP நிலைக் குறியீடுகள்
date: '2026-06-22'
language: ta
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['arivu-iyandhiran']
description: ஒரு டொமைனில் உள்ள தரப்படுத்தப்பட்ட கொடிகள் — பூட்டப்பட்டது, நிறுத்தி வைக்கப்பட்டது, இடமாற்றம் நிலுவையில் உள்ளது என்பன போன்ற அதன் நிலையைக் காட்டுபவை.
keywords: ['EPP நிலைக் குறியீடுகள்', 'clientHold', 'serverTransferProhibited', 'டொமைன் நிலை', 'நீக்கம் நிலுவையில்']
level: 1
sources:
  - https://www.icann.org/resources/pages/epp-status-codes-2014-06-16-en
relatedArticles:
  - /ta/blog/expired-domains-and-the-drop-cycle/
  - /ta/blog/domain-backorders-and-drop-catching/
  - /ta/blog/how-to-sell-a-domain-name-you-own/
  - /ta/blog/the-panix-com-domain-hijack/
  - /ta/blog/working-with-domain-brokers/
relatedTopics:
  - /ta/topics/domain-investing/
  - /ta/topics/domain-security/
relatedSeries:
  - /ta/series/domain-flipping-skills/
  - /ta/series/domain-apocalypse/
relatedGlossary:
  - /ta/glossary/registrar/
  - /ta/glossary/epp/
  - /ta/glossary/registry/
  - /ta/glossary/dns/
  - /ta/glossary/transfer-lock/
---

**EPP நிலைக் குறியீடுகள்** என்பவை, Extensible Provisioning Protocol ([EPP](/ta/glossary/epp/)) மூலம் வரையறுக்கப்பட்ட இயந்திரம் படிக்கக்கூடிய கொடிகள் (flags) ஆகும். எந்த ஒரு தருணத்திலும் ஒரு டொமைனில் என்னென்ன செயல்பாடுகள் அனுமதிக்கப்படுகின்றன என்பதை இவை துல்லியமாக விவரிக்கின்றன. இவை இரண்டு பெயர்வெளிகளில் (namespaces) வருகின்றன: `client*` குறியீடுகளை [பதிவாளர்](/ta/glossary/registrar/) (registrar) அமைக்கிறார்; `server*` குறியீடுகளை [பதிவேடு](/ta/glossary/registry/) (registry) அமைக்கிறது — சர்வர் குறியீடுகளுக்கு முன்னுரிமை அதிகம். அதிகமாகப் பயன்படுத்தப்படுவனவற்றில்: `clientTransferProhibited` ([இடமாற்றம் பூட்டு](/ta/glossary/transfer-lock/) — வெளியே செல்லும் இடமாற்றங்களைத் தடுக்கும்), `serverDeleteProhibited` (நீக்கத்தை எதிர்த்த பதிவேட்டு அளவிலான பாதுகாப்பு), `clientHold` (DNS தீர்வை இடைநிறுத்துகிறது; பெரும்பாலும் கட்டணம் செலுத்தாமல் இருக்கும்போது பயன்படுத்தப்படும்), மற்றும் `pendingDelete` — ஒரு டொமைன் மீண்டும் பதிவுக்குக் கிடைப்பதற்கு முன், அதன் [கருணைக் காலத்தில்](/ta/glossary/grace-period/) (grace period) இருக்கும்போது குறிக்கும் நிலை; இது [நீக்கம் நிலுவையில்](/ta/glossary/pending-delete/) என்ற நிலைக்கு அடுத்தது. இந்தக் குறியீடுகளைப் புரிந்துகொள்வது நடைமுறையில் முக்கியம்: `serverTransferProhibited` காட்டும் ஒரு டொமைனை, பதிவாளர் பூட்டை நீக்கினாலும் கூட இடமாற்ற முடியாது — இது பரிவர்த்தனை நடுவே வாங்குநர்களை அதிர்ச்சிக்கு உள்ளாக்கும்.
