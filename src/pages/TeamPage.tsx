import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { TeamAnalysis } from "@/components/TeamAnalysis";
import { OffensiveCoverage } from "@/components/OffensiveCoverage";
import { SuggestTypes } from "@/components/SuggestTypes";
import { TeamGrid } from "@/components/TeamGrid";
import { SavedTeamsMenu } from "@/components/SavedTeamsMenu";
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

  const goToPokedex = () => {
    if (isFull) return;
    navigate("/pokedex", { state: { focusSearch: true } });
  };

  const pokemonOnly = team.map((m) => m.pokemon);

  return (
    <>
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="sr-only">Your Team</h2>
          <SavedTeamsMenu
            team={pokemonOnly}
            onLoad={(members) =>
              setTeam(
                members.slice(0, TEAM_SIZE).map((p) => ({
                  pokemonId: p.id,
                  buildId: "",
                  pokemon: p,
                })),
              )
            }
          />
        </div>
        <TeamGrid
          team={team}
          teamSize={TEAM_SIZE}
          getBuildName={(id) => getById(id)?.name ?? "No build"}
          onAddSlot={goToPokedex}
          onRemove={(slot) => setTeam((prev) => prev.filter((_, i) => i !== slot))}
          onReorder={(next) => setTeam(next)}
          onOpenDetail={(pokemonId) => navigate(`/pokedex/${pokemonId}`)}
        />
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
