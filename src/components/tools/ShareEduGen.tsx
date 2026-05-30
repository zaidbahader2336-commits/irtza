import { useState, useEffect } from 'react';
import { Share2, Mail, Copy, Check } from 'lucide-react';

interface ShareEduGenProps {
  isBanner?: boolean;
}

export default function ShareEduGen({ isBanner = false }: ShareEduGenProps) {
  const [shareCount, setShareCount] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    const savedCount = localStorage.getItem('edugen_share_count');
    if (savedCount) {
      setShareCount(parseInt(savedCount, 10));
    }
  }, []);

  const handleShareClick = (type: 'whatsapp' | 'copy' | 'twitter' | 'email') => {
    // Increment count
    const newCount = shareCount + 1;
    setShareCount(newCount);
    localStorage.setItem('edugen_share_count', newCount.toString());

    if (type === 'whatsapp') {
      window.open('https://wa.me/?text=Check%20out%20EduGen%20-%20AI%20study%20tool!%20edugenn.lovable.app', '_blank');
    } else if (type === 'copy') {
      navigator.clipboard.writeText('edugenn.lovable.app');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } else if (type === 'twitter') {
      window.open('https://twitter.com/intent/tweet?text=EduGen%20is%20amazing!%20edugenn.lovable.app', '_blank');
    } else if (type === 'email') {
      window.location.href = 'mailto:?subject=Check out EduGen&body=edugenn.lovable.app';
    }
  };

  return (
    <div 
      className={`border rounded-[14px] p-6 shadow-sm transition-all border-[#C7D2FE]`}
      style={{
        background: 'linear-gradient(135deg, #EEF2FF 0%, #E0F2FE 100%)'
      }}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 text-left">
          <div className="flex items-center gap-2">
            <Share2 size={20} className="text-[#4F46E5] animate-bounce" />
            <h3 className="text-[17px] font-bold text-[#1E1B4B] tracking-tight">
              Share EduGen with your friends! 🎉
            </h3>
          </div>
          <p className="text-[13px] text-[#64748B] font-medium">
            Help your classmates study smarter with AI
          </p>
        </div>

        {/* Link Box */}
        <div className="flex items-center gap-3 bg-white border border-[#C7D2FE] rounded-lg p-2 px-3 max-w-xs w-full self-start md:self-auto justify-between shadow-xs">
          <span className="font-mono text-sm font-bold text-[#4F46E5] tracking-tight">
            edugenn.lovable.app
          </span>
          <button
            onClick={() => handleShareClick('copy')}
            className={`p-1.5 rounded-md transition-colors ${
              copied ? 'bg-emerald-50 text-emerald-600' : 'hover:bg-indigo-50 text-[#6366F1]'
            }`}
            title="Copy website link"
          >
            {copied ? <Check size={15} /> : <Copy size={15} />}
          </button>
        </div>
      </div>

      {/* Share Buttons Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-6">
        {/* WhatsApp */}
        <button
          onClick={() => handleShareClick('whatsapp')}
          className="h-11 px-4 rounded-xl font-bold text-xs text-white bg-[#25D366] hover:brightness-105 active:scale-98 transition-all flex items-center justify-center gap-2 shadow-sm"
        >
          {/* Custom nice chat icon style */}
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.717-1.456L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.37 9.864-9.752.002-2.607-1.01-5.059-2.85-6.902C16.643 2.109 14.197.91 11.6.91c-5.431 0-9.854 4.37-9.858 9.753-.002 1.763.486 3.483 1.413 5.011L2.165 21.84l6.482-1.686z" />
          </svg>
          <span>Share on WhatsApp</span>
        </button>

        {/* Copy Link */}
        <button
          onClick={() => handleShareClick('copy')}
          className="h-11 px-4 rounded-xl font-bold text-xs text-white bg-[#6366F1] hover:brightness-105 active:scale-98 transition-all flex items-center justify-center gap-2 shadow-sm"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          <span>{copied ? 'Copied! ✓' : 'Copy Study Link'}</span>
        </button>

        {/* Twitter */}
        <button
          onClick={() => handleShareClick('twitter')}
          className="h-11 px-4 rounded-xl font-bold text-xs text-white bg-[#1DA1F2] hover:brightness-105 active:scale-98 transition-all flex items-center justify-center gap-2 shadow-sm"
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          <span>Share on Twitter</span>
        </button>

        {/* Email */}
        <button
          onClick={() => handleShareClick('email')}
          className="h-11 px-4 rounded-xl font-bold text-xs text-white bg-[#EA580C] hover:brightness-105 active:scale-98 transition-all flex items-center justify-center gap-2 shadow-sm"
        >
          <Mail size={16} />
          <span>Share via Email</span>
        </button>
      </div>

      <div className="mt-5 pt-4 border-t border-[#C7D2FE]/60 text-left flex items-center gap-1.5 text-xs font-bold text-[#4F46E5]">
        <span>⭐</span>
        <span>You've helped {shareCount} {shareCount === 1 ? 'friend' : 'friends'} discover EduGen</span>
      </div>
    </div>
  );
}
