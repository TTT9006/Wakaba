import { useQuery } from '@tanstack/react-query';
import { Layers, ClipboardCheck, BookOpen, PenTool } from 'lucide-react';
import { api } from '../services/api';
import type { LeaderboardData, User } from '../types';
import { KikuKamon, UmeKamon, SakuraKamon, WakabaKamon } from '../components/kamon';
import { Loading } from '../components/ui';
import { getFallbackLeaderboard } from '../services/leaderboard-fallback';

export function LeaderboardPage() {
  const { data: currentUserObj } = useQuery<User>({
    queryKey: ['user'],
    queryFn: () => api<User>('/auth/me'),
    retry: false,
  });

  const { data, isLoading } = useQuery<LeaderboardData>({
    queryKey: ['leaderboard-current', currentUserObj?.id],
    queryFn: async () => {
      try {
        const res = await api<LeaderboardData>('/leaderboard/current');
        if (res && res.rankings && res.rankings.length > 0) return res;
      } catch (err) {
        console.warn('Backend /leaderboard/current đang khởi động hoặc chưa phản hồi, sử dụng dữ liệu client-side:', err);
      }
      return getFallbackLeaderboard(currentUserObj);
    },
    refetchInterval: 30000,
  });

  if (isLoading || !data) return <Loading />;

  const { season, today, rankings, currentUser, totalLearners } = data;
  const top1 = rankings.find((r) => r.rank === 1);
  const top2 = rankings.find((r) => r.rank === 2);
  const top3 = rankings.find((r) => r.rank === 3);
  const rest = rankings.filter((r) => r.rank > 3);

  const percentToday = Math.min(100, Math.round((today.totalExp / today.cap) * 100));

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 border border-[#e6dfd5] shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#2c5e43]" />
            <h1 className="text-xl font-bold text-[#1f2421]">
              Bảng Vàng Thi Đua · {season.title}
            </h1>
          </div>
          <p className="text-xs text-[#5e6660] mt-1">
            Tiêu chí khách quan · Tối đa 500 EXP/ngày · Đóng mùa giải sau{' '}
            <strong className="text-[#2c5e43]">{season.daysRemaining} ngày</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[11px] text-[#5e6660]">EXP Tích lũy Hôm nay</p>
            <p className="text-sm font-bold text-[#2c5e43]">
              {today.totalExp} / {today.cap} EXP
            </p>
          </div>
          <div className="w-24 bg-[#f4efe6] h-3 rounded-full overflow-hidden p-0.5">
            <div
              className="h-full bg-[#2c5e43] rounded-full transition-all duration-700 ease-out"
              style={{ width: `${percentToday}%` }}
            />
          </div>
        </div>
      </div>

      {/* Top 3 Podium (Japanese Kamon Crests) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Top 1 */}
        {top1 && (
          <div className="order-1 md:order-2 p-6 rounded-3xl bg-[#faf6ed] border-2 border-[#ecd9b2] text-center flex flex-col items-center shadow-xs transition-transform duration-200 hover:-translate-y-1">
            <div className="w-16 h-16 rounded-full bg-[#fcf9f2] border-2 border-[#c89b3c] flex items-center justify-center mb-3 shadow-xs text-[#966c18]">
              <KikuKamon className="w-11 h-11" />
            </div>
            <span className="text-[11px] font-bold text-[#966c18] uppercase tracking-wider bg-[#f6ebd1] px-3 py-0.5 rounded-full border border-[#e8d19e]">
              Quán Quân · Top 1
            </span>
            <h3 className="text-base font-bold text-[#1f2421] mt-2.5">
              {top1.name} ({top1.level})
            </h3>
            <p className="text-sm font-bold text-[#966c18] mt-0.5">
              {top1.exp.toLocaleString('vi-VN')} EXP
            </p>
            <span className="text-[11px] text-[#5e6660] mt-1">Gia huy: Cúc Hoàng Gia (菊紋)</span>

            {/* Chi tiết học tập */}
            <div className="flex flex-wrap justify-center items-center gap-1.5 mt-3 pt-3 border-t border-[#ecd9b2]/60 w-full">
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#785b19] bg-[#fbf5e8] px-2 py-0.5 rounded-md border border-[#eddab3]">
                <Layers size={11} className="text-[#966c18]" />
                {top1.cardsLearned ?? 0} thẻ đã học
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#785b19] bg-[#fbf5e8] px-2 py-0.5 rounded-md border border-[#eddab3]">
                <ClipboardCheck size={11} className="text-[#966c18]" />
                {top1.testsCompleted ?? 0} đề đã làm
              </span>
              {(top1.grammarCompleted ?? 0) > 0 && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#785b19] bg-[#fbf5e8] px-2 py-0.5 rounded-md border border-[#eddab3]">
                  <BookOpen size={11} className="text-[#966c18]" />
                  {top1.grammarCompleted} ngữ pháp
                </span>
              )}
            </div>
          </div>
        )}

        {/* Top 2 */}
        {top2 && (
          <div className="order-2 md:order-1 p-5 rounded-3xl bg-[#f7f8f9] border border-[#d9dfe4] text-center flex flex-col items-center shadow-xs transition-transform duration-200 hover:-translate-y-1">
            <div className="w-16 h-16 rounded-full bg-white border-2 border-[#94a3b8] flex items-center justify-center mb-3 shadow-xs text-[#475569]">
              <UmeKamon className="w-11 h-11" />
            </div>
            <span className="text-[11px] font-bold text-[#475569] uppercase tracking-wider bg-[#e9edf1] px-2.5 py-0.5 rounded-full border border-[#cbd5e1]">
              Á Quân · Top 2
            </span>
            <h3 className="text-sm font-bold text-[#1f2421] mt-2">
              {top2.name} ({top2.level})
            </h3>
            <p className="text-xs font-bold text-[#475569] mt-0.5">
              {top2.exp.toLocaleString('vi-VN')} EXP
            </p>
            <span className="text-[10px] text-[#5e6660] mt-1">Gia huy: Mai Tri Thức (梅紋)</span>

            {/* Chi tiết học tập */}
            <div className="flex flex-wrap justify-center items-center gap-1.5 mt-3 pt-3 border-t border-[#d9dfe4]/60 w-full">
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#475569] bg-white px-2 py-0.5 rounded-md border border-[#cbd5e1]">
                <Layers size={11} className="text-[#64748b]" />
                {top2.cardsLearned ?? 0} thẻ
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#475569] bg-white px-2 py-0.5 rounded-md border border-[#cbd5e1]">
                <ClipboardCheck size={11} className="text-[#64748b]" />
                {top2.testsCompleted ?? 0} đề
              </span>
              {(top2.grammarCompleted ?? 0) > 0 && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#475569] bg-white px-2 py-0.5 rounded-md border border-[#cbd5e1]">
                  <BookOpen size={11} className="text-[#64748b]" />
                  {top2.grammarCompleted} ngữ pháp
                </span>
              )}
            </div>
          </div>
        )}

        {/* Top 3 */}
        {top3 && (
          <div className="order-3 md:order-3 p-5 rounded-3xl bg-[#faf4f1] border border-[#e7d3cb] text-center flex flex-col items-center shadow-xs transition-transform duration-200 hover:-translate-y-1">
            <div className="w-16 h-16 rounded-full bg-white border-2 border-[#b8806c] flex items-center justify-center mb-3 shadow-xs text-[#8c4a32]">
              <SakuraKamon className="w-11 h-11" />
            </div>
            <span className="text-[11px] font-bold text-[#8c4a32] uppercase tracking-wider bg-[#f3e4de] px-2.5 py-0.5 rounded-full border border-[#dec2b7]">
              Quý Quân · Top 3
            </span>
            <h3 className="text-sm font-bold text-[#1f2421] mt-2">
              {top3.name} ({top3.level})
            </h3>
            <p className="text-xs font-bold text-[#8c4a32] mt-0.5">
              {top3.exp.toLocaleString('vi-VN')} EXP
            </p>
            <span className="text-[10px] text-[#5e6660] mt-1">Gia huy: Anh Đào Đồng Bộ (桜紋)</span>

            {/* Chi tiết học tập */}
            <div className="flex flex-wrap justify-center items-center gap-1.5 mt-3 pt-3 border-t border-[#e7d3cb]/60 w-full">
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#8c4a32] bg-white px-2 py-0.5 rounded-md border border-[#dec2b7]">
                <Layers size={11} className="text-[#b8806c]" />
                {top3.cardsLearned ?? 0} thẻ
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#8c4a32] bg-white px-2 py-0.5 rounded-md border border-[#dec2b7]">
                <ClipboardCheck size={11} className="text-[#b8806c]" />
                {top3.testsCompleted ?? 0} đề
              </span>
              {(top3.grammarCompleted ?? 0) > 0 && (
                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#8c4a32] bg-white px-2 py-0.5 rounded-md border border-[#dec2b7]">
                  <BookOpen size={11} className="text-[#b8806c]" />
                  {top3.grammarCompleted} ngữ pháp
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Current User Fixed Card (if not top 3) */}
      {currentUser && currentUser.rank > 3 && (
        <div className="p-4 rounded-2xl bg-[#e9f2ec] border-2 border-[#2c5e43] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-white border border-[#2c5e43] flex items-center justify-center text-[#2c5e43] shadow-xs shrink-0">
              <WakabaKamon className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#2c5e43]">
                  Hạng #{currentUser.rank} · Bạn ({currentUser.name})
                </span>
                <span className="text-[10px] font-bold text-[#2c5e43] bg-[#d9ebe0] px-2 py-0.5 rounded-full border border-[#bcdbc7]">
                  Vị trí của bạn
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#2c5e43] bg-white px-2 py-0.5 rounded-md border border-[#bcdbc7]">
                  <Layers size={10} />
                  {currentUser.cardsLearned ?? 0} flashcard đã học
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#2c5e43] bg-white px-2 py-0.5 rounded-md border border-[#bcdbc7]">
                  <ClipboardCheck size={10} />
                  {currentUser.testsCompleted ?? 0} đề đã làm
                </span>
                {(currentUser.grammarCompleted ?? 0) > 0 && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#2c5e43] bg-white px-2 py-0.5 rounded-md border border-[#bcdbc7]">
                    <BookOpen size={10} />
                    {currentUser.grammarCompleted} bài ngữ pháp
                  </span>
                )}
                {(currentUser.writingCount ?? 0) > 0 && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#2c5e43] bg-white px-2 py-0.5 rounded-md border border-[#bcdbc7]">
                    <PenTool size={10} />
                    {currentUser.writingCount} chữ viết
                  </span>
                )}
              </div>
            </div>
          </div>
          <span className="text-base font-bold text-[#2c5e43] sm:text-right shrink-0">
            {currentUser.exp.toLocaleString('vi-VN')} EXP
          </span>
        </div>
      )}

      {/* Leaderboard Table (Rank 4 onwards) */}
      <div className="bg-white rounded-3xl p-6 border border-[#e6dfd5] shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-[#e6dfd5] pb-3">
          <h2 className="text-sm font-bold text-[#1f2421]">
            Danh Sách Bảng Vàng ({totalLearners} học viên)
          </h2>
          <span className="text-xs text-[#5e6660]">Gia huy Chồi Non Wakaba (若葉紋)</span>
        </div>

        <div className="space-y-2">
          {rest.map((item) => {
            const isMe = item.isCurrentUser;
            return (
              <div
                key={item.userId}
                className={`flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl border transition-all duration-200 hover:-translate-y-0.5 gap-2.5 ${
                  isMe
                    ? 'bg-[#e9f2ec] border-[#c2dacb]'
                    : 'bg-[#faf8f5] border-[#e6dfd5] hover:bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white border border-[#ded7cc] flex items-center justify-center text-[#5e6660] shadow-xs shrink-0">
                    <WakabaKamon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#1f2421]">
                        #{item.rank}. {item.name}
                      </span>
                      <span className="text-[10px] font-semibold text-[#5e6660] bg-[#f5f1ea] px-1.5 py-0.5 rounded-md">
                        {item.level}
                      </span>
                      {isMe && (
                        <span className="text-[10px] font-bold text-[#2c5e43] bg-[#d9ebe0] px-1.5 py-0.5 rounded-md">
                          Bạn
                        </span>
                      )}
                    </div>
                    {/* Dữ liệu học tập: flashcard, đề, ngữ pháp */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      <span className="inline-flex items-center gap-1 text-[10px] text-[#5e6660] bg-white px-1.5 py-0.5 rounded border border-[#e6dfd5]">
                        <Layers size={10} className="text-[#2c5e43]" />
                        {item.cardsLearned ?? 0} thẻ
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] text-[#5e6660] bg-white px-1.5 py-0.5 rounded border border-[#e6dfd5]">
                        <ClipboardCheck size={10} className="text-[#2c5e43]" />
                        {item.testsCompleted ?? 0} đề
                      </span>
                      {(item.grammarCompleted ?? 0) > 0 && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-[#5e6660] bg-white px-1.5 py-0.5 rounded border border-[#e6dfd5]">
                          <BookOpen size={10} className="text-[#2c5e43]" />
                          {item.grammarCompleted} ngữ pháp
                        </span>
                      )}
                      {(item.writingCount ?? 0) > 0 && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-[#5e6660] bg-white px-1.5 py-0.5 rounded border border-[#e6dfd5]">
                          <PenTool size={10} className="text-[#2c5e43]" />
                          {item.writingCount} chữ
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <span
                  className={`text-sm font-bold sm:text-right shrink-0 ${isMe ? 'text-[#2c5e43]' : 'text-[#1f2421]'}`}
                >
                  {item.exp.toLocaleString('vi-VN')} EXP
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
