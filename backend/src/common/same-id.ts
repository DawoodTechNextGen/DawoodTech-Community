/** MySQL bigint ids reach the app as strings from the database (and inside
 *  JWTs) but as numbers from parsed route params — compare them by value. */
export function sameId(
  a: number | string | null | undefined,
  b: number | string | null | undefined,
): boolean {
  return a != null && b != null && String(a) === String(b);
}
