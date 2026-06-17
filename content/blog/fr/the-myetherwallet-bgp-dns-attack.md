---
title: "L'attaque BGP + DNS de MyEtherWallet : Comment le détournement du routage Internet a siphonné 150 000 $ en ETH"
date: '2026-06-17'
language: fr
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: "Le 24 avril 2018, des attaquants ont détourné le routage Internet d'Amazon Route 53, empoisonné les réponses DNS pour myetherwallet.com et servi un clone de phishing derrière un certificat auto-signé, siphonnant ainsi environ 150 000 $ en Ethereum. Une analyse approfondie de Domain Mayday expliquant pourquoi le DNS repose sur une couche de routage qui fait confiance par défaut."
keywords: ['myetherwallet', 'détournement bgp', 'détournement dns', 'amazon route 53', 'détournement route 53', 'sécurité dns', 'sécurité du routage bgp', 'phishing ethereum', 'certificat auto-signé', 'enet as10297', 'rpki roa', 'phishing portefeuille crypto', 'sécurité des domaines']
---

Lorsque vous tapez le nom d'un site Web dans un navigateur, vous faites confiance à deux systèmes invisibles pour être honnêtes avec vous.

Le premier est le **DNS** — l'annuaire téléphonique d'Internet — qui transforme un nom comme `myetherwallet.com` en une adresse IP numérique. Le second est **BGP**, le Border Gateway Protocol, qui décide quel chemin physique vos paquets empruntent pour atteindre cette adresse. Presque personne ne pense ni à l'un ni à l'autre. Ils fonctionnent tout simplement, des milliards de fois par jour, en silence.

Le matin du **24 avril 2018**, les deux ont menti en même temps. Pendant environ deux heures, quiconque tapait `myetherwallet.com` et ignorait un avertissement du navigateur était redirigé vers un clone de phishing exécuté sur un serveur bien loin de sa destination supposée. Au moment où le routage a été corrigé, les attaquants avaient drainé environ **150 000 $ en Ethereum** depuis les portefeuilles de vrais utilisateurs.

Ce qui fait de cet incident un cas d'étude incontournable en matière de sécurité n'est pas le montant en dollars — les vols de cryptomonnaies l'ont depuis largement éclipsé. C'est le *mécanisme*. Les attaquants n'ont jamais piraté les serveurs de MyEtherWallet. Ils n'ont jamais deviné un mot de passe. Ils ont attaqué la **route**, et non le bâtiment, en détournant la couche de routage d'Internet pour empoisonner le DNS lui-même.

## Le DNS repose sur une couche de routage qui fait confiance par défaut

Pour comprendre ce qui s'est passé, vous devez comprendre la base inconfortable sur laquelle repose chaque nom de domaine sur terre.

Le DNS répond à la question « quelle est l'adresse IP de `myetherwallet.com` ? ». Mais pour que votre requête DNS atteigne le bon serveur, les routeurs d'Internet doivent savoir *quel réseau* possède les adresses IP de ce serveur DNS — et pour le découvrir, ils s'appuient sur BGP.

C'est là qu'est le piège. BGP est, par conception, un système basé sur la confiance. Comme le résume la page Wikipédia de manière similaire à Cloudflare, [par défaut, le protocole BGP est conçu pour faire confiance à toutes les annonces de routes envoyées par les pairs](https://en.wikipedia.org/wiki/BGP_hijacking#:~:text=by%20default%20the%20BGP%20protocol%20is%20designed%20to%20trust%20all%20route%20announcements%20sent%20by%20peers). Le chercheur en sécurité Bob Cromwell décrit l'intention initiale de manière encore plus directe : [BGP a été conçu pour être une chaîne de confiance entre des FAI et des universités bien intentionnés qui croient aveuglément les informations qu'ils reçoivent](https://cromwell-intl.com/cybersecurity/bgp-hijacking.html#:~:text=BGP%20was%20designed%20to%20be%20a%20chain%20of%20trust).

En d'autres termes : lorsqu'un opérateur de réseau se lève et annonce au monde entier « le trafic destiné à *ces* adresses IP doit passer par *moi* », le reste d'Internet, historiquement, l'a tout simplement cru. Il existe une règle de départage favorisant la route la plus spécifique intégrée à BGP — si deux réseaux revendiquent les mêmes adresses, celui qui annonce le bloc le plus *étroit* et le plus spécifique l'emporte. Cette règle de départage est exactement le levier qu'un attaquant actionne.

Ainsi, la surface d'attaque de n'importe quel domaine est plus vaste que son bureau d'enregistrement (registrar), plus vaste que son fournisseur DNS et plus vaste que son hébergeur Web. Elle inclut l'ensemble de la structure de routage mondial qui achemine votre requête DNS au bon endroit. MyEtherWallet l'a découvert à ses dépens.

## Ce que les utilisateurs ont perdu le 24 avril 2018

![Concept art vif et coloré du trafic Internet circulant le long d'une autoroute de données lumineuse, soudainement dévié par un faux panneau de déviation vers une fausse route menant à un bâtiment imposteur, des paquets de lumière s'éparpillant dans un piège](../../assets/the-myetherwallet-bgp-dns-attack-01-attack.jpg)

Les dégâts se sont concentrés sur une fenêtre d'environ deux heures. Selon The Register, le routage malveillant a eu lieu [entre 11h00 et 13h00 UTC](https://www.theregister.com/2018/04/24/myetherwallet_dns_hijack/#:~:text=Between%2011am%20and%201pm%20UTC) ce jour-là. Dans ce laps de temps, une partie de tous ceux qui tentaient d'atteindre `myetherwallet.com` a été discrètement redirigée vers un imposteur.

L'imposteur était convaincant. Il ressemblait à MyEtherWallet car c'était un clone presque exact. La *seule* chose qui le trahissait était un avertissement de certificat — et, de manière cruciale, les utilisateurs pouvaient ignorer cet avertissement d'un simple clic. Ceux qui l'ont fait, puis se sont connectés, ont remis les clés de leurs propres fonds. Comme l'a rapporté BleepingComputer, [ceux qui se sont connectés se sont fait voler les clés privées de leur portefeuille, que l'attaquant a utilisées pour vider les comptes](https://www.bleepingcomputer.com/news/security/hacker-hijacks-dns-server-of-myetherwallet-to-steal-160-000/#:~:text=Those%20who%20logged%20in%20had%20their%20wallet%20private%20keys%20stolen).

Le bilan est rapporté de manière légèrement différente selon les médias, mais le chiffre de base est constant. BleepingComputer l'a estimé à [215 Ether, soit l'équivalent de 160 000 $ au moment de la transaction](https://www.bleepingcomputer.com/news/security/hacker-hijacks-dns-server-of-myetherwallet-to-steal-160-000/#:~:text=215%20Ether%2C%20the%20equivalent%20of%20%24160%2C000). CyberScoop a rapporté que les voleurs [ont réussi à voler 215 Ether, s'élevant à environ 152 000 $ à l'époque](https://cyberscoop.com/ether-dns-bgp-amazon-route-53-heist/#:~:text=215%20Ether%2C%20amounting%20to%20about%20%24152%2C000). Help Net Security a résumé que les attaquants [ont réussi à voler environ 150 000 $ en Ethereum](https://www.helpnetsecurity.com/2018/04/25/myetherwallet-dns-hijacking/#:~:text=approximately%20%24150%2C000%20in%20Ethereum). Les mêmes 215 ETH ; le montant en dollars fluctue simplement avec le taux de change au moment du vol.

C'est l'économie brutale d'une attaque de routage associée au DNS sur un portefeuille crypto. Il n'y a pas de service de prévention des fraudes, pas d'annulation de transaction, pas de banque à appeler. Une fois que les clés privées sont saisies dans le clone d'un attaquant et que les fonds sont déplacés sur la chaîne (on-chain), ils sont perdus.

## Comment cela s'est produit : détourner la route, empoisonner la réponse, servir le clone

![Concept art vif et coloré d'une carte du monde lumineuse détournée où un itinéraire GPS est redirigé par une main d'imposteur redessinant le chemin, des voyageurs conduits vers un faux bâtiment emblématique tandis que la véritable destination brille ignorée au loin](../../assets/the-myetherwallet-bgp-dns-attack-02-bgp-hijack.jpg)

L'attaque a enchaîné deux défaillances. Aucune n'aurait fonctionné seule. Ensemble, elles ont été dévastatrices.

**Première étape : détourner la route vers les serveurs DNS d'Amazon.** MyEtherWallet utilisait le service DNS géré par Amazon. Comme l'a noté clairement Help Net Security, [MyEtherWallet.com utilise le service DNS Route 53 d'Amazon](https://www.helpnetsecurity.com/2018/04/25/myetherwallet-dns-hijacking/#:~:text=MyEtherWallet.com%20uses%20Amazon%27s%20Route%2053%20DNS%20service). Les attaquants n'ont pas piraté Route 53. Au lieu de cela, selon The Register, [quelqu'un a pu envoyer des messages BGP – Border Gateway Protocol – aux routeurs centraux d'Internet pour les convaincre d'envoyer le trafic destiné à certains des serveurs d'AWS vers une machine rebelle](https://www.theregister.com/2018/04/24/myetherwallet_dns_hijack/#:~:text=someone%20was%20able%20to%20send%20BGP).

L'annonce qui a provoqué cela provenait d'un endroit inattendu. The Register a rapporté que [le bloc réseau AS10297, appartenant à l'entreprise d'hébergement Web de l'Ohio eNet, a annoncé qu'il pouvait prendre en charge le trafic destiné à certaines des adresses IP d'AWS](https://www.theregister.com/2018/04/24/myetherwallet_dns_hijack/#:~:text=the%20network%20block%20AS10297%2C%20belonging%20to%20Ohio-based%20website%20hosting%20biz%20eNet). Et comme BGP préfère les routes plus spécifiques et fait confiance à ses pairs, la fausse annonce s'est propagée. Wikipédia documente l'ampleur : [Environ 1 300 adresses IP dans l'espace d'Amazon Web Services, dédiées à Amazon Route 53, ont été détournées par eNet (ou l'un de ses clients), un FAI de Columbus, dans l'Ohio. Plusieurs partenaires de peering, tels que Hurricane Electric, ont aveuglément propagé les annonces](https://en.wikipedia.org/wiki/BGP_hijacking#:~:text=Roughly%201300%20IP%20addresses%20within%20Amazon%20Web%20Services%20space). « Aveuglément propagé », c'est toute l'histoire du modèle de confiance de BGP en deux mots.

**Deuxième étape : devenir le serveur DNS et mentir.** Une fois la route détournée, les requêtes qui auraient dû aller vers les vrais serveurs DNS d'Amazon ont atterri à la place sur la machine de l'attaquant. Cette machine s'est fait passer pour Route 53. The Register a décrit le résultat : [cette machine malveillante a alors agi comme le service DNS d'AWS et a donné les mauvaises adresses IP pour MyEtherWallet.com, dirigeant certains visiteurs malchanceux du point-com vers un site de phishing](https://www.theregister.com/2018/04/24/myetherwallet_dns_hijack/#:~:text=That%20rogue%20machine%20then%20acted%20as%20AWS%27s%20DNS%20service). L'analyse de Kentik présente le même fait du côté du DNS : [le serveur DNS faisant autorité imposteur a renvoyé des réponses factices pour myetherwallet.com, redirigeant les utilisateurs vers une version imposteur du site Web de MyEtherWallet](https://www.kentik.com/blog/bgp-hijacks-targeting-cryptocurrency-services/#:~:text=The%20imposter%20authoritative%20DNS%20server%20returned%20bogus%20responses%20for%20myetherwallet.com).

**Troisième étape : servir le clone de phishing — depuis la Russie.** Les réponses DNS empoisonnées ont dirigé les utilisateurs vers un serveur en Russie hébergeant le faux portefeuille. Help Net Security a rapporté que les attaquants ont utilisé le détournement pour [rediriger le trafic destiné à MyEtherWallet.com vers le site de phishing sosie, hébergé sur un serveur en Russie](https://www.helpnetsecurity.com/2018/04/25/myetherwallet-dns-hijacking/#:~:text=they%20redirect%20traffic%20meant%20for%20MyEtherWallet.com%20to%20the%20lookalike%20phishing%20site%2C%20hosted%20on%20a%20server%20in%20Russia).

**La seule protection qui a failli fonctionner : le certificat.** C'est la partie sur laquelle chaque lecteur devrait s'attarder. Les attaquants contrôlaient la *résolution* du domaine et le *serveur*, mais ils ne pouvaient pas produire de certificat TLS valide pour `myetherwallet.com` émis par une autorité de confiance. Le navigateur a donc fait exactement ce qu'il était censé faire — il a affiché un avertissement. Help Net Security l'a décrit avec précision : [la seule chose qui donnait une indication que le site de phishing n'était pas ce qu'il prétendait être était l'avertissement montré aux visiteurs indiquant que le certificat TLS utilisé par le site était signé par une autorité inconnue (c'est-à-dire qu'il était auto-signé)](https://www.helpnetsecurity.com/2018/04/25/myetherwallet-dns-hijacking/#:~:text=the%20only%20thing%20that%20gave%20some%20indication). BleepingComputer convenait que l'indice était évident pour quiconque y prêtait attention : [le faux site Web était facile à repérer car les attaquants utilisaient un certificat TLS auto-signé qui déclenchait une erreur sur tous les navigateurs modernes](https://www.bleepingcomputer.com/news/security/hacker-hijacks-dns-server-of-myetherwallet-to-steal-160-000/#:~:text=The%20fake%20website%20was%20easy%20to%20spot).

Mais « facile à repérer » suppose que l'utilisateur s'arrête. WeLiveSecurity d'ESET a bien saisi la fragilité de la protection : [le seul indice évident qu'un utilisateur typique aurait pu remarquer était que lorsqu'il visitait le faux site MyEtherWallet, il aurait vu un message d'erreur lui indiquant que le site utilisait un certificat SSL non fiable](https://www.welivesecurity.com/2018/04/25/ethereum-cryptocurrency-wallets-raided/#:~:text=The%20only%20obvious%20clue%20that%20a%20typical%20user%20might%20have%20spotted). Le navigateur a levé la main et dit *il y a un problème*. Les utilisateurs qui ont perdu de l'argent sont ceux qui ont quand même cliqué pour continuer — et les victimes [devaient ignorer un message d'erreur HTTPS en cliquant dessus, car le faux MyEtherWallet.com utilisait un certificat TLS/SSL non fiable](https://www.theregister.com/2018/04/24/myetherwallet_dns_hijack/#:~:text=Victims%20had%20to%20click%20through%20a%20HTTPS%20error%20message).

## Réponse et conséquences

Le détournement n'est pas passé inaperçu pour les professionnels qui surveillent le routage. Les outils de surveillance réseau ont vu les préfixes factices et plus spécifiques apparaître puis se retirer au cours de cette même fenêtre de deux heures, et une fois l'annonce malveillante retirée, le routage normal vers Route 53 a repris.

MyEtherWallet a insisté sur le fait que sa propre infrastructure n'avait pas été violée. Comme l'entreprise l'a souligné au lendemain de l'incident, le problème venait de la plomberie d'Internet, pas de son application — il s'agissait d'un [détournement DNS](https://www.helpnetsecurity.com/2018/04/25/myetherwallet-dns-hijacking/#:~:text=DNS%20hijacking) du chemin de résolution, réalisé via BGP, plutôt que d'une compromission des serveurs ou du code de MEW.

La véritable correction a été apportée au niveau de la couche de routage. L'épisode est devenu l'un des arguments les plus cités en faveur de la **RPKI** (Resource Public Key Infrastructure) et des **ROA** (Route Origin Authorizations) — des enregistrements cryptographiques qui permettent aux réseaux de déclarer, de manière vérifiable, quels systèmes autonomes sont *autorisés* à annoncer quels préfixes IP. Avec des ROA valides en place, une annonce isolée du type « je prends les adresses d'Amazon » provenant d'un FAI de l'Ohio peut être signalée comme **RPKI-invalide** et rejetée au lieu d'être [propagée aveuglément](https://en.wikipedia.org/wiki/BGP_hijacking#:~:text=blindly%20propagated%20the%20announcements). Kentik en note directement la conséquence : si la même annonce était faite aujourd'hui contre un préfixe correctement signé, [elle aurait été évaluée comme RPKI-invalide](https://www.kentik.com/blog/bgp-hijacks-targeting-cryptocurrency-services/#:~:text=it%20would%20have%20been%20evaluated%20as%20RPKI-invalid). Dans les années qui ont suivi des attaques de ce type, les grands réseaux ont accéléré la publication des ROA pour cette catégorie précise de route.

Mais l'adoption de la RPKI est un effort mondial, sur plusieurs années, basé sur le volontariat (opt-in). La leçon pour tous les autres était plus simple et plus immédiate : la sécurité de votre domaine dépend de couches que vous ne possédez pas et que vous ne pouvez pas voir.

## Ce que cela nous apprend sur le fait que BGP et DNS soient basés sur la confiance par défaut

Cet incident mérite d'être mémorisé car il inverse le modèle mental habituel de la « sécurité des domaines ».

La plupart des gens pensent que la sécurité d'un domaine se résume à un mot de passe fort chez le bureau d'enregistrement, à une authentification à deux facteurs et au verrouillage du bureau d'enregistrement (registrar lock). Tout cela est réel et nécessaire — et **rien de tout cela n'aurait empêché le 24 avril 2018.** Les attaquants n'ont jamais touché au bureau d'enregistrement, n'ont jamais touché aux enregistrements DNS de MyEtherWallet, n'ont jamais touché à ses serveurs. Les enregistrements ont indiqué la bonne information tout au long de l'incident. Internet a simplement cessé de transmettre les requêtes à l'endroit qui les hébergeait.

Quelques leçons durables :

1. **Votre domaine repose sur une confiance empruntée.** La résolution dépend de BGP, et BGP, par [défaut... est conçu pour faire confiance à toutes les annonces de routes envoyées par ses pairs](https://en.wikipedia.org/wiki/BGP_hijacking#:~:text=by%20default%20the%20BGP%20protocol%20is%20designed%20to%20trust%20all%20route%20announcements%20sent%20by%20peers). Vous pouvez avoir une configuration DNS irréprochable et tout de même être détourné à une couche inférieure.

2. **L'empoisonnement DNS peut être réalisé sans jamais toucher au DNS.** Détournez la route vers le serveur DNS et vous contrôlez les réponses, même lorsque les enregistrements faisant autorité sont intacts.

3. **TLS est un véritable filet de sécurité — mais un filet fragile.** L'avertissement de certificat était la seule chose qui se dressait entre les utilisateurs et la perte totale. Il a fonctionné techniquement et a échoué au niveau comportemental. Une mesure de sécurité qu'un utilisateur peut contourner d'un simple clic n'est aussi solide que la patience de cet utilisateur.

4. **La finalité sur la chaîne (on-chain) supprime le filet de sécurité.** Pour une connexion bancaire, une session empoisonnée est grave. Pour un portefeuille crypto, c'est irréversible. La même attaque contre un autre type de site aurait été une belle frayeur ; ici, c'était une perte définitive.

5. **La défense en profondeur doit inclure la couche de routage.** La RPKI/ROA au niveau du réseau, ainsi que la surveillance des annonces d'origine inattendues de vos préfixes, sont désormais un prérequis indispensable pour tout actif de grande valeur.

## Le point de vue de Namefi

![Illustration colorée d'une propriété de domaine vérifiable et inviolable — une carte de domaine sécurisée par un bouclier vert, un jeton Namefi vert et la continuité DNS](../../assets/the-myetherwallet-bgp-dns-attack-03-namefi-angle.jpg)

L'attaque contre MyEtherWallet rappelle brutalement qu'un domaine n'est pas une chose unique que l'on « possède » — c'est une pile de relations de confiance dont chaque couche peut être subvertie : le registre, le bureau d'enregistrement, le fournisseur DNS et la structure de routage mondiale qui transmet les requêtes à ce fournisseur.

[Namefi](https://namefi.io) est conçu pour rendre la couche de *propriété* de cette pile vérifiable et inviolable. La tokenisation de la propriété des domaines signifie que le contrôle d'un domaine peut être prouvé cryptographiquement et transféré de manière auditable, au lieu de reposer uniquement sur un mot de passe de compte chez un seul fournisseur — tout en restant compatible avec le DNS. À elle seule, elle ne répare pas BGP ; rien au niveau de la couche de propriété ne réécrit la façon dont Internet achemine les paquets. Mais elle s'attaque à la même maladie sous-jacente que cet incident a exposée : **une trop grande part de la confiance vitale d'Internet est implicite, invérifiable et réversible par quiconque parvient à falsifier le bon message.**

L'avenir de la sécurité des domaines ressemble moins à un mot de passe fort et davantage à une preuve cryptographique à chaque niveau — une propriété vérifiable, un routage vérifiable (RPKI), une identité vérifiable (TLS). Les utilisateurs de MyEtherWallet ont perdu de l'argent dans l'espace situé entre ces couches. Combler cet espace, une couche vérifiable à la fois, c'est là tout notre projet.

Les enregistrements de domaine n'ont jamais été faux le 24 avril 2018. Internet a simplement cru un mensonge sur la manière de les atteindre. Rendre prouvable, plutôt que supposée, la question « qui possède quoi et comment y accéder » est le meilleur moyen de s'assurer que la prochaine fausse annonce sera rejetée plutôt qu'obéie.

## Sources et lectures complémentaires

- The Register — [Les voleurs de cryptomonnaie s'emparent d'environ 150 k$ après qu'un détournement BGP a redirigé le DNS de MyEtherWallet](https://www.theregister.com/2018/04/24/myetherwallet_dns_hijack/)
- BleepingComputer — [Un pirate détourne le serveur DNS de MyEtherWallet pour voler 160 000 $](https://www.bleepingcomputer.com/news/security/hacker-hijacks-dns-server-of-myetherwallet-to-steal-160-000/)
- Help Net Security — [Les utilisateurs de MyEtherWallet volés après une attaque de détournement DNS réussie](https://www.helpnetsecurity.com/2018/04/25/myetherwallet-dns-hijacking/)
- CyberScoop — [Le serveur du service DNS d'Amazon détourné pour un vol de 152 000 $ en Ether](https://cyberscoop.com/ether-dns-bgp-amazon-route-53-heist/)
- ESET WeLiveSecurity — [Des portefeuilles de cryptomonnaie Ethereum pillés après le détournement du service de domaine Internet d'Amazon](https://www.welivesecurity.com/2018/04/25/ethereum-cryptocurrency-wallets-raided/)
- Kentik — [Que peut-on apprendre des récents détournements BGP ciblant les services de cryptomonnaie ?](https://www.kentik.com/blog/bgp-hijacks-targeting-cryptocurrency-services/)
- Wikipedia — [Détournement BGP](https://en.wikipedia.org/wiki/BGP_hijacking)
- Bob Cromwell — [Détournement BGP](https://cromwell-intl.com/cybersecurity/bgp-hijacking.html)
- Neptune Mutual — [Comment le DNS de MEW (MyEtherWallet) a-t-il été usurpé ?](https://medium.com/neptune-mutual/how-was-mew-myetherwallet-dns-spoofed-cb813fab15f0)
- WCCFTech — [Des pirates ont détourné des serveurs DNS pour voler les utilisateurs de MyEtherWallet](https://wccftech.com/hackers-domain-service-to-empty-ethereum-wallets/)