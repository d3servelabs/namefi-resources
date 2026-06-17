---
title: "Der BadgerDAO-Front-End-Angriff: 120 Mio. $ durch ein einziges injiziertes Skript abgeflossen"
date: '2026-06-17'
language: de
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: "Im Dezember 2021 kompromittierten Angreifer das Cloudflare-Konto von BadgerDAO und injizierten ein bösartiges Skript in das Website-Front-End. Die geprüften Smart Contracts wurden nie angetastet – und doch verschwanden rund 120 Millionen Dollar durch Wallet-Freigaben, die Benutzer unwissentlich unterzeichneten. Eine tiefgehende Analyse, warum die Website Teil Ihrer Sicherheitsarchitektur ist."
keywords: ['badgerdao hack', 'badgerdao front-end angriff', 'cloudflare api key kompromittierung', 'injected script angriff', 'web3 front-end sicherheit', 'ice phishing', 'increaseAllowance angriff', 'token approval exploit', 'dns und domain sicherheit', 'cloudflare workers exploit', 'defi sicherheit', 'supply chain angriff web3', 'website manipulation', 'domain sicherheit']
---

Das Audit war sauber. Die Verträge waren in Ordnung. Das Geld verschwand trotzdem.

In den Tagen um den 2. Dezember 2021 verlor BadgerDAO – ein DeFi-Projekt, das darauf abzielt, Bitcoin in die dezentrale Finanzwelt zu bringen – rund **120 Millionen Dollar** an Nutzergeldern. Es gab keinen Flash-Loan-Trick, keinen Reentrancy-Bug, keinen raffinierten mathematischen Exploit gegen die Vaults. Die Smart Contracts taten genau das, wofür sie geschrieben wurden. Der Angreifer musste sie nie knacken, weil er sie nie angegriffen hat.

Er griff die *Website* an.

Jemand hatte heimlich ein bösartiges Skript in das Front-End von app.badger.com eingeschleust. Für jeden Nutzer, der die Seite lud, sah sie aus wie dieselbe vertrauenswürdige dApp, die sie jeden Tag nutzten. Aber als sie damit interagieren wollten, bat die Seite ihr Wallet um eine zusätzliche, unsichtbare Berechtigung – und sobald sie auf „Genehmigen“ klickten, gehörten ihre Token nicht mehr ihnen.

Dies ist die Geschichte, wie ein Projekt mit geprüften Verträgen einen neunstelligen Betrag durch eine einzige injizierte Zeile Front-End-Code verlor und warum dies Ihre Denkweise über die Grenzen Ihrer Sicherheit dauerhaft verändern sollte.

## Die beruhigende Lüge: „Die Verträge sind geprüft“

Die Krypto-Kultur hat die Nutzer darauf trainiert, eine Frage zu stellen, bevor sie einem Protokoll vertrauen: *Wurde es geprüft (geauditet)?* Audits sind wichtig. Sie finden echte Fehler. Aber irgendwo auf dem Weg verhärtete sich „die Verträge sind geprüft“ zu einem Gefühl absoluter Sicherheit – als wäre ein sauberer Prüfbericht ein Kraftfeld um alles, was den Namen des Projekts trägt.

Das ist es nicht.

Ein Audit untersucht den On-Chain-Code: die Vaults, die Token-Logik, die Zugriffskontrollen. Es sagt nichts über den Laptop aus, an dem ein Entwickler eingeloggt blieb, über die DNS-Einträge, die Ihren Browser irgendwohin leiten, über das CDN, das vor der Seite sitzt, oder über das JavaScript, das Ihr Browser tatsächlich herunterlädt und ausführt, wenn Sie die dApp besuchen. Diese leben im *Web2* – in Cloud-Konten, API-Schlüsseln und der Domain-Infrastruktur – und sie sind genauso tragend wie der Solidity-Code.

BadgerDAO ist der deutlichste dokumentierte Beweis für diese Lücke. Wie eine technische Analyse des Vorfalls es unverblümt ausdrückte: [Aus der Perspektive der Smart Contracts des Projekts war nichts schiefgelaufen](https://www.halborn.com/blog/post/explained-the-badgerdao-hack-december-2021#:~:text=From%20the%20perspective%20of%20the%20project%27s%20smart%20contracts%2C%20nothing%20had%20gone%20wrong), und der Angreifer nutzte lediglich die von den Benutzern erteilten Genehmigungen. Die Blockchain verhielt sich einwandfrei. Die Website log.

## Der Angriff: Ein manipuliertes Schaufenster mit einer sauberen Quittung

![Lebhaftes, farbenfrohes Konzeptkunstwerk eines vertrauenswürdigen, freundlich aussehenden Schaufensters, dessen Kasse heimlich manipuliert wurde, wobei eine zusätzliche versteckte Schublade Münzen abzweigt, während die Kunden lächeln und ganz normal bezahlen](../../assets/the-badgerdao-frontend-attack-01-attack.jpg)

Stellen Sie sich vor, Sie betreten ein Geschäft, das Sie schon hundertmal besucht haben. Gleiches Schild, gleiches Personal, gleiche Theke. Sie kaufen eine Kleinigkeit, der Kassierer tippt es ein, Sie scannen Ihre Karte. Alles sieht nach Routine aus. Was Sie nicht sehen können, ist, dass jemand das Kartenlesegerät gegen eines ausgetauscht hat, das heimlich auch eine zweite, unbegrenzte Abbuchung von Ihrem Konto autorisiert – an einen Fremden, wann immer er will.

Das ist im Grunde das, was den Nutzern von BadgerDAO passiert ist.

Die Einordnung ist hier wichtig, denn sie macht diesen Vorfall so lehrreich. Wie *Vice* es zusammenfasste, [umfasste der Hack keine komplizierten Smart-Contract-Exploits. Stattdessen handelte es sich um einen Front-End-Angriff auf die Web-Infrastruktur von BadgerDAO](https://www.vice.com/en/article/hackers-steal-dollar119m-from-web3-crypto-project-with-old-school-attack/#:~:text=injected%20a%20malicious%20script%20into%20BadgerDAO%27s%20frontend) – insbesondere auf dessen Cloudflare-Konto. In ihrer Darstellung war es ein webbasierter Angriff der *alten Schule* auf ein Web3-Ziel.

Der Mechanismus war elegant und unauffällig. Das bösartige Skript forderte das Wallet des Benutzers auf, eine Berechtigung zum Ausgeben von Token an die Adresse des Angreifers zu erteilen. In den Worten von Vice [trickste das bösartige Skript die Leute im Grunde genommen aus, der Adresse die Rechte zu geben, die Token an die Adresse des Exploiters zu senden](https://www.vice.com/en/article/hackers-steal-dollar119m-from-web3-crypto-project-with-old-school-attack/#:~:text=The%20malicious%20script%20basically%20tricked%20people%20into%20giving). Der Benutzer dachte, er würde normalen dApp-Geschäften nachgehen. Dabei gab er durch seine Signatur die Schlüssel zu seinen Token aus der Hand.

Sicherheitsforscher nennen dieses Muster *Ice Phishing*: Anstatt Ihren privaten Schlüssel zu stehlen, werden Sie dazu verleitet, freiwillig einem bösartigen Empfänger eine Ausgabegenehmigung zu erteilen. Die Signatur ist echt. Die Genehmigung ist echt. Die On-Chain-Transaktion ist gültig. Genau deshalb ist es so gefährlich – und deshalb hätte kein Contract-Audit dies verhindern können.

## Was die Nutzer verloren: ~120 Millionen Dollar, Signatur für Signatur

Die Zahlen sind erschütternd für einen Angriff, der keine einzige Zeile des Vault-Codes berührte.

Das Smart-Contract-Audit-Unternehmen PeckShield [schätzte die Gesamtverluste auf rund 120 Millionen Dollar](https://cryptobriefing.com/120m-lost-badgerdao-defi-hack/). BadgerDAOs eigene Post-Mortem-Abrechnung, die in Fallstudien zu dem Vorfall reproduziert wurde, bezifferte den Verlust auf [etwa 2076,54 BTC (~116,3 Mio. USD zum Zeitpunkt des Hacks)](https://www.quadrigainitiative.com/casestudy/badgerdaomaliciouscodeinjected.php#:~:text=2076.54%20BTC), nachdem alle gestohlenen Vermögenswerte auf einen gemeinsamen Nenner umgerechnet wurden.

Der Schmerz war nicht gleichmäßig verteilt. Ein einziges Opfer – Berichten zufolge ein institutionelles Konto – verlor den Löwenanteil in einer einzigen Transaktion: Fallstudien halten fest, dass [etwa 900 BTC aus dem Yearn wBTC-Vault entfernt wurden](https://www.quadrigainitiative.com/casestudy/badgerdaomaliciouscodeinjected.php), wobei allein diese eine Partei [Wrapped Bitcoin im Wert von über 50 Millionen Dollar](https://www.quadrigainitiative.com/casestudy/badgerdaomaliciouscodeinjected.php#:~:text=lose%20over%20%2450%20million) verlor. Hunderte gewöhnlicher Nutzer machten den Rest aus.

Und das Ausmaß war eine direkte Folge von Geduld. Der Angreifer schlug nicht in Panik zu. Wie die Analyse von Forta beschreibt, [sammelte der Hacker stillschweigend Genehmigungen von fast 200 Konten und räumte dann am 2. Dezember 2021 um 00:48 Uhr die Wallets der Opfer in weniger als 10 Stunden leer](https://forta.org/blog/how-to-derail-a-120-million-dollar-hack#:~:text=The%20hacker%20silently%20accumulated%20approvals%20from%20almost%20200%20accounts). Die bösartigen Freigaben hatten sich tagelang heimlich angesammelt – eine geladene Falle, die auf einmal zuschnappte. Eine andere Rekonstruktion zählte [500 Wallets, die diese unbegrenzten Genehmigungen erteilten](https://www.halborn.com/blog/post/explained-the-badgerdao-hack-december-2021#:~:text=The%20attacker%20managed%20to%20get%20500%20wallets), über die gesamte Dauer der Kampagne.

Das grausamste Detail: Es gab nichts, was ein vorsichtiger Benutzer hätte überprüfen können. Die URL war korrekt. Das TLS-Zertifikat war gültig. Die Benutzeroberfläche war echt. Das Einzige, was nicht stimmte, war ein JavaScript-Snippet, das von der legitimen Website selbst ausgeliefert wurde.

## Wie es passierte: Ein Cloudflare-API-Schlüssel und eine injizierte Freigabe

![Lebhaftes, farbenfrohes Konzeptkunstwerk einer unsichtbaren Hand, die heimlich einen zusätzlichen leuchtenden Genehmigen-Button zu einem Wallet-Pop-up hinzufügt, während die eigentliche Benutzeroberfläche ruhig und vertrauenswürdig aussieht, wobei eine einzige bösartige Codezeile in eine freundliche Webseite schlüpft](../../assets/the-badgerdao-frontend-attack-02-injected-script.jpg)

Die Vordertür, die der Angreifer benutzte, war kein Smart Contract. Es war ein Cloud-Konto.

BadgerDAO saß, wie ein enormer Teil des modernen Webs, hinter Cloudflare – der Content-Delivery- und Edge-Compute-Schicht, die Websites ausliefert und beschleunigt. Die Kontrolle über dieses Konto bedeutete die Kontrolle darüber, welchen Code die Website von BadgerDAO an die Besucher auslieferte. Und der Angreifer erlangte diese Kontrolle durch einen gestohlenen Schlüssel.

In BadgerDAOs offizieller Darstellung, die von CoinDesk weitergegeben wurde, [nutzte der Hacker einen kompromittierten API-Schlüssel, der ohne das Wissen oder die Autorisierung der Badger-Ingenieure erstellt wurde, um regelmäßig den bösartigen Code einzuschleusen, der eine Teilmenge der Kunden betraf](https://www.coindesk.com/business/2021/12/10/badgerdao-reveals-details-of-how-it-was-hacked-for-120m). Diese Formulierung – *eine Teilmenge seiner Kunden* – ist ein Teil des Grundes, warum der Angriff so lange unentdeckt blieb. Das Skript wurde nicht bei jedem und nicht jedes Mal ausgelöst. Es rotierte rein und raus, betraf nur einige Benutzer und machte das bösartige Verhalten extrem schwer zu reproduzieren oder überhaupt zu bemerken.

Wie konnte ein unautorisierter API-Schlüssel überhaupt existieren? Die Ursache ging auf eine Schwachstelle im Cloudflare-Konto zurück. Fallstudien zu dem Vorfall stellen fest, dass unautorisierte Benutzer in der Lage waren, Konten zu erstellen und auch (globale) API-Schlüssel zu erstellen und anzuzeigen (die nicht gelöscht oder deaktiviert werden können), [bevor die E-Mail-Verifizierung abgeschlossen war](https://www.quadrigainitiative.com/casestudy/badgerdaomaliciouscodeinjected.php#:~:text=before%20email%20verification%20was%20completed). Ein Angreifer konnte einen Schlüssel für ein Konto hinterlegen und dann einfach darauf warten, dass der eigentliche Eigentümer die Verifizierung abschloss und das Konto aktivierte – zu diesem Zeitpunkt verfügte der Angreifer stillschweigend über einen gültigen API-Zugang.

Mit diesem Schlüssel nutzte der Angreifer Cloudflare Workers – die Edge-Compute-Plattform von Cloudflare – um die Seite auf dem Weg zum Benutzer umzuschreiben. Die Post-Mortem-Analyse von BadgerDAO, die mit dem Cybersicherheitsunternehmen Mandiant erstellt wurde, kam zu dem Schluss, dass der Phishing-Vorfall vom 2. Dezember das Ergebnis eines bösartig eingefügten Snippets war, das von Cloudflare Workers bereitgestellt wurde. Der injizierte Code tat genau eine Sache, die von Bedeutung war: Er fügte eine zusätzliche Token-Genehmigungsanforderung (Approval) in den normalen Ablauf der dApp ein.

Es war sogar bewusst gewählt, *welchen* Genehmigungsaufruf er verwendete. CryptoBriefing berichtete, dass [der Hacker angeblich ein bösartiges Skript auf Badgers Website eingefügt hat, das den Benutzern eine Transaktion zur Erhöhung der Freigabe („increase allowance“) präsentierte](https://cryptobriefing.com/120m-lost-badgerdao-defi-hack/#:~:text=presented%20users%20with%20a%20transaction%20to). Diese Wahl war kein Zufall. Im Vergleich zu einem einfachen `approve`-Aufruf wird ein `increaseAllowance`-Prompt in Wallet-Pop-ups meist mit schwächeren, weniger alarmierenden visuellen Hinweisen dargestellt – weniger rote Flaggen, weniger Warnung im Sinne von „Sie sind im Begriff, Ausgabemacht zu gewähren“. Der Angreifer optimierte das *Benutzererlebnis* des Ausgeraubtwerdens.

Die gesamte Kette sah also wie folgt aus: Eine Schwachstelle bei der Kontoverifizierung von Cloudflare ließ einen unautorisierten API-Schlüssel existieren → der Angreifer nutzte diesen Schlüssel, um einen Worker bereitzustellen → der Worker injizierte ein Skript in app.badger.com → das Skript bat die Wallets um eine Token-Freigabe für den Angreifer → die Benutzer stimmten zu → der Angreifer räumte ihre Konten leer. Kein einziger Schritt davon berührte die geprüften Smart Contracts.

## Die Reaktion: Das Pausieren der Chain, um eine Web2-Wunde zu stoppen

Als die Entleerungstransaktionen in den frühen Morgenstunden des 2. Dezembers im großen Stil auftraten, war der On-Chain-Fußabdruck schließlich nicht mehr zu übersehen, und BadgerDAO handelte schnell – sie nutzten ihre Smart Contracts, um ein Problem zu stoppen, das vollständig Off-Chain seinen Ursprung hatte.

Das Team räumte den Vorfall öffentlich ein und bestätigte laut CryptoBriefing, dass [alle Smart Contracts pausiert wurden, um weitere Abhebungen zu verhindern](https://cryptobriefing.com/120m-lost-badgerdao-defi-hack/). Da Badgers Vaults über eine Pausenfunktion verfügten, wurde dem Angreifer durch das Einfrieren von Transfers die Möglichkeit genommen, weiterhin frisch genehmigte Gelder zu verschieben. Ein technischer Bericht beschreibt den Stopp so, dass das Team von seiner Befugnis Gebrauch machte, alle Aufrufe der Funktion `transferFrom` einzufrieren – genau der ERC-20-Mechanismus, den die bösartigen Genehmigungen ausnutzten. Diese Pause ist auch der Grund, warum ein bedeutender Teil des Verlusts theoretisch wiederherstellbar war: Einige Vermögenswerte waren vom Angreifer bereits verschoben, aber noch nicht vollständig aus den Vaults von Badger abgehoben worden, bevor der Freeze einsetzte.

Auf der Infrastrukturseite bestand die Bereinigung aus der düsteren Web2-Checkliste einer Kompromittierung von Zugangsdaten: Cloudflare-API-Schlüssel rotieren, das Kontopasswort ändern, die Multi-Faktor-Authentifizierung härten und jeden Schlüssel prüfen, der gar nicht hätte existieren dürfen. BadgerDAO arbeitete dann mit Mandiant zusammen, um den Vorfall zu untersuchen und ein technisches Post-Mortem zu veröffentlichen, das den Zeitplan rekonstruierte – die Schwachstellen des Cloudflare-Kontos, die in den Vormonaten erstellten unbefugten Schlüssel, die Skript-Injektion im November und die Entleerung im Dezember.

Aber keine noch so gute Reaktion auf den Vorfall konnte die Genehmigungen, die die Nutzer bereits erteilt hatten, rückgängig machen. Die Signaturen waren gültig. Die Behebungsmaßnahmen konnten *zukünftige* Diebstähle stoppen und die Rückgewinnung vorantreiben; sie konnten jedoch die bereits On-Chain erteilte Zustimmung nicht widerrufen.

## Was uns das lehrt: Die Website ist Teil Ihrer Angriffsfläche

Die wichtigste Lektion aus dem Fall BadgerDAO ist eine Korrektur der Grenzen. Die meisten Teams – und die meisten Nutzer – ziehen den Sicherheitsperimeter um die Smart Contracts. BadgerDAO beweist, dass dieser Perimeter viel größer ist.

**1. Ihr Front-End ist Teil der Sicherheit. Immer.** Der Code, den der Browser eines Benutzers ausführt, ist Teil Ihres Protokolls, unabhängig davon, ob er On-Chain existiert oder nicht. Wenn ein Angreifer kontrolliert, welches JavaScript Ihre Website ausliefert, kontrolliert er die Wallets Ihrer Benutzer – geprüfte Verträge hin oder her. Die Website ist nicht „nur die Benutzeroberfläche“. Sie ist der Ort, an dem die Zustimmung (Consent) eingeholt wird.

**2. Ihre Cloud- und Domain-Infrastruktur sind Teil des Vertrags.** Ein Cloudflare-Konto, ein DNS-Anbieter-Login, ein Registrar-Konto, ein CI/CD-Schlüssel – jedes davon ist ein Weg, um das umzuschreiben, was Ihre Benutzer sehen. BadgerDAO wurde nicht am Vault geknackt; es wurde bei dem *Konto geknackt, das die Website kontrollierte*. Behandeln Sie diese Zugangsdaten mit derselben Paranoia, die Sie für einen privaten Deployer-Schlüssel reservieren.

**3. API-Schlüssel und Kontoerstellungsprozesse sind eine echte Angriffsfläche.** Das ganze Desaster hing von einem unbefugten API-Schlüssel ab, der niemals hätte existieren dürfen, ermöglicht durch eine Lücke bei der Verifizierung. Inventarisieren Sie jeden Schlüssel. Schränken Sie deren Berechtigungen stark ein. Rotieren Sie sie. Richten Sie Warnmeldungen für neue ein. Ein Schlüssel, den Sie vergessen haben, ist ein Schlüssel, den ein Angreifer nutzen kann.

**4. „Geprüft“ (Audited) ist notwendig, aber nicht ausreichend.** Ein sauberes Audit hat einen echten Wert und Sie sollten auf jeden Fall eines durchführen lassen. Aber es deckt die Smart Contracts ab, nicht das Cloud-Konto, das DNS, das CDN oder die Front-End-Build-Pipeline. Sicherheit umfasst den gesamten Weg vom Browser eines Benutzers bis zu Ihrer Chain – und das schwächste Glied, nicht das stärkste, setzt den Maßstab.

**5. Benutzer können sich nicht durch Überprüfung aus einem manipulierten Front-End retten.** „Überprüfen Sie immer die URL“ ist ein guter Rat, der hier jedoch nichts gebracht hätte. Die URL war richtig. Die Lektion für Benutzer ist härter: Seien Sie zutiefst misstrauisch gegenüber Approval- und `increaseAllowance`-Aufforderungen, bevorzugen Sie Wallets und Tools, die Token-Genehmigungen entschlüsseln und davor warnen, und widerrufen Sie veraltete Freigaben (Allowances) regelmäßig. Das, was Sie genehmigen, ist wichtiger als die Seite, auf der Sie sich befinden.

## Die Namefi-Perspektive

![Farbenfrohe Illustration von verifizierbarem, manipulationssicherem Domain- und Web-Eigentum – gesichert durch ein grünes Schild, einen grünen Namefi-Token und DNS-Kontinuität](../../assets/the-badgerdao-frontend-attack-03-namefi-angle.jpg)

Bricht man BadgerDAO auf das Wesentliche herunter, handelt es sich um ein **Eigentums- und Kontrollproblem**. Dem Angreifer gehörte die Website von BadgerDAO nicht – aber wochenlang konnte er ändern, was sie auslieferte. Die Leute, denen das Projekt *tatsächlich* gehörte, hatten keine zuverlässige, manipulationssichere Möglichkeit, um zu wissen, dass die Kontrollkette über ihre Webpräsenz – Konten, Schlüssel, Edge-Konfiguration, DNS – stillschweigend kompromittiert worden war.

Genau das ist die Lücke, um die sich [Namefi](https://namefi.io) kümmert. Namefi behandelt Domains und Web-Eigentum als erstklassige, internetnative Vermögenswerte: eine Kontrolle, die verifizierbar, auditierbar und schwerer heimlich zu kapern ist, während sie gleichzeitig mit DNS kompatibel bleibt. Die Front-End-Angriffsfläche – wer den Namen kontrolliert, wohin er aufgelöst wird, welche Infrastruktur dahintersteckt – ist kein bloßer nachträglicher Einfall zu den Smart Contracts. Wie BadgerDAO auf die denkbar teuerste Art und Weise gezeigt hat, *ist* dies ein Teil des Sicherheitsmodells.

Sie können Ihre Verträge prüfen lassen, bis sie fehlerfrei sind. Aber wenn ein unautorisierter Schlüssel Ihre Website umschreiben und ein injiziertes Skript die Zustimmungen Ihrer Nutzer abgreifen kann, war das Audit nie die ganze Geschichte. Die Domain, das DNS und die Web-Infrastruktur, die Ihre Anwendung an echte Menschen ausliefern, sind Teil Ihrer Sicherheitsumgebung. Behandeln Sie sie auch so – denn Angreifer tun dies bereits.

## Quellen und weiterführende Literatur

- CoinDesk — [BadgerDAO Reveals Details of How It Was Hacked for $120M](https://www.coindesk.com/business/2021/12/10/badgerdao-reveals-details-of-how-it-was-hacked-for-120m)
- Vice (Motherboard) — [Hackers Steal $119M From 'Web3' Crypto Project With Old School Attack](https://www.vice.com/en/article/hackers-steal-dollar119m-from-web3-crypto-project-with-old-school-attack/)
- Halborn — [Explained: The BadgerDAO Hack (December 2021)](https://www.halborn.com/blog/post/explained-the-badgerdao-hack-december-2021)
- Forta — [How to Derail a 120-Million-Dollar Hack](https://forta.org/blog/how-to-derail-a-120-million-dollar-hack)
- CryptoBriefing — [$120M Lost in BadgerDAO DeFi Hack](https://cryptobriefing.com/120m-lost-badgerdao-defi-hack/)
- Quadriga Initiative — [Dec 2021 — BadgerDAO Malicious Code Injected — $116.3m](https://www.quadrigainitiative.com/casestudy/badgerdaomaliciouscodeinjected.php)
- Chainalysis — [Behind The Scenes of The BadgerDAO Hack](https://www.chainalysis.com/blog/chainalysis-podcast-episode-6-badgerdao-hack/)
- BadgerDAO / Mandiant — [BadgerDAO Exploit Technical Post Mortem](https://www.badger.tools/technical-post-mortem)