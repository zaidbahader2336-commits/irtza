import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  Download,
  Brain,
  ChevronDown,
  ChevronUp,
  HelpCircle
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { MCQ } from '../../types';
import { generatePDF, PDFItem } from '../../lib/pdf';
import { saveToUserHistory } from '../../lib/userData';
import confetti from 'canvas-confetti';

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

export default function MCQGenerator({ onDownload }: Props) {
  const [topic, setTopic] = useState('');
  const [count, setCount] = useState(10);
  const [difficulty, setDifficulty] = useState('Medium');
  const [gradeLevel, setGradeLevel] = useState('High School (Grade 9-10)');
  const [language, setLanguage] = useState('English');
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<MCQ[]>([]);
  
  // Quiz State
  const [currentIdx, setCurrentIdx] = useState(-1); // -1 = setup, >=0 = quiz
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [quizFinished, setQuizFinished] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  // Score Count-Up Animator
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    if (quizFinished) {
      const percentage = Math.round((score / questions.length) * 100) || 0;
      let start = 0;
      const duration = 1000; // 1s
      const stepTime = Math.abs(Math.floor(duration / (percentage || 1)));
      
      const timer = setInterval(() => {
        start += 1;
        if (start > percentage) {
          clearInterval(timer);
        } else {
          setAnimatedScore(start);
        }
      }, stepTime);

      if (percentage >= 70) {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
      }

      return () => clearInterval(timer);
    } else {
      setAnimatedScore(0);
    }
  }, [quizFinished, score, questions.length]);

  const generateQuiz = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/mcqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, count, difficulty, gradeLevel, language }),
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || `Server error: ${res.status}`);
      }

      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setQuestions(data);
        saveToUserHistory('mcqs', topic, data);
        setCurrentIdx(0);
        setScore(0);
        setQuizFinished(false);
      } else {
        alert('Could not generate questions for this topic. Try something more specific.');
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleOptionClick = (idx: number) => {
    if (isSubmitted) return;
    setSelectedOpt(idx);
  };

  const submitAnswer = () => {
    if (selectedOpt === null) return;
    setIsSubmitted(true);
    if (selectedOpt === questions[currentIdx].correctIndex) {
      setScore(s => s + 1);
    }
  };

  const nextQuestion = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(i => i + 1);
      setSelectedOpt(null);
      setIsSubmitted(false);
    } else {
      setQuizFinished(true);
    }
  };

  const handleDownload = () => {
    const content: PDFItem[] = [
      { type: 'heading', text: `${topic} Practice Quiz (${difficulty})` },
    ];

    questions.forEach((q, i) => {
      content.push({ type: 'subheading', text: `Question ${i + 1}: ${q.question}` });
      q.options.forEach((opt, oi) => {
        content.push({ type: 'text', text: `${String.fromCharCode(65 + oi)}) ${opt}` });
      });
      content.push({ type: 'text', text: `Correct Answer: ${q.options[q.correctIndex]}` });
      content.push({ type: 'text', text: `Explanation: ${q.explanation}` });
    });

    generatePDF(`${topic} MCQs`, content);
    onDownload(`${topic} MCQs`);
  };

  const reset = () => {
    setQuestions([]);
    setCurrentIdx(-1);
    setIsSubmitted(false);
    setSelectedOpt(null);
    setScore(0);
    setQuizFinished(false);
    setExpandedIndex(null);
  };

  const percentage = Math.round((score / (questions.length || 1)) * 100);

  const getPerformanceMessage = () => {
    if (percentage >= 90) return { text: "Excellent! 🏆", color: "text-yellow-500 bg-yellow-50 border-yellow-200" };
    if (percentage >= 70) return { text: "Good job! ⭐", color: "text-blue-600 bg-blue-50 border-[#E2E8F0]" };
    if (percentage >= 50) return { text: "Keep going! 💪", color: "text-amber-600 bg-amber-50 border-amber-200" };
    return { text: "More practice needed 📚", color: "text-red-600 bg-red-50 border-red-200" };
  };

  if (loading) {
    return (
      <div className="grid grid-cols-12 gap-8 h-full animate-pulse">
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm shimmer h-80" />
        </div>
        <div className="col-span-12 lg:col-span-8 flex flex-col justify-center items-center py-20 bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-10 text-center space-y-6">
          <div className="flex gap-2.5 justify-center items-center">
            <span className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce" />
            <span className="w-3 h-3 bg-blue-500 rounded-full animate-bounce delay-100" />
            <span className="w-3 h-3 bg-cyan-500 rounded-full animate-bounce delay-200" />
          </div>
          <h3 className="text-lg font-bold text-gray-700">AI is thinking...</h3>
          <p className="text-sm text-gray-400 max-w-xs">Educating minds takes careful compilation. Your questions will be ready in a moment!</p>
          <div className="w-full max-w-md space-y-4">
            <div className="shimmer h-12 rounded-xl" />
            <div className="shimmer h-12 rounded-xl" />
            <div className="shimmer h-12 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (currentIdx === -1) {
    return (
      <div className="grid grid-cols-12 gap-8 h-full animate-in fade-in duration-300">
        {/* Left Input Panel */}
        <div className="col-span-12 lg:col-span-4 bg-white rounded-2xl border border-[#E2E8F0] p-8 flex flex-col shadow-sm">
          <h2 className="text-lg font-black text-gray-900 mb-6">Configure Practice</h2>
          
          <div className="space-y-6 flex-1">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider pl-1">Topic or Keywords</label>
              <input 
                type="text" 
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Photosynthesis, WW2, Python..."
                className="w-full h-11 px-4 py-3 bg-[#F8FAFF] border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#6366F1] focus:ring-3 focus:ring-[#6366F1]/10 transition-all text-sm font-medium text-gray-800 placeholder-[#94A3B8]"
                id="topic-input"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider pl-1">Questions Count</label>
              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 15, 20].map(n => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setCount(n)}
                    className={cn(
                      "h-10 rounded-lg text-xs font-bold border transition-all cursor-pointer",
                      count === n 
                        ? "bg-gradient-to-r from-[#6366F1] to-[#3B82F6] text-white border-transparent shadow-sm" 
                        : "bg-white border-[#E2E8F0] text-[#64748B] hover:bg-indigo-50/50 hover:text-indigo-600"
                    )}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider pl-1">Difficulty</label>
              <div className="flex gap-2">
                {['Easy', 'Medium', 'Hard'].map(d => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDifficulty(d)}
                    className={cn(
                      "flex-1 h-10 rounded-lg text-xs font-bold border transition-all cursor-pointer",
                      difficulty === d 
                        ? "bg-white border-[#6366F1] text-[#6366F1] shadow-sm shadow-indigo-100" 
                        : "bg-white border-[#E2E8F0] text-[#64748B] hover:bg-indigo-50/50"
                    )}
                  >
                    {d}
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
              onClick={generateQuiz}
              disabled={!topic}
              className="w-full h-11 bg-gradient-to-r from-[#6366F1] to-[#3B82F6] hover:brightness-105 hover:scale-[1.01] active:scale-[0.98] text-white font-bold text-sm rounded-lg shadow-md transition-all mt-4 disabled:opacity-40 disabled:pointer-events-none"
            >
              Generate MCQs
            </button>
          </div>

          <div className="mt-8 pt-6 border-t border-[#E2E8F0]">
            <p className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider text-center leading-relaxed">
              Curriculum-aligned & adaptive AI generator
            </p>
          </div>
        </div>

        {/* Right Info Panel (Beautiful Empty State) */}
        <div className="col-span-12 lg:col-span-8 bg-white rounded-2xl border border-dashed border-[#E2E8F0] flex flex-col items-center justify-center p-12 text-center shadow-sm">
            <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mb-6">
                <Brain size={32} className="text-[#6366F1] animate-pulse" />
            </div>
            <h3 className="text-[#0F172A] text-xl font-extrabold tracking-tight">Ready to generate your MCQs</h3>
            <p className="text-[#64748B] mt-2 max-w-sm text-sm font-medium">
              Specify your study topic on the left sidebar configured panel, select questions size, and hit generate to begin learning.
            </p>
            <div className="mt-6 flex items-center gap-1.5 text-[#6366F1] text-xs font-bold">
              <span>Use parameters config panel on the left</span>
              <ArrowRight size={14} className="animate-bounce" />
            </div>
        </div>
      </div>
    );
  }

  if (quizFinished) {
    const perf = getPerformanceMessage();
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-160px)] py-8 animate-in zoom-in-95 duration-300">
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-10 text-center max-w-3xl w-full shadow-lg">
            
            {/* SVG Score Circle */}
            <div className="relative w-40 h-40 mx-auto mb-6 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" className="stroke-[#F1F5F9]" strokeWidth="6" fill="transparent" />
                <motion.circle 
                  cx="50" 
                  cy="50" 
                  r="40" 
                  className="stroke-[#6366F1]" 
                  strokeWidth="6" 
                  fill="transparent" 
                  strokeDasharray="251.2" 
                  strokeDashoffset={251.2 - (251.2 * animatedScore) / 100} 
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                 <span className="text-4xl font-black text-[#0F172A] tracking-tight">{animatedScore}%</span>
                 <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Score</span>
              </div>
            </div>

            <div className={cn("inline-flex items-center gap-2 px-4 py-2 font-bold text-sm border rounded-full mb-6", perf.color)}>
               {perf.text}
            </div>

            <h2 className="text-2xl font-black text-[#0F172A] mb-2">Quiz Results Verified</h2>
            <p className="text-[#64748B] font-medium text-sm mb-10">
              You correctly solved <span className="text-[#6366F1] font-bold">{score}</span> out of <span className="font-bold">{questions.length}</span> questions. Review the key explanations below.
            </p>

            {/* Accordion List for explanation reviews */}
            <div className="space-y-3 text-left mb-10 max-h-80 overflow-y-auto pr-2">
               {questions.map((q, i) => (
                 <div key={i} className="bg-[#F8FAFF] rounded-xl border border-[#E2E8F0] overflow-hidden">
                    <button 
                      onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}
                      className="w-full px-5 py-3.5 flex items-center justify-between text-left text-sm font-bold text-[#0F172A] hover:bg-indigo-50/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-[10px] font-bold text-[#6366F1]">
                           {i + 1}
                        </span>
                        <span className="truncate max-w-lg">{q.question}</span>
                      </div>
                      {expandedIndex === i ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    {expandedIndex === i && (
                      <div className="px-5 pb-5 pt-1 space-y-3 text-xs border-t border-[#E2E8F0] bg-white animate-in slide-in-from-top-1">
                        <p className="text-[#64748B] font-semibold">Options:</p>
                        <div className="grid grid-cols-2 gap-2 text-gray-700">
                          {q.options.map((opt, oi) => (
                            <div key={oi} className={cn("p-2 border rounded-lg", oi === q.correctIndex ? "bg-green-50 border-green-200 text-green-700 font-bold" : "bg-gray-50 border-[#E2E8F0]")}>
                               {String.fromCharCode(65 + oi)}) {opt}
                            </div>
                          ))}
                        </div>
                        <p className="text-gray-600 bg-[#F8FAFF] p-3 rounded-lg border border-[#E2E8F0] leading-relaxed">
                          <span className="font-bold text-indigo-600">Explanation:</span> {q.explanation}
                        </p>
                      </div>
                    )}
                 </div>
               ))}
            </div>

            <div className="flex gap-4 max-w-md mx-auto">
              <button 
                onClick={reset}
                className="flex-1 py-3 text-sm border border-[#E2E8F0] text-[#64748B] font-bold hover:bg-gray-50 transition-colors rounded-lg cursor-pointer"
              >
                Back to Settings
              </button>
              <button 
                onClick={handleDownload}
                className="flex-1 py-3 bg-gradient-to-r from-[#6366F1] to-[#3B82F6] hover:brightness-105 active:scale-95 text-white font-bold text-sm rounded-lg shadow-md transition-all shadow-indigo-100 cursor-pointer"
              >
                Download PDF
              </button>
            </div>
        </div>
      </div>
    );
  }

  const q = questions[currentIdx];
  if (!q) return null;

  return (
    <div className="grid grid-cols-12 gap-8 h-full">
        {/* Live Solve Progress */}
        <div className="col-span-12 lg:col-span-4 space-y-4">
            <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-6">
                    <div className="px-2.5 py-1 bg-[#6366F1]/10 text-[#6366F1] rounded-full text-[10px] font-black uppercase tracking-wider">LIVE SOLVE</div>
                    <span className="text-xs font-bold text-[#64748B]">Question {currentIdx + 1} of {questions.length}</span>
                </div>
                
                {/* Progress bar with primary gradient, height 4px, border-radius 2px */}
                <div className="space-y-2">
                    <div className="flex justify-between items-end">
                        <span className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Progress</span>
                        <span className="text-xs font-bold text-[#6366F1]">{Math.round(((currentIdx + 1) / questions.length) * 100)}%</span>
                    </div>
                    <div className="w-full bg-[#E2E8F0] h-1.5 rounded-full overflow-hidden">
                        <div 
                            className="bg-gradient-to-r from-[#6366F1] to-[#3B82F6] h-1.5 rounded-full transition-all duration-500" 
                            style={{ width: `${((currentIdx + 1) / questions.length) * 100}%` }}
                        />
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-[#E2E8F0]">
                    <div className="flex justify-between items-center bg-[#F8FAFF] p-4 rounded-xl border border-[#E2E8F0]">
                        <span className="text-xs font-bold text-[#64748B]">Current Score</span>
                        <span className="text-base font-black text-green-600">{score}/{currentIdx + (isSubmitted ? 1 : 0)}</span>
                    </div>
                </div>
            </div>
            <button 
                onClick={reset}
                className="w-full py-2.5 text-xs font-bold text-[#94A3B8] hover:text-[#EF4444] transition-colors bg-white rounded-xl border border-[#E2E8F0] hover:bg-red-50/20"
                id="quit-btn"
              >
                Quit Session
            </button>
        </div>

        {/* Live Quiz Card area */}
        <div className="col-span-12 lg:col-span-8">
            <div className="bg-white rounded-2xl shadow-sm border border-[#E2E8F0] p-10 h-full flex flex-col justify-between">
                <div>
                  <h3 className="text-xl font-bold text-[#0F172A] leading-relaxed mb-8">{q.question}</h3>

                  <div className="grid grid-cols-1 gap-3.5">
                      {q.options.map((opt, i) => {
                          const isSelected = selectedOpt === i;
                          const isCorrect = i === q.correctIndex;
                          const showCorrect = isSubmitted && isCorrect;
                          const showWrong = isSubmitted && isSelected && !isCorrect;

                          return (
                              <button
                                  key={i}
                                  onClick={() => handleOptionClick(i)}
                                  disabled={isSubmitted}
                                  className={cn(
                                      "group flex items-center gap-4 p-4 rounded-lg border transition-all text-left w-full cursor-pointer duration-200",
                                      !isSubmitted && "border-[#E2E8F0] hover:bg-[#F8FAFF] hover:border-[#6366F1]",
                                      !isSubmitted && isSelected && "border-[#6366F1] bg-[#EEF2FF] text-[#6366F1]",
                                      showCorrect && "border-[#10B981] bg-[#F0FDF4] text-[#065F46]",
                                      showWrong && "border-[#F43F5E] bg-[#FFF1F2] text-[#881337]",
                                      isSubmitted && !isCorrect && !isSelected && "opacity-55 cursor-not-allowed border-[#E2E8F0]"
                                  )}
                              >
                                  <span className={cn(
                                      "w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs transition-colors shrink-0",
                                      showCorrect ? "bg-[#10B981] text-white" : 
                                      showWrong ? "bg-[#F43F5E] text-white" :
                                      isSelected ? "bg-[#6366F1] text-white" : "bg-[#F8FAFF] border border-[#E2E8F0] text-[#64748B]"
                                  )}>
                                      {String.fromCharCode(65 + i)}
                                  </span>
                                  <span className={cn("text-sm flex-1", (showCorrect || isSelected) ? "font-bold" : "font-semibold text-gray-700")}>
                                      {opt}
                                  </span>
                                  {showCorrect && <CheckCircle2 className="text-[#10B981] ml-auto" size={18} />}
                                  {showWrong && <XCircle className="text-[#F43F5E] ml-auto" size={18} />}
                              </button>
                          );
                      })}
                  </div>
                </div>

                <div className="mt-8">
                  <AnimatePresence>
                      {isSubmitted && (
                          <motion.div 
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="p-5 bg-[#F8FAFF] border border-[#E2E8F0] rounded-xl"
                          >
                              <div className="flex items-start gap-4">
                                  <div className={cn(
                                      "w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5",
                                      selectedOpt === q.correctIndex ? "bg-[#10B981]" : "bg-[#6366F1]"
                                  )}>
                                      <Sparkles size={16} className="text-white" />
                                  </div>
                                  <div className="flex-1 space-y-1">
                                      <h4 className="font-bold text-[#0F172A] text-xs uppercase tracking-wider">
                                          {selectedOpt === q.correctIndex ? 'Well done!' : 'Keep Learning'}
                                      </h4>
                                      <p className="text-gray-600 text-xs leading-relaxed">{q.explanation}</p>
                                  </div>
                                  <button 
                                      onClick={nextQuestion}
                                      className="ml-4 h-9 px-4 bg-gradient-to-r from-[#6366F1] to-[#3B82F6] text-white font-bold rounded-lg text-xs hover:brightness-105 transition-colors flex items-center gap-1.5 break-normal flex-shrink-0"
                                  >
                                      <span>{currentIdx === questions.length - 1 ? 'Results' : 'Next'}</span>
                                      <ArrowRight size={14} />
                                  </button>
                              </div>
                          </motion.div>
                      )}
                  </AnimatePresence>

                  {!isSubmitted && (
                      <div className="flex justify-end mt-4">
                          <button 
                              onClick={submitAnswer}
                              disabled={selectedOpt === null}
                              className="px-8 h-10 bg-gradient-to-r from-[#6366F1] to-[#3B82F6] text-white font-bold text-xs rounded-lg hover:brightness-105 transition-colors disabled:opacity-45 disabled:pointer-events-none shadow-sm shadow-indigo-100"
                          >
                              Check Answer
                          </button>
                      </div>
                  )}
                </div>
            </div>
        </div>
    </div>
  );
}
