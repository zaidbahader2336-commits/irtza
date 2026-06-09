import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  Highlighter,
  Download,
  FileText,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { LongQuestion } from '../../types';
import { generatePDF, PDFItem } from '../../lib/pdf';
import { saveToUserHistory, getOrCreateDefaultUser } from '../../lib/userData';
import SpeechButton from '../SpeechButton';
import GoogleSlidesDiagramViewer from './GoogleSlidesDiagramViewer';

interface Props {
  onDownload: (name: string) => void;
}

interface QuestionWithMeta extends LongQuestion {
  keyPoints: string[];
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

export default function LongQuestions({ onDownload }: Props) {
  const [topic, setTopic] = useState('');
  const [count, setCount] = useState(3);
  const [gradeLevel, setGradeLevel] = useState('Undergraduate / College');
  const [language, setLanguage] = useState('English');
  const [loading, setLoading] = useState(false);
  const [diagramSvg, setDiagramSvg] = useState('');
  const [questions, setQuestions] = useState<QuestionWithMeta[]>([]);
  const [expanded, setExpanded] = useState<number[]>([]);
  const [highlighted, setHighlighted] = useState<number[]>([]);

  useEffect(() => {
    // Start fresh - require user input
  }, []);

  const generateQuestions = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setDiagramSvg('');
    try {
      const res = await fetch('/api/long-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, count, gradeLevel, language }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Server error: ${res.status}`);
      }

      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setQuestions(data);
        saveToUserHistory('longQs', topic, data);
        setExpanded([]);
        setHighlighted([]);

        // Fetch custom learning diagram
        try {
          const diagRes = await fetch('/api/generate-diagram', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ topic }),
          });
          if (diagRes.ok) {
            const diagData = await diagRes.json();
            if (diagData && diagData.svg) {
              setDiagramSvg(diagData.svg);
            }
          }
        } catch (diagErr) {
          console.error("Optional diagram generation failed:", diagErr);
        }

      } else {
        alert('Could not generate essay structures. Please try a different topic.');
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || "An unexpected error occurred during generation.");
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (idx: number) => {
    setExpanded(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]);
  };

  const toggleHighlight = (idx: number) => {
    setHighlighted(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [idx]);
  };

  const renderContent = (text: string, keyPoints: string[]) => {
    return (
      <div className="space-y-6">
        <div className="prose prose-slate max-w-none text-xs text-gray-700 leading-relaxed font-semibold flex items-start justify-between gap-4 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
          <ReactMarkdown>{text}</ReactMarkdown>
          <SpeechButton text={text} className="scale-90" />
        </div>

        <div className="space-y-3 pt-5 border-t border-[#E2E8F0]">
          <div className="flex items-center gap-1.5">
            <Highlighter size={14} className="text-[#06B6D4]" />
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#06B6D4]">Key Strategic Points</h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {keyPoints.map((kp, kpi) => (
              <div key={kpi} className="flex items-start justify-between gap-2.5 p-3.5 bg-cyan-50/40 rounded-lg border border-cyan-100">
                <div className="flex items-start gap-2">
                  <CheckCircle2 size={14} className="text-[#06B6D4] mt-0.5 shrink-0" />
                  <span className="text-xs font-bold text-cyan-900 leading-snug">{kp}</span>
                </div>
                <SpeechButton text={kp} className="scale-75 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const handleDownload = () => {
    const content: PDFItem[] = [
      { type: 'heading', text: `${topic} Essay Guide` },
    ];

    questions.forEach((q, i) => {
      content.push({ type: 'subheading', text: `Question ${i + 1}: ${q.question}` });
      content.push({ type: 'text', text: q.modelAnswer });
      content.push({ type: 'text', text: 'Critical Success Points:' });
      q.keyPoints.forEach(kp => {
        content.push({ type: 'text', text: `• ${kp}` });
      });
    });

    if (diagramSvg) {
      content.push({ type: 'image', text: diagramSvg });
    }

    generatePDF(`${topic} Essays`, content);
    onDownload(`${topic} Essay Guide`);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-12 gap-8 h-full animate-pulse">
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm shimmer h-[280px]" />
        </div>
        <div className="col-span-12 lg:col-span-8 flex flex-col justify-center items-center py-20 bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-10 text-center space-y-6">
          <div className="flex gap-2.5 justify-center items-center">
            <span className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce" />
            <span className="w-3 h-3 bg-blue-500 rounded-full animate-bounce delay-100" />
            <span className="w-3 h-3 bg-cyan-500 rounded-full animate-bounce delay-200" />
          </div>
          <h3 className="text-lg font-bold text-gray-700">AI is thinking...</h3>
          <p className="text-sm text-gray-400 max-w-xs">Drafting core educational thesis, this will be ready momentarily.</p>
          <div className="w-full max-w-md space-y-4">
            <div className="shimmer h-14 rounded-xl" />
            <div className="shimmer h-14 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="grid grid-cols-12 gap-8 h-full animate-in fade-in duration-300">
        <div className="col-span-12 lg:col-span-4 bg-white rounded-2xl border border-[#E2E8F0] p-8 flex flex-col shadow-sm">
          <h2 className="text-lg font-black text-[#0f172a] mb-6">Configure Essays</h2>
          
          <div className="space-y-6 flex-1">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider pl-1">Essay Topic</label>
              <input 
                type="text" 
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Industrial Revolution impact..."
                className="w-full h-11 px-4 py-3 bg-[#F8FAFF] border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#6366F1] focus:ring-3 focus:ring-[#6366F1]/10 transition-all text-sm font-medium text-gray-800 placeholder-[#94A3B8]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider pl-1">Essay Count</label>
              <div className="flex gap-2">
                {[3, 5, 8].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setCount(n)}
                    className={cn(
                      "flex-1 h-10 rounded-lg text-xs font-bold border transition-all cursor-pointer",
                      count === n 
                        ? "bg-gradient-to-r from-[#6366F1] to-[#3B82F6] text-white border-transparent" 
                        : "bg-white border-[#E2E8F0] text-[#64748B] hover:bg-indigo-50/50 hover:text-indigo-600"
                    )}
                  >
                    {n}
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
              onClick={generateQuestions}
              disabled={!topic}
              className="w-full h-11 bg-gradient-to-r from-[#6366F1] to-[#3B82F6] hover:brightness-105 hover:scale-[1.01] active:scale-[0.98] text-white font-bold text-sm rounded-lg shadow-md transition-all mt-4 disabled:opacity-40 disabled:pointer-events-none"
            >
              Structure My Essays
            </button>
          </div>
        </div>

        {/* Right Empty State */}
        <div className="col-span-12 lg:col-span-8 bg-white rounded-2xl border border-dashed border-[#E2E8F0] flex flex-col items-center justify-center p-12 text-center shadow-sm">
            <div className="w-16 h-16 rounded-full bg-cyan-50 flex items-center justify-center mb-6">
                <FileText size={32} className="text-[#06B6D4] animate-pulse" />
            </div>
            <h3 className="text-[#0F172A] text-xl font-extrabold tracking-tight">Ready to generate your Essay Questions</h3>
            <p className="text-[#64748B] mt-2 max-w-sm text-sm font-medium">
              Formulate deep structured outlines, argument mappings, and full model solutions. Specify an academic theme on the left sidebar configured panel to start.
            </p>
            <div className="mt-6 flex items-center gap-1.5 text-[#06B6D4] text-xs font-bold">
              <span>Use parameters config panel on the left</span>
              <ArrowRight size={14} className="animate-bounce" />
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <button 
          onClick={() => setQuestions([])} 
          className="text-xs font-bold text-[#6366F1] hover:underline bg-[#6366F1]/5 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all"
        >
          ← Refine Topics
        </button>
        <button 
          onClick={handleDownload} 
          className="flex items-center gap-2 text-xs font-bold text-[#64748B] hover:text-[#6366F1] transition-colors border border-[#E2E8F0] rounded-lg px-4 py-1.5 bg-white cursor-pointer"
        >
          <Download size={14} />
          Save Essay Collection
        </button>
      </div>

      <div className="space-y-4">
        {questions.map((q, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden"
          >
            <div 
              className="p-6 cursor-pointer hover:bg-[#F8FAFF] transition-colors flex items-center justify-between gap-4"
              onClick={() => toggleExpand(i)}
            >
              <div className="flex items-center gap-4 flex-1 overflow-hidden">
                <div className="w-10 h-10 rounded-xl bg-cyan-50 text-[#06B6D4] flex items-center justify-center shrink-0">
                  <FileText size={20} />
                </div>
                <div className="overflow-hidden flex-1 flex items-center justify-between gap-4">
                  <div>
                    <div className="text-[9px] font-black uppercase tracking-wider text-[#06B6D4] mb-0.5">Structure Plan {i+1}</div>
                    <h3 className="text-base font-bold text-[#0F172A] leading-snug truncate md:max-w-md">{q.question}</h3>
                  </div>
                  <SpeechButton text={q.question} className="scale-75 shrink-0 bg-white" />
                </div>
              </div>
              <div className="shrink-0">
                {expanded.includes(i) ? <ChevronUp size={18} className="text-[#94A3B8]" /> : <ChevronDown size={18} className="text-[#94A3B8]" />}
              </div>
            </div>

            <AnimatePresence>
              {expanded.includes(i) && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-[#E2E8F0] bg-[#F8FAFF]"
                >
                  <div className="p-6 space-y-6">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Structured Response Key</p>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleHighlight(i);
                        }}
                        className={cn(
                          "flex items-center gap-1.5 h-8 px-4 rounded-lg text-[10px] font-bold transition-all border shadow-xs cursor-pointer",
                          highlighted.includes(i) 
                             ? "bg-[#06B6D4] text-white border-transparent" 
                            : "bg-white border-[#E2E8F0] text-[#64748B] hover:border-[#06B6D4] hover:text-[#06B6D4]"
                        )}
                      >
                        <Highlighter size={12} />
                        {highlighted.includes(i) ? 'Hide Focus Points' : 'Highlight Argument Keys'}
                      </button>
                    </div>
                    
                    <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-xs">
                      {renderContent(q.modelAnswer, q.keyPoints)}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {diagramSvg && (
        <GoogleSlidesDiagramViewer 
          topic={topic}
          defaultSvg={diagramSvg}
        />
      )}
    </div>
  );
}
