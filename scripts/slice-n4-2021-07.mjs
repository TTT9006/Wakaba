import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ffmpegPath = 'D:\\Demo\\node_modules\\@ffmpeg-installer\\win32-x64\\ffmpeg.exe';
const sourceAudio = 'c:/Users/Hoang Vuong/Desktop/Tiếng nhật/đề và nghe/N4/n4/n4/7-2021/Nghe N4 T7-2021.mp3';
const outDir = 'public/audio/jlpt/n4-2021-07';

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

export const n4_2021_07_slices = [
  // Mondai 1 (q01 - q08)
  { id: 'q01', start: 202.0, end: 268.0 },
  { id: 'q02', start: 268.0, end: 362.0 },
  { id: 'q03', start: 362.0, end: 458.0 },
  { id: 'q04', start: 458.0, end: 531.0 },
  { id: 'q05', start: 531.0, end: 605.0 },
  { id: 'q06', start: 605.0, end: 682.0 },
  { id: 'q07', start: 682.0, end: 766.0 },
  { id: 'q08', start: 766.0, end: 846.0 },

  // Mondai 2 (q09 - q15)
  { id: 'q09', start: 985.0, end: 1075.0 },
  { id: 'q10', start: 1075.0, end: 1183.0 },
  { id: 'q11', start: 1183.0, end: 1302.0 },
  { id: 'q12', start: 1302.0, end: 1406.0 },
  { id: 'q13', start: 1406.0, end: 1517.0 },
  { id: 'q14', start: 1517.0, end: 1607.0 },
  { id: 'q15', start: 1607.0, end: 1750.0 },

  // Mondai 3 (q16 - q20)
  { id: 'q16', start: 1834.0, end: 1872.0 },
  { id: 'q17', start: 1872.0, end: 1905.0 },
  { id: 'q18', start: 1905.0, end: 1938.0 },
  { id: 'q19', start: 1938.0, end: 1987.0 },
  { id: 'q20', start: 1987.0, end: 2025.0 },

  // Mondai 4 (q21 - q28)
  { id: 'q21', start: 2110.0, end: 2137.0 },
  { id: 'q22', start: 2137.0, end: 2164.0 },
  { id: 'q23', start: 2164.0, end: 2198.0 },
  { id: 'q24', start: 2198.0, end: 2221.0 },
  { id: 'q25', start: 2221.0, end: 2261.0 },
  { id: 'q26', start: 2261.0, end: 2298.0 },
  { id: 'q27', start: 2298.0, end: 2331.0 },
  { id: 'q28', start: 2331.0, end: 2368.0 },
];

console.log(`Starting slicing ${n4_2021_07_slices.length} audio files for N4 2021-07...`);

for (const s of n4_2021_07_slices) {
  const dest = path.join(outDir, `${s.id}.mp3`);
  const dur = (s.end - s.start).toFixed(2);
  const args = [
    '-y',
    '-ss', s.start.toFixed(2),
    '-t', dur,
    '-i', sourceAudio,
    '-vn',
    '-acodec', 'copy',
    dest,
  ];
  const res = spawnSync(ffmpegPath, args, { stdio: 'pipe' });
  if (res.status !== 0) {
    console.error(`Failed to slice ${s.id}: ${res.stderr.toString()}`);
  } else {
    const stat = fs.statSync(dest);
    console.log(`Sliced ${s.id}.mp3 (${s.start}s - ${s.end}s, dur: ${dur}s, size: ${(stat.size/1024).toFixed(1)} KB)`);
  }
}
console.log('All N4 2021-07 audio slices completed!');
