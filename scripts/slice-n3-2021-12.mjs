import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ffmpegPath = 'D:\\Demo\\node_modules\\@ffmpeg-installer\\win32-x64\\ffmpeg.exe';
const trans = JSON.parse(fs.readFileSync('scripts/n3-2021-12-transcript.json', 'utf-8'));
const src = trans.source;
const outDir = path.resolve('public/audio/jlpt/n3-2021-12');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const cuts = [
  // Mondai 1 (6 Qs)
  { id: 'q01', start: 195.0, end: 259.0 },
  { id: 'q02', start: 259.0, end: 367.0 },
  { id: 'q03', start: 367.0, end: 447.0 },
  { id: 'q04', start: 447.0, end: 506.0 },
  { id: 'q05', start: 506.0, end: 609.0 },
  { id: 'q06', start: 609.0, end: 715.0 },

  // Mondai 2 (6 Qs)
  { id: 'q07', start: 864.0, end: 956.0 },
  { id: 'q08', start: 956.0, end: 1065.0 },
  { id: 'q09', start: 1065.0, end: 1172.0 },
  { id: 'q10', start: 1172.0, end: 1284.0 },
  { id: 'q11', start: 1284.0, end: 1397.0 },
  { id: 'q12', start: 1397.0, end: 1545.0 },

  // Mondai 3 (3 Qs)
  { id: 'q13', start: 1714.0, end: 1803.0 },
  { id: 'q14', start: 1803.0, end: 1886.0 },
  { id: 'q15', start: 1886.0, end: 1969.0 },

  // Mondai 4 (4 Qs)
  { id: 'q16', start: 2054.0, end: 2089.0 },
  { id: 'q17', start: 2089.0, end: 2124.0 },
  { id: 'q18', start: 2124.0, end: 2163.0 },
  { id: 'q19', start: 2163.0, end: 2209.0 },

  // Mondai 5 (9 Qs)
  { id: 'q20', start: 2298.0, end: 2328.0 },
  { id: 'q21', start: 2328.0, end: 2362.0 },
  { id: 'q22', start: 2362.0, end: 2390.0 },
  { id: 'q23', start: 2390.0, end: 2427.0 },
  { id: 'q24', start: 2427.0, end: 2450.0 },
  { id: 'q25', start: 2450.0, end: 2490.0 },
  { id: 'q26', start: 2490.0, end: 2521.0 },
  { id: 'q27', start: 2521.0, end: 2556.0 },
  { id: 'q28', start: 2556.0, end: trans.duration },
];

console.log(`Slicing N3 2021-12 (${cuts.length} files)...`);
cuts.forEach((c) => {
  const dur = c.end - c.start;
  const outFile = path.join(outDir, `${c.id}.mp3`);
  const cmd = `"${ffmpegPath}" -y -ss ${c.start.toFixed(2)} -i "${src}" -t ${dur.toFixed(2)} -c:a libmp3lame -b:a 128k "${outFile}" -loglevel error`;
  execSync(cmd);
  const sz = fs.statSync(outFile).size;
  console.log(
    `  ✓ ${c.id}.mp3: ${c.start.toFixed(1)}s -> ${c.end.toFixed(1)}s (${dur.toFixed(1)}s, ${(sz / 1024).toFixed(1)} KB)`
  );
});

console.log('Finished slicing N3 2021-12 audio!');
