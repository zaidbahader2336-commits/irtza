import { User, MCQ, ShortQuestion, LongQuestion, ExamPaper, Story, Letter, TopicExplanation } from '../types';

const INITIAL_USER: User = {
  name: 'EduGen Student',
  gmail: 'student@edugen.app',
  code: 'ZWR1Z2Vu',
  createdAt: Date.now(),
  data: {
    mcqs: [],
    shortQs: [],
    longQs: [],
    exams: [],
    stories: [],
    letters: [],
    explanations: []
  }
};

export const getOrCreateDefaultUser = (): User => {
  const saved = localStorage.getItem('edugen_app_user');
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (e) {
      // Use fallback if parse fails
    }
  }
  localStorage.setItem('edugen_app_user', JSON.stringify(INITIAL_USER));
  return INITIAL_USER;
};

export const saveToUserHistory = (
  type: 'mcqs' | 'shortQs' | 'longQs' | 'exams' | 'stories' | 'letters' | 'explanations',
  topic: string,
  data: any
) => {
  const currentUser = getOrCreateDefaultUser();
  const newItem = {
    data,
    topic,
    timestamp: Date.now()
  };

  currentUser.data[type] = [newItem, ...(currentUser.data[type] || [])];
  localStorage.setItem('edugen_app_user', JSON.stringify(currentUser));
};

export const getUserHistory = (): User => {
  return getOrCreateDefaultUser();
};

export const deleteHistoryItem = (type: string, timestamp: number): User => {
  const currentUser = getOrCreateDefaultUser();
  
  // @ts-ignore
  if (currentUser.data[type]) {
    // @ts-ignore
    currentUser.data[type] = currentUser.data[type].filter((item: any) => item.timestamp !== timestamp);
  }
  localStorage.setItem('edugen_app_user', JSON.stringify(currentUser));
  return currentUser;
};
