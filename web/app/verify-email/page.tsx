"use client";

import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api-client";

type Status = "verifying" | "success" | "error";

function VerifyEmailContent() {
  const token = useSearchParams().get("token");
  const [status, setStatus] = useState<Status>("verifying");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setError("This verification link is missing its token.");
      return;
    }
    api
      .verifyEmail(token)
      .then(() => setStatus("success"))
      .catch((err) => {
        setStatus("error");
        setError(err instanceof ApiError ? err.message : "Couldn't verify this link.");
      });
  }, [token]);

  return (
    <AuthShell title="Email verification" subtitle="Almost there.">
      <div className="space-y-4 text-center">
        {status === "verifying" && (
          <>
            <Loader2 className="mx-auto h-10 w-10 animate-spin text-brand" />
            <p className="text-sm text-foreground/60">Verifying your email…</p>
          </>
        )}

        {status === "success" && (
          <>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <p className="text-sm text-foreground/70">
              Your email is verified. You can log in now.
            </p>
            <Link href="/login">
              <Button className="w-full">Go to login</Button>
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10 text-red-500">
              <XCircle className="h-7 w-7" />
            </div>
            <p className="text-sm text-foreground/70">{error}</p>
            <Link href="/login">
              <Button variant="ghost" className="w-full">
                Back to login
              </Button>
            </Link>
          </>
        )}
      </div>
    </AuthShell>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}
