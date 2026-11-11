# Sidebar Manager 0.1.11

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
