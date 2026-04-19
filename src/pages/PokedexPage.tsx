import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Search, X, Loader2, Star, Plus, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  fetchPokemonDetail,
  fetchPokemonIdsByType,
  fetchPokemonList,
  formatName,
  type PokemonListItem,
} from "@/lib/pokeapi";
import { POKEMON_TYPES, TYPE_LABEL, type PokemonType } from "@/lib/pokemon-types";
import { TypeIcon } from "@/components/TypeBadge";
import { cn } from "@/lib/utils";
import { useFavorites } from "@/hooks/useFavorites";
import { useTeamContext, TEAM_SIZE } from "@/context/TeamContext";
import { usePokemonTypes } from "@/hooks/usePokemonTypes";
import { toast } from "sonner";

const PAGE_SIZE = 60;

const PokedexPage = () => {
  const [list, setList] = useState<PokemonListItem[]>([]);
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [activeTypes, setActiveTypes] = useState<PokemonType[]>([]);
  const [typeIdsMap, setTypeIdsMap] = useState<Record<string, Set<number>>>({});
  const [typeLoading, setTypeLoading] = useState(false);
  const [matchMode, setMatchMode] = useState<"any" | "all">("any");
  const [adding, setAdding] = useState<number | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const { team, setTeam } = useTeamContext();
  const { isFavorite, toggleFavorite } = useFavorites();
  const teamIds = useMemo(() => new Set(team.map((p) => p.id)), [team]);
  const isFull = team.length >= TEAM_SIZE;

  useEffect(() => {
    fetchPokemonList().then(setList).catch(console.error);
    document.title = "Pokédex – Pokénex";
  }, []);

  // When arriving from an empty team slot, jump to top and focus search.
  useEffect(() => {
    const state = location.state as { focusSearch?: boolean } | null;
    if (!state?.focusSearch) return;
    window.scrollTo({ top: 0, behavior: "auto" });
    const id = window.setTimeout(() => {
      searchInputRef.current?.focus({ preventScroll: true });
      searchInputRef.current?.select();
    }, 50);
    navigate(location.pathname, { replace: true, state: {} });
    return () => window.clearTimeout(id);
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
    if (!q) return base;
    return base.filter((p) => p.name.includes(q) || String(p.id) === q);
  }, [list, query, activeTypes, typeIdsMap, matchMode]);

  const toggleType = (t: PokemonType) => {
    setActiveTypes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  };

  useEffect(() => setVisibleCount(PAGE_SIZE), [query, activeTypes, typeIdsMap, matchMode]);

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

  const handleAdd = async (id: number, name: string) => {
    if (isFull || teamIds.has(id)) return;
    setAdding(id);
    try {
      const detail = await fetchPokemonDetail(id);
      setTeam((prev) => (prev.length >= TEAM_SIZE ? prev : [...prev, detail]));
      toast.success(`${formatName(name)} added to team`);
    } catch (e) {
      console.error(e);
      toast.error("Couldn't add Pokémon");
    } finally {
      setAdding(null);
    }
  };

  const visible = filtered.slice(0, visibleCount);

  return (
    <div className="space-y-3">
      <div>
        <h2 className="font-display text-lg font-extrabold tracking-tight">Pokédex</h2>
        <p className="text-[11px] text-muted-foreground">
          Browse all {list.length || 1025} Pokémon. Tap a card for details.
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
            const inTeam = teamIds.has(p.id);
            return (
              <PokedexRow
                key={p.id}
                id={p.id}
                name={p.name}
                fav={fav}
                inTeam={inTeam}
                isFull={isFull}
                adding={adding === p.id}
                onToggleFav={() => toggleFavorite(p.id)}
                onAdd={() => handleAdd(p.id, p.name)}
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
  isFull: boolean;
  adding: boolean;
  onToggleFav: () => void;
  onAdd: () => void;
}

const PokedexRow = ({ id, name, fav, inTeam, isFull, adding, onToggleFav, onAdd }: PokedexRowProps) => {
  const types = usePokemonTypes(id);
  const primary = types?.[0];
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
          <img
            src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`}
            alt=""
            loading="lazy"
            className="h-12 w-12 object-contain shrink-0"
          />
          <div className="min-w-0 flex-1 pr-14">
            <p className="text-[10px] text-muted-foreground font-mono">
              #{String(id).padStart(4, "0")}
            </p>
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
                      toggleFavorite(p.id);
                    }}
                    aria-label={fav ? "Remove from favorites" : "Add to favorites"}
                    aria-pressed={fav}
                    className={cn(
                      "grid place-items-center h-6 w-6 rounded-full transition-colors",
                      fav
                        ? "text-favorite hover:text-favorite/80"
                        : "text-muted-foreground/60 hover:text-favorite",
                    )}
                  >
                    <Star className={cn("h-3.5 w-3.5", fav && "fill-current")} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      handleAdd(p.id, p.name);
                    }}
                    disabled={inTeam || isFull || adding === p.id}
                    aria-label={inTeam ? "Already in team" : "Add to team"}
                    className={cn(
                      "grid place-items-center h-6 w-6 rounded-full transition-colors",
                      inTeam
                        ? "text-success"
                        : isFull
                          ? "text-muted-foreground/30 cursor-not-allowed"
                          : "text-muted-foreground/60 hover:text-primary",
                    )}
                  >
                    {adding === p.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : inTeam ? (
                      <Check className="h-3.5 w-3.5" />
                    ) : (
                      <Plus className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <div ref={sentinelRef} className="h-8" />
    </div>
  );
};

const RowTypes = ({ id }: { id: number }) => {
  const types = usePokemonTypes(id);
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
