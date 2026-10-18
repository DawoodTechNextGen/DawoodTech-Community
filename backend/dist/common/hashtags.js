export const MAX_TAGS = 10;
export function extractHashtags(text) {
    const found = new Set();
    for (const match of text.matchAll(/(^|[^\w&#])#([a-zA-Z0-9_]{2,50})/g)) {
        const tag = match[2].toLowerCase();
        if (/[a-z]/.test(tag))
            found.add(tag);
        if (found.size >= MAX_TAGS)
            break;
    }
    return [...found];
}
//# sourceMappingURL=hashtags.js.map