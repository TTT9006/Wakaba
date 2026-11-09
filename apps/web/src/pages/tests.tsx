import { JapaneseAnnotatedText } from '../components/japanese-annotated-text';
import { JlptSession } from './jlpt';
import type { JlptSummary } from '../../../../packages/shared/jlpt-types';
import { jlptPapers, paperSummary } from '../../../../packages/shared/jlpt-papers';
import { getLocalHistoryAttempts } from '../../../../packages/shared/jlpt-client-runner';
import { useEffect, useState, useMemo } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  ArrowRight,
  Clock3,
  Check,
  RotateCcw,
  Headphones,
  Maximize,
  Minimize,
  ShieldAlert,
  CheckCircle,
  Trophy,
  Target,
  GraduationCap,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { api, post } from '../services/api';
import { useUI } from '../stores/ui';
import type { Attempt, Question, Result } from '../types';
import { Button, Empty, ErrorState, Loading, PageHeader, Modal } from '../components/ui';
type Test = JlptSummary;
export function QuestionInput({
  question: q,
  value,
  onChange,
  disabled = false,
}: {
  question: Question;
  value: string;
  onChange: (s: string) => void;
  disabled?: boolean;
}) {
  if (q.type === 'matching') {
    const selected: string[] = value ? JSON.parse(value) : [];
    return (
      <div className="matching-board">
        {q.rows?.map((row, i) => (
          <label key={row + i}>
            <span lang="ja">
              <JapaneseAnnotatedText
                text={row}
                disabled={q.annotationDisabled}
                readings={q.readings}
              />
            </span>
            <select
              aria-label={'Ghép nghĩa cho ' + row}
              value={selected[i] || ''}
              disabled={disabled}
              onChange={(e) => {
                const next = [...selected];
                next[i] = e.target.value;
                onChange(JSON.stringify(next));
              }}
            >
              <option value="">Chọn nghĩa…</option>
              {q.options?.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
    );
  }
  if (q.type === 'order')
    return (
      <div className="ordering">
        <div className="word-bank">
          {q.options?.map((o, i) => (
            <Button
              key={i}
              disabled={disabled}
              variant="secondary"
              onClick={() => onChange(value + o)}
            >
              <JapaneseAnnotatedText
                text={o}
                disabled={q.annotationDisabled}
                readings={q.readings}
              />
            </Button>
          ))}
          <Button variant="ghost" disabled={disabled} onClick={() => onChange('')}>
            <RotateCcw size={15} />
            Làm lại
          </Button>
        </div>
        <input
          aria-label="Câu đã sắp xếp"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder="Chọn các từ theo thứ tự hoặc nhập câu…"
        />
      </div>
    );
  if (q.options)
    return (
      <div className="answer-options" role="radiogroup" aria-label="Các phương án trả lời">
        {q.options.map((o, i) => (
          <button
            key={o}
            type="button"
            role="radio"
            aria-checked={value === o}
            aria-label={`Lựa chọn ${q.numbered ? i + 1 : String.fromCharCode(65 + i)}: ${o}`}
            disabled={disabled}
            className={value === o ? 'selected' : ''}
            onClick={() => onChange(o)}
          >
            <span className="answer-key" aria-hidden="true">
              {q.numbered ? i + 1 : String.fromCharCode(65 + i)}
            </span>
            <JapaneseAnnotatedText text={o} disabled={q.annotationDisabled} readings={q.readings} />
            {value === o && <Check size={17} />}
          </button>
        ))}
      </div>
    );
  return (
    <input
      className="answer-input"
      aria-label="Câu trả lời"
      placeholder="Nhập câu trả lời của bạn…"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
    />
  );
}
function parseAttemptResults(attempt: Attempt | null): Result[] {
  if (!attempt) return [];

  const paper = jlptPapers.find((p) => p.id === attempt.testId);
  const qMap = new Map(paper?.sections.flatMap((s) => s.questions).map((q) => [q.id, q]));

  let rawList: any[] = [];

  // Case 1: `results` property already exists as an Array on attempt
  if (Array.isArray((attempt as any).results)) {
    rawList = (attempt as any).results;
  }
  // Case 2: `answers` is a string
  else if (typeof attempt.answers === 'string') {
    try {
      const parsed = JSON.parse(attempt.answers);
      if (Array.isArray(parsed)) {
        rawList = parsed;
      } else if (parsed && typeof parsed === 'object') {
        const answersMap = parsed as Record<string, string>;
        if (paper) {
          return paper.sections.flatMap((s) => s.questions).map((q) => ({
            ...q,
            given: answersMap[q.id] || '',
            correct: answersMap[q.id] === q.answer,
          }));
        }
      }
    } catch {
      // not valid JSON
    }
  }
  // Case 3: `answers` is already an object/record (from legacy LocalAttempt)
  else if (attempt.answers && typeof attempt.answers === 'object') {
    if (Array.isArray(attempt.answers)) {
      rawList = attempt.answers;
    } else {
      const answersMap = attempt.answers as Record<string, string>;
      if (paper) {
        return paper.sections.flatMap((s) => s.questions).map((q) => ({
          ...q,
          given: answersMap[q.id] || '',
          correct: answersMap[q.id] === q.answer,
        }));
      }
    }
  }

  // If we have rawList, enrich each item with full question data from paper if available
  if (paper && rawList.length) {
    return rawList.map((r) => {
      const q = qMap.get(r.id);
      return {
        ...q,
        ...r,
        given: r.given ?? '',
        correct: r.correct ?? (r.given === (q?.answer || r.answer)),
        answer: r.answer || q?.answer || '',
        explanation: r.explanation || q?.explanation || '',
        audioUrl: r.audioUrl || q?.audioUrl,
        imageUrl: r.imageUrl || q?.imageUrl,
        passage: r.passage || q?.passage,
        transcript: r.transcript || q?.transcript,
        options: r.options || q?.options,
      };
    });
  }

  return rawList;
}

export function Tests() {
  const [review, setReview] = useState<Attempt | null>(null);
  const [reviewFilter, setReviewFilter] = useState<'all' | 'wrong' | 'correct'>('all');
  const [selectedExamLevel, setSelectedExamLevel] = useState<string>('all');
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'midterm' ? 'midterm' : 'jlpt';
  const [activeTab, setActiveTab] = useState<'jlpt' | 'midterm'>(initialTab);

  const handleTabChange = (tab: 'jlpt' | 'midterm') => {
    setActiveTab(tab);
    setSearchParams(tab === 'midterm' ? { tab: 'midterm' } : {});
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ['tests'],
    queryFn: async () => {
      try {
        const res = await api<Test[]>('/tests');
        if (Array.isArray(res) && res.length >= jlptPapers.length) {
          return res;
        }
      } catch (err) {
        console.warn('Backend /tests unavailable or outdated, using local papers:', err);
      }
      return jlptPapers.map(paperSummary) as unknown as Test[];
    },
  });
  const history = useQuery({
    queryKey: ['test-history'],
    queryFn: async () => {
      let serverAttempts: Attempt[] = [];
      try {
        const res = await api<Attempt[]>('/tests/history');
        if (Array.isArray(res)) serverAttempts = res;
      } catch (err) {
        console.warn('Backend /tests/history unavailable:', err);
      }
      const localAttempts = getLocalHistoryAttempts() as unknown as Attempt[];
      const combined = [...localAttempts, ...serverAttempts];
      combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      // Deduplicate: merge attempts that have identical testId and createdAt within 5 seconds
      const deduplicated: Attempt[] = [];
      const seen = new Set<string>();
      for (const a of combined) {
        const timeKey = `${a.testId}_${new Date(a.createdAt).toISOString().slice(0, 16)}`;
        if (!seen.has(a.id) && !seen.has(timeKey)) {
          seen.add(a.id);
          seen.add(timeKey);
          deduplicated.push(a);
        }
      }
      return deduplicated;
    },
  });

  const allExams = data || [];
  const jlptExams = allExams.filter((t) => !t.isMidterm && !t.isHidden);
  const midtermExams = allExams.filter((t) => t.isMidterm && !t.isHidden);

  const examLevels = ['N5', 'N4', 'N3', 'N2', 'N1'] as const;
  const examCounts = {
    all: jlptExams.length,
    N5: jlptExams.filter((t) => t.level === 'N5').length,
    N4: jlptExams.filter((t) => t.level === 'N4').length,
    N3: jlptExams.filter((t) => t.level === 'N3').length,
    N2: jlptExams.filter((t) => t.level === 'N2').length,
    N1: jlptExams.filter((t) => t.level === 'N1').length,
  };

  const filteredExams =
    selectedExamLevel === 'all'
      ? jlptExams
      : jlptExams.filter((t) => t.level === selectedExamLevel);

  return (
    <>
      {/* Top Mode Selector: JLPT Exams vs Midterm Practice */}
      <div
        className="tabs inline-actions"
        role="tablist"
        aria-label="Phân loại đề thi"
        style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '20px',
          borderBottom: '1px solid var(--line)',
          paddingBottom: '14px',
          flexWrap: 'wrap',
        }}
      >
        <button
          role="tab"
          aria-selected={activeTab === 'jlpt'}
          className={activeTab === 'jlpt' ? 'active' : ''}
          onClick={() => handleTabChange('jlpt')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '15px',
            fontWeight: 600,
            padding: '10px 18px',
            borderRadius: '8px',
          }}
        >
          <GraduationCap size={18} />
          <span>Luyện đề thi JLPT (N1–N5)</span>
          <span className="tab-badge">{jlptExams.length}</span>
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'midterm'}
          className={activeTab === 'midterm' ? 'active' : ''}
          onClick={() => handleTabChange('midterm')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '15px',
            fontWeight: 600,
            padding: '10px 18px',
            borderRadius: '8px',
            borderColor: activeTab === 'midterm' ? 'var(--peach)' : undefined,
          }}
        >
          <BookOpen size={18} />
          <span>Ôn thi Giữa kỳ (JAN01)</span>
          <span
            className="tab-badge"
            style={{
              background: activeTab === 'midterm' ? 'var(--peach)' : 'var(--surface-sunken)',
              color: activeTab === 'midterm' ? '#fff' : 'inherit',
              fontWeight: 700,
            }}
          >
            {midtermExams.length} đề mới
          </span>
        </button>
      </div>

      {activeTab === 'jlpt' ? (
        <>
          <PageHeader
            eyebrow="BIẾT MÌNH ĐÃ ĐI ĐƯỢC BAO XA"
            title="Luyện đề thi JLPT (N1–N5)"
            description="Đề thi đầy đủ thời gian theo cấu trúc chuẩn JLPT. Chấm điểm ở server, lưu bài đang làm và xem lại kết quả từng nhóm."
          />

          {/* Banner linking to Luyện kỹ năng */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 18px',
              backgroundColor: 'var(--surface)',
              borderRadius: '10px',
              border: '1px solid var(--line)',
              marginBlock: '16px 20px',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Target size={20} style={{ color: 'var(--jade)', flexShrink: 0 }} />
              <span style={{ fontSize: '14px', color: 'var(--ink)' }}>
                Bạn muốn rèn luyện từng kỹ năng riêng biệt (Nghe, Đọc, Từ vựng, Ngữ pháp)?
              </span>
            </div>
            <Link
              to="/skills"
              className="pill-btn active"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '6px',
                background: 'var(--jade)',
                color: '#fff',
                textDecoration: 'none',
                fontSize: '13px',
                fontWeight: 600,
                whiteSpace: 'nowrap',
              }}
            >
              Sang mục Luyện kỹ năng <ArrowRight size={14} />
            </Link>
          </div>

          {/* Level Filter Bar */}
          <div className="tabs inline-actions spaced" role="tablist" aria-label="Lọc cấp độ đề thi" style={{ marginBlock: '16px', flexWrap: 'wrap' }}>
            <button
              role="tab"
              aria-selected={selectedExamLevel === 'all'}
              className={selectedExamLevel === 'all' ? 'active' : ''}
              onClick={() => setSelectedExamLevel('all')}
            >
              <span>Tất cả</span>
              <span className="tab-badge">{examCounts.all}</span>
            </button>
            {examLevels.map((lvl) => (
              <button
                key={lvl}
                role="tab"
                aria-selected={selectedExamLevel === lvl}
                className={selectedExamLevel === lvl ? 'active' : ''}
                onClick={() => setSelectedExamLevel(lvl)}
              >
                <span>JLPT {lvl}</span>
                <span className="tab-badge">{examCounts[lvl]}</span>
              </button>
            ))}
          </div>

          {isLoading ? (
            <Loading />
          ) : error ? (
            <ErrorState error={error} />
          ) : filteredExams.length === 0 ? (
            <div className="panel" style={{ textAlign: 'center', padding: '36px 20px', marginBlock: '20px' }}>
              <GraduationCap size={36} style={{ color: 'var(--muted)', margin: '0 auto 12px auto' }} />
              <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>Chưa có đề thi trọn gói 3 phần cho JLPT {selectedExamLevel}</h3>
              <p style={{ color: 'var(--muted)', maxWidth: '540px', margin: '0 auto 18px auto', fontSize: '14px' }}>
                Tuyển tập đề thi JLPT {selectedExamLevel} hiện đã được đưa vào phần <strong>Luyện kỹ năng</strong> (Đọc hiểu, Ngữ pháp, Từ vựng) để bạn luyện tập từng cấu trúc chuyên sâu.
              </p>
              <Link
                to="/skills"
                className="button"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
              >
                <Target size={16} /> Chuyển sang Luyện kỹ năng JLPT {selectedExamLevel}
              </Link>
            </div>
          ) : (
            <div className="test-grid">
              {filteredExams.map((t, i) => (
                <Link
                  className="test-card test-card-official"
                  to={'/tests/' + t.id}
                  key={t.id}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '8px',
                      gap: '8px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <span className="eyebrow" style={{ margin: 0, color: 'var(--jade)', fontWeight: 700 }}>
                      {t.level} · {t.isOfficial ? 'ĐỀ THI CHÍNH THỨC' : 'ĐỀ LUYỆN TẬP'}
                    </span>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <span
                        className="tag"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: t.keySource === 'Đáp án tham khảo' ? 'var(--peach)' : 'var(--jade)',
                          borderColor: t.keySource === 'Đáp án tham khảo' ? 'var(--peach)' : 'var(--jade)',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 600,
                        }}
                      >
                        {t.keySource || (t.isOfficial ? 'Đáp án gốc' : 'Đáp án chuẩn')}
                      </span>
                      <span
                        className="tag"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: t.isDuplicateAudio ? 'var(--peach)' : 'var(--ocean)',
                          borderColor: t.isDuplicateAudio ? 'var(--peach)' : 'var(--ocean)',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 600,
                        }}
                      >
                        <Headphones size={12} />
                        {t.isDuplicateAudio ? (t.duplicateNote || 'Audio trùng 2010–2011') : 'Audio gốc · khớp tự động'}
                      </span>
                    </div>
                  </div>
                  <span className="test-number">{String(i + 1).padStart(2, '0')}</span>
                  <h2>{t.title}</h2>
                  <p>
                    {t.total} câu · {t.minutes} phút · {t.sections.length} phần
                  </p>
                  <ul className="jlpt-card-sections">
                    {t.sections.map((s) => (
                      <li key={s.id}>
                        {s.title}: {s.minutes} phút ({s.count} câu)
                      </li>
                    ))}
                  </ul>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
                    <span>Vào phòng thi & bấm giờ</span>
                    <ArrowRight size={19} />
                  </div>
                </Link>
              ))}
            </div>
          )}

          <p className="spaced">
            Câu hỏi được tổng hợp bám sát JLPT và đề thi chính thức được cung cấp kèm âm thanh gốc đồng bộ theo từng
            câu. Điểm hiển thị là tỷ lệ câu đúng, không phải thang 180 của JLPT.{' '}
            <a
              className="text-link"
              href="https://www.jlpt.jp/e/guideline/testsections.html"
              target="_blank"
              rel="noreferrer"
            >
              Cấu trúc JLPT chính thức
            </a>
            .
          </p>
        </>
      ) : (
        <>
          {/* Dedicated Midterm Practice Section */}
          <PageHeader
            eyebrow="CHUẨN HỌC PHẦN TIẾNG NHẬT 1 · KHÓA JAN01"
            title="Ôn thi Giữa kỳ (JAN01)"
            description="Bộ 4 đề thi thử giữa kỳ theo chuẩn cấu trúc 100 điểm (70 phút) bám sát 100% phạm vi Minna no Nihongo Bài 1 ～ 5 & Hán tự 1A, 1B, 2A, 2B. Gồm 2 phần: Kiến thức ngôn ngữ & Đọc hiểu (60 phút, 50 câu) và Nghe hiểu (10 phút, 15 câu với audio thi thật JLPT)."
          />

          {/* Midterm Syllabus & Format Specs Banner */}
          <div
            style={{
              padding: '16px 20px',
              backgroundColor: 'var(--surface)',
              borderRadius: '10px',
              border: '1px solid var(--line)',
              marginBlock: '16px 24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
              <Sparkles size={20} style={{ color: 'var(--peach)', flexShrink: 0 }} />
              <strong style={{ fontSize: '15px', color: 'var(--ink)' }}>
                Quy chuẩn đề thi giữa kỳ Khóa JAN01 (Đại học FPT)
              </strong>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '12px',
                fontSize: '13px',
                lineHeight: 1.5,
                color: 'var(--muted)',
              }}
            >
              <div style={{ background: 'var(--surface-sunken)', padding: '10px 14px', borderRadius: '8px' }}>
                <strong style={{ color: 'var(--ink)', display: 'block', marginBottom: '4px' }}>
                  📖 Phạm vi Ngữ pháp & Từ vựng
                </strong>
                Minna no Nihongo Bài 1 ～ 5 (Trợ từ は, も, の, か, へ, で, と, から, まで; Dấu sao ★; Nghi vấn từ).
              </div>
              <div style={{ background: 'var(--surface-sunken)', padding: '10px 14px', borderRadius: '8px' }}>
                <strong style={{ color: 'var(--ink)', display: 'block', marginBottom: '4px' }}>
                  ✍️ Phạm vi Hán tự (Kanji)
                </strong>
                4 bộ Hán tự 1A, 1B, 2A, 2B (Cách đọc chữ Hán, Cách viết chữ Hán, Số đếm & Số tiền Yên).
              </div>
              <div style={{ background: 'var(--surface-sunken)', padding: '10px 14px', borderRadius: '8px' }}>
                <strong style={{ color: 'var(--ink)', display: 'block', marginBottom: '4px' }}>
                  ⏱️ Thang điểm & Thời gian
                </strong>
                100 điểm / 70 phút: Phần I (60 phút, 50 câu = 80 điểm) + Phần II (10 phút, 15 câu = 20 điểm).
              </div>
              <div style={{ background: 'var(--surface-sunken)', padding: '10px 14px', borderRadius: '8px' }}>
                <strong style={{ color: 'var(--ink)', display: 'block', marginBottom: '4px' }}>
                  🎧 Âm thanh chuẩn thi thật
                </strong>
                100% file âm thanh trích xuất từ cơ sở dữ liệu JLPT N5 thi thật (không trùng đề mẫu giảng viên).
              </div>
            </div>
          </div>

          {isLoading ? (
            <Loading />
          ) : error ? (
            <ErrorState error={error} />
          ) : (
            <div className="test-grid">
              {midtermExams.map((t, i) => (
                <Link
                  className="test-card test-card-official"
                  to={'/tests/' + t.id}
                  key={t.id}
                  style={{
                    borderColor: 'var(--peach)',
                    boxShadow: '0 2px 10px rgba(240, 100, 70, 0.08)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '8px',
                      gap: '8px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <span className="eyebrow" style={{ margin: 0, color: 'var(--peach)', fontWeight: 700 }}>
                      GIỮA KỲ JAN01 · ĐỀ SỐ 0{i + 1}
                    </span>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <span
                        className="tag"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: 'var(--jade)',
                          borderColor: 'var(--jade)',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 600,
                        }}
                      >
                        <CheckCircle size={12} />
                        Chuẩn 100 điểm
                      </span>
                      <span
                        className="tag"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: 'var(--ocean)',
                          borderColor: 'var(--ocean)',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '11px',
                          fontWeight: 600,
                        }}
                      >
                        <Headphones size={12} />
                        Audio JLPT thật
                      </span>
                    </div>
                  </div>
                  <span className="test-number" style={{ color: 'var(--peach)' }}>
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h2>{t.title}</h2>
                  <p>
                    {t.total} câu · {t.minutes} phút · {t.sections.length} phần thi
                  </p>
                  <ul className="jlpt-card-sections">
                    {t.sections.map((s) => (
                      <li key={s.id}>
                        {s.title}: {s.minutes} phút ({s.count} câu)
                      </li>
                    ))}
                  </ul>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', color: 'var(--peach)', fontWeight: 600 }}>
                    <span>Vào làm bài thi giữa kỳ</span>
                    <ArrowRight size={19} />
                  </div>
                </Link>
              ))}
            </div>
          )}

          <p className="spaced">
            Đề thi giữa kỳ khóa JAN01 được biên soạn chuẩn theo định dạng đề thi đại học với 100 điểm trong 70 phút.
            Học viên làm bài thi theo đúng quy chế bấm giờ từng phần (Phần I: 60 phút, Phần II: 10 phút) và xem kết quả giải thích chi tiết ngay sau khi nộp bài.
          </p>
        </>
      )}

      {/* Recent Attempts History */}
      <section className="panel spaced">
        <h2>Những lần thử gần đây</h2>
        {history.data?.length ? (
          history.data.map((a) => (
            <button className="simple-row history-attempt" key={a.id} onClick={() => setReview(a)}>
              <div>
                <strong>{data?.find((t) => t.id === a.testId)?.title || a.testId}</strong>
                <small>{new Date(a.createdAt).toLocaleString('vi')}</small>
              </div>
              <span>{a.duration} giây</span>
              <strong className={a.score >= 70 ? 'positive' : ''}>{a.score}%</strong>
              <ArrowRight size={16} />
            </button>
          ))
        ) : (
          <p className="muted">Kết quả đầu tiên của bạn sẽ xuất hiện ở đây.</p>
        )}
      </section>

      {/* Review Modal for past attempts */}
      <Modal
        open={review !== null}
        onOpenChange={(o) => {
          if (!o) {
            setReview(null);
            setReviewFilter('all');
          }
        }}
        title="Xem lại bài làm chi tiết"
        className="review-attempt-modal"
      >
        {review && (() => {
          const reviewResults = parseAttemptResults(review);
          const reviewPaper = jlptPapers.find((p) => p.id === review.testId);
          const correctCount = reviewResults.filter((r) => r.correct).length;
          const wrongCount = reviewResults.filter((r) => !r.correct).length;
          const filteredResults =
            reviewFilter === 'wrong'
              ? reviewResults.filter((r) => !r.correct)
              : reviewFilter === 'correct'
              ? reviewResults.filter((r) => r.correct)
              : reviewResults;

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Summary card */}
              <div
                style={{
                  padding: '16px',
                  borderRadius: '10px',
                  background: 'var(--surface)',
                  border: '1px solid var(--line)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '17px', color: 'var(--ink)' }}>
                      {data?.find((t) => t.id === review.testId)?.title || reviewPaper?.title || review.testId}
                    </h3>
                    <small style={{ color: 'var(--muted)', fontSize: '13px' }}>
                      Nộp bài lúc: {new Date(review.createdAt).toLocaleString('vi')} · Thời gian: {review.duration} giây
                    </small>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        fontSize: '18px',
                        fontWeight: 700,
                        color: review.score >= 70 ? 'var(--jade)' : 'var(--peach)',
                        background: review.score >= 70 ? 'rgba(46,125,50,0.1)' : 'rgba(239,83,80,0.1)',
                        padding: '4px 12px',
                        borderRadius: '6px',
                      }}
                    >
                      {review.score}% ({correctCount}/{reviewResults.length} câu)
                    </span>
                    <Link
                      to={'/tests/' + review.testId}
                      className="button button-small"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        textDecoration: 'none',
                        fontSize: '13px',
                        padding: '6px 12px',
                      }}
                    >
                      <RotateCcw size={14} /> Làm lại đề này
                    </Link>
                  </div>
                </div>

                {/* Quick filter tabs */}
                <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--line)', paddingTop: '10px' }}>
                  <button
                    type="button"
                    className={`pill-btn ${reviewFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setReviewFilter('all')}
                    style={{ fontSize: '13px', padding: '4px 12px' }}
                  >
                    Tất cả ({reviewResults.length})
                  </button>
                  <button
                    type="button"
                    className={`pill-btn ${reviewFilter === 'wrong' ? 'active' : ''}`}
                    onClick={() => setReviewFilter('wrong')}
                    style={{
                      fontSize: '13px',
                      padding: '4px 12px',
                      color: reviewFilter === 'wrong' ? '#fff' : 'var(--peach)',
                      borderColor: 'var(--peach)',
                      background: reviewFilter === 'wrong' ? 'var(--peach)' : 'transparent',
                    }}
                  >
                    Câu sai ({wrongCount})
                  </button>
                  <button
                    type="button"
                    className={`pill-btn ${reviewFilter === 'correct' ? 'active' : ''}`}
                    onClick={() => setReviewFilter('correct')}
                    style={{
                      fontSize: '13px',
                      padding: '4px 12px',
                      color: reviewFilter === 'correct' ? '#fff' : 'var(--jade)',
                      borderColor: 'var(--jade)',
                      background: reviewFilter === 'correct' ? 'var(--jade)' : 'transparent',
                    }}
                  >
                    Câu đúng ({correctCount})
                  </button>
                </div>
              </div>

              {/* Questions list */}
              {filteredResults.length === 0 ? (
                <p className="muted" style={{ textAlign: 'center', padding: '20px 0' }}>
                  Không có câu hỏi nào trong mục này.
                </p>
              ) : (
                filteredResults.map((r, i) => (
                  <div
                    key={r.id || i}
                    className={'feedback ' + (r.correct ? 'correct' : 'incorrect')}
                    style={{
                      padding: '16px',
                      borderRadius: '8px',
                      borderLeft: `4px solid ${r.correct ? 'var(--jade)' : 'var(--peach)'}`,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--muted)' }}>
                        Câu {reviewResults.indexOf(r) + 1}
                        {r.group ? ` · ${r.group}` : ''}
                      </span>
                      <span
                        style={{
                          fontSize: '12px',
                          fontWeight: 700,
                          color: r.correct ? 'var(--jade)' : 'var(--peach)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        {r.correct ? <Check size={14} /> : <ShieldAlert size={14} />}
                        {r.correct ? 'ĐÚNG' : 'SAI'}
                      </span>
                    </div>

                    <strong style={{ fontSize: '15px', display: 'block', marginBottom: '8px' }}>
                      <JapaneseAnnotatedText text={r.prompt} />
                    </strong>

                    {r.imageUrl && (
                      <div style={{ marginBlock: '8px' }}>
                        <img
                          src={r.imageUrl}
                          alt="Hình minh họa"
                          className="jlpt-question-image"
                          style={{ maxHeight: '240px', objectFit: 'contain' }}
                        />
                      </div>
                    )}

                    {r.audioUrl && (
                      <div className="jlpt-audio-player" style={{ marginBlock: '8px' }}>
                        <audio controls preload="auto" src={r.audioUrl} className="jlpt-audio-element" />
                      </div>
                    )}

                    {r.passage && (
                      <p className="jlpt-passage" lang="ja" style={{ whiteSpace: 'pre-wrap', marginBlock: '8px' }}>
                        {r.passage}
                      </p>
                    )}

                    {/* Options display */}
                    {Array.isArray(r.options) && r.options.length > 0 && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', marginBlock: '10px' }}>
                        {r.options.map((opt, oIdx) => {
                          const isAns = opt === r.answer;
                          const isUserChoice = opt === r.given;
                          let borderCol = 'var(--line)';
                          let bgCol = 'var(--surface)';
                          if (isAns) {
                            borderCol = 'var(--jade)';
                            bgCol = 'rgba(46, 125, 50, 0.08)';
                          } else if (isUserChoice && !r.correct) {
                            borderCol = 'var(--peach)';
                            bgCol = 'rgba(239, 83, 80, 0.08)';
                          }
                          return (
                            <div
                              key={opt}
                              style={{
                                padding: '8px 12px',
                                borderRadius: '6px',
                                border: `1.5px solid ${borderCol}`,
                                background: bgCol,
                                fontSize: '13px',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                              }}
                            >
                              <span>
                                <span style={{ fontWeight: 600, marginRight: '6px', color: 'var(--muted)' }}>
                                  {oIdx + 1}.
                                </span>
                                <JapaneseAnnotatedText text={opt} />
                              </span>
                              {isAns && (
                                <span style={{ fontSize: '11px', color: 'var(--jade)', fontWeight: 700 }}>
                                  ✓ Đáp án đúng
                                </span>
                              )}
                              {isUserChoice && !isAns && (
                                <span style={{ fontSize: '11px', color: 'var(--peach)', fontWeight: 700 }}>
                                  ✗ Bạn chọn
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div style={{ fontSize: '13px', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <p style={{ margin: 0 }}>
                        <strong>Bạn đã chọn: </strong>
                        <span style={{ color: r.correct ? 'var(--jade)' : 'var(--peach)', fontWeight: 600 }}>
                          <JapaneseAnnotatedText text={r.given || '(Chưa trả lời)'} />
                        </span>
                      </p>
                      <p style={{ margin: 0 }}>
                        <strong>Đáp án đúng: </strong>
                        <span style={{ color: 'var(--jade)', fontWeight: 600 }}>
                          <JapaneseAnnotatedText text={r.answer} />
                        </span>
                      </p>
                    </div>

                    {r.explanation && (
                      <div style={{ marginTop: '10px', padding: '10px', background: 'var(--surface-sunken)', borderRadius: '6px', fontSize: '13px' }}>
                        <strong style={{ color: 'var(--ink)', display: 'block', marginBottom: '4px' }}>
                          💡 Giải thích:
                        </strong>
                        <JapaneseAnnotatedText text={r.explanation} />
                      </div>
                    )}

                    {r.transcript && (
                      <details style={{ marginTop: '8px', fontSize: '13px' }}>
                        <summary style={{ cursor: 'pointer', color: 'var(--ocean)', fontWeight: 600 }}>
                          📜 Xem lời thoại bài nghe (Transcript)
                        </summary>
                        <p className="jlpt-passage" lang="ja" style={{ whiteSpace: 'pre-wrap', marginTop: '6px' }}>
                          {r.transcript}
                        </p>
                      </details>
                    )}
                  </div>
                ))
              )}
            </div>
          );
        })()}
      </Modal>
    </>
  );
}
export function TestSession() {
  const { id } = useParams();
  const isJlpt = Boolean(
    id?.startsWith('jlpt-') ||
    id?.startsWith('midterm-') ||
    jlptPapers.some((p) => p.id === id)
  );
  return isJlpt ? <JlptSession key={id} /> : <LegacyTestSession key={id} />;
}
function LegacyTestSession() {
  const { id } = useParams();
  const client = useQueryClient();
  const notify = useUI((s) => s.notify);
  const setExamMode = useUI((s) => s.setExamMode);
  const [run, setRun] = useState<{
    runId: string;
    startedAt: string;
    questions: Question[];
  } | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{
    score: number;
    results: Result[];
    duration: number;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(Boolean(document.fullscreenElement));
  const [confirmSubmit, setConfirmSubmit] = useState(false);

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

  const isExamActive = Boolean(run && !result);

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

  useEffect(() => {
    if (!run || result) return;
    const timer = setInterval(
      () => setElapsed(Math.floor((Date.now() - new Date(run.startedAt).getTime()) / 1000)),
      1000,
    );
    return () => clearInterval(timer);
  }, [run, result]);
  const start = async () => {
    setBusy(true);
    setError('');
    void enterFullscreen();
    try {
      setRun(await post('/tests/' + id + '/start'));
      setAnswers({});
      setResult(null);
      setElapsed(0);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const submit = async () => {
    setBusy(true);
    try {
      setResult(await post('/tests/' + id + '/submit', { runId: run?.runId, answers }));
      void client.invalidateQueries({ queryKey: ['dashboard'] });
      void client.invalidateQueries({ queryKey: ['test-history'] });
      void exitFullscreen();
      setExamMode(false);
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      {!isExamActive && (
        <Link className="back-link" to="/tests">
          <ArrowLeft size={16} />
          Danh sách đề thi
        </Link>
      )}
      {isExamActive && (
        <header className="exam-sticky-bar" aria-label="Thanh công cụ bài thi">
          <div className="exam-sticky-left">
            <span className="exam-mode-badge">
              <ShieldAlert size={14} /> Chế độ làm bài
            </span>
            <strong>Bài luyện đề</strong>
            <span className="muted">· {Object.keys(answers).filter((k) => answers[k]).length}/{run?.questions.length || 0} câu đã trả lời</span>
          </div>
          <div className="exam-sticky-actions">
            <span className="timer">
              <Clock3 size={16} />
              {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}
            </span>
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
              onClick={() => setConfirmSubmit(true)}
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
            💡 Hãy bật chế độ toàn màn hình để ẩn thanh tab Google Chrome, tập trung tối đa cho bài làm.
          </span>
          <Button size="small" variant="secondary" onClick={() => void enterFullscreen()}>
            <Maximize size={14} /> Ẩn thanh tab Google
          </Button>
        </aside>
      )}
      <PageHeader
        eyebrow="TẬP TRUNG MỘT CHÚT"
        title={result ? 'Bạn đã hoàn thành.' : 'Sẵn sàng thử sức?'}
        description={
          run
            ? `${Object.keys(answers).filter((k) => answers[k]).length}/${run.questions.length} câu đã trả lời`
            : 'Bài làm được tính giờ từ khi bắt đầu. Kết quả chỉ được lưu khi bạn nộp bài.'
        }
        action={
          run && (
            <span className="timer">
              <Clock3 size={17} />
              {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}
            </span>
          )
        }
      />
      {error && (
        <p className="error-text" role="alert">
          {error}
        </p>
      )}
      {!run ? (
        <Empty title="Sẵn sàng luyện đề">
          <p>Đọc kỹ từng câu và chọn đáp án bạn tin là đúng.</p>
          <Button disabled={busy} onClick={() => void start()}>
            {busy ? 'Đang chuẩn bị…' : 'Bắt đầu bài kiểm tra'}
            <ArrowRight size={16} />
          </Button>
        </Empty>
      ) : result ? (
        <>
          <section className="score-panel">
            <span className="eyebrow">KẾT QUẢ CỦA BẠN</span>
            <strong>
              {result.score}
              <small>%</small>
            </strong>
            <p>
              {result.results.filter((r) => r.correct).length}/{result.results.length} câu đúng ·{' '}
              {result.duration} giây
            </p>
            <p>
              {result.score >= 80
                ? 'Bạn đang nắm khá vững kiến thức này.'
                : 'Xem lại các câu dưới đây để hiểu rõ hơn nhé.'}
            </p>
            <Button variant="secondary" onClick={() => void start()}>
              <RotateCcw size={16} />
              Thử lại
            </Button>
          </section>
          {result.results.map((r, i) => (
            <div
              className={'feedback result-card ' + (r.correct ? 'correct' : 'incorrect')}
              key={r.id}
            >
              <h3>
                {i + 1}. <JapaneseAnnotatedText text={r.prompt} />
              </h3>
              <p>
                Bạn trả lời: <JapaneseAnnotatedText text={r.given || '(Chưa trả lời)'} />
              </p>
              <p>
                <strong>
                  Đáp án: <JapaneseAnnotatedText text={r.answer} />
                </strong>
              </p>
              <p>
                <JapaneseAnnotatedText text={r.explanation} />
              </p>
            </div>
          ))}
        </>
      ) : (
        <>
          <section className="panel">
            {run.questions.map((q, i) => (
              <div className="exercise" key={q.id}>
                <h3>
                  {i + 1}.{' '}
                  <JapaneseAnnotatedText
                    text={q.prompt}
                    disabled={q.annotationDisabled}
                    readings={q.readings}
                  />
                </h3>
                <QuestionInput
                  question={q}
                  value={answers[q.id] || ''}
                  onChange={(value) => setAnswers({ ...answers, [q.id]: value })}
                  disabled={busy}
                />
              </div>
            ))}
          </section>
          <div className="submit-test">
            <p>Câu bỏ trống sẽ được tính là chưa đúng.</p>
            <Button disabled={busy} onClick={() => setConfirmSubmit(true)}>
              Nộp bài
              <Check size={17} />
            </Button>
          </div>
        </>
      )}
      <Modal open={confirmSubmit} onOpenChange={setConfirmSubmit} title="Dừng bài luyện đề & nộp ngay?">
        <p>
          Bạn có chắc chắn muốn dừng bài luyện đề và nộp bài ngay bây giờ không? Còn {run ? run.questions.length - Object.keys(answers).filter((k) => answers[k]).length : 0} câu chưa trả lời. Các câu bỏ trống sẽ được tính là chưa đúng.
        </p>
        <div className="inline-actions">
          <Button variant="secondary" disabled={busy} onClick={() => setConfirmSubmit(false)}>
            Tiếp tục làm bài
          </Button>
          <Button
            disabled={busy}
            onClick={() => {
              setConfirmSubmit(false);
              void submit();
            }}
          >
            Xác nhận nộp bài ngay
          </Button>
        </div>
      </Modal>
    </>
  );
}
