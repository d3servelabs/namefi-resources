---
title: "Die wichtigsten Blockchain-Datenschutztechnologien: Zero-Knowledge-Proofs, FHE, MPC, TEEs und Ringsignaturen"
date: '2026-07-02'
language: de
tags: ['guide']
authors: ['namefiteam']
draft: false
cluster: web3-foundations
series: blockchain-concepts
seriesOrder: 50
format: roundup
description: "Ein verständlicher Leitfaden zu den fünf führenden Blockchain-Datenschutztechnologien — Zero-Knowledge-Proofs, FHE, MPC, TEEs und Ringsignaturen — im direkten Vergleich."
ogImage: ../../assets/blockchain-privacy-technologies-og.jpg
keywords: ['blockchain-datenschutz', 'zero-knowledge-proof', 'zkp', 'vollständig homomorphe verschlüsselung', 'fhe', 'sichere mehrparteienberechnung', 'mpc', 'vertrauenswürdige ausführungumgebung', 'tee', 'ringsignaturen', 'stealth-adressen', 'monero', 'zcash', 'zksync', 'starknet', 'datenschutztechnologie', 'vertrauliches rechnen', 'onchain-datenschutz', 'blockchain-kryptografie', 'privacy coins']
relatedArticles:
  - /de/blog/blockchain-cryptographic-primitives/
  - /de/blog/blockchain-scaling-approaches/
  - /de/blog/blockchain-virtual-machines/
  - /de/blog/blockchain-consensus-mechanisms/
  - /de/blog/perfect-vs-computational-zero-knowledge/
relatedGlossary:
  - /de/glossary/zero-knowledge-proof/
  - /de/glossary/fully-homomorphic-encryption/
  - /de/glossary/secure-multiparty-computation/
  - /de/glossary/trusted-execution-environment/
  - /de/glossary/cryptographic-security/
relatedTopics:
  - /de/topics/web3-foundations/
  - /de/topics/domain-tokenization/
relatedSeries:
  - /de/series/tokenize-your-com/
  - /de/series/domain-flipping-skills/
---

Jede Transaktion auf einer öffentlichen [Blockchain](/de/glossary/blockchain/) ist standardmäßig für jeden sichtbar, der hinsieht. Guthaben, Transferbeträge und Gegenparteien stehen dauerhaft im offenen Ledger. Diese Transparenz ist die Quelle der Vertrauensgarantien einer Blockchain, aber auch eine Belastung: Keine Bank veröffentlicht Kundenguthaben, und kein Unternehmen möchte, dass Wettbewerber seine Lieferantenzahlungen oder Gehaltsläufe lesen können.

Blockchain-Datenschutztechnologien sollen diese Lücke schließen, ohne die Eigenschaften aufzugeben, die Chains überhaupt nützlich machen: Überprüfbarkeit, Dezentralisierung und die Fähigkeit Fremder, ohne vertrauenswürdigen Mittelsmann miteinander zu handeln. Fünf Techniken prägen die heutige Landschaft: [Zero-Knowledge-Proofs](/de/glossary/zero-knowledge-proof/), [vollständig homomorphe Verschlüsselung](/de/glossary/fully-homomorphic-encryption/) (FHE), [sichere Mehrparteienberechnung](/de/glossary/secure-multiparty-computation/) (MPC), [vertrauenswürdige Ausführungsumgebungen](/de/glossary/trusted-execution-environment/) (TEEs) sowie Ringsignaturen mit Stealth-Adressen. Jede verbirgt einen anderen Teil des Puzzles, beruht auf einer anderen Vertrauensannahme und erfordert unterschiedlich viel Rechenleistung. Dieser Leitfaden erklärt alle fünf, vergleicht sie direkt und zeigt, warum die Wahl für jeden wichtig ist, der auf [Web3](/de/glossary/web3/) baut oder es einfach verstehen möchte.

---

## Zero-Knowledge-Proofs

![Ein Prover überreicht einem Verifier ein leuchtendes Abzeichen für einen gültigen Beweis und hält dabei ein Dokument hinter seinem Rücken verschlossen, was zeigt, wie ein Zero-Knowledge-Proof überzeugt, ohne die zugrunde liegende Aussage offenzulegen](../../assets/blockchain-privacy-technologies-01-zero-knowledge.jpg)

Ein [Zero-Knowledge-Proof](/de/glossary/zero-knowledge-proof/) (ZKP) ermöglicht einer Partei — dem *Prover* —, eine andere — den *Verifier* — davon zu überzeugen, dass eine Aussage wahr ist, ohne etwas anderes darüber preiszugeben. Die Entwicklerdokumentation von Ethereum fasst es so: „A zero-knowledge proof is a way of proving the validity of a statement without revealing the statement itself“; der „prover“ versucht eine Behauptung zu beweisen, während der „verifier“ sie validiert ([ethereum.org](https://ethereum.org/en/zero-knowledge-proofs/#:~:text=A%20zero%2Dknowledge%20proof%20is,without%20revealing%20the%20statement%20itself)).

Damit ein Beweissystem ein echter Zero-Knowledge-Protokoll ist, muss es drei Eigenschaften erfüllen: Vollständigkeit („if the input is valid, the zero-knowledge protocol always returns 'true'“), Korrektheit („if the input is invalid, it is theoretically impossible to fool the zero-knowledge protocol to return 'true'“) und Zero Knowledge selbst, also dass der Verifier über eine Aussage außer ihrer Wahrheit oder Falschheit nichts erfährt ([ethereum.org](https://ethereum.org/en/zero-knowledge-proofs/)). Konkret besteht ein Beweis aus einem Witness, also dem dem Prover bekannten Geheimnis, einer Challenge des Verifiers und einer Antwort, durch die der Verifier das Wissen prüft, ohne den Witness zu sehen.

**Was verborgen wird:** die zugrunde liegenden Daten oder Berechnungen — offenbart wird nur der Beweis, dass eine Behauptung wahr ist.

**Heutige Nutzung:** ZK-Rollups sind der größte Produktionseinsatz von ZKPs bei der Skalierung von Blockchains. Sie „bundle (or 'roll up') transactions into batches that are executed offchain“ und erzeugen dann einen einzelnen Gültigkeitsbeweis, den Ethereum vor der Finalisierung der Zustandsänderungen des Batches prüft ([ethereum.org](https://ethereum.org/en/developers/docs/scaling/zk-rollups/#:~:text=ZK%2Drollups%20bundle%20)). zkSync Era von Matter Labs ist ein „EVM-compatible ZK Rollup...powered by its own zkEVM“ ([ethereum.org](https://ethereum.org/en/developers/docs/scaling/zk-rollups/)); Starknet von StarkWare ist ein Validity Rollup, das statt der EVM seine eigene Cairo-VM ausführt, wobei Solidity-Verträge separat überbrückt werden. L2BEAT erfasst beide als durch Validity Proofs gesicherte Rollups statt durch das Fraud-Proof-Anfechtungsfenster optimistischer Rollups ([l2beat.com](https://l2beat.com/scaling/summary)). Auf der Datenschutzseite war [Zcash](https://z.cash/technology/) Pionier bei zk-SNARKs (Zero-Knowledge Succinct Non-Interactive Arguments of Knowledge) für abgeschirmte Transaktionen; Adressen der Nutzer, Transaktionsbetrag und weitere Details bleiben verschlüsselt, während das Netzwerk die Gültigkeit der Transaktion weiterhin bestätigt ([z.cash](https://z.cash/technology/)).

**Der Kompromiss:** Das Erzeugen eines ZK-Beweises ist rechenintensiv — Beweisschaltkreise durchlaufen jede Transaktion eines Batches und führen dessen Prüfungen erneut aus. Beweiszeit und Hardwarekosten sind daher reale Grenzen, auch wenn die On-Chain-Prüfung günstig und schnell ist. Das Vertrauen in das System reduziert sich auf die Mathematik und bei einigen Beweissystemen auf eine einmalige Trusted-Setup-Zeremonie.

---

## Vollständig homomorphe Verschlüsselung (FHE)

![Eine verschlossene Box durchläuft eine Rechenmaschine, die von einem Cloud-Server ohne Schlüssel betrieben wird, und kommt weiterhin verschlossen, aber mit einem berechneten Ergebnis heraus; dies veranschaulicht Berechnungen direkt auf verschlüsselten Daten](../../assets/blockchain-privacy-technologies-02-fhe.jpg)

[Vollständig homomorphe Verschlüsselung](/de/glossary/fully-homomorphic-encryption/) verfolgt einen anderen Ansatz: Statt eine Tatsache über verborgene Daten zu beweisen, erlaubt sie, *direkt auf verschlüsselten Daten zu rechnen* und ein verschlüsseltes Ergebnis zu erhalten, das nach Entschlüsselung dieselbe Antwort ergibt wie eine Rechnung auf Klartext. Zama, eines der führenden Forschungs- und Infrastrukturunternehmen für FHE, beschreibt dies so: „FHE enables data processing without decryption—companies provide services without accessing user data, while users experience unchanged functionality“ ([zama.org](https://www.zama.org/introduction-to-homomorphic-encryption)).

**Was verborgen wird:** Rohdaten, Zwischenzustand und Ausgaben einer Berechnung — jeder außer dem Schlüsselinhaber sieht nur Ciphertext, auch die Partei, die die Berechnung durchführt.

**Funktionsweise auf hoher Ebene:** FHE-Schemata kodieren Klartextwerte in auf Gittermathematik aufgebauten Ciphertexts und definieren verschlüsselte Entsprechungen von Addition und Multiplikation, sodass beliebige Schaltkreise auf Ciphertexts ausgeführt werden können. Auf eine Blockchain angewandt bedeutet das, dass ein Smart Contract Tokens bewegen oder Logik auswerten kann, ohne die betreffenden Beträge zu sehen. Wie Zamas Beispiel sagt: „the blockchain verified Alice has sufficient funds without ever seeing the actual amounts“ ([zama.org](https://www.zama.org/introduction-to-homomorphic-encryption#:~:text=The%20blockchain%20verified%20Alice%20has%20sufficient%20funds%20without%20ever%20seeing%20the%20actual%20amounts)). Zama weist außerdem darauf hin, dass gitterbasierte FHE-Schemata „inherently post-quantum resilient“ sind, was für langfristige kryptografische Risiken wichtig ist ([zama.org](https://www.zama.org/introduction-to-homomorphic-encryption)).

**Beispielprojekte:** [Zama](https://www.zama.org/) entwickelt die Open-Source-FHE-Bibliotheken TFHE-rs und Concrete sowie die fhEVM, die vertrauliche Smart-Contract-Ausführung für EVM-Chains ermöglicht. [Fhenix](https://cofhe-docs.fhenix.zone/) ist eine Blockchain, die speziell dafür gebaut wurde, dass „developers build privacy-preserving smart contracts using Fully Homomorphic Encryption“, sodass „sensitive data remains encrypted throughout computation“. Dazu gehören die JavaScript-Bibliothek Cofhejs für clientseitige Verschlüsselung und eine Solidity-FHE-Bibliothek für verschlüsselte On-Chain-Operationen ([cofhe-docs.fhenix.zone](https://cofhe-docs.fhenix.zone/)).

**Der Kompromiss:** FHE bietet die stärkste Datenschutzgarantie in dieser Liste — nichts wird jemals entschlüsselt, auch nicht während der Berechnung —, ist gegenüber Klartextausführung aber zugleich mit Abstand am rechenintensivsten. Deshalb führen FHE-basierte Chains heute vertraulichkeitskritische Logik statt jeder Transaktion aus, und deshalb ist Hardwarebeschleunigung für FHE ein aktives Forschungsrennen.

---

## Sichere Mehrparteienberechnung (MPC)

![Drei Personen halten jeweils einen Schlüsselsplitter in Form eines Puzzleteils; gestrichelte Linien verbinden sie zu einer einzelnen signierten Transaktion und zeigen, wie sichere Mehrparteienberechnung ein gemeinsames Ergebnis erzeugt, ohne dass eine Partei das ganze Geheimnis sieht](../../assets/blockchain-privacy-technologies-03-mpc.jpg)

[Sichere Mehrparteienberechnung](/de/glossary/secure-multiparty-computation/) löst ein verwandtes, aber anderes Problem: Statt dass eine Partei auf verschlüsselten Daten rechnet, berechnen *mehrere* Parteien, die jeweils einen privaten Teil der Eingabe halten, gemeinsam eine Funktion, ohne einander ihre individuellen Eingaben zu offenbaren. Nach der formalen Definition ist MPC „a subfield of cryptography with the goal of creating methods for parties to jointly compute a function over their inputs while keeping those inputs private“; für drei Teilnehmer können „Alice, Bob, and Charlie ... F(x, y, z)“ lernen, ohne offenzulegen, wer was einbringt ([Wikipedia](https://en.wikipedia.org/wiki/Secure_multi-party_computation#:~:text=Secure%20multi%2Dparty%20computation%20)).

**Was verborgen wird:** die individuelle Eingabe jeder Partei vor allen anderen — nur die vereinbarte Ausgabe wird offengelegt, und kein einzelner Teilnehmer sieht jemals das gesamte Geheimnis.

**Vertrauensannahme:** Die Sicherheit hängt davon ab, wie viele Teilnehmer unehrlich sein dürfen, bevor das Schema bricht. Klassische Secret-Sharing-Konstruktionen liefern informationstheoretische Sicherheit, solange weniger als ein Drittel der Parteien aktiv böswillig ist oder weniger als die Hälfte bloß neugierig ist ([Wikipedia](https://en.wikipedia.org/wiki/Secure_multi-party_computation)). Mit anderen Worten ersetzt MPC „einem Verwahrer vertrauen“ durch „darauf vertrauen, dass sich nicht zu viele dieser N Parteien absprechen“.

**Heutige Nutzung — Verwahrung mit Threshold-Signaturen:** Die sichtbarste Blockchain-Anwendung von MPC teilt einen privaten Schlüssel auf unabhängige Parteien auf, sodass kein Gerät und keine Person je den gesamten Schlüssel hält. Der Verwahrungsinfrastrukturanbieter Fireblocks beschreibt es direkt: „Multi-party computation (MPC) is a cryptographic method that splits a private key into separate shares distributed across multiple independent parties“; entscheidend ist, dass „the complete key is never assembled in one place, at any point in time“ ([fireblocks.com](https://www.fireblocks.com/what-is-mpc#:~:text=Multi%2Dparty%20computation%20)). Wenn eine Transaktion signiert werden soll, prüfen Endpunkte eines Quorums jeweils die Transaktion und liefern eine Teilsignatur. Zu keinem Zeitpunkt wird der private Schlüssel zusammengesetzt; selbst wenn ein Endpunkt kompromittiert ist, sind die anderswo gehaltenen Key Shares isoliert nutzlos ([fireblocks.com](https://www.fireblocks.com/what-is-mpc)). Dieses Threshold-Signature-Muster liegt heute dem Großteil der institutionellen Krypto-Verwahrung und vielen Multi-Signer-Wallets zugrunde.

**Der Kompromiss:** MPC vermeidet den einzelnen Ausfallpunkt eines privaten Schlüssels auf einem Gerät, fügt jedoch Kommunikationsrunden zwischen den Parteien und damit Latenz hinzu und verlangt sorgfältiges Protokolldesign. Die Sicherheitsgarantie eines MPC-Schemas ist nur so stark wie die angenommene Schwelle ehrlicher Mehrheiten; das ist eine soziale und operative, nicht nur mathematische Annahme.

---

## Vertrauenswürdige Ausführungsumgebungen (TEEs)

Eine [vertrauenswürdige Ausführungsumgebung](/de/glossary/trusted-execution-environment/) geht einen weiteren Weg: Statt Daten während einer Berechnung durchgehend zu verschlüsseln, isoliert sie die Berechnung in einem hardwaregeschützten Bereich eines Chips — einer *Secure Enclave* —, den selbst das Betriebssystem der Maschine nicht einsehen kann. Intels SGX (Software Guard Extensions), die bekannteste Implementierung, wird auf Wikipedia als „a set of instruction codes implementing trusted execution environment that are built into some Intel central processing units (CPUs)“ beschrieben ([Wikipedia](https://en.wikipedia.org/wiki/Software_Guard_Extensions#:~:text=Intel%20Software%20Guard%20Extensions)). Mechanisch verschlüsselt SGX durch die CPU einen Teil des Speichers, die Enclave; Daten und Code aus ihr werden innerhalb der CPU im laufenden Betrieb entschlüsselt und dadurch vor Inspektion oder Lesen durch anderen Code geschützt, auch durch Code auf höheren Privilegstufen wie Betriebssystem und Hypervisor ([Wikipedia](https://en.wikipedia.org/wiki/Software_Guard_Extensions)).

**Was verborgen wird:** die Daten und der Code innerhalb der Enclave vor jedem anderen Prozess auf derselben Maschine, einschließlich eines kompromittierten Betriebssystems — nützlich, wenn Sie der Ausführung eines bestimmten Codeteils vertrauen müssen, aber nicht dem Serverbetreiber.

**Vertrauensannahme:** Anders als ZKPs, FHE oder MPC, die rein auf Mathematik beruhen, verlangt ein TEE Vertrauen in Hardware und Firmware des Chipherstellers. Dieses Vertrauen wurde geprüft: SGX „does not protect against side-channel attacks“, und Forscher zeigten wiederholt praktische Brüche, von der Extraktion von RSA-Schlüsseln aus SGX-Enclaves auf demselben System innerhalb von fünf Minuten im Jahr 2017 bis zur Foreshadow-Attacke, die speculative execution und buffer overflow kombiniert, um SGX zu umgehen, im Jahr 2018, sowie späteren Schwachstellen wie Plundervolt, LVI, SGAxe und ÆPIC Leak ([Wikipedia](https://en.wikipedia.org/wiki/Software_Guard_Extensions#:~:text=While%20this%20can%20mitigate%20many%20kinds%20of%20attacks%2C%20it%20does%20not%20protect%20against%20side%2Dchannel%20attacks)). Deshalb werden TEEs gewöhnlich als pragmatischer, schneller Mittelweg und nicht als kryptografisch wasserdichte Garantie beschrieben.

**Beispielprojekte:** Das Sapphire-Netzwerk von [Oasis Protocol](https://oasis.net/technology) führt Smart Contracts in Hardware-Enclaves aus, sodass Nutzer „run code inside hardware-secured enclaves“ können, in denen „data stays encrypted even from server operators“, während „every execution produces cryptographic proof that users can verify without blind trust“. So liefert es „confidential smart contracts“ mit „EVM compatibility and composability“ ([oasis.net](https://oasis.net/technology)). Secret Network und mehrere Datenschutzprodukte im Umfeld von Restaking bauen ebenfalls auf TEEs, häufig zusammen mit anderen Techniken für Defense in Depth.

**Der Kompromiss:** TEEs laufen nahezu mit nativer Geschwindigkeit — weit schneller als FHE oder aufwendige ZK-Beweiserzeugung — und sind dadurch für latenzempfindliche Anwendungen attraktiv. Diese Geschwindigkeit kommt jedoch vom Vertrauen in Hardware mit einer realen, dokumentierten Geschichte von Side-Channel-Brüchen. TEE-basierte Systeme haben bei den Vertrauensannahmen im Worst Case daher gewöhnlich schwächere Garantien als rein kryptografische Ansätze.

---

## Ringsignaturen und Stealth-Adressen

Das letzte Technikenpaar schützt ein engeres, aber sehr praktisches Ziel: zu verbergen, *wer* eine Transaktion gesendet und *wer* sie erhalten hat, obwohl die Transaktion selbst On-Chain sichtbar ist. [Monero](https://www.getmonero.org/) ist das führende Produktionsbeispiel für beides.

**Ringsignaturen** verbergen den Sender. Die eigene Dokumentation von Monero erklärt, dass „a ring signature is a type of digital signature that can be performed by any member of a group of users that each have keys“ und dass es rechnerisch nicht praktikabel sein soll festzustellen, welcher Schlüssel der Gruppenmitglieder die Signatur erzeugt hat ([getmonero.org](https://www.getmonero.org/resources/moneropedia/ring-signatures.html#:~:text=a%20ring%20signature%20is%20a%20type%20of%20digital%20signature)). Praktisch mischt eine Monero-Transaktion den Schlüssel des tatsächlichen Ausgebers mit Köder-öffentlichen-Schlüsseln, die mittels einer Gamma-Verteilung aus der Blockchain gezogen werden. In einem Ring möglicher Signierer sind alle Ringmitglieder gleich und gültig; ein externer Beobachter kann nicht feststellen, welcher mögliche Signierer einer Signaturgruppe zu Ihrem Konto gehört ([getmonero.org](https://www.getmonero.org/resources/moneropedia/ring-signatures.html)).

**Stealth-Adressen** verbergen den Empfänger. Statt eine öffentliche Adresse wiederzuverwenden, erzeugt der Sender für jede Transaktion im Namen des Empfängers zufällige Einmaladressen. Eingehende Zahlungen gelangen so auf einzigartige Adressen in der Blockchain und können weder mit der veröffentlichten Adresse des Empfängers noch mit den Adressen anderer Transaktionen verknüpft werden ([getmonero.org](https://www.getmonero.org/resources/moneropedia/stealthaddress.html#:~:text=They%20allow%20and%20require%20the%20sender%20to%20create%20random%20one%2Dtime%20addresses)). Ein Empfänger durchsucht die Chain mit einem privaten View Key nach Zahlungen und bewegt sie mit einem privaten Spend Key; nur Sender und Empfänger können daher bestimmen, wohin eine Zahlung ging ([getmonero.org](https://www.getmonero.org/resources/moneropedia/stealthaddress.html)).

**Was verborgen wird:** Identität des Senders (Ringsignaturen) und Identität des Empfängers (Stealth-Adressen). Transaktions*beträge* werden durch einen separaten Mechanismus, Confidential Transactions / RingCT, verborgen; diese beiden Techniken allein decken ihn nicht ab.

**Der Kompromiss:** Beide Techniken laufen effizient auf gewöhnlicher Hardware, ohne Aufwand für Beweiserzeugung oder Abhängigkeit von Enclaves, und passen daher gut zu einem live betriebenen Zahlungsnetz. Ihr Vertrauensmodell beruht jedoch darauf, dass Ködermengen statistisch nicht vom tatsächlichen Signierer zu unterscheiden sind. Schwache Köderauswahl oder Heuristiken der Blockchain-Analyse haben Anonymitätsmengen in frühen Ringsignatur-Deployments historisch eingeengt. Daher zählen Parameterentscheidungen wie Ringgröße und Köderverteilung ebenso wie das zugrunde liegende Primitiv.

---

## Vergleich der fünf Ansätze

| Technologie | Was sie verbirgt | Vertrauensannahme | Leistungskosten | Reife heute | Beispielprojekte |
|---|---|---|---|---|---|
| Zero-Knowledge-Proofs | Zugrunde liegende Daten/Berechnung; nur die Beweisgültigkeit wird offengelegt | Kryptografische Mathematik (+ Trusted Setup bei manchen Systemen) | Hoher Aufwand zur Beweiserzeugung; günstige Prüfung | Produktion im Maßstab (Rollups, abgeschirmte Zahlungen) | zkSync, Starknet, Zcash |
| Vollständig homomorphe Verschlüsselung | Alle Daten während der Berechnung, auch vor dem Rechenanbieter | Kryptografische Mathematik (gitterbasiert) | Sehr hoher Rechenaufwand | Frühe Produktion; aktive Forschung an Hardwarebeschleunigung | Zama, Fhenix |
| Sichere Mehrparteienberechnung | Individuelle Eingabe jeder Partei | Ehrliche Mehrheit/Schwelle unter den Teilnehmern | Moderat; zusätzliche Kommunikationsrunden | Reif und in der Verwahrung breit eingesetzt | Fireblocks und andere Verwahrer mit Threshold-Signaturen |
| Vertrauenswürdige Ausführungsumgebungen | Daten/Code vor jedem anderen Prozess, einschließlich Betriebssystem | Hardware-/Firmware-Anbieter (Chiphersteller) | Nahezu native Geschwindigkeit | Produktion, aber dokumentierte Geschichte von Side-Channel-Angriffen | Intel SGX, Oasis Sapphire |
| Ringsignaturen und Stealth-Adressen | Identität von Sender und Empfänger | Statistische Ununterscheidbarkeit der Ködermengen | Gering; effizient auf Standardhardware | Reif, seit über einem Jahrzehnt live | Monero |

Keine einzelne Technologie gewinnt auf jeder Achse. Daher kombiniert die aktuelle Forschung sie zunehmend, etwa indem ZK-Proofs die Korrektheit einer MPC-Berechnung prüfen oder TEEs zusammen mit FHE für Defense in Depth genutzt werden.

---

## Verbindung zu tokenisierten Domains

[Tokenisierte Domains](/de/glossary/tokenize/) erben dieselbe Standardtransparenz wie jeder andere On-Chain-Vermögenswert: Eigentumsübertragungen, Gebote und Metadatenaktualisierungen sind öffentlich lesbar. Das ist überwiegend ein Vorteil — Provenienz und Eigentumshistorie machen eine [tokenisierte Domain](/de/blog/what-are-tokenized-domains/) gerade als handelbaren Vermögenswert vertrauenswürdig —, doch es bedeutet auch, dass Bestände und Verkaufspreise eines Domainportfolios für jeden sichtbar sind, der die Chain beobachtet.

Die Datenschutztechnologien dieses Leitfadens zeigen, wohin Infrastruktur für Domains als NFTs künftig gehen könnte: MPC-basierte Threshold-Verwahrung sichert bereits institutionelle [Wallets](/de/glossary/wallet/) mit Domain-NFTs genauso wie andere digitale Vermögenswerte. ZK-Proofs könnten einem Bieter irgendwann ermöglichen nachzuweisen, dass er ein Angebot finanzieren kann, ohne seinen gesamten Kontostand zu offenbaren. Und vertrauliche Berechnungstechniken könnten es einem Registrar oder Marktplatz erlauben, Berechtigungsregeln zu prüfen, ohne die vollständige Identität eines Käufers offenzulegen. Nichts davon ist heute in der Domaintokenisierung eingesetzt, aber die zugrunde liegenden Primitive sind dieselben, die derzeit Milliarden Dollar in DeFi und Verwahrungsinfrastruktur sichern.

---

## Quellen und weiterführende Lektüre

- [Zero-Knowledge Proofs — ethereum.org](https://ethereum.org/en/zero-knowledge-proofs/)
- [ZK-Rollups — ethereum.org](https://ethereum.org/en/developers/docs/scaling/zk-rollups/)
- [L2BEAT Scaling Summary](https://l2beat.com/scaling/summary)
- [Zcash Technology Overview](https://z.cash/technology/)
- [Introduction to Homomorphic Encryption — Zama](https://www.zama.org/introduction-to-homomorphic-encryption)
- [Fhenix cofhe Documentation](https://cofhe-docs.fhenix.zone/)
- [Secure Multi-Party Computation — Wikipedia](https://en.wikipedia.org/wiki/Secure_multi-party_computation)
- [What Is MPC? — Fireblocks](https://www.fireblocks.com/what-is-mpc)
- [Software Guard Extensions (SGX) — Wikipedia](https://en.wikipedia.org/wiki/Software_Guard_Extensions)
- [Oasis Protocol Technology](https://oasis.net/technology)
- [Ring Signatures — Monero Moneropedia](https://www.getmonero.org/resources/moneropedia/ring-signatures.html)
- [Stealth Addresses — Monero Moneropedia](https://www.getmonero.org/resources/moneropedia/stealthaddress.html)
