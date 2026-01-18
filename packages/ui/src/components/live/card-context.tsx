"use client";

import { createContext, type ReactNode, useContext, useState, useCallback } from "react";

type CardView = "overview" | "pages" | "referrers" | "countries" | "user";

interface PageJourneyItem {
  url: string;
  timestamp: Date;
  isCurrentPage?: boolean;
}

interface EventItem {
  type: string;
  timestamp: Date;
}

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
  pageJourney?: PageJourneyItem[];
  triggeredEvents?: EventItem[];
  gradient?: { from: string; to: string };
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

  const handleSetView = useCallback((newView: CardView) => {
    setViewHistory((prev) => [...prev, newView]);
    setView(newView);
  }, []);

  const openUserDetail = useCallback((user: UserData) => {
    setSelectedUser(user);
    setViewHistory((prev) => [...prev, "user"]);
    setView("user");
  }, []);

  const goBack = useCallback(() => {
    setViewHistory((prev) => {
      if (prev.length > 1) {
        const newHistory = prev.slice(0, -1);
        const previousView = newHistory[newHistory.length - 1];
        setView(previousView);
        
        if (previousView !== "user") {
          setSelectedUser(null);
        }
        
        return newHistory;
      }
      return prev;
    });
  }, [view, viewHistory.length, selectedUser?.id]);

  const canGoBack = viewHistory.length > 1;

  return (
    <LiveCardContext.Provider
      value={{
        view,
        setView: handleSetView,
        selectedUser,
        openUserDetail,
        goBack,
        canGoBack,
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

export type { UserData, CardView, PageJourneyItem, EventItem };

