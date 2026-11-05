# Sidebar Manager 0.1.9

## HA 2026.11 compatibility — 0.1.9

Supports both the legacy `ha-md-list-item` and HA 2026.11's `ha-list-item-button` when coloring native editor rows. Existing colors, opacity and storage keys are preserved; no migration is required. Minimum HA remains 2026.10.3.

Verified on .177 (port 80), Core 2026.11.0 / frontend 20261028.4: entry and group text/icon colors, opacity, Cancel, Save, theme reset and a full browser reload. Disposable group/link removed; exported layout matches the pre-test backup. 72 automated tests pass. Update only the package you use; do not load Colors and Manager together.

Fixes missing text/icon colors in Home Assistant 2026.11's **Edit sidebar** dialog, including group rows. Download the JavaScript through your existing HACS repository or replace the manual module, then reload the browser. Keep the optional iframe host and `frontend.extra_module_url` on the same module URL. Existing settings are preserved.

[DE documentation](https://opensource.ugso-software.de/projects/sidebar-manager/) · [EN documentation](https://opensource.ugso-software.de/en/projects/sidebar-manager/) · [FR documentation](https://opensource.ugso-software.de/fr/projects/sidebar-manager/)
