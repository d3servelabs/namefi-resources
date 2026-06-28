---
title: BGP கைப்பற்றல்
date: '2026-06-22'
language: ta
tags: ['glossary']
authors: ['namefiteam']
description: IP வழித்தடங்களை பொய்யாக அறிவித்து இணையப் போக்குவரத்தை திசைதிருப்பும் வலையமைப்பு அடுக்கு தாக்குதல் — இது DNS-க்கும் கீழான நிலையில் நடைபெறுகிறது.
keywords: ['BGP கைப்பற்றல்', 'வழிப்பாதை கைப்பற்றல்', 'IP முன்னொட்டு', 'வலையமைப்பு பாதுகாப்பு', 'இணைய வழித்தடம்']
level: 1
sources:
  - https://www.cloudflare.com/learning/security/glossary/bgp-hijacking/
relatedArticles:
  - /ta/blog/the-myetherwallet-bgp-dns-attack/
  - /ta/blog/the-dnspionage-campaign/
  - /ta/blog/the-fox-it-dns-hijack/
  - /ta/blog/the-sea-turtle-dns-espionage/
  - /ta/blog/how-domain-hijacking-actually-happens/
relatedTopics:
  - /ta/topics/domain-security/
  - /ta/topics/domain-basics/
relatedSeries:
  - /ta/series/domain-apocalypse/
  - /ta/series/name-change-game-change/
relatedGlossary:
  - /ta/glossary/dns/
  - /ta/glossary/dns-hijacking/
  - /ta/glossary/icann/
  - /ta/glossary/public-key/
  - /ta/glossary/web3/
---

**BGP கைப்பற்றல்** (Border Gateway Protocol hijacking) என்பது வலையமைப்பு அடுக்கில் நடைபெறும் ஒரு தாக்குதல் ஆகும். இதில் தீங்கிழைக்கும் அல்லது தவறாக உள்ளமைக்கப்பட்ட ஒரு தன்னாட்சி அமைப்பு (autonomous system) பொய்யான வழித்தட அறிவிப்புகளை ஒளிபரப்புகிறது — இதனால் சட்டப்பூர்வமான [IP முகவரிக்கு](/ta/glossary/ip-address/) செல்ல வேண்டிய போக்குவரத்தை, தாக்குபவரின் உள்கட்டமைப்பு வழியாக அனுப்புமாறு இணையத்தின் மற்ற திசைவிகளை நம்ப வைக்கிறது. பெயர்-முதல்-IP இணைப்புகளை சிதைக்கும் [DNS கடத்தலிலிருந்து](/ta/glossary/dns-hijacking/) மாறாக, BGP கைப்பற்றல் வழித்தட அடுக்கில் செயல்படுவதால், டொமைனின் DNS பதிவுகள் தீண்டப்படாமலே இருக்கும்; மேலும் [DNSSEC](/ta/glossary/dnssec/) இந்தத் தாக்குதலுக்கு எதிரான எந்தப் பாதுகாப்பையும் வழங்காது. போக்குவரத்து திசைதிருப்பப்பட்டுவிட்டால், தாக்குபவர்கள் TLS சான்றிதழ் வழங்கலை இடைமறிக்கலாம் (HTTP அடிப்படையிலான டொமைன் சரிபார்ப்பு பயன்படுத்தும் சான்றிதழ் அதிகாரிகளிடமிருந்து போலியான சான்றிதழ்களைப் பெற BGP கைப்பற்றல்கள் பயன்படுத்தப்பட்டுள்ளன), குறியாக்கமற்ற போக்குவரத்தை படிக்கலாம், அல்லது நடுவழி தாக்குதல்களை (man-in-the-middle attacks) மேற்கொள்ளலாம். தடுப்பு நடவடிக்கைகளில் RPKI (Resource Public Key Infrastructure) வழியான வழித்தட-தோற்றம் சரிபார்ப்பும், உங்கள் முன்னொட்டுகளை எதிர்பாராத தன்னாட்சி அமைப்புகள் அறிவிக்கும்போது எச்சரிக்கும் கண்காணிப்பு சேவைகளும் அடங்கும்.
