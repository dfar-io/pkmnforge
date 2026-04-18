// Pokémon type effectiveness chart (Gen 6+).
// effectiveness[attacker][defender] = multiplier
export const POKEMON_TYPES = [
  "normal","fire","water","electric","grass","ice","fighting","poison",
  "ground","flying","psychic","bug","rock","ghost","dragon","dark","steel","fairy",
] as const;

export type PokemonType = typeof POKEMON_TYPES[number];

// Source: official type chart. attacker -> defender -> multiplier
const CHART: Record<PokemonType, Partial<Record<PokemonType, number>>> = {
  normal:   { rock: 0.5, ghost: 0, steel: 0.5 },
  fire:     { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
  water:    { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  grass:    { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
  ice:      { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
  fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
  poison:   { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
  ground:   { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
  flying:   { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
  psychic:  { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug:      { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
  rock:     { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
  ghost:    { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon:   { dragon: 2, steel: 0.5, fairy: 0 },
  dark:     { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  steel:    { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
  fairy:    { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 },
};

/** Damage multiplier when `attacker` attacks a Pokémon with given defender types. */
export function getMultiplier(attacker: PokemonType, defenderTypes: PokemonType[]): number {
  return defenderTypes.reduce((acc, def) => acc * (CHART[attacker][def] ?? 1), 1);
}

export type Effectiveness = "immune" | "resist" | "neutral" | "weak";

export function classify(mult: number): Effectiveness {
  if (mult === 0) return "immune";
  if (mult < 1) return "resist";
  if (mult > 1) return "weak";
  return "neutral";
}

export const TYPE_LABEL: Record<PokemonType, string> = Object.fromEntries(
  POKEMON_TYPES.map(t => [t, t.charAt(0).toUpperCase() + t.slice(1)])
) as Record<PokemonType, string>;

/** Offensive matchups for an attacking type vs each single defending type. */
export function getOffensiveMatchups(attacker: PokemonType): {
  superEffective: PokemonType[];
  resisted: PokemonType[];
  immune: PokemonType[];
} {
  const superEffective: PokemonType[] = [];
  const resisted: PokemonType[] = [];
  const immune: PokemonType[] = [];
  for (const def of POKEMON_TYPES) {
    const m = CHART[attacker][def] ?? 1;
    if (m === 0) immune.push(def);
    else if (m > 1) superEffective.push(def);
    else if (m < 1) resisted.push(def);
  }
  return { superEffective, resisted, immune };
}
