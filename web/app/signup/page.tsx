"use client";

import { AtSign, Lock, Mail, MailCheck, User, UserPlus } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { ErrorBanner } from "@/components/ui/error-banner";
import { TextField } from "@/components/ui/text-field";
import { api, ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";

const USERNAME_PATTERN = /^[a-zA-Z0-9_.]+$/;

export default function SignupPage() {
  const { signup } = useAuth();

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  function validate(): string | null {
    if (fullName.trim().length < 2) return "Full name must be at least 2 characters.";
    if (username.length < 3 || !USERNAME_PATTERN.test(username)) {
      return "Username must be 3+ characters — letters, numbers, underscores or dots only.";
    }
    if (password.length < 8) return "Password must be at least 8 characters.";
    if (password !== confirmPassword) return "Passwords don't match.";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await signup({ fullName, username, email, password });
      setSubmittedEmail(email);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResend() {
    if (!submittedEmail) return;
    setResending(true);
    try {
      await api.resendVerification(submittedEmail);
      setResent(true);
      setTimeout(() => setResent(false), 5000);
    } finally {
      setResending(false);
    }
  }

  if (submittedEmail) {
    return (
      <AuthShell title="Check your email" subtitle="One more step to activate your account.">
        <div className="space-y-4 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand/10 text-brand">
            <MailCheck className="h-7 w-7" />
          </div>
          <p className="text-sm text-foreground/70">
            We sent a verification link to <strong>{submittedEmail}</strong>. Click it to
            activate your account, then come back and log in.
          </p>
          <Button
            variant="ghost"
            loading={resending}
            onClick={handleResend}
            className="w-full"
          >
            {resent ? "Sent again ✓" : "Resend email"}
          </Button>
          <p className="text-sm text-foreground/60">
            <Link href="/login" className="font-medium text-brand hover:underline">
              Back to login
            </Link>
          </p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Join the community and share your first success story."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <ErrorBanner message={error} />}

        <TextField
          label="Full name"
          icon={User}
          autoComplete="name"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Jane Doe"
        />

        <TextField
          label="Username"
          icon={AtSign}
          autoComplete="username"
          required
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="janedoe"
        />

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

        <TextField
          label="Password"
          icon={Lock}
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters"
        />

        <TextField
          label="Confirm password"
          icon={Lock}
          type="password"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="••••••••"
        />

        <Button type="submit" loading={submitting} className="w-full">
          {!submitting && <UserPlus className="h-4 w-4" />}
          Create account
        </Button>

        <p className="text-center text-sm text-foreground/60">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-brand hover:underline">
            Log in
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}
