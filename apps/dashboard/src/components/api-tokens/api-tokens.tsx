"use client";

import { Badge } from "@bklit/ui/components/badge";
import { Button } from "@bklit/ui/components/button";
import { ButtonGroup } from "@bklit/ui/components/button-group";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bklit/ui/components/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@bklit/ui/components/dropdown-menu";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@bklit/ui/components/empty";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemSeparator,
  ItemTitle,
} from "@bklit/ui/components/item";
import { format } from "date-fns";
import {
  Layers2,
  MoreHorizontal,
  Pencil,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { DeleteApiTokenForm } from "@/components/forms/delete-api-token-form";
import { UpdateApiTokenForm } from "@/components/forms/update-api-token-form";
import { CreateTokenButton } from "./create-token-button";

interface ApiToken {
  id: string;
  name: string;
  description: string | null;
  tokenPrefix: string;
  allowedDomains: string[];
  createdAt: Date;
  lastUsedAt: Date | null;
  expiresAt: Date | null;
  projects: Array<{ name: string }>;
}

interface ApiTokensProps {
  organizationId: string;
  organizationName: string;
  tokens: ApiToken[];
}

export function ApiTokens({
  organizationId,
  organizationName,
  tokens,
}: ApiTokensProps) {
  const router = useRouter();
  const [editingToken, setEditingToken] = useState<string | null>(null);
  const [deletingToken, setDeletingToken] = useState<{
    id: string;
    name: string;
  } | null>(null);
  return (
    <>
      {tokens.length === 0 ? (
        <Empty className="aspect-3/1 border border-bklit-500 bg-bklit-800/50">
          <EmptyHeader>
            <EmptyMedia>
              <ShieldCheck className="text-bklit-300" size={24} />
            </EmptyMedia>
            <EmptyTitle className="text-base">No API tokens yet</EmptyTitle>
            <EmptyDescription className="text-sm">
              Create your first token to get started.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <CreateTokenButton organizationId={organizationId} />
          </EmptyContent>
        </Empty>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{organizationName} API Tokens</CardTitle>
            <CardDescription>Manage your API tokens</CardDescription>
            <CardAction>
              <CreateTokenButton organizationId={organizationId} />
            </CardAction>
          </CardHeader>
          <CardContent>
            <ItemGroup>
              {tokens.map((token, index) => (
                <>
                  {index > 0 && <ItemSeparator key={`sep-${token.id}`} />}
                  <Item key={token.id}>
                    <ItemContent>
                      <ItemTitle>
                        {token.name}
                        {token.expiresAt ? (
                          <Badge variant="secondary">
                            Expires on{" "}
                            {format(new Date(token.expiresAt), "PPp")}
                          </Badge>
                        ) : (
                          <Badge variant="success">Never expires</Badge>
                        )}
                      </ItemTitle>
                      <ItemDescription>
                        <div className="space-y-1">
                          <div>
                            {token.lastUsedAt
                              ? `Last used on ${format(new Date(token.lastUsedAt), "PPp")}`
                              : "Never used"}
                          </div>
                          {token.allowedDomains &&
                          token.allowedDomains.length > 0 ? (
                            <div className="mt-1 flex flex-wrap gap-1">
                              <span className="text-muted-foreground text-xs">
                                Allowed domains:
                              </span>
                              {token.allowedDomains.map((domain) => (
                                <Badge
                                  className="text-xs"
                                  key={domain}
                                  variant="outline"
                                >
                                  {domain}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <div className="mt-1 text-muted-foreground text-xs">
                              No domain restrictions
                            </div>
                          )}
                        </div>
                      </ItemDescription>
                    </ItemContent>
                    <ItemActions>
                      <ButtonGroup>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="outline">
                              <Layers2 size={14} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent side="bottom">
                            <DropdownMenuLabel>Projects</DropdownMenuLabel>
                            {token.projects.map((project) => (
                              <DropdownMenuItem key={project.name}>
                                {project.name}
                              </DropdownMenuItem>
                            ))}
                          </DropdownMenuContent>
                        </DropdownMenu>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="outline">
                              <MoreHorizontal size={14} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent side="bottom">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => setEditingToken(token.id)}
                            >
                              <Pencil size={14} />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() =>
                                setDeletingToken({
                                  id: token.id,
                                  name: token.name,
                                })
                              }
                            >
                              <Trash2 size={14} />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </ButtonGroup>
                    </ItemActions>
                  </Item>
                </>
              ))}
            </ItemGroup>
          </CardContent>
        </Card>
      )}

      {editingToken && (
        <UpdateApiTokenForm
          isOpen={!!editingToken}
          onOpenChange={(open) => {
            if (!open) setEditingToken(null);
          }}
          onSuccess={() => {
            setEditingToken(null);
            toast.success("Token updated successfully");
            router.refresh();
          }}
          organizationId={organizationId}
          tokenId={editingToken}
        />
      )}

      {deletingToken && (
        <DeleteApiTokenForm
          isOpen={!!deletingToken}
          onOpenChange={(open) => {
            if (!open) setDeletingToken(null);
          }}
          onSuccess={() => {
            setDeletingToken(null);
            toast.success("Token deleted successfully");
            router.refresh();
          }}
          organizationId={organizationId}
          tokenId={deletingToken.id}
          tokenName={deletingToken.name}
        />
      )}
    </>
  );
}
