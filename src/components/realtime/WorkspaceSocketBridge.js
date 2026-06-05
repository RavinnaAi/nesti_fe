"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useAppSelector } from "@/store";
import { useProfileQuery } from "@/hooks/useAuthApi";
import { useWorkspaceSocket } from "@/hooks/useWorkspaceSocket";

export default function WorkspaceSocketBridge({ children }) {
  const token = useAppSelector((s) => s.auth.token);
  const queryClient = useQueryClient();
  const profileQuery = useProfileQuery();
  const profileComplete =
    profileQuery.isSuccess &&
    profileQuery.data?.profile_setup?.is_complete !== false;

  useWorkspaceSocket(profileComplete ? token : null, queryClient);
  return children;
}
