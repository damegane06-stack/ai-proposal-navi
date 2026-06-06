export type AiExperience =
  | "none"
  | "once"
  | "sometimes"
  | "work_hobby"
  | "daily";

export type KnownUse =
  | "writing"
  | "research"
  | "summary"
  | "translation"
  | "image"
  | "materials"
  | "work_efficiency"
  | "none";

export type Anxiety =
  | "unknown_use"
  | "hard_operation"
  | "privacy"
  | "accuracy"
  | "cost"
  | "work_policy"
  | "none";

export type ThemeId =
  | "life" | "hobby" | "family" | "photo" | "travel" | "cooking"
  | "shopping" | "work" | "community" | "learning" | "budget"
  | "device" | "proposal" | "material_image" | "slides" | "image"
  | "reminder" | "ai_education" | "mail" | "meeting" | "ideas"
  | "customer" | "excel";

export type ConcernId =
  | "operation" | "time" | "schedule" | "writing" | "organize" | "safety";

export type AiLevel = 1 | 2 | 3 | 4 | 5;

export interface Theme {
  id: ThemeId;
  label: string;
  category: "生活・趣味" | "資料・制作" | "仕事活用";
  keywords: string[];
  example: string;
  question: string;
}

export interface Concern {
  id: ConcernId;
  label: string;
  keywords: string[];
  advice: string;
}

export interface LectureInfo {
  enabled: boolean;
  date: string;
  time: string;
  participants: string;
}

export interface AppInput {
  experience: AiExperience;
  knownUses: KnownUse[];
  anxieties: Anxiety[];
  selectedThemes: ThemeId[];
  freeText: string;
  staffMemo: string;
  showStaffMemo: boolean;
  lecture: LectureInfo;
}

export interface Proposal {
  level: AiLevel;
  levelTitle: string;
  levelDescription: string;
  themes: Theme[];
  concerns: Concern[];
  actions: string[];
  safetyTips: string[];
  courseTopics: string[];
}

export interface ImprovementLog {
  createdAt: string;
  freeText: string;
  selectedThemes: string;
  detectedThemes: string;
  concerns: string;
  level: string;
  proposalCategories: string;
  lectureShown: string;
}
