import { Check } from 'lucide-react';

interface GoogleSlidesDiagramViewerProps {
  topic: string;
  defaultSvg?: string;
  onSave?: (savedUrl: string) => void;
}

export default function GoogleSlidesDiagramViewer({ topic, defaultSvg }: GoogleSlidesDiagramViewerProps) {
  if (!defaultSvg) {
    return null;
  }

  return (
    <div className="w-full bg-slate-50/50 border border-slate-200/60 rounded-2xl p-6 md:p-8 flex flex-col items-center justify-center shadow-xs mt-6 select-none animate-in fade-in zoom-in-95 duration-300">
      <div className="w-full max-w-3xl flex flex-col items-center text-center space-y-4">
        {/* Subtle decorative aesthetic header to let them know it's a dynamic visual mapping */}
        <div className="flex items-center gap-1.5 px-3 py-1 bg-[#4A121A]/5 border border-[#4A121A]/10 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-[#DFBA6B] animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#4A121A]">
            Technical Diagram Model: {topic}
          </span>
        </div>

        {/* Clean, premium background box designed to showcase the SVG exactly like an image */}
        <div className="w-full bg-white border border-slate-100 rounded-2xl p-4 md:p-6 shadow-sm flex items-center justify-center overflow-hidden transition-all hover:shadow-md">
          <div 
            className="w-full max-h-[480px] overflow-auto flex items-center justify-center [&_svg]:max-w-full [&_svg]:h-auto [&_svg]:max-h-[440px] [&_svg]:w-full select-none"
            dangerouslySetInnerHTML={{ __html: defaultSvg }}
          />
        </div>
        
        {/* Humble, short functional confirmation tagline */}
        <p className="text-[10px] font-medium text-slate-400 flex items-center gap-1">
          <Check size={11} className="text-emerald-500" />
          <span>Vector Blueprint generated in educational format</span>
        </p>
      </div>
    </div>
  );
}
