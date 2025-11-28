import Link from "next/link";
import { Cpu } from "lucide-react";

type LogoSize = "sm" | "md";

type LogoProps = {
  href?: string;
  subtitle?: string;
  compact?: boolean;
  size?: LogoSize;
  className?: string;
};

export function Logo({
  href = "/",
  subtitle,
  compact = false,
  size = "md",
  className = "",
}: LogoProps) {
  const sizeClass = size === "sm" ? "w-8 h-8" : "w-10 h-10";
  const innerPad = size === "sm" ? "inset-[6px]" : "inset-[7px]";

  const content = (
    <div className={`group inline-flex items-center gap-3 ${className}`}>
      <div className="relative">
        <div className="absolute inset-0 rounded-none bg-[conic-gradient(at_30%_30%,var(--color-accent),var(--color-gold),var(--color-ink),var(--color-accent))] opacity-50 blur-sm transition duration-300 group-hover:opacity-80" />
        <div
          className={`relative ${sizeClass} bg-[var(--color-ink)] text-[var(--color-bg)] flex items-center justify-center`}
        >
          <div
            className={`absolute ${innerPad} bg-[var(--color-bg)] border border-[var(--color-border)] flex items-center justify-center shadow-[0_0_0_1px_var(--color-bg)]`}
          >
            <Cpu className={size === "sm" ? "w-3 h-3" : "w-4 h-4"} />
          </div>
        </div>
      </div>

      {!compact && (
        <div className="leading-tight">
          <div className="text-lg font-bold font-mono tracking-tight text-[var(--color-ink)] flex items-center gap-1">
            <span>ALMurshed</span>
            <span className="text-[var(--color-accent)]">_</span>
          </div>
          {subtitle ? (
            <div className="text-[10px] text-[var(--color-ink-soft)] font-mono uppercase tracking-widest">
              {subtitle}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );

  return href ? (
    <Link href={href} className="inline-flex items-center gap-3">
      {content}
    </Link>
  ) : (
    content
  );
}
