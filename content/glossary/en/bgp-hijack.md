---
title: BGP Hijack
date: '2026-06-22'
language: en
tags: ['glossary']
authors: ['namefiteam']
description: Rerouting internet traffic by falsely announcing IP routes, a network-layer attack that sits below DNS.
keywords: ['BGP hijack', 'route hijacking', 'IP prefix', 'network security', 'internet routing']
level: 1
sources:
  - https://www.cloudflare.com/learning/security/glossary/bgp-hijacking/
---

**BGP hijack** (Border Gateway Protocol hijacking) is a network-layer attack in which a malicious or misconfigured autonomous system broadcasts false routing announcements, convincing other routers on the internet to send traffic destined for a legitimate [IP address](/en/glossary/ip-address/) through the attacker's infrastructure instead. Unlike [DNS hijacking](/en/glossary/dns-hijacking/) — which corrupts name-to-IP mappings — a BGP hijack operates at the routing layer, so the domain's DNS records remain untouched and DNSSEC provides no protection against it. Once traffic is rerouted, attackers can intercept TLS certificate issuance (BGP hijacks have been used to obtain fraudulent certificates from CAs that use HTTP-based domain validation), read unencrypted traffic, or perform man-in-the-middle attacks. Mitigations include route-origin validation via RPKI (Resource Public Key Infrastructure) and monitoring services that alert when unexpected ASes announce your prefixes. The attack is relevant to domain owners because it can redirect traffic from a correctly configured [DNS](/en/glossary/dns/) domain entirely at the infrastructure level, and Namefi's on-chain ownership records offer no defense at this layer — correct IP routing and RPKI adoption are the responsible mitigations. *Source: Cloudflare Learning — BGP Hijacking.*
