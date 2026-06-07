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
    backdrop.style.backgroundColor = 'rgba(6, 78, 59, 0.4)';
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
    card.style.boxShadow = '0 25px 50px -12px rgba(6, 78, 59, 0.15), 0 0 0 1px rgba(0, 0, 0, 0.03)';
    card.style.width = '100%';
    card.style.maxWidth = '500px';
    card.style.padding = '28px';
    card.style.transform = 'translateY(15px) scale(0.96)';
    card.style.transition = 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease-out';
    card.style.opacity = '0';
    card.style.boxSizing = 'border-box';
    card.style.textAlign = 'center';

    card.innerHTML = `
      <div style="width: 56px; height: 56px; background: #E6F7F0; border-radius: 18px; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px auto; border: 1px solid #A7F3D0;">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
      </div>

      <h3 style="font-size: 19px; font-weight: 800; color: #064E3B; margin: 0 0 4px 0; letter-spacing: -0.02em;">
        Deck Slides Export Format
      </h3>
      <p style="font-size: 14px; font-weight: bold; color: #059669; margin: 0 0 12px 0;">
        سلائیڈز پی ڈی ایف ڈاؤن لوڈ کرنے کا طریقہ منتخب کریں
      </p>
      <p style="font-size: 13px; color: #374151; margin: 0 0 20px 0; line-height: 1.5; font-weight: 500;">
        Choose whether to export this dynamic learning slide deck with integrated answers or as an unsolved student worksheet.
      </p>

      <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px; text-align: left;">
        <!-- Option 1: Solved -->
        <button id="modal-btn-solved" style="display: flex; align-items: flex-start; gap: 14px; padding: 14px 16px; border-radius: 14px; border: 2px solid #059669; background: linear-gradient(135deg, #E6F7F0 0%, #FFFFFF 100%); cursor: pointer; text-align: left; transition: all 0.2s ease; width: 100%; box-sizing: border-box; outline: none;">
          <div style="width: 20px; height: 20px; border-radius: 50%; background: #059669; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <div style="flex-grow: 1;">
            <div style="font-size: 14px; font-weight: 800; color: #064E3B; display: flex; align-items: center; gap: 6px;">
              <span>Solved Version (حل شدہ سلائیڈز)</span>
              <span style="font-size: 10px; padding: 1px 6px; background: #D1FAE5; color: #047857; border-radius: 10px; font-weight: bold;">Default</span>
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
            <div style="font-size: 14px; font-weight: 800; color: #064E3B;">
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
        <button id="modal-btn-confirm" style="height: 40px; padding: 0 24px; border-radius: 10px; border: none; background: #059669; font-size: 13px; font-weight: bold; color: #FFFFFF; cursor: pointer; transition: all 0.15s; box-shadow: 0 4px 10px rgba(5, 150, 105, 0.2); outline: none;">
          Export Deck
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
        solvedBtn.style.borderColor = '#059669';
        solvedBtn.style.background = 'linear-gradient(135deg, #E6F7F0 0%, #FFFFFF 100%)';
        const circle = solvedBtn.querySelector('div') as HTMLDivElement;
        circle.style.background = '#059669';
        circle.style.borderColor = '#059669';
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
        unsolvedBtn.style.borderColor = '#059669';
        unsolvedBtn.style.background = 'linear-gradient(135deg, #E6F7F0 0%, #FFFFFF 100%)';
        const uncircle = unsolvedBtn.querySelector('div') as HTMLDivElement;
        uncircle.style.borderColor = '#059669';
        uncircle.style.background = '#059669';
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
          // Fallback single letter matches
          currentMCQ.correctAnswer = text;
        } else {
          // Maybe part of question
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
  overlay.style.backgroundColor = 'rgba(6, 78, 59, 0.5)';
  overlay.style.backdropFilter = 'blur(10px)';
  overlay.style.zIndex = '9999999';
  overlay.style.display = 'flex';
  overlay.style.justifyContent = 'center';
  overlay.style.alignItems = 'center';
  overlay.style.color = '#ffffff';
  overlay.style.fontFamily = "system-ui, -apple-system, 'Inter', sans-serif";

  const loadingTitle = isUrdu ? "پیش رفت جاری ہے..." : "Generating Document...";
  const loadingSub = isUrdu ? "آپ کا پورٹریٹ پی ڈی ایف رپورٹ تیار کیا جا رہا ہے۔ براے مہربانی انتظار کریں۔" : "Converting document pages to PDF. Please do not close this window.";

  overlay.innerHTML = `
    <div style="background: white; color: #1E293B; padding: 2.5rem; border-radius: 20px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.15); text-align: center; max-width: 400px; width: 100%; border: 1px solid #e1f5fe; display: flex; flex-direction: column; align-items: center; gap: 1rem;">
      <div style="position: relative; width: 80px; height: 80px;">
        <div style="box-sizing: border-box; display: block; position: absolute; width: 64px; height: 64px; margin: 8px; border: 6px solid #059669; border-radius: 50%; animation: slide-ring-spin 1.2s linear infinite; border-color: #059669 transparent #10B981 transparent;"></div>
      </div>
      <h3 style="font-size: 1.25rem; font-weight: 800; color: #064E3B; margin: 0.5rem 0 0.25rem 0;">${loadingTitle}</h3>
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
  if (calculatedMarks === 0) calculatedMarks = 15; // default
  const totalMarks = mergedOptions.totalMarks || `${calculatedMarks} Marks`;

  // Filter out custom SVGs or images if passed in images list
  const selectedImages = content.filter(item => item.type === 'image' && item.text);

  // Create temporary off-screen container for rendering
  const container = document.createElement('div');
  container.id = 'report-temp-render-container';
  container.style.position = 'fixed';
  container.style.top = '-9999px';
  container.style.left = '-9999px';
  container.style.width = '800px'; // Math perfect portrait bounds matching A4 ratio
  container.style.backgroundColor = '#FAFDFB';
  container.style.boxSizing = 'border-box';

  document.body.appendChild(container);

  // Embed fonts
  const fontTag = document.createElement('link');
  fontTag.rel = 'stylesheet';
  fontTag.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Noto+Naskh+Arabic:wght@400;700&display=swap';
  document.head.appendChild(fontTag);

  // Wait for font load
  await document.fonts.ready;
  await new Promise(r => setTimeout(r, 600));

  type DocumentPageLayout = {
    title: string;
    elementsHTML: string;
    showFooterPageNum?: boolean;
  };

  const pages: DocumentPageLayout[] = [];

  // --- PAGE 1: COVER PAGE ---
  const coverHTML = `
    <div style="position: absolute; top: 0; left: 0; width: 500px; height: 350px; background: #1B4332; clip-path: polygon(0 0, 100% 0, 0 100%);"></div>
    <div style="position: absolute; top: 40px; right: 0; width: 190px; height: 32px; background: #19CE86; z-index: 1;"></div>
    <div style="position: absolute; top: 105px; right: 0; width: 50px; height: 160px; background: #19CE86; z-index: 1;"></div>
    
    <div style="position: absolute; top: 75px; right: 60px; text-align: right; font-family: 'Inter', sans-serif; z-index: 5;">
      <div style="display: inline-flex; flex-direction: column; align-items: flex-end;">
        <span style="font-size: 28px; color: #1B4332; font-weight: 900; line-height: 1;">❖</span>
        <span style="font-size: 16px; font-weight: 850; color: #1B4332; tracking: -0.5px; margin-top: 4px;">EduGen AI</span>
      </div>
    </div>

    <div style="position: absolute; top: 310px; left: 60px; right: 60px; font-family: 'Inter', sans-serif; text-align: left; z-index: 4;">
      <h1 style="font-size: 44px; font-weight: 900; color: #1B4332; line-height: 1.15; margin: 0 0 15px 0; tracking: -1px; width: 90%;">
        Accelerating Intelligence & Learning
      </h1>
      <p style="font-size: 16px; font-weight: 700; color: #1B4332; margin: 0 0 45px 0; opacity: 0.85;">
        ${topic} Assignment & Lesson
      </p>

      <div style="font-family: 'Inter', sans-serif; margin-bottom: 45px;">
        <div style="font-size: 14px; font-weight: 800; color: #1E3A8A; margin-bottom: 2px;">EduGen App Administration</div>
        <div style="font-size: 12px; font-weight: 600; color: #475569; line-height: 1.5;">
          Global Virtual Campus<br>
          info@edugenn.lovable.app<br>
          edugenn.lovable.app<br>
          +92 300 0000000
        </div>
      </div>

      <!-- KEY LEARNING MODULES block from Screenshot 1 -->
      <div style="background: #EAFBF4; border-left: 4px solid #19CE86; padding: 20px 24px; border-radius: 4px 16px 16px 4px; max-width: 320px; box-shadow: 0 10px 25px -10px rgba(27, 67, 50, 0.08); margin-bottom: 60px;">
        <div style="font-size: 12px; font-weight: 850; color: #064E3B; margin-bottom: 10px; tracking: 0.5px; text-transform: uppercase;">Key Learning Modules:</div>
        <ul style="margin: 0; padding-left: 14px; font-size: 12px; font-weight: 700; color: #1B4332; line-height: 1.6; list-style-type: disc;">
          <li>Ethics in Design & AI</li>
          <li>Machine Learning Architectures</li>
          <li>Real-world Application Scaling</li>
        </ul>
      </div>
    </div>

    <!-- Bottom Left Disclaimer -->
    <div style="position: absolute; bottom: 50px; left: 60px; right: 180px; font-size: 10px; font-weight: 500; color: rgba(27, 67, 50, 0.5); line-height: 1.5; font-family: 'Inter', sans-serif; text-align: left;">
      This document contains confidential educational and proprietary information intended exclusively for the EduGen student community.
    </div>

    <div style="position: absolute; bottom: 0; right: 0; width: 400px; height: 230px; background: #1B4332; clip-path: polygon(100% 0, 100% 100%, 0 100%);"></div>
  `;
  pages.push({ title: 'Cover Page', elementsHTML: coverHTML, showFooterPageNum: false });

  // --- PAGE 2: ASSESSMENT SHEET / WORKSHEET (Matches Screenshot 2) ---
  const headerHTML = `
    <!-- Forest Green header bar with logo -->
    <div style="background: #1B4332; border-radius: 12px; padding: 22px 26px; color: white; display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; font-family: 'Inter', sans-serif;">
      <div style="display: flex; flex-direction: column;">
        <div style="font-size: 26px; font-weight: 900; letter-spacing: -0.5px; display: flex; align-items: center; gap: 6px; line-height: 1;">
          <span>EduGen</span>
        </div>
        <div style="font-size: 10px; font-weight: 800; margin-top: 4px; tracking: 1.2px; opacity: 0.8; text-transform: uppercase;">
          AI Assessment Sheet
        </div>
      </div>
      <div style="text-align: right; font-size: 11px; font-weight: 600; opacity: 0.95; line-height: 1.5;">
        Subject: <strong>${topic}</strong><br>
        App: <strong>edugenn.lovable.app</strong>
      </div>
    </div>

    <!-- Metadata Grid (Table style) -->
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); border: 1.5px solid #E2E8F0; border-radius: 10px; overflow: hidden; margin-bottom: 24px; font-family: 'Inter', sans-serif; background: white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.01);">
      <div style="border-right: 1.5px solid #E2E8F0; border-bottom: 1.5px solid #E2E8F0; padding: 12px 14px;">
        <div style="font-size: 9px; font-weight: 850; color: #64748B; text-transform: uppercase; margin-bottom: 3px; tracking: 0.5px;">Student Target</div>
        <div style="font-size: 12px; font-weight: 800; color: #1B4332;">${student}</div>
      </div>
      <div style="border-right: 1.5px solid #E2E8F0; border-bottom: 1.5px solid #E2E8F0; padding: 12px 14px;">
        <div style="font-size: 9px; font-weight: 850; color: #64748B; text-transform: uppercase; margin-bottom: 3px; tracking: 0.5px;">Class Level</div>
        <div style="font-size: 12px; font-weight: 800; color: #1B4332; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${classLevel}</div>
      </div>
      <div style="border-bottom: 1.5px solid #E2E8F0; padding: 12px 14px;">
        <div style="font-size: 9px; font-weight: 850; color: #64748B; text-transform: uppercase; margin-bottom: 3px; tracking: 0.5px;">Language</div>
        <div style="font-size: 12px; font-weight: 800; color: #1B4332;">${language}</div>
      </div>
      <div style="border-right: 1.5px solid #E2E8F0; padding: 12px 14px;">
        <div style="font-size: 9px; font-weight: 850; color: #64748B; text-transform: uppercase; margin-bottom: 3px; tracking: 0.5px;">Total Marks</div>
        <div style="font-size: 12px; font-weight: 800; color: #1B4332;">${totalMarks}</div>
      </div>
      <div style="border-right: 1.5px solid #E2E8F0; padding: 12px 14px;">
        <div style="font-size: 9px; font-weight: 850; color: #64748B; text-transform: uppercase; margin-bottom: 3px; tracking: 0.5px;">Time Allowed</div>
        <div style="font-size: 12px; font-weight: 800; color: #1B4332;">${timeAllowed}</div>
      </div>
      <div style="padding: 12px 14px;">
        <div style="font-size: 9px; font-weight: 850; color: #64748B; text-transform: uppercase; margin-bottom: 3px; tracking: 0.5px;">Difficulty Range</div>
        <div style="font-size: 12px; font-weight: 800; color: #1B4332;">Mixed (Core Foundation)</div>
      </div>
    </div>

    <!-- Instructions banner -->
    <div style="background: #EAFBF4; border-left: 4px solid #19CE86; border-radius: 6px; padding: 14px 18px; margin-bottom: 24px; font-family: 'Inter', sans-serif; font-size: 11.5px; color: #064E3B; line-height: 1.6; font-weight: 600; text-align: left;">
      <span style="color: #19CE86; font-weight: 900; margin-right: 4px;">Instructions:</span> Read all questions carefully. Formulate structured arguments. Grading will be based on key concepts, technical relevance, and clarity.
    </div>
  `;

  // Determine what type of sheet to build
  const hasExamItems = parsed.mcqs.length > 0 || parsed.shorts.length > 0 || parsed.longs.length > 0;

  if (hasExamItems) {
    // QUESTION WORKSHEET SHEET
    let worksheetHTML = headerHTML;
    worksheetHTML += `
      <div style="font-family: 'Inter', sans-serif;">
        <h2 style="font-size: 14px; font-weight: 900; color: #1B4332; border-bottom: 1.5px solid #1B4332; padding-bottom: 6px; margin: 0 0 16px 0; tracking: 0.5px; text-transform: uppercase;">
          SECTION B: SHORT QUESTIONS
        </h2>
        <div style="display: flex; flex-direction: column; gap: 14px;">
    `;

    // Add short questions inside the assessment sheet
    const displayShorts = parsed.shorts.length > 0 ? parsed.shorts : [
      { question: "What is Artificial Intelligence (AI), and how does it differ from human intelligence?", modelAnswer: "" },
      { question: "What are some common applications of AI in everyday life?", modelAnswer: "" },
      { question: "How does machine learning, a subset of AI, enable computers to learn from data?", modelAnswer: "" },
      { question: "What are some potential risks and challenges associated with the development and use of AI?", modelAnswer: "" },
      { question: "What role do data and algorithms play in the development of AI systems?", modelAnswer: "" }
    ];

    displayShorts.slice(0, 5).forEach((q, idx) => {
      const qStr = String(idx + 1).padStart(2, '0');
      const diffTag = idx % 3 === 0 ? 'Difficulty: High' : idx % 3 === 1 ? 'Difficulty: Medium' : 'Difficulty: Easy';
      const diffBg = idx % 3 === 0 ? '#FEF2F2' : idx % 3 === 1 ? '#FFFBEB' : '#ECFDF5';
      const diffColor = idx % 3 === 0 ? '#991B1B' : idx % 3 === 1 ? '#92400E' : '#065F46';

      worksheetHTML += `
        <!-- Question Unit Card -->
        <div style="background: white; border: 1.5px solid #E2E8F0; border-radius: 12px; padding: 14px 18px; box-shadow: 0 2px 4px rgba(0,0,0,0.01); border-left: 3.5px solid #1B4332;">
          <div style="font-size: 12.5px; font-weight: 700; color: #1B4332; line-height: 1.5; margin-bottom: 10px; text-align: left;">
            <strong style="color: #1B4332; margin-right: 6px;">Q ${qStr}</strong> ${q.question}
          </div>
          <div style="display: flex; gap: 8px; align-items: center; justify-content: flex-start; margin-bottom: ${!isSolved ? '35px' : '0px'};">
            <span style="background: ${diffBg}; color: ${diffColor}; font-size: 10px; font-weight: 700; padding: 3px 10px; border-radius: 6px;">${diffTag}</span>
            <span style="background: #EEF2FF; color: #3730A3; font-size: 10px; font-weight: 700; padding: 3px 10px; border-radius: 6px;">Topic: ${topic}</span>
            <span style="margin-left: auto; color: #1B4332; font-weight: 800; font-size: 11px;">3 Marks</span>
          </div>
          ${!isSolved ? `
            <!-- Space for student write in -->
            <div style="border-bottom: 1.2px dotted #CBD5E1; height: 16px; margin-bottom: 10px;"></div>
            <div style="border-bottom: 1.2px dotted #CBD5E1; height: 16px; margin-bottom: 10px;"></div>
            <div style="border-bottom: 1.2px dotted #CBD5E1; height: 16px;"></div>
          ` : ''}
        </div>
      `;
    });

    worksheetHTML += `
        </div>
      </div>
    `;
    pages.push({ title: 'Assessment Sheet', elementsHTML: worksheetHTML, showFooterPageNum: true });

    // --- PAGE 3: ANSWER KEY & RUBRICS (Matches Screenshot 3) ---
    if (isSolved) {
      let answersHTML = `
        <!-- Answer key header bar bar -->
        <div style="background: #1B4332; border-radius: 12px; padding: 22px 26px; color: white; display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; font-family: 'Inter', sans-serif;">
          <div style="display: flex; flex-direction: column;">
            <div style="font-size: 26px; font-weight: 900; letter-spacing: -0.5px; display: flex; align-items: center; gap: 6px; line-height: 1;">
              <span>EduGen AI</span>
            </div>
            <div style="font-size: 10px; font-weight: 850; margin-top: 4px; tracking: 1.2px; opacity: 0.8; text-transform: uppercase;">
              Answer Key & Rubrics
            </div>
          </div>
          <div style="text-align: right; font-size: 11px; font-weight: 800; color: #19CE86; tracking: 0.5px; text-transform: uppercase;">
            Confidential Teacher Guidelines
          </div>
        </div>

        <div style="font-family: 'Inter', sans-serif;">
          <h2 style="font-size: 13px; font-weight: 900; color: #1B4332; tracking: 1px; margin: 0 0 16px 0; text-transform: uppercase; border-bottom: 1.5px solid #E2E8F0; padding-bottom: 8px;">
            Detailed Scoring Scheme
          </h2>
          <div style="display: flex; flex-direction: column; gap: 14px;">
      `;

      displayShorts.slice(0, 5).forEach((q, idx) => {
        const qStr = String(idx + 1).padStart(2, '0');
        const defaultAnswers = [
          "Artificial Intelligence (AI) refers to the development of computer systems that can perform tasks that typically require human intelligence, such as learning, problem-solving, and decision-making. Unlike human intelligence, AI is based on algorithms and data, and it can process information much faster and more accurately than humans. However, AI lacks the creativity, emotions, and common sense that humans take for granted.",
          "AI is used in various aspects of our daily lives, including virtual assistants like Siri and Alexa, image recognition software, and self-driving cars. Additionally, AI-powered chatbots are used in customer service, and AI algorithms are used to recommend products on e-commerce websites. These applications have made our lives more convenient and efficient.",
          "Machine learning is a type of AI that allows computers to learn from data without being explicitly programmed. It involves training algorithms on large datasets, which enables the computer to identify patterns and make predictions or decisions. Through machine learning, computers can improve their performance on a task over time, much like humans learn from experience.",
          "The development and use of AI pose several risks and challenges, including job displacement, bias in decision-making, and potential cybersecurity threats. Additionally, there are concerns about the impact of AI on society, such as the potential for AI to exacerbate existing social inequalities. As AI becomes more pervasive, it is essential to address these challenges and ensure that AI is developed and used responsibly.",
          "Data and algorithms are the foundation of AI systems, as they enable computers to learn, reason, and interact with the world. High-quality data is necessary to train AI algorithms, which are sets of instructions that enable computers to perform specific tasks. The quality of the data and the algorithms used can significantly impact the performance and accuracy of an AI system."
        ];
        const mAnswer = q.modelAnswer || defaultAnswers[idx];

        answersHTML += `
          <!-- Answer Unit Card identical to Screenshot 3 -->
          <div style="background: white; border: 1.5px solid #E2E8F0; border-radius: 12px; padding: 14px 18px; border-left: 3.5px solid #19CE86; box-shadow: 0 2px 4px rgba(0,0,0,0.01);">
            <div style="font-size: 13px; font-weight: 850; color: #064E3B; margin-bottom: 6px;">
              Q${idx + 1}: ${q.question.split('?')[0]}
            </div>
            <div style="background: #F4FBF9; border: 1.2px solid #E6F4ED; border-radius: 8px; padding: 12px 14px; font-size: 11.5px; color: #374151; line-height: 1.6; font-weight: 500; text-align: justify;">
              <strong style="color: #064E3B; display: block; margin-bottom: 4px; text-transform: uppercase; font-size: 10px; tracking: 0.5px;">Model Answer:</strong>
              ${mAnswer}
            </div>
          </div>
        `;
      });

      answersHTML += `
          </div>
        </div>
      `;
      pages.push({ title: 'Answer Key', elementsHTML: answersHTML, showFooterPageNum: true });
    }
  } else {
    // COMPLETED LESSON / EXPLAINER GUIDE (Topic Explainer output)
    let lessonPagesHTML = headerHTML;
    
    // Deconstruct explanation details to vertical A4 sections
    const blocks = parsePDFContent(content);
    
    lessonPagesHTML += `
      <div style="font-family: 'Inter', sans-serif;">
        <h2 style="font-size: 15px; font-weight: 900; color: #1B4332; border-bottom: 2px solid #1B4332; padding-bottom: 6px; margin: 0 0 16px 0; uppercase; tracking: 0.5px;">
          Active Lesson & Concepts Review
        </h2>
        
        <div style="display: flex; flex-direction: column; gap: 20px;">
          <!-- Description Block -->
          <div style="background: white; border: 1px solid #E2E8F0; border-radius: 12px; padding: 16px 20px; border-left: 4.5px solid #1B4332;">
            <div style="font-weight: 850; color: #1B4332; font-size: 11px; text-transform: uppercase; margin-bottom: 6px; tracking: 0.5px;">Executive Summary:</div>
            <div style="font-size: 12px; color: #475569; line-height: 1.6; font-weight: 500; text-align: justify;">
              ${content.find(c => c.type === 'text' && !c.text?.startsWith('•') && !c.text?.startsWith('[!'))?.text || 'Comprehensive learning review.'}
            </div>
          </div>
    `;

    // Foundation key bullets
    const bullets = content.filter(c => c.type === 'text' && c.text?.startsWith('•')).map(c => c.text?.replace('•', '').trim());
    if (bullets.length > 0) {
      lessonPagesHTML += `
        <!-- Foundations -->
        <div style="background: white; border: 1px solid #E2E8F0; border-radius: 12px; padding: 16px 20px; border-left: 4.5px solid #1B4332;">
          <div style="font-weight: 850; color: #1B4332; font-size: 11px; text-transform: uppercase; margin-bottom: 10px; tracking: 0.5px;">Essential Foundations:</div>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            ${bullets.map(b => `
              <div style="font-size: 11.5px; color: #374151; font-weight: 600; display: flex; align-items: flex-start; gap: 8px;">
                <span style="color: #19CE86;">✔</span>
                <span>${b}</span>
              </div>
            `).join('')}
          </div>
        </div>
      `;
    }

    // Embed Pexels live images selected
    if (selectedImages.length > 0) {
      lessonPagesHTML += `
        <!-- Visual Aids Panel -->
        <div style="border: 1px solid #E2E8F0; border-radius: 12px; padding: 16px; background: white; text-align: center;">
          <div style="font-weight: 800; color: #1B4332; font-size: 11px; text-transform: uppercase; margin-bottom: 12px; tracking: 0.5px; text-align: left;">Live Visual Reference:</div>
          <div style="display: flex; justify-content: center; align-items: center; max-height: 250px; overflow: hidden; border-radius: 8px; border: 1.2px solid #E6F4ED; background: #fafdfc;">
            <img src="${selectedImages[0].text}" style="width: 100%; max-height: 250px; object-fit: contain;" />
          </div>
          <p style="font-size: 10px; font-weight: 700; color: #059669; margin: 8px 0 0 0;">📸 Pexels Live Academic Schematic Reference Picture</p>
        </div>
      `;
    }

    lessonPagesHTML += `
        </div>
      </div>
    `;

    pages.push({ title: 'Lesson Details', elementsHTML: lessonPagesHTML, showFooterPageNum: true });
  }

  // BUILD THE RENDERED PAGES COLLECTION TO HIDDEN STAGE
  const pageElements: HTMLDivElement[] = [];
  const countTotalPages = pages.length;

  pages.forEach((pageItem, index) => {
    const pageDiv = document.createElement('div');
    pageDiv.className = 'page-render-unit';
    pageDiv.style.width = '800px';
    pageDiv.style.height = '1130px'; // Math perfect vertical portrait aspect ratio matching A4 unit
    pageDiv.style.background = '#FAFDFB';
    pageDiv.style.padding = '55px 50px';
    pageDiv.style.boxSizing = 'border-box';
    pageDiv.style.fontFamily = isUrdu ? "'Noto Naskh Arabic', 'Inter', sans-serif" : "'Inter', system-ui, sans-serif";
    pageDiv.style.display = 'flex';
    pageDiv.style.flexDirection = 'column';
    pageDiv.style.justifyContent = 'space-between';
    pageDiv.style.border = '1px solid #E2E8F0';
    pageDiv.style.position = 'relative';

    const footerText = isUrdu ? "صرف کورس ورک کے خفیہ استعمال کے لیے" : "CONFIDENTIAL STUDENT USE ONLY";
    const indicatorStr = `${String(index + 1).padStart(2, '0')} / ${String(countTotalPages).padStart(2, '0')}`;

    pageDiv.innerHTML = `
      <!-- Page Content body -->
      <div style="flex-grow: 1;">
        ${pageItem.elementsHTML}
      </div>

      <!-- Perfect portrait page footer -->
      ${pageItem.showFooterPageNum !== false ? `
        <div style="border-top: 1.5px solid #E6F4ED; padding-top: 12px; margin-top: 12px; display: flex; justify-content: space-between; align-items: center; font-family: 'Inter', sans-serif;">
          <!-- Left branded info -->
          <div style="display: flex; align-items: center; gap: 6px;">
            <div style="background-color: #19CE86; width: 22px; height: 22px; border-radius: 5px; display: flex; justify-content: center; align-items: center; font-size: 10px; font-weight: 900; color: white;">EG</div>
            <span style="font-size: 11.5px; font-weight: 800; color: #064E3B; letter-spacing: -0.2px;">edugenn.lovable.app</span>
          </div>

          <!-- Center privacy notice -->
          <div style="font-size: 9px; font-weight: 850; color: #94A3B8; letter-spacing: 1.2px; text-transform: uppercase;">
            ${footerText}
          </div>

          <!-- Right page count indicator -->
          <div style="font-size: 11.5px; font-weight: 800; color: #059669; letter-spacing: -0.2px;">
            ${indicatorStr}
          </div>
        </div>
      ` : ''}
    `;

    container.appendChild(pageDiv);
    pageElements.push(pageDiv);
  });

  try {
    const doc = new jsPDF({
      orientation: 'p',
      unit: 'mm',
      format: 'a4'
    });

    // Capture each page div separately and write directly on a portrait PDF page!
    for (let pageIdx = 0; pageIdx < pageElements.length; pageIdx++) {
      const activeDiv = pageElements[pageIdx];
      
      if (pageIdx > 0) {
        doc.addPage();
      }

      const canvas = await html2canvas(activeDiv, {
        scale: 2.2, // Crystal sharp high-density outputs
        useCORS: true,
        backgroundColor: '#FAFDFB',
        width: 800,
        height: 1130,
        logging: false,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      doc.addImage(imgData, 'JPEG', 0, 0, 210, 297); // 210mm x 297mm matches A4 portrait exactly
    }

    const dStamp = new Date().toLocaleDateString('en-GB').replace(/\//g, '');
    const cleanTitle = title.replace(/\s+/g, '_');
    const finalFilename = `EduGen_Sheet_${cleanTitle}_${dStamp}.pdf`;

    doc.save(finalFilename);
  } catch (err) {
    console.error("Document portrait export engine layout error:", err);
  } finally {
    // Remove temporary rendering divs in all cases
    if (container.parentNode) container.parentNode.removeChild(container);
    if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
  }
};
