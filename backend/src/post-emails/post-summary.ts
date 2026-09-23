const TITLE_MAX = 80;
const EXCERPT_MAX = 200;

function toPlainText(content: string): string {
  return content
    .replace(/<[^>]*>/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 1).trimEnd()}…` : value;
}

/** Posts have no title field, so the first non-empty line stands in for one. */
export function postTitle(content: string): string {
  const firstLine = toPlainText(content)
    .split('\n')
    .map((line) => line.trim())
    .find(Boolean);
  return truncate(firstLine ?? 'New post', TITLE_MAX);
}

/** The body after the title line, so the email doesn't repeat the title.
 *  Empty for one-line posts. */
export function postExcerpt(content: string): string {
  const lines = toPlainText(content).split('\n');
  const titleIndex = lines.findIndex((line) => line.trim());
  return truncate(lines.slice(titleIndex + 1).join('\n').trim(), EXCERPT_MAX);
}
