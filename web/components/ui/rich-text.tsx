import Link from "next/link";

// @mention or #tag, not glued to a word before it (so emails and "C#" stay text).
const TOKEN = /(^|[^\w@&#])([@#])([a-zA-Z0-9_.]{2,50})/g;

/** Plain post/comment text with @mentions and #tags turned into links. */
export function RichText({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(TOKEN)) {
    const [, lead, sigil, raw] = match as unknown as [string, string, "@" | "#", string];
    const isMention = sigil === "@";
    // Usernames may contain dots (not at the end); tags are [a-z0-9_] with a letter.
    const name = isMention ? raw.replace(/\.+$/, "") : (/^[a-zA-Z0-9_]+/.exec(raw)?.[0] ?? "");
    if (isMention ? name.length < 3 : !/[a-zA-Z]/.test(name) || name.length < 2) continue;

    const start = match.index! + lead.length;
    parts.push(text.slice(last, start));
    parts.push(
      <Link
        key={start}
        href={isMention ? `/u/${name}` : `/tags/${name.toLowerCase()}`}
        onClick={(e) => e.stopPropagation()}
        className="font-medium text-brand hover:underline"
      >
        {sigil}
        {name}
      </Link>,
    );
    last = start + 1 + name.length;
  }
  parts.push(text.slice(last));
  return <>{parts}</>;
}
