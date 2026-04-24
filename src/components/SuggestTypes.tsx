import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronUp, Lightbulb, Shield, X } from "lucide-react";
import {
  POKEMON_TYPES,
  TYPE_LABEL,
  classify,
  getMultiplier,
  type PokemonType,
} from "@/lib/pokemon-types";
import { fetchPokemonIdsByType, type PokemonDetail } from "@/lib/pokeapi";
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

const PAGE_SIZE = 5;

/** Check which dual-type combos actually exist (have ≥1 Pokémon with both types). */
function useValidDualTypes(combos: PokemonType[][]) {
  const [valid, setValid] = useState<Set<string> | null>(null);

  // Unique types needed
  const typesNeeded = useMemo(() => {
    const s = new Set<PokemonType>();
    for (const c of combos) if (c.length === 2) { s.add(c[0]); s.add(c[1]); }
    return Array.from(s);
  }, [combos]);

  useEffect(() => {
    if (typesNeeded.length === 0) { setValid(new Set()); return; }
    let cancelled = false;
    Promise.all(typesNeeded.map((t) => fetchPokemonIdsByType(t).then((ids) => [t, ids] as const)))
      .then((entries) => {
        if (cancelled) return;
        const map = new Map<PokemonType, Set<number>>(entries);
        const validSet = new Set<string>();
        for (const c of combos) {
          if (c.length === 1) { validSet.add(c[0]); continue; }
          const a = map.get(c[0]);
          const b = map.get(c[1]);
          if (a && b) {
            for (const id of a) { if (b.has(id)) { validSet.add(c.join("+")); break; } }
          }
        }
        setValid(validSet);
      })
      .catch(console.error);
    return () => { cancelled = true; };
  }, [combos, typesNeeded]);

  return valid;
}

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

  // Build all single + dual type combos (stable reference)
  const combos = useMemo(() => {
    const result: PokemonType[][] = [];
    for (const t of POKEMON_TYPES) result.push([t]);
    for (let i = 0; i < POKEMON_TYPES.length; i++) {
      for (let j = i + 1; j < POKEMON_TYPES.length; j++) {
        result.push([POKEMON_TYPES[i], POKEMON_TYPES[j]]);
      }
    }
    return result;
  }, []);

  const validDualTypes = useValidDualTypes(combos);

  const [focusType, setFocusType] = useState<PokemonType | null>(null);

  // When focusing, only consider that single threat type. Otherwise use all
  // weaknesses on the team weighted by share count.
  const effectiveThreats = useMemo(() => {
    if (focusType) return [{ type: focusType, weakCount: 1 }];
    return threats;
  }, [focusType, threats]);

  const suggestions = useMemo<TypeSuggestion[]>(() => {
    if (effectiveThreats.length === 0 || !validDualTypes) return [];

    return combos
      .filter((c) => {
        const key = c.length === 1 ? c[0] : c.join("+");
        return validDualTypes.has(key);
      })
      .map((candidate) => {
      const resists: PokemonType[] = [];
      const immunes: PokemonType[] = [];
      let score = 0;
      for (const t of effectiveThreats) {
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
      // Heavy penalty for combos that add a weakness to the focused type:
      // the user explicitly does NOT want to introduce one.
      if (focusType && allWeaknesses.includes(focusType)) {
        score -= 100;
      }
      const label = candidate.map((t) => TYPE_LABEL[t]).join(" / ");
      return { types: candidate, label, resists, immunes, addsWeakness: allWeaknesses, score };
    })
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      ;
  }, [effectiveThreats, combos, validDualTypes, focusType]);

  const [showCount, setShowCount] = useState(PAGE_SIZE);
  // Reset pagination when focus changes.
  useEffect(() => { setShowCount(PAGE_SIZE); }, [focusType]);
  const visible = suggestions.slice(0, showCount);
  const hasMore = showCount < suggestions.length;
  const isExpanded = showCount > PAGE_SIZE;

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
            {focusType
              ? `Resists ${TYPE_LABEL[focusType]} without adding a weakness to it`
              : "Defending types that cover your team's biggest weaknesses"}
          </p>
        </div>
      </div>

      {threats.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] text-muted-foreground mr-0.5">Focus:</span>
          {threats.map((t) => {
            const active = focusType === t.type;
            return (
              <button
                key={t.type}
                type="button"
                onClick={() => setFocusType(active ? null : t.type)}
                className={cn(
                  "text-[10px] font-display font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-primary-foreground transition-all hover:scale-105 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  `bg-type-${t.type}`,
                  !active && focusType !== null && "opacity-40",
                  active && "ring-2 ring-ring ring-offset-1 ring-offset-card",
                )}
                aria-pressed={active}
                aria-label={`Focus on ${TYPE_LABEL[t.type]} threats`}
              >
                {TYPE_LABEL[t.type]}
              </button>
            );
          })}
          {focusType && (
            <button
              type="button"
              onClick={() => setFocusType(null)}
              className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Clear focus"
            >
              <X className="h-3 w-3" /> clear
            </button>
          )}
        </div>
      )}

      {threats.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">
          No notable defensive weaknesses yet — add more team members for tailored picks.
        </p>
      ) : suggestions.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">
          No type cleanly covers your current weakness profile.
        </p>
      ) : (
        <>
        <ul className="space-y-2">
          {visible.map((s) => (
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
        {(hasMore || isExpanded) && (
          <button
            type="button"
            onClick={() => setShowCount((c) => hasMore ? c + PAGE_SIZE : PAGE_SIZE)}
            className="mt-2 w-full flex items-center justify-center gap-1 text-[11px] font-medium text-primary hover:text-primary/80 transition-colors py-1"
          >
            {hasMore ? (
              <><span>Show more</span> <ChevronDown className="h-3.5 w-3.5" /></>
            ) : (
              <><span>Show less</span> <ChevronUp className="h-3.5 w-3.5" /></>
            )}
          </button>
        )}
        </>
      )}
    </div>
  );
};
