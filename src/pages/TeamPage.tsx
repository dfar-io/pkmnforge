import { useEffect, useState } from "react";
import { toast } from "sonner";
import { TeamGrid } from "@/components/TeamGrid";
import { TeamAnalysis } from "@/components/TeamAnalysis";
import { PokemonPicker } from "@/components/PokemonPicker";
import { SuggestTeammate } from "@/components/SuggestTeammate";
import { TeamSlotSheet } from "@/components/TeamSlotSheet";
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
import { useTeamContext, TEAM_SIZE } from "@/context/TeamContext";
import type { PokemonDetail } from "@/lib/pokeapi";

const CONFIRM_CLEAR_THRESHOLD = 4;

const TeamPage = () => {
  const { team, setTeam, natures, setNature } = useTeamContext();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [detailSlot, setDetailSlot] = useState<number | null>(null);

  const isFull = team.length >= TEAM_SIZE;

  const openPicker = () => {
    if (isFull) return;
    setPickerOpen(true);
  };

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

  const performClear = () => {
    setTeam([]);
    toast.success("Team cleared");
  };

  useEffect(() => {
    if (team.length >= CONFIRM_CLEAR_THRESHOLD) {
      // Logic for handling large team clear confirmation
    }
  }, [team.length]);

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

      <AlertDialog open={confirmClearOpen} onOpenChange={setConfirmClearOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear your team?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all {team.length} Pokémon from your current team. Saved teams aren't affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={performClear}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Clear team
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default TeamPage;
