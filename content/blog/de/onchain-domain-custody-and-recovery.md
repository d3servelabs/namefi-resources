---
title: "Onchain-Domain-Verwahrung, Wallets und Wiederherstellung"
date: '2026-06-24'
language: de
tags: ['domains', 'domain-flipping', 'web3', 'explainer']
authors: ['aileen-wright']
editors: ['victor-zhou']
draft: false
cluster: domain-security
series: domain-flipping-skills
seriesOrder: 38
format: explainer
description: "Wie Verwahrung bei Onchain-Domains wirklich funktioniert: Wallets, Multisig, Seed-Phrase-Risiko und das Wiederherstellen einer tokenisierten Domain nach Wallet-Verlust."
ogImage: ../../assets/onchain-domain-custody-and-recovery-og.jpg
keywords: ['Onchain-Domain-Verwahrung', 'Wallet für tokenisierte Domains', 'tokenisierte Domain wiederherstellen', 'Domain-Wiederherstellung nach Wallet-Verlust', 'Seed-Phrase-Risiko', 'Multisig-Domain-Verwahrung', 'Sicherheit von NFT-Domains', 'Hardware-Wallet für Domains', 'Selbstverwahrung von Domains', 'privater Schlüssel einer Domain', 'Eigentum an tokenisierten Domains', 'ERC-721-Domain', 'Onchain-Domain-Flipping', 'Wallet-Backup für Domains', 'Social-Recovery-Wallet']
relatedArticles:
  - /de/blog/recovering-a-tokenized-domain-after-wallet-loss/
  - /de/blog/how-tokenization-changes-domain-flipping/
  - /de/blog/onchain-domain-flipping/
  - /de/blog/selling-domains-as-nfts/
  - /de/blog/tokenize-your-com-to-flip-it/
relatedTopics:
  - /de/topics/domain-security/
  - /de/topics/domain-tokenization/
relatedSeries:
  - /de/series/domain-flipping-skills/
  - /de/series/domain-apocalypse/
relatedGlossary:
  - /de/glossary/registrar/
  - /de/glossary/icann/
  - /de/glossary/dns/
  - /de/glossary/tld/
  - /de/glossary/web3/
---

Wenn Sie eine klassische Domain flippen, ist die Verwahrung das Problem von jemand anderem. Der Name liegt in einem [Registrar](/de/glossary/registrar/)-Konto, und wenn Sie das Passwort vergessen, warten ein Reset-Link und eine Support-Warteschlange auf Sie. Verlagern Sie eine Domain [On-Chain](/de/glossary/on-chain/), verschwindet dieses Sicherheitsnetz. Der Token *ist* die Urkunde, und die Schlüssel zu Ihrer [Wallet](/de/glossary/wallet/) sind das Einzige, was zwischen Ihnen und dem Vermögenswert steht. Dieser Wandel ist die größte mentale Umstellung für jeden, der aus dem klassischen [Aftermarket](/de/glossary/domain-trading/) ins Onchain-Flipping kommt.

Dieser Beitrag ist das Verwahrungs-Kapitel der [Domain-Flipping](/de/blog/domain-flipping/)-Serie. Er behandelt, was Verwahrung für einen tokenisierten Namen tatsächlich bedeutet, die realen Wege, auf denen Menschen den Zugang verlieren, die Wallet-Setups, die das verhindern, und — ganz ehrlich — wie Wiederherstellung aussieht, wenn Prävention versagt. Wenn Sie mit Onchain-Namen handeln, behandeln Sie das hier als betriebliche Hygiene, nicht als Hintergrundlektüre.

## Was „Verwahrung" bedeutet, sobald eine Domain ein Token ist

Eine [tokenisierte Domain](/de/blog/what-are-tokenized-domains/) ist ein echter, von [ICANN](/de/glossary/icann/) anerkannter Name, dessen Eigentum *zusätzlich* als Token auf einer [Blockchain](/de/glossary/blockchain/) abgebildet wird — üblicherweise als [NFT](/de/glossary/nft/) nach dem [ERC-721](/de/glossary/erc-721/)-Standard, den die Spezifikation selbst als [eine standardisierte Schnittstelle für nicht-fungible Token, auch bekannt als Urkunden](https://eips.ethereum.org/EIPS/eip-721#:~:text=A%20standard%20interface%20for%20non%2Dfungible%20tokens%2C%20also%20known%20as%20deeds) beschreibt. Diese Rahmung als „Urkunden" ist kein Marketing. Wer den Token in seiner Wallet hält, hält den Namen.

Das ist es wert, präzise zu sein, denn drei Dinge, die alle als „Web3-Domains" bezeichnet werden, haben sehr unterschiedliche Verwahrungs- und Auflösungsprofile, und sie zu vermengen führt zu schlechten Entscheidungen:

- **Tokenisierte ICANN-Domains** (das Namefi-Modell) — eine echte `.com`, `.xyz` oder `.io`, die in jedem Browser auflöst, mit einem Onchain-Token, der das Eigentum auf Registry-Ebene spiegelt. Verwahrung ist die Wallet; Auflösbarkeit ist normales [DNS](/de/blog/dns-on-tokenized-domains/).
- **[ENS](/de/glossary/ens/)-Namen** (`vitalik.eth`) — Ethereum-native Namen, die vollständig On-Chain leben und ohne Resolver oder Bridge nicht in einem Standard-Browser auflösen.
- **Namen im Unstoppable-Stil** (`.crypto`, `.x`) — Blockchain-native Namensräume außerhalb der ICANN-Root, die ebenfalls eine Auflösung auf Wallet- oder Erweiterungsebene benötigen.

Bei allen dreien reimt sich die *Verwahrungs*-Geschichte: Ein [privater Schlüssel](/de/glossary/private-key/) kontrolliert den Vermögenswert. Aber nur der tokenisierte-ICANN-Fall hat zusätzlich einen Off-Chain-Registry-Eintrag, und diese zweite Ebene ist das, was manche Wiederherstellungswege überhaupt erst möglich macht. Wir dröseln das in [tokenisierte Domain vs. Web3-Domain](/de/blog/tokenized-domain-vs-web3-domain/) auf; fürs Flippen ist es der Unterschied zwischen einem Namen, den Sie an jeden beliebigen Käufer verkaufen können, und einem, den nur ein krypto-nativer Käufer übernehmen kann.

## Das Verwahrungs-Spektrum: von verwahrt bis vollständig selbstverwahrt

![Redaktionelle Illustration eines horizontalen Verwahrungs-Spektrums: links eine Bank, die eine Domain-Token-Münze hält, in der Mitte eine Übergabe von Hand zu Hand und rechts eine offene Hand mit einem Schlüssel plus der Token-Münze, mit einem Schieberegler-Punkt entlang des Balkens](../../assets/onchain-domain-custody-and-recovery-01-custody-spectrum.jpg)

Verwahrung ist ein Spektrum, kein Schalter. An einem Ende steht [**verwahrte Eigentümerschaft**](/de/glossary/custodial-ownership/) — eine Plattform oder Börse hält die Schlüssel, und Sie halten ein Konto-Login. Bequem, durch ein Support-Team wiederherstellbar — und genau das Vertrauensmodell, das Krypto eigentlich vermeiden wollte. Am anderen Ende steht vollständige Selbstverwahrung: Die Schlüssel gehören Ihnen allein, niemand kann den Vermögenswert einfrieren oder beschlagnahmen — und niemand kann Sie auch herauspauken.

Die meisten ernsthaften Onchain-Flipper landen in der Mitte und — entscheidend — *passen das Verwahrungsmodell an den Wert und die Handelsfrequenz des Namens an*. Ein Wegwerf-Name, den Sie aktiv auf einem [Marktplatz](/de/glossary/marketplace/) listen, kann in einer Hot Wallet liegen, mit der Sie täglich signieren. Ein fünfstelliger Name, den Sie halten wollen, hat nirgendwo anders etwas zu suchen als in Cold Storage oder einem [Multisig](/de/glossary/multi-sig/). Der Fehler ist, beide gleich zu behandeln — meist, indem man alles in dem einen MetaMask aufbewahrt, mit dem man auch beliebige NFTs mintet.

## Wo die Schlüssel tatsächlich liegen

Eine [Kryptowährungs-Wallet](https://en.wikipedia.org/wiki/Cryptocurrency_wallet) „speichert" Ihre Domain nicht. Sie speichert Schlüssel. Wie es Wikipedia formuliert: [Der private Schlüssel wird vom Eigentümer verwendet, um auf Kryptowährung zuzugreifen und sie zu versenden, und ist privat für den Eigentümer](https://en.wikipedia.org/wiki/Cryptocurrency_wallet#:~:text=The%20private%20key%20is%20used%20by%20the%20owner%20to%20access%20and%20send%20cryptocurrency%20and%20is%20private%20to%20the%20owner) — und derselbe Schlüssel autorisiert das Übertragen einer Domain-NFT. Die praktische Taxonomie für einen Domain-Händler:

- **Hot Wallets** (MetaMask, Rabby) — mit dem Internet verbundene Software-Wallets. Gut zum Signieren und für aktive Listings, aber Malware, Phishing und bösartigen Signaturanfragen ausgesetzt. Das ist Ihre Handels-Wallet, nicht Ihr Tresor.
- **[Hardware-Wallets](/de/glossary/hardware-wallet/)** (Ledger, Trezor, Keystone, GridPlus) — die Schlüssel leben auf einem dedizierten Gerät, das offline signiert. Das richtige Zuhause für jeden Namen, den Sie halten statt diese Woche zu flippen. Verschieben Sie die NFT nach dem [Prägen](/de/glossary/minting/) hierher.
- **[Smart-Contract](/de/glossary/smart-contract/)-Wallets** (Multisig, Social Recovery) — die Schlüssel werden durch Onchain-Logik statt durch ein einzelnes Geheimnis verwaltet. Mehr dazu weiter unten.

Unter nahezu allen liegt eine **[Seed-Phrase](/de/glossary/seed-phrase/)** — die 12 oder 24 Wörter, die die [BIP-39-Spezifikation](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki#:~:text=This%20BIP%20describes%20the%20implementation%20of%20a%20mnemonic%20code%20or%20mnemonic%20sentence%20%2D%2D%20a%20group%20of%20easy%20to%20remember%20words%20%2D%2D%20for%20the%20generation%20of%20deterministic%20wallets) als mnemonischen Code zur Erzeugung einer deterministischen Wallet definiert. Diese Phrase regeneriert jeden Schlüssel, den die Wallet hält. Laut Wikipedia kann [die Seed-Phrase, falls die Wallet verlegt, beschädigt oder kompromittiert wird, verwendet werden, um erneut auf die Wallet und die zugehörigen Schlüssel und Kryptowährung zuzugreifen](https://en.wikipedia.org/wiki/Cryptocurrency_wallet#:~:text=the%20seed%20phrase%20can%20be%20used%20to%20re%2Daccess%20the%20wallet%20and%20associated%20keys). Genau deshalb ist sie auch die gefährlichste Wortfolge, die Sie jemals aufschreiben werden.

## Das Seed-Phrase-Risiko ist das ganze Spiel

![Redaktionelle Illustration einer papiernen Wiederherstellungsphrase-Karte mit leeren Wort-Feldern unter einer gesprungenen Glaskuppel, während ein Phishing-Haken, eine Flamme und ein maskierter Dieb alle auf die eine zerbrechliche Karte zulaufen](../../assets/onchain-domain-custody-and-recovery-02-seed-phrase-risk.jpg)

Fast jeder katastrophale Onchain-Verlust lässt sich auf einen von zwei Seed-Phrase-Fehlern zurückführen, und sie ziehen in entgegengesetzte Richtungen:

1. **Der Seed wurde an nur einem Ort gespeichert, und dieser Ort ist weg.** Ein Handy-Reset, ein Brand, ein verlorenes Notizbuch. Es gibt keinen Reset-Link. Wenn die einzige Kopie der Wörter weg ist, ist der Name weg.
2. **Der Seed wurde dort gespeichert, wo jemand anderes ihn lesen konnte.** Eine Cloud-Notiz, ein Passwort-Manager, der in die Cloud synchronisiert, ein Foto in Ihrer Kamerarolle, ein Screenshot in einem Chat, in ein LLM eingefügt. Wer auch immer diese Wörter liest, besitzt alles, was die Wallet kontrolliert — sofort und unwiderruflich.

Die defensive Haltung ist langweilig und nicht verhandelbar. Schreiben Sie die Wörter auf Papier, zweimal, an zwei physischen Orten; für alles Wertvolle verwenden Sie eine Stahl-Backup-Platte, die Feuer und Wasser übersteht; lassen Sie eine echte Seed-Phrase niemals eine mit dem Internet verbundene Oberfläche berühren. Es ist dieselbe Disziplin, die erfahrene Flipper auf Verlängerungen anwenden: billige Versicherung, bezahlt bevor man sie braucht, gegen einen Verlust, der total ist, wenn er eintritt.

## Multisig und Social Recovery: den Single Point of Failure beseitigen

![Redaktionelle Illustration einer Domain-Token-Münze, bewacht von einem zentralen Schloss, das zwei von drei gemeinsam gedrehten Schlüsseln benötigt, mit drei Schlüsselinhaber-Figuren darum herum und einem gestrichelten Guardian-Wiederherstellungskreis, der sie verbindet](../../assets/onchain-domain-custody-and-recovery-03-multisig-recovery.jpg)

Eine einzelne Seed-Phrase ist ein Single Point of Failure. Die strukturelle Lösung besteht darin, *mehr als einen* Schlüssel zum Bewegen des Vermögenswerts zu verlangen.

Eine [**Multisig-Wallet**](/de/glossary/multi-sig/) — am häufigsten ein [Safe](https://safe.global/) (früher Gnosis Safe) auf EVM-Chains — benötigt M von N Schlüsseln zum Signieren, bevor eine Übertragung ausgeführt wird. Ein 2-von-3-Setup, verteilt auf eine Hardware-Wallet, einen Mitunterzeichner und ein versiegeltes Offline-Backup, bedeutet, dass der Verlust eines einzelnen Schlüssels nicht den Verlust der Domain bedeutet und eine einzelne erphishte Signatur sie nicht leerräumt. Dieselbe Idee existiert in der Kryptografie selbst: Schwellenwert-Signaturschemata wie FROST, standardisiert in [RFC 9591](https://www.rfc-editor.org/rfc/rfc9591#:~:text=FROST%20signatures%20can%20be%20issued%20after%20a%20threshold%20number%20of%20entities%20cooperate%20to%20compute%20a%20signature), lassen eine [Schwellenwert-Anzahl von Entitäten zusammenarbeiten, um eine Signatur zu berechnen](https://www.rfc-editor.org/rfc/rfc9591#:~:text=FROST%20signatures%20can%20be%20issued%20after%20a%20threshold%20number%20of%20entities%20cooperate%20to%20compute%20a%20signature), ohne dass irgendeine Partei jemals den ganzen Schlüssel hält.

Aber Multisig ist kein Zauberwort, und es als solches zu behandeln ist der Weg, auf dem die großen Verluste passieren. Es schlägt die Kompromittierung eines einzelnen Schlüssels und Insider-Risiken; es tut *nichts* gegen eine kompromittierte Signatur-Oberfläche oder eine koordinierte Phishing-Aktion, die mehrere Unterzeichner am selben schlechten Tag täuscht. Wenn alle drei Ihrer „unabhängigen" Schlüssel auf Geräten leben, die Sie allein in derselben Wohnung kontrollieren, haben Sie den Mehraufwand eines Multisig mit dem Bedrohungsmodell eines einzelnen Schlüssels. Wir gehen genau durch, wo der Schutz hält und wo er Theater ist, in [Verbessern Multisig-Wallets wirklich die Sicherheit?](/de/blog/do-multisig-wallets-actually-improve-security/) — Pflichtlektüre, bevor Sie einem solchen einen wertvollen Namen anvertrauen.

Für Solo-Flipper, die keine Mitunterzeichner koordinieren wollen, lassen **Social-Recovery-Wallets** (Argent, Safe mit einem Recovery-Modul, ERC-4337-Smart-Accounts) Sie Guardians benennen, die gemeinsam den Zugang wiederherstellen können, falls Sie Ihren Schlüssel verlieren. Freundlicher als ein Multisig, zum Preis, mehr Smart-Contract-Code und einem Guardian-Set zu vertrauen, das tatsächlich existieren und reagieren muss.

Eine praktische Regel für ein Handels-Portfolio: Halten Sie eine kleine Hot Wallet für Namen, die Sie aktiv listen, und eine Multisig- oder hardwaregestützte Cold Wallet für Inventar, das Sie halten. Machen Sie nicht jeden schnellen Verkauf von drei Unterzeichnern abhängig, und lassen Sie nicht Ihren besten Namen in der Wallet, die Sie mit jedem zwielichtigen Mint verbinden.

## Wiederherstellung: was tatsächlich passiert, wenn der Zugang verloren geht

Prävention ist die eigentliche Wiederherstellungsstrategie, aber Verluste passieren, und was möglich ist, hängt vollständig davon ab, *wie* Sie den Zugang verloren haben. Die Kurzfassung:

- **Passwort verloren, aber Seed vorhanden** — eigentlich kein Verlust. Neu installieren, aus dem Seed wiederherstellen, fertig.
- **Gerät verloren, aber Seed vorhanden** — neues Gerät, aus dem Seed wiederherstellen, fertig.
- **Gerät vorhanden, aber Seed verloren** — verschieben Sie die NFT *jetzt sofort* in eine frische, ordentlich gesicherte Wallet, solange das Gerät noch funktioniert.
- **Sowohl Gerät als auch Seed verloren** — der harte Fall. Kryptografisch ist der Token unzugänglich, und niemand kann einen privaten Schlüssel per Brute Force knacken. Jeder, der behauptet, das zu können, betreibt einen Betrug.

Dieser letzte Fall ist der Punkt, an dem sich das tokenisierte-ICANN-Modell von einem rein-Onchain-Namen unterscheidet. Weil der zugrunde liegende Vermögenswert eine echte registrierte Domain ist, gibt es einen Off-Chain-Faden, an dem man ziehen kann: plattformseitige Identität, die an Ihren [Registranten](/de/glossary/registrant/)-Eintrag gebunden ist, und Eigentums-Einsprüche auf Registrar-Ebene, gestützt auf [WHOIS](/de/glossary/whois/)-Historie, Abrechnungsunterlagen und behördlichen Ausweis. Diese Wege sind langsam, bürokratie-lastig, identitätsgebunden und niemals garantiert — aber sie existieren, was mehr ist, als ein verlorener `.eth`-Schlüssel von sich sagen kann. **Diebstahl** ist ein anderes Problem als Verlust: Verfolgen Sie die Onchain-Bewegung als Beweismittel, benachrichtigen Sie die Plattform und die Marktplätze, um den gestohlenen Token zu markieren, und schalten Sie die Strafverfolgungsbehörden ein, denn eine gestohlene tokenisierte Domain ist auch ein gestohlener registrierter Vermögenswert.

Das vollständige Drehbuch — jedes Verlust-Szenario, die Reihenfolge des Vorgehens und was eine Plattform wirklich kann und nicht kann — finden Sie in [Wiederherstellung einer tokenisierten Domain nach Wallet-Verlust](/de/blog/recovering-a-tokenized-domain-after-wallet-loss/). Die Zusammenfassung in einem Satz: Handeln Sie schnell, sichern Sie Beweise und gehen Sie niemals davon aus, dass die Tür bei einem echten ICANN-Namen für immer verschlossen ist.

## Verwahrung hält die Verlängerungsuhr nicht an

Eine Falle, in die Flipper tappen, die neu bei Onchain-Namen sind: Die Schlüssel perfekt abzusichern, tut nichts für die *Registrierung*. Eine tokenisierte Domain ist immer noch eine echte Domain mit einem Verlängerungszeitplan, und der Token spiegelt diesen Zustand wider — er überschreibt ihn nicht. Lassen Sie die Registrierung verfallen, und selbst ein makellos selbstverwahrter Name kann Ihnen unter den Händen ablaufen.

Die onchain-nativen Namensräume funktionieren genauso. Ein ENS-`.eth`-Name zum Beispiel wird jährlich gemietet: Laut ENS [kostet Sie ein `.eth` mit 5 oder mehr Buchstaben 5 USD pro Jahr](https://docs.ens.domains/registry/eth/#:~:text=letter%20%60.eth%60%20will%20cost%20you%20%605%20USD%60%20per%20year), und nach Ablauf erhalten Sie eine [90-tägige Schonfrist — Sie können ihn weiterhin zum Standardpreis verlängern. Niemand sonst kann ihn registrieren](https://support.ens.domains/en/articles/8046905-what-is-a-grace-period#:~:text=After%20a%20.eth%20name%20expires%20you%20have%20a%2090%2Dday%20Grace%20Period). Tokenisierte ICANN-Domains tragen die Standard-Verlängerungs-Schonfristen der Registry ihrer TLD. So oder so sind Verwahrung und Verlängerung getrennte Disziplinen — den Schlüssel zu besitzen ist nicht dasselbe wie den Namen zu behalten. [DNS](/de/blog/dns-on-tokenized-domains/) und Verlängerungen gesund zu halten, ist Teil derselben Portfolio-Hygiene, von der jeder [Domain-Flipping](/de/blog/domain-flipping/)-Betrieb lebt oder stirbt.

## Der Namefi-Blickwinkel

Verwahrung ist genau der Punkt, an dem sich die Tokenisierung für Flipper bezahlt macht. Weil ein von [Namefi](https://namefi.io) tokenisierter Name eine echte ICANN-Domain ist, deren Eigentum in Ihrer Wallet liegt, können Sie ihn in einem Multisig oder einer Hardware-Wallet genau so halten, wie Sie eine Staatskasse schützen würden — dasselbe Schwellenwert-Schema, das Gelder bewacht, bewacht nun die DNS-Kontrollebene, sodass eine einzelne erphishte Person nicht die primäre `.com` des Unternehmens verlieren kann. Und weil darunter immer noch ein Registry-Eintrag liegt, schlägt das Wiederherstellungsbild das eines rein-Onchain-Namens: Wenn die Selbstverwahrung versagt, gibt es einen Off-Chain-Identitätsfaden, dem man folgen kann. Der Grund, eine [Domain zu tokenisieren](/de/blog/why-tokenize-domains/), um damit zu handeln, ist nicht nur die schnellere Abwicklung — es ist, dass Sie endlich ein Verwahrungsmodell wählen können, das zum Wert des Namens passt. Wählen Sie klug, und richten Sie es ein, *bevor* der Name wichtig wird.

## Freundlicher Haftungsausschluss (Bitte lesen!)

> Wir sind keine Anwälte, Buchhalter, Finanzberater oder Ärzte, und **nichts in diesem Artikel ist rechtliche, finanzielle, steuerliche, buchhalterische, medizinische oder irgendeine andere Art von professioneller Beratung.** Wir schreiben diese Beiträge, um uns selbst weiterzubilden, und als Service für unsere Kunden. Informationen hier können veraltet, ortsspezifisch oder schlicht falsch sein. Auch wir machen Fehler.
>
> Für jede wichtige Entscheidung **konsultieren Sie bitte einen echten Fachmann (im Ernst!)**. Oder wenn das nicht Ihr Ding ist, fragen Sie einen Freund, fragen Sie Twitter, fragen Sie Reddit, fragen Sie eine KI oder fragen Sie eine Wahrsagerin. Kurz gesagt: **DOYR – Do Your Own Research (Recherchieren Sie selbst)**. Lasst uns lernen und Spaß haben.

## Quellen und weiterführende Literatur

- Ethereum — [ERC-721 Non-Fungible Token Standard („eine standardisierte Schnittstelle für nicht-fungible Token, auch bekannt als Urkunden")](https://eips.ethereum.org/EIPS/eip-721#:~:text=A%20standard%20interface%20for%20non%2Dfungible%20tokens%2C%20also%20known%20as%20deeds)
- Wikipedia — [Cryptocurrency wallet (Kontrolle über den privaten Schlüssel; Seed-Phrase-Wiederherstellung)](https://en.wikipedia.org/wiki/Cryptocurrency_wallet#:~:text=The%20private%20key%20is%20used%20by%20the%20owner%20to%20access%20and%20send%20cryptocurrency%20and%20is%20private%20to%20the%20owner)
- Bitcoin BIPs — [BIP-39 mnemonischer Code für deterministische Wallets](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki#:~:text=This%20BIP%20describes%20the%20implementation%20of%20a%20mnemonic%20code%20or%20mnemonic%20sentence%20%2D%2D%20a%20group%20of%20easy%20to%20remember%20words%20%2D%2D%20for%20the%20generation%20of%20deterministic%20wallets)
- IETF — [RFC 9591: FROST-Schwellenwert-Signaturen](https://www.rfc-editor.org/rfc/rfc9591#:~:text=FROST%20signatures%20can%20be%20issued%20after%20a%20threshold%20number%20of%20entities%20cooperate%20to%20compute%20a%20signature)
- Safe — [Smart-Account-/Multisig-Infrastruktur](https://safe.global/)
- ENS Docs — [.eth-Registrierungspreise (5 USD/Jahr für 5+ Buchstaben)](https://docs.ens.domains/registry/eth/#:~:text=letter%20%60.eth%60%20will%20cost%20you%20%605%20USD%60%20per%20year)
- ENS Support — [Was ist eine Schonfrist? (90-tägiges Fenster nach Ablauf)](https://support.ens.domains/en/articles/8046905-what-is-a-grace-period#:~:text=After%20a%20.eth%20name%20expires%20you%20have%20a%2090%2Dday%20Grace%20Period)
