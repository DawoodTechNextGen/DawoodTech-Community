export const DAILY_PROMPTS = [
    "What's one thing you learned today?",
    'What was your biggest win this week — big or small?',
    'Which bug gave you the hardest time recently, and how did you beat it?',
    'Who helped you this week? Give them a shoutout.',
    'What tool, shortcut or library saved you time lately?',
    'What are you working on right now?',
    "What's one tip you'd give to a brand-new intern?",
    'What did you finish today that you are proud of?',
    "What's something you want to get better at this month?",
    'Share a resource (article, video, course) that taught you something.',
    'What was the hardest part of your day, and what got you through it?',
    "What's a mistake you made that taught you a lot?",
    'What feedback recently changed how you work?',
    "What's one goal for tomorrow?",
    'Describe your current project in one sentence.',
    'What surprised you about working in a real team?',
    'Which concept finally "clicked" for you recently?',
    "What's your favourite way to stay focused?",
    'Share a screenshot or snippet of something you built.',
    'What question would you like help with from the community?',
    'What did you automate (or wish you could)?',
    "What's one thing you'd teach someone in five minutes?",
    'How did you level up this week?',
    'What is something new you tried today?',
    "What's the best advice you've had from a mentor?",
    'What made you smile at work today?',
    'Which skill from your internship will you use forever?',
    'What did you ship, fix or improve this week?',
    'What are you curious to learn next?',
    'If you could restart this week, what would you do differently?',
];
export function promptForDay(day) {
    const days = Math.floor(Date.parse(`${day}T00:00:00Z`) / 86_400_000);
    return DAILY_PROMPTS[days % DAILY_PROMPTS.length];
}
//# sourceMappingURL=daily-prompts.js.map