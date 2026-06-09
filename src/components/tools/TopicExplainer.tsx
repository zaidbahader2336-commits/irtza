import { useState, useEffect } from 'react';
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
  ArrowRight,
  Image as ImageIcon,
  ExternalLink
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { TopicExplanation } from '../../types';
import { generatePDF, PDFItem } from '../../lib/pdf';
import { saveToUserHistory, getOrCreateDefaultUser } from '../../lib/userData';
import SpeechButton from '../SpeechButton';
import GoogleSlidesDiagramViewer from './GoogleSlidesDiagramViewer';

const convertUrlToBase64 = (url: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        try {
          const dataURL = canvas.toDataURL('image/jpeg', 0.85);
          resolve(dataURL);
        } catch (e) {
          reject(e);
        }
      } else {
        reject(new Error('Could not get 2D canvas context'));
      }
    };
    img.onerror = (err) => {
      reject(err);
    };
    img.src = url;
  });
};

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
  const [level, setLevel] = useState('Advanced');
  const [gradeLevel, setGradeLevel] = useState('Undergraduate / College');
  const [language, setLanguage] = useState('English');
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState<TopicExplanation | null>(null);

  // Gemini Diagram integration states
  const [generatedDiagramSvg, setGeneratedDiagramSvg] = useState<string>('');
  const [pexelsQuery, setPexelsQuery] = useState(''); // Hold diagram search term
  const [pexelsLoading, setPexelsLoading] = useState(false); // Map selector to same name
  const [pexelsError, setPexelsError] = useState<string | null>(null);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

  useEffect(() => {
    // Start fresh - require user input
  }, []);

  const cleanQueryText = (rawStr: string): string => {
    if (!rawStr) return '';
    // Strip file extensions, chapter titles, lesson numbers, punctuation, common filler words
    let term = rawStr
      .replace(/\.[^/.]+$/, "") 
      .replace(/\b(ch|chap|chapter|sec|section|lec|lecture|slide|week|unit|quiz|assignment|exam|test|doc|docx|ppt|pptx|pdf)\b\s*\d*/gi, "") 
      .replace(/[_-]/g, " ") 
      .replace(/[^\w\s]/g, "") 
      .trim()
      .replace(/\s+/g, " "); 
    return term;
  };

  const getSuggestedTags = () => {
    if (!topic) return [];
    const base = cleanQueryText(topic);
    if (!base) return ['educational diagram', 'science study'];

    const tags = [base];
    const lower = base.toLowerCase();

    // Dynamically design smart textbook queries depending on matched academic domains
    if (lower.includes('cell') || lower.includes('bio') || lower.includes('plant') || lower.includes('animal') || lower.includes('mitosis') || lower.includes('chloroplast') || lower.includes('photic') || lower.includes('photosynthesis')) {
      tags.push(`${base} cell structure`);
      tags.push("biological process mechanism");
    } else if (lower.includes('heart') || lower.includes('brain') || lower.includes('body') || lower.includes('muscle') || lower.includes('organ') || lower.includes('anatomy') || lower.includes('bone') || lower.includes('eye')) {
      tags.push(`${base} flow chart`);
      tags.push("anatomy schematic");
    } else if (lower.includes('atom') || lower.includes('molecule') || lower.includes('chem') || lower.includes('acid') || lower.includes('bond') || lower.includes('reaction')) {
      tags.push(`${base} molecular bonds`);
      tags.push("chemistry concept cycle");
    } else if (lower.includes('earth') || lower.includes('planet') || lower.includes('star') || lower.includes('space') || lower.includes('solar') || lower.includes('orbit')) {
      tags.push(`${base} solar orbits`);
      tags.push("space system scheme");
    } else {
      tags.push(`${base} concept flow`);
      tags.push("scientific concept cycle");
    }

    return Array.from(new Set(tags)).filter(t => t && t.trim().length > 2).slice(0, 4);
  };

  const fetchPexelsDiagrams = async (searchTerm: string) => {
    if (!searchTerm || !searchTerm.trim()) return;
    setPexelsLoading(true);
    setPexelsError(null);
    try {
      const res = await fetch('/api/generate-diagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: searchTerm }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate SVG visual illustration.");
      }
      
      if (data && data.svg) {
        setGeneratedDiagramSvg(data.svg);
      } else {
        throw new Error("No SVG visual markup was outputted from the diagram API.");
      }
    } catch (err: any) {
      console.error(err);
      setPexelsError(err.message || "Unable to generate diagram using Gemini. Please try again.");
    } finally {
      setPexelsLoading(false);
    }
  };

  const generateExplanation = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setGeneratedDiagramSvg(''); // clear previous diagram
    setPexelsError(null);
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

        // Fetch Gemini SVG Diagram automatically for this topic
        const cleanTopic = cleanQueryText(topic);
        const initialQuery = cleanTopic ? `${cleanTopic} conceptual flow` : "educational schematic";
        setPexelsQuery(initialQuery);
        fetchPexelsDiagrams(initialQuery);
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

  const handleDownload = async () => {
    if (explanation) {
      setDownloadingPDF(true);
      try {
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

        // Embed Gemini-generated vector SVG diagram into slides
        if (generatedDiagramSvg) {
          content.push({
            type: 'image',
            text: generatedDiagramSvg,
          });
        }

        await generatePDF(`${explanation.title} Lesson`, content, {
          language,
          gradeLevel
        });
        onDownload(`${explanation.title} Lesson`);
      } catch (err) {
        console.error("PDF generation layout error:", err);
      } finally {
        setDownloadingPDF(false);
      }
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-12 gap-8 h-full animate-pulse">
        <div className="col-span-12 lg:col-span-4 space-y-4">
          <div className="bg-white rounded-2xl border border-emerald-100 p-6 shadow-sm shimmer h-72 animate-pulse" />
        </div>
        <div className="col-span-12 lg:col-span-8 flex flex-col justify-center items-center py-20 bg-white rounded-2xl border border-emerald-100 shadow-sm p-10 text-center space-y-6">
          <div className="flex gap-2.5 justify-center items-center">
            <span className="w-3.5 h-3.5 bg-emerald-600 rounded-full animate-bounce" />
            <span className="w-3.5 h-3.5 bg-emerald-400 rounded-full animate-bounce delay-100" />
            <span className="w-3.5 h-3.5 bg-teal-500 rounded-full animate-bounce delay-200" />
          </div>
          <h3 className="text-lg font-bold text-emerald-800">Deconstructing topic...</h3>
          <p className="text-xs text-emerald-605 m-0.5 leading-relaxed">Building lesson structures, analogies and rendering vector SVG whiteboard slides with Gemini...</p>
          <div className="w-full max-w-md space-y-3">
            <div className="shimmer h-12 rounded-xl" />
            <div className="shimmer h-20 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!explanation) {
    return (
      <div className="grid grid-cols-12 gap-8 h-full animate-in fade-in duration-300">
        {/* Left Control Column */}
        <div className="col-span-12 lg:col-span-4 bg-white rounded-2xl border border-[#E2E8F0] p-6 flex flex-col shadow-sm">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs">
              <Book size={20} />
            </div>
            <div className="text-left">
              <h2 className="text-sm font-black text-gray-800 tracking-tight leading-none uppercase">Topic Explainer</h2>
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Lesson Deck Maker</span>
            </div>
          </div>

          <div className="space-y-4 flex-1">
            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-black uppercase tracking-wider pl-1 text-[#64748B]">Target Concept / Term</label>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter any complex term (e.g. photosynthesis, black hole, quantum tunneling, mitosis)..."
                className="w-full text-xs font-semibold text-slate-700 placeholder-[#94A3B8] p-3.5 bg-slate-50 border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-3 focus:ring-emerald-500/10 transition-all min-h-24 resize-none leading-relaxed"
              />
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-black uppercase tracking-wider pl-1 text-[#64748B]">Depth Level</label>
              <div className="flex gap-2">
                {['Beginner', 'Intermediate', 'Advanced'].map(l => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setLevel(l)}
                    className={cn(
                      "flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer",
                      level === l 
                        ? "bg-[#E6F4ED] border-emerald-300 text-[#047857]" 
                        : "bg-white border-[#E2E8F0] text-[#64748B] hover:bg-emerald-50/25"
                    )}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-black uppercase tracking-wider pl-1 text-[#64748B]">Target Grade Level</label>
              <select
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                className="w-full py-2.5 px-3 bg-slate-50 border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-emerald-500 text-xs font-bold text-slate-700"
              >
                {GRADE_LEVELS.map(g => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-[10px] font-black uppercase tracking-wider pl-1 text-[#64748B]">Target Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full py-2.5 px-3 bg-slate-50 border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-emerald-500 text-xs font-bold text-slate-700"
              >
                {LANGUAGES.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>

            <button 
              onClick={generateExplanation}
              disabled={!topic.trim() || loading}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-xl shadow-md transition-all mt-4 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2 cursor-pointer"
            >
              <Sparkles size={16} />
              Construct Landscape Slides
            </button>
          </div>
        </div>

        {/* Right Empty Preview State */}
        <div className="col-span-12 lg:col-span-8 bg-[#FAFAF8]/40 rounded-2xl border-2 border-dashed border-emerald-250 flex flex-col items-center justify-center p-12 text-center shadow-3xs min-h-[450px]">
          <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-6 shadow-4xs animate-pulse">
            <Book size={30} className="text-emerald-600 animate-pulse" />
          </div>
          <h3 className="text-[#064E3B] text-lg font-black tracking-tight uppercase">Ready to explain your Topic</h3>
          <p className="text-emerald-800/60 mt-2 max-w-sm text-xs font-semibold leading-relaxed">
            Enter any topic or concept. We'll decompose it into landscape PowerPoint-style slides, rich analogies, visual structures, common misconceptions, and generate an on-demand custom SVG vector whiteboard diagram!
          </p>
          <div className="mt-8 flex items-center gap-1.5 text-emerald-600 text-xs font-black">
            <span>Use config panel on the left to start</span>
            <span className="animate-bounce">→</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-8 animate-in fade-in duration-300 text-left">
      {/* Left panel metadata & controllers */}
      <div className="col-span-12 lg:col-span-4 bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm space-y-4 self-start">
        <div className="flex items-center gap-3 border-b border-gray-105 pb-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs">
            <Book size={20} />
          </div>
          <div className="text-left">
            <h2 className="text-xs font-black text-gray-800 tracking-tight uppercase leading-none">Topic Explainer</h2>
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Lesson Complete</span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-[#FAFCFB] rounded-xl p-4 text-left border border-emerald-100 space-y-1.5">
            <p className="text-[9px] font-extrabold uppercase tracking-widest text-emerald-700">Concept Scope</p>
            <p className="text-xs font-extrabold text-[#064E3B] leading-snug">{explanation.title}</p>
            <p className="text-[10px] font-bold text-emerald-600 leading-relaxed capitalize">
              Targeted towards {gradeLevel.toLowerCase()} readers in {language}.
            </p>
          </div>

          <button
            onClick={handleDownload}
            disabled={downloadingPDF}
            className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center gap-2 transition-transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer shadow-md hover:shadow-lg disabled:opacity-50"
          >
            {downloadingPDF ? (
              <span className="inline-flex items-center gap-1.5 font-bold">
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                RENDERING SLIDES...
              </span>
            ) : (
              <>
                <Download size={14} />
                DOWNLOAD LANDSCAPE SLIDES (PDF)
              </>
            )}
          </button>

          <button
            onClick={() => setExplanation(null)}
            className="w-full py-2.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer border border-[#E2E8F0]"
          >
            Explain Another Concept
          </button>
        </div>
      </div>

      {/* Right panel output detail & Slides Preview */}
      <div className="col-span-12 lg:col-span-8 space-y-6">
        {/* Core Lesson Information */}
        <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-emerald-50 to-green-50/40 p-5 border-b border-gray-100 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shadow-3xs">
              <Lightbulb size={16} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-gray-800 uppercase tracking-tight">Active Slides Presentation Preview</h3>
              <p className="text-[11px] text-gray-400 font-medium font-sans">See the generated landscape presentation deck that will compile inside your PDF file.</p>
            </div>
          </div>

          <div className="p-6 space-y-6">
             {/* Title & Exec Summary */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-4">
                <h1 className="text-xl font-black text-[#047857] leading-tight tracking-tight">{explanation.title}</h1>
                <SpeechButton text={explanation.title} />
              </div>
              <div className="flex items-start justify-between gap-4 bg-[#FAFCFB] p-4.5 border border-emerald-100 rounded-xl shadow-4xs">
                <p className="text-xs font-semibold text-slate-600 leading-relaxed text-justify flex-1">
                  {explanation.summary}
                </p>
                <SpeechButton text={explanation.summary} className="scale-90 shrink-0" />
              </div>
            </div>

            {/* Foundations */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 shadow-sm">
                  <Book size={14} />
                </div>
                <h3 className="font-extrabold uppercase tracking-wider text-[10px] text-[#64748B]">Essential Foundations</h3>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {explanation.keyConcepts.map((c, i) => (
                  <div 
                    key={i} 
                    className="p-3.5 rounded-xl bg-white border border-emerald-100 flex items-center justify-between gap-2.5 shadow-3xs hover:border-emerald-300 transition-all text-left"
                  >
                    <div className="flex items-start gap-2 flex-1">
                      <ArrowRightCircle size={15} className="text-[#047857] mt-0.5 shrink-0" />
                      <span className="text-xs font-bold text-gray-800 leading-snug">{c}</span>
                    </div>
                    <SpeechButton text={c} className="scale-75 shrink-0" />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
             {/* Mental Model */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 shadow-sm">
                  <Lightbulb size={14} />
                </div>
                <h3 className="font-extrabold uppercase tracking-wider text-[10px] text-[#64748B]">Real World Metaphor</h3>
              </div>
              <div className="p-5 rounded-xl bg-emerald-50/10 border border-emerald-100/60 pl-6 relative text-left flex items-start justify-between gap-4">
                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 opacity-50" />
                <p className="text-emerald-950 text-xs font-semibold leading-relaxed flex-1">
                    {explanation.analogy}
                </p>
                <SpeechButton text={explanation.analogy} className="scale-90 shrink-0" />
              </div>
            </div>

            {/* Detailed Explanation */}
            {explanation.detailedExplanation && (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 shadow-sm">
                      <FileText size={14} />
                    </div>
                    <h3 className="font-extrabold uppercase tracking-wider text-[10px] text-[#64748B]">Classroom Breakdown Detail</h3>
                  </div>
                  <SpeechButton text={explanation.detailedExplanation} />
                </div>
                <div className="p-5 rounded-xl bg-white border border-[#E2E8F0] shadow-sm text-xs leading-relaxed text-gray-700 text-justify">
                  <div className="markdown-body">
                    <ReactMarkdown>{explanation.detailedExplanation}</ReactMarkdown>
                  </div>
                </div>
              </div>
            )}

            {/* Common Pitfalls - styled list */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-550 flex items-center justify-center shrink-0 shadow-sm">
                  <AlertTriangle size={14} />
                </div>
                <h3 className="font-extrabold uppercase tracking-wider text-[10px] text-[#64748B]">Mistakes & Crucial Misconceptions</h3>
              </div>
              <div className="flex flex-col gap-2">
                {explanation.misconceptions.map((m, i) => (
                  <div key={i} className="flex items-center justify-between gap-2.5 text-xs font-bold text-rose-800 bg-rose-50/40 px-4 py-2.5 rounded-lg border border-rose-100">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-450 shrink-0" />
                      <span className="leading-snug">{m}</span>
                    </div>
                    <SpeechButton text={m} className="scale-75 shrink-0 shadow-sm" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

        {/* GEMINI DIAGRAMS & ILLUSTRATIONS (GREEN THEMED WHITEBOARD) */}
        {explanation && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-8 bg-white border border-[#E2E8F0] rounded-2xl shadow-sm overflow-hidden"
          >
            <div className="bg-gradient-to-r from-emerald-50 to-green-50/40 p-6 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600/10 text-emerald-600 flex items-center justify-center shadow-xs">
                  <ImageIcon size={20} />
                </div>
                <div>
                  <h3 className="font-sans font-black text-[#032F20] text-base flex flex-wrap items-center gap-2">
                    Gemini Live Academic Diagram Writer
                    <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase bg-emerald-100 text-emerald-700 border border-emerald-300 px-2.5 py-0.5 rounded-full tracking-wider">
                      Vector SVG
                    </span>
                  </h3>
                  <p className="text-emerald-800/70 font-semibold text-xs mt-0.5">Generate scientifically and educationally accurate conceptual whiteboard designs using Gemini on-demand.</p>
                </div>
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              {/* Search input & Suggested tag buttons */}
              <div className="flex flex-col gap-4">
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    fetchPexelsDiagrams(pexelsQuery);
                  }}
                  className="flex gap-2"
                >
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="text"
                      placeholder="Specify a diagram topic to draw (e.g. water cycle, heart diagram, food chain)..."
                      value={pexelsQuery}
                      onChange={(e) => setPexelsQuery(e.target.value)}
                      className="w-full text-xs font-semibold text-slate-700 placeholder-[#94A3B8] pl-10 pr-4 py-3 bg-slate-50 border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-3 focus:ring-emerald-500/10 transition-all leading-normal"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={pexelsLoading}
                    className="px-5 py-3 text-xs font-black rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition-colors shadow-xs hover:shadow-md cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    {pexelsLoading ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Sparkles size={14} className="animate-pulse" />
                    )}
                    Render Diagram
                  </button>
                </form>

                {/* Suggested tags */}
                {getSuggestedTags().length > 0 && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] uppercase font-extrabold tracking-wider text-[#94A3B8] mr-1.5">Suggested:</span>
                    {getSuggestedTags().map((tag, tIdx) => (
                      <button
                        key={tIdx}
                        type="button"
                        onClick={() => {
                          setPexelsQuery(tag);
                          fetchPexelsDiagrams(tag);
                        }}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer shadow-3xs",
                          pexelsQuery === tag
                            ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                            : "bg-white border-[#E2E8F0] text-[#64748B] hover:bg-[#F2FAF6]"
                        )}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Vector SVG Panel */}
              {pexelsLoading ? (
                <div className="bg-slate-50 border border-[#E2E8F0] rounded-xl p-8 text-center space-y-3 flex flex-col justify-center items-center animate-pulse">
                  <span className="w-10 h-10 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin" />
                  <p className="text-xs font-black text-slate-700">Writing vector diagram code with Gemini...</p>
                  <p className="text-[10px] font-bold text-slate-500">Creating custom annotations and clean educational schemas.</p>
                </div>
              ) : pexelsError ? (
                <div className="bg-amber-50 border border-amber-100 p-6 rounded-xl text-center space-y-2">
                  <AlertTriangle className="text-amber-500 mx-auto" size={24} />
                  <p className="text-xs font-bold text-amber-900">Unable to Render SVG Diagram</p>
                  <p className="text-[11px] text-amber-700 leading-relaxed max-w-lg mx-auto">
                    {pexelsError}
                  </p>
                </div>
              ) : !generatedDiagramSvg ? (
                <div className="bg-[#FAFDFB] border border-dashed border-emerald-250 p-8 rounded-xl text-center space-y-2">
                  <ImageIcon className="text-emerald-250 mx-auto" size={32} />
                  <p className="text-xs font-bold text-emerald-800 text-center">No Diagram Rendered Yet</p>
                  <p className="text-[11px] text-emerald-600/70 max-w-md mx-auto leading-relaxed">
                    Click one of the suggested scientific terms above or enter a detailed custom layout term and hit "Render Diagram" to trigger Gemini. This drawing will be automatically embedded as a presentation slide in your exported PDF!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-xs font-bold text-emerald-700 bg-[#E6F7F0] border border-emerald-100 p-3.5 rounded-lg flex items-center gap-1.5 animate-in fade-in">
                    <Sparkles size={14} className="shrink-0 text-emerald-500" />
                    <span>The academic whiteboard workspace is active. Customize or present using Google Slides widgets below!</span>
                  </div>
                  
                  <GoogleSlidesDiagramViewer 
                    topic={pexelsQuery || topic} 
                    defaultSvg={generatedDiagramSvg} 
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
