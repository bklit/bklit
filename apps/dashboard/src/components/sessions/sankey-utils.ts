export interface PageViewEvent {
  url: string;
  timestamp: Date | string;
}

export interface SessionWithPageViews {
  id: string;
  pageViewEvents: PageViewEvent[];
}

interface SankeyNode {
  name: string;
}

interface SankeyLink {
  source: number;
  target: number;
  value: number;
}

interface SankeyData {
  nodes: SankeyNode[];
  links: SankeyLink[];
}

function extractPath(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    return pathname === "" ? "/" : pathname;
  } catch {
    const match = url.match(/^https?:\/\/[^/]+(\/.*)?$/);
    if (match) {
      return match[1] || "/";
    }
    return url;
  }
}

function formatPageName(path: string): string {
  if (path === "/") return "Home";
  return path;
}

export function transformSessionsToSankey(
  sessions: SessionWithPageViews[],
): SankeyData {
  const pageSet = new Set<string>();
  const transitions = new Map<string, number>();

  for (const session of sessions) {
    if (!session.pageViewEvents || session.pageViewEvents.length === 0) {
      continue;
    }

    // Sort pageViewEvents by timestamp to ensure correct order
    const sortedEvents = [...session.pageViewEvents].sort((a, b) => {
      const timeA = new Date(a.timestamp).getTime();
      const timeB = new Date(b.timestamp).getTime();
      return timeA - timeB;
    });

    const paths = sortedEvents
      .map((event) => extractPath(event.url))
      .filter((path) => path);

    if (paths.length === 0) continue;

    const entryPage = paths[0];
    const exitPage = paths[paths.length - 1];

    pageSet.add(entryPage);
    pageSet.add(exitPage);

    // Create transitions between consecutive pages
    for (let i = 0; i < paths.length - 1; i++) {
      const from = paths[i];
      const to = paths[i + 1];
      if (from !== to) {
        pageSet.add(from);
        pageSet.add(to);
        const key = `${from}->${to}`;
        transitions.set(key, (transitions.get(key) || 0) + 1);
      }
    }
  }

  const pages = Array.from(pageSet).sort();
  const nodeMap = new Map<string, number>();
  pages.forEach((page, index) => {
    nodeMap.set(page, index);
  });

  const nodes: SankeyNode[] = pages.map((page) => ({
    name: formatPageName(page),
  }));

  const links: SankeyLink[] = Array.from(transitions.entries())
    .map(([key, value]) => {
      const [from, to] = key.split("->");
      const sourceIndex = nodeMap.get(from);
      const targetIndex = nodeMap.get(to);
      if (
        sourceIndex === undefined ||
        targetIndex === undefined ||
        sourceIndex === targetIndex ||
        sourceIndex < 0 ||
        targetIndex < 0 ||
        sourceIndex >= nodes.length ||
        targetIndex >= nodes.length ||
        !Number.isFinite(value) ||
        value <= 0
      ) {
        return null;
      }
      return {
        source: sourceIndex,
        target: targetIndex,
        value: Number(value),
      };
    })
    .filter((link): link is SankeyLink => link !== null && link.value > 0);

  const result = { nodes, links };

  console.log("Transformed Sankey Data:", {
    sessionsProcessed: sessions.length,
    sessionsWithPageViews: sessions.filter(
      (s) => s.pageViewEvents && s.pageViewEvents.length > 0,
    ).length,
    uniquePages: pages.length,
    pages: pages,
    totalTransitions: transitions.size,
    transitions: Array.from(transitions.entries()).map(([key, value]) => ({
      transition: key,
      count: value,
    })),
    nodes: result.nodes,
    links: result.links,
    linkDetails: result.links.map((link) => ({
      source: result.nodes[link.source]?.name,
      target: result.nodes[link.target]?.name,
      value: link.value,
    })),
  });

  return result;
}

export interface NivoSankeyNode {
  id: string;
}

export interface NivoSankeyLink {
  source: string;
  target: string;
  value: number;
}

export interface NivoSankeyData {
  nodes: NivoSankeyNode[];
  links: NivoSankeyLink[];
}

function removeCyclesSmart(
  nodes: string[],
  links: Array<{ source: string; target: string; value: number }>,
): Array<{ source: string; target: string; value: number }> {
  // First, handle bidirectional links by keeping the one with higher value
  const linkMap = new Map<
    string,
    { source: string; target: string; value: number }
  >();
  const bidirectionalPairs = new Map<
    string,
    {
      forward?: { source: string; target: string; value: number };
      backward?: { source: string; target: string; value: number };
    }
  >();

  links.forEach((link) => {
    const linkKey = `${link.source}->${link.target}`;
    const reverseKey = `${link.target}->${link.source}`;

    linkMap.set(linkKey, link);

    // Check if there's a bidirectional pair
    if (linkMap.has(reverseKey)) {
      const reverseLink = linkMap.get(reverseKey)!;
      const pairKey =
        link.source < link.target
          ? `${link.source}<->${link.target}`
          : `${link.target}<->${link.source}`;

      if (!bidirectionalPairs.has(pairKey)) {
        bidirectionalPairs.set(pairKey, {});
      }

      const pair = bidirectionalPairs.get(pairKey)!;
      if (link.source < link.target) {
        pair.forward = link;
        pair.backward = reverseLink;
      } else {
        pair.forward = reverseLink;
        pair.backward = link;
      }
    }
  });

  // For bidirectional links, keep only the one with higher value
  const linksToRemove = new Set<string>();
  bidirectionalPairs.forEach((pair, pairKey) => {
    if (pair.forward && pair.backward) {
      if (pair.forward.value >= pair.backward.value) {
        linksToRemove.add(`${pair.backward.source}->${pair.backward.target}`);
        console.log(
          `NivoSankey: Bidirectional link detected, keeping forward (${pair.forward.value} >= ${pair.backward.value}):`,
          {
            keeping: `${pair.forward.source}->${pair.forward.target}`,
            removing: `${pair.backward.source}->${pair.backward.target}`,
          },
        );
      } else {
        linksToRemove.add(`${pair.forward.source}->${pair.forward.target}`);
        console.log(
          `NivoSankey: Bidirectional link detected, keeping backward (${pair.backward.value} > ${pair.forward.value}):`,
          {
            keeping: `${pair.backward.source}->${pair.backward.target}`,
            removing: `${pair.forward.source}->${pair.forward.target}`,
          },
        );
      }
    }
  });

  // Remove bidirectional links we decided to drop
  let filteredLinks = links.filter((link) => {
    const linkKey = `${link.source}->${link.target}`;
    return !linksToRemove.has(linkKey);
  });

  // Now detect remaining cycles and break them by removing the weakest link in each cycle
  const graph = new Map<
    string,
    Array<{ target: string; value: number; linkKey: string }>
  >();
  nodes.forEach((node) => {
    graph.set(node, []);
  });

  filteredLinks.forEach((link) => {
    const linkKey = `${link.source}->${link.target}`;
    const neighbors = graph.get(link.source) || [];
    neighbors.push({ target: link.target, value: link.value, linkKey });
    graph.set(link.source, neighbors);
  });

  const cycleLinks = new Set<string>();
  const visited = new Set<string>();
  const recStack = new Set<string>();

  function findCycles(
    node: string,
    path: Array<{ node: string; linkKey?: string }>,
  ): void {
    if (recStack.has(node)) {
      const cycleStart = path.findIndex((p) => p.node === node);
      if (cycleStart >= 0) {
        const cycle = path.slice(cycleStart);
        cycle.push({ node, linkKey: undefined });

        // Find the weakest link in the cycle
        let weakestLink: string | null = null;
        let weakestValue = Infinity;

        for (let i = 0; i < cycle.length - 1; i++) {
          const linkKey = cycle[i].linkKey;
          if (linkKey) {
            const link = filteredLinks.find(
              (l) => `${l.source}->${l.target}` === linkKey,
            );
            if (link && link.value < weakestValue) {
              weakestValue = link.value;
              weakestLink = linkKey;
            }
          }
        }

        if (weakestLink) {
          cycleLinks.add(weakestLink);
          console.log(
            `NivoSankey: Breaking cycle by removing weakest link: ${weakestLink} (value: ${weakestValue})`,
          );
        }
      }
      return;
    }

    if (visited.has(node)) {
      return;
    }

    visited.add(node);
    recStack.add(node);

    const neighbors = graph.get(node) || [];
    for (const neighbor of neighbors) {
      findCycles(neighbor.target, [
        ...path,
        { node, linkKey: neighbor.linkKey },
      ]);
    }

    recStack.delete(node);
  }

  nodes.forEach((node) => {
    if (!visited.has(node)) {
      findCycles(node, []);
    }
  });

  // Remove cycle-breaking links
  filteredLinks = filteredLinks.filter((link) => {
    const linkKey = `${link.source}->${link.target}`;
    return !cycleLinks.has(linkKey);
  });

  if (linksToRemove.size > 0 || cycleLinks.size > 0) {
    console.warn("NivoSankey: Removed links:", {
      bidirectional: linksToRemove.size,
      cycleBreaking: cycleLinks.size,
      totalRemoved: linksToRemove.size + cycleLinks.size,
      remaining: filteredLinks.length,
    });
  }

  return filteredLinks;
}

export function transformToNivoSankey(sankeyData: SankeyData): NivoSankeyData {
  const nodeIdMap = new Map<number, string>();

  const nodes: NivoSankeyNode[] = sankeyData.nodes.map((node, index) => {
    const id = node.name;
    nodeIdMap.set(index, id);
    return { id };
  });

  const allLinks: NivoSankeyLink[] = sankeyData.links
    .map((link) => {
      const sourceId = nodeIdMap.get(link.source);
      const targetId = nodeIdMap.get(link.target);

      if (!sourceId || !targetId || sourceId === targetId) {
        return null;
      }

      return {
        source: sourceId,
        target: targetId,
        value: link.value,
      };
    })
    .filter((link): link is NivoSankeyLink => link !== null);

  const nodeIds = nodes.map((n) => n.id);

  console.log("NivoSankey: Before cycle removal:", {
    nodeCount: nodeIds.length,
    linkCount: allLinks.length,
    links: allLinks.map((l) => `${l.source}->${l.target}`),
  });

  const linksWithoutCycles = removeCyclesSmart(nodeIds, allLinks);

  console.log("NivoSankey: After cycle removal:", {
    originalLinkCount: allLinks.length,
    filteredLinkCount: linksWithoutCycles.length,
    removedCount: allLinks.length - linksWithoutCycles.length,
  });

  return { nodes, links: linksWithoutCycles };
}
