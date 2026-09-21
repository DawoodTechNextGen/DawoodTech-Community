"use client";

import { ImagePlus, Send, Sparkles, X } from "lucide-react";
import { useRef, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ErrorBanner } from "@/components/ui/error-banner";
import { api, ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";

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
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [focused, setFocused] = useState(false);
  const [dragging, setDragging] = useState(false);

  if (!user) return null;

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
      await api.createPost({ content: content.trim(), mediaUrls });
      setContent("");
      clearImage();
      setJustSubmitted(true);
      setTimeout(() => setJustSubmitted(false), 4000);
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
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Share a success story…"
            rows={expanded ? 3 : 1}
            maxLength={MAX_LENGTH}
            className={`w-full resize-none rounded-xl border-0 bg-transparent px-0.5 py-1 text-[15px] outline-none transition-all duration-200 placeholder:text-foreground/35 placeholder:truncate ${
              expanded ? "overflow-y-auto" : "overflow-hidden whitespace-nowrap"
            }`}
          />

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
              Submitted — it will appear in the feed once an admin approves it.
            </p>
          )}

          <div
            className={`flex items-center justify-between border-t pt-3 transition-colors ${
              expanded ? "border-black/5 dark:border-white/10" : "border-transparent"
            }`}
          >
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-foreground/60 transition-colors hover:bg-brand/10 hover:text-brand"
              >
                <ImagePlus className="h-4 w-4" />
                Photo
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
