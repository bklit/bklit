"use client";

import { Button } from "@bklit/ui/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bklit/ui/components/card";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { CreateApiTokenForm } from "@/components/forms/create-api-token-form";
import { DeleteApiTokenForm } from "@/components/forms/delete-api-token-form";
import { UpdateApiTokenForm } from "@/components/forms/update-api-token-form";
import { useTRPC } from "@/trpc/react";

interface ApiTokensProps {
  organizationId: string;
}

export function ApiTokens({ organizationId }: ApiTokensProps) {
  const trpc = useTRPC();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingToken, setEditingToken] = useState<string | null>(null);
  const [deletingToken, setDeletingToken] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const { data: tokens, isLoading } = useQuery(
    trpc.apiToken.list.queryOptions({ organizationId }),
  );

  if (isLoading) {
    return <div>Loading tokens...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">API Tokens</h2>
          <p className="text-muted-foreground">
            Create and manage API tokens to authenticate your tracking requests.
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 size-4" />
          Create Token
        </Button>
      </div>

      {tokens && tokens.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No API tokens yet. Create your first token to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {tokens?.map((token) => (
            <Card key={token.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{token.name}</CardTitle>
                    {token.description && (
                      <CardDescription className="mt-1">
                        {token.description}
                      </CardDescription>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingToken(token.id)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() =>
                        setDeletingToken({ id: token.id, name: token.name })
                      }
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Prefix: </span>
                    <code className="rounded bg-muted px-1 py-0.5">
                      {token.tokenPrefix}****
                    </code>
                  </div>
                  <div>
                    <span className="font-medium">Projects: </span>
                    {token.projects.length > 0 ? (
                      <span>
                        {token.projects.map((p) => p.name).join(", ")}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">
                        No projects assigned
                      </span>
                    )}
                  </div>
                  <div>
                    <span className="font-medium">Created: </span>
                    {format(new Date(token.createdAt), "PPp")}
                  </div>
                  {token.lastUsedAt && (
                    <div>
                      <span className="font-medium">Last used: </span>
                      {format(new Date(token.lastUsedAt), "PPp")}
                    </div>
                  )}
                  {token.expiresAt && (
                    <div>
                      <span className="font-medium">Expires: </span>
                      {format(new Date(token.expiresAt), "PPp")}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <CreateApiTokenForm
        organizationId={organizationId}
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={() => {
          // Dialog closes automatically via onOpenChange when user clicks "Done"
          // Don't close it here or the token won't be visible
        }}
      />

      {editingToken && (
        <UpdateApiTokenForm
          organizationId={organizationId}
          tokenId={editingToken}
          isOpen={!!editingToken}
          onOpenChange={(open) => {
            if (!open) setEditingToken(null);
          }}
          onSuccess={() => {
            setEditingToken(null);
            toast.success("Token updated successfully");
          }}
        />
      )}

      {deletingToken && (
        <DeleteApiTokenForm
          organizationId={organizationId}
          tokenId={deletingToken.id}
          tokenName={deletingToken.name}
          isOpen={!!deletingToken}
          onOpenChange={(open) => {
            if (!open) setDeletingToken(null);
          }}
          onSuccess={() => {
            setDeletingToken(null);
            toast.success("Token deleted successfully");
          }}
        />
      )}
    </div>
  );
}
