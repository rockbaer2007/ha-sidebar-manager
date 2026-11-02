# Sidebar Manager

<img src="docs/images/icon.svg" width="80" height="80" alt="Sidebar Manager" />

**0.1.8 local preview · Home Assistant ≥ 2026.10.3 · DE / EN / FR · MIT**

Local 0.1.8 adds custom links to **Edit sidebar** with colors/opacity, visibility and drag sorting. Links without a saved position appear at the end. The settings button reads **Link** or **Ext. link**, while retaining the folder assignment. Public release remains 0.1.7; this increment has local automated verification, not a new live HA test.

Organize Home Assistant's sidebar with folders, colors, opacity and custom links, directly from **Edit sidebar**. Move main entries and folders with the native drag handles. No HA core files are replaced.

[Deutsch](docs/README.de.md) · [Français](docs/README.fr.md) · [Documentation](https://opensource.ugso-software.de/en/projects/sidebar-manager/) · [Downloads](https://github.com/rockbaer2007/ha-sidebar-manager/releases/latest)

## Install with HACS / Marketplace

This is a frontend plugin, not a Supervisor app or a dashboard card. Add `https://github.com/rockbaer2007/ha-sidebar-manager` as a custom repository in HACS, category **Dashboard** (`plugin` internally), and download Sidebar Manager. A public repository is not automatically included in the default catalog. The package uses the HACS-compatible structure for Marketplace; Marketplace itself has not been live-tested.

[Open in HACS](https://my.home-assistant.io/redirect/hacs_repository/?owner=rockbaer2007&repository=ha-sidebar-manager&category=plugin)

Back up HA first. Merge this into the **existing** `frontend:` section of `configuration.yaml`, keeping themes and other modules:

```yaml
frontend:
  extra_module_url:
    - /hacsfiles/ha-sidebar-manager/ha-sidebar-manager.js
```

Remove or disable the old Sidebar Colors and Sidebar Organizer module entries; load only Sidebar Manager. Check the configuration, restart HA and reload the browser. A dashboard resource alone does not load the extension reliably when another HA page is opened first.

## Manual installation

Download `ha-sidebar-manager.js` from Releases and copy it to `/config/www/ha-sidebar-manager/ha-sidebar-manager.js`. Use this module URL instead:

```yaml
frontend:
  extra_module_url:
    - /local/ha-sidebar-manager/ha-sidebar-manager.js
```

Do not load the manual and HACS copies together. The ZIP includes the same bundle, configuration examples, license and DE/EN/FR instructions. Existing versioned local installations such as `/local/ugso-sidebar-manager/0.1.7/ha-sidebar-manager.js` can keep that path if the matching file is present. For updates, retain your chosen path and reload the browser.

## Websites inside HA

New-tab links work without additional configuration. For **Display on the right (iframe)**, also merge this entry into `configuration.yaml` or its existing `panel_custom` list:

```yaml
panel_custom:
  - name: ugso-sidebar-web
    url_path: ugso-sidebar-web
    module_url: /hacsfiles/ha-sidebar-manager/ha-sidebar-manager.js
    embed_iframe: false
    require_admin: false
```

For manual installation, change `module_url` to `/local/ha-sidebar-manager/ha-sidebar-manager.js`. It must match your frontend module URL. Validate and restart HA. No `sidebar_title` is set: this registers a hidden host panel, not another menu entry. See `panel-custom.example.yaml` and `panel-custom.manual.example.yaml` in the release ZIP.

The target website must allow embedding. CSP/X-Frame-Options, HTTPS-to-HTTP restrictions or the website's own login can prevent display. A new-tab alternative remains available. No HA token is passed to the website. Registering the host panel does not change permissions on HA's destination pages.

## Use

Hold the sidebar heading to open **Edit sidebar**. Color fields, eye buttons and the native drag handles remain available. **Manage groups and links** opens the Manager. The interface follows your HA language: German, English or French, with English fallback.

- Choose entry colors and opacity; **Theme color** clears an override. The checkerboard indicates transparency.
- Create folders with names, MDI icons, colors and initial expanded/collapsed state. Assign existing main-menu entries or custom links to folders; choose **Main menu** to move them back.
- Drag folders between main entries in the native editor. Group membership is preserved: the folder and its children move together. Keyboard sorting is also available (Alt+Up/Down on a row).
- Bottom-pinned folders also appear at the bottom in the editor. Moving one before a normal menu block releases its bottom pin; Cancel preserves the original pin and position.
- Set the folder separator to **0–4 px**. Zero means off. It appears only while the group is expanded, at the end of the block, in the icon's color/opacity, with 1 px spacing above and below.
- Add Logs, Automations and States shortcuts with a selectable folder. Matching existing links are reused; names and MDI icons remain editable.
- Own internal links are pale yellow in settings; external HTTP(S) links are light blue. Choose a new tab or iframe for external links. Older links retain their previous same-window behavior until edited. These settings highlights do not replace custom sidebar colors.
- The Manager's **Save** commits its layout. Color/native order edits in the underlying HA dialog require that dialog's **Save**. Cancel discards the respective open draft.

Settings, profile and notifications remain native. Hiding an entry or changing its group does not grant or restrict access.

## Screenshots and verification

Color picker and group settings:

![Color picker](docs/images/farbwaehler-177.png)

![Folder settings](docs/images/web-link-016-177.png)

Actual 0.1.7 folder placement and collapsed separator on the authorized .177 test system:

![Saved folder position](docs/images/ordnerposition-017-177.png)

![Collapsed folder without separator](docs/images/trennlinie-eingeklappt-017-177.png)

![Website on the right inside HA](docs/images/web-panel-016-177.png)

0.1.7 was verified on HA **2026.10.4**, port 80: Save/Cancel, moving a bottom-pinned test folder, browser reload, folder membership and expanded-only separators. Earlier tests cover colors, opacity, custom links, iframe/new-tab opening and layout export/import. Existing settings and the protected test dashboard were preserved; temporary test objects were removed. **60 automated tests pass.** The color/link screenshots also illustrate unchanged functionality from 0.1.6. [Detailed test history](docs/TESTING.md).

HA 2026.10.3 is the intended minimum, not a separate live-tested installation. No live compatibility claim is made for every external website or Marketplace version.

## Preserve settings and switch safely

1. Create a full HA backup. Export existing Organizer settings and Manager/color backups where available.
2. Disable the previous sidebar module entries without deleting their files or user settings. Install only one Sidebar Manager copy.
3. Existing Sidebar Colors data stays under `ugso_sidebar_colors_v1`. Manager layouts stay under `ugso_sidebar_manager_v1`, per authenticated HA user and synchronized between clients.
4. Organizer YAML/layout import is **not implemented**. Keep its export and recreate the desired folders/links manually. No automatic Organizer migration is claimed.

Missing panels remain stored. Read failures and unsupported schemas never write defaults. Before writes, the previous layout is saved in local browser storage; blocked storage prevents saving. Concurrent edits are checked before writes; uncertain confirmations are read back rather than blindly retried. This is not an atomic server-side compare-and-swap.

Manager JSON export/import covers folders, links, labels, icons, visibility, pinning, order and separator settings, not access tokens or native HA preferences. Entry colors keep their separate backup. Reset affects the open Manager draft until saved. To roll back, restore the previous module entry, restart HA and reload the browser; leave stored user settings intact.

## Development and scope

Node 22 or newer: `npm ci`, `npm run check`, `npm run build`, `npm test`. Tagged releases build the self-contained JS and installable ZIP automatically.

Native sidebar internals can change with HA frontend updates. No per-device layouts, arbitrary CSS/templates, automatic Organizer migration or configurable header/width are included. Pinned items remain within the scrollable main navigation.

Original UGSo implementation based on Sidebar Colors. [Sidebar Organizer by Viet Ngoc](https://github.com/ngocjohn/sidebar-organizer) is a behavioral reference; no Organizer source is embedded. MIT license: see [LICENSE](LICENSE).
