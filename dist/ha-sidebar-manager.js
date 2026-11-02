/* Sidebar Manager 0.1.4 | MIT | UGSo Software | local preview */
(() => {
  // src/core.js
  var VERSION = "0.1.4";
  var STORE_KEY = "ugso_sidebar_colors_v1";
  function supportedVersion(version) {
    const match = /^(\d+)\.(\d+)\.(\d+)(?:\D.*)?$/.exec(version || "");
    if (!match) return false;
    const [, year, month, patch] = match.map(Number);
    return year > 2026 || year === 2026 && (month > 10 || month === 10 && patch >= 3);
  }
  function normalizeColor(color) {
    if (!color || typeof color.hex !== "string" || !/^#[0-9a-f]{6}$/i.test(color.hex) || !Number.isInteger(color.alpha) || color.alpha < 0 || color.alpha > 100) return null;
    return { hex: color.hex.toLowerCase(), alpha: color.alpha };
  }
  function rgba(color) {
    const c = normalizeColor(color);
    if (!c) return null;
    const n = Number.parseInt(c.hex.slice(1), 16);
    return `rgba(${n >> 16}, ${n >> 8 & 255}, ${n & 255}, ${c.alpha / 100})`;
  }
  function normalizeRecord(record) {
    if (record != null && (record.version !== 1 || !record.colors || typeof record.colors !== "object" || Array.isArray(record.colors))) throw new Error("unsupported_record");
    const colors = /* @__PURE__ */ Object.create(null);
    for (const [key, value] of Object.entries(record?.colors || {})) {
      const color = normalizeColor(value);
      if (key.length > 0 && key.length <= 256 && color) colors[key] = color;
    }
    return { version: 1, colors };
  }
  function stable(value) {
    if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
    if (value && typeof value === "object") return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}`;
    return JSON.stringify(value);
  }
  var clone = (value) => structuredClone(value);
  async function saveColorDraft({ base, draft, read: read2, write, nativeSave, nativeChanged, backup }) {
    if (stable(base) === stable(draft)) {
      if (nativeChanged) await nativeSave();
      return;
    }
    const before = await read2();
    if (stable(normalizeRecord(before)) !== stable(base)) throw new Error("conflict");
    const record = { ...before || {}, version: 1, colors: clone(draft.colors) };
    await backup(before);
    let saved2 = false;
    try {
      try {
        await write(record);
        saved2 = true;
      } catch {
        const actual = await read2();
        if (stable(actual) !== stable(record)) throw new Error("save_uncertain");
        saved2 = true;
      }
      if (nativeChanged) await nativeSave();
    } catch (error) {
      if (saved2) {
        try {
          if (stable(await read2()) === stable(record)) await write(before);
          else throw new Error("conflict");
        } catch {
          throw new Error("rollback_uncertain");
        }
      }
      throw error;
    }
  }
  function hsvToHex(h, s, v) {
    h = (h % 360 + 360) % 360;
    s = Math.min(1, Math.max(0, s));
    v = Math.min(1, Math.max(0, v));
    const c = v * s, x = c * (1 - Math.abs(h / 60 % 2 - 1)), m = v - c;
    const rgb = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
    return "#" + rgb.map((n) => Math.round((n + m) * 255).toString(16).padStart(2, "0")).join("");
  }
  function hexToHsv(hex) {
    const n = Number.parseInt(hex.slice(1), 16);
    const [r, g, b] = [n >> 16, n >> 8 & 255, n & 255].map((n2) => n2 / 255);
    const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
    let h = 0;
    if (d) h = max === r ? 60 * ((g - b) / d % 6) : max === g ? 60 * ((b - r) / d + 2) : 60 * ((r - g) / d + 4);
    return [(h + 360) % 360, max ? d / max : 0, max];
  }

  // src/color-picker.js
  var STRINGS = {
    de: {
      color: "Farbe",
      alpha: "Deckkraft",
      hue: "Farbton",
      plane: "Sättigung und Helligkeit",
      hex: "HEX-Farbe",
      theme: "Theme-Farbe",
      done: "Übernehmen",
      cancel: "Abbrechen",
      edit: "Farbe für",
      saved: "Farben pro Benutzer synchronisiert",
      unavailable: "Seitenleistenfarben konnten nicht geladen werden. Dialog schließen und erneut öffnen.",
      conflict: "Einstellungen wurden auf einem anderen Gerät geändert. Bitte schließen und neu öffnen.",
      error: "Änderungen konnten nicht sicher gespeichert werden. Entwurf bleibt offen. Bitte Verbindung prüfen.",
      incompatible: "Seitenleistenfarben: Diese HA-Oberfläche wird noch nicht unterstützt.",
      busy: "Änderungen werden gespeichert …",
      transparent: "Vollständig transparent",
      reset: "Auf Theme-Farbe zurücksetzen"
    },
    en: {
      color: "Color",
      alpha: "Opacity",
      hue: "Hue",
      plane: "Saturation and brightness",
      hex: "HEX color",
      theme: "Theme color",
      done: "Apply",
      cancel: "Cancel",
      edit: "Color for",
      saved: "Colors synced per user",
      unavailable: "Sidebar colors could not be loaded. Close and reopen this dialog.",
      conflict: "Settings changed on another device. Please close and reopen this dialog.",
      error: "Changes could not be saved safely. Your draft remains open. Please check the connection.",
      incompatible: "Sidebar colors: This HA interface is not supported yet.",
      busy: "Saving changes …",
      transparent: "Fully transparent",
      reset: "Reset to theme color"
    },
    fr: {
      color: "Couleur",
      alpha: "Opacité",
      hue: "Teinte",
      plane: "Saturation et luminosité",
      hex: "Couleur HEX",
      theme: "Couleur du thème",
      done: "Appliquer",
      cancel: "Annuler",
      edit: "Couleur de",
      saved: "Couleurs synchronisées par utilisateur",
      unavailable: "Impossible de charger les couleurs. Fermez puis rouvrez cette fenêtre.",
      conflict: "Les réglages ont changé sur un autre appareil. Fermez puis rouvrez cette fenêtre.",
      error: "Enregistrement des modifications non confirmé. Votre brouillon reste ouvert. Vérifiez la connexion.",
      incompatible: "Couleurs du menu : cette interface HA n’est pas encore prise en charge.",
      busy: "Enregistrement des modifications …",
      transparent: "Entièrement transparent",
      reset: "Rétablir la couleur du thème"
    }
  };
  var strings = (hass) => STRINGS[(hass?.language || hass?.locale?.language || "en").split("-")[0]] || STRINGS.en;
  var SidebarColorPicker = class extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this.shadowRoot.innerHTML = `<style>
      :host{color:var(--primary-text-color,#eee);font-family:var(--ha-font-family-body,Arial,sans-serif)}
      dialog{color:inherit;background:var(--card-background-color,#222);border:1px solid var(--divider-color,#666);border-radius:16px;padding:20px;width:320px;max-width:calc(100vw - 56px);box-shadow:0 12px 40px #0008}
      dialog::backdrop{background:#0005}h3{font-size:17px;margin:0 0 16px;overflow-wrap:anywhere}
      .sv{position:relative;height:160px;border-radius:8px;touch-action:none;outline-offset:3px;background:linear-gradient(to top,#000,transparent),linear-gradient(to right,#fff,transparent),var(--hue)}
      .cursor{position:absolute;width:12px;height:12px;border:2px solid white;border-radius:50%;box-shadow:0 0 2px #000;transform:translate(-50%,-50%);pointer-events:none}
      label{display:block;font-size:13px;margin-top:12px}input[type=range]{width:100%;margin:10px 0 0;accent-color:var(--primary-color,#03a9f4)}
      .hue{appearance:none;height:14px;border-radius:8px;background:linear-gradient(to right,red,#ff0,#0f0,#0ff,#00f,#f0f,red)}
      .checker{background-color:#fff;background-image:conic-gradient(#aaa 25%,transparent 0 50%,#aaa 0 75%,transparent 0);background-size:12px 12px}
      .alpha-track{border-radius:8px;margin-top:8px}.alpha-track input{appearance:none;height:14px;border-radius:8px;margin:0;display:block;background:linear-gradient(to right,transparent,var(--solid))}
      .fields{display:flex;gap:12px;align-items:end}.fields label{flex:1;min-width:0}.fields input{box-sizing:border-box;width:100%;padding:8px;border:1px solid var(--divider-color,#777);border-radius:6px;background:var(--primary-background-color,#181818);color:inherit;font:inherit;margin-top:6px}
      .preview{margin:14px 0 0;border-radius:6px;overflow:hidden}.preview span{display:block;height:28px;background:var(--value)}
      .warn{font-size:12px;color:var(--warning-color,#ffb74d);min-height:16px;margin-top:6px}
      footer{display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;margin-top:12px}button{font:inherit;color:var(--primary-color,#03a9f4);background:transparent;border:1px solid var(--divider-color,#777);border-radius:8px;padding:8px 10px;min-height:40px;cursor:pointer}button:focus-visible{outline:2px solid var(--primary-color,#03a9f4);outline-offset:2px}.theme{margin-right:auto}
    </style><dialog aria-labelledby="title"><h3 id="title"></h3>
      <div class="sv" tabindex="0" role="slider" aria-valuemin="0" aria-valuemax="100"><span class="cursor"></span></div>
      <label class="hue-label"><span></span><input class="hue" type="range" min="0" max="360" step="1"></label>
      <label class="alpha-label"><span></span><div class="alpha-track checker"><input class="alpha" type="range" min="0" max="100" step="1"></div></label>
      <div class="fields"><label class="hex-label"><span></span><input class="hex" type="text" maxlength="7" spellcheck="false" pattern="#[0-9a-fA-F]{6}"></label>
      <label class="opacity-label"><span></span><input class="opacity" type="number" min="0" max="100" step="1"></label></div>
      <div class="preview checker"><span></span></div><div class="warn" role="status"></div>
      <footer><button class="theme" type="button"></button><button class="cancel" type="button"></button><button class="done" type="button"></button></footer>
    </dialog>`;
      const $ = (selector) => this.shadowRoot.querySelector(selector);
      this.$ = $;
      $(".hue").addEventListener("input", (e) => {
        this.hsv[0] = Number(e.target.value);
        this.change();
      });
      $(".alpha").addEventListener("input", (e) => {
        this.color.alpha = Number(e.target.value);
        this.change();
      });
      $(".opacity").addEventListener("input", (e) => {
        if (e.target.validity.valid && e.target.value !== "") {
          this.color.alpha = Number(e.target.value);
          this.change();
        }
      });
      $(".hex").addEventListener("input", (e) => {
        const c = normalizeColor({ hex: e.target.value, alpha: this.color.alpha });
        e.target.setCustomValidity(c ? "" : "#RRGGBB");
        if (c) {
          this.color = c;
          this.hsv = hexToHsv(c.hex);
          this.change();
        }
      });
      const plane = $(".sv");
      const move = (e) => {
        const rect = plane.getBoundingClientRect();
        this.hsv[1] = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        this.hsv[2] = 1 - Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
        this.change();
      };
      plane.addEventListener("pointerdown", (e) => {
        plane.setPointerCapture(e.pointerId);
        move(e);
      });
      plane.addEventListener("pointermove", (e) => {
        if (plane.hasPointerCapture(e.pointerId)) move(e);
      });
      plane.addEventListener("keydown", (e) => {
        if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(e.key)) return;
        e.preventDefault();
        e.stopPropagation();
        if (e.key === "ArrowLeft") this.hsv[1] = Math.max(0, this.hsv[1] - 0.01);
        if (e.key === "ArrowRight") this.hsv[1] = Math.min(1, this.hsv[1] + 0.01);
        if (e.key === "ArrowDown") this.hsv[2] = Math.max(0, this.hsv[2] - 0.01);
        if (e.key === "ArrowUp") this.hsv[2] = Math.min(1, this.hsv[2] + 0.01);
        this.change();
      });
      $(".theme").addEventListener("click", () => {
        this.onChange(null);
        this.finish();
      });
      $(".cancel").addEventListener("click", () => this.cancel());
      $(".done").addEventListener("click", () => {
        if ($(".hex").reportValidity() && $(".opacity").reportValidity()) this.finish();
      });
      $("dialog").addEventListener("cancel", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.cancel();
      });
      $("dialog").addEventListener("keydown", (e) => e.stopPropagation());
    }
    show({ label, color, hass, onChange }) {
      this.text = strings(hass);
      this.original = color ? { ...color } : null;
      this.color = color ? { ...color } : { hex: "#03a9f4", alpha: 100 };
      this.onChange = onChange;
      this.hsv = hexToHsv(this.color.hex);
      this.$("#title").textContent = `${this.text.edit} ${label}`;
      for (const [selector, key] of [[".hue-label span", "hue"], [".alpha-label span", "alpha"], [".hex-label span", "hex"], [".opacity-label span", "alpha"], [".theme", "theme"], [".cancel", "cancel"], [".done", "done"]]) this.$(selector).textContent = this.text[key];
      this.$(".sv").setAttribute("aria-label", this.text.plane);
      this.$(".hex").setCustomValidity("");
      this.render();
      this.$("dialog").showModal();
      this.$(".hex").focus();
    }
    render() {
      const [h, s, v] = this.hsv;
      this.$(".sv").style.setProperty("--hue", hsvToHex(h, 1, 1));
      this.$(".sv").setAttribute("aria-valuenow", String(Math.round(s * 100)));
      this.$(".sv").setAttribute("aria-valuetext", `${Math.round(s * 100)}% / ${Math.round(v * 100)}%`);
      this.$(".cursor").style.left = `${s * 100}%`;
      this.$(".cursor").style.top = `${(1 - v) * 100}%`;
      this.$(".hue").value = h;
      this.$(".alpha").value = this.color.alpha;
      this.$(".opacity").value = this.color.alpha;
      this.$(".hex").value = this.color.hex;
      this.$(".alpha-track").style.setProperty("--solid", this.color.hex);
      this.$(".preview").style.setProperty("--value", rgba(this.color));
      this.$(".warn").textContent = this.color.alpha === 0 ? this.text.transparent : "";
    }
    change() {
      this.color.hex = hsvToHex(...this.hsv);
      this.render();
      this.onChange({ ...this.color });
    }
    cancel() {
      this.onChange(this.original);
      this.finish();
    }
    finish() {
      this.$("dialog").close();
      this.remove();
    }
  };

  // src/manager-model.js
  var MANAGER_KEY = "ugso_sidebar_manager_v1";
  var HA_SHORTCUTS = [
    { id: "logs", url: "/config/logs" },
    { id: "automations", url: "/config/automation/dashboard" },
    { id: "states", url: "/config/tools/state", aliases: ["/developer-tools/state"] }
  ];
  function findShortcut(record, preset) {
    return Object.entries(record.items).find(([, v]) => [preset.url, ...preset.aliases || []].includes(v.url?.replace(/\/$/, "")));
  }
  function addShortcut(record, preset, title, group = "") {
    const existing = findShortcut(record, preset);
    if (existing) return existing[0];
    let key = "sm-link-ha-" + preset.id;
    if (record.items[key]) key = newId("sm-link");
    record.items[key] = { title, icon: "mdi:cog-transfer", url: preset.url, group: record.groups.some((g) => g.id === group) ? group : "", bottom: false, hidden: false };
    return key;
  }
  function newId(prefix) {
    return prefix + "-" + Array.from(crypto.getRandomValues(new Uint32Array(4)), (v) => v.toString(16).padStart(8, "0")).join("");
  }
  var text = (v) => typeof v === "string" ? v.trim().slice(0, 160) : "";
  var safeKey = (v) => typeof v === "string" && v.length > 0 && v.length <= 256 && !["__proto__", "constructor", "prototype"].includes(v);
  function safeUrl(value) {
    if (typeof value !== "string" || value.length > 2048 || /[\u0000-\u0020\\]/.test(value)) return null;
    if (value.startsWith("/") && !value.startsWith("//")) return value;
    try {
      const u = new URL(value);
      return ["https:", "http:"].includes(u.protocol) && !u.username && !u.password ? u.href : null;
    } catch {
      return null;
    }
  }
  function normalizeManager(raw) {
    if (raw != null && (raw.version !== 1 || !Array.isArray(raw.groups) || !raw.items || Array.isArray(raw.items) || typeof raw.items !== "object")) throw Error("unsupported_record");
    const groups = [], seen = /* @__PURE__ */ new Set(), items = /* @__PURE__ */ Object.create(null);
    for (const g of raw?.groups || []) {
      if (!safeKey(g.id) || !text(g.name) || seen.has(g.id)) throw Error("invalid_group");
      seen.add(g.id);
      groups.push({ id: g.id, name: text(g.name), icon: /^mdi:[a-z0-9-]+$/.test(g.icon || "") ? g.icon : "mdi:folder-outline", color: normalizeColor(g.color), collapsed: !!g.collapsed, bottom: !!g.bottom });
    }
    for (const [key, v] of Object.entries(raw?.items || {})) {
      if (!safeKey(key) || !v || typeof v !== "object") throw Error("invalid_item");
      const item = { title: text(v.title), icon: /^mdi:[a-z0-9-]+$/.test(v.icon || "") ? v.icon : "", group: seen.has(v.group) ? v.group : "", bottom: !!v.bottom, hidden: !!v.hidden };
      if (v.url != null) {
        item.url = safeUrl(v.url);
        if (!item.url) throw Error("invalid_url");
        if (!key.startsWith("sm-link-")) throw Error("invalid_item");
      }
      items[key] = item;
    }
    const order = [...new Set((raw?.order || []).filter(safeKey))];
    const menuOrder = [...new Set((raw?.menuOrder || []).filter((v) => safeKey(v) && (v.startsWith("p:") || v.startsWith("g:") && seen.has(v.slice(2)))))];
    return { version: 1, groups, items, order, menuOrder };
  }
  function layoutEntries(record, available) {
    const r = normalizeManager(record), rank = new Map(r.order.map((k, i) => [k, i]));
    const entries2 = available.map((e, i) => ({ ...e, ...r.items[e.key], key: e.key, rank: rank.has(e.key) ? rank.get(e.key) : r.order.length + i }));
    for (const [key, item] of Object.entries(r.items)) if (item.url && !entries2.some((e) => e.key === key)) entries2.push({ ...item, key, rank: rank.get(key) ?? 1e6 });
    entries2.sort((a, b) => a.rank - b.rank);
    const result = [], menuRank = new Map(r.menuOrder.map((k, i) => [k, i]));
    for (const bottom of [false, true]) {
      const blocks = [];
      for (const group of [null, ...r.groups]) {
        const members = entries2.filter((e) => (e.group || "") === (group?.id || "") && (group ? group.bottom : !!e.bottom) === bottom && !e.hidden);
        if (!members.length) continue;
        if (group) blocks.push({ token: "g:" + group.id, rows: [{ kind: "group", ...group }, ...members.map((item) => ({ kind: "item", ...item, collapsed: !!group.collapsed }))] });
        else for (const item of members) blocks.push({ token: "p:" + item.key, rows: [{ kind: "item", ...item, collapsed: false }] });
      }
      blocks.sort((a, b) => (menuRank.get(a.token) ?? 1e9) - (menuRank.get(b.token) ?? 1e9));
      for (const block of blocks) result.push(...block.rows);
    }
    return result;
  }
  async function saveManager({ base, draft, read: read2, write, backup }) {
    const value = normalizeManager(draft), before = await read2();
    if (stable(normalizeManager(before)) !== stable(base)) throw Error("conflict");
    if (stable(value) === stable(base)) return;
    await backup(clone(before));
    const next = { ...before || {}, ...value };
    try {
      await write(next);
    } catch {
      if (stable(await read2()) !== stable(next)) throw Error("save_uncertain");
    }
    if (stable(await read2()) !== stable(next)) throw Error("save_uncertain");
  }
  async function saveManagerWithFollowup(options, followup) {
    let before, written;
    await saveManager({ ...options, backup: async (value) => {
      before = clone(value);
      await options.backup(value);
    }, write: async (value) => {
      written = clone(value);
      await options.write(value);
    } });
    try {
      return await followup();
    } catch (error) {
      if (written !== void 0) {
        if (stable(await options.read()) !== stable(written)) throw Error("rollback_conflict");
        try {
          await options.write(before);
        } catch {
          if (stable(await options.read()) !== stable(before)) throw Error("rollback_uncertain");
        }
      }
      throw error;
    }
  }

  // src/manager-i18n.js
  var MANAGER_STRINGS = {
    de: { title: "Sidebar Manager", open: "Gruppen und Links verwalten", intro: "Farben, Auge und Reihenfolge bleiben im HA-Dialog. Hier organisieren Sie Gruppen, angeheftete Einträge und eigene Links. Erst Speichern übernimmt Änderungen.", groups: "Gruppen", addGroup: "Gruppe hinzufügen", name: "Name", collapsed: "Anfangs eingeklappt", bottom: "Unten anheften", remove: "Entfernen", up: "Nach oben", down: "Nach unten", items: "Einträge", group: "Gruppe", none: "Ohne Gruppe", label: "Anzeigename", icon: "Icon (mdi:…)", addLink: "Link hinzufügen", url: "Adresse", hidden: "Ausblenden", save: "Speichern", cancel: "Abbrechen", export: "Sicherung exportieren", import: "Sicherung importieren", importHint: "JSON-Sicherung einfügen", restore: "Sicherung laden", saved: "Gespeichert. Einstellungen sind pro HA-Benutzer synchronisiert.", error: "Nicht sicher gespeichert. Entwurf bleibt erhalten. Verbindung prüfen oder Dialog erneut öffnen.", conflict: "Zwischenzeitlich geändert. Entwurf exportieren, schließen und neu öffnen.", invalid: "Ungültige Sicherung oder Adresse. Nur interne Pfade und HTTP(S) sind erlaubt.", missing: "Derzeit nicht in HA verfügbar – Einstellung bleibt erhalten.", newGroup: "Neue Gruppe", newLink: "Neuer Link", busy: "Speichert …", source: "Eigene Darstellung; HA-Dashboards und Zugriffsrechte bleiben unverändert.", color: "Farbe", reset: "Eigene Darstellung zurücksetzen", resetHint: "Setzt nur den offenen Manager-Entwurf zurück; erst Speichern übernimmt dies." },
    en: { title: "Sidebar Manager", open: "Manage groups and links", intro: "Colors, visibility and ordering remain in the HA dialog. Organize groups, pinned entries and custom links here. Changes apply only after Save.", groups: "Groups", addGroup: "Add group", name: "Name", collapsed: "Initially collapsed", bottom: "Pin to bottom", remove: "Remove", up: "Move up", down: "Move down", items: "Entries", group: "Group", none: "No group", label: "Display name", icon: "Icon (mdi:…)", addLink: "Add link", url: "Address", hidden: "Hide", save: "Save", cancel: "Cancel", export: "Export backup", import: "Import backup", importHint: "Paste JSON backup", restore: "Load backup", saved: "Saved. Settings are synced per HA user.", error: "Save not confirmed. Your draft is preserved. Check the connection or reopen the dialog.", conflict: "Settings changed elsewhere. Export your draft, close and reopen.", invalid: "Invalid backup or address. Only internal paths and HTTP(S) are allowed.", missing: "Currently unavailable in HA – setting preserved.", newGroup: "New group", newLink: "New link", busy: "Saving …", source: "Presentation only; HA dashboards and access permissions remain unchanged.", color: "Color", reset: "Reset custom layout", resetHint: "Resets only the open Manager draft; Save applies it." },
    fr: { title: "Sidebar Manager", open: "Gérer les groupes et les liens", intro: "Couleurs, visibilité et ordre restent dans la fenêtre HA. Gérez ici les groupes, les entrées épinglées et les liens. Les changements sont appliqués après Enregistrer.", groups: "Groupes", addGroup: "Ajouter un groupe", name: "Nom", collapsed: "Replié au départ", bottom: "Épingler en bas", remove: "Supprimer", up: "Monter", down: "Descendre", items: "Entrées", group: "Groupe", none: "Sans groupe", label: "Nom affiché", icon: "Icône (mdi:…)", addLink: "Ajouter un lien", url: "Adresse", hidden: "Masquer", save: "Enregistrer", cancel: "Annuler", export: "Exporter la sauvegarde", import: "Importer une sauvegarde", importHint: "Coller la sauvegarde JSON", restore: "Charger la sauvegarde", saved: "Enregistré. Réglages synchronisés par utilisateur HA.", error: "Enregistrement non confirmé. Votre brouillon est conservé. Vérifiez la connexion ou rouvrez la fenêtre.", conflict: "Réglages modifiés ailleurs. Exportez le brouillon, fermez puis rouvrez.", invalid: "Sauvegarde ou adresse invalide. Seuls les chemins internes et HTTP(S) sont autorisés.", missing: "Actuellement indisponible dans HA – réglage conservé.", newGroup: "Nouveau groupe", newLink: "Nouveau lien", busy: "Enregistrement …", source: "Affichage uniquement ; tableaux de bord et autorisations HA restent inchangés.", color: "Couleur", reset: "Réinitialiser la présentation", resetHint: "Réinitialise seulement le brouillon Manager ; Enregistrer applique la modification." }
  };
  Object.assign(MANAGER_STRINGS.de, { none: "Hauptmenü", move: "In Ordner verschieben", groupColor: "Ordnerfarbe" });
  Object.assign(MANAGER_STRINGS.en, { none: "Main menu", move: "Move to folder", groupColor: "Folder color" });
  Object.assign(MANAGER_STRINGS.fr, { none: "Menu principal", move: "Déplacer dans un dossier", groupColor: "Couleur du dossier" });
  var managerStrings = (hass) => MANAGER_STRINGS[(hass?.language || hass?.locale?.language || "en").split("-")[0]] || MANAGER_STRINGS.en;
  Object.assign(MANAGER_STRINGS.de, { haShortcuts: "Home-Assistant-Verknüpfungen", shortcut_logs: "Logs", shortcut_automations: "Automationen", shortcut_states: "Zustände", shortcutAdd: "Hinzufügen", shortcutPresent: "Bereits vorhanden", shortcutHint: "Unterordner wählen und hinzufügen. Vorhandene Links werden wiederverwendet; ihre Zuordnung lässt sich hier ändern. Erst Speichern übernimmt Änderungen. HA-Zugriffsrechte gelten weiterhin." });
  Object.assign(MANAGER_STRINGS.en, { haShortcuts: "Home Assistant shortcuts", shortcut_logs: "Logs", shortcut_automations: "Automations", shortcut_states: "States", shortcutAdd: "Add", shortcutPresent: "Already present", shortcutHint: "Choose a folder and add the shortcut. Existing links are reused and their folder can be changed here. Save applies changes. Home Assistant access permissions still apply." });
  Object.assign(MANAGER_STRINGS.fr, { haShortcuts: "Raccourcis Home Assistant", shortcut_logs: "Journaux", shortcut_automations: "Automatisations", shortcut_states: "États", shortcutAdd: "Ajouter", shortcutPresent: "Déjà présent", shortcutHint: "Choisissez un dossier et ajoutez le raccourci. Les liens existants sont réutilisés et leur dossier peut être modifié ici. Enregistrer applique les changements. Les autorisations Home Assistant restent applicables." });
  Object.assign(MANAGER_STRINGS.de, { submenus: "Untermenü", moveGroup: "Untermenü verschieben", groupOrderHint: "Haupteinträge und Untermenüs am Ziehgriff gemeinsam sortieren. Erst Speichern übernimmt die Reihenfolge.", saveOrderFirst: "Reihenfolge geändert. Bitte zuerst hier Speichern oder Abbrechen, bevor Sie Gruppen bearbeiten." });
  Object.assign(MANAGER_STRINGS.en, { submenus: "Submenu", moveGroup: "Move submenu", groupOrderHint: "Sort main entries and submenus together using their drag handles. Save applies the order.", saveOrderFirst: "Order changed. Save or Cancel here before editing groups." });
  Object.assign(MANAGER_STRINGS.fr, { submenus: "Sous-menu", moveGroup: "Déplacer le sous-menu", groupOrderHint: "Triez les entrées principales et les sous-menus ensemble avec leur poignée. Enregistrer applique cet ordre.", saveOrderFirst: "Ordre modifié. Enregistrez ou annulez ici avant de modifier les groupes." });

  // src/manager-dialog.js
  var el = (tag, text2) => {
    const n = document.createElement(tag);
    if (text2) n.textContent = text2;
    return n;
  };
  var ManagerDialog = class extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
    }
    show({ hass, record, entries: entries2, save, focusKey, focusGroup }) {
      this.hass = hass;
      this.t = managerStrings(hass);
      this.draft = clone(normalizeManager(record));
      this.entries = entries2;
      this.saveRecord = save;
      this.busy = false;
      this.render();
      this.modal.showModal();
      this.modal.addEventListener("cancel", (e) => {
        e.preventDefault();
        if (!this.busy) this.remove();
      });
      const target = [...this.shadowRoot.querySelectorAll(".row[data-key]")].find((row) => row.dataset.key === focusKey);
      if (target) {
        target.style.outline = "2px solid var(--primary-color,#03a9f4)";
        target.scrollIntoView({ block: "center" });
        target.querySelector("select")?.focus();
      }
      const groupRow = [...this.shadowRoot.querySelectorAll(".cards:first-of-type .row")][this.draft.groups.findIndex((g) => g.id === focusGroup)];
      if (groupRow) {
        groupRow.scrollIntoView({ block: "center" });
        groupRow.querySelector("input")?.focus();
      }
    }
    button(label, fn, icon) {
      const b = el("button", icon || label);
      b.type = "button";
      b.title = label;
      b.setAttribute("aria-label", label);
      b.onclick = fn;
      return b;
    }
    input(label, value, change, type = "text") {
      const l = el("label"), n = el("input");
      l.append(el("span", label), n);
      n.type = type;
      if (type === "checkbox") n.checked = !!value;
      else n.value = value || "";
      n.oninput = () => change(type === "checkbox" ? n.checked : n.value);
      return l;
    }
    move(array, index, delta) {
      if (index + delta < 0 || index + delta >= array.length) return;
      [array[index], array[index + delta]] = [array[index + delta], array[index]];
      this.renderBody();
    }
    syncGroupLabels() {
      for (const select of this.shadowRoot.querySelectorAll("select")) for (const option of select.options) {
        const group = this.draft.groups.find((g) => g.id === option.value);
        if (group) option.textContent = group.name;
      }
    }
    groupColor(group) {
      const button = this.button(this.t.groupColor + " " + group.name, () => {
        const picker = document.createElement("ugso-sidebar-color-picker");
        document.body.append(picker);
        picker.show({ label: group.name, color: group.color, hass: this.hass, onChange: (color) => {
          group.color = color;
          paint();
        } });
      });
      button.style.cssText = "width:36px;height:36px;min-width:36px;padding:5px;background-image:conic-gradient(#999 25%,#fff 0 50%,#999 0 75%,#fff 0);background-size:10px 10px";
      const swatch = el("span");
      swatch.style.cssText = "display:block;width:100%;height:100%;border-radius:3px";
      button.replaceChildren(swatch);
      const paint = () => {
        swatch.style.background = rgba(group.color) || "transparent";
        button.title = this.t.groupColor + ": " + group.name;
      };
      paint();
      return button;
    }
    render() {
      const style = el("style");
      style.textContent = `:host{font:14px var(--ha-font-family,Arial,sans-serif);color:var(--primary-text-color,#222)}*{box-sizing:border-box}dialog{color:inherit;background:var(--card-background-color,#fff);border:1px solid var(--divider-color,#888);border-radius:16px;width:min(1050px,94vw);max-height:90dvh;padding:0}dialog::backdrop{background:#0008}header,footer{padding:16px 20px;display:flex;gap:8px;align-items:center;background:var(--secondary-background-color,#eee)}h2{font-size:20px;margin:0;flex:1}h3{margin:14px 0 8px}main{padding:0 20px 16px;overflow:auto;max-height:calc(90dvh - 150px)}p{line-height:1.5}.cards{display:grid;gap:8px}.row{border:1px solid var(--divider-color,#aaa);border-radius:8px;padding:10px;display:flex;gap:10px;align-items:center;flex-wrap:wrap}.row>strong{width:100%;overflow-wrap:anywhere}.row small{width:100%;opacity:.7}.row label{display:flex;gap:6px;align-items:center}.row label:has(input[type=text]){flex:1;min-width:160px}input,select,textarea{background:var(--primary-background-color,#fff);color:inherit;border:1px solid var(--divider-color,#888);border-radius:5px;padding:7px;font:inherit;min-width:0}input[type=text]{width:100%}button{font:inherit;border:1px solid var(--divider-color,#aaa);border-radius:7px;padding:8px 12px;min-height:36px;background:var(--secondary-background-color,#eee);color:inherit;cursor:pointer}button:hover{border-color:var(--primary-color,#03a9f4)}footer{justify-content:flex-end;flex-wrap:wrap}footer button{min-width:115px}.primary{background:var(--primary-color,#03a9f4);color:var(--text-primary-color,#fff)}textarea{width:100%;height:120px}.status{white-space:pre-wrap;overflow-wrap:anywhere}button:disabled{opacity:.5;cursor:wait}input[type=checkbox]{accent-color:var(--primary-color,#03a9f4)}@media(max-width:600px){main{padding:0 10px 10px}.row{gap:8px}.row label:has(input[type=text]){min-width:100%;}.row select{max-width:150px}header,footer{padding:12px}footer button{min-width:100px}}`;
      this.modal = el("dialog");
      this.modal.setAttribute("aria-label", this.t.title);
      const head = el("header");
      head.append(el("h2", this.t.title), this.button(this.t.cancel, () => {
        if (!this.busy) this.remove();
      }, "×"));
      this.main = el("main");
      this.foot = el("footer");
      this.modal.append(head, this.main, this.foot);
      this.shadowRoot.replaceChildren(style, this.modal);
      this.renderBody();
    }
    renderBody() {
      const t = this.t;
      this.main.replaceChildren(el("p", t.intro));
      this.main.append(el("h3", t.groups));
      const groups = el("div");
      groups.className = "cards";
      this.draft.groups.forEach((g, i) => {
        const row = el("div");
        row.className = "row";
        row.append(this.input(t.name, g.name, (v) => {
          g.name = v;
          this.syncGroupLabels();
        }), this.input(t.icon, g.icon, (v) => g.icon = v), this.groupColor(g), this.input(t.collapsed, g.collapsed, (v) => g.collapsed = v, "checkbox"), this.input(t.bottom, g.bottom, (v) => g.bottom = v, "checkbox"), this.button(t.up, () => this.move(this.draft.groups, i, -1), "↑"), this.button(t.down, () => this.move(this.draft.groups, i, 1), "↓"), this.button(t.remove, () => {
          this.draft.groups.splice(i, 1);
          for (const item of Object.values(this.draft.items)) if (item.group === g.id) item.group = "";
          this.renderBody();
        }, "×"));
        groups.append(row);
      });
      this.main.append(groups, this.button(t.addGroup, () => {
        this.draft.groups.push({ id: newId("group"), name: t.newGroup, icon: "mdi:folder-outline", collapsed: false, bottom: false });
        this.renderBody();
      }));
      this.main.append(el("h3", t.haShortcuts));
      const shortcuts = el("div");
      shortcuts.className = "cards sm-ha-shortcuts";
      this.presetGroups ||= {};
      for (const preset of HA_SHORTCUTS) {
        const existing = findShortcut(this.draft, preset), row = el("div");
        row.className = "row";
        row.dataset.shortcut = preset.id;
        row.append(el("strong", t["shortcut_" + preset.id]), el("small", preset.url));
        const label = el("label", t.group), select = el("select");
        select.setAttribute("aria-label", t.group + " " + t["shortcut_" + preset.id]);
        for (const g of [{ id: "", name: t.none }, ...this.draft.groups]) {
          const o = el("option", g.name);
          o.value = g.id;
          select.append(o);
        }
        select.value = existing ? existing[1].group : this.presetGroups[preset.id] || "";
        select.onchange = () => {
          this.presetGroups[preset.id] = select.value;
          if (existing) this.draft.items[existing[0]].group = select.value;
        };
        label.append(select);
        row.append(label);
        const add = this.button(existing ? t.shortcutPresent : t.shortcutAdd, () => {
          addShortcut(this.draft, preset, t["shortcut_" + preset.id], select.value);
          this.renderBody();
        });
        add.disabled = !!existing;
        row.append(add);
        shortcuts.append(row);
      }
      this.main.append(shortcuts, el("p", t.shortcutHint));
      this.main.append(el("h3", t.items));
      const items = el("div");
      items.className = "cards";
      const keys = [.../* @__PURE__ */ new Set([...this.draft.order, ...this.entries.map((e) => e.key), ...Object.keys(this.draft.items)])];
      keys.forEach((key, i) => {
        const original = this.entries.find((e) => e.key === key), current = this.draft.items[key];
        const item = current || { title: "", icon: "", group: "", bottom: false, hidden: false };
        const edit = (k, v) => {
          this.draft.items[key] ||= item;
          this.draft.items[key][k] = v;
        };
        const row = el("div");
        row.className = "row";
        row.dataset.key = key;
        row.append(el("strong", original?.label || current?.title || key));
        if (!original && !current?.url) row.append(el("small", t.missing));
        row.append(this.input(t.label, item.title, (v) => edit("title", v)), this.input(t.icon, item.icon, (v) => edit("icon", v)));
        const label = el("label", t.group), select = el("select");
        select.setAttribute("aria-label", t.group);
        for (const g of [{ id: "", name: t.none }, ...this.draft.groups]) {
          const o = el("option", g.name);
          o.value = g.id;
          select.append(o);
        }
        select.value = item.group || "";
        select.onchange = () => edit("group", select.value);
        label.append(select);
        row.append(label);
        row.append(this.input(t.bottom, item.bottom, (v) => edit("bottom", v), "checkbox"), this.input(t.hidden, item.hidden, (v) => edit("hidden", v), "checkbox"));
        row.append(this.button(t.up, () => {
          this.draft.order = keys;
          this.move(this.draft.order, i, -1);
        }, "↑"), this.button(t.down, () => {
          this.draft.order = keys;
          this.move(this.draft.order, i, 1);
        }, "↓"));
        if (item.url != null) row.append(this.input(t.url, item.url, (v) => edit("url", v)), this.button(t.remove, () => {
          delete this.draft.items[key];
          this.draft.order = this.draft.order.filter((k) => k !== key);
          this.renderBody();
        }, "×"));
        items.append(row);
      });
      this.main.append(items, this.button(t.addLink, () => {
        const key = newId("sm-link");
        this.draft.items[key] = { title: t.newLink, icon: "mdi:link", url: "/home", group: "", bottom: false, hidden: false };
        this.renderBody();
      }));
      const details = el("details");
      details.append(el("summary", t.import));
      const area = el("textarea");
      area.placeholder = t.importHint;
      area.setAttribute("aria-label", t.importHint);
      details.append(area, this.button(t.restore, () => {
        try {
          const parsed = JSON.parse(area.value);
          if (parsed.format !== "sidebar-manager" || parsed.version !== 1) throw Error();
          this.draft = normalizeManager(parsed.layout);
          this.renderBody();
        } catch {
          this.status.textContent = t.invalid;
        }
      }));
      this.main.append(details, el("p", t.source));
      this.status = el("p");
      this.status.className = "status";
      this.status.setAttribute("role", "status");
      this.main.append(this.status);
      this.foot.replaceChildren(this.button(t.export, () => {
        const blob = new Blob([JSON.stringify({ format: "sidebar-manager", version: 1, layout: normalizeManager(this.draft) }, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob), a = el("a");
        a.href = url;
        a.download = "sidebar-manager-backup.json";
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1e3);
      }), this.button(t.reset, () => {
        this.draft = normalizeManager(null);
        this.renderBody();
        this.status.textContent = t.resetHint;
      }), this.button(t.cancel, () => this.remove()));
      const save = this.button(t.save, async () => {
        try {
          this.busy = true;
          for (const b of this.shadowRoot.querySelectorAll("button,input,select,textarea")) b.disabled = true;
          this.status.textContent = t.busy;
          await this.saveRecord(normalizeManager(this.draft));
          this.remove();
        } catch (e) {
          this.status.textContent = e.message === "conflict" ? t.conflict : e.message?.startsWith("invalid") ? t.invalid : t.error;
        } finally {
          this.busy = false;
          for (const b of this.shadowRoot.querySelectorAll("button,input,select,textarea")) b.disabled = false;
        }
      });
      save.className = "primary";
      this.foot.append(save);
    }
  };

  // src/native-groups.js
  var sessions = /* @__PURE__ */ new WeakMap();
  var DIRTY_KEY = MANAGER_KEY + ":menu-order";
  var groupKey = (id) => "sm-group:" + id;
  var el2 = (tag, text2) => {
    const n = document.createElement(tag);
    if (text2) n.textContent = text2;
    return n;
  };
  var nativeGroupsDirty = (dialog) => !!sessions.get(dialog)?.dirty;
  var nativeGroupsBusy = (dialog) => !!sessions.get(dialog)?.saving;
  function endNativeGroups(dialog) {
    const s = sessions.get(dialog);
    if (s) {
      s.observer?.disconnect();
      s.native.style.display = s.display;
      s.section.remove();
    }
    sessions.delete(dialog);
  }
  function mixedMenuOrder(record, nativeOrder, items) {
    const valid = new Set(items.map((i) => i.value)), groups = new Set(record.groups.map((g) => groupKey(g.id)));
    const fromToken = (t) => t.startsWith("g:") ? groupKey(t.slice(2)) : t.startsWith("p:") ? t.slice(2) : "";
    const values = record.menuOrder.map(fromToken).filter((v) => valid.has(v) || groups.has(v));
    return [.../* @__PURE__ */ new Set([...values, ...nativeOrder.filter((v) => valid.has(v)), ...items.map((i) => i.value), ...groups])];
  }
  function render(dialog, s) {
    const t = managerStrings(dialog.hass), nativeItems = s.native.items || [];
    const signature = stable({ groups: s.draft.groups, menu: s.order, items: nativeItems.map((i) => [i.value, i.label, i.iconPath, i.disableHiding, i.disableSorting]), hidden: s.hidden, dirty: s.dirty, saving: s.saving, lang: t.groupOrderHint });
    if (!s.renderer) {
      s.renderer = (item) => {
        const group = s.draft.groups.find((g) => groupKey(g.id) === item.value);
        if (!group) return s.native.actionsRenderer?.(item);
        const label = el2("span", t.submenus);
        label.style.cssText = "font:12px var(--ha-font-family,Arial);color:var(--secondary-text-color);margin-inline:8px";
        const button = el2("button");
        button.type = "button";
        button.title = t.groupColor;
        button.setAttribute("aria-label", t.groupColor + " " + group.name);
        button.dataset.smGroup = group.id;
        button.style.cssText = "width:32px;min-width:32px;height:32px;padding:4px;border:1px solid var(--divider-color);border-radius:7px;background-image:conic-gradient(#999 25%,#fff 0 50%,#999 0 75%,#fff 0);background-size:8px 8px;cursor:pointer";
        const fill = el2("span");
        fill.style.cssText = "display:block;width:100%;height:100%;border-radius:3px";
        fill.style.background = rgba(group.color) || "transparent";
        button.append(fill);
        button.disabled = s.dirty || s.saving;
        button.onpointerdown = (e) => e.stopPropagation();
        button.onkeydown = (e) => e.stopPropagation();
        button.onclick = (e) => {
          e.stopPropagation();
          if (!s.dirty && !s.saving) s.options.editGroup(group.id);
        };
        return [label, button];
      };
      s.editor.actionsRenderer = s.renderer;
    }
    if (s.actionSource !== s.native.actionsRenderer) {
      s.actionSource = s.native.actionsRenderer;
      s.editor.requestUpdate?.();
    }
    if (s.signature !== signature) {
      s.signature = signature;
      s.hint.textContent = s.dirty ? t.saveOrderFirst : t.groupOrderHint;
      s.editor.items = [...nativeItems.map((i) => ({ ...i, smMixed: true })), ...s.draft.groups.map((g) => ({ value: groupKey(g.id), label: g.name, icon: g.icon, disableHiding: true }))];
      s.editor.value = { order: s.order, hidden: [...s.hidden] };
    }
    s.editor.hass = dialog.hass;
    s.editor.inert = !!s.saving;
    for (const row of s.editor.shadowRoot?.querySelectorAll("ha-md-list-item") || []) {
      const g = s.draft.groups.find((g2) => g2.id === row.querySelector("[data-sm-group]")?.dataset.smGroup);
      if (!g) continue;
      for (const n of row.querySelectorAll("[slot=headline],.icon")) n.style.color = rgba(g.color) || "";
    }
  }
  function changed(dialog, s, event) {
    event.stopPropagation();
    if (s.saving) return;
    const value = event.detail?.value;
    if (!value || !Array.isArray(value.order) || !Array.isArray(value.hidden)) return;
    const nativeKeys = new Set((s.native.items || []).map((i) => i.value)), groupIds = new Map(s.draft.groups.map((g) => [groupKey(g.id), g.id]));
    const priorNativeOrder = s.order.filter((v) => nativeKeys.has(v)), priorHidden = s.hidden;
    const order = value.order.filter((v) => nativeKeys.has(v) || groupIds.has(v));
    const tokens = order.map((v) => groupIds.has(v) ? "g:" + groupIds.get(v) : "p:" + v);
    const unseen = s.draft.menuOrder.filter((v) => !tokens.includes(v));
    s.order = order;
    s.draft.menuOrder = [...tokens, ...unseen];
    s.dirty = stable(s.draft.menuOrder) !== stable(s.base.menuOrder);
    dialog._dirtyStateContext.setState(s.dirty, DIRTY_KEY);
    const nativeValue = { order: order.filter((v) => nativeKeys.has(v)), hidden: value.hidden.filter((v) => nativeKeys.has(v)) };
    s.hidden = nativeValue.hidden;
    if (stable(nativeValue) !== stable({ order: priorNativeOrder, hidden: priorHidden })) {
      s.native.dispatchEvent(new CustomEvent("value-changed", { detail: { value: nativeValue }, bubbles: true, composed: true }));
    }
    s.signature = null;
    render(dialog, s);
    dialog.requestUpdate?.();
  }
  function attachNativeGroups(dialog, options) {
    const content = dialog.shadowRoot?.querySelector(".content"), native = content?.querySelector("ha-items-display-editor");
    if (!content || !native || !dialog._open) return;
    let s = sessions.get(dialog);
    const record = normalizeManager(options.record);
    if (!s) {
      const section = el2("section");
      section.className = "sm-native-groups";
      const hint = el2("p");
      hint.style.cssText = "font-size:12px;color:var(--secondary-text-color);line-height:1.4;margin:6px 0";
      const editor = el2("ha-items-display-editor");
      section.append(hint, editor);
      native.after(section);
      s = { section, hint, editor, native, display: native.style.display, base: clone(record), draft: clone(record), dirty: false, saving: false, identity: options.identity, options };
      s.order = mixedMenuOrder(record, dialog._order || [], native.items || []);
      s.hidden = [...native.value?.hidden || dialog._hidden || []];
      native.style.display = "none";
      sessions.set(dialog, s);
      dialog._dirtyStateContext.setState(false, DIRTY_KEY);
      editor.addEventListener("value-changed", (e) => changed(dialog, s, e));
      s.observer = new MutationObserver(() => render(dialog, s));
      if (editor.shadowRoot) s.observer.observe(editor.shadowRoot, { childList: true, subtree: true });
    }
    if (!s.dirty && !s.saving) {
      s.base = clone(record);
      s.draft = clone(record);
      s.identity = options.identity;
      s.order = mixedMenuOrder(record, dialog._order || [], native.items || []);
      s.hidden = [...native.value?.hidden || dialog._hidden || []];
    }
    s.options = options;
    render(dialog, s);
  }
  async function withNativeGroupsSave(dialog, followup) {
    const s = sessions.get(dialog);
    if (!s) return followup();
    if (s.saving) throw Error("busy");
    const options = s.options, owner = s.identity;
    const check = () => {
      if (options.getIdentity() !== owner || dialog.hass.user.id !== owner.id) throw Error("conflict");
    };
    check();
    s.saving = true;
    render(dialog, s);
    dialog.requestUpdate?.();
    try {
      if (!s.dirty) return await followup();
      return await saveManagerWithFollowup({ base: s.base, draft: s.draft, read: async () => {
        check();
        return options.read();
      }, write: async (value) => {
        check();
        await options.write(value);
      }, backup: async (before) => {
        check();
        await options.backup(before);
      } }, followup);
    } finally {
      s.saving = false;
      render(dialog, s);
      dialog.requestUpdate?.();
    }
  }

  // src/manager-runtime.js
  var config = normalizeManager(null);
  var hassRef;
  var identity;
  var off;
  var epoch = 0;
  var loaded = false;
  var instances = /* @__PURE__ */ new Set();
  var state = /* @__PURE__ */ new WeakMap();
  var editDialogs = /* @__PURE__ */ new Set();
  var collapsed = /* @__PURE__ */ new Map();
  var el3 = (tag, text2) => {
    const n = document.createElement(tag);
    if (text2) n.textContent = text2;
    return n;
  };
  async function request(hass, type, key, value) {
    let timer;
    try {
      return await Promise.race([hass.connection.sendMessagePromise({ type, key, ...type === "frontend/set_user_data" ? { value } : {} }), new Promise((_, reject) => timer = setTimeout(() => reject(Error("timeout")), 12e3))]);
    } finally {
      clearTimeout(timer);
    }
  }
  var read = (hass) => request(hass, "frontend/get_user_data", MANAGER_KEY).then((r) => r.value);
  function entries(sidebar) {
    return [...sidebar.shadowRoot.querySelectorAll('[id^="sidebar-panel-"]:not([data-sm-link])')].map((row) => ({ key: row.id.slice(14), label: row.querySelector(".item-text")?.textContent || row.id }));
  }
  function refreshManager() {
    for (const sidebar of instances) if (sidebar.isConnected) applyLayout(sidebar);
    else instances.delete(sidebar);
    for (const dialog of editDialogs) if (dialog.isConnected) attachManagerButton(dialog);
    else editDialogs.delete(dialog);
  }
  async function connect(hass) {
    if (!hass?.user?.id || !hass?.connection) return;
    hassRef = hass;
    const id = hass.user.id;
    if (identity?.id === id && identity.connection === hass.connection) return;
    identity = { id, connection: hass.connection };
    const current = ++epoch;
    off?.();
    loaded = false;
    config = normalizeManager(null);
    collapsed.clear();
    refreshManager();
    try {
      const value = normalizeManager(await read(hass));
      if (current !== epoch) return;
      config = value;
      loaded = true;
      refreshManager();
      const un = await hass.connection.subscribeMessage((e) => {
        if (current !== epoch) return;
        try {
          config = normalizeManager(e.value);
          loaded = true;
          collapsed.clear();
          refreshManager();
        } catch {
          console.warn("[Sidebar Manager] Unsupported stored layout; no automatic write.");
        }
      }, { type: "frontend/subscribe_user_data", key: MANAGER_KEY });
      if (current === epoch) off = un;
      else un();
    } catch {
      console.warn("[Sidebar Manager] Layout unavailable; stored data left untouched.");
    }
  }
  function openManager(sidebar, focusKey, focusGroup) {
    if ([...editDialogs].some((dialog2) => dialog2.isConnected && (nativeGroupsDirty(dialog2) || nativeGroupsBusy(dialog2)))) return;
    const hass = sidebar.hass;
    if (!loaded || hass.user.id !== identity?.id) return;
    if (document.querySelector("ugso-sidebar-manager-dialog")) return;
    const base = clone(config), owner = identity, currentEpoch = epoch, dialog = el3("ugso-sidebar-manager-dialog");
    document.body.append(dialog);
    dialog.show({ hass, record: base, entries: entries(sidebar), focusKey, focusGroup, save: async (draft) => {
      if (identity !== owner || epoch !== currentEpoch) throw Error("conflict");
      await saveManager({ base, draft, read: () => read(hass), write: (value) => {
        if (identity !== owner) throw Error("conflict");
        return request(hass, "frontend/set_user_data", MANAGER_KEY, value);
      }, backup: async (before) => localStorage.setItem("ugso-sidebar-manager-backup:" + hass.user.id, JSON.stringify({ at: (/* @__PURE__ */ new Date()).toISOString(), layout: before })) });
      config = clone(draft);
      collapsed.clear();
      refreshManager();
    } });
  }
  function attachManager(sidebar) {
    instances.add(sidebar);
    connect(sidebar.hass);
    if (!state.has(sidebar) && sidebar.shadowRoot) {
      const s = { headers: /* @__PURE__ */ new Map(), custom: /* @__PURE__ */ new Map() };
      state.set(sidebar, s);
      s.observer = new MutationObserver(() => {
        if (s.pending) return;
        s.pending = true;
        queueMicrotask(() => {
          s.pending = false;
          if (sidebar.isConnected) applyLayout(sidebar);
        });
      });
      s.observer.observe(sidebar.shadowRoot, { childList: true, subtree: true });
    }
    applyLayout(sidebar);
  }
  function attachManagerButton(nativeDialog) {
    editDialogs.add(nativeDialog);
    if (!nativeDialog._open) return;
    const content = nativeDialog.shadowRoot?.querySelector(".content");
    if (!content) return;
    let button = content.querySelector("[data-sm-open]");
    if (!button) {
      button = el3("button");
      button.dataset.smOpen = "";
      button.type = "button";
      button.style.cssText = "margin:8px 0;padding:10px;border:1px solid var(--divider-color);border-radius:8px;background:var(--card-background-color);color:var(--primary-text-color);cursor:pointer";
      button.onclick = () => {
        const sidebar = [...instances].find((s) => s.isConnected);
        if (sidebar) openManager(sidebar);
      };
      content.prepend(button);
    }
    if (loaded) attachNativeGroups(nativeDialog, { record: config, identity, getIdentity: () => identity, read: () => read(nativeDialog.hass), write: (value) => request(nativeDialog.hass, "frontend/set_user_data", MANAGER_KEY, value), backup: async (before) => localStorage.setItem("ugso-sidebar-manager-backup:" + nativeDialog.hass.user.id, JSON.stringify({ at: (/* @__PURE__ */ new Date()).toISOString(), layout: before })), editGroup: (id) => {
      const sidebar = [...instances].find((s) => s.isConnected);
      if (sidebar) openManager(sidebar, void 0, id);
    } });
    const title = managerStrings(nativeDialog.hass).open;
    if (button.textContent !== title) button.textContent = title;
    button.disabled = !loaded || nativeGroupsDirty(nativeDialog) || nativeGroupsBusy(nativeDialog);
    const editors = [...nativeDialog.shadowRoot.querySelectorAll("ha-items-display-editor")];
    for (const badge of editors.flatMap((e) => [...e.shadowRoot?.querySelectorAll("[data-sm-move]") || []])) {
      updateMoveBadge(badge, nativeDialog.hass);
      if (nativeGroupsDirty(nativeDialog) || nativeGroupsBusy(nativeDialog)) badge.disabled = true;
    }
  }
  function endManagerDialog(dialog) {
    editDialogs.delete(dialog);
    endNativeGroups(dialog);
  }
  function updateMoveBadge(button, hass) {
    const key = button.dataset.smMove, group = config.groups.find((g) => g.id === config.items[key]?.group), name = group?.name || managerStrings(hass).none;
    if (button.textContent !== name) button.textContent = name;
    button.title = managerStrings(hass).move + ": " + name;
    button.setAttribute("aria-label", managerStrings(hass).move + " " + button.dataset.smLabel + ": " + name);
    button.disabled = !loaded || [...editDialogs].some((dialog) => dialog.isConnected && (nativeGroupsDirty(dialog) || nativeGroupsBusy(dialog)));
  }
  function moveEntryButton(hass, key, label) {
    const button = el3("button");
    button.type = "button";
    button.dataset.smMove = key;
    button.dataset.smLabel = label || key;
    button.style.cssText = "box-sizing:border-box;width:105px;min-width:105px;max-width:105px;height:32px;padding:4px 7px;margin-inline:3px;border:1px solid var(--divider-color);border-radius:7px;background:var(--card-background-color);color:var(--secondary-text-color);font:12px var(--ha-font-family,Arial,sans-serif);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;cursor:pointer";
    updateMoveBadge(button, hass);
    button.onpointerdown = (e) => e.stopPropagation();
    button.onkeydown = (e) => e.stopPropagation();
    button.onclick = (e) => {
      e.stopPropagation();
      const sidebar = [...instances].find((s) => s.isConnected);
      if (sidebar) openManager(sidebar, key);
    };
    return button;
  }
  function override(row, item) {
    const label = row.querySelector(".item-text:not([data-sm-label])"), originalIcon = row.querySelector("[slot=start]:not([data-sm-icon])");
    let title = row.querySelector("[data-sm-label]"), icon = row.querySelector("[data-sm-icon]");
    if (item?.title) {
      if (!title) {
        title = el3("span");
        title.dataset.smLabel = "";
        title.className = "item-text";
        title.slot = "headline";
        row.append(title);
      }
      if (title.textContent !== item.title) title.textContent = item.title;
      if (label) label.hidden = true;
    } else {
      title?.remove();
      if (label) label.hidden = false;
    }
    if (item?.icon) {
      if (!icon) {
        icon = el3("ha-icon");
        icon.dataset.smIcon = "";
        icon.slot = "start";
        row.prepend(icon);
      }
      if (icon.icon !== item.icon) icon.icon = item.icon;
      if (originalIcon) originalIcon.hidden = true;
    } else {
      icon?.remove();
      if (originalIcon) originalIcon.hidden = false;
    }
  }
  function applyLayout(sidebar) {
    const root = sidebar.shadowRoot, s = state.get(sidebar);
    if (!root || !s) return;
    const slot = root.querySelector("slot[name=main-navigation]");
    if (!slot) return;
    if (!s.style) {
      s.style = el3("style");
      s.style.textContent = `slot[name=main-navigation]{display:flex;flex-direction:column;min-height:100%}[data-sm-group]{width:calc(100% - 8px);margin:7px 4px 2px;border:0;border-top:1px solid var(--divider-color);padding:10px 12px;text-align:start;font:inherit;font-weight:600;background:var(--secondary-background-color);color:var(--primary-text-color);cursor:pointer;border-radius:6px}[data-sm-bottom]{margin-top:auto!important}[data-sm-hidden]{display:none!important}[data-sm-label][hidden],[slot=start][hidden],.item-text[hidden]{display:none!important}.sm-entry{min-height:40px;padding:0 12px;display:flex;align-items:center;gap:20px;color:var(--sidebar-text-color);text-decoration:none}.sm-entry:hover{background:var(--secondary-background-color)}.sm-entry ha-icon{color:var(--sidebar-icon-color)}:host(:not([expanded])) [data-sm-group]{font-size:0;padding:8px} :host(:not([expanded])) [data-sm-group]::after{content:'⋯';font-size:18px}:host(:not([expanded])) .sm-entry .item-text{display:none}`;
      root.append(s.style);
    }
    if (!s.iconStyle) {
      s.iconStyle = el3("style");
      s.iconStyle.textContent = "[data-sm-group]{display:flex;align-items:center;gap:8px}[data-sm-group] ha-icon{--mdc-icon-size:20px;flex:none}[data-sm-group] .sm-group-label{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1}:host(:not([expanded])) [data-sm-group] .sm-group-label{display:none}:host(:not([expanded])) [data-sm-group]::after{display:none}";
      root.append(s.iconStyle);
    }
    for (const [id, node] of s.custom) if (!config.items[id]?.url) {
      node.remove();
      s.custom.delete(id);
    }
    for (const [key, item] of Object.entries(config.items)) if (item.url) {
      let row = s.custom.get(key);
      if (!row) {
        row = el3("a");
        row.className = "sm-entry";
        row.dataset.smLink = "";
        row.id = "sidebar-panel-" + key;
        row.append(el3("ha-icon"), el3("span"));
        row.firstElementChild.slot = "start";
        row.lastElementChild.className = "item-text";
        row.lastElementChild.slot = "headline";
        slot.append(row);
        s.custom.set(key, row);
      }
      row.href = item.url;
      row.firstElementChild.icon = item.icon || "mdi:link";
      if (row.lastElementChild.textContent !== item.title) row.lastElementChild.textContent = item.title;
      row.setAttribute("aria-label", item.title);
    }
    const available = entries(sidebar), layout = layoutEntries(config, available), keep = /* @__PURE__ */ new Set();
    let order = 0, bottomSeen = false;
    const rows = [...slot.querySelectorAll("[id^=sidebar-panel-]")];
    for (const row of rows) {
      const key = row.id.slice(14);
      row.style.removeProperty("order");
      row.removeAttribute("data-sm-bottom");
      row.toggleAttribute("data-sm-hidden", !!config.items[key]?.hidden);
      if (!row.hasAttribute("data-sm-link")) override(row, config.items[key]);
    }
    for (const entry of layout) {
      if (entry.kind === "group") {
        keep.add(entry.id);
        let head = s.headers.get(entry.id);
        if (!head) {
          head = el3("button");
          head.type = "button";
          head.dataset.smGroup = entry.id;
          const icon = el3("ha-icon"), label = el3("span");
          label.className = "sm-group-label";
          head.append(icon, label);
          head.onclick = () => {
            const g = config.groups.find((g2) => g2.id === entry.id);
            collapsed.set(entry.id, !(collapsed.get(entry.id) ?? g?.collapsed));
            refreshManager();
          };
          slot.append(head);
          s.headers.set(entry.id, head);
        }
        const isCollapsed = collapsed.get(entry.id) ?? entry.collapsed;
        const title = (isCollapsed ? "▸ " : "▾ ") + entry.name;
        if (head.lastElementChild.textContent !== title) head.lastElementChild.textContent = title;
        head.firstElementChild.icon = entry.icon;
        head.style.color = rgba(entry.color) || "";
        head.firstElementChild.style.color = rgba(entry.color) || "";
        head.title = entry.name;
        head.setAttribute("aria-label", entry.name);
        head.setAttribute("aria-expanded", String(!isCollapsed));
        head.style.order = String(order++);
        head.toggleAttribute("data-sm-bottom", entry.bottom && !bottomSeen);
        if (entry.bottom) bottomSeen = true;
      } else {
        const row = rows.find((r) => r.id === "sidebar-panel-" + entry.key);
        if (!row) continue;
        row.style.order = String(order++);
        const g = config.groups.find((g2) => g2.id === entry.group);
        row.toggleAttribute("data-sm-hidden", !!entry.hidden || !!(g && (collapsed.get(g.id) ?? g.collapsed)));
        const bottom = g ? g.bottom : entry.bottom;
        row.toggleAttribute("data-sm-bottom", !!bottom && !bottomSeen);
        if (bottom) bottomSeen = true;
      }
    }
    for (const [id, head] of s.headers) if (!keep.has(id)) {
      head.remove();
      s.headers.delete(id);
    }
  }

  // src/sidebar-colors.js
  var FLAG = /* @__PURE__ */ Symbol.for("ugso.sidebar.manager.loaded");
  var sessions2 = /* @__PURE__ */ new WeakMap();
  var styled = /* @__PURE__ */ new Map();
  var controllers = /* @__PURE__ */ new Set();
  var activeSession = null;
  var currentHass = null;
  var currentConnection = null;
  var currentUser = null;
  var saved = normalizeRecord(null);
  var unsubscribe;
  var epoch2 = 0;
  function findAll(root, selector) {
    const result = [...root.querySelectorAll(selector)];
    for (const node of root.querySelectorAll("*")) if (node.shadowRoot) result.push(...findAll(node.shadowRoot, selector));
    return result;
  }
  function warn(hass) {
    console.warn(`[Sidebar Colors ${VERSION}] ${strings(hass).incompatible}`);
  }
  function request2(dialog) {
    dialog.requestUpdate?.();
  }
  function message(session, text2, error = false) {
    session.message = text2;
    session.messageError = error;
    if (!session.dialog?.shadowRoot) return;
    let box = session.dialog.shadowRoot.querySelector(".ugso-color-status");
    if (!box) {
      box = document.createElement("div");
      box.className = "ugso-color-status";
      box.setAttribute("role", "status");
      box.style.cssText = "font-size:12px;padding:4px 24px 8px;overflow-wrap:anywhere";
      const content = session.dialog.shadowRoot.querySelector(".content");
      content?.prepend(box);
    }
    box.textContent = text2;
    box.style.color = error ? "var(--error-color,#db4437)" : "var(--secondary-text-color,#888)";
  }
  function isSupported(hass) {
    return supportedVersion(hass?.config?.version);
  }
  async function ws(hass, msg) {
    let timer;
    try {
      return await Promise.race([
        hass.connection.sendMessagePromise(msg),
        new Promise((_, reject) => {
          timer = setTimeout(() => reject(new Error("timeout")), 12e3);
        })
      ]);
    } finally {
      clearTimeout(timer);
    }
  }
  async function readRecord(hass, key = STORE_KEY) {
    return (await ws(hass, { type: "frontend/get_user_data", key })).value;
  }
  function writeRecord(hass, value) {
    return ws(hass, { type: "frontend/set_user_data", key: STORE_KEY, value });
  }
  function cssColor(node, value) {
    if (value) {
      if (!styled.has(node)) styled.set(node, { value: node.style.getPropertyValue("color"), priority: node.style.getPropertyPriority("color") });
      if (node.style.getPropertyValue("color") !== value || node.style.getPropertyPriority("color") !== "important") node.style.setProperty("color", value, "important");
    } else if (styled.has(node)) {
      const original = styled.get(node);
      styled.delete(node);
      if (original.value) node.style.setProperty("color", original.value, original.priority);
      else node.style.removeProperty("color");
    }
  }
  function applyRecord(sidebar, record) {
    if (!sidebar.shadowRoot) return;
    for (const row of sidebar.shadowRoot.querySelectorAll("[id^=sidebar-panel-]")) {
      const key = row.id.slice("sidebar-panel-".length);
      const value = rgba(record.colors[key]);
      for (const node of row.querySelectorAll("ha-icon[slot=start],ha-svg-icon[slot=start],.item-text,[slot=headline]")) cssColor(node, value);
    }
    for (const node of styled.keys()) if (!node.isConnected) styled.delete(node);
  }
  function refresh() {
    const record = activeSession?.loaded ? activeSession.draft : saved;
    for (const sidebar of controllers) {
      if (!sidebar.isConnected) {
        controllers.delete(sidebar);
        continue;
      }
      applyRecord(sidebar, record);
    }
    if (activeSession) syncRows(activeSession);
  }
  async function useConnection(hass) {
    if (!hass?.connection || !hass.user?.id || !isSupported(hass)) return;
    currentHass = hass;
    if (currentConnection === hass.connection && currentUser === hass.user.id) return;
    const generation = ++epoch2;
    unsubscribe?.();
    unsubscribe = void 0;
    currentConnection = hass.connection;
    currentUser = hass.user.id;
    saved = normalizeRecord(null);
    activeSession = null;
    refresh();
    try {
      const result = await readRecord(hass);
      if (generation !== epoch2) return;
      saved = normalizeRecord(result);
      refresh();
      const off2 = await hass.connection.subscribeMessage((event) => {
        if (generation !== epoch2) return;
        try {
          saved = normalizeRecord(event.value);
          refresh();
        } catch {
          warn(hass);
        }
      }, { type: "frontend/subscribe_user_data", key: STORE_KEY });
      if (generation !== epoch2) off2();
      else unsubscribe = off2;
    } catch {
      console.warn(`[Sidebar Colors ${VERSION}] ${strings(hass).unavailable}`);
    }
  }
  function markDirty(session) {
    session.dialog._dirtyStateContext.setState(clone(session.draft.colors), STORE_KEY);
    request2(session.dialog);
    refresh();
  }
  function makeButton(session, item) {
    const key = item.value;
    const cacheKey = (item.smMixed ? "mixed:" : "") + key;
    let button = session.buttons.get(cacheKey);
    if (!button) {
      button = document.createElement("button");
      button.type = "button";
      button.className = "ugso-sidebar-color";
      button.dataset.panel = key;
      button.style.cssText = "box-sizing:border-box;width:32px;height:32px;min-width:32px;padding:4px;border:1px solid var(--divider-color,#777);border-radius:7px;background:var(--card-background-color,#222);cursor:pointer;display:inline-flex;align-items:center;justify-content:center;margin-inline:2px 4px;vertical-align:middle";
      const swatch = document.createElement("span");
      swatch.style.cssText = "display:block;width:20px;height:20px;border-radius:4px;overflow:hidden;background-color:#fff;background-image:conic-gradient(#999 25%,transparent 0 50%,#999 0 75%,transparent 0);background-size:8px 8px;pointer-events:none";
      const fill = document.createElement("span");
      fill.style.cssText = "display:block;width:100%;height:100%";
      swatch.append(fill);
      button.append(swatch);
      button.addEventListener("pointerdown", (e) => e.stopPropagation());
      button.addEventListener("keydown", (e) => e.stopPropagation());
      button.addEventListener("click", (e) => {
        e.stopPropagation();
        if (session.saving || !session.loaded) return;
        session.picker?.finish();
        const picker = document.createElement("ugso-sidebar-color-picker");
        session.picker = picker;
        document.body.append(picker);
        picker.show({ label: item.label, color: session.draft.colors[key], hass: session.dialog.hass, onChange: (color) => {
          if (session.saving) return;
          const valid = normalizeColor(color);
          if (valid) session.draft.colors[key] = valid;
          else delete session.draft.colors[key];
          markDirty(session);
        } });
      });
      session.buttons.set(cacheKey, button);
    }
    button.setAttribute("aria-label", `${strings(session.dialog.hass).edit} ${item.label}`);
    button.title = button.getAttribute("aria-label");
    button.disabled = !!session.saving;
    const c = session.draft.colors[key];
    button.firstElementChild.firstElementChild.style.background = rgba(c) || "transparent";
    button.dataset.theme = c ? "false" : "true";
    return button;
  }
  function syncRows(session) {
    attachManagerButton(session.dialog);
    const editor = session.dialog.shadowRoot?.querySelector("ha-items-display-editor");
    if (!editor || !session.loaded) return;
    if (editor !== session.editor) {
      session.observer?.disconnect();
      session.editor = editor;
      session.previousRenderer = editor.actionsRenderer;
      editor.actionsRenderer = (item) => {
        const field = makeButton(session, item);
        const move = moveEntryButton(session.dialog.hass, item.value, item.label);
        return session.previousRenderer ? [session.previousRenderer(item), move, field] : [move, field];
      };
      if (editor.shadowRoot) {
        session.observer = new MutationObserver(() => syncRows(session));
        session.observer.observe(editor.shadowRoot, { childList: true, subtree: true });
      }
    }
    const displayEditors = [...session.dialog.shadowRoot.querySelectorAll("ha-items-display-editor")];
    for (const display of displayEditors) if (display.shadowRoot) session.observer?.observe(display.shadowRoot, { childList: true, subtree: true });
    for (const item of displayEditors.flatMap((e) => e.items || [])) if (!item.value.startsWith("sm-group:")) makeButton(session, item);
    for (const row of displayEditors.flatMap((e) => [...e.shadowRoot?.querySelectorAll("ha-md-list-item") || []])) {
      if (row.querySelector("[data-sm-group]")) continue;
      const panel = row.querySelector("[data-panel]")?.dataset.panel || row.value;
      const c = rgba(session.draft.colors[panel]);
      for (const target of row.querySelectorAll("[slot=headline],.icon")) cssColor(target, c);
    }
  }
  async function beginDialog(dialog) {
    endDialog(dialog);
    const hass = dialog.hass;
    if (!isSupported(hass) || typeof dialog._dirtyStateContext?.setState !== "function") {
      warn(hass);
      return;
    }
    const session = {
      dialog,
      hass,
      userId: hass.user.id,
      buttons: /* @__PURE__ */ new Map(),
      loaded: false,
      saving: false,
      nativeBase: { order: clone(dialog._order), hidden: clone(dialog._hidden) }
    };
    sessions2.set(dialog, session);
    activeSession = session;
    try {
      const [raw, native] = await Promise.all([readRecord(hass), readRecord(hass, "sidebar")]);
      if (sessions2.get(dialog) !== session || !dialog._open) return;
      session.rawBase = clone(raw);
      session.nativeStored = clone(native);
      session.base = normalizeRecord(raw);
      session.draft = clone(session.base);
      session.loaded = true;
      saved = clone(session.base);
      dialog._dirtyStateContext.setState(clone(session.base.colors), STORE_KEY);
      message(session, strings(hass).saved);
      request2(dialog);
      syncRows(session);
      refresh();
    } catch {
      message(session, strings(hass).unavailable, true);
    }
  }
  function endDialog(dialog) {
    endManagerDialog(dialog);
    const session = sessions2.get(dialog);
    if (!session) return;
    session.picker?.finish();
    session.observer?.disconnect();
    if (session.editor) session.editor.actionsRenderer = session.previousRenderer;
    sessions2.delete(dialog);
    if (activeSession === session) activeSession = null;
    refresh();
  }
  async function saveDialog(dialog, original, args, originalClose) {
    const session = sessions2.get(dialog);
    if (!session) return original.apply(dialog, args);
    if (session.saving) return;
    if (!session.loaded) {
      message(session, strings(dialog.hass).unavailable, true);
      return;
    }
    if (dialog.hass.user.id !== session.userId || dialog.hass.connection !== session.hass.connection) {
      message(session, strings(dialog.hass).conflict, true);
      return;
    }
    const hass = session.hass;
    session.saving = true;
    session.picker?.finish();
    syncRows(session);
    if (session.editor) session.editor.inert = true;
    message(session, strings(dialog.hass).busy);
    try {
      const nativeChanged = !!dialog._migrateToUserData || stable(session.nativeBase) !== stable({ order: dialog._order, hidden: dialog._hidden });
      if (nativeChanged && stable(await readRecord(hass, "sidebar")) !== stable(session.nativeStored)) throw new Error("conflict");
      await withNativeGroupsSave(dialog, () => saveColorDraft({
        base: session.base,
        draft: session.draft,
        read: () => readRecord(hass),
        write: (value) => writeRecord(hass, value),
        nativeChanged,
        backup: async (before) => {
          const key = `ugso-sidebar-colors-backup:${session.userId}`;
          localStorage.setItem(key, JSON.stringify({ at: (/* @__PURE__ */ new Date()).toISOString(), colors: before, sidebar: session.nativeStored }));
        },
        nativeSave: async () => {
          if (dialog.hass.user.id !== session.userId || dialog.hass.connection !== hass.connection) throw new Error("conflict");
          await original.apply(dialog, args);
          if (dialog._error || dialog.isDirtyState) throw new Error("native_save_failed");
        }
      }));
      saved = clone(session.draft);
      dialog._markDirtyStateClean();
      session.saving = false;
      endDialog(dialog);
      originalClose.call(dialog);
    } catch (error) {
      message(session, error.message === "conflict" ? strings(dialog.hass).conflict : strings(dialog.hass).error, true);
    } finally {
      session.saving = false;
      if (session.editor) session.editor.inert = false;
      syncRows(session);
      request2(dialog);
    }
  }
  function patchDialog(Type) {
    const proto = Type.prototype;
    const getData = proto._getData, save = proto._save, close = proto.closeDialog, closed = proto._dialogClosed;
    if ([getData, save, close, closed].some((fn) => typeof fn !== "function")) {
      warn(currentHass);
      return;
    }
    proto._getData = async function(...args) {
      await getData.apply(this, args);
      if (this._open && this._order && this._hidden) await beginDialog(this);
    };
    proto._save = function(...args) {
      return saveDialog(this, save, args, close);
    };
    proto.closeDialog = function(...args) {
      if (sessions2.get(this)?.saving) return;
      endDialog(this);
      return close.apply(this, args);
    };
    proto._dialogClosed = function(...args) {
      endDialog(this);
      return closed.apply(this, args);
    };
    const update = proto.updated;
    proto.updated = function(...args) {
      update?.apply(this, args);
      const session = sessions2.get(this);
      if (session?.loaded) queueMicrotask(() => syncRows(session));
    };
    for (const dialog of findAll(document, "dialog-edit-sidebar")) if (dialog._open) beginDialog(dialog);
  }
  if (!window[FLAG]) {
    window[FLAG] = true;
    if (!customElements.get("ugso-sidebar-color-picker")) customElements.define("ugso-sidebar-color-picker", SidebarColorPicker);
    customElements.whenDefined("ha-sidebar").then(() => {
      const Type = customElements.get("ha-sidebar"), original = Type.prototype.updated;
      Type.prototype.updated = function(...args) {
        original?.apply(this, args);
        if (!isSupported(this.hass)) return;
        controllers.add(this);
        useConnection(this.hass);
        attachManager(this);
        queueMicrotask(() => applyRecord(this, activeSession?.loaded ? activeSession.draft : saved));
      };
      for (const sidebar of findAll(document, "ha-sidebar")) {
        controllers.add(sidebar);
        useConnection(sidebar.hass);
        attachManager(sidebar);
        sidebar.requestUpdate?.();
      }
    });
    customElements.whenDefined("dialog-edit-sidebar").then(() => patchDialog(customElements.get("dialog-edit-sidebar")));
    if (!customElements.get("ugso-sidebar-manager-dialog")) customElements.define("ugso-sidebar-manager-dialog", ManagerDialog);
    console.info(`[Sidebar Manager ${VERSION}] Home Assistant >= 2026.10.3`);
  }
})();
