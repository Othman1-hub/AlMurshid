"use client";

import React, { useState, useEffect } from 'react';
import { useFormStatus } from 'react-dom';
import { 
  Database, 
  Cpu, 
  Lightbulb, 
  Link as LinkIcon, 
  Plus, 
  Trash2, 
  Hash, 
  Lock, 
  MoreHorizontal,
  Save,
  X,
  FileText,
  AlignLeft,
  Calendar,
  Tag
} from 'lucide-react';
import { addMemory, getProjectMemories, deleteMemory, MemoryType } from '@/app/actions/memory';

/* --- UI COMPONENTS --- */

const Button = ({ children, className = "", variant = "default", ...props }: any) => {
  const base = "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-ink)] disabled:opacity-50 font-mono tracking-wide border h-10 px-4 rounded-none";
  const variants: any = {
    default: "bg-[var(--color-ink)] text-[var(--color-bg)] border-[var(--color-ink)] hover:bg-[var(--color-ink-soft-contrast)] hover:border-[var(--color-ink-soft-contrast)]",
    outline: "bg-transparent text-[var(--color-ink)] border-[var(--color-border)] hover:border-[var(--color-ink)] hover:bg-[var(--color-surface-alt)]",
    ghost: "bg-transparent text-[var(--color-ink-soft)] border-transparent hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-alt)] px-2",
    accent: "bg-[var(--color-accent)] text-[var(--color-ink)] border-[var(--color-accent)] hover:bg-[var(--color-accent-strong)]"
  };
  return <button className={`${base} ${variants[variant]} ${className}`} {...props}>{children}</button>;
};

const Badge = ({ children, type = "default" }: any) => {
  const styles: any = {
    default: "border-[var(--color-border)] text-[var(--color-ink-soft)] bg-[var(--color-surface-alt)]",
    constant: "border-[var(--color-accent)] text-[var(--color-accent)] bg-[var(--color-surface-alt)]",
    fragment: "border-[var(--color-border-strong)] text-[var(--color-ink)] bg-[var(--color-panel)]",
    resource: "border-[var(--color-border)] text-[var(--color-ink)] bg-[var(--color-surface)]"
  };
  return (
    <span className={`text-[10px] font-mono px-2 py-0.5 border uppercase tracking-wider ${styles[type] || styles.default}`}>
      {children}
    </span>
  );
};

/* --- MEMORY ITEM MODAL FORM --- */

function MemoryFormModal({ isOpen, onClose, projectId, memoryType, onSuccess }: any) {
  const [label, setLabel] = useState('');
  const [content, setContent] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append('label', label);
      formData.append('content', content);
      formData.append('description', description);

      const result = await addMemory(projectId, memoryType, { error: undefined, success: undefined, values: {} }, formData);

      if (result.error) {
        setError(result.error);
      } else if (result.success) {
        // Reset form
        setLabel('');
        setContent('');
        setDescription('');
        setError(null);
        
        // Call onSuccess and close
        onSuccess();
        onClose();
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form state when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setLabel('');
      setContent('');
      setDescription('');
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const typeLabel = {
    constants: 'DEFINE_CONSTANT',
    fragments: 'ADD_FRAGMENT',
    external_resources: 'ADD_RESOURCE'
  }[memoryType as string] || 'ADD_ITEM';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-[var(--color-bg)] border border-[var(--color-accent)] shadow-[0_0_50px_-10px_rgba(0,68,255,0.2)]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)] bg-[var(--color-surface-alt)]">
          <div className="flex items-center gap-2 font-mono text-sm font-bold text-[var(--color-accent)]">
            <Plus className="w-4 h-4" />
            <span>{typeLabel}</span>
          </div>
          <button onClick={onClose} className="hover:text-[var(--color-accent)] font-mono">
            [ESC]
          </button>
        </div>

        {/* Modal Body */}
        <form ref={formRef} onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="block text-xs font-mono uppercase tracking-widest text-[var(--color-ink-soft)] flex items-center gap-2">
              <span className="w-1 h-1 bg-[var(--color-accent)]"></span> Label / Key
            </label>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              required
              className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] p-3 font-mono text-sm focus:outline-none focus:border-[var(--color-accent)] placeholder:text-[var(--color-ink-soft)]/30 transition-colors"
              placeholder="LABEL_IDENTIFIER..."
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-mono uppercase tracking-widest text-[var(--color-ink-soft)] flex items-center gap-2">
              <span className="w-1 h-1 bg-[var(--color-accent)]"></span> Content / Value
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] p-3 font-mono text-sm focus:outline-none focus:border-[var(--color-accent)] resize-none"
              placeholder="CONTENT_OR_VALUE..."
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-mono uppercase tracking-widest text-[var(--color-ink-soft)] flex items-center gap-2">
              <span className="w-1 h-1 bg-[var(--color-accent)]"></span> Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[var(--color-bg)] border border-[var(--color-border)] p-3 font-mono text-sm focus:outline-none focus:border-[var(--color-accent)] resize-none"
              placeholder="OPTIONAL_DESCRIPTION..."
              rows={3}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500 text-red-500 text-xs font-mono">
              ERROR: {error}
            </div>
          )}

          <div className="pt-6 flex justify-end gap-4 border-t border-[var(--color-border)]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-3 border border-[var(--color-border)] text-xs font-mono font-bold hover:bg-[var(--color-surface-alt)] text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] transition-colors disabled:opacity-50"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-[var(--color-accent)] text-white border border-[var(--color-accent)] text-xs font-mono font-bold hover:bg-[var(--color-accent-strong)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'SAVING...' : 'SAVE_ENTRY'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* --- INSPECTOR PANEL COMPONENT --- */
const InspectorPanel = ({ item, onClose, onDelete, projectId }: any) => {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      setIsDeleting(true);
      await deleteMemory(item.id, projectId);
      onDelete();
      onClose();
    }
  };

  if (!item) return null;

  const typeLabel = item.type || 'UNKNOWN';

  return (
    <div className="fixed top-16 left-0 bottom-0 w-96 bg-[var(--color-surface)] border-r border-[var(--color-border)] z-40 flex flex-col shadow-2xl animate-in slide-in-from-left-full duration-200">
      {/* Header */}
      <div className="h-14 border-b border-[var(--color-border)] flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <AlignLeft className="w-4 h-4 text-[var(--color-accent)]" />
          <span className="font-mono text-xs font-bold text-[var(--color-ink)] tracking-widest">PROPERTIES</span>
        </div>
        <button onClick={onClose} className="text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]"><X className="w-4 h-4" /></button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {/* ID Section */}
        <div className="space-y-2">
          <label className="text-[10px] text-[var(--color-ink-soft)] font-mono uppercase">Item ID</label>
          <div className="font-mono text-xs text-[var(--color-ink-soft)] bg-[var(--color-surface-alt)] p-2 border border-[var(--color-border)] truncate">
            {item.id}
          </div>
        </div>

        {/* Type Section */}
        <div className="space-y-2">
          <label className="text-[10px] text-[var(--color-ink-soft)] font-mono uppercase">Item Type</label>
          <div><Badge type={item.type}>{item.type?.toUpperCase()}</Badge></div>
        </div>

        {/* Label / Key */}
        {item.label && (
          <div className="space-y-2">
            <label className="text-[10px] text-[var(--color-ink-soft)] font-mono uppercase flex items-center gap-2">
              <Tag className="w-3 h-3" /> Label
            </label>
            <div className="font-bold text-[var(--color-ink)] text-sm border-b border-[var(--color-border-strong)] pb-2">
              {item.label}
            </div>
          </div>
        )}

        {/* Content / Value */}
        <div className="space-y-2">
          <label className="text-[10px] text-[var(--color-ink-soft)] font-mono uppercase flex items-center gap-2">
            <Database className="w-3 h-3" /> Content
          </label>
          <div className="font-mono text-sm text-[var(--color-accent)] bg-[var(--color-surface-alt)] p-3 border border-[var(--color-border)] break-all max-h-32 overflow-y-auto">
            {item.content}
          </div>
        </div>

        {/* Description */}
        {item.description && (
          <div className="space-y-2 pt-4">
            <label className="text-[10px] text-[var(--color-ink-soft)] font-mono uppercase flex items-center gap-2">
              <FileText className="w-3 h-3" /> Description
            </label>
            <div className="text-sm text-[var(--color-ink)] leading-relaxed whitespace-pre-wrap">
              {item.description}
            </div>
          </div>
        )}

        {/* Created Date */}
        <div className="space-y-2 pt-4 border-t border-[var(--color-border)]">
          <label className="text-[10px] text-[var(--color-ink-soft)] font-mono uppercase flex items-center gap-2">
            <Calendar className="w-3 h-3" /> Created
          </label>
          <div className="text-xs text-[var(--color-ink-soft)]">
            {new Date(item.created_at).toLocaleString()}
          </div>
        </div>

      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-surface-alt)] flex gap-2">
        <button 
          onClick={handleDelete}
          disabled={isDeleting}
          className="flex-1 px-4 py-2 text-xs font-mono border border-red-500 text-red-500 hover:bg-red-900/10 disabled:opacity-50 transition-colors"
        >
          {isDeleting ? 'DELETING...' : 'DELETE'}
        </button>
      </div>
    </div>
  );
};

export default function ProjectMemory({ params }: any) {
  const { projectId: projectIdStr } = React.use(params) as any;
  const projectId = parseInt(projectIdStr);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [memories, setMemories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState<string | null>(null);

  // Fetch memories
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getProjectMemories(projectId);
        if (data) {
          setMemories(data);
        }
      } catch (err) {
        console.error('Failed to fetch memories:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [projectId]);

  // Filter Data
  const constants = memories.filter(i => i.type === 'constants');
  const fragments = memories.filter(i => i.type === 'fragments');
  const resources = memories.filter(i => i.type === 'external_resources');

  const handleFormSuccess = async () => {
    const data = await getProjectMemories(projectId);
    if (data) {
      setMemories(data);
      setSelectedItem(null);
    }
  };

  const handleDelete = async () => {
    const data = await getProjectMemories(projectId);
    if (data) {
      setMemories(data);
    }
  };
  
  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-ink)] font-sans selection:bg-[var(--color-ink)] selection:text-[var(--color-bg)] relative overflow-x-hidden" dir="rtl">

      {/* Modals */}
      <MemoryFormModal 
        isOpen={activeModal === 'constants'}
        onClose={() => setActiveModal(null)}
        projectId={projectId}
        memoryType="constants"
        onSuccess={handleFormSuccess}
      />
      <MemoryFormModal 
        isOpen={activeModal === 'fragments'}
        onClose={() => setActiveModal(null)}
        projectId={projectId}
        memoryType="fragments"
        onSuccess={handleFormSuccess}
      />
      <MemoryFormModal 
        isOpen={activeModal === 'external_resources'}
        onClose={() => setActiveModal(null)}
        projectId={projectId}
        memoryType="external_resources"
        onSuccess={handleFormSuccess}
      />

      {/* Inspector Panel Overlay */}
      {selectedItem && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-[1px] z-30 transition-opacity" 
          onClick={() => setSelectedItem(null)}
        />
      )}
      <InspectorPanel 
        item={selectedItem} 
        onClose={() => setSelectedItem(null)}
        onDelete={handleDelete}
        projectId={projectId}
      />

      {/* Header */}
      <header className="border-b border-[var(--color-border)] bg-[var(--color-surface)] sticky top-0 z-20">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[var(--color-accent)] flex items-center justify-center rounded-none">
              <Database className="w-4 h-4 text-[var(--color-ink)]" />
            </div>
            <div>
              <h1 className="text-lg font-bold font-mono tracking-tight text-[var(--color-ink)] leading-none">
                PROJECT_MEMORY
              </h1>
              <div className="text-[10px] text-[var(--color-ink-soft)] font-mono tracking-widest mt-1">
                ALMURSHED / VAULT / ID: {projectId}
              </div>
            </div>
          </div>
        </div>
      </header>

      {loading ? (
        <main className="container mx-auto px-6 py-8">
          <div className="text-center text-[var(--color-ink-soft)] font-mono">
            LOADING_MEMORIES...
          </div>
        </main>
      ) : (
        <main className={`container mx-auto px-6 py-8 transition-all duration-300 ${selectedItem ? 'pl-96' : ''}`}>
        
        {/* SECTION 1: SYSTEM CONSTANTS */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-[var(--color-ink-soft)] font-mono flex items-center gap-2">
              <Cpu className="w-4 h-4" />
              SYSTEM_CONSTANTS (الثوابت) - {constants.length}
            </h2>
            <div className="h-px bg-[var(--color-border)] flex-1 mr-4"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {constants.map((item) => (
              <div 
                key={item.id} 
                onClick={() => setSelectedItem(item)}
                className={`group border bg-[var(--color-surface)] p-4 cursor-pointer transition-all relative ${selectedItem?.id === item.id ? 'border-[var(--color-accent)] bg-[var(--color-surface-alt)]' : 'border-[var(--color-border)] hover:border-[var(--color-border-strong)]'}`}
              >
                <div className="absolute top-2 left-2 opacity-50 group-hover:opacity-100 transition-opacity">
                  <Lock className="w-3 h-3 text-[var(--color-accent)]" />
                </div>
                <div className="font-mono text-[10px] text-[var(--color-ink-soft)] mb-2 uppercase tracking-wider">
                  {item.label}
                </div>
                <div className="font-mono text-sm text-[var(--color-ink)] truncate font-medium">
                  {item.content}
                </div>
                {/* Short Desc Preview */}
                <div className="mt-2 pt-2 border-t border-[var(--color-border)] text-[10px] text-[var(--color-ink-soft)] truncate">
                   {item.description || 'No description'}
                </div>
              </div>
            ))}
            <button 
              onClick={() => setActiveModal('constants')}
              className="border border-dashed border-[var(--color-border-strong)] p-4 flex flex-col items-center justify-center gap-2 text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] hover:border-[var(--color-ink)] transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span className="text-xs font-mono">DEFINE_CONSTANT</span>
            </button>
          </div>
        </section>

        {/* SECTION 2: MEMORY FRAGMENTS */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-[var(--color-ink-soft)] font-mono flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              FRAGMENTS (أفكار ومقترحات) - {fragments.length}
            </h2>
            <div className="h-px bg-[var(--color-border)] flex-1 mr-4"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[var(--color-border)] border border-[var(--color-border)]">
            {fragments.map((item) => (
              <div 
                key={item.id} 
                onClick={() => setSelectedItem(item)}
                className={`bg-[var(--color-surface)] p-6 cursor-pointer transition-colors group flex flex-col justify-between h-48 ${selectedItem?.id === item.id ? 'bg-[var(--color-surface-alt)] ring-1 ring-inset ring-[var(--color-accent)]' : 'hover:bg-[var(--color-surface-alt)]'}`}
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div className="text-[10px] font-mono font-bold text-[var(--color-border-strong)] group-hover:text-[var(--color-accent)] transition-colors bg-[var(--color-surface-alt)] border border-[var(--color-border-strong)] rounded-none px-2 py-1" title={item.label || 'Fragment'}>
                      {item.label || '#'}
                    </div>
                    <MoreHorizontal className="w-4 h-4 text-[var(--color-ink-soft)]" />
                  </div>
                  <p className="text-sm text-[var(--color-ink)] font-light leading-relaxed line-clamp-2 mb-2">
                    &quot;{item.content}&quot;
                  </p>
                  {item.description && (
                    <div className="text-[10px] text-[var(--color-ink-soft)] line-clamp-2">
                      {item.description}
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-center mt-4">
                  <Badge type="fragments">FRAGMENT</Badge>
                </div>
              </div>
            ))}
             <button 
               onClick={() => setActiveModal('fragments')}
               className="bg-[var(--color-surface)] p-6 flex flex-col items-center justify-center text-center group cursor-pointer hover:bg-[var(--color-surface-alt)]"
             >
              <div className="w-10 h-10 border border-[var(--color-border-strong)] flex items-center justify-center mb-3 group-hover:border-[var(--color-ink)] transition-colors rounded-none">
                <Plus className="w-5 h-5 text-[var(--color-ink-soft)] group-hover:text-[var(--color-ink)]" />
              </div>
              <span className="text-xs font-mono text-[var(--color-ink-soft)] group-hover:text-[var(--color-ink)]">ADD_FRAGMENT</span>
            </button>
          </div>
        </section>

        {/* SECTION 3: EXTERNAL RESOURCES */}
        <section>
          <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-[var(--color-ink-soft)] font-mono flex items-center gap-2">
              <LinkIcon className="w-4 h-4" />
              EXTERNAL_RESOURCES (المراجع) - {resources.length}
            </h2>
            <div className="h-px bg-[var(--color-border)] flex-1 mr-4"></div>
          </div>

          <div className="border border-[var(--color-border)] bg-[var(--color-surface)]">
            {resources.map((item, idx) => (
              <div 
                key={item.id} 
                onClick={() => setSelectedItem(item)}
                className={`flex items-center justify-between p-4 cursor-pointer transition-colors ${idx !== resources.length - 1 ? 'border-b border-[var(--color-border)]' : ''} ${selectedItem?.id === item.id ? 'bg-[var(--color-surface-alt)]' : 'hover:bg-[var(--color-surface-alt)]'}`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 bg-[var(--color-surface-alt)] flex items-center justify-center border border-[var(--color-border-strong)] text-[var(--color-ink-soft)]">
                    <LinkIcon className="w-3 h-3" />
                  </div>
                  <div>
                    <div className="text-sm text-[var(--color-ink)] font-mono font-bold hover:underline underline-offset-4 decoration-[var(--color-accent)]">
                      {item.label}
                    </div>
                    <div className="text-[10px] text-[var(--color-ink-soft)] truncate max-w-md">
                      {item.description || 'No description'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-[var(--color-ink-soft)] font-mono hidden md:block truncate max-w-xs">{item.content}</span>
                  <div className="h-8 w-8 flex items-center justify-center text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]">
                    <AlignLeft className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))}
            {resources.length === 0 && (
              <div className="p-6 text-center text-[var(--color-ink-soft)] font-mono text-xs">
                No resources yet
              </div>
            )}
          </div>

          {/* Add Resource Button */}
          <div className="mt-4">
            <button 
              onClick={() => setActiveModal('external_resources')}
              className="w-full px-6 py-3 border border-[var(--color-accent)] text-[var(--color-accent)] font-mono text-xs font-bold hover:bg-[var(--color-accent)]/5 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              ADD_RESOURCE
            </button>
          </div>
        </section>

      </main>
      )}
    </div>
  );
}
