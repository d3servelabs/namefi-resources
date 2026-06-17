---
title: 'Le détournement DNS de Malaysia Airlines : "404 — Plane Not Found"'
date: '2026-06-17'
language: fr
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: "En janvier 2015, Lizard Squad a détourné le DNS de malaysiaairlines.com et a remplacé le site de la compagnie aérienne par un lézard en smoking et la provocation \"404 — Plane Not Found\". Aucun serveur n'a été piraté : les attaquants ont simplement modifié la destination du domaine. Une plongée au cœur de Domain Mayday pour comprendre comment le DNS est devenu la porte d'entrée la plus vulnérable de la compagnie."
keywords: ['détournement dns malaysia airlines', 'lizard squad', 'cyber califat', '404 plane not found', 'détournement de dns', 'détournement de domaine', "compromission de bureau d'enregistrement", 'webnic', 'malaysiaairlines.com', 'sécurité des domaines', 'redirection dns', 'verrouillage de registre', 'mh370']
---

L'avion n'a jamais été retrouvé. En janvier 2015, le site web non plus.

Le matin du 26 janvier 2015, quiconque tapait **malaysiaairlines.com** dans son navigateur n'accédait pas à la compagnie aérienne. Ils tombaient sur un pirate informatique. La page de réservation habituelle avait disparu, remplacée par l'image d'un lézard portant un chapeau haut-de-forme et un monocle, ainsi qu'un seul titre, cruel : **« 404 — Plane Not Found »** (*404 — Avion introuvable*). En dessous : *« Hacked by Lizard Squad — Official Cyber Caliphate »*. La barre de titre du navigateur affichait simplement : *« ISIS will prevail »* (*L'EI vaincra*).

C'était une plaisanterie morbide sur un cimetière. Moins d'un an auparavant, le vol 370 de Malaysia Airlines avait disparu des radars avec 239 personnes à bord. Quatre mois plus tard, le vol 17 était abattu en plein vol au-dessus de l'Ukraine. Désormais, un groupe d'adolescents transformait le deuil de la compagnie en une mauvaise blague affichée sur sa propre porte d'entrée — sans jamais toucher à ses serveurs.

C'est ce dernier point qui fait toute l'histoire. Malaysia Airlines n'a pas été « piratée » au sens où la plupart des gens l'entendent. Ses systèmes de réservation étaient intacts. Les données de ses passagers n'ont pas été touchées. Ce dont les attaquants se sont emparés était beaucoup plus fondamental et, en fin de compte, bien plus facile à prendre : le **nom de domaine lui-même** — l'adresse qui indique à l'ensemble d'Internet où se trouve « Malaysia Airlines ».

Ceci est une analyse *Domain Mayday* consacrée à cette partie de votre infrastructure à laquelle vous ne pensez probablement jamais, jusqu'à ce qu'elle pointe ailleurs.

## Une compagnie aérienne se résume à son domaine

Pour un transporteur mondial, le site web n'est pas une simple brochure. C'est la caisse enregistreuse, le comptoir d'enregistrement et le centre d'appels, le tout relié à une seule chaîne de caractères : `malaysiaairlines.com`.

Chaque réservation, chaque connexion au compte de fidélité, chaque lien « Gérer mon vol » dans chaque e-mail de confirmation se résout via ce domaine. Lorsqu'un passager à Kuala Lumpur ou à Londres le tape, une chaîne invisible se déclenche : le navigateur demande au système de noms de domaine (DNS) « où se trouve malaysiaairlines.com ? », le DNS répond par une adresse IP, et le navigateur s'y connecte. La marque de la compagnie, ses revenus et la confiance de ses clients reposent entièrement sur cette unique requête renvoyant la *bonne* réponse.

Le DNS est le carnet d'adresses d'Internet. C'est aussi, pour la plupart des organisations, la porte la moins surveillée du bâtiment. Vous pouvez dépenser des millions pour sécuriser vos serveurs, chiffrer vos bases de données et former votre personnel contre le hameçonnage — rien de tout cela n'a d'importance si quelqu'un peut discrètement modifier la ligne du carnet d'adresses qui indique vers quoi pointe votre nom. Redirigez l'adresse, et vous avez redirigé l'entreprise, sans même avoir à forcer l'entrée du bâtiment.

C'est exactement ce qui s'est passé.

## Le détournement : un lézard à la place d'une compagnie aérienne

![Art conceptuel vif et coloré d'un panneau DNS lumineux sur une piste, basculé par une main invisible, détournant un flux de voyageurs d'une porte d'embarquement vers un mur sans issue estampillé d'un gigantesque 404, couleurs néon sarcelle et magenta](../../assets/the-malaysia-airlines-dns-hijack-01-hijack.jpg)

La défiguration du site a été conçue pour être d'une cruauté maximale. L'image d'un lézard en tenue de soirée était la signature de Lizard Squad ; le groupe avait passé le mois de décembre précédent à déconnecter [le Xbox Live et le Sony PlayStation Network](https://techcrunch.com/2015/01/25/malaysia-airlines-site-hacked-by-lizard-squad/#:~:text=Hacker%20group%20Lizard%20Squad%2C%20which%20took%20down%20Xbox%20Live%20and%20the%20Sony%20PlayStation%20Network%20last%20month) pendant les fêtes. En janvier, il s'était approprié l'imagerie d'un « Cyber Califat », se posant comme affilié à l'État islamique, même si les chercheurs accueillaient cette revendication avec un profond scepticisme.

Le site, tel que les visiteurs le découvraient, [affichait la photo d'un lézard portant un chapeau haut-de-forme et un monocle, ainsi que le texte « 404-Plane Not Found »](https://techcrunch.com/2015/01/25/malaysia-airlines-site-hacked-by-lizard-squad/#:~:text=The%20site%20currently%20displays%20a%20picture%20of%20a%20lizard%20in%20a%20top%20hat%20and%20monocle%2C%20as%20well%20as%20the%20text%20%27404%2DPlane%20Not%20Found%27). Le récit que fait Wikipédia du groupe rapporte la même scène : les utilisateurs étaient [redirigés vers une autre page affichant l'image d'un lézard en smoking](https://en.wikipedia.org/wiki/Lizard_Squad#:~:text=Users%20were%20redirected%20to%20another%20page%20bearing%20an%20image%20of%20a%20tuxedo%2Dwearing%20lizard), et la page [portait le titre « 404 - Plane Not Found », une référence évidente à la perte du vol MH370 de la compagnie l'année précédente](https://en.wikipedia.org/wiki/Lizard_Squad#:~:text=The%20page%20also%20carried%20the%20headline%20%22404%20%2D%20Plane%20Not%20Found%22%2C%20an%20apparent%20reference%20to%20the%20airline%27s%20loss%20of%20flight%20MH370%20the%20previous%20year).

La cruauté était le but recherché. Le MH370 avait [disparu des radars le 8 mars 2014](https://en.wikipedia.org/wiki/Malaysia_Airlines_Flight_370#:~:text=disappeared%20from%20radar%20on%208%20March%202014), les 239 personnes à son bord étant finalement présumées mortes, sans que l'épave n'ait jamais été localisée de manière concluante. Le MH17 avait été [abattu par des forces soutenues par la Russie avec un missile sol-air Buk 9M38 le 17 juillet 2014](https://en.wikipedia.org/wiki/Malaysia_Airlines_Flight_17#:~:text=shot%20down%20by%20Russian%2Dbacked%20forces%20with%20a%20Buk%209M38%20surface%2Dto%2Dair%20missile%20on%2017%20July%202014), tuant les 298 personnes à son bord. Afficher « Plane Not Found » sur la page d'accueil de la compagnie aérienne revenait à instrumentaliser la pire année de l'histoire de l'entreprise — et à diffuser ce message à chaque client tentant d'accéder au site.

Puis vint la menace. Le groupe a [tweeté qu'il allait « bientôt divulguer du butin trouvé sur les serveurs de www.malaysiaairlines.com »](https://www.theregister.com/2015/01/26/lizard_squad_threaten_data_dump_after_attack_on_malaysia_airlines_site/#:~:text=Going%20to%20dump%20some%20loot%20found%20on%20www.malaysiaairlines.com%20servers%20soon), et a même publié une capture d'écran censée montrer des itinéraires de passagers. Pour une compagnie aérienne déjà noyée dans une année catastrophique, l'idée que des données clients soient compromises constituait en soi un nouveau désastre.

## Comment c'est arrivé : le carnet d'adresses, pas le bâtiment

![Art conceptuel vif et coloré d'un opérateur de standard téléphonique futuriste débranchant un câble lumineux de la bonne prise pour le brancher sur une fausse, des flux de circulation lumineuse déviant d'une piste vers un terminal imposteur, bleus électriques et orange chaud](../../assets/the-malaysia-airlines-dns-hijack-02-dns-redirect.jpg)

Voici le cœur technique du problème, et la raison pour laquelle cette affaire a sa place dans une série sur la sécurité des domaines plutôt que dans celle des violations de serveurs.

La propre déclaration de Malaysia Airlines, reprise dans toute la couverture médiatique, a établi la distinction avec précision : [Malaysia Airlines confirme que son système de noms de domaine (DNS) a été compromis, redirigeant les utilisateurs vers le site web d'un hacker lorsque l'URL www.malaysiaairlines.com est saisie](https://techcrunch.com/2015/01/25/malaysia-airlines-site-hacked-by-lizard-squad/#:~:text=Malaysia%20Airlines%20confirms%20that%20its%20Domain%20Name%20System%20%28DNS%29%20has%20been%20compromised%20where%20users%20are%20re%2Ddirected%20to%20a%20hacker%20website). La compagnie a insisté sur le fait que son [site web n'a pas été piraté et que ce dysfonctionnement temporaire n'affecte pas les réservations et que les données des utilisateurs restent sécurisées](https://techcrunch.com/2015/01/25/malaysia-airlines-site-hacked-by-lizard-squad/#:~:text=Malaysia%20Airlines%20assures%20customers%20and%20clients%20that%20its%20website%20was%20not%20hacked%20and%20this%20temporary%20glitch%20does%20not%20affect%20their%20bookings%20and%20that%20user%20data%20remains%20secured), ajoutant que ses [serveurs web sont intacts](https://www.bankinfosecurity.com/malaysia-airlines-website-hacked-a-7833#:~:text=Malaysia%20Airlines%27%20Web%20servers%20are%20intact).

Les deux choses étaient vraies en même temps : le site était détruit, *et* les serveurs allaient bien. Les attaquants n'ont jamais eu besoin des serveurs. Comme l'a expliqué The Register, [les enregistrements DNS du site ont été altérés de sorte que les internautes sont redirigés vers un site contrôlé par des hackers](https://www.theregister.com/2015/01/26/lizard_squad_threaten_data_dump_after_attack_on_malaysia_airlines_site/#:~:text=DNS%20records%20for%20the%20site%20have%20been%20interfered%20with%20so%20that%20surfers%20are%20being%20redirected%20to%20a%20hacker%2Dcontrolled%20site). Ils ont modifié l'entrée du carnet d'adresses, pas le bâtiment vers lequel elle pointait. Même la malveillance s'est inscrite dans les métadonnées : une recherche Whois à l'époque montrait que [ISIS will prevail](https://www.computerworld.com/article/1621206/malaysia-airlines-claim-dns-hijacked-site-not-hacked-but-attackers-threaten-data-dump.html#:~:text=ISIS%20will%20prevail) figurait comme titre du site.

Où était conservé ce carnet d'adresses ? Chez le bureau d'enregistrement (registrar). Le domaine de la compagnie aérienne [semble être enregistré auprès de Web Commerce Communications Limited — alias Webnic — qui possède des bureaux à Singapour, en Malaisie et en Chine](https://www.bankinfosecurity.com/malaysia-airlines-website-hacked-a-7833#:~:text=registered%20with%20Web%20Commerce%20Communications%20Limited%20%2D%20a.k.a.%20Webnic%20%2D%20which%20has%20offices%20in%20Singapore%2C%20Malaysia%20and%20China). Ce nom a son importance, car Webnic était sur le point de devenir tristement célèbre.

Un mois plus tard, ce même bureau d'enregistrement s'est retrouvé au centre d'un incident bien plus vaste. Comme l'a rapporté Brian Krebs, des attaquants ont [pris le contrôle de Webnic.cc, le bureau d'enregistrement malaisien qui gère à la fois ces domaines et 600 000 autres](https://krebsonsecurity.com/2015/02/webnic-registrar-blamed-for-hijack-of-lenovo-google-domains/#:~:text=seized%20control%20over%20Webnic.cc%2C%20the%20Malaysian%20registrar%20that%20serves%20both%20domains%20and%20600%2C000%20others), puis ont [exploité leur accès chez Webnic.cc pour altérer les enregistrements du système de noms de domaine (DNS)](https://krebsonsecurity.com/2015/02/webnic-registrar-blamed-for-hijack-of-lenovo-google-domains/#:~:text=leverage%20their%20access%20at%20Webnic.cc%20to%20alter%20the%20domain%20name%20system%20%28DNS%29%20records) de **Lenovo** et de **Google Vietnam**. Le mécanisme, selon Krebs, consistait en une [vulnérabilité d'injection de commandes dans Webnic.cc pour télécharger un rootkit](https://krebsonsecurity.com/2015/02/webnic-registrar-blamed-for-hijack-of-lenovo-google-domains/#:~:text=command%20injection%20vulnerability%20in%20Webnic.cc%20to%20upload%20a%20rootkit) — offrant un accès persistant au système même qui contrôle la destination de centaines de milliers de domaines.

Vous n'avez pas besoin de pirater Google pour rediriger google.com.vn. Vous n'avez pas besoin de pirater une compagnie aérienne pour rediriger sa page d'accueil. Il vous suffit de compromettre la couche qui *détient la réponse* à la question « où se trouve ce domaine ? » — le compte du bureau d'enregistrement et les enregistrements DNS qui se trouvent derrière. Cette couche se situe en dehors du périmètre que la plupart des entreprises défendent réellement.

## Impact et réaction

Pour la compagnie aérienne, les dommages ont été d'ordre réputationnel et opérationnel, plutôt que liés à un vol de données. Les clients qui tentaient de réserver ou de s'enregistrer tombaient sur une page défigurée. Dans le monde entier, les gros titres associaient les mots « Malaysia Airlines » à « piraté » — une marque déjà en crise désormais associée à un lézard se moquant d'elle au sujet de son avion disparu.

La compagnie a agi pour contenir l'attaque de la seule manière possible pour un détournement DNS : en intervenant sur la couche qui avait été corrompue. Elle a déclaré avoir [résolu le problème avec son fournisseur de services](https://www.infosecurity-magazine.com/news/malaysia-air-site-back-hackers/#:~:text=resolved%20the%20issue%20with%20its%20service%20provider) et que le [système devrait être entièrement rétabli dans les 22 heures](https://www.infosecurity-magazine.com/news/malaysia-air-site-back-hackers/#:~:text=The%20system%20is%20expected%20to%20be%20fully%20recovered%20within%2022%20hours). Ce délai est en soi révélateur du fonctionnement du DNS : même après avoir corrigé les enregistrements, la mauvaise réponse peut persister dans les caches à travers le monde jusqu'à son expiration. Un détournement est rapide à exécuter et lent à être totalement annulé.

Concernant la menace de fuite de données, la compagnie a maintenu sa position — réservations non affectées, données utilisateurs sécurisées — et la fuite catastrophique dont le groupe se vantait ne s'est jamais concrétisée sous la forme décrite. Cependant, « nous n'avons pas vraiment été piratés, les attaquants ont seulement contrôlé l'intégralité de notre identité publique pendant la majeure partie de la journée » est un message difficile à faire passer auprès du public voyageur. Pour un client confronté à un « 404 — Plane Not Found », la distinction entre une violation de serveur et un détournement DNS est invisible. Le site *était* la compagnie aérienne. Et pendant une journée, ce site appartenait à quelqu'un d'autre.

## Ce que cela nous apprend sur le DNS en tant que porte d'entrée

Le détournement de Malaysia Airlines est un cas d'école précisément parce que *rien n'a été piraté* au sens classique du terme. Les leçons à en tirer s'appliquent à presque toutes les organisations en ligne :

1. **Votre domaine est un point de défaillance unique que vous ne contrôlez pas seul.** Le bureau d'enregistrement détient le registre maître indiquant vers quoi pointe votre nom. Si la sécurité de leur compte — ou leur logiciel — fait défaut, vos serveurs parfaitement sécurisés deviennent inutiles. Webnic l'a prouvé deux fois en un mois, avec une compagnie aérienne, puis avec Google et Lenovo.

2. **Un détournement DNS ne nécessite aucune intrusion chez vous.** Les attaquants ont redirigé le carnet d'adresses, pas le bâtiment. Les défenses qui surveillent vos serveurs, votre code et votre réseau peuvent passer à côté d'une attaque qui se produit entièrement au niveau de la couche de nommage.

3. **Verrouillez les enregistrements qui peuvent déplacer votre nom.** Le verrouillage de registre (Registry Lock) et les verrous au niveau du bureau d'enregistrement existent spécifiquement pour empêcher les modifications non autorisées de vos enregistrements DNS et serveurs de noms — ils ajoutent une étape manuelle, hors bande, avant que quiconque puisse rediriger votre domaine. Pour un domaine de grande valeur, ces verrous ne sont pas optionnels.

4. **Optez pour DNSSEC et l'A2F chez le bureau d'enregistrement.** Une authentification forte (2FA) sur le compte du bureau d'enregistrement et la signature DNSSEC sur la zone augmentent considérablement la difficulté de réaliser exactement le type de remplacement silencieux d'enregistrement qui a défiguré Malaysia Airlines.

5. **La récupération est plus lente que l'attaque.** Les TTL (Time To Live) et les caches globaux font qu'un détournement survit à sa correction. Planifiez la fenêtre de nettoyage, pas seulement l'application du correctif.

Le résumé inconfortable : la plupart des entreprises gardent le bâtiment et laissent un post-it sur la porte d'entrée indiquant à tout le monde dans quel bâtiment entrer. Changez le post-it, et vous avez déplacé l'entreprise.

## L'approche Namefi

![Illustration colorée d'une propriété de domaine vérifiable et infalsifiable — une carte de domaine sécurisée par un bouclier vert, un jeton Namefi vert et la continuité DNS](../../assets/the-malaysia-airlines-dns-hijack-03-namefi-angle.jpg)

Le détournement de Malaysia Airlines soulève, fondamentalement, la question de savoir *qui est autorisé à modifier la destination d'un nom* — et à quel point cette autorité peut être discrètement volée au niveau de la couche du bureau d'enregistrement. L'attaque n'a pas déjoué la cryptographie ou piraté une base de données. Elle a vaincu le plan de contrôle fragile basé sur des comptes qui décide du fait le plus important concernant un domaine : l'endroit où il se résout.

[Namefi](https://namefi.io) repose sur l'idée que la propriété et le contrôle d'un domaine devraient se comporter comme un actif vérifiable et natif d'Internet, plutôt que comme une simple ligne dans la base de données d'un bureau d'enregistrement qu'un compte compromis peut réécrire. La propriété sous forme de jeton rend la question « qui contrôle ce domaine, et ce contrôle vient-il de changer de mains ? » auditable et infalsifiable, tout en restant compatible avec le DNS. La défense contre un détournement ne consiste pas seulement à utiliser des mots de passe plus forts — elle consiste à rendre les modifications non autorisées *visibles et prouvables* au lieu d'être silencieuses.

Malaysia Airlines n'a jamais perdu ses serveurs. Elle a perdu la réponse à une seule question — *vers quoi pointe ce nom ?* — pendant environ une journée. L'avion n'a jamais été retrouvé. Le site web n'aurait jamais dû être perdu non plus. La leçon de *Domain Mayday* est que le carnet d'adresses fait partie de votre périmètre de sécurité, et le jour où vous l'oubliez est le jour où un lézard en chapeau haut-de-forme s'installe sur le pas de votre porte.

## Sources et lectures complémentaires

- TechCrunch — [Malaysia Airlines Site Hacked By Lizard Squad](https://techcrunch.com/2015/01/25/malaysia-airlines-site-hacked-by-lizard-squad/)
- The Register — [Lizard Squad threatens Malaysia Airlines with data dump](https://www.theregister.com/2015/01/26/lizard_squad_threaten_data_dump_after_attack_on_malaysia_airlines_site/)
- BankInfoSecurity — [Malaysia Airlines Website Hacked](https://www.bankinfosecurity.com/malaysia-airlines-website-hacked-a-7833)
- Computerworld — [Malaysia Airlines claim DNS hijacked, site not hacked, but attackers threaten data dump](https://www.computerworld.com/article/1621206/malaysia-airlines-claim-dns-hijacked-site-not-hacked-but-attackers-threaten-data-dump.html)
- Infosecurity Magazine — [Malaysia Airlines Site Back Up as Hackers Threaten Data Dump](https://www.infosecurity-magazine.com/news/malaysia-air-site-back-hackers/)
- Krebs on Security — [Webnic Registrar Blamed for Hijack of Lenovo, Google Domains](https://krebsonsecurity.com/2015/02/webnic-registrar-blamed-for-hijack-of-lenovo-google-domains/)
- Help Net Security — [Lenovo.com hijacking made possible by compromise of Webnic registrar](https://www.helpnetsecurity.com/2015/02/26/lenovocom-hijacking-made-possible-by-compromise-of-webnic-registrar/)
- ABC News — [Malaysia Airlines Hit by Lizard Squad Hack Attack](https://abcnews.go.com/Technology/malaysia-airlines-hit-lizard-squad-hack-attack/story?id=28489244)
- NBC News — [Lizard Squad Claims It Hacked Malaysia Airlines Website](https://www.nbcnews.com/storyline/isis-terror/lizard-squad-claims-it-hacked-malaysia-airlines-website-n293461)
- IT Security Guru — [Lizard Squad hijacks Malaysia Airline DNS](https://www.itsecurityguru.org/2015/01/26/lizard-squad-hijacks-malaysia-airline-dns/)
- Wikipédia — [Lizard Squad](https://en.wikipedia.org/wiki/Lizard_Squad)
- Wikipédia — [Vol 370 de Malaysia Airlines](https://en.wikipedia.org/wiki/Malaysia_Airlines_Flight_370)
- Wikipédia — [Vol 17 de Malaysia Airlines](https://en.wikipedia.org/wiki/Malaysia_Airlines_Flight_17)