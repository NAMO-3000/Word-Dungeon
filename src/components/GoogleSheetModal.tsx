import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  FileSpreadsheet,
  Check,
  Send,
  Clock,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  BarChart2,
  Volume2,
} from 'lucide-react';
import { PlayerStats } from '../types';
import {
  isAutoSyncEnabled,
  setAutoSyncEnabled,
  getSyncHistory,
  syncStatsToGoogleSheet,
  createSyncPayload,
  SyncHistoryItem,
} from '../utils/googleSheetsSync';
import {
  getSentenceTapStats,
  recordSentenceTap,
  syncAllSentencesToGoogleSheet,
  subscribeSentenceTaps,
  SentenceTapStats,
} from '../utils/sentenceTapTracker';
import { soundManager } from '../utils/audio';
import { speakWord } from '../utils/speech';

interface GoogleSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: PlayerStats;
}

export const GoogleSheetModal: React.FC<GoogleSheetModalProps> = ({
  isOpen,
  onClose,
  stats,
}) => {
  const [activeTab, setActiveTab] = useState<'sync' | 'sentences'>('sync');
  const [autoSync, setAutoSync] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isSentenceSyncing, setIsSentenceSyncing] = useState<boolean>(false);
  const [sentenceTapStats, setSentenceTapStats] = useState<SentenceTapStats>(() => getSentenceTapStats());
  const [syncStatus, setSyncStatus] = useState<{
    type: 'idle' | 'success' | 'error';
    message: string;
  }>({ type: 'idle', message: '' });
  const [sentenceSyncStatus, setSentenceSyncStatus] = useState<{
    type: 'idle' | 'success' | 'error';
    message: string;
  }>({ type: 'idle', message: '' });
  const [history, setHistory] = useState<SyncHistoryItem[]>([]);

  useEffect(() => {
    if (isOpen) {
      setAutoSync(isAutoSyncEnabled());
      setHistory(getSyncHistory());
      setSentenceTapStats(getSentenceTapStats());
      setSyncStatus({ type: 'idle', message: '' });
      setSentenceSyncStatus({ type: 'idle', message: '' });
    }
  }, [isOpen]);

  useEffect(() => {
    return subscribeSentenceTaps((newStats) => {
      setSentenceTapStats(newStats);
    });
  }, []);

  if (!isOpen) return null;

  const currentPayload = createSyncPayload(stats);

  const handleToggleAutoSync = () => {
    soundManager.playClick();
    const nextVal = !autoSync;
    setAutoSync(nextVal);
    setAutoSyncEnabled(nextVal);
  };

  const handleSyncStatsNow = async () => {
    soundManager.playClick();
    setIsSyncing(true);
    setSyncStatus({ type: 'idle', message: '' });

    const result = await syncStatsToGoogleSheet(stats);
    setIsSyncing(false);

    if (result.success) {
      soundManager.playCorrect();
      setSyncStatus({
        type: 'success',
        message: '✅ 구글 시트에 현재 게임 진행 통계가 성공적으로 기록되었습니다!',
      });
      setHistory(getSyncHistory());
    } else {
      soundManager.playWrong();
      setSyncStatus({
        type: 'error',
        message: `❌ ${result.message}`,
      });
    }
  };

  const handleSyncSentencesNow = async () => {
    soundManager.playClick();
    setIsSentenceSyncing(true);
    setSentenceSyncStatus({ type: 'idle', message: '' });

    const result = await syncAllSentencesToGoogleSheet();
    setIsSentenceSyncing(false);

    if (result.success) {
      soundManager.playCorrect();
      setSentenceSyncStatus({
        type: 'success',
        message: `✅ ${result.message}`,
      });
    } else {
      soundManager.playWrong();
      setSentenceSyncStatus({
        type: 'error',
        message: `❌ ${result.message}`,
      });
    }
  };

  const handleTapSentenceItem = async (sentence: string, translation?: string, word?: string) => {
    soundManager.playClick();
    speakWord(sentence);
    await recordSentenceTap(sentence, { translation, word });
  };

  const sentenceRecordsList = Object.values(sentenceTapStats.records).sort(
    (a, b) => b.tapCount - a.tapCount
  );

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md select-none">
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 15 }}
          className="relative w-full max-w-lg max-h-[92vh] bg-slate-900 border-2 border-emerald-500/40 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100"
        >
          {/* Modal Header */}
          <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  구글 시트 연동 기록
                </h2>
                <p className="text-[11px] text-slate-400">
                  플레이 통계 및 각 문장별 탭 빈도/평균 자동 저장
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                soundManager.playClick();
                onClose();
              }}
              className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs (2 Tabs: URL & Script removed per user request) */}
          <div className="flex border-b border-slate-800 bg-slate-900/60 p-1 shrink-0 gap-1">
            <button
              onClick={() => {
                soundManager.playClick();
                setActiveTab('sync');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'sync'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>플레이 통계</span>
            </button>
            <button
              onClick={() => {
                soundManager.playClick();
                setActiveTab('sentences');
              }}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'sentences'
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>문장별 탭 통계</span>
            </button>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 no-scrollbar">
            {/* TAB 1: Play Stats */}
            {activeTab === 'sync' && (
              <>
                {/* 1. Recorded Columns Preview Table */}
                <div className="bg-slate-950/80 rounded-2xl p-3.5 border border-slate-800">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" /> 현재 플레이 데이터 미리보기 (6개 열)
                    </span>
                    <span className="text-[10px] text-emerald-400/90 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      실시간 연동 활성화
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-[11px] text-slate-400 bg-slate-900/40">
                          <th className="py-1.5 px-2">Timestamp</th>
                          <th className="py-1.5 px-2 text-center">Play_count</th>
                          <th className="py-1.5 px-2 text-center">Character_level</th>
                          <th className="py-1.5 px-2 text-center">Gold_count</th>
                          <th className="py-1.5 px-2 text-center">Word_count</th>
                          <th className="py-1.5 px-2 text-center">Clear_count</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="font-bold text-white bg-emerald-950/20">
                          <td className="py-2 px-2 text-[10px] font-mono text-emerald-300 truncate max-w-[120px]">
                            {currentPayload.Timestamp}
                          </td>
                          <td className="py-2 px-2 text-center text-amber-300 font-mono">
                            {currentPayload.Play_count}회
                          </td>
                          <td className="py-2 px-2 text-center text-indigo-300 font-mono">
                            Lv.{currentPayload.Character_level}
                          </td>
                          <td className="py-2 px-2 text-center text-amber-400 font-mono">
                            {currentPayload.Gold_count}G
                          </td>
                          <td className="py-2 px-2 text-center text-sky-300 font-mono">
                            {currentPayload.Word_count}개
                          </td>
                          <td className="py-2 px-2 text-center text-emerald-400 font-mono">
                            {currentPayload.Clear_count}회
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 2. Auto-Sync Toggle */}
                <div className="flex items-center justify-between bg-slate-950/60 p-3 rounded-2xl border border-slate-800">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-emerald-400" />
                    <div>
                      <div className="text-xs font-bold text-white">클리어/게임오버 자동 기록</div>
                      <div className="text-[10px] text-slate-400">
                        게임 종료 시 구글 시트에 행을 자동으로 추가합니다.
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={handleToggleAutoSync}
                    className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-1 cursor-pointer ${
                      autoSync ? 'bg-emerald-600' : 'bg-slate-700'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        autoSync ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* 3. Action Button: Sync Now */}
                <button
                  id="sync-now-btn"
                  onClick={handleSyncStatsNow}
                  disabled={isSyncing}
                  className="w-full py-3 px-4 rounded-2xl bg-linear-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-900/40 border border-emerald-400/50 flex items-center justify-center gap-2 active:scale-98 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSyncing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      <span>구글 시트에 기록 중...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 text-emerald-200" />
                      <span>지금 구글 시트에 플레이 통계 기록하기</span>
                    </>
                  )}
                </button>

                {/* Feedback Banner */}
                {syncStatus.type !== 'idle' && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-3 rounded-xl text-xs flex items-start gap-2 border ${
                      syncStatus.type === 'success'
                        ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200'
                        : 'bg-rose-950/80 border-rose-500/50 text-rose-200'
                    }`}
                  >
                    {syncStatus.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <span>{syncStatus.message}</span>
                  </motion.div>
                )}

                {/* 4. Recent History */}
                {history.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <div className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" /> 최근 전송 내역 ({history.length}건)
                    </div>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto no-scrollbar">
                      {history.slice(0, 5).map((item) => (
                        <div
                          key={item.id}
                          className="text-[11px] bg-slate-950/70 border border-slate-800 rounded-xl p-2 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-1.5">
                            {item.success ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <X className="w-3.5 h-3.5 text-rose-400" />
                            )}
                            <span className="font-mono text-slate-300">{item.timestamp}</span>
                          </div>
                          <span className="text-slate-400 text-[10px]">
                            {item.payload.Play_count}회 / Lv.{item.payload.Character_level} / {item.payload.Gold_count}G
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* TAB 2: Sentence Tap Frequency & Average */}
            {activeTab === 'sentences' && (
              <div className="space-y-3.5">
                {/* Summary Metrics Cards */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="bg-slate-950/80 border border-teal-500/30 rounded-2xl p-3">
                    <div className="text-[10px] text-slate-400 font-bold">총 문장 탭 수</div>
                    <div className="text-lg font-black text-teal-300 font-mono mt-0.5">
                      {sentenceTapStats.totalTaps}회
                    </div>
                  </div>
                  <div className="bg-slate-950/80 border border-teal-500/30 rounded-2xl p-3">
                    <div className="text-[10px] text-slate-400 font-bold">학습한 문장 수</div>
                    <div className="text-lg font-black text-white font-mono mt-0.5">
                      {sentenceTapStats.totalSentences}개
                    </div>
                  </div>
                  <div className="bg-slate-950/80 border border-teal-500/30 rounded-2xl p-3">
                    <div className="text-[10px] text-slate-400 font-bold">문장당 평균 탭</div>
                    <div className="text-lg font-black text-emerald-300 font-mono mt-0.5">
                      {sentenceTapStats.averageTaps}회
                    </div>
                  </div>
                </div>

                <div className="bg-teal-950/40 border border-teal-500/30 rounded-2xl p-3 text-xs text-slate-300 space-y-1">
                  <div className="font-bold text-teal-300 flex items-center gap-1.5 text-[11px]">
                    <Sparkles className="w-3.5 h-3.5" /> 각 문장별 탭 빈도 및 평균 실시간 저장
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    단어 복습 노트 및 퀴즈에서 예문 문장을 탭할 때마다 발음 청취와 함께 해당 문장의 <strong>탭 빈도</strong>와 전체 <strong>평균</strong>이 구글 시트에 자동 기록됩니다.
                  </p>
                </div>

                {/* Batch Sync Button */}
                <button
                  onClick={handleSyncSentencesNow}
                  disabled={isSentenceSyncing || sentenceRecordsList.length === 0}
                  className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white font-bold text-xs shadow-md border border-teal-400/50 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  {isSentenceSyncing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                      <span>구글 시트에 문장 통계 전송 중...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5 text-teal-200" />
                      <span>모든 문장 탭 통계 구글 시트에 일괄 동기화</span>
                    </>
                  )}
                </button>

                {/* Sentence Sync Feedback */}
                {sentenceSyncStatus.type !== 'idle' && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-2.5 rounded-xl text-xs flex items-center gap-2 border ${
                      sentenceSyncStatus.type === 'success'
                        ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200'
                        : 'bg-rose-950/80 border-rose-500/50 text-rose-200'
                    }`}
                  >
                    {sentenceSyncStatus.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <span>{sentenceSyncStatus.message}</span>
                  </motion.div>
                )}

                {/* Sentences Table / List */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-300 font-bold px-1">
                    <span>문장별 탭 내역 ({sentenceRecordsList.length}개)</span>
                    <span className="text-[10px] text-slate-400">클릭하여 발음 청취 및 탭 +1</span>
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-2 no-scrollbar">
                    {sentenceRecordsList.length > 0 ? (
                      sentenceRecordsList.map((rec) => (
                        <div
                          key={rec.sentence}
                          onClick={() => handleTapSentenceItem(rec.sentence, rec.translation, rec.word)}
                          className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-teal-500/60 transition-all cursor-pointer group flex flex-col gap-1"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <Volume2 className="w-3.5 h-3.5 text-teal-400 group-hover:scale-110 shrink-0 transition-transform" />
                              <span className="text-xs font-semibold text-slate-200 truncate group-hover:text-white">
                                {rec.sentence}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-900/60 text-teal-200 border border-teal-500/40 font-mono font-bold">
                                탭: {rec.tapCount}회
                              </span>
                              <span className="text-[9px] text-slate-400 font-mono">
                                (평균 {sentenceTapStats.averageTaps}회)
                              </span>
                            </div>
                          </div>
                          {rec.translation && (
                            <p className="text-[10px] text-slate-400 pl-5">
                              {rec.translation}
                            </p>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                        아직 탭한 문장이 없습니다.<br />
                        단어 복습 노트에서 예문을 탭하거나 위 목록을 클릭해보세요!
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="p-3 border-t border-slate-800 bg-slate-950/80 flex justify-end shrink-0">
            <button
              onClick={() => {
                soundManager.playClick();
                onClose();
              }}
              className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-200 transition-colors cursor-pointer"
            >
              닫기
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
