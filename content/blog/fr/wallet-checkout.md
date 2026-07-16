---
title: "Payer ses noms de domaine avec un portefeuille crypto : aucun compte requis"
date: '2026-07-10'
language: 'fr'
tags: ['ai-agents', 'payments']
authors: ['fenwei-bian']
editors: ['victor-zhou']
translators: ['alan-machin']
draft: false
format: explainer
ogImage: ../../assets/wallet-checkout-og.jpg
description: "Découvrez comment le paiement signé par portefeuille de Namefi permet à un agent IA d'acheter un domaine en crypto, sans compte : parcours, modèle de sécurité et politiques de dépenses."
keywords: ["paiement de domaine en crypto", "paiement par portefeuille pour enregistrer un domaine", "acheter un domaine avec un portefeuille crypto sans compte", "payer un domaine en usdc", "agent IA paiement domaine crypto", "enregistrement de domaine x402", "eip-3009 transferwithauthorization", "bureau d'enregistrement acceptant les cryptomonnaies", "paiement signé par portefeuille", "namefi x402", "paiements agentiques", "achat de domaine en stablecoin", "enregistrement de domaine sans compte", "signature de portefeuille eip-712"]
relatedArticles:
  - /fr/blog/ai-agent-register/
  - /fr/blog/claude-mcp-domains/
  - /fr/blog/cf-namecom-namefi/
  - /fr/blog/namefi-mcp/
  - /fr/blog/agent-own-domain/
relatedTopics:
  - /fr/topics/domain-tokenization/
  - /fr/topics/web3-foundations/
relatedSeries:
  - /fr/series/blockchain-concepts/
  - /fr/series/tokenize-your-com/
relatedGlossary:
  - /fr/glossary/x402/
  - /fr/glossary/wallet/
  - /fr/glossary/stablecoin/
  - /fr/glossary/private-key/
  - /fr/glossary/tokenized-domain/
---

Toute affirmation selon laquelle « un agent IA peut acheter un domaine pour vous » finit par buter sur le même obstacle : comment l'agent paie-t-il concrètement ? Une carte bancaire suppose qu'une personne soit présente pour saisir des chiffres dans un formulaire, passer un contrôle antifraude et confirmer un code à usage unique envoyé sur un téléphone. Un [Agent IA](/fr/glossary/ai-agent/) ne dispose d'aucun de ces éléments. La solution de Namefi est un parcours de paiement qui ne nécessite ni carte, ni moyen de paiement enregistré, ni même compte Namefi : il suffit d'un [Portefeuille](/fr/glossary/wallet/) crypto qui signe le paiement sur-le-champ. Cet article examine en détail le fonctionnement réel de ce parcours, ce que le mécanisme de signature permet ou non à un agent de faire, et les cas dans lesquels il vaut mieux choisir la facturation par clé API.

## Pourquoi le paiement est la partie la plus difficile du commerce agentique

La recherche et la vérification des prix n'ont jamais constitué la principale difficulté lorsqu'il s'agit de permettre à un agent d'effectuer des achats. Ce sont des appels en lecture seule : aucune autorisation n'est nécessaire et une erreur de l'agent n'entraîne aucun enjeu financier. Le paiement est différent, car c'est l'unique étape où une erreur coûte réellement de l'argent, et tous les systèmes de paiement aujourd'hui largement utilisés partent du principe qu'une personne autorise le débit.

Une carte enregistrée en est l'exemple le plus évident. La facturation par carte enregistrée consiste à remettre à un prestataire de paiement un jeton qui pourra être débité ultérieurement, à l'initiative du marchand, sans que le titulaire de la carte ait à prouver de nouveau son accord au moment du débit. Cela convient à un abonnement auquel vous faites confiance pour vous facturer chaque mois. C'est moins adapté à un processus autonome : quiconque détient le jeton de la carte enregistrée peut la débiter, et la seule véritable protection consiste à faire confiance au logiciel pour qu'il ne l'utilise pas abusivement, ou à constater l'abus plus tard sur un relevé. Il est impossible de confier à un agent une carte enregistrée qui ne pourrait servir qu'à payer des enregistrements de domaines jusqu'à $50 : la carte ignore à quoi elle est destinée.

[Qu’est-ce qu’un bureau d’enregistrement de domaines conçu pour les agents ?](/fr/blog/agent-native/) explique plus largement que le paiement est l'un des éléments indispensables pour qu'un service soit réellement utilisable par un agent, au-delà de la simple présence d'une API. Le paiement par portefeuille crypto de Namefi apporte une réponse concrète à cette exigence : au lieu d'utiliser un moyen d'autorisation permanent qu'un service peut employer pour effectuer un débit quand bon lui semble, chaque paiement repose sur une signature produite par le portefeuille pour une transaction unique, à un prix précis, et pour rien d'autre.

## La réponse de Namefi : paiement signé par portefeuille, sans création de compte

L'enregistrement habituel d'un domaine sur Namefi utilise une [clé API](https://namefi.io/api-key) dont les dépenses sont débitées d'un solde NFSC (Namefi Service Credit) approvisionné, comme l'explique [Comment enregistrer un domaine avec votre Agent IA sur Namefi](/fr/blog/ai-agent-register/). Ce parcours nécessite un compte : quelqu'un génère une clé depuis un portefeuille, approvisionne un solde, puis chaque enregistrement est débité de ce solde par l'intermédiaire de la clé.

Le parcours signé par portefeuille contourne entièrement ces étapes. D'après la documentation lisible par machine publiée par Namefi sur les paiements par portefeuille, le portefeuille d'un agent peut payer directement en [USDC](/fr/glossary/stablecoin/), sans détenir de compte Namefi ni de clé API : le portefeuille de l'acheteur signe une autorisation de paiement et l'enregistrement est finalisé dès réception de cette signature. Rien n'est à créer au préalable et aucune autorisation permanente ne peut être détournée ultérieurement : le portefeuille n'intervient qu'au moment de la signature.

Namefi documente trois manières de produire cette signature avec un portefeuille, détaillées ci-dessous : le protocole [x402](/fr/glossary/x402/) (le parcours principal et l'objet central de ce guide), une variante en défi-réponse du Machine Payable Protocol (MPP) et une méthode manuelle de signature EIP-712 pour les portefeuilles qui n'utilisent aucun de ces deux raccourcis.

## Le parcours x402, étape par étape

x402 est une norme ouverte, soutenue notamment par Cloudflare, AWS et Stripe, qui réactive le code de statut HTTP `402 Payment Required`, longtemps resté inutilisé, afin de demander un paiement on-chain de manière structurée au sein d'une requête ordinaire, plutôt que de rediriger l'utilisateur vers une page de paiement distincte. Namefi l'implémente sur son point de terminaison d'enregistrement de domaines :

1. **Requête sans paiement.** L'agent envoie une simple requête `GET` au point de terminaison `/x402/domain/{domainName}` de Namefi, sans joindre de paiement puisqu'il ne connaît pas encore le prix.
2. **Réponse HTTP 402 avec le prix.** Namefi répond `402 Payment Required` et inclut les options de paiement dans le corps de la réponse : le réseau, l'actif accepté (USDC) et le montant. C'est ce qui distingue x402 d'une erreur ordinaire : au lieu d'indiquer simplement « non », le statut 402 fournit au client tout ce dont il a besoin pour construire un paiement valide.
3. **Le portefeuille signe un `transferWithAuthorization` EIP-3009.** Plutôt que d'envoyer une transaction blockchain séparée et d'attendre sa confirmation, le portefeuille produit une signature conforme à l'[EIP-3009](https://eips.ethereum.org/EIPS/eip-3009), une norme Ethereum conçue spécifiquement pour les transferts de jetons autorisés par signature. La fonction `transferWithAuthorization` de l'EIP-3009 permet au détenteur d'un jeton de signer un message qui autorise, uniquement pendant une fenêtre temporelle donnée (`validAfter` / `validBefore`), le transfert d'un montant déterminé vers un destinataire précis. Un tiers peut ensuite soumettre ce message sur la blockchain. La documentation de Namefi indique clairement que cette étape ne requiert ni compte Namefi ni signature EIP-712 préalable : le portefeuille signe simplement une autorisation autonome de transfert d'USDC.
4. **Nouvelle émission de la requête avec un en-tête de paiement.** L'agent renvoie la requête d'origine, cette fois avec un en-tête `X-PAYMENT` contenant l'autorisation signée.
5. **Vérification, règlement et enregistrement.** Namefi vérifie la signature, lance le processus d'enregistrement du domaine et règle le paiement : les USDC sont transférés depuis le portefeuille de l'acheteur, puis l'enregistrement se poursuit comme il le ferait par le parcours avec clé API. Par défaut, le domaine est notamment enregistré sous forme de [NFT](https://eips.ethereum.org/EIPS/eip-721), autrement dit de [Domaine Tokenisé](/fr/glossary/tokenized-domain/), dans le même portefeuille que celui qui a payé.

À aucun moment cette séquence n'exige que l'agent crée un compte Namefi, conserve un moyen d'autorisation permanent que Namefi pourrait réutiliser sans nouvelle autorisation ou renonce à la garde des fonds avant l'instant précis du paiement. La signature prouve uniquement que le portefeuille a autorisé ce transfert d'USDC particulier, pour ce montant et pendant une fenêtre temporelle limitée.

## La variante en défi-réponse MPP

x402 est le parcours principal, mais Namefi en documente aussi un second pour les portefeuilles ou les frameworks d'agents qui suivent un autre modèle de paiement : le Machine Payable Protocol (MPP). Sa structure est l'inverse de celle de x402 : un défi-réponse au lieu d'une simple réponse 402.

1. La première requête envoyée au point de terminaison protégé renvoie de nouveau `402 Payment Required`, mais contient cette fois un **défi signé** plutôt qu'un simple devis.
2. Le client signe ce défi avec le portefeuille payeur, généralement par l'intermédiaire de l'outil en ligne de commande `mppx` de Namefi, conçu spécifiquement pour prendre en charge cette étape de signature.
3. Le client renvoie la requête d'origine en joignant la signature obtenue dans un en-tête `Authorization`.

Le résultat est identique à celui de x402 : un paiement par requête, signé par portefeuille et sans moyen d'autorisation permanent, mais présenté comme un échange de défi signé plutôt que comme une simple indication de prix dans une réponse 402. Le choix dépend des protocoles que les outils de paiement de l'agent savent déjà utiliser ; le point de terminaison de Namefi prend en charge les deux méthodes.

## Le parcours manuel EIP-712

Pour les portefeuilles ou les scripts qui n'utilisent aucun de ces deux raccourcis, Namefi propose une méthode de signature de plus bas niveau et entièrement manuelle, fondée sur la signature de données typées [EIP-712](https://eips.ethereum.org/EIPS/eip-712), la même norme sur laquelle repose l'EIP-3009. Une requête ainsi signée comporte trois en-têtes — `x-namefi-signer` (l'adresse du portefeuille signataire), `x-namefi-signature` (la signature encodée en hexadécimal) et `x-namefi-eip712-type` (le schéma de données typées qui a servi à produire la signature) — et enveloppe sa charge utile dans une structure contenant un `payloadType`, le `payload` lui-même, un `timestamp` et un `nonce`.

Deux éléments sont essentiels pour la sécurité de ce parcours manuel : **les signatures expirent après 300 secondes et les nonces sont à usage unique.** Une fois les 300 secondes écoulées, ou dès qu'une requête utilisant le nonce a été acceptée, une signature interceptée ne peut plus être rejouée avec succès. La documentation de Namefi précise également que les définitions de types EIP-712 en vigueur doivent être récupérées depuis ses points de terminaison `/v-next/eip712/` au moment de la requête et non codées en dur dans une intégration, car le schéma exact auquel une signature doit correspondre peut évoluer.

Namefi documente aussi la signature par portefeuille de smart contract selon cette méthode : un compte externe (EOA) approuvé peut signer au nom d'un portefeuille de smart contract conformément à l'ERC-1271 ou à la norme EIP-7702 plus récente, à condition que le contrat implémente une vérification `approvedSigners(address)` que l'API puisse contrôler.<!-- TODO : à confirmer — quelle est la fréquence d'utilisation réelle de ce parcours pour portefeuilles de smart contract par rapport à un portefeuille EOA standard -->

## Le modèle de sécurité : ce que l'agent peut faire ou non

Il est important de décrire précisément les limites qu'impose réellement ce mécanisme de signature, sans lui attribuer une garantie plus forte que celle qu'il fournit.

**Ce qu'il limite.** Chaque parcours exige que le portefeuille signe la requête en cours au lieu de remettre à Namefi un identifiant permanent. Les contrôles anti-rejeu diffèrent selon le protocole : dans le parcours manuel EIP-712, la signature expire après 300 secondes et consomme un nonce à usage unique ; x402 utilise une autorisation EIP-3009 liée à un montant et à un destinataire précis, bornée par `validAfter` / `validBefore` et protégée par un nonce ; le client MPP signe le défi émis par le serveur, de sorte que l'expiration et les contrôles anti-rejeu sont ceux que précise ce défi. Le portefeuille n'accorde jamais à Namefi une autorisation permanente de déclencher ultérieurement d'autres débits de son propre chef. À l'inverse, une fois qu'un marchand détient le jeton de votre carte enregistrée, rien dans ce jeton ne limite ce qu'il pourra débiter le mois suivant, ni n'empêche un système compromis de le réutiliser. La clé privée du portefeuille ne le quitte jamais dans aucun de ces parcours : l'agent demande au portefeuille de produire une signature pour une requête précise, et l'opération ne va pas au-delà.

**Ce qu'il ne limite pas à lui seul.** La documentation de Namefi ne décrit aucun plafond de dépense en dollars intégré et appliqué par le protocole à chaque transaction : les contrôles d'expiration et anti-rejeu propres à chaque protocole limitent quand et comment une autorisation peut être réutilisée, pas le montant maximal qu'une requête signée peut autoriser.<!-- TODO : à confirmer avec l'équipe — le point de terminaison x402/MPP de Namefi impose-t-il un montant de paiement maximal côté serveur indépendamment de ce que le client demande à signer ? --> En pratique, les règles de dépense d'un agent sont appliquées en dehors de ce mécanisme : elles dépendent de la quantité d'USDC que vous placez dans le portefeuille et de la couche de règles — un portefeuille [Multi-signature (Multi-sig)](/fr/glossary/multi-sig/) exigeant une seconde approbation, ou une confirmation humaine avant que l'agent puisse signer — que vous placez entre l'agent et la [Clé Privée](/fr/glossary/private-key/) du portefeuille. [Qu’est-ce qu’un bureau d’enregistrement de domaines conçu pour les agents ?](/fr/blog/agent-native/) et [Comment enregistrer un domaine avec votre Agent IA sur Namefi](/fr/blog/ai-agent-register/) abordent le même point sous l'angle des garde-fous : ne déposez dans le portefeuille qu'une somme que vous accepteriez de voir dépensée par un processus sans surveillance et déterminez à l'avance les étapes qui nécessitent une approbation humaine.

Cette combinaison — aucune autorisation permanente, une autorisation limitée à chaque transaction et le financement du portefeuille comme plafond pratique des dépenses — crée un profil de risque réellement différent de celui d'une carte enregistrée, plutôt qu'une simple version crypto du même système. Un numéro de carte divulgué ou un jeton de facturation compromis peut être débité à répétition jusqu'à ce que quelqu'un s'en aperçoive et l'annule. Une autorisation de paiement interceptée est rejetée dès que sa propre condition d'expiration ou d'anti-rejeu est remplie : le parcours manuel EIP-712 la rejette après 300 secondes ou dès que son nonce est consommé ; l'autorisation EIP-3009 de x402 est rejetée en dehors de `validAfter` / `validBefore` ou après l'utilisation de son nonce ; et une autorisation MPP suit les conditions d'expiration et d'anti-rejeu encodées dans son défi signé.

## Quand choisir plutôt la facturation par clé API ou par NFSC

Le parcours signé par portefeuille convient lorsque l'objectif même est qu'aucun compte n'existe avant l'achat : pour un script entièrement autonome, pour un agent qui agit au nom de quelqu'un d'autre sans identifiants de connexion partagés ou lorsque l'on préfère conserver un portefeuille crypto comme seule identité. Il ne s'agit pas nécessairement du meilleur choix dans toutes les situations.

La facturation par clé API débitée d'un solde NFSC approvisionné, détaillée dans [Comment enregistrer un domaine avec votre Agent IA sur Namefi](/fr/blog/ai-agent-register/), est plus adaptée lorsqu'un agent enregistre régulièrement des domaines et qu'un solde préfinancé et consultable est préférable à la signature d'un nouveau paiement à chaque opération ; lorsque l'opérateur souhaite consulter toutes les dépenses dans un seul tableau de bord plutôt que de les reconstituer à partir des transferts on-chain ; ou lorsque le client sait conserver de manière fiable une valeur d'en-tête, mais ne dispose d'aucun moyen simple de conserver une clé privée et de signer avec elle. Une fois le paiement réglé, les deux parcours conduisent aux mêmes opérations d'enregistrement et de DNS : le choix porte sur la méthode d'autorisation, pas sur les domaines que vous pourrez enregistrer ou gérer par la suite.

## Questions fréquentes

### Ai-je besoin d'un compte Namefi pour payer avec un portefeuille crypto ?
Non. Les parcours x402 et MPP règlent tous deux l'enregistrement d'un domaine au moyen d'un paiement signé par portefeuille, sans compte Namefi et sans clé API créée au préalable. Une clé API est uniquement nécessaire pour la facturation débitée d'un solde NFSC.

### Quelle cryptomonnaie Namefi accepte-t-il pour le paiement par portefeuille ?
L'USDC. Le point de terminaison x402 de Namefi établit le prix et règle spécifiquement le paiement en USDC, ce qui évite les fluctuations qu'un actif volatil comme l'ETH pourrait connaître entre l'établissement du prix et le règlement du paiement.

### Signer un paiement par portefeuille revient-il à donner ma clé privée à un agent ?
Non : le portefeuille produit la signature sans jamais exposer la clé privée elle-même. L'agent, ou l'outil qu'il appelle, demande au portefeuille de signer une autorisation précise et limitée ; la clé reste dans le portefeuille pendant toute l'opération.

### Quelqu'un peut-il réutiliser une signature de paiement que j'ai produite précédemment ?
Une signature interceptée peut rester utilisable jusqu'à ce que son propre contrôle d'expiration ou d'anti-rejeu la rejette ; les trois parcours ne partagent pas une règle universelle. Dans le parcours manuel EIP-712, les signatures expirent après 300 secondes et chaque nonce ne peut être utilisé qu'une seule fois. Dans le parcours x402, l'autorisation EIP-3009 n'est valide que pendant sa fenêtre `validAfter` / `validBefore`, et son nonce ne peut pas être utilisé deux fois. MPP utilise un défi signé : ses conditions d'expiration et d'anti-rejeu doivent donc être vérifiées dans ce défi, sans présumer qu'elles correspondent à celles des deux autres parcours.

### Le domaine est-il automatiquement tokenisé lorsque je paie de cette façon ?
Oui, par défaut : le domaine enregistré est frappé sous forme de NFT dans le même portefeuille que celui qui a payé. Il s'agit du même comportement de tokenisation que pour le parcours par clé API, sauf si un autre portefeuille destinataire est précisé. Consultez [Cloudflare vs Name.com vs Namefi : bureaux d’enregistrement conçus pour les agents](/fr/blog/cf-namecom-namefi/) pour comparer cette approche à celle des bureaux d'enregistrement qui ne proposent ni paiement natif par portefeuille ni propriété tokenisée.

### Le paiement par portefeuille est-il plus sûr qu'une carte enregistrée ?
Il limite un autre ensemble de risques plutôt qu'il ne supprime tout risque. Aucun identifiant permanent ne peut être réutilisé indéfiniment par un système compromis, et chaque paiement exige une nouvelle signature propre à la requête. Les contrôles anti-rejeu diffèrent : le parcours manuel EIP-712 utilise une expiration de 300 secondes et un nonce à usage unique ; l'autorisation EIP-3009 de x402 utilise `validAfter` / `validBefore` et un nonce ; MPP suit les conditions de son défi signé. Aucun de ces contrôles ne plafonne le montant qu'une requête signée peut autoriser ; la limite pratique des dépenses d'un agent dépend donc toujours de la somme dont vous approvisionnez le portefeuille et des règles d'approbation supplémentaires, comme une Multi-signature (Multi-sig), que vous lui imposez.

## Acheter un domaine avec un portefeuille sur Namefi

Si l'intérêt d'utiliser un agent est qu'aucun compte humain ne s'interpose entre lui et l'achat, le paiement signé par portefeuille de Namefi est précisément conçu à cette fin : un véritable enregistrement de domaine auprès d'un bureau d'enregistrement accrédité par l'ICANN, payé au moyen d'une seule autorisation USDC signée, dont la propriété tokenisée est déposée dans le portefeuille qui a effectué le paiement. Consultez le fonctionnement complet dans [namefi.io/web3/llms.txt](https://namefi.io/web3/llms.txt), ou commencez par la configuration générale présentée dans [Comment enregistrer un domaine avec votre Agent IA sur Namefi](/fr/blog/ai-agent-register/).

**[Rechercher et enregistrer un domaine sur Namefi](https://namefi.io).**

## Sources et lectures complémentaires

- Namefi — [namefi.io/web3/llms.txt](https://namefi.io/web3/llms.txt) (source principale sur le parcours x402, la variante en défi-réponse MPP, la méthode manuelle de signature EIP-712, les règles d'expiration des signatures et d'utilisation unique des nonces, ainsi que la signature par portefeuille de smart contract avec ERC-1271/EIP-7702)
- Namefi — [namefi.io/llms.txt](https://namefi.io/llms.txt) (parcours de facturation NFSC/clé API et renvoi vers la documentation sur les paiements par portefeuille ci-dessus)
- x402.org — [x402 : une norme de paiement conçue nativement pour Internet](https://x402.org) (le protocole de paiement ouvert fondé sur HTTP 402 que le parcours de Namefi met en œuvre)
- Ethereum — [EIP-3009 : transfert avec autorisation](https://eips.ethereum.org/EIPS/eip-3009) (la norme de signature qui sous-tend l'étape `transferWithAuthorization` ; bornage temporel `validAfter` / `validBefore` et nonces aléatoires à usage unique)
- Ethereum — [EIP-721 : norme de jeton non fongible](https://eips.ethereum.org/EIPS/eip-721) (la norme NFT sur laquelle repose la propriété tokenisée des domaines)
- Namefi — [Comment enregistrer un domaine avec votre Agent IA sur Namefi](/fr/blog/ai-agent-register/) (le parcours de facturation par clé API/NFSC et les recommandations générales sur les garde-fous)
- Namefi — [Cloudflare vs Name.com vs Namefi : bureaux d’enregistrement conçus pour les agents](/fr/blog/cf-namecom-namefi/) (comparaison du paiement natif par portefeuille entre les trois bureaux d'enregistrement destinés aux agents)
