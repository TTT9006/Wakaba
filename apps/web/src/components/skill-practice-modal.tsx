import { useState, useRef, useEffect, useMemo } from 'react';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Headphones,
  BookOpen,
  Check,
  ArrowRight,
  ArrowLeft,
  BookmarkPlus,
  Sparkles,
} from 'lucide-react';
import { Button, Modal } from './ui';
import { JapaneseAnnotatedText } from './japanese-annotated-text';
import { api, post } from '../services/api';
import { useUI } from '../stores/ui';
import {
  type SkillExerciseSet,
  type SkillQuestion,
  shuffleQuestionOptions,
} from '../../../../packages/shared/jlpt-skills';
import type { JlptLevel, SkillType } from '../../../../packages/shared/jlpt-types';

interface SkillPracticeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  set: SkillExerciseSet | null;
  onComplete?: () => void;
}

export function SkillPracticeModal({
  open,
  onOpenChange,
  set,
  onComplete,
}: SkillPracticeModalProps) {
  const notify = useUI((s) => s.notify);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<{
    score: number;
    total: number;
    correctCount: number;
    results: any[];
    failedVocab: Array<{ term: string; reading: string; meaning: string; questionId: string }>;
  } | null>(null);

  const [isAddingFlashcards, setIsAddingFlashcards] = useState(false);
  const [flashcardsAdded, setFlashcardsAdded] = useState(false);

  // Audio player state for listening questions
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Practice session key: changes each time user opens the modal or chooses a set, triggering fresh option shuffling
  const [sessionKey, setSessionKey] = useState(0);
  const [lastOpen, setLastOpen] = useState(false);
  const [lastSetId, setLastSetId] = useState<string | null>(null);

  // Synchronously reset state & trigger fresh shuffle when modal opens or set changes
  if (open && (!lastOpen || lastSetId !== (set?.id ?? null))) {
    setLastOpen(true);
    setLastSetId(set?.id ?? null);
    setSessionKey((k) => k + 1);
    setIndex(0);
    setAnswers({});
    setResults(null);
    setFlashcardsAdded(false);
  } else if (!open && lastOpen) {
    setLastOpen(false);
  }

  // Audio time update
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.playbackRate = playbackRate;
    }
  }, [index, set?.id]);

  // Questions with freshly shuffled options per practice session
  const questions = useMemo(() => {
    if (!set) return [];
    return shuffleQuestionOptions(set.questions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [set?.id, sessionKey]);

  if (!set || questions.length === 0) return null;

  const currentQ = questions[index] || questions[0];
  const currentAudioUrl =
    currentQ.audioUrl ||
    (currentQ.transcript ? `/api/tts?text=${encodeURIComponent(currentQ.transcript)}` : undefined);
  const answeredCount = Object.keys(answers).filter((k) => answers[k]).length;
  const isFinished = results !== null;

  const handleSelectOption = (opt: string) => {
    if (isFinished) return;
    setAnswers((prev) => ({ ...prev, [currentQ.id]: opt }));
  };

  const handleSpeedChange = (rate: number) => {
    setPlaybackRate(rate);
    if (audioRef.current) {
      audioRef.current.playbackRate = rate;
    }
  };

  const togglePlayAudio = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((e) => console.error('Audio play error:', e));
    }
  };

  const handleReplayAudio = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current
      .play()
      .then(() => setIsPlaying(true))
      .catch((e) => console.error('Audio play error:', e));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      let res: {
        score: number;
        total: number;
        correctCount: number;
        results: any[];
        failedVocab: Array<{ term: string; reading: string; meaning: string; questionId: string }>;
      };

      try {
        res = await post<{
          score: number;
          total: number;
          correctCount: number;
          results: any[];
          failedVocab: Array<{
            term: string;
            reading: string;
            meaning: string;
            questionId: string;
          }>;
        }>('/jlpt/skills/submit', {
          setId: set.id,
          skill: set.skill,
          level: set.level,
          answers,
        });
      } catch (submitErr) {
        console.warn(
          'Backend /jlpt/skills/submit chưa sẵn sàng, tính điểm trực tiếp client-side:',
          submitErr,
        );
        const resultsList = questions.map((q) => {
          const given = answers[q.id] || '';
          const correct = given === q.answer;
          return {
            ...q,
            given,
            correct,
          };
        });
        const correctCount = resultsList.filter((r) => r.correct).length;
        const score = Math.round((correctCount / resultsList.length) * 100);

        const failedVocab = resultsList
          .filter((r) => !r.correct && (r.term || r.category === 'vocabulary'))
          .map((r) => ({
            term: r.term || r.prompt.replace(/.*「(.*?)」.*/, '$1') || r.answer,
            reading: r.reading || r.answer,
            meaning: r.meaning || r.explanation,
            questionId: r.id,
          }));

        res = {
          score,
          total: resultsList.length,
          correctCount,
          results: resultsList,
          failedVocab,
        };
      }

      setResults(res);
      if (onComplete) onComplete();
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddFailedToFlashcards = async () => {
    if (!results?.failedVocab?.length || isAddingFlashcards || flashcardsAdded) return;
    setIsAddingFlashcards(true);
    try {
      // Find or create a deck for this level's missed words
      const decks = await api<Array<{ id: string; name: string }>>('/flashcards/decks');
      const targetDeckName = `Từ vựng JLPT ${set.level} cần ôn`;
      let deck = decks.find((d) => d.name === targetDeckName);

      if (!deck) {
        deck = await post<{ id: string; name: string }>('/flashcards/decks', {
          name: targetDeckName,
          description: `Bộ thẻ tự động lưu các câu làm sai từ phần Luyện kỹ năng JLPT ${set.level}.`,
        });
      }

      // Add each failed card to the deck
      for (const item of results.failedVocab) {
        await post('/flashcards/cards', {
          deckId: deck.id,
          japanese: item.term,
          reading: item.reading || item.term,
          meaning: item.meaning || 'Từ vựng cần ôn tập',
          note: `Luyện kỹ năng JLPT ${set.level} · Thuật toán SM-2`,
          english: '',
          example: '',
        });
      }

      setFlashcardsAdded(true);
      notify(`Đã thêm thành công ${results.failedVocab.length} từ vào bộ thẻ "${targetDeckName}"!`);
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setIsAddingFlashcards(false);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={set.title}
      className="import-dialog-large skill-modal-dialog"
    >
      <div className="skill-session-container">
        {/* Set Header Badges */}
        <div className="skill-session-header">
          <div className="skill-session-tags">
            <span className="level-pill" style={{ padding: '2px 8px', fontSize: '11px' }}>
              JLPT {set.level}
            </span>
            {set.book && (
              <span className="tag" style={{ fontSize: '11px', color: 'var(--ocean)' }}>
                <BookOpen size={12} /> {set.book}
              </span>
            )}
            <span
              className="tag"
              style={{
                fontSize: '11px',
                color: set.syncStatus === 'khớp tự động' ? 'var(--jade)' : 'var(--muted)',
                borderColor: set.syncStatus === 'khớp tự động' ? 'var(--jade)' : 'var(--line)',
              }}
            >
              Trạng thái: {set.syncStatus}
            </span>
          </div>

          <div className="skill-session-progress">
            {!isFinished ? (
              <span>
                Câu {index + 1} / {questions.length} (Đã làm {answeredCount})
              </span>
            ) : (
              <span className="positive font-bold">
                Hoàn thành · Kết quả: {results.score}% ({results.correctCount}/{results.total})
              </span>
            )}
          </div>
        </div>

        {/* RESULTS SCREEN */}
        {isFinished ? (
          <div className="skill-results-view">
            <section className="score-panel" style={{ marginBlock: '16px' }}>
              <span className="eyebrow">KẾT QUẢ BÀI LUYỆN</span>
              <strong
                style={{
                  fontSize: '42px',
                  color: results.score >= 80 ? 'var(--jade)' : 'var(--peach)',
                }}
              >
                {results.score}
                <small style={{ fontSize: '20px' }}>%</small>
              </strong>
              <p>
                Đúng {results.correctCount}/{results.total} câu.
                {results.score >= 80
                  ? ' Bạn nắm rất vững kiến thức phần này!'
                  : ' Hãy xem lại các câu chưa đúng và giải thích chi tiết bên dưới nhé.'}
              </p>

              {/* VOCABULARY SM-2 INTEGRATION BANNER */}
              {results.failedVocab?.length > 0 && (
                <div
                  className="flashcard-sm2-promo-card"
                  style={{
                    backgroundColor: 'var(--surface-muted)',
                    border: '1.5px solid var(--jade)',
                    borderRadius: '10px',
                    padding: '14px 18px',
                    marginBlock: '14px',
                    textAlign: 'left',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '6px',
                    }}
                  >
                    <Sparkles size={18} style={{ color: 'var(--jade)' }} />
                    <strong style={{ fontSize: '14px' }}>
                      Lưu {results.failedVocab.length} từ làm sai vào Flashcard (SM-2)
                    </strong>
                  </div>
                  <p
                    style={{
                      fontSize: '13px',
                      margin: 0,
                      color: 'var(--muted)',
                      marginBottom: '10px',
                    }}
                  >
                    Tự động tạo thẻ học kèm phiên âm và giải nghĩa để ôn tập theo thuật toán ngắt
                    quãng SM-2, giúp ghi nhớ lâu bền.
                  </p>
                  <Button
                    size="small"
                    disabled={isAddingFlashcards || flashcardsAdded}
                    onClick={handleAddFailedToFlashcards}
                  >
                    <BookmarkPlus size={15} />
                    {flashcardsAdded
                      ? '✓ Đã lưu vào Flashcards'
                      : isAddingFlashcards
                        ? 'Đang lưu thẻ...'
                        : `Thêm ${results.failedVocab.length} từ vào Flashcard`}
                  </Button>
                </div>
              )}

              <div
                className="inline-actions"
                style={{ justifyContent: 'center', marginTop: '12px' }}
              >
                <Button
                  variant="secondary"
                  onClick={() => {
                    setSessionKey((k) => k + 1);
                    setResults(null);
                    setAnswers({});
                    setIndex(0);
                    setFlashcardsAdded(false);
                  }}
                >
                  <RotateCcw size={15} />
                  Luyện tập lại
                </Button>
                <Button onClick={() => onOpenChange(false)}>Hoàn tất</Button>
              </div>
            </section>

            {/* Detailed answers and explanations */}
            <div className="skill-review-list">
              <h3 style={{ fontSize: '16px', marginBlock: '16px 12px' }}>
                Chi tiết từng câu & Giải thích
              </h3>
              {results.results.map((r, i) => (
                <div
                  key={r.id}
                  className={`feedback ${r.correct ? 'correct' : 'incorrect'}`}
                  style={{ marginBottom: '12px', padding: '14px' }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '6px',
                    }}
                  >
                    {r.correct ? (
                      <CheckCircle2 size={18} style={{ color: 'var(--jade)' }} />
                    ) : (
                      <XCircle size={18} style={{ color: 'var(--peach)' }} />
                    )}
                    <strong>
                      Câu {i + 1}: {r.group} ·{' '}
                      {r.correct ? 'Đúng' : r.given ? 'Chưa đúng' : 'Bỏ trống'}
                    </strong>
                  </div>

                  {(r.audioUrl || r.transcript) && (
                    <div style={{ marginBlock: '8px' }}>
                      <audio
                        controls
                        preload="metadata"
                        src={r.audioUrl || `/api/tts?text=${encodeURIComponent(r.transcript)}`}
                        style={{ width: '100%', height: '36px' }}
                      />
                    </div>
                  )}

                  {r.passage && (
                    <div
                      className="jlpt-passage"
                      lang="ja"
                      style={{ marginBlock: '8px', fontSize: '13px' }}
                    >
                      <JapaneseAnnotatedText text={r.passage} />
                    </div>
                  )}

                  <p lang="ja" style={{ fontWeight: 500, marginBlock: '4px' }}>
                    <JapaneseAnnotatedText text={r.prompt} />
                  </p>

                  <div style={{ fontSize: '13px', marginBlock: '4px' }}>
                    <span>
                      Bạn chọn: <strong><JapaneseAnnotatedText text={r.given || '(Chưa làm)'} /></strong>
                    </span>
                    <span style={{ marginInline: '8px' }}>·</span>
                    <span>
                      Đáp án: <strong style={{ color: 'var(--jade)' }}><JapaneseAnnotatedText text={r.answer} /></strong>
                    </span>
                  </div>

                  {/* Revealed Script after submit */}
                  {r.transcript && (
                    <div
                      style={{
                        marginBlock: '8px',
                        padding: '8px 12px',
                        backgroundColor: 'var(--card)',
                        borderRadius: '6px',
                        borderLeft: '3px solid var(--ocean)',
                        fontSize: '13px',
                      }}
                    >
                      <span
                        className="eyebrow"
                        style={{ margin: 0, fontSize: '11px', color: 'var(--ocean)' }}
                      >
                        BẢN CHÉP LỜI (TRANSCRIPT)
                      </span>
                      <div lang="ja" style={{ whiteSpace: 'pre-line', margin: '4px 0 0 0' }}>
                        <JapaneseAnnotatedText text={r.transcript} />
                      </div>
                    </div>
                  )}

                  <p style={{ fontSize: '13px', color: 'var(--muted)', margin: '4px 0 0 0' }}>
                    💡 <em><JapaneseAnnotatedText text={r.explanation} /></em>
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* ACTIVE EXERCISE VIEW */
          <div className="skill-exercise-active">
            {/* Passage for reading or text grammar */}
            {currentQ.passage && (
              <div
                className="jlpt-passage"
                lang="ja"
                style={{
                  maxHeight: '220px',
                  overflowY: 'auto',
                  padding: '12px',
                  backgroundColor: 'var(--surface-muted)',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  lineHeight: '1.7',
                }}
              >
                <JapaneseAnnotatedText text={currentQ.passage} />
              </div>
            )}

            {/* Audio player for listening questions */}
            {currentAudioUrl && (
              <div
                className="skill-audio-box"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 14px',
                  backgroundColor: 'var(--surface-muted)',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  flexWrap: 'wrap',
                }}
              >
                <audio
                  ref={audioRef}
                  src={currentAudioUrl}
                  preload="metadata"
                  onTimeUpdate={() =>
                    audioRef.current && setCurrentTime(audioRef.current.currentTime)
                  }
                  onLoadedMetadata={() =>
                    audioRef.current && setDuration(audioRef.current.duration)
                  }
                  onEnded={() => setIsPlaying(false)}
                />
                <Button size="small" onClick={togglePlayAudio}>
                  {isPlaying ? <Pause size={15} /> : <Play size={15} />}
                  <span>
                    {isPlaying ? 'Tạm dừng' : currentTime > 0 ? 'Tiếp tục' : 'Phát bài nghe'}
                  </span>
                </Button>
                <Button
                  variant="secondary"
                  size="small"
                  onClick={handleReplayAudio}
                  title="Nghe lại từ đầu"
                >
                  <RotateCcw size={14} />
                  <span>Nghe lại</span>
                </Button>

                {/* Speed Toggle */}
                <div
                  className="speed-toggle-group"
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: 'auto' }}
                >
                  <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Tốc độ:</span>
                  {[0.8, 1.0, 1.2].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      className={`pill-btn ${playbackRate === rate ? 'active' : ''}`}
                      style={{
                        padding: '2px 8px',
                        fontSize: '11px',
                        borderRadius: '4px',
                        border: '1px solid var(--line)',
                        background: playbackRate === rate ? 'var(--jade)' : 'transparent',
                        color: playbackRate === rate ? '#fff' : 'inherit',
                        cursor: 'pointer',
                      }}
                      onClick={() => handleSpeedChange(rate)}
                    >
                      {rate}x
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Question Prompt */}
            <div className="skill-question-prompt" style={{ marginBottom: '16px' }}>
              <span className="eyebrow" style={{ marginBottom: '4px', display: 'block' }}>
                {currentQ.group} · CÂU {index + 1}/{questions.length}
              </span>
              <h2 lang="ja" style={{ fontSize: '18px', margin: 0 }}>
                <JapaneseAnnotatedText text={currentQ.prompt} />
              </h2>
            </div>

            {/* Options selection */}
            <div className="answer-options" role="radiogroup" style={{ marginBottom: '20px' }}>
              {currentQ.options.map((opt, optIdx) => {
                const isSelected = answers[currentQ.id] === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    className={isSelected ? 'selected' : ''}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '12px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                    onClick={() => handleSelectOption(opt)}
                  >
                    <span className="answer-key" style={{ width: '22px', textAlign: 'center' }}>
                      {String.fromCharCode(65 + optIdx)}
                    </span>
                    <span lang="ja" style={{ flex: 1, fontSize: '15px' }}>
                      <JapaneseAnnotatedText text={opt} />
                    </span>
                    {isSelected && <Check size={16} style={{ color: 'var(--jade)' }} />}
                  </button>
                );
              })}
            </div>

            {/* Navigation & Submit footer */}
            <div
              className="skill-session-footer"
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '16px',
                borderTop: '1px solid var(--line)',
                flexWrap: 'wrap',
                gap: '10px',
              }}
            >
              <div className="inline-actions">
                <Button disabled={isSubmitting || answeredCount === 0} onClick={handleSubmit}>
                  <Check size={16} />
                  {isSubmitting
                    ? 'Đang chấm điểm...'
                    : `Nộp bài (${answeredCount}/${questions.length})`}
                </Button>
              </div>

              <div className="inline-actions">
                <Button
                  variant="secondary"
                  size="small"
                  disabled={index === 0}
                  onClick={() => setIndex((i) => i - 1)}
                >
                  <ArrowLeft size={15} /> Câu trước
                </Button>
                <Button
                  variant="secondary"
                  size="small"
                  disabled={index === questions.length - 1}
                  onClick={() => setIndex((i) => i + 1)}
                >
                  Câu tiếp <ArrowRight size={15} />
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
