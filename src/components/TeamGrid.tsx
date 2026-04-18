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
} from "@dnd-kit/sortable";
import { TeamSlot } from "@/components/TeamSlot";
import type { PokemonDetail } from "@/lib/pokeapi";
import { POKEMON_TYPES, classify, getMultiplier } from "@/lib/pokemon-types";
import { useMemo } from "react";

interface TeamGridProps {
  team: PokemonDetail[];
  teamSize: number;
  onOpenPicker: () => void;
  onRemove: (slot: number) => void;
  onReorder: (next: PokemonDetail[]) => void;
}

export const TeamGrid = ({ team, teamSize, onOpenPicker, onRemove, onReorder }: TeamGridProps) => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // IDs of team members involved in any 3+ shared weakness.
  const criticalMemberIds = useMemo(() => {
    const ids = new Set<number>();
    for (const attacker of POKEMON_TYPES) {
      const weakOnes = team.filter(
        (m) => classify(getMultiplier(attacker, m.types)) === "weak",
      );
      if (weakOnes.length >= 3) {
        for (const m of weakOnes) ids.add(m.id);
      }
    }
    return ids;
  }, [team]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = team.map((p) => `pkm-${p.id}`);
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from === -1 || to === -1) return;
    onReorder(arrayMove(team, from, to));
  };

  const sortableIds = team.map((p) => `pkm-${p.id}`);

  return (
    <section>
      <h2 className="sr-only">Your Team</h2>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={sortableIds} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
            {Array.from({ length: teamSize }).map((_, i) => {
              const member = team[i];
              const isNextEmpty = !member && i === team.length;
              return (
                <TeamSlot
                  key={member ? `pkm-${member.id}` : `empty-${i}`}
                  pokemon={member}
                  index={i}
                  onAdd={isNextEmpty ? onOpenPicker : () => {}}
                  onRemove={() => onRemove(i)}
                  isCritical={member ? criticalMemberIds.has(member.id) : false}
                  disabled={!member && !isNextEmpty}
                />
              );
            })}
          </div>
        </SortableContext>
      </DndContext>
    </section>
  );
};
