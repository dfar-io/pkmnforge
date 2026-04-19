import { useMemo, useState } from "react";
import {
  POKEMON_TYPES,
  getMultiplier,
  type PokemonType,
} from "@/lib/pokemon-types";
import { TypeIcon } from "@/components/TypeBadge";
import { ABILITY_DEFENSE_MODS, applyAbility } from "@/lib/ability-defense";
import { formatName } from "@/lib/pokeapi";
import { cn } from "@/lib/utils";

interface TypeMatchupsProps {
  /** Defending Pokémon's types. */
  types: PokemonType[];
  /** Available ability ids on this Pokémon (PokeAPI ids, kebab-case). */
  abilities?: string[];
}

const MULT_BUCKETS: { mult: number; label: string; tone: string }[] = [
  { mult: 4, label: "4×", tone: "bg-destructive/20 text-destructive border-destructive/40" },
  { mult: 2, label: "2×", tone: "bg-destructive/10 text-destructive border-destructive/30" },
  { mult: 1.25, label: "1¼×", tone: "bg-destructive/10 text-destructive border-destructive/30" },
  { mult: 0.5, label: "½×", tone: "bg-primary/10 text-primary border-primary/30" },
  { mult: 0.25, label: "¼×", tone: "bg-primary/20 text-primary border-primary/40" },
  { mult: 0, label: "0×", tone: "bg-muted text-muted-foreground border-border" },
];

/**
 * Defensive type chart for a Pokémon. Buckets every attacking type by the
 * damage multiplier it would deal against the given defender types.
 * Optionally factors in an ability's defensive modifiers (Levitate, Thick
 * Fat, Water Absorb, etc.) selected via a toggle row.
 */
export const TypeMatchups = ({ types, abilities = [] }: TypeMatchupsProps) => {
  const relevantAbilities = useMemo(
    () => abilities.filter((a) => !!ABILITY_DEFENSE_MODS[a]),
    [abilities],
  );
  const [activeAbility, setActiveAbility] = useState<string | null>(null);

  const groups = useMemo(() => {
    // Base multipliers from the type chart.
    const base = new Map<PokemonType, number>();
    for (const atk of POKEMON_TYPES) base.set(atk, getMultiplier(atk, types));
    // Apply ability modifiers if one is active.
    const final = applyAbility(base, activeAbility);

    const byMult = new Map<number, PokemonType[]>();
    for (const atk of POKEMON_TYPES) {
      const m = final.get(atk) ?? 1;
      if (m === 1) continue;
      const list = byMult.get(m) ?? [];
      list.push(atk);
      byMult.set(m, list);
    }
    return MULT_BUCKETS.filter((b) => byMult.has(b.mult)).map((b) => ({
      ...b,
      types: byMult.get(b.mult)!,
    }));
  }, [types, activeAbility]);

  return (
    <div className="space-y-2">
      {relevantAbilities.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground mr-1">
            Ability:
          </span>
          <AbilityChip
            label="None"
            active={activeAbility === null}
            onClick={() => setActiveAbility(null)}
          />
          {relevantAbilities.map((a) => (
            <AbilityChip
              key={a}
              label={formatName(a)}
              active={activeAbility === a}
              onClick={() => setActiveAbility(a)}
            />
          ))}
        </div>
      )}

      {groups.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">
          No notable weaknesses or resistances.
        </p>
      ) : (
        <div className="space-y-1.5">
          {groups.map((g) => (
            <div key={g.mult} className="flex items-center gap-2">
              <span
                className={cn(
                  "shrink-0 inline-grid place-items-center min-w-[2.25rem] rounded-md border px-1.5 py-0.5 text-[11px] font-mono font-bold",
                  g.tone,
                )}
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
      )}
    </div>
  );
};

const AbilityChip = ({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "rounded-full border px-2 py-0.5 text-[11px] font-display font-semibold transition-colors",
      active
        ? "bg-primary text-primary-foreground border-primary"
        : "bg-secondary/60 text-muted-foreground border-border hover:text-foreground hover:bg-secondary",
    )}
  >
    {label}
  </button>
);
