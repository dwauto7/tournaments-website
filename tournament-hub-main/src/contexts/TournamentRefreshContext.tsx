import React, { createContext, useContext, useState, ReactNode } from "react";

interface TournamentRefreshContextType {
  refreshFlag: number;
  triggerRefresh: () => void;
}

const TournamentRefreshContext = createContext<TournamentRefreshContextType | undefined>(undefined);

export const TournamentRefreshProvider = ({ children }: { children: ReactNode }) => {
  const [refreshFlag, setRefreshFlag] = useState(0);

  const triggerRefresh = () => {
    setRefreshFlag((prev) => prev + 1);
  };

  return (
    <TournamentRefreshContext.Provider value={{ refreshFlag, triggerRefresh }}>
      {children}
    </TournamentRefreshContext.Provider>
  );
};

export const useTournamentRefresh = () => {
  const context = useContext(TournamentRefreshContext);
  if (!context) {
    throw new Error("useTournamentRefresh must be used within TournamentRefreshProvider");
  }
  return context;
};
