"use client";
import { cn } from "@bklit/ui/lib/utils";
import { animate, useMotionValue } from "motion/react";
import type React from "react";
import {
  type ComponentPropsWithoutRef,
  type CSSProperties,
  useEffect,
  useRef,
} from "react";

export type GlowPosition =
  | "top left"
  | "top center"
  | "top right"
  | "center left"
  | "center center"
  | "center right"
  | "bottom left"
  | "bottom center"
  | "bottom right";

export interface GlowAreaProps extends ComponentPropsWithoutRef<"div"> {
  size?: number;
  glowPosition?: GlowPosition;
  transitionDuration?: number;
}

const parseGlowPosition = (
  position: GlowPosition,
  width: number,
  height: number,
): { x: number; y: number } => {
  const [vertical, horizontal] = position.split(" ");

  let x = 0;
  let y = 0;

  // Calculate X based on horizontal position
  switch (horizontal) {
    case "left":
      x = 0;
      break;
    case "center":
      x = width / 2;
      break;
    case "right":
      x = width;
      break;
  }

  // Calculate Y based on vertical position
  switch (vertical) {
    case "top":
      y = 0;
      break;
    case "center":
      y = height / 2;
      break;
    case "bottom":
      y = height;
      break;
  }

  return { x, y };
};

export const GlowArea = (props: GlowAreaProps) => {
  const {
    className = "",
    size = 300,
    glowPosition = "center center",
    transitionDuration = 500,
    ...rest
  } = props;
  const element = useRef<HTMLDivElement>(null);
  const isHovering = useRef(false);
  const animationControls = useRef<{ stop: () => void } | null>(null);

  // Motion values for smooth animation
  const glowX = useMotionValue(0);
  const glowY = useMotionValue(0);

  const getInitialPosition = () => {
    if (!element.current) return { x: 0, y: 0 };

    const bounds = element.current.getBoundingClientRect();
    return parseGlowPosition(glowPosition, bounds.width, bounds.height);
  };

  const setInitialPosition = () => {
    const { x, y } = getInitialPosition();
    glowX.set(x);
    glowY.set(y);
  };

  // Update CSS variables when motion values change
  useEffect(() => {
    const unsubscribeX = glowX.on("change", (value) => {
      if (element.current) {
        element.current.style.setProperty("--glow-x", `${value}px`);
      }
    });

    const unsubscribeY = glowY.on("change", (value) => {
      if (element.current) {
        element.current.style.setProperty("--glow-y", `${value}px`);
      }
    });

    return () => {
      unsubscribeX();
      unsubscribeY();
    };
  }, [glowX, glowY]);

  useEffect(() => {
    setInitialPosition();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [glowPosition]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    // Stop any ongoing return animation when user moves mouse
    if (!isHovering.current && animationControls.current) {
      animationControls.current.stop();
      animationControls.current = null;
    }

    isHovering.current = true;

    const bounds = e.currentTarget.getBoundingClientRect();
    const targetX = e.clientX - bounds.left;
    const targetY = e.clientY - bounds.top;

    // Smoothly animate to cursor position with a fast, tight spring
    // Stop any previous hover animations
    if (animationControls.current) {
      animationControls.current.stop();
    }

    const controlsX = animate(glowX, targetX, {
      type: "spring",
      stiffness: 400, // Higher stiffness = snappier
      damping: 40, // Higher damping = less bounce
      mass: 0.1, // Lower mass = faster response
    });

    const controlsY = animate(glowY, targetY, {
      type: "spring",
      stiffness: 400,
      damping: 40,
      mass: 0.1,
    });

    animationControls.current = {
      stop: () => {
        controlsX.stop();
        controlsY.stop();
      },
    };
  };

  const handleMouseLeave = () => {
    isHovering.current = false;
    if (!element.current) return;

    // Get the target position
    const { x, y } = getInitialPosition();

    // Animate back to initial position with spring physics
    const controlsX = animate(glowX, x, {
      type: "spring",
      stiffness: 200,
      damping: 30,
      duration: transitionDuration / 1000,
    });

    const controlsY = animate(glowY, y, {
      type: "spring",
      stiffness: 200,
      damping: 30,
      duration: transitionDuration / 1000,
    });

    animationControls.current = {
      stop: () => {
        controlsX.stop();
        controlsY.stop();
      },
    };
  };

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: <It's a static element>
    <div
      ref={element}
      style={
        {
          position: "relative",
          "--glow-size": `${size}px`,
        } as CSSProperties
      }
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={cn(className, "")}
      {...rest}
    />
  );
};

GlowArea.displayName = "GlowArea";

interface GlowProps extends ComponentPropsWithoutRef<"div"> {
  color?: string;
}

export const Glow = (props: GlowProps) => {
  const { className, color = "blue", children, ...rest } = props;
  const element = useRef<HTMLDivElement>(null);

  useEffect(() => {
    element.current?.style.setProperty(
      "--glow-top",
      `${element.current?.offsetTop}px`,
    );
    element.current?.style.setProperty(
      "--glow-left",
      `${element.current?.offsetLeft}px`,
    );
  }, []);

  return (
    <div ref={element} className={cn(className, "relative")}>
      <div
        {...rest}
        style={{
          backgroundImage: `radial-gradient(
            var(--glow-size) var(--glow-size) at calc(var(--glow-x, -99999px) - var(--glow-left, 0px))
            calc(var(--glow-y, -99999px) - var(--glow-top, 0px)),
            ${color} 0%,
            transparent 100%
          )`,
        }}
        className={cn(
          className,
          "absolute pointer-events-none inset-0 dark:mix-blend-lighten mix-blend-multiply after:content-[''] after:absolute after:bg-background/90 after:inset-0.25 after:rounded-[inherit]",
        )}
      ></div>
      {children}
    </div>
  );
};

Glow.displayName = "Glow";
