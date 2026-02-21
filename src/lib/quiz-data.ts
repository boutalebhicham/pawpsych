
export type QuizQuestion = {
  id: number;
  question: string;
  options: string[];
};

export const quizQuestions: QuizQuestion[] = [
  {
    id: 1,
    question: "How does your pet react to new people?",
    options: [
      "Excited and friendly, wants to be the center of attention.",
      "Cautious at first, but warms up after a few minutes.",
      "Shy or fearful, prefers to hide.",
      "Indifferent, mostly ignores them.",
    ],
  },
  {
    id: 2,
    question: "What's your pet's favorite activity?",
    options: [
      "High-energy play like fetch or chasing toys.",
      "Cuddling on the couch.",
      "Exploring new places and sniffing everything.",
      "Napping in a sunbeam.",
    ],
  },
  {
    id: 3,
    question: "How does your pet behave when left alone?",
    options: [
      "Calm and relaxed, usually just sleeps.",
      "Becomes anxious and might be destructive.",
      "Gets into mischief, exploring where they shouldn't.",
      "I'm not sure, I've never watched them!",
    ],
  },
  {
    id: 4,
    question: "Describe your pet's energy level on a typical day.",
    options: [
      "A bundle of energy, always on the go.",
      "Playful in bursts, but enjoys downtime.",
      "Mostly calm and laid-back.",
      "A professional couch potato.",
    ],
  },
  {
    id: 5,
    question: "How vocal is your pet?",
    options: [
      "Very talkative, always has something to say (barking, meowing, etc.).",
      "Vocal only when they need something (food, attention).",
      "Quiet, rarely makes a peep.",
      "Expressive with growls, purrs, or other non-verbal sounds.",
    ],
  },
];
