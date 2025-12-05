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
            {Array.from({ length: 5 }, () => (
              <Skeleton key={crypto.randomUUID()} className="h-12 w-full" />
            ))}
          </div>
        ) : funnels.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
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
                        href={`/${organizationId}/${projectId}/funnels/${funnel.id}`}
                        className="hover:underline"
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
                        onClick={() => {
                          if (pagination.hasPreviousPage) {
                            onPageChange(pagination.page - 1);
                          }
                        }}
                        className={
                          !pagination.hasPreviousPage
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
                      (page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => onPageChange(page)}
                            isActive={page === pagination.page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ),
                    )}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => {
                          if (pagination.hasNextPage) {
                            onPageChange(pagination.page + 1);
                          }
                        }}
                        className={
                          !pagination.hasNextPage
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
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

