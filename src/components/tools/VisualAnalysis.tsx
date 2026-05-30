import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { 
  Eye,
  Upload,
  FileText,
  Trash2,
  AlertTriangle,
  Settings,
  Sparkles,
  ArrowRight,
  Download,
  CheckCircle,
  Lightbulb,
  FileQuestion,
  GraduationCap,
  Clock,
  Menu,
  CheckCircle2,
  XCircle,
  RotateCcw,
  BookOpen,
  HelpCircle,
  Award,
  Book,
  Copy,
  Check,
  Info,
  PenTool,
  Image as ImageIcon,
  Search,
  ExternalLink
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { generatePDF, PDFItem } from '../../lib/pdf';
import { saveToUserHistory } from '../../lib/userData';
import confetti from 'canvas-confetti';

interface Props {
  onDownload: (name: string) => void;
}

interface MCQItem {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface ShortQItem {
  question: string;
  modelAnswer: string;
}

interface LongQItem {
  question: string;
  modelAnswer: string;
  keyPoints: string[];
}

interface ExamStructure {
  mcqs: MCQItem[];
  shortQuestions: ShortQItem[];
  longQuestions: LongQItem[];
}

export default function VisualAnalysis({ onDownload }: Props) {
  // Input Config state
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [pdfPageCount, setPdfPageCount] = useState<number>(0);
  const [convertedImages, setConvertedImages] = useState<{data: string, mimeType: string}[]>([]);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [pdfText, setPdfText] = useState<string>('');
  const [classLevel, setClassLevel] = useState('High School (Grade 9-10)');
  const [language, setLanguage] = useState('English');
  const [task, setTask] = useState('solve');
  const [instructions, setInstructions] = useState('');
  
  // App state
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [resultText, setResultText] = useState<string | null>(null);
  const [resultJson, setResultJson] = useState<any | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Interactive Live Modes
  const [quizIndex, setQuizIndex] = useState(-1); // -1 = show list or standard view, >=0 = active question
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [animatedScore, setAnimatedScore] = useState(0);
  
  // Short Questions live evaluation
  const [shortAnswers, setShortAnswers] = useState<Record<number, string>>({});
  const [shortFeedbacks, setShortFeedbacks] = useState<Record<number, { score: number; feedback: string; improvement: string }>>({});
  const [checkingShort, setCheckingShort] = useState<Record<number, boolean>>({});

  // Pexels API integration states
  const [pexelsPhotos, setPexelsPhotos] = useState<any[]>([]);
  const [pexelsQuery, setPexelsQuery] = useState('');
  const [pexelsLoading, setPexelsLoading] = useState(false);
  const [pexelsError, setPexelsError] = useState<string | null>(null);

  const cleanQueryText = (rawStr: string): string => {
    if (!rawStr) return '';
    // Strip file extensions, chapter titles, lesson numbers, punctuation, common filler words
    let term = rawStr
      .replace(/\.[^/.]+$/, "") // delete extensions (.pdf, .png etc)
      .replace(/\b(ch|chap|chapter|sec|section|lec|lecture|slide|week|unit|quiz|assignment|exam|test|doc|docx|ppt|pptx|pdf)\b\s*\d*/gi, "") // slides reference numbers
      .replace(/[_-]/g, " ") // replace dashes or underscores
      .replace(/[^\w\s]/g, "") // punctuation
      .trim()
      .replace(/\s+/g, " "); // consolidate whitespace
    return term;
  };

  const getInitialPexelsQuery = (): string => {
    if (!file) return '';
    const cleanName = cleanQueryText(file.name);
    if (!cleanName || cleanName.length < 2) return 'educational science';
    
    // Add specific scientific qualifiers depending on context
    const lower = cleanName.toLowerCase();
    if (lower.includes('heart') || lower.includes('brain') || lower.includes('cell') || lower.includes('dna') || lower.includes('plant') || lower.includes('anatomy') || lower.includes('body')) {
      return `${cleanName} diagram`;
    }
    return cleanName;
  };

  const getSuggestedTags = () => {
    if (!file) return [];
    const base = cleanQueryText(file.name);
    if (!base) return ['educational diagram', 'science science'];

    const tags = [base];
    const lower = base.toLowerCase();

    // Dynamically design smart textbook queries depending on matched academic domains
    if (lower.includes('cell') || lower.includes('bio') || lower.includes('plant') || lower.includes('animal') || lower.includes('mitosis') || lower.includes('chloroplast') || lower.includes('photic')) {
      tags.push(`${base} cell biology`);
      tags.push("biology model");
      tags.push("laboratory science");
    } else if (lower.includes('heart') || lower.includes('brain') || lower.includes('body') || lower.includes('muscle') || lower.includes('organ') || lower.includes('anatomy') || lower.includes('bone') || lower.includes('eye')) {
      tags.push(`${base} anatomy`);
      tags.push("medical blueprint");
      tags.push("human organ model");
    } else if (lower.includes('atom') || lower.includes('molecule') || lower.includes('chem') || lower.includes('acid') || lower.includes('bond') || lower.includes('reaction')) {
      tags.push(`${base} molecular model`);
      tags.push("chemistry concept");
      tags.push("atomic schematic");
    } else if (lower.includes('earth') || lower.includes('planet') || lower.includes('star') || lower.includes('space') || lower.includes('solar') || lower.includes('orbit')) {
      tags.push(`${base} solar system`);
      tags.push("planetary scheme");
      tags.push("space textbook graphic");
    } else {
      // General science topics
      tags.push(`${base} diagram model`);
      tags.push(`${base} illustration schematic`);
      tags.push("educational graphics");
    }

    return Array.from(new Set(tags)).filter(t => t && t.trim().length > 2).slice(0, 5);
  };

  const fetchPexelsDiagrams = async (searchTerm: string) => {
    if (!searchTerm || !searchTerm.trim()) return;
    setPexelsLoading(true);
    setPexelsError(null);
    try {
      const res = await fetch(`/api/pexels-search?query=${encodeURIComponent(searchTerm)}&per_page=12`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch images from Pexels.");
      }
      
      let photos = data.photos || [];

      // Smart Broad Fallback if 0 results
      if (photos.length === 0) {
        let fallbackTerm = "science diagram";
        const lower = searchTerm.toLowerCase();
        if (lower.includes('cell') || lower.includes('bio') || lower.includes('plant') || lower.includes('animal') || lower.includes('mitosis') || lower.includes('chloroplast') || lower.includes('photic')) {
          fallbackTerm = "biology model";
        } else if (lower.includes('heart') || lower.includes('brain') || lower.includes('body') || lower.includes('muscle') || lower.includes('organ') || lower.includes('anatomy') || lower.includes('bone') || lower.includes('eye')) {
          fallbackTerm = "human anatomy model";
        } else if (lower.includes('atom') || lower.includes('molecular') || lower.includes('chem') || lower.includes('reaction') || lower.includes('acid') || lower.includes('bond')) {
          fallbackTerm = "chemistry formula illustration";
        } else if (lower.includes('space') || lower.includes('star') || lower.includes('planet') || lower.includes('system') || lower.includes('solar') || lower.includes('orbit')) {
          fallbackTerm = "solar system space";
        }

        console.warn(`0 results for "${searchTerm}", trying fallback search: "${fallbackTerm}"`);
        const fallbackRes = await fetch(`/api/pexels-search?query=${encodeURIComponent(fallbackTerm)}&per_page=12`);
        const fallbackData = await fallbackRes.json();
        if (fallbackRes.ok && fallbackData.photos && fallbackData.photos.length > 0) {
          photos = fallbackData.photos;
        }
      }

      setPexelsPhotos(photos);
    } catch (err: any) {
      console.error(err);
      setPexelsError(err.message || "Unable to load diagrams from Pexels.");
    } finally {
      setPexelsLoading(false);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Score counter animation
  useEffect(() => {
    if (quizComplete && resultJson?.questions) {
      const percentage = Math.round((quizScore / resultJson.questions.length) * 100) || 0;
      let start = 0;
      const duration = 1000;
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
  }, [quizComplete, quizScore, resultJson]);

  // Load PDF.js from CDN dynamically
  const loadPdfJS = (): Promise<any> => {
    return new Promise((resolve, reject) => {
      if ((window as any).pdfjsLib) {
        resolve((window as any).pdfjsLib);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.min.js';
      script.onload = () => {
        const pdfjsLib = (window as any).pdfjsLib;
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
        resolve(pdfjsLib);
      };
      script.onerror = () => reject(new Error('Failed to load PDF.js library'));
      document.head.appendChild(script);
    });
  };

  // Convert files
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      await processSelectedFile(selectedFile);
    }
  };

  const processSelectedFile = async (file: File) => {
    setError(null);
    if (file.size > 10 * 1024 * 1024) {
      setError("File exceeds the 10MB size limit. Please upload a smaller document.");
      return;
    }

    setFile(file);
    setImageBase64(null);
    setConvertedImages([]);
    setFilePreview(null);
    setPdfPageCount(0);
    setPdfText('');

    const isPDF = file.type === 'application/pdf' || file.name.endsWith('.pdf');

    if (isPDF) {
      setLoading(true);
      setLoadingStep("Reading PDF document pages...");
      const fileReader = new FileReader();
      fileReader.onload = async (e) => {
        try {
          const typedarray = new Uint8Array(e.target?.result as ArrayBuffer);
          const pdfjsLib = await loadPdfJS();
          const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
          setPdfPageCount(pdf.numPages);
          
          let fullText = "";
          const pageImages: { data: string; mimeType: string }[] = [];
          
          for (let i = 1; i <= pdf.numPages; i++) {
            setLoadingStep(`Extracting text and rendering page ${i} of ${pdf.numPages}...`);
            const page = await pdf.getPage(i);
            
            // Extract text from current page
            try {
              const textContent = await page.getTextContent();
              const pageText = textContent.items.map((item: any) => item.str).join(" ");
              fullText += `--- Page ${i} ---\n${pageText}\n\n`;
            } catch (textErr) {
              console.warn(`Could not extract text from page ${i}:`, textErr);
            }

            const viewport = page.getViewport({ scale: 1.5 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            
            await page.render({ canvasContext: context!, viewport }).promise;
            const base64 = canvas.toDataURL('image/jpeg', 0.82);
            const base64Data = base64.split(',')[1];
            pageImages.push({ data: base64Data, mimeType: 'image/jpeg' });
          }
          setPdfText(fullText);
          setConvertedImages(pageImages);
        } catch (err: any) {
          console.error("PDF processing failure:", err);
          setError("Failed to convert PDF file pages or extract text. Ensure the document is not password protected.");
          setFile(null);
        } finally {
          setLoading(false);
          setLoadingStep("");
        }
      };
      fileReader.readAsArrayBuffer(file);
    } else {
      // It's an image file
      const fileReader = new FileReader();
      fileReader.onload = (e) => {
        const base64 = e.target?.result as string;
        setFilePreview(base64);
        const base64Data = base64.split(',')[1];
        setImageBase64(base64Data);
      };
      fileReader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      await processSelectedFile(droppedFile);
    }
  };

  const removeFile = () => {
    setFile(null);
    setFilePreview(null);
    setImageBase64(null);
    setConvertedImages([]);
    setPdfPageCount(0);
    setPdfText('');
    setError(null);
    setResultText(null);
    setResultJson(null);
    resetQuiz();
  };

  const handleCopy = () => {
    if (resultText) {
      navigator.clipboard.writeText(resultText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Run Vision Analysis Model
  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    setLoadingStep("Querying Groq Engine (Extracted PDF Text / Vision)...");
    setError(null);
    setResultText(null);
    setResultJson(null);
    resetQuiz();

    const userKey = localStorage.getItem('edugen_gemini_api_key');

    try {
      const payload: any = {
        task,
        classLevel,
        instructions,
        userKey,
        pdfText,
        language
      };

      if (pdfText && pdfText.trim()) {
        // PDF has its text extracted, no need to force attach images for text model
      } else if (convertedImages.length > 0) {
        payload.fileDataList = convertedImages;
      } else if (imageBase64) {
        payload.fileData = imageBase64;
        payload.mimeType = file.type || "image/jpeg";
      } else {
        throw new Error("Missing translated image segments.");
      }

      const res = await fetch('/api/visual-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errDetails = await res.json();
        throw new Error(errDetails.error || `Server responded with ${res.status}`);
      }

      const data = await res.json();
      setResultText(data.text);
      if (data.json) {
        setResultJson(data.json);
        // Save to historic vault downloads
        saveToUserHistory(
          task === 'mcq' ? 'mcqs' : task === 'short-questions' ? 'shortQs' : 'exams',
          `Visual Analysis: ${file.name}`,
          data.json
        );
        if (task === 'mcq' || task === 'short-questions') {
          setQuizIndex(0);
        }
      } else {
        // Save markdown histories
        saveToUserHistory('explanations', `Analysis: ${file.name}`, {
          title: `Analysis: ${file.name}`,
          summary: `Extracted visual breakdown for your reference on ${file.name}.`,
          keyConcepts: ["Visual Scan Complete"],
          analogy: "Like translated transcripts of complex notes.",
          misconceptions: ["Ensure high resolution files are uploaded for complex diagrams."],
          detailedExplanation: data.text
        });
      }

      // Automatically search Pexels diagrams
      const initialQuery = getInitialPexelsQuery();
      if (initialQuery) {
        setPexelsQuery(initialQuery);
        fetchPexelsDiagrams(initialQuery);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred during Groq analysis query.");
    } finally {
      setLoading(false);
      setLoadingStep("");
    }
  };

  // Reset quiz state
  const resetQuiz = () => {
    setQuizIndex(-1);
    setSelectedOption(null);
    setIsAnswerSubmitted(false);
    setQuizScore(0);
    setQuizComplete(false);
    setExpandedIndex(null);
    setShortAnswers({});
    setShortFeedbacks({});
    setCheckingShort({});
  };

  // PDF Download Helper
  const handleDownloadReport = () => {
    if (!file) return;
    
    const isPDF = file.type === 'application/pdf' || file.name.endsWith('.pdf');
    const taskLabels: Record<string, string> = {
      solve: "Questions & Solved Answers",
      explain: "Topic Concept Breakdown",
      summarize: "Key Notes Summary",
      mcq: "Generated MCQ Classroom Quiz",
      'short-questions': "Generated Conceptual Brief Exercises",
      'exam-paper': "Comprehensive Practice Assessment Paper"
    };

    const pdfContent: PDFItem[] = [
      { type: 'heading', text: `EduGen Visual Analysis Report` },
      { type: 'subheading', text: `Document Summary Details` },
      { type: 'text', text: `Source Document: ${file.name}` },
      { type: 'text', text: `Format: ${isPDF ? 'PDF (' + pdfPageCount + ' pages)' : 'Captured Image'}` },
      { type: 'text', text: `Target Grade: ${classLevel}` },
      { type: 'text', text: `Configured Task: ${taskLabels[task] || task}` },
      { type: 'text', text: `Analysis Date: ${new Date().toLocaleDateString()}` },
      { type: 'blankLines', count: 1 },
      { type: 'heading', text: `Extracted Analytics & Solutions` }
    ];

    if (task === 'mcq' && resultJson?.questions) {
      resultJson.questions.forEach((q: MCQItem, i: number) => {
        pdfContent.push({ type: 'subheading', text: `Question ${i + 1}: ${q.question}` });
        q.options.forEach((opt: string, optI: number) => {
          pdfContent.push({ type: 'text', text: `   ${String.fromCharCode(65 + optI)}) ${opt}` });
        });
        pdfContent.push({ type: 'text', text: `Correct Option: ${String.fromCharCode(65 + q.correctIndex)}` });
        pdfContent.push({ type: 'text', text: `Explanation: ${q.explanation}` });
      });
    } else if (task === 'short-questions' && resultJson?.questions) {
      resultJson.questions.forEach((q: ShortQItem, i: number) => {
        pdfContent.push({ type: 'subheading', text: `Concept Prompt ${i + 1}: ${q.question}` });
        pdfContent.push({ type: 'text', text: `Model Reference Answer: ${q.modelAnswer}` });
      });
    } else if (task === 'exam-paper' && resultJson) {
      // MCQs
      if (resultJson.mcqs && resultJson.mcqs.length > 0) {
        pdfContent.push({ type: 'heading', text: `Section A: Multiple Choice Questions` });
        resultJson.mcqs.forEach((q: MCQItem, i: number) => {
          pdfContent.push({ type: 'subheading', text: `Q${i+1}: ${q.question}` });
          q.options.forEach((opt, oi) => pdfContent.push({ type: 'text', text: `   ${String.fromCharCode(65+oi)}) ${opt}` }));
          pdfContent.push({ type: 'text', text: `Correct option: ${String.fromCharCode(65+q.correctIndex)} — Explanation: ${q.explanation}` });
        });
      }
      // Shorts
      if (resultJson.shortQuestions && resultJson.shortQuestions.length > 0) {
        pdfContent.push({ type: 'heading', text: `Section B: Short Conceptual Questions` });
        resultJson.shortQuestions.forEach((q: ShortQItem, i: number) => {
          pdfContent.push({ type: 'subheading', text: `Q${i+1}: ${q.question}` });
          pdfContent.push({ type: 'text', text: `Model Answer: ${q.modelAnswer}` });
        });
      }
      // Longs
      if (resultJson.longQuestions && resultJson.longQuestions.length > 0) {
        pdfContent.push({ type: 'heading', text: `Section C: High-order Essay Prompt` });
        resultJson.longQuestions.forEach((q: LongQItem, i: number) => {
          pdfContent.push({ type: 'subheading', text: `Essay Prompt: ${q.question}` });
          pdfContent.push({ type: 'text', text: `Model Essay:\n${q.modelAnswer}` });
          pdfContent.push({ type: 'text', text: `Assessment Core Checklist points:\n` + q.keyPoints.map(kp => `• ${kp}`).join('\n') });
        });
      }
    } else {
      // Solves, explains, summary text
      pdfContent.push({ type: 'text', text: resultText || "" });
    }

    generatePDF(`Visual_Analysis_${file.name.split('.')[0]}`, pdfContent);
    onDownload(`Visual_Analysis_${file.name.split('.')[0]}`);
  };

  // Live Short assessment evaluation
  const checkShortAnswer = async (index: number) => {
    const q = resultJson.questions[index];
    const userAnswer = shortAnswers[index];
    if (!userAnswer || !userAnswer.trim()) return;

    setCheckingShort(prev => ({ ...prev, [index]: true }));

    try {
      const res = await fetch('/api/check-short-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q.question,
          modelAnswer: q.modelAnswer,
          userAnswer: userAnswer
        })
      });

      if (!res.ok) throw new Error("Evaluation failed.");
      const feedback = await res.json();
      setShortFeedbacks(prev => ({ ...prev, [index]: feedback }));
    } catch (err) {
      console.error(err);
      alert("Could not evaluate score. Ensure connectivity.");
    } finally {
      setCheckingShort(prev => ({ ...prev, [index]: false }));
    }
  };

  const gradeList = [
    'Primary (Grade 1-5)',
    'Middle School (Grade 6-8)',
    'High School (Grade 9-10)',
    'Higher Secondary (Grade 11-12)',
    'University / Undergraduate'
  ];

  const languageList = [
    'English',
    'Urdu (اُردو)',
    'Hindi (हिन्दी)',
    'Spanish (Español)',
    'French (Français)',
    'German (Deutsch)',
    'Arabic (العربية)',
    'Bengali (বাংলা)'
  ];

  const taskOptions = [
    { id: 'solve', label: "Solve Questions", desc: "Identify and solve worksheet questions step-by-step.", icon: CheckCircle2, bg: "bg-emerald-50/70 border-emerald-100 hover:border-emerald-400 group-hover:text-emerald-600", color: "#10B981" },
    { id: 'explain', label: "Explain Content", desc: "Deconstruct academic equations, diagrams, or reading notes.", icon: Lightbulb, bg: "bg-amber-50/70 border-amber-100 hover:border-amber-400 group-hover:text-amber-600", color: "#F59E0B" },
    { id: 'summarize', label: "Summarize", desc: "Synthesize key points and main educational takeaways of the file.", icon: FileText, bg: "bg-blue-50/70 border-blue-100 hover:border-blue-400 group-hover:text-blue-600", color: "#3B82F6" },
    { id: 'mcq', label: "Generate MCQs", desc: "Create custom-tailored multiple choice questions to test your learning.", icon: HelpCircle, bg: "bg-indigo-50/70 border-indigo-100 hover:border-indigo-400 group-hover:text-indigo-600", color: "#6366F1" },
    { id: 'short-questions', label: "Generate Short Qs", desc: "Assemble conceptual brief questions with reference model answers.", icon: PenTool, bg: "bg-purple-50/70 border-purple-100 hover:border-purple-400 group-hover:text-purple-600", color: "#8B5CF6" },
    { id: 'exam-paper', label: "Generate Exam Paper", desc: "Formulate a real-time exam workbook with MCQs, Short & Essay sections.", icon: Clock, bg: "bg-rose-50/70 border-rose-100 hover:border-rose-400 group-hover:text-rose-600", color: "#EF4444" }
  ];

  const isPDF = file?.type === 'application/pdf' || file?.name.endsWith('.pdf');

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-300">
      {/* Top Banner Warning if API key is not configured */}
      {!localStorage.getItem('edugen_gemini_api_key') && (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-center justify-between text-yellow-900 leading-snug">
          <div className="flex items-center gap-3">
            <AlertTriangle className="text-amber-500 shrink-0" size={18} />
            <div className="text-xs font-semibold">
              <span className="font-bold">Gemini API Key Needed:</span> To analyze images/PDFs directly, paste your own Gemini API Key in the <span className="underline">App Settings</span> menu at the top-right profile dropdown.
            </div>
          </div>
        </div>
      )}

      {/* Loading state rendering full container shimmer */}
      {loading ? (
        <div className="grid grid-cols-12 gap-8 h-full animate-pulse shadow-xs">
          <div className="col-span-12 lg:col-span-4 bg-white rounded-2xl border border-[#E2E8F0] p-6 h-96 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="shimmer h-8 rounded-lg" />
              <div className="shimmer h-14 rounded-lg" />
              <div className="shimmer h-24 rounded-lg" />
            </div>
            <div className="shimmer h-11 rounded-lg" />
          </div>
          <div className="col-span-12 lg:col-span-8 flex flex-col justify-center items-center h-96 bg-white rounded-2xl border border-[#E2E8F0] p-10 text-center space-y-6">
            <div className="flex gap-2.5 justify-center items-center">
              <span className="w-3.5 h-3.5 bg-violet-500 rounded-full animate-bounce" />
              <span className="w-3.5 h-3.5 bg-indigo-500 rounded-full animate-bounce delay-100" />
              <span className="w-3.5 h-3.5 bg-blue-500 rounded-full animate-bounce delay-200" />
            </div>
            <h3 className="text-lg font-black text-slate-800">Processing visual indices...</h3>
            <p className="text-sm text-slate-500 max-w-sm pl-2">{loadingStep || "Analyzing diagrams, OCR matrices, and reading scholastic notes."}</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-12 gap-8 h-full">
          {/* LEFT: Configure File upload */}
          {!resultText && !resultJson ? (
            <div className="col-span-12 lg:col-span-4 bg-white rounded-2xl border border-[#E2E8F0] p-8 flex flex-col shadow-sm relative">
              <div className="absolute right-0 top-0 w-32 h-32 bg-gradient-to-bl from-violet-500/5 to-transparent rounded-bl-full pointer-events-none" />
              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center shrink-0 shadow-xs">
                  <Eye size={16} />
                </div>
                <h2 className="text-lg font-black text-[#0f172a]">Visual Scan Center</h2>
              </div>

              <div className="space-y-6 flex-1">
                {/* Step 1: Upload File */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider pl-1">
                    Step 1: Upload Worksheet or Document
                  </label>
                  
                  {!file ? (
                    <div 
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={cn(
                        "border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all min-h-[160px]",
                        isDragOver 
                          ? "border-violet-500 bg-violet-50/50" 
                          : "border-[#E2E8F0] hover:border-violet-400 hover:bg-slate-50/50"
                      )}
                    >
                      <input 
                        ref={fileInputRef}
                        type="file" 
                        accept=".pdf,.png,.jpg,.jpeg,.webp"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                      <div className="w-12 h-12 bg-violet-50 rounded-xl flex items-center justify-center text-violet-600 mb-4 shadow-xs">
                        <Upload size={20} />
                      </div>
                      <p className="text-xs font-bold text-slate-700">Drag & drop files or click to browse</p>
                      <p className="text-[10px] text-[#94A3B8] font-bold mt-1">Supports PDF, PNG, JPG, WEBP (Max 10MB)</p>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl border border-violet-100 bg-violet-50/30 flex items-center justify-between shadow-xs">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center shrink-0 text-violet-600">
                          <FileText size={18} />
                        </div>
                        <div className="text-left overflow-hidden">
                          <p className="text-xs font-serif font-bold text-slate-800 truncate pr-1">{file.name}</p>
                          <p className="text-[10px] text-[#94A3B8] font-bold">
                            {isPDF ? `PDF Document • ${pdfPageCount} pgs` : `${file.type.split('/')[1].toUpperCase()} Image`} • {(file.size / (1024 * 1024)).toFixed(1)}MB
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={removeFile}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Remove file"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Step 2: Class Level selector (Visible after file uploaded) */}
                {file && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4 animate-in fade-in duration-200"
                  >
                    <div className="space-y-2.5">
                      <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider pl-1">
                        Step 2: Core Class Level Selection
                      </label>
                      <select
                        value={classLevel}
                        onChange={(e) => setClassLevel(e.target.value)}
                        className="w-full h-11 px-4 py-2 bg-[#F8FAFF] border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-violet-500 focus:ring-3 focus:ring-violet-500/10 transition-all text-xs font-bold text-slate-700"
                      >
                        {gradeList.map(g => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2.5">
                      <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider pl-1 font-sans">
                        Target Output Language
                      </label>
                      <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="w-full h-11 px-4 py-2 bg-[#F8FAFF] border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-violet-500 focus:ring-3 focus:ring-violet-500/10 transition-all text-xs font-bold text-slate-700"
                      >
                        {languageList.map(lang => (
                          <option key={lang} value={lang}>{lang}</option>
                        ))}
                      </select>
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Instructions (Optional) */}
                {file && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-1.5 animate-in fade-in duration-200"
                  >
                    <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider pl-1">
                      Step 3: Custom Guidance (Optional)
                    </label>
                    <textarea 
                      placeholder="e.g. Focus on questions 3-5, explain in simple terms, include definitions..."
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                      className="w-full text-xs font-medium text-slate-700 placeholder-[#94A3B8] px-4 py-3 bg-[#F8FAFF] border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-violet-500 focus:ring-3 focus:ring-violet-500/10 transition-all min-h-[80px] resize-none leading-relaxed"
                    />
                  </motion.div>
                )}

                {file && (
                  <motion.button 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={handleAnalyze}
                    className="w-full h-11 bg-gradient-to-r from-violet-600 to-indigo-600 hover:brightness-105 hover:scale-[1.01] active:scale-[0.98] text-white font-bold text-sm rounded-lg shadow-md transition-all mt-4"
                  >
                    Analyse & Generate
                  </motion.button>
                )}
              </div>
            </div>
          ) : null}

          {/* RIGHT: Display Empty State OR Task Picker OR Extracted solutions */}
          <div className={cn("col-span-12 flex flex-col h-full pl-0", !resultText && !resultJson ? "lg:col-span-8" : "w-full")}>
            
            {/* 1. INITIAL SETUP - CHOOSE TASK OPTIONS (Shown when file is selected) */}
            {file && !resultText && !resultJson ? (
              <div className="bg-white rounded-2xl border border-[#E2E8F0] p-8 shadow-sm h-full flex flex-col justify-between">
                <div className="space-y-6">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#8B5CF6]">Task Configuration</span>
                    <h3 className="text-xl font-black text-slate-800 leading-none mt-1">Select Analysis Goal</h3>
                  </div>

                  {/* Task Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {taskOptions.map((opt) => {
                      const Icon = opt.icon;
                      const isSelected = task === opt.id;
                      return (
                        <div 
                          key={opt.id}
                          onClick={() => setTask(opt.id)}
                          className={cn(
                            "group p-5 rounded-xl border-1.5 transition-all duration-200 cursor-pointer flex flex-col justify-between hover:shadow-md",
                            isSelected 
                              ? "bg-violet-50 border-violet-500 shadow-sm shadow-violet-50" 
                              : "bg-white border-[#E2E8F0] hover:border-violet-300"
                          )}
                        >
                          <div className="space-y-3">
                            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center transition-all", isSelected ? "bg-violet-600 text-white" : opt.bg)}>
                              <Icon size={16} />
                            </div>
                            <div className="space-y-1 text-left">
                              <h4 className="text-xs font-black text-slate-800 group-hover:text-violet-600 transition-colors">
                                {opt.label}
                              </h4>
                              <p className="text-[10px] text-[#64748B] font-medium leading-relaxed">
                                {opt.desc}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Extra guidance metadata line */}
                <div className="mt-8 pt-4 border-t border-[#E2E8F0] flex items-center justify-between text-[11px] text-[#94A3B8] font-bold uppercase tracking-wider">
                  <span>Adaptive scholastic framework</span>
                  <div className="flex items-center gap-1 text-violet-600">
                    <span>Click options to select target, review settings or submit on left</span>
                    <ArrowRight size={12} className="animate-bounce" />
                  </div>
                </div>
              </div>
            ) : null}

            {/* 2. INITIAL SETUP - EMPTY STATE (No file loaded) */}
            {!file ? (
              <div className="bg-white rounded-2xl border border-dashed border-[#E2E8F0] flex flex-col items-center justify-center p-12 text-center shadow-xs min-h-[420px] h-full">
                <div className="w-16 h-16 rounded-full bg-violet-50 flex items-center justify-center mb-6 shadow-xs border border-violet-100">
                  <Eye size={30} className="text-violet-600 animate-pulse" />
                </div>
                <h3 className="text-[#0F172A] text-xl font-extrabold tracking-tight">Ready for Visual Analysis</h3>
                <p className="text-[#64748B] mt-2 max-w-sm text-sm font-medium leading-relaxed">
                  Upload visual notes, exercise worksheets, textbook scans, or PDFs. Google Gemini Vision OCR reads, interprets, and translates the content.
                </p>
                <div className="mt-6 flex items-center gap-1.5 text-violet-600 text-xs font-extrabold">
                  <span>Configure your file in the left control panel</span>
                  <ArrowRight size={14} className="animate-bounce" />
                </div>
              </div>
            ) : null}

            {/* 3. GENERATED OUTPUT - SOLVE / EXPLAIN / SUMMARIZE (Plain Markdown Results) */}
            {(resultText && !resultJson) ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8 animate-in fade-in duration-300 pointer-events-auto"
              >
                <div className="flex items-center justify-between">
                  <button 
                    onClick={removeFile} 
                    className="text-xs font-bold text-violet-600 hover:underline bg-violet-50 border border-violet-100 px-3?.5 py-2.5 rounded-lg flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    ← Upload different document
                  </button>
                  <div className="flex gap-2">
                    <button 
                      onClick={handleCopy} 
                      className="flex items-center justify-center w-10 h-10 border border-[#E2E8F0] rounded-lg bg-white text-slate-500 hover:text-slate-800 transition-colors shadow-xs cursor-pointer"
                      title="Copy raw markdown text"
                    >
                      {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                    </button>
                    <button 
                      onClick={handleDownloadReport} 
                      className="flex items-center gap-2 text-xs font-bold text-[#64748B] hover:text-violet-600 transition-colors border border-[#E2E8F0] rounded-lg px-4 py-2.5 bg-white cursor-pointer shadow-xs"
                    >
                      <Download size={14} />
                      Save as Report PDF
                    </button>
                  </div>
                </div>

                {/* Main Card with Markdown interpretation */}
                <div className="bg-white rounded-2xl border border-[#E2E8F0] shadow-sm p-10 relative overflow-hidden text-left">
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-violet-500" />
                  
                  <div className="flex flex-col gap-1.5 mb-8">
                    <span className="text-[10px] uppercase font-black tracking-widest text-[#8B5CF6]">Scan Complete</span>
                    <h3 className="text-xl font-serif font-black text-slate-800 leading-snug">
                      {task === 'solve' ? 'Solved Workbook & Answers' : task === 'explain' ? 'Concept Explanation' : 'Structured Summary Board'}
                    </h3>
                    <p className="text-[11px] text-[#94A3B8] font-bold">Generated for: {file?.name}</p>
                  </div>

                  <div className="prose prose-sm font-sans text-slate-700 leading-relaxed max-w-none text-xs space-y-4">
                    <ReactMarkdown>{resultText}</ReactMarkdown>
                  </div>
                </div>
              </motion.div>
            ) : null}

            {/* 4. GENERATED OUTPUT - MCQs Interactive Live mode */}
            {resultJson && task === 'mcq' && resultJson.questions ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full flex-1"
              >
                {!quizComplete ? (
                  <div className="grid grid-cols-12 gap-8 h-full text-left">
                    {/* State Tracker */}
                    <div className="col-span-12 lg:col-span-4 space-y-4">
                      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs relative overflow-hidden">
                        <div className="absolute right-0 top-0 w-24 h-24 bg-gradient-to-bl from-violet-500/5 to-transparent rounded-bl-full" />
                        <div className="flex items-center justify-between mb-6">
                          <span className="px-2.5 py-1 bg-violet-100 text-violet-600 rounded-lg text-[10px] font-black uppercase tracking-wider">Visual Quiz</span>
                          <span className="text-xs font-bold text-[#64748B]">Q{quizIndex + 1} of {resultJson.questions.length}</span>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between items-end">
                            <span className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Progress</span>
                            <span className="text-xs font-bold text-violet-600">{Math.round(((quizIndex + 1) / resultJson.questions.length) * 100)}%</span>
                          </div>
                          <div className="w-full bg-[#E2E8F0] h-1.5 rounded-full overflow-hidden">
                            <div 
                              className="bg-gradient-to-r from-violet-600 to-indigo-600 h-1.5 rounded-full transition-all duration-500" 
                              style={{ width: `${((quizIndex + 1) / resultJson.questions.length) * 100}%` }}
                            />
                          </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-[#E2E8F0] flex justify-between items-center bg-slate-50/50 p-4 rounded-xl border border-[#E1E8F0]">
                          <span className="text-xs font-bold text-[#64748B]">Score</span>
                          <span className="text-base font-black text-green-600">{quizScore}/{quizIndex + (isAnswerSubmitted ? 1 : 0)}</span>
                        </div>
                      </div>

                      <button 
                        onClick={removeFile}
                        className="w-full py-2.5 text-xs font-bold text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors bg-white rounded-xl border border-[#E2E8F0]"
                      >
                        ← Quit Session
                      </button>
                    </div>

                    {/* Question Interactive Arena */}
                    <div className="col-span-12 lg:col-span-8">
                      <div className="bg-white rounded-2xl shadow-xs border border-[#E2E8F0] p-10 min-h-[400px] flex flex-col justify-between">
                        <div>
                          <h3 className="text-lg font-serif font-black text-slate-800 leading-snug mb-8">
                            {resultJson.questions[quizIndex]?.question}
                          </h3>
                          <div className="grid grid-cols-1 gap-3.5">
                            {resultJson.questions[quizIndex]?.options.map((opt: string, i: number) => {
                              const isSelected = selectedOption === i;
                              const isCorrect = i === resultJson.questions[quizIndex]?.correctIndex;
                              const showCorrect = isAnswerSubmitted && isCorrect;
                              const showWrong = isAnswerSubmitted && isSelected && !isCorrect;

                              return (
                                <button
                                  key={i}
                                  onClick={() => !isAnswerSubmitted && setSelectedOption(i)}
                                  className={cn(
                                    "w-full px-5 py-4 border rounded-xl flex items-center transition-all text-left font-sans cursor-pointer",
                                    isSelected && !isAnswerSubmitted && "bg-violet-50 border-violet-500",
                                    showCorrect && "bg-green-50 border-green-200 text-green-800",
                                    showWrong && "bg-red-50 border-red-200 text-red-800",
                                    !isSelected && !showCorrect && "bg-white border-[#E2E8F0] hover:bg-slate-50"
                                  )}
                                >
                                  <span className={cn(
                                    "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold mr-4 shrink-0 shadow-xs",
                                    isSelected && !isAnswerSubmitted && "bg-violet-200 text-violet-700",
                                    showCorrect && "bg-green-200 text-green-800",
                                    showWrong && "bg-red-200 text-red-800",
                                    !isSelected && !showCorrect && "bg-slate-100 text-[#64748B]"
                                  )}>
                                    {String.fromCharCode(65 + i)}
                                  </span>
                                  <span className="text-xs font-medium flex-1">{opt}</span>
                                  {showCorrect && <CheckCircle className="text-green-500 ml-auto" size={18} />}
                                  {showWrong && <XCircle className="text-red-500 ml-auto" size={18} />}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="mt-8">
                          {isAnswerSubmitted && (
                            <div className="p-5 bg-slate-50 border border-[#E2E8F0] rounded-xl flex items-start gap-4 mb-4">
                              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0 mt-0.5", selectedOption === resultJson.questions[quizIndex].correctIndex ? "bg-green-500" : "bg-red-500")}>
                                <Sparkles size={16} />
                              </div>
                              <div className="flex-1 space-y-1 text-xs">
                                <h4 className="font-extrabold text-slate-800 uppercase tracking-wider text-[10px]">Reference Explanation</h4>
                                <p className="text-slate-600 leading-relaxed font-serif italic">"{resultJson.questions[quizIndex].explanation}"</p>
                              </div>
                            </div>
                          )}

                          <div className="flex justify-end pt-2">
                            {!isAnswerSubmitted ? (
                              <button 
                                onClick={() => {
                                  if (selectedOption === null) return;
                                  setIsAnswerSubmitted(true);
                                  if (selectedOption === resultJson.questions[quizIndex].correctIndex) {
                                    setQuizScore(s => s + 1);
                                  }
                                }}
                                disabled={selectedOption === null}
                                className="px-8 h-10 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-xs rounded-lg hover:brightness-105 active:scale-98 transition-all disabled:opacity-45 shadow-sm"
                              >
                                Submit Answer
                              </button>
                            ) : (
                              <button 
                                onClick={() => {
                                  if (quizIndex < resultJson.questions.length - 1) {
                                    setQuizIndex(v => v + 1);
                                    setSelectedOption(null);
                                    setIsAnswerSubmitted(false);
                                  } else {
                                    setQuizComplete(true);
                                  }
                                }}
                                className="px-8 h-10 bg-violet-600 text-white font-bold text-xs rounded-lg hover:bg-violet-700 active:scale-98 transition-all shadow-sm shadow-violet-100"
                              >
                                {quizIndex < resultJson.questions.length - 1 ? "Next Question" : "View Score"}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Quiz Finish Results board */
                  <div className="flex flex-col items-center justify-center min-h-[calc(100vh-220px)] py-4 text-center">
                    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-10 max-w-3xl w-full shadow-lg">
                      <div className="relative w-36 h-36 mx-auto mb-6 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="40" className="stroke-[#F1F5F9]" strokeWidth="6" fill="transparent" />
                          <circle 
                            cx="50" 
                            cy="50" 
                            r="40" 
                            className="stroke-violet-600 transition-all duration-1000" 
                            strokeWidth="6" 
                            fill="transparent" 
                            strokeDasharray={2 * Math.PI * 40}
                            strokeDashoffset={2 * Math.PI * 40 * (1 - (quizScore / resultJson.questions.length))}
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-3xl font-black text-slate-800 tracking-tight">{animatedScore}%</span>
                          <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">Score</span>
                        </div>
                      </div>

                      <div className={cn("inline-flex items-center gap-2 px-4 py-2 font-bold text-xs border rounded-full mb-6", quizScore / resultJson.questions.length >= 0.7 ? "text-green-800 bg-green-50 border-green-200" : "text-amber-800 bg-amber-50 border-amber-200")}>
                        <Award size={14} />
                        <span>Interactive Quiz Evaluated</span>
                      </div>

                      <h2 className="text-2xl font-black text-slate-800 mb-2 leading-none">Practice Session Completed</h2>
                      <p className="text-slate-500 font-medium text-xs mb-8">
                        You successfully resolved <span className="font-bold text-violet-600">{quizScore}</span> out of <span className="font-bold">{resultJson.questions.length}</span> questions.
                      </p>

                      <div className="space-y-3 text-left mb-10 max-h-72 overflow-y-auto pr-1">
                        {resultJson.questions.map((q: MCQItem, i: number) => (
                          <div key={i} className="bg-slate-50 border border-[#E2E8F0] rounded-xl overflow-hidden">
                            <button 
                              onClick={() => setExpandedIndex(expandedIndex === i ? null : i)}
                              className="w-full px-5 py-4 flex items-center justify-between text-left text-xs font-bold text-slate-800 hover:bg-slate-100 transition-colors"
                            >
                              <div className="flex items-center gap-3">
                                <span className="w-6 h-6 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center text-[10px] font-bold shadow-xs">Q{i+1}</span>
                                <span className="truncate max-w-lg font-serif">{q.question}</span>
                              </div>
                              <span className="text-slate-400 text-[10px] font-heavy font-mono">{expandedIndex === i ? '▲' : '▼'}</span>
                            </button>
                            {expandedIndex === i && (
                              <div className="p-5 border-t border-[#E2E8F0] bg-white text-xs space-y-3">
                                <div className="grid grid-cols-2 gap-2 text-slate-700">
                                  {q.options.map((opt, oi) => (
                                    <div key={oi} className={cn("p-2 border rounded-lg", oi === q.correctIndex ? "bg-green-50 border-green-200 text-green-700 font-bold" : "bg-slate-50 border-[#E2E8F0]")}>
                                      {String.fromCharCode(65 + oi)}) {opt}
                                    </div>
                                  ))}
                                </div>
                                <p className="text-slate-600 bg-slate-50 font-serif leading-relaxed italic p-3 rounded-lg border border-[#E2E8F0]">
                                  <span className="font-bold text-violet-600 font-sans uppercase text-[10px] tracking-widest pl-0 block not-italic mb-0.5">Explanation</span>
                                  {q.explanation}
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-4 max-w-md mx-auto">
                        <button 
                          onClick={removeFile}
                          className="flex-1 py-3 text-xs border border-[#E2E8F0] bg-white hover:bg-slate-50 text-slate-600 font-extrabold rounded-lg shadow-xs transition-all"
                        >
                          New Upload
                        </button>
                        <button 
                          onClick={handleDownloadReport}
                          className="flex-1 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-extrabold text-xs rounded-lg shadow-md hover:brightness-105 active:scale-95 transition-all shadow-violet-100"
                        >
                          Download Quiz PDF
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            ) : null}

            {/* 5. GENERATED OUTPUT - SHORT QUESTIONS Interactive Live mode */}
            {resultJson && task === 'short-questions' && resultJson.questions ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8 text-left"
              >
                <div className="flex items-center justify-between">
                  <button 
                    onClick={removeFile} 
                    className="text-xs font-bold text-violet-600 hover:underline bg-violet-50 border border-violet-100 px-3.5 py-2.5 rounded-lg flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    ← Upload different document
                  </button>
                  <button 
                    onClick={handleDownloadReport} 
                    className="flex items-center gap-2 text-xs font-bold text-[#64748B] hover:text-violet-600 transition-colors border border-[#E2E8F0] rounded-lg px-4 py-2.5 bg-white cursor-pointer shadow-xs"
                  >
                    <Download size={14} />
                    Save Exercises PDF
                  </button>
                </div>

                <div className="space-y-6">
                  {resultJson.questions.map((q: ShortQItem, i: number) => {
                    const feedback = shortFeedbacks[i];
                    const isChecking = checkingShort[i];

                    return (
                      <div key={i} className="bg-white p-8 rounded-2xl border border-[#E2E8F0] shadow-sm space-y-6 text-left">
                        <div className="space-y-1.5">
                          <span className="text-[10px] uppercase font-black tracking-widest text-[#8B5CF6]">Conceptual Exercise {i+1}</span>
                          <h3 className="text-base font-serif font-black text-slate-800 leading-snug">{q.question}</h3>
                        </div>

                        <div className="space-y-4">
                          <div className="relative">
                            <textarea 
                              placeholder="Type your draft answer compared to model response here..."
                              value={shortAnswers[i] || ''}
                              onChange={(e) => setShortAnswers(prev => ({ ...prev, [i]: e.target.value }))}
                              disabled={!!feedback}
                              className="w-full p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFF] focus:ring-3 focus:ring-violet-500/10 focus:border-violet-500 focus:bg-white transition-all min-h-[90px] outline-none text-xs text-slate-700 leading-relaxed placeholder-[#94A3B8]"
                            />
                            {!feedback && (
                              <div className="absolute top-3 right-3 px-2 py-0.5 bg-white border border-[#E2E8F0] rounded-full text-[9px] font-black text-[#94A3B8]">
                                DRAFT MODE
                              </div>
                            )}
                          </div>

                          <div className="flex gap-3">
                            {!feedback ? (
                              <button 
                                onClick={() => checkShortAnswer(i)}
                                disabled={isChecking || !shortAnswers[i]?.trim()}
                                className="px-6 h-9 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-xs hover:brightness-105 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-100 cursor-pointer"
                              >
                                {isChecking ? (
                                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                  <>
                                    <Sparkles size={14} />
                                    <span>Evaluate Answer</span>
                                  </>
                                )}
                              </button>
                            ) : (
                              <button 
                                onClick={() => {
                                  setShortFeedbacks(prev => {
                                    const copy = { ...prev };
                                    delete copy[i];
                                    return copy;
                                  });
                                  setShortAnswers(prev => ({ ...prev, [i]: '' }));
                                }}
                                className="px-5 h-9 rounded-lg border border-[#E2E8F0] font-bold text-xs text-slate-500 hover:bg-slate-50 flex items-center gap-1.5 transition-all cursor-pointer bg-white"
                              >
                                <RotateCcw size={14} />
                                <span>Retry exercise</span>
                              </button>
                            )}
                          </div>

                          <AnimatePresence>
                            {feedback && (
                              <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden space-y-4 pt-1"
                              >
                                {/* Recommended Reference */}
                                <div className="p-4 rounded-xl bg-violet-50/50 border border-violet-100 text-violet-900 text-xs">
                                  <div className="flex items-center gap-1.5 mb-2">
                                    <BookOpen size={13} className="text-violet-500" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-[#8B5CF6]">Model Reference Reference</span>
                                  </div>
                                  <p className="leading-relaxed font-serif italic pl-0">"{q.modelAnswer}"</p>
                                </div>

                                {/* Live Evaluation Scoring */}
                                <div className="p-5 rounded-xl bg-green-50/50 border border-green-100 space-y-3 text-xs leading-normal">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                      <div className="w-5.5 h-5.5 rounded-full bg-green-500 flex items-center justify-center">
                                        <CheckCircle2 size={13} className="text-white" />
                                      </div>
                                      <span className="font-extrabold text-[#15803D] uppercase tracking-wider text-[10px]">Sholastic Feedback</span>
                                    </div>
                                    <div className="px-2.5 py-0.5 rounded-lg bg-green-100 text-green-800 font-extrabold text-xs shadow-xs">
                                      Score: {feedback.score}/10
                                    </div>
                                  </div>
                                  <p className="text-green-800 leading-relaxed font-semibold italic">"{feedback.feedback}"</p>
                                  <div className="bg-white/60 p-3.5 rounded-lg flex items-start gap-3">
                                    <Info size={14} className="text-green-600 shrink-0 mt-0.5" />
                                    <div className="space-y-0.5">
                                      <p className="text-[9px] font-black text-green-600 uppercase tracking-widest">Growth Recommendation</p>
                                      <p className="text-green-700 leading-relaxed font-serif text-[11px]">{feedback.improvement}</p>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            ) : null}

            {/* 6. GENERATED OUTPUT - EXAM PAPER Interactive Live mode */}
            {resultJson && task === 'exam-paper' ? (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-8 text-left"
              >
                <div className="flex items-center justify-between">
                  <button 
                    onClick={removeFile} 
                    className="text-xs font-bold text-violet-600 hover:underline bg-violet-50 border border-violet-100 px-3.5 py-2.5 rounded-lg flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    ← Upload different document
                  </button>
                  <button 
                    onClick={handleDownloadReport} 
                    className="flex items-center gap-2 text-xs font-bold text-[#64748B] hover:text-violet-600 transition-colors border border-[#E2E8F0] rounded-lg px-4 py-2.5 bg-white cursor-pointer shadow-xs"
                  >
                    <Download size={14} />
                    Save Full Exam PDF
                  </button>
                </div>

                <div className="bg-white p-10 rounded-2xl border border-[#E2E8F0] shadow-sm relative overflow-hidden pl-10 text-left space-y-8">
                  <div className="absolute top-0 left-0 w-2.5 h-full bg-violet-600" />
                  
                  <div className="flex flex-col gap-1.5 border-b border-[#E2E8F0] pb-6">
                    <span className="text-[10px] uppercase font-black tracking-widest text-[#8B5CF6]">Generated practice assessment</span>
                    <h2 className="text-2xl font-serif font-black text-slate-800 tracking-tight leading-none">Comprehensive Examination Paper</h2>
                    <p className="text-slate-500 font-bold text-xs mt-1">Difficulty standard: {classLevel}</p>
                  </div>

                  {/* SECTION A: MCQs */}
                  {resultJson.mcqs && (
                    <div className="space-y-6">
                      <h3 className="text-sm font-black uppercase tracking-widest text-violet-600 border-b border-violet-100 pb-2">Section A: Multiple Choice Questions (5 Questions)</h3>
                      {resultJson.mcqs.map((q: MCQItem, idx: number) => (
                        <div key={idx} className="bg-slate-50 p-6 rounded-xl border border-[#E2E8F0] space-y-4 text-xs">
                          <p className="font-bold text-slate-800 font-serif leading-snug">Q{idx + 1}: {q.question}</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700 font-medium pl-2">
                            {q.options.map((opt, oIdx) => (
                              <div key={oIdx} className="p-2 border border-[#E2E8F0] bg-white rounded-lg">
                                <span className="font-bold mr-1.5 text-slate-400">{String.fromCharCode(65 + oIdx)})</span>
                                {opt}
                              </div>
                            ))}
                          </div>
                          <details className="mt-2 text-slate-600 pl-2">
                            <summary className="cursor-pointer text-violet-600 font-bold hover:underline select-none">Review standard answer & explanation</summary>
                            <p className="mt-2 text-slate-500 bg-white p-3 rounded-lg border border-[#E2E8F0] leading-relaxed font-serif italic">
                              <span className="font-bold text-green-600 font-sans block not-italic uppercase text-[9px] mb-0.5">Correct Option: {String.fromCharCode(65 + q.correctIndex)}</span>
                              {q.explanation}
                            </p>
                          </details>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* SECTION B: SHORT QUESTIONS */}
                  {resultJson.shortQuestions && (
                    <div className="space-y-6 pt-4">
                      <h3 className="text-sm font-black uppercase tracking-widest text-[#3B82F6] border-b border-blue-100 pb-2">Section B: Short Conceptual Prompts (3 Questions)</h3>
                      {resultJson.shortQuestions.map((q: ShortQItem, idx: number) => (
                        <div key={idx} className="bg-slate-50 p-6 rounded-xl border border-[#E2E8F0] space-y-3 text-xs">
                          <p className="font-bold text-slate-800 font-serif leading-snug">Q{idx+1}: {q.question}</p>
                          <details className="text-slate-600">
                            <summary className="cursor-pointer text-blue-600 font-bold hover:underline select-none">Reveal Reference Metamorphic Answer</summary>
                            <p className="mt-2 text-slate-500 bg-white p-3 rounded-lg border border-[#E2E8F0] leading-relaxed font-serif italic pl-0">
                              "{q.modelAnswer}"
                            </p>
                          </details>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* SECTION C: LONG QUESTIONS */}
                  {resultJson.longQuestions && (
                    <div className="space-y-6 pt-4">
                      <h3 className="text-sm font-black uppercase tracking-widest text-emerald-600 border-b border-emerald-100 pb-2">Section C: Deep-Dive Essay Prompt</h3>
                      {resultJson.longQuestions.map((q: LongQItem, idx: number) => (
                        <div key={idx} className="bg-slate-50 p-6 rounded-xl border border-[#E2E8F0] space-y-4 text-xs text-left">
                          <p className="font-bold text-slate-800 font-serif leading-snug">{q.question}</p>
                          <details className="text-slate-600">
                            <summary className="cursor-pointer text-emerald-600 font-bold hover:underline select-none">Reveal Reference Model Essay Answers & Criteria</summary>
                            <div className="mt-3 bg-white p-5 rounded-lg border border-[#E2E8F0] space-y-4">
                              <div className="prose prose-sm leading-relaxed text-slate-600 whitespace-pre-line text-xs pl-2 font-serif italic">
                                {q.modelAnswer}
                              </div>
                              <div className="bg-emerald-50/50 p-4 border border-emerald-100 rounded-lg text-emerald-900 text-[11px] font-sans">
                                <p className="font-bold uppercase tracking-wider text-emerald-950 text-[10px] mb-2 pl-2">Grading Criteria checklist (5 key items):</p>
                                <ul className="space-y-1.5 list-disc pl-5 font-medium leading-normal">
                                  {q.keyPoints.map((kp, kIdx) => <li key={kIdx}>{kp}</li>)}
                                </ul>
                              </div>
                            </div>
                          </details>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            ) : null}

            {/* 6. PEXELS DIAGRAMS & VISUAL AIDS EXPLORER */}
            {(resultText || resultJson) ? (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="mt-8 bg-white border border-[#E2E8F0] rounded-2xl shadow-sm overflow-hidden text-left pointer-events-auto"
              >
                <div className="bg-gradient-to-r from-violet-50 to-indigo-50 p-6 border-b border-[#E2E8F0] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-violet-600/10 text-violet-600 flex items-center justify-center shadow-xs">
                      <ImageIcon size={20} />
                    </div>
                    <div>
                      <h3 className="font-serif font-black text-slate-800 text-lg flex items-center gap-2">
                        Pexels Reference Diagrams & Visual Aids
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase bg-violet-100 text-violet-600 px-2 py-0.5 rounded-full tracking-wider">
                          Pexels Live API
                        </span>
                      </h3>
                      <p className="text-slate-500 font-medium text-xs mt-0.5">Explore educational diagrams, scientific graphics, and schematic photos.</p>
                    </div>
                  </div>
                </div>

                <div className="p-6 sm:p-8 space-y-6">
                  {/* Search controls & Suggested tags */}
                  <div className="flex flex-col gap-4">
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        fetchPexelsDiagrams(pexelsQuery);
                      }}
                      className="flex gap-2"
                    >
                      <div className="relative flex-1">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                          type="text"
                          placeholder="Search diagrams on Pexels (e.g. human heart, plant cell)..."
                          value={pexelsQuery}
                          onChange={(e) => setPexelsQuery(e.target.value)}
                          className="w-full text-xs font-semibold text-slate-700 placeholder-[#94A3B8] pl-10 pr-4 py-3 bg-slate-50 border border-[#E2E8F0] rounded-xl focus:outline-none focus:border-violet-500 focus:ring-3 focus:ring-violet-500/10 transition-all leading-normal"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={pexelsLoading}
                        className="px-5 py-3 text-xs font-black rounded-xl bg-violet-600 hover:bg-violet-750 text-white flex items-center gap-1.5 transition-colors shadow-xs hover:shadow-md cursor-pointer disabled:opacity-50"
                      >
                        {pexelsLoading ? (
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <Search size={14} />
                        )}
                        Search
                      </button>
                    </form>

                    {/* Suggested tags */}
                    {getSuggestedTags().length > 0 && (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] uppercase font-extrabold tracking-wider text-[#94A3B8] mr-1.5">Suggested:</span>
                        {getSuggestedTags().map((tag, tIdx) => (
                          <button
                            key={tIdx}
                            type="button"
                            onClick={() => {
                              setPexelsQuery(tag);
                              fetchPexelsDiagrams(tag);
                            }}
                            className={cn(
                              "px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer shadow-3xs",
                              pexelsQuery === tag
                                ? "bg-violet-50 border-violet-200 text-violet-600"
                                : "bg-white border-[#E2E8F0] text-[#64748B] hover:bg-slate-50"
                            )}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Photos Grid or states */}
                  {pexelsLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {Array.from({ length: 6 }).map((_, idx) => (
                        <div key={idx} className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-3 animate-pulse">
                          <div className="bg-slate-200 rounded-lg aspect-video h-40 w-full" />
                          <div className="space-y-1.5">
                            <div className="h-3 w-3/4 bg-slate-200 rounded-sm" />
                            <div className="h-2.5 w-1/2 bg-slate-200 rounded-sm" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : pexelsError ? (
                    <div className="bg-amber-50 border border-amber-100 p-6 rounded-xl text-center space-y-2">
                      <AlertTriangle className="text-amber-500 mx-auto" size={24} />
                      <p className="text-xs font-bold text-amber-900">Unable to Fetch Diagrams</p>
                      <p className="text-[11px] text-amber-700 leading-relaxed max-w-lg mx-auto">
                        {pexelsError}
                      </p>
                      <p className="text-[10px] text-slate-500 max-w-sm mx-auto">
                        Make sure you have declared <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-[#E2E8F0]">PEXELS_API_KEY</code> properly in your environment secrets or backend config.
                      </p>
                    </div>
                  ) : pexelsPhotos.length === 0 ? (
                    <div className="bg-slate-50/50 border border-[#E2E8F0] p-8 rounded-xl text-center space-y-2">
                      <ImageIcon className="text-slate-300 mx-auto" size={28} />
                      <p className="text-xs font-bold text-slate-700 text-center">No Diagrams Found</p>
                      <p className="text-[11px] text-slate-500 max-w-md mx-auto leading-relaxed">
                        Pexels returned no exact matches for <span className="font-semibold text-slate-800">"{pexelsQuery || 'your query'}"</span>. Try typing broader educational keywords (e.g. "Biology Cell" or "Human Organs" or "Planet Mars") above.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {pexelsPhotos.map((photo) => (
                          <div 
                            key={photo.id} 
                            className="group bg-white border border-[#E2E8F0] rounded-xl p-3 shadow-3xs hover:shadow-xs hover:border-violet-200 transition-all flex flex-col justify-between overflow-hidden"
                          >
                            <div className="rounded-lg overflow-hidden relative aspect-video bg-slate-100 flex items-center justify-center">
                              <img 
                                src={photo.src.medium} 
                                alt={photo.alt || "Diagram image"} 
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <a 
                                href={photo.url} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70 flex items-center justify-center"
                                title="Open full page on Pexels"
                              >
                                <ExternalLink size={12} />
                              </a>
                            </div>

                            <div className="mt-3 space-y-1">
                              <p className="text-[11px] font-bold text-slate-800 line-clamp-1">
                                {photo.alt || "Educational Visual Aid"}
                              </p>
                              <div className="flex items-center justify-between">
                                <p className="text-[10px] text-slate-400 font-medium">
                                  By: <a 
                                    href={photo.photographer_url} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="hover:underline font-semibold text-slate-500"
                                  >
                                    {photo.photographer}
                                  </a>
                                </p>
                                <a
                                  href={photo.src.large2x || photo.src.original}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[10px] font-black text-violet-600 hover:underline flex items-center gap-0.5"
                                >
                                  View High-Res
                                </a>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <p className="text-[9px] text-[#64748B] font-mono select-none text-center pt-2">
                        Images and illustrations are fetched live using Pexels Creative Commons Licensing guidelines.
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : null}

          </div>
        </div>
      )}
    </div>
  );
}
