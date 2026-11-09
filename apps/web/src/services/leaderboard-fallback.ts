import type { LeaderboardData, LeaderboardUser, KamonType } from '../types';

export function getWeekBoundsClient(d = new Date()) {
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

  return { seasonId, title, startedAt: monday, endedAt: sunday };
}

export function getFallbackLeaderboard(currentUser?: { id?: string; name?: string; avatar?: string; level?: string } | null): LeaderboardData {
  const now = new Date();
  const bounds = getWeekBoundsClient(now);

  const baseLearners: Array<{
    userId: string;
    name: string;
    avatar: string;
    level: string;
    exp: number;
    cardsLearned: number;
    testsCompleted: number;
    grammarCompleted: number;
    writingCount: number;
  }> = [
    {
      userId: 'cmv50t5ox005ev7h0p1tuqg6b',
      name: 'Minh Anh',
      avatar: '花',
      level: 'N5',
      exp: 200,
      cardsLearned: 169,
      testsCompleted: 11,
      grammarCompleted: 15,
      writingCount: 8,
    },
    {
      userId: 'cmv50ywtz0000v7g8yu17f150',
      name: 'TTT9006',
      avatar: '風',
      level: 'N1',
      exp: 145,
      cardsLearned: 120,
      testsCompleted: 3,
      grammarCompleted: 24,
      writingCount: 16,
    },
    {
      userId: 'cmv6al89t0002v7ao7mvsiuwn',
      name: 'Nguyễn Anh Quân',
      avatar: '月',
      level: 'N5',
      exp: 110,
      cardsLearned: 85,
      testsCompleted: 2,
      grammarCompleted: 10,
      writingCount: 5,
    },
    {
      userId: 'cmv_user_hyen',
      name: 'Hoàng Yến',
      avatar: '鳥',
      level: 'N4',
      exp: 85,
      cardsLearned: 64,
      testsCompleted: 2,
      grammarCompleted: 8,
      writingCount: 12,
    },
    {
      userId: 'cmv_user_mquang',
      name: 'Minh Quang',
      avatar: '山',
      level: 'N5',
      exp: 70,
      cardsLearned: 52,
      testsCompleted: 1,
      grammarCompleted: 6,
      writingCount: 4,
    },
    {
      userId: 'cmv_user_ttrang',
      name: 'Thu Trang',
      avatar: '海',
      level: 'N3',
      exp: 60,
      cardsLearned: 45,
      testsCompleted: 1,
      grammarCompleted: 5,
      writingCount: 6,
    },
    {
      userId: 'cmv_user_ttung',
      name: 'Thanh Tùng',
      avatar: '川',
      level: 'N4',
      exp: 50,
      cardsLearned: 38,
      testsCompleted: 1,
      grammarCompleted: 4,
      writingCount: 3,
    },
  ];

  const currentUserId = currentUser?.id || 'current-user';
  let userInPool = baseLearners.find((u) => u.userId === currentUserId || (currentUser?.name && u.name === currentUser.name));

  if (!userInPool && currentUser) {
    userInPool = {
      userId: currentUserId,
      name: currentUser.name || 'Học viên Wakaba',
      avatar: currentUser.avatar || '花',
      level: currentUser.level || 'N5',
      exp: 45,
      cardsLearned: 30,
      testsCompleted: 1,
      grammarCompleted: 3,
      writingCount: 2,
    };
    baseLearners.push(userInPool);
  }

  const sorted = [...baseLearners].sort((a, b) => b.exp - a.exp);

  const rankings: LeaderboardUser[] = sorted.map((u, idx) => {
    const rank = idx + 1;
    let kamonType: KamonType = 'wakaba';
    if (rank === 1) kamonType = 'kiku';
    else if (rank === 2) kamonType = 'ume';
    else if (rank === 3) kamonType = 'sakura';

    const isCurrentUser = u.userId === currentUserId || (currentUser?.name && u.name === currentUser.name);

    return {
      rank,
      userId: u.userId,
      name: u.name,
      avatar: u.avatar,
      level: u.level,
      exp: u.exp,
      kamonType,
      isCurrentUser: !!isCurrentUser,
      cardsLearned: u.cardsLearned,
      testsCompleted: u.testsCompleted,
      grammarCompleted: u.grammarCompleted,
      writingCount: u.writingCount,
    };
  });

  const currentRankUser: LeaderboardUser = rankings.find((r) => r.isCurrentUser) || {
    rank: rankings.length,
    userId: currentUserId,
    name: currentUser?.name || 'Bạn',
    avatar: currentUser?.avatar || '花',
    level: currentUser?.level || 'N5',
    exp: 45,
    kamonType: 'wakaba',
    isCurrentUser: true,
    cardsLearned: 30,
    testsCompleted: 1,
    grammarCompleted: 3,
    writingCount: 2,
  };

  const daysRemaining = Math.max(
    0,
    Math.ceil((bounds.endedAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  );

  return {
    season: {
      id: bounds.seasonId,
      title: bounds.title,
      startedAt: bounds.startedAt.toISOString(),
      endedAt: bounds.endedAt.toISOString(),
      daysRemaining,
    },
    today: {
      totalExp: Math.min(500, currentRankUser.exp),
      cap: 500,
    },
    currentUser: currentRankUser,
    rankings,
    totalLearners: Math.max(70, rankings.length),
  };
}
