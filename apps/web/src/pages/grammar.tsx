import { JapaneseAnnotatedText } from '../components/japanese-annotated-text';
import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Bookmark, Check, Search, RotateCcw } from 'lucide-react';
import { api, post } from '../services/api';
import { useUI } from '../stores/ui';
import type { LessonSummary, Question } from '../types';
import type { LessonContent } from '../../../../packages/shared/content';
import { Button, Empty, ErrorState, Loading, PageHeader, AudioButton } from '../components/ui';
import { QuestionInput } from './tests';

type Roadmap = {
  levels: {
    level: string;
    total: number;
    completed: number;
    mastered: number;
    due: number;
    weak: number;
  }[];
  total: number;
  due: number;
  weak: number;
  recommendation:
    (LessonSummary & { reason: string; action: 'learn' | 'review' | 'mistakes' }) | null;
};
type Feedback = { correct: boolean; answer: string; explanation: string };
function useRefreshGrammar() {
  const client = useQueryClient();
  return () => {
    for (const key of ['grammar', 'grammar-roadmap', 'lesson', 'dashboard', 'leaderboard-current']) {
      void client.invalidateQueries({ queryKey: [key] });
    }
  };
}
export function Grammar() {
  const [params, setParams] = useSearchParams();
  const level = ['N5', 'N4', 'N3', 'N2', 'N1'].includes(params.get('level') || '')
    ? params.get('level')!
    : 'N5';
  const search = params.get('q') || '',
    filter = params.get('filter') || 'all';
  const page = Math.max(1, Math.floor(Number(params.get('page')) || 1));
  function change(key: string, value: string) {
    const next = new URLSearchParams(params);
    next.set(key, value);
    if (key !== 'page') next.delete('page');
    setParams(next, { replace: key === 'q' });
  }
  const query = useQuery({
    queryKey: ['grammar', level],
    queryFn: () => api<LessonSummary[]>('/grammar?level=' + level),
  });
  const roadmap = useQuery({
    queryKey: ['grammar-roadmap', level],
    queryFn: () => api<Roadmap>('/grammar/roadmap?level=' + level),
  });
  const filtered =
    query.data?.filter(
      (l) =>
        (l.title + l.pattern + (l.curriculum?.chapter ? ' bài ' + l.curriculum.chapter : ''))
          .toLocaleLowerCase('vi')
          .includes(search.toLocaleLowerCase('vi')) &&
        (filter !== 'bookmarked' || l.progress[0]?.bookmarked) &&
        (filter !== 'due' || (l.practice?.due || 0) > 0) &&
        (filter !== 'weak' || (l.practice?.weak || 0) > 0) &&
        (filter !== 'mastered' || l.practice?.mastered),
    ) || [];
  const pages = Math.max(1, Math.ceil(filtered.length / 12)),
    currentPage = Math.min(page, pages);
  const recommendation = roadmap.data?.recommendation;
  return (
    <>
      <PageHeader
        eyebrow="NGỮ PHÁP · N5 → N1"
        title="Học có thứ tự. Ôn để nhớ lâu."
        description="Lộ trình toàn diện từ sơ cấp N5 đến cao cấp N1. Phân chia dạng rõ ràng, chú thích phân biệt sâu sắc và thực hành 10 bài tập mỗi điểm ngữ pháp."
      />
      {roadmap.error && <ErrorState error={roadmap.error} />}
      <nav className="grammar-roadmap" aria-label="Lộ trình ngữ pháp">
        {(
          roadmap.data?.levels ||
          ['N5', 'N4', 'N3', 'N2', 'N1'].map((level) => ({
            level,
            total: 0,
            mastered: 0,
            due: 0,
            completed: 0,
            weak: 0,
          }))
        ).map((stage) => (
          <button
            key={stage.level}
            className={'panel grammar-stage ' + (level === stage.level ? 'active' : '')}
            aria-pressed={level === stage.level}
            onClick={() => change('level', stage.level)}
          >
            <strong>{stage.level}</strong>
            <span>
              {stage.level === 'N5'
                ? 'Nền tảng · sơ cấp I'
                : stage.level === 'N4'
                  ? 'Mở rộng · sơ cấp II'
                  : stage.level === 'N3'
                    ? 'Bổ sung · trung cấp I'
                    : stage.level === 'N2'
                      ? 'Nâng cao · trung cấp II'
                      : 'Chuyên sâu · cao cấp N1'}
            </span>
            <progress
              aria-label={'Tiến độ ' + stage.level}
              max={stage.total || 1}
              value={stage.mastered}
            />
            <small>
              {stage.mastered}/{stage.total} bài đã làm đúng · {stage.due} câu đến hạn
            </small>
          </button>
        ))}
      </nav>
      <section className="review-banner spaced">
        <div>
          <span className="eyebrow">HÔM NAY · {level}</span>
          <h2>{roadmap.data?.due || 0} câu đến lịch ôn</h2>
          <p>
            {roadmap.data?.weak || 0} câu cần củng cố. Trả lời sai: gặp lại sau 10 phút; trả lời
            đúng: giãn lịch ôn.
          </p>
        </div>
        <div className="inline-actions wrap">
          <Link className="button primary" to={'/grammar/review?level=' + level}>
            Ôn đến hạn <ArrowRight size={16} />
          </Link>
          <Link className="button secondary" to={'/grammar/review?mode=mistakes&level=' + level}>
            Luyện lỗi sai
          </Link>
        </div>
      </section>
      {recommendation && (
        <section className="panel grammar-next spaced">
          <div>
            <span className="eyebrow">{recommendation.reason}</span>
            <h2>{recommendation.title}</h2>
            <p lang="ja">{recommendation.pattern}</p>
          </div>
          <Link
            className="button secondary"
            to={
              recommendation.action === 'learn'
                ? '/grammar/' + recommendation.id
                : '/grammar/review?level=' +
                  level +
                  '&mode=' +
                  (recommendation.action === 'mistakes' ? 'mistakes' : 'due')
            }
          >
            Tiếp tục <ArrowRight size={16} />
          </Link>
        </section>
      )}
      <div className="toolbar spaced">
        <div className="input-icon">
          <Search size={17} />
          <input
            aria-label="Tìm bài ngữ pháp"
            placeholder="Mẫu câu, chủ đề hoặc bài 26…"
            value={search}
            onChange={(e) => change('q', e.target.value)}
          />
        </div>
        <select
          aria-label="Lọc bài ngữ pháp"
          value={filter}
          onChange={(e) => change('filter', e.target.value)}
        >
          <option value="all">Tất cả bài</option>
          <option value="bookmarked">Đã lưu</option>
          <option value="due">Đến hạn ôn</option>
          <option value="weak">Cần củng cố</option>
          <option value="mastered">Đã làm đúng</option>
        </select>
        <span className="muted">{filtered.length} bài</span>
      </div>
      {query.isLoading ? (
        <Loading />
      ) : query.error ? (
        <ErrorState error={query.error} />
      ) : filtered.length ? (
        <>
          <div className="grammar-grid">
            {filtered.slice((currentPage - 1) * 12, currentPage * 12).map((l) => (
              <Link to={'/grammar/' + l.id} key={l.id} className="grammar-card">
                <div className="grammar-card-top">
                  <span>
                    {l.curriculum?.chapter
                      ? `MINNA · BÀI ${l.curriculum.chapter}`
                      : l.curriculum
                        ? 'TRUNG CẤP · BỔ SUNG'
                        : 'NỀN TẢNG'}
                  </span>
                  <span>
                    {l.level}
                    {l.practice?.mastered && <Check size={15} />}
                  </span>
                </div>
                <h2 lang="ja">{l.pattern}</h2>
                <h3>{l.title}</h3>
                <div className="grammar-card-bottom">
                  <span>
                    {l.practice?.due
                      ? `${l.practice.due} câu đến hạn`
                      : l.practice?.weak
                        ? `${l.practice.weak} câu cần củng cố`
                        : l.practice?.mastered
                          ? 'Đã làm đúng · tiếp tục ôn định kỳ'
                          : l.progress[0]?.completed
                            ? 'Đã đọc · tiếp tục thực hành'
                            : `${l.practice?.total || 0} bài tập`}
                  </span>
                  <ArrowRight size={17} />
                </div>
              </Link>
            ))}
          </div>
          <nav className="inline-actions grammar-pagination" aria-label="Trang bài ngữ pháp">
            <Button
              variant="secondary"
              disabled={currentPage <= 1}
              onClick={() => change('page', String(currentPage - 1))}
            >
              Trang trước
            </Button>
            <span>
              {currentPage} / {pages}
            </span>
            <Button
              variant="secondary"
              disabled={currentPage >= pages}
              onClick={() => change('page', String(currentPage + 1))}
            >
              Trang sau
            </Button>
          </nav>
        </>
      ) : (
        <Empty title="Không có bài phù hợp">
          <p>Thử đổi bộ lọc hoặc tìm bằng mẫu câu khác.</p>
          <Button variant="secondary" onClick={() => setParams({ level })}>
            Xóa bộ lọc
          </Button>
        </Empty>
      )}
      <details className="panel spaced grammar-source">
        <summary>Nội dung và nguồn tham khảo</summary>
        <p>
          Lộ trình ngữ pháp N5–N1 toàn diện, bao gồm cấu trúc theo mạch Minna và các chuyên đề trọng điểm JLPT N5–N1 được tổng hợp bám sát JLPT chuẩn xác, phân chia theo từng dạng cụ thể, chú thích phân biệt các ngữ pháp dễ nhầm lẫn và 10 bài tập thực hành đa dạng cho mỗi điểm ngữ pháp.
        </p>
        <p>
          <a href="https://www.vnjpclub.com/" target="_blank" rel="noreferrer">
            Danh mục VNJP Club ↗
          </a>{' '}
          ·{' '}
          <a href="https://plus.3anet.co.jp/mnc/howtoteach/" target="_blank" rel="noreferrer">
            Mục tiêu bài học của nhà xuất bản ↗
          </a>
        </p>
      </details>
    </>
  );
}

export function GrammarExercise({
  question,
  grammarId,
  onAnswered,
}: {
  question: Question;
  grammarId: string;
  onAnswered?: (correct: boolean) => void;
}) {
  const [answer, setAnswer] = useState(''),
    [feedback, setFeedback] = useState<Feedback | null>(null);
  const [attemptId] = useState(() => crypto.randomUUID());
  const [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const refresh = useRefreshGrammar();
  return (
    <div className="exercise">
      <h3>
        <JapaneseAnnotatedText
          text={question.prompt}
          disabled={question.annotationDisabled}
          readings={question.readings}
        />
      </h3>
      <QuestionInput
        question={question}
        value={answer}
        onChange={setAnswer}
        disabled={busy || !!feedback}
      />
      <Button
        variant="secondary"
        disabled={!answer.trim() || busy || !!feedback}
        onClick={async () => {
          setBusy(true);
          setError('');
          try {
            const result = await post<Feedback>('/grammar/' + grammarId + '/exercise', {
              exerciseId: question.id,
              answer,
              attemptId,
            });
            setFeedback(result);
            refresh();
            onAnswered?.(result.correct);
          } catch (e) {
            setError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? 'Đang lưu…' : feedback ? 'Đã lưu kết quả' : 'Kiểm tra câu trả lời'}
      </Button>
      {error && (
        <p role="alert" className="error-text">
          {error}
        </p>
      )}
      {feedback && (
        <div className={'feedback ' + (feedback.correct ? 'correct' : 'incorrect')} role="status">
          <strong>{feedback.correct ? 'Chính xác!' : 'Thử ghi nhớ cách dùng này nhé.'}</strong>
          <p>
            Đáp án: <JapaneseAnnotatedText text={feedback.answer} />
          </p>
          <p>
            <JapaneseAnnotatedText text={feedback.explanation} />
          </p>
          <small>
            {feedback.correct
              ? 'Đã cập nhật lịch ôn theo mức ghi nhớ.'
              : 'Đã thêm vào mục lỗi sai; gặp lại sau 10 phút.'}
          </small>
        </div>
      )}
    </div>
  );
}

export function GrammarLesson() {
  const { id } = useParams();
  return <Lesson key={id} id={id!} />;
}
function Lesson({ id }: { id: string }) {
  const notify = useUI((s) => s.notify),
    refresh = useRefreshGrammar();
  const [busy, setBusy] = useState(false),
    [round, setRound] = useState(0);
  const {
    data: lesson,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['lesson', id],
    queryFn: () =>
      api<
        LessonSummary & {
          content: LessonContent;
          exercises: Question[];
          previous: { id: string; title: string } | null;
          next: { id: string; title: string } | null;
        }
      >('/grammar/' + id),
  });
  async function progress(data: { completed?: boolean; bookmarked?: boolean }) {
    setBusy(true);
    try {
      await post('/grammar/' + id + '/progress', data);
      refresh();
      notify(
        data.completed
          ? 'Đã ghi nhận đọc bài. Làm bài tập để theo dõi ghi nhớ.'
          : 'Đã cập nhật dấu trang.',
      );
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  if (isLoading) return <Loading />;
  if (!lesson) return <ErrorState error={error} />;
  return (
    <>
      <Link className="back-link" to={'/grammar?level=' + lesson.level}>
        <ArrowLeft size={16} /> Lộ trình {lesson.level}
      </Link>
      <PageHeader
        eyebrow={`${lesson.level} · ${lesson.curriculum?.track || 'Nền tảng'}${lesson.curriculum?.chapter ? ' · Bài ' + lesson.curriculum.chapter : ''}`}
        title={lesson.title}
        description={lesson.pattern}
        action={
          <Button
            variant="secondary"
            disabled={busy}
            onClick={() => void progress({ bookmarked: !lesson.progress[0]?.bookmarked })}
          >
            <Bookmark size={16} fill={lesson.progress[0]?.bookmarked ? 'currentColor' : 'none'} />
            {lesson.progress[0]?.bookmarked ? 'Đã lưu' : 'Lưu bài học'}
          </Button>
        }
      />
      <div className="lesson-layout">
        <article className="panel lesson-body">
          <span className="eyebrow">Ý NGHĨA VÀ CÁCH DÙNG</span>
          <h2>{lesson.content.meaning}</h2>
          <p>
            <JapaneseAnnotatedText text={lesson.content.explanation} />
          </p>
          <h3>Cấu trúc</h3>
          <div className="formation">
            <JapaneseAnnotatedText text={lesson.content.formation} />
          </div>
          <h3>Ví dụ thực hành</h3>
          {lesson.content.examples.map((ex) => (
            <div className="example" key={ex.ja}>
              <div>
                <p lang="ja">
                    <JapaneseAnnotatedText text={ex.ja} reading={ex.readings ? undefined : ex.kana} readings={ex.readings} />
                </p>
                <p>{ex.vi}</p>
              </div>
              <AudioButton text={ex.ja} />
            </div>
          ))}
          <h3>Ghi nhớ và phân biệt</h3>
          <p>
            <JapaneseAnnotatedText text={lesson.content.notes} />
          </p>
          <div className="mistake-note">
            <strong>Tránh nhầm lẫn</strong>
            <p>
              <JapaneseAnnotatedText text={lesson.content.mistake} />
            </p>
          </div>
          {lesson.curriculum && (
            <p className="muted">
              Ví dụ và bài tập được tổng hợp bám sát JLPT.{' '}
              <a href={lesson.curriculum.sourceUrl} target="_blank" rel="noreferrer">
                {lesson.curriculum.sourceLabel} ↗
              </a>
            </p>
          )}
        </article>
        <aside>
          <div className="panel">
            <h3>Tiến độ của bạn</h3>
            <p>
              {lesson.practice?.correct || 0}/{lesson.practice?.total || 0} câu có kết quả gần nhất
              đúng.
            </p>
            <p>
              {lesson.practice?.due || 0} câu đến hạn · {lesson.practice?.weak || 0} câu cần củng
              cố.
            </p>
            <Button
              disabled={busy || lesson.progress[0]?.completed}
              onClick={() => void progress({ completed: true })}
            >
              <Check size={16} />
              {lesson.progress[0]?.completed ? 'Đã đọc bài' : 'Đánh dấu đã đọc'}
            </Button>
            <p>Đã đọc và đã làm đúng được theo dõi riêng. Ôn lại định kỳ để giữ kiến thức.</p>
          </div>
          <div className="panel spaced">
            <h3>Bước tiếp theo</h3>
            {lesson.next ? (
              <Link className="text-link" to={'/grammar/' + lesson.next.id}>
                {lesson.next.title}
                <ArrowRight size={16} />
              </Link>
            ) : (
              <Link to="/grammar">Chọn chặng tiếp theo</Link>
            )}
          </div>
        </aside>
      </div>
      <section className="panel spaced">
        <div className="section-heading">
          <h2>Thực hành ngay</h2>
          <Button variant="secondary" onClick={() => setRound(round + 1)}>
            <RotateCcw size={16} />
            Làm lại bài
          </Button>
        </div>
        {lesson.exercises.map((q) => (
          <GrammarExercise key={q.id + ':' + round} question={q} grammarId={id} />
        ))}
      </section>
      <nav className="grammar-next spaced" aria-label="Chuyển bài">
        {lesson.previous && (
          <Link className="text-link" to={'/grammar/' + lesson.previous.id}>
            <ArrowLeft size={16} />
            {lesson.previous.title}
          </Link>
        )}
        {lesson.next && (
          <Link className="text-link" to={'/grammar/' + lesson.next.id}>
            {lesson.next.title}
            <ArrowRight size={16} />
          </Link>
        )}
      </nav>
    </>
  );
}

type ReviewQueue = {
  total: number;
  items: { grammarId: string; title: string; level: string; question: Question }[];
};
export function GrammarReview() {
  const [params] = useSearchParams(),
    [round, setRound] = useState(0);
  const level = params.get('level') || '',
    mode = params.get('mode') === 'mistakes' ? 'mistakes' : 'due';
  return (
    <ReviewSession
      key={level + mode + round}
      level={level}
      mode={mode}
      restart={() => setRound(round + 1)}
    />
  );
}
function ReviewSession({
  level,
  mode,
  restart,
}: {
  level: string;
  mode: string;
  restart: () => void;
}) {
  const [sessionId] = useState(() => crypto.randomUUID());
  const [index, setIndex] = useState(0),
    [correct, setCorrect] = useState(0),
    [answered, setAnswered] = useState(false);
  const query = useQuery({
    queryKey: ['grammar-review-session', sessionId],
    queryFn: () =>
      api<ReviewQueue>(
        `/grammar/review?mode=${mode}${level ? '&level=' + encodeURIComponent(level) : ''}`,
      ),
    staleTime: Infinity,
    gcTime: 0,
    refetchOnWindowFocus: false,
  });
  const item = query.data?.items[index];
  return (
    <>
      <Link className="back-link" to={'/grammar' + (level ? '?level=' + level : '')}>
        <ArrowLeft size={16} />
        Về lộ trình
      </Link>
      <PageHeader
        eyebrow={'ÔN NGỮ PHÁP ' + level}
        title={mode === 'mistakes' ? 'Hiểu lại từ những câu sai.' : 'Gặp lại đúng lúc.'}
        description="Mỗi lượt tối đa 20 câu. Kết quả và lịch ôn được lưu ngay sau từng câu."
      />
      {query.isLoading ? (
        <Loading />
      ) : query.error ? (
        <ErrorState error={query.error} />
      ) : item ? (
        <section className="panel grammar-review-session">
          <span className="eyebrow">
            CÂU {index + 1}/{query.data!.items.length} · {item.level}
          </span>
          <h2>{item.title}</h2>
          <progress
            aria-label="Tiến độ lượt ôn"
            max={query.data!.items.length}
            value={index + (answered ? 1 : 0)}
          />
          <GrammarExercise
            key={item.grammarId + item.question.id}
            question={item.question}
            grammarId={item.grammarId}
            onAnswered={(ok) => {
              setAnswered(true);
              if (ok) setCorrect((n) => n + 1);
            }}
          />
          <div className="inline-actions wrap">
            <Button
              disabled={!answered}
              onClick={() => {
                setIndex(index + 1);
                setAnswered(false);
              }}
            >
              {' '}
              {index + 1 === query.data!.items.length ? 'Xem kết quả lượt ôn' : 'Câu tiếp theo'}
              <ArrowRight size={16} />
            </Button>
            <Link target="_blank" rel="noreferrer" to={'/grammar/' + item.grammarId}>
              Xem lại bài học ↗
            </Link>
          </div>
        </section>
      ) : (
        <section className="panel">
          <h2>{index ? 'Đã hoàn thành lượt ôn' : 'Chưa có câu cần ôn ở mục này'}</h2>
          <p>
            {index
              ? `Bạn trả lời đúng ${correct}/${index} câu. Những câu chưa đúng đã được lưu để luyện lại.`
              : 'Làm bài tập trong bài học để bắt đầu lịch ôn. Câu sai có thể luyện ngay ở mục Luyện lỗi sai.'}
          </p>
          {query.data && query.data.total > query.data.items.length && (
            <p>Còn các câu khác trong hàng đợi. Mở lượt tiếp theo để tiếp tục.</p>
          )}
          <div className="inline-actions wrap">
            <Link className="button primary" to={'/grammar' + (level ? '?level=' + level : '')}>
              Về lộ trình
            </Link>
            {index > 0 && (
              <Button variant="secondary" onClick={restart}>
                Mở lượt mới
              </Button>
            )}
          </div>
        </section>
      )}
    </>
  );
}
