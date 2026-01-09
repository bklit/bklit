"use client";

import { Badge } from "@bklit/ui/components/badge";
import { Button } from "@bklit/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bklit/ui/components/card";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@bklit/ui/components/item";
import { Skeleton } from "@bklit/ui/components/skeleton";
import { useQuery } from "@tanstack/react-query";
import { ExternalLink } from "lucide-react";
import { authClient } from "@/auth/client";
import { useTRPC } from "@/trpc/react";

interface BillingDetailsCardProps {
  organizationId: string;
}

export function BillingDetailsCard({
  organizationId,
}: BillingDetailsCardProps) {
  const trpc = useTRPC();

  const {
    data: billingDetails,
    isLoading,
    error,
  } = useQuery(
    trpc.organization.getBillingDetails.queryOptions({
      organizationId,
    })
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Billing Details</CardTitle>
          <CardDescription>Billing information and invoices</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Skeleton className="h-4 w-32" />
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Billing Details</CardTitle>
          <CardDescription>Billing information and invoices</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
            <p className="text-destructive text-sm">
              Unable to load billing details
            </p>
            <p className="mt-1 text-muted-foreground text-xs">
              Please try refreshing the page or contact support if the issue
              persists.
            </p>
          </div>
          <Button
            className="w-full"
            onClick={async () => {
              await authClient.customer.portal();
            }}
            variant="outline"
          >
            <ExternalLink className="mr-2 size-4" />
            Manage Billing
          </Button>
        </CardContent>
      </Card>
    );
  }

  const hasInvoices =
    billingDetails?.invoices && billingDetails.invoices.length > 0;
  const hasNextInvoice = billingDetails?.nextInvoice !== null;
  const hasCustomerId = !!billingDetails?.customerId;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invoices</CardTitle>
        <CardDescription>Your past and upcoming invoices</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {hasCustomerId &&
          (hasNextInvoice && billingDetails.nextInvoice ? (
            <Item className="bg-bklit-600/30" variant="outline">
              <ItemContent>
                <ItemTitle>
                  {new Intl.NumberFormat("en-US", {
                    style: "currency",
                    currency: billingDetails.nextInvoice.currency.toUpperCase(),
                  }).format(billingDetails.nextInvoice.amount / 100)}
                </ItemTitle>
                <ItemDescription>
                  Due on{" "}
                  {new Date(
                    billingDetails.nextInvoice.dueDate
                  ).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </ItemDescription>
              </ItemContent>
              <ItemActions>
                <Badge size="lg" variant="alternative">
                  Due soon
                </Badge>
              </ItemActions>
            </Item>
          ) : (
            <Item>
              <ItemContent>
                <ItemTitle>No upcoming invoices</ItemTitle>
                <ItemDescription>
                  You don't have any upcoming invoices
                </ItemDescription>
              </ItemContent>
            </Item>
          ))}

        {hasInvoices ? (
          <ItemGroup>
            {billingDetails.invoices.map((invoice) => (
              <Item
                className="rounded-t-none rounded-b-none border-b-0 first:rounded-t-md last:rounded-b-md last:border-b"
                key={invoice.id}
                size="sm"
                variant="outline"
              >
                <ItemContent>
                  <ItemTitle>
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: invoice.currency.toUpperCase(),
                    }).format(invoice.amount / 100)}

                    {invoice.invoiceNumber && <>#{invoice.invoiceNumber}</>}
                  </ItemTitle>
                  <ItemDescription>
                    {new Date(invoice.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </ItemDescription>
                </ItemContent>
                <ItemActions>
                  <Badge
                    className="capitalize"
                    size="lg"
                    variant={
                      invoice.status === "paid" ? "success" : "secondary"
                    }
                  >
                    {invoice.status}
                  </Badge>
                </ItemActions>
              </Item>
            ))}
          </ItemGroup>
        ) : (
          <Item className="bg-bklit-600/30" variant="outline">
            <ItemContent>
              <ItemTitle>No previous invoices</ItemTitle>
              <ItemDescription>
                You haven't had any previous invoices
              </ItemDescription>
            </ItemContent>
          </Item>
        )}
      </CardContent>
    </Card>
  );
}
