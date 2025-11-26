"use client";

import React, { useState } from 'react';
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

/* --- UI COMPONENTS --- */

const Button = ({ children, className = "", variant = "default", ...props }) => {
  const base = "inline-flex items-center justify-center whitespace-nowrap text-sm font-medium transition-all focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--color-ink)] disabled:opacity-50 font-mono tracking-wide border h-10 px-4 rounded-none";
  const variants = {
    default: "bg-[var(--color-ink)] text-[var(--color-bg)] border-[var(--color-ink)] hover:bg-[var(--color-ink-soft-contrast)] hover:border-[var(--color-ink-soft-contrast)]",
    outline: "bg-transparent text-[var(--color-ink)] border-[var(--color-border)] hover:border-[var(--color-ink)] hover:bg-[var(--color-surface-alt)]",
    ghost: "bg-transparent text-[var(--color-ink-soft)] border-transparent hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-alt)] px-2",
    accent: "bg-[var(--color-accent)] text-[var(--color-ink)] border-[var(--color-accent)] hover:bg-[var(--color-accent-strong)]"
  };
  return <button className={`${base} ${variants[variant]} ${className}`} {...props}>{children}</button>;
};

const Badge = ({ children, type = "default" }) => {
  const styles = {
    default: "border-[var(--color-border)] text-[var(--color-ink-soft)] bg-[var(--color-surface-alt)]",
    CONSTANT: "border-[var(--color-accent)] text-[var(--color-accent)] bg-[var(--color-surface-alt)]",
    FRAGMENT: "border-[var(--color-border-strong)] text-[var(--color-ink)] bg-[var(--color-panel)]",
    RESOURCE: "border-[var(--color-border)] text-[var(--color-ink)] bg-[var(--color-surface)]"
  };
  return (
    <span className={`text-[10px] font-mono px-2 py-0.5 border uppercase tracking-wider ${styles[type] || styles.default}`}>
      {children}
    </span>
  );
};

/* --- MOCK DATA (With Descriptions) --- */
const INITIAL_DATA = [
  { 
    id: "uuid-1", 
    item_type: "CONSTANT", 
    label: "FRAMEWORK", 
    content: "Next.js 14 (App Router)", 
    description: "We are using the App Router for server components and better SEO performance. Ensure all new pages are strictly server-side rendered unless interactivity is required.",
    metadata: { locked: true }
  },
  { 
    id: "uuid-2", 
    item_type: "CONSTANT", 
    label: "DATABASE", 
    value: "Supabase (Postgres)", 
    content: "Supabase (Postgres)",
    description: "Using the Frankfurt region. Row Level Security (RLS) must be enabled on all tables.",
    metadata: { locked: true }
  },
  { 
    id: "uuid-2b", 
    item_type: "CONSTANT", 
    label: "DESIGN_SYSTEM", 
    content: "Shadcn UI + Tailwind", 
    description: "Use our existing tokens and components; avoid adding new design deps unless approved.", 
    metadata: { locked: true }
  },
  { 
    id: "uuid-2c", 
    item_type: "CONSTANT", 
    label: "AI_PROVIDER", 
    content: "DeepSeek V3 (fallback OpenAI gpt-4o-mini)", 
    description: "Default to DeepSeek; only swap to OpenAI if explicitly requested.", 
    metadata: { locked: true }
  },
  { 
    id: "uuid-3", 
    item_type: "FRAGMENT", 
    content: "Add a 'Focus Mode' that blocks notifications while coding.", 
    description: "This feature should integrate with the browser's Notification API. Maybe use a Pomodoro timer as the trigger?",
    metadata: { status: "PENDING" }
  },
  { 
    id: "uuid-3b", 
    item_type: "FRAGMENT", 
    content: "Surface recent project memory items inline when the user opens the AI tab.", 
    description: "Lightweight summary chips the model can read; avoid extra API calls.", 
    metadata: { status: "IDEA" }
  },
  { 
    id: "uuid-4", 
    item_type: "RESOURCE", 
    label: "Shadcn UI Docs", 
    content: "https://ui.shadcn.com", 
    description: "Reference for all UI components. Use the 'New York' style variant.",
    metadata: { favicon: "shadcn.png" }
  },
  { 
    id: "uuid-4b", 
    item_type: "RESOURCE", 
    label: "API Spec", 
    content: "https://example.com/api-docs", 
    description: "Temporary placeholder for backend endpoints; replace once real docs are ready.", 
    metadata: { source: "placeholder" }
  }
];

/* --- INSPECTOR PANEL COMPONENT --- */
const InspectorPanel = ({ item, onClose }) => {
  if (!item) return null;

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
          <label className="text-[10px] text-[var(--color-ink-soft)] font-mono uppercase">Object ID</label>
          <div className="font-mono text-xs text-[var(--color-ink-soft)] bg-[var(--color-surface-alt)] p-2 border border-[var(--color-border)] truncate">
            {item.id}
          </div>
        </div>

        {/* Type Section */}
        <div className="space-y-2">
          <label className="text-[10px] text-[var(--color-ink-soft)] font-mono uppercase">Item Type</label>
          <div><Badge type={item.item_type}>{item.item_type}</Badge></div>
        </div>

        {/* Label / Key */}
        {item.label && (
          <div className="space-y-2">
            <label className="text-[10px] text-[var(--color-ink-soft)] font-mono uppercase flex items-center gap-2">
              <Tag className="w-3 h-3" /> Label / Key
            </label>
            <div className="font-bold text-[var(--color-ink)] text-sm border-b border-[var(--color-border-strong)] pb-2">
              {item.label}
            </div>
          </div>
        )}

        {/* Content / Value */}
        <div className="space-y-2">
          <label className="text-[10px] text-[var(--color-ink-soft)] font-mono uppercase flex items-center gap-2">
            <Database className="w-3 h-3" /> Content / Value
          </label>
          <div className="font-mono text-sm text-[var(--color-accent)] bg-[var(--color-surface-alt)] p-3 border border-[var(--color-border)] break-all">
            {item.content}
          </div>
        </div>

        {/* Full Description */}
        <div className="space-y-2 pt-4">
          <label className="text-[10px] text-[var(--color-ink-soft)] font-mono uppercase flex items-center gap-2">
            <FileText className="w-3 h-3" /> Full Description
          </label>
          <div className="text-sm text-[var(--color-ink)] leading-relaxed min-h-[100px] whitespace-pre-wrap">
            {item.description || "No description provided."}
          </div>
        </div>

        {/* Metadata Dump */}
        <div className="space-y-2 pt-4 border-t border-[var(--color-border)]">
          <label className="text-[10px] text-[var(--color-ink-soft)] font-mono uppercase flex items-center gap-2">
            <Hash className="w-3 h-3" /> Metadata (JSON)
          </label>
          <pre className="text-[10px] text-[var(--color-ink-soft)] font-mono bg-[var(--color-surface-alt)] p-2 overflow-x-auto border border-[var(--color-border)]">
            {JSON.stringify(item.metadata, null, 2)}
          </pre>
        </div>

      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-surface-alt)] flex gap-2">
        <Button variant="outline" className="w-full text-xs">EDIT</Button>
        <Button variant="ghost" className="w-auto text-red-500 hover:text-red-400 hover:bg-red-900/10">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default function ProjectMemory() {
  const [selectedItem, setSelectedItem] = useState(null);

  // Filter Data
  const constants = INITIAL_DATA.filter(i => i.item_type === 'CONSTANT');
  const fragments = INITIAL_DATA.filter(i => i.item_type === 'FRAGMENT');
  const resources = INITIAL_DATA.filter(i => i.item_type === 'RESOURCE');
  
  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-ink)] font-sans selection:bg-[var(--color-ink)] selection:text-[var(--color-bg)] relative overflow-x-hidden" dir="rtl">

      {/* Inspector Panel Overlay */}
      {selectedItem && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-[1px] z-30 transition-opacity" 
          onClick={() => setSelectedItem(null)}
        />
      )}
      <InspectorPanel item={selectedItem} onClose={() => setSelectedItem(null)} />

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
                ALMURSHED / VAULT / ID: 8821
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="text-xs gap-2">
              <Save className="w-3 h-3" />
              SAVE_STATE
            </Button>
            <Button variant="default" className="text-xs gap-2">
              <Plus className="w-3 h-3" />
              NEW_ENTRY
            </Button>
          </div>
        </div>
      </header>

      <main className={`container mx-auto px-6 py-8 transition-all duration-300 ${selectedItem ? 'pl-96' : ''}`}>
        
        {/* SECTION 1: SYSTEM CONSTANTS */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-[var(--color-ink-soft)] font-mono flex items-center gap-2">
              <Cpu className="w-4 h-4" />
              SYSTEM_CONSTANTS (الثوابت)
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
                   {item.description}
                </div>
              </div>
            ))}
            <button className="border border-dashed border-[var(--color-border-strong)] p-4 flex flex-col items-center justify-center gap-2 text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] hover:border-[var(--color-ink)] transition-colors">
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
              FRAGMENTS (أفكار ومقترحات)
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
                  <div className="flex justify-between items-start mb-4">
                    <Hash className="w-4 h-4 text-[var(--color-border-strong)] group-hover:text-[var(--color-ink)] transition-colors" />
                    <MoreHorizontal className="w-4 h-4 text-[var(--color-ink-soft)]" />
                  </div>
                  <p className="text-sm text-[var(--color-ink)] font-light leading-relaxed line-clamp-3">
                    "{item.content}"
                  </p>
                </div>
                <div className="flex justify-between items-center mt-4">
                  <Badge type="FRAGMENT">{item.metadata.status}</Badge>
                </div>
              </div>
            ))}
             <div className="bg-[var(--color-surface)] p-6 flex flex-col items-center justify-center text-center group cursor-pointer hover:bg-[var(--color-surface-alt)]">
              <div className="w-10 h-10 border border-[var(--color-border-strong)] flex items-center justify-center mb-3 group-hover:border-[var(--color-ink)] transition-colors rounded-none">
                <Plus className="w-5 h-5 text-[var(--color-ink-soft)] group-hover:text-[var(--color-ink)]" />
              </div>
              <span className="text-xs font-mono text-[var(--color-ink-soft)] group-hover:text-[var(--color-ink)]">ADD_FRAGMENT</span>
            </div>
          </div>
        </section>

        {/* SECTION 3: EXTERNAL RESOURCES */}
        <section>
          <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-[var(--color-ink-soft)] font-mono flex items-center gap-2">
              <LinkIcon className="w-4 h-4" />
              EXTERNAL_RESOURCES (المراجع)
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
                      {item.description}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-[var(--color-ink-soft)] font-mono hidden md:block">{item.content}</span>
                  <div className="h-8 w-8 flex items-center justify-center text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]">
                    <AlignLeft className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}
