'use client';

const mockMessages = [
  { role: 'system', text: 'مرحبا، أنا المساعد الخاص بالمشروع. اسألني عن أي تفاصيل أو اطلب تعديلات على المهام.' },
  { role: 'user', text: 'ما حالة التكامل مع GitHub؟' },
  { role: 'assistant', text: 'التكامل ضمن مرحلة المراجعة، 4 مهام متبقية، ETA يومان.' },
];

export default function ProjectAiPage() {
  return (
    <div className="flex-1 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs font-mono uppercase tracking-widest text-[var(--color-ink-soft)]">المساعد</div>
          <div className="text-2xl font-semibold">أسئلة وتحديثات</div>
        </div>
        <div className="text-xs font-mono text-[var(--color-ink-soft)]">استخدمه للاستفسارات والتعديلات حول المشروع.</div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto px-2 py-4 space-y-4 bg-[var(--color-bg)]">
          {mockMessages.map((m, i) => (
            <div key={i} className={`max-w-3xl ${m.role === 'user' ? 'ml-auto text-right' : 'text-left'}`}>
              <div
                className={`inline-block px-4 py-3 ${
                  m.role === 'user'
                    ? 'bg-[var(--color-accent)] text-[var(--color-ink)]'
                    : 'bg-[var(--color-surface)] text-[var(--color-ink)]'
                }`}
              >
                <div className="text-[11px] uppercase font-mono tracking-widest text-[var(--color-ink-soft)] mb-1">
                  {m.role === 'user' ? 'أنت' : 'المساعد'}
                </div>
                <div className="text-sm leading-relaxed">{m.text}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3 bg-[var(--color-bg)] p-3">
        <input
          className="flex-1 px-4 py-3 bg-[var(--color-surface)] text-[var(--color-ink)] placeholder-[var(--color-ink-soft)] focus:outline-none"
          placeholder="اسأل عن المهام أو اطلب تحديثاً..."
        />
        <button className="inline-flex items-center gap-2 px-4 py-3 bg-[var(--color-accent)] text-[var(--color-ink)] transition-colors">
          إرسال
        </button>
      </div>
    </div>
  );
}
