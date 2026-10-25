import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

const ffmpegPath = 'D:\\Demo\\node_modules\\@ffmpeg-installer\\win32-x64\\ffmpeg.exe';
const audioPath = 'C:\\Users\\Hoang Vuong\\Desktop\\Tiếng nhật\\đề và nghe\\N3\\n3\\n3\\12-2022\\Nghe N3 T12-2022 Bản Thu Âm (録音データ).m4a';

console.log('Running silencedetect...');
const res = spawnSync(ffmpegPath, ['-i', audioPath, '-af', 'silencedetect=noise=-28dB:d=1.5', '-f', 'null', '-'], {
  encoding: 'utf-8',
});

const output = (res.stderr || '') + (res.stdout || '');
const silences = [];
const lines = output.split('\n');
let currentStart = null;

for (const line of lines) {
  const startMatch = line.match(/silence_start:\s*([\d\.]+)/);
  if (startMatch) {
    currentStart = parseFloat(startMatch[1]);
  }
  const endMatch = line.match(/silence_end:\s*([\d\.]+)\s*\|\s*silence_duration:\s*([\d\.]+)/);
  if (endMatch && currentStart !== null) {
    silences.push({
      start: currentStart,
      end: parseFloat(endMatch[1]),
      dur: parseFloat(endMatch[2]),
    });
    currentStart = null;
  }
}

console.log(`Found ${silences.length} silences (dur >= 1.5s):`);
silences.forEach((s, idx) => {
  if (s.dur >= 4.0) {
    console.log(`⭐ [Major pause] ${idx + 1}. [${s.start.toFixed(1)}s -> ${s.end.toFixed(1)}s] (${s.dur.toFixed(1)}s)`);
  }
});

fs.writeFileSync('scripts/n3-2022-12-silences.json', JSON.stringify(silences, null, 2), 'utf-8');
