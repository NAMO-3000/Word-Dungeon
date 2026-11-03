/**
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
}
