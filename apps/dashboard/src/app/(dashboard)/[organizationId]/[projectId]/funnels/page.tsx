import { Button } from "@bklit/ui/components/button";
import { Link, Plus } from "lucide-react";

export default function FunnelsPage() {
  return (
    <div className="h-full min-h-[900px]">
      <Button asChild size="lg">
        <Link href="/funnels/builder">
          <Plus className="mr-2 size-4" />
          Create Funnel
        </Link>
      </Button>
    </div>
  );
}
