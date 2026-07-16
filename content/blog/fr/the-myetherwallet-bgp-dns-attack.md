---
title: "L'attaque BGP + DNS contre MyEtherWallet : comment le détournement du routage Internet a vidé 150 000 $ en ETH"
date: '2026-06-17'
language: fr
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['aileen-wright']
editors: ['victor-zhou']
draft: false
description: "Le 24 avril 2018, des attaquants ont détourné le routage Internet d'Amazon Route 53, empoisonné les réponses DNS pour myetherwallet.com, et servi un clone de phishing derrière un certificat auto-signé — vidant environ 150 000 $ en Ethereum. Une analyse approfondie Domain Mayday sur les raisons pour lesquelles DNS repose sur une couche de routage qui fait confiance par défaut."
keywords: ['myetherwallet', 'bgp hijack', 'détournement dns', 'amazon route 53', 'route 53 hijack', 'sécurité dns', 'sécurité routage bgp', 'phishing ethereum', 'certificat auto-signé', 'enet as10297', 'rpki roa', 'phishing portefeuille crypto', 'sécurité des domaines']
relatedArticles:
  - /fr/blog/the-fox-it-dns-hijack/
  - /fr/blog/the-curve-finance-dns-hijack/
  - /fr/blog/the-bitcoin-org-dns-hijack/
  - /fr/blog/the-godaddy-multi-year-breach/
  - /fr/blog/the-dnspionage-campaign/
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
  - /fr/glossary/web3/
---

Lorsque vous tapez le nom d'un site web dans un navigateur, vous faites confiance à deux systèmes invisibles pour être honnêtes avec vous.

Le premier est le **DNS** — l'annuaire téléphonique d'Internet — qui transforme un nom comme `myetherwallet.com` en une [adresse IP](/fr/glossary/ip-address/) numérique. Le second est **BGP**, le Border Gateway Protocol, qui décide quel chemin physique empruntent vos paquets pour atteindre cette adresse. Presque personne n'y pense. Ils fonctionnent simplement, des milliards de fois par jour, en silence.

Le matin du **24 avril 2018**, les deux ont menti en même temps. Pendant environ deux heures, quiconque tapait `myetherwallet.com` et ignorait un avertissement du navigateur était dirigé vers un clone de phishing fonctionnant sur un serveur bien loin de leur destination réelle. Le temps que le routage soit corrigé, les attaquants avaient vidé environ **150 000 $ en [Ethereum](/fr/glossary/ethereum/)** depuis les portefeuilles d'utilisateurs réels.

Ce qui fait de cet incident un cas permanent dans les cursus de sécurité n'est pas la somme en dollars — les vols de crypto l'ont depuis largement dépassée. C'est le *mécanisme*. Les attaquants n'ont jamais pénétré les serveurs de MyEtherWallet. Ils n'ont jamais deviné un mot de passe. Ils ont attaqué la **route**, pas le bâtiment — en détournant la couche de routage d'Internet pour empoisonner le DNS lui-même.

## Le DNS repose sur une couche de routage qui fait confiance par défaut

Pour comprendre ce qui s'est passé, il faut comprendre la fondation inconfortable sous-jacente à chaque nom de domaine sur Terre.

Le DNS répond à la question « quelle adresse IP correspond à `myetherwallet.com` ? » Mais pour que votre requête DNS atteigne le bon serveur, les routeurs Internet doivent savoir *quel réseau* possède les adresses IP de ce serveur DNS — et pour le savoir, ils s'appuient sur BGP.

Voilà le problème. BGP est, par conception, un système basé sur la confiance. Comme le résume Cloudflare sur Wikipédia, [par défaut, le protocole BGP est conçu pour faire confiance à toutes les annonces de routes envoyées par ses pairs](https://en.wikipedia.org/wiki/BGP_hijacking#:~:text=by%20default%20the%20BGP%20protocol%20is%20designed%20to%20trust%20all%20route%20announcements%20sent%20by%20peers). Le chercheur en sécurité Bob Cromwell décrit l'intention d'origine de manière encore plus directe : [BGP a été conçu comme une chaîne de confiance entre des FAI et des universités bienveillants qui croient aveuglément les informations qu'ils reçoivent](https://cromwell-intl.com/cybersecurity/bgp-hijacking.html#:~:text=BGP%20was%20designed%20to%20be%20a%20chain%20of%20trust).

En d'autres termes : quand un opérateur de réseau se lève et annonce au monde entier « le trafic pour *ces* adresses IP doit passer par *moi* », le reste d'Internet l'a historiquement simplement cru. Il existe dans BGP un mécanisme de départage par route plus spécifique — si deux réseaux revendiquent les mêmes adresses, celui qui annonce le bloc le *plus étroit* et le plus spécifique l'emporte. Ce mécanisme est exactement le levier qu'un attaquant actionne.

Ainsi, la surface d'attaque pour tout domaine est plus grande que son registrar, plus grande que son fournisseur DNS, et plus grande que son hébergeur web. Elle inclut l'ensemble du tissu de routage mondial qui achemine votre requête DNS au bon endroit. MyEtherWallet l'a appris à ses dépens.

## Ce que les utilisateurs ont perdu le 24 avril 2018

![Art conceptuel coloré représentant le trafic Internet s'écoulant le long d'une autoroute de données lumineuse, soudainement dévié par un faux panneau de détour vers une fausse route menant à un bâtiment imposteur, des paquets de lumière se dispersant dans un piège](../../assets/the-myetherwallet-bgp-dns-attack-01-attack.jpg)

Les dommages se sont concentrés sur une fenêtre d'environ deux heures. Selon The Register, le routage malveillant a fonctionné [entre 11h et 13h UTC](https://www.theregister.com/2018/04/24/myetherwallet_dns_hijack/#:~:text=Between%2011am%20and%201pm%20UTC) ce jour-là. Durant cette fenêtre, une partie de tous ceux qui tentaient d'accéder à `myetherwallet.com` était silencieusement remise à un imposteur.

L'imposteur était convaincant. Il ressemblait à MyEtherWallet parce qu'il en était un clone presque parfait. La *seule* chose qui le trahissait était un avertissement de certificat — et surtout, les utilisateurs pouvaient passer outre cet avertissement d'un simple clic. Ceux qui le faisaient, puis se connectaient, remettaient les clés de leurs propres fonds. Comme l'a rapporté BleepingComputer, [ceux qui se connectaient voyaient leurs clés privées de portefeuille volées, que l'attaquant utilisait pour vider les comptes](https://www.bleepingcomputer.com/news/security/hacker-hijacks-dns-server-of-myetherwallet-to-steal-160-000/#:~:text=Those%20who%20logged%20in%20had%20their%20wallet%20private%20keys%20stolen).

Le bilan est légèrement différent selon les sources, mais le chiffre central est cohérent. BleepingComputer l'a estimé à [215 Ether, l'équivalent de 160 000 $, au moment de la transaction](https://www.bleepingcomputer.com/news/security/hacker-hijacks-dns-server-of-myetherwallet-to-steal-160-000/#:~:text=215%20Ether%2C%20the%20equivalent%20of%20%24160%2C000). CyberScoop a rapporté que les voleurs [ont réussi à dérober 215 Ether, soit environ 152 000 $ à l'époque](https://cyberscoop.com/ether-dns-bgp-amazon-route-53-heist/#:~:text=215%20Ether%2C%20amounting%20to%20about%20%24152%2C000). Help Net Security a résumé que les attaquants [ont réussi à voler environ 150 000 $ en Ethereum](https://www.helpnetsecurity.com/2018/04/25/myetherwallet-dns-hijacking/#:~:text=approximately%20%24150%2C000%20in%20Ethereum). Mêmes 215 ETH ; le montant en dollars fluctue simplement selon le taux de change au moment du vol.

Telle est la brutalité économique d'une attaque combinant détournement de routage et DNS sur un portefeuille crypto. Il n'existe pas de service de rétrofacturation, pas de contestation possible, pas de banque à appeler. Une fois que les clés privées sont saisies dans le clone d'un attaquant et que les fonds sont déplacés sur la chaîne, ils sont perdus.

## Comment cela s'est produit : détourner la route, empoisonner la réponse, servir le clone

![Art conceptuel coloré représentant une carte du monde lumineuse détournée où un itinéraire GPS est redirigé par une main imposteur qui retrace le chemin, des voyageurs guidés vers un faux bâtiment tandis que la vraie destination brille, ignorée, au loin](../../assets/the-myetherwallet-bgp-dns-attack-02-bgp-hijack.jpg)

L'attaque a enchaîné deux défaillances. Aucune n'aurait suffi seule. Ensemble, elles ont été dévastatrices.

**Étape un : détourner la route vers les serveurs DNS d'Amazon.** MyEtherWallet utilisait le service DNS géré d'Amazon. Comme Help Net Security l'a clairement noté, [MyEtherWallet.com utilise le service DNS Route 53 d'Amazon](https://www.helpnetsecurity.com/2018/04/25/myetherwallet-dns-hijacking/#:~:text=MyEtherWallet.com%20uses%20Amazon%27s%20Route%2053%20DNS%20service). Les attaquants n'ont pas pénétré Route 53. Au lieu de cela, selon The Register, [quelqu'un a pu envoyer des messages BGP — Border Gateway Protocol — aux routeurs centraux d'Internet pour les convaincre d'envoyer le trafic destiné à certains serveurs AWS vers une machine pirate](https://www.theregister.com/2018/04/24/myetherwallet_dns_hijack/#:~:text=someone%20was%20able%20to%20send%20BGP).

L'annonce qui a tout déclenché provenait d'un endroit inattendu. The Register a rapporté que [le bloc réseau AS10297, appartenant à eNet, une société d'hébergement web basée dans l'Ohio, a annoncé qu'il pouvait prendre en charge le trafic destiné à certaines adresses IP d'AWS](https://www.theregister.com/2018/04/24/myetherwallet_dns_hijack/#:~:text=the%20network%20block%20AS10297%2C%20belonging%20to%20Ohio-based%20website%20hosting%20biz%20eNet). Et parce que BGP préfère les routes plus spécifiques et fait confiance à ses pairs, la fausse annonce s'est propagée. Wikipédia en consigne l'ampleur : [Environ 1 300 adresses IP dans l'espace Amazon Web Services, dédiées à Amazon Route 53, ont été détournées par eNet (ou l'un de ses clients), un FAI de Columbus, Ohio. Plusieurs partenaires de peering, tels que Hurricane Electric, ont propagé les annonces aveuglément](https://en.wikipedia.org/wiki/BGP_hijacking#:~:text=Roughly%201300%20IP%20addresses%20within%20Amazon%20Web%20Services%20space). « Propagées aveuglément » résume en deux mots tout le modèle de confiance de BGP.

**Étape deux : devenir le serveur DNS et mentir.** Une fois la route détournée, les requêtes qui auraient dû arriver aux vrais serveurs DNS d'Amazon ont atterri sur la machine de l'attaquant à la place. Cette machine a usurpé l'identité de Route 53. The Register a décrit le résultat : [cette machine pirate a alors agi comme le service DNS d'AWS, et a fourni de mauvaises adresses IP pour MyEtherWallet.com, redirigeant certains visiteurs malheureux vers un site de phishing](https://www.theregister.com/2018/04/24/myetherwallet_dns_hijack/#:~:text=That%20rogue%20machine%20then%20acted%20as%20AWS%27s%20DNS%20service). L'analyse de Kentik formule le même fait du côté DNS : [le faux serveur DNS autoritaire a renvoyé des réponses erronées pour myetherwallet.com, redirigeant les utilisateurs vers une version imposteur du site MyEtherWallet](https://www.kentik.com/blog/bgp-hijacks-targeting-cryptocurrency-services/#:~:text=The%20imposter%20authoritative%20DNS%20server%20returned%20bogus%20responses%20for%20myetherwallet.com).

**Étape trois : servir le clone de phishing — depuis la Russie.** Les réponses DNS empoisonnées pointaient les utilisateurs vers un serveur en Russie hébergeant le faux portefeuille. Help Net Security a rapporté que les attaquants ont utilisé le détournement pour [rediriger le trafic destiné à MyEtherWallet.com vers le site de phishing sosie, hébergé sur un serveur en Russie](https://www.helpnetsecurity.com/2018/04/25/myetherwallet-dns-hijacking/#:~:text=they%20redirect%20traffic%20meant%20for%20MyEtherWallet.com%20to%20the%20lookalike%20phishing%20site%2C%20hosted%20on%20a%20server%20in%20Russia).

**L'unique protection qui a presque fonctionné : le certificat.** Voici la partie sur laquelle chaque lecteur devrait s'arrêter. Les attaquants contrôlaient la *résolution* du domaine et le *serveur*, mais ils ne pouvaient pas produire un certificat TLS valide pour `myetherwallet.com` émis par une autorité de confiance. Le navigateur a donc fait exactement ce qu'il était censé faire — il a affiché un avertissement. Help Net Security l'a décrit avec précision : [la seule chose indiquant que le site de phishing n'était pas ce qu'il prétendait être était l'avertissement affiché aux visiteurs indiquant que le certificat TLS utilisé par le site était signé par une autorité inconnue (c'est-à-dire auto-signé)](https://www.helpnetsecurity.com/2018/04/25/myetherwallet-dns-hijacking/#:~:text=the%20only%20thing%20that%20gave%20some%20indication). BleepingComputer a confirmé que le signal était évident pour quiconque y prêtait attention : [le faux site web était facile à repérer car les attaquants utilisaient un certificat TLS auto-signé qui déclenchait une erreur sur tous les navigateurs modernes](https://www.bleepingcomputer.com/news/security/hacker-hijacks-dns-server-of-myetherwallet-to-steal-160-000/#:~:text=The%20fake%20website%20was%20easy%20to%20spot).

Mais « facile à repérer » suppose que l'utilisateur s'arrête. WeLiveSecurity d'ESET a bien saisi la fragilité réelle de cette protection : [le seul indice évident qu'un utilisateur ordinaire aurait pu remarquer était que, lorsqu'il visitait le faux site MyEtherWallet, il voyait un message d'erreur lui indiquant que le site utilisait un certificat SSL non fiable](https://www.welivesecurity.com/2018/04/25/ethereum-cryptocurrency-wallets-raided/#:~:text=The%20only%20obvious%20clue%20that%20a%20typical%20user%20might%20have%20spotted). Le navigateur avait levé la main et dit *c'est une erreur*. Les utilisateurs qui ont perdu de l'argent sont ceux qui ont quand même cliqué pour passer outre — et les victimes [ont dû cliquer sur un message d'erreur HTTPS, car le faux MyEtherWallet.com utilisait un certificat TLS/SSL non approuvé](https://www.theregister.com/2018/04/24/myetherwallet_dns_hijack/#:~:text=Victims%20had%20to%20click%20through%20a%20HTTPS%20error%20message).

## Réponse et conséquences

Le détournement n'est pas passé inaperçu auprès de ceux qui surveillent le routage en temps réel. Les moniteurs réseau ont vu les faux préfixes plus spécifiques apparaître puis se retirer dans la même fenêtre de deux heures, et une fois l'annonce pirate retirée, le routage normal vers Route 53 a repris.

MyEtherWallet elle-même a été catégorique : sa propre infrastructure n'avait pas été compromise. Comme l'entreprise l'a souligné dans les suites immédiates, le problème venait de la plomberie d'Internet, pas de son application — il s'agissait d'un [détournement DNS](https://www.helpnetsecurity.com/2018/04/25/myetherwallet-dns-hijacking/#:~:text=DNS%20hijacking) du chemin de résolution, réalisé par le biais du BGP, et non d'une compromission des serveurs ou du code de MEW.

La correction en profondeur a été apportée au niveau de la couche de routage. Cet épisode est devenu l'un des arguments les plus cités en faveur de **RPKI** (Resource Public Key Infrastructure) et des **ROA** (Route Origin Authorizations) — des enregistrements cryptographiques qui permettent aux réseaux de déclarer, de manière vérifiable, quels systèmes autonomes sont *autorisés* à annoncer quels préfixes IP. Avec des ROA valides en place, une annonce parasite « je prends les adresses d'Amazon » provenant d'un FAI de l'Ohio peut être signalée comme **RPKI-invalide** et rejetée plutôt que [propagée aveuglément](https://en.wikipedia.org/wiki/BGP_hijacking#:~:text=blindly%20propagated%20the%20announcements). Kentik en tire la conséquence directement : si la même annonce était faite aujourd'hui contre un préfixe correctement signé, [elle aurait été évaluée comme RPKI-invalide](https://www.kentik.com/blog/bgp-hijacks-targeting-cryptocurrency-services/#:~:text=it%20would%20have%20been%20evaluated%20as%20RPKI-invalid). Dans les années qui ont suivi des attaques comme celle-ci, les grands réseaux ont accéléré la publication de ROA précisément pour ce type de route.

Mais l'adoption du RPKI est un effort mondial, pluriannuel et basé sur l'adhésion volontaire. La leçon pour tous les autres était plus simple et plus immédiate : la sécurité de votre domaine dépend de couches que vous ne possédez pas et ne pouvez pas voir.

## Ce que cela enseigne sur la confiance par défaut dans BGP et DNS

Cet incident mérite d'être mémorisé car il inverse le modèle mental habituel de la « sécurité des domaines ».

La plupart des gens pensent que la sécurité d'un domaine signifie un mot de passe solide chez le registrar, une authentification à deux facteurs et un verrou de registrar. Tout cela est réel et nécessaire — et **rien de tout cela n'aurait arrêté le 24 avril 2018.** Les attaquants n'ont jamais touché le registrar, n'ont jamais touché les enregistrements DNS de MyEtherWallet, n'ont jamais touché ses serveurs. Les enregistrements indiquaient la bonne chose tout le temps. Internet a simplement cessé d'acheminer les requêtes vers l'endroit qui les détenait.

Quelques enseignements durables :

1. **Votre domaine repose sur une confiance empruntée.** La résolution dépend du BGP, et BGP, par [défaut... est conçu pour faire confiance à toutes les annonces de routes envoyées par ses pairs](https://en.wikipedia.org/wiki/BGP_hijacking#:~:text=by%20default%20the%20BGP%20protocol%20is%20designed%20to%20trust%20all%20route%20announcements%20sent%20by%20peers). Vous pouvez avoir une configuration DNS parfaite et quand même être détourné une couche en dessous.

2. **L'empoisonnement DNS peut être réalisé sans jamais toucher au DNS.** Détournez la route vers le serveur DNS et vous contrôlez les réponses, même lorsque les enregistrements autoritaires sont intacts.

3. **TLS est un vrai filet de sécurité — et un filet fragile.** L'avertissement de certificat était la seule chose qui séparait les utilisateurs d'une perte totale. Il a fonctionné techniquement et a échoué comportementalement. Un contrôle de sécurité qu'un utilisateur peut ignorer d'un clic n'est aussi solide que la patience de cet utilisateur.

4. **La finalité sur la chaîne supprime le filet de sécurité.** Pour une connexion bancaire, une session empoisonnée est grave. Pour un portefeuille crypto, c'est irréversible. La même attaque contre un autre type de site aurait été une alerte ; ici, c'était une perte permanente.

5. **La défense en profondeur doit inclure la couche de routage.** RPKI/ROA au niveau réseau, combiné à la surveillance des annonces d'origine inattendues de vos préfixes, est désormais la base minimale pour tout ce qui a de la valeur.

## L'angle Namefi

![Illustration colorée de la propriété de domaine vérifiable et inviolable — une carte de domaine sécurisée par un bouclier vert, un jeton Namefi vert, et la continuité DNS](../../assets/the-myetherwallet-bgp-dns-attack-03-namefi-angle.jpg)

L'attaque MyEtherWallet est un rappel cinglant qu'un domaine n'est pas une chose unique que vous « possédez » — c'est une pile de relations de confiance, dont n'importe quelle couche peut être subvertie : le [registre](/fr/glossary/registry/), le registrar, le fournisseur DNS, et le tissu de routage mondial qui achemine les requêtes vers ce fournisseur.

[Namefi](https://namefi.io) est construit autour de la volonté de rendre la couche de *propriété* de cette pile vérifiable et inviolable. La propriété de domaine tokenisée signifie que le contrôle d'un domaine peut être prouvé cryptographiquement et transféré de manière auditable, plutôt que de reposer uniquement sur un mot de passe de compte chez un seul fournisseur — tout en restant compatible avec DNS. Cela ne répare pas, en soi, BGP ; rien au niveau de la couche de propriété ne réécrit la façon dont Internet route les paquets. Mais cela s'attaque à la même maladie sous-jacente que cet incident a exposée : **trop de confiance critique sur Internet est implicite, invérifiable et réversible par quiconque peut usurper le bon message.**

L'avenir de la sécurité des domaines ressemble moins à un seul mot de passe fort et davantage à une preuve cryptographique à chaque couche — propriété vérifiable, routage vérifiable (RPKI), identité vérifiable (TLS). Les utilisateurs de MyEtherWallet ont perdu de l'argent dans l'espace entre ces couches. Combler cet écart, une couche vérifiable à la fois, est tout le projet.

Les enregistrements de domaine n'étaient jamais erronés le 24 avril 2018. Internet a simplement cru un mensonge sur la façon de les atteindre. Rendre « qui possède quoi, et comment l'atteindre » prouvable plutôt que supposé, c'est ainsi que l'on s'assure que la prochaine fausse annonce sera rejetée plutôt qu'obéie.

## Sources et lectures complémentaires

- The Register — [Cryptocurrency thieves snatch ~$150k after BGP hijack reroutes MyEtherWallet DNS](https://www.theregister.com/2018/04/24/myetherwallet_dns_hijack/)
- BleepingComputer — [Hacker Hijacks DNS Server of MyEtherWallet to Steal $160,000](https://www.bleepingcomputer.com/news/security/hacker-hijacks-dns-server-of-myetherwallet-to-steal-160-000/)
- Help Net Security — [MyEtherWallet users robbed after successful DNS hijacking attack](https://www.helpnetsecurity.com/2018/04/25/myetherwallet-dns-hijacking/)
- CyberScoop — [Amazon DNS service server hijacked for $152,000 Ether theft](https://cyberscoop.com/ether-dns-bgp-amazon-route-53-heist/)
- ESET WeLiveSecurity — [Ethereum cryptocurrency wallets raided after Amazon's internet domain service hijacked](https://www.welivesecurity.com/2018/04/25/ethereum-cryptocurrency-wallets-raided/)
- Kentik — [What can be learned from recent BGP hijacks targeting cryptocurrency services?](https://www.kentik.com/blog/bgp-hijacks-targeting-cryptocurrency-services/)
- Wikipedia — [BGP hijacking](https://en.wikipedia.org/wiki/BGP_hijacking)
- Bob Cromwell — [BGP Hijacking](https://cromwell-intl.com/cybersecurity/bgp-hijacking.html)
- Neptune Mutual — [How Was MEW (MyEtherWallet) DNS Spoofed?](https://medium.com/neptune-mutual/how-was-mew-myetherwallet-dns-spoofed-cb813fab15f0)
- WCCFTech — [Hackers Hijacked DNS Servers to Steal from MyEtherWallet Users](https://wccftech.com/hackers-domain-service-to-empty-ethereum-wallets/)
