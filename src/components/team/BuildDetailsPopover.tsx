import { Info, Pencil } from "lucide-react";
import { Link } from "react-router-dom";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getNatureById } from "@/lib/natures";
import { formatName } from "@/lib/pokeapi";
import type { PokemonBuild } from "@/lib/builds";

interface BuildDetailsPopoverProps {
  build: PokemonBuild | undefined;
  pokemonId: number;
  pokemonName: string;
}

/**
 * Small info button on a team slot that reveals the build's ability,
 * item, nature, and moves in a compact popover.
 */
export const BuildDetailsPopover = ({ build, pokemonId, pokemonName }: BuildDetailsPopoverProps) => {
  const editHref = build
    ? `/pokemon/${pokemonId}?edit=${encodeURIComponent(build.id)}#builds`
    : `/pokemon/${pokemonId}#builds`;
  const nature = getNatureById(build?.natureId);
  const moves = (build?.moves ?? []).filter(Boolean);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute top-1 left-1 z-20 grid h-6 w-6 place-items-center rounded-full bg-background/80 text-foreground hover:bg-accent transition-colors"
          aria-label={`Show build details for ${pokemonName}`}
        >
          <Info className="h-3.5 w-3.5" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        className="w-60 p-3 text-xs space-y-2"
        onClick={(e) => e.stopPropagation()}
      >
        {!build ? (
          <p className="text-muted-foreground italic">No build assigned.</p>
        ) : (
          <>
            <div>
              <p className="font-display font-bold text-sm truncate">{build.name || "Unnamed build"}</p>
            </div>
            <dl className="space-y-1">
              <Row label="Ability" value={build.ability ? formatName(build.ability) : "—"} />
              <Row label="Item" value={build.item ? formatName(build.item) : "—"} />
              <Row
                label="Nature"
                value={
                  nature
                    ? `${nature.name} (+${nature.up.toUpperCase()} / −${nature.down.toUpperCase()})`
                    : "—"
                }
              />
            </dl>
            <div>
              <p className="text-muted-foreground mb-1">Moves</p>
              {moves.length === 0 ? (
                <p className="italic text-muted-foreground">No moves set.</p>
              ) : (
                <ul className="grid grid-cols-2 gap-x-2 gap-y-0.5">
                  {moves.map((m, i) => (
                    <li key={i} className="truncate">• {formatName(m)}</li>
                  ))}
                </ul>
              )}
            </div>
            {build.notes && (
              <div>
                <p className="text-muted-foreground mb-1">Notes</p>
                <p className="whitespace-pre-wrap text-foreground/90 max-h-24 overflow-auto">
                  {build.notes}
                </p>
              </div>
            )}
          </>
        )}
        <div className="pt-1 border-t border-border">
          <Link
            to={editHref}
            onClick={(e) => e.stopPropagation()}
            className="flex items-center justify-center gap-1.5 w-full rounded-md py-1.5 text-xs font-medium text-primary hover:bg-accent transition-colors"
          >
            <Pencil className="h-3 w-3" />
            {build ? "Edit build" : "Manage builds"}
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-baseline gap-2">
    <dt className="text-muted-foreground w-14 shrink-0">{label}</dt>
    <dd className="truncate font-medium">{value}</dd>
  </div>
);
