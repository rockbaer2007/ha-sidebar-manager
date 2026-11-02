# Changelog

## 0.1.8 — local preview

- Include all saved internal and external links in the native sidebar editor, including hidden links. Links without a saved mixed position start at the end.
- Use the existing color/opacity picker, visibility eye and drag/keyboard sorting for links. Moving links also preserves the requested order among native members of a folder.
- Label link controls as Link / Ext. link (DE: Link / ext. Link; FR: Lien / Lien ext.) instead of the folder name. Clicking still opens the selected link's settings; its folder remains in the accessible label and tooltip.
- Keep link order/visibility in Manager storage and colors in their existing namespace. Never pass generated links or folders to HA's native saved panel preferences. Save/Cancel and conflict/readback safeguards remain in use.
- Apply saved link colors immediately when the Manager creates sidebar rows. Regression tests cover bundle integration, DE/EN/FR badges, preservation of native preferences, cancellation and failed-save compensation. Local checks only; no new live HA test or public release yet.

## 0.1.7 — first public release

- Align bottom-pinned folder placement between the editor and sidebar. Moving a folder before a normal menu block releases its bottom pin rather than silently forcing it back down.
- Show group separators only while the corresponding group is expanded.
- Preserve folder membership, existing colors, links and native HA preferences. Add regression coverage for ordering, pinning and live collapse behavior.
- Publish the self-contained HACS-compatible frontend bundle, configuration examples, DE/EN/FR documentation and screenshots from the .177 tests. Minimum target HA 2026.10.3, live verified on 2026.10.4; 60 automated tests pass.

## 0.1.6 — unpublished local preview

- Light-blue external links in settings; internal links remain pale yellow.
- External links open in a new tab or a hidden HA custom iframe panel. Existing same-window behavior is retained until edited.
- Per-group separator slider, 0–4 px, placed after the group block in its icon color/opacity, with 2 px total extra spacing.
- Include `panel-custom.example.yaml` for the optional iframe panel. No extra sidebar entry, credentials forwarded or HA core patches.
- Verified only on .177, port 80; existing settings and Test für APP preserved. No publication.

## 0.1.5 — unpublished local preview

- Pale-yellow heading and names distinguish Home Assistant shortcuts in settings and the lower entry list.
- Presentation-only change; custom sidebar colors, link data and editable icons retained.

## 0.1.4 — unpublished local preview

- Settings provide Logs, Automations and States shortcuts with selectable folders and `mdi:cog-transfer`.
- Reuse existing matching links, including the legacy States route, and retain custom names/icons and all existing settings.
- Renamed folders immediately update all folder-selection labels without losing focus.
- Installed and verified only on .177, port 80. No publication.

## 0.1.3 — unpublished local preview

- All folders and main entries share the native drag-and-drop list; folders can be placed between main entries, without extra arrow buttons.
- Separate mixed-order storage preserves membership and never passes generated folder IDs into HA's saved native panel order.
- Native color/visibility controls remain available; native keyboard sorting is retained.

## 0.1.2 — unpublished local preview

- Native sidebar editor lists folders under Submenus with icons, color buttons and drag/keyboard/arrow sorting.
- Native Save/Cancel handles the folder-order draft separately from native HA panel IDs.
- Compensates a confirmed folder-order write if subsequent color/native save fails, without overwriting newer client changes.

## 0.1.1 — unpublished local preview

- Folder colors and opacity use the existing picker; apply to group names and icons, with reset to the HA theme.
- Existing layouts without a folder color retain their theme appearance.
- Existing per-entry colors and all native HA preferences remain unchanged.

## 0.1.0 — unpublished local preview

- Sidebar Colors retained as the color foundation, including its existing per-user data key.
- Added an original organizer model and dialog in DE/EN/FR: groups, separators, initial collapse, custom order, bottom placement, labels, MDI icons, hidden presentation and safe custom links.
- Added independent server-backed per-user layout storage, client subscription, previous-state backup, import/export, conflict checks and readback after uncertain writes.
- Missing panels are retained; reads and validation never automatically overwrite settings.
- Integration through the native HA sidebar editor, without replacing HA core files or moving Lit-owned native nodes.
- Uses LAN-HTTP-compatible ID generation.
- Local tests and .177 verification only. No publication, no remote repository and no release.

The reference Sidebar Organizer implementation was inspected for behavior. This package does not embed its source or claim complete feature parity.
