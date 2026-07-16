---
title: IDN (சர்வதேச டொமைன் பெயர்) / Punycode
date: '2026-06-22'
language: ta
priority: P1
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['arivu-iyandhiran']
description: ASCII அல்லாத எழுத்துகளைப் பயன்படுத்தும் டொமைன் பெயர்; DNS-இல் xn-- என்று தொடங்கும் ASCII Punycode வடிவில் குறியாக்கப்படும்.
keywords: ['IDN', 'சர்வதேச டொமைன் பெயர்', 'Punycode', 'xn--', 'யூனிகோட் டொமைன்', 'ஒத்த-தோற்ற எழுத்து தாக்குதல்']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc5890
  - https://www.icann.org/resources/pages/idn-2012-02-25-en
relatedArticles:
  - /ta/blog/what-is-a-tld/
  - /ta/blog/from-discordapp-com-to-discord-com/
  - /ta/blog/the-lenovo-com-dns-hijack/
  - /ta/blog/cybersquatting-vs-domaining-udrp-acpa/
  - /ta/blog/domain-hacks-explained/
relatedTopics:
  - /ta/topics/domain-security/
  - /ta/topics/domain-investing/
relatedSeries:
  - /ta/series/domain-flipping-skills/
  - /ta/series/domain-apocalypse/
relatedGlossary:
  - /ta/glossary/registrar/
  - /ta/glossary/registry/
  - /ta/glossary/tld/
  - /ta/glossary/dns/
  - /ta/glossary/phishing/
---

**IDN (சர்வதேச டொமைன் பெயர் — Internationalized Domain Name)** என்பது ASCII அல்லாத எழுத்துகளைக் கொண்ட டொமைன் பெயர் ஆகும் — உதாரணமாக `münchen.de`, `中国.cn`, அல்லது emoji டொமைன் — இதனால் அடிப்படை லத்தீன் எழுத்துகளுக்கு அப்பால் உள்ள எழுத்து முறைகளிலும் பெயர்களை எழுதலாம். [DNS](/ta/glossary/dns/) அமைப்பு ASCII மட்டுமே கையாள்வதால், ஒரு IDN-ஐ **Punycode** எனப்படும் ASCII இணக்கமான சரமாக மாற்றுகிறார்கள்; இந்தச் சரம் எப்போதும் `xn--` என்னும் முன்னொட்டுடன் தொடங்கும் (எடுத்துக்காட்டாக, `münchen` என்பது `xn--mnchen-3ya` ஆகும்). [Registry](/ta/glossary/registry/) மற்றும் [Registrar](/ta/glossary/registrar/) நிறுவனங்கள் [TLD](/ta/glossary/tld/) அளவில் IDN-களை ஆதரிக்கின்றன; எனினும் இவற்றில் அறிந்த ஒரு அபாயம் உள்ளது: பார்வைக்கு ஒரே மாதிரி தோன்றும் எழுத்துகளை (*homograph*) பயன்படுத்தி [phishing](/ta/glossary/phishing/) தாக்குதல்களுக்கான போலி டொமைன்களை உருவாக்கலாம்.
