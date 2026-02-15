
export type MessageTrigger = 
    | 'low_mood'
    | 'high_mood'
    | 'habit_streak'
    | 'missed_habit'
    | 'focus_used'
    | 'journal_used'
    | 'no_activity'
    | 'morning'
    | 'evening';

export const messages: Record<MessageTrigger, string[]> = {
    low_mood: [
        "It's okay to not be okay. Be kind to yourself today.",
        "A small step is still a step forward. You're doing your best.",
        "This feeling will pass. Treat yourself with compassion.",
    ],
    high_mood: [
        "Channel this positive energy! It's a great day to tackle a challenge.",
        "Your positivity is a superpower. Keep shining!",
        "Awesome mood! Let's build on this momentum.",
    ],
    habit_streak: [
        "🔥 Habit streak! Consistency is where real growth happens.",
        "Look at you go! Every checkmark is a win for your future self.",
        "You're building an amazing routine. Keep up the great work!",
    ],
    missed_habit: [
        "Missed a day? No problem. The journey is never a straight line. Let's start fresh.",
        "One day doesn't define your progress. You can get right back on track today.",
        "Resilience is more important than perfection. You've got this.",
    ],
    focus_used: [
        "Great focus session! Every minute you invest in deep work pays off.",
        "Your focus today is building the future you want. Well done.",
        "You protected your attention and got it done. That's a huge win.",
    ],
    journal_used: [
        "Every insight you write down is a seed of growth. Keep planting.",
        "Taking time to reflect is a powerful act of self-awareness. Great job.",
        "You've cleared your mind and made space for new ideas. Well done.",
    ],
    no_activity: [
        "A new day, a new opportunity to sharpen your mind.",
        "Just one small puzzle or a single journal entry can make a difference today.",
        "Ready to invest in yourself? Your future self will thank you.",
    ],
    morning: [
        "Good morning! What's one thing you can do to make today great?",
        "Rise and shine! Your cognitive workout is waiting.",
        "A new day brings new strength and new thoughts. Let's get started.",
    ],
    evening: [
        "Time to wind down. Reflecting on your day can bring clarity for tomorrow.",
        "As the day ends, take a moment for gratitude or quiet thought.",
        "Rest is just as important as work. Hope you had a productive day.",
    ]
};
