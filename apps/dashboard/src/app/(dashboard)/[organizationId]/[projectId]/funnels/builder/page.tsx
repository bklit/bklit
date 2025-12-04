import { PageHeader } from "@/components/header/page-header";
import {
  FunnelBuilder,
  SaveFunnelButton,
} from "@/components/reactflow/funnel-builder/funnel-builder";

export default function FunnelsPage() {
  return (
    <div className="w-full flex-1 flex flex-col gap-4 h-full">
      <PageHeader title="Funnels" description="Build your funnels with ease.">
        <SaveFunnelButton />
      </PageHeader>
      <FunnelBuilder />
    </div>
  );
}
