/* eslint-disable react-hooks/exhaustive-deps */
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
import { useRouter } from "next/navigation";
import { signIn } from "../actions/auth";
import { createClient } from "@/utils/supabase/client";
import { Logo } from "@/components/Logo";

const buttonBase =
  "w-full inline-flex items-center justify-center gap-2 px-4 py-3 border text-sm font-mono uppercase tracking-wider transition-colors rounded-none";

const inputBase =
  "w-full bg-[var(--color-surface)] border border-[var(--color-border)] text-[var(--color-ink)] px-4 py-3 focus:outline-none focus:border-[var(--color-ink)] font-mono text-sm placeholder-[var(--color-ink-soft)]";

export default function SignInPage() {
  const router = useRouter();
  type Theme = "dark" | "light" | "coffee" | "tvgirl" | "sonic" | "pikachu";
  const themeOptions: Theme[] = [
    "dark",
    "light",
    "coffee",
    "tvgirl",
    "sonic",
    "pikachu",
  ];
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "dark";
    const stored = window.localStorage.getItem("almurshed-theme");
    return stored && themeOptions.includes(stored as Theme)
      ? (stored as Theme)
      : "dark";
  });
  const [state, formAction, pending] = useActionState(signIn, {
    error: "",
    values: { email: "" },
  });
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const supabaseRedirect =
    "https://al-murshid.vercel.app/api/auth/callback?next=/dashboard";

  useEffect(() => {
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      root.classList.remove(...themeOptions);
      root.classList.add(theme);
      localStorage.setItem("almurshed-theme", theme);
    }
  }, [theme]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          router.push("/dashboard");
        } else {
          setIsCheckingAuth(false);
        }
      } catch (error) {
        console.error("Auth check error:", error);
        setIsCheckingAuth(false);
      }
    };
    checkAuth();
  }, [router]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));
  const handleSignInWithProvider = async (provider: "google" | "github") => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: supabaseRedirect },
    });
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-[var(--color-bg)] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-[var(--color-border)] border-t-[var(--color-accent)] rounded-full animate-spin mx-auto"></div>
          <p className="text-[var(--color-ink-soft)] font-mono text-sm uppercase tracking-widest">
            Checking authentication...
          </p>
        </div>
      </div>
    );
  }

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
            <h1 className="text-4xl font-medium leading-tight">تسجيل الدخول</h1>
            <p className="text-[var(--color-ink-soft)] leading-relaxed">
              سجّل دخولك للوصول إلى لوحة التحكم، الوحدات، وخطوط النشر. يمكنك
              استخدام GitHub أو Google أو الدخول يدوياً.
            </p>
            <div className="grid grid-cols-2 gap-4 text-xs text-[var(--color-ink-soft)] font-mono uppercase tracking-widest">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-[var(--color-accent)]" />
                جلسات آمنة
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-[var(--color-accent)]" />
                سجل تدقيق
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-[var(--color-accent)]" />
                MFA جاهز
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-[var(--color-accent)]" />
                دعم GitHub/Google
              </div>
            </div>
          </div>

          <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-10 flex flex-col gap-6">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[var(--color-ink-soft)]">
                <span className="w-2 h-2 bg-[var(--color-accent)]" />
                Sign in options
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleSignInWithProvider("github")}
                  className={`${buttonBase} bg-[var(--color-surface-alt)] border-[var(--color-border-strong)] text-[var(--color-ink)] hover:border-[var(--color-ink)]`}
                >
                  <Github className="w-4 h-4" />
                  GitHub
                </button>
                <button
                  type="button"
                  onClick={() => handleSignInWithProvider("google")}
                  className={`${buttonBase} bg-[var(--color-ink)] text-[var(--color-bg)] border-[var(--color-ink)] hover:bg-[var(--color-ink-soft-contrast)] hover:border-[var(--color-ink-soft-contrast)]`}
                >
                  <Mail className="w-4 h-4" />
                  Google
                </button>
              </div>
            </div>

            <div className="h-[1px] bg-[var(--color-border)]" />

            <form className="space-y-4" action={formAction}>
              {state.error && (
                <div className="p-3 bg-[var(--color-error-surface)] border border-[var(--color-error-border)] text-[var(--color-error-ink)] text-sm font-mono">
                  {state.error}
                </div>
              )}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-mono uppercase tracking-widest text-[var(--color-ink-soft)]">
                  البريد الإلكتروني
                </label>
                <div className="flex items-center gap-3 border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3">
                  <User className="w-4 h-4 text-[var(--color-ink-soft)]" />
                  <input
                    className={`${inputBase} border-none bg-transparent px-0`}
                    placeholder="name@company.com"
                    name="email"
                    type="email"
                    required
                    defaultValue={state.values.email ?? ""}
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
                    type="password"
                    className={`${inputBase} border-none bg-transparent px-0`}
                    placeholder="••••••••"
                    name="password"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-between items-center text-xs font-mono text-[var(--color-ink-soft)]">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="accent-[var(--color-accent)]"
                  />
                  تذكرني
                </label>
                <Link href="#" className="hover:text-[var(--color-ink)]">
                  نسيت كلمة المرور؟
                </Link>
              </div>

              <button
                type="submit"
                className="w-full bg-[var(--color-accent)] text-[var(--color-ink)] border border-[var(--color-accent)] hover:bg-[var(--color-accent-strong)] px-4 py-3 font-mono text-sm uppercase tracking-widest transition-colors rounded-none"
              >
                {pending ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}
              </button>

              <div className="text-[var(--color-ink-soft)] text-xs font-mono flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-[var(--color-accent)]" />
                ليس لديك حساب؟{" "}
                <Link
                  href="/sign-up"
                  className="text-[var(--color-ink)] hover:text-[var(--color-accent)]"
                >
                  إنشاء حساب
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
