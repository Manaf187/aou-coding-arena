
import React, { useState, useEffect } from 'react';
import { Button } from './ui/Button';
import { Challenge, Difficulty, LeaderboardEntry } from '../types';
import { getChallenges, createChallenge, updateChallenge, deleteChallenge, getLeaderboard, deleteUser, resetLeaderboard, generateReport, getSystemStats } from '../services/apiClient';
import { Trash2, Edit, Plus, Users, Code, Activity, X, Trophy, AlertTriangle, Zap, Skull, RotateCcw, FileText, Download, Loader, Server, Database, Cpu, Layers } from 'lucide-react';
import { io } from "socket.io-client";
import { Leaderboard } from './Leaderboard';

interface FeedItem {
    id: string;
    userName: string;
    challengeTitle: string;
    status: 'Accepted' | 'Wrong Answer';
    isFirstBlood: boolean;
    timestamp: Date;
}

export const AdminPanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'challenges' | 'leaderboard' | 'monitor'>('monitor');
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  
  const [feed, setFeed] = useState<FeedItem[]>([
    {
        id: 'init-1',
        userName: 'System',
        challengeTitle: 'System Check',
        status: 'Accepted',
        isFirstBlood: false,
        timestamp: new Date()
    }
  ]);

  // System Health State
  const [systemStats, setSystemStats] = useState<any>(null);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Report State
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportContent, setReportContent] = useState('');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newDifficulty, setNewDifficulty] = useState<Difficulty>(Difficulty.EASY);
  const [newPoints, setNewPoints] = useState(100);
  const [testInputs, setTestInputs] = useState([{ input: '', expectedOutput: '', isHidden: false }]);

  useEffect(() => {
    const socketUrl = `${window.location.protocol}//${window.location.hostname}:3001`;
    const socket = io(socketUrl);

    socket.on('submission_feed', (data: any) => {
        setFeed(prev => [{
            id: Date.now().toString() + Math.random(),
            userName: data.userName,
            challengeTitle: data.challengeTitle,
            status: data.status,
            isFirstBlood: data.isFirstBlood,
            timestamp: new Date()
        }, ...prev.slice(0, 19)]);
        loadData();
    });

    socket.on('system_reset', () => {
        setFeed([{
            id: Date.now().toString(),
            userName: 'SYSTEM',
            challengeTitle: 'COMPETITION RESET',
            status: 'Accepted',
            isFirstBlood: false,
            timestamp: new Date()
        }]);
        loadData();
    });

    loadData();
    
    // Polling for System Stats
    const statInterval = setInterval(async () => {
        try {
            const stats = await getSystemStats();
            setSystemStats(stats);
        } catch (e) {
            console.error("Stats poll failed");
        }
    }, 2000);

    return () => {
        socket.disconnect();
        clearInterval(statInterval);
    };
  }, []);

  const loadData = async () => {
    try {
      const cData = await getChallenges();
      setChallenges(cData);
      const lData = await getLeaderboard();
      setLeaderboard(lData);
    } catch (e) {
      console.error("Failed to load admin data");
    }
  };

  // --- ACTIONS ---
  const handleDeleteChallenge = async (id: string) => {
    if (confirm('Are you sure you want to delete this challenge?')) {
      await deleteChallenge(id);
      loadData();
    }
  };

  const handleEditChallenge = (c: Challenge) => {
      setEditingId(c.id);
      setNewTitle(c.title);
      setNewDesc(c.description);
      setNewDifficulty(c.difficulty);
      setNewPoints(c.points);
      setTestInputs(c.testCases.length > 0 ? c.testCases : [{ input: '', expectedOutput: '', isHidden: false }]);
      setIsModalOpen(true);
  };

  const handleOpenNew = () => {
      setEditingId(null);
      setNewTitle('');
      setNewDesc('');
      setNewPoints(100);
      setTestInputs([{ input: '', expectedOutput: '', isHidden: false }]);
      setIsModalOpen(true);
  };

  const handleSaveChallenge = async () => {
    if (!newTitle || !newDesc) return;
    const challengeData = {
      title: newTitle,
      description: newDesc,
      difficulty: newDifficulty,
      points: newPoints,
      starterCode: {
        python: "# Write your code here\n",
        javascript: "// Write your code here\n",
        java: "public class Main {\n    public static void main(String[] args) {\n        // Code here\n    }\n}",
        cpp: "#include <iostream>\nusing namespace std;\n\nint main() {\n    // Code here\n    return 0;\n}"
      },
      testCases: testInputs
    };

    if (editingId) await updateChallenge(editingId, challengeData);
    else await createChallenge(challengeData);

    setIsModalOpen(false);
    loadData();
  };

  const handleDeleteUser = async (userId: string) => {
      if (confirm("Delete this user?")) {
          await deleteUser(userId);
          loadData();
      }
  };

  const handleResetLeaderboard = async () => {
      const confirmation = prompt("TYPE 'RESET' TO CONFIRM.\n\nThis will wipe ALL scores and ALL submission history. Students will be able to solve challenges again.");
      if (confirmation === 'RESET') {
          await resetLeaderboard();
      }
  };

  const handleGenerateReport = async () => {
      setIsReportOpen(true);
      setIsGeneratingReport(true);
      setReportContent('');
      try {
          const data = await generateReport();
          setReportContent(data.report);
      } catch (e) {
          setReportContent("Failed to generate report. Ensure Backend is running.");
      } finally {
          setIsGeneratingReport(false);
      }
  };

  const handleAddTestCase = () => setTestInputs([...testInputs, { input: '', expectedOutput: '', isHidden: false }]);
  const handleTestCaseChange = (index: number, field: string, value: any) => {
    const newCases = [...testInputs];
    // @ts-ignore
    newCases[index][field] = value;
    setTestInputs(newCases);
  };

  // --- STATS WIDGET ---
  const StatsCard = ({ icon: Icon, label, value, subValue, alert = false }: any) => (
      <div className={`p-4 rounded border ${alert ? 'bg-red-900/10 border-red-500' : 'bg-aou-panel border-aou-border'} flex items-center justify-between`}>
          <div>
              <div className="text-gray-500 text-xs uppercase tracking-wider mb-1">{label}</div>
              <div className={`text-2xl font-bold font-mono ${alert ? 'text-red-500 animate-pulse' : 'text-white'}`}>{value}</div>
              {subValue && <div className="text-xs text-gray-400 mt-1">{subValue}</div>}
          </div>
          <Icon className={alert ? 'text-red-500' : 'text-aou-green'} size={24} />
      </div>
  );

  return (
    <div className="min-h-screen bg-aou-darker p-8 relative overflow-hidden">
      
      {/* REPORT MODAL */}
      {isReportOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-aou-panel border border-aou-green w-full max-w-4xl h-[80vh] flex flex-col rounded-lg shadow-2xl relative">
                  <div className="p-4 border-b border-aou-border bg-aou-darker flex justify-between items-center">
                      <h2 className="text-xl font-bold text-aou-green flex items-center gap-2">
                          <FileText /> Competition After-Action Report
                      </h2>
                      <button onClick={() => setIsReportOpen(false)} className="text-gray-400 hover:text-white"><X /></button>
                  </div>
                  <div className="flex-1 overflow-auto p-8 font-mono bg-[#0d1117] text-gray-300">
                      {isGeneratingReport ? (
                          <div className="flex flex-col items-center justify-center h-full gap-4">
                              <Loader className="text-aou-green animate-spin" size={48} />
                              <div className="text-aou-green animate-pulse">Analyzing Competition Data...</div>
                              <div className="text-xs text-gray-500">Connecting to Gemini AI</div>
                          </div>
                      ) : (
                          <div className="prose prose-invert max-w-none whitespace-pre-wrap leading-relaxed">
                              {reportContent}
                          </div>
                      )}
                  </div>
                  <div className="p-4 border-t border-aou-border bg-aou-darker flex justify-end">
                      <Button onClick={() => window.print()} variant="secondary" className="flex items-center gap-2">
                          <Download size={16} /> Print / Save PDF
                      </Button>
                  </div>
              </div>
          </div>
      )}

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="flex justify-between items-end mb-8 border-b border-aou-border pb-4">
            <div>
                <h1 className="text-3xl font-bold text-red-500 font-mono flex items-center gap-3">
                    <Skull size={32} /> ADMIN DASHBOARD v2.2
                </h1>
                <p className="text-gray-400">Live Operations & Control Center</p>
            </div>
            
            <div className="flex bg-aou-panel p-1 rounded-lg border border-aou-border">
                <button onClick={() => setActiveTab('monitor')} className={`px-4 py-2 rounded flex gap-2 transition-all ${activeTab === 'monitor' ? 'bg-red-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>
                    <Activity size={18} /> Live Ops
                </button>
                <button onClick={() => setActiveTab('leaderboard')} className={`px-4 py-2 rounded flex gap-2 transition-all ${activeTab === 'leaderboard' ? 'bg-red-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>
                    <Trophy size={18} /> Users
                </button>
                <button onClick={() => setActiveTab('challenges')} className={`px-4 py-2 rounded flex gap-2 transition-all ${activeTab === 'challenges' ? 'bg-red-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}>
                    <Code size={18} /> Challenges
                </button>
            </div>
        </div>

        {/* --- LIVE MONITOR DASHBOARD --- */}
        {activeTab === 'monitor' && (
            <div className="flex flex-col gap-6">
                
                {/* SYSTEM HEALTH BAR */}
                {systemStats && (
                    <div className="grid grid-cols-4 gap-4 animate-fade-in">
                        <StatsCard 
                            icon={Layers} 
                            label="Execution Queue" 
                            value={`${systemStats.queue.queued} / ${systemStats.queue.limit}`} 
                            subValue={`${systemStats.queue.active} active runners`}
                            alert={systemStats.queue.queued > 5} 
                        />
                        <StatsCard 
                            icon={Database} 
                            label="DB Size (WAL Mode)" 
                            value={`${systemStats.dbSize} MB`} 
                            subValue="Auto-Backup Active" 
                        />
                        <StatsCard 
                            icon={Cpu} 
                            label="Server Memory" 
                            value={`${systemStats.memory.rss} MB`} 
                            subValue={`Heap: ${systemStats.memory.heapUsed} MB`}
                            alert={systemStats.memory.rss > 500}
                        />
                         <StatsCard 
                            icon={Server} 
                            label="Uptime" 
                            value={`${Math.floor(systemStats.uptime / 60)}m`} 
                            subValue="System Stable" 
                        />
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Center: The Big Leaderboard (Using enhanced component with presentation mode) */}
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        <div className="flex justify-end">
                            <Button onClick={handleGenerateReport} variant="secondary" className="flex items-center gap-2 border-aou-green text-aou-green hover:bg-aou-green/20">
                                <FileText size={16} /> AI Report
                            </Button>
                        </div>
                        {/* Enable Presentation Mode for Admin */}
                        <Leaderboard enablePresentation={true} />
                    </div>

                    {/* Right: Live Feed (Log) */}
                    <div className="bg-aou-darker border border-aou-border rounded-lg flex flex-col h-full lg:h-[calc(100vh-320px)]">
                        <div className="p-4 border-b border-aou-border bg-aou-panel flex items-center justify-between">
                            <h3 className="font-bold text-white flex items-center gap-2">
                                <Zap size={18} className="text-blue-400" /> Event Log
                            </h3>
                            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-sm">
                            {feed.map(item => (
                                <div key={item.id} className={`p-3 rounded border-l-2 animate-slide-in ${
                                    item.status === 'Accepted' 
                                        ? (item.isFirstBlood ? 'bg-red-900/20 border-red-500' : item.challengeTitle === 'COMPETITION RESET' ? 'bg-blue-900/20 border-blue-500' : 'bg-green-900/10 border-aou-green') 
                                        : 'bg-aou-panel border-gray-600'
                                }`}>
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-bold text-white">{item.userName}</span>
                                        <span className="text-[10px] text-gray-500">{item.timestamp.toLocaleTimeString()}</span>
                                    </div>
                                    <div className="text-gray-400 text-xs">
                                        {item.challengeTitle === 'COMPETITION RESET' ? 'RESET ALL DATA' : (
                                            <>{item.status === 'Accepted' ? 'solved' : 'failed'} <span className="text-white">{item.challengeTitle}</span></>
                                        )}
                                    </div>
                                    {item.isFirstBlood && (
                                        <div className="mt-1 text-red-500 font-bold text-xs uppercase tracking-widest flex items-center gap-1">
                                            <Skull size={10} /> First Blood
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* --- CHALLENGES TAB --- */}
        {activeTab === 'challenges' && (
            <div className="bg-aou-panel border border-aou-border rounded-lg p-6">
              <div className="flex justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Challenge Management</h2>
                {!isModalOpen && (
                  <Button onClick={handleOpenNew} variant="secondary" className="border-red-500 text-red-500 hover:bg-red-500/10">
                    <Plus size={16} className="inline mr-2" /> New Challenge
                  </Button>
                )}
              </div>

              {isModalOpen && (
                <div className="bg-aou-darker border border-aou-border p-4 rounded mb-6 space-y-4 animate-fade-in">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-white font-bold">{editingId ? 'Edit Challenge' : 'New Challenge'}</h3>
                    <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white"><X size={20}/></button>
                  </div>
                  {/* Form */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Title</label>
                      <input className="w-full bg-aou-panel border border-aou-border rounded p-2 text-white" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Points</label>
                      <input type="number" className="w-full bg-aou-panel border border-aou-border rounded p-2 text-white" value={newPoints} onChange={e => setNewPoints(Number(e.target.value))} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Description</label>
                    <textarea className="w-full bg-aou-panel border border-aou-border rounded p-2 text-white h-24" value={newDesc} onChange={e => setNewDesc(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Difficulty</label>
                    <select className="w-full bg-aou-panel border border-aou-border rounded p-2 text-white" value={newDifficulty} onChange={e => setNewDifficulty(e.target.value as Difficulty)}>
                      <option value={Difficulty.EASY}>Easy</option>
                      <option value={Difficulty.MEDIUM}>Medium</option>
                      <option value={Difficulty.HARD}>Hard</option>
                    </select>
                  </div>
                  <div className="border-t border-aou-border pt-4">
                    <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-bold text-aou-green">Test Cases</label>
                        <Button size="sm" variant="ghost" onClick={handleAddTestCase}>+ Add Case</Button>
                    </div>
                    <div className="space-y-4">
                        {testInputs.map((tc, idx) => (
                            <div key={idx} className="grid grid-cols-2 gap-2 p-2 bg-black/20 rounded border border-aou-border/50">
                                <div className="col-span-1">
                                    <label className="block text-[10px] text-gray-500 mb-1">Input</label>
                                    <textarea 
                                        placeholder="Input" 
                                        className="w-full h-20 bg-aou-panel border border-aou-border rounded p-2 text-xs text-white font-mono resize-none focus:border-aou-green focus:outline-none" 
                                        value={tc.input} 
                                        onChange={e => handleTestCaseChange(idx, 'input', e.target.value)} 
                                    />
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-[10px] text-gray-500 mb-1">Expected Output</label>
                                    <textarea 
                                        placeholder="Expected Output" 
                                        className="w-full h-20 bg-aou-panel border border-aou-border rounded p-2 text-xs text-white font-mono resize-none focus:border-aou-green focus:outline-none" 
                                        value={tc.expectedOutput} 
                                        onChange={e => handleTestCaseChange(idx, 'expectedOutput', e.target.value)} 
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 mt-4">
                    <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                    <Button onClick={handleSaveChallenge}>{editingId ? 'Update' : 'Save'}</Button>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {challenges.map(c => (
                  <div key={c.id} className="flex items-center justify-between p-4 bg-aou-darker rounded border border-aou-border group hover:border-aou-green/30 transition-colors">
                    <div>
                      <h3 className="font-bold text-white">{c.title}</h3>
                      <span className="text-xs text-gray-500">{c.difficulty} - {c.points} pts</span>
                    </div>
                    <div className="flex gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                      <Button onClick={() => handleEditChallenge(c)} variant="ghost" size="sm"><Edit size={16} /></Button>
                      <Button onClick={() => handleDeleteChallenge(c.id)} variant="ghost" size="sm" className="text-red-500"><Trash2 size={16} /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'leaderboard' && (
             <div className="space-y-8">
               <div className="flex justify-between items-center bg-red-900/10 p-6 rounded border border-red-500/30">
                  <div className="flex flex-col gap-1 text-red-400">
                     <div className="flex items-center gap-2">
                        <AlertTriangle size={24} />
                        <span className="font-bold text-lg">Danger Zone</span>
                     </div>
                     <p className="text-sm text-red-400/70">Actions here cannot be undone.</p>
                  </div>
                  <Button variant="danger" size="lg" className="flex items-center gap-2" onClick={handleResetLeaderboard}>
                    <RotateCcw size={18} /> 
                    RESET ALL SOLVERS & SCORES
                  </Button>
               </div>

               <div className="bg-aou-panel border border-aou-border rounded p-4">
                  <h3 className="text-white font-bold mb-4">All Registered Users</h3>
                  {leaderboard.map((entry, idx) => (
                      <div key={idx} className="flex justify-between border-b border-aou-border py-2 text-sm text-gray-300">
                          <span>{entry.name} ({entry.userId})</span>
                          <div className="flex items-center gap-4">
                              <span className="text-aou-green">{entry.score} pts</span>
                              <button onClick={() => handleDeleteUser(entry.userId)} className="text-red-500 hover:text-white"><Trash2 size={14} /></button>
                          </div>
                      </div>
                  ))}
               </div>
             </div>
          )}
      </div>
    </div>
  );
};
