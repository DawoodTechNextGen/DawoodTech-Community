import { MessageCircleOff, ShieldCheck } from "lucide-react";
import Image from "next/image";

export function AboutCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-black/5 bg-white/60 shadow-sm dark:border-white/10 dark:bg-white/5">
      <div className="bg-linear-to-br from-brand via-indigo-600 to-violet-700 px-5 py-6 text-white">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white p-1.5">
          <Image src="/logo-mark.png" alt="" width={24} height={21} />
        </span>
        <h2 className="mt-2 text-base font-bold">DawoodTech Community</h2>
        <p className="mt-1 text-xs text-white/75">
          A space for interns to celebrate wins and support each other.
        </p>
      </div>
      <ul className="space-y-3 p-5 text-sm text-foreground/70">
        <li className="flex items-start gap-2.5">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
          Every post is reviewed by an admin before it goes live.
        </li>
        <li className="flex items-start gap-2.5">
          <MessageCircleOff className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
          No private messaging — everything here is shared openly.
        </li>
      </ul>
    </div>
  );
}
