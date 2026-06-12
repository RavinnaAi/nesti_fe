"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useAppSelector } from "@/store";
import { useProfileQuery } from "@/hooks/useAuthApi";
import { useWorkspaceSocket } from "@/hooks/useWorkspaceSocket";

export default function WorkspaceSocketBridge({ children }) {
  const token = useAppSelector((s) => s.auth.token);
  const queryClient = useQueryClient();
  useProfileQuery();
  useWorkspaceSocket(token, queryClient);
  return children;
}
