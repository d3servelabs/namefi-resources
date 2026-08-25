---
title: "Was ist Agentenzahlung, und warum überschlagen sich plötzlich alle, um sie anzubieten?"
date: '2026-08-13'
language: 'de'
tags: ['ai-agents', 'payments', 'explainer']
authors: ['aileen-wright']
editors: ['victor-zhou']
translators: ['kai-kunstmann']
draft: false
format: explainer
ogImage: ../../assets/what-is-agent-payment-og.jpg
description: "Agentenzahlung ermöglicht es KI-Agenten, mit einer begrenzten, widerrufbaren Vollmacht Geld auszugeben. Ein Blick in Stripes Link-Wallet für Agenten, Mercurys Agent-Karten und den Ansturm der Jahre 2025–26."
keywords: ["was ist agentenzahlung", "agentenzahlungen erklärt", "agentischer handel", "Stripe Link Wallet für Agenten", "Stripe Issuing for Agents", "Mercury Agent-Karten", "Mercury Spend Management", "Agentic Commerce Protocol", "Google AP2-Protokoll", "Mastercard Agent Pay", "Visa Intelligent Commerce", "einmalig nutzbare Karte für KI-Agenten", "shared payment token", "Ausgabenlimits für KI-Agenten", "x402 Agentenzahlungen"]
relatedArticles:
  - /de/blog/wallet-checkout/
  - /de/blog/agents-buy-domains/
  - /de/blog/state-of-agentic/
  - /de/blog/agent-native/
  - /de/blog/ai-agent-register/
relatedTopics:
  - /de/topics/web3-foundations/
  - /de/topics/domain-tokenization/
relatedSeries:
  - /de/series/blockchain-concepts/
  - /de/series/domain-apocalypse/
relatedGlossary:
  - /de/glossary/ai-agent/
  - /de/glossary/x402/
  - /de/glossary/stablecoin/
  - /de/glossary/wallet/
  - /de/glossary/tokenized-domain/
---

Innerhalb von sechzehn Monaten haben die beiden großen Kartennetzwerke, Google, OpenAI und Stripe allesamt Infrastruktur für ein und dieselbe Sache angekündigt oder ausgeliefert: einem [KI-Agenten](/de/glossary/ai-agent/) das Ausgeben von Geld zu ermöglichen. Mastercard [kündigte Agent Pay an](https://www.mastercard.com/global/en/news-and-trends/press/2025/april/mastercard-unveils-agent-pay-pioneering-agentic-payments-technology-to-power-commerce-in-the-age-of-ai.html#:~:text=The%20program%20introduces%20Mastercard%20Agentic%20Tokens) am 29. April 2025. Visa stellte tags darauf [Intelligent Commerce](https://usa.visa.com/about-visa/newsroom/press-releases.releaseId.21361.html#:~:text=browse%2C%20select%2C%20purchase%20and%20manage%20on%20their%20behalf) vor. Google veröffentlichte im September 2025 sein [Agent Payments Protocol (AP2)](https://cloud.google.com/blog/products/ai-machine-learning/announcing-agents-to-payments-ap2-protocol#:~:text=breaks%20this%20fundamental%20assumption) zusammen mit mehr als 60 Partnerorganisationen. Im selben Monat schaltete OpenAI [Instant Checkout in ChatGPT](https://openai.com/index/buy-it-in-chatgpt/#:~:text=powered%20by%20the%20Agentic%20Commerce%20Protocol%2C%20built%20with%20Stripe) frei. Und im April 2026 brachte Stripe [Links Wallet für Agenten](https://stripe.com/blog/giving-agents-the-ability-to-pay#:~:text=The%20agent%20never%20gets%20access%20to%20your%20raw%20payment%20credentials) auf den Markt — eine Verbraucher-Wallet, die sich ein Agent für jeweils einen Einkauf ausleihen kann. Selbst Mercury, eine Banking-Plattform für Unternehmen, führt sein [Spend-Management-Angebot](https://mercury.com/spend-management#:~:text=cards%20for%20teams%20and%20agents) inzwischen mit „Karten für Teams **und Agenten**" an.

Dieser Beitrag erklärt, was „Agentenzahlung" tatsächlich ist, geht zwei lehrreiche Umsetzungen durch — Stripes verbraucherseitige Wallet und Mercurys unternehmensseitige Agent-Karten — und beleuchtet anschließend, warum so viele Unternehmen fast gleichzeitig entschieden haben, dass sie es sich nicht leisten konnten, hier abseitszustehen.

## Was „Agentenzahlung" tatsächlich bedeutet

Agentenzahlung ist die Infrastruktur, die es einem Software-Agenten erlaubt, im Auftrag einer Person oder eines Unternehmens Geld auszugeben — mit einer Vollmacht, die **begrenzt** ist (so viel, bei diesem Händler, für diesen Zweck), **nachweisbar** ist (der Händler kann erkennen, dass der Agent tatsächlich autorisiert war) und **widerrufbar** ist (der Inhaber kann sie jederzeit abschalten), statt des groben Werkzeugs, dem Agenten einfach eine rohe Kartennummer in die Hand zu geben.

Genau dieser letzte Halbsatz ist der springende Punkt. Nichts hat dich je davon abgehalten, deine Visa-Nummer in die Konfigurationsdatei eines Bots einzufügen. Was die meisten Menschen davon abhält, ist, dass eine Kartennummer unbegrenzte Vollmacht bedeutet: Wer immer sie besitzt, kann damit alles bei jedem belasten, bis du es bemerkst und die Karte sperrst. Googles AP2-Ankündigung benennt das zugrunde liegende Problem unumwunden: Heutige Zahlungssysteme setzen in der Regel voraus, dass ["ein Mensch direkt auf einer vertrauenswürdigen Oberfläche auf ‚Kaufen' klickt"](https://cloud.google.com/blog/products/ai-machine-learning/announcing-agents-to-payments-ap2-protocol#:~:text=assume%20a%20human%20is%20directly%20clicking), und ein autonomer Agent, der eine Zahlung auslöst, ["bricht diese grundlegende Annahme"](https://cloud.google.com/blog/products/ai-machine-learning/announcing-agents-to-payments-ap2-protocol#:~:text=breaks%20this%20fundamental%20assumption). AP2 fasst diese Lücke in drei Fragen, die jede Agenten-Transaktion beantworten muss: **Autorisierung** (hat der Nutzer dem Agenten die Vollmacht für *diesen* Kauf erteilt?), **Authentizität** (spiegelt die Anfrage des Agenten die tatsächliche Absicht des Nutzers wider?) und **Verantwortlichkeit** (wer trägt den Verlust, wenn etwas schiefgeht?).

Jedes Produkt in diesem Bereich — Token-Programme der Kartennetzwerke, offene Protokolle, Wallets, Agent-Karten — ist ein Versuch, diese drei Fragen so gut zu beantworten, dass es zu einer normalen, unspektakulären Sache wird, einen Agenten Geld ausgeben zu lassen.

## Stripe: eine Wallet, die sich dein Agent ausleihen kann, einen Kauf nach dem anderen

Stripes Einstieg, [angekündigt am 29. April 2026](https://stripe.com/blog/giving-agents-the-ability-to-pay#:~:text=Today%20we%E2%80%99re%20launching), ist **Links Wallet für Agenten**, aufgebaut auf einer neuen Schicht namens **Issuing for agents**. Link ist Stripes Verbraucher-Wallet — das Produkt nach dem Motto „meine Daten speichern für schnelleren Checkout" — mit einer Kundenbasis, die Stripe mit [mehr als 200 Millionen Verbrauchern](https://stripe.com/blog/giving-agents-the-ability-to-pay#:~:text=more%20than%20200%20million%20consumers) beziffert. Der Agenten-Ablauf funktioniert so:

1. Der Verbraucher gewährt einem Agenten über einen Standard-OAuth-Ablauf Zugriff auf seine Link-Wallet — dasselbe Zustimmungsmuster, das auch beim Verbinden jeder anderen Drittanbieter-App verwendet wird.
2. Wenn der Agent etwas kaufen möchte, erstellt er eine **Spend Request** mit Kontextinformationen: Händlername, URL, Betrag und eine für Menschen lesbare Beschreibung, was er kauft und warum.
3. Der Verbraucher prüft und genehmigt die Anfrage im Web oder in den mobilen Apps von Link. Aktuell [erfordert jede Anfrage die Prüfung durch die Person](https://stripe.com/blog/giving-agents-the-ability-to-pay#:~:text=each%20request%20requires%20the%20person%E2%80%99s%20review), bevor irgendeine Zugangsinformation geteilt wird; Stripe zufolge sind Ausgabenlimits und vorab genehmigte Autonomie als Nächstes geplant.
4. Nach der Genehmigung erhält der Agent entweder eine **einmalig nutzbare Karte** oder ein **Shared Payment Token (SPT)** — eine Zugangsinformation, die [mit Kontrollen wie Betrag, Währung und Händler begrenzt werden kann](https://stripe.com/blog/giving-agents-the-ability-to-pay#:~:text=scoped%20with%20controls%20like%20amount%2C%20currency%2C%20and%20merchant). Wie Stripe es formuliert: [„Der Agent erhält niemals Zugriff auf deine rohen Zahlungsdaten."](https://stripe.com/blog/giving-agents-the-ability-to-pay#:~:text=The%20agent%20never%20gets%20access%20to%20your%20raw%20payment%20credentials)

Es lohnt sich, dieses Design genau zu lesen, denn es kehrt das Modell der hinterlegten Karte um. Eine gespeicherte Karte ist eine dauerhafte Vollmacht, aus der der Händler (oder der Agent) immer wieder schöpfen kann, begrenzt durch Vereinbarungen, die im Nachhinein durchgesetzt werden, statt durch die Zugangsinformation selbst; eine Spend Request ist eine einzelne Erteilung von Vollmacht, erstellt im Moment des Kaufs, auf genau diesen Kauf begrenzt und danach tot. Stripe legt außerdem die darunterliegende Schicht offen — Issuing for agents —, damit Unternehmen ihre eigenen agentischen Wallets bauen können: einmalig nutzbare virtuelle Karten, Guthabenverwaltung, Berechtigungen auf Kartenebene, Transaktionsüberwachung und Betrugskontrollen im Moment der Autorisierung.

## Mercury: Die Firmenkarte trifft auf den Agenten

Stripes Wallet beantwortet die Verbraucherfrage — *wie lasse ich einen Shopping-Agenten mit meinem Geld einkaufen?* Mercurys [Spend Management](https://mercury.com/spend-management#:~:text=cards%20for%20teams%20and%20agents) beantwortet die geschäftliche Version, und die Antwort ist aufschlussreich: Behandle Agenten wie Mitarbeiter.

Mercury beschreibt das Produkt als [„selbstdurchsetzendes Ausgabenmanagement mit intelligenten Budgets, Mitarbeitererstattungen und Karten für Teams und Agenten"](https://mercury.com/spend-management#:~:text=cards%20for%20teams%20and%20agents). Die Mechanik ist das vertraute Spend-Management-Werkzeugset — [Budgets und Leitplanken, die auf bestimmte Zwecke begrenzt sind](https://mercury.com/spend-management#:~:text=Set%20up%20budgets%20and%20guardrails%20to%20unblock%20your%20team%20and%20agents), Limits je Kategorie, Echtzeit-Tracking, Richtlinien, die sich selbst durchsetzen — erweitert auf nicht-menschliche Ausgebende: Unternehmen können [eigene Agent-Karten für genehmigte Transaktionen ausstellen](https://mercury.com/spend-management#:~:text=Issue%20dedicated%20agent%20cards%20for%20approved%20transactions), jede mit ihren eigenen Limits.

Die Seite demonstriert es sogar: Ein Agent füllt ein Checkout-Formular mit „Janes Agent-Karte" aus, gibt eine Werbebestellung über $100 auf und meldet zurück, dass die Karte ein Ausgabenlimit von $1.000 pro Monat trägt und dass die Kartendaten nur für diesen Checkout verwendet — nie gespeichert — wurden. Mercury Spend ist [für alle Geschäftsbankkunden von Mercury inklusive](https://mercury.com/spend-management#:~:text=included%20for%20all%20Mercury%20business%20banking%20customers), eine eigenständige Version ist für Teams geplant, die anderswo Bankgeschäfte führen.

Der Rahmen, in den es gesetzt wird, zählt mehr als die Feature-Liste. Für ein Unternehmen ist ein Agent, der Geld ausgibt, kein exotisches neues Zahlungsproblem — er ist Personal. Er bekommt eine Karte, ein Budget, einen Zweck, ein monatliches Limit und eine Prüfspur, genau wie ein Neuzugang im Finanzsystem. Wo Stripe eine Zustimmungsschleife für Verbraucher gebaut hat, hat Mercury einen Platz im Organigramm für Software geschaffen.

## Sechzehn Monate voller Ankündigungen

Reiht man die Zeitlinie aneinander, ist der Wettlauf kaum zu übersehen:

| Datum | Unternehmen | Was angekündigt wurde |
|---|---|---|
| 29. April 2025 | Mastercard | [Agent Pay](https://www.mastercard.com/global/en/news-and-trends/press/2025/april/mastercard-unveils-agent-pay-pioneering-agentic-payments-technology-to-power-commerce-in-the-age-of-ai.html#:~:text=The%20program%20introduces%20Mastercard%20Agentic%20Tokens): Agentic Tokens; Agenten müssen [registriert und verifiziert](https://www.mastercard.com/global/en/news-and-trends/press/2025/april/mastercard-unveils-agent-pay-pioneering-agentic-payments-technology-to-power-commerce-in-the-age-of-ai.html#:~:text=trusted%20AI%20agents%20to%20be%20registered%20and%20verified) sein, um Transaktionen durchzuführen |
| 30. April 2025 | Visa | [Intelligent Commerce](https://usa.visa.com/about-visa/newsroom/press-releases.releaseId.21361.html#:~:text=trusted%20with%20payments%2C%20not%20only%20by%20users): Öffnung von Visas Netzwerk für KI-Agenten über tokenisierte Zugangsdaten |
| 16. September 2025 | Google | [Agent Payments Protocol (AP2)](https://cloud.google.com/blog/products/ai-machine-learning/announcing-agents-to-payments-ap2-protocol#:~:text=breaks%20this%20fundamental%20assumption): ein offenes Protokoll mit mehr als 60 Partnern, von Amex über Coinbase bis PayPal |
| 29. September 2025 | OpenAI + Stripe | [Instant Checkout in ChatGPT](https://openai.com/index/buy-it-in-chatgpt/#:~:text=powered%20by%20the%20Agentic%20Commerce%20Protocol%2C%20built%20with%20Stripe), angetrieben vom quelloffenen Agentic Commerce Protocol (ACP) |
| 15. Januar 2026 | Google | [Universal Commerce Protocol (UCP)](/de/blog/google-unveils-universal-commerce-protocol-to-power-the-next-generation-of-ai-shopping-agents/): ein offener Interoperabilitätsstandard für den Handel, der neben AP2 funktionieren soll |
| 29. April 2026 | Stripe | [Links Wallet für Agenten + Issuing for agents](https://stripe.com/blog/giving-agents-the-ability-to-pay#:~:text=Today%20we%E2%80%99re%20launching): Verbraucher-Wallet-Zugriff und Issuing-Primitiven für Agentenausgaben |
| 2026 | Mercury | [Spend Management mit Agent-Karten](https://mercury.com/spend-management#:~:text=Issue%20dedicated%20agent%20cards%20for%20approved%20transactions): Budgets, Leitplanken und eigene Karten für Agenten |

Warum der Ansturm? Drei Kräfte — und dieser Teil ist Interpretation, nicht etwas, das die Ankündigungen selbst offen aussprechen:

**Der Käufer bewegt sich, und die Wallet will mitziehen.** OpenAI weist darauf hin, dass [mehr als 700 Millionen Menschen ChatGPT wöchentlich nutzen](https://openai.com/index/buy-it-in-chatgpt/#:~:text=More%20than%20700%20million%20people%20turn%20to%20ChatGPT%20each%20week), und mittlerweile wickelt es Käufe direkt im Chat ab. Wenn Entdeckung und Checkout beide innerhalb einer Agenten-Unterhaltung stattfinden, sitzt derjenige, der die Wallet des Agenten liefert, zwischen jedem Händler und jedem Kunden. Stripes Botschaft an Entwickler ist unverblümt, worum es geht — auf Link aufbauen und [dessen 200-Millionen-Verbraucher-Basis erreichen](https://stripe.com/blog/giving-agents-the-ability-to-pay#:~:text=more%20than%20200%20million%20consumers). Zahlungsunternehmen haben zwei Jahrzehnte lang zugesehen, wie Suche und Social Media den Handel vermittelten; keines von ihnen hat vor, vom Spielfeldrand zuzusehen, wie Agenten das jetzt übernehmen.

**Unbegrenzte Zugangsinformationen überleben den Kontakt mit Automatisierung nicht.** Ohne eigens dafür gebaute Schienen geben Menschen Agenten gespeicherte Karten und gemeinsam genutzte Logins in die Hand — dauerhafte Vollmacht ohne jede Begrenzung, genau das Muster, das Betrugssysteme eigentlich erkennen sollen. Visas Produktchef fasste die Anforderung als Vertrauen, das über Nutzer hinausreicht: Agenten ["müssen nicht nur von Nutzern, sondern auch von Banken und Verkäufern mit Zahlungen betraut werden"](https://usa.visa.com/about-visa/newsroom/press-releases.releaseId.21361.html#:~:text=trusted%20with%20payments%2C%20not%20only%20by%20users). Netzwerke, die einen autorisierten Agenten von einem kartentestenden Bot unterscheiden können, genehmigen mehr gute Transaktionen und blockieren mehr schlechte; Netzwerke, die das nicht können, machen beides schlecht.

**Protokolle sind ein Wettlauf um Claims.** ACP, AP2, Mastercards Agentic Tokens und Visas tokenisierte Zugangsdaten wollen alle die Standardgrammatik maschineller Käufe werden. Offene Standards gewinnen solche Wettläufe meist dadurch, dass sie sich leicht übernehmen lassen — genau deshalb hat OpenAI [ACP quelloffen gemacht](https://openai.com/index/buy-it-in-chatgpt/#:~:text=Agentic%20Commerce%20Protocol%2C%20so%20that%20more%20merchants%20and%20developers%20can%20begin%20building) und Google 60 Launch-Partner für AP2 gewonnen, bevor es im Januar 2026 mit dem [Universal Commerce Protocol](/de/blog/google-unveils-universal-commerce-protocol-to-power-the-next-generation-of-ai-shopping-agents/) nachlegte, um den Einkaufs-Workflow rund um die Zahlung zu standardisieren. Niemand will den unterlegenen Standard zweimal integrieren.

## Ein Design-Muster, viele Logos

Entfernt man das Branding, laufen alle ernstzunehmenden Agentenzahlungs-Produkte auf dieselben vier Eigenschaften hinaus:

1. **Die rohe Zugangsinformation nie offenlegen.** Einmalig nutzbare Karten (Stripe), Shared Payment Tokens (Stripe/ACP), Agentic Tokens (Mastercard), tokenisierte Zugangsdaten (Visa). Der Agent trägt ein eigens dafür gebautes Instrument, nicht deine PAN.
2. **Die Vollmacht begrenzen.** Betrag, Währung, Händler und zeitliche Grenzen direkt an der Zugangsinformation — OpenAIs Variante: [verschlüsselte Zahlungstoken, die „nur für bestimmte Beträge und bestimmte Händler autorisiert"](https://openai.com/index/buy-it-in-chatgpt/#:~:text=encrypted%20payment%20tokens%20are%20only%20authorized%20for%20specific%20amounts%20and%20specific%20merchants) sind.
3. **Einen Menschen in der Genehmigungsschleife behalten — zumindest vorerst.** Stripe verlangt heute eine Prüfung je Anfrage; Mercurys Budgets autorisieren Ausgaben im Voraus innerhalb von Grenzen, die ein Mensch festgelegt hat. Der Autonomie-Regler bewegt sich, doch er startet nahe null.
4. **Agentenausgaben nachvollziehbar machen.** Registrierte Agenten (Mastercard), Kontext-Strings der Spend Request (Stripe), Echtzeit-Tracking und die Durchsetzung „Beleg oder deine Karte wird gesperrt" (Mercury). Jede Transaktion sollte beantworten: „Welcher Agent, mit wessen Vollmacht, wofür?"

Falls diese Eigenschaften kryptonativen Lesern vertraut vorkommen, ist das kein Zufall. Ein per Signatur autorisierter [Stablecoin](/de/glossary/stablecoin/)-Transfer nach dem exakten Zahlungsschema von [x402](/de/glossary/x402/) — ein exakter Betrag, an einen exakten Empfänger, nur innerhalb eines Zeitfensters gültig, signiert von der eigenen [Wallet](/de/glossary/wallet/) des Zahlers im Moment des Kaufs — ist dasselbe Design, nur aus der anderen Richtung erreicht, wobei die Begrenzung durch Kryptografie statt durch die Richtlinien-Engine eines Kartenausstellers erzwungen wird. Stripe selbst führt Stablecoins als kommende Zahlungsmethode für Agenten-Wallets auf. Die Kartenwelt und die Kryptowelt nähern sich derselben Antwort an: *Vollmacht pro Transaktion, nicht Vollmacht auf Vorrat.*

## Wo Domains ins Bild passen

Domains erweisen sich als eines der ersten Dinge, die Agenten von sich aus kaufen — sie sind reine API-Objekte, keine Lieferadresse erforderlich, und jedes ausgerollte Agenten-Produkt braucht irgendwann einen Namen, den es selbst kontrolliert. Wir haben bereits darüber geschrieben, [wie Agenten Domains ohne einen Menschen kaufen](/de/blog/agents-buy-domains/), [wie ein agent-nativer Registrar aussieht](/de/blog/agent-native/), und [wie ein Agent bei Namefi Schritt für Schritt eine Domain registriert](/de/blog/ai-agent-register/).

Namefis eigene Antwort auf die Zahlungsfrage ist der per Wallet-Signatur autorisierte Checkout, der ausführlich in [Domains mit einer Krypto-Wallet bezahlen: Kein Konto nötig](/de/blog/wallet-checkout/) behandelt wird: Die Wallet eines Agenten beantwortet eine x402-Challenge, indem sie eine USDC-Transferautorisierung für genau eine Registrierung, zu genau einem Preis signiert, ohne Konto und ohne irgendwo gespeicherte Zugangsinformation — und erhält die Domain als [tokenisiertes Asset](/de/glossary/tokenized-domain/) an dieselbe Wallet. Das ist Agentenzahlung genau in dem Sinne, den dieser Beitrag beschrieben hat — heute live in einem echten Produkt, für genau das, was Agenten mit der größten Verlässlichkeit kaufen müssen.

Der Ansturm, Agentenzahlung anzubieten, ist am Ende ein Ansturm um Vertrauen. Mehr als zweihundert Millionen Link-Verbraucher, mehr als siebenhundert Millionen wöchentliche ChatGPT-Nutzer und jedes Firmenkartenprogramm laufen auf dieselbe Wette hinaus: Die nächste Milliarde Käufer wird nicht durchweg menschlich sein, und die Infrastruktur, die ihrer Software eine sichere, begrenzte, rechenschaftspflichtige Ausgabenvollmacht verleiht, wird ebenso grundlegend sein, wie es das Kartennetzwerk für die letzte Ära des Handels war.

## Quellen und weiterführende Lektüre

- Stripe — [Giving agents the ability to pay](https://stripe.com/blog/giving-agents-the-ability-to-pay) (Links Wallet für Agenten + Issuing for agents, 29. April 2026)
- Mercury — [Spend Management](https://mercury.com/spend-management) (Budgets, Leitplanken und eigene Agent-Karten)
- Google Cloud — [Announcing the Agent Payments Protocol (AP2)](https://cloud.google.com/blog/products/ai-machine-learning/announcing-agents-to-payments-ap2-protocol) (16. September 2025)
- OpenAI — [Buy it in ChatGPT: Instant Checkout and the Agentic Commerce Protocol](https://openai.com/index/buy-it-in-chatgpt/) (29. September 2025)
- Mastercard — [Mastercard unveils Agent Pay](https://www.mastercard.com/global/en/news-and-trends/press/2025/april/mastercard-unveils-agent-pay-pioneering-agentic-payments-technology-to-power-commerce-in-the-age-of-ai.html) (29. April 2025)
- Visa — [Find and Buy with AI: Visa Unveils New Era of Commerce](https://usa.visa.com/about-visa/newsroom/press-releases.releaseId.21361.html) (Visa Intelligent Commerce, 30. April 2025)
- Namefi — [Domains mit einer Krypto-Wallet bezahlen: Kein Konto nötig](/de/blog/wallet-checkout/) (per Wallet-Signatur autorisierter x402-Checkout)
