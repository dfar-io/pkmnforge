import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Search, X, Loader2, Star, ChevronRight, Check, ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  fetchPokemonIdsByType,
  fetchPokemonList,
  formatName,
  getCachedBaseStatTotal,
  type PokemonListItem,
} from "@/lib/pokeapi";
import { POKEMON_TYPES, TYPE_LABEL, type PokemonType } from "@/lib/pokemon-types";
import { TypeIcon } from "@/components/TypeBadge";
import { SmogonTierBadge } from "@/components/SmogonTierBadge";
import { getSmogonTierRank } from "@/lib/smogon";
import { cn } from "@/lib/utils";
import { useFavorites } from "@/hooks/useFavorites";
import { useTeamContext, TEAM_SIZE } from "@/context/TeamContext";
import { usePokemonTypes } from "@/hooks/usePokemonTypes";
import { useBuilds } from "@/hooks/useBuilds";

const PAGE_SIZE = 60;

type SortMode = "tier" | "dex" | "name" | "bst";

const SORT_LABEL: Record<SortMode, string> = {
  tier: "Smogon tier",
  dex: "Dex number",
  name: "Name (A–Z)",
  bst: "Base stat total",
};

const SORT_STORAGE_KEY = "pokenex.pokedex.sort.v1";

const isSortMode = (v: unknown): v is SortMode =>
  v === "tier" || v === "dex" || v === "name" || v === "bst";

const PokedexPage = () => {
  const [list, setList] = useState<PokemonListItem[]>([]);
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [activeTypes, setActiveTypes] = useState<PokemonType[]>([]);
  const [typeIdsMap, setTypeIdsMap] = useState<Record<string, Set<number>>>({});
  const [typeLoading, setTypeLoading] = useState(false);
  const [matchMode, setMatchMode] = useState<"any" | "all">("any");
  const [sortMode, setSortMode] = useState<SortMode>(() => {
    if (typeof window === "undefined") return "tier";
    const stored = window.localStorage.getItem(SORT_STORAGE_KEY);
    return isSortMode(stored) ? stored : "tier";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(SORT_STORAGE_KEY, sortMode);
  }, [sortMode]);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const { team } = useTeamContext();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { getForPokemon } = useBuilds();
  const teamPokemonIds = useMemo(
    () => new Set(team.map((m) => m.pokemonId)),
    [team],
  );
  const isFull = team.length >= TEAM_SIZE;

  useEffect(() => {
    fetchPokemonList().then(setList).catch(console.error);
    document.title = "Pokédex – Pokénex";
  }, []);

  // When arriving from an empty team slot or a type suggestion, apply state.
  useEffect(() => {
    const state = location.state as
      | { focusSearch?: boolean; initialTypes?: PokemonType[] }
      | null;
    if (!state?.focusSearch && !state?.initialTypes) return;
    if (state.initialTypes && state.initialTypes.length > 0) {
      setActiveTypes(state.initialTypes);
      if (state.initialTypes.length > 1) {
        setMatchMode("all");
      }
    }
    window.scrollTo({ top: 0, behavior: "auto" });
    let timeoutId: number | undefined;
    if (state.focusSearch) {
      timeoutId = window.setTimeout(() => {
        searchInputRef.current?.focus({ preventScroll: true });
        searchInputRef.current?.select();
      }, 50);
    }
    navigate(location.pathname, { replace: true, state: {} });
    return () => {
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, [location, navigate]);

  useEffect(() => {
    const missing = activeTypes.filter((t) => !typeIdsMap[t]);
    if (missing.length === 0) return;
    let cancelled = false;
    setTypeLoading(true);
    Promise.all(missing.map((t) => fetchPokemonIdsByType(t).then((ids) => [t, ids] as const)))
      .then((entries) => {
        if (cancelled) return;
        setTypeIdsMap((prev) => {
          const next = { ...prev };
          for (const [t, ids] of entries) next[t] = ids;
          return next;
        });
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setTypeLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeTypes, typeIdsMap]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let base = list;
    if (activeTypes.length > 0) {
      const sets = activeTypes.map((t) => typeIdsMap[t]).filter(Boolean) as Set<number>[];
      if (sets.length === activeTypes.length) {
        base = base.filter((p) =>
          matchMode === "all" ? sets.every((s) => s.has(p.id)) : sets.some((s) => s.has(p.id)),
        );
      }
    }
    if (q) {
      base = base.filter((p) => p.name.includes(q) || String(p.id) === q);
    }
    // Apply sort. Default tiebreaker is dex id for stable ordering.
    const sorted = [...base];
    if (sortMode === "dex") {
      sorted.sort((a, b) => a.id - b.id);
    } else if (sortMode === "name") {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortMode === "bst") {
      // BST is bundled as static data, so this is fully populated for all
      // 1025 species. Higher BST first; ties broken by dex id.
      sorted.sort((a, b) => {
        const ba = getCachedBaseStatTotal(a.id) ?? 0;
        const bb = getCachedBaseStatTotal(b.id) ?? 0;
        if (ba !== bb) return bb - ba;
        return a.id - b.id;
      });
    } else {
      // tier (default) — AG → Uber → OU → … → LC, then dex id.
      sorted.sort((a, b) => {
        const ra = getSmogonTierRank(a.id);
        const rb = getSmogonTierRank(b.id);
        if (ra !== rb) return ra - rb;
        return a.id - b.id;
      });
    }
    return sorted;
  }, [list, query, activeTypes, typeIdsMap, matchMode, sortMode]);

  const toggleType = (t: PokemonType) => {
    setActiveTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  useEffect(() => setVisibleCount(PAGE_SIZE), [query, activeTypes, typeIdsMap, matchMode, sortMode]);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const el = sentinelRef.current;
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setVisibleCount((c) => Math.min(c + PAGE_SIZE, filtered.length));
      }
    });
    io.observe(el);
    return () => io.disconnect();
  }, [filtered.length, visibleCount]);

  const visible = filtered.slice(0, visibleCount);

  return (
    <div className="space-y-3">
      <div>
        <h2 className="font-display text-lg font-extrabold tracking-tight">Pokédex</h2>
        <p className="text-[11px] text-muted-foreground">
          Browse all {list.length || 1025} Pokémon. Tap one to manage builds.
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={searchInputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or #dex..."
          className="pl-9 pr-9 bg-secondary border-border"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap gap-1.5">
          {POKEMON_TYPES.map((t) => {
            const active = activeTypes.includes(t);
            return (
              <button
                key={t}
                type="button"
                onClick={() => toggleType(t)}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-display font-semibold uppercase tracking-wide transition-all",
                  active
                    ? "bg-primary text-primary-foreground ring-2 ring-primary/40"
                    : "bg-secondary/60 text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
                aria-pressed={active}
              >
                <TypeIcon type={t} className="h-4 w-4 ring-0" />
                <span>{TYPE_LABEL[t]}</span>
              </button>
            );
          })}
        </div>
        {activeTypes.length > 0 && (
          <div className="flex items-center justify-between gap-2 px-1">
            <div className="inline-flex rounded-full bg-secondary/60 p-0.5 text-[10px] font-display font-semibold uppercase tracking-wide">
              {(["any", "all"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setMatchMode(mode)}
                  className={cn(
                    "px-2.5 py-1 rounded-full transition-colors capitalize",
                    matchMode === mode
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                  aria-pressed={matchMode === mode}
                >
                  {mode}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setActiveTypes([])}
              className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-display font-semibold uppercase tracking-wide bg-secondary/60 text-muted-foreground hover:text-destructive"
            >
              <X className="h-3 w-3" />
              Clear ({activeTypes.length})
            </button>
          </div>
        )}
        <div className="flex items-center justify-between gap-2 px-1">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-display font-semibold">
            {filtered.length} {filtered.length === 1 ? "Pokémon" : "Pokémon"}
          </span>
          <label className="inline-flex items-center gap-1.5 rounded-full bg-secondary/60 pl-2 pr-1 py-0.5 text-[10px] font-display font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground transition-colors">
            <ArrowUpDown className="h-3 w-3" />
            <span className="sr-only">Sort by</span>
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              className="bg-transparent border-0 outline-none cursor-pointer text-foreground py-1 pr-1 focus:outline-none"
              aria-label="Sort Pokémon by"
            >
              {(Object.keys(SORT_LABEL) as SortMode[]).map((m) => (
                <option key={m} value={m} className="bg-popover text-popover-foreground">
                  {SORT_LABEL[m]}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {list.length === 0 || (typeLoading && filtered.length === 0) ? (
        <div className="grid place-items-center py-16 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="grid place-items-center py-16 text-muted-foreground text-sm">
          No Pokémon match
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {visible.map((p) => {
            const fav = isFavorite(p.id);
            const inTeam = teamPokemonIds.has(p.id);
            const buildCount = getForPokemon(p.id).length;
            return (
              <PokedexRow
                key={p.id}
                id={p.id}
                name={p.name}
                fav={fav}
                inTeam={inTeam}
                buildCount={buildCount}
                isFull={isFull}
                showBst={sortMode === "bst"}
                onToggleFav={() => toggleFavorite(p.id)}
              />
            );
          })}
        </ul>
      )}
      <div ref={sentinelRef} className="h-8" />
    </div>
  );
};

interface PokedexRowProps {
  id: number;
  name: string;
  fav: boolean;
  inTeam: boolean;
  buildCount: number;
  isFull: boolean;
  showBst: boolean;
  onToggleFav: () => void;
}

const PokedexRow = ({ id, name, fav, inTeam, buildCount, isFull, showBst, onToggleFav }: PokedexRowProps) => {
  const types = usePokemonTypes(id);
  const primary = types?.[0];
  const bst = showBst ? getCachedBaseStatTotal(id) : null;
  return (
    <li className="relative">
      <Link
        to={`/pokedex/${id}`}
        className={cn(
          "flex items-stretch rounded-xl bg-secondary/60 hover:bg-secondary overflow-hidden",
          "transition-all hover:scale-[1.01] active:scale-[0.99]",
          "border-l-4",
          primary ? `border-l-type-${primary}` : "border-l-transparent",
        )}
        style={
          primary
            ? {
                backgroundImage:
                  "linear-gradient(90deg, hsl(var(--type-" +
                  primary +
                  ") / 0.18), transparent 55%)",
              }
            : undefined
        }
      >
        <div className="flex items-center gap-3 p-2 flex-1 min-w-0">
          <div className="relative">
            <img
              src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`}
              alt=""
              loading="lazy"
              className="h-12 w-12 object-contain shrink-0"
            />
            <div className="absolute -top-0.5 -left-0.5">
              <SmogonTierBadge pokemonId={id} />
            </div>
          </div>
          <div className="min-w-0 flex-1 pr-20">
            <div className="flex items-center gap-1.5">
              <p className="text-[10px] text-muted-foreground font-mono">
                #{String(id).padStart(4, "0")}
              </p>
              {bst != null && (() => {
                const ratio = Math.min(1, Math.max(0, bst / 720));
                const hue = ratio <= 0.5 ? ratio * 2 * 120 : 120 + (ratio - 0.5) * 2 * 120;
                return (
                  <span
                    className="text-[10px] font-mono font-bold tabular-nums shrink-0"
                    style={{ color: `hsl(${hue} 75% 55%)` }}
                    title={`Base stat total: ${bst}`}
                  >
                    {bst}
                  </span>
                );
              })()}
            </div>
            <p className="text-sm font-display font-semibold truncate">
              {formatName(name)}
            </p>
            <RowTypes types={types} />
          </div>
        </div>
      </Link>
      <div className="absolute top-1/2 -translate-y-1/2 right-2 flex items-center gap-1">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            onToggleFav();
          }}
          aria-label={fav ? "Remove from favorites" : "Add to favorites"}
          aria-pressed={fav}
          className={cn(
            "grid place-items-center h-7 w-7 rounded-full transition-colors",
            fav
              ? "text-favorite hover:text-favorite/80"
              : "text-muted-foreground/60 hover:text-favorite",
          )}
        >
          <Star className={cn("h-3.5 w-3.5", fav && "fill-current")} />
        </button>
        {buildCount > 0 && (
          <span
            className={cn(
              "rounded-full px-1.5 py-0.5 text-[10px] font-display font-bold uppercase tracking-wide",
              inTeam
                ? "bg-success/15 text-success"
                : "bg-primary/15 text-primary",
            )}
            title={`${buildCount} build${buildCount === 1 ? "" : "s"}`}
          >
            {inTeam && <Check className="inline h-2.5 w-2.5 mr-0.5" />}
            {buildCount}
          </span>
        )}
        <ChevronRight className="h-4 w-4 text-muted-foreground/60" />
        {isFull && !inTeam && <span className="sr-only">team full</span>}
      </div>
    </li>
  );
};

const RowTypes = ({ types }: { types: PokemonType[] | null }) => {
  if (!types || types.length === 0) {
    return <div className="mt-1 h-4" aria-hidden />;
  }
  return (
    <div className="flex items-center gap-1 mt-1">
      {types.map((t) => (
        <span
          key={t}
          className="inline-flex items-center gap-1 rounded-full bg-background/40 px-1.5 py-0.5 text-[9px] font-display font-semibold uppercase tracking-wide text-foreground/80"
        >
          <TypeIcon type={t} className="h-3 w-3 ring-0" />
          {TYPE_LABEL[t]}
        </span>
      ))}
    </div>
  );
};

export default PokedexPage;
