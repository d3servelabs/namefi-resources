---
title: டொமைன் திருப்பி அனுப்புதல்
date: '2026-06-22'
language: ta
tags: ['glossary']
authors: ['namefiteam']
description: ஒரு டொமைனுக்கு வரும் பார்வையாளர்களை தானாகவே வேறொரு முகவரிக்கு அனுப்பும் அமைப்பு, பெரும்பாலும் 301 திருப்புதல் வழியாக.
keywords: ['டொமைன் திருப்பி அனுப்புதல்', '301 திருப்புதல்', 'URL திருப்புதல்', 'DNS', 'டொமைன் நிர்வாகம்']
level: 1
sources:
  - https://developers.google.com/search/docs/crawling-indexing/301-redirects
relatedArticles:
  - /ta/blog/how-domain-hijacking-actually-happens/
  - /ta/blog/the-fox-it-dns-hijack/
  - /ta/blog/the-lenovo-com-dns-hijack/
  - /ta/blog/from-twitter-com-to-x-com/
  - /ta/blog/the-godaddy-multi-year-breach/
relatedTopics:
  - /ta/topics/domain-security/
  - /ta/topics/domain-investing/
relatedSeries:
  - /ta/series/domain-apocalypse/
  - /ta/series/name-change-game-change/
relatedGlossary:
  - /ta/glossary/301-redirect/
  - /ta/glossary/registrar/
  - /ta/glossary/dns/
  - /ta/glossary/icann/
  - /ta/glossary/tld/
---

**டொமைன் திருப்பி அனுப்புதல்** (*URL திருப்பி அனுப்புதல்* அல்லது *301 திருப்புதல்* என்றும் அழைக்கப்படும்) என்பது ஒரு டொமைனுக்கு வரும் ஒவ்வொரு பார்வையாளரையும் தானாகவே வேறொரு இலக்கு URL-க்கு அனுப்பும் ஒரு கட்டமைப்பாகும். [301 திருப்புதல்](/ta/glossary/301-redirect/) வகை, இந்த மாற்றம் நிரந்தரமானது என்று தேடுபொறிகளுக்கு சமிக்ஞை அனுப்புகிறது; இதன் மூலம் அசல் டொமைனின் இணைப்பு மதிப்பில் பெரும்பகுதி இலக்கு தளத்திற்கு கடத்தப்படும் — எனவே வணிக முத்திரைகளை ஒருங்கிணைக்கும்போது அல்லது போக்குவரத்தை இடம் பெயர்க்கும்போது இந்த முறையே சிறந்த தேர்வாக அமைகிறது. [பதிவாளரின்](/ta/glossary/registrar/) கட்டுப்பாட்டு குழுவில் (control panel) அல்லது திருப்புதல் விதியை நடைமுறைப்படுத்தும் இணைய சேவையகத்தை சுட்டும் [DNS பதிவு வகை](/ta/glossary/dns-record-types/) அமைப்பதன் மூலம் இந்த திருப்பி அனுப்புதலை கட்டமைக்கலாம். பொதுவான பயன்பாட்டு நிகழ்வாக, பொருத்தமான [துணை டொமைனை](/ta/glossary/subdomain/) அல்லது தட்டச்சுப் பிழை வகை டொமைனை வாங்கி, அதை முதன்மை தளத்திற்கு திருப்பி அனுப்புவதன் மூலம் தவறான வழியில் வரும் போக்குவரத்தை கைப்பற்றலாம். திருப்பி அனுப்புதல் என்பது முழு DNS வழிப்பிணைப்பிலிருந்து (DNS delegation) வேறுபட்டது: டொமைன் இன்னும் DNS வழியாகவே தீர்மானிக்கப்படும், ஆனால் HTTP அளவிலான வழிகாட்டுதல்கள் உலாவியை வேறொரு இடத்திற்கு திருப்பும்.
