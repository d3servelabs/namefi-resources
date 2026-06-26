---
title: "Flipping de domaines ENS vs DNS : ce qui change"
date: '2026-06-24'
language: fr
tags: ['domains', 'domain-flipping', 'web3', 'comparison']
authors: ['namefiteam']
draft: false
cluster: domain-investing
series: domain-flipping-skills
seriesOrder: 33
format: comparison
description: "En quoi le flipping de noms ENS en .eth diffère du flipping de domaines DNS traditionnels : propriété, liquidité, renouvellement, gas, et à quoi chacun convient le mieux."
ogImage: ../../assets/ens-vs-dns-domain-flipping-og.jpg
keywords: ['ENS vs DNS', 'flipping de domaines ENS', 'flipper des domaines ENS', 'investir dans les domaines .eth', 'flipping de noms .eth', 'ENS vs domaines traditionnels', 'flipping de domaines on-chain', 'liquidité des domaines NFT', 'frais de renouvellement ENS', 'domaines ERC-721', 'flipping de domaines web3', 'vendre des ENS sur OpenSea', 'période de grâce d''expiration ENS', 'flipping de domaines tokenisés', 'frais de gas ENS']
relatedArticles:
  - /fr/blog/onchain-domain-flipping/
  - /fr/blog/how-tokenization-changes-domain-flipping/
  - /fr/blog/onchain-domain-marketplaces-compared/
  - /fr/blog/selling-domains-as-nfts/
  - /fr/blog/tokenize-your-com-to-flip-it/
relatedTopics:
  - /fr/topics/domain-investing/
  - /fr/topics/domain-tokenization/
relatedSeries:
  - /fr/series/domain-flipping-skills/
  - /fr/series/tokenize-your-com/
relatedGlossary:
  - /fr/glossary/registrar/
  - /fr/glossary/dns/
  - /fr/glossary/icann/
  - /fr/glossary/tld/
  - /fr/glossary/web3/
---

Si vous faites du flipping de domaines, vous avez probablement observé le marché [ENS (Ethereum Name Service)](/fr/glossary/ens/) depuis la touche en vous demandant s'il s'agissait du même jeu avec une nouvelle couche de peinture. Ce n'est pas le cas. Flipper un nom `.eth` et flipper un `.com` traditionnel se ressemblent — acheter une bonne chaîne pas cher, la revendre à quelqu'un qui en a plus besoin — mais presque tout ce qu'il y a en dessous est différent : qui peut voir votre propriété, comment une vente se règle, ce que vous payez pour conserver le nom, et ce que « posséder » signifie même. Cet article parcourt les vraies différences pour que vous puissiez décider où votre temps et votre capital ont réellement leur place.

Une clarification d'abord, car le domaine est confus. Les noms ENS en `.eth` ne sont pas la même chose que les **domaines DNS tokenisés**. Un nom `.eth` vit entièrement [on-chain](/fr/glossary/on-chain/) et ne se résout pas dans un navigateur classique sans un resolver ou une passerelle. Un `.com` tokenisé est un véritable domaine [ICANN](/fr/glossary/icann/) qui porte *aussi* un token on-chain — il se résout partout où un `.com` le fait. Nous creusons ce partage à trois dans [domaine tokenisé vs domaine web3](/fr/blog/tokenized-domain-vs-web3-domain/) et dans la comparaison [ENS vs Unstoppable vs DNS tokenisé](/fr/blog/ens-vs-unstoppable-vs-tokenized-dns/). Cet article porte spécifiquement sur le flipping ENS en `.eth` par rapport au flipping DNS traditionnel — gardez la troisième catégorie à l'esprit, car elle emprunte les meilleures qualités des deux.

## Ce que vous achetez réellement

![Illustration éditoriale d'un name-token NFT auto-conservé et d'une clé à l'intérieur d'un portefeuille tenu dans votre main, opposés à un identifiant de connexion de registrar loué et à un document de bail verrouillé par un tiers](../../assets/ens-vs-dns-domain-flipping-01-custody.jpg)

Un domaine DNS traditionnel est une inscription : vous payez un [bureau d'enregistrement](/fr/glossary/registrar/) accrédité par l'ICANN, et votre nom se trouve dans une base de données de registre. Vous ne possédez pas la chaîne purement et simplement — vous détenez un bail renouvelable, et la surface de contrôle est un identifiant de connexion au registrar.

Un nom ENS est différent par nature. Comme le formule la documentation ENS, [the Ethereum Name Service (ENS) is a distributed, open, and extensible naming system based on the Ethereum blockchain](https://docs.ens.domains/learn/protocol#:~:text=The%20Ethereum%20Name%20Service%20%28ENS%29%20is%20a%20distributed%2C%20open%2C%20and%20extensible%20naming%20system%20based%20on%20the%20Ethereum%20blockchain). Un nom `.eth` enregistré est un [NFT (Jeton Non Fongible)](/fr/glossary/nft/) — plus précisément un token [ERC-721 (norme NFT)](/fr/glossary/erc-721/) — qui vit dans votre [portefeuille](/fr/glossary/wallet/). La documentation ENS est explicite : les utilisateurs [transfer their name just like with any other ERC721 token](https://docs.ens.domains/registry/eth/#:~:text=transfer%20their%20name%20just%20like%20with%20any%20other%20ERC721%20token). L'ERC-721, la norme qui le sous-tend, est [a standard interface for non-fungible tokens, also known as deeds](https://eips.ethereum.org/EIPS/eip-721#:~:text=A%20standard%20interface%20for%20non%2Dfungible%20tokens%2C%20also%20known%20as%20deeds), et il [provides basic functionality to track and transfer NFTs](https://eips.ethereum.org/EIPS/eip-721#:~:text=This%20standard%20provides%20basic%20functionality%20to%20track%20and%20transfer%20NFTs).

La première différence est donc la conservation. Avec le DNS, le registrar détient les clés de votre compte et le registre détient l'enregistrement faisant autorité. Avec ENS, le [smart contract](/fr/glossary/smart-contract/) détient l'enregistrement et c'est *vous* qui détenez les clés. Cela coupe dans les deux sens pour un flipper, comme nous le verrons — cela supprime un intermédiaire des ventes, mais fait peser tout le poids de la [conservation](/fr/glossary/custodial-ownership/) sur votre propre [phrase de récupération](/fr/glossary/wallet/).

## La propriété est publique, on-chain et auditable

Quand vous achetez un `.com`, la propriété est semi-privée. Les données WHOIS sont souvent masquées, l'historique des transferts est opaque, et l'acheteur doit en grande partie vous croire sur parole que le nom est sain et libre de toute charge.

ENS inverse cela. Comme chaque inscription, transfert et vente est une transaction on-chain, la provenance complète d'un nom est publique et permanente. N'importe qui peut lire quel [portefeuille](/fr/glossary/wallet/) détient `crypto.eth`, quand il a changé de mains pour la dernière fois, et pour combien. Pour un flipper, c'est à double tranchant. L'avantage : la due diligence est triviale, les contrefaçons sont difficiles, et un acheteur peut vérifier votre propriété en quelques secondes sans qu'un agent de [séquestre](/fr/glossary/escrow/) ne s'en porte garant. L'inconvénient : votre portefeuille et votre prix de revient sont visibles par vos concurrents, et un portefeuille qui télégraphie « je suis un flipper » peut inviter à de pires contre-offres. Le domaining traditionnel vous permet de rester discret ; ENS ne le permet pas.

Cette transparence est la même propriété qui rend les noms on-chain plus faciles à valoriser et à échanger de façon programmatique — un thème que nous reprenons dans [estimer les domaines on-chain](/fr/blog/appraising-onchain-domains/).

## Liquidité du marché secondaire : des places de marché, pas des courtiers

![Illustration éditoriale d'un échange atomique en une étape à la devanture d'une place de marché NFT, opposé à un lent parcours de séquestre multi-étapes serpentant à travers un intermédiaire](../../assets/ens-vs-dns-domain-flipping-02-settlement.jpg)

C'est ici qu'ENS change véritablement l'expérience. Parce qu'un nom `.eth` est un token ERC-721, il est nativement compatible avec les [places de marché](/fr/glossary/marketplace/) NFT généralistes — OpenSea, Blur et d'autres — sans aucune plomberie spécifique à l'industrie des domaines. Vous le mettez en vente comme n'importe quel autre NFT, et une vente se règle via le [smart contract](/fr/glossary/smart-contract/) standard de la place de marché.

Ce règlement est la différence majeure. Une vente de domaine traditionnel est une chorégraphie de plusieurs jours : se mettre d'accord sur le prix, ouvrir le séquestre, l'acheteur l'alimente, vous poussez le [transfert](/fr/glossary/atomic-transfer/) chez le registrar, le registrar confirme, le séquestre libère les fonds. Une vente ENS est un [transfert atomique](/fr/glossary/atomic-transfer/) : le paiement de l'acheteur et votre token s'échangent dans une seule transaction, sinon rien ne se passe. Aucun tiers ne détient l'actif en cours de transaction, ce qui est le même mécanisme qui rend les ventes de domaines tokenisés sans séquestre — voir [comment les places de marché tokenisées remplacent le séquestre](/fr/blog/how-tokenized-marketplaces-replace-escrow/) et la comparaison plus large [places de marché de domaines on-chain comparées](/fr/blog/onchain-domain-marketplaces-compared/).

La liquidité comporte toutefois un vrai piège. Les places de marché NFT sont liquides pour les *NFT*, mais un nom `.eth` ne se vend qu'à un acheteur qui veut spécifiquement ce nom et qui est déjà crypto-natif. Un excellent `.com` peut être vendu à littéralement n'importe quelle entreprise sur Terre ; un excellent `.eth` se vend au bien plus petit vivier de gens qui détiennent de l'ETH, font tourner un portefeuille et valorisent un nom on-chain. Règlement plus rapide, demande plus mince. Ne confondez pas « instantané à transférer » avec « facile à vendre ».

## Le modèle de renouvellement et d'expiration n'est pas le même

![Illustration éditoriale d'un filet de sécurité indulgent de période de grâce rattrapant une étiquette de domaine qui tombe, opposé à une horloge stricte d'enchère hollandaise avec un prix descendant et une main qui rafle le nom lâché](../../assets/ens-vs-dns-domain-flipping-03-expiry.jpg)

Les deux systèmes vous facturent pour conserver un nom, mais les mécanismes divergent de façons qui comptent pour un portefeuille.

Le DNS traditionnel fonctionne selon les conditions du registrar. Une inscription en [gTLD (Domaine générique de premier niveau)](/fr/glossary/gtld/) peut être détenue jusqu'à dix ans — d'après Wikipedia, [the maximum period of registration for a gTLD domain name is 10 years](https://en.wikipedia.org/wiki/Domain_name_registrar#:~:text=The%20maximum%20period%20of%20registration%20for%20a%20gTLD%20domain%20name%20is%2010%20years) — et le prix de renouvellement d'un `.com` ordinaire est modeste : Wikipedia note qu'en 2023, [the retail cost generally ranges from a low of about $9.70 per year](https://en.wikipedia.org/wiki/Domain_name_registrar#:~:text=the%20retail%20cost%20generally%20ranges%20from%20a%20low%20of%20about%20%249.70%20per%20year). Manquez un renouvellement et il existe un coussin indulgent — des fenêtres de rachat et des périodes de grâce mesurées en semaines avant que le nom ne soit véritablement libéré.

ENS utilise des frais annuels basés sur la longueur, payés en ETH. D'après la documentation ENS, les noms de cinq caractères ou plus coûtent environ 5 $ par an, les noms de quatre caractères environ 160 $, et les noms de trois caractères environ 640 $ — les chaînes courtes et rares coûtent plus cher pour décourager la thésaurisation (estimations à jour au moment de la rédaction ; les prix ENS sont libellés en USD et réglés en ETH, donc le montant exact en ETH varie avec le marché). Le parcours d'expiration est plus strict et plus conflictuel : après l'expiration d'un nom, la documentation ENS décrit une fenêtre de [90 days after a name expires (aka after the grace period)](https://docs.ens.domains/registry/eth/#:~:text=90%20days%20after%20a%20name%20expires) avant qu'il ne redevienne disponible via ce que la documentation appelle [a 21 day dutch auction](https://docs.ens.domains/registry/eth/#:~:text=a%2021%20day%20dutch%20auction), où le prix de récupération commence très haut et décroît vers les frais normaux. Pour un flipper, cette enchère est à la fois un risque (laissez expirer un nom de valeur et des rivaux peuvent le rafler) et une opportunité (un observateur discipliné peut récupérer des noms premium à mesure que le prix hollandais baisse).

L'enseignement pratique : ENS récompense une discipline de renouvellement plus serrée que le DNS. Les mécanismes de grâce sont moins indulgents, et la conséquence d'un renouvellement manqué n'est pas une libération discrète — c'est une enchère publique que vos concurrents observent.

## Coûts de gas et de règlement

Les coûts des domaines traditionnels sont prévisibles : un renouvellement forfaitaire, des frais de transfert occasionnels, l'éventuelle commission de séquestre. Vous pouvez budgéter au dollar près la charge annuelle d'un portefeuille.

ENS ajoute une variable que vous ne contrôlez pas : le gas. Chaque action on-chain — enregistrer, renouveler, transférer, mettre en vente — est une transaction Ethereum avec des frais de réseau qui fluctuent avec la congestion. Un jour calme, c'est trivial ; pendant un mint chargé ou une flambée du marché, cela peut éclipser les 5 $ de renouvellement d'un nom bon marché. Cela change le calcul des flips de faible valeur. Renouveler deux cents `.com` sans intérêt coûte une somme forfaitaire et connue ; renouveler deux cents noms `.eth` de bas de gamme peut coûter bien plus en gas qu'en frais, et les frais eux-mêmes oscillent avec le prix de l'ETH. Les outils de couche 2 et de regroupement (batching) atténuent cela, mais le point central demeure : la charge ENS est plus irrégulière et moins prévisible que la charge DNS, et cette imprévisibilité est un coût réel pour quiconque opère en volume.

## À quoi chacun convient

Aucun n'est strictement meilleur — ils conviennent à des flippers différents et à des noms différents.

**Le flipping DNS traditionnel** gagne quand votre acheteur est une *entreprise* plutôt qu'un utilisateur crypto : un utilisateur final qui a besoin de `austinplumbing.com` pour un site web, des e-mails et un classement Google. Le vivier d'acheteurs est l'économie tout entière, les noms fonctionnent partout sans aucune friction, la charge est prévisible et le manuel de jeu est mature. Le coût, c'est un règlement lent, lié au séquestre, et une propriété opaque. L'essentiel du métier du [flipping de domaines](/fr/blog/domain-flipping/) — le sourcing, l'[estimation](/fr/blog/how-to-value-a-domain-name/), la prospection — s'est construit ici.

**Le flipping ENS** gagne quand la valeur du nom est *native de la crypto* : une identité de portefeuille propre, un handle de protocole ou de DAO, une courte chaîne de collection. Le règlement est atomique, la propriété est auto-conservée, et l'actif est composable avec les applications on-chain. Le coût, c'est un vivier d'acheteurs plus étroit, une exposition au gas, des règles d'expiration plus strictes et une responsabilité totale pour vos propres clés — perdez le portefeuille et le nom disparaît, ce qui est précisément la raison pour laquelle [récupérer un nom on-chain après la perte d'un portefeuille](/fr/blog/recovering-a-tokenized-domain-after-wallet-loss/) et la [conservation multi-signature](/fr/glossary/multi-sig/) comptent tellement plus ici que dans le DNS.

Et il existe une troisième voie qui ne force pas le choix. Un **domaine DNS tokenisé** — un véritable `.com` avec un token on-chain par-dessus — vous donne le vivier d'acheteurs universel du DNS *et* le règlement atomique, sans séquestre, ainsi que l'auto-conservation d'ENS. C'est la voie pour laquelle [Namefi](https://namefi.io) est conçu : tokenisez un nom que vous alliez flipper de toute façon, gardez-le résolvable partout, et vendez-le on-chain sans la danse du séquestre. Si vous pesez sérieusement le versant on-chain, le pilier de cluster [flipping de domaines on-chain](/fr/blog/onchain-domain-flipping/) et [comment la tokenisation change le flipping de domaines](/fr/blog/how-tokenization-changes-domain-flipping/) brossent le tableau complet, et [vendre des domaines en tant que NFT](/fr/blog/selling-domains-as-nfts/) couvre les mécanismes de mise en vente.

## En résumé

Le flipping ENS et le flipping DNS partagent un esprit et presque rien de leur plomberie. ENS vous donne une propriété publique, la [liquidité](/fr/glossary/domain-trading/) des places de marché NFT et un règlement atomique — au prix d'un vivier d'acheteurs plus mince, d'une exposition au gas, de règles d'expiration sévères et d'un risque d'auto-conservation. Le DNS vous donne un vivier d'acheteurs universel, une charge prévisible et un coussin de renouvellement indulgent — au prix de transferts lents, liés au séquestre et opaques. Les flippers les plus avisés ne choisissent pas un camp ; ils ajustent le nom au marché. Et de plus en plus, ils se tournent vers le DNS tokenisé pour cesser de choisir tout court.

## Avertissement amical (À lire !)

> Nous ne sommes ni avocats, ni comptables, ni conseillers financiers, ni médecins, et **rien dans cet article ne constitue un conseil juridique, financier, fiscal, comptable, médical ou tout autre genre de conseil professionnel.** Nous écrivons ces articles pour nous instruire nous-mêmes et par commodité pour nos clients. Les informations ici peuvent être obsolètes, propres à une zone géographique, ou tout simplement erronées. Nous faisons des erreurs nous aussi.
>
> Pour toute décision importante, **veuillez consulter un véritable professionnel (sérieusement !)**. Ou si ce n'est pas votre truc, demandez à un ami, demandez à Twitter, demandez à Reddit, demandez à une IA, ou demandez à un voyant. En bref : **DOYR — Do Your Own Research** (faites vos propres recherches). Apprenons et amusons-nous.

## Sources et lectures complémentaires

- ENS Docs — [What is ENS? (distributed naming system on the Ethereum blockchain)](https://docs.ens.domains/learn/protocol#:~:text=The%20Ethereum%20Name%20Service%20%28ENS%29%20is%20a%20distributed%2C%20open%2C%20and%20extensible%20naming%20system%20based%20on%20the%20Ethereum%20blockchain)
- ENS Docs — [ETH Registrar (.eth names transfer like any ERC721 token; grace period and Dutch auction on expiry; length-based annual fees)](https://docs.ens.domains/registry/eth/#:~:text=transfer%20their%20name%20just%20like%20with%20any%20other%20ERC721%20token)
- Ethereum Improvement Proposals — [ERC-721 Non-Fungible Token Standard ("a standard interface for non-fungible tokens, also known as deeds")](https://eips.ethereum.org/EIPS/eip-721#:~:text=A%20standard%20interface%20for%20non%2Dfungible%20tokens%2C%20also%20known%20as%20deeds)
- Wikipedia — [Domain name registrar (10-year max gTLD term; retail `.com` renewal pricing)](https://en.wikipedia.org/wiki/Domain_name_registrar#:~:text=The%20maximum%20period%20of%20registration%20for%20a%20gTLD%20domain%20name%20is%2010%20years)
