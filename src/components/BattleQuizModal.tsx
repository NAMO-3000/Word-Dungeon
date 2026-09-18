import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Volume2, CheckCircle2, XCircle, Sparkles, Heart, HelpCircle, ArrowRight, Shield } from 'lucide-react';
import { MapNode, QuizQuestion, WordItem } from '../types';
import { soundManager } from '../utils/audio';
import { speakWord } from '../utils/speech';

interface BattleQuizModalProps {
  node: MapNode;
  currentHp: number;
  maxHp: number;
  onAnswerCorrect: (word: WordItem, goldEarned: number) => void;
  onAnswerWrong: (word: WordItem) => void;
  onClose: () => void;
}

export const BattleQuizModal: React.FC<BattleQuizModalProps> = ({
  node,
  currentHp,
  maxHp,
  onAnswerCorrect,
  onAnswerWrong,
  onClose,
}) => {
  const question: QuizQuestion | undefined = node.question;
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [monsterHurt, setMonsterHurt] = useState<boolean>(false);
  const [playerHurt, setPlayerHurt] = useState<boolean>(false);

  if (!question) {
    return null;
  }

  const word = question.wordItem;

  const handleSpeak = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsSpeaking(true);
    await speakWord(word.word);
    setIsSpeaking(false);
  };

  const handleSelectOption = (idx: number) => {
    if (isSubmitted) return;
    setSelectedIndex(idx);
    setIsSubmitted(true);

    const correct = idx === question.correctIndex;
    setIsCorrect(correct);

    if (correct) {
      soundManager.playCorrect();
      setMonsterHurt(true);
      const goldEarned = node.type === 'boss' ? 50 : node.type === 'elite' ? 30 : 15;
      setTimeout(() => {
        onAnswerCorrect(word, goldEarned);
      }, 1600);
    } else {
      soundManager.playHit();
      setPlayerHurt(true);
      onAnswerWrong(word);
      // Keep explanation open for the student to learn!
    }
  };

  const handleContinueAfterWrong = () => {
    soundManager.playClick();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 select-none overflow-y-auto">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className={`w-full max-w-md bg-slate-900 border-2 rounded-3xl p-5 shadow-2xl flex flex-col relative overflow-hidden my-auto ${
          playerHurt ? 'border-rose-500 animate-shake' : 'border-slate-700'
        }`}
      >
        {/* Top Header in Quiz: Node Info & Hearts */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{node.monsterEmoji || '⚔️'}</span>
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                <span>{node.monsterName || node.title}</span>
                {node.type === 'boss' && (
                  <span className="text-[10px] bg-rose-500 text-white font-black px-1.5 py-0.5 rounded">
                    BOSS
                  </span>
                )}
                {node.type === 'elite' && (
                  <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-1.5 py-0.5 rounded">
                    ELITE
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-400">
                중1 필수 단어 결투 • {word.themeName}
              </p>
            </div>
          </div>

          {/* Right: Remaining Lives strictly formatted */}
          <div className="flex items-center gap-1.5 bg-slate-800/90 border border-slate-700 px-2.5 py-1 rounded-full text-xs font-bold text-rose-300">
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>{currentHp}/{maxHp}</span>
          </div>
        </div>

        {/* Monster Stage Area */}
        <div className="relative py-4 flex flex-col items-center justify-center">
          <motion.div
            animate={
              monsterHurt
                ? { x: [0, -15, 15, -10, 10, 0], scale: [1, 0.85, 1], filter: 'brightness(2)' }
                : { y: [0, -6, 0] }
            }
            transition={
              monsterHurt
                ? { duration: 0.5 }
                : { repeat: Infinity, duration: 2.4, ease: 'easeInOut' }
            }
            className="text-6xl sm:text-7xl drop-shadow-xl select-none"
          >
            {node.monsterEmoji || '👾'}
          </motion.div>

          {/* Target Word badge with speech button */}
          <div className="mt-3 flex items-center gap-2 bg-slate-800/90 border border-slate-700/80 px-3.5 py-1.5 rounded-full shadow-inner">
            <span className="text-xs font-bold text-amber-300 font-pixel tracking-wider">
              {word.word}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              {word.pronunciation}
            </span>
            <button
              id="listen-word-btn"
              onClick={handleSpeak}
              className="p-1 rounded-full hover:bg-slate-700 text-amber-400 active:scale-95 transition-all"
              title="원어민 발음 듣기"
              aria-label="원어민 발음 듣기"
            >
              <Volume2 className={`w-3.5 h-3.5 ${isSpeaking ? 'animate-bounce text-emerald-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Question Prompt */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 mb-4 text-center">
          <p className="text-xs sm:text-sm font-semibold text-slate-200 leading-relaxed whitespace-pre-line">
            {question.prompt}
          </p>
        </div>

        {/* 4 Choices */}
        <div className="grid grid-cols-1 gap-2.5 mb-2">
          {question.options.map((option, idx) => {
            let btnStyle = 'bg-slate-800/90 border-slate-700 text-slate-200 hover:bg-slate-750 hover:border-slate-600';

            if (isSubmitted) {
              if (idx === question.correctIndex) {
                btnStyle = 'bg-emerald-600 border-emerald-400 text-white shadow-lg shadow-emerald-600/30';
              } else if (idx === selectedIndex) {
                btnStyle = 'bg-rose-600 border-rose-400 text-white';
              } else {
                btnStyle = 'bg-slate-850/60 border-slate-800 text-slate-500 opacity-60';
              }
            }

            return (
              <motion.button
                key={idx}
                id={`quiz-option-${idx}`}
                disabled={isSubmitted}
                onClick={() => handleSelectOption(idx)}
                whileHover={!isSubmitted ? { scale: 1.01 } : {}}
                whileTap={!isSubmitted ? { scale: 0.99 } : {}}
                className={`w-full p-3 rounded-xl border font-bold text-xs sm:text-sm flex items-center justify-between transition-all text-left shadow-sm ${btnStyle}`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-5 h-5 rounded-full bg-black/25 flex items-center justify-center text-[10px] font-mono shrink-0">
                    {idx + 1}
                  </span>
                  <span className="truncate">{option}</span>
                </div>

                {isSubmitted && idx === question.correctIndex && (
                  <CheckCircle2 className="w-4 h-4 text-white shrink-0 ml-2" />
                )}
                {isSubmitted && idx === selectedIndex && idx !== question.correctIndex && (
                  <XCircle className="w-4 h-4 text-white shrink-0 ml-2" />
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Feedback Section */}
        <AnimatePresence>
          {isSubmitted && isCorrect && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 p-3 rounded-2xl bg-emerald-950/60 border border-emerald-500/50 flex items-center justify-between text-emerald-300 text-xs"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="font-bold">정답입니다! 몬스터를 격파했습니다.</span>
              </div>
              <span className="text-[11px] font-semibold text-amber-300">노트에 기록됨 ✨</span>
            </motion.div>
          )}

          {/* Strictly required: "오답시 정답 해설 표시" */}
          {isSubmitted && !isCorrect && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 p-3.5 rounded-2xl bg-rose-950/60 border border-rose-500/50 flex flex-col gap-2.5 text-left"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-rose-300 font-bold text-xs">
                  <XCircle className="w-4 h-4 text-rose-400" />
                  <span>오답입니다! (목숨 1개 차감)</span>
                </div>
                <button
                  onClick={() => handleSpeak()}
                  className="flex items-center gap-1 text-[11px] text-amber-300 bg-slate-800/80 hover:bg-slate-750 px-2 py-0.5 rounded-md border border-amber-500/30"
                >
                  <Volume2 className="w-3 h-3" />
                  <span>발음 듣기</span>
                </button>
              </div>

              {/* Detailed Explanation */}
              <div className="bg-slate-900/90 rounded-xl p-2.5 border border-slate-700/80 text-xs text-slate-200 space-y-1.5">
                <div className="flex items-baseline gap-2">
                  <span className="text-amber-400 font-bold text-sm">{word.word}</span>
                  <span className="text-slate-400 text-[11px]">[{word.partOfSpeech}]</span>
                  <span className="text-emerald-300 font-bold">{word.meaning}</span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  📖 예문: {word.example}
                </p>
                <p className="text-[11px] text-slate-400">
                  🇰🇷 해석: {word.exampleKo}
                </p>
                {word.grammarTip && (
                  <p className="text-[10px] text-sky-300 pt-1 border-t border-slate-800">
                    💡 문법 팁: {word.grammarTip}
                  </p>
                )}
              </div>

              {/* Next Button */}
              <button
                id="quiz-continue-btn"
                onClick={handleContinueAfterWrong}
                className="w-full mt-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-all border border-slate-600"
              >
                <span>해설 확인 완료 (계속 진행)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
