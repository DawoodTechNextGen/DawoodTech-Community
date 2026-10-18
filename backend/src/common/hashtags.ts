/** Most tags one post can carry. */
export const MAX_TAGS = 10;

/** #hashtags in `text`: lowercased, de-duplicated, without the #. A tag needs
 *  at least one letter, so "#1" or a "#123" issue number isn't a topic. */
export function extractHashtags(text: string): string[] {
  const found = new Set<string>();
  for (const match of text.matchAll(/(^|[^\w&#])#([a-zA-Z0-9_]{2,50})/g)) {
    const tag = match[2]!.toLowerCase();
    if (/[a-z]/.test(tag)) found.add(tag);
    if (found.size >= MAX_TAGS) break;
  }
  return [...found];
}
