import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ffmpegPath = 'D:\\Demo\\node_modules\\@ffmpeg-installer\\win32-x64\\ffmpeg.exe';
const src = 'c:\\Users\\Hoang Vuong\\Desktop\\Tiếng nhật\\đề và nghe\\N4\\n4\\n4\\12-2021\\Nghe N4 T12-2021 bản chuẩn Yuuki Bùi.mp3';
const outDir = path.resolve('public/audio/jlpt/n4-2021-12');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const cuts = [
  // Mondai 1 (8 Qs)
  { id: 'q01', start: 204.0, end: 263.0 },
  { id: 'q02', start: 263.0, end: 337.0 },
  { id: 'q03', start: 337.0, end: 400.0 },
  { id: 'q04', start: 400.0, end: 480.0 },
  { id: 'q05', start: 480.0, end: 575.0 },
  { id: 'q06', start: 575.0, end: 634.0 },
  { id: 'q07', start: 634.0, end: 721.0 },
  { id: 'q08', start: 721.0, end: 807.0 },

  // Mondai 2 (7 Qs)
  { id: 'q09', start: 954.0, end: 1040.0 },
  { id: 'q10', start: 1040.0, end: 1141.0 },
  { id: 'q11', start: 1141.0, end: 1219.0 },
  { id: 'q12', start: 1219.0, end: 1329.0 },
  { id: 'q13', start: 1329.0, end: 1452.0 },
  { id: 'q14', start: 1452.0, end: 1544.0 },
  { id: 'q15', start: 1544.0, end: 1693.0 },

  // Mondai 3 (5 Qs)
  { id: 'q16', start: 1778.0, end: 1814.0 },
  { id: 'q17', start: 1814.0, end: 1854.0 },
  { id: 'q18', start: 1854.0, end: 1898.0 },
  { id: 'q19', start: 1898.0, end: 1935.0 },
  { id: 'q20', start: 1935.0, end: 1977.0 },

  // Mondai 4 (8 Qs)
  { id: 'q21', start: 2063.0, end: 2096.0 },
  { id: 'q22', start: 2096.0, end: 2128.0 },
  { id: 'q23', start: 2128.0, end: 2158.0 },
  { id: 'q24', start: 2158.0, end: 2188.0 },
  { id: 'q25', start: 2188.0, end: 2218.0 },
  { id: 'q26', start: 2218.0, end: 2248.0 },
  { id: 'q27', start: 2248.0, end: 2285.0 },
  { id: 'q28', start: 2285.0, end: 2320.0 },
];

console.log(`Slicing ${cuts.length} audio files to ${outDir}...`);

for (const c of cuts) {
  const outFile = path.join(outDir, `${c.id}.mp3`);
  const dur = c.end - c.start;
  const cmd = `"${ffmpegPath}" -y -ss ${c.start} -t ${dur} -i "${src}" -acodec copy "${outFile}"`;
  execSync(cmd, { stdio: 'ignore' });
  const stat = fs.statSync(outFile);
  console.log(`✓ Sliced ${c.id}.mp3: ${c.start}s -> ${c.end}s (${dur}s, ${stat.size} bytes)`);
}

console.log('🎉 Done slicing N4 12/2021 audio!');
