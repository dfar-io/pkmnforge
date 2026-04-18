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
