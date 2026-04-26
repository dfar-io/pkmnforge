// Fetches competitive sets from the pkmn.cc Smogon mirror
// (https://pkmn.github.io/smogon/data/sets/gen9.json), which is a
// CORS-friendly JSON dump of every published Smogon analysis set for the
// current generation. We map a PokeAPI species name (lowercase-hyphen) to
// the dataset's display-style key, then normalize each set into a
// `BuildDraft` we can drop straight into the user's library.

import { NATURES } from "@/lib/natures";
import type { BuildDraft } from "@/hooks/useBuilds";

const SETS_URL = "https://pkmn.github.io/smogon/data/sets/gen9.json";
const ANALYSES_URL = "https://pkmn.github.io/smogon/data/analyses/gen9.json";
const CACHE_KEY = "pokenex.smogon-sets.gen9.v1";
const ANALYSES_CACHE_KEY = "pokenex.smogon-analyses.gen9.v1";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 1 day

// Smogon set as it appears in the JSON file. Fields can be either a single
// value or an array of options (representing flexible recommendations); for
// import we always pick the first option so users get a concrete starting
// point they can tweak.
interface RawSet {
  moves: (string | string[])[];
  ability?: string | string[];
  item?: string | string[];
  nature?: string | string[];
  teratypes?: string | string[];
  evs?: Record<string, number>;
  ivs?: Record<string, number>;
}

type FormatBlock = Record<string, RawSet>;
type SmogonDataset = Record<string, Record<string, FormatBlock>>;

// Analyses dataset: prose descriptions per set.
// Shape: analyses[species][format].sets[setName] = { description: string (HTML) }
type AnalysesFormatBlock = {
  sets?: Record<string, { description?: string }>;
};
type SmogonAnalysesDataset = Record<
  string,
  Record<string, AnalysesFormatBlock>
>;

let memCache: SmogonDataset | null = null;
let inflight: Promise<SmogonDataset> | null = null;
let memAnalyses: SmogonAnalysesDataset | null = null;
let inflightAnalyses: Promise<SmogonAnalysesDataset> | null = null;

const readDiskCache = (): SmogonDataset | null => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { at, data } = JSON.parse(raw) as { at: number; data: SmogonDataset };
    if (Date.now() - at > CACHE_TTL_MS) return null;
    return data;
  } catch {
    return null;
  }
};

const writeDiskCache = (data: SmogonDataset) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), data }));
  } catch {
    /* quota — ignore */
  }
};

const fetchDataset = async (): Promise<SmogonDataset> => {
  if (memCache) return memCache;
  const disk = readDiskCache();
  if (disk) {
    memCache = disk;
    return disk;
  }
  if (inflight) return inflight;
  inflight = fetch(SETS_URL)
    .then((r) => {
      if (!r.ok) throw new Error(`Smogon sets HTTP ${r.status}`);
      return r.json() as Promise<SmogonDataset>;
    })
    .then((data) => {
      memCache = data;
      writeDiskCache(data);
      inflight = null;
      return data;
    })
    .catch((e) => {
      inflight = null;
      throw e;
    });
  return inflight;
};

// Generic localStorage TTL helpers for the analyses dataset.
const readDiskJson = <T>(key: string): T | null => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { at, data } = JSON.parse(raw) as { at: number; data: T };
    if (Date.now() - at > CACHE_TTL_MS) return null;
    return data;
  } catch {
    return null;
  }
};

const writeDiskJson = <T>(key: string, data: T) => {
  try {
    localStorage.setItem(key, JSON.stringify({ at: Date.now(), data }));
  } catch {
    /* quota — ignore */
  }
};

const fetchAnalyses = async (): Promise<SmogonAnalysesDataset> => {
  if (memAnalyses) return memAnalyses;
  const disk = readDiskJson<SmogonAnalysesDataset>(ANALYSES_CACHE_KEY);
  if (disk) {
    memAnalyses = disk;
    return disk;
  }
  if (inflightAnalyses) return inflightAnalyses;
  inflightAnalyses = fetch(ANALYSES_URL)
    .then((r) => {
      if (!r.ok) throw new Error(`Smogon analyses HTTP ${r.status}`);
      return r.json() as Promise<SmogonAnalysesDataset>;
    })
    .then((data) => {
      memAnalyses = data;
      writeDiskJson(ANALYSES_CACHE_KEY, data);
      inflightAnalyses = null;
      return data;
    })
    .catch((e) => {
      inflightAnalyses = null;
      throw e;
    });
  return inflightAnalyses;
};

// --- Name mapping (PokeAPI → Smogon dataset key) -----------------------------

// Irregular mappings — Smogon uses display-style names with punctuation,
// while PokeAPI strips punctuation and uses lowercase hyphens.
const NAME_OVERRIDES: Record<string, string> = {
  "ho-oh": "Ho-Oh",
  "porygon-z": "Porygon-Z",
  "porygon2": "Porygon2",
  "mr-mime": "Mr. Mime",
  "mr-mime-galar": "Mr. Mime-Galar",
  "mime-jr": "Mime Jr.",
  "mr-rime": "Mr. Rime",
  "type-null": "Type: Null",
  "nidoran-f": "Nidoran-F",
  "nidoran-m": "Nidoran-M",
  "farfetchd": "Farfetch'd",
  "farfetchd-galar": "Farfetch'd-Galar",
  "sirfetchd": "Sirfetch'd",
  "jangmo-o": "Jangmo-o",
  "hakamo-o": "Hakamo-o",
  "kommo-o": "Kommo-o",
  "indeedee-female": "Indeedee-F",
  "indeedee-male": "Indeedee",
  "meowstic-female": "Meowstic-F",
  "meowstic-male": "Meowstic",
  "basculegion-female": "Basculegion-F",
  "basculegion-male": "Basculegion",
  "oinkologne-female": "Oinkologne-F",
  "oinkologne-male": "Oinkologne",
  "flabebe": "Flabébé",
};

// Paradox & multi-word natural names (no form suffix) that Smogon writes
// with spaces instead of hyphens. PokeAPI hyphenates them.
const SPACE_NAMES = new Set([
  "great-tusk", "scream-tail", "brute-bonnet", "flutter-mane", "slither-wing",
  "sandy-shocks", "roaring-moon", "walking-wake", "gouging-fire", "raging-bolt",
  "iron-treads", "iron-bundle", "iron-hands", "iron-jugulis", "iron-moth",
  "iron-thorns", "iron-valiant", "iron-leaves", "iron-boulder", "iron-crown",
  "wo-chien", "chien-pao", "ting-lu", "chi-yu",
  "tapu-koko", "tapu-lele", "tapu-bulu", "tapu-fini",
]);

const titleCasePart = (s: string): string => {
  if (!s) return s;
  // Preserve Roman numeral / single-letter form codes like "z", but Smogon
  // capitalizes them ("Porygon-Z") — handled via overrides above. Default
  // to capitalize first letter.
  return s[0].toUpperCase() + s.slice(1).toLowerCase();
};

/**
 * Generate candidate Smogon dataset keys for a PokeAPI species name.
 * Returned in priority order — first hit in the dataset wins.
 */
const candidateKeys = (apiName: string): string[] => {
  const lower = apiName.toLowerCase();
  const override = NAME_OVERRIDES[lower];
  if (override) return [override];

  const parts = lower.split("-");
  const out: string[] = [];

  // Multi-word natural names → join with spaces ("iron valiant" style).
  if (SPACE_NAMES.has(lower)) {
    out.push(parts.map(titleCasePart).join(" "));
  }

  // Hyphenated form ("Landorus-Therian", "Tauros-Paldea-Combat",
  // "Ogerpon-Wellspring").
  out.push(parts.map(titleCasePart).join("-"));

  // Base species fallback ("Landorus" for "landorus-therian") — useful
  // when Smogon only tracks the base form.
  if (parts.length > 1) out.push(titleCasePart(parts[0]));

  return Array.from(new Set(out));
};

// --- Set normalization → BuildDraft -----------------------------------------

const NATURE_BY_NAME = new Map(NATURES.map((n) => [n.name.toLowerCase(), n.id] as const));

const pickFirst = (v: string | string[] | undefined): string =>
  Array.isArray(v) ? (v[0] ?? "") : (v ?? "");

/** "Heavy-Duty Boots" → "heavy-duty-boots" (PokeAPI id format). */
const toApiId = (s: string): string =>
  s
    .trim()
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/[^a-z0-9-]/g, "");

const STAT_LABEL: Record<string, string> = {
  hp: "HP",
  atk: "Atk",
  def: "Def",
  spa: "SpA",
  spd: "SpD",
  spe: "Spe",
};

const formatStats = (stats: Record<string, number> | undefined): string => {
  if (!stats) return "";
  return Object.entries(stats)
    .filter(([, v]) => typeof v === "number" && v > 0)
    .map(([k, v]) => `${v} ${STAT_LABEL[k] ?? k.toUpperCase()}`)
    .join(" / ");
};

const FORMAT_LABEL: Record<string, string> = {
  ou: "OU",
  uu: "UU",
  ru: "RU",
  nu: "NU",
  pu: "PU",
  zu: "ZU",
  lc: "LC",
  nfe: "NFE",
  ubers: "Ubers",
  anythinggoes: "AG",
  monotype: "Monotype",
  doublesou: "Doubles OU",
  vgc2023: "VGC 2023",
  vgc2024: "VGC 2024",
  vgc2025: "VGC 2025",
  battlestadiumsingles: "BSS",
  "1v1": "1v1",
  nationaldex: "Nat Dex",
  nationaldexubers: "Nat Dex Ubers",
  nationaldexuu: "Nat Dex UU",
  nationaldexdoubles: "Nat Dex Doubles",
  nationaldexmonotype: "Nat Dex Mono",
  godlygift: "Godly Gift",
  almostanyability: "AAA",
  stabmons: "STABmons",
  mixandmega: "Mix & Mega",
  inheritance: "Inheritance",
  partnersincrime: "PiC",
  ubersuu: "Ubers UU",
};

export const formatLabel = (id: string): string =>
  FORMAT_LABEL[id] ?? id.toUpperCase();

/** Standard singles tier formats we surface as importable sets. */
const STANDARD_FORMATS = new Set([
  "ubers",
  "ou",
  "uu",
  "ru",
  "nu",
  "pu",
  "zu",
  "lc",
  "nfe",
]);

export interface SmogonSetPreview {
  /** Stable id within the response (`format/setName`). Used for React keys. */
  id: string;
  format: string;
  formatLabel: string;
  setName: string;
  draft: BuildDraft;
  /** Smogon analysis prose for this set. Plain text, paragraphs joined by blank lines. */
  description?: string;
}

const setToDraft = (
  setName: string,
  format: string,
  raw: RawSet,
): BuildDraft => {
  const ability = toApiId(pickFirst(raw.ability));
  const item = toApiId(pickFirst(raw.item));
  const natureName = pickFirst(raw.nature).toLowerCase();
  const natureId = NATURE_BY_NAME.get(natureName) ?? "";

  const moves = raw.moves.slice(0, 4).map((m) => toApiId(pickFirst(m)));
  while (moves.length < 4) moves.push("");

  const notesParts: string[] = [];
  notesParts.push(`Imported from Smogon (${formatLabel(format)} — ${setName})`);
  const evs = formatStats(raw.evs);
  const ivs = formatStats(raw.ivs);
  if (evs) notesParts.push(`EVs: ${evs}`);
  if (ivs) notesParts.push(`IVs: ${ivs}`);
  const tera = pickFirst(raw.teratypes);
  if (tera) notesParts.push(`Tera Type: ${tera}`);

  return {
    name: `${setName} (${formatLabel(format)})`,
    ability,
    item,
    natureId,
    moves: moves as [string, string, string, string],
    notes: notesParts.join("\n"),
  };
};

/**
 * Returns every Smogon set we can find for `apiName`, across all formats,
 * normalized into importable `BuildDraft`s.
 */
export const fetchSmogonSets = async (
  apiName: string,
): Promise<SmogonSetPreview[]> => {
  // Load sets (required) and analyses (best-effort).
  const [data, analyses] = await Promise.all([
    fetchDataset(),
    fetchAnalyses().catch(() => ({} as SmogonAnalysesDataset)),
  ]);
  const cands = candidateKeys(apiName);
  const key = cands.find((k) => k in data);
  if (!key) return [];

  // Match the same key (or any candidate) in the analyses dataset.
  const analysesKey = cands.find((k) => k in analyses) ?? key;
  const speciesAnalyses = analyses[analysesKey] ?? {};

  const formats = data[key];
  const out: SmogonSetPreview[] = [];
  for (const [format, sets] of Object.entries(formats)) {
    if (!STANDARD_FORMATS.has(format)) continue;
    for (const [setName, raw] of Object.entries(sets)) {
      const descRaw =
        speciesAnalyses[format]?.sets?.[setName]?.description ?? "";
      out.push({
        id: `${format}/${setName}`,
        format,
        formatLabel: formatLabel(format),
        setName,
        draft: setToDraft(setName, format, raw),
        description: descRaw ? stripHtml(descRaw) : undefined,
      });
    }
  }
  return out;
};