"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, MotionConfig } from "motion/react";
import { ChevronLeft, ChevronRight, Globe, Circle, Chrome, Monitor } from "lucide-react";
import { cn } from "../../lib/utils";
import { useLiveCard } from "./card-context";
import { useMeasure } from "../../hooks/use-measure";

export interface LivePageData {
  path: string;
  count: number;
}

export interface LiveReferrerData {
  name: string;
  count: number;
}

export interface LiveCountryData {
  name: string;
  code: string;
  flag: string;
  count: number;
}

export interface LiveUserData {
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

export interface LiveCardData {
  pages: LivePageData[];
  referrers: LiveReferrerData[];
  countries: LiveCountryData[];
  liveUsers: number;
  users: LiveUserData[];
}

interface LiveCardProps {
  className?: string;
  data: LiveCardData;
}

export function LiveCard({ className, data }: LiveCardProps) {
  const { view, goBack, canGoBack, selectedUser } = useLiveCard();
  const [ref, bounds] = useMeasure();
  const [enableAnimation, setEnableAnimation] = useState(false);

  // Only enable animation after the view changes
  useEffect(() => {
    setEnableAnimation(true);
  }, [view]);

  const content = useMemo(() => {
    switch (view) {
      case "overview":
        return <OverviewView data={data} />;
      case "pages":
        return <PagesView pages={data.pages} />;
      case "referrers":
        return <ReferrersView referrers={data.referrers} />;
      case "countries":
        return <CountriesView countries={data.countries} />;
      case "user":
        return selectedUser ? <UserView user={selectedUser} data={data} /> : null;
      default:
        return <OverviewView data={data} />;
    }
  }, [view, selectedUser, data]);

  return (
    <MotionConfig transition={{ type: "spring", stiffness: 220, damping: 20, mass: 1.5 }}>
      
      <motion.div
        animate={enableAnimation && bounds.height ? { height: bounds.height } : {}}
        initial={false}
        className={cn(
          "flex flex-col justify-end relative w-[420px] overflow-hidden rounded-xl bg-bklit-700",
          className
        )}
        style={{ borderRadius: 16, transformOrigin: "bottom center" }}
      >

          <div ref={ref} className="flex flex-col justify-end">
            
            {/* Back Button */}
            <AnimatePresence>
              {canGoBack && (
                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  onClick={goBack}
                  className="absolute top-4 left-4 z-10 flex size-8 items-center justify-center rounded-full bg-bklit-600/80 backdrop-blur-sm transition-colors hover:bg-bklit-600/40"
                >
                  <ChevronLeft className="size-4 text-bklit-200" />
                </motion.button>
              )}
            </AnimatePresence>

            <div className="p-4">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.div
                  key={view}
                  initial={{ opacity: 0, scale: 0.95, filter: "blur(2px)" }}
                  animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, scale: 0.95, filter: "blur(2px)" }}
                  transition={{
                    type: "spring",
                    stiffness: 220,
                    damping: 20,
                    mass: 1,
                  }}
                  className="origin-bottom"
                >
                  {content}
                </motion.div>
              </AnimatePresence>
            </div>

            <nav className="flex items-center justify-center pb-4">
              <div className="flex items-center gap-2 rounded-full bg-indigo-500/20 px-3.5 py-1.5 ring-1 ring-indigo-500/30">
                <Globe className="size-4 text-indigo-400" />
                <span className="font-semibold text-base text-indigo-300">
                  {data.liveUsers}
                </span>
              </div>
            </nav>
          </div>
      </motion.div>
    </MotionConfig>
  );
}

function OverviewView({ data }: { data: LiveCardData }) {
  const { setView } = useLiveCard();

  const topPage = data.pages[0];
  const topReferrer = data.referrers[0];
  const topCountry = data.countries[0];

  const hasData = topPage || topReferrer || topCountry;

  if (!hasData && data.liveUsers === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="mb-2 rounded-full bg-bklit-800/50 p-4">
          <Globe className="size-8 text-bklit-400" />
        </div>
        <p className="text-bklit-300 text-sm">No active visitors</p>
        <p className="text-bklit-500 text-xs">Data will appear when visitors arrive</p>
      </div>
    );
  }

  if (!hasData && data.liveUsers > 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <div className="mb-2 rounded-full bg-bklit-800/50 p-4">
          <Globe className="size-8 text-bklit-400" />
        </div>
        <p className="text-bklit-300 text-sm">{data.liveUsers} visitor{data.liveUsers === 1 ? '' : 's'} online</p>
        <p className="text-bklit-500 text-xs">Loading analytics data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Pages Section */}
      {topPage && (
        <div className="space-y-2">
          <h3 className="font-medium text-xs text-bklit-400 sr-only">Pages</h3>
          
          <button
            onClick={() => setView("pages")}
            className="group relative flex w-full items-center gap-2.5 rounded-xl bg-bklit-800/50 px-4 py-3 text-left transition-all hover:bg-bklit-800/80"
          >
            <span className="font-mono text-sm text-bklit-200">{topPage.path}</span>
            <div className="flex-1" />
            <span className="font-semibold text-sm text-bklit-300">
              {topPage.count}
            </span>
            <ChevronRight className="size-4 text-bklit-500 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      )}

      {/* Referrers Section */}
      {topReferrer && (
        <div className="space-y-2">
          <h3 className="font-medium text-xs text-bklit-400 sr-only">Referrers</h3>
          
          <button
            onClick={() => setView("referrers")}
            className="group relative flex w-full items-center gap-2.5 rounded-xl bg-bklit-800/50 px-4 py-3 text-left transition-all hover:bg-bklit-800/80"
          >
            <ChevronRight className="size-4 text-bklit-500" />
            <span className="text-sm text-bklit-200">{topReferrer.name}</span>
            <div className="flex-1" />
            <span className="font-semibold text-sm text-bklit-300">
              {topReferrer.count}
            </span>
            <ChevronRight className="size-4 text-bklit-500 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      )}

      {/* Countries Section */}
      {topCountry && (
        <div className="space-y-2">
          <h3 className="font-medium text-xs text-bklit-400 sr-only">Countries</h3>
          
          <button
            onClick={() => setView("countries")}
            className="group relative flex w-full items-center gap-2.5 rounded-xl bg-bklit-800/50 px-4 py-3 text-left transition-all hover:bg-bklit-800/80"
          >
            <span className="text-base">{topCountry.flag}</span>
            <span className="text-sm text-bklit-200">{topCountry.name}</span>
            <div className="flex-1" />
            <span className="font-semibold text-sm text-bklit-300">
              {topCountry.count}
            </span>
            <ChevronRight className="size-4 text-bklit-500 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      )}
    </div>
  );
}

function PagesView({ pages }: { pages: LivePageData[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showTopMask, setShowTopMask] = useState(false);
  const [showBottomMask, setShowBottomMask] = useState(false);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    const updateMasks = () => {
      const hasScrollableContent = element.scrollHeight > element.clientHeight;
      const isAtTop = element.scrollTop <= 5;
      const isAtBottom = element.scrollTop + element.clientHeight >= element.scrollHeight - 5;
      
      setShowTopMask(hasScrollableContent && !isAtTop);
      setShowBottomMask(hasScrollableContent && !isAtBottom);
    };

    // Check on mount and on scroll
    updateMasks();
    element.addEventListener("scroll", updateMasks);
    
    // Also check on resize in case content changes
    const resizeObserver = new ResizeObserver(updateMasks);
    resizeObserver.observe(element);

    return () => {
      element.removeEventListener("scroll", updateMasks);
      resizeObserver.disconnect();
    };
  }, []);

  if (pages.length === 0) {
    return (
      <div className="space-y-3 pt-4">
        <h2 className="text-center font-semibold text-base text-white">Pages</h2>
        <div className="py-8 text-center text-bklit-400 text-sm">No page data available</div>
      </div>
    );
  }

  return (
    <div className="space-y-3 pt-4">
      <h2 className="text-center font-semibold text-base text-white">Pages</h2>
      
      <div className="scroll-container">
        <div 
          ref={scrollRef} 
          data-scrolled-top={showTopMask}
          data-scrolled-bottom={showBottomMask}
        >
          {pages.map((page, index) => (
            <div
              key={page.path}
              className={cn(
                "flex items-center justify-between rounded-lg bg-bklit-800/50 px-3.5 py-2.5",
                index === pages.length - 1 && "opacity-60"
              )}
            >
              <span className="font-mono text-xs text-bklit-200">{page.path}</span>
              <span className="font-semibold text-xs text-bklit-400">{page.count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ReferrersView({ referrers }: { referrers: LiveReferrerData[] }) {
  if (referrers.length === 0) {
    return (
      <div className="space-y-3 pt-4">
        <h2 className="text-center font-semibold text-base text-white">Referrers</h2>
        <div className="py-8 text-center text-bklit-400 text-sm">No referrer data available</div>
      </div>
    );
  }

  return (
    <div className="space-y-3 pt-4">
      <h2 className="text-center font-semibold text-base text-white">Referrers</h2>
      
      <div className="space-y-1.5">
        {referrers.map((referrer) => (
          <div
            key={referrer.name}
            className="flex items-center gap-2.5 rounded-lg bg-bklit-800/50 px-3.5 py-2.5"
          >
            <ChevronRight className="size-4 text-bklit-500" />
            <span className="flex-1 text-xs text-bklit-200">{referrer.name}</span>
            <span className="font-semibold text-xs text-bklit-400">{referrer.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CountriesView({ countries }: { countries: LiveCountryData[] }) {
  if (countries.length === 0) {
    return (
      <div className="space-y-3 pt-4">
        <h2 className="text-center font-semibold text-base text-white">Countries</h2>
        <div className="py-8 text-center text-bklit-400 text-sm">No country data available</div>
      </div>
    );
  }

  return (
    <div className="space-y-3 pt-4">
      <h2 className="text-center font-semibold text-base text-white">Countries</h2>
      
      <div className="space-y-1.5">
        {countries.map((country) => (
          <div
            key={country.code}
            className="flex items-center gap-2.5 rounded-lg bg-bklit-800/50 px-3.5 py-2.5"
          >
            <span className="text-base">{country.flag}</span>
            <span className="flex-1 text-xs text-bklit-200">{country.name}</span>
            <span className="font-semibold text-xs text-bklit-400">{country.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function UserView({ user, data }: { user: LiveUserData; data: LiveCardData }) {
  const country = data.countries.find(c => c.code === user.countryCode);
  
  return (
    <div className="space-y-4 pt-4">
      {/* User Header */}
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-linear-to-br from-cyan-400 to-indigo-500" />
        
        <div>
          <h2 className="font-semibold text-base text-white">{user.name}</h2>
          <div className="flex items-center justify-center gap-1.5 text-bklit-400">
            {country && <span className="text-sm">{country.flag}</span>}
            <span className="text-xs">{user.location}</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <div className="font-medium text-xs text-bklit-400">First seen</div>
          <div className="mt-0.5 text-xs text-white">{user.firstSeen}</div>
        </div>
        <div>
          <div className="font-medium text-xs text-bklit-400">Sessions</div>
          <div className="mt-0.5 text-xs text-white">{user.sessions}</div>
        </div>
        <div>
          <div className="font-medium text-xs text-bklit-400">Events</div>
          <div className="mt-0.5 text-xs text-white">{user.events}</div>
        </div>
      </div>

      {/* Activity */}
      <div className="space-y-2.5 rounded-xl bg-bklit-800/30 p-3.5">
        <div className="flex items-center gap-2.5">
          <Circle className="size-3 fill-indigo-400 text-indigo-400" />
          <span className="flex-1 font-mono text-xs text-bklit-300">{user.currentPage}</span>
          <Circle className="size-1.5 fill-purple-400 text-purple-400" />
        </div>
        
        <div className="flex items-center gap-2.5">
          <ChevronRight className="size-3 text-bklit-500" />
          <span className="flex-1 text-xs text-bklit-400">{user.referrer}</span>
          <div className="flex items-center gap-1.5">
            <Chrome className="size-3 text-bklit-500" />
            <Monitor className="size-3 text-bklit-500" />
          </div>
        </div>
      </div>
    </div>
  );
}

export { LiveCardProvider, useLiveCard } from "./card-context";
export type { UserData, CardView } from "./card-context";
