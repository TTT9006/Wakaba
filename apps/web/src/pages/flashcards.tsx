import { useState, useMemo } from 'react';
import { toRomaji } from 'wanakana';
import { JapaneseAnnotatedText, useAnnotationMode } from '../components/japanese-annotated-text';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Layers,
  Search,
  Pencil,
  Trash2,
  RotateCcw,
  Check,
  X,
  Upload,
} from 'lucide-react';
import { api, post, patch, remove } from '../services/api';
import { useUI } from '../stores/ui';
import type { Card, Deck } from '../types';
import { ReviewCardInteractive } from '../components/review-card-interactive';
import { DeckCoverArt } from '../components/deck-cover-art';
import { VocabularyImportModal } from '../components/vocabulary-import-modal';
import { DeckSelectionModal } from '../components/deck-selection-modal';
import {
  AudioButton,
  Button,
  Empty,
  ErrorState,
  Loading,
  Modal,
  PageHeader,
} from '../components/ui';

function shuffleCards<T>(cards: T[]): T[] {
  const result = [...cards];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
function DeckForm({ deck, close }: { deck?: Deck; close: () => void }) {
  const [name, setName] = useState(deck?.name || '');
  const [description, setDescription] = useState(deck?.description || '');
  const client = useQueryClient();
  const mutation = useMutation({
    mutationFn: () =>
      deck
        ? patch('/flashcards/decks/' + deck.id, { name, description })
        : post('/flashcards/decks', { name, description }),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['decks'] });
      void client.invalidateQueries({ queryKey: ['deck'] });
      close();
    },
  });
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate();
      }}
    >
      <label>
        Tên bộ thẻ
        <input
          required
          maxLength={80}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ví dụ: Một ngày ở Nhật"
        />
      </label>
      <label>
        Mô tả
        <textarea
          maxLength={300}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </label>
      {mutation.error && (
        <p role="alert" className="error-text">
          {mutation.error.message}
        </p>
      )}
      <Button disabled={mutation.isPending} type="submit">
        {mutation.isPending ? 'Đang lưu…' : 'Lưu bộ thẻ'}
        <Check size={16} />
      </Button>
    </form>
  );
}
export function Flashcards() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['decks'],
    queryFn: () => api<Deck[]>('/flashcards/decks'),
  });
  const navigate = useNavigate();
  const [create, setCreate] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [freeReviewSelectOpen, setFreeReviewSelectOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const matching = (data || []).filter((deck) =>
    `${deck.name} ${deck.description}`
      .toLocaleLowerCase('vi')
      .includes(query.trim().toLocaleLowerCase('vi')),
  );
  const pages = Math.max(1, Math.ceil(matching.length / 12));
  const currentPage = Math.min(page, pages);
  const due =
    data?.flatMap((d) => d.cards).filter((c) => new Date(c.due) <= new Date()).length || 0;
  return (
    <>
      <PageHeader
        eyebrow="TỪ VỰNG CỦA BẠN"
        title="Gặp lại để nhớ lâu hơn."
        description="Tạo bộ thẻ của riêng bạn hoặc nhập nhanh từ file PDF, PowerPoint."
        action={
          <div className="inline-actions" style={{ gap: '8px', flexWrap: 'wrap' }}>
            <Button variant="secondary" onClick={() => setImportOpen(true)}>
              <Upload size={16} />
              Import PowerPoint / PDF
            </Button>
            <Button onClick={() => setCreate(true)}>
              <Plus size={17} />
              Tạo bộ thẻ
            </Button>
          </div>
        }
      />
      <section className="review-banner">
        <div>
          <span className="eyebrow">SẴN SÀNG CHO MỘT LƯỢT ÔN?</span>
          <h2>{due > 0 ? `${due} từ đang chờ bạn` : 'Không có thẻ đến hạn'}</h2>
          <p>
            {due > 0
              ? 'Lịch ôn tự điều chỉnh theo mức độ ghi nhớ của bạn.'
              : 'Bạn đã hoàn thành các thẻ đến hạn. Bạn có thể ôn lại bất cứ lúc nào!'}
          </p>
        </div>
        <div className="inline-actions" style={{ gap: '10px', flexWrap: 'wrap' }}>
          {due > 0 && (
            <Link className="button primary" to="/flashcards/review">
              Ôn thẻ đến hạn
              <ArrowRight size={17} />
            </Link>
          )}
          <Link
            className={`button ${due > 0 ? 'secondary' : 'primary'}`}
            to="/flashcards/review?mode=all"
          >
            <RotateCcw size={16} />
            Ôn lại tự do
          </Link>
          <Button
            variant="secondary"
            onClick={() => setFreeReviewSelectOpen(true)}
            title="Chọn các bộ muốn ôn cùng lúc khi ôn tự do"
          >
            <Layers size={16} />
            Chọn các bộ muốn ôn
          </Button>
        </div>
      </section>
      <div className="section-heading spaced">
        <h2>Các bộ thẻ của bạn</h2>
        <span className="muted">{data?.length || 0} bộ thẻ</span>
      </div>
      <div className="toolbar deck-toolbar">
        <label className="input-icon">
          <Search size={17} aria-hidden="true" />
          <input
            aria-label="Tìm bộ thẻ"
            placeholder="Tìm theo tên hoặc mô tả…"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
          />
        </label>
        <span className="muted" role="status">
          {matching.length} bộ thẻ phù hợp
        </span>
      </div>
      {isLoading ? (
        <Loading />
      ) : error ? (
        <ErrorState error={error} />
      ) : matching.length ? (
        <div className="deck-grid">
          {matching.slice((currentPage - 1) * 12, currentPage * 12).map((deck, index) => {
            const i = (currentPage - 1) * 12 + index;
            const learned = deck.cards.filter((c) => c.repetitions > 0).length;
            const due = deck.cards.filter((c) => new Date(c.due) <= new Date()).length;
            return (
              <Link className="deck-card" key={deck.id} to={'/flashcards/' + deck.id}>
                <DeckCoverArt name={deck.name} index={i} />
                <div className="deck-info">
                  <h3>{deck.name}</h3>
                  <p>{deck.description || 'Một bộ sưu tập từ vựng của riêng bạn.'}</p>
                  <div className="deck-meta">
                    <span>{deck.cards.length} từ</span>
                    <span>{due} cần ôn</span>
                  </div>
                  <progress max={deck.cards.length || 1} value={learned} />
                  <small>
                    {learned} từ đã bắt đầu học <ArrowUpRightLocal />
                  </small>
                </div>
              </Link>
            );
          })}
        </div>
      ) : query.trim() ? (
        <Empty title="Không tìm thấy bộ thẻ">
          <p>Thử tên khác hoặc xóa từ khóa tìm kiếm.</p>
          <Button variant="secondary" onClick={() => setQuery('')}>
            Xóa tìm kiếm
          </Button>
        </Empty>
      ) : (
        <Empty title="Bộ thẻ đầu tiên đang chờ bạn">
          <p>Tạo bộ thẻ hoặc tìm một từ trong từ điển để bắt đầu.</p>
          <Button onClick={() => setCreate(true)}>Tạo bộ thẻ</Button>
        </Empty>
      )}
      {pages > 1 && (
        <nav className="inline-actions deck-pagination" aria-label="Phân trang bộ thẻ">
          <Button
            variant="secondary"
            disabled={currentPage === 1}
            onClick={() => setPage(currentPage - 1)}
          >
            Trang trước
          </Button>
          <span aria-live="polite">
            {currentPage} / {pages}
          </span>
          <Button
            variant="secondary"
            disabled={currentPage === pages}
            onClick={() => setPage(currentPage + 1)}
          >
            Trang sau
          </Button>
        </nav>
      )}
      <Modal open={create} onOpenChange={setCreate} title="Một bộ thẻ mới">
        <DeckForm close={() => setCreate(false)} />
      </Modal>
      <VocabularyImportModal open={importOpen} onOpenChange={setImportOpen} />
      <DeckSelectionModal
        open={freeReviewSelectOpen}
        onOpenChange={setFreeReviewSelectOpen}
        decks={data || []}
        selectedDeckIds={(data || []).map((d) => d.id)}
        onConfirm={(selectedIds) => {
          if (data && selectedIds.length === data.length) {
            navigate('/flashcards/review?mode=all');
          } else if (selectedIds.length === 1) {
            navigate(`/flashcards/review?deck=${selectedIds[0]}&mode=all`);
          } else {
            navigate(`/flashcards/review?mode=all&decks=${selectedIds.join(',')}`);
          }
        }}
      />
    </>
  );
}
function ArrowUpRightLocal() {
  return <ArrowRight size={15} />;
}
function CardForm({
  deckId,
  card,
  initial,
  close,
}: {
  deckId: string;
  card?: Card;
  initial?: string;
  close: () => void;
}) {
  const [values, setValues] = useState({
    japanese: card?.japanese || initial || '',
    reading: card?.reading || '',
    meaning: card?.meaning || '',
    english: card?.english || '',
    example: card?.example || '',
    note: card?.note || '',
  });
  const client = useQueryClient();
  const mutation = useMutation({
    mutationFn: () =>
      card
        ? patch('/flashcards/cards/' + card.id, { ...values, deckId })
        : post('/flashcards/cards', { ...values, deckId }),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: ['deck'] });
      void client.invalidateQueries({ queryKey: ['decks'] });
      void client.invalidateQueries({ queryKey: ['dashboard'] });
      close();
    },
  });
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        mutation.mutate();
      }}
    >
      <div className="form-grid">
        {(
          [
            { key: 'japanese', label: 'Từ tiếng Nhật', required: true },
            { key: 'reading', label: 'Cách đọc (Kana)' },
            { key: 'meaning', label: 'Nghĩa tiếng Việt', required: true },
            { key: 'english', label: 'Nghĩa tiếng Anh (không bắt buộc)' },
            { key: 'example', label: 'Câu ví dụ' },
            { key: 'note', label: 'Ghi chú của bạn' },
          ] as const
        ).map((f) => (
          <label key={f.key}>
            {f.label}
            <input
              value={values[f.key]}
              required={'required' in f && f.required}
              onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
            />
          </label>
        ))}
      </div>
      {mutation.error && (
        <p className="error-text" role="alert">
          {mutation.error.message}
        </p>
      )}
      <Button type="submit" disabled={mutation.isPending}>
        Lưu thẻ
        <Check size={16} />
      </Button>
    </form>
  );
}
export function DeckDetail() {
  const annotationMode = useAnnotationMode();
  const { deckId } = useParams();
  const navigate = useNavigate();
  const client = useQueryClient();
  const notify = useUI((s) => s.notify);
  const {
    data: deck,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['deck', deckId],
    queryFn: () => api<Deck>('/flashcards/decks/' + deckId),
  });
  const [editor, setEditor] = useState<Card | 'new' | null>(null);
  const [rename, setRename] = useState(false);
  const [deleting, setDeleting] = useState<Card | 'deck' | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [initial, setInitial] = useState('');
  const deletion = useMutation({
    mutationFn: () =>
      remove(
        deleting === 'deck'
          ? '/flashcards/decks/' + deckId
          : '/flashcards/cards/' + (deleting as Card).id,
      ),
    onSuccess: () => {
      if (deleting === 'deck') navigate('/flashcards');
      setDeleting(null);
      void client.invalidateQueries({ queryKey: ['deck'] });
      void client.invalidateQueries({ queryKey: ['decks'] });
      void client.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
  if (isLoading) return <Loading />;
  if (!deck) return <ErrorState error={error} />;
  const cards = deck.cards.filter(
    (c) =>
      (c.japanese + c.reading + c.meaning).toLowerCase().includes(search.toLowerCase()) &&
      (filter !== 'due' || new Date(c.due) <= new Date()),
  );
  return (
    <>
      <Link className="back-link" to="/flashcards">
        <ArrowLeft size={16} />
        Tất cả bộ thẻ
      </Link>
      <PageHeader
        eyebrow={`${deck.cards.length} TỪ VỰNG`}
        title={deck.name}
        description={deck.description}
        action={
          <div className="inline-actions">
            <Button variant="secondary" onClick={() => setRename(true)} aria-label="Đổi tên bộ thẻ">
              <Pencil size={16} />
            </Button>
            <Button variant="secondary" onClick={() => setDeleting('deck')} aria-label="Xóa bộ thẻ">
              <Trash2 size={16} />
            </Button>
            <Button
              onClick={() => {
                setInitial('');
                setEditor('new');
              }}
            >
              <Plus size={17} />
              Thêm từ
            </Button>
          </div>
        }
      />
      <div className="toolbar">
        <div className="input-icon">
          <Search size={17} />
          <input
            aria-label="Tìm trong bộ thẻ"
            placeholder="Tìm một từ trong bộ thẻ…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select aria-label="Lọc thẻ" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">Tất cả thẻ</option>
          <option value="due">Đến hạn ôn</option>
        </select>
        <Button variant="secondary" onClick={() => setImportModalOpen(true)}>
          <Upload size={16} />
          Import PPTX / PDF
        </Button>
        <div className="inline-actions" style={{ gap: '8px', flexWrap: 'wrap' }}>
          <Link className="button primary" to={'/flashcards/review?deck=' + deckId}>
            Ôn bộ này
            <ArrowRight size={16} />
          </Link>
          <Link
            className="button secondary"
            to={'/flashcards/review?deck=' + deckId + '&mode=all'}
            title="Ôn lại toàn bộ thẻ trong bộ này bất cứ lúc nào"
          >
            <RotateCcw size={15} />
            Ôn lại tự do
          </Link>
        </div>
      </div>
      <section className="panel card-list">
        {cards.length ? (
          cards.map((card) => (
            <div className="card-list-row" key={card.id}>
              <div>
                <strong lang="ja">
                  <JapaneseAnnotatedText text={card.japanese} reading={card.reading} />
                </strong>
                <small>
                  {annotationMode === 'romanized' ? toRomaji(card.reading) : card.reading}
                </small>
              </div>
              <div>
                <span>{card.meaning}</span>
                {card.note && <small>{card.note}</small>}
              </div>
              <span className="tag">
                {new Date(card.due) <= new Date()
                  ? 'Đến hạn'
                  : new Date(card.due).toLocaleDateString('vi')}
              </span>
              <div className="inline-actions">
                <AudioButton text={card.japanese} />
                <Link
                  className="button ghost icon-button"
                  to={`/flashcards/review?deck=${deckId}&card=${card.id}`}
                  aria-label={'Ôn lại từ ' + card.japanese}
                  title="Ôn lại thẻ này ngay"
                >
                  <RotateCcw size={15} />
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={'Sửa ' + card.japanese}
                  onClick={() => setEditor(card)}
                >
                  <Pencil size={16} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={'Xóa ' + card.japanese}
                  onClick={() => setDeleting(card)}
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          ))
        ) : (
          <Empty title="Chưa có từ phù hợp">
            <p>Thêm từ thủ công hoặc lưu từ từ điển.</p>
            <Link to="/dictionary">Mở từ điển →</Link>
          </Empty>
        )}
      </section>
      <Modal
        open={editor !== null}
        onOpenChange={(o) => !o && setEditor(null)}
        title={editor === 'new' ? 'Thêm một từ mới' : 'Chỉnh sửa thẻ'}
      >
        {editor && (
          <CardForm
            key={typeof editor === 'string' ? 'new' : editor.id}
            deckId={deck.id}
            card={typeof editor === 'object' ? editor : undefined}
            initial={initial}
            close={() => setEditor(null)}
          />
        )}
      </Modal>
      <Modal open={rename} onOpenChange={setRename} title="Chỉnh sửa bộ thẻ">
        <DeckForm deck={deck} close={() => setRename(false)} />
      </Modal>
      <Modal
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={deleting === 'deck' ? 'Xóa bộ thẻ này?' : 'Xóa từ này?'}
      >
        <p>
          {deleting === 'deck'
            ? 'Các thẻ và lịch sử ôn trong bộ này sẽ bị xóa.'
            : 'Thẻ và lịch sử ôn của từ này sẽ bị xóa.'}
        </p>
        {deletion.error && <p className="error-text">{deletion.error.message}</p>}
        <div className="inline-actions">
          <Button variant="secondary" onClick={() => setDeleting(null)}>
            Giữ lại
          </Button>
          <Button variant="danger" disabled={deletion.isPending} onClick={() => deletion.mutate()}>
            Xóa
          </Button>
        </div>
      </Modal>
      <VocabularyImportModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        targetDeckId={deckId}
        targetDeckName={deck.name}
      />
    </>
  );
}
export function Review() {
  const annotationMode = useAnnotationMode();
  const [params, setParams] = useSearchParams();
  const deck = params.get('deck');
  const decksParam = params.get('decks');
  const cardId = params.get('card');
  const modeParam = params.get('mode');
  const isAnytime = modeParam === 'all' || Boolean(cardId);
  const client = useQueryClient();
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(0);
  const [sessionSeed, setSessionSeed] = useState(1);
  const [deckModalOpen, setDeckModalOpen] = useState(false);

  const { data: allDecks = [] } = useQuery({
    queryKey: ['decks'],
    queryFn: () => api<Deck[]>('/flashcards/decks'),
  });

  const selectedDeckIds = useMemo(() => {
    if (decksParam) {
      return decksParam.split(',').map((id) => id.trim()).filter(Boolean);
    }
    if (deck) {
      return [deck.trim()];
    }
    return allDecks.map((d) => d.id);
  }, [decksParam, deck, allDecks]);

  const selectedCardsCount = useMemo(() => {
    const activeDecks = allDecks.filter((d) => selectedDeckIds.includes(d.id));
    return activeDecks.reduce((sum, d) => sum + (d.cards?.length || 0), 0);
  }, [allDecks, selectedDeckIds]);

  const selectedDeckNamesText = useMemo(() => {
    if (!allDecks.length) return 'Tất cả các bộ thẻ';
    if (!decksParam && !deck) return `Tất cả các bộ (${allDecks.length} bộ)`;
    const matchingDecks = allDecks.filter((d) => selectedDeckIds.includes(d.id));
    if (matchingDecks.length === allDecks.length) {
      return `Tất cả các bộ (${allDecks.length} bộ)`;
    }
    if (matchingDecks.length === 1) {
      return matchingDecks[0].name;
    }
    return `${matchingDecks.length} bộ: ${matchingDecks.map((d) => d.name).join(', ')}`;
  }, [allDecks, selectedDeckIds, decksParam, deck]);

  const queryParams = new URLSearchParams();
  if (deck) queryParams.set('deck', deck);
  if (decksParam) queryParams.set('decks', decksParam);
  if (cardId) queryParams.set('card', cardId);
  if (isAnytime) {
    queryParams.set('mode', 'all');
    queryParams.set('seed', String(sessionSeed));
  }

  const queryKey = [
    'review',
    isAnytime ? 'all' : 'due',
    isAnytime ? (decksParam || deck || 'all') : (deck || 'all'),
    cardId || '',
    sessionSeed,
  ];

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      const res = await api<Card[]>('/flashcards/review/due?' + queryParams.toString());
      return isAnytime ? shuffleCards(res) : res;
    },
    staleTime: 0,
  });

  const card = data?.[0];
  const interactiveCard = useMemo(() => {
    if (!card) return undefined;
    const deckName = card.deck?.name || allDecks.find((d) => d.id === card.deckId)?.name;
    return {
      ...card,
      deckName,
    };
  }, [card, allDecks]);

  const mutation = useMutation({
    mutationFn: (rating: number) =>
      post('/flashcards/review', { cardId: card?.id, rating, allowEarly: true }),
    onSuccess: () => {
      setDone(done + 1);
      setFlipped(false);
      client.setQueryData<Card[]>(queryKey, (old) => old?.slice(1));
      void client.invalidateQueries({ queryKey: ['dashboard'] });
      void client.invalidateQueries({ queryKey: ['decks'] });
      void client.invalidateQueries({ queryKey: ['deck'] });
      void client.invalidateQueries({ queryKey: ['leaderboard-current'] });
    },
  });

  const switchMode = (newMode: 'due' | 'all') => {
    const next = new URLSearchParams(params);
    if (newMode === 'all') {
      next.set('mode', 'all');
    } else {
      next.delete('mode');
      next.delete('decks');
    }
    next.delete('card');
    setParams(next);
    setDone(0);
    setFlipped(false);
    setSessionSeed((s) => s + 1);
  };

  const handleApplyDecks = (newSelectedIds: string[]) => {
    const next = new URLSearchParams(params);
    next.set('mode', 'all');
    next.delete('card');
    if (allDecks.length > 0 && newSelectedIds.length === allDecks.length) {
      next.delete('deck');
      next.delete('decks');
    } else if (newSelectedIds.length === 1) {
      next.set('deck', newSelectedIds[0]);
      next.delete('decks');
    } else {
      next.set('decks', newSelectedIds.join(','));
      next.delete('deck');
    }
    setParams(next);
    setSessionSeed((s) => s + 1);
    setDone(0);
    setFlipped(false);
  };

  const handleReshuffle = () => {
    client.setQueryData<Card[]>(queryKey, (old) => (old ? shuffleCards(old) : []));
    setFlipped(false);
  };

  return (
    <>
      <Link className="back-link" to="/flashcards">
        <ArrowLeft size={16} />
        Kết thúc lượt ôn
      </Link>
      <div className="review-mode-tabs" role="tablist" aria-label="Chế độ ôn tập">
        <button
          type="button"
          role="tab"
          aria-selected={!isAnytime}
          className={`review-mode-tab ${!isAnytime ? 'active' : ''}`}
          onClick={() => switchMode('due')}
        >
          Thẻ đến hạn
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={isAnytime}
          className={`review-mode-tab ${isAnytime ? 'active' : ''}`}
          onClick={() => switchMode('all')}
        >
          Ôn lại tự do (Tất cả thẻ)
        </button>
      </div>

      {isAnytime && (
        <div className="review-deck-selector-bar">
          <div className="review-deck-selector-info">
            <span className="deck-selector-pill" title={selectedDeckNamesText}>
              <Layers size={14} aria-hidden="true" />
              <span>{selectedDeckNamesText}</span>
            </span>
          </div>
          <div className="review-deck-selector-actions">
            <Button
              type="button"
              variant="secondary"
              size="small"
              onClick={() => setDeckModalOpen(true)}
              title="Chọn các bộ muốn ôn cùng lúc khi ôn tự do"
            >
              <Layers size={14} />
              <span>Chọn các bộ muốn ôn</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="small"
              onClick={handleReshuffle}
              title="Xáo trộn lại danh sách thẻ"
            >
              <RotateCcw size={14} />
              <span>Xáo trộn lại</span>
            </Button>
          </div>
        </div>
      )}

      <PageHeader
        eyebrow={isAnytime ? 'ÔN TẬP TỰ DO · BẤT CỨ LÚC NÀO' : 'MỖI LẦN NHỚ LẠI, MỘT LẦN VỮNG HƠN'}
        title={isAnytime ? 'Ôn lại theo ý muốn.' : 'Khoảng thời gian cho từ vựng.'}
        description={
          isAnytime
            ? `${done} từ đã ôn · Lịch ôn dài hạn sẽ tự động điều chỉnh theo lần ôn mới nhất này.`
            : `${done} từ đã ôn trong phiên này${data?.length ? ' · ' + data.length + ' từ còn lại' : ''}`
        }
      />
      {isLoading ? (
        <Loading />
      ) : error ? (
        <ErrorState error={error} />
      ) : interactiveCard ? (
        <div className="review-session">
          <div className="review-progress-wrap">
            <div className="review-progress-header">
              <span>{isAnytime ? 'Tiến độ ôn tự do' : 'Tiến độ phiên ôn'}</span>
              <strong>{done} / {done + (data?.length || 0)} thẻ</strong>
            </div>
            <progress
              max={Math.max(1, done + (data?.length || 0))}
              value={done}
              aria-label="Tiến độ lượt ôn"
            />
          </div>
          <ReviewCardInteractive
            card={interactiveCard}
            flipped={flipped}
            onFlip={() => setFlipped(!flipped)}
            onSwipe={(dir) => {
              mutation.mutate(dir === 'left' ? 0 : 2);
            }}
            mode={annotationMode}
          />
          {mutation.error && (
            <p className="error-text" role="alert">
              {mutation.error.message}
            </p>
          )}
          <div className="review-card-controls">
            <Button className="flip-button" onClick={() => setFlipped(!flipped)}>
              <RotateCcw size={17} />
              <span>{flipped ? 'Lật lại mặt trước' : 'Lật thẻ xem đáp án'}</span>
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
            Kéo thẻ sang trái nếu Quên, sang phải nếu Nhớ · Lịch ôn SM-2 sẽ tự động điều chỉnh theo lần ôn này.
          </p>
        </div>
      ) : (
        <Empty
          title={
            isAnytime
              ? 'Bạn đã ôn xong toàn bộ thẻ đã chọn.'
              : 'Bạn đã ôn hết các thẻ đến hạn.'
          }
        >
          <p>
            {done > 0
              ? `Đã ôn ${done} từ. Lịch ôn dài hạn đã được điều chỉnh theo lần ôn mới nhất.`
              : isAnytime
                ? 'Các bộ thẻ đã chọn hiện chưa có từ vựng nào.'
                : 'Hiện tại chưa có thẻ nào đến hạn ôn. Bạn có thể ôn lại bất cứ lúc nào!'}
          </p>
          <div
            className="inline-actions"
            style={{ justifyContent: 'center', gap: '10px', marginTop: '16px', flexWrap: 'wrap' }}
          >
            {!isAnytime ? (
              <Button onClick={() => switchMode('all')}>
                <RotateCcw size={16} />
                Ôn lại tất cả thẻ ngay
              </Button>
            ) : (
              <>
                <Button
                  onClick={() => {
                    setSessionSeed((s) => s + 1);
                    setDone(0);
                    setFlipped(false);
                  }}
                >
                  <RotateCcw size={16} />
                  Ôn lại từ đầu (Xáo trộn mới)
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setDeckModalOpen(true)}
                >
                  <Layers size={16} />
                  Chọn bộ thẻ khác
                </Button>
              </>
            )}
            <Link className="button secondary" to="/flashcards">
              Danh sách bộ thẻ
            </Link>
          </div>
        </Empty>
      )}
      <DeckSelectionModal
        open={deckModalOpen}
        onOpenChange={setDeckModalOpen}
        decks={allDecks}
        selectedDeckIds={selectedDeckIds}
        onConfirm={handleApplyDecks}
      />
    </>
  );
}
