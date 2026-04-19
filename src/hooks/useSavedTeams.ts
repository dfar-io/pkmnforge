import { useCallback, useEffect, useState } from "react";
import type { PokemonDetail } from "@/lib/pokeapi";

// Saved-teams storage. Currently localStorage-backed; the API is intentionally
// shaped (async-ready, opaque IDs, named records) so it can be swapped for
// Lovable Cloud later without changing the consuming UI.
export interface SavedTeam {
  id: string;
  name: string;
  members: PokemonDetail[];
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEY = "pkmnforge.savedTeams.v1";
const MAX_TEAMS = 50;
const MAX_NAME_LEN = 60;

const isPokemonDetail = (v: unknown): v is PokemonDetail => {
  if (!v || typeof v !== "object") return false;
  const p = v as Record<string, unknown>;
  return (
    typeof p.id === "number" &&
    typeof p.name === "string" &&
    Array.isArray(p.types) &&
    typeof p.sprite === "string"
  );
};

const isSavedTeam = (v: unknown): v is SavedTeam => {
  if (!v || typeof v !== "object") return false;
  const t = v as Record<string, unknown>;
  return (
    typeof t.id === "string" &&
    typeof t.name === "string" &&
    Array.isArray(t.members) &&
    t.members.every(isPokemonDetail) &&
    typeof t.createdAt === "number" &&
    typeof t.updatedAt === "number"
  );
};

const readAll = (): SavedTeam[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isSavedTeam);
  } catch {
    return [];
  }
};

const writeAll = (teams: SavedTeam[]) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(teams));
  } catch {
    /* quota / private mode — silently ignore */
  }
};

const genId = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `t_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
};

export const useSavedTeams = () => {
  const [teams, setTeams] = useState<SavedTeam[]>(() => readAll());

  // Sync across tabs.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setTeams(readAll());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const persist = useCallback((next: SavedTeam[]) => {
    setTeams(next);
    writeAll(next);
  }, []);

  const saveNew = useCallback(
    (name: string, members: PokemonDetail[]): SavedTeam | null => {
      const trimmed = name.trim().slice(0, MAX_NAME_LEN);
      if (!trimmed || members.length === 0) return null;
      const now = Date.now();
      const team: SavedTeam = {
        id: genId(),
        name: trimmed,
        members,
        createdAt: now,
        updatedAt: now,
      };
      const next = [team, ...teams].slice(0, MAX_TEAMS);
      persist(next);
      return team;
    },
    [teams, persist],
  );

  const overwrite = useCallback(
    (id: string, members: PokemonDetail[]): SavedTeam | null => {
      const idx = teams.findIndex((t) => t.id === id);
      if (idx === -1) return null;
      const updated: SavedTeam = {
        ...teams[idx],
        members,
        updatedAt: Date.now(),
      };
      const next = [...teams];
      next[idx] = updated;
      persist(next);
      return updated;
    },
    [teams, persist],
  );

  const rename = useCallback(
    (id: string, name: string): SavedTeam | null => {
      const trimmed = name.trim().slice(0, MAX_NAME_LEN);
      if (!trimmed) return null;
      const idx = teams.findIndex((t) => t.id === id);
      if (idx === -1) return null;
      const updated: SavedTeam = {
        ...teams[idx],
        name: trimmed,
        updatedAt: Date.now(),
      };
      const next = [...teams];
      next[idx] = updated;
      persist(next);
      return updated;
    },
    [teams, persist],
  );

  const remove = useCallback(
    (id: string) => {
      persist(teams.filter((t) => t.id !== id));
    },
    [teams, persist],
  );

  /** Replace all saved teams wholesale (used by import/restore). */
  const replaceAll = useCallback(
    (next: SavedTeam[]) => {
      persist(next.slice(0, MAX_TEAMS));
    },
    [persist],
  );

  return { teams, saveNew, overwrite, rename, remove, replaceAll };
};
