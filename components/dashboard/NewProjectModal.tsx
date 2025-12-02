"use client";

import React from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle } from "lucide-react";

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  formAction: (payload: FormData) => void;
  formError?: string;
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="px-6 py-3 bg-[var(--color-accent)] text-white border border-[var(--color-accent)] text-xs font-mono font-bold hover:bg-[var(--color-accent-strong)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-[0_0_20px_-5px_var(--color-accent)]"
    >
      {pending ? "EXECUTING..." : "EXECUTE_CREATE"}
    </button>
  );
}

export function NewProjectModal({
  isOpen,
  onClose,
  formAction,
  formError,
}: NewProjectModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--color-bg)]/90 backdrop-blur-sm"
      dir="rtl"
    >
      <div className="w-full max-w-2xl bg-[var(--color-bg)] border border-[var(--color-accent)] shadow-[0_0_50px_-10px_rgba(0,68,255,0.2)] animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)] bg-[var(--color-surface-alt)]">
          <div className="flex items-center gap-2 font-mono text-sm font-bold text-[var(--color-accent)]">
            <AlertCircle className="w-4 h-4" />
            <span>PROJECT_INITIALIZER.EXE</span>
          </div>
          <button
            onClick={onClose}
            className="hover:text-[var(--color-accent)] font-mono"
          >
            [ESC]
          </button>
        </div>

        {/* Modal Body */}
        <form action={formAction} className="p-8 space-y-6">
          <div className="space-y-2">
            <label className=" text-xs font-mono uppercase tracking-widest text-[var(--color-ink-soft)] flex items-center gap-2">
              <span className="w-1 h-1 bg-[var(--color-accent)]"></span>{" "}
              Project Designation (Name)
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

            <div className="space-y-2">
              <label className="block text-xs font-mono uppercase tracking-widest text-[var(--color-ink-soft)] flex items-center gap-2">
                <span className="w-1 h-1 bg-[var(--color-accent)]"></span>
                Create Collaboration Password (Optional)
              </label>
              <input
                name="collaboration_password"
                type="password"
                className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] p-3 font-mono text-sm focus:outline-none focus:border-[var(--color-accent)] placeholder:text-[var(--color-ink-soft)]/30 transition-colors"
                placeholder="Leave blank to keep project private"
              />
              <p className="text-[10px] text-[var(--color-ink-soft)] font-mono">
                Anyone with the ProjectName-ID and this password can join as a teammate.
              </p>
            </div>
          </div>

          {formError && (
            <div className="p-3 bg-red-500/10 border border-red-500 text-red-500 text-xs font-mono">
              ERROR: {formError}
            </div>
          )}

          <div className="pt-6 flex justify-end gap-4 border-t border-[var(--color-border)] mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 border border-[var(--color-border)] text-xs font-mono font-bold hover:bg-[var(--color-surface-alt)] text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] transition-colors"
            >
              ABORT_SEQUENCE
            </button>
            <SubmitButton />
          </div>
        </form>
      </div>
    </div>
  );
}
