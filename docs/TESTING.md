# Local verification — 2026-11-01

Unpublished Sidebar Manager 0.1.1. Live target exclusively `.177`, Home Assistant 2026.10.4 on port 80. No other HA host accessed. The initial 0.1.0 package and source snapshot are retained.

## Safety

- Original Sidebar Colors project and public release left unchanged.
- PC backup: `C:/Users/rockb/source/backups/sidebar-manager-vor-aufbau-20261101-204603`.
- Fresh complete HA backup `4c40757b`, 174.30 MB, including settings/history, apps, share, media and SSL. HA assigned the default name `Custom backup 2026.10.4`.
- Original configuration, complete user preferences, Test für APP configuration and Lovelace resources backed up separately on the PC.
- New local module replaces only the existing color-module entry. The old module remains available for rollback.

## Automated checks

`npm run check`, `npm run build`, `npm test`: 36 tests pass. These cover the existing color validation, native save separation, conflict detection, backup failures, uncertain acknowledgements, compensation and picker controls, plus the manager's schema, safe URLs, retention of missing panels, deterministic layout, per-language keys, cancellation, group icons/colors/opacity/theme reset and HTTP-compatible IDs.

## Actual .177 verification

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
