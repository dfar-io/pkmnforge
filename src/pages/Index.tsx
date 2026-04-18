import { useEffect, useMemo, useState } from "react";
import { Check, Share2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import { fetchPokemonDetail } from "@/lib/pokeapi";
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
import { SiteFooter } from "@/components/SiteFooter";
import { SuggestTeammate } from "@/components/SuggestTeammate";
import type { PokemonDetail } from "@/lib/pokeapi";
import { POKEMON_TYPES, classify, getMultiplier } from "@/lib/pokemon-types";

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

// Lazy initializer — read once on mount; safe-guarded for SSR / private mode.
// Performs a one-time migration from legacy keys to the current STORAGE_KEY.
// If `?team=` is present in the URL, we defer to the async hydration effect
// and start empty so the URL-shared team wins over stored team.
const loadStoredTeam = (): PokemonDetail[] => {
  if (typeof window === "undefined") return [];
  if (parseTeamFromQuery().length > 0) return [];
  try {
    let raw = window.localStorage.getItem(STORAGE_KEY);

    // One-time migration: pull from the first legacy key that has data.
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
      // Already migrated — clean up any lingering legacy entries.
      for (const legacy of LEGACY_STORAGE_KEYS) {
        window.localStorage.removeItem(legacy);
      }
    }

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

  // One-time hydration from `?team=` query string. Runs after mount so
  // PokemonDetail can be fetched. Strips the param once loaded so further
  // edits don't fight the URL. Failures fall back silently.
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
          // Clean the URL so subsequent edits aren't shadowed by stale params.
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

  // Keyboard shortcut: "n" or "+" opens the picker (when not typing in a field
  // and the team has space). The dialog itself handles Esc to close.
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
          {team.length > 0 && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="text-muted-foreground hover:text-primary"
                aria-label="Copy shareable team link"
              >
                {justCopied ? (
                  <Check className="h-4 w-4 mr-1 text-success" />
                ) : (
                  <Share2 className="h-4 w-4 mr-1" />
                )}
                {justCopied ? "Copied" : "Share"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Clear
              </Button>
            </div>
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

      <SiteFooter />
    </div>
  );
};

export default Index;
