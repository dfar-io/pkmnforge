// The 20 stat-changing Pokémon natures. Neutral natures (Hardy, Docile,
// Bashful, Quirky, Serious) are intentionally omitted — they don't affect
// stats so they don't add meaningful build information.
//
// Each nature raises one stat by 10% and lowers another by 10%.
// `code` is a short, URL-safe key used in the shared `?natures=` param so
// links stay compact (e.g. `25:ad` instead of `25:adamant`).

export type Stat = "atk" | "def" | "spa" | "spd" | "spe";

export const STAT_LABEL: Record<Stat, string> = {
  atk: "Attack",
  def: "Defense",
  spa: "Sp. Atk",
  spd: "Sp. Def",
  spe: "Speed",
};

export interface Nature {
  id: string;       // canonical lowercase name, e.g. "adamant"
  name: string;     // display name, e.g. "Adamant"
  code: string;     // 2-char URL code, e.g. "ad"
  up: Stat;
  down: Stat;
}

export const NATURES: Nature[] = [
  { id: "lonely",  name: "Lonely",  code: "lo", up: "atk", down: "def" },
  { id: "adamant", name: "Adamant", code: "ad", up: "atk", down: "spa" },
  { id: "naughty", name: "Naughty", code: "na", up: "atk", down: "spd" },
  { id: "brave",   name: "Brave",   code: "br", up: "atk", down: "spe" },
  { id: "bold",    name: "Bold",    code: "bo", up: "def", down: "atk" },
  { id: "impish",  name: "Impish",  code: "im", up: "def", down: "spa" },
  { id: "lax",     name: "Lax",     code: "la", up: "def", down: "spd" },
  { id: "relaxed", name: "Relaxed", code: "re", up: "def", down: "spe" },
  { id: "modest",  name: "Modest",  code: "mo", up: "spa", down: "atk" },
  { id: "mild",    name: "Mild",    code: "mi", up: "spa", down: "def" },
  { id: "rash",    name: "Rash",    code: "ra", up: "spa", down: "spd" },
  { id: "quiet",   name: "Quiet",   code: "qu", up: "spa", down: "spe" },
  { id: "calm",    name: "Calm",    code: "ca", up: "spd", down: "atk" },
  { id: "gentle",  name: "Gentle",  code: "ge", up: "spd", down: "def" },
  { id: "careful", name: "Careful", code: "cf", up: "spd", down: "spa" },
  { id: "sassy",   name: "Sassy",   code: "sa", up: "spd", down: "spe" },
  { id: "timid",   name: "Timid",   code: "ti", up: "spe", down: "atk" },
  { id: "hasty",   name: "Hasty",   code: "ha", up: "spe", down: "def" },
  { id: "jolly",   name: "Jolly",   code: "jo", up: "spe", down: "spa" },
  { id: "naive",   name: "Naive",   code: "nv", up: "spe", down: "spd" },
];

const BY_ID = new Map(NATURES.map((n) => [n.id, n] as const));
const BY_CODE = new Map(NATURES.map((n) => [n.code, n] as const));

export const getNatureById = (id: string | undefined): Nature | undefined =>
  id ? BY_ID.get(id) : undefined;

export const getNatureByCode = (code: string): Nature | undefined =>
  BY_CODE.get(code);
