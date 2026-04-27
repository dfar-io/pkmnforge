import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Star, ExternalLink } from "lucide-react";
import {
  fetchEvolutionChain,
  fetchPokemonFullDetail,
  formatName,
  type EvolutionNode,
  type PokemonFullDetail,
} from "@/lib/pokeapi";
import { TypeIcon } from "@/components/TypeBadge";
import { TypeMatchups } from "@/components/TypeMatchups";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/hooks/useFavorites";
import { BuildsSection } from "@/components/BuildsSection";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { SmogonTierBadge } from "@/components/SmogonTierBadge";
import { getSmogonTier } from "@/lib/smogon";

const STAT_LABEL: Record<string, string> = {
  hp: "HP",
  attack: "Atk",
  defense: "Def",
  "special-attack": "Sp.Atk",
  "special-defense": "Sp.Def",
  speed: "Speed",
};

const PokemonDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const numId = Number(id);
  const [detail, setDetail] = useState<PokemonFullDetail | null>(null);
  const [evo, setEvo] = useState<EvolutionNode | null>(null);
  const [loading, setLoading] = useState(true);
  const { isFavorite, toggleFavorite } = useFavorites();
  const fav = isFavorite(numId);

  useEffect(() => {
    if (!Number.isInteger(numId) || numId < 1) {
      navigate("/pokedex", { replace: true });
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchPokemonFullDetail(numId)
      .then((d) => {
        if (cancelled) return;
        setDetail(d);
        document.title = `${formatName(d.name)} #${String(d.id).padStart(4, "0")} – Pokénex`;
        return fetchEvolutionChain(d.speciesUrl);
      })
      .then((e) => {
        if (!cancelled && e) setEvo(e);
      })
      .catch((e) => {
        console.error(e);
        toast.error("Couldn't load Pokémon");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [numId, navigate]);

  if (loading || !detail) {
    return (
      <div className="grid place-items-center py-24 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  const total = detail.stats.reduce((acc, s) => acc + s.base, 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
          <Link to="/pokedex">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Pokédex
          </Link>
        </Button>
        <button
          type="button"
          onClick={() => toggleFavorite(detail.id)}
          aria-pressed={fav}
          className={cn(
            "grid place-items-center h-9 w-9 rounded-full transition-colors",
            fav ? "text-favorite" : "text-muted-foreground hover:text-favorite",
          )}
          aria-label={fav ? "Remove from favorites" : "Add to favorites"}
        >
          <Star className={cn("h-5 w-5", fav && "fill-current")} />
        </button>
      </div>

      <div className="rounded-2xl bg-card/60 border border-border/60 p-4 flex items-center gap-4">
        <img
          src={detail.sprite}
          alt={detail.name}
          className="h-28 w-28 object-contain shrink-0"
        />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] text-muted-foreground font-mono">
            #{String(detail.id).padStart(4, "0")}
          </p>
          <h1 className="font-display text-2xl font-extrabold tracking-tight">
            {formatName(detail.name)}
          </h1>
          <div className="flex items-center gap-1 mt-1.5">
            {detail.types.map((t) => (
              <TypeIcon key={t} type={t} />
            ))}
          </div>
          <div className="mt-2 flex items-center gap-3 text-[11px] text-muted-foreground">
            <span>{(detail.height / 10).toFixed(1)} m</span>
            <span>·</span>
            <span>{(detail.weight / 10).toFixed(1)} kg</span>
          </div>
        </div>
      </div>

      <a
        href={`https://www.smogon.com/dex/sv/pokemon/${encodeURIComponent(detail.name.toLowerCase())}/`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card/60 px-3 py-2.5 text-sm font-medium transition-all hover:border-primary hover:bg-card"
      >
        <span className="flex items-center gap-2">
          <ExternalLink className="h-4 w-4 text-primary" />
          View on Smogon
        </span>
        <span className="text-xs text-muted-foreground">smogon.com ↗</span>
      </a>

      <BuildsSection pokemon={detail} />

      <section>
        <h2 className="text-xs font-display font-bold uppercase tracking-wider text-muted-foreground mb-2">
          Base stats
        </h2>
        <div className="space-y-1.5">
          {detail.stats.map((s) => {
            const ratio = Math.min(1, Math.max(0, s.base / 255));
            // Hue interpolation: 0 (red) → 60 (yellow) → 120 (green) → 240 (blue).
            // Stretch the green→blue segment over the top half of the range.
            const hue = ratio <= 0.5 ? ratio * 2 * 120 : 120 + (ratio - 0.5) * 2 * 120;
            return (
              <div key={s.name} className="flex items-center gap-3">
                <span className="text-[11px] font-display font-semibold uppercase tracking-wide w-14 text-muted-foreground">
                  {STAT_LABEL[s.name] ?? s.name}
                </span>
                <span className="text-xs font-mono w-8 text-right">{s.base}</span>
                <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full transition-all"
                    style={{
                      width: `${ratio * 100}%`,
                      backgroundColor: `hsl(${hue} 75% 50%)`,
                    }}
                  />
                </div>
              </div>
            );
          })}
          <div className="flex items-center gap-3 pt-1 border-t border-border/40 mt-1">
            <span className="text-[11px] font-display font-bold uppercase tracking-wide w-14">
              Total
            </span>
            <span className="text-xs font-mono w-8 text-right">{total}</span>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-xs font-display font-bold uppercase tracking-wider text-muted-foreground mb-2">
          Type matchups
        </h2>
        <TypeMatchups types={detail.types} abilities={detail.abilities.map((a) => a.name)} />
      </section>

      <section>
        <h2 className="text-xs font-display font-bold uppercase tracking-wider text-muted-foreground mb-2">
          Abilities
        </h2>
        <ul className="flex flex-wrap gap-1.5">
          {detail.abilities.map((a) => (
            <li
              key={a.name}
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-display font-semibold",
                a.isHidden
                  ? "bg-primary/10 text-primary border border-primary/30"
                  : "bg-secondary/60 text-foreground",
              )}
            >
              {formatName(a.name)}
              {a.isHidden && <span className="ml-1 text-[10px] opacity-70">(hidden)</span>}
            </li>
          ))}
        </ul>
      </section>

      {evo && evo.evolvesTo.length > 0 && (
        <section>
          <h2 className="text-xs font-display font-bold uppercase tracking-wider text-muted-foreground mb-2">
            Evolution
          </h2>
          <EvolutionRow node={evo} />
        </section>
      )}
    </div>
  );
};

const EvolutionRow = ({ node }: { node: EvolutionNode }) => {
  const stages: EvolutionNode[][] = [];
  let current: EvolutionNode[] = [node];
  while (current.length) {
    stages.push(current);
    const next: EvolutionNode[] = [];
    for (const n of current) next.push(...n.evolvesTo);
    current = next;
  }
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-1">
      {stages.map((stage, i) => (
        <div key={i} className="flex items-center gap-2">
          {i > 0 && <span className="text-muted-foreground text-sm shrink-0">→</span>}
          <div className="flex flex-col gap-1.5">
            {stage.map((n) => (
              <Link
                key={n.id}
                to={`/pokedex/${n.id}`}
                className="flex items-center gap-2 rounded-lg bg-secondary/60 hover:bg-secondary px-2 py-1.5 transition-colors"
              >
                <img
                  src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${n.id}.png`}
                  alt=""
                  className="h-10 w-10 object-contain"
                  loading="lazy"
                />
                <div className="text-left">
                  <p className="text-[10px] font-mono text-muted-foreground">
                    #{String(n.id).padStart(4, "0")}
                  </p>
                  <p className="text-xs font-display font-semibold">{formatName(n.name)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default PokemonDetailPage;
