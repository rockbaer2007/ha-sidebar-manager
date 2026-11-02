export const VERSION = "0.1.7";
export const STORE_KEY = "ugso_sidebar_colors_v1";

export function supportedVersion(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)(?:\D.*)?$/.exec(version || "");
  if (!match) return false;
  const [, year, month, patch] = match.map(Number);
  return year > 2026 || (year === 2026 && (month > 10 || (month === 10 && patch >= 3)));
}

export function normalizeColor(color) {
  if (!color || typeof color.hex !== "string" || !/^#[0-9a-f]{6}$/i.test(color.hex)
      || !Number.isInteger(color.alpha) || color.alpha < 0 || color.alpha > 100) return null;
  return { hex: color.hex.toLowerCase(), alpha: color.alpha };
}

export function rgba(color) {
  const c = normalizeColor(color);
  if (!c) return null;
  const n = Number.parseInt(c.hex.slice(1), 16);
  return `rgba(${n >> 16}, ${(n >> 8) & 255}, ${n & 255}, ${c.alpha / 100})`;
}

export function normalizeRecord(record) {
  if (record != null && (record.version !== 1 || !record.colors || typeof record.colors !== "object"
      || Array.isArray(record.colors))) throw new Error("unsupported_record");
  const colors = Object.create(null);
  for (const [key, value] of Object.entries(record?.colors || {})) {
    const color = normalizeColor(value);
    if (key.length > 0 && key.length <= 256 && color) colors[key] = color;
  }
  return { version: 1, colors };
}

export function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
  if (value && typeof value === "object") return `{${Object.keys(value).sort().map(key =>
    `${JSON.stringify(key)}:${stable(value[key])}`).join(",")}}`;
  return JSON.stringify(value);
}

export const clone = value => structuredClone(value);

// Only our namespace is written. A native-only save never rewrites our colors.
// Do not auto-retry uncertain writes. Read back to distinguish accepted writes
// from a lost acknowledgement; a new click/reopen is required after uncertainty.
export async function saveColorDraft({ base, draft, read, write, nativeSave, nativeChanged, backup }) {
  if (stable(base) === stable(draft)) {
    if (nativeChanged) await nativeSave();
    return;
  }
  const before = await read();
  if (stable(normalizeRecord(before)) !== stable(base)) throw new Error("conflict");
  const record = { ...(before || {}), version: 1, colors: clone(draft.colors) };
  await backup(before);
  let saved = false;
  try {
    try {
      await write(record);
      saved = true;
    } catch {
      const actual = await read();
      if (stable(actual) !== stable(record)) throw new Error("save_uncertain");
      saved = true;
    }
    if (nativeChanged) await nativeSave();
  } catch (error) {
    if (saved) {
      // Compensate a failed native save only if no other client changed colors.
      try {
        if (stable(await read()) === stable(record)) await write(before);
        else throw new Error("conflict");
      } catch { throw new Error("rollback_uncertain"); }
    }
    throw error;
  }
}

export function hsvToHex(h, s, v) {
  h = ((h % 360) + 360) % 360;
  s = Math.min(1, Math.max(0, s)); v = Math.min(1, Math.max(0, v));
  const c = v * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = v - c;
  const rgb = h < 60 ? [c,x,0] : h < 120 ? [x,c,0] : h < 180 ? [0,c,x]
    : h < 240 ? [0,x,c] : h < 300 ? [x,0,c] : [c,0,x];
  return "#" + rgb.map(n => Math.round((n + m) * 255).toString(16).padStart(2, "0")).join("");
}

export function hexToHsv(hex) {
  const n = Number.parseInt(hex.slice(1), 16);
  const [r,g,b] = [n >> 16, (n >> 8) & 255, n & 255].map(n => n / 255);
  const max = Math.max(r,g,b), min = Math.min(r,g,b), d = max - min;
  let h = 0;
  if (d) h = max === r ? 60 * (((g-b)/d) % 6) : max === g ? 60 * ((b-r)/d+2) : 60 * ((r-g)/d+4);
  return [(h + 360) % 360, max ? d / max : 0, max];
}
