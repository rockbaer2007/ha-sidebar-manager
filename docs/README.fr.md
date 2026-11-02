# Sidebar Manager 0.1.4 — aperçu local

Extension indépendante pour Home Assistant : couleurs et opacité, groupes repliables, entrées épinglées, liens personnalisés, noms et icônes MDI. La langue DE/EN/FR suit automatiquement HA. Aucune publication.

## Utilisation

Maintenez l'en-tête de la barre latérale. Les champs de couleur, les yeux et le tri natifs restent dans « Modifier la barre latérale ». « Gérer les groupes et les liens » ouvre le Manager. Enregistrer dans le Manager applique l'organisation ; les couleurs et l'ordre natif modifiés dans la fenêtre HA doivent être enregistrés séparément dans cette fenêtre. Annuler abandonne le brouillon correspondant.

Chaque groupe possède un nom, un état replié initial et une position basse facultative. Les entrées peuvent être regroupées, renommées pour l'affichage, masquées, épinglées ou dotées d'une icône MDI. Les flèches changent l'ordre personnalisé. Les en-têtes servent de séparateurs et se replient à la souris, au toucher et au clavier. Les entrées épinglées restent à la fin de la navigation principale défilante, hors de la zone HA réservée au profil et aux notifications. Les liens autorisent les chemins internes et HTTP(S).

## Conservation et récupération

Chaque entrée normale affiche son groupe ou « Menu principal » à côté de sa couleur. Un clic ouvre directement son affectation. Choisir un groupe ou « Menu principal » permet de déplacer puis de ramener l'entrée, y compris pour les applications et tableaux de bord existants, sans changer leur destination HA. Chaque groupe dispose d'une icône MDI, un dossier par défaut. Réglages, profil et notifications restent natifs.

Les couleurs existantes restent dans `ugso_sidebar_colors_v1`. L'organisation utilise séparément `ugso_sidebar_manager_v1`, stocké sur le serveur HA par utilisateur et synchronisé entre clients. Les panneaux temporairement absents sont conservés. Une erreur de lecture ou un format inconnu ne remplace jamais les réglages par des valeurs par défaut. Avant chaque écriture, l'organisation précédente est sauvegardée localement ; un stockage bloqué empêche l'enregistrement. Les conflits sont vérifiés avant l'écriture et les confirmations perdues sont contrôlées par relecture. Sans comparaison atomique côté serveur, une course très courte entre écritures simultanées reste possible.

L'export/import JSON couvre l'organisation (groupes, liens, noms, icônes, masquage, épinglage et ordre), sans identifiants ni réglages HA natifs. Les couleurs conservent leur sauvegarde distincte. La réinitialisation affecte seulement le brouillon jusqu'à son enregistrement.

## Installation et retour

Charger un seul module : `/local/ugso-sidebar-manager/0.1.4/ha-sidebar-manager.js`, copié sous `/config/www`. Préserver les thèmes et les autres entrées frontend. Remplacer l'ancien module de couleurs ; ne pas dupliquer la section `frontend`. Valider la configuration, redémarrer HA et recharger le navigateur. Ne pas charger Sidebar Colors ou Sidebar Organizer simultanément.

Les dossiers possèdent un sélecteur de couleur avec opacité, appliquée à leur icône et leur nom. « Couleur du thème » retire la couleur personnalisée. Enregistrer dans le Manager confirme le choix.

La fenêtre HA « Modifier la barre latérale » réunit tous les sous-menus et les entrées principales. La même poignée native permet de placer chaque dossier entre les entrées principales, sans boutons de déplacement supplémentaires. Le tri au clavier reste disponible (Alt+Haut/Bas sur une ligne). Enregistrer applique l'ordre commun ; Annuler l'abandonne. Les affectations restent intactes : dossier et contenu se déplacent comme un bloc dans la barre latérale. Les dossiers épinglés en bas restent dans cette section. Aucun identifiant de dossier n'entre dans la liste native des panneaux enregistrée par HA.

Pour revenir, restaurer l'ancien chemin du module sauvegardé et redémarrer HA. Les données Manager restent séparées ; couleurs et réglages natifs sont conservés.

## Limites

Les réglages proposent Journaux, Automatisations et États, avec dossier au choix et `mdi:cog-transfer`. Les liens correspondants sont réutilisés, sans écraser leurs noms ou icônes personnalisés. Enregistrer applique les modifications. États utilise `/config/tools/state` ; les anciens liens `/developer-tools/state` sont reconnus. Les autorisations HA restent inchangées.

La version 0.1.4 est installée et vérifiée sur .177 (HA 2026.10.4, port 80), avec 50 tests automatisés réussis. Journaux, Automatisations et États s'ouvrent correctement. Choix du dossier, déplacement d'un lien existant vers le menu principal, prévention des doublons, annulation et conservation après rechargement sont vérifiés. Objets de test supprimés, réglages existants conservés. Voir `TESTING.md`.

![Réglages des raccourcis sur .177](images/ha-shortcuts-014-177.png)

Cible minimale HA 2026.10.3 ; vérification réelle uniquement sur .177 avec 2026.10.4. Pas encore d'import YAML Organizer, de présentations par appareil, de CSS libre ou d'actions à modèles. Réglages d'en-tête/largeur et migration automatique Organizer restent à faire. Structure HACS préparée localement, sans publication. Voir `TESTING.md` pour les vérifications.
