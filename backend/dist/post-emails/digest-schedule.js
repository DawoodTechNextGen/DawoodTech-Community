export function localDayAndHour(now, timeZone) {
    const parts = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        hourCycle: 'h23',
    }).formatToParts(now);
    const part = (type) => parts.find((p) => p.type === type)?.value ?? '';
    return {
        day: `${part('year')}-${part('month')}-${part('day')}`,
        hour: Number(part('hour')),
    };
}
//# sourceMappingURL=digest-schedule.js.map