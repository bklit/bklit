"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bklit/ui/components/card";
import { SankeyNivo } from "@bklit/ui/components/charts/sankey-nivo";
import { transformToNivoSankey } from "./sankey-utils";
import { Button } from "@bklit/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@bklit/ui/components/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import { Filter } from "lucide-react";
import { parseAsIsoDateTime, useQueryStates } from "nuqs";
import { useEffect, useMemo, useState } from "react";
import { useTRPC } from "@/trpc/react";

interface UserJourneysProps {
  organizationId: string;
  projectId: string;
}

export function UserJourneys({
  organizationId,
  projectId,
}: UserJourneysProps) {
  const trpc = useTRPC();

  const [dateParams] = useQueryStates(
    {
      startDate: parseAsIsoDateTime,
      endDate: parseAsIsoDateTime,
    },
    {
      history: "push",
    },
  );

  const startDate = useMemo(() => {
    if (dateParams.startDate) return dateParams.startDate;
    if (!dateParams.endDate) return undefined;
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  }, [dateParams.startDate, dateParams.endDate]);

  const endDate = dateParams.endDate ?? undefined;

  const { data: journeysData, isLoading } = useQuery({
    ...trpc.session.getJourneys.queryOptions({
      projectId,
      organizationId,
      startDate,
      endDate,
    }),
  });

  const allPages = useMemo(() => {
    if (!journeysData?.nodes) return [];
    return journeysData.nodes.map((node) => node.name);
  }, [journeysData]);

  const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (allPages.length > 0) {
      setSelectedPages((prev) => {
        if (prev.size === 0) {
          return new Set(allPages);
        }
        const next = new Set(prev);
        allPages.forEach((page) => {
          if (!next.has(page)) {
            next.add(page);
          }
        });
        return next;
      });
    }
  }, [allPages]);

  const filteredData = useMemo(() => {
    if (!journeysData) return undefined;

    const selectedPageSet = new Set(selectedPages);
    const nodeIndices = new Map<number, number>();
    let newIndex = 0;

    journeysData.nodes.forEach((node, originalIndex) => {
      if (selectedPageSet.has(node.name)) {
        nodeIndices.set(originalIndex, newIndex);
        newIndex++;
      }
    });

    const filteredNodes = journeysData.nodes.filter((node) =>
      selectedPageSet.has(node.name),
    );

    const filteredLinks = journeysData.links
      .map((link) => {
        const sourceIndex = nodeIndices.get(link.source);
        const targetIndex = nodeIndices.get(link.target);
        if (sourceIndex === undefined || targetIndex === undefined) {
          return null;
        }
        return {
          source: sourceIndex,
          target: targetIndex,
          value: link.value,
        };
      })
      .filter(
        (
          link,
        ): link is { source: number; target: number; value: number } =>
          link !== null,
      );

    const rechartsData = { nodes: filteredNodes, links: filteredLinks };
    return transformToNivoSankey(rechartsData);
  }, [journeysData, selectedPages]);

  const togglePage = (page: string) => {
    setSelectedPages((prev) => {
      const next = new Set(prev);
      if (next.has(page)) {
        next.delete(page);
      } else {
        next.add(page);
      }
      return next;
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Journeys</CardTitle>
          <CardDescription>
            Flow of users through your site pages
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center text-sm text-muted-foreground">
            Loading chart...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!filteredData || filteredData.nodes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Journeys</CardTitle>
          <CardDescription>
            Flow of users through your site pages
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px] flex items-center justify-center text-sm text-muted-foreground">
            No data available
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="grid flex-1 gap-1">
            <CardTitle>User Journeys</CardTitle>
            <CardDescription>
              Flow of users through your site pages
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="size-4 mr-2" />
                Filter Pages
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel>Pages</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {allPages.map((page) => (
                <DropdownMenuCheckboxItem
                  key={page}
                  checked={selectedPages.has(page)}
                  onCheckedChange={() => togglePage(page)}
                >
                  {page}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="w-full min-h-[400px]">
          <SankeyNivo data={filteredData} />
        </div>
      </CardContent>
    </Card>
  );
}

