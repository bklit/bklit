"use client";

import { Badge } from "@bklit/ui/components/badge";
import { Button } from "@bklit/ui/components/button";
import { ButtonGroup } from "@bklit/ui/components/button-group";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@bklit/ui/components/card";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@bklit/ui/components/field";
import { Input } from "@bklit/ui/components/input";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Globe, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { useTRPC } from "@/trpc/react";

const ipSchema = z.string().refine(
  (val) => {
    const trimmed = val.trim();
    if (!trimmed) return false;
    const ipv4 =
      /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const cidrV4 =
      /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\/(?:3[0-2]|[12]?[0-9])$/;
    return ipv4.test(trimmed) || cidrV4.test(trimmed);
  },
  {
    message:
      "Enter a valid IPv4 address or CIDR range (e.g., 192.168.1.1 or 192.168.1.0/24)",
  },
);

interface IpBlacklistSettingsProps {
  projectId: string;
  organizationId: string;
}

export function IpBlacklistSettings({
  projectId,
  organizationId,
}: IpBlacklistSettingsProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [myIp, setMyIp] = useState<string | null>(null);

  // Fetch current blacklist
  const { data: blacklist = [], isLoading } = useQuery(
    trpc.ipBlacklist.list.queryOptions({
      projectId,
      organizationId,
    }),
  );

  // Fetch user's current IP
  useEffect(() => {
    fetch("/api/my-ip")
      .then((res) => res.json())
      .then((data) => setMyIp(data.ip))
      .catch(() => setMyIp(null));
  }, []);

  // Add IP mutation
  const addIp = useMutation(
    trpc.ipBlacklist.add.mutationOptions({
      onSuccess: () => {
        toast.success("IP added to blacklist");
        queryClient.invalidateQueries({
          queryKey: ["ipBlacklist", "list", { projectId, organizationId }],
        });
        form.reset();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  // Remove IP mutation
  const removeIp = useMutation(
    trpc.ipBlacklist.remove.mutationOptions({
      onSuccess: () => {
        toast.success("IP removed from blacklist");
        queryClient.invalidateQueries({
          queryKey: ["ipBlacklist", "list", { projectId, organizationId }],
        });
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const form = useForm({
    defaultValues: {
      ip: "",
    },
    validators: {
      onSubmit: z.object({ ip: ipSchema }),
    },
    onSubmit: async ({ value }) => {
      await addIp.mutateAsync({
        projectId,
        organizationId,
        ip: value.ip.trim(),
      });
    },
  });

  const handleAddMyIp = () => {
    if (myIp) {
      form.setFieldValue("ip", myIp);
    }
  };

  const handleRemoveIp = (ip: string) => {
    removeIp.mutate({
      projectId,
      organizationId,
      ip,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>IP Blacklist</CardTitle>
        <CardDescription>
          Block specific IP addresses or CIDR ranges from being tracked. Blocked
          visitors will not appear in your analytics.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form
          id="add-ip-form"
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          <FieldGroup>
            <form.Field name="ip">
              {(field) => {
                const errors = field.state.meta.errors;
                const hasErrors = errors && errors.length > 0;
                return (
                  <Field data-invalid={hasErrors ? true : undefined}>
                    <FieldLabel htmlFor={field.name}>
                      IP Address or CIDR Range
                    </FieldLabel>
                    <ButtonGroup className="w-full">
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="192.168.1.1 or 192.168.1.0/24"
                      />
                      {myIp && (
                        <Button
                          type="button"
                          variant="outline"
                          className="h-12"
                          onClick={handleAddMyIp}
                        >
                          <Globe className="size-4 mr-2" />
                          Add My IP
                        </Button>
                      )}
                    </ButtonGroup>
                    <FieldDescription>
                      {myIp ? (
                        <span>Your current IP: {myIp}</span>
                      ) : (
                        <span>
                          Enter an IP address or CIDR range to block from
                          tracking
                        </span>
                      )}
                    </FieldDescription>
                    {hasErrors && (
                      <FieldError>
                        {errors
                          .map((e) =>
                            typeof e === "string" ? e : e?.message || String(e),
                          )
                          .join(", ")}
                      </FieldError>
                    )}
                  </Field>
                );
              }}
            </form.Field>
          </FieldGroup>
        </form>

        {/* Blacklisted IPs list */}
        <div className="space-y-2">
          <FieldLabel>Blacklisted IPs</FieldLabel>
          {isLoading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : blacklist.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              No IPs have been added to the blacklist yet.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {blacklist.map((ip) => (
                <Badge
                  key={ip}
                  variant="secondary"
                  className="flex items-center gap-1 pl-3 pr-1 py-1.5"
                >
                  <span className="font-mono text-sm">{ip}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="size-6 p-0 hover:bg-destructive hover:text-destructive-foreground"
                    onClick={() => handleRemoveIp(ip)}
                    disabled={removeIp.isPending}
                  >
                    <Trash2 className="size-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button type="submit" form="add-ip-form" disabled={addIp.isPending}>
          <Plus className="size-4 mr-2" />
          {addIp.isPending ? "Adding..." : "Add to Blacklist"}
        </Button>
      </CardFooter>
    </Card>
  );
}
