'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useChat } from 'ai/react';
import { isReadyToGenerate } from '@/lib/ai/prompts';
import { Sparkles, Send, CheckCircle, AlertCircle, Zap, Target, Trophy, Star } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface GeneratePageClientProps {
  projectId: number;
  projectName: string;
  userLevel: number;
}

export default function GeneratePageClient({ projectId, projectName, userLevel }: GeneratePageClientProps) {
  const router = useRouter();
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationComplete, setGenerationComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Generate stable particle positions only on client side
  const particles = useMemo(() => {
    if (typeof window === 'undefined') return [];
    return Array.from({ length: 12 }, () => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      duration: 5 + Math.random() * 10,
      delay: Math.random() * 5,
    }));
  }, []);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { messages, input, handleInputChange, handleSubmit, isLoading, setMessages } = useChat({
    api: '/api/chat',
    body: {
      projectId,
      mode: 'generate',
      language: 'en',
    },
    initialMessages: [{
      id: 'system-1',
      role: 'assistant' as const,
      content: `Hello! I'm Al-Murshid, your assistant for planning the "${projectName}" project. Let me help you understand your project completely.

Tell me about:
• What is the project idea and its goal?
• What technologies or tools are you planning to use?
• What is the target timeline for completing the project?
• Are there any special requirements or constraints to consider?

The more detailed the information, the better and more accurate the plan will be! 🎯`
    }],
    onError: (error) => {
      console.error('Chat error:', error);
      setError('Connection error. Please try again.');
    }
  });

  // Check if AI is ready to generate
  const canGenerate = isReadyToGenerate(messages as any[]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleGeneratePlan = async () => {
    if (!canGenerate || isGenerating) return;

    setIsGenerating(true);
    setError(null);
    
    try {
      // Send all conversation messages to generate-plan API
      // API will: 1) Format conversation 2) Call AI to create structured plan 3) Save to DB
      const response = await fetch('/api/generate-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messages.map(m => ({
            role: m.role,
            content: m.content
          })),
          projectId,
          language: 'en',
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.details || 'Failed to generate plan');
      }
      
      if (result.success) {
        setGenerationComplete(true);
        // Plan created successfully - redirect to project dashboard
        setTimeout(() => {
          router.push(`/dashboard/${projectId}`);
          router.refresh();
        }, 2000);
      }
    } catch (error) {
      console.error('Error generating plan:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate plan');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-bg)] text-[var(--color-ink)] relative overflow-hidden" dir="ltr">
      <style jsx>{`
        @keyframes gridPulse {
          0%, 100% { opacity: 0.1; }
          50% { opacity: 0.2; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          25% { transform: translateY(-20px) translateX(10px); }
          75% { transform: translateY(20px) translateX(-10px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes celebrate {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
        @keyframes confetti {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(500px) rotate(720deg); opacity: 0; }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        .animate-shimmer {
          animation: shimmer 3s ease-in-out infinite;
        }
        .animate-celebrate {
          animation: celebrate 2s ease-in-out infinite;
        }
        .animate-confetti {
          animation: confetti 3s ease-out forwards;
        }
      `}</style>
      {/* Animated Background Grid */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: 'linear-gradient(var(--color-border) 1px, transparent 1px), linear-gradient(90deg, var(--color-border) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          animation: 'gridPulse 20s ease-in-out infinite'
        }}></div>
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {isMounted && particles.map((particle: any, i: number) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-[var(--color-accent)] rounded-full opacity-30"
            style={{
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              animation: `float ${particle.duration}s ease-in-out infinite`,
              animationDelay: `${particle.delay}s`
            }}
          />
        ))}
      </div>



      <div className="flex-1 flex flex-col gap-4 px-6 py-8 max-w-5xl mx-auto w-full relative z-10">
        {/* Header - Gamified */}
        <div className="relative border-b-2 border-[var(--color-border)] pb-4 bg-[var(--color-surface)]/50 backdrop-blur-sm p-4 shadow-lg">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--color-accent)] to-transparent"></div>
          
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-[var(--color-accent)] animate-pulse" />
                <div className="text-xs font-mono uppercase tracking-widest text-[var(--color-accent)] font-bold">
                  🎯 INITIAL GENERATION
                </div>
                <div className="px-2 py-0.5 bg-[var(--color-accent)]/20 border border-[var(--color-accent)]/40 text-[10px] font-mono text-[var(--color-accent)]">
                  LEVEL {userLevel}
                </div>
              </div>
              <div className="text-2xl font-bold bg-gradient-to-r from-[var(--color-ink)] to-[var(--color-accent)] bg-clip-text text-transparent">
                {projectName}
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-[var(--color-ink-soft)] bg-[var(--color-surface)] px-4 py-3 border-2 border-[var(--color-border)] shadow-md">
              <Zap className="w-4 h-4 text-[var(--color-accent)]" />
              <div>
                <div className="font-bold text-[var(--color-accent)]">
                  ONE TIME
                </div>
                <div className="text-[10px]">
                  SINGLE USE
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Info Banner - Gamified */}
        {!canGenerate && !generationComplete && (
          <div className="relative bg-gradient-to-r from-[var(--color-accent)]/10 to-[var(--color-accent)]/5 border-2 border-[var(--color-accent)]/30 p-5 text-sm overflow-hidden group hover:border-[var(--color-accent)]/50 transition-all">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--color-accent)] via-[var(--color-accent)]/50 to-transparent"></div>
            <div className="flex items-start gap-4 relative z-10">
              <div className="p-2 bg-[var(--color-accent)]/20 border border-[var(--color-accent)]/40 rounded-full">
                <Sparkles className="w-6 h-6 text-[var(--color-accent)] animate-pulse" />
              </div>
              <div className="flex-1">
                <div className="font-bold text-[var(--color-accent)] mb-2 flex items-center gap-2 text-base">
                  <Star className="w-4 h-4" />
                  Talk to Al-Murshid to Build Your Plan
                </div>
                <div className="text-[var(--color-ink-soft)] leading-relaxed">
                  Share your project details, required technologies, and desired goals. Al-Murshid will analyze the conversation and generate a comprehensive plan with detailed tasks and clear phases.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Chat Messages - Gamified */}
        <div className="flex-1 overflow-hidden relative" style={{ minHeight: '50vh' }}>
          <div className="h-full overflow-y-auto px-2 py-4 space-y-4 bg-[var(--color-bg)]" dir="ltr">
            {messages.filter(m => m.role !== 'system').map((m, index) => (
              <div 
                key={m.id} 
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div
                  className={`group max-w-3xl px-5 py-4 border-2 relative overflow-hidden transition-all hover:scale-[1.02] ${
                    m.role === 'user'
                      ? 'bg-gradient-to-br from-[var(--color-accent)] to-[var(--color-accent-strong)] border-[var(--color-accent)] text-white shadow-lg hover:shadow-xl'
                      : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-ink)] hover:border-[var(--color-accent)]/30 shadow-md'
                  }`}
                >
                  {/* Shine effect on hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000 pointer-events-none"></div>
                  
                  <div className={`flex items-center gap-2 text-[10px] uppercase font-mono tracking-widest mb-2 font-bold ${
                    m.role === 'user' ? 'text-white/90' : 'text-[var(--color-accent)]'
                  }`}>
                    {m.role === 'user' ? (
                      <>
                        <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        <span>👤 YOU</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3" />
                        <span>🤖 AL-MURSHID</span>
                      </>
                    )}
                  </div>
                  <div className="text-sm leading-relaxed relative z-10">
                    {m.role === 'assistant' ? (
                      <ReactMarkdown 
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                          ul: ({node, ...props}) => <ul className="list-disc list-inside mb-2 space-y-1" {...props} />,
                          ol: ({node, ...props}) => <ol className="list-decimal list-inside mb-2 space-y-1" {...props} />,
                          li: ({node, ...props}) => <li className="ml-2" {...props} />,
                          h1: ({node, ...props}) => <h1 className="text-lg font-bold mb-2 mt-3" {...props} />,
                          h2: ({node, ...props}) => <h2 className="text-base font-bold mb-2 mt-2" {...props} />,
                          h3: ({node, ...props}) => <h3 className="text-sm font-bold mb-1 mt-2" {...props} />,
                          code: ({node, inline, ...props}: any) => 
                            inline ? 
                              <code className="bg-[var(--color-surface-alt)] text-[var(--color-ink)] px-1 py-0.5 rounded text-xs font-mono" {...props} /> : 
                              <code className="block bg-[var(--color-surface)] text-[var(--color-ink)] p-2 rounded my-2 text-xs font-mono overflow-x-auto border border-[var(--color-border)]" {...props} />,
                          strong: ({node, ...props}) => <strong className="font-bold text-[var(--color-ink)]" {...props} />,
                          em: ({node, ...props}) => <em className="italic" {...props} />,
                          a: ({node, ...props}) => <a className="underline hover:text-white" {...props} />,
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
              <div className="flex justify-start animate-fadeIn">
                <div className="max-w-3xl px-5 py-4 bg-[var(--color-surface)] border-2 border-[var(--color-accent)]/50 text-[var(--color-ink)] shadow-lg">
                  <div className="flex items-center gap-2 text-[10px] uppercase font-mono tracking-widest text-[var(--color-accent)] mb-2 font-bold">
                    <Sparkles className="w-3 h-3 animate-pulse" />
                    <span>🤖 AL-MURSHID</span>
                  </div>
                  <div className="text-sm leading-relaxed flex items-center gap-2">
                    <Zap className="w-4 h-4 text-[var(--color-accent)] animate-pulse" />
                    <span className="inline-block w-2 h-2 bg-[var(--color-accent)] rounded-full animate-pulse"></span>
                    <span className="inline-block w-2 h-2 bg-[var(--color-accent)] rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></span>
                    <span className="inline-block w-2 h-2 bg-[var(--color-accent)] rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Error Display - Gamified */}
        {error && (
          <div className="relative bg-red-500/10 border-2 border-red-500/30 p-5 text-sm flex items-start gap-4 overflow-hidden animate-shake">
            <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
            <div className="p-2 bg-red-500/20 border border-red-500/40 rounded-full">
              <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
            </div>
            <div className="flex-1">
              <div className="font-bold text-red-500 mb-1 flex items-center gap-2">
                <Zap className="w-4 h-4" />
                ERROR OCCURRED
              </div>
              <div className="text-[var(--color-ink-soft)]">{error}</div>
            </div>
          </div>
        )}

        {/* Generate Button - Ultra Gamified */}
        {canGenerate && !generationComplete && (
          <div className="relative flex items-center justify-center py-6 border-y-2 border-green-500/30 bg-gradient-to-r from-green-500/5 via-green-500/10 to-green-500/5 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-500/20 to-transparent animate-shimmer"></div>
            
            <button
              onClick={handleGeneratePlan}
              disabled={isGenerating}
              className={`group relative inline-flex items-center gap-4 px-10 py-5 text-lg font-black transition-all border-2 overflow-hidden ${
                isGenerating
                  ? 'bg-gray-600 border-gray-600 cursor-not-allowed text-white'
                  : 'bg-gradient-to-r from-green-600 to-green-500 border-green-400 hover:from-green-500 hover:to-green-600 text-white shadow-2xl hover:shadow-green-500/50 hover:scale-110 active:scale-95'
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700"></div>
              
              {isGenerating ? (
                <>
                  <div className="relative flex items-center gap-3">
                    <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span className="font-mono">
                      GENERATING... MAY TAKE A MINUTE
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <Trophy className="w-7 h-7 animate-bounce" />
                  <span className="relative z-10 font-mono tracking-wide">
                    ✨ GENERATE FULL PLAN NOW
                  </span>
                  <Sparkles className="w-7 h-7 animate-pulse" />
                </>
              )}
            </button>
          </div>
        )}
        
        {/* Success Message - Gamified */}
        {generationComplete && (
          <div className="relative flex items-center justify-center py-8 border-y-2 border-green-500 bg-gradient-to-r from-green-500/10 via-green-500/20 to-green-500/10 overflow-hidden animate-celebrate">
            {isMounted && (
              <div className="absolute inset-0">
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute text-2xl animate-confetti"
                    style={{
                      left: `${Math.random() * 100}%`,
                      animationDelay: `${Math.random() * 2}s`,
                      animationDuration: `${2 + Math.random() * 2}s`
                    }}
                  >
                    {['🎉', '✨', '🎊', '⭐', '🏆'][Math.floor(Math.random() * 5)]}
                  </div>
                ))}
              </div>
            )}
            
            <div className="relative flex items-center gap-4 text-green-500 font-black text-xl">
              <div className="p-3 bg-green-500/20 border-2 border-green-500 rounded-full animate-bounce">
                <CheckCircle className="w-8 h-8" />
              </div>
              <div>
                <div className="font-mono mb-1">
                  ✅ PLAN GENERATED SUCCESSFULLY!
                </div>
                <div className="text-sm text-green-600 font-normal">
                  Redirecting to project dashboard...
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Input Area - Gamified */}
        <div className="relative flex flex-col gap-3 bg-gradient-to-br from-[var(--color-surface)] to-[var(--color-surface-alt)] p-5 border-2 border-[var(--color-border)] shadow-xl">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--color-accent)] via-transparent to-[var(--color-accent)]"></div>
          
          <form onSubmit={handleSubmit} className="flex items-center gap-3">
            <div className="flex-1 relative group">
              <input
                value={input}
                onChange={handleInputChange}
                disabled={isLoading || isGenerating || generationComplete}
                className="w-full px-5 py-4 bg-[var(--color-bg)] border-2 border-[var(--color-border)] text-[var(--color-ink)] placeholder-[var(--color-ink-soft)] focus:outline-none focus:border-[var(--color-accent)] disabled:opacity-50 font-mono transition-all group-hover:border-[var(--color-accent)]/30"
                placeholder="Type your message here... (Tell Al-Murshid about your ideas and requirements)"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <Zap className="w-4 h-4 text-[var(--color-accent)]/30 group-hover:text-[var(--color-accent)] transition-colors" />
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading || isGenerating || generationComplete || !input.trim()}
              className="group relative inline-flex items-center gap-2 px-7 py-4 bg-gradient-to-r from-[var(--color-accent)] to-[var(--color-accent-strong)] text-white font-mono font-black hover:from-[var(--color-accent-strong)] hover:to-[var(--color-accent)] transition-all disabled:opacity-50 disabled:cursor-not-allowed border-2 border-[var(--color-accent)] hover:border-white/30 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700"></div>
              <Send className="w-5 h-5 relative z-10" />
              <span className="relative z-10">SEND</span>
            </button>
          </form>

          {canGenerate && !generationComplete && (
            <div className="relative text-xs text-center text-green-500 font-mono bg-gradient-to-r from-green-500/5 via-green-500/10 to-green-500/5 py-3 px-4 border-2 border-green-500/30 font-bold overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-green-500/20 to-transparent animate-shimmer"></div>
              <div className="relative z-10 flex items-center justify-center gap-2">
                <Trophy className="w-4 h-4 animate-bounce" />
                <span>
                  ✅ SUFFICIENT INFO COLLECTED • AL-MURSHID READY TO GENERATE
                </span>
                <Star className="w-4 h-4 animate-pulse" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
