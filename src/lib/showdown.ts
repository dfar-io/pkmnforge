// Parser for Pokémon Showdown / Smogon paste format. Maps display names
// (spaces, capitals) into PokeAPI-style ids (lowercase, hyphens) so they
// line up with our existing build fields.
//
// Example input:
//   Gyarados @ Heavy-Duty Boots
//   Ability: Intimidate
//   Tera Type: Flying
//   EVs: 248 HP / 56 Def / 204 Spe
//   Jolly Nature
//   - Waterfall
//   - Earthquake
//   - Dragon Dance
//   - Taunt

import { NATURES } from "@/lib/natures";

export interface ParsedShowdownSet {
  /** Species in PokeAPI form (e.g. "tapu-koko"). Always present. */
  species: string;
  /** Display name on the first line (nickname or species). */
  displayName: string;
  ability: string;
  item: string;
  natureId: string;
  moves: [string, string, string, string];
  /** Lines we kept verbatim (EVs, IVs, Tera Type, etc.) — stuffed into notes. */
  extras: string[];
}

const NATURE_NAMES = new Set(NATURES.map((n) => n.id));

/** "Heavy-Duty Boots" → "heavy-duty-boots" */
const toApiId = (s: string): string =>
  s
    .trim()
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

/**
 * Parse the first set out of a Showdown paste. Throws on obviously invalid
 * input. Extra fields (EVs / IVs / Tera Type) are preserved into `extras`
 * because we don't model them on builds yet.
 */
export const parseShowdownSet = (raw: string): ParsedShowdownSet => {
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) throw new Error("Paste is empty");

  // Stop at a blank-line-separated second set if the user pasted multiple.
  // (We've already filtered blank lines, but a "===" header line would also
  // signal a new set in some exports.)
  const headerIdx = lines.findIndex((l, i) => i > 0 && /^===/.test(l));
  const block = headerIdx === -1 ? lines : lines.slice(0, headerIdx);

  const first = block[0];
  // First line: "Nickname (Species) (M) @ Item" — any of the parts optional.
  // Strip gender marker first.
  let head = first.replace(/\s*\([MF]\)\s*/g, " ").trim();
  let item = "";
  const atIdx = head.lastIndexOf(" @ ");
  if (atIdx !== -1) {
    item = head.slice(atIdx + 3).trim();
    head = head.slice(0, atIdx).trim();
  }
  // Either "Species" or "Nickname (Species)".
  let displayName = head;
  let species = head;
  const parenMatch = head.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  if (parenMatch) {
    displayName = parenMatch[1].trim();
    species = parenMatch[2].trim();
  }
  if (!species) throw new Error("Couldn't read species from first line");

  let ability = "";
  let natureId = "";
  const moves: string[] = [];
  const extras: string[] = [];

  for (const line of block.slice(1)) {
    if (line.startsWith("- ") || line.startsWith("• ")) {
      if (moves.length < 4) {
        // Moves can be "Hidden Power [Fire]" — keep the whole thing minus the
        // bracketed type, which PokeAPI encodes as separate moves anyway.
        const move = line.slice(2).split("/")[0].trim();
        if (move) moves.push(move);
      }
      continue;
    }
    const [keyRaw, ...rest] = line.split(":");
    const key = keyRaw.trim().toLowerCase();
    const value = rest.join(":").trim();
    if (key === "ability") {
      ability = value;
    } else if (/\bnature$/i.test(line)) {
      const nat = line.replace(/\s*nature\s*$/i, "").trim().toLowerCase();
      if (NATURE_NAMES.has(nat)) natureId = nat;
      else extras.push(line);
    } else if (
      key === "evs" ||
      key === "ivs" ||
      key === "tera type" ||
      key === "level" ||
      key === "happiness" ||
      key === "shiny" ||
      key === "gigantamax" ||
      key === "dynamax level"
    ) {
      extras.push(line);
    } else {
      // Unknown line — keep it so the user doesn't lose info.
      extras.push(line);
    }
  }

  while (moves.length < 4) moves.push("");

  return {
    species: toApiId(species),
    displayName,
    ability: ability ? toApiId(ability) : "",
    item: item ? toApiId(item) : "",
    natureId,
    moves: moves.slice(0, 4) as [string, string, string, string],
    extras,
  };
};
