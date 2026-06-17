---
title: "L'attaque DNS de Dyn : quand un botnet Mirai de caméras piratées a fait tomber la moitié d'Internet"
date: '2026-06-17'
language: fr
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: "Le 21 octobre 2016, une attaque DDoS perpétrée par le botnet IoT Mirai a frappé le fournisseur DNS Dyn en trois vagues, mettant hors ligne Twitter, Netflix, Reddit, Spotify, GitHub, Airbnb et PayPal pendant des heures — une étude de cas Domain Mayday sur la concentration des fournisseurs DNS."
keywords: ['attaque dns dyn', 'botnet mirai', 'ddos 21 octobre 2016', 'attaque ddos dns', 'botnet iot', 'panne fournisseur dns', 'sécurité des domaines', 'dns point de défaillance unique', 'ddos dyn 2016', 'malware mirai', 'panne internet 2016', 'redondance dns', 'caméras iot piratées']
---

Pendant quelques heures, un vendredi d'octobre 2016, Internet a oublié comment se trouver lui-même.

Twitter affichait une page blanche. Netflix tournait dans le vide puis abandonnait. Reddit, Spotify, GitHub, Airbnb, PayPal — tous présents, tous en ligne, tous fonctionnant parfaitement sur leurs propres serveurs, et tous complètement inaccessibles. Rien n'avait été piraté. Aucune donnée n'avait été volée. Les sites web étaient exactement là où ils avaient toujours été. Ce qui est tombé en panne, c'est la partie d'Internet qui *vous dit où se trouvent les choses*.

L'attaque n'a pas frappé Twitter ou Netflix. Elle a frappé une entreprise dont la plupart de leurs utilisateurs n'avaient jamais entendu parler : **Dyn**, une société du New Hampshire qui gérait le DNS — le carnet d'adresses d'Internet — pour une grande partie du web moderne. Et l'arme n'était pas une ferme de serveurs ou l'arsenal d'un État-nation. C'était un essaim de babyphones, de webcams et de routeurs domestiques piratés : des gadgets ménagers ordinaires, enrôlés discrètement dans une armée appelée **Mirai**.

Voici **Domain Mayday EP08** — le jour où des caméras intelligentes non sécurisées ont fait tomber l'annuaire d'Internet.

## DNS : le carnet d'adresses d'Internet, et la place de Dyn en son sein

Chaque fois que vous tapez un nom de domaine, votre ordinateur doit le le traduire en une adresse IP numérique avant de pouvoir se connecter à quoi que ce soit. Cette traduction est le travail du DNS, le système de noms de domaine (*Domain Name System*). C'est la couche de résolution entre le nom compréhensible par l'humain et la machine vers laquelle ce nom pointe.

Dyn était l'un des grands fournisseurs infogérés de ce service de résolution. Lorsqu'un site externalisait son DNS à Dyn, les serveurs de noms de Dyn devenaient la source faisant autorité pour répondre à la question « où réside ce domaine ? ». The Register a clairement exposé cette dépendance pendant l'attaque : en mettant Dyn hors ligne, les résolveurs DNS publics gérés par Google et les FAI étaient [incapables de contacter Dyn pour rechercher des noms d'hôtes pour les internautes, empêchant les gens d'accéder aux sites utilisant Dyn pour leur DNS](https://www.theregister.com/2016/10/21/dns_devastation_as_dyn_dies_under_denialofservice_attack/#:~:text=unable%20to%20contact%20Dyn%20to%20lookup%20hostnames).

C'est la fragilité silencieuse au cœur de cette histoire. Un site web peut être irréprochable — serveurs redondants, disponibilité parfaite, ingénieurs de classe mondiale — et tout de même disparaître d'Internet si l'unique fournisseur qui répond à « où est-ce ? » s'éteint. Comme l'a résumé plus tard le CyLab de l'Université Carnegie Mellon, les domaines touchés étaient [critiquement dépendants de Dyn, un DNS tiers. En d'autres termes, ils dépendaient uniquement de Dyn, donc quand Dyn est tombé, ils sont tombés avec](https://cylab.cmu.edu/news/2020/10/30-dynattack.html#:~:text=critically%20dependent%20on%20Dyn).

## 21 octobre 2016 : l'attaque est arrivée par vagues

![Concept art vif et coloré d'un raz-de-marée de trafic indésirable brillant s'abattant sur un standard téléphonique géant illuminé, les lumières de l'annuaire clignotant sur une carte sombre](../../assets/the-dyn-dns-mirai-attack-01-attack.jpg)

L'assaut a commencé le matin du vendredi 21 octobre 2016, et n'a pas frappé en un seul coup. Il a déferlé en plusieurs vagues distinctes tout au long de la journée.

Le compte rendu de l'incident sur Wikipédia répertorie [trois attaques consécutives par déni de service distribué](https://en.wikipedia.org/wiki/DDoS_attacks_on_Dyn#:~:text=three%20consecutive%20distributed%20denial%2Dof%2Dservice%20attacks) contre Dyn, commençant vers 11h10 UTC. La mécanique était celle d'un déni de service distribué typique : l'[attaque DDoS a été accomplie par de nombreuses requêtes de résolution DNS provenant de dizaines de millions d'adresses IP](https://en.wikipedia.org/wiki/DDoS_attacks_on_Dyn#:~:text=numerous%20DNS%20lookup%20requests%20from%20tens%20of%20millions%20of%20IP%20addresses), noyant les serveurs de noms de Dyn sous un tel volume de trafic indésirable que les recherches légitimes ne pouvaient plus passer.

Ce sont ces vagues qui lui ont donné ce caractère implacable. The Register, qui couvrait l'événement en direct, a décrit le moment où Dyn semblait récupérer — avant de replonger : [après deux heures dans le raz-de-marée initial de trafic indésirable, Dyn a annoncé qu'il avait atténué l'assaut et que le service revenait à la normale. Mais le soulagement fut de courte durée : environ une heure plus tard, l'attaque a repris](https://www.theregister.com/2016/10/21/dns_devastation_as_dyn_dies_under_denialofservice_attack/#:~:text=After%20two%20hours%20into%20the%20initial%20tidal%20wave). Ce qui ressemblait à la fin n'était en réalité que la pause entre deux rounds.

En volume brut, l'attaque était énorme pour son époque — parmi les plus grands événements DDoS observés jusqu'alors, The Register caractérisant le pic à [plus de 1 To/s](https://www.theregister.com/2017/11/07/mirai_botnet_sitrep/#:~:text=more%20than%201TBps). (Dyn a lui-même averti qu'une « tempête de requêtes répétées » de trafic légitime avait gonflé certaines des premières estimations, un point sur lequel nous reviendrons.)

## Quels sites ont été inaccessibles — et l'impact ressenti

Lorsque les serveurs de noms de Dyn n'ont pas pu répondre, la panne s'est propagée à tous ceux qui en dépendaient. Il ne s'agissait pas d'un coin obscur du web. C'était la page d'accueil de l'Internet grand public.

Le reportage en direct de The Register a nommé directement certaines des victimes : une attaque extraordinaire et ciblée sur Dyn qui a continué à [perturber les services Internet de centaines d'entreprises, y compris les géants en ligne Twitter, Amazon, AirBnB, Spotify et d'autres](https://www.theregister.com/2016/10/21/dns_devastation_as_dyn_dies_under_denialofservice_attack/#:~:text=disrupt%20internet%20services%20for%20hundreds%20of%20companies). La liste des services touchés sur Wikipédia ressemble au Who's Who des plus grands sites de l'époque : [Airbnb, Amazon.com, CNN, GitHub, Netflix, PayPal, Reddit, Spotify, Twitter](https://en.wikipedia.org/wiki/DDoS_attacks_on_Dyn#:~:text=Airbnb), et des dizaines d'autres.

Brian Krebs, dont le propre site avait été frappé par le même malware quelques semaines plus tôt, a décrit l'expérience utilisateur au fur et à mesure que l'[attaque commençait à créer des problèmes pour les internautes tentant d'accéder à un ensemble de sites, dont Twitter, Amazon, Tumblr, Reddit, Spotify et Netflix](https://krebsonsecurity.com/2016/10/hacked-cameras-dvrs-powered-todays-massive-internet-outage/#:~:text=an%20array%20of%20sites%2C%20including%20Twitter). Pour les utilisateurs ordinaires, il n'y avait aucune erreur compréhensible. Les sites refusaient simplement de charger — d'abord le long de la côte Est des États-Unis, puis le problème s'est étendu avec l'arrivée des vagues successives, touchant des utilisateurs à travers tous les États-Unis et jusqu'en Europe.

## Comment c'est arrivé : une armée d'appareils intelligents non sécurisés

![Concept art vif et coloré de milliers de minuscules caméras intelligentes, grille-pains et babyphones piratés et souriants, grouillant comme des insectes lumineux vers une seule tour d'annuaire surchargée](../../assets/the-dyn-dns-mirai-attack-02-mirai-botnet.jpg)

Voici la partie qui a fait de l'attaque contre Dyn un tournant : la puissance de feu ne provenait pas d'ordinateurs. Elle provenait d'*objets*.

Mirai est un malware qui traque les appareils de l'Internet des Objets (IoT) — caméras, routeurs, enregistreurs vidéo (DVR) — et les pirate. Il fonctionne en exploitant la faiblesse la plus négligente du matériel grand public : le mot de passe fourni par défaut avec l'appareil. Comme l'a décrit The Register, Mirai se propage sur le web, grossissant ses rangs de zombies obéissants, en [se connectant aux appareils en utilisant leurs mots de passe par défaut, configurés en usine, via Telnet et SSH](https://www.theregister.com/2016/10/21/dyn_dns_ddos_explained/#:~:text=logging%20into%20devices%20using%20their%20default%2C%20factory%2Dset%20passwords). Krebs a décrit le mécanisme tout aussi crûment : Mirai [ratisse le Web à la recherche d'appareils IoT protégés par à peine plus que des noms d'utilisateur et des mots de passe d'usine par défaut, puis enrôle ces appareils dans des attaques](https://krebsonsecurity.com/2016/10/hacked-cameras-dvrs-powered-todays-massive-internet-outage/#:~:text=scours%20the%20Web%20for%20IoT%20devices).

Les appareils au cœur de l'attaque contre Dyn étaient en grande partie des webcams et des DVR bon marché. Krebs a retracé l'origine du botnet [principalement vers des enregistreurs vidéo numériques (DVR) et des caméras IP compromis, fabriqués par une entreprise high-tech chinoise appelée XiongMai Technologies](https://krebsonsecurity.com/2016/10/hacked-cameras-dvrs-powered-todays-massive-internet-outage/#:~:text=mainly%20compromised%20digital%20video%20recorders) — des appareils dont les identifiants par défaut, dans de nombreux cas, [ne pouvaient pas être modifiés par l'utilisateur](https://krebsonsecurity.com/2016/10/hacked-cameras-dvrs-powered-todays-massive-internet-outage/#:~:text=A%20user%20cannot%20feasibly%20change%20this%20password) car le mot de passe était codé en dur dans le firmware.

Deux choses ont transformé Mirai d'une simple nuisance en une catastrophe. Premièrement, l'auteur du malware avait, [fin septembre 2016, publié son code source, permettant ainsi à quiconque de constituer sa propre armée d'attaque](https://krebsonsecurity.com/2016/10/hacked-cameras-dvrs-powered-todays-massive-internet-outage/#:~:text=released%20the%20source%20code%20for%20it). Deuxièmement, le nombre d'appareils vulnérables était gigantesque. Dyn a confirmé la signature de l'attaque : l'entreprise a pu [confirmer qu'un volume important du trafic de l'attaque provenait de botnets basés sur Mirai](https://www.bankinfosecurity.com/botnet-army-just-100000-iot-devices-disrupted-dyn-a-9486#:~:text=confirm%20that%20a%20significant%20volume%20of%20attack%20traffic%20originated%20from%20Mirai), et Wikipédia décrit le botnet comme un essaim [d'appareils connectés à Internet — tels que des imprimantes, des caméras IP, des passerelles résidentielles et des babyphones — qui avaient été infectés par le malware Mirai](https://en.wikipedia.org/wiki/DDoS_attacks_on_Dyn#:~:text=printers%2C%20IP%20cameras%2C%20residential%20gateways%20and%20baby%20monitors).

## Les conséquences : compter l'essaim — et les auteurs

Quand la poussière est retombée, même la question fondamentale de savoir *quelle en était l'ampleur* s'est avérée difficile à résoudre. L'analyse post-incident de Dyn elle-même, via son vice-président exécutif Scott Hilton, a estimé le botnet à [jusqu'à 100 000 points terminaux malveillants](https://www.bankinfosecurity.com/botnet-army-just-100000-iot-devices-disrupted-dyn-a-9486#:~:text=up%20to%20100%2C000%20malicious%20endpoints) — un chiffre massif, mais bien inférieur aux « dizaines de millions d'IP » que suggéraient certains rapports initiaux. Cet écart provenait d'une boucle de rétroaction : les attaques malveillantes provenaient d'au moins un botnet, [la tempête de requêtes répétées fournissant un faux indicateur d'un ensemble de points terminaux beaucoup plus grand que ce que nous savons aujourd'hui](https://www.bankinfosecurity.com/botnet-army-just-100000-iot-devices-disrupted-dyn-a-9486#:~:text=with%20the%20retry%20storm%20providing%20a%20false%20indicator). En d'autres termes, le comportement automatique de « nouvelle tentative » intégré à Internet a amplifié le chaos.

Les suites judiciaires ont ajouté un rebondissement. Les trois jeunes hommes derrière Mirai — Paras Jha, Josiah White et Dalton Norman — ont fini par [plaider coupables pour leur rôle dans la création, l'exploitation et la vente de l'accès au « botnet Mirai »](https://cyberscoop.com/mirai-botnet-charges-paris-jha-dalton-norman-josiah-white/#:~:text=pleaded%20guilty%20for%20their%20role%20in%20creating). Mais au moment de l'attaque contre Dyn, Jha avait déjà rendu le code source public — et les procureurs ainsi que les journalistes ont pris soin de noter que les attaquants de Dyn n'étaient pas nécessairement le trio d'origine. Comme l'a rapporté CyberScoop, il n'est [pas encore clair, par exemple, qui était derrière l'attaque la plus médiatisée liée à Mirai contre la société de gestion des performances Internet Dyn](https://cyberscoop.com/mirai-botnet-charges-paris-jha-dalton-norman-josiah-white/#:~:text=not%20yet%20clear%2C%20for%20example%2C%20who%20was%20behind). Une fois l'arme rendue open-source, n'importe qui pouvait appuyer sur la gâchette.

Pour Dyn, les dommages commerciaux furent bien réels : dans les mois qui ont suivi, des milliers de domaines ont migré leur DNS ailleurs, une leçon coûteuse sur la confiance des clients après une seule mauvaise journée.

## Ce que cela nous apprend sur la concentration des fournisseurs DNS

L'attaque de Dyn reste dans les mémoires comme une histoire de sécurité de l'IoT, et c'en est indéniablement une. Mais sa leçon la plus profonde concerne l'*architecture* : le danger d'acheminer une trop grande partie d'Internet à travers un seul point d'étranglement.

Chaque site qui a sombré dans l'obscurité le 21 octobre avait pris la même décision, en apparence tout à fait raisonnable — externaliser le DNS à un seul excellent fournisseur. Individuellement, c'était intelligent. Collectivement, cela signifiait qu'éliminer une seule entreprise pouvait effacer d'un coup une fraction significative du web. Le verdict du CyLab a été que les leçons de l'attaque [n'ont été suivies d'effet que par une poignée de sites web qui avaient été directement impactés](https://cylab.cmu.edu/news/2020/10/30-dynattack.html#:~:text=have%20only%20been%20acted%20upon%20by%20a%20handful), même des années plus tard.

La réponse défensive est la redondance : répartir le DNS faisant autorité sur plus d'un fournisseur afin qu'aucune panne unique ne soit fatale. Deux ans après Dyn, The Register a constaté que cela était toujours rare et complexe — Cricket Liu, d'Infoblox, a souligné qu'il [n'est pas devenu plus facile d'utiliser plusieurs fournisseurs DNS faisant autorité, par exemple (disons Dyn plus Verisign ou Neustar). Pouvoir utiliser plusieurs fournisseurs ferait une grande différence](https://www.theregister.com/2018/10/11/dns_insecurity_survey/#:~:text=hasn%27t%20gotten%20any%20easier%20to%20use%20multiple%20authoritative%20DNS%20providers). Les points essentiels à retenir pour quiconque dépend d'un domaine :

1. **Un domaine a plus de points de défaillance que son seul bureau d'enregistrement (registrar).** Le fournisseur qui répond à la question « vers quoi pointe ce nom ? » est tout aussi critique que les serveurs derrière lui.
2. **Un DNS à fournisseur unique est un point de défaillance unique.** Une excellente disponibilité dans des conditions normales ne dit rien du comportement sous un déluge de 1 To/s.
3. **La concentration est pratique mais fragile.** L'efficacité même qui rend un fournisseur attractif fait que sa panne est largement ressentie.
4. **La résilience est une propriété de la possession du domaine, pas seulement de l'hébergement.** Quand quelque chose tombe en panne, vous devez contrôler la configuration de votre domaine assez proprement pour pouvoir réacheminer le trafic rapidement.

## L'approche Namefi

![Illustration colorée d'une propriété de domaine vérifiable et résiliente — une carte de domaine sécurisée par un bouclier vert, un jeton Namefi vert et une continuité DNS](../../assets/the-dyn-dns-mirai-attack-03-namefi-angle.jpg)

L'attaque contre Dyn n'a pas volé un seul domaine. Elle n'a pas falsifié de transfert ni piraté de compte de bureau d'enregistrement. Et pourtant, pendant quelques heures, les personnes qui *possédaient* ces domaines ont effectivement perdu le contrôle de l'endroit où pointaient leurs noms — non pas parce que leur propriété était remise en question, mais parce que la couche opérationnelle située sous leurs domaines a lâché d'un coup.

Cet écart — entre la *propriété* d'un nom et le *contrôle fiable* de l'endroit où il est résolu — est exactement la faille que les attaques de ce type exploitent. Les domaines comptent parmi les actifs les plus précieux qu'une entreprise détient, pourtant leur contrôle se trouve souvent derrière une infrastructure opaque et centralisée que le propriétaire ne peut ni vérifier ni reconfigurer rapidement sous la pression.

[Namefi](https://namefi.io) est construit sur l'idée que les domaines devraient se comporter comme des actifs natifs d'Internet : une propriété qui est cryptographiquement vérifiable et portable, tout en restant pleinement compatible avec le DNS. Une propriété de domaine vérifiable et contrôlée par le propriétaire n'arrête pas un botnet — mais elle pousse le monde vers un Internet où le contrôle d'un nom est prouvable, auditable, et ne dépend pas silencieusement de la pire journée d'un seul fournisseur. L'attaque de Mirai sur Dyn est un rappel qu'un domaine que vous « possédez » n'est résilient qu'à la hauteur de la couche qui répond pour lui. La résilience commence par faire de la propriété et du contrôle quelque chose que vous pouvez réellement vérifier.

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