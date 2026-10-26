import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Headphones, BookOpen, Sparkles, FileText, ArrowRight, Target } from 'lucide-react';
import { api } from '../services/api';
import { Button, Empty, ErrorState, Loading, PageHeader, Modal } from '../components/ui';
import { JapaneseAnnotatedText } from '../components/japanese-annotated-text';
import { SkillPracticeModal } from '../components/skill-practice-modal';
import type { JlptLevel, SkillType } from '../../../../packages/shared/jlpt-types';
import { getSkillExercises, type SkillExerciseSet } from '../../../../packages/shared/jlpt-skills';
import type { Attempt, Result } from '../types';

export function SkillsPage() {
  const [activeSkill, setActiveSkill] = useState<SkillType>('listening');
  const [activeSkillLevel, setActiveSkillLevel] = useState<JlptLevel>('N5');
  const [activeSet, setActiveSet] = useState<SkillExerciseSet | null>(null);
  const [isSkillModalOpen, setIsSkillModalOpen] = useState(false);
  const [review, setReview] = useState<Attempt | null>(null);

  const {
    data: skillSets,
    isLoading: isLoadingSkills,
    error: skillsError,
  } = useQuery({
    queryKey: ['skill-sets', activeSkill, activeSkillLevel],
    queryFn: async () => {
      try {
        const res = await api<SkillExerciseSet[]>(
          `/jlpt/skills/${activeSkill}/${activeSkillLevel}`,
        );
        if (Array.isArray(res) && res.length > 0) return res;
      } catch (err) {
        console.warn(
          'Backend /jlpt/skills chưa sẵn sàng hoặc trả về lỗi, dùng dữ liệu client-side:',
          err,
        );
      }
      return getSkillExercises(activeSkill, activeSkillLevel);
    },
  });

  const history = useQuery({
    queryKey: ['test-history'],
    queryFn: () => api<Attempt[]>('/tests/history'),
  });

  const skillOptions: Array<{ id: SkillType; label: string; icon: any; desc: string }> = [
    {
      id: 'listening',
      label: 'Nghe hiểu (聴解)',
      icon: Headphones,
      desc: 'Kho bài nghe chuẩn hóa theo giáo trình Goukaku Dekiru (N4–N5), Speed Master (N3), Shin Kanzen (N2) chia theo dạng bài/CD/track. Hỗ trợ tua lại, chọn tốc độ (0.8x, 1.0x, 1.2x) và tự động mở bản chép lời (transcript) đối chiếu sau khi nộp bài.',
    },
    {
      id: 'reading',
      label: 'Đọc hiểu (読解)',
      icon: BookOpen,
      desc: 'Trích xuất bài đọc hiểu thực tế từ các kỳ thi JLPT kèm câu hỏi, từ vựng và đáp án giải thích chi tiết.',
    },
    {
      id: 'vocabulary',
      label: 'Từ vựng (文字・語彙)',
      icon: Sparkles,
      desc: 'Luyện tập đa dạng: cách đọc Kanji, ngữ cảnh câu, từ đồng nghĩa và cách dùng từ trong câu. Tích hợp nút 1-chạm đưa toàn bộ từ làm sai vào Flashcard (SM-2) để ghi nhớ ngắt quãng!',
    },
    {
      id: 'grammar',
      label: 'Ngữ pháp (文法)',
      icon: FileText,
      desc: 'Ngữ pháp N5–N2 tự biên soạn nguyên bản (không sao chép nguyên văn sách), đầy đủ dạng bài lựa chọn mẫu câu, sắp xếp sao (*) và đọc hiểu ngữ pháp đoạn văn.',
    },
  ];

  const currentSkillInfo = skillOptions.find((s) => s.id === activeSkill) || skillOptions[0];
  const skillAttempts = history.data?.filter((a) => a.testId.startsWith('skill-')) || [];

  return (
    <>
      <PageHeader
        eyebrow="RÈN LUYỆN TỪNG BƯỚC"
        title="Luyện 4 kỹ năng tiếng Nhật (N5–N2)"
        description="Tập trung nâng cao từng kỹ năng Nghe hiểu, Đọc hiểu, Từ vựng, và Ngữ pháp theo giáo trình chuẩn quốc tế."
      />

      {/* 1. Skill Selector Tabs */}
      <div className="skill-tabs-bar" role="tablist" aria-label="Chọn kỹ năng luyện tập">
        {skillOptions.map((opt) => {
          const Icon = opt.icon;
          const isActive = activeSkill === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`skill-tab-pill ${isActive ? 'active' : ''}`}
              onClick={() => setActiveSkill(opt.id)}
            >
              <Icon size={16} />
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>

      {/* 2. Level Filter Bar for Skills */}
      <div
        className="tabs inline-actions spaced"
        role="tablist"
        aria-label="Chọn cấp độ kỹ năng"
        style={{ marginBlock: '12px 18px' }}
      >
        {(['N5', 'N4', 'N3', 'N2'] as const).map((lvl) => (
          <button
            key={lvl}
            type="button"
            role="tab"
            aria-selected={activeSkillLevel === lvl}
            className={activeSkillLevel === lvl ? 'active' : ''}
            onClick={() => setActiveSkillLevel(lvl)}
          >
            <span>JLPT {lvl}</span>
          </button>
        ))}
      </div>

      {/* 3. Guidance Banner */}
      <div
        style={{
          padding: '14px 18px',
          backgroundColor: 'var(--surface)',
          borderRadius: '8px',
          border: '1px solid var(--line)',
          marginBottom: '20px',
          fontSize: '13.5px',
          lineHeight: '1.6',
          color: 'var(--ink)',
        }}
      >
        <strong>
          💡 Định hướng luyện {currentSkillInfo.label} — Cấp độ {activeSkillLevel}:
        </strong>{' '}
        {currentSkillInfo.desc}
      </div>

      {/* 4. Exercise Sets Grid */}
      {isLoadingSkills ? (
        <Loading />
      ) : skillsError ? (
        <ErrorState error={skillsError} />
      ) : !skillSets?.length ? (
        <Empty title="Chưa có bài tập cho kỹ năng này" />
      ) : (
        <div className="skill-card-grid">
          {skillSets.map((set) => (
            <div key={set.id} className="skill-card">
              <div className="skill-card-header">
                <span className="level-pill" style={{ padding: '2px 8px', fontSize: '11px' }}>
                  JLPT {set.level}
                </span>
                {set.book && (
                  <span className="tag" style={{ fontSize: '11px', color: 'var(--ocean)' }}>
                    <BookOpen size={12} /> {set.book}
                  </span>
                )}
                <span
                  className="tag"
                  style={{
                    fontSize: '11px',
                    color: set.syncStatus === 'khớp tự động' ? 'var(--jade)' : 'var(--muted)',
                    borderColor: set.syncStatus === 'khớp tự động' ? 'var(--jade)' : 'var(--line)',
                  }}
                >
                  Trạng thái: {set.syncStatus}
                </span>
              </div>
              <h3 className="skill-card-title">{set.title}</h3>
              <p className="skill-card-desc">{set.description}</p>
              <div className="skill-card-footer">
                <span style={{ fontSize: '12px', color: 'var(--muted)' }}>
                  {set.questions.length} câu hỏi · {set.subCategory || 'Bài luyện'}
                </span>
                <Button
                  size="small"
                  onClick={() => {
                    setActiveSet(set);
                    setIsSkillModalOpen(true);
                  }}
                >
                  Luyện tập ngay
                  <ArrowRight size={14} />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 5. Interactive Practice Runner Modal */}
      <SkillPracticeModal
        open={isSkillModalOpen}
        onOpenChange={setIsSkillModalOpen}
        set={activeSet}
        onComplete={() => {
          void history.refetch();
        }}
      />

      {/* 6. Recent Skills Practice History */}
      {skillAttempts.length > 0 && (
        <section className="panel spaced" style={{ marginTop: '36px' }}>
          <h2>Lịch sử luyện kỹ năng gần đây</h2>
          {skillAttempts.slice(0, 10).map((a) => (
            <button className="simple-row history-attempt" key={a.id} onClick={() => setReview(a)}>
              <div>
                <strong>{a.testId.replace('skill-', 'Luyện kỹ năng: ').replace(/-/g, ' ')}</strong>
                <small>{new Date(a.createdAt).toLocaleString('vi')}</small>
              </div>
              <strong className={a.score >= 70 ? 'positive' : ''}>{a.score}%</strong>
              <ArrowRight size={16} />
            </button>
          ))}
        </section>
      )}

      {/* Review Modal for past attempts */}
      <Modal
        open={review !== null}
        onOpenChange={(o) => !o && setReview(null)}
        title="Xem lại bài làm kỹ năng"
      >
        {review &&
          (JSON.parse(review.answers) as Result[]).map((r, i) => (
            <div key={r.id} className={'feedback ' + (r.correct ? 'correct' : 'incorrect')}>
              <strong>
                {i + 1}. <JapaneseAnnotatedText text={r.prompt} />
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
                  <audio
                    controls
                    preload="metadata"
                    src={r.audioUrl}
                    className="jlpt-audio-element"
                  />
                </div>
              )}
              {r.passage && (
                <div className="jlpt-passage" lang="ja">
                  <JapaneseAnnotatedText text={r.passage} />
                </div>
              )}
              <p>
                Bạn chọn: <JapaneseAnnotatedText text={r.given || '(Chưa trả lời)'} />
              </p>
              <p>
                Đáp án: <JapaneseAnnotatedText text={r.answer} />
              </p>
              <small>
                <JapaneseAnnotatedText text={r.explanation} />
              </small>
              {r.transcript && (
                <div
                  style={{
                    marginBlock: '8px',
                    padding: '8px 12px',
                    backgroundColor: 'var(--card)',
                    borderRadius: '6px',
                    borderLeft: '3px solid var(--ocean)',
                    fontSize: '13px',
                  }}
                >
                  <span
                    className="eyebrow"
                    style={{ margin: 0, fontSize: '11px', color: 'var(--ocean)' }}
                  >
                    BẢN CHÉP LỜI (TRANSCRIPT)
                  </span>
                  <div lang="ja" style={{ whiteSpace: 'pre-line', margin: '4px 0 0 0' }}>
                    <JapaneseAnnotatedText text={r.transcript} />
                  </div>
                </div>
              )}
            </div>
          ))}
      </Modal>
    </>
  );
}
