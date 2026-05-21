import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User as UserIcon, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck,
  AlertCircle,
  GraduationCap
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { User, UserData } from '../../types';

interface AuthManagerProps {
  onLogin: (user: User) => void;
}

type AuthMode = 'login' | 'signup' | 'verifying' | 'verified';

export default function AuthManager({ onLogin }: AuthManagerProps) {
  const [mode, setMode] = useState<AuthMode>('login');
  const [showCode, setShowCode] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [gmail, setGmail] = useState('');
  const [code, setCode] = useState('');
  const [confirmCode, setConfirmCode] = useState('');
  const [error, setError] = useState('');
  
  // Locked State
  const [attempts, setAttempts] = useState(0);
  const [lockout, setLockout] = useState(0);
  
  // Verification Simulation State
  const [verificationCode, setVerificationCode] = useState('');
  const [enteredVCode, setEnteredVCode] = useState('');

  useEffect(() => {
    if (lockout > 0) {
      const timer = setInterval(() => setLockout(l => l - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [lockout]);

  const getUsers = (): User[] => {
    const saved = localStorage.getItem('edugen_users');
    return saved ? JSON.parse(saved) : [];
  };

  const saveUsers = (users: User[]) => {
    localStorage.setItem('edugen_users', JSON.stringify(users));
  };

  const validateGmail = (email: string) => {
    return email.toLowerCase().endsWith('@gmail.com');
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name || !gmail || !code || !confirmCode) {
      setError('All fields are required');
      return;
    }

    if (!validateGmail(gmail)) {
      setError('Please use a valid Gmail address');
      return;
    }

    if (code.length !== 6 || isNaN(Number(code))) {
      setError('Access code must be 6 digits');
      return;
    }

    if (code !== confirmCode) {
      setError('Codes do not match');
      return;
    }

    const users = getUsers();
    if (users.find(u => u.gmail === gmail)) {
      setError('This Gmail is already registered');
      return;
    }

    const newUser: User = {
      name,
      gmail,
      code: btoa(code),
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

    saveUsers([...users, newUser]);
    startVerification(newUser);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (lockout > 0) return;

    if (!gmail || !code) {
      setError('Required fields missing');
      return;
    }

    const users = getUsers();
    const user = users.find(u => u.gmail === gmail);

    if (user && user.code === btoa(code)) {
      startVerification(user);
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (newAttempts >= 3) {
        setLockout(30);
        setAttempts(0);
        setError('Too many attempts. Account locked.');
      } else {
        setError('Incorrect access code. Try again.');
      }
    }
  };

  const startVerification = (user: User) => {
    setMode('verifying');
    const vCode = Math.floor(100000 + Math.random() * 900000).toString();
    setVerificationCode(vCode);
    
    // Simulate delay
    setTimeout(() => {
      setEnteredVCode(vCode);
      setTimeout(() => {
        setMode('verified');
        setTimeout(() => {
          sessionStorage.setItem('edugen_session', JSON.stringify(user));
          onLogin(user);
        }, 1000);
      }, 1500);
    }, 2000);
  };

  if (mode === 'verifying' || mode === 'verified') {
    return (
      <div className="fixed inset-0 bg-[#F3F4F6] flex items-center justify-center p-6 z-[200]">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-[40px] p-12 max-w-md w-full text-center shadow-2xl shadow-blue-100 border border-white"
        >
          {mode === 'verifying' ? (
            <div className="space-y-8">
              <div className="relative w-24 h-24 mx-auto">
                 <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
                 <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
                 <div className="absolute inset-0 flex items-center justify-center">
                    <ShieldCheck size={40} className="text-blue-600" />
                 </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-black text-gray-900">Verifying Identity</h2>
                <p className="text-gray-500 font-medium">A security code has been sent to</p>
                <p className="text-blue-600 font-bold">{gmail}</p>
              </div>
              <div className="flex gap-2 justify-center">
                 {Array.from({ length: 6 }).map((_, i) => (
                   <div key={i} className="w-12 h-14 bg-gray-50 rounded-xl border-2 border-gray-100 flex items-center justify-center text-xl font-black text-gray-400">
                     {enteredVCode[i] || ''}
                   </div>
                 ))}
              </div>
              <p className="text-xs text-gray-400 uppercase font-bold tracking-widest animate-pulse">Waiting for synchronization...</p>
            </div>
          ) : (
            <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} className="space-y-8">
               <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto text-white shadow-xl shadow-green-100">
                  <CheckCircle2 size={48} />
               </div>
               <div className="space-y-2">
                <h2 className="text-3xl font-black text-gray-900">Identity Verified!</h2>
                <p className="text-green-600 font-bold">Welcome back, {name || getUsers().find(u => u.gmail === gmail)?.name}</p>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                 <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  className="h-full bg-green-500"
                  transition={{ duration: 1 }}
                 />
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#F3F4F6] flex items-center justify-center p-6 z-[100] font-sans">
      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="bg-white rounded-[40px] p-10 max-w-md w-full shadow-2xl shadow-gray-200 border border-white relative overflow-hidden"
        >
          {/* Subtle Background Accent */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-full -mr-16 -mt-16 blur-3xl"></div>

          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-100 rotate-3">
               <GraduationCap size={36} className="text-white" />
            </div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">EduGen</h1>
            <p className="text-gray-400 font-medium">Empower Your Learning Journey</p>
          </div>

          <form onSubmit={mode === 'login' ? handleLogin : handleSignup} className="space-y-6">
            {mode === 'signup' && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-2">Full Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                  <input
                    type="text"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-[#F9FAFB] border-2 border-transparent rounded-2xl focus:outline-none focus:border-blue-200 focus:bg-white transition-all font-medium text-gray-700"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-2">Gmail Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                <input
                  type="email"
                  placeholder="alex@gmail.com"
                  value={gmail}
                  onChange={(e) => setGmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-[#F9FAFB] border-2 border-transparent rounded-2xl focus:outline-none focus:border-blue-200 focus:bg-white transition-all font-medium text-gray-700"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">6-Digit Access Code</label>
                {mode === 'login' && (
                   <button type="button" onClick={() => alert("Your access code was set by you during signup. If you forgot it, you'll need to create a new account.")} className="text-xs font-bold text-blue-500 hover:underline">Forgot?</button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                <input
                  type={showCode ? "text" : "password"}
                  placeholder="● ● ● ● ● ●"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full pl-12 pr-12 py-4 bg-[#F9FAFB] border-2 border-transparent rounded-2xl focus:outline-none focus:border-blue-200 focus:bg-white transition-all font-bold tracking-[0.5em] text-gray-700"
                />
                <button 
                  type="button" 
                  onClick={() => setShowCode(!showCode)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 hover:text-blue-500 transition-colors"
                >
                  {showCode ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {mode === 'signup' && (
              <div className="space-y-2 animate-in slide-in-from-top-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest pl-2">Confirm Code</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                  <input
                    type="password"
                    placeholder="● ● ● ● ● ●"
                    maxLength={6}
                    value={confirmCode}
                    onChange={(e) => setConfirmCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-12 pr-4 py-4 bg-[#F9FAFB] border-2 border-transparent rounded-2xl focus:outline-none focus:border-blue-200 focus:bg-white transition-all font-bold tracking-[0.5em] text-gray-700"
                  />
                </div>
              </div>
            )}

            {error && (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold border border-red-100">
                <AlertCircle size={18} />
                {error}
              </motion.div>
            )}

            {lockout > 0 && (
              <div className="p-4 bg-orange-50 text-orange-600 rounded-xl text-sm font-bold border border-orange-100 text-center">
                 Wait {lockout}s to try again...
              </div>
            )}

            <button
              type="submit"
              disabled={lockout > 0}
              className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-lg shadow-xl shadow-blue-100 flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <span>{mode === 'login' ? 'Enter Classroom' : 'Create Account'}</span>
              <ArrowRight size={20} />
            </button>
          </form>

          <p className="mt-8 text-center text-sm font-medium text-gray-500">
            {mode === 'login' ? "Don't have an account?" : "Already a student?"}
            <button 
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login');
                setError('');
              }}
              className="ml-2 text-blue-600 font-bold hover:underline"
            >
              {mode === 'login' ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
