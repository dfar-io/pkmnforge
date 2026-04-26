import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TeamAnalysis } from "@/components/TeamAnalysis";
import { OffensiveCoverage } from "@/components/OffensiveCoverage";
import { SuggestTypes } from "@/components/SuggestTypes";
import { TeamGrid } from "@/components/TeamGrid";
import { useTeamContext, TEAM_SIZE } from "@/context/TeamContext";
import { useBuilds } from "@/hooks/useBuilds";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const TeamPage = () => {
  const { team, setTeam } = useTeamContext();
  const { getById } = useBuilds();
  const navigate = useNavigate();
  const isFull = team.length >= TEAM_SIZE;

  useEffect(() => {
    document.title = "Team Builder – Pokénex";
  }, []);

  const goToPokedex = () => {
    if (isFull) return;
    navigate("/pokedex", { state: { focusSearch: true } });
  };

  const pokemonOnly = team.map((m) => m.pokemon);

  return (
    <>
      <section>
        <h2 className="sr-only">Your Team</h2>
        <TeamGrid
          team={team}
          teamSize={TEAM_SIZE}
          getBuildName={(id) => getById(id)?.name ?? "No build"}
          getBuild={(id) => getById(id)}
          onAddSlot={goToPokedex}
          onRemove={(slot) => setTeam((prev) => prev.filter((_, i) => i !== slot))}
          onReorder={(next) => setTeam(next)}
          onOpenDetail={(pokemonId) => navigate(`/pokedex/${pokemonId}`)}
        />
      </section>

      {team.length > 0 && (
        <Tabs defaultValue={isFull ? "defensive" : "suggest"} className="w-full">
          <TabsList className="w-full sticky top-0 z-30 md:static">
            {!isFull && (
              <TabsTrigger value="suggest" className="flex-1">Suggested Types</TabsTrigger>
            )}
            <TabsTrigger value="defensive" className="flex-1">Defensive</TabsTrigger>
            <TabsTrigger value="offensive" className="flex-1">Offensive</TabsTrigger>
          </TabsList>
          {!isFull && (
            <TabsContent value="suggest">
              <SuggestTypes team={pokemonOnly} />
            </TabsContent>
          )}
          <TabsContent value="defensive">
            <TeamAnalysis
              team={team}
              onRemove={(pokemonId) =>
                setTeam((prev) => {
                  const idx = prev.findIndex((m) => m.pokemon.id === pokemonId);
                  return idx === -1 ? prev : prev.filter((_, i) => i !== idx);
                })
              }
            />
          </TabsContent>
          <TabsContent value="offensive">
            <OffensiveCoverage team={team} />
          </TabsContent>
        </Tabs>
      )}
    </>
  );
};

export default TeamPage;
