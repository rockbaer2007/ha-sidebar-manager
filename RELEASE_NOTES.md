# Sidebar Manager 0.1.13

- **EN:** A dedicated dialog lets users choose their own sidebar or an assigned read-only profile. Administrators can enforce one profile for everyone. The trash icon removes saved settings for missing sidebar entries.
- **DE:** Im neuen Popup wählen Benutzer ihre eigene Sidebar oder ein zugewiesenes, schreibgeschütztes Profil. Administratoren können ein globales Profil verbindlich setzen. Der Papierkorb entfernt gespeicherte Einstellungen für fehlende Einträge.
- **FR:** La nouvelle fenêtre permet de choisir sa barre latérale personnelle ou un profil attribué en lecture seule. Les administrateurs peuvent imposer un profil global. La corbeille supprime les réglages enregistrés pour les entrées absentes.

## Sidebar Manager 0.1.12

- **EN:** Select a JSON backup file directly. Full backups include groups, links, colors, sidebar order, and visibility. Administrators can assign named profiles to selected users or set a default for everyone. Users can keep their own sidebar or save a personal copy.
- **DE:** JSON-Sicherungen lassen sich direkt auswählen. Sie enthalten Gruppen, Links, Farben, Reihenfolge und Sichtbarkeit. Administratoren können Profile ausgewählten Benutzern zuweisen oder als Standard für alle festlegen. Benutzer können ihre eigene Sidebar behalten oder eine persönliche Kopie übernehmen.
- **FR:** Sélectionnez directement un fichier de sauvegarde JSON. Les sauvegardes contiennent les groupes, les liens, les couleurs, l’ordre et la visibilité. Les administrateurs peuvent attribuer un profil à certains utilisateurs ou le définir par défaut pour tous. Chaque utilisateur peut garder sa barre latérale ou enregistrer une copie personnelle.

## Sidebar Manager 0.1.11

Group and custom-link icons now match the native Home Assistant icons at 24 × 24 px and sit on the same horizontal centerline in the collapsed sidebar. Verified in both sidebar layouts on Home Assistant 2026.11.0. Existing settings require no migration.

DE: Gruppen- und Link-Icons sind 24 × 24 px groß und sitzen in der eingeklappten Seitenleiste auf derselben Mittelachse wie die Original-Icons.

FR : les icônes des groupes et des liens mesurent 24 × 24 px et sont centrées comme les icônes natives dans la barre latérale réduite.

## Home Assistant shortcuts — 0.1.10

Adds Entities, Marketplace, Labels and Actions to Home Assistant shortcuts, with distinct editable default icons for all seven presets. The shortcut section has two responsive columns, or one on narrow screens. Existing links and custom icons remain unchanged.

> **Marketplace shortcut: Home Assistant 2026.11.0 or newer is required.** This preset is hidden on older or unknown versions. The package minimum remains HA 2026.10.3; other presets remain available. The shortcut does not install Marketplace or grant additional permissions.

| Shortcut | Default icon | Target |
| --- | --- | --- |
| Logs | `mdi:history` | `/config/logs` |
| Automations | `mdi:robot` | `/config/automation/dashboard` |
| Entities | `mdi:shape` | `/config/entities` |
| Marketplace | `mdi:store` | `/marketplace/browse?group=status` |
| Labels | `mdi:label` | `/config/labels` |
| States | `mdi:list-status` | `/config/tools/state` |
| Actions | `mdi:run` | `/config/tools/action` |

Build, syntax checks and 73 automated tests pass. Verified on .177 (HA 2026.11.0): desktop layout, all four added destinations, icons, folder assignment, Cancel, Save and full reload. Temporary links removed; original user settings, colors and dashboard/resources match the PC backup exactly. Older-version gating is tested automatically; no live mobile or older-HA test claimed. Create a backup before updating and reload the browser afterward. Existing saved icons remain unchanged; the table specifies editable defaults for newly added links.

## HA 2026.11 compatibility — 0.1.9

Supports both the legacy `ha-md-list-item` and HA 2026.11's `ha-list-item-button` when coloring native editor rows. Existing colors, opacity and storage keys are preserved; no migration is required. Minimum HA remains 2026.10.3.

Verified on .177 (port 80), Core 2026.11.0 / frontend 20261028.4: entry and group text/icon colors, opacity, Cancel, Save, theme reset and a full browser reload. Disposable group/link removed; exported layout matches the pre-test backup. 72 automated tests pass. Update only the package you use; do not load Colors and Manager together.

Fixes missing text/icon colors in Home Assistant 2026.11's **Edit sidebar** dialog, including group rows. Download the JavaScript through your existing HACS repository or replace the manual module, then reload the browser. Keep the optional iframe host and `frontend.extra_module_url` on the same module URL. Existing settings are preserved.

[DE documentation](https://opensource.ugso-software.de/projects/sidebar-manager/) · [EN documentation](https://opensource.ugso-software.de/en/projects/sidebar-manager/) · [FR documentation](https://opensource.ugso-software.de/fr/projects/sidebar-manager/)
