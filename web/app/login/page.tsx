"use client";

import { Lock, LogIn, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { ErrorBanner } from "@/components/ui/error-banner";
import { TextField } from "@/components/ui/text-field";
import { api, ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [needsVerification, setNeedsVerification] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNeedsVerification(false);
    setSubmitting(true);
    try {
      await login({ email, password });
      router.push("/feed");
    } catch (err) {
      if (err instanceof ApiError && err.message === "EMAIL_NOT_VERIFIED") {
        setNeedsVerification(true);
      } else {
        setError(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    setResending(true);
    try {
      await api.resendVerification(email);
      setResent(true);
      setTimeout(() => setResent(false), 5000);
    } finally {
      setResending(false);
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Log in to see what your community has been up to."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <ErrorBanner message={error} />}
        {needsVerification && (
          <div className="space-y-2 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3.5 py-3 text-sm text-amber-700 dark:text-amber-400">
            <p>Please verify your email before logging in.</p>
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="font-medium underline underline-offset-2 disabled:opacity-60"
            >
              {resent ? "Verification email sent ✓" : "Resend verification email"}
            </button>
          </div>
        )}

        <TextField
          label="Email"
          icon={Mail}
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@dawoodtech.com"
        />

        <div className="space-y-1.5">
          <TextField
            label="Password"
            icon={Lock}
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
          <div className="text-right">
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-brand hover:underline"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <Button type="submit" loading={submitting} className="w-full">
          {!submitting && <LogIn className="h-4 w-4" />}
          Log in
        </Button>

        <p className="text-center text-sm text-foreground/60">
          New here?{" "}
          <Link href="/signup" className="font-medium text-brand hover:underline">
            Create an account
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
