---
title: 'Von DiscordApp.com zu Discord.com: Wie das Weglassen von „App" eine Tür schloss, die Phisher liebten'
date: '2026-06-17'
language: de
tags: ['domains', 'branding', 'startups', 'domain-upgrades']
authors: ['fenwei-bian']
editors: ['victor-zhou']
translators: ['kai-kunstmann']
draft: false
description: 'Wie Discord im Jahr 2015 auf DiscordApp.com startete, weil Discord.com vergeben war, die Domain still und leise kaufte und 2020 discord.com zur primären Adresse machte – teils für eine sauberere Markenidentität, teils weil die Aufspaltung zwischen „discordapp.com" und „discord.com" ein Geschenk für Phisher und Malware-Gruppen war.'
keywords: ['discordapp.com', 'discord.com', 'discord domain name', 'domain upgrade', 'jason citron', 'discord history', 'cdn.discordapp.com', 'discord phishing', 'startup naming', 'brand naming', 'premium domain', 'domain strategy', 'domain migration']
relatedArticles:
  - /de/blog/from-bufferapp-com-to-buffer-com/
  - /de/blog/from-slackhq-com-to-slack-com/
  - /de/blog/from-ubercab-com-to-uber-com/
  - /de/blog/from-massdrop-com-to-drop-com/
  - /de/blog/from-box-net-to-box-com/
relatedTopics:
  - /de/topics/domain-investing/
  - /de/topics/domain-basics/
relatedSeries:
  - /de/series/name-change-game-change/
  - /de/series/domain-apocalypse/
relatedGlossary:
  - /de/glossary/registrar/
  - /de/glossary/dns/
  - /de/glossary/icann/
  - /de/glossary/tld/
  - /de/glossary/web3/
---

Bevor Discord ein Verb für „spring auf den Server" wurde, lebte es unter einer etwas längeren Adresse: **DiscordApp.com**.

Das „App" war keine Branding-Entscheidung. Es war ein Workaround. Als Jason Citron und Stanislav Vishnevskiy ihr Sprach-und-Chat-Tool im Mai 2015 auf den Markt brachten, gehörte die exakt passende Domain – Discord.com – bereits jemandem anderen, der sie um die Jahrtausendwende registriert hatte. Also wurde das Produkt mit einem Zusatz ins Netz geschickt. Laut Wikipedia wurde [Discord im Mai 2015 öffentlich unter dem Domainnamen discordapp.com veröffentlicht](https://en.wikipedia.org/wiki/Discord_%28software%29#:~:text=Discord%20was%20publicly%20released%20in%20May%202015%20under%20the%20domain%20name%20discordapp.com). Ein Rückblick auf die frühen Tage bringt es auf den Punkt: [Discordapp.com war Discords offizielle URL im ersten Startjahr](https://www.remote.tools/discord/when-was-discord-made#:~:text=Discordapp.com).

Diese Lücke zwischen dem Namen, den ein Unternehmen möchte, und dem Namen, den es bekommen kann, ist eines der häufigsten Probleme beim Startup-Branding. Das Produkt hieß bereits Discord. Die Welt konnte es nur noch nicht unter Discord.com erreichen.

Was Fall 13 von der üblichen „Kauf deine exakte Übereinstimmung"-Geschichte unterscheidet, ist die *Naht*, die der Workaround hinterließ. Fünf Jahre lang lief Discord unter zwei Adressen gleichzeitig – der Marke, die es nutzte (discordapp.com), und der Marke, die es wollte (discord.com) – und diese Zwei-Domain-Aufspaltung erwies sich als genau jene Art von Ambiguität, von der Phisher, Betrüger und Malware-Gruppen leben. Dies ist die Geschichte eines Domain-Upgrades, das teils der Markenbereinigung und teils dem Schließen einer Sicherheitslücke diente, mit der das Unternehmen seit dem Start gelebt hatte.

## 2015: Das Tool, das einen Namen brauchte, den es nicht haben konnte

Discord begann nicht als Massenphänomen. Es begann als Lösung für ein spezifisches Ärgernis.

Citron kam mit Geld und Narbengewebe dazu. Er hatte das Social-Gaming-Netzwerk OpenFeint gegründet und – wie Wikipedia berichtet – [es später 2011 für 104 Millionen US-Dollar an GREE verkauft, womit er 2012 Hammer & Chisel, ein Spieleentwicklungsstudio, gründete](https://en.wikipedia.org/wiki/Discord_%28software%29#:~:text=later%20sold%20it%20to%20GREE%20in%202011%20for%20%24104%20million%2C%20which%20he%20used%20to%20found%20Hammer%20%26%20Chisel). Das Spiel des Studios schlug nicht durch, aber das Chat-Tool, das das Team gebaut hatte, um Raids zu koordinieren, schon. Das Hilfsmittel wurde zum Produkt.

Der Name wurde früh festgelegt, und das aus ganz gewöhnlichen Gründen. Laut Wikipedia wurde [der Name „Discord" gewählt, weil er „cool klingt und mit Reden zu tun hat", leicht zu sagen, zu buchstabieren und zu merken war und für Marken und Website verfügbar war](https://en.wikipedia.org/wiki/Discord_%28software%29#:~:text=The%20name%20%22Discord%22%20was%20chosen%20because%20it%20%22sounds%20cool%20and%20has%20to%20do%20with%20talking%22). Man beachte den letzten Punkt – *für Marken und Website verfügbar*. „Verfügbar" leistet dort viel stille Arbeit. Die Marke war frei. Die blanke [.com](/de/tld/com/) war es nicht.

Also tat das Team, was unzählige Startups tun: Es fügte einen Zusatz hinzu und brachte das Produkt auf den Markt. Die Marke „Discord" startete als Adresse „DiscordApp". Und es funktionierte. Die Nutzerbasis schnellte fast sofort in die Höhe. Laut Wikipedia [hatte Discord nach dem Bericht von Hammer & Chisel im Januar 2016 von 3 Millionen Menschen genutzt worden, mit einem Wachstum von 1 Million pro Monat](https://en.wikipedia.org/wiki/Discord_%28software%29#:~:text=By%20January%202016%2C%20Hammer%20%26%20Chisel%20reported%20Discord%20had%20been%20used%20by%203%20million%20people%2C%20with%20growth%20of%201%20million%20per%20month), im Juli desselben Jahres 11 Millionen und bis Jahresende 25 Millionen Nutzer.

Diese Kurve ist der Haken. Jede dieser Millionen lernte die Marke als „discordapp.com". Jeder Einladungslink, jeder geteilte Screenshot, jedes Lesezeichen zementierte den Workaround ein Stück tiefer. Je länger ein Zusatz mitreist, desto teurer wird es, ihn zu entfernen – nicht in Dollar, sondern im Muskelgedächtnis eines Publikums, das das falsche Wort hundert Mal getippt hat.

## Der Wechsel zu Discord.com

Discord musste nichts umbenennen. Das Produkt hieß immer Discord. Es musste nur seine Adresse ändern – von DiscordApp.com zu Discord.com – und dafür musste es zunächst *Discord.com besitzen*.

Das tat es, still und heimlich, Jahre bevor es die Domain nutzte. Die Domain war [im Jahr 2000 registriert worden](https://www.thedomains.com/2020/05/09/discord/#:~:text=registered%20in%202000), lange bevor das Unternehmen existierte. Laut Berichten aus der Domain-Branche [erwarb das Unternehmen die Domain Discord.com bereits 2017](https://www.thedomains.com/2020/05/09/discord/#:~:text=acquired%20the%20domain%20Discord.com%20back%20in%202017) – wechselte aber nicht dazu. Eine Weile war [die .com eine Weiterleitung zur discordapp.com-Domain, die sie seit Beginn verwendeten](https://www.thedomains.com/2020/05/09/discord/#:~:text=the%20.com%20was%20a%20redirect%20to%20the%20discordapp.com%20domain%20they%20have%20used%20since%20the%20start). Das Unternehmen besaß den sauberen Namen, ließ ihn aber weiterhin auf den Workaround zeigen.

Der eigentliche Wechsel kam 2020. Wie eine Domain-Analyse feststellt: Auch wenn einige Quellen den Kauf auf 2017 datieren, ist [die einzige faktische Aussage, dass der Wechsel zur neuen Domain am 4. Mai 2020 stattfand](https://www.domainer.com/blog/discord-com-domain-sale#:~:text=the%20only%20factual%20statement%20is%20that%20the%20move%20to%20the%20new%20domain%20happened%20on%20May%204th%202020). Discord machte discord.com zur Hauptadresse und [entschied sinnvollerweise, die alte Domain aktiv zu halten](https://www.domainer.com/blog/discord-com-domain-sale#:~:text=they%20decided%20to%20keep%20the%20old%20domain%20up) als Weiterleitung, damit bestehende Links nicht brechen würden. Die Social-Media-Handles folgten der Adresse: Das Unternehmen [änderte seine Social-Media-Handles von @discordapp auf @discord](https://www.domainer.com/blog/discord-com-domain-sale#:~:text=changed%20their%20social%20media%20handles%20from%20%40discordapp%20to%20%40discord%20only).

Der Wechsel war auch nicht nur kosmetisch – er reichte bis in die technische Infrastruktur hinein. Bot- und Bibliotheksentwickler mussten ihren Code neu ausrichten, da die API selbst umzog. Die Maintainer der beliebten discord.py-Bibliothek eröffneten ein Tracking-Issue mit dem Hinweis, dass [Discord von discordapp.com zu discord.com wechselt](https://github.com/Rapptz/discord.py/issues/4063#:~:text=Discord%20is%20moving%20from%20discordapp.com%20to%20discord.com), mit einer harten Frist: [Wenn die Domain, die zur Verbindung mit den Discord-Servern verwendet wird, nicht bis zum 7. November 2020 geändert wird, können Clients, die die Bibliothek verwenden, keine Verbindung herstellen](https://github.com/Rapptz/discord.py/issues/4063#:~:text=is%20not%20changed%20by%20November%207th%202020%20then%20clients%20using%20the%20library%20will%20be%20unable%20to%20connect). Ein Domain-„Upgrade", das die meisten Nutzer nie bemerkten, war für das Entwickler-Ökosystem eine Deadline.

## Der Hintergrund: Warum eine Zwei-Domain-Aufspaltung ein Phishing-Geschenk ist

![Lebhafte Discord-Blurple-Illustration eines Gabelwegweisers, bei dem ein Weg discord.com und der andere discordapp.com anzeigt, während das Clyde-Maskottchen nervös zwischen beiden schaut und sich ein vermummter Phisher in der Gabelung versteckt](../../assets/from-discordapp-com-to-discord-com-02-phishing-risk.jpg)

Hier ist der Teil, der Fall 13 zu mehr als einer ordentlichen Branding-Geschichte macht.

Wenn ein Unternehmen über Jahre unter zwei nahezu identischen Domains operiert, trainiert es seine eigenen Nutzer darin, *beide* als legitim zu akzeptieren. „Ist discordapp.com das echte Discord, oder ist es discord.com?" Die meisten Menschen könnten das nicht mit Sicherheit sagen – und genau diese Unsicherheit ist der Nährboden, auf dem [Phishing](/de/glossary/phishing/) gedeiht. Wenn Nutzer zwei offiziellen Domains vertrauen, vertrauen sie auch einer dritten, die fast genauso aussieht. Leichte Variationen des Namens – ein Buchstabe mehr hier, ein vertauschtes Wort dort – werden zu einfachen Verkleidungen, weil das echte Original bereits in mehr als einer Variante existiert.

Dieses Risiko war für Discord nicht hypothetisch, und es hat einen langen Nachhall. Discords Content-Delivery-Netzwerk lebt nach wie vor unter dem alten Namen, bei **cdn.discordapp.com** – und diese Domain wurde zu einem der beliebtesten Orte im Internet, um Malware zu *platzieren*, genau weil sie vertrauenswürdig aussieht. Das Sicherheitsunternehmen Zscaler dokumentierte, wie [ein Angreifer eine bösartige Datei in einem Discord-Kanal hochladen und deren öffentlichen Link mit anderen teilen kann – selbst Nicht-Discord-Nutzer können sie herunterladen](https://www.zscaler.com/blogs/security-research/discord-cdn-popular-choice-hosting-malicious-payloads#:~:text=An%20attacker%20can%20upload%20a%20malicious%20file%20on%20a%20Discord%20channel%20and%20share%20its%20public%20link%20with%20others). Schlimmer noch: [Eine über Discord gesendete Datei bleibt für immer dort, sodass ihr Link auch dann zum Herunterladen der bösartigen Datei verwendet werden kann, wenn ein Angreifer sie innerhalb von Discord löscht](https://www.zscaler.com/blogs/security-research/discord-cdn-popular-choice-hosting-malicious-payloads#:~:text=a%20file%20sent%20from%20Discord%20is%20there%20forever).

Das Threat-Intelligence-Unternehmen Intel 471 erläuterte, warum die *Domain* selbst die Waffe ist. Sobald eine Datei hochgeladen wird, [wird ein direkter Link von der Plattform generiert](https://www.intel471.com/blog/how-discord-is-abused-for-cybercrime#:~:text=a%20direct%20link%20is%20generated%20by%20the%20platform), und [Angreifer können diese Links dann über Phishing-E-Mails, soziale Medien oder andere Kanäle verbreiten](https://www.intel471.com/blog/how-discord-is-abused-for-cybercrime#:~:text=Attackers%20then%20can%20choose%20to%20disseminate%20these%20links%20through%20phishing%20emails%2C%20social%20media%20or%20other%20channels). Der Link folgt dem Format [https://cdn.discordapp.com/attachments/{channel ID}/{file ID}/{file name}](https://www.intel471.com/blog/how-discord-is-abused-for-cybercrime#:~:text=The%20Discord%20URL%20follows%20the%20https%3A%2F%2Fcdn.discordapp.com%2Fattachments) – eine echte Discord-Domain mit einem echten TLS-Zertifikat, die Filter passiert, weil [wenn die Discord-Domain nicht durch Sicherheitskontrollen gesperrt ist, eine effektive Methode zur Verbreitung schädlicher Inhalte darstellt](https://www.intel471.com/blog/how-discord-is-abused-for-cybercrime#:~:text=If%20the%20Discord%20domain%20isn%27t%20disallowed%20by%20security%20controls%2C%20it%27s%20an%20effective%20way%20to%20deliver%20harmful%20content). Das Forschungsteam von Malwarebytes hat dasselbe Muster verfolgt und warnte vor einer [neuen Phishing-Kampagne, die Discord zur Payload-Zustellung nutzt](https://www.threatdown.com/blog/new-phishing-campaign-uses-discord-for-payload-delivery/#:~:text=New%20phishing%20campaign%20uses%20Discord%20for%20payload%20delivery), und stellte fest, dass [Kriminelle Discord zum Hosten von Malware missbrauchen, wegen seiner robusten CDN-Infrastruktur](https://www.threatdown.com/blog/new-phishing-campaign-uses-discord-for-payload-delivery/#:~:text=Criminals%20abuse%20Discord%20to%20host%20malware%20because%20of%20its%20robust%20CDN%20infrastructure).

Die sichtbare Marke auf eine einzige, kanonische Eingangstür – discord.com – zu konzentrieren, löst den CDN-Missbrauch nicht. Aber es tut das eine, was Branding *für die Sicherheit* leisten kann: Es macht „Wie sieht das echte Discord aus?" zu einer einwortigen Antwort. Je weniger offizielle Schreibweisen eine Marke hat, desto weniger Verkleidungen stehen einem Angreifer zur Verfügung.

## Das Geld sah damals anders aus

Es ist verlockend, Discords Kauf von Discord.com als selbstverständlich zu betrachten – natürlich besitzt das Unternehmen irgendwann seinen eigenen Namen. Aber die Entscheidungen wurden im Nebel getroffen, nicht im Rückblick.

Man beachte den Zeitplan. Das Team erwarb Discord.com 2017, als Discord eine schnell wachsende, aber unerprobte Gaming-Chat-App war, Jahre entfernt von seiner pandemischen Allgegenwart und seiner Bewertung im Mehrfach-Milliardenbereich. Dann *ließ es die saubere Domain als Weiterleitung liegen*, etwa drei Jahre lang, bevor es 2020 den Schalter umlegte. Diese Geduld ist der interessante Teil. Discord besaß die bessere Adresse und wählte wiederholt, ein funktionierendes Produkt nicht zu stören, um sie zu nutzen.

Das ist das eigentliche Kostenmodell eines Domain-Upgrades, und es ist selten der Kaufpreis. Der schwierige Teil ist die Migration: Apps, APIs, OAuth-Scopes, gespeicherte Passwörter, Browser-Berechtigungen, Deep Links und ein weitverzweigtes Drittanbieter-Bot-Ökosystem neu ausrichten – ohne das lebende Produkt zu beschädigen, das täglich von Millionen Menschen genutzt wird. Discord konnte es sich leisten, Discord.com zu kaufen, lange bevor es sich leisten konnte, *dorthin zu wechseln*. Der Kauf von 2017 sicherte die Option; der Wechsel von 2020 übte sie aus, sobald das Produkt stabil genug war, um die Hürden zu absorbieren, und die Entwickler-Deadline im November 2020 durchgesetzt werden konnte.

## Warum das Weglassen von „App" wichtig war

![Lebhafte farbige Illustration in Discord-Blurple des Wortes DiscordApp, das sein leuchtendes -App-Suffix ablegt, die Buchstaben fallen herunter während das Clyde-Maskottchen grinst, und ein einzelnes sauberes Discord-Wortmarke übrig bleibt](../../assets/from-discordapp-com-to-discord-com-01-dropping-app.jpg)

Die Distanz zwischen DiscordApp.com und Discord.com beträgt drei Buchstaben. Strategisch gesehen ist es die Distanz zwischen *der App* und *dem Ort*.

**DiscordApp.com** benennt ein Stück Software – ein Ding, das man herunterlädt, eine Anwendung unter Anwendungen. **Discord.com** benennt ein Ziel – einen Ort, den man aufsucht, einer Gemeinschaft, zu der man gehört, ein Verb, das die Menschen verwenden, ohne darüber nachzudenken. Das eine zeigt auf ein Produkt. Das andere *ist* einfach die Marke. Und als Discord über das Gaming hinauswuchs und zu etwas wurde, das Menschen für Clubs, Kurse und Freundesgruppen nutzen, begann „App" wie ein Relikt aus der Zeit zu wirken, als das Unternehmen sich selbst zum ersten Mal beschrieb.

| Vorher | Nachher |
| --- | --- |
| DiscordApp.com | Discord.com |
| Benennt „die App" – ein herunterladbares Produkt | Benennt die Marke – einen Ort und ein Verb |
| Trägt einen Workaround-Zusatz | Trägt nichts außer dem Wort |
| Zwei offizielle Schreibweisen, denen Nutzer vertrauen müssen | Eine einzige kanonische Eingangstür |
| Hinterlässt eine Naht, die Phisher imitieren können | Schließt die Lücke „Welche ist echt?" |

Dies ist das wiederkehrende Muster bei Domain-Upgrades: Frühe Namen *beschreiben* oder *qualifizieren*; große Namen *besitzen*. Ein Zusatz wie „App", „HQ", „Cab" oder „The" ist eine vernünftige Auffahrt, wenn der saubere Name vergeben ist. Er wird zur Bremse – und im Fall von Discord zu einer kleinen Sicherheitslast –, sobald das Unternehmen groß genug ist, dass das blanke Wort das Ziel sein sollte.

## Die Abfolge: Erst besitzen, dann sicher wechseln

Die Reihenfolge der Schritte hier ist es wert, verlangsamt zu werden, denn sie kehrt den üblichen Startup-Rat um: „Wechsel zu deiner exakten Übereinstimmung, sobald du sie bekommst."

Discord tat das nicht. Die Abfolge war:

1. **Der Name wurde zuerst gewählt** – „Discord", festgelegt, weil er einprägsam und die Marke [verfügbar](https://en.wikipedia.org/wiki/Discord_%28software%29#:~:text=The%20name%20%22Discord%22%20was%20chosen%20because%20it%20%22sounds%20cool%20and%20has%20to%20do%20with%20talking%22) war, auch wenn die blanke .com es nicht war.
2. **Das Produkt startete mit einem Zusatz** – [discordapp.com](https://en.wikipedia.org/wiki/Discord_%28software%29#:~:text=Discord%20was%20publicly%20released%20in%20May%202015%20under%20the%20domain%20name%20discordapp.com), weil Discord.com seit einer Registrierung aus dem Jahr 2000 belegt war.
3. **Die exakte Übereinstimmung wurde erworben, aber in Reserve gehalten** – Discord kaufte Discord.com in [2017](https://www.thedomains.com/2020/05/09/discord/#:~:text=acquired%20the%20domain%20Discord.com%20back%20in%202017) und betrieb sie als [Weiterleitung](https://www.thedomains.com/2020/05/09/discord/#:~:text=the%20.com%20was%20a%20redirect%20to%20the%20discordapp.com%20domain%20they%20have%20used%20since%20the%20start), nicht als Ersatz.
4. **Der Wechsel fand statt, als das Produkt ihn absorbieren konnte** – der [Wechsel zur neuen Domain fand am 4. Mai 2020 statt](https://www.domainer.com/blog/discord-com-domain-sale#:~:text=the%20only%20factual%20statement%20is%20that%20the%20move%20to%20the%20new%20domain%20happened%20on%20May%204th%202020), mit einer Entwickler-Umschaltfrist am 7. November 2020.

Die Lektion lautet nicht „Verzögere dein Upgrade". Sie lautet, dass der Besitz der sauberen Domain und das *Migrieren* dorthin zwei separate Projekte mit zwei unterschiedlichen Risikoprofilen sind. Discord sicherte das Asset früh und günstig, dann wählte es den Moment für den Wechsel sorgfältig – und ließ die alte Adresse als Weiterleitung aktiv, damit nichts kaputt ging.

## Die Domain wurde Teil des Betriebssystems

Premium-Domains sind aus einem unglamourösen Grund wichtig: Wiederholung.

Eine Kerndomain taucht überall auf, wo ein Unternehmen keine vollständige Kontrolle hat – in Einladungslinks, OAuth-Zustimmungsbildschirmen, E-Mail-Adressen, Presseberichten, Browser-Leisten, Suchergebnissen und jedem gesprochenen „Join my server". Jede Wiederholung fügt entweder Reibung hinzu oder beseitigt sie. DiscordApp.com bat jeden, drei zusätzliche Buchstaben für immer mitzutragen, *und* lehrte Nutzer still und heimlich, dass Discord in zwei offiziellen Schreibweisen vorkommt. Discord.com bat um nichts und beantwortete die Vertrauensfrage in einem einzigen Wort.

Die Markenentwicklung verstärkte die Adresse. Als Discord sich Mitte 2020 – im selben Jahr, in dem es die Domains wechselte – offiziell vom Gaming-Bereich neu ausrichtete, teilte es seiner Community in seinem eigenen [Blog-Beitrag](https://discord.com/blog/your-place-to-talk) mit, dass [wir eine neue Website mit einem neuen Slogan starten: Your place to talk](https://discord.com/blog/your-place-to-talk#:~:text=we%27re%20launching%20a%20new%20website%20with%20a%20new%20tagline%3A%20Your%20place%20to%20talk). Es räumte ein, dass [die Art, wie wir über uns selbst gesprochen haben, der Welt das falsche Signal gesendet hat](https://discord.com/blog/your-place-to-talk#:~:text=the%20way%20we%20talked%20about%20ourselves%20sent%20the%20wrong%20signal%20to%20the%20world). Ein Name, der sich selbst „App" nannte, sendete ein engeres Signal als ein Unternehmen, das [einladender, inklusiver und vertrauenswürdiger](https://discord.com/blog/your-place-to-talk#:~:text=more%20welcoming%2C%20more%20inclusive%2C%20and%20more%20trustworthy) sein wollte. „Vertrauenswürdig" ist das entscheidende Wort – und eine einzige kanonische Domain ist ein Teil davon, wie eine Marke es verdient.

## Was Gründer aus Fall 13 lernen sollten

Die einfache Schlussfolgerung – „Besitz deine exakte .com, bevor du startest" – ist die falsche, weil Discord das nicht konnte. Die nützlicheren Lektionen betreffen Zusätze, Timing und Sicherheit:

1. **Ein Zusatz ist eine gute Auffahrt.** „App" ließ Discord unter seinem echten Namen starten, während das blanke Wort von einem [Registrant](/de/glossary/registrant/) aus dem Jahr 2000 gehalten wurde. Auf DiscordApp.com zu starten war kein Scheitern; es war eine vernünftige Art zu liefern.
2. **Die saubere Domain zu kaufen und dorthin zu wechseln sind unterschiedliche Entscheidungen.** Discord erwarb Discord.com 2017 und wechselte erst 2020. Das Asset zu sichern kaufte eine Option; sie auszuüben konnte auf einen sicheren Moment warten.
3. **Zähle die Nähte, nicht nur die Buchstaben.** Die Kosten des Betriebs von zwei Domains sind nicht nur drei zusätzliche Zeichen – es ist die Ambiguität. Zwei offizielle Schreibweisen lehren Nutzer, Ähnlichkeiten zu vertrauen, und Ähnlichkeiten sind das, was Phisher verschicken.
4. **Eine einzige kanonische Eingangstür ist ein Sicherheitsmerkmal.** Die Konsolidierung auf discord.com stoppte nicht den CDN-Missbrauch auf cdn.discordapp.com, aber es machte „Wie sieht das echte Discord aus?" zu einer einwortigen Antwort – und diese Klarheit ist etwas, das Angreifer nicht leicht fälschen können.

Das Domain-Upgrade hat Discord nicht zum Gewinner gemacht. Produkt, Timing, die Pandemie und eine explosive Community haben weitaus mehr geleistet. Aber discord.com machte die Marke einfacher zu tippen, leichter zu vertrauen und schwerer zu fälschen – was für eine Plattform, die auf Links aufgebaut ist, auf die Fremde klicken, keine Kleinigkeit ist.

## Die Namefi-Perspektive

![Farbenfrohe Illustration einer Premium-Domain, die durch verifizierten Transfer, ein grünes Namefi-Token und DNS-Kontinuität geführt wird](../../assets/from-discordapp-com-to-discord-com-03-namefi-angle.jpg)

Discords Geschichte ist, unter dem Branding, ein *Kontroll-und-Kontinuität*-Problem.

Die strategische Entscheidung stand nie in Zweifel – natürlich sollte eine Plattform namens Discord unter Discord.com leben. Die Arbeit war alles rund um das Asset: Eine [Premium-Domain](/de/glossary/premium-domain/) erwerben, die zwei Jahrzehnte zuvor registriert wurde, dann den Besitz nachweisen, sie sicher als Weiterleitung halten und schließlich ein Live-Produkt – Apps, APIs, OAuth, gespeicherte Anmeldedaten und ein Drittanbieter-Bot-Ökosystem – darauf migrieren, ohne etwas zu zerbrechen oder, entscheidend, ein Fenster für Imitatoren während der Umschaltung zu öffnen. Dieser letzte Punkt ist der Sicherheitsfaden, der sich durch den gesamten Fall zieht: Ambiguität darüber, *welche Domain wirklich deine ist*, ist genau das, was Angreifer ausnutzen.

[Namefi](https://namefi.io) ist um die Idee herum gebaut, dass Domains sich wie internet-native Assets verhalten sollten. Tokenisiertes Eigentum kann die Domain-Kontrolle einfacher verifizierbar, übertragbar und in moderne Workflows integrierbar machen, während es mit DNS kompatibel bleibt – und damit die langsamen, vertrauensintensiven Teile eines solchen Deals (bestätigen, wer was besitzt, das Asset übertragen und Kontinuität durch eine Migration gewährleisten) in etwas näher an einer sauberen, prüfbaren Transaktion verwandelt. Wenn der Besitz eines Namens nachweisbar und portabel ist, wird „Ist das das echte Discord?" einfacher zu beantworten – für das Unternehmen und für jeden, der auf seine Links klickt.

Discord.com sieht heute unvermeidlich aus, weil Discord enorm geworden ist. Aber die Lektion landet früher: Wenn ein Name das Geschäft tragen soll – und besonders wenn eine Workaround-Domain eine Naht hinterlässt, durch die Betrüger kriechen können – ist die Domain keine Dekoration. Es ist die Eingangstür, und du willst nur eine.

## Quellen und weiterführende Lektüre

- Wikipedia — [Discord (Software)](https://en.wikipedia.org/wiki/Discord_%28software%29#:~:text=Discord%20was%20publicly%20released%20in%20May%202015%20under%20the%20domain%20name%20discordapp.com)
- The Domains — [Discord now using Discord.com, the domain is no longer just a redirect](https://www.thedomains.com/2020/05/09/discord/#:~:text=acquired%20the%20domain%20Discord.com%20back%20in%202017)
- Domainer — [How the Discord.com Domain Sale Reshaped the App](https://www.domainer.com/blog/discord-com-domain-sale#:~:text=the%20only%20factual%20statement%20is%20that%20the%20move%20to%20the%20new%20domain%20happened%20on%20May%204th%202020)
- GitHub (discord.py) — [Change of Discord domain from discordapp.com to discord.com (Issue #4063)](https://github.com/Rapptz/discord.py/issues/4063#:~:text=Discord%20is%20moving%20from%20discordapp.com%20to%20discord.com)
- Discord Blog — [Your Place to Talk](https://discord.com/blog/your-place-to-talk#:~:text=we%27re%20launching%20a%20new%20website%20with%20a%20new%20tagline%3A%20Your%20place%20to%20talk)
- Zscaler — [Discord CDN: A Popular Choice for Hosting Malicious Payloads](https://www.zscaler.com/blogs/security-research/discord-cdn-popular-choice-hosting-malicious-payloads#:~:text=An%20attacker%20can%20upload%20a%20malicious%20file%20on%20a%20Discord%20channel%20and%20share%20its%20public%20link%20with%20others)
- Intel 471 — [How Discord is abused for cybercrime](https://www.intel471.com/blog/how-discord-is-abused-for-cybercrime#:~:text=The%20Discord%20URL%20follows%20the%20https%3A%2F%2Fcdn.discordapp.com%2Fattachments)
- ThreatDown by Malwarebytes — [New phishing campaign uses Discord for payload delivery](https://www.threatdown.com/blog/new-phishing-campaign-uses-discord-for-payload-delivery/#:~:text=Criminals%20abuse%20Discord%20to%20host%20malware%20because%20of%20its%20robust%20CDN%20infrastructure)
- Remote Tools — [When was Discord made?](https://www.remote.tools/discord/when-was-discord-made#:~:text=Discordapp.com)
- Discord Support — [Discordapp.com is now Discord.com](https://support.discord.com/hc/en-us/articles/360042987951-Discordapp-com-is-now-Discord-com)
