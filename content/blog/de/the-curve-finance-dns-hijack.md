---
title: 'Der Curve Finance DNS-Hijack: Warum „geprüfte Smart Contracts" die Eingangstür nicht schützen konnten'
date: '2026-06-17'
language: de
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: 'Im August 2022 waren Curve Finances Smart Contracts unangetastet — doch Angreifer übernahmen die Domain curve.fi beim Registrar, klonten die Website und raubten Nutzern rund 570.000 US-Dollar. Eine eingehende Analyse des DNS-Angriffs auf ein DeFi-Frontend und was er uns über Domain-Sicherheit lehrt.'
keywords: ['curve finance dns hijack', 'curve.fi hijack', 'dns hijacking defi', 'iwantmyname kompromittiert', 'nameserver-kompromittierung', 'wallet drainer', 'defi frontend-angriff', 'domain-sicherheit', 'dns-sicherheit', 'krypto-phishing', 'geklonte website angriff', 'registrar-konto kompromittiert', 'domain mayday']
---

Die Smart Contracts waren einwandfrei.

Das ist das Erste, was man über den Vorfall bei Curve Finance am 9. August 2022 verstehen muss — und es ist genau der Punkt, der Sicherheitsingenieure noch Jahre danach beunruhigt. Curves [On-Chain](/de/glossary/on-chain/)-Code — der geprüfte, kampferprobte automatisierte Market Maker, der Milliarden an Stablecoins verwaltete — wurde nie berührt. Kein Reentrancy-Bug. Keine Oracle-Manipulation. Kein Flash-Loan-Exploit. Die [Blockchain](/de/glossary/blockchain/) tat genau das, wozu sie bestimmt war.

Und trotzdem verloren Nutzer rund **570.000 US-Dollar**.

Der Angriff kam nicht über die Contracts. Er kam über die **Domain**. Jemand übernahm die Kontrolle über `curve.fi` auf [Registrar](/de/glossary/registrar/)-Ebene, leitete sie auf eine geklonte Website um, die mit einem [Wallet](/de/glossary/wallet/)-Drainer verdrahtet war, und ließ die eigene Reputation des Protokolls den Rest erledigen. Jedes Sicherheitsaudit, das Curve je bestanden hatte, war irrelevant — denn der Angreifer klopfte nie an diese Tür. Er trat einfach durch den Eingang — durch die Webadresse, die Nutzer gedankenlos eintippten.

Dies ist *Domain Mayday* Episode 13. Es ist die Geschichte davon, wie der sicherste Teil eines Systems vollkommen unbeschadet sein kann, während der Teil, dem alle *blind vertrauen* — der Domainname — still und leise zur Angriffsfläche wird.

## „Geprüfte Contracts" schützen nicht die Eingangstür

[DeFi](/de/glossary/defi/) verbrachte Jahre damit, eine Kultur der Contract-[Sicherheit](/de/glossary/collateral/) aufzubauen. Audits wurden zur Grundvoraussetzung. Bug-Bounties stiegen in den Millionenbereich. „Auf Etherscan verifiziert" wurde zum Vertrauenssignal. Das kollektive Gedankenmodell verfestigte sich zu etwas wie: *Wenn die Contracts sicher sind, ist das Protokoll sicher.*

Aber ein Nutzer interagiert fast nie direkt mit einem Contract. Er besucht eine Website. Er tippt `curve.fi`, sein Browser löst diesen Namen in eine [IP-Adresse](/de/glossary/ip-address/) auf, lädt eine Seite, und diese Seite sagt seiner Wallet, was sie unterzeichnen soll. All diese Schritte passieren, *bevor* eine einzige Zeile geprüften Solidity-Codes ausgeführt wird — und all diese Schritte leben in einer Infrastruktur, die das Audit nie abgedeckt hat.

Der Domainname ist das allererste Glied in dieser Kette. Er ist auch das Glied, das die meisten Teams als selbstverständlich behandeln: einmal registrieren, DNS einrichten, nie wieder daran denken. Wie ein Erklärungsartikel nach dem Vorfall festhielt, ["nutzt diese Art von Angriff die Vertrauensschicht"](https://www.tradingview.com/news/cointelegraph:9a15fa371094b:0-what-is-dns-hijacking-how-it-took-down-curve-finance-s-website/) zwischen dem Nutzer und der Schnittstelle einer dezentralisierten App aus, anstatt die Blockchain des Protokolls zu durchbrechen. Die Contracts können makellos sein. Wenn ein Angreifer kontrolliert, wohin `curve.fi` *zeigt*, spielt das keine Rolle mehr.

## 9. August 2022: der Hijack

![Vivid colorful concept art of a storefront whose address sign is being swapped to redirect shoppers into an identical fake shop with a hidden trapdoor floor, warm and cool tones, surreal security metaphor, no brand logos](../../assets/the-curve-finance-dns-hijack-01-hijack.jpg)

Am Nachmittag des 9. August 2022 hörte Curves Haupt-Frontend auf, Curves zu sein.

CertiKs Post-Incident-Analyse fixierte den Zeitablauf präzise: [„Gegen 16:20 Uhr EST am 09.08.2022 wurde Curve Finances DNS-Eintrag kompromittiert und auf eine geklonte, bösartige Website umgeleitet."](https://www.certik.com/resources/blog/curve-finance-hack-incident-analysis) Für jeden Besucher von `curve.fi` sah nichts falsch aus. Die Seite wurde gerendert. Das Logo war da. Die Pools, die Oberfläche, die Farben — alles treu reproduziert.

Der Unterschied war unsichtbar und vollständig: Die Seite, die im Browser des Nutzers geladen wurde, stammte nicht mehr von Curve. Es war ein Klon, der auf der Infrastruktur des Angreifers lief und darauf wartete, dass jemand eine Wallet verbindet.

Sicherheitsforscher Lefteris Karapetsas beschrieb die Mechanik direkt — die Angreifer hatten [„die Website geklont, das DNS auf ihre IP zeigen lassen, wo der geklonte Site bereitgestellt ist, und Genehmigungsanfragen an einen bösartigen Contract hinzugefügt."](https://cryptopotato.com/curve-finance-issues-warning-about-compromised-front-end-amid-570k-theft/) Das spätere Erklärungsstück von Cointelegraph beschrieb dasselbe Muster: [„Die Angreifer hatten die Curve Finance-Website geklont und in die DNS-Einstellungen eingegriffen, um Nutzer zu einer duplizierten Version der Website zu leiten."](https://www.tradingview.com/news/cointelegraph:9a15fa371094b:0-what-is-dns-hijacking-how-it-took-down-curve-finance-s-website/)

Dann warteten sie.

## Was Nutzer verloren

Als ein Nutzer auf dem Klon landete und ihn zu nutzen versuchte, bat die Seite seine Wallet, etwas zu tun, das sie auf legitimen DeFi-Seiten täglich tausende Male tut: einem Token zustimmen. Laut CertiK [„injizierte der Angreifer bösartigen Code in die Site, der Nutzer aufforderte, Token-Genehmigungen an einen nicht verifizierten Contract zu erteilen."](https://www.certik.com/resources/blog/curve-finance-hack-incident-analysis) Coingape beschrieb die Falle in einfacheren Worten: [„Die Hacker schafften es, einen bösartigen Contract auf der Startseite zu platzieren, der bei Genehmigung durch das Opfer die Nutzer-Wallets vollständig leerte."](https://coingape.com/crv-tanks-over-10-as-attackers-stole-570k-from-curve-finances-users-wallets/)

Eine Token-Genehmigung zu erteilen fühlt sich routinemäßig an. Es ist derselbe Klick, den Nutzer beim Tauschen auf einer legitimen Börse machen. Doch hier gehörte der genehmigte Contract dem Angreifer — und einmal genehmigt, konnte er die Stablecoins des Opfers abziehen.

Die On-Chain-Abrechnung war konkret. CertiK berichtete, dass [„insgesamt 7 Nutzer vom Exploit betroffen waren, was zu Verlusten von ~612.000 US-Dollar führte,"](https://www.certik.com/resources/blog/curve-finance-hack-incident-analysis) aufgeschlüsselt als [„612.724,16 US-Dollar in USDC und DAI"](https://www.certik.com/resources/blog/curve-finance-hack-incident-analysis), die der Hacker dann in ETH tauschte. rekt.news einigte sich auf eine rundere, vielzitierte Zahl: [„Die gestohlenen Mittel (340 ETH, oder ~575.000 US-Dollar, insgesamt)."](https://rekt.news/curve-finance-rekt) Die meiste zeitgenössische Berichterstattung landete in derselben Bandbreite — Cryptopotato berichtete, dass [Hacker rund 570.000 US-Dollar in ETH stahlen](https://cryptopotato.com/curve-finance-issues-warning-about-compromised-front-end-amid-570k-theft/); CryptoDaily notierte, [der Hacker habe über 573.000 US-Dollar gestohlen](https://cryptodaily.co.uk/2022/08/curve-finance-asks-users-to-revoke-recent-contracts-after-dns-hack). Die genaue Summe variiert je nach Zeitpunkt der Momentaufnahme und ETH-Preis. Die Größenordnung nicht: niedrige bis mittlere sechsstellige Summe, einer Handvoll Nutzern entzogen, von einer Website, die identisch mit der aussah, der sie vertrauten.

Und hier ist der Punkt, bei dem es sich lohnt, innezuhalten. Tronweekly fasste es treffend zusammen: Dieser Angriff [„berührte weder Curves Ethereum-Smart-Contracts noch eines der darin gespeicherten 5,7 Milliarden US-Dollar an Assets."](https://www.tronweekly.com/curve-finance-dns-hijacking/) Fünf Komma sieben Milliarden Dollar an Protokoll-Assets, vollkommen sicher. Curve selbst, wie derselbe Artikel vermerkte, [„ist unbeschadet und hat keinerlei Verluste erlitten."](https://www.tronweekly.com/curve-finance-dns-hijacking/) Das Protokoll gewann. Die Nutzer verloren. Denn der Angriff zielte nie auf das Protokoll.

## Wie es passierte: die Domain, nicht die Chain

![Vivid colorful concept art of a telephone switchboard operator secretly rerouting one glowing call cable to a counterfeit identical building, neon cables and circuits, surreal DNS rerouting metaphor, no brand logos](../../assets/the-curve-finance-dns-hijack-02-dns-compromise.jpg)

Wie schafft es ein Angreifer also, `curve.fi` auf *seinen* Server statt auf Curves aufzulösen?

Zunächst: Was tut DNS? Ein Domainname wie `curve.fi` ist ein menschenlesbares Etikett. Computer brauchen eine IP-Adresse. Das [Domain Name System](/de/glossary/dns/) ist die Lookup-Schicht, die das eine ins andere übersetzt — Cointelegraphs Erklärung vergleicht es mit einem [„Telefonbuch"](https://www.tradingview.com/news/cointelegraph:9a15fa371094b:0-what-is-dns-hijacking-how-it-took-down-curve-finance-s-website/), das [„diese nutzerfreundlichen Domainnamen in die IP-Adressen umwandelt, die Computer für die Verbindung benötigen."](https://www.tradingview.com/news/cointelegraph:9a15fa371094b:0-what-is-dns-hijacking-how-it-took-down-curve-finance-s-website/) [DNS-Hijacking](/de/glossary/dns-hijacking/) bedeutet, diese Suche zu manipulieren, sodass das Telefonbuch die falsche Nummer liefert — [„die Art und Weise, wie DNS-Anfragen aufgelöst werden, zu verändern und Nutzer ohne ihr Wissen auf bösartige Seiten umzuleiten."](https://www.tradingview.com/news/cointelegraph:9a15fa371094b:0-what-is-dns-hijacking-how-it-took-down-curve-finance-s-website/)

Entscheidend dabei: Man muss den Computer des Nutzers nicht kompromittieren. Man ändert die autoritative Antwort an der Quelle — dem **[Nameserver](/de/glossary/nameserver/)**, an den die Domain delegiert. Und diese Quelle liegt beim Registrar der Domain.

Curves Gründer Michael Egorov war direkt bezüglich des Fehlers. Wie von rekt.news zitiert: [„dns registrar iwantmyname hatte seinen ns kompromittiert,"](https://rekt.news/curve-finance-rekt) und das Team war der Meinung, dass [„Curve glaubt, dass der zugrundeliegende Nameserver kompromittiert wurde, nicht eine Schwachstelle auf Account-Ebene."](https://rekt.news/curve-finance-rekt) Mit anderen Worten: Das war (soweit Curve erkennen konnte) kein gestohlenes Passwort für Curves eigenes Registrar-Konto. Das Problem lag eine Ebene tiefer — in der Nameserver-Infrastruktur, die der Registrar selbst betrieb. Cointelegraphs spätere Analyse bestätigte den Registrar namentlich und notierte, das Projekt [„nutzte denselben Registrar, ‚iwantmyname', zum Zeitpunkt des vorherigen Angriffs."](https://www.tradingview.com/news/cointelegraph:9a15fa371094b:0-what-is-dns-hijacking-how-it-took-down-curve-finance-s-website/)

Dieser Unterschied ist für die Lehre enorm wichtig. Ein Team kann ein starkes Passwort erzwingen, Zwei-Faktor-Authentifizierung aktivieren und seinen eigenen Registrar-Login perfekt absichern — und *trotzdem* seine Domain verlieren, wenn der darunterliegende Nameserver kompromittiert wird. Der Domain-Eigentümer hat dabei nicht zwingend einen Fehler gemacht. Das Vertrauen, das er in die Schicht unter ihm setzte, war schlicht gebrochen. Cointelegraphs Formulierung, wie diese Angriffe funktionieren, verallgemeinert das Risiko: [„Wenn sich das Mapping einer Seite durch gestohlene Zugangsdaten oder eine Schwachstelle beim Registrar ändert, können Nutzer ohne ihr Wissen auf schädliche Server umgeleitet werden."](https://www.tradingview.com/news/cointelegraph:9a15fa371094b:0-what-is-dns-hijacking-how-it-took-down-curve-finance-s-website/)

Sobald der Nameserver mit der IP des Angreifers antwortete, lief der Rest automatisch ab. Jeder Nutzer, der `curve.fi` eintippte, erhielt still und heimlich den Klon. Das Telefonbuch war manipuliert worden — und fast niemand überprüft das Telefonbuch.

## Reaktion und Nachfolge

Curves Team reagierte schnell, und die Reaktion ist genau deshalb lehrreich, weil sie zeigt, was sie konnten und was nicht.

Was sie *sofort* tun konnten, war warnen. Das Team sagte Nutzern klar: [„Bitte führen Sie keine Genehmigungen oder Swaps durch. Wir versuchen, das Problem zu lokalisieren, aber zur Sicherheit: Nutzen Sie curve.fi oder curve.exchange vorerst nicht."](https://www.tronweekly.com/curve-finance-dns-hijacking/) Sie verwiesen Nutzer auf den noch sauberen Fallback — [„Bitte nutzen Sie vorerst https://curve.exchange, bis die Propagation für https://curve.fi wieder zum Normalzustand zurückkehrt"](https://coingape.com/crv-tanks-over-10-as-attackers-stole-570k-from-curve-finances-users-wallets/) — denn `curve.exchange` lief auf anderer Infrastruktur und war nicht vergiftet.

Was sie *nicht* sofort tun konnten, war die Glocke ungeschehen zu machen. Sie änderten den Nameserver, aber DNS aktualisiert sich nicht überall gleichzeitig. Wie rekt.news anmerkte: [„Die gespiegelte Seite des Hackers wurde schnell abgeschaltet, jedoch müssen manche Nameserver noch aktualisiert werden."](https://rekt.news/curve-finance-rekt) Für ein Zeitfenster — selbst nachdem die Korrektur vorgenommen worden war — lieferten Caches weltweit weiterhin die alte, bösartige Antwort. Diese Propagationsverzögerung ist eine inhärente Eigenschaft von DNS — und ein inhärenter Vorteil für den Angreifer.

Für Nutzer, die den bösartigen Contract bereits genehmigt hatten, war Widerruf die einzige Verteidigung. Die Botschaft wiederholte sich überall: [„Wenn Sie in den letzten Stunden Contracts auf Curve genehmigt haben, widerrufen Sie dies bitte sofort."](https://cryptopotato.com/curve-finance-issues-warning-about-compromised-front-end-amid-570k-theft/) rekt.news veröffentlichte die spezifische Drainer-Adresse, die Nutzer widerrufen mussten — `0x9eb5f8e83359bb5013f3d8eee60bdce5654e8881` — damit Opfer die Genehmigung kappen konnten, bevor mehr entzogen wurde.

Die gestohlenen Mittel zerstreuten sich über die üblichen Geldwäscher-Rails. CertiK verfolgte den Geldfluss — [„FixedFloat: 292 ETH, Tornado Cash: 27,7 ETH, Binance: 20 ETH"](https://www.certik.com/resources/blog/curve-finance-hack-incident-analysis) — und notierte eine zeitliche Wendung: Da Tornado Cash kurz zuvor von der OFAC sanktioniert worden war, [„beunruhigte die jüngste Sanktionierung von Tornado Cash durch OFAC den Hacker offenbar genug, um den Großteil der gestohlenen Mittel an FixedFloat zu senden,"](https://www.certik.com/resources/blog/curve-finance-hack-incident-analysis) eine zentralisierte Börse. Diese Entscheidung half: rekt.news berichtete, dass von den an FixedFloat gesendeten Mitteln [112 ETH eingefroren wurden](https://rekt.news/curve-finance-rekt). Innerhalb weniger Stunden bestätigte Curve, dass [„das Problem gefunden und behoben wurde."](https://cryptodaily.co.uk/2022/08/curve-finance-asks-users-to-revoke-recent-contracts-after-dns-hack)

## Was dies über DNS bei DeFi-Frontends lehrt

Der Curve-Vorfall ist eine kompakte Lektion darüber, wo DeFis echte Angriffsfläche liegt. Einige Erkenntnisse lassen sich weit über Curve hinaus verallgemeinern:

1. **Ihre Domain ist Teil Ihres Sicherheitsperimeters.** Es ist verlockend, die Domain als Marketing-Infrastruktur zu behandeln — ein Etikett, kein System. Doch die Domain ist die erste Anweisung, der der Browser eines Nutzers folgt. Ist sie falsch, ist alles Nachgelagerte falsch. Audits, die an der Contract-Grenze enden, lassen das meistvertraute Glied ungeprüft.

2. **Registrar- und Nameserver-Sicherheit liegt upstream von Ihnen.** Die eigene Account-Hygiene von Curve mag einwandfrei gewesen sein; die Kompromittierung wurde auf der Nameserver-Ebene vermutet. Sie erben die Sicherheitslage jedes Anbieters in Ihrer DNS-Kette. Wählen Sie Registrare und DNS-Hosts, die Registrar-Locks, starke Account-Schutzmaßnahmen und idealerweise [DNSSEC](/de/glossary/dnssec/) unterstützen — und verstehen Sie, dass Sie auch dann einer Schicht vertrauen, die Sie nicht vollständig kontrollieren.

3. **Nutzer können DNS nicht sehen.** Der Klon sah identisch aus, weil der *Name* identisch war. Das Schlosssymbol war grün; die URL stimmte. Nichts, was ein sorgfältiger Nutzer normalerweise überprüft, hätte es angezeigt. Das macht DNS-Hijacking selbst gegen ein erfahrenes Publikum so effektiv — die Täuschung findet unterhalb der Schicht statt, die Menschen inspizieren.

4. **Haben Sie einen sauberen Fallback.** Curves Rettung war `curve.exchange` auf separater Infrastruktur. Ein zweiter Frontend-Pfad — eine andere Domain, ein anderer DNS-Anbieter, ein [IPFS](/de/glossary/ipfs/)- oder ENS-basierter Spiegel — gibt Ihnen einen Ort, an den Sie Nutzer schicken können, wenn Ihr primärer Name vergiftet ist.

5. **Token-Genehmigungen sind der Angriffsvector.** Jeder Frontend-Angriff dieser Art endet auf dieselbe Weise: eine routinemäßig wirkende Genehmigung für einen feindlichen Contract. Wallets, Schnittstellen und Nutzer müssen Genehmigungsaufforderungen auf einer frisch geladenen Seite als die Hochrisikoaktion behandeln, die sie sind.

## Der Namefi-Aspekt

![Colorful illustration of verifiable, tamper-resistant domain ownership — a domain card secured by a green shield, a green Namefi token, and DNS continuity](../../assets/the-curve-finance-dns-hijack-03-namefi-angle.jpg)

Der Curve-Hijack ist im Kern eine Frage danach, **wer den Namen kontrolliert** — und wie klar diese Kontrolle verifiziert, gehalten und wiederhergestellt werden kann.

Im traditionellen Modell ist die Kontrolle über eine Domain ein fragiles Bündel: ein Registrar-Konto, ein Satz Nameserver-Einträge und eine Kette von Anbietern, denen man stillschweigend vertrauen muss. Wenn ein beliebiges Glied in dieser Kette kompromittiert wird — wie der iwantmyname-Nameserver angeblich war — kann der rechtmäßige Eigentümer die effektive Kontrolle über seinen eigenen Namen verlieren, ohne je einen Fehler gemacht zu haben und ohne einen offensichtlichen, manipulationssicheren Eintrag darüber, *was sich wann geändert hat*.

[Namefi](https://namefi.io) basiert auf der Idee, dass Domains sich wie internet-native Assets verhalten sollten — dass Eigentümerschaft und Kontrolle verifizierbar, prüfbar und manipulationssicher gemacht werden können, während sie mit DNS kompatibel bleiben. Die tiefere Lektion aus Curve lautet nicht „DeFi ist unsicher". Es ist, dass **die Domain-Schicht sicherheitskritische Infrastruktur ist**, und sie jahrelang wie Dekoration behandelt wurde. Ob Sie ein DeFi-Protokoll, einen Onlineshop oder ein Blog betreiben — der Name, den Ihre Nutzer eintippen, ist ein Versprechen, und die Integrität dieses Versprechens ist nur so stark wie die Kontrollfläche dahinter.

Curves Contracts hielten fünf Komma sieben Milliarden Dollar ohne einen Kratzer. Die Domain gab in einem Nachmittag eine halbe Million auf. Diese Lücke ist die ganze Geschichte.

## Quellen und weiterführende Lektüre

- CertiK — [Curve Finance Hack Incident Analysis](https://www.certik.com/resources/blog/curve-finance-hack-incident-analysis)
- rekt.news — [Curve Finance — REKT](https://rekt.news/curve-finance-rekt)
- Cointelegraph (via TradingView) — [What is DNS hijacking? How it took down Curve Finance's website](https://www.tradingview.com/news/cointelegraph:9a15fa371094b:0-what-is-dns-hijacking-how-it-took-down-curve-finance-s-website/)
- Cryptopotato — [Curve Finance Issues Warning About Compromised Front End Amid $570K Theft](https://cryptopotato.com/curve-finance-issues-warning-about-compromised-front-end-amid-570k-theft/)
- Coingape — [Curve Finance DNS Hijacked, Attackers Stole $570K from User Wallets](https://coingape.com/crv-tanks-over-10-as-attackers-stole-570k-from-curve-finances-users-wallets/)
- Tronweekly — [Curve Finance's Hackers Loot $570K Via DNS Hijacking](https://www.tronweekly.com/curve-finance-dns-hijacking/)
- CryptoDaily — [Curve Finance Asks Users To Revoke Recent Contracts After DNS Hack](https://cryptodaily.co.uk/2022/08/curve-finance-asks-users-to-revoke-recent-contracts-after-dns-hack)
