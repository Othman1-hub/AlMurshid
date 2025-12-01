'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useChat } from 'ai/react';
import { CheckCircle2, RefreshCw, Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { createClient as createSupabaseClient } from '@/utils/supabase/client';

export default function ProjectAiPage() {
  const params = useParams();
  const projectId = Number(params.projectId);
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toolExecutionMessage, setToolExecutionMessage] = useState<string | null>(null);
  const [stats, setStats] = useState({ phases: 0, tasks: 0, dependencies: 0, memories: 0 });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [userRole, setUserRole] = useState<number>(1);
  const isLocked = userRole === 3;

  useEffect(() => {
    const resolveRole = async () => {
      try {
        const supabase = createSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data: ownerRow } = await supabase
          .from('projects')
          .select('user_id')
          .eq('id', projectId)
          .maybeSingle();
        if (ownerRow?.user_id === user.id) {
          setUserRole(1);
          return;
        }
        const { data: teamRow } = await supabase
          .from('teams')
          .select('role')
          .eq('project_id', projectId)
          .eq('user_id', user.id)
          .maybeSingle();
        setUserRole(teamRow?.role ?? 2);
      } catch (err) {
        console.error('Failed to resolve role', err);
      }
    };
    resolveRole();
  }, [projectId]);

  // Load project stats
  const loadProjectData = useCallback(async () => {
    if (isLocked) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    setRefreshing(true);
    try {
      const [tasksRes, phasesRes, depsRes, memoriesRes] = await Promise.all([
        fetch(`/api/projects/${projectId}/tasks`),
        fetch(`/api/projects/${projectId}/phases`),
        fetch(`/api/projects/${projectId}/dependencies`),
        fetch(`/api/projects/${projectId}/memories`)
      ]);

      const [tasks, phases, deps, memories] = await Promise.all([
        tasksRes.ok ? tasksRes.json() : [],
        phasesRes.ok ? phasesRes.json() : [],
        depsRes.ok ? depsRes.json() : [],
        memoriesRes.ok ? memoriesRes.json() : []
      ]);

      setStats({
        phases: phases.length,
        tasks: tasks.length,
        dependencies: deps.length,
        memories: memories.length
      });
    } catch (error) {
      console.error('Error loading project data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [projectId, isLocked]);

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/chat',
    initialMessages: [
      {
        id: 'system-1',
        role: 'assistant' as const,
        content: 'Hello! I\'m Al-Murshid, your AI assistant for this project. I can help you:\n\n📋 Manage tasks (add, edit, delete, reorder)\n🎯 Manage phases and dependencies\n👥 View teammates and assign tasks to them\n📊 Analyze progress and generate reports\n💡 Suggest improvements\n\nWhat do you need help with today?'
      }
    ],
    body: { projectId, mode: 'assistant', language: 'en' },
    onFinish: async (message) => {
      if (message.toolInvocations && message.toolInvocations.length > 0) {
        setToolExecutionMessage('✅ Operations completed successfully! Refreshing data...');
        await loadProjectData();
        setTimeout(() => setToolExecutionMessage(null), 3000);
      }
    },
  });

  useEffect(() => {
    loadProjectData();
  }, [loadProjectData]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (isLocked) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[var(--color-bg)] text-[var(--color-ink)]" dir="ltr">
        <div className="text-center border border-[var(--color-border)] px-6 py-8 bg-[var(--color-surface)] shadow-lg max-w-md">
          <div className="text-[var(--color-accent)] mb-2">
            <CheckCircle2 className="w-10 h-10 mx-auto rotate-45 opacity-70" />
          </div>
          <div className="text-lg font-mono font-bold">AI ACCESS LOCKED</div>
          <div className="text-xs font-mono text-[var(--color-ink-soft)] mt-2">
            Your role does not allow AI interactions for this project.
          </div>
        </div>
      </div>
    );
  }

  const handleLockedSubmit = (e: React.FormEvent) => {
    if (isLocked) {
      e.preventDefault();
      return;
    }
    handleSubmit(e);
  };

  return (
    <div className="flex-1 flex flex-col gap-4 h-full overflow-hidden" dir="ltr">
      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <div className="text-xs font-mono uppercase tracking-widest text-[var(--color-ink-soft)]">Al-Murshid • AI Assistant</div>
          <div className="text-2xl font-semibold">Project Management & Edits</div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={loadProjectData}
            disabled={refreshing}
            className="flex items-center gap-2 px-3 py-2 text-xs bg-[var(--color-surface)] hover:bg-[var(--color-accent)] transition-colors disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <div className="flex items-center gap-2 text-xs font-mono text-[var(--color-ink-soft)]">
            <span className="px-2 py-1 bg-[var(--color-surface)]">{stats.phases} Phases</span>
            <span className="px-2 py-1 bg-[var(--color-surface)]">{stats.tasks} Tasks</span>
            <span className="px-2 py-1 bg-[var(--color-surface)]">{stats.dependencies} Deps</span>
            <span className="px-2 py-1 bg-[var(--color-surface)]">{stats.memories} Items</span>
          </div>
        </div>
      </div>

      {toolExecutionMessage && (
        <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 text-green-600">
          <CheckCircle2 className="w-5 h-5" />
          <span>{toolExecutionMessage}</span>
        </div>
      )}

      <div className="flex flex-wrap gap-2 text-xs flex-shrink-0">
        <button
          onClick={() => handleInputChange({ target: { value: 'Give me a project status summary' } } as any)}
          className="px-3 py-2 bg-[var(--color-surface)] hover:bg-[var(--color-accent)] transition-colors"
        >
          📊 Project Status
        </button>
        <button
          onClick={() => handleInputChange({ target: { value: 'Show me all teammates in this project' } } as any)}
          className="px-3 py-2 bg-[var(--color-surface)] hover:bg-[var(--color-accent)] transition-colors"
        >
          👥 Teammates
        </button>
        <button
          onClick={() => handleInputChange({ target: { value: 'Show me remaining and blocked tasks' } } as any)}
          className="px-3 py-2 bg-[var(--color-surface)] hover:bg-[var(--color-accent)] transition-colors"
        >
          ✅ Remaining Tasks
        </button>
        <button
          onClick={() => handleInputChange({ target: { value: 'Add a new task' } } as any)}
          className="px-3 py-2 bg-[var(--color-surface)] hover:bg-[var(--color-accent)] transition-colors"
        >
          ➕ Add Task
        </button>
        <button
          onClick={() => handleInputChange({ target: { value: 'Suggest project improvements' } } as any)}
          className="px-3 py-2 bg-[var(--color-surface)] hover:bg-[var(--color-accent)] transition-colors"
        >
          💡 Suggestions
        </button>
      </div>

      <div className="flex-1 overflow-hidden min-h-0">
        <div className="h-full overflow-y-auto px-2 py-4 space-y-4 bg-[var(--color-bg)] scrollbar-hide" dir="ltr" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          {loading ? (
            <div className="text-center text-[var(--color-ink-soft)] py-8">
              Loading project data...
            </div>
          ) : (
            <>
              {messages.map((m) => (
                <div key={m.id} className={`max-w-3xl ${m.role === 'user' ? 'ml-auto text-right' : 'text-left'}`}>
                  <div
                    className={`inline-block px-4 py-3 border-2 transition-all duration-200 hover:scale-[1.02] ${
                      m.role === 'user'
                        ? 'bg-[var(--color-accent)] text-[var(--color-ink)] border-[var(--color-accent)] shadow-[0_0_20px_-5px_var(--color-accent)]'
                        : 'bg-[var(--color-surface)] text-[var(--color-ink)] border-[var(--color-border)] hover:border-[var(--color-accent)]/50 shadow-md'
                    }`}
                  >
                    <div className="text-[11px] uppercase font-mono tracking-widest mb-1 font-bold flex items-center gap-2">
                      {m.role === 'user' ? (
                        <>
                          <div className="w-1.5 h-1.5 bg-[var(--color-ink)] rounded-full animate-pulse"></div>
                          <span className="text-[var(--color-ink)]/80">YOU</span>
                        </>
                      ) : (
                        <>
                          <div className="w-1.5 h-1.5 bg-[var(--color-accent)] rounded-full animate-pulse"></div>
                          <span className="text-[var(--color-accent)]">AL-MURSHID</span>
                        </>
                      )}
                    </div>
                    <div className="text-sm leading-relaxed">
                      {m.role === 'assistant' ? (
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          components={{
                            p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                            ul: ({node, ...props}) => <ul className="list-disc list-inside mb-2 space-y-1" {...props} />,
                            ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-2 space-y-1" {...props} />,
                            li: ({node, ...props}) => <li className="ml-2" {...props} />,
                            h1: ({node, ...props}) => <h1 className="text-base font-bold mb-2 mt-2" {...props} />,
                            h2: ({node, ...props}) => <h2 className="text-sm font-bold mb-2 mt-2" {...props} />,
                            h3: ({node, ...props}) => <h3 className="text-sm font-semibold mb-1 mt-1" {...props} />,
                            code: ({node, inline, ...props}: any) => 
                              inline ? 
                                <code className="bg-[var(--color-bg)] px-1.5 py-0.5 rounded text-xs font-mono border border-[var(--color-border)]" {...props} /> : 
                                <code className="block bg-[var(--color-bg)] p-3 rounded my-2 text-xs font-mono overflow-x-auto border border-[var(--color-border)]" {...props} />,
                            strong: ({node, ...props}) => <strong className="font-bold" {...props} />,
                            em: ({node, ...props}) => <em className="italic" {...props} />,
                            a: ({node, ...props}) => <a className="text-[var(--color-accent)] underline hover:text-[var(--color-accent-strong)]" {...props} />,
                            blockquote: ({node, ...props}) => <blockquote className="border-l-2 border-[var(--color-accent)] pl-3 italic my-2" {...props} />,
                          }}
                        >
                          {m.content}
                        </ReactMarkdown>
                      ) : (
                        <div className="whitespace-pre-wrap">{m.content}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="max-w-3xl text-left">
                  <div className="inline-block px-4 py-3 bg-[var(--color-surface)] text-[var(--color-ink)]">
                    <div className="text-[11px] uppercase font-mono tracking-widest text-[var(--color-ink-soft)] mb-1">
                      Al-Murshid
                    </div>
                    <div className="text-sm leading-relaxed">
                      <span className="animate-pulse">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </div>

      <form onSubmit={handleLockedSubmit} className="flex items-center gap-3 bg-[var(--color-bg)] p-3 flex-shrink-0">
        <input
          value={input}
          onChange={handleInputChange}
          disabled={isLoading || loading || isLocked}
          className="flex-1 px-4 py-3 bg-[var(--color-surface)] text-[var(--color-ink)] placeholder-[var(--color-ink-soft)] focus:outline-none disabled:opacity-50"
          placeholder="Ask about tasks, request changes, or get project analysis..."
        />
        <button
          type="submit"
          disabled={isLoading || loading || !input.trim() || isLocked}
          className="inline-flex items-center gap-2 px-4 py-3 bg-[var(--color-accent)] text-[var(--color-ink)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="w-4 h-4" />
          Send
        </button>
      </form>

      <div className="text-[10px] text-center text-[var(--color-ink-soft)] font-mono space-y-1 flex-shrink-0">
        <div>💡 Request: add/edit/delete tasks, create phases, add dependencies, assign teammates, or any edits</div>
        <div>🔧 Al-Murshid can execute operations directly on the database</div>
      </div>
    </div>
  );
}
