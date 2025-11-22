'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft, MessageSquare, ListChecks, Layers, Settings } from 'lucide-react';

type Theme = 'dark' | 'light' | 'neon' | 'sunset' | 'sand';
const themeOptions: Theme[] = ['dark', 'light', 'neon', 'sunset', 'sand'];

const tabConfig = [
  { key: 'ai', label: 'المساعد', icon: <MessageSquare className="w-4 h-4" /> },
  { key: 'tasks', label: 'المهام', icon: <ListChecks className="w-4 h-4" /> },
  { key: 'brief', label: 'تعريف المشروع', icon: <Layers className="w-4 h-4" /> },
  { key: 'settings', label: 'إعدادات', icon: <Settings className="w-4 h-4" /> },
];

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [theme, setTheme] = useState<Theme>('dark');
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);
  const projectId = segments[segments.indexOf('dashboard') + 1] || 'project-id';
  const base = `/dashboard/${projectId}`;
  const isStandaloneFirstGenerate = pathname === `${base}/generate`;

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('almurshed-theme') : null;
    if (stored && themeOptions.includes(stored as Theme)) {
      setTheme(stored as Theme);
    }
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      root.classList.remove(...themeOptions);
      root.classList.add(theme);
      localStorage.setItem('almurshed-theme', theme);
    }
  }, [theme]);

  if (isStandaloneFirstGenerate) {
    return (
      <div
        className="min-h-screen bg-[var(--color-bg)] text-[var(--color-ink)] selection:bg-[var(--color-ink)] selection:text-[var(--color-bg)]"
        dir="rtl"
      >
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-ink)] selection:bg-[var(--color-ink)] selection:text-[var(--color-bg)]" dir="rtl">
      <div className="border-b border-[var(--color-border)] bg-[var(--color-bg)] sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[var(--color-ink)] flex items-center justify-center">
              <div className="w-3 h-3 bg-[var(--color-surface-contrast)]" />
            </div>
            <div>
              <div className="text-lg font-bold font-mono">ALMurshed</div>
              <div className="text-[10px] text-[var(--color-ink-soft)] font-mono uppercase tracking-widest">
                Project Workspace
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[var(--color-ink-soft)]">
              <span>السمة</span>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as Theme)}
                className="bg-[var(--color-surface-alt)] border border-[var(--color-border)] text-[var(--color-ink)] px-2 py-1 focus:outline-none focus:border-[var(--color-ink)]"
              >
                {themeOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-xs font-mono text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
            >
              <ArrowLeft className="w-4 h-4" />
              العودة للوحة
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-4 gap-6">
        <aside className="border border-[var(--color-border)] bg-[var(--color-surface)] p-4 h-max">
          <div className="mb-4">
            <div className="text-xs font-mono uppercase tracking-widest text-[var(--color-ink-soft)]">المشروع</div>
            <div className="text-lg font-semibold mt-1">{projectId.toUpperCase()}</div>
            <div className="text-sm text-[var(--color-ink-soft)]">منصة المهام الذكية</div>
          </div>
          <div className="flex flex-col gap-2">
            {tabConfig.map((tab) => {
              const href = `${base}/${tab.key}`;
              const active = pathname === href;
              return (
                <Link
                  key={tab.key}
                  href={href}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-mono uppercase tracking-widest border border-[var(--color-border)] transition-colors ${
                    active
                      ? 'bg-[var(--color-accent)] text-[var(--color-ink)] border-[var(--color-accent)]'
                      : 'bg-[var(--color-surface-alt)] text-[var(--color-ink-soft)] hover:border-[var(--color-ink)]'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </aside>

        <main className="lg:col-span-3 min-h-[calc(100vh-240px)] flex flex-col">{children}</main>
      </div>
    </div>
  );
}
