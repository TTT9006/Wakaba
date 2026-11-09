import { KikuKamon, UmeKamon, SakuraKamon, WakabaKamon } from '../components/kamon';
import type { SeasonHistoryItem } from '../types';
import { AnnotationSettings } from '../components/japanese-annotated-text';
import { SourceNote } from './radicals';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Sun, Moon, Monitor, ArrowUpRight } from 'lucide-react';
import { useUser } from '../app';
import { api, patch, post } from '../services/api';
import type { User } from '../types';
import { useUI } from '../stores/ui';
import { Button, PageHeader } from '../components/ui';
export function SettingsPage() {
  const { data: user } = useUser();
  const [theme, setTheme] = useState('light');
  const [busy, setBusy] = useState(false);
  const notify = useUI((s) => s.notify);
  const client = useQueryClient();
  useEffect(() => {
    if (user) {
      setTheme(user.theme);
    }
  }, [user?.id, user?.theme]);
  const save = async () => {
    setBusy(true);
    try {
      const data = await patch<User>('/profile', { theme });
      client.setQueryData(['user'], data);
      void client.invalidateQueries({ queryKey: ['dashboard'] });
      notify('Đã lưu cài đặt của bạn.');
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <PageHeader
        eyebrow="GÓC HỌC TẬP CỦA RIÊNG BẠN"
        title="Học theo cách bạn muốn."
        description="Chọn nhịp độ phù hợp và giữ một thói quen bền vững."
      />
      <AnnotationSettings />
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <section className="panel settings-section spaced">
          <div>
            <h2>Không gian học</h2>
            <p>Chọn giao diện dễ chịu cho mắt.</p>
          </div>
          <div className="theme-options">
            {[
              { id: 'light', label: 'Sáng', icon: Sun },
              { id: 'dark', label: 'Tối', icon: Moon },
              { id: 'system', label: 'Hệ thống', icon: Monitor },
            ].map(({ id, label, icon: Icon }) => (
              <button
                type="button"
                key={id}
                className={theme === id ? 'selected' : ''}
                onClick={() => setTheme(id)}
              >
                <Icon size={22} />
                {label}
              </button>
            ))}
          </div>
        </section>
        <div className="form-footer">
          <Button type="submit" disabled={busy}>
            <Check size={17} />
            Lưu thay đổi
          </Button>
        </div>
      </form>
      <section id="sources" className="panel sources">
        <h2>Nguồn dữ liệu & bản quyền</h2>
        <SourceNote />
        <p>
          Chú thích ngữ cảnh dùng Kuromoji 0.1.2 (Apache 2.0) và IPADIC. Phân tích tự động có thể
          sai với tên riêng hoặc cách đọc đa nghĩa; cách đọc có sẵn trong bài học được ưu tiên.
        </p>
        <p>
          Từ điển sử dụng JMdict của Electronic Dictionary Research and Development Group (EDRDG),
          qua bản phân phối JSON của scriptin/jmdict-simplified. Dữ liệu từ điển và các bản dịch
          phái sinh được cung cấp theo giấy phép Creative Commons Attribution-ShareAlike 4.0.
        </p>
        <p>
          Định nghĩa tiếng Anh gốc được giữ nguyên; bản dịch tiếng Việt mẫu được tổng hợp bám sát JLPT.
          Các bản dịch tự động, khi được bổ sung, có thể cần hiệu đính theo ngữ cảnh.
        </p>
        <div className="inline-actions wrap">
          <a href="https://www.edrdg.org/jmdict/j_jmdict.html" target="_blank" rel="noreferrer">
            JMdict / EDRDG <ArrowUpRight size={14} />
          </a>
          <a href="https://github.com/scriptin/jmdict-simplified" target="_blank" rel="noreferrer">
            jmdict-simplified <ArrowUpRight size={14} />
          </a>
          <a
            href="https://creativecommons.org/licenses/by-sa/4.0/"
            target="_blank"
            rel="noreferrer"
          >
            CC BY-SA 4.0 <ArrowUpRight size={14} />
          </a>
        </div>
        <p className="muted">
          Hệ thống bài học và bài tập ngữ pháp toàn diện từ N5 đến N1 kèm 10 bài tập cho mỗi điểm ngữ pháp, được tổng hợp bám sát JLPT theo các giáo trình Minna no Nihongo, Shinkanzen Master &amp; Soumatome. Phát âm dùng giọng AI Nanami Neural tự nhiên hoặc giọng tiếng Nhật trên thiết bị khi có sẵn.
        </p>
      </section>
    </>
  );
}

function SeasonHistorySection() {
  const { data: history, isLoading } = useQuery<SeasonHistoryItem[]>({
    queryKey: ['leaderboard-history'],
    queryFn: () => api<SeasonHistoryItem[]>('/leaderboard/history'),
  });

  if (isLoading) return <p className="text-xs text-[#5e6660]">Đang tải lịch sử...</p>;

  if (!history || history.length === 0) {
    return (
      <div className="p-4 bg-[#faf8f5] rounded-2xl border border-[#e6dfd5] text-center text-xs text-[#5e6660]">
        Chưa có mùa giải nào kết thúc. Hãy tích cực học tập tháng này để nhận Gia huy vinh danh đầu tháng sau nhé!
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {history.map((h: SeasonHistoryItem) => (
        <div
          key={h.id}
          className="flex items-center justify-between p-3.5 bg-[#faf8f5] rounded-2xl border border-[#e6dfd5]"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white border border-[#c2dacb] flex items-center justify-center text-[#2c5e43] shadow-xs">
              {h.kamonType === 'kiku' && <KikuKamon className="w-6 h-6 text-[#966c18]" />}
              {h.kamonType === 'ume' && <UmeKamon className="w-6 h-6 text-[#475569]" />}
              {h.kamonType === 'sakura' && <SakuraKamon className="w-6 h-6 text-[#8c4a32]" />}
              {h.kamonType === 'wakaba' && <WakabaKamon className="w-6 h-6 text-[#2c5e43]" />}
            </div>
            <div>
              <p className="text-xs font-bold text-[#1f2421]">
                {h.seasonTitle} · Hạng #{h.rank}
              </p>
              <p className="text-[11px] text-[#5e6660]">
                {h.kamonType === 'kiku'
                  ? 'Gia huy Cúc Hoàng Gia (Quán Quân)'
                  : h.kamonType === 'ume'
                  ? 'Gia huy Mai Tri Thức (Á Quân)'
                  : h.kamonType === 'sakura'
                  ? 'Gia huy Anh Đào (Quý Quân)'
                  : 'Gia huy Chồi Non Wakaba'}
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-[#2c5e43]">
            {h.exp.toLocaleString('vi-VN')} EXP
          </span>
        </div>
      ))}
    </div>
  );
}

export function Profile() {
  const { data: user } = useUser();
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('花');
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const notify = useUI((s) => s.notify);
  const client = useQueryClient();

  useEffect(() => {
    if (user) {
      setName(user.name);
      setAvatar(user.avatar);
    }
  }, [user?.id, user?.name, user?.avatar]);

  return (
    <>
      <PageHeader
        eyebrow="NGƯỜI HỌC"
        title="Hồ sơ của bạn"
        description="Một chút cá nhân cho góc học tập mỗi ngày."
      />
      <section className="panel settings-section">
        <div>
          <h2>Thông tin cá nhân</h2>
          <p>{user?.email}</p>
          <span className="avatar big-avatar">{avatar}</span>
        </div>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              client.setQueryData(['user'], await patch('/profile', { name, avatar }));
              notify('Đã lưu hồ sơ.');
            } catch (error) {
              notify((error as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            Tên hiển thị
            <input value={name} required maxLength={60} onChange={(e) => setName(e.target.value)} />
          </label>
          <label>Chọn biểu tượng</label>
          <div className="avatar-options">
            {['花', '山', '月', '海', '猫', '森'].map((a) => (
              <button
                type="button"
                className={avatar === a ? 'selected' : ''}
                key={a}
                onClick={() => setAvatar(a)}
              >
                {a}
              </button>
            ))}
          </div>
          <Button type="submit" disabled={busy}>
            Lưu hồ sơ
            <Check size={16} />
          </Button>
        </form>
      </section>
      <section className="panel settings-section spaced">
        <div>
          <h2>Đổi mật khẩu</h2>
          <p>Tối thiểu 8 ký tự. Các phiên khác sẽ được đăng xuất.</p>
        </div>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            try {
              await post('/profile/password', { currentPassword, password });
              setCurrentPassword('');
              setPassword('');
              notify('Đã đổi mật khẩu.');
            } catch (error) {
              notify((error as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <label>
            Mật khẩu hiện tại
            <input
              type="password"
              required
              value={currentPassword}
              autoComplete="current-password"
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </label>
          <label>
            Mật khẩu mới
            <input
              type="password"
              required
              minLength={8}
              maxLength={128}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          <Button variant="secondary" disabled={busy} type="submit">
            Cập nhật mật khẩu
          </Button>
        </form>
      </section>
      <section className="panel settings-section spaced">
        <div>
          <h2>Lịch sử Xếp hạng & Bộ sưu tập Gia huy</h2>
          <p>Thành tích và danh hiệu đạt được qua các mùa giải thi đua hàng tháng.</p>
        </div>
        <SeasonHistorySection />
      </section>
      <AnnotationSettings />
    </>
  );
}
