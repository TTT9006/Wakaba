import { jlptRouter } from './jlpt';
import { loginReviewRouter } from './login-review';
import { consolidatedReviewRouter, getConsolidatedOverview } from './consolidated-review';
import { jlptPapers, paperSummary } from '../../../packages/shared/jlpt-papers';
import { grammarRouter, normalizeGrammarAnswer, grammarRoadmap } from './grammar';
import { allowedOrigin } from './origins';
import express, { type Request, type Response, type NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcryptjs';
import { randomBytes, createHash } from 'node:crypto';
import path from 'node:path';
import multer from 'multer';
import { z, ZodError } from 'zod';
import type { User } from '@prisma/client';
import { db } from './db';
import { annotate } from './annotation';
import { kanjiData, kanjiStrokes } from './kanji';
import { ensureDefaultDecks } from './default-decks';
import { parsePptxBuffer, type ExtractedDeckResult } from './pptx-parser';
import { parsePdfVocabulary } from './pdf-parser';
import { synthesizeSpeech } from './tts';
import { dictionaryStatus, entryInclude, searchDictionary, ensureDictionaryContent } from './dictionary';
import { schedule } from '../../../packages/shared/srs';
import { testDefinitions, type Exercise } from '../../../packages/shared/content';
declare global {
  namespace Express {
    interface Locals {
      user: User;
    }
  }
}
export const app = express();
app.disable('x-powered-by');
// Only enable for the local Cloudflare connector used by the sharing script.
if (process.env.RENDER || process.env.TRUST_PROXY === '1') {
  app.set('trust proxy', 1);
} else if (process.env.TRUST_PROXY_LOOPBACK === '1') {
  app.set('trust proxy', 'loopback');
}
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
const CSP_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "media-src 'self' blob:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

app.use((_req, res, next) => {
  res.setHeader('Content-Security-Policy', CSP_POLICY);
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  const origin = req.headers.origin;
  if (origin && allowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  }
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && origin) {
    if (!allowedOrigin(origin)) {
      res.status(403).json({ error: 'Nguồn yêu cầu không hợp lệ.' });
      return;
    }
  }
  next();
});
const safeUser = (u: User) => ({
  id: u.id,
  email: u.email,
  name: u.name,
  avatar: u.avatar,
  goal: u.goal,
  level: u.level,
  theme: u.theme,
  annotationMode: u.annotationMode,
  role: u.role,
});
const digest = (s: string) => createHash('sha256').update(s).digest('hex');
async function matchesPassword(password: string, hashes: string[]) {
  for (const hash of hashes) if (await bcrypt.compare(password, hash)) return true;
  return false;
}
async function session(res: Response, userId: string) {
  const token = randomBytes(32).toString('hex');
  await db.session.create({
    data: { token: digest(token), userId, expires: new Date(Date.now() + 30 * 86400000) },
  });
  const cookieOpts = {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 30 * 86400000,
    path: '/',
  };
  res.cookie('wakaba_session', token, cookieOpts);
  res.cookie('komorebi_session', token, cookieOpts);
}
async function auth(req: Request, res: Response, next: NextFunction) {
  const token = (req.cookies.wakaba_session || req.cookies.komorebi_session) as string | undefined;
  if (!token) {
    res.status(401).json({ error: 'Vui lòng đăng nhập để tiếp tục.' });
    return;
  }
  const s = await db.session.findUnique({
    where: { token: digest(token) },
    include: { user: true },
  });
  if (!s || s.expires < new Date()) {
    res.status(401).json({ error: 'Phiên đăng nhập đã hết hạn.' });
    return;
  }
  res.locals.user = s.user;
  res.locals.sessionToken = s.token;
  if (s.user.defaultDeckVersion < 1) await ensureDefaultDecks(s.user.id);
  next();
}
const credentials = z.object({
  email: z
    .email()
    .max(254)
    .transform((s) => s.toLowerCase()),
  password: z.string().min(8).max(128),
});
const sensitive = rateLimit({
  windowMs: 15 * 60000,
  limit: 40,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: 'Bạn thử quá nhiều lần. Vui lòng chờ 15 phút.' },
});
app.get('/api/health', async (_req, res) => {
  const count = await db.dictionaryEntry.count().catch(() => -1);
  res.json({
    status: 'ok',
    version: '2.2.0-nanami',
    databaseUrl: process.env.DATABASE_URL,
    dictionaryEntries: count,
  });
});
app.post('/api/auth/register', sensitive, async (req, res) => {
  const registerSchema = credentials.extend({
    name: z.string().trim().min(1).max(60),
    legalConsent: z.boolean().optional(),
    legalAcceptedAt: z.string().optional(),
  });
  const data = registerSchema.parse(req.body);
  if (await db.user.findUnique({ where: { email: data.email } })) {
    res.status(409).json({ error: 'Email này đã được đăng ký.' });
    return;
  }
  const user = await db.user.create({
    data: {
      email: data.email,
      name: data.name,
      password: await bcrypt.hash(data.password, 12),
    },
  });
  await db.deck.create({
    data: {
      userId: user.id,
      name: 'Từ vựng của tôi',
      description: 'Những từ đầu tiên trong hành trình của bạn',
    },
  });
  await session(res, user.id);
  res.status(201).json(safeUser(user));
});
app.post('/api/auth/login', sensitive, async (req, res) => {
  const data = credentials.parse(req.body);
  const user = await db.user.findUnique({ where: { email: data.email }, include: { passwordCredentials: true } });
  const valid = user && await matchesPassword(data.password, [user.password, ...user.passwordCredentials.map(credential => credential.password)]);
  if (!user || !valid) {
    res.status(401).json({ error: 'Email hoặc mật khẩu chưa đúng.' });
    return;
  }
  await session(res, user.id);
  res.json(safeUser(user));
});
app.post('/api/auth/demo', sensitive, async (_req, res) => {
  const user = await db.user.findFirst({
    where: { email: { in: ['demo@wakaba.local', 'demo@komorebi.local'] } },
  });
  if (!user) {
    res.status(503).json({ error: 'Chưa có tài khoản mẫu. Hãy chạy db:setup.' });
    return;
  }
  if (user.role !== 'user') {
    res.status(503).json({ error: 'Tài khoản mẫu cần được cấu hình quyền người dùng thường.' });
    return;
  }
  if (user.defaultDeckVersion < 1) await ensureDefaultDecks(user.id);
  await session(res, user.id);
  res.json(safeUser(user));
});
app.post('/api/auth/logout', async (req, res) => {
  const token = req.cookies.wakaba_session || req.cookies.komorebi_session;
  if (token)
    await db.session.deleteMany({ where: { token: digest(String(token)) } });
  res.clearCookie('wakaba_session', { path: '/' });
  res.clearCookie('komorebi_session', { path: '/' });
  res.json({ ok: true });
});
app.get('/api/auth/me', auth, (_req, res) => res.json(safeUser(res.locals.user)));
app.get(
  '/api/tts',
  rateLimit({ windowMs: 60000, limit: 120, standardHeaders: true, legacyHeaders: false }),
  async (req, res) => {
    try {
      const text = z.string().min(1).max(4000).parse(req.query.text);
      const voice = typeof req.query.voice === 'string' ? req.query.voice : 'ja-JP-NanamiNeural';
      const audioBuffer = await synthesizeSpeech(text, voice);
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.send(audioBuffer);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  },
);
app.post(
  '/api/tts',
  rateLimit({ windowMs: 60000, limit: 120, standardHeaders: true, legacyHeaders: false }),
  async (req, res) => {
    try {
      const text = z.string().min(1).max(4000).parse(req.body.text);
      const voice = typeof req.body.voice === 'string' ? req.body.voice : 'ja-JP-NanamiNeural';
      const audioBuffer = await synthesizeSpeech(text, voice);
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.send(audioBuffer);
    } catch (err) {
      res.status(400).json({ error: (err as Error).message });
    }
  },
);
app.use('/api', auth);
app.use('/api/login-review', loginReviewRouter);
app.use('/api/review/consolidated', consolidatedReviewRouter);
app.post(
  '/api/annotations',
  rateLimit({ windowMs: 60000, limit: 180, standardHeaders: true, legacyHeaders: false }),
  async (req, res) => {
    const { text } = z.object({ text: z.string().min(1).max(2000) }).parse(req.body);
    res.json({ segments: await annotate(text), version: 'kuromoji-0.1.2-ipadic' });
  },
);
app.get('/api/radicals', async (_req, res) => {
  const { radicals } = await kanjiData();
  const progress = await db.radicalProgress.findMany({ where: { userId: res.locals.user.id } });
  res.json(
    radicals.map((r) => ({
      ...r,
      completed: progress.find((p) => p.radicalId === r.id)?.completed || false,
    })),
  );
});
app.get('/api/kanji/:character', async (req, res) => {
  const { characters, radicals } = await kanjiData();
  const k = characters[String(req.params.character)];
  if (!k) {
    res.status(404).json({ error: 'Chưa có dữ liệu Kanji này.' });
    return;
  }
  res.json({ ...k, radical: radicals.find((r) => r.id === k.radicalId) });
});
app.get('/api/kanji/:character/strokes', async (req, res) => {
  const data = await kanjiStrokes(String(req.params.character));
  if (!data) {
    res.status(404).json({ error: 'Chưa có minh họa nét cho dạng chữ này.' });
    return;
  }
  res.json(data);
});
app.post('/api/radicals/:id/progress', async (req, res) => {
  const radicalId = z.coerce.number().int().min(1).max(214).parse(req.params.id);
  const { completed } = z.object({ completed: z.boolean() }).parse(req.body);
  const userId = res.locals.user.id;
  res.json(
    await db.radicalProgress.upsert({
      where: { userId_radicalId: { userId, radicalId } },
      create: { userId, radicalId, completed },
      update: { completed },
    }),
  );
});
app.post('/api/radicals/:id/srs', async (req, res) => {
  const radicalId = z.coerce.number().int().min(1).max(214).parse(req.params.id);
  const { radicals } = await kanjiData(),
    r = radicals.find((r) => r.id === radicalId)!;
  const userId = res.locals.user.id;
  const card = await db.$transaction(async (tx) => {
    const deck =
      (await tx.deck.findFirst({ where: { userId, name: 'Bộ thủ Kanji' } })) ||
      (await tx.deck.create({
        data: { userId, name: 'Bộ thủ Kanji', description: 'Ôn bộ thủ từ KANJIDIC2 / Unicode' },
      }));
    return tx.card.upsert({
      where: { deckId_radicalId: { deckId: deck.id, radicalId } },
      create: {
        deckId: deck.id,
        radicalId,
        materialType: 'radical',
        japanese: r.character,
        reading: r.readings.join(' / '),
        meaning: r.name,
        english: r.meanings.join('; '),
        note: 'Kanji ' + radicalId + ' · Tên Hán Việt: ' + r.vietnameseNames.join(', '),
      },
      update: {},
    });
  });
  res.json(card);
});
app.patch('/api/profile', async (req, res) => {
  const data = z
    .object({
      name: z.string().trim().min(1).max(60).optional(),
      avatar: z.enum(['花', '山', '月', '海', '猫', '森']).optional(),
      goal: z.number().int().min(1).max(200).optional(),
      level: z.enum(['N5', 'N4', 'N3', 'N2', 'N1']).optional(),
      theme: z.enum(['light', 'dark', 'system']).optional(),
      annotationMode: z.enum(['romanized', 'japanese']).optional(),
    })
    .parse(req.body);
  res.json(safeUser(await db.user.update({ where: { id: res.locals.user.id }, data })));
});
app.post('/api/profile/password', sensitive, async (req, res) => {
  const { currentPassword, password } = z
    .object({ currentPassword: z.string().max(128), password: z.string().min(8).max(128) })
    .parse(req.body);
  const credentials = await db.userPasswordCredential.findMany({ where: { userId: res.locals.user.id } });
  if (!(await matchesPassword(currentPassword, [res.locals.user.password, ...credentials.map(c => c.password)]))) {
    res.status(400).json({ error: 'Mật khẩu hiện tại chưa đúng.' });
    return;
  }
  await db.$transaction([
    db.user.update({
      where: { id: res.locals.user.id },
      data: { password: await bcrypt.hash(password, 12) },
    }),
    db.session.deleteMany({ where: { userId: res.locals.user.id } }),
    db.userPasswordCredential.deleteMany({ where: { userId: res.locals.user.id } }),
  ]);
  await session(res, res.locals.user.id);
  res.json({ ok: true });
});
app.get('/api/profile/export', async (_req, res) => {
  const userId = res.locals.user.id;
  const [user, decks, reviews, grammarProgress, attempts, testRuns, writings, searches, radicals] =
    await Promise.all([
      db.user.findUnique({ where: { id: userId } }),
      db.deck.findMany({ where: { userId }, include: { cards: true } }),
      db.review.findMany({ where: { userId } }),
      db.grammarProgress.findMany({
        where: { userId },
        include: { grammar: { select: { pattern: true, title: true, level: true } } },
      }),
      db.attempt.findMany({ where: { userId } }),
      db.testRun.findMany({ where: { userId } }),
      db.writing.findMany({ where: { userId } }),
      db.searchHistory.findMany({ where: { userId } }),
      db.radicalProgress.findMany({ where: { userId } }),
    ]);

  if (!user) {
    res.status(404).json({ error: 'Không tìm thấy thông tin người dùng.' });
    return;
  }

  const exportPayload = {
    exportedAt: new Date().toISOString(),
    legalNotice:
      'Dữ liệu cá nhân được xuất theo Quyền được cung cấp dữ liệu của chủ thể dữ liệu quy định tại Điều 9 Khoản 7 Nghị định số 13/2023/NĐ-CP của Chính phủ.',
    user: safeUser(user),
    learningData: {
      decks,
      reviewsCount: reviews.length,
      grammarProgress,
      testAttempts: attempts,
      testRuns,
      writings,
      searches,
      radicals,
    },
  };

  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="wakaba-user-data.json"');
  res.json(exportPayload);
});
app.delete('/api/profile', async (_req, res) => {
  const user = res.locals.user;
  if (user.email === 'demo@wakaba.local' || user.email === 'demo@komorebi.local') {
    res.status(403).json({ error: 'Không thể xóa tài khoản mẫu của hệ thống.' });
    return;
  }
  await db.user.delete({ where: { id: user.id } });
  const token = _req.cookies.wakaba_session || _req.cookies.komorebi_session;
  if (token) {
    await db.session.deleteMany({ where: { token: digest(String(token)) } });
  }
  res.clearCookie('wakaba_session', { path: '/' });
  res.clearCookie('komorebi_session', { path: '/' });
  res.json({
    ok: true,
    message: 'Tài khoản và toàn bộ dữ liệu cá nhân liên quan đã được xóa vĩnh viễn theo Nghị định 13/2023/NĐ-CP.',
  });
});
const localDay = (d: Date) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
app.get('/api/dashboard', async (_req, res) => {
  const userId = res.locals.user.id;
  const [cards, reviews, progress, attempts, writings, grammarAnswers, roadmap] = await Promise.all([
    db.card.findMany({ where: { deck: { userId } }, orderBy: { lastReviewed: 'desc' } }),
    db.review.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
    db.grammarProgress.findMany({ where: { userId, completed: true }, include: { grammar: true } }),
    db.attempt.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 30 }),
    db.writing.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 90 }),
    db.grammarAnswer.findMany({ where: { userId }, select: { createdAt: true } }),
    grammarRoadmap(userId, ['N5', 'N4', 'N3', 'N2', 'N1'].includes(res.locals.user.level) ? res.locals.user.level : undefined),
  ]);
  const activity = [
    ...reviews.map((r) => ({ date: r.createdAt, type: 'review' })),
    ...progress.map((p) => ({ date: p.updatedAt, type: 'grammar' })),
    ...attempts.map((a) => ({ date: a.createdAt, type: 'test' })),
    ...writings.map((w) => ({ date: w.createdAt, type: 'writing' })),
    ...grammarAnswers.map((a) => ({ date: a.createdAt, type: 'grammar-review' })),
  ];
  const days = new Set(activity.map((a) => localDay(a.date)));
  let streak = 0;
  const now = new Date();
  let cursor = now;
  if (!days.has(localDay(cursor))) cursor = new Date(cursor.getTime() - 86400000);
  while (days.has(localDay(cursor))) {
    streak++;
    cursor = new Date(cursor.getTime() - 86400000);
  }
  const weekly = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(now.getTime() - (6 - i) * 86400000);
    const key = localDay(date);
    return {
      date: key,
      label: new Intl.DateTimeFormat('vi', {
        weekday: 'short',
        timeZone: 'Asia/Ho_Chi_Minh',
      }).format(date),
      reviews: reviews.filter((r) => localDay(r.createdAt) === key).length,
      activities: activity.filter((a) => localDay(a.date) === key).length,
    };
  });
  res.json({
    user: safeUser(res.locals.user),
    learned: cards.filter((c) => c.repetitions > 0).length,
    totalCards: cards.length,
    due: cards.filter((c) => c.due <= now).length,
    grammarCompleted: progress.length,
    grammarTotal: await db.grammar.count(),
    today: weekly[6].reviews,
    streak,
    accuracy: attempts.length
      ? Math.round(attempts.reduce((sum, a) => sum + a.score, 0) / attempts.length)
      : null,
    weekly,
    recent: cards.filter((c) => c.lastReviewed).slice(0, 5),
    consolidatedReview: await getConsolidatedOverview(userId),
    nextLesson: roadmap.recommendation,
    attempts,
    upcoming: Array.from({ length: 7 }, (_, i) => {
      const date = localDay(new Date(now.getTime() + i * 86400000));
      return { date, count: cards.filter((c) => localDay(c.due) === date).length };
    }),
    activeDays: [...days],
  });
});
app.get('/api/dictionary/status', async (_req, res) => {
  let s = await dictionaryStatus();
  if (s.entries === 0) {
    await ensureDictionaryContent();
    s = await dictionaryStatus();
  }
  res.json({ ...s, jobs: undefined });
});
const searchParams = z.object({
  q: z.string().max(100).default(''),
  page: z.coerce.number().int().min(1).max(1000).default(1),
  limit: z.coerce.number().int().min(1).max(40).default(15),
});
app.get('/api/dictionary/search', async (req, res) => {
  const p = searchParams.parse(req.query);
  let result = await searchDictionary(p.q, p.page, p.limit);
  if (result.total === 0 && (await db.dictionaryEntry.count()) === 0) {
    await ensureDictionaryContent();
    result = await searchDictionary(p.q, p.page, p.limit);
  }
  res.json(result);
});
app.get('/api/dictionary/suggestions', async (req, res) => {
  const { q } = searchParams.parse(req.query);
  const result = await searchDictionary(q, 1, 5);
  res.json(
    result.items.map((e) => ({
      id: e.id,
      text: e.kanji[0]?.text || e.readings[0]?.text,
      reading: e.readings[0]?.text,
    })),
  );
});
app.get('/api/dictionary/history', async (_req, res) =>
  res.json(
    await db.searchHistory.findMany({
      where: { userId: res.locals.user.id },
      orderBy: { createdAt: 'desc' },
      take: 8,
    }),
  ),
);
app.post('/api/dictionary/history', async (req, res) => {
  const { query } = z.object({ query: z.string().trim().min(1).max(100) }).parse(req.body);
  await db.searchHistory.deleteMany({ where: { userId: res.locals.user.id, query } });
  res.json(await db.searchHistory.create({ data: { userId: res.locals.user.id, query } }));
});
app.get('/api/dictionary/:id', async (req, res) => {
  const entry = await db.dictionaryEntry.findUnique({
    where: { id: String(req.params.id) },
    include: entryInclude,
  });
  if (!entry) {
    res.status(404).json({ error: 'Không tìm thấy từ này.' });
    return;
  }
  res.json(entry);
});
async function ownedDeck(id: string, userId: string) {
  const deck = await db.deck.findFirst({
    where: { id, userId },
    include: { cards: { orderBy: { japanese: 'asc' } } },
  });
  if (!deck) throw Object.assign(Error('Không tìm thấy bộ thẻ.'), { status: 404 });
  return deck;
}
async function ownedCard(id: string, userId: string) {
  const card = await db.card.findFirst({ where: { id, deck: { userId } } });
  if (!card) throw Object.assign(Error('Không tìm thấy thẻ.'), { status: 404 });
  return card;
}
app.get('/api/flashcards/decks', async (_req, res) =>
  res.json(
    await db.deck.findMany({
      where: { userId: res.locals.user.id },
      include: { cards: true },
      orderBy: { createdAt: 'asc' },
    }),
  ),
);
const deckSchema = z.object({
  name: z.string().trim().min(1).max(80),
  description: z.string().max(300).default(''),
});
app.post('/api/flashcards/decks', async (req, res) =>
  res
    .status(201)
    .json(
      await db.deck.create({ data: { ...deckSchema.parse(req.body), userId: res.locals.user.id } }),
    ),
);
app.get('/api/flashcards/decks/:id', async (req, res) =>
  res.json(await ownedDeck(String(req.params.id), res.locals.user.id)),
);
app.patch('/api/flashcards/decks/:id', async (req, res) => {
  await ownedDeck(String(req.params.id), res.locals.user.id);
  res.json(
    await db.deck.update({
      where: { id: String(req.params.id) },
      data: deckSchema.partial().parse(req.body),
    }),
  );
});
app.delete('/api/flashcards/decks/:id', async (req, res) => {
  await ownedDeck(String(req.params.id), res.locals.user.id);
  await db.deck.delete({ where: { id: String(req.params.id) } });
  res.json({ ok: true });
});
const cardSchema = z.object({
  deckId: z.string(),
  japanese: z.string().trim().min(1).max(120),
  reading: z.string().max(200),
  meaning: z.string().trim().min(1).max(1000),
  english: z.string().max(1000).default(''),
  note: z.string().max(2000).default(''),
  example: z.string().max(1000).default(''),
  entryId: z.string().nullable().optional(),
});
app.post('/api/flashcards/cards', async (req, res) => {
  const data = cardSchema.parse(req.body);
  await ownedDeck(data.deckId, res.locals.user.id);
  res.status(201).json(await db.card.create({ data }));
});
app.patch('/api/flashcards/cards/:id', async (req, res) => {
  await ownedCard(String(req.params.id), res.locals.user.id);
  const data = cardSchema.partial().parse(req.body);
  if (data.deckId) await ownedDeck(data.deckId, res.locals.user.id);
  res.json(await db.card.update({ where: { id: String(req.params.id) }, data }));
});
app.delete('/api/flashcards/cards/:id', async (req, res) => {
  await ownedCard(String(req.params.id), res.locals.user.id);
  await db.card.delete({ where: { id: String(req.params.id) } });
  res.json({ ok: true });
});
app.get('/api/flashcards/review/due', async (req, res) => {
  const isAll = req.query.mode === 'all' || req.query.mode === 'anytime';
  const cardId = typeof req.query.card === 'string' ? req.query.card : undefined;

  let deckIds: string[] | undefined;
  if (typeof req.query.decks === 'string' && req.query.decks.trim()) {
    deckIds = req.query.decks.split(',').map((id) => id.trim()).filter(Boolean);
  } else if (Array.isArray(req.query.deck)) {
    deckIds = req.query.deck.filter((d): d is string => typeof d === 'string' && d.trim().length > 0);
  } else if (typeof req.query.deck === 'string' && req.query.deck.trim()) {
    if (req.query.deck.includes(',')) {
      deckIds = req.query.deck.split(',').map((id) => id.trim()).filter(Boolean);
    } else {
      deckIds = [req.query.deck.trim()];
    }
  }

  const deckFilter =
    deckIds && deckIds.length > 0
      ? deckIds.length === 1
        ? { id: deckIds[0], userId: res.locals.user.id }
        : { id: { in: deckIds }, userId: res.locals.user.id }
      : { userId: res.locals.user.id };

  if (isAll) {
    const cards = await db.card.findMany({
      where: {
        ...(cardId ? { id: cardId } : {}),
        deck: deckFilter,
      },
      include: {
        deck: {
          select: { id: true, name: true },
        },
      },
      take: 1000,
    });

    // Fisher-Yates shuffle to randomize words from multiple decks together
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }

    return res.json(cards);
  }

  return res.json(
    await db.card.findMany({
      where: {
        ...(cardId ? { id: cardId } : {}),
        deck: deckFilter,
        ...(cardId ? {} : { due: { lte: new Date() } }),
      },
      include: {
        deck: {
          select: { id: true, name: true },
        },
      },
      orderBy: { due: 'asc' },
      take: 100,
    }),
  );
});
app.post('/api/flashcards/review', async (req, res) => {
  const { cardId, rating, allowEarly } = z
    .object({
      cardId: z.string(),
      rating: z.number().int().min(0).max(3),
      allowEarly: z.boolean().optional(),
    })
    .parse(req.body);
  const card = await ownedCard(cardId, res.locals.user.id);
  if (card.due > new Date() && !allowEarly) {
    res.status(409).json({ error: 'Thẻ này đã được ôn. Vui lòng tải lại hàng đợi.' });
    return;
  }
  const next = schedule(card, rating);
  await db.$transaction([
    db.card.update({ where: { id: cardId }, data: next }),
    db.review.create({
      data: { userId: res.locals.user.id, cardId, rating, interval: next.interval },
    }),
  ]);
  res.json(next);
});
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(Object.assign(Error('Chỉ chấp nhận tệp PDF.'), { status: 400 }));
  },
});

const pptxUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 30 * 1024 * 1024, files: 20 },
  fileFilter: (_req, file, cb) => {
    const isPptx =
      file.mimetype === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' ||
      /\.pptx$/i.test(file.originalname);
    if (isPptx) cb(null, true);
    else cb(Object.assign(Error('Chỉ chấp nhận tệp PowerPoint (.pptx).'), { status: 400 }));
  },
});

app.post('/api/flashcards/pdf', upload.single('file'), async (req, res) => {
  if (!req.file || req.file.buffer.subarray(0, 5).toString() !== '%PDF-') {
    res.status(400).json({ error: 'Tệp PDF không hợp lệ.' });
    return;
  }
  const { PDFParse } = await import('pdf-parse');
  const parser = new PDFParse({ data: req.file.buffer });
  try {
    const result = await parser.getText();
    const parsed = await parsePdfVocabulary(result.text, req.file.originalname);
    const lines = result.text
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => /[\u3040-\u30ff\u4e00-\u9fff]/.test(s))
      .slice(0, 100);

    res.json({
      lines,
      deckName: parsed.deckName,
      cards: parsed.cards,
      message: parsed.cards.length
        ? `Đã quét và bóc tách thành công ${parsed.cards.length} từ vựng từ tệp PDF.`
        : lines.length
          ? 'Không bóc tách được từ vựng cấu trúc tự động. Hãy chọn từng dòng để thêm.'
          : 'Không tìm thấy văn bản tiếng Nhật. PDF ảnh quét cần OCR; ứng dụng chưa hỗ trợ OCR.',
    });
  } finally {
    await parser.destroy();
  }
});

// PPTX Vocabulary Import: Preview endpoint (accepts 1 or multiple .pptx files)
app.post('/api/flashcards/pptx/preview', pptxUpload.array('files', 20), async (req, res) => {
  const files = (req.files as Express.Multer.File[]) || (req.file ? [req.file] : []);
  if (!files || files.length === 0) {
    res.status(400).json({ error: 'Vui lòng chọn ít nhất một tệp PowerPoint (.pptx).' });
    return;
  }

  const results: ExtractedDeckResult[] = [];
  for (const file of files) {
    try {
      const extracted = await parsePptxBuffer(file.buffer, file.originalname);
      results.push(extracted);
    } catch (err) {
      console.error(`Lỗi đọc file pptx ${file.originalname}:`, err);
      res.status(400).json({ error: `Không thể đọc tệp ${file.originalname}: ${(err as Error).message}` });
      return;
    }
  }

  const totalCards = results.reduce((acc, r) => acc + r.cards.length, 0);
  res.json({
    results,
    totalDecks: results.length,
    totalCards,
    message: `Đã bóc tách thành công ${totalCards} từ vựng từ ${results.length} tệp bài giảng.`,
  });
});

// Commit imported decks and cards (batch create)
const importCommitSchema = z.object({
  targetDeckId: z.string().optional(), // If provided, add all cards into this existing deck
  decks: z.array(
    z.object({
      deckName: z.string().min(1).max(80),
      description: z.string().max(300).default(''),
      cards: z.array(
        z.object({
          term: z.string().min(1).max(120),
          reading: z.string().max(200),
          cleanReading: z.string().max(200).optional(),
          sinoVietnamese: z.string().optional(),
          meaning: z.string().min(1).max(1000),
          note: z.string().max(2000).optional(),
          example: z.string().max(1000).optional(),
        })
      ),
    })
  ),
});

app.post('/api/flashcards/import/commit', async (req, res) => {
  const { targetDeckId, decks } = importCommitSchema.parse(req.body);
  const userId = res.locals.user.id;

  const createdDeckIds: string[] = [];
  let totalCardsCreated = 0;

  if (targetDeckId) {
    await ownedDeck(targetDeckId, userId);
    const allCards = decks.flatMap((d) => d.cards);
    if (allCards.length > 0) {
      await db.card.createMany({
        data: allCards.map((c) => ({
          deckId: targetDeckId,
          japanese: c.term,
          reading: c.cleanReading || c.reading,
          meaning: c.meaning,
          note: c.note || '',
          example: c.example || '',
        })),
      });
      totalCardsCreated += allCards.length;
    }
    createdDeckIds.push(targetDeckId);
  } else {
    for (const d of decks) {
      if (!d.cards.length) continue;
      const newDeck = await db.deck.create({
        data: {
          name: d.deckName,
          description: d.description || 'Bộ từ vựng nhập tự động từ bài giảng.',
          userId,
        },
      });
      createdDeckIds.push(newDeck.id);

      await db.card.createMany({
        data: d.cards.map((c) => ({
          deckId: newDeck.id,
          japanese: c.term,
          reading: c.cleanReading || c.reading,
          meaning: c.meaning,
          note: c.note || '',
          example: c.example || '',
        })),
      });
      totalCardsCreated += d.cards.length;
    }
  }

  res.status(201).json({
    ok: true,
    deckIds: createdDeckIds,
    totalCardsCreated,
    message: `Đã lưu thành công ${totalCardsCreated} thẻ vào ${createdDeckIds.length} bộ thẻ.`,
  });
});
app.use('/api/grammar', grammarRouter);
const normalizeAnswer = normalizeGrammarAnswer;
app.use('/api/jlpt', jlptRouter);
app.get('/api/tests', (_req, res) => res.json(jlptPapers.map(paperSummary)));
app.get('/api/tests/history', async (_req, res) =>
  res.json(
    await db.attempt.findMany({
      where: { userId: res.locals.user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
  ),
);
app.post('/api/tests/:id/start', async (req, res) => {
  const id = String(req.params.id);
  let questions: Exercise[] = [];
  const def = testDefinitions.find((t) => t.id === id);
  const lessonIds = def?.lessonIds || (id === 'mixed' ? ['desu', 'wo'] : []);
  if (!def && !['vocabulary', 'mixed'].includes(id)) {
    res.status(404).json({ error: 'Không tìm thấy bài kiểm tra.' });
    return;
  }
  if (lessonIds.length) {
    const rows = await db.grammar.findMany({
      where: { id: { in: lessonIds } },
      orderBy: { position: 'asc' },
    });
    questions = rows.flatMap((r) => JSON.parse(r.exercises) as Exercise[]);
  }
  if (['vocabulary', 'mixed'].includes(id)) {
    const cards = await db.card.findMany({
      where: { deck: { userId: res.locals.user.id } },
      take: 30,
    });
    if (cards.length < 4) {
      res.status(400).json({ error: 'Hãy thêm ít nhất 4 thẻ để làm bài kiểm tra từ vựng.' });
      return;
    }
    const chosen = cards.sort(() => Math.random() - 0.5).slice(0, 10);
    questions.push(
      ...chosen.map((c, i): Exercise => ({
        id: 'vocab-' + c.id,
        readings: Object.fromEntries(
          cards.filter((x) => x.reading).map((x) => [x.japanese, x.reading]),
        ),
        type: i % 4 === 1 ? 'fill' : 'choice',
        prompt:
          i % 4 === 1
            ? `Viết từ tiếng Nhật có nghĩa: ${c.meaning}`
            : i % 4 === 2
              ? `Chọn từ tiếng Nhật có nghĩa: ${c.meaning}`
              : `「${c.japanese}」 có nghĩa là gì?`,
        ...(i % 4 === 1
          ? {}
          : {
              options: [
                i % 4 === 2 ? c.japanese : c.meaning,
                ...[
                  ...new Set(
                    cards
                      .filter((x) => x.meaning !== c.meaning && x.japanese !== c.japanese)
                      .map((x) => (i % 4 === 2 ? x.japanese : x.meaning)),
                  ),
                ].slice(0, 3),
              ].sort(() => Math.random() - 0.5),
            }),
        answer: i % 4 === 1 || i % 4 === 2 ? c.japanese : c.meaning,
        explanation: `${c.japanese}（${c.reading}）: ${c.meaning}`,
      })),
    );
  }
  if (['vocabulary', 'mixed'].includes(id)) {
    const pairs = await db.card.findMany({
      where: { deck: { userId: res.locals.user.id } },
      take: 4,
    });
    questions.push({
      id: 'matching',
      type: 'matching',
      prompt: 'Ghép mỗi từ với nghĩa phù hợp.',
      rows: pairs.map((c) => c.japanese),
      options: [...new Set(pairs.map((c) => c.meaning))].sort(() => Math.random() - 0.5),
      answer: JSON.stringify(pairs.map((c) => c.meaning)),
      explanation: pairs.map((c) => `${c.japanese}: ${c.meaning}`).join(' · '),
    });
  }
  const run = await db.testRun.create({
    data: { userId: res.locals.user.id, testId: id, questions: JSON.stringify(questions) },
  });
  res.json({
    runId: run.id,
    startedAt: run.startedAt,
    questions: questions.map(({ answer: _, explanation: __, ...q }) => q),
  });
});
app.post('/api/tests/:id/submit', async (req, res) => {
  if (String(req.params.id).startsWith('jlpt-')) {
    res.status(400).json({ error: 'Đề JLPT phải nộp theo từng phần trong phiên thi.' });
    return;
  }
  const { runId, answers } = z
    .object({ runId: z.string(), answers: z.record(z.string(), z.string().max(1000)) })
    .parse(req.body);
  const run = await db.testRun.findFirst({
    where: {
      id: runId,
      userId: res.locals.user.id,
      testId: String(req.params.id),
      submitted: false,
    },
  });
  if (!run) {
    res.status(409).json({ error: 'Bài làm đã được nộp hoặc không tồn tại.' });
    return;
  }
  const questions = JSON.parse(run.questions) as Exercise[];
  const results = questions.map((q) => ({
    ...q,
    given: answers[q.id] || '',
    correct: normalizeAnswer(answers[q.id] || '') === normalizeAnswer(q.answer),
  }));
  const score = Math.round((results.filter((r) => r.correct).length / results.length) * 100);
  const attempt = await db.$transaction(async (tx) => {
    const claimed = await tx.testRun.updateMany({
      where: { id: run.id, submitted: false },
      data: { submitted: true },
    });
    if (!claimed.count) throw Object.assign(Error('Bài đã được nộp.'), { status: 409 });
    return tx.attempt.create({
      data: {
        userId: res.locals.user.id,
        testId: run.testId,
        score,
        answers: JSON.stringify(results),
        duration: Math.floor((Date.now() - run.startedAt.getTime()) / 1000),
      },
    });
  });
  res.json({ ...attempt, results });
});
app.get('/api/writing', async (_req, res) =>
  res.json(
    await db.writing.findMany({
      where: { userId: res.locals.user.id },
      orderBy: { createdAt: 'desc' },
      take: 30,
    }),
  ),
);
app.post('/api/writing', async (req, res) => {
  const data = z
    .object({
      character: z.string().min(1).max(4),
      strokes: z
        .array(
          z
            .array(z.object({ x: z.number().min(0).max(400), y: z.number().min(0).max(400) }))
            .min(1)
            .max(3000),
        )
        .min(1)
        .max(100),
    })
    .parse(req.body);
  res.status(201).json(
    await db.writing.create({
      data: {
        userId: res.locals.user.id,
        character: data.character,
        strokes: JSON.stringify(data.strokes),
      },
    }),
  );
});
app.use('/api/admin', (_req, res, next) => {
  if (res.locals.user.role !== 'admin') {
    res.status(403).json({ error: 'Chỉ quản trị viên có thể xem trang này.' });
    return;
  }
  next();
});
app.get('/api/admin/translations/status', async (_req, res) => res.json(await dictionaryStatus()));
app.get('/api/admin/translations/jobs', async (_req, res) =>
  res.json(await db.translationJob.findMany({ orderBy: { startedAt: 'desc' }, take: 30 })),
);
app.use('/api', (_req, res) => res.status(404).json({ error: 'Không tìm thấy chức năng này.' }));
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.resolve('dist')));
  app.get('/{*path}', (_req, res) => res.sendFile(path.resolve('dist/index.html')));
}
app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof ZodError) {
    const details = error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
    console.error('Validation error (ZodError):', details);
    res.status(400).json({
      error: `Thông tin chưa hợp lệ (${details}). Vui lòng kiểm tra các trường đã nhập.`,
      details: error.issues.map((i) => ({ path: i.path, message: i.message })),
    });
    return;
  }
  const e = error as { status?: number; code?: string; message?: string };
  if (e.code === 'LIMIT_FILE_SIZE') {
    res.status(413).json({ error: 'Tệp PDF phải nhỏ hơn 5 MB.' });
    return;
  }
  console.error(error);
  res
    .status(e.status || 500)
    .json({ error: e.status ? e.message : 'Có lỗi xảy ra. Vui lòng thử lại.' });
});
