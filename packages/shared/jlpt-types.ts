export type JlptLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
export type SkillLevel = 'N5' | 'N4' | 'N3' | 'N2';

export type SyncStatus = 'chưa kiểm' | 'khớp tự động' | 'đã soát thủ công';
export type AnswerSource = 'Đáp án gốc' | 'Đáp án tham khảo';
export type KeySource = AnswerSource;
export type SkillType = 'listening' | 'reading' | 'vocabulary' | 'grammar';

export type JlptQuestion = {
  id: string;
  type: 'choice';
  prompt: string;
  options: string[];
  answer: string;
  explanation: string;
  category: 'vocabulary' | 'grammar' | 'reading' | 'listening';
  group: string;
  passage?: string;
  transcript?: string;
  audioOptions?: boolean;
  audioUrl?: string;
  imageUrl?: string;
  annotationDisabled: true;
  // Audio sync metadata
  syncStatus?: SyncStatus;
  audioDuration?: number;
  audioTimeRange?: { start: number; end: number };
  sourceAudioFile?: string;
  keySource?: AnswerSource;
  answerSource?: AnswerSource;
};

export type JlptSection = {
  id: string;
  title: string;
  minutes: number;
  questions: JlptQuestion[];
};

export type JlptPaper = {
  id: string;
  title: string;
  level: JlptLevel;
  sections: JlptSection[];
  description?: string;
  isOfficial?: boolean;
  keySource?: AnswerSource;
  answerSource?: AnswerSource;
  isPracticeExam?: boolean; // Eligible for "Luyện thi" (has all 3 components: vocab/grammar, reading, listening + answers)
  isMidterm?: boolean;
  isDuplicateAudio?: boolean;
  duplicateNote?: string;
};

export type PublicJlptQuestion = Omit<JlptQuestion, 'answer' | 'explanation' | 'transcript'>;

export type JlptSummary = {
  id: string;
  title: string;
  level: JlptLevel;
  kind: 'jlpt';
  description: string;
  isOfficial?: boolean;
  keySource?: AnswerSource;
  isPracticeExam?: boolean;
  isMidterm?: boolean;
  isDuplicateAudio?: boolean;
  duplicateNote?: string;
  total: number;
  minutes: number;
  sections: { id: string; title: string; minutes: number; count: number }[];
};

export type JlptResult = JlptQuestion & { given: string; correct: boolean };

export type JlptReport = {
  score: number;
  duration: number;
  results: JlptResult[];
  groups: { label: string; correct: number; total: number }[];
};

export type JlptRunView = {
  runId: string;
  testId: string;
  revision: number;
  section: number;
  sectionTitle: string;
  sections: JlptSummary['sections'];
  startedAt: string | null;
  deadline: string | null;
  serverNow: string;
  answers: Record<string, string>;
  questions: PublicJlptQuestion[];
  finished: boolean;
  report?: JlptReport;
};

// Skill Practice types (Nghe, Đọc, Từ vựng, Ngữ pháp theo cấp độ N5, N4, N3, N2)
export type SkillExerciseItem = {
  id: string;
  title: string;
  level: JlptLevel;
  skill: SkillType;
  book?: string;
  subCategory?: string; // dạng bài
  cd?: number;
  track?: number;
  audioUrl?: string;
  duration?: number;
  syncStatus: SyncStatus;
  passage?: string;
  transcript?: string;
  questions: JlptQuestion[];
};

export type SkillCategoryView = {
  skill: SkillType;
  title: string;
  levels: {
    level: JlptLevel;
    books?: string[];
    count: number;
    description: string;
  }[];
};
