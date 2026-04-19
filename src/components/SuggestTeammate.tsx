import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Lightbulb, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TypeBadge } from "./TypeBadge";
import {
  fetchPokemonDetail,
  fetchPokemonList,
  formatName,
  type PokemonDetail,
} from "@/lib/pokeapi";
import {
  getTeamThreats,
  scoreCandidate,
  type Suggestion,
} from "@/lib/suggest";
import { TYPE_LABEL } from "@/lib/pokemon-types";

interface SuggestTeammateProps {
  team: PokemonDetail[];
  excludeIds: number[];
  canAdd: boolean;
}

// How many random candidates to evaluate per run. Keeps the network bounded.
const SAMPLE_SIZE = 80;
const TOP_N = 5;

export const SuggestTeammate = ({
  team,
  excludeIds,
  canAdd,
}: SuggestTeammateProps) => {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const threats = useMemo(() => getTeamThreats(team), [team]);

  // Reset suggestions whenever team changes — they're stale.
  useEffect(() => {
    setSuggestions(null);
    setError(null);
  }, [team]);

  const handleSuggest = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await fetchPokemonList();
      const pool = list.filter((p) => !excludeIds.includes(p.id));
      // Random sample to keep PokéAPI calls manageable.
      const shuffled = [...pool].sort(() => Math.random() - 0.5);
      const sample = shuffled.slice(0, SAMPLE_SIZE);
      const details = await Promise.all(
        sample.map((p) =>
          fetchPokemonDetail(p.id).catch(() => null),
        ),
      );
      const scored = details
        .filter((d): d is PokemonDetail => Boolean(d))
        .map((d) => scoreCandidate(d, threats))
        .filter((s) => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, TOP_N);
      setSuggestions(scored);
    } catch (e) {
      console.error(e);
      setError("Couldn't fetch suggestions. Try again.");
    } finally {
      setLoading(false);
    }
  };

  if (team.length === 0) return null;

  return (
    <div className="rounded-2xl bg-card shadow-card p-4">
      <div className="flex items-center justify-between mb-3 gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-primary/15 text-primary shrink-0">
            <Lightbulb className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h2 className="font-display font-bold text-base leading-tight">
              Suggest a teammate
            </h2>
            <p className="text-[10px] text-muted-foreground">
              Fills your biggest weakness gaps
            </p>
          </div>
        </div>
        <Button
          size="sm"
          onClick={handleSuggest}
          disabled={loading || !canAdd || threats.length === 0}
          className="font-display font-bold shrink-0"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Scanning…
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              {suggestions ? "Refresh" : "Suggest"}
            </>
          )}
        </Button>
      </div>

      {!canAdd && (
        <p className="text-xs text-muted-foreground italic">
          Your team is full — remove a Pokémon to swap in a suggestion.
        </p>
      )}

      {threats.length === 0 && canAdd && (
        <p className="text-xs text-muted-foreground italic">
          No notable weaknesses yet. Add more team members to get tailored picks.
        </p>
      )}

      {error && (
        <p className="text-xs text-destructive mt-2">{error}</p>
      )}

      <AnimatePresence mode="popLayout">
        {suggestions && suggestions.length > 0 && (
          <motion.ul
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-3 space-y-2"
          >
            {suggestions.map((s, idx) => (
              <motion.li
                key={s.pokemon.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="flex items-center gap-3 rounded-xl bg-secondary/60 p-2.5"
              >
                <img
                  src={s.pokemon.sprite}
                  alt={s.pokemon.name}
                  loading="lazy"
                  className="h-12 w-12 object-contain shrink-0 drop-shadow"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-display font-bold truncate">
                      {formatName(s.pokemon.name)}
                    </p>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      #{String(s.pokemon.id).padStart(4, "0")}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    {s.pokemon.types.map((t) => (
                      <TypeBadge key={t} type={t} size="sm" />
                    ))}
                  </div>
                  {s.covers.length > 0 && (
                    <p className="text-[10px] text-success mt-1 leading-snug">
                      Covers:{" "}
                      <span className="text-foreground/80">
                        {s.covers.map((t) => TYPE_LABEL[t]).join(", ")}
                      </span>
                    </p>
                  )}
                  {s.alsoWeakTo.length > 0 && (
                    <p className="text-[10px] text-warning leading-snug">
                      Shares weakness:{" "}
                      <span className="text-foreground/80">
                        {s.alsoWeakTo.map((t) => TYPE_LABEL[t]).join(", ")}
                      </span>
                    </p>
                  )}
                </div>
                <Button
                  asChild
                  size="icon"
                  variant="ghost"
                  className="h-9 w-9 shrink-0 rounded-full text-muted-foreground hover:text-primary"
                >
                  <Link
                    to={`/pokedex/${s.pokemon.id}`}
                    aria-label={`View ${s.pokemon.name} in Pokédex`}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {suggestions && suggestions.length === 0 && (
        <p className="text-xs text-muted-foreground mt-2 italic">
          No strong picks in this sample. Try refreshing for another batch.
        </p>
      )}
    </div>
  );
};
