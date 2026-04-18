import { motion } from "framer-motion";
import { X, Plus } from "lucide-react";
import { TypeBadge } from "./TypeBadge";
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
  if (!pokemon) {
    return (
      <button
        onClick={onAdd}
        disabled={disabled}
        className={cn(
          "group relative aspect-square rounded-2xl border-2 border-dashed bg-card/40",
          "flex flex-col items-center justify-center gap-1 transition-all",
          disabled
            ? "border-border/40 opacity-50 cursor-not-allowed"
            : "border-border hover:border-primary hover:bg-card hover:shadow-glow active:scale-95",
        )}
        aria-label={disabled ? `Slot ${index + 1} (locked)` : `Add Pokémon to slot ${index + 1}`}
      >
        <Plus className={cn("h-6 w-6 transition-colors", disabled ? "text-muted-foreground/40" : "text-muted-foreground group-hover:text-primary")} />
        <span className="text-[10px] font-medium text-muted-foreground">Slot {index + 1}</span>
      </button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 22 }}
      className={cn(
        "relative aspect-square rounded-2xl bg-gradient-card shadow-card overflow-hidden",
        isCritical &&
          "ring-2 ring-destructive ring-offset-2 ring-offset-background animate-pulse-danger",
      )}
    >
      {isCritical && (
        <span
          className="absolute top-1 left-1 z-10 px-1.5 py-0.5 rounded-full bg-destructive text-destructive-foreground text-[8px] font-display font-bold uppercase tracking-wider"
          title="Part of a critical shared weakness"
        >
          Risk
        </span>
      )}
      <button
        onClick={onRemove}
        className="absolute top-1 right-1 z-10 grid h-6 w-6 place-items-center rounded-full bg-background/80 text-foreground hover:bg-destructive hover:text-destructive-foreground transition-colors"
        aria-label={`Remove ${pokemon.name}`}
      >
        <X className="h-3.5 w-3.5" />
      </button>
      <img
        src={pokemon.sprite}
        alt={pokemon.name}
        className="absolute inset-0 h-full w-full object-contain p-1 drop-shadow-lg"
        loading="lazy"
      />
      <div className="absolute bottom-0 inset-x-0 p-1.5 bg-gradient-to-t from-background/95 via-background/70 to-transparent">
        <p className="truncate text-[10px] font-display font-semibold text-center mb-1">
          {formatName(pokemon.name)}
        </p>
        <div className="flex items-center justify-center gap-1">
          {pokemon.types.map((t) => (
            <TypeBadge key={t} type={t} size="sm" />
          ))}
        </div>
      </div>
    </motion.div>
  );
};
