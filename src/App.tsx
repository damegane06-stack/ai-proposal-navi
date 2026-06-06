import { CalendarDays, Download, FileText, Printer, RotateCcw, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { themes } from "./data/themes";
import { buildProposal, calculateAiLevel, createImprovementLog, detectThemes } from "./ruleEngine";
import type { AiExperience, Anxiety, AppInput, KnownUse, LectureInfo, ThemeId } from "./types";
import {
  clearImprovementLogs,
  exportImprovementLogsToCsv,
  loadImprovementLogs,
  saveImprovementLog,
} from "./utils/csv";

const initialInput: AppInput = {
  experience: "none",
  knownUses: ["none"],
  anxieties: ["unknown_use"],
  selectedThemes: [],
  freeText: "",
  staffMemo: "",
  showStaffMemo: false,
  lecture: {
    enabled: false,
    date: "",
    time: "13:00〜15:00",
    participants: "1名",
  },
};

const experienceOptions: { value: AiExperience; label: string }[] = [
  { value: "none", label: "AIを使ったことがない" },
  { value: "once", label: "1〜2回だけ使った" },
  { value: "sometimes", label: "ときどき使っている" },
  { value: "work_hobby", label: "仕事や趣味でも使っている" },
  { value: "daily", label: "日常的に活用している" },
];

const knownUseOptions: { value: KnownUse; label: string }[] = [
  { value: "writing", label: "文章作成" },
  { value: "research", label: "調べ物" },
  { value: "summary", label: "要約" },
  { value: "translation", label: "翻訳" },
  { value: "image", label: "画像生成" },
  { value: "materials", label: "資料作成" },
  { value: "work_efficiency", label: "仕事の効率化" },
  { value: "none", label: "まだない" },
];

const anxietyOptions: { value: Anxiety; label: string }[] = [
  { value: "unknown_use", label: "何に使えるかわからない" },
  { value: "hard_operation", label: "操作が難しそう" },
  { value: "privacy", label: "個人情報が心配" },
  { value: "accuracy", label: "答えが間違っていそう" },
  { value: "cost", label: "お金がかかりそう" },
  { value: "work_policy", label: "仕事で使ってよいかわからない" },
  { value: "none", label: "特に不安はない" },
];

const timeOptions = ["10:00〜12:00", "13:00〜15:00", "15:30〜17:30"];
const participantOptions = ["1名", "2名", "3名", "4名", "その他"];

function App() {
  const [input, setInput] = useState<AppInput>(initialInput);
  const [createdInput, setCreatedInput] = useState<AppInput | null>(null);
  const [createdProposal, setCreatedProposal] = useState<ReturnType<typeof buildProposal> | null>(null);
  const [logCount, setLogCount] = useState(() => loadImprovementLogs().length);

  const detectedThemes = useMemo(() => detectThemes(input.freeText, input.selectedThemes), [input.freeText, input.selectedThemes]);
  const level = useMemo(() => calculateAiLevel(input), [input]);
  const proposal = useMemo(() => buildProposal(input, detectedThemes, level), [detectedThemes, input, level]);
  const generated = createdProposal !== null && createdInput !== null;

  function update<K extends keyof AppInput>(key: K, value: AppInput[K]) {
    setInput((current) => ({ ...current, [key]: value }));
    setCreatedInput(null);
    setCreatedProposal(null);
  }

  function toggleArray<T extends string>(items: T[], value: T, exclusive?: T): T[] {
    if (value === exclusive) return [value];
    const withoutExclusive = exclusive ? items.filter((item) => item !== exclusive) : items;
    if (withoutExclusive.includes(value)) return withoutExclusive.filter((item) => item !== value);
    return [...withoutExclusive, value];
  }

  function updateLecture(value: Partial<LectureInfo>) {
    setInput((current) => ({ ...current, lecture: { ...current.lecture, ...value } }));
    setCreatedInput(null);
    setCreatedProposal(null);
  }

  function generateProposal() {
    saveImprovementLog(createImprovementLog(input, proposal));
    setLogCount(loadImprovementLogs().length);
    setCreatedInput(input);
    setCreatedProposal(proposal);
  }

  function resetAll() {
    setInput(initialInput);
    setCreatedInput(null);
    setCreatedProposal(null);
  }

  function clearLogs() {
    clearImprovementLogs();
    setLogCount(0);
  }

  return (
    <main className="app-shell">
      <header className="app-header no-print">
        <div className="header-main">
          <p className="app-kicker">店頭接客・会員様向け提案書作成</p>
          <h1>AI活用提案ナビ</h1>
          <p className="app-desc">入力内容から、AI活用レベルとおすすめテーマをルールベースで整理します。</p>
        </div>
        <div className="header-badges">
          <span className="header-badge">外部AI APIなし</span>
          <span className="header-badge">個人情報入力なし</span>
          <span className="header-badge">印刷対応</span>
        </div>
      </header>

      <div className="workspace">
        <form className="input-panel no-print" onSubmit={(event) => event.preventDefault()}>
          <div className="panel-title">
            <span className="panel-subtitle">スタッフ操作エリア</span>
            <span className="panel-label">入力フォーム</span>
          </div>

          <FormSection
            title="AI経験"
            badge="必須"
            description="会員様がこれまでAIをどのくらい使ったことがあるかを選んでください。"
          >
            <div className="radio-stack">
              {experienceOptions.map((option) => (
                <label key={option.value} className="choice-row">
                  <input
                    type="radio"
                    name="experience"
                    checked={input.experience === option.value}
                    onChange={() => update("experience", option.value)}
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
          </FormSection>

          <FormSection
            title="AIでやったことがあるもの"
            badge="任意"
            description="経験がある内容を選ぶと、提案書のスタート地点がより合いやすくなります。"
          >
            <ChoiceGrid
              options={knownUseOptions}
              values={input.knownUses}
              onToggle={(value) => update("knownUses", toggleArray(input.knownUses, value, "none"))}
            />
          </FormSection>

          <FormSection
            title="AIへの不安"
            badge="任意"
            description="不安な点がある場合は選んでください。提案書に安心して使うための説明を反映します。"
          >
            <ChoiceGrid
              options={anxietyOptions}
              values={input.anxieties}
              onToggle={(value) => update("anxieties", toggleArray(input.anxieties, value, "none"))}
            />
          </FormSection>

          <FormSection
            title="使いたいテーマ"
            badge="任意"
            description="生活、趣味、仕事など、AIを使ってみたい場面を選んでください。"
          >
            <ChoiceGrid
              options={themes.map((theme) => ({ value: theme.id, label: theme.label }))}
              values={input.selectedThemes}
              onToggle={(value) => update("selectedThemes", toggleArray(input.selectedThemes, value))}
            />
          </FormSection>

          <FormSection
            title="困りごと・やりたいこと"
            badge="必須"
            description="最近、生活・趣味・仕事の中で「面倒だな」「誰かに手伝ってほしいな」と思うことを入力してください。"
            examples={["写真が多くて整理できない", "旅行の予定を立てるのが大変", "仕事のメール文を作りたい", "スライド資料を作りたい", "Excelの表を整理したい"]}
          >
            <p className="privacy-note">
              ⚠ 名前、電話番号、住所、会員番号、病名、口座情報などは入力しないでください。内容だけを書けば十分です。
            </p>
            <textarea
              value={input.freeText}
              onChange={(event) => update("freeText", event.target.value)}
              placeholder="ここに困りごとや、AIでやってみたいことを入力してください。"
              rows={7}
            />
          </FormSection>

          <FormSection
            title="スタッフメモ"
            badge="任意"
            description="接客時の補足やスタッフ間で共有したい内容を入力できます。表示ONのときだけ提案書に入ります。"
          >
            <textarea
              value={input.staffMemo}
              onChange={(event) => update("staffMemo", event.target.value)}
              placeholder="例：次回来店時に写真整理の操作を一緒に確認する。"
              rows={4}
            />
            <label className="toggle-row">
              <input
                type="checkbox"
                checked={input.showStaffMemo}
                onChange={(event) => update("showStaffMemo", event.target.checked)}
              />
              <span>スタッフメモを提案書に表示する</span>
            </label>
          </FormSection>

          <FormSection
            title="生成AI活用講座の案内"
            badge="任意"
            description="講座案内を提案書に表示する場合だけ、日付・時間・参加人数を入力してください。"
          >
            <label className="toggle-row">
              <input
                type="checkbox"
                checked={input.lecture.enabled}
                onChange={(event) => updateLecture({ enabled: event.target.checked })}
              />
              <span>生成AI活用講座の案内を提案書に表示する</span>
            </label>
            {input.lecture.enabled && (
              <div className="lecture-fields">
                <label className="field-label">
                  <span>講座日程</span>
                  <input
                    type="date"
                    value={input.lecture.date}
                    onChange={(event) => updateLecture({ date: event.target.value })}
                  />
                </label>
                <label className="field-label">
                  <span>時間</span>
                  <select value={input.lecture.time} onChange={(event) => updateLecture({ time: event.target.value })}>
                    {timeOptions.map((time) => (
                      <option key={time}>{time}</option>
                    ))}
                  </select>
                </label>
                <label className="field-label">
                  <span>参加人数</span>
                  <select value={input.lecture.participants} onChange={(event) => updateLecture({ participants: event.target.value })}>
                    {participantOptions.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </label>
              </div>
            )}
          </FormSection>
        </form>

        <ProposalPreview generated={generated} input={createdInput} proposal={createdProposal} />

        <aside className="action-panel no-print">
          <div className="action-header">
            <p className="action-title">操作</p>
            <span className="action-desc">入力後、提案書を作成して印刷できます。</span>
          </div>
          <button type="button" className="btn-primary" onClick={generateProposal}>
            <FileText size={20} />
            提案書を作成する
          </button>
          <button type="button" className="btn-secondary" onClick={() => window.print()} disabled={!generated}>
            <Printer size={20} />
            提案書を印刷する
          </button>
          <button type="button" className="btn-ghost" onClick={resetAll}>
            <RotateCcw size={18} />
            入力内容をリセットする
          </button>
          <div className="log-tools">
            <p className="log-count">改善用データ：{logCount}件</p>
            <button type="button" className="btn-small" onClick={exportImprovementLogsToCsv}>
              <Download size={16} />
              改善用データをCSV出力
            </button>
            <button type="button" className="btn-small" onClick={clearLogs}>
              <Trash2 size={16} />
              改善用データを削除
            </button>
          </div>
        </aside>
      </div>
    </main>
  );
}

function FormSection({
  title,
  badge,
  description,
  examples,
  children,
}: {
  title: string;
  badge: "必須" | "任意";
  description: string;
  examples?: string[];
  children: React.ReactNode;
}) {
  return (
    <section className="form-section">
      <div className="form-section-header">
        <div className="form-section-meta">
          <span className={badge === "必須" ? "badge-required" : "badge-optional"}>{badge}</span>
          <h2>{title}</h2>
        </div>
        <p className="form-section-desc">{description}</p>
      </div>
      {examples && (
        <div className="example-box">
          <span className="example-label">入力例</span>
          <ul>
            {examples.map((example) => (
              <li key={example}>{example}</li>
            ))}
          </ul>
        </div>
      )}
      {children}
    </section>
  );
}

function ChoiceGrid<T extends string>({
  options,
  values,
  onToggle,
}: {
  options: { value: T; label: string }[];
  values: T[];
  onToggle: (value: T) => void;
}) {
  return (
    <div className="choice-grid">
      {options.map((option) => (
        <label key={option.value} className={`choice-chip${values.includes(option.value) ? " choice-chip--checked" : ""}`}>
          <input type="checkbox" checked={values.includes(option.value)} onChange={() => onToggle(option.value)} />
          <span>{option.label}</span>
        </label>
      ))}
    </div>
  );
}

function ProposalPreview({
  generated,
  input,
  proposal,
}: {
  generated: boolean;
  input: AppInput | null;
  proposal: ReturnType<typeof buildProposal> | null;
}) {
  if (!generated || !input || !proposal) {
    return (
      <article className="proposal-sheet proposal-empty">
        <header className="proposal-header">
          <div className="proposal-header-left">
            <p className="proposal-kicker">AI活用提案書</p>
            <h2 className="proposal-title">あなた向けAI活用提案書</h2>
          </div>
          <span className="proposal-status proposal-status--empty">未作成</span>
        </header>
        <div className="empty-state">
          <p className="empty-state-main">左のフォームに入力後、「提案書を作成する」ボタンを押してください。</p>
          <p className="empty-state-sub">会員様のAI活用レベルとおすすめテーマが表示されます。</p>
        </div>
      </article>
    );
  }

  return (
    <article className="proposal-sheet">
      <header className="proposal-header">
        <div className="proposal-header-left">
          <p className="proposal-kicker">AI活用提案書</p>
          <h2 className="proposal-title">あなた向けAI活用提案書</h2>
        </div>
        <span className="proposal-date">作成日：{formatDate(new Date().toISOString().slice(0, 10))}</span>
      </header>

      <section className="doc-section">
        <h3 className="doc-heading">現在のおすすめスタート地点</h3>
        <div className="level-box">
          <strong className="level-title">{proposal.levelTitle}</strong>
          <p className="level-desc">{proposal.levelDescription}</p>
        </div>
      </section>

      <section className="doc-section">
        <h3 className="doc-heading">おすすめテーマ</h3>
        <div className="theme-table">
          {proposal.themes.map((theme, index) => (
            <div className="theme-row" key={theme.id}>
              <div className="theme-label-col">
                <span className="theme-num">テーマ {index + 1}</span>
                <strong className="theme-name">{theme.label}</strong>
              </div>
              <div className="theme-body-col">
                <p className="theme-category">{theme.category}</p>
                <p className="theme-example">{theme.example}</p>
                <div className="question-box">
                  <span className="question-label">そのまま使える質問例</span>
                  <p className="question-text">{theme.question}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {proposal.concerns.length > 0 && (
        <section className="doc-section">
          <h3 className="doc-heading">困りごとへのおすすめ</h3>
          <div className="concern-table">
            {proposal.concerns.map((concern) => (
              <div className="concern-row" key={concern.id}>
                <div className="concern-label-col">
                  <strong>{concern.label}</strong>
                </div>
                <div className="concern-body-col">
                  <p>{concern.advice}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="doc-section doc-columns">
        <div className="doc-col">
          <h3 className="doc-heading">次の一歩</h3>
          <ol className="doc-list">
            {proposal.actions.map((action) => (
              <li key={action}>{action}</li>
            ))}
          </ol>
        </div>
        <div className="doc-col">
          <h3 className="doc-heading">安全に使うための注意点</h3>
          <ul className="doc-list">
            {proposal.safetyTips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </div>
      </section>

      {input.lecture.enabled && input.lecture.date && (
        <section className="reservation-card">
          <div className="reservation-header">
            <CalendarDays size={20} className="reservation-icon" />
            <span className="reservation-heading">生成AI活用講座 参加予定</span>
          </div>
          <p className="reservation-date">{formatDate(input.lecture.date)}</p>
          <div className="reservation-meta">
            <span className="reservation-meta-item">{input.lecture.time}</span>
            <span className="reservation-meta-item">参加人数：{input.lecture.participants}</span>
          </div>
          <p className="reservation-note">この日に生成AI活用講座の予約をしています。ご来店時はこの用紙をお持ちください。</p>
        </section>
      )}

      {input.lecture.enabled && !input.lecture.date && (
        <section className="reservation-card reservation-card--empty no-print">
          <div className="reservation-header">
            <CalendarDays size={20} className="reservation-icon" />
            <span className="reservation-heading">講座案内</span>
          </div>
          <p>講座案内を表示する場合は、講座日程を入力してください。</p>
        </section>
      )}

      <section className="doc-section">
        <h3 className="doc-heading">AI活用コースで一緒にできること</h3>
        <div className="course-grid">
          {proposal.courseTopics.map((topic) => (
            <span key={topic} className="course-tag">{topic}</span>
          ))}
        </div>
      </section>

      {input.showStaffMemo && input.staffMemo.trim() && (
        <section className="doc-section staff-memo">
          <h3 className="doc-heading">スタッフメモ</h3>
          <p className="staff-memo-text">{input.staffMemo}</p>
        </section>
      )}
    </article>
  );
}

function formatDate(dateValue: string): string {
  const date = new Date(`${dateValue}T00:00:00`);
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(date);
}

export default App;
