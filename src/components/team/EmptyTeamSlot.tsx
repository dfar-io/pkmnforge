import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyTeamSlotProps {
  index: number;
  /** True when this is the next slot to fill (clickable). */
  isNext: boolean;
  onClick?: () => void;
}

/**
 * Placeholder tile shown for unfilled team slots. Only the next-empty slot is
 * clickable; subsequent ones are visually disabled to enforce sequential fill.
 */
export const EmptyTeamSlot = ({ index, isNext, onClick }: EmptyTeamSlotProps) => {
  return (
    <button
      onClick={isNext ? onClick : undefined}
      disabled={!isNext}
      className={cn(
        "group relative aspect-[4/3] rounded-2xl border-2 border-dashed bg-card/40 flex flex-col items-center justify-center gap-1 transition-all",
        isNext
          ? "border-border hover:border-primary hover:bg-card hover:shadow-glow active:scale-95"
          : "border-border/40 opacity-50 cursor-not-allowed",
      )}
      aria-label={isNext ? `Add to slot ${index + 1}` : `Slot ${index + 1} (locked)`}
    >
      <Plus
        className={cn(
          "h-6 w-6",
          isNext
            ? "text-muted-foreground group-hover:text-primary"
            : "text-muted-foreground/40",
        )}
      />
      <span className="text-[10px] font-medium text-muted-foreground">
        Slot {index + 1}
      </span>
    </button>
  );
};
