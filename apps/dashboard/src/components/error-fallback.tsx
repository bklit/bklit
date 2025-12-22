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
        <div className="h-[400px] flex items-center justify-center flex-col gap-2 text-sm text-muted-foreground">
          <p className="font-medium">An error occurred while rendering this chart</p>
          <p className="text-xs">{error.message}</p>
        </div>
      </CardContent>
    </Card>
  );
}

