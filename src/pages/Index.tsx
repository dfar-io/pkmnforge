import { useEffect, useMemo, useState } from "react";
import { Sparkles, Trash2 } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import { TeamSlot } from "@/components/TeamSlot";
import { TeamAnalysis } from "@/components/TeamAnalysis";
import { PokemonPicker } from "@/components/PokemonPicker";
import { SuggestTeammate } from "@/components/SuggestTeammate";
import type { PokemonDetail } from "@/lib/pokeapi";
import { POKEMON_TYPES, classify, getMultiplier } from "@/lib/pokemon-types";

const TEAM_SIZE = 6;
const STORAGE_KEY = "teamforge.team.v1";

// Lazy initializer — read once on mount; safe-guarded for SSR / private mode.
const loadStoredTeam = (): PokemonDetail[] => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Minimal shape validation so a corrupt entry can't crash the app.
    return parsed
      .filter(
        (p): p is PokemonDetail =>
          p &&
          typeof p.id === "number" &&
          typeof p.name === "string" &&
          Array.isArray(p.types) &&
          typeof p.sprite === "string",
      )
      .slice(0, TEAM_SIZE);
  } catch {
    return [];
  }
};

const Index = () => {
  // Team is always compacted: filled members first, no gaps.
  const [team, setTeam] = useState<PokemonDetail[]>(loadStoredTeam);
  const [pickerOpen, setPickerOpen] = useState(false);

  // Persist on every change.
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(team));
    } catch {
      // Storage may be unavailable (quota / private mode) — silently ignore.
    }
  }, [team]);

  const isFull = team.length >= TEAM_SIZE;

  const openPicker = () => {
    if (isFull) return;
    setPickerOpen(true);
  };

  const handleSelect = (pokemon: PokemonDetail) => {
    setTeam((prev) => (prev.length >= TEAM_SIZE ? prev : [...prev, pokemon]));
  };

  // Remove and compact (shift left).
  const handleRemove = (slot: number) => {
    setTeam((prev) => prev.filter((_, i) => i !== slot));
  };

  const clearAll = () => setTeam([]);

  const excludeIds = team.map((p) => p.id);

  // IDs of team members involved in any 3+ shared weakness.
  const criticalMemberIds = useMemo(() => {
    const ids = new Set<number>();
    for (const attacker of POKEMON_TYPES) {
      const weakOnes = team.filter(
        (m) => classify(getMultiplier(attacker, m.types)) === "weak",
      );
      if (weakOnes.length >= 3) {
        for (const m of weakOnes) ids.add(m.id);
      }
    }
    return ids;
  }, [team]);

  const addSuggestion = (pokemon: PokemonDetail) => {
    if (isFull) return;
    setTeam((prev) => [...prev, pokemon]);
  };

  // dnd-kit sensors: small distance to avoid hijacking taps on remove button.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setTeam((prev) => {
      const ids = prev.map((p) => `pkm-${p.id}`);
      const from = ids.indexOf(String(active.id));
      const to = ids.indexOf(String(over.id));
      if (from === -1 || to === -1) return prev;
      return arrayMove(prev, from, to);
    });
  };

  const sortableIds = team.map((p) => `pkm-${p.id}`);

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Header */}
      <header className="px-4 pt-6 pb-4 sticky top-0 z-20 bg-background/85 backdrop-blur-md border-b border-border/60">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h1 className="font-display text-xl font-extrabold tracking-tight">
                Team<span className="text-primary">Forge</span>
              </h1>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Build & analyze your Pokémon squad
            </p>
          </div>
          {team.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAll}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-5 space-y-6">
        {/* Team grid */}
        <section>
          <h2 className="sr-only">Your Team</h2>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={sortableIds} strategy={rectSortingStrategy}>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                {Array.from({ length: TEAM_SIZE }).map((_, i) => {
                  const member = team[i];
                  // Only the first empty slot (right after the last filled one) is interactive.
                  const isNextEmpty = !member && i === team.length;
                  return (
                    <TeamSlot
                      key={member ? `pkm-${member.id}` : `empty-${i}`}
                      pokemon={member}
                      index={i}
                      onAdd={isNextEmpty ? openPicker : () => {}}
                      onRemove={() => handleRemove(i)}
                      isCritical={member ? criticalMemberIds.has(member.id) : false}
                      disabled={!member && !isNextEmpty}
                    />
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>
        </section>

        {/* Suggestion */}
        <section>
          <SuggestTeammate
            team={team}
            excludeIds={excludeIds}
            onPick={addSuggestion}
            canAdd={!isFull}
          />
        </section>

        {/* Analysis */}
        <section>
          <TeamAnalysis team={team} />
        </section>
      </main>

      <PokemonPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={handleSelect}
        excludeIds={excludeIds}
      />
    </div>
  );
};

export default Index;
