import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  fetchPokemonDetail,
  fetchPokemonList,
  formatName,
  type PokemonDetail,
  type PokemonListItem,
} from "@/lib/pokeapi";
import { TypeBadge } from "./TypeBadge";

interface PokemonPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (pokemon: PokemonDetail) => void;
  excludeIds: number[];
}

const PAGE_SIZE = 40;

export const PokemonPicker = ({ open, onOpenChange, onSelect, excludeIds }: PokemonPickerProps) => {
  const [list, setList] = useState<PokemonListItem[]>([]);
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loadingPick, setLoadingPick] = useState<number | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    fetchPokemonList().then(setList).catch(console.error);
  }, [open]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setVisibleCount(PAGE_SIZE);
    }
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = list.filter((p) => !excludeIds.includes(p.id));
    if (!q) return base;
    return base.filter((p) => p.name.includes(q) || String(p.id) === q);
  }, [list, query, excludeIds]);

  const visible = filtered.slice(0, visibleCount);

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

  useEffect(() => setVisibleCount(PAGE_SIZE), [query]);

  const handleSelect = async (id: number) => {
    setLoadingPick(id);
    try {
      const detail = await fetchPokemonDetail(id);
      onSelect(detail);
      onOpenChange(false);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPick(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg h-[85vh] flex flex-col p-0 gap-0 bg-card">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle className="font-display text-xl">Choose a Pokémon</DialogTitle>
        </DialogHeader>
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or #dex..."
              className="pl-9 pr-9 bg-secondary border-border"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-4 scrollbar-hide">
          {list.length === 0 ? (
            <div className="grid h-full place-items-center text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <ul className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {visible.map((p) => (
                <li key={p.id}>
                  <button
                    onClick={() => handleSelect(p.id)}
                    disabled={loadingPick === p.id}
                    className="w-full rounded-xl bg-secondary/60 hover:bg-secondary p-2 transition-all hover:scale-[1.02] active:scale-95 flex items-center gap-2 text-left disabled:opacity-50"
                  >
                    <img
                      src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`}
                      alt=""
                      loading="lazy"
                      className="h-10 w-10 object-contain shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] text-muted-foreground font-mono">
                        #{String(p.id).padStart(4, "0")}
                      </p>
                      <p className="text-xs font-display font-semibold truncate">
                        {formatName(p.name)}
                      </p>
                    </div>
                    {loadingPick === p.id && (
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div ref={sentinelRef} className="h-8" />
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Re-export to avoid unused import warning on TypeBadge in dev builds
export { TypeBadge };
