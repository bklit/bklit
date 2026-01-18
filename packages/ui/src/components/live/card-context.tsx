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
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/70a8a99e-af48-4f0c-b4a4-d25670350550',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'card-context.tsx:goBack',message:'goBack called',data:{currentView:view,historyLength:viewHistory.length,selectedUserId:selectedUser?.id},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2A,H2B'})}).catch(()=>{});
    // #endregion

    setViewHistory((prev) => {
      if (prev.length > 1) {
        const newHistory = prev.slice(0, -1);
        const previousView = newHistory[newHistory.length - 1];
        setView(previousView);
        
        if (previousView !== "user") {
          setSelectedUser(null);
        }
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/70a8a99e-af48-4f0c-b4a4-d25670350550',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'card-context.tsx:goBack:AFTER',message:'goBack completed',data:{previousView,newHistoryLength:newHistory.length,clearedUser:previousView!=='user'},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2A'})}).catch(()=>{});
        // #endregion
        
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

