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
import { BuildSlot } from "@/components/team/BuildSlot";
import { EmptyTeamSlot } from "@/components/team/EmptyTeamSlot";
import type { PokemonBuild, TeamMember } from "@/lib/builds";

interface TeamGridProps {
  team: TeamMember[];
  teamSize: number;
  /** Resolve a build id → display name. */
  getBuildName: (buildId: string) => string;
  /** Resolve a build id → full build object (for details popover). */
  getBuild: (buildId: string) => PokemonBuild | undefined;
  onAddSlot: () => void;
  onRemove: (slot: number) => void;
  onReorder: (next: TeamMember[]) => void;
  onOpenDetail: (pokemonId: number) => void;
}

const slotKey = (m: TeamMember) => `slot-${m.pokemonId}-${m.buildId}`;

/**
 * Drag-and-drop reorderable team grid. Renders a fixed `teamSize` grid where
 * filled slots are sortable BuildSlots and empty slots are EmptyTeamSlot
 * placeholders (only the next empty one is enabled).
 */
export const TeamGrid = ({
  team,
  teamSize,
  getBuildName,
  getBuild,
  onAddSlot,
  onRemove,
  onReorder,
  onOpenDetail,
}: TeamGridProps) => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = team.map(slotKey);
    const from = ids.indexOf(String(active.id));
    const to = ids.indexOf(String(over.id));
    if (from === -1 || to === -1) return;
    onReorder(arrayMove(team, from, to));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={team.map(slotKey)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-2 gap-2.5">
          {Array.from({ length: teamSize }).map((_, i) => {
            const member = team[i];
            if (!member) {
              return (
                <EmptyTeamSlot
                  key={`empty-${i}`}
                  index={i}
                  isNext={i === team.length}
                  onClick={onAddSlot}
                />
              );
            }
            return (
              <BuildSlot
                key={slotKey(member)}
                member={member}
                build={getBuild(member.buildId)}
                buildName={getBuildName(member.buildId)}
                onRemove={() => onRemove(i)}
                onOpenDetail={() => onOpenDetail(member.pokemonId)}
              />
            );
          })}
        </div>
      </SortableContext>
    </DndContext>
  );
};
