import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion } from "framer-motion";
import { Plus, X, GripVertical } from "lucide-react";
import { TypeIcon } from "@/components/TypeBadge";
import { TeamAnalysis } from "@/components/TeamAnalysis";
import { OffensiveCoverage } from "@/components/OffensiveCoverage";
import { SuggestTypes } from "@/components/SuggestTypes";
import { useTeamContext, TEAM_SIZE } from "@/context/TeamContext";
import { useBuilds } from "@/hooks/useBuilds";

import { formatName } from "@/lib/pokeapi";
import type { TeamMember } from "@/lib/builds";
import { cn } from "@/lib/utils";

const TeamPage = () => {
  const { team, setTeam } = useTeamContext();
  const { getById } = useBuilds();
  const navigate = useNavigate();
  const isFull = team.length >= TEAM_SIZE;

  useEffect(() => {
    document.title = "Team Builder – Pokénex";
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = team.map((m) => `slot-${m.pokemonId}-${m.buildId}`);
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from === -1 || to === -1) return;
    setTeam(arrayMove(team, from, to));
  };

  const handleRemove = (slot: number) => {
    setTeam((prev) => prev.filter((_, i) => i !== slot));
  };

  const goToPokedex = () => {
    if (isFull) return;
    navigate("/pokedex", { state: { focusSearch: true } });
  };

  const sortableIds = team.map((m) => `slot-${m.pokemonId}-${m.buildId}`);
  const pokemonOnly = team.map((m) => m.pokemon);
  const excludeIds = team.map((m) => m.pokemonId);

  return (
    <>
      <section>
        <h2 className="sr-only">Your Team</h2>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sortableIds} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 gap-2.5">
              {Array.from({ length: TEAM_SIZE }).map((_, i) => {
                const member = team[i];
                const isNextEmpty = !member && i === team.length;
                if (!member) {
                  return (
                    <button
                      key={`empty-${i}`}
                      onClick={isNextEmpty ? goToPokedex : undefined}
                      disabled={!isNextEmpty}
                      className={cn(
                        "group relative aspect-[4/3] rounded-2xl border-2 border-dashed bg-card/40 flex flex-col items-center justify-center gap-1 transition-all",
                        isNextEmpty
                          ? "border-border hover:border-primary hover:bg-card hover:shadow-glow active:scale-95"
                          : "border-border/40 opacity-50 cursor-not-allowed",
                      )}
                      aria-label={isNextEmpty ? `Add to slot ${i + 1}` : `Slot ${i + 1} (locked)`}
                    >
                      <Plus className={cn("h-6 w-6", isNextEmpty ? "text-muted-foreground group-hover:text-primary" : "text-muted-foreground/40")} />
                      <span className="text-[10px] font-medium text-muted-foreground">Slot {i + 1}</span>
                    </button>
                  );
                }
                const build = getById(member.buildId);
                return (
                  <BuildSlot
                    key={`slot-${member.pokemonId}-${member.buildId}`}
                    member={member}
                    buildName={build?.name ?? "No build"}
                    onRemove={() => handleRemove(i)}
                    onOpenDetail={() => navigate(`/pokedex/${member.pokemonId}`)}
                  />
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      </section>

      <section>
        <SuggestTeammate team={pokemonOnly} excludeIds={excludeIds} canAdd={!isFull} />
      </section>

      <section>
        <OffensiveCoverage team={team} />
      </section>

      <section>
        <TeamAnalysis team={pokemonOnly} />
      </section>
    </>
  );
};

interface BuildSlotProps {
  member: TeamMember;
  buildName: string;
  onRemove: () => void;
  onOpenDetail: () => void;
}

const BuildSlot = ({ member, buildName, onRemove, onOpenDetail }: BuildSlotProps) => {
  const sortable = useSortable({
    id: `slot-${member.pokemonId}-${member.buildId}`,
  });
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = sortable;
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

export default TeamPage;
