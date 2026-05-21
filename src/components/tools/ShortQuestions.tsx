import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  ArrowRight,
  Download,
  Info,
  HelpCircle,
  Brain,
  MessageSquare
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { ShortQuestion } from '../../types';
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

export default function ShortQuestions({ onDownload }: Props) {
  const [topic, setTopic] = useState('');
  const [count, setCount] = useState(10);
  const [gradeLevel, setGradeLevel] = useState('High School (Grade 9-10)');
  const [language, setLanguage] = useState('English');
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<ShortQuestion[]>([]);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [aiFeedbacks, setAiFeedbacks] = useState<any[]>([]);
  const [checkingIdx, setCheckingIdx] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState<number[]>([]);

  const generateQuestions = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/short-questions', {
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
        saveToUserHistory('shortQs', topic, data);
        setUserAnswers(new Array(data.length).fill(''));
        setAiFeedbacks(new Array(data.length).fill(null));
        setShowAnswer([]);
      } else {
        alert('Could not generate questions. Please try a different topic.');
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || "An unexpected error occurred during generation.");
    } finally {
      setLoading(false);
    }
  };

  const toggleAnswer = (idx: number) => {
    setShowAnswer(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]);
  };

  const checkWithAI = async (idx: number) => {
    if (!userAnswers[idx].trim()) return;
    setCheckingIdx(idx);
    try {
      const res = await fetch('/api/check-short-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: questions[idx].question,
          modelAnswer: questions[idx].modelAnswer,
          userAnswer: userAnswers[idx],
          language: language
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Server error: ${res.status}`);
      }

      const data = await res.json();
      const newFeedbacks = [...aiFeedbacks];
      newFeedbacks[idx] = data;
      setAiFeedbacks(newFeedbacks);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Could not evaluate the answer.");
    } finally {
      setCheckingIdx(null);
    }
  };

  const handleDownload = () => {
    const content: PDFItem[] = [
      { type: 'heading', text: `${topic} Short Questions Study Pack` },
    ];

    questions.forEach((q, i) => {
      content.push({ type: 'subheading', text: `Q${i + 1}: ${q.question}` });
      if (userAnswers[i]) {
        content.push({ type: 'text', text: `Your Answer: ${userAnswers[i]}` });
      }
      content.push({ type: 'text', text: `Model Answer: ${q.modelAnswer}` });
      if (aiFeedbacks[i]) {
        content.push({ type: 'text', text: `Feedback (${aiFeedbacks[i].score}/10): ${aiFeedbacks[i].feedback}` });
      }
    });

    generatePDF(`${topic} Short Qs`, content);
    onDownload(`${topic} Short Qs`);
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
            <span className="w-3 h-3 bg-cyan-500 rounded-full animate-bounce delay-200" />
          </div>
          <h3 className="text-lg font-bold text-gray-700">AI is thinking...</h3>
          <p className="text-sm text-gray-400 max-w-xs">Formulating critical questions, please hold.</p>
          <div className="w-full max-w-md space-y-4">
            <div className="shimmer h-20 rounded-xl" />
            <div className="shimmer h-20 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <div className="grid grid-cols-12 gap-8 h-full animate-in fade-in duration-300">
        <div className="col-span-12 lg:col-span-4 bg-white rounded-2xl border border-[#E2E8F0] p-8 flex flex-col shadow-sm">
          <h2 className="text-lg font-black text-[#0f172a] mb-6">Configure Questions</h2>
          
          <div className="space-y-6 flex-1">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider pl-1">Target Topic</label>
              <input 
                type="text" 
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Photosynthesis steps, WW2 origins..."
                className="w-full h-11 px-4 py-3 bg-[#F8FAFF] border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#6366F1] focus:ring-3 focus:ring-[#6366F1]/10 transition-all text-sm font-medium text-gray-800 placeholder-[#94A3B8]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider pl-1">Question Count</label>
              <div className="flex gap-2">
                {[5, 10, 15].map(n => (
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
              Generate Short Qs
            </button>
          </div>
        </div>

        {/* Right Empty State */}
        <div className="col-span-12 lg:col-span-8 bg-white rounded-2xl border border-dashed border-[#E2E8F0] flex flex-col items-center justify-center p-12 text-center shadow-sm">
            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-6">
                <MessageSquare size={32} className="text-[#3B82F6] animate-pulse" />
            </div>
            <h3 className="text-[#0F172A] text-xl font-extrabold tracking-tight">Ready to generate your Short Questions</h3>
            <p className="text-[#64748B] mt-2 max-w-sm text-sm font-medium">
              Conceptual checks to build solid foundations. Describe a topic on the left parameters sidebar to get customized evaluation exercises.
            </p>
            <div className="mt-6 flex items-center gap-1.5 text-[#3B82F6] text-xs font-bold">
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
          ← New Session
        </button>
        <button 
          onClick={handleDownload} 
          className="flex items-center gap-2 text-xs font-bold text-[#64748B] hover:text-[#6366F1] transition-colors border border-[#E2E8F0] rounded-lg px-4 py-1.5 bg-white cursor-pointer"
        >
          <Download size={14} />
          Export Study Pack
        </button>
      </div>

      <div className="space-y-8">
        {questions.map((q, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white p-8 rounded-2xl border border-[#E2E8F0] shadow-sm space-y-6"
          >
            <div className="space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#3B82F6]">Question {i+1}</span>
                <h3 className="text-lg font-bold text-[#0F172A] leading-snug">{q.question}</h3>
            </div>

            <div className="space-y-4">
                <div className="relative">
                    <textarea
                        value={userAnswers[i] || ''}
                        onChange={(e) => {
                          const newAnswers = [...userAnswers];
                          newAnswers[i] = e.target.value;
                          setUserAnswers(newAnswers);
                        }}
                        placeholder="Draft your answer here to receive diagnostic feedback..."
                        className="w-full p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFF] focus:ring-3 focus:ring-[#6366F1]/10 focus:border-[#6366F1] focus:bg-white transition-all min-h-[100px] outline-none text-sm text-gray-800 leading-relaxed placeholder-[#94A3B8]"
                    />
                    {aiFeedbacks[i] && (
                        <div className="absolute top-3 right-3 px-2 py-0.5 bg-white border border-[#E2E8F0] rounded-full text-[10px] font-bold text-[#94A3B8]">
                            Evaluated
                        </div>
                    )}
                </div>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => checkWithAI(i)}
                  disabled={checkingIdx === i || !userAnswers[i]?.trim()}
                  className="flex-shrink-0 px-6 h-10 rounded-lg bg-gradient-to-r from-[#6366F1] to-[#3B82F6] text-white font-bold text-xs hover:brightness-105 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-50 cursor-pointer"
                >
                  {checkingIdx === i ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : <Brain size={16} />}
                  Evaluate Answer
                </button>
                <button 
                  onClick={() => toggleAnswer(i)}
                  className="px-5 h-10 rounded-lg border border-[#E2E8F0] font-bold text-xs text-[#64748B] hover:bg-gray-50 flex items-center gap-1.5 transition-all cursor-pointer bg-white"
                >
                  {showAnswer.includes(i) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  Model Key
                </button>
              </div>
            </div>

            <AnimatePresence>
              {showAnswer.includes(i) && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 text-[#1E3A8A]">
                    <div className="flex items-center gap-1.5 mb-2">
                        <Sparkles size={14} className="text-[#6366F1]" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-[#6366F1]">Recommended Answer</span>
                    </div>
                    <p className="leading-relaxed font-semibold text-xs text-gray-700">{q.modelAnswer}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {aiFeedbacks[i] && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-6 rounded-xl bg-green-50/50 border border-green-100 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                        <CheckCircle2 size={14} className="text-white" />
                      </div>
                      <span className="font-bold text-sm text-green-800">Learning Feedback</span>
                    </div>
                    <div className="px-3 py-1 rounded-lg bg-green-100 text-green-800 font-extrabold text-xs shadow-xs">
                      Score: {aiFeedbacks[i].score}/10
                    </div>
                  </div>
                  <p className="text-green-800 text-sm leading-relaxed font-semibold">"{aiFeedbacks[i].feedback}"</p>
                  <div className="bg-white/60 p-4 rounded-lg flex items-start gap-3">
                    <Info size={16} className="text-green-600 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                        <p className="text-[10px] font-bold text-green-600 uppercase tracking-wider">Growth Tip</p>
                        <p className="text-xs text-green-700 leading-relaxed font-medium">{aiFeedbacks[i].improvement}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
