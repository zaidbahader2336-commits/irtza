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
  ArrowRight,
  Image as ImageIcon,
  ExternalLink
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { TopicExplanation } from '../../types';
import { generatePDF, PDFItem } from '../../lib/pdf';
import { saveToUserHistory } from '../../lib/userData';

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
  const [level, setLevel] = useState('Intermediate');
  const [gradeLevel, setGradeLevel] = useState('High School (Grade 9-10)');
  const [language, setLanguage] = useState('English');
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState<TopicExplanation | null>(null);

  // Pexels API integration states
  const [pexelsPhotos, setPexelsPhotos] = useState<any[]>([]);
  const [pexelsQuery, setPexelsQuery] = useState('');
  const [pexelsLoading, setPexelsLoading] = useState(false);
  const [pexelsError, setPexelsError] = useState<string | null>(null);
  const [downloadingPDF, setDownloadingPDF] = useState(false);

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
    if (!base) return ['educational diagram', 'science science'];

    const tags = [base];
    const lower = base.toLowerCase();

    // Dynamically design smart textbook queries depending on matched academic domains
    if (lower.includes('cell') || lower.includes('bio') || lower.includes('plant') || lower.includes('animal') || lower.includes('mitosis') || lower.includes('chloroplast') || lower.includes('photic') || lower.includes('photosynthesis')) {
      tags.push(`${base} cell biology`);
      tags.push("biology diagram model");
      tags.push("laboratory science");
    } else if (lower.includes('heart') || lower.includes('brain') || lower.includes('body') || lower.includes('muscle') || lower.includes('organ') || lower.includes('anatomy') || lower.includes('bone') || lower.includes('eye')) {
      tags.push(`${base} anatomy`);
      tags.push("medical blueprint");
      tags.push("human organ model");
    } else if (lower.includes('atom') || lower.includes('molecule') || lower.includes('chem') || lower.includes('acid') || lower.includes('bond') || lower.includes('reaction')) {
      tags.push(`${base} molecular model`);
      tags.push("chemistry concept");
      tags.push("atomic schematic");
    } else if (lower.includes('earth') || lower.includes('planet') || lower.includes('star') || lower.includes('space') || lower.includes('solar') || lower.includes('orbit')) {
      tags.push(`${base} solar system`);
      tags.push("planetary scheme");
      tags.push("space textbook graphic");
    } else {
      // General science topics
      tags.push(`${base} diagram model`);
      tags.push(`${base} illustration schematic`);
      tags.push("scientific visual aid");
    }

    return Array.from(new Set(tags)).filter(t => t && t.trim().length > 2).slice(0, 5);
  };

  const fetchPexelsDiagrams = async (searchTerm: string) => {
    if (!searchTerm || !searchTerm.trim()) return;
    setPexelsLoading(true);
    setPexelsError(null);
    try {
      const res = await fetch(`/api/pexels-search?query=${encodeURIComponent(searchTerm)}&per_page=12`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch images from Pexels.");
      }
      
      let photos = data.photos || [];

      // Smart Broad Fallback if 0 results
      if (photos.length === 0) {
        let fallbackTerm = "science diagram";
        const lower = searchTerm.toLowerCase();
        if (lower.includes('cell') || lower.includes('bio') || lower.includes('plant') || lower.includes('animal') || lower.includes('mitosis') || lower.includes('photosynthesis')) {
          fallbackTerm = "biology model";
        } else if (lower.includes('heart') || lower.includes('brain') || lower.includes('body') || lower.includes('anatomy') || lower.includes('bone') || lower.includes('kidney') || lower.includes('liver')) {
          fallbackTerm = "human anatomy model";
        } else if (lower.includes('atom') || lower.includes('molecular') || lower.includes('chem') || lower.includes('reaction') || lower.includes('acid') || lower.includes('element')) {
          fallbackTerm = "chemistry formula illustration";
        } else if (lower.includes('space') || lower.includes('star') || lower.includes('planet') || lower.includes('system') || lower.includes('solar') || lower.includes('orbit')) {
          fallbackTerm = "solar system space";
        }

        console.warn(`0 results for "${searchTerm}", trying fallback search: "${fallbackTerm}"`);
        const fallbackRes = await fetch(`/api/pexels-search?query=${encodeURIComponent(fallbackTerm)}&per_page=12`);
        const fallbackData = await fallbackRes.json();
        if (fallbackRes.ok && fallbackData.photos && fallbackData.photos.length > 0) {
          photos = fallbackData.photos;
        }
      }

      setPexelsPhotos(photos);
    } catch (err: any) {
      console.error(err);
      setPexelsError(err.message || "Unable to load diagrams from Pexels.");
    } finally {
      setPexelsLoading(false);
    }
  };

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

        // Fetch Pexels Diagrams automatically for this topic
        const cleanTopic = cleanQueryText(topic);
        const initialQuery = cleanTopic ? `${cleanTopic} science` : "educational science";
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

        // Convert and include top 2 Pexels Photos into the PDF report
        if (pexelsPhotos && pexelsPhotos.length > 0) {
          const maxPhotosToInclude = Math.min(2, pexelsPhotos.length);
          for (let i = 0; i < maxPhotosToInclude; i++) {
            const photo = pexelsPhotos[i];
            const imgUrl = photo.src.medium;
            try {
              const base64Data = await convertUrlToBase64(imgUrl);
              content.push({
                type: 'image',
                text: base64Data, // Embed the base64-encoded visual aid
              });
            } catch (err) {
              console.error(`Failed to convert Pexels image ${i} to base64:`, err);
            }
          }
        }

        await generatePDF(`${explanation.title} Lesson`, content);
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
          disabled={downloadingPDF}
          className="flex items-center gap-2 text-xs font-bold text-[#64748B] hover:text-[#3B82F6] transition-colors border border-[#E2E8F0] rounded-lg px-4 py-1.5 bg-white cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {downloadingPDF ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-slate-300 border-t-indigo-600 rounded-full animate-spin shrink-0" />
              Embedding Visuals...
            </>
          ) : (
            <>
              <Download size={14} />
              Save as Lesson PDF
            </>
          )}
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

        {/* PEXELS REFERENCE DIAGRAMS & VISUAL AIDS */}
        {explanation && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-8 bg-white border border-[#E2E8F0] rounded-2xl shadow-sm overflow-hidden text-left"
          >
            <div className="bg-gradient-to-r from-violet-50 to-indigo-50 p-6 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-violet-600/10 text-violet-600 flex items-center justify-center shadow-xs">
                  <ImageIcon size={20} />
                </div>
                <div>
                  <h3 className="font-sans font-black text-slate-800 text-lg flex items-center gap-2">
                    Pexels Reference Diagrams & Visual Aids
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase bg-violet-100 text-violet-600 px-2 py-0.5 rounded-full tracking-wider">
                      Live Visuals
                    </span>
                  </h3>
                  <p className="text-slate-500 font-medium text-xs mt-0.5">Explore diagrams, schematic graphs, or illustrations for this topic to embed in your exported lesson.</p>
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
                      placeholder="Search diagrams on Pexels (e.g. human heart, plant cell)..."
                      value={pexelsQuery}
                      onChange={(e) => setPexelsQuery(e.target.value)}
                      className="w-full text-xs font-semibold text-slate-700 placeholder-[#94A3B8] pl-10 pr-4 py-3 bg-slate-50 border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-violet-500 focus:ring-3 focus:ring-violet-500/10 transition-all leading-normal text-sm"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={pexelsLoading}
                    className="px-5 py-3 text-xs font-black rounded-xl bg-violet-600 hover:bg-violet-750 text-white flex items-center gap-1.5 transition-colors shadow-xs hover:shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {pexelsLoading ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Search size={14} />
                    )}
                    Search
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
                            ? "bg-violet-50 border-violet-200 text-violet-600"
                            : "bg-white border-[#E2E8F0] text-[#64748B] hover:bg-slate-50"
                        )}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Diagrams/Photos Grid */}
              {pexelsLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <div key={idx} className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-3 animate-pulse">
                      <div className="bg-slate-200 rounded-lg aspect-video h-40 w-full" />
                      <div className="space-y-1.5">
                        <div className="h-3 w-3/4 bg-slate-200 rounded-sm" />
                        <div className="h-2.5 w-1/2 bg-slate-200 rounded-sm" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : pexelsError ? (
                <div className="bg-amber-50 border border-amber-100 p-6 rounded-xl text-center space-y-2">
                  <AlertTriangle className="text-amber-500 mx-auto" size={24} />
                  <p className="text-xs font-bold text-amber-900">Unable to Fetch Diagrams</p>
                  <p className="text-[11px] text-amber-700 leading-relaxed max-w-lg mx-auto">
                    {pexelsError}
                  </p>
                  <p className="text-[10px] text-slate-500 max-w-sm mx-auto">
                    Make sure you have declared <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-[#E2E8F0]">PEXELS_API_KEY</code> properly in your environment secrets or backend config.
                  </p>
                </div>
              ) : pexelsPhotos.length === 0 ? (
                <div className="bg-slate-50/50 border border-[#E2E8F0] p-8 rounded-xl text-center space-y-2">
                  <ImageIcon className="text-slate-300 mx-auto" size={28} />
                  <p className="text-xs font-bold text-slate-700 text-center">No Diagrams Found</p>
                  <p className="text-[11px] text-slate-500 max-w-md mx-auto leading-relaxed">
                    Pexels returned no exact matches for <span className="font-semibold text-slate-800">"{pexelsQuery || 'your query'}"</span>. Try typing broader educational keywords (e.g. "Biology" or "Chemistry Molecule" or "Planet Space") above.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 p-3 rounded-lg flex items-center gap-1.5 animate-in fade-in">
                    <Sparkles size={14} className="shrink-0 animate-pulse text-emerald-500" />
                    <span>The top {Math.min(2, pexelsPhotos.length)} visual aid(s) shown below are automatically queued to be formatted and embedded into your PDF lesson!</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {pexelsPhotos.map((photo, iIdx) => (
                      <div 
                        key={photo.id} 
                        className={cn(
                          "group bg-white border rounded-xl p-3 shadow-3xs hover:shadow-xs transition-all flex flex-col justify-between overflow-hidden relative",
                          iIdx < 2 ? "border-emerald-200 ring-4 ring-emerald-500/5 bg-emerald-50/10 shadow-emerald-50" : "border-[#E2E8F0]"
                        )}
                      >
                        {iIdx < 2 && (
                          <div className="absolute top-4 left-4 z-10 bg-emerald-600 text-white text-[9px] font-black tracking-wider uppercase px-2 py-0.5 rounded shadow-sm">
                            Queued for PDF
                          </div>
                        )}
                        <div className="rounded-lg overflow-hidden relative aspect-video bg-slate-100 flex items-center justify-center">
                          <img 
                            src={photo.src.medium} 
                            alt={photo.alt || "Diagram image"} 
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <a 
                            href={photo.url} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70 flex items-center justify-center pointer-events-auto"
                            title="Open full page on Pexels"
                          >
                            <ExternalLink size={12} />
                          </a>
                        </div>

                        <div className="mt-3 space-y-1">
                          <p className="text-[11px] font-bold text-slate-800 line-clamp-1">
                            {photo.alt || "Educational Visual Aid"}
                          </p>
                          <div className="flex items-center justify-between">
                            <p className="text-[10px] text-slate-400 font-medium">
                              By: <a 
                                href={photo.photographer_url} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="hover:underline font-semibold text-slate-500"
                              >
                                {photo.photographer}
                              </a>
                            </p>
                            <a
                              href={photo.src.large2x || photo.src.original}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[10px] font-black text-violet-600 hover:underline flex items-center gap-0.5 font-sans"
                            >
                              View High-Res
                            </a>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-[9px] text-[#64748B] font-mono select-none text-center pt-2">
                    Visual illustrations are fetched live under CC-compliant educational guidelines using Pexels Creative Commons API.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
