"use client";

import React, { useState } from "react";
import type {
  AppLanguage,
  EventPlan,
} from "@/engine/types";
import { DICTIONARY } from "./LanguageDictionary";
import { Segmented, SegPanel, SeeAll, Caption } from "./SectionKit";
import { checkDaySchedule } from "@/engine/schedule";
import { getDaysRemaining } from "@/engine/timeline";
import { fallbackGenerateIdeas } from "@/ai/fallback";
import type { SimpleIdeas } from "@/ai/schemas";
import { Clock, CheckSquare, Square, AlertTriangle, ShieldAlert, Utensils, CloudRain, Palette, PiggyBank, Printer } from "lucide-react";

interface SectionTimelineAndIdeasProps {
  currentLanguage: AppLanguage;
  plan: EventPlan;
  onUpdatePlan: (updatedPlan: EventPlan) => void;
}

export function SectionTimelineAndIdeas({
  currentLanguage,
  plan,
  onUpdatePlan,
}: SectionTimelineAndIdeasProps) {
  const t = DICTIONARY[currentLanguage];

  const [activeTab, setActiveTab] = useState<string>("checklist");
  const [tasksExpanded, setTasksExpanded] = useState(false);
  const [blocksExpanded, setBlocksExpanded] = useState(false);
  const [ideasExpanded, setIdeasExpanded] = useState(false);
  const [followUpQuery, setFollowUpQuery] = useState("");
  const [ideasData, setIdeasData] = useState<SimpleIdeas>(() =>
    fallbackGenerateIdeas(plan)
  );
  const [isGeneratingIdeas, setIsGeneratingIdeas] = useState(false);

  const todayIso = new Date().toISOString().slice(0, 10);
  const scheduleWarnings = checkDaySchedule(plan.daySchedule);

  const handleToggleTask = (taskId: string) => {
    const updatedChecklist = plan.checklist.map((task) =>
      task.id === taskId ? { ...task, done: !task.done } : task
    );

    onUpdatePlan({
      ...plan,
      checklist: updatedChecklist,
      version: (plan.version || 1) + 1,
      updatedAt: todayIso,
    });
  };

  const handleGenerateIdeas = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGeneratingIdeas(true);

    try {
      const res = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          followUp: followUpQuery.trim(),
          language: currentLanguage,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setIdeasData(data.ideas);
      } else {
        setIdeasData(fallbackGenerateIdeas(plan, followUpQuery.trim()));
      }
    } catch {
      setIdeasData(fallbackGenerateIdeas(plan, followUpQuery.trim()));
    } finally {
      setIsGeneratingIdeas(false);
      setFollowUpQuery("");
    }
  };


  const doneCount = plan.checklist.filter((task) => task.done).length;
  const nextTask = plan.checklist.find((task) => !task.done);
  const nextDays = nextTask ? getDaysRemaining(nextTask.dueDate, todayIso) : 0;
  const tasksShown = tasksExpanded ? plan.checklist : plan.checklist.slice(0, 4);
  const blocksShown = blocksExpanded ? plan.daySchedule : plan.daySchedule.slice(0, 4);

  const tabs = [
    { id: "checklist", label: t.tabChecklist },
    { id: "schedule", label: t.tabSchedule },
    { id: "ideas", label: t.segIdeas },
  ];

  type IdeaRow = { title: string; estimatedCostRange: string; simpleDescription: string };
  const ideaGroups: { key: string; label: string; icon: React.ReactNode; items: IdeaRow[] }[] = [
    { key: "themes", label: "Themes", icon: <Palette className="h-3.5 w-3.5" aria-hidden="true" />, items: ideasData.themes },
    { key: "food", label: "Food", icon: <Utensils className="h-3.5 w-3.5" aria-hidden="true" />, items: ideasData.foodMenuIdeas },
    { key: "save", label: "Saving tricks", icon: <PiggyBank className="h-3.5 w-3.5" aria-hidden="true" />, items: ideasData.savingTricks },
    { key: "rain", label: "Rain and heat backup", icon: <CloudRain className="h-3.5 w-3.5" aria-hidden="true" />, items: ideasData.rainOrPowerBackupIdeas },
  ].filter((g) => g.items.length > 0);
  const totalIdeas = ideaGroups.reduce((n, g) => n + g.items.length, 0);

  return (
    <div className="grid gap-5 lg:grid-cols-[5fr_7fr] lg:gap-8">
      {/* Left: where you are, and the one next thing */}
      <div className="flex flex-col bg-white p-6 sm:p-8">
        <Caption>{t.doneCount.replace("{done}", String(doneCount)).replace("{total}", String(plan.checklist.length))}</Caption>
        <div className="mt-3 h-2 w-full bg-[#f5f5f5]" aria-hidden="true">
          <div
            className="h-full bg-[#111111]"
            style={{ width: `${plan.checklist.length ? Math.round((doneCount / plan.checklist.length) * 100) : 0}%` }}
          />
        </div>

        <div className="mt-6 min-h-[88px]">
          {nextTask ? (
            <>
              <p className="text-[12px] font-bold uppercase tracking-[0.14em] text-[#b45309]">{t.nextUp}</p>
              <p className="mt-1 text-[20px] font-bold leading-snug text-[#111111]">{nextTask.title}</p>
              <p className="mt-1 text-[14px] text-[#4b4b4d]">
                {nextDays < 0 ? `${Math.abs(nextDays)} days overdue` : nextDays === 0 ? "Due today" : `${nextDays} days left`}
                {nextTask.helperType ? ` · ${nextTask.helperType}` : ""}
              </p>
            </>
          ) : (
            <p className="text-[18px] font-bold text-[#007d48]">{t.allDone}</p>
          )}
        </div>

        <div className="mt-6 border-t border-[#e5e5e5] pt-5">
          <p className="font-display-campaign text-[22px] leading-tight text-[#111111] sm:text-[26px]">{t.s4Done}</p>
          <button
            type="button"
            onClick={() => window.print()}
            className="mt-4 inline-flex h-12 items-center gap-2.5 rounded-full bg-[#111111] px-7 text-[14px] font-bold uppercase tracking-wider text-white transition-transform hover:bg-black active:scale-95"
          >
            <Printer className="h-4 w-4" aria-hidden="true" />
            <span>{t.s4Print}</span>
          </button>
        </div>
      </div>

      {/* Right: checklist, day schedule, ideas */}
      <div className="min-w-0">
        <Segmented options={tabs} value={activeTab} onChange={setActiveTab} ariaLabel={t.s4Title} idPrefix="s4" />

        <SegPanel idPrefix="s4" id="checklist" active={activeTab === "checklist"}>
          <ul className="space-y-2">
            {tasksShown.map((task) => {
              const daysToDue = getDaysRemaining(task.dueDate, todayIso);
              return (
                <li key={task.id}>
                  <button
                    type="button"
                    aria-pressed={task.done}
                    onClick={() => handleToggleTask(task.id)}
                    className={`flex min-h-[56px] w-full cursor-pointer select-none items-start gap-3 border p-3 text-left transition-colors sm:px-4 ${
                      task.done
                        ? "border-[#e5e5e5] bg-[#fafafa] opacity-60"
                        : task.isLate
                        ? "border-[#fecdd3] bg-[#fff1f2]"
                        : task.isTightSchedule
                        ? "border-[#fde68a] bg-[#fffbeb]"
                        : "border-[#e5e5e5] bg-white hover:border-[#cacacb]"
                    }`}
                  >
                    <span aria-hidden="true" className="mt-0.5 shrink-0">
                      {task.done ? <CheckSquare className="h-5 w-5 text-[#007d48]" /> : <Square className="h-5 w-5 text-[#4b4b4d]" />}
                    </span>
                    <span className="block min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className={`text-[15px] font-bold text-[#111111] ${task.done ? "line-through" : ""}`}>{task.title}</span>
                        {task.isLate && !task.done && (
                          <span className="flex items-center gap-1 rounded-full bg-[#d30005] px-2 py-0.5 text-[12px] font-bold uppercase tracking-wider text-white">
                            <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                            Late
                          </span>
                        )}
                        {task.isTightSchedule && !task.isLate && !task.done && (
                          <span className="flex items-center gap-1 rounded-full bg-[#b45309] px-2 py-0.5 text-[12px] font-bold uppercase tracking-wider text-white">
                            <Clock className="h-3 w-3" aria-hidden="true" />
                            Tight time
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 block text-[13px] text-[#4b4b4d]">
                        Due {task.dueDate} ·{" "}
                        {daysToDue < 0 ? `${Math.abs(daysToDue)} days overdue` : daysToDue === 0 ? "Due today" : `${daysToDue} days left`}
                        {task.helperType ? ` · ${task.helperType}` : ""}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <SeeAll
            expanded={tasksExpanded}
            onToggle={() => setTasksExpanded((v) => !v)}
            total={plan.checklist.length}
            shown={4}
            seeAllLabel={t.seeAll}
            lessLabel={t.showLess}
          />
        </SegPanel>

        <SegPanel idPrefix="s4" id="schedule" active={activeTab === "schedule"}>
          {scheduleWarnings.length > 0 && (
            <div className="mb-3 space-y-1 border-l-4 border-[#d97706] bg-[#fffbeb] p-3 text-[13px] text-[#111111]">
              <div className="flex items-center gap-1.5 font-bold text-[#b45309]">
                <ShieldAlert className="h-4 w-4" aria-hidden="true" />
                <span>Keep some spare time</span>
              </div>
              {scheduleWarnings.slice(0, 2).map((w, i) => (
                <p key={i} className="leading-snug text-[#4b4b4d]">
                  • {w}
                </p>
              ))}
            </div>
          )}
          <ul className="space-y-2">
            {blocksShown.map((block) => (
              <li key={block.id} className="space-y-1 border border-[#e5e5e5] bg-white p-3 sm:px-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="shrink-0 border border-[#cacacb] bg-white px-2 py-0.5 text-[12px] font-bold text-[#111111]">
                      {block.startTime}
                    </span>
                    <span className="truncate text-[14px] font-bold text-[#111111]">{block.title}</span>
                  </span>
                  <span className="text-[12px] text-[#4b4b4d]">
                    {block.durationMinutes} min (+{block.bufferMinutesAfter} min gap)
                  </span>
                </div>
                {block.isOutdoor && (
                  <p className="border-l-2 border-[#d97706] bg-[#fef3c7] p-2 text-[12px] text-[#92400e]">
                    <strong>Outdoor setup:</strong> {block.backupPlanNote || "No rain or heat backup written yet."}
                  </p>
                )}
              </li>
            ))}
          </ul>
          <SeeAll
            expanded={blocksExpanded}
            onToggle={() => setBlocksExpanded((v) => !v)}
            total={plan.daySchedule.length}
            shown={4}
            seeAllLabel={t.seeAll}
            lessLabel={t.showLess}
          />
        </SegPanel>

        <SegPanel idPrefix="s4" id="ideas" active={activeTab === "ideas"}>
          <form onSubmit={handleGenerateIdeas} className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              aria-label="Ask for customized celebration ideas"
              value={followUpQuery}
              onChange={(e) => setFollowUpQuery(e.target.value)}
              placeholder="e.g. cheap marigold photo corner, winter dinner menu"
              className="h-12 flex-1 rounded-full border border-[#cacacb] bg-white px-5 text-[14px] text-[#111111] placeholder:text-[#4b4b4d] focus:border-[#111111] focus:outline-none"
            />
            <button
              type="submit"
              disabled={isGeneratingIdeas || !followUpQuery.trim()}
              className="h-12 shrink-0 rounded-full bg-[#111111] px-6 text-[13px] font-bold uppercase tracking-wider text-white hover:bg-black active:scale-95 disabled:opacity-40"
            >
              {isGeneratingIdeas ? "Finding…" : "Get ideas"}
            </button>
          </form>
          <div className="mt-3 space-y-2">
            {(ideasExpanded ? ideaGroups : ideaGroups.slice(0, 3)).map((g) => (
              <div key={g.key} className="border border-[#e5e5e5] bg-white p-3 sm:px-4">
                <span className="flex items-center gap-1.5 text-[12px] font-bold uppercase tracking-wider text-[#39393b]">
                  {g.icon}
                  {g.label}
                </span>
                {(ideasExpanded ? g.items : g.items.slice(0, 1)).map((it, i) => (
                  <div key={i} className="mt-2">
                    <div className="flex items-start justify-between gap-3">
                      <span className="text-[14px] font-bold text-[#111111]">{it.title}</span>
                      <span className="shrink-0 rounded-full bg-[#f5f5f5] px-2 py-0.5 text-[12px] font-bold text-[#111111]">
                        {it.estimatedCostRange}
                      </span>
                    </div>
                    <p className="text-[13px] leading-snug text-[#4b4b4d]">{it.simpleDescription}</p>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <SeeAll
            expanded={ideasExpanded}
            onToggle={() => setIdeasExpanded((v) => !v)}
            total={totalIdeas}
            shown={Math.min(3, ideaGroups.length)}
            seeAllLabel={t.seeAll}
            lessLabel={t.showLess}
          />
        </SegPanel>
      </div>
    </div>
  );
}
