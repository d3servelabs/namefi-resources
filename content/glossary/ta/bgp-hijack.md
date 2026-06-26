---
title: BGP Hijack
date: '2026-06-22'
language: ta
tags: ['glossary']
authors: ['namefiteam']
description: IP routes-ஐ பொய்யாக அறிவித்து internet traffic-ஐ reroute செய்யும், DNS-க்கு கீழ் இருக்கும் network-layer attack.
keywords: ['BGP hijack', 'route hijacking', 'IP prefix', 'network security', 'internet routing']
level: 1
sources:
  - https://www.cloudflare.com/learning/security/glossary/bgp-hijacking/
---

**BGP hijack** (Border Gateway Protocol hijacking) என்பது network-layer attack; இதில் malicious அல்லது misconfigured autonomous system பொய்யான routing announcements-ஐ broadcast செய்து, legitimate [IP address](/ta/glossary/ip-address/) நோக்கிச் செல்ல வேண்டிய traffic-ஐ attacker infrastructure வழியாக அனுப்ப இணையத்தின் பிற routers-ஐ நம்ப வைக்கிறது. Name-to-IP mappings-ஐ கெடுக்கும் [DNS hijacking](/ta/glossary/dns-hijacking/) இலிருந்து மாறாக, BGP hijack routing layer-இல் செயல்படுகிறது; எனவே domain-இன் DNS records untouched ஆகவே இருக்கும், மேலும் [DNSSEC](/ta/glossary/dnssec/) இதற்கு பாதுகாப்பளிக்காது. Traffic reroute ஆனதும், attackers TLS certificate issuance-ஐ intercept செய்யலாம் (HTTP-based domain validation பயன்படுத்தும் CAs-இலிருந்து fraudulent certificates பெற BGP hijacks பயன்படுத்தப்பட்டுள்ளன), unencrypted traffic-ஐ படிக்கலாம், அல்லது man-in-the-middle attacks செய்யலாம். Mitigations-இல் RPKI (Resource Public Key Infrastructure) மூலம் route-origin validation மற்றும் உங்கள் prefixes-ஐ எதிர்பாராத ASes announce செய்யும் போது எச்சரிக்கும் monitoring services அடங்கும்.
