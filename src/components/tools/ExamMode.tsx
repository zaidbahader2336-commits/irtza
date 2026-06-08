import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ClipboardCheck, 
  Timer, 
  Flag, 
  ChevronRight, 
  AlertCircle, 
  CheckCircle2, 
  XCircle,
  Download,
  ArrowRight,
  BookOpen,
  ArrowLeft,
  Layout,
  Trophy,
  GraduationCap
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { ExamPaper, MCQ, ShortQuestion, LongQuestion } from '../../types';
import { generatePDF, PDFItem } from '../../lib/pdf';
import { saveToUserHistory, getOrCreateDefaultUser } from '../../lib/userData';

type ExamStatus = 'setup' | 'active' | 'results';

interface ExamModeProps {
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

export default function ExamMode({ onDownload }: ExamModeProps) {
  // Setup State
  const [topic, setTopic] = useState('');
  const [duration, setDuration] = useState(45);
  const [mcqCount, setMcqCount] = useState(3);
  const [shortCount, setShortCount] = useState(3);
  const [longCount, setLongCount] = useState(3);
  const [gradeLevel, setGradeLevel] = useState('Undergraduate / College');
  const [language, setLanguage] = useState('English');
  const [status, setStatus] = useState<ExamStatus>('setup');

  // Exam Data
  const [exam, setExam] = useState<ExamPaper | null>(null);
  const [loading, setLoading] = useState(false);

  // Active Exam State
  const [timeLeft, setTimeLeft] = useState(0);
  const [activeSection, setActiveSection] = useState<'A' | 'B' | 'C'>('A');
  const [userAnswers, setUserAnswers] = useState<Record<string, any>>({});
  const [flagged, setFlagged] = useState<string[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Start fresh - require user input
  }, []);

  // Results State
  const [results, setResults] = useState<{ mcqScore: number; maxMcq: number } | null>(null);

  // Timer Effect
  useEffect(() => {
    if (status === 'active' && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status, timeLeft]);

  const handleGenerateExam = async () => {
    if (!topic) return;
    setLoading(true);
    try {
      const res = await fetch('/api/generate-exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, mcqCount, shortCount, longCount, gradeLevel, language }),
      });
      const data = await res.json();
      setExam(data);
      saveToUserHistory('exams', topic, data);
      setTimeLeft(duration * 60);
      setStatus('active');
      setActiveSection('A');
      setUserAnswers({});
      setFlagged([]);
    } catch (err) {
      console.error(err);
      alert('Failed to generate exam. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoSubmit = () => {
    handleSubmit();
  };

  const handleSubmit = () => {
    if (!exam) return;
    
    // Calculate MCQ Score
    let score = 0;
    exam.mcqs.forEach((q, idx) => {
      if (userAnswers[`mcq_${idx}`] === q.correctIndex) {
        score++;
      }
    });

    setResults({ mcqScore: score, maxMcq: exam.mcqs.length });
    setStatus('results');
  };

  const toggleFlag = (id: string) => {
    setFlagged(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleDownloadResults = () => {
    if (!exam) return;
    
    const content: PDFItem[] = [
      { type: 'heading', text: `Exam Report: ${topic}` },
      { type: 'text', text: `Score: ${results?.mcqScore || 0}/${results?.maxMcq || 0} in MCQs` },
      { type: 'heading', text: 'Section A: Multiple Choice Questions' },
    ];

    exam.mcqs.forEach((q, i) => {
      content.push({ type: 'subheading', text: `Q${i + 1}: ${q.question}` });
      q.options.forEach((opt, idx) => {
        const optionLetter = String.fromCharCode(65 + idx); // A, B, C, D
        content.push({ type: 'text', text: `${optionLetter}) ${opt}` });
      });
      content.push({ type: 'text', text: `Correct Answer: ${q.options[q.correctIndex]}` });
      content.push({ type: 'text', text: `Explanation: ${q.explanation}` });
    });

    content.push({ type: 'heading', text: 'Section B: Short Questions' });
    exam.shortQuestions.forEach((q, i) => {
      content.push({ type: 'subheading', text: `Q${i + 1}: ${q.question}` });
      content.push({ type: 'text', text: `Model Answer: ${q.modelAnswer}` });
    });

    content.push({ type: 'heading', text: 'Section C: Long Questions' });
    exam.longQuestions.forEach((q, i) => {
      content.push({ type: 'subheading', text: `Q${i + 1}: ${q.question}` });
      content.push({ type: 'text', text: `Model Essay: ${q.modelAnswer}` });
    });

    generatePDF(`${topic} Exam Results`, content, { isExam: true });
    onDownload(`${topic} Exam Report`);
  };

  // Timer Specific Display Logic from specifications
  const getTimerStyles = () => {
    const mins = timeLeft / 60;
    if (mins < 5) {
      return "bg-[#FFF1F2] border-[#F43F5E] text-[#881337] animate-pulse";
    }
    if (mins < 10) {
      return "bg-[#FFF7ED] border-[#F59E0B] text-[#92400E]";
    }
    return "bg-white border-[#E2E8F0] text-[#0F172A]";
  };

  if (status === 'setup') {
    return (
      <div className="grid grid-cols-12 gap-8 h-full animate-in fade-in duration-300">
        <div className="col-span-12 lg:col-span-5 bg-white rounded-2xl border border-[#E2E8F0] p-10 flex flex-col shadow-sm">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
               <Trophy size={28} />
            </div>
            <div>
              <h1 className="text-xl font-black text-[#0F172A] tracking-tight">Exam Mode</h1>
              <p className="text-xs text-[#64748B] font-bold">Simulate formal academic testing environments.</p>
            </div>
          </div>

          <div className="space-y-6 flex-1">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-[#64748B] uppercase tracking-wider pl-1">Subject/Topic</label>
              <input
                type="text"
                placeholder="e.g. Molecular Biology, Modern History..."
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full h-11 px-4 py-3 bg-[#F8FAFF] border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#6366F1] focus:ring-3 focus:ring-[#6366F1]/10 transition-all text-sm font-medium text-gray-800 placeholder-[#94A3B8]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-[#64748B] uppercase tracking-wider pl-1 font-sans">Time Duration</label>
              <div className="grid grid-cols-4 gap-2">
                {[30, 45, 60, 90].map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDuration(d)}
                    className={cn(
                      "h-10 rounded-lg border text-xs font-extrabold transition-all cursor-pointer",
                      duration === d 
                        ? "bg-gradient-to-r from-[#6366F1] to-[#3B82F6] border-transparent text-white shadow-sm" 
                        : "bg-white border-[#E2E8F0] text-[#64748B] hover:bg-indigo-50/50"
                    )}
                  >
                    {d} min
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
              <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider pl-1 font-sans">Target Language</label>
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

            <div className="space-y-4 bg-indigo-50/40 p-5 rounded-xl border border-indigo-100">
               <label className="text-[10px] font-black text-[#6366F1] uppercase tracking-widest pl-0.5">Custom Structure Configuration</label>
               
               <div className="flex items-center justify-between py-1 border-b border-indigo-100/30">
                 <div className="flex flex-col">
                   <span className="font-extrabold text-xs text-[#0F172A]">Multiple Choice (Part A)</span>
                   <span className="text-[10px] text-[#64748B] font-medium">Auto evaluated</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setMcqCount(Math.max(5, mcqCount - 5))} className="w-8 h-8 rounded-lg bg-white border border-[#E2E8F0] hover:bg-gray-50 flex items-center justify-center font-bold text-xs shadow-xs cursor-pointer">-</button>
                    <span className="font-black w-8 text-center text-xs text-[#0F172A]">{mcqCount}</span>
                    <button type="button" onClick={() => setMcqCount(Math.min(20, mcqCount + 5))} className="w-8 h-8 rounded-lg bg-white border border-[#E2E8F0] hover:bg-gray-50 flex items-center justify-center font-bold text-xs shadow-xs cursor-pointer">+</button>
                 </div>
               </div>

               <div className="flex items-center justify-between py-1 border-b border-indigo-100/30">
                 <div className="flex flex-col">
                   <span className="font-extrabold text-xs text-[#0F172A]">Short Questions (Part B)</span>
                   <span className="text-[10px] text-[#64748B] font-medium">Conceptual keys</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setShortCount(Math.max(1, shortCount - 1))} className="w-8 h-8 rounded-lg bg-white border border-[#E2E8F0] hover:bg-gray-50 flex items-center justify-center font-bold text-xs shadow-xs cursor-pointer">-</button>
                    <span className="font-black w-8 text-center text-xs text-[#0F172A]">{shortCount}</span>
                    <button type="button" onClick={() => setShortCount(Math.min(10, shortCount + 1))} className="w-8 h-8 rounded-lg bg-white border border-[#E2E8F0] hover:bg-gray-50 flex items-center justify-center font-bold text-xs shadow-xs cursor-pointer">+</button>
                 </div>
               </div>

               <div className="flex items-center justify-between py-1">
                 <div className="flex flex-col">
                   <span className="font-extrabold text-xs text-[#0F172A]">Analytical Essay (Part C)</span>
                   <span className="text-[10px] text-[#64748B] font-medium">Thesis structures</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setLongCount(Math.max(1, longCount - 1))} className="w-8 h-8 rounded-lg bg-white border border-[#E2E8F0] hover:bg-gray-50 flex items-center justify-center font-bold text-xs shadow-xs cursor-pointer">-</button>
                    <span className="font-black w-8 text-center text-xs text-[#0F172A]">{longCount}</span>
                    <button type="button" onClick={() => setLongCount(Math.min(5, longCount + 1))} className="w-8 h-8 rounded-lg bg-white border border-[#E2E8F0] hover:bg-gray-50 flex items-center justify-center font-bold text-xs shadow-xs cursor-pointer">+</button>
                 </div>
               </div>
            </div>
          </div>

          <button
            onClick={handleGenerateExam}
            disabled={loading || !topic}
            className="w-full mt-6 h-12 bg-gradient-to-r from-[#6366F1] to-[#3B82F6] hover:brightness-105 hover:scale-[1.01] active:scale-[0.98] text-white rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-40"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Simulating Paper...</span>
              </div>
            ) : (
              <>
                <GraduationCap size={18} />
                <span>Generate Full Paper</span>
              </>
            )}
          </button>
        </div>

        {/* Right Info */}
        <div className="hidden lg:flex col-span-7 flex-col gap-6">
           <div className="flex-1 bg-white rounded-2xl border border-[#E2E8F0] p-12 flex flex-col items-center justify-center text-center shadow-sm">
              <div className="w-20 h-20 bg-indigo-50 text-indigo-500 rounded-full flex items-center justify-center mb-6">
                 <ClipboardCheck size={36} className="text-indigo-600 animate-pulse" />
              </div>
              <h2 className="text-xl font-extrabold text-[#0F172A] mb-2 leading-tight">Preparation is half the victory.</h2>
              <p className="text-[#64748B] max-w-sm text-sm font-medium">
                Simulate authentic terminal exams, including timer limits, flagged triggers to look over questions repeatedly, and full score analysis reports.
              </p>
           </div>
        </div>
      </div>
    );
  }

  // Active Exam
  if (status === 'active' && exam) {
    return (
      <div className="fixed inset-0 bg-[#F8FAFF] z-[150] flex flex-col p-6 overflow-hidden">
        {/* Header */}
        <div className="max-w-5xl mx-auto w-full flex items-center justify-between mb-8 pb-4 border-b border-[#E2E8F0]">
           <div className="flex items-center gap-3">
              <span className="px-3 py-1 bg-[#6366F1] text-white text-[10px] font-black uppercase tracking-wider rounded-lg shadow-sm">
                EXAM IN PROGRESS
              </span>
              <h1 className="text-base font-bold text-[#64748B]">{topic}</h1>
           </div>

           <div className={cn(
             "px-5 py-2 rounded-lg flex items-center gap-3 border transition-all text-xs font-bold",
             getTimerStyles()
           )}>
             <Timer size={16} />
             <span className="text-lg font-black font-mono tracking-tight">{formatTime(timeLeft)}</span>
           </div>
        </div>

        {/* Custom Section Steps */}
        <div className="max-w-5xl mx-auto w-full flex gap-3 mb-6">
           {(['A', 'B', 'C'] as const).map((s, si) => (
             <button 
              key={s}
              type="button"
              onClick={() => setActiveSection(s)}
              className={cn(
                "flex-1 h-2 rounded-full overflow-hidden transition-all relative block cursor-pointer",
                activeSection === s ? "ring-2 ring-indigo-500/25" : ""
              )}
             >
               <div 
                className={cn(
                  "h-full transition-all duration-300",
                  activeSection === s ? "bg-[#3B82F6] w-full" : (['A', 'B', 'C'].indexOf(activeSection) > si ? "bg-emerald-500 w-full" : "bg-gray-200 w-0")
                )}
               />
             </button>
           ))}
        </div>

        {/* Dynamic Panel */}
        <div className="flex-1 overflow-y-auto w-full max-w-4xl mx-auto pb-24 bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-8 max-h-[550px] custom-scrollbar">
           {activeSection === 'A' && (
             <div className="space-y-8 animate-in fade-in duration-300">
                <div className="pb-4 border-b border-[#E2E8F0]">
                   <h2 className="text-xl font-black text-[#0F172A] mb-1">Section A: MCQs</h2>
                   <p className="text-xs text-[#64748B] font-medium leading-relaxed">Select option choices. Questions are fully responsive.</p>
                </div>
                {exam.mcqs.map((q, idx) => (
                  <div key={idx} className="space-y-4">
                    <div className="flex items-start gap-3">
                       <span className="text-[10px] font-black text-[#6366F1] mt-1">Q{idx+1}</span>
                       <h3 className="text-sm font-bold text-[#0F172A] leading-normal flex-1">{q.question}</h3>
                       <button 
                         type="button"
                         onClick={() => toggleFlag(`mcq_${idx}`)}
                         className={cn("p-1.5 rounded-md transition-colors", flagged.includes(`mcq_${idx}`) ? "bg-amber-100 text-amber-600 font-bold" : "text-[#94A3B8] hover:text-[#64748B]")}
                       >
                         <Flag size={14} />
                       </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-4">
                      {q.options.map((opt, oi) => (
                        <button
                          key={oi}
                          type="button"
                          onClick={() => setUserAnswers(prev => ({ ...prev, [`mcq_${idx}`]: oi }))}
                          className={cn(
                            "p-3.5 rounded-lg text-left border transition-all text-xs font-semibold flex items-center gap-3 cursor-pointer",
                            userAnswers[`mcq_${idx}`] === oi 
                              ? "bg-indigo-50/50 border-[#6366F1] text-indigo-900 shadow-xs" 
                              : "bg-white border-[#E2E8F0] text-[#64748B] hover:bg-gray-50 hover:text-gray-800"
                          )}
                        >
                          <span className={cn(
                            "w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black",
                            userAnswers[`mcq_${idx}`] === oi ? "bg-[#6366F1] text-white" : "bg-gray-100 text-gray-400"
                          )}>{String.fromCharCode(65 + oi)}</span>
                          <span className="flex-1 text-gray-800">{opt}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
             </div>
           )}

           {activeSection === 'B' && (
             <div className="space-y-8 animate-in fade-in duration-300">
                <div className="pb-4 border-b border-[#E2E8F0]">
                   <h2 className="text-xl font-black text-[#0F172A] mb-1">Section B: Short Answers</h2>
                   <p className="text-xs text-[#64748B] font-medium leading-relaxed">Describe concise, targeted responses using the parameters below.</p>
                </div>
                {exam.shortQuestions.map((q, idx) => (
                  <div key={idx} className="space-y-3">
                    <div className="flex items-start gap-3">
                       <span className="text-[10px] font-black text-[#6366F1] mt-1">Q{idx+1}</span>
                       <h3 className="text-sm font-bold text-[#0F172A] leading-normal flex-1">{q.question}</h3>
                       <button onClick={() => toggleFlag(`short_${idx}`)} className={cn("p-1.5 rounded-md transition-colors", flagged.includes(`short_${idx}`) ? "bg-amber-100 text-amber-600" : "text-[#94A3B8] hover:text-[#64748B]")}><Flag size={14} /></button>
                    </div>
                    <textarea 
                      placeholder="Input draft short diagnostics..."
                      value={userAnswers[`short_${idx}`] || ''}
                      onChange={(e) => setUserAnswers(prev => ({ ...prev, [`short_${idx}`]: e.target.value }))}
                      className="w-full text-xs font-semibold text-gray-800 placeholder-[#94A3B8] p-4 bg-[#F8FAFF] border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#6366F1] focus:ring-3 focus:ring-[#6366F1]/10 transition-all min-h-[100px] resize-none"
                    />
                  </div>
                ))}
             </div>
           )}

           {activeSection === 'C' && (
             <div className="space-y-8 animate-in fade-in duration-300">
                <div className="pb-4 border-b border-[#E2E8F0]">
                   <h2 className="text-xl font-black text-[#0F172A] mb-1">Section C: Long Essay</h2>
                   <p className="text-xs text-[#64748B] font-medium leading-relaxed">Formulate arguments, conceptual outlines, and full answers.</p>
                </div>
                {exam.longQuestions.map((q, idx) => (
                  <div key={idx} className="space-y-3">
                    <div className="flex items-start gap-3">
                       <span className="text-[10px] font-black text-[#6366F1] mt-1">Q{idx+1}</span>
                       <h3 className="text-sm font-bold text-[#0F172A] leading-normal flex-1">{q.question}</h3>
                       <button onClick={() => toggleFlag(`long_${idx}`)} className={cn("p-1.5 rounded-md transition-colors", flagged.includes(`long_${idx}`) ? "bg-amber-100 text-amber-600" : "text-[#94A3B8] hover:text-[#64748B]")}><Flag size={14} /></button>
                    </div>
                    <textarea 
                      placeholder="Outline structured analysis papers..."
                      value={userAnswers[`long_${idx}`] || ''}
                      onChange={(e) => setUserAnswers(prev => ({ ...prev, [`long_${idx}`]: e.target.value }))}
                      className="w-full text-xs font-semibold text-gray-800 placeholder-[#94A3B8] p-4 bg-[#F8FAFF] border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#6366F1] focus:ring-3 focus:ring-[#6366F1]/10 transition-all min-h-[220px] resize-none leading-relaxed"
                    />
                  </div>
                ))}
             </div>
           )}
        </div>

        {/* Footer actions bar */}
        <div className="fixed bottom-0 left-0 right-0 h-20 bg-white border-t border-[#E2E8F0] px-6 flex items-center shadow-lg">
           <div className="max-w-5xl mx-auto w-full flex items-center justify-between">
              <div className="flex gap-2">
                 {flagged.length > 0 && (
                   <div className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-md text-[10px] font-black border border-amber-200 uppercase tracking-wider">
                     <Flag size={12} />
                     <span>{flagged.length} Keyed</span>
                   </div>
                 )}
              </div>

              <div className="flex gap-3">
                {activeSection === 'B' && (
                  <button onClick={() => setActiveSection('A')} className="flex items-center gap-1.5 px-4 h-10 bg-gray-50 text-[#64748B] hover:text-[#0F172A] rounded-lg font-bold text-xs transition-colors border border-[#E2E8F0] cursor-pointer">
                    <ArrowLeft size={14} />
                    <span>Back Section A</span>
                  </button>
                )}
                {activeSection === 'C' && (
                  <button onClick={() => setActiveSection('B')} className="flex items-center gap-1.5 px-4 h-10 bg-gray-50 text-[#64748B] hover:text-[#0F172A] rounded-lg font-bold text-xs transition-colors border border-[#E2E8F0] cursor-pointer">
                    <ArrowLeft size={14} />
                    <span>Back Section B</span>
                  </button>
                )}

                {activeSection === 'A' && (
                  <button onClick={() => setActiveSection('B')} className="flex items-center gap-1.5 px-5 h-10 bg-gradient-to-r from-[#6366F1] to-[#3B82F6] text-white rounded-lg font-bold text-xs hover:brightness-105 shadow-sm cursor-pointer">
                    <span>Part B: Short Qs</span>
                    <ArrowRight size={14} />
                  </button>
                )}
                {activeSection === 'B' && (
                  <button onClick={() => setActiveSection('C')} className="flex items-center gap-1.5 px-5 h-10 bg-gradient-to-r from-[#6366F1] to-[#3B82F6] text-white rounded-lg font-bold text-xs hover:brightness-105 shadow-sm cursor-pointer">
                    <span>Part C: Essays</span>
                    <ArrowRight size={14} />
                  </button>
                )}
                {activeSection === 'C' && (
                  <button onClick={handleSubmit} className="flex items-center gap-1.5 px-5 h-10 bg-gradient-to-r from-[#10B981] to-[#3B82F6] text-white rounded-lg font-bold text-xs hover:brightness-105 shadow-sm cursor-pointer">
                    <span>Submit & Grade</span>
                    <ClipboardCheck size={14} />
                  </button>
                )}
              </div>
           </div>
        </div>
      </div>
    );
  }

  // Scoring results view
  if (status === 'results' && exam && results) {
    return (
      <div className="space-y-10 animate-in fade-in duration-300 pb-24">
         <div className="bg-white rounded-2xl border border-[#E2E8F0] p-10 text-center shadow-sm">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xs border border-emerald-100">
               <Trophy size={28} />
            </div>
            <h1 className="text-2xl font-black text-[#0F172A] mb-1">Exam Grading Completed</h1>
            <p className="text-xs text-[#64748B] font-semibold mb-6">Diagnostic parameters performance graded for "{topic}"</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
               <div className="bg-[#F8FAFF] p-5 rounded-lg border border-[#E2E8F0] text-center">
                  <span className="text-[10px] font-black text-[#94A3B8] uppercase block mb-1">Part A: MCQ Score</span>
                  <div className="flex items-end justify-center gap-1">
                     <span className="text-3xl font-black text-[#6366F1] leading-none">{results.mcqScore}</span>
                     <span className="text-sm font-semibold text-gray-400">/ {results.maxMcq}</span>
                  </div>
               </div>
               
               <div className="bg-[#F8FAFF] p-5 rounded-lg border border-[#E2E8F0] text-center">
                  <span className="text-[10px] font-black text-[#94A3B8] uppercase block mb-1">Sections</span>
                  <div className="text-2xl font-black text-gray-800 leading-none py-1">3 of 3</div>
                  <span className="text-[9px] text-[#10B981] font-black uppercase">ALL PARTS COMPLETED</span>
               </div>

               <div className="bg-[#F8FAFF] p-5 rounded-lg border border-[#E2E8F0] text-center">
                  <span className="text-[10px] font-black text-[#94A3B8] uppercase block mb-1">Remaining Time</span>
                  <div className="text-2xl font-black text-gray-800 leading-none py-1">{formatTime(timeLeft)}</div>
                  <span className="text-[9px] text-indigo-500 font-extrabold uppercase">{timeLeft > 0 ? 'COMPLETED EARLY' : 'PRACTICE OVER'}</span>
               </div>
            </div>

            <div className="flex items-center justify-center gap-3 mt-8">
               <button onClick={handleDownloadResults} className="h-10 px-5 bg-gradient-to-r from-[#6366F1] to-[#3B82F6] text-white rounded-lg font-extrabold text-xs flex items-center gap-1.5 shadow-sm cursor-pointer hover:brightness-105 transition-all">
                  <Download size={14} />
                  <span>Download Report Pack</span>
               </button>
               <button onClick={() => setStatus('setup')} className="h-10 px-5 bg-white border border-[#E2E8F0] text-[#64748B] rounded-lg font-bold text-xs hover:bg-gray-50 transition-colors cursor-pointer">
                  New Exam Parameters
               </button>
            </div>
         </div>

         {/* Section A breakdown */}
         <div className="space-y-4">
            <h2 className="text-base font-black text-[#0F172A] flex items-center gap-1.5 pl-1.5">
               <CheckCircle2 size={16} className="text-[#10B981]" />
               Section A MCQ Audit
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {exam.mcqs.map((q, idx) => {
                 const isCorrect = userAnswers[`mcq_${idx}`] === q.correctIndex;
                 return (
                   <div key={idx} className={cn("p-6 rounded-xl border bg-white shadow-xs space-y-4", isCorrect ? "border-green-100" : "border-rose-100")}>
                      <div className="flex items-start justify-between">
                         <h3 className="text-xs font-bold text-[#0F172A] leading-relaxed flex-1 pr-4">{q.question}</h3>
                         {isCorrect ? <CheckCircle2 size={16} className="text-green-500 shrink-0 mt-0.5" /> : <XCircle size={16} className="text-rose-500 shrink-0 mt-0.5" />}
                      </div>
                      <div className="text-xs space-y-1">
                         <div className="font-semibold text-gray-500">Your Answer: <span className={cn(isCorrect ? "text-green-600" : "text-rose-600")}>{q.options[userAnswers[`mcq_${idx}`]] || 'Not Answered'}</span></div>
                         {!isCorrect && <div className="font-extrabold text-green-600">Correct Choice: {q.options[q.correctIndex]}</div>}
                      </div>
                      <div className="p-3 bg-gray-50/70 border border-[#E2E8F0] rounded-lg text-[11px] text-[#64748B] italic leading-relaxed font-sans">
                         {q.explanation}
                      </div>
                   </div>
                 );
               })}
            </div>
         </div>

         {/* Self Review Section */}
         <div className="space-y-6">
            <h2 className="text-base font-black text-[#0F172A] flex items-center gap-1.5 pl-1.5">
               <BookOpen size={16} className="text-indigo-600" />
               Self-Reference Study Guide
            </h2>
            
            <div className="space-y-4">
               {exam.shortQuestions.map((q, idx) => (
                 <div key={idx} className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
                    <div className="p-4 bg-[#F8FAFF] border-b border-[#E2E8F0] flex items-center justify-between px-6">
                       <h3 className="text-xs font-black text-[#0F172A]">Short Q{idx+1}: {q.question}</h3>
                       <div className="px-2.5 py-0.5 bg-blue-50 text-[#3B82F6] rounded-md text-[9px] font-black uppercase tracking-wider border border-blue-100">Section B</div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2">
                       <div className="p-6 border-r border-[#E2E8F0] bg-white text-xs">
                          <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider block mb-2">My Submitted Draft</label>
                          <p className="text-gray-700 leading-relaxed italic">
                             {userAnswers[`short_${idx}`] || 'No draft text input submitted.'}
                          </p>
                       </div>
                       <div className="p-6 bg-[#F8FAFF] text-xs">
                          <label className="text-[9px] font-black uppercase text-blue-500 tracking-wider block mb-2">AI Expert Guidelines</label>
                          <p className="text-gray-900 leading-relaxed font-semibold">
                             {q.modelAnswer}
                          </p>
                       </div>
                    </div>
                 </div>
               ))}
            </div>

            <div className="space-y-4 mt-6">
               {exam.longQuestions.map((q, idx) => (
                 <div key={idx} className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm overflow-hidden">
                    <div className="p-4 bg-[#F8FAFF] border-b border-[#E2E8F0] flex items-center justify-between px-6">
                       <h3 className="text-xs font-black text-[#0F172A]">Long Essay Q{idx+1}: {q.question}</h3>
                       <div className="px-2.5 py-0.5 bg-indigo-50 text-indigo-600 rounded-md text-[9px] font-black uppercase tracking-wider border border-indigo-100">Section C</div>
                    </div>
                    <div className="grid grid-cols-1 xl:grid-cols-2">
                       <div className="p-6 border-r border-[#E2E8F0] bg-white text-xs max-h-[300px] overflow-y-auto custom-scrollbar">
                          <label className="text-[9px] font-black uppercase text-gray-400 tracking-wider block mb-2">My Submitted Essay Draft</label>
                          <p className="text-[#1F2937] leading-relaxed whitespace-pre-wrap italic">
                             {userAnswers[`long_${idx}`] || 'No draft essay submitted.'}
                          </p>
                       </div>
                       <div className="p-6 bg-[#F8FAFF] text-xs max-h-[300px] overflow-y-auto custom-scrollbar">
                          <label className="text-[9px] font-black uppercase text-indigo-500 tracking-wider block mb-2">Expert Anchor Reference</label>
                          <p className="text-gray-950 leading-relaxed font-semibold whitespace-pre-wrap">
                             {q.modelAnswer}
                          </p>
                       </div>
                    </div>
                 </div>
               ))}
            </div>
         </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center p-20">
       <div className="w-10 h-10 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
