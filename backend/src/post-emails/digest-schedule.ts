/** Calendar day ("YYYY-MM-DD") and hour (0–23) of `now` in `timeZone`. */
export function localDayAndHour(now: Date, timeZone: string): { day: string; hour: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? '';
  return {
    day: `${part('year')}-${part('month')}-${part('day')}`,
    hour: Number(part('hour')),
  };
}
