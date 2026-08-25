---
title: "Qu'est-ce que le paiement agentique, et pourquoi tout le monde se précipite pour le proposer ?"
date: '2026-08-13'
language: 'fr'
tags: ['ai-agents', 'payments', 'explainer']
authors: ['aileen-wright']
editors: ['victor-zhou']
translators: ['alan-machin']
draft: false
format: explainer
ogImage: ../../assets/what-is-agent-payment-og.jpg
description: "Le paiement agentique permet aux agents IA de dépenser avec une autorité limitée et révocable. Plongée dans le portefeuille Link de Stripe pour les agents, les cartes agent de Mercury, et la ruée de 2025-2026."
keywords: ["qu'est-ce que le paiement agentique", "paiements agentiques expliqués", "commerce agentique", "portefeuille Stripe Link pour les agents", "Stripe Issuing pour les agents", "cartes agent Mercury", "gestion des dépenses Mercury", "Agentic Commerce Protocol", "protocole AP2 de Google", "Mastercard Agent Pay", "Visa Intelligent Commerce", "carte à usage unique pour agent IA", "jeton de paiement partagé", "limites de dépenses des agents IA", "paiements agentiques x402"]
relatedArticles:
  - /fr/blog/wallet-checkout/
  - /fr/blog/agents-buy-domains/
  - /fr/blog/state-of-agentic/
  - /fr/blog/agent-native/
  - /fr/blog/ai-agent-register/
relatedTopics:
  - /fr/topics/web3-foundations/
  - /fr/topics/domain-tokenization/
relatedSeries:
  - /fr/series/blockchain-concepts/
  - /fr/series/domain-apocalypse/
relatedGlossary:
  - /fr/glossary/ai-agent/
  - /fr/glossary/x402/
  - /fr/glossary/stablecoin/
  - /fr/glossary/wallet/
  - /fr/glossary/tokenized-domain/
---

En l'espace de seize mois, les deux principaux réseaux de cartes, Google, OpenAI et Stripe ont tous annoncé ou déployé une infrastructure pour la même chose : permettre à un [Agent IA](/fr/glossary/ai-agent/) de dépenser de l'argent. Mastercard a [annoncé Agent Pay](https://www.mastercard.com/global/en/news-and-trends/press/2025/april/mastercard-unveils-agent-pay-pioneering-agentic-payments-technology-to-power-commerce-in-the-age-of-ai.html#:~:text=The%20program%20introduces%20Mastercard%20Agentic%20Tokens) le 29 avril 2025. Visa a dévoilé [Intelligent Commerce](https://usa.visa.com/about-visa/newsroom/press-releases.releaseId.21361.html#:~:text=browse%2C%20select%2C%20purchase%20and%20manage%20on%20their%20behalf) le lendemain. Google a publié son [Agent Payments Protocol (AP2)](https://cloud.google.com/blog/products/ai-machine-learning/announcing-agents-to-payments-ap2-protocol#:~:text=breaks%20this%20fundamental%20assumption) avec plus de 60 organisations partenaires en septembre 2025. Ce même mois, OpenAI a activé [Instant Checkout dans ChatGPT](https://openai.com/index/buy-it-in-chatgpt/#:~:text=powered%20by%20the%20Agentic%20Commerce%20Protocol%2C%20built%20with%20Stripe). Et en avril 2026, Stripe a lancé [le portefeuille Link pour les agents](https://stripe.com/blog/giving-agents-the-ability-to-pay#:~:text=The%20agent%20never%20gets%20access%20to%20your%20raw%20payment%20credentials), un portefeuille grand public qu'un agent peut emprunter le temps d'un achat. Même Mercury, une plateforme bancaire pour entreprises, met désormais en avant sa [proposition de gestion des dépenses](https://mercury.com/spend-management#:~:text=cards%20for%20teams%20and%20agents) avec « des cartes pour les équipes **et les agents** ».

Cet article explique ce qu'est réellement le « paiement agentique », détaille deux mises en œuvre instructives — le portefeuille côté consommateur de Stripe et les cartes agent côté entreprise de Mercury — puis examine pourquoi tant d'entreprises ont décidé, presque simultanément, qu'elles ne pouvaient pas se permettre de rester sur la touche.

## Ce que signifie réellement le « paiement agentique »

Le paiement agentique est une infrastructure qui permet à un agent logiciel de dépenser de l'argent au nom d'une personne ou d'une entreprise — avec une autorité **limitée** (ce montant, chez ce marchand, pour cet usage), **prouvable** (le marchand peut vérifier que l'agent était effectivement autorisé) et **révocable** (le propriétaire peut la couper), plutôt que l'instrument brutal consistant à confier à l'agent un numéro de carte brut.

C'est cette dernière clause qui fait toute la différence. Rien n'a jamais empêché quiconque de coller son numéro Visa dans le fichier de configuration d'un bot. Ce qui arrête la plupart des gens, c'est qu'un numéro de carte constitue une autorité non limitée : quiconque le détient peut débiter n'importe quoi, n'importe où, jusqu'à ce que vous le remarquiez et annuliez la carte. L'annonce d'AP2 par Google expose clairement le problème sous-jacent : les systèmes de paiement actuels partent généralement du principe [« qu'un humain clique directement sur "acheter" sur une surface de confiance »](https://cloud.google.com/blog/products/ai-machine-learning/announcing-agents-to-payments-ap2-protocol#:~:text=assume%20a%20human%20is%20directly%20clicking), et un agent autonome qui initie un paiement [« brise cette hypothèse fondamentale »](https://cloud.google.com/blog/products/ai-machine-learning/announcing-agents-to-payments-ap2-protocol#:~:text=breaks%20this%20fundamental%20assumption). AP2 formule cet écart en trois questions auxquelles chaque transaction agentique doit répondre : **autorisation** (l'utilisateur a-t-il accordé à l'agent l'autorité pour *cet* achat précis ?), **authenticité** (la requête de l'agent reflète-t-elle l'intention réelle de l'utilisateur ?) et **responsabilité** (qui assume la perte en cas de problème ?).

Chaque produit de ce secteur — programmes de jetons des réseaux de cartes, protocoles ouverts, portefeuilles, cartes agent — est une tentative de répondre à ces trois questions suffisamment bien pour que laisser un agent dépenser de l'argent devienne un geste normal et banal.

## Stripe : un portefeuille que votre agent peut emprunter, un achat à la fois

L'offre de Stripe, [annoncée le 29 avril 2026](https://stripe.com/blog/giving-agents-the-ability-to-pay#:~:text=Today%20we%E2%80%99re%20launching), est **le portefeuille Link pour les agents**, construit au-dessus d'une nouvelle couche **Issuing for agents**. Link est le portefeuille grand public de Stripe — le produit « enregistrez mes informations pour un paiement plus rapide » — dont la base de clients atteint, selon Stripe, [plus de 200 millions de consommateurs](https://stripe.com/blog/giving-agents-the-ability-to-pay#:~:text=more%20than%20200%20million%20consumers). Le parcours de l'agent fonctionne ainsi :

1. Le consommateur accorde à un agent l'accès à son portefeuille Link via un flux OAuth standard — le même schéma de consentement utilisé pour connecter n'importe quelle application tierce.
2. Lorsque l'agent souhaite acheter quelque chose, il crée une **demande de dépense** portant du contexte : nom du marchand, URL, montant, et une description lisible par un humain de ce qu'il achète et pourquoi.
3. Le consommateur examine et approuve la demande sur le web ou dans les applications mobiles de Link. Aujourd'hui, [chaque demande nécessite l'examen de la personne](https://stripe.com/blog/giving-agents-the-ability-to-pay#:~:text=each%20request%20requires%20the%20person%E2%80%99s%20review) avant que le moindre identifiant ne soit partagé ; Stripe indique que des limites de dépenses et une autonomie pré-approuvée sont prévues ensuite.
4. Une fois approuvée, l'agent reçoit soit une **carte à usage unique**, soit un **Shared Payment Token (SPT)** — un identifiant qui [peut être limité par des contrôles tels que le montant, la devise et le marchand](https://stripe.com/blog/giving-agents-the-ability-to-pay#:~:text=scoped%20with%20controls%20like%20amount%2C%20currency%2C%20and%20merchant). Comme le formule Stripe : [« L'agent n'a jamais accès à vos identifiants de paiement bruts. »](https://stripe.com/blog/giving-agents-the-ability-to-pay#:~:text=The%20agent%20never%20gets%20access%20to%20your%20raw%20payment%20credentials)

Cette conception mérite d'être examinée de près, car elle inverse le modèle de la carte enregistrée. Une carte enregistrée constitue une autorité permanente sur laquelle le marchand (ou l'agent) peut puiser encore et encore, limitée par des accords appliqués après coup plutôt que par l'identifiant lui-même ; une demande de dépense est, elle, un octroi d'autorité unique, créé au moment de l'achat, limité à cet achat, et caduc ensuite. Stripe expose aussi la couche sous-jacente — Issuing for agents — afin que les entreprises puissent construire leurs propres portefeuilles agentiques : cartes virtuelles à usage unique, stockage de fonds, permissions au niveau de la carte, surveillance des transactions et contrôles antifraude au moment de l'autorisation.

## Mercury : la carte d'entreprise rencontre l'agent

Le portefeuille de Stripe répond à la question côté consommateur — *comment laisser un agent d'achat dépenser mon argent ?* La [gestion des dépenses](https://mercury.com/spend-management#:~:text=cards%20for%20teams%20and%20agents) de Mercury répond à la version côté entreprise, et sa réponse est révélatrice : traiter les agents comme des employés.

Mercury décrit le produit comme une [« gestion des dépenses auto-appliquée, avec budgets intelligents, remboursements des employés et cartes pour les équipes et les agents »](https://mercury.com/spend-management#:~:text=cards%20for%20teams%20and%20agents). Les mécanismes relèvent de la boîte à outils classique de gestion des dépenses — [budgets et garde-fous limités à des usages précis](https://mercury.com/spend-management#:~:text=Set%20up%20budgets%20and%20guardrails%20to%20unblock%20your%20team%20and%20agents), plafonds par catégorie, suivi en temps réel, politiques qui s'appliquent d'elles-mêmes — étendus à des dépensiers non humains : les entreprises peuvent [émettre des cartes agent dédiées pour les transactions approuvées](https://mercury.com/spend-management#:~:text=Issue%20dedicated%20agent%20cards%20for%20approved%20transactions), chacune avec ses propres limites.

La page en fait même la démonstration : un agent remplit un formulaire de paiement avec « la carte agent de Jane », passe une commande publicitaire de 100 $, puis indique que la carte porte une limite de dépense de 1 000 $ par mois et que ses coordonnées n'ont servi que pour ce paiement — jamais stockées. Mercury Spend est [inclus pour tous les clients de la banque d'entreprise Mercury](https://mercury.com/spend-management#:~:text=included%20for%20all%20Mercury%20business%20banking%20customers), avec une version autonome prévue pour les équipes qui font affaire avec une autre banque.

Le cadrage compte davantage que la liste de fonctionnalités. Pour une entreprise, un agent qui dépense de l'argent n'est pas un problème de paiement exotique et nouveau — c'est un effectif. Il reçoit une carte, un budget, un objet, une limite mensuelle et une piste d'audit, exactement comme une nouvelle recrue dans le système financier. Là où Stripe a construit une boucle de consentement pour les consommateurs, Mercury a construit une case d'organigramme pour du logiciel.

## Seize mois d'annonces

En rassemblant la chronologie en un seul endroit, la ruée est difficile à manquer :

| Date | Entreprise | Ce qui a été annoncé |
|---|---|---|
| 29 avril 2025 | Mastercard | [Agent Pay](https://www.mastercard.com/global/en/news-and-trends/press/2025/april/mastercard-unveils-agent-pay-pioneering-agentic-payments-technology-to-power-commerce-in-the-age-of-ai.html#:~:text=The%20program%20introduces%20Mastercard%20Agentic%20Tokens) : Agentic Tokens ; les agents doivent être [enregistrés et vérifiés](https://www.mastercard.com/global/en/news-and-trends/press/2025/april/mastercard-unveils-agent-pay-pioneering-agentic-payments-technology-to-power-commerce-in-the-age-of-ai.html#:~:text=trusted%20AI%20agents%20to%20be%20registered%20and%20verified) pour effectuer des transactions |
| 30 avril 2025 | Visa | [Intelligent Commerce](https://usa.visa.com/about-visa/newsroom/press-releases.releaseId.21361.html#:~:text=trusted%20with%20payments%2C%20not%20only%20by%20users) : ouverture du réseau de Visa aux agents IA via des identifiants tokenisés |
| 16 septembre 2025 | Google | [Agent Payments Protocol (AP2)](https://cloud.google.com/blog/products/ai-machine-learning/announcing-agents-to-payments-ap2-protocol#:~:text=breaks%20this%20fundamental%20assumption) : un protocole ouvert avec plus de 60 partenaires, d'Amex à Coinbase en passant par PayPal |
| 29 septembre 2025 | OpenAI + Stripe | [Instant Checkout dans ChatGPT](https://openai.com/index/buy-it-in-chatgpt/#:~:text=powered%20by%20the%20Agentic%20Commerce%20Protocol%2C%20built%20with%20Stripe), propulsé par l'Agentic Commerce Protocol (ACP) publié en open source |
| 15 janvier 2026 | Google | [Universal Commerce Protocol (UCP)](/fr/blog/google-unveils-universal-commerce-protocol-to-power-the-next-generation-of-ai-shopping-agents/) : une norme ouverte d'interopérabilité du commerce conçue pour fonctionner aux côtés d'AP2 |
| 29 avril 2026 | Stripe | [Le portefeuille Link pour les agents + Issuing for agents](https://stripe.com/blog/giving-agents-the-ability-to-pay#:~:text=Today%20we%E2%80%99re%20launching) : accès au portefeuille grand public et primitives d'émission pour les dépenses des agents |
| 2026 | Mercury | [Gestion des dépenses avec cartes agent](https://mercury.com/spend-management#:~:text=Issue%20dedicated%20agent%20cards%20for%20approved%20transactions) : budgets, garde-fous et cartes dédiées pour les agents |

Pourquoi cette ruée ? Trois forces à l'œuvre, et cette partie relève de l'interprétation plutôt que de ce que les annonces déclarent explicitement :

**L'acheteur se déplace, et le portefeuille veut se déplacer avec lui.** OpenAI note que [plus de 700 millions de personnes se tournent chaque semaine vers ChatGPT](https://openai.com/index/buy-it-in-chatgpt/#:~:text=More%20than%20700%20million%20people%20turn%20to%20ChatGPT%20each%20week), qui gère désormais les achats directement dans la conversation. Si la découverte et le paiement se déroulent tous deux au sein d'une conversation avec un agent, quiconque fournit le portefeuille de l'agent se retrouve entre chaque marchand et chaque client. Le discours de Stripe auprès des développeurs est explicite sur l'enjeu — construisez sur Link et [atteignez sa base de 200 millions de consommateurs](https://stripe.com/blog/giving-agents-the-ability-to-pay#:~:text=more%20than%20200%20million%20consumers). Les entreprises de paiement ont regardé la recherche et le social s'interposer dans le commerce pendant deux décennies ; aucune d'elles n'a l'intention de regarder les agents faire de même depuis la touche.

**Les identifiants non limités ne survivent pas au contact de l'automatisation.** Faute de rails conçus pour cet usage, les gens confient aux agents des cartes enregistrées et des identifiants de connexion partagés — une autorité permanente et sans limites, exactement le schéma que les systèmes antifraude sont conçus pour repérer. Le responsable produit de Visa a formulé cette exigence comme une confiance qui s'étend au-delà des utilisateurs : les agents [« devront bénéficier de la confiance en matière de paiements, non seulement de la part des utilisateurs, mais aussi des banques et des vendeurs »](https://usa.visa.com/about-visa/newsroom/press-releases.releaseId.21361.html#:~:text=trusted%20with%20payments%2C%20not%20only%20by%20users). Les réseaux capables de distinguer un agent autorisé d'un bot testeur de cartes peuvent approuver davantage de bonnes transactions et bloquer davantage de mauvaises ; ceux qui ne le peuvent pas feront mal les deux.

**Les protocoles sont une course au territoire.** ACP, AP2, les Agentic Tokens de Mastercard et les identifiants tokenisés de Visa veulent tous devenir la grammaire par défaut des achats effectués par des machines. Les normes ouvertes ont tendance à gagner ces courses en étant faciles à adopter — c'est exactement pourquoi OpenAI a [publié ACP en open source](https://openai.com/index/buy-it-in-chatgpt/#:~:text=Agentic%20Commerce%20Protocol%2C%20so%20that%20more%20merchants%20and%20developers%20can%20begin%20building) et pourquoi Google a recruté 60 partenaires de lancement pour AP2, avant de poursuivre en janvier 2026 avec l'[Universal Commerce Protocol](/fr/blog/google-unveils-universal-commerce-protocol-to-power-the-next-generation-of-ai-shopping-agents/) pour standardiser le parcours d'achat autour du paiement. Personne ne veut intégrer deux fois la norme perdante.

## Un seul schéma de conception, de nombreux logos

Une fois la marque mise de côté, tout produit sérieux de paiement agentique converge vers les quatre mêmes propriétés :

1. **Ne jamais exposer l'identifiant brut.** Cartes à usage unique (Stripe), Shared Payment Tokens (Stripe/ACP), Agentic Tokens (Mastercard), identifiants tokenisés (Visa). L'agent porte un instrument conçu pour cet usage, pas votre PAN.
2. **Limiter l'autorité.** Montant, devise, marchand et bornes temporelles inscrits dans l'identifiant lui-même — la version d'OpenAI : [des jetons de paiement chiffrés « autorisés uniquement pour des montants et des marchands précis »](https://openai.com/index/buy-it-in-chatgpt/#:~:text=encrypted%20payment%20tokens%20are%20only%20authorized%20for%20specific%20amounts%20and%20specific%20merchants).
3. **Garder un humain dans la boucle d'approbation — du moins pour l'instant.** Stripe exige aujourd'hui un examen à chaque demande ; les budgets de Mercury pré-autorisent les dépenses dans des limites fixées par un humain. Le curseur d'autonomie évolue, mais il part de près de zéro.
4. **Rendre les dépenses des agents lisibles.** Agents enregistrés (Mastercard), chaînes de contexte des demandes de dépense (Stripe), suivi en temps réel et application du type « justificatif ou votre carte se bloque » (Mercury). Chaque transaction doit répondre à la question « quel agent, sous quelle autorité, pour quoi ? »

Si ces propriétés semblent familières aux lecteurs habitués à la crypto, c'est normal. Un transfert de [Stablecoin](/fr/glossary/stablecoin/) autorisé par signature dans le cadre du schéma de paiement exact de [x402](/fr/glossary/x402/) — un montant exact, vers un destinataire exact, valable uniquement pendant une fenêtre temporelle, signé par le [Portefeuille](/fr/glossary/wallet/) du payeur lui-même au moment de l'achat — c'est la même conception, atteinte depuis l'autre direction, où la limitation est appliquée par la cryptographie plutôt que par le moteur de règles d'un émetteur. Stripe lui-même cite les stablecoins comme un futur moyen de paiement pour les portefeuilles d'agents. Le monde des cartes et le monde de la crypto convergent vers la même réponse : *une autorité par transaction, et non une autorité enregistrée.*

## La place des noms de domaine

Les noms de domaine s'avèrent être l'une des premières choses que les agents achètent de leur propre initiative — ce sont des objets purement API, sans adresse de livraison requise, et tout produit agentique déployé finit par avoir besoin d'un nom qu'il contrôle. Nous avons déjà écrit sur [la façon dont les agents achètent des domaines sans intervention humaine](/fr/blog/agents-buy-domains/), [à quoi ressemble un bureau d'enregistrement conçu pour les agents](/fr/blog/agent-native/), et [comment un agent enregistre un domaine sur Namefi](/fr/blog/ai-agent-register/) étape par étape.

La réponse de Namefi à la question du paiement est le paiement signé par portefeuille détaillé dans [Payer ses noms de domaine avec un portefeuille crypto : aucun compte requis](/fr/blog/wallet-checkout/) : le portefeuille d'un agent répond à un défi x402 en signant une autorisation de transfert USDC pour un enregistrement exact, à un prix exact, sans compte et sans identifiant stocké nulle part — et reçoit le domaine sous forme de [Domaine Tokenisé](/fr/glossary/tokenized-domain/) dans ce même portefeuille. Il s'agit de paiement agentique précisément au sens décrit tout au long de cet article, déjà disponible aujourd'hui sur un produit réel, pour la chose que les agents ont le plus systématiquement besoin d'acheter.

La ruée pour proposer le paiement agentique est, au fond, une ruée pour obtenir la confiance. Plus de deux cents millions de consommateurs Link, plus de sept cents millions d'utilisateurs hebdomadaires de ChatGPT, et chaque programme de carte d'entreprise convergent tous vers le même pari : les prochains milliards d'acheteurs ne seront pas tous humains, et l'infrastructure qui donnera à leurs logiciels une autorité de dépense sûre, limitée et responsable sera aussi fondamentale que le réseau de cartes l'a été pour la dernière ère du commerce.

## Sources et lectures complémentaires

- Stripe — [Donner aux agents la capacité de payer](https://stripe.com/blog/giving-agents-the-ability-to-pay) (le portefeuille Link pour les agents + Issuing for agents, 29 avril 2026)
- Mercury — [Gestion des dépenses](https://mercury.com/spend-management) (budgets, garde-fous et cartes agent dédiées)
- Google Cloud — [Annonce de l'Agent Payments Protocol (AP2)](https://cloud.google.com/blog/products/ai-machine-learning/announcing-agents-to-payments-ap2-protocol) (16 septembre 2025)
- OpenAI — [Acheter dans ChatGPT : Instant Checkout et l'Agentic Commerce Protocol](https://openai.com/index/buy-it-in-chatgpt/) (29 septembre 2025)
- Mastercard — [Mastercard dévoile Agent Pay](https://www.mastercard.com/global/en/news-and-trends/press/2025/april/mastercard-unveils-agent-pay-pioneering-agentic-payments-technology-to-power-commerce-in-the-age-of-ai.html) (29 avril 2025)
- Visa — [Trouver et acheter avec l'IA : Visa dévoile une nouvelle ère du commerce](https://usa.visa.com/about-visa/newsroom/press-releases.releaseId.21361.html) (Visa Intelligent Commerce, 30 avril 2025)
- Namefi — [Payer ses noms de domaine avec un portefeuille crypto : aucun compte requis](/fr/blog/wallet-checkout/) (paiement signé par portefeuille x402)
