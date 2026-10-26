import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Clock3,
  Volume2,
  VolumeX,
  Square,
  Play,
  Pause,
  Headphones,
  Maximize,
  Minimize,
  ShieldAlert,
  CheckCircle,
} from 'lucide-react';
import { api, post, patch, speak, stopSpeech } from '../services/api';
import { useUI } from '../stores/ui';
import { Button, ErrorState, Loading, Modal, PageHeader } from '../components/ui';
import { QuestionInput } from './tests';
import type { JlptRunView, JlptSummary } from '../../../../packages/shared/jlpt-types';
import { jlptPapers, paperSummary } from '../../../../packages/shared/jlpt-papers';
import {
  getLocalExamRun,
  initLocalExamRun,
  advanceLocalExamRun,
  getLocalAudioTranscript,
} from '../../../../packages/shared/jlpt-client-runner';

async function playJapanese(text: string) {
  await speak(text);
}
const clock = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
// Trạng thái kiểm tra tính khả dụng của file audio tĩnh trên môi trường hiện tại
const staticAudioProbe = {
  tested: false,
  available: false,
};

async function probeStaticAudio(): Promise<boolean> {
  if (staticAudioProbe.tested) return staticAudioProbe.available;
  try {
    const res = await fetch('/audio/jlpt/n5-2018/q01.mp3', { method: 'HEAD' });
    const contentType = res.headers.get('content-type') || '';
    // Nếu Vercel trả về text/html (SPA rewrite) hoặc không ok -> static audio không khả dụng trên host này
    staticAudioProbe.available = res.ok && contentType.includes('audio');
  } catch {
    staticAudioProbe.available = false;
  }
  staticAudioProbe.tested = true;
  return staticAudioProbe.available;
}

function ExamAudioPlayer({
  src,
  transcript,
  questionId,
  runId,
  paperId,
}: {
  src?: string;
  transcript?: string;
  questionId: string;
  runId?: string;
  paperId?: string;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);
  const [resolvedSrc, setResolvedSrc] = useState(src || '');
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [isFallbackTts, setIsFallbackTts] = useState(false);
  const [useSpeechSynth, setUseSpeechSynth] = useState(false);
  const maxTimeRef = useRef(0);
  const speechIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Lời thoại câu hỏi nghe chuẩn xác 100%
  const effectiveTranscript = useMemo(() => {
    if (transcript?.trim()) return transcript.trim();
    if (paperId && questionId) {
      const text = getLocalAudioTranscript(paperId, questionId);
      if (text) return text.trim();
    }
    return getLocalAudioTranscript('', questionId)?.trim() || '';
  }, [transcript, paperId, questionId]);

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setHasEnded(false);
    setIsFallbackTts(false);
    setUseSpeechSynth(false);
    maxTimeRef.current = 0;
    if (speechIntervalRef.current) {
      clearInterval(speechIntervalRef.current);
      speechIntervalRef.current = null;
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    let cancelled = false;

    const setupAudio = async () => {
      // 1. Nếu đã xác định static audio không khả dụng (ví dụ trên Vercel production):
      if (staticAudioProbe.tested && !staticAudioProbe.available) {
        if (effectiveTranscript) {
          setResolvedSrc(`/api/tts?text=${encodeURIComponent(effectiveTranscript)}`);
          setIsFallbackTts(true);
        }
        return;
      }

      // 2. Nếu có src tĩnh (ví dụ /audio/jlpt/...):
      if (src) {
        if (!staticAudioProbe.tested) {
          setIsLoadingAudio(true);
          const isAvail = await probeStaticAudio();
          if (cancelled) return;
          setIsLoadingAudio(false);
          if (isAvail) {
            setResolvedSrc(src);
            return;
          }
          // File tĩnh không có trên host -> Chuyển ngay sang TTS
          if (effectiveTranscript) {
            setResolvedSrc(`/api/tts?text=${encodeURIComponent(effectiveTranscript)}`);
            setIsFallbackTts(true);
            return;
          }
        } else {
          setResolvedSrc(src);
          return;
        }
      }

      // 3. Nếu không có src hoặc là đề luyện: dùng transcript TTS
      if (effectiveTranscript) {
        setResolvedSrc(`/api/tts?text=${encodeURIComponent(effectiveTranscript)}`);
        setIsFallbackTts(true);
        return;
      }

      // 4. Nếu cần tải transcript từ server run:
      if (runId && questionId && !runId.startsWith('local_')) {
        setIsLoadingAudio(true);
        try {
          const res = await api<{ text: string }>(`/jlpt/runs/${runId}/audio/${questionId}`);
          if (!cancelled && res.text) {
            setResolvedSrc(`/api/tts?text=${encodeURIComponent(res.text)}`);
            setIsFallbackTts(true);
          }
        } catch (e) {
          console.warn('Không thể nạp transcript từ server:', e);
        } finally {
          if (!cancelled) setIsLoadingAudio(false);
        }
      }
    };

    void setupAudio();

    return () => {
      cancelled = true;
      if (speechIntervalRef.current) {
        clearInterval(speechIntervalRef.current);
        speechIntervalRef.current = null;
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [questionId, src, runId, paperId, effectiveTranscript]);

  // Xử lý lỗi nạp thẻ <audio> (tự động phục hồi sang TTS hoặc Web Speech API)
  const handleAudioError = () => {
    console.warn('ExamAudioPlayer: Lỗi nạp nguồn âm thanh gốc, chuyển sang TTS...', resolvedSrc);
    if (resolvedSrc && resolvedSrc === src) {
      staticAudioProbe.tested = true;
      staticAudioProbe.available = false;
      if (effectiveTranscript) {
        setResolvedSrc(`/api/tts?text=${encodeURIComponent(effectiveTranscript)}`);
        setIsFallbackTts(true);
        return;
      }
    }
    // Nếu cả TTS backend cũng lỗi: chuyển sang Web Speech API của thiết bị
    setUseSpeechSynth(true);
    const estDuration = Math.max(8, Math.ceil((effectiveTranscript?.length || 40) * 0.25));
    setDuration(estDuration);
  };

  const playViaSpeechSynth = async () => {
    if (!effectiveTranscript) return;
    setIsPlaying(true);
    setUseSpeechSynth(true);
    const estDuration = Math.max(8, Math.ceil(effectiveTranscript.length * 0.25));
    setDuration(estDuration);
    setCurrentTime(0);

    const startTime = Date.now();
    speechIntervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      if (elapsed < estDuration) {
        setCurrentTime(elapsed);
      }
    }, 500);

    try {
      await speak(effectiveTranscript);
    } catch (e) {
      console.error('SpeechSynthesis error:', e);
    } finally {
      if (speechIntervalRef.current) {
        clearInterval(speechIntervalRef.current);
        speechIntervalRef.current = null;
      }
      setCurrentTime(estDuration);
      setIsPlaying(false);
      setHasEnded(true);
    }
  };

  const handlePlay = async () => {
    if (hasEnded || isPlaying || isLoadingAudio) return;

    if (useSpeechSynth) {
      await playViaSpeechSynth();
      return;
    }

    if (!audioRef.current) return;

    setIsPlaying(true);
    try {
      await audioRef.current.play();
    } catch (playErr) {
      console.warn('ExamAudioPlayer: Lỗi audio.play(), kích hoạt phục hồi:', playErr);
      if (resolvedSrc === src && effectiveTranscript) {
        staticAudioProbe.tested = true;
        staticAudioProbe.available = false;
        const ttsUrl = `/api/tts?text=${encodeURIComponent(effectiveTranscript)}`;
        setResolvedSrc(ttsUrl);
        setIsFallbackTts(true);
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.play().catch(async (ttsErr) => {
              console.warn('ExamAudioPlayer: TTS play fail, fallback Web Speech:', ttsErr);
              await playViaSpeechSynth();
            });
          }
        }, 150);
      } else if (effectiveTranscript) {
        await playViaSpeechSynth();
      } else {
        setIsPlaying(false);
      }
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    const curr = audioRef.current.currentTime;
    if (curr > maxTimeRef.current) {
      maxTimeRef.current = curr;
    }
    setCurrentTime(curr);
  };

  const handleSeeking = () => {
    if (!audioRef.current) return;
    // Strictly prevent rewinding: clamp to furthest reached time
    if (audioRef.current.currentTime < maxTimeRef.current - 0.3) {
      audioRef.current.currentTime = maxTimeRef.current;
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current && audioRef.current.duration && !isNaN(audioRef.current.duration)) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setHasEnded(true);
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="exam-audio-card" aria-label="Trình phát âm thanh câu hỏi thi">
      <audio
        ref={audioRef}
        src={resolvedSrc}
        preload="metadata"
        onError={handleAudioError}
        onTimeUpdate={handleTimeUpdate}
        onSeeking={handleSeeking}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => {
          // Tuân thủ quy chế phòng thi: không cho phép tạm dừng trước khi phát hết bài nghe
          if (!hasEnded && audioRef.current && duration > 0 && currentTime < duration - 0.5) {
            audioRef.current.play().catch(() => setIsPlaying(false));
          } else {
            setIsPlaying(false);
          }
        }}
      />
      <div className="exam-audio-header">
        <span className="exam-audio-badge">
          <Headphones size={13} />
          {isFallbackTts ? 'Mô phỏng phòng thi (AI chuẩn Tokyo)' : 'Mô phỏng phòng thi thật'}
        </span>
        <span className="exam-audio-notice">Phát 1 lần · Không thể dừng hoặc tua lại</span>
      </div>
      <div className="exam-audio-controls">
        <button
          type="button"
          className={`exam-audio-btn ${isPlaying ? 'playing' : ''}`}
          onClick={() => void handlePlay()}
          disabled={isPlaying || hasEnded || isLoadingAudio || (!resolvedSrc && !effectiveTranscript)}
          title={
            hasEnded
              ? 'Đã phát hết bài nghe'
              : isPlaying
                ? 'Đang phát bài nghe (không thể tạm dừng)'
                : isLoadingAudio
                  ? 'Đang nạp âm thanh bài nghe…'
                  : 'Phát bài nghe'
          }
          aria-label={
            hasEnded
              ? 'Đã phát hết bài nghe'
              : isPlaying
                ? 'Đang phát bài nghe (không thể tạm dừng)'
                : isLoadingAudio
                  ? 'Đang nạp âm thanh bài nghe…'
                  : 'Phát bài nghe'
          }
        >
          {hasEnded ? (
            <Check size={18} />
          ) : isPlaying ? (
            <Volume2 size={18} className="animate-pulse" />
          ) : (
            <Play size={18} style={{ marginLeft: '2px' }} />
          )}
          <span>
            {hasEnded
              ? 'Đã nghe xong'
              : isPlaying
                ? 'Đang phát bài nghe…'
                : isLoadingAudio
                  ? 'Đang tải âm thanh…'
                  : 'Phát bài nghe'}
          </span>
        </button>

        <div className="exam-audio-progress-container" title="Tiến trình phát (không thể tua lại)">
          <div className="exam-audio-progress-track">
            <div className="exam-audio-progress-fill" style={{ width: `${progressPercent}%` }} />
          </div>
          <div className="exam-audio-time">
            <span>{formatTime(currentTime)}</span>
            <span>/</span>
            <span>{duration > 0 ? formatTime(duration) : '--:--'}</span>
          </div>
        </div>

        <button
          type="button"
          className="exam-audio-mute-btn"
          onClick={toggleMute}
          title={isMuted ? 'Bật âm thanh' : 'Tắt tiếng'}
          aria-label={isMuted ? 'Bật âm thanh' : 'Tắt tiếng'}
        >
          {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
      </div>
    </div>
  );
}

export function JlptCountdown({
  deadline,
  offset,
  onExpire,
}: {
  deadline: string | null;
  offset: number;
  onExpire?: () => void;
}) {
  const [now, setNow] = useState(Date.now());
  const triggered = useRef(false);

  useEffect(() => {
    triggered.current = false;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [deadline]);

  const remaining = deadline
    ? Math.max(0, Math.ceil((new Date(deadline).getTime() - (now + offset)) / 1000))
    : 0;

  useEffect(() => {
    if (deadline && remaining <= 0 && !triggered.current) {
      triggered.current = true;
      if (onExpire) onExpire();
    }
  }, [remaining, deadline, onExpire]);

  if (!deadline) return null;

  return (
    <span
      className={'timer ' + (remaining < 60 ? 'error-text' : '')}
      role="timer"
      aria-label="Thời gian còn lại"
    >
      <Clock3 size={16} />
      {clock(remaining)}
    </span>
  );
}

export function JlptSession() {
  const { id } = useParams();
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ['jlpt-paper', id],
    queryFn: async () => {
      try {
        const res = await api<{ paper: JlptSummary; run: JlptRunView | null }>('/jlpt/papers/' + id);
        if (res?.paper) {
          return res;
        }
      } catch (err) {
        console.warn('Backend /jlpt/papers/:id unavailable, checking local papers:', err);
      }
      const localPaper = jlptPapers.find((p) => p.id === id);
      if (localPaper) {
        const localRun = id ? getLocalExamRun(id) : null;
        return {
          paper: paperSummary(localPaper),
          run: localRun,
        };
      }
      throw new Error('Không tìm thấy đề thi này.');
    },
    refetchOnWindowFocus: false,
    staleTime: 0,
  });
  const [run, setRun] = useState<JlptRunView | null>(null),
    [index, setIndex] = useState(0),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [confirm, setConfirm] = useState(false),
    [speaking, setSpeaking] = useState(false),
    [isExpired, setIsExpired] = useState(false);
  const offset = useRef(0),
    nextPoll = useRef(0),
    locked = useRef(false),
    saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null),
    pendingAnswers = useRef<Record<string, string>>({});
  function apply(next: JlptRunView) {
    offset.current = new Date(next.serverNow).getTime() - Date.now();
    setIsExpired(false);
    if (next.section !== run?.section) {
      setIndex(0);
      stopSpeech();
      setSpeaking(false);
      setConfirm(false);
      pendingAnswers.current = {};
      if (saveTimer.current) {
        clearTimeout(saveTimer.current);
        saveTimer.current = null;
      }
    }
    setRun((current) => {
      if (!current) return next;
      // Preserve any local answers that haven't been synced or were just clicked
      return {
        ...next,
        answers: {
          ...next.answers,
          ...pendingAnswers.current,
        },
      };
    });
    if (next.finished) {
      void client.invalidateQueries({ queryKey: ['test-history'] });
      void client.invalidateQueries({ queryKey: ['dashboard'] });
    }
  }
  useEffect(() => {
    if (query.data?.run) {
      offset.current = new Date(query.data.run.serverNow).getTime() - Date.now();
      setRun(query.data.run);
    }
  }, [query.data]);

  const handleExpire = () => {
    if (locked.current || isExpired) return;
    setIsExpired(true);
    stopSpeech();
    setSpeaking(false);
    if (!run?.runId || run.finished) return;
    locked.current = true;
    setBusy(true);
    if (run.runId.startsWith('local_') && id) {
      try {
        const localRun = advanceLocalExamRun(id, 'finish', {});
        apply(localRun);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        locked.current = false;
        setBusy(false);
      }
      return;
    }
    void api<JlptRunView>('/jlpt/runs/' + run.runId)
      .then(apply)
      .catch((e) => {
        if (id) {
          try {
            const localRun = advanceLocalExamRun(id, 'finish', {});
            apply(localRun);
            return;
          } catch {}
        }
        setError(e.message);
      })
      .finally(() => {
        locked.current = false;
        setBusy(false);
      });
  };
  async function flushPendingAnswers(currentRun: JlptRunView) {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    const toSave = { ...pendingAnswers.current };
    if (Object.keys(toSave).length === 0) return;

    if (currentRun.runId.startsWith('local_') && id) {
      const localRun = advanceLocalExamRun(id, 'save', toSave);
      for (const k of Object.keys(toSave)) {
        if (pendingAnswers.current[k] === toSave[k]) {
          delete pendingAnswers.current[k];
        }
      }
      apply(localRun);
      return;
    }

    try {
      const updated = await patch<JlptRunView>('/jlpt/runs/' + currentRun.runId, {
        action: 'save',
        answers: toSave,
        revision: currentRun.revision ?? 0,
      });
      // Clear saved keys from pending
      for (const k of Object.keys(toSave)) {
        if (pendingAnswers.current[k] === toSave[k]) {
          delete pendingAnswers.current[k];
        }
      }
      apply(updated);
    } catch {
      if (id) {
        const localRun = advanceLocalExamRun(id, 'save', toSave);
        for (const k of Object.keys(toSave)) {
          if (pendingAnswers.current[k] === toSave[k]) {
            delete pendingAnswers.current[k];
          }
        }
        apply(localRun);
      }
    }
  }
  function handleAnswer(questionId: string, value: string) {
    if (!run || isExpired) return;
    if (run.answers[questionId] === value) return; // Ignore clicking the already selected option

    // Optimistic UI update
    pendingAnswers.current[questionId] = value;
    setRun((prev) =>
      prev ? { ...prev, answers: { ...prev.answers, [questionId]: value } } : prev,
    );

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveTimer.current = null;
      if (runRef.current && !locked.current) {
        void flushPendingAnswers(runRef.current);
      }
    }, 400);
  }
  const runRef = useRef<JlptRunView | null>(null);
  runRef.current = run;

  const setExamMode = useUI((s) => s.setExamMode);
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));
  const [earlySubmitConfirm, setEarlySubmitConfirm] = useState(false);

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  const enterFullscreen = async () => {
    try {
      if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      }
    } catch (err) {
      console.warn('Fullscreen request failed:', err);
    }
  };

  const exitFullscreen = async () => {
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.warn('Exit fullscreen failed:', err);
    }
  };

  const isExamActive = Boolean(run && !run.finished && !run.report);

  useEffect(() => {
    setExamMode(isExamActive);
    return () => {
      setExamMode(false);
      void exitFullscreen();
    };
  }, [isExamActive, setExamMode]);

  useEffect(() => {
    if (!isExamActive) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isExamActive]);

  async function command(
    action: 'save' | 'finish' | 'begin' | 'finish-all',
    answers: Record<string, string> = {},
  ) {
    if (!run || locked.current) return;
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    if (action === 'begin') {
      void enterFullscreen();
    }
    locked.current = true;
    setBusy(true);
    setError('');
    try {
      const mergedAnswers = { ...pendingAnswers.current, ...answers };
      pendingAnswers.current = {};

      if (run.runId.startsWith('local_') && id) {
        const localRun = advanceLocalExamRun(id, action, mergedAnswers);
        apply(localRun);
        setConfirm(false);
        setEarlySubmitConfirm(false);
        if (localRun.finished) {
          void exitFullscreen();
          setExamMode(false);
        }
        return;
      }

      if (action === 'finish-all') {
        try {
          const res = await patch<JlptRunView>('/jlpt/runs/' + run.runId, {
            action: 'finish-all',
            answers: mergedAnswers,
            revision: run.revision ?? 0,
          });
          apply(res);
          setConfirm(false);
          setEarlySubmitConfirm(false);
          void exitFullscreen();
          setExamMode(false);
          return;
        } catch (finishAllErr: unknown) {
          // Fallback an toàn nếu máy chủ backend chưa cập nhật action 'finish-all'
          let updated: JlptRunView | null = null;
          try {
            updated = await patch<JlptRunView>('/jlpt/runs/' + run.runId, {
              action: 'finish',
              answers: mergedAnswers,
              revision: run.revision ?? 0,
            });
            while (updated && !updated.finished && updated.section < updated.sections.length) {
              updated = await patch<JlptRunView>('/jlpt/runs/' + run.runId, {
                action: 'begin',
                answers: {},
                revision: updated.revision ?? 0,
              });
              if (updated.finished) break;
              updated = await patch<JlptRunView>('/jlpt/runs/' + run.runId, {
                action: 'finish',
                answers: {},
                revision: updated.revision ?? 0,
              });
            }
          } catch {
            if (id) {
              const localRun = advanceLocalExamRun(id, action, mergedAnswers);
              apply(localRun);
              setConfirm(false);
              setEarlySubmitConfirm(false);
              void exitFullscreen();
              setExamMode(false);
              return;
            }
            throw finishAllErr;
          }
          if (updated) {
            apply(updated);
            setConfirm(false);
            setEarlySubmitConfirm(false);
            void exitFullscreen();
            setExamMode(false);
            return;
          }
          throw finishAllErr;
        }
      }

      try {
        const res = await patch<JlptRunView>('/jlpt/runs/' + run.runId, {
          action,
          answers: mergedAnswers,
          revision: run.revision ?? 0,
        });
        apply(res);
        setConfirm(false);
        setEarlySubmitConfirm(false);
        if (res.finished) {
          void exitFullscreen();
          setExamMode(false);
        }
      } catch (patchErr) {
        if (id) {
          const localRun = advanceLocalExamRun(id, action, mergedAnswers);
          apply(localRun);
          setConfirm(false);
          setEarlySubmitConfirm(false);
          if (localRun.finished) {
            void exitFullscreen();
            setExamMode(false);
          }
          return;
        }
        throw patchErr;
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  async function start() {
    if (locked.current) return;
    locked.current = true;
    setBusy(true);
    setError('');
    void enterFullscreen();
    try {
      try {
        const serverRun = await post<JlptRunView>('/jlpt/papers/' + id + '/start');
        apply(serverRun);
        return;
      } catch (serverErr) {
        console.warn('Backend /jlpt/papers/:id/start failed, starting local session:', serverErr);
        if (id && jlptPapers.some((p) => p.id === id)) {
          const localRun = initLocalExamRun(id);
          apply(localRun);
          return;
        }
        throw serverErr;
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      locked.current = false;
      setBusy(false);
    }
  }
  async function audio(questionId?: string) {
    if (speaking) return;
    setSpeaking(true);
    setError('');
    try {
      let text = '音声の確認です。日本語の音が聞こえたら、試験を始めてください。';
      if (questionId && run) {
        if (run.runId.startsWith('local_') && id) {
          text = getLocalAudioTranscript(id, questionId);
        } else {
          try {
            text = (await api<{ text: string }>(`/jlpt/runs/${run.runId}/audio/${questionId}`)).text;
          } catch {
            if (id) {
              text = getLocalAudioTranscript(id, questionId);
            }
          }
        }
      }
      await playJapanese(text);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSpeaking(false);
    }
  }
  if (query.isLoading) return <Loading />;
  if (!query.data) return <ErrorState error={query.error} />;
  const paper = query.data.paper,
    question = run?.questions[index],
    report = run?.report;
  const answered = run ? Object.values(run.answers).filter(Boolean).length : 0;
  return (
    <>
      {!isExamActive && (
        <Link className="back-link" to="/tests">
          <ArrowLeft size={16} />
          Các đề luyện JLPT
        </Link>
      )}
      {isExamActive && (
        <header className="exam-sticky-bar" aria-label="Thanh công cụ bài thi">
          <div className="exam-sticky-left">
            <span className="exam-mode-badge">
              <ShieldAlert size={14} /> Chế độ làm bài
            </span>
            <strong>{paper.title}</strong>
            {run?.startedAt && (
              <span className="muted">
                · Phần {run.section + 1}/{run.sections.length} ({run.sectionTitle})
              </span>
            )}
          </div>
          <div className="exam-sticky-actions">
            {run?.deadline && !run.finished && (
              <JlptCountdown
                deadline={run.deadline}
                offset={offset.current}
                onExpire={handleExpire}
              />
            )}
            <Button
              variant="ghost"
              size="small"
              onClick={isFullscreen ? exitFullscreen : enterFullscreen}
              title={isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình (Ẩn thanh tab Google)'}
            >
              {isFullscreen ? <Minimize size={15} /> : <Maximize size={15} />}
              <span>{isFullscreen ? 'Thu nhỏ' : 'Ẩn tab Google'}</span>
            </Button>
            <Button
              variant="secondary"
              size="small"
              disabled={busy}
              onClick={() => setEarlySubmitConfirm(true)}
              title="Dừng bài luyện đề và nộp bài ngay"
            >
              <CheckCircle size={15} />
              <span>Nộp bài ngay</span>
            </Button>
          </div>
        </header>
      )}
      {isExamActive && !isFullscreen && (
        <aside className="exam-fullscreen-prompt" role="alert">
          <span>
            💡 Hãy bật chế độ toàn màn hình để ẩn thanh tab Google Chrome, tập trung tối đa cho bài
            làm.
          </span>
          <Button size="small" variant="secondary" onClick={() => void enterFullscreen()}>
            <Maximize size={14} /> Ẩn thanh tab Google
          </Button>
        </aside>
      )}
      <PageHeader
        eyebrow={
          paper.isOfficial
            ? 'JLPT CHÍNH THỨC · ĐỒNG BỘ AUDIO GỐC'
            : 'THI THỬ · ĐỀ TỔNG HỢP BÁM SÁT JLPT'
        }
        title={paper.title}
        description={`${paper.total} câu · ${paper.minutes} phút làm bài · ${paper.sections.length} phần`}
        action={
          run?.deadline && !run.finished ? (
            <JlptCountdown
              deadline={run.deadline}
              offset={offset.current}
              onExpire={handleExpire}
            />
          ) : undefined
        }
      />
      {error && (
        <div className="feedback incorrect" role="alert">
          <p>{error}</p>
          {run && (
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => {
                setBusy(true);
                void api<JlptRunView>('/jlpt/runs/' + run.runId)
                  .then((next) => {
                    apply(next);
                    setError('');
                  })
                  .catch((e) => setError(e.message))
                  .finally(() => setBusy(false));
              }}
            >
              Tải lại bài đã lưu
            </Button>
          )}
        </div>
      )}
      {!run ? (
        <section className="panel jlpt-intro">
          <h2>Trước khi bắt đầu</h2>
          <ol>
            {paper.sections.map((s) => (
              <li key={s.id}>
                <strong>{s.title}</strong>
                <span>
                  {s.count} câu · {s.minutes} phút
                </span>
              </li>
            ))}
          </ol>
          <p>
            Đồng hồ riêng cho từng phần. Đáp án được lưu sau mỗi lần chọn; tải lại trang vẫn tiếp
            tục thời gian cũ. Phần đã kết thúc không mở lại. Bạn chủ động bắt đầu phần kế tiếp sau
            khoảng nghỉ.
          </p>
          {paper.isOfficial ? (
            <p>
              Đây là đề thi JLPT N5 chính thức có âm thanh gốc đồng bộ theo từng câu hỏi. Bạn có thể
              nghe trực tiếp trên từng câu với trình phát âm thanh tích hợp sẵn.
            </p>
          ) : (
            <p>
              Không bật chú thích tự động hoặc dịch câu khi đang thi. Nghe hiểu dùng giọng Nhật tổng
              hợp trên thiết bị, có thể phát lại từng câu; không phải băng thi hay nhịp phát tự động
              của JLPT chính thức. Tình huống phát ngôn được mô tả bằng chữ.
            </p>
          )}
          <p>
            Kết quả là tỷ lệ câu đúng và thống kê từng nhóm, không quy đổi thành điểm JLPT 180 hoặc
            kết luận đỗ/trượt.
          </p>
          <div className="inline-actions">
            {!paper.isOfficial && (
              <Button variant="secondary" disabled={speaking} onClick={() => void audio()}>
                <Volume2 size={16} />
                Thử giọng Nhật
              </Button>
            )}
            <Button disabled={busy || speaking} onClick={() => void start()}>
              Bắt đầu phần 1<ArrowRight size={16} />
            </Button>
          </div>
        </section>
      ) : report ? (
        <>
          <section className="panel jlpt-intro">
            <h2>Đã hoàn thành bài thi</h2>
            <p>
              <strong>{report.score}%</strong> câu đúng ·{' '}
              {report.results.filter((q) => q.correct).length}/{report.results.length} câu ·{' '}
              {clock(report.duration)} làm bài
            </p>
            <p>Đây là kết quả luyện tập, không phải điểm chuẩn hóa JLPT.</p>
            <div className="jlpt-score-groups">
              {report.groups.map((g) => (
                <div key={g.label}>
                  <strong>{g.label}</strong>
                  <span>
                    {g.correct}/{g.total} câu đúng
                  </span>
                </div>
              ))}
            </div>
            <Button
              variant="secondary"
              onClick={() => {
                setRun(null);
                setIndex(0);
              }}
            >
              Làm lại đề
            </Button>
          </section>
          <section className="panel spaced">
            <h2>Đáp án và giải thích</h2>
            {report.results.map((q, i) => (
              <details className="jlpt-result" key={q.id}>
                <summary>
                  {i + 1}. {q.group} · {q.correct ? 'Đúng' : q.given ? 'Sai' : 'Bỏ trống'}
                </summary>
                {q.imageUrl && (
                  <div style={{ marginBlock: '12px' }}>
                    <img
                      src={q.imageUrl}
                      alt="Hình minh họa"
                      className="jlpt-question-image"
                      style={{ maxHeight: '280px', objectFit: 'contain' }}
                    />
                  </div>
                )}
                {q.audioUrl && (
                  <div className="jlpt-audio-player" style={{ marginBlock: '12px' }}>
                    <audio
                      controls
                      preload="auto"
                      src={q.audioUrl}
                      className="jlpt-audio-element"
                    />
                  </div>
                )}
                <p className="jlpt-passage" lang="ja">
                  {q.passage}
                </p>
                <p lang="ja">{q.prompt}</p>
                <p>
                  Bạn chọn: {q.given || '—'} · Đáp án: {q.answer}
                </p>
                <p>{q.explanation}</p>
                {q.transcript && (
                  <p className="jlpt-passage" lang="ja">
                    {q.transcript}
                  </p>
                )}
              </details>
            ))}
          </section>
        </>
      ) : !run.startedAt ? (
        <section className="panel jlpt-intro">
          <h2>Đã kết thúc phần {run.section}</h2>
          <p>
            Phần tiếp theo: {run.sectionTitle}. Thời gian {run.sections[run.section].minutes} phút.
            Đồng hồ bắt đầu khi bạn chọn nút dưới.
          </p>
          <div className="inline-actions spaced">
            <Button disabled={busy} onClick={() => void command('begin')}>
              Bắt đầu phần {run.section + 1}
              <ArrowRight size={16} />
            </Button>
            <Button variant="secondary" disabled={busy} onClick={() => setEarlySubmitConfirm(true)}>
              <CheckCircle size={15} />
              Dừng thi & nộp bài ngay
            </Button>
          </div>
        </section>
      ) : (
        <>
          <div className="jlpt-section-heading">
            <div>
              <span className="eyebrow">
                PHẦN {run.section + 1}/{run.sections.length}
              </span>
              <h2>{run.sectionTitle}</h2>
              <p aria-live="polite">
                {busy ? 'Đang lưu…' : `${answered}/${run.questions.length} câu đã lưu`}
              </p>
            </div>
            <div className="inline-actions">
              <Button
                variant="secondary"
                disabled={busy || isExpired}
                onClick={() => setConfirm(true)}
              >
                Kết thúc phần này
              </Button>
            </div>
          </div>
          <div className="jlpt-layout">
            <section className="panel jlpt-question">
              {question && (
                <>
                  <div className="eyebrow">
                    {question.group} · CÂU {index + 1}/{run.questions.length}
                  </div>
                  {question.passage && (
                    <div className="jlpt-passage" lang="ja">
                      {question.passage}
                    </div>
                  )}
                  {question.imageUrl && (
                    <div style={{ marginBlock: '12px' }}>
                      <img
                        src={question.imageUrl}
                        alt="Hình minh họa câu hỏi"
                        className="jlpt-question-image"
                      />
                    </div>
                  )}
                  <h2 lang="ja">{question.prompt}</h2>
                  {question.category === 'listening' && (
                    <ExamAudioPlayer
                      key={question.id}
                      src={question.audioUrl}
                      transcript={(question as { transcript?: string }).transcript}
                      questionId={question.id}
                      runId={run.runId}
                      paperId={id}
                    />
                  )}
                  <QuestionInput
                    question={{ ...question, numbered: true }}
                    value={run.answers[question.id] || ''}
                    disabled={isExpired}
                    onChange={(value) => handleAnswer(question.id, value)}
                  />
                  <div className="inline-actions jlpt-navigation">
                    <Button
                      variant="secondary"
                      disabled={index === 0 || busy}
                      onClick={() => {
                        stopSpeech();
                        setSpeaking(false);
                        setIndex((i) => i - 1);
                      }}
                    >
                      Câu trước
                    </Button>
                    <Button
                      variant="secondary"
                      disabled={index === run.questions.length - 1 || busy}
                      onClick={() => {
                        stopSpeech();
                        setSpeaking(false);
                        setIndex((i) => i + 1);
                      }}
                    >
                      Câu tiếp
                    </Button>
                  </div>
                </>
              )}
            </section>
            <aside className="panel jlpt-answer-sheet">
              <h2>Phiếu trả lời</h2>
              <p>Đã chọn được tô màu. Có thể đổi đáp án trong phần đang làm.</p>
              <nav aria-label="Chọn câu hỏi">
                {run.questions.map((q, i) => (
                  <button
                    key={q.id}
                    aria-current={i === index ? 'step' : undefined}
                    aria-label={`Câu ${i + 1}${run.answers[q.id] ? ', đã trả lời' : ''}`}
                    className={run.answers[q.id] ? 'answered' : ''}
                    onClick={() => {
                      stopSpeech();
                      setSpeaking(false);
                      setIndex(i);
                    }}
                  >
                    {i + 1}
                  </button>
                ))}
              </nav>
            </aside>
          </div>
        </>
      )}
      <Modal open={confirm} onOpenChange={setConfirm} title="Kết thúc phần thi?">
        <p>
          Còn {(run?.questions.length || 0) - answered} câu chưa trả lời. Phần này sẽ khóa lại và
          không thể quay về.
        </p>
        <div className="inline-actions">
          <Button variant="secondary" disabled={busy} onClick={() => setConfirm(false)}>
            Tiếp tục làm
          </Button>
          <Button disabled={busy} onClick={() => void command('finish')}>
            Xác nhận kết thúc
            <Check size={16} />
          </Button>
        </div>
      </Modal>
      <Modal
        open={earlySubmitConfirm}
        onOpenChange={setEarlySubmitConfirm}
        title="Dừng bài thi và nộp ngay?"
      >
        <p>
          Bạn có chắc chắn muốn dừng bài thi ngay bây giờ không? Các câu hỏi chưa làm trong toàn bộ
          bài thi sẽ được tính là chưa đúng và hệ thống sẽ chấm điểm kết quả của bạn ngay lập tức.
        </p>
        <div className="inline-actions">
          <Button variant="secondary" disabled={busy} onClick={() => setEarlySubmitConfirm(false)}>
            Tiếp tục làm bài
          </Button>
          <Button
            disabled={busy}
            onClick={async () => {
              setEarlySubmitConfirm(false);
              await command('finish-all');
              void exitFullscreen();
            }}
          >
            Xác nhận nộp bài ngay
          </Button>
        </div>
      </Modal>
    </>
  );
}
