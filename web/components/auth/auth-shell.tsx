import Image from "next/image";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-[42%] flex-col justify-between overflow-hidden bg-linear-to-br from-brand via-indigo-600 to-violet-700 p-12 text-white lg:flex">
        <div className="absolute -top-24 -left-24 h-80 w-80 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-violet-400/20 blur-3xl" />

        <div className="relative flex items-center gap-2.5 text-lg font-semibold">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white p-1.5">
            <Image src="/logo-mark.png" alt="" width={24} height={21} priority />
          </span>
          DawoodTech Community
        </div>

        <div className="relative space-y-4">
          <h1 className="text-4xl font-bold leading-tight text-balance">
            Share your wins. Grow together.
          </h1>
          <p className="max-w-sm text-base text-white/80 text-balance">
            An internal space for interns to post success stories, cheer each
            other on, and follow the people they learn from most.
          </p>
        </div>

        <p className="relative text-xs text-white/50">
          Internal platform — approved posts only, no private messaging.
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-sm fade-in-up">
          <div className="mb-8 space-y-1.5 lg:hidden">
            <div className="flex items-center gap-2 text-base font-semibold text-brand">
              <Image src="/logo-mark.png" alt="" width={22} height={19} priority />
              DawoodTech Community
            </div>
          </div>
          <div className="mb-8 space-y-1.5">
            <h2 className="text-2xl font-bold">{title}</h2>
            <p className="text-sm text-foreground/60">{subtitle}</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
