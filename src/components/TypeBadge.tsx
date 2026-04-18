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
      "inline-flex items-center justify-center rounded-full font-display font-semibold uppercase tracking-wider text-primary-foreground shadow-sm",
      size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
      `bg-type-${type}`,
      className,
    )}
  >
    {TYPE_LABEL[type]}
  </span>
);
