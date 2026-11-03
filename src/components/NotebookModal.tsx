import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { BookOpen, Search, Volume2, CheckCircle2, Circle, ArrowLeft, AlertCircle, Sparkles, Filter } from 'lucide-react';
import { WordItem, DungeonTheme } from '../types';
import { DUNGEON_THEMES } from '../data/dungeonThemes';
import { speakWord } from '../utils/speech';
import { soundManager } from '../utils/audio';
import {
  getSentenceTapStats,
  recordSentenceTap,
  subscribeSentenceTaps,
  SentenceTapStats,
} from '../utils/sentenceTapTracker';

interface NotebookModalProps {
  discoveredWordIds: string[];
  masteredWordIds: string[];
  wrongWordIds: string[];
  onToggleMastered: (wordId: string) => void;
  onClose: () => void;
}

export const NotebookModal: React.FC<NotebookModalProps> = ({
  discoveredWordIds,
  masteredWordIds,
  wrongWordIds,
  onToggleMastered,
  onClose,
}) => {
  const [selectedThemeId, setSelectedThemeId] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'wrong' | 'mastered'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [tapStats, setTapStats] = useState<SentenceTapStats>(() => getSentenceTapStats());
  const [justTappedSentence, setJustTappedSentence] = useState<string | null>(null);

  React.useEffect(() => {
    return subscribeSentenceTaps((newStats) => {
      setTapStats(newStats);
    });
  }, []);

  const handleSentenceTap = async (sentence: string, translation: string, word: string) => {
    soundManager.playClick();
    speakWord(sentence);
    setJustTappedSentence(sentence);
    setTimeout(() => {
      setJustTappedSentence(null);
    }, 1800);

    await recordSentenceTap(sentence, { translation, word });
  };

  // Collect all unique words across all 10 themes (300 words total)
  const allWords = useMemo(() => {
    const list: WordItem[] = [];
    DUNGEON_THEMES.forEach((t) => {
      t.words.forEach((w) => {
        list.push(w);
      });
    });
    return list;
  }, []);

  // Filter words
  const filteredWords = useMemo(() => {
    return allWords.filter((w) => {
      // Theme filter
      if (selectedThemeId !== 'all' && w.themeId !== selectedThemeId) {
        return false;
      }

      // Status filter
      if (selectedStatus === 'wrong' && !wrongWordIds.includes(w.id)) {
        return false;
      }
      if (selectedStatus === 'mastered' && !masteredWordIds.includes(w.id)) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesWord = w.word.toLowerCase().includes(q);
        const matchesMeaning = w.meaning.toLowerCase().includes(q);
        const matchesExample = w.example.toLowerCase().includes(q);
        return matchesWord || matchesMeaning || matchesExample;
      }

      return true;
    });
  }, [allWords, selectedThemeId, selectedStatus, searchQuery, wrongWordIds, masteredWordIds]);

  const discoveredCount = useMemo(() => {
    return allWords.filter((w) => discoveredWordIds.includes(w.id)).length;
  }, [allWords, discoveredWordIds]);

  const wrongCount = useMemo(() => {
    return wrongWordIds.length;
  }, [wrongWordIds]);

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
            <BookOpen className="w-5 h-5 text-sky-400" />
            <h1 className="text-base sm:text-lg font-black font-game text-white">
              단어 복습 노트
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {wrongCount > 0 && (
            <button
              onClick={() => setSelectedStatus(selectedStatus === 'wrong' ? 'all' : 'wrong')}
              className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 border transition-all ${
                selectedStatus === 'wrong'
                  ? 'bg-rose-600 text-white border-rose-400 shadow-md shadow-rose-600/30'
                  : 'bg-rose-950/70 text-rose-300 border-rose-800/80 hover:bg-rose-900/60'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>오답 ({wrongCount})</span>
            </button>
          )}

          <div className="hidden sm:flex items-center gap-1.5 bg-teal-950/70 border border-teal-500/40 px-2.5 py-1 rounded-full text-xs font-semibold text-teal-300" title="구글 시트 연동 문장 탭 분석">
            <span>👆 문장 탭:</span>
            <span className="text-teal-200 font-bold">{tapStats.totalTaps}회</span>
            <span className="text-teal-600">|</span>
            <span>평균</span>
            <span className="text-emerald-300 font-bold">{tapStats.averageTaps}회</span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-full text-xs font-semibold text-slate-300 border border-slate-700">
            <span>발견:</span>
            <span className="text-amber-400 font-bold">{discoveredCount}</span>
            <span className="text-slate-500">/</span>
            <span>{allWords.length}</span>
          </div>
        </div>
      </div>

      {/* Controls: Search & Filters */}
      <div className="bg-slate-900/60 border-b border-slate-800/80 p-3 space-y-2.5 shrink-0">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="단어, 뜻, 예문 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700/80 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>

        {/* Theme Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          <button
            onClick={() => setSelectedThemeId('all')}
            className={`px-3 py-1.5 rounded-lg font-bold shrink-0 transition-all ${
              selectedThemeId === 'all'
                ? 'bg-sky-500 text-slate-950 shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            전체 테마 ({allWords.length})
          </button>
          {DUNGEON_THEMES.map((theme) => {
            const count = theme.words.length;
            const isSelected = selectedThemeId === theme.id;
            return (
              <button
                key={theme.id}
                onClick={() => setSelectedThemeId(theme.id)}
                className={`px-3 py-1.5 rounded-lg font-bold shrink-0 flex items-center gap-1.5 transition-all ${
                  isSelected
                    ? 'bg-sky-500 text-slate-950 shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <span>{theme.icon}</span>
                <span>{theme.name}</span>
                <span className={`text-[10px] px-1 rounded ${isSelected ? 'bg-sky-700/40 text-slate-950' : 'bg-slate-700 text-slate-400'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setSelectedStatus('all')}
            className={`px-2.5 py-1 rounded-md transition-all font-medium ${
              selectedStatus === 'all'
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            전체
          </button>
          <button
            onClick={() => setSelectedStatus('wrong')}
            className={`px-2.5 py-1 rounded-md transition-all font-bold flex items-center gap-1 ${
              selectedStatus === 'wrong'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-rose-400 hover:text-rose-300'
            }`}
          >
            <AlertCircle className="w-3 h-3 text-rose-400" />
            <span>틀린 단어만 보기 ({wrongCount})</span>
          </button>
          <button
            onClick={() => setSelectedStatus('mastered')}
            className={`px-2.5 py-1 rounded-md transition-all font-medium flex items-center gap-1 ${
              selectedStatus === 'mastered'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-emerald-400 hover:text-emerald-300'
            }`}
          >
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>외운 단어</span>
          </button>
        </div>
      </div>

      {/* Word Cards List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {filteredWords.length > 0 ? (
          filteredWords.map((item) => {
            const isDiscovered = discoveredWordIds.includes(item.id);
            const isMastered = masteredWordIds.includes(item.id);
            const isWrong = wrongWordIds.includes(item.id);

            return (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isWrong
                    ? 'bg-rose-950/40 border-2 border-rose-500 shadow-lg shadow-rose-950/50'
                    : isMastered
                    ? 'bg-emerald-950/20 border border-emerald-500/40'
                    : !isDiscovered
                    ? 'bg-slate-900/40 border-slate-800/60 opacity-60'
                    : 'bg-slate-900/90 border border-slate-700/80'
                }`}
              >
                {/* Wrong Word Alert Banner (Requirement 8) */}
                {isWrong && (
                  <div className="mb-2.5 flex items-center gap-1.5 bg-rose-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-sm">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>⚠️ 오답 단어 (집중 복습 필요)</span>
                  </div>
                )}

                {/* Word Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span
                      className={`text-base sm:text-lg font-black font-pixel ${
                        isWrong ? 'text-rose-300 underline decoration-rose-500 decoration-2' : 'text-amber-300'
                      }`}
                    >
                      {item.word}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      {item.pronunciation}
                    </span>
                    <span className="text-[10px] bg-slate-800 text-sky-300 px-1.5 py-0.5 rounded">
                      {item.partOfSpeech}
                    </span>
                    <span className="text-[10px] bg-slate-800/80 text-slate-400 px-1.5 py-0.5 rounded">
                      {item.themeName}
                    </span>
                    {!isDiscovered && (
                      <span className="text-[10px] bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded">
                        미발견
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Speak Button */}
                    <button
                      onClick={() => speakWord(item.word)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 active:scale-90 transition-all"
                      title="발음 듣기"
                      aria-label="발음 듣기"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>

                    {/* Mastered Toggle */}
                    <button
                      onClick={() => onToggleMastered(item.id)}
                      className={`p-1.5 rounded-lg transition-all ${
                        isMastered
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-slate-800 text-slate-500 hover:text-slate-300'
                      }`}
                      title={isMastered ? '외움 완료됨' : '외움 표시하기'}
                      aria-label="외움 토글"
                    >
                      {isMastered ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Circle className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Meaning */}
                <div className="text-sm font-bold text-white mb-2">
                  <span className={isWrong ? 'text-rose-200' : 'text-slate-100'}>
                    {item.meaning}
                  </span>
                </div>

                {/* Example Sentence (Interactive: Tap tracks tap frequency and average to Google Sheets) */}
                {(() => {
                  const sTapCount = tapStats.records[item.example]?.tapCount || 0;
                  const isJustTapped = justTappedSentence === item.example;

                  return (
                    <div
                      onClick={() => handleSentenceTap(item.example, item.exampleKo, item.word)}
                      className={`cursor-pointer rounded-xl p-3 border transition-all relative group select-text active:scale-[0.99] ${
                        isJustTapped
                          ? 'bg-teal-950/70 border-teal-400 ring-2 ring-teal-500/30 shadow-lg shadow-teal-950/60'
                          : 'bg-slate-950/70 border-slate-800/90 hover:border-teal-500/50 hover:bg-slate-900/80'
                      }`}
                      title="클릭하여 문장 발음 듣기 및 탭 빈도 구글 시트 저장"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-1.5 text-[10px] text-teal-400 font-bold">
                          <Volume2 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform text-teal-300" />
                          <span>예문 (탭하여 듣기)</span>
                        </div>

                        {/* Tap frequency and average badge */}
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-bold flex items-center gap-1 border transition-all ${
                              sTapCount > 0
                                ? 'bg-teal-900/60 text-teal-200 border-teal-500/40'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            <span>👆 {sTapCount}회 탭</span>
                            {tapStats.totalSentences > 0 && (
                              <span className="text-slate-400 text-[9px]">
                                (평균 {tapStats.averageTaps}회)
                              </span>
                            )}
                          </span>

                          {isJustTapped && (
                            <span className="text-[10px] bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-md font-bold animate-pulse">
                              시트 저장됨 ✓
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-slate-100 font-semibold text-xs leading-relaxed group-hover:text-white transition-colors">
                        {item.example}
                      </p>
                      <p className="text-slate-400 text-[11px] leading-relaxed mt-1">
                        {item.exampleKo}
                      </p>
                    </div>
                  );
                })()}

                {/* Grammar Tip */}
                {item.grammarTip && (
                  <div className="mt-2 text-[11px] text-amber-300/90 bg-amber-500/10 border border-amber-500/20 rounded-lg px-2.5 py-1.5 flex items-start gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <span className="leading-snug">
                      <strong>문법 팁:</strong> {item.grammarTip}
                    </span>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-16 text-slate-500 text-xs">
            조건에 맞는 단어가 없습니다.
          </div>
        )}
      </div>
    </div>
  );
};
