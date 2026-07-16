---
title: "La violation pluriannuelle de GoDaddy : comment des intrus se sont installés chez le plus grand registraire mondial pendant trois ans"
date: '2026-06-17'
language: fr
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['fenwei-bian']
editors: ['victor-zhou']
draft: false
description: "Entre 2020 et 2022, un seul groupe de menaces a vécu à l'intérieur de l'infrastructure de GoDaddy — volant du code source, exposant 1,2 million de clients Managed WordPress, et redirigeant par intermittence des sites clients vers des destinations malveillantes. Une analyse approfondie du risque de concentration chez les registraires et des leçons sur les points uniques de défaillance."
keywords: ['violation godaddy', 'fuite de données godaddy', 'violation managed wordpress', 'sécurité registraire', 'sécurité domaine', 'violation pluriannuelle', 'malware cpanel', 'attaque de redirection de site', 'exposition clé privée ssl', 'violation mot de passe sftp', 'cybersécurité sec 10-k', 'risque de concentration registraire', 'point unique de défaillance']
relatedArticles:
  - /fr/blog/the-fox-it-dns-hijack/
  - /fr/blog/the-dnspionage-campaign/
  - /fr/blog/the-lenovo-com-dns-hijack/
  - /fr/blog/the-badgerdao-frontend-attack/
  - /fr/blog/the-icann-spear-phishing-breach/
relatedTopics:
  - /fr/topics/domain-security/
  - /fr/topics/domain-basics/
relatedSeries:
  - /fr/series/domain-apocalypse/
  - /fr/series/name-change-game-change/
relatedGlossary:
  - /fr/glossary/registrar/
  - /fr/glossary/dns/
  - /fr/glossary/icann/
  - /fr/glossary/web3/
  - /fr/glossary/tld/
---

Un [registraire](/fr/glossary/registrar/) de noms de domaine est l'entreprise la plus ennuyeuse dont vous dépendrez entièrement.

Vous le payez une fois par an. Vous vous connectez peut-être deux fois. Et en échange, il détient la seule chose qui rend votre activité joignable : le droit de dire « ce nom pointe ici. » E-mail, site web, connexion, paiements — chaque fil numérique que vous possédez passe par celui qui contrôle le DNS de votre domaine. La plupart des gens ne pensent plus jamais à cette entreprise après l'achat.

Pendant plus de deux ans, un groupe de menaces sophistiqué a pensé constamment à GoDaddy. Ils y vivaient à l'intérieur.

GoDaddy est le plus grand registraire de noms de domaine au monde, avec des dizaines de millions de clients et bien plus de 80 millions de domaines sous gestion. Et entre au moins fin 2019 et la fin de 2022, GoDaddy croit désormais que le même intrus persistant s'est déplacé à plusieurs reprises dans ses systèmes — volant du code source, exposant les données de 1,2 million de clients Managed WordPress, et à un moment donné recâblant discrètement des sites clients aléatoires pour rediriger les visiteurs vers des destinations malveillantes. L'entreprise ne l'a pas décrit comme une seule intrusion. Elle a décrit, dans un dépôt auprès de la Securities and Exchange Commission américaine, [une campagne pluriannuelle menée par un groupe de menaces sophistiqué](https://www.bleepingcomputer.com/news/security/godaddy-hackers-stole-source-code-installed-malware-in-multi-year-breach/#:~:text=Based%20on%20our%20investigation%2C%20we%20believe%20these%20incidents%20are%20part%20of%20a%20multi%2Dyear%20campaign%20by%20a%20sophisticated%20threat%20actor%20group).

Voilà à quoi cela ressemble quand l'entreprise ennuyeuse au bas de votre pile s'avère être un point unique de défaillance pour des millions d'autres personnes également.

## Pourquoi un seul registraire est un point unique de défaillance pour des millions de personnes

La concentration est tout le modèle économique d'un registraire grand public. L'économie ne fonctionne qu'à une échelle énorme : un seul système de provisionnement, un seul panneau de contrôle, un seul magasin d'identifiants, un seul ensemble de serveurs d'hébergement, au service de tous. Cette efficacité est exactement ce qui rend GoDaddy pratique — et exactement ce qui le rend dangereux quand un attaquant s'y infiltre.

Quand une seule petite entreprise se fait pirater, une entreprise passe une mauvaise semaine. Quand la plateforme qui détient les domaines, sites web et certificats de millions d'entreprises se fait pirater, le rayon d'explosion n'est plus d'une seule entreprise. C'est toute personne qui a confié son nom à cette entreprise.

C'est l'asymétrie au cœur du risque lié aux registraires. Le client vit GoDaddy comme son propre tableau de bord privé. L'attaquant le vit comme un coffre-fort contenant des millions de clés à la fois — et il suffit de crocheter la serrure une seule fois.

Il convient d'être précis sur ce que signifie « point unique de défaillance » ici, car il opère simultanément sur deux couches. La première est la couche du registraire : l'autorité qui décide où pointe le DNS de votre domaine. Si celle-ci est compromise, un attaquant peut rediriger votre domaine entier — e-mail inclus — ailleurs. La deuxième est la couche d'hébergement et de certificats : les serveurs, les identifiants et les clés SSL qui servent et authentifient votre site web réel. GoDaddy est l'une des rares entreprises à siéger simultanément sur ces deux couches pour le même client. Ainsi, quand le même intrus a touché ses systèmes de provisionnement, ses serveurs d'hébergement et ses certificats tout au long de la campagne, il ne pivotait pas entre des victimes sans rapport. Il se déplaçait à l'intérieur d'une seule entreprise qui détenait plusieurs types différents de clés pour les mêmes millions de portes.

![Art conceptuel coloré et vivant d'un immense coffre-fort central empilé du sol au plafond avec des millions de clés de domaine lumineuses, une silhouette d'intrus à l'ombre installée confortablement sur une chaise pliante comme s'il y vivait depuis des années, éclairage dramatique](../../assets/the-godaddy-multi-year-breach-01-breach.jpg)

## La chronologie : 2019 → 2022

Ce qui est troublant dans l'histoire de GoDaddy, ce n'est pas un seul incident. C'est que les incidents, examinés ensemble, s'alignent en une occupation de plusieurs années. GoDaddy n'a lui-même fait le lien qu'après coup.

**Fin 2019 / Mars 2020 — la première prise de pied.** Après une violation divulguée en 2020, GoDaddy [a alerté 28 000 clients qu'un attaquant avait utilisé leurs identifiants de compte d'hébergement web en octobre 2019](https://www.bleepingcomputer.com/news/security/godaddy-hackers-stole-source-code-installed-malware-in-multi-year-breach/#:~:text=GoDaddy%20alerted%2028%2C000%20customers%20that%20an%20attacker%20used%20their%20web%20hosting%20account%20credentials%20in%20October%202019) pour se connecter à leurs comptes d'hébergement via SSH. L'attaquant n'avait pas besoin d'un zero-day ; il avait besoin d'identifiants, et il les a obtenus. Des rapports de sécurité ont ensuite attribué cette vague à l'ingénierie sociale — des attaquants [se faisant passer par téléphone](https://krebsonsecurity.com/2023/02/when-low-tech-hacks-cause-high-impact-breaches/) pour inciter le personnel et les clients à céder des accès. Comme GoDaddy l'a résumé pour InformationWeek, [en mars 2020, un acteur malveillant a compromis les identifiants de connexion de 28 000 clients](https://www.informationweek.com/cyber-resilience/godaddy-hit-with-multiyear-breach-#:~:text=In%20March%202020%2C%20a%20threat%20actor%20compromised%20the%20login%20credentials%20of%2028%2C000%20customers).

**Septembre–Novembre 2021 — le grand coup.** Le 22 novembre 2021, GoDaddy a divulgué une violation de son environnement d'hébergement Managed WordPress. Les chiffres étaient brutaux : [l'incident a été découvert par GoDaddy](https://www.bleepingcomputer.com/news/security/godaddy-data-breach-hits-12-million-managed-wordpress-customers/#:~:text=The%20incident%20was%20discovered%20by%20GoDaddy%20last%20Wednesday%2C%20on%20November%2017%2C%20but%20the%20attackers%20had%20access%20to%20its%20network%20and%20the%20data%20contained%20on%20the%20breached%20systems%20since%20at%20least%20September%206%2C%202021) le 17 novembre 2021 — mais les attaquants avaient eu accès depuis au moins le 6 septembre 2021. C'est environ deux mois et demi de présence non détectée. Comme l'a rapporté TechCrunch, [la personne non autorisée a utilisé un mot de passe compromis pour accéder aux systèmes de GoDaddy vers le 6 septembre](https://techcrunch.com/2021/11/22/godaddy-breach-million-accounts/#:~:text=the%20unauthorized%20person%20used%20a%20compromised%20password%20to%20get%20access%20to%20GoDaddy%27s%20systems%20around%20September%206).

**Décembre 2022 — le malware et les redirections.** Un an plus tard, la tendance est réapparue. GoDaddy [a reçu des signalements de clients début décembre 2022 indiquant que leurs sites étaient utilisés pour rediriger vers des domaines aléatoires](https://www.bleepingcomputer.com/news/security/godaddy-hackers-stole-source-code-installed-malware-in-multi-year-breach/#:~:text=customer%20reports%20in%20early%20December%202022%20that%20their%20sites%20were%20being%20used%20to%20redirect%20to%20random%20domains). L'enquête qui a suivi est ce qui a produit la divulgation de février 2023 — et la réalisation qu'il ne s'agissait pas d'un nouvel attaquant, mais de la même campagne qui se répétait depuis 2020.

Lus dans l'ordre, ce ne sont pas trois violations. Ce sont trois observations d'un seul résident à long terme.

Ce qui rend la chronologie si frappante, ce sont les intervalles entre les observations. Des mois, puis un an. Chaque incident individuel, au moment de sa divulgation, semblait être un événement discret avec un début et une fin — une réinitialisation de mot de passe ici, une réémission de certificat là. Ce n'est que lorsque les enquêteurs de GoDaddy ont retracé le malware de décembre 2022 à travers ses outils et méthodes que les événements ont cessé de ressembler à des coïncidences et ont commencé à ressembler à un schéma. La phrase la plus glaçante de toute la divulgation est l'aveu tranquille que cela avait duré des années avant que quiconque ne fasse le lien.

## Ce qui a été exposé — et les sites web qui se sont retournés contre leurs propriétaires

La violation de Managed WordPress de 2021 est l'incident avec les dommages les plus clairs et les plus quantifiés. La propre notification de GoDaddy, déposée auprès de la SEC, l'a exposé clairement.

Jusqu'à 1,2 million de clients Managed WordPress actifs et inactifs ont vu leur adresse e-mail et leur numéro client exposés. Pire encore, [le mot de passe administrateur WordPress original défini au moment du provisionnement a été exposé](https://www.bleepingcomputer.com/news/security/godaddy-data-breach-hits-12-million-managed-wordpress-customers/#:~:text=The%20original%20WordPress%20Admin%20password%20that%20was%20set%20at%20the%20time%20of%20provisioning%20was%20exposed) — la clé maître de ces installations WordPress. Pour les clients actifs, les noms d'utilisateur et mots de passe sFTP et base de données ont été exposés, les identifiants permettant de télécharger des fichiers et de lire la base de données directement. Et pour le sous-ensemble le plus sensible, [la clé privée SSL a été exposée](https://www.bleepingcomputer.com/news/security/godaddy-data-breach-hits-12-million-managed-wordpress-customers/#:~:text=For%20a%20subset%20of%20active%20customers%2C%20the%20SSL%20private%20key%20was%20exposed) — le secret cryptographique qui prouve qu'un site est bien lui-même.

Cumulez tout cela et vous avez un kit pour le pire scénario possible. Le mot de passe administrateur vous donne accès au site. L'accès sFTP et base de données vous permet de le modifier au niveau des fichiers et des données. Et la clé privée SSL — comme l'a noté Wordfence dans son [analyse de la violation](https://www.wordfence.com/blog/2021/11/godaddy-breach-plaintext-passwords/) — pourrait permettre à un attaquant d'usurper l'identité d'un site ou de déchiffrer son trafic. Un registraire censé ancrer la confiance avait en réalité remis à un intrus les matériaux pour la falsifier.

| Ce qui a fui | Qui était concerné | Ce que cela déverrouille |
| --- | --- | --- |
| E-mail + numéro client | Jusqu'à 1,2 M de clients actifs et inactifs | Hameçonnage ciblé, cartographie des comptes |
| Mot de passe administrateur WordPress original | Clients concernés (si encore utilisé) | Contrôle total de l'installation WordPress |
| Identifiants sFTP + base de données | Clients actifs | Altération du site au niveau des fichiers et de la base de données |
| Clé privée SSL | Un sous-ensemble de clients actifs | Usurpation d'identité du site, déchiffrement du trafic |

La portée de l'exposition explique pourquoi cela était différent dans sa nature d'un piratage ordinaire de site. Un piratage ordinaire compromet un seul site. Ici, une seule brèche dans un système de provisionnement partagé a exposé les clés de plus d'un million d'entre eux en un seul mouvement.

Puis il y a la partie qui transforme une violation de données en quelque chose de viscéral : les sites web clients qui ont commencé à rediriger les visiteurs vers des sites malveillants. En décembre 2022, [un tiers non autorisé a accédé à nos serveurs d'hébergement cPanel et y a installé des malwares](https://www.sophos.com/en-us/blog/godaddy-admits-crooks-hit-us-with-malware-poisoned-customer-websites/#:~:text=an%20unauthorized%20third%20party%20gained%20access%20to%20and%20installed%20malware%20on%20our%20cPanel%20hosting%20servers), a déclaré GoDaddy, et [le malware a redirigé par intermittence des sites clients aléatoires vers des sites malveillants](https://www.sophos.com/en-us/blog/godaddy-admits-crooks-hit-us-with-malware-poisoned-customer-websites/#:~:text=The%20malware%20intermittently%20redirected%20random%20customer%20websites%20to%20malicious%20sites). « Par intermittence » et « aléatoires » sont les mots cruels ici. Une redirection qui se déclenche à chaque fois est facile à détecter. Une redirection qui se déclenche parfois, pour certains visiteurs, sur certains sites, est le genre de chose qu'un propriétaire de petite entreprise signale et ne peut ensuite pas reproduire — et que son hébergeur peut rejeter comme une anomalie passagère. C'est un camouflage intégré à l'attaque.

## Comment c'est arrivé : des clés empruntées, pas des serrures brisées

La leçon la plus inconfortable de l'histoire GoDaddy est à quel point l'entrée était peu glamour.

Il n'y a pas d'exotic zero-day au cœur de cela. La première vague s'est appuyée sur des identifiants volés. La violation de 2021 a reposé sur [un mot de passe compromis](https://www.bleepingcomputer.com/news/security/godaddy-hackers-stole-source-code-installed-malware-in-multi-year-breach/#:~:text=1.2%20million%20Managed%20WordPress%20customers%20after%20attackers%20breached%20GoDaddy%27s%20WordPress%20hosting%20environment%20using%20a%20compromised%20password). Krebs on Security a intitulé son analyse de la campagne [« When Low-Tech Hacks Cause High-Impact Breaches »](https://krebsonsecurity.com/2023/02/when-low-tech-hacks-cause-high-impact-breaches/) (Quand les piratages peu sophistiqués provoquent des violations à fort impact) — précisément parce que l'impact était si disproportionné par rapport à la sophistication de l'entrée. Vous n'avez pas besoin de forcer un coffre-fort si quelqu'un vous en donne la clé.

Une fois à l'intérieur, l'attaquant a fait la chose patiente et professionnelle : il est resté. Au cours de la campagne, GoDaddy a déclaré que les acteurs [ont installé des malwares sur nos systèmes et obtenu des extraits de code liés à certains services chez GoDaddy](https://www.bleepingcomputer.com/news/security/godaddy-hackers-stole-source-code-installed-malware-in-multi-year-breach/#:~:text=installed%20malware%20on%20our%20systems%20and%20obtained%20pieces%20of%20code%20related%20to%20some%20services%20within%20GoDaddy). Le code source volé n'est pas une perte unique ; c'est une carte. Elle indique à un attaquant comment fonctionnent réellement les systèmes dans lesquels il se trouve déjà — où se trouvent les points faibles, comment s'écoulent les authentifications, quelle est la prochaine cible. Combiné à un malware persistant, c'est la différence entre un smash-and-grab et une occupation à long terme. Comme BleepingComputer l'a résumé à partir de la propre conclusion de GoDaddy, [les acteurs malveillants ont pu installer des malwares sur les systèmes de l'entreprise et voler du code](https://www.informationweek.com/cyber-resilience/godaddy-hit-with-multiyear-breach-#:~:text=Threat%20actors%20were%20able%20to%20install%20malware%20on%20the%20company%27s%20systems%20and%20steal%20code) à plusieurs reprises sur des années.

L'écart de détection est l'autre moitié de l'histoire. Deux mois et demi dans l'incident de 2021. Des années sur l'ensemble de la campagne. L'attaquant n'était pas plus rapide que les défenses de GoDaddy — il était simplement plus discret que sa surveillance.

![Art conceptuel coloré et vivant d'une seule clé squelette lumineuse tournant pour ouvrir simultanément un mur entier de centaines de portes de boîtes aux lettres, de faibles tentacules de malware rampant le long du mur comme des lianes, éclairage néon dramatique, sans logos](../../assets/the-godaddy-multi-year-breach-02-persistent-access.jpg)

## Réponse et conséquences

La réponse technique immédiate de GoDaddy à la violation de 2021 a suivi le manuel standard : réinitialisation des mots de passe sFTP et de base de données exposés, et début de la réémission et de l'installation de nouveaux certificats SSL pour les clients dont les clés privées avaient fuité. Pour la divulgation de février 2023, l'entreprise a déclaré avoir fait appel à des experts judiciaires externes et aux forces de l'ordre, et a caractérisé l'acteur comme un groupe organisé et sophistiqué ciblant les fournisseurs d'hébergement — pas un opportuniste solitaire.

Mais les conséquences en termes de réputation et de réglementation ont duré bien au-delà de la réponse à l'incident. La série de violations a attiré l'attention de la Federal Trade Commission américaine, qui en 2025 [a finalisé un accord avec GoDaddy concernant des manquements à la sécurité des données](https://www.ftc.gov/news-events/news/press-releases/2025/05/ftc-finalizes-order-godaddy-over-data-security-failures), alléguant que l'entreprise avait omis de mettre en place des mesures de sécurité raisonnables malgré ses assurances marketing en matière de sécurité, et l'obligeant à mettre en place un programme complet de sécurité de l'information. Une violation qui avait commencé avec un mot de passe emprunté s'est terminée, des années plus tard, par une ordonnance de consentement fédérale.

La chronologie de divulgation elle-même a suscité des critiques : la présentation pluriannuelle n'est devenue publique que via un dépôt SEC 10-K en février 2023, ce qui signifie que les clients ont appris que les incidents de 2020, 2021 et 2022 étaient liés bien après que chacun eut été signalé individuellement.

Il y a un problème de responsabilité plus profond enfoui dans cette séquence. Chaque divulgation, prise isolément, invitait à une petite réponse — changer un mot de passe, accepter un nouveau certificat, passer à autre chose. Mais un client à qui l'on avait raconté trois histoires distinctes d' « incident isolé » n'avait aucun moyen de comprendre qu'il pourrait faire face à un seul adversaire persistant qui était resté près de ses données pendant des années. La manière dont une violation est présentée conditionne le sérieux avec lequel les personnes en aval la prennent. Trois petits incendies se lisent très différemment d'un seul qui couve longtemps.

## Ce que cela enseigne sur le risque de concentration chez les registraires

Mettez de côté les détails et la campagne GoDaddy est une leçon sur pourquoi la concentration des registraires constitue sa propre catégorie de risque.

1. **La plateforme est le prix.** Les attaquants n'ont pas à vous cibler. Ils ciblent l'entreprise qui vous détient ainsi qu'un million d'autres. Votre posture de sécurité importe à peine si le système de provisionnement de votre registraire est la cible vulnérable — vous héritez de son rayon d'explosion que vous le vouliez ou non.

2. **Les identifiants sont la porte d'entrée, pas les exploits.** Un mot de passe compromis a causé la majeure partie des dommages ici. L'authentification multifacteur, l'hygiène des identifiants et la détection agressive des anomalies comptent davantage que n'importe quelle défense sophistiquée — parce que le point d'entrée est presque toujours un accès emprunté, pas une serrure brisée.

3. **Le temps de présence est la vraie mesure.** L'exposition des données est mauvaise. Un attaquant vivant inaperçu dans votre système de provisionnement pendant des mois ou des années est catastrophiquement pire, car la persistance se cumule. Le dommage est fonction du temps qu'ils restent, pas seulement du fait qu'ils se sont introduits.

4. **Les secrets centralisés sont des défaillances centralisées.** Stocker des mots de passe administrateur, des identifiants sFTP et des clés privées SSL au même endroit, de manière récupérable, est pratique jusqu'à ce que cela devienne la perte unique dans le pire des cas. Quand le même dépôt contient les clés de 1,2 million de clients, une seule violation équivaut à 1,2 million de violations.

5. **La redirection du site web est le cauchemar du client, pas celui du registraire.** Quand les serveurs de GoDaddy ont redirigé les sites clients vers des destinations malveillantes, ce sont les marques, les clients et le référencement des clients qui ont payé — même s'ils n'avaient rien fait de mal. Le risque de concentration est en grande partie le risque d'être lésé par l'erreur de quelqu'un d'autre.

Rien de tout cela ne signifie « ne jamais utiliser un grand registraire. » L'échelle apporte de réels investissements en sécurité, et les petits fournisseurs échouent aussi. Cela signifie comprendre que lorsque vous confiez votre domaine à une plateforme, vous acceptez le pire jour de cette plateforme comme une version possible du vôtre.

## L'angle Namefi

![Illustration colorée de la propriété de domaine vérifiable et inviolable — une carte de domaine sécurisée par un bouclier vert, un jeton Namefi vert, et la continuité DNS](../../assets/the-godaddy-multi-year-breach-03-namefi-angle.jpg)

Le problème le plus profond que la campagne GoDaddy expose n'est pas le malware. C'est que la propriété et le contrôle d'un domaine vivaient entièrement dans la base de données privée d'un seul fournisseur — une base de données que, pendant des années, un intrus pouvait lire, modifier et usurper de l'intérieur, tandis que les propriétaires légitimes n'avaient aucun moyen indépendant de le savoir.

[Namefi](https://namefi.io) est construit autour d'une autre valeur par défaut : les domaines devraient se comporter comme des actifs natifs d'internet dont la propriété est vérifiable et inviolable, et non comme une ligne dans le système de comptes d'une seule entreprise que vous ne pouvez confirmer qu'en vous connectant et en espérant. La propriété tokenisée rend la question « qui contrôle réellement ce domaine ? » répondable depuis l'extérieur de n'importe quel fournisseur — auditable, portable et plus difficile à réécrire silencieusement — tout en restant compatible avec le DNS afin que le nom continue de se résoudre.

Cela ne rend pas un registraire impossible à pirater. Rien ne le fait. Mais cela change ce qu'une violation peut faire discrètement. Quand la preuve de propriété vit dans une couche vérifiable et indépendante plutôt que uniquement à l'intérieur de la plateforme qui a été compromise, « l'intrus a vécu dans la base de données pendant deux ans » cesse d'être la même chose que « l'intrus contrôlait qui possède quoi. » L'histoire de GoDaddy, c'est ce qui se passe quand le contrôle et la preuve sont la même chose fragile, conservée au même endroit. La leçon est d'arrêter de les garder là.

## Sources et lectures complémentaires

- BleepingComputer — [GoDaddy: Hackers stole source code, installed malware in multi-year breach](https://www.bleepingcomputer.com/news/security/godaddy-hackers-stole-source-code-installed-malware-in-multi-year-breach/)
- BleepingComputer — [GoDaddy data breach hits 1.2 million Managed WordPress customers](https://www.bleepingcomputer.com/news/security/godaddy-data-breach-hits-12-million-managed-wordpress-customers/)
- Krebs on Security — [When Low-Tech Hacks Cause High-Impact Breaches](https://krebsonsecurity.com/2023/02/when-low-tech-hacks-cause-high-impact-breaches/)
- Sophos — [GoDaddy admits: Crooks hit us with malware, poisoned customer websites](https://www.sophos.com/en-us/blog/godaddy-admits-crooks-hit-us-with-malware-poisoned-customer-websites)
- The Hacker News — [GoDaddy Discloses Multi-Year Security Breach Causing Malware Installations and Source Code Theft](https://thehackernews.com/2023/02/godaddy-discloses-multi-year-security.html)
- TechCrunch — [GoDaddy says data breach exposed over a million user accounts](https://techcrunch.com/2021/11/22/godaddy-breach-million-accounts/)
- SecurityWeek — [GoDaddy Breach Exposes 1.2 Million Managed WordPress Customer Accounts](https://www.securityweek.com/godaddy-breach-exposes-12-million-managed-wordpress-customer-accounts/)
- InformationWeek — [GoDaddy Hit with Multiyear Breach](https://www.informationweek.com/cyber-resilience/godaddy-hit-with-multiyear-breach-)
- BankInfoSecurity — [GoDaddy Confirms Breach Affects 1.2 Million Customers](https://www.bankinfosecurity.com/godaddy-confirms-breach-affects-12-million-customers-a-17974)
- Wordfence — [GoDaddy Breach — Plaintext Passwords — 1.2M Affected](https://www.wordfence.com/blog/2021/11/godaddy-breach-plaintext-passwords/)
- U.S. Federal Trade Commission — [FTC Finalizes Order with GoDaddy over Data Security Failures](https://www.ftc.gov/news-events/news/press-releases/2025/05/ftc-finalizes-order-godaddy-over-data-security-failures)
- GoDaddy (via SEC) — [Notice of Security Incident, November 22, 2021](https://www.sec.gov/Archives/edgar/data/1609711/000160971121000122/gddyblogpostnov222021.htm)
