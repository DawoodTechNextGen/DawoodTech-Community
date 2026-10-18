/** Media and avatars must be files this API stored itself (see
 *  UploadsService) — no outside links, which could track viewers or point
 *  anywhere. Older uploads kept their original extension (.jpeg, .JPG…),
 *  hence jpe?g and /i. */
export const UPLOAD_URL_PATTERN = /^\/uploads\/(posts|avatars)\/[\w.-]+\.(jpe?g|png|webp)$/i;
export const UPLOAD_URL_MESSAGE = 'Images must be uploaded through the app';
export const MAX_POST_IMAGES = 10;
