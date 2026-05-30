import jsPDF from 'jspdf';
import 'jspdf-autotable';
import html2canvas from 'html2canvas';

export interface PDFItem {
  type: 'heading' | 'subheading' | 'text' | 'blankLines';
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

// ━━━ COLORS ━━━
const COLORS = {
  darkNavy: '#1E1B4B',       // header/footer background
  primaryIndigo: '#4F46E5',  // main accent
  midIndigo: '#6366F1',      // secondary accent
  lightIndigo: '#818CF8',    // gradient end
  indigoTint: '#EEF2FF',     // card backgrounds
  indigoBorder: '#C7D2FE',   // card borders
  skyBlue: '#0EA5E9',        // Section B accent
  skyTint: '#F0F9FF',        // Section B card bg
  emerald: '#10B981',        // Section C / Long Q accent
  emeraldTint: '#F0FDF4',    // Section C card bg
  white: '#FFFFFF',          // page background
  darkText: '#0F172A',       // question text
  mediumText: '#475569',     // body text
  mutedText: '#94A3B8',      // labels, hints
};

// Convert Hex to RGB
function hexToRgb(hex: string): [number, number, number] {
  const cleanHex = hex.replace('#', '');
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  return [r, g, b];
}

const setFillColorHex = (doc: jsPDF, hex: string) => {
  const rgb = hexToRgb(hex);
  doc.setFillColor(rgb[0], rgb[1], rgb[2]);
};

const setDrawColorHex = (doc: jsPDF, hex: string) => {
  const rgb = hexToRgb(hex);
  doc.setDrawColor(rgb[0], rgb[1], rgb[2]);
};

const setTextColorHex = (doc: jsPDF, hex: string) => {
  const rgb = hexToRgb(hex);
  doc.setTextColor(rgb[0], rgb[1], rgb[2]);
};

// Draw Book + Graduation Cap Icon inside box
function drawLogoIcon(doc: jsPDF, x: number, y: number, w: number, h: number, isDarkBg = false) {
  doc.saveGraphicsState();
  
  if (!isDarkBg) {
    setFillColorHex(doc, COLORS.midIndigo);
    doc.roundedRect(x, y, w, h, 2, 2, 'F');
  } else {
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(x, y, w, h, 2, 2, 'F');
  }

  // Draw white/indigo styled book
  if (isDarkBg) {
    setFillColorHex(doc, COLORS.midIndigo);
  } else {
    doc.setFillColor(255, 255, 255);
  }
  
  // Left page
  doc.rect(x + 1.5, y + 3.5, 3, 5, 'F');
  // Right page
  doc.rect(x + 5.5, y + 3.5, 3, 5, 'F');

  // Spine
  if (isDarkBg) {
    doc.setDrawColor(255, 255, 255);
  } else {
    setDrawColorHex(doc, COLORS.indigoBorder);
  }
  doc.setLineWidth(0.4);
  doc.line(x + 5, y + 3.5, x + 5, y + 8.5);

  // Draw Cap top lid (rhombus)
  if (isDarkBg) {
    setFillColorHex(doc, COLORS.midIndigo);
  } else {
    doc.setFillColor(255, 255, 255);
  }
  // Cap polygon coords
  doc.triangle(x + 5, y + 1.2, x + 2.5, y + 2.2, x + 7.5, y + 2.2, 'F');
  doc.triangle(x + 5, y + 3.2, x + 2.5, y + 2.2, x + 7.5, y + 2.2, 'F');

  doc.restoreGraphicsState();
}

// ━━━ 1. DARK TOP HEADER (every regular page) ━━━
function drawDarkHeader(doc: jsPDF, title: string, pageNum: number, totalPages: number) {
  doc.saveGraphicsState();

  // Full-width dark rectangle: x=0, y=0, w=210, h=20mm
  setFillColorHex(doc, COLORS.darkNavy);
  doc.rect(0, 0, 210, 20, 'F');

  // LEFT — EduGen Logo and title
  drawLogoIcon(doc, 14, 5, 10, 10, false);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text('EduGen', 26, 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  setTextColorHex(doc, '#A5B4FC');
  doc.text('AI Learning Toolkit', 26, 16);

  // CENTER — Document title and edugen.app URL
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  let truncatedTitle = title.length > 35 ? title.substring(0, 32) + '...' : title;
  doc.text(truncatedTitle, 105, 11, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  setTextColorHex(doc, '#818CF8');
  doc.text('edugen.app', 105, 16, { align: 'center' });

  // RIGHT — Page badge [Page X of Y]
  // fill Box with rgba/solid equivalent #2D2A5E and border #4F46E5
  setFillColorHex(doc, '#2D2A5E');
  setDrawColorHex(doc, COLORS.primaryIndigo);
  doc.setLineWidth(0.176); // 0.5pt
  doc.roundedRect(168, 6, 28, 8, 2, 2, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  setTextColorHex(doc, '#C7D2FE');
  doc.text(`Page ${pageNum} of ${totalPages}`, 182, 12, { align: 'center' });

  // ━━━ y=20mm Gradient Title Band ━━━
  // Simulate gradient with 3 overlapping rects:
  setFillColorHex(doc, '#4F46E5');
  doc.rect(0, 20, 70, 8, 'F');
  setFillColorHex(doc, '#6366F1');
  doc.rect(70, 20, 70, 8, 'F');
  setFillColorHex(doc, '#818CF8');
  doc.rect(140, 20, 70, 8, 'F');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  
  const todayStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  doc.text(`${truncatedTitle}  |  Generated: ${todayStr}`, 14, 25.5);

  doc.restoreGraphicsState();
}

// ━━━ 7. DARK FOOTER (every page) ━━━
function drawDarkFooter(doc: jsPDF) {
  doc.saveGraphicsState();

  const footerY = 277;
  // Draw full-width dark rectangle: x=0, y=277, w=210, h=20mm
  setFillColorHex(doc, COLORS.darkNavy);
  doc.rect(0, footerY, 210, 20, 'F');

  // Thin indigo top line: x=0, y=277, w=210, color=#4F46E5, lineWidth=0.8
  setDrawColorHex(doc, COLORS.primaryIndigo);
  doc.setLineWidth(0.8);
  doc.line(0, footerY, 210, footerY);

  // LEFT — Mini logo
  setFillColorHex(doc, COLORS.midIndigo);
  doc.roundedRect(14, footerY + 7, 5, 5, 1, 1, 'F');
  
  // EduGen label
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  setTextColorHex(doc, '#818CF8');
  doc.text('EduGen', 21.5, footerY + 11);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  setTextColorHex(doc, '#475569');
  doc.text('AI Learning Toolkit', 36, footerY + 11);

  // CENTER — Date
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const hours = String(now.getHours()).padStart(2, '0');
  const mins = String(now.getMinutes()).padStart(2, '0');
  
  setTextColorHex(doc, '#64748B');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Generated: ${day}/${month}/${year} at ${hours}:${mins}`, 105, footerY + 11, { align: 'center' });

  // RIGHT — Confidential
  doc.text('Confidential — Student Use Only', 196, footerY + 11, { align: 'right' });

  doc.restoreGraphicsState();
}

// ━━━ 8. WATERMARKS ━━━
function drawWatermarks(doc: jsPDF) {
  doc.saveGraphicsState();
  const GStateClass = (doc as any).GState || (jsPDF as any).GState;

  if (GStateClass) {
    // 1. DIAGONAL TEXT: 5% opacity, rotation -35deg, size 38 bold, color #6366F1
    doc.setGState(new GStateClass({ opacity: 0.05 }));
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(38);
    const rgb = hexToRgb(COLORS.midIndigo);
    doc.setTextColor(rgb[0], rgb[1], rgb[2]);

    // Draw 3 diagonal lines across the page coordinates
    doc.text("EDUGEN · EDUGEN · EDUGEN", 40, 90, { angle: -35 });
    doc.text("EDUGEN · EDUGEN · EDUGEN", 40, 150, { angle: -35 });
    doc.text("EDUGEN · EDUGEN · EDUGEN", 40, 210, { angle: -35 });

    // 2. CENTER LOGO: 4% opacity, fill, centered (28x28mm centered)
    doc.setGState(new GStateClass({ opacity: 0.04 }));
    setFillColorHex(doc, COLORS.midIndigo);
    doc.roundedRect(91, 134.5, 28, 28, 5, 5, 'F');

    // Text "EduGen" below center logo at y=172
    setTextColorHex(doc, COLORS.midIndigo);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('EduGen', 105, 172, { align: 'center' });
  }

  doc.restoreGraphicsState();
}

// ━━━ 9. EXAM COVER PAGE ━━━
function drawExamCoverPage(doc: jsPDF, options: PDFOptions, title: string) {
  doc.saveGraphicsState();

  // Top 45%: fill=#1E1B4B, Bottom 55%: fill=#FFFFFF
  const topHeight = 297 * 0.45; // 133.65mm
  setFillColorHex(doc, COLORS.darkNavy);
  doc.rect(0, 0, 210, topHeight, 'F');

  // On dark section:
  // EduGen large logo centered inside top dark background
  drawLogoIcon(doc, 97.5, 20, 15, 15, false);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(255, 255, 255);
  doc.text('EduGen', 105, 48, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  setTextColorHex(doc, '#818CF8');
  doc.text('AI Learning Toolkit', 105, 55, { align: 'center' });

  // Indigo divider line
  setDrawColorHex(doc, COLORS.primaryIndigo);
  doc.setLineWidth(0.8);
  doc.line(30, 64, 180, 64);

  // Subtitle/Label on dark part
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(255, 255, 255);
  doc.text("OFFICIAL PRACTICE ASSESSMENT", 105, 75, { align: 'center' });

  // White portion:
  // Subject/Topic: font 20 bold #1E1B4B centered
  setTextColorHex(doc, COLORS.darkNavy);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  const parsedSubject = options.subject || options.topic || title;
  doc.text(parsedSubject.toUpperCase(), 105, topHeight + 20, { align: 'center' });

  // Thin indigo line below
  setDrawColorHex(doc, COLORS.midIndigo);
  doc.setLineWidth(0.5);
  doc.line(60, topHeight + 24, 150, topHeight + 24);

  // Candidate Instructions
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  setTextColorHex(doc, COLORS.darkNavy);
  doc.text('Instructions to Candidate:', 35, topHeight + 38);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  setTextColorHex(doc, COLORS.mediumText);
  doc.text('1. Attempt all questions within the allocated time period.', 35, topHeight + 44);
  doc.text('2. For MCQs, mark your selection by checking the correct circular letter box.', 35, topHeight + 49);
  doc.text('3. Use the styled answer grids and dotted fields to write detailed responses.', 35, topHeight + 54);
  doc.text('4. Review the model key and grading rubric appended to the final section.', 35, topHeight + 59);

  // Information Table with Indigo Accents:
  const tableY = topHeight + 68;
  setFillColorHex(doc, '#FAFBFF');
  setDrawColorHex(doc, COLORS.indigoBorder);
  doc.setLineWidth(0.4);
  doc.roundedRect(30, tableY, 150, 40, 3, 3, 'FD');

  // Internal grid lines
  doc.setLineWidth(0.3);
  setDrawColorHex(doc, '#E2E8F0');
  doc.line(30, tableY + 13, 180, tableY + 13);
  doc.line(30, tableY + 26, 180, tableY + 26);
  doc.line(105, tableY, 105, tableY + 40);

  // Rows and cells content
  const studentVal = options.studentName || 'Zaid Bahader';
  const totalMarksVal = options.totalMarks || '50 Marks';
  const timeAllowedVal = options.timeAllowed || '60 Mins';
  const gradeLevelVal = options.gradeLevel || 'High School (Grade 9-10)';
  const languageVal = options.language || 'English';
  const examDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const cellDetails = [
    { label: 'STUDENT', val: studentVal, x: 35, y: tableY + 5, vx: 35, vy: tableY + 9.5 },
    { label: 'SUBJECT', val: parsedSubject, x: 110, y: tableY + 5, vx: 110, vy: tableY + 9.5 },
    { label: 'CLASS LEVEL', val: gradeLevelVal, x: 35, y: tableY + 18, vx: 35, vy: tableY + 22.5 },
    { label: 'TOTAL MARKS', val: totalMarksVal.toString(), x: 110, y: tableY + 18, vx: 110, vy: tableY + 22.5 },
    { label: 'TIME ALLOWED', val: timeAllowedVal, x: 35, y: tableY + 31, vx: 35, vy: tableY + 35.5 },
    { label: 'LANGUAGE', val: languageVal, x: 110, y: tableY + 31, vx: 110, vy: tableY + 35.5 },
  ];

  cellDetails.forEach(cell => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    setTextColorHex(doc, COLORS.midIndigo);
    doc.text(cell.label, cell.x, cell.y);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    setTextColorHex(doc, COLORS.darkText);
    let valStr = cell.val;
    if (valStr.length > 28) valStr = valStr.substring(0, 26) + '...';
    doc.text(valStr, cell.vx, cell.vy);
  });

  // Bottom caption
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  setTextColorHex(doc, '#94A3B8');
  doc.text('Generated by EduGen AI  ·  edugen.app', 105, 268, { align: 'center' });

  doc.restoreGraphicsState();
}

// Type definitions for internal parsed structural models
interface ParsedMCQ {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

interface ParsedShortQ {
  question: string;
  userAnswer?: string;
  modelAnswer: string;
  feedback?: { score: string; text: string };
}

interface ParsedLongQ {
  question: string;
  modelAnswer: string;
  keyPoints: string[];
}

// ━━━ GENERIC/INTELLIGENT PARSING OF PDFItem[] ━━━
function parsePDFContent(content: PDFItem[]): {
  mcqs: ParsedMCQ[];
  shorts: ParsedShortQ[];
  longs: ParsedLongQ[];
  lessons: { title: string; paragraphs: string[] }[];
} {
  const mcqs: ParsedMCQ[] = [];
  const shorts: ParsedShortQ[] = [];
  const longs: ParsedLongQ[] = [];
  const lessons: { title: string; paragraphs: string[] }[] = [];

  let currentMCQ: Partial<ParsedMCQ> | null = null;
  let currentShort: Partial<ParsedShortQ> | null = null;
  let currentLong: Partial<ParsedLongQ> | null = null;
  let currentLesson: { title: string; paragraphs: string[] } | null = null;

  let currentMode: 'none' | 'mcq' | 'short' | 'long' | 'lesson' = 'none';

  for (let i = 0; i < content.length; i++) {
    const item = content[i];
    const text = item.text || '';

    // Mode transitions & Section definitions
    if (item.type === 'heading') {
      const lowerText = text.toLowerCase();
      if (lowerText.includes('multiple choice') || lowerText.includes('mcq') || lowerText.includes('quiz')) {
        currentMode = 'mcq';
      } else if (lowerText.includes('short question') || lowerText.includes('short q')) {
        currentMode = 'short';
      } else if (lowerText.includes('essay') || lowerText.includes('long question')) {
        currentMode = 'long';
      } else if (lowerText.includes('exam report') || lowerText.includes('results')) {
        currentMode = 'none'; // Will delegate sections as they appear
      } else {
        currentMode = 'lesson';
        currentLesson = { title: text, paragraphs: [] };
        lessons.push(currentLesson);
      }
      continue;
    }

    if (item.type === 'subheading') {
      const qText = text.replace(/^(Question\s+\d+|Q\d+|Q\s+\d+)[:.]\s*/i, '').trim();
      
      // Determine mode inside exam/general mode dynamically if needed
      if (currentMode === 'none') {
        const lowerQ = qText.toLowerCase();
        if (lowerQ.includes('options') || content[i+1]?.text?.startsWith('A)')) {
          currentMode = 'mcq';
        } else {
          currentMode = 'short'; // Default fallback
        }
      }

      if (currentMode === 'mcq') {
        if (currentMCQ && currentMCQ.options && currentMCQ.options.length > 0) {
          mcqs.push(currentMCQ as ParsedMCQ);
        }
        currentMCQ = { question: qText, options: [], correctAnswer: '', explanation: '' };
      } else if (currentMode === 'short') {
        if (currentShort && currentShort.modelAnswer) {
          shorts.push(currentShort as ParsedShortQ);
        }
        currentShort = { question: qText, modelAnswer: '', feedback: undefined };
      } else if (currentMode === 'long') {
        if (currentLong && currentLong.modelAnswer) {
          longs.push(currentLong as ParsedLongQ);
        }
        currentLong = { question: qText, modelAnswer: '', keyPoints: [] };
      }
      continue;
    }

    if (item.type === 'text') {
      if (currentMode === 'mcq' && currentMCQ) {
        if (/^[A-D]\)/i.test(text)) {
          const optText = text.replace(/^[A-D]\)\s*/i, '').trim();
          currentMCQ.options = currentMCQ.options || [];
          currentMCQ.options.push(optText);
        } else if (text.toLowerCase().startsWith('correct answer:')) {
          currentMCQ.correctAnswer = text.replace(/^correct answer:\s*/i, '').trim();
        } else if (text.toLowerCase().startsWith('explanation:')) {
          currentMCQ.explanation = text.replace(/^explanation:\s*/i, '').trim();
        }
      } else if (currentMode === 'short' && currentShort) {
        if (text.toLowerCase().startsWith('your answer:')) {
          currentShort.userAnswer = text.replace(/^your answer:\s*/i, '').trim();
        } else if (text.toLowerCase().startsWith('model answer:')) {
          currentShort.modelAnswer = text.replace(/^model answer:\s*/i, '').trim();
        } else if (/^feedback\s*\(/i.test(text)) {
          // Format e.g.: Feedback (8/10): Good points made.
          const scoreMatch = text.match(/score:\s*(\d+(\.\d+)?)|feedback\s*\((\d+)\/10\)/i);
          const scoreVal = scoreMatch ? (scoreMatch[1] || scoreMatch[3] || '8') : '8';
          const feedbackText = text.replace(/^feedback\s*\(\d+\/10\):\s*/i, '').trim();
          currentShort.feedback = { score: scoreVal, text: feedbackText };
        } else {
          // Append to any existing text in short Q answer state
          if (currentShort.modelAnswer) {
            currentShort.modelAnswer += ' ' + text;
          } else {
            currentShort.modelAnswer = text;
          }
        }
      } else if (currentMode === 'long' && currentLong) {
        if (text.toLowerCase().startsWith('critical success points:') || text.toLowerCase().includes('success points')) {
          // ignore divider text line
        } else if (text.startsWith('•') || text.startsWith('-') || text.startsWith('*')) {
          const kpText = text.replace(/^[•\-*]\s*/, '').trim();
          currentLong.keyPoints = currentLong.keyPoints || [];
          currentLong.keyPoints.push(kpText);
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

  // Push final open elements
  if (currentMCQ && currentMCQ.options && currentMCQ.options.length > 0) {
    mcqs.push(currentMCQ as ParsedMCQ);
  }
  if (currentShort && currentShort.modelAnswer) {
    shorts.push(currentShort as ParsedShortQ);
  }
  if (currentLong && currentLong.modelAnswer) {
    longs.push(currentLong as ParsedLongQ);
  }

  return { mcqs, shorts, longs, lessons };
}

// Core drawing helper for Section Headers with custom accent bar
function drawSectionHeader(doc: jsPDF, label: string, marks: string, currentY: number, colorAccent: string, colorText: string, colorMarks: string) {
  doc.saveGraphicsState();
  
  // Left Accent Bar (x=14, y=currentY, w=3, h=10mm)
  setFillColorHex(doc, colorAccent);
  doc.rect(14, currentY, 3, 10, 'F');

  // Title Text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  setTextColorHex(doc, colorText);
  doc.text(label.toUpperCase(), 20, currentY + 6.5);

  // Marks text right-aligned
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  setTextColorHex(doc, colorMarks);
  doc.text(marks, 196, currentY + 6.5, { align: 'right' });

  doc.restoreGraphicsState();
}

// Core card-box drawer with shadow simulation
function drawCard(doc: jsPDF, currentY: number, h: number, leftAccentColor: string) {
  doc.saveGraphicsState();

  // Shadow Simulation (Offset behind by 0.5mm, grey fill)
  setFillColorHex(doc, '#F1F5F9');
  doc.roundedRect(14.5, currentY + 0.5, 181.5, h, 3, 3, 'F');

  // Solid White Content Card Box
  setFillColorHex(doc, '#FFFFFF');
  setDrawColorHex(doc, '#E2E8F0');
  doc.setLineWidth(0.35); // Approx 0.5pt
  doc.roundedRect(14, currentY, 182, h, 3, 3, 'FD');

  // Left Accent Strip (w=3, h = card_height)
  setFillColorHex(doc, leftAccentColor);
  doc.rect(14, currentY, 3, h, 'F');

  doc.restoreGraphicsState();
}

// Draw candidate dotted answer lines inside cards
function drawDottedLine(doc: jsPDF, x1: number, y1: number, x2: number, color = '#CBD5E1') {
  doc.saveGraphicsState();
  setDrawColorHex(doc, color);
  doc.setLineWidth(0.3);
  
  // Custom dotted line draw
  const dotSpacing = 1.0;
  for (let x = x1; x <= x2; x += dotSpacing * 2) {
    doc.line(x, y1, x + dotSpacing, y1);
  }
  doc.restoreGraphicsState();
}

function askSolvedOrUnsolved(title: string): Promise<boolean | null> {
  return new Promise((resolve) => {
    // Create backdrop with blur and soft backdrop colors
    const backdrop = document.createElement('div');
    backdrop.id = 'pdf-format-modal-backdrop';
    backdrop.style.position = 'fixed';
    backdrop.style.top = '0';
    backdrop.style.left = '0';
    backdrop.style.width = '100vw';
    backdrop.style.height = '100vh';
    backdrop.style.backgroundColor = 'rgba(15, 23, 42, 0.45)';
    backdrop.style.backdropFilter = 'blur(12px)';
    (backdrop.style as any).webkitBackdropFilter = 'blur(12px)';
    backdrop.style.zIndex = '999999';
    backdrop.style.display = 'flex';
    backdrop.style.justifyContent = 'center';
    backdrop.style.alignItems = 'center';
    backdrop.style.fontFamily = "system-ui, -apple-system, 'Inter', sans-serif";
    backdrop.style.padding = '20px';
    backdrop.style.boxSizing = 'border-box';
    backdrop.style.opacity = '0';
    backdrop.style.transition = 'opacity 0.2s ease-out';

    // Modal Card
    const card = document.createElement('div');
    card.style.background = '#ffffff';
    card.style.borderRadius = '24px';
    card.style.boxShadow = '0 25px 50px -12px rgba(15, 23, 42, 0.15), 0 0 0 1px rgba(0,0,0,0.03)';
    card.style.width = '100%';
    card.style.maxWidth = '500px';
    card.style.padding = '28px';
    card.style.transform = 'translateY(15px) scale(0.96)';
    card.style.transition = 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease-out';
    card.style.opacity = '0';
    card.style.boxSizing = 'border-box';
    card.style.textAlign = 'center';

    card.innerHTML = `
      <!-- Icon Container with subtle radial ring -->
      <div style="width: 56px; height: 56px; background: #EEF2FF; border-radius: 18px; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px auto; border: 1px solid #C7D2FE;">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
      </div>

      <h3 style="font-size: 19px; font-weight: 800; color: #1E1B4B; margin: 0 0 4px 0; letter-spacing: -0.02em;">
        PDF Export Format Selection
      </h3>
      <p style="font-size: 14px; font-weight: bold; color: #4F46E5; margin: 0 0 12px 0; font-family: system-ui, sans-serif;">
        پی ڈی ایف فائل ڈاؤن لوڈ کرنے کا طریقہ منتخب کریں
      </p>
      <p style="font-size: 13px; color: #64748B; margin: 0 0 20px 0; line-height: 1.5; font-weight: 500;">
        Choose whether to export this dynamic learning document with integrated model answers or as an unsolved practice sheet.
      </p>

      <!-- Options container -->
      <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px; text-align: left;">
        
        <!-- Option 1: Solved -->
        <button id="modal-btn-solved" style="display: flex; align-items: flex-start; gap: 14px; padding: 14px 16px; border-radius: 14px; border: 2px solid #C7D2FE; background: linear-gradient(135deg, #EEF2FF 0%, #FFFFFF 100%); cursor: pointer; text-align: left; transition: all 0.2s ease; width: 100%; box-sizing: border-box; outline: none;">
          <div style="width: 20px; height: 20px; border-radius: 50%; background: #4F46E5; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px;">
            <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <div style="flex-grow: 1;">
            <div style="font-size: 14px; font-weight: 800; color: #1E1B4B; display: flex; align-items: center; gap: 6px;">
              <span>Solved Version (حل شدہ فارمیٹ)</span>
              <span style="font-size: 10px; padding: 1px 6px; background: #E0E7FF; color: #4F46E5; border-radius: 10px; font-weight: bold;">Default</span>
            </div>
            <div style="font-size: 12px; color: #475569; margin-top: 3px; line-height: 1.4; font-weight: 500;">
              Answers, detailed explanations, and full grading schemes appended at the end.
            </div>
          </div>
        </button>

        <!-- Option 2: Unsolved -->
        <button id="modal-btn-unsolved" style="display: flex; align-items: flex-start; gap: 14px; padding: 14px 16px; border-radius: 14px; border: 2px solid #E2E8F0; background: #FFFFFF; cursor: pointer; text-align: left; transition: all 0.2s ease; width: 100%; box-sizing: border-box; outline: none;">
          <div style="width: 20px; height: 20px; border-radius: 50%; border: 2px solid #94A3B8; background: #FFFFFF; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px; box-sizing: border-box;"></div>
          <div style="flex-grow: 1;">
            <div style="font-size: 14px; font-weight: 800; color: #1E1B4B;">
              Unsolved Version (غیر حل شدہ فارمیٹ)
            </div>
            <div style="font-size: 12px; color: #475569; margin-top: 3px; line-height: 1.4; font-weight: 500;">
              Answers are hidden. Perfect for self-testing or test handouts. Includes empty writing dotted lines.
            </div>
          </div>
        </button>

      </div>

      <!-- Action buttons -->
      <div style="display: flex; gap: 10px; justify-content: flex-end;">
        <button id="modal-btn-cancel" style="height: 40px; padding: 0 16px; border-radius: 10px; border: 1px solid #CBD5E1; background: #FFFFFF; font-size: 13px; font-weight: bold; color: #64748B; cursor: pointer; transition: all 0.15s; outline: none;">
          Cancel
        </button>
        <button id="modal-btn-confirm" style="height: 40px; padding: 0 24px; border-radius: 10px; border: none; background: #4F46E5; font-size: 13px; font-weight: bold; color: #FFFFFF; cursor: pointer; transition: all 0.15s; box-shadow: 0 4px 10px rgba(79, 70, 229, 0.2); outline: none;">
          Download PDF
        </button>
      </div>
    `;

    backdrop.appendChild(card);
    document.body.appendChild(backdrop);

    // Apply animation entrance
    setTimeout(() => {
      backdrop.style.opacity = '1';
      card.style.opacity = '1';
      card.style.transform = 'translateY(0) scale(1)';
    }, 20);

    let isSolvedSelection = true; // Default

    const solvedBtn = card.querySelector('#modal-btn-solved') as HTMLButtonElement;
    const unsolvedBtn = card.querySelector('#modal-btn-unsolved') as HTMLButtonElement;
    const cancelBtn = card.querySelector('#modal-btn-cancel') as HTMLButtonElement;
    const confirmBtn = card.querySelector('#modal-btn-confirm') as HTMLButtonElement;

    const updateSelectionUI = () => {
      if (isSolvedSelection) {
        solvedBtn.style.borderColor = '#4F46E5';
        solvedBtn.style.background = 'linear-gradient(135deg, #EEF2FF 0%, #FFFFFF 100%)';
        const circle = solvedBtn.querySelector('div') as HTMLDivElement;
        circle.style.background = '#4F46E5';
        circle.style.borderColor = '#4F46E5';
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
        unsolvedBtn.style.borderColor = '#4F46E5';
        unsolvedBtn.style.background = 'linear-gradient(135deg, #EEF2FF 0%, #FFFFFF 100%)';
        const uncircle = unsolvedBtn.querySelector('div') as HTMLDivElement;
        uncircle.style.borderColor = '#4F46E5';
        uncircle.style.background = '#4F46E5';
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
      updateSelectionUI();
    });

    unsolvedBtn.addEventListener('click', () => {
      isSolvedSelection = false;
      updateSelectionUI();
    });

    const removeModal = () => {
      backdrop.style.opacity = '0';
      card.style.opacity = '0';
      card.style.transform = 'translateY(15px) scale(0.96)';
      setTimeout(() => {
        if (backdrop.parentNode) {
          backdrop.parentNode.removeChild(backdrop);
        }
      }, 250);
    };

    cancelBtn.addEventListener('click', () => {
      removeModal();
      resolve(null);
    });

    confirmBtn.addEventListener('click', () => {
      removeModal();
      resolve(isSolvedSelection);
    });
  });
}

export const isAnswerLine = (text: string): boolean => {
  const rawText = text.trim();
  const lowerText = rawText.toLowerCase();
  
  return (
    lowerText.includes('correct answer') || 
    lowerText.includes('explanation:') ||
    lowerText.startsWith('explanation') ||
    lowerText.startsWith('correct index') ||
    lowerText.includes('model answer') ||   
    lowerText.includes('model essay') || 
    lowerText.includes('your answer') || 
    lowerText.includes('user answer') || 
    lowerText.includes('feedback') ||
    rawText.includes('جواب درست') || 
    rawText.includes('درست جواب') || 
    rawText.includes('صحیح جواب') || 
    rawText.includes('درست آپشن') || 
    rawText.includes('وضاحت') || 
    rawText.includes('تشریح') || 
    rawText.includes('ماڈل جواب') || 
    rawText.includes('ماڈل مضمون') || 
    rawText.includes('تفصیلی جواب') || 
    rawText.includes('آپ کا جواب') ||
    rawText.includes('طالب علم کا جواب') ||
    rawText.includes('تاثرات') || 
    rawText.includes('تبصرہ') || 
    rawText.includes('گریڈ') || 
    rawText.includes('نمبر:')
  );
};

export const generatePDF_Urdu = async (title: string, content: PDFItem[], options?: PDFOptions) => {
  const actualOptions = options || {};
  const isExamMode = !!actualOptions.isExam;

  // Global parsing of current material
  const parsed = parsePDFContent(content);

  // Dynamic parameters
  const student = actualOptions.studentName || 'Zaid Bahader';
  const topic = actualOptions.topic || actualOptions.subject || title.replace(/MCQs|Short\s*Qs|Essays|Lesson/i, '').trim();
  const classLevel = actualOptions.gradeLevel || 'High School (Grade 9-10)';
  const language = actualOptions.language || 'Urdu (اُردو)';
  
  let calculatedMarks = 0;
  if (parsed.mcqs.length > 0) calculatedMarks += parsed.mcqs.length * 1;
  if (parsed.shorts.length > 0) calculatedMarks += parsed.shorts.length * 3;
  if (parsed.longs.length > 0) calculatedMarks += parsed.longs.length * 10;
  if (calculatedMarks === 0) calculatedMarks = 25;
  const totalMarks = actualOptions.totalMarks || `${calculatedMarks} Marks`;
  const timeAllowed = actualOptions.timeAllowed || (parsed.mcqs.length > 0 ? `${parsed.mcqs.length * 2 + 10} Mins` : '60 Mins');

  // Show beautiful overlay
  const overlay = document.createElement('div');
  overlay.id = 'urdu-pdf-loading-overlay';
  overlay.style.position = 'fixed';
  overlay.style.top = '0';
  overlay.style.left = '0';
  overlay.style.width = '100vw';
  overlay.style.height = '100vh';
  overlay.style.backgroundColor = 'rgba(15, 23, 42, 0.75)';
  overlay.style.backdropFilter = 'blur(6px)';
  overlay.style.zIndex = '99999';
  overlay.style.display = 'flex';
  overlay.style.flexDirection = 'column';
  overlay.style.justifyContent = 'center';
  overlay.style.alignItems = 'center';
  overlay.style.color = '#ffffff';
  overlay.style.fontFamily = 'system-ui, -apple-system, sans-serif';

  overlay.innerHTML = `
    <div style="background: white; color: #1e293b; padding: 2.5rem; border-radius: 20px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.15); text-align: center; max-width: 380px; width: 100%; border: 1px solid #e2e8f0; display: flex; flex-direction: column; align-items: center; gap: 1rem;">
      <div style="position: relative; width: 80px; height: 80px;">
        <div style="box-sizing: border-box; display: block; position: absolute; width: 64px; height: 64px; margin: 8px; border: 6px solid #4f46e5; border-radius: 50%; animation: dual-ring-spin 1.2s linear infinite; border-color: #4f46e5 transparent #3b82f6 transparent;"></div>
      </div>
      <h3 style="font-size: 1.25rem; font-weight: 700; color: #1e1b4b; margin: 0.5rem 0 0.25rem 0;">پی ڈی ایف کی تیاری جاری ہے</h3>
      <p style="font-size: 0.9rem; color: #64748b; margin: 0; line-height: 1.5;">Urdu PDF tayar ho raha hai... Please wait.</p>
    </div>
    <style>
      @keyframes dual-ring-spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    </style>
  `;
  document.body.appendChild(overlay);

  // Load Google Font
  if (!document.getElementById('noto-naskh-font')) {
    const link = document.createElement('link');
    link.id = 'noto-naskh-font';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Noto+Naskh+Arabic:wght@400;700&display=swap';
    document.head.appendChild(link);
  }

  // Create hidden render div
  const container = document.createElement('div');
  container.id = 'urdu-pdf-container';
  container.className = 'markdown-body';
  container.style.position = 'fixed';
  container.style.top = '-9999px';
  container.style.left = '-9999px';
  container.style.width = '794px';
  container.style.direction = 'rtl';
  container.style.fontFamily = "'Noto Naskh Arabic', 'Inter', serif";
  container.style.backgroundColor = '#ffffff';
  container.style.padding = '40px';
  container.style.boxSizing = 'border-box';

  // Build sequential HTML
  let htmlContent = `
    <!-- Top Navy Header Banner -->
    <div style="background-color: #1E1B4B; color: #ffffff; padding: 25px 30px; border-radius: 12px; margin-bottom: 25px; display: flex; flex-direction: column; gap: 8px; direction: rtl; text-align: right;">
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #4338CA; padding-bottom: 12px;">
        <div style="font-size: 11px; color: #818CF8; font-weight: bold; letter-spacing: 0.5px;">EduGen AI · edugen.app</div>
        <div style="font-size: 11px; color: #94A3B8;">تخلیق شدہ تاریخ: ${new Date().toLocaleDateString('ur-PK') || new Date().toLocaleDateString()}</div>
      </div>
      <h1 style="font-size: 24px; font-weight: bold; margin: 10px 0 0 0; color: #ffffff; line-height: 1.4;">${title}</h1>
    </div>

    <!-- Student Info Grid -->
    <div style="background-color: #FAFBFF; border: 1px solid #C7D2FE; border-radius: 12px; padding: 20px; margin-bottom: 30px; direction: rtl; text-align: right;">
      <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px 30px;">
        <div>
          <span style="font-size: 11px; color: #6366F1; font-weight: bold; display: block; margin-bottom: 4px;">طالب علم کا نام</span>
          <span style="font-size: 14px; font-weight: bold; color: #0F172A;">${student}</span>
        </div>
        <div>
          <span style="font-size: 11px; color: #6366F1; font-weight: bold; display: block; margin-bottom: 4px;">مضمون / عنوان</span>
          <span style="font-size: 14px; font-weight: bold; color: #0F172A;">${topic}</span>
        </div>
        <div>
          <span style="font-size: 11px; color: #6366F1; font-weight: bold; display: block; margin-bottom: 4px;">کلاس لیول</span>
          <span style="font-size: 14px; font-weight: bold; color: #0F172A;">${classLevel}</span>
        </div>
        <div>
          <span style="font-size: 11px; color: #6366F1; font-weight: bold; display: block; margin-bottom: 4px;">کل نمبر</span>
          <span style="font-size: 14px; font-weight: bold; color: #0F172A;">${totalMarks}</span>
        </div>
        <div>
          <span style="font-size: 11px; color: #6366F1; font-weight: bold; display: block; margin-bottom: 4px;">مقررہ وقت</span>
          <span style="font-size: 14px; font-weight: bold; color: #0F172A;">${timeAllowed}</span>
        </div>
        <div>
          <span style="font-size: 11px; color: #6366F1; font-weight: bold; display: block; margin-bottom: 4px;">زبان</span>
          <span style="font-size: 14px; font-weight: bold; color: #0F172A;">${language}</span>
        </div>
      </div>
    </div>

    <!-- Active dynamic questions content -->
    <div>
  `;

  for (let i = 0; i < content.length; i++) {
    const item = content[i];
    if (!item.text) continue;

    if (item.type === 'heading') {
      htmlContent += `
        <div style="margin-top: 30px; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 2px solid #4F46E5; direction: rtl; text-align: right;">
          <h2 style="font-size: 18px; font-weight: bold; color: #1E1B4B; margin: 0; line-height: 1.5;">${item.text}</h2>
        </div>
      `;
    } else if (item.type === 'subheading') {
      htmlContent += `
        <div style="background: #ffffff; border: 1px solid #E2E8F0; border-right: 4px solid #4F46E5; border-radius: 12px; padding: 18px; margin-bottom: 15px; box-shadow: 0 2px 4px rgba(0,0,0,0.02); direction: rtl; text-align: right;">
          <h3 style="font-size: 14.5px; font-weight: bold; color: #1E1B4B; margin: 0 0 12px 0; line-height: 1.6;">${item.text}</h3>
      `;

      let nextIdx = i + 1;
      let optionsHtml = '';
      let hasAnswersOrExpl = false;

      while (nextIdx < content.length && content[nextIdx].type !== 'heading' && content[nextIdx].type !== 'subheading') {
        const nextItem = content[nextIdx];
        if (nextItem.text) {
          const rawText = nextItem.text.trim();
          // Match A) B) C) etc or Urdu letters mapping
          if (/^[a-dA-D\u0627-\u062F]\)|^[a-dA-D\u0627-\u062F]\./.test(rawText)) {
            optionsHtml += `
              <div style="display: inline-block; width: 48%; margin-bottom: 8px; font-size: 13px; color: #475569; padding-left: 10px; box-sizing: border-box; text-align: right;">
                <span style="font-weight: bold; color: #4F46E5; margin-left: 5px;">⬤</span> ${rawText}
              </div>
            `;
          } else {
            const isCorr = rawText.toLowerCase().includes('correct answer') || 
                           rawText.includes('جواب درست') || 
                           rawText.includes('درست جواب') || 
                           rawText.includes('صحیح جواب') || 
                           rawText.includes('درست آپشن') || 
                           rawText.startsWith('Correct Answer:') ||
                           rawText.startsWith('Correct MCQ:');
            
            const isExpl = rawText.toLowerCase().includes('explanation') || 
                           rawText.includes('وضاحت') || 
                           rawText.includes('تشریح') || 
                           rawText.startsWith('Explanation:');
            
            const isModel = rawText.toLowerCase().includes('model answer') || 
                            rawText.toLowerCase().includes('model essay') || 
                            rawText.includes('ماڈل جواب') || 
                            rawText.includes('ماڈل مضمون') || 
                            rawText.includes('تفصیلی جواب') || 
                            rawText.startsWith('Model Answer:') || 
                            rawText.startsWith('جواب:');
            
            const isUser = rawText.toLowerCase().includes('your answer') || 
                           rawText.toLowerCase().includes('user answer') || 
                           rawText.includes('آپ کا جواب') ||
                           rawText.includes('طالب علم کا جواب');
            
            const isFeed = rawText.toLowerCase().includes('feedback') || 
                           rawText.includes('تاثرات') || 
                           rawText.includes('تبصرہ') || 
                           rawText.includes('گریڈ') || 
                           rawText.includes('نمبر:');

            const isAnsLine = isCorr || isExpl || isModel || isUser || isFeed;

            if (isAnsLine) {
              if (actualOptions.isSolved !== false) {
                let bgColor = '#FFFBEB';
                let borderColor = '#FDE68A';
                let textColor = '#92400E';
                let labelStyle = 'font-weight: bold;';

                if (isCorr || isModel) {
                  bgColor = '#F0FDF4';
                  borderColor = '#BBF7D0';
                  textColor = '#166534';
                } else if (isExpl) {
                  bgColor = '#EEF2FF';
                  borderColor = '#C7D2FE';
                  textColor = '#3730A3';
                } else if (isUser) {
                  bgColor = '#F8FAFC';
                  borderColor = '#E2E8F0';
                  textColor = '#334155';
                }

                const parts = rawText.split(':');
                const label = parts[0] || '';
                const bodyText = rawText.includes(':') ? rawText.substring(rawText.indexOf(':') + 1) : rawText;

                optionsHtml += `
                  <div style="background-color: ${bgColor}; border: 1px solid ${borderColor}; border-radius: 8px; padding: 10px 14px; color: ${textColor}; font-size: 13px; margin-top: 12px; margin-bottom: 6px; text-align: right; line-height: 1.6;">
                    <strong style="${labelStyle}">${label}:</strong>${bodyText}
                  </div>
                `;
                hasAnswersOrExpl = true;
              }
            } else {
              optionsHtml += `
                <p style="font-size: 13px; color: #475569; line-height: 1.8; margin: 8px 0; text-align: right;">${rawText}</p>
              `;
            }
          }
        }
        nextIdx++;
      }

      htmlContent += optionsHtml;

      if (actualOptions.isSolved === false && optionsHtml.indexOf('⬤') === -1) {
        htmlContent += `
          <div style="margin-top: 15px; margin-bottom: 5px;">
            <div style="border-bottom: 1px dotted #CBD5E1; height: 35px;"></div>
            <div style="border-bottom: 1px dotted #CBD5E1; height: 35px;"></div>
            <div style="border-bottom: 1px dotted #CBD5E1; height: 35px;"></div>
          </div>
        `;
      } else if (isExamMode && !hasAnswersOrExpl && optionsHtml.indexOf('⬤') === -1) {
        htmlContent += `
          <div style="margin-top: 15px; margin-bottom: 5px;">
            <div style="border-bottom: 1px dotted #CBD5E1; height: 35px;"></div>
            <div style="border-bottom: 1px dotted #CBD5E1; height: 35px;"></div>
            <div style="border-bottom: 1px dotted #CBD5E1; height: 35px;"></div>
          </div>
        `;
      }

      htmlContent += `</div>`;
      i = nextIdx - 1;
    } else if (item.type === 'text') {
      if (item.text) {
        const isAnsLine = isAnswerLine(item.text);
        if (actualOptions.isSolved === false && isAnsLine) {
          continue;
        }
        htmlContent += `
          <div style="font-size: 13.5px; color: #2D3748; line-height: 1.8; margin-top: 10px; margin-bottom: 10px; text-align: justify; direction: rtl; text-align: right;">
            ${item.text}
          </div>
        `;
      }
    }
  }

  htmlContent += `
    </div>
    <!-- Footer banner -->
    <div style="margin-top: 40px; border-top: 1px solid #E2E8F0; padding-top: 15px; text-align: center; color: #94A3B8; font-size: 11px; direction: rtl;">
      تخلیق شدہ بذریعہ: EduGen AI &middot; edugen.app
    </div>
  `;

  container.innerHTML = htmlContent;
  document.body.appendChild(container);

  try {
    // Wait for fonts to be ready + safety buffer
    await document.fonts.ready;
    await new Promise(resolve => setTimeout(resolve, 600));

    // Convert DOM to canvas
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      width: 794
    });

    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    const imgWidth = 210; // mm
    const pageHeight = 297; // mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    const doc = new jsPDF('p', 'mm', 'a4');

    // First page render
    doc.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // Remaining pages
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      doc.addPage();
      doc.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // Save filename stamping
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const dStamp = `${day}${month}${year}`;
    const cleanTitle = title.replace(/\s+/g, '_');
    let finalFilename = `EduGen_Material_${cleanTitle}_${dStamp}.pdf`;

    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('mcq')) {
      finalFilename = `EduGen_MCQs_${topic.replace(/\s+/g, '_')}_${dStamp}.pdf`;
    } else if (lowerTitle.includes('short q')) {
      finalFilename = `EduGen_ShortQs_${topic.replace(/\s+/g, '_')}_${dStamp}.pdf`;
    } else if (lowerTitle.includes('essay') || lowerTitle.includes('long q')) {
      finalFilename = `EduGen_LongQs_${topic.replace(/\s+/g, '_')}_${dStamp}.pdf`;
    } else if (lowerTitle.includes('lesson') || lowerTitle.includes('explain')) {
      finalFilename = `EduGen_Explainer_${topic.replace(/\s+/g, '_')}_${dStamp}.pdf`;
    } else if (lowerTitle.includes('story')) {
      finalFilename = `EduGen_Story_${topic.replace(/\s+/g, '_')}_${dStamp}.pdf`;
    } else if (lowerTitle.includes('letter')) {
      finalFilename = `EduGen_Letter_${topic.replace(/\s+/g, '_')}_${dStamp}.pdf`;
    } else if (isExamMode || lowerTitle.includes('exam')) {
      finalFilename = `EduGen_ExamPaper_${topic.replace(/\s+/g, '_')}_${dStamp}.pdf`;
    }

    doc.save(finalFilename);
  } catch (error) {
    console.error('Urdu PDF generation error:', error);
  } finally {
    // Remove rendered div and overlay from DOM in all cases
    if (container.parentNode) container.parentNode.removeChild(container);
    if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
  }
};

export const generatePDF = async (title: string, content: PDFItem[], options?: PDFOptions) => {
  const actualOptions = options || {};
  let isSolved = true;

  if (actualOptions.isSolved === undefined) {
    try {
      const choice = await askSolvedOrUnsolved(title);
      if (choice === null) {
        // Cancelled by user
        return;
      }
      isSolved = choice;
    } catch (e) {
      return;
    }
  } else {
    isSolved = actualOptions.isSolved;
  }

  const mergedOptions = { ...actualOptions, isSolved };

  const isUrdu = ((mergedOptions.language || '').toLowerCase().includes('urdu') || 
                  /([\u0600-\u06FF])/.test(title + ' ' + content.map(c => c.text || '').join(' ')));
  if (isUrdu) {
    generatePDF_Urdu(title, content, mergedOptions);
    return;
  }

  const doc = new jsPDF('p', 'mm', 'a4');
  const isExamMode = !!mergedOptions.isExam;

  // Global parsing of current material
  const parsed = parsePDFContent(content);

  // Dynamic parameters
  const student = mergedOptions.studentName || 'Zaid Bahader';
  const topic = mergedOptions.topic || mergedOptions.subject || title.replace(/MCQs|Short\s*Qs|Essays|Lesson/i, '').trim();
  const classLevel = mergedOptions.gradeLevel || 'High School (Grade 9-10)';
  const language = mergedOptions.language || 'English';
  const timeAllowed = mergedOptions.timeAllowed || (parsed.mcqs.length > 0 ? `${parsed.mcqs.length * 2 + 10} Mins` : '60 Mins');
  
  // Calculate total marks
  let calculatedMarks = 0;
  if (parsed.mcqs.length > 0) calculatedMarks += parsed.mcqs.length * 1;
  if (parsed.shorts.length > 0) calculatedMarks += parsed.shorts.length * 3;
  if (parsed.longs.length > 0) calculatedMarks += parsed.longs.length * 10;
  if (calculatedMarks === 0) calculatedMarks = 25; // Default reference marks
  const totalMarks = mergedOptions.totalMarks || `${calculatedMarks} Marks`;

  // Render variables
  let currentPage = 1;
  let currentY = 32;

  // ━━━ FIRST PAGE / COVER PAGE LOGIC ━━━
  if (isExamMode) {
    drawExamCoverPage(doc, { studentName: student, subject: topic, gradeLevel: classLevel, language, totalMarks, timeAllowed }, title);
    doc.addPage();
    currentPage = 2;
    currentY = 32;
  } else {
    // ━━━ 2. STUDENT INFO GRID (first page only, y=30mm) ━━━
    setFillColorHex(doc, '#FAFBFF');
    setDrawColorHex(doc, COLORS.indigoBorder);
    doc.setLineWidth(0.4);
    doc.roundedRect(14, 30, 182, 18, 3, 3, 'FD');

    // Grid dividers
    doc.setLineWidth(0.3);
    setDrawColorHex(doc, '#E2E8F0');
    // Vertical
    doc.line(74.6, 30, 74.6, 48);
    doc.line(135.2, 30, 135.2, 48);
    // Horizontal
    doc.line(14, 39, 196, 39);

    const cellDetails = [
      { label: 'STUDENT', val: student, x: 18, y: 34, vx: 18, vy: 38 },
      { label: 'SUBJECT', val: topic, x: 78.6, y: 34, vx: 78.6, vy: 38 },
      { label: 'CLASS LEVEL', val: classLevel, x: 139.2, y: 34, vx: 139.2, vy: 38 },
      { label: 'TOTAL MARKS', val: totalMarks.toString(), x: 18, y: 43, vx: 18, vy: 47 },
      { label: 'TIME ALLOWED', val: timeAllowed, x: 78.6, y: 43, vx: 78.6, vy: 47 },
      { label: 'LANGUAGE', val: language, x: 139.2, y: 43, vx: 139.2, vy: 47 },
    ];

    cellDetails.forEach(cell => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      setTextColorHex(doc, COLORS.midIndigo);
      doc.text(cell.label, cell.x, cell.y);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      setTextColorHex(doc, COLORS.darkText);
      let cellStr = cell.val;
      if (cellStr.length > 28) cellStr = cellStr.substring(0, 26) + '...';
      doc.text(cellStr, cell.vx, cell.vy);
    });

    // ━━━ 3. INSTRUCTIONS BOX (first page, y=50mm) ━━━
    setFillColorHex(doc, COLORS.indigoTint);
    setDrawColorHex(doc, COLORS.indigoBorder);
    doc.setLineWidth(0.5);
    // Dashed drawing:
    doc.setLineDashPattern([2, 2], 0);
    doc.roundedRect(14, 50, 182, 7, 2, 2, 'FD');
    doc.setLineDashPattern([], 0); // Restore solid lines
    
    doc.setFont('helvetica', 'oblique');
    doc.setFontSize(8.5);
    setTextColorHex(doc, COLORS.primaryIndigo);
    doc.text("Instructions: Attempt all questions. MCQs carry 1 mark. Write clearly in the space provided.", 18, 54.5);

    currentY = 62;
  }

  // Page break wrapper
  const handlePageBreak = (neededHeight: number) => {
    if (currentY + neededHeight > 265) {
      doc.addPage();
      currentY = 32;
    }
  };

  // ━━━ RENDER SECTION A: MCQs ━━━
  if (parsed.mcqs.length > 0) {
    handlePageBreak(25);
    drawSectionHeader(doc, 'Section A: Multiple Choice Questions', `[ ${parsed.mcqs.length * 1} Marks ]`, currentY, COLORS.primaryIndigo, COLORS.darkNavy, COLORS.midIndigo);
    currentY += 14;

    parsed.mcqs.forEach((q, qIndex) => {
      const qNum = `Q ${String(qIndex + 1).padStart(2, '0')}`;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10.5);
      const textLines = doc.splitTextToSize(q.question, 172);
      const textHeight = textLines.length * 5.2;

      // Card height calculation: 11.5mm top padding + textHeight + 2.5mm gap + 14mm options container + 3mm bottom padding = textHeight + 31mm
      const cardHeight = textHeight + 31;
      handlePageBreak(cardHeight + 6);

      // Draw overall beautiful Card and Indigo Ribbon accent for Section A
      drawCard(doc, currentY, cardHeight, COLORS.midIndigo);

      // Question Name block
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      setTextColorHex(doc, COLORS.midIndigo);
      doc.text(qNum, 20, currentY + 5.5);

      // Question text rendering with consistent line height
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10.5);
      setTextColorHex(doc, COLORS.darkText);
      textLines.forEach((line: string, lIdx: number) => {
        doc.text(line, 20, currentY + 11.5 + (lIdx * 5.2));
      });

      // MCQ 2x2 Grid Area Background Banner
      const optionsY = currentY + cardHeight - 17;
      setFillColorHex(doc, '#F8FAFF');
      doc.rect(14.3, optionsY, 181.4, 14, 'F');

      setDrawColorHex(doc, '#EEF2FF');
      doc.setLineWidth(0.5);
      doc.line(14, optionsY, 196, optionsY);

      // Fill options
      const colX1 = 18;
      const colX2 = 105;
      const optY1 = optionsY + 4.5;
      const optY2 = optionsY + 10.5;

      const optLayout = [
        { text: q.options[0] || '', x: colX1, y: optY1, letter: 'A' },
        { text: q.options[1] || '', x: colX2, y: optY1, letter: 'B' },
        { text: q.options[2] || '', x: colX1, y: optY2, letter: 'C' },
        { text: q.options[3] || '', x: colX2, y: optY2, letter: 'D' },
      ];

      optLayout.forEach(opt => {
        if (!opt.text) return;
        // Letter indicator Rounded Box
        setFillColorHex(doc, COLORS.indigoTint);
        setDrawColorHex(doc, COLORS.indigoBorder);
        doc.setLineWidth(0.3);
        doc.roundedRect(opt.x, opt.y - 4, 6, 6, 1.5, 1.5, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        setTextColorHex(doc, COLORS.primaryIndigo);
        doc.text(opt.letter, opt.x + 3, opt.y, { align: 'center' });

        // Option Text (increased length limit to 44 characters to prevent excessive truncated text)
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.5);
        setTextColorHex(doc, COLORS.mediumText);
        let optStr = opt.text;
        if (optStr.length > 44) optStr = optStr.substring(0, 42) + '...';
        doc.text(optStr, opt.x + 8, opt.y + 0.3);
      });

      currentY += cardHeight + 6;
    });
  }

  // ━━━ RENDER SECTION B: SHORT QUESTIONS ━━━
  if (parsed.shorts.length > 0) {
    handlePageBreak(30);
    drawSectionHeader(doc, 'Section B: Short Questions', `[ ${parsed.shorts.length * 3} Marks ]`, currentY, COLORS.skyBlue, '#0C4A6E', '#0284C7');
    currentY += 14;

    parsed.shorts.forEach((q, qIndex) => {
      const qNum = `Q ${String(qIndex + 1).padStart(2, '0')}`;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10.5);
      const textLines = doc.splitTextToSize(q.question, 172);
      const textHeight = textLines.length * 5;

      // Card height calculation: 5mm + question_lines * 5mm + 4 answer lines * 7mm + 8mm marks box pad
      const cardHeight = Math.max(45, 5 + textHeight + (4 * 7) + 8);
      handlePageBreak(cardHeight + 6);

      // Draw overall beautiful card
      drawCard(doc, currentY, cardHeight, COLORS.skyBlue);

      // Question identification block
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      setTextColorHex(doc, '#0284C7');
      doc.text(qNum, 20, currentY + 5.5);

      // Question body text rendering
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10.5);
      setTextColorHex(doc, COLORS.darkText);
      textLines.forEach((line: string, lIdx: number) => {
        doc.text(line, 20, currentY + 11 + (lIdx * 5));
      });

      // Marks box (bottom right)
      const marksBoxY = currentY + cardHeight - 7.5;
      setFillColorHex(doc, COLORS.indigoTint);
      setDrawColorHex(doc, COLORS.indigoBorder);
      doc.setLineWidth(0.4);
      doc.roundedRect(165, marksBoxY - 4, 25, 6, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      setTextColorHex(doc, COLORS.primaryIndigo);
      doc.text("[ __ / 3 marks ]", 177.5, marksBoxY, { align: 'center' });

      // Action fields: Output answer line guides
      const lineStartY = currentY + 12 + textHeight;
      for (let lineIdx = 0; lineIdx < 4; lineIdx++) {
        const lineY = lineStartY + (lineIdx * 7);
        drawDottedLine(doc, 20, lineY, 190, '#CBD5E1');
      }

      currentY += cardHeight + 6;
    });
  }

  // ━━━ RENDER SECTION C: LONG QUESTIONS ━━━
  if (parsed.longs.length > 0) {
    handlePageBreak(30);
    drawSectionHeader(doc, 'Section C: Essay / Long Questions', `[ ${parsed.longs.length * 10} Marks ]`, currentY, COLORS.emerald, '#14532D', '#059669');
    currentY += 14;

    parsed.longs.forEach((q, qIndex) => {
      const qNum = `Q ${String(qIndex + 1).padStart(2, '0')}`;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10.5);
      const textLines = doc.splitTextToSize(q.question, 172);
      const textHeight = textLines.length * 5;

      // Card height calculation: 5mm + question_lines * 5mm + 10 answer lines * 7mm + 8mm padding
      const cardHeight = Math.max(88, 5 + textHeight + (10 * 7) + 8);
      handlePageBreak(cardHeight + 6);

      // Draw overall card
      drawCard(doc, currentY, cardHeight, COLORS.emerald);

      // Question name
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      setTextColorHex(doc, '#059669');
      doc.text(qNum, 20, currentY + 5.5);

      // Question text
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10.5);
      setTextColorHex(doc, COLORS.darkText);
      textLines.forEach((line: string, lIdx: number) => {
        doc.text(line, 20, currentY + 11 + (lIdx * 5));
      });

      // Marks box bottom right
      const marksBoxY = currentY + cardHeight - 7.5;
      setFillColorHex(doc, COLORS.indigoTint);
      setDrawColorHex(doc, COLORS.indigoBorder);
      doc.setLineWidth(0.4);
      doc.roundedRect(165, marksBoxY - 4, 25, 6, 1.5, 1.5, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      setTextColorHex(doc, COLORS.primaryIndigo);
      doc.text("[ __ / 10 marks ]", 177.5, marksBoxY, { align: 'center' });

      // Action fields: Output 10 answer lines
      const lineStartY = currentY + 12 + textHeight;
      for (let lineIdx = 0; lineIdx < 10; lineIdx++) {
        const lineY = lineStartY + (lineIdx * 7);
        drawDottedLine(doc, 20, lineY, 190, '#CBD5E1');
      }

      currentY += cardHeight + 6;
    });
  }

  // ━━━ RENDER GENERAL CONTENT / LESSONS / STORY / LETTERS ━━━
  if (parsed.lessons.length > 0) {
    parsed.lessons.forEach((lesson) => {
      const isLetter = title.toLowerCase().includes('letter') || lesson.title.toLowerCase().includes('subject');
      const accent = isLetter ? COLORS.emerald : COLORS.midIndigo;
      
      handlePageBreak(30);
      drawSectionHeader(doc, lesson.title, 'STUDY TEXT', currentY, accent, COLORS.darkNavy, COLORS.midIndigo);
      currentY += 14;

      lesson.paragraphs.forEach((pText) => {
        if (mergedOptions.isSolved === false && isAnswerLine(pText)) {
          return;
        }

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        const wrappedText = doc.splitTextToSize(pText, 172);
        const height = wrappedText.length * 5.2 + 8; // Including padding inside card

        handlePageBreak(height + 6);
        drawCard(doc, currentY, height, accent);

        // Print wrapped texts inside card
        setTextColorHex(doc, COLORS.darkText);
        wrappedText.forEach((line: string, lineIndex: number) => {
          doc.text(line, 20, currentY + 6.5 + lineIndex * 5.2);
        });

        currentY += height + 6;
      });
    });
  }

  // Fallback if absolutely no content was successfully parsed (raw sequential text block cards)
  const isAnythingParsed = parsed.mcqs.length > 0 || parsed.shorts.length > 0 || parsed.longs.length > 0 || parsed.lessons.length > 0;
  if (!isAnythingParsed && content.length > 0) {
    let cardTextBodyList: string[] = [];
    let cardTitle = title;

    content.forEach((item) => {
      if (item.type === 'heading' || item.type === 'subheading') {
        if (cardTextBodyList.length > 0) {
          // Draw current active card
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(10);
          const bodyStr = cardTextBodyList.join('\n\n');
          const wrappedText = doc.splitTextToSize(bodyStr, 172);
          const height = wrappedText.length * 5.2 + 10;
          
          handlePageBreak(height + 15);
          drawSectionHeader(doc, cardTitle, 'LEARNING MATERIAL', currentY, COLORS.midIndigo, COLORS.darkNavy, COLORS.midIndigo);
          currentY += 14;

          drawCard(doc, currentY, height, COLORS.midIndigo);
          setTextColorHex(doc, COLORS.darkText);
          wrappedText.forEach((line: string, lineIndex: number) => {
            doc.text(line, 20, currentY + 7 + lineIndex * 5.2);
          });
          currentY += height + 8;
        }
        cardTitle = item.text || 'Section';
        cardTextBodyList = [];
      } else if (item.type === 'text' && item.text) {
        if (mergedOptions.isSolved === false && isAnswerLine(item.text)) {
          return;
        }
        cardTextBodyList.push(item.text);
      }
    });

    // Flush remaining final block
    if (cardTextBodyList.length > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const bodyStr = cardTextBodyList.join('\n\n');
      const wrappedText = doc.splitTextToSize(bodyStr, 172);
      const height = wrappedText.length * 5.2 + 10;
      
      handlePageBreak(height + 15);
      drawSectionHeader(doc, cardTitle, 'LEARNING MATERIAL', currentY, COLORS.midIndigo, COLORS.darkNavy, COLORS.midIndigo);
      currentY += 14;

      drawCard(doc, currentY, height, COLORS.midIndigo);
      setTextColorHex(doc, COLORS.darkText);
      wrappedText.forEach((line: string, lineIndex: number) => {
        doc.text(line, 20, currentY + 7 + lineIndex * 5.2);
      });
      currentY += height + 8;
    }
  }

  // ━━━ 6. ANSWER KEY PAGE ━━━
  const includeAnswerKey = (isExamMode || parsed.mcqs.length > 0 || parsed.shorts.length > 0 || parsed.longs.length > 0) && !mergedOptions.isAnswerKey && mergedOptions.isSolved !== false;
  if (includeAnswerKey) {
    doc.addPage();
    currentY = 32;

    // Same styled dark header is drawn through overlay loop
    // Heading: "Answer Key"
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    setTextColorHex(doc, COLORS.darkNavy);
    doc.text('Answer Key & Marking Scheme', 14, currentY + 6);

    // Underline
    setDrawColorHex(doc, COLORS.midIndigo);
    doc.setLineWidth(1.0);
    doc.line(14, currentY + 9, 85, currentY + 9);
    currentY += 16;

    // MCQ Answer Table
    if (parsed.mcqs.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      setTextColorHex(doc, COLORS.darkNavy);
      doc.text('SECTION A: MULTIPLE CHOICE CORRECT RESPONSES', 14, currentY);
      currentY += 5;

      const rightColorRGB = hexToRgb(COLORS.primaryIndigo);
      const darkNavyRGB = hexToRgb(COLORS.darkNavy);
      const lightIndigoRGB = hexToRgb(COLORS.indigoTint);
      const darkTextRGB = hexToRgb(COLORS.darkText);

      const tableData = parsed.mcqs.map((q, num) => {
        let qShort = q.question;
        if (qShort.length > 55) qShort = qShort.substring(0, 52) + '...';
        return [
          `Q${num + 1}`,
          qShort,
          q.correctAnswer,
          q.explanation || 'No further grading explanation provided.'
        ];
      });

      (doc as any).autoTable({
        startY: currentY,
        head: [["Q#", "Question (short)", "Answer", "Explanation"]],
        headStyles: { fillColor: darkNavyRGB, textColor: 255, fontStyle: 'bold', fontSize: 9 },
        alternateRowStyles: { fillColor: lightIndigoRGB },
        bodyStyles: { fontSize: 8.5, textColor: darkTextRGB },
        columnStyles: {
          0: { cellWidth: 10, halign: 'center' },
          1: { cellWidth: 60 },
          2: { cellWidth: 35, halign: 'center', textColor: rightColorRGB, fontStyle: 'bold' },
          3: { cellWidth: 77 }
        },
        tableLineColor: [226, 232, 240],
        tableLineWidth: 0.3,
        margin: { left: 14, right: 14 },
        didDrawPage: (data: any) => {
          currentY = data.cursor.y + 12;
        }
      });
    }

    // Short Questions Model Answers Table/Cards
    if (parsed.shorts.length > 0) {
      handlePageBreak(25);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      setTextColorHex(doc, COLORS.darkNavy);
      doc.text('SECTION B: SHORT QUESTION GRADING RUBRIC', 14, currentY);
      currentY += 8;

      parsed.shorts.forEach((q, idx) => {
        const titleText = `Q${idx + 1}: ${q.question.length > 60 ? q.question.substring(0, 57) + '...' : q.question}`;
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        const wrappedAnswer = doc.splitTextToSize(`Model Answer: ${q.modelAnswer}`, 172);
        const cardHeight = wrappedAnswer.length * 5 + 14;

        handlePageBreak(cardHeight + 10);
        
        // Render Model Answer Card in Green accent
        drawCard(doc, currentY, cardHeight, COLORS.emerald);
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        setTextColorHex(doc, COLORS.emerald);
        doc.text(titleText, 20, currentY + 5.5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.5);
        setTextColorHex(doc, COLORS.darkText);
        wrappedAnswer.forEach((line: string, lIdx: number) => {
          doc.text(line, 20, currentY + 11.5 + (lIdx * 5));
        });

        currentY += cardHeight + 6;
      });
    }

    // Long Questions Model Answers Cards
    if (parsed.longs.length > 0) {
      handlePageBreak(25);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      setTextColorHex(doc, COLORS.darkNavy);
      doc.text('SECTION C: DETAILED ESSAY MARKING RUBRIC', 14, currentY);
      currentY += 8;

      parsed.longs.forEach((q, idx) => {
        const titleText = `Q${idx + 1}: ${q.question.length > 60 ? q.question.substring(0, 57) + '...' : q.question}`;
        
        const ptStr = q.keyPoints && q.keyPoints.length > 0 ? '\n\nCritical Success Grading Points:\n' + q.keyPoints.map(kp => `• ${kp}`).join('\n') : '';
        const bodyContent = `Model Answer Essay:\n${q.modelAnswer}${ptStr}`;
        const wrappedGrading = doc.splitTextToSize(bodyContent, 172);
        const cardHeight = wrappedGrading.length * 5 + 14;

        handlePageBreak(cardHeight + 10);
        
        // Draw Model Assignment rubric card
        drawCard(doc, currentY, cardHeight, COLORS.emerald);
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        setTextColorHex(doc, COLORS.emerald);
        doc.text(titleText, 20, currentY + 5.5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        setTextColorHex(doc, COLORS.darkText);
        wrappedGrading.forEach((line: string, lIdx: number) => {
          doc.text(line, 20, currentY + 11.5 + (lIdx * 5));
        });

        currentY += cardHeight + 6;
      });
    }
  }

  // ━━━ OVERLAY STEP (HEADERS, FOOTERS & WATERMARKS) ━━━
  const totalPagesCount = doc.getNumberOfPages();
  for (let pageIdx = 1; pageIdx <= totalPagesCount; pageIdx++) {
    doc.setPage(pageIdx);
    
    // Page 1 of exam assessment mode is exclusive cover page
    if (isExamMode && pageIdx === 1) {
      // Background styled cover page already handles its layout inside its function
      continue;
    }

    // Regular page overlay: Watermarks drawn first, then Dark Header and Dark Footer overlays
    drawWatermarks(doc);
    drawDarkHeader(doc, title, pageIdx, totalPagesCount);
    drawDarkFooter(doc);
  }

  // File naming resolution
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();

  const cleanTitle = title.replace(/\s+/g, '_');
  const dStamp = `${day}${month}${year}`;
  let finalFilename = `EduGen_Material_${cleanTitle}_${dStamp}.pdf`;

  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes('mcq')) {
    finalFilename = `EduGen_MCQ_${topic.replace(/\s+/g, '_')}_${dStamp}.pdf`;
  } else if (lowerTitle.includes('short q')) {
    finalFilename = `EduGen_ShortQ_${topic.replace(/\s+/g, '_')}_${dStamp}.pdf`;
  } else if (lowerTitle.includes('essay') || lowerTitle.includes('long q')) {
    finalFilename = `EduGen_LongQ_${topic.replace(/\s+/g, '_')}_${dStamp}.pdf`;
  } else if (lowerTitle.includes('lesson') || lowerTitle.includes('explain')) {
    finalFilename = `EduGen_Explainer_${topic.replace(/\s+/g, '_')}_${dStamp}.pdf`;
  } else if (lowerTitle.includes('story')) {
    finalFilename = `EduGen_Story_${topic.replace(/\s+/g, '_')}_${dStamp}.pdf`;
  } else if (lowerTitle.includes('letter')) {
    finalFilename = `EduGen_Letter_${topic.replace(/\s+/g, '_')}_${dStamp}.pdf`;
  } else if (isExamMode || lowerTitle.includes('exam')) {
    finalFilename = `EduGen_ExamPaper_${topic.replace(/\s+/g, '_')}_${dStamp}.pdf`;
  }

  doc.save(finalFilename);
};
