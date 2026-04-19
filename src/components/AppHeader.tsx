import logo from "@/assets/logo.png";
import { Link } from "react-router-dom";
import { HeaderActions } from "@/components/HeaderActions";
import { useTeamContext, TEAM_SIZE } from "@/context/TeamContext";
import { toast } from "sonner";
import { useState } from "react";
import { getNatureById } from "@/lib/natures";

export const AppHeader = () => {
  const { team, setTeam, natures } = useTeamContext();
  const [justCopied, setJustCopied] = useState(false);

  const handleShare = async () => {
    if (team.length === 0) return;
    const url = new URL(window.location.origin + "/");
    url.searchParams.set("team", team.map((p) => p.id).join(","));
    const naturePairs = team
      .map((p) => {
        const n = getNatureById(natures[p.id]);
        return n ? `${p.id}:${n.code}` : null;
      })
      .filter((v): v is string => v !== null);
    if (naturePairs.length > 0) url.searchParams.set("natures", naturePairs.join(","));
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

  const handleClear = () => {
    if (team.length === 0) return;
    setTeam([]);
    toast.success("Team cleared");
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
          team={team}
          onLoad={(members) => setTeam(members.slice(0, TEAM_SIZE))}
          onShare={handleShare}
          onClear={handleClear}
          justCopied={justCopied}
        />
      </div>
    </header>
  );
};
