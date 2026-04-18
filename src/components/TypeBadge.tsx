import { cn } from "@/lib/utils";
import { TYPE_LABEL, type PokemonType } from "@/lib/pokemon-types";

interface TypeBadgeProps {
  type: PokemonType;
  size?: "sm" | "md";
  className?: string;
}

export const TypeBadge = ({ type, size = "md", className }: TypeBadgeProps) => (
  <span
    className={cn(
      "inline-flex items-center justify-center rounded-full font-display font-semibold uppercase text-primary-foreground shadow-sm whitespace-nowrap",
      size === "sm"
        ? "px-1.5 py-0.5 text-[9px] tracking-wide"
        : "px-2.5 py-1 text-xs tracking-wider",
      `bg-type-${type}`,
      className,
    )}
  >
    {TYPE_LABEL[type]}
  </span>
);

interface TypeIconProps {
  type: PokemonType;
  className?: string;
}

// Disambiguates types sharing a first letter so the single-letter glyph stays readable.
const TYPE_GLYPH: Record<PokemonType, string> = {
  normal: "N",
  fire: "Fi",
  water: "W",
  electric: "E",
  grass: "G",
  ice: "I",
  fighting: "Ft",
  poison: "P",
  ground: "Gd",
  flying: "Fl",
  psychic: "Ps",
  bug: "B",
  rock: "R",
  ghost: "Gh",
  dragon: "D",
  dark: "Dk",
  steel: "S",
  fairy: "Fa",
};

/**
 * Compact circular type indicator. Use when horizontal space is too tight
 * for the text `TypeBadge` (e.g. inside team slots on mobile).
 */
export const TypeIcon = ({ type, className }: TypeIconProps) => (
  <span
    className={cn(
      "inline-grid place-items-center rounded-full text-primary-foreground font-display font-bold shadow-sm ring-1 ring-background/60",
      "h-4 w-4 text-[8px] leading-none",
      `bg-type-${type}`,
      className,
    )}
    title={TYPE_LABEL[type]}
    aria-label={TYPE_LABEL[type]}
  >
    {TYPE_GLYPH[type]}
  </span>
);
