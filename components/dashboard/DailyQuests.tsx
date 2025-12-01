"use client";

import React, { useState, useEffect } from "react";
import { Lightbulb, Sparkles, Zap } from "lucide-react";

const HINTS = [
  "Break down complex tasks into smaller, manageable subtasks for better focus.",
  "Use the AI assistant in your project workspace to get instant coding help.",
  "Set realistic time estimates for tasks to improve your planning accuracy.",
  "Complete tasks daily to maintain your streak and unlock achievements.",
  "The brief section helps AI understand your project better - keep it detailed.",
  "Dependencies between tasks ensure you work in the right order.",
  "Review your project memory to track important decisions and context.",
  "XP rewards scale with task difficulty - tackle harder tasks for more points.",
  "Use descriptive task names to make your roadmap easier to understand.",
  "The phase system helps organize your project into logical stages.",
  "Generate a project plan with AI to get a complete task breakdown instantly.",
  "Click on any task to view details, hints, and tools needed.",
  "Mark tasks as completed to track progress and earn XP automatically.",
  "Use tags and labels to categorize similar tasks across projects.",
  "Regular commits and version control are essential for project success.",
  "Take breaks between tasks to maintain productivity and avoid burnout.",
  "Document your code as you write - your future self will thank you.",
  "Test early and test often to catch bugs before they multiply.",
  "Refactor code when needed, but avoid premature optimization.",
  "Code reviews improve quality - don't skip them even solo.",
  "Keep learning new technologies to expand your skill set.",
  "Consistency beats intensity - small daily progress adds up.",
  "Use keyboard shortcuts to speed up your development workflow.",
  "Write meaningful commit messages that explain the 'why', not just 'what'.",
  "Backup your work regularly - version control is your safety net.",
  "Read error messages carefully - they often tell you exactly what's wrong.",
  "Google and Stack Overflow are your friends, but understand solutions before copying.",
  "Rubber duck debugging works - explain your problem out loud to find solutions.",
  "Pair programming can help you learn faster and catch mistakes earlier.",
  "Celebrate small wins - every completed task is progress toward your goal.",
];

const HINT_ICONS = [
  { component: Lightbulb, name: "lightbulb" },
  { component: Sparkles, name: "sparkles" },
  { component: Zap, name: "zap" },
];

interface DailyHintsProps {}

export function DailyQuests({}: DailyHintsProps) {
  const [randomHints, setRandomHints] = useState<
    Array<{ id: number; text: string; iconName: string }>
  >([]);

  useEffect(() => {
    // Generate random hints on client side only
    const shuffled = [...HINTS].sort(() => Math.random() - 0.5);
    const count = Math.floor(Math.random() * 2) + 2; // 2 or 3 hints
    const hints = shuffled.slice(0, count).map((hint, index) => ({
      id: index,
      text: hint,
      iconName:
        HINT_ICONS[Math.floor(Math.random() * HINT_ICONS.length)].name,
    }));
    setRandomHints(hints);
  }, []);

  if (randomHints.length === 0) {
    // Return a placeholder during SSR
    return (
      <div className="lg:col-span-3 bg-[var(--color-surface-alt)] p-6 border-r border-[var(--color-border)]">
        <div className="flex items-center gap-2 mb-6 text-[var(--color-ink)]">
          <Lightbulb className="w-4 h-4 text-[var(--color-accent)]" />
          <h3 className="text-xs font-mono font-bold uppercase tracking-widest">
            Daily Insights
          </h3>
        </div>
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="p-3 border border-[var(--color-border)] bg-[var(--color-bg)] animate-pulse"
            >
              <div className="h-12 bg-[var(--color-surface-alt)]"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="lg:col-span-3 bg-[var(--color-surface-alt)] p-6 border-r border-[var(--color-border)]">
      <div className="flex items-center gap-2 mb-6 text-[var(--color-ink)]">
        <Lightbulb className="w-4 h-4 text-[var(--color-accent)]" />
        <h3 className="text-xs font-mono font-bold uppercase tracking-widest">
          Daily Insights
        </h3>
      </div>
      <div className="space-y-3">
        {randomHints.map((hint) => {
          const iconData = HINT_ICONS.find((i) => i.name === hint.iconName);
          const IconComponent = iconData?.component || Lightbulb;
          return (
            <div
              key={hint.id}
              className="p-3 border border-[var(--color-border)] bg-[var(--color-bg)] hover:border-[var(--color-accent)] transition-all group"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 text-[var(--color-accent)] group-hover:text-[var(--color-accent-strong)] transition-colors flex-shrink-0">
                  <IconComponent className="w-4 h-4" />
                </div>
                <p className="text-xs font-mono text-[var(--color-ink)] leading-relaxed">
                  {hint.text}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 pt-4 border-t border-[var(--color-border)] border-dashed">
        <p className="text-[9px] font-mono text-[var(--color-ink-soft)] text-center uppercase tracking-widest">
          Refresh for new insights
        </p>
      </div>
    </div>
  );
}


