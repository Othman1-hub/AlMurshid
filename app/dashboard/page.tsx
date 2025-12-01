"use client";

import React, { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserDashboardData } from "../actions/auth";
import { addProject, updateProject, deleteProject } from "../actions/projects";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { ProfileCard } from "@/components/dashboard/ProfileCard";
import { StatsGrid } from "@/components/dashboard/StatsGrid";
import { DailyQuests } from "@/components/dashboard/DailyQuests";
import { AchievementsBadges } from "@/components/dashboard/AchievementsBadges";
import { ProjectsGrid } from "@/components/dashboard/ProjectsGrid";
import { NewProjectModal } from "@/components/dashboard/NewProjectModal";

type Theme = "dark" | "light" | "coffee" | "tvgirl" | "sonic" | "pikachu";
const themeOptions: Theme[] = [
  "dark",
  "light",
  "coffee",
  "tvgirl",
  "sonic",
  "pikachu",
];

type Project = {
  id: string;
  name: string;
  status: "Active" | "Planning" | "Paused" | "Review";
  eta: string;
  tasks: number;
  progress: number;
  xpReward: number;
};

type Quest = {
  id: number;
  title: string;
  reward: number;
  completed: boolean;
};

type Achievement = {
  id: string;
  name: string;
  description?: string;
  active?: boolean;
  earned_at?: string;
};

type TaskSummary = {
  total: number;
  completed: number;
};

export default function DashboardPage() {
  const router = useRouter();
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "dark";
    const stored = window.localStorage.getItem("almurshed-theme");
    return stored && themeOptions.includes(stored as Theme)
      ? (stored as Theme)
      : "dark";
  });
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // User data state
  const [username, setUsername] = useState("");
  const [userLevel, setUserLevel] = useState<number | null>(null);
  const [totalXp, setTotalXp] = useState<number | null>(null);
  const [currentXp, setCurrentXp] = useState(0);
  const [userProfilePicture, setUserProfilePicture] = useState<string | null>(
    null
  );

  const [dailyQuests, setDailyQuests] = useState<Quest[]>([]);
  const [tasksSummary, setTasksSummary] = useState<TaskSummary>({
    total: 0,
    completed: 0,
  });
  const [projects, setProjects] = useState<Project[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [formOpen, setFormOpen] = useState(false);

  const Skeleton = ({ className = "" }: { className?: string }) => (
    <div className={`skeleton ${className}`} aria-hidden />
  );
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getUserDashboardData();

        if (data) {
          const totalXpValue = Number(data.stats.totalXp ?? 0);
          const levelValue =
            typeof data.stats.level === "number"
              ? data.stats.level
              : Math.floor(totalXpValue / 1000) + 1;

          setUsername(data.stats.username);
          setUserLevel(levelValue);
          setTotalXp(totalXpValue);
          setProjects((data.projects as Project[]) || []);
          setCurrentXp(totalXpValue % 1000);
          setUserProfilePicture(data.stats.userProfilePicture || null);
          setStreak(data.stats.streak ?? 0);
          setAchievements(
            (data.achievements as Achievement[] | undefined) || []
          );
          setTasksSummary({
            total: data.taskSummary?.total ?? 0,
            completed: data.taskSummary?.completed ?? 0,
          });
        } else {
          setTasksSummary({ total: 0, completed: 0 });
        }
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        setError("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const stored =
      typeof window !== "undefined"
        ? localStorage.getItem("almurshed-theme")
        : null;
    if (stored && themeOptions.includes(stored as Theme)) {
      setTheme(stored as Theme);
    }
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      root.classList.remove(...themeOptions);
      root.classList.add(theme);
      localStorage.setItem("almurshed-theme", theme);
    }
  }, [theme]);

  const nextLevel = 1000;
  const xpProgress = loading
    ? 0
    : Math.min(100, (currentXp / nextLevel) * 100);
  const title = (totalXp ?? 0) > 4000 ? "Chief Architect" : "Systems Lead";

  const questCompletion =
    tasksSummary.total > 0
      ? `${Math.round((tasksSummary.completed / tasksSummary.total) * 100)}%`
      : "0%";
  const activeBadgeCount = achievements.filter((a) => a.active ?? true).length;
  const activeBadgesDisplay =
    activeBadgeCount > 0 ? activeBadgeCount.toString().padStart(2, "0") : "0";

  const [formState, formAction] = useActionState(addProject, {
    error: undefined,
    success: undefined,
    values: { name: undefined, description: undefined },
  });

  useEffect(() => {
    if (formState.success && formState.project) {
      setFormOpen(false);
      router.push(`/dashboard/${formState.project.id}/generate`);
    }
  }, [formState.success, formState.project, router]);

  const handleEditProject = async (id: string, name: string) => {
    if (!name.trim()) return;

    // Optimistically update UI
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, name: name.trim() } : p))
    );

    try {
      const formData = new FormData();
      formData.append("name", name.trim());
      
      const result = await updateProject(Number(id), {}, formData);
      
      if (result.error) {
        console.error("Failed to update project:", result.error);
        // Revert on error - refetch data
        const data = await getUserDashboardData();
        if (data) {
          setProjects((data.projects as Project[]) || []);
        }
      }
    } catch (err) {
      console.error("Error updating project:", err);
      // Revert on error
      const data = await getUserDashboardData();
      if (data) {
        setProjects((data.projects as Project[]) || []);
      }
    }
  };

  const handleDeleteProject = async (id: string) => {
    // Optimistically update UI
    setProjects((prev) => prev.filter((p) => p.id !== id));

    try {
      const result = await deleteProject(Number(id));
      
      if (result.error) {
        console.error("Failed to delete project:", result.error);
        // Revert on error - refetch data
        const data = await getUserDashboardData();
        if (data) {
          setProjects((data.projects as Project[]) || []);
        }
      }
    } catch (err) {
      console.error("Error deleting project:", err);
      // Revert on error
      const data = await getUserDashboardData();
      if (data) {
        setProjects((data.projects as Project[]) || []);
      }
    }
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
          --color-success: #00FF9D;
          --color-gold: #FFD700;
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

        .skeleton {
          position: relative;
          overflow: hidden;
          background: linear-gradient(90deg, rgba(255,255,255,0.05), rgba(255,255,255,0.08));
          background-color: var(--color-surface-alt);
          border: 1px solid var(--color-border);
        }

        .skeleton::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(120deg, transparent, rgba(255,255,255,0.2), transparent);
          transform: translateX(-100%);
          animation: shimmer 1.4s infinite;
        }

        @keyframes shimmer {
          100% { transform: translateX(100%); }
        }
      `}</style>

      {/* Header */}
      <DashboardHeader
        theme={theme}
        themeOptions={themeOptions}
        onThemeChange={(value) => setTheme(value as Theme)}
        streak={streak}
        loading={loading}
        Skeleton={Skeleton}
      />

      <main className="max-w-7xl mx-auto px-6 py-10 space-y-12 relative">
        <div className="absolute inset-0 bg-grid-pattern pointer-events-none opacity-[0.03] z-0" />

        {/* Profile & Stats Section */}
        <section className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-px bg-[var(--color-border)] border border-[var(--color-border)]">
          {/* User Info & XP (Left) */}
          <ProfileCard
            username={username}
            title={title}
            userLevel={userLevel}
            userProfilePicture={userProfilePicture}
            currentXp={currentXp}
            nextLevel={nextLevel}
            xpProgress={xpProgress}
            loading={loading}
            Skeleton={Skeleton}
          />

          {/* Gamified Stats Grid (Right) */}
          <StatsGrid
            totalXp={totalXp}
            questCompletion={questCompletion}
            tasksSummaryTotal={tasksSummary.total}
            activeBadgesDisplay={activeBadgesDisplay}
            loading={loading}
            Skeleton={Skeleton}
          />

          {/* Daily Protocols (Quests) */}
          <DailyQuests />
        </section>

        {/* Achievements / Badges Strip */}
        <AchievementsBadges
          achievements={achievements}
          loading={loading}
          Skeleton={Skeleton}
        />

        {/* Projects Section */}
        <ProjectsGrid
          projects={projects}
          onOpenForm={() => setFormOpen(true)}
          onEditProject={handleEditProject}
          onDeleteProject={handleDeleteProject}
        />
      </main>

      {/* New Project Modal */}
      <NewProjectModal
        isOpen={formOpen}
        onClose={() => setFormOpen(false)}
        formAction={formAction}
        formError={formState.error}
      />
    </div>
  );
}
