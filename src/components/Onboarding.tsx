import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  GraduationCap, 
  Sparkles, 
  BookOpen, 
  Layers, 
  ArrowRight, 
  ChevronLeft, 
  ChevronRight, 
  User as UserIcon 
} from 'lucide-react';

interface OnboardingProps {
  onComplete: (name: string) => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [slide, setSlide] = useState(0);
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const slides = [
    {
      title: "Smart AI Curriculum Architect",
      subtitle: "Personalized Study Guides & Exam Prep",
      description: "Generate conceptual MCQs, custom structured short questions, essays, and complete high-difficulty exam assessments dynamically tailored to your exact curriculum, subjects, and difficulty levels.",
      icon: GraduationCap,
      color: "from-indigo-600 to-blue-700",
      iconColor: "#D4B581",
      badge: "MODULE ONE"
    },
    {
      title: "Advanced Concept Explainer",
      subtitle: "Intuitive Analogies & Interactive Dialogues",
      description: "Convert ultra-complex technical theories, physical formulas, and historic milestones into clear real-world analogies, Socratic logical steps, interactive reasoning clues, and official citation entries.",
      icon: Sparkles,
      color: "from-blue-700 to-slate-900",
      iconColor: "#D4B581",
      badge: "MODULE TWO"
    },
    {
      title: "Scholarly Laboratory & Vault",
      subtitle: "Export Materials Directly to PDF & Prints",
      description: "Architect comprehensive physical report sheets, formula cheat maps, and admissions preppers. Review, verify, and export everything directly to professional PDF blueprints, synced to your offline local vault.",
      icon: BookOpen,
      color: "from-slate-900 to-[#0B1D3A]",
      iconColor: "#D4B581",
      badge: "MODULE THREE"
    }
  ];

  const handleNext = () => {
    if (slide < 3) {
      setSlide(slide + 1);
    }
  };

  const handlePrev = () => {
    if (slide > 0) {
      setSlide(slide - 1);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please put your name to proceed / Meharbani karkey apna naam likhain.");
      return;
    }
    onComplete(name.trim());
  };

  const currentInfo = slides[slide];

  return (
    <div className="fixed inset-0 bg-[#0B1D3A] flex items-center justify-center p-4 z-50 overflow-y-auto">
      {/* Dynamic Ambient Backdrops */}
      <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-blue-900/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-amber-500/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-xl bg-slate-900/40 border border-slate-800 backdrop-blur-md rounded-3xl p-6 md:p-10 shadow-2xl relative overflow-hidden">
        {/* Top Branding Header */}
        <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Layers className="text-[#D4B581]" size={20} />
            <span className="text-xs font-black text-[#D4B581] uppercase tracking-widest font-mono">EduGen Portal</span>
          </div>
          {slide < 3 && (
            <button 
              onClick={() => setSlide(3)} 
              className="text-xs font-bold text-[#D4B581]/70 hover:text-[#D4B581] hover:underline cursor-pointer transition-colors"
            >
              Skip
            </button>
          )}
        </div>

        <AnimatePresence mode="wait">
          {slide < 3 ? (
            <motion.div
              key={`slide-${slide}`}
              initial={{ opacity: 0, x: 25 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -25 }}
              transition={{ duration: 0.25 }}
              className="space-y-6 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="inline-block px-2.5 py-1 bg-[#D4B581]/10 rounded-full border border-[#D4B581]/30">
                  <span className="text-[10px] font-extrabold text-[#D4B581] tracking-widest font-mono uppercase">{currentInfo.badge}</span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-[#D4B581]/40 flex items-center justify-center shadow-xl text-[#D4B581]">
                    <currentInfo.icon size={28} />
                  </div>
                  <div>
                    <h2 className="text-lg md:text-xl font-serif font-bold text-white tracking-wide leading-tight">{currentInfo.title}</h2>
                    <p className="text-xs font-extrabold text-[#D4B581]/80 mt-0.5 tracking-wider font-mono uppercase">{currentInfo.subtitle}</p>
                  </div>
                </div>

                <p className="text-xs md:text-sm font-medium leading-relaxed text-slate-300 text-justify pt-1">
                  {currentInfo.description}
                </p>
              </div>

              {/* Navigation Indicators & Buttons */}
              <div className="pt-8 flex items-center justify-between border-t border-slate-800/80 mt-4">
                {/* Dots indicators */}
                <div className="flex gap-2">
                  {[0, 1, 2].map((idx) => (
                    <button
                      key={idx}
                      onClick={() => setSlide(idx)}
                      className={`h-2 rounded-full transition-all duration-300 ${slide === idx ? 'w-6 bg-[#D4B581]' : 'w-2 bg-slate-700 hover:bg-slate-500'}`}
                      aria-label={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  {slide > 0 && (
                    <button
                      onClick={handlePrev}
                      className="p-2 border border-slate-700 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      <ChevronLeft size={18} />
                    </button>
                  )}
                  <button
                    onClick={handleNext}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#D4B581] hover:bg-[#c0a271] text-[#0B1D3A] font-black text-xs rounded-xl shadow-lg hover:brightness-105 active:scale-98 transition-all cursor-pointer"
                  >
                    <span>{slide === 2 ? "Set My Profile" : "Continue"}</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="profile-setup"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="space-y-2 text-center sm:text-left">
                <span className="text-[10px] font-black text-[#D4B581] tracking-widest block uppercase font-mono">FINAL STEP</span>
                <h2 className="text-xl md:text-2xl font-serif font-bold text-white tracking-wide">Personalize Your Academic Workspace</h2>
                <p className="text-xs text-slate-400 font-medium leading-relaxed">
                  Please enter your beautiful name below to set up your customized study panels, transcripts, syllabus maps, and official pdf exports.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <label htmlFor="user-name-input" className="text-xs text-[#D4B581] font-black uppercase tracking-wider block">Student Full Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <UserIcon size={16} />
                    </div>
                    <input
                      id="user-name-input"
                      type="text"
                      className="w-full h-12 pl-10 pr-4 bg-slate-800/40 border border-slate-700/80 rounded-xl focus:outline-none focus:border-[#D4B581] text-sm text-white font-semibold placeholder-slate-500 focus:ring-1 focus:ring-[#D4B581]/50 transition-all shadow-inner"
                      placeholder="e.g. Ahmed Raza, Maryam Khan"
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        setError('');
                      }}
                      autoFocus
                    />
                  </div>
                  {error && (
                    <p className="text-rose-400 text-[11px] font-bold mt-1 pl-1 flex items-center gap-1.5 animate-pulse">
                      <span>⚠️</span> {error}
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-800 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => setSlide(2)}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs text-slate-400 hover:text-white hover:underline transition-all cursor-pointer font-bold"
                  >
                    <ChevronLeft size={16} />
                    <span>Back to Slides</span>
                  </button>

                  <button
                    type="submit"
                    className="flex items-center gap-2 px-6 py-3 bg-[#D4B581] hover:bg-[#c0a271] text-[#0B1D3A] font-black text-xs rounded-xl shadow-xl hover:brightness-105 active:scale-98 transition-all cursor-pointer uppercase tracking-wider"
                  >
                    <span>Enter Workspace</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
