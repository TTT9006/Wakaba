import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  XCircle,
  Layers,
  BookOpen,
  Check,
  X,
} from 'lucide-react';
import { api, post } from '../services/api';
import { PageHeader, Loading, ErrorState, Empty, Button } from '../components/ui';
import { ReviewCardInteractive } from '../components/review-card-interactive';
import { GrammarExercise } from './grammar';
import { useAnnotationMode } from '../components/japanese-annotated-text';
import type { ConsolidatedReviewQueue } from '../types';

type ResultLog = {
  type: 'card' | 'grammar';
  id: string;
  title: string;
  sub: string;
  correct: boolean;
};

export function ConsolidatedReview() {
  const annotationMode = useAnnotationMode();
  const [params, setParams] = useSearchParams();
  const modeParam = params.get('mode');
  const isDueOnly = modeParam === 'due';
  const [round, setRound] = useState(0);

  const client = useQueryClient();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cardFlipped, setCardFlipped] = useState(false);
  const [grammarAnswered, setGrammarAnswered] = useState(false);
  const [grammarLastCorrect, setGrammarLastCorrect] = useState(false);
  const [results, setResults] = useState<ResultLog[]>([]);

  const queryKey = ['consolidated-review-queue', isDueOnly ? 'due' : 'all', round];
  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: () =>
      api<ConsolidatedReviewQueue>(
        `/review/consolidated?mode=${isDueOnly ? 'due' : 'all'}&limit=20`,
      ),
    staleTime: 0,
    gcTime: 0,
    refetchOnWindowFocus: false,
  });

  const items = data?.items || [];
  const currentItem = items[currentIndex];
  const isFinished = items.length > 0 && currentIndex >= items.length;

  const cardMutation = useMutation({
    mutationFn: ({ cardId, rating }: { cardId: string; rating: number }) =>
      post('/flashcards/review', { cardId, rating, allowEarly: true }),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['dashboard'] });
      void client.invalidateQueries({ queryKey: ['decks'] });
      void client.invalidateQueries({ queryKey: ['leaderboard-current'] });
    },
  });

  const handleCardRate = (rating: number) => {
    if (!currentItem || currentItem.type !== 'card') return;
    const isRemembered = rating >= 2;
    cardMutation.mutate({ cardId: currentItem.card.id, rating });
    setResults((prev) => [
      ...prev,
      {
        type: 'card',
        id: currentItem.card.id,
        title: currentItem.card.japanese,
        sub: currentItem.card.reading,
        correct: isRemembered,
      },
    ]);
    setCardFlipped(false);
    setCurrentIndex((prev) => prev + 1);
  };

  const handleGrammarNext = () => {
    if (!currentItem || currentItem.type !== 'grammar') return;
    setResults((prev) => [
      ...prev,
      {
        type: 'grammar',
        id: currentItem.id,
        title: currentItem.pattern,
        sub: currentItem.title,
        correct: grammarLastCorrect,
      },
    ]);
    setGrammarAnswered(false);
    setGrammarLastCorrect(false);
    setCurrentIndex((prev) => prev + 1);
  };

  const switchMode = (newMode: 'all' | 'due') => {
    const next = new URLSearchParams(params);
    if (newMode === 'due') {
      next.set('mode', 'due');
    } else {
      next.delete('mode');
    }
    setParams(next);
    setCurrentIndex(0);
    setResults([]);
    setCardFlipped(false);
    setGrammarAnswered(false);
    setRound((r) => r + 1);
  };

  const restart = () => {
    setCurrentIndex(0);
    setResults([]);
    setCardFlipped(false);
    setGrammarAnswered(false);
    setRound((r) => r + 1);
  };

  // Stats calculation
  const cardResults = results.filter((r) => r.type === 'card');
  const grammarResults = results.filter((r) => r.type === 'grammar');
  const cardsRemembered = cardResults.filter((r) => r.correct).length;
  const grammarCorrect = grammarResults.filter((r) => r.correct).length;
  const overallCorrect = cardsRemembered + grammarCorrect;
  const overallTotal = results.length;
  const accuracyPct = overallTotal ? Math.round((overallCorrect / overallTotal) * 100) : 0;

  return (
    <div className="consolidated-page">
      <Link className="back-link" to="/dashboard">
        <ArrowLeft size={16} />
        Về trang tổng quan
      </Link>

      <div className="review-mode-tabs" role="tablist" aria-label="Chế độ ôn tập tổng hợp">
        <button
          type="button"
          role="tab"
          aria-selected={!isDueOnly}
          className={`review-mode-tab ${!isDueOnly ? 'active' : ''}`}
          onClick={() => switchMode('all')}
        >
          <Sparkles size={15} />
          Tất cả đã ôn (Tự do)
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={isDueOnly}
          className={`review-mode-tab ${isDueOnly ? 'active' : ''}`}
          onClick={() => switchMode('due')}
        >
          <RotateCcw size={15} />
          Mục đến hạn
        </button>
      </div>

      <PageHeader
        eyebrow={
          isDueOnly ? 'HÀNG ĐỢI ĐẾN HẠN · THEO THUẬT TOÁN SRS' : 'ÔN TẬP TỔNG HỢP · ĐAN XEN KIẾN THỨC'
        }
        title="Củng cố từ vựng & ngữ pháp."
        description={
          isDueOnly
            ? 'Ôn các thẻ từ vựng và câu ngữ pháp đang đến hạn để chuyển vào trí nhớ dài hạn.'
            : 'Luyện tập ngẫu nhiên giữa thẻ từ vựng và câu ngữ pháp đã học để tăng phản xạ ngôn ngữ.'
        }
      />

      {isLoading ? (
        <Loading />
      ) : error ? (
        <ErrorState error={error} />
      ) : isFinished ? (
        <section className="panel completion-panel">
          <div className="completion-hero">
            <span className="completion-badge">
              <CheckCircle2 size={32} />
            </span>
            <h2>Hoàn thành lượt ôn tập tổng hợp!</h2>
            <p>Bạn đã hoàn thành toàn bộ {overallTotal} mục trong phiên ôn này.</p>
          </div>

          <div className="completion-stats-grid">
            <div className="c-result-box">
              <span className="box-label">Độ chính xác chung</span>
              <strong>{accuracyPct}%</strong>
              <small>{overallCorrect} / {overallTotal} mục đạt yêu cầu</small>
            </div>
            <div className="c-result-box">
              <span className="box-label">
                <Layers size={14} /> Thẻ từ vựng
              </span>
              <strong>
                {cardsRemembered} / {cardResults.length}
              </strong>
              <small>
                {cardResults.length
                  ? `${Math.round((cardsRemembered / cardResults.length) * 100)}% đã nhớ`
                  : 'Không có thẻ'}
              </small>
            </div>
            <div className="c-result-box">
              <span className="box-label">
                <BookOpen size={14} /> Bài tập ngữ pháp
              </span>
              <strong>
                {grammarCorrect} / {grammarResults.length}
              </strong>
              <small>
                {grammarResults.length
                  ? `${Math.round((grammarCorrect / grammarResults.length) * 100)}% trả lời đúng`
                  : 'Không có câu hỏi'}
              </small>
            </div>
          </div>

          <div className="completion-log-section">
            <h3>Chi tiết lượt ôn</h3>
            <div className="completion-log-table">
              {results.map((r, idx) => (
                <div className="log-row" key={`${r.id}-${idx}`}>
                  <span className={`mixed-type-tag ${r.type}`}>
                    {r.type === 'card' ? 'Từ vựng' : 'Ngữ pháp'}
                  </span>
                  <div className="log-text">
                    <strong lang="ja">{r.title}</strong>
                    <small>{r.sub}</small>
                  </div>
                  <span className={`log-badge ${r.correct ? 'pass' : 'fail'}`}>
                    {r.correct ? (
                      <>
                        <CheckCircle2 size={13} />
                        {r.type === 'card' ? 'Đã nhớ' : 'Chính xác'}
                      </>
                    ) : (
                      <>
                        <XCircle size={13} />
                        {r.type === 'card' ? 'Cần ôn lại' : 'Chưa đúng'}
                      </>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="inline-actions" style={{ justifyContent: 'center', gap: '12px', marginTop: '24px', flexWrap: 'wrap' }}>
            <Button onClick={restart}>
              <RotateCcw size={16} />
              Ôn lượt mới
            </Button>
            <Link className="button secondary" to="/dashboard">
              Về trang tổng quan
            </Link>
            <Link className="button secondary" to="/flashcards">
              Bộ thẻ từ vựng
            </Link>
            <Link className="button secondary" to="/grammar">
              Lộ trình ngữ pháp
            </Link>
          </div>
        </section>
      ) : currentItem ? (
        <div className="consolidated-session">
          <div className="review-progress-wrap">
            <div className="review-progress-header">
              <span className={`mixed-type-tag ${currentItem.type}`}>
                {currentItem.type === 'card'
                  ? 'Thẻ từ vựng'
                  : `Ngữ pháp · ${currentItem.level}`}
              </span>
              <strong>
                Mục {currentIndex + 1} / {items.length}
              </strong>
            </div>
            <progress
              max={items.length}
              value={currentIndex + (grammarAnswered ? 1 : 0)}
              aria-label="Tiến độ lượt ôn tập tổng hợp"
            />
          </div>

          {currentItem.type === 'card' ? (
            <div className="card-item-container">
              <ReviewCardInteractive
                card={currentItem.card}
                flipped={cardFlipped}
                onFlip={() => setCardFlipped(!cardFlipped)}
                onSwipe={(dir) => handleCardRate(dir === 'left' ? 0 : 2)}
                mode={annotationMode}
                eyebrowFront="ÔN TẬP TỔNG HỢP · TỪ VỰNG"
                eyebrowBack="ĐÁP ÁN TỪ VỰNG"
              />
              <div className="review-card-controls">
                <Button className="flip-button" onClick={() => setCardFlipped(!cardFlipped)}>
                  <RotateCcw size={16} />
                  <span>{cardFlipped ? 'Lật lại mặt trước' : 'Lật thẻ xem đáp án'}</span>
                </Button>
              </div>
              <div className="review-swipe-guide" aria-label="Hướng dẫn vuốt thẻ">
                <span className="guide-item guide-forgot">
                  <ArrowLeft size={16} aria-hidden="true" />
                  <span>Vuốt trái: <strong>Quên</strong></span>
                </span>
                <span className="guide-dot" aria-hidden="true">•</span>
                <span className="guide-item guide-remember">
                  <span>Vuốt phải: <strong>Nhớ</strong></span>
                  <ArrowRight size={16} aria-hidden="true" />
                </span>
              </div>
              <p className="review-footnote">
                Kéo thẻ sang trái nếu Quên, sang phải nếu Nhớ · Lịch SRS sẽ tự động cập nhật ngay.
              </p>
            </div>
          ) : (
            <div className="panel grammar-item-container">
              <div className="grammar-card-header">
                <div>
                  <span className="eyebrow">{currentItem.level} · BÀI TẬP CỦNG CỐ</span>
                  <h2>{currentItem.title}</h2>
                  <p lang="ja" className="pattern-badge">{currentItem.pattern}</p>
                </div>
                <Link
                  to={`/grammar/${currentItem.grammarId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="lesson-ref-link"
                >
                  Xem bài học ↗
                </Link>
              </div>

              <GrammarExercise
                key={currentItem.grammarId + currentItem.question.id}
                question={currentItem.question}
                grammarId={currentItem.grammarId}
                onAnswered={(correct) => {
                  setGrammarAnswered(true);
                  setGrammarLastCorrect(correct);
                }}
              />

              <div className="inline-actions" style={{ marginTop: '20px', justifyContent: 'flex-end' }}>
                <Button
                  disabled={!grammarAnswered}
                  onClick={handleGrammarNext}
                >
                  {currentIndex + 1 === items.length
                    ? 'Xem kết quả tổng hợp'
                    : 'Mục tiếp theo'}
                  <ArrowRight size={16} />
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <Empty
          title={
            isDueOnly
              ? 'Không có mục nào đang đến hạn ôn tập.'
              : 'Chưa có từ vựng hoặc câu ngữ pháp để ôn.'
          }
        >
          <p>
            {isDueOnly
              ? 'Bạn đã hoàn thành các mục đến hạn. Bạn có thể chọn chế độ "Tất cả đã ôn" để ôn lại bất cứ lúc nào!'
              : 'Hãy bắt đầu học từ vựng trong bộ thẻ hoặc hoàn thành các bài học ngữ pháp để làm phong phú kho ôn tập.'}
          </p>
          <div className="inline-actions" style={{ justifyContent: 'center', gap: '10px', marginTop: '16px', flexWrap: 'wrap' }}>
            {isDueOnly && (
              <Button onClick={() => switchMode('all')}>
                <Sparkles size={16} />
                Ôn lại tự do tất cả mục
              </Button>
            )}
            <Link className="button secondary" to="/flashcards">
              Xem bộ thẻ từ vựng
            </Link>
            <Link className="button secondary" to="/grammar">
              Học ngữ pháp
            </Link>
          </div>
        </Empty>
      )}
    </div>
  );
}
