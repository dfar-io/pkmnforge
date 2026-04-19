import logo from "@/assets/logo.png";
import { Link } from "react-router-dom";
import { HeaderActions } from "@/components/HeaderActions";
import { useTeamContext, TEAM_SIZE } from "@/context/TeamContext";
import { toast } from "sonner";
import { useState } from "react";
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

const CONFIRM_CLEAR_THRESHOLD = 4;

export const AppHeader = () => {
  const { team, setTeam } = useTeamContext();
  const [justCopied, setJustCopied] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const pokemonForActions = team.map((m) => m.pokemon);

  const handleShare = async () => {
    if (team.length === 0) return;
    const url = new URL(window.location.origin + "/");
    // `?team=pokemonId:buildId,...` — buildId may be empty for default builds.
    url.searchParams.set(
      "team",
      team.map((m) => `${m.pokemonId}:${m.buildId}`).join(","),
    );
    const link = url.toString();
    try {
      await navigator.clipboard.writeText(link);
      setJustCopied(true);
      window.setTimeout(() => setJustCopied(false), 1800);
      toast.success("Team link copied to clipboard");
    } catch {
      if (navigator.share) {
        try {
          await navigator.share({ title: "My Pokénex team", url: link });
          return;
        } catch {
          /* dismissed */
        }
      }
      toast.error("Couldn't copy link");
    }
  };

  const performClear = () => {
    setTeam([]);
    toast.success("Team cleared");
  };

  const handleClear = () => {
    if (team.length === 0) return;
    if (team.length >= CONFIRM_CLEAR_THRESHOLD) {
      setConfirmOpen(true);
      return;
    }
    performClear();
  };

  return (
    <header className="px-4 pt-6 pb-4 sticky top-0 z-20 bg-background/85 backdrop-blur-md border-b border-border/60">
      <div className="max-w-2xl mx-auto flex items-center justify-between">
        <Link to="/" className="group">
          <div className="flex items-center gap-2">
            <img
              src={logo}
              alt="Pokénex logo"
              width={28}
              height={28}
              className="h-7 w-7 shrink-0"
            />
            <h1 className="font-display text-xl font-extrabold tracking-tight">
              Poké<span className="text-primary">nex</span>
            </h1>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Your personal Pokémon encyclopedia
          </p>
        </Link>
        <HeaderActions
          team={pokemonForActions}
          onShare={handleShare}
          onClear={handleClear}
          justCopied={justCopied}
        />
      </div>
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
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
    </header>
  );
};
