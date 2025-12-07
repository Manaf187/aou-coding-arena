
import React, { useState, useEffect } from 'react';
import { User, UserRole, Challenge } from './types';

// --- SERVICE IMPORTS ---
import { login, register, logout, verifyToken, submitCode, getChallenges, runCodeSandbox } from './services/apiClient';
// ------------------------

import { Layout } from './components/Layout';
import { Button } from './components/ui/Button';
import { CodeEditor } from './components/CodeEditor';
import { Leaderboard } from './components/Leaderboard';
import { ChallengeList } from './components/ChallengeList';
import { ChatBot } from './components/ChatBot';
import { AdminPanel } from './components/AdminPanel';
import { SubmissionOverlays } from './components/SubmissionOverlays';
import { SUPPORTED_LANGUAGES } from './constants';
import { Play, Check, ArrowLeft, Lock, UserPlus, Loader, Eye, EyeOff } from 'lucide-react';

const App: React.FC = () => {
  const [route, setRoute] = useState<'login' | 'dashboard' | 'challenge' | 'admin'>('login');
  const [user, setUser] = useState<User | null>(null);
  const [activeChallengeId, setActiveChallengeId] = useState<string | null>(null);
  const [allChallenges, setAllChallenges] = useState<Challenge[]>([]); 
  const [isInitializing, setIsInitializing] = useState(true);
  
  // Auth State
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Challenge State
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('python');
  const [submitStatus, setSubmitStatus] = useState<string | null>(null);
  
  // Custom Input State
  const [customInput, setCustomInput] = useState('');
  const [consoleTab, setConsoleTab] = useState<'output' | 'input'>('input');

  // Overlay State
  const [overlayState, setOverlayState] = useState<{ type: 'none' | 'success' | 'first-blood' | 'second-solver', title: string }>({ 
      type: 'none', 
      title: '' 
  });

  // 1. RESTORE SESSION ON LOAD
  useEffect(() => {
    const init = async () => {
      const existing = await verifyToken(); 
      if (existing) {
        setUser(existing);
        const savedChallengeId = localStorage.getItem('active_challenge_id');
        if (savedChallengeId) {
            setActiveChallengeId(savedChallengeId);
            setRoute('challenge');
        } else {
            setRoute(existing.role === UserRole.ADMIN ? 'admin' : 'dashboard');
        }
      }
      setIsInitializing(false);
    };
    init();
  }, []);

  // 2. FETCH CHALLENGES
  useEffect(() => {
    if ((route === 'dashboard' || route === 'challenge') && user) {
      getChallenges().then(data => {
          setAllChallenges(data);
          
          if (activeChallengeId && !code) {
             const ch = data.find(c => c.id === activeChallengeId);
             if (ch && ch.starterCode) {
                setCode(ch.starterCode[language] || '');
             }
          }
      }).catch(err => {
        console.error("Failed to load challenges. Is the backend running?", err);
      });
    }
  }, [route, user, activeChallengeId]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      let loggedUser;
      if (isRegistering) {
        if (!name || !email || !password) throw new Error("All fields are required");
        loggedUser = await register(name, email, password);
      } else {
        loggedUser = await login(email, password);
      }
      
      setUser(loggedUser);
      setRoute(loggedUser.role === UserRole.ADMIN ? 'admin' : 'dashboard');
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    setRoute('login');
    setEmail('');
    setPassword('');
    setName('');
    localStorage.removeItem('active_challenge_id');
    setActiveChallengeId(null);
  };

  const toggleAuthMode = () => {
    setIsRegistering(!isRegistering);
    setError('');
    setEmail('');
    setPassword('');
    setName('');
  };

  const startChallenge = async (id: string) => {
    const challenge = allChallenges.find(c => c.id === id);
    if (challenge) {
      setActiveChallengeId(id);
      localStorage.setItem('active_challenge_id', id);
      setLanguage('python');
      const starter = challenge.starterCode || {};
      setCode(starter['python'] || '# Write your code here');
      setRoute('challenge');
      setSubmitStatus(null);
      setConsoleTab('input');
    }
  };

  const exitChallenge = () => {
      setRoute('dashboard');
      setActiveChallengeId(null);
      localStorage.removeItem('active_challenge_id');
      setSubmitStatus(null);
  };

  const handleRun = async () => {
    setSubmitStatus('Running...');
    setConsoleTab('output');
    try {
        const result = await runCodeSandbox(code, language, customInput);
        setSubmitStatus(`Status: ${result.status}\n\nOutput:\n${result.output}`);
    } catch (e: any) {
        setSubmitStatus(`Error: ${e.message}`);
    }
  };

  const handleSubmit = async () => {
    if (!activeChallengeId) return;
    const challengeTitle = activeChallenge?.title || 'Challenge';
    
    setSubmitStatus('Evaluating on Server...');
    setConsoleTab('output');
    try {
      const result = await submitCode(activeChallengeId, code, language);
      setSubmitStatus(`Status: ${result.status}\nRuntime: ${result.runtime}ms\n\nOutput:\n${result.output || ''}`);
      
      if (result.status === 'Accepted') {
        // Trigger Animations
        if (result.isFirstBlood) {
            setOverlayState({ type: 'first-blood', title: challengeTitle });
        } else if (result.isSecondSolver) {
            setOverlayState({ type: 'second-solver', title: challengeTitle });
        } else {
            setOverlayState({ type: 'success', title: challengeTitle });
        }

        // Optimistically update local solved state
        if (user) {
            const solvedIds = user.solvedChallengeIds || [];
            if (!solvedIds.includes(activeChallengeId)) {
                setUser({
                    ...user,
                    solvedChallengeIds: [...solvedIds, activeChallengeId]
                });
            }
        }
      }
    } catch (e: any) {
      setSubmitStatus(`Error: ${e.message}`);
    }
  };

  const handleOverlayClose = async () => {
      setOverlayState({ ...overlayState, type: 'none' });
      
      // Redirect to dashboard immediately
      exitChallenge();

      // Force refresh user data from server to ensure stats/badges are perfectly synced
      try {
        const updatedUser = await verifyToken();
        if (updatedUser) {
            setUser(updatedUser);
        }
      } catch (e) {
          console.error("Background sync failed", e);
      }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-aou-darker flex items-center justify-center">
        <Loader className="text-aou-green animate-spin" size={32} />
      </div>
    );
  }

  if (route === 'login') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-aou-darker p-4">
        <div className="w-full max-w-md bg-aou-panel border border-aou-border p-8 rounded-lg shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-aou-green to-transparent opacity-50"></div>
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2 font-mono tracking-tight">ACCESS_CONTROL</h1>
            <p className="text-gray-500 text-sm">Arab Open University - Bahrain</p>
            <p className="text-xs text-aou-green mt-1 font-mono">Faculty of Computer Studies</p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            {isRegistering && (
              <div className="animate-in fade-in slide-in-from-top-4 duration-300">
                <label className="block text-xs font-mono text-aou-green mb-1">FULL NAME</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-aou-darker border border-aou-border rounded px-3 py-2 text-white focus:border-aou-green focus:outline-none focus:ring-1 focus:ring-aou-green"
                  placeholder="John Doe"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-mono text-aou-green mb-1">
                EMAIL ADDRESS
              </label>
              <input 
                type="text" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-aou-darker border border-aou-border rounded px-3 py-2 text-white focus:border-aou-green focus:outline-none focus:ring-1 focus:ring-aou-green"
                placeholder="student@aou.edu.bh"
              />
            </div>
            
            <div>
              <label className="block text-xs font-mono text-aou-green mb-1">PASSWORD</label>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-aou-darker border border-aou-border rounded px-3 py-2 text-white focus:border-aou-green focus:outline-none focus:ring-1 focus:ring-aou-green"
                placeholder="••••••••"
              />
            </div>
            
            {error && (
              <div className="text-red-500 text-sm bg-red-900/10 border border-red-900/30 p-2 rounded flex items-center gap-2">
                 <Lock size={14} /> {error}
              </div>
            )}

            <Button type="submit" className="w-full mt-4" disabled={loading}>
              {loading 
                ? 'PROCESSING...' 
                : (isRegistering ? 'REGISTER ACCOUNT' : 'ESTABLISH CONNECTION')
              }
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-aou-border text-center">
            <button 
              onClick={toggleAuthMode}
              className="text-gray-500 text-sm hover:text-aou-green transition-colors flex items-center justify-center gap-2 w-full"
            >
              {isRegistering ? (
                <>Already have access? <span className="font-bold underline">Login</span></>
              ) : (
                <>New Student? <span className="font-bold underline flex items-center gap-1"><UserPlus size={14}/> Register</span></>
              )}
            </button>
          </div>

          <div className="mt-8 text-center text-xs text-gray-600 font-mono">
            SECURE CONNECTION // ENCRYPTED
          </div>
        </div>
      </div>
    );
  }

  if (route === 'admin') {
    return (
      <Layout user={user} onLogout={handleLogout} onNavigate={() => {}}>
        <AdminPanel />
      </Layout>
    );
  }

  const activeChallenge = allChallenges.find(c => c.id === activeChallengeId);

  return (
    <Layout user={user} onLogout={handleLogout} onNavigate={(path) => setRoute(path === '/' ? 'dashboard' : 'login')}>
      {/* GLOBAL OVERLAYS */}
      <SubmissionOverlays 
          type={overlayState.type} 
          challengeTitle={overlayState.title} 
          onClose={handleOverlayClose} 
      />

      {route === 'dashboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-bold text-white">Available Challenges</h2>
            <ChallengeList 
                challenges={allChallenges} 
                solvedIds={user?.solvedChallengeIds || []}
                onSelectChallenge={startChallenge} 
            />
          </div>
          <div>
            {/* Student sees standard leaderboard, no presentation/maximize button */}
            <Leaderboard enablePresentation={false} />
          </div>
        </div>
      )}

      {route === 'challenge' && activeChallenge && (
        <div className="h-[calc(100vh-140px)] flex flex-col lg:flex-row gap-4">
          <div className="lg:w-1/3 flex flex-col bg-aou-panel border border-aou-border rounded-lg overflow-hidden">
             <div className="p-4 border-b border-aou-border bg-aou-darker flex items-center gap-2">
                <button onClick={exitChallenge} className="text-gray-400 hover:text-white transition-colors">
                  <ArrowLeft size={20} />
                </button>
                <h2 className="font-bold text-lg text-white truncate">{activeChallenge.title}</h2>
             </div>
             
             <div className="flex-1 overflow-y-auto p-6 text-gray-300 space-y-6">
               <div>
                 <h3 className="text-white font-bold mb-2">Description</h3>
                 <p className="whitespace-pre-wrap text-sm leading-relaxed">{activeChallenge.description}</p>
               </div>
               
               {activeChallenge.testCases && activeChallenge.testCases.length > 0 && (
                 <div>
                   <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                     Test Cases 
                     <span className="text-xs font-normal text-gray-500 bg-aou-darker px-2 py-0.5 rounded border border-aou-border">
                       {activeChallenge.testCases.length}
                     </span>
                   </h3>
                   <div className="space-y-3">
                     {activeChallenge.testCases.map((tc, idx) => (
                        <div key={idx} className={`rounded border ${tc.isHidden ? 'bg-aou-darker/50 border-aou-border/30' : 'bg-aou-darker border-aou-border'} p-3 font-mono text-sm`}>
                           <div className="flex justify-between items-center mb-2">
                              <span className={`text-xs font-bold uppercase ${tc.isHidden ? 'text-gray-600' : 'text-aou-green'}`}>
                                Case #{idx + 1}
                              </span>
                              {tc.isHidden ? (
                                <span className="flex items-center gap-1 text-[10px] bg-gray-800 text-gray-500 px-1.5 py-0.5 rounded border border-gray-700">
                                  <EyeOff size={10} /> HIDDEN
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-[10px] bg-green-900/20 text-green-400 px-1.5 py-0.5 rounded border border-green-900/30">
                                  <Eye size={10} /> PUBLIC
                                </span>
                              )}
                           </div>

                           {!tc.isHidden ? (
                             <div className="grid gap-2">
                               <div>
                                 <span className="text-[10px] text-gray-500 block mb-0.5 uppercase">Input</span>
                                 <div className="bg-black/30 text-gray-300 p-2 rounded border border-white/5 whitespace-pre-wrap break-all text-xs">
                                  {tc.input}
                                 </div>
                               </div>
                               <div>
                                 <span className="text-[10px] text-gray-500 block mb-0.5 uppercase">Expected Output</span>
                                 <div className="bg-black/30 text-aou-green p-2 rounded border border-white/5 whitespace-pre-wrap break-all text-xs">
                                  {tc.expectedOutput}
                                 </div>
                               </div>
                             </div>
                           ) : (
                             <div className="text-xs text-gray-600 italic py-2 text-center bg-black/20 rounded">
                               This test case is hidden from view.
                             </div>
                           )}
                        </div>
                     ))}
                   </div>
                 </div>
               )}
             </div>
             
             <ChatBot 
                challengeTitle={activeChallenge.title} 
                challengeDesc={activeChallenge.description}
                currentCode={code}
             />
          </div>

          <div className="lg:w-2/3 flex flex-col gap-2">
            <div className="flex justify-between items-center bg-aou-panel p-2 rounded border border-aou-border">
              <select 
                value={language}
                onChange={(e) => {
                  setLanguage(e.target.value);
                  setCode(activeChallenge.starterCode[e.target.value] || '');
                }}
                className="bg-aou-darker text-white border border-aou-border rounded px-3 py-1 text-sm focus:outline-none"
              >
                {SUPPORTED_LANGUAGES.map(lang => (
                  <option key={lang.id} value={lang.id}>{lang.name}</option>
                ))}
              </select>

              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={handleRun}>
                  <Play size={14} className="mr-1 inline" /> Run
                </Button>
                <Button variant="primary" size="sm" onClick={handleSubmit}>
                  <Check size={14} className="mr-1 inline" /> Submit
                </Button>
              </div>
            </div>

            <div className="flex-1 min-h-[400px]">
              <CodeEditor language={language} value={code} onChange={(val) => setCode(val || '')} />
            </div>

            <div className="h-48 bg-aou-darker border border-aou-border rounded flex flex-col">
              <div className="flex border-b border-aou-border">
                <button 
                    onClick={() => setConsoleTab('input')}
                    className={`px-4 py-2 text-xs font-mono border-r border-aou-border ${consoleTab === 'input' ? 'bg-aou-panel text-white' : 'text-gray-500 hover:text-white'}`}
                >
                    INPUT
                </button>
                <button 
                    onClick={() => setConsoleTab('output')}
                    className={`px-4 py-2 text-xs font-mono border-r border-aou-border ${consoleTab === 'output' ? 'bg-aou-panel text-white' : 'text-gray-500 hover:text-white'}`}
                >
                    OUTPUT
                </button>
              </div>
              
              <div className="flex-1 overflow-auto p-4 font-mono text-sm relative">
                {consoleTab === 'input' ? (
                    <textarea 
                        className="w-full h-full bg-transparent text-white resize-none focus:outline-none"
                        placeholder="Enter custom input here..."
                        value={customInput}
                        onChange={(e) => setCustomInput(e.target.value)}
                    />
                ) : (
                    <pre className={submitStatus?.includes('Accepted') ? 'text-green-400' : submitStatus?.includes('Wrong') ? 'text-red-400' : 'text-gray-300'}>
                        {submitStatus || 'Ready to execute...'}
                    </pre>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
