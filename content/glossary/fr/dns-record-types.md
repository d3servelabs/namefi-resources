---
title: 'Types d''enregistrements DNS (A, AAAA, CNAME, MX, TXT)'
date: '2026-06-22'
language: fr
tags: ['glossary']
authors: ['namefiteam']
editors: ['victor-zhou']
translators: ['alan-machin']
description: "Les entrées d'une zone qui associent un domaine à des adresses et des services — A, AAAA, CNAME, MX, TXT et plus encore."
keywords: ['enregistrements DNS', 'enregistrement A', 'enregistrement AAAA', 'CNAME', 'enregistrement MX', 'enregistrement TXT']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc1035
  - https://www.cloudflare.com/learning/dns/dns-records/
relatedArticles:
  - /fr/blog/dns-on-tokenized-domains/
  - /fr/blog/how-domain-hijacking-actually-happens/
  - /fr/blog/the-lenovo-com-dns-hijack/
  - /fr/blog/the-dnspionage-campaign/
  - /fr/blog/what-are-tokenized-domains/
relatedTopics:
  - /fr/topics/domain-security/
  - /fr/topics/domain-tokenization/
relatedSeries:
  - /fr/series/domain-apocalypse/
  - /fr/series/tokenize-your-com/
relatedGlossary:
  - /fr/glossary/dns/
  - /fr/glossary/registrar/
  - /fr/glossary/tld/
  - /fr/glossary/icann/
  - /fr/glossary/registry/
---

Les **types d'enregistrements DNS** sont les entrées individuelles dans la zone d'un domaine qui indiquent au [DNS](/fr/glossary/dns/) où envoyer les différents types de trafic. Les plus courants sont **A** (associe un nom à une adresse IPv4), **AAAA** (IPv6), **CNAME** (crée un alias d'un nom vers un autre), **MX** (achemine les courriels) et **TXT** (texte libre utilisé pour SPF, DKIM et la vérification de domaine). Ces enregistrements sont publiés par les [serveurs de noms](/fr/glossary/nameserver/) vers lesquels vous déléguez un domaine, et ce sont eux qui permettent concrètement à un site web de se charger ou à un courriel d'être distribué. La tokenisation d'un domaine laisse tout cela intact : les enregistrements continuent de se résoudre normalement tandis que la propriété et le transfert passent à une couche [on-chain](/fr/glossary/on-chain/) contrôlée par [portefeuille](/fr/glossary/wallet/).

*Source(s) : RFC 1035 ; enregistrements DNS Cloudflare.*
