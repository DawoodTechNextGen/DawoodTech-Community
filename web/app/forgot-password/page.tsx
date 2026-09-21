"use client";

import { Mail, MailCheck, Send } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { ErrorBanner } from "@/components/ui/error-banner";
import { TextField } from "@/components/ui/text-field";
import { api, ApiError } from "@/lib/api-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await api.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <AuthShell title="Check your email" subtitle="If that account exists, a reset link is on its way.">
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand/10 text-brand">
            <MailCheck className="h-7 w-7" />
          </div>
          <p className="text-sm text-foreground/70">
            We've sent password reset instructions to <strong>{email}</strong> if an
            account with that address exists.
          </p>
          <Link href="/login">
            <Button variant="ghost" className="w-full">
              Back to login
            </Button>
          </Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="Enter your email and we'll send you a reset link."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <ErrorBanner message={error} />}

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

        <Button type="submit" loading={submitting} className="w-full">
          {!submitting && <Send className="h-4 w-4" />}
          Send reset link
        </Button>

        <p className="text-center text-sm text-foreground/60">
          <Link href="/login" className="font-medium text-brand hover:underline">
            Back to login
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
