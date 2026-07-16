---
title: 'Domain Mayday EP03: Die Twitter-Bitcoin-Kontoübernahme 2020'
date: '2026-06-17'
language: de
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['aileen-wright']
editors: ['victor-zhou']
translators: ['kai-kunstmann']
draft: false
description: 'Am 15. Juli 2020 verschafften sich Angreifer per Telefon Zugang zu Twitter, übernahmen die verifizierten Konten von Obama, Biden, Musk, Gates, Apple und Uber und führten einen Bitcoin-Verdopplungsbetrug durch – mit einer Beute von rund 118.000 US-Dollar. Eine Tiefenanalyse, wie die Kontrolle über eine Online-Identität gestohlen wurde und was das für den Besitz eines Namens bedeutet.'
keywords: ['Twitter-Hack 2020', 'Twitter Bitcoin-Betrug', 'Graham Ivan Clark', 'Vishing', 'telefonisches Spear-Phishing', 'Social Engineering', 'Kontoübernahme', 'Online-Identitätssicherheit', 'Übernahme verifizierter Konten', 'Twitter Admin-Tool', 'Agent-Tool', 'Insider-Risiko', 'Domain-Sicherheit', 'NY DFS Twitter-Bericht']
relatedArticles:
  - /de/blog/the-bitcoin-org-dns-hijack/
  - /de/blog/the-godaddy-multi-year-breach/
  - /de/blog/the-2024-squarespace-defi-domain-hijacks/
  - /de/blog/the-12-dollar-minute-someone-owned-google-com/
  - /de/blog/the-fox-it-dns-hijack/
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
  - /de/glossary/tld/
  - /de/glossary/web3/
---

Für ein paar Stunden an einem Mittwochnachmittag sagten die vertrauenswürdigsten Stimmen im Internet plötzlich alle dasselbe: Schick mir Bitcoin, und ich schicke dir das Doppelte zurück.

Barack Obama sagte es. Joe Biden sagte es. Elon Musk sagte es. Bill Gates, Jeff Bezos, Kanye West, Apple, Uber — die mit blauem Haken verifizierten Konten, denen Hunderte von Millionen Menschen vertrauen gelernt hatten, posteten alle denselben plumpen Krypto-Betrug, fast Wort für Wort. Keiner dieser Menschen hatte auch nur ein einziges Zeichen eingegeben. Ihre *Konten* taten es, weil jemand anderes die Schlüssel in der Hand hielt.

Dies ist **Domain Mayday EP03**. Die ersten beiden Episoden handelten von Namen — wer sie besitzt, wer sie nehmen kann. Diese hier stellt dieselbe Frage in anderem Gewand. Ein Twitter-Handle, ein verifiziertes Abzeichen, ein Domainname: Jedes ist ein Identitätsanspruch, dem wir anderen auf Treu und Glauben vertrauen. Und am 15. Juli 2020 bewiesen Angreifer, wie wenig es braucht, um diesen Anspruch zu kapern — nicht mit Malware oder einem Zero-Day, sondern mit einem Telefonanruf.

## Das Vertrauen, das in einem Handle steckt

Ein verifiziertes Konto ist eine Vertrauensabkürzung. Wenn `@BarackObama` etwas postet, prüft man nicht erneut, ob er es wirklich ist; der Handle plus das Abzeichen *ist* die Verifikation. Diese Abkürzung ist enorm wertvoll — und enorm zerbrechlich, denn das gesamte Vertrauen konzentriert sich auf das Konto, während die Kontrolle über das Konto ganz woanders liegen kann.

Das ist dieselbe Struktur wie bei einem Domainnamen. `whitehouse.gov` wird vertraut, nicht weil jeder Besucher die Zertifikatskette prüft, sondern weil der Name selbst Autorität trägt. Wer diesen Namen kontrolliert — beim [Registrar](/de/glossary/registrar/), im [DNS](/de/glossary/dns/), im Admin-Panel — erbt sofort all das Vertrauen, das Menschen in ihn investiert haben, egal ob er ihm je gehörte.

Der Twitter-Hack von 2020 ist die klarste Demonstration dieser Lücke zwischen *Vertrauen* und *Kontrolle*, die wir haben. New Yorks Finanzaufsicht, die ermittelte, weil regulierte Krypto-Unternehmen zu den Opfern zählten, sagte es unverblümt: Der Angriff war "[eine Warnung vor dem außerordentlichen Schaden, den selbst unsophistizierte Cyberkriminelle anrichten können](https://www.dfs.ny.gov/Twitter_Report#:~:text=The%20Twitter%20Hack%20is%20a%20cautionary%20tale%20about%20the%20extraordinary%20damage%20that%20can%20be%20caused%20even%20by%20unsophisticated%20cybercriminals)."

## 15. Juli 2020: die Übernahme

![Lebendige, farbenfrohe Konzeptkunst eines einzelnen leuchtenden Hauptschlüssels, der eine riesige Wand identischer generischer blauer verifizierter Abzeichen öffnet, wobei jedes Abzeichen der Reihe nach aufspringt](../../assets/the-2020-twitter-bitcoin-account-takeover-01-takeover.jpg)

Es geschah schnell und am helllichten Tag. Laut der Wikipedia-Rekonstruktion wurden "[am 15. Juli 2020 zwischen 20:00 und 22:00 UTC 130 hochkarätige Twitter-Konten kompromittiert](https://en.wikipedia.org/wiki/2020_Twitter_account_hijacking#:~:text=On%20July%2015%2C%202020%2C%20between%2020%3A00%20and%2022%3A00%20UTC%2C%20130%20high%2Dprofile%20Twitter%20accounts%20were%20compromised)."

Der Bericht des New York Department of Financial Services (DFS) legt die Choreographie dar. Die Angreifer wärmten sich zunächst mit Krypto auf: "[Die Hacker manipulierten zuerst Twitter-Konten, die mit bekannten Kryptowährungsunternehmen und -personen verbunden waren](https://www.dfs.ny.gov/Twitter_Report#:~:text=The%20Hackers%20first%20manipulated%20Twitter%20accounts%20connected%20to%20well%2Dknown%20cryptocurrency%20companies%20and%20individuals)," und platzierten Direktnachrichten und Tweets, die auf eine Bitcoin-[Wallet](/de/glossary/wallet/) verwiesen. Dann erhöhten sie den Einsatz: "[Die Hacker erhöhten daraufhin den Einsatz erheblich und zielten auf verifizierte Twitter-Konten mit Millionen von Followern](https://www.dfs.ny.gov/Twitter_Report#:~:text=The%20Hackers%20then%20raised%20the%20stakes%20significantly%20and%20targeted%20verified%20Twitter%20accounts%20with%20millions%20of%20followers)."

Die Liste der Betroffenen liest sich wie die Gästeliste der vertrauenswürdigsten Konten der Plattform. Wikipedia vermerkt, dass die "[angeblich kompromittierten Konten solche bekannter Persönlichkeiten wie Barack Obama, Joe Biden, Bill Gates, Jeff Bezos...und Unternehmen wie Apple, Uber und Cash App umfassten](https://en.wikipedia.org/wiki/2020_Twitter_account_hijacking#:~:text=well%2Dknown%20individuals%20such%20as%20Barack%20Obama%2C%20Joe%20Biden%2C%20Bill%20Gates%2C%20Jeff%20Bezos)."

Die Nachricht war identisch und absurd einfach. Vom Konto von Apple, wie von Wikipedia festgehalten: "[Wir geben etwas an unsere Community zurück. Wir unterstützen Bitcoin und glauben, dass ihr das auch solltet! Alle Bitcoin, die an unsere Adressen gesendet werden, werden verdoppelt zurückgeschickt!](https://en.wikipedia.org/wiki/2020_Twitter_account_hijacking#:~:text=We%20are%20giving%20back%20to%20our%20community.%20We%20support%20Bitcoin%20and%20believe%20you%20should%20too!%20All%20Bitcoin%20sent%20to%20our%20addresses%20will%20be%20sent%20back%20to%20you%2C%20doubled!)" Dasselbe Angebot, wiederholt durch Dutzende der glaubwürdigsten Stimmen der Welt auf einmal.

Nicht jedes Konto wurde genutzt. Von den 130 berührten Konten stellte der Regulator fest: "[Insgesamt wurden während des Twitter-Hacks 130 Twitter-Nutzerkonten kompromittiert. Davon wurden 45 Konten zum Versenden von Tweets genutzt](https://www.dfs.ny.gov/Twitter_Report#:~:text=Overall%2C%20130%20Twitter%20user%20accounts%20were%20compromised%20during%20the%20Twitter%20Hack.%20Of%20those%2C%2045%20accounts%20were%20used%20to%20send%20tweets)." Fünfundvierzig Megafone waren mehr als genug.

## Was tatsächlich verloren ging

In reinen Dollar-Beträgen war die Beute klein. Der DFS-Bericht stellt fest, dass "[Hacker durch den Twitter-Hack Bitcoin im Wert von etwa 118.000 US-Dollar stahlen](https://www.dfs.ny.gov/Twitter_Report#:~:text=The%20Hackers%20stole%20approximately%20%24118%2C000%20worth%20of%20bitcoin%20through%20the%20Twitter%20Hack)." Wikipedia vermerkt, dass eine einzelne Betrugs-Wallet "[über 320 Einzahlungen mit einem Wert von über 110.000 US-Dollar erhielt, bevor die Betrugsnachrichten entfernt wurden](https://en.wikipedia.org/wiki/2020_Twitter_account_hijacking#:~:text=received%20over%20320%20deposits%20with%20a%20value%20of%20over%20US%24110%2C000%20before%20the%20scam%20messages%20were%20removed)." Für einen Einbruch dieses Ausmaßes sind 118.000 US-Dollar fast peinlich bescheiden.

Aber die Dollarzahl unterschätzt den Verlust erheblich. Was an jenem Nachmittag tatsächlich fiel, war die *Integrität des verifizierten Handles als Vertrauenssignal*. Zwei Stunden lang bewies ein blauer Haken nichts. Die gesamte Identitätsschicht der Plattform — das, was einen glauben ließ, ein Tweet komme von der Person, deren Name draufstand — war nachweislich und gleichzeitig von einem Teenager kontrollierbar. Twitters Reaktion war bezeichnend: Das Unternehmen fror vorübergehend die Möglichkeit vieler verifizierter Konten ein, überhaupt zu twittern. Der einzige Weg, die vertrauenswürdigen Konten daran zu hindern, zu lügen, war, sie zum Schweigen zu bringen.

Das ist der wahre Preis einer Identitätsübernahme. Das Geld ist eine Fußnote. Der Schaden besteht darin, dass "dieses Konto = diese Person" aufhört, wahr zu sein, und alle Nachgelagerten, die sich auf diese Gleichung verlassen haben, exponiert werden.

## Wie es geschah: ein Telefonanruf, dann ein Admin-Panel

![Lebendige, farbenfrohe Konzeptkunst eines Telefonhörers, der wie eine Angelrute geworfen wird und dessen Haken das Dashboard eines leuchtenden internen Kontrollpanels voller Schalter und Umschalter einhakt](../../assets/the-2020-twitter-bitcoin-account-takeover-02-vishing.jpg)

Es gab keinen Exploit. Der DFS-Bericht ist eindeutig: "[Der Twitter-Hack beinhaltete keine der High-Tech- oder anspruchsvollen Techniken, die bei Cyberangriffen häufig eingesetzt werden – keine Malware, keine Exploits und keine Backdoors](https://www.dfs.ny.gov/Twitter_Report#:~:text=The%20Twitter%20Hack%20did%20not%20involve%20any%20of%20the%20high%2Dtech%20or%20sophisticated%20techniques%20often%20used%20in%20cyberattacks%20%E2%80%93%20no%20malware%2C%20no%20exploits%2C%20and%20no%20backdoors)." Stattdessen "[nutzten die Hacker grundlegende Techniken, die eher denen eines traditionellen Betrügers ähneln: Telefonanrufe, bei denen sie vorgaben, von der IT-Abteilung von Twitter zu sein](https://www.dfs.ny.gov/Twitter_Report#:~:text=The%20Hackers%20used%20basic%20techniques%20more%20akin%20to%20those%20of%20a%20traditional%20scam%20artist%3A%20phone%20calls%20where%20they%20pretended%20to%20be%20from%20Twitter%E2%80%99s%20Information%20Technology%20department)."

Dies ist **Vishing** — Voice-[Phishing](/de/glossary/phishing/). Die Angreifer "[riefen mehrere Twitter-Mitarbeiter an und behaupteten, vom Help Desk in Twitters IT-Abteilung zu sein](https://www.dfs.ny.gov/Twitter_Report#:~:text=called%20several%20Twitter%20employees%20and%20claimed%20to%20be%20calling%20from%20the%20Help%20Desk%20in%20Twitter%E2%80%99s%20IT%20department)," und "[behaupteten, sie würden auf ein gemeldetes Problem des Mitarbeiters mit Twitters Virtual Private Network reagieren](https://www.dfs.ny.gov/Twitter_Report#:~:text=claimed%20they%20were%20responding%20to%20a%20reported%20problem%20the%20employee%20was%20having%20with%20Twitter%E2%80%99s%20Virtual%20Private%20Network)." Twitter selbst bezeichnete es später als "[telefonischen Spear-Phishing-Angriff](https://krebsonsecurity.com/2020/07/three-charged-in-july-15-twitter-compromise/#:~:text=phone%20spear%20phishing%20attack)", der auf "[einen erheblichen und konzertierten Versuch stützte, bestimmte Mitarbeiter irrezuführen und menschliche Schwachstellen auszunutzen](https://krebsonsecurity.com/2020/07/three-charged-in-july-15-twitter-compromise/#:~:text=a%20significant%20and%20concerted%20attempt%20to%20mislead%20certain%20employees%20and%20exploit%20human%20vulnerabilities)."

Das Überzeugungsmittel war Recherche, keine technische Fähigkeit. Wie der Sicherheitsjournalist Brian Krebs dokumentierte, stützten sich die Angreifer auf Profildaten — Namen, Rollen, persönliche Details, die von LinkedIn und früheren Datenlecks stammten — um wie echte Kollegen zu klingen. Sobald ein Mitarbeiter dem Anrufer glaubte, übergab er Anmeldedaten, und die Anmeldedaten öffneten die Tür zum Hauptgewinn: Twitters internes Kontoverwaltungs-Tool.

Dieses Tool ist der Kern der gesamten Geschichte. Krebs berichtete, dass "[in Twitters Admin-Tools offenbar die E-Mail-Adresse eines beliebigen Twitter-Nutzers aktualisiert werden kann](https://krebsonsecurity.com/2020/07/whos-behind-wednesdays-epic-twitter-hack/#:~:text=within%20Twitter%E2%80%99s%20admin%20tools%2C%20apparently%20you%20can%20update%20the%20email%20address%20of%20any%20Twitter%20user)" — die E-Mail ändern, einen Passwort-Reset auslösen, und das Konto gehört einem, Abzeichen und alles. Der DFS-Bericht zeigt das strukturelle Versagen auf, das einen geknackten Mitarbeiter so katastrophal machte: "[Twitter hatte zwar den Zugang zu den internen Tools eingeschränkt, aber über 1.000 Twitter-Mitarbeiter hatten noch immer Zugang dazu](https://www.dfs.ny.gov/Twitter_Report#:~:text=Twitter%20did%20limit%20access%20to%20the%20internal%20tools%2C%20but%20over%201%2C000%20Twitter%20employees%20still%20had%20access%20to%20them)." Über tausend Personen hielten einen Hauptschlüssel zu jeder Identität auf der Plattform, und das Unternehmen hatte keinen Chief Information Security Officer, der darüber wachte — Twitter "[hatte seit Dezember 2019, sieben Monate vor dem Twitter-Hack, keinen Chief Information Security Officer ('CISO') mehr](https://www.dfs.ny.gov/Twitter_Report#:~:text=had%20not%20had%20a%20chief%20information%20security%20officer%20(%E2%80%9CCISO%E2%80%9D)%20since%20December%202019%2C%20seven%20months%20before%20the%20Twitter%20Hack)."

Darunter lag auch ein [Marktplatz](/de/glossary/marketplace/). Bevor der Promi-Betrug losging, war die Gruppe damit beschäftigt, gestohlene kurze "OG"-Handles zu verkaufen. Krebs stellte fest, dass vor dem Obama/Biden/Musk/Gates-Blast "[mehrere äußerst begehrte kurzzeichige Twitter-Kontonamen die Besitzer wechselten](https://krebsonsecurity.com/2020/07/whos-behind-wednesdays-epic-twitter-hack/#:~:text=several%20highly%20desirable%20short%2Dcharacter%20Twitter%20account%20names%20changed%20hands)," denn in dieser Community "[verleihen kurzzeichige Profilnamen ein Maß an Status und Wohlstand](https://krebsonsecurity.com/2020/07/twitter-hacking-for-profit-and-the-lols/#:~:text=short%2Dcharacter%20profile%20names%20confer%20a%20measure%20of%20status%20and%20wealth)" und "[können beim Wiederverkauf oft Tausende von Dollar einbringen](https://krebsonsecurity.com/2020/07/twitter-hacking-for-profit-and-the-lols/#:~:text=can%20often%20fetch%20thousands%20of%20dollars%20when%20resold)." Namen mit Seltenheitswert, gestohlen und auf einem Forum weiterverkauft — ein Muster, das jeder Domain-Investor sofort erkennen wird.

## Das Nachspiel und die Verhaftungen

Die Auflösung erfolgte fast genauso schnell wie der Hack. Innerhalb von zwei Wochen handelten die Staatsanwälte. Krebs berichtete über die Anklagen: "[Mason 'Chaewon' Sheppard, ein 19-Jähriger aus Bognor Regis, Großbritannien, wurde in Kalifornien wegen Verschwörung zum Betrug mittels Datenübertragung, Geldwäsche und unbefugtem Zugang zu einem Computer angeklagt](https://krebsonsecurity.com/2020/07/three-charged-in-july-15-twitter-compromise/#:~:text=Mason%20%E2%80%9CChaewon%E2%80%9D%20Sheppard%2C%20a%2019%2Dyear%2Dold%20from%20Bognor%20Regis%2C%20U.K.%2C%20also%20was%20charged%20in%20California%20with%20conspiracy%20to%20commit%20wire%20fraud%2C%20money%20laundering%20and%20unauthorized%20access%20to%20a%20computer)," und "[Nima 'Rolex' Fazeli, ein 22-Jähriger aus Orlando, Florida, wurde in einer Strafklage in Nordkalifornien wegen Beihilfe zum vorsätzlichen Zugang zu einem geschützten Computer angeklagt](https://krebsonsecurity.com/2020/07/three-charged-in-july-15-twitter-compromise/#:~:text=Nima%20%E2%80%9CRolex%E2%80%9D%20Fazeli%2C%20a%2022%2Dyear%2Dold%20from%20Orlando%2C%20Fla.%2C%20was%20charged%20in%20a%20criminal%20complaint%20in%20Northern%20California%20with%20aiding%20and%20abetting%20intentional%20access%20to%20a%20protected%20computer)."

Aber der mutmaßliche Anführer war noch jünger. "[Der 17-jährige Graham Clark aus Tampa, Florida, gehörte zu den Angeklagten im Twitter-Hack vom 15. Juli](https://krebsonsecurity.com/2020/07/three-charged-in-july-15-twitter-compromise/#:~:text=17%2Dyear%2Dold%20Graham%20Clark%20of%20Tampa%2C%20Fla.%20was%20among%20those%20charged%20in%20the%20July%2015%20Twitter%20hack)," und als Minderjähriger wurde er vom Staatsanwalt Floridas statt von einem Bundesgericht angeklagt. Ihm "[wurden 30 Verbrechen vorgeworfen, darunter organisierter Betrug und Kommunikationsbetrug](https://krebsonsecurity.com/2020/07/three-charged-in-july-15-twitter-compromise/#:~:text=was%20hit%20with%2030%20felony%20charges%2C%20including%20organized%20fraud%2C%20communications%20fraud)."

Im folgenden März einigte sich Clark auf einen Deal. CyberScoop berichtete, er "[habe zugegeben, hinter einem Plan zu stehen, bei dem er mehr als 117.000 US-Dollar gestohlen hatte, indem er die Twitter-Konten zahlreicher Persönlichkeiten des öffentlichen Lebens übernahm](https://cyberscoop.com/twitter-hack-guilty-plea-graham-ivan-clark/#:~:text=admitted%20to%20being%20behind%20a%20scheme%20that%20saw%20him%20steal%20more%20than%20%24117%2C000%20by%20taking%20over%20the%20Twitter%20accounts%20of%20numerous%20public%20figures)." Der öffentliche Radiosender WUSF berichtete über das Urteil: "[drei Jahre in einer Jugendhaftanstalt, gefolgt von drei Jahren Bewährung](https://www.wusf.org/courts-law/2021-03-16/tampa-twitter-hacker-sentenced-to-three-years-in-prison-three-years-probation#:~:text=three%20years%20in%20a%20juvenile%20facility%20to%20be%20followed%20by%20three%20years%20of%20probation)," was laut dem Sender "[das nach dem Jugendstraftätergesetz des Bundesstaates maximal Zulässige war](https://www.wusf.org/courts-law/2021-03-16/tampa-twitter-hacker-sentenced-to-three-years-in-prison-three-years-probation#:~:text=the%20maximum%20allowed%20under%20the%20state%E2%80%99s%20youthful%20offender%20law)."

Eine vierte Person tauchte später auf. Wikipedia vermerkt, dass "[im April 2023 der 23-jährige Joseph James O'Connor, ein britischer Staatsbürger mit dem Online-Handle PlugwalkJoe, aus Spanien nach New York ausgeliefert wurde, um sich dort Anklagen zu stellen](https://en.wikipedia.org/wiki/2020_Twitter_account_hijacking#:~:text=In%20April%202023%2C%2023%2Dyear%2Dold%20Joseph%20James%20O%E2%80%99Connor%2C%20a%20British%20citizen%20with%20the%20online%20handle%20PlugwalkJoe%2C%20was%20extradited%20from%20Spain)," und er wurde später zu fünf Jahren Bundesgefängnis verurteilt.

## Was das über die Kontrolle von Online-Identitäten lehrt

Zieht man die Promisnamen und die Kryptowährung ab, ist der Twitter-Hack von 2020 eine reine Lektion über den Unterschied zwischen dem *Haben* einer Identität und dem *Kontrollieren* einer Identität. Einige Grundsätze lassen sich daraus ableiten:

1. **Vertrauen akkumuliert sich auf dem Namen; Kontrolle lebt im Hinterzimmer.** Hunderte von Millionen Menschen vertrauten `@BarackObama`. Dieses Vertrauen schützte das Konto nicht, weil die Kontrolloberfläche des Kontos ein internes Admin-Panel war, das über tausend Mitarbeiter erreichen konnten. Wer das Hinterzimmer kontrolliert, kontrolliert die Identität, egal wessen Name vorne draufsteht.

2. **Das schwächste Glied ist fast nie die Kryptografie.** Kein Exploit, keine Malware, keine Backdoor — nur ein überzeugender Telefonanruf. Identitätssysteme versagen auf der menschlichen und Prozessebene weitaus häufiger als auf der mathematischen Ebene. Ein perfektes Schloss an einer Tür, die jeder hilfsbereite Mitarbeiter auf Anfrage öffnet, ist kein Schloss.

3. **Ein einzelner totaler Kontrollpunkt ist ein einzelner totaler Ausfallpunkt.** Ein einziges wiederverwendbares internes Tool, das die E-Mail bei *jedem* Konto ändern konnte, bedeutete, dass ein kompromittierter Mitarbeiter einer plattformweiten Übernahme gleichkam. Konzentrierte, reversible, undurchsichtige Kontrolle ist die Schwachstelle.

4. **Seltene Namen sind Ziele.** Dieselbe Gruppe, die Präsidenten entführte, verkaufte auch still und leise kurze "OG"-Handles für Tausende von Dollar. Wertvolle Namen ziehen Diebstahl an, und der Wert eines Namens ist genau das, was seine Kontrolle stehlenswert macht.

5. **Die Wiederherstellung sollte nicht von der Gnade der Plattform abhängen.** Als die vertrauenswürdigen Konten anfingen zu lügen, war Twitters einziger Hebel, sie einzufrieren. Identitätsinhaber hatten keine unabhängige Möglichkeit zu beweisen "das bin wirklich ich" oder die Kontrolle zurückzugewinnen — sie waren vollständig von den internen Tools und dem guten Willen eines zentralisierten Betreibers abhängig.

## Der Namefi-Blickwinkel

![Farbenfrohe Illustration von verifizierbarem, manipulationssicherem Besitz einer Online-Identität — gesichert durch ein grünes Schild, ein grünes Namefi-Token und Kontinuität](../../assets/the-2020-twitter-bitcoin-account-takeover-03-namefi-angle.jpg)

Ein Domainname ist eine Online-Identität mit genau derselben Lücke zwischen Vertrauen und Kontrolle, die Twitters verifizierte Handles hatten — und oft mit demselben undurchsichtigen Hinterzimmer. Bei den meisten Domains lebt das "Eigentum" in einem Registrar-Konto, das durch ein Passwort und ein Support-Team geschützt ist. Ein überzeugender Telefonanruf, ein per Social Engineering manipulierter Support-Mitarbeiter, eine E-Mail-Änderung, die über ein internes Panel durchgeführt wird — das Drehbuch des Twitter-Hacks von 2020 lässt sich nahezu eins zu eins auf eine Registrar-Kontoübernahme übertragen. Das Vertrauen, das die Welt in Ihre Domain gesetzt hat, schützt sie nicht, wenn die Kontrolle über diese Domain hinter einem Help Desk liegt, der sich zu allem überreden lässt.

[Namefi](https://namefi.io) existiert, um diese Lücke zu schließen. Der Kerngedanke ist, dass die Kontrolle über eine Domain *verifizierbar und beim Eigentümer* liegen sollte, nicht als Einstellung in jemandem anderen Admin-Tool. Indem Namefi den Domain-Besitz als tokenisierten, on-chain gespeicherten Vermögenswert darstellt, der mit DNS kompatibel bleibt, macht es die Frage "Wer kontrolliert diesen Namen?" kryptografisch beantwortbar — nicht durch das Urteil eines Support-Mitarbeiters unter Druck. Es gibt kein einzelnes internes Panel, das tausend Mitarbeiter erreichen können, um Ihren Namen stillschweigend neu zuzuweisen; der Nachweis der Kontrolle liegt beim Eigentümer, und Übertragungen sind nachvollziehbar statt improvisiert.

Der Twitter-Hack von 2020 funktionierte, weil Identität und Kontrolle still und leise auseinandergedriftet waren — der Name sagte eine Sache, während ein verstecktes Admin-Tool eine andere entschied. Die Lektion für jeden, der auf einen Namen angewiesen ist: Kontrolle sollte genauso lesbar und eigentümergebunden sein wie das Vertrauen, das der Name trägt. Ein Handle, ein Abzeichen, eine Domain: Jedes ist nur so sicher wie das Hinterzimmer dahinter. Namefis Wette ist, dass das Hinterzimmer ein verifizierbares Ledger sein sollte, das Sie kontrollieren, keine Telefonleitung, die jemand anderes dazu bringen kann, etwas zu tun.

## Quellen und weiterführende Lektüre

- New York Department of Financial Services — [Twitter Investigation Report](https://www.dfs.ny.gov/Twitter_Report)
- Wikipedia — [2020 Twitter account hijacking](https://en.wikipedia.org/wiki/2020_Twitter_account_hijacking)
- Krebs on Security — [Who's Behind Wednesday's Epic Twitter Hack?](https://krebsonsecurity.com/2020/07/whos-behind-wednesdays-epic-twitter-hack/)
- Krebs on Security — [Twitter Hacking for Profit and the LoLs](https://krebsonsecurity.com/2020/07/twitter-hacking-for-profit-and-the-lols/)
- Krebs on Security — [Three Charged in July 15 Twitter Compromise](https://krebsonsecurity.com/2020/07/three-charged-in-july-15-twitter-compromise/)
- CyberScoop — [Twitter hacker pleads guilty, sentenced to 3 years](https://cyberscoop.com/twitter-hack-guilty-plea-graham-ivan-clark/)
- WUSF — [Tampa Twitter Hacker Sentenced To Three Years In Prison, Three Years Probation](https://www.wusf.org/courts-law/2021-03-16/tampa-twitter-hacker-sentenced-to-three-years-in-prison-three-years-probation)
- U.S. Department of Justice — [Three Individuals Charged for Alleged Roles in Twitter Hack](https://www.justice.gov/usao-ndca/pr/three-individuals-charged-alleged-roles-twitter-hack)
- ABC News — [Florida man who pleaded guilty to hacking Twitter as 17-year-old sentenced to 3 years](https://abcnews.go.com/Politics/florida-man-pleaded-guilty-hacking-twitter-17-year/story?id=76513232)
