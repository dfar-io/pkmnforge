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

const fullDetailCache = new Map<number, PokemonFullDetail>();
export async function fetchPokemonFullDetail(id: number): Promise<PokemonFullDetail> {
  if (fullDetailCache.has(id)) return fullDetailCache.get(id)!;
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

// Held items only. PokeAPI tags items that a Pokémon can actually hold with
// the `holdable` item-attribute, which gives us the competitively relevant
// subset (berries, choice items, plates, etc.) instead of all ~2150 items
// (TMs, key items, mail, …).
let cachedItems: string[] | null = null;
export async function fetchHeldItems(): Promise<string[]> {
  if (cachedItems) return cachedItems;
  const res = await fetch("https://pokeapi.co/api/v2/item-attribute/holdable");
  const data = await res.json();
  const names = (data.items as { name: string }[]).map((i) => i.name);
  names.sort((a, b) => a.localeCompare(b));
  cachedItems = names;
  return cachedItems;
}

