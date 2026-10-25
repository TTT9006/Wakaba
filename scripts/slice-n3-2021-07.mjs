import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ffmpegPath = 'D:\\Demo\\node_modules\\@ffmpeg-installer\\win32-x64\\ffmpeg.exe';
const sourceAudio = 'c:/Users/Hoang Vuong/Desktop/Tiếng nhật/đề và nghe/N3/n3/n3/7-2021/Nghe bản chuẩn N3 T7-2021.mp3';
const outDir = 'public/audio/jlpt/n3-2021-07';

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

export const n3_2021_07_slices = [
  // Mondai 1 (q01 - q06)
  { id: 'q01', start: 122.0, end: 189.5 },
  { id: 'q02', start: 189.5, end: 263.0 },
  { id: 'q03', start: 263.0, end: 328.0 },
  { id: 'q04', start: 328.0, end: 409.0 },
  { id: 'q05', start: 409.0, end: 495.5 },
  { id: 'q06', start: 495.5, end: 598.0 },

  // Mondai 2 (q07 - q12)
  { id: 'q07', start: 651.0, end: 756.0 },
  { id: 'q08', start: 756.0, end: 842.0 },
  { id: 'q09', start: 842.0, end: 966.0 },
  { id: 'q10', start: 966.0, end: 1063.0 },
  { id: 'q11', start: 1063.0, end: 1177.0 },
  { id: 'q12', start: 1177.0, end: 1330.0 },

  // Mondai 3 (q13 - q15)
  { id: 'q13', start: 1383.0, end: 1464.0 },
  { id: 'q14', start: 1464.0, end: 1549.0 },
  { id: 'q15', start: 1549.0, end: 1636.0 },

  // Mondai 4 (q16 - q19)
  { id: 'q16', start: 1668.0, end: 1702.0 },
  { id: 'q17', start: 1702.0, end: 1735.0 },
  { id: 'q18', start: 1735.0, end: 1779.0 },
  { id: 'q19', start: 1779.0, end: 1824.0 },

  // Mondai 5 (q20 - q28)
  { id: 'q20', start: 1849.0, end: 1880.0 },
  { id: 'q21', start: 1880.0, end: 1909.0 },
  { id: 'q22', start: 1909.0, end: 1940.0 },
  { id: 'q23', start: 1940.0, end: 1982.0 },
  { id: 'q24', start: 1982.0, end: 2014.0 },
  { id: 'q25', start: 2014.0, end: 2047.0 },
  { id: 'q26', start: 2047.0, end: 2080.0 },
  { id: 'q27', start: 2080.0, end: 2120.0 },
  { id: 'q28', start: 2120.0, end: 2155.0 },
];

console.log(`Starting slicing ${n3_2021_07_slices.length} audio files for N3 2021-07...`);

for (const s of n3_2021_07_slices) {
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
console.log('All N3 2021-07 audio slices completed!');
