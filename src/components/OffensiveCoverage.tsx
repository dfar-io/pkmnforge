import { useEffect, useMemo, useState } from "react";
import { Sword } from "lucide-react";
import {
  POKEMON_TYPES,
  TYPE_LABEL,
  classify,
  getMultiplier,
  type PokemonType,
} from "@/lib/pokemon-types";
import { fetchMoveType, formatName } from "@/lib/pokeapi";
import { useBuilds } from "@/hooks/useBuilds";
import type { TeamMember } from "@/lib/builds";
import { cn } from "@/lib/utils";

interface OffensiveCoverageProps {
  team: TeamMember[];
}

interface MemberAttacks {
  member: TeamMember;
  // Resolved attacking move types for this member (status moves filtered out).
  attackTypes: PokemonType[];
}

interface CoverageRow {
  defender: PokemonType;
  // Best multiplier any team move achieves against this defender (single type).
  bestMultiplier: number;
  // Members that can hit this defender super-effectively.
  hittersSE: TeamMember[];
}

// Defender list used for offensive coverage. We use single-type defenders
// because dual-type defenders explode the matrix and are situational.
const DEFENDERS = POKEMON_TYPES;

export const OffensiveCoverage = ({ team }: OffensiveCoverageProps) => {
  const { getById } = useBuilds();
  const [resolved, setResolved] = useState<Map<string, PokemonType | null>>(
    new Map(),
  );

  // Collect every move name across the team's saved builds.
  const moveNames = useMemo(() => {
    const set = new Set<string>();
    for (const m of team) {
      const b = getById(m.buildId);
      if (!b) continue;
      for (const mv of b.moves) {
        if (mv) set.add(mv);
      }
    }
    return Array.from(set);
  }, [team, getById]);

  // Resolve any unknown move names → attacking type.
  useEffect(() => {
    let cancelled = false;
    const unknown = moveNames.filter((n) => !resolved.has(n));
    if (unknown.length === 0) return;
    (async () => {
      const entries = await Promise.all(
        unknown.map(async (n) => [n, await fetchMoveType(n)] as const),
      );
      if (cancelled) return;
      setResolved((prev) => {
        const next = new Map(prev);
        for (const [n, t] of entries) next.set(n, t);
        return next;
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [moveNames, resolved]);

  const memberAttacks = useMemo<MemberAttacks[]>(() => {
    return team.map((member) => {
      const b = getById(member.buildId);
      const types: PokemonType[] = [];
      if (b) {
        for (const mv of b.moves) {
          if (!mv) continue;
          const t = resolved.get(mv);
          if (t) types.push(t);
        }
      }
      return { member, attackTypes: Array.from(new Set(types)) };
    });
  }, [team, getById, resolved]);

  const rows = useMemo<CoverageRow[]>(() => {
    return DEFENDERS.map((defender) => {
      let best = 0;
      let any = false;
      const hitters: TeamMember[] = [];
      for (const ma of memberAttacks) {
        let memberBest = -1;
        for (const atk of ma.attackTypes) {
          any = true;
          const mult = getMultiplier(atk, [defender]);
          if (mult > memberBest) memberBest = mult;
        }
        if (memberBest > best) best = memberBest;
        if (classify(memberBest) === "weak") hitters.push(ma.member);
      }
      return { defender, bestMultiplier: any ? best : 1, hittersSE: hitters };
    });
  }, [memberAttacks]);

  // Suggest attacking types that would close the most gaps, excluding types
  // the team already has in its move pool.
  const ownedTypes = useMemo(() => {
    const s = new Set<PokemonType>();
    for (const ma of memberAttacks) for (const t of ma.attackTypes) s.add(t);
    return s;
  }, [memberAttacks]);

  const suggestions = useMemo(() => {
    const gaps = DEFENDERS.filter((d) => {
      const row = rows.find((r) => r.defender === d);
      if (!row) return false;
      const eff = classify(row.bestMultiplier);
      return eff === "resist" || eff === "immune";
    });
    if (gaps.length === 0) return [] as { type: PokemonType; covers: PokemonType[] }[];
    const scored = POKEMON_TYPES.filter((t) => !ownedTypes.has(t)).map((atk) => {
      const covers = gaps.filter((g) => getMultiplier(atk, [g]) > 1);
      return { type: atk, covers };
    });
    return scored
      .filter((s) => s.covers.length > 0)
      .sort((a, b) => b.covers.length - a.covers.length)
      .slice(0, 3);
  }, [rows, ownedTypes]);

  const totalMoves = moveNames.length;
  const resolvedCount = moveNames.filter((n) => resolved.has(n)).length;
  const knownAttackingMoves = moveNames.filter((n) => resolved.get(n)).length;
  const loading = totalMoves > 0 && resolvedCount < totalMoves;

  const seCount = rows.filter((r) => classify(r.bestMultiplier) === "weak").length;
  const neutralCount = rows.filter(
    (r) => classify(r.bestMultiplier) === "neutral",
  ).length;
  const uncovered = rows.filter(
    (r) => classify(r.bestMultiplier) === "resist" || classify(r.bestMultiplier) === "immune",
  );

  if (team.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/30 p-6 text-center">
        <Sword className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">
          Add Pokémon with builds to see offensive coverage.
        </p>
      </div>
    );
  }

  if (knownAttackingMoves === 0 && !loading) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/30 p-6 text-center">
        <Sword className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">
          Add attacking moves to your builds to see offensive coverage.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl bg-card shadow-card p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display font-bold text-base flex items-center gap-2">
          <Sword className="h-4 w-4 text-primary" />
          Offensive Coverage
        </h2>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
          {loading ? "Loading…" : `${seCount}/${DEFENDERS.length} SE`}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3 text-center">
        <Stat label="Super-eff." value={seCount} accent="text-success" />
        <Stat label="Neutral" value={neutralCount} accent="text-foreground" />
        <Stat label="Resisted" value={uncovered.length} accent="text-destructive" />
      </div>

      <ul className="grid grid-cols-2 gap-1.5">
        {rows.map((row) => {
          const eff = classify(row.bestMultiplier);
          return (
            <li
              key={row.defender}
              className={cn(
                "flex items-center justify-between gap-2 rounded-lg px-2 py-1.5",
                eff === "weak" && "bg-success/15",
                eff === "neutral" && "bg-secondary/40",
                (eff === "resist" || eff === "immune") && "bg-destructive/15",
              )}
              title={
                row.hittersSE.length
                  ? `Hit super-effectively by: ${row.hittersSE.map((m) => formatName(m.pokemon.name)).join(", ")}`
                  : undefined
              }
            >
              <span
                className={cn(
                  "text-[10px] font-display font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-primary-foreground",
                  `bg-type-${row.defender}`,
                )}
              >
                {TYPE_LABEL[row.defender]}
              </span>
              <span
                className={cn(
                  "text-[11px] font-mono font-bold",
                  eff === "weak" && "text-success",
                  eff === "neutral" && "text-muted-foreground",
                  (eff === "resist" || eff === "immune") && "text-destructive",
                )}
              >
                {row.bestMultiplier === 0
                  ? "0×"
                  : row.bestMultiplier === 0.25
                  ? "¼×"
                  : row.bestMultiplier === 0.5
                  ? "½×"
                  : row.bestMultiplier === 1
                  ? "1×"
                  : row.bestMultiplier === 2
                  ? "2×"
                  : "4×"}
              </span>
            </li>
          );
        })}
      </ul>

      {uncovered.length > 0 && (
        <p className="mt-3 pt-3 border-t border-border text-[10px] text-muted-foreground">
          Gaps: no team move hits{" "}
          <span className="font-display font-bold text-destructive">
            {uncovered.map((u) => TYPE_LABEL[u.defender]).join(", ")}
          </span>{" "}
          for neutral or better damage.
        </p>
      )}
    </div>
  );
};

const Stat = ({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: string;
}) => (
  <div className="rounded-lg bg-secondary/40 py-2">
    <p className={cn("font-display font-bold text-lg leading-none", accent)}>
      {value}
    </p>
    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">
      {label}
    </p>
  </div>
);
