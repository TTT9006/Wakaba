import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ffmpegPath = 'D:\\Demo\\node_modules\\@ffmpeg-installer\\win32-x64\\ffmpeg.exe';
const trans = JSON.parse(fs.readFileSync('scripts/n3-2018-12-transcript.json', 'utf-8'));
const src = trans.source;
const outDir = path.resolve('public/audio/jlpt/n3-2018-12');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const cuts = [
  // Mondai 1 (6 Qs)
  { id: 'q01', start: 56.0, end: 145.0 },
  { id: 'q02', start: 145.0, end: 206.0 },
  { id: 'q03', start: 206.0, end: 316.0 },
  { id: 'q04', start: 316.0, end: 406.0 },
  { id: 'q05', start: 406.0, end: 506.0 },
  { id: 'q06', start: 506.0, end: 614.0 },

  // Mondai 2 (6 Qs)
  { id: 'q07', start: 655.0, end: 756.0 },
  { id: 'q08', start: 756.0, end: 848.0 },
  { id: 'q09', start: 848.0, end: 963.0 },
  { id: 'q10', start: 963.0, end: 1101.0 },
  { id: 'q11', start: 1101.0, end: 1225.0 },
  { id: 'q12', start: 1225.0, end: 1397.0 },

  // Mondai 3 (3 Qs)
  { id: 'q13', start: 1444.0, end: 1539.0 },
  { id: 'q14', start: 1539.0, end: 1640.0 },
  { id: 'q15', start: 1640.0, end: 1733.0 },

  // Mondai 4 (4 Qs)
  { id: 'q16', start: 1762.0, end: 1798.0 },
  { id: 'q17', start: 1798.0, end: 1844.0 },
  { id: 'q18', start: 1844.0, end: 1892.0 },
  { id: 'q19', start: 1892.0, end: 1937.0 },

  // Mondai 5 (9 Qs)
  { id: 'q20', start: 1974.0, end: 2006.0 },
  { id: 'q21', start: 2006.0, end: 2039.0 },
  { id: 'q22', start: 2039.0, end: 2069.0 },
  { id: 'q23', start: 2069.0, end: 2099.0 },
  { id: 'q24', start: 2099.0, end: 2140.0 },
  { id: 'q25', start: 2140.0, end: 2171.0 },
  { id: 'q26', start: 2171.0, end: 2202.0 },
  { id: 'q27', start: 2202.0, end: 2234.0 },
  { id: 'q28', start: 2234.0, end: trans.duration },
];

console.log(`Slicing N3 2018-12 (${cuts.length} files)...`);
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

console.log('Finished slicing N3 2018-12 audio!');
