import { useEffect, useState } from "react";
import { fetchPokemonDetail, type PokemonDetail } from "@/lib/pokeapi";
import type { TeamMember } from "@/lib/builds";

const STORAGE_KEY = "pokenex.team.v2";
// Legacy keys we proactively clear so old shapes don't haunt the new model.
const LEGACY_KEYS = [
  "pkmnforge.team.v1",
  "pkmnforge.natures.v1",
  "teamforge.team.v1",
] as const;

interface StoredEntry {
  pokemonId: number;
  buildId: string;
  pokemon: PokemonDetail;
}

const isStored = (v: unknown): v is StoredEntry => {
  if (!v || typeof v !== "object") return false;
  const e = v as Record<string, unknown>;
  if (typeof e.pokemonId !== "number") return false;
  if (typeof e.buildId !== "string") return false;
  const p = e.pokemon as Record<string, unknown> | undefined;
  return Boolean(
    p &&
      typeof p.id === "number" &&
      typeof p.name === "string" &&
      Array.isArray(p.types) &&
      typeof p.sprite === "string",
  );
};

const loadStoredTeam = (teamSize: number): TeamMember[] => {
  if (typeof window === "undefined") return [];
  // Wipe legacy data once.
  for (const k of LEGACY_KEYS) {
    try {
      window.localStorage.removeItem(k);
    } catch {
      /* ignore */
    }
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isStored).slice(0, teamSize) as TeamMember[];
  } catch {
    return [];
  }
};

// Hydrate any team-shared link (`?team=1:buildIdA,4:buildIdB`).
const parseTeamFromQuery = (
  teamSize: number,
): { pokemonId: number; buildId: string }[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = new URLSearchParams(window.location.search).get("team");
    if (!raw) return [];
    const out: { pokemonId: number; buildId: string }[] = [];
    for (const part of raw.split(",")) {
      const [idStr, buildId = ""] = part.split(":");
      const id = Number(idStr?.trim());
      if (Number.isInteger(id) && id > 0 && id <= 1025) {
        out.push({ pokemonId: id, buildId: buildId.trim() });
      }
      if (out.length >= teamSize) break;
    }
    return out;
  } catch {
    return [];
  }
};

export const useTeam = (teamSize: number) => {
  const [team, setTeam] = useState<TeamMember[]>(() => loadStoredTeam(teamSize));

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(team));
    } catch {
      /* ignore */
    }
  }, [team]);

  // One-time hydration from `?team=` query param.
  useEffect(() => {
    const ids = parseTeamFromQuery(teamSize);
    if (ids.length === 0) return;
    let cancelled = false;
    (async () => {
      try {
        const details = await Promise.all(
          ids.map((entry) =>
            fetchPokemonDetail(entry.pokemonId)
              .then((p) => ({ ...entry, pokemon: p }))
              .catch(() => null),
          ),
        );
        if (cancelled) return;
        const valid = details.filter((d): d is TeamMember => Boolean(d));
        if (valid.length > 0) setTeam(valid.slice(0, teamSize));
      } finally {
        if (!cancelled) {
          const url = new URL(window.location.href);
          url.searchParams.delete("team");
          window.history.replaceState(
            {},
            "",
            url.pathname + url.search + url.hash,
          );
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { team, setTeam } as const;
};
