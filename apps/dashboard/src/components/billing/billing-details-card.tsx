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
import { Skeleton } from "@bklit/ui/components/skeleton";
import { useQuery } from "@tanstack/react-query";
import {
  Calendar,
  ExternalLink,
  FileText,
  MapPin,
  Receipt,
  User,
} from "lucide-react";
import { CircleFlag } from "react-circle-flags";
import { authClient } from "@/auth/client";
import { getAlpha2Code } from "@/lib/maps/country-coordinates";
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
    }),
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Billing Details</CardTitle>
          <CardDescription>Billing information and invoices</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Billing Information Skeleton */}
          <div className="space-y-3">
            <Skeleton className="h-4 w-32" />
            <div className="space-y-2">
              <Skeleton className="h-20 w-full" />
            </div>
          </div>

          {/* Invoice History Skeleton */}
          <div className="space-y-3">
            <Skeleton className="h-4 w-32" />
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>

          {/* Next Invoice Skeleton */}
          <div className="space-y-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-12 w-full" />
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
          <div className="p-4 rounded-lg border border-destructive/50 bg-destructive/10">
            <p className="text-sm text-destructive">
              Unable to load billing details
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Please try refreshing the page or contact support if the issue
              persists.
            </p>
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={async () => {
              await authClient.customer.portal();
            }}
          >
            <ExternalLink className="size-4 mr-2" />
            Manage Billing
          </Button>
        </CardContent>
      </Card>
    );
  }

  const hasBillingAddress = billingDetails?.billingAddress !== null;
  const hasInvoices =
    billingDetails?.invoices && billingDetails.invoices.length > 0;
  const hasNextInvoice = billingDetails?.nextInvoice !== null;

  // Log billing details to console for debugging
  console.log("[BillingDetailsCard] 🔍 Component received billing details:");
  console.log("[BillingDetailsCard] Raw data:", billingDetails);
  console.log("[BillingDetailsCard] Parsed state:", {
    hasBillingAddress,
    hasInvoices,
    invoicesCount: billingDetails?.invoices?.length || 0,
    hasNextInvoice,
    customerId: billingDetails?.customerId,
  });

  if (billingDetails?.invoices) {
    console.log(
      "[BillingDetailsCard] Invoices array:",
      billingDetails.invoices,
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Billing Details</CardTitle>
        <CardDescription>Billing information and invoices</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Billing Information Section */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <User className="size-4" />
            Billing Information
          </h4>

          {hasBillingAddress || billingDetails?.billingName ? (
            <div className="p-3 rounded-lg border bg-muted/50 space-y-2">
              {billingDetails?.billingName && (
                <div className="flex items-start gap-2">
                  <User className="size-4 text-muted-foreground mt-0.5" />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium">
                      {billingDetails.billingName}
                    </span>
                    {billingDetails.billingEmail && (
                      <span className="text-xs text-muted-foreground">
                        {billingDetails.billingEmail}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {hasBillingAddress && (
                <div className="flex items-start gap-2">
                  <MapPin className="size-4 text-muted-foreground mt-0.5" />
                  <div className="flex flex-col">
                    <span className="text-sm">
                      {billingDetails.billingAddress.line1}
                    </span>
                    {billingDetails.billingAddress.line2 && (
                      <span className="text-sm">
                        {billingDetails.billingAddress.line2}
                      </span>
                    )}
                    <span className="text-sm">
                      {billingDetails.billingAddress.city}
                      {billingDetails.billingAddress.state &&
                        `, ${billingDetails.billingAddress.state}`}{" "}
                      {billingDetails.billingAddress.postalCode}
                    </span>
                    <span className="text-sm flex items-center gap-2">
                      <CircleFlag
                        countryCode={getAlpha2Code(
                          billingDetails.billingAddress.country,
                        )}
                        className="size-4"
                      />
                      {billingDetails.billingAddress.country}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ) : billingDetails?.customerId ? (
            <div className="p-3 rounded-lg border bg-muted/50">
              <div className="flex items-center gap-3">
                <User className="size-5 text-muted-foreground" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    Billing information on file
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Click "Manage Billing" below to view and update
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-lg border border-dashed text-center">
              <p className="text-sm text-muted-foreground">
                No billing information on file
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Upgrade to Pro to add billing details
              </p>
            </div>
          )}
        </div>

        {/* Invoice History Section */}
        <div className="space-y-3 pb-4 border-b">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <Receipt className="size-4" />
            Recent Invoices
          </h4>

          {hasInvoices ? (
            <div className="space-y-2">
              {billingDetails.invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-muted/50"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="size-4 text-muted-foreground" />
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {new Intl.NumberFormat("en-US", {
                            style: "currency",
                            currency: invoice.currency.toUpperCase(),
                          }).format(invoice.amount / 100)}
                        </span>
                        {invoice.invoiceNumber && (
                          <span className="text-xs text-muted-foreground">
                            #{invoice.invoiceNumber}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(invoice.createdAt).toLocaleDateString(
                          "en-US",
                          {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          },
                        )}
                      </span>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs capitalize">
                    {invoice.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-lg border border-dashed text-center">
              <p className="text-sm text-muted-foreground">No invoices yet</p>
            </div>
          )}
        </div>

        {/* Next Invoice Section */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold flex items-center gap-2">
            <Calendar className="size-4" />
            Next Invoice
          </h4>

          {hasNextInvoice ? (
            <div className="p-3 rounded-lg border bg-muted/50">
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-sm font-medium">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency:
                        billingDetails.nextInvoice.currency.toUpperCase(),
                    }).format(billingDetails.nextInvoice.amount / 100)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Due on{" "}
                    {new Date(
                      billingDetails.nextInvoice.dueDate,
                    ).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-lg border border-dashed text-center">
              <p className="text-sm text-muted-foreground">
                No upcoming invoices
              </p>
            </div>
          )}
        </div>

        {/* Manage Subscription Button */}
        <Button
          variant="outline"
          className="w-full"
          onClick={async () => {
            await authClient.customer.portal();
          }}
        >
          <ExternalLink className="size-4 mr-2" />
          Manage Billing
        </Button>
      </CardContent>
    </Card>
  );
}
