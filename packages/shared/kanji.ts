export type Radical = {
  id: number;
  character: string;
  name: string;
  vietnameseMeaning?: string;
  vietnameseMeanings?: string[];
  vietnameseNames: string[];
  readings: string[];
  characterReadings: string[];
  meanings: string[];
  strokes: number | null;
  variants: { character: string; strokes: number | null; sourceCharacter: string | null }[];
  examples: string[];
  completed?: boolean;
};
export type KanjiInfo = {
  character: string;
  radicalId: number;
  strokes: number | null;
  grade: number | null;
  readings: string[];
  vietnameseNames: string[];
  meanings: string[];
  radicalForm?: string;
  components: { character: string; original?: string; radical?: string; position?: string }[];
  hasStrokes: boolean;
  jlpt?: string | null;
};

export type JlptKanjiSummary = {
  character: string;
  level: string;
  strokes: number | null;
  vietnameseNames: string[];
  readings: string[];
  meanings: string[];
  radicalId?: number | null;
  hasStrokes: boolean;
};

export type JlptKanjiData = {
  total: number;
  byLevel: Record<string, JlptKanjiSummary[]>;
  byCharacter: Record<string, {
    level: string;
    strokes: number | null;
    vietnameseNames: string[];
    readings: string[];
    meanings: string[];
    hasStrokes: boolean;
  }>;
};
