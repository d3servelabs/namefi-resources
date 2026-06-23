---
title: Subdomain
date: '2026-06-22'
language: de
tags: ['glossary']
authors: ['namefiteam']
description: Ein Präfix, das einer Domain hinzugefügt wird, um eine separate Adresse zu erstellen, wie blog.example.com oder app.example.com.
keywords: ['Subdomain', 'Host', 'blog.example.com', 'DNS', 'Second-Level-Domain']
level: 1
sources:
  - https://datatracker.ietf.org/doc/html/rfc1034
  - https://www.cloudflare.com/learning/dns/glossary/what-is-a-subdomain/
---

Eine **Subdomain** ist ein Präfix, das der eigenen Domain vorangestellt wird, um eine eigenständige Adresse darunter zu erstellen — `blog.example.com`, `app.example.com` oder `mail.example.com` sind allesamt Subdomains von `example.com`. Man erstellt eine Subdomain, indem man einen [DNS-Eintrag](/de/glossary/dns-record-types/) (üblicherweise A oder CNAME) bei den [Nameservern](/de/glossary/nameserver/) der übergeordneten Domain hinzufügt, ohne zusätzliche Registrierung oder Gebühr. Subdomains ermöglichen es, unter einem registrierten Namen viele Dienste bereitzustellen, weshalb sie ein grundlegender Baustein für Websites, Apps und APIs sind. In der tokenisierten Welt liegt das Eigentum bei der [registrierten](/de/glossary/registrant/) [Second-Level-Domain (SLD)](/de/glossary/second-level-domain/); Subdomains sind Konfiguration darunter und folgen demjenigen, der die [Wallet](/de/glossary/wallet/) der übergeordneten Domain kontrolliert. *Quelle(n): RFC 1034; Cloudflare-Subdomain-Glossar.*
