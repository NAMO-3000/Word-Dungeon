import { PlayerStats } from '../types';

const GS_URL_KEY = 'word_dungeon_gs_url';
const GS_AUTO_SYNC_KEY = 'word_dungeon_auto_sync';
const GS_HISTORY_KEY = 'word_dungeon_sync_history';

// Default Web App URL from .env.local
const DEFAULT_WEB_APP_URL =
  (typeof import.meta !== 'undefined' && import.meta.env && (import.meta.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL || import.meta.env.VITE_GOOGLE_SCRIPT_URL)) ||
  (typeof process !== 'undefined' && process.env && process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL) ||
  'https://script.google.com/macros/s/AKfycbwBSo4RJk4zWA8dzcgqo6H-efeS8wF3syBfGF3J20lpgc_X9JmmQlKcO-HDLZZOv2w_3A/exec';

export interface GoogleSheetSyncPayload {
  Timestamp: string;
  Play_count: number;
  Character_level: number;
  Gold_count: number;
  Word_count: number;
  Clear_count: number;
}

export interface SentenceTapSyncPayload {
  Timestamp: string;
  Sentence: string;
  Tap_frequency: number;
  Average: number;
  Word?: string;
  Translation?: string;
  Type?: string;
}

export interface SyncHistoryItem {
  id: string;
  timestamp: string;
  success: boolean;
  message: string;
  payload: any;
}

export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * =========================================================================
 * 워드 던전 (Word Dungeon) - Google 스프레드시트 기록용 Google Apps Script
 * =========================================================================
 * 
 * [지원하는 기록 형태]
 * 1. 플레이어 게임 통계 (Stats 시트)
 *    - Timestamp: 기록 일시
 *    - Play_count: 총 플레이 횟수
 *    - Character_level: 현재 아바타 레벨
 *    - Gold_count: 보유 골드
 *    - Word_count: 수집/학습 단어 수
 *    - Clear_count: 클리어 횟수
 * 
 * 2. 문장별 탭 빈도 및 평균 (Sentence_Taps 시트)
 *    - Timestamp: 기록 일시
 *    - Sentence: 영어 문장
 *    - Tap_frequency: 해당 문장의 탭 빈도(횟수)
 *    - Average: 문장당 평균 탭 빈도
 *    - Word: 연관 단어
 *    - Translation: 한국어 해석
 * 
 * [배포 방법]
 * 1. 구글 스프레드시트 열기
 * 2. 상단 메뉴 [확장 프로그램] > [Apps Script] 클릭
 * 3. 기존 코드를 모두 지우고 본 스크립트 전체를 붙여넣은 뒤 저장 (Ctrl + S)
 * 4. 우측 상단 [배포] > [새 배포] 클릭
 *    - 유형: 웹 앱 (Web App)
 *    - 설명: 워드 던전 통계 및 문장 탭 분석
 *    - 다음 사용자 권한으로 실행: '나(Me)'
 *    - 액세스 권한: '모든 사용자(Anyone)' 선택
 * 5. [배포] 클릭 후 발급되는 '웹 앱 URL'을 복사하여 연동!
 * =========================================================================
 */

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);

  try {
    var doc = SpreadsheetApp.getActiveSpreadsheet();

    // 1. 전송된 데이터 파싱
    var data = {};
    if (e && e.postData && e.postData.contents) {
      try {
        data = JSON.parse(e.postData.contents);
      } catch (parseErr) {
        data = e.parameter || {};
      }
    } else if (e && e.parameter) {
      data = e.parameter;
    }

    var nowKST = Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy-MM-dd HH:mm:ss");

    // 2. [Case A] 단일 또는 다중 문장 탭 데이터 (Sentence Tap Frequency & Average)
    if (data.Type === 'sentence_tap' || data.type === 'sentence_tap' || data.Sentence || data.sentence || data.sentences || data.records) {
      var sentenceSheet = doc.getSheetByName("Sentence_Taps");
      if (!sentenceSheet) {
        sentenceSheet = doc.insertSheet("Sentence_Taps");
      }

      // 헤더 검사 및 자동 추가
      if (sentenceSheet.getLastRow() === 0) {
        sentenceSheet.appendRow([
          "Timestamp",
          "Sentence",
          "Tap_frequency",
          "Average",
          "Word",
          "Translation"
        ]);
        var sHeaderRange = sentenceSheet.getRange(1, 1, 1, 6);
        sHeaderRange.setFontWeight("bold");
        sHeaderRange.setBackground("#0f766e");
        sHeaderRange.setFontColor("#f0fdfa");
        sHeaderRange.setHorizontalAlignment("center");
        sentenceSheet.setFrozenRows(1);
      }

      // 다중 문장 일괄 저장
      var list = data.records || data.sentences || [data];
      var rowsToAppend = [];

      for (var i = 0; i < list.length; i++) {
        var item = list[i];
        var sText = item.Sentence || item.sentence || "";
        if (!sText) continue;

        var sTap = Number(item.Tap_frequency !== undefined ? item.Tap_frequency : (item.tap_frequency !== undefined ? item.tap_frequency : (item.tapCount || item.Tap_count || 1)));
        var sAvg = Number(item.Average !== undefined ? item.Average : (item.average !== undefined ? item.average : (item.averageTaps || 0)));
        var sWord = item.Word || item.word || "";
        var sTrans = item.Translation || item.translation || "";
        var sTime = item.Timestamp || item.timestamp || nowKST;

        rowsToAppend.push([sTime, sText, sTap, sAvg, sWord, sTrans]);
      }

      if (rowsToAppend.length > 0) {
        for (var r = 0; r < rowsToAppend.length; r++) {
          sentenceSheet.appendRow(rowsToAppend[r]);
        }
      }

      var resObjA = {
        result: "success",
        type: "sentence_tap",
        message: "문장별 탭 빈도 및 평균이 구글 시트에 성공적으로 저장되었습니다.",
        appendedCount: rowsToAppend.length
      };

      return ContentService.createTextOutput(JSON.stringify(resObjA)).setMimeType(ContentService.MimeType.JSON);
    }

    // 3. [Case B] 일반 플레이 통계 데이터 (Play_count, Character_level 등)
    var statsSheet = doc.getSheetByName("Stats") || doc.getActiveSheet();

    // 1행 헤더 확인 및 추가
    if (statsSheet.getLastRow() === 0) {
      statsSheet.appendRow([
        "Timestamp",
        "Play_count",
        "Character_level",
        "Gold_count",
        "Word_count",
        "Clear_count"
      ]);
      var headerRange = statsSheet.getRange(1, 1, 1, 6);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#334155");
      headerRange.setFontColor("#f8fafc");
      headerRange.setHorizontalAlignment("center");
      statsSheet.setFrozenRows(1);
    }

    var timestamp = data.Timestamp || data.timestamp || nowKST;
    var playCount = Number(data.Play_count !== undefined ? data.Play_count : (data.play_count !== undefined ? data.play_count : 0));
    var characterLevel = Number(data.Character_level !== undefined ? data.Character_level : (data.character_level !== undefined ? data.character_level : 1));
    var goldCount = Number(data.Gold_count !== undefined ? data.Gold_count : (data.gold_count !== undefined ? data.gold_count : 0));
    var wordCount = Number(data.Word_count !== undefined ? data.Word_count : (data.word_count !== undefined ? data.word_count : 0));
    var clearCount = Number(data.Clear_count !== undefined ? data.Clear_count : (data.clear_count !== undefined ? data.clear_count : 0));

    statsSheet.appendRow([
      timestamp,
      playCount,
      characterLevel,
      goldCount,
      wordCount,
      clearCount
    ]);

    var responseObj = {
      result: "success",
      type: "stats",
      message: "통계 데이터가 구글 시트에 성공적으로 기록되었습니다.",
      row: statsSheet.getLastRow(),
      recorded: {
        Timestamp: timestamp,
        Play_count: playCount,
        Character_level: characterLevel,
        Gold_count: goldCount,
        Word_count: wordCount,
        Clear_count: clearCount
      }
    };

    return ContentService.createTextOutput(JSON.stringify(responseObj)).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: "error", message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);

  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  if (e && e.parameter) {
    if (e.parameter.Sentence || e.parameter.sentence || e.parameter.Play_count !== undefined || e.parameter.play_count !== undefined) {
      return doPost(e);
    }
  }

  var info = {
    status: "online",
    service: "워드 던전 (Word Dungeon) 구글 시트 연동 API",
    features: [
      "플레이 통계 기록 (Timestamp, Play_count, Character_level, Gold_count, Word_count, Clear_count)",
      "각 문장별 탭 빈도 및 평균 저장 (Timestamp, Sentence, Tap_frequency, Average, Word, Translation)"
    ]
  };

  return ContentService.createTextOutput(JSON.stringify(info, null, 2)).setMimeType(ContentService.MimeType.JSON);
}`;

/**
 * Get saved Google Apps Script Web App URL, defaulting to NEXT_PUBLIC_GOOGLE_SCRIPT_URL
 */
export function getSavedGoogleSheetUrl(): string {
  try {
    const saved = localStorage.getItem(GS_URL_KEY);
    if (saved && saved.trim()) return saved.trim();
  } catch {
    // ignore
  }
  return DEFAULT_WEB_APP_URL;
}

/**
 * Save Google Apps Script Web App URL
 */
export function setSavedGoogleSheetUrl(url: string): void {
  try {
    localStorage.setItem(GS_URL_KEY, url.trim());
  } catch {
    // ignore
  }
}

/**
 * Check if Auto-Sync on Game Over / Game Clear is enabled
 */
export function isAutoSyncEnabled(): boolean {
  try {
    const val = localStorage.getItem(GS_AUTO_SYNC_KEY);
    return val === null ? true : val === 'true';
  } catch {
    return true;
  }
}

/**
 * Set Auto-Sync toggle
 */
export function setAutoSyncEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(GS_AUTO_SYNC_KEY, enabled ? 'true' : 'false');
  } catch {
    // ignore
  }
}

/**
 * Get recent sync history
 */
export function getSyncHistory(): SyncHistoryItem[] {
  try {
    const raw = localStorage.getItem(GS_HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Append to recent sync history
 */
export function recordSyncHistory(item: Omit<SyncHistoryItem, 'id'>): void {
  try {
    const history = getSyncHistory();
    const newItem: SyncHistoryItem = {
      ...item,
      id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    };
    const updated = [newItem, ...history].slice(0, 15);
    localStorage.setItem(GS_HISTORY_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
}

/**
 * Format current date to KST readable string
 */
export function formatKSTTimestamp(d = new Date()): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const year = d.getFullYear();
  const month = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  const seconds = pad(d.getSeconds());
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * Generate standard 6-column sync payload
 */
export function createSyncPayload(stats: PlayerStats): GoogleSheetSyncPayload {
  const equippedAvatarLevel = stats.avatars[stats.equippedAvatarId]?.level || 1;
  return {
    Timestamp: formatKSTTimestamp(),
    Play_count: stats.totalGamesPlayed,
    Character_level: equippedAvatarLevel,
    Gold_count: stats.gold,
    Word_count: stats.discoveredWordIds.length,
    Clear_count: stats.totalCleared,
  };
}

/**
 * Sync player stats to Google Sheet via Google Apps Script Web App
 */
export async function syncStatsToGoogleSheet(
  stats: PlayerStats,
  customUrl?: string
): Promise<{ success: boolean; message: string; payload: GoogleSheetSyncPayload }> {
  const targetUrl = (customUrl !== undefined ? customUrl : getSavedGoogleSheetUrl()).trim();
  const payload = createSyncPayload(stats);

  if (!targetUrl) {
    const msg = '구글 시트 연동 URL이 설정되지 않았습니다.';
    return { success: false, message: msg, payload };
  }

  try {
    await fetch(targetUrl, {
      method: 'POST',
      mode: 'no-cors',
      cache: 'no-cache',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const successMsg = `구글 시트에 플레이 통계가 성공적으로 기록되었습니다!`;
    recordSyncHistory({
      timestamp: payload.Timestamp,
      success: true,
      message: successMsg,
      payload,
    });

    return { success: true, message: successMsg, payload };
  } catch (err: any) {
    // Fallback GET
    try {
      const urlObj = new URL(targetUrl);
      urlObj.searchParams.set('Timestamp', payload.Timestamp);
      urlObj.searchParams.set('Play_count', String(payload.Play_count));
      urlObj.searchParams.set('Character_level', String(payload.Character_level));
      urlObj.searchParams.set('Gold_count', String(payload.Gold_count));
      urlObj.searchParams.set('Word_count', String(payload.Word_count));
      urlObj.searchParams.set('Clear_count', String(payload.Clear_count));

      await fetch(urlObj.toString(), {
        method: 'GET',
        mode: 'no-cors',
        cache: 'no-cache',
      });

      const successMsg = `구글 시트에 플레이 통계가 성공적으로 전송되었습니다 (GET)!`;
      recordSyncHistory({
        timestamp: payload.Timestamp,
        success: true,
        message: successMsg,
        payload,
      });

      return { success: true, message: successMsg, payload };
    } catch (fallbackErr: any) {
      const errorMsg = `구글 시트 전송 중 오류 발생: ${err?.message || fallbackErr?.message || '네트워크 오류'}`;
      recordSyncHistory({
        timestamp: payload.Timestamp,
        success: false,
        message: errorMsg,
        payload,
      });

      return { success: false, message: errorMsg, payload };
    }
  }
}

/**
 * Save single sentence tap frequency & average to Google Sheets using NEXT_PUBLIC_GOOGLE_SCRIPT_URL
 */
export async function syncSentenceTapToGoogleSheet(params: {
  sentence: string;
  tapFrequency: number;
  averageTaps: number;
  word?: string;
  translation?: string;
  customUrl?: string;
}): Promise<{ success: boolean; message: string }> {
  const targetUrl = (params.customUrl !== undefined ? params.customUrl : getSavedGoogleSheetUrl()).trim();
  const timestamp = formatKSTTimestamp();

  if (!targetUrl) {
    return { success: false, message: 'Google Script URL이 설정되지 않았습니다.' };
  }

  const payload: SentenceTapSyncPayload = {
    Timestamp: timestamp,
    Sentence: params.sentence,
    Tap_frequency: params.tapFrequency,
    Average: params.averageTaps,
    Word: params.word || '',
    Translation: params.translation || '',
    Type: 'sentence_tap',
  };

  try {
    await fetch(targetUrl, {
      method: 'POST',
      mode: 'no-cors',
      cache: 'no-cache',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    return {
      success: true,
      message: `"${params.sentence.slice(0, 20)}..." 탭 빈도(${params.tapFrequency}회, 평균 ${params.averageTaps}회)가 구글 시트에 저장되었습니다.`,
    };
  } catch (err: any) {
    // Fallback GET
    try {
      const urlObj = new URL(targetUrl);
      urlObj.searchParams.set('Type', 'sentence_tap');
      urlObj.searchParams.set('Timestamp', timestamp);
      urlObj.searchParams.set('Sentence', params.sentence);
      urlObj.searchParams.set('Tap_frequency', String(params.tapFrequency));
      urlObj.searchParams.set('Average', String(params.averageTaps));
      if (params.word) urlObj.searchParams.set('Word', params.word);
      if (params.translation) urlObj.searchParams.set('Translation', params.translation);

      await fetch(urlObj.toString(), {
        method: 'GET',
        mode: 'no-cors',
        cache: 'no-cache',
      });

      return {
        success: true,
        message: `문장 탭 빈도가 구글 시트에 저장되었습니다 (GET).`,
      };
    } catch (fallbackErr: any) {
      return {
        success: false,
        message: `구글 시트 저장 실패: ${err?.message || fallbackErr?.message || '네트워크 오류'}`,
      };
    }
  }
}

/**
 * Batch sync all sentence tap frequencies and averages to Google Sheets
 */
export async function syncBatchSentenceTapsToGoogleSheet(
  records: Array<{
    sentence: string;
    tapCount: number;
    word?: string;
    translation?: string;
  }>,
  averageTaps: number,
  customUrl?: string
): Promise<{ success: boolean; message: string }> {
  const targetUrl = (customUrl !== undefined ? customUrl : getSavedGoogleSheetUrl()).trim();
  const timestamp = formatKSTTimestamp();

  if (!targetUrl) {
    return { success: false, message: 'Google Script URL이 설정되지 않았습니다.' };
  }

  const payload = {
    Type: 'sentence_tap',
    Timestamp: timestamp,
    records: records.map((r) => ({
      Timestamp: timestamp,
      Sentence: r.sentence,
      Tap_frequency: r.tapCount,
      Average: averageTaps,
      Word: r.word || '',
      Translation: r.translation || '',
    })),
  };

  try {
    await fetch(targetUrl, {
      method: 'POST',
      mode: 'no-cors',
      cache: 'no-cache',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    return {
      success: true,
      message: `${records.length}개 문장의 탭 빈도 및 평균(${averageTaps}회)이 구글 시트에 성공적으로 동기화되었습니다.`,
    };
  } catch (err: any) {
    return {
      success: false,
      message: `일괄 저장 실패: ${err?.message || '네트워크 오류'}`,
    };
  }
}
