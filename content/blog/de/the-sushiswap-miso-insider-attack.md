---
title: 'Der SushiSwap MISO Insider-Angriff: Wie ein einziger bösartiger Commit ~$3 Mio. aus einer Token-Auktion abzweigte'
date: '2026-06-17'
language: de
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: 'Im September 2021 schleuste ein anonymer Auftragnehmer über einen bösartigen Commit seine eigene Wallet-Adresse in das MISO-Launchpad-Frontend von SushiSwap ein und zweigte 864,8 ETH (~3 Mio. $) aus der Auktion von Jay Pegs Auto Mart ab. Ein Domain Mayday Deep-Dive über Code-Lieferketten, Frontend-Vertrauen und was dies über verifizierbares Eigentum lehrt.'
keywords: ['sushiswap miso hack', 'miso supply chain angriff', 'aristok3', 'jay pegs auto mart', 'defi frontend angriff', '864,8 eth', 'software-lieferkette', 'bösartiger commit', 'insider-bedrohung', 'auctionwallet', 'joseph delong', 'web supply chain sicherheit', 'domain-sicherheit']
---

Die meisten Angriffe brechen eine Tür auf. Dieser hier spazierte einfach durch den Vordereingang herein.

Im September 2021 wurden die Betreiber des MISO-Launchpads von SushiSwap nicht Opfer eines Phishing-Angriffs, sie verloren keinen privaten Schlüssel und sie veröffentlichten auch keinen fehlerhaften Smart Contract. Sie taten etwas viel Alltäglicheres: Sie vertrauten einem Mitwirkenden. Ein anonymer Auftragnehmer mit Commit-Zugriff auf den Code trug seine eigene Wallet-Adresse in das Auktions-Frontend ein, pushte es und überließ der Deployment-Pipeline den Rest. Als eine einzelne NFT-Auktion abgewickelt wurde, flossen rund **864,8 ETH – etwa 3 Millionen US-Dollar** – nicht an das Projekt, das den Verkauf durchführte, sondern an den Entwickler, der heimlich umgeschrieben hatte, wohin das Geld fließen sollte.

Kein Exploit. Kein Zero-Day. Nur eine Zeile Code, die niemand gegengeprüft hat, signiert von jemandem, der eigentlich zum Team gehören sollte.

Dies ist Domain Mayday EP15. Es ist eine Geschichte, in der Smart Contracts nur am Rande eine Rolle spielen. Im Kern ist es eine Geschichte über den Teil des Webs, den die meisten Leute niemals überprüfen (auditen): die Code-Lieferkette (Supply Chain), das Frontend und die unbequeme Tatsache, dass die Frage „Wer darf das ändern?“ eine ebenso ernste Sicherheitsfrage ist wie „Wer besitzt die Schlüssel?“.

## Das Vertrauen, das man in Launchpad-Code setzt

Ein DeFi-Launchpad wie MISO – Minimal Initial SushiSwap Offering – existiert, um eine Sache richtig gut zu machen: Geld von einer Menge Fremder einzusammeln und es an ein Projekt weiterzuleiten, das einen Token- oder NFT-Verkauf durchführt. Um das zu erreichen, verknüpft es überprüfte Smart Contracts on-chain mit einem Web-Frontend off-chain. Die Nutzer interagieren mit dem Frontend. Das Frontend teilt ihrer Wallet mit, welche Transaktion sie signieren sollen.

Genau diese Nahtstelle ist der wunde Punkt. Die Leute sind besessen von der Smart-Contract-Ebene, denn dort gibt es die Audits, die Bug-Bounties und die Schlagzeilen. Aber das Frontend – das JavaScript, das entscheidet, an *welche Adresse* eine Auktion auszahlt – ist nur Code in einem Repository, der über eine Pipeline bereitgestellt (deployed) und von jedem bearbeitet wird, der Schreibzugriff hat. Man kann den Tresorraum noch so oft überprüfen; wenn ein Insider das Schild mit der Aufschrift „Geld hier einzahlen“ austauschen kann, spielt der Tresorraum gar keine Rolle mehr.

Der Code von MISO war offen und kollaborativ, wie es bei Krypto-Infrastrukturen oft der Fall ist. Diese Offenheit ist ein Feature: Sie lädt Mitwirkende ein, beschleunigt die Veröffentlichung und ermöglicht es einem kleinen Kernteam, weit über seine eigentlichen Kapazitäten hinaus zu agieren. Es ist jedoch auch genau die Angriffsfläche, die ein Supply-Chain-Angreifer benötigt. Man muss nicht einbrechen, wenn man einfach zur Mitarbeit eingeladen wird.

## September 2021: Der bösartige Commit

![Lebhafte, farbenfrohe Konzeptkunst eines einzelnen manipulierten, rot leuchtenden Ziegelsteins, der von einer anonymen behandschuhten Hand still und heimlich in eine ansonsten saubere Open-Source-Ziegelwand eingefügt wird](../../assets/the-sushiswap-miso-insider-attack-01-attack.jpg)

Am Freitag, dem 17. September 2021, meldete sich der damalige Chief Technology Officer von SushiSwap, Joseph Delong, auf Twitter zu Wort, um zu erklären, was passiert war. Der Bericht von CoinDesk bringt es auf den Punkt: Delong sagte, dass [ein anonymer Auftragnehmer unter dem Github-Namen „AristoK3“ in einem Supply-Chain-Angriff bösartigen Code in das Frontend von Miso eingeschleust hat](https://www.coindesk.com/business/2021/09/17/3m-in-ether-stolen-from-sushiswaps-miso-launchpad#:~:text=an%20anonymous%20contractor%20using%20the%20Github%20handle).

Die Mechanik war fast schon beleidigend einfach. Wie Delong es beschrieb, hat der Angreifer [die Wallet-Adresse der Auktion durch seine eigene ersetzt](https://www.coindesk.com/business/2021/09/17/3m-in-ether-stolen-from-sushiswaps-miso-launchpad#:~:text=replaced%20the%20auction%27s%20wallet%20address%20with%20their%20own). PYMNTS drückte die Tat treffend in Supply-Chain-Begriffen aus: Der Auftragnehmer [pushte einen bösartigen Code-Commit, der über das Frontend der Plattform verteilt wurde](https://www.pymnts.com/news/security-and-risk/2021/sushiswap-crypto-platform-victimized-by-3m-hack/#:~:text=pushed%20a%20malicious%20code%20commit%20that%20was%20distributed%20on%20the%20platform%27s%20front%20end).

Eine Post-Mortem-Analyse des Vorfalls fasst den Kern in einem Satz zusammen: Ein Entwickler, der für die Arbeit an der Auktion beauftragt worden war, [fügte anstelle der auctionWallet seine eigene Wallet-Adresse in den Vertrag ein](https://www.quadrigainitiative.com/casestudy/sushiswapmisojaypegsautomart.php#:~:text=inserted%20his%20own%20wallet%20address%20into%20the%20contract%20instead%20of%20the) – und zwar, indem er den Wert bearbeitete, den das Frontend zum Zeitpunkt des Deployments einspeiste, und nicht, indem er die überprüfte On-Chain-Logik selbst knackte. Eine einzige Variable. `auctionWallet` sollte eigentlich auf das Projekt verweisen, das den Verkauf durchführte. Stattdessen verwies sie auf den Auftragnehmer. Jeder Dollar, den ein Bieter an den Begünstigten der Auktion zu senden glaubte, floss woanders hin, und der Code sah dabei völlig normal aus.

## Was abgezweigt wurde: ~864,8 ETH, ~3 Mio. US-Dollar

Das Ziel war eine einzige, fast schon komische Auktion. Wie CryptoSlate berichtete, erlitt MISO einen Supply-Chain-Angriff, der [864,8 ETH aus dem Token-Auktionsvertrag des „Jay Pegs Auto Mart“ abzog](https://cryptoslate.com/hacker-returns-865-eth-stolen-from-sushis-token-launch-platform-miso/#:~:text=drained%20864.8%20ETH%20from%20the). Jay Pegs Auto Mart war ein NFT-Kunstprojekt, das sich als Gebrauchtwagenhändler ausgab – eine verspielte Kulisse der Krypto-Kultur, die über dem lag, was in finanzieller Hinsicht ein sehr realer Token-Verkauf war.

Die Zahlen fielen in allen Medienberichten gleich aus. PYMNTS berichtete, dass [der Hacker 864,8 Ethereum-Coins – rund 3 Millionen US-Dollar – in seine Wallet transferierte](https://www.pymnts.com/news/security-and-risk/2021/sushiswap-crypto-platform-victimized-by-3m-hack/#:~:text=transferred%20864.8%20Ethereum%20coins). The Crypto Times merkte an, dass der Angreifer [864,8 ETH abzweigte](https://www.cryptotimes.io/2021/09/17/sushiswaps-miso-launchpad-loses-3-million-in-an-attack/#:~:text=drained%20864.8%20ETH) und dass [das einzige Auktionsprojekt, das bisher gehackt und ausgenutzt wurde, der Jay Pegs Auto Mart ist](https://www.cryptotimes.io/2021/09/17/sushiswaps-miso-launchpad-loses-3-million-in-an-attack/#:~:text=The%20only%20auction%20project%20that%20has%20been%20hacked%20and%20exploited).

Dieses letzte Detail ist wichtig. Der vergiftete Code wurde über das Frontend verbreitet, was bedeutet, dass er im Prinzip *jede* Auktion hätte umleiten können, mit der er in Berührung kam. In der Praxis wurde nur der Jay Pegs Auto Mart an die Adresse des Angreifers abgewickelt, bevor das Team es bemerkte. Die anderen betroffenen Auktionen wurden gepatcht, bevor sie geleert werden konnten – ein Unterschied von wenigen Stunden zwischen einer einzelnen schlechten Schlagzeile und einer Katastrophe.

## Wie es passierte: Insider-Vertrauen statt geknacktem Schloss

![Lebhafte, farbenfrohe Konzeptkunst eines im Schatten stehenden Insiders, der heimlich an einem leuchtenden Geldrohr dreht, sodass dessen Fluss in einen privaten Eimer anstatt in den vorgesehenen Tank fließt](../../assets/the-sushiswap-miso-insider-attack-02-malicious-commit.jpg)

Lässt man das Krypto-Vokabular weg, handelt es sich hier um einen klassischen Software-Supply-Chain-Angriff – dieselbe Kategorie wie ein manipuliertes npm-Paket oder ein kompromittierter Build-Server, nur dass die Auszahlung in ETH erfolgte.

Die Vertrauenskette sah wie folgt aus: Einem Mitwirkenden wurde Schreibzugriff auf den Code gewährt, der die Live-Auktionen betrieb. Er nutzte diesen Zugriff, um eine Änderung zu committen, die die Zieladresse austauschte. Die Deployment-Pipeline tat, was Pipelines eben tun – sie nahm den neuesten Code und lieferte ihn an das Frontend aus, das echte Nutzer in ihren Browsern luden. Diese Nutzer verbanden ihre Wallets, signierten das, was das Frontend von ihnen verlangte, und finanzierten so eine Auktion, deren Begünstigter stillschweigend umgeschrieben worden war. Der Bericht von Coinspeaker deckt sich mit den anderen: [ein anonymer Auftragnehmer mit dem GH-Namen AristoK3 schleuste bösartigen Code in das Miso-Frontend ein](https://www.coinspeaker.com/sushiswap-miso-attack-nft/#:~:text=an%20anonymous%20contractor%20with%20the%20GH%20handle%20AristoK3%20injected%20malicious%20code%20into%20the%20Miso%20front%20end).

Beachten Sie, was *nicht* erforderlich war. Der Angreifer musste keinen Fehler in einem Smart Contract finden. Er musste keinen Schlüssel stehlen oder einen Server von außen kompromittieren. Er brauchte genau eine Sache: genug Vertrauen, um den Code ändern zu dürfen. Die Formulierung im Vorfallbericht ist präzise – [das Miso-Frontend wurde Opfer eines Supply-Chain-Angriffs](https://www.quadrigainitiative.com/casestudy/sushiswapmisojaypegsautomart.php#:~:text=The%20Miso%20front%20end%20has%20become%20the%20victim%20of%20a%20supply%20chain%20attack) – ausgeführt von einem anonymen Auftragnehmer mit dem GitHub-Namen AristoK3, der [bösartigen Code in das Miso-Frontend einschleuste](https://www.quadrigainitiative.com/casestudy/sushiswapmisojaypegsautomart.php#:~:text=injected%20malicious%20code%20into%20the%20Miso%20front%20end).

Das ist es, was Insider-Supply-Chain-Angriffe so gefährlich macht. Jede externe Verteidigungslinie – Firewalls, Audits, Multisigs für die Treasury – geht davon aus, dass die Bedrohung von außen kommt und versucht, einzudringen. Ein Insider mit Commit-Rechten hat all dies bereits überwunden. Die bösartige Änderung nutzte den projekteigenen, vertrauenswürdigen und legitimen Deployment-Prozess, um direkt in die Produktion zu gelangen. Die Pipeline wurde nicht unterwandert. Sie wurde *benutzt*.

## Reaktion und Wiederherstellung: Ertappt, namentlich genannt und zurückgezahlt

Die Reaktion von SushiSwap war schnell, öffentlich und konfrontativ. Delong stellte keine stillen Nachforschungen an; er nannte den GitHub-Namen, benannte eine vermutete reale Identität und setzte eine Frist. Laut CoinDesk war die Warnung deutlich: Wenn die Gelder nicht zurückgegeben würden, würde die DeFi-Börse [eine Beschwerde beim FBI einreichen](https://www.coindesk.com/business/2021/09/17/3m-in-ether-stolen-from-sushiswaps-miso-launchpad#:~:text=file%20a%20complaint%20with%20the%20FBI).

Es funktionierte. Der Angreifer lenkte ein. CryptoSlate berichtete, dass nur wenige Stunden nachdem das Team an die Öffentlichkeit ging, [der Hacker 865 ETH an den ursprünglichen MISO-Vertrag zurückgab](https://cryptoslate.com/hacker-returns-865-eth-stolen-from-sushis-token-launch-platform-miso/#:~:text=the%20hacker%20returned%20865%20ETH%20to%20the%20original%20MISO%20contract) – sogar etwas *mehr* als die 864,8 ETH, die abgeflossen waren. The Crypto Times bestätigte den Empfänger: [die Multisig-Adresse von Sushiswap erhielt 865 ETH zurück](https://www.cryptotimes.io/2021/09/17/sushiswaps-miso-launchpad-loses-3-million-in-an-attack/#:~:text=the%20multisign%20address%20of%20Sushiswap%20got%20865%20ETH%20back). Delongs eigenes Status-Update war ebenso kurz angebunden wie die ursprüngliche Drohung. Decrypt hielt seine Bestätigung fest, dass innerhalb von etwa einem Tag [alle Gelder zurückgegeben](https://decrypt.co/81120/sushiswaps-token-launchpad-hacked-over-3m-ethereum#:~:text=All%20funds%20returned) wurden.

Das Happy End verdient jedoch ein Sternchen. Das Geld kam nicht zurück, weil die Architektur den Diebstahl bemerkt hatte, sondern weil der Angreifer sich entschied, es im grellen Licht der Öffentlichkeit und unter der glaubhaften Androhung von Strafverfolgung zurückzugeben. Die Pseudonymität auf einem öffentlichen Ledger ist ein zweischneidiges Schwert: Sie erlaubte es dem Auftragnehmer, anonym zu agieren, bedeutete aber auch, dass die On-Chain-Spur der abgezweigten Gelder für jeden sichtbar war. Genau dieses Druckmittel machte die Rückgabe des Geldes zum Weg des geringsten Widerstands. Die Wiedererlangung war in diesem Fall eine Verhandlungssache, keine Garantie. Der nächste Insider knickt vielleicht nicht ein.

## Was uns das über Code-Lieferketten und Frontend-Vertrauen lehrt

Der MISO-Vorfall ist nach DeFi-Maßstäben finanziell eher klein, aber reich an Lektionen. Einige davon sind es wert, hervorgehoben zu werden:

1. **Das Frontend ist Teil Ihres Sicherheitsperimeters.** Nutzer signieren das, was die Benutzeroberfläche ihnen vorgibt. Wenn ein Angreifer kontrolliert, welche Adresse die Benutzeroberfläche anzeigt, benötigt er den Smart Contract überhaupt nicht. Wer nur den On-Chain-Code überprüft, auditiert nur das halbe System.
2. **Schreibzugriff ist die eigentliche Angriffsfläche.** Die stärkste Kryptographie der Welt nützt nichts, wenn die Person, die den Code bearbeiten kann, sich dagegen entscheidet. „Wer darf das ändern, und wer überprüft es vor der Auslieferung?“ ist eine Sicherheitskontrolle und kein bloßes Prozessdetail.
3. **Obligatorische Code-Reviews sind keine Bürokratie – sie sind Verteidigung.** Ein einziges obligatorisches zweites Augenpaar bei dem Commit, der `auctionWallet` austauschte, hätte dies wahrscheinlich sofort gestoppt. Supply-Chain-Angriffe florieren durch Änderungen, die niemand vor dem Deployment unabhängig überprüft.
4. **Pseudonyme Mitwirkende erhöhen das Risiko.** Offene Mitarbeit ist eine Stärke, aber die Gewährung von deployment-relevantem Zugriff an eine anonyme Identität bedeutet, dass man Code vertraut, den man nicht vollständig zuordnen kann. Vertrauen sollte mit Überprüfung skalieren, nicht mit Enthusiasmus.
5. **Wiederherstellung ist Glückssache, keine Architektur.** Die Gelder kamen aufgrund von öffentlichem Druck und einem nachvollziehbaren Ledger zurück. Ein System zu entwerfen, das auf den guten Willen des Angreifers *angewiesen* ist, stellt kein Sicherheitsdesign dar.

Die rote Linie: Die Integrität darüber, *wer eine Änderung vornehmen darf*, und die *Verifizierung, dass die ausgelieferte Änderung auch genau diese ist*, sind genauso tragfähig wie jeder kryptographische Schlüssel. Das Vertrauen in die Lieferkette ist kein weiches, kulturelles Anliegen. Es ist die harte Grenze des Systems.

## Die Namefi-Perspektive

![Farbenfrohe Illustration von verifizierbarem, manipulationssicherem Eigentum – gesichert durch einen grünen Schild, einen grünen Namefi-Token und Kontinuität](../../assets/the-sushiswap-miso-insider-attack-03-namefi-angle.jpg)

MISO verlor Geld, weil das *Ziel der Werte* stillschweigend von jemandem umgeschrieben werden konnte, dem das System vertraute, und niemand die Änderung verifizierte, bevor sie live ging. Dieses Fehlermuster ist nicht auf DeFi-Launchpads beschränkt. Es gleicht einer Domain, deren Eigentumsverhältnisse oder DNS-Einträge von jedem, der zufällig über die entsprechenden Zugriffsrechte verfügt, unbemerkt geändert werden können – ein Registrar-Konto, ein internes Panel, ein Auftragnehmer mit Anmeldedaten.

Eine Domain ist eine der folgenreichsten „Ziel“-Einstellungen im Internet. Ihre DNS-Einträge entscheiden darüber, wohin Ihr Datenverkehr, Ihre E-Mails und Ihre Nutzer tatsächlich geleitet werden. Wenn diese von einem Insider oder einem kompromittierten Konto geändert werden können, ohne dass es eine manipulationssichere, unabhängig überprüfbare Aufzeichnung darüber gibt, wer was geändert hat, dann haben Sie das MISO-Problem in einem anderen Gewand: Das Schloss ist in Ordnung, aber das Schild an der Tür kann einfach ausgetauscht werden.

[Namefi](https://namefi.io) begegnet dem, indem es Domain-Eigentum als verifizierbares, manipulationssicheres Asset behandelt und nicht als bloßen Eintrag im privaten Konto von jemandem. Tokenisiertes Eigentum macht die Kontrolle on-chain auditierbar und übertragbar, während die Kompatibilität mit DNS erhalten bleibt – so wird „Wem gehört das und wer darf es ändern?“ zu einer überprüfbaren Tatsache und nicht zu einem Vertrauen, das man blind gewähren muss. Der MISO-Auftragnehmer konnte eine Auszahlungsadresse umschreiben, gerade weil das System keine erzwungene, unabhängig überprüfbare Antwort auf die Frage hatte: „Ist diese Änderung autorisiert?“. Die Lektion, die Namefi aus Supply-Chain-Angriffen zieht, lautet, dass Eigentum und Kontrolle *by design* beweisbar sein sollten, damit sich die gefährliche Lücke zwischen *vertraut* und *verifiziert* gar nicht erst auftut.

## Quellen und weiterführende Literatur

- CoinDesk — [$3M in Ether Stolen From SushiSwap's MISO Launchpad](https://www.coindesk.com/business/2021/09/17/3m-in-ether-stolen-from-sushiswaps-miso-launchpad)
- Decrypt — [SushiSwap's Token Launchpad Hacked for Over $3M in Ethereum](https://decrypt.co/81120/sushiswaps-token-launchpad-hacked-over-3m-ethereum)
- CryptoSlate — [Hacker returns 865 ETH stolen from Sushi's token launch platform MISO](https://cryptoslate.com/hacker-returns-865-eth-stolen-from-sushis-token-launch-platform-miso/)
- PYMNTS — [SushiSwap Crypto Platform Victimized by $3M Hack](https://www.pymnts.com/news/security-and-risk/2021/sushiswap-crypto-platform-victimized-by-3m-hack/)
- The Crypto Times — [Sushiswap's Miso Launchpad Loses $3 Million In An Attack](https://www.cryptotimes.io/2021/09/17/sushiswaps-miso-launchpad-loses-3-million-in-an-attack/)
- Coinspeaker — [SushiSwap Launchpad Miso Suffers Attack with 864.8 ETH NFT Project Fund Carted Away](https://www.coinspeaker.com/sushiswap-miso-attack-nft/)
- CryptoBriefing — [Sushi's Initial Offering Launchpad Suffers $3M Exploit](https://cryptobriefing.com/sushiswaps-miso-token-launchpad-suffers-3m-exploit/)
- CryptoPotato — [Another DeFi Hack: $3M in ETH Stolen From SushiSwap's Token Platform](https://cryptopotato.com/another-defi-hack-3m-in-eth-stolen-from-sushiswaps-token-platform/)
- Quadriga Initiative — [SushiSwap MISO Jaypegs Automart case study](https://www.quadrigainitiative.com/casestudy/sushiswapmisojaypegsautomart.php)