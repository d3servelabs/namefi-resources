---
title: 'Domain Mayday EP05: Der Squarespace-DeFi-Domain-Massenraub 2024'
date: '2026-06-17'
language: de
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['aileen-wright']
editors: ['victor-zhou']
draft: false
description: 'Im Juli 2024 verwandelte eine Registrar-Migration von Google Domains zu Squarespace schwache Standard-Authentifizierung in eine Massenangriffsfläche. Angreifer kaperten die Domains von Krypto- und DeFi-Projekten – Compound Finance, Celer Network, Pendle, Unstoppable Domains – und leiteten sie auf Wallet-Drainer-Phishing-Seiten um. So schuf eine „nahtlose" Migration hunderte ungesicherter Eingangstüren, und was das über Registrar-Sicherheit und MFA lehrt.'
keywords: ['squarespace domain hijack', 'google domains migration', 'defi dns hijack', 'compound finance hijack', 'celer network hijack', 'wallet drainer', 'inferno drainer', 'domain security', 'registrar migration', 'mfa multi-factor authentication', 'oauth account takeover', 'dns hijacking', 'crypto phishing']
relatedArticles:
  - /de/blog/the-curve-finance-dns-hijack/
  - /de/blog/the-badgerdao-frontend-attack/
  - /de/blog/the-fox-it-dns-hijack/
  - /de/blog/the-godaddy-multi-year-breach/
  - /de/blog/the-dnspionage-campaign/
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

Im Juli 2024 war das Gefährlichste an der Website eines Krypto-Projekts kein Smart-Contract-Fehler und kein durchgesickerter privater Schlüssel. Es war der [Registrar](/de/glossary/registrar/), dem die Domain gehörte.

Über mehrere Tage in jenem Monat landeten Nutzer, die eine vertraute Adresse in ihren Browser eingaben – die offizielle Website eines Kreditprotokolls, dem sie vertrauten, einer Brücke, die sie hundertmal benutzt hatten – genau dort, wo sie es erwarteten: auf einer Seite, die exakt richtig aussah, und sahen dann zu, wie ihre Wallets geleert wurden. Gehackt wurde im üblichen Sinne nichts. Niemand hatte ein Passwort geknackt oder eine [Seed-Phrase](/de/glossary/seed-phrase/) abgefischt. Die Angreifer waren schlicht durch die Eingangstür der *Domain* selbst spaziert, weil diese Tür während eines Firmenumzugs ungesperrt geblieben war, den die meisten dieser Projekte gar nicht bemerkt hatten.

Der Umzug war die Migration von Google Domains zu Squarespace. Die offene Tür waren die Standard-Authentifizierungseinstellungen von Squarespace. Das Ergebnis war eine koordinierte Welle von [DNS](/de/glossary/dns/)-Hijacks gegen Krypto- und [DeFi](/de/glossary/defi/)-Projekte, die – so ein Forscher – Milliarden von Dollar an Vermögenswerten kontrollierten.

## Wie eine Registrar-Migration eine Massenangriffsfläche schuf

Domains werden normalerweise nicht als Flotte betrachtet. Jede einzelne fühlt sich wie etwas Persönliches an – Ihre Adresse, Ihr Kontrollpanel, Ihre DNS-Einträge. Aber Registrare halten sie in großer Zahl, und wenn der gesamte Kundenstamm eines Registrars zu einem anderen wechselt, folgen alle Konten derselben Migrationslogik, mit denselben Standardeinstellungen, zur selben Zeit. Welche Schwäche auch immer in dieser Logik steckt, ist kein Einzelfehler. Sie ist eine Eigenschaft der gesamten Flotte.

Genau das machte den Vorfall von 2024 zu einem *Massenereignis* und nicht zu einer Reihe von Einzelpech-Kompromittierungen.

Im Juni 2023 [kaufte Squarespace rund 10 Millionen Domainnamen von Google Domains](https://krebsonsecurity.com/2024/07/researchers-weak-security-defaults-enabled-squarespace-domains-hijacks/#:~:text=Squarespace%20purchased%20roughly%2010%20million%20domain%20names%20from%20Google%20Domains%20in%20June%202023), nachdem Google angekündigt hatte, seinen Registrar zu schließen. Im darauffolgenden Jahr [migrierte Squarespace die Nutzer für rund 10 Millionen Domainnamen, die im Rahmen der Transaktion erworben wurden](https://www.securityweek.com/hackers-exploit-flaw-in-squarespace-migration-to-hijack-domains/#:~:text=Squarespace%20has%20been%20migrating%20users%20for%20roughly%2010%20million%20domain%20names%20purchased%20in%20the%20transaction). Damit der Übergang nahtlos wirkte, legte Squarespace vorab Konten für die Personen an, die mit jeder migrierten Domain verknüpft waren, unter Verwendung der E-Mail-Adressen, die Google gespeichert hatte.

Nahtlos war genau das Problem. Eine Migration, die dem Nutzer nichts abverlangt, ist eine Migration, bei der der Nutzer nichts bewiesen hat – weder sein Passwort noch seine Identität noch seine Kontrolle über die E-Mail-Adresse. Die Konten existierten, die Domains waren verknüpft, und das Einzige, was zwischen einer Domain und demjenigen stand, der als Erster auftauchte, war ein Anmeldebildschirm, der für diese migrierten Konten fast nichts verlangte.

## Die Hijacks im Juli 2024

![Lebhafte, farbenfrohe Konzeptkunst-Illustration einer Massenmigration von Domain-Hausschlüsseln, die aus einem Umzugslaster fallen, wobei einige Schlüssel in schattige, ausgestreckte Hände gleiten, und eine Reihe kleiner Häuser, die jeweils mit einer leuchtenden Webadresse beschriftet sind](../../assets/the-2024-squarespace-defi-domain-hijacks-01-mass-hijack.jpg)

[Die Angriffe begannen am 9. Juli](https://www.securityweek.com/hackers-exploit-flaw-in-squarespace-migration-to-hijack-domains/#:~:text=The%20attacks%20started%20on%20July%209) und zogen sich über die folgenden Tage hin. Sie waren nicht subtil. Eine [Welle koordinierter DNS-Hijacking-Angriffe richtete sich gegen Domains von dezentralen Finanz- (DeFi) Kryptowährungsplattformen, die den Registrar Squarespace nutzten, und leitete Besucher auf Phishing-Seiten mit Wallet-Drainern um](https://www.bleepingcomputer.com/news/security/dns-hijacks-target-crypto-platforms-registered-with-squarespace/#:~:text=A%20wave%20of%20coordinated%20DNS%20hijacking%20attacks%20targets%20decentralized%20finance%20%28DeFi%29%20cryptocurrency%20domains%20using%20the%20Squarespace%20registrar%2C%20redirecting%20visitors%20to%20phishing%20sites%20hosting%20wallet%20drainers), wie BleepingComputer berichtete.

Der erste, der für Aufmerksamkeit sorgte, war einer der bekanntesten Namen im DeFi-Kreditwesen. Das Sicherheitsunternehmen Blockaid, das den Vorfall untersuchte, stellte fest, dass [Besucher dieser Seiten auf bösartige Seiten umgeleitet wurden, die darauf ausgelegt waren, Gelder aus verbundenen Wallets abzuziehen](https://www.blockaid.io/blog/squarespace-defi-domain-hijack-incident#:~:text=Visitors%20to%20these%20sites%20were%20being%20redirected%20to%20malicious%20pages%20designed%20to%20drain%20funds%20from%20connected%20wallets). Die gefälschten Seiten waren keine plumpen Fälschungen. Laut Blockaid [verwendeten diese gefälschten dApps die neueste Version des Inferno-Drainer-Kits, das Nutzer dazu verleiten soll, Transaktionen zu unterzeichnen, die ihre Wallets leeren](https://www.blockaid.io/blog/squarespace-defi-domain-hijack-incident#:~:text=These%20fake%20dApps%20were%20running%20the%20latest%20iteration%20of%20the%20Inferno%20draining%20kit%2C%20designed%20to%20trick%20users%20into%20signing%20transactions%20that%20would%20empty%20their%20wallets).

Die Liste der bestätigten Opfer las sich wie ein Aufmarsch des Ökosystems. Zu den gekaperten Entitäten gehörten [Celer Network, Compound Finance, Pendle Finance und Unstoppable Domains](https://krebsonsecurity.com/2024/07/researchers-weak-security-defaults-enabled-squarespace-domains-hijacks/#:~:text=Celer%20Network%2C%20Compound%20Finance%2C%20Pendle%20Finance%2C%20and%20Unstoppable%20Domains). Bei Compound [wurde die Hauptdomain übernommen, um eine Phishing-Seite anzuzeigen](https://www.bleepingcomputer.com/news/security/dns-hijacks-target-crypto-platforms-registered-with-squarespace/#:~:text=its%20main%20domain%20had%20been%20taken%20over%20to%20display%20a%20phishing%20page). Celer entdeckte den Versuch und [stellte seine DNS-Einträge schnell wieder her](https://www.bleepingcomputer.com/news/security/dns-hijacks-target-crypto-platforms-registered-with-squarespace/#:~:text=swiftly%20recovered%20its%20DNS%20records); Pendle [hatte ähnliche Probleme](https://www.bleepingcomputer.com/news/security/dns-hijacks-target-crypto-platforms-registered-with-squarespace/#:~:text=experienced%20similar%20issues) und warnte seine Nutzer, Wallet-Freigaben zu widerrufen.

## Was auf dem Spiel stand – und was Nutzer verloren

Die Grausamkeit eines Domain-Hijacks besteht darin, dass er jede Gewohnheit unterläuft, auf die Nutzer trainiert wurden. Überprüfen Sie die URL. Stellen Sie sicher, dass es die echte Seite ist. Achten Sie auf das Schlosssymbol. All dieser Rat setzt voraus, dass die Domain noch dorthin zeigt, wo sie soll. Wenn der Angreifer die DNS der Domain kontrolliert, ist die URL *echt* – es ist die genuine Adresse des Projekts – und sie löst zum Server des Angreifers auf. Das Schloss ist grün. Die Adressleiste lügt nicht. Die Seite ist eine Falle.

Deshalb passen Wallet-Drainer-Kits wie Inferno so gut zu [DNS-Hijacking](/de/glossary/dns-hijacking/). Der Drainer muss kein Passwort stehlen; er braucht das Opfer dazu, eine *Wallet zu verbinden und zu unterzeichnen*. Und ein Nutzer, der die echte Domain seines Kreditprotokolls aufgerufen hat, hat keinen Grund zu zögern, bevor er eine Transaktion genehmigt. Die [Phishing](/de/glossary/phishing/)-Seite erbt das gesamte Vertrauen, das die legitime Domain über Jahre aufgebaut hat.

Wie schlimm hätte es werden können? Die Zahl, die das Ausmaß verdeutlichte, war nicht die Anzahl der bestätigten Diebstähle, sondern die Anzahl der *exponierten* Projekte. Blockaid's Analyse, von Decrypt berichtet, war unmissverständlich: [rund 228 DeFi-Protokoll-Frontends sind noch immer gefährdet](https://decrypt.co/239524/220-defi-protocols-risk-squarespace-dns-hijack#:~:text=roughly%20228%20DeFi%20protocol%20front%20ends%20are%20still%20at%20risk), weil jedes einzelne hinter derselben Schwachstelle der migrierten Konten saß. Die tatsächlichen Hijacks waren nur eine Stichprobe. Die Angriffsfläche war die gesamte Krypto-Gemeinschaft, die die Google-zu-Squarespace-Migration mitgemacht hatte.

## Wie es passierte: der Authentifizierungsfehler der Migration

![Lebhafte, farbenfrohe Konzeptkunst-Illustration einer langen Reihe von Briefkästen vor einem neuen Gebäude, wobei jede Briefkastentür offen und ungesperrt hängt, eine gesichtslose Figur leise einen Brief in einen einwirft, bevor der rechtmäßige Eigentümer eintrifft, Kontrast zwischen warmem und kaltem Licht](../../assets/the-2024-squarespace-defi-domain-hijacks-02-migration-flaw.jpg)

Der Mechanismus war, nachdem Forscher ihn rekonstruiert hatten, fast beschämend einfach – was ihn im großen Maßstab gefährlich machte.

Beginnen wir mit zwei Gestaltungsentscheidungen. Erstens überprüfte Squarespace nicht, ob die Person, die sich anmeldete, tatsächlich die Kontrolle über die E-Mail-Adresse des Kontos hatte. Wie die Forscher es formulierten, [verlangt Squarespace keine E-Mail-Verifizierung für neue Konten, die mit einem Passwort erstellt werden](https://socket.dev/blog/squarespace-domain-hijacks-enabled-by-email-address-exploit-on-migrated-accounts#:~:text=Squarespace%20doesn%27t%20require%20email%20verification%20for%20new%20accounts%20created%20with%20a%20password). Zweitens waren die migrierten Konten zwar vorab angelegt, aber noch nicht beansprucht worden – sie hatten kein Passwort. Wenn also jemand mit der richtigen E-Mail-Adresse auftauchte, [da kein Passwort auf dem Konto vorhanden ist, wird man direkt zum Ablauf „Passwort für Ihr neues Konto erstellen" weitergeleitet](https://krebsonsecurity.com/2024/07/researchers-weak-security-defaults-enabled-squarespace-domains-hijacks/#:~:text=since%20there%27s%20no%20password%20on%20the%20account%2C%20it%20just%20shoots%20them%20to%20the).

Diese beiden Punkte zusammen, und der Angriff schreibt sich von selbst. Die E-Mail-Adressen, die mit migrierten Domains verknüpft waren, waren kein Geheimnis – Admin- und Registranten-Kontakte sind oft öffentlich oder erraten. Ein Angreifer, der das Konto einfach zuerst registrierte, mit einer bekannten migrierten E-Mail, bevor der echte Eigentümer sich jemals anmeldete, hatte damit die Kontrolle über die Domain. MetaMask-Leiterin für Produktmanagement Taylor Monahan, eine der Forscherinnen, die den Vorfall untersuchte, beschrieb den blinden Fleck präzise: [Squarespace hat nie die Möglichkeit berücksichtigt, dass ein Bedrohungsakteur sich für ein Konto mit einer E-Mail-Adresse anmelden könnte, die mit einer kürzlich migrierten Domain verknüpft ist, bevor der legitime E-Mail-Inhaber das Konto selbst erstellt](https://krebsonsecurity.com/2024/07/researchers-weak-security-defaults-enabled-squarespace-domains-hijacks/#:~:text=Squarespace%20never%20accounted%20for%20the%20possibility%20that%20a%20threat%20actor%20might%20sign%20up%20for%20an%20account%20using%20an%20email%20associated%20with%20a%20recently%2Dmigrated%20domain%20before%20the%20legitimate%20email%20holder%20created%20the%20account%20themselves).

Warum gab es die Vorab-Verknüpfung überhaupt? Der Bequemlichkeit halber. Die Forscher kamen zu dem Schluss, dass [Squarespace davon ausging, alle von Google Domains migrierenden Nutzer würden die Social-Login-Optionen wählen](https://krebsonsecurity.com/2024/07/researchers-weak-security-defaults-enabled-squarespace-domains-hijacks/#:~:text=Squarespace%20assumed%20all%20users%20migrating%20from%20Google%20Domains%20would%20select%20the%20social%20login%20options) – Google OAuth – anstelle von E-Mail und Passwort. Das System [verknüpfte alle E-Mails vorab mit Domains, unabhängig davon, ob das Konto bereits existierte, wahrscheinlich weil man wollte, dass Nutzer sich per OAuth mit Google anmelden und sofort Zugang zu all ihren Domains haben](https://www.theregister.com/2024/07/15/squarespace_fingered_for_dns_hijackings/#:~:text=pre%2Dlinking%20all%20emails%20to%20domains%2C%20regardless%20of%20whether%20the%20account%20already%20exists%2C%20likely%20because%20they%20wanted%20users%20to%20be%20able%20to%20OAuth%20with%20Google%20and%20immediately%20have%20access%20to%20all%20their%20domains), wie die Forscher gegenüber The Register erklärten. Aber der E-Mail-und-Passwort-Pfad wurde nie geschlossen, und auf diesem Pfad bewies nichts die Kontrolle über das Postfach.

Es gab noch einen weiteren Brandbeschleuniger. Während der Migration war der Schutz, der dies hätte verhindern sollen, abgeschaltet: [Im Rahmen des Übergangs zu Squarespace wurde die Multi-Faktor-Authentifizierung auf den Konten deaktiviert](https://www.bleepingcomputer.com/news/security/dns-hijacks-target-crypto-platforms-registered-with-squarespace/#:~:text=as%20part%20of%20the%20transition%20to%20Squarespace%2C%20multi%2Dfactor%20authentication%20was%20turned%20off%20on%20accounts). Selbst ein Domain-Inhaber, der bei Google Domains sorgfältig MFA aktiviert hatte, kam bei Squarespace an, ohne diese MFA. Kein Passwort zu knacken, kein zweiter Faktor zu umgehen, keine E-Mail abzufangen – für ein migriertes, noch nicht beanspruchtes Konto war der Besitz einer erratbaren E-Mail-Adresse die gesamte Authentifizierungsgeschichte.

## Reaktion und Schadensbegrenzung

Die Krypto-Sicherheits-Community handelte schneller als der Registrar. Forscher – darunter [Samczsun, Taylor Monahan und Andrew Mohawk](https://www.bleepingcomputer.com/news/security/dns-hijacks-target-crypto-platforms-registered-with-squarespace/#:~:text=Samczsun%2C%20Taylor%20Monahan%2C%20and%20Andrew%20Mohawk) – veröffentlichten den Mechanismus, und Blockaid verteilte Listen noch angreifbarer Frontends, damit Projekte prüfen konnten, ob sie exponiert waren. Betroffene Projekte beeilten sich, ihre Konten zurückzugewinnen, DNS-Einträge zurückzusetzen und Nutzer zu warnen, Token-Genehmigungen zu widerrufen, die den bösartigen Seiten erteilt wurden.

Der unmittelbare Abhilferat war für alle noch auf einem migrierten Konto gleich: Anmelden und das Konto beanspruchen, bevor ein Angreifer es tut, ein starkes, einzigartiges Passwort setzen und – vor allem – die Multi-Faktor-Authentifizierung wieder aktivieren, die die Migration stillschweigend entfernt hatte. Squarespace seinerseits arbeitete daran, die migrierten Konten und den Kontoerstellungsablauf abzusichern. Die grundlegende Lehre überdauerte den Patch: Eine Sicherheitskontrolle, die ein Anbieter während einer Migration deaktiviert, ist für die Dauer dieser Migration eine Kontrolle, die nicht existiert.

## Was dies über Registrar-Sicherheit und MFA lehrt

Die Squarespace-Hijacks sind nicht wirklich eine Geschichte über die Fehlkonfiguration eines einzelnen Unternehmens. Sie sind eine Geschichte darüber, wo Domain-Kontrolle tatsächlich angesiedelt ist, und wie fragil die Schicht oberhalb der [Blockchain](/de/glossary/blockchain/) bleibt.

Einige Lektionen verallgemeinern sich weit über Juli 2024 hinaus:

1. **Das Registrar-Konto ist die eigentliche Vertrauenswurzel – nicht der Smart Contract.** Keines der betroffenen Protokolle hatte einen Contract-Fehler. Ihr [On-Chain](/de/glossary/on-chain/)-Code war in Ordnung. Die Angreifer haben die *Domain* übernommen, und die Domain ist das, was Nutzer eingeben, dem sie vertrauen und mit dem sie ihre Wallets verbinden. Ein Projekt kann on-chain makellos sein und seine Nutzer trotzdem einem Angreifer ausliefern, wenn seine DNS-Steuerungsebene schwach ist.

2. **MFA ist nur dann ein Schutz, wenn sie Migrationen überlebt.** Das schmerzliche Detail hier ist, dass MFA nicht unter einem Angriff versagt hat – sie wurde *vor* dem Angriff als Migrationserleichterung entfernt. Behandeln Sie den MFA-Status als etwas, das nach jedem Kontoumzug, jeder Übertragung oder jedem Anbieterwechsel erneut überprüft werden muss, nicht als etwas, das man einmal einrichtet und vergisst.

3. **„Nahtlos" ist ein Sicherheits-Trade-off.** Jeder Schritt, den eine Migration zugunsten der Benutzerfreundlichkeit überspringt, ist ein Schritt, bei dem die Identität unbewiesen bleibt. Vorab erstellte Konten, automatisch verknüpfte E-Mails und Anmeldungen ohne Verifizierung sind alles Hürden, die der Nutzer nicht gespürt hat – und Hürden sind sehr oft das, was Angreifer draußen hält.

4. **Erratbare Identifikatoren sind Zugangsdaten in Verkleidung.** Das „Geheimnis", das diese Domains entsperrte, war eine E-Mail-Adresse, die nie geheim war. Jedes System, bei dem die Kenntnis eines öffentlichen Identifikators Kontrolle verleiht, ist eine Identitätsfälschung von einem Kompromiss entfernt.

5. **Der Schadensradius eines Registrars entspricht seinem gesamten Kundenstamm.** Individuelle Domain-Sicherheit spielt keine Rolle, wenn das Standardverhalten des Registrars schwach ist, weil der Standard für alle gleichzeitig gilt. Wo Ihre Domain beheimatet ist, und wie dieser Verwahrer mit Authentifizierung umgeht, ist eine Sicherheitsentscheidung, die so bedeutsam ist wie jede, die Sie on-chain treffen.

## Die Namefi-Perspektive

![Farbenfrohe Illustration von überprüfbarem, manipulationssicherem Domain-Eigentum – eine Domain-Karte, gesichert durch ein grünes Schild, einen grünen Namefi-Token und DNS-Kontinuität](../../assets/the-2024-squarespace-defi-domain-hijacks-03-namefi-angle.jpg)

Die Hijacks von 2024 ereigneten sich in der Lücke zwischen „wem gehört diese Domain wirklich" und „wer kann sich in das Konto einloggen, das sie kontrolliert". Im traditionellen Modell sind diese beiden Dinge nur lose verknüpft: Eigentümerschaft ist ein Eintrag in der Datenbank eines Registrars, und der Zugang dazu wird von der Authentifizierung abgesichert, die dieser Registrar gerade zufällig durchsetzt – auch mitten in einer 10-Millionen-Domain-Migration, bei der das Tor kurzzeitig weit offen stand.

[Namefi](https://namefi.io) ist darauf ausgelegt, diese Lücke zu schließen. Indem Domain-Eigentümerschaft als tokenisiertes, on-chain-Asset dargestellt wird, das mit DNS kompatibel bleibt, wird Kontrolle zu etwas, das man *kryptografisch verifizieren* kann, anstatt etwas, das auf einer erratbaren E-Mail-Adresse und den Standard-Anmeldeeinstellungen eines Anbieters beruht. Eigentümerschaft liegt in einer Wallet, die Sie kontrollieren, Übertragungen sind nachprüfbar, und die Frage „Wer darf die Einträge dieser Domain ändern" hat eine manipulationssichere Antwort statt einer Kundenservice-Antwort.

Das hätte die Migration von Squarespace nicht fehlerfrei gemacht. Aber es ändert den Fehlermodus. Ein Angreifer, der ein Konto mit einer bekannten E-Mail-Adresse registriert, besitzt dadurch keine tokenisierte Domain – Eigentümerschaft ist keine Zeile, die ein halb initialisiertes Konto still und leise beanspruchen kann. Die Steuerungsebene für einen Namen sollte genauso schwer zu fälschen sein wie die Vermögenswerte, die er schützt. Im Juli 2024 war das für hunderte von Krypto-Projekten nicht der Fall. Diese Lücke ist genau die, die es wert ist, technisch zu schließen.

## Quellen und weiterführende Lektüre

- Krebs on Security — [Researchers: Weak Security Defaults Enabled Squarespace Domains Hijacks](https://krebsonsecurity.com/2024/07/researchers-weak-security-defaults-enabled-squarespace-domains-hijacks/)
- BleepingComputer — [DNS hijacks target crypto platforms registered with Squarespace](https://www.bleepingcomputer.com/news/security/dns-hijacks-target-crypto-platforms-registered-with-squarespace/)
- Blockaid — [Squarespace Domain Hijacking Incident: Attack Report](https://www.blockaid.io/blog/squarespace-defi-domain-hijack-incident)
- SecurityWeek — [Hackers Exploit Flaw in Squarespace Migration to Hijack Domains](https://www.securityweek.com/hackers-exploit-flaw-in-squarespace-migration-to-hijack-domains/)
- Decrypt — [More Than 220 DeFi Protocols Still 'at Risk' From Squarespace DNS Hijack](https://decrypt.co/239524/220-defi-protocols-risk-squarespace-dns-hijack)
- The Register — [Infoseccers claim Squarespace migration linked to DNS hijackings at Web3 firms](https://www.theregister.com/2024/07/15/squarespace_fingered_for_dns_hijackings/)
- Socket — [Squarespace Domain Hijacks Enabled by Email Address Exploit on Migrated Accounts](https://socket.dev/blog/squarespace-domain-hijacks-enabled-by-email-address-exploit-on-migrated-accounts)
- SiliconANGLE — [Multiple crypto domains hijacked from Squarespace due to Google Domains migration flaw](https://siliconangle.com/2024/07/15/multiple-crypto-domains-hijacked-squarespace-due-google-domains-migration-flaw/)
- Cybernews — [Squarespace crypto domains under DNS attack, lack of MFA to blame](https://cybernews.com/security/squarespace-dns-hijack-attack-crypto-domains-mfa/)
- Hackread — [DeFi Hack Alert: Squarespace Domains Vulnerable to DNS Hijacking](https://hackread.com/defi-hack-alert-squarespace-domains-dns-hijacking/)
- CircleID — [Security Lapses Lead to Squarespace Domain Hijacks](https://circleid.com/posts/20240716-security-lapses-lead-to-squarespace-domain-hijacks)
