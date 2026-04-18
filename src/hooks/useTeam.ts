import { useEffect, useState } from "react";
import { toast } from "sonner";
import { fetchPokemonDetail, type PokemonDetail } from "@/lib/pokeapi";
import { getNatureByCode, getNatureById } from "@/lib/natures";

const STORAGE_KEY = "pkmnforge.team.v1";
const NATURES_STORAGE_KEY = "pkmnforge.natures.v1";
const LEGACY_STORAGE_KEYS = ["teamforge.team.v1"] as const;

export type NatureMap = Record<number, string>;

// Parse `?team=1,4,7` into a list of valid dex IDs (deduped, capped to teamSize).
const parseTeamFromQuery = (teamSize: number): number[] => {
  if (typeof window === "undefined") return [];
  try {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get("team");
    if (!raw) return [];
    const ids: number[] = [];
    for (const part of raw.split(",")) {
      const n = Number(part.trim());
      if (Number.isInteger(n) && n > 0 && n <= 1025 && !ids.includes(n)) {
        ids.push(n);
      }
      if (ids.length >= teamSize) break;
    }
    return ids;
  } catch {
    return [];
  }
};

// Parse `?natures=25:ad,6:jo` — a comma list of `dexId:natureCode` pairs.
const parseNaturesFromQuery = (): NatureMap => {
  if (typeof window === "undefined") return {};
  try {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get("natures");
    if (!raw) return {};
    const out: NatureMap = {};
    for (const part of raw.split(",")) {
      const [idStr, code] = part.split(":");
      const id = Number(idStr?.trim());
      const nature = code ? getNatureByCode(code.trim()) : undefined;
      if (Number.isInteger(id) && id > 0 && nature) out[id] = nature.id;
    }
    return out;
  } catch {
    return {};
  }
};

const loadStoredTeam = (teamSize: number): PokemonDetail[] => {
  if (typeof window === "undefined") return [];
  if (parseTeamFromQuery(teamSize).length > 0) return [];
  try {
    let raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      for (const legacy of LEGACY_STORAGE_KEYS) {
        const legacyRaw = window.localStorage.getItem(legacy);
        if (legacyRaw) {
          raw = legacyRaw;
          window.localStorage.setItem(STORAGE_KEY, legacyRaw);
          window.localStorage.removeItem(legacy);
          break;
        }
      }
    } else {
      for (const legacy of LEGACY_STORAGE_KEYS) {
        window.localStorage.removeItem(legacy);
      }
    }

    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (p): p is PokemonDetail =>
          p &&
          typeof p.id === "number" &&
          typeof p.name === "string" &&
          Array.isArray(p.types) &&
          typeof p.sprite === "string",
      )
      .slice(0, teamSize);
  } catch {
    return [];
  }
};

// Stored as a flat `{ [pokemonId]: natureId }` map, which lets natures persist
// across reorders and removals without having to update parallel arrays.
const loadStoredNatures = (): NatureMap => {
  if (typeof window === "undefined") return {};
  if (parseTeamFromQuery(6).length > 0) return {};
  try {
    const raw = window.localStorage.getItem(NATURES_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    const out: NatureMap = {};
    for (const [k, v] of Object.entries(parsed)) {
      const id = Number(k);
      if (Number.isInteger(id) && id > 0 && typeof v === "string" && getNatureById(v)) {
        out[id] = v;
      }
    }
    return out;
  } catch {
    return {};
  }
};

/**
 * Manages team + per-Pokémon nature state with localStorage persistence and
 * one-time hydration from `?team=` (and optional `?natures=`) query params.
 * The URL params win on first load and are stripped after hydration.
 */
export const useTeam = (teamSize: number) => {
  const [team, setTeam] = useState<PokemonDetail[]>(() => loadStoredTeam(teamSize));
  const [natures, setNatures] = useState<NatureMap>(() => loadStoredNatures());

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(team));
    } catch {
      /* ignore */
    }
  }, [team]);

  useEffect(() => {
    try {
      window.localStorage.setItem(NATURES_STORAGE_KEY, JSON.stringify(natures));
    } catch {
      /* ignore */
    }
  }, [natures]);

  // One-time hydration from `?team=` (and `?natures=`) query string.
  useEffect(() => {
    const ids = parseTeamFromQuery(teamSize);
    if (ids.length === 0) return;
    const sharedNatures = parseNaturesFromQuery();
    let cancelled = false;
    (async () => {
      try {
        const details = await Promise.all(
          ids.map((id) => fetchPokemonDetail(id).catch(() => null)),
        );
        if (cancelled) return;
        const valid = details.filter((d): d is PokemonDetail => Boolean(d));
        if (valid.length > 0) {
          setTeam(valid.slice(0, teamSize));
          if (Object.keys(sharedNatures).length > 0) {
            setNatures((prev) => ({ ...prev, ...sharedNatures }));
          }
          toast.success(`Loaded shared team (${valid.length})`);
        }
      } finally {
        if (!cancelled) {
          const url = new URL(window.location.href);
          url.searchParams.delete("team");
          url.searchParams.delete("natures");
          window.history.replaceState({}, "", url.pathname + url.search + url.hash);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setNature = (pokemonId: number, natureId: string | null) => {
    setNatures((prev) => {
      const next = { ...prev };
      if (!natureId) delete next[pokemonId];
      else next[pokemonId] = natureId;
      return next;
    });
  };

  return { team, setTeam, natures, setNatures, setNature } as const;
};
