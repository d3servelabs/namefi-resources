---
title: "Die wichtigsten kryptografischen Primitive hinter jeder Blockchain"
date: '2026-07-02'
language: de
tags: ['guide']
authors: ['aileen-wright']
editors: ['victor-zhou']
draft: false
cluster: web3-foundations
series: blockchain-concepts
seriesOrder: 10
format: roundup
description: "Ein Leitfaden zu den zentralen kryptografischen Primitiven, die Blockchains ermöglichen: Hashfunktionen, digitale Signaturen, Merkle-Bäume, Elliptische-Kurven-Kryptografie und Commitment-Schemata."
ogImage: ../../assets/blockchain-cryptographic-primitives-og.jpg
keywords: ['blockchain-kryptografie', 'kryptografische primitive', 'hashfunktion', 'SHA-256', 'Keccak-256', 'digitale signatur', 'ECDSA', 'EdDSA', 'BLS-signatur', 'merkle-baum', 'elliptische-kurven-kryptografie', 'secp256k1', 'commitment-schema', 'post-quanten-kryptografie', 'public-key-kryptografie', 'blockchain-sicherheit']
relatedArticles:
  - /de/blog/blockchain-privacy-technologies/
  - /de/blog/blockchain-consensus-mechanisms/
  - /de/blog/blockchain-virtual-machines/
  - /de/blog/blockchain-scaling-approaches/
  - /de/blog/perfect-vs-computational-zero-knowledge/
relatedGlossary:
  - /de/glossary/hash-function/
  - /de/glossary/digital-signature/
  - /de/glossary/merkle-tree/
  - /de/glossary/public-key/
  - /de/glossary/private-key/
relatedTopics:
  - /de/topics/web3-foundations/
  - /de/topics/domain-tokenization/
relatedSeries:
  - /de/series/tokenize-your-com/
  - /de/series/domain-flipping-skills/
---

Jede Aussage einer Blockchain — „Diese Transaktion ist endgültig“, „Diese Adresse besitzt diesen Vermögenswert“, „Dieser Verlauf wurde nicht verändert“ — lässt sich letztlich auf eine Handvoll kryptografischer Primitive zurückführen, die enge, klar definierte Aufgaben erfüllen. Keine von ihnen ist eine Erfindung der Blockchain. Hashfunktionen, digitale Signaturen und Merkle-Bäume gab es schon Jahrzehnte vor Bitcoin. Blockchains kombinierten sie zu einem System, in dem für keine dieser Aussagen einer einzelnen Partei vertraut werden muss.

Dieser Leitfaden behandelt die Primitive, die tatsächlich die Last tragen: [Hashfunktionen](/de/glossary/hash-function/), die Daten mit einem Fingerabdruck versehen, [digitale Signaturen](/de/glossary/digital-signature/), die Transaktionen autorisieren, [Merkle-Bäume](/de/glossary/merkle-tree/), die riesige Datensätze stückweise überprüfbar machen, die Mathematik elliptischer Kurven, auf der diese Signaturen beruhen, sowie Commitment-Schemata — die Grundlage, die zu [Zero-Knowledge-Proofs](/de/glossary/zero-knowledge-proof/) führt. Jede einzelne zu verstehen, ist der schnellste Weg zu verstehen, was eine Blockchain unter der Haube wirklich tut.

---

## Kryptografische Hashfunktionen (SHA-256, Keccak)

![Ein Dokument wird in eine Hashfunktionsmaschine eingespeist und erzeugt einen Fingerabdruck fester Länge; die Änderung eines einzigen Buchstabens in der Eingabe erzeugt eine völlig andere Prüfsumme und veranschaulicht den Avalanche-Effekt](../../assets/blockchain-cryptographic-primitives-01-hash-function.jpg)

Eine [Hashfunktion](/de/glossary/hash-function/) nimmt eine Eingabe beliebiger Größe und erzeugt deterministisch eine Ausgabe fester Größe — einen „Digest“. Das Ändern eines einzigen Bits der Eingabe verändert die Ausgabe vollständig, und zwei verschiedene Eingaben zu finden, die denselben Hashwert ergeben, ist rechnerisch nicht praktikabel. Diese Eigenschaft, die Kollisionsresistenz, macht einen Hash als kompakten, manipulationssichtbaren Fingerabdruck für beliebig große Daten nutzbar.

Bitcoin verwendet SHA-256 überall: Block-Header werden verkettet, indem der Hash SHA256(SHA256()) des vorherigen Headers in jeden neuen eingebettet wird. Eine Änderung an einem vergangenen Block verändert damit seinen Hash und bricht jeden folgenden Header ([Bitcoin Developer Guide](https://developer.bitcoin.org/devguide/block_chain.html#:~:text=Each%20block%20also%20stores%20the%20hash%20of%20the%20previous%20block%27s%20header%2C%20chaining%20the%20blocks%20together)). Dieselbe Double-SHA-256-Konstruktion hasht Transaktionen in den [Merkle-Baum](/de/glossary/merkle-tree/) des Blocks ([Bitcoin.org-Referenz](https://developer.bitcoin.org/reference/block_chain.html#:~:text=A%20SHA256%28SHA256%28%29%29%20hash%20in%20internal%20byte%20order)).

Ethereum standardisiert stattdessen Keccak-256 als Hashfunktion für allgemeine Zwecke — die ursprüngliche Keccak-Einreichung und nicht den späteren NIST-Standard SHA-3. Jede Kontoadresse wird aus den letzten 20 Byte des Keccak-256-Hashs des [öffentlichen Schlüssels](/de/glossary/public-key/) des Kontos abgeleitet ([ethereum.org](https://ethereum.org/en/developers/docs/accounts/#:~:text=You%20get%20a%20public%20address%20for%20your%20account%20by%20taking%20the%20last%2020%20bytes%20of%20the%20Keccak-256%20hash%20of%20the%20public%20key)). Dieselbe Funktion liegt der Schlüssel/Wert-Content-Adressierung im [Merkle Patricia Trie](https://ethereum.org/en/developers/docs/data-structures-and-encoding/patricia-merkle-trie/#:~:text=key%20%3D%3D%20keccak256%28rlp%28value%29%29) zugrunde, der den Zustand von Ethereum speichert.

Hashing verknüpft Block-Header außerdem zu einer Kette statt zu einer losen Sammlung von Datensätzen: Eine Änderung an einem Header verändert seinen Hash und macht die Verweise in nachfolgenden Headern ungültig. Die zusätzliche Anforderung, spätere Arbeit neu zu leisten und das ehrliche Netzwerk einzuholen, gilt speziell für Bitcoins Proof-of-Work-Konsens. Ein Angreifer, der einen vergangenen Block ändert, muss den Proof of Work dieses Blocks und die gesamte nachfolgende Arbeit erneut erbringen und anschließend die ehrliche Chain einholen ([Bitcoin-Whitepaper, Abschnitt 4](https://bitcoin.org/bitcoin.pdf)). Andere Blockchains authentisieren und finalisieren ihren Verlauf nach anderen Konsensregeln; die Hash-Verkettung allein erzeugt diese Proof-of-Work-Kosten nicht. Die verknüpften Header-Hashes sind der wörtliche Grund, warum diese Datenstruktur **Blockchain** heißt.

---

## Public-Key-Kryptografie und digitale Signaturen (ECDSA, EdDSA, BLS)

![Ein privater Schlüssel signiert eine Transaktion und erzeugt eine digitale Signatur; der passende öffentliche Schlüssel bestätigt sie mit einem grünen Häkchen als gültig, während ein nicht passender öffentlicher Schlüssel sie mit einem roten X zurückweist](../../assets/blockchain-cryptographic-primitives-02-signatures.jpg)

Eine Blockchain hat kein Anmeldeformular und braucht daher einen anderen Weg, um zu beweisen: „Diese Transaktion stammt wirklich vom Eigentümer dieses Kontos.“ [Public-Key-Kryptografie](/de/glossary/public-key/) löst dies mit einem Schlüsselpaar: einem geheim gehaltenen [privaten Schlüssel](/de/glossary/private-key/) und einem frei teilbaren öffentlichen Schlüssel. Das Signieren einer Transaktion mit dem privaten Schlüssel erzeugt eine [digitale Signatur](/de/glossary/digital-signature/), die jeder gegen den öffentlichen Schlüssel prüfen kann. Damit wird die Autorisierung nachgewiesen, ohne den privaten Schlüssel selbst offenzulegen.

Ethereum-Konten leiten ihren öffentlichen Schlüssel aus dem privaten Schlüssel ab, indem sie den Elliptic Curve Digital Signature Algorithm, ECDSA, über der Kurve secp256k1 verwenden — derselben Kurve wie Bitcoin ([ethereum.org-Dokumentation zu Konten](https://ethereum.org/en/developers/docs/accounts/#:~:text=The%20public%20key%20is%20generated%20from%20the%20private%20key%20using%20the%20Elliptic%20Curve%20Digital%20Signature%20Algorithm); [EIP-2, Korrektur der Formbarkeit von secp256k1-Signaturen](https://eips.ethereum.org/EIPS/eip-2#:~:text=secp256k1n%2F2)). ECDSA ist schnell zu verifizieren und wurde jahrzehntelang geprüft, hat aber eine für neuere Entwürfe relevante operative Schwäche: Einzelne ECDSA-Signaturen lassen sich nicht effizient aggregieren. Tausende zu prüfen bedeutet daher Tausende getrennte Prüfungen.

Genau diese Lücke schließen EdDSA- und BLS-Signaturen. EdDSA, verwendet von Chains wie Solana und Stellar, nutzt eine andere Kurvenkonstruktion, die deterministisch ist und bestimmten Implementierungsfallen widersteht, welche historisch ECDSA-Fehler durch Wiederverwendung von Nonces verursachten. BLS-Signaturen gehen weiter: Aufgrund der mathematischen Pairing-Eigenschaft ihrer Kurven lassen sich viele BLS-Signaturen zu einer einzigen aggregierten Signatur verbinden, die sie alle zugleich prüft. Die Proof-of-Stake-Konsensschicht von Ethereum beruht genau darauf. Validatoren signieren Attestierungen mit BLS-Schlüsseln, sodass die Beacon Chain Stimmen von Hunderttausenden Validatoren in Signaturen aggregieren kann, die kompakt genug für eine schnelle Verifizierung sind. Das macht Proof of Stake in großem Maßstab überhaupt erst praktikabel ([ethereum.org, *The Beacon Chain*](https://eth2book.info/capella/part2/building_blocks/signatures/#:~:text=BLS%20signatures%20can%20be%20aggregated%20together%2C%20making%20them%20efficient%20to%20verify%20at%20large%20scale)). Ethereum stellt BLS12-381-Kurvenoperationen außerdem als EVM-Precompiles bereit, um insbesondere die Verifizierung von BLS-Signaturen in Smart Contracts zu unterstützen ([EIP-2537](https://eips.ethereum.org/EIPS/eip-2537#:~:text=Add%20functionality%20to%20efficiently%20perform%20operations%20over%20the%20BLS12-381%20curve%2C%20including%20those%20for%20BLS%20signature%20verification)).

---

## Merkle-Bäume

![Eine Pyramide von Hashknoten eines Merkle-Baums wird paarweise zu einer einzigen Wurzel zusammengeführt; ein orange hervorgehobener Beweispfad von einem Blatt zur Wurzel zeigt einen Merkle-Beweis eines Light Clients](../../assets/blockchain-cryptographic-primitives-03-merkle-tree.jpg)

Ein [Merkle-Baum](/de/glossary/merkle-tree/) ermöglicht es einer Blockchain, Tausende Transaktionen in einem einzigen 32-Byte-Hash zusammenzufassen, ohne jeden Teilnehmer zum Speichern jeder Transaktion zu zwingen. Blätter sind Hashwerte einzelner Datenelemente (Transaktionen, Kontozustände); jedes Hashpaar wird verkettet und erneut gehasht, bis ein Hash — die Wurzel — übrig bleibt ([Bitcoin Developer Guide](https://developer.bitcoin.org/devguide/block_chain.html#:~:text=Copies%20of%20each%20transaction%20are%20hashed%2C%20and%20the%20hashes%20are%20then%20paired%2C%20hashed%2C%20paired%20again%2C%20and%20hashed%20again%20until%20a%20single%20hash%20remains%2C%20the%20merkle%20root%20of%20a%20merkle%20tree)). Diese Wurzel wird direkt im Block-Header gespeichert. So kann ein Full Node sich mit fast keinem zusätzlichen Speicherplatz auf den gesamten Inhalt eines Blocks festlegen.

Der Gewinn liegt in der Größe des Beweises. Um zu zeigen, dass eine Transaktion in einem Block enthalten ist, benötigt man nicht den gesamten Block, sondern nur die Transaktion plus einen „Merkle-Zweig“, also die Geschwister-Hashes entlang des Pfads von diesem Blatt zur Wurzel, typischerweise in der Größenordnung von log₂(n) Hashes bei n Transaktionen. Darauf basiert Simplified Payment Verification (SPV): Ein schlanker Client, der nur Block-Header besitzt, kann weiterhin prüfen, ob eine konkrete Transaktion stattgefunden hat, indem er ihren Merkle-Zweig gegen die Wurzel des Headers prüft, ohne die gesamte Blockchain herunterzuladen ([Bitcoin Developer Guide](https://developer.bitcoin.org/devguide/operating_modes.html#:~:text=the%20merkle%20root%20in%20the%20block%20header%20along%20with%20a%20merkle%20branch%20can%20prove%20to%20the%20SPV%20client%20that%20the%20transaction%20in%20question%20is%20embedded%20in%20a%20block%20in%20the%20block%20chain)).

Ethereum erweitert die Idee mit dem Merkle Patricia Trie, einem Hybrid aus Merkle-Baum und Präfix- oder Radix-Trie, der den gesamten Kontozustand statt nur einer Transaktionsliste speichert. Jeder Block-Header enthält drei getrennte Trie-Wurzeln — `stateRoot`, `transactionsRoot` und `receiptsRoot` —, die jeweils unabhängig nachweisbar sind ([ethereum.org](https://ethereum.org/en/developers/docs/data-structures-and-encoding/patricia-merkle-trie/#:~:text=From%20a%20block%20header%20there%20are%203%20roots%20from%203%20of%20these%20tries)). Dies erlaubt einem Smart Contract oder einem Light Client, einen einzelnen Kontostand oder Storage-Slot zu überprüfen, ohne die gesamte Chain erneut auszuführen.

---

## Elliptische-Kurven-Kryptografie

Die Elliptische-Kurven-Kryptografie (ECC) ist die mathematische Grundlage von ECDSA, EdDSA und BLS. Statt sich auf die Schwierigkeit der Faktorisierung großer Zahlen zu stützen, wie klassisches RSA, beruht ECC auf der Schwierigkeit des diskreten Logarithmusproblems auf elliptischen Kurven: Ist ein Punkt auf der Kurve gegeben, der durch vielfaches Addieren eines Basispunkts zu sich selbst erreicht wurde, ist es rechnerisch nicht praktikabel zu bestimmen, wie oft addiert wurde. Den Punkt selbst vorwärts zu berechnen ist dagegen einfach. Diese Asymmetrie — in eine Richtung leicht, rückwärts schwer — macht einen privaten Schlüssel für Signaturen sicher nutzbar, während der daraus abgeleitete öffentliche Schlüssel sicher veröffentlicht werden kann.

Die konkrete Kurve und das Signaturverfahren sind entscheidend. Bitcoin und Ethereum verwenden beide secp256k1, eine Koblitz-Kurve, die von der Standards for Efficient Cryptography Group mit gut untersuchten 256-Bit-Parametern standardisiert wurde ([SEC 2: Recommended Elliptic Curve Domain Parameters](https://www.secg.org/sec2-v2.pdf)). Andere Ökosysteme treffen andere Abwägungen: Ed25519 ist ein konkretes EdDSA-Signaturverfahren auf der Edwards25519-Kurve ([RFC 8032, Abschnitt 5.1](https://www.rfc-editor.org/rfc/rfc8032.html#section-5.1)); RFC 8032 ordnet es einem klassischen Sicherheitsniveau von etwa 128 Bit zu ([Abschnitt 8.5](https://www.rfc-editor.org/rfc/rfc8032.html#section-8.5)). BLS12-381 ist eine pairingfreundliche Kurve, die für Operationen wie die Aggregation von BLS-Signaturen gewählt wurde; EIP-2537 beschreibt ein Sicherheitsniveau von mehr als 120 Bit ([EIP-2537](https://eips.ethereum.org/EIPS/eip-2537#motivation)). Diese Schätzungen behaupten nicht, die Systeme böten dieselbe „Sicherheit pro Schlüsselbit“: Sie verwenden unterschiedliche Gruppen, Kodierungen und Annahmen, und die nominelle Schlüssellänge ist nicht selbst die Sicherheitsstärke. NIST ordnet beispielsweise 128 Bit klassischer Sicherheit gewöhnlichen ECC-Schlüsseln mit 256–383 Bit, aber RSA-Schlüsseln mit 3.072 Bit zu ([NIST SP 800-57 Part 1 Rev. 5, Tabelle 2](https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-57pt1r5.pdf#page=67)). Das trägt dazu bei zu erklären, warum Systeme mit elliptischen Kurven zum Standard für Blockchain-Konten wurden.

---

## Commitment-Schemata (eine Brücke zu Zero Knowledge)

Ein Commitment-Schema ermöglicht es, einen Wert „festzulegen“: Sie veröffentlichen etwas, das Sie an ein konkretes Datenelement bindet, ohne das Datenelement selbst offenzulegen, und können das Commitment später „öffnen“, um zu beweisen, was es war. Die Alltagsanalogie ist ein versiegelter Umschlag. Sie können heute jemandem einen verschlossenen Umschlag geben als Beweis, dass Sie bereits eine Antwort entschieden haben, ohne dass diese Person sie sieht, bis Sie sich später zum Öffnen entschließen. Nach dem Versiegeln können Sie die darin enthaltene Antwort nicht mehr austauschen.

Das klingt wie ein kleines Primitiv, ist jedoch das tragende Bauteil unter den meisten Zero-Knowledge-Proof-Systemen. Das blobbasierte Data-Availability-Design von Ethereum verwendet beispielsweise polynomiale KZG-Commitments, um jeden Blob auf ein kleines kryptografisches Commitment zu reduzieren. Ein KZG-Beweis kann eine Auswertung oder eine als Stichprobe ausgewählte Zelle gegenüber diesem Commitment authentisieren, beweist aber nicht für sich allein, dass der vollständige Blob verfügbar ist. Die Verfügbarkeit entsteht durch die Verteilungs- und Stichprobenregeln der Konsensschicht, während KZG die Integrität der empfangenen Daten prüft ([EIP-4844](https://eips.ethereum.org/EIPS/eip-4844#consensus-layer-validation); [EIP-7594, PeerDAS](https://eips.ethereum.org/EIPS/eip-7594#networking)). Durch diese Trennung kann ein Verifier einen kleinen Teil eines Blobs prüfen, ohne einen kompakten Auswertungsbeweis mit dem Nachweis zu verwechseln, dass sämtliche Blob-Daten veröffentlicht wurden. Eine Merkle-Wurzel ist selbst ein einfaches Commitment-Schema: Sie bindet einen gesamten Datensatz über ihren Root-Hash, und ein Merkle-Zweig ist die „Öffnung“, die ein einzelnes Element enthüllt. ZK-Rollups bauen auf fortgeschritteneren Commitment-Schemata (polynomialen und Vektor-Commitments) auf, um die Ausführung eines ganzen Transaktionsbatches in einen günstig On-Chain prüfbaren Beweis zu komprimieren. Dieses Thema behandelt [Perfektes vs. computationelles Zero Knowledge](/de/blog/perfect-vs-computational-zero-knowledge/) ausführlich.

---

## Vergleich: kryptografische Primitive der Blockchain

| Primitiv | Bereitgestellte Eigenschaft | On-Chain-Einsatz | Klassisches vs. Post-Quanten-Risiko |
|---|---|---|---|
| Hashfunktionen (SHA-256, Keccak-256) | Kollisionsresistenter Fingerabdruck; verkettet Blöcke | Block-Hashing, Adressableitung, Merkle-Wurzeln | Bei heutigen Ausgabegrößen klassisch stark; hashbasierte Schemata gelten im Allgemeinen als widerstandsfähiger gegen Quantenangriffe als heutige Signaturen elliptischer Kurven |
| Digitale Signaturen — ECDSA | Transaktionsautorisierung über ein privates/öffentliches Schlüsselpaar | Bitcoin- und Ethereum-Kontosignaturen | Klassisch sicher; ein ausreichend leistungsfähiger Quantencomputer großen Maßstabs soll auf elliptischen Kurven beruhende Schemata brechen können, weshalb das NIST Post-Quanten-Alternativen standardisiert hat ([NIST, 2024](https://www.nist.gov/news-events/news/2024/08/nist-releases-first-3-finalized-post-quantum-encryption-standards#:~:text=A%20sufficiently%20capable%20quantum%20computer%2C%20though%2C%20would%20be%20able%20to%20sift%20through%20a%20vast%20number%20of%20potential%20solutions%20to%20these%20problems%20very%20quickly%2C%20thereby%20defeating%20current%20encryption)) |
| Digitale Signaturen — EdDSA / BLS | Deterministisches Signieren (EdDSA); effiziente Signaturaggregation (BLS) | Signieren in Solana/Stellar (EdDSA); Attestierungen von Ethereum-Validatoren (BLS) | Dieselbe zugrunde liegende Annahme elliptischer Kurven wie bei ECDSA — dieselbe langfristige Quantenexponierung |
| Merkle-Bäume | Kompaktes Commitment für einen großen Datensatz; kleine Inklusionsbeweise | Block-Header, Prüfung durch Light Clients (SPV), Tries für Zustand/Transaktionen/Receipts von Ethereum | Hängt allein von der Kollisionsresistenz der zugrunde liegenden Hashfunktion ab und übernimmt damit deren Quantenprofil, ohne eine neue Exponierung hinzuzufügen |
| Elliptische-Kurven-Kryptografie | Mathematische Basis kompakter Schlüssel und Signaturen | secp256k1 (Bitcoin, Ethereum), Ed25519, BLS12-381 | In gleicher Weise wie ECDSA/EdDSA/BLS durch einen künftigen Quantencomputer großen Maßstabs gefährdet; dies ist der wichtigste Treiber der Forschung zur Post-Quanten-Migration |
| Commitment-Schemata | Jetzt an einen Wert binden, ihn später enthüllen/nachweisen, ohne ihn vorab offenzulegen | KZG-Commitments für die Data Availability von Ethereum; Merkle-Wurzeln als einfache Commitments; Baustein für ZK-Rollups | Die Sicherheit hängt von der Hash- oder Elliptische-Kurven-Annahme ab, die zum Aufbau des Schemas verwendet wird |

---

## Verbindung zu tokenisierten Domains

Jedes dieser Primitive kommt direkt zum Einsatz, wenn Sie eine Domain [tokenisieren](/de/glossary/tokenize/). Das [NFT](/de/glossary/nft/), das Eigentum repräsentiert, wird durch die Autorisierungsregeln der Chain für Konten und Token geschützt. Wird es von einem extern geführten Konto (EOA) gehalten, autorisiert der private Schlüssel dieses Kontos dessen Aktionen; ein Vertragskonto besitzt dagegen keinen privaten Schlüssel und wird von seinem Code gesteuert ([ethereum.org, *Ethereum-Konten*](https://ethereum.org/en/developers/docs/accounts/#account-types)). Bei einem ERC-721-Token kann außerdem eine genehmigte Adresse oder ein Operator eine Übertragung einleiten ([ERC-721](https://eips.ethereum.org/EIPS/eip-721#specification)). Deshalb sind [Hardware-Wallets](/de/glossary/hardware-wallet/) und die sorgfältige Verwahrung einer [Seed Phrase](/de/glossary/seed-phrase/) wichtig, wenn Sie Eigentum über ein selbst kontrolliertes EOA halten, während Smart-Contract- und Custodial-Wallets andere Autorisierungs- und Vertrauensgrenzen mit sich bringen. Der Eigentumsdatensatz der Domain lebt in demselben durch Merkle-Commitments abgesicherten Zustand, der jeden anderen Kontostand und [Smart Contract](/de/glossary/smart-contract/) auf der Chain sichert. Genau das verleiht einer tokenisierten Domain dieselbe Manipulationssichtbarkeit wie jedem anderen On-Chain-Vermögenswert: Sie ist übertragbar, überprüfbar und ihr Eigentum ist nachweisbar, ohne dass die Datenbank eines Registrars die einzige Quelle der Wahrheit ist.

Das Verständnis dieser Primitive macht auch klar, was Tokenisierung verändert und was nicht: DNS-Eintrag und Registry-Status der Domain folgen weiterhin den ICANN-Regeln, aber ihr Eigentumsnachweis beruht nun auf der oben beschriebenen Kryptografie statt auf einem durch Login geschützten [Registrar](/de/glossary/registrar/)-Konto. Das größere Bild finden Sie in [Blockchain-Konsensmechanismen](/de/blog/blockchain-consensus-mechanisms/) und [Ansätze zur Skalierung von Blockchains](/de/blog/blockchain-scaling-approaches/), oder beginnen Sie die Tokenisierung bei [namefi.io](https://namefi.io).

---

## Quellen und weiterführende Lektüre

- Bitcoin Developer Guide — [Block Chain](https://developer.bitcoin.org/devguide/block_chain.html), Verkettung über SHA256(SHA256()) des vorherigen Headers
- Bitcoin — [Bitcoin: A Peer-to-Peer Electronic Cash System](https://bitcoin.org/bitcoin.pdf), Umschreiben der Proof-of-Work-Historie und kumulierte Arbeit
- Bitcoin Developer Reference — [Block Chain](https://developer.bitcoin.org/reference/block_chain.html), Aufbau der Merkle-Wurzel
- Bitcoin Developer Guide — [Operating Modes](https://developer.bitcoin.org/devguide/operating_modes.html), SPV und Merkle-Zweige
- ethereum.org — [Ethereum Accounts](https://ethereum.org/en/developers/docs/accounts/), ECDSA und Ableitung von Keccak-256-Adressen; Steuerung von EOAs und Vertragskonten
- ethereum.org — [Merkle Patricia Trie](https://ethereum.org/en/developers/docs/data-structures-and-encoding/patricia-merkle-trie/), Wurzeln für Zustand/Transaktionen/Receipts
- ethereum.org — [Danksharding](https://ethereum.org/en/roadmap/danksharding/), polynomiale KZG-Commitments
- EIP-4844 — [Shard Blob Transactions](https://eips.ethereum.org/EIPS/eip-4844), Blob-Commitments, Beweise und Verfügbarkeit auf der Konsensschicht
- EIP-7594 — [PeerDAS](https://eips.ethereum.org/EIPS/eip-7594), Zellenbeweise und Data-Availability-Sampling
- ERC-721 — [Non-Fungible Token Standard](https://eips.ethereum.org/EIPS/eip-721), Token-Eigentum, Genehmigungen und Operatoren
- EIP-2 — [Homestead Hard-fork Changes](https://eips.ethereum.org/EIPS/eip-2), Einschränkungen für secp256k1-Signaturen
- EIP-2537 — [Precompile for BLS12-381 curve operations](https://eips.ethereum.org/EIPS/eip-2537)
- RFC 8032 — [Edwards-Curve Digital Signature Algorithm (EdDSA)](https://www.rfc-editor.org/rfc/rfc8032.html), Verfahren, Kurve und Sicherheitsniveau von Ed25519
- SEC 2: Recommended Elliptic Curve Domain Parameters — [secg.org](https://www.secg.org/sec2-v2.pdf)
- NIST SP 800-57 Part 1 Rev. 5 — [Recommendation for Key Management](https://csrc.nist.gov/pubs/sp/800/57/pt1/r5/final), vergleichbare Sicherheitsstärken von ECC und RSA
- *The Eth2 Book* — [Signatures and BLS aggregation](https://eth2book.info/capella/part2/building_blocks/signatures/)
- NIST — [NIST Releases First 3 Finalized Post-Quantum Encryption Standards](https://www.nist.gov/news-events/news/2024/08/nist-releases-first-3-finalized-post-quantum-encryption-standards)
