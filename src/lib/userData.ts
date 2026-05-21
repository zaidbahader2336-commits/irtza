import { User, MCQ, ShortQuestion, LongQuestion, ExamPaper, Story, Letter, TopicExplanation } from '../types';

export const saveToUserHistory = (
  type: 'mcqs' | 'shortQs' | 'longQs' | 'exams' | 'stories' | 'letters' | 'explanations',
  topic: string,
  data: any
) => {
  const session = sessionStorage.getItem('edugen_session');
  if (!session) return;

  const currentUser: User = JSON.parse(session);
  const users: User[] = JSON.parse(localStorage.getItem('edugen_users') || '[]');
  
  const userIdx = users.findIndex(u => u.gmail === currentUser.gmail);
  if (userIdx === -1) return;

  const newItem = {
    data,
    topic,
    timestamp: Date.now()
  };

  // Update in localStorage
  users[userIdx].data[type] = [newItem, ...(users[userIdx].data[type] || [])];
  localStorage.setItem('edugen_users', JSON.stringify(users));

  // Update current session reference
  currentUser.data = users[userIdx].data;
  sessionStorage.setItem('edugen_session', JSON.stringify(currentUser));
};

export const getUserHistory = (): User | null => {
  const session = sessionStorage.getItem('edugen_session');
  if (!session) return null;
  return JSON.parse(session);
};

export const deleteHistoryItem = (type: string, timestamp: number) => {
  const session = sessionStorage.getItem('edugen_session');
  if (!session) return;

  const currentUser: User = JSON.parse(session);
  const users: User[] = JSON.parse(localStorage.getItem('edugen_users') || '[]');
  
  const userIdx = users.findIndex(u => u.gmail === currentUser.gmail);
  if (userIdx === -1) return;

  // @ts-ignore
  users[userIdx].data[type] = users[userIdx].data[type].filter((item: any) => item.timestamp !== timestamp);
  localStorage.setItem('edugen_users', JSON.stringify(users));

  currentUser.data = users[userIdx].data;
  sessionStorage.setItem('edugen_session', JSON.stringify(currentUser));
  return currentUser;
};
