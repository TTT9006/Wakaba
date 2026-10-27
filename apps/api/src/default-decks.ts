import { toHiragana, toKatakana, toRomaji } from 'wanakana';
import { db } from './db';
import { kanjiData } from './kanji';

const basic =
  'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをん';
const voiced = 'がぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽ';
const combined = ['き', 'し', 'ち', 'に', 'ひ', 'み', 'り', 'ぎ', 'じ', 'び', 'ぴ'].flatMap(
  (prefix) => ['ゃ', 'ゅ', 'ょ'].map((suffix) => prefix + suffix),
);

// Vietnamese glosses are curated for these elementary characters; source readings,
// English meanings and classical radical assignments come from local KANJIDIC2.
const themes = [
  [
    'Thiên nhiên',
    '日:mặt trời; ngày|月:mặt trăng; tháng|火:lửa|水:nước|木:cây; gỗ|金:vàng; kim loại|土:đất|山:núi|川:sông|海:biển|雨:mưa|空:bầu trời; trống rỗng',
  ],
  [
    'Số đếm',
    '一:một|二:hai|三:ba|四:bốn|五:năm|六:sáu|七:bảy|八:tám|九:chín|十:mười|百:một trăm|千:một nghìn|万:mười nghìn',
  ],
  [
    'Con người và cơ thể',
    '人:người|子:con; trẻ em|女:phụ nữ|男:nam giới|父:cha|母:mẹ|口:miệng|目:mắt|耳:tai|手:tay|足:chân|心:trái tim; tâm trí',
  ],
  [
    'Trường học',
    '学:học|校:trường học|生:sống; sinh ra|先:trước|本:sách; gốc|文:văn; câu văn|字:chữ|名:tên|書:viết|読:đọc|語:ngôn ngữ; từ|聞:nghe',
  ],
  [
    'Thời gian và phương hướng',
    '年:năm|時:giờ; thời gian|分:phút; phần|今:bây giờ|毎:mỗi|午:buổi trưa|前:trước|後:sau|上:trên|下:dưới|左:trái|右:phải|東:đông|西:tây|南:nam|北:bắc',
  ],
  [
    'Động vật và cây cối',
    '犬:chó|猫:mèo|鳥:chim|魚:cá|馬:ngựa|牛:bò|羊:cừu|虫:côn trùng|花:hoa|草:cỏ|竹:tre; trúc|林:rừng thưa|森:rừng',
  ],
] as const;

export async function defaultDecks() {
  const { characters, radicals } = await kanjiData();
  const kana = [
    ...[...basic].map((text) => ({ text, group: 'Âm cơ bản' })),
    ...[...voiced].map((text) => ({ text, group: 'Âm đục / bán đục' })),
    ...combined.map((text) => ({ text, group: 'Âm ghép' })),
  ];
  return [
    ...(['Hiragana', 'Katakana'] as const).map((name) => ({
      name,
      description: 'Bộ mặc định · 46 âm cơ bản, 25 âm đục/bán đục và 33 âm ghép.',
      cards: kana.map(({ text, group }) => ({
        japanese: name === 'Katakana' ? toKatakana(text) : text,
        reading: text,
        meaning: `Âm ${toRomaji(text)}`,
        materialType: 'kana',
        note:
          `${group}.` +
          (text === 'を' ? ' Khi làm trợ từ thường đọc là o.' : '') +
          (text === 'ぢ' || text === 'づ'
            ? ' Trong tiếng Nhật chuẩn hiện đại thường phát âm như じ / ず tương ứng.'
            : ''),
        english: '',
      })),
    })),
    ...themes.map(([theme, entries]) => ({
      name: `Kanji · ${theme}`,
      description:
        'Bộ mặc định · Mỗi thẻ giới thiệu một cách đọc; cách đọc thay đổi theo từ. Bộ thủ dùng để tra cứu, không giải thích nguồn gốc chữ. Dữ liệu: KANJIDIC2 (EDRDG, CC BY-SA 4.0), Unicode.',
      cards: entries.split('|').map((entry) => {
        const [japanese, meaning] = entry.split(':');
        const info = characters[japanese];
        const radical = radicals.find((r) => r.id === info?.radicalId);
        const reading = info?.readings.find((r) => !/[.\-]/.test(r));
        if (!info || !radical || !reading)
          throw new Error(`Missing default card metadata: ${japanese}`);
        return {
          japanese,
          meaning,
          reading: toHiragana(reading),
          materialType: 'kanji',
          english: info.meanings.join('; '),
          note:
            `Bộ thủ: ${info.radicalForm && info.radicalForm !== radical.character ? `${info.radicalForm} · ` : ''}${radical.character} (#${radical.id})` +
            `${radical.vietnameseNames.length ? ' · ' + radical.vietnameseNames.join(' / ') : ''}` +
            ` — ${radical.vietnameseMeaning || radical.name}. Chữ có ${info.strokes ?? '?'} nét.`,
        };
      }),
    })),
  ];
}

// Claim the version inside the same transaction as creation: concurrent requests
// cannot create duplicates, and deleted/edited personal copies stay deleted/edited.
export async function ensureDefaultDecks(userId: string) {
  const user = await db.user.findUniqueOrThrow({ where: { id: userId } });
  if (user.defaultDeckVersion >= 1) return;
  const decks = await defaultDecks();
  await db.$transaction(async (tx) => {
    const claimed = await tx.user.updateMany({
      where: { id: userId, defaultDeckVersion: 0 },
      data: { defaultDeckVersion: 1 },
    });
    if (!claimed.count) return;
    for (const deck of decks) {
      await tx.deck.create({
        data: {
          userId,
          name: deck.name,
          description: deck.description,
          cards: { create: deck.cards },
        },
      });
    }
  });
}
