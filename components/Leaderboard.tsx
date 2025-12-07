
import React, { useEffect, useState, useRef } from 'react';
import { LeaderboardEntry } from '../types';
import { Trophy, Maximize2, Minimize2, Flame, Zap, Target, TrendingUp, Skull, Crown, Activity, List, Gauge } from 'lucide-react';
import { getLeaderboard } from '../services/apiClient';
import { io } from "socket.io-client";

const FIRST_BLOOD_SOUND = "/sounds/first-blood.mp3";
const SECOND_SOLVER_SOUND = "/sounds/second-solver.mp3"; // Fixed casing

interface LeaderboardProps {
    enablePresentation?: boolean;
}

interface FeedItem {
    id: string;
    userName: string;
    challengeTitle: string;
    status: 'Accepted' | 'Wrong Answer' | 'System';
    isFirstBlood: boolean;
    isSecondSolver?: boolean;
    timestamp: number;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ enablePresentation = false }) => {
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [stats, setStats] = useState({ totalSolves: 0, totalSubmissions: 0, accuracy: 0 });
  const [activeTab, setActiveTab] = useState<'rankings' | 'feed'>('rankings');
  
  // Event Popups
  const [firstBloodData, setFirstBloodData] = useState<{userName: string, challengeTitle: string} | null>(null);
  const [secondSolverData, setSecondSolverData] = useState<{userName: string, challengeTitle: string} | null>(null);
  
  const fbAudioRef = useRef<HTMLAudioElement | null>(null);
  const ssAudioRef = useRef<HTMLAudioElement | null>(null);

  const fetchData = async () => {
    try {
        const res = await getLeaderboard();
        setData(res);

        const totalScore = res.reduce((acc, curr) => acc + curr.score, 0);
        const solves = res.reduce((acc, curr) => acc + curr.solvedCount, 0);
        const subs = Math.floor(solves * 1.5) + Math.floor(Math.random() * 10); 
        const acc = subs > 0 ? Math.floor((solves / subs) * 100) : 0;
        
        setStats({ totalSolves: solves, totalSubmissions: totalScore, accuracy: acc });
    } catch (e) {
        console.error("Failed to fetch leaderboard");
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Initialize Audio
    if (enablePresentation) {
        fbAudioRef.current = new Audio(FIRST_BLOOD_SOUND);
        fbAudioRef.current.load();
        
        ssAudioRef.current = new Audio(SECOND_SOLVER_SOUND);
        ssAudioRef.current.load();
    }

    const socketUrl = `${window.location.protocol}//${window.location.hostname}:3001`;
    const socket = io(socketUrl);

    socket.on('leaderboard_update', () => fetchData());
    
    socket.on('system_reset', () => {
        fetchData();
        // Add System Reset Message to Feed
        setFeed([{
            id: Date.now().toString(),
            userName: 'SYSTEM',
            challengeTitle: 'COMPETITION RESET',
            status: 'System',
            isFirstBlood: false,
            timestamp: Date.now()
        }]);
    });

    socket.on('submission_feed', (newItem: any) => {
        fetchData();
        setFeed(prev => {
            const item: FeedItem = {
                id: Date.now().toString() + Math.random(),
                userName: newItem.userName,
                challengeTitle: newItem.challengeTitle,
                status: newItem.status,
                isFirstBlood: newItem.isFirstBlood,
                isSecondSolver: newItem.isSecondSolver,
                timestamp: Date.now()
            };
            // Keep last 50 items
            return [item, ...prev].slice(0, 50);
        });
    });

    // Only listen for effects if presentation mode is enabled
    if (enablePresentation) {
        // FIRST BLOOD
        socket.on('first_blood', (data: any) => {
            console.log("FIRST BLOOD EVENT RECEIVED", data);
            setFirstBloodData({ userName: data.userName, challengeTitle: data.challengeTitle });
            
            if (fbAudioRef.current) {
                const audio = fbAudioRef.current;
                audio.currentTime = 0;
                const handleAudioEnd = () => {
                    setFirstBloodData(null);
                    audio.removeEventListener('ended', handleAudioEnd);
                };
                audio.addEventListener('ended', handleAudioEnd);
                audio.play().catch(e => {
                    console.warn("Audio play failed (interaction required?)", e);
                    setTimeout(() => setFirstBloodData(null), 4000);
                });
            } else {
                 setTimeout(() => setFirstBloodData(null), 4000);
            }
        });

        // SECOND SOLVER
        socket.on('second_solver', (data: any) => {
            console.log("SECOND SOLVER EVENT RECEIVED", data);
            setSecondSolverData({ userName: data.userName, challengeTitle: data.challengeTitle });
            
            if (ssAudioRef.current) {
                const audio = ssAudioRef.current;
                audio.currentTime = 0;
                const handleAudioEnd = () => {
                    setSecondSolverData(null);
                    audio.removeEventListener('ended', handleAudioEnd);
                };
                audio.addEventListener('ended', handleAudioEnd);
                audio.play().catch(e => {
                    console.warn("Audio play failed (interaction required?)", e);
                    setTimeout(() => setSecondSolverData(null), 4000);
                });
            } else {
                 setTimeout(() => setSecondSolverData(null), 4000);
            }
        });
    }

    const interval = setInterval(fetchData, 10000);
    return () => {
        clearInterval(interval);
        socket.disconnect();
    };
  }, [enablePresentation]);

  // --- SUB-COMPONENTS ---

  const PodiumCard = ({ entry, rank, large = false }: { entry: LeaderboardEntry, rank: number, large?: boolean }) => {
      const colors = rank === 1 
        ? 'border-yellow-400 bg-yellow-400/10 shadow-[0_0_50px_rgba(250,204,21,0.2)]' 
        : rank === 2 
            ? 'border-gray-300 bg-gray-300/10 shadow-[0_0_30px_rgba(209,213,219,0.1)]' 
            : 'border-orange-600 bg-orange-600/10 shadow-[0_0_30px_rgba(234,88,12,0.1)]';
      
      const textColor = rank === 1 ? 'text-yellow-400' : rank === 2 ? 'text-gray-300' : 'text-orange-500';
      
      const h1 = large ? 'h-64' : 'h-48';
      const h2 = large ? 'h-52' : 'h-32';
      const h3 = large ? 'h-48' : 'h-24';
      
      const height = rank === 1 ? h1 : rank === 2 ? h2 : h3;
      const icon = rank === 1 ? <Crown size={large ? 48 : 32} className={`mb-2 animate-bounce ${textColor}`} fill={rank===1 ? "gold" : "none"} /> : null;

      return (
          <div className={`flex flex-col items-center justify-end ${rank === 1 ? (large ? '-mt-12 z-10' : '-mt-4 z-10') : ''} w-full`}>
              <div className={`${icon ? 'animate-pulse' : ''}`}>{icon}</div>
              <div className="text-center mb-2">
                  <div className={`font-bold ${large ? 'text-2xl' : 'text-sm'} ${textColor} tracking-tight truncate max-w-[120px]`}>{entry.name}</div>
                  {large && <div className="font-mono text-xs text-gray-500">{entry.userId}</div>}
              </div>
              <div className={`w-full ${height} ${colors} border-t-4 rounded-t-xl flex flex-col items-center justify-center backdrop-blur-md relative overflow-hidden group transition-all duration-500 hover:brightness-125`}>
                   <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent"></div>
                   <span className={`${large ? 'text-6xl' : 'text-4xl'} font-black opacity-20 ${textColor}`}>{rank}</span>
                   <div className={`mt-2 font-mono ${large ? 'text-3xl' : 'text-xl'} font-bold text-white z-10 flex items-center gap-2`}>
                       {entry.score} <span className="text-xs font-normal opacity-50">PTS</span>
                   </div>
              </div>
          </div>
      );
  };

  const FeedList = ({ items, limit }: { items: FeedItem[], limit?: number }) => {
      const displayItems = limit ? items.slice(0, limit) : items;
      return (
          <div className="space-y-2">
              {displayItems.map((item) => {
                  let borderClass = 'border-gray-600 bg-aou-panel';
                  let statusColor = 'text-gray-400';
                  
                  if (item.status === 'Accepted') {
                      if (item.isFirstBlood) {
                        borderClass = 'bg-red-900/20 border-red-500';
                        statusColor = 'text-red-500';
                      } else if (item.isSecondSolver) {
                        borderClass = 'bg-cyan-900/10 border-cyan-400';
                        statusColor = 'text-cyan-400';
                      } else {
                        borderClass = 'bg-green-900/10 border-aou-green';
                        statusColor = 'text-aou-green';
                      }
                  } else if (item.status === 'System') {
                      borderClass = 'bg-blue-900/20 border-blue-500';
                      statusColor = 'text-blue-400';
                  }

                  return (
                    <div key={item.id} className={`p-2 rounded border-l-2 flex items-center justify-between animate-slide-in ${borderClass}`}>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-white text-sm">{item.userName}</span>
                                {item.isFirstBlood && <Skull size={12} className="text-red-500 animate-pulse"/>}
                                {item.isSecondSolver && <Zap size={12} className="text-cyan-400 animate-pulse"/>}
                            </div>
                            <span className="text-xs text-gray-400">{item.challengeTitle}</span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className={`text-xs font-bold ${statusColor}`}>
                                {item.status === 'Accepted' ? 'SOLVED' : item.status === 'System' ? 'SYSTEM' : 'FAILED'}
                            </span>
                            <span className="text-[10px] text-gray-600 font-mono">
                                {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}
                            </span>
                        </div>
                    </div>
                  );
              })}
              {displayItems.length === 0 && (
                  <div className="text-center text-gray-600 py-4 italic text-xs">Waiting for activity...</div>
              )}
          </div>
      );
  };

  const topThree = data.slice(0, 3);
  const restOfList = data.slice(3);

  // --- FULL SCREEN PRESENTATION MODE ---
  if (isFullScreen) {
      return (
          <div className="fixed inset-0 z-50 bg-[#050505] text-white flex flex-col overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gray-900 via-[#050505] to-black">
              
              {/* FIRST BLOOD OVERLAY */}
              {firstBloodData && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none bg-black/80 animate-fade-in">
                    <div className="text-center animate-shake scale-150">
                        <h1 className="text-9xl font-black text-red-600 tracking-tighter drop-shadow-[0_0_50px_rgba(255,0,0,0.8)] animate-pulse">
                            FIRST BLOOD!
                        </h1>
                        <div className="mt-8 text-4xl text-white font-mono border-t-4 border-b-4 border-red-600 py-4 bg-black/50 backdrop-blur">
                            <span className="text-aou-green">{firstBloodData.userName}</span> 
                            <span className="mx-4 text-gray-400">CONQUERED</span>
                            <span className="text-yellow-500">{firstBloodData.challengeTitle}</span>
                        </div>
                    </div>
                </div>
              )}

              {/* SECOND SOLVER OVERLAY */}
              {secondSolverData && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none bg-black/80 animate-fade-in">
                    <div className="text-center animate-slide-in scale-125">
                        <h1 className="text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500 tracking-tighter drop-shadow-[0_0_50px_rgba(255,255,255,0.4)]">
                            SECOND SOLVER
                        </h1>
                        <div className="mt-8 text-4xl text-white font-mono border-t-4 border-b-4 border-cyan-400 py-4 bg-black/50 backdrop-blur flex items-center justify-center gap-4">
                            <span className="text-cyan-400">{secondSolverData.userName}</span> 
                            <span className="text-gray-400">IS FAST ON</span>
                            <span className="text-white">{secondSolverData.challengeTitle}</span>
                        </div>
                    </div>
                </div>
              )}

              {/* Scanlines Effect */}
              <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-[1] background-size-[100%_2px,3px_100%]"></div>
              
              {/* Header */}
              <div className="relative z-10 p-6 flex justify-between items-start border-b border-white/10 bg-black/40 backdrop-blur">
                  <div>
                      <h1 className="text-5xl font-black tracking-tighter italic text-transparent bg-clip-text bg-gradient-to-r from-aou-green to-emerald-600 drop-shadow-[0_0_10px_rgba(0,255,65,0.5)]">
                          AOU ARENA <span className="text-white not-italic font-mono text-2xl align-super">LEADERBOARD</span>
                      </h1>
                      <div className="flex items-center gap-3 mt-2 text-aou-green font-mono text-sm">
                          <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-aou-green opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-aou-green"></span>
                          </span>
                          LIVE UPDATES ENABLED
                      </div>
                  </div>
                  <button onClick={() => setIsFullScreen(false)} className="p-2 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors">
                      <Minimize2 size={32} />
                  </button>
              </div>

              {/* Body */}
              <div className="flex-1 relative z-10 p-8 grid grid-cols-1 lg:grid-cols-3 gap-12 overflow-hidden">
                  
                  {/* Left Column: Feed + Challengers */}
                  <div className="lg:col-span-1 flex flex-col gap-6 overflow-hidden">
                       {/* Top Half: Live Feed (Replicates Admin Panel Look) */}
                       <div className="flex-1 bg-white/5 rounded-xl border border-white/10 p-4 overflow-hidden flex flex-col backdrop-blur-sm relative">
                           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50"></div>
                           <h3 className="font-bold text-gray-400 mb-4 flex items-center justify-between border-b border-white/10 pb-2">
                               <div className="flex items-center gap-2">
                                   <Zap size={18} className="text-blue-400" /> EVENT LOG
                               </div>
                               <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                           </h3>
                           <div className="flex-1 overflow-y-auto pr-2 scrollbar-hide">
                               <FeedList items={feed} />
                           </div>
                       </div>

                       {/* Bottom Half: Challengers List */}
                       <div className="flex-1 bg-white/5 rounded-xl border border-white/10 p-4 overflow-hidden flex flex-col backdrop-blur-sm relative">
                           <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-aou-green to-transparent opacity-50"></div>
                           <h3 className="font-bold text-gray-400 mb-4 flex items-center gap-2">
                               <TrendingUp size={16} /> CHALLENGERS
                           </h3>
                           <div className="flex-1 overflow-y-auto pr-2 space-y-2 scrollbar-hide">
                               {restOfList.map((entry, idx) => (
                                   <div key={entry.userId} className="flex items-center justify-between p-3 rounded bg-black/40 border border-white/5 hover:border-aou-green/50 transition-colors">
                                       <div className="flex items-center gap-3">
                                           <span className="font-mono text-gray-500 w-6">#{idx + 4}</span>
                                           <span className="font-bold text-gray-200">{entry.name}</span>
                                       </div>
                                       <div className="font-mono text-aou-green">{entry.score}</div>
                                   </div>
                               ))}
                               {restOfList.length === 0 && <div className="text-gray-500 italic text-center mt-10">Searching for challengers...</div>}
                           </div>
                       </div>
                  </div>

                  {/* Right 2 Columns: The Podium */}
                  <div className="lg:col-span-2 flex flex-col justify-end pb-12">
                      <div className="flex justify-center items-end gap-4 md:gap-8 w-full max-w-4xl mx-auto">
                          {topThree[1] && <PodiumCard entry={topThree[1]} rank={2} large={true} />}
                          {topThree[0] && <PodiumCard entry={topThree[0]} rank={1} large={true} />}
                          {topThree[2] && <PodiumCard entry={topThree[2]} rank={3} large={true} />}
                      </div>
                      
                      {topThree.length === 0 && (
                          <div className="flex flex-col items-center justify-center h-full text-gray-600">
                              <div className="animate-spin mb-4"><Zap size={48} className="text-gray-700"/></div>
                              <div className="text-2xl font-mono">AWAITING DATA STREAM...</div>
                          </div>
                      )}
                  </div>
              </div>

              {/* Ticker Footer */}
              <div className="h-12 bg-aou-green text-black font-mono font-bold text-lg flex items-center overflow-hidden relative z-20">
                  <div className="animate-[marquee_20s_linear_infinite] whitespace-nowrap flex items-center gap-8 px-4">
                      <span className="flex items-center gap-2"><Flame size={20}/> COMPETITION IS HEATING UP</span>
                      <span>///</span>
                      <span className="flex items-center gap-2"><Target size={20}/> TOTAL SOLVES: {stats.totalSolves}</span>
                      <span>///</span>
                      <span className="flex items-center gap-2"><Zap size={20}/> GLOBAL POINTS: {stats.totalSubmissions}</span>
                      <span>///</span>
                      <span className="flex items-center gap-2"><Skull size={20}/> HARDEST LEVEL: "LRU CACHE" (12% Pass Rate)</span>
                      <span>///</span>
                      <span className="flex items-center gap-2">KEEP CODING. KEEP PUSHING.</span>
                      <span>///</span>
                      {/* Repeat for seamless loop */}
                      <span className="flex items-center gap-2"><Flame size={20}/> COMPETITION IS HEATING UP</span>
                      <span>///</span>
                      <span className="flex items-center gap-2"><Target size={20}/> TOTAL SOLVES: {stats.totalSolves}</span>
                  </div>
              </div>
          </div>
      );
  }

  // --- STANDARD WIDGET MODE (Dashboard & Admin Widget) ---
  return (
    <div className="bg-aou-panel border border-aou-border rounded-lg p-6 shadow-lg flex flex-col h-full relative overflow-hidden">
      
      {/* Widget Mode Overlay (Admin Only) - CHANGED TO FIXED/FULLSCREEN */}
      {enablePresentation && (firstBloodData || secondSolverData) && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 animate-fade-in backdrop-blur-sm">
            <div className="text-center animate-shake">
                <h1 className={`text-6xl font-black tracking-tighter drop-shadow-[0_0_50px_rgba(255,255,255,0.4)] animate-pulse ${firstBloodData ? 'text-red-600' : 'text-cyan-400'}`}>
                    {firstBloodData ? "FIRST BLOOD!" : "SECOND SOLVER!"}
                </h1>
                <div className={`mt-6 text-2xl text-white font-mono border-t-4 border-b-4 py-4 bg-black/50 ${firstBloodData ? 'border-red-600' : 'border-cyan-400'}`}>
                    <span className="text-aou-green font-bold">{firstBloodData?.userName || secondSolverData?.userName}</span> 
                    <span className="ml-2 text-gray-400">just solved</span>
                    <br/>
                    <span className="text-white font-bold">{firstBloodData?.challengeTitle || secondSolverData?.challengeTitle}</span>
                </div>
            </div>
        </div>
      )}

      {/* Header & Tabs */}
      <div className="flex flex-col gap-4 mb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Trophy className="text-yellow-400" /> Leaderboard
            </h2>
            <div className="flex items-center gap-2">
                {enablePresentation && (
                    <button 
                        onClick={() => setIsFullScreen(true)} 
                        className="flex items-center gap-2 bg-aou-green/10 hover:bg-aou-green/20 text-aou-green px-3 py-1 rounded border border-aou-green/30 transition-all text-xs font-bold uppercase tracking-wider" 
                        title="Launch Big Screen Mode"
                    >
                        <Maximize2 size={14} /> Projector Mode
                    </button>
                )}
                <div className="flex items-center gap-2 text-xs text-aou-green bg-aou-green/10 px-2 py-1 rounded border border-aou-green/20">
                    <div className="w-1.5 h-1.5 bg-aou-green rounded-full animate-pulse"></div>
                    LIVE
                </div>
            </div>
          </div>
          
          {/* Tabs */}
          <div className="flex border-b border-aou-border">
              <button 
                onClick={() => setActiveTab('rankings')}
                className={`flex-1 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'rankings' ? 'border-aou-green text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
              >
                  <List size={14} className="inline mr-2" /> Rankings
              </button>
              <button 
                onClick={() => setActiveTab('feed')}
                className={`flex-1 py-2 text-sm font-medium transition-colors border-b-2 ${activeTab === 'feed' ? 'border-aou-green text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
              >
                  <Activity size={14} className="inline mr-2" /> Activity Feed
              </button>
          </div>
      </div>

      {activeTab === 'rankings' && (
        <>
            {/* Mini Podium for Widget View */}
            {data.length > 0 && (
                <div className="flex justify-center items-end gap-2 mb-4 px-4 pb-2 border-b border-aou-border/30">
                    {topThree[1] && <PodiumCard entry={topThree[1]} rank={2} />}
                    {topThree[0] && <PodiumCard entry={topThree[0]} rank={1} />}
                    {topThree[2] && <PodiumCard entry={topThree[2]} rank={3} />}
                </div>
            )}

            {data.length === 0 && !isLoading && (
                <div className="text-center py-8 text-gray-500 italic">
                    No active participants yet.
                </div>
            )}

            {/* Table */}
            <div className="flex-1 overflow-y-auto -mx-2 px-2 scrollbar-thin scrollbar-thumb-aou-border">
                <table className="w-full text-left text-sm">
                    <thead className="text-gray-500 font-mono text-xs uppercase tracking-wider sticky top-0 bg-aou-panel z-10 pb-2">
                    <tr className="border-b border-aou-border">
                        <th className="px-2 py-2">#</th>
                        <th className="px-2 py-2">Hacker</th>
                        <th className="px-2 py-2 text-right">Score</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-aou-border/30">
                    {data.map((entry, idx) => (
                        <tr key={entry.userId} className="hover:bg-white/5 transition-colors group">
                        <td className="px-2 py-3 font-mono text-gray-500">
                            {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                        </td>
                        <td className="px-2 py-3 font-medium text-white group-hover:text-aou-green transition-colors">
                            {entry.name}
                        </td>
                        <td className="px-2 py-3 text-right font-mono text-aou-green font-bold">
                            {entry.score}
                        </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </>
      )}

      {activeTab === 'feed' && (
          <div className="flex-1 overflow-y-auto -mx-2 px-2 scrollbar-thin scrollbar-thumb-aou-border">
              <FeedList items={feed} />
          </div>
      )}
    </div>
  );
};
