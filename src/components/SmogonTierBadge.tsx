import {
  getSmogonTier,
  TIER_BADGE_CLASS,
  TIER_LABEL,
  type SmogonTier,
} from "@/lib/smogon";
import { cn } from "@/lib/utils";

interface SmogonTierBadgeProps {
  pokemonId: number;
  className?: string;
  /** Force a tier instead of looking up by id. */
  tier?: SmogonTier | null;
}

/**
 * Compact colored chip showing the Pokémon's Gen 9 Smogon Singles tier.
 * Renders nothing when no tier is known.
 */
export const SmogonTierBadge = ({ pokemonId, className, tier }: SmogonTierBadgeProps) => {
  const t = tier ?? getSmogonTier(pokemonId);
  if (!t) return null;
  return (
    <span
      title={`Smogon Gen 9 Singles: ${TIER_LABEL[t]}`}
      className={cn(
        "inline-flex items-center rounded-md px-1.5 py-0.5 text-[9px] font-display font-bold uppercase tracking-wider text-tier-foreground shrink-0",
        TIER_BADGE_CLASS[t],
        className,
      )}
    >
      {t}
    </span>
  );
};
