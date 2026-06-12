import WorkspaceLoader from "@/components/ui/WorkspaceLoader";

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-primary/10">
      <WorkspaceLoader fullHeight={false} label="Loading workspace..." sublabel="Preparing your dashboard" />
    </div>
  );
}
