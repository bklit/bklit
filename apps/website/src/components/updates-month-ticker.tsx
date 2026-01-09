"use client";

import { AnimatePresence, motion, useInView, useMotionValue, animate } from "motion/react";
import { useEffect, useRef, useState } from "react";

interface Update {
  slug: string;
  date: string;
}

interface UpdatesMonthTickerProps {
  updates: Update[];
}

export function UpdatesMonthTicker({ updates }: UpdatesMonthTickerProps) {
  const [activeMonthIndex, setActiveMonthIndex] = useState<number>(0);
  const [dragOffset, setDragOffset] = useState(0);
  const headerRef = useRef<HTMLDivElement>(null);
  const isHeaderInView = useInView(headerRef, { amount: 0.5 });

  // Function to scroll to a specific month
  const scrollToMonth = (monthId: string) => {
    const firstArticleOfMonth = updates.find((u) => {
      const date = new Date(u.date);
      const monthYear = date.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      });
      return monthYear === monthId;
    });

    if (firstArticleOfMonth) {
      const article = document.getElementById(firstArticleOfMonth.slug);
      if (article) {
        const yOffset = -200; // offset to account for fixed header and ticker
        const y = article.getBoundingClientRect().top + window.scrollY + yOffset;
        window.scrollTo({ top: y, behavior: "smooth" });
      }
    }
  };

  // Generate all unique months from updates
  const allMonths = Array.from(
    new Set(
      updates.map((u) => {
        const date = new Date(u.date);
        return date.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        });
      })
    )
  ).map((monthYear, index) => {
    const date = updates.find((u) => {
      const d = new Date(u.date);
      return (
        d.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        }) === monthYear
      );
    })!.date;
    return {
      id: monthYear,
      label: new Date(date).toLocaleDateString("en-US", {
        month: "short",
        year: "2-digit",
      }),
      fullDate: new Date(date),
      index,
    };
  });

  useEffect(() => {
    const handleScroll = () => {
      const viewportCenter = window.innerHeight / 2;
      const articles = document.querySelectorAll("article[id]");

      let closestArticle: Element | null = null;
      let closestDistance = Number.POSITIVE_INFINITY;

      articles.forEach((article) => {
        const rect = article.getBoundingClientRect();
        const articleCenter = rect.top + rect.height / 2;
        const distance = Math.abs(articleCenter - viewportCenter);

        if (distance < closestDistance) {
          closestDistance = distance;
          closestArticle = article;
        }
      });

      if (closestArticle) {
        const slug = (closestArticle as HTMLElement).id;
        const update = updates.find((u) => u.slug === slug);
        if (update) {
          const date = new Date(update.date);
          const monthYear = date.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          });

          const monthIndex = allMonths.findIndex((m) => m.id === monthYear);
          if (monthIndex !== -1 && monthIndex !== activeMonthIndex) {
            setActiveMonthIndex(monthIndex);
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [updates, allMonths, activeMonthIndex]);

  // Ticker is visible when header is NOT in view
  const isVisible = !isHeaderInView;

  // Render 5 months: -2, -1, 0 (center), +1, +2
  const monthsToRender = [-2, -1, 0, 1, 2]
    .map((offset) => {
      const month = allMonths[activeMonthIndex + offset];
      return month ? { ...month, offset } : null;
    })
    .filter((m) => m !== null);

  const getPosition = (offset: number) => offset * 48;

  return (
    <>
      {/* Invisible ref element to track header */}
      <div className="absolute top-0 left-0 h-[100px] w-full" ref={headerRef} />

      <AnimatePresence>
        {isVisible && (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2"
            exit={{ opacity: 0, y: 20 }}
            initial={{ opacity: 0, y: 20 }}
            key="updates-ticker"
            transition={{
              duration: 0.31,
              ease: [0, 0.667, 0.463, 1.005],
            }}
          >
            <div className="relative overflow-clip rounded-full border bg-background/10 py-2 shadow-lg backdrop-blur-sm">
              <div className="relative h-4 w-[160px] overflow-hidden">
                <motion.div
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.1}
                  onDrag={(_, info) => {
                    setDragOffset(info.offset.x);
                  }}
                  onDragEnd={(_, info) => {
                    // Calculate how many months moved based on drag
                    const monthsToSkip = Math.round(info.offset.x / 48);
                    
                    if (monthsToSkip !== 0) {
                      const targetIndex = activeMonthIndex - monthsToSkip;
                      const targetMonth = allMonths[targetIndex];
                      
                      if (targetMonth) {
                        scrollToMonth(targetMonth.id);
                      }
                    }
                    
                    // Smoothly animate offset back to 0
                    const startOffset = dragOffset;
                    const startTime = Date.now();
                    const duration = 300;
                    
                    const animateBack = () => {
                      const elapsed = Date.now() - startTime;
                      const progress = Math.min(elapsed / duration, 1);
                      const eased = 1 - Math.pow(1 - progress, 3); // easeOut cubic
                      
                      setDragOffset(startOffset * (1 - eased));
                      
                      if (progress < 1) {
                        requestAnimationFrame(animateBack);
                      }
                    };
                    
                    requestAnimationFrame(animateBack);
                  }}
                  className="relative h-full w-full cursor-grab active:cursor-grabbing"
                >
                  <AnimatePresence initial={false} mode="popLayout">
                  {monthsToRender.map((month) => (
                    <motion.span
                      key={month.id}
                      layout="position"
                      initial={{
                        x: getPosition(month.offset),
                        opacity: 0,
                      }}
                      animate={{
                        x: getPosition(month.offset) + dragOffset,
                        opacity: 1,
                      }}
                        exit={{
                          x: getPosition(month.offset > 0 ? 3 : -3),
                          opacity: 0,
                        }}
                        whileHover={
                          month.offset !== 0
                            ? {
                                scale: 1.15,
                                opacity: 1,
                                transition: { duration: 0.2 },
                              }
                            : undefined
                        }
                        onClick={() => {
                          if (month.offset !== 0) {
                            scrollToMonth(month.id);
                          }
                        }}
                        className={`absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-xs pointer-events-auto ${
                          month.offset === 0
                            ? "font-semibold text-foreground"
                            : "text-muted-foreground cursor-pointer hover:text-foreground"
                        }`}
                        transition={{
                          x: {
                            duration: 1.5,
                            ease: [0, 0.667, 0.138, 1],
                          },
                          opacity: {
                            duration: 0.3,
                            ease: "easeInOut",
                          },
                          layout: {
                            duration: 0.5,
                            ease: [0, 0.667, 0.138, 1],
                          },
                        }}
                      >
                      {month.label}
                    </motion.span>
                  ))}
                  </AnimatePresence>
                </motion.div>
              </div>
              <div className="absolute top-0 bottom-0 left-0 w-1/3 bg-linear-to-r from-background to-transparent pointer-events-none" />
              <div className="absolute top-0 right-0 bottom-0 w-1/3 bg-linear-to-l from-background to-transparent pointer-events-none" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
