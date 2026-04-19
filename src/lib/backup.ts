import type { PokemonBuild } from "@/lib/builds";
import type { SavedTeam } from "@/hooks/useSavedTeams";

export const BACKUP_VERSION = 1;
export const BACKUP_APP = "pokenex";

export interface BackupFile {
  app: typeof BACKUP_APP;
  version: number;
  exportedAt: number;
  builds: PokemonBuild[];
  savedTeams: SavedTeam[];
  favorites: number[];
}

const isBuild = (v: unknown): v is PokemonBuild => {
  if (!v || typeof v !== "object") return false;
  const b = v as Record<string, unknown>;
  return (
    typeof b.id === "string" &&
    typeof b.pokemonId === "number" &&
    typeof b.name === "string" &&
    typeof b.ability === "string" &&
    typeof b.item === "string" &&
    typeof b.natureId === "string" &&
    Array.isArray(b.moves) &&
    b.moves.length === 4 &&
    b.moves.every((m) => typeof m === "string") &&
    typeof b.notes === "string" &&
    typeof b.createdAt === "number" &&
    typeof b.updatedAt === "number"
  );
};

const isSavedTeam = (v: unknown): v is SavedTeam => {
  if (!v || typeof v !== "object") return false;
  const t = v as Record<string, unknown>;
  if (
    typeof t.id !== "string" ||
    typeof t.name !== "string" ||
    !Array.isArray(t.members) ||
    typeof t.createdAt !== "number" ||
    typeof t.updatedAt !== "number"
  ) {
    return false;
  }
  return t.members.every((m) => {
    if (!m || typeof m !== "object") return false;
    const p = m as Record<string, unknown>;
    return (
      typeof p.id === "number" &&
      typeof p.name === "string" &&
      Array.isArray(p.types) &&
      typeof p.sprite === "string"
    );
  });
};

export interface ParsedBackup {
  builds: PokemonBuild[];
  savedTeams: SavedTeam[];
  favorites: number[];
  /** Items present in the file but rejected by validation. */
  skipped: { builds: number; savedTeams: number; favorites: number };
}

export const parseBackup = (text: string): ParsedBackup => {
  const data = JSON.parse(text);
  if (!data || typeof data !== "object") {
    throw new Error("File is not a valid backup (not an object).");
  }
  if (data.app !== BACKUP_APP) {
    throw new Error("File is not a Pokénex backup.");
  }
  if (typeof data.version !== "number") {
    throw new Error("Backup is missing a version.");
  }
  if (data.version > BACKUP_VERSION) {
    throw new Error(
      `Backup version ${data.version} is newer than this app supports (${BACKUP_VERSION}). Update the app and try again.`,
    );
  }
  const rawBuilds = Array.isArray(data.builds) ? data.builds : [];
  const rawTeams = Array.isArray(data.savedTeams) ? data.savedTeams : [];
  const rawFavs = Array.isArray(data.favorites) ? data.favorites : [];
  const builds = rawBuilds.filter(isBuild) as PokemonBuild[];
  const savedTeams = rawTeams.filter(isSavedTeam) as SavedTeam[];
  const favorites = Array.from(
    new Set(rawFavs.filter((n: unknown): n is number => Number.isInteger(n) && (n as number) > 0)),
  );
  return {
    builds,
    savedTeams,
    favorites,
    skipped: {
      builds: rawBuilds.length - builds.length,
      savedTeams: rawTeams.length - savedTeams.length,
      favorites: rawFavs.length - favorites.length,
    },
  };
};

export const buildBackup = (
  builds: PokemonBuild[],
  savedTeams: SavedTeam[],
  favorites: number[],
): BackupFile => ({
  app: BACKUP_APP,
  version: BACKUP_VERSION,
  exportedAt: Date.now(),
  builds,
  savedTeams,
  favorites,
});

/** Merge strategy: keep both, dedupe by id (incoming wins on id collision). */
export const mergeById = <T extends { id: string }>(
  existing: T[],
  incoming: T[],
): T[] => {
  const map = new Map<string, T>();
  for (const item of existing) map.set(item.id, item);
  for (const item of incoming) map.set(item.id, item);
  return Array.from(map.values());
};

export const downloadJson = (filename: string, data: unknown) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const formatBackupFilename = (date = new Date()): string => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `pokenex-backup-${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(
    date.getDate(),
  )}-${pad(date.getHours())}${pad(date.getMinutes())}.json`;
};
