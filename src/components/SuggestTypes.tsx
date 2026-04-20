import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Lightbulb, Shield } from "lucide-react";
import {
  POKEMON_TYPES,
  TYPE_LABEL,
  classify,
  getMultiplier,
  type PokemonType,
} from "@/lib/pokemon-types";
import type { PokemonDetail } from "@/lib/pokeapi";
import { cn } from "@/lib/utils";

interface SuggestTypesProps {
  team: PokemonDetail[];
}

interface TypeSuggestion {
  types: PokemonType[]; // 1 or 2 types
  label: string;
  // Threat types this defending type combo resists or is immune to.
  resists: PokemonType[];
  immunes: PokemonType[];
  // ALL types this combo is weak to.
  addsWeakness: PokemonType[];
  score: number;
}

const TOP_N = 5;

export const SuggestTypes = ({ team }: SuggestTypesProps) => {
  const navigate = useNavigate();
  // Top threat types: those at least one team member is weak to, weighted by
  // how many members share the weakness.
  const threats = useMemo(() => {
    return POKEMON_TYPES.map((attacker) => {
      let w = 0;
      for (const m of team) {
        if (classify(getMultiplier(attacker, m.types)) === "weak") w++;
      }
      return { type: attacker, weakCount: w };
    })
      .filter((t) => t.weakCount > 0)
      .sort((a, b) => b.weakCount - a.weakCount);
  }, [team]);

  const suggestions = useMemo<TypeSuggestion[]>(() => {
    if (threats.length === 0) return [];

    // Build all single + dual type combos
    const combos: PokemonType[][] = [];
    for (const t of POKEMON_TYPES) combos.push([t]);
    for (let i = 0; i < POKEMON_TYPES.length; i++) {
      for (let j = i + 1; j < POKEMON_TYPES.length; j++) {
        combos.push([POKEMON_TYPES[i], POKEMON_TYPES[j]]);
      }
    }

    return combos.map((candidate) => {
      const resists: PokemonType[] = [];
      const immunes: PokemonType[] = [];
      let score = 0;
      for (const t of threats) {
        const eff = classify(getMultiplier(t.type, candidate));
        if (eff === "immune") {
          immunes.push(t.type);
          score += t.weakCount * 1.6;
        } else if (eff === "resist") {
          resists.push(t.type);
          score += t.weakCount;
        } else if (eff === "weak") {
          score -= t.weakCount;
        }
      }
      const allWeaknesses: PokemonType[] = [];
      for (const atk of POKEMON_TYPES) {
        if (classify(getMultiplier(atk, candidate)) === "weak") {
          allWeaknesses.push(atk);
        }
      }
      const label = candidate.map((t) => TYPE_LABEL[t]).join(" / ");
      return { types: candidate, label, resists, immunes, addsWeakness: allWeaknesses, score };
    })
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, TOP_N);
  }, [threats]);

  if (team.length === 0) return null;

  return (
    <div className="rounded-2xl bg-card shadow-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="grid h-8 w-8 place-items-center rounded-full bg-primary/15 text-primary shrink-0">
          <Lightbulb className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <h2 className="font-display font-bold text-base leading-tight">
            Suggested types to add
          </h2>
          <p className="text-[10px] text-muted-foreground">
            Defending types that cover your team's biggest weaknesses
          </p>
        </div>
      </div>

      {threats.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">
          No notable defensive weaknesses yet — add more team members for tailored picks.
        </p>
      ) : suggestions.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">
          No type cleanly covers your current weakness profile.
        </p>
      ) : (
        <ul className="space-y-2">
          {suggestions.map((s) => (
            <li
              key={s.label}
              className="rounded-xl bg-secondary/60 p-2.5 space-y-1.5"
            >
              <div className="flex items-center gap-2">
                {s.types.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() =>
                      navigate("/pokedex", { state: { initialTypes: s.types } })
                    }
                    className={cn(
                      "text-[10px] font-display font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-primary-foreground transition-transform hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      `bg-type-${t}`,
                    )}
                    aria-label={`Browse ${s.label} type Pokémon`}
                  >
                    {TYPE_LABEL[t]}
                  </button>
                ))}
                <span className="text-[10px] text-muted-foreground inline-flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  Score {Math.round(s.score * 10) / 10}
                </span>
              </div>
              {(s.immunes.length > 0 || s.resists.length > 0) && (
                <p className="text-[10px] text-success leading-snug">
                  {s.immunes.length > 0 && (
                    <>
                      Immune to{" "}
                      <span className="text-foreground/80 font-semibold">
                        {s.immunes.map((t) => TYPE_LABEL[t]).join(", ")}
                      </span>
                      {s.resists.length > 0 && " · "}
                    </>
                  )}
                  {s.resists.length > 0 && (
                    <>
                      Resists{" "}
                      <span className="text-foreground/80 font-semibold">
                        {s.resists.map((t) => TYPE_LABEL[t]).join(", ")}
                      </span>
                    </>
                  )}
                </p>
              )}
              {s.addsWeakness.length > 0 && (
                <p className="text-[10px] text-warning leading-snug">
                  Adds weakness to{" "}
                  <span className="text-foreground/80">
                    {s.addsWeakness.map((t) => TYPE_LABEL[t]).join(", ")}
                  </span>
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
