"use client";

import { useAppDispatch, useAppSelector } from "@/store";
import { logout } from "@/store/authSlice";
import { useAuthGuard } from "@/hooks/useAuthGuard";

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { isAuthenticated, profile } = useAuthGuard();
  const activeUser = profile?.user || profile?.data || user;

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-6 py-12 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-text-heading">
            Welcome back{activeUser?.firstName ? `, ${activeUser.firstName}` : "!"}
          </h1>
          <p className="text-text-body mt-2">
            You are authenticated. Use the navigation to explore the app.
          </p>
        </div>

        <div className="bg-background-light/50 border border-border rounded-xl p-4 shadow-sm">
          <p className="text-sm text-text-heading font-semibold">Profile</p>
          <p className="text-sm text-text-body">
            Email: {activeUser?.email || "Not provided"}
          </p>
        </div>

        <button
          onClick={() => {
            dispatch(logout());
          }}
          className="h-12 w-full max-w-xs bg-gradient-to-r from-primary to-primary-dark rounded-xl flex flex-col justify-center items-center cursor-pointer text-white font-semibold shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/50 transition-all duration-300"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
