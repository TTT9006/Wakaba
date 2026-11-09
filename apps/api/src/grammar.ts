import { recordExp } from './leaderboard';
import { Router } from 'express';
import { createHash, randomUUID } from 'node:crypto';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { db } from './db';
import { schedule } from '../../../packages/shared/srs';
import { lessons, type Exercise, type LessonContent } from '../../../packages/shared/content';

export const grammarRouter = Router();
export const normalizeGrammarAnswer = (s: string) =>
  s
    .normalize('NFKC')
    .replace(/[\s。.!！?？、,]/g, '')
    .toLowerCase();
const levelSchema = z.enum(['N5', 'N4', 'N3', 'N2', 'N1']);
export function publicQuestion({
  answer: _answer,
  explanation: _explanation,
  acceptedAnswers: _accepted,
  ...question
}: Exercise) {
  return question;
}
const includeFor = (userId: string) => ({
  progress: { where: { userId } },
  exerciseProgress: { where: { userId } },
});
type GrammarWithProgress = Prisma.GrammarGetPayload<{ include: ReturnType<typeof includeFor> }>;
function summarize(lesson: GrammarWithProgress) {
  const exercises = JSON.parse(lesson.exercises) as Exercise[];
  const currentIds = new Set(exercises.map((q) => q.id));
  const states = lesson.exerciseProgress.filter((p) => currentIds.has(p.exerciseId));
  const correct = states.filter((p) => p.lastCorrect).length;
  const now = new Date();
  return {
    id: lesson.id,
    title: lesson.title,
    pattern: lesson.pattern,
    level: lesson.level,
    position: lesson.position,
    curriculum: (JSON.parse(lesson.content) as LessonContent).curriculum,
    progress: lesson.progress,
    practice: {
      total: exercises.length,
      answered: states.length,
      correct,
      mastered: exercises.length > 0 && correct === exercises.length,
      due: states.filter((p) => p.due <= now).length,
      weak: states.filter((p) => !p.lastCorrect).length,
      nextDue: states.length
        ? new Date(Math.min(...states.map((p) => p.due.getTime()))).toISOString()
        : null,
    },
  };
}

export async function syncGrammarContent() {
  // Stable IDs preserve bookmarks, completion and review history. No deletes or reset.
  for (const lesson of lessons) {
    const data = {
      ...lesson,
      content: JSON.stringify(lesson.content),
      exercises: JSON.stringify(lesson.exercises),
    };
    const existing = await db.grammar.findUnique({ where: { id: lesson.id } });
    if (!existing) await db.grammar.create({ data });
    else if (
      existing.content !== data.content ||
      existing.exercises !== data.exercises ||
      existing.position !== data.position ||
      existing.pattern !== data.pattern ||
      existing.title !== data.title ||
      existing.level !== data.level
    ) {
      await db.grammar.update({ where: { id: lesson.id }, data });
    }
  }
}

grammarRouter.get('/', async (req, res) => {
  const level = req.query.level === undefined ? undefined : levelSchema.parse(req.query.level);
  const q = z
    .string()
    .max(120)
    .parse(req.query.q || '');
  const rows = await db.grammar.findMany({
    where: {
      ...(level ? { level } : {}),
      OR: [{ title: { contains: q } }, { pattern: { contains: q } }],
    },
    include: includeFor(res.locals.user.id),
    orderBy: { position: 'asc' },
  });
  res.json(rows.map(summarize));
});

export async function grammarRoadmap(userId: string, selected?: string) {
  const rows = await db.grammar.findMany({
    include: includeFor(userId),
    orderBy: { position: 'asc' },
  });
  const summaries = rows.map(summarize);
  const levels = ['N5', 'N4', 'N3', 'N2', 'N1'].map((level) => {
    const items = summaries.filter((l) => l.level === level);
    return {
      level,
      total: items.length,
      completed: items.filter((l) => l.progress[0]?.completed).length,
      mastered: items.filter((l) => l.practice.mastered).length,
      due: items.reduce((n, l) => n + l.practice.due, 0),
      weak: items.reduce((n, l) => n + l.practice.weak, 0),
    };
  });
  const selectedLessons = summaries.filter((l) => !selected || l.level === selected);
  const due = selectedLessons
    .filter((l) => l.practice.due > 0)
    .sort((a, b) => (a.practice.nextDue || '').localeCompare(b.practice.nextDue || ''))[0];
  const weak = selectedLessons.find((l) => l.practice.weak > 0);
  const started = selectedLessons.find((l) => l.practice.answered > 0 && !l.practice.mastered);
  const next =
    selectedLessons.find((l) => !l.practice.mastered && !l.progress[0]?.completed) ||
    selectedLessons.find((l) => !l.practice.mastered);
  const recommended = due || weak || started || next;
  return {
    levels,
    total: summaries.length,
    recommendation: recommended
      ? {
          ...recommended,
          reason: due
            ? 'Đã đến lịch ôn'
            : weak
              ? 'Củng cố câu vừa làm sai'
              : started
                ? 'Hoàn thành bài đang học'
                : 'Bước tiếp theo trong lộ trình',
          action: due ? 'review' : weak ? 'mistakes' : 'learn',
        }
      : null,
    due: selectedLessons.reduce((n, l) => n + l.practice.due, 0),
    weak: selectedLessons.reduce((n, l) => n + l.practice.weak, 0),
  };
}
grammarRouter.get('/roadmap', async (req, res) => {
  const selected = req.query.level === undefined ? undefined : levelSchema.parse(req.query.level);
  res.json(await grammarRoadmap(res.locals.user.id, selected));
});

grammarRouter.get('/review', async (req, res) => {
  const level = req.query.level === undefined ? undefined : levelSchema.parse(req.query.level);
  const mode = z.enum(['due', 'mistakes']).parse(req.query.mode || 'due');
  const states = await db.grammarExerciseProgress.findMany({
    where: {
      userId: res.locals.user.id,
      ...(level ? { grammar: { level } } : {}),
      ...(mode === 'mistakes' ? { lastCorrect: false } : { due: { lte: new Date() } }),
    },
    include: { grammar: true },
    orderBy: [{ due: 'asc' }, { id: 'asc' }],
  });
  const items = states.flatMap((s) => {
    const exercise = (JSON.parse(s.grammar.exercises) as Exercise[]).find(
      (q) => q.id === s.exerciseId,
    );
    return exercise
      ? [
          {
            grammarId: s.grammarId,
            title: s.grammar.title,
            level: s.grammar.level,
            question: publicQuestion(exercise),
            due: s.due,
          },
        ]
      : [];
  });
  res.json({ items: items.slice(0, 20), total: items.length });
});

grammarRouter.get('/:id', async (req, res) => {
  const lesson = await db.grammar.findUnique({
    where: { id: String(req.params.id) },
    include: includeFor(res.locals.user.id),
  });
  if (!lesson) {
    res.status(404).json({ error: 'Không tìm thấy bài học.' });
    return;
  }
  const neighbors = await db.grammar.findMany({
    select: { id: true, title: true, position: true },
    orderBy: { position: 'asc' },
  });
  const at = neighbors.findIndex((l) => l.id === lesson.id);
  res.json({
    ...summarize(lesson),
    content: JSON.parse(lesson.content),
    exercises: (JSON.parse(lesson.exercises) as Exercise[]).map(publicQuestion),
    previous: neighbors[at - 1] || null,
    next: neighbors[at + 1] || null,
  });
});
grammarRouter.post('/:id/progress', async (req, res) => {
  const data = z
    .object({ completed: z.boolean().optional(), bookmarked: z.boolean().optional() })
    .parse(req.body);
  const grammarId = String(req.params.id),
    userId = res.locals.user.id;
  if (!(await db.grammar.findUnique({ where: { id: grammarId } }))) {
    res.status(404).json({ error: 'Không tìm thấy bài học.' });
    return;
  }
  res.json(
    await (async () => {
      const resProg = await db.grammarProgress.upsert({
        where: { userId_grammarId: { userId, grammarId } },
        create: { userId, grammarId, ...data },
        update: data,
      });
      if (data.completed) {
        await recordExp(userId, 'grammar', 20, grammarId);
      }
      return resProg;
    })(),
  );
});

grammarRouter.post('/:id/exercise', async (req, res) => {
  const { exerciseId, answer, attemptId } = z
    .object({
      exerciseId: z.string().max(120),
      answer: z.string().trim().min(1).max(1000),
      attemptId: z.string().min(8).max(100).optional(),
    })
    .parse(req.body);
  const grammarId = String(req.params.id),
    userId = res.locals.user.id;
  const lesson = await db.grammar.findUnique({ where: { id: grammarId } });
  const exercise =
    lesson && (JSON.parse(lesson.exercises) as Exercise[]).find((e) => e.id === exerciseId);
  if (!exercise) {
    res.status(404).json({ error: 'Không tìm thấy câu hỏi.' });
    return;
  }
  const correct = [exercise.answer, ...(exercise.acceptedAnswers || [])].some(
    (a) => normalizeGrammarAnswer(a) === normalizeGrammarAnswer(answer),
  );
  const id = createHash('sha256')
    .update(userId + ':' + (attemptId || randomUUID()))
    .digest('hex');
  if (correct) {
    await recordExp(userId, 'grammar', 5, exerciseId);
  }
  const reply = { correct, answer: exercise.answer, explanation: exercise.explanation };
  const prior = await db.grammarAnswer.findUnique({ where: { id } });
  if (prior) {
    if (
      prior.grammarId !== grammarId ||
      prior.exerciseId !== exerciseId ||
      prior.answer !== answer
    ) {
      res.status(409).json({ error: 'Lượt trả lời này đã được lưu với nội dung khác.' });
      return;
    }
    res.json({ ...reply, correct: prior.correct });
    return;
  }
  try {
    await db.$transaction(async (tx) => {
      await tx.grammarAnswer.create({
        data: { id, userId, grammarId, exerciseId, answer, correct },
      });
      const where = { userId_grammarId_exerciseId: { userId, grammarId, exerciseId } };
      const current = await tx.grammarExerciseProgress.findUnique({ where });
      const next = schedule(current || { ease: 2.5, interval: 0, repetitions: 0 }, correct ? 2 : 0);
      await tx.grammarExerciseProgress.upsert({
        where,
        create: {
          userId,
          grammarId,
          exerciseId,
          attempts: 1,
          correctCount: correct ? 1 : 0,
          lastCorrect: correct,
          ...next,
        },
        update: {
          attempts: { increment: 1 },
          correctCount: { increment: correct ? 1 : 0 },
          lastCorrect: correct,
          ...next,
        },
      });
      await tx.grammarProgress.upsert({
        where: { userId_grammarId: { userId, grammarId } },
        create: { userId, grammarId },
        update: { updatedAt: new Date() },
      });
    });
  } catch (error) {
    // A network retry may arrive concurrently. It must not advance the SRS twice.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      const saved = await db.grammarAnswer.findUnique({ where: { id } });
      if (
        !saved ||
        saved.grammarId !== grammarId ||
        saved.exerciseId !== exerciseId ||
        saved.answer !== answer
      )
        throw error;
    } else throw error;
  }
  res.json(reply);
});
