import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Shield, ShieldOff } from "lucide-react";
import { X } from "lucide-react";
import {
  POKEMON_TYPES,
  TYPE_LABEL,
  classify,
  getMultiplier,
  getOffensiveMatchups,
  type PokemonType,
} from "@/lib/pokemon-types";
import { formatName, type PokemonDetail } from "@/lib/pokeapi";
import { applyAbility } from "@/lib/ability-defense";
import { useBuilds } from "@/hooks/useBuilds";
import type { TeamMember } from "@/lib/builds";
import { cn } from "@/lib/utils";

interface AnalysisProps {
  team: TeamMember[];
}

interface TypeRow {
  type: PokemonType;
  weakCount: number;
  resistCount: number;
  weakMembers: PokemonDetail[];
  resistMembers: PokemonDetail[];
  idx: number;
}

export const TeamAnalysis = ({ team, onRemove }: AnalysisProps & { onRemove?: (pokemonId: number) => void }) => {
  const [expandedType, setExpandedType] = useState<PokemonType | null>(null);
  const { getById } = useBuilds();
  const rows = useMemo<TypeRow[]>(() => {
    // Pre-compute each member's effective per-attacker multiplier map,
    // applying the selected build's ability if any.
    const memberMaps = team.map((m) => {
      const ability = getById(m.buildId)?.ability ?? null;
      const base = new Map<PokemonType, number>(
        POKEMON_TYPES.map((atk) => [atk, getMultiplier(atk, m.pokemon.types)]),
      );
      return { member: m, mults: applyAbility(base, ability) };
    });
    return POKEMON_TYPES.map((attacker, idx) => {
      let weak = 0;
      let resist = 0;
      const weakMembers: PokemonDetail[] = [];
      const resistMembers: PokemonDetail[] = [];
      for (const { member, mults } of memberMaps) {
        const eff = classify(mults.get(attacker) ?? 1);
        if (eff === "weak") {
          weak++;
          weakMembers.push(member.pokemon);
        } else if (eff === "resist" || eff === "immune") {
          resist++;
          resistMembers.push(member.pokemon);
        }
      }
      return { type: attacker, weakCount: weak, resistCount: resist, weakMembers, resistMembers, idx };
    }).sort((a, b) => {
      if (b.weakCount !== a.weakCount) return b.weakCount - a.weakCount;
      if (a.resistCount !== b.resistCount) return a.resistCount - b.resistCount;
      return a.idx - b.idx;
    });
  }, [team, getById]);

  if (team.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/30 p-6 text-center">
        <Shield className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">
          Add Pokémon to see your team's coverage.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-card shadow-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-bold text-base">Defensive Coverage</h2>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
            {team.length} / 6 picked
          </p>
        </div>
        <ul className="space-y-1.5">
          {rows.map((row) => (
            <CoverageRow
              key={row.type}
              row={row}
              teamSize={team.length}
              expanded={expandedType === row.type}
              onToggle={() =>
                setExpandedType((cur) => (cur === row.type ? null : row.type))
              }
              onRemoveMember={onRemove}
            />
          ))}
        </ul>
        <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <ShieldOff className="h-3 w-3 text-destructive" /> Weak
          </span>
          <span className="flex items-center gap-1">
            <Shield className="h-3 w-3 text-success" /> Resists / Immune
          </span>
        </div>
      </div>
    </div>
  );
};

const CoverageRow = ({
  row,
  teamSize,
  expanded,
  onToggle,
  onRemoveMember,
}: {
  row: TypeRow;
  teamSize: number;
  expanded: boolean;
  onToggle: () => void;
  onRemoveMember?: (pokemonId: number) => void;
}) => {
  const danger = row.weakCount >= 3;
  const matchups = useMemo(() => getOffensiveMatchups(row.type), [row.type]);
  return (
    <li
      className={cn(
        "rounded-lg transition-colors",
        danger && "bg-destructive/10",
        expanded && !danger && "bg-secondary/40",
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        aria-label={`Show offensive matchups for ${TYPE_LABEL[row.type]}`}
        className="w-full grid grid-cols-[80px_1fr_auto_auto] items-center gap-2 py-1.5 px-2 rounded-lg text-left hover:bg-secondary/30 transition-colors"
      >
        <span
          className={cn(
            "text-[10px] font-display font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-center text-primary-foreground",
            `bg-type-${row.type}`,
          )}
        >
          {TYPE_LABEL[row.type]}
        </span>
        <div className="flex items-center gap-1 h-5">
          <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden flex justify-end">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(row.weakCount / Math.max(teamSize, 1)) * 100}%` }}
              transition={{ duration: 0.4 }}
              className={cn("h-full rounded-full", danger ? "bg-destructive" : "bg-warning")}
            />
          </div>
          <div className="w-px h-3 bg-border" />
          <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(row.resistCount / Math.max(teamSize, 1)) * 100}%` }}
              transition={{ duration: 0.4 }}
              className="h-full rounded-full bg-success"
            />
          </div>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-mono w-14 justify-end">
          <span className={cn("font-bold", row.weakCount > 0 ? (danger ? "text-destructive" : "text-warning") : "text-muted-foreground")}>
            {row.weakCount}
          </span>
          <span className="text-muted-foreground">/</span>
          <span className={cn("font-bold", row.resistCount > 0 ? "text-success" : "text-muted-foreground")}>
            {row.resistCount}
          </span>
        </div>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 text-muted-foreground transition-transform",
            expanded && "rotate-180",
          )}
        />
      </button>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="matchups"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3 pt-1 space-y-2">
              {/* Team members weak to this type */}
              {row.weakMembers.length > 0 && (
                <div>
                  <p className="text-[10px] font-display font-bold uppercase tracking-wider text-destructive mb-1">
                    Weak
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {row.weakMembers.map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveMember?.(m.id);
                        }}
                        className="group flex items-center gap-1 rounded-full bg-destructive/15 border border-destructive/30 pl-0.5 pr-2 py-0.5 text-[11px] font-medium transition-colors hover:bg-destructive/25"
                        title={`Remove ${formatName(m.name)} from team`}
                      >
                        <img src={m.sprite} alt={formatName(m.name)} className="h-5 w-5 object-contain" loading="lazy" />
                        <span className="text-foreground">{formatName(m.name)}</span>
                        <X className="h-3 w-3 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Team members that resist this type */}
              {row.resistMembers.length > 0 && (
                <div>
                  <p className="text-[10px] font-display font-bold uppercase tracking-wider text-success mb-1">
                    Resists
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {row.resistMembers.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center gap-1 rounded-full bg-success/15 border border-success/30 pl-0.5 pr-2 py-0.5 text-[11px] font-medium"
                      >
                        <img src={m.sprite} alt={formatName(m.name)} className="h-5 w-5 object-contain" loading="lazy" />
                        <span className="text-foreground">{formatName(m.name)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Offensive matchups */}
              <div className="pt-1 border-t border-border">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
                  {TYPE_LABEL[row.type]} attacks vs. defending types
                </p>
                <MatchupGroup label="Super effective" tone="weak" types={matchups.superEffective} />
                <MatchupGroup label="Resisted" tone="resist" types={matchups.resisted} />
                <MatchupGroup label="No effect" tone="immune" types={matchups.immune} />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
};

const MatchupGroup = ({
  label,
  tone,
  types,
}: {
  label: string;
  tone: "weak" | "resist" | "immune";
  types: PokemonType[];
}) => {
  const accent =
    tone === "weak"
      ? "text-destructive"
      : tone === "resist"
      ? "text-success"
      : "text-muted-foreground";
  const multiplier = tone === "weak" ? "2×" : tone === "resist" ? "½×" : "0×";
  return (
    <div>
      <div className="flex items-center gap-2 mb-1">
        <span className={cn("text-[10px] font-display font-bold uppercase tracking-wider", accent)}>
          {label}
        </span>
        <span className="text-[10px] font-mono text-muted-foreground">{multiplier}</span>
      </div>
      {types.length === 0 ? (
        <p className="text-[10px] text-muted-foreground italic">None</p>
      ) : (
        <div className="flex flex-wrap gap-1">
          {types.map((t) => (
            <span
              key={t}
              className={cn(
                "text-[10px] font-display font-bold uppercase tracking-wider px-2 py-0.5 rounded-full text-primary-foreground",
                `bg-type-${t}`,
              )}
            >
              {TYPE_LABEL[t]}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
