---
title: "Le détournement DNS de Lenovo.com : quand Lizard Squad s'empara de la vitrine d'un géant du matériel"
date: '2026-06-17'
language: fr
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
description: "Le 25 février 2015, Lizard Squad a détourné Lenovo.com en compromettant le bureau d'enregistrement Webnic, redirigeant le domaine du plus grand fabricant de PC au monde vers un diaporama de webcam et interceptant ses e-mails — quelques jours après le scandale Superfish. Une analyse approfondie de Domain Mayday sur les raisons pour lesquelles le bureau d'enregistrement est votre véritable périmètre de sécurité."
keywords: ['détournement dns lenovo.com', 'lizard squad', 'webnic registrar', 'web commerce communications', 'dns hijacking', 'superfish', 'sécurité bureau enregistrement domaine', 'compromission registrar', 'epp auth code', 'interception email', 'détournement google vietnam', 'sécurité domaine', 'registrar lock']
---

Le matin du 25 février 2015, le lien le plus cliqué sur Internet pour le plus grand fabricant de PC au monde pointait vers un diaporama d'adolescents ennuyés fixant leurs webcams, sur fond de musique de *High School Musical*. Personne n'avait piraté un seul serveur Lenovo. Personne n'avait volé un seul mot de passe Lenovo. Les attaquants n'ont jamais mis les pieds dans le bâtiment, sur le réseau ni sur le site Web lui-même.

Ils ont modifié un seul enregistrement auprès du bureau d'enregistrement du domaine de l'entreprise — et cela a suffi pour s'emparer de la porte d'entrée de Lenovo, détourner son courrier et transformer sa marque en sujet de moquerie le temps d'un après-midi.

Voici **Domain Mayday EP17** : le détournement DNS de Lenovo.com. C'est une petite histoire en chiffres — quelques heures d'interruption de service, aucun système de production compromis, aucune base de données clients divulguée. Mais c'est l'une des démonstrations les plus limpides jamais réalisées d'une leçon que la plupart des entreprises comprennent encore mal : votre domaine n'est aussi sécurisé que le bureau d'enregistrement qui le détient, et ce bureau d'enregistrement ne fait presque jamais partie de votre programme de sécurité.

## Un géant du matériel dont le domaine est son visage

En 2015, Lenovo était le [plus grand fabricant de PC au monde](https://www.bankinfosecurity.com/lizard-squad-teases-lenovo-e-mail-grab-a-7953#:~:text=the%20world%27s%20largest%20PC%20manufacturer), expédiant plus d'ordinateurs portables et de bureau que quiconque sur Terre. Pour une entreprise de cette taille, lenovo.com n'est pas un actif marketing. C'est le cœur porteur de toute l'opération : là où les clients achètent, où arrivent les tickets d'assistance, où s'enregistrent les garanties, et — surtout — le domaine derrière chaque adresse e-mail `@lenovo.com` dans l'entreprise.

Quand une marque atteint cette envergure, le domaine cesse d'être une simple adresse de site Web pour devenir une infrastructure. Chaque communiqué de presse, chaque boîte de vente au détail, chaque signature d'employé, chaque confirmation de commande transite par lui. Ce qui signifie que quiconque contrôle le DNS du domaine contrôle non seulement le site Web, mais aussi la *vérité* sur là où pointe lenovo.com — pour les navigateurs et les serveurs de messagerie.

C'est le butin que Lizard Squad a convoité. Pas le site Web. Le pointeur vers celui-ci.

## 25 février 2015 : la redirection surréaliste

![Art conceptuel coloré et vivid d'une vitrine en verre d'entreprise dont l'enseigne lumineuse a été remplacée du jour au lendemain par un panneau de farce tape-à-l'œil, roses néon et bleus électriques, une foule regardant en haut avec confusion, pas de logos de marque](../../assets/the-lenovo-com-dns-hijack-01-hijack.jpg)

Dès cet après-midi-là, les visiteurs qui tapaient lenovo.com n'atteignaient pas Lenovo. Le site avait été remplacé par un [diaporama de photos de webcam d'enfants assis devant leur ordinateur](https://www.engadget.com/2015-02-25-lenovo-com-hacked.html), l'air vide et vaguement gêné, sur les sons de ["Breaking Free"](https://www.engadget.com/2015-02-25-lenovo-com-hacked.html) tiré de *High School Musical*. The Register décrivait la même scène comme un [diaporama de photos de webcam d'un jeune à l'air ennuyé](https://www.theregister.com/2015/02/25/lenovo_hacked_lizard_squad/#:~:text=slideshow%20of%20webcam%20photos%20of%20a%20bored%2Dlooking%20youth) à la place des produits habituels de l'entreprise.

C'était délibérément absurde, et l'absurdité était le message. Ce n'était pas un vol de données discret destiné à rester caché. C'était une humiliation publique, mise en scène sur l'URL la plus visible que l'entreprise possédait.

L'attribution était visible pour qui voulait la voir. L'HTML de la page de remplacement créditait sa construction "nouvelle et améliorée rebaptisée" à [Ryan King et Rory Andrew Godfrey](https://www.engadget.com/2015-02-25-lenovo-com-hacked.html) — deux noms que les enquêteurs d'Internet ont rapidement reliés à Lizard Squad, le même groupe qui avait passé les vacances précédentes à mettre hors ligne le PlayStation Network et Xbox Live. Le groupe a revendiqué l'attaque sur Twitter, citant les paroles de *High School Musical* en réponse à Lenovo, pour faire bonne mesure.

Et puis ça a empiré. Parce que les attaquants contrôlaient le DNS de lenovo.com, ils ne possédaient pas seulement le site Web — ils possédaient le courrier. Comme l'a formulé un article, le détournement [permettait d'intercepter les e-mails de Lenovo](https://www.engadget.com/2015-02-25-lenovo-com-hacked.html), jusqu'à ce que la redirection soit coupée. Lizard Squad a ensuite publié deux messages [envoyés à des employés de Lenovo](https://www.bankinfosecurity.com/lizard-squad-teases-lenovo-e-mail-grab-a-7953#:~:text=published%20two%20e%2Dmails) pendant la fenêtre de contrôle. L'un d'eux, avec une ironie d'un humour sombre, [mentionnait un ordinateur Lenovo Yoga "bricollé"](https://www.bankinfosecurity.com/lizard-squad-teases-lenovo-e-mail-grab-a-7953#:~:text=bricked) lorsqu'un client avait essayé d'utiliser le propre outil de Lenovo pour supprimer un logiciel appelé Superfish.

Ce détail résume à lui seul toute la motivation.

## Le contexte Superfish

Pour comprendre pourquoi Lenovo spécifiquement, il faut remonter cinq jours en arrière.

Superfish était un adware que Lenovo avait [intégré dans certains de ses ordinateurs depuis septembre 2014](https://en.wikipedia.org/wiki/Superfish#:~:text=Lenovo%20began%20to%20bundle%20the%20software%20with%20some%20of%20its%20computers%20in%20September%202014). En apparence, c'était simplement un injecteur de publicités — un logiciel qui glissait des annonces supplémentaires dans votre navigateur. Mais son fonctionnement était catastrophique. Pour injecter des publicités dans des pages chiffrées, Superfish installait son propre certificat racine afin de pouvoir [introduire des publicités même sur les pages chiffrées](https://en.wikipedia.org/wiki/Superfish#:~:text=allows%20a%20man%2Din%2Dthe%2Dmiddle%20attack%20to%20introduce%20ads%20even%20on%20encrypted%20pages) — en d'autres termes, il brisait le cadenas qui protège HTTPS.

Pire encore, le certificat utilisait la même clé privée sur chaque machine, et cette clé pouvait être cassée. Tout attaquant qui l'extrayait pouvait usurper l'identité de *n'importe quel* site HTTPS auprès de *n'importe quel* ordinateur portable Lenovo tournant sous Superfish. Ce n'était pas une faille théorique. Le [20 février 2015, le Département américain de la Sécurité intérieure a conseillé de le désinstaller](https://en.wikipedia.org/wiki/Superfish#:~:text=the%20United%20States%20Department%20of%20Homeland%20Security%20advised%20uninstalling%20it) ainsi que son certificat racine.

Ainsi, en l'espace d'une semaine, une entreprise qui vendait sécurité et confiance aux entreprises avait expédié des millions d'ordinateurs portables avec une vulnérabilité d'attaque de l'homme du milieu intégrée, puis avait vu son propre outil de suppression endommager au moins la machine d'un client. Le détournement de Lizard Squad s'est présenté comme une protestation — [un remède de même nature](https://www.theregister.com/2015/02/25/lenovo_hacked_lizard_squad/#:~:text=sparked%20online%20uproar%20following%20the%20discovery%20of%20adware%20called%20Superfish) après le tollé Superfish. Le diaporama de webcam était du théâtre. Le message était : *vous avez cassé le chiffrement pour vos clients, alors on va casser votre porte d'entrée pour vous.*

## Comment c'est arrivé : le bureau d'enregistrement était le maillon faible

![Art conceptuel coloré et vivid d'un tableau de commande détourné avec des cadrans et commutateurs de routage lumineux, une main fantomatique redirigeant la porte d'entrée d'une marque et ses tuyaux de courrier vers un nouveau chemin éclairé au néon, bleu sarcelle électrique et magenta, pas de logos de marque](../../assets/the-lenovo-com-dns-hijack-02-registrar-compromise.jpg)

Voici ce qui devrait tenir les RSSI éveillés la nuit : l'infrastructure propre de Lenovo n'a jamais été compromise.

Les attaquants ont plutôt ciblé le bureau d'enregistrement. Les analystes en sécurité ont retracé le détournement jusqu'à une compromission de **Web Commerce Communications** — mieux connu sous le nom de **Webnic.cc**, un bureau d'enregistrement basé en Malaisie. Comme Help Net Security l'a indiqué, les pirates n'ont pas compromis les serveurs de Lenovo ; ils ont plutôt [compromis ceux de Web Commerce Communications (Webnic.cc)](https://www.helpnetsecurity.com/2015/02/26/lenovocom-hijacking-made-possible-by-compromise-of-webnic-registrar/), le bureau d'enregistrement auprès duquel le domaine Lenovo était enregistré.

Ce n'était pas la première mauvaise semaine de Webnic. Seulement deux jours plus tôt, le domaine vietnamien de Google avait été redirigé de la même façon. SecurityWeek a résumé le lien sans détours : Lizard Squad [a détourné les enregistrements DNS de Google Vietnam et Lenovo après avoir violé les systèmes de WebNIC](https://www.securityweek.com/lizard-squad-hijacks-lenovo-website-emails/), un bureau d'enregistrement basé en Malaisie. Brian Krebs, citant les chercheurs qui ont enquêté, a rapporté que [les deux détournements ont été possibles parce que les attaquants ont pris le contrôle de Webnic.cc](https://krebsonsecurity.com/2015/02/webnic-registrar-blamed-for-hijack-of-lenovo-google-domains/#:~:text=both%20hijacks%20were%20possible%20because%20the%20attackers%20seized%20control%20over%20Webnic.cc) — un bureau d'enregistrement qui, selon le même reportage, gérait ces deux domaines et 600 000 autres.

Les mécanismes, d'après le reportage de Krebs, se lisent comme un manuel sur la raison pour laquelle un bureau d'enregistrement est une cible tentante :

- **Le point d'entrée.** Lizard Squad a utilisé une [vulnérabilité d'injection de commande dans Webnic.cc pour téléverser un rootkit](https://krebsonsecurity.com/2015/02/webnic-registrar-blamed-for-hijack-of-lenovo-google-domains/#:~:text=command%20injection%20vulnerability%20in%20Webnic.cc%20to%20upload%20a%20rootkit) — leur donnant un accès persistant et caché aux systèmes du bureau d'enregistrement.
- **Les clés maîtresses.** Ils ont également [obtenu l'accès au stock de](https://krebsonsecurity.com/2015/02/webnic-registrar-blamed-for-hijack-of-lenovo-google-domains/#:~:text=also%20gained%20access%20to%20Webnic%27s%20store%20of) codes d'autorisation (auth codes) de Webnic — les secrets de transfert EPP qui permettent de déplacer *n'importe quel* domaine vers un autre bureau d'enregistrement.
- **La redirection.** Avec un contrôle au niveau du bureau d'enregistrement, ils ont modifié les enregistrements de [serveur de noms](/fr/glossary/nameserver/) de lenovo.com. The Register a noté que les [paramètres du serveur de noms du domaine avaient été suspicieusement mis à jour ce jour-là pour pointer vers des serveurs DNS appartenant à la société d'hébergement web CloudFlare](https://www.theregister.com/2015/02/25/lenovo_hacked_lizard_squad/#:~:text=nameserver%20settings%20were%20suspiciously%20updated%20today%20to%20point%20at%20DNS%20servers%20belonging%20to%20web%20hosting%20biz%20CloudFlare) — utilisant Cloudflare pour masquer le véritable serveur de destination.
- **La capture du courrier.** Crucialement, ils ne se sont pas arrêtés au site Web. Ils ont [modifié les enregistrements du serveur de messagerie pour pouvoir intercepter les messages](https://www.securityweek.com/lizard-squad-hijacks-lenovo-website-emails/) envoyés aux adresses Lenovo. Le DNS contrôle plus que l'enregistrement `A` ; il contrôle aussi l'enregistrement `MX`. Posséder le domaine signifiait posséder le courrier.

Ce dernier point est celui que les gens oublient. Un défacement est bruyant et évident. L'interception silencieuse des e-mails est la moitié dangereuse d'un détournement DNS — et elle découle du même acte unique de modification d'un enregistrement auprès du bureau d'enregistrement.

## Réponse et répercussions

Lenovo a agi vite, car il n'avait guère d'autre choix — la solution se trouvait au niveau du bureau d'enregistrement, pas sur ses propres serveurs. L'entreprise a confirmé avoir été [victime d'une cyberattaque](https://www.securityweek.com/lizard-squad-hijacks-lenovo-website-emails/) dont l'effet était de rediriger le trafic depuis le site Web Lenovo, et elle [semblait avoir restauré l'accès complet à son site Web public dans la soirée du 25 février](https://www.bankinfosecurity.com/lizard-squad-teases-lenovo-e-mail-grab-a-7953#:~:text=restored%20complete%20access%20to%20its%20public%20website%20by%20the%20evening%20of%20Feb.%2025). Cloudflare, trouvant son nom utilisé dans la chaîne de redirection, a coupé les serveurs de noms malveillants, ce qui a également mis fin à l'interception des e-mails.

Le plus grand nettoyage revenait à Webnic. Un seul bug d'injection de commande chez un bureau d'enregistrement avait mis deux des domaines les plus précieux d'Internet — celui de Lenovo et une propriété de Google — entre les mains d'un groupe de pirates en mal de sensationnel, sur une période de 48 heures. L'incident est devenu une étude de cas permanente sur le risque lié aux bureaux d'enregistrement, et un rappel que "600 000 autres domaines" se trouvaient derrière le même système compromis.

Pour Lenovo, les dommages durables étaient de nature réputationnelle. Survenant quelques jours après Superfish, le détournement a transformé un grave échec de sécurité en une histoire en deux actes : d'abord l'entreprise a trahi la confiance de ses propres clients, puis elle a visiblement perdu le contrôle de son propre nom. Le diaporama de webcam est ce dont les gens se souviennent, mais la compromission du bureau d'enregistrement est ce qui a réellement compté.

## Ce que cela enseigne : votre bureau d'enregistrement est votre véritable périmètre

La leçon inconfortable de l'EP17 est que Lenovo a bien fait les choses sur les parties qu'il contrôlait, et s'est quand même fait détourner via la partie qu'il ne contrôlait pas.

Quelques enseignements qui se généralisent bien au-delà de 2015 :

1. **Le bureau d'enregistrement fait partie de votre périmètre de confiance, que vous le traitiez ainsi ou non.** Vous pouvez renforcer chaque serveur que vous possédez et perdre quand même votre domaine chez un tiers que vous n'avez probablement jamais soumis à une audit de sécurité. L'attaquant emprunte le chemin de moindre résistance — et le bureau d'enregistrement est souvent plus vulnérable que vous.
2. **Contrôler le DNS, c'est contrôler le courrier.** Un détournement n'est pas seulement une page d'accueil défigurée. La même modification d'enregistrement redirige silencieusement les e-mails, permettant l'interception, les réinitialisations de mots de passe sur votre domaine et l'usurpation d'identité. Traitez l'enregistrement `MX` comme un actif critique pour la sécurité, pas comme de la plomberie.
3. **Verrouillez ce qui peut l'être.** Les verrous de bureau d'enregistrement (registrar-lock / `clientTransferProhibited`), l'accès restreint aux codes EPP/auth, et les verrous au niveau du [registre](/fr/glossary/registry/) pour les domaines de grande valeur existent précisément pour empêcher les modifications non autorisées des serveurs de noms et les transferts. Ils sont peu coûteux. L'inconvénient de les ignorer, c'est votre marque sur un diaporama de webcam.
4. **[DNSSEC](/fr/glossary/dnssec/) augmente le coût.** Cela n'aurait pas suffi à empêcher une prise de contrôle du compte du bureau d'enregistrement en soi, mais les zones signées et la surveillance DNS rendent la falsification silencieuse plus difficile à réaliser sans être détecté.
5. **Surveillez votre propre DNS pour détecter toute dérive.** Le changement des serveurs de noms de Lenovo vers un fournisseur inattendu était le signe révélateur. La surveillance continue des enregistrements NS et MX transforme "on l'a su quand les clients ont vu un diaporama" en "on a reçu une alerte quand l'enregistrement a changé."

Le thème commun : le contrôle de domaine est un domaine de sécurité à part entière, et la plupart des entreprises l'ont externalisé à un fournisseur qui n'apparaît jamais dans leur modèle de menace.

## L'angle Namefi

![Illustration colorée d'une propriété de domaine vérifiable et résistante à la falsification — une carte de domaine sécurisée par un bouclier vert, un jeton Namefi vert, et la continuité DNS](../../assets/the-lenovo-com-dns-hijack-03-namefi-angle.jpg)

Le détournement de Lenovo est, à sa source, un problème de contrôle et de provenance. L'attaquant n'avait pas besoin d'*être* Lenovo ; il avait seulement besoin de convaincre le système qui contrôle lenovo.com de pointer vers un nouvel endroit. Il n'existait pas d'enregistrement fort, indépendant et vérifiable de qui contrôle légitimement le domaine — juste un compte de bureau d'enregistrement qui pouvait être silencieusement conquis via une vulnérabilité qu'aucun employé de Lenovo ne pouvait voir.

[Namefi](https://namefi.io) est construit autour de l'idée que les domaines devraient se comporter comme des actifs natifs d'Internet avec une propriété vérifiable et résistante à la falsification. Lorsque le contrôle d'un domaine est ancré dans une propriété cryptographique auditable et difficile à supplanter silencieusement — plutôt que dans un seul compte de bureau d'enregistrement avec un code d'autorisation récupérable — un swap de serveur de noms non autorisé cesse d'être une modification discrète en coulisses et devient une rupture visible et prouvable dans la chaîne de garde. La propriété tokenisée maintient le domaine compatible avec le DNS tout en faisant de "qui contrôle ce nom, et est-ce que cela vient de changer ?" une question avec une réponse vérifiable.

Lizard Squad a transformé la porte d'entrée d'un géant du matériel en farce en un après-midi en exploitant le maillon le plus faible de la chaîne de propriété. La défense n'est pas un site Web plus bruyant. C'est faire de la *propriété* du nom lui-même quelque chose qu'un attaquant ne peut pas silencieusement forger.

## Sources et lectures complémentaires

- Krebs on Security — [Webnic Registrar Blamed for Hijack of Lenovo, Google Domains](https://krebsonsecurity.com/2015/02/webnic-registrar-blamed-for-hijack-of-lenovo-google-domains/)
- The Register — [Oh No, Lenovo! Lizard Squad on the attack, flashes swiped emails](https://www.theregister.com/2015/02/25/lenovo_hacked_lizard_squad/)
- Engadget — [Lenovo's website hijacked, apparently by Lizard Squad](https://www.engadget.com/2015-02-25-lenovo-com-hacked.html)
- SecurityWeek — [Lizard Squad Hijacks Lenovo Website, Emails](https://www.securityweek.com/lizard-squad-hijacks-lenovo-website-emails/)
- Help Net Security — [Lenovo.com hijacking made possible by compromise of Webnic registrar](https://www.helpnetsecurity.com/2015/02/26/lenovocom-hijacking-made-possible-by-compromise-of-webnic-registrar/)
- BankInfoSecurity — [Lenovo Website Hijacked](https://www.bankinfosecurity.com/lizard-squad-teases-lenovo-e-mail-grab-a-7953)
- IT Security Guru — [Lizard Squad domain hijack gives control of Google Vietnam and Lenovo website](https://www.itsecurityguru.org/2015/02/26/lizard-squad-domain-hijack-gives-control-of-google-vietnam-and-lenovo-website/)
- CNBC — [Lenovo website breached, hacker group Lizard Squad claims responsibility](https://www.cnbc.com/2015/02/25/lenovo-website-breached-hacker-group-lizard-squad-claims-responsibility.html)
- We Live Security (ESET) — [Lenovo website hacked, Lizard Squad claims responsibility](https://www.welivesecurity.com/2015/02/26/lenovo-website-hacked-lizard-squad-claims-responsibility/)
- Computing — [Lenovo website hijacked by Lizard Squad after Superfish debacle](https://www.computing.co.uk/news/2397084/lenovo-website-hijacked-by-lizard-squad-after-superfish-debacle)
- Wikipedia — [Superfish](https://en.wikipedia.org/wiki/Superfish)
- CISA — [Lenovo Superfish Adware Vulnerable to HTTPS Spoofing](https://www.cisa.gov/news-events/alerts/2015/02/20/lenovo-superfish-adware-vulnerable-to-https-spoofing)
