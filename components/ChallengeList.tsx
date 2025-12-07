
import React from 'react';
import { Challenge } from '../types';
import { Button } from './ui/Button';
import { ArrowRight, Code2, CheckCircle, Skull, Trophy } from 'lucide-react';

interface ChallengeListProps {
  challenges: Challenge[];
  solvedIds: string[];
  onSelectChallenge: (id: string) => void;
}

export const ChallengeList: React.FC<ChallengeListProps> = ({ challenges, solvedIds, onSelectChallenge }) => {
  return (
    <div className="grid gap-4">
      {challenges.length === 0 && (
         <div className="text-gray-500 text-center py-8">
            No challenges available yet.
         </div>
      )}
      {challenges.map((challenge) => {
        const isSolved = solvedIds.includes(challenge.id.toString());
        
        return (
            <div 
              key={challenge.id}
              className={`group relative bg-aou-panel border rounded-lg p-6 transition-all duration-300 ${
                  isSolved 
                    ? 'border-aou-green shadow-[0_0_15px_rgba(0,255,65,0.15)] bg-green-900/5' 
                    : 'border-aou-border hover:border-aou-green/50'
              }`}
            >
              {/* Pwn3d Background Stamp Effect */}
              {isSolved && (
                  <div className="absolute top-0 right-0 p-4 opacity-20 pointer-events-none">
                      <div className="border-4 border-aou-green text-aou-green font-black text-5xl -rotate-12 p-2 tracking-tighter">
                          PWN3D
                      </div>
                  </div>
              )}

              <div className="flex justify-between items-start relative z-10">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className={`text-lg font-bold transition-colors ${isSolved ? 'text-aou-green' : 'text-white group-hover:text-aou-green'}`}>
                      {challenge.title}
                    </h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      challenge.difficulty === 'Easy' ? 'bg-green-900/30 text-green-400 border border-green-900' :
                      challenge.difficulty === 'Medium' ? 'bg-yellow-900/30 text-yellow-400 border border-yellow-900' :
                      'bg-red-900/30 text-red-400 border border-red-900'
                    }`}>
                      {challenge.difficulty}
                    </span>
                    {isSolved && (
                        <span className="flex items-center gap-1 text-[10px] bg-aou-green text-black font-bold px-1.5 py-0.5 rounded uppercase tracking-wider animate-pulse">
                            <Skull size={10} /> SOLVED
                        </span>
                    )}
                  </div>
                  <p className="text-gray-400 text-sm line-clamp-2 max-w-xl">
                    {challenge.description}
                  </p>
                </div>
                
                <div className="text-right">
                  <div className={`text-2xl font-mono font-bold ${isSolved ? 'text-aou-green' : 'text-white'}`}>
                    {challenge.points}
                  </div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider">Points</div>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between relative z-10">
                <div className="flex gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1"><Code2 size={14} /> Algorithm</span>
                  {isSolved && <span className="flex items-center gap-1 text-aou-green"><Trophy size={14} /> Score Added</span>}
                </div>
                
                <Button 
                    onClick={() => onSelectChallenge(challenge.id)} 
                    variant={isSolved ? 'secondary' : 'primary'}
                    className="group-hover:translate-x-1 transition-transform"
                >
                  {isSolved ? (
                      <>Replay Level <ArrowRight size={16} className="ml-2 inline" /></>
                  ) : (
                      <>Solve Challenge <ArrowRight size={16} className="ml-2 inline" /></>
                  )}
                </Button>
              </div>
            </div>
        );
      })}
    </div>
  );
};
