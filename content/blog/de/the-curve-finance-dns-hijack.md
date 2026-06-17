---
title: "Der Curve Finance DNS-Hijack: Wenn „Geprüfte Verträge“ die Vordertür nicht schützen konnten"
date: '2026-06-17'
language: de
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: "Im August 2022 blieben die Smart Contracts von Curve Finance unberührt – aber Angreifer kaperten die Domain curve.fi bei ihrem Registrar, klonten die Website und stahlen den Nutzern rund 570.000 US-Dollar. Ein Deep Dive in den DNS-Angriff auf ein DeFi-Frontend und was wir daraus über Domain-Sicherheit lernen können."
keywords: ['Curve Finance DNS Hijack', 'curve.fi Hijack', 'DNS-Hijacking DeFi', 'iwantmyname Kompromittierung', 'Nameserver-Kompromittierung', 'Wallet Drainer', 'DeFi Frontend-Angriff', 'Domain-Sicherheit', 'DNS-Sicherheit', 'Krypto-Phishing', 'Geklonte Website-Angriff', 'Registrar-Konto-Kompromittierung', 'Domain Mayday']
---

Die Smart Contracts waren völlig in Ordnung.

Das ist das Erste, was man verstehen muss, wenn man sich ansieht, was Curve Finance am 9. August 2022 passiert ist – und es ist der Teil, der Sicherheitsexperten auch Jahre später noch beunruhigt. Der On-Chain-Code von Curve – der geprüfte, kampferprobte Automated Market Maker, der Milliarden in Stablecoins hält – wurde zu keinem Zeitpunkt angerührt. Kein Reentrancy-Bug. Keine Oracle-Manipulation. Kein Flash-Loan-Exploit. Die Blockchain tat genau das, was sie tun sollte.

Und dennoch verloren Nutzer rund **570.000 US-Dollar**.

Der Angriff erfolgte nicht über die Verträge. Er kam über die **Domain**. Jemand übernahm die Kontrolle über `curve.fi` auf Registrar-Ebene, leitete sie auf eine geklonte Website um, die mit einem Wallet-Drainer verbunden war, und ließ den guten Ruf des Protokolls den Rest erledigen. Jedes Sicherheitsaudit, das Curve je bestanden hatte, war irrelevant, denn der Angreifer klopfte an diese Tür gar nicht erst an. Er kam einfach durch die Vordertür herein – über die Webadresse, die Nutzer ohne nachzudenken eingaben.

Dies ist *Domain Mayday* Episode 13. Es ist die Geschichte darüber, wie der sicherste Teil eines Systems absolut ungefährdet sein kann, während der Teil, dem jeder *blindlings vertraut* – der Domainname –, unbemerkt zur Angriffsfläche wird.

## "Geprüfte Verträge" schützen nicht die Vordertür

DeFi hat Jahre damit verbracht, eine Kultur der Contract-Sicherheit aufzubauen. Audits wurden zur Grundvoraussetzung. Bug-Bounties stiegen in die Millionen. „Verified on Etherscan“ wurde zu einem Vertrauenssignal. Das kollektive mentale Modell verhärtete sich zu etwas wie: *Wenn die Verträge sicher sind, ist das Protokoll sicher.*

Aber ein Nutzer interagiert fast nie direkt mit einem Vertrag. Er ruft eine Website auf. Er tippt `curve.fi` ein, sein Browser löst diesen Namen in eine IP-Adresse auf, lädt eine Seite, und diese Seite sagt seinem Wallet, was es signieren soll. Jeder dieser Schritte passiert, *bevor* auch nur eine einzige Zeile geprüften Solidity-Codes ausgeführt wird – und jeder davon findet in einer Infrastruktur statt, die das Audit nie abgedeckt hat.

Der Domainname ist das allererste Glied in dieser Kette. Es ist auch das Glied, das von den meisten Teams nach dem Prinzip „Set-and-Forget“ behandelt wird: Einmal registrieren, das DNS einrichten und nie wieder darüber nachdenken. Wie ein Erklärbeitrag nach dem Vorfall treffend formulierte, nutzt diese Art von Angriff [„die Vertrauensebene“ zwischen dem Nutzer und der Schnittstelle einer dezentralisierten App aus](https://www.tradingview.com/news/cointelegraph:9a15fa371094b:0-what-is-dns-hijacking-how-it-took-down-curve-finance-s-website/), anstatt die Blockchain des Protokolls überhaupt anzugreifen. Die Verträge können makellos sein. Wenn ein Angreifer kontrolliert, wohin `curve.fi` *zeigt*, spielt das alles keine Rolle.

## 9. August 2022: Der Hijack

![Vivid colorful concept art of a storefront whose address sign is being swapped to redirect shoppers into an identical fake shop with a hidden trapdoor floor, warm and cool tones, surreal security metaphor, no brand logos](../../assets/the-curve-finance-dns-hijack-01-hijack.jpg)

Am Nachmittag des 9. August 2022 hörte Curves primäres Frontend auf, Curves Frontend zu sein.

Die Post-Incident-Analyse von CertiK legte den zeitlichen Ablauf präzise fest: [„Am 9. Aug. 2022 gegen 16:20 Uhr EST wurde der DNS-Eintrag von Curve Finance kompromittiert und auf eine geklonte, bösartige Seite umgeleitet.“](https://www.certik.com/resources/blog/curve-finance-hack-incident-analysis) Für jeden, der `curve.fi` besuchte, sah nichts verdächtig aus. Die Seite wurde gerendert. Das Logo war da. Die Pools, die Schnittstelle, die Farben – alles war originalgetreu reproduziert.

Der Unterschied war unsichtbar und absolut: Die Seite, die im Browser des Nutzers geladen wurde, wurde nicht mehr von Curve bereitgestellt. Es war ein Klon, der auf der Infrastruktur des Angreifers lag und darauf wartete, dass jemand ein Wallet verbindet.

Der Sicherheitsforscher Lefteris Karapetsas beschrieb die Mechanik unverblümt – die Angreifer hatten [„die Seite geklont, das DNS auf ihre IP umgeleitet, wo die geklonte Seite bereitgestellt wurde, und Anfragen zur Genehmigung für einen bösartigen Vertrag hinzugefügt.“](https://cryptopotato.com/curve-finance-issues-warning-about-compromised-front-end-amid-570k-theft/) Der spätere Erklärbeitrag von Cointelegraph beschrieb dasselbe Muster: [„Die Angreifer hatten die Curve Finance-Website geklont und in ihre DNS-Einstellungen eingegriffen, um Benutzer auf eine duplizierte Version der Website zu leiten.“](https://www.tradingview.com/news/cointelegraph:9a15fa371094b:0-what-is-dns-hijacking-how-it-took-down-curve-finance-s-website/)

Dann warteten sie.

## Was die Nutzer verloren

Wenn ein Nutzer auf dem Klon landete und versuchte, ihn zu benutzen, forderte die Seite sein Wallet auf, etwas zu tun, was es tausende Male am Tag auf legitimen DeFi-Seiten tut: einen Token zu genehmigen. Laut CertiK [„injizierte der Angreifer bösartigen Code in diese Seite, der Benutzer aufforderte, Token-Genehmigungen für einen nicht verifizierten Vertrag zu erteilen.“](https://www.certik.com/resources/blog/curve-finance-hack-incident-analysis) Coingape beschrieb die Falle in deutlicheren Worten: [„Die Hacker schafften es, einen bösartigen Vertrag auf der Startseite zu implementieren, der bei Genehmigung durch das Opfer die Benutzer-Wallets komplett leeren würde.“](https://coingape.com/crv-tanks-over-10-as-attackers-stole-570k-from-curve-finances-users-wallets/)

Die Genehmigung eines Token-Allowances fühlt sich wie Routine an. Es ist derselbe Klick, den Nutzer machen, um auf einer legitimen Börse zu tauschen. Aber hier gehörte der Vertrag, der genehmigt wurde, dem Angreifer – und einmal genehmigt, konnte er die Stablecoins des Opfers abziehen.

Die On-Chain-Abrechnung war spezifisch. CertiK berichtete, dass [„insgesamt 7 Benutzer von dem Exploit betroffen waren, was zu Verlusten von etwa 612.000 US-Dollar führte“,](https://www.certik.com/resources/blog/curve-finance-hack-incident-analysis) wobei sich die Summe auf [„612.724,16 US-Dollar in USDC und DAI“](https://www.certik.com/resources/blog/curve-finance-hack-incident-analysis) aufschlüsselte, die der Hacker dann gegen ETH tauschte. rekt.news legte sich auf eine rundere, weithin zitierte Zahl fest: [„Die gestohlenen Gelder (340 ETH oder insgesamt ca. 575.000 US-Dollar).“](https://rekt.news/curve-finance-rekt) Die meiste zeitgenössische Berichterstattung landete in demselben Bereich – Cryptopotato berichtete, dass [Hacker ETH im Wert von rund 570.000 US-Dollar gestohlen haben](https://cryptopotato.com/curve-finance-issues-warning-about-compromised-front-end-amid-570k-theft/); CryptoDaily bemerkte, [der Hacker habe über 573.000 US-Dollar gestohlen](https://cryptodaily.co.uk/2022/08/curve-finance-asks-users-to-revoke-recent-contracts-after-dns-hack). Die genaue Gesamtsumme weicht ein wenig ab, je nachdem, wann der Snapshot erstellt wurde und wie ETH bepreist wurde. Die Größenordnung jedoch nicht: niedrige bis mittlere sechsstellige Beträge, entwendet von einer Handvoll Nutzern, durch eine Seite, die exakt so aussah wie die, der sie vertrauten.

Und hier ist der Punkt, über den man einmal in Ruhe nachdenken sollte. Tronweekly hat es klar erfasst: Dieser Angriff [„berührte Curves Ethereum Smart Contracts oder irgendwelche der darin gespeicherten Vermögenswerte in Höhe von 5,7 Milliarden US-Dollar nicht.“](https://www.tronweekly.com/curve-finance-dns-hijacking/) Protokoll-Vermögenswerte im Wert von 5,7 Milliarden Dollar, völlig sicher. Curve selbst, wie derselbe Artikel anmerkte, [„bleibt unbeschadet und hat keine Verluste erlitten.“](https://www.tronweekly.com/curve-finance-dns-hijacking/) Das Protokoll gewann. Die Nutzer verloren. Weil der Angriff niemals auf das Protokoll abzielte.

## Wie es passierte: Die Domain, nicht die Chain

![Vivid colorful concept art of a telephone switchboard operator secretly rerouting one glowing call cable to a counterfeit identical building, neon cables and circuits, surreal DNS rerouting metaphor, no brand logos](../../assets/the-curve-finance-dns-hijack-02-dns-compromise.jpg)

Wie also bringt ein Angreifer `curve.fi` dazu, auf *seinen* Server statt auf den von Curve aufzulösen?

Beginnen wir mit dem, was DNS tut. Ein Domainname wie `curve.fi` ist ein menschenlesbares Label. Computer benötigen eine IP-Adresse. Das Domain Name System (DNS) ist die Lookup-Schicht, die das eine in das andere übersetzt – der Erklärbeitrag von Cointelegraph vergleicht es mit [„einem Telefonbuch“](https://www.tradingview.com/news/cointelegraph:9a15fa371094b:0-what-is-dns-hijacking-how-it-took-down-curve-finance-s-website/), das [„diese benutzerfreundlichen Domainnamen in die IP-Adressen umwandelt, die Computer zum Verbinden benötigen.“](https://www.tradingview.com/news/cointelegraph:9a15fa371094b:0-what-is-dns-hijacking-how-it-took-down-curve-finance-s-website/) DNS-Hijacking bedeutet die Manipulation dieser Suche, sodass das Telefonbuch die falsche Nummer ausgibt – [„die Art und Weise, wie DNS-Anfragen aufgelöst werden, wird verändert, um Benutzer ohne deren Wissen auf bösartige Seiten umzuleiten.“](https://www.tradingview.com/news/cointelegraph:9a15fa371094b:0-what-is-dns-hijacking-how-it-took-down-curve-finance-s-website/)

Entscheidend ist, dass man dafür nicht den Computer des Nutzers knacken muss. Man ändert die autoritative Antwort an ihrer Quelle – dem **Nameserver**, an den die Domain delegiert wird. Und diese Quelle liegt beim Registrar der Domain.

Curves Gründer Michael Egorov drückte direkt aus, wo der Fehler lag. Wie von rekt.news zitiert: [„Beim DNS-Registrar iwantmyname wurde der Nameserver kompromittiert.“](https://rekt.news/curve-finance-rekt) Die Einschätzung des Teams war, dass [„Curve glaubt, dass der zugrunde liegende Nameserver kompromittiert wurde und es sich nicht um eine Schwachstelle auf Kontoebene handelt.“](https://rekt.news/curve-finance-rekt) Mit anderen Worten: Dies war (soweit Curve das beurteilen konnte) kein gestohlenes Passwort von Curves eigenem Registrar-Konto. Es war ein Problem eine Schicht tiefer – auf der Nameserver-Infrastruktur, die der Registrar selbst betrieb. Der Erklärbeitrag von Cointelegraph bestätigte später den Registrar namentlich und merkte an, dass das Projekt [„zum Zeitpunkt des vorherigen Angriffs denselben Registrar, 'iwantmyname', verwendete.“](https://www.tradingview.com/news/cointelegraph:9a15fa371094b:0-what-is-dns-hijacking-how-it-took-down-curve-finance-s-website/)

Diese Unterscheidung ist für die Lektion enorm wichtig. Ein Team kann ein starkes Passwort erzwingen, die Zwei-Faktor-Authentifizierung aktivieren und seinen eigenen Registrar-Login perfekt absichern – und *trotzdem* seine Domain verlieren, wenn der zugrunde liegende Nameserver kompromittiert ist. Der Domain-Inhaber hat nicht unbedingt einen Fehler gemacht. Das Vertrauen, das er in die darunterliegende Schicht gesetzt hat, wurde einfach gebrochen. Die Formulierung von Cointelegraph dazu, wie diese Angriffe funktionieren, verallgemeinert das Risiko: [„Wenn sich das Mapping einer Site aufgrund gestohlener Zugangsdaten oder der Schwachstelle eines Registrars ändert, können Benutzer ohne ihr Wissen auf schädliche Server umgeleitet werden.“](https://www.tradingview.com/news/cointelegraph:9a15fa371094b:0-what-is-dns-hijacking-how-it-took-down-curve-finance-s-website/)

Sobald der Nameserver mit der IP des Angreifers antwortete, verlief der Rest automatisch. Jedem Nutzer, der `curve.fi` eintippte, wurde unbemerkt der Klon übergeben. Das Telefonbuch war bearbeitet worden, und fast niemand überprüft das Telefonbuch.

## Reaktion und Nachwirkungen

Das Team von Curve handelte schnell, und die Reaktion ist gerade deshalb lehrreich, weil sie zeigt, was sie tun und was sie nicht tun konnten.

Was sie sofort tun *konnten*, war zu warnen. Das Team teilte den Nutzern unmissverständlich mit: [„Bitte führen Sie keine Genehmigungen oder Swaps durch. Wir versuchen, das Problem zu lokalisieren, aber zu Ihrer Sicherheit verwenden Sie bitte vorerst nicht curve.fi oder curve.exchange.“](https://www.tronweekly.com/curve-finance-dns-hijacking/) Sie verwiesen die Nutzer auf das noch immer saubere Fallback – [„Bitte verwenden Sie vorerst https://curve.exchange, bis die Propagation für https://curve.fi wieder normal ist“](https://coingape.com/crv-tanks-over-10-as-attackers-stole-570k-from-curve-finances-users-wallets/) – da `curve.exchange` auf einer anderen Infrastruktur lief und nicht vergiftet war.

Was sie *nicht* sofort tun konnten, war, das Geschehene ungeschehen zu machen. Sie änderten den Nameserver, aber DNS wird nicht überall gleichzeitig aktualisiert. Wie rekt.news anmerkte: [„Die gespiegelte Website des Hackers wurde schnell offline genommen, einige Nameserver müssen jedoch noch aktualisiert werden.“](https://rekt.news/curve-finance-rekt) Für ein gewisses Zeitfenster, sogar nachdem der Fix implementiert war, lieferten Caches auf der ganzen Welt weiterhin die alte, bösartige Antwort. Diese Verzögerung bei der Propagation (Verbreitung) ist eine inhärente Eigenschaft von DNS – und ein inhärenter Vorteil für den Angreifer.

Für Nutzer, die den bösartigen Vertrag bereits genehmigt hatten, war die einzige Verteidigung der Widerruf (Revocation). Die Nachricht wurde überall wiederholt: [„Wenn Sie in den letzten Stunden Verträge auf Curve genehmigt haben, widerrufen Sie diese bitte umgehend.“](https://cryptopotato.com/curve-finance-issues-warning-about-compromised-front-end-amid-570k-theft/) rekt.news veröffentlichte die spezifische Drainer-Adresse, die Nutzer widerrufen mussten – `0x9eb5f8e83359bb5013f3d8eee60bdce5654e8881` –, damit Opfer die Freigabe kappen konnten, bevor noch mehr entwendet wurde.

Die gestohlenen Gelder verteilten sich über die üblichen Geldwäschekanäle. CertiK verfolgte den Fluss – [„FixedFloat: 292 ETH, Tornado Cash: 27,7 ETH, Binance: 20 ETH“](https://www.certik.com/resources/blog/curve-finance-hack-incident-analysis) – und bemerkte eine zeitliche Besonderheit: Da Tornado Cash erst Tage zuvor von der OFAC mit Sanktionen belegt worden war, [„beunruhigte die jüngste Sanktionierung von Tornado Cash durch die OFAC den Hacker wahrscheinlich genug, um den Großteil der gestohlenen Gelder an FixedFloat zu senden“,](https://www.certik.com/resources/blog/curve-finance-hack-incident-analysis) eine zentralisierte Börse. Diese Entscheidung half: rekt.news berichtete, dass von den an FixedFloat gesendeten Geldern [112 ETH eingefroren wurden](https://rekt.news/curve-finance-rekt). Innerhalb weniger Stunden bestätigte Curve: [„Das Problem wurde gefunden und behoben.“](https://cryptodaily.co.uk/2022/08/curve-finance-asks-users-to-revoke-recent-contracts-after-dns-hack)

## Was wir daraus über DNS für DeFi-Frontends lernen

Der Vorfall bei Curve ist eine kompakte Lektion darüber, wo sich die wahre Angriffsfläche von DeFi befindet. Einige Erkenntnisse lassen sich weit über Curve hinaus verallgemeinern:

1. **Ihre Domain ist Teil Ihres Sicherheitsperimeters.** Es ist verlockend, die Domain als Marketing-Infrastruktur zu behandeln – als ein Label, nicht als ein System. Aber die Domain ist die erste Anweisung, die der Browser eines Nutzers befolgt. Wenn sie falsch ist, ist alles Nachgelagerte falsch. Audits, die an der Vertragsgrenze (Contract Boundary) Halt machen, lassen das vertrauenswürdigste Glied ungeschützt.

2. **Die Sicherheit von Registraren und Nameservern ist Ihnen vorgelagert.** Curves eigene Kontohygiene mag in Ordnung gewesen sein; die Kompromittierung wurde auf der Nameserver-Ebene vermutet. Sie erben die Sicherheitslage jedes Anbieters in Ihrer DNS-Kette. Wählen Sie Registrare und DNS-Hosts, die Registrar-Sperren (Locks), starke Kontoschutzmechanismen und idealerweise DNSSEC unterstützen – und machen Sie sich bewusst, dass Sie selbst dann einer Schicht vertrauen, die Sie nicht vollständig kontrollieren.

3. **Nutzer können das DNS nicht sehen.** Der Klon sah identisch aus, weil der *Name* identisch war. Das Vorhängeschloss war grün; die URL stimmte. Nichts, was ein vorsichtiger Nutzer normalerweise überprüft, hätte es als verdächtig markiert. Das ist es, was DNS-Hijacking selbst bei einem technisch versierten Publikum so effektiv macht – die Täuschung findet unterhalb der Schicht statt, die Menschen überprüfen.

4. **Sorgen Sie für ein sauberes Fallback.** Die Rettung für Curve war `curve.exchange` auf einer separaten Infrastruktur. Ein zweiter Frontend-Pfad – eine andere Domain, ein anderer DNS-Anbieter, ein IPFS- oder ENS-basierter Mirror – gibt Ihnen einen Ort, an den Sie Nutzer schicken können, wenn Ihr primärer Name vergiftet ist.

5. **Token-Genehmigungen (Approvals) sind die Payload.** Jeder Frontend-Angriff dieser Art endet gleich: mit einer routinemäßig aussehenden Genehmigung für einen feindlichen Vertrag. Wallets, Benutzeroberflächen und Nutzer müssen Genehmigungsaufforderungen auf einer frisch geladenen Seite als das behandeln, was sie sind: eine hochriskante Aktion.

## Die Perspektive von Namefi

![Colorful illustration of verifiable, tamper-resistant domain ownership — a domain card secured by a green shield, a green Namefi token, and DNS continuity](../../assets/the-curve-finance-dns-hijack-03-namefi-angle.jpg)

Der Curve-Hijack ist im Kern die Frage danach, **wer den Namen kontrolliert** – und wie transparent diese Kontrolle verifiziert, gehalten und wiedererlangt werden kann.

Im traditionellen Modell ist die Kontrolle über eine Domain ein fragiles Bündel: ein Registrar-Konto, ein Satz von Nameserver-Einträgen und eine Kette von Anbietern, denen man blind vertrauen muss. Wenn auch nur ein Glied in dieser Kette kompromittiert wird – wie es beim iwantmyname-Nameserver vermutlich der Fall war –, kann der legitime Eigentümer die tatsächliche Kontrolle über seinen eigenen Namen verlieren, ohne jemals einen Fehler gemacht zu haben, und ohne ein klares, manipulationssicheres Protokoll darüber, *was wann geändert wurde*.

[Namefi](https://namefi.io) basiert auf der Idee, dass Domains sich wie Internet-native Vermögenswerte verhalten sollten – dass Eigentum und Kontrolle verifizierbar, auditierbar und manipulationssicher gemacht werden können, während sie gleichzeitig DNS-kompatibel bleiben. Die tiefere Lektion von Curve lautet nicht: „DeFi ist unsicher.“ Sie lautet, dass **die Domain-Ebene eine tragende Sicherheitsinfrastruktur ist**, die jahrelang nur als Dekoration behandelt wurde. Ob Sie ein DeFi-Protokoll, einen Online-Shop oder einen Blog betreiben, der Name, den Ihre Nutzer eintippen, ist ein Versprechen – und die Integrität dieses Versprechens ist nur so stark wie die Kontrollfläche dahinter.

Die Verträge von Curve hielten 5,7 Milliarden Dollar ohne einen einzigen Kratzer. Die Domain gab an einem einzigen Nachmittag eine halbe Million preis. Diese Diskrepanz sagt alles.

## Quellen und weiterführende Literatur

- CertiK — [Curve Finance Hack Incident Analysis](https://www.certik.com/resources/blog/curve-finance-hack-incident-analysis)
- rekt.news — [Curve Finance — REKT](https://rekt.news/curve-finance-rekt)
- Cointelegraph (via TradingView) — [What is DNS hijacking? How it took down Curve Finance's website](https://www.tradingview.com/news/cointelegraph:9a15fa371094b:0-what-is-dns-hijacking-how-it-took-down-curve-finance-s-website/)
- Cryptopotato — [Curve Finance Issues Warning About Compromised Front End Amid $570K Theft](https://cryptopotato.com/curve-finance-issues-warning-about-compromised-front-end-amid-570k-theft/)
- Coingape — [Curve Finance DNS Hijacked, Attackers Stole $570K from User Wallets](https://coingape.com/crv-tanks-over-10-as-attackers-stole-570k-from-curve-finances-users-wallets/)
- Tronweekly — [Curve Finance's Hackers Loot $570K Via DNS Hijacking](https://www.tronweekly.com/curve-finance-dns-hijacking/)
- CryptoDaily — [Curve Finance Asks Users To Revoke Recent Contracts After DNS Hack](https://cryptodaily.co.uk/2022/08/curve-finance-asks-users-to-revoke-recent-contracts-after-dns-hack)