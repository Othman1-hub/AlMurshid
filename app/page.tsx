
'use client';

import React, { useEffect, useState } from 'react';
import { Terminal, LayoutGrid, Zap, ChevronLeft, Shield, Code2, Play, Server, Database, Activity, ArrowLeft } from 'lucide-react';
import { Logo } from '@/components/Logo';

/* --- UI SYSTEM: BRUTALIST / TECHNICAL --- 
   Design Philosophy:
   - No rounded corners.
   - 1px borders.
   - High contrast (Black/White).
   - Single accent color (Electric Blue).
*/

type ButtonVariant = "default" | "outline" | "ghost" | "link" | "accent";
type ButtonSize = "default" | "sm" | "lg" | "icon";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const Button = ({ children, className = "", variant = "default", size = "default", ...props }: ButtonProps) => {
  const baseStyles = "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-ink)] disabled:pointer-events-none disabled:opacity-50 font-mono tracking-wide border";
  
  const variants: Record<ButtonVariant, string> = {
    default: "bg-[var(--color-ink)] text-[var(--color-bg)] border-[var(--color-ink)] hover:bg-[var(--color-ink-soft-contrast)] hover:border-[var(--color-ink-soft-contrast)]",
    outline: "bg-transparent text-[var(--color-ink)] border-[var(--color-border-strong)] hover:border-[var(--color-ink)] hover:bg-[var(--color-ink)] hover:text-[var(--color-bg)]",
    ghost: "bg-transparent text-[var(--color-ink-soft)] border-transparent hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-alt)]",
    link: "bg-transparent text-[var(--color-ink)] border-transparent underline-offset-4 hover:underline p-0 h-auto",
    accent: "bg-[var(--color-accent)] text-[var(--color-ink)] border-[var(--color-accent)] hover:bg-[var(--color-accent-strong)]"
  };

  const sizes: Record<ButtonSize, string> = {
    default: "h-10 px-6 py-2 rounded-none",
    sm: "h-8 px-3 text-xs rounded-none",
    lg: "h-14 px-8 text-base rounded-none",
    icon: "h-10 w-10 p-2 rounded-none",
  };

  return (
    <button className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
};

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
}

const Badge = ({ children, className = "" }: BadgeProps) => (
  <div className={`inline-flex items-center border border-[var(--color-border-strong)] bg-[var(--color-surface-alt)] px-2 py-1 text-[10px] font-mono text-[var(--color-ink-soft)] uppercase tracking-wider rounded-none ${className}`}>
    {children}
  </div>
);

const Separator = ({ className = "" }) => (
  <div className={`shrink-0 bg-[var(--color-border)] h-[1px] w-full ${className}`} />
);

/* --- MAIN LANDING PAGE --- */

export default function AlMurshedLanding() {
  type Theme = 'dark' | 'light' | 'neon' | 'sunset' | 'sand' | 'sky' | 'pink' | 'coffee';
  const themeOptions: Theme[] = ['dark', 'light', 'neon', 'sunset', 'sand', 'sky', 'pink', 'coffee'];
  const [theme, setTheme] = useState<Theme>('dark');

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

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-ink)] font-sans selection:bg-[var(--color-ink)] selection:text-[var(--color-bg)] overflow-x-hidden" dir="rtl">
      {/* Styles */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;700&family=JetBrains+Mono:wght@400;700&display=swap');
        
        body {
          font-family: 'IBM Plex Sans Arabic', sans-serif;
          background-color: var(--color-bg);
        }
        
        .font-mono { 
          font-family: 'JetBrains Mono', monospace; 
        }

        /* Utilities */
        .border-tech { border: 1px solid var(--color-border); }
        .bg-tech { background-color: var(--color-surface); }
      `}</style>

      {/* Navbar */}
      <nav className="border-b border-[var(--color-border)] bg-[var(--color-bg)] sticky top-0 z-50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          
          {/* Brand */}
          <Logo size="sm" compact />

          {/* Nav Links */}
          <div className="hidden md:flex items-center gap-8 text-xs font-medium text-[var(--color-ink-soft)] font-mono uppercase tracking-wider">
{/*             <a href="#" className="hover:text-[var(--color-ink)] transition-colors">Modules</a>
            <a href="#" className="hover:text-[var(--color-ink)] transition-colors">System</a> */}
          </div>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-4">
            <a href="/sign-in" className="text-xs text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] font-mono">Log In</a>
            <Button variant="ghost" size="sm" className="gap-2" onClick={toggleTheme}>
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </Button>
            <a href="/sign-up">
              <Button variant="default" size="sm" className="font-bold">
                Start Now with new account
              </Button>
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative pt-32 pb-32 flex flex-col items-start justify-center px-6 border-b border-[var(--color-border)]">
        <div className="container mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Left Column: Text */}
          <div className="text-right">
            <Badge className="mb-6">v2.0.4 Stable Release</Badge>
            
            <h1 className="text-5xl md:text-7xl font-medium leading-tight mb-8 text-[var(--color-ink)] tracking-tighter">
              هندسة البرمجيات <br/>
              <span className="text-[var(--color-ink-muted)]">بمنظور مختلف.</span>
            </h1>

            <p className="text-lg text-[var(--color-ink-soft)] max-w-xl mb-10 leading-relaxed font-light">
              المرشد ليس مجرد أداة تخطيط. إنه نظام تشغيل متكامل للمطورين العرب، يحول الأفكار المجردة إلى خطط تنفيذية دقيقة باستخدام الذكاء الاصطناعي.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button variant="default" size="lg" className="gap-3">
                <Terminal className="w-4 h-4" />
                تهيئة مشروع جديد
              </Button>
              <Button variant="outline" size="lg" className="gap-3">
                <Play className="w-4 h-4" />
                كيف يعمل النظام؟
              </Button>
            </div>

            <div className="mt-12 flex items-center gap-6 text-xs text-[var(--color-ink-dim)] font-mono">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                SYSTEM OPERATIONAL
              </div>
              <div>|</div>
              <div>LATENCY: 12ms</div>
            </div>
          </div>

          {/* Right Column: Abstract Visual */}
          <div className="relative hidden lg:block">
            <div className="w-full aspect-square border border-[var(--color-border)] bg-[var(--color-surface)] p-1 relative">
              {/* Mockup Interface */}
              <div className="w-full h-full border border-[var(--color-border)] bg-[var(--color-surface-contrast)] p-6 flex flex-col">
                <div className="flex justify-between items-center mb-8 border-b border-[var(--color-border)] pb-4">
                  <div className="font-mono text-xs text-[var(--color-ink-muted)]">ID: PROJ-8821</div>
                  <div className="font-mono text-xs text-[var(--color-accent)]">PROCESSING</div>
                </div>
                <div className="space-y-4 font-mono text-xs">
                  <div className="flex justify-between text-[var(--color-ink-soft)]">
                    <span>&gt; Analyzing Requirements</span>
                    <span className="text-green-500">DONE</span>
                  </div>
                  <div className="flex justify-between text-[var(--color-ink-soft)]">
                    <span>&gt; Generating Schema</span>
                    <span className="text-green-500">DONE</span>
                  </div>
                  <div className="flex justify-between text-[var(--color-ink-soft)]">
                    <span>&gt; Optimizing Roadmap</span>
                    <span className="text-[var(--color-ink)] blink animate-pulse">...</span>
                  </div>
                </div>
                <div className="mt-auto grid grid-cols-3 gap-1 h-24">
                  <div className="bg-[var(--color-surface-alt)] border border-[var(--color-border)]"></div>
                  <div className="bg-[var(--color-surface-alt)] border border-[var(--color-border)]"></div>
                  <div className="bg-[var(--color-accent)] border border-[var(--color-border)]"></div>
                </div>
              </div>
              
              {/* Decorative floating elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 border-t border-r border-[var(--color-border-strong)]"></div>
              <div className="absolute -bottom-4 -left-4 w-24 h-24 border-b border-l border-[var(--color-border-strong)]"></div>
            </div>
          </div>

        </div>
      </header>

      {/* Stats Strip */}
      <section className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="container mx-auto grid grid-cols-2 md:grid-cols-4 divide-x divide-x-reverse divide-[var(--color-border)]">
          {[
            { label: "Active Users", value: "14.2k" },
            { label: "Lines Generated", value: "1.2M" },
            { label: "Uptime", value: "99.99%" },
            { label: "Avg. Rating", value: "4.9/5" },
          ].map((stat, i) => (
            <div key={i} className="py-8 text-center group hover:bg-[var(--color-panel)] transition-colors cursor-default">
              <div className="text-2xl font-medium text-[var(--color-ink)] font-mono mb-1">{stat.value}</div>
              <div className="text-[10px] text-[var(--color-ink-muted)] uppercase tracking-widest font-mono">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Core Modules */}
      <section className="py-24 bg-[var(--color-bg)]">
        <div className="container mx-auto px-6">
          <div className="mb-16 max-w-2xl">
            <h2 className="text-3xl font-medium mb-4 text-[var(--color-ink)]">وحدات النظام الأساسية</h2>
            <p className="text-[var(--color-ink-muted)] font-light">
              تم تصميم كل جزء من "المرشد" ليكون بسيطاً من الخارج، ومعقداً بذكاء من الداخل. نحن نوفر الأدوات، وأنت تبدع.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[var(--color-border)] border border-[var(--color-border)]">
            {/* Module 1 */}
            <div className="bg-[var(--color-surface)] p-10 hover:bg-[var(--color-panel)] transition-colors group relative">
              <div className="absolute top-6 left-6 text-[var(--color-ink-deep)] group-hover:text-[var(--color-ink)] transition-colors">
                <Database className="w-6 h-6" />
              </div>
              <div className="mt-12">
                <h3 className="text-lg font-bold mb-2 text-[var(--color-ink)] font-mono">AI ARCHITECT</h3>
                <p className="text-[var(--color-ink-muted)] text-sm leading-relaxed mb-6">
                  خوارزميات متقدمة لتحليل الأفكار وتوليد خطط برمجية قابلة للتنفيذ الفوري.
                </p>
                <div className="flex items-center gap-2 text-xs text-[var(--color-ink)] font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>LEARN MORE</span> <ArrowLeft className="w-3 h-3" />
                </div>
              </div>
            </div>

            {/* Module 2 */}
            <div className="bg-[var(--color-surface)] p-10 hover:bg-[var(--color-panel)] transition-colors group relative">
              <div className="absolute top-6 left-6 text-[var(--color-ink-deep)] group-hover:text-[var(--color-accent)] transition-colors">
                <Activity className="w-6 h-6" />
              </div>
              <div className="mt-12">
                <h3 className="text-lg font-bold mb-2 text-[var(--color-ink)] font-mono">PROGRESS ENGINE</h3>
                <p className="text-[var(--color-ink-muted)] text-sm leading-relaxed mb-6">
                  نظام تتبع ذكي يحول مهامك إلى نقاط بيانات، ويقيس إنتاجيتك بدقة متناهية.
                </p>
                <div className="flex items-center gap-2 text-xs text-[var(--color-accent)] font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>LEARN MORE</span> <ArrowLeft className="w-3 h-3" />
                </div>
              </div>
            </div>

            {/* Module 3 */}
            <div className="bg-[var(--color-surface)] p-10 hover:bg-[var(--color-panel)] transition-colors group relative">
              <div className="absolute top-6 left-6 text-[var(--color-ink-deep)] group-hover:text-[var(--color-ink)] transition-colors">
                <Shield className="w-6 h-6" />
              </div>
              <div className="mt-12">
                <h3 className="text-lg font-bold mb-2 text-[var(--color-ink)] font-mono">FOCUS SHIELD</h3>
                <p className="text-[var(--color-ink-muted)] text-sm leading-relaxed mb-6">
                  بيئة عمل معزولة رقمياً. تمنع المشتتات وتوفر أدوات التركيز العميق (Deep Work).
                </p>
                <div className="flex items-center gap-2 text-xs text-[var(--color-ink)] font-mono opacity-0 group-hover:opacity-100 transition-opacity">
                  <span>LEARN MORE</span> <ArrowLeft className="w-3 h-3" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlight Section */}
      <section className="py-24 border-y border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="order-2 lg:order-1">
               {/* Abstract Grid Visual */}
               <div className="grid grid-cols-2 gap-4">
                 <div className="aspect-[4/3] border border-[var(--color-border)] bg-[var(--color-bg)] p-6 flex flex-col justify-between hover:border-[var(--color-ink)] transition-colors cursor-crosshair">
                    <div className="w-8 h-8 border border-[var(--color-border-strong)] flex items-center justify-center text-[var(--color-ink-muted)] text-xs">01</div>
                    <div className="font-mono text-xs text-[var(--color-ink-muted)]">FRONTEND_INIT</div>
                 </div>
                 <div className="aspect-[4/3] border border-[var(--color-border)] bg-[var(--color-bg)] p-6 flex flex-col justify-between hover:border-[var(--color-ink)] transition-colors cursor-crosshair">
                    <div className="w-8 h-8 border border-[var(--color-border-strong)] flex items-center justify-center text-[var(--color-ink-muted)] text-xs">02</div>
                    <div className="font-mono text-xs text-[var(--color-ink-muted)]">BACKEND_API</div>
                 </div>
                 <div className="aspect-[4/3] border border-[var(--color-border)] bg-[var(--color-bg)] p-6 flex flex-col justify-between hover:border-[var(--color-ink)] transition-colors cursor-crosshair">
                    <div className="w-8 h-8 border border-[var(--color-border-strong)] flex items-center justify-center text-[var(--color-ink-muted)] text-xs">03</div>
                    <div className="font-mono text-xs text-[var(--color-ink-muted)]">DB_SCHEMA</div>
                 </div>
                 <div className="aspect-[4/3] bg-[var(--color-accent)] p-6 flex flex-col justify-between text-[var(--color-ink)]">
                    <LayoutGrid className="w-6 h-6" />
                    <div className="font-mono text-xs font-bold">DEPLOY</div>
                 </div>
               </div>
            </div>
            
            <div className="order-1 lg:order-2 text-right">
              <Badge className="mb-6 bg-[var(--color-ink)] text-[var(--color-bg)] border-[var(--color-ink)]">ARCHITECTURE</Badge>
              <h2 className="text-4xl font-medium text-[var(--color-ink)] mb-6">
                بنية تحتية <br/>قابلة للتوسع
              </h2>
              <p className="text-[var(--color-ink-soft)] text-lg font-light leading-relaxed mb-8">
                لا نكتفي بإعطائك قائمة مهام. نظام المرشد يقوم ببناء هيكلية المشروع بناءً على أفضل الممارسات العالمية (Clean Architecture)، مما يضمن لك كوداً نظيفاً وقابلاً للصيانة.
              </p>
              
              <ul className="space-y-4 mb-10">
                {[
                  "تكامل تلقائي مع GitHub & GitLab",
                  "دعم كامل لـ CI/CD Pipelines",
                  "توليد وثائق المشروع (Documentation) تلقائياً"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-[var(--color-ink-soft-contrast)] font-light">
                    <div className="w-1.5 h-1.5 bg-[var(--color-accent)]"></div>
                    {item}
                  </li>
                ))}
              </ul>

              <Button variant="outline" className="px-8">
                اقرأ التقرير التقني
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 bg-[var(--color-bg)] text-center">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto">
            <Server className="w-12 h-12 text-[var(--color-ink)] mx-auto mb-8 stroke-1" />
            <h2 className="text-4xl md:text-5xl font-medium text-[var(--color-ink)] mb-6 tracking-tight">
              ابدأ بناء مستقبلك البرمجي.
            </h2>
            <p className="text-[var(--color-ink-muted)] text-lg mb-10 font-light">
              انضم للنخبة. استخدم الأدوات التي يستخدمها كبار المهندسين في الشركات العالمية.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
               <Button variant="default" size="lg" className="w-full sm:w-auto">
                أنشئ حساب
              </Button>
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                تواصل معنا
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[var(--color-border)] bg-[var(--color-bg)] pt-20 pb-10">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20 text-sm">
            <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <Logo size="sm" compact />
            </div>
              <p className="text-[var(--color-ink-muted)]">
                The intelligent operating system for modern software engineering teams.
              </p>
            </div>
            
            <div>
              <h4 className="text-[var(--color-ink)] font-bold font-mono uppercase mb-6 tracking-wider text-xs">Product</h4>
              <ul className="space-y-4 text-[var(--color-ink-muted)]">
                <li><a href="#" className="hover:text-[var(--color-ink)] transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-[var(--color-ink)] transition-colors">Integrations</a></li>
                <li><a href="#" className="hover:text-[var(--color-ink)] transition-colors">Changelog</a></li>
                <li><a href="#" className="hover:text-[var(--color-ink)] transition-colors">Docs</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-[var(--color-ink)] font-bold font-mono uppercase mb-6 tracking-wider text-xs">Company</h4>
              <ul className="space-y-4 text-[var(--color-ink-muted)]">
                <li><a href="#" className="hover:text-[var(--color-ink)] transition-colors">About</a></li>
                <li><a href="#" className="hover:text-[var(--color-ink)] transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-[var(--color-ink)] transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-[var(--color-ink)] transition-colors">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-[var(--color-ink)] font-bold font-mono uppercase mb-6 tracking-wider text-xs">Legal</h4>
              <ul className="space-y-4 text-[var(--color-ink-muted)]">
                <li><a href="#" className="hover:text-[var(--color-ink)] transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-[var(--color-ink)] transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <Separator className="mb-8" />
          
          <div className="flex justify-between items-center text-xs text-[var(--color-ink-dim)] font-mono">
            <div dir="ltr">© 2025 ALMurshed Inc.</div>
            <div className="flex gap-4">
               <span>CAIRO, EGYPT</span>
               <span>•</span>
               <span>SYSTEM STATUS: NORMAL</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
