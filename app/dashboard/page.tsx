'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Plus, Sparkles, Activity, Edit2, Trash2 } from 'lucide-react';
import Link from 'next/link';

type Theme = 'dark' | 'light' | 'neon' | 'sunset' | 'sand';
const themeOptions: Theme[] = ['dark', 'light', 'neon', 'sunset', 'sand'];

type Project = {
  id: string;
  name: string;
  status: 'Active' | 'Planning' | 'Paused' | 'Review';
  eta: string;
  tasks: number;
  progress: number;
};

export default function DashboardPage() {
  const [theme, setTheme] = useState<Theme>('dark');
  const [projects, setProjects] = useState<Project[]>([
    { id: 'PRJ-8821', name: 'منصة المهام الذكية', status: 'Active', eta: '3 أسابيع', tasks: 24, progress: 62 },
    { id: 'PRJ-7710', name: 'لوحة العملاء', status: 'Review', eta: '10 أيام', tasks: 12, progress: 78 },
    { id: 'PRJ-6644', name: 'خدمة الهوية', status: 'Planning', eta: 'شهر', tasks: 30, progress: 18 },
  ]);
  const [formOpen, setFormOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [projectInfo, setProjectInfo] = useState('');
  const [projectEta, setProjectEta] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

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

  const xp = 3820;
  const nextLevel = 5000;
  const xpProgress = Math.min(100, Math.round((xp / nextLevel) * 100));
  const title = xp > 4000 ? 'Chief Architect' : 'Systems Lead';

  const statusColor = useMemo(
    () => ({
      Active: 'bg-[var(--color-accent)] text-[var(--color-ink)]',
      Review: 'bg-[var(--color-surface-alt)] text-[var(--color-ink)] border border-[var(--color-border-strong)]',
      Planning: 'bg-[var(--color-surface-alt)] text-[var(--color-ink-soft)] border border-[var(--color-border-strong)]',
      Paused: 'bg-[var(--color-surface-alt)] text-[var(--color-ink-soft)] border border-[var(--color-border-strong)]',
    }),
    []
  );

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) return;
    const id = `PRJ-${Math.floor(1000 + Math.random() * 9000)}`;
    setProjects((prev) => [
      {
        id,
        name: projectName,
        status: 'Planning',
        eta: projectEta || 'غير محدد',
        tasks: 0,
        progress: 0,
      },
      ...prev,
    ]);
    setProjectName('');
    setProjectInfo('');
    setProjectEta('');
    setFormOpen(false);
  };

  const handleSaveName = (id: string) => {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, name: editingName || p.name } : p)));
    setEditingId(null);
    setEditingName('');
  };

  return (
    <div
      className="min-h-screen bg-[var(--color-bg)] text-[var(--color-ink)] selection:bg-[var(--color-ink)] selection:text-[var(--color-bg)]"
      dir="rtl"
    >
      <div className="border-b border-[var(--color-border)] bg-[var(--color-bg)] sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[var(--color-ink)] flex items-center justify-center">
              <div className="w-3 h-3 bg-[var(--color-surface-contrast)]" />
            </div>
            <div>
              <div className="text-lg font-bold font-mono">ALMurshed</div>
              <div className="text-[10px] text-[var(--color-ink-soft)] font-mono uppercase tracking-widest">
                personal dash
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
              href="/"
              className="flex items-center gap-2 text-xs font-mono text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
            >
              <ArrowLeft className="w-4 h-4" />
              الرئيسية
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12 space-y-10">
        <div className="flex items-center justify-between gap-6 flex-wrap">
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-[var(--color-ink-soft)] flex items-center gap-2">
              <span className="w-2 h-2 bg-[var(--color-accent)]" />
              Dashboard
            </div>
            <h1 className="text-4xl font-medium mt-2">ملفك ومشاريعك</h1>
          </div>
        </div>

        <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-8 flex flex-col gap-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-[var(--color-ink)] text-[var(--color-bg)] flex items-center justify-center text-xl font-bold font-mono border border-[var(--color-border-strong)]">
                A
              </div>
              <div className="space-y-1">
                <div className="text-lg font-semibold">أحمد عبد الله</div>
                <div className="text-sm text-[var(--color-ink-soft)]">{title} · قائد الغرفة</div>
                <div className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-[var(--color-ink-soft)] bg-[var(--color-surface-alt)] px-2 py-1 border border-[var(--color-border)]">
                  <span className="w-2 h-2 bg-[var(--color-accent)]" />
                  Level 07 · +XP BOOST
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono uppercase tracking-widest text-[var(--color-ink-soft)] w-full lg:w-auto">
              <div className="border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-3">
                <div className="text-[var(--color-ink)] text-lg font-semibold">{projects.length}</div>
                مشاريع
              </div>
              <div className="border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-3">
                <div className="text-[var(--color-ink)] text-lg font-semibold">12</div>
                مهام هذا الأسبوع
              </div>
              <div className="border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-3">
                <div className="text-[var(--color-ink)] text-lg font-semibold">8</div>
                أيام تركيز
              </div>
              <div className="border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-3">
                <div className="text-[var(--color-ink)] text-lg font-semibold">2</div>
                ألقاب
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between text-sm text-[var(--color-ink-soft)] font-mono">
              <span>XP</span>
              <span>
                {xp} / {nextLevel}
              </span>
            </div>
            <div className="h-3 bg-[var(--color-surface-alt)] border border-[var(--color-border)] mt-2">
              <div
                className="h-full bg-[var(--color-accent)]"
                style={{ width: `${xpProgress}%`, transition: 'width 200ms ease' }}
              />
            </div>
            <div className="text-xs text-[var(--color-ink-soft)] font-mono mt-2">متبقي للوصول للرتبة التالية.</div>
          </div>
        </div>

        <div className="relative space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className="text-sm font-mono uppercase tracking-widest text-[var(--color-ink-soft)]">مشاريعك</div>
              <div className="text-xs text-[var(--color-ink-soft)] font-mono">حركها كما تحب، غيّر الأسماء، أو احذف بسرعة.</div>
            </div>
            <button
              onClick={() => setFormOpen(true)}
              className="inline-flex items-center gap-2 bg-[var(--color-accent)] text-[var(--color-ink)] border border-[var(--color-accent)] hover:bg-[var(--color-accent-strong)] px-4 py-2 font-mono text-xs uppercase tracking-widest transition-colors rounded-none"
            >
              <Plus className="w-4 h-4" />
              مشروع جديد
            </button>
          </div>
          <div className="absolute -inset-6 bg-gradient-to-br from-[var(--color-surface)]/60 via-transparent to-[var(--color-accent)]/10 blur-3xl pointer-events-none" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
            {projects.map((proj) => (
              <div
                key={proj.id}
                className="relative overflow-hidden bg-gradient-to-b from-[var(--color-surface)] to-[var(--color-surface-alt)] p-5 flex flex-col gap-4 shadow-[0_20px_50px_-25px_rgba(0,0,0,0.6)] hover:shadow-[0_25px_60px_-20px_rgba(0,0,0,0.7)] transition-shadow"
              >
                <div className="absolute -top-1 left-0 w-24 h-6 bg-[var(--color-surface-contrast)]/30" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`px-2 py-1 text-[10px] font-mono uppercase tracking-widest ${statusColor[proj.status]}`}>
                      {proj.status}
                    </div>
                    <div>
                      <div className="text-sm font-mono uppercase tracking-widest text-[var(--color-ink-soft)]">
                        {proj.id}
                      </div>
                      {editingId === proj.id ? (
                        <input
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="mt-1 px-2 py-1 bg-[var(--color-surface)] text-[var(--color-ink)] focus:outline-none"
                        />
                      ) : (
                        <div className="text-lg font-semibold">{proj.name}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-mono uppercase tracking-widest">
                    {editingId === proj.id ? (
                      <>
                        <button className="text-[var(--color-accent)]" onClick={() => handleSaveName(proj.id)}>
                          حفظ
                        </button>
                        <button
                          className="text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
                          onClick={() => {
                            setEditingId(null);
                            setEditingName('');
                          }}
                        >
                          إلغاء
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="text-[var(--color-ink)] hover:text-[var(--color-accent)] inline-flex items-center gap-1"
                          onClick={() => {
                            setEditingId(proj.id);
                            setEditingName(proj.name);
                          }}
                        >
                          <Edit2 className="w-4 h-4" /> تعديل
                        </button>
                        <button
                          className="text-[var(--color-ink-soft)] hover:text-[var(--color-accent)] inline-flex items-center gap-1"
                          onClick={() => {
                            if (confirm('حذف هذا المشروع؟')) {
                              setProjects((prev) => prev.filter((p) => p.id !== proj.id));
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" /> حذف
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="text-xs text-[var(--color-ink-soft)] font-mono flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  مهام: {proj.tasks}
                </div>

                <div>
                  <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-[var(--color-ink-soft)]">
                    <span>التقدم</span>
                    <span>{proj.progress}%</span>
                  </div>
                  <div className="h-2 bg-[var(--color-surface-contrast)] border border-[var(--color-border)] mt-2">
                    <div
                      className="h-full bg-[var(--color-accent)]"
                      style={{ width: `${proj.progress}%`, transition: 'width 200ms ease' }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {formOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div
              className="absolute inset-0 bg-[var(--color-bg)]/70 backdrop-blur-sm"
              onClick={() => setFormOpen(false)}
            />
            <div className="relative w-full max-w-3xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <div className="text-sm font-mono uppercase tracking-widest text-[var(--color-ink-soft)]">
                  إنشاء مشروع جديد
                </div>
                <button
                  onClick={() => setFormOpen(false)}
                  className="text-xs font-mono uppercase tracking-widest text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
                >
                  إغلاق
                </button>
              </div>
              <form className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end" onSubmit={handleAddProject}>
                <div className="flex flex-col gap-2 md:col-span-1">
                  <label className="text-xs font-mono uppercase tracking-widest text-[var(--color-ink-soft)]">
                    اسم المشروع
                  </label>
                  <input
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="px-4 py-3 border border-[var(--color-border)] bg-[var(--color-surface-alt)] text-[var(--color-ink)] font-mono text-sm focus:outline-none focus:border-[var(--color-ink)]"
                    placeholder="مثل: نظام إدارة المهام"
                  />
                </div>
                <div className="flex flex-col gap-2 md:col-span-1">
                  <label className="text-xs font-mono uppercase tracking-widest text-[var(--color-ink-soft)]">وصف قصير</label>
                  <input
                    value={projectInfo}
                    onChange={(e) => setProjectInfo(e.target.value)}
                    className="px-4 py-3 border border-[var(--color-border)] bg-[var(--color-surface-alt)] text-[var(--color-ink)] font-mono text-sm focus:outline-none focus:border-[var(--color-ink)]"
                    placeholder="أدخل الفكرة أو المشكلة"
                  />
                </div>
                <div className="flex flex-col gap-2 md:col-span-1">
                  <label className="text-xs font-mono uppercase tracking-widest text-[var(--color-ink-soft)]">المدة التقديرية</label>
                  <input
                    value={projectEta}
                    onChange={(e) => setProjectEta(e.target.value)}
                    className="px-4 py-3 border border-[var(--color-border)] bg-[var(--color-surface-alt)] text-[var(--color-ink)] font-mono text-sm focus:outline-none focus:border-[var(--color-ink)]"
                    placeholder="مثال: 3 أسابيع"
                  />
                </div>
                <div className="md:col-span-3">
                  <button
                    type="submit"
                    className="w-full inline-flex items-center justify-center gap-2 bg-[var(--color-accent)] text-[var(--color-ink)] border border-[var(--color-accent)] hover:bg-[var(--color-accent-strong)] px-4 py-3 font-mono text-sm uppercase tracking-widest transition-colors rounded-none"
                  >
                    إطلاق المشروع وتوليد المهام
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
