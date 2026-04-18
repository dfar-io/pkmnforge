import { useEffect, useState } from "react";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import { TeamGrid } from "@/components/TeamGrid";
import { TeamAnalysis } from "@/components/TeamAnalysis";
import { PokemonPicker } from "@/components/PokemonPicker";
import { SiteFooter } from "@/components/SiteFooter";
import { SuggestTeammate } from "@/components/SuggestTeammate";
import { HeaderActions } from "@/components/HeaderActions";
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
import { useTeam } from "@/hooks/useTeam";
import { getNatureById } from "@/lib/natures";
import type { PokemonDetail } from "@/lib/pokeapi";

const TEAM_SIZE = 6;
const CONFIRM_CLEAR_THRESHOLD = 4;

const Index = () => {
  const { team, setTeam, natures, setNature } = useTeam(TEAM_SIZE);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [justCopied, setJustCopied] = useState(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [detailSlot, setDetailSlot] = useState<number | null>(null);

  const handleShare = async () => {
    if (team.length === 0) return;
    const url = new URL(window.location.href);
    url.searchParams.set("team", team.map((p) => p.id).join(","));
    // Include natures (compact 2-char codes) so shared links carry per-slot
    // nature picks. Drop the param entirely if none are set to keep URLs short.
    const naturePairs = team
      .map((p) => {
        const n = getNatureById(natures[p.id]);
        return n ? `${p.id}:${n.code}` : null;
      })
      .filter((v): v is string => v !== null);
    if (naturePairs.length > 0) url.searchParams.set("natures", naturePairs.join(","));
    else url.searchParams.delete("natures");
    const link = url.toString();
    try {
      await navigator.clipboard.writeText(link);
      setJustCopied(true);
      window.setTimeout(() => setJustCopied(false), 1800);
      toast.success("Team link copied to clipboard");
    } catch {
      if (navigator.share) {
        try {
          await navigator.share({ title: "My PkmnForge team", url: link });
          return;
        } catch {
          /* user dismissed */
        }
      }
      toast.error("Couldn't copy link");
    }
  };

  const isFull = team.length >= TEAM_SIZE;

  const openPicker = () => {
    if (isFull) return;
    setPickerOpen(true);
  };

  // Keyboard shortcut: "n" or "+" opens the picker.
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

  const requestClear = () => {
    if (team.length === 0) return;
    if (team.length >= CONFIRM_CLEAR_THRESHOLD) {
      setConfirmClearOpen(true);
      return;
    }
    performClear();
  };

  const excludeIds = team.map((p) => p.id);

  const addSuggestion = (pokemon: PokemonDetail) => {
    if (isFull) return;
    setTeam((prev) => [...prev, pokemon]);
  };

  return (
    <div className="min-h-screen bg-background pb-12">
      <header className="px-4 pt-6 pb-4 sticky top-0 z-20 bg-background/85 backdrop-blur-md border-b border-border/60">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <img
                src={logo}
                alt="PkmnForge logo"
                width={28}
                height={28}
                className="h-7 w-7 shrink-0"
              />
              <h1 className="font-display text-xl font-extrabold tracking-tight">
                Pkmn<span className="text-primary">Forge</span>
              </h1>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Build & analyze your Pokémon squad
            </p>
          </div>
          <HeaderActions
            team={team}
            onLoad={(members) => setTeam(members.slice(0, TEAM_SIZE))}
            onShare={handleShare}
            onClear={requestClear}
            justCopied={justCopied}
          />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 pt-5 space-y-6">
        <TeamGrid
          team={team}
          teamSize={TEAM_SIZE}
          onOpenPicker={openPicker}
          onRemove={handleRemove}
          onReorder={setTeam}
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
      </main>

      <PokemonPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={handleSelect}
        excludeIds={excludeIds}
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

      <SiteFooter />
    </div>
  );
};

export default Index;
