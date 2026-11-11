# Sidebar Manager

**0.1.11 · Home Assistant ≥ 2026.10.3 · DE / EN / FR · MIT**

La version 0.1.11 aligne la taille des icônes des groupes et des liens sur celle de Home Assistant (24 px) et les centre dans la barre latérale réduite.

> **Raccourci Marketplace à partir de HA 2026.11.0 uniquement.** Masqué sur les versions anciennes ou inconnues ; il n’installe pas Marketplace. Les autres raccourcis et le minimum HA 2026.10.3 restent inchangés. Les icônes enregistrées sont conservées ; les nouveaux liens utilisent les valeurs par défaut modifiables décrites ci-dessous.

La version 0.1.10 propose les raccourcis Journaux (`mdi:history`), Automatisations (`mdi:robot`), Entités (`mdi:shape`, `/config/entities`), Marketplace (`mdi:store`, `/marketplace/browse?group=status`), Étiquettes (`mdi:label`, `/config/labels`), États (`mdi:list-status`) et Actions (`mdi:run`, `/config/tools/action`). Marketplace est proposé uniquement à partir de HA 2026.11.0. La section utilise deux colonnes, une sur écran étroit. Les icônes par défaut des nouveaux liens restent modifiables ; les liens, noms, icônes et groupes existants sont conservés. Vérifié le 8 novembre 2026 sur .177 avec HA 2026.11.0 : deux colonnes sur ordinateur, quatre nouvelles destinations, icônes par défaut, dossier, annulation, enregistrement et rechargement. Liens de test supprimés ; réglages utilisateur identiques à la sauvegarde PC. Le filtrage Marketplace des anciennes versions est testé automatiquement.

[![Installer avec HACS / Marketplace](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=rockbaer2007&repository=ha-sidebar-manager&category=plugin)

**HACS / Marketplace :** Ouvrir Sidebar Manager dans votre installation Home Assistant avec le bouton ci-dessus, puis le télécharger. Terminer ensuite la configuration dans la section [HACS / Marketplace](#hacs--marketplace).

La version 0.1.8 ajoute les liens personnalisés à **Modifier la barre latérale**, avec couleur/opacité, visibilité et poignée de tri. Le bouton affiche **Lien** ou **Lien ext.** L’utilisateur a confirmé la réussite de la vérification fonctionnelle le 2 novembre 2026 ; 70 tests automatisés réussissent.

Dossiers, couleurs, opacité et liens personnalisés dans « Modifier la barre latérale ». Triez dossiers et entrées principales avec les poignées natives. Aucun fichier système HA n'est remplacé.

[English](../README.md) · [Deutsch](README.de.md) · [Documentation](https://opensource.ugso-software.de/fr/projects/sidebar-manager/) · [Téléchargements](https://github.com/rockbaer2007/ha-sidebar-manager/releases/latest)

## Compatibilité HA 2026.11 — 0.1.9

Les couleurs des lignes de l’éditeur natif prennent en charge `ha-md-list-item` et le nouveau `ha-list-item-button`. Couleurs, opacité et clés de stockage existantes conservées ; aucune migration nécessaire. Version minimale : HA 2026.10.3.

Vérifié sur .177 (port 80), Core 2026.11.0 / frontend 20261028.4 : couleurs du texte/des icônes des entrées et groupes, opacité, annulation, enregistrement, réinitialisation au thème et rechargement complet du navigateur. Groupe/lien de test supprimés ; disposition exportée identique à la sauvegarde initiale. 72 tests automatisés réussis. Mettre à jour uniquement le paquet utilisé ; ne pas charger Colors et Manager simultanément.

## Nouveautés de 0.1.8 : liens dans l’éditeur de barre latérale

> **État des vérifications, 2 novembre 2026**
> **0.1.8 : vérification fonctionnelle réussie confirmée par l’utilisateur le 2 novembre 2026.** Liens, couleurs, déplacement et libellés « Lien »/« Lien ext. » fonctionnent. La vérification syntaxique, la compilation et **70 tests automatisés** réussissent aussi. Les images existantes montrent les vérifications antérieures. Codex n’a pas effectué de test d’exécution HA indépendant supplémentaire pour cette version ; l’hôte et la version HA du test utilisateur n’ont pas été précisés séparément.

Les liens personnalisés internes et externes apparaissent aussi dans **Modifier la barre latérale**. Sans position enregistrée, ils apparaissent d’abord à la fin ; l’ordre existant est respecté. Les liens masqués restent disponibles pour modification.

- **Champ de couleur :** même sélecteur de couleur et d’opacité que pour les entrées HA. « Couleur du thème » retire la couleur personnalisée. Les couleurs enregistrées sont appliquées dès la création des lignes de la barre latérale.
- **Type de lien :** le bouton des réglages affiche **Lien** pour une destination interne et **Lien ext.** pour une destination HTTP(S) externe, à la place du nom du dossier. Un clic ouvre les réglages du lien. Son dossier reste conservé et figure aussi dans l’infobulle.
- **Poignée :** triez les liens avec les autres entrées, y compris dans leur dossier. Le déplacement seul ne change pas le dossier attribué ; choisissez celui-ci dans les réglages du lien. Le tri au clavier reste disponible.
- **Œil :** masquez ou affichez un lien sans supprimer le lien ni ses réglages.
- **Enregistrer/Annuler :** appliquez ou abandonnez les changements de couleur, visibilité et ordre dans la fenêtre HA. Les réglages généraux des liens restent enregistrés dans le Manager.

L’ordre et la visibilité des liens restent dans `ugso_sidebar_manager_v1`, les couleurs dans le relevé existant `ugso_sidebar_colors_v1`. Les identifiants des liens personnalisés ne sont jamais écrits dans l’ordre natif des panneaux HA. Réglages existants, modes d’ouverture et panneaux absents sont conservés.

Les vérifications locales couvrent le paquet JavaScript compilé avec un stockage HA simulé, les libellés DE/EN/FR, la couleur, l’enregistrement/annulation, le tri, le dossier attribué et la restauration après un échec d’enregistrement. L’utilisateur a confirmé la réussite de la vérification fonctionnelle le 2 novembre 2026 ; cette validation est documentée séparément des tests automatisés.

## HACS / Marketplace

Plugin frontend, pas une application Supervisor ni une carte de tableau de bord. Ajoutez `https://github.com/rockbaer2007/ha-sidebar-manager` comme dépôt personnalisé HACS, catégorie **Dashboard** (`plugin`), puis téléchargez-le. La publication n'implique pas l'inclusion au catalogue standard. Structure compatible HACS pour Marketplace ; aucun test d'exécution Marketplace distinct.

Créez d'abord une sauvegarde complète HA. Fusionnez dans la section `frontend:` existante de `configuration.yaml`, en conservant thèmes et autres modules :

```yaml
frontend:
  extra_module_url:
    - /hacsfiles/ha-sidebar-manager/ha-sidebar-manager.js
```

Désactivez les anciens modules Sidebar Colors et Sidebar Organizer ; chargez seulement Sidebar Manager. Validez, redémarrez HA et rechargez le navigateur. Une simple ressource de tableau de bord ne suffit pas pour toutes les pages HA.

## Installation manuelle

Copiez `ha-sidebar-manager.js` de la release vers `/config/www/ha-sidebar-manager/ha-sidebar-manager.js`, puis utilisez `/local/ha-sidebar-manager/ha-sidebar-manager.js` comme URL de module. Ne chargez pas simultanément les copies HACS et manuelle. Le ZIP contient le bundle, les exemples de configuration, la licence et les instructions DE/EN/FR. Un ancien chemin local versionné comme `/local/ugso-sidebar-manager/0.1.7/ha-sidebar-manager.js` reste possible si le fichier correspondant existe. Conservez le chemin choisi lors des mises à jour et rechargez le navigateur.

## Sites affichés à droite dans HA

Les liens ouvrant un nouvel onglet n'exigent aucune configuration supplémentaire. Pour **Afficher à droite (iframe)**, fusionnez aussi dans `configuration.yaml` ou la liste `panel_custom` existante :

```yaml
panel_custom:
  - name: ugso-sidebar-web
    url_path: ugso-sidebar-web
    module_url: /hacsfiles/ha-sidebar-manager/ha-sidebar-manager.js
    embed_iframe: false
    require_admin: false
```

Pour une installation manuelle, utilisez `/local/ha-sidebar-manager/ha-sidebar-manager.js` comme `module_url`. Cette URL doit correspondre au module frontend. Validez et redémarrez HA. Sans `sidebar_title`, aucune entrée supplémentaire n'est créée. Exemples dans le ZIP : `panel-custom.example.yaml` et `panel-custom.manual.example.yaml`.

Le site cible doit autoriser l'intégration. CSP/X-Frame-Options, HTTPS-vers-HTTP ou sa propre authentification peuvent empêcher l'affichage. L'ouverture dans un nouvel onglet reste disponible. Aucun jeton HA n'est transmis au site et les autorisations HA restent applicables.

## Utilisation

Maintenez l'en-tête de la barre latérale. Couleurs, yeux et poignées restent dans la fenêtre HA ; « Gérer les groupes et les liens » ouvre le Manager. DE/EN/FR suit la langue HA, avec anglais par défaut.

- Couleur et opacité par entrée ; « Couleur du thème » retire la couleur personnalisée. Le damier représente la transparence.
- Dossiers avec nom, icône MDI, couleur et état replié/déplié initial. Affectez les entrées et liens existants ; « Menu principal » permet de les ramener.
- Déplacez les dossiers entre les entrées principales. Dossier et contenu bougent ensemble ; Alt+Haut/Bas permet le tri au clavier.
- Les dossiers épinglés en bas apparaissent aussi en bas dans l'éditeur. Les déplacer avant un bloc normal retire leur épinglage inférieur. Annuler conserve position et épinglage.
- Séparateur **0–4 px**, 0 = désactivé. Visible uniquement lorsque le groupe est déplié, après son contenu, avec couleur/opacité de l'icône et 1 px d'espacement au-dessus et au-dessous.
- Ajoutez Journaux, Automatisations et États avec un dossier au choix. Les liens correspondants sont réutilisés ; noms et icônes restent modifiables.
- Liens internes personnalisés jaune clair dans les réglages, liens HTTP(S) externes bleu clair. Nouvel onglet ou iframe pour les liens externes. Les anciens gardent leur comportement précédent jusqu'à modification. Couleurs personnalisées de la barre latérale conservées.
- Enregistrer dans le Manager applique l'organisation. Couleurs/ordre natif modifiés dans la fenêtre HA sous-jacente doivent y être enregistrés séparément. Annuler abandonne le brouillon concerné.

Réglages, profil et notifications restent natifs. Masquer ou regrouper ne change pas les droits d'accès.

## Images et vérification

![Sélecteur de couleur](images/farbwaehler-177.png)

![Options des liens](images/web-link-016-177.png)

![Position du dossier en 0.1.7](images/ordnerposition-017-177.png)

![Dossier replié sans séparateur](images/trennlinie-eingeklappt-017-177.png)

![Site affiché à droite dans HA](images/web-panel-016-177.png)

0.1.7 vérifiée sur HA **2026.10.4**, port 80 : enregistrement/annulation, déplacement d'un dossier de test épinglé, rechargement, affectation et séparateurs uniquement dépliés. Les tests antérieurs couvrent couleurs, opacité, liens, iframe/nouvel onglet et export/import. Données et tableau de test conservés, objets temporaires supprimés. **60 tests automatisés réussis.** Les images couleur/liens de 0.1.6 montrent des fonctions toujours valides. [Historique des tests](TESTING.md).

2026.10.3 est le minimum prévu, sans installation distincte testée en direct. Aucune compatibilité générale revendiquée avec tous les sites ou versions Marketplace.

## Conserver les réglages et migrer

1. Sauvegardez HA complètement et exportez les réglages Organizer ainsi que les sauvegardes Manager/couleurs disponibles.
2. Désactivez les anciens modules sans supprimer leurs fichiers ni réglages. Installez une seule copie du Manager.
3. Couleurs Sidebar Colors conservées dans `ugso_sidebar_colors_v1`, organisation Manager dans `ugso_sidebar_manager_v1`, synchronisées sur le serveur par utilisateur HA.
4. **Aucun import automatique YAML/présentation Organizer.** Conservez son export et recréez manuellement les groupes/liens souhaités.

Les panneaux absents restent enregistrés. Une erreur de lecture ou un format inconnu n'écrit pas de valeurs par défaut. L'organisation précédente est sauvegardée dans le navigateur avant écriture ; un stockage bloqué empêche l'enregistrement. Conflits vérifiés avant écriture, confirmations incertaines contrôlées par relecture. Une courte course entre écritures simultanées reste possible sans comparaison atomique serveur.

Export/import JSON : dossiers, liens, noms, icônes, visibilité, épinglage, ordre et séparateurs ; aucun identifiant d'accès ni réglage HA natif. Les couleurs des entrées gardent leur sauvegarde distincte. Réinitialiser change seulement le brouillon jusqu'à son enregistrement. Pour revenir, restaurez l'ancien module, redémarrez HA et rechargez le navigateur sans supprimer les données utilisateur.

## Développement et limites

Node ≥22 : `npm ci`, `npm run check`, `npm run build`, `npm test`. Les tags génèrent JS et ZIP automatiquement. Les interfaces internes HA peuvent changer. Pas de présentations par appareil, CSS/modèles libres, migration automatique Organizer ou réglages d'en-tête/largeur.

Implémentation UGSo originale basée sur Sidebar Colors. [Sidebar Organizer de Viet Ngoc](https://github.com/ngocjohn/sidebar-organizer) sert de référence fonctionnelle ; aucun code Organizer intégré. Licence MIT dans le dépôt.
