---
title: "Le détournement DNS de Lenovo.com : quand Lizard Squad s'est emparé de la vitrine d'un géant du matériel"
date: '2026-06-17'
language: fr
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: "Le 25 février 2015, Lizard Squad a détourné Lenovo.com en compromettant le bureau d'enregistrement Webnic, redirigeant le domaine du plus grand fabricant de PC au monde vers un diaporama de webcams et interceptant ses e-mails, quelques jours après le scandale Superfish. Une plongée au cœur de Domain Mayday expliquant pourquoi le bureau d'enregistrement est votre véritable périmètre de sécurité."
keywords: ["détournement dns lenovo.com", "lizard squad", "bureau d'enregistrement webnic", "web commerce communications", "détournement dns", "superfish", "sécurité du bureau d'enregistrement de domaine", "compromission de bureau d'enregistrement", "code d'autorisation epp", "interception d'e-mails", "détournement google vietnam", "sécurité des domaines", "verrouillage de bureau d'enregistrement"]
---

Au matin du 25 février 2015, le lien le plus cliqué d'Internet concernant le plus grand fabricant de PC au monde pointait vers un diaporama d'adolescents qui s'ennuyaient, regardant fixement leurs webcams, sur fond d'une chanson de *High School Musical*. Personne n'avait piraté un seul serveur Lenovo. Personne n'avait volé de mot de passe Lenovo. Les attaquants n'ont jamais touché au bâtiment, au réseau ou au site web lui-même.

Ils ont modifié un seul enregistrement chez le bureau d'enregistrement (registrar) de la société — et cela a suffi pour s'emparer de la vitrine de Lenovo, rediriger son courrier électronique et transformer sa marque en une vaste blague le temps d'un après-midi.

Voici **Domain Mayday EP17** : le détournement DNS de Lenovo.com. C'est une petite histoire si l'on regarde les chiffres : quelques heures d'indisponibilité, aucun système de production piraté, aucune base de données clients divulguée. Mais c'est l'une des démonstrations les plus limpides jamais réalisées d'une leçon que la plupart des entreprises ne comprennent toujours pas : votre domaine n'est sécurisé qu'à hauteur de la sécurité du bureau d'enregistrement qui le gère, et ce dernier ne fait presque jamais partie de votre programme de sécurité.

## Un géant du matériel dont le domaine est la vitrine

En 2015, Lenovo était le [plus grand fabricant de PC au monde](https://www.bankinfosecurity.com/lizard-squad-teases-lenovo-e-mail-grab-a-7953#:~:text=the%20world%27s%20largest%20PC%20manufacturer), expédiant plus d'ordinateurs portables et de bureau que quiconque sur terre. Pour une entreprise de cette taille, lenovo.com n'est pas un simple atout marketing. C'est le centre névralgique de toute l'opération : c'est là que les clients achètent, que les tickets d'assistance atterrissent, que les enregistrements de garantie affluent, et — fait crucial — c'est le domaine derrière chaque adresse e-mail `@lenovo.com` de l'entreprise.

Lorsqu'une marque atteint cette échelle, le domaine cesse d'être une simple adresse de site web pour devenir une infrastructure à part entière. Chaque communiqué de presse, chaque boîte de vente au détail, chaque signature d'employé, chaque confirmation de commande passe par lui. Ce qui signifie que quiconque contrôle le DNS du domaine contrôle non seulement le site web, mais aussi la *vérité* sur la destination de lenovo.com — pour les navigateurs comme pour les serveurs de messagerie.

C'est cette récompense que Lizard Squad convoitait. Pas le site web. Le pointeur vers celui-ci.

## 25 février 2015 : la redirection bizarre

![Art conceptuel vif et coloré d'une vitrine d'entreprise en verre dont l'enseigne lumineuse a été remplacée pendant la nuit par un panneau d'affichage farceur et criard, tons rose fluo et bleu électrique, une foule regardant en l'air confuse, aucun logo de marque](../../assets/the-lenovo-com-dns-hijack-01-hijack.jpg)

À partir de cet après-midi-là, les visiteurs qui tapaient lenovo.com n'arrivaient plus chez Lenovo. Le site avait été remplacé par un [diaporama de photos de jeunes assis devant leur ordinateur](https://www.engadget.com/2015-02-25-lenovo-com-hacked.html), l'air vide et légèrement gênés, le tout au son de ["Breaking Free"](https://www.engadget.com/2015-02-25-lenovo-com-hacked.html) de *High School Musical*. The Register a décrit la même scène comme un [diaporama de photos de webcam d'un jeune à l'air ennuyé](https://www.theregister.com/2015/02/25/lenovo_hacked_lizard_squad/#:~:text=slideshow%20of%20webcam%20photos%20of%20a%20bored%2Dlooking%20youth) en lieu et place des articles habituels de l'entreprise.

C'était délibérément absurde, et l'absurdité était le but recherché. Il ne s'agissait pas d'un vol de données silencieux censé rester caché. C'était une humiliation publique, mise en scène sur l'URL la plus visible que l'entreprise possédait.

L'attribution de l'attaque était visible de tous. Le code HTML de la page de remplacement attribuait sa conception "nouvelle et améliorée" à [Ryan King et Rory Andrew Godfrey](https://www.engadget.com/2015-02-25-lenovo-com-hacked.html) — deux noms que les enquêteurs d'Internet ont rapidement associés à Lizard Squad, le même groupe qui avait passé les fêtes de fin d'année précédentes à mettre hors ligne le PlayStation Network et le Xbox Live. Le groupe a revendiqué l'attaque sur Twitter, en citant les paroles de *High School Musical* à l'intention de Lenovo pour faire bonne mesure.

Et puis, la situation est devenue pire qu'embarrassante. Parce que les attaquants contrôlaient le DNS de lenovo.com, ils ne possédaient pas seulement le site web : ils possédaient la messagerie. Comme l'a souligné un média, ce détournement [signifiait qu'ils étaient également capables d'intercepter les e-mails de Lenovo](https://www.engadget.com/2015-02-25-lenovo-com-hacked.html), jusqu'à ce que la redirection soit désactivée. Lizard Squad a par la suite publié deux messages [envoyés à des employés de Lenovo](https://www.bankinfosecurity.com/lizard-squad-teases-lenovo-e-mail-grab-a-7953#:~:text=published%20two%20e%2Dmails) pendant la période où ils en avaient le contrôle. L'un d'eux, avec un timing comique et sinistre, [faisait référence à un ordinateur portable Lenovo Yoga qui s'était retrouvé "brické" (bloqué)](https://www.bankinfosecurity.com/lizard-squad-teases-lenovo-e-mail-grab-a-7953#:~:text=bricked) lorsqu'un client avait essayé d'exécuter le propre outil de Lenovo pour supprimer un logiciel appelé Superfish.

Ce détail résume à lui seul tout le mobile de l'attaque.

## Le contexte Superfish

Pour comprendre pourquoi Lenovo a été visé en particulier, il faut remonter cinq jours en arrière.

Superfish était un adware (logiciel publicitaire) que Lenovo [intégrait à certains de ses ordinateurs depuis septembre 2014](https://en.wikipedia.org/wiki/Superfish#:~:text=Lenovo%20began%20to%20bundle%20the%20software%20with%20some%20of%20its%20computers%20in%20September%202014). En apparence, ce n'était qu'un injecteur de publicités — un logiciel qui glissait des annonces supplémentaires pour des achats dans votre navigateur. Mais son fonctionnement s'est avéré catastrophique. Pour injecter des publicités dans des pages chiffrées, Superfish installait son propre certificat racine afin de pouvoir [introduire des publicités même sur des pages chiffrées](https://en.wikipedia.org/wiki/Superfish#:~:text=allows%20a%20man%2Din%2Dthe%2Dmiddle%20attack%20to%20introduce%20ads%20even%20on%20encrypted%20pages) — en d'autres termes, il brisait le cadenas qui protège le HTTPS.

Pire encore, le certificat utilisait la même clé privée sur chaque machine, et cette clé pouvait être craquée. Tout attaquant parvenant à l'extraire pouvait usurper l'identité de *n'importe quel* site web HTTPS auprès de *n'importe quel* ordinateur portable Lenovo exécutant Superfish. Il ne s'agissait pas d'une faille théorique. Le [20 février 2015, le département de la Sécurité intérieure des États-Unis a conseillé de le désinstaller](https://en.wikipedia.org/wiki/Superfish#:~:text=the%20United%20States%20Department%20of%20Homeland%20Security%20advised%20uninstalling%20it) ainsi que son certificat racine.

Ainsi, en l'espace d'une semaine, une entreprise qui vendait de la sécurité et de la confiance aux grandes entreprises avait expédié des millions d'ordinateurs portables dotés d'une vulnérabilité *man-in-the-middle* intégrée, puis avait vu son propre outil de suppression bloquer la machine d'au moins un client. Le détournement opéré par Lizard Squad a été présenté comme une protestation — [un goût de sa propre médecine](https://www.theregister.com/2015/02/25/lenovo_hacked_lizard_squad/#:~:text=sparked%20online%20uproar%20following%20the%20discovery%20of%20adware%20called%20Superfish) après le tollé suscité par Superfish. Le diaporama de webcams était une mise en scène théâtrale. Le message était clair : *vous avez brisé le chiffrement pour vos clients, nous allons donc briser votre vitrine pour vous.*

## Comment cela s'est produit : le bureau d'enregistrement était le point faible

![Art conceptuel vif et coloré d'un panneau de contrôle piraté avec des cadrans et interrupteurs de routage lumineux, une main sombre redirigeant la vitrine d'une marque et ses canaux de messagerie vers un nouveau chemin éclairé au néon, bleu sarcelle et magenta électriques, aucun logo de marque](../../assets/the-lenovo-com-dns-hijack-02-registrar-compromise.jpg)

Voici la partie qui devrait empêcher les RSSI (CISO) de dormir : la propre infrastructure de Lenovo n'a jamais été compromise.

Les attaquants s'en sont pris au bureau d'enregistrement. Les analystes en sécurité ont retracé le détournement jusqu'à une compromission de **Web Commerce Communications** — mieux connu sous le nom de **Webnic.cc**, un bureau d'enregistrement basé en Malaisie. Comme l'a expliqué Help Net Security, les pirates n'ont pas compromis les serveurs de Lenovo ; ils ont plutôt [compromis ceux de Web Commerce Communications (Webnic.cc)](https://www.helpnetsecurity.com/2015/02/26/lenovocom-hijacking-made-possible-by-compromise-of-webnic-registrar/), le bureau d'enregistrement auprès duquel le domaine Lenovo était enregistré.

Ce n'était pas la première mauvaise semaine pour Webnic. À peine deux jours plus tôt, le domaine vietnamien de Google avait été redirigé de la même manière. SecurityWeek a résumé le lien sans détour : Lizard Squad [a détourné Google Vietnam et les enregistrements DNS de Lenovo après avoir piraté les systèmes de WebNIC](https://www.securityweek.com/lizard-squad-hijacks-lenovo-website-emails/), un bureau d'enregistrement basé en Malaisie. Brian Krebs, citant les chercheurs qui ont mené l'enquête, a rapporté que [les deux détournements ont été possibles parce que les attaquants ont pris le contrôle de Webnic.cc](https://krebsonsecurity.com/2015/02/webnic-registrar-blamed-for-hijack-of-lenovo-google-domains/#:~:text=both%20hijacks%20were%20possible%20because%20the%20attackers%20seized%20control%20over%20Webnic.cc) — un bureau d'enregistrement qui, selon ces mêmes rapports, gérait ces deux domaines ainsi que 600 000 autres.

Le mécanisme de l'attaque, d'après les rapports de Krebs, ressemble à un cas d'école expliquant pourquoi un bureau d'enregistrement est une cible de choix :

- **La porte d'entrée.** Lizard Squad a utilisé une [vulnérabilité d'injection de commandes dans Webnic.cc pour télécharger un rootkit](https://krebsonsecurity.com/2015/02/webnic-registrar-blamed-for-hijack-of-lenovo-google-domains/#:~:text=command%20injection%20vulnerability%20in%20Webnic.cc%20to%20upload%20a%20rootkit) — leur donnant un accès persistant et caché aux systèmes du bureau d'enregistrement.
- **Les clés maîtresses.** Ils ont également [obtenu l'accès à la réserve de](https://krebsonsecurity.com/2015/02/webnic-registrar-blamed-for-hijack-of-lenovo-google-domains/#:~:text=also%20gained%20access%20to%20Webnic%27s%20store%20of) "codes d'autorisation" de Webnic — les secrets de transfert EPP qui permettent de transférer *n'importe quel* domaine vers un autre bureau d'enregistrement.
- **La redirection.** Avec un contrôle au niveau du bureau d'enregistrement, ils ont modifié les enregistrements des serveurs de noms de lenovo.com. The Register a noté que les [paramètres du serveur de noms du domaine ont été étrangement mis à jour aujourd'hui pour pointer vers des serveurs DNS appartenant à l'entreprise d'hébergement web CloudFlare](https://www.theregister.com/2015/02/25/lenovo_hacked_lizard_squad/#:~:text=nameserver%20settings%20were%20suspiciously%20updated%20today%20to%20point%20at%20DNS%20servers%20belonging%20to%20web%20hosting%20biz%20CloudFlare) — utilisant Cloudflare pour masquer le véritable serveur de destination.
- **Le vol d'e-mails.** Essentiellement, ils ne se sont pas arrêtés au site web. Ils ont [modifié les enregistrements de serveurs de messagerie, ce qui leur a permis d'intercepter les messages](https://www.securityweek.com/lizard-squad-hijacks-lenovo-website-emails/) envoyés aux adresses Lenovo. Le DNS contrôle bien plus que l'enregistrement `A` ; il contrôle également l'enregistrement `MX`. Posséder le domaine signifiait posséder la messagerie.

Ce dernier point est celui que l'on oublie souvent. Un piratage de page d'accueil est bruyant et évident. L'interception silencieuse des e-mails est la moitié la plus dangereuse d'un détournement DNS — et elle découle d'un même et unique acte : la modification d'un enregistrement chez le bureau d'enregistrement.

## Réponse et conséquences

Lenovo a réagi rapidement, car l'entreprise ne pouvait pas faire grand-chose d'autre : la solution se trouvait chez le bureau d'enregistrement, pas sur ses propres serveurs. La société a confirmé avoir été [victime d'une cyberattaque](https://www.securityweek.com/lizard-squad-hijacks-lenovo-website-emails/) dont l'effet a été de rediriger le trafic du site web de Lenovo, et il [semblait qu'elle avait restauré l'accès complet à son site public dès la soirée du 25 février](https://www.bankinfosecurity.com/lizard-squad-teases-lenovo-e-mail-grab-a-7953#:~:text=restored%20complete%20access%20to%20its%20public%20website%20by%20the%20evening%20of%20Feb.%2025). Cloudflare, constatant que son nom était utilisé dans la chaîne de redirection, a coupé l'accès aux serveurs de noms malveillants, ce qui a également mis fin à l'interception des e-mails.

Le plus gros du nettoyage incombait à Webnic. Un bug d'injection de commande chez un seul bureau d'enregistrement avait placé deux des domaines les plus précieux d'Internet — celui de Lenovo et une propriété de Google — entre les mains d'un groupe de hackers en quête de notoriété, et ce, en l'espace de 48 heures. L'incident est devenu une étude de cas permanente sur les risques liés aux bureaux d'enregistrement, et un rappel brutal que "600 000 autres domaines" se trouvaient derrière ce même système compromis.

Pour Lenovo, les dommages à long terme ont concerné sa réputation. Survenant quelques jours seulement après l'affaire Superfish, le détournement a transformé une grave défaillance de sécurité en une histoire en deux actes : d'abord, l'entreprise a trahi la confiance de ses propres clients, puis elle a visiblement perdu le contrôle de son propre nom. Le diaporama de webcams est ce que les gens ont retenu, mais la compromission du bureau d'enregistrement est ce qui a réellement eu de l'importance.

## Ce que cela nous apprend : votre bureau d'enregistrement est votre véritable périmètre

La leçon dérangeante de l'EP17 est que Lenovo a fait presque tout ce qu'il fallait sur les parties de son infrastructure qu'il contrôlait, mais s'est tout de même fait détourner via la partie qu'il ne contrôlait pas.

Voici quelques enseignements qui s'appliquent bien au-delà de l'année 2015 :

1. **Le bureau d'enregistrement se trouve dans votre périmètre de confiance, que vous le traitiez comme tel ou non.** Vous pouvez renforcer la sécurité de chaque serveur que vous possédez et tout de même perdre votre domaine chez un tiers que vous n'avez probablement jamais audité en termes de sécurité. L'attaquant choisit le chemin de moindre résistance — et le bureau d'enregistrement est souvent une cible plus facile que vous.
2. **Contrôler le DNS, c'est contrôler la messagerie.** Un détournement n'est pas seulement une page d'accueil défigurée. Le même changement d'enregistrement redirige silencieusement les e-mails, permettant l'interception, la réinitialisation de mots de passe sur vos propres services et l'usurpation d'identité. Considérez l'enregistrement `MX` comme un actif critique pour la sécurité, et non comme de la simple tuyauterie.
3. **Verrouillez ce qui peut l'être.** Les verrouillages de bureaux d'enregistrement (registrar-lock / `clientTransferProhibited`), l'accès restreint aux codes EPP/d'autorisation, et les verrous au niveau du registre pour les domaines de grande valeur existent précisément pour empêcher les modifications non autorisées de serveurs de noms et de transferts. Ils sont peu coûteux. Le risque de s'en passer, c'est de voir votre marque associée à un diaporama de webcams.
4. **DNSSEC augmente la difficulté pour les attaquants.** Il n'aurait pas empêché en soi la prise de contrôle d'un compte de bureau d'enregistrement, mais les zones signées et la surveillance du DNS rendent les falsifications silencieuses plus difficiles à réaliser sans être détectées.
5. **Surveillez votre propre DNS pour détecter toute dérive.** Le changement des serveurs de noms de Lenovo vers un fournisseur inattendu était le signe avant-coureur. Une surveillance continue des enregistrements NS et MX transforme le "nous l'avons découvert quand les clients ont vu un diaporama" en "nous avons été alertés dès que l'enregistrement a changé".

Le thème commun : le contrôle des domaines est un domaine de sécurité à part entière, et la plupart des entreprises l'ont externalisé à un prestataire qui n'apparaît jamais dans leur modèle de menace.

## L'approche Namefi

![Illustration colorée d'une propriété de domaine vérifiable et inviolable — une carte de domaine sécurisée par un bouclier vert, un jeton Namefi vert et une continuité DNS](../../assets/the-lenovo-com-dns-hijack-03-namefi-angle.jpg)

Le détournement de Lenovo est, à la base, un problème de contrôle et de provenance. L'attaquant n'avait pas besoin *d'être* Lenovo ; il lui suffisait de convaincre le système qui contrôle lenovo.com de pointer vers un nouvel emplacement. Il n'existait pas de registre solide, indépendant et vérifiable permettant de savoir qui contrôlait légitimement le domaine — juste un compte de bureau d'enregistrement qui a pu être discrètement pris d'assaut via une faille que personne chez Lenovo ne pouvait voir.

[Namefi](https://namefi.io) repose sur l'idée que les domaines doivent se comporter comme des actifs natifs d'Internet dotés d'une propriété vérifiable et inviolable. Lorsque le contrôle d'un domaine est ancré à une propriété cryptographique auditable et difficile à contourner silencieusement — plutôt qu'à un simple compte de bureau d'enregistrement doté d'un code d'autorisation récupérable —, un échange de serveur de noms non autorisé cesse d'être une modification discrète en arrière-plan pour devenir une rupture visible et prouvable dans la chaîne de possession. La propriété "tokenisée" permet au domaine de rester compatible avec le DNS tout en faisant de la question "qui contrôle ce nom, et cela vient-il de changer ?" une question à laquelle on peut répondre de manière vérifiable.

Lizard Squad a transformé la vitrine d'un géant du matériel informatique en une vaste farce le temps d'un après-midi, en exploitant le maillon le plus faible de la chaîne de propriété. La meilleure défense ne consiste pas à avoir un site web plus bruyant en matière d'alertes. Elle consiste à faire de la *propriété* du nom elle-même un élément qu'un attaquant ne pourra jamais falsifier silencieusement.

## Sources et lectures complémentaires

- Krebs on Security — [Le bureau d'enregistrement Webnic pointé du doigt pour le détournement des domaines de Lenovo et Google](https://krebsonsecurity.com/2015/02/webnic-registrar-blamed-for-hijack-of-lenovo-google-domains/)
- The Register — [Oh non, Lenovo ! Lizard Squad passe à l'attaque et affiche des e-mails volés](https://www.theregister.com/2015/02/25/lenovo_hacked_lizard_squad/)
- Engadget — [Le site web de Lenovo détourné, apparemment par Lizard Squad](https://www.engadget.com/2015-02-25-lenovo-com-hacked.html)
- SecurityWeek — [Lizard Squad détourne le site web et les e-mails de Lenovo](https://www.securityweek.com/lizard-squad-hijacks-lenovo-website-emails/)
- Help Net Security — [Le détournement de Lenovo.com rendu possible par la compromission du bureau d'enregistrement Webnic](https://www.helpnetsecurity.com/2015/02/26/lenovocom-hijacking-made-possible-by-compromise-of-webnic-registrar/)
- BankInfoSecurity — [Site web de Lenovo détourné](https://www.bankinfosecurity.com/lizard-squad-teases-lenovo-e-mail-grab-a-7953)
- IT Security Guru — [Le détournement de domaine par Lizard Squad donne le contrôle du site de Google Vietnam et de Lenovo](https://www.itsecurityguru.org/2015/02/26/lizard-squad-domain-hijack-gives-control-of-google-vietnam-and-lenovo-website/)
- CNBC — [Le site de Lenovo piraté, le groupe de hackers Lizard Squad revendique l'attaque](https://www.cnbc.com/2015/02/25/lenovo-website-breached-hacker-group-lizard-squad-claims-responsibility.html)
- We Live Security (ESET) — [Site web de Lenovo piraté, Lizard Squad revendique la responsabilité](https://www.welivesecurity.com/2015/02/26/lenovo-website-hacked-lizard-squad-claims-responsibility/)
- Computing — [Le site web de Lenovo détourné par Lizard Squad après la débâcle de Superfish](https://www.computing.co.uk/news/2397084/lenovo-website-hijacked-by-lizard-squad-after-superfish-debacle)
- Wikipedia — [Superfish](https://en.wikipedia.org/wiki/Superfish)
- CISA — [L'adware Lenovo Superfish vulnérable à l'usurpation HTTPS](https://www.cisa.gov/news-events/alerts/2015/02/20/lenovo-superfish-adware-vulnerable-to-https-spoofing)