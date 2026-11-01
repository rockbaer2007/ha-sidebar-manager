# Changelog

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
