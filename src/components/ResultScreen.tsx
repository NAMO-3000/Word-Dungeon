import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { Trophy, Heart, Play, Home, Sparkles, Volume2, Skull, RotateCcw } from 'lucide-react';
import { DungeonTheme, WordItem } from '../types';
import { soundManager } from '../utils/audio';
import { speakWord } from '../utils/speech';

interface ResultScreenProps {
  isClear: boolean;
  theme: DungeonTheme;
  hp: number;
  maxHp: number;
  learnedWords: WordItem[];
  goldEarned: number;
  onContinue: () => void;
  onExit: () => void;
}

export const ResultScreen: React.FC<ResultScreenProps> = ({
  isClear,
  theme,
  hp,
  maxHp,
  learnedWords,
  goldEarned,
  onContinue,
  onExit,
}) => {
  useEffect(() => {
    if (isClear) {
      soundManager.playVictory();
    } else {
      soundManager.playGameOver();
    }
  }, [isClear]);

  const handleContinue = () => {
    soundManager.playClick();
    onContinue();
  };

  const handleExit = () => {
    soundManager.playClick();
    onExit();
  };

  return (
    <div className="relative w-full h-full flex flex-col justify-between p-5 text-white overflow-hidden select-none bg-radial from-slate-900 via-slate-950 to-black">
      {/* Background flare */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div
          className={`absolute top-1/4 left-1/3 w-80 h-80 rounded-full blur-3xl animate-pulse ${
            isClear ? 'bg-amber-500/30' : 'bg-rose-600/30'
          }`}
        />
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center my-auto max-w-md mx-auto w-full text-center">
        {/* Top Trophy/Icon */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', damping: 12 }}
          className="mb-3"
        >
          {isClear ? (
            <div className="w-20 h-20 rounded-3xl bg-amber-500/20 border-2 border-amber-400/60 shadow-2xl shadow-amber-500/30 flex items-center justify-center text-4xl">
              🏆
            </div>
          ) : (
            <div className="w-20 h-20 rounded-3xl bg-rose-500/20 border-2 border-rose-500/60 shadow-2xl shadow-rose-500/30 flex items-center justify-center text-4xl">
              💀
            </div>
          )}
        </motion.div>

        {/* 축하 메세지 & [클리어] 글자 per spec */}
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {isClear ? (
            <>
              <div className="inline-block px-3 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold mb-1">
                DUNGEON CONQUERED
              </div>
              <h1 className="text-3xl sm:text-4xl font-black font-game text-transparent bg-clip-text bg-linear-to-r from-amber-300 via-amber-400 to-yellow-200 drop-shadow">
                클리어!
              </h1>
              <p className="text-slate-300 text-xs mt-1">
                축하합니다! <strong>{theme.name}</strong> 10개 층을 모두 정복했습니다!
              </p>
            </>
          ) : (
            <>
              <div className="inline-block px-3 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold mb-1">
                EXPLORATION FAILED
              </div>
              <h1 className="text-3xl sm:text-4xl font-black font-game text-rose-400 drop-shadow">
                던전 탐험 실패
              </h1>
              <p className="text-slate-300 text-xs mt-1">
                목숨이 모두 소진되었습니다. 노트를 복습하고 다시 도전해 보세요!
              </p>
            </>
          )}
        </motion.div>

        {/* 남은 목숨 2/3 형식 (중앙, 작은 글씨) - STRICT SPEC COMPLIANCE */}
        <div
          id="result-hp-display"
          className="my-3 flex items-center justify-center gap-1.5 bg-slate-900/90 border border-slate-700/80 px-3 py-1 rounded-full text-xs font-bold shadow-sm"
        >
          <Heart className={`w-3.5 h-3.5 ${hp > 0 ? 'text-rose-400 fill-rose-500' : 'text-slate-500'}`} />
          <span className="text-slate-200">
            남은 목숨: <strong className={hp > 0 ? 'text-rose-400' : 'text-slate-400'}>{hp}/{maxHp}</strong>
          </span>
        </div>

        {/* Learned Words List Box */}
        <div className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 my-2 max-h-48 overflow-y-auto text-left shadow-inner">
          <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-800">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              오늘의 탐험 영단어 ({learnedWords.length}개)
            </span>
            <span className="text-[10px] text-slate-400">발음 버튼으로 복습</span>
          </div>

          <div className="space-y-1.5">
            {learnedWords.length > 0 ? (
              learnedWords.map((w, index) => (
                <div
                  key={`${w.id}-${index}`}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 transition-all text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-bold text-amber-300 font-pixel truncate">
                      {w.word}
                    </span>
                    <span className="text-slate-400 text-[11px] truncate">
                      {w.meaning}
                    </span>
                  </div>
                  <button
                    onClick={() => speakWord(w.word)}
                    className="p-1 rounded-lg hover:bg-slate-800 text-sky-400 active:scale-90 transition-all shrink-0 ml-1"
                    title="발음 듣기"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 text-center py-2">
                학습한 단어가 없습니다.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Buttons - STRICT SPEC COMPLIANCE:
          [이어하기] 버튼 (왼쪽 아래, 중간 글씨)
          [종료하기] 버튼 (오른쪽 아래, 중간 글씨)
      */}
      <div className="relative z-10 grid grid-cols-2 gap-3 pt-3 border-t border-slate-800/80 max-w-md mx-auto w-full">
        {/* Left Bottom: [이어하기] */}
        <button
          id="continue-game-btn"
          onClick={handleContinue}
          className="py-3 px-4 rounded-xl bg-linear-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 active:scale-95 transition-all"
        >
          {isClear ? (
            <>
              <Play className="w-4 h-4 fill-slate-950" />
              <span>이어하기</span>
            </>
          ) : (
            <>
              <RotateCcw className="w-4 h-4" />
              <span>다시하기</span>
            </>
          )}
        </button>

        {/* Right Bottom: [종료하기] */}
        <button
          id="exit-game-btn"
          onClick={handleExit}
          className="py-3 px-4 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-bold text-base flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md"
        >
          <Home className="w-4 h-4 text-slate-400" />
          <span>종료하기</span>
        </button>
      </div>
    </div>
  );
};
