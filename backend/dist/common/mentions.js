export const MAX_MENTIONS = 10;
export function extractMentions(text) {
    const found = new Set();
    for (const match of text.matchAll(/(^|[^\w@])@([a-zA-Z0-9_.]{3,50})/g)) {
        const username = match[2].replace(/\.+$/, '').toLowerCase();
        if (username.length >= 3)
            found.add(username);
        if (found.size >= MAX_MENTIONS)
            break;
    }
    return [...found];
}
//# sourceMappingURL=mentions.js.map