---
title: "Comment le piratage de domaine se produit réellement : cinq vecteurs d'attaque et les contrôles pour les contrer"
date: '2026-05-10'
language: fr
tags: ['security', 'domains', 'registrar', 'incident-response']
authors: ['fenwei-bian']
editors: ['victor-zhou']
draft: false
description: "Un guide pratique sur les cinq véritables méthodes utilisées par les attaquants pour s'emparer de domaines dans le monde réel — ingénierie sociale, compromission de compte registrar, prise de contrôle du fournisseur DNS, piratage de serveurs de noms (NS) et récupération de domaines expirés — et les contrôles spécifiques qui bloquent chacune d'elles."
ogImage: ../../assets/how-domain-hijacking-actually-happens-og.jpg
keywords: ['piratage de domaine', 'sécurité de domaine', 'verrouillage registrar', 'verrouillage de transfert', 'dnssec', 'authentification à deux facteurs', 'ingénierie sociale', 'dangling dns', 'namefi']
relatedArticles:
  - /fr/blog/the-fox-it-dns-hijack/
  - /fr/blog/the-godaddy-multi-year-breach/
  - /fr/blog/the-badgerdao-frontend-attack/
  - /fr/blog/the-lenovo-com-dns-hijack/
  - /fr/blog/the-perl-com-domain-theft/
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

Le terme « [piratage de domaine](/fr/glossary/domain-hijacking/) » (domain hijacking) est l'une de ces expressions qui semble dramatique, mais qui désigne des réalités très différentes selon la manière dont cela se produit. Un compte de bureau d'enregistrement (registrar) piraté via un e-mail d'hameçonnage est un piratage. Un enregistrement de [serveur de noms](/fr/glossary/nameserver/) discrètement modifié chez un fournisseur [DNS](/fr/glossary/dns/) est un piratage. Un domaine expiré que quelqu'un d'autre récupère et redirige est, dans un sens, également un piratage.

Dans tous les cas, le résultat est le même : quelqu'un d'autre indique désormais au monde entier vers quoi pointe votre nom de domaine. Les e-mails, les paiements, les processus de connexion et les intégrations SaaS commencent tous à envoyer du trafic vers l'attaquant. La récupération prend souvent des jours, parfois des semaines. Si le domaine a été transféré vers un autre registrar, la [Politique de résolution des litiges liés aux transferts (TDRP)](https://www.icann.org/en/contracted-parties/consensus-policies/uniform-domain-name-dispute-resolution-policy/domain-name-dispute-resolution-policies-25-02-2012-en#:~:text=The%20Transfer%20Dispute%20Resolution%20Policy%20(TDRP)%20applies%20to%20transactions%20in%20which%20a%20domain%2Dname%20holder%20transfers%20or%20attempts%20to%20transfer%20a%20domain%20name%20to%20a%20new%20registrar.) de l'[ICANN](/fr/glossary/icann/) peut s'appliquer ; d'autres cas nécessitent souvent une escalade auprès du registrar, du [registre](/fr/glossary/registry/) (registry), une récupération de plateforme ou une ordonnance du tribunal. La solution la plus rapide est de ne jamais se retrouver dans cette situation en premier lieu.

Cet article détaille les cinq vecteurs d'attaque que nous rencontrons le plus souvent, à quoi ressemble chacun d'eux du point de vue du défenseur, et les contrôles spécifiques qui permettent de les bloquer.

## 1. Ingénierie sociale auprès de l'équipe d'assistance du registrar

Les piratages les plus médiatisés de la dernière décennie n'impliquaient aucune faille technique. Ils impliquaient un simple appel téléphonique.

Le schéma de base : un attaquant collecte suffisamment d'informations sur une cible — historique [WHOIS](/fr/glossary/whois/), LinkedIn, fuites de mots de passe, réseaux sociaux — puis appelle ou envoie un e-mail à l'équipe d'assistance du registrar en se faisant passer pour le propriétaire. Il demande une réinitialisation de mot de passe, un changement d'adresse e-mail ou un [code d'autorisation](/fr/glossary/auth-code/) de transfert (auth code). Si l'agent d'assistance suit une liste de vérification pour laquelle l'attaquant s'est préparé, le compte change de mains.

C'est le mécanisme qui se cache derrière plusieurs des piratages les plus dévastateurs impliquant des plateformes d'échange de cryptomonnaies, des réseaux publicitaires et des marques d'infrastructure. Cela ne nécessite aucune vulnérabilité dans le code du registrar ; cela exploite la faille humaine.

**Ce qui le bloque :**

- **Une règle stricte côté registrar** exigeant que les changements de propriété nécessitent soit un document notarié, soit un défi multifactoriel (MFA) via le canal de communication existant du titulaire.
- **Le verrouillage au niveau du registre (Registry lock)** (distinct du verrouillage du registrar), où l'opérateur du registre lui-même refuse d'agir sur les transferts ou les modifications de contact sans une confirmation hors bande. Disponible pour le `.com`, `.net` et de nombreux ccTLDs.
- **Vérifier quel registrar vous utilisez réellement** et supprimer les autres. Les marques créées en 2007 ont souvent d'anciens comptes inactifs chez trois ou quatre registrars avec des identifiants faibles.

## 2. Compromission du compte registrar (le vecteur des identifiants)

Le cousin technique de l'ingénierie sociale. L'attaquant récupère les identifiants du compte registrar par hameçonnage (phishing) ou les trouve dans une base de données issue de bourrage d'identifiants (credential stuffing), et se connecte directement. À partir de là, il déverrouille le domaine, modifie l'e-mail de contact et demande un transfert.

**Ce qui le bloque :**

- **Une 2FA (authentification à deux facteurs) résistante au phishing sur le compte registrar.** Le TOTP via une application d'authentification est le minimum requis ; les clés matérielles (WebAuthn / FIDO2) sont la norme d'excellence. La 2FA par SMS n'est pas suffisante — les attaques par échange de carte SIM (SIM-swapping) l'ont contournée à maintes reprises. Les [directives de la CISA](https://www.cisa.gov/secure-our-world/turn-mfa) du gouvernement américain recommandent explicitement d'abandonner les SMS.
- **Un registrar qui prend en charge les verrous par domaine** en plus des verrous par compte, de sorte qu'une seule compromission de compte ne puisse pas tout déverrouiller d'un coup.
- **Une piste d'audit et des alertes** concernant les changements de contact, de serveurs de noms et les demandes de transfert. La première action de l'attaquant consiste à désactiver ces alertes ; si elles sont envoyées sur un canal que l'attaquant ne contrôle pas, vous gagnez un temps précieux pour réagir.

## 3. Prise de contrôle du fournisseur DNS

Même si le compte du registrar est sécurisé, les *serveurs de noms* qu'il publie peuvent pointer vers un fournisseur DNS avec un compte distinct : Cloudflare, Route 53, NS1, DNSimple ou votre propre serveur BIND. Si l'attaquant s'introduit dans ce compte DNS, il n'a pas besoin de toucher au registrar. Il lui suffit de réécrire les enregistrements A, MX et TXT, et le trafic suivra.

C'est souvent la voie la plus facile pour les attaquants, car les marques investissent dans la sécurité du registrar, mais traitent le fournisseur DNS comme une simple « infrastructure » avec des contrôles plus faibles.

**Ce qui le bloque :**

- **La même rigueur en matière de 2FA sur le compte du fournisseur DNS que sur celui du registrar.** Traitez-le comme étant tout aussi sensible. Car il l'est.
- **[DNSSEC](/fr/glossary/dnssec/)**, signé au niveau de la zone. DNSSEC n'empêche pas la compromission d'un compte de fournisseur DNS : si un attaquant peut publier des enregistrements via le fournisseur et que celui-ci les signe avec les clés actives de la zone, les résolveurs de validation traiteront ces réponses comme authentiques. Ce que DNSSEC bloque, ce sont les altérations en cours de route (in-path tampering), l'empoisonnement de cache (cache poisoning) et les réponses falsifiées non signées ou mal signées, à condition que le parent publie les bons enregistrements DS. Consultez les [RFC 4033-4035](https://datatracker.ietf.org/doc/html/rfc4033) pour les détails du protocole.
- **Un DNS multi-fournisseurs** avec des comptes et des identifiants séparés, utilisant [DNSSEC multi-signataires](https://www.rfc-editor.org/rfc/rfc8901#:~:text=The%20central%20requirement%20for%20both%20of%20the%20multiple%2Dsigner%20models%20is%20to%20ensure%20that%20the%20ZSKs%20from%20all%20providers%20are%20present%20in%20each%20provider's%20apex%20DNSKEY%20RRset.). Cela contribue à la disponibilité et à l'isolation des fournisseurs, mais cela ne fonctionne que si chaque fournisseur sert les données de zone prévues et que les ensembles DNSKEY/DS sont correctement coordonnés. Il ne s'agit pas d'une solution magique où les résolveurs préféreront automatiquement le fournisseur non compromis.

## 4. Piratages de serveurs de noms via des délégations obsolètes et des enregistrements orphelins

Une variante plus subtile : le domaine lui-même est intact, mais un *[sous-domaine](/fr/glossary/subdomain/)* pointe (via un enregistrement CNAME ou NS) vers un service tiers que le propriétaire initial ne contrôle plus. L'attaquant enregistre la ressource du côté de ce tiers et prend désormais le contrôle de ce sous-domaine.

Exemples :

- Un sous-domaine pointant via un CNAME vers une ancienne ressource Heroku, S3 ou Azure qui a été libérée. L'attaquant réclame ce nom de ressource et obtient un certificat TLS valide.
- Un enregistrement `NS` délégué pointant vers un compte de fournisseur DNS qui a été supprimé. L'attaquant crée un nouveau compte en utilisant ce modèle d'hôte exact et sert les enregistrements de son choix pour ce sous-domaine.

Ceux-ci sont répertoriés sous le terme générique de **dangling DNS** (DNS orphelin), et ils constituent la forme la plus courante de « vrais » piratages de domaine sur le web ouvert aujourd'hui. En effet, la plupart des grandes organisations possèdent des centaines ou des milliers de sous-domaines et n'en auditent qu'une infime partie.

**Ce qui le bloque :**

- **Un inventaire complet de chaque enregistrement NS, CNAME et ALIAS** dans chaque zone que vous possédez, avec un propriétaire désigné pour chacun.
- **Des scanners automatisés de dangling DNS** qui résolvent à nouveau chaque enregistrement à intervalles réguliers et signalent ceux pointant vers des services tiers qui ne répondent plus. Le [blog de GitHub](https://github.blog/2021-12-13-securing-our-home-labs-frigate-version-bump/) et [Detectify Labs](https://labs.detectify.com/2014/10/21/hostile-subdomain-takeover-using-herokugithubdesk-more/) proposent des articles détaillés de longue date sur cette catégorie d'attaques.
- **La suppression des enregistrements le jour même** de la mise hors service du service sous-jacent.

## 5. Récupération de domaines expirés

L'attaque la plus simple et la plus impitoyable : le titulaire a oublié de renouveler. La période de grâce s'écoule. Le domaine retourne dans le domaine public (le pool). Quelqu'un d'autre l'enregistre.

Cela ressemble plus à une défaillance opérationnelle qu'à un incident de sécurité, mais l'impact est identique : quelqu'un d'autre contrôle désormais le nom de domaine, et tous les signaux de confiance accumulés au fil des années (SPF, DKIM, rappels OAuth, e-mails de réinitialisation de mot de passe, intégrations de paiement) commencent à affluer chez un inconnu. Plusieurs incidents publics ont impliqué des attaquants achetant des domaines expirés spécifiquement parce que le propriétaire précédent les avait enregistrés comme revendication `iss` dans des jetons OAuth ou comme expéditeur pour des e-mails transactionnels.

**Ce qui le bloque :**

- **Le renouvellement pluriannuel** (5 à 10 ans) pour tout domaine lié à l'authentification, aux paiements ou au trafic de production. Le coût est dérisoire ; la protection est significative.
- **Le renouvellement automatique avec un mode de paiement qui ne peut pas échouer silencieusement.** L'expiration des cartes bancaires est la cause la plus fréquente d'expiration accidentelle.
- **Des rappels de calendrier** à 90, 60, 30 et 7 jours, envoyés à une adresse d'*équipe*, et non dans la boîte de réception d'une seule personne qui pourrait quitter l'entreprise.

## À quoi ressemble une bonne sécurité

En rassemblant ces contrôles, la configuration de base pour tout domaine important ressemble à ceci :

| Contrôle                               | Bloque le vecteur d'attaque                     |
| -------------------------------------- | ----------------------------------------------- |
| 2FA par clé matérielle sur le registrar | Compromission de compte (vecteur 2)             |
| 2FA par clé matérielle sur le DNS      | Prise de contrôle du DNS (vecteur 3)            |
| Verrouillage du registre (si dispo.)   | Ingénierie sociale (vecteur 1)                  |
| DNSSEC signé au niveau de la zone      | Altérations en cours de route et fausses réponses |
| Inventaire + scanner de dangling DNS   | Piratage de sous-domaine (vecteur 4)            |
| Renouvellement 5-10 ans + auto-renouv. | Expiration accidentelle (vecteur 5)             |
| Alertes sur changements de contact/NS  | Les cinq (vous êtes prévenu à temps)            |

Si vous êtes responsable d'un domaine et que vous ne pouvez pas cocher chaque ligne, le travail de l'attaquant s'en trouve considérablement facilité.

## Comment Namefi change la donne

La plupart des contrôles mentionnés ci-dessus existent en tant que fonctionnalités chez un registrar, un fournisseur DNS ou un outil de gestion, et la sécurité dépend du compte le plus vulnérable. Namefi convertit la relation du titulaire en jetons (tokens) sur la blockchain ([on-chain](/fr/glossary/on-chain/)), ce qui signifie que l'enregistrement qui fait autorité quant à savoir *qui possède ce nom* vit en dehors de la base de données clients d'un registrar unique. Un agent du support d'un quelconque fournisseur ne peut pas discrètement modifier la propriété sans une transaction signée que le propriétaire légitime doit approuver. Le registrar opère toujours la délégation technique, mais la couche de *contrôle* est déplacée vers un endroit où l'ingénierie sociale ne fonctionne pas.

Ce n'est pas un substitut complet aux contrôles du tableau ci-dessus — vous avez toujours besoin de DNSSEC, vous avez toujours besoin d'une 2FA chez votre fournisseur DNS, et vous devez toujours renouveler vos domaines. Mais cela élimine purement et simplement le vecteur de piratage à fort impact le plus courant (vecteur 1) du modèle de menace.

## Sources et lectures complémentaires

- ICANN — [Portée de la Politique de résolution des litiges liés aux transferts (TDRP)](https://www.icann.org/en/contracted-parties/consensus-policies/uniform-domain-name-dispute-resolution-policy/domain-name-dispute-resolution-policies-25-02-2012-en#:~:text=The%20Transfer%20Dispute%20Resolution%20Policy%20(TDRP)%20applies%20to%20transactions%20in%20which%20a%20domain%2Dname%20holder%20transfers%20or%20attempts%20to%20transfer%20a%20domain%20name%20to%20a%20new%20registrar.).
- IETF — [RFC DNSSEC 4033/4034/4035](https://datatracker.ietf.org/doc/html/rfc4033) et [RFC 8901 sur le DNSSEC multi-signataires](https://www.rfc-editor.org/rfc/rfc8901#:~:text=The%20central%20requirement%20for%20both%20of%20the%20multiple%2Dsigner%20models%20is%20to%20ensure%20that%20the%20ZSKs%20from%20all%20providers%20are%20present%20in%20each%20provider's%20apex%20DNSKEY%20RRset.).
- CISA — [Directives sur l'authentification multifacteur](https://www.cisa.gov/secure-our-world/turn-mfa).
- Detectify Labs — [Rapport sur la prise de contrôle hostile de sous-domaines](https://labs.detectify.com/2014/10/21/hostile-subdomain-takeover-using-herokugithubdesk-more/).
- Verisign — [Verrouillage du registre (Registry lock) pour le .com/.net](https://www.verisign.com/en_US/channel-resources/domain-registry-products/registry-lock/index.xhtml).