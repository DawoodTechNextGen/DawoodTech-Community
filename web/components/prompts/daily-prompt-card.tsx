"use client";

import { CheckCircle2, Flame, MessageCircleQuestion, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { MentionMenu } from "@/components/ui/mention-menu";
import { api, ApiError } from "@/lib/api-client";
import type { TodayPrompt } from "@/lib/types";
import { useMentions } from "@/lib/use-mentions";

const MAX_LENGTH = 5000;

/**
 * Today's question, answerable right from the feed, plus the member's streak
 * (consecutive days with a post or comment). A small, daily reason to open
 * the app — answering takes half a minute.
 */
export function DailyPromptCard({
  refreshKey,
  onAnswered,
}: {
  refreshKey: number;
  onAnswered: () => void;
}) {
  const [today, setToday] = useState<TodayPrompt | null>(null);
  const [answer, setAnswer] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentForReview, setSentForReview] = useState(false);
  const answerRef = useRef<HTMLTextAreaElement>(null);
  const mentions = useMentions(answerRef, answer, setAnswer);

  useEffect(() => {
    let cancelled = false;
    api
      .getTodayPrompt()
      .then((t) => !cancelled && setToday(t))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  if (!today) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!answer.trim()) return;
    setSending(true);
    setError(null);
    try {
      const post = await api.createPost({ content: answer.trim(), answersPrompt: true });
      setAnswer("");
      setSentForReview(post.status !== "approved");
      setToday(await api.getTodayPrompt());
      onAnswered();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't post your answer. Try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="rounded-2xl border border-brand/15 bg-gradient-to-br from-brand/10 to-violet-500/5 p-5 shadow-sm">
      <div className="flex items-center gap-2">
        <MessageCircleQuestion className="h-4 w-4 text-brand" />
        <span className="text-xs font-semibold uppercase tracking-wide text-brand">
          Today&apos;s question
        </span>
        {today.streak > 0 && (
          <span
            className={`ml-auto flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
              today.activeToday
                ? "bg-orange-500/15 text-orange-600 dark:text-orange-400"
                : "bg-black/5 text-foreground/50 dark:bg-white/10"
            }`}
            title={
              today.activeToday
                ? "Days in a row you've posted or commented"
                : "Post or comment today to keep your streak going"
            }
          >
            <Flame className="h-3.5 w-3.5" />
            {today.streak}-day streak
          </span>
        )}
      </div>

      <p className="mt-2 text-[17px] font-semibold leading-snug">{today.prompt}</p>

      {today.answered ? (
        <p className="mt-3 flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 className="h-4 w-4" />
          {sentForReview
            ? "Answered — it will show up once an admin approves it."
            : "You answered today. Come back tomorrow for a new question!"}
        </p>
      ) : (
        <form onSubmit={submit} className="mt-3 space-y-2">
          <div className="relative">
            <textarea
              ref={answerRef}
              value={answer}
              onChange={mentions.onChange}
              onKeyDown={mentions.onKeyDown}
              rows={2}
              maxLength={MAX_LENGTH}
              placeholder="Your answer…"
              className="w-full resize-none rounded-xl border border-black/10 bg-background/70 px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 dark:border-white/10"
            />
            <MentionMenu {...mentions.menu} />
          </div>
          {error && <p className="text-xs text-red-500">{error}</p>}
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-foreground/50">
              {today.answerCount > 0
                ? `${today.answerCount} ${today.answerCount === 1 ? "member has" : "members have"} answered today`
                : "Be the first to answer today"}
            </span>
            <Button type="submit" loading={sending} disabled={!answer.trim()}>
              {!sending && <Send className="h-4 w-4" />}
              Answer
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
