import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { TypeIcon } from "@/components/TypeBadge";
import { formatName, type PokemonDetail } from "@/lib/pokeapi";
import { NATURES, STAT_LABEL, getNatureById, type Nature } from "@/lib/natures";
import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp, ExternalLink } from "lucide-react";

// Smogon dex slugs are the lowercase species name. PokéAPI returns names in
// the same lowercased + hyphenated form Smogon uses for most regular forms
// (e.g. "tapu-koko", "mr-mime"), so a direct passthrough works for the vast
// majority of Gen 1–9 species without per-species mapping.
const smogonUrl = (name: string) =>
  `https://www.smogon.com/dex/sv/pokemon/${encodeURIComponent(name.toLowerCase())}/`;

interface TeamSlotSheetProps {
  pokemon: PokemonDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedNatureId: string | undefined;
  onSelectNature: (natureId: string | null) => void;
}

// Detail sheet for a single team slot. Currently scoped to nature selection,
// but the layout is intentionally roomy so future per-slot settings (held
// item, ability, EVs) can be appended without restructuring.
export const TeamSlotSheet = ({
  pokemon,
  open,
  onOpenChange,
  selectedNatureId,
  onSelectNature,
}: TeamSlotSheetProps) => {
  const selected = getNatureById(selectedNatureId);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
        {pokemon && (
          <>
            <SheetHeader className="text-left">
              <div className="flex items-center gap-3">
                <img
                  src={pokemon.sprite}
                  alt={pokemon.name}
                  className="h-14 w-14 object-contain"
                  loading="lazy"
                />
                <div className="min-w-0 flex-1">
                  <SheetTitle className="font-display text-xl truncate">
                    {formatName(pokemon.name)}
                  </SheetTitle>
                  <div className="flex items-center gap-1 mt-1">
                    {pokemon.types.map((t) => (
                      <TypeIcon key={t} type={t} />
                    ))}
                  </div>
                </div>
              </div>
              <SheetDescription>
                Pick a nature to track this Pokémon's stat preferences.
                {selected && (
                  <span className="block mt-1 text-foreground/80">
                    <span className="text-success">+{STAT_LABEL[selected.up]}</span>
                    {" / "}
                    <span className="text-destructive">−{STAT_LABEL[selected.down]}</span>
                  </span>
                )}
              </SheetDescription>
            </SheetHeader>

            <div className="mt-4">
              <a
                href={smogonUrl(pokemon.name)}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "flex items-center justify-between gap-2 rounded-lg border border-border bg-card/60 px-3 py-2.5",
                  "text-sm font-medium transition-all hover:border-primary hover:bg-card hover:shadow-glow",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                )}
              >
                <span className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4 text-primary" />
                  View on Smogon
                </span>
                <span className="text-xs text-muted-foreground">smogon.com ↗</span>
              </a>
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-display font-bold uppercase tracking-wider text-muted-foreground">
                  Nature
                </h3>
                {selected && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-muted-foreground hover:text-destructive"
                    onClick={() => onSelectNature(null)}
                  >
                    Clear
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {NATURES.map((n) => (
                  <NatureButton
                    key={n.id}
                    nature={n}
                    selected={n.id === selectedNatureId}
                    onClick={() => onSelectNature(n.id)}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

interface NatureButtonProps {
  nature: Nature;
  selected: boolean;
  onClick: () => void;
}

const NatureButton = ({ nature, selected, onClick }: NatureButtonProps) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={selected}
    className={cn(
      "rounded-lg border px-2.5 py-2 text-left transition-all",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      selected
        ? "border-primary bg-primary/10 shadow-glow"
        : "border-border bg-card/60 hover:border-primary/50 hover:bg-card",
    )}
  >
    <div className={cn("text-sm font-display font-bold", selected && "text-primary")}>
      {nature.name}
    </div>
    <div className="mt-1 flex items-center gap-1 text-[10px] font-medium">
      <span className="inline-flex items-center gap-0.5 text-success">
        <ArrowUp className="h-2.5 w-2.5" />
        {STAT_LABEL[nature.up]}
      </span>
      <span className="text-muted-foreground/50">·</span>
      <span className="inline-flex items-center gap-0.5 text-destructive">
        <ArrowDown className="h-2.5 w-2.5" />
        {STAT_LABEL[nature.down]}
      </span>
    </div>
  </button>
);
