"use client";

import { Slot } from "@radix-ui/react-slot";
import { useLiveCard, type UserData } from "./card-context";

interface LiveCardUserTriggerProps {
  user?: UserData;
  asChild?: boolean;
  children?: React.ReactNode;
}

export function LiveCardUserTrigger({
  user,
  asChild = false,
  children,
}: LiveCardUserTriggerProps) {
  const { openUserDetail } = useLiveCard();

  const handleClick = () => {
    // Use the provided user or default dummy data
    const userData: UserData = user || {
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
    };

    openUserDetail(userData);
  };

  const Comp = asChild ? Slot : "button";

  return (
    <Comp onClick={handleClick}>
      {children || "Open User Detail"}
    </Comp>
  );
}

