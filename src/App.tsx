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
  Share2
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
import ShareEduGen from './components/tools/ShareEduGen';
import { getOrCreateDefaultUser } from './lib/userData';
import { ToolType, User } from './types';

export default function App() {
  const [activeTool, setActiveTool] = useState<ToolType>('home');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [downloads, setDownloads] = useState<string[]>([]);
  const [user, setUser] = useState<User>(getOrCreateDefaultUser());
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [isMobile, setIsMobile] = useState(false);

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
  }, []);

  const handleSaveSettings = () => {
    localStorage.setItem('edugen_gemini_api_key', apiKey);
    setShowSettingsModal(false);
  };

  const tools = [
    { 
      id: 'mcq', 
      name: 'MCQ Generator', 
      icon: HelpCircle, 
      color: '#6366F1', 
      bgColor: 'bg-[#6366F1]/10', 
      hoverColor: 'hover:border-[#6366F1]',
      borderStyle: 'hover:border-[#6366F1]/50 group-hover:text-[#6366F1]',
      description: 'Generate & solve practice questions automatically' 
    },
    { 
      id: 'short', 
      name: 'Short Questions', 
      icon: PenTool, 
      color: '#3B82F6', 
      bgColor: 'bg-[#3B82F6]/10', 
      hoverColor: 'hover:border-[#3B82F6]',
      borderStyle: 'hover:border-[#3B82F6]/50 group-hover:text-[#3B82F6]',
      description: 'Quick conceptual checks and answers' 
    },
    { 
      id: 'long', 
      name: 'Long Questions', 
      icon: FileText, 
      color: '#06B6D4', 
      bgColor: 'bg-[#06B6D4]/10', 
      hoverColor: 'hover:border-[#06B6D4]',
      borderStyle: 'hover:border-[#06B6D4]/50 group-hover:text-[#06B6D4]',
      description: 'Deep dive essay questions and structured outline' 
    },
    { 
      id: 'explainer', 
      name: 'Topic Explainer', 
      icon: Lightbulb, 
      color: '#F59E0B', 
      bgColor: 'bg-[#F59E0B]/10', 
      hoverColor: 'hover:border-[#F59E0B]',
      borderStyle: 'hover:border-[#F59E0B]/50 group-hover:text-[#F59E0B]',
      description: 'Simplify complex academic topics with analogies' 
    },
    { 
      id: 'story-letter', 
      name: 'Story & Letter', 
      icon: BookOpen, 
      color: '#EC4899', 
      bgColor: 'bg-[#EC4899]/10', 
      hoverColor: 'hover:border-[#EC4899]',
      borderStyle: 'hover:border-[#EC4899]/50 group-hover:text-[#EC4899]',
      description: 'Generate custom educational stories or letters' 
    },
    { 
      id: 'exam', 
      name: 'Exam Mode', 
      icon: Clock, 
      color: '#EF4444', 
      bgColor: 'bg-[#EF4444]/10', 
      hoverColor: 'hover:border-[#EF4444]',
      borderStyle: 'hover:border-[#EF4444]/50 group-hover:text-[#EF4444]',
      description: 'Full real-time exam prep simulator' 
    },
    { 
      id: 'visual', 
      name: 'Visual Analysis', 
      icon: Eye, 
      color: '#8B5CF6', 
      bgColor: 'bg-[#8B5CF6]/10', 
      hoverColor: 'hover:border-[#8B5CF6]',
      borderStyle: 'hover:border-[#8B5CF6]/50 group-hover:text-[#8B5CF6]',
      description: 'Upload PDFs/images to grade, solve coursework, or generate practice material' 
    },
    { 
      id: 'history', 
      name: 'My Downloads', 
      icon: Download, 
      color: '#10B981', 
      bgColor: 'bg-[#10B981]/10', 
      hoverColor: 'hover:border-[#10B981]',
      borderStyle: 'hover:border-[#10B981]/50 group-hover:text-[#10B981]',
      description: 'Review and manage your saved content vault' 
    },
    { 
      id: 'share', 
      name: 'Share', 
      icon: Share2, 
      color: '#4F46E5', 
      bgColor: 'bg-[#4F46E5]/10', 
      hoverColor: 'hover:border-[#4F46E5]',
      borderStyle: 'hover:border-[#4F46E5]/50 group-hover:text-[#4F46E5]',
      description: 'Invite your classmates and friends' 
    },
  ];

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
          "border-r border-[#E2E8F0] bg-white flex flex-col z-40 h-full shrink-0 shadow-xl md:shadow-none",
          isMobile ? "fixed inset-y-0 left-0" : "relative"
        )}
      >
        {/* App Logo */}
        <div className="p-6 flex flex-col">
          <div className={cn("flex items-center justify-between gap-3 mb-4", !sidebarOpen && !isMobile && "justify-center w-full")}>
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 bg-gradient-to-br from-[#6366F1] to-[#3B82F6] rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-100 flex-shrink-0 cursor-pointer animate-pulse" 
                onClick={() => selectTool('home')}
              >
                <GraduationCap size={22} className="text-white" />
              </div>
              {(sidebarOpen || isMobile) && (
                <h1 
                  onClick={() => selectTool('home')}
                  className="text-2xl font-black bg-gradient-to-r from-[#6366F1] to-[#3B82F6] bg-clip-text text-transparent hover:opacity-90 transition-all cursor-pointer tracking-tight"
                >
                  EduGen
                </h1>
              )}
            </div>

            {isMobile && sidebarOpen && (
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                aria-label="Close Sidebar"
              >
                <X size={18} />
              </button>
            )}
          </div>
          {(sidebarOpen || isMobile) && (
            <div className="h-[2px] w-full bg-gradient-to-r from-[#6366F1] to-[#3B82F6] rounded-full opacity-60" />
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 space-y-1.5 mt-2 overflow-y-auto">
          {/* Home Button */}
          <button
            id="nav-home"
            onClick={() => selectTool('home')}
            className={cn(
              "w-full h-11 flex items-center gap-3 px-3 rounded-lg transition-all duration-150 group relative font-medium text-sm",
              activeTool === 'home' 
                ? "bg-indigo-50/50 border-l-3 border-[#6366F1] text-[#6366F1] font-semibold" 
                : "text-[#64748B] hover:bg-[#EEF2FF] hover:text-[#6366F1]"
            )}
          >
            <Home size={18} className={cn("shrink-0", activeTool === 'home' ? "text-[#6366F1]" : "text-[#94A3B8] group-hover:text-[#6366F1]")} />
            {(sidebarOpen || isMobile) && <span>Dashboard</span>}
            {!sidebarOpen && !isMobile && (
              <div className="absolute left-full ml-2 px-2.5 py-1.5 bg-[#0F172A] text-white text-xs font-semibold rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 whitespace-nowrap shadow-xl">
                Dashboard
              </div>
            )}
          </button>

          {tools.map((tool) => {
            const Icon = tool.icon;
            const isActive = activeTool === tool.id;
            return (
              <button
                key={tool.id}
                id={`nav-${tool.id}`}
                onClick={() => selectTool(tool.id as ToolType)}
                className={cn(
                  "w-full h-11 flex items-center gap-3 px-3 rounded-lg transition-all duration-150 group relative font-medium text-sm",
                  isActive 
                    ? "bg-indigo-50/50 border-l-3 border-[#6366F1] text-[#6366F1] font-semibold" 
                    : "text-[#64748B] hover:bg-[#EEF2FF] hover:text-[#6366F1]"
                )}
              >
                <Icon 
                  size={18} 
                  className="shrink-0 transition-colors" 
                  style={{ color: isActive ? '#6366F1' : tool.color }} 
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
        </nav>

        {/* Sidebar Footer User Details */}
        <div className="p-4 mt-auto border-t border-[#E2E8F0] space-y-4">
          {(sidebarOpen || isMobile) && (
            <div className="bg-[#F8FAFF] p-4 rounded-xl border border-[#E2E8F0]">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Student Status</span>
                <span className="text-[10px] font-extrabold text-[#3B82F6]">ACTIVE</span>
              </div>
              <div className="w-full bg-[#E2E8F0] h-1.5 rounded-full mb-2">
                <div className="bg-gradient-to-r from-[#6366F1] to-[#3B82F6] h-1.5 rounded-full w-[85%]"></div>
              </div>
              <p className="text-[10px] text-[#64748B] font-bold uppercase tracking-widest leading-none">
                {user.name.split(' ')[0]}'s Study Plan
              </p>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <div className={cn("flex items-center gap-3", !sidebarOpen && !isMobile && "justify-center w-full")}>
              <div className="w-10 h-10 bg-gradient-to-br from-[#6366F1] to-[#3B82F6] rounded-full flex items-center justify-center text-white font-extrabold shadow-md shadow-indigo-100 uppercase text-sm flex-shrink-0">
                {user.name.charAt(0)}
              </div>
              {(sidebarOpen || isMobile) && (
                <div className="text-left overflow-hidden w-28">
                  <p className="text-xs font-bold text-[#0F172A] truncate leading-none mb-1">{user.name}</p>
                  <p className="text-[10px] text-[#64748B] truncate font-medium">{user.gmail}</p>
                </div>
              )}
            </div>
          </div>

          {!isMobile && (
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="w-full h-8 flex items-center justify-center border border-[#E2E8F0] rounded-lg hover:bg-[#EEF2FF] transition-colors text-[#94A3B8] hover:text-[#6366F1]"
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
                className="p-2 text-[#64748B] hover:text-[#6366F1] rounded-lg hover:bg-[#EEF2FF] transition-colors"
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
                className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 h-9 border border-[#E2E8F0] rounded-lg text-xs font-semibold text-[#64748B] hover:bg-gray-50 transition-colors"
              >
                <Home size={14} />
                <span>Dashboard</span>
              </button>
            )}

            <div className="relative">
              <button 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2.5 p-1 px-2 hover:bg-[#F8FAFF] rounded-lg border border-transparent hover:border-[#E2E8F0] transition-all"
              >
                <div className="w-8 h-8 bg-gradient-to-br from-[#3B82F6] to-[#06B6D4] rounded-lg flex items-center justify-center text-white font-extrabold text-xs uppercase shadow-md shadow-blue-100">
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
                    <div className="px-5 py-3 border-b border-[#E2E8F0] bg-[#F8FAFF]">
                       <p className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider mb-0.5">Logged In Account</p>
                       <p className="text-xs font-bold text-[#0F172A] truncate leading-none">{user.name}</p>
                       <p className="text-[10px] text-[#64748B] truncate mt-1">{user.gmail}</p>
                    </div>
                    <button 
                      onClick={() => {
                        selectTool('history');
                        setShowProfileMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-5 py-3 text-xs font-bold text-[#64748B] hover:bg-[#EEF2FF] hover:text-[#3B82F6] transition-colors"
                    >
                      <Download size={16} />
                      <span>Vault (My Downloads)</span>
                    </button>
                    <button 
                      onClick={() => {
                        setShowSettingsModal(true);
                        setShowProfileMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-5 py-3 text-xs font-bold text-[#64748B] hover:bg-[#EEF2FF] hover:text-[#3B82F6] transition-colors"
                    >
                      <Settings size={16} />
                      <span>App Settings</span>
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
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 md:p-8 rounded-2xl border border-[#E2E8F0] shadow-sm relative overflow-hidden">
                      <div className="absolute right-0 top-0 w-48 h-48 bg-gradient-to-bl from-[#6366F1]/5 to-transparent rounded-bl-full pointer-events-none" />
                      <div>
                        <h2 className="text-2xl md:text-3xl font-black text-[#0F172A] tracking-tight mb-2">
                          Welcome, <span className="text-[#6366F1]">{user.name}</span>! 👋
                        </h2>
                        <p className="text-[#64748B] font-medium text-sm">
                          Select one of our specialized educational tools below to start generating high-quality study content.
                        </p>
                      </div>
                      <button 
                        onClick={() => selectTool('history')}
                        className="flex items-center gap-2.5 px-5 py-3 bg-gradient-to-r from-[#6366F1] to-[#3B82F6] text-white rounded-lg font-semibold text-sm shadow-md hover:opacity-95 transform hover:scale-[1.01] transition-all flex-shrink-0 w-full sm:w-auto justify-center"
                      >
                        <Download size={16} />
                        <span>Open Study Vault</span>
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Sparkles size={18} className="text-[#6366F1]" />
                        <h3 className="text-lg font-extrabold text-[#0f172a] uppercase tracking-wider text-xs">AI Workspace Tools</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                        {tools.map((tool) => {
                          const Icon = tool.icon;
                          return (
                            <div
                              key={tool.id}
                              onClick={() => selectTool(tool.id as ToolType)}
                              className="group bg-white rounded-xl border border-[#E2E8F0] p-5 md:p-6 hover:shadow-xl hover:shadow-[#6366F1]/5 transition-all duration-200 cursor-pointer hover:border-indigo-400 relative flex flex-col justify-between"
                            >
                              <div className="space-y-4">
                                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-colors shadow-sm", tool.bgColor)}>
                                  <Icon size={20} style={{ color: tool.color }} />
                                </div>
                                <div className="space-y-1">
                                  <h4 className="text-base font-bold text-[#0F172A] group-hover:text-[#6366F1] transition-colors">
                                    {tool.name}
                                  </h4>
                                  <p className="text-xs text-[#64748B] leading-relaxed">
                                    {tool.description}
                                  </p>
                                </div>
                              </div>

                              <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between text-xs font-bold text-[#6366F1]">
                                <span className="group-hover:translate-x-1 transition-transform">Open tool →</span>
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
                    {activeTool === 'share' && <ShareEduGen />}
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
                <Settings size={18} className="text-[#6366F1]" />
                <h3 className="font-extrabold text-[#0F172A] text-sm">App Configuration</h3>
              </div>
              <button 
                onClick={() => setShowSettingsModal(false)}
                className="p-1.5 rounded-lg hover:bg-slate-200 text-[#94A3B8] hover:text-[#64748B] transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider pl-1">
                  Groq API Key
                </label>
                <input 
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Paste your Groq API key here (gsk_...)"
                  className="w-full h-11 px-4 py-3 bg-[#F8FAFF] border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#6366F1] focus:ring-3 focus:ring-[#6366F1]/10 transition-all text-sm font-medium text-gray-800 placeholder-[#94A3B8]"
                />
                <p className="text-[10px] text-[#94A3B8] font-medium pl-1 leading-normal">
                  Your API key is saved safely in your browser's local storage and is only used to query the Groq Cloud platform.
                </p>
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
                className="px-4 py-2 bg-gradient-to-r from-[#6366F1] to-[#3B82F6] text-white text-xs font-bold rounded-lg hover:brightness-105 active:scale-98 transition-all shadow-md shadow-indigo-100"
              >
                Save Settings
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  </div>
  );
}
