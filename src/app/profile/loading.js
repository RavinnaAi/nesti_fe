import WorkspaceLoader from "@/components/ui/WorkspaceLoader";

export default function ProfileLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <WorkspaceLoader fullHeight={false} label="Loading workspace..." sublabel="Preparing profile" />
    </div>
  );
}
