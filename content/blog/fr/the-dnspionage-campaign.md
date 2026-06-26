---
title: 'DNSpionage : La campagne qui a weaponisé le DNS contre les gouvernements'
date: '2026-06-17'
language: fr
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: 'Fin 2018, Cisco Talos a révélé DNSpionage — une campagne liée à des intérêts iraniens qui a réécrit des enregistrements DNS gouvernementaux, redirigé le trafic e-mail et VPN vers des serveurs attaquants, et émis des certificats TLS valides pour rester invisible. Elle a déclenché la première directive d''urgence de ce type de la part du gouvernement américain.'
keywords: ['dnspionage', 'détournement dns', 'redirection dns', 'cisco talos', 'directive urgence cisa 19-01', 'sea turtle dns', 'détournement dns iran', 'fireeye détournement dns', 'abus certificat lets encrypt', 'sécurité dns', 'sécurité des domaines', 'cyber-espionnage état-nation', 'atténuer la falsification infrastructure dns']
relatedArticles:
  - /fr/blog/the-sea-turtle-dns-espionage/
  - /fr/blog/the-fox-it-dns-hijack/
  - /fr/blog/the-godaddy-multi-year-breach/
  - /fr/blog/the-myetherwallet-bgp-dns-attack/
  - /fr/blog/the-badgerdao-frontend-attack/
relatedTopics:
  - /fr/topics/domain-security/
  - /fr/topics/domain-basics/
relatedSeries:
  - /fr/series/domain-apocalypse/
  - /fr/series/name-change-game-change/
relatedGlossary:
  - /fr/glossary/dns/
  - /fr/glossary/registrar/
  - /fr/glossary/icann/
  - /fr/glossary/tld/
  - /fr/glossary/registry/
---

La plupart des catastrophes liées aux domaines portent sur qui *possède* un nom. Celle-ci portait sur qui le *contrôle* — et pendant quelques mois à la fin de 2018, la réponse pour des dizaines de domaines gouvernementaux au Moyen-Orient était : pas les gouvernements.

Il n'y a eu aucune intrusion dans un serveur web. Pas de logiciel malveillant sur la page d'accueil. Aucun défacement, aucune rançon, aucune preuve accablante dans les journaux applicatifs. Les attaquants n'ont jamais eu besoin de s'introduire physiquement dans les bâtiments. Ils ont emprunté la seule porte que presque personne ne garde : l'**enregistrement [DNS](/fr/glossary/dns/)** qui indique où vivent réellement les e-mails et les sites web d'un domaine. Ils l'ont modifié — discrètement, avec des identifiants valides, derrière un certificat TLS valide — et le trafic mondial a suivi les nouvelles instructions sans se plaindre.

Cisco Talos a nommé cela **DNSpionage**. C'est l'une des démonstrations les plus claires jamais enregistrées que le Système de Noms de Domaine n'est pas qu'une simple plomberie. C'est une infrastructure de sécurité nationale.

## Le DNS comme arme de politique d'État

Pour comprendre pourquoi DNSpionage a secoué les gouvernements, il faut se rappeler ce que le DNS fait réellement.

Chaque fois que vous envoyez un e-mail à un ministère, que vous vous connectez à un VPN d'entreprise, ou que vous chargez une page de webmail, votre appareil pose d'abord une question au DNS : *quelle [adresse IP](/fr/glossary/ip-address/) correspond à ce nom ?* Quelle que soit la réponse du DNS, vous lui faites confiance. Votre client de messagerie s'y connecte. Votre VPN s'y authentifie. Votre navigateur y transmet la session. Le DNS est l'annuaire de tout l'internet, et presque rien ne vérifie si cet annuaire a été modifié.

C'est cette propriété qu'a exploitée DNSpionage. Si vous pouvez modifier l'enregistrement — non pas briser le chiffrement, non pas craquer le fichier de mots de passe, juste changer le *pointeur* — vous pouvez vous placer invisiblement entre une cible et les services auxquels elle fait confiance. Les e-mails passent par vous. Les connexions VPN passent par vous. Et comme le nom de domaine de la victime apparaît toujours dans la barre du navigateur, rien ne semble anormal.

C'est de l'espionnage au niveau de la couche située en dessous de l'application. C'est aussi, de façon gênante, la couche que la plupart des programmes de sécurité traitent comme un problème résolu.

## La campagne DNSpionage (2018–2019)

![Illustration conceptuelle colorée et vivante d'une salle d'interception cachée sous un central téléphonique national, où un opérateur dans l'ombre redirige discrètement le courrier d'un pays à travers de faux sceaux officiels, des câbles de données lumineux se divisant vers un poste d'écoute secret](../../assets/the-dnspionage-campaign-01-campaign.jpg)

Le **27 novembre 2018**, Cisco Talos publiait son premier rapport. La première phrase était précise : « [Cisco Talos vient de découvrir une nouvelle campagne ciblant le Liban et les Émirats arabes unis (EAU) affectant des domaines .gov, ainsi qu'une compagnie aérienne libanaise privée](https://blog.talosintelligence.com/dnspionage-campaign-targets-middle-east/#:~:text=Cisco%20Talos%20recently%20discovered%20a%20new%20campaign%20targeting%20Lebanon%20and%20the%20United%20Arab%20Emirates). »

La campagne avait deux visages. L'un était une opération de logiciels malveillants assez ordinaire : « [Cette campagne particulière utilise deux faux sites web malveillants contenant des offres d'emploi qui sont utilisées pour compromettre des cibles via des documents Microsoft Office malveillants avec des macros intégrées](https://blog.talosintelligence.com/dnspionage-campaign-targets-middle-east/#:~:text=This%20particular%20campaign%20utilizes%20two%20fake%2C%20malicious%20websites%20containing%20job%20postings). » Les sites leurres usurpaient l'identité de vrais recruteurs — « [hr-wipro[.]com (avec une redirection vers wipro.com) et hr-suncor[.]com (avec une redirection vers suncor.com)](https://blog.talosintelligence.com/dnspionage-campaign-targets-middle-east/#:~:text=hr%2Dwipro) » — et déposaient un outil d'accès à distance personnalisé qui, de façon distinctive, pouvait communiquer avec son serveur de commande via le DNS lui-même.

Mais le second visage est celui qui est entré dans l'histoire. Dans les termes de Talos : « [Dans une campagne séparée, les attaquants ont utilisé la même IP pour rediriger le DNS de domaines .gov légitimes et de domaines d'entreprises privées](https://blog.talosintelligence.com/dnspionage-campaign-targets-middle-east/#:~:text=the%20attackers%20used%20the%20same%20IP%20to%20redirect%20the%20DNS%20of%20legitimate). » De vrais serveurs de noms gouvernementaux ont été pointés vers des machines appartenant aux attaquants : « [Plusieurs serveurs de noms appartenant au secteur public au Liban et aux EAU, ainsi que certaines entreprises au Liban, ont apparemment été compromis, et les noms d'hôtes sous leur contrôle ont été pointés vers des adresses IP contrôlées par les attaquants](https://blog.talosintelligence.com/dnspionage-campaign-targets-middle-east/#:~:text=Multiple%20nameservers%20belonging%20to%20the%20public%20sector). »

Les faux sites d'offres d'emploi étaient la partie qui ressemblait à de la cybercriminalité ordinaire. La redirection DNS était la partie qui ressemblait à une politique d'État.

Au moment où des chercheurs indépendants ont fini de tirer le fil, la portée était bien plus large que deux pays. Brian Krebs, en remontant à partir des adresses IP des attaquants, a découvert que « [dans les derniers mois de 2018, les pirates derrière DNSpionage ont réussi à compromettre des composants clés de l'infrastructure DNS de plus de 50 entreprises et agences gouvernementales du Moyen-Orient](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/#:~:text=in%20the%20last%20few%20months%20of%202018%20the%20hackers%20behind%20DNSpionage%20succeeded). »

## Les cibles et les enjeux

La liste des victimes ressemble à une carte du système nerveux d'une région : ministères des affaires étrangères, aviation civile, opérateurs de télécommunications, infrastructure internet et le webmail d'un ministère des finances national. Il ne s'agit pas de cibles aléatoires. Ce sont les endroits où les secrets d'une nation transitent par des câbles.

Deux mois après le premier rapport de Talos, FireEye (désormais Mandiant) a publié sa propre analyse et a formulé l'attribution de façon explicite mais prudente. Comme l'a exprimé FireEye, « [les recherches initiales suggèrent que l'acteur ou les acteurs responsables ont un lien avec l'Iran](https://www.theregister.com/2019/01/10/fireeye_iran_dns_hijacking/#:~:text=initial%20research%20suggests%20the%20actor%20or%20actors%20responsible%20have%20a%20nexus%20to%20Iran). » Rapportant les conclusions de FireEye, SecurityWeek a noté que la firme estimait avec une « [confiance modérée](https://www.securityweek.com/iran-linked-dns-hijacking-attacks-target-organizations-worldwide/#:~:text=moderate%20confidence) » que l'Iran était derrière les attaques, sur la base de preuves techniques et du fait que la campagne correspondait aux intérêts du gouvernement iranien.

Les enjeux découlent directement des cibles. Quand vous pouvez lire les e-mails d'un ministère des affaires étrangères en clair, vous ne volez pas des données — vous lisez l'esprit d'un gouvernement en quasi temps réel. C'est pourquoi une campagne de collecte d'identifiants au niveau DNS est à comprendre non comme une fraude, mais comme une collecte de renseignements contre l'État.

## Comment c'est arrivé : enregistrements DNS + certificats valides + faux sites d'emploi

![Illustration conceptuelle colorée et vivante d'un central de courrier national silencieusement recâblé — des cartes d'adresse lumineuses échangées sur un immense mur de routage, chaque ligne redirigée passant par un faux sceau cadenas vert avant d'atteindre un poste d'écoute caché](../../assets/the-dnspionage-campaign-02-dns-redirection.jpg)

Voici la partie qui mérite qu'on s'y attarde, car la technique est élégante dans le pire sens du terme. Il y avait trois mouvements.

**Premier mouvement : obtenir les clés de l'annuaire.** Les attaquants n'ont pas craqué la cryptographie DNS. Ils se sont connectés. FireEye a décrit deux voies : « [Une méthode consiste à se connecter à l'interface d'administration d'un fournisseur DNS avec des identifiants compromis et à modifier les enregistrements DNS A afin d'intercepter le trafic e-mail. Une autre méthode consiste à modifier les enregistrements NS DNS après avoir piraté le compte bureau d'enregistrement de domaine de la victime](https://www.securityweek.com/iran-linked-dns-hijacking-attacks-target-organizations-worldwide/#:~:text=One%20method%20involves%20logging%20into%20a%20DNS%20provider). » Les identifiants de bureau d'enregistrement et d'hébergeur DNS volés étaient la clé maîtresse. Quiconque détient l'identifiant du bureau d'enregistrement détient le domaine — et le domaine détient tout ce qui pointe vers lui.

**Deuxième mouvement : rediriger le trafic tout en le faisant fonctionner.** Pointer le serveur mail d'un gouvernement vers sa propre IP casserait normalement les choses et déclencherait des alarmes. Alors les attaquants ont joué le rôle de proxy. Le trafic était relayé vers la destination réelle après avoir été capturé, de sorte que les utilisateurs voyaient une boîte de réception fonctionnelle et un VPN fonctionnel. Comme FireEye l'a décrit pour une troisième variante : « [les utilisateurs étaient redirigés vers une infrastructure contrôlée par les attaquants](https://www.securityweek.com/iran-linked-dns-hijacking-attacks-target-organizations-worldwide/#:~:text=users%20were%20redirected%20to%20attacker%2Dcontrolled%20infrastructure). » L'interception était un homme du milieu qui transmettait discrètement — invisible précisément parce que rien ne semblait tomber en panne.

**Troisième mouvement : déjouer le cadenas vert.** Les services modernes utilisent TLS, qui devrait afficher un avertissement de certificat dès que le trafic arrive sur le mauvais serveur. Les attaquants ont comblé cette lacune en émettant leurs propres certificats légitimes. Talos a découvert que « [lors de chaque compromission DNS, l'acteur a soigneusement généré des certificats Let's Encrypt pour les domaines redirigés](https://blog.talosintelligence.com/dnspionage-campaign-targets-middle-east/#:~:text=During%20each%20DNS%20compromise%2C%20the%20actor%20carefully%20generated). » Parce qu'ils contrôlaient désormais le DNS du domaine, ils pouvaient *prouver* ce contrôle à une autorité de certification — et la validation de domaine automatisée leur a délivré un certificat valide. FireEye a confirmé le même schéma à travers les méthodes : « [dans les deux cas, les attaquants ont utilisé des certificats Let's Encrypt pour éviter d'éveiller les soupçons](https://www.securityweek.com/iran-linked-dns-hijacking-attacks-target-organizations-worldwide/#:~:text=in%20both%20cases%20the%20attackers%20used%20Let%E2%80%99s%20Encrypt%20certificates). »

Le résultat, dans le résumé de Krebs, était total : « [ces détournements DNS ont également ouvert la voie aux attaquants pour obtenir des certificats de chiffrement SSL pour les domaines ciblés (par ex. webmail.finance.gov.lb), ce qui leur a permis de déchiffrer les e-mails interceptés et les identifiants VPN et de les visualiser en clair](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/#:~:text=these%20DNS%20hijacks%20also%20paved%20the%20way%20for%20the%20attackers%20to%20obtain%20SSL%20encryption%20certificates). » E-mails et identifiants VPN, capturés et lisibles, avec un cadenas valide pendant tout ce temps.

Remarquez ce qui n'était *pas* requis. Aucune faille zero-day. Aucun logiciel malveillant sur les propres serveurs de la victime. Aucun pare-feu contourné. L'attaque vivait entièrement dans le fossé entre « je possède ce domaine » et « je peux prouver qui contrôle actuellement ses enregistrements ». C'est dans ce fossé que DNSpionage a évolué — et il est plus large que la plupart des organisations ne le pensent.

## La réponse : Directive d'urgence CISA 19-01

Les divulgations combinées de Talos et FireEye ont eu un impact retentissant à Washington. Le **22 janvier 2019**, l'Agence américaine de cybersécurité et de sécurité des infrastructures a émis la **Directive d'urgence 19-01, « Atténuer la falsification de l'infrastructure DNS »** — la première directive d'urgence jamais émise par la CISA, et une rare instruction contraignante pour l'ensemble du gouvernement civil fédéral.

Le diagnostic de la directive correspondait exactement aux recherches. Comme cité dans des reportages contemporains, la CISA a averti que « [les attaquants ont redirigé et intercepté le trafic web et mail, et pourraient le faire pour d'autres services en réseau](https://www.bleepingcomputer.com/news/security/dhs-issues-emergency-directive-to-prevent-dns-hijacking-attacks/#:~:text=redirected%20and%20intercepted%20web%20and%20mail%20traffic) », et que les acteurs avaient « [compromis les comptes des administrateurs en charge des domaines DNS gouvernementaux](https://www.bleepingcomputer.com/news/security/dhs-issues-emergency-directive-to-prevent-dns-hijacking-attacks/#:~:text=compromised%20the%20accounts%20of%20administrators). »

Elle a ensuite ordonné quatre actions, dans un délai de 10 jours — et elles se lisent comme un rejet direct de chacun des trois mouvements des attaquants :

1. **Auditer vos enregistrements DNS** — vérifier qu'aucune falsification n'a eu lieu sur les serveurs faisant autorité et les serveurs secondaires.
2. **Changer les mots de passe des comptes DNS** — faire tourner chaque identifiant pouvant modifier le DNS.
3. **Ajouter l'authentification multifacteur** à tous les comptes d'administration DNS — afin qu'un mot de passe volé seul ne soit plus la clé maîtresse.
4. **Surveiller les journaux de transparence des certificats** — surveiller les certificats émis pour vos domaines que vous n'avez jamais demandés.

Ce quatrième point est révélateur. La CISA ne disait pas seulement aux agences de verrouiller la porte ; elle leur disait de surveiller les registres publics de certificats pour trouver la preuve que quelqu'un avait déjà utilisé une copie de la clé. DNSpionage avait transformé la transparence des certificats d'une fonctionnalité PKI de niche en outil de détection en première ligne des détournements DNS par des États-nations.

Krebs a capturé simplement le caractère inhabituel du moment : « [le Département américain de la sécurité intérieure a émis une rare directive d'urgence ordonnant à toutes les agences civiles fédérales américaines de sécuriser les identifiants de connexion pour leurs enregistrements de domaines Internet](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/#:~:text=issued%20a%20rare%20emergency%20directive%20ordering%20all%20U.S.%20federal%20civilian%20agencies). »

DNSpionage n'a pas agi seul pour la déclencher. Une opération parallèle, encore plus agressive, que Talos a nommée **Sea Turtle** — qu'il a décrit comme « [le premier cas connu d'une organisation de registre de noms de domaine compromise pour des opérations de cyber-espionnage](https://www.networkworld.com/article/967285/cisco-talos-details-exceptionally-dangerous-dns-hijacking-attack.html#:~:text=first%20known%20case%20of%20a%20domain%20name%20registry%20organization%20that%20was%20compromised) », touchant « [environ 40 organisations différentes dans 13 pays différents](https://www.networkworld.com/article/967285/cisco-talos-details-exceptionally-dangerous-dns-hijacking-attack.html#:~:text=approximately%2040%20different%20organizations%20across%2013%20different%20countries) » — a encore élevé les enjeux. Talos a pris soin de maintenir les deux distincts ; dans son rapport de suivi d'avril 2019, il a noté que le comportement de DNSpionage « [continuera probablement à distinguer cet acteur de campagnes plus préoccupantes comme Sea Turtle](https://blog.talosintelligence.com/dnspionage-brings-out-karkoff/#:~:text=will%20likely%20continue%20to%20distinguish%20this%20actor%20from%20more%20concerning%20campaigns%20like%20Sea%20Turtle). » Ensemble, les deux campagnes ont fait valoir le même point sous des angles différents : la chaîne d'approvisionnement DNS était devenue un théâtre de conflits entre États.

## Ce que cela enseigne sur le DNS en tant qu'infrastructure de sécurité nationale

DNSpionage manque de drames liés aux logiciels malveillants mais regorge de leçons inconfortables. Quelques-unes méritent d'être retenues :

- **Le compte du bureau d'enregistrement est un joyau de la couronne.** Tout ce qui est en aval d'un domaine — courrier, web, VPN, authentification unique, émission de certificats — hérite de la confiance de quiconque peut modifier son DNS. Un mot de passe sans second facteur sur ce compte n'est pas une petite lacune ; c'est tout le château avec la porte grande ouverte. Les premières instructions de la CISA portaient sur les *identifiants*, pas sur les pare-feux, exactement pour cette raison.
- **Un certificat valide n'est pas une preuve de légitimité.** Le cadenas vert prouve que le trafic est chiffré vers *quiconque contrôle le domaine en ce moment*. Si un attaquant contrôle le DNS, la validation de domaine automatisée lui délivrera joyeusement un vrai certificat. La confiance dans TLS est empruntée à la confiance dans le DNS — et le DNS est plus vulnérable que la plupart des gens ne l'imaginent.
- **Les attaques DNS sont invisibles par conception.** Parce que le proxy transmet le vrai trafic, les services de la victime continuent de fonctionner. Il n'y a pas de panne à enquêter. Le seul signal externe peut être un certificat apparaissant dans un journal CT public — c'est pourquoi la surveillance de ces journaux est passée d'optionnelle à obligatoire du jour au lendemain.
- **Le contrôle des domaines est un contrôle de sécurité nationale.** Quand l'entité qui modifie le DNS d'un ministère des affaires étrangères est un État hostile, la distinction entre « opérations IT » et « contre-espionnage » s'effondre. L'annuaire de l'internet est un terrain stratégique.

Le fil conducteur est une seule question à laquelle presque aucun outil opérationnel ne répond en temps réel : **qui contrôle réellement ce domaine en ce moment, et puis-je prouver qu'il n'a pas changé discrètement ?** DNSpionage a fonctionné parce que cette question était si difficile à répondre que les gouvernements d'une région entière ne le pouvaient pas.

## L'angle Namefi

![Illustration colorée de la propriété de domaine vérifiable et inviolable — une carte de domaine sécurisée par un bouclier vert, un token Namefi vert et une continuité DNS](../../assets/the-dnspionage-campaign-03-namefi-angle.jpg)

DNSpionage est, à sa racine, un problème de **provenance**. Les attaquants n'ont jamais possédé les domaines ciblés. Ils en ont emprunté le contrôle en volant les identifiants permettant aux panneaux de bureau d'enregistrement et d'hébergeur DNS de faire des modifications silencieuses et invérifiables — et rien dans le système n'a signalé que la *partie en contrôle* avait changé.

[Namefi](https://namefi.io) est construit sur le principe que la propriété et le contrôle des domaines doivent être **vérifiables, portables et infalsifiables** plutôt qu'enfermés dans un identifiant opaque de bureau d'enregistrement. La propriété tokenisée fait de « qui contrôle ce nom » un fait que vous pouvez vérifier et auditer, et non un paramètre caché derrière un mot de passe qui est peut-être déjà entre d'autres mains. Cela ne remplace pas les bonnes pratiques de compte de bureau d'enregistrement ni l'authentification multifacteur — les conseils de la CISA restent exactement justes — mais cela s'attaque au fossé plus profond qu'a exploité DNSpionage : la difficulté de *prouver*, de façon indépendante et continue, que la partie qui contrôle un domaine est bien celle qui est censée le faire.

La leçon de DNSpionage n'est pas que le DNS est fragile d'une manière exotique. C'est que le fait le plus important à propos d'un domaine — qui le contrôle — était, pendant trop longtemps, quelque chose qu'un seul mot de passe volé séparait du danger. Rendre ce fait vérifiable, c'est tout l'enjeu.

## Sources et lectures complémentaires

- Cisco Talos — [DNSpionage Campaign Targets Middle East](https://blog.talosintelligence.com/dnspionage-campaign-targets-middle-east/) (27 nov. 2018)
- Cisco Talos — [DNSpionage brings out the Karkoff](https://blog.talosintelligence.com/dnspionage-brings-out-karkoff/) (23 avr. 2019)
- Krebs on Security — [A Deep Dive on the Recent Widespread DNS Hijacking Attacks](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/) (18 févr. 2019)
- The Register — [Baddies linked to Iran fingered for DNS hijacking to read Middle Eastern regimes' emails](https://www.theregister.com/2019/01/10/fireeye_iran_dns_hijacking/) (10 janv. 2019)
- SecurityWeek — [Iran-Linked DNS Hijacking Attacks Target Organizations Worldwide](https://www.securityweek.com/iran-linked-dns-hijacking-attacks-target-organizations-worldwide/) (10 janv. 2019)
- BleepingComputer — [DHS Issues Emergency Directive to Prevent DNS Hijacking Attacks](https://www.bleepingcomputer.com/news/security/dhs-issues-emergency-directive-to-prevent-dns-hijacking-attacks/) (janv. 2019)
- Network World — [Cisco Talos details exceptionally dangerous DNS hijacking attack](https://www.networkworld.com/article/967285/cisco-talos-details-exceptionally-dangerous-dns-hijacking-attack.html) (17 avr. 2019)
- Network World — [Cisco: DNSpionage attack adds new tools, morphs tactics](https://www.networkworld.com/article/967303/cisco-dnspionage-attack-adds-new-tools-morphs-tactics.html)
- CERT-IST — [DNSpionage and DNS data hijacking](https://www.cert-ist.com/public/en/SO_detail?format=html&code=dnspionage)
- CISA — [Emergency Directive 19-01: Mitigate DNS Infrastructure Tampering](https://www.cisa.gov/news-events/directives/ed-19-01-mitigate-dns-infrastructure-tampering-closed) (22 janv. 2019)
