---
title: "Domain Mayday EP14 : Quand une entreprise de sécurité s'est fait détourner son DNS — L'incident Fox-IT"
date: '2026-06-17'
language: fr
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['fenwei-bian']
editors: ['victor-zhou']
draft: false
description: "En septembre 2017, des attaquants se sont connectés au bureau d'enregistrement tiers de la société de sécurité néerlandaise Fox-IT, ont modifié ses DNS, obtenu frauduleusement un certificat TLS et ont effectué une attaque man-in-the-middle pendant 10 heures sur le trafic client — jusqu'à ce que Fox-IT le détecte et publie l'un des post-mortems les plus transparents du secteur."
keywords: ['détournement dns fox-it', 'man in the middle fox-it', 'incident fox-it 2017', 'détournement dns', 'compromission compte registrar', 'certificat ssl frauduleux', 'attaque man-in-the-middle', 'sécurité registrar de domaine', 'authentification deux facteurs dns', 'dnssec', 'verrouillage registre', 'sécurité des domaines', 'ncc group fox-it']
relatedArticles:
  - /fr/blog/the-dnspionage-campaign/
  - /fr/blog/the-godaddy-multi-year-breach/
  - /fr/blog/the-lenovo-com-dns-hijack/
  - /fr/blog/the-badgerdao-frontend-attack/
  - /fr/blog/the-myetherwallet-bgp-dns-attack/
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
  - /fr/glossary/tld/
  - /fr/glossary/registry/
---

Le propre d'une attaque man-in-the-middle, c'est que pendant qu'elle se déroule, tout semble normal.

Le site se charge. La barre d'adresse affiche le bon domaine. Le cadenas est fermé. Le certificat est valide. Les fichiers s'envoient, les connexions réussissent, les e-mails arrivent. Aucune erreur, aucun avertissement, aucune image cassée — juste un tiers silencieux, assis au milieu de la conversation, qui lit tout ce qui passe entre ses mains avant de le retransmettre, si bien qu'aucune des deux parties ne perçoit le moindre délai.

Imaginez maintenant que cela arrive précisément aux personnes dont le métier est de détecter exactement ce genre de chose.

En septembre 2017, la société de cybersécurité néerlandaise Fox-IT — une entreprise qui enquête sur les violations de données, fabrique des capteurs de détection d'interception et conseille les gouvernements sur les techniques d'attaque des hackers — a découvert qu'un attaquant avait détourné le DNS de son propre domaine, obtenu un certificat TLS en son nom et passé une bonne partie de la journée à lire le trafic entrant et sortant de son portail client. La serrure du serrurier avait été crochetée. Et Fox-IT a alors fait ce que presque aucune entreprise victime d'une violation ne fait : elle [a publié un compte rendu détaillé de la manière exacte dont cela s'était produit](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=we%20limited%20the%20total%20effective%20MitM%20time%20to%2010%20hours%20and%2024%20minutes).

## Même une entreprise de sécurité dépend de son registrar

Voici la vérité inconfortable que ce cas rend concrète : peu importe la qualité de votre sécurité interne, une grande partie de votre surface d'attaque réside dans une entreprise que vous ne gérez pas.

Votre domaine — le nom que vos clients saisissent, l'adresse contre laquelle vos certificats sont émis, la destination vers laquelle pointe votre e-mail — est configuré chez un bureau d'enregistrement de domaines. Quiconque contrôle ce compte registrar contrôle la résolution de votre nom. Il peut réorienter votre site web, rediriger votre courrier et prouver la « propriété » de votre domaine auprès d'une autorité de certification. Rien de tout cela ne nécessite de toucher à vos serveurs, vos pare-feux ou votre code. Il suffit de se connecter à un tableau de bord web.

Fox-IT était, en tout état de cause, une organisation de sécurité sérieuse. Elle effectuait une capture complète des paquets et exploitait ses propres capteurs réseau. Elle utilisait l'authentification à deux facteurs sur son portail client. Elle a par la suite été rachetée par NCC Group. Et elle était pourtant exposée via le seul compte auquel elle ne se connectait presque jamais — car, comme l'entreprise l'a elle-même formulé, [les paramètres DNS changent très rarement en général](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=DNS%20settings%20in%20general%20change%20very%20rarely), si bien que les identifiants qui les protégeaient s'étaient silencieusement périmés.

Comme Fox-IT l'a formulé dans l'introduction de son propre rapport : [si une telle attaque peut toucher une entreprise de sécurité, elle pourrait très probablement toucher de nombreux autres types d'entreprises](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=if%20such%20an%20attack%20can%20hit%20a%20security%20firm) moins axées sur la sécurité.

## 19 septembre 2017 : le détournement et l'attaque MITM

![Art conceptuel vivid et coloré d'une figure d'espion silencieuse lisant deux flux de courrier circulant entre deux tours distantes, les flux passant invisiblement entre ses mains tandis que les deux tours brillent comme si rien ne se passe](../../assets/the-fox-it-dns-hijack-01-hijack.jpg)

Le récit de Fox-IT s'ouvre sur une formule qui est depuis lors devenue un petit classique de l'écriture en réponse aux incidents : [Pour Fox-IT, le « si » est devenu « quand » le mardi 19 septembre 2017](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=became%20%E2%80%98when%E2%80%99%20on%20Tuesday%2C%20September%2019%202017), lorsque l'entreprise est devenue victime d'une attaque man-in-the-middle.

Ce qui s'est passé n'était pas une exploitation de serveur. Aux premières heures du 19 septembre, [un attaquant a accédé aux enregistrements DNS du domaine Fox-IT.com chez notre fournisseur de registrar tiers](https://grahamcluley.com/fox-it-dns-hack/#:~:text=an%20attacker%20accessed%20the%20DNS%20records%20for%20the%20Fox%2DIT.com%20domain). Avec le contrôle de ces enregistrements, l'attaquant a [modifié un enregistrement DNS pour un serveur particulier afin de le faire pointer vers un serveur en sa possession et d'intercepter puis rediriger le trafic](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=modified%20a%20DNS%20record%20for%20one%20particular%20server) vers la vraie infrastructure Fox-IT.

Ce dernier détail — *rediriger le trafic* — est ce qui en faisait une attaque man-in-the-middle plutôt qu'une simple panne. Les visiteurs atteignaient toujours un portail fonctionnel. Ils l'atteignaient simplement en passant d'abord par l'attaquant.

La cible était précise. L'attaque [visait spécifiquement ClientPortal, l'application web d'échange de documents de Fox-IT](https://grahamcluley.com/fox-it-dns-hack/#:~:text=specifically%20aimed%20at%20ClientPortal), le système que Fox-IT utilisait pour échanger des fichiers de façon sécurisée avec ses clients, fournisseurs et autres organisations. En d'autres termes, l'attaquant s'en est pris directement au canal par lequel transitaient les documents clients sensibles.

Parce que Fox-IT l'a détecté et contenu, l'entreprise a [limité le temps total effectif de l'attaque MitM à 10 heures et 24 minutes](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=we%20limited%20the%20total%20effective%20MitM%20time%20to%2010%20hours%20and%2024%20minutes). La couverture indépendante confirme le même chiffre : [l'incident s'est produit le 19 septembre et a duré 10 heures et 24 minutes](https://www.bleepingcomputer.com/news/security/top-security-firm-admits-to-mitm-security-incident/#:~:text=lasted%20for%2010%20hours%20and%2024%20minutes).

## Ce qui a réellement été intercepté

Dix heures d'attaque man-in-the-middle sur un portail d'échange de documents semble catastrophique. Le butin réel était maigre — et c'est précisément cette maigre récolte qui constitue le cœur de l'histoire.

Durant la fenêtre d'attaque, [neuf utilisateurs individuels se sont connectés et leurs identifiants ont été interceptés](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=Nine%20individual%20users%20logged%20in). Mais ces identifiants étaient en grande partie inutilisables : le portail de Fox-IT exigeait un second facteur d'authentification que l'attaquant, positionné dans le chemin réseau, ne pouvait pas rejouer. Help Net Security a noté que les identifiants de connexion de neuf utilisateurs avaient été capturés mais [étaient inutilisables sans le second facteur d'authentification](https://www.helpnetsecurity.com/2017/12/15/fox-it-security-breach/#:~:text=useless%20without%20the%20second%20authentication%20factor).

En termes de fichiers, [douze fichiers (dont dix uniques) ont été transférés et interceptés](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=Twelve%20files%20%28of%20which%20ten%20were%20unique%29%20were%20transferred%20and%20intercepted). Une poignée contenait des informations confidentielles sur des clients. L'attaquant a également capturé un sous-ensemble de noms et d'adresses e-mail d'utilisateurs de ClientPortal, quelques noms de compte et un numéro de téléphone mobile, comme l'a résumé [SecurityWeek](https://www.securityweek.com/hackers-target-security-firm-fox-it/#:~:text=mobile%20phone%20number).

Deux faits ont maintenu les dégâts dans des limites acceptables. Premièrement, Fox-IT a déclaré clairement que [les fichiers classifiés secret d'État ne sont jamais transférés via notre ClientPortal](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=Files%20classified%20as%20state%20secret%20are%20never%20transferred) — les informations les plus sensibles ne transitaient tout simplement jamais par le canal exposé. Deuxièmement, le second facteur interne de l'entreprise a amorti le vol des identifiants. L'architecture a limité le rayon d'impact même après l'échec du périmètre — le DNS.

## Comment c'est arrivé : un mot de passe périmé, pas de second facteur

![Art conceptuel vivid et coloré d'une clé ornementale soustraite de la poche d'un gardien endormi et utilisée pour ouvrir grand un poteau indicateur qui détourne un fleuve de lumière vers un stand miroir caché, où un sceau de cire forgé tamponner un certificat brillant](../../assets/the-fox-it-dns-hijack-02-mitm.jpg)

Le mécanisme ressemble à une checklist illustrant comment un domaine peut être pris sans qu'une seule ligne de malware soit présente sur les serveurs de la victime.

**Étape un — accéder au compte registrar.** L'attaquant [s'est connecté avec succès au panneau de contrôle DNS de notre fournisseur de registrar tiers en utilisant des identifiants valides](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=logged%20in%20to%20the%20DNS%20control%20panel). L'enquête de Fox-IT a conclu que l'attaquant [avait probablement obtenu l'accès aux identifiants du panneau de contrôle DNS de leur registrar via la compromission d'un fournisseur tiers](https://www.helpnetsecurity.com/2017/12/15/fox-it-security-breach/#:~:text=through%20the%20compromise%20of%20a%20third%20party%20provider). Deux faiblesses cumulées ont permis à cette connexion de réussir : le [mot de passe n'avait pas été changé depuis 2013](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=the%20password%20had%20not%20been%20changed%20since%202013) et le registrar ne proposait aucun second facteur du tout — au moment de la rédaction du rapport, Fox-IT notait que le [registrar ne supporte toujours pas la 2FA](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=registrar%20still%20does%20not%20support%202FA).

**Étape deux — modifier le DNS et prouver la « propriété » à une CA.** Une fois le panneau ouvert, l'attaquant a réorienté le DNS. Mais pour mener une attaque man-in-the-middle *crédible* sur un site HTTPS, il avait besoin d'un certificat valide pour fox-it.com — et la méthode moderne pour en obtenir un est de prouver que vous contrôlez le domaine. L'attaquant a fait exactement cela. Dans une courte fenêtre autour de 02h05–02h15, il a [temporairement réacheminé et intercepté les e-mails de Fox-IT dans le but précis de prouver qu'il possédait notre domaine dans le cadre de l'enregistrement frauduleux d'un certificat SSL pour notre ClientPortal](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=fraudulently%20registering%20an%20SSL%20certificate%20for%20our%20ClientPortal). C'est là que tout lecteur devrait marquer une pause : **le contrôle du DNS est, en pratique, le contrôle de la validation de domaine.** Un certificat validé par domaine est accordé à quiconque peut répondre au défi de la CA — et ici, contrôler le DNS a permis à l'attaquant de réacheminer l'e-mail de validation et d'y répondre. C'est le DNS qui décide où atterrit cette preuve de propriété.

**Étape trois — se positionner au milieu.** Armé d'un certificat légitimement émis (mais obtenu frauduleusement), l'attaquant a fait pointer le domaine vers un VPS à l'étranger et a intercepté le trafic. Comme SecurityWeek l'a décrit, le [certificat SSL frauduleux a été utilisé pour une attaque MitM sur ClientPortal, avec le trafic vers le portail acheminé via un fournisseur de serveur privé virtuel (VPS) à l'étranger](https://www.securityweek.com/hackers-target-security-firm-fox-it/#:~:text=rogue%20SSL%20certificate%20was%20used). Pour un visiteur, rien n'était anormal. Le cadenas était réel. Le certificat validait. L'homme au milieu détenait une clé que le navigateur reconnaissait.

Trois couches — le DNS, l'autorité de certification et TLS lui-même — fonctionnaient toutes techniquement correctement. L'attaquant n'en a cassé aucune. Il a convaincu les trois qu'il était Fox-IT, et la seule chose qui lui a permis de le faire était un unique identifiant périmé à facteur unique auprès d'un registrar.

## La réponse de Fox-IT : détecter, contenir, puis informer tout le monde

Ce qui distingue cet incident d'une centaine d'autres plus discrets, c'est la réponse — tant technique qu'éditoriale.

**La détection a été rapide.** Fox-IT a déterminé que les serveurs de noms de son domaine fox-it.com avaient été redirigés, détectant l'intrusion environ cinq heures après son début — [environ cinq heures après le début de l'attaque](https://www.helpnetsecurity.com/2017/12/15/fox-it-security-breach/#:~:text=five%20hours%20after%20the%20attack%20started), selon Help Net Security. La capture complète de paquets et les capteurs réseau que l'entreprise exploitait sur elle-même lui ont fourni l'enregistrement forensique permettant de reconstituer exactement ce qui avait été touché ou non.

**Le confinement a été délibéré.** Plutôt que de mettre le portail hors ligne et d'alerter l'attaquant, Fox-IT a opté pour une mesure d'atténuation plus discrète : elle a [désactivé l'authentification par second facteur pour notre système d'authentification de connexion ClientPortal](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=disabled%20the%20second%20factor%20authentication) — une décision contre-intuitive, mais qui lui a permis de gérer la situation tout en reprenant le contrôle de son DNS, sans révéler qu'elle avait repéré l'intrusion. Puis elle a [immédiatement contacté les clients concernés par ces fichiers](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=All%20affected%20clients%20in%20respect%20of%20these%20files%20were%20contacted%20immediately).

**Ensuite est venu ce qui en a fait une étude de cas.** Trois mois plus tard, après analyse et avec une enquête judiciaire en cours, Fox-IT a publié un post-mortem complet et horodaté sous une thèse simple : [la transparence génère plus de confiance que le secret et il y a des leçons à tirer](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=transparency%20builds%20more%20trust%20than%20secrecy). Une entreprise de sécurité avait été compromise de la façon la plus emblématique qui soit — et plutôt que d'enterrer l'affaire, elle a offert au secteur une analyse détaillée. Le titre de BleepingComputer a bien cerné le ton que méritait ce moment : [Top Security Firm Admits to MitM Security Incident](https://www.bleepingcomputer.com/news/security/top-security-firm-admits-to-mitm-security-incident/#:~:text=Top%20Security%20Firm%20Admits).

## Ce que cela enseigne sur la sécurité des registrars et les verrouillages de registre

Retirez les détails spécifiques et l'incident Fox-IT est une leçon sur l'emplacement réel du périmètre. Pour la plupart des organisations, le périmètre n'est pas seulement le pare-feu. C'est la connexion au registrar. Voici ce que ce cas plaide :

1. **Traitez le compte registrar comme une infrastructure de production.** Il change rarement, ce qui le fait facilement oublier — c'est précisément pourquoi il se dégrade. Un mot de passe inchangé [depuis 2013](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=the%20password%20had%20not%20been%20changed%20since%202013) n'est pas « à faible risque parce que peu fréquenté » ; c'est un identifiant de haute valeur sans aucune surveillance.

2. **Exigez l'authentification multi-facteurs auprès du registrar — et partez si elle n'est pas proposée.** Le registrar de Fox-IT [ne supportait pas la 2FA](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=registrar%20still%20does%20not%20support%202FA) du tout. Le compte le plus important dans la chaîne de sécurité de votre domaine était protégé par un seul mot de passe. La présence ou l'absence de la 2FA auprès d'un registrar est un critère d'achat, pas un simple bonus.

3. **Utilisez un verrouillage de registre.** Au-delà de la connexion au registrar, de nombreux registres proposent un *verrouillage de registre* — un blocage côté serveur qui empêche toute modification des serveurs de noms et des enregistrements de contacts, sauf à accomplir une étape de vérification manuelle hors bande. Un verrouillage de registre aurait signifié que même un mot de passe de registrar entièrement compromis ne pouvait pas réorienter silencieusement le DNS. Cela transforme le « à un panneau de distance » en « plusieurs humains et un appel téléphonique de distance ».

4. **Déployez [DNSSEC](/fr/glossary/dnssec/) autant que possible.** DNSSEC signe cryptographiquement les réponses DNS afin que les résolveurs puissent détecter les altérations dans le chemin de résolution. Ce n'est pas une solution miracle ici — un attaquant qui contrôle les enregistrements faisant autorité peut les re-signer — mais cela augmente le coût et ferme des catégories entières de manipulation DNS en transit. La défense en profondeur au niveau DNS compte précisément parce que, comme ce cas l'a montré, le DNS se situe *au-dessus* de TLS et de l'émission des certificats dans la chaîne de confiance.

5. **Rappelez-vous que le contrôle du DNS équivaut au contrôle des certificats.** L'attaquant a obtenu un certificat TLS valide en [prouvant la propriété du domaine via un e-mail réacheminé](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/#:~:text=proving%20that%20they%20owned%20our%20domain). Surveillez les journaux de Certificate Transparency pour détecter les certificats inattendus émis pour vos domaines. Un certificat frauduleux apparaissant dans CT est l'un des rares signaux externes indiquant qu'un détournement DNS pourrait être en cours.

6. **Maintenez un second facteur sur l'application elle-même.** La 2FA du portail Fox-IT est la raison pour laquelle neuf mots de passe volés étaient [inutilisables sans le second facteur d'authentification](https://www.helpnetsecurity.com/2017/12/15/fox-it-security-breach/#:~:text=useless%20without%20the%20second%20authentication%20factor). Quand la couche externe (DNS) a échoué, la couche interne (MFA au niveau applicatif) a tout de même limité les dégâts.

Le fil conducteur : votre domaine est un point de défaillance unique que vous sous-traitez en partie. Le renforcer n'est pas glamour, et cela ne paie qu'au moment où quelqu'un tente exactement ce qui s'est passé chez Fox-IT.

## L'angle Namefi

![Illustration colorée de la propriété de domaine vérifiable et inviolable — une carte de domaine sécurisée par un bouclier vert, un jeton Namefi vert et la continuité DNS](../../assets/the-fox-it-dns-hijack-03-namefi-angle.jpg)

L'incident Fox-IT est, à sa racine, un problème de contrôle et de provenance. L'attaquant n'avait jamais besoin d'être Fox-IT. Il avait seulement besoin qu'un système — le panneau du registrar — *croie* qu'il l'était, suffisamment longtemps pour réorienter le DNS et émettre un certificat. Tout ce qui en découlait faisait confiance à cette conviction.

[Namefi](https://namefi.io) est construit pour rendre le contrôle de domaine vérifiable et inviolable plutôt que dépendant d'un seul mot de passe réutilisable dans le tableau de bord web d'un fournisseur. En représentant la propriété du domaine comme un actif vérifiable et enregistré sur la blockchain, compatible avec le DNS, le contrôle devient quelque chose que vous pouvez auditer et prouver — pas seulement un compte dans lequel quelqu'un pourrait silencieusement se connecter et reconfigurer. Les modifications critiques peuvent être liées à la propriété que vous détenez réellement, dans l'esprit d'un verrouillage de registre, plutôt qu'à un identifiant qui n'a pas été renouvelé depuis des années.

Rien de tout cela ne rendrait un attaquant déterminé impossible. Mais l'histoire de Fox-IT est finalement celle d'un simple vol de connexion se traduisant par un contrôle total sur un nom. Plus le contrôle du domaine est proche d'une propriété vérifiable — et plus il est difficile de modifier un nom silencieusement avec un seul mot de passe périmé — moins un moment comme celui où Fox-IT est passé du « si » au « quand » peut se propager avant que quelqu'un ne le remarque.

Une entreprise de sécurité a détecté son propre détournement en cinq heures et a dit au monde comment. La plupart des organisations ne le détecteraient ni en cinq heures ni jamais. La leçon la moins chère est celle que Fox-IT a payée : sécurisez le registrar avant qu'il ne devienne la porte ouverte.

## Sources et lectures complémentaires

- Fox-IT (NCC Group) — [Lessons learned from a Man-in-the-Middle attack](https://blog.fox-it.com/2017/12/14/lessons-learned-from-a-man-in-the-middle-attack/) (post-mortem principal)
- BleepingComputer — [Top Security Firm Admits to MitM Security Incident](https://www.bleepingcomputer.com/news/security/top-security-firm-admits-to-mitm-security-incident/)
- Help Net Security — [Security company Fox-IT reveals, details MitM attack they suffered in September](https://www.helpnetsecurity.com/2017/12/15/fox-it-security-breach/)
- Graham Cluley — [Fox-IT reveals hackers hijacked its DNS records, spied on clients' files](https://grahamcluley.com/fox-it-dns-hack/)
- SecurityWeek — [Hackers Target Security Firm Fox-IT](https://www.securityweek.com/hackers-target-security-firm-fox-it/)
- GBHackers — [Leading IT Security Firm Fox-IT hit by Cyber Attack](https://gbhackers.com/cyber-attack/)
- Krebs on Security — [A Deep Dive on the Recent Widespread DNS Hijacking Attacks](https://krebsonsecurity.com/2019/02/a-deep-dive-on-the-recent-widespread-dns-hijacking-attacks/) (connexe : technique de détournement DNS + certificat frauduleux à grande échelle)
