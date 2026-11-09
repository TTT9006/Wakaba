import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Award, ArrowRight } from 'lucide-react';
import { api } from '../services/api';
import type { LeaderboardData, User } from '../types';
import { KikuKamon, UmeKamon, SakuraKamon, WakabaKamon } from './kamon';
import { getFallbackLeaderboard } from '../services/leaderboard-fallback';

export function LeaderboardWidget() {
  const { data: currentUserObj } = useQuery<User>({
    queryKey: ['user'],
    queryFn: () => api<User>('/auth/me'),
    retry: false,
  });

  const { data } = useQuery<LeaderboardData>({
    queryKey: ['leaderboard-current', currentUserObj?.id],
    queryFn: async () => {
      try {
        const res = await api<LeaderboardData>('/leaderboard/current');
        if (res && res.rankings && res.rankings.length > 0) return res;
      } catch (err) {
        // Fallback silently if Render is still deploying
      }
      return getFallbackLeaderboard(currentUserObj);
    },
    staleTime: 1000 * 30,
  });

  if (!data) return null;

  const { season, today, currentUser, totalLearners } = data;
  const percentToday = Math.min(100, Math.round((today.totalExp / today.cap) * 100));

  return (
    <div className="bg-white rounded-3xl p-5 border border-[#e6dfd5] shadow-xs hover:shadow-md transition-all duration-300">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Award size={18} className="text-[#2c5e43]" />
          <h3 className="text-sm font-bold text-[#1f2421]">{season.title}</h3>
        </div>
        <span className="text-[11px] font-semibold text-[#2c5e43] bg-[#e9f2ec] px-2.5 py-0.5 rounded-full border border-[#c2dacb]">
          {season.daysRemaining} ngày còn lại
        </span>
      </div>

      <div className="flex items-center justify-between p-3 rounded-2xl bg-[#faf8f5] border border-[#e6dfd5] mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white border-2 border-[#2c5e43] flex items-center justify-center text-[#2c5e43] shadow-xs">
            {currentUser.kamonType === 'kiku' && <KikuKamon className="w-6 h-6" />}
            {currentUser.kamonType === 'ume' && <UmeKamon className="w-6 h-6" />}
            {currentUser.kamonType === 'sakura' && <SakuraKamon className="w-6 h-6" />}
            {currentUser.kamonType === 'wakaba' && <WakabaKamon className="w-6 h-6" />}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold text-[#1f2421]">
                Hạng #{currentUser.rank}
              </span>
              <span className="text-[10px] text-[#5e6660]">/ {totalLearners} học viên</span>
            </div>
            <p className="text-[11px] text-[#2c5e43] font-semibold">
              {currentUser.exp.toLocaleString('vi-VN')} EXP tháng này
            </p>
          </div>
        </div>
        <Link
          to="/leaderboard"
          className="text-xs font-bold text-[#2c5e43] hover:text-[#1e432f] flex items-center gap-1 group"
        >
          <span>Xem BXH</span>
          <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {/* Daily Progress */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] text-[#5e6660]">
          <span>Tiến độ EXP hôm nay (Giới hạn trần 500)</span>
          <span className="font-bold text-[#2c5e43]">
            {today.totalExp} / {today.cap} EXP
          </span>
        </div>
        <div className="w-full bg-[#f4efe6] h-2.5 rounded-full overflow-hidden p-0.5">
          <div
            className="h-full bg-gradient-to-r from-[#3e7859] to-[#2c5e43] rounded-full transition-all duration-700 ease-out"
            style={{ width: `${percentToday}%` }}
          />
        </div>
      </div>
    </div>
  );
}
