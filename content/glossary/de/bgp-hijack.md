---
title: BGP-Hijack
date: '2026-06-22'
language: de
tags: ['glossary']
authors: ['namefiteam']
description: Umleitung des Internetverkehrs durch falsche Ankündigung von IP-Routen – ein Netzwerkangriff unterhalb der DNS-Ebene.
keywords: ['BGP-Hijack', 'Route-Hijacking', 'IP-Präfix', 'Netzwerksicherheit', 'Internet-Routing']
level: 1
sources:
  - https://www.cloudflare.com/learning/security/glossary/bgp-hijacking/
---

**BGP-Hijack** (Border Gateway Protocol Hijacking) ist ein Angriff auf der Netzwerkebene, bei dem ein böswilliges oder falsch konfiguriertes autonomes System falsche Routing-Ankündigungen sendet und andere Router im Internet dazu verleitet, Datenverkehr, der für eine legitime [IP-Adresse](/de/glossary/ip-address/) bestimmt ist, durch die Infrastruktur des Angreifers zu leiten. Anders als beim [DNS-Hijacking](/de/glossary/dns-hijacking/) – das die Name-zu-IP-Zuordnungen korrumpiert – wirkt ein BGP-Hijack auf der Routing-Ebene, sodass die DNS-Einträge der Domain unberührt bleiben und DNSSEC keinen Schutz dagegen bietet. Sobald der Datenverkehr umgeleitet ist, können Angreifer TLS-Zertifikatausstellungen abfangen (BGP-Hijacks wurden genutzt, um betrügerische Zertifikate von Zertifizierungsstellen zu erhalten, die HTTP-basierte Domain-Validierung verwenden), unverschlüsselten Datenverkehr lesen oder Man-in-the-Middle-Angriffe durchführen. Schutzmaßnahmen umfassen die Route-Origin-Validierung über RPKI (Resource Public Key Infrastructure) sowie Monitoring-Dienste, die warnen, wenn unerwartete autonome Systeme die eigenen Präfixe ankündigen.
