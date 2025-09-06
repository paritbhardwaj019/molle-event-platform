import { getAllEventRules } from "@/lib/actions/event-rule";
import { EventRulesTable } from "@/components/admin/event-rules-table";
import { PageHeader } from "@/components/layout/page-header";

export const metadata = {
  title: "Event Rules | Admin Dashboard",
  description: "Manage event rules displayed to users",
};

export default async function EventRulesPage() {
  const result = await getAllEventRules();
  const eventRules = result.success && result.data ? result.data : [];

  return (
    <div className="flex flex-col gap-8 p-8">
      <EventRulesTable eventRules={eventRules} />
    </div>
  );
}
