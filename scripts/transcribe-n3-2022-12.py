import os
import json
import sys
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

os.environ['HF_HOME'] = r'D:\Demo\output\jlpt-audit\models'
from faster_whisper import WhisperModel
from faster_whisper.audio import decode_audio

model = WhisperModel('base', device='cpu', compute_type='int8', cpu_threads=4, download_root=os.environ['HF_HOME'])

mp3 = r'C:\Users\Hoang Vuong\Desktop\Tiếng nhật\đề và nghe\N3\n3\n3\12-2022\Nghe N3 T12-2022 Bản Thu Âm (録音データ).m4a'
out_json = r'D:\Demo\scripts\n3-2022-12-transcript.json'

print(f"Loading and decoding audio: {mp3}")
audio = decode_audio(mp3)
duration_sec = len(audio) / 16000
print(f"Audio duration: {duration_sec:.1f}s ({duration_sec/60:.2f} mins)")

print("Transcribing with faster-whisper base...")
segments, info = model.transcribe(audio, language='ja', beam_size=1, vad_filter=True)
rows = []
for s in segments:
    row = dict(start=round(s.start, 2), end=round(s.end, 2), text=s.text.strip())
    rows.append(row)
    if any(k in s.text for k in ['問題', '番', '1番', '2番', '3番', '4番', '5番', '6番']):
        print(f"[{row['start']}s -> {row['end']}s]: {row['text']}")

result = {
    'exam': 'N3 2022-12',
    'source': mp3,
    'duration': duration_sec,
    'segments': rows
}

with open(out_json, 'w', encoding='utf-8') as f:
    json.dump(result, f, ensure_ascii=False, indent=2)

print(f"Successfully saved {len(rows)} segments to {out_json}")
