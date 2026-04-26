import { useEffect, useState } from "react";
import { Loader2, Sparkles, Plus, Download } from "lucide-react";
import { fetchSmogonSets, type SmogonSetPreview } from "@/lib/smogon-sets";
import type { BuildDraft } from "@/hooks/useBuilds";
import { formatName } from "@/lib/pokeapi";
import { getNatureById } from "@/lib/natures";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SmogonSuggestionsProps {
  /** PokeAPI species name (lowercase-hyphen). */
  pokemonName: string;
  /** Called once per set the user chooses to import. */
  onImport: (draft: BuildDraft) => void;
}

/**
 * Auto-suggested competitive builds pulled from Smogon's published sets
 * (via the pkmn.cc JSON mirror). Rendered when a Pokémon has no user-made
 * builds yet, so newcomers can seed their library with one tap.
 */
export const SmogonSuggestions = ({ pokemonName, onImport }: SmogonSuggestionsProps) => {
  const [sets, setSets] = useState<SmogonSetPreview[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [importedIds, setImportedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    setSets(null);
    setImportedIds(new Set());
    fetchSmogonSets(pokemonName)
      .then((s) => {
        if (!cancelled) setSets(s);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [pokemonName]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/30 p-4 grid place-items-center text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  if (error || !sets || sets.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border bg-card/30 p-4 text-center text-sm text-muted-foreground">
        No builds yet. Create one to add this Pokémon to your team.
      </p>
    );
  }

  const handleImportOne = (s: SmogonSetPreview) => {
    onImport(s.draft);
    setImportedIds((prev) => new Set(prev).add(s.id));
  };

  const handleImportAll = () => {
    for (const s of sets) {
      if (!importedIds.has(s.id)) onImport(s.draft);
    }
    setImportedIds(new Set(sets.map((s) => s.id)));
  };

  const remaining = sets.filter((s) => !importedIds.has(s.id)).length;

  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/5 p-3 space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
          <h3 className="text-xs font-display font-bold uppercase tracking-wider text-primary">
            Smogon sets
            <span className="opacity-70 font-normal normal-case ml-1">({sets.length})</span>
          </h3>
        </div>
        {remaining > 1 && (
          <Button size="sm" variant="ghost" onClick={handleImportAll} className="h-7 text-xs">
            <Download className="h-3 w-3 mr-1" />
            Import all
          </Button>
        )}
      </div>

      <p className="text-[11px] text-muted-foreground">
        Published competitive sets from Smogon. Tap one to add it to your builds.
      </p>

      <ul className="space-y-1.5">
        {sets.map((s) => {
          const imported = importedIds.has(s.id);
          const nature = getNatureById(s.draft.natureId);
          return (
            <li
              key={s.id}
              className="rounded-xl border border-border bg-card/60 p-2.5 space-y-1.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="rounded-full bg-primary/15 text-primary px-1.5 py-0.5 text-[9px] font-display font-bold uppercase tracking-wide">
                      {s.formatLabel}
                    </span>
                    <h4 className="font-display font-bold text-sm truncate">{s.setName}</h4>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={imported ? "secondary" : "outline"}
                  onClick={() => handleImportOne(s)}
                  disabled={imported}
                  className="h-7 text-xs shrink-0"
                >
                  {imported ? (
                    "Added"
                  ) : (
                    <>
                      <Plus className="h-3 w-3 mr-1" />
                      Add
                    </>
                  )}
                </Button>
              </div>

              <ul className="grid grid-cols-2 gap-1">
                {s.draft.moves.map((m, i) => (
                  <li
                    key={i}
                    className={cn(
                      "rounded-md px-1.5 py-0.5 text-[10px] truncate",
                      m
                        ? "bg-secondary/60 text-foreground"
                        : "bg-secondary/30 text-muted-foreground/50 italic",
                    )}
                  >
                    {m ? formatName(m) : "—"}
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap items-center gap-1 text-[10px] text-muted-foreground">
                {s.draft.item && (
                  <span className="rounded-full bg-secondary/60 px-1.5 py-0.5">
                    @ {formatName(s.draft.item)}
                  </span>
                )}
                {s.draft.ability && (
                  <span className="rounded-full bg-secondary/60 px-1.5 py-0.5">
                    {formatName(s.draft.ability)}
                  </span>
                )}
                {nature && (
                  <span className="rounded-full bg-primary/10 text-primary px-1.5 py-0.5">
                    {nature.name}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};