import { useState } from 'react';
import { Brand } from '../components/brand';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowRight, Check, Layers, Leaf, Sun, CalendarCheck } from 'lucide-react';
import { useAnnotationMode } from '../components/japanese-annotated-text';
import { Button } from '../components/ui';
import { ReviewCardInteractive } from '../components/review-card-interactive';
import { api, post } from '../services/api';
import type { LoginReviewView } from '../../../../packages/shared/login-review';

export function LoginReview({
  initial,
  name,
  complete,
}: {
  initial: LoginReviewView;
  name: string;
  complete: () => void;
}) {
  const [state, setState] = useState(initial),
    [count, setCount] = useState(1),
    [flipped, setFlipped] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const mode = useAnnotationMode(),
    client = useQueryClient(),
    navigate = useNavigate();
  const choices = [
    ...new Set([1, Math.min(3, state.decks.length), Math.min(5, state.decks.length)]),
  ].filter((n) => n > 0);
  const selected = state.decks.slice(0, count),
    total = selected.reduce((n, d) => n + d.count, 0);
  async function send(path: string, body: unknown) {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      const next = await post<LoginReviewView>('/login-review/' + path, body);
      setState(next);
      setFlipped(false);
      for (const key of ['dashboard', 'decks', 'deck', 'review', 'leaderboard-current'])
        void client.invalidateQueries({ queryKey: [key] });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const card = state.card;
  return (
    <main className={'login-review-shell ' + (state.active ? 'is-studying' : 'is-welcome')}>
      <div className="login-review-frame">
        <header className="login-review-top">
          <span className="brand">
            <Brand />
          </span>
          <div className="login-review-top-actions">
            <span className="login-review-day">
              <Sun size={18} aria-hidden="true" />
              Ôn tập đầu ngày
            </span>
            <Button
              variant="ghost"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                try {
                  await post('/auth/logout');
                  client.clear();
                  navigate('/login');
                } catch (e) {
                  setError((e as Error).message);
                  setBusy(false);
                }
              }}
            >
              Đăng xuất
            </Button>
          </div>
        </header>
        <section className="login-review-content">
          {state.ready ? (
            <div className="login-review-check">
              <Check size={44} strokeWidth={2.5} aria-hidden="true" />
            </div>
          ) : (
            <span className="eyebrow">GẶP LẠI ĐỂ NHỚ LÂU</span>
          )}
          <h1>
            {state.ready
              ? 'Bạn đã ôn xong!'
              : state.active
                ? 'Một chút ôn tập, mỗi ngày.'
                : 'Ôn một chút trước khi học tiếp'}
          </h1>
          {error && (
            <div className="feedback incorrect" role="alert">
              <p>{error}</p>
              <Button
                variant="secondary"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    setState(await api<LoginReviewView>('/login-review'));
                    setFlipped(false);
                    setError('');
                  } catch (e) {
                    setError((e as Error).message);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                Tải lại lượt ôn đã lưu
              </Button>
            </div>
          )}
          {state.ready ? (
            <section className="login-review-finish">
              <p>Lượt ôn của bạn đã được lưu. Hẹn gặp lại ở lần ôn tiếp theo.</p>
              <div className="login-review-stats">
                <div>
                  <Layers size={21} aria-hidden="true" />
                  <strong>{state.done} thẻ</strong>
                  <span>đã hoàn thành</span>
                </div>
                <div>
                  <Check size={21} aria-hidden="true" />
                  <strong>{state.decks.length} bộ</strong>
                  <span>trong lượt này</span>
                </div>
                <div>
                  <CalendarCheck size={21} aria-hidden="true" />
                  <strong>Lịch ôn</strong>
                  <span>đã cập nhật</span>
                </div>
              </div>
              <Button className="login-review-cta" onClick={complete}>
                Vào góc học tập
                <ArrowRight size={19} aria-hidden="true" />
              </Button>
              <div className="login-review-next">
                <span className="login-review-next-icon">
                  <Leaf size={25} aria-hidden="true" />
                </span>
                <div>
                  <h2>Tiếp tục hành trình của bạn</h2>
                  <p>
                    Học ngữ pháp, khám phá từ mới hoặc luyện viết. Các bộ còn lại vẫn được giữ trong
                    lịch ôn.
                  </p>
                </div>
              </div>
            </section>
          ) : !state.active ? (
            <>
              <p className="login-review-greeting">
                Chào {name}, dành một chút thời gian cho những điều đã học nhé.
              </p>
              <p className="login-review-overview">
                {state.decks.length} bộ đến hạn <span aria-hidden="true">·</span> {total} thẻ được
                chọn <span aria-hidden="true">·</span> Khoảng {Math.max(1, Math.ceil(total / 4))}{' '}
                phút
              </p>
              <fieldset className="login-review-choices">
                <legend>Bạn muốn ôn bao nhiêu bộ?</legend>
                {choices.map((n) => (
                  <Button
                    key={n}
                    variant={count === n ? 'primary' : 'secondary'}
                    aria-pressed={count === n}
                    disabled={busy}
                    onClick={() => setCount(n)}
                  >
                    {n} bộ
                  </Button>
                ))}
              </fieldset>
              <div className="login-review-decks">
                {selected.map((d, i) => (
                  <article className="panel" key={d.id}>
                    <span className={'login-review-deck-icon tone-' + (i % 3)} aria-hidden="true">
                      {/hiragana/i.test(d.name)
                        ? 'あ'
                        : /katakana/i.test(d.name)
                          ? 'ア'
                          : /kanji/i.test(d.name)
                            ? '日'
                            : '語'}
                    </span>
                    <div className="login-review-deck-info">
                      <h2>{d.name}</h2>
                      <p>{d.count} thẻ đến hạn</p>
                      <small>Đến hạn từ {new Date(d.due).toLocaleDateString('vi-VN')}</small>
                    </div>
                    <span className="login-review-deck-order" aria-label={'Ưu tiên ' + (i + 1)}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </article>
                ))}
              </div>
              <p className="login-review-summary">
                Chỉ ôn những thẻ đến hạn, không cần ôn lại cả bộ.
              </p>
              <Button
                className="login-review-cta"
                disabled={busy}
                onClick={() => void send('start', { count })}
              >
                {busy ? 'Đang chuẩn bị…' : `Bắt đầu ôn ${count} bộ`}
                <ArrowRight size={19} aria-hidden="true" />
              </Button>
              <p className="muted">
                Ôn đủ số bộ đã chọn là có thể dùng web bình thường. Các bộ sẽ được nhắc lại khi đến
                hạn mới.
              </p>
            </>
          ) : card ? (
            <>
              <p className="login-review-deck-title">{card.deckName}</p>
              <div className="review-progress-wrap">
                <div className="review-progress-header">
                  <span role="status">
                    {state.done}/{state.total} thẻ đã hoàn thành
                  </span>
                  <strong>{Math.round((state.done / (state.total || 1)) * 100)}%</strong>
                </div>
                <progress aria-label="Tiến độ lượt ôn" max={state.total || 1} value={state.done} />
              </div>
              <div className="review-session">
                <ReviewCardInteractive
                  card={card}
                  flipped={flipped}
                  onFlip={() => setFlipped(!flipped)}
                  onSwipe={(dir) => {
                    void send('answer', { cardId: card.id, rating: dir === 'left' ? 0 : 2 });
                  }}
                  mode={mode}
                  eyebrowFront="BẠN CÒN NHỚ KHÔNG?"
                  eyebrowBack="ĐÁP ÁN"
                />
                {!flipped ? (
                  <Button disabled={busy} className="flip-button" onClick={() => setFlipped(true)}>
                    Lật thẻ
                  </Button>
                ) : (
                  <div className="rating-buttons">
                    {['Quên', 'Khó', 'Nhớ', 'Dễ'].map((label, rating) => (
                      <Button
                        key={label}
                        disabled={busy}
                        variant="secondary"
                        onClick={() => void send('answer', { cardId: card.id, rating })}
                      >
                        <strong>{label}</strong>
                        <small>
                          {rating === 0 ? 'Nhắc lại sau 10 phút' : 'Điều chỉnh lịch ôn'}
                        </small>
                      </Button>
                    ))}
                  </div>
                )}
              </div>
              <p className="muted">
                Tiến độ lưu theo tài khoản sau mỗi lần đánh giá. Có thể tiếp tục trên thiết bị khác.
              </p>
            </>
          ) : null}
        </section>
        <footer className="login-review-footer">
          <Leaf size={18} aria-hidden="true" />
          <span>Một chút mỗi ngày giúp nhớ lâu hơn.</span>
          {!state.ready && (
            <Button
              className="login-review-defer"
              variant="ghost"
              disabled={busy}
              onClick={async () => {
                if (busy) return;
                setBusy(true);
                setError('');
                try {
                  await post('/login-review/defer');
                  complete();
                } catch (e) {
                  setError((e as Error).message);
                } finally {
                  setBusy(false);
                }
              }}
            >
              Ôn tập vào lần sau
            </Button>
          )}
        </footer>
      </div>
    </main>
  );
}
