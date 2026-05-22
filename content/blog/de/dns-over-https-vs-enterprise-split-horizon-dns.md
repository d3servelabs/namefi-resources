---
title: 'DNS over HTTPS vs. Enterprise Split-Horizon DNS: Ein Konflikt, der sich nicht von selbst löst'
date: '2026-05-04'
language: de
tags: ['dns', 'doh', 'enterprise', 'security', 'networking']
authors: ['namefiteam']
draft: false
description: 'DNS over HTTPS (DoH) schützt die Privatsphäre der Nutzer, indem es DNS-Abfragen innerhalb von HTTPS verschlüsselt. Enterprise Split-Horizon DNS ist darauf angewiesen, dass das Netzwerk diese Abfragen einsehen kann. Die Kollision zwischen beiden verändert, wie Unternehmensnetzwerke, Browser und Betriebssysteme die Namensauflösung handhaben.'
ogImage: ../../assets/dns-over-https-vs-enterprise-split-horizon-dns-og.jpg
keywords: ['dns over https', 'doh', 'split horizon dns', 'enterprise dns', 'dot', 'verschlüsseltes dns', 'internes dns', 'namensauflösung', 'namefi']
---

Während des größten Teils der Geschichte des Internets wurden DNS-Abfragen im Klartext über Port 53 übertragen. Jeder auf dem Netzwerkpfad konnte sie lesen, protokollieren und modifizieren. Dies war ein Datenschutzproblem, das die IETF schließlich mit zwei verschlüsselten Alternativen anging: [DNS over TLS (DoT, RFC 7858)](https://datatracker.ietf.org/doc/html/rfc7858) im Jahr 2016 und [DNS over HTTPS (DoH, RFC 8484)](https://datatracker.ietf.org/doc/html/rfc8484) im Jahr 2018.

Insbesondere DoH hat die Spielregeln verändert, da es DNS *innerhalb* eines regulären HTTPS-Datenstroms verbirgt. Für einen Netzwerkbeobachter sieht eine DoH-Abfrage identisch aus wie jede andere TLS-Verbindung zu einem Content-Server. Das ist großartig für Nutzer, die in einem unsicheren Café-Netzwerk surfen. Es ist jedoch weit weniger großartig für ein IT-Team im Unternehmen, das darauf angewiesen ist, jede DNS-Abfrage, die die Netzwerkgrenze überschreitet, zu sehen – und zu steuern.

Hier entsteht der Konflikt. Beide Seiten haben legitime, klar formulierte Anforderungen. Standardisierungsgremien sowie Browser- und Betriebssystemhersteller haben fast ein Jahrzehnt damit verbracht, zu versuchen, beides gleichzeitig zum Laufen zu bringen. Das Ergebnis ist eine Reihe unbequemer Kompromisse, die jeder, der im Jahr 2026 ein Unternehmensnetzwerk betreibt, verstehen muss.

## Was DoH eigentlich tut

Ein DoH-Client sendet DNS-Abfragen als HTTPS POST- oder GET-Anfragen, typischerweise an `https://dns.google/dns-query`, `https://cloudflare-dns.com/dns-query` oder einen anderen öffentlichen Resolver. Die Antwort wird als normaler HTTPS-Antwort-Body zurückgegeben. Drei Eigenschaften sind dabei entscheidend:

- **Verschlüsselung bei der Übertragung.** Netzwerkbeobachter können weder den abgefragten Namen noch die Antwort lesen.
- **Authentifizierter Server.** Der Client verifiziert das TLS-Zertifikat des Resolvers, sodass ein Man-in-the-Middle-Angreifer sich nicht als dieser ausgeben kann.
- **Nicht von Web-Traffic zu unterscheiden.** Port 443, TLS 1.3, normale SNI-Muster. Es gibt keinen spezifischen DNS-Traffic, nach dem gefiltert werden könnte.

Die dritte Eigenschaft ist diejenige, die den Konflikt definiert. DoT verschlüsselt Abfragen ebenfalls, tut dies jedoch auf einem *dedizierten* Port (853), den ein Netzwerk leicht blockieren oder umleiten kann. DoH kann nicht selektiv blockiert werden, ohne gleichzeitig auch das normale Surfen im Web zu blockieren.

## Was Enterprise Split-Horizon DNS eigentlich tut

Die meisten großen Organisationen betreiben **Split-Horizon DNS**. Derselbe Name (`vpn.example.corp`, `git.example.com`, `intranet.example.com`) wird in verschiedene IP-Adressen aufgelöst, je nachdem, ob die Abfrage von innerhalb oder außerhalb des Netzwerks kommt.

Innerhalb des Netzwerks:
- Der Resolver ist das interne DNS des Unternehmens, oft in Active Directory integriert.
- `git.example.com` könnte zu einer privaten RFC 1918-Adresse wie `10.0.4.7` aufgelöst werden.
- Ausschließlich interne Zonen (`example.corp`, `example.internal`) existieren im öffentlichen Internet möglicherweise gar nicht.
- DLP- und Sicherheitstools sehen jede Abfrage und können DNS-Anfragen zu bekanntermaßen bösartigen Domains markieren.

Außerhalb des Netzwerks (oder auf einem persönlichen Gerät im heimischen WLAN):
- Dieselbe Abfrage geht an einen öffentlichen Resolver.
- `git.example.com` wird zum öffentlichen Load Balancer aufgelöst.
- Die rein internen Namen werden schlichtweg nicht aufgelöst.

Das ist nicht exotisch. Es ist der Standard für fast jedes Unternehmen mit mehr als ein paar hundert Mitarbeitern. Es beruht auf einer entscheidenden Annahme: **Der Endpunkt nutzt den Resolver, den ihm das Netzwerk vorgibt**, sei es über DHCP, Push-Richtlinien oder VPN-Konfiguration.

DoH bricht mit dieser Annahme. Wenn der Browser einen eigenen Resolver mitbringt oder das Betriebssystem den System-Resolver umgeht, hört der Endpunkt komplett auf, das interne DNS abzufragen. Interne Hostnamen können nicht mehr aufgelöst werden. Sicherheitstools sehen die Abfragen nicht mehr, auf die sie zur Bedrohungserkennung angewiesen sind.

## Wie Browser und Betriebssysteme versucht haben, damit umzugehen

Die Hersteller waren gegenüber diesem Problem nicht blind. Die heute existierenden Kompromisse sind vielschichtig und ein wenig ad hoc entstanden.

### Chromes „Automatic Upgrade“-Modell

Die DoH-Implementierung von Chrome wertet den System-Resolver nur dann auf DoH auf, wenn dieser selbst auf der Chrome-Allowlist für DoH-fähige Anbieter (Google, Cloudflare, Quad9 usw.) steht. Wenn das System so konfiguriert ist, dass es einen internen Unternehmens-Resolver verwendet, der nicht auf der Allowlist steht, belässt Chrome ihn im Normalzustand. Unternehmensrichtlinien können DoH auch über die Einstellung [`DnsOverHttpsMode` von Chrome](https://chromeenterprise.google/policies/?policy=DnsOverHttpsMode) komplett deaktivieren.

### Firefox' TRR-Modell (Trusted Recursive Resolver)

Der Ansatz von Firefox war umstrittener. In Regionen, in denen Mozilla DoH standardmäßig aktiviert hat, nutzt Firefox einen Standard-Resolver wie Cloudflare in den USA, führt jedoch auch Unternehmens- und Netzwerkheuristiken durch, bevor DoH aktiviert wird. Ein wichtiges Signal ist dabei die Canary-Domain `use-application-dns.net`: Wenn der lokale Resolver ein negatives Ergebnis zurückgibt, deaktiviert Firefox das DNS auf Anwendungsebene für Nutzer, bei denen DoH standardmäßig aktiviert war. Mozilla dokumentiert auch eine wichtige Split-Horizon-Nuance: Rein interne Namen können auf normales DNS zurückgreifen, wenn die DoH-Auflösung fehlschlägt. Öffentliche Namen, die innerhalb des Netzwerks anders aufgelöst werden, erfordern jedoch Unternehmensrichtlinien, um DoH zu deaktivieren.

### Apples verschlüsseltes DNS (iOS 14+, macOS Big Sur+)

Apple erlaubt es Apps und Konfigurationsprofilen, sich systemweit für DoH oder DoT zu entscheiden (Opt-in), respektiert jedoch MDM-Richtlinien, die einen bestimmten Resolver vorschreiben. Von Unternehmen verwaltete Geräte verhalten sich daher von Haus aus korrekt.

### Natives DoH in Windows

Seit Windows 11 sowie unter Windows Server 2022 und neueren Versionen kann das Betriebssystem selbst DoH für den System-Resolver nutzen. Gruppenrichtlinien steuern, ob DoH erlaubt, zwingend erforderlich oder verboten ist. Zudem aktiviert Windows DoH nur für konfigurierte DNS-Server, von denen bekannt ist, dass sie das Protokoll unterstützen. Dies ist das wohl sauberste Modell: Das Sicherheitsteam legt die Richtlinie fest, das Betriebssystem setzt sie durch.

Das Muster ist eindeutig: **DoH, das in einer einzelnen App (dem Browser) existiert, ist für das Netzwerk schwer zu kontrollieren; DoH, das im OS-Level-Resolver angesiedelt ist, lässt sich über normale MDM-Kanäle steuern**. Die IETF und die Betriebssystemhersteller sind sich weitgehend einig, dass Richtlinien auf die Betriebssystemebene gehören.

## Die realistischen Optionen für ein Unternehmen im Jahr 2026

Angesichts der oben genannten Werkzeuge gibt es drei praktikable Strategien und eine vierte, die nicht funktionieren wird.

### Strategie A: Komplett intern, DoH blockiert

Verteilung einer Richtlinie, die DoH in jedem Browser deaktiviert, Port 443 zu bekannten öffentlichen DoH-Endpunkten blockiert und den gesamten DNS-Verkehr durch den internen Resolver zwingt. Der interne Resolver selbst kann zwar DoH mit den ihm übergeordneten öffentlichen Resolvern (Upstream) sprechen, aber innerhalb des Netzwerks läuft alles über ihn.

Dies ist die restriktivste Option. Sie bewahrt das Split-Horizon-Konzept perfekt und gibt den Sicherheitstools volle Transparenz. Der Preis dafür ist, dass Blocklisten neuer DoH-Endpunkte gepflegt werden müssen und jede vom Benutzer installierte App, die ihr eigenes DoH verwendet (einige Chat-Clients, einige VPNs), sich möglicherweise fehlerhaft verhält.

### Strategie B: Internes DoH

Bereitstellung eines internen DoH-Servers (Cloudflared, AdGuard oder ein Windows DNS-Server mit aktiviertem DoH), Konfiguration der Endpunkte zur Nutzung dieses Servers und Ausführung von Split-Horizon am internen DoH-Server. Die Endpunkte erhalten verschlüsseltes DNS, ohne dass das Netzwerk an Transparenz verliert.

Dies ist die sauberste Option und diejenige, auf die sich die meisten großen Unternehmen zubewegen. Sie erhält den Datenschutzvorteil (Abfragen sind im LAN verschlüsselt) und bewahrt gleichzeitig den Sicherheitsvorteil (der interne Resolver sieht und filtert nach wie vor jede Abfrage). Microsoft, Google und Apple unterstützen alle OS-seitige Konfigurationen für dieses Szenario.

### Strategie C: Canary-Domain / Netzwerk-Signal

Veröffentlichung der Mozilla-Canary-Domain. Verteilung der entsprechenden Chrome- und Edge-Richtlinien. Man verlässt sich darauf, dass die Browser erkennen, dass sie sich in einem verwalteten Netzwerk befinden, und greift auf den System-Resolver zurück. Dies ist die Option mit dem geringsten Eingriffsaufwand und reicht für viele kleine und mittlere Organisationen völlig aus.

### Strategie D (funktioniert nicht): „Wir ignorieren DoH einfach“

So zu tun, als ob der Konflikt nicht existiert, die Standardeinstellungen beizubehalten und davon auszugehen, dass das gesamte DNS weiterhin über den Unternehmens-Resolver fließt. Dies ist der häufigste Zustand und führt zu vorhersehbaren Fehlern: Entwickler berichten, dass rein interne URLs in Edge funktionieren, nicht aber in Firefox; Sicherheitsteams stellen Lücken in den DNS-Protokollen fest; unregelmäßig auftretende VPN-DNS-Bugs erfordern stundenlange Fehlerdiagnosen. Das Problem verschwindet nicht. Es wird nur schwieriger, die Ursache zu finden.

## Privatsphäre ist nicht der einzige Kompromiss bei DoH

Ein subtilerer Effekt von DoH ist die Zentralisierung der Resolver. Wenn ein Browser oder Betriebssystem so konfiguriert ist, dass er einen öffentlichen DoH-Resolver nutzt, fließt unter Umständen ein größerer Teil des DNS-Datenstroms dieses Nutzers zu einem einzigen Resolver-Betreiber. Der Automatikmodus von Chrome ist ausdrücklich darauf ausgelegt, den bestehenden DNS-Anbieter des Nutzers nach Möglichkeit beizubehalten, und das standardmäßige Rollout von Firefox ist abhängig von Region und Heuristiken. Es betrifft also nicht buchstäblich „jede Abfrage“ in jedem Setup. Aber der architektonische Kompromiss bleibt bestehen: Verschlüsseltes DNS kann das Vertrauen vom lokalen Netzwerk oder ISP auf eine kleinere Gruppe ausgewählter Resolver-Betreiber verlagern.

Ob dieser Tausch akzeptabel ist, hängt vom Bedrohungsmodell ab. Für einen Nutzer in einem unsicheren Café-Netzwerk ist die Zentralisierung des Vertrauens auf Cloudflare eine deutliche Verbesserung im Vergleich zum Vertrauen in das Café. Für ein Unternehmen, das bereits eine vertragliche Beziehung zu seinem ISP unterhält, kann dies jedoch ein Rückschritt sein. Die [EFF schreibt über diesen Kompromiss](https://www.eff.org/deeplinks/2019/10/encrypted-dns-could-help-close-biggest-privacy-gap-internet) bereits seit den frühen DoH-Rollouts.

Die sauberste Antwort ist dieselbe wie in der oben genannten Strategie B: Betreiben Sie Ihren eigenen DoH-Resolver, damit verschlüsseltes DNS nicht erfordert, einem Dritten den gesamten Abfrage-Datenstrom anzuvertrauen.

## Was das für Domain-Inhaber bedeutet

Wenn Sie eine Domain betreiben, die von Unternehmen genutzt wird – eine SaaS-App, ein Entwicklertool, eine API –, sind folgende Fakten relevant:

- Ein Teil Ihrer Nutzer wird Ihre Domain über einen öffentlichen DoH-Endpunkt auflösen, insbesondere auf nicht verwalteten Geräten oder in explizit konfigurierten Browsern. CNAME-Ketten, Subdomain-Delegationen und alle raffinierten DNS-Tricks, die Sie zur Personalisierung anwenden, müssen genauso funktionieren, wenn sie von einem beliebigen öffentlichen Resolver aufgelöst werden, wie vom internen Resolver eines Kunden.
- Die Umgehung DNS-basierter Zensur ist ein realer Anwendungsfall für DoH. Wenn Ihre Domain durch den DNS-Filter einer Regierung blockiert wird (wie es bei einigen verschlüsselten Messaging- und VPN-Domains der Fall war), werden Nutzer Sie über DoH von einem öffentlichen Resolver aus erreichen. Die Mechanismen sind die gleichen; die politische Tragweite ist eine andere.
- Ein internes Split-Horizon sollte niemals einen öffentlich zugänglichen Namen in etwas auflösen, das *nur intern sinnvoll ist*, sodass es zu Fehlern kommt, wenn ein Benutzer versehentlich über DoH abfragt. Der klassische Fehler ist das rein interne `app.example.com`, das eine private IP zurückgibt, die kein DoH-Nutzer erreichen kann – ein Remote-Mitarbeiter im Hotel stellt dann fest, dass derselbe Hostname nicht erreichbar ist, und meldet einen Bug. Verwenden Sie eine klar getrennte, rein interne Zone (`app.example.internal`).

## Wie Namefi ins Bild passt

Namefi behandelt DNS als die öffentlich zugängliche Steuerungsebene (Control Plane) – den Ort, an dem globale Namensgebung auf lokale Richtlinien trifft. Unsere DNS-Workflows gehen davon aus, dass Abfragen von jedem beliebigen Resolver kommen können, einschließlich DoH-Endpunkten, die wir nicht aufzählen können, und die von uns veröffentlichten Namen funktionieren in jedem Fall konsistent. Für Kunden, die intern Split-Horizon betreiben, sitzen wir auf der öffentlichen Seite: Die autoritative Antwort für `example.com` ist das, was wir ausliefern. Was der interne Resolver für interne Benutzer überschreibt, ist eine Angelegenheit zwischen ihnen und ihrer Endpunktrichtlinie.

Der tiefere Sinn dahinter: Verschlüsseltes DNS ist gekommen, um zu bleiben, und das gilt auch für die Sichtbarkeit im Unternehmensnetzwerk. Der Weg, beide in Einklang zu bringen, besteht nicht darin, die Standards zu bekämpfen, sondern den Durchsetzungspunkt für Richtlinien vom Netzwerk auf das Betriebssystem zu verlagern. Die Standardisierungsgremien, Microsoft, Apple, Google und Mozilla sind alle zu dieser Antwort gelangt. Die verbleibende Arbeit ist hauptsächlich operativer Natur.

## Quellen und weiterführende Literatur

- IETF — [DNS over HTTPS, RFC 8484](https://datatracker.ietf.org/doc/html/rfc8484) und [DNS over TLS, RFC 7858](https://datatracker.ietf.org/doc/html/rfc7858).
- Chrome Enterprise — [DoH policy controls](https://chromeenterprise.google/policies/?policy=DnsOverHttpsMode).
- Mozilla — [Trusted Recursive Resolver program](https://wiki.mozilla.org/Trusted_Recursive_Resolver), [canary domain behavior](https://support.mozilla.org/en-US/kb/canary-domain-use-application-dnsnet#:~:text=A%20negative%20result%20will%20be%20a%20signal%20to%20disable%20application%20DNS%2C%20(i.e.%2C%20DoH).), und [split-horizon fallback guidance](https://support.mozilla.org/gu-IN/kb/dns-over-https-doh-faqs#:~:text=If%20Firefox%20fails%20to%20resolve%20a%20domain%20via%20DoH%2C%20it%20will%20fall%20back%20to%20the%20DNS.).
- Chromium — [Chrome's same-provider DoH auto-upgrade model](https://www.chromium.org/developers/dns-over-https/#:~:text=Chrome's%20auto%2Dupgrade%20approach%20does%20not%20change%20the%20DNS%20provider).
- Microsoft — [Configure DNS over HTTPS in Windows](https://learn.microsoft.com/en-us/windows-server/networking/dns/doh-client-support#:~:text=Allow%20DoH.%20Queries%20will%20be%20performed%20using%20DoH%20if%20the%20specified%20DNS%20servers%20support%20the%20protocol.).
- EFF — [Encrypted DNS could help close one of the internet's biggest privacy gaps](https://www.eff.org/deeplinks/2019/10/encrypted-dns-could-help-close-biggest-privacy-gap-internet).