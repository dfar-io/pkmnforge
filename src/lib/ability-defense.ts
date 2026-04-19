import type { PokemonType } from "./pokemon-types";

/**
 * Per-attacking-type defensive multiplier modifiers granted by an ability.
 * `0` = grants immunity, fractions = additional damage reduction multiplier
 * (multiplied into the base type-chart multiplier), values >1 = vulnerability.
 *
 * Keys are PokeAPI ability ids (kebab-case).
 */
export const ABILITY_DEFENSE_MODS: Record<string, Partial<Record<PokemonType, number>>> = {
  // Immunities (set damage to 0× regardless of type chart).
  levitate: { ground: 0 },
  "flash-fire": { fire: 0 },
  "water-absorb": { water: 0 },
  "dry-skin": { water: 0, fire: 1.25 }, // Fire deals 1.25× to Dry Skin.
  "storm-drain": { water: 0 },
  "volt-absorb": { electric: 0 },
  "lightning-rod": { electric: 0 },
  "motor-drive": { electric: 0 },
  "sap-sipper": { grass: 0 },
  "earth-eater": { ground: 0 },
  "well-baked-body": { fire: 0 },
  levitate_alt: { ground: 0 },

  // Halving / boosting modifiers.
  "thick-fat": { fire: 0.5, ice: 0.5 },
  heatproof: { fire: 0.5 },
  "water-bubble": { fire: 0.5 },
  "purifying-salt": { ghost: 0.5 },
  "fluffy": { fire: 2 }, // Fluffy doubles Fire damage taken.
  filter: {}, // Generic super-effective reduction; handled separately if needed.
  "solid-rock": {},
  "prism-armor": {},
};

/**
 * Apply ability defensive modifiers to a multiplier-by-attacker map.
 * If the ability sets a type to 0, force that type's multiplier to 0.
 */
export function applyAbility(
  base: Map<PokemonType, number>,
  abilityId: string | null,
): Map<PokemonType, number> {
  if (!abilityId) return base;
  const mods = ABILITY_DEFENSE_MODS[abilityId];
  if (!mods) return base;
  const next = new Map(base);
  for (const [type, mod] of Object.entries(mods) as [PokemonType, number][]) {
    if (mod === 0) {
      next.set(type, 0);
    } else {
      const cur = next.get(type) ?? 1;
      next.set(type, cur * mod);
    }
  }
  return next;
}

/** Whether this ability changes any defensive matchup. */
export function abilityAffectsDefense(abilityId: string): boolean {
  const mods = ABILITY_DEFENSE_MODS[abilityId];
  return !!mods && Object.keys(mods).length > 0;
}
