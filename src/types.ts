/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface MCQ {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface ShortQuestion {
  question: string;
  modelAnswer: string;
}

export interface LongQuestion {
  question: string;
  modelAnswer: string;
  keyPoints: string[];
}

export interface TopicExplanation {
  title: string;
  summary: string;
  keyConcepts: string[];
  analogy: string;
  misconceptions: string[];
  detailedExplanation?: string;
  diagramDescription?: string;
}

export interface Story {
  title: string;
  content: string;
}

export interface Letter {
  subject: string;
  body: string;
}

export interface ExamPaper {
  mcqs: MCQ[];
  shortQuestions: ShortQuestion[];
  longQuestions: LongQuestion[];
}

export interface UserData {
  mcqs: { data: MCQ[]; timestamp: number; topic: string }[];
  shortQs: { data: ShortQuestion[]; timestamp: number; topic: string }[];
  longQs: { data: LongQuestion[]; timestamp: number; topic: string }[];
  exams: { data: ExamPaper; timestamp: number; topic: string }[];
  stories: { data: Story; timestamp: number; topic: string }[];
  letters: { data: Letter; timestamp: number; topic: string }[];
  explanations: { data: TopicExplanation; timestamp: number; topic: string }[];
}

export interface User {
  name: string;
  gmail: string;
  code: string; // Base64 encoded (simulated hash)
  createdAt: number;
  data: UserData;
}

export type ToolType = 'home' | 'mcq' | 'short' | 'long' | 'explainer' | 'story-letter' | 'exam' | 'history' | 'visual' | 'share' | 'flashcard' | 'mindmap' | 'planner' | 'debate' | 'case-study' | 'code-explain' | 'research' | 'mnemonics' | 'eli5' | 'jargon' | 'summarizer' | 'essay-grader' | 'lab-report' | 'formula-sheet' | 'paper-questions' | 'socratic' | 'curriculum-map' | 'interview-prep' | 'citation' | 'hypothesis' | 'difference';
