import { Link, useSearchParams } from 'react-router-dom';
import { RadicalLearning } from './radicals';
import { StrokeOrder } from '../components/stroke-order';
import { useEffect, useRef, useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, RotateCcw, Undo2, PenLine, Search, BookOpen } from 'lucide-react';
import { api, post } from '../services/api';
import { useUI } from '../stores/ui';
import { Button, PageHeader, AudioButton } from '../components/ui';
import { useUser } from '../app';
import { loadWritingDraft, saveWritingDraft } from '../services/drafts';
import type { JlptKanjiData, JlptKanjiSummary, KanjiInfo } from '../../../../packages/shared/kanji';

type Point = { x: number; y: number };

const alphabets: Record<string, string[]> = {
  Hiragana: Array.from(
    'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん',
  ),
  Katakana: Array.from(
    'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン',
  ),
};

export function Writing() {
  const { data: user } = useUser();
  const [params, setParams] = useSearchParams();
  const radical = params.get('mode') === 'radicals';
  const charParam = params.get('char') || undefined;

  return user ? (
    <>
      <div className="tabs" aria-label="Chế độ luyện viết">
        <button
          className={!radical ? 'active' : ''}
          onClick={() => setParams(charParam ? { char: charParam } : {})}
        >
          Luyện viết chữ & Kanji
        </button>
        <button className={radical ? 'active' : ''} onClick={() => setParams({ mode: 'radicals' })}>
          Học bộ thủ
        </button>
      </div>
      {radical ? (
        <RadicalLearning userId={user.id} />
      ) : (
        <WritingWorkspace
          key={user.id + (charParam || '')}
          userId={user.id}
          initialCharacter={charParam}
        />
      )}
    </>
  ) : null;
}

export function WritingWorkspace({
  userId,
  practiceCharacter,
  initialCharacter,
}: {
  userId: string;
  practiceCharacter?: string;
  initialCharacter?: string;
}) {
  const targetInit = practiceCharacter || initialCharacter || 'あ';
  const isInitialKanji = /\p{Script=Han}/u.test(targetInit);

  const draftKey = practiceCharacter ? userId + ':radical:' + practiceCharacter : userId;
  const [category, setCategory] = useState<'kana' | 'kanji'>(isInitialKanji ? 'kanji' : 'kana');
  const [alphabet, setAlphabet] = useState('Hiragana');
  const [jlptLevel, setJlptLevel] = useState<'N5' | 'N4' | 'N3' | 'N2' | 'N1'>('N5');
  const [kanjiSearch, setKanjiSearch] = useState('');
  const [character, setCharacter] = useState(targetInit);
  const [strokes, setStrokes] = useState<Point[][]>([]);
  const [guide, setGuide] = useState(true);
  const [saving, setSaving] = useState(false);
  const [draftReady, setDraftReady] = useState(false);
  const [draftStatus, setDraftStatus] = useState('Đang mở bản nháp…');
  const draftRevision = useRef(0);
  const canvas = useRef<HTMLCanvasElement>(null);
  const current = useRef<Point[] | null>(null);
  const client = useQueryClient();
  const notify = useUI((s) => s.notify);

  // Fetch JLPT kanji dataset (try static CDN first, fallback to API)
  const { data: jlptData, isLoading: jlptLoading } = useQuery({
    queryKey: ['jlpt-kanji'],
    queryFn: async () => {
      try {
        const res = await fetch('/data/jlpt.json');
        if (res.ok) {
          const json = (await res.json()) as JlptKanjiData;
          if (json && json.byLevel) return json;
        }
      } catch {}
      return api<JlptKanjiData>('/kanji/jlpt');
    },
    staleTime: Infinity,
  });

  // Fetch active character info if it's a kanji
  const isKanji = /\p{Script=Han}/u.test(character);
  const { data: kanjiInfo } = useQuery({
    queryKey: ['kanji', character],
    queryFn: () => api<KanjiInfo>('/kanji/' + encodeURIComponent(character)),
    enabled: isKanji,
    staleTime: 1000 * 60 * 10,
  });

  // Set proper level if initialCharacter matches
  useEffect(() => {
    if (jlptData && isInitialKanji && jlptData.byCharacter[targetInit]) {
      const lvl = jlptData.byCharacter[targetInit].level as 'N5' | 'N4' | 'N3' | 'N2' | 'N1';
      if (['N5', 'N4', 'N3', 'N2', 'N1'].includes(lvl)) {
        setJlptLevel(lvl);
        setCategory('kanji');
      }
    }
  }, [jlptData, isInitialKanji, targetInit]);

  // When in kanji category, ensure a kanji is selected
  useEffect(() => {
    if (category === 'kanji' && jlptData && !/\p{Script=Han}/u.test(character)) {
      const first = jlptData.byLevel[jlptLevel]?.[0]?.character;
      if (first) {
        setCharacter(first);
        setStrokes([]);
      }
    }
  }, [category, jlptData, jlptLevel, character]);

  useEffect(() => {
    let active = true;
    void loadWritingDraft(draftKey)
      .then((draft) => {
        if (!active) return;
        if (draft && Array.isArray(draft.strokes)) {
          // If we had an explicit target character from URL/practice, prefer it
          if (practiceCharacter || initialCharacter) {
            setCharacter(targetInit);
          } else {
            if (alphabets[draft.alphabet]?.includes(draft.character)) {
              setAlphabet(draft.alphabet);
              setCategory('kana');
            } else if (/\p{Script=Han}/u.test(draft.character)) {
              setCategory('kanji');
            }
            setCharacter(draft.character);
          }
          setStrokes(draft.strokes);
          setGuide(draft.guide);
        }
      })
      .catch(() => {
        if (active)
          setDraftStatus(
            'Không thể lưu bản nháp trên trình duyệt này. Bạn vẫn có thể lưu buổi luyện viết vào tài khoản.',
          );
      })
      .finally(() => {
        if (active) setDraftReady(true);
      });
    return () => {
      active = false;
    };
  }, [draftKey, practiceCharacter, initialCharacter, targetInit]);

  useEffect(() => {
    if (!draftReady) return;
    const revision = ++draftRevision.current;
    setDraftStatus('Đang lưu bản nháp…');
    void saveWritingDraft(draftKey, { alphabet, character, strokes, guide })
      .then(() => {
        if (draftRevision.current === revision)
          setDraftStatus('Đã lưu bản nháp trên trình duyệt này.');
      })
      .catch(() => {
        if (draftRevision.current === revision)
          setDraftStatus(
            'Không thể lưu bản nháp trên trình duyệt này. Bạn vẫn có thể lưu buổi luyện viết vào tài khoản.',
          );
      });
  }, [draftReady, draftKey, alphabet, character, strokes, guide]);

  const history = useQuery({
    queryKey: ['writing'],
    queryFn: () =>
      api<{ id: string; character: string; createdAt: string; strokes: string }[]>('/writing'),
  });

  function paint(draft?: Point[]) {
    const c = canvas.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, 400, 400);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = document.documentElement.dataset.theme === 'dark' ? '#eae6df' : '#343b35';
    ctx.lineWidth = 5;
    for (const stroke of [...strokes, ...(draft ? [draft] : [])]) {
      if (!stroke.length) continue;
      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);
      for (const point of stroke.slice(1)) ctx.lineTo(point.x, point.y);
      if (stroke.length === 1) ctx.lineTo(stroke[0].x + 0.1, stroke[0].y);
      ctx.stroke();
    }
  }

  useEffect(() => {
    paint();
    const observer = new MutationObserver(() => paint());
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    });
    return () => observer.disconnect();
  }, [strokes, character]);

  const choose = (c: string) => {
    setCharacter(c);
    setStrokes([]);
    current.current = null;
  };

  const save = async () => {
    if (!strokes.length) return;
    setSaving(true);
    try {
      await post('/writing', { character, strokes });
      void client.invalidateQueries({ queryKey: ['writing'] });
      void client.invalidateQueries({ queryKey: ['dashboard'] });
      void client.invalidateQueries({ queryKey: ['leaderboard-current'] });
      notify('Đã lưu buổi luyện viết.');
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  // Filtered kanji list based on current level and search input
  const filteredKanji = useMemo(() => {
    if (!jlptData?.byLevel[jlptLevel]) return [];
    const list: JlptKanjiSummary[] = jlptData.byLevel[jlptLevel] || [];
    const q = kanjiSearch.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (k: JlptKanjiSummary) =>
        k.character.includes(q) ||
        k.vietnameseNames?.some((v: string) => v.toLowerCase().includes(q)) ||
        k.readings?.some((r: string) => r.toLowerCase().includes(q)) ||
        k.meanings?.some((m: string) => m.toLowerCase().includes(q)),
    );
  }, [jlptData, jlptLevel, kanjiSearch]);

  if (!draftReady) return <p role="status">Đang mở bản nháp…</p>;

  return (
    <>
      {!practiceCharacter && (
        <PageHeader
          eyebrow="ĐỂ BÀN TAY GHI NHỚ"
          title="Chậm lại cùng một nét chữ."
          description="Luyện viết bảng chữ cái Kana và toàn bộ 2.220 chữ Kanji JLPT N5 đến N1 kèm thứ tự nét chuẩn xác."
        />
      )}
      <p className="muted" role="status">
        {draftStatus} Nhấn “Lưu bài viết” để lưu vào tài khoản trên máy chủ.
      </p>

      <div className={practiceCharacter ? 'radical-writing' : 'writing-layout'}>
        {!practiceCharacter && (
          <section className="panel character-picker">
            {/* Main Category Tabs: Kana vs Kanji */}
            <div className="tabs" style={{ marginBottom: '12px' }}>
              <button
                className={category === 'kanji' ? 'active' : ''}
                onClick={() => setCategory('kanji')}
              >
                Kanji JLPT (2.220 chữ)
              </button>
              <button
                className={category === 'kana' ? 'active' : ''}
                onClick={() => setCategory('kana')}
              >
                Bảng chữ cái Kana
              </button>
            </div>

            {category === 'kana' ? (
              <>
                <div className="tabs" style={{ marginBottom: '10px' }}>
                  {Object.keys(alphabets).map((a) => (
                    <button
                      className={alphabet === a ? 'active' : ''}
                      key={a}
                      onClick={() => {
                        setAlphabet(a);
                        choose(alphabets[a][0]);
                      }}
                    >
                      {a}
                    </button>
                  ))}
                </div>
                <p className="mobile-picker-hint">Vuốt trong bảng để chọn thêm chữ.</p>
                <div className="character-grid" role="group" aria-label="Chọn chữ Kana luyện viết">
                  {alphabets[alphabet].map((c) => (
                    <button
                      className={character === c ? 'selected' : ''}
                      key={c}
                      onClick={() => choose(c)}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                {/* Level selector: N5 -> N1 */}
                <div className="tabs wrap" style={{ marginBottom: '10px' }}>
                  {(['N5', 'N4', 'N3', 'N2', 'N1'] as const).map((lvl) => {
                    const count = jlptData?.byLevel[lvl]?.length || 0;
                    return (
                      <button
                        className={jlptLevel === lvl ? 'active' : ''}
                        key={lvl}
                        onClick={() => {
                          setJlptLevel(lvl);
                          const first = jlptData?.byLevel[lvl]?.[0]?.character;
                          if (first) choose(first);
                        }}
                      >
                        {lvl} {count ? `(${count})` : ''}
                      </button>
                    );
                  })}
                </div>

                {/* Search input for Kanji */}
                <div style={{ position: 'relative', marginBottom: '10px' }}>
                  <input
                    type="search"
                    placeholder="Lọc theo chữ hoặc âm Hán-Việt (vd: nhật, học, 日)..."
                    value={kanjiSearch}
                    onChange={(e) => setKanjiSearch(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 12px 8px 32px',
                      borderRadius: '8px',
                      border: '1px solid var(--line)',
                      background: 'var(--surface)',
                      fontSize: '13px',
                    }}
                  />
                  <Search
                    size={15}
                    style={{
                      position: 'absolute',
                      left: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      color: 'var(--muted)',
                    }}
                  />
                </div>

                <div
                  className="character-grid"
                  role="group"
                  aria-label="Chọn chữ Kanji luyện viết"
                  style={{ maxHeight: '360px', overflowY: 'auto' }}
                >
                  {filteredKanji.map((k: JlptKanjiSummary) => (
                    <button
                      className={character === k.character ? 'selected' : ''}
                      key={k.character}
                      onClick={() => choose(k.character)}
                      title={`${k.character} (${k.vietnameseNames?.join(', ') || ''}) - ${k.strokes ?? '?'} nét`}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '2px',
                        padding: '6px 2px',
                      }}
                    >
                      <span style={{ fontSize: '20px', lineHeight: 1.1 }}>{k.character}</span>
                      <span
                        style={{
                          fontSize: '10px',
                          color: 'var(--muted)',
                          textTransform: 'uppercase',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: '100%',
                        }}
                      >
                        {k.vietnameseNames?.[0] || ''}
                      </span>
                    </button>
                  ))}
                  {jlptLoading ? (
                    <p
                      role="status"
                      className="muted"
                      style={{ gridColumn: '1 / -1', padding: '24px 0', textAlign: 'center' }}
                    >
                      Đang tải danh sách chữ Kanji…
                    </p>
                  ) : filteredKanji.length === 0 ? (
                    <p
                      className="muted small-text"
                      style={{ gridColumn: '1 / -1', padding: '16px 0', textAlign: 'center' }}
                    >
                      Không tìm thấy chữ Kanji phù hợp.
                    </p>
                  ) : null}
                </div>
              </>
            )}

            <div className="writing-tip">
              <PenLine size={18} />
              <p>Quan sát hình dạng, khoảng cách và sự cân đối của từng nét.</p>
            </div>
          </section>
        )}

        {/* Canvas writing surface */}
        <section className="panel canvas-panel">
          <div className="section-heading wrap" style={{ alignItems: 'center', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h2 style={{ margin: 0 }}>Luyện chữ 「{character}」</h2>
              <AudioButton text={character} />
            </div>

            {isKanji && kanjiInfo && (
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {kanjiInfo.jlpt && <span className="tag green">JLPT {kanjiInfo.jlpt}</span>}
                {kanjiInfo.vietnameseNames?.length > 0 && (
                  <span className="tag" style={{ fontWeight: 600 }}>
                    Hán-Việt: {kanjiInfo.vietnameseNames.join(', ')}
                  </span>
                )}
                {kanjiInfo.strokes && <span className="tag">{kanjiInfo.strokes} nét</span>}
              </div>
            )}
          </div>

          {/* Kanji metadata summary */}
          {isKanji && kanjiInfo && (
            <div
              style={{
                fontSize: '13px',
                color: 'var(--muted)',
                marginBottom: '10px',
                lineHeight: 1.5,
              }}
            >
              {kanjiInfo.readings?.length > 0 && (
                <div>
                  <strong>Âm đọc:</strong> {kanjiInfo.readings.slice(0, 5).join(' ・ ')}
                </div>
              )}
              {kanjiInfo.meanings?.length > 0 && (
                <div>
                  <strong>Nghĩa:</strong> {kanjiInfo.meanings.slice(0, 4).join('; ')}
                </div>
              )}
            </div>
          )}

          <div className="drawing-surface">
            {guide && (
              <span aria-hidden="true" className="trace-character">
                {character}
              </span>
            )}
            <div className="guide-lines" />
            <canvas
              ref={canvas}
              width={400}
              height={400}
              aria-label={'Vùng vẽ chữ ' + character}
              onPointerDown={(e) => {
                const box = e.currentTarget.getBoundingClientRect();
                e.currentTarget.setPointerCapture(e.pointerId);
                current.current = [
                  {
                    x: ((e.clientX - box.left) * 400) / box.width,
                    y: ((e.clientY - box.top) * 400) / box.height,
                  },
                ];
                paint(current.current);
              }}
              onPointerMove={(e) => {
                if (!current.current) return;
                const box = e.currentTarget.getBoundingClientRect();
                current.current.push({
                  x: Math.max(0, Math.min(400, ((e.clientX - box.left) * 400) / box.width)),
                  y: Math.max(0, Math.min(400, ((e.clientY - box.top) * 400) / box.height)),
                });
                paint(current.current);
              }}
              onPointerUp={() => {
                if (current.current) {
                  setStrokes([...strokes, current.current]);
                  current.current = null;
                }
              }}
              onPointerCancel={() => {
                current.current = null;
                paint();
              }}
            />
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '8px',
              marginTop: '10px',
            }}
          >
            <label className="checkbox-label" style={{ margin: 0 }}>
              <input type="checkbox" checked={guide} onChange={(e) => setGuide(e.target.checked)} />
              Hiện chữ mẫu
            </label>

            {isKanji && (
              <div className="inline-actions" style={{ gap: '10px', fontSize: '13px' }}>
                <Link className="text-link" to={'/kanji/' + encodeURIComponent(character)}>
                  Bộ thủ & cấu tạo
                </Link>
                <span>·</span>
                <Link className="text-link" to={'/dictionary?q=' + encodeURIComponent(character)}>
                  Tra từ điển
                </Link>
              </div>
            )}
          </div>

          <div className="canvas-actions" style={{ marginTop: '12px' }}>
            <Button
              variant="secondary"
              onClick={() => setStrokes(strokes.slice(0, -1))}
              disabled={!strokes.length}
            >
              <Undo2 size={16} />
              Lùi nét
            </Button>
            <Button variant="secondary" onClick={() => setStrokes([])} disabled={!strokes.length}>
              <RotateCcw size={16} />
              Viết lại
            </Button>
            <Button disabled={!strokes.length || saving} onClick={() => void save()}>
              <Check size={16} />
              Lưu bài viết
            </Button>
          </div>

          {/* Inline Stroke Order Component for immediate reference */}
          {isKanji && (
            <div style={{ marginTop: '16px', borderTop: '1px solid var(--line)', paddingTop: '12px' }}>
              <StrokeOrder key={character} character={character} />
            </div>
          )}

          <p className="muted small-text" style={{ marginTop: '12px' }}>
            Đây là luyện viết tự đánh giá. Hãy kết hợp với bảng thứ tự nét ở trên để luyện các nét
            thuận và chuẩn xác nhất.
          </p>
        </section>
      </div>

      <section className="panel spaced">
        <h2>Những chữ bạn đã luyện</h2>
        <div className="writing-history">
          {history.data?.length ? (
            history.data
              .filter((h) => !practiceCharacter || h.character === practiceCharacter)
              .map((h) => (
                <button
                  key={h.id}
                  onClick={() => {
                    const matchingAlphabet = Object.keys(alphabets).find((name) =>
                      alphabets[name].includes(h.character),
                    );
                    if (matchingAlphabet) {
                      setAlphabet(matchingAlphabet);
                      setCategory('kana');
                    } else if (/\p{Script=Han}/u.test(h.character)) {
                      setCategory('kanji');
                    }
                    setCharacter(h.character);
                    setStrokes(JSON.parse(h.strokes) as Point[][]);
                  }}
                >
                  <strong>{h.character}</strong>
                  <small>{new Date(h.createdAt).toLocaleDateString('vi')}</small>
                </button>
              ))
          ) : (
            <p className="muted">Lưu bài viết đầu tiên để bắt đầu nhật ký.</p>
          )}
        </div>
      </section>
    </>
  );
}
