import { createContext, useContext, type ReactNode } from "react";

import { useTeam } from "@/hooks/useTeam";

export const TEAM_SIZE = 6;

type TeamCtx = ReturnType<typeof useTeam>;

const Ctx = createContext<TeamCtx | null>(null);

export const TeamProvider = ({ children }: { children: ReactNode }) => {
  const value = useTeam(TEAM_SIZE);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useTeamContext = (): TeamCtx => {
  const v = useContext(Ctx);
  if (!v) throw new Error("useTeamContext must be used within TeamProvider");
  return v;
};
