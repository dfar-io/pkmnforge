import tiersJson from "./smogon-tiers.json";

/**
 * Smogon Gen 9 OU Singles tier per National Dex number.
 * Sourced from Pokémon Showdown's `formats-data.js` (authoritative).
 * Excludes mega/gmax/past-gen-only forms (mapped to base form only).
 */
const TIERS = tiersJson as Record<string, SmogonTier>;

export type SmogonTier =
  | "AG"
  | "Uber"
  | "OU"
  | "UUBL"
  | "UU"
  | "RUBL"
  | "RU"
  | "NUBL"
  | "NU"
  | "PUBL"
  | "PU"
  | "ZUBL"
  | "ZU"
  | "NFE"
  | "LC";

export function getSmogonTier(pokemonId: number): SmogonTier | null {
  return TIERS[String(pokemonId)] ?? null;
}

/**
 * Tailwind classes for tier badges. Keys map to design-system semantic tokens
 * via index.css custom utility classes (defined alongside type colors).
 */
export const TIER_BADGE_CLASS: Record<SmogonTier, string> = {
  AG: "bg-tier-ag",
  Uber: "bg-tier-uber",
  OU: "bg-tier-ou",
  UUBL: "bg-tier-uubl",
  UU: "bg-tier-uu",
  RUBL: "bg-tier-rubl",
  RU: "bg-tier-ru",
  NUBL: "bg-tier-nubl",
  NU: "bg-tier-nu",
  PUBL: "bg-tier-publ",
  PU: "bg-tier-pu",
  ZUBL: "bg-tier-zubl",
  ZU: "bg-tier-zu",
  NFE: "bg-tier-nfe",
  LC: "bg-tier-lc",
};

export const TIER_LABEL: Record<SmogonTier, string> = {
  AG: "Anything Goes",
  Uber: "Ubers",
  OU: "OverUsed",
  UUBL: "UU Borderline",
  UU: "UnderUsed",
  RUBL: "RU Borderline",
  RU: "RarelyUsed",
  NUBL: "NU Borderline",
  NU: "NeverUsed",
  PUBL: "PU Borderline",
  PU: "PU",
  ZUBL: "ZU Borderline",
  ZU: "ZeroUsed",
  NFE: "Not Fully Evolved",
  LC: "Little Cup",
};
