import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { GripVertical, X } from "lucide-react";
import { TypeIcon } from "@/components/TypeBadge";
import { formatName } from "@/lib/pokeapi";
import type { TeamMember } from "@/lib/builds";
import { cn } from "@/lib/utils";

interface BuildSlotProps {
  member: TeamMember;
  buildName: string;
  onRemove: () => void;
  onOpenDetail: () => void;
}

/**
 * Sortable team-slot tile. The full surface is a drag handle that opens the
 * Pokémon detail on click; the corner X removes the member.
 */
export const BuildSlot = ({ member, buildName, onRemove, onOpenDetail }: BuildSlotProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: `slot-${member.pokemonId}-${member.buildId}` });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, scale: 0.85, y: 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 22 }}
      className={cn(
        "relative aspect-[4/3] rounded-2xl bg-gradient-card shadow-card overflow-hidden touch-none",
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

      <img
        src={member.pokemon.sprite}
        alt={member.pokemon.name}
        className="absolute inset-0 h-full w-full object-contain p-1 drop-shadow-lg pointer-events-none opacity-70"
        loading="lazy"
      />

      <div className="absolute bottom-0 inset-x-0 px-1 pb-1.5 pt-3 bg-gradient-to-t from-background via-background/90 to-transparent pointer-events-none">
        <p className="truncate text-[11px] font-display font-bold text-center text-foreground [text-shadow:0_1px_2px_hsl(var(--background))]">
          {formatName(member.pokemon.name)}
        </p>
        <p className="truncate text-[9px] text-center text-muted-foreground italic">
          {buildName}
        </p>
        <div className="flex items-center justify-center gap-1 mt-1">
          {member.pokemon.types.map((t) => (
            <TypeIcon key={t} type={t} />
          ))}
        </div>
      </div>

      <GripVertical className="absolute bottom-1 right-1 h-3 w-3 text-muted-foreground/40 pointer-events-none" />
    </motion.div>
  );
};
