const TITLE_MAX = 80;
const EXCERPT_MAX = 200;
function toPlainText(content) {
    return content
        .replace(/<[^>]*>/g, ' ')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}
function truncate(value, max) {
    return value.length > max ? `${value.slice(0, max - 1).trimEnd()}…` : value;
}
export function postTitle(content) {
    const firstLine = toPlainText(content)
        .split('\n')
        .map((line) => line.trim())
        .find(Boolean);
    return truncate(firstLine ?? 'New post', TITLE_MAX);
}
export function postExcerpt(content) {
    const lines = toPlainText(content).split('\n');
    const titleIndex = lines.findIndex((line) => line.trim());
    return truncate(lines.slice(titleIndex + 1).join('\n').trim(), EXCERPT_MAX);
}
//# sourceMappingURL=post-summary.js.map