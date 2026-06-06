import { concerns, fallbackThemes, themes } from "./data/themes";
import { courseTopics, levelDescriptions, levelLabels } from "./data/levels";
import type { AiLevel, Anxiety, AppInput, Concern, ImprovementLog, KnownUse, Proposal, Theme, ThemeId } from "./types";

const knownUsePoints: Record<KnownUse, number> = {
  writing: 1, research: 1, summary: 1, translation: 1,
  image: 1, materials: 2, work_efficiency: 2, none: 0,
};

const experiencePoints: Record<AppInput["experience"], number> = {
  none: 0, once: 2, sometimes: 5, work_hobby: 8, daily: 11,
};

const priorityThemeBoosts: Partial<Record<ThemeId, number>> = {
  material_image: 5, reminder: 5, ai_education: 4,
};

export function calculateAiLevel(input: AppInput): AiLevel {
  let score = experiencePoints[input.experience];
  input.knownUses.forEach((use) => { score += knownUsePoints[use] ?? 0; });
  const anxietyPoints: Partial<Record<Anxiety, number>> = {
    privacy: -1, accuracy: -1, hard_operation: -1, work_policy: -1, none: 1,
  };
  input.anxieties.forEach((anxiety) => { score += anxietyPoints[anxiety] ?? 0; });
  if (input.selectedThemes.some((id) => ["work", "mail", "meeting", "ideas", "customer", "excel", "proposal", "material_image", "slides", "ai_education"].includes(id))) {
    score += 1;
  }
  if (score >= 12) return 5;
  if (score >= 9) return 4;
  if (score >= 6) return 3;
  if (score >= 3) return 2;
  return 1;
}

export function detectThemes(freeText: string, selectedThemes: ThemeId[]): Theme[] {
  const normalized = freeText.toLowerCase();
  const themeScores = new Map<ThemeId, number>();
  selectedThemes.forEach((themeId) => { themeScores.set(themeId, (themeScores.get(themeId) ?? 0) + 4); });
  themes.forEach((theme) => {
    theme.keywords.forEach((keyword) => {
      if (normalized.includes(keyword.toLowerCase())) {
        themeScores.set(theme.id, (themeScores.get(theme.id) ?? 0) + 2 + (priorityThemeBoosts[theme.id] ?? 0));
      }
    });
  });
  let detected = themes
    .filter((theme) => themeScores.has(theme.id))
    .sort((a, b) => {
      const scoreDiff = (themeScores.get(b.id) ?? 0) - (themeScores.get(a.id) ?? 0);
      if (scoreDiff !== 0) return scoreDiff;
      return (priorityThemeBoosts[b.id] ?? 0) - (priorityThemeBoosts[a.id] ?? 0);
    })
    .slice(0, 3);
  if (detected.length === 0) {
    detected = themes.filter((theme) => fallbackThemes.includes(theme.id as (typeof fallbackThemes)[number]));
  }
  return detected;
}

export function detectConcerns(freeText: string, anxieties: Anxiety[]): Concern[] {
  const normalized = freeText.toLowerCase();
  const detected = new Map<string, Concern>();
  concerns.forEach((concern) => {
    if (concern.keywords.some((keyword) => normalized.includes(keyword.toLowerCase()))) {
      detected.set(concern.id, concern);
    }
  });
  const anxietyConcernMap: Partial<Record<Anxiety, string>> = {
    unknown_use: "operation", hard_operation: "operation",
    privacy: "safety", accuracy: "safety", work_policy: "safety",
  };
  anxieties.forEach((anxiety) => {
    const concernId = anxietyConcernMap[anxiety];
    const concern = concerns.find((item) => item.id === concernId);
    if (concern) detected.set(concern.id, concern);
  });
  return Array.from(detected.values()).slice(0, 3);
}

export function buildProposal(input: AppInput, detectedThemes: Theme[], level: AiLevel): Proposal {
  const concernList = detectConcerns(input.freeText, input.anxieties);
  const hasReminderTheme = detectedThemes.some((theme) => theme.id === "reminder");
  return {
    level, levelTitle: levelLabels[level], levelDescription: levelDescriptions[level],
    themes: detectedThemes, concerns: concernList,
    actions: [
      "困りごとを1つ選び、AIに短い文章で相談してみる",
      "AIの答えをそのまま使わず、必要なところだけ参考にする",
      "便利だった質問文はメモして、次回も使える形にする",
    ],
    safetyTips: [
      "名前、電話番号、住所、会員番号、口座情報などは入力しない",
      "医療、法律、お金の重要な判断はAIだけで決めない",
      "AIの答えは間違うことがあるため、大切な内容は人が確認する",
      "仕事で使う場合は、入力してよい情報か確認する",
      ...(hasReminderTheme ? [
        "支払い予定を整理するときも、口座番号、会員番号、カード番号などは入力しない",
        "支払うかどうか、契約を変更するかどうかはAIだけで決めず、必ず人に確認する",
      ] : []),
    ],
    courseTopics,
  };
}

export function createImprovementLog(input: AppInput, proposal: Proposal): ImprovementLog {
  return {
    createdAt: new Date().toISOString(),
    freeText: input.freeText,
    selectedThemes: input.selectedThemes.join(" / "),
    detectedThemes: proposal.themes.map((t) => t.label).join(" / "),
    concerns: proposal.concerns.map((c) => c.label).join(" / "),
    level: proposal.levelTitle,
    proposalCategories: Array.from(new Set(proposal.themes.map((t) => t.category))).join(" / "),
    lectureShown: input.lecture.enabled ? "表示" : "非表示",
  };
}
