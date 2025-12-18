import { polarClient } from "@bklit/auth";
import { TRPCError, type TRPCRouterRecord } from "@trpc/server";
import { z } from "zod/v4";

import { protectedProcedure } from "../trpc";

// Plan limits for usage calculation
enum PlanType {
  FREE = "free",
  PRO = "pro",
}

const PLAN_LIMITS = {
  [PlanType.FREE]: {
    projectLimit: 1,
    teamMemberLimit: 1,
    eventLimit: 4000,
  },
  [PlanType.PRO]: {
    projectLimit: 5,
    teamMemberLimit: 5,
    eventLimit: 10000,
  },
};

function getPlanLimits(planType: PlanType) {
  return PLAN_LIMITS[planType];
}

export const organizationRouter = {
  fetch: protectedProcedure
    .input(
      z.object({
        id: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      const organization = await ctx.prisma.organization.findFirst({
        where: {
          id: input.id,
          members: {
            some: {
              userId: ctx.session.user.id,
            },
          },
        },
        include: {
          projects: true,
          members: {
            include: {
              user: true,
            },
          },
        },
      });

      if (!organization) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const userMembership = organization.members.find(
        (member) => member.userId === ctx.session.user.id,
      );

      if (!userMembership) {
        throw new TRPCError({ code: "UNAUTHORIZED" });
      }

      return {
        ...organization,
        userMembership,
      };
    }),
  list: protectedProcedure.query(({ ctx }) => {
    return ctx.prisma.organization.findMany({
      where: {
        members: {
          some: {
            userId: ctx.session.user.id,
          },
        },
      },
      include: {
        projects: true,
        members: {
          include: {
            user: {
              select: { name: true, email: true, image: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        theme: z.string().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Verify user is admin or owner of organization
      const organization = await ctx.prisma.organization.findFirst({
        where: {
          id: input.id,
          members: {
            some: {
              userId: ctx.session.user.id,
              role: {
                in: ["admin", "owner"],
              },
            },
          },
        },
      });

      if (!organization) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message:
            "Organization not found or you don't have permission to update it",
        });
      }

      return ctx.prisma.organization.update({
        where: { id: input.id },
        data: {
          ...(input.name && { name: input.name }),
          ...(input.theme && { theme: input.theme }),
        },
      });
    }),

  updatePlan: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        plan: z.enum(["free", "pro"]),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Verify user is admin of organization
      const organization = await ctx.prisma.organization.findFirst({
        where: {
          id: input.id,
          members: {
            some: {
              userId: ctx.session.user.id,
              role: "admin", // Only admins can change plan
            },
          },
        },
      });

      if (!organization) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Organization not found or user is not an admin",
        });
      }

      return ctx.prisma.organization.update({
        where: { id: input.id },
        data: { plan: input.plan },
      });
    }),

  getBillingSnapshot: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      // Verify user has access to this organization
      const organization = await ctx.prisma.organization.findFirst({
        where: {
          id: input.organizationId,
          members: {
            some: {
              userId: ctx.session.user.id,
            },
          },
        },
      });

      if (!organization) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Organization not found or you don't have access",
        });
      }

      // Get plan limits
      const planType =
        organization.plan === "pro" ? PlanType.PRO : PlanType.FREE;
      const planLimits = getPlanLimits(planType);

      // Get all projects for this organization
      const projects = await ctx.prisma.project.findMany({
        where: { organizationId: input.organizationId },
        select: { id: true },
      });

      // Fetch active subscriptions from Polar
      let billingData = {
        planName: "free" as const,
        status: "none" as const,
        currentPeriodEnd: null as Date | null,
        amount: null as number | null,
        currency: "usd",
        lastInvoiceDate: null as Date | null,
        lastInvoiceAmount: null as number | null,
        periodStart: null as Date | null,
      };

      try {
        const subscriptions = await ctx.authApi.subscriptions({
          query: {
            page: 1,
            limit: 1,
            active: true,
            referenceId: input.organizationId,
          },
          headers: ctx.headers,
        });

        // Defensive checks for API response structure
        if (
          !subscriptions ||
          typeof subscriptions !== "object" ||
          !subscriptions.result ||
          typeof subscriptions.result !== "object" ||
          !Array.isArray(subscriptions.result.items) ||
          subscriptions.result.items.length === 0
        ) {
          console.warn(
            `[Billing] Malformed or empty subscriptions response for org ${input.organizationId}`,
          );
        } else {
          const activeSubscription = subscriptions.result.items[0];

          if (activeSubscription && organization.plan === "pro") {
            // Pro plan with active subscription
            billingData = {
              planName: "pro" as const,
              status: (activeSubscription.status || "active") as
                | "active"
                | "cancelled",
              currentPeriodEnd: activeSubscription.currentPeriodEnd
                ? new Date(activeSubscription.currentPeriodEnd)
                : null,
              amount: activeSubscription.recurringInterval
                ? (activeSubscription.amount ?? null)
                : null,
              currency: activeSubscription.currency || "usd",
              lastInvoiceDate: activeSubscription.startedAt
                ? new Date(activeSubscription.startedAt)
                : null,
              lastInvoiceAmount: activeSubscription.amount ?? null,
              periodStart: activeSubscription.currentPeriodStart
                ? new Date(activeSubscription.currentPeriodStart)
                : activeSubscription.startedAt
                  ? new Date(activeSubscription.startedAt)
                  : null,
            };
          }
        }
      } catch (error) {
        console.error("Error fetching billing snapshot:", error);
      }

      // Determine billing period start date
      let periodStart: Date;
      if (billingData.periodStart) {
        // Use subscription period start for Pro users
        periodStart = billingData.periodStart;
      } else {
        // Use calendar month for Free users or as fallback
        const now = new Date();
        periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
        periodStart.setHours(0, 0, 0, 0);
      }

      // Count events since period start across all organization projects from ClickHouse
      const usageCounts = await Promise.all(
        projects.map(async (project) => {
          const [pageviews, trackedEvents] = await Promise.all([
            ctx.analytics.countPageViews(project.id, periodStart, new Date()),
            ctx.analytics.countTrackedEvents(
              project.id,
              periodStart,
              new Date(),
            ),
          ]);
          return { pageviews, trackedEvents };
        }),
      );

      // Sum up counts from all projects
      const pageViewCount = usageCounts.reduce(
        (sum, count) => sum + count.pageviews,
        0,
      );
      const trackedEventCount = usageCounts.reduce(
        (sum, count) => sum + count.trackedEvents,
        0,
      );

      const totalEvents = pageViewCount + trackedEventCount;
      const percentageUsed = (totalEvents / planLimits.eventLimit) * 100;

      return {
        ...billingData,
        usage: {
          pageviews: pageViewCount,
          trackedEvents: trackedEventCount,
          total: totalEvents,
          limit: planLimits.eventLimit,
          periodStart,
          percentageUsed,
        },
      };
    }),

  getBillingDetails: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
      }),
    )
    .query(async ({ input, ctx }) => {
      // Verify user has access to this organization
      const organization = await ctx.prisma.organization.findFirst({
        where: {
          id: input.organizationId,
          members: {
            some: {
              userId: ctx.session.user.id,
            },
          },
        },
      });

      if (!organization) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Organization not found or you don't have access",
        });
      }

      // Initialize response data
      const billingDetails: {
        billingAddress: {
          line1: string;
          line2: string | null;
          city: string;
          state: string | null;
          postalCode: string;
          country: string;
        } | null;
        billingEmail: string | null;
        billingName: string | null;
        invoices: Array<{
          id: string;
          amount: number;
          currency: string;
          createdAt: Date;
          status: string;
          url: string | null;
          invoiceNumber: string | null;
        }>;
        nextInvoice: {
          dueDate: Date;
          amount: number;
          currency: string;
        } | null;
        customerId: string | null;
      } = {
        billingAddress: null,
        billingEmail: null,
        billingName: null,
        invoices: [],
        nextInvoice: null,
        customerId: null,
      };

      try {
        // Fetch subscriptions to get customer ID and next invoice info
        const subscriptions = await ctx.authApi.subscriptions({
          query: {
            page: 1,
            limit: 1,
            active: true,
            referenceId: input.organizationId,
          },
          headers: ctx.headers,
        });

        console.log("[Billing Details] Subscriptions API response:", {
          hasResult: !!subscriptions?.result,
          itemsCount: subscriptions?.result?.items?.length || 0,
        });

        const activeSubscription = subscriptions?.result?.items?.[0];

        if (activeSubscription) {
          console.log("[Billing Details] Active subscription found");
          console.log(
            "[Billing Details] Subscription ID:",
            activeSubscription.id,
          );
          console.log(
            "[Billing Details] Customer ID:",
            activeSubscription.customerId,
          );

          const customerId = activeSubscription.customerId;
          billingDetails.customerId = customerId || null;

          if (!customerId) {
            console.warn(
              "[Billing Details] WARNING: No customer ID found in subscription!",
            );
          }

          // Check if subscription itself contains payment method info
          const subData = activeSubscription as any;
          if (subData.stripePaymentMethodId || subData.paymentMethod) {
            console.log(
              "[Billing Details] Payment method found in subscription:",
              subData.paymentMethod || subData.stripePaymentMethodId,
            );
          }

          // Get next invoice details from subscription
          if (
            activeSubscription.currentPeriodEnd &&
            activeSubscription.amount
          ) {
            billingDetails.nextInvoice = {
              dueDate: new Date(activeSubscription.currentPeriodEnd),
              amount: activeSubscription.amount,
              currency: activeSubscription.currency || "usd",
            };
          }

          // Fetch customer details including payment methods if we have a customer ID
          if (customerId) {
            console.log(
              "[Billing Details] ==> Fetching orders for customer:",
              customerId,
            );

            try {
              // Fetch orders/invoices for this customer
              console.log(
                "[Billing Details] Calling polarClient.orders.list with:",
                { customerId, limit: 10 },
              );

              const orders = await polarClient.orders.list({
                customerId,
                limit: 10, // Fetch more to ensure we get paid orders
              });

              console.log("[Billing Details] Orders API response received");
              console.log("[Billing Details] Orders response structure:", {
                hasOrders: !!orders,
                hasResult: !!orders?.result,
                hasItems: !!orders?.result?.items,
                itemsType: typeof orders?.result?.items,
                itemsIsArray: Array.isArray(orders?.result?.items),
                itemsCount: orders?.result?.items?.length || 0,
              });

              if (orders?.result?.items) {
                console.log(
                  "[Billing Details] Raw orders data (first 3):",
                  JSON.stringify(orders.result.items.slice(0, 3), null, 2),
                );
              } else {
                console.warn(
                  "[Billing Details] No orders.result.items found in response!",
                );
                console.log(
                  "[Billing Details] Full orders response:",
                  JSON.stringify(orders, null, 2),
                );
              }

              if (orders?.result?.items && orders.result.items.length > 0) {
                console.log(
                  "[Billing Details] Processing",
                  orders.result.items.length,
                  "orders...",
                );

                // Filter and sort orders - we want completed/paid orders
                const paidOrders = orders.result.items
                  .map((order, index) => {
                    // Cast to access Polar API fields
                    const orderData = order as any;

                    // Log each order to see what fields are available
                    console.log(`[Billing Details] Order #${index + 1}:`, {
                      id: order.id,
                      // Polar API fields
                      totalAmount: orderData.totalAmount,
                      total_amount: orderData.total_amount,
                      paid: orderData.paid,
                      status: orderData.status,
                      invoiceNumber: orderData.invoiceNumber,
                      invoice_number: orderData.invoice_number,
                      isInvoiceGenerated: orderData.isInvoiceGenerated,
                      is_invoice_generated: orderData.is_invoice_generated,
                      createdAt: order.createdAt,
                      created_at: orderData.created_at,
                      currency: order.currency,
                      billingReason: orderData.billingReason,
                      billing_reason: orderData.billing_reason,
                      // Log all available fields
                      allFields: Object.keys(order),
                    });
                    return order;
                  })
                  .filter((order) => {
                    const orderData = order as any;

                    // Check both camelCase and snake_case for Polar API fields
                    const totalAmount =
                      orderData.totalAmount || orderData.total_amount;
                    const isPaid = orderData.paid === true;
                    const createdAt = order.createdAt || orderData.created_at;

                    const hasAmount = !!totalAmount && totalAmount > 0;
                    const hasCreatedAt = !!createdAt;
                    const passes = hasAmount && hasCreatedAt && isPaid;

                    console.log(
                      `[Billing Details] Order ${order.id} filter result:`,
                      {
                        totalAmount,
                        isPaid,
                        hasAmount,
                        hasCreatedAt,
                        passes,
                      },
                    );

                    return passes;
                  })
                  .sort((a, b) => {
                    // Sort by creation date descending (newest first)
                    const orderDataA = a as any;
                    const orderDataB = b as any;
                    const dateA = new Date(
                      a.createdAt || orderDataA.created_at,
                    ).getTime();
                    const dateB = new Date(
                      b.createdAt || orderDataB.created_at,
                    ).getTime();
                    return dateB - dateA;
                  })
                  .slice(0, 3) // Take top 3
                  .map((order) => {
                    const orderData = order as any;
                    const totalAmount =
                      orderData.totalAmount || orderData.total_amount || 0;
                    const invoiceNumber =
                      orderData.invoiceNumber || orderData.invoice_number;

                    return {
                      id: order.id,
                      amount: totalAmount,
                      currency: order.currency || "usd",
                      createdAt: new Date(
                        order.createdAt || orderData.created_at,
                      ),
                      status: orderData.paid
                        ? "paid"
                        : orderData.status || "pending",
                      url: null,
                      invoiceNumber: invoiceNumber || null,
                    };
                  });

                console.log(
                  "[Billing Details] ✅ Processed invoices count:",
                  paidOrders.length,
                );
                console.log(
                  "[Billing Details] ✅ Invoices to display:",
                  paidOrders,
                );
                billingDetails.invoices = paidOrders;
              } else {
                console.warn("[Billing Details] ⚠️ No orders found to process!");
              }
            } catch (error) {
              console.error(
                "[Billing Details] ❌ Error fetching orders from Polar!",
              );
              console.error(
                "[Billing Details] Error type:",
                error?.constructor?.name,
              );
              console.error(
                "[Billing Details] Error message:",
                (error as Error)?.message,
              );
              console.error("[Billing Details] Full error:", error);

              // Try to log more details if it's an API error
              if (error && typeof error === "object") {
                console.error(
                  "[Billing Details] Error keys:",
                  Object.keys(error),
                );
              }
            }

            try {
              // Fetch customer to get billing address and details
              const customer = await polarClient.customers.get({
                id: customerId,
              });

              console.log(
                "[Billing Details] Customer data:",
                JSON.stringify(customer, null, 2),
              );

              if (customer && typeof customer === "object") {
                const customerData = customer as {
                  email?: string;
                  name?: string;
                  billingAddress?: {
                    line1?: string;
                    line2?: string;
                    city?: string;
                    state?: string;
                    postalCode?: string;
                    country?: string;
                  };
                };

                // Set billing email and name
                billingDetails.billingEmail = customerData.email || null;
                billingDetails.billingName = customerData.name || null;

                // Set billing address if available
                if (customerData.billingAddress) {
                  billingDetails.billingAddress = {
                    line1: customerData.billingAddress.line1 || "",
                    line2: customerData.billingAddress.line2 || null,
                    city: customerData.billingAddress.city || "",
                    state: customerData.billingAddress.state || null,
                    postalCode: customerData.billingAddress.postalCode || "",
                    country: customerData.billingAddress.country || "",
                  };
                }
              }
            } catch (error) {
              console.error("Error fetching customer from Polar:", error);
            }
          } else {
            console.warn(
              "[Billing Details] ⚠️ Skipping customer fetch - no customer ID",
            );
          }
        } else {
          console.warn(
            "[Billing Details] ⚠️ No active subscription found for organization:",
            input.organizationId,
          );
        }
      } catch (error) {
        console.error(
          "[Billing Details] ❌ Error in getBillingDetails:",
          error,
        );
        console.error("[Billing Details] Error occurred at top level");
        // Return empty data structure instead of throwing
      }

      console.log(
        "[Billing Details] 📊 Final billing details being returned:",
        {
          hasCustomerId: !!billingDetails.customerId,
          hasBillingAddress: !!billingDetails.billingAddress,
          hasBillingName: !!billingDetails.billingName,
          invoicesCount: billingDetails.invoices.length,
          hasNextInvoice: !!billingDetails.nextInvoice,
        },
      );

      return billingDetails;
    }),

  members: {
    list: protectedProcedure
      .input(
        z.object({
          organizationId: z.string(),
          page: z.number().min(1).default(1),
          limit: z.number().min(1).max(50).default(15),
        }),
      )
      .query(async ({ input, ctx }) => {
        // Verify user is member of organization
        const organization = await ctx.prisma.organization.findFirst({
          where: {
            id: input.organizationId,
            members: {
              some: {
                userId: ctx.session.user.id,
              },
            },
          },
        });

        if (!organization) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Organization not found or you don't have access",
          });
        }

        // Get total count
        const totalCount = await ctx.prisma.member.count({
          where: {
            organizationId: input.organizationId,
          },
        });

        // Get paginated members
        const members = await ctx.prisma.member.findMany({
          where: {
            organizationId: input.organizationId,
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
          skip: (input.page - 1) * input.limit,
          take: input.limit,
        });

        const totalPages = Math.ceil(totalCount / input.limit);

        return {
          members,
          totalCount,
          totalPages,
          currentPage: input.page,
        };
      }),

    updateRole: protectedProcedure
      .input(
        z.object({
          organizationId: z.string(),
          memberId: z.string(),
          role: z.enum(["owner", "admin", "member"]),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        // Verify user is admin or owner of organization
        const organization = await ctx.prisma.organization.findFirst({
          where: {
            id: input.organizationId,
            members: {
              some: {
                userId: ctx.session.user.id,
                role: {
                  in: ["admin", "owner"],
                },
              },
            },
          },
          include: {
            members: true,
          },
        });

        if (!organization) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message:
              "Organization not found or you don't have permission to update roles",
          });
        }

        // Check if the member being updated exists
        const memberToUpdate = organization.members.find(
          (m) => m.id === input.memberId,
        );

        if (!memberToUpdate) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Member not found",
          });
        }

        // Prevent changing the role of the last owner
        if (memberToUpdate.role === "owner") {
          const ownerCount = organization.members.filter(
            (m) => m.role === "owner",
          ).length;

          if (ownerCount === 1 && input.role !== "owner") {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Cannot change the role of the last owner",
            });
          }
        }

        // Update member role
        return ctx.prisma.member.update({
          where: { id: input.memberId },
          data: { role: input.role },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
              },
            },
          },
        });
      }),

    remove: protectedProcedure
      .input(
        z.object({
          organizationId: z.string(),
          memberId: z.string(),
          confirmEmail: z.string().email(),
        }),
      )
      .mutation(async ({ input, ctx }) => {
        // Verify user is admin or owner of organization
        const organization = await ctx.prisma.organization.findFirst({
          where: {
            id: input.organizationId,
            members: {
              some: {
                userId: ctx.session.user.id,
                role: {
                  in: ["admin", "owner"],
                },
              },
            },
          },
          include: {
            members: {
              include: {
                user: true,
              },
            },
          },
        });

        if (!organization) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message:
              "Organization not found or you don't have permission to remove members",
          });
        }

        // Find the member to remove
        const memberToRemove = organization.members.find(
          (m) => m.id === input.memberId,
        );

        if (!memberToRemove) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Member not found",
          });
        }

        // Prevent removing yourself
        if (memberToRemove.userId === ctx.session.user.id) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "You cannot remove yourself from the organization",
          });
        }

        // Verify email matches
        if (memberToRemove.user.email !== input.confirmEmail) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Email does not match",
          });
        }

        // Prevent removing the last owner
        if (memberToRemove.role === "owner") {
          const ownerCount = organization.members.filter(
            (m) => m.role === "owner",
          ).length;

          if (ownerCount === 1) {
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "Cannot remove the last owner",
            });
          }
        }

        // Delete the member
        await ctx.prisma.member.delete({
          where: { id: input.memberId },
        });

        return { success: true };
      }),
  },
} satisfies TRPCRouterRecord;
