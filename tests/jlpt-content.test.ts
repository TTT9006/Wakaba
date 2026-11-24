import { describe, it, expect } from 'vitest';
import { jlptPapers, jlptPracticePapers, paperSummary } from '../packages/shared/jlpt-papers';
describe('Original full-length JLPT practice papers', () => {
  it('has four papers, official section timing and declared question counts', () => {
    expect(jlptPracticePapers.map((p) => p.level)).toEqual(['N5', 'N4', 'N3', 'N2']);
    expect(jlptPracticePapers.map((p) => p.sections.map((s) => s.minutes))).toEqual([
      [20, 40, 30],
      [25, 55, 35],
      [30, 70, 40],
      [105, 50],
    ]);
    expect(jlptPracticePapers.map((p) => paperSummary(p).total)).toEqual([71, 86, 102, 107]);
  });
  it('provides unique questions, one exact answer and protected reading prompts', () => {
    for (const paper of jlptPapers) {
      const ids = new Set<string>();
      for (const q of paper.sections.flatMap((s) => s.questions)) {
        expect(ids.has(q.id), q.id).toBe(false);
        ids.add(q.id);
        expect(
          q.options.filter((o) => o === q.answer),
          q.id,
        ).toHaveLength(1);
        expect(new Set(q.options).size, q.id).toBe(q.options.length);
        expect(q.options.length, q.id).toBeGreaterThanOrEqual(3);
        if (paper.isFinal) {
          if (q.group.startsWith('Hán tự')) {
            expect(q.annotationDisabled, q.id).toBe(true);
          }
        } else {
          expect(q.annotationDisabled, q.id).toBe(true);
        }
        expect(q.explanation.length, q.id).toBeGreaterThan(10);
        if (q.category === 'reading') expect(q.passage?.length ?? 0, `${paper.id} ${q.id}`).toBeGreaterThan(50);
        if (q.category === 'listening') expect(q.transcript?.length, q.id).toBeGreaterThan(10);
      }
    }
  });
  it('includes level-specific formats without inventing an N5 usage section', () => {
    const groups = (level: string) =>
      new Set(
        jlptPapers
          .find((p) => p.level === level)!
          .sections.flatMap((s) => s.questions.map((q) => q.group)),
      );
    expect(groups('N5').has('Cách dùng từ')).toBe(false);
    expect(groups('N2').has('Cấu tạo từ')).toBe(true);
    expect(groups('N3').has('Đoạn dài')).toBe(true);
    expect(groups('N2').has('So sánh hai văn bản')).toBe(true);
    expect(groups('N2').has('Quan điểm tác giả')).toBe(true);
    expect(groups('N2').has('Hiểu tổng hợp')).toBe(true);
  });
  it('includes official JLPT N5 2024-07 paper with exact audio and illustrations', () => {
    const paper = jlptPapers.find((p) => p.id === 'jlpt-n5-2024-07');
    expect(paper).toBeDefined();
    expect(paper!.isOfficial).toBe(true);
    expect(paper!.sections).toHaveLength(3);
    const [vocab, grammarReading, listening] = paper!.sections;
    expect(vocab.questions).toHaveLength(21);
    expect(grammarReading.questions).toHaveLength(22);
    expect(listening.questions).toHaveLength(24);
    expect(vocab.minutes).toBe(20);
    expect(grammarReading.minutes).toBe(40);
    expect(listening.minutes).toBe(30);
    expect(listening.questions.every((q) => q.audioUrl?.startsWith('/audio/jlpt/n5-2024-07/'))).toBe(true);
    expect(grammarReading.questions.some((q) => q.imageUrl?.startsWith('/images/jlpt/n5-2024-07/'))).toBe(true);
    expect(listening.questions.filter((q) => q.imageUrl?.startsWith('/images/jlpt/n5-2024-07/'))).toHaveLength(12);
  });
  it('includes official JLPT N5 papers (2021-12, 2017-07, 2013-07) with exact audio and illustrations', () => {
    const ids = ['jlpt-n5-2021-12', 'jlpt-n5-2017-07', 'jlpt-n5-2013-07'];
    for (const id of ids) {
      const paper = jlptPapers.find((p) => p.id === id);
      expect(paper, `Paper ${id} must exist`).toBeDefined();
      expect(paper!.isOfficial).toBe(true);
      expect(paper!.sections).toHaveLength(3);
      const [vocab, grammarReading, listening] = paper!.sections;
      expect(vocab.questions.length).toBeGreaterThanOrEqual(20);
      expect(grammarReading.questions.length).toBeGreaterThanOrEqual(20);
      expect(listening.questions).toHaveLength(24);
      expect(vocab.minutes).toBe(20);
      expect(grammarReading.minutes).toBe(40);
      expect(listening.minutes).toBe(30);
      const slug = id.replace('jlpt-', '');
      expect(listening.questions.every((q) => q.audioUrl?.startsWith(`/audio/jlpt/${slug}/`))).toBe(true);
      expect(listening.questions.some((q) => q.imageUrl?.startsWith(`/images/jlpt/${slug}/`))).toBe(true);
    }
  });
});
