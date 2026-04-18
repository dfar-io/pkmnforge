import { motion } from "framer-motion";
import { X, Plus, GripVertical } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TypeIcon } from "./TypeBadge";
import { formatName, type PokemonDetail } from "@/lib/pokeapi";
import { cn } from "@/lib/utils";

interface TeamSlotProps {
  pokemon?: PokemonDetail;
  onAdd: () => void;
  onRemove: () => void;
  index: number;
  isCritical?: boolean;
  disabled?: boolean;
}

export const TeamSlot = ({ pokemon, onAdd, onRemove, index, isCritical, disabled }: TeamSlotProps) => {
  // Hooks must run unconditionally — call useSortable even for empty slots.
  // Empty slots use a stable, non-overlapping id and disabled=true so they
  // never participate in drag/sort behavior.
  const sortable = useSortable({
    id: pokemon ? `pkm-${pokemon.id}` : `empty-${index}`,
    disabled: !pokemon,
  });

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = sortable;

  if (!pokemon) {
    return (
      <button
        ref={setNodeRef}
        onClick={onAdd}
        disabled={disabled}
        className={cn(
          "group relative aspect-square rounded-2xl border-2 border-dashed bg-card/40",
          "flex flex-col items-center justify-center gap-1 transition-all",
          disabled
            ? "border-border/40 opacity-50 cursor-not-allowed"
            : "border-border hover:border-primary hover:bg-card hover:shadow-glow active:scale-95",
        )}
        aria-label={disabled ? `Slot ${index + 1} (locked)` : `Add Pokémon to slot ${index + 1} (shortcut: N)`}
      >
        <Plus className={cn("h-6 w-6 transition-colors", disabled ? "text-muted-foreground/40" : "text-muted-foreground group-hover:text-primary")} />
        <span className="text-[10px] font-medium text-muted-foreground">Slot {index + 1}</span>
        {!disabled && (
          <kbd className="mt-0.5 hidden sm:inline-flex items-center gap-0.5 rounded border border-border bg-background/60 px-1 py-px text-[9px] font-mono text-muted-foreground/80 group-hover:text-primary">
            N
          </kbd>
        )}
      </button>
    );
  }

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, scale: 0.8, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 22 }}
      className={cn(
        "relative aspect-square rounded-2xl bg-gradient-card shadow-card overflow-hidden touch-none",
        isCritical &&
          "ring-2 ring-destructive ring-offset-2 ring-offset-background animate-pulse-danger",
        isDragging && "z-30 shadow-glow scale-105 cursor-grabbing",
      )}
    >
      {isCritical && (
        <span
          className="absolute top-1 left-1 z-10 px-1.5 py-0.5 rounded-full bg-destructive text-destructive-foreground text-[8px] font-display font-bold uppercase tracking-wider pointer-events-none"
          title="Part of a critical shared weakness"
        >
          Risk
        </span>
      )}
      <button
        onClick={onRemove}
        className="absolute top-1 right-1 z-20 grid h-6 w-6 place-items-center rounded-full bg-background/80 text-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors"
        aria-label={`Remove ${pokemon.name}`}
      >
        <X className="h-3.5 w-3.5" />
      </button>

      {/* Drag handle — covers the body of the card but sits below the remove button. */}
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="absolute inset-0 z-10 cursor-grab active:cursor-grabbing focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-2xl"
        aria-label={`Reorder ${pokemon.name}`}
      />

      <img
        src={pokemon.sprite}
        alt={pokemon.name}
        className="absolute inset-0 h-full w-full object-contain p-1 drop-shadow-lg pointer-events-none"
        loading="lazy"
      />
      <div className="absolute bottom-0 inset-x-0 px-1 pb-1.5 pt-1.5 bg-gradient-to-t from-background/95 via-background/70 to-transparent pointer-events-none">
        <p className="truncate text-[10px] font-display font-semibold text-center mb-1">
          {formatName(pokemon.name)}
        </p>
        <div className="flex items-center justify-center gap-1">
          {pokemon.types.map((t) => (
            <TypeIcon key={t} type={t} />
          ))}
        </div>
      </div>

      {/* Subtle grip hint at bottom-right corner */}
      <GripVertical className="absolute bottom-1 right-1 h-3 w-3 text-muted-foreground/40 pointer-events-none" />
    </motion.div>
  );
};
