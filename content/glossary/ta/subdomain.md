---
title: துணை-டொமைன்
date: '2026-06-22'
language: ta
tags: ['glossary']
authors: ['namefiteam']
description: ஒரு டொமைனுக்கு தனிப்பட்ட முகவரியை உருவாக்க அதன் முன்னால் சேர்க்கப்படும் முன்னொட்டு; உதாரணமாக blog.example.com அல்லது app.example.com.
keywords: ['துணை-டொமைன்', 'புரவலன்', 'blog.example.com', 'DNS', 'இரண்டாம் நிலை டொமைன்']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc1034
  - https://www.cloudflare.com/learning/dns/glossary/what-is-a-subdomain/
relatedArticles:
  - /ta/blog/how-domain-hijacking-actually-happens/
  - /ta/blog/what-is-a-tld/
  - /ta/blog/domain-hacks-explained/
  - /ta/blog/domain-terminology-guide/
  - /ta/blog/dns-over-https-vs-enterprise-split-horizon-dns/
relatedTopics:
  - /ta/topics/domain-security/
  - /ta/topics/domain-basics/
relatedSeries:
  - /ta/series/domain-apocalypse/
  - /ta/series/domain-flipping-skills/
relatedGlossary:
  - /ta/glossary/dns/
  - /ta/glossary/tld/
  - /ta/glossary/registrar/
  - /ta/glossary/registry/
  - /ta/glossary/domain-forwarding/
---

ஒரு **துணை-டொமைன்** என்பது உங்கள் டொமைனின் கீழ் தனிப்பட்ட முகவரியை உருவாக்க அதன் முன்னால் சேர்க்கப்படும் முன்னொட்டாகும் — `blog.example.com`, `app.example.com`, அல்லது `mail.example.com` அனைத்தும் `example.com` இன் துணை-டொமைன்களே. தாய் டொமைனின் [பெயர் சேவையகங்களில்](/ta/glossary/nameserver/) ஒரு [DNS பதிவை](/ta/glossary/dns-record-types/) (பொதுவாக A அல்லது CNAME) சேர்ப்பதன் மூலம் இதை உருவாக்கலாம்; கூடுதல் பதிவு அல்லது கட்டணம் எதுவும் தேவையில்லை. ஒரே பதிவுசெய்யப்பட்ட பெயரில் பல சேவைகளை இயக்க துணை-டொமைன்கள் உதவுகின்றன — இதனால் இவை தளங்கள், பயன்பாடுகள் மற்றும் APIகளின் அடிப்படை கட்டுமானக் கூறாக விளங்குகின்றன.
