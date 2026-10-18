"use client";

import { Hash } from "lucide-react";
import { useParams } from "next/navigation";
import { useCallback } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { PostStream } from "@/components/posts/post-stream";
import { api } from "@/lib/api-client";
import { useRequireAuth } from "@/lib/use-require-auth";

export default function TagPage() {
  const { tag } = useParams<{ tag: string }>();
  const { user, isLoading: authLoading } = useRequireAuth();
  const fetchPage = useCallback((cursor?: string) => api.getTagPosts(tag, cursor), [tag]);

  if (authLoading || !user) return null;

  return (
    <AppShell>
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Hash className="h-5 w-5 text-brand" />
          <h1 className="text-lg font-semibold">{decodeURIComponent(tag)}</h1>
        </div>
        <PostStream key={tag} fetchPage={fetchPage} emptyText={`No posts tagged #${tag} yet.`} />
      </div>
    </AppShell>
  );
}
