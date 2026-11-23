import { beforeAll, afterAll, describe, it, expect, vi } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, mkdirSync, rmSync, readdirSync } from 'node:fs';
import path from 'node:path';
import request from 'supertest';
import type { Express } from 'express';
import type { PrismaClient } from '@prisma/client';
import { lessons } from '../packages/shared/content';
const testDir = path.resolve('test-results/api');
const testDb = path.join(testDir, 'learning.db');
let app: Express, db: PrismaClient;
let session: ReturnType<typeof request.agent>;
let userId: string;
let deckId: string;
let cardId: string;
beforeAll(async () => {
  mkdirSync(testDir, { recursive: true });
  rmSync(testDb, { force: true });
  const sqlite = new DatabaseSync(testDb);
  for (const name of readdirSync('prisma/migrations').filter(n=>/^\d/.test(n)).sort()) sqlite.exec(readFileSync(`prisma/migrations/${name}/migration.sql`, 'utf8'));
  sqlite.close();
  process.env.DATABASE_URL = 'file:' + testDb.replace(/\\/g, '/');
  vi.resetModules();
  ({ app } = await import('../apps/api/src/app'));
  ({ db } = await import('../apps/api/src/db'));
  session = request.agent(app);
  for (const l of lessons)
    await db.grammar.create({
      data: { ...l, content: JSON.stringify(l.content), exercises: JSON.stringify(l.exercises) },
    });
});
afterAll(async () => {
  await db?.$disconnect();
});
describe.sequential('Authenticated learning workflows', () => {
  it('enforces all required security headers (CSP, HSTS, XFO, nosniff, Referrer-Policy)', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['content-security-policy']).toContain("default-src 'self'");
    expect(res.headers['content-security-policy']).toContain("frame-ancestors 'none'");
    expect(res.headers['content-security-policy']).toContain("object-src 'none'");
    expect(res.headers['x-frame-options']).toBe('DENY');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['strict-transport-security']).toBe('max-age=31536000; includeSubDomains');
    expect(res.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
  });
  it('protects personal data', async () => {
    expect((await request(app).get('/api/dashboard')).status).toBe(401);
  });
  it('registers with a hashed password and an HTTP-only cookie', async () => {
    const res = await session
      .post('/api/auth/register')
      .send({ name: 'Người học', email: 'learner@example.com', password: 'example-password' });
    expect(res.status).toBe(201);
    expect(res.body.password).toBeUndefined();
    expect(String(res.headers['set-cookie'])).toContain('HttpOnly');
    userId = res.body.id;
    expect((await db.user.findUniqueOrThrow({ where: { id: userId } })).password).not.toBe(
      'example-password',
    );
  });
  it('rejects duplicate accounts and incorrect login', async () => {
    expect(
      (
        await request(app)
          .post('/api/auth/register')
          .send({ name: 'A', email: 'learner@example.com', password: 'example-password' })
      ).status,
    ).toBe(409);
    expect(
      (
        await request(app)
          .post('/api/auth/login')
          .send({ email: 'learner@example.com', password: 'wrong-password' })
      ).status,
    ).toBe(401);
    expect(
      (
        await request(app)
          .post('/api/auth/login')
          .send({ email: 'learner@example.com', password: 'example-password' })
      ).status,
    ).toBe(200);
  });
  it('allows login from changing local Vite ports and rejects untrusted websites', async () => {
    const previous = process.env.APP_ORIGINS;
    try {
      delete process.env.APP_ORIGINS;
      for (const origin of ['http://127.0.0.1:5173', 'http://localhost:5173', 'http://127.0.0.1:5174', 'http://localhost:5174', 'http://127.0.0.1:5175']) {
        const agent = request.agent(app);
        expect((await agent.post('/api/auth/login').set('Origin', origin).send({ email: 'learner@example.com', password: 'example-password' })).status).toBe(200);
        expect((await agent.get('/api/auth/me')).status).toBe(200);
      }
      process.env.APP_ORIGINS = 'https://example.com';
      expect((await request(app).post('/api/auth/login').set('Origin', 'http://localhost.attacker.example:5175').send({ email: 'learner@example.com', password: 'example-password' })).status).toBe(403);
    } finally {
      if (previous === undefined) delete process.env.APP_ORIGINS;
      else process.env.APP_ORIGINS = previous;
    }
  });
  it('accepts merged passwords, then revokes both old passwords on password change', async () => {
    const bcrypt = (await import('bcryptjs')).default;
    const alias = 'previous-trial-password';
    await db.userPasswordCredential.create({ data: { userId, password: await bcrypt.hash(alias, 4) } });
    const alternate = request.agent(app);
    const login = await alternate.post('/api/auth/login').send({ email: 'learner@example.com', password: alias });
    expect(login.status).toBe(200);
    expect(login.body.passwordCredentials).toBeUndefined();
    expect((await alternate.post('/api/profile/password').send({ currentPassword: alias, password: 'unified-new-password' })).status).toBe(200);
    expect(await db.userPasswordCredential.count({ where: { userId } })).toBe(0);
    for (const password of [alias, 'example-password']) expect((await request(app).post('/api/auth/login').send({ email: 'learner@example.com', password })).status).toBe(401);
    expect((await session.get('/api/auth/me')).status).toBe(401);
    expect((await session.post('/api/auth/login').send({ email: 'learner@example.com', password: 'unified-new-password' })).status).toBe(200);
  });
  it('does not inject sample decks and preserves clean flashcard decks for user accounts', async () => {
    const first = await session.get('/api/flashcards/decks');
    expect(first.status).toBe(200);
    const decks = first.body as { id: string; name: string; cards: { id: string; japanese: string; note: string }[] }[];
    // Ensure no sample decks are injected
    expect(decks.every((d) => !d.name.startsWith('Kanji ·') && d.name !== 'Hiragana' && d.name !== 'Katakana')).toBe(true);
    const userDeck = decks.find((d) => d.name === 'Từ vựng của tôi')!;
    expect(userDeck).toBeDefined();

    // Add a card to user's deck and verify progress persistence
    const newCard = await db.card.create({
      data: {
        deckId: userDeck.id,
        japanese: '桜',
        reading: 'さくら',
        meaning: 'hoa anh đào',
        repetitions: 4,
        interval: 10,
        note: 'Ghi chú riêng',
      },
    });

    const other = request.agent(app);
    await other.post('/api/auth/register').send({ name: 'CleanDecks', email: 'cleandecks@example.com', password: 'example-password' });
    const [a, b] = await Promise.all([other.get('/api/flashcards/decks'), other.get('/api/flashcards/decks')]);
    expect(a.status).toBe(200); expect(b.status).toBe(200);
    expect(a.body.every((d: { name: string }) => !d.name.startsWith('Kanji ·') && d.name !== 'Hiragana')).toBe(true);
    expect((await other.get('/api/flashcards/decks/' + userDeck.id)).status).toBe(404);
  });
  it('rejects cross-origin writes', async () => {
    expect(
      (
        await session
          .post('/api/flashcards/decks')
          .set('Origin', 'https://attacker.example')
          .send({ name: 'Bad' })
      ).status,
    ).toBe(403);
  });
  it('persists annotation preferences and rejects unsupported modes', async()=>{
    expect((await session.get('/api/auth/me')).body.annotationMode).toBe('japanese');
    expect((await session.patch('/api/profile').send({annotationMode:'romanized'})).body.annotationMode).toBe('romanized');
    expect((await session.get('/api/auth/me')).body.annotationMode).toBe('romanized');
    expect((await session.patch('/api/profile').send({annotationMode:'off'})).status).toBe(400);
    const annotation=await session.post('/api/annotations').send({text:'今日は学校に行きます。'});
    expect(annotation.status).toBe(200);expect(annotation.body.segments.map((s:{text:string})=>s.text).join('')).toBe('今日は学校に行きます。');
  });
  it('saves radical progress per account and reuses SRS without resetting cards',async()=>{
    expect((await session.get('/api/radicals')).body).toHaveLength(214);
    expect((await session.post('/api/radicals/85/progress').send({completed:true})).status).toBe(200);
    expect((await session.get('/api/radicals')).body.find((r:{id:number})=>r.id===85).completed).toBe(true);
    const other=request.agent(app);await other.post('/api/auth/register').send({name:'Other',email:'radical-other@example.com',password:'example-password'});
    expect((await other.get('/api/radicals')).body.find((r:{id:number})=>r.id===85).completed).toBe(false);
    expect((await session.post('/api/radicals/999/progress').send({completed:true})).status).toBe(400);
    const first=(await session.post('/api/radicals/85/srs').send({})).body;
    await db.card.update({where:{id:first.id},data:{interval:7,repetitions:3,due:new Date(Date.now()+7*86400000)}});
    const again=(await session.post('/api/radicals/85/srs').send({})).body;
    expect(again.id).toBe(first.id);expect(again.interval).toBe(7);expect(again.materialType).toBe('radical');
    expect((await session.get('/api/kanji/'+encodeURIComponent('海'))).body.radical.id).toBe(85);
    expect((await session.get('/api/kanji/'+encodeURIComponent('氵')+'/strokes')).body.paths).toHaveLength(3);
  });
  it('creates cards and enforces ownership', async () => {
    const deck = await session.post('/api/flashcards/decks').send({ name: 'Từ đầu tiên' });
    expect(deck.status).toBe(201);
    deckId = deck.body.id;
    const card = await session
      .post('/api/flashcards/cards')
      .send({ deckId, japanese: '食べる', reading: 'たべる', meaning: 'ăn' });
    expect(card.status).toBe(201);
    cardId = card.body.id;
    const outsider = request.agent(app);
    await outsider
      .post('/api/auth/register')
      .send({ name: 'Other', email: 'other@example.com', password: 'example-password' });
    expect(
      (await outsider.patch('/api/flashcards/cards/' + cardId).send({ meaning: 'changed' })).status,
    ).toBe(404);
    expect((await outsider.get('/api/admin/translations/status')).status).toBe(403);
  });
  it('saves review history, moves due date, and rejects duplicate reviews', async () => {
    expect((await session.get('/api/flashcards/review/due').query({ deck: deckId })).body).toHaveLength(1);
    const res = await session.post('/api/flashcards/review').send({ cardId, rating: 2 });
    expect(res.status).toBe(200);
    expect(res.body.interval).toBe(1);
    expect((await session.get('/api/flashcards/review/due').query({ deck: deckId })).body).toHaveLength(0);
    expect((await session.post('/api/flashcards/review').send({ cardId, rating: 2 })).status).toBe(
      409,
    );
    expect(await db.review.count({ where: { userId } })).toBe(1);
  });
  it('allows anytime review and adjusts SRS schedule based on the latest session', async () => {
    const allCards = await session.get('/api/flashcards/review/due').query({ deck: deckId, mode: 'all' });
    expect(allCards.body).toHaveLength(1);
    expect(allCards.body[0].id).toBe(cardId);

    const earlyReview = await session.post('/api/flashcards/review').send({ cardId, rating: 2, allowEarly: true });
    expect(earlyReview.status).toBe(200);
    expect(earlyReview.body.repetitions).toBe(2);
    expect(earlyReview.body.interval).toBe(6);

    const cardInDb = await db.card.findUniqueOrThrow({ where: { id: cardId } });
    expect(cardInDb.interval).toBe(6);
    expect(cardInDb.repetitions).toBe(2);
    expect(cardInDb.due.getTime()).toBeGreaterThan(Date.now() + 5 * 86400000);
  });
  it('supports free review across multiple decks with shuffling and deck filtering', async () => {
    const secondDeck = await session.post('/api/flashcards/decks').send({ name: 'Bộ thẻ thứ hai' });
    const card2 = await session.post('/api/flashcards/cards').send({
      deckId: secondDeck.body.id,
      japanese: '飲む',
      reading: 'のむ',
      meaning: 'uống',
    });
    const multiDeckReview = await session
      .get('/api/flashcards/review/due')
      .query({ decks: `${deckId},${secondDeck.body.id}`, mode: 'all' });
    expect(multiDeckReview.status).toBe(200);
    expect(multiDeckReview.body).toHaveLength(2);
    const ids = multiDeckReview.body.map((c: { id: string }) => c.id);
    expect(ids).toContain(cardId);
    expect(ids).toContain(card2.body.id);
    expect(multiDeckReview.body[0].deck).toBeDefined();
    expect(multiDeckReview.body[0].deck.name).toBeDefined();

    // Single deck filter via comma or query param
    const singleOnly = await session
      .get('/api/flashcards/review/due')
      .query({ decks: secondDeck.body.id, mode: 'all' });
    expect(singleOnly.body).toHaveLength(1);
    expect(singleOnly.body[0].id).toBe(card2.body.id);
  });
  it('evaluates grammar exercises and persists completion', async () => {
    const lesson = await session.get('/api/grammar/desu');
    expect(lesson.body.exercises[0].answer).toBeUndefined();
    const res = await session
      .post('/api/grammar/desu/exercise')
      .send({ exerciseId: 'desu-1', answer: 'です' });
    expect(res.body.correct).toBe(true);
    await session.post('/api/grammar/desu/progress').send({ completed: true, bookmarked: true });
    expect((await session.get('/api/dashboard')).body.grammarCompleted).toBe(1);
  });
  it('provides consolidated review queue and overview for reviewed cards and grammar', async () => {
    const queue = await session.get('/api/review/consolidated').query({ mode: 'all' });
    expect(queue.status).toBe(200);
    expect(queue.body.items.length).toBeGreaterThanOrEqual(2);
    expect(queue.body.items.some((i: { type: string }) => i.type === 'card')).toBe(true);
    expect(queue.body.items.some((i: { type: string }) => i.type === 'grammar')).toBe(true);
    expect(queue.body.totalCardsReviewed).toBeGreaterThanOrEqual(1);
    expect(queue.body.totalGrammarPracticed).toBeGreaterThanOrEqual(1);

    const dashboard = await session.get('/api/dashboard');
    expect(dashboard.status).toBe(200);
    expect(dashboard.body.consolidatedReview).toBeDefined();
    expect(dashboard.body.consolidatedReview.cardsReviewedCount).toBeGreaterThanOrEqual(1);
    expect(dashboard.body.consolidatedReview.grammarPracticedCount).toBeGreaterThanOrEqual(1);
    expect(dashboard.body.consolidatedReview.items.length).toBeGreaterThan(0);
  });
  it('serves N5–N2 summaries without answer leakage and keeps old lesson links', async () => {
    const list = await session.get('/api/grammar');
    expect(list.status).toBe(200);
    expect(list.body).toHaveLength(lessons.length);
    for (const level of ['N5', 'N4', 'N3', 'N2']) expect(list.body.some((l: {level:string}) => l.level === level)).toBe(true);
    expect(list.body.every((l: {exercises?:unknown; content?:unknown}) => l.exercises === undefined && l.content === undefined)).toBe(true);
    const detail = await session.get('/api/grammar/mnn-50');
    expect(detail.body.exercises).toHaveLength(10);
    expect(detail.body.exercises.every((q: {answer?:string; explanation?:string; acceptedAnswers?:string[]}) => !q.answer && !q.explanation && !q.acceptedAnswers)).toBe(true);
    expect((await session.get('/api/grammar/desu')).status).toBe(200);
    expect((await session.get('/api/grammar?level=invalid')).status).toBe(400);
    expect((await session.get('/api/grammar/missing')).status).toBe(404);
  });
  it('persists per-question review, prioritizes mistakes, and treats retry IDs idempotently', async () => {
    const grammarId = 'mnn-31', exerciseId = 'mnn-31-fill';
    const payload = { exerciseId, answer: 'wrong', attemptId: 'grammar-review-once' };
    const first = await session.post(`/api/grammar/${grammarId}/exercise`).send(payload);
    expect(first.status).toBe(200); expect(first.body.correct).toBe(false);
    const retried = await session.post(`/api/grammar/${grammarId}/exercise`).send(payload);
    expect(retried.status).toBe(200);
    const key = { userId_grammarId_exerciseId: { userId, grammarId, exerciseId } };
    const state = await db.grammarExerciseProgress.findUniqueOrThrow({ where: key });
    expect(state.attempts).toBe(1); expect(state.lastCorrect).toBe(false);
    expect(state.due.getTime() - state.lastReviewed!.getTime()).toBe(600000);
    expect((await session.post(`/api/grammar/${grammarId}/exercise`).send({ ...payload, answer: 'つもり' })).status).toBe(409);
    const mistakes = await session.get('/api/grammar/review?mode=mistakes&level=N4');
    expect(mistakes.body.items[0].question.id).toBe(exerciseId);
    expect(mistakes.body.items[0].question.answer).toBeUndefined();
    expect((await session.get('/api/grammar/review?level=N4')).body.total).toBe(0);
    expect((await session.get('/api/grammar/roadmap?level=N4')).body.recommendation.action).toBe('mistakes');
    await db.grammarExerciseProgress.update({ where: key, data: { due: new Date(Date.now() - 1000) } });
    expect((await session.get('/api/grammar/roadmap?level=N4')).body.recommendation.action).toBe('review');
    expect((await session.get('/api/grammar/review?level=N4')).body.total).toBe(1);
    const correct = await session.post(`/api/grammar/${grammarId}/exercise`).send({ exerciseId, answer: 'つもり', attemptId: 'grammar-review-correct' });
    expect(correct.body.correct).toBe(true);
    const after = await db.grammarExerciseProgress.findUniqueOrThrow({ where: key });
    expect(after.attempts).toBe(2); expect(after.correctCount).toBe(1); expect(after.interval).toBe(1);
    expect((await session.get('/api/grammar/review?mode=mistakes&level=N4')).body.total).toBe(0);
    const beforeSync = { attempts: after.attempts, due: after.due.toISOString() };
    const { syncGrammarContent } = await import('../apps/api/src/grammar');
    await syncGrammarContent();
    const preserved = await db.grammarExerciseProgress.findUniqueOrThrow({ where: key });
    expect({ attempts: preserved.attempts, due: preserved.due.toISOString() }).toEqual(beforeSync);
    expect((await session.get('/api/grammar/desu')).body.progress[0]).toMatchObject({ completed: true, bookmarked: true });
  });
  it('separates grammar progress by account and saves concurrent retries once', async () => {
    const other = request.agent(app);
    await other.post('/api/auth/register').send({ name: 'Grammar', email: 'grammar@example.com', password: 'example-password' });
    expect((await other.get('/api/grammar/review?mode=mistakes')).body.total).toBe(0);
    expect((await other.get('/api/grammar/mnn-31')).body.practice.answered).toBe(0);
    const body = { exerciseId: 'mnn-32-fill', answer: 'ほうがいい', attemptId: 'concurrent-grammar-attempt' };
    const replies = await Promise.all([session.post('/api/grammar/mnn-32/exercise').send(body), session.post('/api/grammar/mnn-32/exercise').send(body)]);
    expect(replies.map((r) => r.status)).toEqual([200,200]);
    expect((await db.grammarExerciseProgress.findUniqueOrThrow({ where: { userId_grammarId_exerciseId: { userId, grammarId: 'mnn-32', exerciseId: body.exerciseId } } })).attempts).toBe(1);
    expect((await session.post('/api/grammar/mnn-32/exercise').send({ exerciseId: 'missing', answer: 'a' })).status).toBe(404);
    expect((await session.post('/api/grammar/mnn-32/exercise').send({ exerciseId: body.exerciseId, answer: ' ' })).status).toBe(400);
  });
  it('scores a test on the server and prevents duplicate submissions', async () => {
    const start = await session.post('/api/tests/mini-desu/start').send();
    expect(start.body.questions[0].answer).toBeUndefined();
    const answers = Object.fromEntries(lessons[0].exercises.map((q) => [q.id, q.answer]));
    const res = await session
      .post('/api/tests/mini-desu/submit')
      .send({ runId: start.body.runId, answers });
    expect(res.body.score).toBe(100);
    expect(
      (await session.post('/api/tests/mini-desu/submit').send({ runId: start.body.runId, answers }))
        .status,
    ).toBe(409);
    expect((await session.get('/api/tests/history')).body).toHaveLength(1);
  });
  it('saves writing and settings', async () => {
    expect(
      (
        await session.post('/api/writing').send({
          character: 'あ',
          strokes: [
            [
              { x: 10, y: 10 },
              { x: 20, y: 20 },
            ],
          ],
        })
      ).status,
    ).toBe(201);
    expect(
      (await session.patch('/api/profile').send({ goal: 12, level: 'N4', theme: 'dark' })).body
        .goal,
    ).toBe(12);
  });
  it('rejects disguised PDF uploads', async () => {
    const res = await session
      .post('/api/flashcards/pdf')
      .attach('file', Buffer.from('not a PDF'), {
        filename: 'fake.pdf',
        contentType: 'application/pdf',
      });
    expect(res.status).toBe(400);
  });
  it('exports user data and deletes accounts per Decree 13/2023/ND-CP', async () => {
    const userAgent = request.agent(app);
    const reg = await userAgent.post('/api/auth/register').send({
      name: 'Nguyen Van A',
      email: 'nguyenvana@example.com',
      password: 'strong-password-123',
      legalConsent: true,
      legalAcceptedAt: new Date().toISOString(),
    });
    expect(reg.status).toBe(201);
    expect(reg.body.name).toBe('Nguyen Van A');

    // Test Decree 13 Article 9 clause 7: Right to data portability / export
    const exportRes = await userAgent.get('/api/profile/export');
    expect(exportRes.status).toBe(200);
    expect(exportRes.body.legalNotice).toContain('Nghị định số 13/2023/NĐ-CP');
    expect(exportRes.body.user.email).toBe('nguyenvana@example.com');
    expect(exportRes.body.learningData.decks).toBeDefined();

    // Test Decree 13 Article 9 clause 5 & Article 16: Right to erasure / account deletion
    const delRes = await userAgent.delete('/api/profile');
    expect(delRes.status).toBe(200);
    expect(delRes.body.ok).toBe(true);

    // Verify user no longer exists
    expect(await db.user.findUnique({ where: { email: 'nguyenvana@example.com' } })).toBeNull();
    // And session is invalid
    expect((await userAgent.get('/api/auth/me')).status).toBe(401);
  });
});
describe.sequential('Dictionary import, search and resumable translation', () => {
  it('imports official data idempotently while preserving English', async () => {
    const { importWord } = await import('../apps/api/src/dictionary');
    const fixture = JSON.parse(readFileSync('data/processed/fixture.json', 'utf8'));
    const word = fixture.words.find((w: { id: string }) => w.id === '1358280');
    expect(await importWord(word, 'test')).toBe(true);
    expect(await importWord(word, 'test')).toBe(false);
    expect(await db.dictionaryEntry.count()).toBe(1);
    expect(
      (await db.dictionaryGloss.findFirstOrThrow({ where: { senseId: '1358280:s0' } }))
        .originalText,
    ).toBe('to eat');
  });
  it('searches Kanji, Kana, Katakana, romaji and English locally', async () => {
    for (const q of ['食べる', 'たべる', 'タベル', 'taberu', 'eat']) {
      const res = await session.get('/api/dictionary/search').query({ q });
      expect(res.status).toBe(200);
      expect(res.body.items[0].id).toBe('1358280');
    }
    expect((await session.get('/api/dictionary/1358280')).body.senses.length).toBeGreaterThan(0);
  });
  it('finds conjugated forms and exposes the matched base without changing direct results', async () => {
    for (const q of ['tabemasu', '食べました', 'タベナカッタ', 'tabeteimashita', '食べさせられませんでした']) {
      const res = await session.get('/api/dictionary/search').query({ q });
      expect(res.status).toBe(200);
      expect(res.body.items[0].id).toBe('1358280');
      expect(res.body.items[0].inflection.steps.length).toBeGreaterThan(0);
    }
    const direct = await session.get('/api/dictionary/search').query({ q: '食べる' });
    expect(direct.body.items[0].inflection).toBeUndefined();
    const paged = await session.get('/api/dictionary/search').query({ q: 'tabemasu', limit: 1 });
    expect(paged.body.total).toBe(1);
    expect(paged.body.items).toHaveLength(1);
  });
  it('persists Vietnamese and makes it searchable without network', async () => {
    const { runTranslations } = await import('../apps/api/src/translation');
    const provider = {
      name: 'mock',
      model: 'test',
      translate: vi.fn(async (items: { glossId: string }[]) => ({
        translations: items.map((i) => ({ glossId: i.glossId, vi: 'ăn' })),
      })),
    };
    const result = await runTranslations(provider, { limit: 1, delayMs: 0 });
    expect(result.successful).toBe(1);
    expect((await session.get('/api/dictionary/search').query({ q: 'ăn' })).body.items[0].id).toBe(
      '1358280',
    );
    expect(
      (await db.dictionaryGloss.findUniqueOrThrow({ where: { id: '1358280:s0:g0' } })).originalText,
    ).toBe('to eat');
  });
  it('reuses a context-compatible cache and resumes a checkpoint', async () => {
    const { runTranslations } = await import('../apps/api/src/translation');
    const source = await db.dictionaryGloss.findUniqueOrThrow({ where: { id: '1358280:s0:g0' } });
    const remaining = await db.dictionaryGloss.findFirst({ where: { translation: { is: null } } });
    if (remaining) {
      await db.dictionaryGloss.update({
        where: { id: remaining.id },
        data: { sourceHash: source.sourceHash },
      });
    }
    await db.translationJob.create({
      data: { status: 'interrupted', total: 2, processed: 1, successful: 1 },
    });
    const provider = {
      name: 'mock',
      model: 'test',
      translate: vi.fn(async () => {
        throw Error('Cache must avoid a request');
      }),
    };
    const result = await runTranslations(provider, { limit: 1, delayMs: 0, resume: true });
    expect(result.status).toBe('completed');
    expect(provider.translate).not.toHaveBeenCalled();
  });
  it('is idempotent once all glosses are translated', async () => {
    const { runTranslations } = await import('../apps/api/src/translation');
    const provider = {
      name: 'mock',
      model: 'test',
      translate: vi.fn(async (items: { glossId: string }[]) => ({
        translations: items.map((i) => ({ glossId: i.glossId, vi: 'nghĩa thử nghiệm' })),
      })),
    };
    await runTranslations(provider, { limit: 100, delayMs: 0 });
    provider.translate.mockClear();
    await runTranslations(provider, { limit: 100, delayMs: 0 });
    expect(provider.translate).not.toHaveBeenCalled();
  });
  it('keeps reviewed translations on source edits and marks them stale', async () => {
    const { importWord } = await import('../apps/api/src/dictionary');
    const fixture = JSON.parse(readFileSync('data/processed/fixture.json', 'utf8'));
    const word = fixture.words.find((w: { id: string }) => w.id === '1358280');
    await db.dictionaryTranslation.update({
      where: { glossId: '1358280:s0:g0' },
      data: { reviewedAt: new Date(), translatedText: 'ăn (đã duyệt)' },
    });
    word.sense[0].gloss[0].text = 'to eat (updated)';
    await importWord(word, 'test2');
    const translation = await db.dictionaryTranslation.findUniqueOrThrow({
      where: { glossId: '1358280:s0:g0' },
    });
    expect(translation.translatedText).toBe('ăn (đã duyệt)');
    expect(translation.status).toBe('stale');
  });
  it('personalizes recurring login review, resumes across sessions and releases only the chosen decks', async () => {
    const agent=request.agent(app);
    const credentials={name:'Review login',email:'review-login@example.com',password:'Review-login-2026!'};
    const registered=await agent.post('/api/auth/register').send(credentials);
    const uid=registered.body.id;
    expect(registered.status).toBe(201);
    expect((await agent.get('/api/login-review')).body.ready).toBe(true); // New cards never force a review.
    const ids:string[]=[];
    for(let i=0;i<5;i++) {
      const deck=await db.deck.create({data:{userId:uid,name:`Review ${i}`,cards:{create:{japanese:'日',reading:'ひ',meaning:'Ngày',lastReviewed:new Date(Date.now()-10*86400000),due:new Date(Date.now()-(5-i)*86400000)}}},include:{cards:true}});
      ids.push(deck.cards[0].id);
    }
    await agent.post('/api/auth/login').send(credentials);
    const welcome=await agent.get('/api/login-review');
    expect(welcome.body.decks).toHaveLength(5);expect(welcome.body.decks[0].name).toBe('Review 0');
    expect((await agent.post('/api/login-review/start').send({count:2})).status).toBe(400);
    let run=(await agent.post('/api/login-review/start').send({count:3})).body;
    expect(run.total).toBe(3);expect(run.card.id).toBe(ids[0]);
    const untouched=await db.card.findUniqueOrThrow({where:{id:ids[0]}});
    expect((await agent.post('/api/login-review/defer')).status).toBe(200);
    expect((await agent.get('/api/login-review')).body.ready).toBe(true);
    expect(await db.card.findUniqueOrThrow({where:{id:ids[0]}})).toEqual(untouched);
    expect(await db.review.count({where:{userId:uid}})).toBe(0);
    await agent.post('/api/auth/login').send(credentials);
    expect((await agent.get('/api/login-review')).body.card.id).toBe(ids[0]);
    const second=request.agent(app);await second.post('/api/auth/login').send(credentials);
    expect((await second.get('/api/login-review')).body.card.id).toBe(ids[0]);
    const other=await session.get('/api/login-review');
    expect(JSON.stringify(other.body)).not.toContain('Review 0');
    expect((await agent.post('/api/login-review/answer').send({cardId:ids[4],rating:2})).body.card.id).toBe(ids[0]);
    run=(await agent.post('/api/login-review/answer').send({cardId:ids[0],rating:0})).body;
    expect(run.done).toBe(1);expect(run.card.id).toBe(ids[1]);
    await agent.post('/api/login-review/answer').send({cardId:ids[0],rating:0});
    expect(await db.review.count({where:{userId:uid,cardId:ids[0]}})).toBe(1);
    expect((await second.get('/api/login-review')).body.done).toBe(1);
    await agent.post('/api/login-review/defer');
    expect((await agent.get('/api/login-review')).body.ready).toBe(true);
    expect((await second.get('/api/login-review')).body.done).toBe(1);
    await second.post('/api/login-review/answer').send({cardId:ids[1],rating:2});
    run=(await second.post('/api/login-review/answer').send({cardId:ids[2],rating:3})).body;
    expect(run.ready).toBe(true);expect(run.done).toBe(3);
    expect((await agent.get('/api/login-review')).body.ready).toBe(true);
    expect((await db.card.findUniqueOrThrow({where:{id:ids[4]}})).lastReviewed!.getTime()).toBeLessThan(Date.now()-86400000);
    const forgotten=await db.card.findUniqueOrThrow({where:{id:ids[0]}});
    expect(forgotten.due.getTime()-forgotten.lastReviewed!.getTime()).toBe(600000);
    // The same reviewed deck returns at its next due date, including cards whose repetitions reset to zero.
    await db.card.update({where:{id:ids[0]},data:{due:new Date(Date.now()-9*86400000)}});
    await agent.post('/api/auth/login').send(credentials);
    run=(await agent.get('/api/login-review')).body;
    expect(run.ready).toBe(false);expect(run.decks[0].name).toBe('Review 0');
    run=(await agent.post('/api/login-review/start').send({count:1})).body;
    expect(run.total).toBe(1);
    // Deleting a queued card cannot permanently lock the account.
    await db.card.delete({where:{id:ids[0]}});
    expect((await agent.get('/api/login-review')).body.ready).toBe(true);
  });
  it('persists JLPT answers, enforces section deadlines and saves one private result', async () => {
    const { jlptPapers } = await import('../packages/shared/jlpt-papers');
    const paper = jlptPapers[0];
    const catalog = await session.get('/api/tests');
    expect(catalog.body.map((p: {level:string})=>p.level)).toEqual(jlptPapers.map((p) => p.level));
    expect(JSON.stringify(catalog.body)).not.toContain('answer');
    expect((await request(app).get('/api/jlpt/papers')).status).toBe(401);
    let response = await session.post(`/api/jlpt/papers/${paper.id}/start`);
    expect(response.status).toBe(200);
    let run = response.body;
    const runId = run.runId;
    const route = `/api/jlpt/runs/${runId}`;
    expect(run.questions).toHaveLength(21);
    expect(run.questions[0].answer).toBeUndefined();
    expect(run.questions[0].explanation).toBeUndefined();
    expect(new Date(run.deadline).getTime()-new Date(run.startedAt).getTime()).toBe(20*60_000);
    expect((await session.post(`/api/jlpt/papers/${paper.id}/start`)).body.runId).toBe(runId);
    const outsider = request.agent(app);
    await outsider.post('/api/auth/register').send({name:'Other exam user',email:'exam-other@example.com',password:'Example-test-password'});
    expect((await outsider.get(route)).status).toBe(404);
    expect((await outsider.patch(route).send({action:'finish',revision:0})).status).toBe(404);
    expect((await session.get(`${route}/audio/${paper.sections[2].questions[0].id}`)).status).toBe(403);
    expect((await session.post(`/api/tests/${paper.id}/submit`).send({runId,answers:{}})).status).toBe(400);
    const first = paper.sections[0].questions[0];
    response = await session.patch(route).send({action:'save',revision:run.revision,answers:{[first.id]:first.answer}});
    expect(response.status).toBe(200); run=response.body;
    expect((await session.get(`/api/jlpt/papers/${paper.id}`)).body.run.answers[first.id]).toBe(first.answer);
    expect((await session.patch(route).send({action:'finish',revision:0})).status).toBe(409);
    expect((await session.patch(route).send({action:'save',revision:run.revision,answers:{[paper.sections[1].questions[0].id]:'invalid'}})).status).toBe(400);
    // Move only the isolated test database clock to simulate closing the browser past expiry.
    const saved=await db.testRun.findUniqueOrThrow({where:{id:runId}});
    const state=JSON.parse(saved.questions);
    state.sectionStarted=Date.now()-21*60_000;
    await db.testRun.update({where:{id:runId},data:{questions:JSON.stringify(state)}});
    const second=paper.sections[0].questions[1];
    response=await session.patch(route).send({action:'save',revision:run.revision,answers:{[second.id]:second.answer}});
    expect(response.status).toBe(200);run=response.body;
    expect(run.section).toBe(1); expect(run.startedAt).toBeNull(); expect(run.questions).toEqual([]);
    expect(JSON.parse((await db.testRun.findUniqueOrThrow({where:{id:runId}})).questions).answers[second.id]).toBeUndefined();
    for(let part=1;part<3;part++) {
      response=await session.patch(route).send({action:'begin',revision:run.revision});
      expect(response.status).toBe(200); run=response.body;
      expect(run.questions).toHaveLength(paper.sections[part].questions.length);
      if(part===2) {
        expect(run.questions.every((q:Record<string,unknown>)=>!q.transcript&&!q.answer)).toBe(true);
        const audio=await session.get(`${route}/audio/${run.questions[0].id}`);
        expect(audio.status).toBe(200);expect(audio.body.text).toContain('話');
      }
      response=await session.patch(route).send({action:'finish',revision:run.revision});
      expect(response.status).toBe(200);run=response.body;
    }
    expect(run.finished).toBe(true);expect(run.report.results).toHaveLength(71);
    expect(run.report.groups).toHaveLength(2);
    expect(run.report.results.filter((q:{correct:boolean})=>q.correct)).toHaveLength(1);
    expect(run.report.duration).toBeGreaterThanOrEqual(1200);
    await session.patch(route).send({action:'finish',revision:run.revision});
    await session.get(route);
    expect(await db.attempt.count({where:{userId,testId:paper.id}})).toBe(1);
    const lbRes = await session.get('/api/leaderboard/current');
    expect(lbRes.status).toBe(200);
    expect(lbRes.body.currentUser.testsCompleted).toBeGreaterThanOrEqual(1);
    expect(lbRes.body.currentUser.exp).toBeGreaterThan(0);
    expect((await outsider.get('/api/tests/history')).body).toEqual([]);
    expect((await session.post(`/api/jlpt/papers/${paper.id}/start`)).body.runId).not.toBe(runId);
  });
});
