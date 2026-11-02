# Local verification — 2026-11-01

## Pale-yellow shortcut names — 2026-11-02, 0.1.5

Presentation-only update installed on .177, port 80. PC source/configuration/user-data/Test für APP backup: `C:/Users/rockb/source/backups/sidebar-manager-vor-hellgelb-20261102`. A separate test tab was used; the user's open settings dialog was not edited or closed. Confirmed computed color `rgb(255, 242, 166)` on all seven titles: section heading, three preset names and the same three entry-list names. Existing settings and Test für APP remain byte-identical. Syntax, bundle and all 50 tests pass. No additional full HA backup was created for this reversible style-only change; the three previously confirmed full backups remain. No publication.

## Local continuation — 2026-11-02, 0.1.4

Initial PC source backup: `C:/Users/rockb/source/backups/sidebar-manager-vor-ha-links-20261102`. Existing variants and ZIPs retained. Syntax, bundle and 50 automated tests pass. New checks cover all three shortcut routes and selected folders, duplicate/legacy URL recognition, custom-name/icon preservation, ID collisions, absent-folder fallback, renaming folders in the open dialog, and adding a shortcut without writing until Save (Cancel does not persist).

### Actual 0.1.4 verification on .177 — 2026-11-02

- HA accessed only at `http://192.168.178.177/` on port 80. Existing .177 File Studio backend used for verified local file deployment, with no other HA hosts accessed.
- Full backup `82bbd8e7`, "Sidebar Manager vor HA-Verknüpfungen 0.1.4 2026-11-02", 174.73 MB, includes settings/history, all apps, media, share and SSL.
- Complete current user preferences, configuration, Test für APP and Lovelace resources separately saved in `C:/Users/rockb/source/backups/sidebar-manager-vor-pruefung-014-20261102`.
- Version 0.1.4 confirmed in the frontend after restart. Original module retained.
- Add Logs to a folder then Cancel: no saved shortcut.
- Create own folder SM 014 Prüfung; immediately rename it, select it for all three shortcuts, add and save. Reload confirms all three links and folder assignments.
- Clicking each shortcut opens the correct page: Logs shows Home Assistant Core, Automations opens its dashboard, States shows current entity states.
- Move the existing States shortcut into the main menu, save and reload. Logs/Automations retain their folder and States retains Main menu. All three Add buttons remain disabled as Already present.
- Live testing exposed stale folder labels after renaming a group; fixed immediate label synchronization without rerendering the active name field. Regression added to the dialog test and verified again live.
- Only the three created shortcuts and our own test folder removed afterward. `.local/test-014.mjs verify` confirms original user preferences/colors, normalized manager configuration, Test für APP and resources unchanged, and matching local/deployed bundle. A pre-existing dangling token for an already-deleted older test folder is normalized away; no user folder is removed.
- Retention completed after explicit action-time approval: only oldest full backup `a74b1275` (174.17 MB) deleted. HA confirms exactly three manual full backups, `82bbd8e7`, `1cf6590c` and `4c40757b`, totaling 523.59 MB. The separate app-update backup (119.18 MB) and all PC backups remain untouched.

Unpublished Sidebar Manager 0.1.3. Live target exclusively `.177`, Home Assistant 2026.10.4 on port 80. No other HA host accessed. Earlier local packages and source snapshots are retained.

## Safety

- Original Sidebar Colors project and public release left unchanged.
- PC backup: `C:/Users/rockb/source/backups/sidebar-manager-vor-aufbau-20261101-204603`.
- Fresh complete HA backup `4c40757b`, 174.30 MB, including settings/history, apps, share, media and SSL. HA assigned the default name `Custom backup 2026.10.4`.
- Original configuration, complete user preferences, Test für APP configuration and Lovelace resources backed up separately on the PC.
- Retention completed after the user's explicit action-time approval: only old full backup `291c811d` (173.44 MB) deleted. The HA overview confirms exactly three manual full backups plus the separate app-update backup (119.18 MB). PC backups remain untouched.
- New local module replaces only the existing color-module entry. The old module remains available for rollback.

## Automated checks

`npm run check`, `npm run build`, `npm test`: 47 tests pass. These cover color validation, native save separation, conflicts, backup failures, uncertain acknowledgements, compensation, picker controls, schema, safe URLs, missing panels, deterministic layout, locale keys, cancellation, icons/colors/opacity and HTTP-compatible IDs. The mixed native editor forwards only real panel IDs to HA. Tests cover interleaved folder blocks, hidden controls, missing anchors, deleted folders, cancellation, failed-save compensation and frozen controls during saving. Folder-only moves preserve an empty native order meaning HA defaults.

## Actual .177 verification

- Before 0.1.2: PC snapshot `C:/Users/rockb/source/backups/sidebar-manager-vor-gruppenliste-20261101` and full HA backup `1cf6590c`, "Sidebar Manager vor Untermenü-Liste 0.1.2", 174.57 MB.
- Native Submenus section shows the saved Test/Test2 groups without making the dialog dirty.
- Two own SM Sort folders created. Arrow movement enables Save; Cancel followed by reopening restores the stored order.
- Actual mouse drag swaps the two own folders. Native Save persists their order after browser reload.
- Own sort folders removed afterward; user-created Test/Test2, Home/Map assignments, native settings and colors preserved.
- Retention after the fresh backup completed with concrete user approval: only oldest `468fd9bd` permanently deleted. Exactly three full backups remain: `1cf6590c`, `4c40757b`, `a74b1275`, plus the separate 119.18 MB app-update backup. PC backups retained.
- 0.1.3: Test folder dragged directly below Overview in the common native list, then Cancel. Original positions retained.
- Own SM Position folder and internal link created. Native drag and keyboard sorting exercised; saved between Test für APP and Energy. Browser reload confirmed this exact folder block in the actual sidebar. Both test objects then removed; Test/Test2 assignments and previous native data preserved.
- PC snapshot before the common-list change: `C:/Users/rockb/source/backups/sidebar-manager-vor-gemeinsamer-sortierung-20261101`. Fresh full HA backup above covers this continuation; no further full backup created for local iterations.
- A first mixed-order iteration explicitly stored the default native panel order on a folder-only move. Corrected by comparing effective panel order, covered by a regression test, and compensated only the exact default preference added by our test after saving its complete snapshot. Final native settings/colors match the original again.
- Final mixed editor: Map color picker shows the saved HEX/opacity and cancels correctly. Media visibility changes in the draft and is restored by Cancel.

- Native color fields and manager entry point load; existing colors still displayed.
- Create a group and assign the existing ATLAS entry. Rename and replace its display icon.
- Create a pinned own internal link.
- Save confirmed by server-side user-data readback.
- Collapse/expand group and reload browser: configured initial collapse and assignments persist.
- Add another group, cancel, reopen: unsaved group absent.
- Browser JSON export downloaded as `sidebar-manager-backup.json`; content checked.
- Reset layout, import exported JSON and save: restored group and link appear.
- Move existing Map entry from the main menu into the group, hide Media for presentation and change ordering.
- Reset all initial temporary manager data after verification. The user then created groups `Test` and `Test2`, assigning Home and Map; these are preserved. A separate icon-test group and link were added and removed without resetting the user's layout.
- Version 0.1.1: a separate color-test folder with an internal link saved green `#00ff00` at 70% opacity. Actual icon/name inline colors were both `rgba(0, 255, 0, 0.7)`, including after browser reload. Theme reset persisted `color: null`. Only the temporary color-test folder/link were removed afterward.
- `node tools/verify-local-177.mjs` confirms byte-identical Test für APP and resources, all native user settings and all existing colors unchanged, the user's Test/Test2 layout preserved, our own objects removed and matching local/deployed module.

The first HTTP test exposed use of secure-context-only `crypto.randomUUID`; replaced with `crypto.getRandomValues` and verified again with a regression test. Browser caching required a fresh module query during local iterations. Each native editor row also shows its current folder name (or Main menu), opening that row's assignment directly. Group icons default to an outlined folder and can be changed to any supported MDI icon.

The automation's download-event wait timed out, although the export file was correctly downloaded. The file and actual JSON import were verified independently; this was not treated as a failed application export.

## Limits

DE is live tested; EN/FR UI dictionaries and matching documentation are checked locally. No HA 2026.10.3 or Marketplace 2026.11 live test. No simultaneous Sidebar Organizer/Sidebar Colors installation. No HA core modifications. Grouped/pinned entries stay in the scrollable main navigation. Native Settings/Profile/Notifications are outside the custom layout. No Organizer import or arbitrary CSS/templates in this first local increment.
