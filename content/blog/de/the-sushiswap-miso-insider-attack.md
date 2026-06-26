---
title: 'Der SushiSwap-MISO-Insider-Angriff: Wie ein einziger bösartiger Commit ~3 Mio. USD aus einer Token-Auktion umgeleitet hat'
date: '2026-06-17'
language: de
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: 'Im September 2021 schleuste ein anonymer Auftragnehmer seine eigene Wallet-Adresse über einen bösartigen Commit in das MISO-Launchpad-Frontend von SushiSwap ein und leitete 864,8 ETH (~3 Mio. USD) aus der Jay-Pegs-Auto-Mart-Auktion um. Ein Domain-Mayday-Deep-Dive zu Code-Lieferketten, Frontend-Vertrauen und den Lehren aus verifizierbarem Eigentum.'
keywords: ['sushiswap miso hack', 'miso supply chain attack', 'aristok3', 'jay pegs auto mart', 'defi front-end attack', '864.8 eth', 'software supply chain', 'malicious commit', 'insider threat', 'auctionwallet', 'joseph delong', 'web supply chain security', 'domain security']
relatedArticles:
  - /de/blog/the-badgerdao-frontend-attack/
  - /de/blog/the-curve-finance-dns-hijack/
  - /de/blog/the-godaddy-multi-year-breach/
  - /de/blog/the-2024-squarespace-defi-domain-hijacks/
  - /de/blog/the-myetherwallet-bgp-dns-attack/
relatedTopics:
  - /de/topics/domain-security/
  - /de/topics/domain-tokenization/
relatedSeries:
  - /de/series/domain-apocalypse/
  - /de/series/name-change-game-change/
relatedGlossary:
  - /de/glossary/registrar/
  - /de/glossary/dns/
  - /de/glossary/icann/
  - /de/glossary/web3/
  - /de/glossary/tld/
---

Die meisten Angriffe brechen eine Tür auf. Dieser ging einfach durch die Vordertür hinein.

Im September 2021 wurden die Betreiber des MISO-Launchpads von SushiSwap nicht durch Phishing hereingelegt, verloren keinen privaten Schlüssel und lieferten keinen fehlerhaften [Smart Contract](/de/glossary/smart-contract/). Sie taten etwas weitaus Gewöhnlicheres: Sie vertrauten einem Mitwirkenden. Ein anonymer Auftragnehmer mit Commit-Zugang zum Code fügte seine eigene [Wallet](/de/glossary/wallet/)-Adresse in das Auktions-Frontend ein, pushte die Änderung und ließ die Deployment-Pipeline das Übrige tun. Als eine einzelne NFT-[Auktion](/de/glossary/auction/) abgerechnet wurde, flossen rund **864,8 ETH — etwa 3 Millionen US-Dollar** — nicht an das Projekt, das den Verkauf abwickelte, sondern an den Entwickler, der stillschweigend umgeschrieben hatte, wohin das Geld gehen sollte.

Kein Exploit. Kein Zero-Day. Nur eine Codezeile, die niemand doppelt geprüft hatte, signiert von jemandem, der eigentlich zum Team gehören sollte.

Dies ist Domain Mayday EP15. Es ist eine Geschichte über Smart Contracts nur an den Rändern. Im Kern ist es eine Geschichte über den Teil des Webs, den die meisten Menschen nie prüfen: die Code-Lieferkette, das Frontend und die unbequeme Tatsache, dass „Wer darf das ändern?" eine genauso ernsthafte Sicherheitsfrage ist wie „Wer hält die Schlüssel?"

## Das Vertrauen, das man in Launchpad-Code setzt

Ein [DeFi](/de/glossary/defi/)-Launchpad wie MISO — Minimal Initial SushiSwap Offering — existiert, um eine Sache gut zu tun: Geld von einer Menge Fremder entgegenzunehmen und es an ein Projekt weiterzuleiten, das einen Token- oder NFT-Verkauf durchführt. Dazu verknüpft es geprüfte Smart Contracts [on-chain](/de/glossary/on-chain/) mit einem Web-Frontend off-chain. Benutzer interagieren mit dem Frontend. Das Frontend teilt ihrer Wallet mit, welche Transaktion sie unterzeichnen sollen.

Diese Nahtstelle ist die weiche Flanke. Menschen sind besessen von der Smart-Contract-Schicht, weil dort Audits, Bug-Bounties und Schlagzeilen zu finden sind. Aber das Frontend — das JavaScript, das entscheidet, *an welche Adresse* eine Auktion auszahlt — ist nur Code in einem Repository, der von einer Pipeline deployed wird und von jedem bearbeitet werden kann, der Schreibzugang hat. Man kann den Tresor so gut man will prüfen; wenn ein Insider das Schild ändern kann, auf dem steht „Geld hier einzahlen", spielt der Tresor keine Rolle mehr.

MISOs Code war offen und kollaborativ, wie es bei Krypto-Infrastruktur typisch ist. Diese Offenheit ist ein Feature: Sie lädt Mitwirkende ein, beschleunigt die Entwicklung und ermöglicht einem kleinen Kernteam, weit über seine Gewichtklasse hinauszuschlagen. Sie ist auch genau die Angriffsfläche, die ein Supply-Chain-Angreifer benötigt. Man muss nicht einbrechen, wenn man einfach eingeladen werden kann, beizutragen.

## September 2021: der bösartige Commit

![Lebhafte, farbenfrohe Konzeptkunst eines einzigen manipulierten Ziegels, der rot glüht und von einer anonymen, behandschuhten Hand still gegen eine ansonsten saubere Open-Source-Ziegelmauer ausgetauscht wird](../../assets/the-sushiswap-miso-insider-attack-01-attack.jpg)

Am Freitag, dem 17. September 2021, trat der damalige Chief Technology Officer von SushiSwap, Joseph Delong, auf Twitter auf, um zu erklären, was passiert war. CoinDesks Bericht ist unmissverständlich: Delong sagte, dass [ein anonymer Auftragnehmer unter dem Github-Handle „AristoK3" bösartigen Code in MISOs Frontend bei einem Supply-Chain-Angriff eingeschleust hatte](https://www.coindesk.com/business/2021/09/17/3m-in-ether-stolen-from-sushiswaps-miso-launchpad#:~:text=an%20anonymous%20contractor%20using%20the%20Github%20handle).

Die Mechanik war fast beleidigend einfach. Wie Delong es beschrieb, hatte der Angreifer [die Wallet-Adresse der Auktion durch seine eigene ersetzt](https://www.coindesk.com/business/2021/09/17/3m-in-ether-stolen-from-sushiswaps-miso-launchpad#:~:text=replaced%20the%20auction%27s%20wallet%20address%20with%20their%20own). PYMNTS fasste die Tat treffend in Supply-Chain-Begriffen zusammen: Der Auftragnehmer [pushte einen bösartigen Code-Commit, der über das Frontend der Plattform verteilt wurde](https://www.pymnts.com/news/security-and-risk/2021/sushiswap-crypto-platform-victimized-by-3m-hack/#:~:text=pushed%20a%20malicious%20code%20commit%20that%20was%20distributed%20on%20the%20platform%27s%20front%20end).

Ein Post-Mortem-Bericht zu dem Vorfall fasst das Wesentliche in einem Satz zusammen: Ein Entwickler, der für die Arbeit an der Auktion unter Vertrag genommen worden war, [fügte seine eigene Wallet-Adresse in den Contract ein, anstatt auctionWallet zu verwenden](https://www.quadrigainitiative.com/casestudy/sushiswapmisojaypegsautomart.php#:~:text=inserted%20his%20own%20wallet%20address%20into%20the%20contract%20instead%20of%20the) — indem er den Wert änderte, den das Frontend zur Deploy-Zeit einspeiste, ohne die geprüfte On-Chain-Logik selbst zu brechen. Eine einzige Variable. `auctionWallet` sollte auf das Projekt zeigen, das den Verkauf durchführte. Stattdessen zeigte sie auf den Auftragnehmer. Jeder Dollar, den ein Bieter glaubte, an den Begünstigten der Auktion zu senden, ging woanders hin, und der Code sah dabei vollkommen normal aus.

## Was umgeleitet wurde: ~864,8 ETH, ~3 Millionen US-Dollar

Das Ziel war eine einzelne, fast komische Auktion. Wie CryptoSlate berichtete, erlitt MISO einen Supply-Chain-Angriff, bei dem [864,8 ETH aus dem Token-Auktionsvertrag von „Jay Pegs Auto Mart" abgezogen wurden](https://cryptoslate.com/hacker-returns-865-eth-stolen-from-sushis-token-launch-platform-miso/#:~:text=drained%20864.8%20ETH%20from%20the). Jay Pegs Auto Mart war ein NFT-Kunstprojekt, das sich als Gebrauchtwagenhändler inszenierte — verspieltes Krypto-Kultur-Ambiente über dem, was finanziell gesehen ein sehr realer Token-Verkauf war.

Die Zahlen stimmten bei allen Medien überein. PYMNTS berichtete, dass [der Hacker 864,8 Ethereum-Coins — rund 3 Millionen US-Dollar — in seine Wallet übertragen hatte](https://www.pymnts.com/news/security-and-risk/2021/sushiswap-crypto-platform-victimized-by-3m-hack/#:~:text=transferred%20864.8%20Ethereum%20coins). The Crypto Times bestätigte, dass der Angreifer [864,8 ETH abgezogen hatte](https://www.cryptotimes.io/2021/09/17/sushiswaps-miso-launchpad-loses-3-million-in-an-attack/#:~:text=drained%20864.8%20ETH), und dass [das einzige Auktionsprojekt, das bis dahin gehackt und ausgenutzt wurde, Jay Pegs Auto Mart war](https://www.cryptotimes.io/2021/09/17/sushiswaps-miso-launchpad-loses-3-million-in-an-attack/#:~:text=The%20only%20auction%20project%20that%20has%20been%20hacked%20and%20exploited).

Dieses letzte Detail ist wichtig. Der vergiftete Code wurde über das Frontend verteilt, was bedeutet, dass er im Prinzip *jede* Auktion hätte umleiten können, die er berührte. In der Praxis wurde nur Jay Pegs Auto Mart an die Adresse des Angreifers abgerechnet, bevor das Team es bemerkte. Die anderen betroffenen Auktionen wurden gepatcht, bevor sie geleert werden konnten — ein paar Stunden Unterschied zwischen einer einzelnen schlechten Schlagzeile und einer Katastrophe.

## Wie es passierte: Insider-Vertrauen, kein aufgebrochenes Schloss

![Lebhafte, farbenfrohe Konzeptkunst eines Insiders im Schatten, der still ein glühendes Geldrohr so dreht, dass der Fluss statt in den vorgesehenen Tank in einen privaten Eimer läuft](../../assets/the-sushiswap-miso-insider-attack-02-malicious-commit.jpg)

Streift man das Krypto-Vokabular ab, ist dies ein klassischer Software-Supply-Chain-Angriff — dieselbe Kategorie wie ein vergiftetes npm-Paket oder ein manipulierter Build-Server, nur dass die Auszahlung in ETH denominiert ist.

Die Vertrauenskette sah so aus: Einem Mitwirkenden wurde Schreibzugang zu dem Code gegeben, der Live-Auktionen betrieb. Er nutzte diesen Zugang, um eine Änderung zu committen, die die Zieladresse austauschte. Die Deployment-Pipeline tat das, was Pipelines tun — sie nahm den neuesten Code und lieferte ihn an das Frontend, das echte Benutzer in ihren Browsern luden. Diese Benutzer verbanden ihre Wallets, unterzeichneten, was das Frontend ihnen sagte zu unterzeichnen, und finanzierten eine Auktion, deren Begünstigter still umgeschrieben worden war. Coinspeakers Bericht stimmt mit den anderen überein: [ein anonymer Auftragnehmer mit dem GH-Handle AristoK3 schleuste bösartigen Code in das Miso-Frontend ein](https://www.coinspeaker.com/sushiswap-miso-attack-nft/#:~:text=an%20anonymous%20contractor%20with%20the%20GH%20handle%20AristoK3%20injected%20malicious%20code%20into%20the%20Miso%20front%20end).

Man beachte, was *nicht* erforderlich war. Der Angreifer musste keinen Fehler in einem Smart Contract finden. Er musste keinen Schlüssel stehlen oder einen Server von außen kompromittieren. Er brauchte genau eine Sache: genug Vertrauen, um den Code zu ändern. Die Einschätzung im Vorfallsbericht ist präzise — [das Miso-Frontend ist zum Opfer eines Supply-Chain-Angriffs geworden](https://www.quadrigainitiative.com/casestudy/sushiswapmisojaypegsautomart.php#:~:text=The%20Miso%20front%20end%20has%20become%20the%20victim%20of%20a%20supply%20chain%20attack) — durchgeführt von einem anonymen Auftragnehmer mit dem GitHub-Handle AristoK3, der [bösartigen Code in das Miso-Frontend eingeschleust hatte](https://www.quadrigainitiative.com/casestudy/sushiswapmisojaypegsautomart.php#:~:text=injected%20malicious%20code%20into%20the%20Miso%20front%20end).

Das macht Insider-Supply-Chain-Angriffe so gefährlich. Jede externe Verteidigung — Firewalls, Audits, Multisigs auf der Treasury — setzt voraus, dass die Bedrohung von außen kommt und versucht hereinzukommen. Ein Insider mit Commit-Rechten ist bereits an all dem vorbeigekommen. Die bösartige Änderung ritt auf dem eigenen vertrauenswürdigen, legitimen Deployment-Prozess des Projekts direkt in die Produktion. Die Pipeline wurde nicht unterwandert. Sie wurde *benutzt*.

## Reaktion und Wiederherstellung: erwischt, benannt und rückerstattet

SushiSwaps Reaktion war schnell, öffentlich und konfrontativ. Delong untersuchte nicht stillschweigend; er nannte den GitHub-Handle, nannte eine vermutete echte Identität und setzte eine Frist. Laut CoinDesk war die Warnung explizit: Wenn die Gelder nicht zurückgegeben würden, würde die DeFi-Börse [eine Beschwerde beim FBI einreichen](https://www.coindesk.com/business/2021/09/17/3m-in-ether-stolen-from-sushiswaps-miso-launchpad#:~:text=file%20a%20complaint%20with%20the%20FBI).

Es wirkte. Der Angreifer machte kehrt. CryptoSlate berichtete, dass nur ein paar Stunden nachdem das Team an die Öffentlichkeit gegangen war, [der Hacker 865 ETH an den ursprünglichen MISO-Contract zurückgegeben hatte](https://cryptoslate.com/hacker-returns-865-eth-stolen-from-sushis-token-launch-platform-miso/#:~:text=the%20hacker%20returned%20865%20ETH%20to%20the%20original%20MISO%20contract) — geringfügig *mehr* als die 864,8 ETH, die abgeflossen waren. The Crypto Times bestätigte das Ziel: [die Multisign-Adresse von Sushiswap erhielt 865 ETH zurück](https://www.cryptotimes.io/2021/09/17/sushiswaps-miso-launchpad-loses-3-million-in-an-attack/#:~:text=the%20multisign%20address%20of%20Sushiswap%20got%20865%20ETH%20back). Delongs eigenes Statusupdate war so knapp wie die ursprüngliche Drohung. Decrypt hält seine Bestätigung fest, dass innerhalb von etwa einem Tag [alle Gelder zurückgegeben wurden](https://decrypt.co/81120/sushiswaps-token-launchpad-hacked-over-3m-ethereum#:~:text=All%20funds%20returned).

Das glückliche Ende verdient ein Sternchen. Das Geld kam zurück, nicht weil die Architektur den Diebstahl abfing, sondern weil der Angreifer es unter dem grellen Licht öffentlicher Bloßstellung und einer glaubwürdigen Strafverfolgungsdrohung zurückzugeben entschied. Pseudonymität auf einem öffentlichen Ledger ist ein zweischneidiges Schwert: Sie ermöglichte dem Auftragnehmer anonymes Handeln, bedeutete aber auch, dass die On-Chain-Spur der umgeleiteten Gelder für jeden sichtbar war — genau der Hebel, der die Rückgabe des Geldes zum Weg des geringsten Widerstands machte. Die Wiederherstellung hier war eine Verhandlung, keine Garantie. Der nächste Insider zuckt vielleicht nicht einmal mit der Wimper.

## Was das über Code-Lieferketten und Frontend-Vertrauen lehrt

Der MISO-Vorfall ist nach DeFi-Maßstäben klein in Dollar und groß an Lektionen. Ein paar, die es wert sind, mitgenommen zu werden:

1. **Das Frontend ist Teil Ihres Sicherheitsperimeters.** Benutzer unterzeichnen, was ihnen das Interface sagt. Wenn ein Angreifer kontrolliert, welche Adresse das Interface anzeigt, braucht er den Smart Contract überhaupt nicht. Nur den On-Chain-Code zu prüfen, prüft nur die Hälfte des Systems.
2. **Schreibzugang ist die eigentliche Angriffsfläche.** Die stärkste Kryptographie der Welt hilft nicht, wenn die Person, die den Code bearbeiten kann, sich dazu entschließt. „Wer kann das ändern, und wer überprüft es, bevor es ausgeliefert wird?" ist eine Sicherheitskontrolle, kein Prozessdetail.
3. **Obligatorisches Code-Review ist keine Bürokratie — es ist Verteidigung.** Ein einziges erforderliches zweites Augenpaar auf dem Commit, der `auctionWallet` austauschte, hätte dies wahrscheinlich sofort gestoppt. Supply-Chain-Angriffe gedeihen auf Änderungen, die niemand unabhängig prüft, bevor sie deployed werden.
4. **Pseudonyme Mitwirkende erhöhen den Einsatz.** Offene Mitarbeit ist eine Stärke, aber das Gewähren von deployment-beeinflussenden Zugriffsrechten an eine anonyme Identität bedeutet, Code zu vertrauen, den man nicht vollständig zuordnen kann. Vertrauen sollte mit Verifizierung skalieren, nicht mit Begeisterung.
5. **Wiederherstellung ist Glück, keine Architektur.** Die Gelder wurden aufgrund von öffentlichem Druck und einem nachverfolgbaren Ledger zurückgegeben. Ein System zu entwerfen, das *auf den guten Willen des Angreifers angewiesen ist*, ist überhaupt kein Sicherheitsdesign.

Der rote Faden: Die Integrität von *wer eine Änderung vornehmen darf* und *die Verifizierung, dass die geshipte Änderung die beabsichtigte ist*, ist genauso tragend wie jeder kryptografische Schlüssel. Supply-Chain-Vertrauen ist kein weiches, kulturelles Anliegen. Es ist die harte Kante des Systems.

## Der Namefi-Aspekt

![Farbenfrohe Illustration von verifizierbarem, manipulationssicherem Eigentum — gesichert durch ein grünes Schild, einen grünen Namefi-Token und Kontinuität](../../assets/the-sushiswap-miso-insider-attack-03-namefi-angle.jpg)

MISO verlor Geld, weil das *Ziel des Werts* von jemandem, dem das System vertraute, still umgeschrieben werden konnte, und niemand die Änderung prüfte, bevor sie live ging. Dieses Fehlermuster ist nicht einzigartig für DeFi-Launchpads. Es hat dieselbe Form wie eine Domain, deren Eigentum oder DNS-Einträge von jedem, der zufällig den richtigen Zugang hat, still geändert werden können — ein [Registrar](/de/glossary/registrar/)-Konto, ein internes Panel, ein Auftragnehmer mit Zugangsdaten.

Eine Domain ist eine der folgenreichsten „Ziel"-Einstellungen im Internet. Ihre DNS-Einträge bestimmen, wohin Ihr Traffic, Ihre E-Mail und Ihre Benutzer tatsächlich gehen. Wenn diese von einem Insider oder einem kompromittierten Konto geändert werden können, ohne einen manipulationssicheren, unabhängig verifizierbaren Nachweis darüber zu hinterlassen, wer was geändert hat, haben Sie das MISO-Problem in anderen Kleidern: Das Schloss ist in Ordnung, aber das Schild an der Tür kann ausgetauscht werden.

[Namefi](https://namefi.io) begegnet dem, indem es [Domain-Eigentum](/de/glossary/domain-ownership/) als verifizierbares, manipulationssicheres Asset behandelt, anstatt als Eintrag in einem privaten Konto. Tokenisiertes Eigentum macht die Kontrolle on-chain prüfbar und übertragbar, während es mit DNS kompatibel bleibt — sodass „Wer besitzt das und wer darf es ändern?" eine Tatsache wird, die man verifizieren kann, statt ein Vertrauen, das man blind entgegenbringen muss. Der MISO-Auftragnehmer konnte eine Auszahlungsadresse genau deshalb umschreiben, weil das System keine erzwungene, unabhängig prüfbare Antwort auf die Frage hatte: „Ist diese Änderung autorisiert?" Die Lektion, die Namefi aus Supply-Chain-Angriffen zieht, ist, dass Eigentum und Kontrolle von vornherein beweisbar sein sollten, sodass die gefährliche Lücke zwischen *vertraut* und *verifiziert* gar nicht erst entsteht.

## Quellen und weiterführende Lektüre

- CoinDesk — [$3M in Ether Stolen From SushiSwap's MISO Launchpad](https://www.coindesk.com/business/2021/09/17/3m-in-ether-stolen-from-sushiswaps-miso-launchpad)
- Decrypt — [SushiSwap's Token Launchpad Hacked for Over $3M in Ethereum](https://decrypt.co/81120/sushiswaps-token-launchpad-hacked-over-3m-ethereum)
- CryptoSlate — [Hacker returns 865 ETH stolen from Sushi's token launch platform MISO](https://cryptoslate.com/hacker-returns-865-eth-stolen-from-sushis-token-launch-platform-miso/)
- PYMNTS — [SushiSwap Crypto Platform Victimized by $3M Hack](https://www.pymnts.com/news/security-and-risk/2021/sushiswap-crypto-platform-victimized-by-3m-hack/)
- The Crypto Times — [Sushiswap's Miso Launchpad Loses $3 Million In An Attack](https://www.cryptotimes.io/2021/09/17/sushiswaps-miso-launchpad-loses-3-million-in-an-attack/)
- Coinspeaker — [SushiSwap Launchpad Miso Suffers Attack with 864.8 ETH NFT Project Fund Carted Away](https://www.coinspeaker.com/sushiswap-miso-attack-nft/)
- CryptoBriefing — [Sushi's Initial Offering Launchpad Suffers $3M Exploit](https://cryptobriefing.com/sushiswaps-miso-token-launchpad-suffers-3m-exploit/)
- CryptoPotato — [Another DeFi Hack: $3M in ETH Stolen From SushiSwap's Token Platform](https://cryptopotato.com/another-defi-hack-3m-in-eth-stolen-from-sushiswaps-token-platform/)
- Quadriga Initiative — [SushiSwap MISO Jaypegs Automart case study](https://www.quadrigainitiative.com/casestudy/sushiswapmisojaypegsautomart.php)
