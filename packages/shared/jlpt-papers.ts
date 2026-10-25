import type { JlptLevel, SkillLevel, JlptPaper, JlptQuestion, JlptSummary } from './jlpt-types';
import { words, context, paraphrases, usage } from './jlpt-vocabulary';
import { grammarChoices, sentenceParts, textGrammar } from './jlpt-grammar';
import { reading } from './jlpt-reading';
import { listeningItems } from './jlpt-listening';

function makePaper(level: SkillLevel): JlptPaper {
  const questions: JlptQuestion[] = [];
  const add = (
    category: JlptQuestion['category'],
    group: string,
    prompt: string,
    choices: string[],
    explanation: string,
    extra: Partial<JlptQuestion> = {},
  ) => {
    // Stable for a saved paper, without a repeating answer-position pattern.
    let seed = 2166136261;
    for (const character of `${level}:${questions.length}:${prompt}`) {
      seed = Math.imul(seed ^ character.charCodeAt(0), 16777619) >>> 0;
    }
    const options = [...choices];
    for (let i = options.length - 1; i > 0; i--) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const j = Math.floor((seed / 4294967296) * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }
    const question: JlptQuestion = {
      id: `${level.toLowerCase()}-${questions.length + 1}`,
      type: 'choice',
      category,
      group,
      prompt,
      options,
      answer: choices[0],
      explanation,
      annotationDisabled: true,
      ...extra,
    };
    if (question.audioOptions) {
      question.transcript += '\n' + options.map((o, i) => `${i + 1}番。${o}`).join('。\n');
      question.explanation += ` Đáp án: ${choices[0]}`;
      question.answer = String(options.indexOf(choices[0]) + 1);
      question.options = options.map((_, i) => String(i + 1));
    }
    questions.push(question);
  };
  const [readCount, spellCount] = ({
    N5: [7, 5],
    N4: [7, 5],
    N3: [8, 6],
    N2: [5, 5],
  } as Record<SkillLevel, [number, number]>)[level];
  const bank = words[level];
  bank.slice(0, readCount).forEach(([word, kana], i) =>
    add(
      'vocabulary',
      'Cách đọc Kanji',
      `「${word}」の読み方はどれですか。`,
      [
        kana,
        ...bank
          .filter((_, j) => j !== i)
          .slice(0, 3)
          .map((row) => row[1]),
      ],
      `${word} đọc là ${kana}.`,
    ),
  );
  bank.slice(readCount, readCount + spellCount).forEach(([word, kana]) =>
    add(
      'vocabulary',
      'Cách viết',
      `「${kana}」を漢字で書くと、どれですか。`,
      [
        word,
        ...bank
          .filter((row) => row[0] !== word)
          .slice(-3)
          .map((row) => row[0]),
      ],
      `${kana} được viết là ${word}.`,
    ),
  );
  if (level === 'N2')
    for (const row of [
      ['資料をもう一度確認することを「（　）確認」という。', '再', '無', '非', '未'],
      ['可能ではないことを「（　）可能」という。', '不', '再', '新', '全'],
      ['公式ではない会議を「（　）公式の会議」という。', '非', '再', '旧', '各'],
      ['料金がかからないことを「（　）料」という。', '無', '不', '再', '最'],
      ['手続きを簡単にすることを「簡素（　）」という。', '化', '性', '率', '感'],
    ])
      add('vocabulary', 'Cấu tạo từ', row[0], row.slice(1), `Ghép thành từ phù hợp: ${row[1]}.`);
  for (const row of context[level])
    add(
      'vocabulary',
      'Từ trong ngữ cảnh',
      row[0],
      row.slice(1),
      `Trong ngữ cảnh này dùng 「${row[1]}」.`,
    );
  for (const row of paraphrases[level])
    add(
      'vocabulary',
      'Diễn đạt tương đương',
      `意味が最も近い文を選んでください。\n${row[0]}`,
      row.slice(1),
      `Câu tương đương: ${row[1]}`,
    );
  if (level !== 'N5')
    for (const row of usage[level])
      add(
        'vocabulary',
        'Cách dùng từ',
        `「${row[0]}」の使い方として最もよい文を選んでください。`,
        row.slice(1),
        `Cách dùng phù hợp: ${row[1]}`,
      );
  for (const row of grammarChoices[level])
    add(
      'grammar',
      'Chọn mẫu ngữ pháp',
      row[0],
      row.slice(1),
      `Điền 「${row[1]}」: ${row[0].replace('（　）', row[1])}`,
    );
  for (const chunks of sentenceParts[level])
    add(
      'grammar',
      'Sắp xếp câu ★',
      '正しい文になるように並べたとき、★に入るものを選んでください。\n＿＿　＿＿　★　＿＿',
      [chunks[2], chunks[0], chunks[3], chunks[1]],
      `Thứ tự hoàn chỉnh: ${chunks.join('')}`,
    );
  const text = textGrammar[level];
  for (const row of text.items)
    add(
      'grammar',
      'Ngữ pháp văn bản',
      `文章の（${row[0]}）に入るものを選んでください。`,
      row.slice(1),
      `Chỗ (${row[0]}) dùng 「${row[1]}」.`,
      { passage: text.passage },
    );
  for (const bundle of reading[level])
    for (const row of bundle.items)
      add(
        'reading',
        bundle.group,
        row[0],
        row.slice(1),
        `Thông tin và lập luận trong đoạn dẫn đến: ${row[1]}`,
        { passage: bundle.passage },
      );
  for (const item of listeningItems(level))
    add(
      'listening',
      item.group,
      item.prompt,
      item.choices,
      `Nội dung nghe dẫn đến lựa chọn: ${item.choices[0]}`,
      {
        transcript: item.script,
        audioOptions: item.audioOptions,
        audioUrl: `/api/tts?text=${encodeURIComponent(item.script)}`,
      },
    );
  const minutes = ({
    N5: [20, 40, 30],
    N4: [25, 55, 35],
    N3: [30, 70, 40],
    N2: [105, 50],
  } as Record<SkillLevel, number[]>)[level];
  const sections =
    level === 'N2'
      ? [
          {
            id: 'knowledge-reading',
            title: '言語知識・読解 — Kiến thức ngôn ngữ & Đọc hiểu',
            minutes: minutes[0],
            questions: questions.filter((q) => q.category !== 'listening'),
          },
          {
            id: 'listening',
            title: '聴解 — Nghe hiểu',
            minutes: minutes[1],
            questions: questions.filter((q) => q.category === 'listening'),
          },
        ]
      : [
          {
            id: 'vocabulary',
            title: '文字・語彙 — Chữ & Từ vựng',
            minutes: minutes[0],
            questions: questions.filter((q) => q.category === 'vocabulary'),
          },
          {
            id: 'grammar-reading',
            title: '文法・読解 — Ngữ pháp & Đọc hiểu',
            minutes: minutes[1],
            questions: questions.filter((q) => ['grammar', 'reading'].includes(q.category)),
          },
          {
            id: 'listening',
            title: '聴解 — Nghe hiểu',
            minutes: minutes[2],
            questions: questions.filter((q) => q.category === 'listening'),
          },
        ];
  return {
    id: `jlpt-${level.toLowerCase()}-01`,
    title: `JLPT ${level} · Đề luyện 01`,
    level,
    sections,
  };
}
import { jlptN5Paper202407 } from './jlpt-papers-n5-2024-07';
import { jlptN5Paper202112 } from './jlpt-papers-n5-2021-12';
import { jlptN5Paper2018 } from './jlpt-papers-n5-2018';
import { jlptN5Paper201707 } from './jlpt-papers-n5-2017-07';
import { jlptN5Paper201307 } from './jlpt-papers-n5-2013-07';
import { jlptN5Paper201212 } from './jlpt-papers-n5-2012-12';
import { jlptN5Paper20102011 } from './jlpt-papers-n5-2010-2011';
import { jlptN4Paper202407 } from './jlpt-papers-n4-2024-07';
import { jlptN4Paper202112 } from './jlpt-papers-n4-2021-12';
import { jlptN4Paper202107 } from './jlpt-papers-n4-2021-07';
import { jlptN4Paper201707 } from './jlpt-papers-n4-2017-07';
import { jlptN3Paper202307 } from './jlpt-papers-n3-2023-07';
import { jlptN3Paper202212 } from './jlpt-papers-n3-2022-12';
import { jlptN3Paper202207 } from './jlpt-papers-n3-2022-07';
import { jlptN3Paper202112 } from './jlpt-papers-n3-2021-12';
import { jlptN3Paper202107 } from './jlpt-papers-n3-2021-07';
import { jlptN3Paper201812 } from './jlpt-papers-n3-2018-12';
import { jlptN2Paper202307 } from './jlpt-papers-n2-2023-07';
import { jlptN2Paper202207 } from './jlpt-papers-n2-2022-07';
import { jlptN2Paper202112 } from './jlpt-papers-n2-2021-12';
import { jlptN1Paper202307 } from './jlpt-papers-n1-2023-07';
import { jlptN1Paper202212 } from './jlpt-papers-n1-2022-12';
import { jlptN1Paper202207 } from './jlpt-papers-n1-2022-07';

export const jlptPracticePapers = (['N5', 'N4', 'N3', 'N2'] as const).map(makePaper);
export const jlptOfficialPapers: JlptPaper[] = [
  jlptN5Paper202407,
  jlptN5Paper202112,
  jlptN5Paper2018,
  jlptN5Paper201707,
  jlptN5Paper201307,
  jlptN5Paper201212,
  jlptN5Paper20102011,
  jlptN4Paper202407,
  jlptN4Paper202112,
  jlptN4Paper202107,
  jlptN4Paper201707,
  jlptN3Paper202307,
  jlptN3Paper202212,
  jlptN3Paper202207,
  jlptN3Paper202112,
  jlptN3Paper202107,
  jlptN3Paper201812,
  jlptN2Paper202307,
  jlptN2Paper202207,
  jlptN2Paper202112,
  jlptN1Paper202307,
  jlptN1Paper202212,
  jlptN1Paper202207,
];
export const jlptPapers: JlptPaper[] = [...jlptPracticePapers, ...jlptOfficialPapers];
export function paperSummary(p: JlptPaper): JlptSummary {
  return {
    id: p.id,
    title: p.title,
    level: p.level,
    kind: 'jlpt',
    isOfficial: p.isOfficial,
    keySource: p.keySource || p.answerSource,
    isPracticeExam: p.isPracticeExam,
    isDuplicateAudio: p.isDuplicateAudio,
    duplicateNote: p.duplicateNote,
    description:
      p.description ?? 'Đề tự biên soạn, đủ phần và thời gian thi; không phải đề JLPT chính thức.',
    total: p.sections.reduce((n, s) => n + s.questions.length, 0),
    minutes: p.sections.reduce((n, s) => n + s.minutes, 0),
    sections: p.sections.map((s) => ({
      id: s.id,
      title: s.title,
      minutes: s.minutes,
      count: s.questions.length,
    })),
  };
}
