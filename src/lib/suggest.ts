import {
  POKEMON_TYPES,
  classify,
  getMultiplier,
  type PokemonType,
} from "./pokemon-types";
import type { PokemonDetail } from "./pokeapi";

export interface ThreatType {
  type: PokemonType;
  weakCount: number;
}

export interface Suggestion {
  pokemon: PokemonDetail;
  score: number;
  covers: PokemonType[]; // threats it resists/is immune to
  alsoWeakTo: PokemonType[]; // threats it shares
}

/** Threats sorted by how many team members are weak to them (desc). */
export function getTeamThreats(team: PokemonDetail[]): ThreatType[] {
  return POKEMON_TYPES.map((attacker) => {
    let w = 0;
    for (const m of team) {
      if (classify(getMultiplier(attacker, m.types)) === "weak") w++;
    }
    return { type: attacker, weakCount: w };
  })
    .filter((t) => t.weakCount > 0)
    .sort((a, b) => b.weakCount - a.weakCount);
}

/**
 * Score a candidate against the team's threats.
 * +weakCount for each threat the candidate resists/is immune to,
 * -weakCount for each threat the candidate is also weak to.
 */
export function scoreCandidate(
  candidate: PokemonDetail,
  threats: ThreatType[],
): Suggestion {
  let score = 0;
  const covers: PokemonType[] = [];
  const alsoWeakTo: PokemonType[] = [];
  for (const threat of threats) {
    const eff = classify(getMultiplier(threat.type, candidate.types));
    if (eff === "resist" || eff === "immune") {
      score += threat.weakCount * (eff === "immune" ? 1.5 : 1);
      covers.push(threat.type);
    } else if (eff === "weak") {
      score -= threat.weakCount;
      alsoWeakTo.push(threat.type);
    }
  }
  return { pokemon: candidate, score, covers, alsoWeakTo };
}
