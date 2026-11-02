# Sidebar Manager 0.1.8

Custom links now appear in Home Assistant’s **Edit sidebar** dialog alongside other entries.

- Internal and external links without a saved position initially appear at the end; existing ordering is preserved.
- Choose colors and opacity, hide/show links, and sort them using the native drag handles or keyboard controls.
- Link buttons read **Link / Ext. link** (DE: **Link / ext. Link**, FR: **Lien / Lien ext.**) instead of the folder name. Clicking still opens that link’s settings; folder membership is preserved.
- Link positions also apply among native entries within a folder. Dragging does not reassign the folder. Moving a bottom-pinned custom link above a normal block releases its bottom pin.
- Saved link colors apply immediately when sidebar rows are created.
- Manager layout/visibility and entry colors keep their existing storage namespaces. Generated link/folder IDs never enter HA’s native panel preferences. Existing settings and link opening modes are preserved.

The user confirmed successful functional verification on **2 November 2026**. Syntax checks, the build and **70 automated tests** pass. This confirmation is separate from automated testing; no additional independent HA runtime test was performed for 0.1.8. Minimum target remains **HA 2026.10.3**; historical 0.1.7 runtime verification was on **2026.10.4**. No separate Marketplace live test is claimed.

Update through your existing HACS custom repository or replace the manual installation’s JavaScript at its current path, then reload the browser. Back up first, retain existing settings and load only one Sidebar Manager module. The optional iframe host module URL must match `frontend.extra_module_url`.

Assets include the standalone JavaScript, installable ZIP with DE/EN/FR documentation, both iframe configuration examples and SHA-256 checksums. No Organizer configuration import is included.

[DE documentation](https://opensource.ugso-software.de/projects/sidebar-manager/) · [EN documentation](https://opensource.ugso-software.de/en/projects/sidebar-manager/) · [FR documentation](https://opensource.ugso-software.de/fr/projects/sidebar-manager/)
