import { useMemo } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Shield, ShieldOff } from "lucide-react";
import {
  POKEMON_TYPES,
  TYPE_LABEL,
  classify,
  getMultiplier,
  type PokemonType,
} from "@/lib/pokemon-types";
import { formatName, type PokemonDetail } from "@/lib/pokeapi";
import { cn } from "@/lib/utils";

interface AnalysisProps {
  team: PokemonDetail[];
}

interface TypeRow {
  type: PokemonType;
  weakCount: number;
  resistCount: number;
  weakMembers: PokemonDetail[];
}

export const TeamAnalysis = ({ team }: AnalysisProps) => {
  const rows = useMemo<TypeRow[]>(() => {
    return POKEMON_TYPES.map((attacker) => {
      let weak = 0;
      let resist = 0;
      const weakMembers: PokemonDetail[] = [];
      for (const member of team) {
        const eff = classify(getMultiplier(attacker, member.types));
        if (eff === "weak") {
          weak++;
          weakMembers.push(member);
        } else if (eff === "resist" || eff === "immune") {
          resist++;
        }
      }
      return { type: attacker, weakCount: weak, resistCount: resist, weakMembers };
    });
  }, [team]);

  const dangers = rows.filter((r) => r.weakCount >= 3);

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
      {dangers.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-gradient-danger p-4 shadow-danger animate-pulse-danger"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-destructive-foreground shrink-0 mt-0.5" />
            <div>
              <p className="font-display font-bold text-destructive-foreground">
                Critical type weakness
              </p>
              <p className="text-xs text-destructive-foreground/90 mt-0.5">
                {dangers.length === 1
                  ? `${dangers.length} type has 3+ team members weak to it.`
                  : `${dangers.length} types have 3+ team members weak to them.`}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {dangers.map((d) => (
                  <span
                    key={d.type}
                    className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-display font-bold uppercase tracking-wider",
                      "bg-background/30 text-destructive-foreground border border-destructive-foreground/30",
                    )}
                  >
                    {TYPE_LABEL[d.type]} · ×{d.weakCount}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <div className="rounded-2xl bg-card shadow-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-bold text-base">Type Coverage</h2>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
            {team.length} / 6 picked
          </p>
        </div>
        <ul className="space-y-1.5">
          {rows.map((row) => (
            <CoverageRow key={row.type} row={row} teamSize={team.length} />
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

const CoverageRow = ({ row, teamSize }: { row: TypeRow; teamSize: number }) => {
  const danger = row.weakCount >= 3;
  return (
    <li
      className={cn(
        "grid grid-cols-[80px_1fr_auto] items-center gap-2 py-1.5 px-2 rounded-lg transition-colors",
        danger && "bg-destructive/10",
      )}
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
        {/* Weakness bar (red, left) */}
        <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden flex justify-end">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(row.weakCount / Math.max(teamSize, 1)) * 100}%` }}
            transition={{ duration: 0.4 }}
            className={cn("h-full rounded-full", danger ? "bg-destructive" : "bg-warning")}
          />
        </div>
        <div className="w-px h-3 bg-border" />
        {/* Resistance bar (green, right) */}
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
    </li>
  );
};
