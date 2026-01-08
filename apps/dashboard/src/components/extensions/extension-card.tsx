"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@bklit/ui/components/avatar";
import { Badge } from "@bklit/ui/components/badge";
import { Button } from "@bklit/ui/components/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@bklit/ui/components/card";
import { Separator } from "@bklit/ui/components/separator";
import { Puzzle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface ExtensionCardProps {
  id: string;
  displayName: string;
  description: string;
  author: string;
  category: string;
  isPro: boolean;
  organizationId: string;
  icon?: string;
}

export function ExtensionCard({
  id,
  displayName,
  description,
  author,
  category,
  isPro,
  organizationId,
  icon,
}: ExtensionCardProps) {
  return (
    <Card className="relative flex flex-col overflow-hidden">
      {/* 
       ** Felt cute might add back later
      {icon && (
        <Image
          src={`/extensions/${id}/${icon.replace("./", "")}`}
          alt={displayName}
          width={40}
          height={40}
          className="absolute -left-2/3 -top-full size-96 object-cover blur-3xl opacity-10"
        />
      )} */}
      <CardHeader className="relative">
        <CardTitle className="flex items-center gap-2">
          <div className="flex size-10 items-center justify-center overflow-hidden rounded-md border bg-muted">
            {icon ? (
              <Image
                alt={displayName}
                className="size-10 object-cover"
                height={40}
                src={`/extensions/${id}/${icon.replace("./", "")}`}
                width={40}
              />
            ) : (
              <Puzzle className="size-5" />
            )}
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-lg">{displayName}</span>
            {isPro && (
              <Badge className="text-xs" variant="default">
                Pro
              </Badge>
            )}
          </div>
        </CardTitle>
        <CardDescription className="mt-1 flex items-center gap-1.5 text-xs" />
        <CardAction>
          <Button asChild size="sm" variant="secondary">
            <Link href={`/${organizationId}/extensions/${id}`}>
              View Details
            </Link>
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="relative">
        <p className="mb-4 flex-1 text-muted-foreground text-sm">
          {description}
        </p>
      </CardContent>
      <CardFooter className="flex items-center gap-2">
        <div className="flex items-center gap-2">
          <Avatar className="size-4">
            <AvatarImage
              alt={author}
              src={`https://github.com/${author}.png`}
            />
            <AvatarFallback className="text-[8px]">
              {author.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <span className="font-semibold text-sm">{author}</span>
        </div>
        <Separator orientation="vertical" />
        <Badge className="text-xs" variant="secondary">
          {category}
        </Badge>
      </CardFooter>
    </Card>
  );
}
