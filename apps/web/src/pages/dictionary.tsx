import { useEffect, useState } from 'react';
import { toRomaji } from 'wanakana';
import { SearchHighlight } from '../components/search-highlight';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, Plus, Copy, ArrowLeft, ArrowRight, BookOpen, Check, Database, PenLine } from 'lucide-react';
import type { KanjiInfo } from '../../../../packages/shared/kanji';
import { api, post } from '../services/api';
import { useUI } from '../stores/ui';
import type { Deck, Entry, Status } from '../types';
import {
  AudioButton,
  Button,
  Empty,
  ErrorState,
  Loading,
  Modal,
  PageHeader,
} from '../components/ui';
const labels: Record<string, string> = {
  n: 'Danh từ',
  v1: 'Động từ nhóm II',
  v5u: 'Động từ nhóm I',
  v5k: 'Động từ nhóm I',
  v5r: 'Động từ nhóm I',
  v5m: 'Động từ nhóm I',
  v5s: 'Động từ nhóm I',
  vs: 'Động từ する',
  'vs-i': 'Động từ する',
  'adj-i': 'Tính từ い',
  'adj-na': 'Tính từ な',
  adv: 'Trạng từ',
  exp: 'Cụm từ',
  int: 'Thán từ',
  vt: 'Ngoại động từ',
  vi: 'Nội động từ',
  pn: 'Đại từ',
  suf: 'Hậu tố',
  pref: 'Tiền tố',
};
const headword = (entry: Entry) => entry.kanji[0]?.text || entry.readings[0]?.text || '';

export function KanjiQuickCard({ kanji }: { kanji: KanjiInfo }) {
  return (
    <article
      className="panel"
      style={{
        borderLeft: '4px solid var(--jade)',
        marginBottom: '14px',
        padding: '16px 20px',
        background: 'var(--card)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <span
            lang="ja"
            style={{
              fontSize: '36px',
              fontFamily: '"Noto Sans JP", sans-serif',
              fontWeight: 700,
              lineHeight: 1,
            }}
          >
            {kanji.character}
          </span>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              {kanji.vietnameseNames?.length > 0 && (
                <strong style={{ fontSize: '18px', color: 'var(--text)', textTransform: 'uppercase' }}>
                  {kanji.vietnameseNames.join(', ')}
                </strong>
              )}
              {kanji.jlpt && <span className="tag green">JLPT {kanji.jlpt}</span>}
              {kanji.strokes && <span className="tag">{kanji.strokes} nét</span>}
            </div>
            {kanji.readings?.length > 0 && (
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--muted)' }} lang="ja">
                <strong>Âm đọc:</strong> {kanji.readings.slice(0, 5).join(' ・ ')}
              </p>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Link
            to={'/writing?char=' + encodeURIComponent(kanji.character)}
            className="button secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
          >
            <PenLine size={15} />
            Luyện viết chữ này
          </Link>
          <Link
            to={'/kanji/' + encodeURIComponent(kanji.character)}
            className="button ghost"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
          >
            Bộ thủ & cấu tạo
          </Link>
        </div>
      </div>

      {kanji.meanings?.length > 0 && (
        <p style={{ margin: '10px 0 0', fontSize: '13px', color: 'var(--text)' }}>
          <strong>Ý nghĩa:</strong> {kanji.meanings.slice(0, 4).join('; ')}
        </p>
      )}
    </article>
  );
}

export function WordCard({
  entry,
  detail = false,
  query = '',
}: {
  entry: Entry;
  detail?: boolean;
  query?: string;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  const [deckId, setDeckId] = useState('');
  const [saving, setSaving] = useState(false);
  const notify = useUI((s) => s.notify);
  const client = useQueryClient();
  const { data: decks } = useQuery({
    queryKey: ['decks'],
    queryFn: () => api<Deck[]>('/flashcards/decks'),
    enabled: selected !== null,
  });
  const word = headword(entry);
  const add = async () => {
    setSaving(true);
    try {
      const sense = entry.senses[selected || 0];
      const meaning = sense.glosses
        .map((g) =>
          g.translation?.status === 'completed' ? g.translation.translatedText : g.originalText,
        )
        .join('; ');
      await post('/flashcards/cards', {
        deckId: deckId || decks?.[0]?.id,
        japanese: word,
        reading: entry.readings[0]?.text || '',
        meaning,
        english: sense.glosses.map((g) => g.originalText).join('; '),
        entryId: entry.id,
      });
      void client.invalidateQueries({ queryKey: ['decks'] });
      void client.invalidateQueries({ queryKey: ['dashboard'] });
      notify('Đã thêm từ vào bộ thẻ.');
      setSelected(null);
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setSaving(false);
    }
  };
  return (
    <article className="word-card">
      <div className="word-card-header">
        <div>
          <div className="word-title">
            <Link lang="ja" to={'/dictionary/' + entry.id}>
              <SearchHighlight text={word} query={query} />
            </Link>
            {entry.common && <span className="tag green">Từ thông dụng</span>}
          </div>
          <p className="reading" lang="ja">
            <SearchHighlight text={entry.readings.map((r) => r.text).join(' ・ ')} query={query} />
          </p>
          <p className="muted small-text">
            <SearchHighlight
              text={entry.readings.map((r) => toRomaji(r.text)).join(' ・ ')}
              query={query}
            />
          </p>
          {[
            ...new Set(
              entry.kanji.flatMap((k) => [...k.text]).filter((c) => /\p{Script=Han}/u.test(c)),
            ),
          ].length > 0 && (
            <div className="inline-actions wrap" style={{ marginTop: '8px', gap: '6px' }}>
              <span className="muted small-text" style={{ alignSelf: 'center' }}>
                Kanji trong từ:
              </span>
              {[
                ...new Set(
                  entry.kanji.flatMap((k) => [...k.text]).filter((c) => /\p{Script=Han}/u.test(c)),
                ),
              ].map((c) => (
                <div key={c} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Link className="tag" to={'/kanji/' + encodeURIComponent(c)} title={'Xem bộ thủ của ' + c}>
                    {c}
                  </Link>
                  <Link
                    to={'/writing?char=' + encodeURIComponent(c)}
                    className="tag"
                    style={{ padding: '2px 6px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                    title={'Luyện viết chữ ' + c}
                  >
                    <PenLine size={11} /> Viết
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="inline-actions">
          <AudioButton text={word} />
          <Button
            variant="ghost"
            size="icon"
            aria-label={'Sao chép ' + word}
            onClick={() =>
              void navigator.clipboard
                .writeText(word)
                .then(() => notify('Đã sao chép từ.'))
                .catch(() => notify('Trình duyệt chưa cho phép sao chép.'))
            }
          >
            <Copy size={17} />
          </Button>
        </div>
      </div>
      <ol className="sense-list">
        {entry.senses.slice(0, detail ? undefined : 3).map((sense, i) => {
          const metadata = JSON.parse(sense.metadata) as {
            partOfSpeech: string[];
            info: string[];
            appliesToKanji: string[];
            appliesToKana: string[];
          };
          return (
            <li key={sense.id}>
              <div className="sense-number">{i + 1}.</div>
              <div className="sense-content">
                <div className="pos-tags">
                  {metadata.partOfSpeech.map((p) => (
                    <span key={p}>{labels[p] || p}</span>
                  ))}
                </div>
                <p>
                  {(() => {
                    const rendered = new Set<string>();
                    const items: { id: string; text: string; isTranslated: boolean }[] = [];
                    for (const g of sense.glosses) {
                      if (g.translation?.status === 'completed') {
                        const t = g.translation.translatedText.trim();
                        if (!rendered.has(t)) {
                          rendered.add(t);
                          items.push({ id: g.id, text: t, isTranslated: true });
                        }
                      } else {
                        items.push({ id: g.id, text: g.originalText, isTranslated: false });
                      }
                    }
                    return items.map((item, j) => (
                      <span key={item.id}>
                        {j > 0 ? '; ' : ''}
                        {item.isTranslated ? (
                          <SearchHighlight text={item.text} query={query} />
                        ) : (
                          <span className="untranslated">
                            {item.text} <small>chưa có bản dịch Việt</small>
                          </span>
                        )}
                      </span>
                    ));
                  })()}
                </p>
                <details>
                  <summary>Nghĩa gốc tiếng Anh</summary>
                  <p className="english-gloss">
                    {sense.glosses.map((g) => g.originalText).join('; ')}
                  </p>
                </details>
                {detail && metadata.info.length > 0 && (
                  <p className="usage-note">{metadata.info.join(' · ')}</p>
                )}
                {detail &&
                  (!metadata.appliesToKanji.includes('*') ||
                    !metadata.appliesToKana.includes('*')) && (
                    <small className="muted">
                      Áp dụng:{' '}
                      {metadata.appliesToKanji
                        .concat(metadata.appliesToKana)
                        .filter((v) => v !== '*')
                        .join(', ')}
                    </small>
                  )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label={'Thêm nghĩa ' + (i + 1) + ' vào thẻ'}
                onClick={() => setSelected(i)}
              >
                <Plus size={19} />
              </Button>
            </li>
          );
        })}
      </ol>
      {!detail && entry.senses.length > 3 && (
        <Link className="text-link" to={'/dictionary/' + entry.id}>
          Xem thêm {entry.senses.length - 3} nghĩa <ArrowRight size={14} />
        </Link>
      )}
      <div className="word-card-footer">
        <span>JMdict · {entry.id}</span>
        <Button variant="ghost" size="small" onClick={() => setSelected(0)}>
          <Plus size={14} />
          Thêm vào thẻ từ vựng
        </Button>
      </div>
      <Modal
        open={selected !== null}
        onOpenChange={(o) => !o && setSelected(null)}
        title={'Lưu từ 「' + word + '」'}
      >
        <p>Chọn nghĩa và bộ thẻ để ôn tập.</p>
        <label>
          Nghĩa
          <select value={selected ?? 0} onChange={(e) => setSelected(Number(e.target.value))}>
            {entry.senses.map((s, i) => (
              <option key={s.id} value={i}>
                {i + 1}.{' '}
                {Array.from(
                  new Set(
                    s.glosses.map((g) =>
                      g.translation?.status === 'completed'
                        ? g.translation.translatedText
                        : g.originalText,
                    ),
                  ),
                ).join('; ')}
              </option>
            ))}
          </select>
        </label>
        <label>
          Bộ thẻ
          <select
            value={deckId || decks?.[0]?.id || ''}
            onChange={(e) => setDeckId(e.target.value)}
          >
            {decks?.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </label>
        {decks?.length === 0 ? (
          <p>
            Hãy <Link to="/flashcards">tạo bộ thẻ đầu tiên</Link> trước khi lưu từ.
          </p>
        ) : (
          <Button disabled={saving || !decks?.length} onClick={() => void add()}>
            {saving ? 'Đang lưu…' : 'Lưu vào bộ thẻ'}
            <Check size={16} />
          </Button>
        )}
      </Modal>
    </article>
  );
}
export function Dictionary() {
  const [params, setParams] = useSearchParams();
  const [input, setInput] = useState(params.get('q') || '');
  const [composing, setComposing] = useState(false);
  const query = params.get('q') || '';
  const page = Number(params.get('page') || 1);
  const client = useQueryClient();
  useEffect(() => {
    setInput(params.get('q') || '');
  }, [params]);
  useEffect(() => {
    if (composing) return;
    const timer = setTimeout(() => {
      if (input !== query) setParams(input ? { q: input } : {});
    }, 250);
    return () => clearTimeout(timer);
  }, [input, composing, query, setParams]);
  const results = useQuery({
    queryKey: ['dictionary', query, page],
    queryFn: ({ signal }) =>
      api<{ items: Entry[]; total: number; limit: number; fuzzy?: boolean }>(
        '/dictionary/search?q=' + encodeURIComponent(query) + '&page=' + page,
        { signal },
      ),
    enabled: !composing,
  });
  const kanjiResults = useQuery({
    queryKey: ['kanji-search', query],
    queryFn: ({ signal }) =>
      api<KanjiInfo[]>('/kanji/search?q=' + encodeURIComponent(query), { signal }),
    enabled: !!query.trim() && !composing,
  });
  const status = useQuery({
    queryKey: ['dictionary-status'],
    queryFn: () => api<Status>('/dictionary/status'),
  });
  const history = useQuery({
    queryKey: ['search-history'],
    queryFn: () => api<{ id: string; query: string }[]>('/dictionary/history'),
  });
  const search = (q: string) => {
    setInput(q);
    setParams(q ? { q } : {});
    if (q)
      void post('/dictionary/history', { query: q }).then(() =>
        client.invalidateQueries({ queryKey: ['search-history'] }),
      );
  };
  return (
    <>
      <PageHeader
        eyebrow="TRA CỨU & KHÁM PHÁ"
        title="Mỗi từ là một cánh cửa."
        description="Tìm bằng Kanji, Kana, Romaji, tiếng Việt hoặc tiếng Anh; hỗ trợ cả dạng chia như ikimasu, 食べました."
      />
      <section className="dictionary-search-panel">
        <form
          className="dictionary-search"
          onSubmit={(e) => {
            e.preventDefault();
            if (!composing) search(input);
          }}
        >
          <Search size={24} />
          <input
            type="search"
            name="q"
            data-testid="dictionary-search-input"
            autoFocus
            aria-label="Tìm từ trong từ điển"
            placeholder="Bạn muốn tìm từ gì?  例：勉強、taberu、học…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onCompositionStart={() => setComposing(true)}
            onCompositionEnd={(e) => {
              setComposing(false);
              setInput(e.currentTarget.value);
            }}
          />
          <Button type="submit">
            Tra từ
            <ArrowRight size={17} />
          </Button>
        </form>
        <div className="search-hints">
          <span>THỬ TÌM</span>
          {['食べる', 'ありがとう', '学校', '勉強', 'sakura'].map((q) => (
            <button key={q} onClick={() => search(q)}>
              {q}
            </button>
          ))}
        </div>
      </section>
      <div className="dictionary-layout">
        <section>
          <div className="results-heading">
            <h2>{query ? `Kết quả cho “${query}”` : 'Khám phá từ thông dụng'}</h2>
            <span>{results.data?.total.toLocaleString('vi') || 0} từ</span>
          </div>
          {results.isFetching && <p role="status">Đang tìm kiếm…</p>}
          {kanjiResults.data && kanjiResults.data.length > 0 && (
            <div style={{ marginBottom: '22px' }}>
              <div className="results-heading" style={{ marginBottom: '10px' }}>
                <h3 style={{ fontSize: '16px', margin: 0 }}>Chữ Kanji liên quan ({kanjiResults.data.length})</h3>
              </div>
              {kanjiResults.data.map((k) => (
                <KanjiQuickCard key={k.character} kanji={k} />
              ))}
            </div>
          )}
          {results.data?.fuzzy && (
            <p>Không có kết quả chính xác. Các từ gần giống dưới đây chỉ là gợi ý.</p>
          )}
          {results.isLoading ? (
            <div data-testid="dictionary-skeleton-stack" className="loading-stack" aria-label="Đang tìm kiếm">
              <div className="skeleton" style={{ height: '120px', borderRadius: '12px' }} />
              <div className="skeleton" style={{ height: '120px', borderRadius: '12px' }} />
              <div className="skeleton" style={{ height: '120px', borderRadius: '12px' }} />
            </div>
          ) : results.error ? (
            <ErrorState error={results.error} retry={() => void results.refetch()} />
          ) : results.data?.items.length ? (
            results.data.items.map((e) => (
              <div key={e.id}>
                {e.inflection && (
                  <p className="muted small-text">
                    Dạng gốc: <strong lang="ja">{e.inflection.term}</strong> · Nhận diện:{' '}
                    {e.inflection.steps.join(' → ')}
                  </p>
                )}
                <WordCard entry={e} query={query} />
              </div>
            ))
          ) : (
            <Empty
              title={
                status.data?.entries === 0
                  ? 'Dữ liệu từ điển chưa được nhập'
                  : 'Chưa tìm thấy từ phù hợp'
              }
            >
              <p>Thử cách viết khác, bỏ dấu cách hoặc dùng Kana.</p>
              <p>Tra nghĩa tiếng Việt chỉ áp dụng cho những định nghĩa đã có bản dịch.</p>
            </Empty>
          )}
          {results.data && results.data.total > results.data.limit && (
            <div className="pagination">
              <Button
                variant="secondary"
                disabled={page <= 1}
                onClick={() => setParams({ q: query, page: String(page - 1) })}
              >
                <ArrowLeft size={16} />
                Trước
              </Button>
              <span>Trang {page}</span>
              <Button
                variant="secondary"
                disabled={page * results.data.limit >= results.data.total}
                onClick={() => setParams({ q: query, page: String(page + 1) })}
              >
                Sau
                <ArrowRight size={16} />
              </Button>
            </div>
          )}
        </section>
        <aside>
          <div className="panel dictionary-aside">
            <BookOpen size={23} />
            <h3>
              Tra từ. Hiểu nghĩa.
              <br />
              Ghi nhớ lâu hơn.
            </h3>
            <p>Lưu đúng nghĩa bạn cần vào bộ thẻ, rồi ôn lại theo lịch cá nhân.</p>
            <Link to="/flashcards" className="text-link">
              Mở bộ thẻ của bạn <ArrowRight size={14} />
            </Link>
          </div>
          <section className="panel spaced">
            <h3>Gần đây bạn đã tìm</h3>
            {history.data?.length ? (
              history.data.map((h) => (
                <button className="history-row" key={h.id} onClick={() => search(h.query)}>
                  <Search size={14} />
                  {h.query}
                  <ArrowUpRightSmall />
                </button>
              ))
            ) : (
              <p className="muted">Lịch sử xuất hiện sau khi bạn nhấn Tra từ.</p>
            )}
          </section>
          <div className="source-note">
            <Database size={15} />
            <span>
              {status.data?.entries.toLocaleString('vi') || '…'} mục từ trong máy
              <br />
              {status.data?.translated.toLocaleString('vi') || 0} định nghĩa có tiếng Việt
              <br />
              <Link to="/settings#sources">Nguồn: JMdict / EDRDG</Link>
            </span>
          </div>
        </aside>
      </div>
    </>
  );
}
function ArrowUpRightSmall() {
  return <ArrowRight size={13} />;
}
export function DictionaryDetail() {
  const { id } = useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ['entry', id],
    queryFn: () => api<Entry>('/dictionary/' + id),
  });
  return (
    <>
      <Link className="back-link" to="/dictionary">
        <ArrowLeft size={16} />
        Về từ điển
      </Link>
      {isLoading ? (
        <Loading />
      ) : data ? (
        <>
          <PageHeader
            title={headword(data)}
            description="Các cách đọc và nghĩa được giữ riêng theo nguồn JMdict."
          />
          <WordCard entry={data} detail />
          <p className="muted">
            Phiên bản dữ liệu: {data.version}. Bản dịch AI, nếu có, cần được đối chiếu theo ngữ
            cảnh.
          </p>
        </>
      ) : (
        <ErrorState error={error} />
      )}
    </>
  );
}

