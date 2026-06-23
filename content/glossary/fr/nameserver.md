---
title: 'Serveur de noms (Enregistrement NS)'
date: '2026-06-22'
language: fr
tags: ['glossary']
authors: ['namefiteam']
description: Un serveur qui répond aux requêtes DNS pour un domaine ; ses enregistrements NS désignent les serveurs faisant autorité.
keywords: ['serveur de noms', 'enregistrement NS', 'serveur faisant autorité', 'délégation DNS', 'hébergement DNS']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc1034
  - https://www.cloudflare.com/learning/dns/dns-server-types/
---

Un **serveur de noms** est un serveur qui répond aux requêtes [DNS](/fr/glossary/dns/) pour un domaine, et les **enregistrements NS** au niveau du [registre](/fr/glossary/registry/) du domaine indiquent quels serveurs de noms font autorité pour ce dernier. Lorsque vous pointez un domaine vers un hébergeur DNS (Cloudflare, Route 53, le DNS propre de votre [registraire](/fr/glossary/registrar/)), vous configurez ses serveurs de noms ; ces serveurs publient ensuite les [types d'enregistrements](/fr/glossary/dns-record-types/) — A, MX, TXT et autres — qui acheminent le trafic et le courrier. La tokenisation d'un domaine ne modifie pas cette couche : les serveurs de noms et leurs enregistrements continuent de fonctionner exactement comme avant, tandis que la propriété et le transfert passent à une couche [on-chain](/fr/glossary/on-chain/) contrôlée par [portefeuille](/fr/glossary/wallet/).

*Source(s) : RFC 1034 ; types de serveurs DNS Cloudflare.*
