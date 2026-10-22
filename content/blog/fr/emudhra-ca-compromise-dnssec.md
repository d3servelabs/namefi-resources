---
title: "La compromission des CA d’eMudhra montre pourquoi la sécurité des domaines exige plus que HTTPS"
date: '2026-10-22'
language: "fr"
tags: ['domains', 'security', 'dns', 'domain-security']
authors: ['namefiteam']
draft: false
cluster: domain-security
format: explainer
description: "Comprenez la compromission des clés de CA d’eMudhra, les risques d’usurpation de sites et les protections de DNSSEC, DANE, CAA et CT."
keywords: ["eMudhra", "emSign", "compromission de CA", "autorité de certification", "CA intermédiaire", "MITM", "DNSSEC", "DANE", "CAA", "transparence des certificats", "certificats TLS", "sécurité des domaines"]
relatedArticles:
  - /fr/blog/the-fox-it-dns-hijack/
  - /fr/blog/the-myetherwallet-bgp-dns-attack/
  - /fr/blog/the-curve-finance-dns-hijack/
  - /fr/blog/dns-on-tokenized-domains/
  - /fr/blog/dnssec-for-domain-owners/
relatedTopics:
  - /fr/topics/domain-security/
  - /fr/topics/domain-basics/
relatedSeries:
  - /fr/series/domain-apocalypse/
  - /fr/series/tokenize-your-com/
relatedGlossary:
  - /fr/glossary/certificate-authority/
  - /fr/glossary/intermediate-ca/
  - /fr/glossary/man-in-the-middle-attack/
  - /fr/glossary/dnssec/
  - /fr/glossary/dane/
---

Un site web peut chiffrer une connexion avec un imposteur. Le chiffrement seul ne permet pas d'établir qui contrôle l'autre point de terminaison.

L'incident d'eMudhra rend cette distinction urgente pour les titulaires de domaines, les fondateurs et les équipes Web3. Le 20 octobre 2026, Google et Mozilla ont annoncé des mesures d'urgence face à la compromission de clés d'autorités de certification intermédiaires. Une génération de clés défaillante a ouvert une voie à la falsification de certificats de sites web. Les clients qui faisaient encore confiance à ces clés couraient un risque d'usurpation d'identité. [Google explique la défaillance et les mesures de blocage](https://blog.google/security/protecting-chrome-and-android-users-from-compromised-emudhra-intermediate-ca-certificates/).

**État vérifié le 22 octobre 2026.** L'enquête continue. La compromission confirmée des clés ne prouve pas que des attaquants ont intercepté du trafic de clients.

## L'incident a exposé un pouvoir de signature supérieur à celui des sites individuels

Une [Autorité de certification](/fr/glossary/certificate-authority/), ou CA, délivre des certificats numériques qui associent des identités à des clés publiques. Pour HTTPS, un certificat identifie les noms de domaine qu'un serveur peut authentifier. La CA vérifie les exigences d'identité applicables avant de signer le certificat. Le navigateur vérifie la chaîne de certificats et la preuve fournie par le serveur concernant la clé privée correspondante. [La RFC 5280 décrit le modèle de certificats](https://www.rfc-editor.org/rfc/rfc5280#section-3.2).

Une CA racine fournit une ancre de confiance. Une [Autorité de certification intermédiaire](/fr/glossary/intermediate-ca/) possède un pouvoir de signature délégué sous une racine. Les certificats de sites web se trouvent généralement sous une CA intermédiaire. Une clé de site web compromise menace les identités de ce certificat. Une clé intermédiaire compromise peut menacer de nombreux domaines sans lien entre eux, selon les contraintes des certificats et les vérifications des clients.

Le [dossier d'incident de Mozilla identifie huit certificats intermédiaires concernés](https://bugzilla.mozilla.org/show_bug.cgi?id=2083449#c0) : six pour TLS et deux pour la signature de code. Mozilla a reconstitué indépendamment les clés privées faibles. eMudhra a marqué les certificats comme révoqués le 18 octobre. Ces faits décrivent une défaillance de génération de clés. Ils ne prouvent pas que quelqu'un a volé la clé privée de chaque client.

Dans sa [déclaration du 21 octobre](https://emudhra.com/fr/post/certificate-security-incident#:~:text=During%20the%20ceremony), eMudhra a attribué les clés faibles à une étape d'encapsulation et de désencapsulation pendant sa cérémonie de clés du 30 avril 2025. eMudhra a déclaré que les autorités intermédiaires concernées n'avaient délivré aucun certificat d'entité finale et n'a signalé aucune preuve d'exploitation avant la divulgation. L'entreprise a aussi déclaré que son enquête sur la cause exacte restait inachevée. Ces déclarations décrivent les conclusions d'eMudhra et ne constituent pas une garantie indépendante sur tout le trafic passé.

## Les protections des navigateurs ont modifié l'exposition réelle

Google indique que Chrome a bloqué les clés concernées le 17 octobre par une mise à jour CRLSet. Google indique aussi qu'aucun certificat TLS sous les six autorités intermédiaires TLS concernées n'apparaissait dans CT avant le blocage. Par conséquent, les certificats frauduleux de ces autorités intermédiaires n'auraient pas pu fonctionner avec les clients qui appliquaient l'exigence CT pertinente. L'avis de Google compte Chrome parmi ces clients.

Mozilla [a distribué son blocage OneCRL le soir même](https://blog.mozilla.org/security/2026/10/20/protecting-firefox-users-following-the-compromise-of-emudhra-intermediate-certificates/). Mozilla a aussi publié des mises à jour de Firefox pour les configurations susceptibles de ne pas recevoir la protection OneCRL. Une mise à jour du navigateur ne prouve pas que toutes les applications du même appareil disposent de la même protection. [Cloudflare avertit expressément que des applications différentes peuvent utiliser des vérificateurs de certificats différents](https://blog.cloudflare.com/emudhra-certificate-compromise/#:~:text=A%20successful%20browser%20test).

L'avis de Google du 20 octobre prévoit le retrait d'**emSign ECC Root CA - G3** chez les consommateurs du Chrome Root Store le 27 octobre 2026, heure du Pacifique PDT. Google demande aux opérateurs de sites web concernés de migrer les certificats vers une autre hiérarchie de confiance. Les opérateurs doivent distinguer un blocage de sécurité immédiat d'une interruption de service ultérieure causée par le retrait de confiance d'une racine.

## Un attaquant intermédiaire a besoin d'un accès au trafic et d'une identité acceptée

Une [Attaque de l’homme du milieu](/fr/glossary/man-in-the-middle-attack/), ou MITM, place un attaquant entre des interlocuteurs. Le scénario suivant décrit une attaque hypothétique, et non une exploitation observée d'eMudhra :

1. Un attaquant redirige un visiteur par des réponses DNS malveillantes ou une autre méthode d'interception réseau.
2. L'attaquant présente un certificat falsifié pour le domaine prévu.
3. Un client sans protection accepte le certificat et établit une connexion TLS avec l'attaquant.
4. L'attaquant peut relayer le trafic vers le service réel tout en lisant ou en modifiant les données applicatives.

La possession d'une clé de CA ne redirige pas automatiquement le trafic. Un certificat seul ne déchiffre pas non plus toutes les sessions enregistrées auparavant. La confidentialité persistante de TLS 1.3 protège les sessions antérieures contre une compromission ultérieure des clés d'authentification à long terme, selon les hypothèses énoncées. [La RFC 8446 explique cette distinction](https://datatracker.ietf.org/doc/html/rfc8446#appendix-E.1).

Notre [étude du cas Fox-IT](/fr/blog/the-fox-it-dns-hijack/) examine un autre chemin vers un résultat similaire : la compromission du bureau d'enregistrement a permis l'obtention de certificats frauduleux. Notre [étude du cas MyEtherWallet](/fr/blog/the-myetherwallet-bgp-dns-attack/) examine la manipulation du routage et du DNS. La sécurité des domaines doit traiter à la fois l'orientation du trafic et l'authentification des points de terminaison.

## DNSSEC authentifie les réponses DNS sans réparer les clés de CA

[DNSSEC (Extensions de sécurité du DNS)](/fr/glossary/dnssec/) ajoute des signatures numériques aux données DNS. Un résolveur validant vérifie ces signatures par une chaîne de confiance. Avec une zone correctement signée et une chaîne de validation intacte, un attaquant ne peut pas substituer une réponse d'adresse falsifiée sans détection. [La RFC 4033 définit les protections et leurs limites](https://datatracker.ietf.org/doc/html/rfc4033#section-3).

Les clients doivent valider localement ou faire confiance à la fois au résolveur validant et à une connexion authentifiée vers ce résolveur. [La RFC 4033 traite cette exigence du dernier tronçon](https://datatracker.ietf.org/doc/html/rfc4033#section-7).

Dans ces conditions, DNSSEC peut bloquer l'étape de falsification DNS dans l'attaque hypothétique. DNSSEC ne révoque pas une CA intermédiaire, ne valide pas un certificat HTTPS et ne chiffre pas le trafic web. Un attaquant qui intercepte le trafic par une autre voie peut toujours présenter un certificat falsifié à un client vulnérable.

La signature seule ne protège pas non plus le compte du bureau d'enregistrement ni l'interface de gestion du DNS faisant autorité. Un attaquant qui contrôle les modifications DNS autorisées peut publier des enregistrements nuisibles que le fournisseur signe. Les opérateurs doivent ajouter à la validation DNSSEC la protection des comptes, la surveillance des modifications et un enregistrement DS correct dans la zone parente.

## DANE peut lier une clé de service au DNS signé si les clients font respecter cette liaison

[DANE](/fr/glossary/dane/) relie DNSSEC à l'authentification TLS par des enregistrements TLSA. Un opérateur de domaine publie le certificat, la clé ou l'ancre de confiance attendus dans le DNS signé. Un client compatible valide DNSSEC et fait respecter l'association TLSA. [La RFC 6698 spécifie cette association](https://www.rfc-editor.org/rfc/rfc6698#section-2).

Par exemple, l'usage DANE-EE peut lier un service directement à sa clé publique. Un certificat falsifié avec une clé de CA sans rapport ne satisferait pas cette liaison. Cet avantage exige une validation DNSSEC sûre, des données TLSA correctes et une application effective par le client. La rotation des clés exige aussi des mises à jour TLSA coordonnées. [La RFC 7671 fournit des recommandations opérationnelles](https://www.rfc-editor.org/rfc/rfc7671#section-5.1).

Publier des enregistrements TLSA ne protège pas automatiquement les visiteurs utilisant les navigateurs courants. La [demande d'implémentation de DANE dans Firefox reste rejetée](https://bugzilla.mozilla.org/show_bug.cgi?id=1994924). Les opérateurs doivent vérifier la prise en charge dans le client exact. DANE possède une application normalisée à la [sécurité du transport SMTP](https://www.rfc-editor.org/rfc/rfc7672).

## CAA et CT apportent des contrôles de certificats différents

| Contrôle | Protection | Limite |
| --- | --- | --- |
| DNSSEC | Un résolveur validant authentifie les données DNS signées. | DNSSEC ne répare pas les clés de CA compromises. |
| DANE | Un client compatible vérifie une association TLSA authentifiée par DNSSEC. | Les clients doivent faire respecter l'association. |
| CAA | Une CA conforme vérifie les émetteurs que le domaine autorise. | Un faussaire peut contourner le processus de délivrance de la CA. |
| CT | Les journaux exposent la délivrance des certificats pour la surveillance et les contrôles des politiques clients. | Les journaux seuls n'empêchent pas toutes les falsifications et ne protègent pas tous les clients. |

[CAA](/fr/glossary/caa/) publie les émetteurs autorisés dans le DNS. [La RFC 8659 distingue l'autorisation de délivrance de la validation des certificats par les clients](https://www.rfc-editor.org/rfc/rfc8659#section-1). Une clé de signature volée ou reconstituable permet à un faussaire d'ignorer les vérifications CAA.

La [Transparence des certificats](/fr/glossary/certificate-transparency/), ou CT, rend la délivrance des certificats publiquement vérifiable. La surveillance peut signaler des certificats inattendus, tandis que l'application des règles par le client peut rejeter les certificats sans la preuve de journalisation exigée. [La RFC 9162 décrit le mécanisme de journalisation](https://www.rfc-editor.org/rfc/rfc9162#section-1). Les conclusions de Google présentées plus haut montrent pourquoi l'application des règles compte pendant un incident de CA.

## Les opérateurs de domaines doivent vérifier maintenant la confiance des clients et les dépendances des certificats

- Installez les mises à jour de sécurité actuelles du navigateur, du système d'exploitation, de l'environnement d'exécution et des paquets de CA.
- Inventoriez les chaînes de certificats des sites web, API, applications mobiles, conteneurs et passerelles d'inspection TLS.
- Suivez les recommandations des fournisseurs concernant les autorités intermédiaires concernées et le retrait des racines, y compris les chemins de certification alternatifs.
- Remplacez les certificats dont la chaîne mène à la hiérarchie privée de confiance avant l'échéance applicable au client.
- Testez le vérificateur TLS réel de chaque application après correction.
- Laissez la vérification des certificats activée et arrêtez la connexion en cas d'erreur de certificat.
- Activez DNSSEC avec une délégation DS correcte et utilisez une résolution validante.
- Restreignez les émetteurs autorisés avec CAA, surveillez CT et protégez les comptes du bureau d'enregistrement et du DNS.

Un VPN peut modifier le chemin du trafic. Un VPN ne répare pas les décisions de confiance du client concernant les certificats. HSTS exige HTTPS, mais une identité HTTPS falsifiée que le client accepte déjoue encore cette protection. [La RFC 6797 décrit les limites de sécurité de HSTS](https://www.rfc-editor.org/rfc/rfc6797#section-14).

Pour les lecteurs de Namefi, la propriété du domaine, l'administration DNS, l'authentification TLS et l'autorisation du portefeuille exigent des contrôles distincts. La tokenisation d'un domaine ne remplace pas automatiquement la confiance du navigateur dans les CA et n'active pas DNSSEC. Notre [guide DNS pour les domaines tokenisés](/fr/blog/dns-on-tokenized-domains/) explique le lien opérationnel. Notre [étude du cas Curve Finance](/fr/blog/the-curve-finance-dns-hijack/) montre pourquoi une équipe Web3 doit protéger le domaine qui sert son interface.

## Ces sources primaires documentent l'incident et ses défenses

Toutes les sources ci-dessous ont été consultées le 22 octobre 2026. Les déclarations sur l'incident peuvent évoluer pendant les enquêtes.

- [Google : réponse de Chrome et Android](https://blog.google/security/protecting-chrome-and-android-users-from-compromised-emudhra-intermediate-ca-certificates/), 20 octobre 2026. Sections sur l'entropie, CT, le blocage et le retrait de racine.
- [Mozilla : réponse de Firefox](https://blog.mozilla.org/security/2026/10/20/protecting-firefox-users-following-the-compromise-of-emudhra-intermediate-certificates/), 20 octobre 2026. Distribution de OneCRL et mises à jour supplémentaires.
- [Rapport Mozilla 2083449](https://bugzilla.mozilla.org/show_bug.cgi?id=2083449#c0), description et commentaire 1. Périmètre des certificats, reconstitution indépendante des clés et révocation.
- [Déclaration d'eMudhra sur l'incident](https://emudhra.com/fr/post/certificate-security-incident), mises à jour 2–4. Conclusions de l'entreprise et options de transition pour les clients.
- [Recommandations de Cloudflare sur l'incident](https://blog.cloudflare.com/emudhra-certificate-compromise/), recommandations de vérification propres à chaque application.
- [RFC 5280](https://www.rfc-editor.org/rfc/rfc5280#section-3.2), modèle de certificats et de chemins de confiance.
- [RFC 8446](https://datatracker.ietf.org/doc/html/rfc8446#appendix-E.1), confidentialité persistante de TLS 1.3.
- [RFC 4033](https://datatracker.ietf.org/doc/html/rfc4033#section-3), services, limites et validation DNSSEC.
- [RFC 6698](https://www.rfc-editor.org/rfc/rfc6698#section-2) et [RFC 7671](https://www.rfc-editor.org/rfc/rfc7671#section-5.1), associations DANE et exploitation.
- [Rapport Mozilla 1994924](https://bugzilla.mozilla.org/show_bug.cgi?id=1994924), état de l'implémentation de DANE dans Firefox.
- [RFC 7672](https://www.rfc-editor.org/rfc/rfc7672), DANE pour SMTP.
- [RFC 8659](https://www.rfc-editor.org/rfc/rfc8659#section-1), distinction entre autorisation CAA et validation.
- [RFC 9162](https://www.rfc-editor.org/rfc/rfc9162#section-1), journalisation et surveillance CT.
- [RFC 6797](https://www.rfc-editor.org/rfc/rfc6797#section-14), considérations de sécurité HSTS.
