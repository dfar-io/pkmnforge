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
  const [team, setTeam] = useState<(PokemonDetail | undefined)[]>(
    Array(TEAM_SIZE).fill(undefined),
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);

  const openPicker = (slot: number) => {
    setActiveSlot(slot);
    setPickerOpen(true);
  };

  const handleSelect = (pokemon: PokemonDetail) => {
    if (activeSlot === null) return;
    setTeam((prev) => {
      const next = [...prev];
      next[activeSlot] = pokemon;
      return next;
    });
  };

  const handleRemove = (slot: number) => {
    setTeam((prev) => {
      const next = [...prev];
      next[slot] = undefined;
      return next;
    });
  };

  const clearAll = () => setTeam(Array(TEAM_SIZE).fill(undefined));

  const filledTeam = team.filter((p): p is PokemonDetail => Boolean(p));
  const excludeIds = filledTeam.map((p) => p.id);
  const firstEmptySlot = team.findIndex((m) => !m);

  const addSuggestion = (pokemon: PokemonDetail) => {
    if (firstEmptySlot === -1) return;
    setTeam((prev) => {
      const next = [...prev];
      next[firstEmptySlot] = pokemon;
      return next;
    });
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
