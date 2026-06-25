---
title: "Conservation, portefeuilles et récupération des domaines onchain"
date: '2026-06-24'
language: fr
tags: ['domains', 'domain-flipping', 'web3', 'explainer']
authors: ['namefiteam']
draft: false
cluster: domain-security
series: domain-flipping-skills
seriesOrder: 38
format: explainer
description: "Comment fonctionne réellement la conservation des domaines onchain : portefeuilles, multisignature, risque lié à la phrase secrète et récupération d''un domaine tokenisé après la perte d''un portefeuille."
ogImage: ../../assets/onchain-domain-custody-and-recovery-og.jpg
keywords: ['conservation domaine onchain', 'portefeuille domaine tokenisé', 'récupérer domaine tokenisé', 'récupération domaine après perte de portefeuille', 'risque phrase secrète', 'conservation domaine multisignature', 'sécurité domaine NFT', 'portefeuille matériel domaine', 'auto-conservation domaine', 'clé privée domaine', 'propriété domaine tokenisé', 'domaine ERC-721', 'flipping domaine onchain', 'sauvegarde portefeuille domaine', 'portefeuille à récupération sociale']
---

Quand vous flippez un domaine traditionnel, la conservation est le problème de quelqu'un d'autre. Le nom vit dans un compte chez un [bureau d'enregistrement](/fr/glossary/registrar/), et si vous oubliez le mot de passe, un lien de réinitialisation et une file d'attente du support vous attendent. Faites passer un domaine [on-chain](/fr/glossary/on-chain/) et ce filet de sécurité disparaît. Le jeton *est* le titre de propriété, et les clés de votre [portefeuille](/fr/glossary/wallet/) sont la seule chose qui se dresse entre vous et l'actif. Ce basculement est le plus grand ajustement mental pour quiconque arrive au flipping onchain depuis le [marché secondaire](/fr/glossary/domain-trading/) traditionnel.

Cet article est le chapitre sur la conservation de la série [flipping de domaines](/fr/blog/domain-flipping/). Il explique ce que signifie réellement la conservation pour un nom tokenisé, les véritables façons dont les gens perdent l'accès, les configurations de portefeuille qui l'empêchent et — honnêtement — à quoi ressemble la récupération quand la prévention échoue. Si vous échangez des noms onchain, considérez cela comme de l'hygiène opérationnelle, pas une lecture d'appoint.

## Ce que signifie la « conservation » une fois qu'un domaine devient un jeton

Un [domaine tokenisé](/fr/blog/what-are-tokenized-domains/) est un nom réel, reconnu par l'[ICANN](/fr/glossary/icann/), dont la propriété est *aussi* représentée par un jeton sur une [blockchain](/fr/glossary/blockchain/), généralement un [NFT (Jeton Non Fongible)](/fr/glossary/nft/) suivant la norme [ERC-721](/fr/glossary/erc-721/) — que la spécification elle-même décrit comme [une interface standard pour les jetons non fongibles, aussi appelés deeds (titres de propriété)](https://eips.ethereum.org/EIPS/eip-721#:~:text=A%20standard%20interface%20for%20non%2Dfungible%20tokens%2C%20also%20known%20as%20deeds). Ce cadrage « deeds » n'est pas du marketing. Quiconque détient le jeton dans son portefeuille détient le nom.

Il vaut la peine d'être précis ici, car trois choses que l'on appelle toutes des « domaines Web3 » ont des profils de conservation et de résolvabilité très différents, et les confondre mène à de mauvaises décisions :

- **Domaines ICANN tokenisés** (le modèle Namefi) — un vrai `.com`, `.xyz` ou `.io` qui se résout dans n'importe quel navigateur, avec un jeton onchain qui reflète la propriété au niveau du registre. La conservation, c'est le portefeuille ; la résolvabilité, c'est du [DNS](/fr/blog/dns-on-tokenized-domains/) normal.
- **Noms [ENS (Ethereum Name Service)](/fr/glossary/ens/)** (`vitalik.eth`) — des noms natifs d'Ethereum qui vivent entièrement on-chain et ne se résolvent pas dans un navigateur standard sans un résolveur ou un pont.
- **Noms de type Unstoppable** (`.crypto`, `.x`) — des espaces de noms natifs de la blockchain, hors de la racine ICANN, qui nécessitent là encore une résolution au niveau du portefeuille ou de l'extension.

Pour les trois, l'histoire de la *conservation* se ressemble : une [clé privée](/fr/glossary/private-key/) contrôle l'actif. Mais seul le cas ICANN tokenisé possède aussi un enregistrement hors chaîne dans un registre, et c'est cette seconde couche qui rend certaines pistes de récupération possibles. Nous démêlons cela dans [domaine tokenisé vs domaine Web3](/fr/blog/tokenized-domain-vs-web3-domain/) ; pour le flipping, c'est la différence entre un nom que vous pouvez vendre à n'importe quel acheteur et un nom que seul un acheteur crypto-natif peut prendre.

## Le spectre de la conservation : du custodial à l'auto-conservation totale

![Illustration éditoriale d'un spectre de conservation horizontal : une banque berçant une pièce-jeton de domaine à gauche, une remise de main en main au milieu, et une main ouverte tenant une clé plus la pièce-jeton à droite, avec un curseur coulissant le long de la barre](../../assets/onchain-domain-custody-and-recovery-01-custody-spectrum.jpg)

La conservation est un spectre, pas un interrupteur. À une extrémité se trouve la [**propriété custodiale**](/fr/glossary/custodial-ownership/) — une plateforme ou une bourse détient les clés et vous détenez un identifiant de compte. Pratique, récupérable par une équipe de support, et exactement le modèle de confiance que la crypto a été conçue pour éviter. À l'autre extrémité se trouve l'auto-conservation totale : les clés vous appartiennent à vous seul, personne ne peut geler ni saisir l'actif, et personne ne peut non plus vous tirer d'affaire.

La plupart des flippers onchain sérieux se situent au milieu et, surtout, *adaptent le modèle de conservation à la valeur et à la fréquence de trading du nom*. Un nom jetable que vous mettez activement en vente sur une [place de marché](/fr/glossary/marketplace/) peut rester dans un portefeuille chaud avec lequel vous signez tous les jours. Un nom à cinq chiffres que vous comptez conserver n'a rien à faire ailleurs que dans un stockage à froid ou un [multi-signature (multi-sig)](/fr/glossary/multi-sig/). L'erreur consiste à traiter les deux de la même façon — généralement en gardant tout dans l'unique MetaMask que vous utilisez aussi pour minter des NFT au hasard.

## Où vivent réellement les clés

Un [portefeuille de cryptomonnaie](https://en.wikipedia.org/wiki/Cryptocurrency_wallet) ne « stocke » pas votre domaine. Il stocke des clés. Comme le dit Wikipédia, [la clé privée est utilisée par le propriétaire pour accéder à la cryptomonnaie et l'envoyer, et reste privée pour le propriétaire](https://en.wikipedia.org/wiki/Cryptocurrency_wallet#:~:text=The%20private%20key%20is%20used%20by%20the%20owner%20to%20access%20and%20send%20cryptocurrency%20and%20is%20private%20to%20the%20owner) — et la même clé autorise le transfert d'un NFT de domaine. La taxonomie pratique pour un trader de domaines :

- **Portefeuilles chauds** (MetaMask, Rabby) — des portefeuilles logiciels connectés à Internet. Parfaits pour signer et pour les mises en vente actives, exposés aux logiciels malveillants, au phishing et aux demandes de signature malveillantes. C'est votre portefeuille de trading, pas votre coffre-fort.
- **[Portefeuilles matériels](/fr/glossary/hardware-wallet/)** (Ledger, Trezor, Keystone, GridPlus) — les clés vivent sur un appareil dédié qui signe hors ligne. Le bon foyer pour tout nom que vous conservez plutôt que de le flipper cette semaine. Déplacez le NFT ici après la [frappe](/fr/glossary/minting/).
- **Portefeuilles à [smart contract](/fr/glossary/smart-contract/)** (multisignature, récupération sociale) — les clés sont régies par une logique onchain plutôt que par un seul secret. Plus de détails ci-dessous.

Sous presque tous se trouve une **[phrase secrète (phrase de récupération)](/fr/glossary/seed-phrase/)** — les 12 ou 24 mots définis par la [spécification BIP-39](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki#:~:text=This%20BIP%20describes%20the%20implementation%20of%20a%20mnemonic%20code%20or%20mnemonic%20sentence%20%2D%2D%20a%20group%20of%20easy%20to%20remember%20words%20%2D%2D%20for%20the%20generation%20of%20deterministic%20wallets) comme un code mnémonique pour générer un portefeuille déterministe. Cette phrase régénère chaque clé que détient le portefeuille. Selon Wikipédia, [si le portefeuille est égaré, endommagé ou compromis, la phrase secrète peut être utilisée pour ré-accéder au portefeuille ainsi qu'aux clés et à la cryptomonnaie associées](https://en.wikipedia.org/wiki/Cryptocurrency_wallet#:~:text=the%20seed%20phrase%20can%20be%20used%20to%20re%2Daccess%20the%20wallet%20and%20associated%20keys). C'est précisément pour cela qu'il s'agit aussi de la suite de mots la plus dangereuse que vous écrirez jamais.

## Le risque lié à la phrase secrète est tout le jeu

![Illustration éditoriale d'une carte papier de phrase de récupération avec des emplacements de mots vides sous un dôme de verre fissuré, avec un hameçon de phishing, une flamme et un voleur masqué convergeant tous vers l'unique carte fragile](../../assets/onchain-domain-custody-and-recovery-02-seed-phrase-risk.jpg)

Presque toute perte onchain catastrophique se réduit à l'un de deux échecs de phrase secrète, et ils tirent dans des directions opposées :

1. **La phrase a été stockée à un seul endroit, et cet endroit a disparu.** Une réinitialisation de téléphone, un incendie, un carnet perdu. Il n'y a pas de lien de réinitialisation. Si la seule copie des mots a disparu, le nom a disparu.
2. **La phrase a été stockée là où quelqu'un d'autre pouvait la lire.** Une note dans le cloud, un gestionnaire de mots de passe qui se synchronise dans le cloud, une photo dans votre pellicule, une capture d'écran dans une conversation, collée dans un LLM. Quiconque lit ces mots possède tout ce que le portefeuille contrôle, instantanément et de manière irréversible.

La posture défensive est ennuyeuse et non négociable. Écrivez les mots sur papier, deux fois, dans deux emplacements physiques ; pour tout ce qui a de la valeur, utilisez une plaque de sauvegarde en acier qui survit au feu et à l'eau ; ne laissez jamais une vraie phrase secrète toucher une surface connectée à Internet. C'est la même discipline que les flippers expérimentés appliquent aux renouvellements : une assurance bon marché, payée avant d'en avoir besoin, contre une perte qui est totale lorsqu'elle survient.

## Multisignature et récupération sociale : supprimer le point de défaillance unique

![Illustration éditoriale d'une pièce-jeton de domaine gardée par une serrure centrale nécessitant que deux clés sur trois tournent ensemble, avec trois figures de détenteurs de clés autour et un cercle de récupération en pointillés reliant des gardiens](../../assets/onchain-domain-custody-and-recovery-03-multisig-recovery.jpg)

Une seule phrase secrète est un point de défaillance unique. La solution structurelle consiste à exiger *plus d'une* clé pour déplacer l'actif.

Un **[portefeuille multi-signature (multi-sig)](/fr/glossary/multi-sig/)** — le plus souvent un [Safe](https://safe.global/) (anciennement Gnosis Safe) sur les chaînes EVM — nécessite M clés sur N pour signer avant qu'un transfert ne s'exécute. Une configuration 2-sur-3 répartie entre un portefeuille matériel, un co-signataire et une sauvegarde hors ligne scellée signifie que perdre l'une des clés ne fait pas perdre le domaine, et qu'une seule signature obtenue par phishing ne le vide pas. La même idée existe en cryptographie pure : les schémas de signature à seuil comme FROST, normalisés dans le [RFC 9591](https://www.rfc-editor.org/rfc/rfc9591#:~:text=FROST%20signatures%20can%20be%20issued%20after%20a%20threshold%20number%20of%20entities%20cooperate%20to%20compute%20a%20signature), permettent à un [nombre seuil d'entités de coopérer pour calculer une signature](https://www.rfc-editor.org/rfc/rfc9591#:~:text=FROST%20signatures%20can%20be%20issued%20after%20a%20threshold%20number%20of%20entities%20cooperate%20to%20compute%20a%20signature) sans qu'aucune partie ne détienne jamais la clé entière.

Mais multisignature n'est pas un mot magique, et le traiter comme tel est la façon dont surviennent les grosses pertes. Cela fait échec à la compromission d'une clé unique et au risque d'initié ; cela ne fait *rien* contre une interface de signature compromise ou une campagne de phishing coordonnée qui trompe plusieurs signataires le même mauvais jour. Si vos trois clés « indépendantes » vivent toutes sur des appareils que vous seul contrôlez dans le même appartement, vous avez la lourdeur d'un multisignature avec le modèle de menace d'une clé unique. Nous détaillons exactement où la protection tient et où elle n'est que du théâtre dans [les portefeuilles multisignature améliorent-ils vraiment la sécurité ?](/fr/blog/do-multisig-wallets-actually-improve-security/) — une lecture obligatoire avant de lui confier un nom de valeur.

Pour les flippers en solo qui ne veulent pas coordonner des co-signataires, les **portefeuilles à récupération sociale** (Argent, Safe avec un module de récupération, comptes intelligents ERC-4337) vous permettent de désigner des gardiens qui peuvent collectivement restaurer l'accès si vous perdez votre clé. Plus convivial qu'un multisignature, au prix d'une confiance accrue dans le code des smart contracts et d'un ensemble de gardiens qui doit réellement exister et répondre.

Une règle pratique pour un portefeuille de trading : gardez un petit portefeuille chaud pour les noms que vous mettez activement en vente, et un portefeuille froid multisignature ou adossé à un matériel pour l'inventaire que vous conservez. Ne faites pas en sorte que chaque vente rapide exige trois signataires, et ne laissez pas votre meilleur nom dans le portefeuille que vous connectez à chaque mint douteux.

## Récupération : ce qui se passe réellement quand l'accès est perdu

La prévention est la véritable stratégie de récupération, mais les pertes arrivent, et ce qui est possible dépend entièrement de *la façon* dont vous avez perdu l'accès. La version courte :

- **Mot de passe perdu mais phrase secrète conservée** — ce n'est pas vraiment une perte. Réinstallez, restaurez depuis la phrase secrète, terminé.
- **Appareil perdu mais phrase secrète conservée** — nouvel appareil, restaurez depuis la phrase secrète, terminé.
- **Appareil conservé mais phrase secrète perdue** — déplacez le NFT vers un portefeuille neuf et correctement sauvegardé *immédiatement*, tant que l'appareil fonctionne encore.
- **Appareil et phrase secrète tous deux perdus** — le cas difficile. Cryptographiquement, le jeton est inaccessible, et personne ne peut forcer une clé privée par force brute. Quiconque prétend le pouvoir mène une arnaque.

Ce dernier cas est là où le modèle ICANN tokenisé diffère d'un nom purement onchain. Parce que l'actif sous-jacent est un véritable domaine enregistré, il y a un fil hors chaîne à tirer : une identité côté plateforme liée à votre enregistrement de [titulaire de domaine](/fr/glossary/registrant/), et des recours en propriété au niveau du bureau d'enregistrement, étayés par l'historique [WHOIS](/fr/glossary/whois/), les enregistrements de facturation et une pièce d'identité officielle. Ces pistes sont lentes, lourdes en paperasse, conditionnées à l'identité et jamais garanties — mais elles existent, ce qui est plus qu'une clé `.eth` perdue ne peut en dire. Le **vol** est un problème différent de la perte : retracez le mouvement onchain comme preuve, prévenez la plateforme et les places de marché pour signaler le jeton volé, et impliquez les forces de l'ordre, car un domaine tokenisé volé est aussi un actif enregistré volé.

Le manuel complet — chaque scénario de perte, l'ordre dans lequel agir, et ce qu'une plateforme peut et ne peut véritablement pas faire — se trouve dans [récupérer un domaine tokenisé après la perte d'un portefeuille](/fr/blog/recovering-a-tokenized-domain-after-wallet-loss/). Le résumé en une ligne : agissez vite, préservez les preuves, et ne supposez jamais que la porte est définitivement fermée sur un vrai nom ICANN.

## La conservation ne met pas en pause l'horloge du renouvellement

Un piège qui attrape les flippers nouveaux venus aux noms onchain : sécuriser parfaitement les clés ne fait rien pour l'*enregistrement*. Un domaine tokenisé reste un vrai domaine soumis à un calendrier de renouvellement, et le jeton reflète cet état — il ne le remplace pas. Laissez l'enregistrement expirer et même un nom auto-conservé impeccablement peut expirer sous vos pieds.

Les espaces de noms natifs onchain fonctionnent de la même manière. Un nom ENS `.eth`, par exemple, est loué annuellement : selon ENS, un [`.eth` de 5 lettres ou plus vous coûtera 5 USD par an](https://docs.ens.domains/registry/eth/#:~:text=letter%20%60.eth%60%20will%20cost%20you%20%605%20USD%60%20per%20year), et après son expiration vous disposez d'une [période de grâce de 90 jours — vous pouvez encore le prolonger au prix standard. Personne d'autre ne peut l'enregistrer](https://support.ens.domains/en/articles/8046905-what-is-a-grace-period#:~:text=After%20a%20.eth%20name%20expires%20you%20have%20a%2090%2Dday%20Grace%20Period). Les domaines ICANN tokenisés portent les périodes de grâce de renouvellement standard du registre de leur TLD. Quoi qu'il en soit, la conservation et le renouvellement sont des disciplines distinctes — posséder la clé n'est pas la même chose que garder le nom. Maintenir le [DNS](/fr/blog/dns-on-tokenized-domains/) et les renouvellements en bonne santé fait partie de la même hygiène de portefeuille dont dépend la survie de toute opération de [flipping de domaines](/fr/blog/domain-flipping/).

## L'angle Namefi

La conservation est précisément là où la tokenisation gagne sa place pour les flippers. Parce qu'un nom tokenisé par [Namefi](https://namefi.io) est un vrai domaine ICANN dont la propriété vit dans votre portefeuille, vous pouvez le détenir dans un multisignature ou un portefeuille matériel exactement comme vous protégeriez une trésorerie — le même schéma à seuil qui garde des fonds garde désormais le plan de contrôle DNS, de sorte qu'une seule personne piégée par phishing ne peut pas faire perdre le `.com` principal de l'entreprise. Et parce qu'il y a toujours un enregistrement de registre dessous, le tableau de la récupération bat celui d'un nom purement onchain : quand l'auto-conservation échoue, il y a un fil d'identité hors chaîne à suivre. La raison de [tokeniser un domaine](/fr/blog/why-tokenize-domains/) pour le trading n'est pas seulement un règlement plus rapide — c'est que vous pouvez enfin choisir un modèle de conservation qui correspond à la valeur du nom. Choisissez judicieusement, et mettez-le en place *avant* que le nom n'ait de l'importance.

## Avertissement amical (À lire !)

> Nous ne sommes ni avocats, ni comptables, ni conseillers financiers, ni médecins, et **rien dans cet article ne constitue un conseil juridique, financier, fiscal, comptable, médical ou tout autre type de conseil professionnel.** Nous écrivons ces articles pour nous instruire nous-mêmes et par commodité pour nos clients. Les informations ici peuvent être obsolètes, spécifiques à une géographie, ou tout simplement fausses. Nous faisons des erreurs nous aussi.
>
> Pour toute décision importante, **veuillez consulter un véritable professionnel (sérieusement !)**. Ou si ce n'est pas votre truc, demandez à un ami, demandez à Twitter, demandez à Reddit, demandez à une IA, ou demandez à un médium. En bref : **FVPR - Faites Vos Propres Recherches**. Apprenons et amusons-nous.

## Sources et lectures complémentaires

- Ethereum — [Norme de jeton non fongible ERC-721 (« une interface standard pour les jetons non fongibles, aussi appelés deeds »)](https://eips.ethereum.org/EIPS/eip-721#:~:text=A%20standard%20interface%20for%20non%2Dfungible%20tokens%2C%20also%20known%20as%20deeds)
- Wikipédia — [Portefeuille de cryptomonnaie (contrôle par la clé privée ; récupération par phrase secrète)](https://en.wikipedia.org/wiki/Cryptocurrency_wallet#:~:text=The%20private%20key%20is%20used%20by%20the%20owner%20to%20access%20and%20send%20cryptocurrency%20and%20is%20private%20to%20the%20owner)
- Bitcoin BIPs — [Code mnémonique BIP-39 pour portefeuilles déterministes](https://github.com/bitcoin/bips/blob/master/bip-0039.mediawiki#:~:text=This%20BIP%20describes%20the%20implementation%20of%20a%20mnemonic%20code%20or%20mnemonic%20sentence%20%2D%2D%20a%20group%20of%20easy%20to%20remember%20words%20%2D%2D%20for%20the%20generation%20of%20deterministic%20wallets)
- IETF — [RFC 9591 : signatures à seuil FROST](https://www.rfc-editor.org/rfc/rfc9591#:~:text=FROST%20signatures%20can%20be%20issued%20after%20a%20threshold%20number%20of%20entities%20cooperate%20to%20compute%20a%20signature)
- Safe — [Infrastructure de compte intelligent / multisignature](https://safe.global/)
- ENS Docs — [Tarification d'enregistrement .eth (5 USD/an pour 5 lettres ou plus)](https://docs.ens.domains/registry/eth/#:~:text=letter%20%60.eth%60%20will%20cost%20you%20%605%20USD%60%20per%20year)
- ENS Support — [Qu'est-ce qu'une période de grâce ? (fenêtre de 90 jours après expiration)](https://support.ens.domains/en/articles/8046905-what-is-a-grace-period#:~:text=After%20a%20.eth%20name%20expires%20you%20have%20a%2090%2Dday%20Grace%20Period)
