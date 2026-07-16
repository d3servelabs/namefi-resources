---
title: "Comment remporter des enchères de domaines sans payer trop cher"
date: '2026-06-21'
language: fr
tags: ['domains', 'domain-investing', 'domain-flipping', 'guide']
authors: ['aileen-wright']
editors: ['victor-zhou']
draft: false
cluster: domain-investing
series: domain-flipping-skills
seriesOrder: 6
format: guide
description: "Comment fonctionnent réellement les enchères de domaines du marché secondaire — enchères par procuration, sniping, plafonds fermes, lecture de la demande, et comment éviter les pièges du surpaiement et des enchères fictives."
ogImage: ../../assets/how-to-win-domain-auctions-og.jpg
keywords: ['enchères de domaines', 'comment remporter des enchères de domaines', 'stratégie d''enchères de domaines', 'GoDaddy Auctions', 'NameJet', 'enchères Sedo', 'enchère par procuration', 'sniping d''enchères', 'enchères de domaines expirés', 'enchères fictives', 'malédiction du vainqueur domaines', 'acheter des domaines expirés', 'marché secondaire des domaines', 'enchère de drop catching', 'éviter de payer trop cher les domaines']
relatedArticles:
  - /fr/blog/domain-flipping/
  - /fr/blog/end-user-vs-reseller-domain-pricing/
  - /fr/blog/how-to-read-comparable-domain-sales/
  - /fr/blog/domain-backorders-and-drop-catching/
  - /fr/blog/when-to-drop-a-domain/
relatedTopics:
  - /fr/topics/domain-investing/
  - /fr/topics/domain-tokenization/
relatedSeries:
  - /fr/series/domain-flipping-skills/
  - /fr/series/domain-investor-field-guide/
relatedGlossary:
  - /fr/glossary/registrar/
  - /fr/glossary/icann/
  - /fr/glossary/dns/
  - /fr/glossary/tld/
  - /fr/glossary/registry/
---

La plupart des bons noms que vous voudrez un jour acheter sont déjà pris, et une large part d'entre eux finit par passer par une [enchère](/fr/glossary/auction/). Quand un enregistrement expire, quand un domaineur liquide son stock, quand un bureau d'enregistrement capture un nom qui chute sans qu'aucun [backorder](/fr/glossary/backorder/) ne le couvre, le nom atterrit sur un billot d'enchère et part au plus offrant. Si vous faites du flipping de domaines, vous dépenserez de l'argent réel dans ces salles, et la différence entre une acquisition rentable et un nom mort dans votre compte tient surtout à la discipline au moment de l'enchère.

Ce guide explique comment fonctionnent réellement les enchères du [marché secondaire](/fr/glossary/aftermarket/), les deux mécaniques d'enchère que vous devez comprendre (l'enchère par procuration et le sniping), comment fixer et tenir un plafond ferme, comment lire si la demande est réelle, et comment éviter les deux façons dont les enchères vous séparent de votre argent : payer vous-même trop cher, et vous faire manipuler par quelqu'un d'autre. Il s'inscrit dans notre série plus large sur [le domain flipping](/fr/blog/domain-flipping/), et se complète directement avec [comment trouver des domaines à revendre](/fr/blog/how-to-find-domains-to-flip/), puisque les enchères sont l'un des principaux endroits où vous les trouverez.

## D'où viennent les enchères de domaines

Une enchère de nom de domaine est la version formelle du commerce « acheter bas, vendre haut » : elle [facilite l'achat et la vente de noms de domaine actuellement enregistrés, permettant à des particuliers d'acheter à un propriétaire désireux de vendre un domaine déjà enregistré qui correspond à leurs besoins](https://en.wikipedia.org/wiki/Domain_name_auction#:~:text=facilitates%20the%20buying%20and%20selling%20of%20currently%20registered). La majeure partie de l'inventaire sur lequel vous enchérirez provient du pipeline d'expiration. Quand un nom n'est pas renouvelé, il ne revient pas immédiatement dans le pool ouvert — les bureaux d'enregistrement le font d'abord passer par une enchère. Comme Wikipédia décrit la mécanique du [drop catching de domaines](/fr/blog/expired-domains-and-the-drop-cycle/), [les bureaux d'enregistrement grand public comme GoDaddy ou eNom conservent les noms pour les mettre aux enchères via des services tels que TDNAM ou Snapnames](https://en.wikipedia.org/wiki/Domain_drop_catching#:~:text=Retail%20registrars%20such%20as%20GoDaddy%20or%20eNom%20retain%20names%20for%20auction). D'autres bureaux d'enregistrement confient le nom à un intermédiaire : [certains bureaux d'enregistrement ne laissent pas les domaines chuter de manière normale, mais introduisent un intermédiaire (par ex. Snapnames et Namejet) qui met le domaine aux enchères avant sa suppression](https://en.wikipedia.org/wiki/Domain_name_speculation#:~:text=introducing%20an%20intermediary).

En pratique, vous rencontrerez trois variétés de plateformes :

- **GoDaddy Auctions**, le marché d'expiration au plus fort volume, alimenté par les noms qui chutent du plus grand [bureau d'enregistrement](/fr/glossary/registrar/) de la planète. La plupart des annonces sont des noms expirés sur un compte à rebours public.
- **NameJet** (et son proche cousin Snapnames), qui fonctionnent comme des services de backorder couplés à des enchères. Vous placez un [backorder](/fr/blog/domain-backorders-and-drop-catching/) sur un nom en attente de suppression ; si plus d'une personne le veut, il part en enchère privée entre les détenteurs de backorder.
- **Sedo**, davantage axé sur l'inventaire mis en vente par les propriétaires que sur l'expiration. Sedo est une société américaine du marché secondaire des domaines qui a [introduit les enchères de noms de domaine](https://en.wikipedia.org/wiki/Sedo#:~:text=introduced%20domain%20name%20auctions) en 2006, et qui reste un lieu de prédilection pour les ventes à l'initiative du vendeur et les ventes intermédiées.

L'offre diffère, mais la mécanique d'enchère est quasi identique. Apprenez-la une fois et vous pourrez enchérir partout.

## L'enchère par procuration : le moteur sous le capot

![Illustration éditoriale d'une enveloppe scellée renfermant une enchère maximale cachée qui alimente une machine à engrenages augmentant l'enchère seulement autant que nécessaire, s'arrêtant sous une ligne de plafond invisible](../../assets/how-to-win-domain-auctions-01-proxy.jpg)

Presque toutes les enchères de domaines reposent sur l'**enchère par procuration**, le système qu'eBay a rendu célèbre. La définition est précise : l'enchère par procuration [est une implémentation d'une enchère anglaise au second prix utilisée sur eBay, dans laquelle l'enchérisseur gagnant paie le prix de la deuxième enchère la plus élevée plus un incrément défini](https://en.wikipedia.org/wiki/Proxy_bid#:~:text=is%20an%20implementation%20of%20an%20English%20second%2Dprice%20auction). Vous saisissez le maximum que vous êtes prêt à payer. Le système n'expose pas ce chiffre ; il enchérit pour vous par paliers, seulement aussi haut qu'il le faut pour rester en tête, jusqu'à votre plafond.

La conséquence est le fait le plus utile de toute la stratégie d'enchère, et il est contre-intuitif au premier abord : parce que [le prix payé est déterminé uniquement par les enchères des concurrents et non par le montant de la nouvelle enchère](https://en.wikipedia.org/wiki/Proxy_bid#:~:text=the%20price%20paid%20is%20determined%20only%20by%20competitors%27%20bids), la décision rationnelle est d'enchérir votre véritable maximum une seule fois et de ne plus jamais y toucher. Vous ne payez votre maximum que si quelqu'un vous y pousse. Si votre plafond est de 1 200 $ et que l'enchérisseur le plus élevé après vous plafonne à 700 $, vous gagnez à environ 700 $ plus un incrément, et non à 1 200 $. Saisir votre vrai chiffre ne « le révèle » pas, car personne ne peut le voir et le prix est fixé par le second.

C'est pourquoi remonter votre enchère de 25 $ à la fois est une mauvaise habitude perdante. L'enchère par paliers n'obtient pas un meilleur prix sous un système par procuration ; elle vous apprend simplement, en temps réel, à quel point vous voulez le nom — exactement l'information qui vous fait payer trop cher. Décidez votre chiffre hors du chrono, saisissez-le une fois, et laissez la machine faire le reste.

## Le sniping : le timing, et pourquoi c'est surtout du bruit ici

L'autre mécanique sur laquelle tout le monde s'interroge est le **sniping** — enchérir à la toute dernière seconde. Le sniping d'enchères est [la pratique, dans une enchère en ligne minutée, consistant à placer une enchère susceptible de dépasser l'enchère la plus élevée du moment... le plus tard possible](https://en.wikipedia.org/wiki/Auction_sniping#:~:text=the%20practice%2C%20in%20a%20timed%20online%20auction). La logique est solide dans l'absolu : enchérir tard ne laisse aucun temps de réaction aux concurrents, et cela [évite les guerres d'enchères](https://en.wikipedia.org/wiki/Auction_sniping#:~:text=avoid%20bidding%20wars) et la course aux enchères, où la simple vue d'une enchère concurrente entraîne d'autres personnes dans la bataille.

Deux choses compliquent le sniping dans les enchères de domaines. Premièrement, la plupart des plateformes sérieuses utilisent des **prolongations anti-sniping** : une enchère placée dans les dernières minutes repousse l'heure de clôture de quelques minutes, encore et encore, jusqu'à ce que plus personne n'enchérisse dans la fenêtre. Cela neutralise l'effet de surprise qui fait fonctionner le sniping, car vous ne pouvez pas battre une horloge qui vous attend. Deuxièmement, le sniping est une tactique pour *gagner*, pas pour *payer moins*. Sous l'enchère par procuration, sniper votre vrai maximum à la dernière seconde remporte le même nom au même prix que saisir ce maximum tôt.

Donc la version honnête : le sniping a un seul usage légitime, qui est de garder votre intérêt caché afin de ne pas vous lancer dans une course aux enchères contre vous-même ni d'alerter un rival qui se nourrit de la concurrence. Sur les plateformes à prolongation d'enchère, il ne change rien au prix. La discipline qui compte n'est pas *quand* vous enchérissez. C'est *quel chiffre* vous êtes prêt à enchérir.

## Fixez un plafond ferme, puis tenez-le

![Illustration éditoriale d'une flèche de prix montante qui percute un mur solide et immuable qui tient bon](../../assets/how-to-win-domain-auctions-02-hardmax.jpg)

Avant de placer la moindre enchère, notez le maximum que vous paierez pour le nom, et traitez ce chiffre comme un mur, pas comme une suggestion. Votre maximum n'est pas « ce que le nom pourrait valoir pour l'acheteur parfait ». C'est un calcul à rebours à partir de votre sortie : estimez un prix de revente réaliste, soustrayez la commission de la place de marché que vous paierez côté vente, soustrayez les années de frais de renouvellement que vous devrez supporter avant la revente, soustrayez la marge qui rend l'opération digne d'être faite — et ce qui reste est votre plafond d'acquisition. (Si vous êtes hésitant sur la partie revente de ce calcul, notre guide [comment vendre un nom de domaine que vous possédez](/fr/blog/how-to-sell-a-domain-name-you-own/) détaille la sortie.)

Puis tenez-le. L'architecture émotionnelle d'une enchère en direct est conçue pour déplacer votre mur, et le mot le plus coûteux du [domaining](/fr/glossary/domaining/) est « juste ». *Juste* un incrément de plus. *Juste* cinquante dollars de plus. Chaque petit coup de pouce paraît anodin pris isolément, et c'est là le piège : un nom que vous valorisiez à 800 $ devient un achat à 1 400 $ une étape indolore à la fois, et votre marge a disparu avant même que vous ne remarquiez qu'elle était partie. Le système par procuration vous protège ici si vous le laissez faire. Saisissez votre vrai plafond une fois, éloignez-vous, et acceptez le résultat. Si vous perdez, vous perdez face à quelqu'un qui valorisait le nom plus que vos chiffres ne disent qu'il vaut pour vous, ce qui est une victoire déguisée en défaite.

Le schéma perdant a un nom en théorie des enchères. La **malédiction du vainqueur** est le phénomène par lequel, parmi des enchérisseurs ayant des estimations privées différentes, [le vainqueur est l'enchérisseur ayant l'évaluation la plus optimiste de l'actif et aura donc tendance à surestimer et à payer trop cher](https://en.wikipedia.org/wiki/Winner%27s_curse#:~:text=the%20winner%20is%20the%20bidder%20with%20the%20most%20optimistic%20evaluation). Dans une salle remplie de domaineurs, la personne qui gagne est, par définition, celle qui a valorisé le nom le plus haut — et c'est souvent celle qui s'est trompée d'évaluation par le haut. Un plafond ferme est votre défense structurelle pour ne pas être cette personne.

## Lisez si la demande est réelle

![Illustration éditoriale d'une loupe examinant une foule de nombreux enchérisseurs distincts levant leurs pancartes face à seulement deux personnages se disputant l'un contre l'autre](../../assets/how-to-win-domain-auctions-03-demand.jpg)

La moitié du fait de ne pas payer trop cher consiste à valoriser correctement le nom en amont, et une enchère vous donne des signaux que vous devez apprendre à lire au lieu d'y réagir.

**Comptez les enchérisseurs uniques, pas le nombre d'enchères.** Deux personnes déterminées peuvent faire grimper un nom à travers des dizaines d'enchères ; c'est un duel, pas un marché. De nombreux enchérisseurs distincts signalent une demande large et un plancher probable. Un prix fixé par un seul rival qui vous poursuit reflète son appétit, pas celui du marché.

**Vérifiez la cohérence par rapport aux [ventes comparables](/fr/glossary/comparable-sales/).** Un prix d'enchère en direct n'est qu'un point de donnée bruité. Avant de décider qu'un chiffre est « juste parce que quelqu'un d'autre l'a enchéri », ancrez-vous sur ce pour quoi des noms véritablement similaires (même type de mot, même extension, même cas d'usage acheteur) se sont réellement vendus. Les fondamentaux de [comment trouver des domaines à revendre](/fr/blog/how-to-find-domains-to-flip/) s'appliquent directement à l'évaluation de ce qui est mis aux enchères.

**Séparez le nom des métriques.** Les enchères d'expiration adorent afficher l'ancienneté, les backlinks et le trafic, et ceux-ci peuvent être de la valeur réelle ou du spam recyclé, des profils de liens manipulés et un trafic qui s'évapore dès que l'ancien contenu disparaît. Considérez des métriques impressionnantes comme une raison de creuser, pas une raison d'enchérir. La valeur de revente pour un véritable [utilisateur final](/fr/glossary/end-user/) repose généralement sur la chaîne de caractères elle-même, pas sur un historique [SEO](/fr/glossary/seo/) que vous ne pouvez pas vérifier pleinement.

**Sachez pourquoi il est mis aux enchères.** Parfois, un [domaine qui a chuté a plus de valeur](https://en.wikipedia.org/wiki/Domain_name_speculation#:~:text=dropped%20domain%20names%20can%20be%20more%20valuable) à cause d'un site très en vue qui y résidait autrefois, et parfois cette histoire est précisément le passif (un projet abandonné, un problème de [marque commerciale](/fr/glossary/trademark/)) qui a poussé le propriétaire à s'en aller. Examinez le passé du nom avant de faire grimper le prix.

## Ne vous faites pas avoir : enchères fictives et pièges de prix

L'autre façon de payer trop cher est de se faire manipuler, et les enchères comportent une manipulation classique intégrée à leur structure. Un **shill** est un faux enchérisseur : les personnes qui [font monter les prix en faveur du vendeur ou du commissaire-priseur avec de fausses enchères lors d'une vente aux enchères sont appelées des shills](https://en.wikipedia.org/wiki/Shill#:~:text=drive%20prices%20in%20favor%20of%20the%20seller%20or%20auctioneer%20with%20fake%20bids), fabriquant l'apparence d'une demande pour qu'un véritable enchérisseur pousse plus haut qu'il ne l'aurait fait autrement. Les enchères fictives sont interdites sur toute plateforme réputée, mais aucune politique ne les fait disparaître entièrement.

Votre défense n'est pas de détecter les shills sur le moment, ce que vous ne pouvez généralement pas faire. Votre défense est qu'un plafond ferme rend les enchères fictives sans importance. Un enchérisseur fantôme ne peut vous nuire que si ses fausses enchères font monter votre chiffre, et votre chiffre ne bouge pas. Si un shill vous pousse jusqu'à votre plafond et « gagne », il s'est racheté le nom à lui-même, devant peut-être une commission pour le privilège. Tenez votre mur et la manipulation s'y heurte.

Quelques pièges de prix connexes méritent d'être nommés :

- **Prix de réserve et prix plancher.** De nombreuses annonces comportent une réserve cachée. Si la réserve se situe au-dessus de votre maximum, passez votre chemin — courir après un plancher non divulgué est la façon de vous convaincre de dépasser votre propre chiffre.
- **L'ancrage de l'« [achat immédiat](/fr/glossary/buy-it-now/) ».** Un prix d'achat immédiat élevé est là pour faire paraître l'enchère comme une bonne affaire par comparaison. C'est un ancrage marketing, pas une valorisation. Ignorez-le et évaluez le nom selon ses propres mérites.
- **Des frais en plus.** Certaines plateformes ajoutent des primes d'acheteur ou facturent la commission côté vente qui relève discrètement le plancher effectif de chacun. Intégrez le coût tout compris dans votre maximum afin que le chiffre que vous saisissez soit le chiffre auquel vous pouvez réellement vous permettre de gagner.

## Après avoir gagné : récupérez le nom en toute sécurité

Gagner est le début de la transaction, pas la fin, et lors d'une victoire de grande valeur, c'est au moment du transfert que les affaires tournent mal. C'est exactement pourquoi les sites d'enchères de domaines [proposent souvent des liens vers des agents de séquestre](https://en.wikipedia.org/wiki/Domain_name_auction#:~:text=auction%20sites%20often%20provide%20links%20to%20escrow%20agents) : un [séquestre](/fr/glossary/escrow/) neutre, pour que le vendeur ne transfère pas avant que le paiement soit confirmé et que vous ne payiez pas avant que le nom soit à vous. Pour les enchères d'expiration, le bureau d'enregistrement pousse généralement le nom dans votre compte automatiquement ; pour les victoires de propriétaire à propriétaire, exigez un [transfert](/fr/glossary/cross-registrar-transfer/) correctement séquestré et confirmez que vous recevez le [code d'autorisation](/fr/glossary/auth-code/). Nous couvrons le transfert sécurisé dans [le séquestre de domaine expliqué](/fr/blog/domain-escrow-explained/).

Le règlement est aussi l'endroit où la propriété tokenisée change la donne. Le bras de fer classique (aucune des deux parties ne veut bouger en premier) est ce qui rend le [trading de domaines](/fr/glossary/domain-trading/) de grande valeur tendu, et c'est précisément l'écart que [Namefi](https://namefi.io) est conçu pour réduire : le contrôle d'un véritable nom [ICANN](/fr/glossary/icann/) devient plus facile à vérifier et à transférer, avec une continuité [DNS](/fr/glossary/dns/) pour qu'un nom actif continue de résoudre pendant le transfert. Pour un acheteur en enchère, moins de friction au règlement signifie qu'une plus grande part des noms que vous remportez aboutissent réellement.

## La version courte

Les enchères récompensent la préparation et punissent l'improvisation. Faites votre valorisation avant que le chrono ne démarre. Fixez un plafond ferme calculé à rebours à partir d'une sortie réaliste, et non à partir de l'envie que vous avez du nom. L'enchère par procuration vous permet de saisir votre vrai plafond une seule fois sans payer trop cher ; le sniping sur les plateformes protégées par prolongation change le timing mais pas le prix ; et la malédiction du vainqueur, les enchères fictives et les ancrages d'achat immédiat perdent tous leur pouvoir face à un chiffre que vous refusez de déplacer. Remportez les noms qui correspondent à votre calcul, laissez les autres à quiconque paiera trop cher, et réglez via un [séquestre](/fr/glossary/escrow/) pour que la victoire atterrisse réellement dans votre compte.

## Avertissement amical (À lire !)

> Nous ne sommes ni avocats, ni comptables, ni conseillers financiers, ni médecins, et **rien dans cet article ne constitue un conseil juridique, financier, fiscal, comptable, médical ou toute autre forme de conseil professionnel.** Nous écrivons ces articles pour nous éduquer nous-mêmes et par commodité pour nos clients. Les informations ici peuvent être obsolètes, propres à une zone géographique, ou tout simplement fausses. Nous aussi, nous faisons des erreurs.
>
> Pour toute décision importante, **veuillez consulter un véritable professionnel (sérieusement !)**. Ou si ce n'est pas votre truc, demandez à un ami, demandez à Twitter, demandez à Reddit, demandez à une IA, ou demandez à un voyant. En bref : **DOYR - Do Your Own Research** (faites vos propres recherches). Apprenons et amusons-nous.

## Sources et lectures complémentaires

- Wikipédia — [Domain name auction (définition ; liens de séquestre)](https://en.wikipedia.org/wiki/Domain_name_auction#:~:text=facilitates%20the%20buying%20and%20selling%20of%20currently%20registered)
- Wikipédia — [Proxy bid (modèle eBay au second prix ; prix fixé par les enchères des concurrents)](https://en.wikipedia.org/wiki/Proxy_bid#:~:text=is%20an%20implementation%20of%20an%20English%20second%2Dprice%20auction)
- Wikipédia — [Auction sniping (enchère de dernière seconde ; éviter les guerres d'enchères)](https://en.wikipedia.org/wiki/Auction_sniping#:~:text=the%20practice%2C%20in%20a%20timed%20online%20auction)
- Wikipédia — [Winner's curse (l'enchérisseur le plus optimiste paie trop cher)](https://en.wikipedia.org/wiki/Winner%27s_curse#:~:text=the%20winner%20is%20the%20bidder%20with%20the%20most%20optimistic%20evaluation)
- Wikipédia — [Shill (fausses enchères pour faire monter les prix au profit du vendeur)](https://en.wikipedia.org/wiki/Shill#:~:text=drive%20prices%20in%20favor%20of%20the%20seller%20or%20auctioneer%20with%20fake%20bids)
- Wikipédia — [Domain drop catching (GoDaddy/eNom conservent les noms pour les enchères)](https://en.wikipedia.org/wiki/Domain_drop_catching#:~:text=Retail%20registrars%20such%20as%20GoDaddy%20or%20eNom%20retain%20names%20for%20auction)
- Wikipédia — [Domain name speculation (enchères intermédiaires Snapnames/Namejet ; noms qui chutent)](https://en.wikipedia.org/wiki/Domain_name_speculation#:~:text=introducing%20an%20intermediary)
- Wikipédia — [Sedo (a introduit les enchères de noms de domaine en 2006)](https://en.wikipedia.org/wiki/Sedo#:~:text=introduced%20domain%20name%20auctions)
