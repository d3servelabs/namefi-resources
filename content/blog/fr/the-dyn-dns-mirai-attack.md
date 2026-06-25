---
title: "L'attaque DNS Dyn : quand un botnet Mirai de caméras piratées a mis la moitié d'Internet hors ligne"
date: '2026-06-17'
language: fr
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: "Le 21 octobre 2016, une attaque DDoS alimentée par le botnet IoT Mirai a frappé le fournisseur DNS Dyn en trois vagues, rendant Twitter, Netflix, Reddit, Spotify, GitHub, Airbnb et PayPal inaccessibles pendant des heures — une étude de cas Domain Mayday sur la concentration des fournisseurs DNS."
keywords: ['attaque dns dyn', 'botnet mirai', 'ddos 21 octobre 2016', 'attaque ddos dns', 'botnet iot', 'panne fournisseur dns', 'sécurité des domaines', 'point de défaillance unique dns', 'ddos dyn 2016', 'malware mirai', 'panne internet 2016', 'redondance dns', 'caméras iot piratées']
---

Pendant quelques heures, un vendredi d'octobre 2016, Internet a oublié comment se trouver lui-même.

Twitter affichait une page blanche. Netflix tournait en rond avant de capituler. Reddit, Spotify, GitHub, Airbnb, PayPal — tous là, tous en ligne, tous fonctionnant parfaitement sur leurs propres serveurs, et pourtant totalement inaccessibles. Rien n'avait été piraté. Aucune donnée n'avait été volée. Les sites web se trouvaient exactement là où ils avaient toujours été. Ce qui s'était brisé, c'était la partie d'Internet qui *vous indique où se trouvent les choses*.

L'attaque n'a pas visé Twitter ou Netflix. Elle a ciblé une entreprise dont la plupart de leurs utilisateurs n'avaient jamais entendu parler : **Dyn**, une société du New Hampshire qui gérait le DNS — l'annuaire d'adresses d'Internet — pour une large portion du web moderne. Et l'arme n'était pas une ferme de serveurs ni un arsenal d'État-nation. C'était un essaim de babyphones piratés, de webcams et de routeurs domestiques : des gadgets ménagers ordinaires, silencieusement enrôlés dans une armée appelée **Mirai**.

Voici **Domain Mayday EP08** — le jour où des caméras intelligentes non sécurisées ont mis hors ligne l'annuaire téléphonique d'Internet.

## Le DNS : l'annuaire d'Internet, et la place de Dyn dans cet écosystème

Chaque fois que vous tapez un nom de domaine, votre ordinateur doit le traduire en [adresse IP](/fr/glossary/ip-address/) numérique avant de pouvoir se connecter à quoi que ce soit. Cette traduction est le rôle du [DNS](/fr/glossary/dns/), le système de noms de domaine. Il constitue la couche de résolution entre le nom lisible par l'homme et la machine vers laquelle ce nom pointe.

Dyn était l'un des grands fournisseurs gérés de ce service de résolution. Lorsqu'un site externalisait son DNS à Dyn, les serveurs de noms de Dyn devenaient la source faisant autorité pour répondre à la question « où ce domaine réside-t-il ? ». The Register l'a exprimé clairement lors de l'attaque : en mettant Dyn hors ligne, les résolveurs DNS publics exploités par Google et les FAI étaient [dans l'incapacité de contacter Dyn pour résoudre les noms d'hôtes pour les internautes, empêchant les gens d'accéder aux sites utilisant Dyn pour le DNS](https://www.theregister.com/2016/10/21/dns_devastation_as_dyn_dies_under_denialofservice_attack/#:~:text=unable%20to%20contact%20Dyn%20to%20lookup%20hostnames).

C'est là la fragilité silencieuse au cœur de cette histoire. Un site web peut être irréprochable — serveurs redondants, disponibilité parfaite, ingénieurs de classe mondiale — et disparaître quand même d'Internet si le seul fournisseur qui répond à la question « où est-il ? » tombe dans le noir. Comme le résumera plus tard le CyLab de Carnegie Mellon, les domaines affectés étaient [critiquement dépendants de Dyn, un DNS tiers. En d'autres termes, ils s'appuyaient uniquement sur Dyn ; ainsi, lorsque Dyn est tombé, eux aussi sont tombés](https://cylab.cmu.edu/news/2020/10/30-dynattack.html#:~:text=critically%20dependent%20on%20Dyn).

## 21 octobre 2016 : l'attaque en vagues

![Art conceptuel aux couleurs vives d'une vague de marée de trafic parasite lumineux s'écrasant sur un immense standard téléphonique illuminé, les voyants de l'annuaire s'éteignant l'un après l'autre sur une carte sombre](../../assets/the-dyn-dns-mirai-attack-01-attack.jpg)

L'assaut a débuté dans la matinée du vendredi 21 octobre 2016, et il n'est pas arrivé en un seul coup. Il s'est manifesté en vagues distinctes tout au long de la journée.

Le dossier Wikipédia de l'incident recense [trois attaques successives par déni de service distribué](https://en.wikipedia.org/wiki/DDoS_attacks_on_Dyn#:~:text=three%20consecutive%20distributed%20denial%2Dof%2Dservice%20attacks) contre Dyn, débutant vers 11h10 UTC. Les mécanismes correspondaient à un déni de service distribué classique : l'[attaque DDoS a été réalisée par le biais de nombreuses requêtes de résolution DNS provenant de dizaines de millions d'adresses IP](https://en.wikipedia.org/wiki/DDoS_attacks_on_Dyn#:~:text=numerous%20DNS%20lookup%20requests%20from%20tens%20of%20millions%20of%20IP%20addresses), noyant les serveurs de noms de Dyn sous un trafic parasite si dense que les requêtes légitimes ne pouvaient plus passer.

Les vagues successives ont rendu l'assaut implacable. The Register, qui couvrait l'événement en direct, a décrit le moment où Dyn semblait se remettre — avant de replonger : [après deux heures à encaisser la vague initiale de trafic parasite, Dyn a annoncé avoir atténué l'assaut et que le service revenait à la normale. Mais le soulagement fut de courte durée : environ une heure plus tard, l'attaque a repris](https://www.theregister.com/2016/10/21/dns_devastation_as_dyn_dies_under_denialofservice_attack/#:~:text=After%20two%20hours%20into%20the%20initial%20tidal%20wave). Ce qui semblait être la fin n'était que le creux entre deux rounds.

En volume brut, l'attaque était colossale pour son époque — parmi les événements DDoS les plus importants observés jusqu'alors, The Register qualifiant le pic de [plus d'1 Tbps](https://www.theregister.com/2017/11/07/mirai_botnet_sitrep/#:~:text=more%20than%201TBps). (Dyn lui-même a indiqué qu'une « tempête de tentatives » de trafic légitime avait gonflé certaines estimations initiales, un point sur lequel nous reviendrons.)

## Quels sites sont tombés — et comment c'est apparu

Lorsque les serveurs de noms de Dyn ne pouvaient plus répondre, la défaillance s'est propagée à tous ceux qui en dépendaient. Il ne s'agissait pas d'un coin obscur du web. C'était la vitrine de l'Internet grand public.

Le reportage en direct de The Register a cité nommément certaines victimes : une attaque extraordinaire et ciblée sur Dyn qui a continué à [perturber les services Internet pour des centaines d'entreprises, dont les géants en ligne Twitter, Amazon, AirBnB, Spotify et d'autres](https://www.theregister.com/2016/10/21/dns_devastation_as_dyn_dies_under_denialofservice_attack/#:~:text=disrupt%20internet%20services%20for%20hundreds%20of%20companies). La liste des services affectés sur Wikipédia ressemble à un bottin des plus grands sites de l'époque : [Airbnb, Amazon.com, CNN, GitHub, Netflix, PayPal, Reddit, Spotify, Twitter](https://en.wikipedia.org/wiki/DDoS_attacks_on_Dyn#:~:text=Airbnb), et des dizaines d'autres.

Brian Krebs, dont le propre site avait été touché par le même malware quelques semaines plus tôt, a décrit l'expérience des utilisateurs ainsi : l'[attaque a commencé à créer des problèmes pour les internautes souhaitant accéder à une série de sites, dont Twitter, Amazon, Tumblr, Reddit, Spotify et Netflix](https://krebsonsecurity.com/2016/10/hacked-cameras-dvrs-powered-todays-massive-internet-outage/#:~:text=an%20array%20of%20sites%2C%20including%20Twitter). Pour les utilisateurs ordinaires, aucun message d'erreur n'avait de sens. Les sites refusaient simplement de se charger — d'abord sur la côte Est des États-Unis, puis en s'étendant à mesure que les vagues suivantes frappaient, touchant des utilisateurs à travers les États-Unis et jusqu'en Europe.

## Comment c'est arrivé : une armée d'appareils connectés non sécurisés

![Art conceptuel aux couleurs vives de milliers de petites caméras intelligentes souriantes, de grille-pain et de babyphones piratés, grouillant comme des insectes lumineux vers une tour-annuaire surchargée](../../assets/the-dyn-dns-mirai-attack-02-mirai-botnet.jpg)

Voici ce qui a fait de l'attaque Dyn un tournant : la puissance de feu ne provenait pas d'ordinateurs. Elle venait de *choses*.

Mirai est un malware qui traque les appareils connectés à Internet — caméras, routeurs, enregistreurs vidéo numériques (DVR) — et les détourne. Il exploite la faiblesse la plus paresseuse du matériel grand public : le mot de passe livré avec l'appareil. Comme l'a décrit The Register, Mirai se propage sur le web, grossissant ses rangs de zombies obéissants, en [se connectant aux appareils à l'aide de leurs mots de passe par défaut définis en usine via Telnet et SSH](https://www.theregister.com/2016/10/21/dyn_dns_ddos_explained/#:~:text=logging%20into%20devices%20using%20their%20default%2C%20factory%2Dset%20passwords). Krebs l'a formulé tout aussi crûment : Mirai [parcourt le Web à la recherche d'appareils IoT protégés par peu plus que des identifiants et mots de passe par défaut, puis les enrôle dans des attaques](https://krebsonsecurity.com/2016/10/hacked-cameras-dvrs-powered-todays-massive-internet-outage/#:~:text=scours%20the%20Web%20for%20IoT%20devices).

Les appareils au cœur de l'attaque Dyn étaient principalement des webcams et des DVR bon marché. Krebs a retracé le botnet jusqu'à [des enregistreurs vidéo numériques (DVR) et des caméras IP compromis, principalement fabriqués par une entreprise technologique chinoise appelée XiongMai Technologies](https://krebsonsecurity.com/2016/10/hacked-cameras-dvrs-powered-todays-massive-internet-outage/#:~:text=mainly%20compromised%20digital%20video%20recorders) — des appareils dont les identifiants par défaut ne [pouvaient pas être raisonnablement modifiés par un utilisateur](https://krebsonsecurity.com/2016/10/hacked-cameras-dvrs-powered-todays-massive-internet-outage/#:~:text=A%20user%20cannot%20feasibly%20change%20this%20password) car le mot de passe était codé en dur dans le firmware.

Deux facteurs ont transformé Mirai d'une nuisance en catastrophe. Premièrement, l'auteur du malware avait, [fin septembre 2016, publié son code source, permettant effectivement à n'importe qui de constituer sa propre armée d'attaque](https://krebsonsecurity.com/2016/10/hacked-cameras-dvrs-powered-todays-massive-internet-outage/#:~:text=released%20the%20source%20code%20for%20it). Deuxièmement, le parc d'appareils vulnérables était immense. Dyn a confirmé la signature de l'attaque : l'entreprise a pu [confirmer qu'un volume significatif du trafic d'attaque provenait de botnets basés sur Mirai](https://www.bankinfosecurity.com/botnet-army-just-100000-iot-devices-disrupted-dyn-a-9486#:~:text=confirm%20that%20a%20significant%20volume%20of%20attack%20traffic%20originated%20from%20Mirai), et Wikipédia décrit le botnet comme un essaim [d'appareils connectés à Internet — tels que des imprimantes, des caméras IP, des passerelles résidentielles et des babyphones — infectés par le malware Mirai](https://en.wikipedia.org/wiki/DDoS_attacks_on_Dyn#:~:text=printers%2C%20IP%20cameras%2C%20residential%20gateways%20and%20baby%20monitors).

## Les suites : compter l'essaim — et les auteurs

Lorsque la poussière est retombée, même la question basique de *quelle était l'ampleur de l'attaque* s'est révélée difficile. La propre analyse post-incident de Dyn, par la voix de son vice-président exécutif Scott Hilton, estimait le botnet à [jusqu'à 100 000 endpoints malveillants](https://www.bankinfosecurity.com/botnet-army-just-100000-iot-devices-disrupted-dyn-a-9486#:~:text=up%20to%20100%2C000%20malicious%20endpoints) — considérable, mais bien en deçà des « dizaines de millions d'IP » que certains chiffres initiaux suggéraient. L'écart provenait d'une boucle de rétroaction : les attaques malveillantes provenaient d'au moins un botnet, [la tempête de tentatives fournissant un faux indicateur d'un ensemble d'endpoints considérablement plus important que ce que nous savons maintenant qu'il l'était réellement](https://www.bankinfosecurity.com/botnet-army-just-100000-iot-devices-disrupted-dyn-a-9486#:~:text=with%20the%20retry%20storm%20providing%20a%20false%20indicator). En d'autres termes, le comportement automatique « réessayer » d'Internet lui-même a amplifié le chaos.

Les suites judiciaires ont apporté un rebondissement. Les trois jeunes hommes derrière Mirai — Paras Jha, Josiah White et Dalton Norman — ont finalement [plaidé coupable pour leur rôle dans la création, l'exploitation et la vente d'accès au « botnet Mirai »](https://cyberscoop.com/mirai-botnet-charges-paris-jha-dalton-norman-josiah-white/#:~:text=pleaded%20guilty%20for%20their%20role%20in%20creating). Mais au moment de l'attaque Dyn, Jha avait déjà rendu le code source public — et les procureurs et journalistes ont pris soin de noter que les auteurs de l'attaque Dyn n'étaient pas nécessairement le trio d'origine. Comme l'a rapporté CyberScoop, il n'[est pas encore clair, par exemple, qui était derrière l'attaque Mirai la plus médiatisée contre la société de gestion des performances Internet Dyn](https://cyberscoop.com/mirai-botnet-charges-paris-jha-dalton-norman-josiah-white/#:~:text=not%20yet%20clear%2C%20for%20example%2C%20who%20was%20behind). Une fois l'arme disponible en open source, n'importe qui pouvait appuyer sur la gâchette.

Pour Dyn, le préjudice commercial a été bien réel : dans les mois qui ont suivi, des milliers de domaines ont transféré leur DNS vers d'autres fournisseurs, leçon coûteuse en matière de confiance client après un seul mauvais jour.

## Ce que cette attaque enseigne sur la concentration des fournisseurs DNS

L'attaque Dyn est commémorée comme un épisode de sécurité IoT, et elle l'est. Mais sa leçon la plus profonde porte sur l'*architecture* : le danger de faire transiter trop de trafic Internet par un seul goulot d'étranglement.

Chaque site qui s'est éteint le 21 octobre avait pris la même décision apparemment raisonnable — externaliser le DNS à un seul excellent fournisseur. Individuellement, c'était logique. Collectivement, cela signifiait que mettre hors ligne une seule entreprise pouvait effacer instantanément une fraction significative du web. Le verdict du CyLab était que les leçons de l'attaque [n'ont été mises en pratique que par une poignée de sites web directement impactés](https://cylab.cmu.edu/news/2020/10/30-dynattack.html#:~:text=have%20only%20been%20acted%20upon%20by%20a%20handful), même des années plus tard.

La réponse défensive, c'est la redondance : répartir le DNS autoritatif sur plusieurs fournisseurs de sorte qu'aucune panne unique ne soit fatale. Deux ans après Dyn, The Register a constaté que cette pratique restait rare et toujours complexe à mettre en œuvre — Cricket Liu d'Infoblox notait que cela [n'est pas devenu plus facile d'utiliser plusieurs fournisseurs DNS autoritatifs, par exemple (disons Dyn plus Verisign ou Neustar). Pouvoir utiliser plusieurs fournisseurs ferait une grande différence](https://www.theregister.com/2018/10/11/dns_insecurity_survey/#:~:text=hasn%27t%20gotten%20any%20easier%20to%20use%20multiple%20authoritative%20DNS%20providers). Les leçons à retenir pour quiconque dépend d'un domaine :

1. **Un domaine a plus de points de défaillance que son bureau d'enregistrement.** Le fournisseur qui répond à « vers où pointe ce nom ? » est tout aussi indispensable que les serveurs qui se trouvent derrière lui.
2. **Un DNS avec un seul fournisseur est un point de défaillance unique.** Une excellente disponibilité en conditions normales ne dit rien du comportement face à un déluge d'1 Tbps.
3. **La concentration est commode et fragile.** L'efficacité même qui rend un fournisseur attrayant amplifie l'impact de sa panne.
4. **La résilience est une propriété de la propriété, pas seulement de l'hébergement.** Lorsque quelque chose se brise, vous devez contrôler la configuration de votre domaine suffisamment clairement pour pouvoir le reconfigurer rapidement.

## L'angle Namefi

![Illustration colorée d'une propriété de domaine vérifiable et résiliente — une carte de domaine sécurisée par un bouclier vert, un jeton Namefi vert, et une continuité DNS](../../assets/the-dyn-dns-mirai-attack-03-namefi-angle.jpg)

L'attaque Dyn n'a volé aucun domaine. Elle n'a pas falsifié un transfert ni détourné un compte de bureau d'enregistrement. Et pourtant, pendant quelques heures, les personnes qui *possédaient* ces domaines ont effectivement perdu le contrôle de l'endroit vers lequel pointaient leurs noms — non pas parce que leur propriété était en doute, mais parce que la couche opérationnelle sous-jacente à leurs domaines a défailli d'un seul coup.

Cet écart — entre *posséder* un nom et *contrôler de manière fiable* l'endroit où il se résout — est précisément la faille qu'exploitent ce type d'attaques. Les domaines comptent parmi les actifs les plus précieux d'une entreprise, pourtant leur contrôle repose souvent sur une infrastructure centralisée et opaque que le propriétaire ne peut ni vérifier ni reconfigurer rapidement sous pression.

[Namefi](https://namefi.io) est construit sur l'idée que les domaines devraient se comporter comme des actifs natifs d'Internet : une propriété cryptographiquement vérifiable et portable, tout en restant pleinement compatible avec le DNS. Une propriété de domaine vérifiable et contrôlée par le propriétaire n'arrête pas un botnet — mais elle pousse le monde vers un Internet où le contrôle d'un nom est prouvable, auditable, et ne dépend pas silencieusement du pire jour d'un seul fournisseur. L'attaque Mirai-Dyn rappelle qu'un domaine que vous « possédez » est seulement aussi résilient que la couche qui répond en son nom. La résilience commence par faire de la propriété et du contrôle quelque chose que vous pouvez réellement vérifier.

## Sources et lectures complémentaires

- Krebs on Security — [Hacked Cameras, DVRs Powered Today's Massive Internet Outage](https://krebsonsecurity.com/2016/10/hacked-cameras-dvrs-powered-todays-massive-internet-outage/)
- Wikipedia — [DDoS attacks on Dyn](https://en.wikipedia.org/wiki/DDoS_attacks_on_Dyn)
- The Register — [DNS devastation: Top websites whacked offline as Dyn dies again](https://www.theregister.com/2016/10/21/dns_devastation_as_dyn_dies_under_denialofservice_attack/)
- The Register — [Today the web was broken by countless hacked devices: your 60-second summary](https://www.theregister.com/2016/10/21/dyn_dns_ddos_explained/)
- The Register — [Mirai, Mirai, pwn them all: who's the greatest botnet on the whole?](https://www.theregister.com/2017/11/07/mirai_botnet_sitrep/)
- The Register — [In the two years since Dyn went dark, what have we learned? Not much, it appears](https://www.theregister.com/2018/10/11/dns_insecurity_survey/)
- BankInfoSecurity — [Botnet Army of 'Up to 100,000' IoT Devices Disrupted Dyn](https://www.bankinfosecurity.com/botnet-army-just-100000-iot-devices-disrupted-dyn-a-9486)
- Carnegie Mellon CyLab — [Four years since the Mirai-Dyn attack… is the Internet safer?](https://cylab.cmu.edu/news/2020/10/30-dynattack.html)
- CyberScoop — [Three men plead guilty for roles in Mirai botnet empire](https://cyberscoop.com/mirai-botnet-charges-paris-jha-dalton-norman-josiah-white/)
