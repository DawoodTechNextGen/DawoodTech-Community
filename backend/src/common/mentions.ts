/** Max people one post or comment can notify by @mention. */
export const MAX_MENTIONS = 10;

/** Usernames @mentioned in `text` (same characters signup allows), lowercased
 *  and de-duplicated. "@ali." at the end of a sentence means "ali". */
export function extractMentions(text: string): string[] {
  const found = new Set<string>();
  for (const match of text.matchAll(/(^|[^\w@])@([a-zA-Z0-9_.]{3,50})/g)) {
    const username = match[2]!.replace(/\.+$/, '').toLowerCase();
    if (username.length >= 3) found.add(username);
    if (found.size >= MAX_MENTIONS) break;
  }
  return [...found];
}
