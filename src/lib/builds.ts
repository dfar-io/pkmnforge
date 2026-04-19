import type { PokemonDetail } from "@/lib/pokeapi";

// A single competitive "build" of a Pokémon. Builds are owned by a Pokémon
// (keyed by dex id) and reused by team slots — a slot stores `{ pokemonId,
// buildId }` rather than a full snapshot, so edits to a build propagate.
export interface PokemonBuild {
  id: string;
  pokemonId: number;
  name: string;
  ability: string;       // ability.name from PokeAPI (lowercase-hyphen)
  item: string;          // item.name from PokeAPI, or "" if held item is none/unset
  natureId: string;      // see NATURES.id, "" if unset
  moves: [string, string, string, string]; // PokeAPI move names; "" for empty slot
  notes: string;
  createdAt: number;
  updatedAt: number;
}

// A team slot. `pokemonSnapshot` is kept so we can render type/sprite/name
// without re-fetching when builds for the species exist on disk.
export interface TeamMember {
  pokemonId: number;
  buildId: string;
  pokemon: PokemonDetail;
}

export const EMPTY_MOVES: [string, string, string, string] = ["", "", "", ""];

export const BUILD_NAME_MAX = 40;
export const BUILD_NOTES_MAX = 500;
