"use client";

import React, { useState } from "react";
import { CheckCircle2, Clock, ChevronDown, Lock, Play, PauseCircle, Layers } from "lucide-react";

type TaskStatus = "LOCKED" | "WAITING" | "RUNNING" | "DONE";
type Difficulty = "TRIVIAL" | "EASY" | "MEDIUM" | "HARD" | "EPIC";

type Task = {
  id: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  timeEstimate: string;
  status: TaskStatus;
  tools: string[];
  hints: string[];
};

type Step = {
  id: string;
  title: string;
  tasks: Task[];
};

const INITIAL_STEPS: Step[] = [
  {
    id: "STEP-01",
    title: "Foundation Setup",
    tasks: [
      {
        id: "TSK-001",
        title: "Initialize Repository",
        description: "Set up the Next.js 15 project structure, configure Tailwind CSS.",
        difficulty: "EASY",
        timeEstimate: "45m",
        status: "DONE",
        tools: ["Git", "Node.js"],
        hints: ['Use "create-next-app".'],
      },
      {
        id: "TSK-002",
        title: "Configure Supabase",
        description: "Initialize the Supabase client and environment variables.",
        difficulty: "MEDIUM",
        timeEstimate: "30m",
        status: "DONE",
        tools: ["Supabase"],
        hints: ["Secure your service role key."],
      },
    ],
  },
  {
    id: "STEP-02",
    title: "Core Architecture",
    tasks: [
      {
        id: "TSK-003",
        title: "Database Schema",
        description: "Draft the initial SQL schema for Users and Projects.",
        difficulty: "HARD",
        timeEstimate: "2h",
        status: "RUNNING",
        tools: ["SQL Editor"],
        hints: ["Enable RLS immediately."],
      },
      {
        id: "TSK-004",
        title: "Auth Integration",
        description: "Build the Login/Signup flows using SSR auth helpers.",
        difficulty: "MEDIUM",
        timeEstimate: "1.5h",
        status: "WAITING",
        tools: ["Lucide", "Zod"],
        hints: [],
      },
      {
        id: "TSK-005",
        title: "Global State Store",
        description: "Set up Zustand for managing UI state (modals, user data).",
        difficulty: "EASY",
        timeEstimate: "1h",
        status: "WAITING",
        tools: ["Zustand"],
        hints: [],
      },
    ],
  },
  {
    id: "STEP-03",
    title: "Feature Implementation",
    tasks: [
      {
        id: "TSK-006",
        title: "API Routes",
        description: "Secure API endpoints for project CRUD.",
        difficulty: "HARD",
        timeEstimate: "3h",
        status: "LOCKED",
        tools: ["Postman"],
        hints: [],
      },
    ],
  },
];

const DifficultyBadge = ({ level }: { level: Difficulty }) => {
  const colors = {
    TRIVIAL: "text-gray-500 border-gray-500",
    EASY: "text-[var(--color-success)] border-[var(--color-success)]",
    MEDIUM: "text-[var(--color-gold)] border-[var(--color-gold)]",
    HARD: "text-orange-500 border-orange-500",
    EPIC: "text-[var(--color-danger)] border-[var(--color-danger)]",
  };
  return (
    <span className={`text-[9px] font-mono border px-1.5 py-0.5 uppercase tracking-wider ${colors[level]}`}>
      {level}
    </span>
  );
};

const StatusNode = ({ status }: { status: TaskStatus }) => {
  switch (status) {
    case "DONE":
      return (
        <div className="w-12 h-12 rounded-full bg-[var(--color-bg)] border-2 border-[var(--color-success)] flex items-center justify-center z-10 shadow-[0_0_25px_var(--color-success)]">
          <CheckCircle2 className="w-6 h-6 text-[var(--color-success)]" />
        </div>
      );
    case "RUNNING":
      return (
        <div className="w-12 h-12 rounded-full bg-[var(--color-bg)] border-2 border-[var(--color-accent)] flex items-center justify-center z-10 shadow-[0_0_25px_var(--color-accent)] animate-pulse">
          <Play className="w-6 h-6 text-[var(--color-accent)] fill-current" />
        </div>
      );
    case "WAITING":
      return (
        <div className="w-10 h-10 rounded-full bg-[var(--color-bg)] border-2 border-[var(--color-ink-soft)] flex items-center justify-center z-10">
          <PauseCircle className="w-5 h-5 text-[var(--color-ink-soft)]" />
        </div>
      );
    case "LOCKED":
      return (
        <div className="w-10 h-10 rounded-full bg-[var(--color-surface)] border-2 border-[var(--color-border)] flex items-center justify-center z-10">
          <Lock className="w-5 h-5 text-[var(--color-ink-soft)] opacity-50" />
        </div>
      );
    default:
      return <div className="w-4 h-4 rounded-full bg-[var(--color-border)] z-10" />;
  }
};

const TaskLog = () => {
  const [steps, setSteps] = useState<Step[]>(INITIAL_STEPS);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedTask(expandedTask === id ? null : id);
  };

  const updateTaskStatus = (stepId: string, taskId: string, newStatus: TaskStatus) => {
    setSteps((prevSteps) =>
      prevSteps.map((step) => {
        if (step.id !== stepId) return step;
        return {
          ...step,
          tasks: step.tasks.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)),
        };
      })
    );
  };

  const getStepStatus = (step: Step, isPrevStepDone: boolean): TaskStatus => {
    if (!isPrevStepDone) return "LOCKED";
    const allDone = step.tasks.every((t) => t.status === "DONE");
    if (allDone) return "DONE";
    const anyRunning = step.tasks.some((t) => t.status === "RUNNING");
    if (anyRunning) return "RUNNING";
    return "WAITING";
  };

  const totalTasks = steps.reduce((acc, step) => acc + step.tasks.length, 0);
  const completedTasks = steps.reduce((acc, step) => acc + step.tasks.filter((t) => t.status === "DONE").length, 0);

  return (
    <div className="w-full bg-[var(--color-bg)] text-[var(--color-ink)] p-8 flex flex-col gap-8 border border-[var(--color-border)]" dir="ltr">
      <style>{`
        .roadmap-spine {
          position: absolute;
          left: 50%;
          top: 0;
          bottom: 0;
          width: 2px;
          background: linear-gradient(to bottom, var(--color-success), var(--color-accent), var(--color-border));
          transform: translateX(-50%);
          z-index: 0;
        }
      `}</style>

      <div className="flex items-center justify-between pb-6 border-b border-[var(--color-border)]" dir="rtl">
        <div className="flex items-center gap-2">
          <div className="w-1 h-6 bg-[var(--color-accent)]"></div>
          <h2 className="text-xl font-bold font-mono uppercase tracking-tight text-[var(--color-ink)]">Execution Roadmap</h2>
        </div>
        <div className="text-xs font-mono text-[var(--color-ink-soft)] uppercase tracking-widest bg-[var(--color-surface)] px-3 py-1 border border-[var(--color-border)]">
          SEQUENCE: {Math.round((completedTasks / totalTasks) * 100)}% COMPLETE
        </div>
      </div>

      <div className="relative w-full max-w-6xl mx-auto py-10">
        <div className="roadmap-spine"></div>

        {steps.map((step, stepIndex) => {
          const isPrevStepDone = stepIndex === 0 || steps[stepIndex - 1].tasks.every((t) => t.status === "DONE");
          const stepStatus = getStepStatus(step, isPrevStepDone);
          const isStepLocked = stepStatus === "LOCKED";

          return (
            <div key={step.id} className="relative mb-24 w-full">
              <div className="absolute left-1/2 top-0 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-20">
                <StatusNode status={stepStatus} />
                <div
                  className={`mt-2 px-3 py-1 text-[10px] font-mono font-bold uppercase tracking-widest border bg-[var(--color-bg)] ${
                    isStepLocked ? "border-[var(--color-border)] text-[var(--color-ink-soft)]" : "border-[var(--color-accent)] text-[var(--color-accent)]"
                  }`}
                >
                  {step.title}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-24 gap-y-8 pt-12 relative">
                {step.tasks.map((task, taskIndex) => {
                  const isTaskLocked = isStepLocked || task.status === "LOCKED";
                  const isExpanded = expandedTask === task.id;
                  const isLeft = taskIndex % 2 === 0;

                  return (
                    <div key={task.id} className={`relative flex flex-col ${isLeft ? "items-end text-right" : "items-start text-left col-start-2"}`}>
                      <div
                        className={`absolute top-8 h-[1px] bg-[var(--color-border)] -z-10 ${isLeft ? "right-[-6rem] w-[6rem]" : "left-[-6rem] w-[6rem]"}`}
                      >
                        <div
                          className={`absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[var(--color-border)] ${isLeft ? "right-0" : "left-0"}`}
                        ></div>
                      </div>

                      <div
                        className={`
                          w-full max-w-md border transition-all duration-300 group relative bg-[var(--color-surface)]
                          ${isTaskLocked ? "border-[var(--color-border)] opacity-50" : "border-[var(--color-border)] hover:border-[var(--color-accent)]"}
                          ${task.status === "RUNNING" ? "shadow-[0_0_30px_-10px_rgba(0,68,255,0.15)] border-[var(--color-accent)]" : ""}
                        `}
                      >
                        <div
                          className={`h-1 w-full ${
                            task.status === "DONE"
                              ? "bg-[var(--color-success)]"
                              : task.status === "RUNNING"
                              ? "bg-[var(--color-accent)]"
                              : "bg-[var(--color-border)]"
                          }`}
                        ></div>

                        <div className="p-5 cursor-pointer flex flex-col gap-3" onClick={() => !isTaskLocked && toggleExpand(task.id)}>
                          <div className={`flex items-center justify-between ${isLeft ? "flex-row-reverse" : ""}`}>
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  task.status === "DONE"
                                    ? "bg-[var(--color-success)]"
                                    : task.status === "RUNNING"
                                    ? "bg-[var(--color-accent)]"
                                    : "bg-[var(--color-ink-soft)]"
                                }`}
                              ></div>
                              <span className="font-mono text-[10px] text-[var(--color-ink-soft)]">{task.id}</span>
                            </div>
                            <DifficultyBadge level={task.difficulty} />
                          </div>

                          <div>
                            <h3
                              className={`text-sm font-bold font-mono leading-snug text-[var(--color-ink)] ${
                                task.status === "DONE" ? "line-through text-[var(--color-ink-soft)]" : ""
                              }`}
                            >
                              {task.title}
                            </h3>
                            <div
                              className={`flex items-center gap-4 mt-2 text-[10px] font-mono text-[var(--color-ink-soft)] ${
                                isLeft ? "justify-end" : "justify-start"
                              }`}
                            >
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {task.timeEstimate}
                              </span>
                              {!isTaskLocked && <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? "rotate-180" : ""}`} />}
                            </div>
                          </div>
                        </div>

                        {isExpanded && !isTaskLocked && (
                          <div className="px-5 pb-5 border-t border-[var(--color-border)] border-dashed bg-[var(--color-surface-alt)]/50 animate-in slide-in-from-top-2 duration-200" dir="rtl">
                            <div className="flex justify-center gap-2 py-4">
                              {["WAITING", "RUNNING", "DONE"].map((s) => (
                                <button
                                  key={s}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateTaskStatus(step.id, task.id, s as TaskStatus);
                                  }}
                                  className={`text-[9px] px-2 py-1 font-mono border transition-colors ${
                                    task.status === s
                                      ? "bg-[var(--color-ink)] text-[var(--color-bg)] border-[var(--color-ink)]"
                                      : "text-[var(--color-ink-soft)] border-[var(--color-border)] hover:border-[var(--color-ink)]"
                                  }`}
                                >
                                  {s}
                                </button>
                              ))}
                            </div>

                            <p className="text-xs text-[var(--color-ink)] leading-relaxed mb-4">{task.description}</p>

                            {task.tools.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {task.tools.map((t) => (
                                  <span
                                    key={t}
                                    className="text-[9px] border border-[var(--color-border)] px-1.5 bg-[var(--color-bg)] font-mono text-[var(--color-ink-soft)]"
                                  >
                                    {t}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        <div className="absolute bottom-[-60px] left-1/2 transform -translate-x-1/2 flex flex-col items-center">
          <div className="w-px h-16 bg-[var(--color-border)]"></div>
          <div className="w-3 h-3 bg-[var(--color-border)] rounded-full"></div>
          <span className="text-[9px] font-mono text-[var(--color-ink-soft)] mt-2 tracking-widest">MISSION_COMPLETE</span>
        </div>
      </div>
    </div>
  );
};

export default function ProjectTasksPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-ink)] selection:bg-[var(--color-ink)] selection:text-[var(--color-bg)] overflow-x-hidden" dir="rtl">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;700&family=JetBrains+Mono:wght@400;700&display=swap');
        body { font-family: 'IBM Plex Sans Arabic', sans-serif; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        .bg-grid-pattern {
          background-image: linear-gradient(var(--color-border) 1px, transparent 1px),
                            linear-gradient(90deg, var(--color-border) 1px, transparent 1px);
          background-size: 36px 36px;
          mask-image: linear-gradient(to bottom, black 40%, transparent 100%);
        }
      `}</style>

      <div className="absolute inset-0 bg-grid-pattern pointer-events-none opacity-[0.05]" />

      <main className="relative max-w-6xl mx-auto px-6 py-12 space-y-10 z-10">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[var(--color-accent)] flex items-center justify-center">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-mono tracking-tight">TASK LOG</h1>
              <p className="text-[11px] text-[var(--color-ink-soft)] font-mono uppercase tracking-widest">Operational sequence & status</p>
            </div>
          </div>
          <div className="text-[10px] font-mono text-[var(--color-ink-soft)] bg-[var(--color-surface-alt)] px-3 py-1 border border-[var(--color-border)]">
            Layout: AlMurshid System v2
          </div>
        </div>

        <TaskLog />
      </main>
    </div>
  );
}
