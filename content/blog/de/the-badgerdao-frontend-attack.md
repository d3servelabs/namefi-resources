---
title: 'Der BadgerDAO-Frontend-Angriff: 120 Millionen Dollar durch ein eingeschleustes Skript abgezogen'
date: '2026-06-17'
language: de
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['aileen-wright']
editors: ['victor-zhou']
draft: false
description: 'Im Dezember 2021 kompromittierten Angreifer das Cloudflare-Konto von BadgerDAO und schleusten ein bösartiges Skript in das Website-Frontend ein. Die auditierten Smart Contracts wurden nie berührt — und dennoch verschwanden rund 120 Millionen Dollar durch Wallet-Freigaben, die Nutzer unwissentlich unterzeichneten. Eine Tiefenanalyse darüber, warum die Website Teil Ihrer Sicherheitsoberfläche ist.'
keywords: ['badgerdao hack', 'badgerdao frontend-angriff', 'cloudflare api-schlüssel kompromittierung', 'eingeschleustes skript angriff', 'web3 frontend-sicherheit', 'ice phishing', 'increaseAllowance angriff', 'token-freigabe exploit', 'dns und domain-sicherheit', 'cloudflare workers exploit', 'defi sicherheit', 'supply chain angriff web3', 'website-manipulation', 'domain-sicherheit']
relatedArticles:
  - /de/blog/the-curve-finance-dns-hijack/
  - /de/blog/the-sushiswap-miso-insider-attack/
  - /de/blog/the-godaddy-multi-year-breach/
  - /de/blog/the-2024-squarespace-defi-domain-hijacks/
  - /de/blog/the-fox-it-dns-hijack/
relatedTopics:
  - /de/topics/domain-security/
  - /de/topics/domain-tokenization/
relatedSeries:
  - /de/series/domain-apocalypse/
  - /de/series/name-change-game-change/
relatedGlossary:
  - /de/glossary/registrar/
  - /de/glossary/web3/
  - /de/glossary/dns/
  - /de/glossary/icann/
  - /de/glossary/tld/
---

Das Audit war sauber. Die Contracts waren in Ordnung. Das Geld verschwand trotzdem.

In den Tagen rund um den 2. Dezember 2021 verlor BadgerDAO — ein [DeFi](/de/glossary/defi/)-Projekt, das darauf ausgerichtet war, Bitcoin in die dezentrale Finanzwelt zu bringen — rund **120 Millionen Dollar** an Nutzervermögen. Es gab keinen Flash-Loan-Trick, keinen Reentrancy-Bug, keinen cleveren mathematischen Exploit gegen die Vaults. Die Smart Contracts taten genau das, wozu sie geschrieben worden waren. Der Angreifer musste sie nicht knacken, weil er sie gar nicht angriff.

Er griff die *Website* an.

Jemand hatte heimlich ein bösartiges Skript in das Frontend von app.badger.com eingeschleust. Für jeden Nutzer, der die Seite aufrief, sah sie genauso aus wie die vertraute dApp, die er täglich nutzte. Doch wenn sie mit ihr interagierten, forderte die Seite deren [Wallet](/de/glossary/wallet/) eine zusätzliche, unsichtbare Berechtigung ab — und sobald sie auf „Approve" klickten, gehörten ihre Token nicht mehr ihnen.

Dies ist die Geschichte davon, wie ein Projekt mit auditierten Contracts neunstellige Beträge durch eine einzige eingeschleuste Zeile Frontend-Code verlor — und warum das dauerhaft verändern sollte, wie Sie die Grenzen Ihrer Sicherheit betrachten.

## Die beruhigende Lüge: „Die Contracts sind auditiert"

Die Krypto-Kultur hat Nutzer trainiert, vor dem Vertrauen in ein Protokoll eine einzige Frage zu stellen: *Wurde es auditiert?* Audits sind wichtig. Sie entdecken echte Fehler. Aber irgendwann verhärtete sich „die Contracts sind auditiert" zu einem Gefühl totaler Sicherheit — als ob ein sauberer Auditbericht ein Schutzschild um alles wäre, was den Namen des Projekts trägt.

Das ist er nicht.

Ein Audit untersucht den [On-Chain](/de/glossary/on-chain/)-Code: die Vaults, die Token-Logik, die Zugriffskontrollen. Es sagt nichts über den Laptop aus, auf dem ein Entwickler eingeloggt blieb, über die [DNS](/de/glossary/dns/)-Einträge, die Ihren Browser irgendwohin leiten, über das CDN vor der Website oder über das JavaScript, das Ihr Browser tatsächlich herunterlädt und ausführt, wenn Sie die dApp besuchen. All das lebt in *Web2* — in Cloud-Konten, API-Schlüsseln und Domain-Infrastruktur — und ist genauso tragend wie das Solidity-Fundament.

BadgerDAO ist der deutlichste Beweis für diese Lücke. Wie eine technische Analyse des Vorfalls es nüchtern formuliert: [Aus der Perspektive der Smart Contracts des Projekts war nichts schiefgelaufen](https://www.halborn.com/blog/post/explained-the-badgerdao-hack-december-2021#:~:text=From%20the%20perspective%20of%20the%20project%27s%20smart%20contracts%2C%20nothing%20had%20gone%20wrong), und der Angreifer nutzte lediglich die von Nutzern gewährten Freigaben. Die Blockchain verhielt sich einwandfrei. Die Website log.

## Der Angriff: ein manipuliertes Schaufenster mit sauberem Kassenbon

![Lebhaftes, farbiges Konzeptbild eines vertrauenswürdig und freundlich wirkenden Schaufensters, dessen Kasse heimlich manipuliert wurde — eine versteckte Schublade saugt Münzen ab, während Kunden lächelnd und wie gewohnt bezahlen](../../assets/the-badgerdao-frontend-attack-01-attack.jpg)

Stellen Sie sich vor, Sie betreten ein Geschäft, das Sie hundert Mal besucht haben. Dasselbe Schild, dasselbe Personal, dieselbe Theke. Sie kaufen etwas Kleines, die Kassiererin registriert es, Sie tippen Ihre Karte. Alles sieht routinemäßig aus. Was Sie nicht sehen können: Jemand hat das Kartenlesegerät gegen eines ausgetauscht, das zusätzlich still und leise eine zweite, unbegrenzte Belastung Ihres Kontos autorisiert — zugunsten eines Fremden, wann immer dieser möchte.

Genau das ist, im Wesentlichen, BadgerDAO-Nutzern passiert.

Die Einordnung ist hier entscheidend, denn sie macht diesen Vorfall so lehrreich. Wie *Vice* es zusammenfasste, [beinhaltete der Hack keine komplizierten Smart-Contract-Exploits. Stattdessen handelte es sich um einen Frontend-Angriff auf BadgerDAOs Web-Infrastruktur](https://www.vice.com/en/article/hackers-steal-dollar119m-from-web3-crypto-project-with-old-school-attack/#:~:text=injected%20a%20malicious%20script%20into%20BadgerDAO%27s%20frontend) — insbesondere auf das Cloudflare-Konto. In ihrer Formulierung war es ein *altmodischer* Web-Angriff auf ein [Web3](/de/glossary/web3/)-Ziel.

Der Mechanismus war elegant und unauffällig. Das bösartige Skript bat die Wallet des Nutzers darum, der Adresse des Angreifers eine Token-Ausgabegenehmigung zu erteilen. In Vices Worten [hat das bösartige Skript Menschen im Grunde dazu verleitet, der Adresse das Recht zu geben, die Token an die Exploit-Adresse zu senden](https://www.vice.com/en/article/hackers-steal-dollar119m-from-web3-crypto-project-with-old-school-attack/#:~:text=The%20malicious%20script%20basically%20tricked%20people%20into%20giving). Der Nutzer glaubte, normale dApp-Geschäfte zu erledigen. Er unterschrieb in Wirklichkeit die Schlüssel zu seinen Token weg.

Sicherheitsforscher nennen dieses Muster *Ice [Phishing](/de/glossary/phishing/)*: Anstatt Ihren privaten Schlüssel zu stehlen, werden Sie dazu verleitet, freiwillig einen bösartigen Ausgeber zu genehmigen. Die Signatur ist echt. Die Freigabe ist echt. Die On-Chain-Transaktion ist gültig. Genau deshalb ist es so gefährlich — und deshalb hätte kein Contract-Audit es verhindern können.

## Was Nutzer verloren: rund 120 Millionen Dollar, eine Signatur nach der anderen

Die Zahlen sind erschreckend für einen Angriff, der keine einzige Zeile Vault-Code berührte.

Das Smart-Contract-Auditunternehmen PeckShield [schätzte die Gesamtverluste auf rund 120 Millionen Dollar](https://cryptobriefing.com/120m-lost-badgerdao-defi-hack/). BadgerDAOs eigene Post-Mortem-Abrechnung, die in Fallstudien zum Vorfall wiedergegeben wird, beziffert den Verlust auf [rund 2.076,54 BTC (~116,3 Mio. USD zum Zeitpunkt des Hacks)](https://www.quadrigainitiative.com/casestudy/badgerdaomaliciouscodeinjected.php#:~:text=2076.54%20BTC), sobald alle gestohlenen Vermögenswerte in eine gemeinsame Einheit umgerechnet wurden.

Der Schmerz war ungleich verteilt. Ein einzelnes Opfer — angeblich ein institutionelles Konto — verlor den Löwenanteil in einer einzigen Transaktion: Fallstudien vermerken, dass [rund 900 BTC aus dem Yearn wBTC Vault entzogen wurden](https://www.quadrigainitiative.com/casestudy/badgerdaomaliciouscodeinjected.php), wobei eine Partei allein [über 50 Millionen Dollar an Wrapped Bitcoin](https://www.quadrigainitiative.com/casestudy/badgerdaomaliciouscodeinjected.php#:~:text=lose%20over%20%2450%20million) verlor. Hunderte gewöhnlicher Nutzer machten den Rest aus.

Und das Ausmaß war eine direkte Folge von Geduld. Der Angreifer schlug nicht in Panik zu. Wie Fortas Analyse beschreibt, [sammelte der Hacker still und heimlich Freigaben von fast 200 Konten an, um dann am 2. Dezember 2021 um 0:48 Uhr die Wallets der Opfer in weniger als 10 Stunden zu leeren](https://forta.org/blog/how-to-derail-a-120-million-dollar-hack#:~:text=The%20hacker%20silently%20accumulated%20approvals%20from%20almost%20200%20accounts). Die bösartigen Freigaben hatten sich tagelang still angesammelt — eine gespannte Falle, die auf einmal losschnappte. Eine weitere Rekonstruktion zählte [500 Wallets, die diese unbegrenzten Freigaben erteilten](https://www.halborn.com/blog/post/explained-the-badgerdao-hack-december-2021#:~:text=The%20attacker%20managed%20to%20get%20500%20wallets), über die Dauer der Kampagne.

Das grausamste Detail: Es gab nichts, was ein vorsichtiger Nutzer hätte überprüfen können. Die URL war korrekt. Das TLS-Zertifikat war gültig. Die Oberfläche war echt. Das Einzige, was falsch war, war ein JavaScript-Schnipsel, den die legitime Website selbst auslieferte.

## Wie es geschah: ein Cloudflare-API-Schlüssel und eine eingeschleuste Freigabe

![Lebhaftes, farbiges Konzeptbild einer unsichtbaren Hand, die still und leise eine zusätzliche, leuchtende „Approve"-Schaltfläche in ein Wallet-Popup einfügt, während die echte Benutzeroberfläche ruhig und vertrauenswürdig wirkt — eine einzelne bösartige Codezeile schleicht sich in eine freundliche Webseite ein](../../assets/the-badgerdao-frontend-attack-02-injected-script.jpg)

Die Eingangstür, die der Angreifer benutzte, war kein Smart Contract. Es war ein Cloud-Konto.

BadgerDAO befand sich, wie ein erheblicher Teil des modernen Webs, hinter Cloudflare — der Content-Delivery- und Edge-Compute-Schicht, die Websites ausliefert und beschleunigt. Die Kontrolle über dieses Konto bedeutete die Kontrolle darüber, welchen Code BadgerDAOs Website an Besucher auslieferte. Und der Angreifer erlangte diese Kontrolle durch einen gestohlenen Schlüssel.

In BadgerDAOs offizieller Darstellung, die CoinDesk weitergab, [nutzte der Hacker einen kompromittierten API-Schlüssel, der ohne Wissen oder Genehmigung der Badger-Ingenieure erstellt worden war, um periodisch den bösartigen Code einzuschleusen, der eine Teilmenge seiner Kunden betraf](https://www.coindesk.com/business/2021/12/10/badgerdao-reveals-details-of-how-it-was-hacked-for-120m). Diese Formulierung — *eine Teilmenge seiner Kunden* — erklärt zum Teil, warum es so lange unentdeckt blieb. Das Skript wurde nicht für jeden, jedes Mal ausgelöst. Es wurde rotiert, traf nur bestimmte Nutzer und machte das bösartige Verhalten frustrierend schwer reproduzierbar oder erkennbar.

Wie konnte überhaupt ein nicht autorisierter API-Schlüssel entstehen? Die Grundursache lässt sich auf eine Schwachstelle im Cloudflare-Konto zurückführen. Fallstudien zum Vorfall vermerken, dass nicht autorisierte Nutzer in der Lage waren, Konten zu erstellen, und auch (globale) API-Schlüssel zu erstellen und einzusehen (die nicht gelöscht oder deaktiviert werden können), [bevor die E-Mail-Verifizierung abgeschlossen war](https://www.quadrigainitiative.com/casestudy/badgerdaomaliciouscodeinjected.php#:~:text=before%20email%20verification%20was%20completed). Ein Angreifer konnte gegen ein Konto einen Schlüssel hinterlegen und dann einfach warten, bis der echte Inhaber die Verifizierung abschloss und es aktivierte — woraufhin der Angreifer still und heimlich einen gültigen API-Zugang besaß.

Mit diesem Schlüssel griff der Angreifer auf Cloudflare Workers zurück — Cloudflares Edge-Compute-Plattform — um die Seite auf dem Weg zum Nutzer umzuschreiben. BadgerDAOs Post-Mortem, das gemeinsam mit dem Cybersicherheitsunternehmen Mandiant erstellt wurde, kam zu dem Schluss, dass der Phishing-Vorfall vom 2. Dezember das Ergebnis eines böswillig eingeschleusten Schnipsels war, der von Cloudflare Workers bereitgestellt wurde. Der eingeschleuste Code tat genau eine Sache, die zählte: Er fügte eine zusätzliche Token-Genehmigungsanforderung in den normalen Ablauf der dApp ein.

Es gab sogar eine bewusste Raffinesse bei der Wahl des *verwendeten* Freigabe-Aufrufs. CryptoBriefing berichtete, dass [der Hacker angeblich ein bösartiges Skript auf Badgers Website einfügte, das Nutzern eine Transaktion zur „Erhöhung der Erlaubnis" (`increaseAllowance`) präsentierte](https://cryptobriefing.com/120m-lost-badgerdao-defi-hack/#:~:text=presented%20users%20with%20a%20transaction%20to). Diese Wahl war nicht zufällig. Im Vergleich zu einem direkten `approve`-Aufruf tendiert ein `increaseAllowance`-Prompt dazu, in Wallet-Popups mit schwächeren, weniger alarmierenden visuellen Hinweisen dargestellt zu werden — weniger rote Flaggen, weniger Warnungen im Sinne von „Sie sind dabei, Ausgaberechte zu gewähren." Der Angreifer optimierte die *Nutzererfahrung* des Bestohlenwenrdens.

Die vollständige Angriffskette sah also so aus: Eine Schwachstelle bei der Cloudflare-Konto-Verifizierung ermöglichte das Entstehen eines nicht autorisierten API-Schlüssels → der Angreifer nutzte diesen Schlüssel, um einen Worker bereitzustellen → der Worker schleuste ein Skript in app.badger.com ein → das Skript forderte Wallets um eine Token-Erlaubnis zugunsten des Angreifers → Nutzer genehmigten → der Angreifer leerte sie. Kein einziger Schritt davon berührte die auditierten Contracts.

## Die Reaktion: Die Blockchain pausieren, um eine Web2-Wunde zu stoppen

Als die Entnahme-Transaktionen in den frühen Stunden des 2. Dezember in großem Umfang auftraten, wurde der On-Chain-Fußabdruck schließlich unmöglich zu übersehen, und BadgerDAO handelte schnell — und nutzte seine Smart Contracts, um ein Problem zu stoppen, das vollständig außerhalb der Blockchain entstanden war.

Das Team bestätigte den Vorfall öffentlich und, so CryptoBriefing, bestätigte, dass [alle Smart Contracts pausiert wurden, um weitere Abhebungen zu verhindern](https://cryptobriefing.com/120m-lost-badgerdao-defi-hack/). Da Badgers Vaults über eine Pause-Funktion verfügten, unterbrach das Einfrieren von Transfers die Möglichkeit des Angreifers, frisch genehmigte Gelder weiterzubewegen. Ein technischer Bericht beschreibt den Halt als die Ausübung der Befugnis des Teams, alle Aufrufe der `transferFrom`-Funktion einzufrieren — genau der [ERC-20](/de/glossary/erc-20/)-Mechanismus, den die bösartigen Freigaben ausnutzten. Diese Pause ist auch der Grund, warum ein erheblicher Teil des Verlustes theoretisch wiedererlangbar war: Einige Vermögenswerte waren vom Angreifer bewegt worden, aber noch nicht vollständig aus Badgers Vaults abgezogen worden, bevor das Einfrieren einsetzte.

Auf der Infrastrukturseite war die Bereinigung die ernüchternde Web2-Checkliste eines Zugangsdaten-Einbruchs: die Cloudflare-API-Schlüssel rotieren, das Konto-Passwort ändern, die Multi-Faktor-Authentifizierung härten und jeden Schlüssel auditieren, der nicht hätte existieren sollen. BadgerDAO arbeitete dann mit Mandiant zusammen, um ein technisches Post-Mortem zu untersuchen und zu veröffentlichen, das die Zeitleiste rekonstruiert — die Cloudflare-Konto-Schwachstellen, die in den vorangegangenen Monaten erstellten nicht autorisierten Schlüssel, die Skript-Einschleusung im November und die Entnahme im Dezember.

Aber kein Ausmaß an Incident Response konnte die Freigaben rückgängig machen, die Nutzer bereits erteilt hatten. Die Signaturen waren gültig. Die Abhilfemaßnahmen konnten *zukünftige* Diebstähle stoppen und Rückforderungen verfolgen; sie konnten keine Zustimmung rückgängig machen, die bereits On-Chain erteilt worden war.

## Was das lehrt: Die Website ist Teil Ihrer Sicherheitsoberfläche

Die wichtigste Lektion aus BadgerDAO ist eine Grenzkorrektur. Die meisten Teams — und die meisten Nutzer — ziehen den Sicherheitsperimeter um die Smart Contracts. BadgerDAO beweist, dass der Perimeter viel größer ist.

**1. Ihr Frontend ist immer in der Schusslinie.** Der Code, den der Browser eines Nutzers ausführt, ist Teil Ihres Protokolls, unabhängig davon, ob er On-Chain lebt oder nicht. Wenn ein Angreifer kontrolliert, welches JavaScript Ihre Website ausliefert, kontrolliert er die Wallets Ihrer Nutzer — auditierte Contracts hin oder her. Die Website ist nicht „nur die Benutzeroberfläche". Sie ist der Ort, an dem die Zustimmung eingeholt wird.

**2. Ihre Cloud- und Domain-Infrastruktur sind Teil des Vertrags.** Ein Cloudflare-Konto, ein DNS-Anbieter-Login, ein [Registrar](/de/glossary/registrar/)-Konto, ein CI/CD-Schlüssel — jedes ist ein Pfad, um das umzuschreiben, was Ihre Nutzer sehen. BadgerDAO wurde nicht beim Vault gebrochen; es wurde beim *Konto, das die Website kontrollierte*, gebrochen. Behandeln Sie diese Zugangsdaten mit derselben Paranoia, die Sie einem Deployer-Private-Key vorbehalten.

**3. API-Schlüssel und Konto-Erstellungsabläufe sind echte Angriffsflächen.** Die gesamte Katastrophe hing von einem nicht autorisierten API-Schlüssel ab, der niemals hätte existieren dürfen, ermöglicht durch eine Verifizierungslücke. Inventarisieren Sie jeden Schlüssel. Beschränken Sie deren Geltungsbereich. Rotieren Sie sie. Alarmieren Sie bei neuen. Ein Schlüssel, den Sie vergessen haben, ist ein Schlüssel, den ein Angreifer benutzen kann.

**4. „Auditiert" ist notwendig, aber nicht hinreichend.** Ein sauberes Audit ist echter Mehrwert, und Sie sollten trotzdem eines einholen. Es deckt aber die Contracts ab, nicht das Cloud-Konto, das DNS, das CDN oder die Frontend-Build-Pipeline. Sicherheit umfasst den gesamten Pfad vom Browser eines Nutzers bis zu Ihrer Blockchain — und das schwächste Glied, nicht das stärkste, setzt den Maßstab.

**5. Nutzer können sich nicht durch Prüfung aus einem manipulierten Frontend herausmanövrieren.** „Überprüfen Sie immer die URL" ist ein guter Rat, der hier nichts gebracht hätte. Die URL war korrekt. Die Lektion für Nutzer ist schwieriger: Seien Sie zutiefst misstrauisch gegenüber Freigabe- und `increaseAllowance`-Prompts, bevorzugen Sie Wallets und Tools, die Token-Freigaben dekodieren und davor warnen, und widerrufen Sie veraltete Erlaubnisse regelmäßig. Was Sie genehmigen, ist wichtiger als die Seite, auf der Sie sich befinden.

## Der Namefi-Bezug

![Farbenfrohe Illustration von verifizierbarem, manipulationssicherem Domain- und Web-Eigentum — gesichert durch einen grünen Schild, einen grünen Namefi-Token und DNS-Kontinuität](../../assets/the-badgerdao-frontend-attack-03-namefi-angle.jpg)

Auf sein Wesentliches reduziert ist BadgerDAO ein **Eigentums- und Kontroll**-Problem. Der Angreifer besaß BadgerDAOs Website nicht — aber über Wochen konnte er ändern, was sie auslieferte. Die Menschen, denen das Projekt *gehörte*, hatten keine zuverlässige, manipulationsevidenterweise nachweisbare Möglichkeit zu erkennen, dass die Kontrollkette über ihre Web-Präsenz — Konto, Schlüssel, Edge-Konfiguration, DNS — still und heimlich kompromittiert worden war.

Das ist die Lücke, um die sich [Namefi](https://namefi.io) kümmert. Namefi behandelt Domains und Web-Eigentum als erstklassige, internet-native Vermögenswerte: Kontrolle, die überprüfbar, auditierbar und schwerer still und heimlich zu kapern ist, während sie mit DNS kompatibel bleibt. Die Frontend-Angriffsfläche — wer den Namen kontrolliert, wohin er auflöst, welche Infrastruktur dahintersteckt — ist kein Nachgedanke zu den Smart Contracts. Wie BadgerDAO auf die teuerste mögliche Weise gezeigt hat, *ist* sie Teil des Sicherheitsmodells.

Sie können Ihre Contracts auditieren lassen, bis sie makellos sind. Aber wenn ein nicht autorisierter Schlüssel Ihre Website umschreiben und ein eingeschleustes Skript die Freigaben Ihrer Nutzer abernten kann, war das Audit nie die ganze Geschichte. Die Domain, das DNS und die Web-Infrastruktur, die Ihre Anwendung an echte Menschen ausliefern, sind Teil Ihrer Sicherheitsoberfläche. Behandeln Sie sie entsprechend — denn Angreifer tun es bereits.

## Quellen und weiterführende Lektüre

- CoinDesk — [BadgerDAO Reveals Details of How It Was Hacked for $120M](https://www.coindesk.com/business/2021/12/10/badgerdao-reveals-details-of-how-it-was-hacked-for-120m)
- Vice (Motherboard) — [Hackers Steal $119M From 'Web3' Crypto Project With Old School Attack](https://www.vice.com/en/article/hackers-steal-dollar119m-from-web3-crypto-project-with-old-school-attack/)
- Halborn — [Explained: The BadgerDAO Hack (December 2021)](https://www.halborn.com/blog/post/explained-the-badgerdao-hack-december-2021)
- Forta — [How to Derail a 120-Million-Dollar Hack](https://forta.org/blog/how-to-derail-a-120-million-dollar-hack)
- CryptoBriefing — [$120M Lost in BadgerDAO DeFi Hack](https://cryptobriefing.com/120m-lost-badgerdao-defi-hack/)
- Quadriga Initiative — [Dec 2021 — BadgerDAO Malicious Code Injected — $116.3m](https://www.quadrigainitiative.com/casestudy/badgerdaomaliciouscodeinjected.php)
- Chainalysis — [Behind The Scenes of The BadgerDAO Hack](https://www.chainalysis.com/blog/chainalysis-podcast-episode-6-badgerdao-hack/)
- BadgerDAO / Mandiant — [BadgerDAO Exploit Technical Post Mortem](https://www.badger.tools/technical-post-mortem)
