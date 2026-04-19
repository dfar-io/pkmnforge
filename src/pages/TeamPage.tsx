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
} from "@dnd-kit/sortable";
import { TeamAnalysis } from "@/components/TeamAnalysis";
import { OffensiveCoverage } from "@/components/OffensiveCoverage";
import { SuggestTypes } from "@/components/SuggestTypes";
import { BuildSlot } from "@/components/team/BuildSlot";
import { EmptyTeamSlot } from "@/components/team/EmptyTeamSlot";
import { useTeamContext, TEAM_SIZE } from "@/context/TeamContext";
import { useBuilds } from "@/hooks/useBuilds";

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

  return (
    <>
      <section>
        <h2 className="sr-only">Your Team</h2>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sortableIds} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 gap-2.5">
              {Array.from({ length: TEAM_SIZE }).map((_, i) => {
                const member = team[i];
                if (!member) {
                  return (
                    <EmptyTeamSlot
                      key={`empty-${i}`}
                      index={i}
                      isNext={i === team.length}
                      onClick={goToPokedex}
                    />
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
        <SuggestTypes team={pokemonOnly} />
      </section>

      <section>
        <TeamAnalysis team={pokemonOnly} />
      </section>

      <section>
        <OffensiveCoverage team={team} />
      </section>
    </>
  );
};

export default TeamPage;
