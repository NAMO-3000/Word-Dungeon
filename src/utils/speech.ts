/**
 * Native Text-To-Speech (TTS) pronunciation helper using Web Speech API
 */
export function speakWord(text: string): Promise<void> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      resolve();
      return;
    }

    try {
      window.speechSynthesis.cancel(); // Stop any pending speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US';
      utterance.rate = 0.88; // Slightly slower for middle school learners
      utterance.pitch = 1.0;

      // Try selecting an English voice if available
      const voices = window.speechSynthesis.getVoices();
      const usVoice = voices.find(
        (v) => v.lang === 'en-US' || v.lang.startsWith('en')
      );
      if (usVoice) {
        utterance.voice = usVoice;
      }

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();

      window.speechSynthesis.speak(utterance);
    } catch {
      resolve();
    }
  });
}
