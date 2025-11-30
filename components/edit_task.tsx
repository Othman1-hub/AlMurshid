'use client';

import React, { useState, useMemo } from 'react';
import { Clock, Zap, AlertCircle, Loader2 } from 'lucide-react';
import { createClient as createSupabaseClient } from '@/utils/supabase/client';

function mapDbStatusToUi(dbStatus: string) {
  const normalized = dbStatus.toLowerCase();
  if (normalized === 'completed') return 'DONE';
  if (normalized === 'in progress' || normalized === 'in_progress') return 'RUNNING';
  return 'WAITING';
}

export default function EditTaskForm({ 
  task, 
  projectId, 
  onCancel,
  onSuccess
}: { 
  task: any, 
  projectId: number, 
  onCancel?: () => void,
  onSuccess?: (updatedTask: any) => void
}) {
  const supabase = useMemo(() => createSupabaseClient(), []);
  
  const [formData, setFormData] = useState({
    name: task.name || '',
    description: task.description || '',
    time_estimate: task.time_estimate || 0,
    xp: task.xp || 0,
    difficulty: (task.difficulty || 'MEDIUM').toUpperCase(),
    status: mapDbStatusToUi(task.status),
    tools: Array.isArray(task.tools) ? task.tools.join(', ') : (task.tools || ''),
    hints: Array.isArray(task.hints) ? task.hints.join(', ') : (task.hints || ''),
  });

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpdate = async () => {
    setIsSaving(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be signed in');

      let dbStatus = 'not_started';
      if (formData.status === 'DONE') {
        dbStatus = 'completed';
      } else if (formData.status === 'RUNNING') {
        dbStatus = 'in progress';
      }

      const dbDifficulty = formData.difficulty.toLowerCase();

      const { data, error: updateError } = await supabase
        .from('tasks')
        .update({
          name: formData.name,
          description: formData.description,
          time_estimate: formData.time_estimate,
          xp: formData.xp,
          difficulty: dbDifficulty,
          status: dbStatus,
          tools: formData.tools || null,
          hints: formData.hints || null,
        })
        .eq('id', Number(task.id))
        .eq('project_id', Number(projectId))
        .select()
        .single();

      if (updateError) throw updateError;

      if (onSuccess) {
        onSuccess(data);
      }

      if (onCancel) {
        onCancel();
      }
      
    } catch (err: any) {
      console.error('Error:', err?.message);
      setError(err?.message || 'Unknown error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    setIsSaving(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be signed in');

      const { error: deleteError } = await supabase
        .from('tasks')
        .delete()
        .eq('id', Number(task.id))
        .eq('project_id', Number(projectId));

      if (deleteError) throw deleteError;

      if (onSuccess) {
        onSuccess(null); // Pass null to indicate deletion
      }

      if (onCancel) {
        onCancel();
      }
      
    } catch (err: any) {
      console.error('Error:', err?.message);
      setError(err?.message || 'Failed to delete task');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 bg-[var(--color-surface-alt)] border-t border-[var(--color-border)] space-y-4">
      {error && (
        <div className="flex items-center gap-2 p-3 bg-[var(--color-danger)]/10 border border-[var(--color-danger)] text-[var(--color-danger)] text-sm rounded">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-[10px] font-mono text-[var(--color-ink-soft)] uppercase tracking-widest block mb-2">Task Name</label>
          <input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] p-2 text-sm text-[var(--color-ink)] focus:border-[var(--color-accent)] outline-none"
          />
        </div>
        <div>
          <label className="text-[10px] font-mono text-[var(--color-ink-soft)] uppercase tracking-widest block mb-2">Difficulty</label>
          <select
            value={formData.difficulty}
            onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
            className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] p-2 text-sm text-[var(--color-ink)] focus:border-[var(--color-accent)] outline-none"
          >
            <option>EASY</option>
            <option>MEDIUM</option>
            <option>HARD</option>
            <option>EXPERT</option>
          </select>
        </div>
      </div>

      <div>
        <label className="text-[10px] font-mono text-[var(--color-ink-soft)] uppercase tracking-widest block mb-2">Description</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] p-2 text-sm text-[var(--color-ink)] focus:border-[var(--color-accent)] outline-none h-20"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="text-[10px] font-mono text-[var(--color-ink-soft)] uppercase tracking-widest block mb-2">Time (Hours)</label>
          <input
            type="number"
            value={formData.time_estimate}
            onChange={(e) => setFormData({ ...formData, time_estimate: Number(e.target.value) })}
            className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] p-2 text-sm text-[var(--color-ink)] focus:border-[var(--color-accent)] outline-none"
          />
        </div>
        <div>
          <label className="text-[10px] font-mono text-[var(--color-ink-soft)] uppercase tracking-widest block mb-2">XP</label>
          <input
            type="number"
            value={formData.xp}
            onChange={(e) => setFormData({ ...formData, xp: Number(e.target.value) })}
            className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] p-2 text-sm text-[var(--color-ink)] focus:border-[var(--color-accent)] outline-none"
          />
        </div>
        <div>
          <label className="text-[10px] font-mono text-[var(--color-ink-soft)] uppercase tracking-widest block mb-2">Status</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] p-2 text-sm text-[var(--color-ink)] focus:border-[var(--color-accent)] outline-none"
          >
            <option>WAITING</option>
            <option>RUNNING</option>
            <option>DONE</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-[10px] font-mono text-[var(--color-ink-soft)] uppercase tracking-widest block mb-2">Tools (CSV)</label>
          <input
            value={formData.tools}
            onChange={(e) => setFormData({ ...formData, tools: e.target.value })}
            className="w-full bg-[var(--color-bg)] border border-[var(--color-border] p-2 text-sm text-[var(--color-ink)] focus:border-[var(--color-accent)] outline-none"
          />
        </div>
        <div>
          <label className="text-[10px] font-mono text-[var(--color-ink-soft)] uppercase tracking-widest block mb-2">Hints (CSV)</label>
          <input
            value={formData.hints}
            onChange={(e) => setFormData({ ...formData, hints: e.target.value })}
            className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] p-2 text-sm text-[var(--color-ink)] focus:border-[var(--color-accent)] outline-none"
          />
        </div>
      </div>

      <div className="flex justify-between gap-3 pt-4 border-t border-[var(--color-border)]">
        <button
          onClick={handleDelete}
          disabled={isSaving}
          className="px-4 py-2 bg-[var(--color-danger)] text-[var(--color-bg)] text-xs font-mono font-bold hover:bg-[var(--color-danger)]/80 disabled:opacity-50"
        >
          DELETE TASK
        </button>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-[var(--color-border)] text-xs font-mono hover:bg-[var(--color-surface)] text-[var(--color-ink)]"
          >
            CANCEL
          </button>
          <button
            onClick={handleUpdate}
            disabled={isSaving}
            className="px-6 py-2 bg-[var(--color-accent)] text-[var(--color-bg)] text-xs font-mono font-bold hover:bg-[var(--color-accent-strong)] disabled:opacity-50 flex items-center gap-2"
          >
            {isSaving && <Loader2 className="w-3 h-3 animate-spin" />}
            UPDATE TASK
          </button>
        </div>
      </div>
    </div>
  );
}