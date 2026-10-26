import { jlptPapers, paperSummary } from './jlpt-papers';
import type {
  JlptPaper,
  JlptReport,
  JlptRunView,
  JlptSummary,
} from './jlpt-types';

export type LocalExamState = {
  version: 1;
  paper: JlptPaper;
  section: number;
  sectionStarted: number | null;
  answers: Record<string, string>;
  revision: number;
  elapsed: number;
  report?: JlptReport;
};

export type LocalAttempt = {
  id: string;
  testId: string;
  duration: number;
  score: number;
  passed: boolean;
  answers: Record<string, string>;
  results: { id: string; prompt: string; given: string; correct: boolean; answer: string; explanation?: string }[];
  createdAt: string;
};

function completeSection(state: LocalExamState, now: number) {
  const section = state.paper.sections[state.section];
  if (section && state.sectionStarted !== null) {
    state.elapsed += Math.min(
      section.minutes * 60,
      Math.max(0, Math.floor((now - state.sectionStarted) / 1000)),
    );
  }
  state.section++;
  state.sectionStarted = null;
  if (state.section >= state.paper.sections.length) {
    const results = state.paper.sections
      .flatMap((s) => s.questions)
      .map((q) => ({
        ...q,
        given: state.answers[q.id] || '',
        correct: state.answers[q.id] === q.answer,
      }));
    const categories =
      state.paper.level === 'N5' || state.paper.level === 'N4'
        ? ([
            ['Kiến thức ngôn ngữ & Đọc hiểu', ['vocabulary', 'grammar', 'reading']],
            ['Nghe hiểu', ['listening']],
          ] as const)
        : ([
            ['Kiến thức ngôn ngữ', ['vocabulary', 'grammar']],
            ['Đọc hiểu', ['reading']],
            ['Nghe hiểu', ['listening']],
          ] as const);
    state.report = {
      score: results.length ? Math.round((100 * results.filter((q) => q.correct).length) / results.length) : 0,
      duration: state.elapsed,
      results,
      groups: categories.map(([label, cats]) => {
        const part = results.filter((q) => (cats as readonly string[]).includes(q.category));
        return { label, correct: part.filter((q) => q.correct).length, total: part.length };
      }),
    };
  }
}

function makeView(runId: string, state: LocalExamState, now: number): JlptRunView {
  const section = state.paper.sections[state.section];
  return {
    runId,
    testId: state.paper.id,
    revision: state.revision,
    section: state.section,
    sectionTitle: section?.title || 'Hoàn thành',
    sections: paperSummary(state.paper).sections,
    startedAt: state.sectionStarted === null ? null : new Date(state.sectionStarted).toISOString(),
    deadline:
      state.sectionStarted === null || !section
        ? null
        : new Date(state.sectionStarted + section.minutes * 60_000).toISOString(),
    serverNow: new Date(now).toISOString(),
    answers: Object.fromEntries(
      (section?.questions || []).map((q) => [q.id, state.answers[q.id] || '']),
    ),
    questions:
      state.sectionStarted === null || !section
        ? []
        : section.questions.map(
            ({ answer: _a, explanation: _e, transcript: _t, ...q }) => q,
          ),
    finished: !!state.report,
    ...(state.report ? { report: state.report } : {}),
  };
}

const RUN_PREFIX = 'wakaba_jlpt_run_';
const ATTEMPTS_KEY = 'wakaba_jlpt_attempts';

function getStorage(): Storage | null {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  return null;
}

export function getLocalExamRun(paperId: string): JlptRunView | null {
  const storage = getStorage();
  if (!storage) return null;
  const raw = storage.getItem(RUN_PREFIX + paperId);
  if (!raw) return null;
  try {
    const state: LocalExamState = JSON.parse(raw);
    const now = Date.now();
    const current = state.paper.sections[state.section];
    if (current && state.sectionStarted !== null && now >= state.sectionStarted + current.minutes * 60_000) {
      completeSection(state, now);
      state.revision++;
      storage.setItem(RUN_PREFIX + paperId, JSON.stringify(state));
    }
    return makeView(`local_${paperId}`, state, now);
  } catch {
    return null;
  }
}

export function initLocalExamRun(paperId: string): JlptRunView {
  const paper = jlptPapers.find((p) => p.id === paperId);
  if (!paper) {
    throw new Error('Không tìm thấy đề thi: ' + paperId);
  }
  const now = Date.now();
  const state: LocalExamState = {
    version: 1,
    paper,
    section: 0,
    sectionStarted: now,
    answers: {},
    revision: 1,
    elapsed: 0,
  };
  const storage = getStorage();
  if (storage) {
    storage.setItem(RUN_PREFIX + paperId, JSON.stringify(state));
  }
  return makeView(`local_${paperId}`, state, now);
}

export function advanceLocalExamRun(
  paperId: string,
  action?: 'save' | 'finish' | 'begin' | 'finish-all',
  answers: Record<string, string> = {},
): JlptRunView {
  const storage = getStorage();
  const raw = storage?.getItem(RUN_PREFIX + paperId);
  let state: LocalExamState;
  if (!raw) {
    const paper = jlptPapers.find((p) => p.id === paperId);
    if (!paper) throw new Error('Không tìm thấy đề thi: ' + paperId);
    state = {
      version: 1,
      paper,
      section: 0,
      sectionStarted: null,
      answers: {},
      revision: 0,
      elapsed: 0,
    };
  } else {
    state = JSON.parse(raw);
  }

  const now = Date.now();
  const current = state.paper.sections[state.section];

  if (action === 'begin') {
    if (state.sectionStarted === null) {
      state.sectionStarted = now;
    }
  } else if (action === 'finish-all') {
    for (const [id, answer] of Object.entries(answers)) {
      if (answer !== '') state.answers[id] = answer;
    }
    while (state.section < state.paper.sections.length) {
      if (state.sectionStarted === null) state.sectionStarted = now;
      completeSection(state, now);
    }
  } else {
    for (const [id, answer] of Object.entries(answers)) {
      if (answer !== '') state.answers[id] = answer;
    }
    if (action === 'finish') {
      completeSection(state, now);
    }
  }

  state.revision++;

  if (storage) {
    storage.setItem(RUN_PREFIX + paperId, JSON.stringify(state));
    if (state.report) {
      saveLocalAttempt(paperId, state);
    }
  }

  return makeView(`local_${paperId}`, state, now);
}

function saveLocalAttempt(paperId: string, state: LocalExamState) {
  const storage = getStorage();
  if (!storage || !state.report) return;
  const attempts = getLocalHistoryAttempts();
  const attempt: LocalAttempt = {
    id: `local_att_${Date.now()}`,
    testId: paperId,
    duration: state.report.duration,
    score: state.report.score,
    passed: state.report.score >= 60,
    answers: state.answers,
    results: state.report.results.map((r) => ({
      id: r.id,
      prompt: r.prompt,
      given: r.given,
      correct: r.correct,
      answer: r.answer,
      explanation: r.explanation,
    })),
    createdAt: new Date().toISOString(),
  };
  attempts.unshift(attempt);
  storage.setItem(ATTEMPTS_KEY, JSON.stringify(attempts.slice(0, 50)));
}

export function getLocalHistoryAttempts(): LocalAttempt[] {
  const storage = getStorage();
  if (!storage) return [];
  const raw = storage.getItem(ATTEMPTS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function getLocalAudioTranscript(paperId: string, questionId: string): string {
  // 1. Tìm theo paperId chuẩn hóa
  const normalizedPaperId = paperId.startsWith('jlpt-') ? paperId : `jlpt-${paperId}`;
  const paper = jlptPapers.find(
    (p) => p.id === paperId || p.id === normalizedPaperId || p.id.replace(/^jlpt-/, '') === paperId.replace(/^jlpt-/, ''),
  );
  if (paper) {
    const q = paper.sections.flatMap((s) => s.questions).find((item) => item.id === questionId);
    if (q?.transcript) return q.transcript;
    if (q?.prompt) return q.prompt;
  }

  // 2. Dự phòng: Tìm trực tiếp theo questionId trên toàn bộ hệ thống đề thi
  for (const p of jlptPapers) {
    const q = p.sections.flatMap((s) => s.questions).find((item) => item.id === questionId);
    if (q?.transcript) return q.transcript;
    if (q?.prompt) return q.prompt;
  }

  return '音声の確認です。日本語の音が聞こえたら、試験を始めてください。';
}
