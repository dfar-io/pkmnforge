import { useState } from "react";
import { toast } from "sonner";
import { Copy, Pencil, Plus, Sparkles, Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BuildEditor } from "@/components/BuildEditor";
import { useBuilds, type BuildDraft } from "@/hooks/useBuilds";
import { useTeamContext, TEAM_SIZE } from "@/context/TeamContext";
import { getNatureById } from "@/lib/natures";
import { formatName, type PokemonFullDetail } from "@/lib/pokeapi";
import type { PokemonBuild } from "@/lib/builds";
import { cn } from "@/lib/utils";

interface BuildsSectionProps {
  pokemon: PokemonFullDetail;
}

export const BuildsSection = ({ pokemon }: BuildsSectionProps) => {
  const { getForPokemon, create, update, remove, duplicate } = useBuilds();
  const { team, setTeam } = useTeamContext();
  const builds = getForPokemon(pokemon.id);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const isFull = team.length >= TEAM_SIZE;

  const slim = {
    id: pokemon.id,
    name: pokemon.name,
    types: pokemon.types,
    sprite: pokemon.sprite,
  };

  const buildIdsInTeam = new Set(
    team.filter((m) => m.pokemonId === pokemon.id).map((m) => m.buildId),
  );

  const handleCreate = (draft: BuildDraft) => {
    const b = create(pokemon.id, draft);
    toast.success(`Build "${b.name}" created`);
    setCreating(false);
  };

  const handleUpdate = (id: string, draft: BuildDraft) => {
    const b = update(id, draft);
    if (b) toast.success(`Build "${b.name}" updated`);
    setEditingId(null);
  };

  const handleDelete = (b: PokemonBuild) => {
    // Also drop from team if present.
    setTeam((prev) => prev.filter((m) => m.buildId !== b.id));
    remove(b.id);
    toast.success(`Build "${b.name}" deleted`);
  };

  const handleAddToTeam = (b: PokemonBuild) => {
    if (isFull) return;
    if (buildIdsInTeam.has(b.id)) return;
    setTeam((prev) =>
      prev.length >= TEAM_SIZE
        ? prev
        : [...prev, { pokemonId: pokemon.id, buildId: b.id, pokemon: slim }],
    );
    toast.success(`${b.name} added to team`);
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xs font-display font-bold uppercase tracking-wider text-muted-foreground">
          Builds <span className="opacity-60">({builds.length})</span>
        </h2>
        {!creating && !editingId && (
          <Button size="sm" variant="outline" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4 mr-1" />
            New build
          </Button>
        )}
      </div>

      {creating && (
        <BuildEditor
          pokemon={pokemon}
          onSave={handleCreate}
          onCancel={() => setCreating(false)}
        />
      )}

      {builds.length === 0 && !creating && (
        <p className="rounded-2xl border border-dashed border-border bg-card/30 p-4 text-center text-sm text-muted-foreground">
          No builds yet. Create one to add this Pokémon to your team.
        </p>
      )}

      <ul className="space-y-2 mt-2">
        {builds.map((b) => {
          if (editingId === b.id) {
            return (
              <li key={b.id}>
                <BuildEditor
                  pokemon={pokemon}
                  initial={{
                    name: b.name,
                    ability: b.ability,
                    item: b.item,
                    natureId: b.natureId,
                    moves: b.moves,
                    notes: b.notes,
                  }}
                  onSave={(d) => handleUpdate(b.id, d)}
                  onCancel={() => setEditingId(null)}
                />
              </li>
            );
          }
          const inTeam = buildIdsInTeam.has(b.id);
          const nature = getNatureById(b.natureId);
          return (
            <li
              key={b.id}
              className="rounded-2xl border border-border bg-card/50 p-3 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h3 className="font-display font-bold text-sm truncate">{b.name}</h3>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[11px] text-muted-foreground">
                    {b.ability && (
                      <span className="rounded-full bg-secondary/60 px-1.5 py-0.5">
                        {formatName(b.ability)}
                      </span>
                    )}
                    {b.item && (
                      <span className="rounded-full bg-secondary/60 px-1.5 py-0.5">
                        @ {formatName(b.item)}
                      </span>
                    )}
                    {nature && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-primary">
                        <Sparkles className="h-2.5 w-2.5" />
                        {nature.name}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setEditingId(b.id)}
                    aria-label="Edit build"
                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDuplicate(b)}
                    aria-label="Duplicate build"
                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleDelete(b)}
                    aria-label="Delete build"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {b.moves.some(Boolean) && (
                <ul className="grid grid-cols-2 gap-1">
                  {b.moves.map((m, i) => (
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
              )}

              {b.notes && (
                <p className="text-[11px] text-muted-foreground whitespace-pre-wrap">
                  {b.notes}
                </p>
              )}

              <Button
                size="sm"
                onClick={() => handleAddToTeam(b)}
                disabled={inTeam || isFull}
                variant={inTeam ? "secondary" : "default"}
                className="w-full"
              >
                {inTeam ? (
                  <>
                    <Check className="h-4 w-4 mr-1.5" />
                    In your team
                  </>
                ) : isFull ? (
                  "Team is full"
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-1.5" />
                    Add this build to team
                  </>
                )}
              </Button>
            </li>
          );
        })}
      </ul>
    </section>
  );
};
