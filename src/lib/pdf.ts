import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface PDFItem {
  type: 'heading' | 'subheading' | 'text' | 'blankLines' | 'image';
  text?: string;
  count?: number;
}

export interface PDFOptions {
  isExam?: boolean;
  isAnswerKey?: boolean;
  studentName?: string;
  subject?: string;
  gradeLevel?: string;
  language?: string;
  totalMarks?: string | number;
  timeAllowed?: string;
  topic?: string;
  isSolved?: boolean;
}

// Global modal prompt for solved vs unsolved
function askSolvedOrUnsolved(title: string): Promise<boolean | null> {
  return new Promise((resolve) => {
    const backdrop = document.createElement('div');
    backdrop.id = 'pdf-format-modal-backdrop';
    backdrop.style.position = 'fixed';
    backdrop.style.top = '0';
    backdrop.style.left = '0';
    backdrop.style.width = '100vw';
    backdrop.style.height = '100vh';
    backdrop.style.backgroundColor = 'rgba(74, 18, 26, 0.4)';
    backdrop.style.backdropFilter = 'blur(10px)';
    backdrop.style.zIndex = '999999';
    backdrop.style.display = 'flex';
    backdrop.style.justifyContent = 'center';
    backdrop.style.alignItems = 'center';
    backdrop.style.fontFamily = "system-ui, -apple-system, 'Inter', sans-serif";
    backdrop.style.padding = '20px';
    backdrop.style.boxSizing = 'border-box';
    backdrop.style.opacity = '0';
    backdrop.style.transition = 'opacity 0.22s ease-out';

    const card = document.createElement('div');
    card.style.background = '#ffffff';
    card.style.borderRadius = '24px';
    card.style.boxShadow = '0 25px 50px -12px rgba(74, 18, 26, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.03)';
    card.style.width = '100%';
    card.style.maxWidth = '500px';
    card.style.padding = '28px';
    card.style.transform = 'translateY(15px) scale(0.96)';
    card.style.transition = 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease-out';
    card.style.opacity = '0';
    card.style.boxSizing = 'border-box';
    card.style.textAlign = 'center';

    card.innerHTML = `
      <div style="width: 56px; height: 56px; background: #FCFAF7; border-radius: 18px; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px auto; border: 1px solid #DFBA6B;">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4A121A" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
      </div>

      <h3 style="font-size: 19px; font-weight: 800; color: #4A121A; margin: 0 0 4px 0; letter-spacing: -0.02em;">
        Academic Sheet Export Format
      </h3>
      <p style="font-size: 14px; font-weight: bold; color: #DFBA6B; margin: 0 0 12px 0;">
        سلائیڈز پی ڈی ایف ڈاؤن لوڈ کرنے کا طریقہ منتخب کریں
      </p>
      <p style="font-size: 13px; color: #374151; margin: 0 0 20px 0; line-height: 1.5; font-weight: 500;">
        Choose whether to export this dynamic learning slide deck with integrated answers or as an unsolved student worksheet.
      </p>

      <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px; text-align: left;">
        <!-- Option 1: Solved -->
        <button id="modal-btn-solved" style="display: flex; align-items: flex-start; gap: 14px; padding: 14px 16px; border-radius: 14px; border: 2px solid #5C1D24; background: linear-gradient(135deg, #FCFAF7 0%, #FFFFFF 100%); cursor: pointer; text-align: left; transition: all 0.2s ease; width: 100%; box-sizing: border-box; outline: none;">
          <div style="width: 20px; height: 20px; border-radius: 50%; background: #5C1D24; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <div style="flex-grow: 1;">
            <div style="font-size: 14px; font-weight: 800; color: #4A121A; display: flex; align-items: center; gap: 6px;">
              <span>Solved Version (حل شدہ سلائیڈز)</span>
              <span style="font-size: 10px; padding: 1px 6px; background: #F3E9D9; color: #5C1D24; border-radius: 10px; font-weight: bold;">Default</span>
            </div>
            <div style="font-size: 12px; color: #374151; margin-top: 3px; line-height: 1.4; font-weight: 500;">
              Full deck including explanations, solved answer keys, and diagrams embedded in the slides.
            </div>
          </div>
        </button>

        <!-- Option 2: Unsolved -->
        <button id="modal-btn-unsolved" style="display: flex; align-items: flex-start; gap: 14px; padding: 14px 16px; border-radius: 14px; border: 2px solid #E2E8F0; background: #FFFFFF; cursor: pointer; text-align: left; transition: all 0.2s ease; width: 100%; box-sizing: border-box; outline: none;">
          <div style="width: 20px; height: 20px; border-radius: 50%; border: 2px solid #94A3B8; background: #FFFFFF; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px; box-sizing: border-box;"></div>
          <div style="flex-grow: 1;">
            <div style="font-size: 14px; font-weight: 800; color: #4A121A;">
              Unsolved Version (غیر حل شدہ شیٹ)
            </div>
            <div style="font-size: 12px; color: #475569; margin-top: 3px; line-height: 1.4; font-weight: 500;">
              Answers are hidden. Perfect for self-evaluation or test hand-outs with empty write-in guidelines.
            </div>
          </div>
        </button>
      </div>

      <div style="display: flex; gap: 10px; justify-content: flex-end;">
        <button id="modal-btn-cancel" style="height: 40px; padding: 0 16px; border-radius: 10px; border: 1px solid #CBD5E1; background: #FFFFFF; font-size: 13px; font-weight: bold; color: #64748B; cursor: pointer; transition: all 0.15s; outline: none;">
          Cancel
        </button>
        <button id="modal-btn-confirm" style="height: 40px; padding: 0 24px; border-radius: 10px; border: none; background: #4A121A; font-size: 13px; font-weight: bold; color: #FFFFFF; cursor: pointer; transition: all 0.15s; box-shadow: 0 4px 10px rgba(74, 18, 26, 0.2); outline: none;">
          Export Sheet
        </button>
      </div>
    `;

    backdrop.appendChild(card);
    document.body.appendChild(backdrop);

    setTimeout(() => {
      backdrop.style.opacity = '1';
      card.style.opacity = '1';
      card.style.transform = 'translateY(0) scale(1)';
    }, 20);

    let isSolvedSelection = true;

    const solvedBtn = card.querySelector('#modal-btn-solved') as HTMLButtonElement;
    const unsolvedBtn = card.querySelector('#modal-btn-unsolved') as HTMLButtonElement;
    const cancelBtn = card.querySelector('#modal-btn-cancel') as HTMLButtonElement;
    const confirmBtn = card.querySelector('#modal-btn-confirm') as HTMLButtonElement;

    const updateUI = () => {
      if (isSolvedSelection) {
        solvedBtn.style.borderColor = '#5C1D24';
        solvedBtn.style.background = 'linear-gradient(135deg, #FCFAF7 0%, #FFFFFF 100%)';
        const circle = solvedBtn.querySelector('div') as HTMLDivElement;
        circle.style.background = '#5C1D24';
        circle.style.borderColor = '#5C1D24';
        circle.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        `;

        unsolvedBtn.style.borderColor = '#E2E8F0';
        unsolvedBtn.style.background = '#FFFFFF';
        const uncircle = unsolvedBtn.querySelector('div') as HTMLDivElement;
        uncircle.style.borderColor = '#94A3B8';
        uncircle.style.background = '#FFFFFF';
        uncircle.innerHTML = '';
      } else {
        unsolvedBtn.style.borderColor = '#5C1D24';
        unsolvedBtn.style.background = 'linear-gradient(135deg, #FCFAF7 0%, #FFFFFF 100%)';
        const uncircle = unsolvedBtn.querySelector('div') as HTMLDivElement;
        uncircle.style.borderColor = '#5C1D24';
        uncircle.style.background = '#5C1D24';
        uncircle.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        `;

        solvedBtn.style.borderColor = '#E2E8F0';
        solvedBtn.style.background = '#FFFFFF';
        const circle = solvedBtn.querySelector('div') as HTMLDivElement;
        circle.style.background = '#FFFFFF';
        circle.style.borderColor = '#94A3B8';
        circle.innerHTML = '';
      }
    };

    solvedBtn.addEventListener('click', () => {
      isSolvedSelection = true;
      updateUI();
    });

    unsolvedBtn.addEventListener('click', () => {
      isSolvedSelection = false;
      updateUI();
    });

    const destroyModal = () => {
      backdrop.style.opacity = '0';
      card.style.transform = 'translateY(15px) scale(0.96)';
      setTimeout(() => {
        if (backdrop.parentNode) backdrop.parentNode.removeChild(backdrop);
      }, 250);
    };

    cancelBtn.addEventListener('click', () => {
      destroyModal();
      resolve(null);
    });

    confirmBtn.addEventListener('click', () => {
      destroyModal();
      resolve(isSolvedSelection);
    });
  });
}

// Global Parser for PDF Content items
interface ParsedMCQ {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

interface ParsedShortQ {
  question: string;
  modelAnswer: string;
  userAnswer?: string;
  feedback?: { score: string; text: string };
}

interface ParsedLongQ {
  question: string;
  modelAnswer: string;
  keyPoints: string[];
}

interface ParsedLessonBlock {
  title: string;
  paragraphs: string[];
}

function parsePDFContent(content: PDFItem[]) {
  const mcqs: ParsedMCQ[] = [];
  const shorts: ParsedShortQ[] = [];
  const longs: ParsedLongQ[] = [];
  const lessons: ParsedLessonBlock[] = [];

  let currentMode: 'mcq' | 'short' | 'long' | 'lesson' | 'none' = 'none';
  let currentMCQ: ParsedMCQ | null = null;
  let currentShort: ParsedShortQ | null = null;
  let currentLong: ParsedLongQ | null = null;
  let currentLesson: ParsedLessonBlock | null = null;

  for (let i = 0; i < content.length; i++) {
    const item = content[i];
    const text = (item.text || '').trim();

    if (item.type === 'heading') {
      const lowerH = text.toLowerCase();
      // Push any active parsed item before switching mode
      if (currentMCQ && currentMCQ.options && currentMCQ.options.length > 0) mcqs.push(currentMCQ);
      if (currentShort && currentShort.question) shorts.push(currentShort);
      if (currentLong && currentLong.question) longs.push(currentLong);
      if (currentLesson && currentLesson.paragraphs.length > 0) lessons.push(currentLesson);

      currentMCQ = null;
      currentShort = null;
      currentLong = null;
      currentLesson = null;

      if (lowerH.includes('multiple choice') || lowerH.includes('mcq') || lowerH.includes('section a') || lowerH.includes('انتخابی سوالات')) {
        currentMode = 'mcq';
      } else if (lowerH.includes('short question') || lowerH.includes('section b') || lowerH.includes('مختصر سوالات')) {
        currentMode = 'short';
      } else if (lowerH.includes('long question') || lowerH.includes('essay') || lowerH.includes('section c') || lowerH.includes('تفصیلی سوالات')) {
        currentMode = 'long';
      } else {
        currentMode = 'lesson';
        currentLesson = { title: text, paragraphs: [] };
      }
      continue;
    }

    if (item.type === 'subheading') {
      if (currentMCQ && currentMCQ.options && currentMCQ.options.length > 0) {
        mcqs.push(currentMCQ);
        currentMCQ = null;
      }
      if (currentShort && currentShort.question) {
        shorts.push(currentShort);
        currentShort = null;
      }
      if (currentLong && currentLong.question) {
        longs.push(currentLong);
        currentLong = null;
      }

      const qText = text;
      if (currentMode === 'mcq') {
        currentMCQ = { question: qText, options: [], correctAnswer: '', explanation: '' };
      } else if (currentMode === 'short') {
        currentShort = { question: qText, modelAnswer: '' };
      } else if (currentMode === 'long') {
        currentLong = { question: qText, modelAnswer: '', keyPoints: [] };
      } else if (currentMode === 'lesson') {
        if (currentLesson) {
          currentLesson.paragraphs.push(`### ${qText}`);
        }
      }
      continue;
    }

    if (item.type === 'text' && text) {
      if (currentMode === 'mcq' && currentMCQ) {
        if (/^[a-dA-D\u0627-\u062F]\)|^[a-dA-D\u0627-\u062F]\./.test(text)) {
          currentMCQ.options.push(text);
        } else if (text.toLowerCase().startsWith('correct answer:') || text.includes('درست جواب:')) {
          currentMCQ.correctAnswer = text.replace(/^(correct answer:|درست جواب:)\s*/i, '').trim();
        } else if (text.toLowerCase().startsWith('explanation:') || text.includes('وضاحت:')) {
          currentMCQ.explanation = text.replace(/^(explanation:|وضاحت:)\s*/i, '').trim();
        } else if (/^[a-dA-D]\s*$/.test(text)) {
          currentMCQ.correctAnswer = text;
        } else {
          currentMCQ.question += ' ' + text;
        }
      } else if (currentMode === 'short' && currentShort) {
        if (text.toLowerCase().startsWith('your answer:') || text.includes('آپ کا جواب:')) {
          currentShort.userAnswer = text.replace(/^(your answer:|آپ کا جواب:)\s*/i, '').trim();
        } else if (text.toLowerCase().startsWith('model answer:') || text.includes('ماڈل جواب:')) {
          currentShort.modelAnswer = text.replace(/^(model answer:|ماڈل جواب:)\s*/i, '').trim();
        } else if (/^feedback\s*\(/i.test(text) || text.toLowerCase().startsWith('score:')) {
          const scoreMatch = text.match(/score:\s*(\d+(\.\d+)?)|feedback\s*\((\d+)\/10\)/i);
          const scoreVal = scoreMatch ? (scoreMatch[1] || scoreMatch[3] || '8') : '8';
          const feedbackText = text.replace(/^feedback\s*\(\d+\/10\):\s*/i, '').trim();
          currentShort.feedback = { score: scoreVal, text: feedbackText };
        } else {
          if (currentShort.modelAnswer) {
            currentShort.modelAnswer += ' ' + text;
          } else {
            currentShort.modelAnswer = text;
          }
        }
      } else if (currentMode === 'long' && currentLong) {
        if (text.startsWith('•') || text.startsWith('-') || text.startsWith('*')) {
          const kpText = text.replace(/^[•\-*]\s*/, '').trim();
          currentLong.keyPoints.push(kpText);
        } else if (text.toLowerCase().startsWith('model answer:') || text.includes('ماڈل جواب:')) {
          currentLong.modelAnswer = text.replace(/^(model answer:|ماڈل جواب:)\s*/i, '').trim();
        } else {
          if (currentLong.modelAnswer) {
            currentLong.modelAnswer += '\n' + text;
          } else {
            currentLong.modelAnswer = text;
          }
        }
      } else if (currentMode === 'lesson' && currentLesson) {
        currentLesson.paragraphs.push(text);
      }
    }
  }

  // Push left overs
  if (currentMCQ && currentMCQ.options && currentMCQ.options.length > 0) mcqs.push(currentMCQ);
  if (currentShort && currentShort.question) shorts.push(currentShort);
  if (currentLong && currentLong.question) longs.push(currentLong);
  if (currentLesson && currentLesson.paragraphs.length > 0) lessons.push(currentLesson);

  return { mcqs, shorts, longs, lessons };
}

// Fully custom HTML based Portrait Document PDF exporter (A4 vertical size)
export const generatePDF = async (title: string, content: PDFItem[], options?: PDFOptions) => {
  const actualOptions = options || {};
  let isSolved = true;

  if (actualOptions.isSolved === undefined) {
    try {
      const choice = await askSolvedOrUnsolved(title);
      if (choice === null) return; // User cancelled
      isSolved = choice;
    } catch (e) {
      return;
    }
  } else {
    isSolved = actualOptions.isSolved;
  }

  const mergedOptions = { ...actualOptions, isSolved };
  
  // Detect if Urdu content
  const isUrdu = ((mergedOptions.language || '').toLowerCase().includes('urdu') || 
                  /([\u0600-\u06FF])/.test(title + ' ' + content.map(c => c.text || '').join(' ')));

  // Show status loading overlay in target language
  const overlay = document.createElement('div');
  overlay.id = 'pdf-generation-progress-overlay';
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100vw';
  overlay.style.height = '100vh';
  overlay.style.backgroundColor = 'rgba(74, 18, 26, 0.55)';
  overlay.style.backdropFilter = 'blur(10px)';
  overlay.style.zIndex = '9999999';
  overlay.style.display = 'flex';
  overlay.style.justifyContent = 'center';
  overlay.style.alignItems = 'center';
  overlay.style.color = '#ffffff';
  overlay.style.fontFamily = "system-ui, -apple-system, 'Inter', sans-serif";

  const loadingTitle = isUrdu ? "پیش رفت جاری ہے..." : "Generating Academic PDF...";
  const loadingSub = isUrdu ? "آپ کا پورٹریٹ پی ڈی ایف رپورٹ تیار کیا جا رہا ہے۔ براے مہربانی انتظار کریں۔" : "Compiling dynamic scholastic pages in ultra-high resolution. Please wait.";

  overlay.innerHTML = `
    <div style="background: white; color: #1E293B; padding: 2.5rem; border-radius: 20px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.15); text-align: center; max-width: 400px; width: 100%; border: 1px solid #F3E9D9; display: flex; flex-direction: column; align-items: center; gap: 1rem;">
      <div style="position: relative; width: 80px; height: 80px;">
        <div style="box-sizing: border-box; display: block; position: absolute; width: 64px; height: 64px; margin: 8px; border: 6px solid #4A121A; border-radius: 50%; animation: slide-ring-spin 1.2s linear infinite; border-color: #4A121A transparent #DFBA6B transparent;"></div>
      </div>
      <h3 style="font-size: 1.25rem; font-weight: 800; color: #4A121A; margin: 0.5rem 0 0.25rem 0;">${loadingTitle}</h3>
      <p style="font-size: 0.9rem; color: #475569; margin: 0; line-height: 1.5; font-weight: 500;">${loadingSub}</p>
    </div>
    <style>
      @keyframes slide-ring-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    </style>
  `;
  document.body.appendChild(overlay);

  // Parse questions & content
  const parsed = parsePDFContent(content);

  // Dynamic variables
  const student = mergedOptions.studentName || 'EduGen Student';
  const topic = mergedOptions.topic || mergedOptions.subject || title.replace(/MCQs|Short\s*Qs|Essays|Lesson|Quiz/i, '').trim();
  const classLevel = mergedOptions.gradeLevel || 'High School (Grade 9-10)';
  const language = mergedOptions.language || (isUrdu ? 'Urdu' : 'English');
  const timeAllowed = mergedOptions.timeAllowed || '60 Minutes';

  let calculatedMarks = 0;
  if (parsed.mcqs.length > 0) calculatedMarks += parsed.mcqs.length * 1;
  if (parsed.shorts.length > 0) calculatedMarks += parsed.shorts.length * 3;
  if (parsed.longs.length > 0) calculatedMarks += parsed.longs.length * 10;
  if (calculatedMarks === 0) calculatedMarks = 100; // default for complete evaluation sheets
  const totalMarks = mergedOptions.totalMarks || `${calculatedMarks} Marks`;

  const selectedImages = content.filter(item => item.type === 'image' && item.text);

  // Create temporary off-screen container for rendering
  const container = document.createElement('div');
  container.id = 'report-temp-render-container';
  container.style.position = 'fixed';
  container.style.top = '-9999px';
  container.style.left = '-9999px';
  container.style.width = '800px'; 
  container.style.backgroundColor = '#FCFAF7';
  container.style.boxSizing = 'border-box';

  document.body.appendChild(container);

  // Embed fonts
  const fontTag = document.createElement('link');
  fontTag.rel = 'stylesheet';
  fontTag.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=Noto+Naskh+Arabic:wght@400;700&display=swap';
  document.head.appendChild(fontTag);

  await document.fonts.ready;
  await new Promise(r => setTimeout(r, 600));

  type DocumentPageLayout = {
    title: string;
    elementsHTML: string;
    showFooterPageNum?: boolean;
  };

  const pages: DocumentPageLayout[] = [];

  // --- PAGE 1: COVER PAGE (Crimson and Gold Scholar Theme) ---
  const dateStr = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  const subjectStr = mergedOptions.subject || (isUrdu ? 'نصابی مواد' : 'Advanced Curricula');

  const coverHTML = `
    <div style="width: 100%; height: 100%; padding: 55px 50px; background: #0F172A; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; color: #ffffff; border: 15px solid #0F172A; outline: 1px solid #DFBA6B; outline-offset: -10px;">
      <!-- Crest and Logo -->
      <div style="text-align: center; margin-top: 15px;">
        <svg width="110" height="110" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin: 0 auto;">
          <!-- Laurels right -->
          <path d="M 50 82 C 68 80, 83 61, 75 35 M 50 72 C 60 70, 71 58, 67 40" stroke="#DFBA6B" stroke-width="1.8" stroke-linecap="round" fill="none" opacity="0.95"/>
          <path d="M 72 38 L 75 35 L 70 34" stroke="#DFBA6B" stroke-width="1.5" fill="none"/>
          <!-- Laurels left -->
          <path d="M 50 82 C 32 80, 17 61, 25 35 M 50 72 C 40 70, 29 58, 33 40" stroke="#DFBA6B" stroke-width="1.8" stroke-linecap="round" fill="none" opacity="0.95"/>
          <path d="M 28 38 L 25 35 L 30 34" stroke="#DFBA6B" stroke-width="1.5" fill="none"/>
          <!-- Shield outline -->
          <path d="M 37 28 L 50 21 L 63 28 L 63 53 C 63 67, 50 73, 50 73 C 50 73, 37 67, 37 53 Z" fill="#0F172A" stroke="#DFBA6B" stroke-width="2.5" stroke-linejoin="round"/>
          <circle cx="50" cy="81" r="2.2" fill="#DFBA6B"/>
          <circle cx="34" cy="74" r="1.5" fill="#DFBA6B"/>
          <circle cx="66" cy="74" r="1.5" fill="#DFBA6B"/>
          <circle cx="23" cy="61" r="1.5" fill="#DFBA6B"/>
          <circle cx="77" cy="61" r="1.5" fill="#DFBA6B"/>
          
          <!-- Graduation hat and book elements inside shield -->
          <path d="M 43 40 Q 50 37, 50 42 Q 50 37, 57 40 L 57 48 Q 50 45, 50 50 Q 50 45, 43 48 Z" fill="#DFBA6B" stroke="#DFBA6B" stroke-width="0.5"/>
          <path d="M 50 53 L 56 55 L 50 57 L 44 55 Z" fill="#DFBA6B"/>
          <path d="M 47 56 L 47 60 Q 50 62, 53 60 L 53 56" stroke="#DFBA6B" stroke-width="1.2" fill="none"/>
          <path d="M 50 56 L 43 59 L 43 62" stroke="#DFBA6B" stroke-width="0.8" fill="none"/>
        </svg>
        <h1 style="font-family: 'Playfair Display', 'Georgia', serif; font-size: 38px; font-weight: 900; letter-spacing: 5px; color: #DFBA6B; text-transform: uppercase; margin: 12px 0 0 0; line-height: 1;">EDUGEN</h1>
        <p style="font-family: 'Inter', sans-serif; font-size: 10px; font-weight: 800; letter-spacing: 5px; color: #DFBA6B; opacity: 0.85; text-transform: uppercase; margin: 6px 0 0 0;">EDUCATION GENERATION</p>
      </div>

      <!-- Description Block -->
      <div style="padding: 0 15px; margin-top: 15px; font-family: 'Inter', sans-serif; text-align: justify;">
        <p style="font-size: 13.5px; font-weight: 700; color: #DFBA6B; margin-bottom: 12px; font-family: 'Georgia', serif; font-style: italic; text-align: center;">Edugen Platform: Advanced AI-Powered Academic Companion</p>
        <p style="font-size: 11px; font-weight: 500; color: #F5EAE0; line-height: 1.6; margin-bottom: 11px; opacity: 0.95;">
          Edugen is an innovative AI-powered academic companion designed to support students, educators, and researchers throughout their academic journey. Our platform integrates advanced artificial intelligence with a user-friendly interface to deliver accurate, reliable, and personalized academic assistance.
        </p>
        <p style="font-size: 11px; font-weight: 500; color: #F5EAE0; line-height: 1.6; opacity: 0.95; margin-bottom: 15px;">
          Edugen brings together a comprehensive suite of tools tailored to meet diverse academic needs — from generating high-quality questions and explanations to providing in-depth analyses and study materials. Whether you are preparing for exams, conducting research, or enhancing your understanding of complex topics, Edugen is your intelligent partner in learning and discovery.
        </p>

        <!-- Tool grid divider -->
        <div style="border-top: 1px dashed rgba(223, 186, 107, 0.3); margin-bottom: 12px;"></div>
        <p style="text-align: center; font-size: 10px; font-weight: 800; color: #DFBA6B; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 12px;">Edugen Includes the Following Core Tools:</p>

        <!-- Dynamic Grid Layout matching Screenshot 1 (8 modules) -->
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px 6px; text-align: center; margin-bottom: 10px;">
          <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#DFBA6B" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
              <path d="M9 12l2 2 4-4"/>
            </svg>
            <span style="font-size: 8.5px; font-weight: 800; color: #F5EAE0; line-height: 1.2;">MCQ<br>Generator</span>
          </div>
          <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#DFBA6B" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              <path d="M12 8v3M12 14h.01"/>
            </svg>
            <span style="font-size: 8.5px; font-weight: 800; color: #F5EAE0; line-height: 1.2;">Short<br>Questions</span>
          </div>
          <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#DFBA6B" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            <span style="font-size: 8.5px; font-weight: 800; color: #F5EAE0; line-height: 1.2;">Long<br>Questions</span>
          </div>
          <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#DFBA6B" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <span style="font-size: 8.5px; font-weight: 800; color: #F5EAE0; line-height: 1.2;">Topic<br>Explainer</span>
          </div>
          <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#DFBA6B" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
            <span style="font-size: 8.5px; font-weight: 800; color: #F5EAE0; line-height: 1.2;">Story &<br>Letter</span>
          </div>
          <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#DFBA6B" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <text x="6" y="18" fill="#DFBA6B" font-family="'Inter', sans-serif" font-size="9" font-weight="900">A+</text>
            </svg>
            <span style="font-size: 8.5px; font-weight: 800; color: #F5EAE0; line-height: 1.2;">Exam<br>Mode</span>
          </div>
          <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#DFBA6B" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            <span style="font-size: 8.5px; font-weight: 800; color: #F5EAE0; line-height: 1.2;">My<br>Downloads</span>
          </div>
          <div style="display: flex; flex-direction: column; align-items: center; gap: 4px;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#DFBA6B" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="20" x2="18" y2="10"/>
              <line x1="12" y1="20" x2="12" y2="4"/>
              <line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
            <span style="font-size: 8.5px; font-weight: 800; color: #F5EAE0; line-height: 1.2;">Visual<br>Analysis</span>
          </div>
        </div>
      </div>

      <!-- Bottom Title Block -->
      <div style="text-align: center; margin-bottom: 10px; font-family: 'Playfair Display', 'Georgia', serif;">
        <div style="width: 100%; border-top: 1.5px solid rgba(223, 186, 107, 0.4); margin-bottom: 12px;"></div>
        <h2 style="font-size: 22px; font-weight: 900; color: #DFBA6B; margin: 0 0 6px 0; letter-spacing: -0.2px;">Professional Scholastic Resource Portfolio</h2>
        <h3 style="font-size: 18px; font-weight: 800; color: #DFBA6B; margin: 0 0 4px 0;">Cover Page</h3>
        <p style="font-family: 'Inter', sans-serif; font-size: 13px; font-weight: 700; color: #F5EAE0; margin: 0 0 8px 0;">By: ${student}</p>
        <div style="width: 70px; height: 1.2px; background: rgba(223, 186, 107, 0.4); margin: 0 auto 8px auto;"></div>
        <p style="font-family: 'Inter', sans-serif; font-size: 9.5px; font-weight: 500; color: #D4C5B9; line-height: 1.5; max-width: 580px; margin: 0 auto; text-align: center;">
          This scholastic portfolio has been prepared for academic purposes as part of the ${subjectStr} curriculum evaluation for ${classLevel}. It aims to explore key concepts related to "${topic}" and ensure high-fidelity comprehension through practice matrices, guided response sheets, and unified cognitive reinforcement assessments.
        </p>
        <p style="font-family: 'Inter', sans-serif; font-size: 11px; font-weight: 700; color: #DFBA6B; letter-spacing: 0.8px; margin-top: 12px;">
          ${dateStr}
        </p>
      </div>
    </div>
  `;
  pages.push({ title: 'Cover Page', elementsHTML: coverHTML, showFooterPageNum: false });

  // Elegant header standard reusable string
  const elegantHeaderHTML = `
    <div style="border-bottom: 3.5px solid #0F172A; padding-bottom: 4px; margin-bottom: 2px; display: flex; justify-content: space-between; align-items: flex-end; font-family: 'Playfair Display', 'Georgia', serif;">
      <span style="font-size: 26px; font-weight: 900; color: #0F172A; letter-spacing: 2px; line-height: 1;">EDUGEN</span>
      <span style="font-family: 'Inter', sans-serif; font-size: 9px; font-weight: 800; color: #0F172A; letter-spacing: 1.2px; text-transform: uppercase;">UNIFIED LEARNING MATRIX • SYSTEMS SPECIFICATION</span>
    </div>
    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; border-bottom: 1.2px solid #DFBA6B; padding-bottom: 6px;">
      <span style="font-family: 'Inter', sans-serif; font-size: 8px; font-weight: 800; color: #DFBA6B; letter-spacing: 1.5px; text-transform: uppercase;">ADVANCED ACADEMIC INTELLIGENCE SUITE</span>
      <span style="font-family: 'Inter', sans-serif; font-size: 8px; font-weight: 800; color: #1E3A8A; tracking: 0.5px; text-transform: uppercase;">TOPIC: ${topic.toUpperCase()}</span>
    </div>
  `;

  // --- DYNAMIC PORTRAIT COMPILING ENGINE ---
  const dirStyle = isUrdu ? "direction: rtl; text-align: right;" : "text-align: justify;";
  const alignStyle = isUrdu ? "text-align: right;" : "text-align: left;";

  const blocks: { html: string; estimatedHeight: number }[] = [];

  // 1. TOPIC EXPLAINER NARRATIVE BLOCKS
  if (parsed.lessons.length > 0) {
    parsed.lessons.forEach((lesson) => {
      const isStoryOrLetter = (
        topic.toLowerCase().includes('story') || 
        topic.toLowerCase().includes('letter') || 
        title.toLowerCase().includes('story') || 
        title.toLowerCase().includes('letter') ||
        lesson.title.toLowerCase().includes('story') || 
        lesson.title.toLowerCase().includes('letter') ||
        lesson.title.toLowerCase().includes('memorandum') ||
        lesson.title.toLowerCase().includes('application')
      );

      const badgeText = isStoryOrLetter ? "07 • STORY & LETTER ENGINE" : "01 • TOPIC EXPLAINER SUITE";
      const titleLabel = isStoryOrLetter ? "Contextual Narratives & Documentation" : lesson.title;

      blocks.push({
        html: `
          <div style="background: #1E3A8A; color: #D4B581; padding: 4px 14px; border-radius: 6px; display: inline-flex; align-items: center; font-family: 'Inter', sans-serif; font-size: 10px; font-weight: 900; letter-spacing: 1.2px; text-transform: uppercase; margin-bottom: 12px; margin-top: 8px;">
            ${badgeText}
          </div>
        `,
        estimatedHeight: 40
      });

      if (isStoryOrLetter) {
        blocks.push({
          html: `
            <h3 style="font-family: 'Playfair Display', 'Georgia', serif; font-size: 19px; font-weight: 900; color: #1E3A8A; margin: 0 0 10px 0; ${alignStyle}">
              ${titleLabel}
            </h3>
          `,
          estimatedHeight: 35
        });

        const narrativeHTML = lesson.paragraphs.map(para => {
          return `<p style="margin-bottom: 12px; font-family: 'Georgia', serif; font-size: 11.5px; line-height: 1.6; color: #2D2525; ${dirStyle}">${para}</p>`;
        }).join('');

        const totalChars = lesson.paragraphs.reduce((sum, p) => sum + p.length, 0);
        const estimatedNarrativeH = Math.max(150, Math.ceil(totalChars / 80) * 16 + 80);

        blocks.push({
          html: `
            <div style="border: 1.5px solid #D4B581; border-radius: 12px; padding: 22px; background: #ffffff; border-left: 4.5px solid #1E3A8A; text-align: justify; margin-bottom: 20px;">
              <div style="font-family: 'Inter', sans-serif; font-size: 9px; font-weight: 850; color: #9A7B39; text-transform: uppercase; margin-bottom: 12px; letter-spacing: 0.5px;">Custom Generated Asset Dossier</div>
              <div style="font-weight: bold; margin-bottom: 6px; font-size: 12px; letter-spacing: -0.2px; font-family: 'Inter', sans-serif; color: #1E3A8A; text-transform: uppercase;">SUBJECT REFERENCE: ${lesson.title}</div>
              <div style="font-weight: bold; margin-bottom: 15px; font-size: 10px; color: #64748B; font-family: 'Inter', sans-serif; text-transform: uppercase; letter-spacing: 0.5px;">Status: Official Release</div>
              ${narrativeHTML}
            </div>
          `,
          estimatedHeight: estimatedNarrativeH
        });
      } else {
        blocks.push({
          html: `
            <h3 style="font-family: 'Playfair Display', 'Georgia', serif; font-size: 19px; font-weight: 900; color: #1E3A8A; margin: 0 0 10px 0; ${alignStyle}">
              ${lesson.title}
            </h3>
          `,
          estimatedHeight: 35
        });

        lesson.paragraphs.forEach((para) => {
          const isHeading = para.startsWith('###');
          if (isHeading) {
            const cleanHeading = para.replace('###', '').trim();
            blocks.push({
              html: `
                <h4 style="font-family: 'Playfair Display', 'Georgia', serif; font-size: 14px; font-weight: 800; color: #1E3A8A; margin: 16px 0 8px 0; ${alignStyle}">
                  ${cleanHeading}
                </h4>
              `,
              estimatedHeight: 30
            });
          } else {
            const estimatedParaH = Math.max(50, Math.ceil(para.length / 75) * 16 + 20);
            blocks.push({
              html: `
                <p style="font-family: 'Georgia', serif; font-size: 11.5px; color: #2E2222; line-height: 1.6; text-align: justify; margin-bottom: 12px; white-space: pre-wrap; ${dirStyle}">
                  ${para}
                </p>
              `,
              estimatedHeight: estimatedParaH
            });
          }
        });

        if (lesson.paragraphs.length > 1) {
          const validParaForNotice = lesson.paragraphs.find(p => p.length > 50 && p.length < 200) || lesson.paragraphs[0].slice(0, 150) + "...";
          blocks.push({
            html: `
              <div style="background: #FDFAF3; border: 1px solid rgba(212, 181, 129, 0.3); border-left: 4px solid #D4B581; border-radius: 6px; padding: 12px 16px; margin-bottom: 18px; font-family: 'Georgia', serif; font-size: 11px; color: #4A3E3E; line-height: 1.5; font-style: italic; ${dirStyle}">
                <strong style="color: #1E3A8A; font-family: 'Inter', sans-serif; font-style: normal; font-weight: 850; margin-right: 4px; text-transform: uppercase; font-size: 9px; letter-spacing: 0.5px;">System Engine Notice:</strong> ${validParaForNotice}
              </div>
            `,
            estimatedHeight: 110
          });
        }
      }
    });
  }

  // 2. MCQS MODULE BLOCKS
  if (parsed.mcqs.length > 0) {
    blocks.push({
      html: `
        <div style="background: #1E3A8A; color: #D4B581; padding: 4px 14px; border-radius: 6px; display: inline-flex; align-items: center; font-family: 'Inter', sans-serif; font-size: 10px; font-weight: 900; letter-spacing: 1.2px; text-transform: uppercase; margin-bottom: 12px; margin-top: 8px;">
          02 • MCQ GENERATOR MODULE
        </div>
      `,
      estimatedHeight: 40
    });

    blocks.push({
      html: `
        <h3 style="font-family: 'Playfair Display', 'Georgia', serif; font-size: 19px; font-weight: 900; color: #1E3A8A; margin: 0 0 4px 0; ${alignStyle}">
          High-Fidelity Evaluation Matrix
        </h3>
        <p style="font-family: 'Georgia', serif; font-size: 10.5px; color: #645A5A; font-style: italic; margin-bottom: 16px; ${alignStyle}">
          Dynamic assessment items formulated by the automated generation core to evaluate micro-level concepts.
        </p>
      `,
      estimatedHeight: 60
    });

    parsed.mcqs.forEach((mcq, mIdx) => {
      let optionsHTML = '';
      mcq.options.forEach((opt) => {
        const optionTextLower = opt.toLowerCase();
        let isCorrect = false;

        if (mcq.correctAnswer) {
          const correctKey = mcq.correctAnswer.trim().toLowerCase();
          if (correctKey.length === 1) {
            isCorrect = opt.trim().toLowerCase().startsWith(correctKey + ')');
          } else {
            isCorrect = optionTextLower.includes(correctKey) || correctKey.includes(optionTextLower);
          }
        }

        if (isSolved && isCorrect) {
          optionsHTML += `
            <div style="display: flex; align-items: center; ${dirStyle}">
              <span style="display:inline-flex; align-items:center; justify-content:center; width:15px; height:15px; border:1.5px solid #1E3A8A; border-radius:4px; margin-right:8px; background:#1E3A8A; color:#ffffff; font-size:9px; font-weight:bold;">✔</span>
              <span style="font-weight: 700; color: #1E3A8A;">${opt}</span>
            </div>
          `;
        } else {
          optionsHTML += `
            <div style="display: flex; align-items: center; ${dirStyle}">
              <span style="display:inline-block; width:15px; height:15px; border:1.5px solid #D4B581; border-radius:4px; margin-right:8px; background:#fff;"></span>
              <span>${opt}</span>
            </div>
          `;
        }
      });

      const totalOptionsLen = mcq.options.reduce((sum, o) => sum + o.length, 0);
      const isGridOptions = totalOptionsLen < 120;
      const optionWrapperLayout = isGridOptions 
        ? "display: grid; grid-template-columns: 1fr 1fr; gap: 10px;" 
        : "display: flex; flex-direction: column; gap: 8px;";
      
      const cardHeight = isGridOptions ? 150 : 190;

      blocks.push({
        html: `
          <div style="background: white; border: 1.5px solid rgba(212,181,129,0.5); border-radius: 10px; padding: 14px 18px; border-left: 4px solid #1E3A8A; margin-bottom: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.01);">
            <div style="font-size: 12.5px; font-weight: 700; color: #1E3A8A; line-height: 1.4; margin-bottom: 12px; font-family: 'Georgia', serif; text-align: left; ${dirStyle}">
              Q${mIdx + 1}. ${mcq.question}
            </div>
            <div style="${optionWrapperLayout} font-family: 'Inter', sans-serif; font-size: 10.5px; color: #374151;">
              ${optionsHTML}
            </div>
            ${isSolved && mcq.explanation ? `
              <div style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed rgba(212,181,129,0.3); font-family: 'Georgia', serif; font-size: 10.5px; color: #4A3E3E; line-height: 1.4; font-style: italic; ${dirStyle}">
                <strong style="color: #1E3A8A; font-family: 'Inter', sans-serif; font-style: normal; text-transform: uppercase; font-size: 8.5px;">Explanation:</strong> ${mcq.explanation}
              </div>
            ` : ''}
          </div>
        `,
        estimatedHeight: cardHeight + (isSolved && mcq.explanation ? 40 : 0)
      });
    });
  }

  // 3. SHORT QUESTIONS BLOCKS
  if (parsed.shorts.length > 0) {
    blocks.push({
      html: `
        <div style="background: #1E3A8A; color: #D4B581; padding: 4px 14px; border-radius: 6px; display: inline-flex; align-items: center; font-family: 'Inter', sans-serif; font-size: 10px; font-weight: 900; letter-spacing: 1.2px; text-transform: uppercase; margin-bottom: 12px; margin-top: 8px;">
          03 • SHORT QUESTIONS CORE
        </div>
      `,
      estimatedHeight: 40
    });

    blocks.push({
      html: `
        <h3 style="font-family: 'Playfair Display', 'Georgia', serif; font-size: 19px; font-weight: 900; color: #1E3A8A; margin: 0 0 10px 0; ${alignStyle}">
          Conceptual Response Canvas
        </h3>
      `,
      estimatedHeight: 35
    });

    parsed.shorts.forEach((short, sIdx) => {
      if (!isSolved) {
        blocks.push({
          html: `
            <div style="margin-bottom: 20px;">
              <div style="font-size: 13px; font-weight: 700; color: #1E3A8A; line-height: 1.4; margin-bottom: 10px; font-family: 'Georgia', serif; text-align: left; ${dirStyle}">
                Q${sIdx + 1}. ${short.question}
              </div>
              <div style="border-bottom: 1.2px dotted #B8A6A6; height: 16px; margin-bottom: 8px;"></div>
              <div style="border-bottom: 1.2px dotted #B8A6A6; height: 16px; margin-bottom: 8px;"></div>
              <div style="border-bottom: 1.2px dotted #B8A6A6; height: 16px;"></div>
            </div>
          `,
          estimatedHeight: 130
        });
      } else {
        blocks.push({
          html: `
            <div style="margin-bottom: 20px; background: white; border: 1.5px solid rgba(212,181,129,0.4); padding: 14px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.01);">
              <div style="font-size: 13px; font-weight: 700; color: #1E3A8A; line-height: 1.4; margin-bottom: 8px; font-family: 'Georgia', serif; text-align: left; ${dirStyle}">
                Q${sIdx + 1}. ${short.question}
              </div>
              <div style="background: #FDFAF3; border-left: 3px solid #D4B581; padding: 10px 12px; border-radius: 4px; font-family: 'Georgia', serif; font-size: 11px; color: #4A3E3E; line-height: 1.5; ${dirStyle}">
                <strong style="color: #1E3A8A; font-family: 'Inter', sans-serif; font-size: 9px; text-transform: uppercase;">Model Answer:</strong> ${short.modelAnswer}
              </div>
              ${short.feedback ? `
                <div style="margin-top: 8px; font-size: 10.5px; color: #2563EB; font-weight: bold; font-family: 'Inter', sans-serif; display: flex; align-items: center; gap: 4px; ${dirStyle}">
                  <span>Assessment Score: ${short.feedback.score}/10 | </span>
                  <span style="font-weight: 500; font-style: italic; color: #475569;">${short.feedback.text}</span>
                </div>
              ` : ''}
              ${short.userAnswer ? `
                <div style="margin-top: 6px; font-size: 10.5px; color: #334155; font-family: 'Georgia', serif; ${dirStyle}">
                  <strong style="color: #1E3A8A; font-family: 'Inter', sans-serif; font-size: 9px; text-transform: uppercase;">Student's Attempt:</strong> "${short.userAnswer}"
                </div>
              ` : ''}
            </div>
          `,
          estimatedHeight: 130
        });
      }
    });
  }

  // 4. LONG QUESTIONS BLOCKS
  if (parsed.longs.length > 0) {
    blocks.push({
      html: `
        <div style="background: #1E3A8A; color: #D4B581; padding: 4px 14px; border-radius: 6px; display: inline-flex; align-items: center; font-family: 'Inter', sans-serif; font-size: 10px; font-weight: 900; letter-spacing: 1.2px; text-transform: uppercase; margin-bottom: 12px; margin-top: 8px;">
          04 • LONG QUESTIONS ENGINE
        </div>
      `,
      estimatedHeight: 40
    });

    blocks.push({
      html: `
        <h3 style="font-family: 'Playfair Display', 'Georgia', serif; font-size: 19px; font-weight: 900; color: #1E3A8A; margin: 0 0 10px 0; ${alignStyle}">
          Advanced Analytical Evaluation
        </h3>
      `,
      estimatedHeight: 35
    });

    parsed.longs.forEach((long, lIdx) => {
      let rubricLi = '';
      if (long.keyPoints && long.keyPoints.length > 0) {
        rubricLi = long.keyPoints.map(kp => `<li style="margin-bottom:3px;">${kp}</li>`).join('');
      }

      const pointsHeading = isUrdu ? "اہداف برائے تشخیص" : "Target Evaluation Rubric Outlines";

      if (!isSolved) {
        blocks.push({
          html: `
            <div style="background: white; border: 1.5px solid rgba(212,181,129,0.5); border-radius: 10px; padding: 16px 20px; border-left: 4px solid #1E3A8A; margin-bottom: 20px;">
              <div style="font-size: 13px; font-weight: 700; color: #1E3A8A; line-height: 1.4; margin-bottom: 12px; font-family: 'Georgia', serif; text-align: left; ${dirStyle}">
                Q${lIdx + 1}. ${long.question}
              </div>
              <div style="background: #FDFAF3; border-left: 3px solid #D4B581; padding: 10px 12px; border-radius: 4px; ${dirStyle}">
                <div style="font-size: 9px; font-weight: 850; color: #1E3A8A; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.5px; font-family: 'Inter', sans-serif;">${pointsHeading}</div>
                <div style="font-size: 11px; color: #645A5A; font-style: italic; font-family: 'Georgia', serif;">
                  ${rubricLi ? `<ul style="margin:0; padding-left:14px;">${rubricLi}</ul>` : "Structure the comprehensive analytic response prioritizing structural factors, operational definitions, and comparative case details."}
                </div>
              </div>
            </div>
          `,
          estimatedHeight: 140
        });
      } else {
        blocks.push({
          html: `
            <div style="background: white; border: 1.5px solid rgba(212,181,129,0.5); border-radius: 10px; padding: 16px 20px; border-left: 4px solid #1E3A8A; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.01);">
              <div style="font-size: 13px; font-weight: 700; color: #1E3A8A; line-height: 1.4; margin-bottom: 12px; font-family: 'Georgia', serif; text-align: left; ${dirStyle}">
                Q${lIdx + 1}. ${long.question}
              </div>
              <div style="background: #FDFAF3; border-left: 3px solid #D4B581; padding: 10px 12px; border-radius: 4px; margin-bottom: 12px; ${dirStyle}">
                <div style="font-size: 9px; font-weight: 850; color: #1E3A8A; text-transform: uppercase; margin-bottom: 4px; letter-spacing: 0.5px; font-family: 'Inter', sans-serif;">Model Analysis Solution Outline</div>
                <div style="font-size: 11px; color: #2E2222; line-height: 1.5; font-family: 'Georgia', serif; white-space: pre-wrap;">
                  ${long.modelAnswer}
                </div>
              </div>
              ${rubricLi ? `
                <div style="font-size: 9.5px; font-weight: 850; color: #1E3A8A; text-transform: uppercase; margin-bottom: 6px; font-family: 'Inter', sans-serif; ${alignStyle}">Key Assessment Framework:</div>
                <ul style="margin: 0; padding-left: 14px; font-size: 10.5px; color: #555; font-family: 'Georgia', serif; line-height: 1.4; ${dirStyle}">
                  ${rubricLi}
                </ul>
              ` : ''}
            </div>
          `,
          estimatedHeight: Math.max(180, Math.ceil(long.modelAnswer.length / 80) * 16 + 100)
        });
      }
    });
  }

  // 5. EXAM STATS ROW
  if (mergedOptions.isExam || parsed.mcqs.length > 0 || parsed.shorts.length > 0) {
    blocks.push({
      html: `
        <div style="background: #1E3A8A; border: 1.5px solid #D4B581; border-radius: 12px; padding: 14px 18px; font-family: 'Inter', sans-serif; display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 15px; margin-bottom: 15px;">
          <div style="background: rgba(255,255,255,0.06); padding: 10px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1); text-align: left;">
            <span style="display:block; font-size: 8.5px; font-weight: 850; color: #D4B581; text-transform: uppercase; letter-spacing: 0.5px;">Session Duration</span>
            <span style="display:block; font-size: 14px; font-weight: 900; color: #ffffff; margin-top: 3px;">${timeAllowed}</span>
          </div>
          <div style="background: rgba(255,255,255,0.06); padding: 10px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1); text-align: left;">
            <span style="display:block; font-size: 8.5px; font-weight: 850; color: #D4B581; text-transform: uppercase; letter-spacing: 0.5px;">Evaluation Target</span>
            <span style="display:block; font-size: 14px; font-weight: 900; color: #ffffff; margin-top: 3px;">${totalMarks}</span>
          </div>
          <div style="background: rgba(255,255,255,0.06); padding: 10px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1); text-align: left;">
            <span style="display:block; font-size: 8.5px; font-weight: 850; color: #D4B581; text-transform: uppercase; letter-spacing: 0.5px;">Evaluation Mode</span>
            <span style="display:block; font-size: 14px; font-weight: 900; color: #ffffff; margin-top: 3px;">Active</span>
          </div>
        </div>
      `,
      estimatedHeight: 90
    });
  }

  // --- ARBITRARY WORDPRESS FALLBACK / SMART SUITE ---
  if (blocks.length === 0) {
    let adaptiveHTML = elegantHeaderHTML + `
      <div style="background: #1E3A8A; color: #D4B581; padding: 4px 14px; border-radius: 6px; display: inline-flex; align-items: center; font-family: 'Inter', sans-serif; font-size: 10px; font-weight: 900; letter-spacing: 1.2px; text-transform: uppercase; margin-bottom: 18px;">
        EG • ACADEMIC SMART SUITE MODULE
      </div>
      <h3 style="font-family: 'Playfair Display', 'Georgia', serif; font-size: 21px; font-weight: 900; color: #1E3A8A; margin: 0 0 12px 0;">
        ${title} Workspace Outputs
      </h3>
      <div style="display: flex; flex-direction: column; gap: 18px; font-family: 'Inter', sans-serif;">
    `;

    content.forEach((item, idx) => {
      if (item.type === 'heading' && idx > 0) {
        adaptiveHTML += `
          <div style="font-size: 14px; font-weight: 850; color: #1E3A8A; font-family: 'Playfair Display', Georgia, serif; border-bottom: 1px solid #DFBA6B; padding-bottom: 4px; margin-top: 10px;">
            ${item.text}
          </div>
        `;
      } else if (item.type === 'subheading') {
        adaptiveHTML += `
          <div style="font-size: 11.5px; font-weight: 700; color: #DFBA6B; text-transform: uppercase; letter-spacing: 0.5px;">
            ${item.text}
          </div>
        `;
      } else if (item.type === 'text' && item.text) {
        if (item.text.startsWith('•') || item.text.startsWith('-')) {
          adaptiveHTML += `
            <div style="font-size: 11.5px; color: #374151; padding-left: 10px; line-height: 1.5;">
              ${item.text}
            </div>
          `;
        } else {
          adaptiveHTML += `
            <div style="background: white; border: 1.2px solid #E6DFD5; border-radius: 10px; padding: 12px 16px; border-left: 3.5px solid #0F172A; font-size: 11px; color: #2D2525; line-height: 1.6; text-align: justify; box-shadow: 0 2px 4px rgba(0,0,0,0.01);">
              ${item.text}
            </div>
          `;
        }
      } else if (item.type === 'blankLines' && item.count) {
        for (let l = 0; l < (item.count || 2); l++) {
          adaptiveHTML += `<div style="border-bottom: 1.2px dotted #B8A6A6; height: 16px; margin-bottom: 8px;"></div>`;
        }
      }
    });

    adaptiveHTML += `</div>`;
    pages.push({ title: 'Workspace Output', elementsHTML: adaptiveHTML, showFooterPageNum: true });

  } else {
    // --- DISTRIBUTE BUDGETED BLOCK STREAM OVER A4 PAGES ---
    let currentPageHTML = elegantHeaderHTML;
    let currentPageHeight = 0;
    const pageHeightLimit = 860; // Max pixels inside 1130 total page height

    blocks.forEach((block) => {
      if (currentPageHeight + block.estimatedHeight > pageHeightLimit) {
        pages.push({
          title: topic,
          elementsHTML: currentPageHTML,
          showFooterPageNum: true
        });
        
        currentPageHTML = elegantHeaderHTML + block.html;
        currentPageHeight = block.estimatedHeight;
      } else {
        currentPageHTML += block.html;
        currentPageHeight += block.estimatedHeight;
      }
    });

    if (currentPageHeight > 0) {
      pages.push({
        title: topic,
        elementsHTML: currentPageHTML,
        showFooterPageNum: true
      });
    }
  }

  // BUILD THE RENDERED PAGES COLLECTION TO HIDDEN STAGE
  const pageElements: HTMLDivElement[] = [];
  const countTotalPages = pages.length;

  pages.forEach((pageItem, index) => {
    const isCover = pageItem.title === 'Cover Page';
    const pageDiv = document.createElement('div');
    pageDiv.className = 'page-render-unit';
    pageDiv.style.width = '800px';
    pageDiv.style.height = '1130px'; 
    pageDiv.style.background = isCover ? '#0F172A' : '#FCFAF7'; // Perfect edge-to-edge matching background!
    pageDiv.style.padding = isCover ? '0' : '55px 50px'; // Escape any boundaries for cover page
    pageDiv.style.boxSizing = 'border-box';
    pageDiv.style.fontFamily = isUrdu ? "'Noto Naskh Arabic', 'Inter', sans-serif" : "'Inter', system-ui, sans-serif";
    pageDiv.style.display = 'flex';
    pageDiv.style.flexDirection = 'column';
    pageDiv.style.justifyContent = 'space-between';
    pageDiv.style.border = isCover ? 'none' : '1px solid #E2E8F0';
    pageDiv.style.position = 'relative';

    const footerText = isUrdu ? "صرف کورس ورک کے خفیہ استعمال کے لیے" : "EDUGEN INTELLIGENCE SYSTEM • UNIFIED ENGINE V5.0";
    const indicatorStr = `Page ${index + 1}`;

    pageDiv.innerHTML = `
      <!-- Page Content body -->
      <div style="flex-grow: 1; ${isCover ? 'height: 100%; display: flex; flex-direction: column;' : ''}">
        ${pageItem.elementsHTML}
      </div>

      <!-- Perfect portrait page footer match -->
      ${pageItem.showFooterPageNum !== false ? `
        <div style="border-top: 1.5px solid #DFBA6B; padding-top: 10px; margin-top: 15px; display: flex; justify-content: space-between; align-items: center; font-family: 'Playfair Display', Georgia, serif; font-style: italic;">
          <!-- Left branded info -->
          <div style="font-size: 10.5px; font-weight: 700; color: #1E3A8A; letter-spacing: 0.5px;">
            ${footerText}
          </div>

          <!-- Right page count indicator -->
          <div style="font-size: 11px; font-weight: 800; color: #1E3A8A;">
            ${indicatorStr}
          </div>
        </div>
      ` : ''}
    `;

    container.appendChild(pageDiv);
    pageElements.push(pageDiv);
  });

  const removedSheets: { node: HTMLStyleElement | HTMLLinkElement; parent: Node; nextSibling: Node | null }[] = [];
  try {
    // Temporarily remove non-essential stylesheets (like Tailwind v4 styles containing oklch)
    // which html2canvas fails to parse even when disabled. We keep Google Fonts stylesheets intact.
    document.querySelectorAll('style, link[rel="stylesheet"]').forEach((node) => {
      const el = node as HTMLStyleElement | HTMLLinkElement;
      if (el instanceof HTMLLinkElement && el.href && (el.href.includes('fonts.googleapis.com') || el.href.includes('fonts.gstatic.com'))) {
        return;
      }
      if (el.parentNode) {
        removedSheets.push({
          node: el,
          parent: el.parentNode,
          nextSibling: el.nextSibling
        });
        el.parentNode.removeChild(el);
      }
    });

    const doc = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4'
    });

    for (let pageIdx = 0; pageIdx < pageElements.length; pageIdx++) {
      const activeDiv = pageElements[pageIdx];
      
      if (pageIdx > 0) {
        doc.addPage();
      }

      const canvas = await html2canvas(activeDiv, {
        scale: 2.2, 
        useCORS: true,
        backgroundColor: '#FCFAF7',
        width: 800,
        height: 1130,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      doc.addImage(imgData, 'JPEG', 0, 0, 210, 297); 
    }

    const dStamp = new Date().toLocaleDateString('en-GB').replace(/\//g, '');
    const cleanTitle = title.replace(/\s+/g, '_');
    const finalFilename = `EduGen_Sheet_${cleanTitle}_${dStamp}.pdf`;

    doc.save(finalFilename);
  } catch (err) {
    console.error("Document portrait export engine layout error:", err);
  } finally {
    // Restore the temporarily removed stylesheets in their original position
    removedSheets.forEach(({ node, parent, nextSibling }) => {
      try {
        if (nextSibling && nextSibling.parentNode === parent) {
          parent.insertBefore(node, nextSibling);
        } else {
          parent.appendChild(node);
        }
      } catch (restoreErr) {
        try {
          parent.appendChild(node);
        } catch (e) {}
      }
    });

    // Remove temporary rendering divs
    if (container.parentNode) container.parentNode.removeChild(container);
    if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
  }
};
