import React from 'react';
import { motion } from 'motion/react';
import { Shield, Sparkles, Coins, Check, Lock, ArrowUpCircle, X } from 'lucide-react';
import { Avatar, AvatarId, PlayerStats } from '../types';
import { INITIAL_AVATARS, getMaxExp } from '../data/avatars';
import { soundManager } from '../utils/audio';

interface AvatarModalProps {
  stats: PlayerStats;
  onEquipAvatar: (avatarId: AvatarId) => void;
  onBuyAvatar: (avatarId: AvatarId, price: number) => void;
  onClose: () => void;
}

export const AvatarModal: React.FC<AvatarModalProps> = ({
  stats,
  onEquipAvatar,
  onBuyAvatar,
  onClose,
}) => {
  const avatarList = (Object.keys(INITIAL_AVATARS) as AvatarId[]).map((id) => {
    const base = INITIAL_AVATARS[id];
    const saved = stats.avatars[id] || { isUnlocked: id === 'adventurer', level: 1, exp: 0 };
    return {
      ...base,
      level: saved.level,
      exp: saved.exp,
      maxExp: getMaxExp(saved.level),
      isUnlocked: saved.isUnlocked,
    } as Avatar;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-5 shadow-2xl flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎭</span>
            <div>
              <h2 className="text-base font-black font-game text-amber-300">
                모험가 길드 (아바타)
              </h2>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <span>보유 골드:</span>
                <span className="text-amber-400 font-bold flex items-center gap-0.5">
                  <Coins className="w-3 h-3" />
                  {stats.gold} G
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              soundManager.playClick();
              onClose();
            }}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Avatars List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {avatarList.map((avatar) => {
            const isEquipped = stats.equippedAvatarId === avatar.id;
            const canAfford = stats.gold >= avatar.price;

            return (
              <div
                key={avatar.id}
                className={`p-3.5 rounded-2xl border transition-all ${
                  isEquipped
                    ? 'bg-amber-500/15 border-amber-500 shadow-md shadow-amber-500/10'
                    : avatar.isUnlocked
                    ? 'bg-slate-800/80 border-slate-700 hover:border-slate-600'
                    : 'bg-slate-950/60 border-slate-800 opacity-80'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="relative text-3xl p-2 rounded-2xl bg-slate-900 border border-slate-700 shrink-0 flex items-center justify-center">
                    {avatar.emoji}
                    {!avatar.isUnlocked && (
                      <div className="absolute inset-0 bg-black/60 rounded-2xl flex items-center justify-center">
                        <Lock className="w-4 h-4 text-slate-400" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-sm text-white">{avatar.name}</span>
                        <span className="text-[10px] bg-slate-800 text-amber-300 font-bold px-1.5 py-0.5 rounded border border-slate-700">
                          Lv.{avatar.level}
                        </span>
                      </div>

                      {isEquipped && (
                        <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                          장착중
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-amber-400/90 font-medium mt-0.5">
                      {avatar.title}
                    </p>

                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      {avatar.description}
                    </p>

                    {/* Perk text */}
                    <div className="mt-2 text-[10px] bg-indigo-950/60 text-indigo-300 border border-indigo-800/60 rounded-lg px-2 py-1 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-indigo-400 shrink-0" />
                      <span>{avatar.perkText}</span>
                    </div>

                    {/* EXP bar (if unlocked) */}
                    {avatar.isUnlocked ? (
                      <div className="mt-2.5">
                        <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                          <span className="flex items-center gap-1 text-slate-300">
                            <ArrowUpCircle className="w-3 h-3 text-emerald-400" />
                            경험치
                          </span>
                          <span className="font-mono text-emerald-400 font-bold">
                            {avatar.exp} / {avatar.maxExp} XP
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                          <div
                            className="h-full bg-linear-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, (avatar.exp / avatar.maxExp) * 100)}%` }}
                          />
                        </div>
                      </div>
                    ) : null}

                    {/* Actions */}
                    <div className="mt-3 flex items-center justify-end gap-2">
                      {avatar.isUnlocked ? (
                        !isEquipped && (
                          <button
                            onClick={() => {
                              soundManager.playClick();
                              onEquipAvatar(avatar.id);
                            }}
                            className="px-3 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 active:scale-95 text-xs font-bold text-white transition-all shadow-sm"
                          >
                            선택하기
                          </button>
                        )
                      ) : (
                        <button
                          onClick={() => {
                            if (canAfford) {
                              soundManager.playChest();
                              onBuyAvatar(avatar.id, avatar.price);
                            }
                          }}
                          disabled={!canAfford}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
                            canAfford
                              ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 border-amber-300 active:scale-95 shadow-md shadow-amber-500/20'
                              : 'bg-slate-800 text-slate-500 border-slate-700 cursor-not-allowed'
                          }`}
                        >
                          <Coins className="w-3.5 h-3.5" />
                          <span>{avatar.price} 골드로 해금</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
};
