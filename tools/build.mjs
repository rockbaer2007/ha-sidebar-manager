import {mkdir,readFile,writeFile,copyFile} from "node:fs/promises";
import {resolve} from "node:path";
import {build} from "esbuild";
const root=resolve(import.meta.dirname,"..");
await mkdir(resolve(root,"dist"),{recursive:true});
// Source modules stay separate; no CDN, runtime dependency or external request.
for(const name of ["core.js","color-picker.js","sidebar-colors.js","manager-model.js","manager-runtime.js","manager-dialog.js","manager-i18n.js","native-groups.js","web-panel.js"])
  await copyFile(resolve(root,"src",name),resolve(root,"dist",name));
const pkg=JSON.parse(await readFile(resolve(root,"package.json"),"utf8"));
await build({entryPoints:[resolve(root,"src/sidebar-colors.js")],
  outfile:resolve(root,"dist/ha-sidebar-manager.js"),bundle:true,format:"iife",
  target:"es2022",charset:"utf8",legalComments:"inline",
  banner:{js:`/* Sidebar Manager ${pkg.version} | MIT | UGSo Software | local preview */`}});
await writeFile(resolve(root,"dist","version.json"),JSON.stringify({version:pkg.version,minimum_ha:"2026.10.3"},null,2)+"\n");
await writeFile(resolve(root,'dist','panel-custom.example.yaml'),`# Merge this entry into an existing panel_custom list if present.\npanel_custom:\n  - name: ugso-sidebar-web\n    url_path: ugso-sidebar-web\n    module_url: /local/ugso-sidebar-manager/${pkg.version}/ha-sidebar-manager.js\n    embed_iframe: false\n    require_admin: false\n`);
console.log("Built local Sidebar Manager "+pkg.version);
