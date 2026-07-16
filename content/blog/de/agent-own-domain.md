---
title: "Kann ein KI-Agent eine Domain besitzen? WHOIS, Verwahrung und Token"
date: '2026-07-10'
language: 'de'
tags: ['ai-agents', 'domains', 'web3']
authors: ['aileen-wright']
editors: ['victor-zhou']
draft: false
format: faq
ogImage: ../../assets/agent-own-domain-og.jpg
description: "Der Registrant muss eine rechtsfähige Person sein, doch die Verwahrung kann delegiert werden. WHOIS, API-Schlüssel und tokenisierte Domains — das Spektrum der Verwahrung erklärt."
keywords: ['kann ein ki-agent eine domain besitzen', 'domainbesitz durch ki-agenten', 'wer ist der registrant wenn ki eine domain registriert', 'ki-agent whois', 'domain-registrant rechtsfähige person', 'verwahrung tokenisierter domains', 'ki-agent wallet nft domain', 'spektrum der domainverwahrung', 'risiko agentenverwalteter domains', 'udrp-risiko für ki-agenten', 'domain an ki-agent delegieren', 'wallet-verwahrte domain', 'rdap-abfrage ki-agent', 'domainbesitz versus kontrolle']
relatedArticles:
  - /de/blog/wallet-checkout/
  - /de/blog/agents-buy-domains/
  - /de/blog/ai-agent-register/
  - /de/blog/cf-namecom-namefi/
  - /de/blog/namefi-mcp/
relatedTopics:
  - /de/topics/domain-tokenization/
  - /de/topics/domain-security/
relatedSeries:
  - /de/series/blockchain-concepts/
  - /de/series/tokenize-your-com/
relatedGlossary:
  - /de/glossary/registrant/
  - /de/glossary/whois/
  - /de/glossary/custodial-ownership/
  - /de/glossary/tokenized-domain/
  - /de/glossary/udrp/
---

„Kann mein KI-Agent eine Domain besitzen?“ Diese Frage taucht ständig auf, sobald ein [KI-Agent](/de/glossary/ai-agent/) im Auftrag einer Person Domains registriert, verlängert und verwaltet — [Wie KI-Agenten Domains ohne einen Menschen kaufen](/de/blog/agents-buy-domains/) zeigt, wie verbreitet das 2026 geworden ist. Die kurze Antwort steht ganz oben; der Rest dieser Seite erläutert *warum* anhand der konkreten Fragen, die Menschen tatsächlich stellen und die jeweils für sich beantwortet werden können.

## Kann ein KI-Agent rechtlich eine Domain besitzen?

Nicht im eigenen Namen. Das [Registrar Accreditation Agreement von 2013](https://www.icann.org/en/contracted-parties/accredited-registrars/registrar-accreditation-agreement/2013-registrar-accreditation-agreement-17-09-2013-en#:~:text=The%20Registered%20Name%20Holder%20with%20whom%20Registrar%20enters%20into%20a%20registration%20agreement%20must%20be%20a%20person%20or%20legal%20entity%20other%20than%20the%20Registrar) der [ICANN](/de/glossary/icann/) — der Vertrag, den jeder ICANN-akkreditierte Registrar unterzeichnet und nach dem er arbeitet — besagt unmittelbar, dass „the [Registered Name Holder](/de/glossary/registrant/) with whom Registrar enters into a registration agreement must be a person or legal entity other than the Registrar.“ Ein [Registrant](/de/glossary/registrant/) muss eine natürliche Person oder eine eingetragene juristische Person sein: eine Einzelperson, ein Unternehmen, eine gemeinnützige Organisation oder eine staatliche Stelle. Ein KI-Agent ist als Software keines davon. Daher kann der Agent selbst nie als Name in der Registrierung stehen.

Was die Regel nicht ausschließt, ist Delegation. Nichts im RAA hindert einen Menschen oder eine Organisation daran, einen Agenten zu autorisieren, in ihrem Namen Domains zu suchen, zu registrieren, zu verlängern oder DNS zu verwalten — so wie heute eine Person einen Mitarbeitenden oder eine Automatisierung autorisieren könnte. Der Registrant bleibt eine rechtsfähige Person; die *Arbeit* der Domainverwaltung kann einem Agenten übertragen werden. Diese Unterscheidung — wer im Register steht und wer klickt (oder die API aufruft) — ist das ganze Thema dieser Seite.

## Wer ist der Registrant, wenn ein KI-Agent eine Domain registriert?

Die Person, die das Konto innehat, den Kauf finanziert und den Bedingungen des Registrars zugestimmt hat — niemals der Agent. Wenn ein Agent die API eines Registrars aufruft, um einen Namen zu registrieren, handelt er als Werkzeug unter der Autorisierung einer Person; rechtlich entspricht das der Nutzung eines Webformulars durch eine Person, nur automatisiert. Die eigene Anleitung der ICANN für Registrants benennt klar, wo diese Verantwortung liegt: „you will assume sole responsibility for the registration and use of your domain name“, wie auf der Seite [Benefits and Responsibilities for Registrants](https://www.icann.org/resources/pages/benefits-2013-09-16-en#:~:text=You%20will%20assume%20sole%20responsibility%20for%20the%20registration%20and%20use%20of%20your%20domain%20name) der ICANN steht. Diese Verantwortung liegt beim Kontoinhaber, der den Agenten freigibt, nicht bei der Software, die den Aufruf ausführt.

Deshalb führt jeder glaubwürdige Ablauf zur Agentenregistrierung — auch der von [Namefi](https://namefi.io) — über Zugangsdaten, die von einer Person oder Organisation kontrolliert werden: einen API-Schlüssel, der an ein gedecktes Konto gebunden ist, oder ein [Wallet](/de/glossary/wallet/), dessen [privaten Schlüssel](/de/glossary/private-key/) jemand kontrolliert. [Wie Sie mit Ihrem KI-Agenten bei Namefi eine Domain registrieren](/de/blog/ai-agent-register/) zeigt, wie dieser Schritt mit Zugangsdaten praktisch funktioniert.

## Was zeigt der WHOIS- oder RDAP-Datensatz bei einer agentenregistrierten Domain tatsächlich?

Dieselben Felder wie bei jeder anderen Registrierung: den Registrar of Record, Registrierungs- und Ablaufdaten sowie — sofern nicht durch [WHOIS](/de/glossary/whois/)-Datenschutz verborgen, den die meisten Registrare inzwischen standardmäßig anwenden — Name, Organisation und Kontaktdaten des Registrants. Es gibt kein Feld für „von einem KI-Agenten registriert“, und keine ICANN-Richtlinie definiert ein solches Feld. Das [eigene RDAP-basierte Abfragetool der ICANN](https://lookup.icann.org) ist die maßgebliche Stelle, um den aktuellen Datensatz einer konkreten Domain zu prüfen; es liefert dasselbe Schema, unabhängig davon, ob ein Mensch das Registrierungsformular ausfüllt oder ein Agent per API dieselben Daten übermittelt.

Praktisch bedeutet das: Ein Außenstehender — etwa ein Markeninhaber, Sicherheitsforscher oder potenzieller Käufer — kann allein anhand von WHOIS/RDAP nicht erkennen, dass eine Domain von einem Agenten registriert wurde. Der Datensatz benennt den rechtlichen Registrant. Was den API-Aufruf ausgelöst hat, der ihn erzeugte, gehört nicht zum Datenmodell.

## Was ist der Unterschied zwischen einer vom Agenten *betriebenen* und einer vom Agenten *besessenen* Domain?

Betreiben bedeutet, dass der Agent auf der Domain handeln kann — sie verlängern, DNS-Einträge ändern oder einen Transfer anstoßen — weil er Zugangsdaten mit entsprechendem Umfang besitzt. Besitzen bedeutet im einzigen rechtlich maßgeblichen Sinn, nach der obigen RAA-Definition als Registrant eingetragen zu sein: als eine Person oder juristische Person, die gegenüber dem Registrar und den ICANN-Richtlinien verantwortlich ist. Ein Agent kann eine Domain umfassend betreiben — der [MCP-Server von Namefi](/de/blog/namefi-mcp/) stellt genau diese Art von Werkzeugen bereit —, ohne je Eigentümer zu sein; so wie eine Hausverwaltung Schlüssel halten und Wartungsarbeiten veranlassen kann, ohne Eigentum am Gebäude zu haben.

Die Lücke zwischen diesen beiden Rollen ist der Ort, an dem die meisten praktischen Fragen tatsächlich liegen. Deshalb behandeln die nächsten Abschnitte sie als Spektrum und nicht als ein einziges Ja oder Nein.

## Was ist das Verwahrungsspektrum für eine vom Agenten verwaltete Domain?

Drei Stufen, die dem Agenten jeweils zunehmend direktere Kontrolle geben, während der rechtliche Registrant gleich bleibt:

- **Zugang zum Registrar-Konto.** Der Agent (oder das Skript, das im Auftrag des Agenten die Registrar-API aufruft) nutzt Zugangsdaten, die an das eigene Registrar-Konto der Person oder Organisation gebunden sind. Das Registrant-Feld ändert sich nie; der Agent handelt lediglich innerhalb eines Kontos, das bereits jemandem gehört, ähnlich wie bei einer heute üblichen Vereinbarung zur gemeinsamen Nutzung eines Logins.
- **API-Schlüssel.** Zugangsdaten mit begrenztem Umfang für die API des Registrars, die gegen ein gedecktes Guthaben abgerechnet werden, ohne zwangsläufig den vollen Zugang zum Kontodashboard zu teilen. [Namefi stellt solche Schlüssel aus](https://namefi.io/api-key), damit ein Agent suchen, Preise abrufen und registrieren kann, ohne eine Browsersitzung anzufassen — behandelt in [Wie Sie mit Ihrem KI-Agenten bei Namefi eine Domain registrieren](/de/blog/ai-agent-register/). Registrant bleibt weiterhin die Person, deren Konto den Umfang des Schlüssels bestimmt.
- **Wallet-verwahrte [tokenisierte Domain](/de/glossary/tokenized-domain/).** Die Registrierung wird als On-Chain-Token geprägt, und das [Wallet](/de/glossary/wallet/), das diesen Token hält — über einen von [x402](/de/glossary/x402/) signierten Wallet-Checkout oder eine festgelegte Empfangsadresse — kontrolliert unmittelbar den On-Chain-Transferweg der Domain, ganz ohne Registrar-Dashboard. [Domains mit einem Krypto-Wallet bezahlen: kein Konto erforderlich](/de/blog/wallet-checkout/) erklärt, wie eine Domain auf diese Weise in ein Wallet gelangt.

Jede Stufe ist direkter als die vorige, doch die zuvor erläuterte Frage nach dem rechtlichen Registrant verschiebt sich nicht — sie wird unabhängig davon gleich beantwortet, auf welcher Stufe der Agent arbeitet.

## Was ändert sich, wenn eine Domain tokenisiert wird?

Die Tokenisierung einer Domain prägt ein [NFT](/de/glossary/nft/), das als parallele On-Chain-Kontrollebene über einer echten DNS-Registrierung fungiert; [Was sind tokenisierte Domains?](/de/blog/what-are-tokenized-domains/) erläutert dies ausführlicher. Namefi, ein ICANN-akkreditierter Registrar, erreicht dies, indem die zugrunde liegende Registrierung echt und von der ICANN anerkannt bleibt, während der Eigentums-Token an ein vom Käufer angegebenes Wallet geprägt wird. Die eigene Dokumentation von Namefi beschreibt die Registrierung einer Domain so, dass der resultierende Token direkt an eine vom Käufer kontrollierte Adresse `nftReceivingWallet` gesendet wird. Die Domain hat weiterhin einen WHOIS/RDAP-Datensatz und einen Registrar of Record; der Token fügt einen Weg hinzu, die *Kontrolle* über diesen Datensatz Peer-to-Peer und On-Chain zu übertragen, ohne einen vom Registrar vermittelten Transferantrag.

Was die Tokenisierung nicht tut, ist neu zu definieren, wer Registrant sein darf. Der Standard [ERC-721](/de/glossary/erc-721/), auf dem tokenisierte Domains aufbauen, enthält [keine Einschränkung dafür, welche Art von Adresse einen Token halten kann](https://eips.ethereum.org/EIPS/eip-721): Jede Wallet-Adresse kann ein NFT besitzen, und der Standard sieht ausdrücklich auch Verträge als Tokenhalter vor. Das ist eine Aussage über den Token, nicht über die Regeln der ICANN für Registrants. Diese liegen auf der Registrar-Ebene darüber und verlangen weiterhin, dass die zugrunde liegende Registrierung auf eine natürliche oder juristische Person zurückführbar ist.

## Kann das Wallet eines KI-Agenten tatsächlich eine tokenisierte Domain halten?

Technisch ja, in dem engen Sinn, dass ein Wallet nur ein Schlüsselpaar ist und weder der ERC-721-Standard noch eine Präge-Transaktion prüft, ob die Partei, die den privaten Schlüssel kontrolliert, ein Mensch, ein Skript oder ein autonomer Prozess ist. Hat ein Agent Signaturberechtigung über ein Wallet — mit seinem eigenen Schlüssel oder mit delegierter Berechtigung über den Schlüssel einer anderen Person —, kann dieses Wallet das NFT einer tokenisierten Domain empfangen und halten wie jedes andere Wallet.

Ob diese Anordnung den *Agenten* in einem rechtlich relevanten Sinn zum Eigentümer macht, ist eine wirklich offene Frage, die wir hier nicht entscheiden können. Keine ICANN-Richtlinie, kein Gerichtsurteil und keine von uns gefundene Quelle behandelt einen KI-Agenten — im Unterschied zu der Person oder Organisation, die dessen Wallet kontrolliert — als rechtlichen Eigentümer von irgendetwas. „Das Wallet des Agenten hält den Token“ sollte als Beschreibung technischer Verwahrung verstanden werden, nicht als abschließende rechtliche Folgerung. Die sicherere Einordnung, die alle obigen Quellen stützen, lautet: Der *Kontrolleur* des Wallets — wer den privaten Schlüssel hält oder anweisen kann — ist die Partei mit einem tatsächlichen Anspruch; und das soll weiterhin eine Person oder Organisation sein, nicht die Software selbst.

## Was passiert bei Fehlverhalten des Agenten — kann eine Domain gesperrt oder zurückgeholt werden?

Je nach Verwahrungsstufe greifen zwei unterschiedliche Schutzmechanismen, und sie bieten nicht dieselbe Art von Rechtsbehelf. Auf Registrar-Ebene schaffen die Transferregeln der ICANN bewusst Hürden: Eine Domain kann in der Regel innerhalb von 60 Tagen nach der Erstregistrierung nicht zu einem neuen Registrar transferiert werden, und nach einer Änderung von Name, Organisation oder E-Mail-Adresse des Registrants gilt eine **60-tägige Change-of-Registrant-Sperre**. Beides ist in den [FAQ der ICANN für Registrants](https://www.icann.org/resources/pages/name-holder-faqs-2017-10-10-en#:~:text=Another%20situation%20is%20if%20the%20domain%20name%20is%20subject%20to%20a%2060-day%20Change%20of%20Registrant%20lock) dokumentiert. Diese Zeitfenster geben einem Registrant Gelegenheit, eine unbefugte Änderung zu bemerken und anzufechten, bevor sie endgültig ist — ein realer, wenn auch begrenzter Schutz gegen einen außer Kontrolle geratenen Agenten bei einem gewöhnlichen Registrar-Konto oder API-Schlüssel.

Sobald eine Domain tokenisiert ist und das NFT in einem Wallet liegt, sieht dieses Sicherheitsnetz anders aus. Ein On-Chain-Transfer ist nach seiner Bestätigung im Allgemeinen endgültig; es gibt keine Registrar-seitige Sperre, die einen Token zurückdreht, der an die falsche Adresse gesendet wurde. Die praktische Absicherung verlagert sich daher nach vorn, auf den Umfang der Befugnisse des Agenten-Wallets: etwa auf eine [Multi-Sig](/de/glossary/multi-sig/)-Anordnung, die einen zweiten Unterzeichner verlangt, oder darauf, einem Agenten keine dauerhafte Berechtigung über ein Wallet mit wertvollen tokenisierten Domains zu geben. Das ist dasselbe Prinzip der Leitplanken, das für Zahlungen in [Domains mit einem Krypto-Wallet bezahlen](/de/blog/wallet-checkout/#the-security-model-what-the-agent-can-and-cannot-do) behandelt wird.

## Beseitigt die Tokenisierung einer Domain das UDRP-Risiko?

Nein, und keine der geprüften Quellen deutet etwas anderes an. Verpflichtungen aus der [UDRP](/de/glossary/udrp/) hängen an der zugrunde liegenden, von der ICANN anerkannten DNS-Registrierung, die auch eine tokenisierte Domain weiterhin hat. Die Tokenisierung verändert, wer die Domain wie bewegen kann, nicht aber, ob Markenrecht oder die Streitbeilegungsrichtlinie der ICANN darauf anwendbar sind. Ein Beitrag über Domains im Besitz von Agenten formulierte das Risiko klar: „if an agent registers a domain that turns out to be a trademark conflict, there's no human to respond to a UDRP complaint“, wenn niemand überwacht, was ein Agent unter seinen Zugangsdaten registriert. Das wird ausführlicher in [Wie KI-Agenten Domains ohne einen Menschen kaufen](/de/blog/agents-buy-domains/#guardrails-no-human-required-still-needs-a-human-set-policy) behandelt. Eine UDRP-Beschwerde richtet sich gegen den eingetragenen Registrant — gegen die jeweilige natürliche oder juristische Person —, nicht gegen den Agenten, der die Registrierung übermittelt hat.

## Wer haftet also tatsächlich, wenn die Domain eines Agenten ein rechtliches Problem verursacht?

Der eingetragene Registrant: die natürliche oder juristische Person, deren Konto, API-Schlüssel oder Wallet die Registrierung autorisiert hat — niemals das KI-Modell selbst. Das ist die durchgängige Linie aller obigen Fragen: WHOIS/RDAP benennt eine rechtsfähige Person, das RAA verlangt eine solche, die Transfer-Sperren der ICANN und das UDRP-Risiko haften beide an demselben Namen, und die Tokenisierung verändert die Kontrollmechanik, nicht aber die darunterliegende Verantwortlichkeit. „Der Agent besitzt die Domain“ ist eine nützliche Kurzform für „dem Agenten wurde Kontrolle über die Domain delegiert“. Sie sollte als Kurzform behandelt werden, nicht als feststehende rechtliche Tatsache: Wie weit diese Delegation gehen kann und ob eine Rechtsordnung einen autonomen Agenten jemals als mehr als ein Werkzeug seines verantwortlichen Betreibers ansieht, ist unerprobt. Legen Sie vor der Übertragung von Kauf- oder Verwahrungsbefugnissen an einen Agenten auf jeder Stufe ausdrücklich fest, wer der rechtliche Registrant ist.

## Mit einem echten Registrant im Datensatz registrieren und tokenisieren

[Namefi](https://namefi.io) ist genau für diese Konstellation gebaut: eine echte [ICANN-akkreditierte](/de/glossary/icann/) Registrierung mit einem Registrant-Feld, das nach den ICANN-Vorgaben behandelt wird, und einer optionalen [tokenisierten](/de/glossary/tokenized-domain/) Ebene, die die On-Chain-Kontrolle in ein Wallet Ihrer Wahl legt — auch in eines, das ein Agent unter den von Ihnen gesetzten Leitplanken betreibt. Beginnen Sie mit [Wie Sie mit Ihrem KI-Agenten bei Namefi eine Domain registrieren](/de/blog/ai-agent-register/), oder gehen Sie direkt zum Wallet-signierten Checkout in [Domains mit einem Krypto-Wallet bezahlen](/de/blog/wallet-checkout/).

**[Bei Namefi eine Domain suchen und registrieren](https://namefi.io).**

## Quellen und weiterführende Lektüre

- ICANN — [Registrar Accreditation Agreement 2013, §3.7.7](https://www.icann.org/en/contracted-parties/accredited-registrars/registrar-accreditation-agreement/2013-registrar-accreditation-agreement-17-09-2013-en#:~:text=The%20Registered%20Name%20Holder%20with%20whom%20Registrar%20enters%20into%20a%20registration%20agreement%20must%20be%20a%20person%20or%20legal%20entity%20other%20than%20the%20Registrar) („must be a person or legal entity other than the Registrar“ — die zentrale Regel zur Zulässigkeit als Registrant)
- ICANN — [Benefits and Responsibilities for Registrants](https://www.icann.org/resources/pages/benefits-2013-09-16-en#:~:text=You%20will%20assume%20sole%20responsibility%20for%20the%20registration%20and%20use%20of%20your%20domain%20name) („you will assume sole responsibility for the registration and use of your domain name“)
- ICANN — [FAQ für Registrants: Ihre Domain übertragen](https://www.icann.org/resources/pages/name-holder-faqs-2017-10-10-en#:~:text=Another%20situation%20is%20if%20the%20domain%20name%20is%20subject%20to%20a%2060-day%20Change%20of%20Registrant%20lock) (60-tägige Transfer-Sperren für Neuregistrierungen und Änderungen des Registrants)
- ICANN — [ICANN Lookup (lookup.icann.org)](https://lookup.icann.org) (die offizielle RDAP-basierte WHOIS/RDAP-Abfrage für den aktuellen Registrant-Datensatz jeder Domain)
- Ethereum — [EIP-721: Non-Fungible Token Standard](https://eips.ethereum.org/EIPS/eip-721) (keine Einschränkung, welche Adresse — einschließlich eines Vertrags — einen Token halten kann)
- Namefi — [namefi.io/llms.txt](https://namefi.io/llms.txt) (Referenz zur Tokenisierung und zum Prägen an `nftReceivingWallet` — Quelle für Produktangaben zu Namefi in diesem Artikel)
- dev.to — [Wie KI-Agenten ihre eigenen Domainnamen kaufen können und warum das wichtig ist](https://dev.to/purpleflea/how-ai-agents-can-buy-their-own-domain-names-and-why-this-matters-1l4j#:~:text=If%20an%20agent%20registers%20a%20domain%20that%20turns%20out%20to%20be%20a%20trademark%20conflict%2C%20there%27s%20no%20human%20to%20respond%20to%20a%20UDRP%20complaint) (UDRP-Risiko, wenn niemand die Registrierungen eines Agenten überwacht)
- Namefi — [Wie KI-Agenten Domains ohne einen Menschen kaufen (2026)](/de/blog/agents-buy-domains/) (die Leitplanken und Reseller-Einordnung, auf denen dieser Artikel aufbaut)
- Namefi — [Domains mit einem Krypto-Wallet bezahlen: kein Konto erforderlich](/de/blog/wallet-checkout/) (Mechanik der Wallet-signierten Verwahrung und Leitplanken für Ausgabenrichtlinien)
