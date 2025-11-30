'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { createClient as createSupabaseClient } from '@/utils/supabase/client';
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  Clock,
  FileText,
  Layers,
  Link as LinkIcon,
  Plus,
  PlusCircle,
  X,
  Zap,
} from 'lucide-react';
import EditTaskForm from './edit_task';

// --- DATABASE CONFIGURATION ---
// Use real Supabase client from '@/utils/supabase/client'

import type {
  Phase as DbPhase,
  Task as DbTask,
  TaskDependency,
  TaskDifficulty,
  TaskStatus as DbTaskStatus,
} from '@/lib/types/task';

// --- TYPES (UI) ---

type UiTaskStatus = 'LOCKED' | 'WAITING' | 'RUNNING' | 'DONE';
type UiDifficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';

interface UiTask {
  id: number;
  name: string;
  description: string;
  difficulty: UiDifficulty;
  time_estimate: number;
  xp: number;
  baseStatus: UiTaskStatus;
  rawStatus: string; 
  tools: string[];
  hints: string[];
  phase_id: number | null;
  created_at?: string;
  displayOrder: number;
}

interface PhaseWithTasks extends DbPhase {
  pr_id: number;
  tasks: UiTask[];
}

interface TaskRoadmapProps {
  projectId: number;
  tasks: DbTask[];
  phases: DbPhase[];
  dependencies: TaskDependency[];
}

// --- HELPERS ---

// Map Database Enum -> UI
const mapDbStatusToUi = (status: string): UiTaskStatus => {
  // DB: 'completed', 'in progress', 'not_started'
  if (status === 'completed') return 'DONE'; 
  if (status === 'in progress') return 'RUNNING'; // Matches "in progress" (space)
  if (status === 'in_progress') return 'RUNNING'; // Fallback just in case
  return 'WAITING'; // Covers 'not_started'
};

const mapDbDifficultyToUi = (difficulty: string): UiDifficulty => {
  const diff = difficulty?.toLowerCase();
  switch (diff) {
    case 'easy': return 'EASY';
    case 'medium': return 'MEDIUM';
    case 'hard': return 'HARD';
    case 'expert': return 'EXPERT';
    default: return 'MEDIUM';
  }
};

const mapUiDifficultyToDb = (difficulty: UiDifficulty): string => {
  switch (difficulty) {
    case 'EASY': return 'easy';
    case 'MEDIUM': return 'medium';
    case 'HARD': return 'hard';
    case 'EXPERT': return 'expert';
    default: return 'medium';
  }
};

const parseListField = (value?: string | null): string[] => {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.map(String);
  } catch {
    /* ignore parse errors */
  }
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

const buildPhaseState = (
  tasks: DbTask[],
  phases: DbPhase[],
  _dependencies: TaskDependency[],
): PhaseWithTasks[] => {
  const sortedPhases = [...phases].sort((a, b) => a.order_index - b.order_index);
  
  // Sort tasks by ID to maintain stable order
  const tasksByCreated = [...tasks].sort((a, b) => a.id - b.id);

  const displayOrderMap = new Map<number, number>();
  tasksByCreated.forEach((task, index) => displayOrderMap.set(task.id, index + 1));

  const toUiTask = (task: DbTask): UiTask => ({
    id: task.id,
    name: task.name,
    description: task.description || '',
    difficulty: mapDbDifficultyToUi(task.difficulty),
    time_estimate: task.time_estimate,
    xp: Number(task.xp) || 0,
    baseStatus: mapDbStatusToUi(task.status),
    rawStatus: task.status,
    tools: parseListField(task.tools),
    hints: parseListField(task.hints),
    phase_id: task.phase_id ?? null,
    created_at: task.created_at,
    displayOrder: displayOrderMap.get(task.id) || task.id,
  });

  const phaseTasksMap = new Map<number, UiTask[]>();
  tasks.forEach((task) => {
    const phaseId = task.phase_id ?? -1;
    const arr = phaseTasksMap.get(phaseId) || [];
    arr.push(toUiTask(task));
    phaseTasksMap.set(phaseId, arr);
  });

  const phasesWithTasks: PhaseWithTasks[] = sortedPhases.map((phase, idx) => ({
    ...phase,
    pr_id: idx + 1,
    tasks: (phaseTasksMap.get(phase.id) || []).sort((a, b) => a.displayOrder - b.displayOrder),
  }));

  const unassignedTasks = phaseTasksMap.get(-1) || [];
  if (unassignedTasks.length > 0) {
    phasesWithTasks.push({
      id: -1,
      project_id: phases[0]?.project_id || tasks[0]?.project_id || 0,
      name: 'Unassigned Tasks',
      description: 'Tasks without a phase',
      order_index: phasesWithTasks.length + 1,
      pr_id: phasesWithTasks.length + 1,
      tasks: unassignedTasks.sort((a, b) => a.displayOrder - b.displayOrder),
    });
  }

  return phasesWithTasks;
};

const DifficultyBadge = ({
  level,
  selected,
  onClick,
}: {
  level: UiDifficulty;
  selected?: boolean;
  onClick?: () => void;
}) => {
  const colors = {
    EASY: 'text-[var(--color-success)] border-[var(--color-success)]',
    MEDIUM: 'text-[var(--color-gold)] border-[var(--color-gold)]',
    HARD: 'text-orange-500 border-orange-500',
    EXPERT: 'text-[var(--color-danger)] border-[var(--color-danger)]',
  };
  const bgColors = {
    EASY: 'bg-[var(--color-success)]/10',
    MEDIUM: 'bg-[var(--color-gold)]/10',
    HARD: 'bg-orange-500/10',
    EXPERT: 'bg-[var(--color-danger)]/10',
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-[9px] font-mono border px-2 py-1 uppercase tracking-wider transition-all rounded-sm ${
        colors[level]
      } ${
        selected
          ? `${bgColors[level]} ring-1 ring-offset-1 ring-offset-[var(--color-bg)] ring-current`
          : 'hover:bg-[var(--color-surface)]'
      }`}
    >
      {level}
    </button>
  );
};

export default function TaskRoadmap({ projectId, tasks, phases, dependencies }: TaskRoadmapProps) {
  const supabase = useMemo(() => createSupabaseClient(), []);
  
  // Initialize state with props
  const [phaseState, setPhaseState] = useState<PhaseWithTasks[]>(() =>
    buildPhaseState(tasks, phases, dependencies),
  );
  
  const [dependencyState, setDependencyState] = useState<TaskDependency[]>(dependencies || []);
  const [expandedTask, setExpandedTask] = useState<number | null>(null);

  const [toast, setToast] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  // Task Creation Modal
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [targetPhaseId, setTargetPhaseId] = useState<number | null>(null);
  const [newTaskData, setNewTaskData] = useState({
    name: '',
    description: '',
    difficulty: 'EASY' as UiDifficulty,
    time_estimate: '',
    xp: 100,
    tools: '',
    hints: '',
    predecessors: [] as number[],
  });

  // Phase Creation Modal
  const [isPhaseModalOpen, setIsPhaseModalOpen] = useState(false);
  const [editingPhaseId, setEditingPhaseId] = useState<number | null>(null);
  const [phaseFormData, setPhaseFormData] = useState({ name: '', description: '' });

  // Update local state when props change
  useEffect(() => {
    setPhaseState(buildPhaseState(tasks, phases, dependencies));
    setDependencyState(dependencies || []);
  }, [tasks, phases, dependencies]);

  // Toast cleanup
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  // --- DERIVED STATE ---

  const tasksById = useMemo(() => {
    const map = new Map<number, UiTask>();
    phaseState.forEach((phase) => phase.tasks.forEach((task) => map.set(task.id, task)));
    return map;
  }, [phaseState]);

  const allUiTasks = useMemo(() => phaseState.flatMap(p => p.tasks), [phaseState]);

  const hasIncompleteDependencies = (taskId: number) => {
    const predecessors = dependencyState
      .filter((dep) => dep.task_id === taskId)
      .map((dep) => dep.predecessor_task_id);
    
    return predecessors.some(
      (predId) => {
        const predTask = tasksById.get(predId);
        // Ensure we check for 'completed'
        return predTask && predTask.rawStatus !== 'completed';
      }
    );
  };

  const getPhaseStatus = (phase: PhaseWithTasks, isPrevPhaseDone: boolean): UiTaskStatus => {
    if (!isPrevPhaseDone) return 'LOCKED';
    if (phase.tasks.length === 0) return 'WAITING';
    
    // Check against 'completed'
    const allDone = phase.tasks.every((t) => t.rawStatus === 'completed');
    if (allDone) return 'DONE';
    
    const anyRunning = phase.tasks.some((t) => t.rawStatus === 'in progress' || t.rawStatus === 'in_progress');
    if (anyRunning) return 'RUNNING';
    
    return 'WAITING';
  };

  const totalTasks = useMemo(
    () => phaseState.reduce((acc, phase) => acc + phase.tasks.length, 0),
    [phaseState],
  );
  
  const completedTasks = useMemo(
    () =>
      phaseState.reduce(
        (acc, phase) => acc + phase.tasks.filter((t) => t.rawStatus === 'completed').length,
        0,
      ),
    [phaseState],
  );

  // --- ACTIONS ---

  const showError = (message: string) => setToast({ type: 'error', message });
  const showSuccess = (message: string) => setToast({ type: 'success', message });

  const toggleExpand = (id: number) => setExpandedTask((prev) => (prev === id ? null : id));

  // --- MODAL HANDLERS ---

  const openPhaseModal = (phase?: PhaseWithTasks) => {
    if (phase) {
      setEditingPhaseId(phase.id);
      setPhaseFormData({ name: phase.name, description: phase.description || '' });
    } else {
      setEditingPhaseId(null);
      setPhaseFormData({ name: '', description: '' });
    }
    setIsPhaseModalOpen(true);
  };

  const handlePhaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      showError('Please sign in to save changes.');
      return;
    }

    if (editingPhaseId) {
      const { data, error } = await supabase
        .from('phases')
        .update({
          name: phaseFormData.name,
          description: phaseFormData.description,
        })
        .eq('id', editingPhaseId)
        .eq('project_id', projectId)
        .select()
        .single();

      if (error) {
        showError(error.message);
      } else if (data) {
        setPhaseState((prev) => 
          prev.map((p) => (p.id === editingPhaseId ? { ...p, ...data } : p))
        );
        showSuccess('Phase updated');
      }
    } else {
      const nextOrder = phaseState.length + 1;
      const { data, error } = await supabase
        .from('phases')
        .insert({
          project_id: projectId,
          name: phaseFormData.name || 'New Phase',
          description: phaseFormData.description || 'No description provided.',
          order_index: nextOrder,
        })
        .select()
        .single();

      if (error) {
        showError(error.message);
      } else if (data) {
        setPhaseState((prev) => [...prev, { ...data, pr_id: prev.length + 1, tasks: [] }]);
        showSuccess('Phase created');
      }
    }
    setIsPhaseModalOpen(false);
  };

  const openAddTaskModal = (phaseId: number) => {
    setTargetPhaseId(phaseId);
    setNewTaskData({
      name: '',
      description: '',
      difficulty: 'EASY',
      time_estimate: '',
      xp: 100,
      tools: '',
      hints: '',
      predecessors: [],
    });
    setIsTaskModalOpen(true);
  };

  const togglePredecessor = (id: number) => {
    setNewTaskData((prev) => ({
      ...prev,
      predecessors: prev.predecessors.includes(id)
        ? prev.predecessors.filter((p) => p !== id)
        : [...prev.predecessors, id],
    }));
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (targetPhaseId === null) return;

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      showError('Please sign in to add tasks.');
      return;
    }

    const phaseIdForDb = targetPhaseId > 0 ? targetPhaseId : null;
    
    const dbTools = newTaskData.tools
      ? JSON.stringify(newTaskData.tools.split(',').map((t) => t.trim()).filter(Boolean))
      : null;
    const dbHints = newTaskData.hints
      ? JSON.stringify(newTaskData.hints.split(',').map((t) => t.trim()).filter(Boolean))
      : null;

    // 1. Insert Task with 'not_started' as default
    const { data: createdTask, error } = await supabase
      .from('tasks')
      .insert({
        project_id: projectId,
        name: newTaskData.name || 'New Task',
        description: newTaskData.description || 'No description provided.',
        xp: Number(newTaskData.xp) || 0,
        difficulty: mapUiDifficultyToDb(newTaskData.difficulty),
        time_estimate: parseFloat(newTaskData.time_estimate) || 1,
        tools: dbTools,
        hints: dbHints,
        status: 'not_started', // Explicitly use valid enum (Waiting)
        phase_id: phaseIdForDb,
      })
      .select()
      .single();

    if (error || !createdTask) {
      showError(error?.message || 'Failed to create task');
      return;
    }

    // 2. Insert Dependencies
    if (newTaskData.predecessors.length > 0) {
      const depsToInsert = newTaskData.predecessors.map(predId => ({
        task_id: createdTask.id,
        predecessor_task_id: predId,
      }));

      const { data: createdDeps, error: depError } = await supabase
        .from('task_dependencies')
        .insert(depsToInsert)
        .select();
        
      if (depError) {
        showError(depError.message);
      } else if (createdDeps) {
        setDependencyState((prev) => [...prev, ...(createdDeps as TaskDependency[])]);
      }
    }

    // 3. Update Local State
    setPhaseState((prev) => {
      const newPhaseState = [...prev];
      const targetIndex = newPhaseState.findIndex((p) => p.id === targetPhaseId);
      
      if (targetIndex >= 0) {
        const phase = newPhaseState[targetIndex];
        const displayOrder = phase.tasks.length + 1;
        
        const uiTask: UiTask = {
          id: createdTask.id,
          name: createdTask.name,
          description: createdTask.description || '',
          difficulty: mapDbDifficultyToUi(createdTask.difficulty),
          time_estimate: createdTask.time_estimate,
          xp: Number(createdTask.xp) || 0,
          baseStatus: mapDbStatusToUi(createdTask.status),
          rawStatus: createdTask.status,
          tools: parseListField(createdTask.tools),
          hints: parseListField(createdTask.hints),
          phase_id: createdTask.phase_id ?? null,
          created_at: createdTask.created_at,
          displayOrder,
          // @ts-ignore - for UI optimism only
          predecessors: newTaskData.predecessors, 
        };
        
        newPhaseState[targetIndex] = { ...phase, tasks: [...phase.tasks, uiTask] };
      }
      return newPhaseState;
    });

    setIsTaskModalOpen(false);
    showSuccess('Task created');
  };

  const handleDeletePhase = async (phaseId: number) => {
    if (!confirm('Are you sure you want to delete this phase? All tasks in this phase will also be deleted.')) return;

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      showError('Please sign in to delete phases.');
      return;
    }

    try {
      // 1. Delete all tasks in the phase
      const { error: tasksError } = await supabase
        .from('tasks')
        .delete()
        .eq('phase_id', phaseId)
        .eq('project_id', projectId);

      if (tasksError) throw tasksError;

      // 2. Delete the phase
      const { error: phaseError } = await supabase
        .from('phases')
        .delete()
        .eq('id', phaseId)
        .eq('project_id', projectId);

      if (phaseError) throw phaseError;

      // 3. Update local state
      setPhaseState((prev) => prev.filter((p) => p.id !== phaseId));
      setIsPhaseModalOpen(false);
      showSuccess('Phase and all its tasks deleted');
    } catch (err: any) {
      showError(err?.message || 'Failed to delete phase');
    }
  };

  return (
    <div className="w-full bg-[var(--color-bg)] text-[var(--color-ink)] p-8 flex flex-col gap-8" dir="ltr">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;700&family=JetBrains+Mono:wght@400;700&display=swap');
        :root {
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
          --color-danger: #FF0033;
        }
        body { font-family: 'IBM Plex Sans Arabic', sans-serif; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        .roadmap-spine { position: absolute; left: 50%; top: 0; bottom: 0; width: 2px; background: linear-gradient(to bottom, var(--color-success), var(--color-accent), var(--color-border)); transform: translateX(-50%); z-index: 0; }
        input.edit-input, textarea.edit-input { background: transparent; border: none; color: inherit; width: 100%; outline: none; }
        input.edit-input:focus, textarea.edit-input:focus { background: var(--color-surface-alt); }
        .modal-scroll::-webkit-scrollbar { width: 4px; }
        .modal-scroll::-webkit-scrollbar-track { background: var(--color-surface); }
        .modal-scroll::-webkit-scrollbar-thumb { background: var(--color-border-strong); }
      `}</style>

      {toast && (
        <div
          className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 p-3 border text-sm bg-[var(--color-bg)] shadow-xl animate-in slide-in-from-bottom-2 ${
            toast.type === 'error'
              ? 'border-[var(--color-danger)] text-[var(--color-danger)]'
              : 'border-[var(--color-success)] text-[var(--color-success)]'
          }`}
        >
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* HEADER */}
      <div className="flex items-center justify-between pb-6 border-b border-[var(--color-border)]" dir="rtl">
        <div className="flex items-center gap-2">
          <div className="w-1 h-6 bg-[var(--color-accent)]"></div>
          <h2 className="text-xl font-bold font-mono uppercase tracking-tight text-[var(--color-ink)]">Operational Roadmap</h2>
        </div>
        <div className="text-xs font-mono text-[var(--color-ink-soft)] uppercase tracking-widest bg-[var(--color-surface)] px-3 py-1 border border-[var(--color-border)]">
          SEQUENCE: {totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}% COMPLETE
        </div>
      </div>

      {/* ROADMAP VISUALIZATION */}
      <div className="relative w-full max-w-6xl mx-auto py-10">
        <div className="roadmap-spine"></div>

        {phaseState.map((phase, phaseIndex) => {
          const prevPhaseTasks = phaseIndex > 0 ? phaseState[phaseIndex - 1].tasks : [];
          // Ensure we check against 'completed', not 'done'
          const prevPhaseDone = phaseIndex === 0 || (prevPhaseTasks.length > 0 && prevPhaseTasks.every(t => t.rawStatus === 'completed'));
          const phaseStatus = getPhaseStatus(phase, prevPhaseDone);
          const isPhaseLocked = phaseStatus === 'LOCKED';

          return (
            <div key={phase.id} className="relative mb-32 w-full">
              
              {/* PHASE NODE (Center Interaction Point) */}
              <div className="absolute left-1/2 top-0 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center z-20 group/node">
                <button
                  onClick={() => openAddTaskModal(phase.id)}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-[0_0_20px_-5px_rgba(0,0,0,0.5)] cursor-pointer relative border-2 ${
                    isPhaseLocked
                      ? 'bg-[var(--color-surface)] border-[var(--color-border)] cursor-not-allowed opacity-50'
                      : 'bg-[var(--color-bg)] border-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-white'
                  }`}
                  title="Add Task to Phase"
                  disabled={isPhaseLocked}
                >
                  <Layers className={`w-6 h-6 ${isPhaseLocked ? 'text-[var(--color-ink-soft)]' : 'text-[var(--color-accent)] group-hover/node:text-white'}`} />
                  <div className="absolute -bottom-1 -right-1 bg-[var(--color-bg)] rounded-full border border-[var(--color-border)]">
                    <PlusCircle className="w-5 h-5 text-[var(--color-success)] fill-[var(--color-bg)]" />
                  </div>
                </button>

                <button
                  onClick={() => openPhaseModal(phase)}
                  className={`mt-3 px-4 py-1.5 text-[10px] font-mono font-bold uppercase tracking-widest border min-w-[150px] text-center transition-colors hover:bg-[var(--color-surface-alt)] ${
                    isPhaseLocked
                      ? 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-ink-soft)]'
                      : 'bg-[var(--color-bg)] border-[var(--color-accent)] text-[var(--color-accent)]'
                  }`}
                >
                  <div className="text-[8px] text-[var(--color-ink-soft)] mb-0.5 pointer-events-none">PHASE-{String(phase.pr_id).padStart(2, '0')}</div>
                  <div className="truncate max-w-[200px]">{phase.name}</div>
                </button>
              </div>

              {/* TASKS GRID */}
              <div className="grid grid-cols-2 gap-x-32 gap-y-12 pt-16 relative">
                {phase.tasks.map((task, taskIndex) => {
                  const isLeft = taskIndex % 2 === 0;
                  const lockedByDeps = hasIncompleteDependencies(task.id);
                  const displayStatus = lockedByDeps ? 'LOCKED' : (task.baseStatus || 'WAITING');
                  const isExpanded = expandedTask === task.id;

                  return (
                    <div key={task.id} className={`relative flex flex-col ${isLeft ? 'items-end text-right' : 'items-start text-left col-start-2'}`}>
                      {/* Line to Spine */}
                      <div className={`absolute top-8 h-[1px] bg-[var(--color-border)] -z-10 ${isLeft ? 'right-[-8rem] w-[8rem]' : 'left-[-8rem] w-[8rem]'}`}>
                        <div className={`absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-[var(--color-border)] ${isLeft ? 'right-0' : 'left-0'}`}></div>
                      </div>

                      {/* TASK CARD */}
                      <div className="w-full max-w-md border transition-all duration-300 group relative bg-[var(--color-surface)] border-[var(--color-border)] hover:border-[var(--color-accent)]">
                        {/* Status Bar */}
                        <div
                          className={`h-1 w-full ${
                            displayStatus === 'DONE'
                              ? 'bg-[var(--color-success)]'
                              : displayStatus === 'RUNNING'
                                ? 'bg-[var(--color-accent)]'
                                : 'bg-[var(--color-border)]'
                          }`}
                        ></div>

                        {/* Card Content */}
                        <div className="p-5 cursor-pointer flex flex-col gap-3" onClick={() => toggleExpand(task.id)}>
                          <div className={`flex items-center justify-between ${isLeft ? 'flex-row-reverse' : ''}`}>
                            <div className="flex items-center gap-2">
                              {/* Status Dot */}
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  displayStatus === 'DONE'
                                    ? 'bg-[var(--color-success)]'
                                    : displayStatus === 'RUNNING'
                                      ? 'bg-[var(--color-accent)]'
                                      : 'bg-[var(--color-ink-soft)]'
                                }`}
                              ></div>
                              <span className="font-mono text-[10px] text-[var(--color-ink-soft)]">TSK-{String(task.displayOrder).padStart(3, '0')}</span>
                            </div>
                            <DifficultyBadge level={task.difficulty} />
                          </div>

                          <div>
                            {/* Read-Only Title (Click to expand) */}
                            <div
                              className={`text-lg font-bold font-mono leading-snug text-[var(--color-ink)] ${
                                displayStatus === 'DONE' ? 'line-through text-[var(--color-ink-soft)]' : ''
                              } ${isLeft ? 'text-right' : 'text-left'}`}
                            >
                              {task.name}
                            </div>
                            <div className={`flex items-center gap-4 mt-2 text-[10px] font-mono text-[var(--color-ink-soft)] ${isLeft ? 'justify-end' : 'justify-start'}`}>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {task.time_estimate}h
                              </span>
                              <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                            </div>
                          </div>
                        </div>

                        {/* EXPANDED DETAILS: EDIT FORM */}
                        {isExpanded && (
                          <div className="animate-in slide-in-from-top-2 duration-200">
                             <EditTaskForm 
                               task={{ ...task, status: task.rawStatus }} 
                               projectId={projectId}
                               onSuccess={(updatedTask) => {
                                 if (updatedTask === null) {
                                   // Task was deleted - remove it from state
                                   setPhaseState((prev) =>
                                     prev.map((phase) => ({
                                       ...phase,
                                       tasks: phase.tasks.filter((t) => t.id !== task.id),
                                     }))
                                   );
                                 } else {
                                   // Task was updated
                                   setPhaseState((prev) =>
                                     prev.map((phase) => ({
                                       ...phase,
                                       tasks: phase.tasks.map((t) =>
                                         t.id === task.id
                                           ? {
                                               ...t,
                                               name: updatedTask.name,
                                               description: updatedTask.description,
                                               difficulty: mapDbDifficultyToUi(updatedTask.difficulty),
                                               time_estimate: updatedTask.time_estimate,
                                               xp: Number(updatedTask.xp) || 0,
                                               baseStatus: mapDbStatusToUi(updatedTask.status),
                                               rawStatus: updatedTask.status,
                                               tools: parseListField(updatedTask.tools),
                                               hints: parseListField(updatedTask.hints),
                                             }
                                           : t
                                       ),
                                     }))
                                   );
                                 }
                               }}
                               onCancel={() => toggleExpand(task.id)} 
                             />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* BOTTOM: ADD PHASE */}
        <div className="absolute bottom-[-100px] left-1/2 transform -translate-x-1/2 flex flex-col items-center z-20 pb-20">
          <div className="w-px h-16 bg-[var(--color-border)]"></div>
          <button
            onClick={() => openPhaseModal()}
            className="group flex items-center gap-2 px-6 py-3 bg-[var(--color-surface)] border border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-white transition-all shadow-[0_0_30px_-10px_var(--color-accent)]"
          >
            <Plus className="w-5 h-5" />
            <span className="font-mono text-xs font-bold uppercase tracking-widest">ADD PHASE</span>
          </button>
        </div>
      </div>

      {/* PHASE MODAL */}
      {isPhaseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" dir="rtl">
          <div className="w-full max-w-lg bg-[var(--color-bg)] border border-[var(--color-accent)] shadow-[0_0_100px_-20px_rgba(0,68,255,0.3)] animate-in fade-in zoom-in-95 duration-200">
            <div className="h-12 bg-[var(--color-surface-alt)] border-b border-[var(--color-border)] flex items-center justify-between px-6">
              <div className="flex items-center gap-2 text-[var(--color-accent)] font-mono text-sm font-bold uppercase tracking-widest">
                <Layers className="w-4 h-4" /> {editingPhaseId ? 'Configure Phase' : 'New Phase Protocol'}
              </div>
              <button onClick={() => setIsPhaseModalOpen(false)} className="hover:text-[var(--color-accent)]">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handlePhaseSubmit} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-mono text-[var(--color-ink-soft)] uppercase tracking-widest">Phase Name</label>
                <input
                  value={phaseFormData.name}
                  onChange={(e) => setPhaseFormData({ ...phaseFormData, name: e.target.value })}
                  className="w-full bg-[var(--color-surface-alt)] border border-[var(--color-border)] p-3 text-sm font-bold focus:border-[var(--color-accent)] focus:outline-none text-[var(--color-ink)]"
                  placeholder="PHASE_ALPHA..."
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-mono text-[var(--color-ink-soft)] uppercase tracking-widest">Description</label>
                <textarea
                  value={phaseFormData.description}
                  onChange={(e) => setPhaseFormData({ ...phaseFormData, description: e.target.value })}
                  className="w-full bg-[var(--color-surface-alt)] border border-[var(--color-border)] p-3 text-sm focus:border-[var(--color-accent)] focus:outline-none text-[var(--color-ink)] h-32 resize-none"
                  placeholder="Operational details for this phase..."
                />
              </div>
              <div className="pt-4 flex justify-between gap-3 border-t border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={() => {
                    if (editingPhaseId) {
                      handleDeletePhase(editingPhaseId);
                    }
                  }}
                  disabled={!editingPhaseId}
                  className="px-4 py-2 bg-[var(--color-danger)] text-[var(--color-bg)] text-xs font-mono font-bold hover:bg-[var(--color-danger)]/80 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  DELETE PHASE
                </button>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsPhaseModalOpen(false)}
                    className="px-4 py-2 border border-[var(--color-border)] text-xs font-mono hover:bg-[var(--color-surface-alt)] text-[var(--color-ink)]"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-[var(--color-accent)] text-[var(--color-bg)] text-xs font-mono font-bold hover:bg-[var(--color-accent-strong)]"
                  >
                    {editingPhaseId ? 'UPDATE PHASE' : 'INITIATE PHASE'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TASK MODAL */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" dir="rtl">
          <div className="w-full max-w-2xl bg-[var(--color-bg)] border border-[var(--color-accent)] shadow-[0_0_100px_-20px_rgba(0,68,255,0.3)] animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
            <div className="h-14 bg-[var(--color-surface-alt)] border-b border-[var(--color-border)] flex items-center justify-between px-6 flex-shrink-0">
              <div className="flex items-center gap-2 text-[var(--color-accent)] font-mono text-sm font-bold uppercase tracking-widest">
                <AlertCircle className="w-4 h-4" /> New Task Protocol
              </div>
              <button onClick={() => setIsTaskModalOpen(false)} className="hover:text-[var(--color-accent)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="p-8 space-y-8 overflow-y-auto modal-scroll">
              {/* SECTION 1: IDENTITY */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[var(--color-ink)] font-mono text-xs font-bold uppercase tracking-widest border-b border-[var(--color-border)] pb-2">
                  <FileText className="w-3 h-3" /> Identity
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-mono text-[var(--color-ink-soft)] uppercase tracking-widest">Task Designation</label>
                    <input
                      value={newTaskData.name}
                      onChange={(e) => setNewTaskData({ ...newTaskData, name: e.target.value })}
                      className="w-full bg-[var(--color-surface-alt)] border border-[var(--color-border)] p-3 text-sm font-bold focus:border-[var(--color-accent)] focus:outline-none text-[var(--color-ink)]"
                      placeholder="e.g. CONFIGURE_MIDDLEWARE"
                      autoFocus
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-[var(--color-ink-soft)] uppercase tracking-widest">Est. Time (Hours)</label>
                    <input
                      type="number"
                      value={newTaskData.time_estimate}
                      onChange={(e) => setNewTaskData({ ...newTaskData, time_estimate: e.target.value })}
                      className="w-full bg-[var(--color-surface-alt)] border border-[var(--color-border)] p-3 text-sm focus:border-[var(--color-accent)] focus:outline-none text-[var(--color-ink)]"
                      placeholder="2.5"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-[var(--color-ink-soft)] uppercase tracking-widest">Description</label>
                  <textarea
                    value={newTaskData.description}
                    onChange={(e) => setNewTaskData({ ...newTaskData, description: e.target.value })}
                    className="w-full bg-[var(--color-surface-alt)] border border-[var(--color-border)] p-3 text-sm focus:border-[var(--color-accent)] focus:outline-none text-[var(--color-ink)] h-20 resize-none"
                    placeholder="Detailed instructions..."
                  />
                </div>
              </div>

              {/* SECTION 2: PARAMETERS */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[var(--color-ink)] font-mono text-xs font-bold uppercase tracking-widest border-b border-[var(--color-border)] pb-2">
                  <Zap className="w-3 h-3" /> Parameters
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-mono text-[var(--color-ink-soft)] uppercase tracking-widest block">Difficulty Rating</label>
                    <div className="flex flex-wrap gap-2">
                      {(['EASY', 'MEDIUM', 'HARD', 'EXPERT'] as UiDifficulty[]).map((diff) => (
                        <DifficultyBadge key={diff} level={diff} selected={newTaskData.difficulty === diff} onClick={() => setNewTaskData({ ...newTaskData, difficulty: diff })} />
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-[var(--color-ink-soft)] uppercase tracking-widest">XP Reward</label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-[var(--color-surface-alt)] border border-[var(--color-border)] p-2 flex items-center gap-2 text-[var(--color-gold)]">
                        <Zap className="w-4 h-4 fill-current" />
                        <input
                          type="number"
                          value={newTaskData.xp}
                          onChange={(e) => setNewTaskData({ ...newTaskData, xp: Number(e.target.value) })}
                          className="bg-transparent border-none w-full text-sm font-bold focus:outline-none text-[var(--color-ink)]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 3: DEPENDENCIES & META */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-[var(--color-ink)] font-mono text-xs font-bold uppercase tracking-widest border-b border-[var(--color-border)] pb-2">
                  <LinkIcon className="w-3 h-3" /> Logistics
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-[var(--color-ink-soft)] uppercase tracking-widest">Tools (CSV)</label>
                    <input
                      value={newTaskData.tools}
                      onChange={(e) => setNewTaskData({ ...newTaskData, tools: e.target.value })}
                      className="w-full bg-[var(--color-surface-alt)] border border-[var(--color-border)] p-3 text-xs focus:border-[var(--color-accent)] focus:outline-none text-[var(--color-ink)]"
                      placeholder="Git, Node.js..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-[var(--color-ink-soft)] uppercase tracking-widest">Hints (CSV)</label>
                    <input
                      value={newTaskData.hints}
                      onChange={(e) => setNewTaskData({ ...newTaskData, hints: e.target.value })}
                      className="w-full bg-[var(--color-surface-alt)] border border-[var(--color-border)] p-3 text-xs focus:border-[var(--color-accent)] focus:outline-none text-[var(--color-ink)]"
                      placeholder="Check docs..."
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-mono text-[var(--color-ink-soft)] uppercase tracking-widest">Prerequisites (Optional)</label>
                  <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto modal-scroll pr-2 bg-[var(--color-surface-alt)] p-2 border border-[var(--color-border)]">
                    {allUiTasks.length > 0 ? (
                      allUiTasks.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => togglePredecessor(t.id)}
                          className={`text-left text-[10px] font-mono px-2 py-1.5 border transition-colors truncate ${
                            newTaskData.predecessors.includes(t.id)
                              ? 'bg-[var(--color-accent)] text-[var(--color-bg)] border-[var(--color-accent)]'
                              : 'bg-[var(--color-bg)] text-[var(--color-ink-soft)] border-[var(--color-border)] hover:border-[var(--color-ink)]'
                          }`}
                        >
                          TSK-{String(t.displayOrder).padStart(3, '0')}: {t.name}
                        </button>
                      ))
                    ) : (
                      <div className="text-[10px] text-[var(--color-ink-soft)] italic p-2">No existing tasks available.</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 sticky bottom-0 bg-[var(--color-bg)] border-t border-[var(--color-border)] mt-4">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-4 py-2 border border-[var(--color-border)] text-xs font-mono hover:bg-[var(--color-surface-alt)] text-[var(--color-ink)]"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-[var(--color-accent)] text-[var(--color-bg)] text-xs font-mono font-bold hover:bg-[var(--color-accent-strong)]"
                >
                  ADD TASK
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}