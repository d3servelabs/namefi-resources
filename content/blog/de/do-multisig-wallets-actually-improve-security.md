---
title: 'Verbessern Multisig-Wallets die Sicherheit wirklich? Eine Betrachtung des Bedrohungsmodells'
date: '2026-05-07'
language: de
tags: ['security', 'wallets', 'multisig', 'web3', 'key-management']
authors: ['namefiteam']
draft: false
description: 'Multisignature-Wallets werden in der Kryptowelt weithin als Standard für eine sichere Verwahrung angesehen. Die Antwort auf die Frage "Verbessern sie die Sicherheit wirklich?" hängt jedoch vollständig vom Bedrohungsmodell ab. Dieser Artikel zeigt auf, welche Angriffe Multisig abwehrt, welche nicht und wo es die Situation sogar verschlimmern kann.'
ogImage: ../../assets/do-multisig-wallets-actually-improve-security-og.jpg
keywords: ['Multisig-Wallet', 'Multisignatur', 'Safe Wallet', 'Gnosis Safe', 'Key Management', 'Self Custody', 'Threshold-Signatur', 'Social Recovery', 'Namefi']
---

Multisignatur-Wallets – Wallets, bei denen M von N Schlüsseln signieren müssen, bevor eine Transaktion gültig ist – werden in der Regel als logisches Upgrade gegenüber einer Hot Wallet mit nur einem Schlüssel präsentiert. Die meisten Treasury-Setups in DAOs, Börsen und seriösen Krypto-Unternehmen nutzen eine Art von Multisig (Safe, Squads, Multisig.js, Threshold-Signatur-Varianten).

Dieser gute Ruf ist wohlverdient, gilt jedoch nur für ein *spezifisches* Bedrohungsmodell. Multisig wehrt einige der häufigsten Methoden ab, mit denen Gelder gestohlen werden, richtet gegen andere jedoch fast nichts aus. Hier ist die ehrliche Version: worin Multisig wirklich gut ist, wo es zu kurz kommt und in welchen Fällen seine Einführung ein Setup sogar *weniger* sicher machen kann.

## Was Multisig ist, ganz kurz gefasst

Bei einem 2-aus-3-Multisig existieren drei private Schlüssel; beliebige zwei davon müssen eine Transaktion signieren, damit sie On-Chain ausgeführt wird. Die Wallet selbst ist ein Smart Contract (in der Ethereum/EVM-Welt) oder ein nativer Multisig-Output-Typ (bei Bitcoin via [P2SH/P2WSH](https://en.bitcoin.it/wiki/BIP_0016)). Der Contract verifiziert die Signaturen und leitet die Transaktion dann weiter.

Die am weitesten verbreitete Implementierung in EVM-Ökosystemen ist [Safe](https://safe.global/) (ehemals Gnosis Safe). Auf Solana übernimmt [Squads](https://squads.so/) dieselbe Rolle. Bitcoin hat eine lange Geschichte der nativen Multisig-Unterstützung, oft kombiniert mit Hardware-Wallets über [PSBT-Workflows](https://github.com/bitcoin/bips/blob/master/bip-0174.mediawiki).

Threshold-Signatur-Schemata (TSS, FROST, MPC) erzielen ein ähnliches Ergebnis mit einem einzigen On-Chain-Schlüssel – jeder Unterzeichner hält einen *Teil* (Share) des privaten Schlüssels und sie signieren gemeinsam, ohne ihn jemals zu rekonstruieren. Aus Sicht des Bedrohungsmodells gelten die meisten der folgenden Punkte für beide Varianten gleichermaßen, mit einigen wenigen Einschränkungen, auf die später eingegangen wird.

## Was Multisig abwehrt (die guten Nachrichten)

### Kompromittierung eines einzelnen Schlüssels

Das ist der Hauptvorteil. Wenn die Hardware-Wallet eines Unterzeichners gestohlen wird, das Telefon eines Unterzeichners mit Malware infiziert ist oder die Seed-Phrase eines Unterzeichners durchsickert, kann ein Angreifer mit diesem einzelnen Schlüssel keine Gelder bewegen. Er muss gleichzeitig mindestens M-1 weitere Schlüssel kompromittieren.

Bei einem 2-aus-3-Setup bedeutet dies, dass der Angreifer *zwei unabhängige Endpunkte* kompromittieren muss, die idealerweise von verschiedenen Personen, auf unterschiedlicher Hardware und an verschiedenen physischen Standorten verwaltet werden. Die Wahrscheinlichkeit von zwei unabhängigen Kompromittierungen im selben Zeitfenster ist in der Regel um Größenordnungen geringer als die Wahrscheinlichkeit einer einzigen.

### Insider-Risiken

Eine einzelne Person mit voller Verwahrungsgewalt kann das Handtuch werfen ("Rage-Quit"), überlaufen, erpresst werden oder schlichtweg einen katastrophalen Fehler machen. Multisig erzwingt Kollusion (Absprache). Für DAOs und Unternehmen ist dies oft die *primäre* Motivation – der Sicherheitsvorteil gegenüber externen Angreifern ist zweitrangig gegenüber dem Governance-Vorteil gegen einzelne interne Akteure.

### Wiederherstellung verlorener Schlüssel

In einem M-aus-N-Setup mit N > M ist der Verlust eines Schlüssels nicht katastrophal. Die verbleibenden Unterzeichner können die Gelder auf ein neues Multisig verschieben und den verlorenen Schlüssel ersetzen. Dies ist eine deutliche Verbesserung gegenüber der Verwahrung mit nur einem Schlüssel, bei der eine verlorene Seed-Phrase einen dauerhaften Verlust bedeutet.

### Phishing des Nutzers

Viele Wallet-Phishing-Angriffe (gefälschte Airdrop-Seiten, bösartige Token-Freigaben, Drainer-Contracts) beruhen darauf, dass der Nutzer in einer einzigen Browser-Sitzung eine bösartige Transaktion signiert. Ein Multisig fügt einen Bestätigungsschritt auf einer anderen Ebene hinzu – eine koordinierende Benutzeroberfläche wie die von Safe oder eine Hardware-Zustimmung auf mehreren Geräten. Dies gibt dem Nutzer einen weiteren Moment, um zu bemerken, dass er etwas signiert, was er gar nicht beabsichtigt hat.

## Was Multisig *nicht* abwehrt (der unbequeme Teil)

Dies ist der Abschnitt, den die meisten oberflächlichen Betrachtungen überspringen.

### Smart-Contract-Bugs im Multisig selbst

Das Multisig ist ein Smart Contract. Wenn der Contract einen Fehler (Bug) aufweist, hilft auch das sorgfältigste Key Management der Welt nicht weiter. Der teuerste Multisig-Vorfall in der Geschichte – der [Parity Multisig Freeze](https://www.parity.io/blog/security-alert/) im November 2017 – war ein Contract-Bug, keine Kompromittierung von Schlüsseln. ETH im Wert von etwa 150 Millionen US-Dollar wurden durch eine einzige Transaktion dauerhaft unzugänglich gemacht.

Das moderne Safe ist einer der am häufigsten auditierten Contracts auf Ethereum und hat sich gut bewährt, aber die Kernaussage bleibt: Man tauscht „einen zu schützenden privaten Schlüssel“ gegen „einen Smart Contract, dem man vertrauen muss“. Dieses Vertrauen muss durch Audits und im Laufe der Zeit verdient und immer wieder neu bestätigt werden.

### Kompromittierung der Signatur-Benutzeroberfläche

Fast jede Multisig-Freigabe erfolgt über eine Schnittstelle – die Web-Benutzeroberfläche (UI) von Safe, ein Wallet-Plugin, ein benutzerdefiniertes Dashboard. Wenn diese Schnittstelle kompromittiert ist (DNS-Hijacking, Supply-Chain-Angriff auf eine Abhängigkeit, bösartige Browser-Erweiterung), kann der Angreifer Unterzeichner A „Sende 1 ETH an alice.eth“ anzeigen, während er tatsächlich „Sende 1000 ETH an angreifer.eth“ an die Hardware-Wallet zum Signieren übermittelt.

Die meisten Hardware-Wallets zeigen zwar die tatsächliche Zieladresse an, aber die Unterzeichner überfliegen diese oft nur flüchtig. Der [Bybit-Vorfall](https://www.bybit.com/en-US/help-center/article/Incident-Report-Bybit-Exchange-Attack-Update) Anfang 2025 beruhte auf einer Kompromittierung der Safe UI; alle Unterzeichner genehmigten eine vermeintliche Routine-Transaktion, während im Hintergrund der Proxy-Contract modifiziert wurde.

Multisig schützt Sie vor einem Angreifer, der *nur* über einen Schlüssel verfügt. Es schützt Sie nicht vor einem Angreifer, der all Ihren Unterzeichnern die falsche Transaktion vorlegen kann.

### Koordiniertes Phishing mehrerer Unterzeichner

Wenn die Unterzeichner bekannt und erreichbar sind – was bei jedem Treasury mit einer veröffentlichten Safe-Adresse in der Regel der Fall ist –, kann ein Angreifer sie alle ins Visier nehmen. Führen Sie die gleiche Phishing-Kampagne bei jedem Unterzeichner durch. Warten Sie. Wenn zwei von drei an demselben Tag müde, abgelenkt oder unachtsam sind, ist der Schwellenwert erreicht.

Dies ist in der Praxis der realistischste Angriff auf gut geführte Multisigs, und die Abwehrmaßnahmen dagegen sind meist prozedural, nicht technisch: Out-of-Band-Bestätigung jeder Transaktion über einen separaten Kanal (Signal, ein anderer Chat, ein Telefonanruf) und eine strikte Richtlinie, wonach jede Transaktion über $X vor der Unterzeichnung live besprochen werden muss.

### Kompromittierung der Off-Chain-Schlüsselspeicherung

Wenn die „Signaturschlüssel“ bei einem 2-aus-3-Setup in der Realität aus den MetaMask-Seed-Phrases zweier Entwickler und einer Hardware-Wallet im Bürotresor bestehen, haben Sie ein OPSEC-Problem, das sich als Multisig tarnt. Der Schwellenwert ist technisch erfüllt, aber die Diversität ist nur eine Illusion. Eine Malware-Infektion auf den Laptops zweier Entwickler oder ein einziger Einbruch ins Büro kann den Schwellenwert kompromittieren.

Echte Diversität erfordert:

- Unterschiedliche Hardware-Modelle. (Ein Ledger, ein Trezor, ein Keystone.)
- Unterschiedliche Betriebssysteme für jede Software-Signatur.
- Verschiedene physische Standorte für jeden dauerhaften Speicher.
- Gegebenenfalls verschiedene Personen mit unterschiedlichen Bedrohungsprofilen.

### Verluste über den Schwellenwert hinaus

Die Kehrseite der Wiederherstellung: In einem 2-aus-3-Setup bedeutet der Verlust von *zwei* Schlüsseln einen dauerhaften Verlust. In einem 3-aus-5-Setup ist der Verlust von drei Schlüsseln endgültig. Je größer die Lücke zwischen M und N ist, desto sicherer ist man vor einzelnen Verlusten – aber desto einfacher ist es für einen Angreifer, M Unterzeichner für Phishing-Angriffe zu finden.

Das ist ein unvermeidbarer Zielkonflikt. Ein höheres M ist sicherer gegen externe Angriffe und schwieriger wiederherzustellen. Ein niedrigeres M ist leichter wiederherzustellen und einfacher anzugreifen. Es gibt keine Einstellung, die beides optimiert.

## Wo Multisig die Dinge *verschlimmern* kann

Ein paar ehrliche Fälle:

- **Bei sehr kleinen Beträgen** kann der operative Aufwand eines Multisigs (Transaktionskoordination, Gasgebühren bei EVM, Lernkurve) zu Fehlern führen, die bei der Verwahrung mit einem einzigen Schlüssel nicht aufgetreten wären. Das richtige Werkzeug für 200 $ „Krypto-Taschengeld“ ist ein hardwaregesicherter Einzelschlüssel.
- **Für Einzelnutzer, die Multisig als Wiederherstellungsschema betrachten**, in der Praxis aber alle drei Schlüssel auf Geräten aufbewahren, die sie allein kontrollieren, erhöht Multisig die Komplexität, ohne das Bedrohungsmodell zu verändern – wenn ein einzelner Angreifer heute eines dieser Geräte kompromittiert, kann er wahrscheinlich alle kompromittieren.
- **Für Organisationen, die nicht wirklich über eine Diversität der Unterzeichner verfügen** – alle sitzen im selben Büro, nutzen dasselbe VPN und dasselbe SSO – wird der Schwellenwert zur reinen Formsache.

In allen drei Fällen lautet die Antwort nicht: „Verwenden Sie die Verwahrung mit einem Schlüssel.“ Sie lautet: „Verwenden Sie Multisig *korrekt* oder nutzen Sie einen Verwahrer, der dies tut.“ Aber vorzugeben, dass allein die Art des Contracts Sicherheit bietet, unabhängig von der operativen Praxis, ist genau der Grund, warum es zu den bekannten großen Verlusten kommt.

## Wie eine gute Umsetzung aussieht

Ein 2-aus-3- oder 3-aus-5-Multisig funktioniert gut als Treasury-Kontrolle, wenn *alle* folgenden Punkte zutreffen:

- Die Unterzeichner sind verschiedene Personen, nach Möglichkeit in unterschiedlichen Gerichtsbarkeiten.
- Die Signaturgeräte stammen von unterschiedlichen Hardware-Marken und laufen auf unterschiedlichen Betriebssystemen.
- Für die Transaktionsbestätigung wird ein separater Kommunikationskanal genutzt, unabhängig von der Signatur-UI.
- Es gibt einen dokumentierten Prozess zur Überprüfung der Transaktions-Payload (Calldata, Ziel, Wert) anhand eines erwarteten Diff, bevor ein Unterzeichner seine Freigabe erteilt.
- Der Multisig-Contract selbst ist gut auditiert (Safe ist im Jahr 2026 der konservative Standard) und die Version ist festgeschrieben („pinned“) und bekannt.
- Ein Verfahren zum Austausch von Unterzeichnern ist vorhanden und wurde geprobt.

Dies erfordert mehr Disziplin, als den meisten Teams anfangs bewusst ist. Die gute Nachricht ist, dass diese Disziplin eine einmalige Investition ist; die schlechte Nachricht ist, dass die Disziplin wichtiger ist als der Contract selbst.

## Wie dies mit Domains zusammenhängt

Die Vergabe von Namen (Naming) ist eine der stärksten Analogien zu Multisig in der Off-Chain-Welt. Eine Domain, die von einem einzigen Registrar-Konto hinter einem einzigen Passwort kontrolliert wird, ist wie eine Single-Key-Wallet. Eine Domain, die durch Registrar Lock + Registry Lock + 2FA beim DNS-Anbieter + mehrere autoritative Anbieter geschützt ist, ist strukturell ein Multisig: Mehrere unabhängige Faktoren müssen jeweils kompromittiert werden, bevor der Name verschoben werden kann.

Namefi geht noch einen Schritt weiter, indem es das Eigentum als On-Chain-Eintrag abbildet, der direkt in einem Multisig-Wallet gehalten werden kann. Dasselbe Threshold-Schema, das ein Treasury schützt, kann nun auch die *DNS-Kontrollebene* schützen – so kann eine einzelne von Phishing betroffene Person die Unternehmensdomain ebenso wenig verlieren, wie sie allein das Treasury plündern könnte. Das Upgrade des Bedrohungsmodells ist in beiden Welten dasselbe: Ersetzen Sie „vertraue einer einzigen Zugangsdaten“ durch „kompromittiere M von N unabhängigen Faktoren“.

## Quellen und weiterführende Literatur

- Safe — [Smart account contracts and audits](https://safe.global/).
- IETF FROST — [RFC 9591, the Flexible Round-Optimized Schnorr Threshold protocol](https://www.rfc-editor.org/rfc/rfc9591#:~:text=FROST%20signatures%20can%20be%20issued%20after%20a%20threshold%20number%20of%20entities%20cooperate%20to%20compute%20a%20signature).
- Bitcoin — [BIP-174 PSBT](https://github.com/bitcoin/bips/blob/master/bip-0174.mediawiki).
- Parity — [Multisig freeze post-mortem](https://www.parity.io/blog/security-alert/).
- a16z crypto — [Practical guide to running a Safe multisig](https://a16zcrypto.com/posts/article/secure-your-tokens-set-up-a-safe-multisig/).