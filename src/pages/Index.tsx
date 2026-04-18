import { useEffect, useState } from "react";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import { fetchPokemonDetail } from "@/lib/pokeapi";
import { TeamGrid } from "@/components/TeamGrid";
import { TeamAnalysis } from "@/components/TeamAnalysis";
import { PokemonPicker } from "@/components/PokemonPicker";
import { SiteFooter } from "@/components/SiteFooter";
import { SuggestTeammate } from "@/components/SuggestTeammate";
import { HeaderActions } from "@/components/HeaderActions";
import type { PokemonDetail } from "@/lib/pokeapi";

const TEAM_SIZE = 6;
const STORAGE_KEY = "pkmnforge.team.v1";
const LEGACY_STORAGE_KEYS = ["teamforge.team.v1"] as const;

// Parse `?team=1,4,7` into a list of valid dex IDs (deduped, capped to TEAM_SIZE).
const parseTeamFromQuery = (): number[] => {
  if (typeof window === "undefined") return [];
  try {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get("team");
    if (!raw) return [];
    const ids: number[] = [];
    for (const part of raw.split(",")) {
      const n = Number(part.trim());
      if (Number.isInteger(n) && n > 0 && n <= 1025 && !ids.includes(n)) {
        ids.push(n);
      }
      if (ids.length >= TEAM_SIZE) break;
    }
    return ids;
  } catch {
    return [];
  }
};

const loadStoredTeam = (): PokemonDetail[] => {
  if (typeof window === "undefined") return [];
  if (parseTeamFromQuery().length > 0) return [];
  try {
    let raw = window.localStorage.getItem(STORAGE_KEY);

    if (!raw) {
      for (const legacy of LEGACY_STORAGE_KEYS) {
        const legacyRaw = window.localStorage.getItem(legacy);
        if (legacyRaw) {
          raw = legacyRaw;
          window.localStorage.setItem(STORAGE_KEY, legacyRaw);
          window.localStorage.removeItem(legacy);
          break;
        }
      }
    } else {
      for (const legacy of LEGACY_STORAGE_KEYS) {
        window.localStorage.removeItem(legacy);
      }
    }

    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
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
  const [team, setTeam] = useState<PokemonDetail[]>(loadStoredTeam);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(team));
    } catch {
      /* ignore */
    }
  }, [team]);

  useEffect(() => {
    const ids = parseTeamFromQuery();
    if (ids.length === 0) return;
    let cancelled = false;
    (async () => {
      try {
        const details = await Promise.all(
          ids.map((id) => fetchPokemonDetail(id).catch(() => null)),
        );
        if (cancelled) return;
        const valid = details.filter((d): d is PokemonDetail => Boolean(d));
        if (valid.length > 0) {
          setTeam(valid.slice(0, TEAM_SIZE));
          toast.success(`Loaded shared team (${valid.length})`);
        }
      } finally {
        if (!cancelled) {
          const url = new URL(window.location.href);
          url.searchParams.delete("team");
          window.history.replaceState({}, "", url.pathname + url.search + url.hash);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [justCopied, setJustCopied] = useState(false);
  const handleShare = async () => {
    if (team.length === 0) return;
    const url = new URL(window.location.href);
    url.searchParams.set("team", team.map((p) => p.id).join(","));
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

  const clearAll = () => setTeam([]);

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
            onClear={clearAll}
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

      <SiteFooter />
    </div>
  );
};

export default Index;
