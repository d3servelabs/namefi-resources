---
title: 'Perfektes vs. rechnerisches Zero-Knowledge: Was die Unterscheidung wirklich bedeutet'
date: '2026-05-13'
language: de
tags: ['cryptography', 'zero-knowledge', 'zk-snark', 'theory']
authors: ['namefiteam']
draft: false
description: 'Zero-Knowledge-Beweise gibt es in drei Varianten – perfekt, statistisch und rechnerisch – und der Unterschied ist wichtiger, als in den meisten technischen Diskussionen zugegeben wird. Dieser Beitrag erklärt jede Variante in einfacher Sprache, warum fast jedes ZK-Produktionssystem im Jahr 2026 rechnerischer Natur ist und welche Vor- und Nachteile dies mit sich bringt.'
ogImage: ../../assets/perfect-vs-computational-zero-knowledge-og.jpg
keywords: ['Zero-Knowledge-Beweis', 'perfektes Zero-Knowledge', 'rechnerisches Zero-Knowledge', 'ZK-SNARK', 'ZK-STARK', 'Kryptographie', 'Simulator', 'Commitment-Verfahren', 'Namefi']
---

Wenn man in der Krypto-Branche von „Zero-Knowledge-Beweisen“ spricht, meint man fast immer eine ganz bestimmte Sache: einen SNARK oder STARK, der beweist, dass eine Berechnung korrekt durchgeführt wurde, ohne die Eingabedaten preiszugeben. Dieses mentale Modell ist für die meisten technischen Diskussionen völlig ausreichend. Es verbirgt jedoch eine Unterscheidung, die in dem Moment wichtig wird, in dem man darüber nachdenkt, *was die Sicherheit eigentlich garantiert*.

Zero-Knowledge-Beweise gibt es in drei formalen Ausprägungen – **perfektes** (perfect), **statistisches** (statistical) und **rechnerisches** (computational) Zero-Knowledge – und sie unterscheiden sich darin, *was der Verifizierer selbst mit unbegrenzten Ressourcen theoretisch noch lernen kann*. Das System, das Sie auf den Markt bringen, ist mit an Sicherheit grenzender Wahrscheinlichkeit rechnerisch. Es lohnt sich zu wissen, warum das so ist und was man dadurch gewinnt.

## Die Form eines Zero-Knowledge-Beweises

Das klassische Setup: Ein *Beweiser* (Prover) möchte einen *Verifizierer* (Verifier) davon überzeugen, dass eine bestimmte Aussage wahr ist, ohne dass der Verifizierer etwas anderes erfährt. „Wahr“ bedeutet hier so etwas wie „Ich kenne ein `x`, sodass `H(x) = y` gilt“ oder „Ich kenne einen Pfad in diesem Graphen“ oder „Ich habe dieses Programm korrekt mit privaten Eingaben ausgeführt.“

Ein Beweissystem ist **Zero-Knowledge**, wenn, vereinfacht gesagt, *der Verifizierer den Beweis auch ohne das Geheimnis selbst hätte erstellen können*. Formal wird dies durch die Existenz eines **Simulators** ausgedrückt: eines Polynomialzeit-Algorithmus, der, wenn er nur die öffentliche Aussage (ohne den Zeugen bzw. das Geheimnis, den *Witness*) erhält, ein Transkript erzeugt, das sich nicht von einem echten Beweistranskript unterscheiden lässt.

Die drei Varianten von Zero-Knowledge unterscheiden sich darin, was „nicht unterscheiden lässt“ konkret bedeutet.

### Perfektes Zero-Knowledge (Perfect Zero-Knowledge)

Die Ausgabe des Simulators ist **identisch verteilt** zu einem echten Beweis. Es gibt keinen statistischen Test, keinen Test, den Sie mit einem Quantencomputer durchführen könnten, und keinen Test, den Sie in 10^100 Jahren durchführen könnten, der den Simulator vom echten Beweiser unterscheiden würde. Mathematisch gesehen sind die beiden Verteilungen *gleich*.

Das ist der Goldstandard. Er besagt: Selbst ein unbegrenzter Angreifer – ohne Zeitlimit, ohne rechnerische Annahmen – lernt absolut nichts aus dem Beweis.

### Statistisches Zero-Knowledge

Die Ausgabe des Simulators ist **statistisch nah** an einem echten Beweis. Die Totalvariationsdistanz zwischen den beiden Verteilungen ist vernachlässigbar gering. Ein unbegrenzter Angreifer könnte prinzipiell etwas lernen, aber die Menge dessen, was er lernen könnte, nimmt exponentiell mit dem Sicherheitsparameter ab.

Für alle praktischen Belange ist statistisches ZK genauso gut wie perfektes ZK. Der Simulator muss die echte Verteilung lediglich nicht exakt treffen; er muss ihr nur so nahe kommen, dass kein noch so großer Rechenaufwand diese Lücke vergrößern kann.

### Rechnerisches Zero-Knowledge (Computational Zero-Knowledge)

Die Ausgabe des Simulators ist **rechnerisch ununterscheidbar** von einem echten Beweis: Kein *Polynomialzeit*-Algorithmus kann die beiden auseinanderhalten. Ein unbegrenzter Angreifer – jemand mit der Fähigkeit, die zugrunde liegende Hash-Funktion mit Brute-Force zu knacken oder das zugrunde liegende schwere mathematische Problem zu lösen – könnte sie jedoch sehr wohl unterscheiden und möglicherweise das Geheimnis (den Witness) erfahren.

Im formalen Sinne ist dies die schwächste der drei Varianten, und es ist diejenige, die fast jedes moderne System in der Praxis bietet.

## Warum fast jedes ZK-Produktionssystem rechnerischer Natur ist

Dahinter verbirgt sich ein wichtiges Theorem: **Für NP-vollständige Sprachen ist die Existenz von perfektem Zero-Knowledge unwahrscheinlich**, es sei denn, die polynomielle Hierarchie kollabiert ([Goldreich und Krawczyk, 1996](https://www.wisdom.weizmann.ac.il/~oded/PSX/zk-poly.pdf)). Mit anderen Worten: Wenn Sie *beliebige* Aussagen per Zero-Knowledge beweisen wollen – Aussagen, die so ausdrucksstark sind wie „Ich habe dieses Programm korrekt ausgeführt“ –, können Sie kein perfektes Zero-Knowledge erreichen, ohne den Beweis selbst von unbewiesenen Komplexitätsannahmen abhängig zu machen.

Was Sie für beliebige NP-Aussagen *haben können*:

- **Rechnerische Zero-Knowledge-Beweise**, die existieren, sofern Einwegfunktionen (One-Way Functions) existieren. ([Goldreich, Micali, Wigderson 1991](https://dl.acm.org/doi/10.1145/116825.116852)).
- **Statistisches Zero-Knowledge für begrenzte Klassen** von Aussagen (zufällig selbstreduzierbare Probleme, Graphenisomorphie), jedoch nicht für allgemeine NP.

Wenn also ein reales System – wie Groth16, PLONK, Halo2, STARK oder Bulletproofs – von sich behauptet, es sei „Zero-Knowledge“, meint es fast immer *rechnerisches* Zero-Knowledge. Der Beweis verrät einem Polynomialzeit-Verifizierer nichts, vorausgesetzt, bestimmte Annahmen über elliptische Kurven, Hash-Funktionen oder andere kryptographische Primitive treffen zu.

Wenn diese Annahmen brechen – etwa, wenn ein zukünftiger Algorithmus das diskrete Logarithmusproblem auf einer Kurve knackt, auf die sich ein Verfahren stützt –, kann das Zero-Knowledge-Argument rückwirkend geschwächt werden. Was genau dann möglich wird, hängt von der Konstruktion ab: Ein Angreifer könnte in der Lage sein, echte Transkripte von simulierten zu unterscheiden, Beweise zu fälschen oder Informationen zu extrahieren, die zuvor geschützt waren. Sie sollten nicht davon ausgehen, dass alte Transkripte mit rechnerischem ZK die gleiche Privatsphäre behalten, nachdem ihre zugrunde liegenden Annahmen nicht mehr gelten.

## Ein praktisches Beispiel: Commitment-Verfahren (Commitment Schemes)

Commitment-Verfahren machen diese Unterscheidung sehr konkret.

Ein Commitment bedeutet grob gesagt: „Ich schließe einen Wert `v` in einen versiegelten Umschlag `c` ein, übergebe Ihnen den Umschlag und enthülle `v` später. Sie können verifizieren, dass ich den ursprünglichen Wert enthüllt habe, aber Sie können keinen Blick auf `v` werfen, bevor ich ihn öffne.“

Es gibt zwei Sicherheitseigenschaften:

- **Hiding (Verbergend)** — der Umschlag verrät nichts über `v`.
- **Binding (Bindend)** — ich kann den Umschlag für keinen anderen Wert öffnen als den, auf den ich mich ursprünglich festgelegt (committed) habe.

Man kann nicht beides perfekt haben. Ein perfekt verbergendes (perfectly hiding) Commitment ist rechnerisch bindend (computational binding) – mit ausreichend Rechenleistung kann ein Angreifer eine zweite Öffnungsmöglichkeit finden. Ein perfekt bindendes (perfectly binding) Commitment ist rechnerisch verbergend (computational hiding) – mit ausreichend Rechenleistung kann ein Angreifer den festgelegten Wert extrahieren.

[Pedersen-Commitments](https://link.springer.com/chapter/10.1007/3-540-46766-1_9) sind perfekt verbergend und rechnerisch bindend – sie verraten selbst einem unbegrenzten Angreifer *nichts* über den festgelegten Wert, aber ein zukünftiger Bruch des diskreten Logarithmus würde es Ihnen ermöglichen, bei der Bindung zu betrügen. Hash-basierte Commitments (`c = H(v || r)`) sind rechnerisch verbergend und (wenn der Hash kollisionsresistent ist) rechnerisch bindend.

Welche Variante Sie wählen, hängt davon ab, welche Eigenschaft sich im Laufe der Zeit abschwächen darf. Für die langfristige Vertraulichkeit einer Abstimmung oder eines Gebots bevorzugt man in der Regel ein perfekt verbergendes Verfahren (perfect hiding), auch wenn die Bindung nur rechnerisch (computational) ist. Denn man kann die Bindungseigenschaft erneut beweisen, bevor die Annahme des diskreten Logarithmus bricht, aber man kann eine einmal geleakte Stimme nicht rückwirkend wieder verbergen.

## Warum das für ZK-Rollups und L2-Systeme wichtig ist

Die meisten ZK-Rollups verwenden SNARKs mit rechnerischem Zero-Knowledge. Die praktischen Auswirkungen:

- **Heute** verraten die Beweise einem realistischen Angreifer absolut nichts. Die Datenschutzgarantie ist stark.
- **Langfristig** offenbaren die Beweise alles, was von der zugrunde liegenden Annahme geschützt wurde. Wenn ein Rollup einen SNARK verwendet, dessen Sicherheit auf dem diskreten Logarithmus der BN254-Kurve beruht, und BN254 im Jahr 2050 geknackt wird, könnte potenziell jeder davor veröffentlichte Beweis entschlüsselt werden.
- **Post-Quanten-Überlegungen** spielen eine Rolle: SNARKs auf Basis diskreter Logarithmen (Groth16, PLONK über Standard-Pairing-Kurven) sind *nicht* Post-Quanten-sicher. STARKs, die sich nur auf die Kollisionsresistenz von Hashes verlassen, sind es hingegen schon. ([StarkWare](https://eprint.iacr.org/2018/046.pdf), das Papier, das das STARK-Akronym etablierte.)
- **Statistisches oder perfektes ZK** ist in eingeschränkten Umgebungen möglich (z. B. beim Beweisen bestimmter algebraischer Relationen) und wird manchmal verwendet, wenn das langfristige Privatsphäre-Budget wichtiger ist als die Ausdrucksstärke des Beweises.

Für Anwendungen wie anonymes Abstimmen, Whistleblower-Kanäle und andere Systeme, bei denen Transkripte möglicherweise über Jahrzehnte archiviert werden, ist die Wahl zwischen rechnerischem und statistischem ZK keine Haarspalterei. Es ist der Unterschied zwischen einer Privatsphäre, die dem Angreifer von morgen standhält, und einer Privatsphäre, die jedem beliebigen Angreifer standhält.

## Ein einfacher Entscheidungsbaum

Wenn Sie ein ZK-System für den produktiven Einsatz auswählen:

- **Nur Verifizierer-Privatsphäre, kurzlebige Daten, Leistung ist am wichtigsten:** Rechnerisches ZK aus einem praxiserprobten SNARK oder STARK ist völlig in Ordnung. Das betrifft die meisten Rollups, die meisten ZK-KYC- und ZK-Login-Verfahren.
- **Langfristige Privatsphäre, auditive/rechtliche Sensibilität:** Bevorzugen Sie ein Hash-basiertes System (STARK) oder ein zugrunde liegendes Commitment im Pedersen-Stil. Dokumentieren Sie die dabei getroffenen Annahmen.
- **Nachweisbare Privatsphäre unabhängig von rechnerischen Annahmen:** Sie suchen nach perfektem oder statistischem ZK für eine eingeschränkte Aussageklasse. Stellen Sie sich darauf ein, Abstriche bei der Ausdrucksstärke oder Interaktivität zu machen.

Es gibt nichts umsonst (There is no free lunch). Die verschiedenen ZK-Varianten stellen immer einen Kompromiss untereinander und gegenüber der Effizienz dar. Die Frage ist lediglich, *welchen Kompromiss Sie ganz bewusst eingehen*.

## Wie Namefi darüber denkt

Bei Prozessen rund um den Domain-Besitz ist die interessanteste Anwendung von ZK der Beweis, dass man einen Namen besitzt, ohne preiszugeben, *welchen* Namen. Eigentumsnachweise gegenüber einer On-Chain-Registry können mit sehr ausgereiften Tools (Groth16, PLONK) als rechnerisches ZK umgesetzt werden, und genau darauf laufen heutige Produktionssysteme. Für sensiblere Abläufe – etwa den Beweis, dass eine Domain zu einer *Gruppe* vertrauenswürdiger Entitäten gehört, ohne zu verraten, zu welcher – könnten statistische oder perfekte ZK-Verfahren auf eingeschränkten Aussagen relevant werden. Das Ziel dieses Beitrags ist es, diese Kompromisse greifbar zu machen: Wählen Sie aus, was Sie wirklich brauchen, und notieren Sie sich die Annahmen, die Sie damit in Kauf nehmen.

## Quellen und weiterführende Literatur

- Goldreich, Micali, Wigderson — [Proofs that yield nothing but their validity (J. ACM 1991)](https://dl.acm.org/doi/10.1145/116825.116852).
- Goldreich und Krawczyk — [On the composition of zero-knowledge proof systems (1996)](https://www.wisdom.weizmann.ac.il/~oded/PSX/zk-poly.pdf).
- Pedersen — [Non-interactive and information-theoretic secure verifiable secret sharing (1991)](https://link.springer.com/chapter/10.1007/3-540-46766-1_9).
- Ben-Sasson, Bentov, Horesh, Riabzev — [Scalable, transparent, and post-quantum secure computational integrity (STARK-Papier, 2018)](https://eprint.iacr.org/2018/046.pdf).
- a16z crypto — [Justin Thaler's "Proofs, Arguments, and Zero-Knowledge"](https://people.cs.georgetown.edu/jthaler/ProofsArgsAndZK.html), das kanonische moderne Lehrbuch.