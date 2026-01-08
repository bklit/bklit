"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@bklit/ui/components/card";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@bklit/ui/components/pagination";
import { Skeleton } from "@bklit/ui/components/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@bklit/ui/components/table";
import { format } from "date-fns";
import Link from "next/link";

interface Funnel {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  steps: Array<{
    id: string;
    stepOrder: number;
  }>;
}

interface PaginationInfo {
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface FunnelsTableProps {
  organizationId: string;
  projectId: string;
  funnels: Funnel[];
  isLoading: boolean;
  pagination?: PaginationInfo;
  onPageChange: (page: number) => void;
}

export function FunnelsTable({
  organizationId,
  projectId,
  funnels,
  isLoading,
  pagination,
  onPageChange,
}: FunnelsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Funnels</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton className="h-12 w-full" key={i} />
            ))}
          </div>
        ) : funnels.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            No funnels found
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Steps</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Conversion Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {funnels.map((funnel) => (
                  <TableRow key={funnel.id}>
                    <TableCell className="font-medium">
                      <Link
                        className="hover:underline"
                        href={`/${organizationId}/${projectId}/funnels/${funnel.id}`}
                      >
                        {funnel.name}
                      </Link>
                    </TableCell>
                    <TableCell>{funnel.steps.length}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(funnel.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      — {/* Placeholder for conversion rate */}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {pagination && pagination.totalPages > 1 && (
              <div className="mt-4">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        className={
                          pagination.hasPreviousPage
                            ? "cursor-pointer"
                            : "pointer-events-none opacity-50"
                        }
                        onClick={() => {
                          if (pagination.hasPreviousPage) {
                            onPageChange(pagination.page - 1);
                          }
                        }}
                      />
                    </PaginationItem>
                    {Array.from(
                      { length: pagination.totalPages },
                      (_, i) => i + 1
                    ).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          className="cursor-pointer"
                          isActive={page === pagination.page}
                          onClick={() => onPageChange(page)}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext
                        className={
                          pagination.hasNextPage
                            ? "cursor-pointer"
                            : "pointer-events-none opacity-50"
                        }
                        onClick={() => {
                          if (pagination.hasNextPage) {
                            onPageChange(pagination.page + 1);
                          }
                        }}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
