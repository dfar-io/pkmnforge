import {
  POKEMON_TYPES,
  getMultiplier,
  type PokemonType,
} from "@/lib/pokemon-types";
import { TypeIcon } from "@/components/TypeBadge";

interface TypeMatchupsProps {
  /** Defending Pokémon's types. */
  types: PokemonType[];
}

const MULT_BUCKETS: { mult: number; label: string; tone: string }[] = [
  { mult: 4, label: "4×", tone: "bg-destructive/20 text-destructive border-destructive/40" },
  { mult: 2, label: "2×", tone: "bg-destructive/10 text-destructive border-destructive/30" },
  { mult: 0.5, label: "½×", tone: "bg-primary/10 text-primary border-primary/30" },
  { mult: 0.25, label: "¼×", tone: "bg-primary/20 text-primary border-primary/40" },
  { mult: 0, label: "0×", tone: "bg-muted text-muted-foreground border-border" },
];

/**
 * Defensive type chart for a Pokémon. Buckets every attacking type by the
 * damage multiplier it would deal against the given defender types.
 */
export const TypeMatchups = ({ types }: TypeMatchupsProps) => {
  // Group attackers by their multiplier against the defender.
  const byMult = new Map<number, PokemonType[]>();
  for (const atk of POKEMON_TYPES) {
    const m = getMultiplier(atk, types);
    if (m === 1) continue;
    const list = byMult.get(m) ?? [];
    list.push(atk);
    byMult.set(m, list);
  }

  const groups = MULT_BUCKETS.filter((b) => byMult.has(b.mult)).map((b) => ({
    ...b,
    types: byMult.get(b.mult)!,
  }));

  if (groups.length === 0) {
    return (
      <p className="text-xs text-muted-foreground italic">
        No notable weaknesses or resistances.
      </p>
    );
  }

  return (
    <div className="space-y-1.5">
      {groups.map((g) => (
        <div key={g.mult} className="flex items-center gap-2">
          <span
            className={`shrink-0 inline-grid place-items-center min-w-[2.25rem] rounded-md border px-1.5 py-0.5 text-[11px] font-mono font-bold ${g.tone}`}
          >
            {g.label}
          </span>
          <ul className="flex flex-wrap items-center gap-1">
            {g.types.map((t) => (
              <li key={t}>
                <TypeIcon type={t} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
};
