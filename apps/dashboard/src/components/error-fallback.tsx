import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@bklit/ui/components/card";

interface ErrorFallbackProps {
  error: Error;
  title?: string;
  description?: string;
}

export function ErrorFallback({
  error,
  title = "Unable to Display Chart",
  description,
}: ErrorFallbackProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="flex h-[400px] flex-col items-center justify-center gap-2 text-muted-foreground text-sm">
          <p className="font-medium">
            An error occurred while rendering this chart
          </p>
          <p className="text-xs">{error.message}</p>
        </div>
      </CardContent>
    </Card>
  );
}
