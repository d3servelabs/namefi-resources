---
title: 'Perfektes vs. rechnerisches Zero-Knowledge: Was der Unterschied wirklich bedeutet'
date: '2026-05-13'
language: de
tags: ['cryptography', 'zero-knowledge', 'zk-snark', 'theory']
authors: ['namefiteam']
draft: false
description: 'Zero-Knowledge-Beweise gibt es in drei Varianten – perfekt, statistisch und rechnerisch – und der Unterschied ist wichtiger, als die meisten technischen Diskussionen zugeben. Dieser Beitrag erklärt jede Variante in einfacher Sprache, warum fast jedes produktive ZK-System im Jahr 2026 rechnerisch ist und was das bringt und kostet.'
ogImage: ../../assets/perfect-vs-computational-zero-knowledge-og.jpg
keywords: ['Zero-Knowledge-Beweis', 'perfektes Zero-Knowledge', 'rechnerisches Zero-Knowledge', 'zk snark', 'zk stark', 'Kryptographie', 'Simulator', 'Commitment-Verfahren', 'namefi']
---

Wenn man im Krypto-Bereich von "Zero-Knowledge-Beweisen" (Nullwissen-Beweisen) spricht, meint man fast immer eine ganz bestimmte Sache: einen SNARK oder STARK, der beweist, dass eine Berechnung korrekt durchgeführt wurde, ohne die Eingabedaten preiszugeben. Dieses mentale Modell reicht für die meisten technischen Unterhaltungen völlig aus. Es verbirgt jedoch eine Unterscheidung, die in dem Moment wichtig wird, in dem man versucht nachzuvollziehen, *was die Sicherheit eigentlich garantiert*.

Zero-Knowledge-Beweise gibt es formal in drei Varianten – **perfektes**, **statistisches** und **rechnerisches** (computational) Zero-Knowledge – und sie unterscheiden sich darin, *was der Verifizierer selbst mit unbegrenzten Ressourcen theoretisch noch lernen kann*. Das System, das Sie veröffentlichen, ist mit an Sicherheit grenzender Wahrscheinlichkeit rechnerisch. Es lohnt sich zu wissen, warum das so ist und welche Vorteile das bietet.

## Die Struktur eines Zero-Knowledge-Beweises

Das klassische Setup: Ein *Beweiser* (Prover) möchte einen *Verifizierer* (Verifier) davon überzeugen, dass eine bestimmte Aussage wahr ist, ohne dass der Verifizierer etwas anderes erfährt. "Wahr" bedeutet hier so etwas wie "Ich kenne ein `x`, sodass `H(x) = y` gilt" oder "Ich kenne einen Pfad in diesem Graphen" oder "Ich habe dieses Programm korrekt mit privaten Eingaben ausgeführt".

Ein Beweissystem ist **Zero-Knowledge**, wenn – um es vereinfacht auszudrücken – *der Verifizierer den Beweis auch ohne das Geheimnis selbst hätte erstellen können*. Formal wird dies durch die Existenz eines **Simulators** beschrieben: ein in Polynomialzeit laufender Algorithmus, der nur anhand der öffentlichen Aussage (ohne den Zeugen/Witness) ein Transkript erzeugt, das sich von einem echten Beweistranskript nicht unterscheiden lässt.

Die drei Varianten von Zero-Knowledge unterscheiden sich darin, was "nicht unterscheiden lässt" genau bedeutet.

### Perfektes Zero-Knowledge

Die Ausgabe des Simulators ist **identisch verteilt** zu einem echten Beweis. Es gibt keinen statistischen Test, keinen Test, den man mit einem Quantencomputer durchführen könnte, und keinen Test, den man in 10^100 Jahren ausführen könnte, der den Simulator vom echten Beweiser unterscheiden kann. Mathematisch gesehen sind die beiden Verteilungen *gleich*.

Das ist der Goldstandard. Es bedeutet: Selbst ein unbegrenzter Angreifer – ohne Zeitlimit, ohne rechnerische Annahmen – erfährt aus dem Beweis absolut nichts.

### Statistisches Zero-Knowledge

Die Ausgabe des Simulators ist einem echten Beweis **statistisch nahe**. Die totale Variationsdistanz (total variation distance) zwischen den beiden Verteilungen ist vernachlässigbar. Ein unbegrenzter Angreifer könnte im Prinzip etwas lernen, aber die Menge an Informationen, die er lernen könnte, nimmt exponentiell mit dem Sicherheitsparameter ab.

Für alle praktischen Zwecke ist statistisches ZK genauso gut wie perfektes ZK. Der Simulator muss lediglich nicht die exakte echte Verteilung treffen; er muss ihr nur so nahe kommen, dass keine noch so große Rechenleistung diese Lücke vergrößern kann.

### Rechnerisches Zero-Knowledge

Die Ausgabe des Simulators ist von einem echten Beweis **rechnerisch ununterscheidbar**: Kein *Polynomialzeitalgorithmus* kann sie auseinanderhalten. Ein unbegrenzter Angreifer – jemand mit der Fähigkeit, die zugrunde liegende Hash-Funktion durch Brute-Force zu knacken oder das zugrunde liegende schwierige mathematische Problem zu lösen – könnte sehr wohl in der Lage sein, sie zu unterscheiden und den Zeugen (Witness) herauszufinden.

Dies ist im formalen Sinne die schwächste der drei Varianten, und es ist diejenige, die fast jedes moderne System in der Praxis tatsächlich bietet.

## Warum fast jedes produktive ZK-System rechnerisch ist

Dahinter verbirgt sich ein Theorem: **Für NP-vollständige Sprachen existiert sehr wahrscheinlich kein perfektes Zero-Knowledge**, es sei denn, die polynomielle Hierarchie kollabiert ([Goldreich und Krawczyk, 1996](https://www.wisdom.weizmann.ac.il/~oded/PSX/zk-poly.pdf)). Mit anderen Worten: Wenn Sie *beliebige* Aussagen per Zero-Knowledge beweisen wollen – Aussagen, die so aussagekräftig sind wie "Ich habe dieses Programm korrekt ausgeführt" –, können Sie kein perfektes Zero-Knowledge haben, ohne dass der Beweis selbst von unbewiesenen Komplexitätsannahmen abhängt.

Was Sie für beliebige NP-Aussagen haben *können*:

- **Rechnerische Zero-Knowledge-Beweise**, die existieren, sofern Einwegfunktionen existieren. ([Goldreich, Micali, Wigderson 1991](https://dl.acm.org/doi/10.1145/116825.116852).)
- **Statistisches Zero-Knowledge für begrenzte Klassen** von Aussagen (zufällig selbstreduzierbare Probleme, Graphen-Isomorphie), jedoch nicht für allgemeine NP-Probleme.

Wenn also ein reales System – Groth16, PLONK, Halo2, STARK, Bulletproofs – von sich sagt, es sei "Zero-Knowledge", meint es damit fast immer *rechnerisches* Zero-Knowledge. Der Beweis verrät einem in Polynomialzeit arbeitenden Verifizierer nichts, unter der Voraussetzung, dass bestimmte Annahmen über elliptische Kurven, Hash-Funktionen oder andere kryptographische Primitive zutreffen.

Sollten sich diese Annahmen als falsch erweisen – beispielsweise wenn ein zukünftiger Algorithmus das Diskrete-Logarithmus-Problem auf einer Kurve bricht, auf der das Schema basiert –, kann das Zero-Knowledge-Argument rückwirkend geschwächt werden. Was dann genau möglich wird, hängt von der Konstruktion ab: Ein Angreifer könnte in der Lage sein, echte Transkripte von simulierten zu unterscheiden, Beweise zu fälschen oder Informationen zu extrahieren, die zuvor geschützt waren. Sie sollten nicht davon ausgehen, dass alte rechnerische ZK-Transkripte das gleiche Maß an Privatsphäre beibehalten, nachdem ihre zugrunde liegenden Annahmen nicht mehr gelten.

## Ein Praxisbeispiel: Commitment-Verfahren

Commitment-Verfahren (Festlegungsverfahren) machen diese Unterscheidung greifbar.

Ein Commitment bedeutet grob gesagt: "Ich schließe einen Wert `v` in einen versiegelten Umschlag `c` ein, übergebe dir den Umschlag und enthülle `v` später. Du kannst überprüfen, ob ich den ursprünglichen Wert enthüllt habe, aber du kannst dir `v` nicht ansehen, bevor ich es preisgebe."

Dabei gibt es zwei Sicherheitseigenschaften:

- **Hiding (Verbergend)** — der Umschlag verrät nichts über `v`.
- **Binding (Bindend)** — ich kann den Umschlag nicht für einen anderen Wert öffnen als den, auf den ich mich ursprünglich festgelegt habe.

Man kann nicht beides perfekt haben. Ein perfekt verbergendes Commitment ist rechnerisch bindend (mit ausreichend Rechenleistung kann ein Angreifer eine zweite Öffnungsmöglichkeit finden). Ein perfekt bindendes Commitment ist rechnerisch verbergend (mit ausreichend Rechenleistung kann ein Angreifer den eingeschlossenen Wert extrahieren).

[Pedersen-Commitments](https://link.springer.com/chapter/10.1007/3-540-46766-1_9) sind perfekt verbergend und rechnerisch bindend – sie verraten selbst einem unbegrenzten Angreifer *nichts* über den festgelegten Wert. Doch wenn der diskrete Logarithmus in Zukunft geknackt wird, könnte man bei der Bindung betrügen. Hash-basierte Commitments (`c = H(v || r)`) sind rechnerisch verbergend und (wenn der Hash kollisionsresistent ist) rechnerisch bindend.

Welche Variante man wählt, hängt davon ab, welche Eigenschaft sich im Laufe der Zeit abschwächen darf. Für die langfristige Geheimhaltung einer Abstimmung oder eines Gebots möchte man in der Regel die Eigenschaft "perfekt verbergend" haben, selbst wenn die Bindung nur rechnerisch ist. Denn man kann die Bindung erneut beweisen, bevor die Annahme des diskreten Logarithmus fällt, aber man kann eine einmal geleakte Stimme nicht rückwirkend wieder unsichtbar machen.

## Warum das für ZK-Rollups und L2-Systeme wichtig ist

Die meisten ZK-Rollups verwenden SNARKs mit rechnerischem Zero-Knowledge. Die praktischen Auswirkungen sind:

- **Heute** verraten die Beweise einem realistischen Angreifer absolut nichts. Die Datenschutzgarantie ist stark.
- **Langfristig** verraten die Beweise genau das, was die zugrunde liegende Annahme schützt. Wenn ein Rollup einen SNARK verwendet, dessen Sicherheit auf dem diskreten Logarithmus von BN254 beruht, und BN254 im Jahr 2050 geknackt wird, könnte jeder bis dahin veröffentlichte Beweis potenziell de-anonymisiert werden.
- **Post-Quanten-Überlegungen** sind wichtig: Auf diskreten Logarithmen basierende SNARKs (Groth16, PLONK über Standard-Pairing-Kurven) sind *nicht* Post-Quanten-sicher. STARKs hingegen, die nur auf Hash-Kollisionsresistenz beruhen, schon. ([StarkWare](https://eprint.iacr.org/2018/046.pdf), das Paper, das das STARK-Akronym etablierte.)
- **Statistisches oder perfektes ZK** ist in eingeschränkten Umgebungen (z. B. beim Beweis bestimmter algebraischer Relationen) möglich und wird manchmal eingesetzt, wenn das langfristige Datenschutzbudget wichtiger ist als die Ausdrucksstärke (Expressiveness).

Für Anwendungen wie anonyme Wahlen, Whistleblower-Kanäle und andere Systeme, bei denen Transkripte jahrzehntelang archiviert werden könnten, ist die Wahl zwischen rechnerischem und statistischem ZK nicht nur pedantisch. Es ist der Unterschied zwischen einem Datenschutz, der gegen den Angreifer von morgen standhält, und einem, der jedem beliebigen Angreifer standhält.

## Ein einfacher Entscheidungsbaum

Wenn Sie ein ZK-System für den Produktiveinsatz auswählen:

- **Nur der Verifizierer darf nichts erfahren, kurzlebige Daten, Leistung ist am wichtigsten:** Rechnerisches ZK von einem praxiserprobten SNARK oder STARK ist völlig ausreichend. Das betrifft die meisten Rollups, die meisten ZK-KYC- und ZK-Login-Verfahren.
- **Langfristiger Datenschutz, sensible Audits oder rechtliche Belange:** Bevorzugen Sie ein Hash-basiertes System (STARK) oder ein Pedersen-ähnliches Commitment als Grundlage. Dokumentieren Sie die Annahme.
- **Beweisbarer Datenschutz unabhängig von rechnerischen Annahmen:** Sie suchen nach perfektem oder statistischem ZK für eine eingeschränkte Aussageklasse. Stellen Sie sich darauf ein, Abstriche bei der Ausdrucksstärke oder Interaktivität machen zu müssen.

Es gibt nichts umsonst. Die ZK-Varianten müssen gegeneinander und gegen die Effizienz abgewogen werden. Die Frage ist, *welchen Kompromiss Sie bewusst eingehen*.

## Wie Namefi darüber denkt

Bei Prozessen rund um den Domain-Besitz besteht der interessanteste Einsatz von ZK darin, zu beweisen, dass man einen Namen besitzt, ohne preiszugeben, *welchen* Namen. Besitznachweise gegenüber einer On-Chain-Registry können mit sehr ausgereiften Tools (Groth16, PLONK) als rechnerisches ZK umgesetzt werden, und darauf basieren heutige Produktivsysteme. Für sensiblere Abläufe – beispielsweise um zu beweisen, dass eine Domain zu einer *Gruppe* vertrauenswürdiger Entitäten gehört, ohne zu verraten, zu welcher genau – könnten statistische oder perfekte ZK-Verfahren für eingeschränkte Aussagen relevant werden. Der Zweck dieses Beitrags ist es, diesen Kompromiss verständlich zu machen: Wählen Sie, was Sie wirklich brauchen, und notieren Sie sich die Annahmen, die Sie damit in Kauf nehmen.

## Quellen und weiterführende Literatur

- Goldreich, Micali, Wigderson — [Proofs that yield nothing but their validity (J. ACM 1991)](https://dl.acm.org/doi/10.1145/116825.116852).
- Goldreich and Krawczyk — [On the composition of zero-knowledge proof systems (1996)](https://www.wisdom.weizmann.ac.il/~oded/PSX/zk-poly.pdf).
- Pedersen — [Non-interactive and information-theoretic secure verifiable secret sharing (1991)](https://link.springer.com/chapter/10.1007/3-540-46766-1_9).
- Ben-Sasson, Bentov, Horesh, Riabzev — [Scalable, transparent, and post-quantum secure computational integrity (STARK-Paper, 2018)](https://eprint.iacr.org/2018/046.pdf).
- a16z crypto — [Justin Thaler's "Proofs, Arguments, and Zero-Knowledge"](https://people.cs.georgetown.edu/jthaler/ProofsArgsAndZK.html), das kanonische moderne Lehrbuch.