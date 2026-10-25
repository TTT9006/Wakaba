import { JapaneseAnnotatedText } from '../components/japanese-annotated-text';
import { JlptSession } from './jlpt';
import type { JlptSummary } from '../../../../packages/shared/jlpt-types';
import { jlptPapers, paperSummary } from '../../../../packages/shared/jlpt-papers';
import { getLocalHistoryAttempts } from '../../../../packages/shared/jlpt-client-runner';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  Clock3,
  Check,
  RotateCcw,
  Headphones,
  Maximize,
  Minimize,
  ShieldAlert,
  CheckCircle,
  Trophy,
  Target,
  GraduationCap,
} from 'lucide-react';
import { api, post } from '../services/api';
import { useUI } from '../stores/ui';
import type { Attempt, Question, Result } from '../types';
import { Button, Empty, ErrorState, Loading, PageHeader, Modal } from '../components/ui';
type Test = JlptSummary;
export function QuestionInput({
  question: q,
  value,
  onChange,
  disabled = false,
}: {
  question: Question;
  value: string;
  onChange: (s: string) => void;
  disabled?: boolean;
}) {
  if (q.type === 'matching') {
    const selected: string[] = value ? JSON.parse(value) : [];
    return (
      <div className="matching-board">
        {q.rows?.map((row, i) => (
          <label key={row + i}>
            <span lang="ja">
              <JapaneseAnnotatedText
                text={row}
                disabled={q.annotationDisabled}
                readings={q.readings}
              />
            </span>
            <select
              aria-label={'Ghép nghĩa cho ' + row}
              value={selected[i] || ''}
              disabled={disabled}
              onChange={(e) => {
                const next = [...selected];
                next[i] = e.target.value;
                onChange(JSON.stringify(next));
              }}
            >
              <option value="">Chọn nghĩa…</option>
              {q.options?.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
    );
  }
  if (q.type === 'order')
    return (
      <div className="ordering">
        <div className="word-bank">
          {q.options?.map((o, i) => (
            <Button
              key={i}
              disabled={disabled}
              variant="secondary"
              onClick={() => onChange(value + o)}
            >
              <JapaneseAnnotatedText
                text={o}
                disabled={q.annotationDisabled}
                readings={q.readings}
              />
            </Button>
          ))}
          <Button variant="ghost" disabled={disabled} onClick={() => onChange('')}>
            <RotateCcw size={15} />
            Làm lại
          </Button>
        </div>
        <input
          aria-label="Câu đã sắp xếp"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder="Chọn các từ theo thứ tự hoặc nhập câu…"
        />
      </div>
    );
  if (q.options)
    return (
      <div className="answer-options" role="radiogroup" aria-label="Các phương án trả lời">
        {q.options.map((o, i) => (
          <button
            key={o}
            type="button"
            role="radio"
            aria-checked={value === o}
            aria-label={`Lựa chọn ${q.numbered ? i + 1 : String.fromCharCode(65 + i)}: ${o}`}
            disabled={disabled}
            className={value === o ? 'selected' : ''}
            onClick={() => onChange(o)}
          >
            <span className="answer-key" aria-hidden="true">
              {q.numbered ? i + 1 : String.fromCharCode(65 + i)}
            </span>
            <JapaneseAnnotatedText text={o} disabled={q.annotationDisabled} readings={q.readings} />
            {value === o && <Check size={17} />}
          </button>
        ))}
      </div>
    );
  return (
    <input
      className="answer-input"
      aria-label="Câu trả lời"
      placeholder="Nhập câu trả lời của bạn…"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    />
  );
}
export function Tests() {
  const [review, setReview] = useState<Attempt | null>(null);
  const [selectedExamLevel, setSelectedExamLevel] = useState<string>('all');

  const { data, isLoading, error } = useQuery({
    queryKey: ['tests'],
    queryFn: async () => {
      try {
        const res = await api<Test[]>('/tests');
        if (Array.isArray(res) && res.length >= jlptPapers.length) {
          return res;
        }
      } catch (err) {
        console.warn('Backend /tests unavailable or outdated, using local papers:', err);
      }
      return jlptPapers.map(paperSummary) as unknown as Test[];
    },
  });
  const history = useQuery({
    queryKey: ['test-history'],
    queryFn: async () => {
      let serverAttempts: Attempt[] = [];
      try {
        const res = await api<Attempt[]>('/tests/history');
        if (Array.isArray(res)) serverAttempts = res;
      } catch (err) {
        console.warn('Backend /tests/history unavailable:', err);
      }
      const localAttempts = getLocalHistoryAttempts() as unknown as Attempt[];
      const combined = [...localAttempts, ...serverAttempts];
      combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return combined;
    },
  });

  const examLevels = ['N5', 'N4', 'N3', 'N2', 'N1'] as const;
  const allExams = data || [];
  const examCounts = {
    all: allExams.length,
    N5: allExams.filter((t) => t.level === 'N5').length,
    N4: allExams.filter((t) => t.level === 'N4').length,
    N3: allExams.filter((t) => t.level === 'N3').length,
    N2: allExams.filter((t) => t.level === 'N2').length,
    N1: allExams.filter((t) => t.level === 'N1').length,
  };

  const filteredExams =
    selectedExamLevel === 'all'
      ? allExams
      : allExams.filter((t) => t.level === selectedExamLevel);

  return (
    <>
      <PageHeader
        eyebrow="BIẾT MÌNH ĐÃ ĐI ĐƯỢC BAO XA"
        title="Luyện đề thi JLPT (N1–N5)"
        description="Đề thi đầy đủ thời gian theo cấu trúc chuẩn JLPT. Chấm điểm ở server, lưu bài đang làm và xem lại kết quả từng nhóm."
      />

      {/* Banner linking to Luyện kỹ năng */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 18px',
          backgroundColor: 'var(--surface)',
          borderRadius: '10px',
          border: '1px solid var(--line)',
          marginBlock: '16px 20px',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Target size={20} style={{ color: 'var(--jade)', flexShrink: 0 }} />
          <span style={{ fontSize: '14px', color: 'var(--ink)' }}>
            Bạn muốn rèn luyện từng kỹ năng riêng biệt (Nghe, Đọc, Từ vựng, Ngữ pháp)?
          </span>
        </div>
        <Link
          to="/skills"
          className="pill-btn active"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 16px',
            borderRadius: '6px',
            background: 'var(--jade)',
            color: '#fff',
            textDecoration: 'none',
            fontSize: '13px',
            fontWeight: 600,
            whiteSpace: 'nowrap',
          }}
        >
          Sang mục Luyện kỹ năng <ArrowRight size={14} />
        </Link>
      </div>

      {/* Level Filter Bar */}
      <div className="tabs inline-actions spaced" role="tablist" aria-label="Lọc cấp độ đề thi" style={{ marginBlock: '16px', flexWrap: 'wrap' }}>
        <button
          role="tab"
          aria-selected={selectedExamLevel === 'all'}
          className={selectedExamLevel === 'all' ? 'active' : ''}
          onClick={() => setSelectedExamLevel('all')}
        >
          <span>Tất cả</span>
          <span className="tab-badge">{examCounts.all}</span>
        </button>
        {examLevels.map((lvl) => (
          <button
            key={lvl}
            role="tab"
            aria-selected={selectedExamLevel === lvl}
            className={selectedExamLevel === lvl ? 'active' : ''}
            onClick={() => setSelectedExamLevel(lvl)}
          >
            <span>JLPT {lvl}</span>
            <span className="tab-badge">{examCounts[lvl]}</span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <Loading />
      ) : error ? (
        <ErrorState error={error} />
      ) : filteredExams.length === 0 ? (
        <div className="panel" style={{ textAlign: 'center', padding: '36px 20px', marginBlock: '20px' }}>
          <GraduationCap size={36} style={{ color: 'var(--muted)', margin: '0 auto 12px auto' }} />
          <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>Chưa có đề thi trọn gói 3 phần cho JLPT {selectedExamLevel}</h3>
          <p style={{ color: 'var(--muted)', maxWidth: '540px', margin: '0 auto 18px auto', fontSize: '14px' }}>
            Tuyển tập đề thi JLPT {selectedExamLevel} hiện đã được đưa vào phần <strong>Luyện kỹ năng</strong> (Đọc hiểu, Ngữ pháp, Từ vựng) để bạn luyện tập từng cấu trúc chuyên sâu.
          </p>
          <Link
            to="/skills"
            className="button"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
          >
            <Target size={16} /> Chuyển sang Luyện kỹ năng JLPT {selectedExamLevel}
          </Link>
        </div>
      ) : (
        <div className="test-grid">
          {filteredExams.map((t, i) => (
            <Link
              className="test-card test-card-official"
              to={'/tests/' + t.id}
              key={t.id}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '8px',
                  gap: '8px',
                  flexWrap: 'wrap',
                }}
              >
                <span className="eyebrow" style={{ margin: 0, color: 'var(--jade)', fontWeight: 700 }}>
                  {t.level} · {t.isOfficial ? 'ĐỀ THI CHÍNH THỨC' : 'ĐỀ LUYỆN TẬP'}
                </span>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <span
                    className="tag"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: t.keySource === 'Đáp án tham khảo' ? 'var(--peach)' : 'var(--jade)',
                      borderColor: t.keySource === 'Đáp án tham khảo' ? 'var(--peach)' : 'var(--jade)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 600,
                    }}
                  >
                    {t.keySource || (t.isOfficial ? 'Đáp án gốc' : 'Đáp án chuẩn')}
                  </span>
                  <span
                    className="tag"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      color: t.isDuplicateAudio ? 'var(--peach)' : 'var(--ocean)',
                      borderColor: t.isDuplicateAudio ? 'var(--peach)' : 'var(--ocean)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: 600,
                    }}
                  >
                    <Headphones size={12} />
                    {t.isDuplicateAudio ? (t.duplicateNote || 'Audio trùng 2010–2011') : 'Audio gốc · khớp tự động'}
                  </span>
                </div>
              </div>
              <span className="test-number">{String(i + 1).padStart(2, '0')}</span>
              <h2>{t.title}</h2>
              <p>
                {t.total} câu · {t.minutes} phút · {t.sections.length} phần
              </p>
              <ul className="jlpt-card-sections">
                {t.sections.map((s) => (
                  <li key={s.id}>
                    {s.title}: {s.minutes} phút ({s.count} câu)
                  </li>
                ))}
              </ul>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                <span>Vào phòng thi & bấm giờ</span>
                <ArrowRight size={19} />
              </div>
            </Link>
          ))}
        </div>
      )}

      <p className="spaced">
        Câu hỏi được tổng hợp bám sát JLPT và đề thi chính thức được cung cấp kèm âm thanh gốc đồng bộ theo từng
        câu. Điểm hiển thị là tỷ lệ câu đúng, không phải thang 180 của JLPT.{' '}
        <a
          className="text-link"
          href="https://www.jlpt.jp/e/guideline/testsections.html"
          target="_blank"
          rel="noreferrer"
        >
          Cấu trúc JLPT chính thức
        </a>
        .
      </p>

      {/* Recent Attempts History */}
      <section className="panel spaced">
        <h2>Những lần thử gần đây</h2>
        {history.data?.length ? (
          history.data.map((a) => (
            <button className="simple-row history-attempt" key={a.id} onClick={() => setReview(a)}>
              <div>
                <strong>{data?.find((t) => t.id === a.testId)?.title || a.testId}</strong>
                <small>{new Date(a.createdAt).toLocaleString('vi')}</small>
              </div>
              <span>{a.duration} giây</span>
              <strong className={a.score >= 70 ? 'positive' : ''}>{a.score}%</strong>
              <ArrowRight size={16} />
            </button>
          ))
        ) : (
          <p className="muted">Kết quả đầu tiên của bạn sẽ xuất hiện ở đây.</p>
        )}
      </section>

      {/* Review Modal for past attempts */}
      <Modal
        open={review !== null}
        onOpenChange={(o) => !o && setReview(null)}
        title="Xem lại bài làm"
      >
        {review &&
          (JSON.parse(review.answers) as Result[]).map((r, i) => (
            <div key={r.id} className={'feedback ' + (r.correct ? 'correct' : 'incorrect')}>
              <strong>
                {i + 1}. <JapaneseAnnotatedText text={r.prompt} />
              </strong>
              {r.imageUrl && (
                <div style={{ marginBlock: '8px' }}>
                  <img
                    src={r.imageUrl}
                    alt="Hình minh họa"
                    className="jlpt-question-image"
                    style={{ maxHeight: '240px', objectFit: 'contain' }}
                  />
                </div>
              )}
              {r.audioUrl && (
                <div className="jlpt-audio-player" style={{ marginBlock: '8px' }}>
                  <audio controls preload="auto" src={r.audioUrl} className="jlpt-audio-element" />
                </div>
              )}
              {r.passage && (
                <p className="jlpt-passage" lang="ja">
                  {r.passage}
                </p>
              )}
              <p>
                Bạn chọn: <JapaneseAnnotatedText text={r.given || '(Chưa trả lời)'} />
              </p>
              <p>
                Đáp án: <JapaneseAnnotatedText text={r.answer} />
              </p>
              <small>
                <JapaneseAnnotatedText text={r.explanation} />
              </small>
              {r.transcript && (
                <p className="jlpt-passage" lang="ja">
                  {r.transcript}
                </p>
              )}
            </div>
          ))}
      </Modal>
    </>
  );
}
export function TestSession() {
  const { id } = useParams();
  return id?.startsWith('jlpt-') ? <JlptSession key={id} /> : <LegacyTestSession key={id} />;
}
function LegacyTestSession() {
  const { id } = useParams();
  const client = useQueryClient();
  const notify = useUI((s) => s.notify);
  const setExamMode = useUI((s) => s.setExamMode);
  const [run, setRun] = useState<{
    runId: string;
    startedAt: string;
    questions: Question[];
  } | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{
    score: number;
    results: Result[];
    duration: number;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));
  const [confirmSubmit, setConfirmSubmit] = useState(false);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const enterFullscreen = async () => {
    try {
      if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
    } catch (err) {
      console.warn('Fullscreen request failed:', err);
    }
  };

  const exitFullscreen = async () => {
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.warn('Exit fullscreen failed:', err);
    }
  };

  const isExamActive = Boolean(run && !result);

  useEffect(() => {
    setExamMode(isExamActive);
    return () => {
      setExamMode(false);
      void exitFullscreen();
    };
  }, [isExamActive, setExamMode]);

  useEffect(() => {
    if (!isExamActive) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isExamActive]);

  useEffect(() => {
    if (!run || result) return;
    const timer = setInterval(
      () => setElapsed(Math.floor((Date.now() - new Date(run.startedAt).getTime()) / 1000)),
      1000,
    );
    return () => clearInterval(timer);
  }, [run, result]);
  const start = async () => {
    setBusy(true);
    setError('');
    void enterFullscreen();
    try {
      setRun(await post('/tests/' + id + '/start'));
      setAnswers({});
      setResult(null);
      setElapsed(0);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const submit = async () => {
    setBusy(true);
    try {
      setResult(await post('/tests/' + id + '/submit', { runId: run?.runId, answers }));
      void client.invalidateQueries({ queryKey: ['dashboard'] });
      void client.invalidateQueries({ queryKey: ['test-history'] });
      void exitFullscreen();
      setExamMode(false);
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      {!isExamActive && (
        <Link className="back-link" to="/tests">
          <ArrowLeft size={16} />
          Danh sách đề thi
        </Link>
      )}
      {isExamActive && (
        <header className="exam-sticky-bar" aria-label="Thanh công cụ bài thi">
          <div className="exam-sticky-left">
            <span className="exam-mode-badge">
              <ShieldAlert size={14} /> Chế độ làm bài
            </span>
            <strong>Bài luyện đề</strong>
            <span className="muted">· {Object.keys(answers).filter((k) => answers[k]).length}/{run?.questions.length || 0} câu đã trả lời</span>
          </div>
          <div className="exam-sticky-actions">
            <span className="timer">
              <Clock3 size={16} />
              {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}
            </span>
            <Button
              variant="ghost"
              size="small"
              onClick={isFullscreen ? exitFullscreen : enterFullscreen}
              title={isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình (Ẩn thanh tab Google)'}
            >
              {isFullscreen ? <Minimize size={15} /> : <Maximize size={15} />}
              <span>{isFullscreen ? 'Thu nhỏ' : 'Ẩn tab Google'}</span>
            </Button>
            <Button
              variant="secondary"
              size="small"
              disabled={busy}
              onClick={() => setConfirmSubmit(true)}
              title="Dừng bài luyện đề và nộp bài ngay"
            >
              <CheckCircle size={15} />
              <span>Nộp bài ngay</span>
            </Button>
          </div>
        </header>
      )}
      {isExamActive && !isFullscreen && (
        <aside className="exam-fullscreen-prompt" role="alert">
          <span>
            💡 Hãy bật chế độ toàn màn hình để ẩn thanh tab Google Chrome, tập trung tối đa cho bài làm.
          </span>
          <Button size="small" variant="secondary" onClick={() => void enterFullscreen()}>
            <Maximize size={14} /> Ẩn thanh tab Google
          </Button>
        </aside>
      )}
      <PageHeader
        eyebrow="TẬP TRUNG MỘT CHÚT"
        title={result ? 'Bạn đã hoàn thành.' : 'Sẵn sàng thử sức?'}
        description={
          run
            ? `${Object.keys(answers).filter((k) => answers[k]).length}/${run.questions.length} câu đã trả lời`
            : 'Bài làm được tính giờ từ khi bắt đầu. Kết quả chỉ được lưu khi bạn nộp bài.'
        }
        action={
          run && (
            <span className="timer">
              <Clock3 size={17} />
              {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}
            </span>
          )
        }
      />
      {error && (
        <p className="error-text" role="alert">
          {error}
        </p>
      )}
      {!run ? (
        <Empty title="Sẵn sàng luyện đề">
          <p>Đọc kỹ từng câu và chọn đáp án bạn tin là đúng.</p>
          <Button disabled={busy} onClick={() => void start()}>
            {busy ? 'Đang chuẩn bị…' : 'Bắt đầu bài kiểm tra'}
            <ArrowRight size={16} />
          </Button>
        </Empty>
      ) : result ? (
        <>
          <section className="score-panel">
            <span className="eyebrow">KẾT QUẢ CỦA BẠN</span>
            <strong>
              {result.score}
              <small>%</small>
            </strong>
            <p>
              {result.results.filter((r) => r.correct).length}/{result.results.length} câu đúng ·{' '}
              {result.duration} giây
            </p>
            <p>
              {result.score >= 80
                ? 'Bạn đang nắm khá vững kiến thức này.'
                : 'Xem lại các câu dưới đây để hiểu rõ hơn nhé.'}
            </p>
            <Button variant="secondary" onClick={() => void start()}>
              <RotateCcw size={16} />
              Thử lại
            </Button>
          </section>
          {result.results.map((r, i) => (
            <div
              className={'feedback result-card ' + (r.correct ? 'correct' : 'incorrect')}
              key={r.id}
            >
              <h3>
                {i + 1}. <JapaneseAnnotatedText text={r.prompt} />
              </h3>
              <p>
                Bạn trả lời: <JapaneseAnnotatedText text={r.given || '(Chưa trả lời)'} />
              </p>
              <p>
                <strong>
                  Đáp án: <JapaneseAnnotatedText text={r.answer} />
                </strong>
              </p>
              <p>
                <JapaneseAnnotatedText text={r.explanation} />
              </p>
            </div>
          ))}
        </>
      ) : (
        <>
          <section className="panel">
            {run.questions.map((q, i) => (
              <div className="exercise" key={q.id}>
                <h3>
                  {i + 1}.{' '}
                  <JapaneseAnnotatedText
                    text={q.prompt}
                    disabled={q.annotationDisabled}
                    readings={q.readings}
                  />
                </h3>
                <QuestionInput
                  question={q}
                  value={answers[q.id] || ''}
                  onChange={(value) => setAnswers({ ...answers, [q.id]: value })}
                  disabled={busy}
                />
              </div>
            ))}
          </section>
          <div className="submit-test">
            <p>Câu bỏ trống sẽ được tính là chưa đúng.</p>
            <Button disabled={busy} onClick={() => setConfirmSubmit(true)}>
              Nộp bài
              <Check size={17} />
            </Button>
          </div>
        </>
      )}
      <Modal open={confirmSubmit} onOpenChange={setConfirmSubmit} title="Dừng bài luyện đề & nộp ngay?">
        <p>
          Bạn có chắc chắn muốn dừng bài luyện đề và nộp bài ngay bây giờ không? Còn {run ? run.questions.length - Object.keys(answers).filter((k) => answers[k]).length : 0} câu chưa trả lời. Các câu bỏ trống sẽ được tính là chưa đúng.
        </p>
        <div className="inline-actions">
          <Button variant="secondary" disabled={busy} onClick={() => setConfirmSubmit(false)}>
            Tiếp tục làm bài
          </Button>
          <Button
            disabled={busy}
            onClick={() => {
              setConfirmSubmit(false);
              void submit();
            }}
          >
            Xác nhận nộp bài ngay
          </Button>
        </div>
      </Modal>
    </>
  );
}
