'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquare, ListChecks, Layers, Settings, Database, Menu, ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/Logo';

type Theme = 'dark' | 'light' | 'neon' | 'sunset' | 'sand' | 'sky' | 'pink' | 'coffee';
const themeOptions: Theme[] = ['dark', 'light', 'neon', 'sunset', 'sand', 'sky', 'pink', 'coffee'];

type Tab = { key: string; label: string; icon: React.ComponentType<{ className?: string }> };

const tabConfig: Tab[] = [
  { key: 'ai', label: 'AI', icon: MessageSquare },
  { key: 'tasks', label: 'Tasks', icon: ListChecks },
  { key: 'brief', label: 'Brief', icon: Layers },
  { key: 'settings', label: 'Settings', icon: Settings },
  { key: 'PROJECT_MEMORY', label: 'Project Memory', icon: Database },
];

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'dark';
    const stored = window.localStorage.getItem('almurshed-theme');
    return stored && themeOptions.includes(stored as Theme) ? (stored as Theme) : 'dark';
  });
  const [isNavCollapsed, setIsNavCollapsed] = useState(false);
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);
  const projectId = segments[segments.indexOf('dashboard') + 1] || 'project-id';
  const base = `/dashboard/${projectId}`;
  const isStandaloneFirstGenerate = pathname === `${base}/generate`;

  // hydrate theme from localStorage
  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('almurshed-theme') : null;
    if (stored && themeOptions.includes(stored as Theme)) {
      setTheme(stored as Theme);
    }
  }, []);

  // apply theme class to root
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
      <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-ink)] selection:bg-[var(--color-ink)] selection:text-[var(--color-bg)]" dir="rtl">
        {children}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-ink)] selection:bg-[var(--color-ink)] selection:text-[var(--color-bg)]" dir="rtl">
      <div className="border-b border-[var(--color-border)] bg-[var(--color-bg)] sticky top-0 z-40">
        <div className="w-full px-4 sm:px-6 h-16 flex items-center justify-between" dir="ltr">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-mono uppercase tracking-widest text-[var(--color-ink)] hover:text-[var(--color-accent)] border border-[var(--color-border)] px-3 py-2 bg-[var(--color-surface-alt)]"
          >
            <ArrowLeft className="w-4 h-4" />
            Dashboard
          </Link>

          <Logo subtitle="Project Workspace" size="sm" />

          <button
            type="button"
            aria-label="Toggle menu"
            onClick={() => setIsNavCollapsed((prev) => !prev)}
            className="inline-flex items-center justify-center w-10 h-10 border border-[var(--color-border)] bg-[var(--color-surface-alt)] text-[var(--color-ink)] hover:border-[var(--color-ink)]"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div
        className={`w-full px-4 sm:px-6 py-6 lg:py-8 flex flex-col gap-4 lg:gap-6 ${
          isNavCollapsed ? '' : 'lg:flex-row'
        }`}
      >
        {!isNavCollapsed && (
          <aside className="border border-[var(--color-border)] bg-[var(--color-surface)] p-4 h-max w-full lg:w-72 flex-shrink-0">
            <div className="mb-4">
              <div className="text-xs font-mono uppercase tracking-widest text-[var(--color-ink-soft)]">Project</div>
              <div className="text-lg font-semibold mt-1">{projectId.toUpperCase()}</div>
              <div className="text-sm text-[var(--color-ink-soft)]">Workspace overview and quick links.</div>
            </div>
            <div className="flex flex-col gap-2">
              {tabConfig.map((tab) => {
                const href = `${base}/${tab.key}`;
                const active = pathname === href;
                const Icon = tab.icon;
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
                    <Icon className="w-4 h-4" />
                    {tab.label}
                  </Link>
                );
              })}
            </div>
          </aside>
        )}

        <main className="flex-1 min-h-[calc(100vh-240px)] flex flex-col">
          {children}
        </main>
      </div>
    </div>
  );
}
