---
title: "Comment le piratage de domaine se produit réellement : cinq vecteurs d'attaque et les contrôles pour les contrer"
date: '2026-05-10'
language: fr
tags: ['security', 'domains', 'registrar', 'incident-response']
authors: ['namefiteam']
draft: false
description: "Un guide pratique des cinq méthodes par lesquelles les attaquants s'emparent réellement des domaines dans le monde réel (ingénierie sociale, compromission de compte de bureau d'enregistrement, prise de contrôle du fournisseur DNS, détournement de NS et récupération de domaines expirés) et des contrôles spécifiques qui bloquent chacune d'elles."
ogImage: ../../assets/how-domain-hijacking-actually-happens-og.jpg
keywords: ['piratage de domaine', 'sécurité des domaines', 'verrouillage du registrar', 'verrouillage de transfert', 'dnssec', 'authentification à deux facteurs', 'ingénierie sociale', 'dns orphelin', 'namefi']
---

L'expression « piratage de domaine » (domain hijacking) a une consonance dramatique, mais elle désigne des réalités très différentes selon la manière dont elle se produit. Un compte de bureau d'enregistrement (registrar) piraté via un e-mail de phishing est un piratage. Un enregistrement de serveur de noms (nameserver) discrètement modifié chez un fournisseur DNS est un piratage. Un domaine expiré qu'une autre personne s'approprie et redirige est, d'une certaine manière, également un piratage.

Dans tous les cas, le résultat est le même : quelqu'un d'autre indique désormais au monde entier vers quoi pointe votre nom. Les e-mails, les paiements, les processus de connexion et les intégrations SaaS commencent tous à envoyer du trafic vers l'attaquant. La récupération prend souvent des jours, voire des semaines. Si le domaine a été transféré vers un autre bureau d'enregistrement, la politique de résolution des litiges liés aux transferts ([Transfer Dispute Resolution Policy ou TDRP](https://www.icann.org/en/contracted-parties/consensus-policies/uniform-domain-name-dispute-resolution-policy/domain-name-dispute-resolution-policies-25-02-2012-en#:~:text=The%20Transfer%20Dispute%20Resolution%20Policy%20(TDRP)%20applies%20to%20transactions%20in%20which%20a%20domain%2Dname%20holder%20transfers%20or%20attempts%20to%20transfer%20a%20domain%20name%20to%20a%20new%20registrar.)) de l'ICANN peut s'appliquer ; d'autres cas nécessitent souvent une escalade auprès du bureau d'enregistrement, du registre, une récupération de la plateforme ou une décision de justice. La solution la plus rapide consiste à ne jamais se retrouver dans cette situation en premier lieu.

Cet article passe en revue les cinq vecteurs d'attaque que nous rencontrons le plus souvent, ce à quoi ressemble chacun d'eux du point de vue du défenseur, et les contrôles spécifiques qui permettent réellement de les contrer.

## 1. Ingénierie sociale contre l'équipe d'assistance du bureau d'enregistrement

Les piratages les plus médiatisés de la dernière décennie n'ont impliqué aucune faille technique. Ils ont impliqué un simple coup de téléphone.

Le mode opératoire : un attaquant collecte suffisamment d'informations sur une cible — historique WHOIS, LinkedIn, fuites de mots de passe, réseaux sociaux — puis appelle ou envoie un e-mail à l'équipe d'assistance du bureau d'enregistrement en se faisant passer pour le propriétaire. Il demande une réinitialisation de mot de passe, un changement d'adresse e-mail ou un code d'autorisation de transfert. Si l'agent d'assistance suit une liste de vérification à laquelle l'attaquant s'est préparé, le compte change de main.

C'est le mécanisme qui a été utilisé dans plusieurs des piratages les plus dommageables impliquant des plateformes d'échange de cryptomonnaies, des réseaux publicitaires et des marques d'infrastructure. Il ne nécessite aucune vulnérabilité dans le code du bureau d'enregistrement ; il exploite le facteur humain.

**Ce qui permet de le bloquer :**

- **Une règle stricte du côté du bureau d'enregistrement** exigeant que les changements de propriété nécessitent soit un document notarié, soit un défi d'authentification multifacteur via le canal existant du titulaire.
- **Le verrouillage au niveau du registre (registry lock)** (distinct du verrouillage du bureau d'enregistrement), où l'opérateur du registre lui-même refuse d'agir sur les transferts ou les modifications de contact sans une confirmation hors bande (out-of-band). Disponible sur les domaines en `.com`, `.net` et de nombreux ccTLD.
- **Vérifier quel bureau d'enregistrement vous utilisez réellement** et supprimer les autres. Les marques créées en 2007 ont souvent des comptes inactifs chez trois ou quatre bureaux d'enregistrement avec des identifiants faibles.

## 2. Compromission du compte du bureau d'enregistrement (le vecteur des identifiants)

C'est le cousin technique de l'ingénierie sociale. L'attaquant récupère les identifiants du compte du bureau d'enregistrement via une attaque de phishing, ou les trouve dans une fuite de données (credential stuffing), et se connecte directement. À partir de là, il déverrouille le domaine, modifie l'e-mail de contact et demande un transfert.

**Ce qui permet de le bloquer :**

- **Une 2FA (authentification à deux facteurs) résistante au phishing sur le compte du bureau d'enregistrement.** L'utilisation d'un mot de passe à usage unique (TOTP) via une application d'authentification est le minimum syndical ; les clés de sécurité matérielles (WebAuthn / FIDO2) représentent la meilleure protection. La 2FA par SMS n'est pas suffisante — les attaques par échange de carte SIM (SIM-swapping) l'ont contournée à maintes reprises. Les [recommandations de la CISA](https://www.cisa.gov/secure-our-world/turn-mfa) du gouvernement américain conseillent explicitement d'abandonner les SMS.
- **Un bureau d'enregistrement qui prend en charge les verrouillages par domaine** en plus des verrouillages par compte, afin qu'une seule compromission de compte ne permette pas de tout déverrouiller d'un coup.
- **Une piste d'audit et des alertes** sur les modifications de contact, les changements de serveurs de noms et les demandes de transfert. Le premier réflexe de l'attaquant est de désactiver ces alertes ; si elles sont envoyées sur un canal que l'attaquant ne contrôle pas, vous disposez d'un temps de réaction.

## 3. Prise de contrôle du fournisseur DNS

Même si le compte du bureau d'enregistrement est verrouillé, les *serveurs de noms* qu'il publie peuvent pointer vers un fournisseur DNS avec un compte séparé — Cloudflare, Route 53, NS1, DNSimple, ou votre propre serveur BIND. Si l'attaquant parvient à pénétrer dans ce compte DNS, il n'a pas besoin de toucher au bureau d'enregistrement. Il lui suffit de réécrire les enregistrements A, MX et TXT pour que le trafic suive.

C'est souvent la voie la plus facile pour les attaquants, car les entreprises investissent dans la sécurité du bureau d'enregistrement mais traitent le fournisseur DNS comme une simple « infrastructure » avec des contrôles plus faibles.

**Ce qui permet de le bloquer :**

- **La même rigueur en matière de 2FA sur le compte du fournisseur DNS que sur celui du bureau d'enregistrement.** Considérez-le comme tout aussi sensible. Car il l'est.
- **DNSSEC**, signé au niveau de la zone. DNSSEC n'empêche pas la compromission d'un compte de fournisseur DNS : si un attaquant peut publier des enregistrements via le fournisseur et que ce dernier les signe avec les clés actives de la zone, les résolveurs de validation traiteront ces réponses comme authentiques. Ce que DNSSEC bloque en revanche, ce sont les altérations en cours de route, l'empoisonnement de cache et les réponses falsifiées qui ne sont pas signées ou qui le sont de manière incorrecte, en supposant que le parent publie les bons enregistrements DS. Consultez les [RFC 4033-4035](https://datatracker.ietf.org/doc/html/rfc4033) pour les détails du protocole.
- **Le DNS multi-fournisseurs** avec des comptes et des identifiants séparés, en utilisant le [DNSSEC multi-signataires](https://www.rfc-editor.org/rfc/rfc8901#:~:text=The%20central%20requirement%20for%20both%20of%20the%20multiple%2Dsigner%20models%20is%20to%20ensure%20that%20the%20ZSKs%20from%20all%20providers%20are%20present%20in%20each%20provider's%20apex%20DNSKEY%20RRset.). Cela favorise la disponibilité et l'isolation des fournisseurs, mais ne fonctionne que si chaque fournisseur sert les données de zone prévues et que les ensembles DNSKEY/DS sont coordonnés correctement. Il ne s'agit pas d'une solution magique où les résolveurs préfèrent automatiquement le fournisseur non compromis.

## 4. Détournements de serveurs de noms via des délégations obsolètes et des enregistrements orphelins (dangling DNS)

Une variante plus subtile : le domaine lui-même est sécurisé, mais un *sous-domaine* pointe (via un enregistrement CNAME ou NS) vers un service tiers que le propriétaire d'origine ne contrôle plus. L'attaquant enregistre la ressource du côté du tiers et répond désormais au nom du sous-domaine.

Exemples :

- Un sous-domaine lié par un CNAME à une ancienne ressource Heroku, S3 ou Azure qui a été libérée. L'attaquant récupère le nom de cette ressource et obtient un certificat TLS valide.
- Un enregistrement `NS` délégué pointant vers un compte de fournisseur DNS qui a été supprimé. L'attaquant crée un nouveau compte en utilisant exactement le même modèle d'hôte et diffuse les enregistrements de son choix pour le sous-domaine.

Ces cas sont répertoriés sous le terme générique de **DNS orphelin (dangling DNS)**, et constituent aujourd'hui la forme la plus courante de « véritables » piratages de domaine sur le web ouvert. En effet, la plupart des grandes organisations possèdent des centaines ou des milliers de sous-domaines et n'en auditent qu'une infime partie.

**Ce qui permet de le bloquer :**

- **Un inventaire complet de chaque enregistrement NS, CNAME et ALIAS** dans toutes les zones que vous possédez, avec un responsable identifié pour chacun.
- **Des scanners automatisés de DNS orphelins** qui résolvent à nouveau chaque enregistrement à intervalles réguliers et signalent ceux qui pointent vers des services tiers ne répondant plus. Le [blog de GitHub](https://github.blog/2021-12-13-securing-our-home-labs-frigate-version-bump/) et [Detectify Labs](https://labs.detectify.com/2014/10/21/hostile-subdomain-takeover-using-herokugithubdesk-more/) proposent des articles détaillés et de longue date sur ce type d'attaque.
- **Le retrait des enregistrements le jour même** de la désactivation du service sous-jacent.

## 5. Récupération de domaines expirés

L'attaque la plus simple et la moins sophistiquée : le titulaire a oublié de renouveler le domaine. La période de grâce s'écoule. Le domaine retombe dans le domaine public. Quelqu'un d'autre l'enregistre.

Cela ressemble à une défaillance opérationnelle, et non à un incident de sécurité, mais l'impact est identique : quelqu'un d'autre contrôle désormais le nom, et tous les signaux de confiance construits au fil des années (SPF, DKIM, rappels OAuth, e-mails de réinitialisation de mot de passe, intégrations de paiement) commencent à affluer vers un inconnu. Lors de plusieurs incidents publics, des attaquants ont racheté des domaines expirés spécifiquement parce que le propriétaire précédent les avait enregistrés comme revendication `iss` dans des jetons OAuth ou comme expéditeur pour des e-mails transactionnels.

**Ce qui permet de le bloquer :**

- **Le renouvellement pluriannuel** (5 à 10 ans) pour tout domaine lié à l'authentification, aux paiements ou au trafic de production. Le coût est dérisoire ; la protection est considérable.
- **Le renouvellement automatique avec un mode de paiement qui ne peut pas échouer silencieusement.** L'expiration des cartes bancaires est la cause la plus fréquente d'expiration accidentelle de domaine.
- **Des rappels de calendrier** à 90, 60, 30 et 7 jours envoyés à une adresse d'*équipe*, et non dans la boîte de réception d'une seule personne qui pourrait quitter l'entreprise.

## À quoi ressemble une bonne posture de sécurité

En regroupant ces contrôles, le standard de base pour tout domaine important ressemble à ceci :

| Contrôle | Bloque le vecteur d'attaque |
| -------------------------------------- | ----------------------------------------------- |
| 2FA par clé matérielle sur le bureau d'enregistrement | Compromission de compte (vecteur 2) |
| 2FA par clé matérielle sur le fournisseur DNS | Prise de contrôle DNS (vecteur 3) |
| Verrouillage du registre (si disponible) | Ingénierie sociale (vecteur 1) |
| DNSSEC signé au niveau de la zone | Altération en cours de route et réponses DNS falsifiées |
| Inventaire des sous-domaines + scanner de DNS orphelins | Détournement de sous-domaine (vecteur 4) |
| Renouvellement sur 5-10 ans + auto-renouvellement | Expiration accidentelle (vecteur 5) |
| Alertes sur les modifs de contact/NS/transfert | Les cinq vecteurs (détection précoce) |

Si vous êtes responsable d'un domaine et que vous ne pouvez pas cocher toutes les cases de ce tableau, la tâche de l'attaquant s'en trouve grandement facilitée.

## Comment Namefi change la donne

La plupart des contrôles ci-dessus existent sous forme de fonctionnalités chez un bureau d'enregistrement, un fournisseur DNS ou un outil de gestion de flux de travail (workflow), et la sécurité dépend du compte le plus vulnérable. Namefi « tokenise » (transforme en jetons) la relation du titulaire sur la blockchain (on-chain), ce qui signifie que le registre de référence indiquant *qui possède ce nom* réside en dehors de la base de données client de n'importe quel bureau d'enregistrement. Un agent d'assistance d'un fournisseur quelconque ne peut pas modifier discrètement la propriété d'un domaine sans une transaction signée que le propriétaire légitime doit approuver. Le bureau d'enregistrement continue d'opérer la délégation technique, mais la couche de *contrôle* est déplacée vers un environnement où l'ingénierie sociale ne fonctionne pas.

Cela ne remplace pas intégralement les contrôles du tableau ci-dessus — vous avez toujours besoin de DNSSEC, d'une 2FA chez le fournisseur DNS et de renouveler vos domaines. Cependant, cela élimine entièrement du modèle de menace le vecteur de piratage à fort impact le plus courant (vecteur 1).

## Sources et lectures complémentaires

- ICANN — [Portée de la politique de résolution des litiges liés aux transferts (TDRP)](https://www.icann.org/en/contracted-parties/consensus-policies/uniform-domain-name-dispute-resolution-policy/domain-name-dispute-resolution-policies-25-02-2012-en#:~:text=The%20Transfer%20Dispute%20Resolution%20Policy%20(TDRP)%20applies%20to%20transactions%20in%20which%20a%20domain%2Dname%20holder%20transfers%20or%20attempts%20to%20transfer%20a%20domain%20name%20to%20a%20new%20registrar.).
- IETF — [RFC DNSSEC 4033/4034/4035](https://datatracker.ietf.org/doc/html/rfc4033) et [RFC 8901 sur le DNSSEC multi-signataires](https://www.rfc-editor.org/rfc/rfc8901#:~:text=The%20central%20requirement%20for%20both%20of%20the%20multiple%2Dsigner%20models%20is%20to%20ensure%20that%20the%20ZSKs%20from%20all%20providers%20are%20present%20in%20each%20provider's%20apex%20DNSKEY%20RRset.).
- CISA — [Recommandations sur l'authentification multifacteur](https://www.cisa.gov/secure-our-world/turn-mfa).
- Detectify Labs — [Article sur la prise de contrôle de sous-domaines hostiles](https://labs.detectify.com/2014/10/21/hostile-subdomain-takeover-using-herokugithubdesk-more/).
- Verisign — [Verrouillage du registre pour les .com/.net](https://www.verisign.com/en_US/channel-resources/domain-registry-products/registry-lock/index.xhtml).