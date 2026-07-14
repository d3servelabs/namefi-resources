---
title: "Un agent IA peut-il posséder un domaine ? WHOIS, garde et jetons"
date: '2026-07-10'
language: 'fr'
tags: ['ai-agents', 'domains', 'web3']
authors: ['namefiteam']
draft: false
format: faq
ogImage: ../../assets/agent-own-domain-og.jpg
description: "Le titulaire doit être une personne physique ou morale, mais la garde peut être déléguée. WHOIS, clés API et domaines tokenisés : explication du spectre de garde."
keywords: ["un agent ia peut-il posséder un domaine", "propriété de domaine agent ia", "qui est le titulaire quand une ia enregistre un domaine", "agent ia whois", "titulaire de domaine personne morale", "garde de domaine tokenisé", "portefeuille agent ia domaine nft", "spectre de garde domaine", "risque domaine détenu par agent", "exposition udrp agent ia", "déléguer un domaine à un agent ia", "domaine détenu dans un portefeuille", "recherche rdap agent ia", "propriété de domaine vs contrôle"]
relatedArticles:
  - /fr/blog/wallet-checkout/
  - /fr/blog/agents-buy-domains/
  - /fr/blog/ai-agent-register/
  - /fr/blog/cf-namecom-namefi/
  - /fr/blog/namefi-mcp/
relatedTopics:
  - /fr/topics/domain-tokenization/
  - /fr/topics/domain-security/
relatedSeries:
  - /fr/series/blockchain-concepts/
  - /fr/series/tokenize-your-com/
relatedGlossary:
  - /fr/glossary/registrant/
  - /fr/glossary/whois/
  - /fr/glossary/custodial-ownership/
  - /fr/glossary/tokenized-domain/
  - /fr/glossary/udrp/
---

« Mon agent IA peut-il posséder un domaine ? » Cette question revient constamment dès lors qu'un [Agent IA](/fr/glossary/ai-agent/) enregistre, renouvelle et gère des domaines pour le compte de quelqu'un — voir [Comment les agents IA achètent des domaines sans humain](/fr/blog/agents-buy-domains/) pour mesurer à quel point cette pratique est devenue courante en 2026. La réponse courte apparaît en tête ; le reste de cette page explique *pourquoi*, sous la forme des questions précises que les gens posent réellement, chacune pouvant être lue de manière autonome.

## Un agent IA peut-il légalement posséder un domaine ?

Pas en son propre nom. Le [Registrar Accreditation Agreement de 2013](https://www.icann.org/en/contracted-parties/accredited-registrars/registrar-accreditation-agreement/2013-registrar-accreditation-agreement-17-09-2013-en#:~:text=The%20Registered%20Name%20Holder%20with%20whom%20Registrar%20enters%20into%20a%20registration%20agreement%20must%20be%20a%20person%20or%20legal%20entity%20other%20than%20the%20Registrar) de l'[ICANN](/fr/glossary/icann/) — le contrat que tout bureau d'enregistrement accrédité par l'ICANN signe et applique — énonce directement que « le [titulaire de nom enregistré](/fr/glossary/registrant/) avec lequel le Registrar conclut un contrat d'enregistrement doit être une personne ou une entité juridique autre que le Registrar ». Un [Titulaire de domaine](/fr/glossary/registrant/) doit être une personne physique ou une entité juridique enregistrée : un particulier, une entreprise, une organisation à but non lucratif ou une administration. Un agent IA, en tant que logiciel, n'est ni l'un ni l'autre. L'agent lui-même ne peut donc jamais figurer comme titulaire dans l'enregistrement.

Ce que la règle n'exclut pas, c'est la délégation. Rien dans le RAA n'empêche une personne ou une organisation d'autoriser un agent à rechercher, enregistrer, renouveler ou gérer le DNS pour son compte, comme elle pourrait aujourd'hui autoriser un employé ou une automatisation. Le titulaire reste une personne juridique ; le *travail* d'exploitation du domaine peut être confié à un agent. Cette distinction — qui est nommé dans le registre et qui clique (ou appelle l'API) — est tout le sujet de cette page.

## Qui est le titulaire lorsqu'un agent IA enregistre un domaine ?

La personne ou l'entité qui détient le compte, finance l'achat et accepte les conditions du bureau d'enregistrement — jamais l'agent. Lorsqu'un agent appelle l'API d'un bureau d'enregistrement pour réserver un nom, il agit comme un outil sous l'autorisation de quelqu'un, dans le même cadre juridique qu'une personne utilisant un formulaire web, mais de façon automatisée. Les propres indications de l'ICANN aux titulaires précisent où cette responsabilité s'applique : « vous assumez l'entière responsabilité de l'enregistrement et de l'utilisation de votre nom de domaine », selon la page [Avantages et responsabilités des titulaires de l'ICANN](https://www.icann.org/resources/pages/benefits-2013-09-16-en#:~:text=You%20will%20assume%20sole%20responsibility%20for%20the%20registration%20and%20use%20of%20your%20domain%20name). Cette responsabilité incombe au titulaire du compte qui a mandaté l'agent, non au logiciel qui a exécuté l'appel.

C'est pourquoi tout flux crédible d'enregistrement par agent — y compris celui de [Namefi](https://namefi.io) — passe par une autorisation contrôlée par une personne ou une entité : une clé API liée à un compte approvisionné, ou un [Portefeuille](/fr/glossary/wallet/) dont quelqu'un contrôle la [Clé Privée](/fr/glossary/private-key/). Voir [Comment enregistrer un domaine avec votre agent IA sur Namefi](/fr/blog/ai-agent-register/) pour comprendre comment cette étape d'autorisation fonctionne en pratique.

## Que montre réellement un enregistrement WHOIS ou RDAP pour un domaine enregistré par un agent ?

Les mêmes champs que pour tout autre enregistrement : bureau d'enregistrement de référence, dates d'enregistrement et d'expiration et — sauf s'ils sont masqués par la confidentialité [WHOIS (et RDAP)](/fr/glossary/whois/), désormais appliquée par défaut par la plupart des bureaux d'enregistrement — le nom, l'organisation et les coordonnées du titulaire. Il n'existe aucun champ « enregistré par un agent IA », et aucune politique de l'ICANN n'en définit. [L'outil de recherche fondé sur RDAP de l'ICANN](https://lookup.icann.org) est la source faisant autorité pour vérifier l'enregistrement actuel d'un domaine précis ; il renvoie le même schéma, qu'un humain ait saisi le formulaire d'enregistrement ou qu'un agent ait appelé une API pour soumettre les mêmes données.

Concrètement, cela signifie qu'un observateur extérieur — titulaire de marque, chercheur en sécurité ou acheteur potentiel — ne peut pas savoir à partir du seul WHOIS/RDAP qu'un domaine a été enregistré par un agent. L'enregistrement identifie le titulaire légal. Ce qui a produit l'appel API qui l'a créé ne fait pas partie du modèle de données.

## Quelle est la différence entre un agent qui *exploite* un domaine et un agent qui le *possède* ?

Exploiter signifie que l'agent peut agir sur le domaine — le renouveler, modifier les enregistrements DNS, lancer un transfert — parce qu'il détient une autorisation ayant ce périmètre. Posséder, au seul sens qui ait un poids juridique, signifie être le titulaire déclaré selon la définition du RAA ci-dessus : une personne physique ou morale responsable devant le bureau d'enregistrement et les règles de l'ICANN. Un agent peut exploiter très largement un domaine — le [serveur MCP de Namefi](/fr/blog/namefi-mcp/) fournit précisément ce genre d'outils — sans jamais en être le propriétaire, de la même manière qu'un gestionnaire immobilier peut détenir des clés et demander des réparations sans détenir le titre de propriété du bâtiment.

C'est dans l'écart entre ces deux rôles que se situent la plupart des questions pratiques que les gens posent ; c'est pourquoi les sections suivantes l'abordent comme un spectre plutôt que par un simple oui ou non.

## Quel est le spectre de garde d'un domaine géré par un agent ?

Trois niveaux, chacun donnant progressivement à l'agent un contrôle plus direct tandis que le titulaire légal reste le même :

- **Accès au compte du bureau d'enregistrement.** L'agent (ou le script qui appelle l'API du bureau d'enregistrement pour son compte) utilise des identifiants liés au propre compte de la personne ou de l'organisation. Le champ du titulaire ne change jamais ; l'agent agit simplement dans un compte que quelqu'un possède déjà, comme le ferait aujourd'hui un partage d'accès.
- **Clé API.** Une autorisation limitée à l'API du bureau d'enregistrement, facturée sur un solde approvisionné, sans nécessairement partager l'accès complet au tableau de bord. [Namefi en émet](https://namefi.io/api-key) afin qu'un agent puisse rechercher, obtenir un prix et enregistrer sans toucher à une session de navigateur — voir [Comment enregistrer un domaine avec votre agent IA sur Namefi](/fr/blog/ai-agent-register/). Le titulaire reste celui dont le compte définit le périmètre de la clé.
- **[Domaine Tokenisé](/fr/glossary/tokenized-domain/) détenu dans un portefeuille.** L'enregistrement est frappé sous la forme d'un jeton On-Chain, et le [Portefeuille](/fr/glossary/wallet/) qui détient ce jeton — via un paiement [x402](/fr/glossary/x402/) signé par portefeuille ou une adresse de réception désignée — contrôle directement le chemin de transfert On-Chain du domaine, sans passer du tout par le tableau de bord d'un bureau d'enregistrement. Voir [Payer des domaines avec un portefeuille crypto : aucun compte nécessaire](/fr/blog/wallet-checkout/) pour le mécanisme qui permet de placer ainsi un domaine dans un portefeuille.

Chaque niveau est plus direct que le précédent, mais la question du titulaire légal posée plus haut ne change pas : la réponse est la même, quel que soit le niveau auquel l'agent opère.

## Que change la tokenisation d'un domaine ?

Tokeniser un domaine frappe un [NFT (Jeton Non Fongible)](/fr/glossary/nft/) qui constitue une couche de contrôle parallèle, On-Chain, au-dessus d'un enregistrement DNS réel, décrit plus en détail dans [Que sont les domaines tokenisés ?](/fr/blog/what-are-tokenized-domains/). Namefi, bureau d'enregistrement [accrédité par l'ICANN](/fr/glossary/icann/), conserve l'enregistrement sous-jacent réel et reconnu par l'ICANN tout en frappant le jeton de propriété dans le portefeuille indiqué par l'acheteur. La documentation de Namefi décrit l'enregistrement d'un domaine dont le jeton résultant est envoyé directement à une adresse `nftReceivingWallet` contrôlée par l'acheteur. Le domaine possède toujours un enregistrement WHOIS/RDAP et un bureau d'enregistrement de référence ; le jeton ajoute un moyen de transférer *le contrôle* de cet enregistrement de pair à pair, On-Chain, sans demande de transfert gérée par le bureau d'enregistrement.

La tokenisation ne redéfinit pas qui est autorisé à être titulaire. La norme [ERC-721 (norme NFT)](/fr/glossary/erc-721/) sur laquelle reposent les domaines tokenisés ne pose [aucune restriction sur le type d'adresse pouvant détenir un jeton](https://eips.ethereum.org/EIPS/eip-721) : toute adresse de portefeuille peut posséder un NFT, et la norme envisage explicitement que des contrats détiennent également des jetons. Il s'agit d'une règle concernant le jeton, non les règles de l'ICANN relatives au titulaire, qui se situent à la couche du bureau d'enregistrement au-dessus et exigent toujours que l'enregistrement sous-jacent remonte à une personne physique ou morale.

## Le portefeuille d'un agent IA peut-il réellement détenir un domaine tokenisé ?

Techniquement, oui, au sens étroit où un portefeuille n'est qu'une paire de clés et où rien dans la norme ERC-721 ni dans une transaction de frappe ne vérifie si la partie qui contrôle la clé privée est un humain, un script ou un processus autonome. Si un agent possède l'autorité de signature sur un portefeuille — sa propre clé ou une autorité déléguée sur celle de quelqu'un d'autre — ce portefeuille peut recevoir et détenir le NFT d'un domaine tokenisé exactement comme n'importe quel autre portefeuille.

La question de savoir si cet arrangement fait de l'*agent* le propriétaire dans un sens juridiquement pertinent reste véritablement ouverte, et nous ne pouvons pas la trancher ici. Aucune politique de l'ICANN, aucune décision de justice et aucune source que nous avons trouvée ne traite un agent IA — par opposition à la personne ou à l'entité qui contrôle son portefeuille — comme titulaire juridique de quoi que ce soit. Considérez « le portefeuille de l'agent détient le jeton » comme une description de la garde technique, non comme une conclusion juridique établie. Le cadrage plus prudent, soutenu par toutes les sources ci-dessus, est le suivant : le *contrôleur* du portefeuille — celui qui détient ou peut diriger la clé privée — est la partie qui a un véritable droit, et il est toujours attendu qu'il s'agisse d'une personne ou d'une entité, pas du logiciel lui-même.

## Que se passe-t-il si l'agent se comporte mal : peut-on verrouiller ou récupérer un domaine ?

Deux mécanismes de protection différents s'appliquent selon le niveau de garde, et ils n'offrent pas le même type de recours. Au niveau du bureau d'enregistrement, les règles de transfert de l'ICANN introduisent de la friction : un domaine ne peut généralement pas être transféré vers un nouveau bureau d'enregistrement dans les 60 jours suivant l'enregistrement initial, et un **verrouillage de 60 jours en cas de changement de titulaire** s'applique après une modification du nom, de l'organisation ou de l'adresse e-mail du titulaire, ces deux règles étant [documentées dans la FAQ de l'ICANN pour les titulaires](https://www.icann.org/resources/pages/name-holder-faqs-2017-10-10-en#:~:text=Another%20situation%20is%20if%20the%20domain%20name%20is%20subject%20to%20a%2060-day%20Change%20of%20Registrant%20lock). Ces fenêtres donnent au titulaire le temps de constater et de contester une modification non autorisée avant qu'elle ne soit définitive : une protection réelle, quoique limitée, contre un agent qui dérape sur un compte de bureau d'enregistrement standard ou une clé API.

Une fois qu'un domaine est tokenisé et que le NFT se trouve dans un portefeuille, ce filet de sécurité prend une autre forme. Un transfert On-Chain, une fois confirmé, est généralement définitif : aucun verrou du bureau d'enregistrement ne permet d'annuler un jeton envoyé à la mauvaise adresse. La défense pratique se déplace donc en amont, vers l'étendue de l'autorité du portefeuille de l'agent : une configuration de [Multi-signature (Multi-sig)](/fr/glossary/multi-sig/) exigeant un second signataire, ou le simple fait de ne pas donner à un agent une autorité permanente sur un portefeuille détenant des domaines tokenisés de valeur. C'est le même principe de garde-fou que celui appliqué aux paiements dans [Payer des domaines avec un portefeuille crypto](/fr/blog/wallet-checkout/#the-security-model-what-the-agent-can-and-cannot-do).

## La tokenisation d'un domaine supprime-t-elle l'exposition à l'UDRP ?

Non, et aucune des sources examinées ne suggère le contraire. Les obligations de l'[UDRP (Uniform Domain-Name Dispute-Resolution Policy)](/fr/glossary/udrp/) s'attachent à l'enregistrement DNS sous-jacent reconnu par l'ICANN, qu'un domaine tokenisé conserve. La tokenisation modifie qui peut déplacer le domaine et comment, non l'application du droit des marques ou de la politique de règlement des litiges de l'ICANN. Une analyse sur les domaines détenus par des agents expose clairement le risque : « si un agent enregistre un domaine qui s'avère être en conflit avec une marque, aucun humain ne répondra à une plainte UDRP » si personne ne surveille ce qu'un agent enregistre avec ses identifiants, [comme l'explique plus en détail Comment les agents IA achètent des domaines sans humain](/fr/blog/agents-buy-domains/#guardrails-no-human-required-still-needs-a-human-set-policy). Une plainte UDRP est déposée contre le titulaire déclaré — quelle que soit cette personne physique ou morale —, non contre l'agent qui a simplement soumis l'enregistrement.

## Alors, qui est réellement responsable si le domaine d'un agent crée un problème juridique ?

Le titulaire déclaré : la personne physique ou morale dont le compte, la clé API ou le portefeuille a autorisé l'enregistrement — jamais le modèle IA lui-même. C'est le fil conducteur de toutes les questions ci-dessus : WHOIS/RDAP désigne une personne juridique, le RAA l'exige, les protections de verrouillage de transfert de l'ICANN et l'exposition à l'UDRP s'attachent toutes deux à ce même nom, et la tokenisation modifie la mécanique du contrôle sans toucher à la personne responsable en dessous. « L'agent possède le domaine » est un raccourci utile pour « le contrôle du domaine a été délégué à l'agent ». Il faut le traiter comme un raccourci, non comme un fait juridique établi, car l'étendue possible de cette délégation et la question de savoir si une juridiction considérera un jour un agent autonome comme autre chose qu'un outil dont l'opérateur est responsable restent sans réponse. Avant de confier à un agent une autorité d'achat ou de garde à l'un quelconque des niveaux ci-dessus, décidez explicitement qui est le titulaire légal.

## Enregistrer et tokeniser avec un véritable titulaire inscrit

[Namefi](https://namefi.io) est conçu exactement pour ce type de question : un enregistrement réel [accrédité par l'ICANN](/fr/glossary/icann/), dont le champ titulaire est traité comme l'exige l'ICANN, et une couche optionnelle de [Domaine Tokenisé](/fr/glossary/tokenized-domain/) qui place le contrôle On-Chain dans le portefeuille de votre choix — y compris un portefeuille qu'un agent exploite dans les garde-fous que vous avez définis. Commencez par [Comment enregistrer un domaine avec votre agent IA sur Namefi](/fr/blog/ai-agent-register/), ou passez directement au paiement signé par portefeuille dans [Payer des domaines avec un portefeuille crypto](/fr/blog/wallet-checkout/).

**[Rechercher et enregistrer un domaine sur Namefi](https://namefi.io).**

## Sources et lectures complémentaires

- ICANN — [Registrar Accreditation Agreement 2013, §3.7.7](https://www.icann.org/en/contracted-parties/accredited-registrars/registrar-accreditation-agreement/2013-registrar-accreditation-agreement-17-09-2013-en#:~:text=The%20Registered%20Name%20Holder%20with%20whom%20Registrar%20enters%20into%20a%20registration%20agreement%20must%20be%20a%20person%20or%20legal%20entity%20other%20than%20the%20Registrar) (« doit être une personne ou une entité juridique autre que le Registrar » — règle centrale d'éligibilité du titulaire)
- ICANN — [Avantages et responsabilités des titulaires](https://www.icann.org/resources/pages/benefits-2013-09-16-en#:~:text=You%20will%20assume%20sole%20responsibility%20for%20the%20registration%20and%20use%20of%20your%20domain%20name) (« vous assumez l'entière responsabilité de l'enregistrement et de l'utilisation de votre nom de domaine »)
- ICANN — [FAQ pour les titulaires : transférer votre nom de domaine](https://www.icann.org/resources/pages/name-holder-faqs-2017-10-10-en#:~:text=Another%20situation%20is%20if%20the%20domain%20name%20is%20subject%20to%20a%2060-day%20Change%20of%20Registrant%20lock) (verrouillages de transfert de 60 jours après un nouvel enregistrement ou un changement de titulaire)
- ICANN — [ICANN Lookup (lookup.icann.org)](https://lookup.icann.org) (outil officiel fondé sur RDAP pour consulter l'enregistrement WHOIS/RDAP actuel d'un domaine)
- Ethereum — [EIP-721 : norme de jeton non fongible](https://eips.ethereum.org/EIPS/eip-721) (aucune restriction sur l'adresse, y compris un contrat, qui peut détenir un jeton)
- Namefi — [namefi.io/llms.txt](https://namefi.io/llms.txt) (référence sur la tokenisation et la frappe vers `nftReceivingWallet` — source des affirmations sur le produit Namefi dans cet article)
- dev.to — [Comment les agents IA peuvent acheter leurs propres noms de domaine, et pourquoi c'est important](https://dev.to/purpleflea/how-ai-agents-can-buy-their-own-domain-names-and-why-this-matters-1l4j#:~:text=If%20an%20agent%20registers%20a%20domain%20that%20turns%20out%20to%20be%20a%20trademark%20conflict%2C%20there%27s%20no%20human%20to%20respond%20to%20a%20UDRP%20complaint) (exposition à l'UDRP lorsqu'aucune personne ne surveille les enregistrements d'un agent)
- Namefi — [Comment les agents IA achètent des domaines sans humain (2026)](/fr/blog/agents-buy-domains/) (les garde-fous et l'angle revendeur sur lesquels s'appuie cet article)
- Namefi — [Payer des domaines avec un portefeuille crypto : aucun compte nécessaire](/fr/blog/wallet-checkout/) (mécanique de garde signée par portefeuille et garde-fous de politique de dépense)
