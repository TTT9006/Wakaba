import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api, post } from '../services/api';
import type { CelebrationData } from '../types';
import { KikuKamon, UmeKamon, SakuraKamon, WakabaKamon } from './kamon';

export function CelebrationModal() {
  const queryClient = useQueryClient();
  const { data } = useQuery<CelebrationData | null>({
    queryKey: ['celebration'],
    queryFn: async () => {
      try {
        return await api<CelebrationData>('/leaderboard/celebration');
      } catch {
        return null;
      }
    },
    staleTime: 1000 * 60 * 10,
    retry: false,
  });

  const [isOpen, setIsOpen] = useState(false);
  const celebration = data?.celebration;

  useEffect(() => {
    if (celebration) {
      setIsOpen(true);
    }
  }, [celebration]);

  if (!isOpen || !celebration) return null;

  const handleClose = async () => {
    setIsOpen(false);
    try {
      await post('/leaderboard/celebration/seen', { seasonId: celebration.seasonId });
      queryClient.invalidateQueries({ queryKey: ['celebration'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard-history'] });
    } catch (e) {
      console.error(e);
    }
  };

  const kamonNameMap = {
    kiku: 'Gia huy Cúc Hoàng Gia (Quán Quân)',
    ume: 'Gia huy Mai Tri Thức (Á Quân)',
    sakura: 'Gia huy Anh Đào Nở Rộ (Quý Quân)',
    wakaba: 'Gia huy Chồi Non Wakaba (Tinh Tiến)',
  };

  return (
    <div className="fixed inset-0 bg-black/45 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl max-w-md w-full p-7 text-center border border-[#e6dfd5] shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-[#5e6660] hover:text-[#1f2421] text-sm p-1.5 rounded-full hover:bg-[#f5f1ea] transition-colors"
          aria-label="Đóng"
        >
          ✕
        </button>

        {/* Kamon Icon */}
        <div className="w-20 h-20 mx-auto rounded-full bg-[#faf6ed] border-2 border-[#c89b3c] flex items-center justify-center mb-4 relative shadow-sm text-[#966c18]">
          {celebration.kamonType === 'kiku' && <KikuKamon className="w-12 h-12" />}
          {celebration.kamonType === 'ume' && <UmeKamon className="w-12 h-12" />}
          {celebration.kamonType === 'sakura' && <SakuraKamon className="w-12 h-12" />}
          {celebration.kamonType === 'wakaba' && <WakabaKamon className="w-12 h-12" />}
          <div className="absolute -top-1 -right-1 bg-[#2c5e43] text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs border border-white">
            #{celebration.rank}
          </div>
        </div>

        <span className="text-[11px] font-bold text-[#2c5e43] tracking-widest uppercase bg-[#e9f2ec] px-3.5 py-1 rounded-full border border-[#c2dacb]">
          Tổng kết {celebration.seasonTitle}
        </span>

        <h2 className="text-xl font-bold text-[#1f2421] mt-3">Tuyên dương Thành tích Xuất sắc!</h2>
        <p className="text-xs text-[#5e6660] mt-1.5 leading-relaxed">
          Bạn đã hoàn thành trọn vẹn tháng học tập vừa qua với nỗ lực bền bỉ. Gia huy danh dự đã
          được lưu trữ vĩnh viễn vào hồ sơ tài khoản của bạn.
        </p>

        {/* Stats Summary */}
        <div className="bg-[#faf8f5] rounded-2xl p-4 my-5 border border-[#e6dfd5] flex items-center justify-around text-center">
          <div>
            <p className="text-[11px] text-[#5e6660]">Thứ hạng</p>
            <p className="text-base font-bold text-[#1f2421]">Hạng #{celebration.rank}</p>
          </div>
          <div className="w-px h-8 bg-[#e6dfd5]" />
          <div>
            <p className="text-[11px] text-[#5e6660]">Tổng EXP</p>
            <p className="text-base font-bold text-[#2c5e43]">
              {celebration.exp.toLocaleString('vi-VN')}
            </p>
          </div>
          <div className="w-px h-8 bg-[#e6dfd5]" />
          <div>
            <p className="text-[11px] text-[#5e6660]">Gia huy đạt</p>
            <p className="text-xs font-bold text-[#966c18] mt-1">
              {kamonNameMap[celebration.kamonType]}
            </p>
          </div>
        </div>

        <button
          onClick={handleClose}
          className="w-full font-bold text-xs bg-[#2c5e43] hover:bg-[#234b35] active:scale-[0.98] text-white py-3 rounded-xl shadow-xs transition-all"
        >
          Khởi đầu Mùa giải Tháng Mới
        </button>
      </div>
    </div>
  );
}
