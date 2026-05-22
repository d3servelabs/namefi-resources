---
title: 'Was sind tokenisierte Domains? Ein Leitfaden zur Domain-Tokenisierung'
date: '2026-05-22'
language: de
tags: ['faq']
authors: ['namefiteam']
draft: false
description: 'Eine verständliche Einführung in tokenisierte Domains und die Domain-Tokenisierung – was es bedeutet, eine Domain zu tokenisieren, wie die Tokenisierung von Domains funktioniert und wie sich eine tokenisierte Domain von traditionellen Domains und reinen Blockchain-Namen wie ENS unterscheidet.'
keywords: ['tokenisierte Domain', 'tokenisierte Domains', 'eine Domain tokenisieren', 'Domains tokenisieren', 'Domain tokenisieren', 'die Tokenisierung einer Domain', 'Domain-Tokenisierung', 'Tokenisierung von Domains', 'Domainnamen-Tokenisierung', 'wie man eine Domain tokenisiert', 'was ist eine tokenisierte Domain', 'was sind tokenisierte Domains', 'NFT-Domains', 'NFT-Domain', 'On-Chain-Domains', 'On-Chain-Domain', 'Blockchain-Domains', 'Blockchain-Domain', 'DNS', 'ICANN-Domains', 'Web3-Domains', 'Web3-Domain', 'Domain-NFT', 'Domain als NFT', 'Namefi', 'Domain-Eigentum', 'Domain-Asset-Tokenisierung', 'Namefi', 'D3', 'D3 Global Inc', 'D3 Inc', 'Doma', 'Doma Protocol', 'Domora', 'WebUnited', 'GBM', 'GBM Auctions', 'ENS', 'Ethereum Name Service', 'Unstoppable Domains', 'Freename', 'GoDaddy', 'Identity Digital', 'Namefi vs ENS', 'Namefi vs Unstoppable Domains', 'Namefi vs D3', 'tokenisierte Domain vs ENS', 'tokenisierte Domain vs Web3-Domain', 'ICANN-Domain vs Web3-Domain', 'Plattformen für tokenisierte Domains vergleichen']
---

Sie haben vielleicht schon Begriffe wie „tokenisierte Domain“, „eine Domain tokenisieren“ oder „Domain-Tokenisierung“ gehört und sich gefragt, was sie eigentlich bedeuten. Ist eine tokenisierte Domain eine neue Art von Domain? Ein reiner Blockchain-Name? Ein Ersatz für `.com`? Und was bedeutet es überhaupt, eine Domain zu *tokenisieren*?

Dieser Artikel beantwortet die **„Was“**-Frage direkt: was eine tokenisierte Domain *ist*, was Domain-Tokenisierung *bedeutet*, was das Tokenisieren einer Domain *nicht* ist, und wie die gesamte Idee mit den Domainnamen zusammenhängt, die Sie bereits kennen.

> Wenn Sie verstehen möchten, *warum* Domain-Tokenisierung wichtig ist, lesen Sie [Warum Domains On-Chain tokenisieren?](/en/blog/why-tokenize-domains/). Dieser Beitrag konzentriert sich auf das *Was*.

---

## Die kurze Definition

Eine **tokenisierte Domain** ist ein regulärer, von der [ICANN](/en/glossary/icann/) anerkannter [Domainname](/en/blog/what-is-domain/) (wie `mybrand.xyz` oder `example.com`), dessen Eigentum zusätzlich als **Token auf einer Blockchain** repräsentiert wird – typischerweise als [NFT](/en/glossary/nft/). Der Prozess der Erstellung dieser token-gestützten Repräsentation wird als **Domain-Tokenisierung** bezeichnet, und die Handlung selbst ist das, was gemeint ist, wenn man davon spricht, *eine Domain zu tokenisieren* oder *Domains zu tokenisieren*.

Mit anderen Worten:

> Eine tokenisierte Domain ist eine einzige Domain mit **zwei synchronisierten Eigentumsebenen**: dem traditionellen [DNS](/en/glossary/dns/)-Registereintrag *und* einem On-Chain-Token, der diesen widerspiegelt. **Eine Domain zu tokenisieren** bedeutet, diese zweite On-Chain-Ebene zu einem bestehenden oder neu registrierten Domainnamen hinzuzufügen.

Wenn Sie den Token übertragen, folgt die zugrunde liegende Domain. Wenn die Domain abläuft oder verlängert wird, spiegelt der Token diesen Status wider.

---

## Zwei Ebenen, eine Domain

Es hilft, sich eine tokenisierte Domain so vorzustellen, als hätte sie zwei synchronisierte Datensätze:

| Ebene            | Was sie ist                                         | Wer sie verwaltet                         |
|------------------|-----------------------------------------------------|-------------------------------------------|
| DNS / Registry   | Der offizielle Eintrag beim [Registrar](/en/glossary/registrar/) und der Registry | [ICANN](/en/glossary/icann/)-akkreditierte [Registrare](/en/glossary/registrar/) |
| On-Chain-Token   | Ein [NFT](/en/glossary/nft/) in Ihrer [Wallet](/en/glossary/wallet/), das das Eigentum repräsentiert | Ein [Smart Contract](/en/glossary/smart-contract/) auf einer öffentlichen Blockchain |

Die beiden Ebenen werden durch die Domain-Tokenisierungs-Plattform synchron gehalten (im Fall von Namefi durch das Namefi-Protokoll und seine Registrar-Integrationen). Wann immer wir davon sprechen, *eine Domain zu tokenisieren*, *Domains zu tokenisieren* oder von *Domainnamen-Tokenisierung*, meinen wir die Einrichtung und Pflege dieser Zwei-Ebenen-Beziehung für eine spezifische Domain.

Dies unterscheidet sich vom Besitz einer Domain *nur* bei einem Registrar (das traditionelle Modell) und vom Besitz eines Namens *nur* on-chain (das ENS-ähnliche Modell). Eine tokenisierte Domain ist beides – ganz bewusst.

---

## Was tokenisierte Domains *nicht* sind

Ein paar häufige Missverständnisse über Domain-Tokenisierung, die es aufzuklären gilt:

### Keine neue TLD

Eine tokenisierte Domain ist kein Name im Stil von `.crypto`, `.eth` oder `.x`. Wenn Sie eine Domain über Namefi tokenisieren, verwenden Sie dieselben TLDs, die Sie bereits kennen – `.com`, `.xyz`, `.io`, `.art` usw. –, die in jedem Browser, E-Mail-Client oder DNS-Resolver der Welt aufgelöst werden.

### Nicht das Gleiche wie ENS oder „Blockchain-Namen“

[ENS](/en/glossary/ens/)-Namen (wie `vitalik.eth`) leben vollständig on-chain und werden ohne Bridges oder spezielle Resolver nicht im Standard-DNS aufgelöst. Tokenisierte Domains sind im Gegensatz dazu **echte DNS-Domains**, die *zusätzlich* eine On-Chain-Repräsentation haben. Die Domain-Tokenisierung fügt einem echten DNS-Namen die On-Chain-Ebene hinzu; sie ersetzt das DNS nicht durch ein paralleles Namenssystem.

| Merkmal                          | Traditionelle Domain | ENS / Blockchain-Name  | Tokenisierte Domain |
|----------------------------------|----------------------|------------------------|---------------------|
| Funktioniert in jedem Browser    | Ja                   | Erfordert Resolver     | Ja                  |
| Von der ICANN anerkannt          | Ja                   | Nein                   | Ja                  |
| In Ihrer Wallet gehalten         | Nein                 | Ja                     | Ja                  |
| On-Chain übertragbar             | Nein                 | Ja                     | Ja                  |
| Kombinierbar mit Smart Contracts | Nein                 | Ja                     | Ja                  |

### Nicht zensurresistent oder „außerhalb des Gesetzes“

Da es sich bei dem zugrunde liegenden Asset um eine echte DNS-Domain handelt, unterliegen tokenisierte Domains weiterhin der Verlängerungspflicht, den [ICANN](/en/glossary/icann/)-Richtlinien, [UDRP](/en/glossary/udrp/)-Streitigkeiten und geltendem Recht. Der Token spiegelt das Eigentum wider; er befreit die Domain nicht von den Regeln der realen Welt.

---

## Wie das Tokenisieren einer Domain in der Praxis funktioniert

Hier ist, was tatsächlich passiert, wenn Sie eine Domain bei Namefi tokenisieren (oder eine brandneue tokenisierte Domain registrieren):

1. **Registrierung** — Eine echte DNS-Domain wird über einen akkreditierten [Registrar](/en/glossary/registrar/) registriert (oder dorthin transferiert).
2. **Minting (Prägung)** — Als Teil der Domain-Tokenisierung wird ein [NFT](/en/glossary/nft/), das diese Domain repräsentiert, in Ihre [Wallet](/en/glossary/wallet/) geprägt (gemintet).
3. **Synchronisierung** — Die Plattform hält das Eigentum auf DNS-Ebene für jede tokenisierte Domain mit dem On-Chain-Eigentum synchron. Wenn Sie das NFT übertragen, folgt der DNS-Eintrag.
4. **Nutzung** — Sie können die tokenisierte Domain auf eine Website leiten, DNS-Einträge setzen oder das NFT in On-Chain-Anwendungen (Marktplätze, Identität, [DeFi](/en/glossary/defi/) usw.) verwenden.

Das Erlebnis für den Endnutzer ist: *eine Domain, zwei Möglichkeiten, damit zu interagieren* – die vertraute DNS-Welt und die programmierbare On-Chain-Welt, die durch die Domain-Tokenisierung erschlossen wird.

---

## Was Sie mit einer tokenisierten Domain tun können

Da beide Ebenen existieren, erhalten Sie die Kombination der Fähigkeiten beider Welten:

- **Als normale Domain nutzen** — eine Website hosten, E-Mails einrichten, DNS-Einträge konfigurieren.
- **In der eigenen Wallet halten** — für den Besitz ist kein gehostetes Konto erforderlich.
- **In Sekundenschnelle übertragen** — senden Sie das NFT an eine andere Wallet; der DNS-Eintrag folgt.
- **Auf NFT-Marktplätzen listen** — OpenSea, Blur und andere.
- **In Smart Contracts verwenden** — als Sicherheit (Collateral), für [Auktionen](/en/glossary/auction/), [Leasing](/en/glossary/leasing/), [anteiliges Eigentum (Fractional Ownership)](/en/glossary/fractional-ownership/) und mehr.
- **An eine On-Chain-Identität binden** — Verknüpfung mit [Farcaster](/en/glossary/farcaster/)-, [Lens](/en/glossary/lens/)- oder [DID](/en/glossary/did/)-Systemen.

---

## Top-Plattformen, die Domains tokenisieren

Domain-Tokenisierung ist längst kein Experiment eines einzelnen Anbieters mehr – mittlerweile bieten mehrere Plattformen Möglichkeiten an, eine Domain zu tokenisieren oder mit tokenisierten Domains zu arbeiten, jede mit einem etwas anderen Ansatz. Hier ist ein Überblick über die bekanntesten Namen in diesem Bereich.

> Die unten stehenden externen Links dienen als hilfreiche Hinweise und stellen keine Empfehlungen dar.

### 1. Namefi (das sind wir)

**Ansatz:** Tokenisiert echte ICANN-Domains (`.com`, `.xyz`, `.io`, `.art` und viele mehr) als NFTs, während die DNS-Ebene voll funktionsfähig bleibt. Beide Ebenen werden über akkreditierte [Registrare](/en/glossary/registrar/) synchron gehalten.

**Was Namefi auszeichnet:** Namefi war die **erste Plattform, die echte ICANN-Domains im Ethereum Mainnet tokenisiert hat, und die erste, die dies auf Base getan hat**. Da Namefi-tokenisierte Domains auf Ethereum und Base existieren, lassen sie sich dank des tiefen, ausgereiften [DeFi](/en/glossary/defi/)-Ökosystems von Ethereum natürlich in **die meisten großen NFT-Marktplätze und Lending-Protokolle** – wie OpenSea, Blur, NFTfi und andere – integrieren. Andere Plattformen haben eigene, durchdachte Entscheidungen zur Blockchain getroffen, die zu ihren Zielen passen; Ethereum und Base bieten den Nutzern von Namefi heute jedoch die weitreichendste Out-of-the-Box-Kompatibilität mit bestehenden NFT- und DeFi-Tools.

**Am besten geeignet für:** Eigentümer, die eine echte, im Browser auflösbare Domain *und* ein Wallet-natives, kombinierbares Eigentum in einem Produkt auf der Blockchain mit der umfassendsten DeFi- und NFT-Unterstützung wünschen. Besuchen Sie [namefi.io](https://namefi.io), um loszulegen.

### 2. D3 Global Inc

**Ansatz:** Eine Plattform, die sich darauf konzentriert, neue und bestehende TLDs auf Registry-Ebene on-chain zu bringen, in Partnerschaft mit TLD-Betreibern und ICANN-konformer Infrastruktur.

**Am besten geeignet für:** Tokenisierungsinitiativen auf Registry-Ebene und die Einführung neuer tokenisierter TLDs. Website: [d3.inc](https://d3.inc).

### 3. Doma Protocol

**Ansatz:** Ein Protokoll-Ebenen-Ansatz zur Standardisierung der Art und Weise, wie echte Domains über Registrare und Chains hinweg on-chain repräsentiert und übertragen werden.

**Am besten geeignet für:** Entwickler, die nach Abstraktionen auf Protokollebene für die Domain-Tokenisierung suchen. Website: [doma.xyz](https://doma.xyz).

### 4. Domora

**Ansatz:** Eine weitere aufstrebende Plattform im Bereich tokenisierter Domains, die sich darauf konzentriert, echte Domainnamen on-chain zu bringen.

**Am besten geeignet für:** Nutzer, die Alternativen in der Kategorie der tokenisierten DNS-Domains evaluieren. Website: [domora.com](https://domora.com).

### 5. WebUnited

**Ansatz:** Ein Akteur, der die On-Chain-Repräsentation von Domains und die zugehörige Infrastruktur für echte Domainnamen erforscht.

**Am besten geeignet für:** Teams, die nach zusätzlichen Optionen für tokenisierte Domains suchen. Website: [webunited.com](https://webunited.com).

### 6. GBM (Global Brand Marketplace / GBM Auctions)

**Ansatz:** Bekannt für On-Chain-Auktionsinfrastrukturen, die auf Verkäufe von tokenisierten Domains und Markenwerten angewendet wurden.

**Am besten geeignet für:** Auktionsgesteuerte Entdeckung und den Verkauf von tokenisierten Domains und damit verbundenen digitalen Markenwerten. Website: [gbm.auction](https://gbm.auction).

### 7. Traditionelle Registrare, die Tokenisierung erforschen

Einige etablierte ICANN-[Registrare](/en/glossary/registrar/) und Registries (z. B. [GoDaddy](https://www.godaddy.com), [Identity Digital](https://www.identity.digital)) haben explorative Tokenisierungsinitiativen oder Partnerschaften angekündigt. Die Abdeckung und Verfügbarkeit variieren stark, und der Großteil ihres Kerngeschäfts bleibt die traditionelle, rein DNS-basierte Registrierung.

---

## Eine verwandte Kategorie: ENS, Unstoppable Domains, Freename und Web3-Domains

Ein enger Verwandter der tokenisierten Domains ist die Familie der **Web3-Domains** – eine Kategorie, die von exzellenten Projekten wie ENS, Unstoppable Domains und Freename ins Leben gerufen wurde. Wir möchten die Unterscheidung klarstellen, nicht um deren Arbeit zu schmälern (sie haben enorm zur On-Chain-Namensgebung und Identität beigetragen), sondern um den Lesern zu helfen, das richtige Werkzeug für ihre Ziele auszuwählen.

Web3-Domains haben ein bewusst anderes Design als tokenisierte ICANN-Domains. So sollte man über sie denken:

- **Ein absichtlich anderer Namensraum.** Web3-Domains (`.eth`, `.crypto`, `.x`, `.nft` und nutzererstellte TLDs) existieren absichtlich außerhalb der [ICANN](/en/glossary/icann/)-Wurzel (Root). Dies ermöglicht es ihnen, schnell zu iterieren und mit neuen Namensmodellen zu experimentieren. Der Kompromiss ist, dass sie neben der traditionellen DNS-Hierarchie stehen und nicht innerhalb dieser.
- **Browser- und E-Mail-Auflösung erfordert zusätzliche Schritte.** Um eine Web3-Domain in einem typischen Browser aufzurufen oder eine E-Mail dorthin zu senden, benötigt man in der Regel einen Resolver, eine Erweiterung oder eine Bridge. Das Ökosystem von Wallets, dApps und krypto-nativen Browsern, die sie *unterstützen*, wächst stetig – aber die Parität mit Standardbrowsern, Mailservern, CDNs, SEO-Tools und SSL/TLS-Zertifizierungsstellen ist noch in der Entwicklung.
- **Wirklich neuartige, Wallet-native Anwendungsfälle.** Hier glänzen Web3-Domains: Sie ersetzen lange `0x…`-Adressen durch menschenlesbare Namen, vereinfachen Token-Übertragungen, ermöglichen dApp-Logins und dienen als primäre On-Chain-Identitäten. Viele dieser Muster existierten vor ENS und seinen Pendants schlichtweg nicht, und tokenisierte Domains bauen auf diesen Ideen auf.
- **Das Adoptionsprofil unterscheidet sich von echten DNS- / ICANN-Domains.** Echte Domains (auch *DNS-Domains*, *ICANN-Domains* oder *reale Domains* genannt – z. B. `.com`, `.org`, `.xyz`, `.io`) profitieren von jahrzehntelanger, universeller Unterstützung über jeden Browser, E-Mail-Anbieter, jedes CDN und jede Zertifizierungsstelle hinweg. Web3-Domains haben eine beeindruckende und wachsende Reichweite innerhalb des krypto-nativen Ökosystems, während die breitere Internet-Adoption noch aufholt.

Die führenden Plattformen für Web3-Domains, mit Wertschätzung für das, was jede Einzelne beiträgt:

- [ENS](https://ens.domains) — ein grundlegendes, Ethereum-natives Namenssystem (`.eth`) und eines der wichtigsten Primitive im Web3. ENS bietet über [DNSSEC](/en/glossary/dnssec/) auch durchdachte Brücken zu echten DNS-Namen.
- [Unstoppable Domains](https://unstoppabledomains.com) — ein früher und einflussreicher Pionier von Blockchain-nativen Namen wie `.crypto`, `.x` und `.nft`, mit breiten Wallet- und dApp-Integrationen.
- [Freename](https://freename.io) — ein innovativer Ansatz für nutzererstellte Web3-TLDs und Namensräume.

Wenn Ihr primäres Ziel **On-Chain-Identität** oder **Web3-Namensgebung** ist, sind diese Plattformen hervorragend und absolut eine Erkundung wert. Wenn Ihr primäres Ziel ein Name ist, der **auch** in jedem Browser, jedem E-Mail-Client, jedem CDN und bei jeder SSL-Zertifizierungsstelle funktioniert – also eine echte ICANN-Domain, die Sie zusätzlich in Ihrer Wallet halten und programmieren können –, dann sind die oben genannten Plattformen für tokenisierte Domains (Namefi, D3 Global Inc, Doma Protocol, Domora, WebUnited, GBM) für diesen Anwendungsfall konzipiert. Beide Kategorien können wunderbar nebeneinander existieren, und viele Nutzer halten beides.

---

## Wie man sich zwischen ihnen entscheidet

Eine schnelle Möglichkeit, darüber nachzudenken:

| Wenn Sie Folgendes suchen…                                                   | Sehen Sie sich an                      |
|------------------------------------------------------------------------------|----------------------------------------|
| Eine echte `.com`/`.xyz`/`.io`, die auf Ethereum oder Base tokenisiert ist, mit der breitesten Unterstützung für NFT-Marktplätze und DeFi-Lending | **Namefi**                             |
| Partnerschaften auf Registry-Ebene für eine brandneue TLD                    | D3 Global Inc                          |
| Standards auf Protokollebene für tokenisierte Domains                        | Doma Protocol                          |
| Weitere Plattformen für tokenisierte DNS-Domains zur Evaluierung             | Domora, WebUnited                      |
| Auktionsgesteuerte Verkaufsinfrastruktur für tokenisierte Domains            | GBM                                    |
| On-Chain-Identität und Ethereum-native Namensgebung (z. B. `.eth`) – eine verwandte Kategorie, keine tokenisierte ICANN-Domain | ENS                                    |
| Web3-native TLDs, die für Wallet-First-Anwendungsfälle entwickelt wurden – eine verwandte Kategorie, keine tokenisierte ICANN-Domain | Unstoppable Domains, Freename          |
| Traditionelle Registrierung mit optionalen, anbieterspezifischen Tokenisierungs-Piloten | GoDaddy, Identity Digital, andere      |

Der wichtigste Unterschied, den man sich merken sollte: **Eine Domain zu tokenisieren (im Sinne von Namefi) bedeutet, einen echten, von der ICANN anerkannten DNS-Namen beizubehalten und zusätzlich einen On-Chain-Token hinzuzufügen** – nicht, das DNS durch ein paralleles Web3-Namenssystem zu ersetzen.

---

## Ein einfaches mentales Modell

Wenn eine traditionelle Domain eine **Urkunde ist, die von einer dritten Partei in Ihrem Namen aufbewahrt wird**, dann ist eine tokenisierte Domain **dieselbe Urkunde, mit einer kryptografischen Kopie in Ihrer eigenen Tasche** – und beide werden absolut synchron gehalten.

Sie verlieren nicht die rechtliche bzw. Registry-Ebene. Sie gewinnen eine programmierbare Ebene dazu.

---

## Zusammenfassung

- Eine **tokenisierte Domain** ist eine echte DNS-Domain mit einem On-Chain-Token (meist ein NFT), der ihr Eigentum widerspiegelt.
- **Domain-Tokenisierung** (auch *Domainnamen-Tokenisierung* oder *Tokenisierung einer Domain* genannt) ist der Prozess der Erstellung und Pflege dieser On-Chain-Repräsentation.
- **Eine Domain zu tokenisieren** (oder massenhaft *Domains zu tokenisieren*) bedeutet, diese Wallet-native Eigentumsebene zu einer echten ICANN-Domain hinzuzufügen – ohne die traditionelle DNS-Ebene aufzugeben.
- Eine tokenisierte Domain ist **keine** neue TLD, kein Name im ENS-Stil und kein Weg, das DNS oder Gesetze zu umgehen.
- Sie bietet Ihnen alles, was eine traditionelle Domain kann, *plus* Wallet-natives Eigentum und die Kombinierbarkeit mit On-Chain-Anwendungen.

Um zu erkunden, *warum* das wichtig ist und was die Domain-Tokenisierung ermöglicht, lesen Sie [Warum Domains On-Chain tokenisieren?](/en/blog/why-tokenize-domains/). Um Ihre erste Domain zu registrieren oder zu tokenisieren, besuchen Sie [namefi.io](https://namefi.io).