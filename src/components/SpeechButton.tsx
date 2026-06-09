import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

interface SpeechButtonProps {
  text: string;
  className?: string;
  size?: number;
}

export default function SpeechButton({ text, className = "", size = 15 }: SpeechButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    return () => {
      // Clean up sound on unmount
      if (isPlaying) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isPlaying]);

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    // Cancel any active speech synthesis so we don't pile up sounds
    window.speechSynthesis.cancel();

    if (!text || !text.trim()) return;

    // Remove markdown characters, HTML tags, brackets for clean voice speech
    const cleanText = text
      .replace(/[\*\#\`\_]/g, '')
      .replace(/\[\d+\]/g, '')
      .replace(/<\/?[^>]+(>|$)/g, "");

    const utterance = new SpeechSynthesisUtterance(cleanText);

    // Identify if the text is predominantly Urdu to apply correct language parameters
    const isUrduText = /([\u0600-\u06FF])/.test(cleanText);
    if (isUrduText) {
      utterance.lang = 'ur-PK';
    } else {
      utterance.lang = 'en-US';
    }

    // Discover standard browser voices
    const voices = window.speechSynthesis.getVoices();
    if (isUrduText) {
      const urduVoice = voices.find(v => v.lang.startsWith('ur') || v.lang.includes('PK'));
      if (urduVoice) utterance.voice = urduVoice;
    } else {
      // Find high quality voices (Google, Natural, Premium or English primary fallback)
      const premiumVoice = voices.find(v => 
        (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Premium')) && 
        v.lang.startsWith('en')
      ) || voices.find(v => v.lang.startsWith('en'));
      if (premiumVoice) utterance.voice = premiumVoice;
    }

    // Event listeners
    utterance.onend = () => {
      setIsPlaying(false);
    };
    utterance.onerror = () => {
      setIsPlaying(false);
    };

    setIsPlaying(true);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <button
      type="button"
      onClick={handleSpeak}
      className={`p-1.5 rounded-lg border border-slate-100 hover:bg-rose-50/30 text-rose-950/70 hover:text-rose-900 active:scale-95 transition-all shadow-3xs flex items-center justify-center cursor-pointer bg-white/80 shrink-0 ${className}`}
      title={isPlaying ? "Stop Speaking / بولنا بند کریں" : "Listen Text / سنیں"}
    >
      {isPlaying ? (
        <VolumeX size={size} className="animate-pulse text-rose-600" />
      ) : (
        <Volume2 size={size} />
      )}
    </button>
  );
}
