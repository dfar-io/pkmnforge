import type { PokemonType } from "./pokemon-types";

export interface PokemonListItem {
  id: number;
  name: string;
}

export interface PokemonDetail {
  id: number;
  name: string;
  types: PokemonType[];
  sprite: string;
}

// Through Gen 9 (Paldea + DLC). 1025 base species.
export const MAX_DEX = 1025;

const NAMES_URL = `https://pokeapi.co/api/v2/pokemon?limit=${MAX_DEX}&offset=0`;

let cachedList: PokemonListItem[] | null = null;
export async function fetchPokemonList(): Promise<PokemonListItem[]> {
  if (cachedList) return cachedList;
  const res = await fetch(NAMES_URL);
  const data = await res.json();
  cachedList = (data.results as { name: string; url: string }[]).map((p) => {
    const id = Number(p.url.split("/").filter(Boolean).pop());
    return { id, name: p.name };
  });
  return cachedList;
}

const detailCache = new Map<number, PokemonDetail>();
export async function fetchPokemonDetail(id: number): Promise<PokemonDetail> {
  if (detailCache.has(id)) return detailCache.get(id)!;
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
  const data = await res.json();
  const detail: PokemonDetail = {
    id: data.id,
    name: data.name,
    types: data.types.map((t: { type: { name: PokemonType } }) => t.type.name),
    sprite:
      data.sprites?.other?.["official-artwork"]?.front_default ??
      data.sprites?.front_default ??
      "",
  };
  detailCache.set(id, detail);
  return detail;
}

const typeIdsCache = new Map<PokemonType, Set<number>>();
export async function fetchPokemonIdsByType(type: PokemonType): Promise<Set<number>> {
  const cached = typeIdsCache.get(type);
  if (cached) return cached;
  const res = await fetch(`https://pokeapi.co/api/v2/type/${type}`);
  const data = await res.json();
  const ids = new Set<number>();
  for (const entry of data.pokemon as { pokemon: { url: string } }[]) {
    const id = Number(entry.pokemon.url.split("/").filter(Boolean).pop());
    if (Number.isInteger(id) && id > 0 && id <= MAX_DEX) ids.add(id);
  }
  typeIdsCache.set(type, ids);
  return ids;
}

export interface PokemonStat {
  name: string;
  base: number;
}

export interface PokemonFullDetail extends PokemonDetail {
  height: number; // decimetres
  weight: number; // hectograms
  abilities: { name: string; isHidden: boolean }[];
  stats: PokemonStat[];
  moves: string[];
  speciesUrl: string;
}

// Per-Pokémon full detail (moves, abilities, stats). Cached in localStorage
// so the build editor opens instantly on revisit instead of re-fetching the
// ~50–200 KB payload from PokeAPI each time.
const FULL_DETAIL_CACHE_PREFIX = "pokenex.fullDetail.v1.";
const FULL_DETAIL_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

interface FullDetailCacheEntry {
  ts: number;
  detail: PokemonFullDetail;
}

const readFullDetailCache = (id: number): PokemonFullDetail | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(FULL_DETAIL_CACHE_PREFIX + id);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FullDetailCacheEntry;
    if (
      !parsed ||
      typeof parsed.ts !== "number" ||
      Date.now() - parsed.ts > FULL_DETAIL_TTL_MS ||
      !parsed.detail
    ) {
      return null;
    }
    return parsed.detail;
  } catch {
    return null;
  }
};

const writeFullDetailCache = (id: number, detail: PokemonFullDetail) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      FULL_DETAIL_CACHE_PREFIX + id,
      JSON.stringify({ ts: Date.now(), detail } satisfies FullDetailCacheEntry),
    );
  } catch {
    /* ignore quota */
  }
};

const fullDetailCache = new Map<number, PokemonFullDetail>();
export async function fetchPokemonFullDetail(id: number): Promise<PokemonFullDetail> {
  if (fullDetailCache.has(id)) return fullDetailCache.get(id)!;
  const stored = readFullDetailCache(id);
  if (stored) {
    fullDetailCache.set(id, stored);
    return stored;
  }
  const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
  const data = await res.json();
  const detail: PokemonFullDetail = {
    id: data.id,
    name: data.name,
    types: data.types.map((t: { type: { name: PokemonType } }) => t.type.name),
    sprite:
      data.sprites?.other?.["official-artwork"]?.front_default ??
      data.sprites?.front_default ??
      "",
    height: data.height,
    weight: data.weight,
    abilities: data.abilities.map((a: { ability: { name: string }; is_hidden: boolean }) => ({
      name: a.ability.name,
      isHidden: a.is_hidden,
    })),
    stats: data.stats.map((s: { stat: { name: string }; base_stat: number }) => ({
      name: s.stat.name,
      base: s.base_stat,
    })),
    moves: data.moves.map((m: { move: { name: string } }) => m.move.name),
    speciesUrl: data.species?.url ?? "",
  };
  fullDetailCache.set(id, detail);
  writeFullDetailCache(id, detail);
  return detail;
}

export interface EvolutionNode {
  id: number;
  name: string;
  evolvesTo: EvolutionNode[];
}

const evoCache = new Map<string, EvolutionNode | null>();
export async function fetchEvolutionChain(speciesUrl: string): Promise<EvolutionNode | null> {
  if (!speciesUrl) return null;
  if (evoCache.has(speciesUrl)) return evoCache.get(speciesUrl)!;
  try {
    const sp = await fetch(speciesUrl).then((r) => r.json());
    const evoUrl: string | undefined = sp.evolution_chain?.url;
    if (!evoUrl) {
      evoCache.set(speciesUrl, null);
      return null;
    }
    const ev = await fetch(evoUrl).then((r) => r.json());
    const walk = (n: { species: { name: string; url: string }; evolves_to: unknown[] }): EvolutionNode => ({
      id: Number(n.species.url.split("/").filter(Boolean).pop()),
      name: n.species.name,
      evolvesTo: (n.evolves_to as { species: { name: string; url: string }; evolves_to: unknown[] }[]).map(walk),
    });
    const root = walk(ev.chain);
    evoCache.set(speciesUrl, root);
    return root;
  } catch {
    evoCache.set(speciesUrl, null);
    return null;
  }
}

export function formatName(name: string): string {
  return name
    .split("-")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

// Move name → attacking type. Cached in-memory + localStorage forever (a
// move's type doesn't change). Used by offensive team coverage.
const MOVE_TYPE_CACHE_KEY = "pokenex.moveTypes.v1";

const moveTypeMem = new Map<string, PokemonType>();
let moveTypeDiskLoaded = false;

const loadMoveTypeDisk = () => {
  if (moveTypeDiskLoaded || typeof window === "undefined") return;
  moveTypeDiskLoaded = true;
  try {
    const raw = window.localStorage.getItem(MOVE_TYPE_CACHE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Record<string, PokemonType>;
    if (parsed && typeof parsed === "object") {
      for (const [k, v] of Object.entries(parsed)) moveTypeMem.set(k, v);
    }
  } catch {
    /* ignore */
  }
};

const saveMoveTypeDisk = () => {
  if (typeof window === "undefined") return;
  try {
    const obj: Record<string, PokemonType> = {};
    for (const [k, v] of moveTypeMem) obj[k] = v;
    window.localStorage.setItem(MOVE_TYPE_CACHE_KEY, JSON.stringify(obj));
  } catch {
    /* ignore */
  }
};

const inflightMove = new Map<string, Promise<PokemonType | null>>();

export async function fetchMoveType(name: string): Promise<PokemonType | null> {
  if (!name) return null;
  loadMoveTypeDisk();
  const cached = moveTypeMem.get(name);
  if (cached) return cached;
  const inflight = inflightMove.get(name);
  if (inflight) return inflight;
  const p = (async () => {
    try {
      const res = await fetch(`https://pokeapi.co/api/v2/move/${name}`);
      if (!res.ok) return null;
      const data = await res.json();
      const type = data?.type?.name as PokemonType | undefined;
      const damageClass = data?.damage_class?.name as string | undefined;
      // Status moves (no damage) shouldn't count toward offensive coverage.
      if (!type || damageClass === "status") return null;
      moveTypeMem.set(name, type);
      saveMoveTypeDisk();
      return type;
    } catch {
      return null;
    } finally {
      inflightMove.delete(name);
    }
  })();
  inflightMove.set(name, p);
  return p;
}

// Full PokeAPI item list. Cached in localStorage so we only hit the network
// once per device per cache window (the catalog rarely changes).
const ITEMS_CACHE_KEY = "pokenex.items.v1";
const ITEMS_CACHE_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

interface ItemsCache {
  ts: number;
  names: string[];
}

const readItemsCache = (): string[] | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(ITEMS_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ItemsCache;
    if (
      !parsed ||
      typeof parsed.ts !== "number" ||
      !Array.isArray(parsed.names) ||
      Date.now() - parsed.ts > ITEMS_CACHE_TTL_MS
    ) {
      return null;
    }
    return parsed.names;
  } catch {
    return null;
  }
};

const writeItemsCache = (names: string[]) => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      ITEMS_CACHE_KEY,
      JSON.stringify({ ts: Date.now(), names } satisfies ItemsCache),
    );
  } catch {
    /* ignore quota */
  }
};

let cachedItems: string[] | null = null;
export async function fetchHeldItems(): Promise<string[]> {
  if (cachedItems) return cachedItems;
  const stored = readItemsCache();
  if (stored) {
    cachedItems = stored;
    return cachedItems;
  }
  const res = await fetch("https://pokeapi.co/api/v2/item?limit=2200&offset=0");
  const data = await res.json();
  const names = (data.results as { name: string }[]).map((i) => i.name);
  names.sort((a, b) => a.localeCompare(b));
  cachedItems = names;
  writeItemsCache(names);
  return cachedItems;
}

// Wipe all PokeAPI-derived caches (in-memory + localStorage). Used by the
// "Clear cached data" footer button.
export function clearPokeapiCaches(): { items: number; pokemon: number } {
  let pokemonCleared = 0;
  let itemsCleared = 0;
  cachedList = null;
  detailCache.clear();
  typeIdsCache.clear();
  fullDetailCache.clear();
  evoCache.clear();
  cachedItems = null;
  moveTypeMem.clear();
  moveTypeDiskLoaded = false;
  if (typeof window !== "undefined") {
    try {
      if (window.localStorage.getItem(ITEMS_CACHE_KEY)) {
        window.localStorage.removeItem(ITEMS_CACHE_KEY);
        itemsCleared = 1;
      }
      window.localStorage.removeItem(MOVE_TYPE_CACHE_KEY);
      const toRemove: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && k.startsWith(FULL_DETAIL_CACHE_PREFIX)) toRemove.push(k);
      }
      for (const k of toRemove) window.localStorage.removeItem(k);
      pokemonCleared = toRemove.length;
    } catch {
      /* ignore */
    }
  }
  return { items: itemsCleared, pokemon: pokemonCleared };
}
