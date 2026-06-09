/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  HelpCircle, 
  FileText, 
  Search, 
  PenTool, 
  Download,
  Menu,
  X,
  ChevronRight,
  GraduationCap,
  History as HistoryIcon,
  LogOut,
  User as UserIcon,
  Bell,
  Home,
  Lightbulb,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronLeft,
  Eye,
  Settings,
  Share2,
  Layers,
  Award,
  Globe,
  Scale
} from 'lucide-react';
import { cn } from './lib/utils';
import MCQGenerator from './components/tools/MCQGenerator';
import ShortQuestions from './components/tools/ShortQuestions';
import LongQuestions from './components/tools/LongQuestions';
import TopicExplainer from './components/tools/TopicExplainer';
import StoryLetterWriter from './components/tools/StoryLetterWriter';
import ExamMode from './components/tools/ExamMode';
import History from './components/tools/History';
import VisualAnalysis from './components/tools/VisualAnalysis';
import SmartSuite from './components/tools/SmartSuite';
import { getOrCreateDefaultUser } from './lib/userData';
import { ToolType, User } from './types';
import Onboarding from './components/Onboarding';

export default function App() {
  const [activeTool, setActiveTool] = useState<ToolType>('home');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [downloads, setDownloads] = useState<string[]>([]);
  const [user, setUser] = useState<User>(getOrCreateDefaultUser());
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [canvaClientId, setCanvaClientId] = useState('');
  const [canvaClientSecret, setCanvaClientSecret] = useState('');
  const [canvaTemplateId, setCanvaTemplateId] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState<boolean>(() => {
    return localStorage.getItem('edugen_onboarding_completed') !== 'true';
  });

  const handleOnboardingComplete = (customName: string) => {
    const currentUser = getOrCreateDefaultUser();
    currentUser.name = customName;
    localStorage.setItem('edugen_app_user', JSON.stringify(currentUser));
    localStorage.setItem('edugen_onboarding_completed', 'true');
    setUser(currentUser);
    setShowOnboarding(false);
  };

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarOpen(false);
      } else {
        setSidebarOpen(true);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const selectTool = (toolId: ToolType) => {
    setActiveTool(toolId);
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  // Loaded from localStorage
  useEffect(() => {
    setUser(getOrCreateDefaultUser());
    const savedKey = localStorage.getItem('edugen_gemini_api_key');
    if (savedKey) {
      setApiKey(savedKey);
    }
    const cid = localStorage.getItem('edugen_canva_client_id');
    if (cid) setCanvaClientId(cid);
    const csec = localStorage.getItem('edugen_canva_client_secret');
    if (csec) setCanvaClientSecret(csec);
    const ctem = localStorage.getItem('edugen_canva_template_id');
    if (ctem) setCanvaTemplateId(ctem);
  }, []);

  const handleSaveSettings = () => {
    localStorage.setItem('edugen_gemini_api_key', apiKey);
    localStorage.setItem('edugen_canva_client_id', canvaClientId);
    localStorage.setItem('edugen_canva_client_secret', canvaClientSecret);
    localStorage.setItem('edugen_canva_template_id', canvaTemplateId);
    setShowSettingsModal(false);
  };

  const academicTools = [
    { 
      id: 'mcq', 
      name: 'MCQ Generator', 
      icon: HelpCircle, 
      color: '#1E3A8A', 
      bgColor: 'bg-[#1E3A8A]/10', 
      hoverColor: 'hover:border-[#DFBA6B]',
      borderStyle: 'hover:border-[#DFBA6B]/50 group-hover:text-[#1E3A8A]',
      description: 'Generate & solve practice questions automatically' 
    },
    { 
      id: 'short', 
      name: 'Short Questions', 
      icon: PenTool, 
      color: '#2563EB', 
      bgColor: 'bg-[#2563EB]/10', 
      hoverColor: 'hover:border-[#DFBA6B]',
      borderStyle: 'hover:border-[#DFBA6B]/50 group-hover:text-[#2563EB]',
      description: 'Quick conceptual checks and answers' 
    },
    { 
      id: 'long', 
      name: 'Long Questions', 
      icon: FileText, 
      color: '#0F172A', 
      bgColor: 'bg-[#0F172A]/10', 
      hoverColor: 'hover:border-[#DFBA6B]',
      borderStyle: 'hover:border-[#DFBA6B]/50 group-hover:text-[#0F172A]',
      description: 'Deep dive essay questions and structured outline' 
    },
    { 
      id: 'explainer', 
      name: 'Topic Explainer', 
      icon: Lightbulb, 
      color: '#DFBA6B', 
      bgColor: 'bg-[#DFBA6B]/10', 
      hoverColor: 'hover:border-[#DFBA6B]',
      borderStyle: 'hover:border-[#DFBA6B]/50 group-hover:text-[#DFBA6B]',
      description: 'Simplify complex academic topics with analogies' 
    },
    { 
      id: 'story-letter', 
      name: 'Story & Letter', 
      icon: BookOpen, 
      color: '#1E3A8A', 
      bgColor: 'bg-[#1E3A8A]/10', 
      hoverColor: 'hover:border-[#DFBA6B]',
      borderStyle: 'hover:border-[#DFBA6B]/50 group-hover:text-[#1E3A8A]',
      description: 'Generate custom educational stories or letters' 
    },
    { 
      id: 'exam', 
      name: 'Exam Mode', 
      icon: Clock, 
      color: '#2563EB', 
      bgColor: 'bg-[#2563EB]/10', 
      hoverColor: 'hover:border-[#DFBA6B]',
      borderStyle: 'hover:border-[#DFBA6B]/50 group-hover:text-[#2563EB]',
      description: 'Full real-time exam prep simulator' 
    },
    { 
      id: 'visual', 
      name: 'Visual Analysis', 
      icon: Eye, 
      color: '#0F172A', 
      bgColor: 'bg-[#0F172A]/10', 
      hoverColor: 'hover:border-[#DFBA6B]',
      borderStyle: 'hover:border-[#DFBA6B]/50 group-hover:text-[#0F172A]',
      description: 'Upload PDFs/images to grade, solve coursework, or generate practice material' 
    },
    { 
      id: 'flashcard', 
      name: 'Flashcard Creator', 
      icon: BookOpen, 
      color: '#DFBA6B', 
      bgColor: 'bg-[#DFBA6B]/10', 
      hoverColor: 'hover:border-[#DFBA6B]',
      borderStyle: 'hover:border-[#DFBA6B]/50 group-hover:text-[#DFBA6B]',
      description: 'Design interactive, beautiful flip QA cue decks on any topic' 
    },
    { 
      id: 'mindmap', 
      name: 'Concept Mind-Mapper', 
      icon: Layers, 
      color: '#1E3A8A', 
      bgColor: 'bg-[#1E3A8A]/10', 
      hoverColor: 'hover:border-[#DFBA6B]',
      borderStyle: 'hover:border-[#DFBA6B]/50 group-hover:text-[#1E3A8A]',
      description: 'Map out structured hierarchical node outline of core scholarly topics' 
    },
    { 
      id: 'planner', 
      name: '7-Day Study Planner', 
      icon: Clock, 
      color: '#2563EB', 
      bgColor: 'bg-[#2563EB]/10', 
      hoverColor: 'hover:border-[#DFBA6B]',
      borderStyle: 'hover:border-[#DFBA6B]/50 group-hover:text-[#2563EB]',
      description: 'Architect detailed progress daily learning agenda and milestones' 
    },
    { 
      id: 'debate', 
      name: 'Debate Coach', 
      icon: HelpCircle, 
      color: '#0F172A', 
      bgColor: 'bg-[#0F172A]/10', 
      hoverColor: 'hover:border-[#DFBA6B]',
      borderStyle: 'hover:border-[#DFBA6B]/50 group-hover:text-[#0F172A]',
      description: 'Analyze opposing academic stances, logical thesis parameters, and defenses' 
    },
    { 
      id: 'case-study', 
      name: 'Real-world Case Case', 
      icon: FileText, 
      color: '#DFBA6B', 
      bgColor: 'bg-[#DFBA6B]/10', 
      hoverColor: 'hover:border-[#DFBA6B]',
      borderStyle: 'hover:border-[#DFBA6B]/50 group-hover:text-[#DFBA6B]',
      description: 'Compile situational industry narratives with thought questions' 
    },
    { 
      id: 'code-explain', 
      name: 'Computational Explainer', 
      icon: FileText, 
      color: '#1E3A8A', 
      bgColor: 'bg-[#1E3A8A]/10', 
      hoverColor: 'hover:border-[#DFBA6B]',
      borderStyle: 'hover:border-[#DFBA6B]/50 group-hover:text-[#1E3A8A]',
      description: 'Examine programming algorithmic flow schemas, dry runs, and pseudocodes' 
    },
    { 
      id: 'research', 
      name: 'Thesis Proposal Outline', 
      icon: PenTool, 
      color: '#2563EB', 
      bgColor: 'bg-[#2563EB]/10', 
      hoverColor: 'hover:border-[#DFBA6B]',
      borderStyle: 'hover:border-[#DFBA6B]/50 group-hover:text-[#2563EB]',
      description: 'Formulate abstract scopes, scientific methods lists, and chapters indices' 
    },
    { 
      id: 'mnemonics', 
      name: 'Mnemonics Palaces', 
      icon: Award, 
      color: '#0F172A', 
      bgColor: 'bg-[#0F172A]/10', 
      hoverColor: 'hover:border-[#DFBA6B]',
      borderStyle: 'hover:border-[#DFBA6B]/50 group-hover:text-[#0F172A]',
      description: 'Compile acronyms formulas and scenic memory rooms for swift memorization' 
    },
    { 
      id: 'eli5', 
      name: 'ELI5 Metaphor Simulator', 
      icon: Lightbulb, 
      color: '#DFBA6B', 
      bgColor: 'bg-[#DFBA6B]/10', 
      hoverColor: 'hover:border-[#DFBA6B]',
      borderStyle: 'hover:border-[#DFBA6B]/50 group-hover:text-[#DFBA6B]',
      description: 'Deconstruct obscure domain definitions into childish intuitive analogies' 
    },
    { 
      id: 'jargon', 
      name: 'Jargon Word Sandbox', 
      icon: Globe, 
      color: '#1E3A8A', 
      bgColor: 'bg-[#1E3A8A]/10', 
      hoverColor: 'hover:border-[#DFBA6B]',
      borderStyle: 'hover:border-[#DFBA6B]/50 group-hover:text-[#1E3A8A]',
      description: 'Discover six challenging high-tier vocabulary definitions with sample contexts' 
    },
    { 
      id: 'summarizer', 
      name: 'Textbook Summarizer', 
      icon: FileText, 
      color: '#4A121A', 
      bgColor: 'bg-[#4A121A]/10', 
      hoverColor: 'hover:border-[#DFBA6B]',
      borderStyle: 'hover:border-[#DFBA6B]/50 group-hover:text-[#4A121A]',
      description: 'Synthesizes long chapters, lecture slides, or paragraphs into clean high-yield revisions' 
    },
    { 
      id: 'essay-grader', 
      name: 'Essay & Grammar Grader', 
      icon: GraduationCap, 
      color: '#4A121A', 
      bgColor: 'bg-[#4A121A]/10', 
      hoverColor: 'hover:border-[#DFBA6B]',
      borderStyle: 'hover:border-[#DFBA6B]/50 group-hover:text-[#4A121A]',
      description: 'Review essays or paragraphs to identify structural, grammatical, and formatting flaws' 
    },
    { 
      id: 'lab-report', 
      name: 'Lab Report Structure Architect', 
      icon: Award, 
      color: '#1E3A8A', 
      bgColor: 'bg-[#1E3A8A]/10', 
      hoverColor: 'hover:border-[#DFBA6B]',
      borderStyle: 'hover:border-[#DFBA6B]/50 group-hover:text-[#1E3A8A]',
      description: 'Formulate custom chemical, biological, or physics lab experiment steps and safety metrics' 
    },
    { 
      id: 'formula-sheet', 
      name: 'LaTeX formula Sheet Maker', 
      icon: Layers, 
      color: '#2563EB', 
      bgColor: 'bg-[#2563EB]/10', 
      hoverColor: 'hover:border-[#DFBA6B]',
      borderStyle: 'hover:border-[#DFBA6B]/50 group-hover:text-[#2563EB]',
      description: 'Extract equations, mathematical definitions, symbols, and practical real-world use cases' 
    },
    { 
      id: 'paper-questions', 
      name: 'Thesis Assessment Generator', 
      icon: HelpCircle, 
      color: '#0F172A', 
      bgColor: 'bg-[#0F172A]/10', 
      hoverColor: 'hover:border-[#DFBA6B]',
      borderStyle: 'hover:border-[#DFBA6B]/50 group-hover:text-[#0F172A]',
      description: 'Formulate deep reading comprehension and critical logic questions based on topic abstracts' 
    },
    { 
      id: 'socratic', 
      name: 'Socratic Dialogue Initiator', 
      icon: Search, 
      color: '#4A121A', 
      bgColor: 'bg-[#4A121A]/10', 
      hoverColor: 'hover:border-[#DFBA6B]',
      borderStyle: 'hover:border-[#DFBA6B]/50 group-hover:text-[#4A121A]',
      description: 'Navigate classical philosophical and scholastic topics through a series of logical dialogue steps' 
    },
    { 
      id: 'curriculum-map', 
      name: 'Curriculum & Syllable Planner', 
      icon: Globe, 
      color: '#1E3A8A', 
      bgColor: 'bg-[#1E3A8A]/10', 
      hoverColor: 'hover:border-[#DFBA6B]',
      borderStyle: 'hover:border-[#DFBA6B]/50 group-hover:text-[#1E3A8A]',
      description: 'Decode complex curriculum targets into manageable classroom milestone checkpoints' 
    },
    { 
      id: 'interview-prep', 
      name: 'Admissions Prep Panel', 
      icon: PenTool, 
      color: '#2563EB', 
      bgColor: 'bg-[#2563EB]/10', 
      hoverColor: 'hover:border-[#DFBA6B]',
      borderStyle: 'hover:border-[#DFBA6B]/50 group-hover:text-[#2563EB]',
      description: 'Simulate key interview or oral examination questions, pitfalls, and ideal replies' 
    },
    { 
      id: 'citation', 
      name: 'Scholarly Bibliographer', 
      icon: BookOpen, 
      color: '#0F172A', 
      bgColor: 'bg-[#0F172A]/10', 
      hoverColor: 'hover:border-[#DFBA6B]',
      borderStyle: 'hover:border-[#DFBA6B]/50 group-hover:text-[#0F172A]',
      description: 'Formulate accurate academic MLA, APA, IEEE, or Chicago styles bibliographies' 
    },
    { 
      id: 'hypothesis', 
      name: 'Scientific Experiment Architect', 
      icon: Sparkles, 
      color: '#4A121A', 
      bgColor: 'bg-[#4A121A]/10', 
      hoverColor: 'hover:border-[#DFBA6B]',
      borderStyle: 'hover:border-[#DFBA6B]/50 group-hover:text-[#4A121A]',
      description: 'Conduct interactive analysis of scientific statements, identifying dependent and independent variables' 
    },
    {
      id: 'difference',
      name: 'Difference Explainer',
      icon: Scale,
      color: '#059669',
      bgColor: 'bg-[#059669]/10',
      hoverColor: 'hover:border-[#DFBA6B]',
      borderStyle: 'hover:border-[#DFBA6B]/50 group-hover:text-[#059669]',
      description: 'Analyze precise structural, academic differences and comparisons between any two concepts'
    }
  ];

  const utilityTools = [
    { 
      id: 'history', 
      name: 'My Downloads', 
      icon: Download, 
      color: '#2563EB', 
      bgColor: 'bg-[#2563EB]/10', 
      hoverColor: 'hover:border-[#DFBA6B]',
      borderStyle: 'hover:border-[#DFBA6B]/50 group-hover:text-[#2563EB]',
      description: 'Review and manage your saved content vault' 
    }
  ];

  const tools = [...academicTools, ...utilityTools];

  const handleDownloadAdded = (name: string) => {
    setDownloads(prev => [name, ...prev].slice(0, 5));
  };

  return (
    <div className="flex h-screen bg-[#F8FAFF] font-sans text-[#0F172A] overflow-hidden">
      {/* Mobile Backdrop Overlay */}
      {isMobile && sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)} 
          className="fixed inset-0 bg-slate-900/40 z-30 transition-opacity backdrop-blur-[1px]"
        />
      )}

      {/* Sidebar Drawer / Navigation Column */}
      <motion.aside 
        initial={false}
        animate={{ 
          x: isMobile ? (sidebarOpen ? 0 : -285) : 0,
          width: isMobile ? 280 : (sidebarOpen ? 280 : 80)
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 220 }}
        className={cn(
          "border-r border-slate-800 bg-[#0F172A] text-[#D4B581] flex flex-col z-40 h-full shrink-0 shadow-2xl",
          isMobile ? "fixed inset-y-0 left-0" : "relative"
        )}
      >
        {/* App Logo */}
        <div className="p-6 flex flex-col border-b border-slate-800">
          <div className={cn("flex items-center justify-between gap-3 mb-1", !sidebarOpen && !isMobile && "justify-center w-full")}>
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 bg-[#1E293B] border border-[#D4B581] rounded-lg flex items-center justify-center text-[#D4B581] shadow-md flex-shrink-0 cursor-pointer animate-pulse" 
                onClick={() => selectTool('home')}
              >
                <GraduationCap size={22} className="text-[#D4B581]" />
              </div>
              {(sidebarOpen || isMobile) && (
                <div onClick={() => selectTool('home')} className="flex flex-col cursor-pointer">
                  <span className="font-serif text-xl font-bold tracking-wider leading-none text-white">EDUGEN</span>
                  <span className="text-[8px] tracking-[0.2em] text-[#D4B581] uppercase mt-1">Education Generation</span>
                </div>
              )}
            </div>

            {isMobile && sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-800/50 text-[#D4B581]/70 hover:text-white transition-colors"
                aria-label="Close Sidebar"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 space-y-1 mt-4 overflow-y-auto">
          {/* Home Button */}
          <button
            id="nav-home"
            onClick={() => selectTool('home')}
            className={cn(
              "w-full h-11 flex items-center gap-3 px-3 rounded-lg transition-all duration-150 group relative font-medium text-sm cursor-pointer mb-2",
              activeTool === 'home' 
                ? "bg-[#1E293B] border border-[#D4B581]/50 text-white font-semibold shadow-inner" 
                : "text-[#D4B581]/80 hover:bg-slate-800/40 hover:text-white"
            )}
          >
            <Home size={18} className={cn("shrink-0", activeTool === 'home' ? "text-[#D4B581]" : "text-[#D4B581]/70 group-hover:text-white")} />
            {(sidebarOpen || isMobile) && <span>Dashboard</span>}
            {!sidebarOpen && !isMobile && (
              <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-[#0F172A] text-white text-xs font-semibold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap shadow-xl">
                Dashboard
              </div>
            )}
          </button>

          {/* Academic Suite separator */}
          {(sidebarOpen || isMobile) && (
            <div className="px-3 pt-2 pb-1 text-[9px] font-extrabold text-[#D4B581]/40 uppercase tracking-widest leading-none">
              Scholastic Suite
            </div>
          )}

          <div className="space-y-1">
            {academicTools.map((tool) => {
              const Icon = tool.icon;
              const isActive = activeTool === tool.id;
              return (
                <button
                  key={tool.id}
                  id={`nav-${tool.id}`}
                  onClick={() => selectTool(tool.id as ToolType)}
                  className={cn(
                    "w-full h-11 flex items-center gap-3 px-3 rounded-lg transition-all duration-150 group relative font-medium text-sm cursor-pointer",
                    isActive 
                      ? "bg-[#1E293B] border border-[#D4B581]/50 text-white font-semibold shadow-inner" 
                      : "text-[#D4B581]/80 hover:bg-slate-800/40 hover:text-white"
                  )}
                >
                  <Icon 
                    size={18} 
                    className="shrink-0 transition-colors" 
                    style={{ color: '#D4B581' }} 
                  />
                  {(sidebarOpen || isMobile) && (
                    <span className="whitespace-nowrap">{tool.name}</span>
                  )}
                  {!sidebarOpen && !isMobile && (
                    <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-[#0F172A] text-white text-xs font-semibold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap shadow-xl">
                      {tool.name}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Portal Utilities separator */}
          {(sidebarOpen || isMobile) && (
            <div className="px-3 pt-4 pb-1 text-[9px] font-extrabold text-[#D4B581]/40 uppercase tracking-widest leading-none">
              Portal Utilities
            </div>
          )}

          <div className="space-y-1 pb-4">
            {utilityTools.map((tool) => {
              const Icon = tool.icon;
              const isActive = activeTool === tool.id;
              return (
                <button
                  key={tool.id}
                  id={`nav-${tool.id}`}
                  onClick={() => selectTool(tool.id as ToolType)}
                  className={cn(
                    "w-full h-11 flex items-center gap-3 px-3 rounded-lg transition-all duration-150 group relative font-medium text-sm cursor-pointer",
                    isActive 
                      ? "bg-[#1E293B] border border-[#D4B581]/50 text-white font-semibold shadow-inner" 
                      : "text-[#D4B581]/80 hover:bg-slate-800/40 hover:text-white"
                  )}
                >
                  <Icon 
                    size={18} 
                    className="shrink-0 transition-colors" 
                    style={{ color: '#D4B581' }} 
                  />
                  {(sidebarOpen || isMobile) && (
                    <span className="whitespace-nowrap">{tool.name}</span>
                  )}
                  {!sidebarOpen && !isMobile && (
                    <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-[#0F172A] text-white text-xs font-semibold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap shadow-xl">
                      {tool.name}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Sidebar Footer User Details */}
        <div className="p-4 mt-auto border-t border-slate-800 space-y-4 bg-slate-950/40">
          {(sidebarOpen || isMobile) && (
            <div className="bg-[#1E293B]/70 p-4 rounded-lg border border-[#D4B581]/30">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[10px] font-bold text-[#D4B581]/80 uppercase tracking-wider">Student Status</span>
                <span className="text-[10px] font-extrabold text-green-400">ACTIVE</span>
              </div>
              <div className="w-full bg-slate-700 h-1.5 rounded-full mb-2">
                <div className="bg-gradient-to-r from-[#D4B581] to-white h-1.5 rounded-full w-[85%]"></div>
              </div>
              <p className="text-[10px] text-[#D4B581] font-bold uppercase tracking-widest leading-none">
                {user.name.split(' ')[0]}'s Study Plan
              </p>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <div className={cn("flex items-center gap-3", !sidebarOpen && !isMobile && "justify-center w-full")}>
              <div className="w-10 h-10 bg-[#1E293B] border border-[#D4B581] rounded-full flex items-center justify-center text-white font-extrabold shadow-md uppercase text-sm flex-shrink-0">
                {user.name.charAt(0)}
              </div>
              {(sidebarOpen || isMobile) && (
                <div className="text-left overflow-hidden w-28 text-white">
                  <p className="text-xs font-bold truncate leading-none mb-1">{user.name}</p>
                  <p className="text-[10px] text-[#D4B581]/70 truncate font-medium">{user.gmail}</p>
                </div>
              )}
            </div>
          </div>

          {!isMobile && (
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="w-full h-8 flex items-center justify-center border border-slate-800 rounded-lg hover:bg-slate-800/40 transition-colors text-[#D4B581]/70 hover:text-white cursor-pointer"
              aria-label="Toggle Navigation size"
            >
              {sidebarOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
            </button>
          )}
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-[#E2E8F0] flex items-center justify-between px-4 md:px-8 shrink-0 z-10 shadow-sm">
          <div className="flex items-center gap-2.5">
            {isMobile && (
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 text-[#64748B] hover:text-[#4A121A] rounded-lg hover:bg-amber-50/50 transition-colors"
                aria-label="Toggle Side-Menu"
              >
                <Menu size={20} />
              </button>
            )}
            <span className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider hidden sm:inline">EduGen</span>
            <ChevronRight size={12} className="text-[#CBD5E1] hidden sm:inline" />
            <span className="text-sm font-semibold text-[#0F172A] truncate max-w-[150px] sm:max-w-none">
              {activeTool === 'home' ? 'Dashboard' : tools.find(t => t.id === activeTool)?.name}
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            {activeTool !== 'home' && (
              <button 
                onClick={() => selectTool('home')}
                className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 h-9 border border-[#E2E8F0] rounded-lg text-xs font-semibold text-[#64748B] hover:bg-[#FDFBF7] transition-colors"
              >
                <Home size={14} />
                <span>Dashboard</span>
              </button>
            )}

            <div className="relative">
              <button 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2.5 p-1 px-2 hover:bg-[#FDFBF7] rounded-lg border border-transparent hover:border-[#E2E8F0] transition-all"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-[#4A121A] to-[#DFBA6B] rounded-lg flex items-center justify-center text-white font-extrabold text-xs uppercase shadow-md shadow-amber-50">
                  {user.name.charAt(0)}
                </div>
                <div className="text-left hidden md:block">
                  <p className="text-xs font-bold text-[#0F172A] leading-none mb-0.5">{user.name.split(' ')[0]}</p>
                  <p className="text-[10px] text-[#94A3B8] font-bold">Student</p>
                </div>
                <ChevronDown size={14} className="text-[#64748B] hidden md:block" />
              </button>

              <AnimatePresence>
                {showProfileMenu && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-[#E2E8F0] py-2 z-50 overflow-hidden"
                  >
                    <div className="px-5 py-3 border-b border-[#E2E8F0] bg-[#FDFBF7]">
                       <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-0.5">Logged In Account</p>
                       <p className="text-xs font-bold text-[#0F172A] truncate leading-none">{user.name}</p>
                       <p className="text-[10px] text-[#64748B] truncate mt-1">{user.gmail}</p>
                    </div>
                    <button 
                      onClick={() => {
                        selectTool('history');
                        setShowProfileMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-5 py-3 text-xs font-bold text-[#64748B] hover:bg-amber-50/55 hover:text-[#4A121A] transition-colors"
                    >
                      <Download size={16} />
                      <span>Vault (My Downloads)</span>
                    </button>
                    <button 
                      onClick={() => {
                        setShowSettingsModal(true);
                        setShowProfileMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-5 py-3 text-xs font-bold text-[#64748B] hover:bg-amber-50/55 hover:text-[#4A121A] transition-colors"
                    >
                      <Settings size={16} />
                      <span>App Settings</span>
                    </button>
                    <button 
                      onClick={() => {
                        setShowOnboarding(true);
                        setShowProfileMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-5 py-3 text-xs font-bold text-[#64748B] hover:bg-amber-50/55 hover:text-[#4A121A] transition-colors"
                    >
                      <Sparkles size={16} />
                      <span>Replay Intro Slides</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Workspace Panels */}
        <div className="flex-1 overflow-y-auto bg-[#F8FAFF] p-4 md:p-8">
          <div className="max-w-7xl mx-auto h-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTool}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                {activeTool === 'home' ? (
                  /* Landing / Dashboard view */
                  <div className="space-y-8 animate-in fade-in duration-500">
                    {/* BEGIN: Hero Section */}
                    <section className="hero-texture rounded-xl shadow-md border border-[#D4B581] p-8 md:p-10 relative overflow-hidden flex flex-col items-center text-center">
                      <div className="absolute right-0 top-0 w-32 h-32 md:w-48 md:h-48 bg-gradient-to-bl from-blue-900/5 to-transparent rounded-bl-full pointer-events-none" />
                      <div className="absolute left-0 bottom-0 w-32 h-32 md:w-48 md:h-48 bg-gradient-to-tr from-[#D4B581]/5 to-transparent rounded-tr-full pointer-events-none" />
                      
                      <h1 className="font-serif text-3xl md:text-5xl text-[#0F172A] font-bold mb-3 tracking-wide">
                        Welcome, <span className="text-[#1E3A8A] underline decoration-[#D4B581] decoration-wavy">{user.name}</span>!
                      </h1>
                      <p className="text-slate-700 max-w-lg mx-auto mb-6 text-[15px] font-medium leading-relaxed">
                        Select one of our specialized A-Level / University educational modules below to start generating high quality study materials and curriculum analytics.
                      </p>
                      
                      <button 
                        onClick={() => selectTool('history')}
                        className="bg-[#0F172A] hover:bg-[#1E3A8A] text-[#D4B581] px-6 py-2.5 rounded-lg shadow-md transition-all flex items-center gap-2 mb-10 font-bold text-sm border border-[#0F172A]"
                      >
                        <Download size={16} />
                        <span>Open Study Vault (My Downloads)</span>
                      </button>

                      {/* Central Graphic Composition */}
                      <div className="relative w-56 h-56 flex items-center justify-center mt-2 mb-4">
                        {/* Dashed Gold Circles */}
                        <div className="absolute inset-0 rounded-full border-2 border-dashed border-[#D4B581]/60 opacity-60 animate-[spin_50s_linear_infinite]" />
                        <div className="absolute inset-3 rounded-full border border-[#D4B581]/30 opacity-60" />
                        
                        {/* Center Shield */}
                        <div className="relative z-10 w-28 h-32 bg-[#0F172A] rounded-b-full rounded-t-lg shadow-xl border-4 border-[#D4B581] flex flex-col items-center justify-center p-3">
                          {/* Book Icon inside shield */}
                          <BookOpen className="text-[#D4B581] w-12 h-12 mb-1" strokeWidth={1.5} />
                          {/* Grad Cap */}
                          <GraduationCap className="text-[#D4B581] w-6 h-6" strokeWidth={1.5} />
                        </div>

                        {/* Laurels */}
                        <svg className="absolute w-[130%] h-[130%] text-[#D4B581] opacity-70 z-0 pointer-events-none" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 200 200">
                          <path d="M40 100 C 40 150, 100 170, 100 170 C 100 170, 160 150, 160 100" strokeDasharray="3 5" strokeLinecap="round" />
                        </svg>

                        {/* Orbiting Icons */}
                        <div className="absolute -top-1 left-5 w-9 h-9 bg-[#FDFAF3] rounded-full shadow-md border border-[#D4B581] flex items-center justify-center text-[#0F172A] z-20 hover:scale-110 transition-transform">
                          <BookOpen size={16} />
                        </div>
                        <div className="absolute top-1 -right-2 w-9 h-9 bg-[#FDFAF3] rounded-full shadow-md border border-[#D4B581] flex items-center justify-center text-[#0F172A] z-20 hover:scale-110 transition-transform">
                          <Lightbulb size={16} />
                        </div>
                        <div className="absolute bottom-1 -right-1 w-9 h-9 bg-[#FDFAF3] rounded-full shadow-md border border-[#D4B581] flex items-center justify-center text-[#0F172A] z-20 hover:scale-110 transition-transform">
                          <FileText size={16} />
                        </div>
                      </div>
                    </section>
                    {/* END: Hero Section */}

                    <div className="space-y-4">
                      <div className="flex items-center gap-2 border-b-2 border-[#D4B581]/40 pb-2">
                        <Sparkles size={18} className="text-[#1E3A8A]" />
                        <h2 className="text-lg font-bold text-[#0F172A] uppercase tracking-widest font-serif">AI Workspace Tools</h2>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
                        {academicTools.map((tool) => {
                          const Icon = tool.icon;
                          return (
                            <div
                              key={tool.id}
                              onClick={() => selectTool(tool.id as ToolType)}
                              className="group border border-[#D4B581] p-1 rounded-lg cursor-pointer bg-[#0B1D3A] hover:bg-[#13305D] transition-all duration-200 relative flex flex-col justify-between overflow-hidden shadow-sm"
                            >
                              <div className="border border-[#D4B581]/80 rounded p-5 flex flex-col h-full justify-between bg-[#0B1D3A]/95">
                                <div className="space-y-4">
                                  <div className="w-10 h-10 rounded-full border border-[#D4B581] flex items-center justify-center text-[#D4B581] group-hover:bg-[#D4B581] group-hover:text-[#0B1D3A] transition-all">
                                    <Icon size={20} />
                                  </div>
                                  <div className="space-y-1">
                                    <h3 className="text-base text-white font-bold tracking-wide font-serif group-hover:text-[#D4B581] transition-colors">
                                      {tool.name}
                                    </h3>
                                    <p className="text-xs text-slate-300 font-medium leading-relaxed">
                                      {tool.description}
                                    </p>
                                  </div>
                                </div>

                                <div className="mt-6 pt-4 border-t border-[#D4B581]/20 flex items-center justify-between text-xs font-bold text-[#D4B581]">
                                  <span className="group-hover:translate-x-1 transition-transform">Open tool →</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {activeTool === 'mcq' && <MCQGenerator onDownload={handleDownloadAdded} />}
                    {activeTool === 'short' && <ShortQuestions onDownload={handleDownloadAdded} />}
                    {activeTool === 'long' && <LongQuestions onDownload={handleDownloadAdded} />}
                    {activeTool === 'explainer' && <TopicExplainer onDownload={handleDownloadAdded} />}
                    {activeTool === 'story-letter' && <StoryLetterWriter onDownload={handleDownloadAdded} />}
                    {activeTool === 'exam' && <ExamMode onDownload={handleDownloadAdded} />}
                    {activeTool === 'visual' && <VisualAnalysis onDownload={handleDownloadAdded} />}
                    {activeTool === 'history' && <History onDownload={handleDownloadAdded} />}
                    {['flashcard', 'mindmap', 'planner', 'debate', 'case-study', 'code-explain', 'research', 'mnemonics', 'eli5', 'jargon', 'summarizer', 'essay-grader', 'lab-report', 'formula-sheet', 'paper-questions', 'socratic', 'curriculum-map', 'interview-prep', 'citation', 'hypothesis', 'difference'].includes(activeTool) && (
                      <SmartSuite toolId={activeTool} onDownload={handleDownloadAdded} />
                    )}
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>

    {/* Settings Modal */}
    <AnimatePresence>
      {showSettingsModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="bg-white rounded-2xl border border-[#E2E8F0] shadow-2xl max-w-md w-full overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-[#E2E8F0] flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Settings size={18} className="text-[#4A121A]" />
                <h3 className="font-extrabold text-[#0F172A] text-sm">App Configuration</h3>
              </div>
              <button 
                onClick={() => setShowSettingsModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-200 text-[#94A3B8] hover:text-[#64748B] transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider pl-1">
                  Groq API Key
                </label>
                <input 
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Paste your Groq API key here (gsk_...)"
                  className="w-full h-11 px-4 py-3 bg-[#FDFBF7] border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#DFBA6B] focus:ring-3 focus:ring-[#4A121A]/5 transition-all text-sm font-medium text-gray-800 placeholder-[#94A3B8]"
                />
                <p className="text-[10px] text-[#94A3B8] font-medium pl-1 leading-normal">
                  Your API key is saved safely in your browser's local storage and is only used to query the Groq Cloud platform.
                </p>
              </div>

              {/* Canva Connect API Section */}
              <div className="pt-4 border-t border-slate-100 space-y-4">
                <div className="flex items-center gap-1.5 pl-1">
                  <span className="w-2 h-2 rounded-full bg-[#3B82F6] animate-pulse" />
                  <h4 className="text-[10px] font-black uppercase text-[#3B82F6] tracking-wider">Canva Integration Settings</h4>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider pl-1">
                    Canva Client ID / Key
                  </label>
                  <input 
                    type="text"
                    value={canvaClientId}
                    onChange={(e) => setCanvaClientId(e.target.value)}
                    placeholder="Enter your Canva Developer Client ID"
                    className="w-full h-11 px-4 py-3 bg-[#FDFBF7] border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-blue-400 focus:ring-3 focus:ring-blue-100 transition-all text-sm font-medium text-gray-800 placeholder-[#94A3B8]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider pl-1">
                    Canva Client Secret
                  </label>
                  <input 
                    type="password"
                    value={canvaClientSecret}
                    onChange={(e) => setCanvaClientSecret(e.target.value)}
                    placeholder="Enter your Canva Developer Client Secret"
                    className="w-full h-11 px-4 py-3 bg-[#FDFBF7] border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-blue-400 focus:ring-3 focus:ring-blue-100 transition-all text-sm font-medium text-gray-800 placeholder-[#94A3B8]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider pl-1">
                    Canva Brand Template ID (Optional)
                  </label>
                  <input 
                    type="text"
                    value={canvaTemplateId}
                    onChange={(e) => setCanvaTemplateId(e.target.value)}
                    placeholder="e.g. DAFvA3_xyz8"
                    className="w-full h-11 px-4 py-3 bg-[#FDFBF7] border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-blue-400 focus:ring-3 focus:ring-blue-100 transition-all text-sm font-medium text-gray-800 placeholder-[#94A3B8]"
                  />
                  <p className="text-[10px] text-[#94A3B8] font-medium pl-1 leading-normal">
                    Connects directly to Canva's brand template to trigger autofilled whiteboards dynamically. Leave blank to use our default.
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-[#E2E8F0] flex items-center justify-end gap-3 bg-slate-50">
              <button 
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2 border border-[#E2E8F0] bg-white text-[#64748B] text-xs font-bold rounded-lg hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleSaveSettings}
                className="px-4 py-2 bg-gradient-to-r from-[#4A121A] to-[#5C1D24] text-white text-xs font-bold rounded-lg hover:brightness-105 active:scale-98 transition-all shadow-md shadow-amber-50"
              >
                Save Settings
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    {showOnboarding && <Onboarding onComplete={handleOnboardingComplete} />}
  </div>
  );
}
