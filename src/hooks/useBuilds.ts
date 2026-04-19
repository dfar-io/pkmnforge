import { useCallback, useEffect, useState } from "react";
import {
  BUILD_NAME_MAX,
  BUILD_NOTES_MAX,
  EMPTY_MOVES,
  type PokemonBuild,
} from "@/lib/builds";

const STORAGE_KEY = "pokenex.builds.v1";

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

const readAll = (): PokemonBuild[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isBuild);
  } catch {
    return [];
  }
};

const genId = (): string => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `b_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
};

export interface BuildDraft {
  name: string;
  ability: string;
  item: string;
  natureId: string;
  moves: [string, string, string, string];
  notes: string;
}

export const emptyDraft = (): BuildDraft => ({
  name: "",
  ability: "",
  item: "",
  natureId: "",
  moves: [...EMPTY_MOVES] as [string, string, string, string],
  notes: "",
});

const sanitize = (draft: BuildDraft): BuildDraft => ({
  name: draft.name.trim().slice(0, BUILD_NAME_MAX),
  ability: draft.ability.trim().slice(0, 60),
  item: draft.item.trim().slice(0, 60),
  natureId: draft.natureId.trim().slice(0, 30),
  moves: draft.moves.map((m) => m.trim().slice(0, 60)) as [string, string, string, string],
  notes: draft.notes.slice(0, BUILD_NOTES_MAX),
});

export const useBuilds = () => {
  const [builds, setBuilds] = useState<PokemonBuild[]>(() => readAll());

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(builds));
    } catch {
      /* ignore quota */
    }
  }, [builds]);

  // Sync across tabs.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setBuilds(readAll());
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const getForPokemon = useCallback(
    (pokemonId: number) => builds.filter((b) => b.pokemonId === pokemonId),
    [builds],
  );

  const getById = useCallback(
    (id: string) => builds.find((b) => b.id === id),
    [builds],
  );

  const create = useCallback(
    (pokemonId: number, draft: BuildDraft): PokemonBuild => {
      const clean = sanitize(draft);
      const now = Date.now();
      const build: PokemonBuild = {
        id: genId(),
        pokemonId,
        name: clean.name || "Untitled build",
        ability: clean.ability,
        item: clean.item,
        natureId: clean.natureId,
        moves: clean.moves,
        notes: clean.notes,
        createdAt: now,
        updatedAt: now,
      };
      setBuilds((prev) => [build, ...prev]);
      return build;
    },
    [],
  );

  const update = useCallback((id: string, draft: BuildDraft): PokemonBuild | null => {
    const clean = sanitize(draft);
    let updated: PokemonBuild | null = null;
    setBuilds((prev) => {
      const idx = prev.findIndex((b) => b.id === id);
      if (idx === -1) return prev;
      updated = {
        ...prev[idx],
        name: clean.name || "Untitled build",
        ability: clean.ability,
        item: clean.item,
        natureId: clean.natureId,
        moves: clean.moves,
        notes: clean.notes,
        updatedAt: Date.now(),
      };
      const next = [...prev];
      next[idx] = updated;
      return next;
    });
    return updated;
  }, []);

  const remove = useCallback((id: string) => {
    setBuilds((prev) => prev.filter((b) => b.id !== id));
  }, []);

  return { builds, getForPokemon, getById, create, update, remove };
};
