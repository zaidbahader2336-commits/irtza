import { useState } from 'react';
import { motion } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { 
  Sparkles, 
  Lightbulb,
  AlertTriangle,
  ArrowRightCircle,
  Download,
  Book,
  Search,
  Layout,
  FileText,
  ArrowRight
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { TopicExplanation } from '../../types';
import { generatePDF, PDFItem } from '../../lib/pdf';
import { saveToUserHistory } from '../../lib/userData';

interface Props {
  onDownload: (name: string) => void;
}

const GRADE_LEVELS = [
  'Elementary School (Grade 1-5)',
  'Middle School (Grade 6-8)',
  'High School (Grade 9-10)',
  'Higher Secondary (Grade 11-12)',
  'Undergraduate / College'
];

const LANGUAGES = [
  'English',
  'Urdu (اُردو)',
  'Hindi (हिन्दी)',
  'Spanish (Español)',
  'French (Français)',
  'German (Deutsch)',
  'Arabic (العربية)',
  'Bengali (বাংলা)'
];

export default function TopicExplainer({ onDownload }: Props) {
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState('Intermediate');
  const [gradeLevel, setGradeLevel] = useState('High School (Grade 9-10)');
  const [language, setLanguage] = useState('English');
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState<TopicExplanation | null>(null);

  const generateExplanation = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/explain-topic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, level, gradeLevel, language }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Server error: ${res.status}`);
      }

      const data = await res.json();
      if (data && data.title && data.summary) {
        setExplanation(data);
        saveToUserHistory('explanations', topic, data);
      } else {
        alert('Could not generate explanation. Please try a different topic.');
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || "An unexpected error occurred during generation.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (explanation) {
      const content: PDFItem[] = [
        { type: 'heading', text: explanation.title },
        { type: 'subheading', text: 'Executive Summary' },
        { type: 'text', text: explanation.summary },
        { type: 'heading', text: 'Key Concepts' },
        ...explanation.keyConcepts.map(c => ({ type: 'text' as const, text: `• ${c}` })),
        { type: 'heading', text: 'Real World Analogy' },
        { type: 'text', text: explanation.analogy },
      ];

      if (explanation.detailedExplanation) {
        content.push({ type: 'heading', text: 'Detailed Analysis' });
        content.push({ type: 'text', text: explanation.detailedExplanation });
      }

      if (explanation.diagramDescription) {
        content.push({ type: 'heading', text: 'Visual Reference' });
        content.push({ type: 'text', text: explanation.diagramDescription });
      }

      content.push({ type: 'heading', text: 'Common Misconceptions' });
      explanation.misconceptions.forEach(m => {
        content.push({ type: 'text' as const, text: `[!] ${m}` });
      });

      generatePDF(`${explanation.title} Lesson`, content);
      onDownload(`${explanation.title} Lesson`);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-12 gap-8 h-full animate-pulse">
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm shimmer h-72" />
        </div>
        <div className="col-span-12 lg:col-span-8 flex flex-col justify-center items-center py-20 bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-10 text-center space-y-6">
          <div className="flex gap-2.5 justify-center items-center">
            <span className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce" />
            <span className="w-3 h-3 bg-blue-500 rounded-full animate-bounce delay-100" />
            <span className="w-3 h-3 bg-[#F59E0B] rounded-full animate-bounce delay-200" />
          </div>
          <h3 className="text-lg font-bold text-gray-700">Deconstructing topic...</h3>
          <p className="text-sm text-gray-400 max-w-xs">Building analogies and mapping critical misconceptions.</p>
          <div className="w-full max-w-md space-y-4">
            <div className="shimmer h-14 rounded-xl" />
            <div className="shimmer h-24 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!explanation) {
    return (
      <div className="grid grid-cols-12 gap-8 h-full animate-in fade-in duration-300">
        <div className="col-span-12 lg:col-span-4 bg-white rounded-2xl border border-[#E2E8F0] p-8 flex flex-col shadow-sm">
          <h2 className="text-lg font-bold text-[#0F172A] mb-6">Quick Unlock</h2>
          
          <div className="space-y-6 flex-1">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider pl-1">Topic</label>
              <input 
                type="text" 
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Quantum Physics, SEO, Photosynthesis..."
                className="w-full h-11 px-4 py-3 bg-[#F8FAFF] border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#6366F1] focus:ring-3 focus:ring-[#6366F1]/10 transition-all text-sm font-medium text-gray-800 placeholder-[#94A3B8]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider pl-1">Detail level</label>
              <div className="flex gap-2">
                {['Beginner', 'Intermediate', 'Advanced'].map(l => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setLevel(l)}
                    className={cn(
                      "flex-1 h-10 rounded-lg text-xs font-bold border transition-all cursor-pointer",
                      level === l 
                        ? "bg-white border-[#F59E0B] text-[#D97706] shadow-sm shadow-amber-50" 
                        : "bg-white border-[#E2E8F0] text-[#64748B] hover:bg-amber-50/40"
                    )}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider pl-1">Target Grade Level</label>
              <select
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                className="w-full h-11 px-4 py-2 bg-[#F8FAFF] border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#6366F1] focus:ring-3 focus:ring-[#6366F1]/10 text-sm font-medium text-gray-800"
              >
                {GRADE_LEVELS.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider pl-1">Target Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full h-11 px-4 py-2 bg-[#F8FAFF] border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#6366F1] focus:ring-3 focus:ring-[#6366F1]/10 text-sm font-medium text-gray-800"
              >
                {LANGUAGES.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>

            <button 
              onClick={generateExplanation}
              disabled={!topic}
              className="w-full h-11 bg-gradient-to-r from-[#6366F1] to-[#3B82F6] hover:brightness-105 hover:scale-[1.01] active:scale-[0.98] text-white font-bold text-sm rounded-lg shadow-md transition-all mt-4 disabled:opacity-40 disabled:pointer-events-none"
            >
              Explain This
            </button>
          </div>
        </div>

        {/* Right Empty State */}
        <div className="col-span-12 lg:col-span-8 bg-white rounded-2xl border border-dashed border-[#E2E8F0] flex flex-col items-center justify-center p-12 text-center shadow-sm">
            <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mb-6">
                <Lightbulb size={32} className="text-[#F59E0B] animate-pulse" />
            </div>
            <h3 className="text-[#0F172A] text-xl font-extrabold tracking-tight">Ready to explain your Topic</h3>
            <p className="text-[#64748B] mt-2 max-w-sm text-sm font-medium">
              Understand complex academic fields using high-impact metaphors, cheat blueprints, and diagnostic pitfall tips. Define your request to begin.
            </p>
            <div className="mt-6 flex items-center gap-1.5 text-[#F59E0B] text-xs font-bold">
              <span>Use parameters config panel on the left</span>
              <ArrowRight size={14} className="animate-bounce" />
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <button 
          onClick={() => setExplanation(null)} 
          className="text-xs font-bold text-[#6366F1] hover:underline bg-[#6366F1]/5 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all"
        >
          ← Different Topic
        </button>
        <button 
          onClick={handleDownload} 
          className="flex items-center gap-2 text-xs font-bold text-[#64748B] hover:text-[#3B82F6] transition-colors border border-[#E2E8F0] rounded-lg px-4 py-1.5 bg-white cursor-pointer"
        >
          <Download size={14} />
          Save as Lesson PDF
        </button>
      </div>

      <div className="space-y-8">
        {/* Title & Summary */}
        <div className="space-y-4">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-black uppercase tracking-widest text-[#6366F1]">Concept Dossier</span>
            <h2 className="text-2xl font-black text-[#0F172A] tracking-tight">{explanation.title}</h2>
          </div>
          <div className="p-6 rounded-xl bg-white border border-[#E2E8F0] shadow-sm relative overflow-hidden pl-10">
            <div className="absolute top-0 left-0 w-2.5 h-full bg-[#6366F1]" />
            <p className="text-base leading-relaxed text-[#1E293B] font-serif italic">
              "{explanation.summary}"
            </p>
          </div>
        </div>

        {/* Foundations Map */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#3B82F6] flex items-center justify-center shrink-0 shadow-sm">
                <Book size={14} />
              </div>
              <h3 className="font-extrabold uppercase tracking-wider text-[10px] text-[#64748B]">Essential Foundations</h3>
            </div>
            
            <div className="space-y-3">
              {explanation.keyConcepts.map((c, i) => (
                <div 
                  key={i} 
                  className="p-4 rounded-xl bg-white border border-[#E2E8F0] shadow-sm flex items-start gap-3 group hover:border-[#6366F1] transition-all duration-150"
                >
                  <ArrowRightCircle size={16} className="text-[#6366F1] mt-0.5 shrink-0 group-hover:translate-x-0.5 transition-transform" />
                  <span className="text-xs font-bold text-gray-800 leading-normal">{c}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
             {/* Mental Model */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-[#F59E0B] flex items-center justify-center shrink-0 shadow-sm">
                  <Lightbulb size={14} />
                </div>
                <h3 className="font-extrabold uppercase tracking-wider text-[10px] text-[#64748B]">Mental Model Metaphor</h3>
              </div>
              <div className="p-5 rounded-xl bg-amber-50/50 border border-amber-100 pl-6 relative">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#F59E0B] opacity-50" />
                <p className="text-amber-900 text-xs font-semibold leading-relaxed">
                    {explanation.analogy}
                </p>
              </div>
            </div>

            {/* Detailed Explanation */}
            {explanation.detailedExplanation && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0 shadow-sm">
                    <FileText size={14} />
                  </div>
                  <h3 className="font-extrabold uppercase tracking-wider text-[10px] text-[#64748B]">Deep Dive Analysis</h3>
                </div>
                <div className="p-6 rounded-xl bg-white border border-[#E2E8F0] shadow-sm text-xs leading-relaxed text-gray-700">
                  <ReactMarkdown>{explanation.detailedExplanation}</ReactMarkdown>
                </div>
              </div>
            )}

            {/* Diagram Description */}
            {explanation.diagramDescription && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0 shadow-sm">
                    <Layout size={14} />
                  </div>
                  <h3 className="font-extrabold uppercase tracking-wider text-[10px] text-[#64748B]">Visual Blueprint</h3>
                </div>
                <div className="p-5 rounded-xl bg-emerald-50/50 border border-emerald-100 text-xs leading-relaxed text-emerald-800">
                  <p className="font-extrabold mb-1.5 text-emerald-950 uppercase tracking-widest text-[9px]">Recommended Visual Aid:</p>
                  {explanation.diagramDescription}
                </div>
              </div>
            )}

            {/* Common Pitfalls - styled list */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center shrink-0 shadow-sm">
                  <AlertTriangle size={14} />
                </div>
                <h3 className="font-extrabold uppercase tracking-wider text-[10px] text-[#64748B]">Common Pitfalls</h3>
              </div>
              <div className="flex flex-col gap-2">
                {explanation.misconceptions.map((m, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-xs font-bold text-rose-800 bg-rose-50/40 px-4 py-2.5 rounded-lg border border-rose-100">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                    <span className="leading-snug">{m}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
