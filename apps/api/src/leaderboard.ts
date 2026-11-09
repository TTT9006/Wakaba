import { Router, type Request, type Response } from 'express';
import { db } from './db';

export const leaderboardRouter = Router();

export const DAILY_EXP_CAP = 500;

let tablesEnsured = false;
export async function ensureLeaderboardTables() {
  if (tablesEnsured) return;
  try {
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Season" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "year" INTEGER NOT NULL,
        "month" INTEGER NOT NULL,
        "title" TEXT NOT NULL,
        "startedAt" DATETIME NOT NULL,
        "endedAt" DATETIME NOT NULL,
        "settled" BOOLEAN NOT NULL DEFAULT false
      );
    `);
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "SeasonRank" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "seasonId" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "rank" INTEGER NOT NULL,
        "exp" INTEGER NOT NULL,
        "kamonType" TEXT NOT NULL,
        "awardedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "seenSummary" BOOLEAN NOT NULL DEFAULT false
      );
    `);
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "DailyExp" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "date" TEXT NOT NULL,
        "testExp" INTEGER NOT NULL DEFAULT 0,
        "reviewExp" INTEGER NOT NULL DEFAULT 0,
        "grammarExp" INTEGER NOT NULL DEFAULT 0,
        "writingExp" INTEGER NOT NULL DEFAULT 0,
        "streakExp" INTEGER NOT NULL DEFAULT 0,
        "totalExp" INTEGER NOT NULL DEFAULT 0
      );
    `);
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "UserExpLog" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "date" TEXT NOT NULL,
        "activityType" TEXT NOT NULL,
        "referenceId" TEXT,
        "amount" INTEGER NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await db.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "SeasonRank_seasonId_userId_key" ON "SeasonRank"("seasonId", "userId");
    `);
    await db.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "DailyExp_userId_date_key" ON "DailyExp"("userId", "date");
    `);
    tablesEnsured = true;
  } catch (err) {
    console.warn('Leaderboard tables auto-ensure warning:', (err as Error).message);
  }
}


export function getTodayDateString(d = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getWeekBounds(d = new Date()) {
  const current = new Date(d);
  const day = current.getDay(); // 0 is Sunday, 1 is Monday...
  const diffToMonday = day === 0 ? -6 : 1 - day;

  const monday = new Date(current);
  monday.setDate(current.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const monStr = `${String(monday.getDate()).padStart(2, '0')}/${String(monday.getMonth() + 1).padStart(2, '0')}`;
  const sunStr = `${String(sunday.getDate()).padStart(2, '0')}/${String(sunday.getMonth() + 1).padStart(2, '0')}/${sunday.getFullYear()}`;

  const seasonId = `week-${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
  const title = `Tuần ${monStr} - ${sunStr}`;

  return { seasonId, title, year: monday.getFullYear(), month: monday.getMonth() + 1, startedAt: monday, endedAt: sunday };
}

export function getSeasonId(d = new Date()): string {
  return getWeekBounds(d).seasonId;
}

let backfilled = false;
export async function backfillHistoricalData(seasonStartDateStr: string) {
  if (backfilled || process.env.NODE_ENV === 'test' || process.env.VITEST) return;
  try {
    const existingCount = await db.dailyExp.count({
      where: { date: seasonStartDateStr },
    });
    if (existingCount > 0) {
      backfilled = true;
      return;
    }

    const allUsers = await db.user.findMany({
      select: {
        id: true,
        reviews: { select: { rating: true } },
        attempts: { select: { score: true } },
        progress: { where: { completed: true }, select: { id: true } },
        writings: { select: { id: true } },
      },
    });

    for (const u of allUsers) {
      const revExp = u.reviews.reduce(
        (sum, r) => sum + (r.rating === 3 ? 10 : r.rating === 2 ? 8 : r.rating === 1 ? 4 : 2),
        0
      );
      const attExp = u.attempts.reduce(
        (sum, a) => sum + Math.min(50, Math.round(a.score * 0.5)),
        0
      );
      const gramExp = u.progress.length * 20;
      const writExp = u.writings.length * 5;
      const total = revExp + attExp + gramExp + writExp;

      if (total > 0) {
        await db.dailyExp.upsert({
          where: { userId_date: { userId: u.id, date: seasonStartDateStr } },
          create: {
            userId: u.id,
            date: seasonStartDateStr,
            testExp: attExp,
            reviewExp: revExp,
            grammarExp: gramExp,
            writingExp: writExp,
            streakExp: 0,
            totalExp: total,
          },
          update: {
            testExp: attExp,
            reviewExp: revExp,
            grammarExp: gramExp,
            writingExp: writExp,
            totalExp: total,
          },
        });
      }
    }
    backfilled = true;
    console.log('Successfully backfilled historical learning data for current weekly season');
  } catch (err) {
    console.warn('Backfill notice:', (err as Error).message);
  }
}

export async function getOrCreateCurrentSeason(now = new Date()) {
  await ensureLeaderboardTables();
  const bounds = getWeekBounds(now);

  let season = await db.season.findUnique({ where: { id: bounds.seasonId } });
  if (!season) {
    season = await db.season.create({
      data: {
        id: bounds.seasonId,
        year: bounds.year,
        month: bounds.month,
        title: bounds.title,
        startedAt: bounds.startedAt,
        endedAt: bounds.endedAt,
        settled: false,
      },
    });
  }

  // Auto-settle any past unsettled weeks
  await settlePastSeasons(now);

  // Backfill existing user learning history for the kickoff week
  const startStr = getTodayDateString(bounds.startedAt);
  await backfillHistoricalData(startStr);

  return season;
}

export async function settlePastSeasons(now = new Date()) {
  const pastUnsettled = await db.season.findMany({
    where: {
      settled: false,
      endedAt: { lt: now },
    },
  });

  for (const s of pastUnsettled) {
    // Settle season
    const startStr = getTodayDateString(s.startedAt);
    const endStr = getTodayDateString(s.endedAt);

    const dailyRows = await db.dailyExp.findMany({
      where: {
        date: { gte: startStr, lte: endStr },
      },
      select: {
        userId: true,
        totalExp: true,
      },
    });

    const userExpMap = new Map<string, number>();
    for (const row of dailyRows) {
      userExpMap.set(row.userId, (userExpMap.get(row.userId) || 0) + row.totalExp);
    }

    const sortedUsers = Array.from(userExpMap.entries())
      .filter(([_, exp]) => exp > 0)
      .sort((a, b) => b[1] - a[1]);

    for (let i = 0; i < sortedUsers.length; i++) {
      const [userId, exp] = sortedUsers[i];
      const rank = i + 1;
      let kamonType = 'wakaba';
      if (rank === 1) kamonType = 'kiku';
      else if (rank === 2) kamonType = 'ume';
      else if (rank === 3) kamonType = 'sakura';

      await db.seasonRank.upsert({
        where: { seasonId_userId: { seasonId: s.id, userId } },
        create: {
          seasonId: s.id,
          userId,
          rank,
          exp,
          kamonType,
          seenSummary: false,
        },
        update: {
          rank,
          exp,
          kamonType,
        },
      });
    }

    await db.season.update({
      where: { id: s.id },
      data: { settled: true },
    });
  }
}

export async function recordExp(

  userId: string,
  activityType: 'test' | 'review' | 'grammar' | 'writing' | 'streak',
  amount: number,
  referenceId?: string
): Promise<{ awarded: number; dailyTotal: number; capped: boolean }> {
  await ensureLeaderboardTables();
  if (amount <= 0) return { awarded: 0, dailyTotal: 0, capped: false };

  const todayStr = getTodayDateString();

  // Anti-cheat: If test activity and same test was already taken today, check previous attempt
  if (activityType === 'test' && referenceId) {
    const existingLog = await db.userExpLog.findFirst({
      where: {
        userId,
        date: todayStr,
        activityType: 'test',
        referenceId,
      },
    });
    if (existingLog) {
      // Already awarded for this test today
      return { awarded: 0, dailyTotal: 0, capped: false };
    }
  }

  // Get current daily EXP
  const daily = await db.dailyExp.findUnique({
    where: { userId_date: { userId, date: todayStr } },
  });

  const currentTotal = daily ? daily.totalExp : 0;
  if (currentTotal >= DAILY_EXP_CAP) {
    return { awarded: 0, dailyTotal: DAILY_EXP_CAP, capped: true };
  }

  const spaceRemaining = DAILY_EXP_CAP - currentTotal;
  const awarded = Math.min(amount, spaceRemaining);

  const testAdd = activityType === 'test' ? awarded : 0;
  const reviewAdd = activityType === 'review' ? awarded : 0;
  const grammarAdd = activityType === 'grammar' ? awarded : 0;
  const writingAdd = activityType === 'writing' ? awarded : 0;
  const streakAdd = activityType === 'streak' ? awarded : 0;

  const updatedDaily = await db.dailyExp.upsert({
    where: { userId_date: { userId, date: todayStr } },
    create: {
      userId,
      date: todayStr,
      testExp: testAdd,
      reviewExp: reviewAdd,
      grammarExp: grammarAdd,
      writingExp: writingAdd,
      streakExp: streakAdd,
      totalExp: awarded,
    },
    update: {
      testExp: { increment: testAdd },
      reviewExp: { increment: reviewAdd },
      grammarExp: { increment: grammarAdd },
      writingExp: { increment: writingAdd },
      streakExp: { increment: streakAdd },
      totalExp: { increment: awarded },
    },
  });

  await db.userExpLog.create({
    data: {
      userId,
      date: todayStr,
      activityType,
      referenceId: referenceId || null,
      amount: awarded,
    },
  });

  return {
    awarded,
    dailyTotal: updatedDaily.totalExp,
    capped: updatedDaily.totalExp >= DAILY_EXP_CAP,
  };
}

export async function getCurrentLeaderboard(currentUserId: string) {
  const now = new Date();
  const season = await getOrCreateCurrentSeason(now);

  const startStr = getTodayDateString(season.startedAt);
  const endStr = getTodayDateString(season.endedAt);

  // Fetch all users with DailyExp in this season
  const dailyRows = await db.dailyExp.findMany({
    where: {
      date: { gte: startStr, lte: endStr },
    },
    select: {
      userId: true,
      totalExp: true,
    },
  });

  const userExpMap = new Map<string, number>();
  for (const row of dailyRows) {
    userExpMap.set(row.userId, (userExpMap.get(row.userId) || 0) + row.totalExp);
  }

  // Also ensure all users exist in ranking pool
  const allUsers = await db.user.findMany({
    select: {
      id: true,
      name: true,
      avatar: true,
      level: true,
      createdAt: true,
      _count: {
        select: {
          reviews: true,
          attempts: true,
          progress: true,
          writings: true,
        },
      },
    },
  });

  for (const u of allUsers) {
    if (!userExpMap.has(u.id)) {
      userExpMap.set(u.id, 0);
    }
  }

  const userLookup = new Map(allUsers.map((u) => [u.id, u]));

  const sortedList = Array.from(userExpMap.entries())
    .map(([uid, exp]) => ({
      user: userLookup.get(uid)!,
      exp,
    }))
    .sort((a, b) => {
      if (b.exp !== a.exp) return b.exp - a.exp;
      return a.user.name.localeCompare(b.user.name);
    });

  const rankings = sortedList.map((item, idx) => {
    const rank = idx + 1;
    let kamonType: 'kiku' | 'ume' | 'sakura' | 'wakaba' = 'wakaba';
    if (rank === 1) kamonType = 'kiku';
    else if (rank === 2) kamonType = 'ume';
    else if (rank === 3) kamonType = 'sakura';

    return {
      rank,
      userId: item.user.id,
      name: item.user.name,
      avatar: item.user.avatar,
      level: item.user.level,
      exp: item.exp,
      kamonType,
      isCurrentUser: item.user.id === currentUserId,
      cardsLearned: item.user._count?.reviews || 0,
      testsCompleted: item.user._count?.attempts || 0,
      grammarCompleted: item.user._count?.progress || 0,
      writingCount: item.user._count?.writings || 0,
    };
  });

  const currentUserLookup = userLookup.get(currentUserId);
  const currentUserRank = rankings.find((r) => r.userId === currentUserId) || {
    rank: rankings.length,
    userId: currentUserId,
    name: currentUserLookup?.name || 'Bạn',
    avatar: currentUserLookup?.avatar || '花',
    level: currentUserLookup?.level || 'N5',
    exp: 0,
    kamonType: 'wakaba' as const,
    isCurrentUser: true,
    cardsLearned: currentUserLookup?._count?.reviews || 0,
    testsCompleted: currentUserLookup?._count?.attempts || 0,
    grammarCompleted: currentUserLookup?._count?.progress || 0,
    writingCount: currentUserLookup?._count?.writings || 0,
  };

  const todayStr = getTodayDateString(now);
  const todayRow = await db.dailyExp.findUnique({
    where: { userId_date: { userId: currentUserId, date: todayStr } },
  });

  return {
    season: {
      id: season.id,
      title: season.title,
      startedAt: season.startedAt,
      endedAt: season.endedAt,
      daysRemaining: Math.max(
        0,
        Math.ceil((season.endedAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      ),
    },
    today: {
      totalExp: todayRow ? todayRow.totalExp : 0,
      cap: DAILY_EXP_CAP,
    },
    rankings: rankings.slice(0, 50),
    currentUser: currentUserRank,
    totalLearners: rankings.length,
  };
}

// Router endpoints
leaderboardRouter.get('/current', async (req: Request, res: Response) => {
  const user = res.locals.user;
  const result = await getCurrentLeaderboard(user.id);
  res.json(result);
});

leaderboardRouter.get('/today', async (_req: Request, res: Response) => {
  const user = res.locals.user;
  const todayStr = getTodayDateString();
  const row = await db.dailyExp.findUnique({
    where: { userId_date: { userId: user.id, date: todayStr } },
  });
  res.json({
    date: todayStr,
    testExp: row?.testExp || 0,
    reviewExp: row?.reviewExp || 0,
    grammarExp: row?.grammarExp || 0,
    writingExp: row?.writingExp || 0,
    streakExp: row?.streakExp || 0,
    totalExp: row?.totalExp || 0,
    cap: DAILY_EXP_CAP,
  });
});

leaderboardRouter.get('/celebration', async (_req: Request, res: Response) => {
  const user = res.locals.user;
  // Look for any unseen past season rank
  const pendingRank = await db.seasonRank.findFirst({
    where: {
      userId: user.id,
      seenSummary: false,
    },
    include: {
      season: true,
    },
    orderBy: {
      awardedAt: 'desc',
    },
  });

  if (!pendingRank) {
    return res.json({ celebration: null });
  }

  const totalInSeason = await db.seasonRank.count({
    where: { seasonId: pendingRank.seasonId },
  });

  res.json({
    celebration: {
      seasonId: pendingRank.seasonId,
      seasonTitle: pendingRank.season.title,
      rank: pendingRank.rank,
      exp: pendingRank.exp,
      kamonType: pendingRank.kamonType,
      totalLearners: totalInSeason,
    },
  });
});

leaderboardRouter.post('/celebration/seen', async (req: Request, res: Response) => {
  const user = res.locals.user;
  const { seasonId } = req.body;
  if (seasonId) {
    await db.seasonRank.updateMany({
      where: {
        userId: user.id,
        seasonId,
      },
      data: {
        seenSummary: true,
      },
    });
  }
  res.json({ success: true });
});

leaderboardRouter.get('/history', async (_req: Request, res: Response) => {
  const user = res.locals.user;
  const history = await db.seasonRank.findMany({
    where: { userId: user.id },
    include: {
      season: true,
    },
    orderBy: {
      awardedAt: 'desc',
    },
  });

  res.json(
    history.map((h) => ({
      id: h.id,
      seasonId: h.seasonId,
      seasonTitle: h.season.title,
      rank: h.rank,
      exp: h.exp,
      kamonType: h.kamonType,
      awardedAt: h.awardedAt,
    }))
  );
});
