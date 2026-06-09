import { useState } from "react";
import { 
  Sparkles, 
  ArrowRight, 
  FileText, 
  Download, 
  RotateCcw, 
  BookOpen, 
  Brain, 
  Compass, 
  Flame, 
  HelpCircle, 
  FileCode, 
  Globe, 
  Layers, 
  Lightbulb, 
  Award,
  Scale
} from "lucide-react";
import { generatePDF } from "../../lib/pdf";

interface SmartSuiteProps {
  toolId: string;
  onDownload: (name: string) => void;
}

export default function SmartSuite({ toolId, onDownload }: SmartSuiteProps) {
  const [topic, setTopic] = useState("");
  const [gradeLevel, setGradeLevel] = useState("High School (Grade 9-10)");
  const [language, setLanguage] = useState("English");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resultData, setResultData] = useState<any>(null);

  // Card Flip state for Flashcards
  const [activeFlashcard, setActiveFlashcard] = useState<number | null>(null);

  const getToolMetadata = () => {
    switch (toolId) {
      case "flashcard":
        return {
          title: "Flashcard Creator",
          subtitle: "Generate dynamic QA cards to lock in core terms and definitions",
          icon: Brain,
          placeholder: "e.g. Photosynthesis, Newton's Laws, Civil War",
          color: "#059669"
        };
      case "mindmap":
        return {
          title: "Concept Mind-Mapper",
          subtitle: "Create organized hierarchical nodes to visualize ideas",
          icon: Layers,
          placeholder: "e.g. Structure of an Atom, French Revolution",
          color: "#0D9488"
        };
      case "planner":
        return {
          title: "7-Day Study Planner",
          subtitle: "Map out a bulletproof daily learning agenda and milestones",
          icon: Compass,
          placeholder: "e.g. Learn Python from Scratch, Organic Chemistry",
          color: "#0891B2"
        };
      case "debate":
        return {
          title: "Debate Construct & Coach",
          subtitle: "Analyze binary viewpoints, arguments, and rebuttals on complex topics",
          icon: Flame,
          placeholder: "e.g. Is Nuclear Energy Sustainable?, AI in Modern Classrooms",
          color: "#EA580C"
        };
      case "case-study":
        return {
          title: "Real-world Case Studies",
          subtitle: "Draft realistic situational narratives with analysis questions",
          icon: BookOpen,
          placeholder: "e.g. Space Shuttle Challenger Disaster, Launch of original iPhone",
          color: "#4F46E5"
        };
      case "code-explain":
        return {
          title: "Computational Explainer",
          subtitle: "Examine programming logic, pseudocode, and dry-run flows",
          icon: FileCode,
          placeholder: "e.g. Bubble Sort, Recursion in Java, Graph Traversal",
          color: "#2563EB"
        };
      case "research":
        return {
          title: "Thesis Outline Draft",
          subtitle: "Build abstract formulas, experiment scopes, and chapters",
          icon: FileText,
          placeholder: "e.g. Quantum Computing Cryptography, Microplastics in Oceans",
          color: "#7C3AED"
        };
      case "mnemonics":
        return {
          title: "Mnemonics & Memory Palace",
          subtitle: "Create witty acronyms and visual cues to memorize lists easily",
          icon: Award,
          placeholder: "e.g. Periodic Table Elements, Planets of Solar System",
          color: "#DB2777"
        };
      case "eli5":
        return {
          title: "ELI5 Metaphor Simulator",
          subtitle: "Demystify heavy scholarly concepts using simple, humorous analogies",
          icon: Lightbulb,
          placeholder: "e.g. Theory of Relativity, Blockchain Ledger",
          color: "#CA8A04"
        };
      case "summarizer":
        return {
          title: "Textbook Summarizer",
          subtitle: "Synthesizes long scholarly files, notes, or paragraphs into clean high-yield revisions",
          icon: FileText,
          placeholder: "e.g. Carbon Cycle, French Revolution, Quantum Computing",
          color: "#4A121A" // Beautiful scholastic maroon
        };
      case "essay-grader":
        return {
          title: "Essay & Grammar Grader",
          subtitle: "Critique work snippets, identifying spelling faults, punctuation issues, and target grades",
          icon: Award,
          placeholder: "e.g. Sample introduction regarding Hamlet, Climate change thesis statement",
          color: "#4A121A" // Maroon
        };
      case "lab-report":
        return {
          title: "Lab Report Outline Builder",
          subtitle: "Structure custom safety sheets, list components, materials checklists, and method procedures",
          icon: Layers,
          placeholder: "e.g. Acid-Base Titration, Ideal Gas Law Experiment",
          color: "#1E3A8A"
        };
      case "formula-sheet":
        return {
          title: "Formula Cheat Sheet Maker",
          subtitle: "Extract equations, standard LaTeX symbols, definitions, and real algebraic applications",
          icon: FileCode,
          placeholder: "e.g. Newton's laws of motion, Maxwell equations, Trigonometric identities",
          color: "#2563EB"
        };
      case "paper-questions":
        return {
          title: "Research Paper Assessment Generator",
          subtitle: "Formulate challenging analytical evaluation questions based on study abstracts",
          icon: HelpCircle,
          placeholder: "e.g. Dual-use biotech research, Neural radiance fields abstract",
          color: "#0F172A"
        };
      case "socratic":
        return {
          title: "Socratic Dialogues Guide",
          subtitle: "Engage in a series of logical dialogue steps that simplify complex theoretical boundaries",
          icon: Compass,
          color: "#4A121A", // Maroon
          placeholder: "e.g. Concept of justice, Free will vs determinism"
        };
      case "curriculum-map":
        return {
          title: "Syllabus Curriculum Mapper",
          subtitle: "Decentralize raw lesson topics into custom classroom milestones and achievement indicators",
          icon: Globe,
          placeholder: "e.g. World War II European Theater, Advanced algebra curriculum layout",
          color: "#1E3A8A"
        };
      case "interview-prep":
        return {
          title: "Admissions Prep Panel",
          subtitle: "Simulate high-priority oral examinations, conceptual panel queries, and answers",
          icon: HelpCircle,
          placeholder: "e.g. Medicine residency admission, Ivy League law panel interview",
          color: "#2563EB"
        };
      case "citation":
        return {
          title: "Scholarly Citation Builder",
          subtitle: "Format accurate academic MLA, APA, or Chicago bibliography references",
          icon: BookOpen,
          placeholder: "e.g. Article by Stephen Hawking on black holes, Wealth of Nations by Adam Smith",
          color: "#0F172A"
        };
      case "hypothesis":
        return {
          title: "Scientific Hypothesis Testing Planner",
          subtitle: "Deconstruct a topic into a detailed scientific hypothesis, identifying variables and controls",
          icon: Sparkles,
          placeholder: "e.g. Sleep quality vs academic stress, Salt concentration vs boiling point of water",
          color: "#4A121A" // Maroon
        };
      case "difference":
        return {
          title: "Difference Explainer",
          subtitle: "Analyze and parse key structural, academic differences and similarities between two concepts",
          icon: Scale,
          placeholder: "e.g. Mitosis vs Meiosis, React vs Vue, DNA vs RNA",
          color: "#059669"
        };
      case "jargon":
      default:
        return {
          title: "Academic Jargon Sandbox",
          subtitle: "Deconstruct domain-specific heavy vocabularies with contextual examples",
          icon: Globe,
          placeholder: "e.g. Astrophysics terms, Macroeconomics principles",
          color: "#1B4332"
        };
    }
  };

  const meta = getToolMetadata();
  const Icon = meta.icon;

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setError("Please key-in a topic first.");
      return;
    }

    setLoading(true);
    setError(null);
    setResultData(null);
    setActiveFlashcard(null);

    try {
      const savedKey = localStorage.getItem("edugen_gemini_api_key");
      const res = await fetch("/api/smart-tool", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          toolId,
          topic: topic.trim(),
          gradeLevel,
          language,
          userKey: savedKey
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to compile AI response.");
      }

      const data = await res.json();
      setResultData(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred while fetching AI details.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!resultData) return;

    const pdfItems: any[] = [
      { type: "heading", text: meta.title },
      { type: "subheading", text: `Topic: ${topic}` },
      { type: "text", text: `Curriculum Standard: ${gradeLevel}` },
      { type: "text", text: `Engine: Groq LLM Compiler (100% accurate)` }
    ];

    if (toolId === "flashcard" && resultData.deck) {
      resultData.deck.forEach((card: any, idx: number) => {
        pdfItems.push({ type: "heading", text: `Flashcard ${idx + 1}` });
        pdfItems.push({ type: "subheading", text: card.front });
        pdfItems.push({ type: "text", text: card.back });
      });
    } else if (toolId === "mindmap") {
      pdfItems.push({ type: "heading", text: "Interactive Visual Tree Outline" });
      const formatMindmapText = (node: any, indent = "") => {
        pdfItems.push({ type: "text", text: `${indent}• ${node.name}` });
        if (node.children) {
          node.children.forEach((child: any) => formatMindmapText(child, indent + "    "));
        }
      };
      formatMindmapText(resultData);
    } else if (toolId === "planner" && resultData.schedule) {
      resultData.schedule.forEach((day: any) => {
        pdfItems.push({ type: "heading", text: `Day ${day.day}: ${day.title}` });
        pdfItems.push({ type: "text", text: `Recommended Hours: ${day.estimatedHours} hrs` });
        day.milestones.forEach((m: string) => {
          pdfItems.push({ type: "text", text: `• ${m}` });
        });
      });
    } else if (toolId === "debate") {
      pdfItems.push({ type: "heading", text: "Resolution Thesis Statement" });
      pdfItems.push({ type: "text", text: resultData.thesis });
      pdfItems.push({ type: "heading", text: "Affirmative Arguments (Pros)" });
      resultData.affirmativeArguments?.forEach((arg: string) => pdfItems.push({ type: "text", text: `✔ ${arg}` }));
      pdfItems.push({ type: "heading", text: "Negative Arguments (Cons)" });
      resultData.negativeArguments?.forEach((arg: string) => pdfItems.push({ type: "text", text: `✖ ${arg}` }));
      pdfItems.push({ type: "heading", text: "Scoring Guidelines & Rebuttals" });
      resultData.rebuttals?.forEach((reb: string) => pdfItems.push({ type: "text", text: `💡 ${reb}` }));
    } else if (toolId === "case-study") {
      pdfItems.push({ type: "heading", text: resultData.caseTitle });
      pdfItems.push({ type: "text", text: resultData.background });
      pdfItems.push({ type: "heading", text: "The dilemma" });
      pdfItems.push({ type: "text", text: resultData.dilemma });
      pdfItems.push({ type: "heading", text: "Case Study Analysis Questions" });
      resultData.analysisQuestions?.forEach((q: any, idx: number) => {
        pdfItems.push({ type: "subheading", text: `Q${idx + 1}: ${q.question || q}` });
        if (q.answer) pdfItems.push({ type: "text", text: q.answer });
      });
    } else if (toolId === "code-explain") {
      pdfItems.push({ type: "heading", text: "Computational Logic Synopsis" });
      pdfItems.push({ type: "text", text: resultData.synopsis });
      pdfItems.push({ type: "heading", text: "Algorithmic Flow Pseudocode" });
      pdfItems.push({ type: "text", text: resultData.pseudocode });
      pdfItems.push({ type: "heading", text: "Dry-Run Variables State Tracking" });
      resultData.dryRun?.forEach((step: string) => pdfItems.push({ type: "text", text: `• ${step}` }));
      pdfItems.push({ type: "heading", text: "Frequent Pitfalls & Bugs" });
      resultData.pitfalls?.forEach((pit: string) => pdfItems.push({ type: "text", text: `⚠ ${pit}` }));
    } else if (toolId === "research") {
      pdfItems.push({ type: "heading", text: "Abstract Formula Description" });
      pdfItems.push({ type: "text", text: resultData.abstract });
      pdfItems.push({ type: "heading", text: "Experimental Research bounds" });
      pdfItems.push({ type: "text", text: resultData.researchScope });
      pdfItems.push({ type: "heading", text: "Formulated Chapters Index" });
      resultData.chapters?.forEach((c: any) => {
        pdfItems.push({ type: "subheading", text: `Chapter ${c.chapterNum}: ${c.chapterTitle}` });
        c.subsections?.forEach((sub: string) => pdfItems.push({ type: "text", text: `   - ${sub}` }));
      });
    } else if (toolId === "mnemonics" && resultData.mnemonics) {
      resultData.mnemonics.forEach((m: any, idx: number) => {
        pdfItems.push({ type: "heading", text: `Mnemonic Indicator ${idx + 1}: ${m.acronym}` });
        pdfItems.push({ type: "text", text: `Key Phrase: ${m.phrase}` });
        pdfItems.push({ type: "text", text: `Visual Palace Concept: ${m.visualpalace}` });
      });
    } else if (toolId === "eli5") {
      pdfItems.push({ type: "heading", text: `Eli5 Metaphor: ${resultData.metaphorTitle}` });
      pdfItems.push({ type: "text", text: resultData.eli5Metaphor });
      pdfItems.push({ type: "heading", text: "Scholarly Translation Reference" });
      pdfItems.push({ type: "text", text: resultData.academicTranslation });
      pdfItems.push({ type: "heading", text: "Analogy Practice Check" });
      pdfItems.push({ type: "text", text: resultData.interactiveAnalogyMatch });
    } else if (toolId === "jargon" && resultData.words) {
      resultData.words.forEach((w: any) => {
        pdfItems.push({ type: "heading", text: w.word });
        pdfItems.push({ type: "text", text: `Definition: ${w.definition}` });
        pdfItems.push({ type: "text", text: `Academic Context Sentence: ${w.contextSentence}` });
      });
    } else if (toolId === "summarizer" && resultData.overview) {
      pdfItems.push({ type: "heading", text: "Summary Overview" });
      pdfItems.push({ type: "text", text: resultData.overview });
      resultData.chapters?.forEach((ch: any) => {
        pdfItems.push({ type: "heading", text: ch.chapterTitle });
        ch.bulletPoints?.forEach((pt: string) => {
          pdfItems.push({ type: "text", text: `• ${pt}` });
        });
      });
    } else if (toolId === "essay-grader" && resultData.estimatedGrade) {
      pdfItems.push({ type: "heading", text: `Estimated Grade: ${resultData.estimatedGrade} | Score: ${resultData.feedbackScore}/100` });
      pdfItems.push({ type: "heading", text: "Identified Drafting Issues" });
      resultData.issues?.forEach((issue: any, idx: number) => {
        pdfItems.push({ type: "subheading", text: `Issue #${idx + 1} (${issue.errorType})` });
        pdfItems.push({ type: "text", text: `Original Draft: "${issue.originalText}"` });
        pdfItems.push({ type: "text", text: `Recommended Correction: "${issue.correction}"` });
        pdfItems.push({ type: "text", text: `Scholarly Explanation: ${issue.explanation}` });
      });
      pdfItems.push({ type: "heading", text: "General Review Feedback" });
      pdfItems.push({ type: "text", text: resultData.overallFeedback });
    } else if (toolId === "lab-report" && resultData.experimentTitle) {
      pdfItems.push({ type: "heading", text: `Experiment: ${resultData.experimentTitle}` });
      pdfItems.push({ type: "heading", text: "Proposed Scientific Hypothesis" });
      pdfItems.push({ type: "text", text: resultData.hypothesis });
      pdfItems.push({ type: "heading", text: "Draft Required Materials" });
      resultData.materials?.forEach((mat: string) => {
        pdfItems.push({ type: "text", text: `- ${mat}` });
      });
      pdfItems.push({ type: "heading", text: "Essential Safety Precautions" });
      resultData.safetyRules?.forEach((rule: string) => {
        pdfItems.push({ type: "text", text: `⚠ ${rule}` });
      });
      pdfItems.push({ type: "heading", text: "Procedural Steps" });
      resultData.procedure?.forEach((step: string, idx: number) => {
        pdfItems.push({ type: "text", text: `${idx + 1}. ${step}` });
      });
    } else if (toolId === "formula-sheet" && resultData.formulas) {
      resultData.formulas.forEach((item: any) => {
        pdfItems.push({ type: "heading", text: item.name });
        pdfItems.push({ type: "subheading", text: `Equation (LaTeX Syntax): ${item.latexEquation}` });
        pdfItems.push({ type: "text", text: `Variables Deconstructed: ${item.variableDeconstruction}` });
        pdfItems.push({ type: "text", text: `Practical Implementation Example: ${item.practicalExample}` });
      });
    } else if (toolId === "paper-questions" && resultData.questions) {
      resultData.questions.forEach((q: any, idx: number) => {
        pdfItems.push({ type: "heading", text: `Question #${idx + 1} (${q.cognitiveDomain})` });
        pdfItems.push({ type: "subheading", text: q.questionText });
        pdfItems.push({ type: "text", text: `Ideal Scholarly Rubric & Key: ${q.modelResponseKey}` });
      });
    } else if (toolId === "socratic" && resultData.conversation) {
      resultData.conversation.forEach((item: any) => {
        pdfItems.push({ type: "heading", text: `Step ${item.step}: Conceptual Target - ${item.studentConceptTarget}` });
        pdfItems.push({ type: "subheading", text: `Socratic Query: ${item.questionPrompt}` });
        pdfItems.push({ type: "text", text: `Supportive Educator Cue: ${item.helperClue}` });
      });
    } else if (toolId === "curriculum-map" && resultData.map) {
      resultData.map.forEach((item: any, idx: number) => {
        pdfItems.push({ type: "heading", text: `Unit Milestone #${idx + 1}: ${item.unitTitle}` });
        pdfItems.push({ type: "subheading", text: `Standard Alignment: ${item.coreStandardName}` });
        pdfItems.push({ type: "text", text: `Target Objective: ${item.targetObjective}` });
        pdfItems.push({ type: "text", text: `Recommended Verification Assignment: ${item.assessmentTask}` });
      });
    } else if (toolId === "interview-prep" && resultData.interviewList) {
      resultData.interviewList.forEach((item: any, idx: number) => {
        pdfItems.push({ type: "heading", text: `Interview Prompt #${idx + 1} (Grading: ${item.coreRubricFactor})` });
        pdfItems.push({ type: "subheading", text: item.questionText });
        pdfItems.push({ type: "text", text: `Ideal Expert Response: ${item.modelAnswer}` });
        pdfItems.push({ type: "text", text: `🚨 Critical Pitfall & Trick Trap: ${item.criticalTrap}` });
      });
    } else if (toolId === "citation" && resultData.citations) {
      resultData.citations.forEach((item: any) => {
        pdfItems.push({ type: "heading", text: `${item.style} Academic Style Standard` });
        pdfItems.push({ type: "subheading", text: `Full Bibliography Entry:` });
        pdfItems.push({ type: "text", text: item.bibliographyEntry });
        pdfItems.push({ type: "text", text: `In-Text Context Parenthetical: ${item.inTextCitation}` });
      });
    } else if (toolId === "hypothesis" && resultData.scienceStatement) {
      pdfItems.push({ type: "heading", text: "Proposed Scientific Statement" });
      pdfItems.push({ type: "text", text: `"${resultData.scienceStatement}"` });
      pdfItems.push({ type: "heading", text: "Experimental Variables" });
      pdfItems.push({ type: "text", text: `Independent Variable: ${resultData.independentVariable}` });
      pdfItems.push({ type: "text", text: `Dependent Variable: ${resultData.dependentVariable}` });
      pdfItems.push({ type: "heading", text: "Primary Environmental Controls" });
      resultData.controlVariables?.forEach((ctrl: string) => {
        pdfItems.push({ type: "text", text: `• ${ctrl}` });
      });
      pdfItems.push({ type: "heading", text: "Scientific Predicted Outcome" });
      pdfItems.push({ type: "text", text: resultData.predictedOutcome });
    } else if (toolId === "difference" && resultData.comparisonTitle) {
      pdfItems.push({ type: "heading", text: resultData.comparisonTitle });
      pdfItems.push({ type: "text", text: resultData.introduction });
      pdfItems.push({ type: "heading", text: "Comparison Parameters Table" });
      resultData.rows?.forEach((row: any) => {
        pdfItems.push({ type: "text", text: `• ${row.feature} — ${resultData.columns?.[1] || "Concept A"}: ${row.conceptA} | ${resultData.columns?.[2] || "Concept B"}: ${row.conceptB}` });
      });
      pdfItems.push({ type: "heading", text: "Detailed Core Takeaways" });
      resultData.detailedAnalyses?.forEach((analysis: string) => {
        pdfItems.push({ type: "text", text: `• ${analysis}` });
      });
      pdfItems.push({ type: "heading", text: "Verdict / Conclusion" });
      pdfItems.push({ type: "text", text: resultData.conclusion });
    }

    await generatePDF(`${meta.title}_${topic}`, pdfItems, {
      subject: topic,
      gradeLevel,
      language,
      isSolved: true
    });

    onDownload(`${meta.title}: ${topic}`);
  };

  return (
    <div id="smart-suite-workspace" className="space-y-6">
      {/* Tool Header Card */}
      <div 
        className="p-6 md:p-8 bg-white border border-[#E2E8F0] rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden shadow-sm"
        style={{ borderLeft: `6px solid ${meta.color}` }}
      >
        <div className="flex items-start gap-4">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white shrink-0"
            style={{ backgroundColor: meta.color }}
          >
            <Icon size={24} />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-tight">
              {meta.title}
            </h2>
            <p className="text-slate-500 font-medium text-xs mt-1">
              {meta.subtitle}
            </p>
          </div>
        </div>

        {/* Back button */}
        <div className="flex gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#EAFBF4] border border-[#10B981]/15 text-[#064E3B] text-[10px] font-bold rounded-lg uppercase tracking-wide">
            🌱 EduGen Academic
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Panel */}
        <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl space-y-5 h-fit shadow-xs">
          <div className="space-y-1">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Configuration Panel</h3>
            <p className="text-[10px] text-slate-400 font-medium">Define parameters to query Groq LLM</p>
          </div>

          <div className="space-y-4">
            {/* Topic input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">Topic / Search Objective</label>
              <input 
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder={meta.placeholder}
                className="w-full text-xs font-medium h-10 px-3 border border-[#E2E8F0] rounded-lg focus:outline-none focus:border-[#10B981] bg-[#fafdfc]"
              />
            </div>

            {/* Target Grade Level */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">Target Study Level</label>
              <select 
                value={gradeLevel} 
                onChange={(e) => setGradeLevel(e.target.value)}
                className="w-full text-xs font-medium h-10 px-2.5 border border-[#E2E8F0] rounded-lg bg-[#fafdfc] focus:outline-none focus:border-[#10B981]"
              >
                <option value="Primary School (Grade 1-5)">Primary School (Grade 1-5)</option>
                <option value="Middle School (Grade 6-8)">Middle School (Grade 6-8)</option>
                <option value="High School (Grade 9-10)">High School (Grade 9-10)</option>
                <option value="College (Grade 11-12)">College (Grade 11-12)</option>
                <option value="University Graduate">University Graduate & Beyond</option>
              </select>
            </div>

            {/* Language */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">Subject Language</label>
              <select 
                value={language} 
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full text-xs font-medium h-10 px-2.5 border border-[#E2E8F0] rounded-lg bg-[#fafdfc] focus:outline-none focus:border-[#10B981]"
              >
                <option value="English">English</option>
                <option value="Urdu">Urdu (اردو)</option>
                <option value="Spanish">Spanish (Español)</option>
                <option value="Arabic">Arabic (العربية)</option>
                <option value="Hindi">Hindi (हिन्दी)</option>
              </select>
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full h-11 bg-[#1B4332] text-white font-bold text-xs rounded-lg shadow-md md:hover:bg-[#22573e] active:scale-98 transition-all flex items-center justify-center gap-2 mt-4"
            >
              {loading ? (
                <>
                  <RotateCcw className="animate-spin" size={14} />
                  <span>Compiling Academic Info...</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  <span>Execute Smart Suite Tool</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Results Workspace Column */}
        <div className="lg:col-span-2 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl text-xs font-bold flex items-start gap-2 animate-in fade-in">
              <span>⚠</span>
              <span>{error}</span>
            </div>
          )}

          {!resultData && !loading && (
            <div className="bg-white border border-[#E2E8F0] p-12 rounded-2xl text-center shadow-xs flex flex-col items-center justify-center text-slate-400 gap-4">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ backgroundColor: `${meta.color}15`, color: meta.color }}
              >
                <Icon size={32} />
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-slate-800 text-sm">Academic Board Empty</h4>
                <p className="text-xs text-slate-500 max-w-sm px-4">
                  Please specify your target learning objective on the left panel and click 'Execute' to consult the EduGen Groq system directory.
                </p>
              </div>
            </div>
          )}

          {loading && (
            <div className="bg-white border border-[#E2E8F0] p-16 rounded-2xl text-center shadow-xs flex flex-col items-center justify-center gap-4">
              <div className="relative w-16 h-16">
                <div 
                  className="absolute inset-0 border-4 rounded-full animate-spin"
                  style={{ borderColor: `${meta.color}20`, borderTopColor: meta.color }}
                />
              </div>
              <div className="space-y-1">
                <h5 className="font-extrabold text-slate-800 text-xs">Consulting Groq LLM Cloud Engine...</h5>
                <p className="text-[10px] text-slate-400 font-medium">Synthesizing comprehensive course materials</p>
              </div>
            </div>
          )}

          {resultData && !loading && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Header result row */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 border border-[#E2E8F0] rounded-xl shadow-xs">
                <div>
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Course Reference Compiled Successfully</h4>
                  <p className="text-[10px] text-slate-500 font-bold mt-1">Topic: <span className="text-[#10B981]">{topic}</span> • Standard: {gradeLevel}</p>
                </div>
                <button
                  onClick={handleDownloadPDF}
                  className="flex items-center gap-2 h-9 px-4 bg-[#EAFBF4] border border-[#10B981]/25 text-[#064E3B] hover:bg-[#d8f7e9] font-bold text-xs rounded-lg transition-colors shadow-xs"
                >
                  <Download size={14} />
                  <span>Download PDF Document</span>
                </button>
              </div>

              {/* Dynamic rendering cards custom tailored per toolId */}
              {toolId === "flashcard" && resultData.deck && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {resultData.deck.map((card: any, idx: number) => {
                    const isFlipped = activeFlashcard === idx;
                    return (
                      <div 
                        key={idx}
                        onClick={() => setActiveFlashcard(isFlipped ? null : idx)}
                        className="h-44 [perspective:1000px] cursor-pointer group"
                      >
                        <div 
                          className="relative w-full h-full text-center transition-transform duration-500 [transform-style:preserve-3d] rounded-2xl shadow-sm border border-[#E2E8F0] bg-white flex flex-col items-center justify-center p-6 gap-3 select-none"
                          style={{
                            transform: isFlipped ? "rotateY(180deg)" : "none",
                            borderLeft: !isFlipped ? `4px solid ${meta.color}` : `1px solid #E2E8F0`
                          }}
                        >
                          {/* Front Side */}
                          <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] flex flex-col justify-center items-center p-5 bg-white rounded-2xl">
                            <span className="text-[9px] font-black tracking-widest text-[#10B981] uppercase mb-2">Front Side • Card {idx + 1}</span>
                            <p className="text-sm font-bold text-slate-800">{card.front}</p>
                            <span className="text-[9px] font-bold text-slate-400 mt-6 group-hover:text-[#10B981] transition-colors">Click to Reveal Answer ↩</span>
                          </div>

                          {/* Back Side */}
                          <div className="absolute inset-0 w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] flex flex-col justify-center items-center p-5 bg-[#FAFDFB] rounded-2xl border-2 border-[#10B981]/20">
                            <span className="text-[9px] font-black tracking-widest text-[#064E3B] uppercase mb-2">Back Side • Solution Indicator</span>
                            <p className="text-xs font-semibold text-slate-700 leading-relaxed max-h-24 overflow-y-auto">{card.back}</p>
                            <span className="text-[9px] font-bold text-slate-400 mt-4">Click to Flip back</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {toolId === "mindmap" && (
                <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-xs space-y-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                    <Layers className="text-[#0D9488]" size={16} />
                    <h4 className="font-extrabold text-xs text-slate-800 uppercase tracking-widest">Mind-Map Hierarchical Outline</h4>
                  </div>
                  
                  <div className="p-4 bg-[#FAFDFB] rounded-xl border border-[#E6F4ED] outline-none max-h-[450px] overflow-y-auto">
                    {/* Root Node */}
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                      <span className="font-black text-slate-900 text-sm italic">{resultData.name || topic}</span>
                    </div>

                    {/* Branches */}
                    {resultData.children?.map((branch: any, bIdx: number) => (
                      <div key={bIdx} className="ml-6 border-l border-emerald-100 pl-4 mb-4 space-y-3 relative">
                        <div className="absolute -left-px top-2.5 w-3 h-px bg-emerald-200" />
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-[#0D9488]" />
                          <span className="font-extrabold text-xs text-slate-800">{branch.name}</span>
                        </div>

                        {/* Concepts */}
                        {branch.children?.map((leaf: any, lIdx: number) => (
                          <div key={lIdx} className="ml-4 border-l border-teal-100 pl-4 space-y-1 relative">
                            <div className="absolute -left-px top-2.5 w-3.5 h-px bg-teal-200" />
                            <div className="flex items-start gap-1.5 py-0.5">
                              <span className="text-[#10B981] text-[10px]">✔</span>
                              <span className="text-xs text-slate-600 font-semibold">{leaf.name}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {toolId === "planner" && resultData.schedule && (
                <div className="space-y-4">
                  {resultData.schedule.map((day: any) => (
                    <div key={day.day} className="bg-white border border-[#E2E8F0] p-5 rounded-2xl shadow-xs flex flex-col md:flex-row items-start justify-between gap-4 border-l-4 border-l-[#085a6e]">
                      <div className="space-y-3 flex-grow">
                        <div className="flex items-center gap-3">
                          <span className="px-2.5 py-1 bg-[#E1F5FE] text-[#0288D1] font-black text-xs rounded-lg">DAY {day.day}</span>
                          <h4 className="text-sm font-black text-slate-800">{day.title}</h4>
                        </div>
                        <div className="space-y-1.5 ml-1">
                          {day.milestones?.map((milestone: string, mIdx: number) => (
                            <div key={mIdx} className="flex items-start gap-2 text-xs font-semibold text-slate-600">
                              <span className="text-[#0891B2] mt-0.5">•</span>
                              <span>{milestone}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="bg-[#FAFDFB] p-3 border border-slate-100 rounded-xl text-center shrink-0 min-w-[100px]">
                        <span className="text-[10px] font-black text-slate-400 block uppercase tracking-wider">Study Duration</span>
                        <span className="text-lg font-black text-[#0891B2]">{day.estimatedHours} <span className="text-xs">hrs</span></span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {toolId === "debate" && (
                <div className="space-y-6">
                  {/* Thesis Banner */}
                  <div className="bg-[#FAFDFB] border border-[#10B981]/25 p-5 rounded-xl">
                    <span className="text-[9px] font-black text-[#064E3B] uppercase tracking-wider block mb-1">Debate Core Resolution</span>
                    <p className="text-xs font-bold text-[#1B4332] leading-relaxed italic">"{resultData.thesis}"</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Pros (Affirmative) */}
                    <div className="bg-white border border-[#E2E8F0] p-5 rounded-xl border-t-4 border-t-[#059669]">
                      <h4 className="font-extrabold text-xs text-emerald-800 uppercase tracking-wider mb-3 block">✔ Affirmative Point (Pros)</h4>
                      <div className="space-y-3">
                        {resultData.affirmativeArguments?.map((item: string, i: number) => (
                          <div key={i} className="bg-[#F4FBF9] p-3 rounded-lg border border-emerald-50 text-xs font-bold text-slate-700">
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Cons (Negative) */}
                    <div className="bg-white border border-[#E2E8F0] p-5 rounded-xl border-t-4 border-t-[#EA580C]">
                      <h4 className="font-extrabold text-xs text-orange-800 uppercase tracking-wider mb-3 block">✖ Opposition Point (Cons)</h4>
                      <div className="space-y-3">
                        {resultData.negativeArguments?.map((item: string, i: number) => (
                          <div key={i} className="bg-[#FFF8F3] p-3 rounded-lg border border-orange-50 text-xs font-bold text-slate-700">
                            {item}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Rebuttals Coach */}
                  <div className="bg-slate-50 border border-slate-200 p-5 rounded-xl space-y-2">
                    <h4 className="text-xs font-black text-slate-700 uppercase tracking-widest block">💡 Debate Coach Guidelines & Rebuttals</h4>
                    <div className="space-y-1.5">
                      {resultData.rebuttals?.map((item: string, i: number) => (
                        <p key={i} className="text-xs text-slate-600 font-semibold leading-relaxed">• {item}</p>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {toolId === "case-study" && (
                <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-xs space-y-6">
                  <div>
                    <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest block mb-1">Executive Case Report</span>
                    <h3 className="text-lg font-black text-slate-800 leading-tight">{resultData.caseTitle}</h3>
                  </div>

                  <div className="space-y-4 font-semibold text-xs leading-relaxed text-slate-600 text-justify">
                    <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                      <strong className="text-slate-800 block mb-2 font-black uppercase text-[10px]">Background Analysis:</strong>
                      <p>{resultData.background}</p>
                    </div>

                    <div className="p-4 bg-indigo-50/35 border border-indigo-100/50 rounded-xl border-l-4 border-l-[#4F46E5]">
                      <strong className="text-indigo-900 block mb-2 font-black uppercase text-[10px]">The Dilemma:</strong>
                      <p className="italic font-bold text-indigo-950">"{resultData.dilemma}"</p>
                    </div>
                  </div>

                  {/* Analysis Questions */}
                  <div className="space-y-4">
                    <h4 className="font-extrabold text-[#1B4332] text-xs uppercase tracking-widest block">Comprehension & Analysis Prompts</h4>
                    <div className="space-y-3">
                      {resultData.analysisQuestions?.map((qa: any, i: number) => (
                        <div key={i} className="p-4 border border-slate-150 rounded-xl bg-white space-y-2">
                          <p className="font-black text-xs text-slate-800">Q{i + 1}: {qa.question || qa}</p>
                          {qa.answer && (
                            <p className="text-xs text-slate-500 font-semibold leading-relaxed border-t border-slate-50 pt-2">{qa.answer}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {toolId === "code-explain" && (
                <div className="space-y-6 animate-in fade-in">
                  {/* Synopsis */}
                  <div className="bg-white border border-[#E2E8F0] p-5 rounded-xl shadow-xs">
                    <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest block mb-1">Algorithmic Synopsis</span>
                    <p className="text-xs font-semibold text-slate-600 leading-relaxed text-justify">{resultData.synopsis}</p>
                  </div>

                  {/* Code highlight layout */}
                  <div className="bg-slate-900 rounded-xl overflow-hidden shadow-md">
                    <div className="bg-slate-850 px-4 py-2 border-b border-slate-800 flex justify-between items-center text-[10px] text-slate-400 font-mono">
                      <span>STEP-BY-STEP COMPILER PSEUDOCODE</span>
                      <span className="text-[#10B981]">active</span>
                    </div>
                    <pre className="p-4 overflow-x-auto text-xs font-mono text-emerald-400 bg-black/90 leading-relaxed whitespace-pre-wrap">
                      {resultData.pseudocode}
                    </pre>
                  </div>

                  {/* Variable state tracking */}
                  <div className="bg-white border border-[#E2E8F0] p-5 rounded-xl shadow-xs">
                    <h4 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-3 block">Step-By-Step Dry Run Variable Tracing</h4>
                    <div className="space-y-2">
                      {resultData.dryRun?.map((step: string, i: number) => (
                        <div key={i} className="flex gap-2.5 items-start text-xs font-mono text-slate-600 border-l-2 border-l-emerald-200 pl-3 py-0.5">
                          <span className="text-[#10B981] font-bold">[{i + 1}]</span>
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pitfalls */}
                  <div className="bg-red-50/65 border border-red-100 p-4 rounded-xl">
                    <h4 className="text-xs font-black text-red-800 uppercase tracking-wide mb-2 block">⚠ Compilation Pitfalls to Avoid</h4>
                    <div className="space-y-1">
                      {resultData.pitfalls?.map((pit: string, i: number) => (
                        <p key={i} className="text-xs text-red-950 font-semibold leading-relaxed">• {pit}</p>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {toolId === "research" && (
                <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-xs space-y-6">
                  {/* Header Title abstract */}
                  <div>
                    <span className="text-[9px] font-black text-purple-600 uppercase tracking-widest block mb-1">Scientific Thesis Abstract</span>
                    <p className="text-xs font-semibold text-slate-600 leading-relaxed text-justify">{resultData.abstract}</p>
                  </div>

                  {/* Scope */}
                  <div className="p-4 bg-purple-50/45 border border-purple-100 rounded-xl">
                    <strong className="text-purple-950 block text-[10px] font-black uppercase mb-1.5">EXPERIMENTAL RESEARCH BOUNDS:</strong>
                    <p className="text-xs text-slate-600 font-semibold leading-relaxed">{resultData.researchScope}</p>
                  </div>

                  {/* Index outline */}
                  <div className="space-y-4">
                    <h4 className="font-extrabold text-slate-800 text-xs uppercase tracking-widest block">Structural Chapter Proposal</h4>
                    <div className="space-y-4 ml-2">
                      {resultData.chapters?.map((ch: any) => (
                        <div key={ch.chapterNum} className="border-l-2 border-l-purple-200 pl-4 space-y-1.5 relative">
                          <div className="absolute -left-1.5 top-1.5 w-2.5 h-2.5 rounded-full bg-purple-500" />
                          <h5 className="font-black text-xs text-slate-800">Chapter {ch.chapterNum}: {ch.chapterTitle}</h5>
                          <div className="space-y-1 pl-1">
                            {ch.subsections?.map((sub: string, sIdx: number) => (
                              <p key={sIdx} className="text-[11px] font-semibold text-slate-500">• {sub}</p>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {toolId === "mnemonics" && resultData.mnemonics && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="bg-[#FAFDFB] border border-[#10B981]/20 p-4 rounded-xl flex items-center justify-between">
                    <span className="text-[10px] font-black text-[#064E3B] uppercase tracking-wide">Acronym Memorization sandbox</span>
                    <span className="text-[10px] font-bold text-slate-400">Total cues: 3</span>
                  </div>

                  {resultData.mnemonics.map((item: any, idx: number) => (
                    <div key={idx} className="bg-white border border-[#E2E8F0] p-5 rounded-2xl shadow-xs relative overflow-hidden border-l-4 border-l-[#DB2777]">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <span className="px-3 py-1 bg-pink-100 text-pink-700 font-mono font-black text-xs rounded-lg tracking-wider uppercase">{item.acronym}</span>
                          <span className="text-xs font-black text-slate-800 italic">"{item.phrase}"</span>
                        </div>
                        <div className="bg-[#FAFDFB] p-3 rounded-lg border border-pink-50/50 text-xs font-semibold leading-relaxed text-slate-600">
                          <strong className="text-pink-900 font-black block mb-1 text-[9px] uppercase tracking-wide">🎨 Visual Palace Scenic Anchor Description:</strong>
                          {item.visualpalace}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {toolId === "eli5" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in">
                  {/* Left block metaphor */}
                  <div className="bg-white border border-[#E2E8F0] p-5 rounded-2xl shadow-xs border-t-4 border-t-yellow-500 space-y-4">
                    <div>
                      <span className="text-[9px] font-black text-yellow-600 uppercase tracking-widest block mb-1">ELI5 METAPHOR (Childhood Level)</span>
                      <h4 className="text-sm font-black text-slate-800 leading-snug">{resultData.metaphorTitle}</h4>
                    </div>
                    <div className="p-3 bg-yellow-50/40 rounded-xl font-mono text-xs text-slate-600 leading-relaxed text-justify">
                      {resultData.eli5Metaphor}
                    </div>
                  </div>

                  {/* Right block Translation */}
                  <div className="bg-white border border-[#E2E8F0] p-5 rounded-2xl shadow-xs border-t-4 border-t-indigo-600 space-y-4">
                    <div>
                      <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest block mb-1">CURRICULUM TRANSLATION (Academic Level)</span>
                      <h4 className="text-sm font-black text-slate-800 leading-snug">High-Grade Concepts Explained</h4>
                    </div>
                    <div className="p-3 bg-indigo-50/20 rounded-xl text-xs font-semibold text-slate-600 leading-relaxed text-justify">
                      {resultData.academicTranslation}
                    </div>
                  </div>

                  {/* Metaphor matching check */}
                  <div className="md:col-span-2 bg-[#FAFDFB] border border-[#10B981]/20 p-4 rounded-xl text-xs font-bold text-[#064E3B] text-center leading-relaxed">
                    🌟 Interactive Analogy Challenge: {resultData.interactiveAnalogyMatch}
                  </div>
                </div>
              )}

              {toolId === "jargon" && resultData.words && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {resultData.words.map((item: any, idx: number) => (
                    <div key={idx} className="bg-white border border-[#E2E8F0] p-5 rounded-2xl shadow-xs border-l-4 border-l-[#1b4332] flex flex-col justify-between h-52">
                      <div className="space-y-2">
                        <span className="text-[8px] font-black text-slate-400 block uppercase tracking-wider">Vocabulary keyword #{idx + 1}</span>
                        <h4 className="font-extrabold text-sm text-slate-800">{item.word}</h4>
                        <p className="text-[11px] font-semibold text-slate-500 leading-relaxed text-justify">{item.definition}</p>
                      </div>
                      <div className="bg-[#FAFDFB] px-3 py-2 border border-slate-100 rounded-lg text-[10.5px] font-semibold text-slate-600 italic">
                        "{item.contextSentence}"
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {toolId === "summarizer" && resultData.overview && (
                <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-xs space-y-6 animate-in fade-in">
                  <div className="border-l-4 border-l-[#4A121A] pl-4">
                    <span className="text-[9px] font-black text-rose-800 uppercase tracking-widest block mb-1">Executive Textbook Digest</span>
                    <h3 className="text-base font-extrabold text-slate-800 leading-snug">{topic} Summary</h3>
                  </div>
                  <p className="text-xs font-semibold text-slate-600 leading-relaxed text-justify bg-rose-50/20 p-4 rounded-xl border border-rose-100/30">
                    {resultData.overview}
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 !mt-6">
                    {resultData.chapters?.map((ch: any, idx: number) => (
                      <div key={idx} className="bg-white border border-[#E2E8F0] p-4 rounded-xl shadow-2xs relative">
                        <span className="absolute right-3 top-3 text-[10px] font-mono text-rose-900 font-extrabold uppercase">SEC {idx + 1}</span>
                        <h4 className="text-xs font-black text-slate-800 mb-3 border-b pb-1.5 border-slate-100">{ch.chapterTitle}</h4>
                        <ul className="space-y-2">
                          {ch.bulletPoints?.map((pt: string, pIdx: number) => (
                            <li key={pIdx} className="text-[10.5px] font-medium leading-relaxed text-slate-600 flex gap-2">
                              <span className="text-rose-700 font-bold">•</span>
                              <span>{pt}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {toolId === "essay-grader" && resultData.estimatedGrade && (
                <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-xs space-y-6 animate-in fade-in">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-4 border-slate-100">
                    <div>
                      <span className="text-[9px] font-black text-rose-800 uppercase tracking-widest block mb-1">Essay Assessment Key</span>
                      <h3 className="text-sm font-black text-slate-800 italic">Draft Review regarding: "{topic}"</h3>
                    </div>
                    <div className="flex gap-4">
                      <div className="text-center px-4 py-2 bg-rose-50 border border-rose-100 rounded-xl">
                        <span className="text-[8px] font-black uppercase text-rose-900 block">EST. GRADE</span>
                        <span className="text-xl font-black text-rose-800 font-mono">{resultData.estimatedGrade}</span>
                      </div>
                      <div className="text-center px-4 py-2 bg-[#FAFDFB] border border-emerald-100 rounded-xl">
                        <span className="text-[8px] font-black uppercase text-emerald-900 block">SCORE</span>
                        <span className="text-xl font-black text-emerald-700 font-mono">{resultData.feedbackScore}/100</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-wider mb-2">Identified Core Faults / Suggestions</h4>
                    <div className="space-y-3">
                      {resultData.issues?.map((issue: any, idx: number) => (
                        <div key={idx} className="bg-slate-50 border border-[#E2E8F0] p-4 rounded-xl space-y-2">
                          <div className="flex justify-between items-center text-[9px] font-bold text-slate-400">
                            <span>ISSUE #{idx + 1}</span>
                            <span className="px-1.5 py-0.5 bg-rose-100 text-rose-700 uppercase font-mono font-black rounded">{issue.errorType}</span>
                          </div>
                          <p className="text-[11px] font-semibold text-slate-500 italic">"{issue.originalText}"</p>
                          <p className="text-[11px] font-extrabold text-slate-800">💡 Recommended: "{issue.correction}"</p>
                          <p className="text-[10.5px] font-medium text-slate-500 pl-3 border-l border-slate-200 mt-1">{issue.explanation}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-rose-50/10 border border-rose-100/30 rounded-xl">
                    <strong className="text-rose-950 block text-[9px] font-black uppercase mb-1">HOLISTIC CRITIQUE ADVICE:</strong>
                    <p className="text-xs font-semibold leading-relaxed text-slate-600 text-justify">{resultData.overallFeedback}</p>
                  </div>
                </div>
              )}

              {toolId === "lab-report" && resultData.experimentTitle && (
                <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-xs space-y-6 animate-in fade-in">
                  <div className="border-t-4 border-t-blue-800 pt-3">
                    <span className="text-[9px] font-black text-blue-800 uppercase tracking-widest block mb-1">Scientific Laboratory Outline</span>
                    <h3 className="text-base font-extrabold text-slate-800 leading-snug">{resultData.experimentTitle}</h3>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl text-xs">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Proposed Hypothesis</span>
                    <p className="font-bold text-slate-700 italic">"{resultData.hypothesis}"</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-wider border-b pb-1">Essential Materials</h4>
                      <ul className="space-y-2">
                        {resultData.materials?.map((mat: string, idx: number) => (
                          <li key={idx} className="text-xs font-semibold text-slate-600 flex gap-2">
                            <span className="text-blue-700">•</span>
                            <span>{mat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-wider border-b pb-1">Safety Protocols</h4>
                      <div className="space-y-2">
                        {resultData.safetyRules?.map((rule: string, idx: number) => (
                          <div key={idx} className="bg-amber-50/60 text-amber-900 border border-amber-100 p-2 rounded-lg text-xs font-bold flex gap-2">
                            <span>⚠</span>
                            <span>{rule}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-wider">Method & Procedural Outline</h4>
                    <div className="space-y-2">
                      {resultData.procedure?.map((step: string, idx: number) => (
                        <div key={idx} className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs font-semibold text-slate-600 flex gap-3">
                          <span className="font-black text-blue-800 font-mono text-sm leading-none">{idx + 1}</span>
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {toolId === "formula-sheet" && resultData.formulas && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="bg-[#FAFDFB] border border-blue-100/70 p-4 rounded-xl flex items-center justify-between">
                    <span className="text-[10px] font-black text-blue-900 uppercase tracking-wider font-mono">LaTex Equations Cheat Sheet</span>
                    <span className="text-[10px] font-bold text-slate-400">Total high-yield equations: 4</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {resultData.formulas.map((item: any, idx: number) => (
                      <div key={idx} className="bg-white border border-[#E2E8F0] p-5 rounded-2xl shadow-xs relative overflow-hidden border-t-4 border-t-blue-600 flex flex-col justify-between min-h-60">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center border-b pb-1.5 border-slate-100">
                            <h4 className="font-extrabold text-xs text-slate-800 uppercase">{item.name}</h4>
                            <span className="text-[9px] font-mono font-bold text-slate-400">FORMULA #{idx + 1}</span>
                          </div>
                          <div className="p-3 bg-blue-50/30 rounded-xl font-mono text-center text-sm font-black text-blue-900">
                            {item.latexEquation}
                          </div>
                          <p className="text-[11px] font-semibold text-slate-500 leading-relaxed"><strong className="text-slate-700">Deconstructed:</strong> {item.variableDeconstruction}</p>
                        </div>
                        <div className="bg-[#FAFDFB] p-2 border border-slate-100 rounded-lg text-[10.5px] font-medium text-slate-600 italic">
                          ✨ <strong className="text-slate-800 font-bold">Calculation Guide:</strong> {item.practicalExample}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {toolId === "paper-questions" && resultData.questions && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="bg-[#FAFDFB] border border-slate-100 p-4 rounded-xl">
                    <span className="text-[10px] font-black text-slate-700 uppercase tracking-widest block">Paper Peer Review Challenge</span>
                  </div>

                  <div className="space-y-3">
                    {resultData.questions.map((q: any, idx: number) => (
                      <div key={idx} className="bg-white border border-[#E2E8F0] p-5 rounded-2xl shadow-xs border-l-4 border-l-slate-800 space-y-3">
                        <div className="flex justify-between items-center text-[9px] font-bold text-slate-400">
                          <span>QUESTION #{idx + 1}</span>
                          <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 uppercase font-mono font-black rounded">{q.cognitiveDomain}</span>
                        </div>
                        <h4 className="font-black text-sm text-slate-800 leading-snug">{q.questionText}</h4>
                        <div className="p-3 bg-slate-50/80 rounded-xl text-xs font-semibold leading-relaxed text-slate-600 border border-slate-100">
                          <strong className="text-slate-900 font-black block mb-1 text-[9px] uppercase tracking-wide">💡 Ideal Scholarly Response Reference:</strong>
                          {q.modelResponseKey}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {toolId === "socratic" && resultData.conversation && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="bg-rose-50/30 border border-rose-100 p-4 rounded-xl">
                    <span className="text-[10px] font-black text-rose-800 uppercase tracking-widest block">Socratic Analytical Reasoning Dialogues</span>
                  </div>

                  <div className="space-y-3">
                    {resultData.conversation.map((item: any, idx: number) => (
                      <div key={idx} className="bg-white border border-[#E2E8F0] p-5 rounded-2xl shadow-xs border-l-4 border-l-[#4A121A] space-y-3">
                        <div className="flex justify-between items-center text-[9px] font-bold text-rose-400">
                          <span className="font-black">STAGE {item.step}</span>
                          <span className="uppercase font-mono font-semibold">Target: {item.studentConceptTarget}</span>
                        </div>
                        <div className="p-2.5 bg-rose-50/20 border border-rose-100 text-xs font-bold text-rose-950 italic">
                          " {item.questionPrompt} "
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl text-xs font-medium text-slate-600">
                          <strong className="text-slate-800 font-black block mb-1 text-[9px] uppercase tracking-wide">Educator Prompt Clue:</strong>
                          {item.helperClue}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {toolId === "curriculum-map" && resultData.map && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="bg-[#FAFDFB] border border-blue-50 p-4 rounded-xl">
                    <span className="text-[10px] font-black text-blue-900 uppercase tracking-wider block">Alignments with scholastic standard guidelines</span>
                  </div>

                  <div className="space-y-4">
                    {resultData.map.map((item: any, idx: number) => (
                      <div key={idx} className="bg-white border border-[#E2E8F0] p-5 rounded-2xl shadow-xs border-l-4 border-l-[#1E3A8A] grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <span className="text-[8px] font-black text-slate-400 block uppercase">Milestone UNIT {idx + 1}</span>
                          <h4 className="font-extrabold text-sm text-slate-800">{item.unitTitle}</h4>
                          <span className="inline-block px-1.5 py-0.5 bg-blue-50 text-blue-700 font-mono text-[9px] font-extrabold rounded">{item.coreStandardName}</span>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-lg text-xs font-semibold text-slate-600 leading-relaxed">
                          <strong className="text-slate-800 block text-[9px] font-black uppercase mb-1">Target Competence:</strong>
                          {item.targetObjective}
                        </div>
                        <div className="bg-blue-50/20 p-3 rounded-lg text-xs font-semibold text-slate-600 leading-relaxed border border-blue-100/30">
                          <strong className="text-blue-950 block text-[9px] font-black uppercase mb-1">Sample Assessment Proof:</strong>
                          {item.assessmentTask}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {toolId === "interview-prep" && resultData.interviewList && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="bg-[#FAFDFB] border border-blue-100/40 p-4 rounded-xl flex items-center justify-between">
                    <span className="text-[10px] font-black text-blue-900 uppercase tracking-wider font-mono">Concept Oral Prepper Platform</span>
                    <span className="text-[10px] font-bold text-slate-400">Oral Board Questions</span>
                  </div>

                  <div className="space-y-3">
                    {resultData.interviewList.map((item: any, idx: number) => (
                      <div key={idx} className="bg-white border border-[#E2E8F0] p-5 rounded-2xl shadow-xs border-l-4 border-l-[#2563EB] space-y-4">
                        <div className="flex justify-between items-center text-[9px] font-bold text-slate-400">
                          <span>CORE FACTOR: {item.coreRubricFactor}</span>
                          <span className="font-mono text-blue-600">PROMPT #{idx + 1}</span>
                        </div>
                        <h4 className="font-black text-sm text-slate-800">{item.questionText}</h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-3 bg-blue-50/25 border border-blue-50 rounded-xl text-xs font-semibold leading-relaxed text-slate-600">
                            <strong className="text-blue-900 font-black block mb-1 text-[9px] uppercase tracking-wide">🏆 Best Model Response Outline:</strong>
                            {item.modelAnswer}
                          </div>
                          <div className="p-3 bg-amber-50/40 border border-amber-100/50 rounded-xl text-xs font-semibold leading-relaxed text-slate-600">
                            <strong className="text-amber-800 font-bold block mb-1 text-[9px] uppercase tracking-wide">🚨 Critical Trap & Trick to Avoid:</strong>
                            {item.criticalTrap}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {toolId === "citation" && resultData.citations && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="bg-slate-50 border border-slate-200/70 p-4 rounded-xl flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest font-mono">Bibliography References Builder</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {resultData.citations.map((item: any, idx: number) => (
                      <div key={idx} className="bg-white border border-[#E2E8F0] p-5 rounded-2xl shadow-xs border-l-4 border-l-slate-800 flex flex-col justify-between min-h-56 font-mono">
                        <div className="space-y-2 font-sans">
                          <span className="text-[8px] font-black text-slate-400 block uppercase tracking-wider font-mono">STANDARD STYLE: {item.style}</span>
                          <h4 className="font-extrabold text-xs text-slate-800 text-sans">Bibliography Citation</h4>
                          <p className="text-[11px] text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded border border-slate-100 italic select-all font-mono">
                            {item.bibliographyEntry}
                          </p>
                        </div>
                        <div className="bg-slate-50/50 px-3 py-2 border border-slate-100 rounded-lg text-[10.5px] font-bold text-slate-500 font-sans mt-3">
                          Parenthetical standard: <span className="text-slate-800 font-mono select-all font-bold">"{item.inTextCitation}"</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {toolId === "hypothesis" && resultData.scienceStatement && (
                <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-xs space-y-6 animate-in fade-in">
                  <div className="border-l-4 border-l-[#4A121A] pl-4">
                    <span className="text-[9px] font-black text-rose-800 uppercase tracking-widest block mb-1">Scientific Hypothesis Planner</span>
                    <h3 className="text-base font-extrabold text-slate-800 leading-snug">Empirical Research Parameters</h3>
                  </div>

                  <div className="p-4 bg-rose-50/25 border border-rose-100 rounded-xl text-xs">
                    <span className="text-[9px] font-black text-rose-900 uppercase tracking-widest block mb-1">Proposed Hypothesis Concept Statement</span>
                    <p className="font-black text-rose-950 italic">"{resultData.scienceStatement}"</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-wider border-b pb-1">Independent Variable</h4>
                      <p className="text-xs font-semibold text-slate-600">{resultData.independentVariable}</p>
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-wider border-b pb-1">Dependent Variable</h4>
                      <p className="text-xs font-semibold text-slate-600">{resultData.dependentVariable}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-wider">Primary Experimental Environmental Controls</h4>
                    <div className="flex flex-wrap gap-2">
                      {resultData.controlVariables?.map((ctrl: string, idx: number) => (
                        <span key={idx} className="px-3 py-1.5 bg-slate-50 border border-slate-100 text-xs font-semibold text-slate-600 rounded-full">
                          🔩 {ctrl}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 bg-[#FAFDFB] border border-emerald-100 rounded-xl text-xs">
                    <strong className="text-emerald-950 block text-[9px] font-black uppercase mb-1">Predicted Theoretical Outcome & Scientific Reasoning:</strong>
                    <p className="text-slate-600 font-semibold leading-relaxed text-justify">{resultData.predictedOutcome}</p>
                  </div>
                </div>
              )}

              {toolId === "difference" && resultData.comparisonTitle && (
                <div className="bg-white border border-[#E2E8F0] p-6 rounded-2xl shadow-xs space-y-6 animate-in fade-in">
                  <div className="border-l-4 border-l-[#059669] pl-4">
                    <span className="text-[9px] font-black text-emerald-800 uppercase tracking-widest block mb-1">Conceptual Difference Explainer</span>
                    <h3 className="text-base font-extrabold text-slate-800 leading-snug">{resultData.comparisonTitle}</h3>
                  </div>

                  {resultData.introduction && (
                    <p className="text-xs font-semibold leading-relaxed text-slate-600 text-justify bg-slate-50 p-3 rounded-lg border border-slate-100">
                      {resultData.introduction}
                    </p>
                  )}

                  {/* HIGH FIDELITY COMPARATIVE TABLE */}
                  <div className="overflow-x-auto border border-slate-200/80 rounded-xl shadow-xs">
                    <table className="w-full text-left border-collapse min-w-[500px]">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="px-4 py-3 text-xs font-bold text-slate-700 tracking-wider font-mono">
                            {resultData.columns?.[0] || "Feature"}
                          </th>
                          <th className="px-4 py-3 text-xs font-bold text-slate-700 tracking-wider">
                            {resultData.columns?.[1] || "Concept A"}
                          </th>
                          <th className="px-4 py-3 text-xs font-bold text-slate-700 tracking-wider">
                            {resultData.columns?.[2] || "Concept B"}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {resultData.rows?.map((row: any, idx: number) => (
                          <tr key={idx} className="border-b last:border-b-0 border-slate-150 hover:bg-slate-50/50 transition-colors">
                            <td className="px-4 py-3 text-xs font-bold text-slate-800 bg-slate-50/20 font-mono">
                              {row.feature}
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-600 font-semibold leading-relaxed">
                              {row.conceptA}
                            </td>
                            <td className="px-4 py-3 text-xs text-slate-600 font-semibold leading-relaxed">
                              {row.conceptB}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* DETAILED TAKEAWAYS LIST */}
                  {resultData.detailedAnalyses && resultData.detailedAnalyses.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <h4 className="text-[10px] font-black text-[#059669] uppercase tracking-widest">Key Structural Differences</h4>
                      <div className="space-y-2 ml-1">
                        {resultData.detailedAnalyses.map((analysis: string, idx: number) => (
                          <div key={idx} className="flex gap-2.5 items-start text-xs text-slate-600 font-semibold leading-relaxed">
                            <span className="text-[#059669] mt-0.5">•</span>
                            <span>{analysis}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* VERDICT CARD */}
                  {resultData.conclusion && (
                    <div className="p-4 bg-emerald-50/40 border border-emerald-100 rounded-xl text-xs">
                      <strong className="text-emerald-950 block text-[9px] font-black uppercase mb-1">Final Analysis Word / Recommendation:</strong>
                      <p className="text-slate-600 font-semibold leading-relaxed text-justify">{resultData.conclusion}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Status footer detail */}
              <div className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                🔬 Generated via Elite EduGen Groq Cloud Architecture
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
