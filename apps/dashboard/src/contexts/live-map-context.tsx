"use client";

import { createContext, type ReactNode, useContext, useRef } from "react";

interface LiveMapContextValue {
  centerOnCountry: (
    countryCode: string | null,
    countryName?: string | null
  ) => void;
  registerCenterFunction: (
    fn: (countryCode: string | null, countryName?: string | null) => void
  ) => void;
  registerMarkerClickHandler: (fn: (sessionId: string) => void) => void;
}

const LiveMapContext = createContext<LiveMapContextValue | null>(null);

export function LiveMapProvider({ children }: { children: ReactNode }) {
  const centerFunctionRef = useRef<
    ((countryCode: string | null, countryName?: string | null) => void) | null
  >(null);
  const markerClickHandlerRef = useRef<((sessionId: string) => void) | null>(null);

  const registerCenterFunction = (
    fn: (countryCode: string | null, countryName?: string | null) => void
  ) => {
    centerFunctionRef.current = fn;
  };

  const registerMarkerClickHandler = (fn: (sessionId: string) => void) => {
    markerClickHandlerRef.current = fn;
  };

  const centerOnCountry = (
    countryCode: string | null,
    countryName?: string | null
  ) => {
    if (centerFunctionRef.current) {
      centerFunctionRef.current(countryCode, countryName);
    }
  };

  // Expose marker click to LiveMap
  const handleMarkerClick = (sessionId: string) => {
    if (markerClickHandlerRef.current) {
      markerClickHandlerRef.current(sessionId);
    }
  };

  return (
    <LiveMapContext.Provider
      value={{ centerOnCountry, registerCenterFunction, registerMarkerClickHandler }}
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
