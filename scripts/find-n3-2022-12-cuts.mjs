import fs from 'node:fs';

export function findCuts(transcriptJsonPath) {
  const data = JSON.parse(fs.readFileSync(transcriptJsonPath, 'utf-8'));
  const segments = data.segments;
  const duration = data.duration;

  console.log(`Loaded ${segments.length} segments, total duration ${duration.toFixed(1)}s`);

  // Print all segments mentioning Mondai or numbers to inspect structure
  for (const s of segments) {
    if (/問題|番|ばん/.test(s.text)) {
      console.log(`[${s.start.toFixed(1)}s - ${s.end.toFixed(1)}s]: ${s.text}`);
    }
  }
}

if (process.argv[1].endsWith('find-n3-2022-12-cuts.mjs')) {
  if (fs.existsSync('scripts/n3-2022-12-transcript.json')) {
    findCuts('scripts/n3-2022-12-transcript.json');
  } else {
    console.log('scripts/n3-2022-12-transcript.json does not exist yet.');
  }
}
