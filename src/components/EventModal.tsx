import React from 'react';
import { motion } from 'motion/react';
import { Flame, Gift, Heart, Coins, Sparkles, Footprints } from 'lucide-react';
import { MapNode, WordItem } from '../types';
import { soundManager } from '../utils/audio';
import { speakWord } from '../utils/speech';

interface EventModalProps {
  node: MapNode;
  currentHp: number;
  maxHp: number;
  bonusWord?: WordItem;
  onHeal: () => void;
  onCollectChest: (gold: number, word?: WordItem) => void;
  onSkipRest: (rewardGold: number) => void;
  onClose: () => void;
}

export const EventModal: React.FC<EventModalProps> = ({
  node,
  currentHp,
  maxHp,
  bonusWord,
  onHeal,
  onCollectChest,
  onSkipRest,
  onClose,
}) => {
  const isRest = node.type === 'rest';

  const handleHealClick = () => {
    soundManager.playHeal();
    onHeal();
    onClose();
  };

  const handleSkipRestClick = () => {
    soundManager.playChest();
    // Award small gold (+20 Gold) and advance to next floor
    onSkipRest(20);
    onClose();
  };

  const handleChestClick = () => {
    soundManager.playChest();
    onCollectChest(30, bonusWord);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-6 shadow-2xl text-center flex flex-col items-center"
      >
        {isRest ? (
          <>
            <div className="w-16 h-16 rounded-2xl bg-orange-500/20 border border-orange-500/40 flex items-center justify-center mb-3">
              <Flame className="w-9 h-9 text-orange-400 animate-pulse" />
            </div>
            <h2 className="text-xl font-black font-game text-orange-300 mb-1">
              모닥불 휴식처
            </h2>
            <p className="text-xs text-slate-300 mb-5 leading-relaxed">
              따뜻한 모닥불 가에서 지친 목숨을 회복하거나, 멈추지 않고 바로 진격하여 추가 보상을 얻으세요!
            </p>

            <div className="w-full space-y-2.5">
              <button
                id="rest-heal-btn"
                onClick={handleHealClick}
                disabled={currentHp >= maxHp}
                className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border transition-all ${
                  currentHp < maxHp
                    ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-400 active:scale-95 shadow-lg shadow-rose-600/30'
                    : 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed'
                }`}
              >
                <Heart className="w-4 h-4 text-rose-300 fill-rose-300" />
                <span>목숨 1개 회복 (+1 HP)</span>
              </button>

              <button
                id="rest-skip-btn"
                onClick={handleSkipRestClick}
                className="w-full py-3 px-4 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-sm border border-amber-500/50 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-md shadow-amber-500/10"
              >
                <Footprints className="w-4 h-4 text-amber-400" />
                <span>쉬지 않고 바로 출발하기 (+20 Gold)</span>
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center mb-3">
              <Gift className="w-9 h-9 text-amber-400 animate-bounce" />
            </div>
            <h2 className="text-xl font-black font-game text-amber-300 mb-1">
              신비한 보물상자
            </h2>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              고대 던전 바위 틈새에서 잠겨있지 않은 보물상자를 발견했습니다!
            </p>

            {bonusWord && (
              <div className="w-full bg-slate-950/80 border border-slate-800 rounded-2xl p-3 mb-4 text-left">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-amber-400 font-bold">새로운 단어 룬 획득!</span>
                  <button
                    onClick={() => speakWord(bonusWord.word)}
                    className="text-[10px] text-sky-400 hover:underline"
                  >
                    발음 듣기
                  </button>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-bold text-white">{bonusWord.word}</span>
                  <span className="text-xs text-slate-300">{bonusWord.meaning}</span>
                </div>
              </div>
            )}

            <button
              id="chest-open-btn"
              onClick={handleChestClick}
              className="w-full py-3 px-4 rounded-xl bg-linear-to-r from-amber-500 to-orange-500 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 border border-amber-300 shadow-lg shadow-amber-500/30 active:scale-95 transition-all"
            >
              <Coins className="w-4 h-4" />
              <span>보상 획득 (+30 Gold)</span>
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
};
