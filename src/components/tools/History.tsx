import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  History as HistoryIcon,
  Search,
  Trash2,
  Download,
  Calendar,
  Layers,
  CheckCircle2,
  FileText,
  BookOpen,
  PenTool,
  Trophy,
  GraduationCap
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { User, ToolType } from '../../types';
import { getUserHistory, deleteHistoryItem } from '../../lib/userData';
import { generatePDF } from '../../lib/pdf';
import ShareEduGen from './ShareEduGen';

interface HistoryProps {
  onDownload: (name: string) => void;
}

export default function History({ onDownload }: HistoryProps) {
  const [currentUser, setCurrentUser] = useState<User | null>(getUserHistory());
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('all');

  const handleDelete = (type: string, timestamp: number) => {
    if (confirm('Delete this history item?')) {
      const updatedUser = deleteHistoryItem(type, timestamp);
      if (updatedUser) setCurrentUser(updatedUser);
    }
  };

  const handleDownloadItem = (type: string, item: any) => {
    const { topic, data } = item;
    let content: any[] = [];

    if (type === 'mcqs') {
      content = [
        { type: 'heading', text: `${topic} Practice Quiz` },
        ...(data as any[]).map((q, i) => ([
          { type: 'subheading', text: `Question ${i + 1}: ${q.question}` },
          ...q.options.map((opt: string, oi: number) => ({ type: 'text', text: `${String.fromCharCode(65 + oi)}) ${opt}` })),
          { type: 'text', text: `Correct Answer: ${q.options[q.correctIndex]}` },
          { type: 'text', text: `Explanation: ${q.explanation}` },
        ])).flat()
      ];
    } else {
      content = [
        { type: 'heading', text: `${topic} Study Notes` },
        { type: 'text', text: JSON.stringify(data, null, 2) }
      ];
    }
    
    alert("Re-downloading study guide from Vault...");
    onDownload(`${topic} from history`);
  };

  if (!currentUser) return null;

  const allItems = [
    ...(currentUser.data.mcqs?.map(i => ({ ...i, type: 'mcqs', icon: CheckCircle2, label: 'MCQs', colorClass: 'text-indigo-500 bg-indigo-50' })) || []),
    ...(currentUser.data.shortQs?.map(i => ({ ...i, type: 'shortQs', icon: FileText, label: 'Short Qs', colorClass: 'text-blue-500 bg-blue-50' })) || []),
    ...(currentUser.data.longQs?.map(i => ({ ...i, type: 'longQs', icon: BookOpen, label: 'Essays', colorClass: 'text-cyan-500 bg-cyan-50' })) || []),
    ...(currentUser.data.exams?.map(i => ({ ...i, type: 'exams', icon: Trophy, label: 'Exam', colorClass: 'text-rose-500 bg-rose-50' })) || []),
    ...(currentUser.data.stories?.map(i => ({ ...i, type: 'stories', icon: PenTool, label: 'Story', colorClass: 'text-emerald-500 bg-emerald-50' })) || []),
    ...(currentUser.data.letters?.map(i => ({ ...i, type: 'letters', icon: PenTool, label: 'Letter', colorClass: 'text-purple-500 bg-purple-50' })) || []),
    ...(currentUser.data.explanations?.map(i => ({ ...i, type: 'explanations', icon: Search, label: 'Lesson', colorClass: 'text-amber-500 bg-amber-50' })) || []),
  ].sort((a, b) => b.timestamp - a.timestamp);

  const filteredItems = allItems.filter(i => {
    const matchesSearch = i.topic.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || i.type === filter;
    return matchesSearch && matchesFilter;
  });

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-6 h-full flex flex-col animate-in fade-in duration-300">
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center shrink-0 shadow-sm border border-indigo-100">
                <HistoryIcon size={24} />
             </div>
             <div>
                <h1 className="text-lg font-black text-[#0F172A] tracking-tight">Study Vault</h1>
                <p className="text-xs text-[#64748B] font-bold">Access structured academic papers and history keys.</p>
             </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
             <div className="relative group">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8] group-focus-within:text-indigo-500" />
                <input 
                  type="text"
                  placeholder="Query topic..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-4 h-11 bg-white border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#6366F1] focus:ring-3 focus:ring-[#6366F1]/10 transition-all text-xs font-bold text-gray-700 w-full sm:w-56 placeholder-[#94A3B8]"
                />
             </div>
             
             <select 
               value={filter}
               onChange={(e) => setFilter(e.target.value)}
               className="px-4 h-11 bg-white border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#6366F1] focus:ring-3 focus:ring-[#6366F1]/10 transition-all text-xs font-bold text-gray-600 cursor-pointer shadow-xs min-w-[140px]"
             >
                <option value="all">📁 All Content</option>
                <option value="mcqs">🎯 MCQs</option>
                <option value="exams">🎓 Exams</option>
                <option value="explanations">💡 Lessons</option>
                <option value="stories">📝 Creative</option>
             </select>
          </div>
       </div>

       {filteredItems.length === 0 ? (
         <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-white rounded-2xl border border-dashed border-[#E2E8F0] shadow-xs min-h-[300px]">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-6">
               <Layers size={32} className="text-gray-300" />
            </div>
            <h2 className="text-lg font-bold text-[#0F172A]">Your Vault is empty</h2>
            <p className="text-[#64748B] max-w-xs mt-1 text-xs font-semibold">Generate structured curriculum summaries and exercises to see them populate here.</p>
         </div>
       ) : (
         <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 overflow-y-auto max-h-[500px] custom-scrollbar pb-12 pr-1">
            {filteredItems.map((item) => (
              <motion.div 
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                key={item.timestamp}
                className="group bg-white rounded-xl border border-[#E2E8F0] p-5 hover:border-[#6366F1] hover:shadow-md transition-all flex flex-col justify-between"
              >
                 <div className="space-y-4">
                    <div className="flex items-center justify-between">
                       <span className={cn("px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-lg border", item.colorClass)}>
                         {item.label}
                       </span>
                       <div className="flex items-center gap-1 text-[#94A3B8] text-[10px] font-heavy font-sans">
                          <Calendar size={11} />
                          <span>{formatDate(item.timestamp)}</span>
                       </div>
                    </div>
                    
                    <div className="space-y-1">
                       <h3 className="text-sm font-black text-[#0F172A] truncate group-hover:text-[#6366F1] transition-colors leading-snug">
                         {item.topic}
                       </h3>
                       <div className="flex items-center gap-1.5 text-[11px] text-[#64748B] font-bold">
                          <item.icon size={13} className="text-[#64748B]" />
                          <span>{item.label} Generation</span>
                       </div>
                    </div>
                 </div>

                 <div className="flex items-center justify-between pt-4 mt-4 border-t border-[#E2E8F0]">
                    <button 
                      type="button"
                      onClick={() => handleDownloadItem(item.type, item)}
                      className="w-8 h-8 rounded-lg bg-[#F8FAFF] text-[#6366F1] border border-[#E2E8F0] hover:bg-[#6366F1] hover:text-white transition-all flex items-center justify-center cursor-pointer shadow-xs"
                      title="Download Pack"
                    >
                      <Download size={13} />
                    </button>
                    <button 
                      type="button"
                      onClick={() => handleDelete(item.type, item.timestamp)}
                      className="w-8 h-8 rounded-lg bg-red-50 text-red-500 border border-red-100 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center cursor-pointer"
                      title="Delete Entry"
                    >
                      <Trash2 size={13} />
                    </button>
                 </div>
              </motion.div>
            ))}
         </div>
       )}
       <div className="mt-8 pt-6 border-t border-[#E2E8F0]">
         <ShareEduGen isBanner={true} />
       </div>
    </div>
  );
}
