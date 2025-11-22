'use client';

const mockMessages = [
  { role: 'system', text: 'هذه جلسة التأسيس الأولى. صف فكرة المشروع وسنولّد المهام الأولى والملخص.' },
  { role: 'assistant', text: 'اذكر النطاق، التقنيات المفضلة، وأي قيود زمنية.' },
];

export default function ProjectFirstGeneratePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)] text-[var(--color-ink)]" dir="rtl">
      <div className="flex-1 flex flex-col gap-4 px-6 py-8 max-w-5xl mx-auto w-full">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-[var(--color-ink-soft)]">توليد أولي</div>
            <div className="text-2xl font-semibold">ابدأ بوصف المشروع</div>
          </div>
          <div className="text-xs font-mono text-[var(--color-ink-soft)]">
            هذه الخطوة لمرة واحدة لالتقاط الفكرة وبناء المهام والملخص.
          </div>
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
            placeholder="اكتب وصف الفكرة، التقنيات، والمدد المستهدفة..."
          />
          <button className="inline-flex items-center gap-2 px-4 py-3 bg-[var(--color-accent)] text-[var(--color-ink)] transition-colors">
            إرسال
          </button>
        </div>
      </div>
    </div>
  );
}
