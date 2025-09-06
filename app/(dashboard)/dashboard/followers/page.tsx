import { PageHeader } from "@/components/page-header";
import { FollowersTable } from "@/components/followers/followers-table";

export default function FollowersPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Followers"
        subtitle="Manage your followers and see who's following your events"
      />

      <FollowersTable />
    </div>
  );
}
