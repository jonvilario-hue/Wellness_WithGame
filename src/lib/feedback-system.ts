
'use client';

import type { CHCDomain } from "@/types";

type FeedbackType = 'success' | 'failure';

type Feedback = {
    message: string;
    tags: string[];
};

const feedbackLibrary: Record<CHCDomain, Record<FeedbackType, Feedback[]>> = {
    Gf: {
        success: [
            { message: "Pattern cracked. Your reasoning skills are sharp.", tags: ["reasoning", "pattern"] },
            { message: "That's some sharp logical thinking. You saw the connection.", tags: ["logic", "connection"] },
            { message: "Great abstraction! That logic puzzle is a tough one.", tags: ["reasoning", "abstraction"] },
            { message: "Correct. That type of logic is key for real-world problem solving.", tags: ["transfer", "logic"] }
        ],
        failure: [
            { message: "This one twists your logic. Try flipping your frame.", tags: ["strategy", "encouragement"] },
            { message: "Almost! Every attempt is a step closer to seeing the pattern.", tags: ["effort", "growth"] },
            { message: "This is a tough one. It's designed to stretch your skills.", tags: ["challenge", "resilience"] },
        ]
    },
    Gc: {
        success: [
            { message: "Excellent vocabulary use! Your knowledge base is clearly strong.", tags: ["vocabulary", "knowledge"] },
            { message: "You deduced that from context beautifully.", tags: ["inference", "context"] },
            { message: "Great inference! You're making sharp connections.", tags: ["connection", "reasoning"] }
        ],
        failure: [
            { message: "A tricky one. The answer is often hidden in the word relationships.", tags: ["strategy", "hint"] },
            { message: "Close! This tests the edges of your knowledge.", tags: ["challenge", "growth"] },
        ]
    },
    Gwm: {
        success: [
            { message: "Nice! You held a lot in working memory there.", tags: ["memory", "focus"] },
            { message: "That's impressive mental juggling. You kept it all in mind.", tags: ["capacity", "memory"] },
            { message: "Your focus held strong on that sequence.", tags: ["focus", "attention"] }
        ],
        failure: [
            { message: "You reached a stretch point. This is where memory grows.", tags: ["growth", "effort"] },
            { message: "Almost! That's a lot to hold in memory. Let's try it again.", tags: ["challenge", "retry"] },
            { message: "The sequence got scrambled. It happens! Deep breath and refocus.", tags: ["reset", "focus"] }
        ]
    },
    Gs: {
        success: [
            { message: "Sharp eyes! That was a fast perceptual scan.", tags: ["speed", "perception"] },
            { message: "Quick and accurate. Your processing speed is on point.", tags: ["speed", "accuracy"] },
            { message: "You're cutting through the noise with speed. Excellent pace!", tags: ["efficiency", "momentum"] }
        ],
        failure: [
            { message: "A little slip! The key is accuracy, then speed will follow.", tags: ["strategy", "accuracy"] },
            { message: "Don't worry about speed. Focus on the match, then the pace will come.", tags: ["hint", "focus"] },
        ]
    },
    Gv: {
        success: [
            { message: "Great mental rotation! You saw that clearly.", tags: ["visualization", "spatial"] },
            { message: "Your visual imagination is getting stronger.", tags: ["imagination", "growth"] },
            { message: "You spotted the spatial relationship perfectly.", tags: ["spatial", "logic"] }
        ],
        failure: [
            { message: "Tricky perspective! Try to mentally 'hold' the object and turn it.", tags: ["strategy", "hint"] },
            { message: "This is tough for everyone. It's a trainable skill!", tags: ["encouragement", "growth"] },
        ]
    },
    Ga: {
        success: [
            { message: "You heard that subtle difference perfectly.", tags: ["discrimination", "auditory"] },
            { message: "Excellent auditory memory. You're tuning into the details.", tags: ["memory", "focus"] },
            { message: "That's sharp listening. You're filtering out the noise.", tags: ["filtering", "attention"] }
        ],
        failure: [
            { message: "Subtle sounds are hard to catch. Let's listen again.", tags: ["retry", "hint"] },
            { message: "Your brain is working hard to build new auditory maps. Keep going.", tags: ["growth", "neuroplasticity"] },
        ]
    },
    Glr: {
        success: [
            { message: "Great recall! You pulled that from your memory banks.", tags: ["retrieval", "memory"] },
            { message: "Your fluency in that category is impressive.", tags: ["fluency", "knowledge"] },
            { message: "You're accessing stored knowledge efficiently.", tags: ["efficiency", "memory"] }
        ],
        failure: [
            { message: "It's on the tip of your tongue! That feeling is your brain searching.", tags: ["effort", "process"] },
            { message: "A tough category! The first few are always the hardest.", tags: ["encouragement", "strategy"] },
        ]
    },
    EF: {
        success: [
            { message: "Great focus! You successfully inhibited the impulse.", tags: ["inhibition", "focus"] },
            { message: "You switched tasks smoothly and accurately.", tags: ["switching", "flexibility"] },
            { message: "Your attention control was rock-solid on that one.", tags: ["attention", "control"] }
        ],
        failure: [
            { message: "That was a tricky switch! Inhibition is a tough skill to build.", tags: ["challenge", "growth"] },
            { message: "Oops, the old rule stuck around. Let's reset and try the new one.", tags: ["reset", "strategy"] },
        ]
    },
};

const getFeedback = (domain: CHCDomain, type: FeedbackType): string => {
    const messages = feedbackLibrary[domain]?.[type] || feedbackLibrary.Gf[type];
    const feedback = messages[Math.floor(Math.random() * messages.length)];
    return feedback.message;
};

export const getSuccessFeedback = (domain: CHCDomain) => {
    return getFeedback(domain, 'success');
};

export const getFailureFeedback = (domain: CHCDomain) => {
    return getFeedback(domain, 'failure');
};
