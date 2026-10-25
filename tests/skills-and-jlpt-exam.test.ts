import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../apps/api/src/app';
import { jlptPapers } from '../packages/shared/jlpt-papers';
import {
  getSkillExercises,
  skillCategories,
  shuffleQuestionOptions,
  shuffleArray,
} from '../packages/shared/jlpt-skills';

describe('JLPT Exam Qualification & Skills Practice', () => {
  let cookie = '';

  beforeAll(async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: `test_skills_${Date.now()}@example.com`,
      password: 'Password123!',
      name: 'Tester Skills',
      level: 'N5',
    });
    cookie = res.headers['set-cookie']?.[0] || '';
  });

  it('qualifies exactly candidate exams with full standard JLPT structure for "Luyện thi"', () => {
    const practiceExams = jlptPapers.filter((p) => p.isPracticeExam);
    const candidateIds = [
      'jlpt-n5-2024-07',
      'jlpt-n5-2010-2011',
      'jlpt-n5-2012-12',
      'jlpt-n5-2013-07',
      'jlpt-n5-2018',
      'jlpt-n5-2021-12',
    ];

    for (const id of candidateIds) {
      const found = practiceExams.find((p) => p.id === id);
      expect(found).toBeDefined();
      expect(found?.isPracticeExam).toBe(true);
      expect(found?.keySource).toMatch(/Đáp án gốc|Đáp án tham khảo/);

      // Verify each candidate exam has all 3 standard sections: Vocab, Grammar/Reading, Listening
      const sectionIds = found?.sections.map((s) => s.id);
      expect(sectionIds).toContain('vocabulary');
      expect(sectionIds).toContain('grammar-reading');
      expect(sectionIds).toContain('listening');

      // Verify listening section has pre-cut questions with syncStatus
      const listeningSection = found?.sections.find((s) => s.id === 'listening');
      expect(listeningSection?.questions.length).toBe(24);
      for (const q of listeningSection!.questions) {
        expect(q.audioUrl).toBeDefined();
        expect(q.audioUrl).toMatch(/^\/audio\/jlpt\//);
        expect(q.syncStatus).toBe('khớp tự động');
      }
    }

    // Verify 2017 is excluded from practice exam pool and flagged as duplicate audio
    const paper2017 = jlptPapers.find((p) => p.id === 'jlpt-n5-2017-07');
    expect(paper2017).toBeDefined();
    expect(paper2017?.isPracticeExam).toBe(false);
    expect(paper2017?.isDuplicateAudio).toBe(true);
    expect(paper2017?.duplicateNote).toContain('2010–2011');

    // Verify N4, N3, N2, N1 exams are in practice exam pool
    const newExams = [
      { id: 'jlpt-n4-2024-07', level: 'N4', listeningCount: 28 },
      { id: 'jlpt-n3-2023-07', level: 'N3', listeningCount: 28 },
      { id: 'jlpt-n2-2023-07', level: 'N2', listeningCount: 29 },
      { id: 'jlpt-n1-2023-07', level: 'N1', listeningCount: 30 },
    ];
    for (const exp of newExams) {
      const exam = practiceExams.find((p) => p.id === exp.id);
      expect(exam).toBeDefined();
      expect(exam?.level).toBe(exp.level);
      expect(exam?.isPracticeExam).toBe(true);
      expect(exam?.keySource).toMatch(/Đáp án gốc|Đáp án tham khảo/);
      const listeningSec = exam?.sections.find((s) => s.id === 'listening');
      expect(listeningSec?.questions.length).toBe(exp.listeningCount);
      for (const q of listeningSec!.questions) {
        expect(q.audioUrl).toBeDefined();
        expect(q.audioUrl).toMatch(/^\/audio\/jlpt\//);
        expect(q.syncStatus).toBe('khớp tự động');
      }
    }
  });

  it('serves skills metadata and categorized structure across N5-N2', async () => {
    const res = await request(app).get('/api/jlpt/skills').set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(4);
    const skills = res.body.map((s: { skill: string }) => s.skill);
    expect(skills).toEqual(['listening', 'reading', 'vocabulary', 'grammar']);
  });

  it('provides skill exercises for vocabulary and returns failed items for SM-2 flashcard addition', async () => {
    const res = await request(app)
      .get('/api/jlpt/skills/vocabulary/N5')
      .set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);

    const firstSet = res.body[0];
    expect(firstSet.questions.length).toBeGreaterThanOrEqual(5);

    // Submit with deliberately 1 right and 1 wrong answer to verify grading & failedVocab extraction
    const firstQ = firstSet.questions[0];
    const secondQ = firstSet.questions[1];
    const answers: Record<string, string> = {
      [firstQ.id]: firstQ.answer, // correct
      [secondQ.id]: 'WRONG_ANSWER', // incorrect
    };

    const submitRes = await request(app)
      .post('/api/jlpt/skills/submit')
      .set('Cookie', cookie)
      .send({
        setId: firstSet.id,
        skill: 'vocabulary',
        level: 'N5',
        answers,
      });

    expect(submitRes.status).toBe(200);
    expect(submitRes.body.total).toBe(firstSet.questions.length);
    expect(submitRes.body.correctCount).toBe(1);
    expect(submitRes.body.score).toBeLessThan(100);

    // Verify failedVocab extracted for SM-2
    expect(submitRes.body.failedVocab.length).toBeGreaterThanOrEqual(1);
    const failedItem = submitRes.body.failedVocab[0];
    expect(failedItem.term).toBeDefined();
    expect(failedItem.reading).toBeDefined();
  });

  it('provides listening skill exercises with pre-cut audio and scripts', async () => {
    const res = await request(app)
      .get('/api/jlpt/skills/listening/N5')
      .set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
    const set = res.body[0];
    expect(set.book).toBeDefined();
    expect(set.questions.length).toBeGreaterThan(0);
    expect(set.questions[0].transcript).toBeDefined();
  });

  it('provides original authored grammar exercises for N4-N2 with Star questions', async () => {
    for (const lvl of ['N4', 'N3', 'N2'] as const) {
      const sets = getSkillExercises('grammar', lvl);
      expect(sets.length).toBeGreaterThanOrEqual(1);
      const starQ = sets[0].questions.find((q) => q.group.includes('★'));
      expect(starQ).toBeDefined();
      expect(starQ?.explanation).toContain('Thứ tự hoàn chỉnh');
    }
  });

  it('shuffles question options dynamically when entering practice sets while preserving valid answer grading', () => {
    const sets = getSkillExercises('vocabulary', 'N5');
    const questions = sets[0].questions;

    // Run multiple shuffling passes
    const pass1 = shuffleQuestionOptions(questions);
    const pass2 = shuffleQuestionOptions(questions);

    // Verify all original options are preserved in every question
    for (let i = 0; i < questions.length; i++) {
      const orig = questions[i];
      const p1 = pass1[i];
      const p2 = pass2[i];

      expect(p1.options.slice().sort()).toEqual(orig.options.slice().sort());
      expect(p2.options.slice().sort()).toEqual(orig.options.slice().sort());
      expect(p1.options.includes(orig.answer)).toBe(true);
      expect(p2.options.includes(orig.answer)).toBe(true);
    }

    // Verify sequential audio numbered options are protected from shuffling
    const audioNumberedQuestions = [
      {
        id: 'listen-num-test',
        type: 'choice' as const,
        category: 'listening' as const,
        group: 'Phản xạ nhanh',
        prompt: '1番〜4番から選んでください',
        options: ['1', '2', '3', '4'],
        answer: '2',
        explanation: 'Đáp án là 2',
        annotationDisabled: true as const,
      },
    ];
    const shuffledAudio = shuffleQuestionOptions(audioNumberedQuestions);
    expect(shuffledAudio[0].options).toEqual(['1', '2', '3', '4']);

    // Across 20 shuffle runs on a 4-choice question, ensure variation occurs
    const sampleQ = questions.find((q) => q.options.length === 4)!;
    const signatures = new Set<string>();
    for (let r = 0; r < 20; r++) {
      const [shuffled] = shuffleQuestionOptions([sampleQ]);
      signatures.add(shuffled.options.join('|'));
    }
    expect(signatures.size).toBeGreaterThan(1);
  });

  it('runs client-side resilient exam workflow cleanly for newly added official exams', async () => {
    const {
      initLocalExamRun,
      advanceLocalExamRun,
      getLocalExamRun,
      getLocalAudioTranscript,
    } = await import('../packages/shared/jlpt-client-runner');

    // Test with newly added N1 official exam
    const testId = 'jlpt-n1-2022-07';
    const initialRun = initLocalExamRun(testId);
    expect(initialRun.testId).toBe(testId);
    expect(initialRun.section).toBe(0);
    expect(initialRun.questions.length).toBeGreaterThan(0);
    expect(initialRun.finished).toBe(false);

    // Save answer
    const q1 = initialRun.questions[0];
    const advanced = advanceLocalExamRun(testId, 'save', { [q1.id]: '1' });
    expect(advanced.answers[q1.id]).toBe('1');

    // Retrieve transcript
    const transcript = getLocalAudioTranscript(testId, 'n1-2022-07-l01');
    expect(typeof transcript).toBe('string');
    expect(transcript.length).toBeGreaterThan(0);

    // Finish exam early with finish-all
    const finishedRun = advanceLocalExamRun(testId, 'finish-all', { [q1.id]: '1' });
    expect(finishedRun.finished).toBe(true);
    expect(finishedRun.report).toBeDefined();
    expect(finishedRun.report?.score).toBeGreaterThanOrEqual(0);
  });
});
