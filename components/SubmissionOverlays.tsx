
import React, { useEffect, useState } from 'react';
import { Skull, CheckCircle, Trophy, Star, Medal, Zap } from 'lucide-react';
import { Button } from './ui/Button';

// SOUND CONSTANTS
// Ensure these files exist in your public/sounds/ directory
const FIRST_BLOOD_SOUND = "/sounds/first-blood.mp3";
const SECOND_SOLVER_SOUND = "/sounds/second-solver.mp3";
const SUCCESS_SOUND = "/sounds/success.mp3"; 

interface SubmissionOverlaysProps {
  type: 'none' | 'success' | 'first-blood' | 'second-solver';
  challengeTitle: string;
  onClose: () => void;
}

export const SubmissionOverlays: React.FC<SubmissionOverlaysProps> = ({ type, challengeTitle, onClose }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (type !== 'none') {
      setVisible(true);
      
      // Play Sound Effect
      try {
          let audioSrc = '';
          if (type === 'first-blood') audioSrc = FIRST_BLOOD_SOUND;
          else if (type === 'second-solver') audioSrc = SECOND_SOLVER_SOUND;
          else if (type === 'success') audioSrc = SUCCESS_SOUND;

          if (audioSrc) {
              const audio = new Audio(audioSrc);
              audio.volume = 0.6; // Not too loud
              const playPromise = audio.play();
              
              if (playPromise !== undefined) {
                  playPromise.catch(error => {
                      console.warn("Audio playback failed:", error);
                      // This usually happens if the user hasn't interacted with the page yet,
                      // or if the file is missing (404).
                  });
              }
          }
      } catch (e) {
          console.error("Audio system error", e);
      }

    } else {
      setVisible(false);
    }
  }, [type]);

  if (!visible || type === 'none') return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md animate-fade-in">
      
      {/* --- FIRST BLOOD (RED) --- */}
      {type === 'first-blood' && (
        <div className="text-center animate-shake relative">
          {/* Confetti / Burst Effects using CSS shadows/gradients */}
          <div className="absolute inset-0 bg-red-500/20 blur-[100px] rounded-full animate-pulse"></div>
          
          <div className="relative z-10 bg-black/60 p-12 rounded-xl border-2 border-red-600 shadow-[0_0_100px_rgba(220,38,38,0.5)]">
             <div className="flex justify-center items-center gap-4 mb-6">
                <Medal size={80} className="text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
                <Skull size={60} className="text-red-600" />
             </div>
             
             <h1 className="text-8xl font-black text-red-600 tracking-tighter drop-shadow-[0_0_10px_rgba(255,0,0,0.8)] mb-2 uppercase">
                First Blood!
             </h1>
             <p className="text-2xl text-white font-mono mb-6">
                LEGENDARY! You are the first to solve <br/>
                <span className="text-yellow-400 font-bold">{challengeTitle}</span>
             </p>
             
             <div className="flex justify-center gap-4">
                 <div className="bg-red-900/40 border border-red-500 text-red-400 px-4 py-2 rounded font-mono font-bold flex items-center gap-2">
                    <Star size={18} fill="currentColor" /> + BONUS POINTS
                 </div>
             </div>

             <div className="mt-8">
                 <Button onClick={onClose} className="bg-red-600 hover:bg-red-700 text-white border-none px-8 py-3 text-lg font-bold uppercase tracking-wider shadow-lg hover:shadow-red-500/50">
                    Claim Glory
                 </Button>
             </div>
          </div>
        </div>
      )}

      {/* --- SECOND SOLVER (SILVER) --- */}
      {type === 'second-solver' && (
        <div className="text-center animate-slide-in relative">
          <div className="absolute inset-0 bg-cyan-500/20 blur-[100px] rounded-full animate-pulse"></div>
          
          <div className="relative z-10 bg-[#0d1117] p-12 rounded-xl border-2 border-cyan-400 shadow-[0_0_80px_rgba(34,211,238,0.4)]">
             <div className="flex justify-center items-center gap-4 mb-6">
                <Zap size={80} className="text-cyan-400 drop-shadow-[0_0_15px_rgba(34,211,238,0.8)] animate-pulse" />
             </div>
             
             <h1 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 tracking-tighter drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] mb-2 uppercase italic">
                SECOND SOLVER
             </h1>
             <p className="text-xl text-gray-300 font-mono mb-6">
                LIGHTNING FAST! You secured the runner-up spot for <br/>
                <span className="text-cyan-400 font-bold">{challengeTitle}</span>
             </p>
             
             <div className="flex justify-center gap-4">
                 <div className="bg-cyan-900/40 border border-cyan-500 text-cyan-300 px-4 py-2 rounded font-mono font-bold flex items-center gap-2">
                    <Star size={18} fill="currentColor" /> + BONUS POINTS
                 </div>
             </div>

             <div className="mt-8">
                 <Button onClick={onClose} className="bg-cyan-600 hover:bg-cyan-500 text-black border-none px-8 py-3 text-lg font-bold uppercase tracking-wider shadow-lg hover:shadow-cyan-500/50">
                    Excellent Work
                 </Button>
             </div>
          </div>
        </div>
      )}

      {/* --- STANDARD SUCCESS --- */}
      {type === 'success' && (
        <div className="text-center relative animate-slide-in">
           <div className="absolute inset-0 bg-aou-green/10 blur-[80px] rounded-full"></div>
           
           <div className="relative z-10 bg-[#0d1117] p-10 rounded-xl border border-aou-green shadow-[0_0_50px_rgba(0,255,65,0.2)] max-w-lg w-full">
              <div className="flex justify-center mb-6">
                  <div className="bg-aou-green/20 p-4 rounded-full border border-aou-green/50">
                      <CheckCircle size={64} className="text-aou-green" />
                  </div>
              </div>
              
              <h2 className="text-4xl font-bold text-white mb-2 tracking-tight">Access Granted</h2>
              <p className="text-gray-400 mb-6">
                 Correct solution for <span className="text-aou-green font-mono">{challengeTitle}</span>. <br/>
                 Points have been added to your profile.
              </p>

              <Button onClick={onClose} variant="secondary" className="w-full justify-center">
                 Continue Hacking
              </Button>
           </div>
        </div>
      )}
    </div>
  );
};
