---
title: WHOIS-Datenschutz
date: '2026-06-22'
language: de
priority: P1
tags: ['glossary']
authors: ['namefiteam']
description: Ein Dienst, der die persönlichen Kontaktdaten eines Registranten in öffentlichen WHOIS- oder RDAP-Einträgen maskiert.
keywords: ['WHOIS-datenschutz', 'datenschutz', 'RDAP', 'registrant-datenschutz', 'kontaktmaskierung']
also_known_as: ['Datenschutz']
level: 1
sources:
  - https://www.icann.org/rdap
relatedArticles:
  - /de/blog/from-massdrop-com-to-drop-com/
  - /de/blog/how-domain-hijacking-actually-happens/
  - /de/blog/from-getdropbox-com-to-dropbox-com/
  - /de/blog/the-fox-it-dns-hijack/
  - /de/blog/dns-over-https-vs-enterprise-split-horizon-dns/
relatedTopics:
  - /de/topics/domain-security/
  - /de/topics/domain-investing/
relatedSeries:
  - /de/series/domain-apocalypse/
  - /de/series/name-change-game-change/
relatedGlossary:
  - /de/glossary/registrar/
  - /de/glossary/dns/
  - /de/glossary/icann/
  - /de/glossary/tld/
  - /de/glossary/whois/
---

**WHOIS-Datenschutz** (auch *Datenschutz* genannt) ist ein Dienst, der von den meisten [Registraren](/de/glossary/registrar/) angeboten wird und einen Proxy-Kontakt – typischerweise die eigene Adresse des Registrars und eine Weiterleitungs-E-Mail – anstelle des echten Namens, der Adresse, der Telefonnummer und der E-Mail des [Registranten](/de/glossary/registrant/) in öffentlichen [WHOIS](/de/glossary/whois/)- und RDAP-Einträgen einsetzt. Ohne diesen Schutz sind diese Details offen abfragbar, was Eigentümer zu Zielen für Spam, Social-Engineering-Versuche und gezieltes [Phishing](/de/glossary/phishing/) macht, das darauf abzielt, Registrar-Zugangsdaten zu kompromittieren. Die DSGVO-Durchsetzung seit 2018 hat viele Registries dazu gebracht, personenbezogene Daten in gTLD-WHOIS standardmäßig zu entfernen, aber der Schutz variiert je nach TLD und Registrar, sodass das explizite Aktivieren eines Datenschutzdienstes weiterhin gute Praxis ist. Es ist wichtig zu verstehen, was der Datenschutz nicht tut: Er verbirgt Kontaktdaten, verhindert jedoch nicht, dass ein technisch versierter Angreifer durch DNS-Enumeration oder Certificate-Transparency-Logs die Infrastruktur einer Domain kartiert.
