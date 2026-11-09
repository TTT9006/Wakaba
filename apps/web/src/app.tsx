import { motion, AnimatePresence } from 'motion/react';
import { KanjiDetail } from './pages/radicals';
import { LeaderboardPage } from './pages/leaderboard';
import { CelebrationModal } from './components/celebration-modal';
import { Brand } from './components/brand';
import { LoginReview } from './pages/login-review';
import type { LoginReviewView } from '../../../packages/shared/login-review';
import { useEffect, useState } from 'react';
import {
  Routes,
  Route,
  NavLink,
  Navigate,
  Outlet,
  useNavigate,
  useLocation,
  Link,
} from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  LayoutDashboard,
  Layers,
  BookOpen,
  Search,
  PenLine,
  ClipboardCheck,
  ChartNoAxesCombined,
  Settings,
  Menu,
  ArrowUpRight,
  LogOut,
  ChevronDown,
  Leaf,
  X,
  Target,
  Award,
} from 'lucide-react';
import * as Dropdown from '@radix-ui/react-dropdown-menu';
import * as Dialog from '@radix-ui/react-dialog';
import { api, post } from './services/api';
import type { User } from './types';
import { useUI } from './stores/ui';
import { Loading, Button } from './components/ui';
import { AuthPage } from './pages/auth';
import { Dashboard, Progress } from './pages/dashboard';
import { Dictionary, DictionaryDetail } from './pages/dictionary';
import { Flashcards, DeckDetail, Review } from './pages/flashcards';
import { ConsolidatedReview } from './pages/consolidated-review';
import { Grammar, GrammarLesson, GrammarReview } from './pages/grammar';
import { Tests, TestSession } from './pages/tests';
import { SkillsPage } from './pages/skills';
import { Writing } from './pages/writing';
import { SettingsPage, Profile } from './pages/settings';
const navigation = [
  { to: '/dashboard', label: 'Tổng quan', icon: LayoutDashboard },
  { to: '/flashcards', label: 'Thẻ từ vựng', icon: Layers },
  { to: '/grammar', label: 'Ngữ pháp', icon: BookOpen },
  { to: '/dictionary', label: 'Từ điển', icon: Search },
  { to: '/writing', label: 'Luyện viết', icon: PenLine },
  { to: '/skills', label: 'Luyện kỹ năng', icon: Target },
  { to: '/tests', label: 'Luyện đề', icon: ClipboardCheck },
  { to: '/leaderboard', label: 'Bảng xếp hạng', icon: Award },
  { to: '/progress', label: 'Tiến độ học tập', icon: ChartNoAxesCombined },
];
export function useUser() {
  return useQuery({ queryKey: ['user'], queryFn: () => api<User>('/auth/me'), retry: false });
}
function Layout() {
  const { data: user, isLoading } = useUser();
  const loginReview = useQuery({ queryKey: ['login-review', user?.id], queryFn: () => api<LoginReviewView>('/login-review'), enabled: !!user, refetchOnWindowFocus: false });
  const navigate = useNavigate();
  const client = useQueryClient();
  const location = useLocation();
  const [mobile, setMobile] = useState(false);
  const [smallScreen, setSmallScreen] = useState(() => window.matchMedia('(max-width: 760px)').matches);
  useEffect(() => {
    const media = window.matchMedia('(max-width: 760px)');
    const update = () => { setSmallScreen(media.matches); if (!media.matches) setMobile(false); };
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);
  const [search, setSearch] = useState('');
  const notify = useUI((s) => s.notify);
  const examMode = useUI((s) => s.examMode);
  useEffect(() => {
    setMobile(false);
    window.scrollTo(0, 0);
  }, [location.pathname]);
  useEffect(() => {
    const theme = user?.theme || 'light';
    document.documentElement.dataset.theme =
      theme === 'system'
        ? matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
        : theme;
  }, [user?.theme]);
  if (isLoading) return <Loading />;
  if (!user) return <Navigate to="/login" replace />;
  if (loginReview.isLoading) return <Loading />;
  if (loginReview.error) return <main className="login-review-shell"><p role="alert">Không tải được lịch ôn. Vui lòng thử lại.</p><Button onClick={() => void loginReview.refetch()}>Thử lại</Button><Button variant="secondary" onClick={async()=>{await post('/auth/logout');client.clear();navigate('/login');}}>Đăng xuất</Button></main>;
  if (loginReview.data && !loginReview.data.ready) return <LoginReview key={user.id} initial={loginReview.data} name={user.name} complete={() => {client.setQueryData(['login-review', user.id], {ready:true,active:false,total:0,done:0,decks:[]});navigate('/dashboard');}}/>;
  const sidebar = <>
        <Link to="/dashboard" className="brand">
          <Brand tagline />
        </Link>
        <div className="sidebar-label">GÓC HỌC TẬP</div>
        <nav aria-label="Điều hướng chính">
          {navigation.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to}>
              <Icon size={19} />
              <span>{label}</span>
              {to === '/dictionary' && <span className="nav-dot" />}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-note">
            <Leaf size={20} />
            <p>
              Chậm một chút.
              <br />
              <strong>Tiến bộ mỗi ngày.</strong>
            </p>
            <span>一日一歩</span>
          </div>
          <NavLink className="settings-link" to="/settings">
            <Settings size={18} />
            Cài đặt
          </NavLink>
          <Dropdown.Root>
            <Dropdown.Trigger className="user-menu">
              <span className="avatar">{user.avatar}</span>
              <span>
                <strong>{user.name}</strong>
                <small>Mục tiêu JLPT {user.level}</small>
              </span>
              <ChevronDown size={15} />
            </Dropdown.Trigger>
            <Dropdown.Portal>
              <Dropdown.Content className="dropdown" sideOffset={8}>
                <Dropdown.Item onSelect={() => navigate('/profile')}>Hồ sơ của tôi</Dropdown.Item>
                <Dropdown.Item
                  onSelect={() =>
                    void post('/auth/logout')
                      .then(() => {
                        client.clear();
                        navigate('/login');
                      })
                      .catch((e) => notify((e as Error).message))
                  }
                >
                  <LogOut size={15} />
                  Đăng xuất
                </Dropdown.Item>
              </Dropdown.Content>
            </Dropdown.Portal>
          </Dropdown.Root>
        </div>
  </>;
  return (
    <Dialog.Root open={mobile} onOpenChange={setMobile}>
    <div className={'app-shell ' + (examMode ? 'is-exam-mode' : '')}>
      {!smallScreen && !examMode && <aside className="sidebar">{sidebar}</aside>}
      {smallScreen && !examMode && <Dialog.Portal>
        <Dialog.Overlay className="mobile-overlay" />
        <Dialog.Content className="sidebar open mobile-drawer" aria-describedby={undefined}>
          <Dialog.Title className="sr-only">Điều hướng học tập</Dialog.Title>
          <Dialog.Close className="button ghost icon-button drawer-close" aria-label="Đóng điều hướng"><X size={22} /></Dialog.Close>
          {sidebar}
        </Dialog.Content>
      </Dialog.Portal>}
      <div className={'main-shell ' + (examMode ? 'is-exam-mode' : '')}>
        {!examMode && <header className="topbar">
          <Dialog.Trigger asChild><Button
            variant="ghost"
            size="icon"
            className="mobile-menu"
            aria-label="Mở điều hướng"
          >
            <Menu size={22} />
          </Button></Dialog.Trigger>
          <div className="breadcrumb">
            Góc học tập <span>/</span>{' '}
            <strong>
              {navigation.find((n) => location.pathname.startsWith(n.to))?.label || 'Tài khoản'}
            </strong>
          </div>
          <form
            className="global-search"
            onSubmit={(e) => {
              e.preventDefault();
              navigate('/dictionary?q=' + encodeURIComponent(search));
            }}
          >
            <Search size={16} />
            <input
              aria-label="Tra từ nhanh"
              placeholder="Tra một từ tiếng Nhật…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <kbd>↵</kbd>
          </form>
          <Link className="level-pill" to="/settings">
            JLPT {user.level}
            <ArrowUpRight size={14} />
          </Link>
        </header>}
        <main>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
        {!examMode && <footer className="footer">
          <div className="footer-left">
            <span>若葉 · Học từng chút, lớn mỗi ngày.</span>
          </div>
          <Link to="/settings#sources">
            Nguồn dữ liệu & bản quyền <ArrowUpRight size={12} />
          </Link>
        </footer>}
      </div>
      {smallScreen && !examMode && <nav className="mobile-bottom-nav" aria-label="Truy cập nhanh">
        {[navigation[0], navigation[3], navigation[1], navigation[4]].map(({ to, label, icon: Icon }) =>
          <NavLink key={to} to={to}><Icon size={21} /><span>{label}</span></NavLink>)}
        <Dialog.Trigger className="mobile-more"><Menu size={21} /><span>Thêm</span></Dialog.Trigger>
      </nav>}
    </div>
      <CelebrationModal />
    </Dialog.Root>
  );
}
function Toast() {
  const message = useUI((s) => s.message);
  return message ? (
    <div className="toast" role="status">
      {message}
    </div>
  ) : null;
}
export function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<AuthPage />} />
        <Route path="/register" element={<AuthPage register />} />
        <Route path="/terms" element={<Navigate to="/dashboard" replace />} />
        <Route path="/privacy" element={<Navigate to="/dashboard" replace />} />
        <Route path="/cookies" element={<Navigate to="/dashboard" replace />} />
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="dictionary" element={<Dictionary />} />
          <Route path="dictionary/:id" element={<DictionaryDetail />} />
          <Route path="flashcards" element={<Flashcards />} />
          <Route path="flashcards/review" element={<Review />} />
          <Route path="review/consolidated" element={<ConsolidatedReview />} />
          <Route path="flashcards/:deckId" element={<DeckDetail />} />
          <Route path="grammar" element={<Grammar />} />
          <Route path="grammar/review" element={<GrammarReview />} />
          <Route path="grammar/:id" element={<GrammarLesson />} />
          <Route path="kanji/:character" element={<KanjiDetail/>}/>
          <Route path="writing" element={<Writing />} />
          <Route path="skills" element={<SkillsPage />} />
          <Route path="leaderboard" element={<LeaderboardPage />} />
          <Route path="tests" element={<Tests />} />
          <Route path="tests/:id" element={<TestSession />} />
          <Route path="progress" element={<Progress />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="profile" element={<Profile />} />
          <Route
            path="*"
            element={
              <div className="empty-state">
                <h1>Trang này chưa tồn tại</h1>
                <Link to="/dashboard">Về góc học tập</Link>
              </div>
            }
          />
        </Route>
      </Routes>
      <Toast />
    </>
  );
}
