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
  AG: "bg-tier-ag text-tier-ag-foreground",
  Uber: "bg-tier-uber text-tier-uber-foreground",
  OU: "bg-tier-ou text-tier-ou-foreground",
  UUBL: "bg-tier-uubl text-tier-uubl-foreground",
  UU: "bg-tier-uu text-tier-uu-foreground",
  RUBL: "bg-tier-rubl text-tier-rubl-foreground",
  RU: "bg-tier-ru text-tier-ru-foreground",
  NUBL: "bg-tier-nubl text-tier-nubl-foreground",
  NU: "bg-tier-nu text-tier-nu-foreground",
  PUBL: "bg-tier-publ text-tier-publ-foreground",
  PU: "bg-tier-pu text-tier-pu-foreground",
  ZUBL: "bg-tier-zubl text-tier-zubl-foreground",
  ZU: "bg-tier-zu text-tier-zu-foreground",
  NFE: "bg-tier-nfe text-tier-nfe-foreground",
  LC: "bg-tier-lc text-tier-lc-foreground",
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
