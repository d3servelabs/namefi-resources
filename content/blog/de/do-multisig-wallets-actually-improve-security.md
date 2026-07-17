---
title: 'Verbessern Multisig-Wallets wirklich die Sicherheit? Eine Betrachtung aus Sicht des Bedrohungsmodells'
date: '2026-05-07'
language: de
tags: ['security', 'wallets', 'multisig', 'web3', 'key-management']
authors: ['fenwei-bian']
editors: ['victor-zhou']
translators: ['kai-kunstmann']
draft: false
description: 'Multisignatur-Wallets werden in der Kryptowelt weithin als der Standard für sichere Verwahrung angesehen, aber die Antwort auf die Frage "Verbessern sie wirklich die Sicherheit?" hängt vollständig vom Bedrohungsmodell ab. Dieser Artikel erläutert, was Multisig abwehrt, was nicht und wo es die Situation sogar verschlimmern kann.'
ogImage: ../../assets/do-multisig-wallets-actually-improve-security-og.jpg
keywords: ['Multisig-Wallet', 'Multisignatur', 'Safe Wallet', 'Gnosis Safe', 'Schlüsselverwaltung', 'Self-Custody', 'Threshold-Signatur', 'Social Recovery', 'Namefi']
relatedArticles:
  - /de/blog/onchain-domain-custody-and-recovery/
  - /de/blog/the-badgerdao-frontend-attack/
  - /de/blog/the-godaddy-multi-year-breach/
  - /de/blog/the-curve-finance-dns-hijack/
  - /de/blog/the-sushiswap-miso-insider-attack/
relatedTopics:
  - /de/topics/domain-security/
  - /de/topics/domain-tokenization/
relatedSeries:
  - /de/series/domain-apocalypse/
  - /de/series/domain-flipping-skills/
relatedGlossary:
  - /de/glossary/registrar/
  - /de/glossary/dns/
  - /de/glossary/icann/
  - /de/glossary/web3/
  - /de/glossary/tld/
---

Multisignatur-Wallets – Wallets, bei denen M von N Schlüsseln signieren müssen, bevor eine Transaktion gültig ist – werden in der Regel als das offensichtliche Upgrade einer Single-Key Hot [Wallet](/de/glossary/wallet/) präsentiert. Die meisten Treasury-Setups in DAOs, Börsen und ernsthaften Krypto-Unternehmen laufen über irgendeine Form von Multisig (Safe, Squads, Multisig.js, Threshold-Signatur-Varianten).

Dieser Ruf ist wohlverdient, aber nur gegenüber einem *spezifischen* Bedrohungsmodell. Multisig wehrt einige der häufigsten Methoden ab, mit denen Gelder gestohlen werden, und bewirkt bei anderen fast gar nichts. Hier ist die ehrliche Version: worin Multisig wirklich gut ist, wo es zu kurz kommt und in welchen Fällen seine Einführung ein Setup *weniger* sicher machen kann.

## Was Multisig ist, ganz kurz

In einem 2-von-3-Multisig existieren drei private Schlüssel; beliebige zwei davon müssen eine Transaktion signieren, damit sie [On-Chain](/de/glossary/on-chain/) ausgeführt wird. Die Wallet selbst ist ein [Smart Contract](/de/glossary/smart-contract/) (in der [Ethereum](/de/glossary/ethereum/)/EVM-Welt) oder ein nativer Multisig-Ausgabetyp (bei Bitcoin via [P2SH/P2WSH](https://en.bitcoin.it/wiki/BIP_0016)). Der Contract verifiziert die Signaturen und leitet die Transaktion dann weiter.

Die am weitesten verbreitete Implementierung in EVM-Ökosystemen ist [Safe](https://safe.global/) (ehemals Gnosis Safe). Auf Solana übernimmt [Squads](https://squads.so/) dieselbe Rolle. Bitcoin hat eine lange Geschichte der nativen Multisig-Unterstützung, oft in Kombination mit Hardware-Wallets über [PSBT-Workflows](https://github.com/bitcoin/bips/blob/master/bip-0174.mediawiki).

Schwellenwert-Signaturverfahren (Threshold-Signature Schemes: TSS, FROST, MPC) erzielen ein ähnliches Ergebnis mit einem einzigen On-Chain-Schlüssel – jeder Unterzeichner hält einen *Teil* (Share) des privaten Schlüssels, und sie signieren gemeinsam, ohne ihn jemals zu rekonstruieren. Aus der Perspektive des Bedrohungsmodells gelten die meisten der folgenden Punkte gleichermaßen für beide, mit einigen wenigen Ausnahmen, die später angemerkt werden.

## Was Multisig abwehrt (die guten Nachrichten)

### Kompromittierung eines einzelnen Schlüssels

Das ist der Hauptvorteil. Wenn die [Hardware-Wallet](/de/glossary/hardware-wallet/) eines Unterzeichners gestohlen wird, das Telefon eines Unterzeichners mit Malware infiziert ist oder die [Seed-Phrase](/de/glossary/seed-phrase/) eines Unterzeichners durchsickert, kann ein Angreifer, der diesen einzigen Schlüssel besitzt, keine Gelder bewegen. Er muss gleichzeitig mindestens M-1 weitere Schlüssel kompromittieren.

Für ein 2-von-3-Setup bedeutet dies, dass der Angreifer *zwei unabhängige Endpunkte* kompromittieren muss, die idealerweise von verschiedenen Personen, auf unterschiedlicher Hardware und an unterschiedlichen physischen Orten gehalten werden. Die Wahrscheinlichkeit von zwei unabhängigen Kompromittierungen im selben Zeitfenster ist in der Regel um Größenordnungen geringer als die Wahrscheinlichkeit einer einzigen.

### Insider-Risiko

Eine einzelne Person mit voller Verfügungsgewalt kann im Zorn hinschmeißen, überlaufen, erpresst werden oder einfach einen katastrophalen Fehler machen. Multisig erzwingt geheime Absprachen (Kollusion). Für DAOs und Unternehmen ist dies oft die *primäre* Motivation – der Sicherheitsvorteil gegenüber externen Angreifern ist zweitrangig gegenüber dem Governance-Vorteil gegenüber einem einzelnen internen Akteur.

### Wiederherstellung verlorener Schlüssel

In einem M-von-N-Setup mit N > M ist der Verlust eines Schlüssels nicht katastrophal. Die verbleibenden Unterzeichner können die Gelder auf ein neues Multisig verschieben und den verlorenen Schlüssel ersetzen. Dies ist eine bedeutsame Verbesserung gegenüber der Single-Key-Verwahrung, bei der eine verlorene Seed-Phrase einen dauerhaften Verlust bedeutet.

### Phishing von Benutzern

Viele Wallet-[Phishing](/de/glossary/phishing/)-Angriffe (gefälschte Airdrop-Seiten, bösartige Token-Freigaben, Drainer-Contracts) beruhen darauf, dass der Benutzer in einer einzigen Browser-Sitzung eine bösartige Transaktion signiert. Ein Multisig fügt einen Bestätigungsschritt auf einer anderen Ebene hinzu – eine koordinierende Benutzeroberfläche wie die von Safe oder eine Hardware-Zustimmung auf mehreren Geräten –, was dem Benutzer einen weiteren Moment gibt, um zu bemerken, dass er etwas signiert, was er nicht beabsichtigt hat.

## Was Multisig *nicht* abwehrt (der unbequeme Teil)

Dies ist der Abschnitt, den die meisten schnellen Zusammenfassungen überspringen.

### Smart-Contract-Bugs im Multisig selbst

Das Multisig ist ein Smart Contract. Wenn der Contract einen Fehler hat, hilft das sorgfältigste Schlüsselmanagement der Welt nicht. Der teuerste Multisig-Vorfall in der Geschichte – der [Parity Multisig Freeze](https://www.parity.io/blog/security-alert/) im November 2017 – war ein Contract-Bug, keine Schlüsselkompromittierung. Etwa 150 Millionen Dollar in ETH wurden durch eine einzige Transaktion dauerhaft unzugänglich gemacht.

Das moderne Safe ist einer der am meisten geprüften Contracts auf Ethereum und hat sich gut bewährt, aber der Punkt bleibt bestehen: Man tauscht "einen privaten Schlüssel, den man schützen muss" gegen "einen Smart Contract, dem man vertrauen muss" ein. Dieses Vertrauen muss durch Audits und Zeit immer wieder neu verdient werden.

### Kompromittierung der Signatur-Benutzeroberfläche (UI)

Fast jede Multisig-Signatur erfolgt über eine Schnittstelle – die Web-UI von Safe, ein Wallet-Plugin, ein benutzerdefiniertes Dashboard. Wenn diese Schnittstelle kompromittiert ist (DNS-Hijacking, Supply-Chain-Angriff auf eine Abhängigkeit, bösartige Browser-Erweiterung), kann der Angreifer Unterzeichner A "1 ETH an alice.eth senden" anzeigen, während er tatsächlich "1000 ETH an attacker.eth senden" zur Signatur an die Hardware-Wallet übermittelt.

Die meisten Hardware-Wallets zeigen zwar die tatsächliche Zieladresse an, aber Unterzeichner überfliegen diese routinemäßig nur. Der [Vorfall bei Bybit](https://www.bybit.com/en-US/help-center/article/Incident-Report-Bybit-Exchange-Attack-Update) Anfang 2025 basierte auf einer Kompromittierung der Safe-UI; alle Unterzeichner genehmigten das, was sie für eine Routinetransaktion hielten, während der Proxy-Contract modifiziert wurde.

Multisig schützt Sie vor einem Angreifer, der *nur* einen Schlüssel besitzt. Es schützt Sie nicht vor einem Angreifer, der all Ihren Unterzeichnern die falsche Transaktion vorlegen kann.

### Koordiniertes Phishing mehrerer Unterzeichner

Wenn die Unterzeichner bekannt und erreichbar sind – und das sind sie bei jedem Treasury mit einer veröffentlichten Safe-Adresse in der Regel – kann ein Angreifer sie alle ins Visier nehmen. Führe dieselbe Phishing-Kampagne bei jedem Unterzeichner durch. Warte ab. Wenn zwei von drei am selben Tag müde, abgelenkt oder unachtsam sind, ist der Schwellenwert erreicht.

Dies ist in der Praxis der realistischste Angriff auf gut geführte Multisigs, und die Abwehrmaßnahmen dagegen sind größtenteils prozeduraler, nicht technischer Natur: Out-of-Band-Bestätigung jeder Transaktion in einem separaten Kanal (Signal, ein anderer Chat, ein Telefonanruf) und eine strikte Richtlinie, dass jede Transaktion über X Dollar vor der Unterzeichnung live besprochen werden muss.

### Kompromittierung der Off-Chain-Schlüsselspeicherung

Wenn die "Signaturschlüssel" tatsächlich ein 2-von-3-Setup zwischen den MetaMask-Seed-Phrases zweier Ingenieure und einer Hardware-Wallet im Büro-Tresor sind, haben Sie ein OPSEC-Problem im Gewand eines Multisigs. Der Schwellenwert wird technisch erreicht, aber die Diversität ist vorgetäuscht. Eine Malware-Infektion auf den Laptops der beiden Ingenieure oder ein einziger Einbruch ins Büro kann den Schwellenwert kompromittieren.

Echte Diversität erfordert:

- Verschiedene Hardware-Modelle. (Ein Ledger, ein Trezor, ein Keystone.)
- Verschiedene Betriebssysteme für jegliche Software-Signierung.
- Verschiedene physische Standorte für jegliche dauerhafte Speicherung.
- Wo anwendbar, verschiedene Personen mit unterschiedlichen Bedrohungsprofilen.

### Verlust über den Schwellenwert hinaus

Die Kehrseite der Wiederherstellung: Bei einem 2-von-3-Setup bedeutet der Verlust von *zwei* Schlüsseln einen dauerhaften Verlust. Bei einem 3-von-5-Setup ist der Verlust von drei Schlüsseln ein dauerhafter Verlust. Je größer die Lücke zwischen M und N ist, desto sicherer ist man vor Einzelverlusten – aber desto leichter ist es für einen Angreifer, M Unterzeichner für Phishing zu finden.

Dies ist das unvermeidliche Spannungsfeld. Ein höheres M ist sicherer gegen externe Angriffe und weniger wiederherstellbar. Ein niedrigeres M ist besser wiederherstellbar und leichter anzugreifen. Es gibt keine Einstellung, die beides optimiert.

## Wo Multisig die Dinge *verschlimmern* kann

Ein paar ehrliche Fälle:

- **Bei sehr kleinen Guthaben** kann der operative Aufwand von Multisig (Transaktionskoordination, Gas-Kosten bei EVM, Lernkurve) zu Fehlern führen, die bei einer Single-Key-Verwahrung nicht aufgetreten wären. Das richtige Werkzeug für 200 $ an Taschengeld-Krypto ist ein Hardware-gestützter Single Key.
- **Für Solo-Nutzer, die Multisig als Wiederherstellungsverfahren behandeln**, aber in der Praxis alle drei Schlüssel auf Geräten aufbewahren, die sie allein kontrollieren, erhöht Multisig die Komplexität, ohne das Bedrohungsmodell zu ändern – wenn ein einzelner Angreifer heute eines dieser Geräte kompromittiert, kann er wahrscheinlich alle kompromittieren.
- **Für Organisationen, die nicht wirklich über eine Diversität der Unterzeichner verfügen** – alle im selben Büro, im selben VPN, mit demselben SSO – wird der Schwellenwert zur Formalität.

In allen drei Fällen lautet die Antwort nicht "Nutze Single-Key-Verwahrung". Sie lautet "Nutze Multisig *richtig* oder nutze einen Verwahrer, der dies tut." Aber so zu tun, als ob allein die Art des Contracts Sicherheit bietet, unabhängig von der betrieblichen Praxis, ist der Grund, warum aufsehenerregende Verluste passieren.

## Wie ein gutes Setup aussieht

Ein 2-von-3- oder 3-von-5-Multisig funktioniert gut als Treasury-Kontrolle, wenn *alle* folgenden Punkte zutreffen:

- Unterzeichner sind verschiedene Personen, nach Möglichkeit in unterschiedlichen Rechtsordnungen.
- Signaturgeräte sind unterschiedliche Hardware-Marken mit unterschiedlichen Betriebssystemen.
- Für die Transaktionsbestätigung wird ein separater Kommunikationskanal verwendet, der unabhängig von der Signatur-UI ist.
- Es existiert ein dokumentierter Prozess zur Überprüfung der Transaktionsnutzdaten (Payload) gegen ein erwartetes Diff – Calldata, Ziel, Wert –, bevor ein Unterzeichner zustimmt.
- Der Multisig-Contract selbst ist gut geprüft (Safe ist der konservative Standard im Jahr 2026) und die Version ist fixiert (pinned) und bekannt.
- Ein Verfahren zum Ersetzen von Unterzeichnern existiert und wurde geprobt.

Das erfordert mehr Disziplin, als den meisten Teams anfangs bewusst ist. Die gute Nachricht ist, dass diese Disziplin eine einmalige Investition ist; die schlechte Nachricht ist, dass die Disziplin wichtiger ist als der Contract.

## Wie das mit Domains zusammenhängt

Naming ist eine der stärksten Analogien zu Multisig in der Off-Chain-Welt. Eine Domain, die von einem einzigen [Registrar](/de/glossary/registrar/)-Konto hinter einem einzigen Passwort kontrolliert wird, ist eine Single-Key-Wallet. Eine Domain, die durch Registrar Lock + Registry Lock + 2FA beim DNS-Anbieter + mehrere autoritative Anbieter geschützt ist, ist strukturell ein Multisig: Mehrere unabhängige Faktoren müssen jeweils kompromittiert werden, bevor der Name den Besitzer wechselt.

Namefi geht noch einen Schritt weiter, indem es das Eigentum als On-Chain-Eintrag repräsentiert, der direkt in einer Multisig-Wallet gehalten werden kann. Dasselbe Schwellenwertsystem, das ein Treasury schützt, kann nun auch die *DNS-Kontrollebene* (DNS Control Plane) schützen – so kann eine einzelne gephishte Person die Domain des Unternehmens genauso wenig verlieren, wie sie allein das Treasury plündern könnte. Das Upgrade des Bedrohungsmodells ist in beiden Welten dasselbe: Ersetze "Vertraue auf ein Zugangssignal" durch "Kompromittiere M von N unabhängigen Faktoren".

## Quellen und weiterführende Literatur

- Safe — [Smart Account Contracts und Audits](https://safe.global/).
- IETF FROST — [RFC 9591, das Flexible Round-Optimized Schnorr Threshold Protokoll](https://www.rfc-editor.org/rfc/rfc9591#:~:text=FROST%20signatures%20can%20be%20issued%20after%20a%20threshold%20number%20of%20entities%20cooperate%20to%20compute%20a%20signature).
- Bitcoin — [BIP-174 PSBT](https://github.com/bitcoin/bips/blob/master/bip-0174.mediawiki).
- Parity — [Multisig Freeze Post-Mortem](https://www.parity.io/blog/security-alert/).
- a16z crypto — [Praktischer Leitfaden für den Betrieb eines Safe Multisigs](https://a16zcrypto.com/posts/article/secure-your-tokens-set-up-a-safe-multisig/).