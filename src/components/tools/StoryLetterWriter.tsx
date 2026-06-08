import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  BookOpen, 
  Mail,
  Download,
  RefreshCcw,
  Copy,
  Check,
  ArrowRight
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Story, Letter } from '../../types';
import { generatePDF, PDFItem } from '../../lib/pdf';
import { saveToUserHistory, getOrCreateDefaultUser } from '../../lib/userData';

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

export default function StoryLetterWriter({ onDownload }: Props) {
  const [mode, setMode] = useState<'story' | 'letter'>('story');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [gradeLevel, setGradeLevel] = useState('Undergraduate / College');
  const [language, setLanguage] = useState('English');

  // Story state
  const [theme, setTheme] = useState('');
  const [tone, setTone] = useState('Academic / Formal');
  const [story, setStory] = useState<Story | null>(null);

  // Letter state
  const [letterType, setLetterType] = useState('Academic Memorandum');
  const [details, setDetails] = useState('');
  const [letter, setLetter] = useState<Letter | null>(null);

  useEffect(() => {
    // Start fresh - require user input
  }, []);

  const generateStory = async () => {
    if (!theme.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/write-story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme, tone, gradeLevel, language }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Server error: ${res.status}`);
      }

      const data = await res.json();
      if (data && data.title && data.content) {
        setStory(data);
        saveToUserHistory('stories', theme, data);
      } else {
        alert('Could not generate story. Please refine your theme.');
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || "An unexpected error occurred during generation.");
    } finally {
      setLoading(false);
    }
  };

  const generateLetter = async () => {
    if (!details.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/write-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: letterType, details, gradeLevel, language }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Server error: ${res.status}`);
      }

      const data = await res.json();
      if (data && data.subject && data.body) {
        setLetter(data);
        saveToUserHistory('letters', details, data);
      } else {
        alert('Could not generate letter. Please provide more context.');
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || "An unexpected error occurred during generation.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (mode === 'story' && story) {
      const content: PDFItem[] = [
        { type: 'heading', text: story.title },
        { type: 'text', text: story.content },
      ];
      generatePDF(story.title, content);
      onDownload(story.title);
    } else if (mode === 'letter' && letter) {
      const content: PDFItem[] = [
        { type: 'heading', text: letter.subject },
        { type: 'text', text: letter.body },
      ];
      generatePDF(letter.subject, content);
      onDownload(letter.subject);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-12 gap-8 h-full animate-pulse pb-20">
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm shimmer h-80" />
        </div>
        <div className="col-span-12 lg:col-span-8 flex flex-col justify-center items-center py-24 bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-10 text-center space-y-6">
          <div className="flex gap-2.5 justify-center items-center">
            <span className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce" />
            <span className="w-3 h-3 bg-blue-500 rounded-full animate-bounce delay-100" />
            <span className="w-3 h-3 bg-cyan-500 rounded-full animate-bounce delay-200" />
          </div>
          <h3 className="text-lg font-bold text-gray-700">Composing master draft...</h3>
          <p className="text-sm text-gray-400 max-w-xs">Expanding details, adjusting tones, and formatting structural sections.</p>
          <div className="w-full max-w-sm space-y-3">
            <div className="shimmer h-8 rounded-full" />
            <div className="shimmer h-14 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-12 gap-8 h-full animate-in fade-in duration-300 pb-20">
      {/* Left Input Panel */}
      <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-8 shadow-sm flex flex-col">
          <h2 className="text-lg font-black text-[#0f172a] mb-6">Literary Engine</h2>
          
          <div className="space-y-6 flex-1">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider pl-1 font-sans">Writing Format</label>
              <div className="flex p-1 bg-[#F8FAFF] rounded-lg border border-[#E2E8F0]">
                <button 
                  type="button"
                  onClick={() => { setMode('story'); setStory(null); }}
                  className={cn(
                    "flex-1 py-1.5 rounded-md font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                    mode === 'story' ? "bg-white shadow-xs text-[#6366F1]" : "text-gray-400 hover:text-gray-600"
                  )}
                >
                  <BookOpen size={13} />
                  Story List
                </button>
                <button 
                  type="button"
                  onClick={() => { setMode('letter'); setLetter(null); }}
                  className={cn(
                    "flex-1 py-1.5 rounded-md font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer",
                    mode === 'letter' ? "bg-white shadow-xs text-[#6366F1]" : "text-gray-400 hover:text-gray-600"
                  )}
                >
                  <Mail size={13} />
                  Letter Hub
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider pl-1">Target Grade Level</label>
              <select
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                className="w-full h-11 px-4 py-2 bg-[#F8FAFF] border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#6366F1] focus:ring-3 focus:ring-[#6366F1]/10 text-xs font-bold text-gray-700"
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
                className="w-full h-11 px-4 py-2 bg-[#F8FAFF] border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#6366F1] focus:ring-3 focus:ring-[#6366F1]/10 text-xs font-bold text-gray-700"
              >
                {LANGUAGES.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
            </div>

            {mode === 'story' ? (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider pl-1">Story Theme</label>
                  <textarea 
                    value={theme}
                    onChange={(e) => setTheme(e.target.value)}
                    placeholder="e.g. A dragon who loves baking chocolate cookies..."
                    className="w-full text-xs font-medium text-gray-800 placeholder-[#94A3B8] px-4 py-3 bg-[#F8FAFF] border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#6366F1] focus:ring-3 focus:ring-[#6366F1]/10 transition-all min-h-[100px] resize-none leading-relaxed"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider pl-1">Tone Choice</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {['Funny', 'Emotional', 'Adventurous', 'Simple/Easy', 'Professional'].map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTone(t)}
                        className={cn(
                          "py-2 rounded-lg text-xs font-bold border transition-all cursor-pointer",
                          tone === t 
                            ? "bg-[#6366F1]/10 text-[#6366F1] border-[#6366F1]/20 shadow-xs" 
                            : "bg-white border-[#E2E8F0] text-gray-500 hover:bg-gray-50"
                        )}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                
                <button 
                  onClick={generateStory}
                  disabled={!theme}
                  className="w-full h-11 bg-gradient-to-r from-[#6366F1] to-[#3B82F6] hover:brightness-105 hover:scale-[1.01] active:scale-[0.98] text-white font-bold text-xs rounded-lg shadow-md transition-all mt-4 disabled:opacity-40 disabled:pointer-events-none"
                >
                  Generate Story
                </button>
              </div>
            ) : (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider pl-1">Letter Type</label>
                  <select 
                    value={letterType}
                    onChange={(e) => setLetterType(e.target.value)}
                    className="w-full h-11 px-4 py-2 bg-[#F8FAFF] border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#6366F1] focus:ring-3 focus:ring-[#6366F1]/10 transition-all text-xs font-bold text-gray-700"
                  >
                    {[
                      'Job Application', 
                      'Scholarship Application', 
                      'Personal Statement', 
                      'Admission Essay',
                      'Leave Application', 
                      'Complaint Letter', 
                      'Formal Request'
                    ].map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider pl-1">Context / Rules</label>
                  <textarea 
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Key values, background context, or instructions..."
                    className="w-full text-xs font-medium text-gray-800 placeholder-[#94A3B8] px-4 py-3 bg-[#F8FAFF] border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#6366F1] focus:ring-3 focus:ring-[#6366F1]/10 transition-all min-h-[110px] resize-none leading-relaxed"
                  />
                </div>

                <button 
                  onClick={generateLetter}
                  disabled={!details}
                  className="w-full h-11 bg-gradient-to-r from-[#3B82F6] to-[#06B6D4] hover:brightness-105 hover:scale-[1.01] active:scale-[0.98] text-white font-bold text-xs rounded-lg shadow-md transition-all mt-4 disabled:opacity-40 disabled:pointer-events-none"
                >
                  Write Letter
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Output Panel */}
      <div className="col-span-12 lg:col-span-8 flex flex-col">
        <AnimatePresence mode="wait">
          {(story || letter) ? (
            <motion.div
              key={mode}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm flex flex-col h-full overflow-hidden"
            >
              <div className="p-4 border-b border-[#E2E8F0] flex items-center justify-between px-6 bg-[#F8FAFF]">
                <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#94A3B8]">DRAFT READY</span>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleCopy(story?.content || letter?.body || '')}
                    className="w-10 h-10 rounded-lg bg-white border border-[#E2E8F0] hover:bg-gray-50 flex items-center justify-center transition-all cursor-pointer"
                    title="Copy Content"
                  >
                    {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} className="text-gray-500" />}
                  </button>
                  <button 
                    onClick={handleDownload}
                    className="w-10 h-10 rounded-lg bg-gradient-to-r from-[#6366F1] to-[#3B82F6] text-white flex items-center justify-center hover:brightness-105 transition-all shadow-sm cursor-pointer"
                    title="Download pack"
                  >
                    <Download size={16} />
                  </button>
                </div>
              </div>
              
              <div className="p-8 flex-1 overflow-y-auto max-h-[600px]">
                 <h2 className="text-xl font-bold mb-6 text-[#0F172A] tracking-tight">
                    {story?.title || letter?.subject}
                 </h2>
                 <div className="font-serif text-[#1F2937] text-sm leading-relaxed whitespace-pre-wrap">
                      {story?.content || letter?.body}
                 </div>
              </div>
            </motion.div>
          ) : (
            <div className="bg-white/50 rounded-2xl border border-dashed border-[#E2E8F0] h-full flex flex-col items-center justify-center p-12 text-center shadow-xs min-h-[400px]">
              <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mb-6">
                <RefreshCcw size={32} className="text-[#6366F1] animate-spin border-t-transparent" style={{ animationDuration: '6s' }} />
              </div>
              <h3 className="text-[#0F172A] text-xl font-extrabold tracking-tight">Manuscript Workspace</h3>
              <p className="text-[#64748B] mt-2 max-w-xs text-sm font-medium">Draft dynamic stories or administrative scholarship and requests. Input parameters on the left controls to generate pieces.</p>
              <div className="mt-6 flex items-center gap-1.5 text-[#6366F1] text-xs font-bold">
                <span>Select Story/Letter above left parameters panel</span>
                <ArrowRight size={14} className="animate-bounce" />
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
