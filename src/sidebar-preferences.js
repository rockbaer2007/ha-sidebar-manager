import {clone, normalizeRecord, stable, STORE_KEY} from './core.js';
import {MANAGER_KEY, normalizeManager} from './manager-model.js';

export const PROFILES_KEY = 'ugso_sidebar_profiles_v1';
export const PREFERENCE_KEY = 'ugso_sidebar_profile_preference_v1';
const keys = {layout: MANAGER_KEY, colors: STORE_KEY, sidebar: 'sidebar'};
const list = value => Array.isArray(value)
  ? [...new Set(value.filter(item => typeof item === 'string' && item.length && item.length <= 256))]
  : [];

export function normalizeSidebar(value) {
  return {panelOrder: list(value?.panelOrder), hiddenPanels: list(value?.hiddenPanels)};
}

export function parseBackup(value) {
  if (value?.format !== 'sidebar-manager' || !value.layout || ![1, 2].includes(value.version)) throw Error('invalid_backup');
  const layout = normalizeManager(value.layout);
  if (value.version === 1) return {layout};
  if (!value.colors || !Array.isArray(value.sidebar?.panelOrder) || !Array.isArray(value.sidebar?.hiddenPanels)) throw Error('invalid_backup');
  return {layout, colors: normalizeRecord(value.colors), sidebar: normalizeSidebar(value.sidebar)};
}

export function makeBackup(layout, colors, sidebar) {
  return {format: 'sidebar-manager', version: 2, layout: normalizeManager(layout),
    colors: normalizeRecord(colors), sidebar: normalizeSidebar(sidebar)};
}

export function resolveProfile(record, userId) {
  if (record?.version !== 1 || !Array.isArray(record.profiles)) return undefined;
  const match = record.profiles.find(profile => profile?.users?.includes(userId))
    ?? record.profiles.find(profile => profile?.everyone === true);
  if (!match) return undefined;
  try { return {...match, backupFile: match.backup, backup: makeBackupFromProfile(match)}; } catch { return undefined; }
}

function makeBackupFromProfile(profile) {
  if (profile.backup?.version !== 2) throw Error('invalid_backup');
  return parseBackup(profile.backup);
}

export async function readPreferences(read, nativeFallback) {
  const [layout, colors, sidebar] = await Promise.all(Object.values(keys).map(read));
  return {layout, colors, sidebar, native: normalizeSidebar({...nativeFallback,...sidebar})};
}

export async function savePreferences({base, draft, read, write, backup}) {
  const changes = [];
  for (const [part, key] of Object.entries(keys)) {
    if (!Object.hasOwn(draft, part)) continue;
    const normalize = {layout: normalizeManager, colors: normalizeRecord, sidebar: normalizeSidebar}[part];
    const previous = base[part];
    if (stable(draft[part]) === stable(part === 'sidebar' ? base.native : normalize(previous))) continue;
    if (stable(await read(key)) !== stable(previous)) throw Error('conflict');
    changes.push({key, previous, next: {...previous, ...draft[part]}});
  }
  if (!changes.length) return;
  await backup(clone({layout: base.layout, colors: base.colors, sidebar: base.sidebar}));
  const attempted = [];
  try {
    for (const change of changes) {
      if (stable(await read(change.key)) !== stable(change.previous)) throw Error('conflict');
      attempted.push(change);
      await write(change.key, change.next);
      if (stable(await read(change.key)) !== stable(change.next)) throw Error('save_uncertain');
    }
  } catch (error) {
    for (const {key, previous, next} of attempted.reverse()) {
      const actual = await read(key);
      if (stable(actual) === stable(previous)) continue;
      if (stable(actual) !== stable(next)) throw Error('rollback_conflict');
      await write(key, previous);
    }
    throw error;
  }
}
