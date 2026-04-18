import { cn } from "@/lib/utils";
import { TYPE_LABEL, type PokemonType } from "@/lib/pokemon-types";
import { TYPE_ICONS } from "./type-icons";

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

/**
 * Compact circular type indicator using a custom SVG glyph.
 * Use when horizontal space is too tight for the text `TypeBadge`
 * (e.g. inside team slots on mobile).
 */
export const TypeIcon = ({ type, className }: TypeIconProps) => {
  const Glyph = TYPE_ICONS[type];
  return (
    <span
      className={cn(
        "inline-grid place-items-center rounded-full text-primary-foreground shadow-sm ring-1 ring-background/60",
        "h-5 w-5",
        `bg-type-${type}`,
        className,
      )}
      title={TYPE_LABEL[type]}
      aria-label={TYPE_LABEL[type]}
      role="img"
    >
      <Glyph className="h-3 w-3" />
    </span>
  );
};
