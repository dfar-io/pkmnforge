import { useEffect, useState } from "react";
import { toast } from "sonner";
import { fetchPokemonDetail, type PokemonDetail } from "@/lib/pokeapi";

const STORAGE_KEY = "pkmnforge.team.v1";
const LEGACY_STORAGE_KEYS = ["teamforge.team.v1"] as const;

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

// Lazy initializer — read once on mount; safe-guarded for SSR / private mode.
// Performs a one-time migration from legacy keys to the current STORAGE_KEY.
// If `?team=` is present in the URL, we defer to the async hydration effect
// and start empty so the URL-shared team wins over stored team.
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

/**
 * Manages team state with localStorage persistence and one-time hydration
 * from a `?team=1,4,7` URL query param. The URL param wins on first load
 * and is stripped after hydration so subsequent edits aren't shadowed.
 */
export const useTeam = (teamSize: number) => {
  const [team, setTeam] = useState<PokemonDetail[]>(() => loadStoredTeam(teamSize));

  // Persist on every change.
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(team));
    } catch {
      // Storage may be unavailable (quota / private mode) — silently ignore.
    }
  }, [team]);

  // One-time hydration from `?team=` query string.
  useEffect(() => {
    const ids = parseTeamFromQuery(teamSize);
    if (ids.length === 0) return;
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
          toast.success(`Loaded shared team (${valid.length})`);
        }
      } finally {
        if (!cancelled) {
          const url = new URL(window.location.href);
          url.searchParams.delete("team");
          window.history.replaceState({}, "", url.pathname + url.search + url.hash);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [team, setTeam] as const;
};
