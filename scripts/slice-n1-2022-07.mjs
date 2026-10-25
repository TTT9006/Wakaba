import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ffmpegPath = 'D:\\Demo\\node_modules\\@ffmpeg-installer\\win32-x64\\ffmpeg.exe';
const sourceAudio = 'C:/Users/Hoang Vuong/Desktop/Tiếng nhật/đề và nghe/N1/N1/ĐỀ JLPT N1/Đề 3/Nghe N1 T7-2022 BẢN CHUẨN Ver 2.0 Yuuki Bùi (đã bổ sung câu 5 mondai 1).mp3';
const outDir = 'public/audio/jlpt/n1-2022-07';

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

export const n1_2022_07_slices = JSON.parse(fs.readFileSync('scripts/n1-2022-07-slices.json', 'utf8'));

console.log(`Starting slicing ${n1_2022_07_slices.length} audio files for N1 2022-07...`);

for (const s of n1_2022_07_slices) {
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
console.log('All N1 2022-07 audio slices completed!');
