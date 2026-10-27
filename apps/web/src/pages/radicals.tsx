import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Radical, KanjiInfo } from '../../../../packages/shared/kanji';
import { normalizeVietnamese } from '../../../../packages/shared/japanese-query';
import { enrichRadicalWithVietnamese } from '../../../../packages/shared/radical-dictionary';
import { api, post } from '../services/api';
import { Button, Loading, ErrorState } from '../components/ui';
import { StrokeOrder } from '../components/stroke-order';
import { WritingWorkspace } from './writing';
import { useUI } from '../stores/ui';
export function RadicalLearning({ userId }: { userId: string }) {
  const [params, setParams] = useSearchParams(),
    [search, setSearch] = useState(''),
    [filter, setFilter] = useState('all'),
    [stroke, setStroke] = useState('all'),
    [busy, setBusy] = useState(false);
  const client = useQueryClient(),
    notify = useUI((s) => s.notify);
  const { data, error, isLoading } = useQuery({
    queryKey: ['radicals', userId],
    queryFn: async () => {
      const res = await api<Radical[]>('/radicals');
      return (res || []).map(enrichRadicalWithVietnamese);
    },
  });
  if (isLoading) return <Loading />;
  if (!data) return <ErrorState error={error} />;
  const selected = data.find((r) => r.id === Number(params.get('radical'))) || data[0];
  const forms = [
    { character: selected.character, strokes: selected.strokes },
    ...selected.variants,
  ];
  const form = forms.find((f) => f.character === params.get('form')) || forms[0];
  const choose = (id: number, character?: string) =>
    setParams({ mode: 'radicals', radical: String(id), ...(character ? { form: character } : {}) });
  const visible = data
    .filter(
      (r) =>
        (filter === 'all' || !!r.completed === (filter === 'learned')) &&
        (stroke === 'all' || String(r.strokes) === stroke) &&
        normalizeVietnamese(
          [
            r.character,
            ...r.variants.map((v) => v.character),
            r.name,
            r.vietnameseMeaning || '',
            ...(r.vietnameseMeanings || []),
            ...r.vietnameseNames,
            ...r.readings,
            r.id,
          ].join(' '),
        ).includes(normalizeVietnamese(search)),
    )
    .sort((a, b) => (a.strokes || 99) - (b.strokes || 99) || a.id - b.id);
  async function action(kind: 'progress' | 'srs') {
    setBusy(true);
    try {
      await post(
        '/radicals/' + selected.id + '/' + kind,
        kind === 'progress' ? { completed: !selected.completed } : {},
      );
      await client.invalidateQueries({ queryKey: ['radicals', userId] });
      void client.invalidateQueries({ queryKey: ['decks'] });
      void client.invalidateQueries({ queryKey: ['review'] });
      notify(kind === 'srs' ? 'Đã thêm vào bộ thẻ ôn tập.' : 'Đã lưu tiến độ bộ thủ.');
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <section className="panel radical-catalog">
        <h2>214 bộ thủ Kanji</h2>
        <div className="toolbar">
          <label>
            Tìm bộ thủ
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="水, Thủy, water, 85…"
            />
          </label>
          <label>
            Số nét
            <select value={stroke} onChange={(e) => setStroke(e.target.value)}>
              <option value="all">Tất cả</option>
              {[...new Set(data.map((r) => r.strokes).filter(Boolean))]
                .sort((a, b) => a! - b!)
                .map((n) => (
                  <option key={n} value={String(n)}>
                    {n} nét
                  </option>
                ))}
              <option value="null">Chưa có số nét</option>
            </select>
          </label>
          <label>
            Tiến độ
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">Tất cả</option>
              <option value="learned">Đã học</option>
              <option value="new">Chưa học</option>
            </select>
          </label>
        </div>
        <p>
          {visible.length} bộ thủ · {data.filter((r) => r.completed).length} đã học
        </p>
        <div className="radical-grid">
          {visible.map((r) => (
            <button
              key={r.id}
              className={selected.id === r.id ? 'selected' : ''}
              aria-pressed={selected.id === r.id}
              onClick={() => choose(r.id)}
            >
              <strong lang="ja">{r.character}</strong>
              <small>
                #{r.id} {r.completed ? '✓' : ''}
              </small>
            </button>
          ))}
        </div>
        {!visible.length && <p>Không có bộ thủ phù hợp với bộ lọc.</p>}
      </section>
      <section className="panel spaced radical-detail">
        <div>
          <span className="radical-glyph" lang="ja">
            {form.character}
          </span>
          <h2>{selected.vietnameseNames.join(' / ') || selected.name}</h2>
          <p>
            Kanji #{selected.id} ·{' '}
            {form.strokes === null
              ? 'Chưa có số nét cho dạng này'
              : form.strokes + ' nét (dạng đang chọn)'}
          </p>
          <p>Tên Hán Việt: {selected.vietnameseNames.join(', ') || 'Chưa có dữ liệu'}</p>
          <p>
            Tên bộ trong tiếng Nhật:{' '}
            {selected.readings.join('・') || 'Chưa có tên bộ được ghi nhận'}
          </p>
          <p>Cách đọc của ký tự: {selected.characterReadings.join('・') || 'Chưa có dữ liệu'}</p>
          <p>
            <strong>Nghĩa của bộ thủ:</strong>{' '}
            <span>{selected.vietnameseMeaning || selected.name}</span>
          </p>
          {selected.vietnameseMeanings && selected.vietnameseMeanings.length > 0 && (
            <p>Ý nghĩa giải thích: {selected.vietnameseMeanings.join('; ')}</p>
          )}
          <p className="muted small-text">Nghĩa tiếng Anh: {selected.name}{selected.meanings.length ? ' · ' + selected.meanings.join('; ') : ''}</p>
          <div className="inline-actions wrap" aria-label="Dạng bộ thủ">
            {forms.map((f) => (
              <Button
                key={f.character}
                variant={f.character === form.character ? 'primary' : 'secondary'}
                onClick={() => choose(selected.id, f.character)}
              >
                {f.character} · {f.strokes ?? '?'} nét
              </Button>
            ))}
          </div>
          <h3>Kanji có bộ thủ này</h3>
          <div className="inline-actions wrap">
            {selected.examples.map((k) => (
              <Link className="tag" key={k} to={'/kanji/' + encodeURIComponent(k)}>
                {k}
              </Link>
            ))}
          </div>
          <div className="inline-actions wrap spaced">
            <Button disabled={busy} onClick={() => void action('progress')}>
              {selected.completed ? 'Đánh dấu chưa học' : 'Đánh dấu hoàn thành'}
            </Button>
            <Button variant="secondary" disabled={busy} onClick={() => void action('srs')}>
              Thêm vào ôn tập SRS
            </Button>
            <Button variant="secondary" onClick={() => choose((selected.id % 214) + 1)}>
              Bộ tiếp theo
            </Button>
          </div>
        </div>
        <StrokeOrder key={form.character} character={form.character} />
      </section>
      <WritingWorkspace
        key={userId + form.character}
        userId={userId}
        practiceCharacter={form.character}
      />
      <SourceNote />
    </>
  );
}
export function SourceNote() {
  return (
    <p className="muted small-text spaced">
      Tên Hán Việt là âm đọc, không phải bản dịch nghĩa. Bộ thủ chính thức:{' '}
      <a href="https://www.edrdg.org/wiki/index.php/KANJIDIC_Project">KANJIDIC2 (CC BY-SA 4.0)</a>{' '}
      và <a href="https://www.unicode.org/Public/17.0.0/ucd/CJKRadicals.txt">Unicode 17</a>. Hình
      thể, thành phần và nét: <a href="https://kanjivg.tagaini.net/">KanjiVG (CC BY-SA 3.0)</a>. Dữ
      liệu đã trích xuất thành JSON; dạng biến thể có thể có số nét khác.
    </p>
  );
}
export function KanjiDetail() {
  const { character = '' } = useParams();
  const { data, error, isLoading } = useQuery({
    queryKey: ['kanji', character],
    queryFn: () =>
      api<KanjiInfo & { radical?: Radical }>('/kanji/' + encodeURIComponent(character)).then((d) => ({
        ...d,
        radical: d.radical ? enrichRadicalWithVietnamese(d.radical) : undefined,
      })),
  });
  if (isLoading) return <Loading />;
  if (!data) return <ErrorState error={error} />;
  return (
    <>
      <Link className="back-link" to="/writing?mode=radicals">
        ← Học bộ thủ
      </Link>
      <section className="panel radical-detail">
        <div>
          <h1 className="radical-glyph" lang="ja">
            {character}
          </h1>
          <p>{data.readings.join('・')}</p>
          <p>{data.meanings.join('; ')}</p>
          <p>{data.strokes ?? '?'} nét</p>
          <h2>Bộ thủ & cấu tạo</h2>
          {data.radical && (
            <p>
              Bộ thủ chính thức (KANJIDIC2):{' '}
              <Link className="tag" to={'/writing?mode=radicals&radical=' + data.radical.id}>
                {data.radical.character} · #{data.radical.id}
              </Link>
            </p>
          )}
          {data.radicalForm && <p>Hình thể bộ trong KanjiVG: {data.radicalForm}</p>}
          <p>Thành phần theo KanjiVG (không đồng nghĩa với bộ thủ chính thức):</p>
          <div className="inline-actions wrap">
            {data.components.map((c, i) => (
              <Link className="tag" key={i} to={'/kanji/' + encodeURIComponent(c.character)}>
                {c.character}
                {c.position ? ' · ' + c.position : ''}
              </Link>
            ))}
          </div>
          {!data.components.length && <p>Chưa có dữ liệu thành phần.</p>}
        </div>
        <StrokeOrder key={character} character={character} />
      </section>
      <SourceNote />
    </>
  );
}
