import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../apps/api/src/db';
import {
  recordExp,
  getCurrentLeaderboard,
  settlePastSeasons,
  getOrCreateCurrentSeason,
  DAILY_EXP_CAP,
  getTodayDateString,
} from '../apps/api/src/leaderboard';

describe('Leaderboard and Daily EXP System', () => {
  let testUser1: any;
  let testUser2: any;
  let testUser3: any;
  let testUser4: any;

  beforeEach(async () => {
    // Clean test data
    testUser1 = await db.user.upsert({
      where: { email: 'lb_user1@example.com' },
      create: {
        email: 'lb_user1@example.com',
        name: 'Hoàng Yến',
        password: 'hash',
        level: 'N5',
      },
      update: {},
    });

    testUser2 = await db.user.upsert({
      where: { email: 'lb_user2@example.com' },
      create: {
        email: 'lb_user2@example.com',
        name: 'Minh Quang',
        password: 'hash',
        level: 'N5',
      },
      update: {},
    });

    testUser3 = await db.user.upsert({
      where: { email: 'lb_user3@example.com' },
      create: {
        email: 'lb_user3@example.com',
        name: 'Thu Trang',
        password: 'hash',
        level: 'N5',
      },
      update: {},
    });

    testUser4 = await db.user.upsert({
      where: { email: 'lb_user4@example.com' },
      create: {
        email: 'lb_user4@example.com',
        name: 'Thanh Tùng',
        password: 'hash',
        level: 'N4',
      },
      update: {},
    });

    await db.dailyExp.deleteMany();
    await db.userExpLog.deleteMany();
  });

  it('enforces 500 Daily EXP cap strictly', async () => {
    const res1 = await recordExp(testUser1.id, 'review', 300);
    expect(res1.awarded).toBe(300);
    expect(res1.dailyTotal).toBe(300);
    expect(res1.capped).toBe(false);

    // Add another 300 EXP -> should only award 200 due to 500 cap
    const res2 = await recordExp(testUser1.id, 'grammar', 300);
    expect(res2.awarded).toBe(200);
    expect(res2.dailyTotal).toBe(500);
    expect(res2.capped).toBe(true);

    // Any further EXP today should be 0
    const res3 = await recordExp(testUser1.id, 'writing', 50);
    expect(res3.awarded).toBe(0);
    expect(res3.dailyTotal).toBe(500);
    expect(res3.capped).toBe(true);
  });

  it('anti-cheat: prevents repeating the same test on the same day for duplicate points', async () => {
    const testId = 'test-grammar-01';
    const firstAttempt = await recordExp(testUser1.id, 'test', 50, testId);
    expect(firstAttempt.awarded).toBe(50);

    // Repeat same test on same day -> 0 awarded
    const secondAttempt = await recordExp(testUser1.id, 'test', 50, testId);
    expect(secondAttempt.awarded).toBe(0);
  });

  it('assigns 4 Japanese Kamon tiers correctly based on monthly ranking', async () => {
    await recordExp(testUser1.id, 'review', 400); // 400
    await recordExp(testUser2.id, 'review', 300); // 300
    await recordExp(testUser3.id, 'review', 200); // 200
    await recordExp(testUser4.id, 'review', 100); // 100

    const lb = await getCurrentLeaderboard(testUser1.id);
    expect(lb.season.title).toMatch(/Tuần \d+\/\d+ - \d+\/\d+\/\d+/);

    const r1 = lb.rankings.find((r) => r.userId === testUser1.id);
    const r2 = lb.rankings.find((r) => r.userId === testUser2.id);
    const r3 = lb.rankings.find((r) => r.userId === testUser3.id);
    const r4 = lb.rankings.find((r) => r.userId === testUser4.id);

    expect(r1?.rank).toBe(1);
    expect(r1?.kamonType).toBe('kiku'); // Hoa Cúc Hoàng Gia

    expect(r2?.rank).toBe(2);
    expect(r2?.kamonType).toBe('ume'); // Hoa Mai Tri Thức

    expect(r3?.rank).toBe(3);
    expect(r3?.kamonType).toBe('sakura'); // Hoa Anh Đào

    expect(r4?.rank).toBe(4);
    expect(r4?.kamonType).toBe('wakaba'); // Chồi Non Wakaba
  });
});
