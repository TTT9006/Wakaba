import { readFile } from 'node:fs/promises';
import path from 'node:path';
import type { Radical, KanjiInfo, JlptKanjiData } from '../../../packages/shared/kanji';

let data: Promise<{ radicals: Radical[]; characters: Record<string, KanjiInfo> }> | undefined;
let jlpt: Promise<JlptKanjiData> | undefined;

export function kanjiData(): Promise<{
  radicals: Radical[];
  characters: Record<string, KanjiInfo>;
}> {
  return (data ??= Promise.all(
    ['radicals', 'characters'].map((f) =>
      readFile(path.resolve('data/kanji', f + '.json'), 'utf8'),
    ),
  ).then(([r, k]) => ({ radicals: JSON.parse(r), characters: JSON.parse(k) })));
}

export function jlptKanjiData(): Promise<JlptKanjiData> {
  return (jlpt ??= readFile(path.resolve('data/kanji/jlpt.json'), 'utf8').then((j) =>
    JSON.parse(j),
  ));
}

export async function kanjiStrokes(character: string) {
  if ([...character].length !== 1) return null;
  const file = character.codePointAt(0)!.toString(16) + '.json';
  try {
    return JSON.parse(await readFile(path.resolve('data/kanji/strokes', file), 'utf8')) as {
      character: string;
      paths: string[];
      sourceCharacter: string;
    };
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw e;
  }
}

export async function searchKanji(query: string): Promise<KanjiInfo[]> {
  const q = query.trim();
  if (!q) return [];
  const { characters } = await kanjiData();
  const jlptData = await jlptKanjiData().catch(() => null);

  // If query contains Kanji characters (e.g. "日", "日本", "勉強")
  const kanjiChars = [...new Set([...q].filter((c) => /\p{Script=Han}/u.test(c)))];
  if (kanjiChars.length > 0) {
    const list: KanjiInfo[] = [];
    for (const c of kanjiChars) {
      const info = characters[c];
      if (info) {
        list.push({
          ...info,
          jlpt: jlptData?.byCharacter[c]?.level || info.jlpt || null,
        });
      }
    }
    return list;
  }

  // Otherwise, match against Sino-Vietnamese (vietnameseNames), readings (Onyomi/Kunyomi), or English meanings
  const qLower = q.toLowerCase();
  const results: { info: KanjiInfo; score: number }[] = [];

  for (const c of Object.values(characters)) {
    let score = 0;
    const jlptLevel = jlptData?.byCharacter[c.character]?.level || c.jlpt;

    const matchViExact = c.vietnameseNames?.some((v) => v.toLowerCase() === qLower);
    const matchViPartial = c.vietnameseNames?.some((v) => v.toLowerCase().includes(qLower));
    if (matchViExact) score += 120;
    else if (matchViPartial) score += 60;

    const matchReading = c.readings?.some(
      (r) => r.toLowerCase() === qLower || r.replace(/[.-]/g, '').toLowerCase() === qLower,
    );
    if (matchReading) score += 90;

    const matchMeaning = c.meanings?.some((m) => m.toLowerCase().includes(qLower));
    if (matchMeaning) score += 40;

    if (score > 0) {
      if (jlptLevel === 'N5') score += 30;
      else if (jlptLevel === 'N4') score += 24;
      else if (jlptLevel === 'N3') score += 18;
      else if (jlptLevel === 'N2') score += 12;
      else if (jlptLevel === 'N1') score += 6;

      results.push({
        info: { ...c, jlpt: jlptLevel || null },
        score,
      });
    }
  }

  results.sort((a, b) => b.score - a.score);
  return results.slice(0, 10).map((r) => r.info);
}
