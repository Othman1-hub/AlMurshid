'use client';

import React, { useActionState, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Plus, Sparkles, Activity, Edit2, Trash2, LayoutGrid, Server, Database, Cpu, ChevronDown, AlertCircle, Flame, Trophy, Target, Zap, Award, Shield } from 'lucide-react';
import Link from 'next/link';
import { useFormState, useFormStatus } from 'react-dom';
import { getUserDashboardData, signOut } from '../actions/auth';
import { addProject } from '../actions/projects';

type Theme = 'dark' | 'light' | 'neon' | 'sunset' | 'sand' | 'sky' | 'pink' | 'coffee';
const themeOptions: Theme[] = ['dark', 'light', 'neon', 'sunset', 'sand', 'sky', 'pink', 'coffee'];

type Project = {
  id: string;
  name: string;
  status: 'Active' | 'Planning' | 'Paused' | 'Review';
  eta: string;
  tasks: number;
  progress: number;
  xpReward: number; // New: XP Reward for completing the project
};

type Quest = {
  id: number;
  title: string;
  reward: number;
  completed: boolean;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  
  return (
    <button
      type="submit"
      disabled={pending}
      className="px-6 py-3 bg-[var(--color-accent)] text-white border border-[var(--color-accent)] text-xs font-mono font-bold hover:bg-[var(--color-accent-strong)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-[0_0_20px_-5px_var(--color-accent)]"
    >
      {pending ? 'EXECUTING...' : 'EXECUTE_CREATE'}
    </button>
  );
}

export default  function DashboardPage() {
  
  const [theme, setTheme] = useState<Theme>('dark');
  const [streak, setStreak] = useState(14);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // User data state
  const [username, setUsername] = useState('أحمد عبد الله');
  const [userLevel, setUserLevel] = useState(7);
  const [totalXp, setTotalXp] = useState(42500);
  const [currentXp, setCurrentXp] = useState(3820);
  
  // New: Daily Quests Data
  const [dailyQuests, setDailyQuests] = useState<Quest[]>([]);

  const [projects, setProjects] = useState<Project[]>([]);
  
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  // Fetch dashboard data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getUserDashboardData();
        
        if (data) {
          setUsername(data.stats.username);
          setUserLevel(data.stats.level);
          setTotalXp(data.stats.totalXp);
          setProjects(data.projects as Project[]);
          setCurrentXp(Math.min(data.stats.totalXp % 5000, 5000)); // XP towards next level
        }
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
      Active: 'border-[var(--color-accent)] text-[var(--color-accent)] bg-[var(--color-accent)]/5',
      Review: 'border-[var(--color-ink)] text-[var(--color-ink)] bg-[var(--color-surface-alt)]',
      Planning: 'border-[var(--color-ink-soft)] text-[var(--color-ink-soft)] border-dashed',
      Paused: 'border-[var(--color-border)] text-[var(--color-ink-soft)] opacity-60',
    }),
    []
  );

  const [formState, formAction] = useActionState(addProject, { 
    error: undefined, 
    success: undefined, 
    values: { name: undefined, description: undefined } 
  });

  useEffect(() => {
    if (formState.success) {
      setFormOpen(false);
      // Refresh projects data
      const fetchData = async () => {
        const data = await getUserDashboardData();
        if (data) {
          setProjects(data.projects as Project[]);
        }
      };
      fetchData();
    }
  }, [formState.success]);

  const handleSaveName = (id: string) => {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, name: editingName || p.name } : p)));
    setEditingId(null);
    setEditingName('');
  };

  const toggleQuest = (id: number) => {
    setDailyQuests(prev => prev.map(q => q.id === id ? { ...q, completed: !q.completed } : q));
  };

  return (
    <div
      className="min-h-screen bg-[var(--color-bg)] text-[var(--color-ink)] selection:bg-[var(--color-ink)] selection:text-[var(--color-bg)] overflow-x-hidden transition-colors duration-300"
      dir="rtl"
    >
      {/* INJECTED CSS VARIABLES */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;700&family=JetBrains+Mono:wght@400;700&display=swap');
        
        :root, :root.dark {
          --color-bg: #050505;
          --color-surface: #0A0A0A;
          --color-surface-alt: #111111;
          --color-surface-contrast: #ffffff;
          --color-border: #222222;
          --color-border-strong: #444444;
          --color-ink: #ffffff;
          --color-ink-soft: #888888;
          --color-accent: #0044FF;
          --color-accent-strong: #0033CC;
          --color-success: #00FF9D; /* New: Success Color for gamification */
          --color-gold: #FFD700;    /* New: Gold for rewards */
        }

        :root.light {
          --color-bg: #ffffff;
          --color-surface: #f8f9fa;
          --color-surface-alt: #f1f3f5;
          --color-surface-contrast: #000000;
          --color-border: #e9ecef;
          --color-border-strong: #dee2e6;
          --color-ink: #212529;
          --color-ink-soft: #868e96;
          --color-accent: #0044FF;
          --color-accent-strong: #0033CC;
          --color-success: #00aa63;
          --color-gold: #d4af37;
        }

        :root.neon {
          --color-bg: #0a0a12;
          --color-surface: #13131f;
          --color-surface-alt: #1c1c2e;
          --color-surface-contrast: #00F3FF;
          --color-border: #2d2d45;
          --color-border-strong: #00F3FF;
          --color-ink: #e0e6ed;
          --color-ink-soft: #6b7280;
          --color-accent: #00F3FF;
          --color-accent-strong: #00c4cc;
          --color-success: #39ff14;
          --color-gold: #ff00ff;
        }

        body { font-family: 'IBM Plex Sans Arabic', sans-serif; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        
        .bg-grid-pattern {
          background-image: linear-gradient(var(--color-border) 1px, transparent 1px),
                            linear-gradient(90deg, var(--color-border) 1px, transparent 1px);
          background-size: 40px 40px;
          mask-image: linear-gradient(to bottom, black 40%, transparent 100%);
        }

        .tech-border-b { border-bottom: 1px solid var(--color-border); }
      `}</style>

      {/* Header */}
      <div className="tech-border-b bg-[var(--color-bg)]/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-[var(--color-accent)] flex items-center justify-center rounded-none">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-lg font-bold font-mono tracking-tight leading-none">
                ALMurshed<span className="text-[var(--color-accent)]">_</span>
              </div>
              <div className="text-[10px] text-[var(--color-ink-soft)] font-mono uppercase tracking-widest mt-1">
                SYSTEM::DASHBOARD
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* NEW: Gamified Streak Counter */}
            <div className="hidden md:flex items-center gap-2 px-3 py-1 border border-[var(--color-border)] bg-[var(--color-surface-alt)]">
              <Flame className="w-4 h-4 text-[var(--color-gold)] fill-[var(--color-gold)] animate-pulse" />
              <div className="text-xs font-mono font-bold">
                <span className="text-[var(--color-ink)]">{streak}</span>
                <span className="text-[var(--color-ink-soft)] ml-1">DAY_STREAK</span>
              </div>
            </div>

            <div className="h-6 w-px bg-[var(--color-border)]"></div>

            <div className="hidden md:flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[var(--color-ink-soft)]">
              <div className="relative group">
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value as Theme)}
                  className="appearance-none bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-ink)] px-3 py-1 pr-8 focus:outline-none focus:border-[var(--color-accent)] rounded-none cursor-pointer font-bold"
                >
                  {themeOptions.map((opt) => (
                    <option key={opt} value={opt}>{opt.toUpperCase()}</option>
                  ))}
                </select>
                <ChevronDown className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--color-ink-soft)]" />
              </div>
            </div>

            <div className="h-6 w-px bg-[var(--color-border)]"  ></div>

            <Link
            onClick={async ()=>{
                await signOut();
            }} 
              href="/"
              className="flex items-center gap-2 text-xs font-mono font-bold text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-alt)] px-3 py-2 border border-transparent hover:border-[var(--color-border)] transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              LOGOUT
            </Link>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-12 relative">
        <div className="absolute inset-0 bg-grid-pattern pointer-events-none opacity-[0.03] z-0" />
        
        {/* Profile & Stats Section */}
        <section className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-px bg-[var(--color-border)] border border-[var(--color-border)]">
          
          {/* User Info & XP (Left) */}
          <div className="lg:col-span-4 bg-[var(--color-bg)] p-8 flex flex-col justify-between min-h-[200px]">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold mb-1">{username}</h1>
                <div className="text-xs font-mono text-[var(--color-accent)] uppercase tracking-widest mb-4 flex items-center gap-2">
                  <div className="w-2 h-2 bg-[var(--color-accent)] rounded-full animate-pulse" />
                  {title} {/* ID: {userLevel} */}
                </div>
                <div className="inline-flex items-center gap-2 text-[10px] font-mono uppercase border border-[var(--color-border-strong)] bg-[var(--color-surface-alt)] px-2 py-1 text-[var(--color-ink)]">
                  <Activity className="w-3 h-3 text-[var(--color-accent)]" /> Level {String(userLevel).padStart(2, '0')}
                </div>
              </div>
              
              {/* Rank Badge */}
              <div className="relative group cursor-help">
                <div className="w-16 h-16 bg-[var(--color-surface-alt)] border border-[var(--color-border)] flex items-center justify-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-0 h-0 border-t-[20px] border-r-[20px] border-t-transparent border-r-[var(--color-gold)]"></div>
                  <span className="font-mono text-2xl font-bold text-[var(--color-ink-soft)]">{username.charAt(0)}</span>
                </div>
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block bg-[var(--color-surface)] border border-[var(--color-border)] p-2 text-[10px] font-mono whitespace-nowrap z-20">
                  RANK: ALPHA ARCHITECT
                </div>
              </div>
            </div>
            
            {/* XP System Bar */}
            <div className="mt-8">
              <div className="flex justify-between text-[10px] font-mono mb-2 text-[var(--color-ink-soft)]">
                <span>SYSTEM_CHARGE (XP)</span>
                <span className="text-[var(--color-accent)]">{currentXp} / {nextLevel}</span>
              </div>
              <div className="h-3 w-full bg-[var(--color-surface-alt)] relative overflow-hidden border border-[var(--color-border)]">
                <div 
                  className="h-full bg-[var(--color-accent)] absolute top-0 right-0 transition-all duration-500"
                  style={{ width: `${xpProgress}%` }} 
                />
                {/* Grid lines over bar */}
                <div className="absolute inset-0 bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAIklEQVQIW2NkQAKrVq36zwjjgzhhZWGMYAEYB8RmROaABADeOQ8CXl/xfgAAAABJRU5ErkJggg==')] opacity-30"></div>
              </div>
              <div className="mt-1 flex justify-between text-[9px] font-mono text-[var(--color-ink-soft)]">
                <span>NEXT_REWARD: UNLOCK_BETA_ACCESS</span>
                <span>{(xpProgress).toFixed(1)}% LOADED</span>
              </div>
            </div>
          </div>

          {/* Gamified Stats Grid (Right) */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-px bg-[var(--color-border)]">
            {[
              { label: "Total XP Earned", value: totalXp > 0 ? `${(totalXp / 1000).toFixed(1)}k` : "0", icon: <Zap className="w-4 h-4" /> },
              { label: "Quest Completion", value: "94%", icon: <Target className="w-4 h-4" /> },
              { label: "Focus Efficiency", value: "+18%", icon: <Sparkles className="w-4 h-4" /> },
              { label: "Active Badges", value: "05", icon: <Award className="w-4 h-4" /> }
            ].map((stat, idx) => (
              <div key={idx} className="bg-[var(--color-bg)] p-6 flex flex-col justify-between hover:bg-[var(--color-surface-alt)] transition-colors group cursor-default">
                <div className="text-[var(--color-ink-soft)] group-hover:text-[var(--color-accent)] transition-colors mb-4 flex justify-between items-start">
                  {stat.icon}
                  <div className="w-1 h-1 bg-[var(--color-border)] group-hover:bg-[var(--color-accent)] transition-colors"></div>
                </div>
                <div>
                  <div className="text-3xl font-mono font-bold tracking-tighter">{stat.value}</div>
                  <div className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-ink-soft)] mt-1 group-hover:text-[var(--color-ink)] transition-colors">
                    {stat.label}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Daily Protocols (Quests) */}
          <div className="lg:col-span-3 bg-[var(--color-surface-alt)] p-6 border-r border-[var(--color-border)]">
            <div className="flex items-center gap-2 mb-6 text-[var(--color-ink)]">
              <Trophy className="w-4 h-4 text-[var(--color-gold)]" />
              <h3 className="text-xs font-mono font-bold uppercase tracking-widest">Daily Protocols</h3>
            </div>
            <div className="space-y-3">
              {dailyQuests.map((quest) => (
                <div 
                  key={quest.id} 
                  onClick={() => toggleQuest(quest.id)}
                  className={`p-3 border cursor-pointer transition-all relative group ${
                    quest.completed 
                      ? 'bg-[var(--color-success)]/10 border-[var(--color-success)]' 
                      : 'bg-[var(--color-bg)] border-[var(--color-border)] hover:border-[var(--color-accent)]'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className={`text-xs font-mono ${quest.completed ? 'text-[var(--color-success)] line-through' : 'text-[var(--color-ink)]'}`}>
                      {quest.title}
                    </span>
                    {quest.completed && <div className="w-2 h-2 bg-[var(--color-success)] rounded-full" />}
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <span className={`text-[10px] font-mono ${quest.completed ? 'text-[var(--color-success)]' : 'text-[var(--color-gold)]'}`}>
                      +{quest.reward} XP
                    </span>
                    {!quest.completed && <div className="text-[9px] text-[var(--color-ink-soft)] opacity-0 group-hover:opacity-100">CLICK TO COMPLETE</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Achievements / Badges Strip */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: "Bug Hunter", desc: "Fixed 50 bugs", active: true, icon: <Trash2 className="w-4 h-4" /> },
            { name: "Night Owl", desc: "Committed after 2 AM", active: true, icon: <Sparkles className="w-4 h-4" /> },
            { name: "Architect", desc: "Created 10 Projects", active: false, icon: <LayoutGrid className="w-4 h-4" /> },
            { name: "Defender", desc: "No critical errors", active: false, icon: <Shield className="w-4 h-4" /> },
          ].map((badge, idx) => (
            <div key={idx} className={`flex items-center gap-4 p-4 border ${badge.active ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/5' : 'border-[var(--color-border)] bg-[var(--color-bg)] opacity-50'}`}>
              <div className={`p-2 ${badge.active ? 'text-[var(--color-accent)]' : 'text-[var(--color-ink-soft)]'}`}>
                {badge.icon}
              </div>
              <div>
                <div className="text-xs font-bold font-mono uppercase">{badge.name}</div>
                <div className="text-[10px] text-[var(--color-ink-soft)] font-mono">{badge.desc}</div>
              </div>
            </div>
          ))}
        </section>

        {/* Projects Section */}
        <section className="relative z-10 space-y-6">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-4">
            <div className="flex items-center gap-3">
              <div className="w-1 h-6 bg-[var(--color-accent)]"></div>
              <h2 className="text-lg font-bold font-mono tracking-tight">ACTIVE MISSIONS</h2>
              <span className="text-xs text-[var(--color-ink-soft)] font-mono bg-[var(--color-surface-alt)] px-2 py-0.5 rounded-none">
                COUNT: {projects.length}
              </span>
            </div>
            
            <button
              onClick={() => setFormOpen(true)}
              className="group flex items-center gap-2 px-5 py-2 bg-[var(--color-ink)] text-[var(--color-bg)] hover:bg-[var(--color-accent)] hover:text-white transition-all font-mono text-xs font-bold uppercase tracking-widest rounded-none"
            >
              <Plus className="w-4 h-4" />
              INITIALIZE_NEW
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((proj) => (
              <div
                key={proj.id}
                className="group relative bg-[var(--color-bg)] border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-all p-6 flex flex-col justify-between min-h-[240px]"
              >
                {/* Hover Corner Effect */}
                <div className="absolute top-0 right-0 w-0 h-0 border-t-[20px] border-r-[20px] border-t-transparent border-r-[var(--color-accent)] opacity-0 group-hover:opacity-100 transition-opacity"></div>

                {/* Top Bar */}
                <div className="flex justify-between items-start mb-6">
                  <div className={`px-2 py-1 text-[10px] font-mono uppercase tracking-widest border ${statusColor[proj.status]}`}>
                    {proj.status}
                  </div>
                  <div className="font-mono text-xs text-[var(--color-ink-soft)] group-hover:text-[var(--color-ink)] transition-colors">
                    {proj.id}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1">
                  {editingId === proj.id ? (
                    <div className="flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-200">
                      <input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="w-full bg-[var(--color-surface-alt)] border border-[var(--color-border)] p-2 text-sm font-bold focus:outline-none focus:border-[var(--color-accent)]"
                        autoFocus
                      />
                      <div className="flex gap-2 mt-2">
                        <button onClick={() => handleSaveName(proj.id)} className="text-xs bg-[var(--color-accent)] text-white px-3 py-1 font-bold hover:bg-[var(--color-accent-strong)]">SAVE</button>
                        <button onClick={() => setEditingId(null)} className="text-xs border border-[var(--color-border)] px-3 py-1 hover:bg-[var(--color-surface-alt)]">CANCEL</button>
                      </div>
                    </div>
                  ) : (
                    <h3 className="text-xl font-bold mb-2 group-hover:text-[var(--color-accent)] transition-colors cursor-pointer" onClick={() => { setEditingId(proj.id); setEditingName(proj.name); }}>
                      {proj.name}
                    </h3>
                  )}
                  <div className="text-xs text-[var(--color-ink-soft)] font-mono mt-4 flex gap-4 border-t border-[var(--color-border)] pt-4 border-dashed">
                    <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> {proj.tasks} TASKS</span>
                    <span>ETA: {proj.eta}</span>
                  </div>
                </div>

                {/* Footer / Progress */}
                <div className="mt-6">
                  {/* Reward Pill */}
                  <div className="mb-3 flex justify-end">
                    <span className="text-[9px] font-mono text-[var(--color-gold)] bg-[var(--color-gold)]/10 border border-[var(--color-gold)]/30 px-2 py-0.5">
                      REWARD: {proj.xpReward} XP
                    </span>
                  </div>

                  <div className="flex justify-between text-[10px] font-mono mb-2 uppercase tracking-widest text-[var(--color-ink-soft)]">
                    <span>Completion</span>
                    <span>{proj.progress}%</span>
                  </div>
                  <div className="h-1 w-full bg-[var(--color-surface-alt)] overflow-hidden">
                    <div
                      className="h-full bg-[var(--color-ink)] group-hover:bg-[var(--color-accent)] transition-colors"
                      style={{ width: `${proj.progress}%` }}
                    />
                  </div>
                  
                  {/* Action Overlay */}
                  <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                    <button 
                      onClick={() => { setEditingId(proj.id); setEditingName(proj.name); }}
                      className="p-1.5 hover:bg-[var(--color-surface-alt)] text-[var(--color-ink-soft)] hover:text-[var(--color-accent)] transition-colors"
                      title="Edit Name"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button 
                      onClick={() => confirm('Delete?') && setProjects(prev => prev.filter(p => p.id !== proj.id))}
                      className="p-1.5 hover:bg-[var(--color-surface-alt)] text-[var(--color-ink-soft)] hover:text-red-500 transition-colors"
                      title="Delete Project"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* New Project Modal (Terminal Style) */}
      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--color-bg)]/90 backdrop-blur-sm" dir="rtl">
          <div className="w-full max-w-2xl bg-[var(--color-bg)] border border-[var(--color-accent)] shadow-[0_0_50px_-10px_rgba(0,68,255,0.2)] animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)] bg-[var(--color-surface-alt)]">
              <div className="flex items-center gap-2 font-mono text-sm font-bold text-[var(--color-accent)]">
                <AlertCircle className="w-4 h-4" />
                <span>PROJECT_INITIALIZER.EXE</span>
              </div>
              <button onClick={() => setFormOpen(false)} className="hover:text-[var(--color-accent)] font-mono">
                [ESC]
              </button>
            </div>

            {/* Modal Body */}
            <form action={formAction} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="block text-xs font-mono uppercase tracking-widest text-[var(--color-ink-soft)] flex items-center gap-2">
                  <span className="w-1 h-1 bg-[var(--color-accent)]"></span> Project Designation (Name)
                </label>
                <input
                  name="name"
                  required
                  className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] p-3 font-mono text-sm focus:outline-none focus:border-[var(--color-accent)] placeholder:text-[var(--color-ink-soft)]/30 transition-colors"
                  placeholder="ENTER_IDENTIFIER..."
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-xs font-mono uppercase tracking-widest text-[var(--color-ink-soft)]">
                    Parameters (Description)
                  </label>
                  <textarea
                    name="description"
                    className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] p-3 font-mono text-sm focus:outline-none focus:border-[var(--color-accent)] resize-none"
                    placeholder="..."
                    rows={3}
                  />
                </div>
              </div>

              {formState.error && (
                <div className="p-3 bg-red-500/10 border border-red-500 text-red-500 text-xs font-mono">
                  ERROR: {formState.error}
                </div>
              )}

              <div className="pt-6 flex justify-end gap-4 border-t border-[var(--color-border)] mt-2">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="px-6 py-3 border border-[var(--color-border)] text-xs font-mono font-bold hover:bg-[var(--color-surface-alt)] text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] transition-colors"
                >
                  ABORT_SEQUENCE
                </button>
                <SubmitButton />
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
