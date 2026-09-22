"use client";

import {
  Camera,
  Check,
  Loader2,
  LogOut,
  Pencil,
  UserMinus,
  UserPlus,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ErrorBanner } from "@/components/ui/error-banner";
import { api, ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import type { PublicUser } from "@/lib/types";

export function ProfileHeader({
  profile,
  isOwnProfile,
  followerCount,
  followingCount,
  isFollowing,
  onFollowToggle,
  onProfileUpdated,
  onShowFollowers,
  onShowFollowing,
}: {
  profile: PublicUser;
  isOwnProfile: boolean;
  followerCount: number;
  followingCount: number;
  isFollowing: boolean;
  onFollowToggle: () => Promise<void>;
  onProfileUpdated: (updated: PublicUser) => void;
  onShowFollowers: () => void;
  onShowFollowing: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { logout } = useAuth();
  const router = useRouter();

  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(profile.fullName);
  const [bio, setBio] = useState(profile.bio ?? "");
  const [saving, setSaving] = useState(false);
  const [followBusy, setFollowBusy] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAvatarPick(file: File | undefined) {
    if (!file) return;
    setUploadingAvatar(true);
    setError(null);
    try {
      const { url } = await api.uploadImage(file);
      const updated = await api.updateMe({ avatarUrl: url });
      onProfileUpdated(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't update your photo.");
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const updated = await api.updateMe({ fullName: fullName.trim(), bio: bio.trim() });
      onProfileUpdated(updated);
      setEditing(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save your profile.");
    } finally {
      setSaving(false);
    }
  }

  async function handleFollowClick() {
    setFollowBusy(true);
    try {
      await onFollowToggle();
    } finally {
      setFollowBusy(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-black/5 bg-white/60 shadow-sm dark:border-white/10 dark:bg-white/5">
      <div className="h-24 bg-linear-to-br from-brand via-indigo-600 to-violet-700" />
      <div className="flex items-start gap-4 px-6 pb-6">
        <div className="relative -mt-10 shrink-0">
          <div className="rounded-full ring-4 ring-white dark:ring-[#11162a]">
            <Avatar name={profile.fullName} src={profile.avatarUrl} size={80} />
          </div>
          {isOwnProfile && (
            <>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-brand text-white shadow-md transition-transform hover:scale-105"
                aria-label="Change photo"
              >
                {uploadingAvatar ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Camera className="h-3.5 w-3.5" />
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => handleAvatarPick(e.target.files?.[0])}
              />
            </>
          )}
        </div>

        <div className="min-w-0 flex-1 pt-11">
          {editing ? (
            <div className="space-y-3">
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-lg border border-black/10 bg-transparent px-3 py-1.5 text-lg font-bold outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 dark:border-white/10"
                placeholder="Full name"
              />
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={2}
                maxLength={500}
                placeholder="Add a short bio…"
                className="w-full resize-none rounded-lg border border-black/10 bg-transparent px-3 py-1.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 dark:border-white/10"
              />
              <div className="flex gap-2">
                <Button loading={saving} onClick={handleSave}>
                  <Check className="h-4 w-4" />
                  Save
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setEditing(false);
                    setFullName(profile.fullName);
                    setBio(profile.bio ?? "");
                  }}
                >
                  <X className="h-4 w-4" />
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-lg font-bold">{profile.fullName}</h1>
              <p className="text-sm text-foreground/50">@{profile.username}</p>
              <p className="mt-2 text-sm text-foreground/80">
                {profile.bio || (
                  <span className="text-foreground/40 italic">No bio yet.</span>
                )}
              </p>

              <div className="mt-3 flex items-center gap-4 text-sm">
                <button type="button" onClick={onShowFollowers} className="hover:underline">
                  <strong>{followerCount}</strong>{" "}
                  <span className="text-foreground/50">followers</span>
                </button>
                <button type="button" onClick={onShowFollowing} className="hover:underline">
                  <strong>{followingCount}</strong>{" "}
                  <span className="text-foreground/50">following</span>
                </button>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {isOwnProfile ? (
                  <>
                    <Button
                      variant="ghost"
                      className="shrink-0 px-3"
                      onClick={() => setEditing(true)}
                    >
                      <Pencil className="h-4 w-4" />
                      <span className="hidden sm:inline">Edit profile</span>
                      <span className="sm:hidden">Edit</span>
                    </Button>
                    <Button
                      variant="ghost"
                      className="shrink-0 px-3 md:hidden"
                      onClick={async () => {
                        await logout();
                        router.replace("/login");
                      }}
                    >
                      <LogOut className="h-4 w-4" />
                      Log out
                    </Button>
                  </>
                ) : (
                  <Button
                    loading={followBusy}
                    onClick={handleFollowClick}
                    variant={isFollowing ? "ghost" : "primary"}
                  >
                    {!followBusy &&
                      (isFollowing ? (
                        <UserMinus className="h-4 w-4" />
                      ) : (
                        <UserPlus className="h-4 w-4" />
                      ))}
                    {isFollowing ? "Unfollow" : "Follow"}
                  </Button>
                )}
              </div>
            </>
          )}

          {error && (
            <div className="mt-3">
              <ErrorBanner message={error} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
