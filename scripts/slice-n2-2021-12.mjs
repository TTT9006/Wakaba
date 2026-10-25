import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const ffmpegPath = 'D:\\Demo\\node_modules\\@ffmpeg-installer\\win32-x64\\ffmpeg.exe';
const trans = JSON.parse(fs.readFileSync('scripts/n2-2021-12-transcript.json', 'utf-8'));
const src = trans.source;
const outDir = path.resolve('public/audio/jlpt/n2-2021-12');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const cuts = [
  // Mondai 1 (5 Qs)
  { id: 'q01', start: 35.0, end: 126.0 },
  { id: 'q02', start: 126.0, end: 190.0 },
  { id: 'q03', start: 190.0, end: 300.0 },
  { id: 'q04', start: 300.0, end: 406.0 },
  { id: 'q05', start: 406.0, end: 515.0 },

  // Mondai 2 (6 Qs)
  { id: 'q06', start: 558.0, end: 648.0 },
  { id: 'q07', start: 648.0, end: 763.0 },
  { id: 'q08', start: 763.0, end: 875.0 },
  { id: 'q09', start: 875.0, end: 1009.0 },
  { id: 'q10', start: 1009.0, end: 1098.0 },
  { id: 'q11', start: 1098.0, end: 1243.0 },

  // Mondai 3 (5 Qs)
  { id: 'q12', start: 1296.0, end: 1403.0 },
  { id: 'q13', start: 1403.0, end: 1506.0 },
  { id: 'q14', start: 1506.0, end: 1600.0 },
  { id: 'q15', start: 1600.0, end: 1691.0 },
  { id: 'q16', start: 1691.0, end: 1802.0 },

  // Mondai 4 (11 Qs)
  { id: 'q17', start: 1845.0, end: 1875.0 },
  { id: 'q18', start: 1875.0, end: 1908.0 },
  { id: 'q19', start: 1908.0, end: 1944.0 },
  { id: 'q20', start: 1944.0, end: 1977.0 },
  { id: 'q21', start: 1977.0, end: 2007.0 },
  { id: 'q22', start: 2007.0, end: 2049.0 },
  { id: 'q23', start: 2049.0, end: 2085.0 },
  { id: 'q24', start: 2085.0, end: 2118.0 },
  { id: 'q25', start: 2118.0, end: 2148.0 },
  { id: 'q26', start: 2148.0, end: 2178.0 },
  { id: 'q27', start: 2178.0, end: 2223.0 },

  // Mondai 5 (3 Qs)
  { id: 'q28', start: 2260.0, end: 2440.0 },
  { id: 'q29', start: 2458.0, end: 2564.0 },
  { id: 'q30', start: 2564.0, end: trans.duration },
];

console.log(`Slicing N2 2021-12 (${cuts.length} files)...`);
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

console.log('Finished slicing N2 2021-12 audio!');
