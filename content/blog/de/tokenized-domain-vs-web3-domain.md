---
title: "Tokenisierte Domains vs. Web3-Domains (ENS, .crypto): Was ist der Unterschied?"
date: '2026-05-22'
language: de
tags: ['comparison']
authors: ['namefiteam']
draft: false
description: "Ein klarer, praktischer Vergleich von tokenisierten ICANN-Domains (wie einer tokenisierten .com) und Web3-nativen Namen (wie name.eth, name.crypto). Wann funktioniert was? Wo überschneiden sie sich? Warum besitzen viele Leute beides?"
keywords: ['tokenisierte Domain vs Web3-Domain', 'tokenisierte Domain vs ENS', 'ICANN-Domain vs ENS', '.com vs .eth', 'tokenisierte .com vs .crypto', 'tokenisierte Domain vs Unstoppable', 'Web3-Domain-Vergleich', 'ENS vs tokenisierte Domain', 'NFT-Domain vs ENS', 'Web3-Namensgebung', 'On-Chain-Namensunterschied', 'Browser-Unterstützung Web3-Domain', 'Web3-Domain-Auflösung']
---

Eine berechtigte Frage, die täglich gestellt wird: *"Ich habe bereits einen `.eth`-Namen (oder `.crypto` oder `.x`). Warum sollte ich meine `.com` [tokenisieren](/en/glossary/tokenize/)? Sind die nicht dasselbe?"*

Das sind sie nicht. Sie überschneiden sich ein wenig im Gefühl und sehr stark im Branding, aber operativ lösen sie unterschiedliche Probleme. Dieser Beitrag schlüsselt auf, wo die beiden jeweils hinpassen.

Wenn Sie speziell zu tokenisierten Domains ausführlichere Informationen suchen, beginnen Sie mit [Was sind tokenisierte Domains?](/en/blog/what-are-tokenized-domains/).

---

## Kurz zusammengefasst

- **Tokenisierte Domain** = eine echte [ICANN](/en/glossary/icann/)-Domain (`.com`, `.xyz`, `.io` usw.) mit einem zusätzlichen [On-Chain](/en/glossary/on-chain/)-Eigentumstoken (Ownership-Token) obendrauf.
- [**Web3**](/en/glossary/web3/)**-Domain** = ein Name, der **ausschließlich** On-Chain existiert (`.eth`, `.crypto`, `.x` usw.). Es ist ein separates Namenssystem und kein Teil des [DNS](/en/glossary/dns/).

Eine tokenisierte Domain *erweitert* die bestehende DNS-Welt. Eine Web3-Domain *ersetzt* sie (oder existiert parallel dazu, je nachdem, wie Sie sie nutzen).

---

## Woher die Verwirrung kommt

Bei beiden geht es um NFTs in Wallets. Beide werden "Domains" genannt. Bei beiden taucht ICANN irgendwo in der Konversation auf – allerdings auf entgegengesetzte Weise. Das Marketing für beide Kategorien verwischt oft die Unterscheidung.

Hier ist das sauberste mentale Modell:

- Wenn Sie den Namen in einen normalen Browser eingeben und er ohne Erweiterung, Plugin oder speziellen Resolver zu einer Website führt (auflöst) – dann ist es eine **DNS-Domain**. Die Tokenisierung ändert daran nichts.
- Wenn Sie eine Browser-Erweiterung, eine spezielle Wallet-Funktion oder ein Resolver-Gateway benötigen, damit es funktioniert – dann ist es eine **Web3-Domain**.

Beide haben ihre Berechtigung. Sie tun nur unterschiedliche Dinge.

---

## Der direkte Vergleich

| Funktion | Tokenisierte ICANN-Domain | Web3-Domain (ENS, .crypto usw.) |
|---|---|---|
| Löst in jedem Browser auf | Ja, nativ | Nein (braucht Resolver/Erweiterung) |
| Funktioniert sofort für E-Mails | Ja | Nein (anderer Mechanismus) |
| Funktioniert für SSL/TLS-Zertifikate | Ja (Let's Encrypt usw.) | Nein (separates Vertrauensmodell) |
| Von ICANN anerkannt | Ja | Nein |
| Existiert On-Chain | Ja (Eigentumsebene) | Ja (komplette Identität) |
| Wird als NFT im Wallet gehalten | Ja | Ja |
| Als Wallet-Alias genutzt | Manchmal (via Plugins) | Ja, nativ |
| Jährliche Verlängerung beim Registrar | Ja (echte DNS-Domain) | Typischerweise einmalig oder anderes Modell |
| Ohne Browser-Erweiterungen für Endnutzer | Ja | Nein |
| Kompatibel mit DNS-Infrastruktur | Ja | Nicht direkt |

---

## Worin beide *am besten* sind

### Tokenisierte ICANN-Domains

Am besten geeignet, wenn:

- Sie eine echte Website, App oder ein Unternehmen betreiben und möchten, dass diese für **jeden** funktioniert, unabhängig davon, ob eine Web3-Software installiert ist.
- Sie E-Mails unter Ihrer Domain, SSL-Zertifikate von Standard-CAs, CDN-Konfigurationen usw. benötigen.
- Sie **Wallet-natives Eigentum und Übertragbarkeit** für die Domain selbst wünschen – zum Verkaufen, Verschenken, Verleihen – und das ohne die Bürokratie eines Registrars.
- Sie die Domain als On-Chain-Sicherheit in DeFi nutzen möchten, während sie weiterhin als normale Website funktioniert.

Beispiele: die `.com` eines Unternehmens, die `.io` einer SaaS-App, die `.xyz` eines Creators, die `.art` einer Marke. Alles, was im "echten" Internet funktionieren muss.

### Web3-Domains (ENS, Unstoppable, Freename usw.)

Am besten geeignet, wenn:

- Sie eine **Wallet-Identität** wünschen – einen Namen, der bei der Eingabe in eine Krypto-App oder Wallet zu Ihrer Adresse auflöst. `vitalik.eth` anstelle von `0x...`.
- Sie ein Web3-natives Profil / Handle in dApps möchten, die dies unterstützen.
- Sie nicht darauf angewiesen sind, dass der Name für Standard-E-Mails, in Browsern ohne Plugins oder mit SSL funktioniert.
- Sie die kulturellen und gemeinschaftlichen Aspekte einer bestimmten TLD (`.eth`, `.crypto`, `.x`) mögen.

Beispiele: Ihre persönliche Web3-Identität, ein Profil für ein Wallet, eine leicht zu merkende Adresse für den Empfang von Krypto, NFT-Showcase-Seiten.

---

## Auflösung: Wie beide in der Praxis funktionieren

### DNS (die Welt, in der tokenisierte Domains leben)

Sie tippen `example.com` ein. Ihr Computer fragt einen DNS-Resolver. Der Resolver durchläuft die DNS-Hierarchie. Sie erhalten eine IP-Adresse. Der Browser ruft die Website ab. All das funktioniert genau gleich, egal ob die Domain tokenisiert ist oder nicht, denn die Tokenisierung fügt eine *Eigentumsebene* (Ownership Layer) hinzu, keine *Auflösungsebene* (Resolution Layer).

Siehe [DNS funktioniert weiterhin](/en/blog/dns-on-tokenized-domains/) für die praktischen Details dazu.

### ENS / Web3-Namensauflösung

Sie tippen `vitalik.eth` ein. Ein Web3-fähiger Client (MetaMask, eine dApp, bestimmte Browser mit [ENS](/en/glossary/ens/)-Unterstützung) fragt den ENS-[Smart-Contract](/en/glossary/smart-contract/) auf Ethereum ab, erhält die zugehörige Adresse oder den Content-Hash und stellt diese entsprechend dar. Ein nicht-Web3-fähiger Client (Chrome ohne Erweiterungen, Ihr Büro-E-Mail-Server, Ihre SSL-CA) weiß nicht, was `.eth` bedeutet, und wird es nicht auflösen.

Das ist kein Fehler – das ist pure Absicht. ENS und ähnliche Systeme wurden für ein Web3-natives Erlebnis gebaut, nicht um die Namensebene des breiteren Internets zu ersetzen. Weitere Informationen zur zugrunde liegenden Architektur finden Sie in der [offiziellen ENS-Dokumentation](https://docs.ens.domains/).

---

## Warum viele Leute beides besitzen

Es gibt keinen Grund, sich für nur eines zu entscheiden. Sie erfüllen unterschiedliche Rollen.

Ein typisches Muster:

- **`mybrand.com`** (tokenisiert) für das eigentliche Produkt / die Website / E-Mails.
- **`mybrand.eth`** (ENS) für den Empfang von Krypto, den Aufbau eines Web3-Profils und die Adressierbarkeit innerhalb von dApps.

Die tokenisierte `.com` funktioniert für das offene Internet. Die `.eth` fungiert als Wallet-Alias und als Identität in krypto-nativen Apps. Unterschiedliche Aufgaben, beide nützlich.

---

## Wann man sich für nur eines entscheiden würde

- **Nur tokenisiert:** Wenn Sie ein echtes Produkt aufbauen, ein Unternehmen leiten oder irgendetwas tun, das in normalen Browsern und E-Mail-Clients funktionieren muss. Die `.eth` ist hierbei lediglich ein "Nice-to-have".
- **Nur Web3-Name:** Wenn Sie nur eine Wallet-Identität benötigen und keine tatsächliche Website betreiben. (Sie würden wahrscheinlich immer noch eine `.com` für nicht-krypto-bezogene Dinge haben wollen, müssen diese aber nicht zwingend tokenisieren.)

---

## Häufige Missverständnisse

- **„ENS wird DNS ersetzen.“** Nein, und das versucht es auch gar nicht. ENS ist ein paralleles Namenssystem, das für Krypto-Identitäten optimiert ist.
- **„Eine tokenisierte `.com` ist eine ‚Web3-Domain‘.“** Es ist eine *tokenisierte DNS-Domain*. Die Bezeichnung „Web3-Domain“ wird normalerweise für Namen im Stil von `.eth`/`.crypto` verwendet. Die Kategorien sind verschieden.
- **„Browser unterstützen `.eth` jetzt nativ.“** Brave und ein paar spezifische Erweiterungen, ja. Mainstream-Browser, nein. Für eine Endnutzererfahrung, die für alle funktioniert, ist DNS immer noch die Antwort.
- **„Wenn ich meine Domain tokenisiere, verliere ich die ICANN-Anerkennung.“** Nein. Die DNS- / ICANN-Seite bleibt unverändert. Sie fügen lediglich eine On-Chain-Eigentumsebene hinzu.
- **„Web3-Domains sind dezentralisiert, tokenisierte Domains nicht.“** Beide haben einige dezentrale Eigenschaften (On-Chain-Eigentum) und einige zentralisierte (Registrierungsstellen, ICANN, Smart-Contract-Upgrades). Dezentralisierung ist ein Spektrum, kein simples Kontrollkästchen.

---

## Freundlicher Haftungsausschluss (Bitte lesen!)

> Wir sind keine Anwälte, Buchhalter, Finanzberater oder Ärzte – und **nichts in diesem Artikel stellt eine rechtliche, finanzielle, steuerliche, buchhalterische, medizinische oder jegliche andere Form von professioneller Beratung dar.** Wir schreiben diese Beiträge, um uns selbst weiterzubilden und als Service für unsere Kunden. Die Informationen hier können veraltet, geografie-spezifisch oder einfach nur falsch sein – auch wir machen Fehler.
>
> Bei wichtigen Entscheidungen **konsultieren Sie bitte einen echten Fachmann (ernsthaft!)**. Oder wenn das nicht Ihr Ding ist, fragen Sie einen Freund, fragen Sie Twitter, fragen Sie Reddit, fragen Sie eine KI oder fragen Sie ein Medium. Kurz gesagt: **DOYR — Do Your Own Research (Recherchieren Sie selbst)**. Lassen Sie uns lernen und Spaß dabei haben.

---

## Zusammenfassung

- **Tokenisierte Domains** sind echte ICANN-Domains mit einem zusätzlichen On-Chain-Eigentumstoken. Sie werden in jedem Browser normal aufgelöst, unterstützen E-Mails, funktionieren mit SSL und erfordern die normalen jährlichen Verlängerungsgebühren.
- **Web3-Domains** (ENS, Unstoppable Domains, Freename) sind eine andere Kategorie – Namen, die komplett On-Chain leben und als Wallet-Aliase / Web3-Identitäten fungieren.
- Die Kategorien sind keine Konkurrenten. Sie lösen unterschiedliche Probleme und viele Leute besitzen beides.
- Wenn der Name überall im Internet funktionieren soll, brauchen Sie eine tokenisierte DNS-Domain. Wenn Sie ein Web3-natives Handle und eine Adresse wollen, brauchen Sie einen Namen im ENS-Stil.
- Dasselbe Wallet kann beides enthalten.

Informationen zu Plattformen im Bereich der Tokenisierung finden Sie unter [Auswahl einer Plattform zur Domain-Tokenisierung](/en/blog/choosing-a-domain-tokenization-platform/).