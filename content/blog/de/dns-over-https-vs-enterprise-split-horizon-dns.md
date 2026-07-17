---
title: 'DNS over HTTPS vs. Enterprise Split-Horizon DNS: Eine Pattsituation, die sich nicht von selbst auflöst'
date: '2026-05-04'
language: de
tags: ['dns', 'doh', 'enterprise', 'security', 'networking']
authors: ['aileen-wright']
editors: ['victor-zhou']
translators: ['kai-kunstmann']
draft: false
description: 'DNS over HTTPS (DoH) schützt die Privatsphäre der Nutzer, indem DNS-Anfragen innerhalb von HTTPS verschlüsselt werden. Enterprise Split-Horizon-DNS ist darauf angewiesen, dass das Netzwerk diese Anfragen sehen kann. Die Kollision zwischen beiden verändert die Art und Weise, wie Unternehmensnetzwerke, Browser und Betriebssysteme mit der Namensauflösung umgehen.'
ogImage: ../../assets/dns-over-https-vs-enterprise-split-horizon-dns-og.jpg
keywords: ['DNS over HTTPS', 'DoH', 'Split-Horizon-DNS', 'Enterprise-DNS', 'DoT', 'verschlüsseltes DNS', 'internes DNS', 'Namensauflösung', 'Namefi']
relatedArticles:
  - /de/blog/what-are-tokenized-domains/
  - /de/blog/the-myetherwallet-bgp-dns-attack/
  - /de/blog/the-dnspionage-campaign/
  - /de/blog/the-godaddy-multi-year-breach/
  - /de/blog/the-fox-it-dns-hijack/
relatedTopics:
  - /de/topics/domain-security/
  - /de/topics/domain-tokenization/
relatedSeries:
  - /de/series/domain-apocalypse/
  - /de/series/name-change-game-change/
relatedGlossary:
  - /de/glossary/dns/
  - /de/glossary/registrar/
  - /de/glossary/icann/
  - /de/glossary/tld/
  - /de/glossary/web3/
---

Während der meisten Zeit in der Geschichte des Internets wurden [DNS](/de/glossary/dns/)-Anfragen im Klartext über Port 53 übertragen. Jeder auf dem Netzwerkpfad konnte sie mitlesen, protokollieren und verändern. Das war ein Datenschutzproblem, das die IETF schließlich mit zwei verschlüsselten Alternativen anging: [DNS over TLS (DoT, RFC 7858)](https://datatracker.ietf.org/doc/html/rfc7858) im Jahr 2016 und [DNS over HTTPS (DoH, RFC 8484)](https://datatracker.ietf.org/doc/html/rfc8484) im Jahr 2018.

Insbesondere DoH hat die Spielregeln grundlegend verändert, da es DNS *innerhalb* eines regulären HTTPS-Streams versteckt. Für einen Netzwerkbeobachter sieht eine DoH-Anfrage identisch aus wie jede andere TLS-Verbindung zu einem Inhaltsserver. Das ist großartig für Nutzer, die in einem unsicheren Café-Netzwerk surfen. Es ist weitaus weniger großartig für ein IT-Team in einem Unternehmen, das darauf angewiesen ist, jede DNS-Anfrage, die die Netzwerkgrenze passiert, zu sehen – und zu steuern.

Das ist die Pattsituation. Beide Seiten haben legitime, gut begründete Anforderungen. Die Standardisierungsgremien, Browserhersteller und Betriebssystemanbieter haben einen Großteil des letzten Jahrzehnts damit verbracht, zu versuchen, beides gleichzeitig zum Laufen zu bringen. Das Ergebnis ist eine Reihe von unbequemen Kompromissen, die jeder verstehen muss, der im Jahr 2026 ein Unternehmensnetzwerk betreibt.

## Was DoH eigentlich macht

Ein DoH-Client sendet DNS-Anfragen als HTTPS POST- oder GET-Requests, typischerweise an `https://dns.google/dns-query`, `https://cloudflare-dns.com/dns-query` oder einen anderen öffentlichen Resolver. Die Antwort kommt als normaler HTTPS-Response-Body zurück. Drei Eigenschaften sind dabei besonders wichtig:

- **Verschlüsselung bei der Übertragung.** Netzwerkbeobachter können weder den angefragten Namen noch die Antwort mitlesen.
- **Authentifizierter Server.** Der Client verifiziert das TLS-Zertifikat des Resolvers, sodass ein Man-in-the-Middle diesen nicht vortäuschen kann.
- **Nicht vom Web-Traffic zu unterscheiden.** Port 443, TLS 1.3, normale SNI-Muster. Es gibt keinen DNS-typischen Traffic, nach dem man filtern könnte.

Die dritte Eigenschaft ist diejenige, die den Konflikt definiert. DoT verschlüsselt Anfragen ebenfalls, tut dies aber auf einem *dedizierten* Port (853), den ein Netzwerk leicht blockieren oder umleiten kann. DoH kann nicht selektiv blockiert werden, ohne gleichzeitig auch das normale Surfen im Web zu blockieren.

## Was Enterprise Split-Horizon-DNS eigentlich macht

Die meisten großen Organisationen betreiben **Split-Horizon-DNS**. Derselbe Name (`vpn.example.corp`, `git.example.com`, `intranet.example.com`) wird in verschiedene IP-Adressen aufgelöst, je nachdem, ob die Anfrage von innerhalb oder außerhalb des Netzwerks kommt.

Innerhalb des Netzwerks:
- Der Resolver ist das interne DNS des Unternehmens, oft in Active Directory integriert.
- `git.example.com` wird möglicherweise in eine private RFC 1918-Adresse wie `10.0.4.7` aufgelöst.
- Nur intern zugängliche Zonen (`example.corp`, `example.internal`) existieren im öffentlichen Internet unter Umständen gar nicht.
- DLP- und Sicherheitstools sehen jede Anfrage und können DNS-Anfragen an bekanntermaßen bösartige Domains markieren.

Außerhalb des Netzwerks (oder auf einem privaten Gerät im heimischen WLAN):
- Dieselbe Anfrage geht an einen öffentlichen Resolver.
- `git.example.com` wird zum öffentlichen Load Balancer aufgelöst.
- Die nur intern gültigen Namen werden schlichtweg nicht aufgelöst.

Das ist nichts Exotisches. Es ist der Standard für fast jedes Unternehmen mit mehr als ein paar hundert Mitarbeitern. Es beruht auf einer entscheidenden Annahme: **Der Endpunkt nutzt den Resolver, den ihm das Netzwerk vorgibt**, sei es über DHCP, Push-Richtlinien oder eine VPN-Konfiguration.

DoH bricht mit dieser Annahme. Wenn der Browser seinen eigenen Resolver mitbringt oder das Betriebssystem den System-Resolver umgeht, hört der Endpunkt komplett auf, das interne DNS zu konsultieren. Interne Hostnamen werden nicht mehr aufgelöst. Sicherheitstools sehen die Anfragen nicht mehr, auf die sie zur Bedrohungserkennung angewiesen sind.

## Wie Browser und Betriebssysteme versuchen, damit umzugehen

Die Hersteller haben die Augen vor diesem Problem nicht verschlossen. Die heute existierenden Kompromisse sind vielschichtig und ein wenig ad hoc.

### Chromes "Automatic Upgrade"-Modell

Chromes DoH-Implementierung rüstet den System-Resolver nur dann automatisch auf DoH auf, wenn der System-Resolver selbst auf Chromes Allowlist für DoH-fähige Anbieter (Google, Cloudflare, Quad9 etc.) steht. Wenn das System so konfiguriert ist, dass es einen internen Unternehmens-Resolver nutzt, der nicht auf dieser Liste steht, belässt Chrome ihn unangetastet. Unternehmensrichtlinien können DoH auch komplett über die Einstellung [Chromes `DnsOverHttpsMode`](https://chromeenterprise.google/policies/?policy=DnsOverHttpsMode) deaktivieren.

### Firefox's TRR-Modell (Trusted Recursive Resolver)

Der Ansatz von Firefox war umstrittener. An Standorten, an denen Mozilla DoH standardmäßig aktiviert hat, nutzt Firefox einen Standard-Resolver wie Cloudflare in den USA, führt aber auch Unternehmens- und Netzwerkheuristiken durch, bevor DoH aktiviert wird. Ein wichtiges Signal ist die Canary-Domain `use-application-dns.net`: Wenn der lokale Resolver ein negatives Ergebnis zurückgibt, deaktiviert Firefox das DNS auf Anwendungsebene für Nutzer, bei denen DoH standardmäßig aktiviert war. Mozilla dokumentiert auch eine wichtige Split-Horizon-Nuance: Nur interne Namen können auf gewöhnliches DNS zurückfallen, wenn die DoH-Auflösung fehlschlägt, aber öffentliche Namen, die innerhalb des Netzwerks anders aufgelöst werden, erfordern eine Unternehmensrichtlinie, um DoH zu deaktivieren.

### Apples verschlüsseltes DNS (iOS 14+, macOS Big Sur+)

Apple ermöglicht es Apps und Konfigurationsprofilen, DoH oder DoT für das gesamte System zu aktivieren (Opt-in), respektiert aber MDM-Richtlinien, die einen spezifischen Resolver vorschreiben. Vom Unternehmen verwaltete Geräte verhalten sich von Haus aus korrekt (Out-of-the-Box).

### Natives DoH unter Windows

Seit Windows 11 sowie unter Windows Server 2022 und neuer kann das Betriebssystem selbst DoH für den System-Resolver nutzen. Gruppenrichtlinien steuern, ob DoH erlaubt, erforderlich oder verboten ist, und Windows aktiviert DoH nur bei konfigurierten DNS-Servern, die dieses Protokoll nachweislich unterstützen. Dies ist das wohl sauberste Modell: Das Sicherheitsteam wählt die Richtlinie, das Betriebssystem setzt sie durch.

Das Muster ist eindeutig: **DoH, das in einer einzelnen App (dem Browser) angesiedelt ist, ist für das Netzwerk schwer zu kontrollieren; DoH, das im Resolver auf Betriebssystemebene angesiedelt ist, lässt sich über normale MDM-Kanäle kontrollieren**. Die IETF und die Betriebssystemhersteller sind sich weitgehend einig, dass die Richtliniendurchsetzung auf die Betriebssystemebene gehört.

## Die realistischen Optionen für ein Unternehmen im Jahr 2026

Angesichts der oben genannten Tools gibt es drei praktikable Strategien und eine vierte, die nicht funktionieren wird.

### Strategie A: Alles intern, DoH blockiert

Die Bereitstellung einer Richtlinie, die DoH in jedem Browser deaktiviert, Port 443 zu bekannten öffentlichen DoH-Endpunkten blockiert und den gesamten DNS-Traffic durch den internen Resolver erzwingt. Der interne Resolver selbst kommuniziert möglicherweise via DoH mit vorgeschalteten öffentlichen Resolvern (Upstream), aber innerhalb des Netzwerks läuft alles durch ihn hindurch.

Dies ist die restriktivste Option. Sie bewahrt das Split-Horizon-Konzept perfekt und gibt den Sicherheitstools volle Sichtbarkeit. Der Preis dafür ist, dass man Blocklists für neue DoH-Endpunkte pflegen muss und jede vom Nutzer installierte App, die ihr eigenes DoH mitbringt (einige Chat-Clients, einige VPNs), sich fehlerhaft verhalten könnte.

### Strategie B: Internes DoH

Das Einrichten eines internen DoH-Servers (Cloudflared, AdGuard oder ein Windows DNS Server mit aktiviertem DoH), das Konfigurieren von Endpunkten für dessen Nutzung und das Ausführen von Split-Horizon am internen DoH-Server. Die Endpunkte erhalten verschlüsseltes DNS, ohne dass das Netzwerk an Sichtbarkeit einbüßt.

Dies ist die sauberste Option und diejenige, in deren Richtung sich die meisten großen Unternehmen bewegen. Sie bewahrt den Datenschutzvorteil (Anfragen werden im LAN verschlüsselt) und behält gleichzeitig den Sicherheitsvorteil bei (der interne Resolver sieht und kann jede Anfrage filtern). Microsoft, Google und Apple unterstützen alle OS-seitige Konfigurationen für dieses Szenario.

### Strategie C: Canary-Domain / Netzwerksignal

Das Veröffentlichen der Mozilla-Canary-Domain. Das Ausrollen der relevanten Chrome- und Edge-Richtlinien. Man verlässt sich darauf, dass die Browser erkennen, dass sie sich in einem verwalteten Netzwerk befinden, und greift auf den System-Resolver zurück. Dies ist die Option mit den geringsten Eingriffen (Lightest-Touch) und reicht für viele kleine und mittelständische Organisationen aus.

### Strategie D (funktioniert nicht): „Wir ignorieren DoH einfach“

So tun, als gäbe es den Konflikt nicht, die Standardeinstellungen belassen und davon ausgehen, dass der gesamte DNS-Traffic immer noch durch den Unternehmens-Resolver fließt. Dies ist der häufigste Zustand und führt zu vorhersehbaren Ausfällen: Entwickler melden, dass nur intern zugängliche URLs in Edge funktionieren, in Firefox jedoch nicht; Sicherheitsteams stellen Lücken in den DNS-Logs fest; und es treten intermittierende VPN-DNS-Fehler auf, deren Diagnose Stunden dauert. Das Problem verschwindet nicht. Es wird nur schwieriger, die Ursache zuzuordnen.

## Datenschutz ist nicht das Einzige, worauf DoH Einfluss nimmt

Ein subtilerer Effekt von DoH ist die Zentralisierung von Resolvern. Wenn ein Browser oder ein Betriebssystem so konfiguriert ist, dass es einen öffentlichen DoH-Resolver nutzt, kann ein größerer Teil des DNS-Datenstroms dieses Nutzers an einen einzigen Resolver-Betreiber fließen. Das automatische Modell von Chrome ist explizit darauf ausgelegt, den bisherigen DNS-Anbieter des Nutzers – wo möglich – beizubehalten, und der Standard-Rollout von Firefox ist standort- und heuristikabhängig, sodass dies nicht wortwörtlich auf „jede Anfrage“ in jeder Umgebung zutrifft. Aber der architektonische Kompromiss bleibt bestehen: Verschlüsseltes DNS kann das Vertrauen vom lokalen Netzwerk oder ISP auf eine kleinere Gruppe ausgewählter Resolver-Betreiber verlagern.

Ob dieser Kompromiss akzeptabel ist, hängt vom Bedrohungsmodell ab. Für einen Nutzer in einem feindlichen Café-Netzwerk ist die Zentralisierung des Vertrauens bei Cloudflare eine klare Verbesserung gegenüber dem Vertrauen in das Café. Für ein Unternehmen, das bereits eine vertragliche Beziehung zu seinem ISP hatte, kann es ein Rückschritt sein. Die [EFF schreibt über diesen Kompromiss](https://www.eff.org/deeplinks/2019/10/encrypted-dns-could-help-close-biggest-privacy-gap-internet) bereits seit den frühen DoH-Einführungen.

Die sauberste Antwort entspricht der oben genannten Strategie B: Betreiben Sie Ihren eigenen DoH-Resolver, sodass verschlüsseltes DNS nicht erfordert, einem Dritten den gesamten Abfrage-Stream anzuvertrauen.

## Was das für Domain-Inhaber bedeutet

Wenn Sie eine Domain betreiben, die von Unternehmen genutzt wird – eine SaaS-App, ein Entwicklertool, eine API –, sind folgende Fakten relevant:

- Ein gewisser Teil Ihrer Nutzer wird Ihre Adresse über einen öffentlichen DoH-Endpunkt auflösen, insbesondere auf nicht verwalteten Geräten oder explizit konfigurierten Browsern. CNAME-Ketten, [Subdomain](/de/glossary/subdomain/)-Delegierungen und alle cleveren DNS-Tricks, die Sie zur Personalisierung anwenden, müssen genauso funktionieren, wenn sie von einem beliebigen öffentlichen Resolver aufgelöst werden wie von einem internen Kunden-Resolver.
- Die Umgehung von DNS-basierter Zensur ist ein realer Anwendungsfall für DoH. Wenn Ihre Domain von einem staatlichen DNS-Filter blockiert wird (wie es bei mehreren verschlüsselten Messaging- und VPN-Domains der Fall war), werden Nutzer Sie über DoH von einem öffentlichen Resolver aus erreichen. Die Mechanismen sind die gleichen; die politischen Risiken sind andere.
- Ein internes Split-Horizon sollte einen öffentlich zugänglichen Namen niemals in etwas auflösen, das *nur intern sinnvoll* ist, auf eine Art und Weise, die kaputtgehen würde, wenn ein Nutzer versehentlich über DoH anfragt. Der klassische Fehler ist das rein interne `app.example.com`, das eine private IP zurückgibt, die kein DoH-Nutzer erreichen kann – dann stellt ein Remote-Mitarbeiter in einem Hotel fest, dass derselbe Hostname unerreichbar ist, und meldet einen Bug. Verwenden Sie eine klar abgetrennte, rein interne Zone (`app.example.internal`).

## Wie Namefi ins Bild passt

Namefi behandelt DNS als das öffentlich zugängliche Control Plane – den Ort, an dem globale Namensgebung auf lokale Richtlinien trifft. Unsere DNS-Workflows gehen davon aus, dass Anfragen von einem beliebigen Resolver kommen können, einschließlich DoH-Endpunkten, die wir nicht auflisten können, und die von uns veröffentlichten Namen funktionieren unabhängig davon konsistent. Für Kunden, die intern Split-Horizon betreiben, sitzen wir auf der öffentlichen Seite: Die autoritative Antwort für `example.com` ist das, was wir ausliefern, und was der interne Resolver für interne Nutzer überschreibt, ist eine Angelegenheit zwischen ihnen und der Richtlinie ihres Endpunkts.

Der wichtigere Punkt ist: Verschlüsseltes DNS ist gekommen, um zu bleiben, und das gilt auch für die unternehmensweite Sichtbarkeit. Der Weg, beides miteinander in Einklang zu bringen, besteht nicht darin, die Standards zu bekämpfen, sondern den Durchsetzungspunkt der Richtlinien vom Netzwerk auf das Betriebssystem zu verlagern. Die Standardisierungsgremien, Microsoft, Apple, Google und Mozilla haben sich alle auf diese Antwort geeinigt. Die verbleibende Arbeit ist hauptsächlich betrieblicher Natur.

## Quellen und weiterführende Literatur

- IETF — [DNS over HTTPS, RFC 8484](https://datatracker.ietf.org/doc/html/rfc8484) und [DNS over TLS, RFC 7858](https://datatracker.ietf.org/doc/html/rfc7858).
- Chrome Enterprise — [DoH-Richtlinienkontrollen](https://chromeenterprise.google/policies/?policy=DnsOverHttpsMode).
- Mozilla — [Trusted Recursive Resolver-Programm](https://wiki.mozilla.org/Trusted_Recursive_Resolver), [Canary-Domain-Verhalten](https://support.mozilla.org/en-US/kb/canary-domain-use-application-dnsnet#:~:text=A%20negative%20result%20will%20be%20a%20signal%20to%20disable%20application%20DNS%2C%20(i.e.%2C%20DoH).) und [Split-Horizon-Fallback-Leitfaden](https://support.mozilla.org/gu-IN/kb/dns-over-https-doh-faqs#:~:text=If%20Firefox%20fails%20to%20resolve%20a%20domain%20via%20DoH%2C%20it%20will%20fall%20back%20to%20the%20DNS.).
- Chromium — [Chromes Same-Provider DoH Auto-Upgrade-Modell](https://www.chromium.org/developers/dns-over-https/#:~:text=Chrome's%20auto%2Dupgrade%20approach%20does%20not%20change%20the%20DNS%20provider).
- Microsoft — [DNS over HTTPS unter Windows konfigurieren](https://learn.microsoft.com/en-us/windows-server/networking/dns/doh-client-support#:~:text=Allow%20DoH.%20Queries%20will%20be%20performed%20using%20DoH%20if%20the%20specified%20DNS%20servers%20support%20the%20protocol.).
- EFF — [Verschlüsseltes DNS könnte helfen, eine der größten Datenschutzlücken des Internets zu schließen](https://www.eff.org/deeplinks/2019/10/encrypted-dns-could-help-close-biggest-privacy-gap-internet).