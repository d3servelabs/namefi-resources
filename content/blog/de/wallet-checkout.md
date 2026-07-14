---
title: "Domains mit einer Krypto-Wallet bezahlen: Kein Konto nötig"
date: '2026-07-10'
language: 'de'
tags: ['ai-agents', 'payments']
authors: ['namefiteam']
draft: false
format: explainer
ogImage: ../../assets/wallet-checkout-og.jpg
description: "Wie der per Wallet-Signatur autorisierte Checkout von Namefi einem KI-Agenten ermöglicht, eine Domain mit Krypto zu kaufen — ohne Konto: Ablauf, Sicherheitsmodell und Ausgabenrichtlinien."
keywords: ["krypto-zahlung für domain", "wallet-checkout domain-registrierung", "domain mit krypto-wallet kaufen ohne konto", "domain mit usdc bezahlen", "ki-agent bezahlt domain mit krypto", "x402 domain-registrierung", "eip-3009 transferwithauthorization", "domain-registrar akzeptiert krypto", "checkout mit wallet-signatur", "namefi x402", "agentische zahlungen", "stablecoin-domainkauf", "domain-registrierung ohne konto", "eip-712 wallet-signatur"]
relatedArticles:
  - /de/blog/ai-agent-register/
  - /de/blog/claude-mcp-domains/
  - /de/blog/cf-namecom-namefi/
  - /de/blog/namefi-mcp/
  - /de/blog/agent-own-domain/
relatedTopics:
  - /de/topics/domain-tokenization/
  - /de/topics/web3-foundations/
relatedSeries:
  - /de/series/blockchain-concepts/
  - /de/series/tokenize-your-com/
relatedGlossary:
  - /de/glossary/x402/
  - /de/glossary/wallet/
  - /de/glossary/stablecoin/
  - /de/glossary/private-key/
  - /de/glossary/tokenized-domain/
---

Jeder andere Beitrag über „ein KI-Agent kann eine Domain für dich kaufen“ stößt irgendwann auf dieselbe Hürde: Wie bezahlt der Agent tatsächlich? Eine Kreditkarte setzt voraus, dass ein Mensch anwesend ist, Ziffern in ein Formular eingibt, eine Betrugsprüfung besteht und einen einmaligen, an ein Telefon gesendeten Code bestätigt. Ein [KI-Agent](/de/glossary/ai-agent/) kann nichts davon. Die Antwort von Namefi ist ein Checkout-Weg, der keine Karte, keine gespeicherte Zahlungsmethode und überhaupt kein Namefi-Konto braucht — nur eine Krypto-[Wallet](/de/glossary/wallet/), die eine Zahlung im Moment der Transaktion signiert. Dieser Beitrag erklärt ausführlich, wie dieser Ablauf tatsächlich funktioniert, was das Signaturverfahren einem Agenten erlaubt und was nicht, und wann stattdessen Abrechnung über einen API-Key sinnvoll ist.

## Warum die Zahlung der schwierigste Teil des agentischen Handels ist

Suche und Preisabfrage waren nie der schwierige Teil, wenn ein Agent Dinge kaufen soll. Das sind schreibgeschützte Aufrufe — keine Autorisierung nötig, und nichts steht auf dem Spiel, falls ein Agent sich irrt. Bei der Zahlung ist es anders, denn sie ist der eine Schritt, bei dem ein Fehler echtes Geld kostet; jedes heute weit verbreitete Zahlungssystem setzt voraus, dass eine Person die Belastung autorisiert.

Eine gespeicherte Karte ist das deutlichste Beispiel. Die Abrechnung per hinterlegter Karte funktioniert, indem man einem Zahlungsabwickler ein Token übergibt, das später auf Veranlassung des Händlers erneut belastet werden kann, ohne dass der Karteninhaber im Moment der Belastung erneut etwas nachweisen muss. Für ein Abonnement, dem du vertraust und das dich monatlich abrechnet, ist das in Ordnung. Für einen autonomen Prozess passt es schlechter: Wer diesen Token der gespeicherten Karte besitzt, kann ihn belasten. Die einzige echte Verteidigung besteht darin, darauf zu vertrauen, dass die Software ihn nicht missbraucht, oder den Missbrauch später auf dem Kontoauszug zu entdecken. Es gibt keine Möglichkeit, einem Agenten eine gespeicherte Karte zu geben, die nur Domain-Registrierungen bis zu $50 bezahlt — die Karte weiß nicht, wofür sie eingesetzt wird.

[Was ist ein agent-nativer Domain-Registrar?](/de/blog/agent-native/) erläutert, warum Zahlung zu den tragenden Elementen der Nutzbarkeit durch einen Agenten gehört und nicht nur eine API vorhanden sein muss. Der Krypto-Wallet-Checkout von Namefi ist die konkrete Antwort auf diese Anforderung: Statt einer gespeicherten Zugangsinformation, die ein Dienst jederzeit belasten kann, ist jede Zahlung eine Signatur, die die Wallet für genau diese Transaktion, zu genau diesem Preis und für nichts anderes erstellt.

## Die Antwort von Namefi: Checkout per Wallet-Signatur, ohne Kontoerstellung

Die Registrierung einer Domain auf Namefi verwendet normalerweise einen über einen aufgeladenen NFSC- (Namefi Service Credit-)Saldo abgerechneten [API-Key](https://namefi.io/api-key), wie in [Wie du mit deinem KI-Agenten eine Domain bei Namefi registrierst](/de/blog/ai-agent-register/) beschrieben. Dieser Weg erfordert ein Konto: Jemand erzeugt aus einer Wallet einen Key, lädt einen Saldo auf und der Key wird bei jeder Registrierung dagegen abgerechnet.

Der Weg per Wallet-Signatur überspringt all das. Laut der von Namefi veröffentlichten maschinenlesbaren Dokumentation für Wallet-Zahlungen kann die Wallet eines Agenten direkt in [USDC](/de/glossary/stablecoin/) zahlen, ohne dass irgendwo ein Namefi-Konto oder API-Key vorliegt. Die Wallet des Käufers signiert eine Zahlungsautorisierung, und die Registrierung wird abgewickelt, sobald diese Signatur eintrifft. Es muss nichts im Voraus angelegt werden, und es gibt keine dauerhafte Berechtigung, die später missbraucht werden könnte: Die Wallet handelt nur in dem Moment, in dem sie signiert.

Namefi dokumentiert drei Wege, wie eine Wallet diese Signatur erzeugen kann, die unten Schritt für Schritt behandelt werden: das [x402](/de/glossary/x402/)-Protokoll (der primäre Weg und der Fokus dieses Leitfadens), eine Challenge-Response-Variante des Machine Payable Protocol (MPP) sowie einen manuellen EIP-712-Signaturweg für Wallets, die keine der beiden Abkürzungen verwenden.

## Der x402-Ablauf Schritt für Schritt

x402 ist ein offener Standard, der von Unternehmen wie Cloudflare, AWS und Stripe unterstützt wird. Er belebt den lange ungenutzten HTTP-Statuscode `402 Payment Required` als strukturierte Möglichkeit wieder, im Rahmen einer normalen Anfrage nach einer On-Chain-Zahlung zu fragen, statt auf eine separate Checkout-Seite weiterzuleiten. Namefi implementiert ihn auf seinem Endpoint für die Domain-Registrierung:

1. **Anfrage ohne Zahlung.** Der Agent sendet eine einfache `GET`-Anfrage an den Endpoint `/x402/domain/{domainName}` von Namefi — ohne beigefügte Zahlung, denn er kennt den Preis noch nicht.
2. **HTTP 402 mit Preis.** Namefi antwortet mit `402 Payment Required` und nimmt die Zahlungsoptionen in den Response-Body auf: Netzwerk, akzeptierter Vermögenswert (USDC) und Betrag. Das unterscheidet x402 von einem normalen Fehler: Der Status 402 trägt alles, was der Client zum Konstruieren einer gültigen Zahlung benötigt, statt nur „nein“ zu sagen.
3. **Die Wallet signiert ein EIP-3009 `transferWithAuthorization`.** Statt eine separate Blockchain-Transaktion zu senden und auf ihre Bestätigung zu warten, erzeugt die Wallet eine Signatur gemäß [EIP-3009](https://eips.ethereum.org/EIPS/eip-3009), einem Ethereum-Standard speziell für per Signatur autorisierte Token-Transfers. Die Funktion `transferWithAuthorization` von EIP-3009 erlaubt einem Token-Inhaber, eine Nachricht zu signieren, die einen Transfer eines bestimmten Betrags an einen bestimmten Empfänger autorisiert, nur innerhalb eines bestimmten Zeitfensters gültig (`validAfter` / `validBefore`), die ein Dritter dann On-Chain einreichen kann. Die Dokumentation von Namefi stellt ausdrücklich klar, dass dieser Schritt weder ein Namefi-Konto noch vorheriges EIP-712-Signieren benötigt — die Wallet signiert schlicht eine eigenständige USDC-Transferautorisierung.
4. **Die Anfrage mit einem Payment-Header wiederholen.** Der Agent sendet die ursprüngliche Anfrage erneut, diesmal mit einem `X-PAYMENT`-Header, der die signierte Autorisierung trägt.
5. **Überprüfen, abwickeln, registrieren.** Namefi überprüft die Signatur, startet den Ablauf der Domain-Registrierung und wickelt die Zahlung ab — USDC bewegt sich aus der Wallet des Käufers und die Registrierung läuft wie über den API-Key-Weg weiter, einschließlich der Registrierung der Domain als [NFT](https://eips.ethereum.org/EIPS/eip-721) — einer [tokenisierten Domain](/de/glossary/tokenized-domain/) — standardmäßig für dieselbe zahlende Wallet.

Nichts an dieser Abfolge erfordert, dass der Agent ein Namefi-Konto erstellt, eine Zugangsinformation speichert, die Namefi ohne weitere Nachfrage wiederverwenden könnte, oder die Verwahrung der Mittel vor dem genauen Zeitpunkt der Zahlung aufgibt. Die Signatur beweist nur, dass die Wallet diesen konkreten USDC-Transfer, für diesen Betrag und innerhalb eines begrenzten Zeitfensters autorisiert hat.

## Die MPP-Challenge-Response-Variante

x402 ist der primäre Weg, doch Namefi dokumentiert auch einen zweiten für Wallets oder Agenten-Frameworks, die ein anderes Zahlungsmuster sprechen: das Machine Payable Protocol (MPP). Strukturell ist es das Spiegelbild von x402 — eine Challenge-Response statt einer bloßen 402:

1. Die erste Anfrage an den geschützten Endpoint gibt erneut `402 Payment Required` zurück, diesmal jedoch mit einer **signierten Challenge** statt eines einfachen Preisangebots.
2. Der Client (typischerweise über das speziell für den Signaturschritt entwickelte Kommandozeilentool `mppx` von Namefi) signiert diese Challenge mit der zahlenden Wallet.
3. Der Client wiederholt die ursprüngliche Anfrage mit der resultierenden Signatur in einem `Authorization`-Header.

Der Nettoeffekt ist derselbe wie bei x402 — eine von der Wallet signierte Zahlung pro Anfrage ohne gespeicherte Zugangsinformation —, verpackt als signierter Challenge-Handshake statt als bloße Preis-in-402-Antwort. Welchen der beiden Wege ein Agent nutzt, hängt davon ab, welche Zahlungstools er bereits spricht; der Endpoint von Namefi versteht beide.

## Der manuelle EIP-712-Weg

Für Wallets oder Skripte, die keine der beiden Abkürzungen verwenden, stellt Namefi einen niedrigeren, vollständig manuellen Signaturweg bereit, der auf [EIP-712](https://eips.ethereum.org/EIPS/eip-712)-Signieren typisierter Daten aufbaut, demselben Standard, auf dem EIP-3009 selbst aufbaut. Eine so signierte Anfrage trägt drei Header — `x-namefi-signer` (die Adresse der signierenden Wallet), `x-namefi-signature` (die hex-codierte Signatur) und `x-namefi-eip712-type` (gegen welches Schema typisierter Daten die Signatur erstellt wurde) — und verpackt ihren Payload in einen Umschlag mit `payloadType`, dem `payload` selbst, einem `timestamp` und einem `nonce`.

Zwei Details sind auf diesem manuellen Weg für die Sicherheit wichtig: **Signaturen laufen nach 300 Sekunden ab, und Nonces können nur einmal verwendet werden.** Sobald 300 Sekunden vergangen sind oder eine Anfrage mit dem Nonce akzeptiert wurde, kann eine abgefangene Signatur nicht mehr erfolgreich erneut eingereicht werden. Die Dokumentation von Namefi gibt außerdem an, dass die aktuellen EIP-712-Typdefinitionen zur Anfragezeit von den Endpoints `/v-next/eip712/` abgerufen und nicht von einer Integration fest verdrahtet werden müssen, da sich das exakte Schema, dem eine Signatur entsprechen muss, ändern kann.

Namefi dokumentiert auch die Signatur durch Smart-Contract-Wallets auf diesem Weg: Ein genehmigtes externes Konto (EOA) kann gemäß ERC-1271 oder dem neueren EIP-7702 im Namen einer Contract-Wallet signieren, sofern der Contract eine Prüfung `approvedSigners(address)` implementiert, gegen die die API verifizieren kann.<!-- TODO: confirm — how commonly this smart-contract-wallet path is used in practice versus a standard EOA wallet -->

## Das Sicherheitsmodell: Was der Agent kann und nicht kann

Es lohnt sich, genau zu benennen, was dieses Signaturverfahren tatsächlich beschränkt, statt eine stärkere Garantie zu beschreiben, als der Mechanismus liefert.

**Was es beschränkt.** Jeder Weg verlangt von der Wallet eine Signatur für die aktuelle Anfrage, statt Namefi dauerhafte Zugangsinformationen zu überlassen. Die Schutzmechanismen gegen Replay-Angriffe unterscheiden sich je nach Protokoll: Beim manuellen EIP-712-Weg läuft die Signatur nach 300 Sekunden ab und ein nur einmal verwendbarer Nonce wird verbraucht; x402 verwendet eine EIP-3009-Autorisierung, die an einen bestimmten Betrag und Empfänger gebunden, durch `validAfter`/`validBefore` zeitlich begrenzt und durch einen Nonce geschützt ist; beim MPP signiert der Client die vom Server ausgestellte Challenge, sodass die Ablauf- und Replay-Bedingungen den Vorgaben dieser Challenge entsprechen. Die Wallet erteilt Namefi niemals eine dauerhafte Berechtigung, künftige Belastungen selbst auszulösen. Vergleiche das mit einer gespeicherten Karte: Sobald ein Händler deinen Kartentoken besitzt, begrenzt nichts am Token selbst, was er im nächsten Monat belastet oder ob ein kompromittiertes System ihn wiederverwendet. In keinem dieser Abläufe verlässt der private Schlüssel der Wallet die Wallet — der Agent bittet sie, eine Signatur für eine konkrete Anfrage zu erzeugen; das ist der gesamte Umfang des Vorgangs.

**Was es allein nicht beschränkt.** Die Dokumentation von Namefi beschreibt keine eingebaute, pro Transaktion in Dollar festgelegte Ausgabenobergrenze, die vom Protokoll selbst erzwungen wird. Die protokollspezifischen Ablauf- und Replay-Schutzmechanismen begrenzen, wann und wie eine Autorisierung wiederverwendet werden kann, nicht aber, welchen Betrag eine einzelne signierte Anfrage autorisieren kann.<!-- TODO: confirm with team — whether Namefi's x402/MPP endpoint enforces any server-side maximum payment amount independent of what the client requests to sign --> In der Praxis kommt die tatsächliche Ausgabendisziplin für einen Agenten von außerhalb dieses Mechanismus: davon, wie viel USDC du in die Wallet einzahlst, und von jeder Richtlinienschicht — etwa einer [Multi-Sig](/de/glossary/multi-sig/)-Wallet, die eine zweite Genehmigung verlangt, oder einem Schritt der menschlichen Bestätigung, bevor der Agent überhaupt signieren darf —, die du zwischen den Agenten und den [privaten Schlüssel](/de/glossary/private-key/) der Wallet setzt. [Was ist ein agent-nativer Domain-Registrar?](/de/blog/agent-native/) und [Wie du mit deinem KI-Agenten eine Domain bei Namefi registrierst](/de/blog/ai-agent-register/) behandeln denselben Punkt aus Sicht der Leitplanken: Fülle die Wallet nur mit dem Betrag, dessen Ausgabe durch einen unbeaufsichtigten Prozess für dich akzeptabel ist, und entscheide im Voraus, wann ein Mensch zustimmen muss.

Diese Kombination — keine dauerhafte Zugangsinformation, eine begrenzte Autorisierung pro Transaktion und die Finanzierung als praktische Ausgabengrenze — schafft ein tatsächlich anderes Risikoprofil als eine hinterlegte Karte, nicht nur eine krypto-gefärbte Variante desselben. Eine geleakte Kartennummer oder ein kompromittiertes Abrechnungs-Token kann wiederholt belastet werden, bis es jemand bemerkt und sperrt. Eine abgefangene Zahlungsautorisierung wird abgewiesen, sobald ihre protokollspezifische Ablauf- oder Replay-Bedingung erfüllt ist: Der manuelle EIP-712-Weg lehnt sie nach 300 Sekunden oder nach Verbrauch ihres Nonce ab; die EIP-3009-Autorisierung von x402 wird außerhalb des durch `validAfter`/`validBefore` festgelegten Zeitfensters oder nach Verwendung ihres Nonce abgelehnt; und für MPP-Zugangsinformationen gelten die Ablauf- und Replay-Bedingungen, die in der signierten Challenge festgelegt sind.

## Wann stattdessen API-Key- oder NFSC-Abrechnung verwendet werden sollte

Der Weg per Wallet-Signatur ist das richtige Werkzeug, wenn der Kernpunkt ist, dass vor dem Kauf kein Konto bestehen soll — ein vollständig autonomes Skript, ein Agent, der im Auftrag einer anderen Person ohne gemeinsam genutzte Login-Daten arbeitet, oder die Präferenz, eine Krypto-native Wallet als einzige beteiligte Identität zu behalten. Er ist nicht automatisch für jede Situation das richtige Werkzeug.

Die Abrechnung über einen API-Key gegen einen aufgeladenen NFSC-Saldo, wie in [Wie du mit deinem KI-Agenten eine Domain bei Namefi registrierst](/de/blog/ai-agent-register/) beschrieben, ist sinnvoller, wenn ein Agent wiederholt Domains registriert und ein dauerhafter, überprüfbarer Saldo besser ist als jedes Mal eine neue Zahlung zu signieren; wenn der Betreiber eine einzelne Dashboard-Ansicht der Ausgaben möchte, statt sie aus On-Chain-Transfers zu rekonstruieren; oder wenn der Client bereits eine saubere Möglichkeit hat, einen Header-Wert zu speichern, aber keine einfache Möglichkeit, einen privaten Schlüssel zu halten und damit zu signieren. Beide Wege führen nach der Zahlungsabwicklung zu denselben Registrierungs- und DNS-Vorgängen — die Wahl betrifft die Art der Autorisierung, nicht was du danach registrieren oder verwalten kannst.

## Häufig gestellte Fragen

### Brauche ich ein Namefi-Konto, um mit einer Krypto-Wallet zu bezahlen?

Nein. Sowohl der x402- als auch der MPP-Ablauf wickeln eine Domain-Registrierung aus einer signierten Wallet-Zahlung ab, ohne dass zuvor ein Namefi-Konto oder API-Key erstellt wird. Ein API-Key ist nur für den Abrechnungsweg über den NFSC-Saldo erforderlich.

### Welche Kryptowährung akzeptiert Namefi für den Wallet-Checkout?

USDC. Der x402-Endpoint von Namefi gibt den Preis an und wickelt die Zahlung spezifisch in USDC ab. Dadurch werden die Preisschwankungen vermieden, die ein volatiler Vermögenswert wie ETH zwischen Preisstellung und Zahlungsabwicklung verursachen würde.

### Ist das Signieren einer Wallet-Zahlung dasselbe wie dem Agenten meinen privaten Schlüssel zu geben?

Nein — eine Signatur wird von der Wallet erzeugt, ohne dass der private Schlüssel selbst jemals offengelegt wird. Der Agent (oder die von ihm aufgerufenen Tools) bittet die Wallet, eine konkrete, begrenzte Autorisierung zu signieren; der Schlüssel bleibt die ganze Zeit in der Wallet.

### Kann jemand eine Zahlungs-Signatur wiederverwenden, die ich früher erstellt habe?

Eine abgefangene Signatur kann verwendbar bleiben, bis sie durch ihre Ablauf- oder Replay-Schutzbedingung abgewiesen wird; für die drei Wege gibt es keine einheitliche Regel. Beim manuellen EIP-712-Weg laufen Signaturen nach 300 Sekunden ab, und jeder Nonce kann nur einmal verwendet werden. Die EIP-3009-Autorisierung des x402-Ablaufs ist nur innerhalb ihres `validAfter`/`validBefore`-Fensters gültig, und ihr Nonce kann nicht zweimal verwendet werden. MPP verwendet eine signierte Challenge; ihre Ablauf- und Replay-Bedingungen müssen daher in dieser Challenge geprüft werden, statt sie als identisch mit denen der beiden anderen Wege anzunehmen.

### Wird die Domain beim Bezahlen auf diese Weise automatisch tokenisiert?

Ja, standardmäßig — die registrierte Domain wird als NFT für dieselbe Wallet geprägt, die bezahlt hat. Das entspricht demselben Tokenisierungsverhalten wie beim API-Key-Weg, sofern keine andere empfangende Wallet angegeben wird. [Cloudflare vs. Name.com vs. Namefi: Agent-native Registrare](/de/blog/cf-namecom-namefi/) zeigt, wie sich dies von Registraren unterscheidet, die weder Wallet-nativen Checkout noch tokenisierte Eigentümerschaft anbieten.

### Ist Wallet-Checkout sicherer als die Zahlung mit einer gespeicherten Karte?

Er beschränkt andere Risiken, statt Risiken insgesamt zu beseitigen. Es gibt keine dauerhafte Zugangsinformation, die ein kompromittiertes System unbegrenzt wiederverwenden kann, und jede Zahlung erfordert eine neue Signatur für die jeweilige Anfrage. Die Schutzmechanismen gegen Replay-Angriffe unterscheiden sich: Beim manuellen EIP-712-Weg gelten ein Ablauf nach 300 Sekunden und ein nur einmal verwendbarer Nonce; die EIP-3009-Autorisierung von x402 nutzt `validAfter`/`validBefore` und einen Nonce; MPP folgt den Bedingungen seiner signierten Challenge. Keiner dieser Mechanismen begrenzt den Betrag, den eine einzelne signierte Anfrage autorisieren kann. Die praktische Obergrenze dessen, was ein Agent ausgeben kann, ergibt sich daher weiterhin aus dem Betrag, mit dem du die Wallet finanzierst, und aus zusätzlichen Genehmigungsrichtlinien (etwa einer Multi-Sig), die du davor schaltest.

## Eine Domain mit einer Wallet bei Namefi kaufen

Wenn der Sinn der Nutzung eines Agenten darin liegt, dass kein menschliches Konto zwischen Agent und Kauf stehen soll, ist der Checkout von Namefi per Wallet-Signatur genau dafür gebaut: eine echte, ICANN-akkreditierte Domain-Registrierung, bezahlt mit einer einzigen signierten USDC-Autorisierung, wobei die tokenisierte Eigentümerschaft in derselben Wallet landet, die bezahlt hat. Die vollständige Mechanik steht in [namefi.io/web3/llms.txt](https://namefi.io/web3/llms.txt), oder beginne mit der umfassenderen Einrichtung in [Wie du mit deinem KI-Agenten eine Domain bei Namefi registrierst](/de/blog/ai-agent-register/).

**[Eine Domain bei Namefi suchen und registrieren](https://namefi.io).**

## Quellen und weiterführende Lektüre

- Namefi — [namefi.io/web3/llms.txt](https://namefi.io/web3/llms.txt) (Primärquelle für den x402-Ablauf, die MPP-Challenge-Response-Variante, den manuellen EIP-712-Signaturweg, Regeln zu Ablauf/Nonce und die Signatur durch Smart-Contract-Wallets nach ERC-1271/EIP-7702)
- Namefi — [namefi.io/llms.txt](https://namefi.io/llms.txt) (NFSC-/API-Key-Abrechnungsweg und Verweis auf die obige Referenz für Wallet-Zahlungen)
- x402.org — [x402: Ein Internet-nativer Zahlungsstandard](https://x402.org) (das offene, auf HTTP 402 beruhende Zahlungsprotokoll, das der Ablauf von Namefi implementiert)
- Ethereum — [EIP-3009: Transfer With Authorization](https://eips.ethereum.org/EIPS/eip-3009) (der Signaturstandard hinter dem Schritt `transferWithAuthorization`; zeitliche Begrenzung über `validAfter`/`validBefore`, nur einmal verwendbare zufällige Nonces)
- Ethereum — [EIP-721: Non-Fungible Token Standard](https://eips.ethereum.org/EIPS/eip-721) (der NFT-Standard, auf dem tokenisierte Domain-Eigentümerschaft beruht)
- Namefi — [Wie du mit deinem KI-Agenten eine Domain bei Namefi registrierst](/de/blog/ai-agent-register/) (der Abrechnungsweg über API-Key/NFSC und weitergehende Leitplanken)
- Namefi — [Cloudflare vs. Name.com vs. Namefi: Agent-native Registrare](/de/blog/cf-namecom-namefi/) (wie sich Wallet-nativer Checkout bei den drei agentengerichteten Registraren vergleicht)
