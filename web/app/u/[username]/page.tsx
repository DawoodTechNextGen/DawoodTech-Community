"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api-client";
import { useRequireAuth } from "@/lib/use-require-auth";

/** /u/<username> — where @mention links point; forwards to the profile. */
export default function UsernameRedirectPage() {
  const { username } = useParams<{ username: string }>();
  const { user } = useRequireAuth();
  const router = useRouter();
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    if (!user) return;
    api
      .getUserByUsername(username)
      .then((found) => router.replace(`/profile/${found.id}`))
      .catch(() => setMissing(true));
  }, [user, username, router]);

  return missing ? (
    <p className="p-8 text-center text-sm text-foreground/50">No member called @{username}.</p>
  ) : null;
}
