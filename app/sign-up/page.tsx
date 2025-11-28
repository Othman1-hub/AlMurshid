"use client";

import React, { useActionState, useEffect, useState } from "react";
import {
  Github,
  Mail,
  Shield,
  ArrowLeft,
  LockKeyhole,
  User,
} from "lucide-react";
import Link from "next/link";
import { signUp } from "../actions/auth";
import { createClient } from "@/utils/supabase/client";
import { Logo } from "@/components/Logo";

const buttonBase =
  "w-full inline-flex items-center justify-center gap-2 px-4 py-3 border text-sm font-mono uppercase tracking-wider transition-colors rounded-none";

const inputBase =
  "w-full bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-ink)] px-4 py-3 focus:outline-none focus:border-[var(--color-ink)] font-mono text-sm placeholder-[var(--color-ink-soft)]";

type Theme =
  | "dark"
  | "light"
  | "neon"
  | "sunset"
  | "sand"
  | "sky"
  | "pink"
  | "coffee";
const themeOptions: Theme[] = [
  "dark",
  "light",
  "neon",
  "sunset",
  "sand",
  "sky",
  "pink",
  "coffee",
];

export default function SignUpPage() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [state, formAction, pending] = useActionState(signUp, {
    error: "",
    values: { email: "", fullName: "" },
  });
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

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));
  const supabaseRedirect = "http://localhost:3000/api/auth/callback?next=/dashboard";

  const handleSignupWithGithub = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo: supabaseRedirect },
    });
  };
  const handelSignupWithGoogle = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: supabaseRedirect },
    });
  };
  return (
    <div
      className="min-h-screen bg-[var(--color-bg)] text-[var(--color-ink)] selection:bg-[var(--color-ink)] selection:text-[var(--color-bg)]"
      dir="rtl"
    >
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="flex items-center justify-between mb-12">
          <Logo subtitle="secure access" size="sm" />
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex items-center gap-2 px-3 py-2 border border-[var(--color-border)] bg-[var(--color-surface-alt)] text-xs font-mono uppercase tracking-widest hover:border-[var(--color-ink)]"
            >
              {theme === "dark" ? "وضع نهاري" : "وضع ليلي"}
            </button>
            <Link
              href="/"
              className="flex items-center gap-2 text-xs font-mono text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"
            >
              <ArrowLeft className="w-4 h-4" />
              العودة للرئيسية
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-10 flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-[var(--color-ink)]" />
              <span className="text-sm font-mono uppercase tracking-widest text-[var(--color-ink-soft)]">
                Access Control
              </span>
            </div>
            <h1 className="text-4xl font-medium leading-tight">
              إنشاء حساب جديد
            </h1>
            <p className="text-[var(--color-ink-soft)] leading-relaxed">
              انضم إلى نظام ALMurshed لتشغيل فرق البرمجيات بسرعة وأمان. اختر
              مزود الدخول أو أدخل بياناتك يدوياً للبدء.
            </p>
            <div className="grid grid-cols-2 gap-4 text-xs text-[var(--color-ink-soft)] font-mono uppercase tracking-widest">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-[var(--color-accent)]" />
                مراقبة فورية
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-[var(--color-accent)]" />
                تشفير كامل
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-[var(--color-accent)]" />
                دعم GitHub/GitLab
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-[var(--color-accent)]" />
                تحكم صلاحيات
              </div>
            </div>
          </div>

          <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-10 flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[var(--color-ink-soft)]">
                <span className="w-2 h-2 bg-[var(--color-accent)]" />
                Sign up options
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleSignupWithGithub}
                  className={`${buttonBase} bg-[var(--color-surface-alt)] border-[var(--color-border-strong)] text-[var(--color-ink)] hover:border-[var(--color-ink)]`}
                >
                  <Github className="w-4 h-4" />
                  GitHub
                </button>
                <button
                  type="button"
                  onClick={handelSignupWithGoogle}
                  className={`${buttonBase} bg-[var(--color-ink)] text-[var(--color-bg)] border-[var(--color-ink)] hover:bg-[var(--color-ink-soft-contrast)] hover:border-[var(--color-ink-soft-contrast)]`}
                >
                  <Mail className="w-4 h-4" />
                  Google
                </button>
              </div>
            </div>

            <div className="h-[1px] bg-[var(--color-border)]" />

            <form action={formAction} className="space-y-4">
              {state.error && (
                <p className="text-red-500 text-sm font-mono">{state.error}</p>
              )}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-mono uppercase tracking-widest text-[var(--color-ink-soft)]">
                  الاسم الكامل
                </label>
                <div className="flex items-center gap-3 border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3">
                  <User className="w-4 h-4 text-[var(--color-ink-soft)]" />
                  <input
                    name="fullName"
                    defaultValue={state.values.fullName ?? ""}
                    className={`${inputBase} border-none bg-transparent px-0`}
                    placeholder="أدخل اسمك"
                    required
                    disabled={pending}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-mono uppercase tracking-widest text-[var(--color-ink-soft)]">
                  البريد الإلكتروني
                </label>
                <div className="flex items-center gap-3 border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3">
                  <Mail className="w-4 h-4 text-[var(--color-ink-soft)]" />
                  <input
                    name="email"
                    defaultValue={state.values.email ?? ""}
                    className={`${inputBase} border-none bg-transparent px-0`}
                    placeholder="name@company.com"
                    required
                    disabled={pending}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-mono uppercase tracking-widest text-[var(--color-ink-soft)]">
                  كلمة المرور
                </label>
                <div className="flex items-center gap-3 border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3">
                  <LockKeyhole className="w-4 h-4 text-[var(--color-ink-soft)]" />
                  <input
                    name="password"
                    type="password"
                    className={`${inputBase} border-none bg-transparent px-0`}
                    placeholder="••••••••"
                    required
                    disabled={pending}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-mono uppercase tracking-widest text-[var(--color-ink-soft)]">
                  تأكيد كلمة المرور
                </label>
                <div className="flex items-center gap-3 border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3">
                  <LockKeyhole className="w-4 h-4 text-[var(--color-ink-soft)]" />
                  <input
                    name="confirmPassword"
                    type="password"
                    className={`${inputBase} border-none bg-transparent px-0`}
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={pending}
                className="w-full bg-[var(--color-accent)] text-[var(--color-ink)] border border-[var(--color-accent)] hover:bg-[var(--color-accent-strong)] px-4 py-3 font-mono text-sm uppercase tracking-widest transition-colors rounded-none"
              >
                {pending ? "جاري الإنشاء..." : "إنشاء الحساب"}
              </button>

              <div className="text-[var(--color-ink-soft)] text-xs font-mono flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[var(--color-accent)]" />
                بالمتابعة، أنت توافق على شروط الخدمة وسياسة الخصوصية.
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
