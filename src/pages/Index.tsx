import { useMemo, useState } from "react";
import { Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TeamSlot } from "@/components/TeamSlot";
import { TeamAnalysis } from "@/components/TeamAnalysis";
import { PokemonPicker } from "@/components/PokemonPicker";
import { SuggestTeammate } from "@/components/SuggestTeammate";
import type { PokemonDetail } from "@/lib/pokeapi";
import { POKEMON_TYPES, classify, getMultiplier } from "@/lib/pokemon-types";

const TEAM_SIZE = 6;

const Index = () => {
  // Team is always compacted: filled members first, no gaps.
  const [team, setTeam] = useState<PokemonDetail[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);

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
          {filledTeam.length > 0 && (
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
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
            {team.map((member, i) => (
              <TeamSlot
                key={i}
                pokemon={member}
                index={i}
                onAdd={() => openPicker(i)}
                onRemove={() => handleRemove(i)}
                isCritical={member ? criticalMemberIds.has(member.id) : false}
              />
            ))}
          </div>
        </section>

        {/* Suggestion */}
        <section>
          <SuggestTeammate
            team={filledTeam}
            excludeIds={excludeIds}
            onPick={addSuggestion}
            canAdd={firstEmptySlot !== -1}
          />
        </section>

        {/* Analysis */}
        <section>
          <TeamAnalysis team={filledTeam} />
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
