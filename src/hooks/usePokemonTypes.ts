import { useEffect, useState } from "react";
import { fetchPokemonDetail } from "@/lib/pokeapi";
import type { PokemonType } from "@/lib/pokemon-types";

// Module-level cache so types persist across mounts (e.g., scrolling).
const typesCache = new Map<number, PokemonType[]>();
const inflight = new Map<number, Promise<PokemonType[]>>();

export const usePokemonTypes = (id: number): PokemonType[] | null => {
  const [types, setTypes] = useState<PokemonType[] | null>(
    () => typesCache.get(id) ?? null,
  );

  useEffect(() => {
    const cached = typesCache.get(id);
    if (cached) {
      setTypes(cached);
      return;
    }
    let cancelled = false;
    let promise = inflight.get(id);
    if (!promise) {
      promise = fetchPokemonDetail(id).then((d) => {
        typesCache.set(id, d.types);
        inflight.delete(id);
        return d.types;
      });
      inflight.set(id, promise);
    }
    promise
      .then((t) => {
        if (!cancelled) setTypes(t);
      })
      .catch(() => {
        if (!cancelled) setTypes([]);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return types;
};
