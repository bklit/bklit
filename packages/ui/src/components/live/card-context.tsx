"use client";

import { createContext, type ReactNode, useContext, useState } from "react";

type CardView = "overview" | "pages" | "referrers" | "countries" | "user";

interface UserData {
  id: string;
  name: string;
  location: string;
  countryCode: string;
  firstSeen: string;
  sessions: number;
  events: number;
  currentPage: string;
  referrer: string;
  browser: string;
  device: string;
  os: string;
}

interface LiveCardContextValue {
  view: CardView;
  setView: (view: CardView) => void;
  selectedUser: UserData | null;
  openUserDetail: (user: UserData) => void;
  goBack: () => void;
  canGoBack: boolean;
}

const LiveCardContext = createContext<LiveCardContextValue | null>(null);

export function LiveCardProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<CardView>("overview");
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [viewHistory, setViewHistory] = useState<CardView[]>(["overview"]);

  const handleSetView = (newView: CardView) => {
    setViewHistory((prev) => [...prev, newView]);
    setView(newView);
  };

  const openUserDetail = (user: UserData) => {
    setSelectedUser(user);
    handleSetView("user");
  };

  const goBack = () => {
    if (viewHistory.length > 1) {
      const newHistory = viewHistory.slice(0, -1);
      setViewHistory(newHistory);
      const previousView = newHistory[newHistory.length - 1];
      setView(previousView);
      
      if (previousView !== "user") {
        setSelectedUser(null);
      }
    }
  };

  return (
    <LiveCardContext.Provider
      value={{
        view,
        setView: handleSetView,
        selectedUser,
        openUserDetail,
        goBack,
        canGoBack: viewHistory.length > 1,
      }}
    >
      {children}
    </LiveCardContext.Provider>
  );
}

export function useLiveCard() {
  const context = useContext(LiveCardContext);
  if (!context) {
    throw new Error("useLiveCard must be used within LiveCardProvider");
  }
  return context;
}

export type { UserData, CardView };

