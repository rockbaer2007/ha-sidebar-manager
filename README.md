# Sidebar Manager 0.1.3 — local preview

[Deutsch](docs/README.de.md) · English · [Français](docs/README.fr.md)

One Home Assistant frontend extension for per-entry colors/opacity, groups, collapsible navigation, pinned entries and custom links. This is an unpublished local preview, intended for Home Assistant 2026.10.3 or newer; live verification is restricted to the authorized .177 test system.

## Use

Open Home Assistant's **Edit sidebar** dialog by holding the sidebar heading. The color fields, visibility controls and native ordering remain available. **Manage groups and links** opens Sidebar Manager. Its Save button commits the manager layout independently; color/order edits in the underlying HA dialog still require that dialog's Save button. Cancel discards the respective open draft.

Groups have a name, initial collapsed state and optional bottom placement. Existing items can be assigned to groups, renamed for display, given an MDI icon, hidden or pinned. Arrow buttons change custom layout order. Group headers act as separators and can be collapsed with mouse, touch or keyboard. Pinned entries appear after normal entries within the scrollable main navigation, not in HA's protected profile/notification area. Own links accept internal paths and HTTP(S) URLs only. These presentation settings never change dashboard configuration or access permissions.

Folders have their own color picker with opacity, applied to the folder icon and name. **Theme color** clears the override. The Manager's Save button confirms the choice.

The native **Edit sidebar** dialog lists all folders together with the main entries. Use the same native drag handle to place any folder between main entries. There are no extra Up/Down buttons. The native keyboard sorting remains available (Alt+Up/Down on a row). Save commits the mixed order; Cancel discards it. Folder membership is unchanged, so a folder and its children move as one block in the sidebar. Pinned-bottom groups stay in the bottom section. Folder IDs never enter HA's stored native panel order.

## Storage and recovery

Every normal main-menu entry shows its group name or **Main menu** beside the color field. Click it to open the matching assignment directly. Choose a group or **Main menu** to move the entry back; this includes existing app and dashboard entries without changing their HA target. Each group has its own MDI icon, defaulting to an outlined folder. Settings, profile and notifications remain native.

- Existing Sidebar Colors settings remain under `ugso_sidebar_colors_v1`, without migration or reset.
- Layouts use `ugso_sidebar_manager_v1`, stored per authenticated HA user on the HA server and synchronized between clients.
- Missing panels remain in the record. They are never automatically deleted during loading.
- Read failures and unknown schemas do not write defaults. Concurrent changes are rejected before saving. Uncertain writes are read back, not automatically retried.
- A local previous-layout backup is required before writes; blocked storage prevents saving. The layout JSON export/import includes groups, labels, links, pinning, hiding and ordering. It does not contain access tokens or native HA settings. Colors retain their separate existing backup.
- Reset affects only the manager draft until saved. Native sidebar order, visibility and colors are retained.

## Local installation

Use only the new module, never alongside Sidebar Colors or Sidebar Organizer:

```yaml
frontend:
  extra_module_url:
    - /local/ugso-sidebar-manager/0.1.3/ha-sidebar-manager.js
```

Copy `dist/ha-sidebar-manager.js` to the matching directory under `/config/www`. Preserve existing frontend/themes configuration; replace the old colors module entry rather than duplicating `frontend`. Validate the HA configuration, restart HA and reload the browser. The previous module and configuration are retained in the PC backup for rollback.

This local package includes a HACS-style `hacs.json` and a bundled single JS file, but no GitHub repository or release has been created. No catalog inclusion is claimed.

## Development

Local verification on .177 (HA 2026.10.4), with 47 automated tests. See `docs/TESTING.md` for the actual checks and preservation of Test/Test2, colors, native preferences and Test für APP.

Node 22 or newer: `npm ci`, `npm run check`, `npm run build`, `npm test`.

Original implementation based on UGSo Sidebar Colors. Sidebar Organizer by Viet Ngoc is a behavioral reference; no Organizer source code is embedded. Its MIT license would require retaining the original copyright if source were adopted in a later increment.

## Limits

Native sidebar internals can change with HA updates. This preview deliberately leaves native ordering, hidden-panel preferences, settings/profile/notification entries, themes and permissions under HA control. There is no import of Organizer's YAML yet, no per-device layout overrides, and no user-defined CSS or template actions. Appearance/header/width options and automatic Organizer migration remain follow-up work. Pre-save checks are not a server-side compare-and-swap; a narrow simultaneous-write race remains possible.
