# Sidebar Manager 0.1.7

First public release: folders, colors/opacity, custom links and shared sidebar ordering in Home Assistant's native sidebar editor.

- DE/EN/FR follows the Home Assistant language.
- Folder icons/colors and 0–4 px separators, visible only while expanded.
- Moving a bottom-pinned folder upward releases its pin and preserves the saved position after reload.
- Internal HA shortcuts and external links: new tab or embedded panel on the right.
- Existing Sidebar Colors data preserved. Organizer configuration import is not implemented; export and retain its settings before switching.
- Minimum target HA 2026.10.3, live verified on 2026.10.4; 60 automated tests pass. Marketplace package compatibility prepared, no separate Marketplace live test.

Install as a HACS custom repository, category Dashboard/plugin, or download the standalone JavaScript. Load only Sidebar Manager, disable older sidebar modules and back up HA first. For iframe links, merge the matching `panel-custom` example and restart HA. Target websites must allow embedding.

The ZIP contains the same JavaScript, both configuration examples, license, screenshots and DE/EN/FR instructions. SHA-256 checksums are attached.

[DE documentation](https://opensource.ugso-software.de/projects/sidebar-manager/) · [EN documentation](https://opensource.ugso-software.de/en/projects/sidebar-manager/) · [FR documentation](https://opensource.ugso-software.de/fr/projects/sidebar-manager/)
