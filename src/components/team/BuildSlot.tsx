import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { GripVertical, X } from "lucide-react";
import { TypeBadge } from "@/components/TypeBadge";
import { formatName } from "@/lib/pokeapi";
import { getNatureById } from "@/lib/natures";
import type { PokemonBuild, TeamMember } from "@/lib/builds";
import { cn } from "@/lib/utils";

interface BuildSlotProps {
  member: TeamMember;
  build: PokemonBuild | undefined;
  buildName: string;
  onRemove: () => void;
  onOpenDetail: () => void;
}

/**
 * Sortable team-slot tile. The full surface is a drag handle that opens the
 * Pokémon detail on click; the corner X removes the member.
 */
export const BuildSlot = ({ member, build, buildName, onRemove, onOpenDetail }: BuildSlotProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: `slot-${member.pokemonId}-${member.buildId}` });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const nature = getNatureById(build?.natureId);
  const moves = (build?.moves ?? []).filter(Boolean);

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, scale: 0.85, y: 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 22 }}
      className={cn(
        "relative rounded-2xl bg-gradient-card shadow-card overflow-hidden touch-none",
        isDragging && "z-30 shadow-glow scale-105 cursor-grabbing",
      )}
    >
      <button
        onClick={onRemove}
        className="absolute top-1 right-1 z-20 grid h-6 w-6 place-items-center rounded-full bg-background/80 text-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors"
        aria-label={`Remove ${member.pokemon.name}`}
      >
        <X className="h-3.5 w-3.5" />
      </button>

      <button
        type="button"
        {...attributes}
        {...listeners}
        onClick={onOpenDetail}
        className="absolute inset-0 z-10 cursor-grab active:cursor-grabbing focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-2xl"
        aria-label={`Open details for ${member.pokemon.name}`}
      />

      <div className="relative flex items-start gap-2.5 p-2.5 pl-3 pr-8 min-h-[96px]">
        <img
          src={member.pokemon.sprite}
          alt={member.pokemon.name}
          className="h-18 w-18 shrink-0 object-contain drop-shadow-lg pointer-events-none mt-0.5"
          loading="lazy"
        />
        <div className="min-w-0 flex-1 flex flex-col gap-1.5">
          {/* Pokemon name + types */}
          <div className="flex items-center gap-1.5 min-w-0">
            <p className="truncate text-sm font-display font-bold text-foreground leading-tight">
              {formatName(member.pokemon.name)}
            </p>
            <div className="flex items-center gap-0.5 shrink-0">
              {member.pokemon.types.map((t) => (
                <TypeBadge key={t} type={t} size="sm" />
              ))}
            </div>
          </div>

          {/* Build name */}
          <p className="truncate text-[13px] font-display font-semibold text-primary leading-none">
            {buildName}
          </p>

          {/* Moves */}
          <ul className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px]">
            {[0, 1, 2, 3].map((i) => {
              const m = moves[i];
              return (
                <li key={i} className="truncate text-foreground/90">
                  {m ? `${i + 1}. ${formatName(m)}` : <span className="text-muted-foreground/60">{i + 1}. —</span>}
                </li>
              );
            })}
          </ul>

          {/* Item / Ability / Nature badges */}
          <div className="flex flex-wrap items-center gap-1 mt-0.5">
            {build?.item && (
              <span className="inline-flex items-center rounded-full bg-secondary/60 px-1.5 py-px text-[9px] text-muted-foreground truncate max-w-[7rem]">
                @ {formatName(build.item)}
              </span>
            )}
            {build?.ability && (
              <span className="inline-flex items-center rounded-full bg-secondary/60 px-1.5 py-px text-[9px] text-muted-foreground truncate max-w-[7rem]">
                {formatName(build.ability)}
              </span>
            )}
            {nature && (
              <span className="inline-flex items-center rounded-full bg-primary/10 px-1.5 py-px text-[9px] text-primary truncate">
                {nature.name}
              </span>
            )}
          </div>
        </div>
      </div>

      <GripVertical className="absolute bottom-1 right-1 h-3 w-3 text-muted-foreground/40 pointer-events-none" />
    </motion.div>
  );
};
