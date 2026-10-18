"use client";

import { HandHeart, HelpCircle, ImagePlus, Send, Sparkles, X } from "lucide-react";
import { useRef, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ErrorBanner } from "@/components/ui/error-banner";
import { MentionMenu } from "@/components/ui/mention-menu";
import { api, ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { useMentions } from "@/lib/use-mentions";

const MAX_LENGTH = 5000;
const WARN_AT = 4700;

export function CreatePostComposer({ onSubmitted }: { onSubmitted?: () => void }) {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // What happened to the last post: live straight away (trusted member) or queued.
  const [justSubmitted, setJustSubmitted] = useState<"live" | "review" | null>(null);
  const [focused, setFocused] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [isQuestion, setIsQuestion] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mentions = useMentions(textareaRef, content, setContent);

  if (!user) return null;

  /** Starts a thank-you post; the @ opens the member picker right away. */
  function startShoutout() {
    const next = `${content.trim() ? `${content.trimEnd()}\n` : ""}🙌 Shoutout to @`;
    setContent(next);
    requestAnimationFrame(() => {
      const field = textareaRef.current;
      if (!field) return;
      field.focus();
      field.setSelectionRange(next.length, next.length);
    });
  }

  function pickImage(file: File | undefined) {
    if (!file || !file.type.startsWith("image/")) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function clearImage() {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    setError(null);
    setSubmitting(true);
    try {
      let mediaUrls: string[] | undefined;
      if (imageFile) {
        const { url } = await api.uploadImage(imageFile);
        mediaUrls = [url];
      }
      const created = await api.createPost({ content: content.trim(), mediaUrls, isQuestion });
      setContent("");
      setIsQuestion(false);
      clearImage();
      setJustSubmitted(created.status === "approved" ? "live" : "review");
      setTimeout(() => setJustSubmitted(null), 4000);
      onSubmitted?.();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't post right now. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const expanded = focused || content.length > 0 || !!imagePreview;

  return (
    <form
      onSubmit={handleSubmit}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        pickImage(e.dataTransfer.files?.[0]);
      }}
      className={`rounded-2xl border bg-white/60 p-4 shadow-sm transition-all duration-200 dark:bg-white/5 ${
        dragging
          ? "border-brand border-dashed bg-brand/5"
          : focused
            ? "border-brand/40 ring-2 ring-brand/15"
            : "border-black/5 dark:border-white/10"
      }`}
    >
      <div className="flex gap-3">
        <Avatar name={user.fullName} src={user.avatarUrl} size={40} />
        <div className="flex-1 space-y-3">
          <div className="relative">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={mentions.onChange}
              onKeyDown={mentions.onKeyDown}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder={
                isQuestion
                  ? "What do you need help with? Add #tags so the right people see it"
                  : "Share a success story…"
              }
              rows={expanded ? 3 : 1}
              maxLength={MAX_LENGTH}
              className={`w-full resize-none rounded-xl border-0 bg-transparent px-0.5 py-1 text-[15px] outline-none transition-all duration-200 placeholder:text-foreground/35 placeholder:truncate ${
                expanded ? "overflow-y-auto" : "overflow-hidden whitespace-nowrap"
              }`}
            />
            <MentionMenu {...mentions.menu} />
          </div>

          {imagePreview && (
            <div className="relative inline-block pop-in">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagePreview}
                alt="Selected"
                className="max-h-56 rounded-xl border border-black/10 object-cover dark:border-white/10"
              />
              <button
                type="button"
                onClick={clearImage}
                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white shadow-md transition-transform hover:scale-110 hover:bg-black"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {error && <ErrorBanner message={error} />}
          {justSubmitted && (
            <p className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
              <Sparkles className="h-4 w-4" />
              {justSubmitted === "live"
                ? "Posted — it's live in the feed."
                : "Submitted — it will appear in the feed once an admin approves it."}
            </p>
          )}

          <div
            className={`flex items-center justify-between border-t pt-3 transition-colors ${
              expanded ? "border-black/5 dark:border-white/10" : "border-transparent"
            }`}
          >
            <div className="flex min-w-0 items-center gap-1 sm:gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Add a photo"
                className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-foreground/60 transition-colors hover:bg-brand/10 hover:text-brand"
              >
                <ImagePlus className="h-4 w-4" />
                <span className="hidden sm:inline">Photo</span>
              </button>
              <button
                type="button"
                onClick={startShoutout}
                aria-label="Shoutout"
                className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-foreground/60 transition-colors hover:bg-brand/10 hover:text-brand"
              >
                <HandHeart className="h-4 w-4" />
                <span className="hidden sm:inline">Shoutout</span>
              </button>
              <button
                type="button"
                onClick={() => setIsQuestion((q) => !q)}
                aria-label="Ask a question"
                aria-pressed={isQuestion}
                className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm transition-colors ${
                  isQuestion
                    ? "bg-sky-500/10 text-sky-600 dark:text-sky-400"
                    : "text-foreground/60 hover:bg-brand/10 hover:text-brand"
                }`}
              >
                <HelpCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Ask</span>
              </button>
              {content.length > WARN_AT && (
                <span
                  className={`text-xs ${content.length >= MAX_LENGTH ? "text-red-500" : "text-foreground/40"}`}
                >
                  {MAX_LENGTH - content.length} left
                </span>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={(e) => pickImage(e.target.files?.[0])}
            />

            <Button type="submit" loading={submitting} disabled={!content.trim()}>
              {!submitting && <Send className="h-4 w-4" />}
              Post
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
