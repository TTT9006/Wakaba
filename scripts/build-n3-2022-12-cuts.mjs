import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ffmpegPath = 'D:\\Demo\\node_modules\\@ffmpeg-installer\\win32-x64\\ffmpeg.exe';
const src = 'C:\\Users\\Hoang Vuong\\Desktop\\Tiếng nhật\\đề và nghe\\N3\\n3\\n3\\12-2022\\Nghe N3 T12-2022 Bản Thu Âm (録音データ).m4a';
const outDir = path.resolve('public/audio/jlpt/n3-2022-12');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// 28 questions
export const cuts202212 = [
  // Mondai 1 (6 Qs)
  { id: 'q01', start: 72.0, end: 160.0 },
  { id: 'q02', start: 160.0, end: 232.0 },
  { id: 'q03', start: 232.0, end: 314.0 },
  { id: 'q04', start: 314.0, end: 396.0 },
  { id: 'q05', start: 396.0, end: 480.0 },
  { id: 'q06', start: 480.0, end: 540.0 },

  // Mondai 2 (6 Qs)
  { id: 'q07', start: 605.0, end: 690.0 },
  { id: 'q08', start: 690.0, end: 775.0 },
  { id: 'q09', start: 775.0, end: 875.0 },
  { id: 'q10', start: 875.0, end: 968.0 },
  { id: 'q11', start: 968.0, end: 1060.0 },
  { id: 'q12', start: 1060.0, end: 1148.0 },

  // Mondai 3 (3 Qs)
  { id: 'q13', start: 1150.0, end: 1276.0 },
  { id: 'q14', start: 1276.0, end: 1432.0 },
  { id: 'q15', start: 1432.0, end: 1492.0 },

  // Mondai 4 (4 Qs)
  { id: 'q16', start: 1493.0, end: 1525.0 },
  { id: 'q17', start: 1525.0, end: 1556.0 },
  { id: 'q18', start: 1556.0, end: 1589.0 },
  { id: 'q19', start: 1589.0, end: 1647.0 },

  // Mondai 5 (9 Qs)
  { id: 'q20', start: 1650.0, end: 1704.0 },
  { id: 'q21', start: 1704.0, end: 1731.0 },
  { id: 'q22', start: 1731.0, end: 1759.0 },
  { id: 'q23', start: 1759.0, end: 1788.0 },
  { id: 'q24', start: 1788.0, end: 1816.0 },
  { id: 'q25', start: 1816.0, end: 1843.0 },
  { id: 'q26', start: 1843.0, end: 1855.0 },
  { id: 'q27', start: 1855.0, end: 1865.0 },
  { id: 'q28', start: 1865.0, end: 1874.8 },
];

console.log(`Slicing N3 2022-12 (${cuts202212.length} questions)...`);
cuts202212.forEach((c) => {
  const dur = c.end - c.start;
  const outFile = path.join(outDir, `${c.id}.mp3`);
  const cmd = `"${ffmpegPath}" -y -ss ${c.start.toFixed(2)} -i "${src}" -t ${dur.toFixed(2)} -c:a libmp3lame -b:a 128k "${outFile}" -loglevel error`;
  execSync(cmd);
  const sz = fs.statSync(outFile).size;
  console.log(` - ${c.id}: ${c.start}s -> ${c.end}s (${dur.toFixed(1)}s, ${(sz / 1024).toFixed(0)} KB)`);
});

console.log('✔ Finished slicing all 28 questions for N3 2022-12!');
