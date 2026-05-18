"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useAppSelector } from "@/store";
import { useWorkspaceSocket } from "@/hooks/useWorkspaceSocket";

export default function WorkspaceSocketBridge({ children }) {
  const token = useAppSelector((s) => s.auth.token);
  const queryClient = useQueryClient();
  useWorkspaceSocket(token, queryClient);
  return children;
}
