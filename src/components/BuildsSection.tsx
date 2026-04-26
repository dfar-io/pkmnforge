import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { Loader2, Sparkles, Plus, Check, ArrowLeftRight, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useBuilds } from "@/hooks/useBuilds";
import { useTeamContext, TEAM_SIZE } from "@/context/TeamContext";
import { getNatureById } from "@/lib/natures";
import { formatName, type PokemonFullDetail } from "@/lib/pokeapi";
import { fetchSmogonSets, type SmogonSetPreview } from "@/lib/smogon-sets";
import { cn } from "@/lib/utils";

interface BuildsSectionProps {
  pokemon: PokemonFullDetail;
}

/**
 * Smogon-only build picker. Each set is a one-tap "add to team" action —
 * we silently materialise it as a build in storage so the team slot can
 * resolve its details, then add (or swap) it into the active team.
 */
export const BuildsSection = ({ pokemon }: BuildsSectionProps) => {
  const { getForPokemon, create, remove } = useBuilds();
  const { team, setTeam } = useTeamContext();
  const navigate = useNavigate();
  const builds = getForPokemon(pokemon.id);

  const [sets, setSets] = useState<SmogonSetPreview[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [pendingRemove, setPendingRemove] = useState<{ buildId: string; name: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    setSets(null);
    fetchSmogonSets(pokemon.name)
      .then((s) => { if (!cancelled) setSets(s); })
      .catch(() => { if (!cancelled) setError(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [pokemon.name]);

  const slim = {
    id: pokemon.id,
    name: pokemon.name,
    types: pokemon.types,
    sprite: pokemon.sprite,
  };

  const teamSlotForPokemon = team.find((m) => m.pokemonId === pokemon.id);
  const activeBuildId = teamSlotForPokemon?.buildId;
  const activeBuild = activeBuildId ? builds.find((b) => b.id === activeBuildId) : undefined;
  const isFull = team.length >= TEAM_SIZE;

  /** Find an already-imported build that matches a Smogon set (same name + moves). */
  const findExistingBuild = (s: SmogonSetPreview) => {
    return builds.find(
      (b) =>
        b.name === s.draft.name &&
        b.moves.join("|") === s.draft.moves.join("|"),
    );
  };

  const handlePick = (s: SmogonSetPreview) => {
    const existing = findExistingBuild(s);
    const buildId = existing ? existing.id : create(pokemon.id, s.draft).id;

    if (teamSlotForPokemon) {
      // Swap the existing slot's build in place.
      if (teamSlotForPokemon.buildId === buildId) return;
      setTeam((prev) =>
        prev.map((m) =>
          m.pokemonId === pokemon.id ? { ...m, buildId } : m,
        ),
      );
      toast.success(`Swapped to "${s.draft.name}"`, {
        action: { label: "View team", onClick: () => navigate("/") },
      });
    } else {
      if (isFull) {
        toast.error("Team is full");
        return;
      }
      setTeam((prev) =>
        prev.length >= TEAM_SIZE
          ? prev
          : [...prev, { pokemonId: pokemon.id, buildId, pokemon: slim }],
      );
      toast.success(`${s.draft.name} added to team`, {
        action: { label: "View team", onClick: () => navigate("/") },
      });
    }
  };

  const handleConfirmRemove = () => {
    if (!pendingRemove) return;
    setTeam((prev) => prev.filter((m) => m.buildId !== pendingRemove.buildId));
    remove(pendingRemove.buildId);
    toast.success(`Removed ${formatName(pokemon.name)} from team`);
    setPendingRemove(null);
  };

  return (
    <section id="builds" className="scroll-mt-20">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xs font-display font-bold uppercase tracking-wider text-muted-foreground">
          Smogon sets {sets && <span className="opacity-60">({sets.length})</span>}
        </h2>
        {activeBuild && (
          <Button
            size="sm"
            variant="ghost"
            className="text-muted-foreground hover:text-destructive"
            onClick={() => setPendingRemove({ buildId: activeBuild.id, name: activeBuild.name })}
          >
            Remove from team
          </Button>
        )}
      </div>

      {loading && (
        <div className="rounded-2xl border border-dashed border-border bg-card/30 p-6 grid place-items-center text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      )}

      {!loading && (error || !sets || sets.length === 0) && (
        <p className="rounded-2xl border border-dashed border-border bg-card/30 p-4 text-center text-sm text-muted-foreground">
          No Smogon sets available for {formatName(pokemon.name)}.
        </p>
      )}

      {!loading && sets && sets.length > 0 && (
        <ul className="space-y-2">
          {sets.map((s) => {
            const existing = findExistingBuild(s);
            const isActive = existing && existing.id === activeBuildId;
            const nature = getNatureById(s.draft.natureId);
            const canAct = !isActive && (teamSlotForPokemon || !isFull);
            return (
              <li
                key={s.id}
                className={cn(
                  "rounded-2xl border p-3 space-y-2 transition-colors",
                  isActive
                    ? "border-primary/60 bg-primary/5"
                    : "border-border bg-card/50",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="rounded-full bg-primary/15 text-primary px-1.5 py-0.5 text-[9px] font-display font-bold uppercase tracking-wide">
                        {s.formatLabel}
                      </span>
                      <h3 className="font-display font-bold text-sm truncate">{s.setName}</h3>
                    </div>
                  </div>
                </div>

                <ul className="grid grid-cols-2 gap-1">
                  {s.draft.moves.map((m, i) => (
                    <li
                      key={i}
                      className={cn(
                        "rounded-md px-2 py-1 text-[11px] truncate",
                        m
                          ? "bg-secondary/60 text-foreground"
                          : "bg-secondary/30 text-muted-foreground/50 italic",
                      )}
                    >
                      {m ? formatName(m) : `Move ${i + 1}`}
                    </li>
                  ))}
                </ul>

                <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
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
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-primary">
                      <Sparkles className="h-2.5 w-2.5" />
                      {nature.name}
                    </span>
                  )}
                </div>

                <Button
                  size="sm"
                  onClick={() => handlePick(s)}
                  disabled={!canAct}
                  variant={isActive ? "secondary" : teamSlotForPokemon ? "outline" : "default"}
                  className="w-full"
                >
                  {isActive ? (
                    <>
                      <Check className="h-4 w-4 mr-1.5" />
                      Active in your team
                    </>
                  ) : teamSlotForPokemon ? (
                    <>
                      <ArrowLeftRight className="h-4 w-4 mr-1.5" />
                      Swap to this set
                    </>
                  ) : isFull ? (
                    "Team is full"
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-1.5" />
                      Add to team
                    </>
                  )}
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      <AlertDialog
        open={!!pendingRemove}
        onOpenChange={(open) => !open && setPendingRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from team?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <p className="flex items-start gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-warning" />
                <span>
                  This will remove {formatName(pokemon.name)} from your team.
                </span>
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmRemove}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
};
