# Publication verification — 0.1.7, 2026-11-02

- Public repository: https://github.com/rockbaer2007/ha-sidebar-manager
- Release tag `v0.1.7`, source commit `8f152955ff0859ff6ec175e7e8b4cffb01412065`.
- [Repository CI](https://github.com/rockbaer2007/ha-sidebar-manager/actions/runs/41468883812) and [release build](https://github.com/rockbaer2007/ha-sidebar-manager/actions/runs/41469098622) successful. All 60 tests pass; rebuilding matches the checked-in bundle.
- [Public release](https://github.com/rockbaer2007/ha-sidebar-manager/releases/tag/v0.1.7) contains JS, installable ZIP, HACS/manual iframe configuration examples and SHA256SUMS.txt. All assets were downloaded again and every checksum verified; JS equals the local build.
- JS SHA-256: `8806a796c78a51c59fa84b2fbb173a685aa6c118b9edcb4017ce166ce20dca60`.
- ZIP SHA-256: `84082c9f615ddd4273e02f44894d443a7e0bf3785e1b3c12d9e2d92a88bfdcab`.
- Documentation commit `502cdfd85ade816d2929975e2900e347a14a0644`; [documentation deployment](https://github.com/rockbaer2007/ugso-opensource-docs/actions/runs/41469365238) builds once and publishes the same output on both domains. Mirror commit `f4e7e7db1e5a6a5027911de1f77e6062b195c073` records that source revision.
- DE, EN and FR pages under `/projects/sidebar-manager/`, `/en/projects/sidebar-manager/` and `/fr/projects/sidebar-manager/` return HTTP 200 on both `https://opensource.ugso-software.de` and `https://ugso-opensource.net`. HTML hashes match for each pair; the published folder-position screenshot matches the source on both domains.
- Browser check confirms the public release/assets, documentation 0.1.7, installation examples, navigation and all five loaded screenshots. Local docs build and all navigation, locale inventory, translation-completion, documentation-review and UIX checks pass. Existing pages and links retained.
- No HA configuration, credentials, layouts or dashboards changed for publication. The previously confirmed three full test-system backups remain untouched. Earlier local ZIPs remain available; a separate public ZIP was saved in Downloads.
- DE/EN forum text is a draft in `FORUM-DE-EN.txt`; no forum message was sent because no destination is selected. Default catalog inclusion and a live Marketplace test are not claimed.
