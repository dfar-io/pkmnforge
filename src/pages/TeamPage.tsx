import { useEffect, useState } from "react";
import { TeamGrid } from "@/components/TeamGrid";
import { TeamAnalysis } from "@/components/TeamAnalysis";
import { PokemonPicker } from "@/components/PokemonPicker";
import { SuggestTeammate } from "@/components/SuggestTeammate";
import { TeamSlotSheet } from "@/components/TeamSlotSheet";
import { useTeamContext, TEAM_SIZE } from "@/context/TeamContext";
import type { PokemonDetail } from "@/lib/pokeapi";

const TeamPage = () => {
  const { team, setTeam, natures, setNature } = useTeamContext();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [detailSlot, setDetailSlot] = useState<number | null>(null);

  const isFull = team.length >= TEAM_SIZE;

  const openPicker = () => {
    if (isFull) return;
    setPickerOpen(true);
  };

  useEffect(() => {
    document.title = "Team Builder – Pokénex";
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      if (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        target?.isContentEditable
      ) {
        return;
      }
      if (pickerOpen || isFull) return;
      if (e.key === "n" || e.key === "N" || e.key === "+" || e.key === "=") {
        e.preventDefault();
        setPickerOpen(true);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [pickerOpen, isFull]);

  const handleSelect = (pokemon: PokemonDetail) => {
    setTeam((prev) => (prev.length >= TEAM_SIZE ? prev : [...prev, pokemon]));
  };

  const handleRemove = (slot: number) => {
    setTeam((prev) => prev.filter((_, i) => i !== slot));
  };

  const excludeIds = team.map((p) => p.id);

  const addSuggestion = (pokemon: PokemonDetail) => {
    if (isFull) return;
    setTeam((prev) => [...prev, pokemon]);
  };

  return (
    <>
      <TeamGrid
        team={team}
        teamSize={TEAM_SIZE}
        natures={natures}
        onOpenPicker={openPicker}
        onRemove={handleRemove}
        onReorder={setTeam}
        onOpenDetail={(slot) => setDetailSlot(slot)}
      />

      <section>
        <SuggestTeammate
          team={team}
          excludeIds={excludeIds}
          onPick={addSuggestion}
          canAdd={!isFull}
        />
      </section>

      <section>
        <TeamAnalysis team={team} />
      </section>

      <PokemonPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={handleSelect}
        excludeIds={excludeIds}
      />

      <TeamSlotSheet
        pokemon={detailSlot !== null ? team[detailSlot] ?? null : null}
        open={detailSlot !== null && !!team[detailSlot]}
        onOpenChange={(open) => {
          if (!open) setDetailSlot(null);
        }}
        selectedNatureId={
          detailSlot !== null && team[detailSlot]
            ? natures[team[detailSlot].id]
            : undefined
        }
        onSelectNature={(natureId) => {
          if (detailSlot === null) return;
          const member = team[detailSlot];
          if (!member) return;
          setNature(member.id, natureId);
        }}
      />
    </>
  );
};

export default TeamPage;
