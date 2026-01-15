"use client";

import { useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence, MotionConfig } from "motion/react";
import { ChevronLeft, ChevronRight, Globe, Circle, Chrome, Monitor } from "lucide-react";
import { cn } from "../../lib/utils";
import { useLiveCard } from "./card-context";
import { useMeasure } from "../../hooks/use-measure";

interface LiveCardProps {
  className?: string;
}

// Dummy data
const DUMMY_DATA = {
  pages: [
    { path: "/", count: 7 },
    { path: "/website/linear-870", count: 2 },
    { path: "/website/mario-carrillo-821", count: 1 },
    { path: "/website/artworld-414", count: 1 },
    { path: "/website/dala-502", count: 1 },
    { path: "/website/resend-917", count: 1 },
    { path: "/website/notion-445", count: 1 },
    { path: "/website/figma-223", count: 1 },
    { path: "/website/vercel-889", count: 1 },
    { path: "/website/github-334", count: 1 },
  ],
  referrers: [
    { name: "Direct", count: 14 },
    { name: "google.com", count: 3 },
    { name: "twitter.com", count: 2 },
  ],
  countries: [
    { name: "United States", code: "US", flag: "🇺🇸", count: 8 },
    { name: "Brazil", code: "BR", flag: "🇧🇷", count: 5 },
    { name: "Canada", code: "CA", flag: "🇨🇦", count: 4 },
    { name: "United Kingdom", code: "GB", flag: "🇬🇧", count: 4 },
  ],
  liveUsers: 21,
  users: [
    {
      id: "1",
      name: "Thorough Elk",
      location: "Joinville, BR",
      countryCode: "BR",
      firstSeen: "Jan 14, 2026",
      sessions: 1,
      events: 16,
      currentPage: "/website/umbrel-975",
      referrer: "Direct",
      browser: "Chrome",
      device: "Desktop",
      os: "Windows",
    },
  ],
};

export function LiveCard({ className }: LiveCardProps) {
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
        return <OverviewView />;
      case "pages":
        return <PagesView />;
      case "referrers":
        return <ReferrersView />;
      case "countries":
        return <CountriesView />;
      case "user":
        return selectedUser ? <UserView user={selectedUser} /> : null;
      default:
        return <OverviewView />;
    }
  }, [view, selectedUser]);

  return (
    <MotionConfig transition={{ type: "spring", stiffness: 220, damping: 20, mass: 1.26 }}>
      
      <motion.div
        animate={enableAnimation && bounds.height ? { height: bounds.height } : {}}
        initial={false}
        className={cn(
          "relative w-[420px] overflow-hidden rounded-2xl bg-linear-to-b from-bklit-800 to-bklit-900 shadow-2xl",
          className
        )}
        style={{ borderRadius: 16 }}
      >
        <div ref={ref} className="flex flex-col">

          {/* Back Button */}
          <AnimatePresence>
            {canGoBack && (
              <motion.button
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                onClick={goBack}
                className="absolute top-4 left-4 z-10 flex size-8 items-center justify-center rounded-full bg-zinc-800/80 backdrop-blur-sm transition-colors hover:bg-zinc-700/80"
              >
                <ChevronLeft className="size-4 text-zinc-300" />
              </motion.button>
            )}
          </AnimatePresence>

          <div className="p-6">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={view}
                initial={{ opacity: 0, y: 10, scale: 0.95, filter: "blur(2px)" }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -10, scale: 0.95, filter: "blur(2px)" }}
                transition={{
                  type: "spring",
                  stiffness: 220,
                  damping: 20,
                  mass: 1,
                }}
              >
                {content}
              </motion.div>
            </AnimatePresence>
          </div>



          {/* Fixed Footer */}
          <div className="flex items-center justify-center border-zinc-800/50 px-6 pb-6 pt-4">
            <div className="flex items-center gap-2 rounded-full bg-indigo-500/20 px-3.5 py-1.5 ring-1 ring-indigo-500/30">
              <Globe className="size-4 text-indigo-400" />
              <span className="font-semibold text-base text-indigo-300">
                {DUMMY_DATA.liveUsers}
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </MotionConfig>
  );
}

function OverviewView() {
  const { setView } = useLiveCard();

  return (
    <div className="space-y-4">
      {/* Pages Section */}
      <div className="space-y-2">
        <h3 className="font-medium text-xs text-zinc-400 sr-only">Pages</h3>
        
        <button
          onClick={() => setView("pages")}
          className="group relative flex w-full items-center gap-2.5 rounded-xl bg-zinc-800/50 px-4 py-3 text-left transition-all hover:bg-zinc-800/80"
        >
          <span className="font-mono text-sm text-zinc-200">/</span>
          <div className="flex-1" />
          <span className="font-semibold text-sm text-zinc-300">
            {DUMMY_DATA.pages[0]?.count}
          </span>
          <ChevronRight className="size-4 text-zinc-500 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>

      {/* Referrers Section */}
      <div className="space-y-2">
        <h3 className="font-medium text-xs text-zinc-400 sr-only">Referrers</h3>
        
        <button
          onClick={() => setView("referrers")}
          className="group relative flex w-full items-center gap-2.5 rounded-xl bg-zinc-800/50 px-4 py-3 text-left transition-all hover:bg-zinc-800/80"
        >
          <ChevronRight className="size-4 text-zinc-500" />
          <span className="text-sm text-zinc-200">Direct</span>
          <div className="flex-1" />
          <span className="font-semibold text-sm text-zinc-300">
            {DUMMY_DATA.referrers[0]?.count}
          </span>
          <ChevronRight className="size-4 text-zinc-500 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>

      {/* Countries Section */}
      <div className="space-y-2">
        <h3 className="font-medium text-xs text-zinc-400 sr-only">Countries</h3>
        
        <button
          onClick={() => setView("countries")}
          className="group relative flex w-full items-center gap-2.5 rounded-xl bg-zinc-800/50 px-4 py-3 text-left transition-all hover:bg-zinc-800/80"
        >
          <span className="text-base">🇺🇸</span>
          <span className="text-sm text-zinc-200">United States</span>
          <div className="flex-1" />
          <span className="font-semibold text-sm text-zinc-300">
            {DUMMY_DATA.countries[0]?.count}
          </span>
          <ChevronRight className="size-4 text-zinc-500 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </div>
  );
}

function PagesView() {
  return (
    <div className="space-y-3 pt-4">
      <h2 className="text-center font-semibold text-base text-white">Pages</h2>
      
      <div className="max-h-[180px] space-y-1.5 overflow-y-auto pr-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-zinc-700 hover:scrollbar-thumb-zinc-600">
        {DUMMY_DATA.pages.map((page, index) => (
          <div
            key={page.path}
            className={cn(
              "flex items-center justify-between rounded-lg bg-zinc-800/50 px-3.5 py-2.5",
              index === DUMMY_DATA.pages.length - 1 && "opacity-60"
            )}
          >
            <span className="font-mono text-xs text-zinc-200">{page.path}</span>
            <span className="font-semibold text-xs text-zinc-400">{page.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReferrersView() {
  return (
    <div className="space-y-3 pt-4">
      <h2 className="text-center font-semibold text-base text-white">Referrers</h2>
      
      <div className="space-y-1.5">
        {DUMMY_DATA.referrers.map((referrer) => (
          <div
            key={referrer.name}
            className="flex items-center gap-2.5 rounded-lg bg-zinc-800/50 px-3.5 py-2.5"
          >
            <ChevronRight className="size-4 text-zinc-500" />
            <span className="flex-1 text-xs text-zinc-200">{referrer.name}</span>
            <span className="font-semibold text-xs text-zinc-400">{referrer.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CountriesView() {
  return (
    <div className="space-y-3 pt-4">
      <h2 className="text-center font-semibold text-base text-white">Countries</h2>
      
      <div className="space-y-1.5">
        {DUMMY_DATA.countries.map((country) => (
          <div
            key={country.code}
            className="flex items-center gap-2.5 rounded-lg bg-zinc-800/50 px-3.5 py-2.5"
          >
            <span className="text-base">{country.flag}</span>
            <span className="flex-1 text-xs text-zinc-200">{country.name}</span>
            <span className="font-semibold text-xs text-zinc-400">{country.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function UserView({ user }: { user: any }) {
  return (
    <div className="space-y-4 pt-4">
      {/* User Header */}
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-linear-to-br from-cyan-400 to-indigo-500" />
        
        <div>
          <h2 className="font-semibold text-base text-white">{user.name}</h2>
          <div className="flex items-center justify-center gap-1.5 text-zinc-400">
            <span className="text-sm">{DUMMY_DATA.countries.find(c => c.code === user.countryCode)?.flag}</span>
            <span className="text-xs">{user.location}</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <div className="font-medium text-xs text-zinc-400">First seen</div>
          <div className="mt-0.5 text-xs text-white">{user.firstSeen}</div>
        </div>
        <div>
          <div className="font-medium text-xs text-zinc-400">Sessions</div>
          <div className="mt-0.5 text-xs text-white">{user.sessions}</div>
        </div>
        <div>
          <div className="font-medium text-xs text-zinc-400">Events</div>
          <div className="mt-0.5 text-xs text-white">{user.events}</div>
        </div>
      </div>

      {/* Activity */}
      <div className="space-y-2.5 rounded-xl bg-zinc-800/30 p-3.5">
        <div className="flex items-center gap-2.5">
          <Circle className="size-3 fill-indigo-400 text-indigo-400" />
          <span className="flex-1 font-mono text-xs text-zinc-300">{user.currentPage}</span>
          <Circle className="size-1.5 fill-purple-400 text-purple-400" />
        </div>
        
        <div className="flex items-center gap-2.5">
          <ChevronRight className="size-3 text-zinc-500" />
          <span className="flex-1 text-xs text-zinc-400">{user.referrer}</span>
          <div className="flex items-center gap-1.5">
            <Chrome className="size-3 text-zinc-500" />
            <Monitor className="size-3 text-zinc-500" />
          </div>
        </div>
      </div>
    </div>
  );
}

export { LiveCardProvider, useLiveCard } from "./card-context";
export type { UserData, CardView } from "./card-context";
