import React from 'react';
import { motion } from 'motion/react';
import { Trophy, ArrowLeft, Award, Lock, CheckCircle, Sparkles } from 'lucide-react';
import { Achievement, PlayerStats } from '../types';
import { soundManager } from '../utils/audio';

interface AchievementModalProps {
  achievements: Achievement[];
  stats: PlayerStats;
  onClose: () => void;
}

export const AchievementModal: React.FC<AchievementModalProps> = ({
  achievements,
  stats,
  onClose,
}) => {
  const unlockedCount = stats.unlockedAchievementIds.length;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 text-white flex flex-col select-none overflow-hidden">
      {/* Header */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 active:scale-95 transition-all"
            aria-label="뒤로가기"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <h1 className="text-base sm:text-lg font-black font-game text-white">
              모험가 업적 전당
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-bold text-amber-300">
          <Sparkles className="w-3.5 h-3.5" />
          <span>달성률: {unlockedCount} / {achievements.length}</span>
        </div>
      </div>

      {/* Achievement Cards */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 max-w-md mx-auto w-full">
        {achievements.map((ach) => {
          const isUnlocked = stats.unlockedAchievementIds.includes(ach.id);

          return (
            <div
              key={ach.id}
              className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${
                isUnlocked
                  ? 'bg-linear-to-r from-amber-950/30 via-slate-900 to-slate-900 border-amber-500/50 shadow-md shadow-amber-500/5'
                  : 'bg-slate-900/60 border-slate-800 opacity-65'
              }`}
            >
              {/* Medal / Badge Icon */}
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 border-2 ${
                  isUnlocked
                    ? 'bg-linear-to-br from-amber-400 to-orange-500 border-amber-300 text-slate-950 shadow-lg shadow-amber-500/30'
                    : 'bg-slate-800 border-slate-700 text-slate-500'
                }`}
              >
                <span className="text-2xl">{isUnlocked ? ach.icon : '🔒'}</span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <h3
                    className={`text-sm font-bold truncate ${
                      isUnlocked ? 'text-amber-300 font-game' : 'text-slate-400'
                    }`}
                  >
                    {ach.title}
                  </h3>
                  {isUnlocked ? (
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-bold shrink-0 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      달성 완료
                    </span>
                  ) : (
                    <span className="text-[10px] bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full font-medium shrink-0 flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                      도전 중
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {ach.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
