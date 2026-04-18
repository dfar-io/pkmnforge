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

export function formatName(name: string): string {
  return name
    .split("-")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}
