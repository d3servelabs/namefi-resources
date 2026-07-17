---
title: 'Le Vol du Domaine Perl.com : Comment la Maison d''une Communauté Vieille de 30 Ans a Été Discrètement Dérobée'
date: '2026-06-17'
language: fr
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['fenwei-bian']
editors: ['victor-zhou']
translators: ['alan-machin']
draft: false
description: 'Fin janvier 2021, perl.com — la maison historique de la communauté de programmation Perl — a été volé via une compromission de compte chez un registrar, transféré à travers la Chine, pointé vers une adresse IP liée à des logiciels malveillants, et mis en vente à 190 000 $. Voici comment cela s''est produit, comment le domaine a été récupéré, et ce que cela nous enseigne sur la sécurité des comptes registrar.'
keywords: ['perl.com', 'vol du domaine perl.com', 'détournement de domaine', 'vol de domaine', 'compromission de compte registrar', 'ingénierie sociale', 'Network Solutions', 'Tom Christiansen', 'brian d foy', 'détournement DNS', 'sécurité des domaines', 'prise de contrôle de compte', 'BizCN']
relatedArticles:
  - /fr/blog/the-panix-com-domain-hijack/
  - /fr/blog/the-lenovo-com-dns-hijack/
  - /fr/blog/the-fox-it-dns-hijack/
  - /fr/blog/the-godaddy-multi-year-breach/
  - /fr/blog/the-curve-finance-dns-hijack/
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
  - /fr/glossary/registry/
  - /fr/glossary/tld/
---

Certains domaines sont des infrastructures qui ressemblent à des noms. **perl.com** en fait partie. Ce n'est pas un actif marketing ni une marque créée l'an dernier — c'est un meuble d'internet autour duquel la communauté de programmation Perl vit depuis les débuts du web, la porte d'entrée canonique vers la documentation, les articles et le visage public du langage.

Ainsi, lorsque, le matin du 27 janvier 2021, cette porte d'entrée appartenait soudainement à quelqu'un d'autre, il ne s'agissait pas d'un coup marketing habile ni d'une vente négociée. C'était un vol. Le domaine avait été discrètement arraché au contrôle de son propriétaire légitime des mois plus tôt, balloté d'un registrar à l'autre, et pointé vers une [adresse IP](/fr/glossary/ip-address/) avec un historique de distribution de logiciels malveillants. Les opérateurs réseau de la communauté l'ont dit sans détour : ["Le domaine perl.com a été détourné ce matin et pointe actuellement vers un site de parking."](https://log.perl.org/2021/01/perlcom-hijacked.html#:~:text=The%20perl.com%20domain%20was%20hijacked%20this%20morning%2C%20and%20is%20currently%20pointing%20to%20a%20parking%20site.)

Voici l'histoire de l'EP19 de notre série Domain Mayday : comment un domaine communautaire vieux de trente ans a été volé sans que personne ne pirate le moindre serveur, et ce qu'il a fallu pour le récupérer.

## Un domaine détenu depuis le début des années 90

Pour comprendre le vol, il faut comprendre à quel point la configuration était ordinaire — et comment cette banalité constituait la vulnérabilité.

perl.com n'était pas conservé dans un coffre-fort d'entreprise ultra-sécurisé. Il était géré comme la plupart des domaines anciens : par une personne de confiance, chez un registrar classique, renouvelé d'année en année sans incident. L'éditeur du site, brian d foy, a ensuite décrit la généalogie dans son propre compte rendu de l'incident : ["Ce domaine a été enregistré au début des années 90, Tom Christiansen en a obtenu le contrôle peu après, et il a essentiellement continué à payer les frais d'enregistrement."](https://www.perl.com/article/the-hijacking-of-perl-com/#:~:text=This%20domain%20was%20registered%20in%20the%20early%2090s%2C%20Tom%20Christiansen%20was%20given%20control%20of%20it%20shortly%20after%20that%2C%20and%20basically%20kept%20paying%20the%20registration%20fees.)

C'est le profil type d'une grande partie des noms les plus importants d'internet. Une personne, un identifiant registrar, et trois décennies de règlements discrets. Ça fonctionne parfaitement — jusqu'au moment où le compte registrar lui-même devient la cible.

## 27 janvier 2021 : la porte d'entrée change de serrure

![Art conceptuel coloré et vif d'un panneau communautaire en bois vieux de plusieurs décennies que l'on dévisse discrètement de son poteau la nuit et que l'on emporte, sur fond de ciel lumineux en circuit imprimé](../../assets/the-perl-com-domain-theft-01-theft.jpg)

La première alerte publique est venue des personnes qui gèrent l'infrastructure de la communauté Perl. Le blog Perl NOC (Network Operations Center) a publié que le domaine avait été détourné « ce matin » et pointait maintenant vers un endroit inapproprié. Pire qu'une simple page de parking, les opérateurs ont averti qu'il y avait ["des signaux indiquant que cela pourrait être lié à des sites qui ont distribué des logiciels malveillants par le passé."](https://log.perl.org/2021/01/perlcom-hijacked.html#:~:text=there%20are%20some%20signals%20that%20it%20may%20be%20related%20to%20sites%20that%20have%20distributed%20malware%20in%20the%20past.)

brian d foy l'a rendu public le même jour. Les reportages sur l'incident ont confirmé la chronologie en termes clairs : ["Le 27 janvier, l'auteur de programmation Perl et éditeur de Perl.com brian d foy a tweeté que le domaine perl.com était soudainement enregistré sous le nom d'une autre personne."](https://www.bleepingcomputer.com/news/security/perlcom-domain-stolen-now-using-ip-address-tied-to-malware/#:~:text=On%20January%2027th%2C%20Perl%20programming%20author%20and%20Perl.com%20editor%20brian%20d%20foy)

La réaction de la communauté a été rapide et pragmatique. Pendant que le travail de récupération commençait, le NOC a redirigé les lecteurs vers une sauvegarde : ["Si vous cherchez le contenu, vous pouvez visiter perldotcom.perl.org."](https://log.perl.org/2021/01/perlcom-hijacked.html#:~:text=you%20can%20visit%20perldotcom.perl.org) Le nom canonique avait disparu, mais le contenu restait accessible.

## Ce qui était en jeu : une adresse IP liée aux logiciels malveillants

Un domaine volé est dangereux en proportion de la confiance qu'il porte — et perl.com en portait beaucoup. Des millions de développeurs, tutoriels, outils CPAN et anciens liens sur le web pointaient tous vers lui. Quiconque contrôlait le nom contrôlait vers quoi toute cette confiance se résolvait.

Et le nouveau propriétaire ne l'a pas pointé vers quelque chose d'inoffensif. Comme l'a documenté BleepingComputer, ["Le nom de domaine perl.com a été volé et pointe maintenant vers une adresse IP associée à des campagnes de logiciels malveillants."](https://www.bleepingcomputer.com/news/security/perlcom-domain-stolen-now-using-ip-address-tied-to-malware/#:~:text=The%20domain%20name%20perl.com%20was%20stolen%20and%20now%20points%20to%20an%20IP%20address%20associated%20with%20malware%20campaigns.)

Les empreintes techniques étaient précises. Les enregistrements DNS ont été réécrits de sorte que ["les adresses IP assignées au domaine ont été changées de 151.101.2.132 à l'adresse IP Google Cloud 35.186.238[.]101."](https://www.bleepingcomputer.com/news/security/perlcom-domain-stolen-now-using-ip-address-tied-to-malware/#:~:text=the%20IP%20addresses%20assigned%20to%20the%20domain%20were%20changed%20from%20151.101.2.132%20to%20the%20Google%20Cloud%20IP%20address) Cette destination avait un passé : ["En 2019, l'adresse IP 35.186.238[.]101 était liée à un domaine distribuant un exécutable malveillant pour le ransomware Locky, aujourd'hui disparu."](https://www.bleepingcomputer.com/news/security/perlcom-domain-stolen-now-using-ip-address-tied-to-malware/#:~:text=In%202019%2C%20the%20IP%20address%2035.186.238%5B.%5D101%20was%20tied%20to%20a%20domain%20distributing%20a%20malware%20executable%20for%20the%20now%2Ddefunct%20Locky%20ransomware.)

En combinant ces deux faits, le danger est évident. Un nom que les développeurs font confiance par réflexe, se résolvant soudainement vers une adresse IP avec un historique de logiciels malveillants, constitue une configuration quasi-parfaite pour tromper exactement le type d'audience technique et soucieuse de sécurité qui est normalement difficile à duper.

## Comment cela s'est produit : le compte registrar, pas le serveur

![Art conceptuel coloré et vif d'un faux formulaire de changement de propriété glissé sur un bureau d'un service de registre, un tampon officiel rouge brillant, des papiers tourbillonnant dans une lumière néon — sans logos de marque](../../assets/the-perl-com-domain-theft-02-account-compromise.jpg)

Voici la partie qui fait de cet incident un cas d'école plutôt qu'une simple anecdote : personne n'a piraté le serveur web de perl.com, et personne n'a deviné un mot de passe DNS. L'attaque s'est produite un niveau au-dessus, chez le registrar — la société qui détient l'enregistrement faisant autorité sur l'identité du propriétaire du nom.

Dans son post-mortem, brian d foy a décrit directement la théorie de travail : ["Nous pensons qu'il y a eu une attaque d'ingénierie sociale contre Network Solutions, incluant de faux documents et autres."](https://www.perl.com/article/the-hijacking-of-perl-com/#:~:text=We%20think%20that%20there%20was%20a%20social%20engineering%20attack%20on%20Network%20Solutions%2C%20including%20phony%20documents%20and%20so%20on.) La presse a formulé les choses de la même façon : le vol était ["une attaque d'ingénierie sociale qui a convaincu le registrar Network Solutions de modifier les enregistrements du domaine sans autorisation valide."](https://www.theregister.com/2021/03/02/perl_domain_theft/#:~:text=a%20social%20engineering%20attack%20that%20convinced%20registrar%20Network%20Solutions%20to%20alter%20the%20domain%27s%20records%20without%20valid%20authorization)

Le détail le plus troublant est la chronologie. La communauté ne l'a *remarqué* qu'en janvier, mais la compromission réelle remontait à bien plus tôt. Un travail forensique fourni par l'avocat spécialisé en noms de domaine John Berryhill a repoussé la date réelle de plusieurs mois ; comme le consigne le compte perl.com, ["John Berryhill a fourni un travail forensique sur Twitter montrant que la compromission s'est en réalité produite en septembre."](https://www.perl.com/article/the-hijacking-of-perl-com/#:~:text=John%20Berryhill%20provided%20some%20forensic%20work%20in%20Twitter%20that%20showed%20the%20compromise%20actually%20happened%20in%20September.) SecurityWeek a confirmé la patience de l'attaquant : ["L'attaque, explique-t-il, a eu lieu en septembre 2020"](https://www.securityweek.com/hackers-control-perlcom-domain-months-hijack/#:~:text=The%20attack%2C%20he%20explains%2C%20took%20place%20in%20September%202020) — environ quatre mois avant que quiconque en voie les effets.

Pourquoi une si longue attente ? Parce que les règles de transfert de domaine récompensent la patience. ["L'ICANN interdit le transfert d'un domaine pendant 60 jours suivant la mise à jour des informations de contact."](https://www.securityweek.com/hackers-control-perlcom-domain-months-hijack/#:~:text=ICANN%20prohibits%20the%20transfer%20of%20a%20domain%20for%2060%20days%20following%20the%20updating%20of%20contact%20info.) Un attaquant qui s'empare discrètement d'un compte registrar en septembre ne peut pas immédiatement transférer le domaine — il a donc attendu, laissé le délai s'écouler, et a agi une fois le verrou expiré.

Quand ils ont finalement bougé, ils ont blanchi le nom à travers des registrars et des frontières pour compliquer la récupération. The Register a documenté le premier saut : ["Le domaine a été transféré au registrar BizCN en décembre, mais les serveurs de noms n'ont pas été modifiés."](https://www.theregister.com/2021/03/02/perl_domain_theft/#:~:text=The%20domain%20was%20transferred%20to%20the%20BizCN%20registrar%20in%20December%2C%20but%20the%20nameservers%20were%20not%20changed) BleepingComputer a retracé le même chemin géographiquement : le domaine ["a été volé en septembre 2020 alors qu'il était chez Network Solutions, transféré vers un registrar en Chine le jour de Noël"](https://www.bleepingcomputer.com/news/security/perlcom-domain-stolen-now-using-ip-address-tied-to-malware/#:~:text=stolen%20in%20September%202020%20while%20at%20Network%20Solutions%2C%20transferred%20to%20a%20registrar%20in%20China%20on%20Christmas%20Day) avant le saut final en janvier, quand ["Le domaine a été à nouveau transféré en janvier vers un autre registrar, Key Systems, GmbH."](https://www.theregister.com/2021/03/02/perl_domain_theft/#:~:text=The%20domain%20was%20transferred%20again%20in%20January%20to%20another%20registrar%2C%20Key%20Systems%2C%20GmbH.)

Puis ils ont tenté de monnayer leur coup. Avec le nom fraîchement relocalisé, ["le titulaire non autorisé a tenté de vendre le domaine à 190 000 $ sur le marché de domaines Afternic."](https://www.theregister.com/2021/03/02/perl_domain_theft/#:~:text=the%20unauthorized%20registrant%20tried%20to%20sell%20the%20domain%20for%20%24190%2C000%20on%20domain%20market%20Afternic.) Un actif communautaire vieux de trente ans, volé par paperasse, mis en vente comme un meuble d'occasion.

## La récupération : des semaines de paperasse pour défaire la paperasse

La même machinerie qui avait permis le vol — registrars, registres et enregistrements de propriété — était aussi le seul chemin de retour. Il n'y avait pas de serveur à re-sécuriser ni de correctif à déployer. Quelqu'un devait *prouver*, à travers la chaîne de registrars et de registres, que Tom Christiansen était le vrai propriétaire et que le nouveau « propriétaire » était un fraudeur.

Ce travail a commencé dans les jours suivants. Le 30 janvier, le Perl NOC rapportait que ["Network Solutions travaille avec Tom Christiansen, le titulaire légitime, sur la récupération du domaine Perl.com."](https://log.perl.org/2021/01/perlcom-hijacked.html#:~:text=Network%20Solutions%20is%20working%20with%20Tom%20Christiansen%2C%20the%20rightful%20registrant%2C%20on%20the%20recovery%20of%20the%20Perl.com%20domain.) La démarche ["a finalement conduit à la restitution du domaine à son ancien propriétaire, Tom Christiansen, début février."](https://www.theregister.com/2021/03/02/perl_domain_theft/#:~:text=restoration%20of%20the%20domain%20to%20its%20previous%20owner%2C%20Tom%20Christiansen%2C%20in%20early%20February.)

Mais « restitué » ne signifiait pas « réparé ». La formulation de brian d foy lui-même capture à la fois le soulagement et le travail inachevé : ["Le domaine Perl.com est de nouveau entre les mains de Tom Christiansen et nous travaillons sur les diverses mises à jour de sécurité pour que cela ne se reproduise pas."](https://www.perl.com/article/the-hijacking-of-perl-com/#:~:text=The%20Perl.com%20domain%20is%20back%20in%20the%20hands%20of%20Tom%20Christiansen%20and%20we%27re%20working%20on%20the%20various%20security%20updates%20so%20this%20doesn%27t%20happen%20again.) Parce que le domaine avait pointé vers une adresse IP liée à des logiciels malveillants, les produits de sécurité l'avaient blacklisté et certains résolveurs DNS l'avaient mis en sinkhole. Même après que l'enregistrement au [registre](/fr/glossary/registry/) était correct, il a fallu des semaines supplémentaires pour que le nom soit de nouveau considéré comme fiable dans les systèmes de réputation d'internet — une longue traîne qui a étiré l'épreuve sur environ deux mois au total.

Le bilan, dans les mots de foy, était presque sobre : ["Pendant une semaine, nous avons perdu le contrôle du domaine Perl.com."](https://www.perl.com/article/the-hijacking-of-perl-com/#:~:text=For%20a%20week%20we%20lost%20control%20of%20the%20Perl.com%20domain.) Une semaine de vol actif ; des mois de compromission latente avant ; des semaines de nettoyage après.

## Ce que cela enseigne sur la sécurité des comptes registrar et les domaines de longue date

Le vol de perl.com est si instructif précisément parce que rien d'exotique ne s'est produit. En le dépouillant de son contexte, les leçons sont d'une généralité inconfortable :

1. **Votre compte registrar est le véritable joyau de la couronne.** Tout le monde renforce ses serveurs et son hébergeur DNS. Mais l'*enregistrement de propriété* du domaine vit chez le registrar, et ce compte est souvent protégé par rien de plus qu'un mot de passe et une équipe de support que l'on peut convaincre d'effectuer des modifications. perl.com a été volé là, pas à la périphérie.

2. **L'ingénierie sociale surpasse les contrôles techniques.** Aucun exploit, aucun logiciel malveillant du côté de la victime — juste des ["faux documents et autres"](https://www.perl.com/article/the-hijacking-of-perl-com/#:~:text=including%20phony%20documents%20and%20so%20on.) suffisamment convaincants pour déplacer un vrai enregistrement. L'authentification à deux facteurs sur votre propre connexion n'aide pas si les *humains* du registrar peuvent être convaincus de la contourner.

3. **Les domaines de longue date sont des cibles faciles.** Un nom enregistré au début des années 90 et renouvelé automatiquement pendant trente ans tend à accumuler des informations de contact obsolètes, un point unique de défaillance humaine, et un propriétaire qui ne surveille pas le registre [WHOIS](/fr/glossary/whois/) au quotidien. La stabilité tranquille est exactement ce qui permet à une compromission de septembre de passer inaperçue jusqu'en janvier.

4. **Les règles de transfert fonctionnent dans les deux sens.** Le [verrou de transfert](/fr/glossary/transfer-lock/) de 60 jours après mise à jour censé *protéger* les propriétaires est devenu la salle d'attente de l'attaquant. La patience combinée au blanchiment à travers des registrars et des frontières a transformé une correction rapide en une récupération multi-parties s'étalant sur plusieurs semaines.

5. **La récupération est plus lente que le vol.** Voler le nom a nécessité un faux document. Le récupérer a nécessité des registrars, un registre, les preuves du propriétaire légitime, puis des semaines à reconstruire la réputation auprès des listes noires et des résolveurs. Le vol est une seule transaction ; la restitution en est plusieurs.

Le sombre résumé : pour un domaine comme perl.com, la force de votre mot de passe compte moins que la question de savoir si votre registrar peut être trompé en l'ignorant.

## L'angle Namefi

![Illustration colorée de la propriété de domaine vérifiable et résistante à la falsification — une carte de domaine sécurisée par un bouclier vert, un jeton Namefi vert et la continuité DNS](../../assets/the-perl-com-domain-theft-03-namefi-angle.jpg)

Chaque étape du vol de perl.com reposait sur une faiblesse : la propriété était un *enregistrement dans le compte de quelqu'un d'autre*, modifiable par quiconque pouvait persuader le bon agent de support. L'attaquant n'avait pas besoin des clés du propriétaire. Il avait besoin de la confiance du registrar — et un faux document suffisait à transférer un actif vieux de trente ans à travers la planète et à le mettre en vente.

[Namefi](https://namefi.io) est construit autour du principe inverse : la propriété d'un domaine doit être vérifiable cryptographiquement et difficile à réécrire discrètement. En représentant le contrôle d'un domaine comme un actif tokenisé sur la blockchain compatible avec le DNS, la réponse faisant autorité à la question « qui possède ce nom ? » cesse d'être une ligne modifiable dans la base de données d'un registrar qu'un coup de téléphone convaincant peut renverser. Les transferts deviennent des événements signés et auditables plutôt que de la paperasse administrative — et un « changement de propriété » frauduleux n'a plus de porte discrète par laquelle passer.

Cela n'aurait pas rendu perl.com impossible à voler du jour au lendemain ; les registrars et les registres font toujours partie de la chaîne. Mais cela s'attaque exactement au mode de défaillance qui a défini cet incident — l'écart entre *payer pour un nom pendant trente ans* et *être capable de prouver, de façon résistante à la falsification, qu'il vous appartient* — et cela réduit la fenêtre où un domaine volé peut être blanchi avant que quiconque puisse s'y opposer.

perl.com a récupéré sa porte d'entrée. La question plus difficile que cet épisode laisse derrière lui est de savoir pourquoi la serrure a jamais été quelque chose qu'un inconnu muni des bons papiers pouvait ouvrir.

## Sources et lectures complémentaires

- The Perl NOC — [perl.com hijacked](https://log.perl.org/2021/01/perlcom-hijacked.html)
- perl.com (brian d foy) — [The Hijacking of Perl.com](https://www.perl.com/article/the-hijacking-of-perl-com/)
- BleepingComputer — [Perl.com domain stolen, now using IP address tied to malware](https://www.bleepingcomputer.com/news/security/perlcom-domain-stolen-now-using-ip-address-tied-to-malware/)
- The Register — [Perl.com theft blamed on social engineering attack](https://www.theregister.com/2021/03/02/perl_domain_theft/)
- SecurityWeek — [Hackers Controlled Perl.com Domain Months Before Hijack](https://www.securityweek.com/hackers-control-perlcom-domain-months-hijack/)
- Security Affairs — [Attackers took over the Perl.com domain in September 2020](https://securityaffairs.com/115208/cyber-crime/perl-com-hijack-september.html)
- The Daily Swig (PortSwigger) — [Domain for popular programming website Perl.com stolen in 'hack'](https://portswigger.net/daily-swig/domain-for-popular-programming-website-perl-com-stolen-in-hack)
- Slashdot — [Perl.com Domain Stolen, Now Using IP Address of Past Malware Campaigns](https://developers.slashdot.org/story/21/01/31/0220252/perlcom-domain-stolen-now-using-ip-address-of-past-malware-campaigns)
- INCIBE-CERT — [The perl.com domain has been hijacked](https://www.incibe.es/en/incibe-cert/publications/cybersecurity-highlights/perlcom-domain-has-been-hijacked)
- GIGAZINE — [Perl.com editors tell the truth about the Perl.com domain hijacking case](https://gigazine.net/gsc_news/en/20210303-hijacking-of-perl-com/)
