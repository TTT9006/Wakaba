export type User = {
  id: string;
  name: string;
  email: string;
  avatar: string;
  goal: number;
  level: string;
  theme: string;
  annotationMode: 'romanized' | 'japanese';
  role: string;
};
export type Card = {
  id: string;
  deckId: string;
  japanese: string;
  reading: string;
  meaning: string;
  english: string;
  note: string;
  example: string;
  entryId?: string | null;
  ease: number;
  interval: number;
  repetitions: number;
  due: string;
  lastReviewed: string | null;
  deck?: { id: string; name: string };
};
export type Deck = { id: string; name: string; description: string; cards: Card[] };
export type Translation = { translatedText: string; status: string; reviewedAt: string | null };
export type Gloss = { id: string; originalText: string; translation: Translation | null };
export type Entry = {
  inflection?: { term: string; steps: string[] };
  id: string;
  common: boolean;
  version: string;
  kanji: { text: string; information: string }[];
  readings: { text: string; restrictions: string }[];
  senses: { id: string; senseIndex: number; metadata: string; glosses: Gloss[] }[];
};
export type Status = {
  entries: number;
  glosses: number;
  translated: number;
  pending: number;
  failed: number;
  coverage: number;
  latestImport: { version: string; status: string; count: number } | null;
  jobs: {
    id: string;
    status: string;
    total: number;
    processed: number;
    successful: number;
    failed: number;
    startedAt: string;
    lastError: string | null;
  }[];
};
export type Attempt = {
  id: string;
  testId: string;
  score: number;
  duration: number;
  createdAt: string;
  answers: string;
};
export type ConsolidatedRecentItem =
  | {
      id: string;
      type: 'card';
      japanese: string;
      reading: string;
      meaning: string;
      repetitions: number;
      lastReviewed: string | null;
      due: string;
    }
  | {
      id: string;
      type: 'grammar';
      grammarId: string;
      title: string;
      pattern: string;
      level: string;
      prompt: string;
      repetitions: number;
      lastCorrect: boolean;
      lastReviewed: string | null;
      due: string;
    };

export type ConsolidatedOverview = {
  cardsReviewedCount: number;
  grammarPracticedCount: number;
  cardsDueCount: number;
  grammarDueCount: number;
  dueCount: number;
  items: ConsolidatedRecentItem[];
};

export type DashboardData = {
  user: User;
  learned: number;
  totalCards: number;
  due: number;
  grammarCompleted: number;
  grammarTotal: number;
  today: number;
  streak: number;
  accuracy: number | null;
  weekly: { date: string; label: string; reviews: number; activities: number }[];
  recent: Card[];
  consolidatedReview?: ConsolidatedOverview;
  nextLesson: { id: string; pattern: string; title: string; level?: string } | null;
  attempts: Attempt[];
  upcoming: { date: string; count: number }[];
  activeDays: string[];
};
export type LessonSummary = {
  id: string;
  pattern: string;
  title: string;
  level: string;
  position: number;
  progress: { completed: boolean; bookmarked: boolean }[];
  curriculum?: { track: string; chapter?: number; topic: string; sourceUrl: string; sourceLabel: string; original: boolean };
  practice?: { total: number; answered: number; correct: number; mastered: boolean; due: number; weak: number; nextDue: string | null };
};
export type Question = {
  numbered?: boolean;
  passage?: string;
  transcript?: string;
  annotationDisabled?: boolean;
  readings?: Record<string, string>;
  id: string;
  type: string;
  prompt: string;
  options?: string[];
  rows?: string[];
  audioOptions?: boolean;
  audioUrl?: string;
  imageUrl?: string;
  category?: string;
  group?: string;
};
export type Result = Question & {
  given: string;
  correct: boolean;
  answer: string;
  explanation: string;
};

export type ConsolidatedReviewCardItem = {
  type: 'card';
  id: string;
  card: Card;
  due: string;
};

export type ConsolidatedReviewGrammarItem = {
  type: 'grammar';
  id: string;
  grammarId: string;
  title: string;
  pattern: string;
  level: string;
  due: string;
  question: Question;
};

export type ConsolidatedReviewItem =
  | ConsolidatedReviewCardItem
  | ConsolidatedReviewGrammarItem;

export type ConsolidatedReviewQueue = {
  items: ConsolidatedReviewItem[];
  total: number;
  totalCardsReviewed: number;
  totalGrammarPracticed: number;
  cardsDue: number;
  grammarDue: number;
  dueCount: number;
};


export type KamonType = 'kiku' | 'ume' | 'sakura' | 'wakaba';

export type LeaderboardUser = {
  rank: number;
  userId: string;
  name: string;
  avatar: string;
  level: string;
  exp: number;
  kamonType: KamonType;
  isCurrentUser: boolean;
};

export type LeaderboardData = {
  season: {
    id: string;
    title: string;
    startedAt: string;
    endedAt: string;
    daysRemaining: number;
  };
  today: {
    totalExp: number;
    cap: number;
  };
  rankings: LeaderboardUser[];
  currentUser: LeaderboardUser;
  totalLearners: number;
};

export type CelebrationData = {
  celebration: {
    seasonId: string;
    seasonTitle: string;
    rank: number;
    exp: number;
    kamonType: KamonType;
    totalLearners: number;
  } | null;
};

export type SeasonHistoryItem = {
  id: string;
  seasonId: string;
  seasonTitle: string;
  rank: number;
  exp: number;
  kamonType: KamonType;
  awardedAt: string;
};
