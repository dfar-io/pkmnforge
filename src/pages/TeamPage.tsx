import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { TeamGrid } from "@/components/TeamGrid";
import { TeamAnalysis } from "@/components/TeamAnalysis";
import { SuggestTeammate } from "@/components/SuggestTeammate";
import { TeamSlotSheet } from "@/components/TeamSlotSheet";
import { useTeamContext, TEAM_SIZE } from "@/context/TeamContext";
import type { PokemonDetail } from "@/lib/pokeapi";
import { useEffect } from "react";

const TeamPage = () => {
  const { team, setTeam, natures, setNature } = useTeamContext();
  const [detailSlot, setDetailSlot] = useState<number | null>(null);
  const navigate = useNavigate();

  const isFull = team.length >= TEAM_SIZE;

  useEffect(() => {
    document.title = "Team Builder – Pokénex";
  }, []);

  const goToPokedex = () => {
    if (isFull) return;
    navigate("/pokedex");
  };

  const handleRemove = (slot: number) => {
    setTeam((prev) => prev.filter((_, i) => i !== slot));
  };

  const excludeIds = team.map((p) => p.id);

  return (
    <>
      <TeamGrid
        team={team}
        teamSize={TEAM_SIZE}
        natures={natures}
        onOpenPicker={goToPokedex}
        onRemove={handleRemove}
        onReorder={setTeam}
        onOpenDetail={(slot) => setDetailSlot(slot)}
      />

      <section>
        <SuggestTeammate
          team={team}
          excludeIds={excludeIds}
          canAdd={!isFull}
        />
      </section>

      <section>
        <TeamAnalysis team={team} />
      </section>

      <TeamSlotSheet
        pokemon={detailSlot !== null ? team[detailSlot] ?? null : null}
        open={detailSlot !== null && !!team[detailSlot]}
        onOpenChange={(open) => {
          if (!open) setDetailSlot(null);
        }}
        selectedNatureId={
          detailSlot !== null && team[detailSlot]
            ? natures[team[detailSlot].id]
            : undefined
        }
        onSelectNature={(natureId) => {
          if (detailSlot === null) return;
          const member = team[detailSlot];
          if (!member) return;
          setNature(member.id, natureId);
        }}
      />
    </>
  );
};

export default TeamPage;
