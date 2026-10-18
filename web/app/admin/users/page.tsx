"use client";

import { ShieldAlert, ShieldCheck, Users as UsersIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ErrorBanner } from "@/components/ui/error-banner";
import { api, ApiError } from "@/lib/api-client";
import type { AdminUser, UserRole } from "@/lib/types";
import { useRequireAuth } from "@/lib/use-require-auth";

const ROLE_STYLES: Record<UserRole, string> = {
  intern: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  supervisor: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  admin: "bg-brand/15 text-brand",
};

export default function AdminUsersPage() {
  const { user, isLoading: authLoading } = useRequireAuth();
  const router = useRouter();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setUsers(await api.getAdminUsers());
    } catch {
      setError("Couldn't load users.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && user && user.role !== "admin") {
      router.replace("/feed");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user?.role === "admin") load();
  }, [user, load]);

  async function toggleStatus(target: AdminUser) {
    const nextStatus = target.status === "active" ? "disabled" : "active";
    setBusyId(target.id);
    setError(null);
    try {
      const updated = await api.setUserStatus(target.id, nextStatus);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't update that account.");
    } finally {
      setBusyId(null);
    }
  }

  async function changeRole(target: AdminUser, role: UserRole) {
    if (role === target.role) return;
    setBusyId(target.id);
    setError(null);
    try {
      const updated = await api.setUserRole(target.id, role);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't change that role.");
    } finally {
      setBusyId(null);
    }
  }

  if (authLoading || !user || user.role !== "admin") return null;

  return (
    <AppShell>
      <div>
        <div className="mb-4 flex items-center gap-2">
          <UsersIcon className="h-5 w-5 text-brand" />
          <h1 className="text-lg font-semibold">Users</h1>
          {users.length > 0 && (
            <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
              {users.length} total
            </span>
          )}
        </div>

        {error && (
          <div className="mb-4">
            <ErrorBanner message={error} />
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="animate-pulse rounded-2xl border border-black/5 bg-white/60 p-4 dark:border-white/10 dark:bg-white/5"
              >
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 shrink-0 rounded-full bg-black/10 dark:bg-white/10" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3.5 w-32 rounded bg-black/10 dark:bg-white/10" />
                    <div className="h-3 w-24 rounded bg-black/10 dark:bg-white/10" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2.5">
            {users.map((u) => {
              const isSelf = u.id === user.id;
              return (
                <div
                  key={u.id}
                  className="flex flex-col gap-3 rounded-2xl border border-black/5 bg-white/60 p-4 shadow-sm sm:flex-row sm:items-center dark:border-white/10 dark:bg-white/5"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar name={u.fullName} src={u.avatarUrl} size={44} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold">{u.fullName}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${ROLE_STYLES[u.role]}`}
                        >
                          {u.role}
                        </span>
                        {u.status === "disabled" && (
                          <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-medium text-red-500">
                            Blocked
                          </span>
                        )}
                        {isSelf && (
                          <span className="text-xs text-foreground/40">(you)</span>
                        )}
                      </div>
                      <p className="truncate text-sm text-foreground/50">
                        @{u.username} · {u.email}
                      </p>
                    </div>
                  </div>

                  {!isSelf && (
                    <div className="flex items-center gap-2 sm:ml-auto sm:shrink-0">
                      <select
                        value={u.role}
                        disabled={busyId === u.id}
                        onChange={(e) => changeRole(u, e.target.value as UserRole)}
                        className="min-w-0 flex-1 rounded-lg border border-black/10 bg-transparent px-2.5 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:opacity-60 sm:flex-none dark:border-white/10"
                      >
                        <option value="intern">Intern</option>
                        <option value="supervisor">Supervisor</option>
                        <option value="admin">Admin</option>
                      </select>

                      <Button
                        variant={u.status === "active" ? "danger" : "ghost"}
                        loading={busyId === u.id}
                        onClick={() => toggleStatus(u)}
                        className="shrink-0"
                      >
                        {busyId !== u.id &&
                          (u.status === "active" ? (
                            <ShieldAlert className="h-4 w-4" />
                          ) : (
                            <ShieldCheck className="h-4 w-4" />
                          ))}
                        {u.status === "active" ? "Block" : "Unblock"}
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppShell>
  );
}
