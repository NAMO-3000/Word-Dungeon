import { syncSentenceTapToGoogleSheet, syncBatchSentenceTapsToGoogleSheet } from './googleSheetsSync';

const STORAGE_KEY = 'word_dungeon_sentence_taps';

export interface SentenceTapRecord {
  sentence: string;
  translation: string;
  word: string;
  tapCount: number;
  lastTapped: string;
}

export interface SentenceTapStats {
  totalSentences: number;
  totalTaps: number;
  averageTaps: number; // 총 탭 수 / 탭된 문장 수 (소수점 1자리)
  records: Record<string, SentenceTapRecord>;
}

type TapListener = (stats: SentenceTapStats) => void;
const listeners = new Set<TapListener>();

export function subscribeSentenceTaps(listener: TapListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifyListeners(stats: SentenceTapStats) {
  listeners.forEach((fn) => {
    try {
      fn(stats);
    } catch {
      // ignore
    }
  });
}

/**
 * Get all sentence tap records and current average
 */
export function getSentenceTapStats(): SentenceTapStats {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const records: Record<string, SentenceTapRecord> = raw ? JSON.parse(raw) : {};
    const keys = Object.keys(records);
    const totalSentences = keys.length;
    const totalTaps = keys.reduce((sum, key) => sum + (records[key].tapCount || 0), 0);
    const averageTaps = totalSentences > 0 ? Number((totalTaps / totalSentences).toFixed(1)) : 0;

    return {
      totalSentences,
      totalTaps,
      averageTaps,
      records,
    };
  } catch {
    return {
      totalSentences: 0,
      totalTaps: 0,
      averageTaps: 0,
      records: {},
    };
  }
}

/**
 * Get tap count for a specific sentence
 */
export function getSentenceTapCount(sentence: string): number {
  if (!sentence) return 0;
  const trimmed = sentence.trim();
  const stats = getSentenceTapStats();
  return stats.records[trimmed]?.tapCount || 0;
}

/**
 * Record a tap on a sentence, recalculate average, and immediately sync to Google Sheets
 */
export async function recordSentenceTap(
  sentence: string,
  meta?: { translation?: string; word?: string }
): Promise<{
  record: SentenceTapRecord;
  stats: SentenceTapStats;
  syncSuccess: boolean;
}> {
  const trimmed = sentence.trim();
  if (!trimmed) {
    const stats = getSentenceTapStats();
    return {
      record: {
        sentence: '',
        translation: '',
        word: '',
        tapCount: 0,
        lastTapped: new Date().toISOString(),
      },
      stats,
      syncSuccess: false,
    };
  }

  const currentStats = getSentenceTapStats();
  const existing = currentStats.records[trimmed] || {
    sentence: trimmed,
    translation: meta?.translation || '',
    word: meta?.word || '',
    tapCount: 0,
    lastTapped: '',
  };

  const updatedRecord: SentenceTapRecord = {
    ...existing,
    translation: meta?.translation || existing.translation || '',
    word: meta?.word || existing.word || '',
    tapCount: existing.tapCount + 1,
    lastTapped: new Date().toISOString(),
  };

  const updatedRecords = {
    ...currentStats.records,
    [trimmed]: updatedRecord,
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedRecords));
  } catch {
    // ignore
  }

  const keys = Object.keys(updatedRecords);
  const totalSentences = keys.length;
  const totalTaps = keys.reduce((sum, key) => sum + (updatedRecords[key].tapCount || 0), 0);
  const averageTaps = totalSentences > 0 ? Number((totalTaps / totalSentences).toFixed(1)) : 0;

  const newStats: SentenceTapStats = {
    totalSentences,
    totalTaps,
    averageTaps,
    records: updatedRecords,
  };

  notifyListeners(newStats);

  // Sync to Google Sheets via NEXT_PUBLIC_GOOGLE_SCRIPT_URL
  const syncResult = await syncSentenceTapToGoogleSheet({
    sentence: updatedRecord.sentence,
    tapFrequency: updatedRecord.tapCount,
    averageTaps: newStats.averageTaps,
    word: updatedRecord.word,
    translation: updatedRecord.translation,
  });

  return {
    record: updatedRecord,
    stats: newStats,
    syncSuccess: syncResult.success,
  };
}

/**
 * Batch sync all recorded sentences to Google Sheets
 */
export async function syncAllSentencesToGoogleSheet(): Promise<{
  success: boolean;
  count: number;
  message: string;
}> {
  const stats = getSentenceTapStats();
  const records = Object.values(stats.records);

  if (records.length === 0) {
    return {
      success: false,
      count: 0,
      message: '기록된 문장 탭 데이터가 없습니다. 문장을 탭하여 학습해보세요!',
    };
  }

  const res = await syncBatchSentenceTapsToGoogleSheet(records, stats.averageTaps);
  return {
    success: res.success,
    count: records.length,
    message: res.message,
  };
}
