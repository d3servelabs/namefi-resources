---
title: 'Domain Mayday EP05 : Le détournement massif de domaines DeFi sur Squarespace en 2024'
date: '2026-06-17'
language: fr
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: "En juillet 2024, une migration de registrar de Google Domains vers Squarespace a transformé une authentification par défaut trop faible en une surface d'attaque massive. Des attaquants ont détourné les domaines de projets crypto et DeFi — Compound Finance, Celer Network, Pendle, Unstoppable Domains — et les ont redirigés vers des sites de phishing vidant les portefeuilles. Voici comment une migration « transparente » a créé des centaines de portes d'entrée non verrouillées, et ce qu'elle enseigne sur la sécurité des registrars et l'authentification multifacteur."
keywords: ['détournement domaine squarespace', 'migration google domains', 'détournement dns defi', 'détournement compound finance', 'détournement celer network', 'wallet drainer', 'inferno drainer', 'sécurité des domaines', 'migration registrar', 'mfa authentification multifacteur', 'prise de contrôle de compte oauth', 'détournement dns', 'phishing crypto']
relatedArticles:
  - /fr/blog/the-curve-finance-dns-hijack/
  - /fr/blog/the-badgerdao-frontend-attack/
  - /fr/blog/the-fox-it-dns-hijack/
  - /fr/blog/the-godaddy-multi-year-breach/
  - /fr/blog/the-dnspionage-campaign/
relatedTopics:
  - /fr/topics/domain-security/
  - /fr/topics/domain-tokenization/
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

En juillet 2024, la chose la plus dangereuse sur le site web d'un projet crypto n'était pas un bug de contrat intelligent ni une clé privée divulguée. C'était le registrar qui détenait le domaine.

Pendant quelques jours ce mois-là, les utilisateurs qui saisissaient une adresse familière dans leur navigateur — le site officiel d'un protocole de prêt de confiance, un bridge utilisé des centaines de fois — atterrissaient exactement là où ils s'attendaient, sur une page qui semblait parfaitement normale, avant de voir leurs portefeuilles se vider. Rien n'avait été piraté au sens habituel du terme. Personne n'avait deviné un mot de passe ni hameçonné une [phrase de récupération](/fr/glossary/seed-phrase/). Les attaquants avaient simplement pénétré par la porte d'entrée du *domaine* lui-même, parce que cette porte avait été laissée ouverte lors d'un déménagement d'entreprise que la plupart de ces projets n'avaient jamais remarqué.

Ce déménagement, c'était la migration de Google Domains vers Squarespace. La porte ouverte, c'était les paramètres d'authentification par défaut de Squarespace. Et le résultat fut une vague coordonnée de détournements [DNS](/fr/glossary/dns/) visant des projets crypto et [DeFi](/fr/glossary/defi/) contrôlant, selon les termes d'un chercheur, des milliards de dollars d'actifs.

## Comment une migration de registrar a créé une surface d'attaque massive

Les domaines ne sont généralement pas perçus comme une flotte. Chacun semble être une chose unique et privée — votre adresse, votre panneau de contrôle, vos enregistrements DNS. Mais les registrars les détiennent en masse, et lorsque l'ensemble de la clientèle d'un registrar migre vers un autre, chaque compte de cette base migre selon la *même* logique, avec les *mêmes* paramètres par défaut, au *même* moment. Toute faiblesse présente dans cette logique n'est pas un bug isolé. C'est une propriété de l'ensemble de la flotte.

C'est ce qui a fait de l'incident de 2024 un événement *massif* plutôt qu'une série de compromissions individuelles malheureuses.

En juin 2023, [Squarespace a racheté environ 10 millions de noms de domaine à Google Domains](https://krebsonsecurity.com/2024/07/researchers-weak-security-defaults-enabled-squarespace-domains-hijacks/#:~:text=Squarespace%20purchased%20roughly%2010%20million%20domain%20names%20from%20Google%20Domains%20in%20June%202023), après que Google a annoncé la fermeture de son registrar. Au cours de l'année suivante, [Squarespace a migré les utilisateurs pour environ 10 millions de noms de domaine acquis lors de la transaction](https://www.securityweek.com/hackers-exploit-flaw-in-squarespace-migration-to-hijack-domains/#:~:text=Squarespace%20has%20been%20migrating%20users%20for%20roughly%2010%20million%20domain%20names%20purchased%20in%20the%20transaction). Pour rendre la transition la plus fluide possible, Squarespace avait précréé des comptes pour les personnes associées à chaque domaine migré, en se basant sur les adresses e-mail enregistrées par Google.

La fluidité était précisément le problème. Une migration qui ne demande rien à l'utilisateur est une migration où l'utilisateur n'a rien prouvé — ni son mot de passe, ni son identité, ni son contrôle de l'adresse e-mail. Les comptes existaient, les domaines y étaient rattachés, et la seule chose qui séparait un domaine de quiconque se présentait en premier était un écran de connexion qui, pour ces comptes migrés, ne demandait presque rien.

## Les détournements de juillet 2024

![Illustration d'art conceptuel aux couleurs vives d'une migration massive de clés de maisons-domaines se déversant d'un camion de déménagement, certaines clés tombant dans des mains tendues depuis l'ombre, une rangée de petites maisons chacune étiquetée avec une adresse web lumineuse](../../assets/the-2024-squarespace-defi-domain-hijacks-01-mass-hijack.jpg)

[Les attaques ont débuté le 9 juillet](https://www.securityweek.com/hackers-exploit-flaw-in-squarespace-migration-to-hijack-domains/#:~:text=The%20attacks%20started%20on%20July%209) et se sont poursuivies les jours suivants. Elles n'étaient pas discrètes. Une [vague d'attaques de détournement DNS coordonnées ciblait des domaines de cryptomonnaies en finance décentralisée (DeFi) utilisant le registrar Squarespace, redirigeant les visiteurs vers des sites de phishing hébergeant des videurs de portefeuilles](https://www.bleepingcomputer.com/news/security/dns-hijacks-target-crypto-platforms-registered-with-squarespace/#:~:text=A%20wave%20of%20coordinated%20DNS%20hijacking%20attacks%20targets%20decentralized%20finance%20%28DeFi%29%20cryptocurrency%20domains%20using%20the%20Squarespace%20registrar%2C%20redirecting%20visitors%20to%20phishing%20sites%20hosting%20wallet%20drainers), comme l'a rapporté BleepingComputer.

La première à faire du bruit était l'un des plus grands noms du prêt DeFi. La société de sécurité Blockaid, qui a enquêté sur l'incident, a constaté que [les visiteurs de ces sites étaient redirigés vers des pages malveillantes conçues pour vider les fonds des portefeuilles connectés](https://www.blockaid.io/blog/squarespace-defi-domain-hijack-incident#:~:text=Visitors%20to%20these%20sites%20were%20being%20redirected%20to%20malicious%20pages%20designed%20to%20drain%20funds%20from%20connected%20wallets). Les faux sites n'étaient pas de grossières copies. Selon Blockaid, [ces fausses dApps utilisaient la dernière itération du kit de vidage Inferno, conçu pour inciter les utilisateurs à signer des transactions qui videraient leurs portefeuilles](https://www.blockaid.io/blog/squarespace-defi-domain-hijack-incident#:~:text=These%20fake%20dApps%20were%20running%20the%20latest%20iteration%20of%20the%20Inferno%20draining%20kit%2C%20designed%20to%20trick%20users%20into%20signing%20transactions%20that%20would%20empty%20their%20wallets).

La liste des victimes confirmées ressemblait à un appel nominal de l'écosystème. Les entités détournées comprenaient [Celer Network, Compound Finance, Pendle Finance et Unstoppable Domains](https://krebsonsecurity.com/2024/07/researchers-weak-security-defaults-enabled-squarespace-domains-hijacks/#:~:text=Celer%20Network%2C%20Compound%20Finance%2C%20Pendle%20Finance%2C%20and%20Unstoppable%20Domains). Pour Compound, [son domaine principal avait été pris en otage pour afficher une page de phishing](https://www.bleepingcomputer.com/news/security/dns-hijacks-target-crypto-platforms-registered-with-squarespace/#:~:text=its%20main%20domain%20had%20been%20taken%20over%20to%20display%20a%20phishing%20page). Celer a détecté la tentative et [récupéré rapidement ses enregistrements DNS](https://www.bleepingcomputer.com/news/security/dns-hijacks-target-crypto-platforms-registered-with-squarespace/#:~:text=swiftly%20recovered%20its%20DNS%20records) ; Pendle a [subi des problèmes similaires](https://www.bleepingcomputer.com/news/security/dns-hijacks-target-crypto-platforms-registered-with-squarespace/#:~:text=experienced%20similar%20issues) et a averti ses utilisateurs de révoquer les autorisations accordées à leurs portefeuilles.

## Ce qui était en jeu — et ce que les utilisateurs ont perdu

La cruauté d'un détournement de domaine réside dans le fait qu'il annule tous les réflexes que l'on apprend aux utilisateurs. Vérifiez l'URL. Assurez-vous que c'est le vrai site. Cherchez l'icône de cadenas. Tous ces conseils supposent que le domaine pointe encore là où il est censé le faire. Quand l'attaquant contrôle le DNS du domaine, l'URL *est* réelle — c'est l'adresse authentique du projet — et elle résout vers le serveur de l'attaquant. Le cadenas est vert. La barre d'adresse est honnête. La page est un piège.

C'est pourquoi des kits de vidage de portefeuilles comme Inferno se marient si bien avec le détournement DNS. Le videur n'a pas besoin de voler un mot de passe ; il a besoin que la victime *connecte un portefeuille et signe*. Et un utilisateur qui est arrivé sur le vrai domaine de son protocole de prêt n'a aucune raison d'hésiter avant d'approuver une transaction. Le site de phishing hérite de toute la confiance que le domaine légitime a mis des années à construire.

Quelle aurait pu être l'ampleur des dégâts ? Le chiffre qui a capturé l'étendue du problème n'était pas le nombre de vols confirmés, mais le nombre de projets *exposés*. L'analyse de Blockaid, rapportée par Decrypt, était sans détour : [environ 228 interfaces DeFi sont encore en danger](https://decrypt.co/239524/220-defi-protocols-risk-squarespace-dns-hijack#:~:text=roughly%20228%20DeFi%20protocol%20front%20ends%20are%20still%20at%20risk), car chacune d'elles était derrière la même faiblesse des comptes migrés. Les détournements qui ont eu lieu n'étaient qu'un échantillon. La surface d'attaque, c'était l'ensemble de la communauté crypto ayant migré de Google vers Squarespace.

## Comment cela s'est produit : la faille d'authentification de la migration

![Illustration d'art conceptuel aux couleurs vives d'une longue rangée de boîtes aux lettres devant un nouvel immeuble, chaque porte de boîte aux lettres ouverte et déverrouillée, une silhouette sans visage glissant discrètement des lettres dans l'une d'elles avant que le vrai propriétaire n'arrive, contraste de lumière chaude et froide](../../assets/the-2024-squarespace-defi-domain-hijacks-02-migration-flaw.jpg)

Le mécanisme, une fois reconstitué par les chercheurs, était presque embarrassant de simplicité — ce qui le rendait dangereux à grande échelle.

Partons de deux choix de conception. Premièrement, Squarespace ne vérifiait pas que la personne qui se connectait contrôlait réellement l'adresse e-mail du compte. Comme l'ont formulé les chercheurs, [Squarespace n'exige pas de vérification par e-mail pour les nouveaux comptes créés avec un mot de passe](https://socket.dev/blog/squarespace-domain-hijacks-enabled-by-email-address-exploit-on-migrated-accounts#:~:text=Squarespace%20doesn%27t%20require%20email%20verification%20for%20new%20accounts%20created%20with%20a%20password). Deuxièmement, les comptes migrés avaient été précréés mais pas encore réclamés — ils n'avaient pas de mot de passe défini. Ainsi, quand quelqu'un arrivait avec la bonne adresse e-mail, [comme il n'y a pas de mot de passe sur le compte, le système les dirige directement vers le flux « créez un mot de passe pour votre nouveau compte »](https://krebsonsecurity.com/2024/07/researchers-weak-security-defaults-enabled-squarespace-domains-hijacks/#:~:text=since%20there%27s%20no%20password%20on%20the%20account%2C%20it%20just%20shoots%20them%20to%20the).

Assemblez ces deux éléments et l'attaque s'écrit d'elle-même. Les adresses e-mail liées aux domaines migrés n'étaient pas secrètes — les contacts administrateurs et titulaires sont souvent publics ou devinables. Un attaquant qui s'inscrivait simplement en premier sur le compte, en utilisant un e-mail migré connu, avant que le vrai propriétaire ne se soit jamais connecté, repartait avec le contrôle du domaine. Taylor Monahan, responsable produit principal chez MetaMask et l'une des chercheuses qui ont disséqué l'incident, a décrit précisément l'angle mort : [Squarespace n'avait jamais envisagé la possibilité qu'un acteur malveillant puisse s'inscrire sur un compte en utilisant une adresse e-mail associée à un domaine récemment migré avant que le titulaire légitime n'ait créé son propre compte](https://krebsonsecurity.com/2024/07/researchers-weak-security-defaults-enabled-squarespace-domains-hijacks/#:~:text=Squarespace%20never%20accounted%20for%20the%20possibility%20that%20a%20threat%20actor%20might%20sign%20up%20for%20an%20account%20using%20an%20email%20associated%20with%20a%20recently%2Dmigrated%20domain%20before%20the%20legitimate%20email%20holder%20created%20the%20account%20themselves).

Pourquoi ce pré-lien existait-il ? Par commodité. Les chercheurs ont conclu que [Squarespace supposait que tous les utilisateurs migrant depuis Google Domains choisiraient les options de connexion sociale](https://krebsonsecurity.com/2024/07/researchers-weak-security-defaults-enabled-squarespace-domains-hijacks/#:~:text=Squarespace%20assumed%20all%20users%20migrating%20from%20Google%20Domains%20would%20select%20the%20social%20login%20options) — Google OAuth — plutôt que l'e-mail et le mot de passe. Le système [pré-liait toutes les adresses e-mail aux domaines, qu'un compte existe déjà ou non, probablement parce qu'ils voulaient permettre aux utilisateurs de se connecter via OAuth Google et d'accéder immédiatement à l'ensemble de leurs domaines](https://www.theregister.com/2024/07/15/squarespace_fingered_for_dns_hijackings/#:~:text=pre%2Dlinking%20all%20emails%20to%20domains%2C%20regardless%20of%20whether%20the%20account%20already%20exists%2C%20likely%20because%20they%20wanted%20users%20to%20be%20able%20to%20OAuth%20with%20Google%20and%20immediately%20have%20access%20to%20all%20their%20domains), comme les chercheurs l'ont expliqué à The Register. Mais le chemin e-mail/mot de passe n'a jamais été fermé, et sur ce chemin, rien ne prouvait le contrôle de la boîte de réception.

Il y avait un autre facteur aggravant. Durant la migration, la protection qui aurait dû détecter cela avait été désactivée : [dans le cadre de la transition vers Squarespace, l'authentification multifacteur avait été désactivée sur les comptes](https://www.bleepingcomputer.com/news/security/dns-hijacks-target-crypto-platforms-registered-with-squarespace/#:~:text=as%20part%20of%20the%20transition%20to%20Squarespace%2C%20multi%2Dfactor%20authentication%20was%20turned%20off%20on%20accounts). Même un propriétaire de domaine ayant soigneusement activé l'AMF sur Google Domains arrivait chez Squarespace avec cette AMF supprimée. Pas de mot de passe à craquer, pas de second facteur à contourner, pas d'e-mail à intercepter — pour un compte migré et non réclamé, la possession d'une adresse e-mail devinable constituait l'intégralité du processus d'authentification.

## Réponse et mesures correctives

La communauté de sécurité crypto a réagi plus vite que le registrar. Des chercheurs — parmi lesquels [Samczsun, Taylor Monahan et Andrew Mohawk](https://www.bleepingcomputer.com/news/security/dns-hijacks-target-crypto-platforms-registered-with-squarespace/#:~:text=Samczsun%2C%20Taylor%20Monahan%2C%20and%20Andrew%20Mohawk) — ont publié le mécanisme, et Blockaid a diffusé des listes d'interfaces encore vulnérables pour que les projets puissent vérifier leur exposition. Les projets touchés ont couru pour récupérer leurs comptes, réinitialiser leurs enregistrements DNS et avertir leurs utilisateurs de révoquer les approbations de tokens accordées aux sites malveillants.

Le conseil de remédiation immédiat était le même pour tous ceux qui utilisaient encore un compte migré : se connecter et revendiquer le compte avant qu'un attaquant ne le fasse, définir un mot de passe fort et unique, et — surtout — réactiver l'authentification multifacteur, que la migration avait silencieusement supprimée. De son côté, Squarespace a travaillé à verrouiller les comptes migrés et le flux de création de compte. Mais la leçon structurelle a survécu au correctif : un contrôle de sécurité qu'un fournisseur désactive pendant une migration est, le temps de cette migration, un contrôle qui n'existe pas.

## Ce que cela enseigne sur la sécurité des registrars et l'AMF

Les détournements sur Squarespace ne sont pas vraiment l'histoire d'une mauvaise configuration d'une seule entreprise. C'est l'histoire de l'endroit où réside réellement le contrôle d'un domaine, et à quel point la couche au-dessus de la [blockchain](/fr/glossary/blockchain/) reste fragile.

Quelques enseignements se généralisent bien au-delà de juillet 2024 :

1. **Le compte registrar est la vraie racine de confiance — pas le contrat intelligent.** Aucun des protocoles touchés n'avait de bug de contrat. Leur code [on-chain](/fr/glossary/on-chain/) était correct. Les attaquants ont pris le *domaine*, et le domaine est ce que les utilisateurs saisissent, font confiance, et connectent leurs portefeuilles. Un projet peut être irréprochable on-chain et quand même livrer ses utilisateurs à un attaquant si son plan de contrôle DNS est défaillant.

2. **L'AMF n'est une protection que si elle survit aux migrations.** Le détail douloureux ici est que l'AMF n'a pas échoué sous l'attaque — elle a été *supprimée* avant l'attaque, comme commodité de migration. Traitez le statut de l'AMF comme quelque chose à re-vérifier après chaque déplacement de compte, transfert ou changement de fournisseur, et non comme quelque chose que l'on configure une fois pour toutes.

3. **« Transparent » est un compromis de sécurité.** Chaque étape qu'une migration supprime pour la commodité de l'utilisateur est une étape où l'identité n'est pas prouvée. Les comptes précréés, les e-mails auto-liés et les connexions sans vérification sont autant de frictions que l'utilisateur n'a pas ressenties — et la friction est, très souvent, ce qui empêchait les attaquants d'entrer.

4. **Les identifiants devinables sont des identifiants déguisés.** Le « secret » qui a déverrouillé ces domaines était une adresse e-mail qui n'a jamais été secrète. Tout système dans lequel la connaissance d'un identifiant public accorde un contrôle n'est qu'à une usurpation d'identité d'une compromission.

5. **Le rayon d'explosion d'un registrar est égal à l'ensemble de sa clientèle.** La sécurité individuelle d'un domaine n'a pas d'importance si le comportement par défaut du registrar est faible, car le défaut s'applique à tout le monde en même temps. L'endroit où vit votre domaine, et la façon dont ce dépositaire gère l'authentification, est une décision de sécurité aussi importante que n'importe laquelle que vous prenez on-chain.

## L'angle Namefi

![Illustration colorée d'une propriété de domaine vérifiable et inviolable — une carte de domaine sécurisée par un bouclier vert, un jeton Namefi vert, et la continuité DNS](../../assets/the-2024-squarespace-defi-domain-hijacks-03-namefi-angle.jpg)

Les détournements de 2024 se sont produits dans l'écart entre « qui possède vraiment ce domaine » et « qui peut se connecter au compte qui le contrôle ». Dans le modèle traditionnel, ces deux choses ne sont que vaguement liées : la propriété est un enregistrement dans la base de données d'un registrar, et l'accès est conditionné par l'authentification que ce registrar impose à ce moment-là — y compris au milieu d'une migration de 10 millions de domaines où la porte était, brièvement, grande ouverte.

[Namefi](https://namefi.io) est conçu pour combler cet écart. En représentant la propriété du domaine comme un actif tokenisé on-chain compatible avec le DNS, le contrôle devient quelque chose que l'on peut *vérifier cryptographiquement* plutôt que quelque chose qui repose sur un e-mail devinable et des paramètres de connexion par défaut d'un fournisseur. La propriété réside dans un portefeuille que vous contrôlez, les transferts sont auditables, et la question « qui est autorisé à modifier les enregistrements de ce domaine » a une réponse inviolable plutôt qu'une réponse du service client.

Cela n'aurait pas rendu la migration de Squarespace parfaite. Mais cela change le mode de défaillance. Un attaquant qui crée un compte avec un e-mail connu ne possède pas pour autant un domaine tokenisé — la propriété n'est pas une ligne qu'un compte à moitié initialisé peut silencieusement s'approprier. Le plan de contrôle d'un nom de domaine devrait être aussi difficile à usurper que les actifs qu'il protège. En juillet 2024, pour des centaines de projets crypto, ce n'était pas le cas. C'est précisément cet écart qui mérite d'être comblé par l'ingénierie.

## Sources et lectures complémentaires

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
