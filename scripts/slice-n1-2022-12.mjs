import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ffmpegPath = 'D:\\Demo\\node_modules\\@ffmpeg-installer\\win32-x64\\ffmpeg.exe';
const sourceAudio = 'c:/Users/Hoang Vuong/Desktop/Tiếng nhật/đề và nghe/N1/N1/ĐỀ JLPT N1/Đề 2/Nghe N1 T12-2022 Bản chuẩn (オリジナル).mp3';
const outDir = 'public/audio/jlpt/n1-2022-12';

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

export const n1_2022_12_slices = [
  // Mondai 1 (q01 - q05)
  { id: 'q01', start: 187.5, end: 299.5 },
  { id: 'q02', start: 299.5, end: 383.5 },
  { id: 'q03', start: 383.5, end: 466.5 },
  { id: 'q04', start: 466.5, end: 552.0 },
  { id: 'q05', start: 552.0, end: 670.0 },

  // Mondai 2 (q06 - q11)
  { id: 'q06', start: 831.5, end: 940.5 },
  { id: 'q07', start: 940.5, end: 1048.0 },
  { id: 'q08', start: 1048.0, end: 1208.0 },
  { id: 'q09', start: 1208.0, end: 1300.0 },
  { id: 'q10', start: 1300.0, end: 1415.0 },
  { id: 'q11', start: 1415.0, end: 1595.0 },

  // Mondai 3 (q12 - q16)
  { id: 'q12', start: 1736.0, end: 1838.0 },
  { id: 'q13', start: 1838.0, end: 1945.5 },
  { id: 'q14', start: 1945.5, end: 2049.0 },
  { id: 'q15', start: 2049.0, end: 2154.5 },
  { id: 'q16', start: 2154.5, end: 2261.5 },

  // Mondai 4 (q17 - q27)
  { id: 'q17', start: 2340.5, end: 2368.5 },
  { id: 'q18', start: 2368.5, end: 2408.5 },
  { id: 'q19', start: 2408.5, end: 2436.5 },
  { id: 'q20', start: 2436.5, end: 2476.5 },
  { id: 'q21', start: 2476.5, end: 2507.5 },
  { id: 'q22', start: 2507.5, end: 2541.5 },
  { id: 'q23', start: 2541.5, end: 2579.5 },
  { id: 'q24', start: 2579.5, end: 2608.5 },
  { id: 'q25', start: 2608.5, end: 2651.5 },
  { id: 'q26', start: 2651.5, end: 2684.5 },
  { id: 'q27', start: 2684.5, end: 2717.5 },

  // Mondai 5 (q28 - q30)
  { id: 'q28', start: 2734.5, end: 2913.5 },
  { id: 'q29', start: 2913.5, end: 3094.5 },
  { id: 'q30', start: 3094.5, end: 3120.0 },
];

console.log(`Starting slicing ${n1_2022_12_slices.length} audio files for N1 2022-12...`);

for (const s of n1_2022_12_slices) {
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
    console.error(`Error slicing ${s.id}:`, res.stderr?.toString());
  } else {
    const size = fs.statSync(dest).size;
    console.log(`✓ Sliced ${s.id}.mp3 (${(size / 1024).toFixed(1)} KB) [${s.start}s -> ${s.end}s, dur ${dur}s]`);
  }
}

console.log('Finished slicing all audio files for N1 2022-12!');
