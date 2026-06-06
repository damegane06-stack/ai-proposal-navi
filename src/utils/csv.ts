import type { ImprovementLog } from "../types";

const STORAGE_KEY = "ai_proposal_improvement_logs";

export function loadImprovementLogs(): ImprovementLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveImprovementLog(log: ImprovementLog): void {
  const logs = loadImprovementLogs();
  logs.push(log);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
}

export function clearImprovementLogs(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function exportImprovementLogsToCsv(): void {
  const logs = loadImprovementLogs();
  if (logs.length === 0) { alert("出力するデータがありません。"); return; }
  const headers = ["作成日時", "困りごと", "選択テーマ", "検出テーマ", "困りごと判定", "AIレベル", "提案カテゴリ", "講座案内"];
  const rows = logs.map((log) => [
    log.createdAt, log.freeText, log.selectedThemes, log.detectedThemes,
    log.concerns, log.level, log.proposalCategories, log.lectureShown,
  ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","));
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "improvement_logs.csv"; a.click();
  URL.revokeObjectURL(url);
}
