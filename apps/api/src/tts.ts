import { EdgeTTS } from 'node-edge-tts';

// Bộ nhớ đệm âm thanh trong RAM để phát ngay lập tức (0ms) cho các từ hay gặp
const audioCache = new Map<string, Buffer>();
const MAX_CACHE_SIZE = 2000;

/**
 * Chia nhỏ văn bản tiếng Nhật thành các đoạn an toàn (<= maxLength ký tự)
 * ưu tiên ngắt tại dấu chấm câu (。！？\n) hoặc dấu phẩy (、) để giữ trọn vẹn ngữ điệu tự nhiên.
 */
export function splitTextForTts(text: string, maxLength = 150): string[] {
  const clean = text.trim();
  if (clean.length <= maxLength) return [clean];

  const sentences = clean.split(/(?<=[。！？\n])/);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const sentence of sentences) {
    if (!sentence) continue;
    if ((currentChunk + sentence).length <= maxLength) {
      currentChunk += sentence;
    } else {
      if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }
      if (sentence.length <= maxLength) {
        currentChunk = sentence;
      } else {
        // Nếu một câu đơn lẻ vượt quá maxLength, tiếp tục tách theo dấu phẩy (、) hoặc khoảng trắng
        const subParts = sentence.split(/(?<=[、,; ])/);
        for (const sub of subParts) {
          if (!sub) continue;
          if ((currentChunk + sub).length <= maxLength) {
            currentChunk += sub;
          } else {
            if (currentChunk.trim()) chunks.push(currentChunk.trim());
            if (sub.length <= maxLength) {
              currentChunk = sub;
            } else {
              // Cắt cứng nếu không còn ranh giới dấu câu nào
              for (let i = 0; i < sub.length; i += maxLength) {
                chunks.push(sub.slice(i, i + maxLength));
              }
              currentChunk = '';
            }
          }
        }
      }
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks.length > 0 ? chunks : [clean];
}

/**
 * Tạo âm thanh giọng đọc tiếng Nhật tự nhiên (Nanami Neural)
 * Có cơ chế lưu đệm và tự động phục hồi nếu có gián đoạn kết nối
 */
export async function synthesizeSpeech(text: string, voice = 'ja-JP-NanamiNeural'): Promise<Buffer> {
  const clean = text.trim();
  if (!clean) {
    throw new Error('Nội dung phát âm không được để trống.');
  }

  const cacheKey = `${voice}:${clean}`;
  const cached = audioCache.get(cacheKey);
  if (cached) {
    // Làm mới vị trí trong bộ đệm (LRU)
    audioCache.delete(cacheKey);
    audioCache.set(cacheKey, cached);
    return cached;
  }

  let buffer: Buffer | null = null;

  // 1. Tạo giọng đọc tự nhiên qua Microsoft Azure Neural (Nanami) bằng node-edge-tts
  try {
    const tts = new EdgeTTS({
      voice,
      lang: 'ja-JP',
      outputFormat: 'audio-24khz-48kbitrate-mono-mp3',
      timeout: 25000,
    });
    const chunks: Buffer[] = [];
    for await (const chunk of tts.streamAudio(clean)) {
      if (Buffer.isBuffer(chunk)) {
        chunks.push(chunk);
      }
    }
    if (chunks.length > 0) {
      buffer = Buffer.concat(chunks);
    }
  } catch (edgeErr) {
    console.warn('Lưu ý khi tạo giọng đọc Nanami:', edgeErr);
  }

  // 2. Dự phòng đa tầng: Dùng Google Neural Speech (tự động phân đoạn an toàn cho câu dài)
  if (!buffer || buffer.length === 0) {
    try {
      const parts = splitTextForTts(clean, 150);
      const audioParts: Buffer[] = [];

      for (const part of parts) {
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=ja&client=tw-ob&q=${encodeURIComponent(part)}`;
        const resp = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
        });
        if (resp.ok) {
          const ab = await resp.arrayBuffer();
          audioParts.push(Buffer.from(ab));
        } else {
          console.warn(`Lỗi khi tải đoạn Google TTS (HTTP ${resp.status}):`, part.slice(0, 30));
        }
      }

      if (audioParts.length > 0) {
        buffer = Buffer.concat(audioParts);
      }
    } catch (gErr) {
      console.warn('Lưu ý khi gọi giọng đọc dự phòng:', gErr);
    }
  }

  if (!buffer || buffer.length === 0) {
    throw new Error('Không thể tạo âm thanh giọng đọc lúc này.');
  }

  // Giới hạn kích thước cache để không tốn RAM
  if (audioCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = audioCache.keys().next().value;
    if (oldestKey) audioCache.delete(oldestKey);
  }
  audioCache.set(cacheKey, buffer);

  return buffer;
}
