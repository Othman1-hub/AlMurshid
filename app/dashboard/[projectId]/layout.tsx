'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { MessageSquare, ListChecks, Layers, Database, Menu, ArrowLeft, ChevronDown } from 'lucide-react';
import { Logo } from '@/components/Logo';

type Theme = 'dark' | 'light' | 'coffee' | 'tvgirl' | 'sonic' | 'pikachu';
const themeOptions: Theme[] = ['dark', 'light', 'coffee', 'tvgirl', 'sonic', 'pikachu'];

type Tab = { key: string; label: string; icon: React.ComponentType<{ className?: string }> };

const tabConfig: Tab[] = [
  { key: 'ai', label: 'AI', icon: MessageSquare },
  { key: 'tasks', label: 'Tasks', icon: ListChecks },
  { key: 'brief', label: 'Brief', icon: Layers },
  { key: 'PROJECT_MEMORY', label: 'Project Memory', icon: Database },
];

export default function ProjectLayout({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'dark';
    const stored = window.localStorage.getItem('almurshed-theme');
    return stored && themeOptions.includes(stored as Theme) ? (stored as Theme) : 'dark';
  });
  const [projectName, setProjectName] = useState<string | null>(null);
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

  // fetch project name for sidebar header
  useEffect(() => {
    if (!projectId) return;
    const controller = new AbortController();

    const loadProject = async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}`, { signal: controller.signal });
        if (!res.ok) return;
        const data = await res.json();
        if (data?.name) {
          setProjectName(data.name as string);
        }
      } catch (err) {
        if ((err as any)?.name !== 'AbortError') {
          console.error('Failed to load project info', err);
        }
      }
    };

    loadProject();
    return () => controller.abort();
  }, [projectId]);

  const projectDisplayName = projectName?.trim() || projectId;

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

          <div className="flex items-center gap-3">
            <div className="relative group">
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value as Theme)}
                className="appearance-none bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-ink)] px-3 py-2 pr-8 focus:outline-none focus:border-[var(--color-accent)] cursor-pointer font-mono text-xs font-bold uppercase tracking-widest hover:border-[var(--color-ink)] transition-colors"
              >
                {themeOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt.toUpperCase()}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--color-ink-soft)]" />
            </div>
            
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
      </div>

      <div
        className={`w-full px-4 sm:px-6 py-6 lg:py-8 flex flex-col gap-4 lg:gap-6 h-[calc(100vh-4rem)] ${
          isNavCollapsed ? '' : 'lg:flex-row'
        }`}
      >
        {!isNavCollapsed && (
          <aside className="border border-[var(--color-border)] bg-[var(--color-surface)] p-4 w-full lg:w-72 flex-shrink-0 lg:sticky lg:top-20 lg:self-start">
            <div className="mb-4">
              <div className="text-xs font-mono uppercase tracking-widest text-[var(--color-ink-soft)]">Project</div>
              <div className="text-lg font-semibold mt-1 break-words">{projectDisplayName}</div>
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

        <main 
          className="flex-1 flex flex-col overflow-auto" 
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <style jsx>{`
            main::-webkit-scrollbar {
              display: none;
            }
          `}</style>
          {children}
        </main>
      </div>
    </div>
  );
}
