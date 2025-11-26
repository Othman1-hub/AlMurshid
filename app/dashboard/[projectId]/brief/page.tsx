'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Lock, Unlock, Copy, AlertTriangle, Terminal, CheckCircle } from 'lucide-react';
import { getProjectBrief, updateProjectBrief, updateProjectPrompt } from '@/app/actions/brief';

export default function ProjectBriefPage({ params }: any) {
  const { projectId: projectIdStr } = React.use(params) as any;
  const projectId = parseInt(projectIdStr);

  const [briefText, setBriefText] = useState('');
  const [promptText, setPromptText] = useState('');
  const [isBriefLocked, setIsBriefLocked] = useState(true);
  const [isPromptLocked, setIsPromptLocked] = useState(true);
  const [showUnlockConfirm, setShowUnlockConfirm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [savingBrief, setSavingBrief] = useState(false);
  const [savingPrompt, setSavingPrompt] = useState(false);
  const [briefSaved, setBriefSaved] = useState(false);
  const [promptSaved, setPromptSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch brief data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getProjectBrief(projectId);
        if (data) {
          setBriefText(data.breif || '');
          setPromptText(data.prompt || '');
        }
      } catch (err) {
        console.error('Failed to fetch brief:', err);
        setError('Failed to load brief data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId]);

  const handleSaveBrief = async () => {
    setSavingBrief(true);
    setError(null);
    try {
      const result = await updateProjectBrief(projectId, briefText);
      if (result.error) {
        setError(result.error);
      } else {
        setBriefSaved(true);
        setTimeout(() => setBriefSaved(false), 2000);
      }
    } catch (err) {
      console.error('Error saving brief:', err);
      setError('Failed to save brief');
    } finally {
      setSavingBrief(false);
    }
  };

  const handleSavePrompt = async () => {
    setSavingPrompt(true);
    setError(null);
    try {
      const result = await updateProjectPrompt(projectId, promptText);
      if (result.error) {
        setError(result.error);
      } else {
        setPromptSaved(true);
        setTimeout(() => setPromptSaved(false), 2000);
      }
    } catch (err) {
      console.error('Error saving prompt:', err);
      setError('Failed to save prompt');
    } finally {
      setSavingPrompt(false);
    }
  };

  const copyPrompt = () => {
    navigator.clipboard.writeText(promptText);
    alert('SEQUENCE_COPIED_TO_CLIPBOARD');
  };

  if (loading) {
    return (
      <div className="w-full min-h-[calc(100vh-180px)] bg-[var(--color-bg)] text-[var(--color-ink)] flex items-center justify-center">
        <div className="font-mono text-sm text-[var(--color-ink-soft)]">Loading brief data...</div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-[calc(100vh-180px)] bg-[var(--color-bg)] text-[var(--color-ink)] flex flex-col gap-8" dir="rtl">
      {error && (
        <div className="mx-6 mt-6 p-4 border border-red-500/30 bg-red-500/10 text-red-500 text-sm font-mono flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <div className="flex flex-col gap-6 border border-[var(--color-border)] bg-[var(--color-surface)] ">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)] bg-[var(--color-surface-alt)]/60">
          <div className="flex items-center gap-3 text-[var(--color-ink)]">
            <div className="w-9 h-9 border border-[var(--color-border)] bg-[var(--color-bg)] flex items-center justify-center">
              <FileText className="w-4 h-4 text-[var(--color-accent)]" />
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[var(--color-ink-soft)]">Mission Manifest</p>
              <h1 className="text-xl font-semibold font-mono tracking-tight text-[var(--color-ink)]">Project Brief</h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {briefSaved && (
              <div className="flex items-center gap-1.5 text-xs font-mono text-green-500">
                <CheckCircle className="w-3 h-3" /> Saved
              </div>
            )}
            <button
              onClick={() => setIsBriefLocked((prev) => !prev)}
              className={`text-xs font-mono uppercase flex items-center gap-2 px-3 py-2 border border-[var(--color-border)] transition-colors ${
                isBriefLocked
                  ? 'text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] hover:border-[var(--color-ink)]'
                  : 'text-[var(--color-accent)] border-[var(--color-accent)]'
              }`}
            >
              {isBriefLocked ? (
                <>
                  <Lock className="w-3 h-3" /> Read Only
                </>
              ) : (
                <>
                  <Unlock className="w-3 h-3" /> Editing
                </>
              )}
            </button>
            {!isBriefLocked && (
              <button
                onClick={handleSaveBrief}
                disabled={savingBrief}
                className="text-xs font-mono uppercase font-bold px-3 py-2 bg-[var(--color-accent)] text-[var(--color-ink)] hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {savingBrief ? 'SAVING...' : 'SAVE BRIEF'}
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 px-6 pb-6">
          <div className="flex-1 flex flex-col border border-[var(--color-border)] bg-[var(--color-bg)]">
            <div className="h-10 border-b border-[var(--color-border)] bg-[var(--color-surface-alt)]/50 flex items-center justify-between px-4">
              <div className="flex gap-4 text-[10px] font-mono text-[var(--color-ink-soft)] uppercase tracking-[0.2em]">
                <span>DOC_ID: 8821-ALPHA</span>
                <span>SEC: UNCLASSIFIED</span>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={`w-1.5 h-1.5 rounded-full ${
                    isBriefLocked ? 'bg-[var(--color-ink-soft)]' : 'bg-[var(--color-accent)] animate-pulse'
                  }`}
                />
                <span className="text-[9px] font-mono text-[var(--color-ink-soft)] uppercase">
                  {isBriefLocked ? 'Secure' : 'Editing'}
                </span>
              </div>
            </div>

            <textarea
              value={briefText}
              onChange={(e) => setBriefText(e.target.value)}
              disabled={isBriefLocked}
              className={`flex-1 min-h-[50vh] w-full bg-[var(--color-surface)]/70 p-6 font-mono text-sm leading-7 resize-none focus:outline-none transition-colors ${
                isBriefLocked
                  ? 'cursor-default text-[var(--color-ink)]'
                  : 'text-[var(--color-ink)] focus:bg-[var(--color-surface-alt)]/40'
              }`}
              spellCheck={false}
            />
          </div>

          <div className="w-full lg:w-80 border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col">
            <div className="bg-[var(--color-bg)] px-4 py-3 border-b border-[var(--color-border)] flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-[var(--color-ink-soft)]">
                <Terminal className="w-4 h-4 text-[var(--color-accent)]" />
                <h2 className="text-[11px] font-bold font-mono uppercase tracking-[0.25em]">generation_seed.json</h2>
              </div>
              <div className="flex gap-2 flex-wrap">
                {promptSaved && (
                  <div className="flex items-center gap-1 text-[10px] font-mono text-green-500">
                    <CheckCircle className="w-3 h-3" /> Saved
                  </div>
                )}
                <button
                  onClick={copyPrompt}
                  className="text-[10px] font-mono font-bold uppercase text-[var(--color-accent)] hover:text-[var(--color-ink)] flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" /> Copy
                </button>
                {isPromptLocked ? (
                  <button
                    onClick={() => setShowUnlockConfirm(true)}
                    className="text-[10px] font-mono uppercase text-[var(--color-ink-soft)] hover:text-[var(--color-accent)] flex items-center gap-1"
                  >
                    <Lock className="w-3 h-3" /> Locked
                  </button>
                ) : (
                  <button
                    onClick={() => setIsPromptLocked(true)}
                    className="text-[10px] font-mono uppercase text-[var(--color-accent)] flex items-center gap-1"
                  >
                    <Unlock className="w-3 h-3" /> Open
                  </button>
                )}
                {!isPromptLocked && (
                  <button
                    onClick={handleSavePrompt}
                    disabled={savingPrompt}
                    className="text-[10px] font-mono uppercase font-bold px-2 py-1 bg-[var(--color-accent)] text-[var(--color-ink)] hover:opacity-90 disabled:opacity-50 transition-opacity"
                  >
                    {savingPrompt ? 'SAVING...' : 'SAVE'}
                  </button>
                )}
              </div>
            </div>
            <textarea
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              disabled={isPromptLocked}
              className={`w-full min-h-[180px] bg-[var(--color-surface)] border-0 p-4 font-mono text-xs leading-relaxed resize-none focus:outline-none transition-all ${
                isPromptLocked ? 'opacity-60 cursor-not-allowed text-[var(--color-ink-soft)]' : 'text-[var(--color-ink)] focus:bg-[var(--color-surface-alt)]/40'
              }`}
            />
          </div>
        </div>
      </div>

      {showUnlockConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[var(--color-bg)] border border-[var(--color-accent)] p-6 max-w-sm w-full shadow-[0_0_50px_rgba(0,0,0,0.5)] text-center">
            <AlertTriangle className="w-10 h-10 text-[var(--color-accent)] mx-auto mb-3" />
            <h3 className="text-lg font-bold text-[var(--color-ink)] mb-2">SECURITY WARNING</h3>
            <p className="text-xs text-[var(--color-ink-soft)] font-mono mb-6 leading-relaxed">
              Modifying the AI seed prompt may result in unstable generation outputs. Proceed?
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowUnlockConfirm(false)}
                className="px-4 py-2 border border-[var(--color-border)] text-xs font-mono hover:bg-[var(--color-surface-alt)] text-[var(--color-ink)]"
              >
                ABORT
              </button>
              <button
                onClick={() => {
                  setIsPromptLocked(false);
                  setShowUnlockConfirm(false);
                }}
                className="px-4 py-2 bg-[var(--color-accent)] text-[var(--color-ink)] text-xs font-mono font-bold hover:opacity-90"
              >
                OVERRIDE LOCK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
