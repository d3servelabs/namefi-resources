---
title: 'Der Bitcoin.org DNS-Hijack: Wie Bitcoins eigene Homepage zu einem „Verdoppele deine Coins"-Betrug wurde'
date: '2026-06-17'
language: de
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: 'Im September 2021 wurde Bitcoin.org — die langjährige Informationsheimat von Bitcoin, betrieben vom pseudonymen Operator Cobra — auf der DNS-Ebene gekapert und in ein gefälschtes „Verdoppele deine Bitcoin"-Gewinnspiel verwandelt, das Betrügern rund 17.000 US-Dollar einbrachte, bevor die Seite offline genommen wurde. Eine Domain-Mayday-Analyse darüber, was passierte, wie es geschah und was es selbst für kryptonative Seiten über ihre Abhängigkeit von DNS lehrt.'
keywords: ['bitcoin.org', 'bitcoin.org hack', 'dns-hijack', 'domain-hijacking', 'bitcoin verdoppeln betrug', 'krypto-gewinnspiel-betrug', 'cobra bitcoin.org', 'cloudflare dns', 'namecheap', 'dns-sicherheit', 'domain-sicherheit', 'nameserver-hijack', 'whois-änderungsangriff']
---

Mehr als ein Jahrzehnt lang gab es im Internet eine einzige Adresse, wenn man eine einfache, herstellerneutrale Antwort auf die Frage „Was ist Bitcoin und wie benutze ich es sicher?" suchte: **Bitcoin.org**.

Es war nie eine Börse. Es verkaufte nie etwas. Es war das Nächste, was das feindlichste, vertrauensloseste Geld der Welt einem *offiziellen* Empfangsbereich je hatte — eine Seite, die [am 18. August 2008 registriert wurde](https://en.wikipedia.org/wiki/Bitcoin#:~:text=The%20domain%20name%20bitcoin.org%20was%20registered), älter als der Genesis-Block selbst, der Ort, an dem das Bitcoin-Whitepaper lebte und wo Neulinge die erste Regel der Krypto lernten: *Sei deine eigene Bank, und vertraue niemandem deine Schlüssel an.*

Daher liegt eine brutale Ironie in dem, was am **Donnerstag, den 23. September 2021** geschah. Die am häufigsten wiederholte Sicherheitslektion in der gesamten Kryptowelt — *wenn jemand verspricht, deine Coins zu verdoppeln, ist es ein Betrug* — wurde in umgekehrter Form von Bitcoins eigenem Eingangsportal ausgestrahlt. Für einige Stunden war die Website, die den Leuten beibrachte, nicht auf „Verdoppele deine Bitcoin"-Angebote hereinzufallen, *selbst* der „Verdoppele deine Bitcoin"-Betrug. Und das geschah nicht, weil jemand in einen Server eingebrochen war, sondern weil jemand die Kontrolle über die **Domain** übernommen hatte.

## Ein symbolisches, vertrauenswürdiges Zuhause für Bitcoin

Um zu verstehen, warum dieser Hijack so schmerzhaft war, muss man verstehen, was Bitcoin.org bedeutete.

Bitcoin hat keinen CEO, keine Zentrale und keinen offiziellen Sprecher. Was es hatte — jahrelang — war eine kleine Gruppe community-betriebener Referenzseiten, und Bitcoin.org war die bekannteste davon. CryptoPotato nannte sie [die älteste Website in Bezug auf BTC, die vor mehr als 13 Jahren registriert wurde](https://cryptopotato.com/bitcoinorg-hacked-giveaway-scam-promising-users-to-double-their-btc/#:~:text=the%20oldest%20website%20in%20relation%20to). Sie beherbergte Wallet-Empfehlungen, Einstiegsanleitungen und eine Kopie von Satoshi Nakamotos Whitepaper.

Passend für Bitcoin wurde sie auch von einem Geist betrieben. Die Seite wird von einem pseudonymen Betreiber gewartet, der nur als **Cobra** bekannt ist — anonym aus Prinzip. Dieses Prinzip war kürzlich vor Gericht auf die Probe gestellt worden: Nur wenige Monate zuvor hatte der selbst ernannte „Satoshi" Craig Wright einen britischen Urheberrechtsfall gewonnen, der Bitcoin.org zur Entfernung des Whitepapers zwang, wobei ein Richter eine [Verfügung erließ, die Cobra verbietet, Wrights Urheberrecht im Vereinigten Königreich zu verletzen](https://www.coindesk.com/markets/2021/06/29/uk-court-orders-bitcoinorg-to-remove-white-paper-following-craig-wright-lawsuit#:~:text=injunction%20prohibiting%20Cobra%20from%20infringing). Cobras Verteidigung seiner eigenen Anonymität war fast poetisch: [Die Gerichtsregeln erlaubten mir, pseudonym verklagt zu werden, aber ich konnte mich nicht pseudonym verteidigen](https://www.coindesk.com/markets/2021/06/29/uk-court-orders-bitcoinorg-to-remove-white-paper-following-craig-wright-lawsuit#:~:text=the%20court%20rules%20allowed%20for%20me%20to%20be%20sued%20pseudonymously).

Der Punkt ist, dass Bitcoin.org *Vertrauen* besaß — die institutionelle Art, die eine führungslose Bewegung eigentlich nicht haben sollte, still über dreizehn Jahre angehäuft. Genau dieses Vertrauen machte sie zum Ziel. Ein Betrug funktioniert umso besser, je glaubwürdiger sein Gastgeber ist. Und es gibt in der Kryptowelt nur sehr wenige Gastgeber, die glaubwürdiger sind als Bitcoins eigener Name.

Eine zweite, schärfere Ironie verbirgt sich hier. Das gesamte Ethos von Bitcoin.org war *Selbstverwahrung*: Halte deine eigenen Schlüssel, vertraue keinem Verwahrer, überprüfe alles. Ein Besucher, der diese Lektion vollständig verinnerlicht hatte, würde niemals Münzen auf das Wallet eines Fremden auf ein Versprechen hin schicken. Aber der Gewinnspiel-Betrug bat ihn nicht, einem Fremden zu vertrauen — er bat ihn, *Bitcoin.org selbst* zu vertrauen, der einzigen Adresse, die ihm jahrelang als sicherer Ausgangspunkt empfohlen worden war. Der Angriff besiegte nicht die Lektion; er entführte den Überbringer.

## September 2021: der Hijack und das gefälschte Gewinnspiel

![Lebendige farbenfrohe Konzeptkunst eines vertrauenswürdigen Küstenleuchtturms, der gekapert wurde, sein Strahl blinkt nun ein leuchtendes gefälschtes Schild mit der Aufschrift „Verdoppele deine Coins" über das Wasser in Richtung kleiner Boote](../../assets/the-bitcoin-org-dns-hijack-01-hijack.jpg)

Am Morgen des 23. September 2021 sahen Besucher von Bitcoin.org keine Wallet-Anleitungen. Sie sahen ein Pop-up-Modal — ein sauberes, offiziell aussehendes Overlay, das auf der Startseite von Bitcoins vertrauenswürdigster Referenzseite eingeblendet war.

Die Botschaft war der älteste Trick in der Kryptowelt, gekleidet in geborgte Autorität. Sie behauptete, die **Bitcoin Foundation** [gebe der Community etwas zurück](https://www.coindesk.com/tech/2021/09/23/bitcoinorg-appears-hacked-by-giveaway-scam/#:~:text=giving%20back%20to%20the%20community), sagte, das Angebot sei auf [die ersten 10.000 Nutzer](https://www.coindesk.com/tech/2021/09/23/bitcoinorg-appears-hacked-by-giveaway-scam/#:~:text=first%2010%2C000) beschränkt, und machte ein einfaches Versprechen: [Sende Bitcoin an diese Adresse, und wir senden dir den doppelten Betrag zurück!](https://www.bleepingcomputer.com/news/security/bitcoinorg-hackers-steal-17-000-in-double-your-cash-scam/#:~:text=Send%20Bitcoin%20to%20this%20address%2C%20and%20we%20will%20send%20double) Ein QR-Code machte es reibungslos. Die Mechanik, wie CoinDesk das Genre trocken beschrieb, ist immer dieselbe: [Diese Systeme geben falsche Versprechen, Gelder nach dem Senden eines anfänglichen Betrags an eine Wallet-Adresse per QR-Code zu verdoppeln](https://www.coindesk.com/tech/2021/09/23/bitcoinorg-appears-hacked-by-giveaway-scam/#:~:text=these%20schemes%20give%20false%20promises%20of%20doubling). Und das Ergebnis ist immer dasselbe: [Die Opfer erhalten tatsächlich nichts zurück und verlieren die gesendete Kryptowährung](https://www.coindesk.com/tech/2021/09/23/bitcoinorg-appears-hacked-by-giveaway-scam/#:~:text=Victims%2C%20in%20fact%2C%20receive%20nothing).

Cobra bestätigte den Einbruch öffentlich und unverblümt und postete, dass die Seite [kompromittiert wurde. Derzeit untersuche ich, wie die Hacker das Betrugs-Modal auf der Seite platziert haben](https://www.bleepingcomputer.com/news/security/bitcoinorg-hackers-steal-17-000-in-double-your-cash-scam/#:~:text=has%20been%20compromised.%20Currently%20looking%20into%20how%20the%20hackers).

## Was Besucher verloren

Ein „Verdoppele dein Geld"-Betrug funktioniert nur, wenn einige wenige daran glauben. Auf einer zufälligen Website würde das kaum jemand. Auf *Bitcoin.org* taten es manche.

Das Betrugs-Wallet blieb nicht leer. BleepingComputer meldete, dass der [letzte aktualisierte Kontostand des Wallets 0,40571238 BTC oder ungefähr 17.000 US-Dollar](https://www.bleepingcomputer.com/news/security/bitcoinorg-hackers-steal-17-000-in-double-your-cash-scam/#:~:text=0.40571238%20BTC%20or%20approximately%20US%2417%2C000) betrug. CoinDesk, das es live verfolgte, berichtete, dass [die Adresse des Gewinnspiel-Betrugs zum Zeitpunkt des Verfassens dieses Artikels über 17.700 US-Dollar in kleinen Transaktionen erhalten hatte](https://www.coindesk.com/tech/2021/09/23/bitcoinorg-appears-hacked-by-giveaway-scam/#:~:text=received%20over%20%2417%2C700%20in%20small%20transactions).

Siebzehntausend Dollar, in einem einzigen Nacht verloren, in einem Betrug, vor dem die Hostseite selbst gewarnt hätte. Und man bedenke den grausamsten Teil von Bitcoins Design: Diese Transaktionen sind endgültig. Es gibt keine Rückbuchung, keine Betrugsabteilung, kein „Ruf die Bank an". Die gleiche Unwiderruflichkeit, die Bitcoin mächtig macht, machte den Verlust jedes Opfers permanent, sobald es den Code gescannt hatte.

Die Dollarzahl ist fast nebensächlich. Der eigentliche Schaden galt dem, was Bitcoin.org dreizehn Jahre lang aufgebaut hatte — die Annahme, dass *diese* Adresse, von allen Adressen, sicher zu vertrauen war.

## Wie es geschah: eine DNS-Kompromittierung, kein Server-Einbruch

![Lebendige farbenfrohe Konzeptkunst eines umgelenkten Wegweisers an einer leuchtenden Weggabelung, ein Pfeil heimlich neu gestrichen, um Verkehr in eine goldene Trichterfalle in Form einer Münze zu lenken, der ursprünglich sichere Weg im Dunkeln gelassen](../../assets/the-bitcoin-org-dns-hijack-02-fake-giveaway.jpg)

Hier ist das Detail, das dies zu einer *Domain-Mayday*-Geschichte und nicht nur zu einer weiteren Phishing-Geschichte macht: **Die Angreifer mussten sich niemals in die Server von Bitcoin.org einbrechen.**

Cobra war in diesem Punkt unmissverständlich. Der Ursprungsserver, so sagte er, wurde nicht berührt — [mein eigentlicher Server erhielt während des Hacks keinen Traffic](https://news.bitcoin.com/hackers-compromise-web-portal-bitcoin-org-dns-hijack-replaces-site-with-btc-doubler-scam/#:~:text=my%20actual%20server%20didn%27t%20get%20any%20traffic%20during%20the%20hack). Stattdessen geschah der Angriff eine Ebene höher, an dem Teil des Internets, der entscheidet, *wohin ein Domainname zeigt*. Beobachter, die den Vorfall verfolgten, stellten fest, dass [die WHOIS-Informationen zum Zeitpunkt des Hacks aktualisiert wurden, die Nameserver + DNS geändert wurden](https://news.bitcoin.com/hackers-compromise-web-portal-bitcoin-org-dns-hijack-replaces-site-with-btc-doubler-scam/#:~:text=The%20WHOIS%20info%20was%20updated%20at%20the%20time%20of%20the%20hack). Sobald man die Nameserver kontrolliert, kontrolliert man die Antwort auf die Frage „Auf welchem Server *ist* bitcoin.org?" — und kann einen vertrauenswürdigen Namen still auf einen eigenen Server umleiten.

Cobras eigene Diagnose legte die Schuld auf die DNS-Ebene und auf eine kürzliche Infrastrukturänderung. Wie er es formulierte: [Bitcoin.org wurde noch nie gehackt. Und dann wechseln wir zu Cloudflare, und zwei Monate später werden wir gehackt.](https://news.bitcoin.com/hackers-compromise-web-portal-bitcoin-org-dns-hijack-replaces-site-with-btc-doubler-scam/#:~:text=Bitcoin.org%20hasn%27t%20been%20hacked%2C%20ever.%20And%20then%20we%20move%20to%20Cloudflare) Seine Arbeitstheorie war präzise und vernichtend: [Die Angreifer scheinen einfach einen Fehler im DNS ausgenutzt zu haben](https://news.bitcoin.com/hackers-compromise-web-portal-bitcoin-org-dns-hijack-replaces-site-with-btc-doubler-scam/#:~:text=The%20attackers%20just%20seem%20to%20have%20exploited%20some%20flaw%20in%20the%20DNS). Decrypt fasste die vorherrschende Einschätzung ähnlich zusammen: Angreifer [nutzten einen Fehler in der DNS-Konfiguration aus, nachdem die Website zwei Monate zuvor zu Cloudflare gewechselt hatte](https://decrypt.co/81612/bitcoin-org-compromised-fraudulent-crypto-giveaway-advertised/#:~:text=exploited%20a%20flaw%20in%20the%20DNS%20configuration%20after%20the%20website%20moved%20to%20Cloudflare).

Ob die Grundursache eine Fehlkonfiguration, eine Kompromittierung auf Registrar-Ebene oder etwas beim DNS-Anbieter war, wurde öffentlich nie vollständig geklärt — CoinDesk stellte fest, dass die [Grundursache des Website-Hijacks unbestätigt bleibt, obwohl manche einen DNS-Hijack vermuteten](https://www.bleepingcomputer.com/news/security/bitcoinorg-hackers-steal-17-000-in-double-your-cash-scam/#:~:text=root%20cause%20of%20the%20website%20hijack%20remains%20unconfirmed). Aber die *Form* davon ist unverkennbar. Die Anwendung war in Ordnung. Der Code war in Ordnung. Die Schlüssel waren in Ordnung. Der **Name** wurde gekapert, und im Web ist die Kontrolle über den Namen das Entscheidende.

## Reaktion und Nachwirkungen

Die Lösung geschah bezeichnenderweise auch auf der Domain-Ebene.

Die Seite konnte sich nicht einfach „herauspatchen", weil die live geschaltete bösartige Version von Bitcoin.org nicht von der eigentlichen Infrastruktur von Bitcoin.org ausgeliefert wurde. Der schnellste Weg, die Blutung zu stoppen, war, die Domain selbst außer Betrieb zu nehmen. Der Registrar, **Namecheap**, tat genau das — laut BleepingComputer: [Wir haben die Domain vorübergehend deaktiviert](https://www.bleepingcomputer.com/news/security/bitcoinorg-hackers-steal-17-000-in-double-your-cash-scam/#:~:text=We%20have%20temporarily%20disabled%20the%20domain). Eine Zeit lang sahen Besucher weder einen Betrug noch eine Homepage; CoinDesk berichtete, dass sie [mit „Diese Website ist nicht erreichbar." begrüßt wurden](https://www.coindesk.com/tech/2021/09/23/bitcoinorg-appears-hacked-by-giveaway-scam/#:~:text=This%20site%20can%27t%20be%20reached). Die vertrauenswürdigste Referenzseite in Bitcoin war offline.

Nach einigen Stunden der Untersuchung wurde die Domain korrekt umgeleitet und die Seite in ihren Zustand vor dem Hack wiederhergestellt. Das Zeitfenster war kurz — ein Tag oder weniger — und in reinen Dollar-Beträgen war der Diebstahl nach Krypto-Kriminalitätsstandards bescheiden. Aber der Vorfall traf hart, gerade weil es *diese* Seite war. Eine Bewegung, die sich auf „Vertraue nicht, verifiziere" beruft, hatte gerade dabei zugesehen, wie ihre eigene kanonische „Vertrau uns"-Seite nachweislich gegen ihre Nutzer eingesetzt wurde.

## Was dies darüber lehrt, dass selbst kryptonative Seiten von DNS abhängen

![Lebendige farbenfrohe Konzeptkunst eines leuchtenden goldenen Münzen-Betrugs-Trichters, helle Münzen fließen in einen breiten, vertrauenswürdig aussehenden Mund oben und verschwinden in der Dunkelheit am engen Boden, vor einem energetischen abstrakten Hintergrund](../../assets/the-bitcoin-org-dns-hijack-03-namefi-angle.jpg)

Die unbequemste Lektion aus dem Bitcoin.org-Hijack ist, dass **kryptonativ zu sein einen vor fast nichts davon schützt.**

Bitcoin ist dezentralisiert. Sein Ledger ist bekannt dafür, schwer manipulierbar zu sein. Seine Schlüssel, wenn sie richtig gehalten werden, gehören einem allein. Nichts davon war hier relevant — denn die *Eingangstür* zu all dem war ein völlig gewöhnlicher Domainname, der auf demselben DNS, Registrar und Nameserver-System wie jeder E-Commerce-Shop oder lokale Bäckerei läuft. Die Blockchain war unberührt. Die Website war in der Hinsicht unantastbar, die zählte, aber der **Name, der auf sie zeigte, war es nicht.**

Einige dauerhafte Erkenntnisse ergeben sich daraus:

1. **Deine Domain ist Teil deiner Angriffsfläche — oft der *größte* Teil.** Du kannst fehlerfreien Code schreiben, deine Schlüssel in Cold Storage halten und jeden Server absichern, und ein Angreifer, der deine Nameserver oder dein Registrar-Konto kontrolliert, kann dich dennoch vollständig imitieren. Der Name ist die Eingangstür, und ein gekaperter Name lässt einen Fremden sie beantworten.

2. **DNS/Registrar-Änderungen sind still und hochgradig wirksam.** Als [Nameserver + DNS geändert wurden](https://news.bitcoin.com/hackers-compromise-web-portal-bitcoin-org-dns-hijack-replaces-site-with-btc-doubler-scam/#:~:text=nameservers%20%2B%20DNS%20changed), „brach" nichts auf eine Weise, die die meisten Monitoring-Systeme sofort erkennen würden — die Seite lud immer noch, nur vom falschen Ort. Registrar-Lock, Registry-Lock, DNSSEC und strikte Zugangskontrolle bei Registrar-/DNS-Anbieter-Konten sind kein optionaler Hygieneschritt; sie sind die Schlösser an der Tür, die alle vergessen.

3. **Reputation ist das, was eigentlich gestohlen wird.** Die Angreifer wollten eigentlich nicht Bitcoin.orgs 17.000-Dollar-Server; sie wollten seine *Glaubwürdigkeit*, für ein paar Stunden ausgeliehen, um einen uralten Betrug glaubwürdig zu machen. Je vertrauenswürdiger deine Domain, desto wertvoller ist es, sie zu kapern — und desto vorsichtiger musst du sein, wer ändern kann, wohin sie zeigt.

4. **„Vertrauenslose" Infrastruktur ruht immer noch auf vertrauenswürdigen Namen.** Selbst Bitcoin, das kanonische Beispiel für die Entfernung von Zwischenhändlern, erreicht seine Nutzer über DNS — ein hierarchisches, vermitteltes, veränderbares System. Das Geld zu dezentralisieren, dezentralisiert nicht die Eingangstür.

5. **Erkennungsgeschwindigkeit schlägt Eleganz der Verteidigung.** Bitcoin.org überstand dies mit einem bescheidenen Verlust, größtenteils weil die Community den Betrug schnell erkannte und der Registrar die Domain innerhalb von Stunden entfernen konnte. Je länger ein gekaperter Name weiterhin auf einen Angreifer auflöst, desto mehr steigen der Verlust — und der Reputationsschaden — an. Zu wissen, *im Moment*, wenn die Kontrolle oder Weiterleitung deines Namens sich ändert, ist mehr wert als jede einzelne statische Absicherung.

## Der Namefi-Blickwinkel

Der Bitcoin.org-Hijack ist im Kern ein *Kontroll- und Verifizierbarkeitsproblem*. Die Anwendung war solide. Die Blockchain war solide. Was versagte, war die Schicht, die eine täuschend einfache Frage beantwortet: **Wer kontrolliert diesen Namen legitimerweise, und wohin darf er zeigen?** Wenn die Antwort auf diese Frage still umgeschrieben werden kann — Nameserver getauscht, [WHOIS-Informationen zum Zeitpunkt des Hacks aktualisiert](https://news.bitcoin.com/hackers-compromise-web-portal-bitcoin-org-dns-hijack-replaces-site-with-btc-doubler-scam/#:~:text=The%20WHOIS%20info%20was%20updated%20at%20the%20time%20of%20the%20hack) — verdampft Vertrauen, egal wie stark der Rest des Stacks ist.

[Namefi](https://namefi.io) geht von der Idee aus, dass Domain-Eigentum und Kontrolle sich wie ein erstklassiges, verifizierbares, internet-natives Asset verhalten sollten, anstatt wie ein Eintrag in einer veränderbaren Datenbank, den ein Angreifer still bearbeiten kann. Tokenisiertes, prüfbares Eigentum macht die Frage „Wer kontrolliert diese Domain, und hat sich diese Kontrolle gerade geändert?" on-chain beantwortbar — und verwandelt einen stillen Nameserver-Tausch in ein sichtbares, verantwortbares Ereignis, während es kompatibel mit dem DNS bleibt, auf das das restliche Web angewiesen ist. Es lässt DNS selbst nicht verschwinden, macht aber *die Kontrolle über einen Namen* schwerer unsichtbar zu kapern und leichter kontinuierlich zu verifizieren.

Bitcoin.org verbrachte dreizehn Jahre damit, der Welt beizubringen, dass der gefährliche Moment derjenige ist, in dem man aufhört zu verifizieren und anfängt zu vertrauen. Für einige Stunden im September 2021 bewies die eigene Domain die Lektion auf die harte Tour. Die Erkenntnis für alle anderen ist einfacher als sie klingt: Deine Domain ist deine Identität im Internet — bewache den Namen so sorgfältig wie die Schlüssel dahinter.

## Quellen und weiterführende Lektüre

- BleepingComputer — [Bitcoin.org hackers steal $17,000 in 'double your cash' scam](https://www.bleepingcomputer.com/news/security/bitcoinorg-hackers-steal-17-000-in-double-your-cash-scam/)
- CoinDesk — [Bitcoin.org Website Inaccessible After Being Hacked by Apparent Giveaway Scam](https://www.coindesk.com/tech/2021/09/23/bitcoinorg-appears-hacked-by-giveaway-scam/)
- Bitcoin.com News — [Hackers Compromise Web Portal Bitcoin.org — DNS Hijack Replaces Site With BTC Doubler Scam](https://news.bitcoin.com/hackers-compromise-web-portal-bitcoin-org-dns-hijack-replaces-site-with-btc-doubler-scam/)
- Decrypt — [Bitcoin.org Compromised, Fraudulent Crypto Giveaway Advertised](https://decrypt.co/81612/bitcoin-org-compromised-fraudulent-crypto-giveaway-advertised/)
- Cointelegraph — [Bitcoin.org goes offline after suffering scam attack](https://cointelegraph.com/news/bitcoin-org-goes-offline-after-suffering-scam-attack)
- CryptoPotato — [BitcoinOrg Hacked: Giveaway Scam Promising Users to Double Their BTC](https://cryptopotato.com/bitcoinorg-hacked-giveaway-scam-promising-users-to-double-their-btc/)
- NewsBTC — [Bitcoin.org Hacked By Scammers For A Few Minutes. Someone Sent Them 0.4 BTC](https://www.newsbtc.com/news/bitcoin-org-hacked-by-scammers/)
- CoinDesk — [UK Court Orders Bitcoin.org to Remove White Paper Following Craig Wright Lawsuit](https://www.coindesk.com/markets/2021/06/29/uk-court-orders-bitcoinorg-to-remove-white-paper-following-craig-wright-lawsuit)
- Wikipedia — [Bitcoin (Geschichte der Domain bitcoin.org)](https://en.wikipedia.org/wiki/Bitcoin)
