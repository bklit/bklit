"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useRef,
  useState,
} from "react";
import type { CountryGroup, LiveSession } from "@/hooks/use-live-sessions";

interface LiveMapContextValue {
  // Map centering
  centerOnCountry: (
    countryCode: string | null,
    countryName?: string | null
  ) => void;
  registerCenterFunction: (
    fn: (countryCode: string | null, countryName?: string | null) => void
  ) => void;

  // Marker click handling
  registerMarkerClickHandler: (fn: (sessionId: string) => void) => void;
  onMarkerClick: (sessionId: string) => void;

  // Selected session state
  selectedSessionId: string | null;
  setSelectedSessionId: (sessionId: string | null) => void;

  // Live sessions data (optional - can be provided by parent)
  sessions: Map<string, LiveSession>;
  setSessions: (sessions: Map<string, LiveSession>) => void;
  individualSessions: LiveSession[];
  setIndividualSessions: (sessions: LiveSession[]) => void;
  countryGroups: CountryGroup[];
  setCountryGroups: (groups: CountryGroup[]) => void;
  totalCount: number;
  setTotalCount: (count: number) => void;

  // Get a session by ID
  getSession: (sessionId: string) => LiveSession | undefined;
}

const LiveMapContext = createContext<LiveMapContextValue | null>(null);

export function LiveMapProvider({ children }: { children: ReactNode }) {
  const centerFunctionRef = useRef<
    ((countryCode: string | null, countryName?: string | null) => void) | null
  >(null);
  const markerClickHandlerRef = useRef<((sessionId: string) => void) | null>(
    null
  );

  // Selected session state
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null
  );

  // Live sessions data
  const [sessions, setSessions] = useState<Map<string, LiveSession>>(new Map());
  const [individualSessions, setIndividualSessions] = useState<LiveSession[]>(
    []
  );
  const [countryGroups, setCountryGroups] = useState<CountryGroup[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  const registerCenterFunction = useCallback(
    (fn: (countryCode: string | null, countryName?: string | null) => void) => {
      centerFunctionRef.current = fn;
    },
    []
  );

  const registerMarkerClickHandler = useCallback(
    (fn: (sessionId: string) => void) => {
      markerClickHandlerRef.current = fn;
    },
    []
  );

  const centerOnCountry = useCallback(
    (countryCode: string | null, countryName?: string | null) => {
      if (centerFunctionRef.current) {
        centerFunctionRef.current(countryCode, countryName);
      }
    },
    []
  );

  const onMarkerClick = useCallback((sessionId: string) => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/70a8a99e-af48-4f0c-b4a4-d25670350550',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'live-map-context.tsx:onMarkerClick',message:'Marker clicked',data:{sessionId,hasHandler:!!markerClickHandlerRef.current},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'D'})}).catch(()=>{});
    // #endregion

    // Force refresh by clearing first - this ensures re-clicking same session works
    setSelectedSessionId(null);
    
    // Use microtask to ensure null state propagates before setting new value
    queueMicrotask(() => {
      setSelectedSessionId(sessionId);
      
      // Also call any registered handler
      if (markerClickHandlerRef.current) {
        markerClickHandlerRef.current(sessionId);
      }
    });
  }, []);

  const getSession = useCallback(
    (sessionId: string): LiveSession | undefined => {
      return sessions.get(sessionId);
    },
    [sessions]
  );

  return (
    <LiveMapContext.Provider
      value={{
        centerOnCountry,
        registerCenterFunction,
        registerMarkerClickHandler,
        onMarkerClick,
        selectedSessionId,
        setSelectedSessionId,
        sessions,
        setSessions,
        individualSessions,
        setIndividualSessions,
        countryGroups,
        setCountryGroups,
        totalCount,
        setTotalCount,
        getSession,
      }}
    >
      {children}
    </LiveMapContext.Provider>
  );
}

export function useLiveMap() {
  const context = useContext(LiveMapContext);
  if (!context) {
    throw new Error("useLiveMap must be used within LiveMapProvider");
  }
  return context;
}
