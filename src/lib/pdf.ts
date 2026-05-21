import jsPDF from 'jspdf';
import 'jspdf-autotable';

export interface PDFItem {
  type: 'heading' | 'subheading' | 'text' | 'blankLines';
  text?: string;
  count?: number;
}

export interface PDFOptions {
  isExam?: boolean;
  isAnswerKey?: boolean;
}

// ━━━ EXACT PAGE METRICS (A4) ━━━
const PAGE_HEIGHT = 297;
const PAGE_WIDTH = 210;
const MARGIN_LEFT = 14;
const MARGIN_RIGHT = 14;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT; // 182mm
const CONTENT_START_Y = 32;    // content starts here
const FOOTER_START_Y = 268;    // content must stop here

// Draw the custom Book Icon
function drawBookIcon(
  doc: jsPDF, 
  x: number, 
  y: number, 
  sizeMultiplier: number, 
  skipOuterBox = false,
  pageColor: [number, number, number] = [255, 255, 255],
  spineColor: [number, number, number] = [199, 210, 254]
) {
  if (!skipOuterBox) {
    // Fill color for box: #6366F1
    doc.setFillColor(99, 102, 241);
    doc.roundedRect(
      x, 
      y, 
      10 * sizeMultiplier, 
      10 * sizeMultiplier, 
      2 * sizeMultiplier, 
      2 * sizeMultiplier, 
      'F'
    );
  }

  // Book Pages: pageColor
  doc.setFillColor(pageColor[0], pageColor[1], pageColor[2]);
  
  // Left page
  doc.rect(
    x + 1 * sizeMultiplier, 
    y + 2 * sizeMultiplier, 
    3.5 * sizeMultiplier, 
    6 * sizeMultiplier, 
    'F'
  );
  
  // Right page
  doc.rect(
    x + 5.5 * sizeMultiplier, 
    y + 2 * sizeMultiplier, 
    3.5 * sizeMultiplier, 
    6 * sizeMultiplier, 
    'F'
  );

  // Spine line: spineColor
  doc.setDrawColor(spineColor[0], spineColor[1], spineColor[2]);
  doc.setLineWidth(0.4 * sizeMultiplier);
  doc.line(
    x + 5 * sizeMultiplier, 
    y + 2 * sizeMultiplier, 
    x + 5 * sizeMultiplier, 
    y + 8 * sizeMultiplier
  );
}

// ━━━ HEADER DRAWING FUNCTION ━━━
function drawHeader(doc: jsPDF, title: string, pageNum: number, totalPages: number) {
  doc.saveGraphicsState();
  
  // Gradient background rectangle
  doc.setFillColor(99, 102, 241);  // #6366F1
  doc.rect(0, 0, PAGE_WIDTH, 22, 'F');

  // Logo icon box (white rounded square inside header)
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(MARGIN_LEFT, 4, 10, 10, 2, 2, 'F');
  
  // Draw small brand blue book inside logo container
  drawBookIcon(doc, MARGIN_LEFT, 4, 1, true, [99, 102, 241], [199, 210, 254]);

  // "EduGen" text (white, on gradient)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(255, 255, 255);
  doc.text('EduGen', MARGIN_LEFT + 12, 11);

  // Tagline (white, smaller)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(199, 210, 254);  // #C7D2FE
  doc.text('AI Learning Toolkit', MARGIN_LEFT + 12, 16);

  // Document title (center)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  let truncatedTitle = title;
  if (truncatedTitle.length > 35) {
    truncatedTitle = truncatedTitle.substring(0, 32) + "...";
  }
  doc.text(truncatedTitle, PAGE_WIDTH / 2, 12, { align: 'center' });

  // edugen.app (center, below title)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(199, 210, 254);
  doc.text('edugen.app', PAGE_WIDTH / 2, 18, { align: 'center' });

  // Page number (right)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(`Page ${pageNum} of ${totalPages}`, PAGE_WIDTH - MARGIN_RIGHT, 12, { align: 'right' });

  // Bottom border line of header
  doc.setDrawColor(165, 180, 252);  // #A5B4FC
  doc.setLineWidth(0.5);
  doc.line(0, 22, PAGE_WIDTH, 22);

  doc.restoreGraphicsState();
}

// ━━━ FOOTER DRAWING FUNCTION ━━━
function drawFooter(doc: jsPDF, generatedDate: string) {
  doc.saveGraphicsState();
  
  // Top line of footer
  doc.setDrawColor(226, 232, 240);  // #E2E8F0
  doc.setLineWidth(0.3);
  doc.line(MARGIN_LEFT, 272, PAGE_WIDTH - MARGIN_RIGHT, 272);

  // Mini logo icon (fill with brand color)
  doc.setFillColor(99, 102, 241);
  doc.roundedRect(MARGIN_LEFT, 274, 5, 5, 1, 1, 'F');
  
  // Draw book pages inside
  drawBookIcon(doc, MARGIN_LEFT, 274, 0.5, true, [255, 255, 255], [199, 210, 254]);

  // Footer left: EduGen text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(99, 102, 241);
  doc.text('EduGen', MARGIN_LEFT + 6.5, 278);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(148, 163, 184);  // #94A3B8
  doc.text('AI Learning Toolkit', MARGIN_LEFT + 22, 278);

  // Footer center: date
  doc.setFontSize(8);
  doc.text(`Generated: ${generatedDate}`, PAGE_WIDTH / 2, 278, { align: 'center' });

  // Footer right: confidential
  doc.text('Confidential — Student Use Only', PAGE_WIDTH - MARGIN_RIGHT, 278, { align: 'right' });

  doc.restoreGraphicsState();
}

// Draw the Custom Cover Page for Exams
function drawCoverPage(doc: jsPDF, title: string) {
  const pageWidth = doc.internal.pageSize.getWidth();
  
  doc.saveGraphicsState();
  
  // Centered Prominent Logo Box (20mm x 20mm) at y = 35mm
  drawBookIcon(doc, 95, 35, 2);
  
  // "EduGen" Text below
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(99, 102, 241); // #6366F1
  doc.text("EduGen", 105, 63, { align: 'center' });
  
  // Tagline below
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(148, 163, 184); // #94A3B8
  doc.text("AI Learning Toolkit", 105, 71, { align: 'center' });
  
  // Separator Line
  doc.setDrawColor(99, 102, 241); // #6366F1
  doc.setLineWidth(0.8);
  doc.line(20, 78, pageWidth - 20, 78);
  
  // Title / Headers
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42); // #0F172A
  doc.text("OFFICIAL PRACTICE PAPER", 105, 100, { align: 'center' });
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(99, 102, 241); // #6366F1
  doc.text(title, 105, 115, { align: 'center' });
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(100, 116, 139);
  doc.text(`Date of Assessment: ${new Date().toLocaleDateString()}`, 105, 132, { align: 'center' });
  
  // Instructions
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42); // #0F172A
  doc.text("Instructions to Candidates:", 40, 165);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text("1. This paper contains Multiple Choice, Short Answers and Essay questions.", 40, 175);
  doc.text("2. Review all questions thoroughly before attempting to draft responses.", 40, 183);
  doc.text("3. Work independently. This document is intended for private study use.", 40, 191);
  
  // Cover Footer
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(99, 102, 241); // #6366F1
  doc.text("edugen.app", 105, 260, { align: 'center' });
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184); // #94A3B8
  doc.text("© EduGen AI. All rights reserved.", 105, 266, { align: 'center' });
  
  doc.restoreGraphicsState();
}

// Draw watermarks (Layer 1 & Layer 2)
function drawWatermarks(doc: jsPDF, isAnswerKey: boolean) {
  const opacity = isAnswerKey ? 0.04 : 0.05;
  const GStateClass = (doc as any).GState || (jsPDF as any).GState;
  
  doc.saveGraphicsState();
  
  if (GStateClass) {
    doc.setGState(new GStateClass({ opacity }));
  }
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(40);
  doc.setTextColor(99, 102, 241); // #6366F1
  
  doc.text("EDUGEN · PRACTICE · FILE", 105, 100, { angle: -30, align: 'center' });
  doc.text("EDUGEN · PRACTICE · FILE", 105, 180, { angle: -30, align: 'center' });
  
  const fillOpacity = isAnswerKey ? 0.03 : 0.04;
  if (GStateClass) {
    doc.setGState(new GStateClass({ opacity: fillOpacity }));
  }
  doc.setFillColor(99, 102, 241); // #6366F1
  doc.roundedRect(90, 133.5, 30, 30, 7, 7, 'F');
  
  if (GStateClass) {
    doc.setGState(new GStateClass({ opacity }));
  }
  doc.setDrawColor(99, 102, 241); // #6366F1
  doc.setLineWidth(0.176); // 0.5pt
  doc.roundedRect(90, 133.5, 30, 30, 7, 7, 'S');
  
  drawBookIcon(doc, 90, 133.5, 3, true, [99, 102, 241], [199, 210, 254]);
  
  doc.restoreGraphicsState();
}

// Answer text indicator check
const isAnswerText = (text?: string): boolean => {
  if (!text) return false;
  const lower = text.toLowerCase();
  return lower.includes('correct answer') || 
         lower.includes('model answer') || 
         lower.includes('recommended answer') || 
         lower.includes('model essay') ||
         lower.includes('feedback') || 
         lower.includes('score:') || 
         lower.includes('grade');
};

export const generatePDF = (title: string, content: PDFItem[], options?: PDFOptions) => {
  const doc = new jsPDF();
  const isExamMode = !!options?.isExam;
  
  // Timestamp formatting for footer
  const now = new Date();
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const hours = String(now.getHours()).padStart(2, '0');
  const mins = String(now.getMinutes()).padStart(2, '0');
  const formattedDateTime = `${day}/${month}/${year} at ${hours}:${mins}`;

  // Check if this document contains student answers or is explicitly an answer key
  const detectAnswerKeyState = options?.isAnswerKey || content.some(item => isAnswerText(item.text));

  // --- RENDERING PASS ---
  let currentY = CONTENT_START_Y;
  
  // If in Exam mode, Page 1 is always the cover page. Content loop must start on Page 2!
  if (isExamMode) {
    doc.addPage();
    currentY = CONTENT_START_Y; // start content below header safety margin
  }

  // Page broke helper (returns next currentY)
  const checkPageBreak = (neededHeight: number) => {
    if (currentY + neededHeight > FOOTER_START_Y) {
      doc.addPage();
      currentY = CONTENT_START_Y;
    }
  };

  // 1. Draw Student Information Box if not in Exam cover page
  if (!isExamMode) {
    // Spacing rules: "After student info box: currentY += 28mm"
    doc.saveGraphicsState();
    doc.setDrawColor(226, 232, 240); // #E2E8F0
    doc.setFillColor(248, 250, 252); // Slate 50
    doc.setLineWidth(0.5);
    doc.roundedRect(MARGIN_LEFT, currentY, CONTENT_WIDTH, 24, 2, 2, 'FD');

    // Box content
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(99, 102, 241); // #6366F1
    doc.text('Assessment Resource', MARGIN_LEFT + 6, currentY + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42); // #0F172A
    doc.text(title, MARGIN_LEFT + 6, currentY + 14);

    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // #94A3B8
    doc.text(`Subject: Academic Study Resource`, MARGIN_LEFT + 6, currentY + 20);

    const todayDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    doc.text(`Date: ${todayDate}`, PAGE_WIDTH - MARGIN_RIGHT - 6, currentY + 20, { align: 'right' });
    doc.restoreGraphicsState();

    currentY += 28; 
  } else {
    // Draw an instructions box: currentY += 10mm
    doc.saveGraphicsState();
    doc.setDrawColor(199, 210, 254); // #C7D2FE
    doc.setFillColor(245, 247, 255);
    doc.roundedRect(MARGIN_LEFT, currentY, CONTENT_WIDTH, 12, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(99, 102, 241);
    doc.text('EXAMINATION PROTOCOL:', MARGIN_LEFT + 5, currentY + 5.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text('Read all prompts properly. Answer all sub-sections comprehensively.', MARGIN_LEFT + 5, currentY + 9.5);
    doc.restoreGraphicsState();

    currentY += 16;
  }

  // Render content items
  content.forEach((item) => {
    doc.saveGraphicsState();
    
    if (item.type === 'heading') {
      // heading spacing rule: currentY += 10mm
      checkPageBreak(15);
      doc.setFontSize(13);
      doc.setTextColor(99, 102, 241); // Brand Indigo
      doc.setFont('helvetica', 'bold');
      doc.text(item.text || '', MARGIN_LEFT, currentY + 6);
      currentY += 10;
    } 
    else if (item.type === 'subheading') {
      // Ensure subheading question block has sufficient starting space to avoid layout orphans
      if (currentY + 24 > FOOTER_START_Y) {
        doc.addPage();
        currentY = CONTENT_START_Y;
      } else {
        checkPageBreak(12);
      }
      doc.setFontSize(10.5);
      doc.setTextColor(51, 65, 85); // Slate 700
      doc.setFont('helvetica', 'bold');
      doc.text(item.text || '', MARGIN_LEFT, currentY + 5);
      currentY += 8;
    } 
    else if (item.type === 'text') {
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42); 
      doc.setFont('helvetica', 'normal');
      
      const textLines = doc.splitTextToSize(item.text || '', CONTENT_WIDTH);
      
      textLines.forEach((line: string) => {
        checkPageBreak(6);
        doc.text(line, MARGIN_LEFT, currentY + 4);
        currentY += 6;
      });
      // Small paragraph separation
      currentY += 2;
    } 
    else if (item.type === 'blankLines') {
      const count = item.count || 1;
      for (let i = 0; i < count; i++) {
        checkPageBreak(8);
        doc.setDrawColor(226, 232, 240); // Slate 200
        doc.setLineWidth(0.3);
        doc.line(MARGIN_LEFT, currentY + 4, PAGE_WIDTH - MARGIN_RIGHT, currentY + 4);
        currentY += 8;
      }
      currentY += 2;
    }
    
    doc.restoreGraphicsState();
  });

  // --- SECOND PASS: HEADER & FOOTER OVERLAY ---
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    if (isExamMode && p === 1) {
      // Cover page rendering on page 1 of exam assessments
      drawCoverPage(doc, title);
    } else {
      // Background watermarks
      drawWatermarks(doc, detectAnswerKeyState);
      // Header & footer layout placement inside safety zones
      drawHeader(doc, title, p, totalPages);
      drawFooter(doc, formattedDateTime);
    }
  }

  doc.save(`${title.replace(/\s+/g, '_')}_EduGen.pdf`);
};
